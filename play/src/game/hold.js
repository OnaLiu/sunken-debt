// 货舱那一堆：船员放下舱的每件东西都躺在舱口里，越堆越高，从大视野也看得见这一趟带回了多少；
// 珍贵的那件时不时反一下光。再来一次时整条船换新，舱也是空的。
// 纯表现：不参与任何结算，件数和堆多高都不影响操作。
import * as THREE from 'three';
import { BOAT } from './boat.js';
import { RNG } from '../core/rng.js';

const HALF = 0.72;                 // 舱口内沿（围板内侧 0.825，留一点边）
const CELL = 0.12;
const N = Math.round(HALF * 2 / CELL);
const FLOOR = BOAT.deckY + 0.05;   // 舱底（深色舱板）上沿
const MAX_BASE = 0.36;             // 堆满以后新放的东西就陷在堆顶（不高出围板太多）
const KEEP = 40;                   // 舱里最多摆这么多件，再多就把最早的普通货挪到看不见的下层

// 物件形状的小高度图：在每个三角形上撒几个点，按半格归并，记每处最高多高（[x, z, 高, …]，局部坐标）
const _fpCache = new WeakMap();
function footprint(geo) {
  let fp = _fpCache.get(geo);
  if (fp) return fp;
  const p = geo.attributes.position, bins = new Map(), q = CELL * 0.5;
  const B = [[1, 0], [0, 1], [0, 0], [0.5, 0.5], [0.5, 0], [0, 0.5], [0.33, 0.33], [0.75, 0.25], [0.25, 0.75], [0.25, 0], [0.75, 0], [0, 0.25], [0, 0.75]];
  for (let t = 0; t < p.count; t += 3) {
    for (const [u, v] of B) {
      const w = 1 - u - v;
      const x = p.getX(t) * u + p.getX(t + 1) * v + p.getX(t + 2) * w, y = p.getY(t) * u + p.getY(t + 1) * v + p.getY(t + 2) * w, z = p.getZ(t) * u + p.getZ(t + 1) * v + p.getZ(t + 2) * w;
      const key = Math.round(x / q) + ',' + Math.round(z / q);
      const o = bins.get(key);
      if (!o) bins.set(key, [Math.round(x / q) * q, Math.round(z / q) * q, y]); else if (y > o[2]) o[2] = y;
    }
  }
  fp = new Float32Array(bins.size * 3);
  let k = 0;
  for (const o of bins.values()) { fp[k++] = o[0]; fp[k++] = o[1]; fp[k++] = Math.max(0.02, o[2]); }
  _fpCache.set(geo, fp);
  return fp;
}
function hashId(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }

export class Hold {
  constructor(boat) {
    this.boat = boat;
    this.h = new Float32Array(N * N);
    this.items = [];          // { id, mesh, precious, value }
    this.glintT = 1.5;
    this._v = new THREE.Vector3();
    // 进舱那一下（B21）：舱口围板顶上一圈暖光（方框，和围板一样大），闪一下往外扩着淡掉
    const rimMat = new THREE.MeshBasicMaterial({ color: 0xffe0a8, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
    this.rim = new THREE.Mesh(new THREE.RingGeometry(0.8 * Math.SQRT2, 1.0 * Math.SQRT2, 4, 1, Math.PI / 4), rimMat);
    this.rim.rotation.x = -Math.PI / 2;
    this.rim.position.set(BOAT.hatchLocal.x, BOAT.deckY + 0.535, BOAT.hatchLocal.z);
    this.rim.visible = false; this.rim.renderOrder = 2;
    boat.deck.add(this.rim);
    this.fl = null;
  }
  // 东西放进舱：delay 秒后舱口闪一圈暖光、舱里升起几点光、溅起一点水（珍贵的那件是金色的）
  flash(mesh, o = {}) {
    this.fl = { t: -(o.delay || 0), mesh, mass: o.mass ?? 0.4, precious: !!o.precious, fired: false };
  }
  updateFlash(dt, g) {
    const f = this.fl;
    if (!f) return;
    f.t += dt;
    if (f.t < 0) return;
    const P = g.particles;
    if (!f.fired && P) {
      f.fired = true;
      this.rim.material.color.set(f.precious ? 0xffc458 : 0xffe0a8);
      const p = this._v.setFromMatrixPosition(f.mesh.matrixWorld);
      const top = BOAT.deckY + 0.5;
      const w = new THREE.Vector3(BOAT.hatchLocal.x, top, BOAT.hatchLocal.z); this.boat.deck.localToWorld(w);
      // 舱里升起的光点：从放下的地方往上飘，出了舱口慢慢灭
      const n = f.precious ? 16 : 8 + Math.round(f.mass * 6);
      for (let i = 0; i < n; i++) {
        const sx = (Math.random() - 0.5) * 1.2, sz = (Math.random() - 0.5) * 1.2;
        P.spark.emit(w.x + sx, p.y + Math.random() * 0.3, w.z + sz, sx * 0.25, 0.7 + Math.random() * 0.7, sz * 0.25, 0.8 + Math.random() * 0.5, 0.07 + Math.random() * 0.05,
          1.0, f.precious ? 0.78 : 0.86, f.precious ? 0.38 : 0.6, 0.9, -0.3, 1.2, -0.15);
      }
      // 放到堆上溅起的水：往四边溅，比搬运那几滴大，从大视野也看得见
      for (let i = 0; i < 12; i++) {
        const a = Math.random() * 6.28, sp = 0.6 + Math.random() * 0.9;
        P.water.emit(p.x, p.y + 0.08, p.z, Math.cos(a) * sp, 1.4 + Math.random() * 1.2, Math.sin(a) * sp, 0.55 + Math.random() * 0.25, 0.09 + Math.random() * 0.05, 0.7, 0.68, 0.58, 0.85, 0, 0.3, 7);
      }
    }
    const u = f.t, D = 0.75;
    const a = u < 0.05 ? u / 0.05 : Math.pow(Math.max(0, 1 - (u - 0.05) / (D - 0.05)), 1.6);
    this.rim.visible = true;
    this.rim.material.opacity = a * (f.precious ? 1.0 : 0.85);
    this.rim.scale.setScalar(1 + 0.14 * (1 - Math.pow(1 - Math.min(1, u / D), 3)));
    if (u >= D) { this.rim.visible = false; this.fl = null; }
  }
  get count() { return this.items.length; }
  // 给下一件找位置：按它真实的形状（从几何上采出来的一张小高度图，锚的两爪之间是空的）找最低、略靠中间的地方，
  // 先铺满舱底再往上堆。立刻占住，两个船员同时放也不会叠在一处。geo：物件几何（底面在 y=0）
  reserve(id, geo) {
    const rng = new RNG(hashId(id) ^ (this.items.length * 2654435761));
    if (!geo.boundingBox) geo.computeBoundingBox();
    const box = geo.boundingBox;
    const hx = Math.max(0.04, Math.max(-box.min.x, box.max.x)), hz = Math.max(0.04, Math.max(-box.min.z, box.max.z));
    const yaws = [0, Math.PI / 2, Math.PI / 4, -Math.PI / 4].map((y) => y + (rng.next() - 0.5) * 0.3);
    const fp = footprint(geo);
    let best = null;
    for (const yaw of yaws) {
      const c = Math.abs(Math.cos(yaw)), sn = Math.abs(Math.sin(yaw));
      const ax = hx * c + hz * sn, az = hx * sn + hz * c;              // 转过以后（以网格原点为心）的半宽
      const s = Math.min(1, (HALF - 0.02) / Math.max(ax, az));         // 太长的（锚）缩一点才放得进
      for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
        const px = -HALF + (i + 0.5) * CELL, pz = -HALF + (j + 0.5) * CELL;
        if (Math.abs(px) + ax * s > HALF + 1e-6 || Math.abs(pz) + az * s > HALF + 1e-6) continue;
        const base = this.scan(fp, px, pz, yaw, s, -1);
        const score = base * 1.6 + 0.1 * Math.hypot(px, pz) / HALF + (1 - s) * 0.5 + rng.next() * 0.03;
        if (!best || score < best.score) best = { score, px, pz, yaw, s, base };
      }
    }
    if (!best) best = { px: 0, pz: 0, yaw: 0, s: Math.min(1, (HALF - 0.02) / Math.max(hx, hz)), base: 0 };
    const base = Math.min(MAX_BASE, best.base);
    this.scan(fp, best.px, best.pz, best.yaw, best.s, base);
    return { x: BOAT.hatchLocal.x + best.px, y: FLOOR + base, z: BOAT.hatchLocal.z + best.pz, yaw: best.yaw, s: best.s };
  }
  // 物件的格子转过去以后盖住舱底哪些格：put < 0 时返回其中最高的高度（它会搁在上面）；否则把这些格垫到 put + 自身高度
  scan(fp, px, pz, yaw, s, put) {
    const c = Math.cos(yaw), sn = Math.sin(yaw);
    let m = 0;
    for (let k = 0; k < fp.length; k += 3) {
      const lx = fp[k] * s, lz = fp[k + 1] * s;
      const x = px + lx * c + lz * sn, z = pz - lx * sn + lz * c;
      const i = Math.floor((x + HALF) / CELL), j = Math.floor((z + HALF) / CELL);
      if (i < 0 || j < 0 || i >= N || j >= N) continue;
      const q = i * N + j;
      if (put < 0) m = Math.max(m, this.h[q]); else this.h[q] = Math.max(this.h[q], put + fp[k + 2] * s);
    }
    return m;
  }
  // 船员把东西放进舱：网格已经在甲板局部坐标里摆到 reserve 给的位置
  put(mesh, info) {
    mesh.visible = true;
    if (mesh.parent !== this.boat.deck) { if (mesh.parent) mesh.parent.remove(mesh); this.boat.deck.add(mesh); }
    this.items.push({ id: info.id, mesh, precious: !!info.precious, value: info.value || 0, mass: info.mass || null });
    if (this.items.length > KEEP) {
      const i = this.items.findIndex((x) => !x.precious);
      const gone = this.items.splice(i < 0 ? 0 : i, 1)[0];
      this.drop(gone);
    }
  }
  drop(x) {
    if (!x) return;
    if (x.mesh.parent) x.mesh.parent.remove(x.mesh);
    x.mesh.traverse((o) => { if (o.isMesh && o.geometry) o.geometry.dispose(); });
  }

  update(dt, g) {
    this.updateFlash(dt, g);
    // 珍贵的那件偶尔反一下光（大视野里也能看出“舱里有好东西”）
    this.glintT -= dt;
    if (this.glintT <= 0) {
      this.glintT = 1.4 + Math.random() * 1.4;
      const ps = this.items.filter((x) => x.precious);
      if (ps.length && g.particles) {
        const x = ps[Math.floor(Math.random() * ps.length)];
        const p = this._v.setFromMatrixPosition(x.mesh.matrixWorld);
        for (let k = 0; k < 2; k++) g.particles.spark.emit(p.x + (Math.random() - 0.5) * 0.2, p.y + 0.18, p.z + (Math.random() - 0.5) * 0.2, 0, 0.35, 0, 0.7 + Math.random() * 0.4, 0.06 + Math.random() * 0.04, 1.0, 0.86, 0.5, 1, 0, 1.5, 0);
      }
    }
  }
}

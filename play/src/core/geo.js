// 代码造型工具：所有模型由基础体拼装，带顶点色，输出非索引几何（低多边形面片感）
import * as THREE from 'three';

const _c = new THREE.Color();
const _v = new THREE.Vector3();
const _m = new THREE.Matrix4();
const _q = new THREE.Quaternion();
const _e = new THREE.Euler();
const _s = new THREE.Vector3();

export function col(hex) { return new THREE.Color(hex); }

// 变换矩阵：位置、欧拉角、缩放
export function M(x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = sx, sz = sx, order = 'YXZ') {
  _e.set(rx, ry, rz, order);
  _q.setFromEuler(_e);
  _s.set(sx, sy, sz);
  return new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), _q, _s);
}

// 顶点数据放在可增长的 Float32Array 里（不用大 JS 数组：分帧生成时它们要跨好几帧存活，会让垃圾回收停顿变长）
export class Builder {
  constructor() { this.pos = new Float32Array(3 * 96); this.colr = new Float32Array(3 * 96); this.n = 0; }
  grow(more) {
    const need = (this.n + more) * 3;
    if (need <= this.pos.length) return;
    let cap = this.pos.length * 2;
    while (cap < need) cap *= 2;
    const p = new Float32Array(cap); p.set(this.pos.subarray(0, this.n * 3)); this.pos = p;
    const c = new Float32Array(cap); c.set(this.colr.subarray(0, this.n * 3)); this.colr = c;
  }
  put(x, y, z, r, g, b) { const o = this.n * 3; this.pos[o] = x; this.pos[o + 1] = y; this.pos[o + 2] = z; this.colr[o] = r; this.colr[o + 1] = g; this.colr[o + 2] = b; this.n++; }
  // geom: THREE.BufferGeometry；color: hex/Color/函数(x,y,z,i)→Color；m: Matrix4
  add(geom, color, m, jitter = 0, rng = null) {
    const g = geom.index ? geom.toNonIndexed() : geom;
    const p = g.attributes.position;
    const own = color == null && g.attributes.color ? g.attributes.color : null;
    const fn = typeof color === 'function';
    const base = fn || own ? null : (color instanceof THREE.Color ? color : _c.set(color == null ? 0xffffff : color).clone());
    this.grow(p.count);
    for (let i = 0; i < p.count; i += 3) {
      let fr = 1;
      if (jitter > 0) fr = 1 + ((rng ? rng.next() : Math.random()) - 0.5) * jitter;
      for (let k = 0; k < 3; k++) {
        _v.fromBufferAttribute(p, i + k);
        if (m) _v.applyMatrix4(m);
        if (own) { this.put(_v.x, _v.y, _v.z, own.getX(i + k) * fr, own.getY(i + k) * fr, own.getZ(i + k) * fr); continue; }
        const c = fn ? color(_v.x, _v.y, _v.z, i) : base;
        this.put(_v.x, _v.y, _v.z, c.r * fr, c.g * fr, c.b * fr);
      }
    }
    if (g !== geom) g.dispose();
    return this;
  }
  // 直接加三角形（世界坐标），颜色 Color
  tri(a, b, c, color) {
    this.grow(3);
    this.put(a.x, a.y, a.z, color.r, color.g, color.b);
    this.put(b.x, b.y, b.z, color.r, color.g, color.b);
    this.put(c.x, c.y, c.z, color.r, color.g, color.b);
  }
  quad(a, b, c, d, color, color2) {
    this.tri(a, b, c, color);
    this.tri(a, c, d, color2 || color);
  }
  get count() { return this.n; }
  build(smoothNormals = false) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(this.pos.slice(0, this.n * 3), 3));
    g.setAttribute('color', new THREE.BufferAttribute(this.colr.slice(0, this.n * 3), 3));
    g.computeVertexNormals();
    g.computeBoundingSphere();
    g.computeBoundingBox();
    return g;
  }
}

export const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
export const cyl = (rt, rb, h, seg = 8, open = false) => new THREE.CylinderGeometry(rt, rb, h, seg, 1, open);
export const sph = (r, ws = 8, hs = 6) => new THREE.SphereGeometry(r, ws, hs);
export const ico = (r, d = 1) => new THREE.IcosahedronGeometry(r, d);
export const tor = (r, t, rs = 6, ts = 12, arc = Math.PI * 2) => new THREE.TorusGeometry(r, t, rs, ts, arc);
export const cone = (r, h, seg = 8) => new THREE.ConeGeometry(r, h, seg);
// 旋转体：pts = [[r,y],...]
export function lathe(pts, seg = 12) {
  return new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(Math.max(r, 0.0001), y)), seg);
}
// 沿点列的方截面管（缆绳、桅索、肋骨）
export function tube(points, radius = 0.05, radial = 4, closed = false) {
  const curve = new THREE.CatmullRomCurve3(points.map((p) => (p.isVector3 ? p : new THREE.Vector3(p[0], p[1], p[2]))), closed);
  return new THREE.TubeGeometry(curve, Math.max(2, points.length * 3), radius, radial, closed);
}
// 两点之间的细杆
export function rod(a, b, r = 0.04, seg = 4) {
  const A = a.isVector3 ? a : new THREE.Vector3(...a);
  const B = b.isVector3 ? b : new THREE.Vector3(...b);
  const L = A.distanceTo(B);
  const g = new THREE.CylinderGeometry(r, r, L, seg, 1, true);
  const mid = A.clone().add(B).multiplyScalar(0.5);
  const dir = B.clone().sub(A).normalize();
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
  g.applyMatrix4(new THREE.Matrix4().compose(mid, q, new THREE.Vector3(1, 1, 1)));
  return g;
}
// 噪声扰动的石块
export function rock(r, rng, detail = 1, squash = 0.7) {
  const g = new THREE.IcosahedronGeometry(r, detail);
  const p = g.attributes.position;
  const seedA = rng.next() * 10, seedB = rng.next() * 10;
  for (let i = 0; i < p.count; i++) {
    _v.fromBufferAttribute(p, i);
    const n = Math.sin(_v.x * 3.1 + seedA) * Math.cos(_v.z * 2.7 + seedB) * 0.18 + Math.sin(_v.y * 4.3 + seedA * 2) * 0.1;
    _v.multiplyScalar(1 + n);
    _v.y *= squash;
    p.setXYZ(i, _v.x, _v.y, _v.z);
  }
  return g;
}
export function shade(c, f) { return new THREE.Color(c.r * f, c.g * f, c.b * f); }
export function mix(a, b, t) { return new THREE.Color().copy(a).lerp(b, t); }

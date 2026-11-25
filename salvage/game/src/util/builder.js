import * as THREE from 'three';

// 低多边形几何拼装：每个面平面法线、顶点色。适合像素风的硬朗面。
export class GeoBuilder {
  constructor() {
    this.pos = [];
    this.nor = [];
    this.col = [];
    this.idx = [];
    this.n = 0;
  }

  _v(p, nx, ny, nz, c) {
    this.pos.push(p.x, p.y, p.z);
    this.nor.push(nx, ny, nz);
    this.col.push(c.r, c.g, c.b);
    return this.n++;
  }

  // 四边形 a b c d（逆时针为正面）
  quad(a, b, c, d, color) {
    const ux = b.x - a.x, uy = b.y - a.y, uz = b.z - a.z;
    const vx = d.x - a.x, vy = d.y - a.y, vz = d.z - a.z;
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    const l = Math.hypot(nx, ny, nz) || 1;
    nx /= l; ny /= l; nz /= l;
    const i0 = this._v(a, nx, ny, nz, color);
    const i1 = this._v(b, nx, ny, nz, color);
    const i2 = this._v(c, nx, ny, nz, color);
    const i3 = this._v(d, nx, ny, nz, color);
    this.idx.push(i0, i1, i2, i0, i2, i3);
    return [nx, ny, nz];
  }

  tri(a, b, c, color) {
    const ux = b.x - a.x, uy = b.y - a.y, uz = b.z - a.z;
    const vx = c.x - a.x, vy = c.y - a.y, vz = c.z - a.z;
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    const l = Math.hypot(nx, ny, nz) || 1;
    nx /= l; ny /= l; nz /= l;
    const i0 = this._v(a, nx, ny, nz, color);
    const i1 = this._v(b, nx, ny, nz, color);
    const i2 = this._v(c, nx, ny, nz, color);
    this.idx.push(i0, i1, i2);
  }

  // 由中心和三个半轴向量定义的盒子
  box(c, ax, ay, az, color) {
    const P = (sx, sy, sz) => new THREE.Vector3(
      c.x + ax.x * sx + ay.x * sy + az.x * sz,
      c.y + ax.y * sx + ay.y * sy + az.y * sz,
      c.z + ax.z * sx + ay.z * sy + az.z * sz,
    );
    const p000 = P(-1, -1, -1), p100 = P(1, -1, -1), p010 = P(-1, 1, -1), p110 = P(1, 1, -1);
    const p001 = P(-1, -1, 1), p101 = P(1, -1, 1), p011 = P(-1, 1, 1), p111 = P(1, 1, 1);
    // 让每个面朝外：检查行列式符号
    const flip = ax.clone().cross(ay).dot(az) < 0;
    const q = (a, b, cc, d) => (flip ? this.quad(d, cc, b, a, color) : this.quad(a, b, cc, d, color));
    q(p001, p101, p111, p011); // +z
    q(p100, p000, p010, p110); // -z
    q(p101, p100, p110, p111); // +x
    q(p000, p001, p011, p010); // -x
    q(p011, p111, p110, p010); // +y
    q(p000, p100, p101, p001); // -y
  }

  // 两点之间的方木；up 决定截面朝向
  beam(p0, p1, up, w, h, color) {
    const dir = p1.clone().sub(p0);
    const len = dir.length();
    if (len < 1e-5) return;
    dir.divideScalar(len);
    let side = dir.clone().cross(up);
    if (side.lengthSq() < 1e-6) side = dir.clone().cross(new THREE.Vector3(1, 0, 0));
    side.normalize();
    const u = side.clone().cross(dir).normalize();
    const c = p0.clone().add(p1).multiplyScalar(0.5);
    this.box(c, dir.multiplyScalar(len / 2), u.multiplyScalar(h / 2), side.multiplyScalar(w / 2), color);
  }

  // 圆柱（低段数）
  cylinder(p0, p1, r0, r1, segs, color, capTop = true, jag = null) {
    const dir = p1.clone().sub(p0);
    const len = dir.length();
    dir.normalize();
    let a = new THREE.Vector3(0, 1, 0);
    if (Math.abs(dir.dot(a)) > 0.9) a.set(1, 0, 0);
    const u = a.clone().cross(dir).normalize();
    const v = dir.clone().cross(u).normalize();
    const ring0 = [], ring1 = [];
    for (let i = 0; i < segs; i++) {
      const t = (i / segs) * Math.PI * 2;
      const cs = Math.cos(t), sn = Math.sin(t);
      ring0.push(p0.clone().addScaledVector(u, cs * r0).addScaledVector(v, sn * r0));
      const extra = jag ? jag(i) : 0;
      ring1.push(p0.clone().addScaledVector(dir, len + extra).addScaledVector(u, cs * r1).addScaledVector(v, sn * r1));
    }
    for (let i = 0; i < segs; i++) {
      const j = (i + 1) % segs;
      this.quad(ring0[i], ring0[j], ring1[j], ring1[i], color);
    }
    if (capTop) {
      const ct = p1.clone().addScaledVector(dir, jag ? 0.0 : 0);
      for (let i = 0; i < segs; i++) {
        const j = (i + 1) % segs;
        this.tri(ring1[i], ring1[j], ct, color);
      }
    }
  }

  build() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.nor, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.col, 3));
    g.setIndex(this.idx);
    g.computeBoundingSphere();
    return g;
  }

  get empty() {
    return this.n === 0;
  }
}

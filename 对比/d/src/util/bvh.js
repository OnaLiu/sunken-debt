import * as THREE from 'three';

// 不会动的网格（沉船、倒在海底的断桅和残帆）的射线加速：三角形按包围盒分成一棵树，射线只进它穿过的那几个盒子。
// THREE.Raycaster 对一个网格是把每个三角形都试一遍，沉船几万个三角形，一条视线几毫秒；这里同一条线只要零点零几毫秒。
// 结果和 THREE.Raycaster 一样：按材质的正反面（FrontSide 不算背面、BackSide 只算背面、DoubleSide 都算）。
// 树建在网格自己的坐标里，查的时候把射线换到网格坐标（网格挪了、转了也照样对）

const LEAF = 6;
const _inv = new THREE.Matrix4();
const _o = new THREE.Vector3();
const _d = new THREE.Vector3();
const _p = new THREE.Vector3();

export class MeshBVH {
  constructor(mesh) {
    this.mesh = mesh;
    const geo = mesh.geometry;
    const pos = geo.attributes.position;
    const idx = geo.index;
    const n = idx ? idx.count / 3 : pos.count / 3;
    const tri = (this.tri = new Float32Array(n * 9));
    for (let t = 0; t < n; t++) {
      for (let k = 0; k < 3; k++) {
        const v = idx ? idx.getX(t * 3 + k) : t * 3 + k;
        tri[t * 9 + k * 3] = pos.getX(v);
        tri[t * 9 + k * 3 + 1] = pos.getY(v);
        tri[t * 9 + k * 3 + 2] = pos.getZ(v);
      }
    }
    // 每个三角形的中心、包围盒
    const cen = new Float32Array(n * 3);
    const box = new Float32Array(n * 6);
    for (let t = 0; t < n; t++) {
      for (let a = 0; a < 3; a++) {
        const x0 = tri[t * 9 + a], x1 = tri[t * 9 + 3 + a], x2 = tri[t * 9 + 6 + a];
        const lo = Math.min(x0, x1, x2), hi = Math.max(x0, x1, x2);
        box[t * 6 + a] = lo;
        box[t * 6 + 3 + a] = hi;
        cen[t * 3 + a] = (lo + hi) / 2;
      }
    }
    const order = new Uint32Array(n);
    for (let i = 0; i < n; i++) order[i] = i;
    // 节点：包围盒 6 个数 + （叶子）起点和个数 / （中间）左右孩子
    const nodes = [];
    const build = (s, e) => {
      let lx = Infinity, ly = Infinity, lz = Infinity, hx = -Infinity, hy = -Infinity, hz = -Infinity;
      let cx0 = Infinity, cy0 = Infinity, cz0 = Infinity, cx1 = -Infinity, cy1 = -Infinity, cz1 = -Infinity;
      for (let i = s; i < e; i++) {
        const t = order[i];
        lx = Math.min(lx, box[t * 6]); ly = Math.min(ly, box[t * 6 + 1]); lz = Math.min(lz, box[t * 6 + 2]);
        hx = Math.max(hx, box[t * 6 + 3]); hy = Math.max(hy, box[t * 6 + 4]); hz = Math.max(hz, box[t * 6 + 5]);
        cx0 = Math.min(cx0, cen[t * 3]); cy0 = Math.min(cy0, cen[t * 3 + 1]); cz0 = Math.min(cz0, cen[t * 3 + 2]);
        cx1 = Math.max(cx1, cen[t * 3]); cy1 = Math.max(cy1, cen[t * 3 + 1]); cz1 = Math.max(cz1, cen[t * 3 + 2]);
      }
      const node = { b: [lx, ly, lz, hx, hy, hz], s, e, l: null, r: null };
      nodes.push(node);
      if (e - s <= LEAF) return node;
      // 按中心最散的那根轴，从中间分开
      const ex = cx1 - cx0, ey = cy1 - cy0, ez = cz1 - cz0;
      const ax = ex >= ey && ex >= ez ? 0 : ey >= ez ? 1 : 2;
      if (Math.max(ex, ey, ez) < 1e-6) return node;
      const sub = Array.from(order.subarray(s, e)).sort((p, q) => cen[p * 3 + ax] - cen[q * 3 + ax]);
      order.set(sub, s);
      const m = (s + e) >> 1;
      node.l = build(s, m);
      node.r = build(m, e);
      return node;
    };
    this.root = n ? build(0, n) : null;
    this.order = order;
  }

  // 射线（世界坐标：起点 o、单位方向 d）在 far 以内有没有打到这个网格（任意一处就算）
  hits(o, d, far) {
    if (!this.root) return false;
    const m = this.mesh;
    _inv.copy(m.matrixWorld).invert();
    _o.copy(o).applyMatrix4(_inv);
    _p.copy(o).addScaledVector(d, far).applyMatrix4(_inv);
    _d.copy(_p).sub(_o);
    const L = _d.length();
    if (L < 1e-9) return false;
    _d.divideScalar(L);
    const side = m.material && m.material.side !== undefined ? m.material.side : THREE.FrontSide;
    const ox = _o.x, oy = _o.y, oz = _o.z, dx = _d.x, dy = _d.y, dz = _d.z;
    const ix = 1 / dx, iy = 1 / dy, iz = 1 / dz;
    const tri = this.tri, order = this.order;
    const stack = [this.root];
    while (stack.length) {
      const nd = stack.pop();
      const b = nd.b;
      // 射线进不进这个盒子（0…L 之间）
      let t0 = 0, t1 = L;
      let ta = (b[0] - ox) * ix, tb = (b[3] - ox) * ix;
      if (ta > tb) { const s = ta; ta = tb; tb = s; }
      t0 = ta > t0 ? ta : t0; t1 = tb < t1 ? tb : t1;
      if (t0 > t1) continue;
      ta = (b[1] - oy) * iy; tb = (b[4] - oy) * iy;
      if (ta > tb) { const s = ta; ta = tb; tb = s; }
      t0 = ta > t0 ? ta : t0; t1 = tb < t1 ? tb : t1;
      if (t0 > t1) continue;
      ta = (b[2] - oz) * iz; tb = (b[5] - oz) * iz;
      if (ta > tb) { const s = ta; ta = tb; tb = s; }
      t0 = ta > t0 ? ta : t0; t1 = tb < t1 ? tb : t1;
      if (t0 > t1) continue;
      if (nd.l) { stack.push(nd.l, nd.r); continue; }
      for (let i = nd.s; i < nd.e; i++) {
        const k = order[i] * 9;
        if (rayTri(ox, oy, oz, dx, dy, dz, tri, k, side, L)) return true;
      }
    }
    return false;
  }
}

// 和 THREE.Ray.intersectTriangle 同一种算法（含正反面的取舍）；BackSide 时 Mesh.raycast 把顶点倒过来、按背面剔除
function rayTri(ox, oy, oz, dx, dy, dz, T, k, side, L) {
  let ax = T[k], ay = T[k + 1], az = T[k + 2];
  let bx = T[k + 3], by = T[k + 4], bz = T[k + 5];
  let cx = T[k + 6], cy = T[k + 7], cz = T[k + 8];
  let cull = side === THREE.FrontSide;
  if (side === THREE.BackSide) { const sx = ax, sy = ay, sz = az; ax = cx; ay = cy; az = cz; cx = sx; cy = sy; cz = sz; cull = true; }
  const e1x = bx - ax, e1y = by - ay, e1z = bz - az;
  const e2x = cx - ax, e2y = cy - ay, e2z = cz - az;
  const nx = e1y * e2z - e1z * e2y, ny = e1z * e2x - e1x * e2z, nz = e1x * e2y - e1y * e2x;
  let DdN = dx * nx + dy * ny + dz * nz;
  let sign;
  if (DdN > 0) { if (cull) return false; sign = 1; }
  else if (DdN < 0) { sign = -1; DdN = -DdN; }
  else return false;
  const qx = ox - ax, qy = oy - ay, qz = oz - az;
  // q × e2（THREE 里是 edge2.crossVectors(diff, edge2)）
  const c2x = qy * e2z - qz * e2y, c2y = qz * e2x - qx * e2z, c2z = qx * e2y - qy * e2x;
  const DdQxE2 = sign * (dx * c2x + dy * c2y + dz * c2z);
  if (DdQxE2 < 0) return false;
  // e1 × q（THREE 里是 edge1.cross(diff)）
  const c1x = e1y * qz - e1z * qy, c1y = e1z * qx - e1x * qz, c1z = e1x * qy - e1y * qx;
  const DdE1xQ = sign * (dx * c1x + dy * c1y + dz * c1z);
  if (DdE1xQ < 0) return false;
  if (DdQxE2 + DdE1xQ > DdN) return false;
  const QdN = -sign * (qx * nx + qy * ny + qz * nz);
  if (QdN < 0) return false;
  const t = QdN / DdN;
  // THREE.Raycaster 的 far 按世界里的距离算；这里射线长度换算过来，L 就是 far 对应的那一段
  return t <= L;
}

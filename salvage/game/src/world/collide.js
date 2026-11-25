// 俯视 Z 缓冲：把固定结构的三角形从正上方“投影”到网格里，记下每一格最高的面和它是什么。
// 网直上直下，所以只要知道从水面往下第一个碰到的东西就够了。

export const TAG = {
  NONE: 0,
  FLOOR: 1, // 舱里的淤泥面：可以作业
  HULL: 2,
  RIB: 3,
  DECK: 4,
  CASTLE: 5,
  MAST: 6,
  COAMING: 7,
  CARGO: 8, // 舱里的桶和箱子
};

export const TAG_TEXT = {
  [TAG.HULL]: '船壳挡住，网下不去',
  [TAG.RIB]: '船肋挡住网口',
  [TAG.DECK]: '甲板挡住，网穿不过',
  [TAG.CASTLE]: '船尾楼有顶，网穿不过',
  [TAG.MAST]: '断桅挡住网口',
  [TAG.COAMING]: '舱口太窄，网口卡在舱沿',
  [TAG.CARGO]: '舱里的桶和箱子挡住网口',
};

export class TopZ {
  constructor(x0, z0, x1, z1, cell) {
    this.x0 = x0; this.z0 = z0; this.cell = cell;
    this.nx = Math.ceil((x1 - x0) / cell);
    this.nz = Math.ceil((z1 - z0) / cell);
    this.top = new Float32Array(this.nx * this.nz).fill(-1e9);
    this.tag = new Uint8Array(this.nx * this.nz);
  }

  addTriangle(ax, ay, az, bx, by, bz, cx, cy, cz, tag) {
    const minX = Math.min(ax, bx, cx), maxX = Math.max(ax, bx, cx);
    const minZ = Math.min(az, bz, cz), maxZ = Math.max(az, bz, cz);
    const i0 = Math.max(0, Math.floor((minX - this.x0) / this.cell));
    const i1 = Math.min(this.nx - 1, Math.floor((maxX - this.x0) / this.cell));
    const j0 = Math.max(0, Math.floor((minZ - this.z0) / this.cell));
    const j1 = Math.min(this.nz - 1, Math.floor((maxZ - this.z0) / this.cell));
    const det = (bz - cz) * (ax - cx) + (cx - bx) * (az - cz);
    if (Math.abs(det) < 1e-7) return;
    for (let j = j0; j <= j1; j++) {
      const pz = this.z0 + (j + 0.5) * this.cell;
      for (let i = i0; i <= i1; i++) {
        const px = this.x0 + (i + 0.5) * this.cell;
        const l1 = ((bz - cz) * (px - cx) + (cx - bx) * (pz - cz)) / det;
        const l2 = ((cz - az) * (px - cx) + (ax - cx) * (pz - cz)) / det;
        const l3 = 1 - l1 - l2;
        if (l1 < -1e-4 || l2 < -1e-4 || l3 < -1e-4) continue;
        const y = l1 * ay + l2 * by + l3 * cy;
        const k = j * this.nx + i;
        if (y > this.top[k]) { this.top[k] = y; this.tag[k] = tag; }
      }
    }
  }

  addMesh(mesh, tag) {
    mesh.updateMatrixWorld(true);
    const g = mesh.geometry;
    const p = g.attributes.position;
    const m = mesh.matrixWorld.elements;
    const tx = (i) => m[0] * p.getX(i) + m[4] * p.getY(i) + m[8] * p.getZ(i) + m[12];
    const ty = (i) => m[1] * p.getX(i) + m[5] * p.getY(i) + m[9] * p.getZ(i) + m[13];
    const tz = (i) => m[2] * p.getX(i) + m[6] * p.getY(i) + m[10] * p.getZ(i) + m[14];
    const idx = g.index ? g.index.array : null;
    const n = idx ? idx.length : p.count;
    for (let t = 0; t < n; t += 3) {
      const a = idx ? idx[t] : t, b = idx ? idx[t + 1] : t + 1, c = idx ? idx[t + 2] : t + 2;
      this.addTriangle(tx(a), ty(a), tz(a), tx(b), ty(b), tz(b), tx(c), ty(c), tz(c), tag);
    }
  }

  sample(x, z) {
    const i = Math.floor((x - this.x0) / this.cell);
    const j = Math.floor((z - this.z0) / this.cell);
    if (i < 0 || j < 0 || i >= this.nx || j >= this.nz) return null;
    const k = j * this.nx + i;
    if (this.tag[k] === TAG.NONE) return null;
    return { y: this.top[k], tag: this.tag[k] };
  }
}

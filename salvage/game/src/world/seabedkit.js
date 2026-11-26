import * as THREE from 'three';
import { mulberry32 } from '../util/math.js';

// 海底的画法，全游戏一份：石头、一簇海草、海带长什么样，地贴图的素材名。
// 每片海摆在哪、摆多少在那片海自己的 decor.js（sea/<海>/decor.js）。

export const GROUND = { sand: '地-沙底', mud: '地-泥底', site: '地-沉船场地' }; // 不是玩家看的：素材的文件名

export function rockGeometry(seed) {
  const g = new THREE.IcosahedronGeometry(1, 1);
  const p = g.attributes.position;
  const rnd = mulberry32(seed);
  const v = new THREE.Vector3();
  const offs = new Map();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const key = `${v.x.toFixed(3)},${v.y.toFixed(3)},${v.z.toFixed(3)}`;
    if (!offs.has(key)) offs.set(key, 0.72 + rnd() * 0.5);
    const s = offs.get(key);
    v.multiplyScalar(s);
    v.y *= 0.62;
    if (v.y < -0.1) v.y *= 0.4;
    p.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals();
  return g;
}

// 一簇海草：六七片叶子从一个根上往外弯开，从上往下看是一朵星形，不是一根根竖线。
// 叶面朝上偏外，顶上接到光；高 ≈ 1（实例按高度缩放）
export function tuftGeometry() {
  const rnd = mulberry32(4242);
  const pos = [], nor = [], idx = [];
  const nBlades = 6, segs = 4;
  for (let k = 0; k < nBlades; k++) {
    const az = (k / nBlades) * Math.PI * 2 + (rnd() - 0.5) * 0.7;
    const lean = 0.18 + rnd() * 0.42;
    const hk = 0.62 + rnd() * 0.38;
    const dx = Math.cos(az), dz = Math.sin(az);
    const wx = -dz, wz = dx; // 叶宽方向（切向）
    const base = pos.length / 3;
    let x = (rnd() - 0.5) * 0.06, y = 0, z = (rnd() - 0.5) * 0.06;
    for (let i = 0; i <= segs; i++) {
      const t = i / segs;
      const w = 0.105 * (1 - t * 0.62) * (0.85 + rnd() * 0.3);
      pos.push(x - wx * w, y, z - wz * w, x + wx * w, y, z + wz * w);
      const th = lean * (0.35 + 1.1 * t);
      // 法线：叶面朝外上方，再往上偏一些，从上面看是亮的
      const nx = dx * Math.cos(th) * 0.55, ny = 1.0, nz = dz * Math.cos(th) * 0.55;
      const l = Math.hypot(nx, ny, nz);
      nor.push(nx / l, ny / l, nz / l, nx / l, ny / l, nz / l);
      const step = hk / segs;
      x += dx * Math.sin(th) * step;
      z += dz * Math.sin(th) * step;
      y += Math.cos(th) * step;
    }
    for (let i = 0; i < segs; i++) {
      const a = base + i * 2;
      idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setIndex(idx);
  return g;
}

export function kelpGeometry() {
  const segs = 7;
  const pos = [], idx = [];
  for (let i = 0; i <= segs; i++) {
    const t = i / segs;
    const w = 0.09 + Math.sin(t * Math.PI) * 0.1;
    pos.push(-w, t, 0, w, t, 0);
  }
  for (let i = 0; i < segs; i++) {
    const a = i * 2;
    idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  const n = [];
  for (let i = 0; i < pos.length / 3; i++) n.push(0, 0.3, 1);
  g.setAttribute('normal', new THREE.Float32BufferAttribute(n, 3));
  return g;
}

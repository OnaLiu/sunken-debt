import * as THREE from 'three';
import { mulberry32 } from '../../util/math.js';
import { toon } from '../../render/materials.js';
import { mergedOf, texture } from '../../assets/assets.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { GROUND, rockGeometry, tuftGeometry, kelpGeometry } from '../../world/seabedkit.js';
import { seabedY } from './seabed.js';
import { SHOAL_CRABS, WEED_BED, RIDGE, WRECK, SHOAL_MARK } from './layout.js';

// 归潮沙湾海底的装饰摆在哪：礁脊、浅滩边的石头，草床和几小片海草，礁脊和沉船边的海带，浅水的碎壳。
// 石头、海草、海带长什么样是全游戏一份（world/seabedkit.js）。

export function buildDecor(avoid) {
  const group = new THREE.Group();
  group.name = 'decor';
  const rnd = mulberry32(1234);
  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();
  const s = new THREE.Vector3();
  const v = new THREE.Vector3();
  const col = new THREE.Color();

  const blocked = (x, z, r) => avoid.some((a) => Math.hypot(a.x - x, a.z - z) < a.r + r);

  // —— 石头 ——
  const rockSpots = [];
  // 礁脊
  for (let i = 0; i < 110; i++) {
    const t = rnd();
    const x = RIDGE.ax + (RIDGE.bx - RIDGE.ax) * t + (rnd() - 0.5) * 9;
    const z = RIDGE.az + (RIDGE.bz - RIDGE.az) * t + (rnd() - 0.5) * 4;
    if (z > RIDGE.gapA - 1 && z < RIDGE.gapB + 1 && rnd() < 0.85) continue;
    rockSpots.push([x, z, 0.5 + rnd() * 1.7]);
  }
  // 散石
  for (let i = 0; i < 140; i++) {
    const x = -230 + rnd() * 350, z = -110 + rnd() * 200;
    rockSpots.push([x, z, 0.25 + rnd() * rnd() * 1.4]);
  }
  // 浅滩边的几块石头（蟹和鱼躲的地方）
  const shoalRocks = [[-86.5, -24.2, 1.1], [-84.9, -22.8, 0.7], [-76.2, -33.1, 0.9], [-72.0, -30.4, 1.3], [-88.6, -30.5, 0.6], [-69.5, -27.6, 0.55]];
  rockSpots.push(...shoalRocks);
  // 三块礁石：有素材用素材（原点在底面中心、底下 0.2 米埋进沙里，2 米大、1.1 米高），没有就用代码画的那三块
  const ROCK_ASSETS = ['礁石-大', '礁石-中', '礁石-小']; // 不是玩家看的：素材的文件名
  const rockSrc = ROCK_ASSETS.map((n, i) => {
    const a = mergedOf(n);
    if (!a) return { geo: rockGeometry(i + 1), mat: null, asset: false };
    const geo = a.geometries.length > 1 ? mergeGeometries(a.geometries) : a.geometries[0];
    return { geo, mat: toon({ color: 0xffffff, flat: true, map: a.map, moss: { color: 0x5e6e44, amount: 0.7 } }), asset: true };
  });
  const rockMatCode = toon({ color: 0xffffff, flat: true, moss: { color: 0x5e6e44, amount: 0.7 } });
  const rockSets = rockSrc.map((r) => { const m = new THREE.InstancedMesh(r.geo, r.mat || rockMatCode, Math.ceil(rockSpots.length / 3) + 2); m.userData.asset = r.asset; return m; });
  rockSets.forEach((m) => { m.count = 0; m.castShadow = true; m.instanceMatrix.setUsage(THREE.StaticDrawUsage); });
  const rockList = [];
  for (const [x, z, r] of rockSpots) {
    if (blocked(x, z, r)) continue;
    const y = seabedY(x, z);
    const set = rockSets[Math.floor(rnd() * 3)];
    e.set((rnd() - 0.5) * 0.3, rnd() * 6.28, (rnd() - 0.5) * 0.3);
    q.setFromEuler(e);
    s.set(r * (0.8 + rnd() * 0.5), r * (0.7 + rnd() * 0.6), r * (0.8 + rnd() * 0.5));
    // 素材的礁石原点在底面（埋进沙里的那一截在原点下面）：放在海底那一点；代码画的那块原点在中间，抬一点
    m4.compose(v.set(x, set.userData.asset ? y : y + r * 0.1, z), q, s);
    set.setMatrixAt(set.count, m4);
    // 实例颜色：代码画的那块靠它定灰色；素材自己带颜色，只在 1 上下差一点点（随机数照旧取这么多次，后面摆的海草、碎壳不挪）
    const g = 0.42 + rnd() * 0.14;
    const k1 = rnd(), k2 = rnd() < 0.3;
    if (set.userData.asset) {
      const t = 0.94 + (g - 0.42) * 0.85;
      col.setRGB(t, t * (1.0 + k1 * 0.03), t);
      if (k2) col.setRGB(t * 0.97, t * 1.02, t * 0.93);
    } else {
      col.setRGB(g * 0.95, g * (1.0 + k1 * 0.08), g * 0.95);
      if (k2) col.setRGB(g * 0.9, g * 1.05, g * 0.8);
    }
    set.setColorAt(set.count, col);
    set.count++;
    rockList.push({ x, z, r });
  }
  rockSets.forEach((m) => { m.instanceColor && (m.instanceColor.needsUpdate = true); group.add(m); });

  // —— 海草 ——
  const blades = [];
  const addPatch = (cx, cz, rx, rz, n, hmin, hmax, dens = 1) => {
    for (let i = 0; i < n; i++) {
      // 成簇：先选簇中心再撒
      const a = rnd() * Math.PI * 2, rr = Math.sqrt(rnd());
      const px = cx + Math.cos(a) * rx * rr, pz = cz + Math.sin(a) * rz * rr;
      const tuft = 4 + Math.floor(rnd() * 7 * dens);
      for (let k = 0; k < tuft; k++) {
        const x = px + (rnd() - 0.5) * 0.7, z = pz + (rnd() - 0.5) * 0.7;
        if (blocked(x, z, 0.3)) continue;
        blades.push([x, z, hmin + rnd() * (hmax - hmin)]);
      }
    }
  };
  addPatch(WEED_BED.x, WEED_BED.z, WEED_BED.rx, WEED_BED.rz, 520, 0.5, 1.15, 1.2);
  addPatch(-86, -24, 6, 4, 70, 0.35, 0.75);
  addPatch(-73, -31, 5, 4, 60, 0.35, 0.7);
  addPatch(-90, -33, 4, 3, 40, 0.3, 0.6);
  addPatch(-140, -36, 8, 6, 60, 0.4, 0.8);
  addPatch(-62, -20, 5, 4, 40, 0.3, 0.6);
  addPatch(-11, 1, 5, 4, 50, 0.4, 0.9);
  addPatch(-6, 18, 4, 4, 30, 0.4, 0.8);
  addPatch(-170, -52, 9, 6, 60, 0.4, 0.9);
  const bladeMat = toon({ color: 0xffffff, sway: 1.0, side: THREE.DoubleSide });
  // 每三个叶位种一簇（随机数照旧逐个取，后面海带、碎壳的位置不变）
  const bladeMesh = new THREE.InstancedMesh(tuftGeometry(), bladeMat, Math.ceil(blades.length / 3));
  let bc = 0;
  for (let i = 0; i < blades.length; i++) {
    const [x, z, h] = blades[i];
    const y = seabedY(x, z);
    e.set((rnd() - 0.5) * 0.3, rnd() * 6.28, (rnd() - 0.5) * 0.3);
    q.setFromEuler(e);
    const wsc = 1 + rnd() * 0.6;
    const t = rnd();
    const yellow = rnd() < 0.18;
    if (i % 3 || SHOAL_CRABS.some((c) => Math.hypot(c.x - x, c.z - z) < 1.3)) continue;
    s.set(0.75 + wsc * 0.35, h, 0.75 + wsc * 0.35);
    m4.compose(v.set(x, y - 0.04, z), q, s);
    bladeMesh.setMatrixAt(bc, m4);
    col.setRGB(0.56 + t * 0.2, 0.78 + t * 0.12, 0.36 + t * 0.06);
    if (yellow) col.setRGB(0.8, 0.76, 0.4);
    bladeMesh.setColorAt(bc, col);
    bc++;
  }
  bladeMesh.count = bc;
  bladeMesh.castShadow = false;
  bladeMesh.instanceColor.needsUpdate = true;
  group.add(bladeMesh);

  // —— 海带：长在礁脊和沉船边，给竖向的轮廓 ——
  const kelps = [];
  for (let i = 0; i < 90; i++) {
    const t = rnd();
    const x = RIDGE.ax + (RIDGE.bx - RIDGE.ax) * t + (rnd() - 0.5) * 6;
    const z = RIDGE.az + (RIDGE.bz - RIDGE.az) * t + (rnd() - 0.5) * 3;
    if (z > RIDGE.gapA && z < RIDGE.gapB) continue;
    kelps.push([x, z, 2.2 + rnd() * 3.2]);
  }
  for (let i = 0; i < 26; i++) {
    const a = rnd() * 6.28, r = 9 + rnd() * 7;
    kelps.push([WRECK.x + Math.cos(a) * r - 4, WRECK.z + Math.sin(a) * r, 1.8 + rnd() * 2.6]);
  }
  for (let i = 0; i < 20; i++) kelps.push([WEED_BED.x + (rnd() - 0.5) * 26, WEED_BED.z + (rnd() - 0.5) * 18, 2 + rnd() * 2.5]);
  const kelpMat = toon({ color: 0xffffff, sway: 2.2, side: THREE.DoubleSide });
  const kelpMesh = new THREE.InstancedMesh(kelpGeometry(), kelpMat, kelps.length * 3);
  let kc = 0;
  for (const [x, z, h] of kelps) {
    if (blocked(x, z, 0.5)) continue;
    const y = seabedY(x, z);
    const fr = 2 + Math.floor(rnd() * 2);
    for (let k = 0; k < fr; k++) {
      e.set((rnd() - 0.5) * 0.25, rnd() * 6.28, (rnd() - 0.5) * 0.25);
      q.setFromEuler(e);
      s.set(1 + rnd() * 0.4, h * (0.7 + rnd() * 0.4), 1);
      m4.compose(v.set(x + (rnd() - 0.5) * 0.4, y - 0.05, z + (rnd() - 0.5) * 0.4), q, s);
      kelpMesh.setMatrixAt(kc, m4);
      const t = rnd();
      col.setRGB(0.5 + t * 0.12, 0.46 + t * 0.1, 0.22);
      kelpMesh.setColorAt(kc, col);
      kc++;
    }
  }
  kelpMesh.count = kc;
  kelpMesh.instanceColor.needsUpdate = true;
  kelpMesh.castShadow = true;
  group.add(kelpMesh);

  // —— 碎壳和小卵石：浅水的颗粒感 ——
  // 接了地的素材以后不摆：沙底贴图里已经画了碎壳堆和小卵石（规格第 8 节的颜色和大小），这些 3D 的碎粒比它亮、比它大，又几乎看不见（一平方米 0.09 颗）；
  // 没有地的素材时照旧摆（放在最后，随机数少取不挪前面任何东西）
  if (texture(GROUND.sand, true)) return { group, rocks: rockList, bladeMesh, kelpMesh };
  const shellGeo = new THREE.IcosahedronGeometry(0.07, 0);
  const shellMat = toon({ color: 0xffffff, flat: true });
  const nShell = 900;
  const shells = new THREE.InstancedMesh(shellGeo, shellMat, nShell);
  let sc = 0;
  for (let i = 0; i < nShell * 3 && sc < nShell; i++) {
    const x = -130 + rnd() * 140, z = -60 + rnd() * 70;
    const y = seabedY(x, z);
    if (y < -9 && rnd() < 0.8) continue;
    e.set(rnd() * 3, rnd() * 6.28, rnd() * 3);
    q.setFromEuler(e);
    const r = 0.6 + rnd() * 1.4;
    s.set(r, r * 0.5, r);
    m4.compose(v.set(x, y + 0.02, z), q, s);
    shells.setMatrixAt(sc, m4);
    const w = rnd();
    if (w < 0.5) col.setRGB(0.95, 0.9, 0.8); else if (w < 0.8) col.setRGB(0.62, 0.6, 0.56); else col.setRGB(0.85, 0.66, 0.55);
    shells.setColorAt(sc, col);
    sc++;
  }
  shells.count = sc;
  shells.instanceColor.needsUpdate = true;
  group.add(shells);

  return { group, rocks: rockList, bladeMesh, kelpMesh };
}

// 浅滩标杆：一根插在浅滩上的木杆，顶上一个十字和一面旧旗（从航路就看得见，引路的第一处）
export function buildMarks() {
  const g = new THREE.Group();
  const wood = toon({ color: 0x6a5440 });
  const paint = toon({ color: 0xd9c9a0 });
  const flag = toon({ color: 0xb84a36, cloth: 0.25, side: THREE.DoubleSide });
  const y0 = seabedY(SHOAL_MARK.x, SHOAL_MARK.z);
  const h = -y0 + 4.2;
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.15, h, 6), wood);
  pole.position.y = y0 + h / 2;
  const band = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.6, 6), paint);
  band.position.y = 1.4;
  const cross = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.1, 0.1), wood);
  cross.position.y = 3.6;
  const f = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.6, 6, 2), flag);
  f.geometry.translate(0.5, 0, 0);
  f.position.set(0.1, 3.85, 0);
  g.add(pole, band, cross, f);
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  g.position.set(SHOAL_MARK.x, 0, SHOAL_MARK.z);
  g.rotation.y = 0.4;
  return g;
}

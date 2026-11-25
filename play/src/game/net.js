// 重型兜底抓网：臂端正下方垂直下沉 → 底沿内收 → 垂直提起 → 转回甲板。A 之后位置锁定，全程自动。
import * as THREE from 'three';
import { Builder, box, cyl, tor, rod, col, M, sph } from '../core/geo.js';
import { worldMat, basicWaterMat } from '../render/materials.js';
import { BOAT, opFuelFor } from './boat.js';
import { lerp, clamp, smooth } from '../core/noise.js';
import { Cable } from './cable.js';

export const NET_R = 1.35;      // 网口半径（物理覆盖）
export const ENV_H = 1.2;       // 包络高度（触底面以上）
export const BAG_DROP = 1.3;    // 网兜垂在网架触底面以下能兜住的深度
export const MAX_DEPTH = 28;    // 最大作业深度
const NV = 10, NH = 5;

export class NetRig {
  constructor(scene) {
    this.group = new THREE.Group(); this.group.name = 'net';
    scene.add(this.group);
    const b = new Builder();
    const steel = col(0x3e4446), w = col(0x2a2e30);
    b.add(tor(NET_R, 0.09, 5, 16), steel, M(0, 0, 0, Math.PI / 2, 0, 0));
    for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; b.add(box(0.32, 0.22, 0.22), w, M(Math.cos(a) * NET_R, -0.08, Math.sin(a) * NET_R, 0, -a, 0)); }
    for (let i = 0; i < 4; i++) { const a = i / 4 * Math.PI * 2 + 0.4; b.add(rod(new THREE.Vector3(Math.cos(a) * NET_R, 0, Math.sin(a) * NET_R), new THREE.Vector3(0, 1.7, 0), 0.03, 3), w); }
    b.add(sph(0.16, 6, 4), steel, M(0, 1.75, 0));
    this.frame = new THREE.Mesh(b.build(), worldMat({ key: 'netframe' }));
    this.frame.castShadow = true;
    this.group.add(this.frame);
    // 网兜：可开合的网格
    this.bagGeo = new THREE.BufferGeometry();
    this.bagPos = new Float32Array((NV + 1) * (NH + 1) * 3);
    this.bagGeo.setAttribute('position', new THREE.BufferAttribute(this.bagPos, 3));
    const idx = [];
    for (let j = 0; j < NH; j++) for (let i = 0; i < NV; i++) {
      const a = j * (NV + 1) + i, b2 = a + 1, c = a + NV + 1, d = c + 1;
      idx.push(a, c, b2, b2, c, d);
    }
    this.bagGeo.setIndex(idx);
    const bm = basicWaterMat(0x2a2c26, { key: 'netbag', side: THREE.DoubleSide });
    bm.wireframe = true;
    this.bag = new THREE.Mesh(this.bagGeo, bm);
    this.bag.frustumCulled = false;
    this.group.add(this.bag);
    // 爪（8 根下垂肋，闭合时内收）
    this.ribs = [];
    const rm = worldMat({ key: 'netrib' });
    for (let i = 0; i < 8; i++) { const r = new THREE.Mesh(new THREE.BoxGeometry(0.07, 1.3, 0.07), rm); r.castShadow = true; this.group.add(r); this.ribs.push(r); }
    // 吊索：能松、能绷、能抖（B9）
    this.cable = new Cable(scene);
    // 网中的泥包（装货后）
    this.loadMesh = null;
    this.closure = 0;
    this.heft = 0;   // 网里东西有多沉（0~1，B10）：越沉网兜收紧后垂得越长
    this.state = 'stowed';
    this.t = 0;
    this.pos = new THREE.Vector3();
    this.setClosure(0);
  }
  // 吊索一抖（W5）：咬到硬物那一下，整根缆像被拨了的弦，横着抖（基频加一点二次谐波，cable.js 的 pluck），约 1.5 秒抖停。a 是缆中间横着摆几米
  twang(a = 0.3) { this.cable.pluck(a, 4.6); }
  setClosure(c) {
    this.closure = c;
    const p = this.bagPos;
    for (let j = 0; j <= NH; j++) {
      const k = j / NH;
      for (let i = 0; i <= NV; i++) {
        const a = i / NV * Math.PI * 2;
        const rOpen = NET_R * (1 - k * 0.12);
        const rClosed = NET_R * Math.sin((1 - k) * Math.PI * 0.5 + 0.08) * (1 - k * 0.6);
        const r = lerp(rOpen, rClosed, c);
        const y = -k * lerp(1.15, 0.95, c) - c * k * k * (0.25 + 0.38 * this.heft);
        const o = (j * (NV + 1) + i) * 3;
        p[o] = Math.cos(a) * r; p[o + 1] = y; p[o + 2] = Math.sin(a) * r;
      }
    }
    this.bagGeo.attributes.position.needsUpdate = true;
    this.bagGeo.computeBoundingSphere();
    for (let i = 0; i < 8; i++) {
      const a = i / 8 * Math.PI * 2 + 0.2;
      const rib = this.ribs[i];
      const tilt = lerp(0.08, 1.15, c);
      rib.position.set(Math.cos(a) * (NET_R - Math.sin(tilt) * 0.6), -Math.cos(tilt) * 0.62, Math.sin(a) * (NET_R - Math.sin(tilt) * 0.6));
      rib.rotation.set(0, -a, 0);
      rib.rotateZ(tilt);
    }
  }
  // 网口足迹采样点（整个圆面，见 FOOT）
  static samplePoints(x, z) { return FOOT.map(([ox, oz]) => [x + ox, z + oz]); }
}

// 网口足迹采样：整个网口圆面按不超过 0.2 m 的间距取点，最外一圈正好在画出来的网口圈上；地形、礁石按这些点查，红点也画在这些点上。
// （以前整个网口只取 23 个点，靠船肋处常有落点“穿过”圈下看得见的结构。）
export const FOOT = (() => {
  const pts = [[0, 0]];
  for (let k = 1; k <= 6; k++) {
    const r = NET_R * k / 6, n = Math.ceil(2 * Math.PI * r / 0.2);
    for (let i = 0; i < n; i++) { const a = (i + (k % 2) * 0.5) / n * Math.PI * 2; pts.push([Math.cos(a) * r, Math.sin(a) * r]); }
  }
  return pts;
})();
// 网口下最高的面 = 网架停住的那一层（触底面）。界面估计、真实下网、机器人选点都用这一个。
// 地形和礁石是缓的，按 FOOT 取点；沉船与碎件的顶面栅格逐格查：网口圆面碰到的每一格都算（一根 0.25 m 宽的船肋也漏不过去）
// H：可选，顺手记下每个采样点的高度（画红点用）
export function footprintTop(world, x, z, H = null) {
  let T = -1e9;
  for (let i = 0; i < FOOT.length; i++) { const h = world.surfaceTop(x + FOOT[i][0], z + FOOT[i][1]); if (H) H[i] = h; if (h > T) T = h; }
  for (const r of world.regions.values()) {
    if (!r.grid || Math.abs(r.reg.cx - x) > 160 || Math.abs(r.reg.cz - z) > 160) continue;
    const g = gridMaxInDisc(r.grid, x, z, NET_R);
    if (g > T) T = g;
  }
  return T;
}
// 顶面栅格按“离得最近的格子”取值，所以圆面里的点会落进哪些格子 = 方格和圆面相交的那些格子
function gridMaxInDisc(g, x, z, R) {
  const cs = g.cell, h = cs / 2;
  const ix0 = Math.max(0, Math.floor((x - R - g.minX) / cs)), ix1 = Math.min(g.nx - 1, Math.ceil((x + R - g.minX) / cs));
  const iz0 = Math.max(0, Math.floor((z - R - g.minZ) / cs)), iz1 = Math.min(g.nz - 1, Math.ceil((z + R - g.minZ) / cs));
  let T = -1e9;
  for (let iz = iz0; iz <= iz1; iz++) {
    const dz = Math.max(0, Math.abs(g.minZ + iz * cs - z) - h);
    if (dz > R) continue;
    for (let ix = ix0; ix <= ix1; ix++) {
      const dx = Math.max(0, Math.abs(g.minX + ix * cs - x) - h);
      if (dx * dx + dz * dz > R * R) continue;
      const v = g.top[iz * g.nx + ix];
      if (v > T) T = v;
    }
  }
  return T;
}

// 网的下放：和真实作业同一步规则（空中 1.6 m/s，入水后最快 5.6 m/s，离触底 1.6 m 内减速）
export const BOTTOM_OFF = 1.05; // 网架停住时，网架比触底面高这么多（网兜底就在触底面上）
export const PLUNGE_Y = 0.06;   // 网入水（B5）：网架落到离水面这么近，网圈砸进水的那一帧——入水的水花和声音、下网的放缆声（B4）都按这一刻
export function lowerStep(s, restY, dt) {
  const remain = s.y - restY;
  let vmax = s.y < 0.5 ? 5.6 : 1.6;
  if (remain < 1.6) vmax = Math.max(1.2, remain * 2.6);
  s.v = Math.min(vmax, s.v + dt * 7);
  s.y -= s.v * dt;
  return s.y <= restY;
}
// 测深绳上的秒结：从网架高度 y（速度 v）放下去，几秒触底；离触底还剩 1、2、3……秒时网兜底在哪个高度
const _plan = { t: 0, knots: [] }, _st = { y: 0, v: 0 }, _ys = [];
export function sinkPlan(y, T, v = 0) {
  const restY = T + BOTTOM_OFF, dt = 1 / 60;
  _st.y = y; _st.v = v; _ys.length = 0;
  let n = 0;
  if (y > restY) { _ys.push(y); while (n++ < 3000 && !lowerStep(_st, restY, dt)) _ys.push(_st.y); }
  _plan.t = _ys.length * dt;
  _plan.knots.length = 0;
  for (let k = 1; k * 60 < _ys.length; k++) _plan.knots.push(_ys[_ys.length - k * 60] - BOTTOM_OFF);
  return _plan;
}

// 预估：触底面、深度、底质、限制（已看清的障碍、臂长、深度）。不泄露未知物件。
// low：网架搁在高处时，网兜垂不到的低处（这些采样点画成红点；x, y, z 依次排开）
export function estimateDrop(world, boat, x, z) {
  const H = estimateDrop.h || (estimateDrop.h = new Float32Array(FOOT.length));
  const T = footprintTop(world, x, z, H);
  let minH = 1e9;
  const low = [];
  for (let i = 0; i < FOOT.length; i++) { if (H[i] < minH) minH = H[i]; if (H[i] < T - BAG_DROP) low.push(x + FOOT[i][0], H[i], z + FOOT[i][1]); }
  const k = world.surfaceKind(x, z);
  const centerH = world.surfaceTop(x, z);
  const depth = -T;
  const res = { T, depth, unevenness: T - minH, kind: k, fuel: opFuelFor(depth), issues: [], ok: true, centerH, low, lowFrac: low.length / 3 / FOOT.length };
  if (T > -1.5) { res.ok = false; res.issues.push('太浅，网架会搁底'); }
  if (depth > MAX_DEPTH) { res.ok = false; res.issues.push(`太深：超过 ${MAX_DEPTH} m`); }
  if (boat.overOwnHull(x, z)) { res.ok = false; res.issues.push('在自己船上方'); }
  // 预兆：看得见的埋着的硬物（红三角）——网口压到会自动收回，事前就说
  if (world.obstaclesNear) for (const o of world.obstaclesNear(x, z, NET_R)) if (Math.hypot(o.x - x, o.z - z) < NET_R + o.r * 0.4) { res.issues.push('压着埋住的硬物：只兜得到表层'); res.hazard = true; break; }
  // 网架搁在高处，网兜垂不到的低处画红点；只在红点盖住一块像样的地方（约 4% 网口）时提一句
  if (res.lowFrac > 0.04) res.issues.push('红点处网兜垂不到');
  else if (k === '船体') res.note = '落在船体内';
  return res;
}

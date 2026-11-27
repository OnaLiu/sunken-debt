import * as THREE from 'three';
import { toon } from '../render/materials.js';
import { GeoBuilder } from '../util/builder.js';
import { trenchZ, LEVIATHAN_PATH } from '../world/layout.js';
import { seabedY } from '../world/terrain.js';
import { smoothstep, mulberry32, clamp, damp } from '../util/math.js';

// 逆流的大轮廓：一趟只经过一次，沿深槽从东往西慢慢游过去。不攻击、不能捕。
// 它在深水里，只看得出一条很长的暗影和缓慢的起伏；附近的鱼先散开。
//
// 身子是一整条连着的管子，沿一条脊线弯：头骨和下颌、一对灰白的眼、两根拖在后面的长须、
// 一对像翅膀的胸鳍和一对小腹鳍、从脖子一直到尾尖的背鳍冠、后半身两侧的褶边。
// 背暗腹浅，身上有灰白的斑和几道旧伤疤。
const LEN = 26;
// 水色只吃六成：在水下读起来是一条比海底更暗的长影（不是一团淡青的雾）
const SEE_K = 0.6;
const RINGS = 60;
const SIDES = 10;
const CTRL = 24;

const COL = {
  back: new THREE.Color(0.15, 0.18, 0.2),
  flank: new THREE.Color(0.26, 0.3, 0.3),
  belly: new THREE.Color(0.5, 0.5, 0.45),
  spot: new THREE.Color(0.56, 0.6, 0.55),
  scar: new THREE.Color(0.62, 0.6, 0.54),
  crest: new THREE.Color(0.25, 0.17, 0.16),
  crestRay: new THREE.Color(0.13, 0.1, 0.1),
  fin: new THREE.Color(0.2, 0.22, 0.23),
  finRay: new THREE.Color(0.12, 0.13, 0.14),
  skull: new THREE.Color(0.18, 0.21, 0.22),
  jaw: new THREE.Color(0.42, 0.42, 0.38),
  mouth: new THREE.Color(0.1, 0.05, 0.05),
  tooth: new THREE.Color(0.78, 0.76, 0.66),
};

// 半径（左右）沿身长 u（0 = 脖子，1 = 尾尖）
function radius(u) {
  const neck = 0.95 + 0.25 * smoothstep(0.0, 0.1, u);
  const taper = 1 - Math.pow(smoothstep(0.32, 1.0, u), 0.85) * 0.93;
  return neck * taper * 1.08;
}

const V3 = (x, y, z) => new THREE.Vector3(x, y, z);

// 头：上颌（头骨）+ 能张合的下颌。局部 +x 朝前，+y 朝上，+z 朝右
function buildHead(mat) {
  const head = new THREE.Group();
  const b = new GeoBuilder();
  const taper = (x0, x1, a, bz0, ay1, bz1, yc, c, y0off = 0) => {
    // 前后两个截面（半高 a/ay1，半宽 bz0/bz1）的块
    const p = [
      V3(x0, yc - a + y0off, -bz0), V3(x0, yc - a + y0off, bz0), V3(x0, yc + a, bz0), V3(x0, yc + a, -bz0),
      V3(x1, yc - ay1 + y0off, -bz1), V3(x1, yc - ay1 + y0off, bz1), V3(x1, yc + ay1, bz1), V3(x1, yc + ay1, -bz1),
    ];
    b.quad(p[0], p[1], p[2], p[3], c); // 后
    b.quad(p[4], p[7], p[6], p[5], c); // 前
    b.quad(p[3], p[2], p[6], p[7], c); // 顶
    b.quad(p[0], p[4], p[5], p[1], c); // 底
    b.quad(p[1], p[5], p[6], p[2], c); // 右
    b.quad(p[0], p[3], p[7], p[4], c); // 左
  };
  // 头骨：后宽前窄，吻部扁
  taper(-0.6, 1.2, 0.72, 1.02, 0.55, 0.86, 0.12, COL.skull);
  taper(1.2, 2.5, 0.55, 0.86, 0.32, 0.5, 0.16, COL.skull);
  taper(2.5, 3.05, 0.32, 0.5, 0.18, 0.3, 0.2, COL.skull.clone().multiplyScalar(1.15));
  // 眉骨：眼睛上面两道突起
  for (const s of [-1, 1]) {
    b.box(V3(1.55, 0.72, s * 0.62), V3(0.55, 0, 0), V3(0, 0.12, 0), V3(0, 0, 0.16), COL.skull.clone().multiplyScalar(0.8));
    // 鼻孔
    b.box(V3(2.85, 0.36, s * 0.16), V3(0.06, 0, 0), V3(0, 0.03, 0), V3(0, 0, 0.05), COL.mouth);
    // 鳃裂：三道
    for (let k = 0; k < 3; k++) b.box(V3(-0.2 - k * 0.22, 0.05, s * 1.0), V3(0.035, 0, 0), V3(0, 0.42, 0), V3(0, 0, 0.04), COL.back.clone().multiplyScalar(0.6));
  }
  // 头顶一溜灰白的骨板
  for (let k = 0; k < 5; k++) b.box(V3(2.2 - k * 0.55, 0.78 - k * 0.0, 0), V3(0.2, 0, 0), V3(0, 0.07, 0), V3(0, 0, 0.18 - k * 0.015), COL.spot.clone().multiplyScalar(0.75));
  // 上颌的牙：一排往下的小尖
  for (const s of [-1, 1]) {
    for (let k = 0; k < 7; k++) {
      const x = 0.9 + k * 0.3, z = s * (0.78 - k * 0.07);
      b.tri(V3(x - 0.08, -0.32, z), V3(x + 0.08, -0.32, z), V3(x, -0.55, z * 0.97), COL.tooth);
      b.tri(V3(x + 0.08, -0.32, z), V3(x - 0.08, -0.32, z), V3(x, -0.55, z * 0.97), COL.tooth);
    }
  }
  const skull = new THREE.Mesh(b.build(), mat);
  head.add(skull);
  // 下颌：绕后面的铰点张开
  const jaw = new THREE.Group();
  jaw.position.set(-0.3, -0.25, 0);
  const jb = new GeoBuilder();
  const jt = (x0, x1, h0, w0, h1, w1, c) => {
    const p = [
      V3(x0, -h0, -w0), V3(x0, -h0, w0), V3(x0, 0, w0), V3(x0, 0, -w0),
      V3(x1, -h1, -w1), V3(x1, -h1, w1), V3(x1, 0, w1), V3(x1, 0, -w1),
    ];
    jb.quad(p[0], p[1], p[2], p[3], c);
    jb.quad(p[4], p[7], p[6], p[5], c);
    jb.quad(p[3], p[2], p[6], p[7], COL.mouth);
    jb.quad(p[0], p[4], p[5], p[1], c);
    jb.quad(p[1], p[5], p[6], p[2], c);
    jb.quad(p[0], p[3], p[7], p[4], c);
  };
  jt(0.0, 1.6, 0.42, 0.92, 0.3, 0.7, COL.jaw);
  jt(1.6, 3.0, 0.3, 0.7, 0.14, 0.32, COL.jaw.clone().multiplyScalar(0.92));
  for (const s of [-1, 1]) {
    for (let k = 0; k < 7; k++) {
      const x = 1.0 + k * 0.28, z = s * (0.66 - k * 0.055);
      jb.tri(V3(x - 0.07, 0.0, z), V3(x + 0.07, 0.0, z), V3(x, 0.2, z * 0.97), COL.tooth);
      jb.tri(V3(x + 0.07, 0.0, z), V3(x - 0.07, 0.0, z), V3(x, 0.2, z * 0.97), COL.tooth);
    }
  }
  // 下巴底下一对短须根
  const jm = new THREE.Mesh(jb.build(), mat);
  jaw.add(jm);
  head.add(jaw);
  // 眼睛：灰白、微微发光，在深水里是两个淡淡的点
  const eyeMat = toon({ color: 0x9aa89a, emissive: 0x4a5a50, see: SEE_K });
  const eyes = [];
  for (const s of [-1, 1]) {
    const e = new THREE.Mesh(new THREE.IcosahedronGeometry(0.17, 0), eyeMat);
    e.position.set(1.5, 0.5, s * 0.82);
    e.scale.set(1.2, 0.8, 0.6);
    head.add(e);
    eyes.push(e);
    const pupil = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.16, 0.02), toon({ color: 0x0c0d0d }));
    pupil.position.set(1.55, 0.5, s * 0.92);
    head.add(pupil);
  }
  head.traverse((o) => { if (o.isMesh) o.castShadow = false; });
  return { head, jaw, eyes };
}

// 胸鳍、腹鳍：几根鳍条撑着一片膜。局部 +x 朝后（顺着身子往尾巴），+z 朝外
function buildFin(mat, len, width, rays) {
  const b = new GeoBuilder();
  const tips = [];
  for (let i = 0; i < rays; i++) {
    const a = (i / (rays - 1)) * 1.0 - 0.15;
    const L = len * (1 - Math.abs(i / (rays - 1) - 0.35) * 0.6);
    tips.push(V3(Math.sin(a) * L * 0.8, -0.05 * i, Math.cos(a) * L * width));
  }
  const root = V3(0, 0, 0.0);
  for (let i = 0; i < rays - 1; i++) {
    const c = i % 2 ? COL.fin : COL.fin.clone().multiplyScalar(1.12);
    b.tri(root, tips[i], tips[i + 1], c);
    b.tri(root, tips[i + 1], tips[i], c);
  }
  for (let i = 0; i < rays; i++) b.beam(root, tips[i], V3(0, 1, 0), 0.07, 0.05, COL.finRay);
  const m = new THREE.Mesh(b.build(), mat);
  m.castShadow = true;
  const g = new THREE.Group();
  g.add(m);
  return g;
}

// 身子的网格：几圈环 + 背鳍冠 + 尾部两侧的褶边。每个顶点记着它在脊线上的位置 u 和横截面里的偏移
export class LeviathanBody {
  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'leviathan-body';
    const rnd = mulberry32(909);
    this.mat = toon({ vertexColors: true, flat: true, spec: 0.18, shin: 10, side: THREE.DoubleSide, see: SEE_K });
    const rest = []; // [u, oy, oz, kind]
    const cols = [];
    const idx = [];
    const ringU = [];
    for (let i = 0; i < RINGS; i++) ringU.push(Math.pow(i / (RINGS - 1), 1.05));
    // 斑点和伤疤：在 (u, 角度) 上预先撒好
    const spots = [];
    for (let k = 0; k < 46; k++) spots.push([rnd() * 0.85 + 0.03, (rnd() - 0.5) * 3.2 + (rnd() < 0.5 ? Math.PI * 0.5 : -Math.PI * 0.5), 0.012 + rnd() * 0.02]);
    const scars = [[0.22, 0.9, 0.06], [0.31, -1.1, 0.05], [0.47, 0.6, 0.04]];
    for (let i = 0; i < RINGS; i++) {
      const u = ringU[i];
      for (let j = 0; j < SIDES; j++) {
        const th = (j / SIDES) * Math.PI * 2;
        rest.push([u, Math.cos(th), Math.sin(th), 0]);
        // 背暗腹浅，中间一道过渡；隔一段一道淡淡的暗环
        const up = Math.cos(th);
        const c = up > 0 ? COL.flank.clone().lerp(COL.back, smoothstep(0.1, 0.8, up)) : COL.flank.clone().lerp(COL.belly, smoothstep(-0.05, -0.75, up));
        if (Math.sin(u * 62) > 0.86 && up > -0.3) c.multiplyScalar(0.82);
        for (const [su, sa, sr] of spots) {
          const da = Math.atan2(Math.sin(th - sa), Math.cos(th - sa));
          if (Math.abs(u - su) < sr && Math.abs(da) < 0.45) c.lerp(COL.spot, 0.75);
        }
        for (const [su, sa, sl] of scars) {
          const da = Math.atan2(Math.sin(th - sa), Math.cos(th - sa));
          if (Math.abs(u - su) < sl && Math.abs(da - (u - su) * 6) < 0.18) c.lerp(COL.scar, 0.8);
        }
        cols.push(c);
        if (i < RINGS - 1) {
          const a = i * SIDES + j, bq = i * SIDES + ((j + 1) % SIDES);
          idx.push(a, bq, a + SIDES, bq, bq + SIDES, a + SIDES);
        }
      }
    }
    // 尾尖封口
    const tipI = rest.length;
    rest.push([1.0, 0, 0, 0]);
    cols.push(COL.back.clone());
    for (let j = 0; j < SIDES; j++) idx.push((RINGS - 1) * SIDES + j, (RINGS - 1) * SIDES + ((j + 1) % SIDES), tipI);
    // 背鳍冠：从脖子到尾尖，一片立着的膜，鳍条一深一浅
    const crestStart = rest.length;
    const crestRings = [];
    for (let i = 1; i < RINGS; i++) if (ringU[i] > 0.02 && ringU[i] < 0.98) crestRings.push(i);
    crestRings.forEach((ri, k) => {
      const u = ringU[ri];
      rest.push([u, 0.9, 0, 1]); // 根：贴着背
      rest.push([u, 0.9, 0, 2]); // 梢：高度在 pose 里算
      const c = k % 2 ? COL.crest : COL.crestRay;
      cols.push(c.clone().multiplyScalar(0.8), c.clone());
      if (k < crestRings.length - 1) {
        const a = crestStart + k * 2;
        idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
      }
    });
    // 后半身两侧的褶边
    const frillStart = rest.length;
    const frillRings = [];
    for (let i = 0; i < RINGS; i++) if (ringU[i] > 0.42 && ringU[i] < 0.99) frillRings.push(i);
    for (const s of [-1, 1]) {
      const base = rest.length;
      frillRings.forEach((ri, k) => {
        const u = ringU[ri];
        rest.push([u, -0.15, s * 0.95, 3]);
        rest.push([u, -0.15, s * 0.95, 4 * s]); // 外沿：pose 里往外摆
        const c = k % 2 ? COL.fin : COL.finRay;
        cols.push(c.clone(), c.clone().multiplyScalar(1.15));
        if (k < frillRings.length - 1) {
          const a = base + k * 2;
          idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
        }
      });
    }
    void frillStart;
    this.rest = rest;
    const n = rest.length;
    const pos = new Float32Array(n * 3);
    const col = new Float32Array(n * 3);
    cols.forEach((c, i) => { col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b; });
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage));
    geo.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(n * 3).fill(0), 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    geo.setIndex(idx);
    this.geo = geo;
    this.mesh = new THREE.Mesh(geo, this.mat);
    this.mesh.frustumCulled = false;
    // 投影：经过时坡上拖过一大片移动的暗影（隔着水最容易看出来的就是这片影子）
    this.mesh.castShadow = true;
    this.group.add(this.mesh);

    const finMat = toon({ vertexColors: true, flat: true, side: THREE.DoubleSide, see: SEE_K });
    const H = buildHead(this.mat);
    this.head = H.head; this.jaw = H.jaw; this.eyes = H.eyes;
    this.group.add(this.head);
    this.fins = [];
    for (const [u, len, w, rays, ph] of [[0.07, 4.6, 0.95, 6, 0], [0.3, 2.4, 0.8, 5, 1.2]]) {
      for (const s of [-1, 1]) {
        const f = buildFin(finMat, len, w, rays);
        this.group.add(f);
        this.fins.push({ f, u, s, ph });
      }
    }
    // 两根长须：从吻部两边拖到身后，一节一节跟着头走
    this.barbels = [];
    const bMat = toon({ color: 0x3a4040, flat: true, side: THREE.DoubleSide, see: SEE_K });
    for (const s of [-1, 1]) {
      const N = 14;
      const geo2 = new THREE.BufferGeometry();
      geo2.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N * 4 * 3), 3).setUsage(THREE.DynamicDrawUsage));
      const id2 = [];
      for (let i = 0; i < N - 1; i++) for (let k = 0; k < 4; k++) {
        const a = i * 4 + k, bq = i * 4 + ((k + 1) % 4);
        id2.push(a, bq, a + 4, bq, bq + 4, a + 4);
      }
      geo2.setIndex(id2);
      const m = new THREE.Mesh(geo2, bMat);
      m.frustumCulled = false;
      this.group.add(m);
      this.barbels.push({ s, m, pts: Array.from({ length: N }, () => new THREE.Vector3()), init: false, N, seg: 0.42 });
    }
    // 脊线的采样点（声呐也用）
    this.spine = Array.from({ length: RINGS }, () => new THREE.Vector3());
    this._T = Array.from({ length: RINGS }, () => new THREE.Vector3());
    this._N = Array.from({ length: RINGS }, () => new THREE.Vector3());
    this._B = Array.from({ length: RINGS }, () => new THREE.Vector3());
    this.ringU = ringU;
  }

  // spineAt(u) → 世界坐标（u: 0 = 吻尖前一点，1 = 尾尖）；t 时间；k 整体大小（淡入淡出时缩一点）
  pose(spineAt, t, k = 1) {
    const R = this.rest;
    const pos = this.geo.attributes.position.array;
    const up = new THREE.Vector3(0, 1, 0);
    // 环的位置和朝向
    for (let i = 0; i < RINGS; i++) spineAt(this.ringU[i], this.spine[i]);
    for (let i = 0; i < RINGS; i++) {
      const a = this.spine[Math.max(0, i - 1)], b = this.spine[Math.min(RINGS - 1, i + 1)];
      const T = this._T[i].subVectors(a, b).normalize(); // 朝头的方向
      const B = this._B[i].crossVectors(T, up).normalize();
      this._N[i].crossVectors(B, T).normalize();
      // 转弯时往里侧压一点
      if (i > 0 && i < RINGS - 1) {
        const bend = this._T[Math.max(0, i - 1)];
        void bend;
      }
    }
    const crestH = (u) => (0.55 + 0.45 * Math.sin(Math.min(1, u * 5) * Math.PI * 0.5)) * (1 - smoothstep(0.7, 1.0, u) * 0.75) * 1.0;
    for (let v = 0; v < R.length; v++) {
      const [u, oy, oz, kind] = R[v];
      // u → 环下标（环的 u 是单调的；用插值找）
      const f = Math.pow(u, 1 / 1.05) * (RINGS - 1);
      const i0 = Math.min(RINGS - 2, Math.floor(f)), w = f - i0;
      const P = _p.copy(this.spine[i0]).lerp(this.spine[i0 + 1], w);
      const N = _n.copy(this._N[i0]).lerp(this._N[i0 + 1], w);
      const Bv = _b.copy(this._B[i0]).lerp(this._B[i0 + 1], w);
      const r = radius(u) * k;
      let y = oy * r * 0.78, z = oz * r;
      if (kind === 1) { y = r * 0.72; z = 0; }
      else if (kind === 2) {
        const hh = crestH(u) * k;
        y = r * 0.72 + hh;
        z = Math.sin(t * 2.2 - u * 34) * 0.16 * hh;
      } else if (kind === 3) { y = -r * 0.1; z = Math.sign(oz) * r * 0.92; }
      else if (kind === 4 || kind === -4) {
        const s = Math.sign(kind);
        const wv = Math.sin(t * 2.6 - u * 40 + s);
        const wd = (0.35 + 0.35 * smoothstep(0.42, 0.8, u)) * k * (1 - smoothstep(0.92, 1.0, u) * 0.6);
        y = -r * 0.1 + wv * 0.14 * wd * 2;
        z = s * (r * 0.92 + wd);
      }
      if (u >= 0.999 && kind === 0 && oy === 0 && oz === 0) { y = 0; z = 0; }
      pos[v * 3] = P.x + N.x * y + Bv.x * z;
      pos[v * 3 + 1] = P.y + N.y * y + Bv.y * z;
      pos[v * 3 + 2] = P.z + N.z * y + Bv.z * z;
    }
    this.geo.attributes.position.needsUpdate = true;
    // 头：在脖子前面，朝向沿脊线
    {
      const P0 = this.spine[0], T0 = this._T[0], N0 = this._N[0], B0 = this._B[0];
      const m = _m.makeBasis(T0, N0, B0);
      this.head.quaternion.setFromRotationMatrix(m);
      this.head.position.copy(P0).addScaledVector(T0, 0.55 * k);
      this.head.scale.setScalar(k);
      // 下颌慢慢张合；眼睛偶尔眯一下
      this.jaw.rotation.z = -(0.05 + 0.13 * Math.max(0, Math.sin(t * 0.45)) ** 2);
      const blink = Math.sin(t * 0.7) > 0.985 ? 0.2 : 1;
      for (const e of this.eyes) e.scale.y = 0.8 * blink;
    }
    // 鳍
    for (const F of this.fins) {
      const f = Math.pow(F.u, 1 / 1.05) * (RINGS - 1);
      const i0 = Math.min(RINGS - 2, Math.floor(f));
      const P = this.spine[i0], T = this._T[i0], N = this._N[i0], Bv = this._B[i0];
      // 局部 x 朝尾巴、y 朝上、z 朝左（右手系）；右边那片用 scale.z = -1 镜像过去
      _m.makeBasis(_t.copy(T).negate(), N, _b.copy(Bv).negate());
      F.f.quaternion.setFromRotationMatrix(_m);
      // 两边一起往上扇、一起往后划
      const flap = Math.sin(t * 0.9 + F.ph) * 0.35;
      const sweep = Math.sin(t * 0.9 + F.ph - 1.1) * 0.25;
      F.f.quaternion.multiply(_q.setFromEuler(_e.set(flap * F.s, -F.s * sweep, 0)));
      const r = radius(F.u) * k;
      F.f.position.copy(P).addScaledVector(Bv, F.s * r * 0.85).addScaledVector(N, -r * 0.2);
      F.f.scale.set(k, k, -F.s * k);
    }
    // 长须：根在吻部两边，后面一节节拖着
    {
      const P0 = this.spine[0], T0 = this._T[0], N0 = this._N[0], B0 = this._B[0];
      for (const bb of this.barbels) {
        const root = _p.copy(P0).addScaledVector(T0, 3.0 * k).addScaledVector(B0, bb.s * 0.3 * k).addScaledVector(N0, -0.15 * k);
        const pts = bb.pts;
        if (!bb.init) {
          for (let i = 0; i < bb.N; i++) pts[i].copy(root).addScaledVector(T0, -i * bb.seg * k).addScaledVector(B0, bb.s * i * 0.12);
          bb.init = true;
        }
        pts[0].copy(root);
        for (let i = 1; i < bb.N; i++) {
          // 每一节都想顺着身子往后拖、往外张、略往下垂，被水流带着轻轻摆；再拉回一节的长度
          const want = _t.copy(pts[i - 1])
            .addScaledVector(T0, -bb.seg * k * 0.9)
            .addScaledVector(B0, bb.s * bb.seg * k * (0.35 - i * 0.02) + Math.sin(t * 1.3 - i * 0.55) * 0.12 * k)
            .addScaledVector(N0, -bb.seg * k * (0.18 + i * 0.015));
          pts[i].lerp(want, 0.18);
          const d = _d.subVectors(pts[i], pts[i - 1]);
          const L = d.length() || 1;
          pts[i].copy(pts[i - 1]).addScaledVector(d, (bb.seg * k) / L);
        }
        const arr = bb.m.geometry.attributes.position.array;
        for (let i = 0; i < bb.N; i++) {
          const rr = 0.07 * (1 - i / bb.N * 0.8) * k;
          const dir = _d.subVectors(pts[Math.min(bb.N - 1, i + 1)], pts[Math.max(0, i - 1)]).normalize();
          const s1 = _n.crossVectors(dir, up).normalize();
          const s2 = _b.crossVectors(s1, dir).normalize();
          for (let q = 0; q < 4; q++) {
            const ang = (q / 4) * Math.PI * 2;
            const j = (i * 4 + q) * 3;
            arr[j] = pts[i].x + (s1.x * Math.cos(ang) + s2.x * Math.sin(ang)) * rr;
            arr[j + 1] = pts[i].y + (s1.y * Math.cos(ang) + s2.y * Math.sin(ang)) * rr;
            arr[j + 2] = pts[i].z + (s1.z * Math.cos(ang) + s2.z * Math.sin(ang)) * rr;
          }
        }
        bb.m.geometry.attributes.position.needsUpdate = true;
      }
    }
  }
}
const _p = new THREE.Vector3(), _n = new THREE.Vector3(), _b = new THREE.Vector3(), _t = new THREE.Vector3(), _d = new THREE.Vector3();
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler();

export class Leviathan {
  constructor(g) {
    this.g = g;
    this.body = new LeviathanBody();
    this.group = this.body.group;
    this.group.name = 'leviathan';
    // 声呐按这些点画回波：沿身子 16 个点，带半径
    this.segs = Array.from({ length: 16 }, (_, i) => {
      const k = i / 15;
      return { m: { position: new THREE.Vector3() }, r: radius(k) * 1.0 + 0.05, k };
    });
    this.group.visible = false;
    g.world.scene.add(this.group);
    this.head = new THREE.Vector3();
    this.active = false;
    this.done = false;
    this.fromX = LEVIATHAN_PATH.fromX;
    this.toX = LEVIATHAN_PATH.toX;
    this.x = LEVIATHAN_PATH.fromX;
    this.trail = [];
    this._ctrl = Array.from({ length: CTRL + 1 }, () => new THREE.Vector3());
    this._dv = new Float32Array(CTRL + 1).fill(1);
  }

  reset() {
    this.active = false;
    this.done = false;
    this.group.visible = false;
    this.focus = null;
    this.fromX = LEVIATHAN_PATH.fromX;
    this.toX = LEVIATHAN_PATH.toX;
    this.x = LEVIATHAN_PATH.fromX;
    this.dive = 1;
    this.leaving = false;
    this.again = false;
    for (const bb of this.body.barbels) bb.init = false;
    this.calm = false;
  }

  // focus：从哪儿经过。先在那儿东边的深槽底下停两三秒（看不见，附近的鱼已经先逃了），
  // 再浮到深槽上沿，往西慢慢游过去；过去四十五米后一头扎回深槽底，没了（最多 50 秒）
  // track：游戏里跟着船走——从船旁 7 米左右过（镜头怎么转，船周围十来米总在画面里），在船东边二十来米浮上来；
  // 效果页给定点、不跟：从那儿旁边 13 米过，在东边四十米浮上来（效果页的镜头等它游进来）
  start(focus, track = false) {
    if (this.active || this.done) return;
    this.active = true;
    this.track = track;
    this.focus = focus ? { x: focus.x, z: focus.z } : null;
    this.fromX = focus ? clamp(focus.x + (track ? 22 : 38), -60, 90) : LEVIATHAN_PATH.fromX;
    this.toX = focus ? Math.max(LEVIATHAN_PATH.toX, focus.x - 45) : LEVIATHAN_PATH.toX;
    this.x = this.fromX;
    this.v = 2.2;
    this.t = 0;
    this.dive = 1; // 1 = 在深槽底下，0 = 在深槽上沿
    this._dv.fill(1);
    this.leaving = false;
    this.again = false;
    this.group.visible = true;
    // 先把身子摆到起点：不然头还停在原点（正好是沉船那儿），那一帧附近的鱼会被一个看不见的东西吓跑
    this.update(0, this.g.time || 0);
  }

  // 被网惊动、玩家推近冲洗、这一趟到头，或者游过头了：一头扎回深槽底、加快往西，四秒内看不见。
  // again：玩家还没看见过它，等下一回开船时再来一次
  leave(again = false) {
    if (!this.active || this.leaving) return;
    this.leaving = true;
    this.again = again;
  }

  // 沿深槽的上沿游（槽中心往北 12 米，底下是陡坡），远处贴着底、沉在深处；经过的那一段往镜头看的地方靠、浮上来：
  // 水下 8 米左右（离底至少 2.5 米），一条比海底暗的长影。
  // dv：沉下去多少（0 = 在上沿，1 = 贴着深槽底）
  pathAt(x, out = new THREE.Vector3(), dv = 0) {
    const tz = trenchZ(x);
    let z = tz - 12;
    let w = 0;
    const F = this.focus;
    if (F) {
      w = Math.exp(-(((x - F.x) / 32) ** 2));
      // 不压到沉船船尾（船尾在 z≈18.5）
      // 往深槽那边让开一点：游戏里 7 米，效果页 13 米
      const want = clamp(F.z + (this.track ? 7 : 13), Math.max(tz - 22, 23), tz + 6);
      z += (want - z) * w;
    }
    const sb = seabedY(x, z);
    const far = Math.min(sb + 4.5, -13), near = Math.max(-8, sb + 2.5);
    let y = far + (near - far) * w;
    if (dv > 0) {
      z += (tz + 1 - z) * dv;
      y += (Math.min(seabedY(x, z) + 3, -24) - y) * dv;
    }
    return out.set(x, y, z);
  }

  update(dt, t) {
    if (!this.active) return;
    this.t += dt;
    // 逆着水流（水流往东）慢慢往西：出来时先在深槽底下停一停（鱼先逃），再浮上来；到船跟前放慢
    const g = this.g;
    const bp = g.boatCtl.pos;
    // 船在开：经过的那一段跟着船慢慢挪（头还没游到船跟前之前），好让它从船旁边、画面里过去
    const F = this.focus;
    if (F && this.track && !this.leaving && this.x > F.x) {
      const k = Math.min(1, dt * 0.8);
      F.x += (bp.x - F.x) * k;
      F.z += (bp.z - F.z) * k;
      this.toX = Math.max(LEVIATHAN_PATH.toX, F.x - 45);
    }
    if (!this.leaving && (this.x < this.toX || this.t > 50)) this.leave(false);
    if (this.leaving) {
      this.dive = Math.min(1.6, this.dive + dt / 2.5);
      if (this.dive >= 1.6) {
        this.active = false;
        this.done = !this.again;
        this.group.visible = false;
        return;
      }
    } else if (this.t > 2.5) this.dive = Math.max(0, this.dive - dt / 3.5);
    const near = Math.abs(this.x + LEN * 0.4 - bp.x) < 40;
    this.v = damp(this.v ?? 2.2, this.leaving ? 4.5 : this.dive > 0 ? 2.2 : near ? 1.9 : 3.2, 0.8, dt);
    this.x -= this.v * dt;
    // 脊线的控制点：沿深槽的路，加上从头往尾越来越大的摆动
    const C = this._ctrl;
    const n = new THREE.Vector3();
    const a = new THREE.Vector3(), b = new THREE.Vector3();
    for (let j = 0; j <= CTRL; j++) {
      const u = j / CTRL;
      const x = this.x + u * LEN;
      // 浮上来、扎下去都是头先、身子一节节跟着
      // （中途改主意——浮到一半被惊动——也不跳：每一节往目标缓一缓）
      const dv = (this._dv[j] = damp(this._dv[j], smoothstep(0, 1, this.dive * 1.6 - (this.leaving ? u : 1 - u) * 0.6), 6, dt));
      const p = this.pathAt(x, C[j], dv);
      this.pathAt(x + 0.5, a, dv);
      this.pathAt(x - 0.5, b, dv);
      n.subVectors(a, b).normalize();
      const wave = Math.sin(t * 0.9 - u * 6.7) * (0.25 + u * 1.5);
      p.x += -n.z * wave;
      p.z += n.x * wave;
      p.y += Math.sin(t * 0.6 - u * 4.8) * 0.35;
    }
    const spineAt = (u, out) => {
      const f = u * CTRL;
      const i = Math.min(CTRL - 1, Math.floor(f));
      const w = f - i;
      const p0 = C[Math.max(0, i - 1)], p1 = C[i], p2 = C[i + 1], p3 = C[Math.min(CTRL, i + 2)];
      // Catmull-Rom
      const w2 = w * w, w3 = w2 * w;
      out.set(0, 0, 0)
        .addScaledVector(p0, -0.5 * w3 + w2 - 0.5 * w)
        .addScaledVector(p1, 1.5 * w3 - 2.5 * w2 + 1)
        .addScaledVector(p2, -1.5 * w3 + 2 * w2 + 0.5 * w)
        .addScaledVector(p3, 0.5 * w3 - 0.5 * w2);
      return out;
    };
    // 在深槽底下时身子收小一点：只在深处出现
    const s = 1 - smoothstep(0, 1, this.dive);
    this.body.pose(spineAt, t, 0.6 + 0.4 * s);
    spineAt(0, this.head);
    for (const sg of this.segs) spineAt(clamp(sg.k, 0, 1), sg.m.position);
  }
}

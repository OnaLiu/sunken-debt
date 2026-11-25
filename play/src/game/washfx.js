// 揭晓这一串（效果清单第四批）：B12 网包落甲板、B13 慢揭晓、B14 泥壳整块剥落、B15 冲到实物、B16 冲洗加快、B17 揭幕。
// reveal.js 管阶段和时长（落包 → 冲洗 4.2 / 5.4 秒 → 确认 → 展示 → 拉回），这里管这一串看起来、听起来是什么样：
//   B12 落包：网口“咔”地松开，泥包按重力掉下去（掉的时候拉长一点），砸扁；真的泥块弹出去、落在甲板上留着，冲洗时被水推开化掉
//   B13 冲洗：两道看得见的水柱，打在泥上溅起泥水（越冲越清），泥水在甲板上往外淌；三段——前段掉外壳；中段露出轮廓，
//       水在每件东西上先冲开一块“窗口”露出材质，镜头轻轻凑过去；后段窗口扩到整件、附着的贝壳碎掉，露出关键特征
//   B14 泥壳：外壳事先裂成几块厚泥板，按水打到的先后一块块翻下来、落到格栅上“噗”一声、摊开化掉
//   B15 冲到实物：轮到哪件，哪件的窗口冲开、按材质亮一下或崩出碎屑、响一声，水声跟着变调；两件之间至少隔 0.3 秒
//   B16 加快：按下那一帧水泵“轰”一声，水柱变粗变亮、水声变急变响、溅得更猛，计时数字一跳（界面那边画）
//   B17 揭幕：确认那一拍，一道反光沿物件长轴扫过去（硬东西再带一声很轻的上滑音）
import * as THREE from 'three';
import { Builder, col } from '../core/geo.js';
import { worldMat } from '../render/materials.js';
import { BOAT } from './boat.js';
import { fxTag } from '../fx/tags.js';

const MUD = [0.42, 0.33, 0.22], CLEAR = [0.76, 0.85, 0.89];
const MAT_CN = { metal: '金属', ceramic: '陶瓷', glass: '玻璃', wood: '木头', stone: '石头', cloth: '布包', live: '活物' };
// 冲到实物（B15）：窗口冲开那一下亮成什么颜色、亮多少，崩出来的是什么
const HIT = {
  metal: { glow: [1.0, 0.84, 0.58], a: 0.6, chips: 'spark' },
  glass: { glow: [0.86, 0.96, 1.0], a: 0.65, chips: 'spark' },
  ceramic: { glow: [0.95, 0.98, 1.0], a: 0.38, chips: 'glaze' },
  wood: { glow: [0.95, 0.72, 0.45], a: 0.12, chips: 'splinter' },
  stone: { glow: [0.85, 0.85, 0.8], a: 0.1, chips: 'grit' },
  cloth: { glow: [0.6, 0.62, 0.66], a: 0.0, chips: 'soak' },
  live: { glow: [1.0, 0.6, 0.45], a: 0.1, chips: 'soak' },
};
// 揭幕（B17）：反光扫过去有多亮
const SHEEN = { metal: 0.85, glass: 0.85, ceramic: 0.6, wood: 0.32, stone: 0.3, cloth: 0.14 };
const smoothRange = (x, a, b) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const mix3 = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
const _v = new THREE.Vector3(), _w = new THREE.Vector3(), _q = new THREE.Quaternion(), _m = new THREE.Matrix4(), _s = new THREE.Vector3(), _e = new THREE.Euler();
const UP = new THREE.Vector3(0, 1, 0);

// —— B12：甲板上的泥块（真的落在甲板上、留着，冲洗时被水推开化掉）——
const DMAX = 64;
class Debris {
  constructor(deck) {
    const b = new Builder();
    b.add(new THREE.IcosahedronGeometry(1, 0), col(0xffffff));
    this.mesh = new THREE.InstancedMesh(b.build(), worldMat({ key: 'debris' }), DMAX);
    this.mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(DMAX * 3).fill(1), 3);
    this.mesh.count = 0; this.mesh.castShadow = true; this.mesh.frustumCulled = false;
    deck.add(this.mesh);
    this.list = [];
  }
  // 一把泥块从网包底边四溅出去（甲板局部坐标）；越重飞得越远、块越大
  burst(x, y, z, R, n, c, wt) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, sp = (1.0 + Math.random() * 1.8) * (0.8 + wt * 0.5);
      if (this.list.length >= DMAX) this.list.shift();
      const j = 0.72 + Math.random() * 0.42;
      this.list.push({
        x: x + Math.cos(a) * R * 0.8, y: y + 0.04 + Math.random() * 0.14, z: z + Math.sin(a) * R * 0.8,
        vx: Math.cos(a) * sp, vy: 0.8 + Math.random() * 1.9, vz: Math.sin(a) * sp,
        s: (0.03 + Math.random() * 0.05) * (0.85 + wt * 0.5), sy: 0.55 + Math.random() * 0.3, flat: 1,
        rx: Math.random() * 6, ry: Math.random() * 6, rz: Math.random() * 6, w: 6 + Math.random() * 10,
        st: 'fly', t: 0, washK: 0.1 + Math.random() * 0.62, c: [c[0] * j, c[1] * j, c[2] * j],
      });
    }
  }
  // wk：冲洗进度（没在冲为 null）；cx, cz：清洗位；water(x, y, z, k)：化开时冒的一点泥水
  update(dt, wk, cx, cz, water) {
    let n = 0;
    const M = this.mesh;
    for (const d of this.list) {
      d.t += dt;
      if (d.st === 'fly') {
        d.vy -= 9.8 * dt; d.x += d.vx * dt; d.y += d.vy * dt; d.z += d.vz * dt;
        d.rx += d.w * dt * 0.7; d.rz += d.w * dt * 0.5;
        const floor = BOAT.deckY + d.s * d.sy * 0.55;
        const onDeck = Math.abs(d.x) < 2.55 && d.z > -7.4 && d.z < 6.6;
        if (onDeck && d.y <= floor && d.vy < 0) {
          d.y = floor;
          if (d.vy < -2.4 && !d.bounced) { d.bounced = true; d.vy = -d.vy * 0.22; d.vx *= 0.5; d.vz *= 0.5; d.w *= 0.4; }
          else { d.vy = 0; d.st = 'rest'; d.t = 0; d.rx = 0; d.rz = 0; }
        }
        if (d.y < -0.5) d.dead = true; // 飞出船舷掉进海里
      } else if (d.st === 'rest') {
        const f = Math.exp(-dt * 8); d.vx *= f; d.vz *= f; d.x += d.vx * dt; d.z += d.vz * dt;
        d.flat += (0.55 - d.flat) * Math.min(1, dt * 7);
        // 水冲到它：被推开、化掉（没在冲洗了还剩的，也一起化掉）
        if (wk == null || wk >= d.washK) {
          const ax = d.x - cx, az = d.z - cz, L = Math.hypot(ax, az) || 1, sp = 0.7 + Math.random() * 0.8;
          d.vx = ax / L * sp; d.vz = az / L * sp; d.st = 'wash'; d.t = 0;
        }
      } else if (d.st === 'wash') {
        const f = Math.exp(-dt * 2.5); d.vx *= f; d.vz *= f; d.x += d.vx * dt; d.z += d.vz * dt;
        d.flat = 0.55 * Math.max(0, 1 - d.t / 0.75);
        if (Math.random() < dt * 10) water(d.x, d.y, d.z, d.t);
        if (d.t > 0.75) d.dead = true;
      }
      if (d.dead) continue;
      _e.set(d.rx, d.ry, d.rz); _q.setFromEuler(_e);
      _s.set(d.s * (1 + (1 - d.flat) * 0.6), d.s * d.sy * d.flat, d.s * (1 + (1 - d.flat) * 0.6));
      _m.compose(_v.set(d.x, d.y - (1 - d.flat) * d.s * 0.4, d.z), _q, _s);
      M.setMatrixAt(n, _m);
      M.instanceColor.setXYZ(n, d.c[0], d.c[1], d.c[2]);
      n++;
    }
    if (this.list.some((d) => d.dead)) this.list = this.list.filter((d) => !d.dead);
    M.count = n;
    M.instanceMatrix.needsUpdate = true; M.instanceColor.needsUpdate = true;
  }
  clear() { this.list = []; this.mesh.count = 0; }
}

// —— B14：外壳裂成几块厚泥板 ——
// geo：外壳（非索引、带顶点色，网包局部坐标）；按三角形朝哪个方向分给最近的“种子方向”，每块往里加厚一层（里面更暗更湿）、断面封一圈
function fracture(geo, R, n, seed, mat) {
  const P = geo.attributes.position, C = geo.attributes.color;
  const cy = R * 0.55, cen = new THREE.Vector3(0, cy, 0);
  const seeds = [];
  for (let i = 0; i < n; i++) {
    // 斐波那契分布，只铺上半球到腰下一点（贴着甲板的底不单独成块）
    const y = 1 - (i + 0.5) / n * 1.3, r = Math.sqrt(Math.max(0, 1 - y * y)), a = i * 2.39996 + seed;
    seeds.push(new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r).normalize());
  }
  const groups = seeds.map(() => []);
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), m = new THREE.Vector3();
  for (let i = 0; i < P.count; i += 3) {
    a.fromBufferAttribute(P, i); b.fromBufferAttribute(P, i + 1); c.fromBufferAttribute(P, i + 2);
    m.copy(a).add(b).add(c).multiplyScalar(1 / 3).sub(cen); m.y /= 0.66; m.normalize();
    const jit = (Math.sin(a.x * 41.3 + a.z * 17.1 + a.y * 29.7) * 0.5 + 0.5) * 0.16;
    let bi = 0, bd = -9;
    seeds.forEach((s, k) => { const d = s.dot(m) + (k % 2 ? jit : -jit); if (d > bd) { bd = d; bi = k; } });
    groups[bi].push(i);
  }
  const th = Math.max(0.05, R * 0.17);
  const key = (v) => `${Math.round(v.x * 2e3)},${Math.round(v.y * 2e3)},${Math.round(v.z * 2e3)}`;
  const inner = (v) => { const d = v.clone().sub(cen); const L = d.length() || 1; return v.clone().sub(d.multiplyScalar(Math.min(0.6, th / L))); };
  const cc = new THREE.Color();
  const out = [];
  groups.forEach((tris, gi) => {
    if (!tris.length) return;
    const B = new Builder();
    const ctr = new THREE.Vector3();
    const edges = new Map();
    for (const i of tris) {
      const vs = [0, 1, 2].map((k) => new THREE.Vector3().fromBufferAttribute(P, i + k));
      ctr.add(vs[0]).add(vs[1]).add(vs[2]);
      const c0 = new THREE.Color().fromBufferAttribute(C, i);
      B.tri(vs[0], vs[1], vs[2], c0);
      const iv = vs.map(inner);
      B.tri(iv[0], iv[2], iv[1], cc.copy(c0).multiplyScalar(0.42));
      for (let k = 0; k < 3; k++) {
        const p = vs[k], q = vs[(k + 1) % 3], ka = key(p), kb = key(q);
        const ek = ka < kb ? ka + '|' + kb : kb + '|' + ka;
        const e = edges.get(ek); if (e) e.n++; else edges.set(ek, { n: 1, p, q, c: c0 });
      }
    }
    ctr.multiplyScalar(1 / (tris.length * 3));
    for (const e of edges.values()) {
      if (e.n !== 1) continue;
      const ip = inner(e.p), iq = inner(e.q), sc = cc.copy(e.c).multiplyScalar(0.6);
      B.tri(e.p, iq, e.q, sc); B.tri(e.p, ip, iq, sc);
    }
    const g = B.build();
    g.translate(-ctr.x, -ctr.y, -ctr.z);
    g.computeBoundingSphere();
    const mesh = new THREE.Mesh(g, mat);
    mesh.position.copy(ctr); mesh.castShadow = true;
    const dir = ctr.clone().sub(cen); dir.y /= 0.66; dir.normalize();
    const h = new THREE.Vector3(dir.x, 0, dir.z);
    if (h.lengthSq() < 0.02) h.set(Math.cos(gi * 2.4), 0, Math.sin(gi * 2.4));
    h.normalize();
    out.push({ mesh, base: ctr.clone(), dir, hdir: h, size: Math.min(1, g.boundingSphere.radius / 0.45), th, st: 'on', t: 0, v: new THREE.Vector3(), w: new THREE.Vector3(), k: 1 });
  });
  return out;
}

// —— B13 / B16：看得见的水柱（从枪口到泥包，压力大时更直、更粗）——
const JS = 16, JR = 8;
const JET_VS = `varying vec2 vUv; varying vec3 vN; varying vec3 vW;
void main() { vUv = uv; vN = normal; vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`;
const JET_FS = `uniform float uT; uniform float uA; uniform float uFast; varying vec2 vUv; varying vec3 vN; varying vec3 vW;
float h1(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
float n2(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(h1(i), h1(i + vec2(1.0, 0.0)), f.x), mix(h1(i + vec2(0.0, 1.0)), h1(i + vec2(1.0, 1.0)), f.x), f.y); }
void main() {
  vec3 V = normalize(cameraPosition - vW);
  float fr = 1.0 - abs(dot(normalize(vN), V));
  float s = vUv.y;
  float flow = n2(vec2(vUv.x * 6.0, s * 16.0 - uT * (24.0 + 16.0 * uFast))) * 0.6 + n2(vec2(vUv.x * 13.0 + 3.0, s * 38.0 - uT * 40.0)) * 0.4;
  float a = uA * (0.3 + 0.7 * fr) * (0.5 + 0.65 * flow);
  a *= smoothstep(0.0, 0.05, s) * (1.0 - 0.3 * smoothstep(0.8, 1.0, s));
  vec3 c = mix(vec3(0.7, 0.83, 0.9), vec3(0.97, 1.0, 1.0), clamp(fr * 0.6 + flow * 0.5, 0.0, 1.0));
  gl_FragColor = vec4(c, clamp(a, 0.0, 0.9));
  #include <colorspace_fragment>
}`;
function jetMaterial() {
  return new THREE.ShaderMaterial({ uniforms: { uT: { value: 0 }, uA: { value: 0.55 }, uFast: { value: 0 } }, vertexShader: JET_VS, fragmentShader: JET_FS, transparent: true, depthWrite: false, side: THREE.DoubleSide });
}
class Jet {
  constructor(scene) {
    const nV = (JS + 1) * JR;
    this.pos = new Float32Array(nV * 3); this.nrm = new Float32Array(nV * 3);
    const uv = new Float32Array(nV * 2), idx = [];
    for (let i = 0; i <= JS; i++) for (let j = 0; j < JR; j++) { uv[(i * JR + j) * 2] = j / JR; uv[(i * JR + j) * 2 + 1] = i / JS; }
    for (let i = 0; i < JS; i++) for (let j = 0; j < JR; j++) { const a = i * JR + j, b = i * JR + (j + 1) % JR; idx.push(a, a + JR, b, b, a + JR, b + JR); }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(this.pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(this.nrm, 3)); g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); g.setIndex(idx);
    this.mat = jetMaterial();
    this.mesh = new THREE.Mesh(g, this.mat); this.mesh.frustumCulled = false; this.mesh.visible = false; this.mesh.renderOrder = 4;
    scene.add(this.mesh);
    this.seen = false;
    this.mid = new THREE.Vector3(); this.p = new THREE.Vector3(); this.tg = new THREE.Vector3(); this.n1 = new THREE.Vector3(); this.n2 = new THREE.Vector3();
  }
  set(from, to, r0, r1, sag) {
    const M = this.mid.copy(from).add(to).multiplyScalar(0.5); M.y += sag;
    for (let i = 0; i <= JS; i++) {
      const s = i / JS, u = 1 - s;
      this.p.set(0, 0, 0).addScaledVector(from, u * u).addScaledVector(M, 2 * u * s).addScaledVector(to, s * s);
      this.tg.copy(M).sub(from).multiplyScalar(2 * u).addScaledVector(_w.copy(to).sub(M), 2 * s).normalize();
      this.n1.crossVectors(this.tg, UP); if (this.n1.lengthSq() < 1e-4) this.n1.set(1, 0, 0); this.n1.normalize();
      this.n2.crossVectors(this.n1, this.tg).normalize();
      const r = r0 + (r1 - r0) * Math.pow(s, 1.3);
      for (let j = 0; j < JR; j++) {
        const a = j / JR * Math.PI * 2, ca = Math.cos(a), sa = Math.sin(a), o = (i * JR + j) * 3;
        const nx = this.n1.x * ca + this.n2.x * sa, ny = this.n1.y * ca + this.n2.y * sa, nz = this.n1.z * ca + this.n2.z * sa;
        this.nrm[o] = nx; this.nrm[o + 1] = ny; this.nrm[o + 2] = nz;
        this.pos[o] = this.p.x + nx * r; this.pos[o + 1] = this.p.y + ny * r; this.pos[o + 2] = this.p.z + nz * r;
      }
    }
    const g = this.mesh.geometry; g.attributes.position.needsUpdate = true; g.attributes.normal.needsUpdate = true;
  }
}

// 着色器预热用：和揭晓时同样的材质（泥块、泥板、水柱）
export function washWarmMeshes() {
  const b = new Builder(); b.add(new THREE.IcosahedronGeometry(0.1, 0), col(0x5a4a34));
  const im = new THREE.InstancedMesh(b.build(), worldMat({ key: 'debris' }), 2);
  im.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(6).fill(1), 3);
  const slab = new THREE.Mesh(b.build(), worldMat({ key: 'slab', side: THREE.DoubleSide }));
  const jet = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.06, 1, 8, 4, true), jetMaterial());
  return [im, slab, jet];
}

export class WashFx {
  constructor(game) {
    this.g = game;
    this.debris = new Debris(game.boat.deck);
    this.slabMat = worldMat({ key: 'slab', side: THREE.DoubleSide });
    this.jets = new Map(); // 冲洗手 → 水柱
    this.t = 0;
    game.crew.hoseFx = (s, from, to) => this.hose(s, from, to);
  }

  // —— B12 落包 ——
  // 网口松开：铁扣一响，泥包从网里往下掉（reveal.begin 里，泥包从网的高度起落）
  release(A) {
    const g = this.g;
    g.audio && g.audio.play('release', { mass: A.wn });
    fxTag('B12', '网包落甲板·网口松开', 'B12');
  }
  // 砸到甲板那一帧：真的泥块弹出去（越重越多、越远），落在甲板上留着，冲洗时被水推开化掉
  impact(A) {
    const w = BOAT.washLocal;
    const n = 12 + Math.round(A.wn * 16) + (A.precious ? 6 : 0);
    this.debris.burst(w.x, BOAT.deckY, w.z, A.R, n, A.st.chip, A.wn);
    fxTag('B12', '网包落甲板·砸下来', 'B12');
  }

  // —— B14：外壳裂成几块（begin 里，外壳刚建好时）——
  prepare(A) {
    const n = Math.max(7, Math.min(11, Math.round(6 + A.R * 4)));
    A.slabs = fracture(A.shell.geometry, A.R, n, Math.random() * 6.28, this.slabMat);
    for (const s of A.slabs) A.bundle.add(s.mesh);
    A.shell.visible = false;
    // 先掉哪块：水从上面和两侧打过来——顶上的先翻，接着是左右两侧（在镜头里侧着翻下去，看得清），朝镜头的那几块往镜头这边倒，背面最后
    const a = A.camSide, toCam = new THREE.Vector3(Math.sin(a), 0, Math.cos(a)), right = new THREE.Vector3(Math.cos(a), 0, -Math.sin(a));
    const score = (s) => s.dir.y * 0.9 + Math.abs(s.dir.dot(right)) * 0.6 + s.dir.dot(toCam) * 0.2 + Math.random() * 0.22 - (s.dir.y < -0.15 ? 2 : 0);
    const order = A.slabs.map((s) => [score(s), s]).sort((x, y) => y[0] - x[0]).map((x) => x[1]);
    order.forEach((s, i) => { s.k = 0.08 + 0.33 * Math.pow(i / Math.max(1, order.length - 1), 0.85); });
    A.slabsLeft = A.slabs.length;
    A.washStage = -1;
    A.holes = 0;
  }

  // —— 冲洗中每一帧（reveal.update 的冲洗阶段）——
  wash(dt, A, k) {
    const g = this.g;
    this.stageTags(A, k);
    if (A.slabs) this.updateSlabs(dt, A, k);
    // 网绳和碎壳跟着第二块泥板一起滑下去
    if (A.extraMesh.visible) {
      const k0 = A.slabs ? (A.slabs.map((s) => s.k).sort((x, y) => x - y)[1] || 0.15) : 0.2;
      if (k > k0) { A.ropeT = (A.ropeT || 0) + dt; A.extraMesh.position.y = -0.6 * A.ropeT * A.ropeT * 4; A.extraMesh.rotation.z = A.ropeT * 0.5; if (A.ropeT > 0.3) A.extraMesh.visible = false; }
    }
    // 后段：附着的贝壳、藤壶碎成小片掉下来（关键特征露出来）
    if (k > 0.62 && k < 0.9 && Math.random() < dt * 14) {
      const e = A.entries[Math.floor(Math.random() * A.entries.length)];
      if (e.kind === 'item' && e.it.attachMesh.visible) {
        e.mesh.getWorldPosition(_v); _v.y += e.it.h * (0.3 + Math.random() * 0.6);
        const r = e.it.r * 0.7, an = Math.random() * 6.28;
        g.particles.water.emit(_v.x + Math.cos(an) * r, _v.y, _v.z + Math.sin(an) * r, Math.cos(an) * 0.6, 0.6 + Math.random() * 0.8, Math.sin(an) * 0.6, 0.6, 0.035 + Math.random() * 0.03, 0.82, 0.8, 0.72, 1, 0, 0.2, 9.8, 0);
      }
    }
    // 窗口：冲开以后越冲越大，后段扩到整件
    for (const e of A.entries) if (e.win) this.updateWindow(dt, A, e, k);
    // 甲板上的泥水往外淌（越冲越清）
    const cl = smoothRange(k, 0.12, 0.9);
    if (Math.random() < dt * (A.fast ? 34 : 18)) {
      const an = Math.random() * 6.28, w = BOAT.washLocal;
      _v.set(w.x + Math.cos(an) * A.R * 0.9, BOAT.deckY + 0.03, w.z + Math.sin(an) * A.R * 0.9); g.boat.deck.localToWorld(_v);
      _w.set(Math.cos(an), 0, Math.sin(an)).transformDirection(g.boat.deck.matrixWorld);
      const c = mix3([MUD[0] * 0.8, MUD[1] * 0.8, MUD[2] * 0.8], CLEAR, cl * 0.75);
      g.particles.water.emit(_v.x, _v.y, _v.z, _w.x * 0.55, 0, _w.z * 0.55, 1.3 + Math.random() * 0.6, 0.12 + Math.random() * 0.06, c[0], c[1], c[2], 0.5, 1.4, 1.1, 0, 0.15);
    }
    // 镜头凑近一点看冲开的那一角（普通的一网；珍品的推近是憋住那一段管）
    if (!A.precious) A.peekCam = Math.min(1, (A.peekCam || 0) + dt * (A.peekOn ? 2.2 : 0)); // （A.peek 是珍品露头那一角，C5）
  }
  // B13 三段：一个效果分三段，标签只刷新一条
  stageTags(A, k) {
    const st = k < 0.42 ? 0 : k < 0.74 ? 1 : 2;
    if (st === A.washStage) return;
    A.washStage = st;
    fxTag('B13', ['冲洗·前段：冲掉外壳', '冲洗·中段：露出轮廓和材质', '冲洗·后段：露出关键特征'][st], 'B13');
  }
  updateSlabs(dt, A, k) {
    const g = this.g;
    for (const s of A.slabs) {
      if (s.st === 'gone') continue;
      s.t += dt;
      const m = s.mesh;
      if (s.st === 'on') {
        if (k >= s.k) { s.st = 'crack'; s.t = 0; g.audio && g.audio.play('slab', { size: s.size }); }
        continue;
      }
      if (s.st === 'crack') {
        // 先裂开一条缝：往外顶出来一点、晃一下
        const u = Math.min(1, s.t / 0.1);
        m.position.copy(s.base).addScaledVector(s.dir, 0.035 * u);
        m.rotation.set((Math.random() - 0.5) * 0.04, 0, (Math.random() - 0.5) * 0.04);
        if (u >= 1) {
          s.st = 'fall'; s.t = 0;
          const sp = (0.5 + Math.random() * 0.5) * (1 + A.R * 0.25) * (A.fast ? 1.4 : 1);
          s.v.copy(s.hdir).multiplyScalar(sp); s.v.y = s.dir.y > 0.55 ? 0.5 : 0.2;
          s.w.crossVectors(UP, s.hdir).normalize().multiplyScalar(3 + Math.random() * 3);
          fxTag('B14', '泥壳整块剥落', 'B14');
          A.slabsLeft--;
        }
        continue;
      }
      if (s.st === 'fall' || s.st === 'rest') {
        if (s.st === 'fall') s.v.y -= 9.8 * dt;
        else { const f = Math.exp(-dt * 5); s.v.x *= f; s.v.z *= f; s.w.multiplyScalar(Math.exp(-dt * 6)); }
        m.position.addScaledVector(s.v, dt);
        const wl = s.w.length();
        if (wl > 1e-3) { _q.setFromAxisAngle(_w.copy(s.w).multiplyScalar(1 / wl), wl * dt); m.quaternion.premultiply(_q); }
        const floor = s.th * 0.55;
        if (s.st === 'fall' && m.position.y < floor && s.v.y < 0) {
          // 落到格栅上：“噗”一声，泥水溅开
          m.position.y = floor; s.v.y = 0; s.v.x *= 0.45; s.v.z *= 0.45; s.w.multiplyScalar(0.25);
          s.st = 'rest'; s.t = 0;
          if (this.t - (this.lastLand || -1) > 0.07) { this.lastLand = this.t; g.audio && g.audio.play('slabLand', { size: s.size }); }
          m.getWorldPosition(_v);
          const c = A.st.chip;
          for (let i = 0; i < 8; i++) { const an = Math.random() * 6.28, sp = 0.6 + Math.random() * 1.2; g.particles.water.emit(_v.x, _v.y, _v.z, Math.cos(an) * sp, 0.5 + Math.random() * 1.1, Math.sin(an) * sp, 0.45 + Math.random() * 0.25, 0.05 + Math.random() * 0.05, c[0], c[1], c[2], 1, 0, 0.4, 9.8, 0); }
        }
        if (s.st === 'rest' && s.t > 0.22) { s.st = 'melt'; s.t = 0; s.q0 = m.quaternion.clone(); }
        continue;
      }
      if (s.st === 'melt') {
        // 摊开、化成泥水流走
        const u = Math.min(1, s.t / 0.65);
        m.scale.set(1 + 0.35 * u, Math.max(0.05, 1 - 0.9 * u), 1 + 0.35 * u);
        m.position.y = s.th * 0.55 * (1 - u * 0.8);
        if (Math.random() < dt * 12) { m.getWorldPosition(_v); const c = A.st.chip; g.particles.water.emit(_v.x, _v.y, _v.z, (Math.random() - 0.5) * 0.6, 0.1, (Math.random() - 0.5) * 0.6, 0.9, 0.1, c[0], c[1], c[2], 0.6, 1.2, 1.2, 0, 0.15); }
        if (u >= 1) { s.st = 'gone'; m.visible = false; }
      }
    }
  }

  // —— 水柱（每个冲洗手每帧调一次）——
  hose(s, from, to) {
    const g = this.g, A = g.reveal.active;
    let J = this.jets.get(s);
    if (!J) { J = new Jet(g.view.scene); this.jets.set(s, J); }
    J.seen = true;
    if (!A) return;
    const k = Math.min(1, A.washT / A.washDur), fast = A.fast;
    // 水打在哪：现在泥的外表面（外壳掉完以后是里面裹着东西的那几团）
    const cen = _v.copy(to);
    A.bundle.getWorldPosition(_w); cen.x = _w.x; cen.z = _w.z;
    const rr = A.R + (Math.max(0.2, (A.main.kind === 'item' ? A.main.it.r : 0.25) * 0.9) - A.R) * smoothRange(k, 0.1, 0.45);
    const dir = _w.copy(from).sub(cen); dir.y = 0; dir.normalize();
    const hit = new THREE.Vector3(cen.x + dir.x * rr, BOAT.deckY + Math.min(0.55, rr * 0.75) + 0.05, cen.z + dir.z * rr);
    hit.y = Math.max(to.y - 0.25, Math.min(hit.y, to.y + 0.3));
    // 珍品露头（C5）：两支水枪一起压到水下见过的那一角（crew.hoseAim），打在那一点上
    if (g.crew.hoseAim) hit.copy(to);
    // 加快：水柱粗一倍、更直，水压一阵阵地顶（粗细跟着抖）
    const pr = A.fastAt != null ? Math.max(0, 1 - (g.time - A.fastAt) / 0.25) : 0;
    const pulse = fast ? 1 + 0.12 * Math.sin(this.t * 47) + 0.35 * pr * pr : 1;
    const pp = A.pulseAt != null ? Math.max(0, 1 - (g.time - A.pulseAt) / 0.2) : 0;
    // 珍品最后 1 秒（C5）：水枪收小，水柱细一半、淡一点，溅得少
    const soft = !fast && g.crew.hoseSoft ? 0.5 : 1;
    const r0 = (fast ? 0.038 : 0.022) * (pulse + pp * 0.3) * soft, r1 = (fast ? 0.12 : 0.066) * (pulse + pp * 0.3) * soft;
    J.set(from, hit, r0, r1, fast ? 0.04 : 0.12);
    J.hit = hit;
    J.mat.uniforms.uA.value = fast ? 0.78 : 0.55 * (0.5 + 0.5 * soft);
    J.mat.uniforms.uFast.value = fast ? 1 : 0;
    // 打在泥上溅起来的水：先是泥色，越冲越清
    const cl = smoothRange(k, 0.12, 0.9), c = mix3(MUD, CLEAR, cl);
    // 越往后溅得越低、越碎：别让一团白水把刚露出来的东西挡住
    const n = fast ? 3 : soft < 1 ? 1 : 2, up = 1 - 0.55 * cl;
    for (let i = 0; i < n; i++) {
      const an = Math.atan2(dir.z, dir.x) + (Math.random() - 0.5) * 2.4, sp = (fast ? 1.6 : 1.0) + Math.random() * 1.4;
      g.particles.water.emit(hit.x, hit.y, hit.z, Math.cos(an) * sp, (0.5 + Math.random() * (fast ? 2.0 : 1.3)) * up, Math.sin(an) * sp, 0.26 + Math.random() * 0.2, 0.022 + Math.random() * 0.026, c[0], c[1], c[2], 0.8, 0.3, 0.5, 9.8, 0);
    }
    if (Math.random() < (fast ? 0.3 : 0.1)) g.particles.water.emit(hit.x, hit.y + 0.05, hit.z, (Math.random() - 0.5) * 0.5, 0.35, (Math.random() - 0.5) * 0.5, 0.4, 0.09, c[0] * 0.5 + 0.4, c[1] * 0.5 + 0.43, c[2] * 0.5 + 0.44, 0.16, 1.4, 1.0, 0, 0.1);
    // 水柱上甩下来的一两颗水珠（小的，不是一团）
    if (Math.random() < (fast ? 0.5 : 0.22)) {
      const u = 0.25 + Math.random() * 0.6;
      g.particles.water.emit(from.x + (hit.x - from.x) * u, from.y + (hit.y - from.y) * u + 0.1, from.z + (hit.z - from.z) * u, (Math.random() - 0.5) * 0.5, -0.2, (Math.random() - 0.5) * 0.5, 0.35, 0.02 + Math.random() * 0.015, 0.8, 0.9, 0.95, 0.85, 0, 0, 9.8, 0);
    }
  }

  // —— B15：冲到实物 ——
  // 窗口开在朝镜头、偏上的那一面（水从上往下冲，玩家看得见），先“噗”地冲开一小块，再越冲越大
  hit(A, e, isMain) {
    const g = this.g;
    const mat = e.kind === 'item' ? (e.it.def && e.it.def.mat) || 'metal' : 'live';
    fxTag('B15', '冲到实物·' + (MAT_CN[mat] || mat), 'B15');
    if (isMain) { g.audio && g.audio.play('hoseTone', { mat }); A.hoseMat = mat; if (!A.precious) A.peekOn = true; }
    const H = HIT[mat] || HIT.metal;
    // 点在哪：物件上方朝镜头的一面（世界坐标）
    const p = new THREE.Vector3(); e.mesh.getWorldPosition(p);
    const r = e.kind === 'item' ? e.it.r : 0.25, h = e.kind === 'item' ? e.it.h : 0.2;
    const cam = g.view.camera.position;
    const tc = _w.set(cam.x - p.x, 0, cam.z - p.z).normalize();
    const wp = p.clone().addScaledVector(tc, r * 0.35); wp.y += h * 0.75 + 0.02;
    // 裹着它的那团泥在这一块崩掉（泥团上开个洞）
    if (A.coreMesh.visible && A.holes < 3 && !(isMain && A.precious)) {
      const lp = A.bundle.worldToLocal(wp.clone());
      A.coreMesh.material.userData.u.uHole.value[A.holes].set(lp.x, lp.y, lp.z, 0.001);
      e.hole = A.holes++;
    }
    // 窗口（珍品自己的露头留给珍品那一串：只给它响和闪，不开窗口）
    if (e.kind === 'item' && !(isMain && A.precious)) {
      const body = e.it.body, gb = body.geometry.boundingBox || (body.geometry.computeBoundingBox(), body.geometry.boundingBox);
      const sz = gb.getSize(new THREE.Vector3()), dim = Math.max(sz.x, sz.y, sz.z);
      const lw = body.worldToLocal(wp.clone());
      // 窗口中心贴回物件表面附近（包围盒里），半径从物件大小的三成起
      const ctr = gb.getCenter(new THREE.Vector3());
      lw.sub(ctr).clampLength(0, dim * 0.5).add(ctr);
      e.win = { c: lw, r0: dim * 0.34, r1: dim * 1.35, k0: Math.min(1, A.washT / A.washDur), t: 0, H, dim };
      const u = body.material.userData.u;
      u.uWin.value.set(lw.x, lw.y, lw.z, 0.0001);
      u.uWinGlow.value.set(H.glow[0], H.glow[1], H.glow[2], 0);
    }
    // 按材质崩出来的东西：金属和玻璃溅起亮的水星、瓷器一点釉光、木头崩出几根木屑、石头一小撮砂、布包和活物只是湿水四溅
    const n = isMain ? 1 : 0.6;
    const em = (pool, vx, vy, vz, life, size, c, a = 1, grav = 9.8, fin = 0) => pool.emit(wp.x, wp.y, wp.z, vx, vy, vz, life, size, c[0], c[1], c[2], a, 0, 0.6, grav, fin);
    const rnd = () => (Math.random() - 0.5);
    if (H.chips === 'spark') for (let i = 0; i < 7 * n; i++) em(g.particles.spark, tc.x * 0.8 + rnd() * 1.4, 0.8 + Math.random() * 1.2, tc.z * 0.8 + rnd() * 1.4, 0.3 + Math.random() * 0.25, 0.03 + Math.random() * 0.03, mat === 'glass' ? [0.85, 0.95, 1.0] : [1.0, 0.9, 0.6], 1, 5);
    else if (H.chips === 'glaze') for (let i = 0; i < 5 * n; i++) em(g.particles.spark, rnd() * 0.9, 0.5 + Math.random() * 0.8, rnd() * 0.9, 0.35, 0.03, [0.92, 0.96, 1.0], 0.8, 4);
    else if (H.chips === 'splinter') for (let i = 0; i < 8 * n; i++) em(g.particles.water, tc.x + rnd() * 1.6, 0.9 + Math.random() * 1.2, tc.z + rnd() * 1.6, 0.55, 0.035 + Math.random() * 0.02, [0.55, 0.4, 0.24]);
    else if (H.chips === 'grit') for (let i = 0; i < 8 * n; i++) em(g.particles.water, rnd() * 1.4, 0.4 + Math.random() * 0.8, rnd() * 1.4, 0.5, 0.03, [0.62, 0.6, 0.55]);
    for (let i = 0; i < 9 * n; i++) em(g.particles.water, tc.x * 1.2 + rnd() * 1.6, 0.6 + Math.random() * 1.4, tc.z * 1.2 + rnd() * 1.6, 0.4 + Math.random() * 0.2, 0.05 + Math.random() * 0.03, A.st.chip);
  }
  updateWindow(dt, A, e, k) {
    const W = e.win, u = e.it.body.material.userData.u;
    W.t += dt;
    // 先“噗”地冲开一小块（0.16 秒，冲过头一点再回来），再随冲洗越冲越大
    const pop = Math.min(1, W.t / 0.16), ob = 1 + 0.25 * Math.sin(pop * Math.PI) * (1 - pop * 0.5);
    const grow = smoothRange(k, W.k0, Math.min(1, W.k0 + 0.42));
    u.uWin.value.w = (W.r0 * pop * ob) + (W.r1 - W.r0) * grow;
    u.uWinGlow.value.w = W.H.a * Math.exp(-W.t * 4.5);
    if (e.hole != null) A.coreMesh.material.userData.u.uHole.value[e.hole].w = u.uWin.value.w * 1.15;
  }

  // —— B16：加快 ——
  fast(A, first) {
    const g = this.g;
    if (first) {
      g.audio && g.audio.play('pump');
      g.audio && g.audio.play('hoseTone', { fast: 1 });
      fxTag('B16', '冲洗加快', 'B16');
      // 按下那一下：水柱打到的地方猛地溅开一大片
      for (const J of this.jets.values()) {
        const s = J.hit; if (!J.mesh.visible || !s) continue;
        for (let i = 0; i < 16; i++) { const an = Math.random() * 6.28, sp = 1.5 + Math.random() * 2; g.particles.water.emit(s.x, s.y, s.z, Math.cos(an) * sp, 1 + Math.random() * 2.5, Math.sin(an) * sp, 0.45, 0.05 + Math.random() * 0.05, 0.75, 0.82, 0.84, 0.9, 0, 0.4, 9.8, 0); }
      }
    } else {
      g.audio && g.audio.play('pump', { small: 1 });
      fxTag('B16', '冲洗加快（再催一下）', 'B16');
    }
  }

  // —— B17：揭幕那一拍，一道反光沿物件长轴扫过去 ——
  sweep(A) {
    const e = A.main;
    if (e.kind !== 'item') return;
    const mat = (e.it.def && e.it.def.mat) || 'metal';
    const gb = e.it.body.geometry.boundingBox || (e.it.body.geometry.computeBoundingBox(), e.it.body.geometry.boundingBox);
    const sz = gb.getSize(new THREE.Vector3());
    // 长轴；扫的方向带一点斜（看起来是光从一侧滑过去）
    const ax = sz.x >= sz.y && sz.x >= sz.z ? new THREE.Vector3(1, 0.35, 0) : sz.z >= sz.y ? new THREE.Vector3(0, 0.35, 1) : new THREE.Vector3(0.35, 1, 0);
    ax.normalize();
    let lo = Infinity, hi = -Infinity;
    for (const x of [gb.min.x, gb.max.x]) for (const y of [gb.min.y, gb.max.y]) for (const z of [gb.min.z, gb.max.z]) { const d = ax.x * x + ax.y * y + ax.z * z; lo = Math.min(lo, d); hi = Math.max(hi, d); }
    A.sweep = { e, ax, lo, hi, t: 0, a: SHEEN[mat] ?? 0.4, w: (hi - lo) * 0.13 };
    if (mat === 'metal' || mat === 'glass' || mat === 'ceramic') this.g.audio && this.g.audio.play('sheen');
  }
  updateSweep(dt, A) {
    const S = A.sweep; if (!S) return;
    S.t += dt;
    const u = S.e.it.body.material.userData.u, k = Math.min(1, S.t / 0.5), e = 1 - Math.pow(1 - k, 2);
    u.uSweep.value.set(S.ax.x, S.ax.y, S.ax.z, S.a * Math.sin(Math.PI * Math.min(1, k * 1.15)));
    u.uSweepP.value.set(S.lo - S.w * 1.5 + (S.hi - S.lo + S.w * 3) * e, S.w);
    if (k >= 1) { u.uSweep.value.w = 0; A.sweep = null; }
  }

  // 每帧（reveal.update 一开始）：甲板上的泥块、没被用上的水柱收起来
  update(dt) {
    const g = this.g, A = g.reveal.active;
    this.t += dt;
    for (const J of this.jets.values()) {
      J.mesh.visible = J.seen; J.seen = false;
      J.mat.uniforms.uT.value = this.t;
    }
    // 落包到开水之前泥块躺着不动（-1）；冲洗中按进度一块块被冲走；冲洗完了还剩的（null）一起化掉
    const wk = A && A.phase === 'wash' ? Math.min(1, A.washT / A.washDur) : A && A.phase === 'land' ? -1 : null;
    const w = BOAT.washLocal;
    this.debris.update(dt, wk, w.x, w.z, (x, y, z, t) => {
      _v.set(x, y, z); g.boat.deck.localToWorld(_v);
      g.particles.water.emit(_v.x, _v.y, _v.z, (Math.random() - 0.5) * 0.4, 0.05, (Math.random() - 0.5) * 0.4, 0.8, 0.09, MUD[0], MUD[1], MUD[2], 0.6, 1.2, 1.2, 0, 0.15);
    });
    if (A && A.sweep) this.updateSweep(dt, A);
  }
  // 冲洗停下（确认那一刻）：窗口、亮光收起，还在的泥板一起化掉
  settle(A) {
    for (const e of A.entries) if (e.kind === 'item') { const u = e.it.body.material.userData.u; u.uWin.value.w = 0; u.uWinGlow.value.w = 0; }
    if (A.slabs) for (const s of A.slabs) if (s.st !== 'gone') { s.mesh.visible = false; s.st = 'gone'; }
  }
  // 揭晓走完：泥板网格扔掉
  end(A) {
    if (A.slabs) for (const s of A.slabs) { s.mesh.parent && s.mesh.parent.remove(s.mesh); s.mesh.geometry.dispose(); }
    A.slabs = null;
    for (const e of A.entries) if (e.kind === 'item') e.it.body.material.userData.u.uSweep.value.w = 0;
  }
}

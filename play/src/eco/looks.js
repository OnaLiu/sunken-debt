// 海底生物的造型与动作：只管“看起来”和“动起来”（行为、状态机、数值都在 creatures.js，这里一概不碰）。
// 小生物用刚体蒙皮：每个部件只跟一根骨头走，一只一次绘制，腿节、螯、眼柄照样能动；
// 鱼群在顶点着色器里按实例弯尾巴。
import * as THREE from 'three';
import { Builder, box, sph, cyl, cone, col, M, shade } from '../core/geo.js';
import { worldMat, patchMaterial } from '../render/materials.js';
import { clamp, lerp, angDiff } from '../core/noise.js';
// 表现用的随机数单独一条（不占用 Math.random：玩法和机器人也在用它）
let _seed = 20261014;
const rnd = () => ((_seed = (_seed * 16807) % 2147483647) / 2147483647);

let MAT = null;
export function mats() { if (!MAT) MAT = { body: worldMat({ key: 'creature' }), fish: worldMat({ key: 'fish', flat: true }) }; return MAT; }

// ———— 小工具 ————
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const sm = (x) => x * x * (3 - 2 * x);
// 起—停—落的包络：t 在 [a,b] 升到 1，到 c 开始落，d 落回 0
function env(t, a, b, c, d) { if (t <= a || t >= d) return 0; if (t < b) return sm((t - a) / (b - a)); if (t > c) return 1 - sm((t - c) / (d - c)); return 1; }
// 确定性的小噪声（面片颜色抖动、斑点）
function hsh(x, y) { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); }
const jit = (c, x, y, k = 0.1) => shade(c, 1 - k / 2 + hsh(x, y) * k);
// 两点之间渐细的棱柱（腿节、触须、刺、牙）
export function seg(a, b, ra, rb, n = 4, open = false) {
  const L = a.distanceTo(b);
  const g = new THREE.CylinderGeometry(rb, ra, L, n, 1, open);
  const q = new THREE.Quaternion().setFromUnitVectors(V3(0, 1, 0), b.clone().sub(a).normalize());
  g.applyMatrix4(new THREE.Matrix4().compose(a.clone().add(b).multiplyScalar(0.5), q, V3(1, 1, 1)));
  return g;
}
const _e1 = new THREE.Vector3(), _e2 = new THREE.Vector3(), _n = new THREE.Vector3();
// 朝着 out 那一面的三角形（装饰件不用操心绕序）
function triOut(b, a, c, d, colr, out) { _e1.subVectors(c, a); _e2.subVectors(d, a); _n.crossVectors(_e1, _e2); if (_n.dot(out) < 0) b.tri(a, d, c, colr); else b.tri(a, c, d, colr); }
function quadOut(b, a, c, d, e, colr, out) { triOut(b, a, c, d, colr, out); triOut(b, a, d, e, colr, out); }
// 两面都画的薄片（鳍、鳃盖、膜）
function dtri(b, a, c, d, colr) { b.tri(a, c, d, colr); b.tri(a, d, c, colr); }

// ———— 刚体蒙皮：部件按骨头的静止姿态摆进网格，之后只转骨头 ————
export class Rig {
  constructor() { this.b = new Builder(); this.si = []; this.bones = []; this.root = this.bone(null, 0, 0, 0); }
  bone(parent, x, y, z, order) { const bn = new THREE.Bone(); bn.position.set(x, y, z); if (order) bn.rotation.order = order; if (parent) parent.add(bn); this.bones.push(bn); return bn; }
  // color 可以是颜色、函数（按骨头自己的坐标取色）或 null（几何自带顶点色）
  add(bone, geom, color, m) {
    bone.updateWorldMatrix(true, false);
    const g = new Builder().add(geom, color, m || null).build();
    const n0 = this.b.count, k = this.bones.indexOf(bone);
    this.b.add(g, null, bone.matrixWorld);
    g.dispose();
    for (let i = n0; i < this.b.count; i++) this.si.push(k);
    return this;
  }
  build(mat) {
    const g = this.b.build(), n = g.attributes.position.count;
    const idx = new Uint16Array(n * 4), w = new Float32Array(n * 4);
    for (let i = 0; i < n; i++) { idx[i * 4] = this.si[i]; w[i * 4] = 1; }
    g.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(idx, 4));
    g.setAttribute('skinWeight', new THREE.Float32BufferAttribute(w, 4));
    const mesh = new THREE.SkinnedMesh(g, mat);
    mesh.add(this.root);
    mesh.updateMatrixWorld(true);
    mesh.bind(new THREE.Skeleton(this.bones));
    mesh.computeBoundingSphere(); mesh.boundingSphere.radius *= 1.5; // 关节动起来也不被裁掉
    mesh.castShadow = true;
    return mesh;
  }
}

// ———————————— 蟹 ————————————
// 甲壳：前缘平、两侧前半各五个锯齿（最后一个是侧刺），壳面有分区沟、斑点和藤壶；腹面发白
function crabShell() {
  const b = new Builder();
  const shell = col(0x8a4a2e), dk = col(0x6a3420), hi = col(0x9e5836), rim = col(0x743a24), tipC = col(0x4a2414), pale = col(0xc8906a), pale2 = col(0xdcb08a);
  const R0 = [0, 0.17, 0.34, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0, 1.1, 1.2, 1.31, 1.43, 1.62, 1.9, 2.2, 2.5, 2.8];
  const TK = [0, 0, -1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 2, 0, 0, 0, 0, 0];
  const ang = [], tk = [];
  R0.forEach((a, i) => { ang.push(a); tk.push(TK[i]); }); ang.push(Math.PI); tk.push(0);
  for (let i = R0.length - 1; i > 0; i--) { ang.push(-R0[i]); tk.push(TK[i]); }
  const base = (p) => { const s = Math.sin(p), c = Math.cos(p), rz = c > 0 ? 0.165 : 0.15; let r = 1 / Math.sqrt((s / 0.235) ** 2 + (c / rz) ** 2); if (Math.abs(p) < 0.45) r *= 0.94 + 0.06 * Math.abs(p) / 0.45; return r; };
  const ring = (k, y, teeth) => ang.map((p, i) => { const r = base(p) * k * (teeth ? [1, 1.11, 1.24, 0.93][tk[i] < 0 ? 3 : tk[i]] : 1); return V3(Math.sin(p) * r, y - (teeth && tk[i] > 0 ? 0.006 : 0), Math.cos(p) * r); });
  const E = ring(1, 0.085, true), A = ring(0.8, 0.128), B = ring(0.52, 0.155), C = ring(0.25, 0.168), U1 = ring(0.86, 0.055), U2 = ring(0.45, 0.038);
  const top = V3(0, 0.172, -0.01), bot = V3(0, 0.034, 0), up = V3(0, 1, 0), dn = V3(0, -1, 0);
  const n = ang.length;
  // 壳面斑驳：成片的深浅（不是一格一格的）
  const mot = (x, z) => Math.sin(x * 31 + 1.3) * Math.cos(z * 27 - 0.4) + Math.sin(x * 13 - z * 17) * 0.5;
  for (let j = 0; j < n; j++) {
    const k = (j + 1) % n, x = (E[j].x + E[k].x) / 2, z = (E[j].z + E[k].z) / 2;
    quadOut(b, E[j], E[k], A[k], A[j], jit(tk[j] > 0 || tk[k] > 0 ? tipC : rim, x, z), up);
    const xa = (A[j].x + A[k].x + B[j].x + B[k].x) / 4, za = (A[j].z + A[k].z + B[j].z + B[k].z) / 4;
    quadOut(b, A[j], A[k], B[k], B[j], jit(mot(xa, za) > 0.6 ? dk : shell, xa, za, 0.1), up);
    const xb = (B[j].x + B[k].x) / 2, zb = (B[j].z + B[k].z) / 2;
    quadOut(b, B[j], B[k], C[k], C[j], jit(mot(xb, zb) > 0.7 ? shell : hi, xb, zb, 0.1), up);
    triOut(b, C[j], C[k], top, jit(hi, x, z), up);
    quadOut(b, E[j], E[k], U1[k], U1[j], jit(pale, x, z, 0.08), dn);
    quadOut(b, U1[j], U1[k], U2[k], U2[j], jit(pale2, x, z, 0.08), dn);
    triOut(b, U2[j], U2[k], bot, pale2, dn);
  }
  // 藤壶：口朝上的小火山，口里是暗的
  const yd = (x, z) => { const q = Math.hypot(x / 0.235, z / 0.16); return 0.172 - 0.087 * q * q; };
  for (const [x, z, s] of [[0.085, -0.07, 1], [-0.12, 0.0, 0.8], [0.03, -0.11, 0.6]]) {
    b.add(cyl(0.006 * s, 0.017 * s, 0.016 * s, 5), (px, py) => (py > yd(x, z) + 0.009 * s ? col(0x4a443a) : col(0xbab2a0)), M(x, yd(x, z) + 0.004 * s, z, -z * 1.2, 0, x * 1.1));
  }
  // 壳面上的淡色小斑点
  for (const [x, z] of [[0.05, 0.02], [-0.07, -0.03], [0.13, -0.05], [-0.14, 0.05], [0.0, -0.06], [0.09, 0.08], [-0.03, 0.1], [-0.1, -0.08], [0.16, 0.06]]) b.add(sph(0.011, 5, 2), col(0xc8966c), M(x, yd(x, z) + 0.001, z, 0, 0, 0, 1, 0.3, 1.2));
  // 额前两颗小齿（额角）
  for (const s of [-1, 1]) b.add(cone(0.012, 0.03, 4), rim, M(s * 0.022, 0.085, 0.162, Math.PI / 2, 0, 0));
  return b.build();
}

export class CrabLook {
  constructor() {
    const R = new Rig();
    const body = this.body = R.bone(R.root, 0, 0, 0, 'YXZ');
    R.add(body, crabShell(), null);
    const shell = col(0x8a4a2e), legC = col(0x7e4229), legD = col(0x5e2e1c), tipC = col(0x2e1810), pale = col(0xd0a07a);
    // 眼柄：缩进遮蔽时还竖着往外瞄
    this.eyes = R.bone(body, 0, 0.1, 0.15);
    this.stalks = [-1, 1].map((s) => {
      const st = R.bone(this.eyes, s * 0.045, 0, 0);
      R.add(st, seg(V3(0, 0, 0), V3(s * 0.01, 0.075, 0.014), 0.011, 0.008, 4), legD);
      R.add(st, sph(0.019, 6, 4), (x, y, z) => (y > 0.088 ? col(0x3a342c) : col(0x0c0c0c)), M(s * 0.011, 0.085, 0.016, 0, 0, 0, 1, 1.15, 1));
      return st;
    });
    // 触角：两根细长的，从两眼之间往前上方伸，分两节（要走之前一下一下地抖，W6）
    const antC = col(0xdc9a68), antD = col(0xa8643c);
    this.ants = [-1, 1].map((s) => {
      const a = R.bone(body, s * 0.016, 0.092, 0.17, 'YXZ');
      R.add(a, seg(V3(0, 0, 0), V3(s * 0.03, 0.035, 0.075), 0.0085, 0.006, 4), antD);
      const tip = R.bone(a, s * 0.03, 0.035, 0.075, 'YXZ');
      R.add(tip, seg(V3(0, 0, 0), V3(s * 0.04, 0.035, 0.1), 0.006, 0.0016, 4), antC);
      return { a, tip, s, jx: 0, jy: 0, tx: 0, ty: 0, cx: 0, cy: 0 };
    });
    this.antIn = 0;
    // 口器：两片颚足，一刻不停地扇
    this.mouth = [-1, 1].map((s) => {
      const m = R.bone(body, s * 0.019, 0.078, 0.158);
      R.add(m, box(0.02, 0.028, 0.007), col(0x5e3420), M(0, -0.014, 0));
      R.add(m, seg(V3(0, -0.008, 0.004), V3(s * 0.008, -0.026, 0.02), 0.0035, 0.002, 3), col(0x4e2a1a));
      return m;
    });
    // 八条腿，各三节：髋（前后摆、抬落）→ 膝 → 指尖
    this.legs = [];
    for (const s of [-1, 1]) for (let i = 0; i < 4; i++) {
      const k = [0.95, 1.05, 1.05, 0.92][i], yaw0 = -s * (0.42 - i * 0.3);
      const hip = R.bone(body, s * 0.15, 0.085, 0.085 - i * 0.065, 'YZX'); hip.rotation.y = yaw0;
      const fx = s * 0.14 * k, tx = s * 0.085 * k;
      R.add(hip, seg(V3(0, 0, 0), V3(fx, 0.03, 0), 0.021, 0.017, 5), (x, y) => (y > 0.01 ? legC : legD));
      R.add(hip, cone(0.006, 0.02, 3), pale, M(fx * 0.55, 0.03, 0, 0, 0, -s * 0.5));
      const knee = R.bone(hip, fx, 0.03, 0);
      R.add(knee, sph(0.018, 5, 3), legD);
      R.add(knee, seg(V3(0, 0, 0), V3(tx, -0.085, 0), 0.017, 0.013, 5), (x, y) => (y > -0.025 ? shell : legC));
      const ank = R.bone(knee, tx, -0.085, 0);
      R.add(ank, seg(V3(0, 0, 0), V3(s * 0.02, -0.036, 0), 0.012, 0.008, 4), legC);
      R.add(ank, seg(V3(s * 0.02, -0.036, 0), V3(s * 0.03, -0.062, 0), 0.008, 0.0015, 4), tipC);
      this.legs.push({ hip, knee, ank, s, i, yaw0 });
    }
    // 两只螯（右螯大一点）：臂 → 腕和掌（带不动指）→ 可动指
    this.claws = [];
    for (const s of [-1, 1]) {
      const f = s > 0 ? 1.15 : 1.0;
      const sh = R.bone(body, s * 0.11, 0.095, 0.14); sh.rotation.set(0, s * 0.35, 0);
      R.add(sh, seg(V3(0, 0, 0), V3(s * 0.03 * f, 0.01, 0.09 * f), 0.024, 0.02, 5), (x, y) => (y > 0.008 ? shell : legC));
      R.add(sh, cone(0.007, 0.022, 3), pale, M(s * 0.016 * f, 0.026, 0.05 * f));
      const wr = R.bone(sh, s * 0.03 * f, 0.01, 0.09 * f); wr.rotation.set(0, -s * 0.9, 0);
      R.add(wr, sph(0.024 * f, 5, 4), legC);
      R.add(wr, sph(0.054 * f, 7, 5), (x, y, z) => (y > 0.014 * f ? col(0x7a3a22) : y < -0.018 * f ? col(0xc8946c) : shell), M(0, 0.002, 0.058 * f, 0, 0, 0, 0.8, 0.68, 1.28));
      R.add(wr, seg(V3(-s * 0.012 * f, -0.012 * f, 0.1 * f), V3(-s * 0.015 * f, -0.018 * f, 0.145 * f), 0.02 * f, 0.012 * f, 4), shell);
      R.add(wr, seg(V3(-s * 0.015 * f, -0.018 * f, 0.145 * f), V3(-s * 0.016 * f, -0.02 * f, 0.178 * f), 0.012 * f, 0.002, 4), tipC);
      for (let t = 0; t < 3; t++) R.add(wr, cone(0.005, 0.012, 3), pale, M(-s * 0.012 * f, -0.004 * f, (0.11 + t * 0.02) * f, 0, 0, 0)); // 内缘的小齿
      const da = R.bone(wr, s * 0.012 * f, 0.016 * f, 0.1 * f);
      R.add(da, seg(V3(0, 0, 0), V3(s * 0.002, -0.009 * f, 0.05 * f), 0.018 * f, 0.011 * f, 4), shell);
      R.add(da, seg(V3(s * 0.002, -0.009 * f, 0.05 * f), V3(s * 0.002, -0.016 * f, 0.08 * f), 0.011 * f, 0.002, 4), tipC);
      this.claws.push({ sh, wr, da, s });
    }
    this.mesh = R.build(mats().body);
    this.root = new THREE.Group(); this.root.add(this.mesh);
    this.t = rnd() * 10; this.gp = 0; this.mv = 0; this.dg = 0; this.sy = 0; this.sideS = 1; this.wasMv = false;
    this.rt = 9; this.hit = false; this.reacting = false; this.thYaw = null; this.pt = 9;
    this.snapC = -1; this.snapT = 0; this.snapIn = 2; this.eyeIn = 0; this.ex = [0, 0]; this.ez = [0, 0]; this.etx = [0, 0]; this.etz = [0, 0];
  }
  // 受惊：hit=被网或船直接惊到（先一缩、往后一跳，再威吓）；否则只威吓。yaw：朝哪边威吓（null=原地）
  react(hit, yaw) { this.rt = 0; this.hit = hit; this.reacting = true; this.thYaw = yaw; }
  peek() { this.pt = 0; } // 缩着的时候被惊到：眼柄一下收回去
  reset() { this.body.position.set(0, 0, 0); this.body.rotation.set(0, 0, 0); this.body.scale.set(1, 1, 1); this.eyes.position.y = 0.1; this.sy = 0; this.rt = 9; }
  // o: moving, fast（逃跑）, digging, digK（翻泥的劲 0~1，要走之前越来越小）, fold（缩进遮蔽 0~1）, yaw（身体朝向）, trapped（被网压住）,
  //    restless（要走了 0~1：触角和眼柄越抖越急）, ready（最后一下：身子抬起来、两螯收到身前 0~1）
  update(dt, o) {
    const T = (this.t += dt);
    if (o.trapped) { this.struggle(T * 1.15); return; }
    this.rt += dt; this.pt += dt;
    const hitK = this.reacting && this.hit ? env(this.rt, 0, 0.05, 0.13, 0.27) : 0;
    const t0 = this.hit ? 0.2 : 0, thK = this.reacting ? env(this.rt, t0, t0 + 0.09, t0 + 0.4, t0 + 0.55) : 0;
    if (this.rt > 1) this.reacting = false;
    const fold = o.fold;
    this.mv += ((o.moving ? 1 : 0) - this.mv) * Math.min(1, dt * 7);
    this.dg += ((o.digging ? (o.digK ?? 1) : 0) - this.dg) * Math.min(1, dt * 4);
    const rs = o.restless || 0, rd = o.ready || 0;
    if (o.moving && !this.wasMv) this.sideS = -this.sideS; // 每走一趟换一边横着走
    this.wasMv = o.moving;
    this.gp += dt * (o.moving ? (o.fast ? 21 : 12.5) : 0) * (1 - thK * 0.85);
    // 横着走：身子转过去；威吓时转过来正对着惊扰它的东西
    let ty = this.mv > 0.5 ? this.sideS * 1.45 : 0;
    if (thK > 0.02 && this.thYaw != null) ty = clamp(angDiff(o.yaw, this.thYaw), -2.8, 2.8);
    this.sy += clamp(angDiff(this.sy, ty), -dt * 9, dt * 9);
    const B = this.body, gp = this.gp, mv = this.mv;
    const hop = this.hit && this.reacting ? Math.sin(clamp(this.rt / 0.27, 0, 1) * Math.PI) : 0;
    B.position.set(-Math.sin(this.sy) * 0.1 * hitK, mv * 0.011 * (1 - Math.cos(gp * 2)) * 0.5 + 0.06 * thK + 0.055 * hop - 0.012 * this.dg + 0.026 * rd, -Math.cos(this.sy) * 0.1 * hitK);
    B.rotation.set(-0.32 * thK + 0.1 * this.dg + 0.08 * hitK - 0.08 * rd, this.sy, mv * 0.045 * Math.sin(gp) + Math.sin(T * 0.6) * 0.01);
    B.scale.set(1 + 0.1 * hitK, 1 - 0.22 * hitK, 1 + 0.1 * hitK);
    // 腿：两组交替（左前、右二、左三、右后一组），抬起的那组往前摆；缩进去时腿收在身下
    for (const L of this.legs) {
      const ph = gp + ((L.i + (L.s > 0 ? 0 : 1)) % 2) * Math.PI + L.i * 0.3, up = Math.max(0, Math.sin(ph));
      const lift = mv * up * 0.42 + fold * 0.12 + hitK * 0.45 - thK * 0.12 + this.dg * 0.04 * Math.sin(T * 6 + L.i);
      const flex = 0.12 + mv * Math.cos(ph) * 0.22 + fold * 1.45 + hitK * 0.5 - thK * 0.3 - rd * 0.1;
      L.hip.rotation.set(0, L.yaw0 * (1 - fold * 0.35) + mv * Math.cos(ph) * 0.2 + (1 - mv) * Math.sin(T * 0.7 + L.i * 2) * 0.03, L.s * lift);
      L.knee.rotation.z = -L.s * flex;
      L.ank.rotation.z = -L.s * (0.08 + fold * 0.6 + mv * up * 0.3);
    }
    // 待机：隔几秒一只螯开合一下
    const idle = !o.moving && !o.digging && fold < 0.3;
    this.snapIn -= dt; this.snapT += dt;
    if (idle && this.snapIn <= 0) { this.snapC = rnd() < 0.5 ? 0 : 1; this.snapT = 0; this.snapIn = 2.2 + rnd() * 4; }
    if (this.snapT > 0.6) this.snapC = -1;
    this.claws.forEach((C, c) => {
      const s = C.s, dp = T * 6.5 + c * Math.PI;
      let ax = -0.1 + Math.sin(T * 1.3 + c) * 0.04, ay = 0, fw = 0, wx = 0, open = 0.06;
      if (this.snapC === c) { const k = Math.sin(clamp(this.snapT / 0.6, 0, 1) * Math.PI); open += k * 0.6; ax -= k * 0.15; }
      // 翻泥：两螯交替往前下方铲，抬起来时夹住送到嘴边
      ax += this.dg * (0.45 + Math.sin(dp) * 0.42); wx += this.dg * Math.sin(dp + 0.8) * 0.35; open += this.dg * Math.max(0, Math.sin(dp)) * 0.5; fw -= this.dg * 0.2;
      // 走路：收在身前，随步子晃
      ax += mv * (0.05 + Math.sin(gp + c * 3) * 0.07); fw += mv * 0.15;
      // 缩进遮蔽：两螯收拢挡在脸前
      ax -= fold * 0.15; fw += fold * 0.7;
      // 要走了：两螯停下、抬起来收到身前（准备走）
      ax -= rd * 0.22; fw += rd * 0.3;
      // 受击：猛地收回
      ax += hitK * 0.35; fw += hitK * 0.4; open *= 1 - hitK;
      // 威吓：高举、张开、钳子大开
      ax = lerp(ax, -1.05, thK); ay += thK * 0.6; fw = lerp(fw, -0.75, thK); wx = lerp(wx, -0.35, thK); open = lerp(open, 0.85, thK);
      C.sh.rotation.set(ax, s * (0.35 + ay), 0);
      C.wr.rotation.set(wx, -s * (0.9 + fw), 0);
      C.da.rotation.x = -open;
    });
    // 眼柄：待机时一跳一跳地转着看；受击、被惊到时一下收倒
    this.eyeIn -= dt;
    // 要走了：眼柄转得越来越急、越来越大（四下张望）
    if (this.eyeIn <= 0) { for (let c = 0; c < 2; c++) { this.etx[c] = (rnd() - 0.6) * 0.5 * (1 + rs * 0.8); this.etz[c] = (rnd() - 0.5) * 0.45 * (1 + rs * 1.2); } this.eyeIn = (0.25 + rnd() * 1.3) * (1 - rs * 0.8); }
    const pk = env(this.pt, 0, 0.05, 0.45, 1.2);
    this.stalks.forEach((st, c) => {
      this.ex[c] += (this.etx[c] - this.ex[c]) * Math.min(1, dt * 16); this.ez[c] += (this.etz[c] - this.ez[c]) * Math.min(1, dt * 16);
      st.rotation.set(this.ex[c] * (1 - mv * 0.6) + (hitK + pk) * 1.3 - thK * 0.2, 0, this.ez[c] * (1 - mv * 0.6));
    });
    this.eyes.position.y = 0.1 + fold * 0.06 + rd * 0.012;
    this.mouth.forEach((m, c) => { m.rotation.x = 0.16 + 0.17 * Math.sin(T * (9 + this.dg * 8) + c * 2.2); });
    // 触角：平时慢慢摆、偶尔扫一下；要走之前一下一下地抖（隔 0.07–0.2 秒猛地一弹，越来越急、越来越大），末节跟着甩
    this.antIn -= dt;
    if (this.antIn <= 0) {
      for (const A of this.ants) { A.tx = (rnd() - 0.5) * (0.25 + rs * 1.1); A.ty = (rnd() - 0.5) * (0.2 + rs * 1.0); }
      this.antIn = rs > 0.05 ? 0.07 + rnd() * 0.13 * (1.2 - rs) : 0.8 + rnd() * 1.8;
    }
    const ak = Math.min(1, dt * (rs > 0.05 ? 30 : 6));
    for (const A of this.ants) {
      A.cx += (A.tx - A.cx) * ak; A.cy += (A.ty - A.cy) * ak;
      // 末节晚一拍、甩得更大（像鞭梢）
      A.jx += (A.cx * 1.4 - A.jx) * Math.min(1, dt * 14); A.jy += (A.cy * 1.4 - A.jy) * Math.min(1, dt * 14);
      const sway = Math.sin(T * 1.7 + A.s) * 0.08 * (1 - fold);
      A.a.rotation.set(-0.15 + A.cx + sway - fold * 0.5 + rs * Math.sin(T * 37 + A.s * 2) * 0.12, A.cy - A.s * fold * 0.4, 0);
      A.tip.rotation.set(A.jx - A.cx + rs * Math.sin(T * 43 + A.s) * 0.18, A.jy - A.cy, 0);
    }
  }
  // 挣扎（被网压住、网里、甲板上、水槽里）：腿乱蹬、螯乱夹、身子扭
  struggle(t) {
    const B = this.body;
    B.position.set(0, 0.02 + Math.abs(Math.sin(t * 5.3)) * 0.025, 0);
    B.rotation.set(Math.sin(t * 4.1) * 0.13, Math.sin(t * 2.3) * 0.25, Math.sin(t * 6.7) * 0.15);
    B.scale.set(1, 1, 1);
    for (const L of this.legs) {
      const q = t * (15 + L.i * 1.7) + L.i * 1.9 + L.s * 1.3;
      L.hip.rotation.set(0, L.yaw0 + Math.sin(q * 0.7) * 0.35, L.s * (0.35 + Math.sin(q) * 0.45));
      L.knee.rotation.z = -L.s * (0.3 + Math.sin(q * 1.3 + 1) * 0.45);
      L.ank.rotation.z = -L.s * (0.2 + Math.sin(q * 1.7) * 0.3);
    }
    this.claws.forEach((C, c) => {
      const q = t * (5.5 + c * 1.3) + c * 2.4;
      C.sh.rotation.set(-0.55 + Math.sin(q) * 0.5, C.s * (0.7 + Math.sin(q * 0.8 + 1) * 0.35), 0);
      C.wr.rotation.set(Math.sin(q * 1.4) * 0.3, -C.s * (0.4 + Math.sin(q * 0.9) * 0.4), 0);
      C.da.rotation.x = -Math.max(0, Math.sin(t * 13 + c * 1.7)) * 0.85;
    });
    this.stalks.forEach((st, c) => st.rotation.set(Math.sin(t * 8 + c) * 0.5, 0, Math.sin(t * 6.3 + c * 2) * 0.3));
    this.ants.forEach((A, c) => { A.a.rotation.set(Math.sin(t * 11 + c) * 0.5, Math.sin(t * 7 + c * 2) * 0.4, 0); A.tip.rotation.set(Math.sin(t * 13 + c) * 0.4, 0, 0); });
    this.mouth.forEach((m, c) => { m.rotation.x = 0.2 + Math.sin(t * 19 + c * 2) * 0.25; });
    this.eyes.position.y = 0.1;
  }
}

// ———————————— 鱼群（实例化） ————————————
// 六边截面的小鱼，背深腹白（实例颜色再乘上去）、叉尾、背鳍、腹鳍、眼点；尾巴在顶点着色器里按实例相位弯
let FISH_GEO = null;
export function schoolGeo() {
  if (FISH_GEO) return FISH_GEO;
  const b = new Builder();
  const top = col(0x9aacb8), mid = col(0xccd8de), bel = col(0xf4f6f4), fin = col(0xa8b6c0), finD = col(0x8c9aa6);
  const RS = [[0.17, 0.004, 0.006, -0.004], [0.13, 0.028, 0.042, -0.002], [0.06, 0.042, 0.07, 0], [-0.03, 0.038, 0.062, 0.002], [-0.11, 0.02, 0.034, 0.004], [-0.16, 0.008, 0.016, 0.004]];
  const ring = ([z, w, h, cy]) => Array.from({ length: 6 }, (_, j) => { const a = j / 6 * Math.PI * 2; return V3(Math.sin(a) * w, cy + Math.cos(a) * h, z); });
  for (let r = 0; r < RS.length - 1; r++) {
    const A = ring(RS[r]), B = ring(RS[r + 1]);
    for (let j = 0; j < 6; j++) { const j2 = (j + 1) % 6, c = Math.cos((j + 0.5) / 6 * Math.PI * 2); quadOut(b, A[j], A[j2], B[j2], B[j], c > 0.5 ? top : c > -0.5 ? mid : bel, V3(A[j].x + A[j2].x, A[j].y + A[j2].y, 0)); }
  }
  dtri(b, V3(0, 0.006, -0.16), V3(0, 0.07, -0.25), V3(0, 0.004, -0.205), fin); dtri(b, V3(0, 0.002, -0.16), V3(0, 0.002, -0.205), V3(0, -0.062, -0.25), finD);
  dtri(b, V3(0, 0.068, 0.04), V3(0, 0.115, -0.03), V3(0, 0.055, -0.07), finD);
  dtri(b, V3(0, -0.06, 0.0), V3(0, -0.085, -0.05), V3(0, -0.045, -0.06), fin);
  for (const s of [-1, 1]) { const e = s * 0.034; triOut(b, V3(e, 0.024, 0.122), V3(e, 0.004, 0.13), V3(e, 0.014, 0.1), col(0x16181c), V3(s, 0, 0)); }
  FISH_GEO = b.build();
  return FISH_GEO;
}
// 每群一个材质实例（共用一个着色器程序）：uSwimT 摆尾相位、uSwimA 幅度
export function schoolMat() {
  const u = { uSwimT: { value: 0 }, uSwimA: { value: 0.03 } };
  const m = new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true });
  m.userData.u = u;
  return patchMaterial(m, {
    key: 'school', uniforms: u,
    vertexPars: 'uniform float uSwimT; uniform float uSwimA;',
    vertex: `vec3 transformed = vec3(position);
{
#ifdef USE_INSTANCING
  float hs = fract(sin(float(gl_InstanceID) * 12.9898) * 43758.5453);
#else
  float hs = 0.0;
#endif
  float tl = clamp((0.1 - position.z) / 0.35, 0.0, 1.0);
  transformed.x += sin(uSwimT * (0.85 + 0.3 * hs) + hs * 6.2832 + position.z * 9.0) * uSwimA * (0.15 + tl * tl);
}`,
  });
}

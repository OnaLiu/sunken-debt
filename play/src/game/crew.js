// 船员：纯表现。每人一次搬一件，多人并行；值守、盘缆、瞭望、看吊臂、冲洗。绝不阻塞玩法。
import * as THREE from 'three';
import { worldMat } from '../render/materials.js';
import { BOAT } from './boat.js';
import { buildSailor, rnd } from './crewlook.js';
import { choreOptions, pickSpread, choreFx, CHORE_ANIM } from './chores.js';

const NODES = {
  bow: [0, 6.3], bowL: [-1.0, 5.1], bowR: [1.0, 5.1],
  sideL: [-1.85, 4.2], sideR: [1.85, 4.2], fwdL: [-2.1, 1.35], fwdR: [2.1, 1.35],
  midL: [-2.15, -0.8], midR: [2.15, -0.8], hatchF: [0, -1.95],
  hatchL: [-1.45, -3.25], hatchR: [1.45, -3.25],
  aftL: [-2.15, -4.4], aftR: [2.15, -4.4], sternL: [-1.95, -7.05], sternR: [2.05, -7.05], sternC: [0.3, -7.3],
};
// 甲板上走不过去的东西：舱口围板、吊臂底座、驾驶室、水槽、缆绳卷、木箱（甲板局部坐标，已经留出半个身位）
const BLOCK_RECT = [[-1.22, 1.22, -4.47, -2.03], [-1.85, 1.85, 1.35, 4.85], [-1.92, -0.38, -6.9, -5.1], [-1.7, -0.4, 0.6, 1.8]];
const BLOCK_CIRC = [[0, -0.9, 1.0], [1.25, -1.9, 0.6]];
let WASH_BLOCK = null; // 清洗位上的泥包（揭宝时才有）：从旁边绕过去，不从泥里穿过
function blockedAt(x, z) {
  for (const [x0, x1, z0, z1] of BLOCK_RECT) if (x > x0 && x < x1 && z > z0 && z < z1) return true;
  for (const [cx, cz, r] of BLOCK_CIRC) if (Math.hypot(x - cx, z - cz) < r) return true;
  if (WASH_BLOCK && Math.hypot(x - WASH_BLOCK[0], z - WASH_BLOCK[1]) < WASH_BLOCK[2]) return true;
  return false;
}
// 两点之间能不能直着走过去（起点、终点附近各留 0.45 m：人本来就站在东西旁边）
function clearLine(x0, z0, x1, z1) {
  const L = Math.hypot(x1 - x0, z1 - z0);
  for (let d = 0.45; d < L - 0.45; d += 0.2) { const t = d / L; if (blockedAt(x0 + (x1 - x0) * t, z0 + (z1 - z0) * t)) return false; }
  return true;
}
// 能直着走就直着走；不然在甲板路点之间找一条路程最短、每段都走得通的路（可见性图上的最短路）
const NODE_LIST = Object.values(NODES);
const NODE_VIS = NODE_LIST.map((a) => NODE_LIST.map((b) => clearLine(a[0], a[1], b[0], b[1])));
function findPath(x0, z0, x1, z1) {
  if (Math.hypot(x1 - x0, z1 - z0) < 1.6 || clearLine(x0, z0, x1, z1)) return [[x1, z1]];
  const n = NODE_LIST.length, S = n, T = n + 1;
  const P = NODE_LIST.concat([[x0, z0], [x1, z1]]);
  const vis = (i, j) => (i < n && j < n ? NODE_VIS[i][j] : clearLine(P[i][0], P[i][1], P[j][0], P[j][1]));
  const dist = new Float64Array(n + 2).fill(Infinity), prev = new Int32Array(n + 2).fill(-1), done = new Uint8Array(n + 2);
  dist[S] = 0;
  for (;;) {
    let u = -1, ud = Infinity;
    for (let i = 0; i < n + 2; i++) if (!done[i] && dist[i] < ud) { ud = dist[i]; u = i; }
    if (u < 0 || u === T) break;
    done[u] = 1;
    for (let v = 0; v < n + 2; v++) {
      if (done[v] || v === S) continue;
      const d = ud + Math.hypot(P[v][0] - P[u][0], P[v][1] - P[u][1]);
      if (d < dist[v] && vis(u, v)) { dist[v] = d; prev[v] = u; }
    }
  }
  if (prev[T] < 0) return [[x1, z1]]; // 实在找不到就直着走（只是表现）
  const pts = [];
  for (let v = prev[T]; v >= 0 && v !== S; v = prev[v]) pts.unshift(P[v].slice());
  pts.push([x1, z1]);
  return pts;
}

// 职责一眼分得开：船长（个子高、深色长大衣、大檐帽）、冲洗手（黄雨衣、后檐很宽的雨帽）、搬运手（身板宽、砖红短褂、毛线帽、背带）
export const ROLES = {
  wash: { title: '冲洗手', color: '#ffd84a' },
  carry: { title: '搬运手', color: '#ff8a5a' },
  captain: { title: '船长', color: '#e8f0ff' },
};
const OUTFITS = [
  { role: 'wash', name: '阿满', coat: 0xf2c22e, pants: 0x2c3a4a, hat: 0xf2c22e, skin: 0xd9a87e },
  { role: 'wash', name: '小秦', coat: 0xe8b81e, pants: 0x34404c, hat: 0xe8b81e, skin: 0xe0b48e },
  { role: 'carry', name: '石头', coat: 0xb4432a, pants: 0x3a3a34, hat: 0x2c3a4a, skin: 0xc48a62 },
  { role: 'carry', name: '老蔡', coat: 0x9c3a26, pants: 0x2a2a28, hat: 0x4a5a3a, skin: 0xb07a52 },
  { role: 'captain', name: '老魏', coat: 0x1c2638, pants: 0x1a1e26, hat: 0x121822, skin: 0xd9a87e },
];

let _crewMat = null;
const _hv = new THREE.Vector3(), _from = new THREE.Vector3(), _to = new THREE.Vector3();
// 船的晃动、加减速、转弯（Crew 每帧更新），船员据此倾斜、扶稳
const NO_ENV = { lat: 0, lon: 0, wind: 0, spraying: false, fast: false, tip: null, wx: 0, wz: -6, turn: 0, speed: 0 };

class Sailor {
  constructor(i, deck) {
    if (!_crewMat) _crewMat = worldMat({ key: 'crew', flat: true });
    const o = OUTFITS[i];
    this.i = i;
    this.role = o.role; this.name = o.name;
    // 造型（脸、关节、衣服细节、水枪和锤子）与全套动作在 crewlook.js：g、hips、torso、head、armL/armR、legL/legR、nozzle、mallet 都挂在 this 上
    this.rig = buildSailor(this, o, _crewMat);
    if (o.role === 'captain') this.g.scale.setScalar(1.1);
    deck.add(this.g);
    this.x = 0; this.z = 0; this.y = 0; this.face = 0;
    this.anim = 'idle'; this.at = Math.random() * 10;
    this.task = null; this.path = null;
    this.hold = null; // 手上的东西
    this.busyWith = null;
    this.env = NO_ENV; this.buddy = null;
  }
  setPose(x, z) { this.x = x; this.z = z; }
  walkTo(x, z) { this.path = findPath(this.x, this.z, x, z); }
  stepWalk(dt, speed) {
    if (!this.path || !this.path.length) return true;
    const [tx, tz] = this.path[0];
    const dx = tx - this.x, dz = tz - this.z, d = Math.hypot(dx, dz);
    if (d < 0.05) { this.path.shift(); return !this.path.length; }
    const st = Math.min(d, speed * dt);
    this.x += dx / d * st; this.z += dz / d * st;
    const tf = Math.atan2(dx, dz);
    let df = tf - this.face; while (df > Math.PI) df -= Math.PI * 2; while (df < -Math.PI) df += Math.PI * 2;
    this.face += df * Math.min(1, dt * 10);
    return false;
  }
  faceTo(x, z, dt) { const tf = Math.atan2(x - this.x, z - this.z); let df = tf - this.face; while (df > Math.PI) df -= Math.PI * 2; while (df < -Math.PI) df += Math.PI * 2; this.face += df * Math.min(1, dt * 6); }
  animate(dt) {
    this.at += dt;
    this.g.position.set(this.x + (this.wx || 0), BOAT.deckY + this.y, this.z + (this.wz || 0)); // wx/wz：路过别人时身子往旁边让（giveWay，只是画面）
    this.g.rotation.y = this.face;
    this.rig.update(dt, this.env);
    // 手上的东西跟着胸口和两只手走（蹲下、起身、走路起伏都带着）
    if (this.hold && !this.hold.free) {
      this.rig.holdDeck(_hv);
      this.hold.mesh.position.set(_hv.x, _hv.y + (this.hold.lift || 0), _hv.z);
      this.hold.mesh.rotation.y = this.face + (this.hold.spin || 0);
    }
  }
  // 反应与手势（只是表现，不碰任务）：stumble/brace/fall/flinch/startle；船长 point/wave
  react(type, o) { this.rig.react(type, o); }
  gesture(type, o) { this.rig.gesture(type, o); }
  // 水枪口（甲板坐标）；没拿水枪返回 false
  nozzleTip(out) { return this.rig.tipDeck(out); }
}

export class Crew {
  constructor(boat, particles) {
    this.boat = boat;
    this.particles = particles;
    this.sailors = [];
    for (let i = 0; i < 5; i++) this.sailors.push(new Sailor(i, boat.deck));
    const starts = [[2.0, -1.9], [-2.1, -4.4], [0.6, 5.9], [1.95, -7.0], [0.45, 3.2]];
    this.sailors.forEach((s, i) => s.setPose(...starts[i]));
    this.captain = this.sailors[4];
    this.captain.face = 0;
    this.hands = this.sailors.slice(0, 4);
    this.carryQueue = [];
    this.hoseWanted = 0;
    this.hosers = [];
    this.opActive = false;
    this.carried = 0;
    this.t = 0;
    // 表现用：船的加减速/转弯（船员随船倾斜）、上一帧船速和搁浅（撞浅滩时踉跄）、泥包落地（缩一下）、船长手势
    this.env = { ...NO_ENV, wx: BOAT.washLocal.x, wz: BOAT.washLocal.z };
    for (const s of this.sailors) s.env = this.env;
    this._spd = 0; this._gr = 0; this._washR = 0; this._joltAuto = -1; this._joltAt = -9; this._moving = false;
    this.captain.nextGest = 5;
  }
  // 泥包重重落在清洗位：附近的人一缩、抬手挡脸，远一点的扭头看一眼（只是表现）
  // 反应有先后（B12）：离得最近的约 0.1 秒后先缩，远的再晚一点才扭头——不再全船同一帧
  jolt(x, z, strength = 1) {
    if (this.t - this._joltAt < 0.5) return;
    this._joltAt = this.t; this._joltAuto = -1;
    for (const s of this.sailors) {
      const d = Math.hypot(s.x - x, s.z - z);
      const delay = 0.07 + d * 0.035 + (s.i % 3) * 0.025;
      if (d < 2.8) s.react('flinch', { x, z, str: strength * Math.min(1.2, 1.35 - d / 2.8), delay });
      else if (d < 6.5) s.react('startle', { x, z, str: 0.7, delay: delay + 0.06 });
    }
  }
  // 撞上浅滩：全员往前一个踉跄，靠舷的扶栏杆；撞得狠（> 4 m/s）离撞点最近的一两个人摔坐在甲板上，过一会儿爬起来接着干
  bump(v) {
    const a = Math.abs(v);
    if (a < 0.4) return;
    const dir = Math.sign(v) || 1, str = Math.min(1.4, 0.35 + a / 4.5), endZ = dir > 0 ? 6.3 : -7.3;
    const fall = [];
    if (a > 4) {
      const cand = this.hands.filter((s) => !s.hold && s.g.visible && s.anim !== 'walk' && s.anim !== 'carry' && s.anim !== 'carryHeavy' && !(s.task && s.task.type === 'hose'));
      cand.sort((p, q) => Math.abs(p.z - endZ) - Math.abs(q.z - endZ));
      fall.push(...cand.slice(0, a > 6.5 ? 2 : 1));
    }
    for (const s of this.sailors) {
      const delay = rnd() * 0.08;
      if (fall.includes(s)) s.react('fall', { dz: dir, str, delay });
      else if (s === this.captain) s.react('stumble', { dz: dir, str: str * 0.7, delay, keepArms: s.anim === 'operate' });
      else if (Math.abs(s.x) > 1.6 && s.z > -7 && s.z < -0.2) s.react('brace', { dz: dir, str, delay, railX: Math.sign(s.x) * 2.66, railZ: s.z });
      else s.react('stumble', { dz: dir, str, delay });
    }
  }
  // 前方浅滩（W2 近）：大家一个接一个扭头看船头前面那片浅水（x, z 是甲板坐标），船长身子往前探
  alert(x, z) {
    let k = 0;
    const order = this.sailors.slice().sort((p, q) => q.z - p.z); // 离船头近的先看见
    for (const s of order) { if (s.hold || !s.g.visible) continue; s.react('look', { x, z, str: 1, delay: 0.05 + k++ * 0.09, dur: 2.1 }); }
  }
  // 一起扭头看甲板上的一处（x, z），一个接一个（没油收工时看烟囱）
  look(x, z, delay = 0, dur = 1.6) {
    let k = 0;
    for (const s of this.sailors) { if (s.hold || !s.g.visible) continue; s.react('look', { x, z, str: 1, delay: delay + k++ * 0.06, dur }); }
  }
  // 空网（C3）：离那摊泥水最近、手上没活的人停下来转身看一眼，耸耸肩；再远一点的那个摇摇头。返回耸肩的人
  shrugAt(x, z, delay = 0.5) {
    const d = (s) => Math.hypot(s.x - x, s.z - z);
    const cand = this.hands.filter((s) => s.g.visible && !s.hold && !(s.task && (s.task.type === 'carry' || s.task.type === 'hose' || s.task.type === 'face'))).sort((p, q) => d(p) - d(q));
    const s = cand[0];
    if (!s) return null;
    s.task = { type: 'glance', x, z, t: -delay * 0.4, dur: 2.4 };
    s.react('shrug', { x, z, delay });
    const o = cand[1];
    if (o && d(o) < 7) { o.task = { type: 'glance', x, z, t: -delay, dur: 2.2 }; o.react('shrug', { x, z, delay: delay + 0.4, soft: true }); }
    return s;
  }
  // 收工（C12 那一下、C11 预兆）：手上没活的人停下来，一个接一个转身对着镜头（x, z：镜头方向上远远一点，甲板坐标）。
  // o.act 转过来以后做什么（cheer 举手欢呼、nod 点头，从 a0 到 a1 秒），o.shrug 前几个人耸耸肩（shrugAt 秒），o.wave 离镜头最近的挥挥手，o.delay 晚多久才转，o.gap 一个接一个隔多久。
  // 正搬着东西的人放下以后也转过来（assignIdle）
  faceCam(x, z, o = {}) {
    this.endFace = { x, z, ...o };
    const sx = x / (Math.hypot(x, z) || 1), sz = z / (Math.hypot(x, z) || 1);
    const order = this.hands.filter((s) => s.g.visible).sort((p, q) => (q.x * sx + q.z * sz) - (p.x * sx + p.z * sz)); // 离镜头近的先转
    let k = 0;
    for (const s of order) { if (s.task && (s.task.type === 'carry' || s.task.type === 'hose')) continue; s.task = this.faceTask(k++); }
  }
  faceTask(k) { const F = this.endFace; return { type: 'face', t: -((F.delay || 0) + k * (F.gap ?? 0.12)), shrug: k < (F.shrug || 0), wave: k === 0 && !!F.wave }; }
  // 再近（W2）：离船头最近、手上没东西的那个人朝那边喊“浅了！”（喊的人返回，画面上那句字挂在他头上）
  shout(x, z) {
    const cand = this.sailors.filter((s) => !s.hold && s.g.visible && !(s.task && s.task.type === 'carry'));
    cand.sort((p, q) => q.z - p.z);
    const s = cand[0] || this.captain;
    s.react('shout', { x, z });
    return s;
  }
  updateEnv(dt, ctx) {
    const E = this.env, b = this.boat, sp = b.speed, k = 1 - Math.exp(-dt * 3);
    const acc = dt > 0 ? Math.max(-4, Math.min(4, (sp - this._spd) / dt)) : 0;
    E.lon += (acc - E.lon) * k; E.lat += (sp * b.turn - E.lat) * k;
    E.wind += (Math.max(0, Math.min(1, (Math.abs(sp) - 3) / 6)) - E.wind) * k;
    E.spraying = !!ctx.spraying; E.fast = !!this.hoseFast; E.tip = ctx.tipLocal || null; E.turn = b.turn; E.speed = sp;
    const tg = this.hoseTarget || BOAT.washLocal; E.wx = tg.x; E.wz = tg.z;
    // 搁浅那一刻（grounded 从 0 变成 >0）：按撞前的船速踉跄
    const gr = b.grounded || 0;
    if (gr > 0 && !(this._gr > 0)) this.bump(this._spd);
    this._gr = gr;
    // 泥包落地：清洗位刚有泥包后 0.2 秒（落包的时长）；主控在落包时调 jolt() 的话以那次为准
    if (this.washR && !this._washR) this._joltAuto = this.t + 0.2;
    this._washR = this.washR || 0;
    if (this._joltAuto > 0 && this.t >= this._joltAuto) { this._joltAuto = -1; this.jolt(BOAT.washLocal.x, BOAT.washLocal.z, 1); }
    // 船长：开船时挥手；下网作业时隔一阵指向臂端、打下放手势
    const cap = this.captain, moving = Math.abs(sp) > 0.3;
    // 揭晓后镜头拉回大视野的那一会儿（quietUntil 之前）不挥手：等镜头到了再挥，看得见（B19）
    if (moving && !this._moving && this.t > 1) { if (this.t < (this.quietUntil || 0)) this._waveDue = this.quietUntil; else cap.gesture('wave'); }
    if (this._waveDue && this.t >= this._waveDue) { this._waveDue = 0; if (moving) cap.gesture('wave'); }
    this._moving = moving;
    if (this.opActive && !moving && ctx.tipLocal && this.t > cap.nextGest) { cap.gesture('point', { x: ctx.tipLocal[0], z: ctx.tipLocal[1] }); cap.nextGest = this.t + 7 + rnd() * 5; }
    // 欢呼时找身边也在欢呼的人击掌
    for (const s of this.hands) {
      s.buddy = null;
      if (s.anim !== 'cheer') continue;
      let bd = 2.6;
      for (const o of this.hands) { if (o === s || o.anim !== 'cheer') continue; const d = Math.hypot(o.x - s.x, o.z - s.z); if (d < bd) { bd = d; s.buddy = o; } }
    }
  }
  // 搬运：entry = { mesh(在 boat.deck 下), x, z, kind, e(揭宝条目：物件/活物与入账记录), onPicked(), onStowed() }
  enqueueCarry(entry) { this.carryQueue.push(entry); }
  // 冲洗：两人站在镜头对侧，都拿水枪冲泥壳
  // 网带着东西起吊时就先叫一次（人提前走到清洗位等着），落包时按那时的镜头再叫一次：已经在路上的人改去新的位置
  requestHoses(n, target, camSide = 0) {
    this.hoseWanted = n; this.hoseTarget = target; this.hoseFast = false;
    this.hoseAim = null; this.hoseSoft = false; this.hoseOff = false; // 珍品露头（C5）：水柱对着哪一角、最后 1 秒收小、最后 0.4 秒关掉
    // 冲洗位站在镜头对侧，不挡近景
    const far = camSide + Math.PI;
    const T = BOAT.tankLocal;
    this.hoseSpots = [-0.75, 0.75].map((o) => {
      const a = far + o;
      let x = Math.max(-2.2, Math.min(2.3, target.x + Math.sin(a) * 1.45)), z = Math.max(-7.3, Math.min(-4.5, target.z + Math.cos(a) * 1.45));
      if (Math.abs(x - T.x) < 0.75 && Math.abs(z - T.z) < 0.9) z = z < T.z ? T.z - 0.95 : T.z + 0.95; // 让开水槽
      return [x, z];
    });
    // 已经叫来的人：按新位置重新分（谁离哪个近谁去），家伙也按这一包换
    const free = this.hoseSpots.map((p, i) => i);
    for (const s of this.hosers) {
      if (!s.task || s.task.type !== 'hose') continue;
      let bi = free[0], bd = 1e9;
      for (const i of free) { const d = Math.hypot(this.hoseSpots[i][0] - s.x, this.hoseSpots[i][1] - s.z); if (d < bd) { bd = d; bi = i; } }
      free.splice(free.indexOf(bi), 1);
      const [x, z] = this.hoseSpots[bi];
      s.task.spot = bi;
      if (Math.hypot(s.task.x - x, s.task.z - z) > 0.2) { s.task.x = x; s.task.z = z; s.task.phase = 'go'; s.walkTo(x, z); }
    }
  }
  // 揭晓那一刻：冲洗手放下家伙往后退两步，给近景让出地方；镜头拉回大视野时，他们点头（珍贵的一网全船的人转过来举手）
  // react.wait：近景展示还剩多久（这段时间里人站在近景外面，反应要留到大视野里才看得见）
  // react.look：普通的一网，冲洗手凑过去看的两处（展示台后面，B18）——到那儿弯下腰看着，镜头拉回大视野后再点头
  // 珍贵的一网（C7）：欢呼从离它最近的人开始，一个接一个传开（约 0.17 秒一个）
  releaseHoses(react = null) {
    this.hoseWanted = 0; this.hoseAim = null; this.hoseSoft = false; this.hoseOff = false;
    const tgt = this.hoseTarget || BOAT.washLocal;
    // 一个个错开一点开始（点头、欢呼不是整齐划一的）
    let k = 0;
    const spots = react && !react.precious && react.look ? react.look.slice() : null;
    for (const s of this.hosers) {
      if (!react) { s.task = null; s.anim = 'idle'; continue; }
      const dx = s.x - tgt.x, dz = s.z - tgt.z, d = Math.hypot(dx, dz) || 1;
      // 珍品（C7）镜头收得近：只往后让小半步，退满 2.25 米会站到画面边上（四个人要都在画里）
      const r = react.precious ? Math.min(2.25, d + 0.25) : 2.25;
      let to = [Math.max(-2.2, Math.min(2.3, tgt.x + dx / d * r)), Math.max(-7.35, Math.min(-4.45, tgt.z + dz / d * r))];
      if (spots && spots.length) { spots.sort((p, q) => Math.hypot(p[0] - s.x, p[1] - s.z) - Math.hypot(q[0] - s.x, q[1] - s.z)); to = spots.shift(); }
      s.path = null;
      s.task = { type: 'admire', phase: 'back', from: [s.x, s.z], to, t: 0, wait: (react.wait || 0) + k++ * (react.precious ? 0.07 : 0.12), dur: react.precious ? 2.4 : 1.3, cheer: !!react.precious, peer: !!spots, tx: tgt.x, tz: tgt.z };
    }
    if (react && react.precious) {
      for (const s of this.hands) {
        if (this.hosers.includes(s) || (s.task && s.task.type === 'carry')) continue;
        // 早就凑过来站好了的：接着在原地等；还在路上的走到再欢呼
        if (s.task && s.task.type === 'admire' && s.task.gather) { s.task.t = 0; s.task.dur = 2.0 + Math.random() * 0.5; continue; }
        s.path = null;
        s.task = { type: 'admire', phase: 'wait', t: 0, wait: 0, dur: 2.0 + Math.random() * 0.6, cheer: true, tx: tgt.x, tz: tgt.z };
      }
      // 一个接一个：离它近的先跳起来
      const cheer = this.hands.filter((s) => s.task && s.task.type === 'admire' && s.task.cheer);
      cheer.sort((p, q) => Math.hypot(p.x - tgt.x, p.z - tgt.z) - Math.hypot(q.x - tgt.x, q.z - tgt.z));
      cheer.forEach((s, i) => { s.task.wait = (react.wait || 0) + i * 0.17; });
      this.cheerT = this.t; this.heyDone = false; this.whistleDone = false;
    }
    this.hosers = [];
  }
  // 珍贵的一网冲到一半、泥缝里透出光（C7）：闲着的人凑过来，站到冲洗位后面、镜头对侧，等着看
  // 位置偏画面左边（右边是名字卡），一人一处、走得到、不挤
  gather(target, camSide) {
    const far = camSide + Math.PI;
    const used = this.hosers.filter((h) => h.task).map((h) => [h.task.x, h.task.z]);
    for (const s of this.hands) {
      if (this.hosers.includes(s) || (s.task && (s.task.type === 'carry' || s.task.type === 'hose'))) continue;
      const spot = this.audienceSpot(target, far, used);
      used.push(spot);
      s.task = { type: 'admire', phase: 'go', gather: true, t: 0, wait: 30, dur: 2.2, cheer: true, tx: target.x, tz: target.z };
      s.walkTo(spot[0], spot[1]);
    }
  }
  // da > 0 是画面左边（右边是名字卡）；|da| 不超过 1，人都在画里（水槽正挡在后面，站不下就往后退一点）
  audienceSpot(tg, far, used) {
    for (const r of [2.5, 2.9, 3.3, 2.1]) {
      for (const da of [0.35, 0.75, 0.05, 1.0, -0.3, -0.6]) {
        const a = far + da, x = tg.x + Math.sin(a) * r, z = tg.z + Math.cos(a) * r;
        if (x < -2.25 || x > 2.3 || z < -7.35 || z > -3.0 || blockedAt(x, z)) continue;
        if (used.some(([ux, uz]) => Math.hypot(ux - x, uz - z) < 0.8)) continue;
        return [x, z];
      }
    }
    return [Math.max(-2.2, Math.min(2.3, tg.x + Math.sin(far) * 2.3)), Math.max(-7.3, Math.min(-4.5, tg.z + Math.cos(far) * 2.3))];
  }
  // 珍品进舱（C8）：抱着它的人往舱口走，其他闲着的人让到路两边、转过来看着
  makeWay(who, mesh) {
    const H = BOAT.hatchLocal;
    const spots = [[-1.95, -4.35], [1.95, -4.35], [-1.55, -1.55], [1.55, -1.55], [-2.15, -5.7], [2.15, -5.7], [0, -1.15]];
    const ax = who.x, az = who.z, sp = this.lowerSpot(who, { x: who.x, z: who.z });
    const off = (x, z) => { // 离搬运那条路（人 → 舱口边）多远
      const dx = sp.x - ax, dz = sp.z - az, L = dx * dx + dz * dz || 1, u = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / L));
      return Math.hypot(x - ax - dx * u, z - az - dz * u);
    };
    const used = [];
    let k = 0;
    for (const s of this.hands) {
      if (s === who || (s.task && (s.task.type === 'carry' || s.task.type === 'hose'))) continue;
      let best = null, bd = 1e9;
      for (const p of spots) {
        if (used.includes(p) || off(p[0], p[1]) < 1.0 || blockedAt(p[0], p[1]) || Math.hypot(p[0] - H.x, p[1] - H.z) < 1.2) continue;
        const d = Math.hypot(p[0] - s.x, p[1] - s.z);
        if (d < bd) { bd = d; best = p; }
      }
      if (!best) continue;
      used.push(best);
      s.path = null;
      s.task = { type: 'honor', phase: 'go', t: 0, who, wait: 0.12 + k++ * 0.1, cheer: s.role === 'wash' };
      s.walkTo(best[0], best[1]);
    }
  }
  honorBurst() {
    for (const s of this.hands) if (s.task && s.task.type === 'honor') { s.task.phase = 'burst'; s.task.t = 0; }
  }
  pendingCarry() { return this.carryQueue.length + this.hands.filter((s) => s.task && s.task.type === 'carry').length; }
  update(dt, ctx) {
    this.t += dt;
    this.updateEnv(dt, ctx);
    // 船长：舵位
    const cap = this.captain;
    // 停着的时候船长隔一会儿搭凉棚往外看看（A5）
    cap.x = 0.45; cap.z = 3.4; cap.face = 0; cap.anim = Math.abs(this.boat.speed) > 0.3 ? 'operate' : Math.floor(this.t / 7) % 2 ? 'look' : 'idle';
    cap.animate(dt);
    // 冲洗需求优先
    WASH_BLOCK = this.washR ? [BOAT.washLocal.x, BOAT.washLocal.z, this.washR + 0.3] : null;
    while (this.hosers.length < this.hoseWanted) {
      const s = this.pickFree(true);
      if (!s) break;
      const spots = this.hoseSpots || [[-0.55, -5.35], [2.05, -6.9]];
      // 离谁近谁去那一处
      const taken = new Set(this.hosers.map((h) => h.task && h.task.spot));
      let bi = 0, bd = 1e9;
      spots.forEach((p, i) => { if (taken.has(i)) return; const d = Math.hypot(p[0] - s.x, p[1] - s.z); if (d < bd) { bd = d; bi = i; } });
      this.hosers.push(s);
      const sp = spots[bi];
      s.task = { type: 'hose', phase: 'go', x: sp[0], z: sp[1], spot: bi };
      s.walkTo(sp[0], sp[1]);
    }
    // 搬运：每人一件
    while (this.carryQueue.length) {
      const s = this.pickFree(false);
      if (!s) break;
      const e = this.carryQueue.shift();
      const it = e.e && e.e.kind === 'item' ? e.e.it : null;
      const mass = it && it.def ? it.def.mass : 'light';
      s.task = { type: 'carry', phase: 'go', e, heavy: mass === 'heavy', mid: mass === 'mid' };
      s.walkTo(e.x + 0.45, e.z);
    }
    this.giveWay(dt);
    for (const s of this.hands) {
      if (!s.task) this.assignIdle(s, ctx);
      this.runTask(s, dt, ctx);
      s.animate(dt);
      choreFx(this, s); // 擦甲板溅水、敲出火星、缆绳滴水（A5，chores.js）
    }
    this.cheerSounds();
    this._spd = this.boat.speed;
  }
  // 走路的人路过别人（尤其是蹲在那儿干活的）时身子往旁边绕开，不从人身上穿过去（A5）。
  // 只挪画出来的身子（wx/wz），规则里走的路线、到的时刻不变；走到了、停下来就慢慢回到原位
  giveWay(dt) {
    const all = this.sailors, R = 1.05;
    for (const s of all) {
      let tx = 0, tz = 0;
      if (s.anim === 'walk' || s.anim === 'carry' || s.anim === 'carryHeavy') {
        const fx = Math.sin(s.face), fz = Math.cos(s.face);
        for (const o of all) {
          if (o === s || !o.g.visible) continue;
          const dx = s.x - o.x, dz = s.z - o.z, d = Math.hypot(dx, dz);
          if (d >= R) continue;
          // 往走路方向的侧面让：取离开对方那一侧（正对着时固定往右）
          let side = dx * fz - dz * fx;
          side = Math.abs(side) < 0.05 ? 1 : Math.sign(side);
          const k = (1 - d / R) * 0.8;
          tx += fz * side * k; tz += -fx * side * k;
        }
        const l = Math.hypot(tx, tz); if (l > 0.65) { tx *= 0.65 / l; tz *= 0.65 / l; }
        // 别让出栏杆：船宽（船头那一截收窄）往里留 0.45 米
        const lim = (s.z > 3 ? BOAT.hullHalfW * Math.max(0.3, 1 - (s.z - 3) / 5) : BOAT.hullHalfW) - 0.45;
        const nx = s.x + tx; if (Math.abs(nx) > Math.max(lim, Math.abs(s.x))) tx = Math.sign(nx) * Math.max(lim, Math.abs(s.x)) - s.x;
      }
      const r = 1 - Math.exp(-dt * (tx || tz ? 10 : 2.5));
      s.wx = (s.wx || 0) + (tx - (s.wx || 0)) * r; s.wz = (s.wz || 0) + (tz - (s.wz || 0)) * r;
    }
  }
  // 欢呼的声音跟着动作走（C7）：第一个跳起来时一声“嘿——！”，两手在头顶拍到一起时一下掌声，跟身边的人击掌时“啪”，
  // 石头吹一声口哨。动作循环见 crewlook.poseCheer：拍手在 0.97、1.3 秒，击掌在 1.77 秒（每 2.2 秒一轮）
  cheerSounds() {
    const A = this.audio;
    let any = 0;
    for (const s of this.hands) {
      if (s.anim !== 'cheer') { s._cc = -1; continue; }
      const c = s.rig.ta % 2.2, p = s._cc; s._cc = c;
      any++;
      if (!A || p < 0) continue;
      const cross = (x) => (p < x && c >= x) || (p > c && (x > p || x <= c));
      if (cross(0.967) || cross(1.3)) A.play('clap', { k: s.i / 4, v: 0.8 + 0.4 * Math.random() });
      if (s.buddy && s.i < s.buddy.i && cross(1.77)) A.play('slap');
      if (!this.whistleDone && !this.endFace && s.name === '石头' && cross(0.55)) { this.whistleDone = true; A.play('whistle'); }
    }
    // 收工时（C12 捞完）举手只拍手：“嘿——”和口哨是珍品欢呼（C7）的，不在这里用
    if (any && !this.heyDone && !this.endFace && A) { this.heyDone = true; A.play('hey', { n: Math.min(4, this.hands.length) }); }
  }
  pickFree(forHose) {
    // 冲洗先叫冲洗手、搬运先叫搬运手；人手不够时别人来帮。正在搬运、冲洗、看着刚揭开的东西的人不打断
    const want = forHose ? 'wash' : 'carry';
    let best = null, score = -1;
    for (const s of this.hands) {
      if (s.task && (s.task.type === 'carry' || s.task.type === 'hose' || s.task.type === 'admire')) continue;
      const sc = (s.role === want ? 2 : 0) + (!s.task || s.task.idle ? 1 : 0);
      if (sc > score) { score = sc; best = s; }
    }
    return best;
  }
  assignIdle(s, ctx) {
    if (this.endFace) { s.task = this.faceTask(4); return; }
    const sailing = Math.abs(this.boat.speed) > 0.6;
    const opts = [];
    if (this.opActive) opts.push({ type: 'operate', x: 1.2, z: -0.1, face: [0, -0.9], dur: 6 + Math.random() * 5 }, { type: 'watch', x: (ctx.tipSide || 1) * 2.15, z: -1.0, dur: 5 + Math.random() * 4 });
    if (sailing) opts.push({ type: 'look', x: 0.3, z: 6.1, face: [0.3, 12], dur: 8 + Math.random() * 6 }, { type: 'coil', x: 2.05, z: -1.9, face: [1.25, -1.9], dur: 6 + Math.random() * 4 });
    opts.push({ type: 'coil', x: 2.05, z: -1.9, face: [1.25, -1.9], dur: 5 + Math.random() * 4 }, { type: 'check', x: -1.05, z: -1.75, face: [0, -0.9], dur: 5 + Math.random() * 3 },
      { type: 'patrol', dur: 0 }, { type: 'lean', x: -2.3, z: -1.2 - Math.random() * 2.6, face: [-5, -2.5], dur: 6 + Math.random() * 6 });
    // 远远就看得出在干什么的几样活：擦甲板、蹲着敲、倒手收缆（A5，chores.js）
    opts.push(...choreOptions(this));
    // 避免多人挤在同一处
    const taken = new Set(this.hands.filter((o) => o !== s && o.task).map((o) => o.task.type + (o.task.x || '')));
    const choices = opts.filter((o) => !taken.has(o.type + (o.x || '')));
    // 离别人远的优先，别挤在一处（A5）
    const o = (choices.length ? pickSpread(choices, this.hands, s) : null) || opts[0];
    if (o.type === 'patrol') {
      const keys = Object.keys(NODES);
      const k = keys[Math.floor(Math.random() * keys.length)];
      s.task = { type: 'patrol', idle: true, phase: 'go' };
      s.walkTo(NODES[k][0], NODES[k][1]);
    } else {
      s.task = { ...o, idle: true, phase: 'go', t: 0 };
      s.walkTo(o.x, o.z);
    }
  }
  runTask(s, dt, ctx) {
    const T = s.task;
    if (!T) { s.anim = 'idle'; return; }
    if (T.type === 'carry') return this.runCarry(s, T, dt, ctx);
    if (T.type === 'hose') {
      if (T.phase === 'go') { s.anim = 'walk'; if (s.stepWalk(dt, 2.0)) T.phase = 'spray'; return; }
      s.anim = 'hose';
      const tgt = this.hoseTarget || BOAT.washLocal;
      s.faceTo(tgt.x, tgt.z, dt);
      if (ctx.spraying) {
        // 水柱从枪口出去（跟着后坐和左右扫）；还没拿上枪时按身前的位置
        const from = s.nozzleTip(_from) ? _from : _from.set(s.x + Math.sin(s.face) * 0.6, BOAT.deckY + 1.2, s.z + Math.cos(s.face) * 0.6);
        const to = this.hoseAim ? _to.copy(this.hoseAim) : _to.set(tgt.x, BOAT.deckY + 0.35, tgt.z);
        this.boat.deck.localToWorld(from); this.boat.deck.localToWorld(to);
        // 水柱和打在泥上溅起来的水由揭晓那边画（看得见的水柱、泥水越冲越清、加快时变粗）；没接上时用粒子
        // 按了加快：水柱开到最大；珍品最后 1 秒收小、最后 0.4 秒关掉（C5，水柱那边也看 hoseSoft、hoseAim）
        if (this.hoseOff) { /* 关了：水柱不画 */ }
        else if (this.hoseFx) this.hoseFx(s, from, to);
        else {
          this.particles.hose(from, to, this.hoseFast ? 9 : this.hoseSoft ? 2 : 4);
          if (Math.random() < (this.hoseFast ? 0.9 : this.hoseSoft ? 0.2 : 0.5)) this.particles.splat(to.x + (Math.random() - 0.5) * 0.5, to.y + 0.2, to.z + (Math.random() - 0.5) * 0.5, 2);
        }
      }
      return;
    }
    if (T.type === 'face') {
      // 收工：停下来（还没轮到就站着），转过身对着镜头；捞完的举手欢呼、中途收工的点点头、没油的有人耸耸肩
      const F = this.endFace || {};
      T.t += dt;
      s.anim = 'idle';
      if (T.t < 0) return;
      s.faceTo(F.x, F.z, dt * 0.8);
      if (F.act && T.t > (F.a0 || 0) && T.t < (F.a1 || 2)) s.anim = F.act;
      if (T.shrug && !T.shrugged && T.t > (F.shrugAt ?? 0.3)) { T.shrugged = true; s.react('shrug', { x: F.x, z: F.z }); }
      if (T.wave && !T.waved && T.t > 0.45) { T.waved = true; s.gesture('wave'); } // 离镜头最近的那个朝镜头挥挥手（远景里也看得出转过来了）
      return;
    }
    if (T.type === 'glance') {
      // 空网：停下来转身看那一摊泥水一会儿，再接着干
      T.t += dt; s.anim = 'idle';
      if (T.t > 0) s.faceTo(T.x, T.z, dt * 0.8);
      if (T.t > T.dur) s.task = null;
      return;
    }
    if (T.type === 'honor') {
      // 珍品进舱（C8）：让到两边，转过来看着抱它的人走到舱口；放进去那一下一起点头、举手
      T.t += dt;
      if (T.phase === 'go') { s.anim = 'walk'; if (s.stepWalk(dt, 2.1)) { T.phase = 'watch'; T.t = 0; } if (T.t > 6) T.phase = 'watch'; return; }
      const c = T.who && T.who.task && T.who.task.type === 'carry' ? T.who : null;
      s.faceTo(c ? c.x : BOAT.hatchLocal.x, c ? c.z : BOAT.hatchLocal.z, dt * 1.5);
      if (T.phase === 'watch') { s.anim = 'idle'; if (T.t > 14) s.task = null; return; }
      s.anim = T.t > T.wait ? (T.cheer ? 'cheer' : 'nod') : 'idle';
      if (T.t > T.wait + 1.7) s.task = null;
      return;
    }
    if (T.type === 'admire') {
      T.t += dt;
      if (T.phase === 'go') {
        // 凑过来：走到看得见的地方站好（走到了还没揭晓，就站着等）
        s.anim = 'walk';
        if (s.stepWalk(dt, 1.8)) T.phase = 'wait';
        if (T.t > 25) s.task = null;
        return;
      }
      s.faceTo(T.tx, T.tz, dt * 1.5);
      if (T.phase === 'back') {
        // 面朝收获往后退两步
        const k = Math.min(1, T.t / (T.peer ? 0.35 : 0.55)), e = k * (2 - k);
        s.x = T.from[0] + (T.to[0] - T.from[0]) * e; s.z = T.from[1] + (T.to[1] - T.from[1]) * e;
        // 凑过去看的（B18）只挪半步：边挪边弯下腰，确认后很快就把脸凑进画里
        s.anim = T.peer && Math.hypot(T.to[0] - T.from[0], T.to[1] - T.from[1]) < 0.7 ? 'peer' : 'walk';
        if (k >= 1) { T.phase = 'wait'; }
        return;
      }
      if (T.phase === 'wait') { s.anim = T.peer ? 'peer' : 'idle'; if (T.t >= T.wait) { T.phase = 'watch'; T.t = 0; } return; }
      s.anim = T.cheer ? 'cheer' : 'nod';
      if (T.t > T.dur) s.task = null;
      return;
    }
    if (T.phase === 'go') { s.anim = 'walk'; if (s.stepWalk(dt, 1.5)) { T.phase = 'do'; T.t = 0; } return; }
    T.t += dt;
    s.anim = CHORE_ANIM[T.type] || { operate: 'operate', watch: 'idle', look: 'look', coil: 'coil', check: 'crouch', lean: 'lean', patrol: 'idle' }[T.type] || 'idle';
    if (T.face) s.faceTo(T.face[0], T.face[1], dt);
    if (T.type === 'watch' && ctx.tipLocal) s.faceTo(ctx.tipLocal[0], ctx.tipLocal[1], dt);
    if (T.t > (T.dur || 1.5)) s.task = null;
    // 开始作业时打断闲事
    if (T.idle && this.opActive && T.type !== 'operate' && T.type !== 'watch' && T.t > 1 && Math.random() < dt * 0.3) s.task = null;
  }
  // 舱口四周放货的位置：前沿两处、左右舷各一处（几个人同时搬也不挤在一起）
  lowerSpot(s, e) {
    const H = BOAT.hatchLocal;
    const spots = [[-0.38, H.z + 1.2], [0.38, H.z + 1.2], [-1.22, H.z + 0.15], [1.22, H.z + 0.15]];
    const taken = new Set(this.hands.filter((o) => o !== s && o.task && o.task.type === 'carry' && o.task.spot != null).map((o) => o.task.spot));
    let best = 0, bd = 1e9;
    spots.forEach((p, i) => { const d = Math.hypot(p[0] - e.x, p[1] - e.z) + (taken.has(i) ? 50 : 0); if (d < bd) { bd = d; best = i; } });
    return { i: best, x: spots[best][0], z: spots[best][1] };
  }
  runCarry(s, T, dt, ctx) {
    const e = T.e;
    const H = BOAT.hatchLocal;
    if (T.phase === 'go') {
      s.anim = 'walk';
      if (s.stepWalk(dt, 1.9)) { T.phase = 'pick'; T.t = 0; }
      return;
    }
    if (T.phase === 'pick') {
      T.t += dt; s.anim = 'crouch'; s.faceTo(e.x, e.z, dt);
      // 重的东西蹲得久一点才抱起来；刚从展示台放下、还没落稳的先等一下；活蟹等它在格栅上窜过一截再捏（C10，最多等 2.2 秒）
      const ud = e.mesh.userData || {};
      if (T.t > (T.heavy ? 0.75 : 0.45) && !ud.settling && (e.kind !== 'live' || ud.dashed || T.t > 2.2)) {
        s.hold = { mesh: e.mesh, lift: 0, spin: e.kind === 'live' ? 0 : 0.3, heavy: T.heavy, mid: T.mid };
        if (e.onPicked) e.onPicked(s);
        if (e.kind === 'live') { T.phase = 'tohatch'; s.walkTo(BOAT.tankLocal.x - 0.85, BOAT.tankLocal.z + 0.2); }
        else { const sp = this.lowerSpot(s, e); T.spot = sp.i; T.sx = sp.x; T.sz = sp.z; T.phase = 'tohatch'; s.walkTo(sp.x, sp.z); }
      }
      return;
    }
    if (T.phase === 'tohatch') {
      s.anim = T.heavy ? 'carryHeavy' : 'carry';
      if (s.stepWalk(dt, T.heavy ? 1.05 : T.mid ? 1.3 : 1.6)) { T.phase = e.kind === 'live' ? 'drop' : 'lower'; T.t = 0; }
      return;
    }
    if (T.phase === 'drop') {
      // 活物：放进水槽
      T.t += dt; s.anim = 'crouch'; s.faceTo(BOAT.tankLocal.x, BOAT.tankLocal.z, dt);
      if (T.t > 0.5 && s.hold) {
        const m = s.hold.mesh; s.hold = null;
        if (!this.tankToss) m.position.set(BOAT.tankLocal.x, BOAT.deckY + 0.28, BOAT.tankLocal.z); // 有人接手（keep.js）：从手上抛进水槽
        if (e.onStowed) e.onStowed();
        this.carried++;
      }
      if (T.t > 0.9) s.task = null;
      return;
    }
    if (T.phase === 'lower') {
      // 蹲在围板边，把东西越过围板放进舱里那一堆上；舱里的堆随之长高
      T.t += dt; s.faceTo(H.x, H.z, dt * 2); s.anim = T.lift && T.t < T.hold ? 'carry' : 'lower';
      const m = s.hold && s.hold.mesh;
      if (m && !T.target) {
        const it = e.e && e.e.it;
        const id = it ? it.id : 'x' + this.carried;
        const body = m.isMesh ? m : m.children.find((c) => c.isMesh && c.geometry);
        T.target = this.hold && body ? this.hold.reserve(id, body.geometry) : { x: H.x, y: BOAT.deckY + 0.05, z: H.z, yaw: 0, s: 1 };
        s.hold.free = true;
        T.p0 = m.position.clone(); T.q0 = m.quaternion.clone();
        T.q1 = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), T.target.yaw);
        T.s0 = m.scale.x;
      }
      if (m && T.target) {
        // 珍贵的那件（C8）：先举到舱口上方，停半拍，再放下去
        if (T.target && T.lift == null) {
          const it = e.e && e.e.it;
          T.lift = it && it.precious ? 0.42 : 0; T.hold = T.lift ? T.lift + 0.6 : 0;
          if (T.lift) T.p1 = new THREE.Vector3(T.p0.x + (H.x - T.p0.x) * 0.45, BOAT.deckY + 1.05, T.p0.z + (H.z - T.p0.z) * 0.45);
        }
        let from = T.p0, t0 = 0.2;
        if (T.lift) {
          const a = Math.min(1, T.t / T.lift), qa = a * (2 - a);
          if (T.t < T.hold) {
            m.position.lerpVectors(T.p0, T.p1, qa);
            m.position.y += Math.sin(T.t * 7) * 0.012 * a;
            return;
          }
          from = T.p1; t0 = T.hold;
        }
        const k = Math.min(1, Math.max(0, (T.t - t0) / (T.lift ? 0.4 : 0.55))), q = T.lift ? k * k : k * k * (3 - 2 * k), tg = T.target;
        m.position.set(from.x + (tg.x - from.x) * q, from.y + (tg.y - from.y) * q + (T.lift ? 0 : Math.sin(k * Math.PI) * 0.22), from.z + (tg.z - from.z) * q);
        m.quaternion.copy(T.q0).slerp(T.q1, q);
        m.scale.setScalar(T.s0 + (tg.s - T.s0) * q);
        if (k >= 1) {
          s.hold = null;
          const it = e.e && e.e.it, rec = e.e && e.e.rec;
          if (this.hold) this.hold.put(m, { id: it ? it.id : rec ? rec.id : 'x' + this.carried, precious: rec ? rec.precious : it && it.precious, value: rec ? rec.value : it ? it.value : 0, mass: it && it.def ? it.def.mass : null });
          if (e.onStowed) e.onStowed();
          this.carried++;
          T.phase = 'rise'; T.t = 0; T.nod = T.lift ? 1.5 : T.heavy ? 0.85 : 0;
          // 落到堆上溅起一点残水
          const w = new THREE.Vector3(tg.x, tg.y + 0.05, tg.z); this.boat.deck.localToWorld(w);
          for (let i = 0; i < 4; i++) this.particles.water.emit(w.x, w.y, w.z, (Math.random() - 0.5) * 0.8, 0.5 + Math.random() * 0.5, (Math.random() - 0.5) * 0.8, 0.4, 0.06, 0.62, 0.55, 0.42, 0.7, 0, 0.5, 6);
        }
      }
      return;
    }
    // 放下去以后直起身；重的、珍贵的拍拍手点个头（B21）
    if (T.phase === 'rise') { T.t += dt; s.anim = T.nod && T.t > 0.25 ? 'nod' : 'idle'; if (T.nod) s.faceTo(H.x, H.z, dt); if (T.t > 0.35 + T.nod) s.task = null; }
  }
}

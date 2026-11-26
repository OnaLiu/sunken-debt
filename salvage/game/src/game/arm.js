import * as THREE from 'three';
import { NET_R, ARM_MIN, ARM_MAX, ARM_TIP_H, MAX_WORK_DEPTH, netFuelCost, onNetR } from '../config.js';
import { BOAT } from '../world/boat.js';
import { TAG, TAG_TEXT } from '../world/collide.js';
import { clamp, damp, wrapAngle } from '../util/math.js';
import { N } from './tables.js';

// 打捞：白圈（网的落点）由玩家挪，吊臂照机械的样子自己追过去；每帧算出网口落在哪、碰不碰结构、多深、要多少作业油。
const RING_N = 40;
// 网口里取样的点：网口大小跟着设备变（船坞里升「网」），变了重排一遍（同一个数组，读它的地方不用换）
const SAMPLES = [];
function makeSamples() {
  SAMPLES.length = 0;
  SAMPLES.push({ x: 0, z: 0, r: 0 });
  const k = NET_R / 1.4;
  for (const [r, n] of [[0.45 * k, 6], [0.9 * k, 12], [NET_R - 0.05, 24]]) {
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      SAMPLES.push({ x: Math.cos(a) * r, z: Math.sin(a) * r, r });
    }
  }
}
makeSamples();

// 这一网的网口多大：海底照船上的网口（NET_R）；落进舱里时网口从露天舱口收拢着穿下去，最大只张到舱口放得下的那么大
// （配表「舱口里网口最大」）。网口升级以后舱里照样下得去，舱外一网多罩一两件（设计：设备越来越好，越捞越多）。
// 全游戏一份：白圈、预告、闭网兜到什么、打捞点怎么分组都用它
export const netRFor = (inHold) => (inHold ? Math.min(NET_R, N('舱口里网口最大', 1.4)) : NET_R);

// 吊臂是一台有分量的液压机器：绕吊机转、伸缩、升降各有自己的最高速度、加速度和「吃劲」的快慢（加加速度）。
// 起步慢慢吃上劲、匀速转、快到了按刹车曲线提前减速，停得干脆，不冲过头、不回弹。
// v 最高速度，a 最大加速度，j 加速度每秒最多变多少，k 最后一小段按离目标多远收速度（越大停得越利落），
// kv 追想要的速度有多使劲，brake 刹车按最大加速度的几成算（留一点余量，刹得住、停得准）
const SLEW = { v: 0.95, a: 1.3, j: 6.5, k: 5, kv: 14, brake: 0.85 }; // 转：弧度/秒、弧度/秒²、弧度/秒³
const EXT = { v: 3.0, a: 4.5, j: 24, k: 5, kv: 14, brake: 0.85 }; // 伸缩：米/秒、米/秒²
const LIFT = { v: 1.5, a: 3.0, j: 16, k: 5, kv: 14, brake: 0.85 }; // 臂端升降
const AIM = { slew: SLEW, ext: EXT, lift: LIFT };
// 网提上来以后自动转回甲板（这时玩家不操作，设计：下放、闭合、提起、转回甲板一气呵成）：
// 还是同一台机器的起步、匀速、刹车，只是放开了转，网下在正船尾（要绕驾驶室）也三秒半转到甲板上方。
// 臂伸得越长，同样的转速下臂头走得越快、网包越会被离心甩出去：转速和加速度再按臂头的线速度（米/秒）、加速度（米/秒²）封顶，
// 伸在外面绕驾驶室的那一段转得慢，收短了才放开转
const HOME = {
  slew: { v: 2.4, a: 3.0, j: 12, k: 5, kv: 14, brake: 0.85 },
  ext: { v: 5.2, a: 8.5, j: 40, k: 5, kv: 14, brake: 0.85 },
  lift: { v: 2.2, a: 4.5, j: 22, k: 5, kv: 14, brake: 0.85 },
  tip: { v: 12.0, a: 14.5 },
};
const _homeSlew = { ...HOME.slew };
// 网架挂在臂端下面：从驾驶室上方扫过去会撞上（船局部，算上网口半径）
const CABIN = {};
const cabinZone = () => Object.assign(CABIN, { x0: -5.2 - NET_R, x1: -2.3 + NET_R, hz: 1.5 + NET_R });
cabinZone();
const inCabin = (x, z) => x > CABIN.x0 && x < CABIN.x1 && Math.abs(z) < CABIN.hz;
// 从吊机往每个方向看，网架要伸到多远以外才不在驾驶室上方（碰不到给 0）：每 0.02 弧度一格
const CAB_N = 315;
const CAB_R = new Float32Array(CAB_N);
function cabinTable() {
  for (let i = 0; i < CAB_N; i++) {
    const a = -Math.PI + (i / CAB_N) * Math.PI * 2;
    let out = 0;
    for (let r = 0.5; r < 12; r += 0.05) if (inCabin(BOAT.crane.x + Math.cos(a) * r, Math.sin(a) * r)) out = r;
    CAB_R[i] = out ? out + 0.15 : 0;
  }
}
cabinTable();
// 沿着从 a 转过 da 这段弧，网架最少要伸多远才一路不进驾驶室上方
const cabinNeed = (a, da) => {
  let need = 0;
  const n = Math.max(1, Math.ceil(Math.abs(da) / 0.02));
  for (let i = 0; i <= n; i++) {
    const w = wrapAngle(a + (da * i) / n);
    need = Math.max(need, CAB_R[Math.min(CAB_N - 1, Math.floor(((w + Math.PI) / (Math.PI * 2)) * CAB_N))]);
  }
  return need;
};
// 网口不能压在自己船上：船身周围这一圈落不了网
export const BOAT_ZONE = { hx: BOAT.halfLen + 0.3 + NET_R, hz: 2.3 + NET_R + 0.2 };
export const inBoatZone = (x, z) => Math.abs(x) < BOAT_ZONE.hx && Math.abs(z) < BOAT_ZONE.hz;
// 船身那一圈没加宽时有多宽（甲板加宽的平台在 deck.js 里往外加）
export const boatZoneHz = () => 2.3 + NET_R + 0.2;
// 网口变大了：取样点、驾驶室那一圈、船身那一圈跟着重算（甲板加宽的那一截由 deck.js 自己的钩子接着加上）
onNetR(() => {
  makeSamples();
  cabinZone();
  cabinTable();
  BOAT_ZONE.hx = BOAT.halfLen + 0.3 + NET_R;
  BOAT_ZONE.hz = boatZoneHz();
});

// 一根轴走一帧（st: { p 位置, v 速度, c 加速度 }）。先看加速度收回到 0 要多久、那时到了哪、多快
// （加速度不能说变就变），再按「从那儿刹得住」的速度去追：远处全速，近了提前减速，最后一小段贴过去
function axis(st, target, P, dt) {
  const tau = Math.abs(st.c) / P.j;
  const pv = st.v + st.c * tau * 0.5;
  const pp = st.p + st.v * tau + (st.c * tau * tau) / 3;
  const e = target - pp;
  const ae = Math.abs(e);
  const ab = P.a * P.brake;
  const h = ab / (2 * P.j);
  // 带着「加速度要慢慢变」算的刹车距离：v²/2a + v·a/2j = 剩下的路
  const vd = Math.sign(e) * Math.min(P.v, ab * (Math.sqrt(h * h + (2 * ae) / ab) - h), P.k * ae);
  const want = clamp((vd - pv) * P.kv, -P.a, P.a);
  const dj = P.j * dt;
  st.c = clamp(want, st.c - dj, st.c + dj);
  st.v = clamp(st.v + st.c * dt, -P.v * 1.02, P.v * 1.02);
  st.p += st.v * dt;
}

export class Arm {
  constructor(world, boatCtl) {
    this.world = world;
    this.bc = boatCtl;
    // 白圈（网的落点）：世界里的一点，开着船也留在玩家放的地方；够不着时停在够得着的最远处
    this.aim = new THREE.Vector3();
    // 白圈在船局部的位置（xz）；网口压不到船上时吊臂要去的地方
    this.local = new THREE.Vector2(7, 3);
    this.target = new THREE.Vector2(7, 3);
    // 吊臂现在在哪：绕吊机的角度 a、离吊机 r、臂端高 y，和它们的速度（v…）、加速度（c…）
    this.mech = { a: 0, r: 3.7, y: 5.6, va: 0, vr: 0, vy: 0, ca: 0, cr: 0, cy: 0 };
    this.dirSign = 0; // 这一趟转动走哪一边（绕开驾驶室时不走近路）
    this.world_ = new THREE.Vector3();
    this.eval = null;
    this.footprint = new Footprint();
    world.scene.add(this.footprint.group);
    this.reachRing = new ReachRing();
    world.scene.add(this.reachRing.line);
    this.pushOut = 0; // 白圈顶在最远处还在往外推：够得着的那一圈亮一下
    this.jumps = 0; // 白圈被直接放到某处（进打捞模式、工具摆位）的次数：镜头看到变了就直接对过去
    // 开着船进打捞模式、玩家还没动过白圈：白圈放在「船停下来时」镜头看过去那一侧（lead，船局部），
    // 不然船带着速度往前滑，水里那一点很快就从船底下过来、压到自己船上（全速滑停要十来米）。
    // wish：白圈想去的那一点（世界），可以在够不着的地方：够不着时白圈停在够得着的最远处，船靠过去了就落到那一点上
    this.lead = null;
    this.wish = null;
  }

  // 船局部 ↔ 世界（水平）
  _toLocal(x, z) {
    const c = Math.cos(this.bc.heading), s = Math.sin(this.bc.heading);
    const dx = x - this.bc.pos.x, dz = z - this.bc.pos.z;
    return { x: dx * c - dz * s, z: dx * s + dz * c };
  }

  // 白圈只受够不够得着的限制（离吊机最远 ARM_MAX）；从船身上、船底下穿过去不拦着
  _clampLocal(x, z) {
    const dx = x - BOAT.crane.x, dz = z - BOAT.crane.z;
    const d = Math.hypot(dx, dz);
    if (d <= ARM_MAX) return { x, z, out: false };
    return { x: BOAT.crane.x + (dx / d) * ARM_MAX, z: BOAT.crane.z + (dz / d) * ARM_MAX, out: true };
  }

  _setAimLocal(x, z) {
    const q = this._clampLocal(x, z);
    this.local.set(q.x, q.z);
    const w = this.bc.localToWorld(new THREE.Vector3(q.x, 0, q.z));
    this.aim.set(w.x, 0, w.z);
    this.target.set(q.x, q.z);
    this.constrain(this.target);
    return q.out;
  }

  // 进打捞模式：白圈放到镜头看过去的那一侧、离吊机 7.2 米（压在船上就挪出来）。
  // 船还在往前滑：放在船滑停以后的那个位置上（往船头那一侧放时往前多放出滑停的那一段），玩家动白圈之前一直这样算
  aimToward(dirWorld) {
    const c = Math.cos(this.bc.heading), s = Math.sin(this.bc.heading);
    const lx = dirWorld.x * c - dirWorld.z * s;
    const lz = dirWorld.x * s + dirWorld.z * c;
    const len = Math.hypot(lx, lz) || 1;
    const v = new THREE.Vector2(BOAT.crane.x + (lx / len) * 7.2, (lz / len) * 7.2);
    this.constrain(v);
    // 往船头那一侧放的才要往前多放（往船尾、正横放的，船滑走了白圈只会离船更远）
    const fwd = clamp((v.x - BOAT.crane.x) / Math.max(1e-3, Math.hypot(v.x - BOAT.crane.x, v.y - BOAT.crane.z)) / 0.6, 0, 1);
    this.lead = { x: v.x, z: v.y, k: fwd };
    this.wish = null;
    this._applyLead();
    this.jumps++;
  }

  // 船照现在的速度松开油门（或按了下网、自动刹车）还要滑多远
  stopDist() {
    return this.bc.stopDist();
  }

  _applyLead() {
    const L = this.lead;
    const sd = this.stopDist();
    const w = this.bc.localToWorld(new THREE.Vector3(L.x + sd * L.k, 0, L.z));
    // 船停稳了（没在开）：这一点就是白圈的位置，以后和平常一样留在原地
    if (sd < 0.01 && this.bc.throttle < 0.02) this.lead = null;
    this.wish = { x: w.x, z: w.z };
    this._followWish();
  }

  // 白圈往 wish 那一点去：够得着就落在那儿（之后就是一个普通的、留在原地的白圈），够不着就停在够得着的最远处
  _followWish() {
    const q = this._toLocal(this.wish.x, this.wish.z);
    const out = this._setAimLocal(q.x, q.z);
    if (!out && !this.lead) this.wish = null;
  }

  // 按了下网（船要自动刹停）或者别的原因要把白圈定下来：不再往前算，想去的那一点留在原地
  freeze() {
    this.lead = null;
  }

  // 工具和效果页：直接把白圈放到船局部一点，吊臂也一下就位
  setLocal(x, z) {
    this.lead = this.wish = null;
    this._setAimLocal(x, z);
    this.snapMech();
    this.jumps++;
  }

  snapMech() {
    const M = this.mech;
    M.a = Math.atan2(this.target.y - BOAT.crane.z, this.target.x - BOAT.crane.x);
    M.r = Math.hypot(this.target.x - BOAT.crane.x, this.target.y - BOAT.crane.z);
    M.y = ARM_TIP_H;
    M.va = M.vr = M.vy = M.ca = M.cr = M.cy = 0;
    this.dirSign = 0;
  }

  // 挪白圈：世界水平位移。顶到够不着的地方就停在最远处（那一圈亮一下）
  nudge(dx, dz) {
    // 玩家动了白圈：从此它就是玩家放的那一点（从眼下看得见的位置接着挪）
    this.lead = this.wish = null;
    const q = this._toLocal(this.aim.x + dx, this.aim.z + dz);
    const out = this._setAimLocal(q.x, q.z);
    if (out) this.pushOut = 0.6;
    return out;
  }

  // 镜头为了把船框回画面、横着挪了一截时，白圈跟着挪同样一截（在画面上不动）：玩家正推着它的时候才用
  shift(dx, dz) {
    this.lead = this.wish = null;
    const q = this._toLocal(this.aim.x + dx, this.aim.z + dz);
    this._setAimLocal(q.x, q.z);
  }

  // 每帧：船动了，白圈还在世界里原来那一点；跟着算出船局部的位置和吊臂要去的地方
  track(dt) {
    if (this.lead) this._applyLead();
    else if (this.wish) this._followWish();
    else {
      const q = this._toLocal(this.aim.x, this.aim.z);
      this._setAimLocal(q.x, q.z);
    }
    this.pushOut = Math.max(0, this.pushOut - dt);
  }

  constrain(v) {
    for (let k = 0; k < 3; k++) {
      // 伸距环
      const dx = v.x - BOAT.crane.x, dz = v.y - BOAT.crane.z;
      const d = Math.hypot(dx, dz) || 0.001;
      const r = clamp(d, ARM_MIN, ARM_MAX);
      v.set(BOAT.crane.x + (dx / d) * r, BOAT.crane.z + (dz / d) * r);
      // 网口不能压在自己船上
      if (inBoatZone(v.x, v.y)) {
        const px = BOAT_ZONE.hx - Math.abs(v.x), pz = BOAT_ZONE.hz - Math.abs(v.y);
        if (pz < px) v.y = Math.sign(v.y || 1) * BOAT_ZONE.hz;
        else v.x = Math.sign(v.x || 1) * BOAT_ZONE.hx;
      }
    }
    return v;
  }

  // 吊臂自己往 want（船局部，含高度）走一帧。转的方向：近路要是会让网架扫过驾驶室，就从船头那边绕；
  // 非得从驾驶室上方过时，先伸到 7.9 米以外、一路伸着转过去，过了再收；还没伸够就在驾驶室跟前慢慢停住等。返回臂端（船局部）
  drive(dt, want, out = new THREE.Vector3(), home = false) {
    const M = this.mech;
    const P = home ? HOME : AIM;
    const wa = Math.atan2(want.z - BOAT.crane.z, want.x - BOAT.crane.x);
    const wr = Math.hypot(want.x - BOAT.crane.x, want.z - BOAT.crane.z);
    let da = wrapAngle(wa - M.a);
    // 这段弧走得通吗：沿着弧取几点（要伸出去的话先伸出去再转）
    const R = Math.max(M.r, wr);
    const blocked = (d) => {
      for (let i = 1; i <= 16; i++) {
        const a = M.a + (d * i) / 16;
        if (inCabin(BOAT.crane.x + Math.cos(a) * R, Math.sin(a) * R)) return true;
      }
      return false;
    };
    if (Math.abs(da) > 0.05) {
      const other = da - Math.sign(da) * Math.PI * 2;
      const shortOk = !blocked(da), longOk = !blocked(other);
      if (!shortOk && longOk) da = other;
      // 白圈差不多在正对面（两边一样远）：接着往上一帧那边转，不来回换方向
      else if (shortOk && longOk && this.dirSign && Math.sign(da) !== this.dirSign && Math.abs(da) > Math.PI * 0.8) da = other;
      this.dirSign = Math.sign(da);
    } else this.dirSign = 0;
    // 沿着剩下这段弧，按伸距 r 走，第一次碰到驾驶室上方是在转过多少的地方（碰不到给 null）
    const cab = (x, z) => inCabin(BOAT.crane.x + Math.cos(x) * z, Math.sin(x) * z);
    const hitAt = (r) => {
      const n = Math.max(1, Math.ceil(Math.abs(da) / 0.04));
      for (let i = 1; i <= n; i++) if (cab(M.a + (da * i) / n, r)) return (da * (i - 1)) / n;
      return null;
    };
    // 照现在的伸距转过去会碰到驾驶室：转到它跟前慢慢停住，等伸出去了再接着转（不是一下子卡住）
    const stopAt = cab(M.a, M.r) ? null : hitAt(M.r);
    const slewTo = stopAt === null ? da : Math.sign(da) * Math.max(0, Math.abs(stopAt) - 0.03);
    let SP = P.slew;
    if (P.tip) {
      SP = _homeSlew;
      SP.v = Math.min(P.slew.v, P.tip.v / Math.max(1, M.r));
      SP.a = Math.min(P.slew.a, P.tip.a / Math.max(1, M.r));
    }
    const st = { p: 0, v: M.va, c: M.ca };
    axis(st, slewTo, SP, dt);
    let na = M.a + st.p;
    // 保险：这一步还是会让网架进到驾驶室上方，就不转（平常走不到这儿：上面已经提前停住了）
    if (cab(na, M.r) && !cab(M.a, M.r)) {
      na = M.a;
      st.v = st.c = 0;
    }
    M.a = wrapAngle(na);
    M.va = st.v;
    M.ca = st.c;
    // 剩下的弧按目标伸距走会从驾驶室上方过：一路伸在 7.9 米以外，转过去了再收回来。
    // 收网回转时（放开了转）边转边收：只伸到剩下这段弧上躲开驾驶室最少要的那么长，绕过驾驶室的角就一路往里收
    const wr2 = hitAt(wr) !== null || hitAt(M.r) !== null ? Math.max(wr, P.tip ? cabinNeed(M.a, da) : 7.9) : wr;
    const sr = { p: M.r, v: M.vr, c: M.cr };
    axis(sr, wr2, P.ext, dt);
    M.r = Math.max(0.5, sr.p);
    M.vr = sr.v;
    M.cr = sr.c;
    const sy = { p: M.y, v: M.vy, c: M.cy };
    axis(sy, want.y, P.lift, dt);
    M.y = sy.p;
    M.vy = sy.v;
    M.cy = sy.c;
    return out.set(BOAT.crane.x + Math.cos(M.a) * M.r, M.y, BOAT.crane.z + Math.sin(M.a) * M.r);
  }

  // 照眼下的速度，吊臂还要多久走到 want（船局部）：给进度圈估剩下的时间
  eta(want, home = false) {
    const M = this.mech;
    const P = home ? HOME : AIM;
    const da = Math.abs(wrapAngle(Math.atan2(want.z - BOAT.crane.z, want.x - BOAT.crane.x) - M.a));
    const dr = Math.abs(Math.hypot(want.x - BOAT.crane.x, want.z - BOAT.crane.z) - M.r);
    const t = (d, Q, v) => (d < 1e-3 ? 0 : d / Q.v + Q.v / Q.a + Q.a / Q.j - Math.abs(v) / Q.v * 0.5);
    let SP = P.slew;
    if (P.tip) {
      // 臂头封顶按一路上的平均伸距估
      const rm = Math.max(1, (M.r + Math.hypot(want.x - BOAT.crane.x, want.z - BOAT.crane.z)) / 2);
      SP = { v: Math.min(SP.v, P.tip.v / rm), a: Math.min(SP.a, P.tip.a / rm), j: SP.j };
    }
    return Math.max(t(da, SP, M.va), t(dr, P.ext, M.vr));
  }

  // 下网流程自己摆吊臂的时候：记下它摆到哪了，速度归零（之后从那儿接着走）
  sync(tipLocal) {
    const M = this.mech;
    M.a = Math.atan2(tipLocal.z - BOAT.crane.z, tipLocal.x - BOAT.crane.x);
    M.r = Math.hypot(tipLocal.x - BOAT.crane.x, tipLocal.z - BOAT.crane.z);
    M.y = tipLocal.y;
    M.va = M.vr = M.vy = M.ca = M.cr = M.cy = 0;
    this.dirSign = 0;
  }

  // 臂端到了白圈正上方、停稳了（差几厘米：落网时直接对正，看不出跳）
  get arrived() {
    const M = this.mech;
    const x = BOAT.crane.x + Math.cos(M.a) * M.r, z = BOAT.crane.z + Math.sin(M.a) * M.r;
    return Math.hypot(x - this.target.x, z - this.target.y) < 0.05 && Math.abs(M.va) * M.r + Math.abs(M.vr) < 0.08 && Math.abs(M.y - ARM_TIP_H) < 0.05;
  }

  // 吊臂转得多快（0…1，绞盘和液压的声音跟着它）
  get motion() {
    const M = this.mech;
    return clamp((Math.abs(M.va) / SLEW.v) * 0.75 + (Math.abs(M.vr) / EXT.v) * 0.5, 0, 1);
  }

  get reach() {
    return Math.hypot(this.local.x - BOAT.crane.x, this.local.y - BOAT.crane.z);
  }

  // 网要落的地方（白圈中心，臂端的高度）
  tipWorld(out = this.world_) {
    return out.set(this.aim.x, ARM_TIP_H, this.aim.z);
  }

  // 白圈中心放到 (x, z) 时网会落在多深（和 evaluate 的 restY 同一个算法，只算这一个数）：挪白圈时按这一层换算画面上的位移
  restYAt(x, z) {
    let floorRef = -1e9;
    for (const p of SAMPLES) {
      if (p.r > 0.95) continue;
      const s = this.world.surfaceAt(x + p.x, z + p.z);
      if ((s.tag === TAG.NONE || s.tag === TAG.FLOOR) && s.y > floorRef) floorRef = s.y;
    }
    return floorRef > -100 ? floorRef : this.world.surfaceAt(x, z).y;
  }

  evaluate() {
    const tip = this.tipWorld();
    const S = [];
    // 正中落在舱底：网口收拢到舱口放得下的大小，照收拢以后的那一圈看挡不挡
    const netR = netRFor(this.world.surfaceAt(tip.x, tip.z).tag === TAG.FLOOR), k = netR / NET_R;
    for (const p of SAMPLES) {
      const x = tip.x + p.x * k, z = tip.z + p.z * k;
      const s = this.world.surfaceAt(x, z);
      S.push({ x, z, y: s.y, tag: s.tag, r: p.r * k });
    }
    const workable = (s) => s.tag === TAG.NONE || s.tag === TAG.FLOOR;
    let floorRef = -1e9;
    for (const s of S) if (s.r <= 0.95 && workable(s)) floorRef = Math.max(floorRef, s.y);
    let reason = null;
    let blockTag = 0;
    const center = S[0];
    // 白圈压在自己船上（从船身上挪过去的半路）：网下不到这儿
    const onBoat = Math.hypot(this.local.x - this.target.x, this.local.y - this.target.y) > 0.05;
    if (onBoat) reason = '网口压着自己的船';
    if (!reason && floorRef < -1e8) {
      blockTag = center.tag;
      reason = TAG_TEXT[center.tag] || '这里网下不去';
    }
    const obstruct = [];
    let topY = floorRef;
    for (const s of S) {
      if (!workable(s) && s.y > floorRef + 0.45) {
        obstruct.push(s);
        if (!reason) { blockTag = s.tag; reason = TAG_TEXT[s.tag] || '有东西挡住网口'; }
      }
      if (workable(s)) topY = Math.max(topY, s.y);
    }
    // 落在坡上：网架搁在高的那一边，网兜顺坡垂下去，低的那一边也兜得到（forecast.js 的 netVerdict 照这个放宽「同一层」）
    let lowY = floorRef;
    for (const s of S) if (workable(s) && s.y > floorRef - 3) lowY = Math.min(lowY, s.y);
    const restY = floorRef;
    const depth = -restY;
    if (!reason && depth > MAX_WORK_DEPTH) reason = `太深了，网只下得到 ${MAX_WORK_DEPTH} 米`;
    const cost = netFuelCost(Math.min(depth, MAX_WORK_DEPTH));
    this.eval = {
      tip: tip.clone(), restY, depth, cost, ok: !reason, reason, blockTag, onBoat,
      obstruct, inHold: center.tag === TAG.FLOOR, topY, r: netR, drop: Math.max(0, floorRef - lowY),
    };
    return this.eval;
  }
}

// 网口足迹（白圈）：贴着落点表面的一圈像素线 + 从水面垂到落点的落线；被挡住的那段变红。
// 不受遮挡：从船身后面、船底下穿过去也一直看得见（不做深度测试，也不让自己的船挡）
class Footprint {
  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'footprint';
    const n = RING_N;
    const ringGeo = new THREE.BufferGeometry();
    ringGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array((n + 1) * 3), 3));
    ringGeo.setAttribute('color', new THREE.BufferAttribute(new Float32Array((n + 1) * 3), 3));
    const mat = new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.95, depthTest: false, depthWrite: false });
    this.ring = new THREE.Line(ringGeo, mat);
    this.ring.renderOrder = 30;
    this.ring.frustumCulled = false;
    // 贴着圈内侧一道暗线：浅滩亮沙上白圈也看得清
    const darkGeo = new THREE.BufferGeometry();
    darkGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array((n + 1) * 3), 3));
    this.dark = new THREE.Line(darkGeo, new THREE.LineBasicMaterial({ color: 0x0b1a1f, transparent: true, opacity: 0.6, depthTest: false, depthWrite: false }));
    this.dark.renderOrder = 29;
    this.dark.frustumCulled = false;
    const dropGeo = new THREE.BufferGeometry();
    dropGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(2 * 40 * 3), 3));
    this.drop = new THREE.LineSegments(dropGeo, new THREE.LineBasicMaterial({ color: 0xe8f4f0, transparent: true, opacity: 0.55, depthTest: false, depthWrite: false }));
    this.drop.renderOrder = 30;
    this.drop.frustumCulled = false;
    const crossGeo = new THREE.BufferGeometry();
    crossGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(4 * 3), 3));
    this.cross = new THREE.LineSegments(crossGeo, new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8, depthTest: false, depthWrite: false }));
    this.cross.renderOrder = 30;
    this.cross.frustumCulled = false;
    // 网架正下方垂到水面的一条线：吊臂还在路上时它跟着网架走，走到了就和落线接成一条（从网架一直到落点）
    const plumbGeo = new THREE.BufferGeometry();
    plumbGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(2 * 12 * 3), 3));
    this.plumb = new THREE.LineSegments(plumbGeo, new THREE.LineBasicMaterial({ color: 0xe8f4f0, transparent: true, opacity: 0.55, depthTest: false, depthWrite: false }));
    this.plumb.renderOrder = 30;
    this.plumb.frustumCulled = false;
    this.group.add(this.dark, this.ring, this.drop, this.cross, this.plumb);
    this.visible = 0;
    this.group.visible = false;
  }

  // locked：已经按了下网，等吊臂走到再下——白圈变成一整圈实线，亮一点，往里收一下
  // net：网架（网环中心，世界）现在在哪；给了就从网架底下垂一条线到水面
  update(dt, ev, world, show, pulse, locked = false, net = null) {
    this.visible = damp(this.visible, show ? 1 : 0, 10, dt);
    if (locked && !this.lockedWas) this.lockT = 0;
    this.lockedWas = locked;
    this.lockT = (this.lockT ?? 9) + dt;
    this.group.visible = this.visible > 0.02 && !!ev;
    if (!ev) return;
    const n = RING_N;
    const pos = this.ring.geometry.attributes.position.array;
    const col = this.ring.geometry.attributes.color.array;
    const dk = this.dark.geometry.attributes.position.array;
    const bad = !ev.ok;
    const ok = locked ? [1.0, 0.95, 0.78] : [0.82, 0.96, 0.92];
    // 按下那一下圈收进来一点再回去（0.25 秒）
    const R = (ev.r || NET_R) * (1 - 0.06 * Math.sin(Math.min(1, this.lockT / 0.25) * Math.PI));
    const red = [1.0, 0.36, 0.28];
    const amber = [1.0, 0.75, 0.3];
    for (let i = 0; i <= n; i++) {
      const a = (i / n) * Math.PI * 2;
      const x = ev.tip.x + Math.cos(a) * R, z = ev.tip.z + Math.sin(a) * R;
      const s = world.surfaceAt(x, z);
      const blocked = ev.obstruct.some((o) => Math.hypot(o.x - x, o.z - z) < 0.45);
      pos[i * 3] = x; pos[i * 3 + 1] = Math.max(s.y, ev.restY - 0.2) + 0.08; pos[i * 3 + 2] = z;
      dk[i * 3] = ev.tip.x + Math.cos(a) * (R - 0.07); dk[i * 3 + 1] = pos[i * 3 + 1]; dk[i * 3 + 2] = ev.tip.z + Math.sin(a) * (R - 0.07);
      // 虚线：隔一段暗一点（按了下网就是一整圈实线）
      const dash = locked || (i % 4 < 3) ? 1 : 0.35;
      const c = blocked ? red : bad ? amber : ok;
      col[i * 3] = c[0] * dash; col[i * 3 + 1] = c[1] * dash; col[i * 3 + 2] = c[2] * dash;
    }
    this.ring.geometry.attributes.position.needsUpdate = true;
    this.ring.geometry.attributes.color.needsUpdate = true;
    this.dark.geometry.attributes.position.needsUpdate = true;
    this.ring.material.opacity = 0.95 * this.visible * (locked ? 1 : 0.85 + 0.15 * pulse);
    this.dark.material.opacity = 0.6 * this.visible;
    // 落线：从水面垂到落点的虚线（吊臂还在路上时，网就顺着这条线下去）
    const dp = this.drop.geometry.attributes.position.array;
    // 底下没有能落网的面时 restY 是个极小的数：落线就垂到白圈正下方的表面
    const ry = ev.restY > -100 ? ev.restY : world.surfaceAt(ev.tip.x, ev.tip.z).y;
    const top = 0.05, bot = Math.min(top, ry + 0.1);
    const segs = 40;
    let k = 0;
    for (let i = 0; i < segs; i++) {
      const y0 = top + (bot - top) * (i / segs);
      const y1 = top + (bot - top) * ((i + 0.5) / segs);
      dp[k++] = ev.tip.x; dp[k++] = y0; dp[k++] = ev.tip.z;
      dp[k++] = ev.tip.x; dp[k++] = y1; dp[k++] = ev.tip.z;
    }
    this.drop.geometry.attributes.position.needsUpdate = true;
    this.drop.material.opacity = 0.45 * this.visible;
    this.drop.material.color.setRGB(...(bad ? amber : [0.9, 0.97, 0.95]));
    const pp = this.plumb.geometry.attributes.position.array;
    const ptop = net ? net.y - 1.0 : 0;
    this.plumb.visible = !!net && ptop > 0.3;
    if (this.plumb.visible) {
      // 和落线一样一段画一段空，段长也一样（接上时看不出是两条）
      const n = Math.min(12, Math.ceil((ptop - top) / ((top - bot) / segs || 1)));
      const step = (ptop - top) / Math.max(1, n);
      let q = 0;
      for (let i = 0; i < 12; i++) {
        const y0 = i < n ? top + step * i : top, y1 = i < n ? top + step * (i + 0.5) : top;
        pp[q++] = net.x; pp[q++] = y0; pp[q++] = net.z;
        pp[q++] = net.x; pp[q++] = y1; pp[q++] = net.z;
      }
      this.plumb.geometry.attributes.position.needsUpdate = true;
      this.plumb.material.opacity = 0.45 * this.visible;
      this.plumb.material.color.copy(this.drop.material.color);
    }
    const cp = this.cross.geometry.attributes.position.array;
    const cy = ry + 0.1;
    const L = 0.35;
    cp.set([ev.tip.x - L, cy, ev.tip.z, ev.tip.x + L, cy, ev.tip.z, ev.tip.x, cy, ev.tip.z - L, ev.tip.x, cy, ev.tip.z + L]);
    this.cross.geometry.attributes.position.needsUpdate = true;
    this.cross.material.opacity = 0.8 * this.visible;
  }
}

// 够得着的范围：网口最远能罩到的那一圈，贴着海底和沉船的面画虚线。
// 调臂时一直在；开船慢下来时淡淡地出现，停在哪儿之前就看得出够不够得着。
const REACH_N = 120;
class ReachRing {
  constructor() {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(REACH_N * 2 * 3), 3));
    // 水面不写深度：隔着水照样看得见；自己的船和沉船挡在前面时被挡住，不画到甲板上
    this.line = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: 0xe8f4f0, transparent: true, opacity: 0, depthWrite: false }));
    this.line.renderOrder = 29;
    this.line.frustumCulled = false;
    this.line.name = 'reach';
    this.line.visible = false;
    // 外侧贴一道暗虚线：亮沙上也看得清
    const dg = new THREE.BufferGeometry();
    dg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(REACH_N * 2 * 3), 3));
    this.dark = new THREE.LineSegments(dg, new THREE.LineBasicMaterial({ color: 0x0b1a1f, transparent: true, opacity: 0, depthWrite: false }));
    this.dark.renderOrder = 28;
    this.dark.frustumCulled = false;
    this.line.add(this.dark);
    this.k = 0;
    this.flash = 0;
    this.last = null;
  }

  // center: 吊机在世界里的位置；show: 0..1 要多显眼；push: 臂端正顶在最远处
  update(dt, center, world, show, push) {
    this.k = damp(this.k, show, 8, dt);
    // 顶到最远的那一下亮起来，之后推着只留一半亮，松手就退
    if (push && !this.pushWas) this.flash = 1.25;
    this.pushWas = push;
    this.flash = damp(this.flash, push ? 0.45 : 0, push ? 2.5 : 4, dt);
    this.line.visible = this.k > 0.02;
    if (!this.line.visible) { this.last = null; return; }
    const R = ARM_MAX + NET_R;
    if (!this.last || Math.hypot(center.x - this.last.x, center.z - this.last.z) > 0.04) {
      this.last = { x: center.x, z: center.z };
      const pos = this.line.geometry.attributes.position.array;
      const dk = this.dark.geometry.attributes.position.array;
      const pt = (i) => {
        const a = (i / REACH_N) * Math.PI * 2;
        const c = Math.cos(a), sn = Math.sin(a);
        const x = center.x + c * R, z = center.z + sn * R;
        return [x, Math.max(world.surfaceAt(x, z).y, -MAX_WORK_DEPTH - 0.5) + 0.15, z, c, sn];
      };
      // 一段画一段空：每一段从第 i 点到 i+0.6 点
      let k = 0;
      for (let i = 0; i < REACH_N; i++) {
        const p0 = pt(i), p1 = pt(i + 0.6);
        for (const p of [p0, p1]) {
          pos[k] = p[0]; pos[k + 1] = p[1]; pos[k + 2] = p[2];
          dk[k] = p[0] + p[3] * 0.09; dk[k + 1] = p[1]; dk[k + 2] = p[2] + p[4] * 0.09;
          k += 3;
        }
      }
      this.line.geometry.attributes.position.needsUpdate = true;
      this.dark.geometry.attributes.position.needsUpdate = true;
    }
    const f = Math.min(1, this.flash);
    this.line.material.opacity = this.k * (0.55 + 0.45 * f);
    this.dark.material.opacity = this.k * 0.45;
    this.line.material.color.setRGB(0.91 + 0.09 * f, 0.96 - 0.1 * f, 0.94 - 0.5 * f);
  }
}

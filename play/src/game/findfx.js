// 第八批（寻找）里船上这一侧的表现：都只是看和听，不改任何规则。
//   B2 停船、进入作业：车钟两下；刹住时船头往前一栽再晃回来（按减速度）；船尾翻白水、船头压出一点浪
//   B3 移动落点：触底深度每变半米“嗒”一下；一件东西整件进了网口“叮”一下（世界标记层给它套个角框）；
//      网兜垂不到的红点一出来闷一声；吊臂转到位“咔”一下，网口圈一亮（aimviz.js 读这里的时刻）
//   B4 按下网：船长立刻一指、往下压两下；吊臂一沉再弹回来，船往吊臂那一舷歪一下；放缆声一直响到网入水
// 现场、线索、远处、蟹翻出东西（B1、C1、C2）画在世界标记层（overlay.js 的 pings），翻泥的过程在 src/eco/unearth.js。
import * as THREE from 'three';
import { NET_R, BAG_DROP, BOTTOM_OFF, PLUNGE_Y, lowerStep } from './net.js';
import { itemSeen } from '../ui/overlay.js';
import { clamp } from '../core/noise.js';
import { fxTag } from '../fx/tags.js';

const _v = new THREE.Vector3();

export class FindFx {
  constructor(g) {
    this.g = g;
    this.pitch = { x: 0, v: 0 }; // 船头前栽（弧度）：刹车的减速度推它，弹簧拉回来
    this.lastSp = 0;
    this.stop = null;            // B2：{ t, sp }
    this.kick = null;            // B4：{ t, side }
    this.churn = 0;
    // B3：上一帧的落点、停手多久了、深度刻度、上一声的时刻、红点、吊臂转了多久、到位的时刻
    this.aim = { x: null, z: null, still: 9, q: null, tickT: -9, catchT: -9, low: false, lowT: -9, craneT: 0, lockT: -9 };
    this.inNet = new Map();      // 整件在网口里、网兜得到的物件：id → 进来的时刻
  }
  play(name, o) { this.g.audio && this.g.audio.play(name, o); }

  // —— B1：看清一处现场或线索——水面上那一点冒一串气泡、推开一圈白沫（水自己应了一声；标记层的涟漪跟着扩开） ——
  site(s) {
    const P = this.g.particles, n = s.clue ? 22 : 40, v0 = s.clue ? 1.6 : 2.4;
    for (let i = 0; i < n; i++) {
      const a = i / n * 6.283 + Math.random() * 0.1, v = v0 * (0.85 + Math.random() * 0.3);
      P.water.emit(s.x + Math.cos(a) * 0.5, 0.07, s.z + Math.sin(a) * 0.5, Math.cos(a) * v, 0, Math.sin(a) * v, 1.5 + Math.random() * 0.6, 0.24 + Math.random() * 0.14, 0.9, 0.97, 1.0, 0.65, 1.3, 0.85, 0, 0);
    }
    P.bubbles(s.x, -0.4, s.z, 16);
    for (let i = 0; i < 5; i++) P.splat(s.x + (Math.random() - 0.5) * 1.6, 0.05, s.z + (Math.random() - 0.5) * 1.6, 3);
  }

  // —— B2：按键停船、进入作业（setMode('work') 调） ——
  workStart() {
    const g = this.g, sp = Math.abs(g.boat.speed);
    this.stop = { t: g.time, sp };
    this.aim.x = null;
    this.play('work', { speed: sp });
    fxTag('B2', sp > 0.6 ? '停船·进入作业' : '进入作业');
  }

  // —— B4：按下网（tryDrop 成功后调） ——
  drop(op) {
    const g = this.g, b = g.boat;
    // 网从现在的高度落到入水还要几秒（和真的下放同一步规则）：放缆声正好停在入水那一下
    // （入水按 B5 的那一刻算：网圈砸进水、“啪—咕咚”响的那一帧，不是网兜底先碰到水）
    const s = { y: op.y, v: 0 }, restY = op.T + BOTTOM_OFF;
    let fall = 0;
    for (let n = 0; n < 900 && s.y > PLUNGE_Y; n++) { if (lowerStep(s, restY, 1 / 60)) break; fall += 1 / 60; }
    this.play('drop', { fall });
    // 船长立刻指向臂端、往下压两下：“放！”（不等手上那个手势做完；下一回例行的指要隔一阵）
    const tip = b.tipWorld(_v), tl = b.worldToLocal2(tip.x, tip.z), cap = g.crew && g.crew.captain;
    if (cap) { cap.gesture('point', { x: tl[0], z: tl[1], quick: true }); cap.nextGest = g.crew.t + 7; }
    // 吊臂一沉、船往吊臂那一舷歪一下：棘爪一松，网的分量一下落到缆上
    this.kick = { t: g.time, side: Math.sign(tl[0]) || 1 };
    fxTag('B4', '按下网·放！');
  }

  // 每帧（缆绳、网的位置算之前）：吊臂下沉量、船头前栽、船尾白水、落点的几声
  update(dt) {
    const g = this.g, b = g.boat;
    // B4：0.08 秒后吊臂往下点约 2°（0.06 秒到底），弹一下回来（缆绳和网跟着臂端走）
    let lf = 0;
    if (this.kick) {
      const u = g.time - this.kick.t - 0.08;
      if (u > 1.6) this.kick = null;
      else if (u > 0) lf = 0.07 * (1 - Math.exp(-u / 0.05)) * Math.exp(-u * 3.2) * Math.cos(u * 9);
    }
    b.luffFx = lf;
    // B2：作业时刹车，减速度把船头往前推，停下来以后弹两下回正
    const sp = b.speed, dec = dt > 0 ? (Math.abs(this.lastSp) - Math.abs(sp)) / dt : 0;
    this.lastSp = sp;
    const push = g.mode === 'work' ? Math.min(0.05, clamp(dec, 0, 24) * 0.0034) : 0;
    const P = this.pitch;
    P.v += (-(P.x - push) * 70 - P.v * 5.5) * dt; P.x += P.v * dt;
    if (this.stop) {
      const u = g.time - this.stop.t, k = Math.min(1, this.stop.sp / 7) * Math.max(0, 1 - u / 1.3);
      if (u > 1.3) this.stop = null;
      else if (k > 0.05 && dt > 0) {
        // 倒车刹住：船尾翻起白水（开得越快翻得越多）
        const hx = Math.sin(b.heading), hz = Math.cos(b.heading);
        this.churn += dt * 90 * k;
        while (this.churn > 1) {
          this.churn -= 1;
          const a = Math.random() * 6.283, r = Math.random() * 1.5, v = 0.5 + Math.random() * 1.5;
          g.particles.water.emit(b.x - hx * 7.1 + Math.cos(a) * r, 0.08, b.z - hz * 7.1 + Math.sin(a) * r, Math.cos(a) * v - hx * 1.6, 0.4 + Math.random() * 0.9, Math.sin(a) * v - hz * 1.6,
            1.3 + Math.random() * 1.1, 0.26 + Math.random() * 0.3, 0.93, 0.97, 0.98, 0.75, 1.8, 1.2, 3.0);
        }
        // 船头一栽，压出一圈浪
        if (!this.stop.bow && u > 0.14) { this.stop.bow = true; for (let i = 0; i < 9; i++) g.particles.bowSpray(b.x + hx * 7.3, b.z + hz * 7.3, hx, hz, this.stop.sp * 0.8); }
      }
    }
    this.updateAim(dt);
  }
  // 船体姿态在 boat.updateVisual 之后叠上去（只是表现）
  visual() {
    const g = this.g, bob = g.boat.bob;
    bob.rotation.x += this.pitch.x;
    if (this.kick) {
      const u = g.time - this.kick.t - 0.08;
      if (u > 0) bob.rotation.z -= this.kick.side * 0.014 * (1 - Math.exp(-u / 0.06)) * Math.exp(-u * 2.2) * Math.cos(u * 5.5);
    }
  }

  // —— B3：移动落点 ——
  updateAim(dt) {
    const g = this.g, A = this.aim, est = g.est;
    if (!(g.mode === 'work' && !g.op && est && !g.reveal.busy && !g.ended)) { A.x = null; A.low = false; A.craneT = 0; this.inNet.clear(); return; }
    const first = A.x == null;
    const moved = !first && Math.hypot(g.aim.x - A.x, g.aim.z - A.z) > 1e-3;
    A.x = g.aim.x; A.z = g.aim.z;
    A.still = moved ? 0 : A.still + dt;
    // 测深：触底深度每变半米“嗒”一下（越深越低）
    const q = Math.round(est.depth * 2);
    if (moved && q !== A.q && g.time - A.tickT > 0.07) { A.tickT = g.time; this.play('aimTick', { depth: est.depth }); fxTag('B3', '移动落点', 'B3'); }
    if (first || moved) A.q = q;
    // 整件进了网口、网兜得到它那一层的松散物
    const reg = g.world.regionAt(A.x, A.z, 200), now = [];
    if (reg) for (const it of reg.itemsNear(A.x, A.z, NET_R)) {
      if (!itemSeen(it, g.boat.x, g.boat.z) || Math.hypot(it.x - A.x, it.z - A.z) > NET_R - (it.r || 0.3) * 0.85 || est.T - it.baseY > BAG_DROP + 0.05) continue;
      now.push(it.id);
    }
    let added = 0;
    for (const id of now) if (!this.inNet.has(id)) { this.inNet.set(id, g.time); added++; }
    for (const id of [...this.inNet.keys()]) if (!now.includes(id)) this.inNet.delete(id);
    if (added && !first && g.time - A.catchT > 0.12) { A.catchT = g.time; this.play('aimCatch', { n: now.length }); fxTag('B3', '移动落点·整件进网口', 'B3'); }
    // 网兜垂不到的红点盖住一块像样的地方：闷一声
    const low = est.lowFrac > 0.04;
    if (low && !A.low && !first && g.time - A.lowT > 0.6) { A.lowT = g.time; this.play('aimLow'); fxTag('B3', '移动落点·红点处网兜不到', 'B3'); }
    A.low = low;
    // 吊臂转到位：玩家停了手、吊臂也停稳的那一下“咔”，网口圈一亮（推着摇杆时吊臂一顿一顿地跟，不算）
    if (!g.boat.craneSettled()) A.craneT += dt;
    else if (A.still > 0.12) {
      if (A.craneT > 0.25 && !first) { A.lockT = g.time; this.play('aimLock'); fxTag('B3', '移动落点·吊臂到位', 'B3'); }
      A.craneT = 0;
    }
  }
}

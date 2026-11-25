import * as THREE from 'three';
import { VIEW_W, VIEW_H } from '../config.js';
import { N } from './tables.js';
import { pilot, pilotStop } from './pilot.js';
import { stepMotion } from './boatCtl.js';
import { BOAT_ZONE } from './arm.js';
import { BOAT } from '../world/boat.js';
import { WRECK } from '../world/layout.js';

// 这一刻（第一段小样）的自动演示：和玩家一样只动鼠标和键盘——把指针挪到一处、左键下网，网还在水里就点好下一处，
// W、S、A、D 把船开近（停着也转得了船头），按住左 Shift 拉近看清海底，按住右键转着看找看不见的那一处，E 开冲，压轴时按住左键冲得快，指着铜牌左键再来一次。
// 只用屏幕上看得见的打捞点（和鼠标指的是同一份），不看海底藏着什么。
// 每放一遍换一个走法（先近后远、先去舱里），演示里看得出不同的选法有不同的结果。
const _v = new THREE.Vector3();

export class MomentBot {
  constructor(g) {
    this.g = g;
    this.v = { lx: 0, ly: 0, rx: 0, ry: 0, zoom: 0, a: false, aHeld: false, b: false, bHeld: false, go: false, ptr: { x: 1180, y: 820 }, click: false, drag: false, peek: false, px: 0, py: 0 };
    g.input.virtual = this.v;
    this.run = 0;
    this.stage = 'start';
    this.seen = new Set();
    this.restart(true);
  }

  restart(first = false) {
    if (!first) this.run++;
    this.t = 0;
    this.stopped = false;
    this.failed = new Set();
    this.netted = 0;
    this.explored = 0;
    this.co = this.main();
    this.clear();
  }

  stop() {
    this.stopped = true;
    this.g.input.virtual = null;
  }

  clear() {
    const v = this.v;
    v.lx = v.ly = v.rx = v.ry = 0;
    v.aHeld = v.drag = v.peek = false;
  }

  update(dt) {
    if (this.stopped) return;
    const g = this.g;
    this.dt = dt;
    if (g.mode === 'pause' || g.mode === 'fading') return;
    this.t += dt;
    const r = this.co.next();
    if (r.done) this.co = this.idle();
  }

  *wait(t) {
    let k = 0;
    while (k < t) { k += this.dt; yield; }
  }

  *idle() {
    for (;;) yield;
  }

  // 打捞点值不值得：一网罩得住几件、东西多大；舱里的（看得见舱口里有东西反光）多算一点
  score(s) {
    const g = this.g;
    let v = 0;
    for (const id of s.ids) {
      if (id === 'dig') { v += 0.8; continue; }
      const it = g.items.items.find((i) => i.id === id);
      if (it) v += 0.6 + it.r * 1.4;
    }
    if (s.hold) v += 1.2;
    return v;
  }

  // 下一网去哪：这一遍的走法决定先后
  choose() {
    const g = this.g;
    const spots = g.snap.spots.filter((s) => !this.failed.has(s.key) && !g.snap.taken(s));
    if (!spots.length) return null;
    const style = this.run % 2;
    const bp = g.boatCtl.pos;
    const rank = (s) => {
      const d = Math.hypot(s.x - bp.x, s.z - bp.z);
      let sc = this.score(s) - d * 0.06 - (s.far ? 1.4 : 0);
      // 第一遍：近处的先捞，最后一网才开进去捞舱里；第二遍：先开进去捞舱里
      if (style === 0 && s.hold) sc += this.netted >= g.deck.slots.length - 1 ? 3 : -2.5;
      if (style === 1 && s.hold) sc += this.netted === 0 ? 3 : 0;
      return sc;
    };
    return spots.slice().sort((a, b) => rank(b) - rank(a))[0];
  }

  // 这一处现在是哪一条（捞走几件、重新分过组）
  now(s) {
    return this.g.snap.same(s);
  }

  // 这一处在画面上哪一点
  at(s) {
    const p = this.g.project(_v.set(s.x, s.y, s.z));
    return { x: p.x, y: p.y, off: p.z > 1 || p.x < 90 || p.x > VIEW_W - 90 || p.y < 150 || p.y > VIEW_H - 90 };
  }

  // 指针挪到一点（to 每帧给一次：画面在动时跟着它）：起步停下都缓
  *moveTo(to) {
    const P = this.v.ptr, x0 = P.x, y0 = P.y;
    let q = to();
    const T = Math.max(0.28, Math.min(0.75, Math.hypot(q.x - x0, q.y - y0) / 1300));
    let t = 0;
    while (t < T) {
      t += this.dt;
      q = to();
      const u = Math.min(1, t / T), k = u * u * (3 - 2 * u);
      P.x = x0 + (q.x - x0) * k;
      P.y = y0 + (q.y - y0) * k;
      yield;
    }
  }

  // 那一处不在画面里：按住右键拖着转过去
  *bringIn(s) {
    const g = this.g;
    let k = 0;
    while (k++ < 4) {
      const o = this.now(s);
      if (!o || !this.at(o).off) return;
      yield* this.moveTo(() => ({ x: VIEW_W / 2 + 120, y: VIEW_H / 2 + 60 }));
      // 往它那一边转：它在镜头看过去的左边还是右边
      const c = g.cam, want = Math.atan2(c.pivot.x - o.x, c.pivot.z - o.z);
      let d = want - c.yaw;
      d = Math.atan2(Math.sin(d), Math.cos(d));
      if (Math.abs(d) < 0.15) return;
      const sg = Math.sign(d), need = Math.min(1.2, Math.abs(d));
      this.v.drag = true;
      const y0 = c.yawT;
      let t = 0;
      while (Math.abs(c.yawT - y0) < need && t < 2) {
        t += this.dt;
        this.v.px = -sg * 420 * this.dt;
        this.v.ptr.x = Math.max(120, Math.min(VIEW_W - 120, this.v.ptr.x - sg * 420 * this.dt));
        yield;
      }
      this.v.drag = false;
      yield* this.wait(0.5);
    }
  }

  // 指着这一处：挪过去，直到游戏也认是指着它
  *pointAt(s) {
    const g = this.g;
    yield* this.bringIn(s);
    let o = this.now(s);
    if (!o) return null;
    yield* this.moveTo(() => { o = this.now(o) || o; return this.at(o); });
    let t = 0;
    while (t < 0.5) {
      o = this.now(o) || o;
      const q = this.at(o);
      this.v.ptr.x += (q.x - this.v.ptr.x) * 0.3;
      this.v.ptr.y += (q.y - this.v.ptr.y) * 0.3;
      if (g.snap.hov && g.snap.hov.key === o.key && t > 0.12) return o;
      t += this.dt;
      yield;
    }
    return g.snap.hov && g.snap.hov.key === o.key ? o : null;
  }

  // 点一下左键
  *click() {
    this.v.click = true;
    yield* this.wait(0.25);
  }

  // 按住左 Shift 看一眼指着的海底，松开回来
  *closeLook(t) {
    this.v.peek = true;
    yield* this.wait(t);
    this.v.peek = false;
    yield* this.wait(0.5);
  }

  // 踩住 S 停稳
  *halt() {
    let w = 0;
    while (Math.abs(this.g.boatCtl.speed) > 0.25 && w < 5) {
      const q = pilotStop(this.g.boatCtl);
      this.v.lx = q.mx; this.v.ly = q.my;
      w += this.dt;
      yield;
    }
    this.v.lx = this.v.ly = 0;
  }

  // 船开近：照船自己的开法在脑子里预演几种按法（先给油还是倒、往哪边打多久，再怎么打，最后踩住 S 停稳），
  // 挑停下来那一处在吊臂够得着、又不压在船身底下的那一种，照着按；停下来还够不着就再来一次
  *sailNear(s) {
    const bc = this.g.boatCtl;
    const ok = () => { const o = this.now(s); return !!o && !o.far; };
    for (let tries = 0; tries < 4 && !ok(); tries++) {
      const P = this.plan(this.now(s) || s);
      if (!P) break;
      for (const [my, mx, T] of P.segs) {
        let t = 0;
        while (t < T) { this.v.lx = mx; this.v.ly = my; t += this.dt; yield; }
      }
      this.v.lx = this.v.ly = 0;
      yield* this.halt();
      let w = 0;
      while (Math.abs(bc.speed) > 0.05 && w < 3) { w += this.dt; yield; }
      yield* this.wait(0.35);
    }
    yield* this.wait(0.2);
  }

  // 绕着沉船（看得见）开，一路看见能捞的就停下
  *explore() {
    const g = this.g, bc = g.boatCtl;
    const at = Math.atan2(bc.pos.z - WRECK.z, bc.pos.x - WRECK.x);
    let T = 0, k = 1;
    const R = Math.max(12, Math.min(17, Math.hypot(bc.pos.x - WRECK.x, bc.pos.z - WRECK.z)));
    // 往船头朝的那一边绕
    const f = bc.forward, sg = -Math.sin(at) * f.x + Math.cos(at) * f.z > 0 ? 1 : -1;
    while (T < 14 && !this.choose()) {
      const a = at + sg * 0.55 * k;
      const gx = WRECK.x + Math.cos(a) * R, gz = WRECK.z + Math.sin(a) * R;
      const wx = gx - bc.pos.x, wz = gz - bc.pos.z;
      if (Math.hypot(wx, wz) < 5) { k++; continue; }
      const q = pilot(bc, wx, wz, 0.6);
      this.v.lx = q.mx; this.v.ly = q.my;
      T += this.dt;
      yield;
      if (T > 1) g.snap.refresh(false);
    }
    this.v.lx = this.v.ly = 0;
    yield* this.halt();
    yield* this.wait(0.6);
    g.snap.refresh(true);
  }

  // 预演：返回要按的几段 [W/S, A/D, 按多久]
  plan(o) {
    const bc = this.g.boatCtl;
    const dt = 1 / 30;
    const run = (segs) => {
      const c = { x: bc.pos.x, z: bc.pos.z, heading: bc.heading, speed: bc.speed, thr: bc.thr, brk: bc.brk, steer: bc.steer, turnRate: bc.turnRate };
      let T = 0;
      const step = (my, mx) => {
        stepMotion(c, my > 0 ? 1 : 0, my < 0 ? 1 : 0, mx, false, dt);
        c.x += Math.cos(c.heading) * c.speed * dt;
        c.z -= Math.sin(c.heading) * c.speed * dt;
        T += dt;
      };
      for (const [my, mx, t] of segs) for (let k = t; k > 1e-6; k -= dt) step(my, mx);
      for (let k = 0; k < 150 && Math.abs(c.speed) > 0.25; k++) step(c.speed > 0.25 ? -1 : c.speed < -0.25 ? 1 : 0, 0);
      for (let k = 0; k < 40 && c.speed !== 0; k++) step(0, 0);
      // 停下来那一处离吊机、压没压在船身上（船自己的坐标）
      const cs = Math.cos(c.heading), sn = Math.sin(c.heading), dx = o.x - c.x, dz = o.z - c.z;
      const lx = dx * cs - dz * sn, lz = dx * sn + dz * cs;
      const d = Math.hypot(lx - BOAT.crane.x, lz - BOAT.crane.z);
      const good = d < 10 && d > 5.2 && !(Math.abs(lx) < BOAT_ZONE.hx + 0.3 && Math.abs(lz) < BOAT_ZONE.hz + 0.3);
      return { c, good, cost: (good ? 0 : 20 + Math.abs(d - 8.5) * 2 + (Math.abs(lz) < 4.5 ? 4 : 0)) + T * 0.6 + Math.abs(d - 8) * 0.35 };
    };
    let best = null;
    // 先停着转船头，再走一段
    for (const m0 of [-1, 1]) for (const T0 of [0.5, 1, 1.6]) for (const my of [1, -1]) for (const T1 of [0.7, 1.3, 2, 3]) {
      const segs = [[0, m0, T0], [my, 0, T1]], R = run(segs);
      if (!best || R.cost < best.cost) best = { segs, cost: R.cost, good: R.good };
    }
    for (const my of [1, -1]) for (const m1 of [0, -1, 1]) for (const T1 of [0.7, 1.3, 2, 3]) {
      for (const m2 of [0, -1, 1]) for (const T2 of m2 === m1 ? [0] : [0, 0.7, 1.5, 2.4]) {
        const segs = T2 ? [[my, m1, T1], [my, m2, T2]] : [[my, m1, T1]];
        const R = run(segs);
        if (!best || R.cost < best.cost) best = { segs, cost: R.cost, good: R.good };
      }
    }
    return best;
  }

  get busy() {
    const g = this.g;
    return g.netop.busy || !!g.castQ || g.mode === 'net';
  }

  *main() {
    const g = this.g;
    yield* this.wait(1.6);
    let queued = null;
    while ((g.mode === 'arm' || g.mode === 'net') && g.trip.fuel >= 4) {
      let w = 0;
      if (queued) {
        // 点好的下一处：网一收回它自己接着下
        while (!this.busy && w < 3) { w += this.dt; yield; }
        queued = null;
        if (!this.busy) continue;
        this.netted++;
      } else {
        // 等上一网落定
        while ((this.busy || g.deck.busy) && w < 30) { w += this.dt; yield; }
        if (g.mode !== 'arm' || g.deck.full) break;
        g.snap.refresh(true);
        let s = this.choose();
        // 看得见的都捞过了、甲板还没满：绕着沉船开一段找
        if (!s && g.trip.fuel > 14 && (this.explored = (this.explored || 0) + 1) <= 3) {
          this.stage = 'explore';
          yield* this.explore();
          s = this.choose();
        }
        if (!s) break;
        this.stage = 'pick';
        let o = yield* this.pointAt(s);
        if (!o) { this.failed.add(s.key); continue; }
        if (o.far) {
          this.stage = 'sail';
          yield* this.sailNear(o);
          o = yield* this.pointAt(o);
          if (!o || o.far) { this.failed.add(s.key); continue; }
        }
        yield* this.wait(0.25);
        // 头一网、舱里那一处：下网以前先看清那儿有什么
        if (!this.netted || o.hold) {
          this.stage = 'look';
          yield* this.closeLook(2.2);
        }
        this.stage = 'cast';
        yield* this.click();
        yield* this.wait(0.25);
        // 下不去（油不够、被挡）：换一处
        if (!this.busy) { this.failed.add(s.key); continue; }
        this.netted++;
      }
      // 网下去了：指针挪到下一处，先点好（够得着、甲板还有空位才点；要开过去的等网收回来再开）
      w = 0;
      while (g.castQ && w < 12) { w += this.dt; yield; }
      yield* this.wait(1.6);
      if (g.mode === 'net' && g.deck.used < g.deck.slots.length) {
        const n = this.choose();
        if (n && !n.far && !this.at(n).off) {
          const o = yield* this.pointAt(n);
          if (o && !o.far && g.mode === 'net') {
            yield* this.wait(0.2);
            // 网在水里也看得：点下一处以前看一眼
            if (this.netted === 1) yield* this.closeLook(2);
            if (g.mode !== 'net') continue;
            yield* this.click();
            queued = g.snap.next;
          }
        }
      }
      w = 0;
      while (this.busy && w < 30) { w += this.dt; yield; }
      if (g.deck.full) break;
      if (!queued) yield* this.wait(0.4);
    }
    // 码满了（或没油了）：按开冲
    let w = 0;
    while (g.deck.busy && w < 5) { w += this.dt; yield; }
    if (g.mode === 'arm' && g.deck.filled) {
      this.stage = 'go';
      this.v.go = true;
    }
    // 开冲：第二包起按住左键冲得快一点；压轴那一包也按住
    w = 0;
    while (g.mode !== 'batch' && w < 3) { w += this.dt; yield; }
    while (g.mode === 'batch') {
      const B = g.batch;
      // 齐冲那一段让它自己越崩越快（不按），压轴那一包冲到一小半按住
      const hold = (B.phase === 'finale' && g.reveal.cur && g.reveal.cur.phase === 'wash' && g.reveal.cur.w > 0.25);
      this.v.aHeld = hold;
      yield;
    }
    this.v.aHeld = false;
    this.stage = 'result';
    // 结算出来以后停一会儿，按左键再来一次
    w = 0;
    while (g.mode !== 'result' && w < 20) { w += this.dt; yield; }
    yield* this.wait(Math.max(0.5, N('演示结算停多久', 6) - 1));  // 表的 id，不是玩家看的
    if (g.mode !== 'result') return;
    // 指到「再来一次」那块铜牌上，左键
    yield* this.moveTo(() => {
      const st = document.getElementById('stage').getBoundingClientRect(), r = document.querySelector('#result .again').getBoundingClientRect(), k = st.width / VIEW_W;
      return { x: (r.left + r.width * 0.62 - st.left) / k, y: (r.top + r.height / 2 - st.top) / k };
    });
    yield* this.wait(0.3);
    this.v.click = true;
  }
}

export { VIEW_W, VIEW_H };

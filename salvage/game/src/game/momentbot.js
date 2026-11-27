import * as THREE from 'three';
import { VIEW_W, VIEW_H } from '../config.js';
import { N } from './tables.js';
import { pilot, pilotStop } from './pilot.js';
import { stepMotion } from './boatCtl.js';
import { BOAT_ZONE } from './arm.js';
import { BOAT } from '../world/boat.js';
import { WRECK, TUBE_SPOT, SEAL_SPOT, wreckToWorld } from '../world/layout.js';
import { MIN_NET_COST } from './trip.js';

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
    // 第二潮（和补满第一潮的那几网）：不再演蟹、不再开进舱里，挑近处的（切片第 19 步）
    const spots = g.snap.spots.filter((s) => !this.failed.has(s.key) && !g.snap.taken(s) && !(this.near && (s.hold || s.dig)));
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

  // 一块界面在画面上的中点（1920×1080）
  elAt(el, fx = 0.5) {
    const st = document.getElementById('stage').getBoundingClientRect(), r = el.getBoundingClientRect(), k = st.width / VIEW_W;
    return { x: (r.left + r.width * fx - st.left) / k, y: (r.top + r.height / 2 - st.top) / k };
  }

  // 指到一块界面上，左键点一下
  *clickEl(get, fx = 0.5) {
    const el = get();
    if (!el) return;
    yield* this.moveTo(() => this.elAt(get() || el, fx));
    yield* this.wait(0.3);
    this.v.click = true;
    yield* this.wait(0.35);
  }

  // 切片路线（切片.md「第一段·归潮沙湾」第 1～24 步）：开始页点「自动演示」→ 从港外开出、浅滩一网、顺着船板找到沉船 →
  // 沉船旁照路线捞满一甲板（陶罐那一组、铜锅、等蟹翻出铜印、开进舱口，网在舱里时大轮廓经过）→ 一起冲、压轴 → 回港开舱、债本 →
  // 船坞升网和油箱 → 第二潮捞满一甲板 → 按住 Q 回港 → 还清第一页 → 升油箱 → 出海，停在船离开码头那一截（harbor.sail）。
  // 从哪一小段打开就从那一刻接着往下演（game.openSeg）。
  *main() {
    const g = this.g;
    if (g.mode === 'title') yield* this.titleRound();
    if (g.moment.on && g.moment.out && !g.flags.wreck && (g.mode === 'arm' || g.mode === 'net')) yield* this.findWreck();
    else if (g.mode === 'arm') yield* this.wait(1.6);
    if (g.mode === 'dock') { yield* this.dockRound(); return; }
    if (g.trip.ended || g.mode === 'summary' || g.mode === 'debt') { yield* this.harborRound(); return; }
    this.netted = 0;
    this.explored = 0;
    if (!g.items.tide) yield* this.routeDeck();
    else yield* this.deckRound();
    yield* this.homeFromResult();
    yield* this.harborRound();
  }

  // 一甲板冲完、结算牌出来：油不够再下一网的只剩「回港开舱」，点它；还够的不接着捞，按住 Q 回港（切片第 11、20 步）
  *homeFromResult() {
    const g = this.g;
    let w = 0;
    while (g.mode !== 'result' && g.mode === 'arm' && g.deck.filled && w < 6) { w += this.dt; yield; }
    if (g.mode === 'result') {
      if (!g.moment.more) { yield* this.clickEl(() => document.querySelector('#result .again'), 0.62); return; }
      this.stage = 'quit';
      yield* this.wait(0.6);
    }
    this.stage = 'quit';
    this.v.b = true;
    this.v.bHeld = true;
    yield* this.wait(N('回港按住多久', 0.9) + 0.3);  // 表的 id，不是玩家看的
    this.v.bHeld = false;
  }

  // 开始页：标题砸下来、三项亮起，指针过去点「自动演示」（切片第 1 步）
  *titleRound() {
    const g = this.g;
    this.stage = 'title';
    let w = 0;
    while (g.mode === 'title' && !(g.titleIntro && g.titleIntro.lit) && w < 12) { w += this.dt; yield; }
    yield* this.wait(0.7);
    const opt = () => g.menus.titleOpts && g.menus.titleOpts.find((o) => o.k === 'demo');
    if (g.mode === 'title' && opt()) yield* this.clickEl(() => opt() && opt().el);
    w = 0;
    while (g.mode === 'title' && w < 3) { w += this.dt; yield; }
  }

  // 开船往世界里一点：照船自己的开法按 W、A、D（到了不停，接着下一段）
  *driveTo(x, z, arrive, o = {}) {
    const g = this.g, bc = g.boatCtl;
    let t = 0;
    while (t < (o.max || 40)) {
      if (o.until && o.until()) break;
      const dx = x - bc.pos.x, dz = z - bc.pos.z, D = Math.hypot(dx, dz);
      if (D < arrive + Math.max(0, bc.speed) * (o.stop ? 0.9 : 0)) break;
      const q = pilot(bc, dx, dz, o.mag ?? Math.min(1, D / 14));
      this.v.lx = q.mx; this.v.ly = q.my;
      t += this.dt;
      yield;
    }
    this.v.lx = this.v.ly = 0;
  }

  // 第 2～5 步：出港（按住 W）→ 浅滩停船、指过锚、挑铜筒那一组左键 → 顺着船板箭头开 → 第一眼看见沉船、按住左 Shift 指着它 → 开到沉船甲板那一侧
  *findWreck() {
    const g = this.g, bc = g.boatCtl;
    this.stage = 'out';
    let w = 0;
    while (g.igniteT > 0 && w < 3) { w += this.dt; yield; }
    yield* this.wait(0.3);
    // 出港：照着线索箭头（起步指向浅滩的标杆）开，近了往铜筒那一组那边靠
    const has = (id) => g.snap.spots.find((s) => s.ids.includes(id) && !g.snap.taken(s));
    yield* this.driveTo(TUBE_SPOT.x - 7.5, TUBE_SPOT.z - 5.5, 3, { max: 30, until: () => { const s = has('tube'); return !!s && !s.far; }, stop: true });
    yield* this.halt();
    yield* this.wait(0.4);
    g.snap.refresh(true);
    // 第 3 步：指针先划过锚（只写得出 1 件），再停到铜筒那一组（3 件），左键
    const anchor = has('anchor');
    if (anchor) { this.stage = 'shoal'; yield* this.pointAt(anchor); yield* this.wait(0.8); }
    let tube = has('tube');
    if (tube) {
      let o = yield* this.pointAt(tube);
      if (o && o.far) { yield* this.sailNear(o); o = yield* this.pointAt(o); }
      if (o && !o.far) {
        yield* this.wait(0.5);
        this.stage = 'cast';
        yield* this.click();
        w = 0;
        while ((g.castQ || this.busy) && w < 30) { w += this.dt; yield; }
        w = 0;
        while (g.deck.busy && w < 4) { w += this.dt; yield; }
      }
    }
    // 第 4 步：顺着船板一块接一块（箭头指着哪就往哪开），到看见沉船为止
    this.stage = 'trail';
    w = 0;
    while (!g.flags.wreck && w < 70) {
      const L = g.leadTarget() || WRECK;
      const dx = L.x - bc.pos.x, dz = L.z - bc.pos.z;
      const q = pilot(bc, dx, dz, 1);
      this.v.lx = q.mx; this.v.ly = q.my;
      w += this.dt;
      yield;
    }
    this.v.lx = this.v.ly = 0;
    // 第 5 步：按住左 Shift 指着沉船看清（镜头不自己转，开船和下网同一个镜头），船慢下来
    this.stage = 'wreck';
    yield* this.moveTo(() => { const p = g.project(_v.set(WRECK.x, -6, WRECK.z)); return { x: Math.max(200, Math.min(VIEW_W - 200, p.x)), y: Math.max(260, Math.min(VIEW_H - 200, p.y)) }; });
    this.v.peek = true;
    let t = 0;
    while (t < 2.8) { const q = pilotStop(bc); this.v.lx = q.mx; this.v.ly = q.my; t += this.dt; yield; }
    this.v.lx = this.v.ly = 0;
    this.v.peek = false;
    yield* this.wait(0.8);
    // 开到沉船甲板那一侧（三小段那一刻停船的地方）：从船尾那一头绕过去，不从沉船正上方压过去
    this.stage = 'sail';
    const sx = N('开局船位x'), sz = N('开局船位z');
    yield* this.driveTo(WRECK.x + 2, WRECK.z + 16, 5, { max: 20 });
    yield* this.driveTo(sx, sz, 2.5, { max: 25, stop: true });
    yield* this.halt();
    yield* this.wait(0.5);
    g.snap.refresh(true);
  }

  // 第一潮沉船旁（第 6～9 步）：陶罐那一组下网，网在水里点好铜锅；等蟹翻完泥退回去，铜印那一处；油还够一网，开进舱口上方，
  // 舱里那一网在水里时大轮廓顺着深槽经过（按住左 Shift 指过去看）。甲板码满就自己开冲（moment.update）
  *routeDeck() {
    const g = this.g;
    const find = (f) => g.snap.spots.find((s) => !g.snap.taken(s) && f(s));
    const waitIdle = function* (self, T = 30) { let w = 0; while ((self.busy || g.deck.busy || g.castQ) && w < T) { w += self.dt; yield; } };
    const cast = function* (self, s, look) {
      if (!s) return false;
      self.stage = 'pick';
      let o = yield* self.pointAt(s);
      if (o && o.far) { self.stage = 'sail'; yield* self.sailNear(o); o = yield* self.pointAt(o); }
      if (!o || o.far) return false;
      yield* self.wait(0.3);
      if (look) { self.stage = 'look'; yield* self.closeLook(look); }
      self.stage = 'cast';
      yield* self.click();
      yield* self.wait(0.25);
      if (!self.busy) return false;
      self.netted++;
      return true;
    };
    g.snap.refresh(true);
    // 第 6 步：陶罐那一组；网还在水里，又点好下一处一摞铜锅
    if (yield* cast(this, find((s) => s.ids.includes('jar')), 1.6)) {
      let w = 0;
      while (g.castQ && w < 12) { w += this.dt; yield; }
      yield* this.wait(1.4);
      const pots = find((s) => s.ids.includes('copperset') && !s.far);
      if (pots && g.mode === 'net') {
        const o = yield* this.pointAt(pots);
        if (o && g.mode === 'net') { yield* this.wait(0.2); yield* this.click(); this.netted++; }
      }
    } else yield* cast(this, find((s) => s.ids.includes('copperset')));
    yield* waitIdle(this);
    yield* this.wait(0.3);
    yield* waitIdle(this);
    // 第 7 步：蟹翻泥。指针停在那块地上等它翻完、退回舱盖底下，再下网
    this.stage = 'crab';
    const crab = g.crabLife.key;
    const sp = wreckToWorld(SEAL_SPOT.along, SEAL_SPOT.side);
    yield* this.moveTo(() => this.at({ x: sp.x, y: -6, z: sp.z }));
    let w = 0;
    const digSpot = () => find((s) => s.dig || s.ids.includes('seal'));
    while (!digSpot() && w < 40) { g.snap.refresh(false); w += this.dt; yield; }
    w = 0;
    while (crab && crab.mode === 'sea' && !crab.hidden && (crab.state === 'dig' || Math.hypot(crab.pos.x - sp.x, crab.pos.z - sp.z) < 1.8) && w < 20) { w += this.dt; yield; }
    g.snap.refresh(true);
    yield* cast(this, digSpot());
    yield* waitIdle(this);
    // 第 8、9 步：舱里那一处（开近，网下到舱里），网在水里时大轮廓经过：按住左 Shift 指过去
    g.snap.refresh(true);
    const hold = find((s) => s.hold);
    if (yield* cast(this, hold)) {
      this.stage = 'lev';
      w = 0;
      while ((this.busy || g.castQ) && w < 40) {
        const L = g.leviathan;
        if (L.active && !L.leaving && L.dive < 0.5) {
          const p = g.project(L.head);
          if (p.z < 1 && p.x > 120 && p.x < VIEW_W - 120 && p.y > 160 && p.y < VIEW_H - 120) {
            if (!this.v.peek) { yield* this.moveTo(() => { const q = g.project(L.head); return { x: Math.max(140, Math.min(VIEW_W - 140, q.x)), y: Math.max(200, Math.min(VIEW_H - 140, q.y)) }; }); this.v.peek = true; }
            else { const q = g.project(L.head); this.v.ptr.x += (Math.max(140, Math.min(VIEW_W - 140, q.x)) - this.v.ptr.x) * 0.08; this.v.ptr.y += (Math.max(200, Math.min(VIEW_H - 140, q.y)) - this.v.ptr.y) * 0.08; }
          }
        } else if (this.v.peek && (!L.active || L.leaving)) this.v.peek = false;
        w += this.dt;
        yield;
      }
      this.v.peek = false;
    }
    yield* waitIdle(this);
    // 还没码满（换了走法、哪一处没下成）：照平常挑近处的补满
    if (!g.deck.full && g.trip.fuel >= MIN_NET_COST && g.mode === 'arm') yield* this.deckRound({ near: true });
    else yield* this.washRound();
  }

  // 回港：开舱清点完按空格翻开债本，看一眼去船坞，升设备，出海
  *harborRound() {
    const g = this.g, H = g.harbor;
    this.stage = 'home';
    let w = 0;
    // 开舱：东西一件件落下时按一下空格加快（切片第 13 步），清点完停一会儿再按空格翻开债本
    let sped = false;
    while (!(g.mode === 'summary' && g.tally.done) && w < 60) {
      if (!sped && g.mode === 'summary' && g.tally.active && g.tally.t > 2.2) { sped = true; this.v.a = true; }
      w += this.dt;
      yield;
    }
    yield* this.wait(N('演示开舱停多久', 2.4));  // 表的 id，不是玩家看的
    this.v.a = true;
    w = 0;
    while (g.harbor.mode !== 'debt' && w < 8) { w += this.dt; yield; }
    this.stage = 'debt';
    yield* this.wait(N('演示债本停多久', 3.2));  // 表的 id，不是玩家看的
    // 钱够就还这一页
    if (g.gear.canRepay()) {
      yield* this.clickEl(() => H.debtEl.querySelector('.pay'));
      yield* this.wait(2.2);
    }
    yield* this.clickEl(() => H.debtEl.querySelector('.next'));
    w = 0;
    while (H.mode !== 'dock' && w < 6) { w += this.dt; yield; }
    yield* this.dockRound();
  }

  // 船坞：第一次先升网（一网多罩几件）、再升油箱；还清第一页以后回来只升油箱（切片第 16、23 步），出海
  *dockRound() {
    const g = this.g, H = g.harbor;
    this.stage = 'dock';
    yield* this.wait(1.4);
    for (const id of g.gear.paid > 0 ? ['tank'] : ['net', 'tank']) {
      if (!g.gear.canBuy(id)) continue;
      yield* this.clickEl(() => H.marks[id]);
      yield* this.wait(0.9);
      yield* this.clickEl(() => H.dockEl.querySelector('.gcard .buy'));
      yield* this.wait(1.6);
    }
    // 钱不够升的那几样也点开看一眼
    if (!g.gear.trips || g.gear.ids().every((id) => !g.gear.canBuy(id))) yield* this.wait(0.6);
    yield* this.clickEl(() => H.dockEl.querySelector('.sail'));
  }

  // 出海以后（harbor.sail 叫它）：从头再来一圈
  sailed() {
    this.run++;
    this.t = 0;
    this.failed = new Set();
    this.netted = 0;
    this.explored = 0;
    this.clear();
    this.co = this.main();
  }

  // 码一甲板、开冲、等结算出来
  *deckRound(opt = {}) {
    const g = this.g;
    this.near = !!opt.near || g.items.tide > 0;
    let queued = null;
    while ((g.mode === 'arm' || g.mode === 'net') && g.trip.fuel >= 4 && !g.trip.ended) {
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
    yield* this.washRound();
  }

  // 码满了（或没油了）：按开冲；一起冲时按住左键冲得快，等结算出来
  *washRound() {
    const g = this.g;
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
      // 第一包让人看清泥一层层退（不按），第二包起按住左键冲得快；压轴那一包冲到一小半按住（切片第 10 步）
      const hold = (B.phase === 'finale' && g.reveal.cur && g.reveal.cur.phase === 'wash' && g.reveal.cur.w > 0.25) || (B.phase === 'wash' && (B.count || 0) >= 1);
      this.v.aHeld = hold;
      yield;
    }
    this.v.aHeld = false;
    this.stage = 'result';
    // 结算出来以后停一会儿
    w = 0;
    while (g.mode !== 'result' && w < 20) { w += this.dt; yield; }
    yield* this.wait(Math.max(0.5, N('演示结算停多久', 6) - 1));  // 表的 id，不是玩家看的
  }
}

export { VIEW_W, VIEW_H };

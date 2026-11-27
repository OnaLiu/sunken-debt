import { MomentBot } from './momentbot.js';
import { pilot } from './pilot.js';
import { MIN_NET_COST } from './trip.js';
import { WRECK, TRAIL } from '../sea/index.js';
import { N } from './tables.js';
import { netVerdict } from './forecast.js';
import { LAST_PARK } from './run.js';
import { lampSpot, TUBE_SPOT } from '../sea/index.js';

// 一局（三小段）的自动演示：和玩家一样只动鼠标和键盘。
// 第一趟：W、A、S、D 顺着方向箭头开（浅滩先下一网，再顺着船板找到沉船），在沉船那儿一网一揭，按住 Q 回港；
// 开舱、翻开债本、去船坞；船坞里指着船上哪一样、点「购买」，船员装上；点「出海」；
// 第二潮起：开到沉船旁，挑一处按一下、网还在水里就点好下一处，码满一甲板按 E 开冲，再码一甲板，回港。
// 挑打捞点、开近、看海底都是小样那一份（MomentBot）；只看屏幕上看得见的，不看海底藏着什么。
// 路线后面三小段：第二潮回来只雇吊机手；第三潮开到沉船旁停下（只按 W A S D，他自己下网），船边捞完开到断舱那一侧再停；
// 油快到头时开到船尾外停下，他挑好碎陶片、回头看你那一拍里，指针挪到坡上那盏灯、按住左 Shift 看一眼、左键接手；
// 回港开舱，进船坞按 Q 翻开债本还第一页，翻过来那张画停一会儿，合上，码头停一会儿，回到标题。
const PARK = () => ({ x: N('开局船位x') + 1.2, z: N('开局船位z') }); // 停在沉船甲板那一侧：小样开局那一处再往外一米多（甲板加宽、网口变大以后船身那一圈宽了）
// 断舱那一侧：沉船甲板朝东，舱口那几件从东边够得着（船身在沉船东边不远，船头朝北）
const HOLD_PARK = () => ({ x: 12.6, z: 4.6 });
// 从 +z 那一边绕过来停：船头朝 -z（小样开局的「朝北」，heading 1.62）、左舷对着沉船，船边那几堆货都在吊臂够得着的地方
const APPROACH = () => ({ x: N('开局船位x') + 4.2, z: N('开局船位z') + 15 });

export class RunBot extends MomentBot {
  constructor(g) {
    super(g);
    this.trips = 0;
  }

  // 出海那一下（run.sail）：主循环自己看现在在哪一屏，不用另起
  tripStart() {}

  // 下一网去哪（只看屏幕上看得见的打捞点）：近的、一网罩得多的先；坡下深处的少去（油花得多、看不清）；
  // 舱里那一处（舱口里看得见反光）留到后面——一网一揭时捞过三网、码甲板时码到最后一包再开进去
  choose() {
    const g = this.g;
    // 试过下不去的那几件，换个组合（多罩一件、少罩一件）也不再去试
    const bad = new Set([...this.failed].flatMap((k) => k.split('+')).filter((id) => id !== 'dig'));
    const spots = g.snap.spots.filter((s) => !this.failed.has(s.key) && !g.snap.taken(s) && !s.ids.some((id) => bad.has(id)));
    if (!spots.length) return null;
    const bp = g.boatCtl.pos;
    const late = g.deck.on ? this.netted >= g.deck.slots.length - 1 : this.netted >= 3;
    const rank = (s) => {
      const d = Math.hypot(s.x - bp.x, s.z - bp.z);
      let sc = this.score(s) - d * 0.06 - (s.far ? 1.4 : 0) - (s.y < -16 ? 1.6 : 0);
      if (s.hold) sc += late ? 3 : -2.5;
      return sc;
    };
    return spots.slice().sort((a, b) => rank(b) - rank(a))[0];
  }

  *main() {
    for (;;) {
      const R = this.g.run;
      if (!R.on) { yield; continue; }
      if (R.phase === 'trip') yield* this.trip();
      else if (R.phase === 'ledger') yield* this.ledger();
      else if (R.phase === 'dock') yield* this.shop();
      else yield;
    }
  }

  // —— 一趟 ——
  *trip() {
    const g = this.g, R = g.run;
    this.failed = new Set();
    this.netted = 0;
    this.explored = 0;
    this.decks = 0;
    this.run = this.trips;
    // 「最后一网」直接开始：船已经停在船尾外、油只够一网，不再开去沉船边（他一开场就在挑，不等）
    const atLast = g.hand.hired && this.fuelLow();
    if (!atLast) yield* this.wait(1.4);
    // 开到沉船：第一趟顺着箭头（浅滩先下一网），以后直接开过去
    this.stage = 'voyage';
    // 雇了吊机手的那一趟：路过浅滩停一下，让他把锚沟边那一两堆捞了（你只管开船、停在哪）
    if (!atLast && g.hand.hired) {
      this.stage = 'shoal';
      yield* this.driveTo({ x: TUBE_SPOT.x + 1, z: TUBE_SPOT.z - 7 }, 0.6, true);
      yield* this.letHand(() => false);
      this.stage = 'voyage';
    }
    if (!atLast) yield* this.voyage();
    // 捞：甲板还没加宽的一网一揭；加宽了码满一甲板一起冲
    this.stage = 'salvage';
    if (g.hand.hired) yield* this.handTrip();
    else if (g.deck.on) yield* this.decksLoop();
    else yield* this.singles(R.st.knowWreck ? 6 : 7);
    // 回港：按住 Q 一秒（最后一网以后油不够，游戏自己收工）
    if (R.phase === 'trip' && !g.trip.ended) yield* this.holdQuit();
    // 收工、开舱：收获单出完停一会儿，按空格进港
    this.stage = 'tally';
    let w = 0;
    while (g.mode !== 'summary' && w < 40) { w += this.dt; yield; }
    w = 0;
    while (g.mode === 'summary' && !g.tally.done && w < 40) { w += this.dt; yield; }
    yield* this.wait(N('演示·收获单停多久', 3));
    if (g.mode === 'summary') this.v.a = true;
    w = 0;
    while (R.phase === 'trip' && w < 10) { w += this.dt; yield; }
    this.trips++;
  }

  // 开船：往方向箭头指的那一处开（没有箭头时往沉船旁停船的那一处），浅滩那儿箭头收起时先下一网
  *voyage() {
    const g = this.g, bc = g.boatCtl, R = g.run;
    let T = 0, shoalTried = false, rounded = false;
    while (R.phase === 'trip' && T < 120) {
      const F = g.flags;
      const P = PARK(), A = APPROACH();
      // 照这会儿的船速提前松油门、踩 S：停下来正好在那一处
      const dP = Math.hypot(bc.pos.x - P.x, bc.pos.z - P.z);
      if (F.wreck && rounded && dP < 0.9 + 0.5 * Math.max(0, bc.speed)) break;
      if (F.wreck && !rounded && Math.hypot(bc.pos.x - A.x, bc.pos.z - A.z) < 5) rounded = true;
      let L = g.leadTarget();
      // 到了浅滩，箭头收起来了：先在这儿捞一网（铜筒那一窝）
      if (!L && !F.wreck) {
        if (!shoalTried) {
          shoalTried = true;
          yield* this.halt();
          yield* this.wait(0.6);
          g.snap.refresh(true);
          yield* this.one();
          continue;
        }
        L = TRAIL[Math.min(F.trailIdx, TRAIL.length - 1)];
      }
      const to = F.wreck || !L || L === WRECK ? (rounded ? P : A) : L;
      const dT = Math.hypot(to.x - bc.pos.x, to.z - bc.pos.z);
      // 最后那一段越近开得越慢，停得准（船头还朝着北）
      const q = pilot(bc, to.x - bc.pos.x, to.z - bc.pos.z, to === P ? Math.min(0.6, dT / 14) : dT < 12 ? 0.45 : 1);
      this.v.lx = q.mx; this.v.ly = q.my;
      T += this.dt;
      yield;
    }
    this.v.lx = this.v.ly = 0;
    yield* this.halt();
    yield* this.wait(0.8);
    g.snap.refresh(true);
  }

  // 挑一处、下一网，等它冲洗揭晓完回到打捞那一屏（一网一揭）；返回下没下成
  *one() {
    const g = this.g;
    g.snap.refresh(true);
    let s = this.choose();
    if (!s && g.trip.fuel > 20 && (this.explored = (this.explored || 0) + 1) <= 2) {
      this.stage = 'explore';
      yield* this.explore();
      s = this.choose();
    }
    if (!s) return false;
    this.stage = 'pick';
    let o = yield* this.pointAt(s);
    if (!o) { this.failed.add(s.key); return true; }
    if (o.far) {
      this.stage = 'sail';
      yield* this.sailNear(o);
      o = yield* this.pointAt(o);
      if (!o || o.far) { this.failed.add(s.key); return true; }
    }
    yield* this.wait(0.25);
    if (!this.netted || o.hold) { this.stage = 'look'; yield* this.closeLook(1.8); }
    // 下网以前看一眼预告：这一网一个金圈都没有（压在网口边上、埋得太深）就不下，换一处（玩家也是看着金圈下网）
    if (!o.dig && !this.yesAt(o)) { this.failed.add(s.key); return true; }
    this.stage = 'cast';
    yield* this.click();
    yield* this.wait(0.25);
    if (!this.busy) { this.failed.add(s.key); return true; }
    this.netted++;
    // 等网收回来、冲洗、揭晓完：冲到一半按住左键冲得快（按下以后吊臂还在走、网还没下去时也算在等）
    let w = 0;
    while ((g.mode !== 'arm' || this.busy || g.reveal.active) && w < 40) {
      const c = g.reveal.cur;
      this.v.aHeld = !!(c && c.phase === 'wash' && c.w > 0.45);
      w += this.dt;
      yield;
    }
    this.v.aHeld = false;
    yield* this.wait(0.6);
    return true;
  }

  // 白圈落在这一处，预告里有几个金圈（和 forecast.js 同一条规则）
  yesAt(o) {
    const g = this.g, ev = g.snap.evalAt(o.x, o.z);
    if (!ev || !ev.ok) return 0;
    return o.ids.filter((id) => {
      const it = g.items.items.find((i) => i.id === id);
      return it && it.state === 'seabed' && netVerdict(it, o.x, o.z, ev.restY, ev.inHold, false, 0.05, ev.r, ev.drop) === 'yes';
    }).length;
  }

  // —— 雇了吊机手的一趟：你只管开船、停在哪 ——
  *handTrip() {
    const g = this.g, R = g.run, H = g.hand;
    this.stage = 'hand';
    const atLast = this.fuelLow();
    // 停在船边，他一网一网下，码满自己开冲（这一截演示什么都不按）
    if (!atLast) yield* this.letHand(() => this.fuelLow() || this.lateBeat());
    if (this.over()) return;
    // 他够得着的捞完了（模式牌「吊机手无处下网」）：开到看得见、他在这儿够不着的那几堆旁边再停（断舱那一侧、船边另一头），他接着下
    const tried = new Set();
    for (let m = 0; m < 6 && !this.fuelLow() && !this.over(); m++) {
      g.snap.refresh(true);
      const s = this.nextStop(tried);
      if (!s) break;
      tried.add(s.key);
      this.stage = 'drive-' + m;
      if (m === 0 && s.hold) yield* this.driveTo(HOLD_PARK(), 0.55, true);
      yield* this.sailNear(s);
      yield* this.letHand(() => this.fuelLow() || this.lateBeat());
    }
    if (this.over()) return;
    // 油快到头：开到船尾外停下（路上油还多就多绕一小圈，停下来正好只够一网）
    this.stage = 'drive-last';
    const P = LAST_PARK();
    // 顺着船头那条线开进去停（船身横在碎陶片、那盏灯和船之间，两处都在船边，不在船头船尾那一线上）
    const A = { x: P.x + Math.cos(P.heading) * -7, z: P.z - Math.sin(P.heading) * -7 };
    if (!atLast) yield* this.driveTo(A, 0.8, false);
    let w = 0;
    // 停下来要剩 11 上下（「段·最后一网的油」）：只够一网（少于两网最浅的 12），又够下坡上那一网（9 上下）。
    // 先在船尾外的水上兜圈烧到十五上下，顺着进来那条线开进去停，原地打舵（只转不走也费油，半圈 2 上下）
    // 烧到正好、船身横过来（碎陶片和那盏灯都在船边，不在船头船尾那一线上）
    const target = N('段·最后一网的油', 11);
    const left = () => g.trip.fuel - (Math.hypot(A.x - g.boatCtl.pos.x, A.z - g.boatCtl.pos.z) + 7) * 0.11;
    while (!atLast && left() >= target + 4 && w < 200 && !this.over()) {
      // 船尾外那片水上兜一小圈
      const q = pilot(g.boatCtl, Math.cos(w * 0.5) * 10, Math.sin(w * 0.5) * 10, 0.6);
      this.v.lx = q.mx; this.v.ly = q.my;
      w += this.dt;
      yield;
    }
    if (!atLast) {
      yield* this.driveTo(A, 0.8, false);
      yield* this.driveTo(P, 0.5);
      const fP = g.trip.fuel, bc = g.boatCtl;
      const side = () => { const d = Math.abs(Math.atan2(Math.sin(bc.heading - P.heading), Math.cos(bc.heading - P.heading))); return Math.min(d, Math.PI - d); };
      w = 0;
      while ((g.trip.fuel > target + 0.6 || side() > 0.2) && w < 20 && !this.over()) { this.v.lx = 1; this.v.ly = 0; w += this.dt; yield; }
      this.v.lx = 0;
      yield* this.wait(0.4);
      window.__lastPark = { fP: +fP.toFixed(1), f: +g.trip.fuel.toFixed(1), side: +side().toFixed(2) };
    }
    // 最后一网：他挑好、回头看你那一拍里接手
    this.stage = 'last';
    w = 0;
    while (!(H.st === 'beat' && H.last && H.t > 0.5) && w < 8 && !this.over()) { w += this.dt; yield; }
    if (H.st === 'beat' && H.last) {
      const L = lampSpot();
      const lamp = g.snap.spots.find((s) => Math.hypot(s.x - L.x, s.z - L.z) < 1.2);
      if (lamp) {
        const o = yield* this.pointQuick(lamp);
        if (o) {
          // 按住左 Shift 看一眼那盏灯（他那一拍剩多少看多少，赶在他下网以前点）
          this.v.peek = true;
          yield* this.wait(Math.max(0.2, Math.min(0.9, H.beatDur - H.t - 0.35)));
          this.v.peek = false;
          yield* this.wait(0.15);
          this.v.click = true;
          yield* this.wait(0.3);
        }
      }
    }
    // 网下去、大轮廓经过、提上来、码满开冲：等这一甲板冲完，游戏自己收工
    this.stage = 'last-wait';
    w = 0;
    while (!g.trip.ended && w < 90) { w += this.dt; yield; }
  }

  // 下一处停在哪：看得见、吊机手在这儿下不了（够不着、压在船身那一圈里）的那几堆里，一网罩得多、离得近的；
  // 船尾外那一小堆碎陶片和坡上那盏灯留到最后一网
  nextStop(tried) {
    const g = this.g, H = g.hand, bp = g.boatCtl.pos;
    const late = (s) => this.late(s);
    const list = g.snap.spots.filter((s) => !tried.has(s.key) && !late(s) && !g.snap.taken(s) && H.verdict(s).k !== 'gold');
    if (!list.length) return null;
    return list.sort((a, b) => (this.score(b) - Math.hypot(b.x - bp.x, b.z - bp.z) * 0.08) - (this.score(a) - Math.hypot(a.x - bp.x, a.z - bp.z) * 0.08))[0];
  }

  // 船尾外那一小堆碎陶片、坡上那盏灯（留给最后一网的）
  late(s) {
    const g = this.g;
    return !!s && s.ids.some((id) => { const it = g.items.items.find((i) => i.id === id); return it && (it.kind === 'shards' || it.kind === 'lantern'); });
  }

  // 还没到最后一网，他就挑了留给最后一网的那一堆：演示开走（开船他就松手）
  lateBeat() {
    const H = this.g.hand;
    return H.st === 'beat' && !H.last && this.late(H.pick);
  }

  over() {
    const g = this.g;
    return g.run.phase !== 'trip' || g.trip.ended;
  }

  // 开到那一处要多少油（照开船每秒烧的算个大概）
  costTo(P) {
    const bc = this.g.boatCtl, d = Math.hypot(P.x - bc.pos.x, P.z - bc.pos.z);
    return (d / Math.max(2, bc.cruise * 0.6) + 3) * N('开船每秒的油', 0.62);
  }

  // 再让他下一网就到不了船尾外、下不了最后那一网了
  fuelLow() {
    const g = this.g;
    return g.trip.fuel - this.costTo(LAST_PARK()) < 12 + 10;
  }

  // 停着让吊机手下：直到他没处可下（模式牌「吊机手无处下网」）、或者 stop() 说该走了（网在水里、正在冲时不走）
  *letHand(stop) {
    const g = this.g, H = g.hand;
    this.v.lx = this.v.ly = 0;
    let idleT = 0, w = 0;
    while (!this.over() && w < 240) {
      w += this.dt;
      const busy = g.castQ || g.netop.busy || g.batch.on || g.deck.busy || g.reveal.active || g.mode !== 'arm';
      // 他下完一网马上就挑下一处（idle 那一下看不到），所以停一拍那会儿也问一声该不该走（开船他就松手）
      if (!busy && (H.st === 'idle' || H.st === 'wait' || H.st === 'beat')) {
        if (stop()) return;
        idleT = H.st === 'wait' ? idleT + this.dt : 0;
        if (idleT > 1.2) return;
      } else idleT = 0;
      yield;
    }
  }

  // 只按 W A S D 开到一处停下（越近开得越慢）
  *driveTo(P, slow = 0.6, stop = true) {
    const g = this.g, bc = g.boatCtl;
    let T = 0;
    while (!this.over() && T < 60) {
      const dT = Math.hypot(P.x - bc.pos.x, P.z - bc.pos.z);
      if (dT < (stop ? 0.9 + 0.5 * Math.max(0, bc.speed) : 3)) break;
      const q = pilot(bc, P.x - bc.pos.x, P.z - bc.pos.z, stop ? Math.min(1, Math.max(slow * 0.5, dT / 14)) : 1);
      this.v.lx = q.mx; this.v.ly = q.my;
      T += this.dt;
      yield;
    }
    if (!stop) return;
    this.v.lx = this.v.ly = 0;
    yield* this.halt();
  }

  // 指针快一点挪到那一处（最后一网那一拍只有两秒多）
  *pointQuick(s) {
    const g = this.g;
    let o = this.now(s);
    if (!o) return null;
    const P = this.v.ptr, x0 = P.x, y0 = P.y, T = 0.45;
    let t = 0;
    while (t < T + 0.4) {
      t += this.dt;
      o = this.now(o) || o;
      const q = this.at(o), u = Math.min(1, t / T), k = u * u * (3 - 2 * u);
      P.x = x0 + (q.x - x0) * k;
      P.y = y0 + (q.y - y0) * k;
      if (t > T && g.snap.hov && g.snap.hov.key === o.key) return o;
      yield;
    }
    return g.snap.hov && g.snap.hov.key === o.key ? o : null;
  }

  // 一网一揭捞几网（油不够了就停）
  *singles(n) {
    const g = this.g;
    for (let i = 0; i < n * 2 && this.netted < n; i++) {
      if (g.run.phase !== 'trip' || g.trip.ended || g.trip.fuel < MIN_NET_COST + 4) return;
      const ok = yield* this.one();
      if (!ok) return;
    }
  }

  // 码满一甲板一起冲，冲两甲板（小样那一份的捞法）
  *decksLoop() {
    const g = this.g;
    for (let d = 0; d < 2; d++) {
      if (g.run.phase !== 'trip' || g.trip.ended || g.trip.fuel < MIN_NET_COST + 6) return;
      this.netted = 0;
      this.failed = new Set();
      this.explored = 0;
      yield* this.deckOnce();
      // 冲完回到打捞那一屏
      let w = 0;
      while (g.mode !== 'arm' && w < 40) { w += this.dt; yield; }
      yield* this.wait(1.2);
      this.decks++;
    }
  }

  // 一甲板：MomentBot 的码包、开冲那一段，冲完不按「再来一次」
  *deckOnce() {
    const g = this.g;
    this.stage = 'pick';
    const co = super.main();
    for (;;) {
      if (g.mode === 'result' || (this.stage === 'result')) break;
      const r = co.next();
      if (r.done) break;
      yield;
    }
    this.v.aHeld = false;
  }

  // 按住 Q 一秒回港
  *holdQuit() {
    const g = this.g;
    let w = 0;
    while ((g.netop.busy || g.castQ || g.mode !== 'arm') && w < 20) { w += this.dt; yield; }
    if (g.trip.ended) return;
    this.stage = 'quit';
    this.v.b = true;
    this.v.bHeld = true;
    w = 0;
    while (!g.trip.ended && w < N('回港按住多久', 1) + 1) { w += this.dt; yield; }
    this.v.bHeld = false;
  }

  // —— 债本：看一会儿，点「去船坞」（「合上」）——
  *ledger() {
    const g = this.g, R = g.run, U = R.ui;
    this.stage = 'ledger';
    // 钱够还这一页：指着「还这一页」点下去，盖章、翻页，翻过来那张画停一会儿，合上
    const pg = R.page();
    if (pg && R.st.money >= pg.amount && !U.first) {
      yield* this.wait(1.2);
      yield* this.moveTo(() => U.at('pay') || { x: this.v.ptr.x, y: this.v.ptr.y });
      yield* this.wait(0.35);
      this.v.click = true;
      yield* this.wait(0.75 + 0.2 + N('演示·翻页停多久', 2.5) + 0.4);
      this.paidDemo = true;
    } else yield* this.wait(N('演示·债本停多久', 4));
    if (R.phase !== 'ledger') return;
    const at = U.at('close');
    if (at) { yield* this.moveTo(() => U.at('close') || at); yield* this.wait(0.3); this.v.click = true; }
    else this.v.go = true;
    let w = 0;
    while (R.phase === 'ledger' && w < 3) { w += this.dt; yield; }
  }

  // —— 船坞：先买加宽甲板，再网、油箱、水泵，钱够的都买；然后出海 ——
  *shop() {
    const g = this.g, R = g.run, U = R.ui;
    this.stage = 'dock';
    yield* this.wait(1.6);
    // 还清了第一页：合上债本以后在码头停一会儿（镜头绕着这条换了一身设备的船转），回到标题——演示到这里放完
    if (this.paidDemo) {
      this.stage = 'pier';
      yield* this.wait(N('演示·码头停多久', 4) - 1.6);
      window.__demoEnd = true;
      g.leaveToTitle();
      return;
    }
    // 钱够还第一页：按 Q 翻开债本
    const pg = R.page();
    if (pg && R.st.money >= pg.amount) {
      this.stage = 'book';
      this.v.b = true;
      let w = 0;
      while (R.phase === 'dock' && w < 2) { w += this.dt; yield; }
      return;
    }
    // 吊机手头上有牌子、钱够：只雇他（钱花到只剩一点，别的价签照旧亮着）
    const hire = R.handShown && R.next('hand') && R.st.money >= R.next('hand').price;
    const order = hire ? ['hand'] : ['deck', 'net', 'tank', 'pump'];
    for (const k of order) {
      if (R.phase !== 'dock') return;
      const nx = R.next(k);
      if (!nx || R.st.money < nx.price) continue;
      // 指着船上那一处：牌子亮、卡片出来
      this.stage = 'look-' + k;
      yield* this.moveTo(() => U.at(k) || { x: this.v.ptr.x, y: this.v.ptr.y });
      let w = 0;
      while (U.sel !== k && w < 1.5) { this.v.ptr.x += Math.sin(w * 20) * 0.6; w += this.dt; yield; }
      yield* this.wait(N('演示·一样看多久', 1.4));
      if (R.phase !== 'dock') return;
      // 点「购买」，看船员装上
      this.stage = 'buy-' + k;
      yield* this.moveTo(() => U.at('buy') || { x: this.v.ptr.x, y: this.v.ptr.y });
      yield* this.wait(0.25);
      this.v.click = true;
      yield* this.wait(k === 'hand' ? 6.5 : 3.6);
    }
    if (R.phase !== 'dock') return;
    // 点「出海」
    this.stage = 'sail-out';
    yield* this.moveTo(() => U.at('sail') || { x: this.v.ptr.x, y: this.v.ptr.y });
    yield* this.wait(0.4);
    this.v.click = true;
    let w = 0;
    while (R.phase === 'dock' && w < 3) { w += this.dt; yield; }
  }
}


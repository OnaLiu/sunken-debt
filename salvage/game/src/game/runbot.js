import { MomentBot } from './momentbot.js';
import { pilot } from './pilot.js';
import { MIN_NET_COST } from './trip.js';
import { WRECK, TRAIL } from '../world/layout.js';
import { N } from './tables.js';

// 一局（三小段）的自动演示：和玩家一样只动鼠标和键盘。
// 第一趟：W、A、S、D 顺着方向箭头开（浅滩先下一网，再顺着船板找到沉船），在沉船那儿一网一揭，按住 Q 回港；
// 开舱、翻开债本、去船坞；船坞里指着船上哪一样、点「购买」，船员装上；点「出海」；
// 第二潮起：开到沉船旁，挑一处按一下、网还在水里就点好下一处，码满一甲板按 E 开冲，再码一甲板，回港。
// 挑打捞点、开近、看海底都是小样那一份（MomentBot）；只看屏幕上看得见的，不看海底藏着什么。
const PARK = () => ({ x: N('开局船位x') + 1.2, z: N('开局船位z') }); // 停在沉船甲板那一侧：小样开局那一处再往外一米多（甲板加宽、网口变大以后船身那一圈宽了）
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
    yield* this.wait(1.4);
    // 开到沉船：第一趟顺着箭头（浅滩先下一网），以后直接开过去
    this.stage = 'voyage';
    yield* this.voyage();
    // 捞：甲板还没加宽的一网一揭；加宽了码满一甲板一起冲
    this.stage = 'salvage';
    if (g.deck.on) yield* this.decksLoop();
    else yield* this.singles(R.st.knowWreck ? 6 : 7);
    // 回港：按住 Q 一秒
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
    this.stage = 'cast';
    yield* this.click();
    yield* this.wait(0.25);
    if (!this.busy) { this.failed.add(s.key); return true; }
    this.netted++;
    // 等网收回来、冲洗、揭晓完：冲到一半按住左键冲得快
    let w = 0;
    while (g.mode !== 'arm' && w < 40) {
      const c = g.reveal.cur;
      this.v.aHeld = !!(c && c.phase === 'wash' && c.w > 0.45);
      w += this.dt;
      yield;
    }
    this.v.aHeld = false;
    yield* this.wait(0.6);
    return true;
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
    yield* this.wait(N('演示·债本停多久', 4));
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
    if (R.st.tide >= 3) window.__demoEnd = true;
    yield* this.wait(1.6);
    const order = ['deck', 'net', 'tank', 'pump'];
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
      yield* this.wait(3.6);
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


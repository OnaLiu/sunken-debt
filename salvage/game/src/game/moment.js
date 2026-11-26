import * as THREE from 'three';
import { TRAIL } from '../world/layout.js';
import { MIN_NET_COST } from './trip.js';
import { Bundle } from './bundle.js';
import { netFuelCost, NET_R, VIEW_W, VIEW_H, BOAT_MAX_SPEED } from '../config.js';
import { ICON } from '../ui/icons.js';
import { key, KEYS } from '../ui/hud.js';
import { BOAT } from '../world/boat.js';
import { T, N } from './tables.js';

// 第一段·归潮沙湾的三小段（小样是第一小段，后两段在它上面往外接）：
// ① 一打开就停在沉船旁边，挑一处按一下、码满甲板、一甲板一起冲，揭完出这一甲板的结算；油还够就接着捞下一甲板。
// ② 油用完（或按住 Q）回港：收工、镜头扎进舱口、开舱清点这一趟（原来那一整趟的开舱），盖完入舱章翻开债本。
// ③ 去船坞升一样设备（船上看得见），出海：回到沉船旁边，新的一潮，网口大了一网多罩几件、油多了一趟多捞一甲板。
// 没有标题、出港、找沉船这一路（那是切片的事）。

const _p = new THREE.Vector3();
const _q = new THREE.Vector3();
const STOW_TIP = new THREE.Vector3(4.3, 5.6, 0);

export class Moment {
  constructor(g) {
    this.g = g;
    this.on = false;
    this.runs = [];
    this.el = document.createElement('div');
    this.el.id = 'result';
    // 结算牌：和一趟的收获单同一套（金字标题、金色总数两边卷草、铜牌按钮）；中间一排这一甲板冲出来的东西本身的小图，便宜的在前、最贵的在最后
    this.el.innerHTML = `<div class="box panel"><div class="h"></div><div class="tot"><span class="num">${ICON.coin}<b></b></span><span class="n"></span></div><div class="things"></div><div class="row best"></div><div class="foot"><div class="row fuel"></div><div class="row rec"></div></div><div class="again"><span class="cd"></span></div></div>`;
    g.ui.root.append(this.el);
    g.events.on('batchDone', (r) => this.onBatchDone(r));
    g.events.on('revealed', (ev) => {
      if (this.on && !ev.batch && g.batch.phase === 'finale') this.finaleEntries = ev.entries;
    });
  }

  // 这一刻从头开始：船停在沉船旁边，甲板空着（加宽过），油是这一甲板的量，直接在打捞模式里
  begin(o = {}) {
    const g = this.g;
    this.on = true;
    this.resultT = null;
    this.decks = 0;
    g.quitHold = null;
    this.finaleEntries = null;
    this.hintGo = false;
    window.__demoEnd = false;
    g.menus.hidePause();
    g.menus.hideSummary();
    g.menus.hideTitle(true);
    g.ui.setPaused(false);
    g.ui.fadeHud(false);
    g.timers = [];
    g.tally.end();
    g.batch.close();
    g.deck.reset();
    // 第几潮：第一趟是原来摆好的那一片，回过港再出海，海底重铺（itemsys.spill）
    g.items.tide = g.gear.trips;
    g.resetTrip();
    g.deck.enable(true, N('甲板空位'));
    // 甲板加宽以后再清一甲板一起冲
    g.batch.reset();
    g.snap.reset();
    g.ui.resetAll();
    // 做过的事不再提示（再来一次也记着）
    g.ui.learned = { ...g.ui.learned, sail: true };
    this.sailT = 0;
    g.firsts = {};
    this.el.classList.remove('on');
    const T0 = g.trip;
    // 油箱升过几级，这一趟就带多少油（设备表「油箱」）
    T0.fuel = g.gear.fuel;
    T0.sawWreck = true;
    // 这一刻不讲路上的事：浅滩、沉船、深槽都算已经到过，线索箭头不出，大轮廓不来
    Object.assign(g.flags, { shoal: true, wreck: true, slope: true, slopeSaid: true, trailIdx: TRAIL.length });
    g.leviathan.done = true;
    const bc = g.boatCtl;
    bc.reset(N('开局船位x'), N('开局船位z'), N('开局船头'));
    bc.update(0.016, {}, 1, g.time);
    g.boat.root.updateMatrixWorld(true);
    g.crew.toPosts();
    g.audio.engine(true);
    g.audio.hush(1, 0.6);
    g.mode = 'arm';
    g.ui.setHud(true);
    g.ui.setMode('arm');
    g.castQ = null;
    // 镜头：一打开就跟在船后上方（开船、停着、下网同一个，chase.js）
    g.sailDist = 27;
    g.chase.snap(g.cam, bc, BOAT_MAX_SPEED);
    g.arm.sync(STOW_TIP);
    g.arm.pushOut = 0;
    g.reachWasOut = false;
    // 白圈等镜头落定、看得见的都看过一遍再吸到打捞点上（不先吸到远处）
    this.enterT = 0.2;
    g.aimJumps = -1;
    g.ui.place(T('地名·沉船'));
    g.ui.hudEnter();
    g.cue('A14');
  }

  // 试跑直达「码满等开冲」：照这几组东西各下一网（每组一包、油照下网扣），泥包直接摆在它们的位子上。
  // groups：[['jar', 'jar2', 'rope'], ['chest', 'sack'], …]，和一网一网吊上来的是同一种泥包、同一些位子
  prefill(groups) {
    const g = this.g;
    if (this.enterT != null) { this.enterT = null; g.snap.enter(); }
    for (const ids of groups) {
      const S = g.deck.slots.find((q) => !q.bundle && !q.reserved && !q.centre) || g.deck.slots.find((q) => !q.bundle && !q.reserved);
      if (!S) break;
      const its = ids.map((id) => g.items.items.find((i) => i.id === id && i.state === 'seabed')).filter(Boolean);
      for (const it of its) g.items.removeFromSeabed(it);
      const b = new Bundle(its, {});
      g.deck.place(b, S);
      g.trip.spendFuel(netFuelCost(its.length ? Math.min(-its[0].y, 14) : 3));
      g.trip.nets++;
    }
    g.snap.refresh(true);
    return g.deck.filled;
  }

  // 这一刻叫什么（触屏暂停时挑段用）
  segName() {
    return T('段·这一刻');
  }

  // 这一网下得了下不了（打捞点那一层）：够得着的地方没有打捞点、够不着
  castBlock(forced) {
    const b = this.g.snap.castBlock(forced);
    if (b === 'aim') return T('拒·没指着');  // 表的 id，不是玩家看的
    if (b === 'none') return T('拒·没有打捞点');
    if (b === 'far') return T('拒·够不着');
    return null;
  }

  // 现在能不能开冲：甲板上有泥包、网不在水里、没有泥包正往下落
  get canGo() {
    const g = this.g;
    return g.mode === 'arm' && !g.netop.busy && !g.castQ && !g.deck.busy && g.deck.filled > 0;
  }

  // 说一句为什么不行：指着打捞点就在那一处的小牌上抖一下，没指着就在指针旁边
  deny(text) {
    const g = this.g, S = g.snap, P = g.input.state.ptr;
    if (S.mouse && (!S.hov || g.netop.busy || g.castQ)) g.ui.say(text, P.sx, P.sy);
    else g.ui.tipDeny(text);
  }

  // 按了一下（左键、空格、手柄 A）：点在开冲键上是开冲；网还在水里是点好下一处；别的是在挑着的那一处下网
  press(inp) {
    const g = this.g, S = g.snap;
    if (inp.click && g.ui.over('go', inp.ptr)) return this.tryGo();
    const busy = g.netop.busy || !!g.castQ;
    if (!busy) {
      // 甲板码满了再按下网：就是开冲
      if (g.deck.full) { if (this.canGo) this.go(); return; }
      // 够不着的：记着要开过去，镜头看过去
      if (S.mouse && S.hov && S.hov.far) { S.heading = S.hov; }
      return g.tryCast();
    }
    const no = (text) => { g.audio.play('busy'); this.deny(text); g.cue('A22'); };
    if (!S.mouse) { g.audio.play('busy'); g.ui.deny(T('拒·网没收回')); g.cue('A22'); return; }  // 表的 id，不是玩家看的
    if (!S.hov) return no(T('拒·网没收回'));  // 表的 id，不是玩家看的
    if (S.hov.far) return no(T('拒·够不着'));  // 表的 id，不是玩家看的
    if (!S.next && g.deck.used + (g.castQ ? 1 : 0) >= g.deck.slots.length) return no(T('拒·甲板满'));  // 表的 id，不是玩家看的
    S.queue(S.hov);
    g.ui.learn('next');
  }

  // 网收回来了：点好的下一处接着下
  castNext() {
    const g = this.g, S = g.snap;
    if (!S.next || g.netop.busy || g.castQ || g.deck.full) return;
    const s = S.same(S.next);
    S.next = null;
    if (!s || s.far) return;
    S.go(s, true);
    g.tryCast(true);
  }

  // 画面上每一处打捞点的记号，和指着的那一处的小牌（够不着的、网还在水里的；够得着的那一处照旧是白圈旁的小牌，game.hudState 里给）
  spotHud(s, m) {
    const g = this.g, S = g.snap;
    s.spots = [];
    const at = (o) => {
      const p = g.project(_p.set(o.x, o.y, o.z));
      if (p.z > 1) return null;
      const ex = g.project(_q.set(o.x + NET_R, o.y, o.z)), x = p.x, y = p.y;
      const rx = Math.hypot(ex.x - x, ex.y - y);
      const ez = g.project(_q.set(o.x, o.y, o.z + NET_R));
      return { x, y, r: Math.max(rx, Math.hypot(ez.x - x, ez.y - y)) };
    };
    const busy = g.netop.busy || !!g.castQ || m === 'net';
    const act = S.active;
    for (const o of S.spots) {
      if (S.taken(o)) continue;
      const p = at(o);
      if (!p || p.x < 0 || p.x > VIEW_W || p.y < 0 || p.y > VIEW_H) continue;
      const on = !!act && act.key === o.key;
      const next = !!S.next && S.next.key === o.key;
      s.spots.push({ x: p.x, y: p.y, r: p.r, far: o.far, on, next, ring: on && (busy ? !o.far : o.far), under: o.under && !on });
    }
    // 开过去的那一处：从吊机到它牵一串点
    const to = S.heading || (S.mouse && S.hov && S.hov.far ? S.hov : null);
    if (to && !busy) {
      const a = g.project(g.boatCtl.localToWorld(_q.set(BOAT.crane.x, 0, BOAT.crane.z), new THREE.Vector3()));
      const b = at(to);
      if (b && a.z < 1) s.trail = { x0: a.x, y0: a.y, x1: b.x, y1: b.y, r: b.r };
    }
    // 网还在水里船开不了：够不着的那几处先不给小牌，点了才说
    if (!S.mouse || !S.hov || S.hov.far === busy || g.castQ) return;
    const p = at(S.hov);
    if (!p) return;
    const next = !!S.next && S.next.key === S.hov.key;
    s.tip = { show: true, x: p.x, y: p.y, r: p.r, cost: 0, lite: true, n: S.hov.n, act: S.hov.far ? 'far' : next ? 'drop' : 'next', reason: S.hov.far ? T('拒·够不着') : null, boat: g.boatOnScreen(), arrows: this.arrows(s) };
  }

  // 没指着的那几处的箭头在画面上占的地方（和 hud 的 paintSpots 同一处）
  arrows(s) {
    return s.spots.filter((q) => !q.on).map((q) => { const b = q.y - Math.max(24, q.r * 0.75); return { x: q.x, y0: b - 28, y1: b }; });
  }

  // 按了开冲（E、点开冲键、手柄 Y）
  tryGo() {
    const g = this.g;
    if (this.canGo) return this.go();
    if (!g.deck.filled) { g.audio.play('denyBlocked'); g.ui.deckDeny(T('拒·甲板空')); g.cue('A21'); return; }
    g.audio.play('busy');
    g.ui.deckDeny(T('拒·网没收回'));  // 表的 id，不是玩家看的
    g.cue('A22');
  }

  // 打捞模式里每帧：按了开冲、甲板码满、油不够再下一网，就开冲
  update(dt, inp) {
    const g = this.g;
    if (inp.any) g.audio.unlock();
    if (g.mode !== 'arm') { g.quitHold = null; return; }
    // 按住 Q（手柄 B）一秒：回港开舱（网在水里、甲板上还有泥包时不行：先冲完）
    if (inp.b && !g.trip.ended) g.quitHold = 0;
    if (g.quitHold !== null) {
      if (!inp.bHeld) g.quitHold = null;
      else if ((g.quitHold += dt) >= N('回港按住多久', 0.9)) {  // 表的 id，不是玩家看的
        g.quitHold = null;
        if (g.netop.busy || g.castQ || g.deck.filled || g.deck.busy) { g.audio.play('busy'); g.ui.deckDeny(T('拒·先冲完')); }  // 表的 id，不是玩家看的
        else this.home();
      }
    }
    if (this.enterT != null) {
      this.enterT -= dt;
      if (this.enterT > 0) return;
      this.enterT = null;
      g.snap.vis = new Map();
      if (g.snap.enter()) g.arm.snapMech();
    }
    this.onLanded();
    // 自己开过一阵船、拉过远近：那两个键就不再提示
    if (Math.abs(inp.my) > 0.38 && (this.sailT += dt) > 1) g.ui.learn('wasd');
    if (Math.abs(inp.mx) > 0.38 && (this.steerT = (this.steerT || 0) + dt) > 0.6) g.ui.learn('steer');
    if (inp.zoom) g.ui.learn('zoom');
    if (inp.go) return this.tryGo();
    if (!this.canGo) { this.autoT = 0; return; }
    const full = g.deck.full;
    const dry = g.trip.fuel < MIN_NET_COST;
    // 码满、没油了：落定半秒再开冲（最后一包砸下来那一下先看清）
    if (full || dry) {
      this.autoT = (this.autoT || 0) + dt;
      if (this.autoT > 0.6) this.go();
    } else this.autoT = 0;
  }

  go() {
    const g = this.g;
    g.castQ = null;
    g.snap.next = null;
    if (!g.batch.start()) return;
    g.mode = 'batch';
    g.ui.setMode('reveal');
    g.ui.learn('arm');
    g.ui.deckTip(null);
  }

  // 第一包码上甲板：甲板那一排底下说一次码满会怎样
  onLanded() {
    const g = this.g;
    if (this.toldFull || g.bot || g.deck.filled !== 1) return;
    this.toldFull = true;
    g.ui.deckTip(T('提示·码满'));  // 表的 id，不是玩家看的
  }

  // 揭完、拉回以后停一会儿，出这一甲板的结算
  onBatchDone(r) {
    const g = this.g;
    if (!this.on) return;
    this.decks++;
    this.pending = r;
    g.later(N('结算等多久', 1.6), () => this.showResult(this.pending));
  }

  showResult(r) {
    const g = this.g;
    if (!r || g.mode === 'result') return;
    g.mode = 'result';
    g.batch.close();
    const prevBest = this.runs.length ? Math.max(...this.runs.map((x) => x.total)) : null;
    this.runs.push(r);
    const E = this.el;
    E.querySelector('.h').textContent = T('结算·标题');
    // 总数从 0 滚到这一甲板的数（resultInput 里按游戏时间滚），滚完两边卷草展开
    this.totShown = -1;
    E.querySelector('.tot b').textContent = '0';
    // 滚的时候数字宽度先占好（「件」不跟着往右挪）
    E.querySelector('.tot b').style.minWidth = String(r.total).length + 'ch';
    E.querySelector('.tot').classList.remove('final');
    E.querySelector('.n').textContent = T('结算·件数', { n: r.n });
    // 冲出来的每一件：东西本身的小图，便宜的在前，最贵的（压轴）放最后、金边
    const best = r.best;
    const thumbs = g.thumbs ? g.thumbs.get() : {};
    const list = (r.entries || []).slice().sort((x, y) => (x.def.value || 0) - (y.def.value || 0));
    if (best) { const i = list.indexOf(best); if (i >= 0) { list.splice(i, 1); list.push(best); } }
    E.querySelector('.things').innerHTML = list.map((e, i) => `<span class="cell${e === best ? ' star' : ''}" style="animation-delay:${(0.35 + i * 0.07).toFixed(2)}s"><img class="th" src="${thumbs[e.kind] || ''}"></span>`).join('');
    E.querySelector('.things').style.display = list.length ? '' : 'none';
    E.querySelector('.best').innerHTML = best
      ? `<span class="k">${T('结算·压轴')}</span><span class="nm">${best.def.name}</span><span class="v">${ICON.coin}${best.def.value}</span>`
      : `<span class="nm">${T('结算·没有压轴')}</span>`;
    E.querySelector('.fuel').innerHTML = `<span class="k">${T('结算·剩油')}</span><span class="fi">${ICON.fuel}</span><span class="v">${Math.round(r.fuel)}</span>`;
    const rec = E.querySelector('.rec');
    if (prevBest != null) {
      rec.style.display = '';
      rec.innerHTML = `<span class="k">${T('结算·最好')}</span><span class="v">${ICON.coin}${Math.max(prevBest, r.total)}</span>`;
      rec.classList.toggle('up', r.total > prevBest);
    } else rec.style.display = 'none';
    const K = KEYS[g.ui.device];
    const again = E.querySelector('.again');
    // 油还够下一网：接着捞下一甲板；不够了：回港开舱
    this.more = this.canMore();
    again.innerHTML = `${key(K.a, 'a')}<span>${T(this.more ? '结算·接着捞' : '结算·回港')}</span><span class="cd"></span>`;  // 表的 id，不是玩家看的
    again.classList.remove('press');
    // 自动演示：按钮底下一条走满，机器人就按（和收获单的「再来一趟」一样）
    const cd = again.querySelector('.cd');
    if (g.bot) cd.style.animationDuration = Math.max(0.5, N('演示结算停多久', 6) - 1.3).toFixed(2) + 's';  // 表的 id，不是玩家看的
    again.classList.toggle('demo', !!g.bot);
    E.classList.remove('on');
    void E.offsetWidth;
    E.classList.add('on');
    // 别的界面淡下去，只留结算牌（剩油在牌上）
    g.ui.fadeHud(true);
    g.audio.play('ribbon');
    g.audio.play('endCadence');
    g.cue('B27');
    this.resultT = 0;
    // 自动演示放完一圈：升过设备以后又冲完一甲板（一网多罩几件看得出来）
    if (g.gear.trips > 0) window.__demoEnd = true;
  }

  // 还能不能接着捞：油够下一网，看得见的打捞点还有没捞的
  canMore() {
    const g = this.g;
    return g.trip.fuel >= MIN_NET_COST && g.snap.spots.some((s) => !g.snap.taken(s));
  }

  // 接着捞：结算牌收起，甲板空出来，回到打捞
  more_() {
    const g = this.g;
    g.audio.play('press');
    this.el.querySelector('.again').classList.add('press');
    this.el.classList.remove('on');
    g.batch.close();
    g.batch.reset();
    g.deck.reset();
    g.ui.fadeHud(false);
    g.mode = 'arm';
    g.ui.setMode('arm');
    g.castQ = null;
    g.snap.refresh(true);
    this.autoT = 0;
  }

  // 回港：收工（吊臂收回、船员擦手、镜头扎进舱口），到了舱里开舱清点这一趟（game.checkEnd 那一段）
  home() {
    const g = this.g;
    if (g.trip.ended) return;
    this.el.classList.remove('on');
    g.batch.close();
    g.ui.fadeHud(false);
    g.ui.learn('home');
    if (g.mode === 'result') { g.mode = 'arm'; g.ui.setMode('arm'); }
    g.audio.play('menuGo');
    g.endTrip(null);
  }

  // 开完舱（入舱章盖下、按了「翻开债本」）：舱盖拉上，翻开债本；这一趟的钱进手里
  afterTally() {
    const g = this.g;
    if (g.mode === 'debt') return;
    g.menus.pressAgain();
    g.audio.play('press');
    g.tally.close();
    g.gear.coins += g.trip.total;
    const first = !g.gear.trips;
    g.gear.trips++;
    g.mode = 'debt';
    g.later(0.75, () => {
      g.menus.hideSummary();
      g.harbor.showDebt(first);
    });
  }

  // 结算牌上：按下网键（左键、空格、A）再来一次；自动演示停一会儿自己再来
  resultInput(dt, inp) {
    const g = this.g;
    this.resultT += dt;
    // 总数滚上去：0.3 秒起、0.8 秒滚完，滚完卷草展开、一砸
    const r = this.runs[this.runs.length - 1];
    if (r && this.totShown !== r.total) {
      const u = Math.max(0, Math.min(1, (this.resultT - 0.3) / 0.8));
      const v = Math.round(r.total * (1 - Math.pow(1 - u, 3)));
      if (v !== this.totShown) {
        this.totShown = v;
        this.el.querySelector('.tot b').textContent = String(v);
        if (v === r.total) this.el.querySelector('.tot').classList.add('final');
      }
    }
    // 点「再来一次」那块铜牌，或按空格、手柄 A
    const over = g.ui.over('again', inp.ptr);
    this.el.querySelector('.again').classList.toggle('hot', over);
    const press = inp.a || (inp.click && over);
    if (press && this.resultT > 0.6) { if (this.more) this.more_(); else this.home(); }
  }

  // 再来一次：黑一下，回到这一刻开头
  restart() {
    const g = this.g;
    if (g.mode === 'fading') return;
    g.mode = 'fading';
    g.audio.play('press');
    this.el.querySelector('.again').classList.add('press');
    g.ui.fade(true);
    g.audio.hush(0.3, 0.4);
    g.audio.play('waveSwell');
    this.el.classList.remove('on');
    const tok = (this.tok = (this.tok || 0) + 1);
    g.later(0.7, () => {
      if (tok !== this.tok) return;
      this.begin();
      if (this.autoFill) this.prefill(this.autoFill);
      g.ui.fade(false);
      if (g.bot && g.bot.restart) g.bot.restart();
    });
  }

  // 暂停菜单的选项：继续、重来这一刻、设置
  pauseOpts() {
    return [{ k: 'resume', t: T('暂停·继续') }, { k: 'restart', t: T('暂停·重来') }, { k: 'wobble' }, { k: 'volume' }, { k: 'look' }, { k: 'invert' }];
  }

  // 暂停时右边：这一刻能按的键、甲板那一排格子
  pauseKeys(K, alt) {
    const kb = this.g.ui.device !== 'pad';
    // 表的 id，不是玩家看的：下面这几行只引表里的字
    return [
      [key(K.aim), kb ? T('键·指着') : T('暂停·键·换一处')],  // 表的 id，不是玩家看的
      [alt(K.a, K.aAlt, 'a'), T('键·下网')],  // 表的 id，不是玩家看的
      [key(K.go, 'go'), T('暂停·键·开冲')],  // 表的 id，不是玩家看的
      ...(kb ? [[key(T('键名·前后')), T('键·前后')], [key(T('键名·左右')), T('键·转向')]] : [[key(K.move), T('键·开船')]]),  // 表的 id，不是玩家看的
      ...(kb ? [[key(T('键名·左Shift')), T('键·看海底')], [key(T('键名·右键')), T('键·转镜头')]] : []),  // 表的 id，不是玩家看的
      [key(K.zoom), T('暂停·键·拉近')],  // 表的 id，不是玩家看的
    ];
  }
}

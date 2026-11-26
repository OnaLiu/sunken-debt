import * as THREE from 'three';
import { setNetR, setFuelMax, FUEL_MAX, VIEW_W } from '../config.js';
import { START, story } from '../sea/index.js';
import { MIN_NET_COST } from './trip.js';
import { tideLayout } from '../sea/index.js';
import { Dock, GEAR_SPOTS } from './dock.js';
import { T, TK, N, GEAR, DEBT } from './tables.js';
import { ICON } from '../ui/icons.js';
import { KEYS, key } from '../ui/hud.js';
import { BOAT_MAX_SPEED } from '../config.js';

// 一局（全游戏一份）：出海 → 捞 → 开舱 → 船坞 → 还债 → 再出海（设计第 2 节）。
// 管一局里留下来的东西：钱、债还到第几页、船上每一样设备几级、这是第几潮；存在玩家自己的设备上（localStorage），关了再开接着来。
// 一趟里的打捞照旧是打捞那一屏（吸到点上、码包、一甲板一起冲，和小样同一份）；这里只管一趟从哪开始、什么时候到头、到头以后去哪。
//
// 第一段·归潮沙湾的三小段：
//   第一趟：从港外航路出发，顺着船板找到沉船，一网一揭（甲板还没加宽），银币匣一定在；收工、开舱，第一次翻开债本。
//   船坞：船停在码头，点船上哪一处升哪一样（网、油箱、甲板、水泵），船员当场装上，船上多一样。
//   第二潮起：海底重铺过，挑一处按一下；甲板加宽以后泥包码在甲板上，码满一甲板一起冲；一趟比一趟多。

const SAVE = 'sunken-run-v1'; // 不是玩家看的：存档的键
const KINDS = ['net', 'tank', 'deck', 'pump'];
const STOW_TIP = new THREE.Vector3(4.3, 5.6, 0);

// 屏幕上的大数：一万以上用「万」，一亿以上用「亿」（设计第 10 节）
export function money(n) {
  n = Math.round(n);
  if (n < 10000) return String(n);
  if (n < 1e8) { const v = n / 1e4; return (v >= 100 ? Math.round(v) : +v.toFixed(v < 10 ? 2 : 1)) + T('单位·万'); }
  const v = n / 1e8;
  return (v >= 100 ? Math.round(v) : +v.toFixed(v < 10 ? 2 : 1)) + T('单位·亿');
}

const fresh = () => ({ v: 1, money: 0, tide: 1, trips: [], paid: 0, gear: { net: 1, tank: 1, deck: 1, pump: 1 }, sawDebt: false, knowWreck: false });

export class Run {
  static fresh() { return fresh(); }

  constructor(g) {
    this.g = g;
    this.on = false;
    this.phase = null;
    this.st = fresh();
    this.dock = new Dock(g);
    this.ui = new RunUI(g, this);
    this.quitHold = null;
    this.endAfterBatch = false;
  }

  // —— 存档 ——
  get saved() {
    try { return !!localStorage.getItem(SAVE); } catch (e) { return false; }
  }
  load() {
    try { const s = JSON.parse(localStorage.getItem(SAVE) || 'null'); if (s && s.v === 1) { this.st = { ...fresh(), ...s, gear: { ...fresh().gear, ...s.gear } }; return true; } } catch (e) { /* 没有本地存储也照样玩 */ }
    return false;
  }
  save() {
    if (this.g.bot) return; // 自动演示不动玩家自己的存档
    try { localStorage.setItem(SAVE, JSON.stringify(this.st)); } catch (e) { /* 存不了也照样玩 */ }
  }
  wipe() {
    this.st = fresh();
    try { localStorage.removeItem(SAVE); } catch (e) { /* 同上 */ }
  }

  // —— 设备 ——
  level(kind) { return this.st.gear[kind] || 1; }
  row(kind, lv = this.level(kind)) { return GEAR.find((r) => r.kind === kind && r.level === lv) || null; }
  next(kind) { return this.row(kind, this.level(kind) + 1); }

  // 船上每一样照现在的级数：网口多大、油箱多大、甲板码几包、水泵冲多快；船上的部件跟着露出来
  applyGear() {
    const g = this.g;
    setNetR(this.row('net').value);
    g.boat.net.setR(this.row('net').value);
    setFuelMax(this.row('tank').value);
    const slots = this.row('deck').value;
    g.deck.enable(slots > 0, slots || 5);
    g.washK = this.row('pump').value;
    for (const k of KINDS) this.dock.parts.set(k, this.level(k));
  }

  // —— 从标题出发（G03 的镜头、点火由 game.startPlay 做）：第一趟，或者存档里接着的那一潮 ——
  depart(withBot, o = {}) {
    const g = this.g;
    this.on = true;
    if (o.resume) {
      // 接着存档：船停在码头（上一趟开完舱以后存的）
      g.ui.setHud(false);
      g.later(0.5, () => this.toDock());
      this.phase = 'leaving';
      return;
    }
    this.phase = 'trip';
    this.beginTrip({ fromTitle: true, ...o });
    if (withBot && g.startRunDemo) g.startRunDemo();
  }

  // 一趟从港外航路开始：海底照这一潮铺好，船上照现在的设备，打捞那一屏（开船、指着下网同一屏）
  beginTrip(o = {}) {
    const g = this.g, st = this.st;
    this.phase = 'trip';
    this.dock.leave();
    this.ui.hide();
    this.quitHold = null;
    this.endAfterBatch = false;
    g.menus.hidePause();
    g.menus.hideSummary();
    g.ui.setPaused(false);
    g.ui.fadeHud(false);
    if (!o.fromTitle) g.timers = [];
    g.tally.end();
    g.batch.close();
    g.deck.reset();
    this.applyGear();
    g.tideNext = st.tide > 1 ? tideLayout(st.tide) : null;
    // 从标题出发：船本来就停在港外航路、海底是第一趟的样子，不重摆（镜头从标题机位接着飞过来）
    if (!o.fromTitle) g.resetTrip();
    this.applyGear();
    g.batch.reset();
    g.snap.reset();
    const M = g.moment;
    M.on = true;
    M.run = true;
    M.resultT = null;
    M.finaleEntries = null;
    M.el.classList.remove('on');
    g.trip.fuel = FUEL_MAX;
    g.trip.ended = false;
    g.firsts = g.firsts || {};
    // 跟船的镜头：从标题出发的从标题机位飞过来（game.introRest 飞完再接上），再出海的直接在船后
    if (o.fromTitle) { g.chase.reset(); g.chase.start(g.cam); }
    // 走熟了的海：第一眼看见沉船、到浅滩那几下只在头一回；大轮廓每一趟都可能来
    if (st.knowWreck) story.known(g.flags);
    g.trip.sawWreck = !!st.knowWreck;
    if (!o.fromTitle) {
      g.ui.resetAll();
      const bc = g.boatCtl;
      bc.reset(START.x, START.z, START.heading);
      bc.update(0.016, { throttle: 0, brake: 0, steer: 0 }, 1, g.time);
      g.boat.root.updateMatrixWorld(true);
      g.crew.toPosts();
      g.audio.engine(true);
      g.audio.hush(1, 0.6);
      g.chase.snap(g.cam, bc, BOAT_MAX_SPEED);
      g.ui.hudEnter();
      g.later(0.6, () => g.ui.place(T('地名·港外航路')));
      if (st.tide > 1) g.later(2.2, () => { if (this.phase === 'trip') g.ui.toast(T('提示·新的一潮', { n: st.tide }), 3.2); });
    }
    g.ui.learned = { ...g.ui.learned, sail: true };
    g.mode = 'arm';
    g.ui.setHud(true);
    g.ui.setMode('arm');
    g.castQ = null;
    g.sailDist = 27;
    g.arm.sync(STOW_TIP);
    g.arm.pushOut = 0;
    g.reachWasOut = false;
    M.enterT = 0.4;
    g.aimJumps = -1;
  }

  // 一趟里每帧（打捞那一屏）：按住 Q（手柄 B）回港；油不够再下一网了就收工。甲板上还码着泥包的，先一起冲完再收
  tripTick(dt, inp) {
    const g = this.g;
    if (this.phase !== 'trip' || g.trip.ended) return;
    const idle = !g.netop.busy && !g.castQ && !g.reveal.active && !g.batch.on && !g.deck.busy && (g.mode === 'arm');
    // 按住回港：模式牌翻成「回港」，小表盘走满一秒
    // 按下去那一刻要在打捞那一屏（网在水里、冲洗时按着不算）；中途松手不算
    if (inp.bHeld && (this.quitHold !== null || (inp.b && g.mode === 'arm' && !g.castQ))) {
      this.quitHold = (this.quitHold || 0) + dt;
      const T1 = N('回港按住多久', 1);
      g.quitHold = Math.min(1, this.quitHold / T1); // 模式牌上那一圈（hudState 照 1 秒走满算）
      if (this.quitHold >= T1) { this.quitHold = null; g.quitHold = null; g.ui.learn('quit'); g.audio.play('menuGo'); this.requestEnd(null); }
    } else if (this.quitHold !== null) { this.quitHold = null; g.quitHold = null; }
    if (!idle) return;
    if (g.trip.fuel < MIN_NET_COST) this.requestEnd(T('收工·油不够'));
  }

  // 要收工了：甲板上还有泥包就先开冲，冲完再收
  requestEnd(why) {
    const g = this.g;
    if (g.trip.ended) return;
    if (g.deck.on && g.deck.filled > 0 && !g.batch.on) {
      this.endAfterBatch = why || true;
      if (g.mode === 'arm' && g.moment.canGo) g.moment.go();
      return;
    }
    if (g.batch.on) { this.endAfterBatch = why || true; return; }
    g.endTrip(why);
  }

  // 一甲板一起冲揭完：回到打捞那一屏接着捞（要收工的这时收）
  onBatchDone() {
    const g = this.g;
    g.batch.close();
    g.mode = 'arm';
    g.ui.setMode('arm');
    g.castQ = null;
    g.snap.refresh(true);
    if (this.endAfterBatch) {
      const why = this.endAfterBatch;
      this.endAfterBatch = false;
      g.later(0.8, () => g.endTrip(why === true ? null : why));
    }
  }

  // 收获单上：这一趟比上一趟多多少
  compare(total) {
    const prev = this.st.trips.length ? this.st.trips[this.st.trips.length - 1].total : null;
    return prev == null ? null : total - prev;
  }

  // 开舱清点完、按了「继续」：钱记进来、潮往前走一潮、存档；第一次先翻开债本，以后直接进船坞
  afterTally() {
    const g = this.g, st = this.st;
    st.money += g.trip.total;
    st.trips.push({ total: g.trip.total, n: g.trip.haul.length });
    st.tide++;
    if (g.trip.sawWreck) st.knowWreck = true;
    this.save();
    g.moment.on = false;
    g.deck.reset();
    this.toDock();
    if (!st.sawDebt) this.openLedger(true);
  }

  // —— 船坞 ——
  toDock() {
    const g = this.g;
    this.phase = 'dock';
    g.mode = 'dock';
    g.resetTrip();
    this.applyGear();
    g.deck.reset();
    g.moment.on = false;
    g.ui.setHud(false);
    g.crew.toPosts();
    g.audio.engine(false);
    g.audio.hush(0.85, 0.8);
    this.dock.moor();
    this.dock.sel = null;
    this.ui.showDock();
    g.ui.fade(false);
    g.cue('G03');
  }

  buy(kind) {
    const g = this.g, nx = this.next(kind);
    if (!nx) { g.audio.play('denyBlocked'); return false; }
    if (this.st.money < nx.price) { g.audio.play('denyFuel'); this.ui.deny(kind); return false; }
    this.st.money -= nx.price;
    this.st.gear[kind] = nx.level;
    this.save();
    g.audio.play('castLock');
    // 船员走过去装上：装上那一下船上的部件露出来、网圈变大
    this.dock.install(kind, nx.level, () => {
      if (kind === 'net') { setNetR(nx.value); g.boat.net.setR(nx.value); }
      if (kind === 'deck') g.deck.enable(nx.value > 0, nx.value || 5);
      g.audio.play('ribbon');
    });
    this.ui.refresh();
    return true;
  }

  // 出海：舱盖拉上那一下的浪声，黑一下，船在港外航路
  sail() {
    const g = this.g;
    if (this.phase !== 'dock') return;
    this.phase = 'leaving';
    this.ui.hide();
    g.audio.play('press');
    g.ui.fade(true);
    g.audio.hush(0.2, 0.5);
    g.audio.play('waveSwell');
    g.later(0.9, () => {
      this.beginTrip();
      g.ui.fade(false);
      if (g.bot && g.bot.tripStart) g.bot.tripStart();
    });
  }

  // —— 债本 ——
  page() { return DEBT[this.st.paid] || null; }
  get debtLeft() { return DEBT.slice(this.st.paid).reduce((s, p) => s + p.amount, 0); }
  openLedger(first = false) {
    const g = this.g;
    this.phase = 'ledger';
    g.mode = 'ledger';
    this.ui.showLedger(first);
    if (first) { this.st.sawDebt = true; this.save(); }
    g.audio.play('ribbon');
  }
  closeLedger() {
    const g = this.g;
    this.phase = 'dock';
    g.mode = 'dock';
    this.ui.hideLedger();
    this.ui.showDock();
  }
  pay() {
    const p = this.page();
    if (!p || this.st.money < p.amount) { this.g.audio.play('denyFuel'); return false; }
    this.st.money -= p.amount;
    this.st.paid++;
    this.save();
    this.g.audio.play('tallyTotal', { big: true });
    this.ui.showLedger(false, true);
    this.ui.refresh();
    return true;
  }

  // 船坞、债本这两屏每帧
  update(dt, inp) {
    const g = this.g;
    if (inp.any) g.audio.unlock();
    this.dock.update(dt);
    this.ui.update(dt, inp);
  }

  // 船坞、债本时的镜头
  camera(dt) {
    if (this.phase !== 'dock' && this.phase !== 'ledger' && this.phase !== 'leaving') return false;
    this.dock.camera(dt);
    return true;
  }

  // 暂停菜单（一趟里）
  pauseOpts() {
    // 船坞、债本里已经在港里：没有「回港」
    const inPort = this.phase === 'dock' || this.phase === 'ledger' || this.phase === 'leaving';
    return [{ k: 'resume', t: T('暂停·继续') }, ...(inPort ? [] : [{ k: 'end', t: T('暂停·回港') }]), { k: 'wobble' }, { k: 'volume' }, { k: 'look' }, { k: 'invert' }, { k: 'title', t: T('暂停·回到标题') }];
  }

  // 回到标题：一局留在存档里
  leave() {
    this.on = false;
    this.phase = null;
    this.dock.leave();
    this.ui.hide();
    this.ui.hideLedger();
    this.g.moment.on = false;
    this.g.moment.run = false;
  }

  // 三小段每一段叫什么（触屏暂停时挑段）
  segName(n) {
    return T(['段·第一趟', '段·船坞', '段·第二潮'][n - 1]);
  }

  // 直接从某一小段开始（试跑、手机上挑段看）：照这一局走到那里时的样子摆好
  //   1 第一趟：一局刚开始；2 船坞：第一趟捞完回来（钱照配表「演示·第一趟带回来的钱」）；3 第二潮：船坞里升过网、甲板、油箱
  preset(seg) {
    this.st = fresh();
    if (seg >= 2) { this.st.money = N('段·第一趟带回来的钱', 3600); this.st.tide = 2; this.st.trips = [{ total: this.st.money, n: 12 }]; this.st.knowWreck = true; this.st.sawDebt = seg >= 3; }
    if (seg >= 3) {
      for (const k of ['deck', 'net', 'tank']) { const nx = this.next(k); if (nx) { this.st.money -= nx.price; this.st.gear[k] = nx.level; } }
      this.st.money = Math.max(0, this.st.money);
    }
  }
}

// —— 船坞和债本的牌子（DOM，和收获单、暂停同一套铜铁面板、像素圆、小图）——
const GEAR_ICON = { net: 'net', tank: 'fuel', deck: 'deck', pump: 'pump' };

class RunUI {
  constructor(g, run) {
    this.g = g;
    this.run = run;
    this.root = g.ui.root;
    this.dockEl = null;
    this.bookEl = null;
    this.hot = null;
    this.selKeyT = 0;
  }

  hide() {
    if (this.dockEl) this.dockEl.remove();
    this.dockEl = null;
  }

  // 船坞一屏：左上地名，右上钱和债本，船上每一样设备一块牌子（钉在船上那一处），选中的那一样旁边一张卡，底下「出海」
  showDock() {
    this.hide();
    const R = this.run;
    const el = document.createElement('div');
    el.id = 'dock';
    const K = KEYS[this.g.ui.device];
    el.innerHTML = `<div class="dplace sh">${T('地名·船坞')}</div>
      <div class="purse panel"><span class="ic">${ICON.coin}</span><b class="mv"></b></div>
      <div class="book panel" data-k="book"><span class="ic">${ICON.book}</span><span>${T('船坞·债本')}</span>${key(K.quit, 'b')}</div>
      <div class="pins"></div>
      <div class="gcard panel"><div class="in"></div><i class="tail"></i></div>
      <div class="sail" data-k="sail">${key(K.go, 'go')}<span>${T('船坞·出海')}</span></div>`;
    const pins = el.querySelector('.pins');
    this.pins = {};
    for (const k of KINDS) {
      const p = document.createElement('div');
      p.className = 'pin';
      p.dataset.k = k;
      p.innerHTML = `<span class="ic">${ICON[GEAR_ICON[k]]}</span><span class="lv"></span><span class="pr"></span>`;
      pins.append(p);
      this.pins[k] = p;
    }
    this.root.append(el);
    this.dockEl = el;
    this.sel = R.dock.sel || null;
    this.refresh();
    void el.offsetWidth;
    el.classList.add('on');
  }

  // 一样设备这会儿的卡（一整块，贴在那一样的牌子正上方）：名字和几级、升了以后那一行（图标、哪一项、前后的数）、一句说明、购买和价钱
  cardHtml(kind) {
    const R = this.run, cur = R.row(kind), nx = R.next(kind);
    const val = (r) => (!r ? '' : kind === 'deck' && !(r.value > 0) ? T('设备数·deck0') : T('设备数·' + kind, { n: r.value }));
    const lv = `<span class="lvl">${T('船坞·级', { n: R.level(kind) })}</span>`;
    const head = `<span class="ic">${ICON[GEAR_ICON[kind]]}</span><span class="lab">${T('设备项·' + kind)}</span>`;
    let eff, act;
    if (nx) {
      eff = `<div class="eff">${head}<span class="a">${val(cur)}</span><span class="to">${ICON.arrow}</span><span class="b">${val(nx)}</span></div>`;
      const poor = R.st.money < nx.price;
      const K = KEYS[this.g.ui.device];
      act = `<div class="buy${poor ? ' poor' : ''}" data-k="buy">${key(K.aAlt || K.a, 'a')}<span>${T(poor ? '船坞·钱不够' : '船坞·购买')}</span><span class="price">${ICON.coin}${money(nx.price)}</span></div>`;
    } else {
      eff = `<div class="eff">${head}<span class="b">${val(cur)}</span></div>`;
      act = `<div class="buy max">${T('船坞·满级')}</div>`;
    }
    return `<div class="nm">${T('设备·' + kind)}${lv}</div>${eff}<div class="say">${TK('设备说明·' + kind)}</div>${act}`;
  }

  refresh() {
    const R = this.run, el = this.dockEl;
    if (!el) return;
    el.querySelector('.mv').textContent = money(R.st.money);
    for (const k of KINDS) {
      const p = this.pins[k], max = !R.next(k);
      p.querySelector('.lv').innerHTML = Array.from({ length: GEAR.filter((r) => r.kind === k).length }, (_, i) => `<i class="${i < R.level(k) ? 'f' : ''}"></i>`).join('');
      p.classList.toggle('max', max);
      p.classList.toggle('can', !max && R.st.money >= R.next(k).price);
      p.classList.toggle('on', this.sel === k);
      p.querySelector('.pr').innerHTML = max ? '' : `${ICON.coin}${money(R.next(k).price)}`;
    }
    const card = el.querySelector('.gcard');
    const was = card.dataset.k;
    card.classList.toggle('on', !!this.sel);
    if (this.sel) {
      card.querySelector('.in').innerHTML = this.cardHtml(this.sel);
      // 换了一样：卡从那一样的牌子上重新冒出来
      if (was !== this.sel) { card.dataset.k = this.sel; card.classList.remove('pop'); void card.offsetWidth; card.classList.add('pop'); }
    } else delete card.dataset.k;
  }

  deny(kind) {
    const b = this.dockEl && this.dockEl.querySelector('.buy');
    if (!b) return;
    b.classList.remove('shake');
    void b.offsetWidth;
    b.classList.add('shake');
    void kind;
  }

  // 卡贴在牌子正上方、和牌子对正；上面放不下、或者上面会压住别的牌子而下面不会，就挂到牌子正下方。
  // 卡底下一个小尖指着牌子，冒出来、收回去都在那一点
  placeCard(s, dt = 0) {
    const card = this.dockEl.querySelector('.gcard');
    const w = card.offsetWidth || 480, h = card.offsetHeight || 300;
    const PIN = 38, GAP = 26;
    const x = Math.max(40, Math.min(VIEW_W - w - 40, s.x - w / 2));
    const yUp = s.y - PIN - GAP - h, yDn = s.y + PIN + GAP + 30;
    // 上面：不出画面顶、不压左上地名和右上的钱、债本
    const upOk = yUp >= 16 && !((x < 360 && yUp < 120) || (x + w > 1400 && yUp < 128));
    const covers = (y) => {
      let n = 0;
      for (const k of KINDS) {
        if (k === this.sel) continue;
        const o = this.run.dock.screenAt(k);
        if (!o.on) continue;
        if (o.x + 46 > x && o.x - 46 < x + w && o.y + 80 > y && o.y - 46 < y + h) n++;
      }
      return n;
    };
    const cUp = upOk ? covers(yUp) : 99, cDn = covers(yDn);
    const want = cUp <= cDn ? 'up' : 'down';
    // 镜头慢慢绕着转，换边要稳住半秒，不来回跳
    if (!this.cardSide || this.cardFor !== this.sel || !upOk) { this.cardSide = upOk ? want : 'down'; this.cardFor = this.sel; this.sideT = 0; }
    else if (want !== this.cardSide) { this.sideT += dt; if (this.sideT > 0.5) { this.cardSide = want; this.sideT = 0; } }
    else this.sideT = 0;
    const below = this.cardSide === 'down';
    const y = below ? yDn : yUp;
    const tx = Math.max(28, Math.min(w - 28, s.x - x));
    card.classList.toggle('below', below);
    card.style.transform = `translate(${x.toFixed(0)}px, ${y.toFixed(0)}px)`;
    card.style.setProperty('--tx', tx.toFixed(0) + 'px');
  }

  select(k) {
    if (this.sel === k) return;
    this.sel = k;
    this.run.dock.sel = k;
    this.g.audio.play('menu');
    this.refresh();
  }

  // 指针在哪一块上（玩家的鼠标、自动演示的指针都照这个算）
  hit(P) {
    if (!P || !P.ok) return null;
    const st = document.getElementById('stage').getBoundingClientRect(), k = st.width / VIEW_W;
    const x = st.left + P.sx * k, y = st.top + P.sy * k;
    const els = document.elementsFromPoint ? document.elementsFromPoint(x, y) : [];
    for (const e of els) {
      const d = e.closest && e.closest('[data-k]');
      if (d && (this.dockEl && this.dockEl.contains(d) || this.bookEl && this.bookEl.contains(d))) return d.dataset.k;
      // 指着卡（卡上不是按钮的地方）：就是指着卡，不算指着卡底下压着的牌子
      if (e.closest && e.closest('#dock .gcard.on')) return 'card';
    }
    return null;
  }

  // 一块牌子在画面上哪一点（自动演示的指针挪过去点它）
  at(k) {
    const root = this.bookEl && this.bookEl.isConnected ? this.bookEl : this.dockEl;
    const e = root && root.querySelector(`[data-k="${k}"]`);
    if (!e) return null;
    const st = document.getElementById('stage').getBoundingClientRect(), r = e.getBoundingClientRect(), s = st.width / VIEW_W;
    return { x: (r.left + r.width / 2 - st.left) / s, y: (r.top + r.height / 2 - st.top) / s };
  }

  update(dt, inp) {
    const g = this.g, R = this.run;
    // 牌子钉在船上那一处
    if (this.dockEl) {
      for (const k of KINDS) {
        const s = R.dock.screenAt(k), p = this.pins[k];
        p.style.transform = `translate(${s.x.toFixed(0)}px, ${s.y.toFixed(0)}px)`;
        p.style.opacity = s.on ? '' : '0';
      }
      if (this.sel) this.placeCard(R.dock.screenAt(this.sel), dt);
    }
    if (R.phase === 'ledger') return this.ledgerInput(dt, inp);
    if (R.phase !== 'dock' || !this.dockEl) return;
    // 鼠标：指着哪块牌子就选哪一样；点「购买」买下；点「出海」「债本」
    const h = this.hit(inp.ptr);
    for (const e of this.dockEl.querySelectorAll('[data-k]')) e.classList.toggle('hot', e.dataset.k === h);
    // 指着另一块牌子停一下（0.12 秒）才换：从牌子挪到卡上的「购买」时划过别的牌子，卡不跟着换
    if (h && KINDS.includes(h) && h !== this.sel) {
      if (this.hoverK !== h) { this.hoverK = h; this.hoverT = 0; } else this.hoverT += dt;
      if (this.hoverT >= 0.12) this.select(h);
    } else this.hoverK = null;
    if (inp.click) {
      if (h && KINDS.includes(h)) { this.select(h); }
      else if (h === 'buy' && this.sel) R.buy(this.sel);
      else if (h === 'sail') return R.sail();
      else if (h === 'book') return R.openLedger(false);
    }
    // 键盘、手柄：左右换一样，空格（A）买下，E（Y）出海，Q（B）翻债本
    const d = g.menus.navX(inp, dt) || -g.menus.nav(inp, dt);
    if (d) {
      const i = this.sel ? KINDS.indexOf(this.sel) : -1;
      this.select(KINDS[(i + d + KINDS.length) % KINDS.length]);
    }
    if (inp.a && !inp.click && this.sel) R.buy(this.sel);
    if (inp.go) return R.sail();
    if (inp.b) return R.openLedger(false);
    if (inp.esc || inp.start) g.pauseRun();
  }

  // —— 债本：一大本账，翻开是这条船欠海的总数，和一页一页要还的数；这一页攒够了能还 ——
  // 四页并排摆成四张：页码、要还多少（数最大）、这一页攒到多少、还清以后开放哪片海（锁和地名；指着才亮出整句）
  showLedger(first, paid = false) {
    this.hideLedger(true);
    const R = this.run, p = R.page();
    const el = document.createElement('div');
    el.id = 'ledger';
    const K = KEYS[this.g.ui.device];
    const pages = DEBT.map((pg, i) => {
      const done = i < R.st.paid, cur = i === R.st.paid;
      const k = cur ? Math.min(1, R.st.money / pg.amount) : done ? 1 : 0;
      const unl = pg.unlock
        ? `<span class="ic">${ICON[done ? 'unlock' : 'lock']}</span><span class="pl">${pg.unlock}</span>`
        : `<span class="pl last">${T('债·最后一页').replace('，', '，<br>')}</span>`;
      const tip = pg.unlock ? (done ? T('债·已还清·这一版没做', { s: pg.unlock }) : T('债·还清以后', { s: pg.unlock })) : '';
      return `<div class="pg${done ? ' done' : ''}${cur ? ' cur' : ''}${paid && i === R.st.paid - 1 ? ' just' : ''}" data-k="pg${i + 1}">
        <span class="no">${T('债·第几页', { n: i + 1 })}</span>
        <span class="amt">${ICON.coin}<b>${money(pg.amount)}</b></span>
        <span class="bar"><i style="width:${(k * 100).toFixed(1)}%"></i></span>
        <span class="unl">${unl}</span>
        ${done ? `<span class="stamp">${T('债·已还清')}</span>` : ''}
        ${tip ? `<span class="tip">${tip}</span>` : ''}
      </div>`;
    }).join('');
    const can = p && R.st.money >= p.amount;
    el.innerHTML = `<div class="bk panel${paid ? ' still' : ''}">
      ${first ? `<div class="intro">${TK('债·初见')}</div>` : ''}
      <div class="h sh"><span class="ic">${ICON.book}</span>${T('债·标题')}</div>
      <div class="tot"><span class="lab">${T('债·总数')}</span><span class="num">${ICON.coin}<b>${money(R.debtLeft)}</b></span></div>
      <div class="pages">${pages}</div>
      <div class="foot"><span class="have">${T('债·手上')}<b>${ICON.coin}${money(R.st.money)}</b></span>
        ${p ? `<div class="pay${can ? '' : ' poor'}" data-k="pay">${key(K.aAlt || K.a, 'a')}<span>${can ? T('债·还') : T('债·差多少', { n: money(p.amount - R.st.money) })}</span></div>` : ''}
        <div class="close" data-k="close">${key(first ? K.go : K.quit, first ? 'go' : 'b')}<span>${first ? T('债·去船坞') : T('债·合上')}</span></div></div>
    </div>`;
    this.root.append(el);
    this.bookEl = el;
    this.first = first;
    this.bookT = paid ? 0.5 : 0;
    // 船坞那一屏的牌子、卡、按钮先收起来：翻开债本时只看债本
    if (this.dockEl) this.dockEl.classList.add('under');
    void el.offsetWidth;
    el.classList.add('on');
    if (paid) el.classList.add('paid');
  }

  // 合上：债本收回右上那块「债本」牌子里（swap：马上换一本新的，不收）
  hideLedger(swap = false) {
    const el = this.bookEl;
    this.bookEl = null;
    if (this.dockEl) this.dockEl.classList.remove('under');
    if (!el) return;
    if (swap) { el.remove(); return; }
    el.classList.add('out');
    el.style.pointerEvents = 'none';
    this.g.later(0.24, () => el.remove());
  }

  ledgerInput(dt, inp) {
    const R = this.run;
    this.bookT += dt;
    if (!this.bookEl || this.bookT < 0.5) return;
    const h = this.hit(inp.ptr);
    for (const e of this.bookEl.querySelectorAll('[data-k]')) e.classList.toggle('hot', e.dataset.k === h);
    if (inp.click && h === 'pay') return R.pay();
    if (inp.click && h === 'close') return R.closeLedger();
    if (inp.a && !inp.click) return R.pay();
    if (inp.b || inp.esc || inp.go) return R.closeLedger();
  }
}

export { KINDS, GEAR_SPOTS };

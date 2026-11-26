import * as THREE from 'three';
import { START } from '../world/layout.js';
import { VIEW_W, VIEW_H, NET_R } from '../config.js';
import { ICON } from '../ui/icons.js';
import { key, KEYS } from '../ui/hud.js';
import { toon } from '../render/materials.js';
import { GeoBuilder } from '../util/builder.js';
import { BOAT } from '../world/boat.js';
import { GEAR, DEBT } from './tables.js';
import { T, N } from './tables.js';
import { clamp, damp } from '../util/math.js';

// 回港以后的两屏（全游戏一份：第一段三小段第一次做；后面各片海、船队回港都走这里）。
// 开完舱 → 债本（一共欠多少、这一页要还多少、手里有多少；够了就还这一页）→ 船坞（船停在码头，点船上哪一样就升哪一样，
// 升完船上马上多一样）→ 出海（回到沉船旁，新的一潮）。
// 大数用「万」：屏幕上的数一眼读得出多少（信息.md「常驻在屏幕上的」）。

export function money(v) {
  v = Math.round(v);
  if (v >= 1e8) return (v / 1e8).toFixed(v % 1e8 ? 1 : 0).replace(/\.0$/, '') + T('数·亿');  // 表的 id，不是玩家看的
  if (v >= 1e5) return (Math.round(v / 1e3) / 10).toString().replace(/\.0$/, '') + T('数·万');  // 表的 id，不是玩家看的
  return v.toLocaleString('en-US');
}
// 债签上那种窄地方：一万以上都写成「万」（6万、90万、1200万）
function moneyShort(v) {
  v = Math.round(v);
  return v >= 1e4 ? (Math.round(v / 1e3) / 10).toString().replace(/\.0$/, '') + T('数·万') : v.toLocaleString('en-US');  // 表的 id，不是玩家看的
}
const coin = (v, cls = '') => `<span class="cn ${cls}">${ICON.coin}<b>${money(v)}</b></span>`;

const _v = new THREE.Vector3();
const _w = new THREE.Vector3();

export class Harbor {
  constructor(g) {
    this.g = g;
    this.mode = null;
    this.buildDebt();
    this.buildDock();
    this.buildPier();
  }

  // —— 债本 ——
  buildDebt() {
    const el = (this.debtEl = document.createElement('div'));
    el.id = 'debt';
    el.innerHTML = `<div class="book">
      <div class="pg l"><div class="seal">${ICON.anchor}</div><div class="h"></div><div class="who"></div><div class="k owe"></div><div class="big"></div><div class="slips"></div></div>
      <div class="pg r"><div class="k page"></div><div class="due"></div><div class="sea"></div><div class="prog"><div class="have"></div><div class="bar"><i></i></div></div><div class="pay plate"></div><div class="say"></div></div>
    </div><div class="next plate"></div>`;
    this.g.ui.root.append(el);
  }

  // 第一次开完舱就翻开；以后每次回港都先看一眼
  showDebt(first) {
    const g = this.g, E = this.debtEl;
    this.mode = 'debt';
    this.first = first;
    this.t = 0;
    this.debtEl.querySelector('.say').classList.remove('on');
    E.querySelector('.h').textContent = T('债本·标题');
    E.querySelector('.who').textContent = first ? T('债本·第一次') : '';
    E.querySelector('.owe').textContent = T('债本·一共欠');
    this.fillPage();
    const K = KEYS[g.ui.device];
    E.querySelector('.next').innerHTML = `${key(K.go, 'go')}<span>${T(this.backTo === 'dock' ? '债本·合上' : '债本·去船坞')}</span>`;
    E.classList.remove('flip');
    E.classList.remove('on');
    void E.offsetWidth;
    E.classList.add('on');
    g.audio.play('sheet');
    g.cue('H01');
  }

  fillPage() {
    const G = this.g.gear, E = this.debtEl, P = G.page;
    E.querySelector('.big').innerHTML = coin(G.owed, 'owe');
    // 左页底下一排：债本的每一页一张签，还了的盖章、这一页描金、后面的压暗（一眼看得出还到哪了）
    E.querySelector('.slips').innerHTML = DEBT.map((d, i) => {
      const st = i < G.paid ? 'paid' : i === G.paid ? 'cur' : 'lock';
      return `<div class="slip ${st}"><span class="pn">${d.page}</span><span class="cn">${ICON.coin}<b>${moneyShort(d.due)}</b></span>${st === 'paid' ? `<span class="st">${T('债本·已还')}</span>` : ''}</div>`;
    }).join('');
    if (!P) {
      E.querySelector('.page').textContent = T('债本·还清');
      E.querySelector('.due').innerHTML = '';
      E.querySelector('.sea').textContent = '';
      E.querySelector('.pay').style.display = 'none';
      return;
    }
    E.querySelector('.page').textContent = T('债本·第几页', { n: P.page });
    E.querySelector('.due').innerHTML = coin(P.due, 'due');
    E.querySelector('.sea').innerHTML = `<span class="k">${T('债本·还清以后')}</span><b>${P.sea}</b>`;
    // 手里的钱 / 这一页要还的，压在进度条上面：不另写「持有」
    E.querySelector('.have').innerHTML = `${coin(G.coins, G.coins >= P.due ? 'ok' : '')}<span class="of">/ ${money(P.due)}</span>`;
    E.querySelector('.bar i').style.width = (clamp(G.coins / P.due, 0, 1) * 100).toFixed(1) + '%';
    const pay = E.querySelector('.pay');
    pay.style.display = '';
    const ok = G.canRepay();
    pay.classList.toggle('off', !ok);
    pay.innerHTML = ok ? `<span>${T('债本·还这一页')}</span>${coin(P.due)}` : `<span>${T('债本·还差', { n: money(P.due - G.coins) })}</span>`;
  }

  debtInput(dt, inp) {
    const g = this.g, E = this.debtEl, P = inp.ptr;
    this.t += dt;
    const nextEl = E.querySelector('.next'), payEl = E.querySelector('.pay');
    const onNext = g.ui.overEl(nextEl, P), onPay = g.ui.overEl(payEl, P);
    nextEl.classList.toggle('hot', onNext);
    payEl.classList.toggle('hot', onPay && g.gear.canRepay());
    if (this.t < 0.6) return;
    if (inp.go || (inp.click && onNext)) return this.toDock();
    if (inp.click && onPay) {
      const sea = g.gear.page && g.gear.page.sea;
      if (g.gear.repay()) {
        g.audio.play('stamp');
        g.audio.play('coins');
        g.cam.shake(0.01 * g.wobbleK);
        E.classList.remove('flip');
        void E.offsetWidth;
        E.classList.add('flip');
        g.later(0.35, () => this.fillPage());
        // 还清这一页记着的那片海：海图上亮起来（这一版还没做那片海，说一句）
        this.sayIt(T('债本·开了', { sea }));
      } else {
        g.audio.play('denyBlocked');
        payEl.classList.remove('shake');
        void payEl.offsetWidth;
        payEl.classList.add('shake');
      }
    }
  }

  sayIt(text) {
    const s = this.debtEl.querySelector('.say');
    s.textContent = text;
    s.classList.remove('on');
    void s.offsetWidth;
    s.classList.add('on');
  }

  hideDebt() {
    this.debtEl.classList.remove('on');
  }

  // —— 码头（代码画的木栈桥，船坞时才摆出来）——
  buildPier() {
    const b = new GeoBuilder();
    const wood = new THREE.Color(0.52, 0.37, 0.24), dark = new THREE.Color(0.3, 0.21, 0.14), rope = new THREE.Color(0.7, 0.6, 0.42);
    const L = 22, W = 3.2, y = 1.05;
    // 桥面：一块块横铺的木板，颜色深浅交错
    for (let x = -L / 2; x < L / 2; x += 0.42) {
      const c = wood.clone().multiplyScalar(0.86 + 0.14 * Math.sin(x * 7.3) * Math.sin(x * 2.1));
      b.box(new THREE.Vector3(x + 0.2, y, 0), new THREE.Vector3(0.19, 0, 0), new THREE.Vector3(0, 0.07, 0), new THREE.Vector3(0, 0, W / 2), c);
    }
    // 桩：两排，往下扎进水里
    for (let x = -L / 2 + 0.4; x <= L / 2; x += 2.6) {
      for (const z of [-W / 2 + 0.2, W / 2 - 0.2]) b.cylinder(new THREE.Vector3(x, -5, z), new THREE.Vector3(x, y + 0.55, z), 0.17, 0.17, 7, dark);
    }
    // 系缆桩和一圈缆
    for (const x of [-6, 4]) {
      b.cylinder(new THREE.Vector3(x, y, -W / 2 + 0.5), new THREE.Vector3(x, y + 0.5, -W / 2 + 0.5), 0.14, 0.12, 7, new THREE.Color(0.18, 0.18, 0.2));
      b.cylinder(new THREE.Vector3(x, y + 0.08, -W / 2 + 0.5), new THREE.Vector3(x, y + 0.2, -W / 2 + 0.5), 0.2, 0.2, 7, rope, false);
    }
    // 几只木箱、一卷缆，看得出是码头
    b.box(new THREE.Vector3(7.5, y + 0.38, 0.6), new THREE.Vector3(0.38, 0, 0), new THREE.Vector3(0, 0.34, 0), new THREE.Vector3(0, 0, 0.38), wood.clone().multiplyScalar(0.8));
    b.box(new THREE.Vector3(8.3, y + 0.28, 0.9), new THREE.Vector3(0.3, 0, 0), new THREE.Vector3(0, 0.24, 0), new THREE.Vector3(0, 0, 0.3), wood.clone().multiplyScalar(0.7));
    const m = new THREE.Mesh(b.build(), toon({ vertexColors: true, wood: { w: 0.42, len: 3.2, seam: 0.85, grain: 1 } }));
    m.castShadow = m.receiveShadow = true;
    this.pier = new THREE.Group();
    this.pier.add(m);
    this.pier.visible = false;
    this.pier.name = 'pier';
    this.g.scene.add(this.pier);
  }

  // —— 船坞 ——
  buildDock() {
    const el = (this.dockEl = document.createElement('div'));
    el.id = 'dock';
    el.innerHTML = `<div class="money panel"><span class="v"></span></div>
      <div class="marks"></div>
      <div class="gpos"><div class="gcard panel"><div class="hd"><span class="nm"></span><span class="pips"></span></div><div class="chg"></div><div class="adds"></div><div class="buy plate"></div></div></div>
      <div class="foot"><div class="book plate"></div><div class="sail plate"></div></div>`;
    this.g.ui.root.append(el);
    this.marks = {};
    for (const id of Object.keys(GEAR)) {
      const m = document.createElement('div');
      m.className = 'mk';
      m.dataset.id = id;
      el.querySelector('.marks').append(m);
      this.marks[id] = m;
    }
  }

  toDock() {
    const g = this.g;
    if (this.mode === 'toDock') return;
    // 从船坞翻开的债本：合上回到船坞
    if (this.backTo === 'dock') {
      this.backTo = null;
      g.audio.play('press');
      this.hideDebt();
      this.mode = 'dock';
      this.t = 0;
      this.fillDock();
      this.dockEl.classList.add('on');
      return;
    }
    this.mode = 'toDock';
    g.audio.play('press');
    this.debtEl.querySelector('.next').classList.add('press');
    g.ui.fade(true);
    g.later(0.55, () => {
      this.hideDebt();
      g.tally.end();
      this.enterDock();
      g.ui.fade(false);
    });
  }

  enterDock() {
    const g = this.g, bc = g.boatCtl;
    this.mode = 'dock';
    g.mode = 'dock';
    this.t = 0;
    this.sel = null;
    // 船停进码头：港外那一片（开头出港的地方），船右舷贴着栈桥
    bc.reset(START.x, START.z, 0);
    bc.update(0.016, {}, 1, g.time);
    g.boat.root.updateMatrixWorld(true);
    this.pier.position.set(START.x, 0, START.z + 4.35);
    this.pier.visible = true;
    g.crew.toPosts();
    g.setCraneTip(BOAT.stowTip);
    g.arm.sync(BOAT.stowTip);
    g.boat.net.state.close = 0;
    g.boat.net.updateSkirt();
    // 镜头：慢慢绕着船转，看得见船上每一样（跟船的镜头先让出来）
    const cam = g.cam;
    g.chase.stop(cam);
    g.lookTo = null;
    // 舱里的机位（开舱清点用的那一个）放掉
    cam.alt.w = cam.altFrom = cam.altTo = 0;
    cam.altT = cam.altDur;
    cam.pitchT = 0.62;
    cam.distT = 23;
    cam.yawT = -0.55;
    this.orbit(0);
    cam.snapTo();
    g.ui.setHud(false);
    g.ui.place(T('地名·船坞'));
    g.audio.engine(false);
    g.audio.hush(0.7, 0.8);
    const E = this.dockEl, K = KEYS[g.ui.device];
    E.querySelector('.book').innerHTML = `${ICON.book}<span>${T('船坞·债本')}</span>`;
    E.querySelector('.sail').innerHTML = `${key(K.go, 'go')}<span>${T('船坞·出海')}</span>`;
    this.fillDock();
    E.classList.add('on');
    g.cue('H02');
  }

  fillDock() {
    const g = this.g, G = g.gear, E = this.dockEl;
    E.querySelector('.money .v').innerHTML = coin(G.coins);
    const pips = (id) => GEAR[id].levels.map((_, i) => `<i class="${i <= G.lv[id] ? 'f' : ''}"></i>`).join('');
    // 牌子：名字、几级（格子）、下一级多少钱（够了金色带个往上的箭头，不够灰的）；满级写满级
    for (const [id, m] of Object.entries(this.marks)) {
      const d = GEAR[id], n = G.next(id), can = G.canBuy(id);
      m.innerHTML = `<span class="nm">${d.name}</span><span class="pips">${pips(id)}</span>` + (n ? `<span class="pr">${coin(n.price)}</span>${can ? '<i class="up"></i>' : ''}` : `<span class="mx">${T('船坞·满级')}</span>`);
      m.classList.toggle('can', can);
      m.classList.toggle('sel', this.sel === id);
    }
    const W = E.querySelector('.gpos'), C = E.querySelector('.gcard');
    const id = this.sel;
    if (!!id !== C.classList.contains('on') || (id && W.dataset.id !== id)) {
      // 卡从那块牌子上长出来（换一样时重放一次）
      C.classList.remove('on');
      void C.offsetWidth;
      C.classList.toggle('on', !!id);
    }
    W.dataset.id = id || '';
    if (!id) return;
    const d = GEAR[id], cur = G.cur(id), n = G.next(id);
    C.querySelector('.nm').textContent = d.name;
    C.querySelector('.pips').innerHTML = pips(id);
    const icon = id === 'tank' ? ICON.fuel : ICON.ring;
    const fmt = (v) => `<span class="ii" title="${d.what}">${icon}</span><b>${v}</b>${d.unit ? `<small>${d.unit}</small>` : ''}`;
    C.querySelector('.chg').innerHTML = n ? `<span class="a">${fmt(cur.val)}</span><span class="arr">${ICON.arrow}</span><span class="b">${fmt(n.val)}</span>` : `<span class="b">${fmt(cur.val)}</span>`;
    C.querySelector('.adds').textContent = n ? n.adds : T('船坞·满级');
    const buy = C.querySelector('.buy');
    buy.style.display = n ? '' : 'none';
    if (n) {
      const ok = G.canBuy(id);
      buy.classList.toggle('off', !ok);
      buy.innerHTML = ok ? `<span>${T('船坞·升级')}</span>${coin(n.price)}` : `<span>${T('船坞·钱不够')}</span>${coin(n.price)}`;
    }
  }

  // 设备卡贴在选中的那块牌子上：卡的下沿就是牌子的下沿、对正它；出了画面才往里挪
  placeCard() {
    const W = this.dockEl.querySelector('.gpos');
    if (!this.sel) return;
    const p = this.markAt(this.sel), C = W.firstElementChild;
    const w = C.offsetWidth, h = C.offsetHeight;
    let x = clamp(p.x, w / 2 + 24, VIEW_W - w / 2 - 24);
    let y = clamp(p.y, h + 24, VIEW_H - 150);
    // 右上是手里的钱：卡别压上去
    if (x + w / 2 > VIEW_W - 380) y = Math.max(y, h + 160);
    W.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
    C.style.setProperty('--tip', `${clamp(p.x - x, -w / 2 + 30, w / 2 - 30).toFixed(1)}px`);
  }

  // 这一样设备在画面上哪一点（牌子挂在它上方）
  markAt(id) {
    const g = this.g;
    if (id === 'net') {
      g.boat.net.root.getWorldPosition(_v);
      _v.y += 1.9;
    } else {
      g.gear.anchor(id) && _v.copy(g.gear.anchor(id));
      g.boat.body.localToWorld(_v);
    }
    return g.project(_v);
  }

  dockInput(dt, inp) {
    const g = this.g, E = this.dockEl, P = inp.ptr;
    this.t += dt;
    this.orbit(dt);
    g.gear.update(dt);
    // 牌子跟着船上那一样走
    for (const [id, m] of Object.entries(this.marks)) {
      const p = this.markAt(id);
      m.style.transform = `translate(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px) translate(-50%, -100%)`;
      m.classList.toggle('hot', g.ui.overEl(m, P));
    }
    const sailEl = E.querySelector('.sail'), bookEl = E.querySelector('.book'), buyEl = E.querySelector('.buy');
    const onSail = g.ui.overEl(sailEl, P), onBook = g.ui.overEl(bookEl, P), onBuy = this.sel && g.ui.overEl(buyEl, P);
    sailEl.classList.toggle('hot', onSail);
    bookEl.classList.toggle('hot', onBook);
    buyEl.classList.toggle('hot', !!onBuy && g.gear.canBuy(this.sel));
    this.placeCard();
    if (this.t < 0.5 || this.mode !== 'dock') return;
    if (inp.go || (inp.click && onSail)) return this.sail();
    if (!inp.click) return;
    if (onBook) {
      g.audio.play('press');
      E.classList.remove('on');
      this.backTo = 'dock';
      this.showDebt(false);
      return;
    }
    if (onBuy) {
      const id = this.sel;
      if (g.gear.buy(id)) {
        g.audio.play('clank');
        g.audio.play('coins');
        g.cam.shake(0.008 * g.wobbleK);
        this.fillDock();
        const m = this.marks[id];
        m.classList.remove('pop');
        void m.offsetWidth;
        m.classList.add('pop');
      } else {
        g.audio.play('denyBlocked');
        buyEl.classList.remove('shake');
        void buyEl.offsetWidth;
        buyEl.classList.add('shake');
      }
      return;
    }
    // 点在卡上（按钮以外）：什么也不做（卡底下压着的那块牌子不算点到）
    const onCard = this.sel && g.ui.overEl(E.querySelector('.gcard'), P);
    if (onCard) return;
    for (const [id, m] of Object.entries(this.marks)) {
      if (g.ui.overEl(m, P)) {
        // 再点一下同一块牌子：卡收回去
        this.sel = this.sel === id ? null : id;
        g.audio.play('menu');
        this.fillDock();
        return;
      }
    }
    // 点在卡外面：卡收回牌子上
    if (this.sel) {
      this.sel = null;
      this.fillDock();
    }
  }

  // 镜头绕着船慢慢转；视点往画面左边让一点，船落在画面中间偏右（左边是设备卡）
  orbit(dt) {
    const cam = this.g.cam, bc = this.g.boatCtl;
    cam.yawT += dt * 0.05;
    const y = cam.yawT;
    cam.pivotT.set(bc.pos.x + Math.cos(y) * 6.5, 1.6, bc.pos.z - Math.sin(y) * 6.5);
  }

  // 出海：黑一下，回到沉船旁边（新的一潮）
  sail() {
    const g = this.g;
    if (this.mode !== 'dock') return;
    this.mode = 'sailing';
    g.mode = 'fading';
    g.audio.play('press');
    this.dockEl.querySelector('.sail').classList.add('press');
    g.ui.fade(true);
    g.audio.hush(0.3, 0.4);
    g.audio.play('waveSwell');
    g.later(0.7, () => {
      this.leave();
      g.moment.begin();
      g.ui.fade(false);
      if (g.bot && g.bot.sailed) g.bot.sailed();
    });
  }

  leave() {
    this.mode = null;
    this.dockEl.classList.remove('on');
    this.dockEl.querySelector('.sail').classList.remove('press');
    this.debtEl.querySelector('.next').classList.remove('press');
    this.hideDebt();
    this.pier.visible = false;
  }

  // 每帧（g.mode 是 debt / dock）
  update(dt, inp) {
    if (this.mode === 'debt') {
      this.debtInput(dt, inp);
      if (this.backTo === 'dock') this.orbit(dt);
    } else if (this.mode === 'dock') this.dockInput(dt, inp);
  }
}

export { VIEW_W, VIEW_H, N };

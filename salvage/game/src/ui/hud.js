// 界面：常驻的只有油、测深和「现在摇杆管什么」；其余用到时飞进来、用完收起来，暂停时全部出来。
// 数量用图标加数字，方向用箭头，进度用圈；字只留玩家这一刻要靠它做决定的。
import * as THREE from 'three';
import { FUEL_MAX, VIEW_W } from '../config.js';
import { ICON } from './icons.js';
import { installArt } from './pixelart.js';
import { markSprite, spotArrow, drawXBadge, drawWarnBadge, drawProg, PROG_N, drawQuit, QUIT_N } from './pixring.js';
import { clamp, lerp, easeOutBack } from '../util/math.js';
import { T } from '../game/tables.js';
import { rectClearOfBoat } from '../util/screen2d.js';

const h = (tag, cls, html) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html !== undefined) e.innerHTML = html;
  return e;
};

// 开船模式：开船、转镜头、进打捞；打捞模式：挪白圈、下网、退出（照样能开船）。
// a 是绿的（进打捞、下网、冲洗加快），b 是红的（退出、按住收工）；alt 是键盘上另一个也能按的键
export const KEYS = {
  kb: { move: 'WASD', look: '鼠标', aim: '鼠标', zoom: '滚轮', a: '左键', aAlt: '空格', b: '右键', bAlt: 'Esc', quit: 'Q', wash: '左键', menu: 'Esc', go: 'E' },
  pad: { move: '左摇杆', look: '右摇杆', aim: '右摇杆', zoom: 'LT/RT', a: 'A', b: 'B', quit: 'B', wash: 'A', menu: '☰', go: 'Y' },
};
export const key = (k, cls = '') => `<span class="key ${cls}">${k}</span>`;

// 数字一位一位滚：变了的那几位旧的滚出去、新的滚进来（往下减就从上面进来）
export function roll(el, v) {
  const nv = String(v);
  const ov = el.dataset.v;
  if (ov === nv) return;
  el.dataset.v = nv;
  if (ov === undefined) { el.textContent = nv; return; }
  const dir = Number(nv) < Number(ov) ? 'dn' : 'up';
  const n = Math.max(nv.length, ov.length);
  const a = ov.padStart(n, ' '), b = nv.padStart(n, ' ');
  let html = '';
  for (let i = 0; i < n; i++) {
    if (b[i] === ' ' && a[i] === ' ') continue;
    if (a[i] === b[i]) html += `<span class="d">${b[i]}</span>`;
    else html += `<span class="d r ${dir}"><i>${a[i] === ' ' ? '' : a[i]}</i><i>${b[i] === ' ' ? '' : b[i]}</i></span>`;
  }
  el.innerHTML = html;
}

// 收获飞进格子：走到全程的几成时落进格子
const LAND_AT = 0.94;
const smoother = (t) => t * t * t * (t * (t * 6 - 15) + 10);

// 蟹的金圈没了下文以后在原地留多久（等它接上灰圈：A18 金圈褪成灰）
const GHOST_T = 2.2;

// 跟着世界走的标记（臂端标签、方向箭头、进度圈、物件名牌）不压常驻的面板，也不出屏幕边：
// 左上地名、上方正中的自动演示牌、右上油量和收获、左下测深图、下方正中的模式条
const KEEP_OUT = [[0, 0, 440, 150], [790, 0, 1130, 110], [1340, 0, 1920, 240], [0, 800, 410, 1080], [430, 955, 1495, 1080]];
export function keepOut(x, y, w, h, extra) {
  x = Math.max(20, Math.min(1900 - w, x));
  y = Math.max(20, Math.min(1060 - h, y));
  const zones = extra ? KEEP_OUT.concat(Array.isArray(extra[0]) ? extra : [extra]) : KEEP_OUT;
  for (const [x0, y0, x1, y1] of zones) {
    if (x + w <= x0 || x >= x1 || y + h <= y0 || y >= y1) continue;
    // 往离得最近、又不出屏幕的那一边让开
    const c = [[0, y0 - (y + h)], [0, y1 - y], [x0 - (x + w), 0], [x1 - x, 0]]
      .filter(([dx, dy]) => x + dx >= 20 && x + dx + w <= 1900 && y + dy >= 20 && y + dy + h <= 1060)
      .sort((p, q) => Math.abs(p[0] + p[1]) - Math.abs(q[0] + q[1]))[0];
    if (c) { x += c[0]; y += c[1]; }
  }
  return [x, y];
}

const MODE = {
  sail: { n: '开船', ic: ICON.sail },
  arm: { n: '打捞', ic: ICON.arm },
  net: { n: '作业', ic: ICON.net },
  reveal: { n: '作业', ic: ICON.net },
};

export class UI {
  constructor(root, game) {
    this.root = root;
    this.g = game;
    this.device = 'kb';
    root.innerHTML = '';
    installArt();

    this.placeEl = h('div', 'sh', '<div class="bar"></div><div class="n"></div>');
    this.placeEl.id = 'place';
    this.fuelEl = h('div', 'panel', `<span class="fi">${ICON.fuel}</span><div class="track"><div class="fill"></div><div class="cost"></div><div class="glass"></div></div><b class="fv roll">0</b><span class="nl">${ICON.net}<b>0</b></span>`);
    this.fuelEl.id = 'fuel';
    // 货格：揭晓后只摆这一网收上来的（一件一格、格里是那件的小图，旁边是这一网的价值）；暂停时才看整趟（件数、总价值）
    this.tallyEl = h('div', 'panel', `<span class="net"><span class="slots"></span><span class="it">${ICON.coin}<b class="nv">+0</b></span></span><span class="trip"><span class="it"><span class="cell">${ICON.crate}</span><b class="n roll">0</b></span><span class="it">${ICON.coin}<b class="v">0</b></span></span>`);
    this.tallyEl.id = 'tally';
    this.modeEl = h('div', '', `<div class="why panel sh"></div><div class="chip"><span class="mi"></span><span class="mn"></span><canvas class="qr" width="${QUIT_N}" height="${QUIT_N}"></canvas><span class="qn"></span></div><div class="keys panel"></div>`);
    this.modeEl.id = 'modebar';
    this.tipEl = h('div', 'panel', `<span class="do"></span><span class="n">${ICON.crate}<b class="roll"></b></span><span class="c"><span class="fi">${ICON.fuel}</span><b></b></span><span class="x">${ICON.no}</span><span class="r"></span>`);
    this.tipEl.id = 'tip';
    this.sonarEl = h('div', 'panel', `<div class="t"><span class="di">${ICON.depth}</span><b class="sd">--</b><span class="u">米</span></div>`);
    this.sonarEl.id = 'sonar';
    this.cards = h('div');
    this.bigEl = h('div', '', `<div class="n"></div><br><div class="v">${ICON.coin}<b></b></div><div class="d"></div>`);
    this.bigEl.id = 'big';
    this.demoEl = h('div', 'panel', `<div class="dot"></div><span>自动演示</span>${key('Esc')}<span>接管</span>`);
    this.demoEl.id = 'demo';
    // 指针旁边的一句（没指着打捞点就点了这类）
    this.sayEl = h('div', 'panel');
    this.sayEl.id = 'say';
    this.sayT = 0;
    this.toastEl = h('div', 'panel sh');
    this.toastEl.id = 'toast';
    this.leadEl = h('div', '', `<div class="a">${ICON.arrow}</div>`);
    this.leadEl.id = 'lead';
    // 进度圈：铜边表盘，一圈 12 道刻度
    this.progEl = h('div');
    this.progEl.id = 'prog';
    this.progCv = document.createElement('canvas');
    this.progCv.width = this.progCv.height = PROG_N;
    this.progEl.append(this.progCv);
    this.progShown = null;
    // 下网预告的圈：金圈带得上来，灰圈打叉带不上来，淡圈够得着，橙圈会刮到硬东西
    this.marksEl = h('div');
    this.marksEl.id = 'marks';
    this.marksCv = document.createElement('canvas');
    this.marksCv.width = 640;
    this.marksCv.height = 360;
    this.marksCtx = this.marksCv.getContext('2d');
    this.marksEl.append(this.marksCv);
    this.markEls = new Map();
    this.hud = h('div');
    // 圈画在最底下：常驻的面板和字永远压在圈上面
    // 收获飞进格子的小图
    this.flyEl = h('div');
    this.flyEl.id = 'fly';
    // 甲板码包（小样）：右下一排格子 + 一直在的开冲键
    this.deckEl = h('div', 'panel', '<span class="cells"></span><span class="go"></span><span class="why panel"></span>');
    this.deckEl.id = 'deckbar';
    // 飞进总数牌的铜钱（一甲板一起冲）
    this.coinsEl = h('div');
    this.coinsEl.id = 'coins';
    this.coins = [];
    this.hud.append(this.marksEl, this.placeEl, this.fuelEl, this.tallyEl, this.sonarEl, this.leadEl, this.modeEl, this.cards, this.progEl, this.tipEl, this.bigEl, this.toastEl, this.sayEl, this.flyEl, this.deckEl, this.coinsEl);
    this.blackEl = h('div');
    this.blackEl.id = 'black';
    // 演示徽标不跟着界面藏：收获单、暂停菜单上也看得见是机器人在操作
    // 效果标签：每放一个效果，右下角写出它的编号和名字（game-tagged.html、effects.html）
    this.tagsEl = h('div');
    this.tagsEl.id = 'fxtags';
    root.append(this.hud, this.demoEl, this.blackEl, this.tagsEl);
    this.tagMap = new Map();
    this.sonar = new SonarView(this.sonarEl);
    this.toastT = 0;
    this.tallyT = 0;
    this.whyT = 0;
    this.tipWhyT = 0;
    this.placeT = 0;
    this.shown = { n: 0, v: 0 };
    this.demoEl.classList.add('gone');
    // 触屏上没有 Esc：演示牌只写「自动演示」（点一下是暂停，kit/hengping.js 管）
    if (window.HengPing && window.HengPing.touch) this.demoEl.classList.add('touch');
    this.mode = '';
    this.learned = {};
    this.hintKey = null;
    this.hudVisible = true;
    this.setHud(false);
  }

  setHud(on) {
    this.hudVisible = on;
    this.hud.style.display = on ? '' : 'none';
  }

  // G03 出发：油量、测深、模式条从各自的边上滑进来
  hudEnter() {
    const el = this.hud;
    el.classList.remove('enter');
    void el.offsetWidth;
    el.classList.add('enter');
    this.g.later(1.4, () => el.classList.remove('enter'));
  }

  // 收工：界面慢慢淡下去，留给那一眼整片海
  fadeHud(on) {
    this.hud.classList.toggle('fading', on);
  }

  setDevice(d) {
    if (d === this.device) return;
    this.device = d;
    this.hintKey = null;
  }

  setMode(mode) {
    if (mode === this.mode) return;
    this.mode = mode;
    const M = MODE[mode];
    if (M) {
      const chip = this.modeEl.querySelector('.chip');
      // 换了牌子：铜牌翻过来一下（作业→揭晓是同一块牌，不翻）
      if (chip.querySelector('.mn').textContent !== M.n) {
        chip.classList.remove('flip');
        void chip.offsetWidth;
        chip.classList.add('flip');
      }
      this.modeEl.querySelector('.mi').innerHTML = M.ic;
      this.modeEl.querySelector('.mn').textContent = M.n;
    }
    this.hintKey = null;
  }

  // 玩家自己做过一次的事，按键提示就收起来（机器人做的不算）
  learn(what) {
    if (this.g.bot) return;
    if (!this.learned[what]) { this.learned[what] = true; this.hintKey = null; this.learnedNow = true; }
  }

  // 第一次见到这个模式时，在模式条旁边给出这里要按的键
  hintHtml() {
    if (this.g.bot) return '';
    const K = KEYS[this.device];
    switch (this.mode) {
      case 'sail':
        return this.learned.sail ? '' : `<span>${key(K.move)}开船</span><span>${key(K.look)}转镜头</span><span>${key(K.a, 'a')}打捞</span>`;
      case 'arm':
        // 小样（挑一处按一下）：换一处、下网、开船、开冲
        if (this.g.moment && this.g.moment.on) return this.momentHints(K);
        return this.learned.arm ? '' : `<span>${key(K.aim)}挪白圈</span><span>${key(K.a, 'a')}下网</span><span>${key(K.b, 'b')}退出</span><span>${key(K.move)}照样开船</span>`;
      case 'net':
        return this.g.moment && this.g.moment.on ? this.momentHints(K) : '';
      case 'reveal':
        return this.learned.reveal || !this.washing ? '' : `<span>按住${key(K.wash, 'a')}冲洗加快</span>`;
      default:
        return '';
    }
  }

  // 小样：第一次给出这里要按的键，自己做过一样就收起一样（下网、开近、点下一处写在那一处的小牌上，开冲写在甲板那一排上，一直在）
  momentHints(K) {
    const L = this.learned, out = [];
    if (this.device === 'pad') {
      if (!L.arm) out.push([key(K.aim), '键·换一处'], [key(K.a, 'a'), '键·下网']);  // 表的 id，不是玩家看的
    } else {
      if (!L.arm) out.push([key(K.aim), '键·指着'], [key(K.a, 'a'), '键·下网']);  // 表的 id，不是玩家看的
      else if (!L.next && this.mode === 'net' && this.g.snap.spots.some((s) => !s.far && !this.g.snap.taken(s))) out.push([key(K.a, 'a'), '键·先点下一处']);  // 表的 id，不是玩家看的
    }
    if (this.mode === 'arm') {
      // 开船（照载具求生）：W 前进、S 刹车倒船，A D 转向；手柄一根左摇杆
      if (this.device === 'pad') { if (!L.wasd) out.push([key(K.move), '键·开船']); }  // 表的 id，不是玩家看的
      else {
        if (!L.wasd) out.push([key(T('键名·前后')), '键·前后']);  // 表的 id，不是玩家看的
        if (!L.steer) out.push([key(T('键名·左右')), '键·转向']);  // 表的 id，不是玩家看的
      }
    }
    if (!L.zoom) out.push([key(K.zoom), '键·远近']);  // 表的 id，不是玩家看的
    // 冲过一甲板以后：按住 Q 回港开舱（回过一次就收起）
    if (this.mode === 'arm' && !L.home && this.g.moment.decks > 0) out.push([T('键·按住') + key(K.quit, 'b'), '键·回港']);  // 表的 id，不是玩家看的
    return out.map(([k, t]) => `<span>${k}${T(t)}</span>`).join('');
  }

  // 指针在不在这块能点的东西上（机器人的指针也照这个算）
  over(what, P) {
    return this.overEl(what === 'go' ? this.deckEl.querySelector('.go') : document.querySelector('#result .again'), P);
  }

  // 指针在不在这一块界面上（债本、船坞的按钮也用它）
  overEl(el, P) {
    if (!P || !P.ok) return false;
    if (!el) return false;
    const st = document.getElementById('stage').getBoundingClientRect();
    const r = el.getBoundingClientRect(), k = st.width / VIEW_W;
    const x = P.sx * k + st.left, y = P.sy * k + st.top;
    return r.width > 0 && x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
  }

  // 指针旁边说一句
  say(text, x, y) {
    const el = this.sayEl;
    el.textContent = text;
    const w = el.offsetWidth, hh = el.offsetHeight;
    const [sx, sy] = keepOut(x + 34, y + 30, w, hh);
    el.style.transform = `translate(${Math.round(sx)}px, ${Math.round(sy)}px)`;
    el.classList.remove('on');
    void el.offsetWidth;
    el.classList.add('on');
    this.sayT = 1.6;
  }

  // 甲板那一排底下说一句（不是出错）：text 为 null 收起
  deckTip(text) {
    const el = this.deckEl;
    el.classList.toggle('tell', !!text);
    if (text) { el.classList.remove('deny'); el.querySelector('.why').textContent = text; }
    this.deckTellT = text ? 5 : 0;
  }

  renderKeys(paused) {
    const html = paused ? '' : this.hintHtml();
    const k = html + '|' + (this.armBad ? 1 : 0);
    if (k === this.hintKey) return;
    this.hintKey = k;
    const el = this.modeEl.querySelector('.keys');
    const prev = this.keysHtml || '';
    const tok = (this.keysTok = (this.keysTok || 0) + 1);
    const put = () => {
      el.classList.remove('learned');
      el.innerHTML = html;
      el.classList.toggle('gone', !html);
      this.keysHtml = html;
      // F01 这一排键第一次滑出来
      if (html && html !== prev && !this.g.bot) this.g.cue('F01');
      // 下不了网时，「下网」那一格变灰
      const a = el.querySelector('.key.a');
      if (a && this.mode === 'arm') a.parentElement.classList.toggle('off', !!this.armBad);
    };
    // F01 自己按过了：按的那个键亮一下、往下一按，这一排往左收进模式牌里，再换下一排（或者就收着）
    if (this.learnedNow && prev && !paused && html !== prev) {
      this.learnedNow = false;
      el.classList.add('learned');
      this.g.later(0.34, () => { if (tok === this.keysTok) put(); });
      return;
    }
    this.learnedNow = false;
    put();
  }

  place(name, o = {}) {
    this.placeEl.querySelector('.n').textContent = name;
    this.placeEl.classList.remove('on');
    this.placeEl.classList.toggle('big', !!o.big);
    void this.placeEl.offsetWidth;
    this.placeEl.classList.add('on');
    this.placeT = o.big ? 4.8 : 3.6;
  }

  // 甲板上码着的泥包，一包一格：cells 为 null 时收起；每格 { s: 'empty' 空位 | 'coming' 网正吊着往这儿来 | 'mud' 码着的泥包
  // | 'done' 冲开了（kind 是这一包最值钱的那件）| 'dud' 冲开是空的, star 压轴那一包 }。
  // 格子里是东西本身的小图（泥包、冲出来的那件），和货格、结算牌上的是同一套小图。batch：开冲中（开冲键收起来，格子跟着一包包翻开）
  deckBar(cells, canGo, batch) {
    const el = this.deckEl;
    const on = !!cells;
    // 和上面的油量栏一样宽（左右两边对齐）
    if (on && !this.fuelW) { this.fuelW = this.fuelEl.offsetWidth; if (this.fuelW) el.style.setProperty('--fuel-w', this.fuelW + 'px'); }
    el.classList.toggle('on', on);
    if (!on) return;
    el.classList.toggle('batch', !!batch);
    const box = el.querySelector('.cells');
    const thumbs = this.g.thumbs ? this.g.thumbs.get() : {};
    // 格子数变了（开冲时换成这一甲板要冲的那几包）：整排重摆
    if (!this.deckCells || this.deckCells.length !== cells.length) {
      box.innerHTML = '';
      this.deckCells = cells.map(() => {
        const c = box.appendChild(h('span', 'cell'));
        c.append(h('img', 'th'));
        return { el: c, k: '' };
      });
    }
    cells.forEach((C, i) => {
      const D = this.deckCells[i];
      const k = C.s + '|' + (C.kind || '') + '|' + (C.star ? 1 : 0);
      if (k === D.k) return;
      const was = D.k.split('|')[0];
      D.k = k;
      const c = D.el;
      c.className = 'cell ' + C.s + (C.star ? ' star' : '');
      const img = c.querySelector('img');
      const src = C.s === 'mud' || C.s === 'dud' ? this.g.thumbs.bundle() : C.s === 'done' ? thumbs[C.kind] : '';
      if (src) img.src = src; else img.removeAttribute('src');
      // 泥包落定：这一格「咚」一下；冲开：翻过来换成那件东西
      if (C.s === 'mud' && was !== 'mud' && was !== '') { void c.offsetWidth; c.classList.add('bump'); }
      if ((C.s === 'done' || C.s === 'dud') && was === 'mud') { void c.offsetWidth; c.classList.add('flip'); }
    });
    const gk = this.device;
    if (gk !== this.deckGoKey) {
      this.deckGoKey = gk;
      el.querySelector('.go').innerHTML = `${key(KEYS[this.device].go, 'go')}${T('键·开冲')}`;
    }
    el.querySelector('.go').classList.toggle('off', !canGo);
    el.querySelector('.go').classList.toggle('hot', !!canGo && !this.paused && this.over('go', this.g.input.state.ptr));
  }

  // 甲板这一排上按了没用（甲板空着就按开冲）：开冲键抖一下，底下挂一句原因
  deckDeny(text) {
    const el = this.deckEl;
    el.querySelector('.why').textContent = text;
    el.classList.remove('deny', 'tell');
    this.deckTellT = 0;
    void el.offsetWidth;
    el.classList.add('deny');
    this.deckWhyT = 1.6;
  }

  // 出了岔子才说一句，弹一下就收
  toast(text, dur = 2.2) {
    this.toastEl.textContent = text;
    this.toastEl.classList.add('on');
    this.toastT = dur;
  }

  // 经过一块线索船板：箭头「咔」地一下转过去
  leadSnap() {
    const a = this.leadEl.querySelector('.a');
    this.leadEl.classList.remove('snap');
    void this.leadEl.offsetWidth;
    this.leadEl.classList.add('snap');
    this.g.later(0.5, () => this.leadEl.classList.remove('snap'));
    return a;
  }

  // 这时候按了没用：模式条抖一下，说原因
  deny(text) {
    const w = this.modeEl.querySelector('.why');
    w.textContent = text;
    w.classList.add('on');
    this.whyT = 1.4;
    const c = this.modeEl.querySelector('.chip');
    c.classList.remove('shake');
    void c.offsetWidth;
    c.classList.add('shake');
  }

  // 白圈旁的小牌子摆在哪：默认在白圈右边（靠右边缘时左边）。那一处压着自己的船（船身外轮廓、吊臂）时，
  // 绕着白圈换一个方向：只挑牌子不压船、不出屏幕、不压常驻牌子的，离默认方向越近越好；上一帧挪到的那边还行就待着。
  // 白圈不受遮挡（穿过船身也画出来），牌子也一直在：绕一圈都压着船时，往外找一处不压船的地方，再没有就留在默认那一处
  tipBeside(T, x0, y0, w, hh, gap) {
    const B = T.boat;
    if (!B) return [x0, y0];
    // 别的打捞点的箭头也不压：玩家还要看着它们挑下一处
    const clear = (x, y) => !(T.arrows || []).some((a) => x < a.x + 26 && x + w > a.x - 26 && y < a.y1 + 6 && y + hh > a.y0 - 6);
    const ok = (x, y, m) => clear(x, y) && x >= 20 && x + w <= 1900 && y >= 20 && y + hh <= 1060 && rectClearOfBoat(B, x, y, w, hh, m) && keepOut(x, y, w, hh).every((v, i) => Math.abs(v - [x, y][i]) < 0.5);
    // 默认那一处不压船（从别处回来时要多让出一截，免得在边上来回换）
    if (ok(x0, y0, this.tipAng != null ? 24 : 10)) { this.tipAng = null; return [x0, y0]; }
    const at = (a, d) => {
      const c = Math.cos(a), s = Math.sin(a);
      const ax = T.x + c * d, ay = T.y + s * d;
      return [c > 0.38 ? ax : c < -0.38 ? ax - w : ax - w / 2, s > 0.38 ? ay : s < -0.38 ? ay - hh : ay - hh / 2];
    };
    const base = x0 < T.x ? Math.PI : 0;
    const dA = (a, b) => Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b)));
    // 试的方向：绕着白圈一圈 16 个方向
    const dirs = Array.from({ length: 16 }, (_, i) => (i / 16) * Math.PI * 2);
    if (this.tipAng != null && dirs.some((a) => dA(a, this.tipAng) < 0.3)) {
      const p = at(this.tipAng, gap);
      if (ok(p[0], p[1], 10)) return p;
    }
    let best = null;
    for (const a of dirs) {
      const p = at(a, gap);
      if (!ok(p[0], p[1], 10)) continue;
      const sc = dA(a, base);
      if (!best || sc < best.sc) best = { a, p, sc };
    }
    if (best) { this.tipAng = best.a; return best.p; }
    this.tipAng = null;
    // 从白圈往外找最近一处不压船的地方
    for (let d = gap + 24; d < gap + 260; d += 24) for (let i = 0; i < 16; i++) {
      const a = base + (i % 2 ? 1 : -1) * Math.ceil(i / 2) * (Math.PI / 8);
      const p = at(a, d);
      if (ok(p[0], p[1], 10)) return p;
    }
    return [x0, y0];
  }

  // 小牌上写的：这一处按哪个键、按了是什么
  actHtml(act) {
    const K = KEYS[this.device];
    if (act === 'cast') return `${key(K.a, 'a')}${T('键·下网')}`;  // 表的 id，不是玩家看的
    if (act === 'next') return `${key(K.a, 'a')}${T('键·下一处')}`;  // 表的 id，不是玩家看的
    if (act === 'drop') return `${key(K.a, 'b')}${T('键·不要下一处')}`;  // 表的 id，不是玩家看的
    if (act === 'far') return `${key(K.move)}${T('键·开近')}`;  // 表的 id，不是玩家看的
    return '';
  }

  tipDeny(text) {
    this.tipWhy = text;
    this.tipWhyT = 2.4;
    this.tipEl.classList.remove('shake');
    void this.tipEl.offsetWidth;
    this.tipEl.classList.add('shake');
  }

  // 下网：油表上预告的那一截「咔」地扣掉——那一截白一下、断开、往下掉
  fuelSnap(f0, cost) {
    const tr = this.fuelEl.querySelector('.track');
    const W = tr.clientWidth;
    const c = Math.min(cost, f0);
    const el = h('i', 'snap');
    el.style.left = Math.round(tr.offsetLeft + 9 + ((f0 - c) / FUEL_MAX) * W) + 'px';
    el.style.top = Math.round(tr.offsetTop + 3) + 'px';
    el.style.width = Math.max(6, Math.round((c / FUEL_MAX) * W)) + 'px';
    this.fuelEl.append(el);
    this.g.later(0.7, () => el.remove());
    this.fuelEl.classList.remove('snapped');
    void this.fuelEl.offsetWidth;
    this.fuelEl.classList.add('snapped');
  }

  tag(id, name, tier, refresh, ritual) {
    let T = this.tagMap.get(id);
    if (T && refresh) { T.t = Math.max(T.t, 1.6); return; }
    if (T) T.el.remove();
    const el = h('div', 'tg t' + ({ 轻: 1, 中: 2, 重: 3, 最重: 4 }[tier] || 1), `<b>${id}</b>${name}${ritual ? '<i>仪式感</i>' : ''}`);
    this.tagsEl.append(el);
    T = { el, t: tier === '轻' ? 2.0 : 2.8 };
    this.tagMap.set(id, T);
    while (this.tagsEl.children.length > 7) {
      const first = this.tagsEl.firstChild;
      for (const [k, v] of this.tagMap) if (v.el === first) this.tagMap.delete(k);
      first.remove();
    }
  }

  tagTick(dt) {
    for (const [k, T] of this.tagMap) {
      T.t -= dt;
      if (T.t <= 0.4) T.el.classList.add('out');
      if (T.t <= 0) { T.el.remove(); this.tagMap.delete(k); }
    }
  }

  // anim：接管时往上收起来再藏
  demoBadge(on, anim = false) {
    const el = this.demoEl;
    if (on || !anim || el.classList.contains('gone')) { el.classList.remove('out'); el.classList.toggle('gone', !on); return; }
    el.classList.add('out');
    this.g.later(0.4, () => { el.classList.add('gone'); el.classList.remove('out'); });
  }

  fade(on) {
    this.blackEl.classList.toggle('on', on);
  }

  itemCard(def) {
    const v = def.value != null ? `<span class="v">${ICON.coin}${def.value}</span>` : '';
    // 货签：牛皮纸签子，左边一个铜签孔
    const el = h('div', 'card' + (def.precious ? ' p' : ''), `<i class="eye"></i><span class="nm">${def.name}</span>${v}`);
    this.cards.append(el);
    return el;
  }

  // 大标题：size 不写是银币匣那一档（最大、带卷草）；mid 是每一网的主物（小一号）；dud 是空网（灰、没有价值）。
  // desc：底下一行它的来历，价值挂上以后才出
  bigTitle(o) {
    if (!o) {
      // 价值的红绸跟着整块一起淡出，不往回缩进名字里
      this.bigEl.classList.remove('on');
      return;
    }
    // 名字上面再叠一层同样的字，扫一道亮光过去；later：价值等一拍再挂上（bigValue）
    this.bigEl.querySelector('.n').innerHTML = `${o.name}<i class="gl">${o.name}</i>`;
    this.bigEl.querySelector('.v b').textContent = o.value ?? '';
    this.bigEl.querySelector('.d').textContent = o.desc || '';
    this.bigEl.classList.toggle('mid', o.size === 'mid');
    this.bigEl.classList.toggle('dud', o.size === 'dud');
    this.bigEl.classList.toggle('val', !o.later && o.value != null);
    // 重新落一次（上一网的标题刚淡完也照样从头落下来）
    this.bigEl.classList.remove('on');
    void this.bigEl.offsetWidth;
    this.bigEl.classList.add('on');
  }

  // 红绸挂上价值
  bigValue() {
    this.bigEl.classList.add('val');
  }

  // 大字（名字、价值、来历）在画面上占着的那一块（画面逻辑像素）：揭晓时伴随物的签不往这儿挂。
  // 来历那一行是整行宽的块，量它里面字的那一段
  bigBox() {
    const b = this.bigEl;
    if (!b.classList.contains('on')) return null;
    const st = document.getElementById('stage').getBoundingClientRect();
    const k = st.width / VIEW_W;
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const e of b.querySelectorAll('.n, .v, .d')) {
      if (!e.textContent.trim()) continue;
      const r = document.createRange();
      r.selectNodeContents(e);
      const q = e.classList.contains('d') ? r.getBoundingClientRect() : e.getBoundingClientRect();
      if (!q.width) continue;
      x0 = Math.min(x0, (q.left - st.left) / k);
      y0 = Math.min(y0, (q.top - st.top) / k);
      x1 = Math.max(x1, (q.right - st.left) / k);
      y1 = Math.max(y1, (q.bottom - st.top) / k);
    }
    return x0 < x1 ? [x0 - 12, y0 - 12, x1 + 12, y1 + 12] : null;
  }

  // 收获：这一网收上来的每一件飞进右上角自己的那一格，旁边的价值一件一件加上去（加完就是这一网签上的数之和），过一会儿收起
  haulFeed(entries, trip) {
    if (!entries.length) return;
    // 这一趟第一次进账：货格子第一次放下来，多停一拍，落定时「咚」
    const first = trip.haul.length === entries.length;
    const slots = this.tallyEl.querySelector('.slots');
    slots.innerHTML = '';
    this.netCells = entries.map(() => slots.appendChild(h('span', 'cell')));
    this.netV = 0;
    this.nvShown = 0;
    this.tallyEl.querySelector('.nv').textContent = '+0';
    this.tallyEl.classList.remove('first');
    void this.tallyEl.offsetWidth;
    this.tallyEl.classList.add('on');
    if (first) {
      this.tallyEl.classList.add('first');
      this.g.audio.play('tallyDrop', { at: 0.42 });
      this.g.cue('F02');
    }
    this.tallyT = (first ? 5.4 : 3.6) + entries.length * 0.17;
    this.flyIn(entries, first ? 0.45 : 0);
  }

  // 收上来的每一件：从甲板上它在的地方飞进货格里它自己的那一格，落进去「嗒」一声、格子跳一下、价值加上它那一份。
  // 一条连贯的弧线：先轻轻弹起来、往上抛，划一道弧落进格子，起步和落下都是缓的；每一帧按游戏时间算位置（慢放、逐帧录像对得上），
  // 位置和大小都是连续变的（以前每秒 30 格、三像素一跳、大小一档一档地跳，看着一卡一卡）。小图还是像素画（最近邻放大）
  flyIn(entries, wait = 0) {
    const thumbs = this.g.thumbs ? this.g.thumbs.get() : {};
    const g = this.g;
    this.flies = this.flies || [];
    entries.forEach((e, i) => {
      const cell = this.netCells[i];
      // 目标：这一格在 1920×1080 里的位置（面板滑进来以后的落点，不算滑动的位移）
      const net = this.tallyEl.querySelector('.net');
      const tx = this.tallyEl.offsetLeft + net.offsetLeft + cell.offsetLeft + cell.offsetWidth / 2;
      const ty = this.tallyEl.offsetTop + net.offsetTop + cell.offsetTop + cell.offsetHeight / 2;
      let sx = 960 + (i - (entries.length - 1) / 2) * 70, sy = 640;
      const grp = e.it && e.it.model && e.it.model.group;
      if (grp && this.g.project) {
        const s = this.g.project(grp.getWorldPosition(new THREE.Vector3()));
        if (s.x > 0 && s.x < 1920 && s.y > 0 && s.y < 1080) { sx = s.x; sy = s.y - 30; }
      }
      const img = h('img', 'fl');
      if (thumbs[e.kind]) img.src = thumbs[e.kind];
      img.style.opacity = '0';
      this.flyEl.append(img);
      const dur = 0.95, delay = wait + 0.15 + i * 0.17;
      // 弧线（三次贝塞尔）：从甲板上那件东西起，先往上抛（第一个控制点在它正上方），再从格子上方落进去
      const lift = Math.min(260, Math.max(150, (sy - ty) * 0.45));
      const P = [[sx, sy], [sx + (tx - sx) * 0.12, sy - lift], [tx - (tx - sx) * 0.18, Math.min(sy, ty) - 150], [tx, ty]];
      this.flies.push({ img, P, t: -delay, dur, big: !!e.def.precious, done: false });
      // 落进格子：按游戏时间算。落一件「嗒」一声，一件比一件高
      g.later(delay + dur * LAND_AT, () => {
        if (this.netCells[i] !== cell) return;
        const t = h('img', 'th');
        if (thumbs[e.kind]) t.src = thumbs[e.kind];
        cell.append(t);
        cell.classList.toggle('p', !!e.def.precious);
        cell.classList.remove('bump');
        void cell.offsetWidth;
        cell.classList.add('bump');
        this.netV += e.def.value || 0;
        g.audio.play('fly', { i });
        if (i === 0) g.cue('B19');
      });
    });
  }

  // 一枚铜钱带着「+v」从画面上 from 那一点（东西身上）飞进 toEl（总数牌上的铜钱），落进去时 onLand。
  // 先往上弹起来、划一道弧落进去；每帧按游戏时间走（暂停时停在半空，慢放、逐帧录像对得上）
  coinFly(from, toEl, v, big, onLand) {
    const el = h('div', 'coin' + (big ? ' big' : ''), `${ICON.coin}<b>+${v}</b>`);
    el.style.opacity = '0';
    this.coinsEl.append(el);
    this.coins.push({ el, from, toEl, t: 0, dur: big ? 0.65 : 0.6, big, onLand });
  }

  updateCoins(dt) {
    if (!this.coins.length) return;
    const st = document.getElementById('stage').getBoundingClientRect();
    const k = st.width / VIEW_W;
    for (const C of this.coins) {
      C.t += dt;
      const u = Math.min(1, C.t / C.dur);
      const r = C.toEl.getBoundingClientRect();
      const tx = (r.left + r.width / 2 - st.left) / k, ty = (r.top + r.height / 2 - st.top) / k;
      const [sx, sy] = [C.from.x, C.from.y];
      const e = smoother(u);
      const lift = Math.min(220, Math.max(110, Math.abs(sy - ty) * 0.35));
      const a = 1 - e;
      // 弧线不出画面上沿（起点、总数牌都在上半屏时只往上抬一点）
      const P1 = [sx + (tx - sx) * 0.1, Math.max(60, sy - lift)], P2 = [tx - (tx - sx) * 0.2, Math.max(ty + 20, Math.min(sy, ty) - lift * 0.5)];
      const x = a * a * a * sx + 3 * a * a * e * P1[0] + 3 * a * e * e * P2[0] + e * e * e * tx;
      const y = a * a * a * sy + 3 * a * a * e * P1[1] + 3 * a * e * e * P2[1] + e * e * e * ty;
      // 冒出来弹大一下，飞近了缩进铜钱里
      const pop = easeOutBack(clamp(u / 0.18, 0, 1));
      const sc = u < 0.18 ? 0.4 + 0.75 * pop : lerp(1.15, 0.55, smoother(clamp((u - 0.6) / 0.4, 0, 1)));
      C.el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(-50%, -50%) scale(${sc.toFixed(3)})`;
      C.el.style.opacity = u > 0.85 ? ((1 - u) / 0.15).toFixed(2) : '1';
      if (u >= 1) { C.done = true; C.el.remove(); if (C.onLand) C.onLand(); }
    }
    this.coins = this.coins.filter((C) => !C.done);
  }

  clearCoins() {
    for (const C of this.coins) C.el.remove();
    this.coins = [];
  }

  // 飞着的小图：每帧按游戏时间挪一点
  updateFlies(dt) {
    if (!this.flies || !this.flies.length) return;
    for (const F of this.flies) {
      F.t += dt;
      if (F.t < 0) continue;
      const t = F.t / F.dur;
      // 到格子里那一刻（LAND_AT）格子里的小图接上，飞的这张收掉
      if (t >= LAND_AT) { F.done = true; F.img.remove(); continue; }
      // 走过多少路：起步缓（这时在弹起来）、中间快、落进去前缓下来
      const u = smoother(t / LAND_AT);
      const [p0, p1, p2, p3] = F.P;
      const a = 1 - u;
      const x = a * a * a * p0[0] + 3 * a * a * u * p1[0] + 3 * a * u * u * p2[0] + u * u * u * p3[0];
      const y = a * a * a * p0[1] + 3 * a * a * u * p1[1] + 3 * a * u * u * p2[1] + u * u * u * p3[1];
      // 大小（格子里那张是 72）：冒出来、弹大一下，抛着时大一点，落进去时正好是格子里的大小
      const pop = easeOutBack(clamp(t / 0.16, 0, 1));
      const peak = F.big ? 1.62 : 1.36, fly = F.big ? 1.3 : 1.12;
      const k = t < 0.16 ? 0.3 + (peak - 0.3) * pop : lerp(peak, fly, smoother(clamp((t - 0.16) / 0.3, 0, 1))) + (1 - fly) * smoother(clamp((t - 0.55) / (LAND_AT - 0.55), 0, 1));
      const w = Math.max(8, Math.round(72 * k));
      F.img.style.width = F.img.style.height = w + 'px';
      F.img.style.transform = `translate(${Math.round(x - w / 2)}px, ${Math.round(y - w / 2)}px)`;
      F.img.style.opacity = t < 0.03 ? String(t / 0.03) : '1';
    }
    this.flies = this.flies.filter((F) => !F.done);
  }

  // 效果页：所有临时的牌子、字、圈、箭头都收掉
  resetAll() {
    this.resetTally();
    this.clearCoins();
    this.cards.innerHTML = '';
    this.bigTitle(null);
    this.toastEl.classList.remove('on');
    this.toastT = 0;
    this.modeEl.querySelector('.why').classList.remove('on');
    this.whyT = 0;
    this.placeEl.classList.remove('on');
    this.placeT = 0;
    this.tipWhyT = 0;
    this.sayT = 0;
    this.sayEl.classList.remove('on');
    this.deckTip(null);
    this.spots = this.trail = null;
    this.drawMarks(null);
    this.leadEl.classList.remove('on');
    this.progEl.classList.remove('on');
    this.quitShow(0, true);
    this.nlShown = null;
    this.fvShown = null;
    this.hintKey = null;
    this.tagsEl.innerHTML = '';
    this.tagMap.clear();
  }

  resetTally() {
    this.shown = { n: 0, v: 0 };
    this.flyEl.innerHTML = '';
    this.flies = [];
    this.tallyEl.querySelector('.slots').innerHTML = '';
    this.netCells = [];
    this.netV = 0;
    this.nvShown = 0;
    this.tallyT = 0;
    this.tallyEl.classList.remove('on', 'first');
  }

  setPaused(on) {
    this.paused = on;
    this.root.classList.toggle('paused', on);
    this.hintKey = null;
  }

  // 收工：按住 B 时模式牌翻成「收工」，牌上的小表盘一格一格走满；松手就退回去、翻回原来的牌
  quitShow(q, snap = false) {
    const prev = this.quitV || 0;
    this.quitV = q;
    const chip = this.modeEl.querySelector('.chip');
    const on = q > 0;
    if (on !== chip.classList.contains('quit')) {
      chip.classList.toggle('quit', on);
      // 三小段里（打捞模式按住 Q）是回港开舱；原来那一整趟（开船按住 B）是收工
      if (on) chip.querySelector('.qn').textContent = T(this.g.mode === 'arm' ? '模式·回港' : '模式·收工');  // 表的 id，不是玩家看的
      if (!snap) { chip.classList.remove('flip'); void chip.offsetWidth; chip.classList.add('flip'); }
    }
    const key = Math.round(q * 40);
    if (on && (key !== this.quitKey || !prev)) { this.quitKey = key; drawQuit(this.modeEl.querySelector('.qr'), q); }
  }

  update(dt, s) {
    this.updateFlies(dt);
    this.updateCoins(dt);
    // 场景放大三倍时整张画面挪了几分之一个像素（镜头平滑地移，像素格跟着滑）：屏幕上格线在 3k + gx、3k + gy
    this.gx = s.grid ? -3 * s.grid.x : 0;
    this.gy = s.grid ? 3 * s.grid.y : 0;
    // 收工圈：按住时跟着走，松手以后倒着退回去（四分之一秒退完）
    const q = s.quit > 0 ? s.quit : Math.max(0, (this.quitV || 0) - dt * 4);
    if (q !== (this.quitV || 0)) this.quitShow(q);
    // 冲洗加快的提示只在还在冲的时候给；玩家按住加快过一次就收起
    this.washing = this.mode === 'reveal' && (!!s.prog || !!s.batchWash);
    if (this.washing && ((s.prog && s.prog.fast) || (s.batchWash && s.batchWash.fast))) this.learn('reveal');
    if (this.placeT > 0) {
      this.placeT -= dt;
      if (this.placeT <= 0) this.placeEl.classList.remove('on');
    }
    if (this.toastT > 0) {
      this.toastT -= dt;
      if (this.toastT <= 0) this.toastEl.classList.remove('on');
    }
    if (this.sayT > 0) {
      this.sayT -= dt;
      if (this.sayT <= 0) this.sayEl.classList.remove('on');
    }
    if (this.deckTellT > 0) {
      this.deckTellT -= dt;
      if (this.deckTellT <= 0) this.deckEl.classList.remove('tell');
    }
    if (this.deckWhyT > 0) {
      this.deckWhyT -= dt;
      if (this.deckWhyT <= 0) this.deckEl.classList.remove('deny');
    }
    if (this.whyT > 0) {
      this.whyT -= dt;
      if (this.whyT <= 0) this.modeEl.querySelector('.why').classList.remove('on');
    }
    if (this.tallyT > 0) {
      this.tallyT -= dt;
      if (this.tallyT <= 0) this.tallyEl.classList.remove('on');
    }
    if (!this.hudVisible) return;
    // 油：图标 + 条 + 数（显示的数就是能用的整数，和每一网的作业油直接比）
    const f = s.fuel;
    const fv = Math.floor(f + 1e-6);
    if (fv !== this.fvShown) { roll(this.fuelEl.querySelector('.fv'), fv); this.fvShown = fv; }
    this.fuelEl.querySelector('.fill').style.width = (f / FUEL_MAX) * 100 + '%';
    const cost = this.fuelEl.querySelector('.cost');
    if (s.cost != null) {
      const c = Math.min(s.cost, f);
      cost.style.left = ((f - c) / FUEL_MAX) * 100 + '%';
      cost.style.width = (c / FUEL_MAX) * 100 + '%';
      cost.classList.add('on');
      cost.classList.toggle('poor', s.cost > f);
      cost.classList.toggle('last', !!s.costLast && s.cost <= f);
    } else {
      cost.classList.remove('on');
    }
    // 油还够下几网（W01）：4 网以上铜色安静；剩 3 网数字和油位管的玻璃发黄；2 网橙红、1 网红，油位管一闪一闪
    const nl = s.netsLeft;
    if (nl !== this.nlShown) {
      const el = this.fuelEl.querySelector('.nl');
      const lvl = nl >= 4 ? '' : nl === 3 ? 'w3' : nl === 2 ? 'w2' : 'w1';
      for (const c of ['w3', 'w2', 'w1']) this.fuelEl.classList.toggle(c, c === lvl);
      // 少了一网（真的花了油）：新数字从上面落下来、顿一下
      if (this.nlShown != null && nl < this.nlShown) { el.classList.remove('tick'); void el.offsetWidth; el.classList.add('tick'); }
      el.querySelector('b').textContent = nl;
      this.nlShown = nl;
    }
    // 这一网的价值：每落进一件就往上跳到它那一份
    if (this.nvShown !== this.netV) {
      this.nvShown += (this.netV - this.nvShown) * Math.min(1, dt * 9);
      if (Math.abs(this.netV - this.nvShown) < 1) this.nvShown = this.netV;
      this.tallyEl.querySelector('.nv').textContent = '+' + Math.round(this.nvShown);
    }
    // 暂停时看的整趟：船上的件数和总价值
    if (this.shown.n !== s.haulCount) { roll(this.tallyEl.querySelector('.n'), s.haulCount); this.shown.n = s.haulCount; }
    if (this.shown.v !== s.haulTotal) { this.tallyEl.querySelector('.v').textContent = s.haulTotal; this.shown.v = s.haulTotal; }
    this.tallyEl.classList.toggle('empty', s.haulCount === 0);
    // 模式条
    this.armBad = !!(s.tip && s.tip.show && (s.tip.bad || s.tip.poor));
    this.renderKeys(this.paused);
    // 臂端标签：这一网要的油；下不了网时变灰打叉，按了 A 才说原因
    const T = s.tip;
    if (T && T.show) {
      if (this.tipWhyT > 0) {
        this.tipWhyT -= dt;
        if (!T.reason || T.reason !== this.tipWhy) this.tipWhyT = 0;
      }
      const why = this.tipWhyT > 0 ? this.tipWhy : '';
      const key2 = `${this.device}|${T.act || ''}|${T.lite ? 1 : 0}|${T.cost}|${T.bad ? 1 : 0}|${T.poor ? 1 : 0}|${why}|${T.n}|${T.wait ? 1 : 0}`;
      if (this.tipKey !== key2) {
        this.tipKey = key2;
        this.tipEl.querySelector('.c b').textContent = T.cost;
        this.tipEl.querySelector('.do').innerHTML = this.actHtml(T.act);
        this.tipEl.classList.toggle('act', !!T.act);
        this.tipEl.classList.toggle('lite', !!T.lite);
        // 这一网兜得到几件看得见的东西；一件都没有时暗下去
        // 件数变了滚一格（A20）；变 0 时整块暗下去
        const nb = this.tipEl.querySelector('.n b');
        const was = nb.dataset.v;
        roll(nb, T.n || 0);
        if (was !== undefined && was !== String(T.n || 0)) this.g.pulse('A20', 1);
        this.tipEl.classList.toggle('none', !T.n);
        this.tipEl.querySelector(':scope > .r').textContent = why;
        this.tipEl.classList.toggle('bad', !!T.bad);
        this.tipEl.classList.toggle('poor', !!T.poor && !T.bad);
        this.tipEl.classList.toggle('why', !!why);
        // 按了下网、吊臂还在路上：牌子亮着等，到了就下
        this.tipEl.classList.toggle('wait', !!T.wait);
      }
      const w = this.tipEl.offsetWidth || 120, hh = this.tipEl.offsetHeight || 50;
      const gap = Math.max(46, (T.r || 0) + 14);
      let x = T.x + gap, y = T.y - hh / 2;
      if (x + w > 1900) x = T.x - gap - w;
      x = Math.max(20, Math.min(1900 - w, x));
      [x, y] = keepOut(x, y, w, hh);
      // 默认那一处压着自己的船：绕着白圈挪到不压船的那一边
      [x, y] = this.tipBeside(T, x, y, w, hh, gap);
      // 换到另一边时滑过去，不跳；牌子跟着白圈走不拖
      const ox = x - T.x, oy = y - T.y;
      if (!this.tipOff || this.tipEl.style.opacity !== '1') this.tipOff = { x: ox, y: oy };
      else { const k = Math.min(1, dt * 14); this.tipOff.x += (ox - this.tipOff.x) * k; this.tipOff.y += (oy - this.tipOff.y) * k; }
      this.tipEl.style.opacity = '1';
      this.tipEl.style.transform = `translate(${Math.round(T.x + this.tipOff.x)}px, ${Math.round(T.y + this.tipOff.y)}px)`;
    } else {
      this.tipEl.style.opacity = '0';
      this.tipWhyT = 0;
    }
    this.spots = s.spots;
    this.trail = s.trail || null;
    this.drawMarks(s.marks, dt);
    if (s.sonarDepth != null) {
      const sd = s.sonarDepth.toFixed(1);
      if (sd !== this.sdShown) { this.sonarEl.querySelector('.sd').textContent = sd; this.sdShown = sd; }
    }
    // 下一处线索的方向：位置、方向、收起来都由游戏每帧平滑地给（s.lead.k：0 收起、1 全出来），这里只照着摆
    const L = s.lead;
    this.leadEl.classList.toggle('on', !!L && L.k > 0.5);
    if (L) {
      const sc = 0.55 + 0.45 * L.k;
      this.leadEl.style.opacity = String(Math.min(1, L.k * 1.25));
      this.leadEl.style.transform = `translate(${Math.round(L.x - 42)}px, ${Math.round(L.y - 42)}px) rotate(${L.ang.toFixed(4)}rad) scale(${sc.toFixed(3)})`;
    } else this.leadEl.style.opacity = '0';
    // 要等的事：网、冲洗，进度圈跟着它本身
    const P = s.prog;
    this.progEl.classList.toggle('on', !!P);
    if (P) {
      const [x, y] = keepOut(P.x - 46, P.y - 46, 92, 92);
      // 落在场景的像素格上（三像素一格，格子跟着场景滑）
      const gx = this.gx || 0, gy = this.gy || 0;
      this.progEl.style.transform = `translate(${(Math.round((x + 4 - gx) / 3) * 3 + gx).toFixed(2)}px, ${(Math.round((y + 4 - gy) / 3) * 3 + gy).toFixed(2)}px)`;
      const key = Math.round(Math.max(0, Math.min(1, P.p)) * 400) + (P.fast ? 'f' : '');
      if (key !== this.progShown) { this.progShown = key; drawProg(this.progCv, P.p, !!P.fast); }
      this.progEl.classList.toggle('fast', !!P.fast);
    }
  }
  // 预告的圈：按 key 记着每一个，同一件东西换了结论时圈弹一下。
  // 全画在一张 640×360 的像素画布上（屏幕上整 3 倍）：圈、牌子、蟹的虚线都落在场景的像素格上，和铜铁那一套一样一格一格的
  drawMarks(list, dt = 1 / 60) {
    const seen = new Set();
    if (this.goldT > 0) this.goldT -= dt;
    if (list) {
      for (const m of list) {
        seen.add(m.key);
        let st = this.markEls.get(m.key);
        if (!st) {
          st = { k: undefined, pop: 9, fromYes: 9 };
          this.markEls.set(m.key, st);
        }
        // 蟹的金圈没了下文（落网那一刻它在不在圈里说不准了）：圈不一下消失，留在原地慢慢褪
        const wasLost = st.lost != null;
        st.lost = null;
        if (st.k !== m.k) {
          const old = st.k;
          st.k = m.k;
          st.pop = 9;
          st.fromYes = 9;
          // 金圈褪成灰圈：金色慢慢退掉、叉 0.3 秒一笔一笔画上去（A18）；别的换结论：弹一下（A17），变金时一声很轻的「叮」。
          // 蟹从「稳稳在圈里」到「落网前就走出去」中间隔着一小段说不准的时候：那段时间金圈在原地褪着，接上灰圈就算褪成灰
          if (old === 'yes' && m.k === 'no') {
            st.fromYes = 0;
            st.yesFrom = st.yesAt ? { ...st.yesAt, a: wasLost ? st.ghostA ?? 1 : 1 } : null;
            this.g.cue('A18');
          } else if (m.k !== 'near') {
            st.pop = 0;
            if (old !== undefined) this.g.pulse('A17', 0.5);
            if (m.k === 'yes' && this.g.mode === 'arm' && !(this.goldT > 0)) {
              this.goldT = 0.3;
              this.g.audio.play('markGold', { pan: Math.max(-0.8, Math.min(0.8, (m.x / 1920) * 2 - 1)) });
              this.g.pulse('A17', 0.5);
            }
          }
        }
        st.pop += dt;
        st.fromYes += dt;
        st.m = m;
        if (m.k === 'yes') st.yesAt = { x: m.x, y: m.y, d: m.d };
      }
    }
    for (const [k, st] of [...this.markEls]) {
      if (seen.has(k)) continue;
      // 只有蟹的金圈留个影子（GHOST_T 秒，等它接上灰圈）；别的、或者不在调臂了，马上收
      if (list && st.k === 'yes' && String(k).startsWith('crab')) {
        st.lost = (st.lost ?? 0) + dt;
        if (st.lost < GHOST_T) continue;
      }
      this.markEls.delete(k);
    }
    this.paintMarks();
  }

  // 每一处打捞点：一支铜箭头在它上方一上一下（够不着的是灰箭头），点好的下一处是绿箭头；
  // 指着的那一处（网还在水里、或者够不着）套一圈。白圈停着的那一处归白圈和小牌，不另画箭头
  paintSpots(c, gx, gy) {
    const T0 = this.g.clock;
    const tr = this.trail;
    if (tr) {
      // 够不着的：从船到它一串点，一颗颗往那边走
      const L = Math.hypot(tr.x1 - tr.x0, tr.y1 - tr.y0) - tr.r, ux = (tr.x1 - tr.x0) / (L + tr.r), uy = (tr.y1 - tr.y0) / (L + tr.r);
      for (let t = 60 + ((T0 * 40) % 24); t < L; t += 24) {
        const x = Math.round((tr.x0 + ux * t - gx) / 3), y = Math.round((tr.y0 + uy * t - gy) / 3);
        c.fillStyle = 'rgba(4,9,11,.7)';
        c.fillRect(x - 1, y - 1, 4, 4);
        c.fillStyle = '#e8f4f0';
        c.fillRect(x, y, 2, 2);
      }
    }
    for (const S of this.spots || []) {
      const cx = Math.round((S.x - gx) / 3), cy = Math.round((S.y - gy) / 3);
      if (S.ring || S.next || S.under) {
        const n = Math.max(12, Math.round((S.r * 2) / 3));
        c.drawImage(markSprite(S.next ? 'next' : S.ring ? 'aim' : 'under', n), cx - (n >> 1), cy - (n >> 1));
      }
      if (S.on && !S.ring) continue;
      const a = spotArrow(S.next ? 'next' : S.far ? 'far' : S.on ? 'on' : 'go');
      const bob = S.next ? 0 : Math.round(Math.sin(T0 * 4 + S.x * 0.01) * 1.4);
      c.drawImage(a, cx - (a.width >> 1), cy - Math.max(8, Math.round((S.r * 0.75) / 3)) - a.height + bob);
    }
  }

  paintMarks() {
    const cv = this.marksCv, c = this.marksCtx;
    if (!this.markEls.size && !(this.spots && this.spots.length)) {
      if (this.marksDirty) { c.clearRect(0, 0, cv.width, cv.height); this.marksDirty = false; }
      return;
    }
    this.marksDirty = true;
    c.clearRect(0, 0, cv.width, cv.height);
    // 画布整张跟着场景的像素格挪那几分之一像素：圈落在格子上，又和场景一起平滑地滑，不三像素三像素地跳
    const gx = this.gx || 0, gy = this.gy || 0;
    const tf = `translate(${gx.toFixed(2)}px, ${gy.toFixed(2)}px)`;
    if (tf !== this.marksTf) { this.marksTf = tf; cv.style.transform = tf; }
    this.paintSpots(c, gx, gy);
    const order = { near: 0, no: 1, hard: 1, yes: 2 };
    const list = [...this.markEls.values()].sort((a, b) => order[a.k] - order[b.k]);
    const ease = (t) => 1 - (1 - t) * (1 - t);
    for (const st of list) {
      const m = st.m;
      // 直径按格算（一格 3 像素），圆心落在格子上
      // 金圈外面多出一格：圈身两格粗，里面还空得下那件东西
      const n = Math.max(10, Math.round((m.k === 'near' ? m.d * 0.8 : m.k === 'yes' ? m.d + 6 : m.d) / 3));
      const cx = Math.round((m.x - gx) / 3), cy = Math.round((m.y - gy) / 3);
      const ring = (kind, nn, a) => {
        c.globalAlpha = a;
        c.drawImage(markSprite(kind, nn), cx - (nn >> 1), cy - (nn >> 1));
        c.globalAlpha = 1;
      };
      // 蟹的金圈没了下文：留在原地慢慢褪（暗下去、一格一格缩一点），虚线先收掉
      if (st.lost != null) {
        const k = Math.min(1, st.lost / GHOST_T);
        st.ghostA = k < 0.7 ? 1 - 0.55 * (k / 0.7) : 0.45 * (1 - (k - 0.7) / 0.3);
        ring('yes', n - Math.round(k * 2), st.ghostA);
        continue;
      }
      // 蟹的金圈：从圈边到蟹身上一串金点（它会走过来），三格一点
      if (m.trail && m.k === 'yes') {
        const ux = Math.cos(m.trail.ang), uy = Math.sin(m.trail.ang);
        const L = m.trail.len / 3 - 1;
        for (let t = n / 2 + 2; t < L; t += 3) {
          const x = Math.round(cx + ux * t), y = Math.round(cy + uy * t);
          c.fillStyle = 'rgba(20,12,0,.7)';
          c.fillRect(x + 1, y + 1, 1, 1);
          c.fillStyle = '#ffd36a';
          c.fillRect(x, y, 1, 1);
        }
      }
      if (st.fromYes < 0.6 && m.k === 'no') {
        // 金色慢慢退掉（一格一格缩一点），灰圈淡进来，叉一笔一笔画上。
        // 蟹的金圈画在它落网时会在的地方，灰圈套在蟹身上：金圈一边褪一边挪回蟹身上
        const k = Math.min(1, st.fromYes / 0.45);
        if (k < 1) {
          const Y = st.yesFrom;
          const e = k * k * (3 - 2 * k);
          const yx = Y ? (Y.x - gx) / 3 : cx, yy = Y ? (Y.y - gy) / 3 : cy;
          const hx = Math.round(yx + (cx - yx) * e), hy = Math.round(yy + (cy - yy) * e);
          const gn = Y ? Math.max(10, Math.round((Y.d + 6) / 3)) : n;
          c.globalAlpha = (Y ? Y.a : 1) * (1 - k * k);
          const nn = gn - Math.round(k * k * 2);
          c.drawImage(markSprite('yes', nn), hx - (nn >> 1), hy - (nn >> 1));
          c.globalAlpha = 1;
        }
        ring('no', n, Math.min(1, st.fromYes / 0.35));
      } else if (st.pop < 0.32) {
        // 弹一下：从大一圈一格一格收回来
        const k = ease(st.pop / 0.32);
        ring(m.k, Math.round(n * (1.45 - 0.45 * k)), 0.2 + 0.8 * k);
      } else ring(m.k, n, 1);
      if (m.k === 'no') {
        const bx = Math.round(cx + Math.cos(m.ang) * (n / 2)), by = Math.round(cy + Math.sin(m.ang) * (n / 2));
        const xs = st.fromYes < 0.6 ? Math.floor(9 * Math.max(0, Math.min(1, (st.fromYes - 0.12) / 0.3))) : 9;
        if (st.fromYes >= 0.12) drawXBadge(c, bx - 5, by - 5, xs);
      } else if (m.k === 'hard' && st.pop >= 0.1) drawWarnBadge(c, cx + (n >> 1) - 5, cy - (n >> 1) - 6);
    }
  }
}

// 回声测深：滚动的回波图。只显示物理特征：底面深度、硬回波、水里动的东西。
class SonarView {
  constructor(el) {
    // 102×50 格，屏幕上正好 3 倍（306×150）：一格 3 像素，和界面上别的像素一样粗
    this.W = 102;
    this.H = 50;
    this.cv = document.createElement('canvas');
    this.cv.width = this.W;
    this.cv.height = this.H;
    // 显像管：玻璃上的扫描线、反光，右边写入的那一列亮一道
    const scr = document.createElement('div');
    scr.className = 'scr';
    scr.append(this.cv);
    scr.insertAdjacentHTML('beforeend', '<i class="head"></i><i class="glass"></i>');
    el.append(scr);
    this.ctx = this.cv.getContext('2d');
    this.acc = 0;
    this.maxD = 34;
    // 开机时整屏是空水和刻度线，不是一块黑
    const c = this.ctx;
    c.fillStyle = '#081a20';
    c.fillRect(0, 0, this.W, this.H);
    c.fillStyle = 'rgba(160,220,220,0.18)';
    for (const dd of [10, 20, 30]) for (let x = 0; x < this.W; x += 2) c.fillRect(x, Math.round((dd / this.maxD) * this.H), 1, 1);
  }
  // info: {depth, hard (0..1), targets:[{d, s, big}]}
  push(info, dt) {
    this.acc += dt;
    if (this.acc < 0.09) return;
    this.acc = 0;
    const c = this.ctx;
    const W = this.W, H = this.H;
    c.drawImage(this.cv, -1, 0);
    let water = 0;
    for (let y = 0; y < H; y++) {
      const d = (y / H) * this.maxD;
      let fill;
      if (info.depth == null) fill = '#081a20';
      else if (d < info.depth) {
        fill = Math.random() < 0.03 ? '#123139' : '#081a20';
        water++;
        // 水里在动的东西：小的是鱼群，很大的一条是别的
        for (const t of info.targets) if (Math.abs(t.d - d) < t.s) fill = t.big ? '#d05040' : '#6ad0c0';
      } else if (d < info.depth + 1.1) fill = info.hard > 0.5 ? '#ffd36a' : '#e88a3a';
      else if (d < info.depth + 3) fill = info.hard > 0.5 ? '#8a5a20' : '#6a3a1e';
      else fill = '#2a1a12';
      c.fillStyle = fill;
      c.fillRect(W - 1, y, 1, 1);
    }
    // 以前是 60 行：水里少了几行，就补抽几次随机数，别的东西拿到的随机数和以前一样（固定种子的试跑前后对得上）
    if (info.depth != null) for (let y = 0; y < 60 && (y / 60) * this.maxD < info.depth; y++) if (--water < 0) Math.random();
    // 大轮廓：55 米内一道比海底还深的黄色长回波（贴着图的下沿），40 米内一条红的长回波，越近越粗
    if (info.lev && Math.random() > 0.1) {
      const L = info.lev;
      const red = L.dist < 40;
      const near = red ? 1 - clamp((L.dist - 22) / 18, 0, 1) : 0;
      const cy = red ? clamp(L.depth / this.maxD, 0.25, 0.9) * H : H - 4;
      const th = red ? 1 + near * 2.2 : 0.8;
      c.fillStyle = red ? (near > 0.6 ? '#ff6a50' : '#d05040') : '#ffd36a';
      c.fillRect(W - 1, Math.round(cy - th + (Math.random() - 0.5)), 1, Math.max(1, Math.round(th * 2)));
    }
    // 刻度线：隔一列点一个，虚线
    this.col = (this.col || 0) ^ 1;
    if (this.col) {
      c.fillStyle = 'rgba(160,220,220,0.18)';
      for (const dd of [10, 20, 30]) c.fillRect(W - 1, Math.round((dd / this.maxD) * H), 1, 1);
    }
  }
}

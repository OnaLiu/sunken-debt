// 标题、暂停、收获单。键盘、手柄、鼠标都能用；机器人也只通过同一套输入操作。
import { ICON } from './icons.js';
import { drawStamp, STAMP_N } from './pixring.js';
import { key } from './hud.js';

const h = (tag, cls, html) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html !== undefined) e.innerHTML = html;
  return e;
};

export const WOBBLE_LEVELS = [
  { v: 0, n: '关' },
  { v: 0.4, n: '弱' },
  { v: 0.75, n: '中' },
  { v: 1.0, n: '强' },
];
export const VOLUME_LEVELS = [0, 0.25, 0.5, 0.75, 1];
// 镜头快慢（开船时鼠标、右摇杆转镜头）：倍数
export const LOOK_LEVELS = [
  { v: 0.5, n: '很慢' },
  { v: 0.7, n: '慢' },
  { v: 1.0, n: '中' },
  { v: 1.4, n: '快' },
  { v: 2.0, n: '很快' },
];
// 上下反转：关 = 鼠标往上推镜头往上看
export const INVERT_LEVELS = [{ v: false, n: '关' }, { v: true, n: '开' }];
const ADJ = {
  wobble: { levels: WOBBLE_LEVELS, label: '晃动和折射' },
  volume: { levels: VOLUME_LEVELS, label: '音量' },
  look: { levels: LOOK_LEVELS, label: '镜头快慢' },
  invert: { levels: INVERT_LEVELS, label: '上下反转' },
};
export const DEMO_SUMMARY_WAIT = 3.2; // 自动演示：清点完、「再来一趟」出来以后停多久再点它

export class Menus {
  constructor(root, game) {
    this.root = root;
    this.g = game;
    this.settings = { wobble: 3, volume: 3, look: 2, invert: 0 };
    try {
      const s = JSON.parse(localStorage.getItem('sunken-settings') || 'null');
      if (s) Object.assign(this.settings, s);
    } catch (e) { /* 没有本地存储也照样玩 */ }
    this.pending = null;
    this.navCool = 0;
    this.title = null;
    this.pause = null;
    this.summary = null;
  }

  save() {
    try { localStorage.setItem('sunken-settings', JSON.stringify(this.settings)); } catch (e) { /* 忽略 */ }
  }

  // —— 标题 ——
  showTitle(demo) {
    this.hideTitle();
    this.titleDemo = !!demo;
    const el = h('div');
    el.id = 'title';
    el.innerHTML = `<div class="logo"><div class="n">沉债</div><div class="rule"><i></i>${ICON.anchor}<i></i></div></div>`;
    if (demo) {
      el.append(h('div', 'clickall', `<span class="pl">${ICON.play}</span><span>自动演示</span>`));
      el.addEventListener('pointerdown', () => (this.pending = 'demo'));
    } else {
      const menu = h('div', 'menu');
      this.titleOpts = [
        { k: 'play', t: '开始打捞' },
        { k: 'demo', t: '自动演示' },
        { k: 'settings', t: '设置' },
      ];
      this.titleSel = 0;
      this.titleOpts.forEach((o, i) => {
        const e = h('div', 'opt sh', o.t);
        e.addEventListener('pointerenter', () => { this.titleSel = i; this.renderTitle(); });
        e.addEventListener('pointerdown', (ev) => { ev.stopPropagation(); this.titleSel = i; this.pending = o.k; });
        o.el = e;
        menu.append(e);
      });
      el.append(menu);
      this.renderTitle();
    }
    this.root.append(el);
    this.title = el;
  }

  renderTitle() {
    if (!this.titleOpts) return;
    this.titleOpts.forEach((o, i) => o.el.classList.toggle('on', i === this.titleSel));
    this.pop(this.titleOpts, this.titleSel, 'tsel');
  }

  // D02 选中项换了：新的那块铜牌亮一下、往里一顶（同一项重画不算）
  pop(opts, sel, key) {
    const el = opts[sel] && opts[sel].el;
    if (!el || this[key] === el) return;
    const first = this[key] === undefined || !this[key] || !this[key].isConnected;
    this[key] = el;
    if (first) return;
    el.classList.remove('pop');
    void el.offsetWidth;
    el.classList.add('pop');
  }

  hideTitle() {
    if (this.title) this.title.remove();
    this.title = null;
    this.titleOpts = null;
  }

  // G01「沉债」压着锚线砸下来
  titleDrop() {
    if (this.title) this.title.classList.add('drop');
  }

  // G01 选项一项项亮起（自动演示那一行也是）
  titleLight() {
    if (!this.title) return;
    const els = this.titleOpts ? this.titleOpts.map((o) => o.el) : [this.title.querySelector('.clickall')].filter(Boolean);
    els.forEach((el, i) => this.g.later(i * 0.16, () => { el.classList.add('lit'); this.g.audio.play('titleOpt', { i }); }));
  }

  // G03 出发：标题字沉进水里，选项先收掉
  sinkTitle() {
    const el = this.title;
    this.title = null;
    this.titleOpts = null;
    if (!el) return;
    el.classList.add('sink');
    this.g.later(1.0, () => el.remove());
  }

  nav(inp, dt) {
    this.navCool -= dt;
    const y = inp.my;
    if (Math.abs(y) < 0.5) { this.navCool = 0; return 0; }
    if (this.navCool > 0) return 0;
    this.navCool = 0.22;
    return y > 0 ? -1 : 1;
  }

  navX(inp, dt) {
    this.navXCool = (this.navXCool || 0) - dt;
    const x = inp.mx;
    if (Math.abs(x) < 0.5) { this.navXCool = 0; return 0; }
    if (this.navXCool > 0) return 0;
    this.navXCool = 0.22;
    return x > 0 ? 1 : -1;
  }

  titleInput(inp, dt) {
    if (this.pending) { const p = this.pending; this.pending = null; return p; }
    if (!this.titleOpts) return inp.a || inp.start ? 'demo' : null;
    const d = this.nav(inp, dt);
    if (d) { this.titleSel = (this.titleSel + d + this.titleOpts.length) % this.titleOpts.length; this.renderTitle(); this.g.audio.play('menu'); this.g.cue('D02'); }
    if (inp.a || inp.start) return this.titleOpts[this.titleSel].k;
    return null;
  }

  // —— 暂停 / 设置 ——
  // 暂停时右边说这一屏：这里每个图标代表什么、这里能按的键。不同地方、不同模式说的不同。
  showPause(settingsOnly = false) {
    this.hidePause();
    const el = h('div');
    el.id = 'pause';
    const wrap = h('div', 'wrap');
    const box = h('div', 'box panel');
    box.append(h('div', 'h sh', settingsOnly ? '设置' : '暂停'));
    this.pauseOpts = settingsOnly
      ? [{ k: 'wobble' }, { k: 'volume' }, { k: 'look' }, { k: 'invert' }, { k: 'back', t: '返回' }]
      : this.g.moment && this.g.moment.on ? this.g.moment.pauseOpts()
      : [{ k: 'resume', t: '继续' }, { k: 'end', t: '结束这一趟' }, { k: 'wobble' }, { k: 'volume' }, { k: 'look' }, { k: 'invert' }, { k: 'title', t: '回到标题' }];
    this.pauseOpts.forEach((o, i) => {
      const e = h('div', 'opt');
      // 机器人驾驶时真实鼠标不碰菜单（只有 Esc 能接管）
      e.addEventListener('pointerenter', () => { if (this.g.input.botDriven) return; this.pauseSel = i; this.renderPause(); });
      e.addEventListener('pointerdown', (ev) => {
        ev.stopPropagation();
        if (this.g.input.botDriven) return;
        this.pauseSel = i;
        if (ADJ[o.k]) this.adjust(o.k, 1, true);
        else this.pending = o.k;
        this.renderPause();
      });
      o.el = e;
      box.append(e);
    });
    wrap.append(box);
    if (!settingsOnly && this.g.pauseInfo) {
      const info = this.g.pauseInfo();
      const lg = h('div', 'legend panel');
      lg.append(h('div', 'ph sh', info.place));
      // 一行里可以有几个图标，各跟一句
      for (const r of info.rows) lg.append(h('div', 'row', r.map((c) => `<span class="c"><span class="g" style="color:${c.color || '#e8b04a'}">${c.ic}</span><span>${c.t}</span></span>`).join('')));
      lg.append(h('div', 'sep'));
      const ks = h('div', 'keys');
      for (const [k, t] of info.keys) ks.append(h('span', '', k), h('span', '', t));
      lg.append(ks);
      wrap.append(lg);
    }
    el.append(wrap);
    this.root.append(el);
    this.pause = el;
    this.pauseSel = 0;
    this.settingsOnly = settingsOnly;
    this.renderPause();
  }

  renderPause() {
    if (!this.pauseOpts) return;
    this.pauseOpts.forEach((o, i) => {
      let html = o.t;
      if (o.k === 'wobble') html = `<span>晃动和折射</span><span class="val">◀ ${WOBBLE_LEVELS[this.settings.wobble].n} ▶</span>`;
      if (o.k === 'volume') html = `<span>音量</span><span class="val">◀ ${Math.round(VOLUME_LEVELS[this.settings.volume] * 100)}% ▶</span>`;
      if (o.k === 'look' || o.k === 'invert') html = `<span>${ADJ[o.k].label}</span><span class="val">◀ ${ADJ[o.k].levels[this.settings[o.k]].n} ▶</span>`;
      o.el.innerHTML = html;
      o.el.classList.toggle('on', i === this.pauseSel);
      // 刚调过：新的值从上面落下来（innerHTML 新建的元素，动画自己从头放）
      if (this.valTick && i === this.pauseSel) { const v = o.el.querySelector('.val'); if (v) v.classList.add('tick'); }
    });
    this.valTick = false;
    this.pop(this.pauseOpts, this.pauseSel, 'psel');
    // 停在「晃动和折射」上时压暗退开一点：调的时候看得见背后的水
    const so = this.pauseOpts[this.pauseSel];
    this.peek = !!so && so.k === 'wobble';
    if (this.pause) this.pause.classList.toggle('peek', this.peek);
  }

  adjust(k, d, wrap) {
    const n = ADJ[k].levels.length;
    let v = this.settings[k] + d;
    v = wrap ? (v + n) % n : Math.max(0, Math.min(n - 1, v));
    this.settings[k] = v;
    this.save();
    this.g.applySettings();
    // D03 调音量：用新的音量放一声海浪试听；调晃动：背后的水当场就变了，配一声「嗒」
    this.g.audio.play(k === 'volume' ? 'waveTaste' : 'menu');
    this.g.cue('D03');
    this.valTick = true;
  }

  // slide：反着来——两块板往下沉、压暗退掉（D01 关上）
  hidePause(slide = false) {
    const el = this.pause;
    this.pause = null;
    this.pauseOpts = null;
    this.psel = null;
    this.peek = false;
    if (!el) return;
    if (!slide) { el.remove(); return; }
    el.classList.add('out');
    this.g.later(0.22, () => el.remove());
  }

  pauseInput(inp, dt) {
    if (this.pending) { const p = this.pending; this.pending = null; return p; }
    const d = this.nav(inp, dt);
    if (d) { this.pauseSel = (this.pauseSel + d + this.pauseOpts.length) % this.pauseOpts.length; this.renderPause(); this.g.audio.play('menu'); this.g.cue('D02'); }
    const o = this.pauseOpts[this.pauseSel];
    const x = this.navX(inp, dt);
    if (x && ADJ[o.k]) { this.adjust(o.k, x, false); this.renderPause(); }
    if (inp.b || inp.esc || inp.start) return this.settingsOnly ? 'back' : 'resume';
    if (inp.a) {
      if (ADJ[o.k]) { this.adjust(o.k, 1, true); this.renderPause(); return null; }
      return o.k;
    }
    return null;
  }

  // —— 收获单（C15 开舱清点）：上面一块总数牌，舱里每落下一件挂一张签、价值飞进总数；
  // 落定时盖入舱章，底下写这一趟做到的事，最后出「再来一趟」。舱里的东西和节拍在 game/tally.js ——
  // o：{ why 游戏替玩家收工的原因, deeds 这一趟做到的事, empty 一件都没有 }
  showSummary(trip, o = {}) {
    this.hideSummary();
    const el = h('div');
    el.id = 'summary';
    const head = h('div', 'head', `<span class="t">收获单</span>${o.why ? `<span class="why">${o.why}</span>` : ''}`);
    const tot = h('div', 'tot', `<span class="lab">这一趟</span><span class="num">${ICON.coin}<b>0</b></span>`);
    // 入舱章：总数落定时盖下去
    const stamp = h('div', 'stamp');
    const scv = document.createElement('canvas');
    scv.width = scv.height = STAMP_N;
    drawStamp(scv);
    stamp.append(scv);
    tot.querySelector('.num').append(stamp);
    const tags = h('div', 'tags');
    const fly = h('div', 'fly');
    const deeds = h('div', 'deeds');
    (o.deeds || []).forEach((d, i) => {
      if (i) deeds.append(h('i', 'dot'));
      deeds.append(h('span', 'dd', d));
    });
    if (o.empty) {
      if (deeds.childNodes.length) deeds.prepend(h('i', 'dot'));
      deeds.prepend(h('span', 'dd empty', '这一趟舱里是空的'));
    }
    const again = h('div', 'again', `${key(this.g.ui.device === 'pad' ? 'A' : '空格', 'a')}再来一趟<span class="cd"></span>`);
    el.append(head, tot, tags, fly, deeds, again);
    el.addEventListener('pointerdown', () => { if (!this.g.input.botDriven) this.pending = 'again'; });
    this.root.append(el);
    this.summary = el;
    // 自动演示的铁牌让到左上角，不压收获单的标题
    const demo = document.getElementById('demo');
    if (demo) demo.classList.add('side');
    this.sumEls = { tot, num: tot.querySelector('b'), tags, fly, deeds, again, stamp };
    void el.offsetWidth;
    el.classList.add('on');
  }

  takePending() {
    if (this.pending !== 'again') return false;
    this.pending = null;
    return true;
  }

  // 一张签：名字、价值，底下一行从哪儿捞的
  tallyTag(hh, star) {
    const S = this.sumEls;
    if (!S) return null;
    const el = h('div', 'card tcard' + (hh.precious ? ' p' : '') + (star ? ' star' : ''), `<i class="eye"></i><span class="nm">${hh.name}</span><span class="v">${ICON.coin}${hh.value}</span>${hh.from ? `<span class="fr">${hh.from}</span>` : ''}`);
    S.tags.append(el);
    void el.offsetWidth;
    el.classList.add('on');
    return el;
  }

  // 整签收成小价签（只剩价值）
  tallyMini(el) {
    if (!el) return;
    el.classList.add('mini');
  }

  // 压轴推近时，别的价签退下去
  tallyDim(on) {
    const S = this.sumEls;
    if (S) S.tags.classList.toggle('dim', on);
  }

  tallyTagAt(el, x, y) {
    el.style.transform = `translate(${(x - el.offsetWidth / 2).toFixed(1)}px, ${y.toFixed(1)}px)`;
  }

  // 价值飞进总数：一枚铜钱带着「+140」
  tallyCoin(v, big) {
    const S = this.sumEls;
    const el = h('div', 'coin' + (big ? ' big' : ''), `${ICON.coin}<b>+${v}</b>`);
    if (S) S.fly.append(el);
    return el;
  }

  tallyCoinAt(el, x, y, k) {
    const s = 1 + Math.sin(k * Math.PI) * 0.25 - k * 0.35;
    el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(-50%, -50%) scale(${s.toFixed(3)})`;
    el.style.opacity = k > 0.7 ? ((1 - k) / 0.3).toFixed(2) : '1';
  }

  // 总数那几个字在画面上的中心（画面逻辑像素）
  tallyTotalAt() {
    const S = this.sumEls;
    if (!S) return { x: 960, y: 140 };
    const st = document.getElementById('stage').getBoundingClientRect();
    const k = st.width / 1920;
    // 落进总数前面那枚大铜钱
    const r = (S.num.parentNode.querySelector('.ic') || S.num).getBoundingClientRect();
    return { x: (r.left + r.width / 2 - st.left) / k, y: (r.top + r.height / 2 - st.top) / k };
  }

  tallySet(v, final = false) {
    const S = this.sumEls;
    if (!S) return;
    S.num.textContent = v;
    if (final) S.tot.classList.add('final');
  }

  // 进账那一下：总数一跳
  tallyPulse(big) {
    const S = this.sumEls;
    if (!S) return;
    const t = S.tot;
    t.classList.remove('pulse', 'pulse2');
    void t.offsetWidth;
    t.classList.add(big ? 'pulse2' : 'pulse');
  }

  // 落定：总数往下一砸，入舱章盖下去
  tallySlam(stamp) {
    const S = this.sumEls;
    if (!S) return;
    S.tot.classList.add('slam');
    if (stamp) S.stamp.classList.add('on');
  }

  tallyDeeds() {
    const S = this.sumEls;
    if (S) S.deeds.classList.add('on');
  }

  // 「再来一趟」出来；自动演示时底下一条走满，机器人就点它
  tallyAgain() {
    const S = this.sumEls;
    if (!S) return;
    S.again.classList.add('on');
    if (this.g.bot) {
      const cd = S.again.querySelector('.cd');
      cd.style.transition = `width ${DEMO_SUMMARY_WAIT}s linear`;
      void cd.offsetWidth;
      cd.style.width = '100%';
    }
  }

  // C16：总数牌、签、按钮一起往上收掉
  tallyOut() {
    if (this.summary) this.summary.classList.add('out');
  }

  pressAgain() {
    const a = this.summary && this.summary.querySelector('.again');
    if (a) a.classList.add('press');
  }

  hideSummary() {
    const demo = document.getElementById('demo');
    if (demo) demo.classList.remove('side');
    const el = this.summary;
    this.summary = null;
    this.sumEls = null;
    if (el) el.remove();
  }
}

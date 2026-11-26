import * as THREE from 'three';
import { BOAT } from '../world/boat.js';
import { VIEW_W, VIEW_H } from '../config.js';
import { clamp } from '../util/math.js';
import { cursorURL } from './pixring.js';
import { T } from '../game/tables.js';
import { KEYS } from './hud.js';

// 自动演示时屏幕上的手：这一刻按着的键和鼠标（只在自动演示里，只给内部看；对外的版本里没有）。
// 只画这个游戏用到的：WASD、左 Shift、E、Q（按住回港）、空格、鼠标（左键、右键分开亮），和一支画出来的指针（机器人的鼠标这一刻在画面上哪一点）。
// 每一屏只亮出这一屏用得上的键：海上是开船、看海底、开冲、回港和鼠标；收获单是空格和鼠标；船坞、债本是空格、E、Q 和鼠标。
// 跟着看演示的人这一刻正看着的地方走（平时是指针，开船时是船，开冲时是甲板），挨在它旁边、不压在它身上。
// 全游戏一份：以后每一段的演示都用这一份。

const W = 300, H = 136;
const _v = new THREE.Vector3();

const MOUSE = `<svg class="ms" viewBox="0 0 40 56" width="60" height="84" shape-rendering="crispEdges">
<rect x="4" y="4" width="32" height="48" rx="0" fill="#0d1a1e" stroke="#060b0d" stroke-width="4"/>
<rect class="lb" x="6" y="6" width="13" height="18" fill="#dfe9e5"/>
<rect class="rb" x="21" y="6" width="13" height="18" fill="#dfe9e5"/>
<rect x="6" y="26" width="28" height="24" fill="#b7c9c4"/>
<rect x="19" y="8" width="2" height="10" fill="#6f8a86"/>
</svg>`;

export class KeyShow {
  constructor(g, root) {
    this.g = g;
    const el = (this.el = document.createElement('div'));
    el.id = 'keyshow';
    const K = KEYS.kb;
    el.innerHTML = `<div class="kb"><span class="k w">W</span><span class="row"><span class="k a">A</span><span class="k s">S</span><span class="k d">D</span></span><span class="k lsh">${T('键名·左Shift')}</span></div><div class="side"><span class="k q">${K.quit}</span><span class="k e">${K.go}</span></div><span class="k spc">${K.aAlt}</span><div class="mouse">${MOUSE}</div>`;
    // 指针：玩家的是浏览器自己的光标（换成这一支），机器人的是画出来的这一支
    const st = document.getElementById('stage').style;
    st.setProperty('--cur-arrow', `url(${cursorURL(false)})`);
    st.setProperty('--cur-turn', `url(${cursorURL(true)})`);
    this.cur = document.createElement('div');
    this.cur.id = 'vcur';
    root.append(el, this.cur);
    this.k = {};
    for (const n of ['w', 'a', 's', 'd', 'e', 'lsh', 'q', 'spc']) this.k[n] = el.querySelector('.k.' + n);
    this.lb = el.querySelector('.lb');
    this.rb = el.querySelector('.rb');
    this.hold = { e: 0, lb: 0, rb: 0, q: 0, spc: 0 };
    this.screen = null;
    this.pos = null;
    this.on = false;
  }

  // 看演示的人这一刻在看哪（画面坐标）
  focus() {
    const g = this.g;
    const m = g.mode;
    const inp = g.input.state;
    const sailing = Math.hypot(inp.mx, inp.my) > 0.2 || Math.abs(g.boatCtl.speed) > 0.8;
    if (m === 'batch') {
      // 甲板上每个位子在画面上最靠右下的那一角再往外一点：不压着泥包
      let mx = -1e9, my = -1e9;
      for (const S of g.deck.slots) {
        const p = g.project(g.boat.root.localToWorld(_v.set(S.x, BOAT.deckY, S.z)));
        mx = Math.max(mx, p.x); my = Math.max(my, p.y);
      }
      return { x: mx + 120, y: my - 40 };
    }
    // 结算：牌子底下正中，不压「再来一次」
    if (m === 'result') {
      const box = document.querySelector('#result .box'), st = document.getElementById('stage').getBoundingClientRect();
      const r = box.getBoundingClientRect(), k = (st.width || VIEW_W) / VIEW_W;
      return { x: VIEW_W / 2 - W / 2, y: (r.bottom - st.top) / k + 18 };
    }
    if ((m === 'arm' || m === 'net') && sailing) {
      const p = g.project(g.boat.root.localToWorld(_v.set(m === 'batch' ? 3.3 : 0, BOAT.deckY, 0)));
      return { x: p.x + (m === 'batch' ? 330 : 200), y: p.y + 120 };
    }
    // 船坞、债本、收获单：指针旁边，不压设备卡、牌子、债本、按钮（beside 照这一屏的东西躲开）
    // 指针旁边：左下、右下、左上、右上里挑一处不压小牌、测深图、油量栏、模式条的
    const P = inp.ptr;
    if (P.ok) return this.beside(P);
    return { x: VIEW_W * 0.7, y: VIEW_H * 0.7 };
  }

  beside(P) {
    const st = document.getElementById('stage').getBoundingClientRect(), k = (st.width || VIEW_W) / VIEW_W;
    const rects = [];
    const own = document.querySelectorAll('#dock .gcard.on, #dock .pin, #dock .sail, #dock .purse, #dock .book, #ledger .bk, #summary .again, #summary .tags .card:not(.mini)');
    for (const el of [this.g.ui.tipEl, this.g.ui.sonarEl, this.g.ui.fuelEl, this.g.ui.deckEl, this.g.ui.modeEl, ...own]) {
      const r = el.getBoundingClientRect();
      if (r.width && getComputedStyle(el).opacity > 0.05) rects.push([(r.left - st.left) / k - 12, (r.top - st.top) / k - 12, (r.right - st.left) / k + 12, (r.bottom - st.top) / k + 12]);
    }
    // 收获单：压轴那一件（连红布）也不压
    const SB = this.g.mode === 'summary' && this.g.tally.starBox;
    if (SB) rects.push([SB.x0 - 12, SB.y0 - 12, SB.x1 + 12, SB.y1 + 12]);
    let best = null;
    // 先挑贴着指针的四个角；四个角都压着东西（指针正指着卡片上的按钮）时，再往外挪到卡片外面
    const near = [[P.sx - W - 30, P.sy + 60], [P.sx + 60, P.sy + 60], [P.sx - W - 30, P.sy - H - 40], [P.sx + 60, P.sy - H - 40]];
    const far = [[P.sx - W - 320, P.sy - H / 2], [P.sx + 320, P.sy - H / 2], [P.sx - W / 2, P.sy - H - 260], [P.sx - W - 320, P.sy + 60], [P.sx + 320, P.sy + 60]];
    [...near, ...far].forEach(([x0, y0], i) => {
      const x = clamp(x0, 40, VIEW_W - W - 40), y = clamp(y0, 150, VIEW_H - H - 120);
      let c = i * 300 + (i >= near.length ? 6000 : 0) + (i === this.side ? -900 : 0) + Math.hypot(x - x0, y - y0) * 20;
      for (const [l, t, r, b] of rects) c += Math.max(0, Math.min(x + W, r) - Math.max(x, l)) * Math.max(0, Math.min(y + H, b) - Math.max(y, t));
      if (!best || c < best.c) best = { c, x, y, i };
    });
    this.side = best.i;
    return best;
  }

  update(dt) {
    const g = this.g;
    const on = !!g.bot && !!g.input.botDriven && g.mode !== 'pause' && g.mode !== 'fading';
    // 玩家自己玩：指针换成游戏的这一支；拖着转镜头时换一支
    const st = document.getElementById('stage').classList;
    st.toggle('point', g.moment.on && !g.bot);
    // 一甲板一起冲的时候不用指哪里：指针收起来，不挡着揭宝
    // 按住左 Shift 看海底：指针跟着指着的那一处走，画出来的这一支（和浏览器那一支一样大）
    const own = g.moment.on && !g.bot && g.peek.own;
    st.toggle('nocur', own || (g.moment.on && !g.bot && g.mode === 'batch'));
    st.toggle('drag', g.moment.on && !g.bot && g.input.state.drag && g.mode !== 'pause');
    const P = g.input.state.ptr;
    this.cur.classList.toggle('on', (on || own) && P.ok && g.mode !== 'batch');
    this.cur.classList.toggle('own', own);
    if (own) {
      this.cur.style.transform = `translate(${P.sx.toFixed(1)}px, ${P.sy.toFixed(1)}px) scale(${(26 / 39 / (g.input.scale || 1)).toFixed(3)})`;
      this.cur.style.backgroundImage = g.input.state.drag ? 'var(--cur-turn)' : '';
    }
    if (on !== this.on) { this.on = on; this.el.classList.toggle('on', on); this.pos = null; }
    if (!on) return;
    const scr = g.mode === 'dock' || g.mode === 'ledger' ? 'dock' : g.mode === 'summary' || g.mode === 'ending' ? 'tally' : 'sea';
    if (scr !== this.screen) { this.el.classList.remove('sea', 'dock', 'tally'); this.el.classList.add(scr); this.screen = scr; this.pos = null; }
    const s = g.input.state;
    // 一下的（下网、开冲）亮一小会儿，看得清按过
    const H0 = this.hold;
    // 海上的空格和左键一样是下网（亮左键，和原来一样）；船坞、债本、收获单的空格亮空格
    if (s.click || (s.a && scr === 'sea')) H0.lb = 0.24;
    if (s.go) H0.e = 0.3;
    if (s.b) H0.q = 0.3;
    if (s.a && !s.click && scr !== 'sea') H0.spc = 0.24;
    if (s.rclick) H0.rb = 0.24;
    for (const k in H0) H0[k] = Math.max(0, H0[k] - dt);
    this.k.w.classList.toggle('on', s.my > 0.3);
    this.k.s.classList.toggle('on', s.my < -0.3);
    this.k.a.classList.toggle('on', s.mx < -0.3);
    this.k.d.classList.toggle('on', s.mx > 0.3);
    this.k.e.classList.toggle('on', H0.e > 0);
    this.k.lsh.classList.toggle('on', !!s.peek);
    this.k.q.classList.toggle('on', H0.q > 0 || (!!s.bHeld && scr === 'sea'));
    this.k.spc.classList.toggle('on', H0.spc > 0);
    this.lb.classList.toggle('on', H0.lb > 0 || (!!s.aHeld && scr === 'sea'));
    this.rb.classList.toggle('on', H0.rb > 0 || !!s.drag);
    if (P.ok) {
      const dn = H0.lb > 0.12 || s.aHeld;
      this.cur.style.transform = `translate(${P.sx.toFixed(1)}px, ${P.sy.toFixed(1)}px)${dn ? ' scale(0.86)' : ''}`;
      this.cur.style.backgroundImage = s.drag ? 'var(--cur-turn)' : '';
    }
    // 跟着看的地方走：挨在旁边，不出画面、不压常驻的面板；挪得慢一点，不跟着抖
    const f = this.focus();
    const x = clamp(f.x, 40, VIEW_W - W - 40), y = clamp(f.y, 150, VIEW_H - H - 120);
    if (!this.pos) this.pos = { x, y };
    const k = Math.min(1, dt * 5);
    this.pos.x += (x - this.pos.x) * k;
    this.pos.y += (y - this.pos.y) * k;
    this.el.style.translate = `${this.pos.x.toFixed(0)}px ${this.pos.y.toFixed(0)}px`;
  }
}

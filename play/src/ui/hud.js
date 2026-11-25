// HUD：屏幕上的字只留玩家这一刻要靠它做决定的。常驻的只有模式和燃油；其余用到时飞进来、用完收起来：
// 第一次到航行、作业时的几个键，回波（作业、深水时），作业栏（对准落点时），结果卡（每一网之后，点了才收起）；这一趟收尾时一张收获单。
// 提示只有底部一行：同一时刻只说一句，弹一下就收（出了岔子的、要玩家动手的、第一次见到的）。
// 数量、花费、时长用图标加数字；状态用颜色和动作；方向用箭头；进度用圈和条。没有图例、没有按住才出来的详情层。
// 画布（回波、世界标记层）都按屏幕原来的分辨率画，字是高清字体。
import { tag } from '../core/perf.js';
import { BOAT } from '../game/boat.js';
import { MAX_DEPTH, NET_R } from '../game/net.js';
import { Overlay, FONT } from './overlay.js';
import { cap, firstKeys } from './keys.js';
import { KeysFirst } from './keysfirst.js';
import { fxTag } from '../fx/tags.js';
import { HaulSheet } from './haul.js';
import { demoIn } from './demobanner.js';

const h = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
const fmt = (n) => Math.round(n).toLocaleString('zh-CN');
const PLACE_NAME = { sail: '航行', work: '作业', reveal: '揭晓' };

// 小图标：数量、花费、时长都用“图标 + 数字”
const svg = (w, hh, body, cls = 'ic') => `<svg class="${cls}" viewBox="0 0 ${w} ${hh}" width="${w}" height="${hh}">${body}</svg>`;
export const IC = {
  fuel: svg(18, 18, '<path d="M4 4.5 H11 L14 7.5 V16 H4 Z" fill="#d8b04a" stroke="#2a1d07" stroke-width="1.2"/><path d="M6 2.5 H9.5 V4.5 H6 Z" fill="#a07a32" stroke="#2a1d07" stroke-width="1"/><path d="M6.5 8 L11.5 13 M11.5 8 L6.5 13" stroke="#5f4417" stroke-width="1.4"/>'),
  hold: svg(18, 18, '<rect x="2" y="5" width="14" height="10.5" fill="#8a6434" stroke="#2a1d07" stroke-width="1.3"/><path d="M2 8.6 H16 M2 12 H16" stroke="#4a3418" stroke-width="1.1"/><rect x="4.5" y="2" width="9" height="3" fill="#b08848" stroke="#2a1d07" stroke-width="1"/>'),
  coin: svg(18, 18, '<circle cx="9" cy="9" r="7" fill="#e6c06a" stroke="#6a4a14" stroke-width="1.4"/><circle cx="9" cy="9" r="4.3" fill="none" stroke="#a87a2a" stroke-width="1.2"/><circle cx="7" cy="6.5" r="1.4" fill="#fff4c4"/>'),
  depth: svg(18, 18, '<path d="M1.5 4 Q4.5 1.5 7.5 4 T13.5 4 T17 3.5" fill="none" stroke="#9fe0d0" stroke-width="1.5"/><path d="M9 6.5 V15 M5.5 11.5 L9 15.5 L12.5 11.5" fill="none" stroke="#f2ead2" stroke-width="1.8"/>'),
  clock: svg(18, 18, '<circle cx="9" cy="10" r="6.3" fill="none" stroke="#f2ead2" stroke-width="1.6"/><path d="M7 2 H11 M9 2 V3.6 M9 10 V6.5 M9 10 L11.5 11.5" stroke="#f2ead2" stroke-width="1.5" stroke-linecap="round"/>'),
  hazard: svg(20, 18, '<path d="M10 1.5 L18.5 16.5 H1.5 Z" fill="#ff6a4a" stroke="#061012" stroke-width="1.4"/><rect x="9" y="6" width="2" height="6" fill="#1a0a06"/><rect x="9" y="13.2" width="2" height="2" fill="#1a0a06"/>'),
};

// 变灰的按钮：按了不执行，按钮抖一下；只有玩家要自己动手解决的（例如浏览器不让全屏）才在卡上写一句
export function guard(btn) {
  if (!btn || !btn.classList.contains('disabled')) return true;
  if (btn.dataset.why) showWhy(btn, btn.dataset.why); else shake(btn);
  return false;
}
export function shake(btn) { if (!btn) return; btn.classList.remove('deny'); void btn.offsetWidth; btn.classList.add('deny'); }
export function showWhy(btn, text) {
  const card = btn.closest('.mcard, .pcard, .title, .rcard');
  if (!card) return;
  let w = card.querySelector('.why');
  if (!w) { w = h('div', 'why'); card.appendChild(w); }
  w.textContent = text; w.classList.add('on');
  clearTimeout(w._t); w._t = setTimeout(() => w.classList.remove('on'), 3500);
  shake(btn);
}
// 一行字放不下就缩小字号，不让它被切掉
export function fitText(el, minPx = 18) {
  if (!el) return;
  el.style.fontSize = '';
  let px = parseFloat(getComputedStyle(el).fontSize);
  let n = 0;
  while (el.scrollWidth > el.clientWidth + 1 && px > minPx && n++ < 40) { px -= 2; el.style.fontSize = px + 'px'; }
}

// 模式徽章：圆形黄铜表框里的一枚图标——航行是舵轮（跟着转舵转）、作业是吊钩（随网晃）、揭晓是马灯
const rivets = [0, 1, 2, 3, 4, 5].map((k) => { const a = k * Math.PI / 3 + 0.52; return `<circle cx="${(26 + Math.cos(a) * 21.7).toFixed(1)}" cy="${(26 + Math.sin(a) * 21.7).toFixed(1)}" r="1.25" fill="#3a2a0c"/>`; }).join('');
const spokes = [0, 1, 2, 3, 4, 5, 6, 7].map((k) => { const a = k * Math.PI / 4, c = Math.cos(a), s = Math.sin(a); return `<path d="M${(26 + c * 3.4).toFixed(1)} ${(26 + s * 3.4).toFixed(1)} L${(26 + c * 14).toFixed(1)} ${(26 + s * 14).toFixed(1)}" stroke="#e8c873" stroke-width="2"/><circle cx="${(26 + c * 15.2).toFixed(1)}" cy="${(26 + s * 15.2).toFixed(1)}" r="1.9" fill="#f6dfa0" stroke="#5f4417" stroke-width=".6"/>`; }).join('');
const BADGE = `<svg class="mbadge m-sail" viewBox="0 0 52 52" width="52" height="52">
<defs><radialGradient id="mbz" cx="38%" cy="32%" r="75%"><stop offset="0" stop-color="#fff2c0"/><stop offset=".42" stop-color="#d0a64c"/><stop offset="1" stop-color="#4a3410"/></radialGradient>
<radialGradient id="mfc" cx="45%" cy="35%" r="72%"><stop offset="0" stop-color="#21454e"/><stop offset="1" stop-color="#05121a"/></radialGradient></defs>
<circle cx="26" cy="26" r="25.4" fill="#000"/><circle cx="26" cy="26" r="24.3" fill="url(#mbz)"/><circle cx="26" cy="26" r="19.6" fill="url(#mfc)" stroke="#2a1d07" stroke-width="1.6"/>${rivets}
<g class="ic ic-sail"><g class="spin"><circle cx="26" cy="26" r="10" fill="none" stroke="#e8c873" stroke-width="2.6"/>${spokes}<circle cx="26" cy="26" r="3.3" fill="#f6dfa0" stroke="#5f4417" stroke-width=".8"/></g></g>
<g class="ic ic-work"><g class="spin"><path d="M26 7 V19" stroke="#cfd6d0" stroke-width="1.6"/><rect x="21.2" y="17.5" width="9.6" height="6.5" rx="1.6" fill="#ffd27a" stroke="#5f4417"/><path d="M26 24 V30.5 a5.6 5.6 0 1 1 -5.6 5.6" fill="none" stroke="#f6dfa0" stroke-width="2.8" stroke-linecap="round"/><path d="M20.4 36 l-1.6 -3" stroke="#f6dfa0" stroke-width="2.2" stroke-linecap="round"/></g></g>
<g class="ic ic-reveal"><path d="M22 13.5 H30 M26 9.5 V13.5" stroke="#f6dfa0" stroke-width="1.6"/><g class="spin"><ellipse cx="26" cy="25" rx="9.5" ry="11.5" fill="rgba(255,210,122,.22)"/><ellipse cx="26" cy="25.5" rx="4.6" ry="6.6" fill="#ffd27a"/><ellipse cx="26" cy="26.5" rx="2" ry="3.4" fill="#fff8d8"/></g><rect x="19" y="15" width="14" height="20" rx="3" fill="none" stroke="#e8c873" stroke-width="2"/><path d="M18 36.5 H34" stroke="#e8c873" stroke-width="2.6"/></g>
<ellipse cx="20.5" cy="15.5" rx="10.5" ry="5.5" fill="rgba(255,255,255,.07)" transform="rotate(-25 20.5 15.5)"/></svg>`;

// 收起来的东西留一个影子滑出去（真的那个已经从界面上拿掉；影子放在界面层外面的飞行层里，不挡点、不算界面上的字）
export function ghostOut(el, dir = 'down', delay = 0) {
  const fx = document.getElementById('fx'), stage = document.getElementById('stage');
  if (!fx || !stage || !el || !el.isConnected) return;
  const r = el.getBoundingClientRect();
  if (r.width < 2 || r.height < 2) return;
  const sr = stage.getBoundingClientRect(), s = sr.width / 1920 || 1;
  const g = el.cloneNode(true);
  // 画布的内容不随节点克隆：照原样画进影子里
  const src = el.querySelectorAll('canvas'), dst = g.querySelectorAll('canvas');
  src.forEach((c, i) => { try { dst[i].width = c.width; dst[i].height = c.height; dst[i].getContext('2d').drawImage(c, 0, 0); } catch (e) { /* 画布不可读时就留空 */ } });
  g.style.margin = '0'; g.style.position = 'relative'; g.style.left = '0'; g.style.top = '0'; g.style.transform = 'none'; // 影子摆在原地（暂停卡本身带着 translateY(-50%)，不清掉影子会先往上跳半张）
  // 影子换一个根类名（样式两边都认），页面上按类名找卡片时只找得到真的那张
  for (const c of ['mcard', 'pcard']) if (g.classList.contains(c)) { g.classList.remove(c); g.classList.add('g-' + c); }
  g.setAttribute('aria-hidden', 'true');
  const wrap = h('div', 'ghost');
  wrap.style.cssText = `left:${((r.left - sr.left) / s).toFixed(1)}px;top:${((r.top - sr.top) / s).toFixed(1)}px;width:${(r.width / s).toFixed(1)}px;height:${(r.height / s).toFixed(1)}px;`;
  wrap.appendChild(g); fx.appendChild(wrap);
  // 收起结果卡（B22）：像用指尖往右一弹——先往左一顿（0.06 秒），再一口气甩出右边、略带转，一道亮光从左往右扫过铜牌
  if (dir === 'flick') {
    const sheen = h('i', 'gsheen'); wrap.appendChild(sheen);
    const a = wrap.animate([
      { transform: 'none', opacity: 1, offset: 0 },
      { transform: 'translateX(-9px) scale(.985)', opacity: 1, offset: 0.17, easing: 'cubic-bezier(.55,0,.85,.35)' },
      { transform: 'translateX(60px) rotate(1.2deg)', opacity: 0.95, offset: 0.45 },
      { transform: 'translateX(230px) rotate(4deg)', opacity: 0, offset: 1 },
    ], { duration: 360, delay, easing: 'linear', fill: 'both' });
    sheen.animate([{ transform: 'translateX(-120%)', opacity: 0 }, { transform: 'translateX(-40%)', opacity: 1, offset: 0.35 }, { transform: 'translateX(140%)', opacity: 0 }], { duration: 360, delay, easing: 'ease-in', fill: 'both' });
    a.onfinish = () => wrap.remove();
    setTimeout(() => wrap.remove(), 900 + delay);
    return;
  }
  const to = dir === 'right' ? 'translateX(150px) rotate(2deg)' : dir === 'left' ? 'translateX(-150px)' : dir === 'up' ? 'translateY(-50px)' : 'translateY(60px) scale(.97)';
  const a = wrap.animate([{ transform: 'none', opacity: 1 }, { transform: to, opacity: 0 }], { duration: 300, delay, easing: 'cubic-bezier(.5,0,.8,.4)', fill: 'both' });
  a.onfinish = () => wrap.remove();
  setTimeout(() => wrap.remove(), 900 + delay);
}
// 数字从 a 滚到 b（真实时间；界面上的数字不在看不见的地方悄悄变）。then：接在前一段后面滚（前一段滚完之前不动这个数）
function countUp(el, a, b, dur = 650, delay = 0, f = (v) => fmt(v), then = false) {
  if (!el) return;
  if (!then) el.textContent = f(a);
  const t0 = performance.now() + delay;
  const step = (now) => {
    if (!el.isConnected) return;
    if (then && now < t0) { requestAnimationFrame(step); return; }
    const k = Math.min(1, Math.max(0, (now - t0) / dur)), e = 1 - Math.pow(1 - k, 3);
    el.textContent = f(a + (b - a) * e);
    if (k < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
function bump(el, cls = 'bump') { if (!el) return; el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); }
const SAY_DUR = { info: 2.6, warn: 3.4, find: 3.4 };

export class HUD {
  constructor(root) {
    this.root = root;
    root.innerHTML = '';
    this.el = {};
    const E = this.el;
    this.dev = 'kb';
    // 飞行层（界面层外面）：东西飞进格子、收起的卡片滑出去的影子
    const stage = root.parentElement;
    this.fx = document.getElementById('fx');
    if (!this.fx) { this.fx = h('div'); this.fx.id = 'fx'; (stage || root).appendChild(this.fx); }
    // 世界标记层（最底下，按屏幕原分辨率画）
    E.ovl = h('canvas', 'ovl');
    root.appendChild(E.ovl);
    this.overlay = new Overlay(E.ovl);
    E.play = h('div', 'layer play');
    root.appendChild(E.play);
    // 左上栈：模式（常驻）→ 第一次到这里时的几个键
    E.left = h('div', 'stack left'); E.play.appendChild(E.left);
    E.mode = h('div', 'panel mode', `<div class="mrow">${BADGE}<div class="mlabel"></div></div>`); E.left.appendChild(E.mode);
    E.mbadge = E.mode.querySelector('.mbadge'); E.mlabel = E.mode.querySelector('.mlabel');
    E.wheel = E.mode.querySelector('.ic-sail .spin'); E.hook = E.mode.querySelector('.ic-work .spin');
    E.keys = h('div', 'panel keys dock-l tuck', ''); E.left.appendChild(E.keys);
    // 右上栈：燃油（常驻）→ 结果卡（每一网之后，点了才收起）
    E.right = h('div', 'stack right'); E.play.appendChild(E.right);
    // 燃油条：金色是油；斜纹是这一网要预付的作业油；琥珀色刻度是“下完这一网剩 15%”那条线（斜纹左端过了它就发黄）。
    // 燃油逼近（W1）：黄时边框一呼一吸、每下心跳表跟着一跳；红时写一句“油不够这一网”。元素只建一次、每次改宽度和位置
    E.fuel = h('div', 'panel fuel', `<i class="fglow"></i><div class="frow">${IC.fuel}<span class="fnum"></span></div><div class="bar"><div class="fill"></div><div class="opf"></div><i class="fmark"></i></div><div class="fwarn">油不够这一网</div>`);
    E.right.appendChild(E.fuel);
    for (const k of ['fnum', 'fill', 'opf', 'fwarn']) E['f_' + k] = E.fuel.querySelector('.' + k);
    E.cards = h('div', 'cards'); E.right.appendChild(E.cards);
    // 这一趟的合计（B20）：结果卡上的数滚完，一枚小币从卡上跳进来，合计跟着滚上去；过几秒自己收起
    E.tally = h('div', 'panel tally dock-r tuck', `${IC.hold}<span class="tn"></span><span class="tv">${IC.coin}<b></b></span>`);
    E.right.appendChild(E.tally);
    // 下中栈：提示（同一时刻只有一句）→ 作业栏
    E.bottom = h('div', 'stack bottom'); E.play.appendChild(E.bottom);
    E.say = h('div', 'prompt', ''); E.say.hidden = true; E.bottom.appendChild(E.say);
    E.est = h('div', 'panel est dock-b tuck', '<div class="erow"></div><div class="issues"></div><button class="gobtn" data-a="drop"></button>'); E.bottom.appendChild(E.est);
    E.erow = E.est.querySelector('.erow'); E.issues = E.est.querySelector('.issues'); E.gobtn = E.est.querySelector('.gobtn');
    // 网在水下时（A8）：作业栏不收起，下网键换成这一行和一根进度条（网下去、上来、回甲板），回来了再换回下网键
    E.ebusy = h('div', 'ebusy', '<span class="bl"></span><i class="bp"><i></i></i>'); E.est.appendChild(E.ebusy);
    E.ebl = E.ebusy.querySelector('.bl'); E.ebp = E.ebusy.querySelector('.bp i');
    E.est.addEventListener('mousedown', (e) => e.stopPropagation());
    E.gobtn.onclick = () => { if (this.onDrop) this.onDrop(); };
    // 左下：回波测深（作业、深水时飞进来）
    E.sounderWrap = h('div', 'panel sounder dock-l tuck');
    // 屏幕上面一条读数（A8）：这一刻下面多深，数字慢慢滚过去；底下是沉船这样的硬底时变成金色
    E.shead = h('div', 'shead', '<span class="sl">水深</span><span class="sv"><b></b><i>m</i></span>'); E.sounderWrap.appendChild(E.shead);
    E.sdepth = E.shead.querySelector('b');
    E.sounder = h('canvas'); E.sounderWrap.appendChild(E.sounder);
    E.play.appendChild(E.sounderWrap);
    E.demo = h('div', 'demo-banner', '');
    E.demo.hidden = true;
    root.appendChild(E.demo);
    // F1 收起界面以后（D4）：右下角一枚很淡的小牌，写着怎么放回来，一会儿就淡掉
    E.hudHint = h('div', 'hudhint', '<span class="kc"><i>F1</i></span>显示界面'); root.appendChild(E.hudHint);
    // 揭宝
    E.lbTop = h('div', 'letterbox top'); E.lbBot = h('div', 'letterbox bot');
    root.appendChild(E.lbTop); root.appendChild(E.lbBot);
    E.reveal = h('div', 'reveal', '');
    root.appendChild(E.reveal);
    // 模态：暂停；这一趟的收获单
    E.pause = h('div', 'modal pausing');
    E.pause.hidden = true;
    root.appendChild(E.pause);
    E.haul = h('div', 'modal haul');
    E.haul.hidden = true;
    root.appendChild(E.haul);
    this.sheet = new HaulSheet(E.haul); // 收获单的拍子（C11，ui/haul.js）
    for (const el of [E.cards, E.haul, E.pause]) el.addEventListener('mousedown', (e) => e.stopPropagation());
    this.sounderData = [];
    this.sayT = 0; this.sayMsg = null;
    this.keysT = 0; this.keysSeen = new Set();
    this.kf = new KeysFirst(); // 第一次进入作业（F3）
    this.scale = 1; this.dpr = 1;
    this.canvasK = new Map();
    this.cardsSig = '';
  }
  // 窗口缩放、全屏切换、换显示器：画布按新的屏幕像素重建（字始终是高清的）
  setScale(s, dpr) {
    this.scale = s; this.dpr = dpr;
    this.overlay.setScale(s, dpr);
    this.sizeCanvas(this.el.sounder, 300, 104);
    this.rectT = 0;
  }
  sizeCanvas(c, w, hh) {
    const k = this.scale * this.dpr;
    const bw = Math.max(1, Math.round(w * k)), bh = Math.max(1, Math.round(hh * k));
    if (c.width !== bw || c.height !== bh) { c.width = bw; c.height = bh; }
    c.style.width = w + 'px'; c.style.height = hh + 'px';
    this.canvasK.set(c, { k: bw / w, w, h: hh });
  }
  ctx2d(c) { const x = c.getContext('2d'); const K = this.canvasK.get(c) || { k: 1, w: c.width, h: c.height }; x.setTransform(K.k, 0, 0, K.k, 0, 0); return [x, K.w, K.h]; }
  // F1 隐藏界面（D4）：界面整体淡出——四边的面板各自往自己那条边退一点再没、世界标记和网口圈一起淡掉；右下角一枚小牌写着怎么放回来。
  // 再按一下，从各自那条边滑回来、淡进来。quiet：新的一趟开始时直接放回来，不演
  setHidden(v, quiet = false) {
    const R = this.root, was = R.classList.contains('hidden-hud');
    if (v === was) return;
    clearTimeout(this.hideT); clearTimeout(this.hintT);
    R.classList.toggle('hidden-hud', v);
    R.classList.toggle('hud-back', !v && !quiet);
    this.ovlGone = false;
    const H = this.el.hudHint;
    H.classList.remove('on');
    if (v) {
      // 世界标记层淡完了才停画（淡的那 0.3 秒里照常画）
      this.hideT = setTimeout(() => { this.ovlGone = true; }, 340);
      if (!quiet) { void H.offsetWidth; H.classList.add('on'); this.hintT = setTimeout(() => H.classList.remove('on'), 2100); }
    } else if (!quiet) this.hideT = setTimeout(() => R.classList.remove('hud-back'), 700);
    if (quiet) return;
    this.g && this.g.audio && this.g.audio.play(v ? 'hudOff' : 'hudOn');
    fxTag('D4', v ? 'F1：界面整体淡出，干净地看海' : '再按 F1：界面滑回来、淡进来', 'D4');
  }
  // 新的一趟（开始航程、再来一次）：界面是同一个，上一趟记住的东西要清掉。
  // 结果卡的编号每一趟从 1 重新数，不清掉的话新卡全被当成“见过的旧卡”，签不飞、数不滚（bug-1）
  resetTrip() {
    this.seenCards = new Set(); this.cardsSig = ''; this.cardMax = 3;
    this.pendingFly = null; this.flyHold = 0; this.revealInfo = null; this.rbar = null;
    this.el.cards.innerHTML = '';
    this.tallyShown = this.tallyLanded = 0; this.tallyN = 0; clearTimeout(this.tallyT); this.el.tally.classList.add('tuck'); this.el.tally.classList.remove('entering', 'leaving');
    this.el.reveal.className = 'reveal'; this.el.reveal.innerHTML = '';
    this.root.classList.remove('revealing', 'rv-p');
    if (this.fx) for (const f of this.fx.querySelectorAll('.flyer, .spark, .ghost')) f.remove();
    // 油表（W1、A7）：上一趟停在半截的“斜纹烧掉”、黄红等级也清掉，满油重新算
    this.fburn = 0; this.fburnEnd = true; this.flv = null;
    // 新的一趟：F1 收起的界面放回来（新的一趟里 hudHidden 是 false，不然要按两下才出来）；测深的读数、作业栏的“网在水下”从头来（A8、D4）
    this.setHidden(false, true);
    this.sounderData = []; this.depthShow = null; this.sIdle = 0; this.deepSail = false; this.estBusy = false; this.goBack = false; this.el.est.classList.remove('busy');
    // 上一趟停着的回波屏、作业栏一起收好（不然新的一趟一开始，回波屏还要再等 5 秒才走）
    for (const el of [this.el.sounderWrap, this.el.est]) { clearTimeout(el._dt); el.classList.remove('entering', 'leaving'); el.classList.add('tuck'); }
    this.rectT = 0;
  }
  // 从藏着变成露出来：横幅从上沿落下来（G5，demobanner.js）
  setDemo(on) { const was = !this.el.demo.hidden; this.el.demo.innerHTML = `自动演示 ${cap('start', this.dev)} 接管`; this.el.demo.hidden = !on; if (on && !was) demoIn(this.el.demo); }
  // 键鼠 / 手柄：屏幕上的键帽只写正在用的那一种
  setDevice(dev) { if (dev && dev !== this.dev) { this.dev = dev; this.overlay.dev = dev; if (!this.el.demo.hidden) this.setDemo(true); } }
  // 暂停中按了只有游戏里才用得上的键：选中的按钮抖一下（“继续”就在那里）
  pauseWhy() { shake(this.el.pause.querySelector('button.sel') || this.el.pause.querySelector('button')); }
  // 作业栏的“下网”按了下不去：按钮抖一下（原因已经写在它上面那一行）
  denyDrop() { shake(this.el.gobtn); }
  // 燃油逼近：心跳的那一下，油表跟着一跳（skipped：停了一拍，这一下不跳）
  fuelBeat(level, skipped) { if (!skipped) bump(this.el.fuel, 'beat'); }
  // 油不够还按了下网：油表一抖，“油不够这一网”闪一下
  fuelDeny() { shake(this.el.fuel); bump(this.el.f_fwarn, 'pop'); }
  // 按下网、预付这一网的油：油条上那截斜纹在原地烧掉（A7）
  fuelSpend() {
    const o = this.el.f_opf;
    if (!o || !parseFloat(o.style.width)) return;
    o.classList.remove('burn'); void o.offsetWidth; o.classList.add('burn');
    this.fburn = 0.7; // 游戏时间（慢放时跟着慢）
    fxTag('A7', '油表·预付这一网（斜纹烧掉）');
  }
  // 演示结束、玩家接手：第一次自己开船、作业时再飞进来那几个键
  keysFresh() { this.keysSeen.clear(); this.lastPlace = null; }
  placeOf(g) {
    if (g.reveal.busy && g.reveal.active.phase !== 'pull') return 'reveal';
    if (g.mode === 'work' || g.op) return 'work';
    return 'sail';
  }
  // 提示：底部一行，同一时刻只说一句，新的顶掉旧的，几秒后收起
  say(text, kind = 'info') { tag('say'); this.sayMsg = { html: String(text).replace(/\{(\w+)\}/g, (m, a) => cap(a, this.dev)), kind }; this.sayT = SAY_DUR[kind] || 2.6; this.rectT = 0; }

  update(dt, g) {
    this.g = g;
    const E = this.el;
    // 收获单按游戏时间一拍一拍往下走（慢放、暂停都跟着）
    if (g.ended && g.ended.plan && !E.haul.hidden) this.sheet.update(g.time - g.ended.t + (g.ended.off || 0), g.ended.plan, g.audio);
    const boat = g.boat;
    const place = this.placeOf(g);
    const paused = g.paused;
    const dev = this.dev;
    this.root.classList.toggle('paused', paused);
    if (place !== this.lastPlace) {
      this.lastPlace = place; this.rectT = 0;
      // 第一次到航行、作业：几个键飞进来几秒；演示里机器人在开，不写
      if ((place === 'sail' || place === 'work') && !g.piloted && !this.keysSeen.has(place)) { this.keysSeen.add(place); this.keysT = 7; this.keysPlace = place; this.kf.enter(place, g); }
      else this.keysT = 0;
    }
    this.keysT = Math.max(0, this.keysT - dt);
    // 数字面板每秒刷新约 8 次就够读了（每帧改文字会让整块界面每帧重画）
    this.numT = (this.numT || 0) - dt;
    const numTick = this.numT <= 0 || place !== this.numPlace || !!g.op !== this.numOp;
    if (numTick) { this.numT = 0.12; this.numPlace = place; this.numOp = !!g.op; }
    // 模式（常驻）：徽章换图标，名字从上面落下来
    if (place !== this.modePlace) {
      const was = this.modePlace;
      this.modePlace = place;
      E.mlabel.textContent = PLACE_NAME[place]; E.mlabel.className = 'mlabel m-' + place;
      bump(E.mlabel, 'swap');
      // 徽章翻一面：先带着原来的图标转到侧面（约 0.19 秒），这时才换成新的，再翻回来、略冲过头（B2；每次换模式都这样翻）
      if (was == null) E.mbadge.setAttribute('class', 'mbadge m-' + place);
      else { E.mbadge.setAttribute('class', 'mbadge m-' + was); void E.mbadge.getBoundingClientRect(); E.mbadge.setAttribute('class', 'mbadge flip m-' + was); this.flipTo = place; this.flipT = 0.19; }
    }
    if (this.flipTo) { this.flipT -= dt; if (this.flipT <= 0) { E.mbadge.setAttribute('class', 'mbadge flip m-' + this.flipTo); this.flipTo = null; } }
    // 徽章上的舵轮跟着转舵转、吊钩跟着网晃（每帧，只改一个属性）
    if (place === 'sail') {
      this.wheelA = (this.wheelA || 0) + (boat.turn * 260 - (this.wheelA || 0)) * Math.min(1, dt * 4);
      E.wheel.setAttribute('transform', `rotate(${this.wheelA.toFixed(1)} 26 26)`);
    } else if (place === 'work') {
      const sw = g.op ? Math.sin(g.time * 2.2) * 9 : Math.sin(g.time * 1.3) * 4 + (boat.craneMoving ? Math.sin(g.time * 6) * 5 : 0);
      E.hook.setAttribute('transform', `rotate(${sw.toFixed(1)} 26 7)`);
    }
    // 第一次到这里的几个键
    const showKeys = this.keysT > 0 && !paused && !g.ended && place === this.keysPlace;
    if (showKeys) {
      const khtml = this.kf.decorate(firstKeys(place, dev).map(([k, t, a]) => `<div class="krow" data-a="${a}"><span class="kk">${k}</span><span>${t}</span></div>`).join(''));
      if (khtml !== this.keysHTML) { E.keys.innerHTML = khtml; this.keysHTML = khtml; }
    }
    this.dock(E.keys, showKeys);
    this.kf.update(E.keys, g, showKeys);
    // 燃油（常驻）：油量的数字滚过去（预付作业油时看得见它往下掉）
    const rollTo = (cur, want, k) => (cur == null || Math.abs(want - cur) < 0.05 ? want : cur + (want - cur) * k);
    const rk = 1 - Math.exp(-dt * 6.5);
    this.fuelShow = rollTo(this.fuelShow, boat.fuel, rk);
    const rolling = this.fuelShow !== boat.fuel;
    if (numTick || rolling) {
      const fnum = this.fuelShow.toFixed(1);
      if (fnum !== this.fnumT) { E.f_fnum.textContent = fnum; this.fnumT = fnum; tag('fuel'); }
    }
    if (this.fburn > 0) { this.fburn -= dt; if (this.fburn <= 0) this.fburnEnd = true; }
    if (numTick) {
      const opF = g.est && g.mode === 'work' && !g.op ? g.est.fuel : 0;
      const cap0 = BOAT.fuelCap, pct = Math.max(0, boat.fuel / cap0);
      // 下完这一网还剩多少：不够这一网时变红，剩得不多时变黄（W1：等级由燃油逼近那边定，航行时按还能下的最省油的那一网）
      const reserve = boat.fuel - opF, low = cap0 * 0.15;
      const W = g.fuelWatch, lv = W ? W.level : reserve < 0 ? 2 : reserve < low ? 1 : 0;
      const rc = ['ok', 'warn', 'bad'][lv];
      const bar = {
        fill: (pct * 100).toFixed(1) + '%', fillC: 'fill ' + rc,
        opL: opF ? (Math.max(0, boat.fuel - opF) / cap0 * 100).toFixed(1) + '%' : '0%', opW: opF ? (Math.min(opF, boat.fuel) / cap0 * 100).toFixed(1) + '%' : '0%', opC: 'opf' + (opF && reserve < 0 ? ' over' : ''),
      };
      const fs = this.fbar || {};
      // 刚按下网：那截斜纹在原地烧掉（0.7 秒），油条同时缩过去；这期间不动它
      const burning = this.fburn > 0;
      if (!burning && this.fburnEnd) { this.fburnEnd = false; fs.opL = fs.opW = fs.opC = null; }
      if (bar.fill !== fs.fill) E.f_fill.style.width = bar.fill;
      if (bar.fillC !== fs.fillC) E.f_fill.className = bar.fillC;
      if (!burning) {
        if (bar.opL !== fs.opL) E.f_opf.style.left = bar.opL;
        if (bar.opW !== fs.opW) E.f_opf.style.width = bar.opW;
        if (bar.opC !== fs.opC) E.f_opf.className = bar.opC;
      } else { bar.opL = fs.opL; bar.opW = fs.opW; bar.opC = fs.opC; }
      this.fbar = bar;
      E.fuel.classList.toggle('low', lv >= 1);
      if (lv !== this.flv) {
        E.fuel.classList.toggle('lv1', lv === 1); E.fuel.classList.toggle('lv2', lv === 2);
        if (lv === 2) bump(E.f_fwarn, 'pop');
        this.flv = lv; this.rectT = 0;
      }
      this.reserve = reserve;
    }
    // 作业栏（A8）：作业时一直在，网在水下时也不收起——下网键换成“网在水下”和一根进度条，揭晓时随界面一起淡出、拉回后原地淡回来；
    // 只有换回航行才收起（以前每下一网都飞出去、飞回来，一趟进出 9 次）
    const opRun = !!(g.op && g.op.state !== 'done');
    const estOn = !E.est.classList.contains('tuck') && !E.est.classList.contains('leaving');
    const showEst = place === 'work' ? (!!g.est || (opRun && estOn)) : place === 'reveal' && estOn;
    if (opRun !== !!this.estBusy) {
      this.estBusy = opRun;
      E.est.classList.toggle('busy', opRun);
      // 收着的时候只是悄悄换过来；看得见时才演
      if (showEst && opRun) fxTag('A8', '作业栏不走：网在水下，下网键换成进度', 'A8est');
      else if (showEst) this.goBack = true;
    }
    // 下网键弹回来：网一落甲板就是揭晓，界面这时淡着；等界面淡回来（拉回以后）再弹，看得见
    if (this.goBack && !opRun && showEst && !this.root.classList.contains('revealing')) {
      this.goBack = false; this.goBackAt = performance.now(); bump(E.gobtn, 'back');
      fxTag('A8', '作业栏：网回来了，下网键回来', 'A8est');
    }
    if (opRun && showEst) {
      const tot = g.op.etaTotal || 1, rem = Math.max(0, g.op.eta());
      E.ebp.style.width = (Math.min(1, Math.max(0, 1 - rem / tot)) * 100).toFixed(1) + '%';
      if (numTick) { const bl = `网在水下 · <b>${rem.toFixed(0)}</b> 秒`; if (bl !== this.estBl) { E.ebl.innerHTML = bl; this.estBl = bl; } }
    }
    if (numTick && showEst && !opRun && g.est) {
      const e = g.est;
      const can = g.canDrop();
      const reserve = this.reserve || 0;
      // 下网要花的作业油（和燃油条上那截斜纹同一个数）；不够这一网时变红
      // 活物在网口附近时才给沉底秒数（掐时机用；和引线上的小方块一块一秒对得上）
      const live = g.creaturesNear(g.aim.x, g.aim.z, NET_R + 4).length > 0;
      const row = `<span>${IC.depth}<b>${e.depth.toFixed(1)}</b> m</span>${live && g.sink ? `<span>${IC.clock}<b>${g.sink.t.toFixed(1)}</b> 秒</span>` : ''}<span class="cost${reserve < 0 ? ' over' : ''}">${IC.fuel}<b>−${e.fuel.toFixed(1)}</b></span>`;
      // 为什么不能下、有什么要当心：一行（吊臂推到头时先说这个，水面上同时画出臂够得着的边）
      const lim = g.limitPush && g.time - g.limitPush.t < 1.6 ? g.limitPush.kind : null;
      const limT = { max: '够不着：开船挪近', min: '太近了', cabin: '驾驶室挡着：从船尾绕过去' }[lim];
      const pend = !can.ok && /吊臂还在转|船还在滑行|网架正在回位/.test(can.why || '');
      const why = [limT, ...e.issues]; if (!can.ok && can.why && !pend && !e.issues.includes(can.why)) why.push(can.why);
      const issues = why.filter(Boolean).length ? `<div class="issue">${why.filter(Boolean).join(' · ')}</div>` : '';
      const go = `${cap('A', dev)} 下网`;
      const goCls = 'gobtn' + (can.ok || pend ? '' : ' disabled') + (g.pendingDrop ? ' wait' : '') + (performance.now() - (this.goBackAt || -1e9) < 600 ? ' back' : '');
      if (row !== this.estRow) { E.erow.innerHTML = row; this.estRow = row; tag('est'); }
      if (issues !== this.estIss) { E.issues.innerHTML = issues; this.estIss = issues; }
      if (go !== this.estGo) { E.gobtn.innerHTML = go; this.estGo = go; }
      if (goCls !== E.gobtn.className) E.gobtn.className = goCls;
    }
    this.dock(E.est, showEst);
    // 底部那一行：刚发生的事说一下；没有的话，说眼前要玩家动手的（搁浅）
    this.sayT -= dt;
    let prompt = null;
    if (!paused && place === 'sail' && boat.grounded) prompt = { html: '搁浅：倒车或转向', kind: 'warn' };
    const s = this.sayT > 0 ? this.sayMsg : prompt;
    const sk = s ? s.kind + '|' + s.html : '';
    if (sk !== this.sayKey) {
      this.sayKey = sk;
      E.say.innerHTML = s ? s.html : ''; E.say.className = 'prompt ' + (s ? s.kind : ''); E.say.hidden = !s;
      if (s) bump(E.say, 'pop');
      this.rectT = 0;
    }
    // 回波测深（A8）：作业、网在水下、揭晓时一直在（揭晓时随界面一起淡出，拉回后原地淡回来，不再飞出去又飞回来）；
    // 航行时水深过 9 米亮起来，回到 7 米以内的浅水、连着 5 秒才收——不在深浅交界上进进出出（以前一趟进出 12 次）
    this.sampleSounder(paused ? 0 : dt, g);
    const depthHere = -g.world.surfaceTop(boat.x, boat.z);
    if (depthHere > 9) this.deepSail = true; else if (depthHere < 7) this.deepSail = false;
    const wantS = place !== 'sail' || this.deepSail || !!(g.lessons && g.lessons.sounderOn()); // 第一次看清沉船的预兆也叫它出来（F10）
    this.sIdle = wantS ? 0 : (this.sIdle || 0) + (paused ? 0 : dt);
    const sOn = !E.sounderWrap.classList.contains('tuck') && !E.sounderWrap.classList.contains('leaving');
    if (wantS && !sOn) { this.sWarm = 0; fxTag('A8', '测深面板亮起来，稳稳停住', 'A8snd'); }
    this.dock(E.sounderWrap, wantS || (sOn && this.sIdle < 5));
    // 深度数字慢慢滚到这一刻的读数；曲线每帧画（两次采样之间平滑地往左走）
    const last = this.sounderData[this.sounderData.length - 1];
    if (last) {
      const want = -last.top; this.depthShow = this.depthShow == null || Math.abs(want - this.depthShow) > 12 ? want : this.depthShow + (want - this.depthShow) * Math.min(1, dt * 7);
      const txt = this.depthShow.toFixed(1);
      if (txt !== this.sdTxt) { E.sdepth.textContent = txt; this.sdTxt = txt; }
      if (!!last.hard !== this.sdHard) { this.sdHard = !!last.hard; E.shead.classList.toggle('hard', this.sdHard); }
    }
    if (this.sWarm != null && this.sWarm < 1) this.sWarm += dt;
    if (!E.sounderWrap.classList.contains('tuck') && !this.root.classList.contains('revealing')) this.drawSounder();
    // 揭晓卡下的进度条：走完就拉回大视野
    const R = g.reveal.active;
    if (R && R.phase === 'show' && this.rbar) this.rbar.style.width = (Math.min(1, R.t / R.showDur) * 100).toFixed(1) + '%';
    // 右栏放不下就少摆几张结果卡（其余折成一个“+N”）
    if (numTick && g.cards && g.cards.length) this.fitCards(g);
  }
  // 东西飞进格子：一枚黄铜签从 from（舞台坐标）沿弧线飞到 toEl，落位时目标一闪、溅几点金星
  fly(from, toEl, cls = '', onLand = null, delay = 0, dur = 900) {
    if (!this.fx || !toEl || !from) return false;
    const el = h('div', 'flyer ' + cls, '');
    el.style.opacity = '0';
    this.fx.appendChild(el);
    const w = el.offsetWidth, hh = el.offsetHeight;
    const tr = this.layoutRect(toEl);
    if (tr.w < 1) { el.remove(); return false; }
    const sx = from.x - w / 2, sy = from.y - hh / 2, ex = tr.x + tr.w / 2 - w / 2, ey = tr.y + tr.h / 2 - hh / 2;
    // 二次贝塞尔弧线：先往上抛，再落进去
    const cx = (sx + ex) / 2 + (sy - ey) * 0.12, cy = Math.min(sy, ey) - 90 - Math.abs(ex - sx) * 0.08;
    const frames = [];
    for (let i = 0; i <= 10; i++) {
      const t = i / 10, u = 1 - t;
      const x = u * u * sx + 2 * u * t * cx + t * t * ex, y = u * u * sy + 2 * u * t * cy + t * t * ey;
      const sc = t < 0.15 ? 0.6 + t / 0.15 * 0.55 : 1.15 - (t - 0.15) / 0.85 * 0.7;
      frames.push({ transform: `translate(${x.toFixed(1)}px,${y.toFixed(1)}px) scale(${sc.toFixed(3)})`, opacity: t < 0.08 ? t / 0.08 : t > 0.92 ? 0.7 : 1 });
    }
    const a = el.animate(frames, { duration: dur, delay, easing: 'cubic-bezier(.45,.05,.55,.95)', fill: 'both' });
    a.onfinish = () => {
      el.remove();
      bump(toEl, toEl.classList.contains('panel') || toEl.classList.contains('rcard') ? 'flash' : 'bump');
      this.sparks(ex + w / 2, ey + hh / 2, cls.includes('p') ? 12 : 7);
      if (onLand) onLand();
    };
    setTimeout(() => { if (el.isConnected) { el.remove(); if (onLand) onLand(); } }, dur + delay + 600);
    return true;
  }
  sparks(x, y, n) {
    // 界面自己的随机数：不动全局 Math.random（玩法和机器人用它，界面的动画不能打乱那条序列）
    const rnd = () => ((this.fxSeed = ((this.fxSeed || 12345) * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < n; i++) {
      const s = h('div', 'spark'); this.fx.appendChild(s);
      const a = i / n * Math.PI * 2 + rnd() * 0.5, d = 26 + rnd() * 30;
      const an = s.animate([{ transform: `translate(${x}px,${y}px) scale(1.2)`, opacity: 1 }, { transform: `translate(${(x + Math.cos(a) * d).toFixed(1)}px,${(y + Math.sin(a) * d * 0.7 + 10).toFixed(1)}px) scale(.3)`, opacity: 0 }], { duration: 480 + rnd() * 200, easing: 'cubic-bezier(.2,.8,.4,1)' });
      an.onfinish = () => s.remove();
    }
  }
  // 飞进来 / 收起来：收起时先播一小段退场，再从排版里拿掉
  dock(el, on) {
    const shown = !el.classList.contains('tuck') && !el.classList.contains('leaving');
    if (on === shown) return;
    clearTimeout(el._dt);
    if (on) { el.classList.remove('tuck', 'leaving'); el.classList.add('entering'); el._dt = setTimeout(() => el.classList.remove('entering'), 330); }
    else { el.classList.remove('entering'); el.classList.add('leaving'); el._dt = setTimeout(() => { el.classList.remove('leaving'); el.classList.add('tuck'); this.rectT = 0; }, 270); }
    this.rectT = 0;
  }

  // —— 世界标记层：在场景画完之后画（要用这一帧的镜头）——
  drawOverlay(g, titleMode) {
    if (!g || titleMode) { this.overlay.clear(); return; }
    this.rectT = (this.rectT || 0) - 1;
    if (this.rectT <= 0) { this.rects = this.obstacleRects(); this.rectT = 8; }
    const modal = !this.el.haul.hidden;
    this.overlay.draw(g, this.rects, { hidden: g.hudHidden && this.ovlGone, modal });
  }
  // 界面上看得见的面板（舞台坐标）：世界标记要避开它们
  obstacleRects() {
    const out = [];
    const hr = this.root.getBoundingClientRect();
    const s = hr.width / 1920 || 1;
    const sel = '.panel, .prompt, .rcard, .cards .more, .demo-banner, .reveal.on .card, .mcard, .pcard';
    const faded = this.root.classList.contains('revealing'); // 揭晓时界面层整层淡出：留在原地的面板（A8）不挡世界标记
    for (const el of this.root.querySelectorAll(sel)) {
      if (el.hidden || el.classList.contains('tuck') || !el.offsetParent) continue;
      if (faded && el.closest('.layer')) continue;
      const r = el.getBoundingClientRect();
      if (r.width < 1 || r.height < 1) continue;
      out.push({ x: (r.left - hr.left) / s, y: (r.top - hr.top) / s, w: r.width / s, h: r.height / s });
    }
    if (this.root.classList.contains('revealing')) { const lb = this.root.classList.contains('rv-p') ? 92 : 30; out.push({ x: 0, y: 0, w: 1920, h: lb }, { x: 0, y: 1080 - lb, w: 1920, h: lb }); }
    return out;
  }

  sampleSounder(dt, g) {
    this.sT = (this.sT || 0) + dt;
    if (this.sT < 0.08) return;
    this.sT = 0;
    const boat = g.boat;
    let px = boat.x, pz = boat.z;
    if (g.mode === 'work' && !g.op) { const t = boat.tipWorld({ x: 0, z: 0, set(x, y, z) { this.x = x; this.z = z; return this; } }, boat.targetYaw, boat.targetReach); px = t.x; pz = t.z; }
    if (g.op) { px = g.op.x; pz = g.op.z; }
    const top = g.world.surfaceTop(px, pz);
    const s = { top, hard: g.world.surfaceKind(px, pz), moving: [], mw: [], solid: [] };
    // 在动的东西（A8）：像真的回声测深仪——声波是一个往下张开的锥，锥里的每条鱼、每只蟹回一个“斜着量的距离”。
    // 一条鱼从锥边游到正下方再游出去，距离先变短再变长，屏上自己就画出一道拱；一群鱼是一团深浅不一的短线
    const ping = (x, y, z) => {
      const h = Math.max(0.3, -y), r = Math.hypot(x - px, z - pz), cone = 0.5 + h * 0.42;
      // 回波有的回来、有的没回来，亮暗也不一样（一群鱼是一团闪着的点，不是一块实心的条）
      if (r < cone && s.moving.length < 10 && Math.random() > 0.4) { s.moving.push(-Math.hypot(h, r)); s.mw.push((1 - r / cone) * (0.45 + 0.55 * Math.random())); }
    };
    for (const r of g.world.regions.values()) {
      if (Math.hypot(r.reg.cx - px, r.reg.cz - pz) > 200) continue;
      for (const c of r.creatures) {
        if (c.kind === 'school') {
          const [cx, cz] = c.center(); if (Math.hypot(cx - px, cz - pz) > c.radius + 8) continue;
          if (c.pos) for (const p of c.pos) ping(p.x, p.y, p.z); else ping(cx, top + c.spec.depthOff + 0.5, cz);
        } else if (c.position && !c.captured) { const p = c.position(); ping(p.x, p.y + 0.3, p.z); }
      }
    }
    if (g.op && g.op.y < 0) s.net = g.op.y - 1.0;
    if (g.lessons) g.lessons.sounderEcho(s); // F10 预兆：海底线上鼓起的那个包
    // 量程：平常按脚下的水深自动换（A8，drawSounder）；F10 预兆时固定换到 14 米，慢慢换过去
    this.sForce = (g.lessons && g.lessons.sounderRange()) || 0;
    this.sounderData.push(s);
    this.sounderSeq = (this.sounderSeq || 0) + 1;
    if (this.sounderData.length > 150) this.sounderData.shift();
  }
  drawSounder() {
    const [x, W, H] = this.ctx2d(this.el.sounder);
    const k = (this.canvasK.get(this.el.sounder) || { k: 1 }).k;
    // 自动量程（A8）：像真的测深仪，屏上的刻度跟着脚下的水深放大缩小（10–34 米，5 米一档，慢慢换过去）；
    // 浅水里海底、鱼、网才分得开。作业极限的红线在量程里才画
    const D = this.sounderData, n = D.length;
    let deep = 0; for (const s of D) { deep = Math.max(deep, -s.top); if (s.net != null) deep = Math.max(deep, -s.net); }
    // 第一次看清沉船的预兆（F10）要一个固定的浅量程（14 米），海底线落到中间、那个包才有地方鼓起来
    const want = this.sForce || Math.max(10, Math.min(34, Math.ceil((deep * 1.25 + 2) / 5) * 5));
    const now = performance.now(), ddt = Math.min(0.1, (now - (this.sRangeT || now)) / 1000); this.sRangeT = now;
    this.sRange = this.sRange == null || this.sWarm < 0.5 ? want : this.sRange + (want - this.sRange) * Math.min(1, ddt * 2.5);
    const maxD = this.sRange;
    // 老式回波屏：深青绿的荧光底，暗格线，回波线带一点辉光，扫描线，最右边一道正在写的亮线
    const bg = x.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#062019'); bg.addColorStop(1, '#020b09');
    x.fillStyle = bg; x.fillRect(0, 0, W, H);
    const colW = W / 150;
    // A8：两次采样之间按时间往左挪（曲线一直平平地往左走，不是一格一格跳）；最新的一列一直接到右边那道笔上
    const shift = Math.min(1, (this.sT || 0) / 0.08) * colW;
    const X = (i) => W - (n - i) * colW - shift;
    const scroll = (this.sounderSeq || 0) % 25;
    x.fillStyle = 'rgba(110,220,180,0.10)';
    for (let d = 5; d < maxD; d += 5) { const y = Math.round(d / maxD * H); x.fillRect(0, y, W, 1); }
    for (let i = -scroll; i < 150; i += 25) x.fillRect(W - (150 - i) * colW - shift, 0, 1, H);
    const Y = (s) => Math.min(H, -s.top / maxD * H);
    // 海底下面的回波（越往下越淡），再画海底线
    if (n) {
      x.beginPath(); x.moveTo(X(0), H);
      D.forEach((s, i) => { x.lineTo(X(i), Y(s)); x.lineTo(i === n - 1 ? W : X(i + 1), Y(s)); });
      x.lineTo(W, H); x.closePath();
      const eg = x.createLinearGradient(0, 0, 0, H); eg.addColorStop(0, 'rgba(120,200,160,0.42)'); eg.addColorStop(1, 'rgba(60,120,100,0.08)');
      x.fillStyle = eg; x.fill();
    }
    x.save(); x.shadowBlur = 6 * k; x.lineWidth = 2.5; x.lineCap = 'square';
    for (const hard of [false, true]) {
      x.strokeStyle = hard ? '#f0dc90' : '#86e0b8'; x.shadowColor = hard ? 'rgba(255,220,120,.8)' : 'rgba(110,240,180,.7)';
      x.beginPath(); let pen = false;
      D.forEach((s, i) => { const x0 = X(i), y0 = Y(s); if (!!s.hard !== hard) { pen = false; return; } if (!pen) { x.moveTo(x0, y0); pen = true; } else x.lineTo(x0, y0); x.lineTo(i === n - 1 ? W : x0 + colW, y0); });
      x.stroke();
    }
    // 第一次看清沉船的预兆（F10）：海底线上鼓起一个琥珀色的包，最新那一列一闪一闪
    if (D.some((s) => s.echo != null)) {
      x.shadowColor = 'rgba(255,190,90,.9)';
      D.forEach((s, i) => {
        if (s.echo == null) return;
        const x0 = X(i), cw = (i === n - 1 ? W : X(i + 1)) - x0 + 0.5, y0 = Y(s), y1 = Math.max(2, -s.echo / maxD * H), ek = s.echoK * (i === n - 1 ? 0.75 + 0.25 * Math.sin(performance.now() / 90) : 1);
        x.fillStyle = `rgba(255,170,60,${(0.5 * ek).toFixed(3)})`; x.fillRect(x0, y1, cw, Math.max(0, y0 - y1));
        x.fillStyle = `rgba(255,214,130,${(0.95 * ek).toFixed(3)})`; x.fillRect(x0, y1 - 1, cw, 2.5);
      });
    }
    // 在动的东西（A8）：每个回波是这一列上的一小段亮线，越靠锥的正中越亮；一列一列连起来，游过去的鱼就是一道拱
    x.shadowColor = 'rgba(150,240,255,.9)'; x.shadowBlur = 2 * k;
    D.forEach((s, i) => {
      if (!s.moving.length) return;
      const x0 = X(i), w = Math.max(1.2, ((i === n - 1 ? W : X(i + 1)) - x0) * 0.8);
      s.moving.forEach((m, j) => {
        const a = 0.35 + 0.65 * (s.mw ? s.mw[j] : 1);
        x.fillStyle = `rgba(190,248,255,${a.toFixed(2)})`;
        x.fillRect(x0, -m / maxD * H - 0.7, w, 1.4);
      });
    });
    // 网：一道白线跟着它往下、往上；正在写的那一列上一个亮点，看得出网这会儿在哪
    x.shadowColor = 'rgba(255,255,255,.9)'; x.fillStyle = '#ffffff';
    D.forEach((s, i) => { if (s.net != null) x.fillRect(X(i), -s.net / maxD * H, (i === n - 1 ? W : X(i + 1)) - X(i) + 0.5, 1.5); });
    if (n && D[n - 1].net != null) { const y = -D[n - 1].net / maxD * H; x.beginPath(); x.arc(W - 4, y + 0.75, 3, 0, Math.PI * 2); x.fill(); }
    x.restore();
    // 作业极限：红色虚线，刻度写成红色的 28
    if (MAX_DEPTH < maxD) {
      x.strokeStyle = 'rgba(255,100,70,0.85)'; x.lineWidth = 1.5; x.setLineDash([6, 4]);
      x.beginPath(); x.moveTo(0, MAX_DEPTH / maxD * H); x.lineTo(W, MAX_DEPTH / maxD * H); x.stroke(); x.setLineDash([]);
    }
    // 深度刻度（米）
    x.font = `600 10px ${FONT}`; x.fillStyle = 'rgba(150,220,190,0.55)'; x.textBaseline = 'middle'; x.textAlign = 'left';
    const step = maxD > 18 ? 10 : 5;
    for (let d = step; d < maxD - 1.5; d += step) if (Math.abs(d - MAX_DEPTH) > 3) x.fillText(String(d), 3, d / maxD * H - 6);
    if (MAX_DEPTH < maxD) { x.fillStyle = 'rgba(255,130,100,0.9)'; x.fillText(String(MAX_DEPTH), 3, MAX_DEPTH / maxD * H - 6); }
    // 正在写的那一列：一道亮线往左拖出余晖
    const sw = x.createLinearGradient(W - 26, 0, W, 0); sw.addColorStop(0, 'rgba(160,255,210,0)'); sw.addColorStop(1, 'rgba(180,255,220,0.28)');
    x.fillStyle = sw; x.fillRect(W - 26, 0, 26, H); x.fillStyle = 'rgba(210,255,235,0.75)'; x.fillRect(W - 1.5, 0, 1.5, H);
    // 扫描线与暗角
    x.fillStyle = 'rgba(0,0,0,0.22)'; for (let y = 0; y < H; y += 3) x.fillRect(0, y, W, 1);
    const vg = x.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, W * 0.62); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.45)');
    x.fillStyle = vg; x.fillRect(0, 0, W, H);
    // 刚亮起来（A8）：像老式荧光屏开机——先是正中一道亮线横着拉开，再上下撑开、闪一下，曲线就在那里了
    const wu = this.sWarm != null ? this.sWarm / 0.5 : 1;
    if (wu < 1) {
      x.fillStyle = '#010605';
      if (wu < 0.4) {
        const v = wu / 0.4; x.fillRect(0, 0, W, H);
        x.fillStyle = 'rgba(200,255,230,0.95)'; x.fillRect(W / 2 * (1 - v), H / 2 - 1, W * v, 2);
      } else {
        const v = (wu - 0.4) / 0.6, e = 1 - Math.pow(1 - v, 3), hh = H / 2 * e;
        x.fillRect(0, 0, W, H / 2 - hh); x.fillRect(0, H / 2 + hh, W, H / 2 - hh);
        x.fillStyle = `rgba(190,255,225,${(0.3 * (1 - v)).toFixed(3)})`; x.fillRect(0, H / 2 - hh, W, hh * 2);
        x.fillStyle = 'rgba(200,255,230,0.8)'; x.fillRect(0, H / 2 - hh - 1, W, 1.5); x.fillRect(0, H / 2 + hh - 0.5, W, 1.5);
      }
    }
  }
  // precious：珍贵的一网黑边宽（92 像素）；普通的一网只是细细两道（B23：每网都有的事不摆“大事来了”的架势）
  setRevealMode(on, precious = false) {
    tag('revealMode');
    if (!on && this.root.classList.contains('revealing')) fxTag('B23', '看宝结束：细线收回正中，黑边退出去');
    this.root.classList.toggle('revealing', on); this.root.classList.toggle('rv-p', on && precious); this.rectT = 0;
    // 揭晓开始：还在飞的签收掉（目标面板这时藏着，不让几枚签在近景上飞成一片）
    if (on && this.fx) for (const f of this.fx.querySelectorAll('.flyer')) f.remove();
  }
  // 揭晓：名字、价值筹码（从 0 滚上去，同网的东西一件件弹进来时再往上加）、同网的几样一行、走完就拉回大视野的进度条
  showReveal(d) {
    tag('showReveal');
    const E = this.el;
    const comps = d.companions.length ? `<div class="comps">${d.companions.map((c) => `<span class="comp">${c.name}${c.n > 1 ? ' ×' + c.n : ''}</span>`).join('')}</div>` : '';
    E.reveal.className = 'reveal on ' + (d.precious ? 'precious' : 'normal');
    E.reveal.innerHTML = `<div class="card">
      <div class="name">${d.title}</div>
      <div class="val">${IC.coin}<b>+${fmt(d.value)}</b></div>
      ${comps}
      <div class="rbarw"><div class="rbar"></div></div>
    </div>`;
    this.rbar = E.reveal.querySelector('.rbar');
    fitText(E.reveal.querySelector('.name'), 30);
    // 价值筹码从 0 滚到主件的价值；同网的东西弹进来以后滚到这一网的合计
    const chip = E.reveal.querySelector('.val b');
    const d1 = d.precious ? 420 : 200, t1 = d.precious ? 900 : 650;
    countUp(chip, 0, d.value, t1, d1, (v) => '+' + fmt(v));
    if (d.total > d.value) countUp(chip, d.value, d.total, 600, Math.max(1050, d1 + t1 + 80), (v) => '+' + fmt(v), true);
    this.revealInfo = { title: d.title, precious: d.precious, value: d.total };
    this.rectT = 0;
  }
  hideReveal() {
    const E = this.el;
    // 拉回大视野那一刻：一枚签从展示铭牌飞向右边的结果卡（卡片随后滑进来）
    const nm = E.reveal.querySelector('.name');
    if (nm && this.revealInfo && E.reveal.classList.contains('on')) {
      const r = this.stageRect(nm);
      this.pendingFly = { from: { x: r.x + Math.min(r.w, 260) / 2, y: r.y + r.h / 2 }, ...this.revealInfo, at: performance.now() };
      this.flyHold = performance.now() + 1300;
    }
    E.reveal.classList.remove('on'); E.reveal.classList.add('off'); this.rbar = null; this.rectT = 0;
  }
  // 排版位置（不算正在播放的飞入动画）：目标卡片还在滑进来时，签就往它最后停的地方飞
  layoutRect(el) {
    let x = 0, y = 0, e = el;
    if (!el.offsetParent) return { x: 0, y: 0, w: 0, h: 0 };
    while (e && e !== this.root && e.id !== 'stage') { x += e.offsetLeft; y += e.offsetTop; e = e.offsetParent; }
    return { x, y, w: el.offsetWidth, h: el.offsetHeight };
  }
  stageRect(el) { const hr = this.root.getBoundingClientRect(), s = hr.width / 1920 || 1, r = el.getBoundingClientRect(); return { x: (r.left - hr.left) / s, y: (r.top - hr.top) / s, w: r.width / s, h: r.height / s }; }
  fitCards(g) {
    const limit = 1080 - 24;
    const r = this.stageRect(this.el.right);
    const n = this.cardMax || 3;
    if (r.y + r.h > limit && n > 1) { this.cardMax = n - 1; this.cardsSig = null; this.setCards(g.cards); }
    else if (n < 3 && r.y + r.h < limit - 120) { this.cardMax = n + 1; this.cardsSig = null; this.setCards(g.cards); }
  }
  // 结果卡：每一网之后一张，停在右边，点一下（或 C / Ⓑ）才收起；按右栏的空间摆一到三张，其余折成一个“+N”
  // 卡上只有：是什么、得了多少；空网写为什么空
  setCards(cards) {
    const E = this.el;
    const n = this.cardMax || 3;
    const sig = n + ':' + cards.map((c) => c.id).join(',');
    if (sig === this.cardsSig) return;
    this.seenCards = this.seenCards || new Set();
    const fresh = new Set(cards.filter((c) => !this.seenCards.has(c.id)).map((c) => c.id));
    for (const c of cards) this.seenCards.add(c.id);
    this.cardsSig = sig;
    const shown = cards.slice(-n).reverse();
    // 收起的卡（B22）：留一个影子往右一弹甩出去（一次收几张的一张接一张）；留下的卡、“+N”、下面的合计记住现在的位置，换完以后从原来的地方滑过去补上空位
    const keep = new Set(shown.map((c) => String(c.id)));
    let gone = 0;
    for (const el of E.cards.querySelectorAll('.rcard')) if (!keep.has(el.dataset.card)) ghostOut(el, 'flick', 45 * gone++);
    const was = new Map();
    for (const el of E.cards.querySelectorAll('[data-card]')) was.set(el.dataset.card, this.stageRect(el).y);
    const tallyWas = E.tally.classList.contains('tuck') ? null : this.stageRect(E.tally).y;
    const moreWas = E.cards.querySelector('.more');
    const moreN = moreWas ? moreWas.textContent : null;
    E.cards.innerHTML = shown.map((c) => {
      const body = c.kind === 'empty'
        ? `<div class="rn">${c.title}</div>${c.hazard ? `<div class="rd">${IC.hazard}</div>` : c.note ? `<div class="rd">${c.note}</div>` : ''}`
        : `<div class="rn">${c.title}</div><div class="rv">${IC.coin}<b>+${fmt(c.total)}</b></div>`;
      return `<div class="rcard clickable ${c.kind === 'empty' ? 'empty' : ''} ${c.precious ? 'precious' : ''} ${fresh.has(c.id) ? 'fresh' : ''}" data-card="${c.id}">${body}<i class="x">×</i></div>`;
    }).join('') + (cards.length > n ? `<div class="more clickable" data-card="all">+${cards.length - n}<i class="x">×</i></div>` : '');
    for (const el of E.cards.querySelectorAll('.rcard .rn')) fitText(el, 16);
    if (gone) {
      const slide = (el, y0) => { if (y0 == null) return; const dy = y0 - this.stageRect(el).y; if (Math.abs(dy) > 1) el.animate([{ transform: `translateY(${dy.toFixed(1)}px)` }, { transform: 'none' }], { duration: 320, delay: 40, easing: 'cubic-bezier(.3,1.32,.45,1)', fill: 'backwards' }); };
      for (const el of E.cards.querySelectorAll('[data-card]')) {
        if (was.has(el.dataset.card)) slide(el, was.get(el.dataset.card));
        // 原来折在“+N”里的那张：从上面轻轻落到空出来的位置
        else if (!el.classList.contains('fresh')) el.animate([{ transform: 'translateY(-14px)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 300, delay: 90, easing: 'cubic-bezier(.3,1.2,.45,1)', fill: 'backwards' });
      }
      if (tallyWas != null) slide(E.tally, tallyWas);
      const more = E.cards.querySelector('.more'); if (more && moreN != null && more.textContent !== moreN) bump(more, 'bump');
    }
    E.cards.onclick = (ev) => { const el = ev.target.closest('[data-card]'); if (el && this.onCard) this.onCard(el.dataset.card === 'all' ? 'all' : Number(el.dataset.card)); };
    // 新卡：得的数滚上去；刚揭晓的那一网，一枚签从展示铭牌飞进这张卡，签落进卡里的那一刻数才开始滚（B20）
    for (const c of shown) {
      if (!fresh.has(c.id)) continue;
      const el = E.cards.querySelector(`.rcard[data-card="${c.id}"]`);
      if (!el) continue;
      const P = this.pendingFly;
      const flies = !!(P && P.title === c.title && performance.now() - P.at < 1500);
      const roll = flies ? 1000 : 250;
      if (c.kind !== 'empty') countUp(el.querySelector('.rv b'), 0, c.total, 700, roll, (v) => '+' + fmt(v));
      // 签落进卡里那一下“叮”，金额往上滚的时候细细地“嗒”几下（B20）
      const au = this.g && this.g.audio;
      if (flies) {
        this.pendingFly = null;
        this.fly(P.from, el.querySelector('.rn') || el, 'tok' + (P.precious ? ' p' : ''), () => { this.flyHold = 0; }, 120);
        if (c.kind !== 'empty' && au) setTimeout(() => { if (el.isConnected) au.play('tally', { precious: c.precious }); }, 1000);
      } else if (c.kind !== 'empty' && au) setTimeout(() => { if (el.isConnected) au.play('tally', { precious: c.precious }); }, 250);
      if (c.kind !== 'empty') {
        fxTag('B20', flies ? '结果卡入账：签飞进卡里，金额滚上去' : '结果卡入账：金额滚上去', 'B20');
        // 数滚完：一枚小币从卡上跳进这一趟的合计
        const trip = this.g && this.g.trip;
        if (trip) setTimeout(() => this.tallyCoin(el, c, trip.total, trip.items.length), roll + 760);
      }
    }
    this.rectT = 0;
  }
  // 一枚小币从结果卡跳进这一趟的合计（合计这时候才露出来，滚上去，几秒后自己收起）
  tallyCoin(card, c, total, n) {
    const E = this.el, T = E.tally;
    if (!this.g || this.g.ended) return;
    // 卡已经收起来了（按得快）：合计悄悄记上，不跳币、不出声
    if (!card.isConnected) { this.tallyShown = this.tallyLanded = total; this.tallyN = n; return; }
    const from = card.querySelector('.rv .ic') || card;
    const fr = this.stageRect(from);
    clearTimeout(this.tallyT);
    if (T.classList.contains('tuck') || T.classList.contains('leaving')) {
      T.querySelector('.tn').textContent = (this.tallyN || 0) + ' 件';
      T.querySelector('.tv b').textContent = fmt(this.tallyShown || 0);
    }
    this.dock(T, true);
    T.classList.toggle('p', !!c.precious);
    const old = this.tallyShown || 0;
    this.tallyShown = total; this.tallyN = n;
    const land = () => {
      if (!T.isConnected) return;
      T.querySelector('.tn').textContent = n + ' 件';
      this.tallyLanded = total;
      countUp(T.querySelector('.tv b'), old, total, 520, 0);
      bump(T, 'flash'); bump(T.querySelector('.tv .ic'));
      this.g && this.g.audio && this.g.audio.play('tallyChip');
      fxTag('B20', '结果卡入账：小币跳进这一趟的合计', 'B20');
      this.tallyT = setTimeout(() => this.dock(T, false), 4200);
    };
    // 合计刚滑进来：等它落位再跳过去
    setTimeout(() => { if (!this.fly({ x: fr.x + fr.w / 2, y: fr.y + fr.h / 2 }, T.querySelector('.tv .ic'), 'coin' + (c.precious ? ' p' : ''), land, 0, 560)) land(); }, 260);
  }
  // 收获单（C11）：这一趟捞上的每一件一行行滑进来（同名的合并成“×n”），总价滚上去盖章；“再来一次”亮了以后按一下再来一次。
  // 拍子由 settle 定（r.plan），每帧在 update 里往下走；点单子（还没亮）= 跳到盖章
  showHaul(r) {
    tag('haul');
    const E = this.el;
    clearTimeout(this.tallyT); E.tally.classList.add('tuck');
    this.sheet.show(r, r.plan, { coin: IC.coin, key: cap('A', this.dev) });
    E.haul.hidden = false;
    E.haul.onclick = (ev) => { const b = ev.target.closest('button, .pcard'); if (b && guard(b) && this.onRestart) this.onRestart(); };
    this.rectT = 0;
  }
  hideHaul() { this.sheet.hide(); this.el.haul.hidden = true; this.el.haul.className = 'modal haul'; this.el.haul.innerHTML = ''; this.rectT = 0; }
  showPause() {
    const E = this.el;
    E.pause.innerHTML = `<div class="mcard pause">
      <div class="mh">暂停</div>
      <button data-a="resume">继续</button>
      <button data-a="help">操作说明</button>
      <button data-a="settings">设置</button>
      <button data-a="end">结束这一趟</button>
      <button data-a="title">回到标题</button></div>`;
    clearTimeout(this.pauseT); E.pause.classList.remove('out');
    E.pause.hidden = false;
    E.pause.dataset.sel = 0;
    E.pause.querySelector('button').classList.add('sel');
    E.pause.onclick = (ev) => { const b = ev.target.closest('button'); if (b && guard(b) && this.onPauseAction) this.onPauseAction(b.dataset.a); };
    this.root.classList.add('paused');
    // 世界停住了（D2）：画面在 0.45 秒里压暗、褪掉大半颜色（界面不褪），卡片从下面升上来、几个按钮一个接一个滑进来
    if (this.root.parentElement) this.root.parentElement.classList.add('held');
    fxTag('D2', '暂停：世界停住，压暗褪色，卡片升起', 'D2');
    this.keysT = 0;
    this.rectT = 0;
  }
  hidePause(instant = false) {
    const E = this.el;
    if (!E.pause.hidden && !E.pause.classList.contains('out')) {
      if (!instant) ghostOut(E.pause.querySelector('.mcard'));
      fxTag('D2', '继续：暗幕淡开，颜色回来，世界接着动', 'D2');
    }
    // 卡片先拿掉（键盘、手柄不再落在它上面），暗幕留 0.26 秒淡开
    E.pause.innerHTML = '';
    clearTimeout(this.pauseT);
    if (instant || E.pause.hidden) { E.pause.hidden = true; E.pause.classList.remove('out'); }
    else { E.pause.classList.add('out'); this.pauseT = setTimeout(() => { E.pause.hidden = true; E.pause.classList.remove('out'); }, 260); }
    for (const m of this.root.querySelectorAll('.modal.sub')) m.remove(); // 从暂停里打开的设置、说明一起关上
    if (this.root.parentElement) this.root.parentElement.classList.remove('held', 'peek');
    this.root.classList.remove('paused', 'peek'); this.rectT = 0;
  }
}

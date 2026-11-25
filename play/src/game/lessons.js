// 第十三批「第一次（下）」：F6 第一件珍品、F7 第一次被拒、F8 第一次搁浅、F9 第一次空网、F10 第一次看清沉船（S5）。
// 第一次比平常高一档，只放一次：记在这一页里（再来一次也不重来）；自动演示里放的不算数（演示自己记一份，接管以后玩家还会看到第一次）。
// 放没放过和第十二批 F1–F5 记在同一份里（firsts.js 的 FIRSTS，键名 F6、F7:原因、F8、F9、F10）。
// 这里管“是不是第一次”和 F7 F8 F9 的短字、F9 的耸肩；F6 的金色空位在 goldslot.js，F10 的整套在 wrecksight.js。
// 挂到游戏上的地方尽量少：game.js 里建一个、每帧推一下、被拒的三处各报一声、镜头那里让 F10 借一下；
// 空网、珍品、沉船都是这里自己看游戏的状态（新出的空网卡、揭晓走到哪、地点什么时候“看清”），不改那几段。
import * as THREE from 'three';
import { Notes, stageOf } from '../ui/notes.js';
import { cap } from '../ui/keys.js';
import { fxTag } from '../fx/tags.js';
import { BOAT } from './boat.js';
import { GoldSlot } from './goldslot.js';
import { WreckSight } from './wrecksight.js';
import { FIRSTS } from './firsts.js';

const NOTES = new WeakMap();     // 每个界面一层短字（界面跨局留着，游戏每局新建）

// 空网的宽慰：按为什么空说一句（都很短，说完就散）
const COMFORT = { buried: '埋太深了，换一处', edge: '差一点，挪挪再来', none: '没事，下一网！' };

export class Lessons {
  constructor(g) {
    this.g = g;
    const root = g.hud && g.hud.root;
    if (root) { if (!NOTES.has(root)) NOTES.set(root, new Notes(root)); this.notes = NOTES.get(root); this.notes.clear(); this.notes.avoid = () => (g.hud.overlay && g.hud.overlay.obst) || []; } else this.notes = null;
    this.cardSeq = g.cardSeq || 0;
    this.shrug = null;
    this.slot = new GoldSlot(g, this);
    this.wreck = new WreckSight(g, this);
  }
  // 是不是第一次（是的话记下）；seen 是现在这一份（演示 / 玩家）的记录，效果单、测试用它摆“放过 / 没放过”
  get seen() { return FIRSTS.set(this.g); }
  first(key) { return FIRSTS.take(key, this.g); }
  has(key) { return FIRSTS.has(key, this.g); }
  update(dt) {
    this.watchEmpty();
    this.updateShrug(dt);
    this.slot.update(dt);
    this.wreck.update(dt);
    if (this.notes) this.notes.update(dt);
  }
  // 镜头：F10 爆发时借一下（game.updateCamera 在玩家的取景算好以后调）
  frame(want, look, dt, inp) { this.wreck.frame(want, look, dt, inp); }
  // 测深仪：F10 的预兆要它出来、要在曲线上画那个包（hud.js 问）
  sounderOn() { return this.wreck.sounderOn(); }
  sounderEcho(s) { this.wreck.echo(s); }
  sounderRange() { return this.wreck.sounderRange(); }

  // —— 世界里一点 / 界面上一块 → 舞台坐标 ——
  atWorld(x, y, z) { const g = this.g; return () => stageOf(g.view.camera, x, y, z); }
  atEl(el, fx = 0.5, fy = 0) {
    const h = this.g.hud;
    return () => { if (!el || !el.isConnected) return null; const r = h.stageRect(el); if (r.w < 1 || r.x > 1920 || r.y > 1080 || r.x + r.w < 0) return null; return { x: r.x + r.w * fx, y: r.y + r.h * fy }; };
  }
  keys(s) { const d = this.g.hud && this.g.hud.dev; return s.replace(/\{(\w+)\}/g, (m, a) => cap(a, d)); }

  // —— F7 第一次被拒：除了按原因响的那一声，在出问题的地方写一句为什么（每种原因各一次） ——
  // kind：key 按了这时用不上的键 / busy 网还在水下又按下网 / reach 落点不行 / fuel 油不够这一网
  deny(kind, info = {}) {
    const g = this.g, H = g.hud, E = H && H.el;
    if (!this.notes || !E) return;
    let html = null, at = null, place = 'above';
    if (kind === 'key') {
      // 按错键：看现在在干什么，指着能等的那样东西说
      const R = g.reveal.active;
      // 收获单按拍子出来（C11）：“再来一次”亮起来以前按 Ⓐ 是跳到盖章，这时只响一声；这句留到按 Ⓐ 就是再来一次的时候
      if (g.ended) { if (!E.haul || !E.haul.classList.contains('lit')) return; const b = E.haul.querySelector('button'); html = this.keys('这一趟收工了 · {A} 再来一次'); at = this.atEl(b, 0.5, 1); place = 'below'; }
      else if (R && R.phase === 'wash') { html = this.keys('正在冲洗 · {A} 冲快点'); at = () => ({ x: 960, y: 870 }); place = 'free'; }
      else if (R && R.phase === 'show') { const bar = E.reveal && E.reveal.querySelector('.rbarw'); html = '看完自动回到大景'; at = this.atEl(bar, 0.5, 1); place = 'below'; }
      // 没有卡时按 C：写在右边结果卡平常排着的地方
      else if (!g.cards.length) { html = '没有要收的结果卡'; const fr = this.atEl(E.fuel, 0.5, 1); at = () => { const p = fr(); return p ? { x: 1920 - 28 - 220, y: p.y + 56 } : { x: 1920 - 248, y: 180 }; }; place = 'free'; }
      else return;
    } else if (kind === 'busy') {
      const op = g.op; if (!op) return;
      html = '网还在水下 · 等它上来'; at = this.atWorld(op.x, 0.4, op.z);
    } else if (kind === 'reach') {
      const w = info.why || '';
      html = /浅/.test(w) ? '这里太浅 · 往深处挪' : /深/.test(w) ? '超过 28 米 · 往浅处挪' : /船上方|自己/.test(w) ? '压着自己的船 · 挪远一点' : w;
      at = this.atWorld(g.aim.x, 0.3, g.aim.z);
    } else if (kind === 'fuel') {
      const need = g.est ? g.est.fuel : 0, have = g.boat.fuel;
      html = `这一网要 <b>${need.toFixed(1)}</b> · 只剩 <b>${Math.max(0, have).toFixed(1)}</b>`;
      at = this.atEl(E.fuel, 0.5, 1); place = 'below';
    }
    if (!html || !at) return;
    if (!this.first('F7:' + kind)) return;
    this.notes.add({ cls: 'deny', html, at, place, life: 2.8, gap: kind === 'key' && g.ended ? 26 : 14, from: 0.7, shakeAt: 0.05 });
    fxTag('F7', '第一次被拒·写出为什么（' + { key: '按错键', busy: '网在水下', reach: '落点不行', fuel: '油不够' }[kind] + '）', 'F7first');
  }

  // —— F8 第一次搁浅：W3 一整套之后，船头撞的那一点上压出一句“船底刮到沙了” ——
  // shoalwatch.impact 在 W3 真的演了（不是慢慢蹭上去、也不是刚撞过又顶）时报过来；k 撞得多狠（0–1），dir 船头还是船尾
  ground(k, dir) {
    const g = this.g;
    if (!this.notes || !this.first('F8')) return;
    const b = g.boat;
    // 跟着船头走（船还会往后滑一点）：每帧按船现在的位置算
    const at = () => stageOf(g.view.camera, b.x + Math.sin(b.heading) * dir * 6.4, 1.6, b.z + Math.cos(b.heading) * dir * 6.4);
    const n = this.notes.add({
      cls: 'scrape', html: '船底刮到沙了', at, place: 'above', life: 3.4, gap: 34, from: 1.6, shakeAt: 0.2, avoid: true,
      // 砸下来时歪着，落定后摆正一点；落定那一下四周崩出一把沙粒
      tick: (q) => { q.el.style.setProperty('--rot', (-4 + 2.5 * Math.min(1, q.t / 0.3)).toFixed(2) + 'deg'); if (!q.dust && q.t >= 0.12) { q.dust = true; this.grit(q); } },
    });
    n.t = -0.28; // 镜头顿完、沙雾腾起来以后再压下来
    fxTag('F8', '第一次搁浅·“船底刮到沙了”', 'F8');
  }

  // 沙粒：从牌子底边往两边、往下崩开（界面上的小方块，动画按虚拟时钟走）
  grit(q) {
    const box = this.notes.el, m = /translate\(([-\d.]+)px,([-\d.]+)px\)/.exec(q.el.style.transform || '');
    if (!m) return;
    const x0 = +m[1], y0 = +m[2] + q.h, rnd = (i) => ((Math.sin(i * 12.9898 + this.g.time * 3.1) * 43758.5453) % 1 + 1) % 1;
    for (let i = 0; i < 16; i++) {
      const d = document.createElement('i'); d.className = 'grit'; box.appendChild(d);
      const sx = x0 + q.w * (0.08 + 0.84 * rnd(i)), side = sx < x0 + q.w / 2 ? -1 : 1, dx = side * (20 + 50 * rnd(i + 7)), dy = 8 + 34 * rnd(i + 3), s = 0.6 + 0.8 * rnd(i + 11);
      const a = d.animate([{ transform: `translate(${sx}px,${y0 - 6}px) scale(${s})`, opacity: 1 }, { transform: `translate(${sx + dx}px,${y0 + dy}px) scale(${s * 0.5})`, opacity: 0 }], { duration: 420 + 260 * rnd(i + 5), easing: 'cubic-bezier(.2,.7,.4,1)', fill: 'forwards' });
      a.onfinish = () => d.remove();
    }
  }

  // —— F9 第一次空网：倒出一摊泥水，离得最近的人看了一眼、耸耸肩“嗯——”，头上一句宽慰的话 ——
  // 看新出的结果卡：空网、不是碰了硬物收回来的那种（那是 W5）
  watchEmpty() {
    const g = this.g;
    if (g.cardSeq === this.cardSeq) return;
    this.cardSeq = g.cardSeq;
    const c = g.cards[g.cards.length - 1];
    if (!c || c.kind !== 'empty' || c.hazard) return;
    if (!this.notes || !this.first('F9')) return;
    const why = /埋/.test(c.note || '') ? 'buried' : /边/.test(c.note || '') ? 'edge' : 'none';
    const W = BOAT.washLocal;
    // 空网那一摊泥水（C3，settle.js）已经叫离得最近的人转过来耸肩了：第一次就是同一个人、同一下耸肩，
    // 只多“嗯——”和头上一句（不另叫一个人，免得两个人抢着耸、或者一个人耸两遍）
    const c3 = g.settle && g.settle.shrugger;
    let s = null, delay = 0.35;
    if (c3 && Math.abs(g.time - c3.at) < 0.2 && c3.s.rig.re && c3.s.rig.re.type === 'shrug') {
      s = c3.s; delay = c3.delay;
      if (s.task && s.task.type === 'glance') s.task.dur = Math.max(s.task.dur, 3.2);
    } else {
      const cand = g.crew.hands.filter((s) => s.g.visible && !s.hold && !(s.task && (s.task.type === 'carry' || s.task.type === 'hose')));
      cand.sort((p, q) => Math.hypot(p.x - W.x, p.z - W.z) - Math.hypot(q.x - W.x, q.z - W.z));
      s = cand[0];
      if (!s) return;
      // 站住、转过去看那摊泥（0.35 秒后耸肩，耸到顶时“嗯——”一声、头上冒一句）
      s.path = null;
      s.task = { type: 'f9', idle: true, phase: 'do', x: s.x, z: s.z, face: [W.x, W.z], dur: 3.2, t: 0 };
      s.react('shrug', { delay, x: W.x, z: W.z });
    }
    this.shrug = { s, t: 0, why, said: false, top: delay + 0.27 };
    fxTag('F9', '第一次空网·船员耸肩', 'F9');
  }
  updateShrug(dt) {
    const S = this.shrug; if (!S) return;
    S.t += dt;
    const g = this.g, s = S.s;
    if (!S.said && S.t >= S.top) {
      S.said = true;
      const sc = g.screenOf ? g.screenOf(...g.boat.localToWorld2(s.x, s.z)) : { pan: 0 };
      g.audio && g.audio.play('shrugHum', { f0: [128, 150, 112, 120][s.i] || 128, pan: sc.pan });
      const head = s.head;
      const at = () => { if (!head) return null; head.getWorldPosition(_hp); return stageOf(g.view.camera, _hp.x, _hp.y + 0.45, _hp.z); };
      this.notes.add({ cls: 'say', html: COMFORT[S.why], at, place: 'above', life: 2.5, gap: 12, from: 0.55, avoid: true });
      fxTag('F9', '第一次空网·一句宽慰：' + COMFORT[S.why], 'F9');
    }
    if (S.t > 3.4) this.shrug = null;
  }
}
const _hp = new THREE.Vector3();

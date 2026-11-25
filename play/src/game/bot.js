// 自动演示的机器人：像玩家一样看画面、按手柄。
// 它只读游戏状态（相当于看屏幕：船位与油量、驶近时海底露出的东西、在动的生物、界面提示），
// 从不改游戏里的任何东西；每帧只输出一组和手柄/键盘完全相同的输入：
// 左摇杆（油门/转向，作业时移臂端）、右摇杆（视角）、肩键（缩放）、Ⓐ（下网/再来一次/菜单确认）、Ⓑ（收起结果卡）、Ⓨ（航行⇄作业）、Start（暂停菜单）。
// 选点只用它“注意到”的东西：船驶近时看得见的海底物件、离开遮蔽的活物、已经发现的地点；不读设计用的作业点清单。
// 一趟演示两三分钟：看过珍贵的揭晓、时候也差不多了（或这里已经没有它能下的网），就从暂停菜单“结束这一趟”，
// 收获单上看一会儿再按 Ⓐ 再来一次。
import * as THREE from 'three';
import { BOAT } from './boat.js';
import { NET_R, ENV_H, BAG_DROP, MAX_DEPTH, footprintTop } from './net.js';
import { getRegion, compassWord } from '../world/layout.js';
import { angDiff, clamp } from '../core/noise.js';

const NEUTRAL = () => ({ move: { x: 0, y: 0 }, look: { x: 0, y: 0 }, zoom: 0, zoomHold: 0, A: false, B: false, Y: false, start: false, hud: false, click: null, any: false, holdA: false });
const _fwd = new THREE.Vector3();
// 看过几回攒下的经验：蟹停下以后大概待多久（在一个点翻泥 9–11 秒）
const STAY = { crab: 8.5 };
// 演示一趟的节奏：开出去这么久、已经看过珍贵的揭晓，就收工出收获单；收获单走完、“再来一次”亮起来以后再看这么久才按
const TRIP_SECS = 140, TRIP_MAX = 175, HAUL_READ = 1.8;

export class Autopilot {
  // screen：入口提供的只读视图 { mode(), game(), menu(), hasModal() }
  constructor(screen) {
    this.s = screen;
    this.pad = { mx: 0, my: 0, lx: 0, ly: 0, zh: 0 };
    this.cool = 0;
    this.menuT = 0;
    this.g = null;
    this.log = [];
  }
  attach(g) {
    this.g = g;
    this.state = 'plan'; this.t = 0;
    this.noticed = new Map();   // 注意到的海底物件 id → 时间
    this.crSeen = new Map();    // 注意到的活物 id → { x, z, still, visible }
    this.done = new Set();      // 已经下过网、或判断取不到而放弃的物件 / 活物
    this.tries = new Map();
    this.visited = new Set();   // 已巡查过的点
    this.target = null; this.route = null;
    this.job = null; this.plan = null; this.planT = -1e9;
    this.idle = { t: 0, max: 0, at: 0, total: 0 };
    this.stuckN = 0;
    this.perceiveT = 0;
    this.afterRevealT = 0;
    this.stats = { drops: 0, abandons: 0, respots: 0, precious: 0 };
    this.capPending = null;     // 现场还没看清时先只说方向；看清了（或开到近处）再说这句证据
    this.wantEnd = null;        // 要收工了：打开暂停菜单选“结束这一趟”
    this.preciousSeen = false;  // 这一趟已经看过珍贵的揭晓
  }
  note(e) { e.t = +this.g.time.toFixed(1); this.log.push(e); if (this.log.length > 400) this.log.splice(0, 100); }
  // 机器人的判断记录（为什么去那儿、凭什么下这一网）：只记在 log 里供检查，屏幕上不出演示字幕
  caption(text, meta) {
    // 同一句不连着记两遍（比如绕着海域转圈时）
    if (text === this.lastCap && this.g && this.g.time - this.lastCapT < 40) return;
    this.lastCap = text; this.lastCapT = this.g ? this.g.time : 0;
    this.note({ ev: 'cap', text, ...(meta || {}) });
  }

  // —————————————————— 每帧 ——————————————————
  drive(dt, real) {
    const out = NEUTRAL();
    out.hud = real.hud;
    this.cool = Math.max(0, this.cool - dt);
    const mode = this.s.mode();
    const g = this.s.game();
    if (!g || mode !== 'play') return out;
    if (g !== this.g) this.attach(g);
    if (g.paused || this.s.hasModal()) { this.menuNav(dt, out); return out; }
    this.t += dt;
    this.perceive(dt);
    this.evidenceCheck();
    this.runJob(2.0);
    this.play(dt, out);
    this.camera(dt, out);
    this.smooth(dt, out);
    this.trackIdle(dt);
    return out;
  }
  // 按一下按钮（一帧），两次之间留一点间隔，像人按键
  press(out, btn) { if (this.cool > 0) return false; out[btn] = true; this.cool = 0.3; return true; }

  // 弹出菜单：要收工时选“结束这一趟”，别的时候（例如切到后台时自动暂停）选“继续”
  menuNav(dt, out) {
    const m = this.s.menu();
    if (!m || this.cool > 0) return;
    this.menuT = (this.menuT || 0) + dt;
    if (this.wantEnd && this.menuT < 0.9) return; // 菜单打开后停一下，看得见选的是哪一项
    const target = m.actions.indexOf(this.wantEnd ? 'end' : 'resume');
    if (target < 0) { this.press(out, 'B'); return; }
    if (m.sel === target) { this.press(out, 'A'); return; }
    out.move.y = target < m.sel ? 1 : -1;
    this.cool = 0.32;
  }

  // —————————————————— 看见了什么 ——————————————————
  perceive(dt) {
    this.perceiveT += dt;
    if (this.perceiveT < 0.2) return;
    const step = this.perceiveT; this.perceiveT = 0;
    const g = this.g, b = g.boat;
    for (const r of g.world.regions.values()) {
      if (Math.abs(r.reg.cx - b.x) > 260 || Math.abs(r.reg.cz - b.z) > 260) continue;
      for (const it of r.items.values()) {
        if (it.state !== 'seabed' || this.noticed.has(it.id) || it.burial > 0.72) continue;
        // 水越深越要靠近才认得出
        const range = clamp(50 - Math.max(0, -it.baseY) * 1.25, 15, 50);
        if (Math.hypot(it.x - b.x, it.z - b.z) < range) { this.noticed.set(it.id, g.time); this.noticeN = (this.noticeN || 0) + 1; }
      }
      for (const c of r.creatures) {
        if (!c.catchable || !c.position) continue;
        const p = c.position();
        const d = Math.hypot(p.x - b.x, p.z - b.z);
        const visible = !c.captured && !(c.inShelter && c.inShelter()) && d < clamp(46 + p.y * 1.2, 14, 46);
        let rec = this.crSeen.get(c.id);
        if (!rec) { if (!visible) continue; rec = { x: p.x, z: p.z, still: 0, cr: c, r }; this.crSeen.set(c.id, rec); this.noticeN = (this.noticeN || 0) + 1; }
        const mv = Math.hypot(p.x - rec.x, p.z - rec.z);
        rec.still = mv < 0.03 ? rec.still + step : 0;
        rec.x = p.x; rec.z = p.z; rec.visible = visible;
      }
    }
  }

  // —————————————————— 规划（分帧，不卡画面）——————————————————
  runJob(ms) {
    if (!this.job) return;
    const t0 = performance.now();
    while (performance.now() - t0 < ms) {
      const r = this.job.next();
      if (r.done) { this.plan = r.value; this.planT = this.g.time; this.job = null; return; }
    }
  }
  startPlan() { if (!this.job) { this.plan = null; this.job = this.planSteps(); } }
  *planSteps() {
    const g = this.g, b = g.boat;
    // 触底面只和海底、沉船的形状有关，不随时间变：已加载的现场没变就一直记着（一次规划里网口位置要试上百处）
    const loaded = [...g.world.regions.keys()].join(',');
    if (!this.tcache || this.tcacheKey !== loaded || this.tcache.size > 60000) { this.tcache = new Map(); this.tcacheKey = loaded; }
    // 1) 注意到的海底物件，按位置聚成一网一网
    const pool = [];
    for (const r of g.world.regions.values()) {
      if (Math.abs(r.reg.cx - b.x) > 340) continue;
      for (const it of r.items.values()) if (it.state === 'seabed' && this.noticed.has(it.id) && !this.done.has(it.id) && it.burial <= 0.72) pool.push({ it, r });
    }
    pool.sort((p, q) => Math.hypot(p.it.x - b.x, p.it.z - b.z) - Math.hypot(q.it.x - b.x, q.it.z - b.z));
    const cands = [];
    const covered = new Set();
    for (const { it, r } of pool) {
      if (covered.has(it.id)) continue;
      const group = pool.filter((o) => o.r === r && Math.hypot(o.it.x - it.x, o.it.z - it.z) < 2.75).map((o) => o.it);
      const res = yield* this.coverSteps(group, r, [it.x, it.z]);
      if (!res || !res.items.includes(it)) {
        if (!res || !res.items.length) { this.bump(it.id, 'cover'); continue; }
      }
      for (const o of res.items) covered.add(o.id);
      cands.push({ kind: 'items', tip: res.tip, items: res.items, r, depth: res.depth });
      yield;
    }
    // 2) 看得见的可捕活物
    for (const [id, rec] of this.crSeen) {
      const c = rec.cr;
      if (c.captured || this.done.has(id) || !rec.visible) continue;
      const T = this.footTop(c.position().x, c.position().z);
      if (-T > MAX_DEPTH - 0.5) continue;
      cands.push({ kind: 'live', tip: [rec.x, rec.z], items: [], cr: c, r: rec.r, depth: -T });
    }
    // 打分：一网带得多、近、浅的优先；试过不成的往后放
    let best = null, bs = -1e9;
    for (const c of cands) {
      const dist = Math.hypot(c.tip[0] - b.x, c.tip[1] - b.z);
      const n = c.items.length + (c.kind === 'live' ? 0.8 : 0);
      const tries = c.kind === 'live' ? (this.tries.get(c.cr.id) || 0) : Math.max(0, ...c.items.map((it) => this.tries.get(it.id) || 0));
      const score = n * 40 - dist * 0.3 - c.depth * 0.5 - tries * 25;
      if (score > bs) { bs = score; best = c; }
    }
    if (best) return { kind: 'net', c: best };
    return this.explorePlan();
  }
  bump(id, why) { const n = (this.tries.get(id) || 0) + 1; this.tries.set(id, n); if (n >= 2) { this.done.add(id); this.note({ ev: 'giveItem', id, why }); } }
  // 网口足迹下的触底面（和界面上的“估计触底”、真实下网同一个函数：网口圆面里最高的面）
  footTop(x, z) {
    const key = Math.round(x * 20) * 100003 + Math.round(z * 20);
    let T = this.tcache && this.tcache.get(key);
    if (T !== undefined) return T;
    T = footprintTop(this.g.world, x, z);
    if (this.tcache) this.tcache.set(key, T);
    return T;
  }
  // 网口放在 (x, z) 能完整兜住几件（与闭网时的真实判定同一套条件）
  countAt(items, x, z, r, margin = 0.12, obstPad = 0.35) {
    // 网口罩不进任何一件的位置，不用算触底面
    if (!items.some((it) => it.state === 'seabed' && Math.hypot(it.x - x, it.z - z) + it.r * 0.85 <= NET_R - margin)) return { got: [], T: 0, score: 0 };
    const T = this.footTop(x, z);
    const obst = r.obstacles.some((o) => Math.hypot(o.x - x, o.z - z) < NET_R + o.r * 0.4 + obstPad); // 看得见的埋着的硬物：选点时留余量
    const got = [];
    for (const it of items) {
      if (it.state !== 'seabed') continue;
      if (Math.hypot(it.x - x, it.z - z) + it.r * 0.85 > NET_R - margin) continue;
      if (it.baseY < T - BAG_DROP || it.baseY > T + ENV_H) continue;
      if (it.burial > (obst ? 0.3 : 0.7)) continue;
      got.push(it);
    }
    return { got, T, score: got.length - (obst ? 0.5 : 0) };
  }
  // 先粗后细地找网口中心：兜住的件数最多，其次离种子最近
  *coverSteps(items, r, seed) {
    let best = null, bs = -1, bd = 1e9, n = 0;
    const tryAt = (x, z) => {
      const res = this.countAt(items, x, z, r);
      const d = Math.hypot(x - seed[0], z - seed[1]);
      if (res.got.length && (res.score > bs + 1e-6 || (Math.abs(res.score - bs) < 1e-6 && d < bd))) { bs = res.score; bd = d; best = { tip: [x, z], items: res.got, depth: -res.T }; }
    };
    let cx = 0, cz = 0;
    for (const it of items) { cx += it.x; cz += it.z; }
    cx /= items.length; cz /= items.length;
    for (const [ox, oz] of [[cx, cz], [seed[0], seed[1]]]) for (let dx = -1.4; dx <= 1.41; dx += 0.35) for (let dz = -1.4; dz <= 1.41; dz += 0.35) { tryAt(ox + dx, oz + dz); if (++n % 12 === 0) yield; }
    if (!best) return null;
    const [bx, bz] = best.tip;
    for (let dx = -0.2; dx <= 0.21; dx += 0.1) for (let dz = -0.2; dz <= 0.21; dz += 0.1) { tryAt(bx + dx, bz + dz); if (++n % 12 === 0) yield; }
    if (-best.depth > -1.6 || best.depth > MAX_DEPTH - 0.5) return null;
    return best;
  }
  // 附近没有注意到能下网的东西：先顺着线索、去远远看见的地点，再在这片海湾绕一圈；都看过了就收工
  explorePlan() {
    const b = this.g.boat;
    const reg = getRegion();
    let best = null, bd = 1e9;
    for (const p of this.surveyPoints(reg)) { if (this.visited.has(p.key)) continue; const d = Math.hypot(p.x - b.x, p.z - b.z) - (p.pri || 0) * 1000; if (d < bd) { bd = d; best = p; } }
    if (best) return { kind: 'explore', pt: best, reg };
    this.note({ ev: 'regionDone', id: reg.id });
    return { kind: 'end', why: 'nothing' };
  }
  surveyPoints(reg) {
    const g = this.g;
    const pts = [];
    const rt = [...g.world.regions.values()].find((r) => r.id === reg.id);
    if (rt) {
      for (const s of rt.sites) {
        const k = g.known.sites[rt.id + ':' + s.id];
        // 线索链：看清了线索、还没找到它指的现场 → 顺着线往前走到头
        if (s.clue && s.to && k === 'near' && g.known.sites[rt.id + ':' + s.target] !== 'near') pts.push({ key: reg.id + ':' + s.id, x: s.to[0], z: s.to[1], r: 9, pri: 2, trail: s });
        // 已经远远发现、还没走近看清的地点
        else if (k === 'far') pts.push({ key: reg.id + ':' + s.id, x: s.x, z: s.z, r: s.near * 0.6, pri: 2, label: s.labelFar || s.label });
      }
    }
    // 海域中心，再绕中心看一圈
    pts.push({ key: reg.id + ':c', x: reg.cx, z: reg.cz, r: 14, pri: 0 });
    for (let k = 0; k < 4; k++) {
      const a = reg.heading + k * Math.PI / 2 + 0.4;
      pts.push({ key: reg.id + ':s' + k, x: reg.cx + Math.cos(a) * 42, z: reg.cz + Math.sin(a) * 42, r: 14, pri: 0 });
    }
    return pts.filter((p) => g.world.surfaceTop(p.x, p.z) < -3.2);
  }

  // —————————————————— 行动 ——————————————————
  play(dt, out) {
    const g = this.g, b = g.boat;
    this.afterRevealT = Math.max(0, this.afterRevealT - dt);
    if (g.reveal.busy && g.reveal.active.phase === 'pull') this.afterRevealT = 4.0;
    // 结果卡：看一眼再按 Ⓑ 收起（卡片不会自己消失）
    const revealingNow = g.reveal.busy && g.reveal.active.phase !== 'pull';
    if (g.cards && g.cards.length && !revealingNow && g.time - g.cards[g.cards.length - 1].t > 2.6) this.press(out, 'B');
    // 收获单：等它一行一行走完、盖了章、“再来一次”亮起来，再看一会儿才按 Ⓐ（不提前按掉，演示里看得到整张单子）
    if (g.ended) { this.state = 'plan'; this.target = null; if (g.ended.ready && g.time - g.ended.readyAt > HAUL_READ) this.press(out, 'A'); return; }
    const revealing = g.reveal.busy && g.reveal.active.phase !== 'pull';
    if (revealing && g.reveal.active.precious && !this.preciousSeen) { this.preciousSeen = true; this.stats.precious++; this.note({ ev: 'precious', t: +g.time.toFixed(1) }); }
    // 收工：看过珍贵的揭晓、时候差不多了（或怎么也到点了），手上这一网收完就从暂停菜单结束这一趟
    if (!this.wantEnd && ((this.preciousSeen && g.time > TRIP_SECS) || g.time > TRIP_MAX)) this.wantEnd = { why: this.preciousSeen ? 'time' : 'max', t: g.time };
    if (this.wantEnd && !g.op && !revealing && !g.reveal.busy) {
      if (g.mode === 'work') { this.press(out, 'Y'); return; }
      out.move.y = -clamp(b.speed / 3, -0.4, 0.8);
      if (Math.abs(b.speed) < 1.5 && this.press(out, 'start')) { this.menuT = 0; this.note({ ev: 'end', why: this.wantEnd.why }); }
      return;
    }
    // 珍贵的一网拉回以后：先站着看它被抱进舱里（C8），再接着干（最多等 8 秒）
    const K = g.keep, admiring = !!(K && K.c8 && K.fr && K.fr.prec && K.fr.t < 8);
    if (g.op || revealing || admiring) {
      if (this.state === 'after') this.dropped();
      // 等回收与洗泥的时候先把下一步想好
      if (this.state === 'after' && !this.job && !this.plan) this.startPlan();
      return;
    }
    // 往前探路时注意到了新东西：边开边重新想，有能下网的就转过去
    if (this.state === 'sail' && this.target && this.target.kind === 'explore') {
      if (this.target.seenN !== this.noticeN && !this.job) { this.target.seenN = this.noticeN; this.startPlan(); this.planFor = this.target; }
      if (this.plan && this.planFor === this.target) { const p = this.plan; this.plan = null; this.planFor = null; if (p && p.kind === 'net') { this.commit(p); return; } }
    }
    switch (this.state) {
      case 'plan': this.decide(out); break;
      case 'sail': this.sail(dt, out); break;
      case 'settle': this.settle(dt, out); break;
      case 'aim': this.aim(dt, out); break;
      case 'after':
        // 按了 A 网却没下去（例如吊臂还在转、又挪了落点）：回去接着对准，不当成已经捞过
        if (this.pressed && !this.pressed.seen) { if (g.pendingDrop || g.time - this.pressed.t < 0.8) break; this.note({ ev: 'retry' }); if (++this.retries > 3) this.giveUp('retry'); else { this.state = 'aim'; this.t = 0; } break; }
        this.state = 'plan'; this.t = 0; break;
    }
  }
  decide(out) {
    const g = this.g;
    // 回收／洗泥期间想好的计划，过时就重想
    if (this.plan && g.time - this.planT > 20) this.plan = null;
    if (!this.plan) { this.startPlan(); return; }
    const p = this.plan; this.plan = null;
    this.commit(p);
  }
  commit(p) {
    const g = this.g, b = g.boat;
    this.target = p; this.t = 0; this.prog = null; this.stuckN = 0; this.respots = 0; this.hidT = 0; this.retries = 0;
    if (p) p.seenN = this.noticeN;
    if (!p) { this.state = 'plan'; return; }
    if (p.kind === 'end') { this.wantEnd = { why: p.why, t: g.time }; this.caption('这一处看得见、够得着的都起上来了：收工'); this.state = 'plan'; return; }
    if (p.kind === 'explore') {
      this.route = [[p.pt.x, p.pt.z]];
      this.state = 'sail';
      this.capPending = null;
      const P = p.pt;
      const dir = compassWord(P.x - b.x, P.z - b.z);
      // 离海湾还远：有看得见的水上地标（浮标、废塔）就拿它指路
      const lm = g.world.landmarks.find((l) => l.region === p.reg.id && l.label);
      this.caption(P.trail ? `顺着线索往${P.trail.dir}找：${P.trail.label.split('，')[0]}`
        : P.label ? `往${dir}那片${P.label}开过去看看`
          : Math.hypot(p.reg.cx - b.x, p.reg.cz - b.z) > 150 ? (lm ? `往${compassWord(lm.x - b.x, lm.z - b.z)}开：${lm.label}那边，水清看得见底` : `往${dir}开：去沙湾`)
            : '这一片还没看到能下网的：绕着看一圈', { kind: 'explore' });
      this.note({ ev: 'explore', key: P.key });
      return;
    }
    const c = p.c;
    this.route = this.approachRoute(c);
    if (!this.route) { for (const it of c.items) this.bump(it.id, 'nospot'); if (c.cr) this.bump(c.cr.id, 'nospot'); this.state = 'plan'; return; }
    this.state = 'sail';
    this.sayTarget(c);
    this.note({ ev: 'target', kind: c.kind, items: c.items.map((it) => it.id), cr: c.cr && c.cr.id, tip: c.tip.map((v) => +v.toFixed(2)), depth: +c.depth.toFixed(1) });
  }
  // —— 判断记录：只凭看见的 ——
  // 现场看清了（地点已“看清”，或船开到落点 28 米内），才说这一网的具体证据；之前只说方向和远远看见的样子
  siteOf(c) {
    let best = null, bd = 1e9;
    for (const s of c.r.sites) { if (s.clue) continue; const d = Math.hypot(s.x - c.tip[0], s.z - c.tip[1]); if (d < s.r + 14 && d < bd) { bd = d; best = s; } }
    return best;
  }
  evidenceSeen(c) {
    const g = this.g, b = g.boat;
    const d = Math.hypot(c.tip[0] - b.x, c.tip[1] - b.z);
    const s = this.siteOf(c);
    // 落点属于某处现场：那处现场“看清了”才说（船已经停在落点旁边也算）；不属于任何现场的零散东西：开到 28 米内
    if (s) return g.known.sites[c.r.id + ':' + s.id] === 'near' || d < 9;
    return d < 28;
  }
  sayTarget(c) {
    const g = this.g, b = g.boat;
    const site = this.siteOf(c);
    const ev = captionFor(c, site);
    const far = Math.hypot(c.tip[0] - b.x, c.tip[1] - b.z);
    if (this.evidenceSeen(c)) { this.capPending = null; this.caption(ev, { kind: 'evidence', r: c.r.id, site: site && site.id, dist: Math.round(far) }); return; }
    const dir = this.bearing(c.tip[0], c.tip[1]);
    const k = site && g.known.sites[c.r.id + ':' + site.id];
    this.caption(k === 'far' && site.labelFar ? `${dir}那片${site.labelFar}，开近了看清楚` : `${dir}水下露着东西，开近了看清楚`, { kind: 'direction', site: site && site.id, dist: Math.round(far) });
    this.capPending = { c, text: ev };
  }
  evidenceCheck() {
    const P = this.capPending;
    if (!P || !this.target || this.target.kind !== 'net' || this.target.c !== P.c) { if (P && (!this.target || this.target.c !== P.c)) this.capPending = null; return; }
    const d = Math.hypot(P.c.tip[0] - this.g.boat.x, P.c.tip[1] - this.g.boat.z);
    if (!this.evidenceSeen(P.c)) return;
    const s = this.siteOf(P.c);
    this.capPending = null;
    this.caption(P.text, { kind: 'evidence', r: P.c.r.id, site: s && s.id, dist: Math.round(Math.hypot(P.c.tip[0] - this.g.boat.x, P.c.tip[1] - this.g.boat.z)) });
  }
  bearing(x, z) {
    const b = this.g.boat, h = b.heading, dx = x - b.x, dz = z - b.z;
    const f = dx * Math.sin(h) + dz * Math.cos(h), r = -dx * Math.cos(h) + dz * Math.sin(h);
    const a = Math.atan2(r, f), A = Math.abs(a), side = a > 0 ? '右' : '左';
    return A < 0.35 ? '正前方' : A < 1.2 ? side + '前方' : A < 1.95 ? side + '舷' : A < 2.8 ? side + '后方' : '船后';
  }
  // 靠位：沿“当前位置→目标”开过去，停船时目标正好在正横 8.5 m 处；近处不绕预备点
  approachRoute(c) {
    const b = this.g.boat, tip = c.tip;
    if (this.reachableNow(tip, 0.6) && Math.abs(b.speed) < 2) return [[b.x, b.z]];
    const dTip = Math.hypot(tip[0] - b.x, tip[1] - b.z);
    let best = null, bs = 1e9;
    for (const da of [0, 0.35, -0.35, 0.7, -0.7, 1.1, -1.1, 1.6, -1.6]) {
      const base = Math.atan2(tip[0] - b.x, tip[1] - b.z) + da;
      const vx = Math.sin(base), vz = Math.cos(base);
      for (const side of [1, -1]) {
        const nx = vz * side, nz = -vx * side;
        const sp = [tip[0] - vx * 1.5 + nx * 8.5, tip[1] - vz * 1.5 + nz * 8.5];
        if (!this.spotClear(sp)) continue;
        const head = Math.atan2(sp[0] - b.x, sp[1] - b.z);
        const cost = Math.hypot(sp[0] - b.x, sp[1] - b.z) + Math.abs(angDiff(b.heading, base)) * (dTip < 25 ? 6 : 2) + Math.abs(da) * 4 + Math.abs(angDiff(head, base)) * 8;
        if (cost < bs) { bs = cost; best = { sp, base }; }
      }
    }
    if (!best) { const sp = this.shipSpot(tip); return sp ? [sp] : null; }
    c.ship = best.sp;
    if (dTip < 25) return [best.sp];
    const pre = [best.sp[0] - Math.sin(best.base) * 14, best.sp[1] - Math.cos(best.base) * 14];
    return this.spotClear(pre) ? [pre, best.sp] : [best.sp];
  }
  // 臂端能否从当前船位够到（留出余量，避开驾驶室扇区与本船上方）
  reachableNow(tip, margin = 0.4) {
    const b = this.g.boat;
    const [lx, lz] = b.worldToLocal2(tip[0], tip[1]);
    const dx = lx - BOAT.craneLocal.x, dz = lz - BOAT.craneLocal.z;
    const r = Math.hypot(dx, dz), yaw = Math.atan2(dx, dz);
    if (r < BOAT.reachMin + margin || r > BOAT.reachMax - margin) return false;
    if (Math.abs(angDiff(0, yaw)) < 0.66 + margin * 0.3) return false;
    return !b.overOwnHull(tip[0], tip[1]);
  }
  spotClear(p) { for (const [ox, oz] of [[0, 0], [5, 0], [-5, 0], [0, 5], [0, -5], [3.5, 3.5], [-3.5, -3.5], [3.5, -3.5], [-3.5, 3.5]]) if (this.g.world.surfaceTop(p[0] + ox, p[1] + oz) > -2.6) return false; return true; }
  shipSpot(tip) {
    const b = this.g.boat;
    let best = null, bs = -1e9;
    for (let i = 0; i < 24; i++) {
      const a = i / 24 * Math.PI * 2;
      for (const r of [8.5, 10.5, 7]) {
        const p = [tip[0] + Math.sin(a) * r, tip[1] + Math.cos(a) * r];
        if (!this.spotClear(p)) continue;
        const score = -Math.hypot(p[0] - b.x, p[1] - b.z) * 0.5 - Math.abs(r - 8.5) * 2;
        if (score > bs) { bs = score; best = p; }
      }
    }
    return best;
  }

  // —— 航行：左摇杆油门/转向，前方水浅就绕，卡住就倒一点 ——
  sail(dt, out) {
    const g = this.g, b = g.boat, T = this.target;
    if (g.mode === 'work') { this.press(out, 'Y'); return; }
    this.t += dt;
    const wp = this.route[0];
    const dx = wp[0] - b.x, dz = wp[1] - b.z, d = Math.hypot(dx, dz);
    let want = Math.atan2(dx, dz);
    const look = 14 + Math.abs(b.speed) * 2;
    const top = (x, z) => g.world.surfaceTop(x, z);
    const blocked = (h, L) => { for (let k = 0.25; k <= 1.001; k += 0.25) if (top(b.x + Math.sin(h) * L * k, b.z + Math.cos(h) * L * k) > -2.4) return true; return false; };
    if (d > 6 && blocked(want, Math.min(look, d))) {
      let alt = null;
      for (const off of [0.35, -0.35, 0.7, -0.7, 1.05, -1.05, 1.4, -1.4, 1.9, -1.9, 2.5, -2.5]) if (!blocked(want + off, look)) { alt = want + off; break; }
      want = alt != null ? alt : b.heading + Math.PI * 0.6;
    }
    // 船头顶上浅滩（屏幕底部写“搁浅：倒车或转向”）：马上倒一点再换路，不等下面的卡住检测
    if (b.grounded > 0 && !(this.backT > 0) && this.pad.my > 0.05 && g.time - (this.shoalAt || -1e9) > 4) {
      this.shoalAt = g.time; this.stuckN++; this.backT = 2.5; this.prog = null; this.note({ ev: 'stuck', n: this.stuckN, why: 'shoal' });
      if (this.stuckN >= 3) { this.giveUp('stuck'); return; }
    }
    // 卡住：持续推油门却几乎不动 → 倒一点再换路
    this.prog = this.prog || { x: b.x, z: b.z, t: 0 };
    this.prog.t += dt;
    if (this.prog.t > 6) {
      if (Math.hypot(b.x - this.prog.x, b.z - this.prog.z) < 2.5) { this.stuckN++; this.backT = 2.5; this.note({ ev: 'stuck', n: this.stuckN }); }
      this.prog = { x: b.x, z: b.z, t: 0 };
      if (this.stuckN >= 3) { this.giveUp('stuck'); return; }
    }
    if (this.backT > 0) { this.backT -= dt; out.move.y = -0.6; out.move.x = 0.8; return; }
    const dh = angDiff(b.heading, want);
    const last = this.route.length === 1;
    const final = T.kind === 'net';
    let thr = clamp(d / (final && last ? 30 : 12), 0.15, 1);
    if (Math.abs(dh) > 1.0) thr = Math.min(thr, 0.35);
    if (final && last && d < 14) thr = clamp((d - 1.0) / 18, 0, 0.35) - (b.speed > d * 0.35 ? 0.6 : 0);
    out.move.y = thr;
    out.move.x = -clamp(dh * 1.6, -1, 1);
    if (T.kind === 'net') {
      // 已经停在够得着的位置：不必非开到预定船位
      const tip = T.c.tip;
      if (Math.hypot(tip[0] - b.x, tip[1] - b.z) < 14 && this.reachableNow(tip, 0.6)) {
        out.move.y = -clamp(b.speed / 3, -0.4, 0.8); out.move.x = 0;
        if (Math.abs(b.speed) < 0.35) { this.state = 'settle'; this.t = 0; }
        return;
      }
    }
    if (T.kind === 'explore' && d < (T.pt.r || 12)) { this.visited.add(T.pt.key); this.state = 'plan'; this.t = 0; return; }
    if (d < (last ? (final ? 1.6 : 8) : 8)) {
      this.route.shift();
      if (!this.route.length) { this.state = 'settle'; this.t = 0; }
    }
    if (this.t > 150) { this.giveUp('timeout'); }
  }
  settle(dt, out) {
    const g = this.g, b = g.boat, c = this.target.c;
    this.t += dt;
    if (Math.abs(b.speed) > 0.3 && this.t < 3) { out.move.y = -clamp(b.speed / 3, -0.5, 0.7); return; }
    if (!this.reachableNow(c.tip, 0.15) && this.t < 9) {
      // 差一点：沿船身方向慢慢挪
      const [lx, lz] = b.worldToLocal2(c.tip[0], c.tip[1]);
      const dz = lz - BOAT.craneLocal.z, dx = lx - BOAT.craneLocal.x;
      const r = Math.hypot(dx, dz), bearing = Math.abs(Math.atan2(dx, dz));
      let dir;
      if (bearing < 0.9) dir = 1;
      else if (r < BOAT.reachMin + 0.4 || b.overOwnHull(c.tip[0], c.tip[1])) dir = dz > 0 ? -1 : 1;
      else dir = dz > 0 ? 1 : -1;
      out.move.y = Math.abs(b.speed) > 0.5 ? -Math.sign(b.speed) * 0.3 : dir * 0.07;
      return;
    }
    if (!this.reachableNow(c.tip, 0.15)) { this.respot('unreachable'); return; }
    if (Math.abs(b.speed) > 0.12) { out.move.y = -clamp(b.speed / 2, -0.4, 0.4); return; }
    // 停稳：先把视角转向目标那一舷（游戏会把臂端放在镜头看着的一侧，吊臂不用绕大半圈），再 Ⓨ 转入作业
    if (g.mode === 'sail') {
      const brg = Math.atan2(c.tip[0] - b.x, c.tip[1] - b.z);
      if (Math.abs(angDiff(g.cam.yaw, brg + Math.PI)) > 0.45 && this.t < 6) return;
      this.press(out, 'Y'); return;
    }
    this.state = 'aim'; this.t = 0; this.aimStall = 0; this.bestE = null;
    // 第一次到一处沉船：先绕着作业区看一圈
    const reg = c.r;
    this.sweepT = (!this.observedRegion || this.observedRegion !== reg.id) && c.items.some((it) => it.onHull) ? 4.6 : 0;
    if (this.sweepT) this.observedRegion = reg.id;
  }
  respot(why) {
    const c = this.target.c;
    this.respots++;
    this.stats.respots++;
    if (this.respots > 2) { this.giveUp(why); return; }
    const route = this.approachRoute(c);
    if (!route) { this.giveUp('nospot'); return; }
    this.route = route; this.state = 'sail'; this.t = 0; this.prog = null;
  }
  giveUp(why) {
    const T = this.target;
    this.note({ ev: 'abandon', why, kind: T && T.kind });
    this.stats.abandons++;
    if (T && T.kind === 'net') { for (const it of T.c.items) this.bump(it.id, why); if (T.c.cr) this.bump(T.c.cr.id, why); }
    if (T && T.kind === 'explore') this.visited.add(T.pt.key);
    this.state = 'plan'; this.t = 0; this.target = null;
  }
  // —— 作业：左摇杆把网口推到目标上，等活物停住，Ⓐ 下网 ——
  aim(dt, out) {
    const g = this.g, b = g.boat, c = this.target.c;
    this.t += dt;
    if (g.mode !== 'work') { if (this.t > 1.5) this.respot('mode'); return; }
    if (this.sweepT > 0) { this.sweepT -= dt; return; }
    let tip = c.tip;
    let ready = true;
    if (c.cr) {
      const rec = this.crSeen.get(c.cr.id);
      if (c.cr.captured || !rec) { this.giveUp('gone'); return; }
      tip = [rec.x, rec.z];
      // 够不着它现在的位置：换船位
      if (!this.reachableNow(tip, 0.1)) { if (this.t > 2) { c.tip = tip; this.respot('moved'); } return; }
      // 看着它停下才下网；数一数引线上的秒结（网几秒触底），它停的时间加上网沉下去的时间还在它平时待的时长里才下
      // （停了很久的蟹说不定马上要走，等它下一次停；停了远超平常时长的，是安顿下来歇着了，也照样下）
      const sinkT = g.sink ? g.sink.t : 3, stay = STAY[c.cr.kind] || 8;
      ready = rec.visible && rec.still > 0.35 && (rec.still + sinkT + 1.0 < stay || rec.still > stay * 1.6);
      // 躲回窝里了：先去干别的，过一阵再回来看（不算一次失手）
      if (!rec.visible) { this.hidT = (this.hidT || 0) + dt; if (this.hidT > 4) { this.hidT = 0; this.note({ ev: 'abandon', why: 'hid', kind: 'net' }); this.state = 'plan'; this.t = 0; this.target = null; return; } } else this.hidT = 0;
      if (this.t > 18) { this.giveUp('wait'); return; }
    } else {
      // 物件还在不在、网口还能不能兜住（比如被生物拖走了）
      const res = this.countAt(c.items, tip[0], tip[1], c.r);
      if (!res.got.length) { this.giveUp('moved'); return; }
    }
    // 网口（屏幕上的圆圈）推向目标：方向相对镜头
    g.view.camera.getWorldDirection(_fwd); _fwd.y = 0; _fwd.normalize();
    const ex = tip[0] - g.aim.x, ez = tip[1] - g.aim.z, e = Math.hypot(ex, ez);
    if (e > 0.02) {
      const mag = Math.min(1, e * 0.9) ;
      const ux = ex / e, uz = ez / e;
      out.move.y = (ux * _fwd.x + uz * _fwd.z) * mag;
      out.move.x = (ux * -_fwd.z + uz * _fwd.x) * mag;
      // 圆圈越过船头时会在扇区边上停一会儿（吊臂从船尾绕过去），所以要较长时间没进展才算够不着；追活物时目标本身在动，不算
      if (!c.cr) {
        if (this.bestE == null || e < this.bestE - 0.05) { this.bestE = e; this.aimStall = 0; } else this.aimStall += dt;
        if (this.aimStall > 4) { this.respot('aimlimit'); return; }
      }
      return;
    }
    this.bestE = null; this.aimStall = 0;
    if (!ready) return;
    // 圆圈真实所在的位置兜得住计划里的那几件，才下网
    if (!c.cr && this.countAt(c.items, g.aim.x, g.aim.z, c.r, 0.02, 0).got.length < c.items.length) { if (this.t > 12) this.giveUp('edge'); return; }
    const cd = g.canDrop();
    // 像人一样先松开摇杆（摇杆回中）再按 A
    if (cd.ok && b.craneSettled() && Math.hypot(this.pad.mx, this.pad.my) < 0.005) {
      if (this.press(out, 'A')) {
        this.pressed = { t: g.time, c, seen: false };
        this.note({ ev: 'drop', items: c.items.map((it) => it.id), cr: c.cr && c.cr.id, depth: +c.depth.toFixed(1), fuel: +b.fuel.toFixed(1), sink: g.sink ? +g.sink.t.toFixed(1) : null, still: c.cr ? +(this.crSeen.get(c.cr.id) || { still: 0 }).still.toFixed(1) : null });
        if (c.cr && g.sink && g.sink.knots.length) this.caption(`引线上 ${g.sink.knots.length} 个小方块：网 ${g.sink.knots.length} 秒多触底，它刚停下，来得及`);
        this.state = 'after'; this.t = 0;
      }
      return;
    }
    // 吊臂还在转就等它转完（从船尾绕到另一舷要几秒）；真的停住了还不能下网才放弃
    if ((this.t > 20 && !b.craneMoving) || this.t > 45) this.giveUp(cd.why || 'cannot');
  }

  // 网真的下去了才记账：哪些东西已经捞过（活物算试过一次）
  dropped() {
    const P = this.pressed;
    if (!P || P.seen) return;
    P.seen = true;
    const c = P.c;
    this.stats.drops++;
    for (const it of c.items) this.done.add(it.id);
    if (c.cr) this.bump(c.cr.id, 'dropped');
  }
  // —— 镜头：右摇杆转视角、俯仰，肩键缩放 ——
  camera(dt, out) {
    const g = this.g, b = g.boat, cam = g.cam;
    let yaw = null, pitch = null, dist = null;
    const revealing = g.reveal.busy && g.reveal.active.phase !== 'pull';
    // 拉回以后游戏把镜头偏向舱口（B19、C8）：这时候不动镜头，看着就好
    if (!g.ended && g.keep && g.keep.fr && !g.keep.fr.release) return;
    if (revealing || g.ended) {
      // 揭晓时镜头归游戏；收获单时游戏自己把镜头退到告别的位置（C11），不动它
      if (g.ended) return;
    } else if (this.state === 'settle' && this.target && this.target.c) {
      // 停船时先看向目标
      const tip = this.target.c.tip;
      yaw = Math.atan2(tip[0] - b.x, tip[1] - b.z) + Math.PI; pitch = 0.75; dist = 32;
    } else if (g.mode === 'work') {
      if (this.state === 'aim' && this.sweepT > 0) { out.look.x = -0.28; return; }
      if (cam.ease) return; // 游戏自己在把镜头转到侧面
      const tip = this.target && this.target.c ? this.target.c.tip : [g.aim.x, g.aim.z];
      const brg = Math.atan2(tip[0] - b.x, tip[1] - b.z);
      const a1 = brg + Math.PI / 2 - 0.35, a2 = brg - Math.PI / 2 + 0.35;
      yaw = Math.abs(angDiff(cam.yaw, a1)) < Math.abs(angDiff(cam.yaw, a2)) ? a1 : a2;
      pitch = 0.95; dist = 26;
    } else if (this.state === 'sail' && this.glance(g)) {
      // 刚发现一处现场：镜头转到船后方，同时框住船和那处现场（几秒）
      const p = this.glance(g);
      yaw = Math.atan2(p.x - b.x, p.z - b.z) + Math.PI + 0.25; pitch = 0.5; dist = 46;
    } else if (this.afterRevealT > 0) {
      // 拉回大视野后：中景同时框住甲板（船员搬货）和前进方向
      yaw = b.heading + Math.PI * 0.72; pitch = 0.66; dist = 27;
    } else {
      yaw = b.heading + Math.PI + 0.5 + Math.sin(g.time * 0.05) * 0.25; pitch = 0.6; dist = 40;
    }
    if (yaw != null) out.look.x = -clamp(angDiff(cam.yaw, yaw) * 1.1, -0.9, 0.9);
    if (pitch != null) out.look.y = clamp((pitch - cam.pitch) * 1.6, -1, 1);
    if (dist != null) { const cur = g.mode === 'work' ? cam.distWork : cam.distSail; out.zoomHold = clamp((dist - cur) / 12, -1, 1); }
  }
  // 只看远处的发现和线索（新的方向）；快到落点时不转，免得停船时还要等镜头转回来
  glance(g) {
    const T = this.target;
    if (T && T.kind === 'net' && Math.hypot(T.c.tip[0] - g.boat.x, T.c.tip[1] - g.boat.z) < 45) return null;
    for (let i = (g.pings || []).length - 1; i >= 0; i--) { const p = g.pings[i]; if (g.time - p.t < 4 && (p.stage === 'far' || p.clue) && Math.hypot(p.x - g.boat.x, p.z - g.boat.z) > 18) return p; }
    return null;
  }
  // 摇杆不会瞬间从 0 打到底：一阶跟随，像手指推杆
  smooth(dt, out) {
    const p = this.pad, k = 1 - Math.exp(-dt * 9), kl = 1 - Math.exp(-dt * 4);
    p.mx += (out.move.x - p.mx) * k; p.my += (out.move.y - p.my) * k;
    p.lx += (out.look.x - p.lx) * kl; p.ly += (out.look.y - p.ly) * kl; p.zh += (out.zoomHold - p.zh) * kl;
    out.move.x = Math.abs(p.mx) < 0.005 ? 0 : p.mx; out.move.y = Math.abs(p.my) < 0.005 ? 0 : p.my;
    out.look.x = Math.abs(p.lx) < 0.003 ? 0 : p.lx; out.look.y = Math.abs(p.ly) < 0.003 ? 0 : p.ly; out.zoomHold = Math.abs(p.zh) < 0.01 ? 0 : p.zh;
  }
  // 站着不动、没事可做的时间（用来找游戏里让人干等的地方）
  trackIdle(dt) {
    const g = this.g;
    const busy = g.op || g.reveal.busy || g.ended || Math.abs(g.boat.speed) > 0.5 || this.state === 'aim' || this.state === 'settle';
    if (busy) { this.idle.t = 0; return; }
    this.idle.t += dt; this.idle.total += dt;
    if (this.idle.t > this.idle.max) { this.idle.max = this.idle.t; this.idle.at = +g.time.toFixed(1); this.idle.state = this.state; }
  }
}

// 判断记录：只记看得见的证据，不说出未揭晓物件的名字；按落点所在的现场说“在哪儿”
const WHERE = { sandbar: '浅滩上', wreck: '船边', downslope: '顺坡往下' };
function captionFor(c, site) {
  if (c.kind === 'live') return '那只蟹停下来翻泥了，趁它在原地下网';
  const n = c.items.length;
  const hull = c.items.some((it) => it.onHull);
  const buried = c.items.some((it) => it.burial > 0.35);
  if (hull) return n > 1 ? '船体破口下面露着几件货，从正上方垂直下网' : '船体破口正对着一件货，从正上方下网';
  const where = WHERE[site && site.id] || '';
  if (c.depth > 15) return (where ? where + '，' : '') + '深处只看得清轮廓：顺着残骸走势找到一处硬边';
  if (buried) return (where || '') + '泥里露出一道硬边，网口罩住它';
  if (c.depth < 5) return (where || '浅水里') + (n > 1 ? '看得清：这几件挨在一起，一网都带上' : '躺着一件，看得清清楚楚');
  return (where || '') + (n > 1 ? '这几件挨在一起，挑个能一起兜住的位置' : '散着一件，好拿');
}

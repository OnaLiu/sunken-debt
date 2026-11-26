import * as THREE from 'three';
import { NET_R, ARM_MIN, ARM_MAX, VIEW_W, VIEW_H } from '../config.js';
import { BOAT } from '../world/boat.js';
import { BOAT_ZONE, inBoatZone } from './arm.js';
import { seeItem, canSee, hiddenWhy } from './sight.js';
import { N } from './tables.js';

// 「吸到点上」（设计第 4 节）：白圈只落在海底看得见的打捞点上。鼠标指着哪，就吸到离指针最近的那一处，左键下网（hover）；
// 手柄推右摇杆往哪边，就跳到那一边最近的下一处，A 下网（input 里的摇杆那一段）。网还在水里时先点好下一处，网一收回自己接着下（next）。
// 全游戏一份：小样、三小段、切片、以后的吊机手都用这一份（吊机手照它挑地方）。
//
// 一处打捞点 = 海底真实的一组东西（一网罩得住的那几件）、或蟹翻泥的那块地。只认玩家看得见的（和界面上的圈、自动演示用同一份「看得见」）：
// 埋着的、太深太暗认不出的不吸。白圈自己摆到网口罩得住这组东西最多的位置；吊臂、镜头照现在的机械样子追过去。
// 看得见、可是吊臂够不着的也算一处（far）：可以跳过去，白圈停在够得着的最远处，船开近了才落上去；够不着时按下网说一句为什么。

const FAR = 6; // 够不着的点：比吊臂最远还远多少米以内的才列出来
const _v = new THREE.Vector3();
const _w = new THREE.Vector3();

export class SnapAim {
  constructor(g) {
    this.g = g;
    this.spots = [];
    this.cur = null;
    this.mouse = false; // 这会儿是鼠标在指（不是手柄）
    this.hov = null; // 鼠标指着的那一处
    this.next = null; // 网还在水里就点好的下一处
    this.heading = null; // 正要开过去的那一处（指着够不着的、开着船的时候）
    this.cool = 0;
    this.stickWas = false;
    this.t = 0;
    this.jumpT = 0;
    this.vis = new Map();
  }

  reset() {
    this.vis = new Map();
    this.spots = [];
    this.cur = null;
    this.hov = this.next = this.heading = null;
    this.cool = 0;
    this.t = 0;
  }

  // —— 列出打捞点 ——
  // 看得见的东西按「一网罩得住」分组：每次挑罩得最多的那一网，罩住的拿走，剩下的再挑，直到分完
  compute() {
    const g = this.g;
    const crane = g.boatCtl.localToWorld(_w.set(BOAT.crane.x, 0, BOAT.crane.z), new THREE.Vector3());
    const cand = [];
    for (const it of g.items.items) {
      if (it.state !== 'seabed') continue;
      if (Math.hypot(it.x - crane.x, it.z - crane.z) > ARM_MAX + FAR) continue;
      if (!this.seen(it)) continue;
      cand.push({ id: it.id, x: it.x, y: it.y, z: it.z, r: it.r, hold: !!it.inHold });
    }
    // 蟹停下翻泥的那块地：翻过的泥（一圈翻起来的沙边）看得见，就是一处
    const P = g.crabLife.digPatch;
    // 按住左 Shift 靠近时它多半出了画面：原来列着的就还列着
    const had = g.peek.k > 0 && this.spots.some((s) => s.dig);
    // 底下的铜印已经捞走了：翻过的泥里没东西，不再算一处（接着捞下一甲板时不会白下一网）
    const under = !g.items.seal || g.items.seal.state === 'seabed';
    if (P && under && P.amount > 0.3 && (had || canSee(g, P.mesh.position, 0.5, 0.92))) {
      const p = P.mesh.position;
      if (Math.hypot(p.x - crane.x, p.z - crane.z) <= ARM_MAX + FAR) cand.push({ id: 'dig', x: p.x, y: p.y, z: p.z, r: 0.3, hold: false, dig: true });
    }
    const spots = [];
    let left = cand.slice();
    while (left.length) {
      let best = null;
      for (const c of left) {
        const near = left.filter((o) => o !== c && o.hold === c.hold && Math.hypot(o.x - c.x, o.z - c.z) < 2.4);
        const centers = [{ x: c.x, z: c.z }];
        for (const o of near) centers.push({ x: (c.x + o.x) / 2, z: (c.z + o.z) / 2 });
        if (near.length > 1) centers.push({ x: (c.x + near.reduce((s, o) => s + o.x, 0)) / (near.length + 1), z: (c.z + near.reduce((s, o) => s + o.z, 0)) / (near.length + 1) });
        for (const ctr of centers) {
          const cover = left.filter((o) => o.hold === c.hold && Math.hypot(o.x - ctr.x, o.z - ctr.z) + o.r * 0.6 <= NET_R - 0.12);
          if (!cover.includes(c)) continue;
          const score = cover.reduce((s, o) => s + Math.min(1, o.r * 1.6) + 0.4, 0);
          if (!best || score > best.score + 1e-6) best = { ctr, cover, score, hold: c.hold };
        }
      }
      if (!best) break;
      left = left.filter((o) => !best.cover.includes(o));
      const S = this.place(best.cover, best.hold, crane);
      if (S) spots.push(S);
    }
    return spots;
  }

  // 这一组东西：白圈放哪儿（罩得住这一组、网下得去、舱里的从舱口下得去）。正中下不去就在周围小范围找
  place(cover, hold, crane) {
    const cx = cover.reduce((s, o) => s + o.x, 0) / cover.length, cz = cover.reduce((s, o) => s + o.z, 0) / cover.length;
    const fits = (x, z) => cover.every((o) => Math.hypot(o.x - x, o.z - z) + o.r * 0.6 <= NET_R - 0.06);
    const offs = [[0, 0]];
    for (const rr of [0.25, 0.5, 0.8]) for (let k = 0; k < 8; k++) offs.push([Math.cos((k / 8) * Math.PI * 2) * rr, Math.sin((k / 8) * Math.PI * 2) * rr]);
    const ids = cover.map((o) => o.id).sort();
    let fallback = null;
    for (const [ox, oz] of offs) {
      const x = cx + ox, z = cz + oz;
      if (!fits(x, z)) continue;
      const ev = this.evalAt(x, z);
      // 太近、压在自己船头船尾那一线上：这会儿下不了，照样列着（和够不着一样，船挪开了再落上去）
      if (!ev) { if (!fallback) fallback = { x, z, y: cover[0].y, ids, key: ids.join('+'), hold, dig: ids.includes('dig'), far: true, n: cover.length }; continue; }
      const far = Math.hypot(x - crane.x, z - crane.z) > ARM_MAX - 0.05;
      if (ev.ok && ev.inHold === hold) return { x, z, y: ev.restY, ids, key: ids.join('+'), hold, dig: ids.includes('dig'), far, n: cover.length };
      if (!fallback && far) fallback = { x, z, y: cover[0].y, ids, key: ids.join('+'), hold, dig: ids.includes('dig'), far: true, n: cover.length };
    }
    // 够不着的：这会儿看不准下不下得去（臂伸不到那儿算不了），先按这一组的正中列上，开近了再算
    return fallback;
  }

  // 白圈放在 (x, z) 时这一网怎么样（借吊臂的 evaluate 算一次，算完放回原样）；在船身那一圈里、太近的不算
  evalAt(x, z) {
    const A = this.g.arm;
    const q = A._toLocal(x, z);
    const d = Math.hypot(q.x - BOAT.crane.x, q.z - BOAT.crane.z);
    if (d < ARM_MIN || inBoatZone(q.x, q.z)) return null;
    if (d > ARM_MAX) return { ok: false, inHold: false, far: true };
    const save = { aim: A.aim.clone(), local: A.local.clone(), target: A.target.clone(), ev: A.eval, lead: A.lead, wish: A.wish };
    A.local.set(q.x, q.z);
    A.target.set(q.x, q.z);
    A.aim.set(x, 0, z);
    const ev = A.evaluate();
    A.aim.copy(save.aim);
    A.local.copy(save.local);
    A.target.copy(save.target);
    A.eval = save.ev;
    A.lead = save.lead;
    A.wish = save.wish;
    return ev;
  }

  // 这会儿白圈、预告、小牌亮不亮：鼠标没指着打捞点时只剩各处的记号；指着够不着的，小牌在那一处、白圈不出
  get lit() {
    if (this.g.castQ || !this.mouse) return true;
    return !!this.hov && !this.hov.far;
  }

  // 网还在水里：点好下一处（再点一下同一处就是不要了）
  queue(s) {
    const off = this.next && this.next.key === s.key;
    this.next = off ? null : s;
    this.g.audio.play(off ? 'armOff' : 'castLock');
  }

  // 重新列一遍（船动了、捞走了东西、蟹翻了泥）：一秒四次，force 马上
  refresh(force = false) {
    if (!force && this.t < 0.25) return;
    this.t = 0;
    const old = this.cur;
    this.spots = this.compute();
    // 这会儿压在自己船底下的：记号下面多画一圈，看得出它在船的下面
    for (const s of this.spots) s.under = hiddenWhy(this.g, _w.set(s.x, s.y + 0.3, s.z), 0.5) === 'boat';
    if (old) {
      // 还是那一组（或者那一组剩下的几件）：接着停在它上面
      this.cur = this.spots.find((s) => s.key === old.key) || this.spots.find((s) => s.ids.some((id) => old.ids.includes(id))) || null;
      if (this.cur && !this.g.netop.busy && !this.g.castQ && Math.hypot(this.cur.x - old.x, this.cur.z - old.z) > 0.05) this.go(this.cur, false);
    }
    if (this.hov) this.hov = this.same(this.hov);
    if (this.next) this.next = this.same(this.next);
    if (this.heading) {
      this.heading = this.same(this.heading);
      // 开到够得着了：不再是「正要开过去」
      if (this.heading && !this.heading.far) this.heading = null;
    }
  }

  // 重新列过以后，原来那一处现在是哪一条
  same(s) {
    return this.spots.find((q) => q.key === s.key) || this.spots.find((q) => q.ids.some((id) => s.ids.includes(id))) || null;
  }

  // 这会儿挑着的那一处：鼠标是指着的那一处，手柄是白圈停着的那一处
  get active() {
    return this.mouse ? this.hov : this.cur;
  }

  // 正在下网的那一处（网在水里、按了还没下）：不算下一处
  taken(s) {
    const g = this.g;
    return !!((g.netop.busy || g.castQ) && this.cast && s.ids.some((id) => this.cast.ids.includes(id)));
  }

  // 看不看得见：一帧只看几件、轮着看（「看得见」要对着沉船、海底打视线，一帧看完几十件会顿一下）；还没看过的当场看一次
  seen(it) {
    if (!this.vis.has(it.id)) this.vis.set(it.id, seeItem(this.g, it));
    return this.vis.get(it.id);
  }

  update(dt) {
    const list = this.g.items.items;
    for (let k = 0; k < 4 && list.length; k++) {
      this.vi = ((this.vi || 0) + 1) % list.length;
      const it = list[this.vi];
      // 看见过一次就记住（和机器人、界面上的一样）：镜头转开了、被自己的船身挡住了，那一处还在
      if (it.state === 'seabed' && !this.vis.get(it.id)) this.vis.set(it.id, seeItem(this.g, it));
    }
    this.t += dt;
    this.cool = Math.max(0, this.cool - dt);
    this.jumpT += dt;
  }

  // 进打捞模式：落在够得着的打捞点里离画面正中最近的那一处（没有够得着的，就看得见的里最近的）
  enter() {
    this.refresh(true);
    const list = this.spots.filter((s) => !s.far);
    const pool = list.length ? list : this.spots;
    if (!pool.length) { this.cur = null; return false; }
    let best = null, bd = Infinity;
    for (const s of pool) {
      const p = this.g.project(_v.set(s.x, s.y, s.z));
      const d = p.z < 1 ? Math.hypot(p.x - VIEW_W / 2, p.y - VIEW_H / 2) : 1e6 + Math.hypot(s.x - this.g.boatCtl.pos.x, s.z - this.g.boatCtl.pos.z);
      if (d < bd) { bd = d; best = s; }
    }
    this.go(best, true);
    return true;
  }

  // 白圈跳到这一处：吊臂照机械的样子追过去（镜头照旧跟船）
  go(s, jump = true) {
    const A = this.g.arm;
    this.cur = s;
    A.lead = null;
    A.wish = { x: s.x, z: s.z };
    A._followWish();
    if (jump) {
      this.jumpT = 0;
      this.g.audio.play('snap', { far: s.far });
      this.g.cue('A26');
    }
  }

  // 鼠标指着哪一处：离指针最近的那一处打捞点（够得着的放得宽，够不着的要指得准一点）。
  // 看见什么就指到什么：每帧照画面上的位置算（按住左 Shift 靠近时照没靠近的那一幅：按不按都指着同一处）；鼠标没动、船或镜头正在走的时候不换（画面自己在动，白圈不跟着乱跳）
  hover(inp) {
    const g = this.g, P = inp.ptr;
    this.refresh(false);
    if (inp.drag) return;
    if (!P.moved) {
      if (Math.hypot(inp.mx, inp.my) > 0.2 || Math.abs(g.boatCtl.speed) > 0.6 || g.cam.pivotV.length() > 0.5 || g.chase.moving) return;
    }
    let best = null, bs = Infinity;
    for (const s of this.spots) {
      if (this.taken(s)) continue;
      const p = g.peek.project(_w.set(s.x, s.y, s.z));
      if (p.z > 1) continue;
      const d = Math.hypot(p.x - P.x, p.y - P.y);
      if (d > (s.far ? N('指够不着的多近算') : N('指着多近算'))) continue;  // 表的 id，不是玩家看的
      // 已经指着的那一处让它一点：两处一样近时不来回换
      const sc = d * (s.far ? 1.5 : 1) - (this.hov && s.key === this.hov.key ? 30 : 0);
      if (sc < bs) { bs = sc; best = s; }
    }
    if (best && (!this.hov || best.key !== this.hov.key)) {
      // 换了一处：轻轻一声（甩过一串时不连成一片）
      if (this.jumpT > 0.12) { this.jumpT = 0; g.audio.play('snap', { far: best.far }); g.cue('A26'); }
    }
    this.hov = best;
  }

  // 没在下网的时候：指着哪、推到哪，白圈和吊臂就去哪
  input(inp, dt) {
    const g = this.g;
    this.mouse = g.input.device === 'kb' && inp.ptr.ok;
    if (this.mouse) {
      // 按了下网、吊臂还在路上：白圈定住，鼠标先挑下一处
      this.hover(inp);
      if (!g.castQ && !g.netop.busy && this.hov && (!this.cur || this.hov.key !== this.cur.key)) this.go(this.hov, false);
      return;
    }
    this.refresh(false);
    // 当前那一处被捞走了、看不见了：换到最近的一处
    if (!this.cur || !this.spots.includes(this.cur)) {
      if (this.spots.length) this.enter();
      else this.cur = null;
    }
    const stick = Math.hypot(inp.lx, inp.ly);
    let dir = null;
    if (stick > 0.65 && !this.stickWas) dir = { x: inp.lx / stick, y: -inp.ly / stick };
    this.stickWas = stick > 0.45;
    if (!dir || this.cool > 0) return;
    this.cool = N('换点间隔', 0.22);
    const next = this.pick(dir);
    if (next) this.go(next, true);
    else {
      // 那一边没有了：白圈原地往那边顶一下
      g.audio.play('reachBump');
      this.bump = { x: dir.x, y: dir.y, t: 0 };
    }
  }

  // 从当前这一处往画面上 dir 那一边看：角度在「换点找多宽」以内的里，离得近、方向正的那一处
  pick(dir) {
    const g = this.g;
    if (!this.cur) return this.spots[0] || null;
    const o = g.project(_v.set(this.cur.x, this.cur.y, this.cur.z));
    const lim = N('换点找多宽', 1.05);
    let best = null, bs = Infinity;
    for (const s of this.spots) {
      if (s === this.cur) continue;
      const p = g.project(_w.set(s.x, s.y, s.z));
      if (p.z > 1) continue;
      const dx = p.x - o.x, dy = p.y - o.y, d = Math.hypot(dx, dy);
      if (d < 4) continue;
      const ang = Math.acos(Math.max(-1, Math.min(1, (dx * dir.x + dy * dir.y) / d)));
      if (ang > lim) continue;
      const score = d * (1 + 1.6 * ang) * (s.far ? 1.15 : 1);
      if (score < bs) { bs = score; best = s; }
    }
    return best;
  }

  // 下网前看一眼：白圈落在打捞点上、够得着，才下
  castBlock(forced) {
    if (this.mouse && !this.hov && !forced) return this.spots.length ? 'aim' : 'none';
    if (!this.cur) return 'none';
    if (this.cur.far || Math.hypot(this.g.arm.aim.x - this.cur.x, this.g.arm.aim.z - this.cur.z) > 0.12) return 'far';
    return null;
  }
}

export { BOAT_ZONE };

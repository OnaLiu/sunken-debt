import * as THREE from 'three';
import { NET_R, ARM_MAX } from '../config.js';
import { BOAT } from '../world/boat.js';
import { BOAT_ZONE } from './arm.js';
import { SHOAL_MARK, WRECK } from '../world/layout.js';
import { DEMO_SUMMARY_WAIT } from '../ui/menus.js';
import { seeItem, canSee } from './sight.js';
import { pilot, pilotStop } from './pilot.js';
import { clamp, smoothstep, wrapAngle } from '../util/math.js';

// 自动演示的机器人：只通过虚拟手柄操作（左摇杆、右摇杆、A、B、菜单键），
// 只用屏幕上看得见的东西做判断（在画面里、水不太深看得清、没被船壳挡住的才算“看见”），并记住看见过的。
// 操作和玩家一样：开船模式左摇杆开船、右摇杆转镜头；快到站位按 A 进打捞模式，边开边用右摇杆把白圈推到目标上，
// 金圈亮了就按 A 下网（船自己刹住、吊臂走到了再下）；要去远处先按 B 退出打捞
const CLUE_KINDS = new Set(['plank', 'stave', 'ropebit', 'shards']);
const _v = new THREE.Vector3();
// 一轮看完海底的东西分几帧（60 帧每秒时约 0.2 秒）
const PERCEIVE_FRAMES = 12;
// 大轮廓每帧看几节
const LEV_PER_FRAME = 2;
// 演示里转镜头：右摇杆最多推多少（推满每秒转七十来度，看的人会晕）；换角观察时推多少
const LOOK_MAX = 0.5;
const SCAN_RX = 0.45;

export class Bot {
  constructor(g) {
    this.g = g;
    this.v = { lx: 0, ly: 0, rx: 0, ry: 0, zoom: 0, a: false, aHeld: false, b: false, bHeld: false };
    g.input.virtual = this.v;
    window.__botlog = []; // 调试：每次下网尝试的结果
    this.restart();
  }

  restart() {
    this.seen = new Map();
    this.done = new Set();
    this.failed = new Set();
    this.wreckSeen = false;
    this.crabAt = null;
    this.pi = 0;
    this.levT = 0;
    this.levAcc = null;
    this.levBodyNow = null;
    this.t = 0;
    this.co = this.main();
    this.stopped = false;
    this.summaryT = 0;
    this.stage = 'start';
    this.levW = null;
    this.levDone = false;
  }

  stop() {
    this.stopped = true;
    this.g.input.virtual = null;
  }

  // —— 感知：和界面上的标记用同一份「看得见」——
  // 一轮把海底的东西都看一遍（约 0.2 秒），每帧只看其中几件：「看得见」要对着沉船、海底打视线，
  // 一帧里看完几十件会让画面顿一下（以前每 0.2 秒一次全看完，沉船边上一次一两百毫秒）。
  // 看完一轮再看蟹、它翻过的泥、沉船进没进画面
  perceive() {
    const g = this.g;
    const list = g.items.items;
    const per = Math.max(1, Math.ceil(list.length / PERCEIVE_FRAMES));
    for (let k = 0; k < per; k++) {
      if (this.pi >= list.length) { this.pi = 0; this.perceiveRest(); return; }
      const it = list[this.pi++];
      if (it.state !== 'seabed') { this.seen.delete(it.id); continue; }
      if (seeItem(this.g, it)) {
        this.seen.set(it.id, { id: it.id, x: it.x, y: it.y, z: it.z, r: it.r, clue: CLUE_KINDS.has(it.kind), hold: it.inHold, t: this.t });
      }
    }
  }

  perceiveRest() {
    const g = this.g;
    // 沉船边那只蟹在翻泥：翻过的地方可能露出东西（设计里「可以捞这块新露出来的地方」）。
    // 看见它在翻，就记下那个地方；下不下网照样看金圈（翻出来的东西、或者那时还在网口里的蟹）
    const c = g.crabLife.key;
    if (c.catchable && !c.hidden && canSee(g, _v.copy(c.pos).setY(c.pos.y + 0.1), c.r, 0.92, c)) {
      this.crabAt = { x: c.pos.x, z: c.pos.z, t: this.t };
      if (c.state === 'dig') this.seen.set('dig', { id: 'dig', x: c.pos.x, y: c.pos.y, z: c.pos.z, r: 0.3, clue: false, hold: false, dig: true, t: this.t });
    }
    // 它翻过的那一圈泥（颜色深、一圈翻起来的沙边）留在海底：看得见就知道它在哪儿翻泥，不用正好撞见它在翻
    const P = g.crabLife.digPatch;
    if (!this.seen.has('dig') && !this.done.has('dig') && P.amount > 0.3 && canSee(g, P.mesh.position, 0.5, 0.92)) {
      const p = P.mesh.position;
      this.seen.set('dig', { id: 'dig', x: p.x, y: p.y, z: p.z, r: 0.3, clue: false, hold: false, dig: true, t: this.t });
    }
    if (!this.wreckSeen) {
      const p = new THREE.Vector3(WRECK.x, -6, WRECK.z);
      _v.copy(p).project(g.cam.cam);
      if (_v.z < 1 && Math.abs(_v.x) < 0.95 && Math.abs(_v.y) < 0.95 && g.cam.cam.position.distanceTo(p) < 75) this.wreckSeen = true;
    }
  }

  // —— 操作 ——
  clear() {
    const v = this.v;
    v.lx = v.ly = v.rx = v.ry = v.zoom = 0;
    v.aHeld = false;
    v.bHeld = false;
  }

  // 开船：想往世界里 (dx, dz) 那边开，照载具求生的开法按 W、S、A、D
  stick(dx, dz, mag) {
    const q = pilot(this.g.boatCtl, dx, dz, mag);
    this.v.lx = q.mx;
    this.v.ly = q.my;
  }

  // 踩住 S 停稳
  *halt() {
    const t0 = this.t, bc = this.g.boatCtl;
    while (Math.abs(bc.speed) > 0.25 && this.t - t0 < 5) {
      const q = pilotStop(bc);
      this.v.lx = q.mx; this.v.ly = q.my;
      yield;
    }
    this.v.lx = this.v.ly = 0;
  }

  // 开船模式里转镜头（右摇杆往右推，镜头往右看，yaw 变小）。
  // 演示是给人看的：摇杆最多推一半（每秒转二十五度上下），船掉头时镜头也是慢慢跟过去，不一下扫过半个画面
  lookYaw(yaw, gain = 1.4) {
    const e = wrapAngle(yaw - this.g.cam.yawT);
    this.v.rx = clamp(-e * gain, -LOOK_MAX, LOOK_MAX);
    return Math.abs(e);
  }

  lookPitch(p) {
    this.v.ry = clamp(-(p - this.g.cam.pitchT) * 2.5, -1, 1);
  }

  behindYaw() {
    const h = this.g.boatCtl.heading;
    return Math.atan2(-Math.cos(h), Math.sin(h));
  }

  update(dt) {
    if (this.stopped) return;
    this.t += dt;
    this.dt = dt;
    this.perceive();
    this.levScan();
    this.clear();
    const g = this.g;
    if (g.mode === 'summary') {
      // 清点完、「再来一趟」出来以后才开始数（底下那条走满就点）
      if (g.tally.done) this.summaryT += dt;
      if (this.summaryT > DEMO_SUMMARY_WAIT) { this.v.a = true; this.summaryT = -99; }
      return;
    }
    if (g.mode === 'pause' || g.mode === 'fading') return;
    this.summaryT = 0;
    // 大轮廓：看见了兆头，手上这一网做完就先停下来看它过去，看完再接着干（原来的计划停在原地等着）
    // 兆头和看得见的那几节也是「看」：和看海底一样一阵一阵地看（约 0.2 秒一次），不每帧打一遍视线
    this.levT -= dt;
    const look = this.levT <= 0;
    if (look) this.levT = 0.2;
    if (look && !this.levW && !this.levDone && (g.mode === 'sail' || g.mode === 'arm') && !g.netop.busy && !g.reveal.cur && !g.castQ && !g.trip.ended) {
      const s = this.levSign();
      if (s) {
        this.levW = this.watchLev(s);
        if (window.__botlog) window.__botlog.push({ t: +this.t.toFixed(1), stage: this.stage, lev: s.kind });
      }
    }
    if (this.levW) {
      const w = this.levW.next();
      if (!w.done) return;
      this.levW = null;
      this.levDone = true;
      this.clear();
    }
    const r = this.co.next();
    if (r.done) this.co = this.idleLoop();
  }

  // 大轮廓来了的兆头（都是画面上、测深图上看得见的）：那条长影有一节在画面里看得见；
  // 一群鱼一齐侧身往同一个方向冲出去（比被船惊散快得多）；测深图上出现那道长回波
  levSign() {
    const g = this.g;
    const lev = g.leviathan;
    const body = this.levBody();
    if (body) return { kind: 'body', ...body };
    for (const S of g.fish.schools) {
      if (!(S.bolt > 0.5)) continue;
      let x = 0, y = 0, z = 0, vx = 0, vz = 0;
      for (const f of S.fish) { x += f.p.x; y += f.p.y; z += f.p.z; vx += f.v.x; vz += f.v.z; }
      const n = S.fish.length;
      _v.set(x / n, y / n, z / n);
      if (!canSee(g, _v, 1.2, 0.95)) continue;
      // 鱼往哪边冲，它就是从反方向来的：镜头往鱼来的那边看
      const L = Math.hypot(vx, vz) || 1;
      return { kind: 'fish', x: _v.x - (vx / L) * 14, y: -8, z: _v.z - (vz / L) * 14 };
    }
    if (lev.active && g.threat.levD <= 55) return { kind: 'sonar' };
    return null;
  }

  // 画面里看得见的那几节长影（中点、几节）
  levBody() {
    const g = this.g, lev = g.leviathan;
    if (!lev.active) return null;
    return this.levBodyNow;
  }

  // 那条长影一节一节地看：每帧看两节，看完一遍（约八帧）记下看得见的那几节在哪。
  // 它在深槽里，视线又长又斜，一节要量好几处海底；十六节一帧看完要二十来毫秒
  levScan() {
    const g = this.g, lev = g.leviathan;
    if (!lev.active) { this.levAcc = null; this.levBodyNow = null; return; }
    const A = this.levAcc || (this.levAcc = { i: 0, n: 0, x: 0, y: 0, z: 0 });
    for (let k = 0; k < LEV_PER_FRAME && A.i < lev.segs.length; k++, A.i++) {
      const p = lev.segs[A.i].m.position;
      if (!canSee(g, p, 0.7, 0.95)) continue;
      A.n++; A.x += p.x; A.y += p.y; A.z += p.z;
    }
    if (A.i < lev.segs.length) return;
    this.levBodyNow = A.n ? { x: A.x / A.n, y: A.y / A.n, z: A.z / A.n, n: A.n } : null;
    this.levAcc = null;
  }

  // 停船看它过去：回到开船模式（打捞模式里镜头跟着白圈，不能随便转），松开油门让船停下，
  // 镜头往它来的方向、看见了就跟着它那几节转；它扎回深槽、四秒没再看见就接着干。
  // 一直没看见它（兆头过了也没出来）最多等 25 秒；无论如何最多看 50 秒
  *watchLev(sign) {
    const g = this.g;
    const t0 = this.t;
    let look = sign.x != null ? { x: sign.x, z: sign.z } : null;
    let seenAt = null;
    while (this.t - t0 < 50 && !g.trip.ended) {
      if (g.netop.busy || g.reveal.cur) return;
      if (g.mode === 'arm') { this.v.b = true; yield; continue; }
      if (g.mode !== 'sail') { yield; continue; }
      const body = this.levBody();
      if (body) { seenAt = this.t; look = body; }
      if (seenAt != null && this.t - seenAt > 4) return;
      if (seenAt == null && this.t - t0 > 25) return;
      const bp = g.boatCtl.pos;
      if (look) this.lookYaw(Math.atan2(-(look.x - bp.x), -(look.z - bp.z)) + 0.2, 1.0);
      this.lookPitch(0.8);
      yield;
    }
  }

  // —— 计划：港外 → 浅滩 → 顺着散落物 → 沉船（舱里、外侧、蟹翻的地方）→ 坡下 → 按住 B 收工 ——
  // 一圈两三分钟（设计第 8 节「下几网」）：每处现场捞最值得看的一两网就往下走，坡下那一网捞完就收工。
  // 收工用玩家也能用的「开船时按住 B」，模式牌上的小表盘走满；不开暂停菜单
  *main() {
    // 起步：先把镜头摆到船后，等引擎着火
    yield* this.wait(1.1);
    // 1. 浅滩：远远就能看见那根标杆
    this.stage = 'shoal';
    yield* this.sailTo(SHOAL_MARK.x + 6.5, SHOAL_MARK.z + 3.5, 5, { scan: true });
    yield* this.scan(2.2, { x: -80, z: -27 }, 1.0);
    // 浅滩先下一网就走（铜筒那一窝），尽快去沉船放珍贵的那一网；浅滩那只锚留到收尾回来捞
    const shoal = this.bestCluster((s) => !s.clue && Math.hypot(s.x - SHOAL_MARK.x, s.z - SHOAL_MARK.z) < 20);
    if (shoal) yield* this.netAt(shoal);
    // 2. 字幕说东南还散着船板：往东南找
    this.stage = 'trail';
    yield* this.followTrail();
    // 3. 沉船：先绕到能看进破口的一面，找舱里的东西
    this.stage = 'hold';
    yield* this.sailTo(WRECK.x - 13, WRECK.z - 2, 4, { scan: true });
    yield* this.scan(3, { x: WRECK.x + 1, z: WRECK.z }, 1.12);
    let hold = this.bestCluster((s) => s.hold);
    if (!hold) {
      yield* this.sailTo(WRECK.x - 10, WRECK.z + 6, 4, {});
      yield* this.scan(4, { x: WRECK.x + 1, z: WRECK.z }, 1.15);
      hold = this.bestCluster((s) => s.hold);
    }
    if (hold) yield* this.netAt(hold, { hold: true });
    // 4. 甲板那一侧：外面散着的货
    this.stage = 'outer';
    yield* this.sailTo(WRECK.x + 15, WRECK.z + 1, 4, { scan: true });
    yield* this.scan(2, { x: WRECK.x + 6, z: WRECK.z + 2 }, 1.0);
    // 外侧先下蟹翻泥的那一处（看见过它在那儿翻、或者看得见那一圈翻开的泥）：白圈停在那儿等它回来翻泥（netDig）。
    // 先兜外面那一组的话，网落下去把蟹惊回窝，它再出来翻泥那几秒正赶上冲洗、揭晓，要再等一整圈。
    // 再兜外面最多的那一组；坡下不在外侧多捞
    const outer = (s) => !s.clue && !s.hold && Math.hypot(s.x - WRECK.x, s.z - WRECK.z) < 14;
    const digFirst = this.seen.has('dig');
    if (digFirst) yield* this.netDig(outer);
    yield* this.netAll((s) => outer(s) && !s.dig, 1, null, digFirst);
    // 一直没找到它翻泥的地方：外面那一组捞完等一等，看见它翻泥就去等它（网刚把它惊回窝，出来先翻泥）
    if (!digFirst) {
      if (!this.seen.has('dig')) yield* this.watchCrab(9, { x: WRECK.x + 6, z: WRECK.z + 2 });
      if (this.seen.has('dig')) yield* this.netDig(outer);
    }
    // 5. 往坡下：顺着船尾和散落的方向，捞一网有依据的
    this.stage = 'slope';
    yield* this.sailTo(WRECK.x + 6, WRECK.z + 22, 4, { scan: true });
    yield* this.scan(2.5, { x: 10, z: 26 }, 1.1);
    yield* this.netAll((s) => !s.clue && s.z > WRECK.z + 10 && s.y > -29.5, 1);
    // 6. 收工：回到开船，按住 B 等模式牌上的表盘走满
    this.stage = 'end';
    yield* this.quit();
    yield* this.idleLoop();
  }

  // 一处现场里看得见的一网网捞：同一处的第二网起按住 A 冲洗快一点（第一网让人看清泥一层层退）
  *netAll(filter, max, between, fast0 = false) {
    for (let k = 0; k < max && !this.g.trip.ended; k++) {
      const c = this.bestCluster(filter);
      if (!c) break;
      yield* this.netAt(c, { fast: fast0 || k > 0, hold: c.hold });
      if (between) yield* between();
    }
  }

  // 收工：回到开船，按下 B 再按住，模式牌翻成「收工」、上面的小表盘走满（一秒）。
  // 这一趟要是已经结束了（油不够、看得见的都捞上来了），游戏自己收，不用再按
  *quit() {
    const g = this.g;
    for (let t0 = this.t; g.mode !== 'sail' && !g.trip.ended && this.t - t0 < 8; ) {
      if (g.mode === 'arm') this.v.b = true;
      yield;
    }
    if (g.trip.ended || g.mode !== 'sail') return;
    // 按住的时候镜头慢慢往船尾那边带一点，看一眼刚才作业的地方
    this.v.b = true;
    for (let t0 = this.t; !g.trip.ended && g.mode === 'sail' && this.t - t0 < 3; ) {
      this.v.bHeld = true;
      this.lookYaw(g.cam.yawT + 0.2, 0.5);
      yield;
    }
  }

  // 等一等那只蟹：网把它惊回窝里，过一会儿它会出来接着翻泥（设计 5.4「等待可以提高判断的质量」）。
  // 镜头对着最后看见它的地方；看见它在翻就不等了，等够了也没看见就算了。
  // 打捞模式里镜头跟着白圈自己挑角度（白圈压在蟹身上时是从正上方往下看，蟹钻在船肋边上就被挡住）：
  // 先退回开船模式（B），自己转镜头斜着看过去
  *watchCrab(maxT, at) {
    const g = this.g;
    const end = this.t + maxT;
    while (this.t < end && !this.seen.has('dig') && !g.trip.ended) {
      if (g.mode === 'arm' && !g.netop.busy) { this.v.b = true; yield; continue; }
      const p = this.crabAt || at, bp = g.boatCtl.pos;
      this.lookYaw(Math.atan2(-(p.x - bp.x), -(p.z - bp.z)) + 0.6, 1.0);
      this.lookPitch(1.0);
      yield;
    }
  }

  // 蟹翻泥的那一处：白圈停在翻开的泥正中等蟹。它一圈五十来秒（窝里躲一会儿，出来先到这儿翻七秒半泥，再到两处歇一歇，回窝），
  // 金圈亮在它身上（网落到底那一刻它稳稳在网口里）就按 A，连同翻出来的东西一起兜上来。
  // 最多等一圈多一点；一直没等到（看不见它、被别的惊着了），网口里有别的金圈就照样下
  *netDig(filter) {
    const d = this.seen.get('dig');
    const cover = [...this.seen.values()].filter((s) => filter(s) && !this.done.has(s.id) && !this.failed.has(s.id) && Math.hypot(s.x - d.x, s.z - d.z) + s.r * 0.6 <= NET_R - 0.12);
    if (!cover.includes(d)) cover.push(d);
    const t0 = this.t;
    const ok = yield* this.netAt({ x: d.x, z: d.z, cover }, { crab: 62 });
    if (window.__botlog) window.__botlog.push({ t: +this.t.toFixed(1), stage: this.stage, dig: ok, crab: this.g.trip.haul.some((h) => h.kind === 'crab'), wait: +(this.t - t0).toFixed(1) });
  }

  *idleLoop() {
    for (;;) {
      if (this.g.mode === 'arm') this.v.b = true;
      this.lookYaw(this.g.cam.yawT + 0.2, 0.5);
      yield;
    }
  }

  *wait(t) {
    const end = this.t + t;
    while (this.t < end) yield;
  }

  // 换角观察：镜头绕着看一圈。转得慢一点（多看一会儿补回来），起步、收住都是慢慢推、慢慢松的
  *scan(t, at, pitch = 1.0) {
    const T = t * 1.5;
    const t0 = this.t;
    const g = this.g;
    while (this.t - t0 < T) {
      if (g.mode === 'arm') { this.v.b = true; yield; continue; }
      const u = this.t - t0;
      this.v.rx = SCAN_RX * smoothstep(0, 0.6, u) * smoothstep(0, 0.6, T - u);
      this.lookPitch(pitch);
      yield;
    }
  }

  // 开到某处。o.salvage：在打捞模式里开（白圈留在原地，吊臂自己转着够它）；不然先按 B 回到开船
  *sailTo(x, z, arriveR, o = {}) {
    const g = this.g;
    const t0 = this.t;
    while (this.t - t0 < 70) {
      if (g.mode === 'arm' && !o.salvage) { this.v.b = true; yield; continue; }
      if (g.mode !== 'sail' && g.mode !== 'arm') { yield; continue; }
      const bp = g.boatCtl.pos;
      const dx = x - bp.x, dz = z - bp.z;
      const D = Math.hypot(dx, dz);
      if (D < arriveR + Math.max(0, g.boatCtl.speed) * 0.5) break;
      this.stick(dx, dz, clamp(D / 16, 0.22, 1));
      if (g.mode === 'sail') {
        // 镜头：大致在船后，开着开着左右看看
        const sway = o.scan ? Math.sin(this.t * 0.45) * 0.55 : 0;
        this.lookYaw(this.behindYaw() + sway, 1.1);
        this.lookPitch(0.68);
      } else if (o.aim) this.aimStep(o.aim.x, o.aim.z);
      yield;
    }
    if (!g.castQ && (g.mode === 'sail' || g.mode === 'arm')) yield* this.halt();
    this.v.lx = this.v.ly = 0;
  }

  // 沿着看见的船板一路往东南，直到看见沉船
  *followTrail() {
    const g = this.g;
    const t0 = this.t;
    let goal = { x: g.boatCtl.pos.x + 22, z: g.boatCtl.pos.z + 18 };
    while (!this.wreckSeen && this.t - t0 < 60) {
      const bp = g.boatCtl.pos;
      // 看见的线索里最往东南的那一个
      let best = null;
      for (const s of this.seen.values()) {
        if (!s.clue) continue;
        const score = s.x * 0.7 + s.z * 0.7;
        if (!best || score > best.score) best = { ...s, score };
      }
      if (best && best.x * 0.7 + best.z * 0.7 > bp.x * 0.7 + bp.z * 0.7 - 4) goal = { x: best.x + 9, z: best.z + 7 };
      else goal = { x: bp.x + 18, z: bp.z + 14 };
      yield* this.sailStep(goal.x, goal.z);
    }
  }

  *sailStep(x, z) {
    const g = this.g;
    if (g.mode === 'arm') { this.v.b = true; yield; return; }
    if (g.mode !== 'sail') { yield; return; }
    const bp = g.boatCtl.pos;
    this.stick(x - bp.x, z - bp.z, 1);
    this.lookYaw(this.behindYaw() + Math.sin(this.t * 0.5) * 0.5, 1.1);
    this.lookPitch(0.68);
    yield;
  }

  // 看见的东西里，一网能兜住最多（按大小算）的那一组
  bestCluster(filter) {
    const cand = [...this.seen.values()].filter((s) => filter(s) && !this.done.has(s.id) && !this.failed.has(s.id));
    let best = null;
    for (const c of cand) {
      // 以每件为中心，再试它和邻居的中点
      const centers = [{ x: c.x, z: c.z }];
      for (const o of cand) if (o !== c && Math.hypot(o.x - c.x, o.z - c.z) < 2.2) centers.push({ x: (c.x + o.x) / 2, z: (c.z + o.z) / 2 });
      for (const ctr of centers) {
        const cover = cand.filter((o) => Math.hypot(o.x - ctr.x, o.z - ctr.z) + o.r * 0.6 <= NET_R - 0.12 && o.hold === c.hold);
        if (!cover.length) continue;
        // 只算真的能装进去的
        const score = cover.reduce((s, o) => s + Math.min(1, o.r * 1.6) + 0.4, 0);
        if (!best || score > best.score) {
          const cx = cover.reduce((s, o) => s + o.x, 0) / cover.length, cz = cover.reduce((s, o) => s + o.z, 0) / cover.length;
          best = { x: cx, z: cz, cover, score, hold: c.hold };
        }
      }
    }
    return best;
  }

  // 一网：选船位 → 开过去，快到了按 A 进打捞 → 边开边把白圈推到目标上 → 看足迹和金圈 → A（船自己刹住、吊臂到了就下）
  *netAt(c, o = {}) {
    const g = this.g;
    const ids = c.cover.map((s) => s.id);
    const bp0 = g.boatCtl.pos.clone();
    let base = Math.atan2(bp0.z - c.z, bp0.x - c.x);
    const tries = [0, 0.9, -0.9, 1.8];
    let lost = 0;
    for (let ti = 0; ti < tries.length; ti++) {
      const off = tries[ti];
      const a = base + off;
      const R = 8.6;
      const sx = c.x + Math.cos(a) * R, sz = c.z + Math.sin(a) * R;
      // 横着靠过去：先到站位旁边，再顺着切线开进站位，停下时目标在舷侧、吊臂够得着。
      // 离得远先退出打捞开过去；近了（同一处下一网、换个站位）就在打捞模式里开
      const ux = -Math.sin(a), uz = Math.cos(a);
      const bp = g.boatCtl.pos;
      const sg = (bp.x - sx) * ux + (bp.z - sz) * uz > 0 ? 1 : -1;
      const D = Math.hypot(bp.x - sx, bp.z - sz);
      // 已经在站位旁边、可目标在船头船尾那一线上（网会压着自己的船，吊臂也够不过去）：照样先开到站位旁边，顺着切线开进来
      const q = g.boatCtl.worldToLocal(_v.set(c.x, 0, c.z));
      const endOn = Math.abs(q.z) < BOAT_ZONE.hz + 0.3;
      if (D > 4 || endOn) yield* this.sailTo(sx + ux * 6 * sg, sz + uz * 6 * sg, 2.5, { salvage: D < 14, aim: c });
      // 进站位那一段：按 A 进打捞模式，白圈先往目标那边推
      if (g.mode === 'sail') { this.v.a = true; yield; }
      yield* this.wait(0.1);
      if (g.mode !== 'arm') continue;
      yield* this.sailTo(sx, sz, 1.4, { salvage: true, aim: c });
      const r = yield* this.aimAndDrop(c, ids, o);
      if (window.__botlog) window.__botlog.push({ t: +this.t.toFixed(1), stage: this.stage, off, r, why: this.lastWhy || null });
      if (r === 'done') {
        for (const id of ids) this.done.add(id);
        return true;
      }
      if (r === 'giveup') break;
      // 停下来看大轮廓（回了开船模式）打断的：同一个船位再来
      if (r === 'lost' && this.levDone && lost++ < 2) ti--;
    }
    for (const id of ids) this.failed.add(id);
    if (g.mode === 'arm') { this.v.b = true; yield; }
    return false;
  }

  // 白圈要往 (tx, tz) 去：直着推会从自己船上过（网口压着自己的船），就顺着船边那一圈外面绕过去：
  // 船角外面各一点，挑最短的那条（要绕两个角就先去近的那个角，到了角上再往下一个角）。
  // 目标本身就在船边那一圈里（船正开过它），先停在那一圈外面离它最近的地方，等船开过去。都按船局部算
  aimVia(tx, tz) {
    const g = this.g, A = g.arm, bc = g.boatCtl;
    const hx = BOAT_ZONE.hx + 0.35, hz = BOAT_ZONE.hz + 0.35;
    const L = (x, z) => { const q = bc.worldToLocal(_v.set(x, 0, z)); return { x: q.x, z: q.z }; };
    const a = L(A.aim.x, A.aim.z);
    let t = L(tx, tz);
    const inside = (p) => Math.abs(p.x) < hx && Math.abs(p.z) < hz;
    // 线段 p→q 从船边那一圈里穿过去吗
    const crosses = (p, q) => {
      let t0 = 0, t1 = 1;
      for (const [u, w, h] of [[p.x, q.x, hx], [p.z, q.z, hz]]) {
        const d = w - u;
        if (Math.abs(d) < 1e-6) { if (Math.abs(u) >= h) return false; continue; }
        let s0 = (-h - u) / d, s1 = (h - u) / d;
        if (s0 > s1) [s0, s1] = [s1, s0];
        t0 = Math.max(t0, s0); t1 = Math.min(t1, s1);
        if (t0 >= t1) return false;
      }
      return true;
    };
    const out = (p) => {
      // 从那一圈里出来：往离得最近的那条边外面 0.3 米
      const px = hx - Math.abs(p.x), pz = hz - Math.abs(p.z);
      return pz < px ? { x: p.x, z: Math.sign(p.z || 1) * (hz + 0.3) } : { x: Math.sign(p.x || 1) * (hx + 0.3), z: p.z };
    };
    let moved = false;
    if (inside(t)) { t = out(t); moved = true; }
    let goal = t;
    if (inside(a)) goal = out(a);
    else if (crosses(a, t)) {
      // 白圈、四个船角外面一点、目标：两两看得见（连线不从那一圈里穿过）的连起来，找最短的路，往路上的下一点推。
      // 以前只绕一个角：要绕两个角时到了第一个角旁边就改去另一边的角，白圈在两个角之间来回抖、一直不动
      const m = 0.3;
      const N = [a];
      for (const [sx, sz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
        const c = { x: sx * (hx + m), z: sz * (hz + m) };
        if (Math.hypot(c.x - BOAT.crane.x, c.z - BOAT.crane.z) <= ARM_MAX - 0.2) N.push(c);
      }
      N.push(t);
      const D = N.map((_, i) => (i ? Infinity : 0)), from = N.map(() => -1), done = N.map(() => false);
      for (;;) {
        let u = -1;
        for (let i = 0; i < N.length; i++) if (!done[i] && D[i] < Infinity && (u < 0 || D[i] < D[u])) u = i;
        if (u < 0 || u === N.length - 1) break;
        done[u] = true;
        for (let v = 1; v < N.length; v++) {
          if (done[v] || crosses(N[u], N[v])) continue;
          const d = D[u] + Math.hypot(N[v].x - N[u].x, N[v].z - N[u].z);
          if (d < D[v]) { D[v] = d; from[v] = u; }
        }
      }
      // 路上的点从白圈往后排；已经到了的那个角（差 15 厘米以内）跳过，往下一点推
      const path = [];
      for (let k = N.length - 1; k > 0 && from[N.length - 1] >= 0; k = from[k]) path.unshift(N[k]);
      const next = path.find((p) => Math.hypot(p.x - a.x, p.z - a.z) > 0.15);
      if (next) goal = next;
    } else if (!moved) return { x: tx, z: tz, via: false };
    const w = bc.localToWorld(_v.set(goal.x, 0, goal.z));
    return { x: w.x, z: w.z, via: goal !== t || moved };
  }

  // 白圈往世界里的一点推一下（右摇杆）：看屏幕上白圈在哪、那一点在哪，往那边推，越近推得越轻。
  // 两点按同一个高度（目标那儿的海底）比，免得一高一低在画面上叠在一起就当成对准了。
  // 直着推会压到自己船上就先绕到船角外面（aimVia）
  aimStep(tx0, tz0) {
    const g = this.g;
    const A = g.arm;
    const W = this.aimVia(tx0, tz0);
    const tx = W.x, tz = W.z;
    const ty = g.world.surfaceAt(tx, tz).y;
    const p = g.project(_v.set(A.aim.x, ty, A.aim.z));
    const q = g.project(_v.set(tx, ty, tz));
    const dx = q.x - p.x, dy = q.y - p.y;
    const d = Math.hypot(dx, dy);
    if (d < 1.2 || p.z > 1 || q.z > 1) return d;
    // 摇杆是速度（推得越满走得越快，轻推格外慢）：按剩下的距离给，近了收着推，不冲过头；绕船角时不用收
    const m = Math.pow(clamp(W.via ? Math.max(d / 260, 0.6) : d / 260, 0.02, 1), 1 / 1.6);
    this.v.rx = (dx / d) * m;
    this.v.ry = (-dy / d) * m;
    return d;
  }

  *aimAndDrop(c, ids, o) {
    const g = this.g;
    // 足迹里要罩住的点：先正中，再在周围小范围试
    const offs = [[0, 0]];
    for (const rr of [0.3, 0.6, 0.9]) for (let k = 0; k < 8; k++) offs.push([Math.cos((k / 8) * Math.PI * 2) * rr, Math.sin((k / 8) * Math.PI * 2) * rr]);
    const cover = c.cover;
    const fits = (x, z) => cover.every((s) => Math.hypot(s.x - x, s.z - z) + s.r * 0.6 <= NET_R - 0.06);
    const cand = offs.map(([ox, oz]) => ({ x: c.x + ox, z: c.z + oz }));
    let slides = 0;
    while (cand.length) {
      const { x: tx, z: tz } = cand.shift();
      if (!fits(tx, tz)) continue;
      // 推白圈过去（白圈穿过自己的船也不拦着；吊臂自己转过去）；够不着就换船位
      const t0 = this.t;
      let onT = 0;
      for (;;) {
        if (g.mode !== 'arm') return 'lost';
        const e = Math.hypot(tx - g.arm.aim.x, tz - g.arm.aim.z);
        this.aimStep(tx, tz);
        onT = e < 0.08 ? onT + this.dt : 0;
        if (onT > 0.3) break;
        if (g.arm.pushOut > 0 && Math.abs(g.boatCtl.speed) < 0.3 && this.t - t0 > 1.5) return 'reach'; // 臂够不着：换船位
        if (this.t - t0 > 9) return 'reach';
        yield;
      }
      // 看足迹和金圈
      let ev = g.tipEval;
      if (!ev || !ev.ok) {
        this.lastWhy = ev ? ev.reason : 'noeval';
        // 足迹圈上被挡住的那一段是红的（贴着断桅、船壳的窄落点）：往红的那一段的反方向挪一小步再看，
        // 不一下跳到三十厘米外（那边多半也挡着）
        if (ev && ev.obstruct && ev.obstruct.length && slides < 6) {
          let mx = 0, mz = 0;
          for (const s of ev.obstruct) { mx += s.x - ev.tip.x; mz += s.z - ev.tip.z; }
          const L = Math.hypot(mx, mz);
          if (L > 1e-3) { slides++; cand.unshift({ x: g.arm.aim.x - (mx / L) * 0.1, z: g.arm.aim.z - (mz / L) * 0.1 }); }
        }
        continue;
      }
      // 等蟹（一共最多 o.crab 秒，被打断了回来接着等剩下的）：白圈停着，金圈亮在蟹身上就下
      if (o.crab > 0) {
        const id = 'crab' + g.crabLife.key.id;
        while (o.crab > 0 && !g.trip.ended && !g.forecast.yesIds.has(id)) {
          if (g.mode !== 'arm') return 'lost';
          this.aimStep(tx, tz);
          o.crab -= this.dt;
          yield;
        }
        ev = g.tipEval;
        if (!ev || !ev.ok) { this.lastWhy = ev ? ev.reason : 'noeval'; continue; }
      }
      if (ev.cost > g.trip.fuel) return 'fuel';
      if (o.hold && !ev.inHold) continue;
      // 看金圈：要的东西里至少有一件这一网带得上来，才按 A（压在边上、埋得太深的就换个落点）
      // 蟹翻过的地方：网口里有金圈就下（翻出来的东西事先叫不出名字）
      const dig = ids.includes('dig') && g.forecast.yes > 0;
      if (!dig && !ids.some((id) => g.forecast.yesIds.has(id))) {
        this.lastWhy = 'forecast:' + g.forecast.yes;
        if (o.crab !== undefined) return 'giveup'; // 等过蟹了，这儿没有能带上来的：不再换落点、换船位
        continue;
      }
      this.v.a = true;
      yield;
      // 吊臂还在路上、船还在刹：等它自己下（白圈不动）
      for (let t2 = this.t; g.mode === 'arm' && g.castQ && this.t - t2 < 10; ) yield;
      if (g.mode === 'arm') { this.lastWhy = 'cast-cancel'; continue; }
      // 等这一网做完：下网、回收、冲洗、揭晓
      const t1 = this.t;
      while (this.t - t1 < 40) {
        if (g.mode === 'arm' && !g.netop.busy && !g.reveal.locked && this.t - t1 > 1) return 'done';
        // 同一处的第二网起：冲洗时按住 A 加快（圈变绿），揭晓照样一件件亮
        if (o.fast && g.mode === 'reveal') this.v.aHeld = true;
        yield;
      }
      return 'done';
    }
    return 'nofit';
  }
}

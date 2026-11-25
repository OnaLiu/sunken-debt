// 第一次（第十二批 F1–F5）：几样事情第一次发生时多给一点，让人当场明白——
//   F1 第一次推油门：烟囱喷一大口黑烟、船头一抬船尾一坐、船尾翻起白水、机器“轰”地吃上劲、汽笛短短一声（船听我的）
//   F2 第一次发现：涟漪大一号、多一道，水面上真推出去一圈浪，名字（线索是它指的方向）浮起来多挂两秒；
//      船员扭头看、船长指过去；find 那一声底下多一口低钟（哦，就是找这个）
//   F3 第一次进入作业：按键面板滑进来，“新”字盖章似的一闪；用过的键打上勾（界面在 src/ui/keysfirst.js）
//   F4 第一次触底：按下网镜头就往网那边凑近（24 米 → 约 14 米），看着它落底、泥环大一号（touchfx 按 op.big 放大），闷响底下多一层；看完退回去
//   F5 第一次揭晓：计时牌下面多一行“按 空格 冲得更快”，键帽一下一下按下去；按了就亮橙、收进牌子里（画在 src/ui/teach.js）
// 记在整页里，不是这一趟：再来一次、回到标题再开都不重放。分两份：自动演示里（机器人在开）一份、玩家自己一份——
// 看演示的人看到的是世界的第一次；接管以后，玩家亲手的第一次（推油门、进作业看键、按加快）照样给，
// 世界的第一次（发现、触底）这一趟演示里已经演过就算看过了。
// 第十三批（F6–F10，lessons.js）也记在这同一份 FIRSTS 里（键名 F6、F7:原因、F8、F9、F10）；那几样接管以后照样给玩家。
import * as THREE from 'three';
import { BOAT } from './boat.js';
import { fxTag } from '../fx/tags.js';
import { clamp } from '../core/noise.js';

const ALL = ['F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7:key', 'F7:busy', 'F7:reach', 'F7:fuel', 'F8', 'F9', 'F10'];
const WORLD = ['F2', 'F4'];
const SEEN = { demo: new Set(), play: new Set() };
export const FIRSTS = {
  scope(g) { return g && g.piloted ? 'demo' : 'play'; },
  set(g) { return SEEN[this.scope(g)]; },
  has(id, g) { return SEEN[this.scope(g)].has(id); },
  take(id, g) {
    const S = SEEN[this.scope(g)];
    if (S.has(id)) return false;
    S.add(id); if (g && g.firsts) g.firsts.fired.add(id);
    return true;
  },
  // 效果单、测试用：重新算没放过（不给编号就全部）
  reset(...ids) { for (const S of Object.values(SEEN)) { if (!ids.length) S.clear(); else for (const id of ids) S.delete(id); } },
  // 效果单的别的场面：当作都看过了，不让第一次的东西混进来
  skipAll() { for (const S of Object.values(SEEN)) for (const id of ALL) S.add(id); },
  // 接管：这一趟演示里已经演过的世界的第一次，算玩家也看过了
  carry(g) { for (const id of WORLD) if (g.firsts && g.firsts.fired.has(id)) SEEN.play.add(id); },
  seen() { return { demo: [...SEEN.demo], play: [...SEEN.play] }; },
};

const F4_HOLD = 1.6;   // 触底以后镜头在近处多看这么久，再退回去
const smooth = (x) => { const t = clamp(x, 0, 1); return t * t * (3 - 2 * t); };

export class FirstFx {
  constructor(g) {
    this.g = g;
    this.fired = new Set();   // 这一趟（这一局 Game）放过的
    this.lift = null;         // F1：{ t, puffs }
    this.churn = 0;
    this.pushHeld = false;
    this.near = null;         // F4：{ op, t, touchT }
    this.camK = 0;
    this.teach = null;        // F5：{ t, pressT, outT, R }
    this.washR = null;
    this.used = {};           // F3：面板飞进来以后玩家用过哪些键（移臂 move、点落点 click、航行 Y → 那一刻的游戏时间）
  }

  update(dt, inp, ctl) {
    const g = this.g, b = g.boat;
    // F1：船停着（或很慢）时第一次往前推油门。开局的黑场还没淡开（演示一开始机器人就推着油门）：等画面亮到一半再放，
    // 那时船已经走起来几米每秒，也算这一下
    const push = g.mode === 'sail' && !b.locked && ctl.throttle > 0.35 && b.fuel > 0;
    const lit = !g.dark && (g.litAt == null || g.time - g.litAt > 0.25);
    if (!lit) this.darkPush = push;
    else {
      if (push && !this.pushHeld && Math.abs(b.speed) < (this.darkPush ? 6 : 2.5) && FIRSTS.take('F1', g)) this.throttle();
      this.pushHeld = push; this.darkPush = false;
    }
    if (this.lift) this.updateLift(dt);
    // F3：记下用过的键（面板上那一行打勾）
    if (g.mode === 'work') {
      if (Math.abs(inp.move.x) + Math.abs(inp.move.y) > 0.3) this.used.move = this.used.move ?? g.time;
      if (inp.click) this.used.click = this.used.click ?? g.time;
    }
    if (inp.Y) this.used.Y = this.used.Y ?? g.time;
    // F4：跟着第一网，触底那一下记下来；镜头凑近、停一会儿、退回去
    const N = this.near;
    if (N) {
      N.t += dt;
      if (N.touchT < 0 && N.op.touched) {
        N.touchT = 0;
        g.audio && g.audio.play('firstTouch', { depth: -N.op.T });
        fxTag('F4', '第一次触底');
      } else if (N.touchT >= 0) N.touchT += dt;
      const on = g.op === N.op && (N.touchT < 0 ? N.op.state === 'lowering' : N.touchT < F4_HOLD);
      this.camK = clamp(this.camK + (on ? dt / 0.9 : -dt / 1.3), 0, 1);
      if (!on && this.camK <= 0) this.near = null;
    }
    // F5：第一次揭晓——网包落甲板时就占下（牌子上先不挂小键帽），冲洗一开始计时牌下面滑出一行教怎么加快
    const R = g.reveal.busy ? g.reveal.active : null;
    if (R && (R.phase === 'land' || R.phase === 'wash') && R !== this.washR) {
      this.washR = R;
      if (FIRSTS.take('F5', g)) this.teach = { t: 0, pressT: -1, outT: -1, R, on: false };
    }
    const T = this.teach;
    if (T && !T.on && T.R.phase === 'wash') {
      T.on = true;
      g.audio && g.audio.play('teachHint');
      fxTag('F5', '第一次揭晓·教加快', 'F5|teach');
    }
    if (T && !T.on && g.reveal.active !== T.R) this.teach = null;
    else if (T && T.on) {
      T.t += dt;
      if (T.pressT < 0 && T.R.fast) { T.pressT = 0; g.audio && g.audio.play('teachAck'); fxTag('F5', '第一次揭晓·按了加快', 'F5|teach'); }
      else if (T.pressT >= 0) T.pressT += dt;
      // 冲洗完了（或者这一网收了）：这一行淡掉
      if (T.outT < 0 && (g.reveal.active !== T.R || T.R.phase !== 'wash')) T.outT = 0;
      else if (T.outT >= 0) T.outT += dt;
      if (T.outT > 0.35 || (T.pressT > 0.9)) this.teach = null;
    }
  }

  // 第一次揭晓还没放（网包落甲板的那一帧，揭晓这一帧才进 land、下一帧才占下）：牌子上先不挂小键帽
  teachDue() { return !FIRSTS.has('F5', this.g); }

  // —— F1 ——
  throttle() {
    const g = this.g, b = g.boat;
    this.lift = { t: 0, puffs: [[0, 26, 0.72, 0.09], [0.1, 16, 0.62, 0.13], [0.26, 12, 0.55, 0.2], [0.48, 9, 0.5, 0.3], [0.75, 6, 0.45, 0.42]] };
    this.churn = 0;
    const hx = Math.sin(b.heading), hz = Math.cos(b.heading);
    g.ripples && g.ripples.add(b.x - hx * 7.4, b.z - hz * 7.4, { amp: 0.7, speed: 4.5, life: 3.2, r0: 2 });
    g.audio && g.audio.play('firstThrottle');
    fxTag('F1', '第一次推油门');
  }
  updateLift(dt) {
    const g = this.g, b = g.boat, L = this.lift;
    L.t += dt;
    // 烟：一口接一口，第一口最大最黑，后面越来越淡、越来越小，接上平常的淡烟
    while (L.puffs.length && L.puffs[0][0] <= L.t) { const [, n, s, c] = L.puffs.shift(); this.blow(n, s, c); }
    // 船尾翻起白水（螺旋桨猛地吃水）
    if (L.t < 0.9 && dt > 0) {
      const hx = Math.sin(b.heading), hz = Math.cos(b.heading), k = 1 - L.t / 0.9;
      this.churn += dt * 80 * k;
      while (this.churn > 1) {
        this.churn -= 1;
        const a = Math.random() * 6.283, r = Math.random() * 1.3, v = 2.2 + Math.random() * 2.4;
        g.particles.water.emit(b.x - hx * 7.2 + Math.cos(a) * r, 0.08, b.z - hz * 7.2 + Math.sin(a) * r,
          -hx * v + Math.cos(a) * 0.8, 0.5 + Math.random() * 1.3, -hz * v + Math.sin(a) * 0.8,
          1.2 + Math.random() * 1.0, 0.28 + Math.random() * 0.34, 0.93, 0.97, 0.98, 0.8, 1.8, 1.2, 3.0);
      }
    }
    if (L.t > 2.6) this.lift = null;
  }
  blow(n, s, c) {
    const g = this.g, b = g.boat, [x, z] = b.localToWorld2(-0.6, 2.2), y = BOAT.deckY + 3.8;
    const hx = Math.sin(b.heading), hz = Math.cos(b.heading);
    // 一团一团的：中心几颗小而浓、往上冲得快，外面的大而淡、往四周翻
    for (let i = 0; i < n; i++) {
      const core = i < n * 0.3, a = Math.random() * 6.283, r = Math.random() * 0.5;
      const out = core ? 0.2 + Math.random() * 0.5 : 0.7 + Math.random() * 1.2, up = core ? 3.6 + Math.random() * 1.6 : 2.0 + Math.random() * 1.8;
      const v = c * (core ? 0.8 : 0.9 + Math.random() * 0.35);
      g.smoke.emit(x + Math.cos(a) * r, y + Math.random() * 0.4, z + Math.sin(a) * r,
        Math.cos(a) * out - hx * 0.9, up, Math.sin(a) * out - hz * 0.9,
        2.0 + Math.random() * 1.6, s * (core ? 0.6 + Math.random() * 0.3 : 0.8 + Math.random() * 0.6), v, v, v * 1.03, core ? 1 : 0.85, core ? 1.6 : 2.0);
    }
  }
  // 船头一抬、船尾一坐（0.38 秒抬到顶），再落回、略过头一点（1.6 秒里停稳）：叠在 updateVisual 之后
  visual() {
    const L = this.lift;
    if (!L) return;
    const t = L.t, b = this.g.boat;
    const up = t < 0.38 ? Math.sin(t / 0.38 * Math.PI / 2) : Math.exp(-(t - 0.38) * 2.3) * Math.cos((t - 0.38) * 3.4);
    b.bob.rotation.x -= 0.068 * up;
    b.bob.position.y -= 0.1 * Math.max(0, up);
  }

  // —— F2 ——（updateDiscovery 看清一处现场时调；沉船那一处留给第十三批 F10）
  find(s, p, sc) {
    const g = this.g;
    if (s.id === 'wreck' || !FIRSTS.take('F2', g)) return false;
    p.first = true; p.life = 9.5;
    // 线索平时不说话：第一次把它指的方向写出来（“船板一路往东北”），挂久一点
    if (s.clue) { p.label = s.short || s.label; p.said = false; }
    g.ripples && g.ripples.add(s.x, s.z, { amp: 0.9, speed: 6.5, life: 5, r0: 2 });
    // 水面上翻起一圈白沫（比平常那一圈大）
    const R = Math.max(6, s.r || 8) * 1.35;
    for (let i = 0; i < 36; i++) {
      const a = i / 36 * 6.283 + Math.random() * 0.2, d = R * (0.25 + Math.random() * 0.2);
      g.particles.water.emit(s.x + Math.cos(a) * d, 0.12, s.z + Math.sin(a) * d, Math.cos(a) * 2.2, 0.6 + Math.random() * 0.9, Math.sin(a) * 2.2,
        1.6 + Math.random() * 1.2, 0.3 + Math.random() * 0.3, 0.9, 0.97, 1.0, 0.75, 1.6, 0.9, 2.4);
    }
    // 大家扭头看那边，船长指过去
    const [lx, lz] = g.boat.worldToLocal2(s.x, s.z);
    g.crew.alert && g.crew.alert(lx, lz);
    const cap = g.crew.captain;
    if (cap) { cap.gesture('point', { x: lx, z: lz, quick: true }); cap.nextGest = g.crew.t + 7; }
    g.audio && g.audio.play('firstFind', { kind: s.clue ? 'clue' : 'site', pan: sc.pan });
    fxTag('F2', s.clue ? '第一次发现线索' : '第一次看清一处现场');
    return true;
  }

  // —— F4 ——（tryDrop 下网以后调）
  drop(op) {
    if (!FIRSTS.take('F4', this.g)) return;
    op.big = 1.45;            // 泥环大一号（touchfx.js）
    this.near = { op, t: 0, touchT: -1 };
  }
  // 镜头：朝网口那一块海底凑近；离得近也不钻到水下（太低就把俯角抬起来）
  camera(want, look, c, dist) {
    const k = smooth(this.camK), N = this.near;
    if (k <= 0 || !N) return look;
    const op = N.op;
    const f = new THREE.Vector3(op.x, Math.max(op.T * 0.8, -15), op.z);
    const d = clamp(dist * 0.58 + Math.max(0, -op.T - 8) * 0.35, 12, 20);
    const p = Math.max(c.pitch, Math.asin(clamp((3 - f.y) / d, -1, 0.95)));
    const cp = Math.cos(p);
    const w2 = new THREE.Vector3(f.x + Math.sin(c.yaw) * cp * d, f.y + Math.sin(p) * d, f.z + Math.cos(c.yaw) * cp * d);
    want.lerp(w2, k);
    return look.clone().lerp(f, k);
  }
}

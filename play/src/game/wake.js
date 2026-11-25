// 船在推水（A1，档：轻，每一秒都在）：
//   机器：油门一推，转速先上去（有惯性），船速慢慢跟上；转速和船速差得越多，机器越吃力（load）——烟、尾流、机声（A2）都按它
//   航迹：船尾每 0.25 秒记一个点（最近 9 秒）。水面上的两道白浪（开尔文波的两条臂，19.5°）、中间翻滚的尾流、船头切开的浪、
//         推油门时船尾先翻起一团白水，都画在后期的水面里（post.js 的 wakeFx），这里只记航迹、给参数
//   船头：开快了船头一下下压进浪里，压下去那一下两舷扑起一片水花（粒子，落回水面就没了）；吃力时船头抬一点、船尾坐下去
//   烟囱：跟着机器一口一口地冒（转速越高越密），吃力时是一大团深色的烟，巡航时是淡淡的一缕；停船观察（不烧油）不冒
// 只是表现：不碰船速、油、航向。
import { BOAT } from './boat.js';
import { fxTag } from '../fx/tags.js';

export const WAKE_N = 36;        // 航迹记几个点（和 post.js 的数组一样长）
const WAKE_DT = 0.25;            // 每隔几秒记一个（36 格 = 最近 9 秒）
const STERN = 7.0;               // 船尾离船中心几米（航迹从这里拖出去）
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

export class ShipWake {
  constructor(game) {
    this.g = game;
    const U = game.view.post.uniforms;
    this.U = U;
    this.A = U.uWakeA.value; this.B = U.uWakeB.value;
    this.n = 0; this.acc = 0;
    // 机器：rpm 转速（0..1，跟着油门走，有惯性）、load 吃力（转速比船速超前多少）、churn 船尾翻水
    game.engine = this.E = { throttle: 0, rpm: 0, load: 0, churn: 0, run: true };
    this.odo = 0; this.prop = 0;
    this.chugT = 0; this.slapT = 1.5; this.trim = 0; this.trimV = 0; this.dip = 0;
    this.lastTag = -9; this.wasLoad = 0;
    this.reset();
  }
  reset() {
    this.n = 0; this.acc = 0;
    this.U.uWakeN.value = 0;
    this.px = this.g.boat.x; this.pz = this.g.boat.z;
  }
  // 开场（第十四批 G3）：船停在码头外，看起来刚开出来——顺着船头往回补几秒“刚划过”的航迹，水面上照样画出两道白浪；
  // 之后船尾每 0.25 秒记的都是停着的点，这一段照常变老、散掉
  seed(secs = 6, sp = 4.5, churn = 0.45) {
    const b = this.g.boat, t = this.g.time, hx = Math.sin(b.heading), hz = Math.cos(b.heading), s = this.stern([0, 0]);
    const n = Math.min(WAKE_N, Math.round(secs / WAKE_DT) + 1);
    for (let i = 0; i < n; i++) {
      const d = i * WAKE_DT * sp;
      this.A[i].set(s[0] - hx * d, s[1] - hz * d, t - i * WAKE_DT, i === 0 ? 0 : sp);
      this.B[i].set(churn * (1 - i / n), 0, 0, 0);
    }
    this.n = n; this.acc = 0; this.px = b.x; this.pz = b.z;
    this.U.uWakeN.value = n;
  }
  // 船尾的世界坐标
  stern(out) { const b = this.g.boat; out[0] = b.x - Math.sin(b.heading) * STERN; out[1] = b.z - Math.cos(b.heading) * STERN; return out; }
  update(dt, ctl) {
    const g = this.g, b = g.boat, E = this.E, t = g.time;
    // 船被摆到别处（新开一趟、效果单摆场面）：航迹从头记
    if (Math.hypot(b.x - this.px, b.z - this.pz) > 25) this.reset();
    this.px = b.x; this.pz = b.z;
    // —— 机器 ——
    const run = b.fuel > 0 && !(g.ended && g.ended.why === 'fuel');
    const thr = run && !b.locked ? clamp(ctl.throttle || 0, -1, 1) : 0;
    E.throttle = thr; E.run = run;
    const want = Math.abs(thr), up = want > E.rpm;
    E.rpm += (want - E.rpm) * (1 - Math.exp(-dt * (up ? 2.6 : 1.5)));
    const sp = Math.abs(b.speed), v = sp / BOAT.maxSpeed;
    // 吃力：转速跑在船速前面（推油门、船还没跟上）；倒车刹船时也吃力
    const against = b.speed > 0.4 && thr < -0.1 ? 0.7 : 0;
    const loadW = clamp((E.rpm - v * 0.92) * 1.6 + against, 0, 1);
    E.load += (loadW - E.load) * (1 - Math.exp(-dt * (loadW > E.load ? 6 : 2.2)));
    // 船尾翻水：转速越高越白，吃力时翻得最凶
    E.churn = clamp(E.rpm * 0.35 + E.load * 0.85, 0, 1);
    // —— 航迹：第 0 个点永远是现在的船尾，其余是 0.25 秒一个的历史 ——
    const A = this.A, B = this.B, s = this.stern([0, 0]);
    this.acc += dt;
    if (this.n === 0) { this.n = 1; A[0].set(s[0], s[1], t, sp); B[0].set(E.churn, 0, 0, 0); }
    if (this.acc >= WAKE_DT) {
      this.acc -= WAKE_DT;
      // 往后挪一格（最老的丢掉），第 1 格记下这一刻
      for (let i = Math.min(this.n, WAKE_N - 1); i >= 1; i--) { A[i].copy(A[i - 1]); B[i].copy(B[i - 1]); }
      this.n = Math.min(WAKE_N, this.n + 1);
    }
    A[0].set(s[0], s[1], t, sp); B[0].set(E.churn, 0, 0, 0);
    this.U.uWakeN.value = this.n;
    // 包围盒（再往外放开臂能扩到的最远处），着色器先用它挑掉不相干的像素
    let x0 = b.x, x1 = b.x, z0 = b.z, z1 = b.z, rmax = 0;
    for (let i = 0; i < this.n; i++) {
      const P = A[i]; x0 = Math.min(x0, P.x); x1 = Math.max(x1, P.x); z0 = Math.min(z0, P.y); z1 = Math.max(z1, P.y);
      rmax = Math.max(rmax, 7 + 0.34 * P.w * (t - P.z));
    }
    const pad = Math.max(rmax, 11);
    this.U.uWakeBox.value.set(x0 - pad, z0 - pad, x1 + pad, z1 + pad);
    this.U.uWakeBoat.value.set(b.x, b.z, b.heading, b.speed);
    // —— 船头压浪、扑水花；吃力时船头抬、船尾坐 ——
    this.slapT -= dt * (0.6 + v * 0.9);
    let slap = 0;
    if (sp > 3.2 && this.slapT <= 0) {
      // 浪一个接一个迎上来：越快越密（不是死板的节拍）
      this.slapT = 0.9 + Math.random() * 0.9;
      slap = clamp((sp - 3.2) / 6.3, 0, 1) * (0.55 + Math.random() * 0.45);
      this.dip = Math.max(this.dip, slap);
      this.spray(slap);
      E.slapN = (E.slapN || 0) + 1; E.slapK = slap; // 机声海声（A2）数着：船头“哗”一下
    }
    this.dip = Math.max(0, this.dip - dt * 2.6);
    this.U.uWakeK.value.set(E.churn, this.dip, E.load, 0);
    // 走过的路（两舷刷水的花纹跟着水走）、桨叶转过的圈（船尾喷水往后流）
    this.odo += b.speed * dt; this.prop += (E.rpm * 7 + sp * 0.8) * dt;
    this.U.uWakeE.value.set(E.rpm, this.odo % 1000, this.prop % 1000, 0);
    // 一直往外扑一点细水花（快的时候）
    if (sp > 5.5 && Math.random() < dt * (sp - 5.5) * 3.2) this.spray(0.18);
    // 纵倾：吃力时船头抬（船尾坐下去），一下压浪船头往下一点；弹簧，不硬跳
    const trimW = -0.024 * E.load * (b.speed >= -0.2 ? 1 : -1) + 0.016 * this.dip * this.dip;
    this.trimV += ((trimW - this.trim) * 26 - this.trimV * 7) * dt;
    this.trim += this.trimV * dt;
    b.trimFx = this.trim;
    // —— 烟囱：一口一口 ——
    this.exhaust(dt, sp);
    // 效果标签：开起来、推油门（同一个 key，只刷新那一条）
    // 摆场面（快进、不记标签）的时候不算数：放起来第一眼就挂上；游戏时钟从头来过也从头计
    if (t < this.lastTag) this.lastTag = -9;
    if (window.__fxTagMute) this.lastTag = -9;
    else if (E.load > 0.45 && this.wasLoad <= 0.45) { fxTag('A1', '船推水·推油门：船尾先翻白、冒一团烟', 'A1'); this.lastTag = t; }
    else if (sp > 2 && t - this.lastTag > 6) { fxTag('A1', '船推水·船头切浪、航迹两道白浪', 'A1'); this.lastTag = t; }
    this.wasLoad = E.load;
  }
  // 船头两舷扑起来的水花：从船头两肩往外、往上甩，落回水面就没了
  spray(k) {
    const g = this.g, b = g.boat, P = g.particles.spray;
    const hx = Math.sin(b.heading), hz = Math.cos(b.heading), sx = hz, sz = -hx; // sx,sz：右舷（船的 +x）
    const sp = Math.max(0, b.speed);
    const n = Math.round(4 + 22 * k);
    for (let i = 0; i < n; i++) {
      const side = i % 2 ? 1 : -1;
      const lz = 4.6 + Math.random() * 2.2, w = lz > 3 ? BOAT.hullHalfW * Math.max(0.3, 1 - (lz - 3) / 5) : BOAT.hullHalfW;
      const x = b.x + hx * lz + sx * side * (w + 0.15), z = b.z + hz * lz + sz * side * (w + 0.15);
      const out = 1.6 + Math.random() * 2.4 * (0.5 + k), up = 1.4 + Math.random() * 2.6 * (0.4 + k);
      P.emit(x, 0.15 + Math.random() * 0.3, z,
        sx * side * out + hx * sp * (0.45 + Math.random() * 0.3), up, sz * side * out + hz * sp * (0.45 + Math.random() * 0.3),
        0.5 + Math.random() * 0.45, 0.09 + Math.random() * 0.1 * (0.5 + k), 0.93, 0.97, 0.99, 1, -0.2, 0.9, 9.8, 0);
    }
  }
  // 烟囱：跟着机器一口一口（转速越高越密）；吃力时一大团深色的烟，巡航时淡淡一缕。停着、不烧油时不冒
  exhaust(dt, sp) {
    const g = this.g, b = g.boat, E = this.E;
    if (!E.run || (sp < 0.8 && E.rpm < 0.12)) { this.chugT = 0; return; }
    this.chugT -= dt * (1.4 + E.rpm * 3.0);
    if (this.chugT > 0) return;
    this.chugT += 1;
    const L = E.load, [x, z] = b.localToWorld2(-0.6, 2.2);
    const wx = Math.sin(b.heading) * b.speed * 0.6, wz = Math.cos(b.heading) * b.speed * 0.6;
    const n = L > 0.5 ? 3 : 2;
    for (let i = 0; i < n; i++) {
      // 颜色：淡灰（巡航）→ 深灰褐（吃力）；个头、往上冲的劲也跟着吃力变大
      const c = 0.82 - 0.42 * L + (Math.random() - 0.5) * 0.05;
      g.smoke.emit(x + (Math.random() - 0.5) * 0.3, BOAT.deckY + 3.75 + Math.random() * 0.25, z + (Math.random() - 0.5) * 0.3,
        (Math.random() - 0.5) * 0.5 + wx, 1.2 + 1.8 * L + Math.random() * 0.6, (Math.random() - 0.5) * 0.5 + wz,
        1.5 + Math.random() * 0.6 + L * 1.2, 0.36 + 0.34 * L + 0.08 * E.rpm, c, c * 0.98, c * 0.95, 0.5 + 0.35 * L, 1.7 + 0.6 * L);
    }
  }
}

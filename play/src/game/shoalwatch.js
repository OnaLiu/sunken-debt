// 逼近的浅滩（W2，档：中，倒计时冲锋）和撞上浅滩（W3，档：重，撞飞）。
// W2 按“照现在的船速还有几秒撞上”分三级，每一级同时变颜色、形状或动作、声音，到红色再加一句短字：
//   远（3.2 秒以外）：不提示。
//   近（3.2 秒以内）：船头前方水面一道细的黄色虚线弧（世界标记层画）；测深仪响一声“嘀——嘀”（F7 拆出来的那一声），
//     接着一下一下地“嘀”，越近越急越亮；船员一个接一个扭头看船头那边。
//   再近（1.5 秒以内）：弧变红、变粗、两道、前后抖；“嘀”连成一串，耳边心跳加快；离船头最近的人探身喊“浅了！”（字挂在他头上）。
// W3 撞上的那一刻：船底刮沙一声长长的“嘎——”，撞的那一头往上一抬，镜头往前一顿（比珍品确认那一下小，方向也不同），
//   船底两侧腾起沙雾、船头的水涌起来；船员踉跄、摔倒（crew.bump，原来就有）。
// 都按游戏时间走：暂停时停，慢放时跟着慢。
import { fxTag } from '../fx/tags.js';

export const SHOAL_NEAR = 3.2, SHOAL_CLOSE = 1.5; // 还有几秒撞上：进黄、进红
const SAND = [0.46, 0.39, 0.27], SAND2 = [0.36, 0.31, 0.23]; // 翻起来的是底下的泥沙：比浅滩亮沙底深、发浑（浅水里也分得出）

export class ShoalWatch {
  constructor(g) {
    this.g = g;
    this.level = 0;     // 0 远 / 1 近 / 2 再近
    this.k = 0;         // 近的程度（0 刚进黄，1 到红）
    this.lvT = -9;      // 这一级从什么时候开始（画面上的弧按它淡入、抖）
    this.pingT = 0; this.beatT = 0;
    this.shouter = null; this.shoutT = -9;
    this.lastHit = -9;
  }
  update(dt) {
    const g = this.g, s = g.shoal;
    // 照现在的船速还有几秒撞上；从红退回黄要多退 0.3 秒（不在边上来回跳）
    let lv = 0;
    if (s) lv = s.ttg <= SHOAL_CLOSE || (this.level === 2 && s.ttg <= SHOAL_CLOSE + 0.3) ? 2 : 1;
    this.k = s ? Math.max(0, Math.min(1, (SHOAL_NEAR - s.ttg) / (SHOAL_NEAR - SHOAL_CLOSE))) : 0;
    if (lv !== this.level) {
      const up = lv > this.level;
      this.level = lv; this.lvT = g.time;
      if (lv === 1 && up) this.onNear(s);
      else if (lv === 2) this.onClose(s);
      if (!lv) { g.shoalWarned = false; this.shouter = null; }
    }
    if (!lv) return;
    // 一下一下的“嘀”：黄里 0.62 → 0.34 秒一下，红里连成一串
    this.pingT -= dt;
    if (this.pingT <= 0) {
      this.pingT = lv === 2 ? 0.15 : 0.62 - 0.28 * this.k;
      g.audio && g.audio.play('shoalPing', { k: lv === 2 ? 1 : this.k * 0.7 });
    }
    // 再近：心跳加快（每秒约 2.6 下）
    if (lv === 2) {
      this.beatT -= dt;
      if (this.beatT <= 0) { this.beatT = 0.38; g.audio && g.audio.play('heart', { vol: 0.95, fast: true }); }
    }
  }
  // 浅水在甲板坐标里的位置（船员往那边看、喊）
  local(s) { return this.g.boat.worldToLocal2(s.x, s.z); }
  onNear(s) {
    const g = this.g;
    // 第一下是测深仪报警“嘀——嘀”（F7 的那一声），之后才是一下一下的“嘀”
    if (!g.shoalWarned) { g.shoalWarned = true; g.audio && g.audio.play('denyShoal'); fxTag('F7', '一声拆开·前方浅滩'); }
    this.pingT = 0.55;
    const [lx, lz] = this.local(s);
    g.crew.alert(lx, lz);
    fxTag('W2', '浅滩逼近·近（黄）', 'W2');
  }
  onClose(s) {
    const g = this.g;
    this.pingT = 0.05; this.beatT = 0.02;
    const [lx, lz] = this.local(s);
    this.shouter = g.crew.shout(lx, lz); this.shoutT = g.time;
    g.audio && g.audio.play('shout');
    fxTag('W2', '浅滩逼近·再近（红）：“浅了！”', 'W2');
  }
  // 撞上了（W3）：v 是撞前的船速（正 = 往前开着撞上）
  impact(v) {
    const g = this.g, b = g.boat, a = Math.abs(v);
    this.level = 0; this.lvT = g.time; this.shouter = null;
    if (a < 0.5) return; // 慢慢蹭上去：船员都不动，这里也不演
    const k = Math.min(1, a / 9.5), dir = Math.sign(v) || 1;
    // 刚撞过又顶上去（还按着油门）：只再刮一声小的，不再顿镜头、不再腾沙
    const again = g.time - this.lastHit < 1.6;
    this.lastHit = g.time;
    g.audio && g.audio.play('ground', { k: again ? k * 0.45 : k });
    b.lurch((again ? 0.4 : 1) * (0.018 + 0.05 * k), dir);
    if (again) return;
    const hx = Math.sin(b.heading) * dir, hz = Math.cos(b.heading) * dir;
    if (a > 1.5) g.jolt(5 + 10 * k, hx, hz);
    this.sand(k, dir);
    fxTag('W3', '撞上浅滩', 'W3');
    g.lessons && g.lessons.ground(k, dir); // 第一次搁浅再压一句字（F8）
  }
  // 船底两侧腾起沙雾（从撞的那一头往船中间一路刮过去），船头的水涌起来
  sand(k, dir) {
    const g = this.g, b = g.boat, P = g.particles;
    const hx = Math.sin(b.heading), hz = Math.cos(b.heading), sx = -hz, sz = hx;
    const n = Math.round(60 + 90 * k);
    for (let i = 0; i < n; i++) {
      const along = dir * (6.8 - Math.pow(Math.random(), 1.6) * 9); // 多半在撞的那一头
      const side = Math.random() < 0.5 ? -1 : 1, off = 1.6 + Math.random() * 2.6;
      const x = b.x + hx * along + sx * side * off, z = b.z + hz * along + sz * side * off;
      const top = g.world.surfaceTop(x, z), y = Math.min(-0.3, top + 0.1 + Math.random() * Math.max(0.3, -top - 0.4));
      const out = 1.2 + Math.random() * 2.8 * (0.5 + k);
      const c = Math.random() < 0.5 ? SAND : SAND2;
      P.mud.emit(x, y, z, sx * side * out + hx * dir * k * (0.6 + Math.random()), 0.1 + Math.random() * 0.4, sz * side * out + hz * dir * k * (0.6 + Math.random()),
        8 + Math.random() * 6, 1.6 + Math.random() * 1.3, c[0], c[1], c[2], 1, 2.2, 0.9, 0.02, 0);
    }
    // 浑水翻到水面：船两边贴着水面几大片发黄的浑水，慢慢摊开、淡掉
    for (let i = 0; i < Math.round(14 + 18 * k); i++) {
      const along = dir * (6 - Math.random() * 8), side = Math.random() < 0.5 ? -1 : 1, off = 2.6 + Math.random() * 2.4;
      const x = b.x + hx * along + sx * side * off, z = b.z + hz * along + sz * side * off;
      P.mud.emit(x, -0.18, z, sx * side * (0.6 + Math.random()), 0, sz * side * (0.6 + Math.random()),
        9 + Math.random() * 5, 2.2 + Math.random() * 1.6, SAND[0], SAND[1], SAND[2], 0.55, 1.6, 0.7, 0, 0.25);
    }
    // 撞的那一头：一团更浓的沙从船底下翻出来
    const fx = b.x + hx * dir * 6.6, fz = b.z + hz * dir * 6.6;
    P.mudCloud(fx, Math.min(-0.4, g.world.surfaceTop(fx, fz) + 0.1), fz, 2.6, SAND2, 0.9 + 0.7 * k);
    // 船头的水涌起来、往前扑（白的大水花，加一圈贴水面的碎浪）
    const m = Math.round(36 + 60 * k);
    for (let i = 0; i < m; i++) {
      const side = (Math.random() - 0.5) * 2, sp = (1.5 + Math.random() * 3) * k;
      P.water.emit(fx + sx * side * 1.8, 0.25, fz + sz * side * 1.8, hx * dir * sp + sx * side * 2.2, 2 + Math.random() * 3.5 * k, hz * dir * sp + sz * side * 2.2,
        0.8 + Math.random() * 0.6, 0.3 + Math.random() * 0.35, 0.93, 0.97, 0.98, 0.95, 0.6, 0.3, 9.8, 0);
    }
    for (let i = 0; i < 24; i++) {
      const a = Math.random() * Math.PI * 2, r = 2 + Math.random() * 1.5;
      P.water.emit(fx + Math.cos(a) * r, 0.12, fz + Math.sin(a) * r, Math.cos(a) * 2.2, 0.6 + Math.random() * 0.8, Math.sin(a) * 2.2,
        1.1 + Math.random() * 0.5, 0.45 + Math.random() * 0.3, 0.95, 0.98, 0.98, 0.8, 1.2, 1.2, 3, 0);
    }
  }
}

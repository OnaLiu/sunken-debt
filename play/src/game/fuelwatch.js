// 燃油逼近（W1，档：中→重）：每趟后段一直能感觉到。每一级同时变颜色、动作、声音，到红色再加一句短字。
//   远（下完这一网还剩 15% 以上）：油表平常色，不出声。
//   近（下完这一网剩不到 15%）：表发黄、边框慢慢一呼一吸，耳边很轻的心跳，约 1 秒一下（剩得越少越快一点、越响一点）。
//   再近（不够下这一网）：表发红，心跳每秒 2 下、每一下表跟着一跳，表上写“油不够这一网”；按下网时按钮一抖，心跳停一拍。
// “这一网”：作业时是对准的那一网（和作业栏、燃油条上那截斜纹同一个数）；航行时是还能下的最省油的那一网（和收尾的判断同一个数）。
// 心跳按游戏时间走：暂停时停，慢放时跟着慢。界面上那一跳和声音是同一下。
import { BOAT } from './boat.js';
import { fxTag } from '../fx/tags.js';

const NEAR = 0.15; // 下完这一网剩不到油箱的 15%：近

export class FuelWatch {
  constructor(g) {
    this.g = g;
    this.level = 0;    // 0 远 / 1 近 / 2 再近
    this.k = 0;        // 近的程度（0 刚进黄，1 快到红）
    this.need = 0; this.reserve = BOAT.fuelCap;
    this.phase = 0.6;  // 心跳相位：一进黄很快就听到第一下
    this.skip = 0; this.calcT = 0;
  }
  // 这一网要多少油、下完还剩多少
  outlook() {
    const g = this.g, b = g.boat;
    let need = 0;
    if (g.mode === 'work' && !g.op && g.est) need = g.est.fuel;
    else if (!g.op) { const L = g.netsLeft(); need = L.n ? L.minFuel : 0; }
    else need = 0; // 网在水下：这一网的油已经预付了
    this.need = need;
    this.reserve = b.fuel - need;
    const lv = need <= 0 && !g.op ? 0 : this.reserve < 0 ? 2 : this.reserve < BOAT.fuelCap * NEAR ? 1 : 0;
    this.k = lv === 1 ? 1 - this.reserve / (BOAT.fuelCap * NEAR) : lv === 2 ? 1 : 0;
    if (lv !== this.level) {
      if (lv > this.level) this.phase = Math.max(this.phase, 0.7);
      this.level = lv;
      if (lv) fxTag('W1', lv === 2 ? '燃油逼近·再近（红）' : '燃油逼近·近（黄）', 'W1');
    }
  }
  update(dt) {
    const g = this.g;
    this.calcT -= dt;
    if (this.calcT <= 0) { this.calcT = 0.1; this.outlook(); }
    // 收获单开着、油已经烧干：不再跳
    if (g.ended || g.boat.fuel <= 0 || !this.level) { this.phase = Math.min(this.phase, 0.6); return; }
    const rate = this.level === 2 ? 2.0 : 0.95 + 0.35 * this.k; // 每秒几下
    this.phase += dt * rate;
    if (this.phase >= 1) { this.phase -= 1; this.beat(); }
  }
  beat() {
    const g = this.g;
    if (this.skip > 0) { this.skip--; g.hud && g.hud.fuelBeat && g.hud.fuelBeat(this.level, true); return; }
    // 揭晓近景里压低（表这时也藏着），不和揭晓抢
    const close = g.reveal.busy && g.reveal.active.phase !== 'pull';
    const vol = (this.level === 2 ? 1.0 : 0.5 + 0.35 * this.k) * (close ? 0.35 : 1);
    g.audio && g.audio.play('heart', { vol, fast: this.level === 2 });
    g.hud && g.hud.fuelBeat && g.hud.fuelBeat(this.level, false);
    fxTag('W1', this.level === 2 ? '燃油逼近·再近（红）' : '燃油逼近·近（黄）', 'W1'); // 每一下心跳：同一条标签记次数
  }
  // 油不够还按了下网：心跳停一拍（下一下不跳），表抖一下
  deny() {
    if (!this.level) return;
    this.skip = 1;
    this.phase = Math.min(this.phase, 0.25);
    this.g.hud && this.g.hud.fuelDeny && this.g.hud.fuelDeny();
    fxTag('W1', '燃油逼近·停一拍', 'W1');
  }
}

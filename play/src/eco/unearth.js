// 蟹翻出埋着的东西（C2）：一段看得出前因后果的过程，不是一下变出来。
//   0–0.9 秒：蟹越刨越急，泥一团比一团冒得多、冒得大；
//   0.9 秒：刨到硬东西——一股泥柱冲起两三米、脚下一圈沙往外推，物件在 0.6 秒里从泥里拱出来（埋深 0.92 → 0.42）；
//   1.3 秒：露出来的硬角在灯下闪一下。
// 开始以后不管蟹接着做什么（走开、受惊躲回去）都会走完；规则上的变化（埋深、“翻出来了”的事件）和以前一样。
import { heightAt } from '../world/layout.js';

export const UNEARTH = { hit: 0.9, rise: 0.6, glint: 1.3, end: 1.7, burial: 0.42 };

export class Unearth {
  constructor(ctx) { this.ctx = ctx; this.list = []; }
  start(cr, it, region) {
    if (this.list.some((u) => u.it === it)) return;
    this.list.push({ cr, it, region, t: 0, b0: it.burial, hit: false, glint: false });
    this.ctx.onEvent && this.ctx.onEvent('digStart', cr, it);
  }
  update(dt) {
    if (!this.list.length) return;
    const P = this.ctx.particles;
    for (const u of this.list) {
      u.t += dt;
      const it = u.it, col = this.ctx.mudColor(u.region), y = heightAt(it.x, it.z);
      // 越刨越急：泥团越来越密、越来越大（都在那件东西的位置上冒，蟹就站在它上面）
      if (u.t < UNEARTH.hit) {
        const k = u.t / UNEARTH.hit;
        if (Math.random() < dt * (5 + 26 * k)) P.puff(it.x + (Math.random() - 0.5) * 0.6, y, it.z + (Math.random() - 0.5) * 0.6, col, 2 + Math.round(k * 4), 0.28 + 0.3 * k);
      }
      if (!u.hit && u.t >= UNEARTH.hit) {
        u.hit = true;
        // 泥柱：往上冲三四米、慢慢摊开、再慢慢落回去（比网触底的泥云窄而高——一眼看出是从一个点里翻出来的）。
        // 翻起来的细泥被上面的光照着，比海底亮
        for (let i = 0; i < 64; i++) {
          const a = Math.random() * 6.283, d = Math.random() * 0.35, up = 2.6 + Math.random() * 3.2;
          P.mud.emit(it.x + Math.cos(a) * d, y + 0.05 + Math.random() * 0.25, it.z + Math.sin(a) * d, Math.cos(a) * 0.4, up, Math.sin(a) * 0.4,
            6.5 + Math.random() * 3.5, 0.55 + Math.random() * 0.7, 1.0, 0.84, 0.58, 0.78, 1.5, 1.15, 0.08, 0);
        }
        // 脚下一圈沙往外推
        for (let i = 0; i < 26; i++) {
          const a = i / 26 * 6.283 + Math.random() * 0.2, sp = 1.1 + Math.random() * 0.7;
          P.mud.emit(it.x + Math.cos(a) * 0.3, y + 0.06, it.z + Math.sin(a) * 0.3, Math.cos(a) * sp, 0.12 + Math.random() * 0.15, Math.sin(a) * sp,
            3.2 + Math.random() * 1.5, 0.36 + Math.random() * 0.26, col[0] * 1.3, col[1] * 1.3, col[2] * 1.3, 0.7, 1.6, 1.6, 0.04, 0);
        }
        u.region.addDecal({ kind: 'scratch', ax: it.x - 0.5, az: it.z - 0.25, bx: it.x + 0.5, bz: it.z + 0.35 });
        this.ctx.onEvent && this.ctx.onEvent('dig', u.cr, it);
      }
      // 从泥里拱出来（先快后慢）
      if (u.hit && it.state === 'seabed') {
        const k = Math.min(1, (u.t - UNEARTH.hit) / UNEARTH.rise), e = 1 - Math.pow(1 - k, 3);
        const b = u.b0 + (UNEARTH.burial - u.b0) * e;
        if (b !== it.burial) u.region.setBurial(it, b);
      }
      // 露出来的硬角闪一下（白光，不是珍品的金星）
      if (!u.glint && u.t >= UNEARTH.glint && it.state === 'seabed') {
        u.glint = true;
        P.sparkle(it.x, y + Math.max(0.05, (it.h || 0.1) * 0.5), it.z, 0.12, 5, false);
      }
    }
    this.list = this.list.filter((u) => u.t < UNEARTH.end);
  }
}

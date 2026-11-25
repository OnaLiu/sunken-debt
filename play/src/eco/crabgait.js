// 蟹走走停停（A4 海底是活的）：规则里的蟹照原样匀速走（什么时候到哪儿、躲不躲、翻不翻，一样不变）；
// 画出来的身子落在它后面一点点——停下来四下看看（眼柄转、有时一只螯在泥里挑一下、带起一小团泥），再一阵小跑追上去。
// 落后最多 0.45 米（蟹自己有 0.42 米宽），不走的时候很快追平。
import { heightAt } from '../world/layout.js';
import { fxTag } from '../fx/tags.js';

const MAX_LAG = 0.45, DASH = 0.95;

export class CrabGait {
  constructor() {
    this.lag = 0; this.state = 'walk'; this.t = 0; this.dur = 1.2;
    this.dx = 0; this.dz = 1; this.px = null; this.pz = null;
    this.ox = 0; this.oz = 0; this.moving = false; this.pick = 0; this.tagT = -99; this.T = 0;
  }
  update(dt, crab, ctx) {
    this.T += dt;
    const walking = crab.mode === 'walk';
    if (this.px == null) { this.px = crab.x; this.pz = crab.z; }
    const mx = crab.x - this.px, mz = crab.z - this.pz, m = Math.hypot(mx, mz);
    this.px = crab.x; this.pz = crab.z;
    if (m > 1e-4) { this.dx = mx / m; this.dz = mz / m; }
    const v = dt > 0 ? m / dt : 0;
    this.t += dt;
    if (!walking) {
      // 不走了（到站、刨食、逃、躲）：落下的那一截很快追平
      this.state = 'walk';
      const run = crab.mode === 'flee' ? 2.2 : DASH;
      this.lag = Math.max(0, this.lag - Math.max(0, run - v) * dt);
      this.moving = crab.mode === 'flee' || this.lag > 0.02;
    } else if (this.state === 'pause') {
      // 停着：身子不动，规则里的蟹接着走，落下的越来越多
      this.lag = Math.min(MAX_LAG, this.lag + v * dt);
      this.moving = false;
      if (this.t > this.dur || this.lag >= MAX_LAG) { this.state = 'dash'; this.t = 0; }
    } else if (this.state === 'dash') {
      // 一阵小跑追上去
      this.lag = Math.max(0, this.lag - Math.max(0, DASH - v) * dt);
      this.moving = true;
      if (this.lag <= 0) { this.state = 'walk'; this.t = 0; this.dur = 0.5 + Math.random() * 1.1; }
    } else {
      // 跟着走一小段，然后停
      this.moving = true;
      if (this.t > this.dur) {
        this.state = 'pause'; this.t = 0; this.dur = 0.5 + Math.random() * 0.8;
        // 停下来有时用螯在泥里挑一下
        if (Math.random() < 0.45) this.pick = 0.55;
        const y = heightAt(crab.x, crab.z);
        if (!window.__fxTagMute && this.T - this.tagT > 5 && (!ctx.seen || ctx.seen(crab.x, y, crab.z))) { this.tagT = this.T; fxTag('A4', '蟹走走停停：停下张望、挑一下泥', 'A4'); }
      }
    }
    if (this.pick > 0) {
      const was = this.pick; this.pick = Math.max(0, this.pick - dt);
      if (was > 0.3 && this.pick <= 0.3 && ctx.particles) ctx.particles.puff(crab.x - this.dx * this.lag + Math.sin(crab.yaw) * 0.25, heightAt(crab.x, crab.z), crab.z - this.dz * this.lag + Math.cos(crab.yaw) * 0.25, ctx.mudColor(crab.region), 2, 0.22);
    }
    this.ox = -this.dx * this.lag; this.oz = -this.dz * this.lag;
  }
}

// 鱼群里每一条怎么游（A4 海底是活的，档：轻）。School（creatures.js）管整群去哪（游荡、觅食、躲到船底、受惊逃开），这里管群里每一条：
//   · 群是长的，顺着游的方向排开；每条鱼按自己“看到的”群头朝向摆位置——前头的先转，后头的晚零点几秒，转向像一道波从群头传到群尾
//   · 转身的那一下鱼侧过身子，侧面一闪（银白），所以一群鱼转向时是一道亮光扫过去
//   · 每隔几秒整群换个方向冲一小段；隔一阵分成两股绕开、再合拢；平时一松一紧地“呼吸”
//   · 被网惊开：每条往外炸开几米，过一会儿一条条慢慢游回来（有的快有的慢，最后几条落在后头）
// 鱼头朝向不会在停下时跳回正北（原来停住时按速度算朝向，速度是 0 就成了 0）。只是表现：鱼群不碰任何规则。
import * as THREE from 'three';
import { heightAt } from '../world/layout.js';
import { angDiff, clamp, lerp } from '../core/noise.js';
import { fxTag } from '../fx/tags.js';

const SILVER = new THREE.Color(1.55, 1.6, 1.62);
const _c = new THREE.Color();
const seen = (ctx, x, y, z) => (ctx.seen ? ctx.seen(x, y, z) : true);

export class SchoolMotion {
  constructor(S) {
    this.S = S;
    const n = S.n;
    this.yaw = new Float32Array(n); this.flash = new Float32Array(n);
    this.sx = new Float32Array(n); this.sz = new Float32Array(n);      // 被惊开时往外炸出去的那一截（慢慢收回来）
    this.sHold = new Float32Array(n); this.sRate = new Float32Array(n);
    this.base = [];
    for (let i = 0; i < n; i++) { const c = new THREE.Color(); S.im.getColorAt(i, c); this.base.push(c); this.yaw[i] = S.off[i][3]; }
    this.H = S.off.length ? S.off[0][3] : 0; this.hist = [];
    // 换方向、分两股：各有各的钟（按群的相位错开，几群不同步）
    const ph = S.t;
    this.turnT = 3 + (ph * 7.3) % 4; this.dart = null;
    this.splitT = 9 + (ph * 3.1) % 8; this.split = 0; this.splitAge = -1;
    this.lastBurst = 0; this.scatter = 0; this.regroupTold = true;
    this.tagT = -99;
  }
  // 群的历史（时刻、群头朝向、群心）：每条鱼按自己晚多少秒去查——后头的鱼跟着前头游过的路走
  stateAt(t) {
    const h = this.hist;
    for (let i = h.length - 1; i >= 0; i--) if (h[i][0] <= t) return h[i];
    return h.length ? h[0] : [t, this.H, this.S.cx, this.S.cz];
  }
  // 整群的目标点：平静的时候隔几秒换个方向冲一小段（返回 [tx, tz, 速度]）
  steer(dt, tx, tz, calm, ctx) {
    const S = this.S;
    if (this.dart) {
      this.dart.t += dt;
      if (!calm || this.dart.t > this.dart.dur) this.dart = null;
      else return [this.dart.x, this.dart.z, 1.7];
    }
    this.turnT -= dt;
    if (calm && this.turnT <= 0) {
      this.turnT = 5 + Math.random() * 4;
      const side = Math.random() < 0.5 ? -1 : 1, a = this.H + side * (0.9 + Math.random() * 0.9), L = 4 + Math.random() * 2.5;
      // 别冲出自己的地盘：往家那边偏一点
      const hx = S.home[0] - S.cx, hz = S.home[1] - S.cz, hd = Math.hypot(hx, hz), pull = clamp((hd - S.radius * 0.6) / S.radius, 0, 1);
      let dx = Math.sin(a), dz = Math.cos(a);
      if (pull > 0) { dx = lerp(dx, hx / hd, pull); dz = lerp(dz, hz / hd, pull); const l = Math.hypot(dx, dz) || 1; dx /= l; dz /= l; }
      this.dart = { x: S.cx + dx * L, z: S.cz + dz * L, t: 0, dur: 2.6 };
      const y = heightAt(S.cx, S.cz);
      if (!window.__fxTagMute && S.t - this.tagT > 4 && seen(ctx, S.cx, y + 1, S.cz)) { this.tagT = S.t; fxTag('A4', '鱼群转向：一道波从群头传到群尾、侧身一闪', 'A4'); }
    }
    return [tx, tz, 0.9];
  }
  // 每条鱼摆到位、转头、侧身一闪
  place(dt, ctx, baseY, calm) {
    const S = this.S, n = S.n, t = S.t;
    // 群头朝向：整群在游的时候跟着游的方向；停着就保持（不跳回 0）
    const vx = S.cx - S.prev[0], vz = S.cz - S.prev[1];
    if (dt > 0 && Math.hypot(vx, vz) / dt > 0.12) this.H += angDiff(this.H, Math.atan2(vx, vz)) * Math.min(1, dt * 5);
    this.hist.push([t, this.H, S.cx, S.cz]); while (this.hist.length > 2 && this.hist[0][0] < t - 1.2) this.hist.shift();
    // 分两股绕开、再合拢
    this.splitT -= dt;
    if (calm && this.splitT <= 0 && this.splitAge < 0) { this.splitAge = 0; this.splitT = 13 + Math.random() * 8; }
    if (this.splitAge >= 0) {
      this.splitAge += dt;
      const a = this.splitAge;
      this.split = a < 2 ? a / 2 : a < 4 ? 1 : Math.max(0, 1 - (a - 4) / 2.6);
      this.split = this.split * this.split * (3 - 2 * this.split);
      if (a > 6.6 || !calm) { this.splitAge = -1; this.split = calm ? 0 : this.split * 0.5; }
    } else this.split = Math.max(0, this.split - dt);
    // 被网惊开：每条往外炸几米，停一下再一条条游回来
    if ((S.burst || 0) > this.lastBurst + 0.5) {
      for (let i = 0; i < n; i++) {
        const p = S.pos[i], ex = p.x - S.bx, ez = p.z - S.bz, el = Math.hypot(ex, ez);
        const a = el > 0.3 ? Math.atan2(ex, ez) : S.off[i][3];
        const m = (3 + S.off[i][4] * 4) * Math.max(0.35, 1 - el / 14);
        this.sx[i] += Math.sin(a) * m; this.sz[i] += Math.cos(a) * m;
        this.sHold[i] = 0.6 + ((i * 0.618) % 1) * 1.6; this.sRate[i] = 0.16 + ((i * 0.381) % 1) * 0.4;
      }
      this.regroupTold = false;
    }
    this.lastBurst = S.burst || 0;
    const spread = S.spread * (calm ? 0.88 + 0.24 * Math.sin(t * 0.23) : 1);
    let scat = 0;
    for (let i = 0; i < n; i++) {
      const o = S.off[i], w = t * o[4] + o[3], p = S.pos[i];
      // 在群里的位置：前后（顺着它看到的群头朝向）、左右；越靠后的越晚转
      const delay = clamp((1 - o[2]) * 0.34, 0, 0.7);
      const st = this.stateAt(t - delay), Hi = st[1], fx = Math.sin(Hi), fz = Math.cos(Hi);
      const lz = o[2] * spread * 2.0, lx = o[0] * spread * 1.35 + ((i & 1) ? 1 : -1) * this.split * 2.4;
      let px = st[2] + fz * lx + fx * lz + Math.sin(w) * 0.3, pz = st[3] - fx * lx + fz * lz + Math.cos(w * 0.8) * 0.3;
      if (this.sHold[i] > 0) this.sHold[i] -= dt;
      else { const k = Math.exp(-dt * this.sRate[i]); this.sx[i] *= k; this.sz[i] *= k; }
      px += this.sx[i]; pz += this.sz[i];
      scat = Math.max(scat, Math.abs(this.sx[i]) + Math.abs(this.sz[i]));
      const py = Math.min(-0.6, Math.max(heightAt(px, pz) + 0.35, baseY + o[1] * spread + Math.sin(w * 1.3) * 0.15));
      const kf = Math.min(1, dt * (S.burst > 0.25 ? 7 : 2.4 + o[4] * 1.4));
      const ox = p.x, oz = p.z;
      p.x += (px - p.x) * kf; p.y += (py - p.y) * Math.min(1, dt * 3); p.z += (pz - p.z) * kf;
      // 头朝游的方向；游得慢时朝群头朝向（不乱转）
      const mx = p.x - ox, mz = p.z - oz, sp = dt > 0 ? Math.hypot(mx, mz) / dt : 0;
      const mv = clamp((sp - 0.25) / 0.5, 0, 1);
      const my = Math.atan2(mx, mz), want = Math.atan2(Math.sin(my) * mv + fx * (1 - mv), Math.cos(my) * mv + fz * (1 - mv));
      const maxR = (S.flee > 0 ? 11 : 5) * dt;
      const dy = clamp(angDiff(this.yaw[i], want), -maxR, maxR);
      this.yaw[i] += dy;
      const rate = dt > 0 ? Math.abs(dy) / dt : 0;
      // 转身那一下侧过身子、侧面一闪
      this.flash[i] = Math.max(this.flash[i] - dt * 2.4, clamp((rate - 0.9) * 0.45, 0, 1));
      const bank = clamp((dt > 0 ? dy / dt : 0) * 0.16, -0.55, 0.55);
      S.dummy.position.copy(p);
      S.dummy.rotation.set(S.dip * (0.45 + Math.sin(w * 3) * 0.25), this.yaw[i] + Math.sin(w * 4) * 0.14, bank, 'YXZ');
      S.dummy.scale.set(1.2, 1.2, 1.2 * S.len); // 比原来大一点：24 米的作业大景里也认得出是一条条鱼
      S.dummy.updateMatrix();
      S.im.setMatrixAt(i, S.dummy.matrix);
      _c.copy(this.base[i]).lerp(SILVER, this.flash[i] * 0.8);
      S.im.setColorAt(i, _c);
    }
    S.im.instanceMatrix.needsUpdate = true;
    if (S.im.instanceColor) S.im.instanceColor.needsUpdate = true;
    // 散开的鱼都差不多回来了
    this.scatter = scat;
    if (!this.regroupTold && scat < 1.2) {
      this.regroupTold = true;
      const y = heightAt(S.cx, S.cz);
      if (seen(ctx, S.cx, y + 1, S.cz)) fxTag('A4', '鱼群慢慢聚回来', 'A4');
    }
  }
}

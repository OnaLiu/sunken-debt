// 一网的前半（第三批）：入水 B5、下沉 B6、收紧 B9、分量 B10、出水 B11，还有网印 B8 什么时候显出来。
// 作业（salvage.js）只在三个点叫一声：网兜碰到水（splash）、网架触底（touch）、网口收好开始提（lift）；
// 其余按网的高度、速度一帧帧在这里走：水面上的花样（post.js 的 uSurf 四格）、气泡、缆绳松紧、吊臂上的分量、网身的摆。
//   B5 入水：网圈整圈砸进水那一帧——水冠、中间一股水柱、细雾、一大团压出来的气泡；水面一片白水散成一圈花边泡沫、三道涟漪；“啪—咕咚—嘶嘶—嗒嗒”
//   B6 下沉：网身一路拖着一串泡；每过测深绳上的一个秒结，网兜吐一团大泡、测深仪“嘀”一声（越近越高、回声越快）；最后不到一秒一股水压往上顶
//   B9 收紧：网架落定，缆绳松下来往水流那边弯；绞车一吃劲，缆绳“铮”一下绷直、抖两下、甩下一串水珠，半拍后网兜从泥里拔出来“啵”
//   B10 分量：吊臂吃上这一网的分量往下一沉（越沉越多、船也往那边歪一点），绞车越沉越低越吃力、卡爪越慢；网越轻，出水后摆得越大
//   B11 出水：网圈顶起水面鼓一个包，破开一片白水；网兜里的水哗地从网眼泄下，砸在水面一片碎白；“哗—噗—哗哗—嗒”
import * as THREE from 'three';
import { NET_R, BOTTOM_OFF, PLUNGE_Y, lowerStep, sinkPlan } from './net.js';
import { SHARED } from '../render/materials.js';
import { fxTag } from '../fx/tags.js';

const PLUNGE = 0, FIZZ = 1, BREACH = 2, POUR = 3;
const DT = 1 / 60, CURVE_DT = 0.05;
const heftName = (h) => (h < 0.1 ? '空的' : h < 0.4 ? '轻' : h < 0.7 ? '中等' : '很重');

export class NetFx {
  constructor(g) {
    this.g = g;
    this.op = null;
    // 网身离臂端正下方偏了多少（网圈 x、z，网架顶 hx、hz，米），网身朝臂端歪了多少（绕 x、z 轴，弧度）
    this.sway = { x: 0, z: 0, hx: 0, hz: 0, rx: 0, rz: 0 };
    this.sv = { x: 0, z: 0 };                     // 摆的速度
    this.tipPrev = null; this.tipVel = new THREE.Vector3();
    this.slots = [null, null, null, null];        // 水面上的事：{ x, z, born, kind, st, R, seed, pour }
    this.later = [];                              // 排好的：{ t, f }
    this.hover = null; this.hoverT = 0; this.lit = new Set(); // 对准着的旧网印（B8）
    this.writeSlots();
  }
  // —— salvage.js 叫的三声 ——
  // 网兜碰到水：网圈还在上面，真正砸下去的那一下在 update 里（网圈到水面那一帧）
  splash(op) { this.opBegin(op); op.fxSplashT = this.g.time; }
  touch(op) {
    const g = this.g;
    this.opBegin(op);
    g.net.cable.setSlack(true);          // 网架的分量交给海底：缆绳松下来
    g.boat.loadWant = 0;                 // 吊臂一轻，往上弹一点
    this.stopPayout();
    op.fxRem = 0;
  }
  lift(op) {
    const g = this.g, h = op.heft ?? 0.35, L = op.lp;
    this.opBegin(op);
    const cab = g.net.cable;
    cab.setSlack(false);
    cab.pluck(0.11 + 0.07 * h, 7.5 - 2.5 * h);
    // 水面以上那段缆绳甩下一串水珠
    const a = cab.pts[0], b = cab.pts[cab.pts.length - 1];
    if (a.y > 0.05) {
      const k = b.y < 0 ? a.y / (a.y - b.y) : 1;
      const c = SHARED.uCurrent.value, cl = Math.hypot(c.x, c.y) || 1;
      g.particles.flick(a.x, a.y, a.z, a.x + (b.x - a.x) * k, a.y + (b.y - a.y) * k, a.z + (b.z - a.z) * k, c.x / cl, c.y / cl, 22);
    }
    // 绞车：这一网怎么提（和 salvage 同一步规则），开头那一刻整条速度排给声音
    const top = g.boat.tipHeight() - 2.3, v = [];
    let y = op.y, sp = 0, t = 0, n = 0;
    while (y < top && n++ < 3000) {
      t += DT;
      // 和 salvage 同一步：咬到硬物（W5）的那一网不憋劲，一下子拽回来
      const strain = !op.bit && t < L.strain;
      sp = Math.min(strain ? 0.8 : L.vmax, sp + DT * (strain ? 2 : op.bit ? 8 : L.acc)); y += sp * DT;
      if (n % 3 === 1) v.push(+sp.toFixed(3));
    }
    v.push(+sp.toFixed(3));
    op.fxLiftT = g.time; op.fxBreached = false; op.fxPour = 0;
    g.audio && g.audio.play('taut', { heft: h });
    op.fxWinch = { heft: +h.toFixed(3), v, vtop: L.vmax };
    g.audio && g.audio.play('winch', { on: true, heft: op.fxWinch.heft, v, dt: CURVE_DT, vtop: L.vmax });
    fxTag('B9', '收紧·缆绳绷直');
    // 吊臂吃上分量：在水里先轻一些（浮力），网兜从泥里拔出来的那一下最吃劲
    const sub = 0.08 + 0.7 * h;
    g.boat.loadWant = sub + 0.15 + 0.25 * h;
    this.at(L.strain * 0.9, () => { if (this.g.op === op && !op.fxBreached) this.g.boat.loadWant = sub; });
    this.at(0.12, () => { if (this.g.op === op) fxTag('B10', '起吊·' + heftName(h)); });
    // 网兜离开泥：网底下翻起一团泥，被拽着往上带
    this.at(0.3 + 0.2 * h, () => { if (this.g.op === op) this.g.particles.suck(op.x, op.T, op.z, NET_R, op.mudColor, 0.6 + 0.6 * h); });
    // 网印：泥团沉下去这两三秒里慢慢显出来
    if (op.imprint) {
      op.imprint.reveal(g.time + 0.3);
      this.at(1.8, () => fxTag('B8', '网印留在泥上'));
    }
  }

  // —— 每帧 ——
  update(dt) {
    const g = this.g, op = g.op;
    if (this.op && op !== this.op) this.opEnd(this.op);
    if (op && op !== this.op) this.opBegin(op);
    for (let i = this.later.length - 1; i >= 0; i--) if (g.time >= this.later[i].t) { const f = this.later[i].f; this.later.splice(i, 1); f(); }
    if (op) this.follow(op, dt);
    this.swing(dt, op);
    this.hoverPrint(dt, op);
    this.writeSlots();
  }
  at(dt, f) { this.later.push({ t: this.g.time + dt, f }); }

  // B8：作业时把网对准一处捞过的地方（网口罩住旧网印），印子亮一下再留一点亮：“这里我捞过”。
  // 刚捞完、落点还停在原处的那一下不算：落点离开过这块印子以后，再回来才算
  hoverPrint(dt, op) {
    const g = this.g;
    let hit = null;
    if (!op && g.mode === 'work' && g.aim && g.world.regionAt) {
      const reg = g.world.regionAt(g.aim.x, g.aim.z, 200);
      if (reg && reg.netImprints) for (const im of reg.netImprints) {
        if (!im.shown) continue;
        const over = Math.hypot(im.x - g.aim.x, im.z - g.aim.z) < NET_R * 1.1;
        if (!over) im.armed = true;
        else if (im.armed && !hit) hit = im;
      }
    }
    if (hit && hit !== this.hover) { this.hoverT = g.time; fxTag('B8', '网印·这里捞过'); }
    this.hover = hit;
    if (hit) this.lit.add(hit);
    for (const im of this.lit) {
      const want = im === hit ? 0.45 + 0.55 * Math.exp(-(g.time - this.hoverT) * 2.2) : 0;
      im.hi += (want - im.hi) * Math.min(1, dt * (want > im.hi ? 14 : 3));
      if (!want && im.hi < 0.005) { im.hi = 0; this.lit.delete(im); }
    }
  }

  opBegin(op) {
    if (this.op === op) return;
    const g = this.g;
    this.op = op;
    op.fxPlunged = false; op.fxRem = null; op.fxSwell = false; op.fxBreached = false; op.fxPour = 0;
    g.net.cable.setSlack(false);
    g.boat.loadWant = 0.08;
    // 放绳：从按下去这一刻到触底，整条速度排给声音
    if (op.state === 'lowering') {
      const restY = op.T + BOTTOM_OFF, s = { y: op.y, v: op.v }, v = [];
      let n = 0;
      while (n < 3000 && !lowerStep(s, restY, DT)) { if (n++ % 3 === 0) v.push(+s.v.toFixed(3)); }
      v.push(0.2);
      g.audio && g.audio.play('payout', { on: true, v, dt: CURVE_DT });
      this.paying = true; this.payV = v; this.payT0 = g.time;
    }
  }
  opEnd(op) {
    const g = this.g;
    this.stopPayout();
    if (op.state !== 'done' && op.state !== 'swing' && op.state !== 'land') g.audio && g.audio.play('winch', { on: false });
    g.boat.loadWant = 0.08;
    g.net.heft = 0;
    g.net.cable.setSlack(false);
    this.op = null;
  }
  // 效果单摆场面时快进跳过了声音：按现在走到哪儿把放绳、绞车接上（速度曲线从现在这一刻往后）
  resumeSound() {
    const g = this.g, op = g.op, a = g.audio;
    if (!a || !op) return;
    const cut = (v, t0) => v.slice(Math.min(v.length - 1, Math.max(0, Math.round((g.time - t0) / CURVE_DT))));
    if (op.state === 'lowering' && this.paying && this.payV) a.play('payout', { on: true, v: cut(this.payV, this.payT0), dt: CURVE_DT });
    if (op.state === 'lifting' && op.fxWinch) a.play('winch', { on: true, heft: op.fxWinch.heft, v: cut(op.fxWinch.v, op.fxLiftT), dt: CURVE_DT, vtop: op.fxWinch.vtop });
  }
  stopPayout() { if (this.paying) { this.paying = false; this.g.audio && this.g.audio.play('payout', { on: false }); } }

  follow(op, dt) {
    const g = this.g, P = g.particles, h = op.heft ?? 0;
    if (op.state === 'lowering') {
      // B5：网圈砸进水的那一帧
      if (!op.fxPlunged && op.splashed && op.y <= PLUNGE_Y) {
        op.fxPlunged = true; op.fxPlungeT = g.time;
        P.plunge(op.x, op.z, NET_R);
        this.slot(PLUNGE, op.x, op.z, 1, 1, NET_R);
        this.slot(FIZZ, op.x, op.z, 2, 0, NET_R * 1.1);
        g.audio && g.audio.play('splash');
        fxTag('B5', '网入水');
      }
      if (op.fxPlunged) {
        const since = g.time - op.fxPlungeT;
        // B6：一路拖着的泡（刚入水那一阵兜里的空气多）
        if (op.y < -0.2) {
          const rate = 60 + 80 * Math.exp(-since * 1.6);
          let n = rate * dt; const whole = Math.floor(n); n = whole + (Math.random() < n - whole ? 1 : 0);
          if (n) P.trail(op.x, op.y, op.z, NET_R, n);
        }
        // 秒结：还剩 3、2、1 秒
        const rem = sinkPlan(op.y, op.T, op.v).t, k = Math.ceil(rem - 1e-4);
        if (op.fxRem == null) op.fxRem = k;
        else if (k < op.fxRem) {
          op.fxRem = k;
          if (k >= 1 && since > 0.3) {
            const depth = Math.max(0, op.y - BOTTOM_OFF - op.T);
            g.audio && g.audio.play('sinkTick', { n: k, gap: +(0.05 + 0.055 * Math.min(4, k)).toFixed(3), depth: +depth.toFixed(2) });
            if (op.y < -0.3) P.burp(op.x, op.y - 0.6, op.z, 16);
            fxTag('B6', `下沉·还剩 ${k} 秒`, 'B6');
          }
        }
        if (!op.fxSwell && rem <= 0.7 && rem > 0.05 && since > 0.3) { op.fxSwell = true; g.audio && g.audio.play('sinkSwell', { dur: +rem.toFixed(3) }); fxTag('B6', '下沉·水压往上顶', 'B6'); }
        // 水面上冒泡：泡从网身走到水面要一会儿，越深越晚到、越散
        const fz = this.slots[FIZZ];
        if (fz) fz.st = Math.min(1, since / 0.8) * 0.95;
      }
    } else if (op.state === 'closing') {
      const fz = this.slots[FIZZ];
      if (fz) fz.st = Math.max(0, fz.st - dt * 0.18);
    } else if (op.state === 'lifting') {
      const fz = this.slots[FIZZ];
      if (fz) fz.st = Math.max(0, fz.st - dt * 0.35);
      // B11：网圈离水面不到半秒，水面先被顶起一个包
      if (!op.fxBreached && op.y < 0 && op.v > 0.05) {
        const until = -op.y / op.v;
        if (until < 0.5) this.slot(BREACH, op.x, op.z, 3, 0.8 + 0.4 * h, NET_R, -until, true);
      }
      if (!op.fxBreached && op.y >= -0.02) {
        op.fxBreached = true; op.fxBreachT = g.time; op.fxBx = op.x; op.fxBz = op.z; op.fxClearT = null; op.fxPourDone = false;
        P.breach(op.x, op.z, NET_R, op.v, h);
        this.slot(BREACH, op.x, op.z, 3, 0.8 + 0.4 * h, NET_R, 0, true);
        g.audio && g.audio.play('surface', { heft: +h.toFixed(3) });
        g.audio && g.audio.play('winchLoad', { k: +h.toFixed(3) });
        fxTag('B11', '破水而出');
        // 出了水：分量一下全吊在臂上，网兜里还兜着一兜水
        g.boat.loadWant = 0.08 + 0.92 * h + 0.16 + 0.16 * h;
        this.at(0.5 + 0.5 * h, () => { if (this.g.op === op) this.g.boat.loadWant = 0.08 + 0.92 * h; });
        // 被水放开的那一下：轻网往旁边一甩
        const a = Math.random() * Math.PI * 2, kick = 0.35 * (1 - h) + 0.08;
        this.sv.x += Math.cos(a) * kick; this.sv.z += Math.sin(a) * kick;
      }
    }
    // 泄水（B11）：网兜还有一截在水里时最猛，整个出了水以后慢慢收成一路滴（吊臂转回去的路上也还在浇，离开出水的地方就淡掉）
    if (op.fxBreached && !op.fxPourDone && (op.state === 'lifting' || op.state === 'swing' || op.state === 'land')) {
      const t = g.time - op.fxBreachT, yb = op.y - (1.2 + 0.38 * h), P0 = 1.4 * (0.7 + 0.6 * h);
      if (yb > 0 && op.fxClearT == null) op.fxClearT = t;
      const k0 = op.fxClearT == null ? 1 : Math.max(0, 1 - (t - op.fxClearT) / P0) ** 1.6;
      const kd = Math.max(0, 1 - Math.hypot(op.x - op.fxBx, op.z - op.fxBz) / 3.2), k = k0 * kd;
      op.fxPour = k;
      const s = this.slot(POUR, op.x, op.z, 3, 0, NET_R, 0, false, true);
      s.pour = k * (0.75 + 0.35 * h);
      if (k > 0.01) {
        let n = (150 + 110 * h) * k * dt; const whole = Math.floor(n); n = whole + (Math.random() < n - whole ? 1 : 0);
        if (n) P.pour(op.x + this.sway.x, op.y - 0.1, yb, op.z + this.sway.z, NET_R, n, op.mudColor, 0.3 + 0.2 * h);
        let m = (40 + 24 * h) * k * dt; const w2 = Math.floor(m); m = w2 + (Math.random() < m - w2 ? 1 : 0);
        if (m && yb > 0) P.splashBack(op.x, op.z, 0.8, m);
      }
      if (k0 <= 0.005) { op.fxPourDone = true; this.slots[POUR] = null; }
    }
  }

  // B10：吊着的网身摆（臂端一动就被带着摆；水里摆不起来；越沉摆得越小越慢）
  swing(dt, op) {
    const g = this.g, sw = this.sway, sv = this.sv;
    const tip = g.boat.tipWorld(this._tip || (this._tip = new THREE.Vector3()));
    if (!this.tipPrev) this.tipPrev = tip.clone();
    const vx = dt > 0 ? (tip.x - this.tipPrev.x) / dt : 0, vz = dt > 0 ? (tip.z - this.tipPrev.z) / dt : 0;
    const ax = dt > 0 ? Math.max(-6, Math.min(6, (vx - this.tipVel.x) / dt)) : 0, az = dt > 0 ? Math.max(-6, Math.min(6, (vz - this.tipVel.z) / dt)) : 0;
    this.tipPrev.copy(tip); this.tipVel.set(vx, 0, vz);
    const free = op && (op.state === 'lifting' ? op.y > 0.3 : op.state === 'swing' || op.state === 'land');
    if (!free || dt <= 0) {
      // 在水里、在底上、没在作业：慢慢回到正下方
      const k = Math.min(1, dt * 3);
      sw.x -= sw.x * k; sw.z -= sw.z * k; sv.x -= sv.x * k; sv.z -= sv.z * k;
    } else {
      const h = op.heft ?? 0, Lc = Math.max(0.8, g.boat.tipHeight() - 0.25 - (g.net.pos.y + 1.75));
      const w = Math.sqrt(9.8 / (Lc + 0.9)) * (1 - 0.3 * h), zeta = 0.1 + 0.18 * h + (op.state === 'land' ? 0.6 : 0);
      const drive = 0.55 * (1 - 0.6 * h);
      for (const [p, v, a] of [['x', 'x', ax], ['z', 'z', az]]) {
        const acc = -w * w * sw[p] - 2 * zeta * w * sv[v] - a * drive;
        sv[v] += acc * dt; sw[p] += sv[v] * dt;
      }
      const lim = 0.45;
      sw.x = Math.max(-lim, Math.min(lim, sw.x)); sw.z = Math.max(-lim, Math.min(lim, sw.z));
    }
    // 绕臂端摆：网架顶偏得少、网圈偏得多，网身的轴始终指着臂端
    const Lr = 1.75 + Math.max(0.8, g.boat.tipHeight() - 0.25 - (g.net.pos.y + 1.75));
    sw.hx = sw.x * (1 - 1.75 / Lr); sw.hz = sw.z * (1 - 1.75 / Lr);
    sw.rx = -Math.atan(sw.z / Lr); sw.rz = Math.atan(sw.x / Lr);
  }

  // —— 水面上的四格 ——
  // keep：同一处已经有这一种就只改时间和强度；follow：已经有这一种就跟着挪过去
  slot(i, x, z, kind, st, R, age = 0, keep = false, follow = false) {
    const s = this.slots[i];
    if (follow && s && s.kind === kind) { s.x = x; s.z = z; return s; }
    if (keep && s && s.kind === kind && Math.abs(s.x - x) < 0.01 && Math.abs(s.z - z) < 0.01) { s.born = this.g.time - age; s.st = st; return s; }
    return (this.slots[i] = { x, z, born: this.g.time - age, kind, st, R, seed: Math.random() * 40, pour: 0 });
  }
  writeSlots() {
    const u = this.g.view && this.g.view.post && this.g.view.post.uniforms;
    if (!u || !u.uSurf) return;
    for (let i = 0; i < 4; i++) {
      const s = this.slots[i], A = u.uSurf.value[i], B = u.uSurfB.value[i];
      if (s && this.g.time - s.born > 12) this.slots[i] = null;
      const c = this.slots[i];
      if (!c) { A.set(0, 0, 0, 0); B.set(0, 1, 0, 0); continue; }
      A.set(c.x, c.z, this.g.time - c.born, c.kind);
      B.set(c.st, c.R, c.seed, c.pour);
    }
  }
}

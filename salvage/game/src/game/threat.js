import * as THREE from 'three';
import { clamp, smoothstep, damp } from '../util/math.js';
import { seabedY } from '../world/terrain.js';
import { trenchZ } from '../sea/index.js';
import { netFuelCost, VIEW_W, VIEW_H } from '../config.js';

// 逼近的威胁（效果清单第 9 节）：油还够几网（W01），深槽里那个东西（W02、C10、C11）。
// 两样都照「远时平常 → 近了发黄 → 再近发红 → 心跳越来越快」；心跳只是提醒，不催，冲洗近景里让开。
const _v = new THREE.Vector3();

export class Threat {
  constructor(g) {
    this.g = g;
    this.reset();
  }

  reset() {
    // 大轮廓：条件到了先「等着」，玩家在开船、手上没有网和揭晓时才出发（不和下网同一刻）
    this.armed = false;
    this.calmT = 0;
    this.stirT = 0;
    this.levD = 1e9;
    this.nearK = 0;
    this.closeK = 0;
    this.proxK = 0;
    this.tier = 0;
    this.cued = {};
    this.staring = false;
    this.liveK = 1;
    // 心跳
    this.beat = 0;
    this.bpm = 0;
    this.nl = null;
    // 「还够几网」按上一网真正用掉的油算（还没下过网：按浅滩那么深算）。船开到深水上不跳，只有真花了油才少
    this.refCost = netFuelCost(4);
    this.windK = 1;
    this.wavesK = 1;
    this.deepK = 0;
    this.depthK = 0;
    this.deepSaid = false;
    this.murk = 0;
    const g = this.g;
    if (g.pipe) {
      const pc = g.pipe.compositeUniforms;
      pc.uMurk.value = 0;
      pc.uShafts.value = 1;
    }
  }

  spent(cost) {
    this.refCost = cost;
  }

  get netsLeft() {
    return Math.floor((this.g.trip.fuel + 1e-6) / this.refCost);
  }

  update(dt, idle) {
    const g = this.g;
    const lev = g.leviathan;
    const work = g.mode === 'sail' || g.mode === 'arm';
    const over = g.trip.ended || g.mode === 'ending' || g.mode === 'summary' || g.mode === 'fading';
    // 只在开船、没有网和冲洗近景、离深槽不远时出发：玩家这会儿在大视野里，接下来一阵不会下网。
    // 打捞模式里照样在开船（船在走、没按下网）也算开船；停着调臂（要下网了）不算
    const bp = g.boatCtl.pos;
    const bc = g.boatCtl;
    const sailing = g.mode === 'sail' || (g.mode === 'arm' && !g.castQ && (Math.abs(bc.speed) > 1.0 || bc.throttle > 0.3));
    const wide = sailing && !g.netop.busy && !g.reveal.cur && !(g.cam.alt.w > 0.05) && !over;
    this.calmT = wide ? this.calmT + dt : 0;
    if (this.armed && !lev.active && !lev.done && this.calmT > 1.5 && bp.z > trenchZ(bp.x) - 42 && bp.x > -70) {
      lev.start(bp, true);
      this.cued = {};
    }
    // 经过时玩家下网（网一入水）、推近冲洗、这一趟到头：它被惊动，扎回深槽底走了，不跟着下网和冲洗近景待着；
    // 还没让玩家看见过（C10 没响）就过一阵、下一回开船时再来
    if (lev.active && !lev.leaving) {
      this.stirT = g.netop.busy || g.reveal.cur || over ? (this.stirT || 0) + dt : 0;
      if (this.stirT > 0.6) lev.leave(!this.cued.C10 && !over);
    }
    // —— 大轮廓离船多远（身子上最近的那一节）——
    let d = 1e9, np = null;
    if (lev.active) {
      for (const sg of lev.segs) {
        const p = sg.m.position;
        const dd = Math.hypot(p.x - bp.x, p.z - bp.z);
        if (dd < d) { d = dd; np = p; }
      }
    }
    this.levD = d;
    this.nearK = smoothstep(57, 52, d);
    this.closeK = smoothstep(42, 37, d);
    this.proxK = smoothstep(55, 16, d);
    const tier = d <= 40 ? 2 : d <= 55 ? 1 : 0;
    if (tier >= 1 && !this.cued.W02) { this.cued.W02 = true; g.cue('W02'); }
    // C10：40 米内、它第一次真正出现在画面里（身子有一节在画面中间那一块）
    if (tier === 2 && !this.cued.C10 && lev.dive < 0.3 && lev.segs.some((sg) => { const p = g.project(sg.m.position); return p.z < 1 && p.x > VIEW_W * 0.1 && p.x < VIEW_W * 0.9 && p.y > VIEW_H * 0.1 && p.y < VIEW_H * 0.9; })) {
      this.cued.C10 = true;
      g.trip.sawLev = true;
      g.cue('C10');
      g.cue('F08');
    }
    this.tier = tier;
    // 船员：40 米内停下手里的活，到那一侧舷边看水；离开 46 米外再回去干活
    const stare = lev.active && !lev.leaving && lev.dive < 0.6 && (this.staring ? d < 46 : d < 40) && work;
    if (stare) g.crew.stare = _v.copy(np);
    else if (this.staring) g.crew.stare = null;
    this.staring = stare;
    // 环境声：
    // C13 往深槽开——船底越深，浪头的「哗」和风越退，深水的嗡起来，引擎「突突」带一点从远处回来的回声：显得孤单（海鸥本来就不到这一片来）
    // W02 大轮廓 55 米内——风声再退下去
    const sd = -seabedY(bp.x, bp.z);
    this.depthK = damp(this.depthK, smoothstep(11, 24, sd), 0.6, dt);
    const dk = this.depthK;
    if (dk > 0.5 && !this.deepSaid) { this.deepSaid = true; g.cue('C13'); }
    else if (dk < 0.25) this.deepSaid = false;
    const wind = (1 - 0.8 * this.nearK) * (1 - 0.55 * dk);
    const waves = 1 - 0.7 * dk;
    if (Math.abs(wind - this.windK) > 0.03 || Math.abs(waves - this.wavesK) > 0.03 || Math.abs(dk - this.deepK) > 0.03) {
      this.windK = wind;
      this.wavesK = waves;
      this.deepK = dk;
      g.audio.setAmbience({ wind, waves, deep: dk, echo: dk }, 2.2);
    }
    // 这一趟到头了（收工、收获单、黑场）：它扎回深槽底，水色、光柱、低音一起慢慢退掉，心跳停
    this.liveK = damp(this.liveK ?? 1, over ? 0 : 1, 1.4, dt);
    // 40 米内水色微暗、光柱被它遮暗
    const pc = g.pipe.compositeUniforms;
    pc.uMurk.value = 0.3 * this.closeK * this.liveK;
    pc.uShafts.value = 1 - 0.6 * this.closeK * this.liveK;
    // 低音：远时轻，越近越满，走远了慢慢退掉
    g.audio.setDread(lev.active && !over ? 0.2 * this.nearK + 0.8 * this.proxK : 0);
    this.heart(dt, idle);
  }

  // 低音心跳：油（剩 3 网 50 次/分、2 网 70、1 网 95，只在开船和调臂时）和大轮廓（55 米起 44 次，越近越快，最快 80）取快的那个
  heart(dt, idle) {
    const g = this.g;
    const n = this.netsLeft;
    const work = (g.mode === 'sail' || g.mode === 'arm') && !idle && !g.trip.ended;
    // 跨进下一档（真花掉的油少了一网，剩 3 网起）：那一刻就是 W01
    if (this.nl != null && n < this.nl && n <= 3) g.cue('W01');
    this.nl = n;
    let bpm = 0, gain = 0, deep = false;
    if (work && n <= 3) {
      bpm = n >= 3 ? 50 : n === 2 ? 70 : 95;
      gain = n >= 3 ? 0.55 : n === 2 ? 0.75 : 0.95;
    }
    const over = g.trip.ended || g.mode === 'ending' || g.mode === 'summary' || g.mode === 'fading';
    if (g.leviathan.active && this.nearK > 0 && g.mode !== 'reveal' && !over) {
      const lb = 44 + 36 * this.proxK;
      if (lb > bpm) { bpm = lb; gain = 0.45 + 0.5 * this.proxK; deep = true; }
      gain *= Math.max(this.nearK, 0.0001);
    }
    this.bpm = bpm;
    if (!bpm || !gain) { this.beat = 0.75; return; }
    this.beat += (dt * bpm) / 60;
    if (this.beat >= 1) {
      this.beat -= 1;
      g.audio.play('heart', { gain, deep });
      if (deep) g.pulse('W02', 8);
      else g.pulse('W01', 8);
    }
  }
}

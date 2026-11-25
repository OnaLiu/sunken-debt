// 一次作业：A 确认 → 预付整次作业油 → 垂直下沉 → 触底扬泥 → 闭网时按真实位置结算 → 提起 → 转回甲板
import * as THREE from 'three';
import { NET_R, ENV_H, BAG_DROP, BOTTOM_OFF, lowerStep, estimateDrop } from './net.js';
import { BOAT } from './boat.js';
import { heightAt } from '../world/layout.js';
import { fxTag } from '../fx/tags.js';

// 扬起的泥：沙湾里的，和沙湾外的普通海底
const MUD_SAND = [0.62, 0.55, 0.42], MUD_BASE = [0.55, 0.5, 0.4];
// 咬到硬物（W5）：网口收到一半（闭网第 0.42 秒）咬住，卡 0.4 秒，然后网自己往回收
const SNAG_AT = 0.42, SNAG_HOLD = 0.4;

// 起吊（B10）：网里越沉，绞车吃劲那一段越长、提起来越慢（h 0 空网 … 1 一只铁锚那么沉）。
// 以一网的平均分量（0.35）为准，和原来一样快：空网快一点，铁锚慢半秒多
export function liftParams(h = 0.35) { const d = h - 0.35; return { strain: 0.8 + 0.5 * d, vmax: 4.8 - 1.1 * d, acc: 6 - 2 * d }; }
// 这一网有多沉：轻的 0.22、中的 0.45、重的 0.95、活物 0.3，加上一兜泥 0.08；最多 1
export function heftOf(entries) {
  let w = 0.08;
  for (const e of entries) w += e.kind === 'live' ? 0.3 : ({ light: 0.22, mid: 0.45, heavy: 0.95 }[e.it.def && e.it.def.mass] ?? 0.4);
  return Math.min(1, entries.length ? w : 0.05);
}

export class SalvageOp {
  constructor(game, x, z, est) {
    this.g = game;
    this.x = x; this.z = z;
    this.T = est.T;
    this.est = est;
    this.state = 'lowering';
    this.t = 0;
    this.y = game.net.pos.y;
    this.v = 0;
    this.load = null;
    this.region = game.world.regionAt(x, z, 200);
    this.mudColor = this.region ? MUD_SAND : MUD_BASE;
    this.splashed = false; this.touched = false;
    this.result = null;
    this.heft = null; // 闭网以后才知道有多沉
    this.lp = liftParams(0.35);
    this.etaTotal = this.eta();
  }
  // 还要多久回到甲板：按同样的下放、起吊规则往前推算（给“要等的事”计时；不改变任何状态）
  eta() {
    const g = this.g, restY = this.T + BOTTOM_OFF, dt = 1 / 30;
    let st = this.state, y = this.y, v = this.v, tt = this.t, t = 0, n = 0;
    if (st === 'lowering') {
      const s = { y, v };
      while (s.y > restY && n++ < 4000) { lowerStep(s, restY, dt); t += dt; }
      st = 'closing'; tt = 0; y = restY;
    }
    if (st === 'closing') { t += Math.max(0, (this.snag ? SNAG_AT + SNAG_HOLD : 0.9) - tt); st = 'lifting'; tt = 0; v = 0; }
    if (st === 'lifting') {
      const top = g.boat.tipHeight() - 2.3, L = this.lp;
      n = 0;
      while (y < top && n++ < 4000) { const strain = !this.snag && tt < L.strain; v = Math.min(strain ? 0.8 : L.vmax, v + dt * (strain ? 2 : this.snag ? 8 : L.acc)); y += v * dt; t += dt; tt += dt; }
      st = 'swing'; tt = 0;
    }
    if (st === 'swing') {
      let ce;
      if (this.state === 'swing') ce = g.boat.craneEta();
      else { const wl = BOAT.washLocal; const [wx, wz] = g.boat.localToWorld2(wl.x, wl.z); const s = g.boat.solveTarget(wx, wz); ce = g.boat.craneEta(s.yaw, s.reach); }
      t += Math.max(0.4 - tt, ce); tt = 0; st = 'land';
    }
    if (st === 'land') t += Math.max(0, 0.6 - tt);
    return t;
  }
  update(dt) {
    const g = this.g, net = g.net;
    this.t += dt;
    const bottomOff = BOTTOM_OFF; // 网兜底部在网架下方
    const restY = this.T + bottomOff; // 网架触底时的高度
    if (this.state === 'lowering') {
      lowerStep(this, restY, dt); // 和界面上测深绳的秒结同一步规则
      // 入水（B5）：水冠、白水、泡沫圈、涟漪、“哗—咕咚”；气泡串和秒结的“嘀”（B6）在 netfx.js 里跟着网走
      if (!this.splashed && this.y - bottomOff < 0.1) { this.splashed = true; g.netFx.splash(this); g.disturb(this.x, this.z, 3.0, 0.6, 0, 0, 'surface'); }
      if (this.y < 0.5 && g.touchFx) g.touchFx.track(this, Math.max(0, this.y - restY));
      if (this.y <= restY) {
        this.y = restY; this.state = 'closing'; this.t = 0;
        this.touch();
      }
    } else if (this.state === 'closing') {
      // 咬到硬物（W5）：网口收到一半咬住，卡在那里抖，停一下，网自己往回收
      if (this.snag && !this.bit && this.t >= SNAG_AT) this.bite();
      const c = this.bit ? SNAG_AT / 0.9 + 0.025 * Math.sin((this.t - this.bitT) * 40) * Math.exp(-(this.t - this.bitT) * 6) : Math.min(1, this.t / 0.9);
      net.setClosure(c);
      if (g.touchFx) g.touchFx.track(this, 0);
      // 收紧（B9）、分量（B10）：绞车吃上劲、缆绳绷直、吊臂一沉——都在 netfx.lift；咬到硬物（W5）卡住 SNAG_HOLD 秒后直接往回拽
      if (this.bit ? this.t - this.bitT >= SNAG_HOLD : c >= 1) { this.capture(); this.state = 'lifting'; this.t = 0; this.v = 0; g.netFx.lift(this); g.touchFx && g.touchFx.lift(this); }
    } else if (this.state === 'lifting') {
      // 咬到硬物以后（W5）不再憋劲慢提：绞车一下子把网拽回来，网口半张着；平常按这一网的分量提（B10）
      const L = this.lp, strain = !this.bit && this.t < L.strain;
      this.v = Math.min(strain ? 0.8 : L.vmax, this.v + dt * (strain ? 2 : this.bit ? 8 : L.acc));
      if (this.bit) net.setClosure(Math.min(0.75, net.closure + dt * 0.4));
      this.y += this.v * dt;
      if (g.touchFx) { if (this.y < 0.5) g.touchFx.track(this, this.y - restY); else g.touchFx.done(this); }
      // 出水（B11）：破水、泄水在 netfx.js 里按网的高度走；这里只管出了水以后一路滴
      if (this.y - bottomOff > -0.2 && !this.surfaced) this.surfaced = true;
      if (this.surfaced && Math.random() < dt * 30) g.particles.drips(this.x, this.y - 1.0, this.z, 1.0, 3, this.mudColor);
      const top = g.boat.tipHeight() - 2.3;
      if (this.y >= top) { this.y = top; this.state = 'swing'; this.t = 0; g.audio && g.audio.play('winch', { on: false }); g.beginSwing(); }
    } else if (this.state === 'swing') {
      // 吊臂把网转回清洗位上方
      const done = g.boat.craneSettled() && this.t > 0.4;
      const tip = g.boat.tipWorld(new THREE.Vector3());
      this.x = tip.x; this.z = tip.z;
      this.y = g.boat.tipHeight() - 2.3;
      if (Math.random() < dt * 12) g.particles.drips(this.x, this.y - 1.0, this.z, 0.8, 2, this.mudColor);
      if (done) { this.state = 'land'; this.t = 0; }
    } else if (this.state === 'land') {
      const tip = g.boat.tipWorld(new THREE.Vector3());
      this.x = tip.x; this.z = tip.z;
      const deckTop = BOAT.deckY + 1.1;
      this.y += (deckTop - this.y) * Math.min(1, dt * 5);
      if (this.t > 0.6) { this.state = 'done'; g.onNetLanded(this); }
    }
    // 触底那一下网架往泥里一沉再弹回一点（7 厘米，0.3 秒）
    const sink = this.state === 'closing' && this.t < 0.3 ? -0.07 * Math.sin(Math.min(1, this.t / 0.3) * Math.PI) * (1 - this.t / 0.3 * 0.5) : 0;
    // 咬住那一下：网架被拽得往上一蹿、歪一下，又被底下的东西拉回去，晃几下
    let jy = 0, rx = 0, rz = 0;
    if (this.bit && (this.state === 'closing' || this.state === 'lifting')) {
      const u = (this.state === 'closing' ? this.t : this.t + SNAG_HOLD) - (this.state === 'closing' ? this.bitT : 0);
      if (u < 1.4) {
        const e = Math.exp(-u * 4.2);
        jy = this.state === 'closing' ? 0.26 * Math.sin(Math.min(1, u / 0.07) * Math.PI / 2) * e * Math.cos(u * 16) : 0;
        rx = this.tilt[0] * e * Math.cos(u * 13); rz = this.tilt[1] * e * Math.sin(u * 11 + 0.6);
      }
    }
    net.pos.set(this.x, this.y + sink + jy, this.z);
    net.group.rotation.set(rx, 0, rz);
  }
  // 网口压着的那件埋着的硬物（和闭网时同一个判定）
  findObstacle() {
    const reg = this.region;
    return reg ? reg.obstacles.find((o) => Math.hypot(o.x - this.x, o.z - this.z) < NET_R + o.r * 0.4) || null : null;
  }
  // 咬住了（W5）：隔着水一声闷闷的金属“咣”和缆绳一紧（snag），跟着缆绳嗡地一颤（twang）；
  // 缆像弦一样横着抖，吊臂臂端被拽得一点头，船往吊臂那边一沉；网架一蹿一歪；硬物那里翻出一股黑泥和一串气泡
  bite() {
    const g = this.g, o = this.snag;
    this.bit = true; this.bitT = this.t;
    const dx = o.x - this.x, dz = o.z - this.z, L = Math.hypot(dx, dz) || 1;
    // 往硬物那一边歪（它咬住的那一侧被拽下去）
    this.tilt = [0.16 * dz / L, -0.16 * dx / L];
    g.say('碰到埋着的硬物：网自动收回', 'warn');
    g.audio && g.audio.play('snag'); g.audio && g.audio.play('twang');
    g.net.twang(0.42);
    g.boat.yank(0.045);
    const [lx, lz] = g.boat.worldToLocal2(this.x, this.z);
    g.boat.dip(0.06, Math.sign(lx) * 2, lz * 0.3);
    const gx = this.x + dx / L * NET_R * 0.8, gz = this.z + dz / L * NET_R * 0.8;
    g.particles.mudCloud(gx, this.T - 0.1, gz, 0.9, [0.3, 0.27, 0.22], 1.1);
    for (let i = 0; i < 6; i++) g.particles.bubbles(gx + (Math.random() - 0.5) * 0.6, this.T + Math.random() * 0.5, gz + (Math.random() - 0.5) * 0.6, 3);
    for (let y = this.T + 2; y < -0.3; y += 1.2) g.particles.bubbles(this.x + (Math.random() - 0.5) * 0.2, y, this.z + (Math.random() - 0.5) * 0.2, 1);
    g.disturb(this.x, this.z, 4, 0.6, this.T);
    fxTag('W5', '咬到埋着的硬物', 'W5');
  }
  touch() {
    const g = this.g;
    this.touched = true;
    this.snag = this.findObstacle();
    // 声音和画面同一帧：闷响、贴底翻出的一圈泥沙、沙浪、草趴下（见 touchfx.js）
    g.audio && g.audio.play('thump', { depth: -this.T });
    if (g.touchFx) g.touchFx.hit(this, g.particles, this.mudColor);
    else g.particles.mudCloud(this.x, this.T, this.z, NET_R * 0.9, this.mudColor);
    // 网口罩住的活物被网架压在里面逃不出去（和闭网时收入用同一条判定，不会“按住了又放跑”）；网口外的受惊避让
    const pinned = new Set(g.creaturesNear(this.x, this.z, NET_R + 1).filter((cr) => this.holds(cr)));
    g.disturb(this.x, this.z, 6.5, 1.0, this.T, pinned);
    // 网印（B8）：压在泥上的那一刻就在了，被网和泥团盖着；提网、泥沉下去以后才显出来
    if (this.region) this.imprint = this.region.addNetMark(this.x, this.z, NET_R, this.est.kind === '船体');
    g.netFx.touch(this);
  }
  // 活物是否在网的包络里：身体完整在网口内、高度在网兜够得着的范围、没躲进遮蔽
  holds(cr) {
    if (!cr.catchable || cr.captured) return false;
    if (cr.inShelter && cr.inShelter()) return false;
    const p = cr.position();
    if (Math.hypot(p.x - this.x, p.z - this.z) + (cr.r || 0.25) * 0.6 > NET_R) return false;
    return p.y >= this.T - BAG_DROP - 0.1 && p.y <= this.T + ENV_H;
  }
  // 闭网瞬间：真实进入包络的物件与活物才收入
  capture() {
    const g = this.g;
    const reg = this.region;
    const T = this.T;
    const hitObstacle = this.findObstacle();
    const entries = [];
    const notes = [];
    for (const it of g.world.itemsNear(this.x, this.z, NET_R + 2)) {
      if (it.state !== 'seabed') continue;
      const d = Math.hypot(it.x - this.x, it.z - this.z);
      const inside = d + it.r * 0.85 <= NET_R;
      const within = it.baseY >= T - BAG_DROP && it.baseY <= T + ENV_H;
      if (!inside || !within) { if (d < NET_R && within && !inside) notes.push('edge'); continue; }
      const maxBur = hitObstacle ? 0.3 : 0.7;
      if (it.burial > maxBur) { notes.push(hitObstacle ? 'obstacle' : 'buried'); continue; }
      entries.push({ kind: 'item', it });
    }
    // 活物：按闭网时的位置
    for (const cr of g.creaturesNear(this.x, this.z, NET_R + 3)) {
      if (!this.holds(cr)) continue;
      entries.push({ kind: 'live', cr });
      cr.capture();
    }
    for (const e of entries) {
      if (e.kind !== 'item') continue;
      const it = e.it;
      it.state = 'netted';
      if (it.mound) it.mound.visible = false;
      if (reg) {
        const r2 = g.world.regionById(it.region);
        (r2 || reg).addImprint(it.x, it.z, Math.max(0.25, it.r * 0.85));
        // 原先被它压住的一小片可能露出来
        for (const o of (r2 || reg).items.values()) if (o !== it && o.state === 'seabed' && Math.hypot(o.x - it.x, o.z - it.z) < it.r + 0.6 && o.burial > 0.3) (r2 || reg).setBurial(o, Math.max(0.25, o.burial - 0.2));
      }
      g.notifyItemTaken(it);
    }
    this.load = { entries, x: this.x, z: this.z, T, obstacle: !!hitObstacle, notes };
    this.heft = heftOf(entries); this.lp = liftParams(this.heft); g.net.heft = this.heft;
    this.result = { count: entries.length, obstacle: !!hitObstacle, notes };
    g.logEvent({ type: 'net', x: +this.x.toFixed(2), z: +this.z.toFixed(2), T: +T.toFixed(2), got: entries.map((e) => (e.kind === 'item' ? e.it.id : e.cr.id)), notes });
    // 网中泥包（遮住内容）
    g.setNetLoad(entries.length ? Math.min(1.2, 0.45 + entries.reduce((s, e) => s + (e.kind === 'item' ? e.it.r : 0.25) ** 2, 0) ** 0.5) : 0.3, entries.some((e) => e.kind === 'live'));
    for (const e of entries) if (e.kind === 'item') e.it.mesh.visible = false;
    // 网口收紧时咬到埋着的硬物：隔着水一声闷闷的金属“咣”（和空网落回甲板的那一声分开）
    // （咬住那一下已经在 bite() 里响过、说过；这里只管没赶上咬的情况）
    if (hitObstacle && !this.bit) { g.say('碰到埋着的硬物：网自动收回', 'warn'); g.audio && g.audio.play('snag'); fxTag('W5', '碰到埋着的硬物', 'W5'); }
  }
}

export { estimateDrop };

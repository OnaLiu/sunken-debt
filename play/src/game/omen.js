// 珍品那一网的预兆（C4）：从网离底到落甲板，这一网和普通的不一样——重。
//   起吊：离合“咣”地咬上，吊臂往下一沉再弹一下、一直弯着；船往吊臂那边歪；绞盘的音调被拖低，底下一阵阵喘；吊臂时不时吱嘎一声。
//         镜头往前凑一点、压低一点，从侧面看着吊臂和网。
//   出水：网带上来的泥水里拖着一缕金色（水面上顺着流拖开、网底下一缕金水往下淌、网包上一闪一闪），一串细细的亮声；出水那一下吊臂再沉一截。
//   落甲板：比普通的更沉——极低的一下压到肚子里；吊臂卸了劲往上一弹；船身左右晃三四下才稳住，两舷的水哗地拍起来。
// 只是表现：不改网、吊臂、时长的任何规则（网升多快、什么时候转回来都和普通一网一样）。
import * as THREE from 'three';
import { BOAT } from './boat.js';
import { fxTag } from '../fx/tags.js';
import { angDiff, clamp, lerp } from '../core/noise.js';

const BEND = { K: 55, C: 4.5, lift: 1.0, wet: 1.3 };       // 吊臂弯的弹簧（一沉一弹）；离底时弯多少、出水后（没了浮力）弯多少
const ROLL = { K: 20, C: 1.1, kick: 0.17 };                  // 落甲板后船身左右晃（约 1.4 秒一个来回，晃三四下）
const HEEL = { roll: 0.0042, pitch: 0.0016 };                // 船往吊臂那边歪：每米横距、纵距歪多少（弧度）
const GOLD = [1.0, 0.76, 0.3];

function sr(x, a, b) { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); }

export class Omen {
  constructor(game) {
    this.g = game;
    this.cur = null;      // 这一网：{ op, load, t, beat, … }
    this.bend = 0; this.bv = 0; this.bendT = 0;
    this.roll = 0; this.rv = 0;
    this.heel = 0;        // 0–1：歪的程度（随载荷进出）
    this.camK = 0;
    this.sheen = null;
    const U = game.view.post.uniforms;
    this.U = U;
    if (U.uSheen) U.uSheen.value.w = 0;
  }
  // 这一网是不是珍品（闭网时已经定了网里有什么）
  static precious(load) { return !!(load && load.entries && load.entries.some((e) => e.kind === 'item' && e.it.precious)); }

  update(dt) {
    const g = this.g, op = g.op, boat = g.boat;
    // 跟上这一网：网离底时认出来；落到甲板后（op 没了）继续跟到船身稳住
    if (op && op.load && Omen.precious(op.load) && (!this.cur || this.cur.op !== op) && (op.state === 'lifting' || op.state === 'swing' || op.state === 'land')) this.start(op);
    const C = this.cur;
    if (C) { C.t += dt; this.step(dt, C); }
    // 卸了载：歪着的船慢慢回正（不是一下弹回去）
    if (!(this.cur && op && op === this.cur.op)) this.heel = Math.max(0, this.heel - dt * 2.2);
    // 弹簧：吊臂的弯、落甲板后的晃
    const ba = BEND.K * (this.bendT - this.bend) - BEND.C * this.bv;
    this.bv += ba * dt; this.bend += this.bv * dt;
    const ra = -ROLL.K * this.roll - ROLL.C * this.rv;
    this.rv += ra * dt; this.roll += this.rv * dt;
    if (!C && Math.abs(this.bend) < 1e-3 && Math.abs(this.bv) < 1e-3 && Math.abs(this.roll) < 1e-4 && Math.abs(this.rv) < 1e-4) { this.bend = this.bv = this.roll = this.rv = 0; }
    this.camK = Math.max(0, Math.min(1, this.camK + dt * (C && C.cam ? 0.55 : -1.2)));
    this.updateSheen(dt);
    this.apply(boat);
  }

  start(op) {
    const g = this.g;
    this.cur = { op, load: op.load, t: 0, phase: '', creak: 1.1, glint: 0, stream: 0, cam: true, surfaced: false, landed: false, a0: Math.random() * 6.28 };
    // 网离底那一下
    this.bendT = BEND.lift;
    g.audio && g.audio.play('omenClutch');
    g.audio && g.audio.play('omenStrain', { on: true, load: 0.6 });
    g.shake && g.shake(0.12);
    fxTag('C4', '珍品预兆·起吊吃力', 'C4');
  }

  step(dt, C) {
    const g = this.g, op = g.op && g.op === C.op ? g.op : null, A = g.reveal.active;
    const audio = g.audio;
    // 效果单摆场面时声音是关着的：放的时候接上吃力的那一阵（已经在响就不再起）
    if (op && audio && audio.ctx && !audio.paused && !audio.loops.omen) audio.play('omenStrain', { on: true, load: C.surfaced ? 1 : 0.6 });
    if (op) {
      this.heel = Math.min(1, this.heel + dt * 1.6);
      // 出水：泥水里带一缕金
      if (!C.surfaced && op.surfaced) this.surface(C, op);
      if (op.state === 'swing' && C.phase !== 'swing') { C.phase = 'swing'; audio && audio.play('omenStrain', { load: 0.9 }); }
      // 吊臂吱嘎：一下一下，越吃力越密
      C.creak -= dt;
      if (C.creak <= 0) { C.creak = 1.1 + Math.random() * 0.9; audio && audio.play('omenCreak', { k: Math.random() }); this.bv -= 0.6; }
      // 出水以后：网底一缕金水往下淌，网包上一闪一闪
      if (C.surfaced) this.goldDrip(dt, C, op);
      // 网吊着时细细地抖（钢缆绷紧）
      const buzz = (C.t < 1.2 ? 1 - C.t / 1.2 : 0) * 0.035 + (C.surfaced && C.t - C.surfT < 0.8 ? 0.025 : 0);
      if (buzz > 0) { const n = g.net.pos; n.x += Math.sin(g.time * 97) * buzz; n.z += Math.cos(g.time * 83) * buzz * 0.8; n.y += Math.sin(g.time * 71) * buzz * 0.5; }
      // 臂端弯下来、歪过去多少，网跟着低多少、偏多少（钢缆一直是竖的；网升到哪儿停、什么时候转回来照规则不变）
      const S = g.boat.strain;
      if (op.state === 'lifting') { g.net.pos.x += S.dx; g.net.pos.z += S.dz; }
      if (op.state === 'land' && C.landTop == null) C.landTop = op.y;
      const wy = op.state !== 'land' ? 1 : clamp((op.y - BOAT.deckY - 1.1) / Math.max(0.1, C.landTop - BOAT.deckY - 1.1), 0, 1);
      if (S.on) g.net.pos.y += S.ty * wy;
      if (op.state === 'land' && C.t > 0) C.cam = false;
    } else {
      C.cam = false;
      // 落到甲板：等泥包砸下去那一帧
      if (A && A.load === C.load && A.landed && !C.landed) this.land(C);
      if (!A || A.load !== C.load) { if (!C.landed) this.release(); this.cur = null; return; }
      if (C.landed) {
        C.since = (C.since || 0) + dt;
        // 船身晃到一边的时候，那一舷的水拍起来
        const side = Math.sign(this.rv) || 1;
        if (C.lastSide !== side && Math.abs(this.roll) > 0.012) { C.lastSide = side; this.slosh(-side, Math.abs(this.roll) / 0.04); }
        if (C.since > 4) this.cur = null;
      }
    }
  }
  surface(C, op) {
    const g = this.g;
    C.surfaced = true; C.surfT = C.t;
    this.bendT = BEND.wet; this.bv -= 1.2;            // 没了浮力：再沉一截
    g.audio && g.audio.play('omenGlint');
    g.audio && g.audio.play('omenStrain', { load: 1 });
    // 水面上拖开的那一缕：从网边上起，顺着离船的方向、偏一点流向
    const b = g.boat, dx = op.x - b.x, dz = op.z - b.z, L = Math.hypot(dx, dz) || 1;
    const ang = Math.atan2(dx / L, dz / L) + 0.35;
    this.sheen = { x: op.x + Math.sin(ang) * 0.9, z: op.z + Math.cos(ang) * 0.9, dx: Math.sin(ang), dz: Math.cos(ang), t: 0 };
    // 泥水哗地落回去，里面亮晶晶的几颗
    for (let i = 0; i < 26; i++) {
      const a = Math.random() * 6.28, r = 0.4 + Math.random() * 1.0;
      g.particles.spark.emit(op.x + Math.cos(a) * r, 0.15 + Math.random() * 0.5, op.z + Math.sin(a) * r, Math.cos(a) * 0.6, 0.8 + Math.random() * 1.4, Math.sin(a) * 0.6, 0.7 + Math.random() * 0.6, 0.07 + Math.random() * 0.06, GOLD[0], GOLD[1], GOLD[2], 1, -0.2, 0.6, 3.5);
    }
    fxTag('C4', '珍品预兆·出水带金', 'C4');
  }
  goldDrip(dt, C, op) {
    const g = this.g, n = g.net.pos;
    const k = op.state === 'lifting' ? 1 : 0.55;
    // 一缕：网底同一个角上一直往下淌（金色的泥水），里面一颗颗亮的往下掉
    C.stream += dt * 40 * k;
    const a = C.a0, x = n.x + Math.cos(a) * 0.55, z = n.z + Math.sin(a) * 0.55, y = n.y - 1.05;
    while (C.stream >= 1) {
      C.stream -= 1;
      const j = Math.random();
      g.particles.water.emit(x + (Math.random() - 0.5) * 0.08, y, z + (Math.random() - 0.5) * 0.08, 0, -0.4 - Math.random() * 0.4, 0, 0.9, 0.12 + Math.random() * 0.05,
        lerp(GOLD[0], 0.62, j * 0.5), lerp(GOLD[1], 0.5, j * 0.5), lerp(GOLD[2], 0.32, j * 0.5), 0.95, 0, 0, 9.8);
      if (j < 0.6) g.particles.spark.emit(x + (Math.random() - 0.5) * 0.06, y - Math.random() * 0.2, z + (Math.random() - 0.5) * 0.06, 0, -1.5 - Math.random(), 0, 0.45, 0.07 + Math.random() * 0.04, 1, 0.82, 0.42, 1, -0.4, 0, 8);
    }
    C.glint -= dt;
    if (C.glint <= 0) {
      C.glint = 0.07 + Math.random() * 0.12;
      // 金星：一半在那一缕里往下落，一半在网包上闪
      if (Math.random() < 0.5) g.particles.spark.emit(x, y - Math.random() * 0.8, z, 0, -2.5, 0, 0.3, 0.12, 1, 0.9, 0.55, 1, -0.6, 0, 6);
      else { const b = Math.random() * 6.28; g.particles.spark.emit(n.x + Math.cos(b) * 0.6, n.y - 0.4 - Math.random() * 0.5, n.z + Math.sin(b) * 0.6, 0, 0.05, 0, 0.28, 0.16, 1, 0.88, 0.5, 1, -0.8, 0, 0); }
    }
  }
  land(C) {
    const g = this.g;
    C.landed = true; C.since = 0; C.lastSide = 0;
    this.bendT = 0; this.bv += 2.2;                    // 卸了劲：吊臂往上一弹
    // 船身一晃：压在哪一舷就先往哪一舷倒
    this.rv = -Math.sign(BOAT.washLocal.x || 1) * ROLL.kick;
    g.audio && g.audio.play('omenStrain', { on: false, fade: 0.15 });
    g.audio && g.audio.play('omenLand');
    fxTag('C4', '珍品预兆·落甲板更沉', 'C4');
  }
  // 没等到落甲板就换了一网（效果单换场面、重开）：收干净
  release() { const a = this.g.audio; a && a.play('omenStrain', { on: false }); this.bendT = 0; }
  slosh(side, k) {
    const g = this.g, b = g.boat;
    k = clamp(k, 0.3, 1.2);
    for (let i = 0; i < Math.round(16 * k); i++) {
      const lz = -6 + (Math.random() - 0.4) * 9;
      const [x, z] = b.localToWorld2(side * 2.85, lz);
      g.particles.water.emit(x, 0.1, z, (Math.random() - 0.5) * 0.6, 1.2 + Math.random() * 1.6 * k, (Math.random() - 0.5) * 0.6, 0.55 + Math.random() * 0.35, 0.11 + Math.random() * 0.07, 0.88, 0.95, 0.97, 0.85, 0, 0.3, 9.8);
    }
  }
  updateSheen(dt) {
    const U = this.U, S = this.sheen;
    if (!U.uSheen) return;
    if (!S) { U.uSheen.value.w = 0; return; }
    S.t += dt;
    // 慢慢拖长、顺着水漂，2 秒后淡去
    const k = S.t, amp = sr(k, 0, 0.35) * (1 - sr(k, 1.8, 4.6));
    S.x += S.dx * dt * 0.35; S.z += S.dz * dt * 0.35;
    U.uSheen.value.set(S.x, S.z, 1.5 + 6.5 * sr(k, 0, 2.2), amp * 1.15);
    U.uSheenDir.value.set(S.dx, S.dz);
    if (k > 4.6) { this.sheen = null; U.uSheen.value.w = 0; }
  }

  // 把弯、歪、晃交给船（船在 updateVisual 里摆出来；臂端、钢缆按同样的量偏）
  apply(boat) {
    const S = boat.strain, op = this.g.op;
    S.bend = this.bend;
    // 往吊臂那边歪：按臂端在船上的横距、纵距
    let lx = BOAT.craneLocal.x + Math.sin(boat.craneYaw) * boat.craneReach, lz = BOAT.craneLocal.z + Math.cos(boat.craneYaw) * boat.craneReach;
    const hk = this.heel * (op && op.state === 'lifting' && op.y < -0.5 ? 0.75 : 1);
    S.roll = -HEEL.roll * lx * hk + this.roll;
    S.pitch = HEEL.pitch * lz * hk;
    S.sink = -0.035 * hk;
    // 臂端因此偏了多少（世界坐标）：竖直方向给 tipHeight，水平方向给 tipWorld
    const y = BOAT.craneLocal.y + 1.5 + Math.tan(boat.luff) * boat.craneReach;
    const dxl = -y * S.roll, dzl = y * S.pitch;
    const c = Math.cos(boat.heading), s = Math.sin(boat.heading);
    S.dx = dxl * c + dzl * s; S.dz = -dxl * s + dzl * c;
    S.ty = lx * S.roll - lz * S.pitch + S.sink - (S.drop || 0);
    S.on = Math.abs(S.bend) > 1e-3 || Math.abs(S.roll) > 1e-4 || Math.abs(S.pitch) > 1e-4;
  }

  // 镜头（作业视角）：起吊到转回来这一段，往前凑、压低一点、转到能看见吊臂侧面的地方，看着吊臂和网之间
  camera(want, look, c, dist) {
    const g = this.g, b = g.boat, k = this.camK * this.camK * (3 - 2 * this.camK);
    if (k <= 0) return look;
    const tip = b.tipWorld(new THREE.Vector3()); tip.y = b.tipHeightVis();
    const n = g.net.pos;
    const f = new THREE.Vector3(lerp(n.x, tip.x, 0.35), lerp(Math.max(n.y, -1.5), tip.y, 0.42), lerp(n.z, tip.z, 0.35));
    const boomAng = b.heading + b.craneYaw;
    const p1 = boomAng + Math.PI / 2, p2 = boomAng - Math.PI / 2;
    const perp = Math.abs(angDiff(c.yaw, p1)) < Math.abs(angDiff(c.yaw, p2)) ? p1 : p2;
    const yaw = c.yaw + clamp(angDiff(c.yaw, perp), -0.55, 0.55) * 0.8;
    const pitch = Math.min(c.pitch, 0.42), d = clamp(dist * 0.62, 11, 22), cp = Math.cos(pitch);
    const w2 = new THREE.Vector3(f.x + Math.sin(yaw) * cp * d, f.y + Math.sin(pitch) * d, f.z + Math.cos(yaw) * cp * d);
    want.lerp(w2, k);
    return look.clone().lerp(f, k);
  }
}

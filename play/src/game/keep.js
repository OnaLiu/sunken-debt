// 获得和留下（效果清单第六批）：B19 拉回大视野、B21 进舱、C8 珍品进舱（标志时刻 S3）、C10 活蟹进水槽、A6 舱里越攒越多。
// （B20 结果卡入账在界面那边：src/ui/hud.js）
// 全是表现：收获在揭晓那一刻已经记好，这里不碰结算，也不挡任何操作。镜头只是“偏一点”：
//   拉回的 1.25 秒绕着船升起来退出去（不从船身里穿过），停在船和海都在画里的地方；
//   之后镜头偏向舱口（珍品：跟着抱它的那个人走到舱口），玩家一推摇杆移落点、一缩放、一换模式、一下网，就慢慢让回去。
// 这里的随机数用自己的一串（不动全局 Math.random：玩法和机器人用它）。
import * as THREE from 'three';
import { BOAT } from './boat.js';
import { TIMING } from './reveal.js';
import { RNG } from '../core/rng.js';
import { angDiff } from '../core/noise.js';
import { fxTag } from '../fx/tags.js';

const MASS_W = { heavy: 1.0, mid: 0.55, light: 0.25 };
const H = BOAT.hatchLocal, DY = BOAT.deckY;
const COAM = DY + 0.5;                          // 舱口围板顶
const TK = BOAT.tankLocal;
const TANK_FLOOR = DY + 0.12, TANK_WATER = DY + 0.62;
const GOLD = 0xffc35a, WARM = 0xffb878;

// 镜头偏多少：k 往目标挪几成，mul 离得近几成。普通的一网只把舱口挪进画里；珍品跟着人走，近一点
const FRAME = { normal: { k: 0.62, mul: 0.85, max: 12 }, tank: { k: 0.85, mul: 0.68, max: 14 }, precious: { k: 0.8, mul: 0.7, max: 16 } };

const sstep = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const smoother = (t) => t * t * t * (t * (t * 6 - 15) + 10);
const _v = new THREE.Vector3(), _w = new THREE.Vector3(), _c = new THREE.Vector3();
const _gold = new THREE.Color(1, 0.78, 0.3);

// 一池光（中间亮、四边淡）、一道光柱（底下亮、往上淡）：画进小画布当贴图
let _glow = null, _shaft = null;
function glowTex() {
  if (_glow) return _glow;
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const x = c.getContext('2d'), gr = x.createRadialGradient(32, 32, 1, 32, 32, 32);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.5, 'rgba(255,255,255,.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = gr; x.fillRect(0, 0, 64, 64);
  return (_glow = new THREE.CanvasTexture(c));
}
function shaftTex() {
  if (_shaft) return _shaft;
  const c = document.createElement('canvas'); c.width = 16; c.height = 64;
  const x = c.getContext('2d'), gr = x.createLinearGradient(0, 64, 0, 0);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.25, 'rgba(255,255,255,.6)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = gr; x.fillRect(0, 0, 16, 64);
  return (_shaft = new THREE.CanvasTexture(c));
}
const addMat = (map, color) => new THREE.MeshBasicMaterial({ map, color, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
function flat(w, d, map, color) { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), addMat(map, color)); m.rotation.x = -Math.PI / 2; m.visible = false; return m; }
function shaftMesh() {
  // 方的光柱（和舱口一样是方的）：四面开口，底下亮、往上淡
  const geo = new THREE.CylinderGeometry(1.3, 1.12, 3.2, 4, 1, true); geo.rotateY(Math.PI / 4); geo.translate(0, 1.6, 0);
  const m = new THREE.Mesh(geo, addMat(shaftTex(), GOLD)); m.visible = false; m.renderOrder = 3; return m;
}
function ringMesh() { const m = new THREE.Mesh(new THREE.RingGeometry(0.78, 1.0, 28), addMat(null, 0xdff6ff)); m.rotation.x = -Math.PI / 2; m.visible = false; return m; }
// 着色器预热：和这里一样的材质（标题画面期间先编好）
export function keepWarmMeshes() { const a = flat(1, 1, glowTex(), WARM), b = shaftMesh(), c = ringMesh(); for (const m of [a, b, c]) { m.visible = true; m.material.opacity = 0.01; } return [a, b, c]; }

// 物件本体材质上的几个量（发光、颜色）
function bodyU(mesh) {
  if (!mesh) return null;
  if (mesh.userData.bodyU !== undefined) return mesh.userData.bodyU;
  let u = null;
  mesh.traverse((o) => { if (!u && o.isMesh && o.material && o.material.userData && o.material.userData.u && o.material.userData.u.uGlow) u = o.material.userData.u; });
  mesh.userData.bodyU = u;
  return u;
}

export class Keep {
  constructor(game) {
    this.g = game;
    this.rng = new RNG(0x5eed6);
    game.crew.tankToss = true; // 蟹由这里从手上抛进水槽（C10），船员不再把它直接摆进槽里
    const deck = game.boat.deck;
    this.lamp = flat(1.62, 1.62, glowTex(), WARM); this.lamp.position.set(H.x, DY + 0.07, H.z); this.lamp.renderOrder = 1;
    this.haze = flat(1.75, 1.75, glowTex(), GOLD); this.haze.position.set(H.x, COAM - 0.03, H.z); this.haze.renderOrder = 2;
    this.shaft = shaftMesh(); this.shaft.position.set(H.x, DY + 0.08, H.z);
    this.ripple = ringMesh(); this.ripple.position.set(TK.x, TANK_WATER + 0.005, TK.z); this.ripple.renderOrder = 4;
    for (const m of [this.lamp, this.haze, this.shaft, this.ripple]) deck.add(m);
    this.pull = null;     // 拉回那 1.25 秒的弧线
    this.fr = null;       // 拉回以后镜头偏向哪里（让回去以前）
    this.c8 = null;       // 珍品进舱这一串
    this.gold = 0;        // 舱里留着金光（0~1，珍品进舱以后一直亮到这一趟结束）
    this.lampF = 0; this.lampGold = 0; this.shaftT = -1; this.rippleT = -1;
    this.sinkNow = 0;
    this.q = [];          // 晚一点再做的事（游戏时间）
    this.lastStowT = -9;
    this.t = 0;
  }
  later(sec, fn) { this.q.push({ at: this.t + sec, fn }); }
  r() { return this.rng.next(); }
  world(x, y, z, out = _v) { out.set(x, y, z); return this.g.boat.deck.localToWorld(out); }

  // —————————— B19 拉回大视野 ——————————
  // 揭晓走到拉回（RevealDirector.pullBack 之后）：记下近景这一帧的镜头（按甲板坐标，船开走了也跟着），之后 1.25 秒走弧线
  onPull(A) {
    const g = this.g, c = g.cam, deck = g.boat.deck;
    this.pull = { t: 0, p0: deck.worldToLocal(c.pos.clone()), l0: deck.worldToLocal(c.look.clone()), mode0: g.mode, tagged: false };
    const prec = !!(A && A.precious), tank = !!(A && A.entries.length && A.entries.every((e) => e.kind === 'live'));
    this.fr = { t: 0, w: 1, release: false, mode0: g.mode, prec, tank, ...(prec ? FRAME.precious : tank ? FRAME.tank : FRAME.normal), meshes: new Set((A ? A.entries : []).map((e) => e.mesh)), done: 0 };
    g.audio && g.audio.play('pullOut', { k: prec ? 1.2 : 1 });
    if (prec && A.main && A.main.kind === 'item') this.c8 = { phase: 'pre', t: 0, mesh: A.main.mesh, it: A.main.it, carrier: null };
    if (this.c8) fxTag('C8', '珍品进舱·预兆（镜头跟着它、其他人让开）', 'C8');
  }
  // 这一帧的作业 / 航行镜头算好以后：往舱口（珍品：往它）偏一点。want 是镜头位置，look 是看点，都原地改
  frame(want, look, dt, inp) {
    const F = this.fr, g = this.g;
    if (!F) return;
    F.t += dt;
    if (!F.release) {
      const zoom = Math.abs(inp.zoom || 0) + Math.abs(inp.zoomHold || 0) > 0.01;
      const aimMove = g.mode === 'work' && (Math.abs(inp.move.x) + Math.abs(inp.move.y) > 0.2 || !!inp.click);
      // 搬的东西都进舱了（或进了水槽）：再看一会儿就让回去
      if (!F.done && !this.pull && !g.deckCargo.some((c) => F.meshes.has(c.mesh)) && !(F.prec && this.c8)) F.done = F.t + (F.prec ? 2.2 : 1.1);
      if (zoom || aimMove || g.mode !== F.mode0 || g.op || F.t > F.max || (F.done && F.t > F.done)) F.release = true;
    }
    F.w = F.release ? Math.max(0, F.w - dt / 1.1) : Math.min(1, F.w + dt / 0.35);
    if (F.release && F.w <= 0 && !this.pull) { this.fr = null; return; }
    // 看哪里：珍品跟着它（在甲板上、在人手里、放进舱里），普通的一网看舱口
    const C = this.c8;
    // 只捞上来活蟹：看水槽
    const tgt = C && C.mesh ? C.mesh.getWorldPosition(_w) : F.tank ? this.world(TK.x, DY + 0.5, TK.z + 0.6, _w) : this.world(H.x, DY + 0.4, H.z, _w);
    if (C) tgt.y = Math.max(tgt.y, this.g.boat.deck.localToWorld(_c.set(0, DY + 0.5, 0)).y);
    const w = smoother(F.w) * F.k;
    // 珍品停在舱口那半拍和放进去那一下再近一点
    const mul = F.mul * (C && (C.phase === 'hold' || C.phase === 'after') ? 0.9 : 1);
    _c.subVectors(want, look);
    look.lerp(tgt, w);
    want.copy(look).addScaledVector(_c, 1 - (1 - mul) * smoother(F.w));
  }
  // 拉回那 1.25 秒：绕着船心升起来、退出去（水平按角度和半径插，不走直线穿过驾驶室和吊臂），先抬头再退；之后交还给弹簧
  arc(c, want, look, dt) {
    const P = this.pull;
    if (!P) return false;
    P.t += dt;
    const u = Math.min(1, P.t / TIMING.pull);
    const deck = this.g.boat.deck;
    const C = this.world(0, DY + 1.2, -2, _c).clone();
    const s = deck.localToWorld(_v.copy(P.p0)).sub(C), e = _w.copy(want).sub(C);
    const ex = smoother(u), ey = 1 - Math.pow(1 - u, 2.6);
    const as = Math.atan2(s.x, s.z), ae = Math.atan2(e.x, e.z), da = angDiff(as, ae);
    const rs = Math.hypot(s.x, s.z), re = Math.hypot(e.x, e.z);
    const a = as + da * ex, r = rs + (re - rs) * ex, y = s.y + (e.y - s.y) * ey;
    c.pos.set(C.x + Math.sin(a) * r, C.y + y, C.z + Math.cos(a) * r);
    const l0 = deck.localToWorld(_v.copy(P.l0));
    c.look.copy(l0).lerp(look, smoother(Math.min(1, u / 0.8)));
    if (c.vel) c.vel.set(0, 0, 0);
    if (c.lvel) c.lvel.set(0, 0, 0);
    if (u >= 1) {
      this.pull = null;
      fxTag('B19', '拉回大视野·到位，接着干', 'B19|拉回大视野');
    }
    return true;
  }

  // —————————— 搬运：拿起、放下 ——————————
  onPicked(entry, s) {
    const g = this.g, C = this.c8;
    if (entry.kind === 'live') {
      g.audio && g.audio.play('crabClick');
      fxTag('C10', '活蟹·船员捏起来', 'C10');
      return;
    }
    if (C && entry.mesh === C.mesh) {
      C.phase = 'carry'; C.carrier = s; C.t = 0;
      g.crew.makeWay && g.crew.makeWay(s, entry.mesh);
    }
  }
  // 东西放进舱（B21；珍贵的那件是 C8）
  stow(entry) {
    const g = this.g;
    const it = entry.e && entry.e.kind === 'item' ? entry.e.it : null;
    const def = it && it.def;
    const mass = MASS_W[def && def.mass] ?? 0.4;
    const precious = !!(it && it.precious);
    if (precious) { this.burst(entry, it); return; }
    // 两件前后脚放进去：后一件晚半拍（不叠成一声）
    const delay = this.t - this.lastStowT < 0.18 ? 0.18 : 0;
    this.lastStowT = this.t + delay;
    g.audio && g.audio.play('stow', { mass, mat: def && def.mat, delay });
    g.reveal.hold.flash(entry.mesh, { mass, precious: false, delay });
    this.later(delay, () => {
      // 舱里那盏灯一下亮起来（大视野里暗的方口一下变暖），围板四边吐一圈尘
      this.lampF = Math.max(this.lampF, 0.32 + mass * 0.3); this.lampGold = 0;
      this.puff(mass);
      if (mass > 0.5) g.boat.dip && g.boat.dip(0.012 + 0.025 * mass, H.x, H.z);
    });
    fxTag('B21', '进舱');
    const n = g.reveal.hold.count;
    fxTag('A6', `舱里越攒越多（${n} 件，船吃水深一点）`, 'A6');
  }
  // 围板四边吐一圈尘（像舱里一口气被压出来）：沙色的烟团贴着围板往外推、往上散
  puff(mass) {
    const g = this.g;
    if (!g.smoke) return;
    const n = 3 + Math.round(mass * 3);
    for (let side = 0; side < 4; side++) {
      for (let i = 0; i < n; i++) {
        const along = (this.r() - 0.5) * 1.5, ox = side < 2 ? along : (side === 2 ? 0.88 : -0.88), oz = side < 2 ? (side === 0 ? 0.88 : -0.88) : along;
        const p = this.world(H.x + ox, COAM + 0.02, H.z + oz);
        const d = this.world(H.x + ox * 1.6, COAM + 0.02, H.z + oz * 1.6, _w).sub(p).normalize();
        const sp = 0.45 + this.r() * 0.4;
        g.smoke.emit(p.x, p.y, p.z, d.x * sp, 0.25 + this.r() * 0.3, d.z * sp, 0.7 + this.r() * 0.4, 0.13 + this.r() * 0.08 + mass * 0.05, 0.86, 0.79, 0.66, 0.85, 1.6);
      }
    }
  }
  // —————————— C8 珍品进舱（标志时刻 S3）——————————
  // 爆发：放进去的那一刻。舱口一下灌满金光（底下一池、往上一道方的光柱、围板一圈往外扩），沉沉一声“咚”，船吃进这份重量；
  // 让在两边的人一起点头；余波里舱口冒金尘，金光留在舱里一直到这一趟结束
  burst(entry, it) {
    const g = this.g;
    const C = this.c8 || (this.c8 = { phase: 'carry', t: 0, mesh: entry.mesh, it, carrier: null });
    C.phase = 'after'; C.t = 0;
    g.audio && g.audio.play('stowGold', { silver: !!it.silver });
    g.reveal.hold.flash(entry.mesh, { mass: 1, precious: true });
    this.lampF = 1.4; this.lampGold = 1; this.shaftT = 0;
    g.boat.dip && g.boat.dip(0.075, H.x, H.z);
    const p = this.world(H.x, COAM - 0.1, H.z);
    for (let i = 0; i < 30; i++) {
      const a = this.r() * 6.283, sp = 0.4 + this.r() * 1.4;
      g.particles.spark.emit(p.x + Math.cos(a) * 0.5 * this.r(), p.y, p.z + Math.sin(a) * 0.5 * this.r(), Math.cos(a) * sp * 0.5, 1.2 + this.r() * 1.8, Math.sin(a) * sp * 0.5, 1.0 + this.r() * 0.9, 0.04 + this.r() * 0.05, 1.0, 0.84, 0.42, 1, 0, 1.4, -0.15);
    }
    g.crew.honorBurst && g.crew.honorBurst();
    g.crew.captain && g.crew.captain.gesture('wave');
    const u = bodyU(entry.mesh); if (u) u.uGlow.value = 0.6;
    fxTag('C8', '珍品进舱·爆发（金光一闪、沉沉一声咚）', 'C8');
    fxTag('B21', '进舱（珍贵的那件）');
    fxTag('A6', `舱里越攒越多（${g.reveal.hold.count} 件，船吃水深一点）`, 'A6');
  }
  updateC8(dt) {
    const C = this.c8, g = this.g;
    if (!C) return;
    C.t += dt;
    const u = bodyU(C.mesh);
    if (C.phase === 'pre' || C.phase === 'carry') {
      // 抱着走的时候它身上一直透着一点金光（大视野里看得见是哪一件在往舱口走）
      if (u) { u.uGlowCol.value.set(C.it && C.it.silver ? 0xffe6b0 : 0xffd27a); u.uGlow.value = 0.13 + 0.05 * Math.sin(this.t * 3.1); }
      const s = C.carrier, T = s && s.task;
      if (C.phase === 'carry' && T && T.type === 'carry' && T.phase === 'lower' && T.lift && T.t >= T.lift * 0.6 && T.t < T.hold) {
        C.phase = 'hold'; C.t = 0;
        g.audio && g.audio.play('goldHold', { dur: T.hold - T.t + 0.38 }); // 一直涨到落进去那一下
        fxTag('C8', '珍品进舱·憋住（舱口停半拍）', 'C8');
      }
      if (C.t > 30) this.c8 = null; // 没人来搬（不该发生）：不等了
      return;
    }
    if (C.phase === 'hold') {
      // 憋住：举在舱口上方，金光一点点涨起来
      const T = C.carrier && C.carrier.task;
      const k = T && T.hold ? Math.max(0, Math.min(1, (T.t - T.lift) / (T.hold - T.lift))) : 1;
      if (u) u.uGlow.value = 0.15 + 0.32 * k * k;
      if (this.r() < dt * 14) { const p = C.mesh.getWorldPosition(_w); g.particles.spark.emit(p.x + (this.r() - 0.5) * 0.3, p.y + 0.1, p.z + (this.r() - 0.5) * 0.3, 0, 0.35, 0, 0.6, 0.035, 1.0, 0.85, 0.45, 1, 0, 1.0, 0); }
      return;
    }
    if (C.phase === 'after') {
      // 余波：舱口冒一缕金色的尘，慢慢往上散；本体的光退到“隐约”
      if (u) u.uGlow.value = Math.max(0.2, 0.6 - C.t * 0.4);
      this.gold = Math.min(1, C.t / 0.6);
      if (C.t < 1.8 && g.smoke) {
        C.acc = (C.acc || 0) + dt * 9;
        while (C.acc > 1) {
          C.acc -= 1;
          const p = this.world(H.x + (this.r() - 0.5) * 1.1, COAM, H.z + (this.r() - 0.5) * 1.1);
          g.smoke.emit(p.x, p.y, p.z, (this.r() - 0.5) * 0.2, 0.45 + this.r() * 0.35, (this.r() - 0.5) * 0.2, 1.5 + this.r() * 0.7, 0.16 + this.r() * 0.1, 1.0, 0.8, 0.42, 0.75, 2.0);
        }
      }
      if (C.t < 2.2 && this.r() < dt * 16) {
        const p = this.world(H.x + (this.r() - 0.5) * 1.2, COAM + 0.1, H.z + (this.r() - 0.5) * 1.2);
        g.particles.spark.emit(p.x, p.y, p.z, (this.r() - 0.5) * 0.2, 0.4 + this.r() * 0.5, (this.r() - 0.5) * 0.2, 1.4 + this.r(), 0.035 + this.r() * 0.03, 1.0, 0.84, 0.45, 1, 0, 1.2, 0);
      }
      if (C.t > 0.9 && !C.aft) { C.aft = true; fxTag('C8', '珍品进舱·余波（舱口冒金尘）', 'C8'); }
      if (C.t > 2.4) {
        this.c8 = null;
        fxTag('C8', '珍品进舱·余韵（舱里留着金光）', 'C8');
        fxTag('A6', '舱里留着金光（一直到这一趟结束）', 'A6');
      }
    }
  }

  // —————————— C10 活蟹：格栅上挣动、捏起来、放进水槽 ——————————
  // 甲板上还没人来拿：挣两下、横着窜一截（不出它那块地方），有人走近就转过去举螯
  deckCrab(c, dt) {
    const g = this.g, look = c.e && c.e.cr && c.e.cr.look, m = c.mesh;
    if (!look || !m) return;
    // 刚从展示台放回甲板、还没落稳：先只挣，落稳了再记它那块地方
    if (m.userData.settling) { look.struggle(this.t * 1.25 + m.id); return; }
    const S = c.k || (c.k = { mode: 'struggle', t: 0, dur: 0.5, x0: m.position.x, z0: m.position.z, yaw: m.rotation.y, tagged: false });
    S.t += dt;
    // 有人来拿它了：转过去对着那个人，举起两只螯（先让它在格栅上窜过一截：来拿的人碰巧就在旁边时也一样）
    const s = S.tagged && S.mode !== 'dash' && g.crew.hands.find((h) => h.task && h.task.type === 'carry' && h.task.e && h.task.e.mesh === m);
    if (s && Math.hypot(s.x - m.position.x, s.z - m.position.z) < 1.8) {
      const ty = Math.atan2(s.x - m.position.x, s.z - m.position.z);
      if (S.mode !== 'threat') { S.mode = 'threat'; S.t = 0; look.react(false, ty); }
      S.yaw += angDiff(S.yaw, ty) * Math.min(1, dt * 6); m.rotation.y = S.yaw;
      look.update(dt, { moving: false, fast: false, digging: false, fold: 0, yaw: S.yaw });
      if (look.rt > 0.8) look.react(false, ty);
      return;
    }
    if (S.mode === 'dash') {
      const dx = S.tx - m.position.x, dz = S.tz - m.position.z, d = Math.hypot(dx, dz);
      const st = Math.min(d, 1.0 * dt);
      if (d > 0.01) { m.position.x += dx / d * st; m.position.z += dz / d * st; }
      look.update(dt, { moving: d > 0.02, fast: true, digging: false, fold: 0, yaw: S.yaw });
      if (d < 0.02 || S.t > 0.8) { S.mode = 'struggle'; S.t = 0; S.dur = 0.5 + this.r() * 0.7; m.userData.dashed = true; }
      return;
    }
    look.struggle(this.t * 1.25 + c.mesh.id);
    if (S.t > S.dur) {
      // 往船舷那边窜一截（离原地不超过 0.4 米）
      const a = this.r() * 6.283, rr = 0.15 + this.r() * 0.25;
      S.tx = S.x0 + Math.sin(a) * rr; S.tz = S.z0 + Math.cos(a) * rr;
      S.yaw = Math.atan2(S.tx - m.position.x, S.tz - m.position.z); m.rotation.y = S.yaw;
      S.mode = 'dash'; S.t = 0;
      if (!S.tagged) { S.tagged = true; fxTag('C10', '活蟹·在格栅上挣动', 'C10'); }
    }
  }
  // 拿在手里：腿乱蹬、螯乱夹，隔一会儿“咔”一下
  heldCrab(c, dt) {
    const look = c.e && c.e.cr && c.e.cr.look;
    if (!look) return;
    look.struggle(this.t * 1.8);
    c.clk = (c.clk ?? 0.5) - dt;
    if (c.clk <= 0) { c.clk = 0.55 + this.r() * 0.5; this.g.audio && this.g.audio.play('crabClick', { soft: true }); }
  }
  // 放进水槽：从手上抛到水槽正上方，扑通掉进水里（溅一下、一圈波纹、一串气泡），沉到底，缓一缓，开始在槽里走
  onTank(t) {
    const m = t.mesh;
    t.k = { mode: 'toss', t: 0, p0: m.position.clone(), x: TK.x + (this.r() - 0.5) * 0.2, z: TK.z + (this.r() - 0.5) * 0.3, y: 0, vy: 0, yaw: m.rotation.y, splashed: false };
  }
  updateTank(dt, list) {
    const g = this.g;
    for (const t of list) {
      const m = t.mesh, look = t.e && t.e.cr && t.e.cr.look;
      const S = t.k || (t.k = { mode: 'pause', t: 0, x: m.position.x, z: m.position.z, y: TANK_FLOOR, vy: 0, yaw: m.rotation.y, dur: 1 });
      S.t += dt;
      if (S.mode === 'toss') {
        const k = Math.min(1, S.t / 0.2);
        m.position.set(S.p0.x + (S.x - S.p0.x) * k, S.p0.y + (DY + 0.95 - S.p0.y) * k + Math.sin(k * Math.PI) * 0.1, S.p0.z + (S.z - S.p0.z) * k);
        if (look) look.struggle(this.t * 2);
        if (k >= 1) { S.mode = 'fall'; S.y = m.position.y; S.vy = 0; S.t = 0; }
        continue;
      }
      if (S.mode === 'fall') {
        if (S.y > TANK_WATER) S.vy -= 9.8 * dt;
        else { if (!S.splashed) { S.splashed = true; this.splash(S.x, S.z, Math.abs(S.vy)); } S.vy = S.vy * Math.exp(-dt * 7) - 0.6 * dt; }
        S.y += S.vy * dt;
        if (look) look.struggle(this.t * 1.6);
        if (S.y <= TANK_FLOOR) { S.y = TANK_FLOOR; S.mode = 'pause'; S.t = 0; S.dur = 0.7; }
        m.position.set(S.x, S.y, S.z);
        continue;
      }
      // 在槽里：走一截、停一会儿、偶尔对着玻璃举螯；吐一个泡
      if (S.mode === 'walk') {
        const dx = S.tx - S.x, dz = S.tz - S.z, d = Math.hypot(dx, dz), st = Math.min(d, 0.16 * dt);
        if (d > 0.005) { S.x += dx / d * st; S.z += dz / d * st; }
        if (look) look.update(dt, { moving: d > 0.01, fast: false, digging: false, fold: 0, yaw: S.yaw });
        if (d < 0.01 || S.t > 4) { S.mode = 'pause'; S.t = 0; S.dur = 1.2 + this.r() * 2.5; if (this.r() < 0.35 && look) { look.react(false, S.yaw); S.dur += 0.6; } }
      } else {
        if (look) look.update(dt, { moving: false, fast: false, digging: false, fold: 0, yaw: S.yaw });
        if (S.t > S.dur) {
          S.tx = TK.x + (this.r() - 0.5) * 0.36; S.tz = TK.z + (this.r() - 0.5) * 0.7;
          S.yaw = Math.atan2(S.tx - S.x, S.tz - S.z);
          S.mode = 'walk'; S.t = 0;
          if (!this.tankTagged) { this.tankTagged = true; fxTag('A6', '水槽里的蟹在动', 'A6tank'); }
        }
      }
      m.rotation.y += angDiff(m.rotation.y, S.yaw) * Math.min(1, dt * 5);
      m.position.set(S.x, S.y + Math.sin(this.t * 1.7 + m.id) * 0.006, S.z);
      if (this.r() < dt * 0.35) { const p = this.world(S.x, S.y + 0.15, S.z); g.particles.spark.emit(p.x, p.y, p.z, 0, 0.45, 0, (TANK_WATER - S.y - 0.15) / 0.45, 0.03, 0.85, 0.95, 1.0, 0.7, 0, 0, 0); }
    }
  }
  // 扑通一下：水花从槽口溅出来、水面一圈波纹往外推、一串气泡；越快掉进去溅得越高
  splash(x, z, v) {
    const g = this.g, k = Math.min(1.3, 0.6 + v * 0.18);
    g.audio && g.audio.play('plunk', { k });
    const p = this.world(x, TANK_WATER + 0.02, z);
    for (let i = 0; i < 24; i++) {
      const a = this.r() * 6.283, sp = (0.35 + this.r() * 0.6) * k;
      g.particles.water.emit(p.x, p.y, p.z, Math.cos(a) * sp, (1.4 + this.r() * 1.4) * k, Math.sin(a) * sp, 0.45 + this.r() * 0.3, 0.08 + this.r() * 0.06, 0.9, 0.96, 1.0, 0.95, 0, 0.2, 9.8);
    }
    for (let i = 0; i < 7; i++) {
      const q = this.world(x + (this.r() - 0.5) * 0.2, TANK_FLOOR + 0.1 + this.r() * 0.15, z + (this.r() - 0.5) * 0.2);
      g.particles.spark.emit(q.x, q.y, q.z, 0, 0.5 + this.r() * 0.4, 0, 0.6 + this.r() * 0.4, 0.025 + this.r() * 0.025, 0.85, 0.95, 1.0, 0.75, 0, 0.3, 0);
    }
    this.ripple.position.set(x, TANK_WATER + 0.005, z);
    this.rippleT = 0;
    fxTag('C10', '活蟹·进水槽（扑通、溅一下）', 'C10');
  }

  // —————————— 每帧 ——————————
  update(dt) {
    const g = this.g;
    this.t += dt;
    if (this.q.length) { const due = this.q.filter((x) => x.at <= this.t); this.q = this.q.filter((x) => x.at > this.t); for (const x of due) x.fn(); }
    this.updateC8(dt);
    const hold = g.reveal.hold;
    // A6：舱里亮一盏暖灯（放进去的东西被照着，堆得越多灯池越亮）；珍品进舱以后一池金光一直留着
    let W = 0;
    for (const x of hold.items) {
      W += MASS_W[x.mass] ?? 0.4;
      const u = bodyU(x.mesh);
      if (!u || (this.c8 && x.mesh === this.c8.mesh)) continue;
      if (x.precious) { u.uGlowCol.value.set(0xffd27a); u.uGlow.value = 0.16 + 0.07 * Math.sin(this.t * 2.1 + 1); }
      else if (!x.lit) { x.lit = true; u.uGlowCol.value.set(0xffd2a0); u.uGlow.value = 0.06; }
      if (x.precious && !this.c8) this.gold = Math.min(1, this.gold + dt);
    }
    const n = hold.count;
    this.lampF = Math.max(0, this.lampF - dt * (this.lampGold ? 0.9 : 1.6));
    const lampA = (n ? Math.min(0.2, 0.07 + n * 0.014) : 0) + this.gold * 0.1;
    this.lamp.visible = lampA + this.lampF > 0.002;
    if (this.lamp.visible) {
      this.lamp.material.opacity = lampA + this.lampF * (this.lampGold ? 0.5 : 0.38);
      this.lamp.material.color.setHex(WARM).lerp(_gold, Math.min(1, this.lampGold * this.lampF + this.gold * 0.5));
    }
    const hz = this.gold * (0.2 + 0.07 * Math.sin(this.t * 2.1));
    this.haze.visible = hz > 0.002; this.haze.material.opacity = hz;
    // 光柱：放进去那一下往上冲，1.3 秒散掉
    if (this.shaftT >= 0) {
      this.shaftT += dt;
      const u = this.shaftT, a = u < 0.06 ? u / 0.06 : Math.pow(Math.max(0, 1 - (u - 0.06) / 1.25), 1.7);
      this.shaft.visible = a > 0.002; this.shaft.material.opacity = a * 0.85;
      this.shaft.scale.set(1 + 0.08 * u, 0.55 + 0.7 * (1 - Math.pow(1 - Math.min(1, u / 0.8), 3)), 1 + 0.08 * u);
      if (u > 1.4) { this.shaftT = -1; this.shaft.visible = false; }
    }
    // 水槽里的波纹
    if (this.rippleT >= 0) {
      this.rippleT += dt;
      const u = this.rippleT;
      this.ripple.visible = true; this.ripple.scale.setScalar(0.06 + 0.36 * (1 - Math.pow(1 - Math.min(1, u / 0.7), 2)));
      this.ripple.material.opacity = 0.75 * Math.max(0, 1 - u / 0.8);
      if (u > 0.8) { this.rippleT = -1; this.ripple.visible = false; }
    }
    // A6：舱里越重，船吃水越深（满满一舱约 15 厘米）；水槽里的蟹也算一点
    W += (g.tank ? g.tank.length : 0) * 0.3;
    const want = 0.15 * (1 - Math.exp(-W / 2.4));
    this.sinkNow += (want - this.sinkNow) * (1 - Math.exp(-dt * 1.4));
    g.boat.loadSink = this.sinkNow;
  }
}

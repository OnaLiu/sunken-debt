// 结算（第九批）在船上的那一半；收获单本身在 ui/haul.js，再来一次的黑场在 ui/again.js。
//   C3  空网：网兜往下浇一股泥水，砸在甲板上溅开、摊成一摊，几秒里从甲板缝漏掉；几粒泥、一两缕水草；离得最近的人转过来耸耸肩
//   C12 三种收工船上那一下：捞完——汽笛冒一股白汽，舱口满满一亮、舱里的东西一件接一件反光，大家对着镜头举手；
//       没油——烟囱咳出两团黑烟（和咳声对上）、船身两抖，熄火滑停，有人耸耸肩；中途收工——大家转过来点点头，只落暗幕
//   C11 预兆：手上没活的人停下来，一个接一个转身对着镜头，船长挥挥手；镜头缓缓退到告别的位置（船在画面右边，左边留给收获单）
//   D1  再来一次：新的一趟在黑场里先开上一小段，揭开时船已经在走（arrive）
import * as THREE from 'three';
import { BOAT } from './boat.js';
import { fxTag } from '../fx/tags.js';
import { angDiff, clamp } from '../core/noise.js';
import { haulPlan, skipPlan } from '../ui/haul.js';

const W = BOAT.washLocal, H = BOAT.hatchLocal, DY = BOAT.deckY;
const FUNNEL = [-0.6, 2.2], FUNNEL_Y = DY + 3.7;   // 烟囱口（甲板坐标；和 game.exhaust 一样）
const smoother = (u) => { u = clamp(u, 0, 1); return u * u * u * (u * (u * 6 - 15) + 10); };
const _v = new THREE.Vector3(), _w = new THREE.Vector3();

// 一摊泥水的样子：几团叠在一起的不规则圆，边上深一圈、中间反一点天光（画一次，几摊共用）
let PUD = null, WET = null;
function puddleTex(wet) {
  const S = 128, cv = document.createElement('canvas'); cv.width = cv.height = S;
  const x = cv.getContext('2d');
  const blobs = [[64, 64, 46], [38, 56, 28], [90, 70, 30], [60, 94, 26], [72, 32, 24], [28, 84, 16], [104, 44, 17], [100, 98, 14]];
  for (const [cx, cy, r] of blobs) {
    const gr = x.createRadialGradient(cx, cy, r * 0.2, cx, cy, r * (wet ? 1.25 : 1));
    if (wet) { gr.addColorStop(0, 'rgba(20,16,10,0.55)'); gr.addColorStop(1, 'rgba(20,16,10,0)'); }
    else { gr.addColorStop(0, 'rgba(96,80,56,0.92)'); gr.addColorStop(0.72, 'rgba(78,64,44,0.9)'); gr.addColorStop(0.9, 'rgba(52,42,28,0.85)'); gr.addColorStop(1, 'rgba(52,42,28,0)'); }
    x.fillStyle = gr; x.beginPath(); x.arc(cx, cy, r * (wet ? 1.25 : 1), 0, Math.PI * 2); x.fill();
  }
  if (!wet) {
    // 水面反光：斜斜一抹亮
    const g2 = x.createLinearGradient(40, 40, 80, 70);
    g2.addColorStop(0, 'rgba(220,214,196,0)'); g2.addColorStop(0.5, 'rgba(220,214,196,0.5)'); g2.addColorStop(1, 'rgba(220,214,196,0)');
    x.globalCompositeOperation = 'source-atop'; x.fillStyle = g2; x.fillRect(30, 46, 60, 9); x.fillRect(52, 74, 34, 5);
  }
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
function flat(tex, order) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, opacity: 0, polygonOffset: true, polygonOffsetFactor: -2 }));
  m.rotation.x = -Math.PI / 2; m.renderOrder = order; m.visible = false;
  return m;
}
// 一缕水草：窄窄一条，弯两道
function weedMesh() {
  const g = new THREE.PlaneGeometry(0.05, 0.46, 1, 6), p = g.attributes.position;
  for (let i = 0; i < p.count; i++) p.setX(i, p.getX(i) + Math.sin(p.getY(i) * 11) * 0.035);
  return new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: 0x3e5a24, side: THREE.DoubleSide, transparent: true }));
}

export class Settle {
  constructor(g) {
    this.g = g;
    this.t = 0;
    this.q = [];          // 晚一点再做的事（游戏时间）
    this.pour = null;     // C3 网兜正往下浇泥水
    this.pud = null;      // C3 甲板上那一摊
    this.end = null;      // 收工以后（C12、C11 预兆和告别取景）
    const deck = g.boat.deck;
    this.wet = flat(WET || (WET = puddleTex(true)), 1);
    this.puddle = flat(PUD || (PUD = puddleTex(false)), 2);
    this.weeds = [weedMesh(), weedMesh()];
    for (const m of [this.wet, this.puddle, ...this.weeds]) { m.visible = false; deck.add(m); }
  }
  later(sec, fn) { this.q.push({ at: this.t + sec, fn }); }
  world(x, y, z, out = _v) { out.set(x, y, z); return this.g.boat.deck.localToWorld(out); }

  // —————————— C3 空网 ——————————
  // 网落回甲板（空的、不是碰了硬物）：浇下来一股泥水
  emptyNet(op) {
    const g = this.g;
    g.audio && g.audio.play('emptyNet');
    fxTag('C3', '空网·倒出来只有泥水', 'C3');
    const at = g.boat.deck.worldToLocal(_v.set(op.x, op.y, op.z));
    const px = clamp(at.x, W.x - 0.5, W.x + 0.5), pz = clamp(at.z, W.z - 0.6, W.z + 0.6);
    this.pour = { t: 0, dur: 0.6, acc: 0, x: px, z: pz };
    this.pud = { t: -0.28, x: px + 0.08, z: pz - 0.05, rot: Math.random() * 6.28 };
    // 清洗位是钢格栅（顶在甲板上 4.5 厘米）：泥水先摊在格栅上，再从栅条缝里漏下去
    this.puddle.position.set(this.pud.x, DY + 0.052, this.pud.z); this.puddle.rotation.z = this.pud.rot;
    this.wet.position.set(this.pud.x, DY + 0.048, this.pud.z); this.wet.rotation.z = this.pud.rot + 0.7;
    // 一两缕水草跟着泥水掉下来，躺在那一摊里
    this.weeds.forEach((m, i) => {
      m.userData = { t: -0.12 - i * 0.16, x: px + (i ? -0.32 : 0.26), z: pz + (i ? 0.22 : -0.18), y0: at.y - 0.3, yaw: Math.random() * 6.28 };
      m.position.set(m.userData.x, m.userData.y0, m.userData.z); m.rotation.set(0, m.userData.yaw, 0); m.material.opacity = 1; m.visible = i === 0 || Math.random() < 0.7;
    });
    // 几粒泥块砸在甲板上蹦开
    this.later(0.3, () => { const p = this.world(px, DY + 0.25, pz); g.particles.mudChunks(p.x, p.y, p.z, 0.25, [0.36, 0.3, 0.21], 7); });
    // 离得最近、手上没活的人转过来看一眼，耸耸肩（再远一点的摇摇头）
    const who = g.crew.shrugAt(px, pz, 0.55);
    if (who) this.later(0.6, () => fxTag('C3', '空网·船员耸耸肩', 'C3'));
    // 第一次空网（F9，lessons.js）接在这个人身上：同一下耸肩，再加“嗯——”和一句宽慰
    this.shrugger = who ? { s: who, at: g.time, delay: 0.55 } : null;
  }
  updatePour(dt) {
    const P = this.pour, g = this.g, b = g.boat;
    if (P) {
      P.t += dt;
      // 网兜跟着吊臂往回走，泥水从兜底往下浇（开头一大股，渐渐只剩几滴）
      const np = g.net.pos, top = _w.set(np.x, np.y - 0.35, np.z);
      const deckY = this.world(P.x, DY + 0.05, P.z).y;
      const k = Math.max(0, 1 - P.t / P.dur), rate = P.t < P.dur ? 560 * k * k + 40 : 0;
      P.acc += dt * rate;
      while (P.acc > 1) {
        P.acc -= 1;
        const a = Math.random() * 6.28, r = Math.random() * 0.3 * (0.4 + k), vy = -0.4 - Math.random() * 1.1, h = Math.max(0.05, top.y - deckY);
        const life = (vy + Math.sqrt(vy * vy + 2 * 9.8 * h)) / 9.8, mud = Math.random() < 0.6, s = 0.85 + Math.random() * 0.3;
        g.particles.water.emit(top.x + Math.cos(a) * r, top.y, top.z + Math.sin(a) * r, Math.cos(a) * 0.25, vy, Math.sin(a) * 0.25, life, 0.08 + Math.random() * 0.09,
          (mud ? 0.3 : 0.46) * s, (mud ? 0.24 : 0.42) * s, (mud ? 0.16 : 0.33) * s, 0.95, 0, 0, 9.8);
        // 砸在甲板上溅开（落下去那一刻在那儿冒出来）
        if (Math.random() < 0.7) {
          const sa = Math.random() * 6.28, sp = 0.7 + Math.random() * 1.6, up = 0.7 + Math.random() * 1.4;
          const lx = top.x + Math.cos(a) * r + Math.cos(a) * 0.25 * life, lz = top.z + Math.sin(a) * r + Math.sin(a) * 0.25 * life;
          this.q.push({ at: this.t + life, fn: () => g.particles.water.emit(lx, deckY + 0.02, lz, Math.cos(sa) * sp, up, Math.sin(sa) * sp, (2 * up) / 9.8, 0.05 + Math.random() * 0.06, 0.38 * s, 0.32 * s, 0.23 * s, 0.9, 0, 0.2, 9.8) });
        }
      }
      if (P.t > P.dur + 0.4) this.pour = null;
    }
    const D = this.pud;
    if (D) {
      D.t += dt;
      // 0.6 秒摊开到 1.7 米上下（差不多盖满格栅），停一会儿，约 3 秒里从栅条缝漏掉（边缩边淡），湿印子再留一会儿
      const u = D.t, grow = 1 - Math.pow(1 - clamp(u / 0.6, 0, 1), 3), drain = smoother((u - 1.4) / 2.4);
      const s = 1.75 * (0.25 + 0.75 * grow) * (1 - 0.3 * drain);
      this.puddle.visible = u > 0; this.puddle.scale.set(s, s * 0.82, 1); this.puddle.material.opacity = u > 0 ? 0.95 * (1 - drain) : 0;
      this.wet.visible = u > 0.1; this.wet.scale.set(1.6 * (0.3 + 0.7 * grow), 1.35 * (0.3 + 0.7 * grow), 1); this.wet.material.opacity = u > 0.1 ? 0.8 * (1 - smoother((u - 2.6) / 2.4)) : 0;
      for (const m of this.weeds) {
        const U = m.userData, w = U.t + D.t + 0.28;
        if (w < 0) continue;
        const f = Math.min(1, w / 0.34), y = U.y0 + (DY + 0.058 - U.y0) * f * f;
        m.position.y = y;
        m.rotation.set(-Math.PI / 2 * smoother((f - 0.6) / 0.4), U.yaw, 0, 'YXZ');
        m.material.opacity = 1 - smoother((D.t - 3.4) / 1.2);
      }
      if (u > 5.2) { this.pud = null; for (const m of [this.puddle, this.wet, ...this.weeds]) m.visible = false; }
    }
  }

  // —————————— C12 三种收工，C11 预兆 ——————————
  // 收工那一刻（game.endTrip）：定下收获单的拍子；船上按收工的方式做那一下，接着船员转过来看镜头
  endTrip(why) {
    const g = this.g, E = g.ended, b = g.boat, c = g.cam;
    E.plan = haulPlan(why, g.trip.items, g.trip.total); E.off = 0; E.ready = false;
    // 告别的镜头：从现在的方向挑最近的一个斜角（船后左右、船前左右），不绕大圈
    const cy = Math.atan2(c.pos.x - c.look.x, c.pos.z - c.look.z);
    let rel = Math.PI + 0.95, best = 9;
    for (const a of [Math.PI + 0.95, Math.PI - 0.95, 0.95, -0.95]) { const d = Math.abs(angDiff(cy, b.heading + a)); if (d < best) { best = d; rel = a; } }
    this.end = { why, t: 0, rel, P: E.plan, steam: 0, fired: new Set() };
    // 船员看着的那一点：镜头最后停的方向上远远一点（甲板坐标）
    const fa = b.heading + rel, far = b.worldToLocal2(b.x + Math.sin(fa) * 60, b.z + Math.cos(fa) * 60);
    const crew = g.crew;
    if (why === 'done') {
      this.end.steam = 0.85;
      crew.faceCam(far[0], far[1], { act: 'cheer', a0: 0.2, a1: 2.4, gap: 0.1 });
      this.later(0.55, () => this.hatchFull());
      fxTag('C12', '收工·都捞过了（汽笛、舱口一亮、大家举手）', 'C12');
    } else if (why === 'fuel') {
      for (const d of [0, 0.34]) this.later(d, () => this.cough(d ? 0.8 : 1));
      crew.look(FUNNEL[0], FUNNEL[1] + 0.4, 0.08, 1.0);
      crew.faceCam(far[0], far[1], { delay: 0.7, gap: 0.1, shrug: 2, shrugAt: 0.3, wave: false });
      fxTag('C12', '收工·油不够了（咳两声、熄火、滑停）', 'C12');
    } else {
      crew.faceCam(far[0], far[1], { act: 'nod', a0: 0.3, a1: 1.6, gap: 0.12, wave: true });
      fxTag('C12', '收工·提前收工（转过来点点头）', 'C12');
    }
    this.later(Math.max(0.2, E.plan.veil - 0.5), () => crew.captain.gesture('wave'));
    fxTag('C11', '收获单·预兆：船员停下来转身看镜头', 'C11');
  }
  // 捞完：舱口里的灯满满一亮（暖的，不是珍品那道金光柱），围板吐一圈尘，舱里的东西一件接一件反一下光
  hatchFull() {
    const g = this.g, K = g.keep, hold = g.reveal.hold;
    K.lampF = Math.max(K.lampF, 1.25); K.lampGold = 0;
    K.puff(1);
    const items = hold.items.slice(-10);
    if (items.length) hold.flash(items[items.length - 1].mesh, { mass: 0.8 });
    items.forEach((it, i) => this.later(0.06 + i * 0.08, () => {
      if (!it.mesh) return;
      it.mesh.getWorldPosition(_w);
      g.particles.glints(_w.x, _w.y + 0.15, _w.z, 0.18, 3, !!it.precious);
    }));
  }
  // 没油：烟囱咳出一团黑烟，船身跟着一抖
  cough(k) {
    const g = this.g, b = g.boat, [x, z] = b.localToWorld2(FUNNEL[0], FUNNEL[1]);
    for (let i = 0; i < 9; i++) {
      const a = Math.random() * 6.28, sp = 0.4 + Math.random() * 0.7;
      g.smoke.emit(x + (Math.random() - 0.5) * 0.3, FUNNEL_Y + Math.random() * 0.2, z + (Math.random() - 0.5) * 0.3,
        Math.cos(a) * sp, 1.6 + Math.random() * 1.4 * k, Math.sin(a) * sp, 1.5 + Math.random() * 0.8, 0.5 + Math.random() * 0.25, 0.2, 0.19, 0.18, 0.85, 2.2);
    }
    b.dip(0.035 * k, FUNNEL[0], FUNNEL[1]);
  }
  // 捞完：汽笛那一声，烟囱旁边喷一股白汽（往上冲、散开）
  updateSteam(dt) {
    const E = this.end;
    if (!E || E.steam <= 0) return;
    E.steam -= dt;
    const g = this.g, b = g.boat, [x, z] = b.localToWorld2(FUNNEL[0] + 0.25, FUNNEL[1] - 0.15);
    const n = Math.random() < dt * 40 ? 2 : 1;
    for (let i = 0; i < n; i++) g.smoke.emit(x + (Math.random() - 0.5) * 0.1, FUNNEL_Y + 0.3, z + (Math.random() - 0.5) * 0.1,
      (Math.random() - 0.5) * 0.5, 3.4 + Math.random() * 1.2, (Math.random() - 0.5) * 0.5, 0.9 + Math.random() * 0.4, 0.22 + Math.random() * 0.1, 0.96, 0.97, 0.97, 0.75, 2.6);
  }
  // 收获单一拍一拍：效果标签按拍子打；“再来一次”亮起来以后才能按
  updateEnd() {
    const g = this.g, E = g.ended, S = this.end;
    if (!E || !S || !E.plan) return;
    const P = E.plan, u = g.time - E.t + (E.off || 0);
    const beat = (k, t, fn) => { if (t == null || u < t || S.fired.has(k)) return; S.fired.add(k); fn(); };
    beat('veil', P.veil, () => fxTag('C11', '收获单·暗幕落下，单子升起', 'C11'));
    beat('rows', P.rows[0], () => fxTag('C11', '收获单·一行一行“嗒”地滑进来', 'C11'));
    beat('roll', P.roll, () => fxTag('C11', '收获单·总价从 0 滚上去', 'C11'));
    beat('stamp', P.stamp, () => fxTag('C11', '收获单·盖章（' + ({ done: '满载', fuel: '油尽' }[P.why] || '收工') + '）', 'C11'));
    beat('gleam', P.gleam, () => fxTag('C11', '收获单·珍品那行再亮一次', 'C11'));
    beat('again', P.again, () => fxTag('C11', '收获单·“再来一次”慢慢亮起', 'C11'));
    if (!E.ready && u >= P.ready) { E.ready = true; E.readyAt = g.time; }
  }
  // 收获单上按了 Ⓐ（或点了单子）：亮起来以前是跳到盖章；亮了以后才是再来一次。刚收工那一下（下网连按的那一下）不算
  press() {
    const g = this.g, E = g.ended;
    if (!E || !E.plan || g.restart || g.time - E.t < 0.8) return false;
    if (E.ready) { g.restart = true; return true; }
    if (E.plan.skipped) return false;
    const u = g.time - E.t + (E.off || 0), to = E.plan.stamp - 0.35;
    if (u < to) E.off = (E.off || 0) + (to - u);
    E.plan = skipPlan(E.plan);
    fxTag('C11', '收获单·跳到盖章', 'C11');
    return false;
  }
  // 告别的镜头：缓缓退到一个斜角，略低一点、近一点，看得清船员的脸；船放在画面右边三分之一，左边留给收获单
  frame(want, look, dt) {
    const S = this.end, g = this.g;
    if (!S || !g.ended) return;
    const b = g.boat, cam = g.view.camera;
    const w = smoother((S.t - 0.15) / 1.9);
    if (w <= 0) return;
    const yaw = b.heading + S.rel, p = 0.4, d = 30;
    const hw = d * Math.tan(cam.fov * Math.PI / 360) * cam.aspect, off = 0.34 * hw;
    _v.set(b.x - Math.cos(yaw) * off, DY + 1.6, b.z + Math.sin(yaw) * off);
    _w.set(_v.x + Math.sin(yaw) * Math.cos(p) * d, _v.y + Math.sin(p) * d, _v.z + Math.cos(yaw) * Math.cos(p) * d);
    want.lerp(_w, w); look.lerp(_v, w);
  }

  // —————————— D1 再来一次 ——————————
  // 新的一趟建好以后在黑场里先开上 secs 秒（inp：一直推着油门）：揭开时船已经在走，航迹和烟都有了。油和开场提示照新的一趟算
  arrive(secs, inp) {
    const g = this.g, fuel = g.boat.fuel, intro = g.introT, mute = window.__fxTagMute;
    window.__fxTagMute = true;
    try { for (let i = 0, n = Math.round(secs * 60); i < n; i++) g.update(1 / 60, inp); } finally { window.__fxTagMute = mute; }
    g.boat.fuel = fuel; if (intro != null) g.introT = intro;
    g.arrived = { t: g.time, speed: g.boat.speed };
  }

  update(dt) {
    this.t += dt;
    if (this.end) this.end.t += dt;
    for (let i = this.q.length - 1; i >= 0; i--) { const e = this.q[i]; if (this.t >= e.at) { this.q.splice(i, 1); e.fn(); } }
    this.updatePour(dt);
    this.updateSteam(dt);
    this.updateEnd();
  }
}

import * as THREE from 'three';
import { toon } from '../render/materials.js';
import { GeoBuilder } from '../util/builder.js';
import { GULL_AREAS, TRAIL, wreckToWorld } from '../sea/index.js';
import { seabedY } from '../world/terrain.js';
import { clamp, smoothstep } from '../util/math.js';

// 开船、停着看的那些小事：起步停船的一下、急转的白、线索转向、海鸥、停下来看时海底自己的小事。
// 都是轻的：一件一件来，不凑在大事上。
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const _q = new THREE.Quaternion();
const _az = new THREE.Vector3(0, 0, 1);
const _d = new THREE.Vector3();

export class Feel {
  constructor(g) {
    this.g = g;
    this.gull = new Gull(g.world.scene);
    this.reset();
  }

  reset() {
    this.moving = false;
    this.edgeT = 0;
    this.stillT = 0;
    this.idleT = 9;
    this.gullT = 6 + Math.random() * 8;
    this.lastTrail = this.g.flags ? this.g.flags.trailIdx : 0;
    this.fuelInt = null;
    this.reachWas = 0;
    this.turnT = 0;
    this.gull.stop();
    if (this.rock) this.rockEnd();
  }

  update(dt, idle) {
    const g = this.g;
    const bc = g.boatCtl;
    this.edgeT -= dt;
    if (!idle && (g.mode === 'sail' || g.mode === 'arm')) this.engineEdges(dt);
    else this.moving = bc.throttle > 0.15;
    if (!idle) this.turnFoam(dt);
    this.trailClick();
    this.rockUpdate(dt);
    this.gulls(dt, idle);
    this.idleLife(dt, idle);
    this.quietCues(dt, idle);
    this.gull.update(dt, g);
  }

  // A01 起步：几下「突突」、烟囱一口浓烟、船尾一压；松开：引擎掉下来一声回气、冒一小口
  engineEdges() {
    const g = this.g;
    const bc = g.boatCtl;
    // 开局点火那一秒引擎还没着，不算起步
    const push = (g.stickMag || 0) > 0.12 && g.trip.fuel > 0 && !(g.igniteT > 0);
    if (push && !this.moving && bc.throttle < 0.12 && this.edgeT <= 0) {
      this.moving = true;
      this.edgeT = 0.7;
      g.audio.play('engineUp');
      bc.squat = (bc.squat || 0) + 0.05;
      // 刚点着火、烟囱那口黑烟还没散：这一口小一点，不叠成一团
      const fresh = g.startT != null && g.startT < 1.8;
      this.puff(fresh ? 2 : 4, fresh ? 0.55 : 1);
      g.cue('A01');
    } else if (!push && this.moving && this.edgeT <= 0) {
      this.moving = false;
      this.edgeT = 0.7;
      if (bc.throttle > 0.3) {
        g.audio.play('engineDown');
        this.puff(1, 0.6);
        g.cue('A01');
      }
    }
  }

  puff(n, k) {
    const g = this.g;
    for (let i = 0; i < n; i++) {
      g.later(i * 0.1, () => {
        const p = g.boat.body.localToWorld(V(-4.55, 4.35, -0.75));
        g.fx.emit('puff', p.x, p.y, p.z, (Math.random() - 0.5) * 0.3, 2.2 + Math.random() * 0.8, (Math.random() - 0.5) * 0.3, { size: (0.85 + Math.random() * 0.35) * k });
      });
    }
  }

  // A02 急转：外侧多一道白（船尾甩出去的那一边）
  turnFoam(dt) {
    const g = this.g;
    const bc = g.boatCtl;
    const sp = Math.abs(bc.speed);
    // 船开起来那一刻、急转那一下各记一次
    if (sp > 0.6 && !this.fastWas) g.pulse('A02', 3);
    this.fastWas = sp > 0.6;
    if (sp < 2 || Math.abs(bc.turnRate) < 0.18) { this.turnWas = false; return; }
    if (!this.turnWas) g.pulse('A02', 1);
    this.turnWas = true;
    this.turnT -= dt;
    if (this.turnT > 0) return;
    this.turnT = 0.05;
    const f = bc.forward;
    const side = V(-f.z, 0, f.x);
    // 往左转（turnRate>0）时船尾往右甩：外侧是右舷
    const s = bc.turnRate > 0 ? 1 : -1;
    const k = clamp((Math.abs(bc.turnRate) - 0.18) / 0.3, 0.3, 1);
    for (let i = 0; i < 2; i++) {
      const u = -2 - Math.random() * 3.6;
      const x = bc.pos.x + f.x * u + side.x * s * (1.6 + Math.random() * 0.5);
      const z = bc.pos.z + f.z * u + side.z * s * (1.6 + Math.random() * 0.5);
      g.fx.emit('foam', x, 0.08, z, side.x * s * 1.2 * k, 0, side.z * s * 1.2 * k, { life: 1.8, size: 0.4 + k * 0.25 });
      if (Math.random() < 0.5 * k) g.fx.emit('spray', x, 0.25, z, side.x * s * 2.4, 1.2 + Math.random(), side.z * s * 2.4);
    }
  }

  // A05 经过一块线索船板：箭头「咔」地转向下一块，那块船板轻轻反一下光
  trailClick() {
    const g = this.g;
    const i = g.flags.trailIdx;
    if (i === this.lastTrail) return;
    const passed = i > this.lastTrail ? TRAIL[i - 1] : null;
    this.lastTrail = i;
    if (!passed || g.mode !== 'sail') return;
    g.audio.play('leadTurn');
    g.ui.leadSnap();
    const it = g.items.items.find((x) => x.id === 'trail-' + passed.kind + passed.x);
    const y = seabedY(passed.x, passed.z) + 0.2;
    // 一道湿木头的反光顺着船板走过去
    const ca = Math.cos(passed.rot || 0), sa = Math.sin(passed.rot || 0);
    for (let k = 0; k < 4; k++) {
      const u = (k / 3 - 0.5) * 1.6;
      g.later(k * 0.07, () => g.fx.emit('flick', passed.x + ca * u, y + 0.05, passed.z - sa * u, 0, 0, 0, { size: k === 1 ? 0.8 : 0.55, life: 0.5 }));
    }
    if (it && it.model) {
      it.model.group.traverse((o) => { if (o.material && o.material.uniforms && o.material.uniforms.uGlint) o.material.uniforms.uGlint.value = 1; });
      g.later(0.6, () => g.glintT = 0);
      // C02 那块船板自己：被船压下来的水波轻轻掀一下——一边翘起来、翻两下落回去，落下时扬起一点沙
      if (this.rock) this.rockEnd();
      this.rock = { it, t: 0, q0: it.model.group.quaternion.clone(), p0: it.model.group.position.clone(), puffed: false, shone: false };
      g.cue('C02');
    }
    g.cue('A05');
  }

  rockUpdate(dt) {
    const R = this.rock;
    if (!R) return;
    R.t += dt;
    const t = R.t;
    const grp = R.it.model.group;
    // 一头被水波掀起来（0.4 秒翘到约 30°），落回沙上再颠两下；支点在另一头
    const a = t < 0.4 ? 0.52 * Math.sin((t / 0.4) * Math.PI * 0.5) : 0.52 * Math.exp(-(t - 0.4) * 2.6) * Math.abs(Math.cos((t - 0.4) * 6));
    const half = 0.85;
    _q.setFromAxisAngle(_az, a);
    grp.quaternion.copy(R.q0).multiply(_q);
    _d.set(half * (Math.cos(a) - 1), half * Math.sin(a), 0).applyQuaternion(R.q0);
    grp.position.copy(R.p0).add(_d);
    const fx = this.g.fx;
    const it = R.it;
    const ca = Math.cos(it.rot || 0), sa = Math.sin(it.rot || 0);
    // 翘到最高时湿木头迎着光亮一下（翘起的那一头）
    if (!R.shone && t > 0.36) {
      R.shone = true;
      _d.set(half * 2 * Math.cos(a) - half, half * 2 * Math.sin(a), 0).applyQuaternion(R.q0);
      fx.emit('flick', R.p0.x + _d.x, R.p0.y + _d.y + 0.08, R.p0.z + _d.z, 0, 0, 0, { size: 1.2, life: 0.5 });
    }
    // 落回去那一下：板子底下扑出一团细沙，沙粒往两边溅
    if (!R.puffed && t > 0.64) {
      R.puffed = true;
      for (let k = 0; k < 5; k++) {
        const u = (k / 4 - 0.5) * 1.5;
        fx.emit('cloud', it.x + ca * u, it.y + 0.12, it.z - sa * u, sa * (Math.random() - 0.5) * 0.9, 0.3, ca * (Math.random() - 0.5) * 0.9, { size: 0.75, life: 2.6 });
      }
      for (let k = 0; k < 12; k++) {
        const u = (Math.random() - 0.5) * 1.6;
        const sd = Math.random() < 0.5 ? -1 : 1;
        fx.emit('sand', it.x + ca * u, it.y + 0.05, it.z - sa * u, sa * sd * (0.6 + Math.random() * 0.8), 0.7 + Math.random() * 0.7, ca * sd * (0.6 + Math.random() * 0.8));
      }
    }
    if (t > 2.4) this.rockEnd();
  }

  rockEnd() {
    const R = this.rock;
    R.it.model.group.quaternion.copy(R.q0);
    R.it.model.group.position.copy(R.p0);
    this.rock = null;
  }

  // 这儿离海鸥多的地方多近（这片海定的 GULL_AREAS；归潮沙湾是港外航路、浅滩上空 1，沉船、深槽那一片 0）：越往外、越往深，海鸥越少、越远
  gullNear() {
    const bp = this.g.boatCtl.pos;
    let k = 0;
    for (const A of GULL_AREAS) k = Math.max(k, 1 - smoothstep(A.r0, A.r1, Math.hypot(bp.x - A.x, bp.z - A.z)));
    return k * (1 - smoothstep(12, 18, -seabedY(bp.x, bp.z)));
  }

  // A11 海鸥：港外和浅滩上空最多，顺着线索往沉船去一路少下去、远下去（声音小、闷、带回声），
  // 沉船、深槽那一片一声都没有，只剩风和水
  gulls(dt, idle) {
    const g = this.g;
    this.gullT -= dt;
    if (this.gullT > 0) return;
    const k = this.gullNear();
    // 离岸越远隔得越久：港外 14—36 秒一次，到浅滩和沉船之间两倍多
    this.gullT = (14 + Math.random() * 22) * (1 + 1.6 * (1 - k));
    if (g.mode === 'title' || g.mode === 'summary') return;
    if (k < 0.08) return;
    this.gullCall(Math.random() < 0.5 && k > 0.55, k);
  }

  gullCall(fly, k = 1) {
    const g = this.g;
    const pan = Math.random() * 1.4 - 0.7;
    if (fly && !this.gull.on) {
      this.gull.start(g, pan);
      // 飞进画面三分之一时叫
      g.later(this.gull.T * 0.32, () => g.audio.play('gull', { pan: this.gull.pan(g) }));
    } else {
      // 只听得见、看不见的：离岸越远越小越闷
      g.audio.play('gull', { pan, gain: 0.7 * (0.3 + 0.7 * k), far: 1 - k });
    }
    g.cue('A11');
  }

  // A24 停下来看：每隔十来秒总有一件小事，挑画面里看得见的
  idleLife(dt, idle) {
    const g = this.g;
    const bc = g.boatCtl;
    const quiet = !idle && g.mode === 'sail' && Math.abs(bc.speed) < 0.3 && !g.reveal.cur && !(g.leviathan && g.leviathan.active);
    this.stillT = quiet ? this.stillT + dt : 0;
    if (this.stillT < 4) { this.idleT = Math.min(this.idleT, 6); return; }
    this.idleT -= dt;
    if (this.idleT > 0) return;
    this.idleT = 9 + Math.random() * 5;
    const piv = g.cam.pivot;
    const opts = [];
    const school = g.fish.nearest(piv.x, piv.z, 26);
    if (school) opts.push({ kind: 'fish', run: () => g.fish.swirl(school, 7) });
    const crab = g.crabLife.list.find((c) => c.mode === 'sea' && (c.state === 'rest' || c.state === 'pause') && Math.hypot(c.pos.x - piv.x, c.pos.z - piv.z) < 22);
    if (crab) opts.push({ kind: 'crab', run: () => { crab.state = 'dig'; crab.timer = 3.2; crab.speed = 0; } });
    const wp = wreckToWorld(0.6, -0.5);
    if (Math.hypot(wp.x - piv.x, wp.z - piv.z) < 30) opts.push({ kind: 'bubbles', run: () => g.wreckBubbles() });
    const free = g.crew.sailors.filter((s) => !s.task && !s.moving);
    if (free.length) opts.push({ kind: 'crew', run: () => { const s = free[Math.floor(Math.random() * free.length)]; s.roleT = 0; s.idleT = 0; } });
    const bp = bc.pos;
    if (!this.gull.on && this.gullNear() > 0.55) opts.push({ kind: 'gull', run: () => this.gullCall(true) });
    if (!opts.length) return;
    // 不连着两次同一样
    const fresh = opts.filter((o) => o.kind !== this.lastIdle);
    const pool = fresh.length ? fresh : opts;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    pick.run();
    this.lastIdle = pick.kind;
    g.cue('A24');
  }

  // 一直在的东西：只打标签，不另外加动静
  quietCues(dt, idle) {
    const g = this.g;
    if (idle) return;
    const f = Math.floor(g.trip.fuel);
    if (this.fuelInt !== null && f < this.fuelInt && g.mode === 'sail') g.pulse('A13', 2.5);
    this.fuelInt = f;
    const r = g.arm.reachRing.k;
    if (g.mode === 'sail' && r > 0.3 && this.reachWas <= 0.3) g.pulse('A06', 3);
    this.reachWas = r;
    if (g.mode === 'sail' || g.mode === 'arm') g.pulse('A12', 5);
  }
}

// 一只海鸥：从画面一边飞到另一边，翅膀一扇一滑
class Gull {
  constructor(scene) {
    const b = new GeoBuilder();
    const white = new THREE.Color(0.95, 0.95, 0.93), grey = new THREE.Color(0.62, 0.66, 0.68), dark = new THREE.Color(0.2, 0.22, 0.24);
    b.box(V(0, 0, 0), V(0.16, 0, 0), V(0, 0.045, 0), V(0, 0, 0.05), white);
    b.box(V(0.19, 0.02, 0), V(0.05, 0, 0), V(0, 0.035, 0), V(0, 0, 0.035), white);
    b.box(V(0.25, 0.015, 0), V(0.03, 0, 0), V(0, 0.01, 0), V(0, 0, 0.012), new THREE.Color(0.95, 0.75, 0.3));
    b.tri(V(-0.15, 0, 0), V(-0.24, 0.01, 0.05), V(-0.24, 0.01, -0.05), white);
    this.body = new THREE.Mesh(b.build(), toon({ vertexColors: true }));
    const wing = (s) => {
      const w = new GeoBuilder();
      w.tri(V(0.06, 0, 0), V(-0.08, 0, 0), V(-0.02, 0, 0.32 * s), white);
      w.tri(V(0.06, 0, 0), V(-0.02, 0, 0.32 * s), V(-0.08, 0, 0), white);
      w.tri(V(-0.02, 0, 0.32 * s), V(-0.1, 0, 0.3 * s), V(0.0, 0, 0.5 * s), grey);
      w.tri(V(-0.02, 0, 0.32 * s), V(0.0, 0, 0.5 * s), V(-0.1, 0, 0.3 * s), grey);
      w.tri(V(0.0, 0, 0.5 * s), V(-0.08, 0, 0.46 * s), V(-0.02, 0, 0.58 * s), dark);
      w.tri(V(0.0, 0, 0.5 * s), V(-0.02, 0, 0.58 * s), V(-0.08, 0, 0.46 * s), dark);
      const m = new THREE.Mesh(w.build(), toon({ vertexColors: true, side: THREE.DoubleSide }));
      return m;
    };
    this.wl = wing(1);
    this.wr = wing(-1);
    this.group = new THREE.Group();
    this.group.add(this.body, this.wl, this.wr);
    this.group.scale.setScalar(1.6);
    // 掠过时影子从甲板、浅水的海底上扫过去
    this.body.castShadow = this.wl.castShadow = this.wr.castShadow = true;
    this.group.visible = false;
    this.group.name = 'gull';
    scene.add(this.group);
    this.on = false;
  }

  start(g, pan) {
    const piv = g.cam.pivot;
    const cp = g.cam.cam.position;
    const yaw = g.cam.yaw ?? 0;
    // 镜头的左右、往里
    const right = V(Math.cos(yaw), 0, -Math.sin(yaw));
    const fwd = V(-Math.sin(yaw), 0, -Math.cos(yaw));
    const side = pan < 0 ? -1 : 1;
    const h = 6.5 + Math.random() * 2;
    // 航线穿过「镜头看画面中心那条线」上 h 米高的那一点：海鸥从画面中部横穿过去，
    // 不会被透视推到画面顶上
    const k = clamp(h / Math.max(1, cp.y - piv.y), 0, 0.7);
    const mid = piv.clone().lerp(cp, k);
    mid.y = h;
    const depth = cp.distanceTo(mid);
    const span = depth * 0.62 + 4;
    const tilt = (Math.random() - 0.5) * depth * 0.3;
    this.from = mid.clone().addScaledVector(right, side * span).addScaledVector(fwd, tilt);
    this.to = mid.clone().addScaledVector(right, -side * span).addScaledVector(fwd, -tilt);
    this.to.y = h + (Math.random() - 0.5) * 1.5;
    this.t = 0;
    this.T = this.from.distanceTo(this.to) / 6.2;
    this.on = true;
    this.group.visible = true;
  }

  pan(g) {
    if (!this.on) return 0;
    const s = g.project(this.group.position);
    return clamp((s.x / 1920) * 2 - 1, -0.9, 0.9);
  }

  stop() {
    this.on = false;
    this.group.visible = false;
  }

  update(dt) {
    if (!this.on) return;
    this.t += dt;
    const k = this.t / this.T;
    if (k >= 1) { this.stop(); return; }
    const p = this.group.position.lerpVectors(this.from, this.to, k);
    p.y += Math.sin(k * Math.PI * 2) * 0.6;
    const d = this.to.clone().sub(this.from);
    this.group.rotation.set(0, Math.atan2(-d.z, d.x), Math.sin(this.t * 1.3) * 0.15);
    // 扇几下、滑一段
    const flap = Math.sin(this.t * 2.2) > -0.2 ? Math.sin(this.t * 11) * 0.65 : 0.08;
    this.wl.rotation.x = -flap;
    this.wr.rotation.x = flap;
  }
}


import * as THREE from 'three';
import { toon } from '../render/materials.js';
import { GeoBuilder } from '../util/builder.js';
import { seabedY, seabedNormal } from '../world/terrain.js';
import { wreckToWorld, CRAB_HOME, CRAB_STOPS, SEAL_SPOT, SHOAL, SHOAL_CRABS } from '../world/layout.js';
import { NET_R } from '../config.js';
import { clamp, damp, dampAngle, wrapAngle, mulberry32 } from '../util/math.js';
import { VIEW_W, VIEW_H } from '../config.js';

// 蟹：贴底慢慢走（横着走），在固定的几处停下翻找；受惊退回遮蔽，之后照原路线回来。
// 闭网那一刻真正在网口里的才会被兜上来。

const V = (x, y, z) => new THREE.Vector3(x, y, z);
// 受惊时原地举螯吓唬多久才跑；躲在窝里最后多久把眼柄伸出来张望
const REAR_T = 0.62;
const PEEK_T = 1.8;

function buildCrabModel(scale, shellCol) {
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);
  const c = new THREE.Color(shellCol);
  const dark = c.clone().multiplyScalar(0.62);
  const light = c.clone().lerp(new THREE.Color(1, 0.85, 0.7), 0.25);
  const cream = new THREE.Color(0.86, 0.78, 0.62);
  const tipCol = new THREE.Color(0.16, 0.11, 0.09);
  const spotCol = c.clone().multiplyScalar(0.78);
  const gb = new GeoBuilder();
  // 甲壳：一个扁圆的拱，中间高、边上低；前沿一排小齿，两侧各一根刺
  const N = 16;
  const ring = (rx, rz, y, flatFront = 0) => {
    const pts = [];
    for (let k = 0; k < N; k++) {
      const a = (k / N) * Math.PI * 2;
      let x = Math.cos(a) * rx, z = Math.sin(a) * rz;
      if (Math.cos(a) > 0) x *= 1 - flatFront * Math.pow(Math.cos(a), 4);
      pts.push(V(x, y, z));
    }
    return pts;
  };
  const top = V(-0.01, 0.168, 0);
  const r1 = ring(0.085, 0.13, 0.155, 0.1);
  const r2 = ring(0.15, 0.215, 0.105, 0.22);
  const r3 = ring(0.165, 0.235, 0.07, 0.25);
  const r4 = ring(0.14, 0.2, 0.03, 0.2);
  const shellAt = (k, base) => {
    // 背上几块深色的斑
    const a = (k / N) * Math.PI * 2;
    const blot = Math.sin(a * 3 + 1.3) > 0.55 ? 1 : 0;
    return blot ? base.clone().lerp(spotCol, 0.6) : base;
  };
  for (let k = 0; k < N; k++) {
    const k1 = (k + 1) % N;
    gb.tri(top, r1[k1], r1[k], light);
    gb.quad(r1[k], r1[k1], r2[k1], r2[k], shellAt(k, light.clone().lerp(c, 0.4)));
    gb.quad(r2[k], r2[k1], r3[k1], r3[k], shellAt(k + 3, c));
    gb.quad(r3[k], r3[k1], r4[k1], r4[k], dark);
    gb.tri(V(0, 0.025, 0), r4[k], r4[k1], cream);
  }
  // 前沿的齿、两侧的刺
  for (const sd of [-1, 1]) {
    for (const [a, len] of [[0.22, 0.03], [0.5, 0.035], [0.82, 0.04]]) {
      const ax = Math.cos(a) * 0.165 * (1 - 0.25 * Math.pow(Math.cos(a), 4)), az = sd * Math.sin(a) * 0.235;
      const out = V(Math.cos(a), 0, sd * Math.sin(a));
      const p0 = V(ax, 0.075, az).addScaledVector(V(-out.z, 0, out.x), 0.018), p1 = V(ax, 0.075, az).addScaledVector(V(-out.z, 0, out.x), -0.018);
      const tip = V(ax, 0.078, az).addScaledVector(out, len);
      gb.tri(p0, p1, tip, dark);
      gb.tri(p1, p0, tip, dark);
    }
    const a = 1.35;
    const sp = V(Math.cos(a) * 0.165, 0.075, sd * Math.sin(a) * 0.235);
    const tip = sp.clone().add(V(0.02, 0.01, sd * 0.07));
    gb.tri(sp.clone().add(V(0.025, 0, 0)), sp.clone().add(V(-0.025, 0, 0)), tip, light);
    gb.tri(sp.clone().add(V(-0.025, 0, 0)), sp.clone().add(V(0.025, 0, 0)), tip, light);
  }
  // 口器
  gb.box(V(0.15, 0.05, 0), V(0.02, 0, 0), V(0, 0.022, 0), V(0, 0, 0.045), dark);
  // 眼柄 + 黑眼珠，眼窝一道暗：单独一块，躲在窝里时能伸出沙面张望
  const eb = new GeoBuilder();
  for (const sd of [-1, 1]) {
    eb.box(V(0.15, 0.125, sd * 0.05), V(0.012, 0, 0), V(0, 0.03, 0), V(0, 0, 0.012), dark);
    eb.box(V(0.155, 0.16, sd * 0.05), V(0.019, 0, 0), V(0, 0.019, 0), V(0, 0, 0.019), new THREE.Color(0.06, 0.05, 0.045));
    eb.box(V(0.163, 0.168, sd * 0.045), V(0.006, 0, 0), V(0, 0.006, 0), V(0, 0, 0.006), new THREE.Color(0.7, 0.68, 0.6));
  }
  const mat = toon({ vertexColors: true, spec: 0.35, shin: 18, item: true });
  const bm = new THREE.Mesh(gb.build(), mat);
  bm.castShadow = true;
  body.add(bm);
  const eyes = new THREE.Mesh(eb.build(), mat);
  body.add(eyes);
  // 腿：每边四条，三节（往上拱、再往下扎地），尖是深色的
  const legs = [];
  for (const sd of [-1, 1]) {
    for (let i = 0; i < 4; i++) {
      const hip = new THREE.Group();
      hip.position.set(0.07 - i * 0.055, 0.06, sd * 0.18);
      const lb = new GeoBuilder();
      const L = 1 - Math.abs(i - 1.2) * 0.08;
      const a = V(0, 0, 0), b = V(0, 0.075, sd * 0.13 * L), e = V(0, 0.025, sd * 0.235 * L), f = V(0, -0.06, sd * 0.285 * L);
      lb.beam(a, b, V(1, 0, 0), 0.032, 0.026, c);
      lb.beam(b, e, V(1, 0, 0), 0.026, 0.022, light.clone().lerp(c, 0.5));
      lb.beam(e, f, V(1, 0, 0), 0.018, 0.016, dark);
      lb.box(f, V(0.008, 0, 0), V(0, 0.012, 0), V(0, 0, 0.008), tipCol);
      // 关节上一圈暗
      lb.box(b, V(0.018, 0, 0), V(0, 0.016, 0), V(0, 0, 0.016), dark);
      const m = new THREE.Mesh(lb.build(), mat);
      m.castShadow = true;
      hip.add(m);
      hip.rotation.y = (i - 1.5) * 0.32 * sd;
      body.add(hip);
      legs.push({ g: hip, s: sd, i, base: hip.rotation.y });
    }
  }
  // 螯：两节臂 + 鼓起的掌 + 固定指，活动指另外一节能开合；指尖黑
  const claws = [];
  for (const sd of [-1, 1]) {
    const sh = new THREE.Group();
    sh.position.set(0.14, 0.07, sd * 0.1);
    const cb = new GeoBuilder();
    cb.beam(V(0, 0, 0), V(0.06, 0.03, sd * 0.07), V(0, 1, 0), 0.04, 0.035, c);
    cb.beam(V(0.06, 0.03, sd * 0.07), V(0.12, 0.035, sd * 0.08), V(0, 1, 0), 0.042, 0.038, light.clone().lerp(c, 0.3));
    // 掌：前宽后窄
    cb.box(V(0.17, 0.04, sd * 0.08), V(0.055, 0, 0), V(0, 0.04, 0), V(0, 0, 0.034), light);
    cb.box(V(0.17, 0.065, sd * 0.08), V(0.045, 0, 0), V(0, 0.012, 0), V(0, 0, 0.026), light.clone().lerp(new THREE.Color(1, 1, 1), 0.15));
    // 固定指
    cb.beam(V(0.22, 0.03, sd * 0.075), V(0.285, 0.022, sd * 0.065), V(0, 1, 0), 0.026, 0.026, dark);
    cb.beam(V(0.285, 0.022, sd * 0.065), V(0.31, 0.02, sd * 0.06), V(0, 1, 0), 0.016, 0.016, tipCol);
    const m = new THREE.Mesh(cb.build(), mat);
    m.castShadow = true;
    sh.add(m);
    const pinch = new THREE.Group();
    pinch.position.set(0.215, 0.055, sd * 0.09);
    const pb = new GeoBuilder();
    pb.beam(V(0, 0, 0), V(0.07, -0.01, -sd * 0.012), V(0, 1, 0), 0.024, 0.022, dark);
    pb.beam(V(0.07, -0.01, -sd * 0.012), V(0.095, -0.018, -sd * 0.02), V(0, 1, 0), 0.015, 0.015, tipCol);
    const pm = new THREE.Mesh(pb.build(), mat);
    pm.castShadow = true;
    pinch.add(pm);
    sh.add(pinch);
    body.add(sh);
    claws.push({ g: sh, pinch, s: sd });
  }
  root.scale.setScalar(scale);
  return { root, body, eyes, legs, claws, mats: [mat] };
}

let CID = 0;
export class Crab {
  constructor(opts) {
    this.id = ++CID;
    this.key = !!opts.key;
    this.scale = opts.scale || 1.6;
    this.model = buildCrabModel(this.scale, opts.color || 0xc0502a);
    this.group = this.model.root;
    this.pos = new THREE.Vector3();
    this.dir = 0; // 身体朝向
    this.moveDir = 0;
    this.speed = 0;
    this.route = opts.route; // [{x,z,t,dig}]
    this.home = opts.home; // {x,z}
    this.rnd = mulberry32(opts.seed || 7);
    this.state = 'rest';
    this.timer = opts.startDelay ?? 3;
    this.stop = -1;
    this.target = null;
    this.legPh = 0;
    this.dig = 0;
    this.mode = 'sea'; // sea | net | deck | held | tank
    this.hidden = false;
    this.onDig = opts.onDig || null;
    this.tracks = opts.tracks || null;
    this.lastTrack = new THREE.Vector3();
    this.r = 0.24 * this.scale / 1.6;
  }

  place(x, z) {
    this.pos.set(x, seabedY(x, z), z);
    this.lastTrack.copy(this.pos);
  }

  // 可以被网兜住：在外面活动、不在窝里
  get catchable() {
    return this.mode === 'sea' && !this.hidden;
  }

  capture() {
    this.mode = 'net';
    this.state = 'caught';
    this.mark(false);
  }

  // 合成时描不描轮廓（在外面活动、能被兜住时描）。兜上来以后它不在 list 里了，在这里关掉
  mark(on) {
    for (const m of this.model.mats) if (m.uniforms.uItemMark) m.uniforms.uItemMark.value = on ? 1 : 0;
  }

  makeCaptive() {
    this.mark(false);
    this.group.parent && this.group.parent.remove(this.group);
    this.group.position.set(0, 0, 0);
    this.group.rotation.set(0, 0, 0);
    return this;
  }

  setMode(m) {
    this.mode = m;
    if (m === 'deck' || m === 'tank') {
      this.group.rotation.set(0, this.group.rotation.y, 0);
      if (m === 'tank') this.tankT = 0;
    }
  }

  // 网/船靠近时：在网圈外的就跑回窝；在网圈里的出不去
  startle(x, z, ringR) {
    if (this.mode !== 'sea' || this.state === 'flee' || this.state === 'hide') return;
    const d = Math.hypot(this.pos.x - x, this.pos.z - z);
    if (ringR && d < ringR - 0.1) {
      this.trapped = { x, z, R: ringR, t: 0 };
      this.state = 'trapped';
      return;
    }
    this.state = 'flee';
    this.target = this.home;
    this.fleeFrom = { x, z };
    // 先原地前半身一撑、两螯高举抖两下（「咔咔」一声），再转身横着跑
    this.rear = REAR_T;
    this.startled = true;
  }

  update(dt, t, env) {
    const m = this.model;
    if (this.mode === 'net') return; // 由网包驱动
    if (this.mode === 'held') {
      this.legPh += dt * 16;
      this.animLegs(1.2, dt, true);
      return;
    }
    if (this.mode === 'deck') {
      this.legPh += dt * 10;
      this.animLegs(0.6, dt, true);
      m.body.position.y = 0.012 * Math.sin(t * 12);
      // 冲开后举起两螯
      this.animThreat(dt * 0.6, t);
      return;
    }
    if (this.mode === 'tank') {
      // 在水槽里慢慢爬，偶尔吐泡
      // 刚放进去：原地转一整圈，腿划得快
      this.tankT += dt;
      const T = this.tankT;
      const x = Math.sin(T * 0.35) * 0.12;
      this.group.position.x = -0.4 + x;
      this.group.position.z = 1.45 + Math.sin(T * 0.21 + 1) * 0.05;
      this.group.position.y = 0.95 + 0.1;
      const k = Math.min(1, T / 1.3);
      const spin = (k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2) * Math.PI * 2;
      this.group.rotation.y = 0.2 + Math.sin(T * 0.3) * 0.4 + spin;
      this.legPh += dt * (T < 1.3 ? 16 : 6 * Math.abs(Math.cos(T * 0.35)));
      this.animLegs(T < 1.3 ? 1 : 0.5, dt, false);
      this.group.scale.setScalar(this.scale * 0.5);
      return;
    }
    this.think(dt, env);
    this.move(dt);
    if (env && env.sound) this.sounds(dt, env);
    // 贴地
    const n = seabedNormal(this.pos.x, this.pos.z);
    this.group.position.copy(this.pos);
    const q = new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), n);
    const qy = new THREE.Quaternion().setFromAxisAngle(V(0, 1, 0), this.dir);
    this.group.quaternion.copy(q).multiply(qy);
    this.group.visible = true;
    this.animLegs(this.speed > 0.05 ? 1 : 0, dt, false);
    // 翻泥：两只螯轮流往下扒
    const dg = this.state === 'dig' ? 1 : 0;
    this.dig = damp(this.dig, dg, 6, dt);
    for (const c of m.claws) {
      const ph = t * 6 + (c.s > 0 ? 0 : Math.PI);
      c.g.rotation.z = -this.dig * (0.35 + Math.max(0, Math.sin(ph)) * 0.6) + (1 - this.dig) * Math.sin(t * 1.3 + c.s) * 0.08;
      c.pinch.rotation.y = c.s * (0.1 + Math.max(0, Math.sin(t * 3 + c.s)) * 0.3);
    }
    m.body.rotation.z = -this.dig * 0.18;
    this.animBurrow(dt, t, env);
    this.animRear(dt, t);
  }

  // 钻窝：整只沉进沙里；快出来前先只把两根眼柄伸出沙面，左右张望一阵
  animBurrow(dt, t, env) {
    const m = this.model;
    const hide = this.state === 'hide';
    const peek = hide && this.timer <= PEEK_T;
    const want = hide ? (peek ? 0.155 : 0.27) : 0;
    const was = this.sink || 0;
    this.sink = damp(was, want, want > was ? 7 : peek ? 2.6 : 3.2, dt);
    // 往下钻、往上拱的时候腿扒得快
    if (Math.abs(want - this.sink) > 0.02) { this.legPh += dt * 16; this.animLegs(1, dt, true); }
    this.eyeUp = damp(this.eyeUp || 0, peek ? 0.06 : 0, peek ? 3.5 : 6, dt);
    m.body.position.y = -this.sink;
    m.eyes.position.y = this.eyeUp;
    // 张望：身子在窝里慢慢左右转一点
    m.body.rotation.y = peek ? Math.sin((PEEK_T - this.timer) * 2.4) * 0.4 * Math.min(1, (PEEK_T - this.timer) * 1.5) : damp(m.body.rotation.y, 0, 4, dt);
    // 钻进去、眼柄冒头、整只拱出来：各扬一点沙
    const fx = env && env.fx;
    const st = hide ? (peek ? 'peek' : 'in') : 'out';
    if (fx && this.burrowSt && st !== this.burrowSt) {
      const sc = this.scale / 1.6;
      const n = st === 'peek' ? 3 : 9;
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2, v = (st === 'peek' ? 0.4 : 0.9) + Math.random() * 0.6;
        fx.emit('sand', this.pos.x + Math.cos(a) * 0.12 * sc, this.pos.y + 0.05, this.pos.z + Math.sin(a) * 0.12 * sc, Math.cos(a) * v, 0.8 + Math.random() * 0.9, Math.sin(a) * v);
      }
      fx.emit('mud', this.pos.x, this.pos.y + 0.1, this.pos.z, 0, 0.18, 0, { size: (st === 'peek' ? 0.3 : 0.55) * sc * 1.6, life: st === 'peek' ? 1.8 : 3 });
      if (st !== 'peek' && env.sound) env.sound('burrow', this);
    }
    this.burrowSt = st;
  }

  // 海底受惊：前半身一撑、两螯高举，抖两下（两次往上一顶），然后才转身跑
  animRear(dt, t) {
    const m = this.model;
    if (!(this.rear > -0.3)) { for (const c of m.claws) c.g.rotation.y = 0; return; }
    this.rear -= dt;
    const u = 1 - this.rear / REAR_T; // 0→1 是原地吓唬，>1 是边跑边放下
    const k = Math.min(1, u / 0.12) * Math.min(1, (this.rear + 0.3) / 0.3);
    const jab = u < 1 ? Math.max(0, Math.sin(u * Math.PI * 4)) : 0;
    for (const c of m.claws) {
      c.g.rotation.z = c.g.rotation.z * (1 - k) + (0.7 + jab * 0.32) * k;
      c.g.rotation.y = c.s * (0.3 + jab * 0.12) * k;
      c.pinch.rotation.y = c.s * (0.15 + 0.5 * jab) * k;
    }
    m.body.rotation.z += 0.26 * k;
    m.body.position.y += (0.025 + jab * 0.012) * k;
  }

  // 受惊：前半身抬起、两螯高举张开，抖两下
  animThreat(dt, t) {
    const m = this.model;
    this.threat = Math.max(0, (this.threat || 0) - dt * 1.8);
    if (this.threat > 0) {
      const k = Math.sin(Math.min(1, this.threat) * Math.PI * 0.5);
      const shake = Math.sin(t * 38) * 0.06 * k;
      for (const c of m.claws) {
        c.g.rotation.z = c.g.rotation.z * (1 - k) + (0.75 + shake) * k;
        c.g.rotation.y = c.s * 0.35 * k;
        c.pinch.rotation.y = c.s * (0.1 + 0.55 * k);
      }
      m.body.rotation.z += 0.22 * k;
      m.body.position.y += 0.02 * k;
    } else for (const c of m.claws) c.g.rotation.y = 0;
  }

  animLegs(amt, dt, flail) {
    const m = this.model;
    if (!flail) this.legPh += dt * this.speed * 30;
    for (const L of m.legs) {
      const ph = this.legPh + L.i * 1.6 + (L.s > 0 ? Math.PI : 0);
      L.g.rotation.x = Math.sin(ph) * 0.35 * amt * L.s;
      L.g.rotation.y = L.base + Math.cos(ph) * 0.22 * amt;
      if (flail) L.g.rotation.x = Math.sin(ph * 1.7) * 0.6 * amt * L.s;
    }
    if (flail) for (const c of m.claws) c.g.rotation.z = -0.5 + Math.sin(this.legPh * 0.8 + c.s) * 0.5;
  }

  // 碎步「嗒嗒」、翻泥「沙沙」、受惊「咔咔」：由 CrabLife 按看不看得见、离镜头多远决定响不响
  sounds(dt, env) {
    this.sndT = (this.sndT || 0) - dt;
    if (this.startled) { this.startled = false; env.sound('threat', this); this.sndT = 0.5; }
    if (this.sndT > 0) return;
    if ((this.state === 'walk' || this.state === 'flee') && this.speed > 0.05) {
      this.sndT = this.state === 'flee' ? 0.24 : 0.46;
      env.sound('step', this);
    } else if (this.state === 'dig') {
      this.sndT = 0.5 + this.rnd() * 0.35;
      env.sound('dig', this);
    }
  }

  think(dt, env) {
    this.timer -= dt;
    switch (this.state) {
      case 'rest':
        this.speed = 0;
        if (this.timer <= 0) this.nextStop();
        break;
      case 'walk':
      case 'flee':
        if (this.state === 'flee' && this.speed > 0.4 && env && env.fx && Math.random() < dt * 9) {
          const b = this.moveDir + Math.PI + (Math.random() - 0.5) * 1.2;
          env.fx.emit('sand', this.pos.x, this.pos.y + 0.04, this.pos.z, Math.cos(b) * 0.7, 0.7 + Math.random() * 0.5, -Math.sin(b) * 0.7);
        }
        if (this.target && Math.hypot(this.target.x - this.pos.x, this.target.z - this.pos.z) < 0.08) {
          if (this.state === 'flee') { this.state = 'hide'; this.timer = PEEK_T + 1.2 + this.rnd() * 1.2; this.hidden = true; }
          else this.arrive();
        }
        break;
      case 'dig':
      case 'pause':
        this.speed = 0;
        if (this.state === 'dig' && this.onDig) this.onDig(this, dt);
        if (this.state === 'dig' && env && env.fx && Math.random() < dt * 3.2) {
          const a = this.dir + (Math.random() - 0.5);
          const fx = this.pos.x + Math.cos(a) * 0.3 * this.scale / 1.6, fz = this.pos.z - Math.sin(a) * 0.3 * this.scale / 1.6;
          env.fx.emit('mud', fx, this.pos.y + 0.12, fz, (Math.random() - 0.5) * 0.3, 0.25, (Math.random() - 0.5) * 0.3, { size: 0.45, life: 4.5 });
          env.fx.emit('sand', fx, this.pos.y + 0.05, fz, (Math.random() - 0.5) * 0.8, 0.9, (Math.random() - 0.5) * 0.8);
        }
        if (this.timer <= 0) this.nextStop();
        break;
      case 'hide':
        this.speed = 0;
        if (this.timer <= 0) { this.hidden = false; this.state = 'rest'; this.timer = 1.0; this.stop = -1; }
        break;
      case 'trapped': {
        // 网圈里乱窜，出不去
        const T = this.trapped;
        T.t += dt;
        if (!this.target || Math.hypot(this.target.x - this.pos.x, this.target.z - this.pos.z) < 0.1) {
          const a = this.rnd() * Math.PI * 2, r = this.rnd() * (T.R - 0.35);
          this.target = { x: T.x + Math.cos(a) * r, z: T.z + Math.sin(a) * r };
        }
        if (T.t > 6) { this.state = 'rest'; this.timer = 0.5; this.trapped = null; }
        break;
      }
    }
  }

  nextStop() {
    const R = this.route;
    this.stop = (this.stop + 1) % (R.length + 1);
    if (this.stop === R.length) {
      this.target = this.home;
      this.state = 'walk';
      this.homeBound = true;
    } else {
      this.target = R[this.stop];
      this.state = 'walk';
      this.homeBound = false;
    }
  }

  arrive() {
    if (this.homeBound) {
      this.state = 'hide';
      this.hidden = true;
      this.timer = 5 + this.rnd() * 3;
      return;
    }
    const s = this.route[this.stop];
    this.state = s.dig ? 'dig' : 'pause';
    this.timer = s.t;
  }

  // 再过 T 秒它会在哪、是不是已经钻回窝里：照 think/move 的规则往前推，不改自己的状态。
  // 下网预告用：网落到底那一刻它在不在网口里。
  predict(T, dt = 0.05) {
    const R = this.route;
    let st = this.state, timer = this.timer, stop = this.stop, target = this.target, homeBound = this.homeBound;
    let x = this.pos.x, z = this.pos.z, sp = this.speed, hidden = this.hidden;
    const next = () => {
      stop = (stop + 1) % (R.length + 1);
      homeBound = stop === R.length;
      target = homeBound ? this.home : R[stop];
      st = 'walk';
    };
    for (let t = 0; t < T; t += dt) {
      timer -= dt;
      if (st === 'rest') { if (timer <= 0) next(); }
      else if (st === 'walk' || st === 'flee') {
        if (target && Math.hypot(target.x - x, target.z - z) < 0.08) {
          if (st === 'flee' || homeBound) return { x, z, hidden: true, st: 'hide' };
          st = R[stop].dig ? 'dig' : 'pause';
          timer = R[stop].t;
        }
      } else if (st === 'dig' || st === 'pause') { if (timer <= 0) next(); }
      else if (st === 'hide') { if (timer <= 0) { hidden = false; st = 'rest'; timer = 1.0; stop = -1; } }
      const moving = (st === 'walk' || st === 'flee') && target;
      sp = damp(sp, moving ? (st === 'flee' ? 1.25 : 0.42) : 0, 5, dt);
      if (moving) {
        const dx = target.x - x, dz = target.z - z, d = Math.hypot(dx, dz);
        const step = Math.min(d, sp * dt);
        x += (dx / (d || 1)) * step;
        z += (dz / (d || 1)) * step;
      }
    }
    return { x, z, hidden, st };
  }

  move(dt) {
    const T = this.target;
    const moving = (this.state === 'walk' || this.state === 'flee' || this.state === 'trapped') && T;
    const want = this.state === 'flee' ? 1.25 : this.state === 'trapped' ? 1.1 : 0.42;
    const rearing = this.state === 'flee' && this.rear > 0;
    this.speed = damp(this.speed, moving && !rearing ? want : 0, rearing ? 12 : 5, dt);
    if (rearing && this.fleeFrom) {
      this.dir = dampAngle(this.dir, Math.atan2(-(this.fleeFrom.z - this.pos.z), this.fleeFrom.x - this.pos.x), 9, dt);
    } else if (moving) {
      const dx = T.x - this.pos.x, dz = T.z - this.pos.z;
      const d = Math.hypot(dx, dz);
      const md = Math.atan2(-dz, dx);
      this.moveDir = md;
      // 横着走：身体朝向和走的方向差九十度
      const side = wrapAngle(md - this.dir) > 0 ? Math.PI / 2 : -Math.PI / 2;
      if (this.state !== 'trapped') this.dir = dampAngle(this.dir, md - side, 2.2, dt);
      const step = Math.min(d, this.speed * dt);
      this.pos.x += (dx / (d || 1)) * step;
      this.pos.z += (dz / (d || 1)) * step;
      if (this.trapped) {
        const tx = this.pos.x - this.trapped.x, tz = this.pos.z - this.trapped.z;
        const td = Math.hypot(tx, tz), lim = this.trapped.R - 0.3;
        if (td > lim) { this.pos.x = this.trapped.x + (tx / td) * lim; this.pos.z = this.trapped.z + (tz / td) * lim; }
      }
    } else if (this.state === 'dig' || this.state === 'pause') {
      // 停下时身体转向要翻的地方
      const s = this.route[this.stop];
      if (s && s.face !== undefined) this.dir = dampAngle(this.dir, s.face, 2, dt);
    }
    this.pos.y = seabedY(this.pos.x, this.pos.z);
    // 爬痕
    if (this.tracks && this.speed > 0.1 && this.pos.distanceTo(this.lastTrack) > 0.22 * this.scale / 1.6) {
      this.tracks.add(this.pos, this.moveDir, this.scale);
      this.lastTrack.copy(this.pos);
    }
  }

  animateStruggle(dt, t) {
    this.legPh += dt * 18;
    this.animLegs(1.3, dt, true);
  }
}

// 爬痕：成对的小凹点，慢慢淡掉
export class Tracks {
  constructor(scene) {
    this.n = 160;
    const geo = new THREE.BoxGeometry(0.06, 0.012, 0.035);
    this.mesh = new THREE.InstancedMesh(geo, toon({ color: 0x5d5340 }), this.n);
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.mesh.count = 0;
    this.mesh.frustumCulled = false;
    this.items = [];
    this.i = 0;
    this.m = new THREE.Matrix4();
    scene.add(this.mesh);
  }
  reset() {
    this.items = [];
    this.i = 0;
    this.mesh.count = 0;
  }
  add(p, dir, scale) {
    for (const s of [-1, 1]) {
      const ox = Math.sin(dir) * 0.12 * s * scale / 1.6, oz = Math.cos(dir) * 0.12 * s * scale / 1.6;
      const x = p.x + ox, z = p.z + oz;
      const it = { x, y: seabedY(x, z) + 0.006, z, dir, age: 0 };
      if (this.items.length < this.n) this.items.push(it);
      else this.items[this.i++ % this.n] = it;
    }
  }
  update(dt) {
    const m = this.m;
    const q = new THREE.Quaternion();
    const s = new THREE.Vector3();
    let k = 0;
    for (const it of this.items) {
      it.age += dt;
      const f = 1 - clamp((it.age - 30) / 20, 0, 1);
      if (f <= 0) continue;
      q.setFromAxisAngle(V(0, 1, 0), it.dir);
      s.set(f, 1, f);
      m.compose(new THREE.Vector3(it.x, it.y, it.z), q, s);
      this.mesh.setMatrixAt(k++, m);
    }
    this.mesh.count = k;
    this.mesh.instanceMatrix.needsUpdate = true;
  }
}

// 场景里所有的蟹：沉船边那只（翻泥、会翻出印章），浅滩上两只小的
export class CrabLife {
  constructor(g) {
    this.g = g;
    this.group = new THREE.Group();
    this.group.name = 'crabs';
    g.world.scene.add(this.group);
    this.tracks = new Tracks(g.world.scene);
    this.list = [];
    // 翻泥坑：深色的扰动泥 + 一圈翻起的沙
    this.digPatch = buildDigPatch();
    g.world.scene.add(this.digPatch.mesh);
  }

  reset() {
    for (const c of this.list) c.group.parent && c.group.parent.remove(c.group);
    this.list = [];
    this.tracks.reset();
    this.digPatch.set(0);
    this.digDone = 0;
    const home = wreckToWorld(CRAB_HOME.along, CRAB_HOME.side);
    const route = CRAB_STOPS.map((s) => {
      const w = wreckToWorld(s.along, s.side);
      // 翻泥时面朝船身
      return { x: w.x, z: w.z, t: s.t, dig: !!s.dig, face: Math.atan2(-(home.z - w.z), home.x - w.x) + 0.6 };
    });
    const g = this.g;
    const key = new Crab({
      key: true, scale: 1.75, color: 0xc85a2c, route, home, seed: 11, startDelay: 2.0, tracks: this.tracks,
      onDig: (crab, dt) => this.onDig(crab, dt),
    });
    key.place(home.x, home.z);
    key.hidden = true;
    key.state = 'hide';
    key.timer = 2.5;
    this.list.push(key);
    this.key = key;
    // 浅滩的小蟹：在石头和草之间转
    const shoalStops = (cx, cz, seed) => {
      const r = mulberry32(seed);
      const pts = [];
      for (let i = 0; i < 4; i++) {
        const a = r() * Math.PI * 2, d = 2 + r() * 3.5;
        pts.push({ x: cx + Math.cos(a) * d, z: cz + Math.sin(a) * d, t: 3 + r() * 4, dig: r() < 0.5 });
      }
      return pts;
    };
    for (const [{ x: cx, z: cz }, seed, col] of [[SHOAL_CRABS[0], 3, 0xb4602e], [SHOAL_CRABS[1], 5, 0xa8582a]]) {
      const c = new Crab({ scale: 1.2, color: col, route: shoalStops(cx, cz, seed), home: { x: cx, z: cz }, seed, startDelay: 1 + seed * 0.3, tracks: this.tracks });
      c.place(cx, cz);
      this.list.push(c);
    }
    for (const c of this.list) this.group.add(c.group);
  }

  // 蟹在印章那块翻泥：第一次会把埋着的印章翻出一点来
  onDig(crab, dt) {
    if (crab.stop !== 0) return;
    const seal = this.g.items.seal;
    const sp = wreckToWorld(SEAL_SPOT.along, SEAL_SPOT.side);
    this.digDone = Math.min(1, this.digDone + dt / 6.5);
    this.digPatch.place(sp.x, sp.z);
    this.digPatch.set(Math.max(this.digPatch.amount, this.digDone));
    if (seal && seal.state === 'seabed') {
      // 翻完一遍印章露出大半：只露一点时它在画面上不到一个像素，玩家看不见「翻出来的硬边」
      const target = SEAL_SPOT.bury - 0.8 * this.digDone;
      if (seal.bury > target) {
        seal.bury = target;
        this.g.items.placeItem(seal);
        if (seal.bury < 0.55 && !this.announced) {
          this.announced = true;
          this.g.events.emit('crabExposed', { x: sp.x, z: sp.z });
        }
      }
    }
  }

  get catchables() {
    return this.list.filter((c) => c.catchable);
  }

  update(dt, t) {
    const g = this.g;
    for (const c of this.list) {
      if (c.mode !== 'sea') continue;
      c.update(dt, t, this.env || (this.env = { fx: g.fx, sound: (k, cr) => this.sound(k, cr) }));
    }
    this.list = this.list.filter((c) => c.mode === 'sea');
    this.tracks.update(dt);
  }

  sound(kind, c) {
    const g = this.g;
    const s = g.project(c.pos);
    if (s.z >= 1 || s.x < 0 || s.x > VIEW_W || s.y < 0 || s.y > VIEW_H) return;
    const d = c.pos.distanceTo(g.cam.cam.position);
    const max = kind === 'threat' ? 42 : 30;
    if (d > max) return;
    const gain = clamp(1.25 - d / max, 0.2, 1);
    const pan = clamp((s.x / VIEW_W) * 2 - 1, -0.8, 0.8);
    if (kind === 'burrow') { g.audio.play('crabBurrow', { pan, gain }); g.pulse('A23', 4); return; }
    g.audio.play(kind === 'step' ? 'crabStep' : kind === 'dig' ? 'crabDig' : 'crabThreat', { pan, gain });
    if (kind === 'threat') g.cue('A23');
    else g.pulse(c.state === 'flee' ? 'A23' : 'A09', 4);
  }

  // 网触底/入水时的惊扰
  disturb(x, z, ringR, radius) {
    for (const c of this.list) {
      const d = Math.hypot(c.pos.x - x, c.pos.z - z);
      if (d < radius) c.startle(x, z, ringR);
    }
  }
}

function buildDigPatch() {
  const n = 22;
  const pos = [], col = [], idx = [];
  const rings = [0, 0.3, 0.5, 0.62];
  const cols = [[0.3, 0.26, 0.2], [0.34, 0.29, 0.22], [0.58, 0.52, 0.4], [0.5, 0.46, 0.36]];
  const lift = [-0.02, -0.01, 0.06, 0.0];
  for (let r = 0; r < rings.length; r++) {
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const j = 1 + Math.sin(a * 3 + r) * 0.12 + Math.sin(a * 7) * 0.06;
      pos.push(Math.cos(a) * rings[r] * j * 1.2, lift[r], Math.sin(a) * rings[r] * j);
      col.push(...cols[r]);
    }
  }
  for (let r = 0; r < rings.length - 1; r++) {
    for (let i = 0; i < n; i++) {
      const a = r * n + i, b = r * n + ((i + 1) % n), c = (r + 1) * n + i, d = (r + 1) * n + ((i + 1) % n);
      idx.push(a, c, b, b, c, d);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  const mesh = new THREE.Mesh(geo, toon({ vertexColors: true }));
  mesh.visible = false;
  return {
    mesh,
    amount: 0,
    place(x, z) {
      mesh.position.set(x, seabedY(x, z) + 0.02, z);
    },
    set(a) {
      this.amount = a;
      mesh.visible = a > 0.02;
      const s = 0.35 + a * 0.75;
      mesh.scale.set(s, Math.max(0.05, a), s);
    },
  };
}

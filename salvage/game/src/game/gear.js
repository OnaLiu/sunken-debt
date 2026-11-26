import * as THREE from 'three';
import { setNetR, NET_R } from '../config.js';
import { GEAR, DEBT } from './tables.js';
import { toon } from '../render/materials.js';
import { GeoBuilder } from '../util/builder.js';
import { BOAT } from '../world/boat.js';
import { easeOutBack, clamp } from '../util/math.js';

// 船上的设备、手里的钱、债本（全游戏一份：第一段三小段第一次做，后面几片海、船坞、船队都用它）。
// 设备每一级的价钱和数在配表「设备」，债本每一页在配表「债本」；游戏只从表里读。
// 每一样升了都在船上看得见：网口大一圈（网架照新的半径重摆）；油箱多一只油桶立在驾驶室顶上。

// 驾驶室顶上，原来那两只油箱的船头那一边：升一级多一只（船局部坐标）
const DRUMS = [{ x: -3.72, z: 0.62 }, { x: -3.08, z: 0.62 }, { x: -3.4, z: -0.6 }];
const DRUM_R = 0.25, DRUM_H = 0.72, DRUM_Y = 3.23;

export class Gear {
  constructor(g) {
    this.g = g;
    this.reset();
    this.buildDrums();
    this.apply(true);
  }

  // 从头（新开一局）：没钱、设备都是起步的那一级、债本一页没还
  reset() {
    this.coins = 0;
    this.lv = {};
    for (const id of Object.keys(GEAR)) this.lv[id] = 0;
    this.paid = 0;
    this.trips = 0;
    this.pop = null;
    // 船上装好了的那一级（买下以后船员走过去装上才算到船上；规则照 lv）
    this.fitted = { ...this.lv };
  }

  // —— 设备 ——
  ids() {
    return Object.keys(GEAR);
  }
  cur(id) {
    return GEAR[id].levels[this.lv[id]];
  }
  next(id) {
    return GEAR[id].levels[this.lv[id] + 1] || null;
  }
  canBuy(id) {
    const n = this.next(id);
    return !!n && this.coins >= n.price;
  }
  buy(id) {
    if (!this.canBuy(id)) return false;
    this.coins -= this.next(id).price;
    this.lv[id]++;
    return true;
  }
  // 船员扳下去那一下：装到船上（from：船员手在船上哪一点，船局部坐标；油桶从他手上提上去）
  install(id, from = null) {
    if (this.fitted[id] === this.lv[id]) return;
    const r0 = GEAR[id].levels[this.fitted[id]].val;
    this.fitted[id] = this.lv[id];
    this.apply();
    this.pop = { id, t: 0, from, r0 };
  }
  // 还没装上的都当场装上（出海、换场）
  installAll() {
    for (const id of this.ids()) if (this.fitted[id] !== this.lv[id]) { this.fitted[id] = this.lv[id]; this.apply(); }
    this.pop = null;
    this.g.boat.net.root.scale.set(1, 1, 1);
    this.drums.forEach((d) => { d.scale.set(1, 1, 1); d.position.y = DRUM_Y; });
  }
  // 这一趟出海带多少油
  get fuel() {
    return this.cur('tank').val;
  }

  // 设备落到船上：网口、油桶
  apply(first = false) {
    setNetR(GEAR.net.levels[this.fitted.net].val);
    this.g.boat.net.resize(NET_R);
    this.g.boat.net.state.close = 0;
    this.g.boat.net.updateSkirt();
    const n = this.fitted.tank;
    this.drums.forEach((d, i) => (d.visible = i < n));
    if (first) this.pop = null;
  }

  buildDrums() {
    const body = this.g.boat.body;
    const steel = new THREE.Color(0.62, 0.17, 0.12), band = new THREE.Color(0.3, 0.09, 0.07), top = new THREE.Color(0.75, 0.73, 0.68), cap = new THREE.Color(0.86, 0.66, 0.2);
    this.drums = DRUMS.map((p) => {
      const b = new GeoBuilder();
      const V = (y) => new THREE.Vector3(0, y, 0);
      b.cylinder(V(0), V(DRUM_H), DRUM_R, DRUM_R, 10, steel);
      for (const y of [0.2, 0.5]) b.cylinder(V(DRUM_H * y), V(DRUM_H * y + 0.05), DRUM_R + 0.015, DRUM_R + 0.015, 10, band, false);
      b.cylinder(V(DRUM_H), V(DRUM_H + 0.02), DRUM_R - 0.02, DRUM_R - 0.02, 10, top);
      b.cylinder(new THREE.Vector3(0.1, DRUM_H, 0.06), new THREE.Vector3(0.1, DRUM_H + 0.07, 0.06), 0.05, 0.05, 6, cap);
      const m = new THREE.Mesh(b.build(), toon({ vertexColors: true, spec: 0.35, shin: 24 }));
      m.castShadow = true;
      m.position.set(p.x, DRUM_Y, p.z);
      m.visible = false;
      m.name = 'fuelDrum';
      body.add(m);
      return m;
    });
  }

  // 装上那一下：油桶从船员手上提上驾驶室顶、落定弹一下；网从原来的口径撑到新的口径、过一点再弹回
  update(dt) {
    const P = this.pop;
    if (!P) return;
    P.t += dt;
    if (P.id === 'tank') {
      const d = this.drums[this.fitted.tank - 1];
      const k = clamp(P.t / 0.5, 0, 1);
      if (d) {
        const D = DRUMS[this.fitted.tank - 1];
        const f = P.from || { x: D.x, y: DRUM_Y + 0.9, z: D.z };
        const e = 1 - (1 - k) * (1 - k);
        d.position.set(f.x + (D.x - f.x) * e, f.y + (DRUM_Y - f.y) * e + Math.sin(k * Math.PI) * 0.7, f.z + (D.z - f.z) * e);
        // 落定：压扁一下再弹回
        const q = clamp((P.t - 0.5) / 0.3, 0, 1);
        const sq = q > 0 && q < 1 ? Math.sin(q * Math.PI) * 0.22 : 0;
        d.scale.set(1 + sq * 0.5, 1 - sq, 1 + sq * 0.5);
        if (k >= 1 && !P.landed) {
          P.landed = true;
          const w = new THREE.Vector3(D.x, DRUM_Y + 0.05, D.z);
          this.g.boat.body.localToWorld(w);
          if (this.g.fx) for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; this.g.fx.emit('dust', w.x, w.y, w.z, Math.cos(a) * 1.2, 0.3, Math.sin(a) * 1.2, { size: 0.18, life: 0.9 }); }
          this.g.audio.play('clank');
          this.g.cam.shake(0.006 * (this.g.wobbleK ?? 1));
        }
      }
      if (P.t > 0.85) this.pop = null;
    } else if (P.id === 'net') {
      const k = clamp(P.t / 0.6, 0, 1);
      const r1 = this.cur('net').val, r0 = P.r0 || r1;
      const w = (r0 + (r1 - r0) * easeOutBack(k)) / r1;
      this.g.boat.net.root.scale.set(w, 1, w);
      if (!P.landed) {
        P.landed = true;
        this.g.audio.play('clank');
        const w2 = new THREE.Vector3();
        this.g.boat.net.root.getWorldPosition(w2);
        if (this.g.fx) for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; this.g.fx.emit('spark', w2.x + Math.cos(a) * r1, w2.y, w2.z + Math.sin(a) * r1, Math.cos(a) * 0.8, 0.6, Math.sin(a) * 0.8, { life: 0.8 }); }
      }
      if (k >= 1) { this.g.boat.net.root.scale.set(1, 1, 1); this.pop = null; }
    }
  }

  // 升了这一样，船员站哪儿装（甲板坐标 x, z）、对着哪儿（tx, tz）：油箱站在驾驶室旁、对着新油桶那一角；网站在吊机座旁扳吊机
  fitSpot(id) {
    if (id === 'tank') {
      const D = DRUMS[Math.max(0, this.lv.tank - 1)];
      return { x: D.x - 0.3, z: Math.sign(D.z) * 1.72, tx: D.x, tz: D.z };
    }
    return { x: BOAT.crane.x - 0.05, z: -0.98, tx: BOAT.crane.x, tz: 0 };
  }

  // 设备在船上的哪一处（船局部，船坞里那块牌子挂在这儿）
  anchor(id) {
    if (id === 'tank') return new THREE.Vector3(-3.7, 4.3, 0.2);
    if (id === 'net') return null; // 网架挂在世界里，跟着吊臂走（harbor.js 直接取它的位置）
    return new THREE.Vector3(0, BOAT.deckY + 1, 0);
  }

  // —— 债本 ——
  get page() {
    return DEBT[this.paid] || null;
  }
  get owed() {
    let s = 0;
    for (let i = this.paid; i < DEBT.length; i++) s += DEBT[i].due;
    return s;
  }
  canRepay() {
    return !!this.page && this.coins >= this.page.due;
  }
  repay() {
    if (!this.canRepay()) return false;
    this.coins -= this.page.due;
    this.paid++;
    return true;
  }
}

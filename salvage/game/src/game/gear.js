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
    this.apply();
    // 装上那一下：新的那一样从小弹到原大
    this.pop = { id, t: 0 };
    return true;
  }
  // 这一趟出海带多少油
  get fuel() {
    return this.cur('tank').val;
  }

  // 设备落到船上：网口、油桶
  apply(first = false) {
    setNetR(this.cur('net').val);
    this.g.boat.net.resize(NET_R);
    this.g.boat.net.state.close = 0;
    this.g.boat.net.updateSkirt();
    const n = this.lv.tank;
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

  // 装上那一下：新油桶落到顶上弹一下；网架鼓一下
  update(dt) {
    const P = this.pop;
    if (!P) return;
    P.t += dt;
    const k = clamp(P.t / 0.55, 0, 1);
    const s = Math.max(0.01, easeOutBack(k));
    if (P.id === 'tank') {
      const d = this.drums[this.lv.tank - 1];
      if (d) { d.scale.set(s, s, s); d.position.y = DRUM_Y + (1 - k) * 0.9; }
    } else if (P.id === 'net') {
      const r = this.g.boat.net.ring;
      const w = 1 + Math.sin(k * Math.PI) * 0.12;
      r.scale.set(w, w, w);
    }
    if (k >= 1) this.pop = null;
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

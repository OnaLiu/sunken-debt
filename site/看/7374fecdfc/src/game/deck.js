import * as THREE from 'three';
import { BOAT, halfB } from '../world/boat.js';
import { BOAT_ZONE } from './arm.js';
import { NET_R } from '../config.js';
import { GeoBuilder } from '../util/builder.js';
import { toon } from '../render/materials.js';
import { clamp, lerp, easeOut } from '../util/math.js';

// 甲板码包（设计第 3、5 节）：甲板加宽以后，每一网的泥包不当场冲，吊臂直接放到甲板上一个空位上，攒着一起冲。
// 全游戏一份：小样、三小段、切片里「甲板码包」都是这一份；几个空位、放在哪由「甲板加宽」这一样设备定。
//
// 加宽的甲板：两舷各接出一块木平台（舷外托架托着、外沿一圈矮栏杆），和船上原来的甲板同一种木板。
// 空位：两舷平台上各两个、前甲板正中（洗台）一个。先放两舷、离网过来那一边近的先放，洗台最后放。

const SPONSON = { x0: 1.45, x1: 5.15, w: 2.05 }; // 平台从船身外沿往外伸多宽（米）
const SIDE_XS = [2.45, 4.3];
const C = {
  deck: new THREE.Color(0.8, 0.67, 0.5), // 新铺的板，比老甲板浅一档
  edge: new THREE.Color(0.5, 0.36, 0.24),
  rail: new THREE.Color(0.48, 0.34, 0.22),
  iron: new THREE.Color(0.24, 0.25, 0.26),
};
const _v = new THREE.Vector3();
const _q = new THREE.Quaternion();
const BOAT_HZ = BOAT_ZONE.hz;

// 某一处（船局部 x）船身外沿多宽：平台贴着这一条
const hullAt = (x) => halfB(clamp(x, -BOAT.halfLen, BOAT.halfLen));

// 某一处（船局部 x）甲板连加宽的平台一共多宽（半宽，到平台外沿）：一甲板一起冲时漫过甲板的水、地上跑的裂纹照这个走
export function deckHalf(x) {
  const w = hullAt(x);
  if (x <= SPONSON.x0 || x >= SPONSON.x1) return w;
  return w + SPONSON.w * (0.82 + 0.18 * Math.sin(Math.PI * clamp((x - SPONSON.x0) / (SPONSON.x1 - SPONSON.x0), 0, 1)));
}

export class DeckStack {
  constructor(g) {
    this.g = g;
    this.on = false;
    this.cap = 5;
    this.slots = [];
    this.group = new THREE.Group();
    this.group.name = 'sponsons';
    this.group.visible = false;
    g.boat.body.add(this.group);
    this.buildSponsons();
    this.reset();
  }

  // 开：甲板加宽（平台露出来），网包从此码在甲板上
  enable(on, cap = 5) {
    this.on = on;
    this.cap = cap;
    this.group.visible = on;
    // 网口不能压在自己船上：加宽的那一截也算船身
    BOAT_ZONE.hz = on ? Math.max(BOAT_HZ, SPONSON.w + hullAt(2.5) + NET_R + 0.1) : BOAT_HZ;
    this.makeSlots();
    this.reset();
  }

  makeSlots() {
    const s = [];
    for (const x of SIDE_XS) for (const side of [-1, 1]) s.push({ x, z: side * (hullAt(x) + 1.0), side, centre: false });
    s.push({ x: BOAT.wash.x, z: BOAT.wash.z, side: 0, centre: true });
    this.slots = s.slice(0, Math.max(1, this.cap)).map((p, i) => ({ ...p, i, bundle: null, reserved: false }));
    // 码满时洗台那一个最后放（空位不到五个时就没有它）
    if (this.cap < 5) this.slots = s.filter((p) => !p.centre).slice(0, this.cap).map((p, i) => ({ ...p, i, bundle: null, reserved: false }));
  }

  reset() {
    for (const S of this.slots || []) {
      if (S.bundle && S.bundle.group.parent) S.bundle.group.parent.remove(S.bundle.group);
      S.bundle = null;
      S.reserved = false;
      S.fall = null;
      S.hop = null;
    }
    this.landing = null;
  }

  get filled() {
    return this.slots.filter((S) => S.bundle).length;
  }

  get used() {
    return this.slots.filter((S) => S.bundle || S.reserved).length;
  }

  get full() {
    return this.used >= this.slots.length;
  }

  get bundles() {
    return this.slots.filter((S) => S.bundle && !S.fall).map((S) => S.bundle);
  }

  // 有一包还在往下砸
  get busy() {
    return this.slots.some((S) => S.fall);
  }

  // 网下去的那一刻就定下这一包放哪：两舷里离白圈那一边近的、靠船头那个先放，洗台最后
  reserve(aimWorld) {
    const local = this.g.boat.body.worldToLocal(_v.copy(aimWorld));
    const side = local.z >= 0 ? 1 : -1;
    const free = this.slots.filter((S) => !S.bundle && !S.reserved);
    if (!free.length) return null;
    free.sort((a, b) => (a.centre - b.centre) || ((a.side === side ? 0 : 1) - (b.side === side ? 0 : 1)) || (Math.hypot(a.x - local.x, a.z - local.z) - Math.hypot(b.x - local.x, b.z - local.z)));
    const S = free[0];
    S.reserved = true;
    return S;
  }

  // 吊臂把这一包放到哪儿上方（船局部，臂端高度照收起时的高度）
  tipFor(S) {
    return new THREE.Vector3(S.x, BOAT.stowTip.y, S.z);
  }

  // 这一处（船局部）是不是在甲板（连加宽的平台）上方：网包吊过来时用
  overDeck(x, z, pad = 0.3) {
    if (Math.abs(x) >= BOAT.halfLen) return false;
    const w = hullAt(x) + (this.on && x > SPONSON.x0 && x < SPONSON.x1 ? SPONSON.w : 0);
    return Math.abs(z) < w - pad;
  }

  // 松闸：网包从网里落到它的位子上（netop 的 set 走完）
  land(bundle, S, crab) {
    const g = this.g;
    if (!S) S = this.slots.find((q) => !q.bundle) || this.slots[0];
    g.boat.body.attach(bundle.group);
    S.bundle = bundle;
    S.reserved = false;
    S.crab = crab || null;
    S.fall = { vy: 0, from: bundle.group.position.clone(), fromQ: bundle.group.quaternion.clone(), t: 0, thud: false };
    g.audio.play('release', { heavy: bundle.heavy });
  }

  // 直接摆好一包（试跑直达「码满」那一刻用；和吊下来砸好以后是同一个样子）
  place(bundle, S) {
    const g = this.g;
    g.boat.body.add(bundle.group);
    bundle.group.position.set(S.x, BOAT.deckY, S.z);
    bundle.group.quaternion.identity();
    bundle.group.scale.set(1, 1, 1);
    S.bundle = bundle;
    S.reserved = false;
    S.fall = null;
  }

  // 别处砸下来一包：码着的跟着一跳（越重跳得越高）
  hopAll(src, heavy, mass) {
    for (const S of this.slots) {
      if (!S.bundle || S.bundle === src || S.fall) continue;
      S.hop = { t: -0.03, a: (heavy ? 0.07 : 0.025 + 0.02 * mass) * (0.8 + Math.random() * 0.4), r: (Math.random() - 0.5) * (heavy ? 0.16 : 0.08) };
    }
  }

  // 一包拿走（开冲揭完、搬进舱）
  take(S) {
    S.bundle = null;
    S.crab = null;
    S.fall = null;
    S.hop = null;
  }

  update(dt, t) {
    const g = this.g;
    for (const S of this.slots) {
      const b = S.bundle;
      if (!b) continue;
      b.update(dt, t);
      const F = S.fall;
      if (F) {
        F.t += dt;
        const to = _v.set(S.x, BOAT.deckY, S.z);
        if (!F.thud) {
          // 松了闸：整包往下掉（比重力还急一点），掉的时候摆正、对准它的位子
          F.vy -= 14 * dt;
          const y = b.group.position.y + F.vy * dt;
          const k = clamp((F.from.y - y) / Math.max(0.05, F.from.y - to.y), 0, 1);
          b.group.position.set(lerp(F.from.x, to.x, easeOut(k)), Math.max(to.y, y), lerp(F.from.z, to.z, easeOut(k)));
          _q.identity();
          b.group.quaternion.slerpQuaternions(F.fromQ, _q, easeOut(k));
          const st = Math.min(0.08, -F.vy * 0.018);
          b.group.scale.set(1 - st * 0.4, 1 + st, 1 - st * 0.4);
          if (y <= to.y) {
            b.group.position.copy(to);
            b.group.quaternion.identity();
            F.thud = true;
            F.at = F.t;
            g.reveal.slam(b, { heavy: b.heavy, empty: b.empty, x: S.x, z: S.z });
            g.events.emit('deckLanded', { slot: S, bundle: b });
          }
          continue;
        }
        // 砸扁：最扁的那一下顿两帧，再弹回来、回弹一下停住
        const u = F.t - F.at;
        const A = b.heavy ? 0.3 : 0.22;
        const sq = u < 0.05 ? A : A * Math.cos((u - 0.05) * 15) * Math.exp(-(u - 0.05) * 7.5);
        b.group.scale.set(1 + sq * 0.55, 1 - sq, 1 + sq * 0.55);
        if (u >= 0.5) { b.group.scale.set(1, 1, 1); S.fall = null; }
        continue;
      }
      if (S.hop) {
        const H = S.hop;
        H.t += dt;
        const u = clamp(H.t / 0.34, 0, 1);
        b.group.position.y = BOAT.deckY + Math.sin(u * Math.PI) * H.a;
        b.group.rotation.z = Math.sin(u * Math.PI) * H.r;
        if (u >= 1) { b.group.position.y = BOAT.deckY; b.group.rotation.z = 0; S.hop = null; }
      }
    }
  }

  // —— 加宽的甲板：两舷各一块平台 ——
  buildSponsons() {
    const pk = new GeoBuilder();
    const fr = new GeoBuilder();
    const n = 14;
    const y = BOAT.deckY;
    const up = new THREE.Vector3(0, 1, 0);
    for (const side of [-1, 1]) {
      const xs = [];
      for (let i = 0; i <= n; i++) xs.push(SPONSON.x0 + ((SPONSON.x1 - SPONSON.x0) * i) / n);
      // 平台两头收一点（不是方方正正一块板）
      const outer = (x) => hullAt(x) + SPONSON.w * (0.82 + 0.18 * Math.sin(Math.PI * clamp((x - SPONSON.x0) / (SPONSON.x1 - SPONSON.x0), 0, 1)));
      const inner = (x) => hullAt(x) - 0.06;
      for (let i = 0; i < n; i++) {
        const x0 = xs[i], x1 = xs[i + 1];
        const strips = 7;
        for (let s = 0; s < strips; s++) {
          const f0 = s / strips, f1 = (s + 1) / strips;
          const z = (x, f) => side * lerp(inner(x), outer(x), f);
          const a = new THREE.Vector3(x0, y, z(x0, f0)), b = new THREE.Vector3(x1, y, z(x1, f0));
          const c = new THREE.Vector3(x1, y, z(x1, f1)), d = new THREE.Vector3(x0, y, z(x0, f1));
          if (side > 0) pk.quad(a, d, c, b, C.deck); else pk.quad(a, b, c, d, C.deck);
        }
        // 外沿的封边板（往下一截）
        const o0 = new THREE.Vector3(x0, y + 0.02, side * outer(x0)), o1 = new THREE.Vector3(x1, y + 0.02, side * outer(x1));
        const b0 = o0.clone().setY(y - 0.2), b1 = o1.clone().setY(y - 0.2);
        if (side > 0) fr.quad(b0, b1, o1, o0, C.edge); else fr.quad(b1, b0, o0, o1, C.edge);
        // 栏杆扶手
        fr.beam(new THREE.Vector3(x0, y + 0.5, side * (outer(x0) - 0.05)), new THREE.Vector3(x1, y + 0.5, side * (outer(x1) - 0.05)), up, 0.06, 0.06, C.rail);
        // 贴着板面的一道护脚
        fr.beam(new THREE.Vector3(x0, y + 0.06, side * (outer(x0) - 0.05)), new THREE.Vector3(x1, y + 0.06, side * (outer(x1) - 0.05)), up, 0.05, 0.1, C.edge);
      }
      // 两头的封边
      for (const x of [SPONSON.x0, SPONSON.x1]) {
        const a = new THREE.Vector3(x, y + 0.02, side * inner(x)), b = new THREE.Vector3(x, y + 0.02, side * outer(x));
        fr.quad(a, b, b.clone().setY(y - 0.2), a.clone().setY(y - 0.2), C.edge);
        fr.beam(new THREE.Vector3(x, y + 0.5, side * (inner(x) + 0.1)), new THREE.Vector3(x, y + 0.5, side * (outer(x) - 0.05)), up, 0.06, 0.06, C.rail);
      }
      // 栏杆立柱
      for (let x = SPONSON.x0; x <= SPONSON.x1 + 1e-3; x += (SPONSON.x1 - SPONSON.x0) / 5) {
        const zo = side * (outer(x) - 0.05);
        fr.beam(new THREE.Vector3(x, y, zo), new THREE.Vector3(x, y + 0.53, zo), new THREE.Vector3(1, 0, 0), 0.07, 0.07, C.rail);
      }
      for (const x of [SPONSON.x0, SPONSON.x1]) fr.beam(new THREE.Vector3(x, y, side * (inner(x) + 0.1)), new THREE.Vector3(x, y + 0.53, side * (inner(x) + 0.1)), new THREE.Vector3(1, 0, 0), 0.07, 0.07, C.rail);
      // 托架：从平台外沿底下斜着撑到船身上，铁箍钉在船壳上
      for (const x of [1.9, 3.3, 4.7]) {
        const zo = side * (outer(x) - 0.25), zi = side * (hullAt(x) - 0.08);
        fr.beam(new THREE.Vector3(x, y - 0.18, zo), new THREE.Vector3(x, 0.32, zi), new THREE.Vector3(1, 0, 0), 0.1, 0.1, C.edge);
        fr.beam(new THREE.Vector3(x, y - 0.12, zi), new THREE.Vector3(x, y - 0.12, zo), new THREE.Vector3(0, 1, 0), 0.1, 0.12, C.edge);
        fr.box(new THREE.Vector3(x, 0.34, zi + side * 0.02), new THREE.Vector3(0.09, 0, 0), new THREE.Vector3(0, 0.06, 0), new THREE.Vector3(0, 0, 0.03), C.iron);
      }
    }
    const planks = new THREE.Mesh(pk.build(), toon({ vertexColors: true, side: THREE.DoubleSide, wood: { w: 0.24, len: 2.9, seam: 0.85, grain: 1 } }));
    planks.receiveShadow = true;
    planks.castShadow = true;
    const frame = new THREE.Mesh(fr.build(), toon({ vertexColors: true, side: THREE.DoubleSide }));
    frame.castShadow = true;
    this.group.add(planks, frame);
  }
}

import * as THREE from 'three';
import { buildItemModel, setItemMud, MUD } from '../world/items.js';
import { ITEM_DEFS, LOOSE_ITEMS, OUTER_ITEMS, wreckToWorld, WRECK, SEAL_SPOT, TRAIL, HIDDEN_TIMBER } from '../world/layout.js';
import { seabedY, seabedNormal } from '../world/terrain.js';
import { floorPoint } from '../world/wreck.js';
import { toon } from '../render/materials.js';
import { mulberry32 } from '../util/math.js';

// 海底的每一件东西：开局时就生成并固定位置；被网收走就真的离开海底，留下压痕。
// 泥包最高是东西露出泥面那截的几成
const MOUND_CAP = 0.3;
export class ItemSystem {
  constructor(world) {
    this.world = world;
    this.group = new THREE.Group();
    this.group.name = 'items';
    world.scene.add(this.group);
    this.decals = new THREE.Group();
    this.decals.name = 'decals';
    world.scene.add(this.decals);
    this.items = [];
    this.moundMat = toon({ vertexColors: true });
    this.scarMat = toon({ color: 0xffffff, vertexColors: true, transparent: false });
  }

  // tide：这一潮重铺的散货（tide.js 的 tideLayout）；不给就是第一趟原来的摆法（银币匣一定在）
  reset(tide = null) {
    for (const it of this.items) {
      it.model.group.parent && it.model.group.parent.remove(it.model.group);
      if (it.mound) this.group.remove(it.mound);
    }
    while (this.decals.children.length) this.decals.remove(this.decals.children[0]);
    this.items = [];
    let seed = 0.11;
    const add = (spec, x, z, y = null, opts = {}) => {
      const def = ITEM_DEFS[spec.kind];
      seed += 0.173;
      const shallow = y === null && seabedY(x, z) > -7;
      const model = buildItemModel(spec.kind, { seed: seed % 1, mud: spec.mud ?? opts.mud ?? (shallow ? 0.32 : 0.42), mudColor: opts.mudColor ?? (shallow ? MUD.sand.color : MUD.wreck.color), clear: spec.clear });
      const sy = y ?? seabedY(x, z);
      const it = {
        id: spec.id, kind: spec.kind, def, model,
        x, z, y: sy, rot: spec.rot || 0, tilt: spec.tilt || 0, bury: spec.bury || 0, grip: spec.grip, moundAt: spec.moundAt || 0,
        h: model.info.h, r: def.r, state: 'seabed', inHold: !!opts.inHold, seed,
        surfaceTag: opts.tag || 0, from: spec.from || '',
      };
      this.placeItem(it);
      this.group.add(model.group);
      if (it.bury > 0.15 && !opts.noMound) it.mound = this.makeMound(it);
      this.items.push(it);
      return it;
    };
    if (tide) for (const s of tide.loose) add(s, s.x, s.z);
    else {
      for (const s of LOOSE_ITEMS) add(s, s.x, s.z);
      for (const s of OUTER_ITEMS) {
        const w = wreckToWorld(s.along, s.side);
        add(s, w.x, w.z);
      }
    }
    // 线索（船板、桶板、断缆、碎陶片）每一潮都在：地形、沉船和线索不变，走熟了的海认得出来
    for (const t of TRAIL) add({ id: 'trail-' + t.kind + t.x, kind: t.kind, rot: t.rot, bury: 0.2 }, t.x, t.z);
    // 印章：事先就埋着（蟹翻泥会把它翻出来）。只在第一趟：那是第一趟的事，以后每一潮船边冲出来的铜印照 tide.js
    this.seal = null;
    if (!tide) {
      const w = wreckToWorld(SEAL_SPOT.along, SEAL_SPOT.side);
      this.seal = add({ id: 'seal', kind: 'seal', rot: 0.7, bury: SEAL_SPOT.bury }, w.x, w.z, null, { noMound: true });
    }
    // 舱里：银币匣和货袋，落在淤泥面上
    {
      const fi = this.world.wreck.floorInfo;
      const ship = this.world.wreck.ship;
      const put = (spec, lx, t) => {
        const p = floorPoint(fi, lx, t).applyMatrix4(ship.matrixWorld);
        // 舱里的东西蒙着一层灰白的细淤，压在更暗的舱底上看得出轮廓
        return add(spec, p.x, p.z, p.y, { inHold: true, tag: 1, mud: 0.46, mudColor: 0x8c8473 });
      };
      if (tide) {
        this.chest = null;
        for (const s of tide.hold) { const it = put(s, s.lx, s.t); if (s.kind === 'chest') this.chest = it; }
      } else {
        this.chest = put({ id: 'chest', kind: 'chest', rot: 0.4, tilt: 0.12, bury: 0.32 }, 2.75, 0.55);
        put({ id: 'sack', kind: 'sack', rot: 2.2, tilt: 0.2, bury: 0.2 }, 1.85, 0.42);
      }
    }
  }

  placeItem(it) {
    const g = it.model.group;
    const n = it.inHold ? new THREE.Vector3(0, 1, 0) : seabedNormal(it.x, it.z);
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), n);
    const qy = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), it.rot);
    const qt = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), it.tilt);
    g.quaternion.copy(q).multiply(qy).multiply(qt);
    // 竖放的东西倒着时绕 z 转了 tilt，埋深按高度算
    const hh = it.model.info.upright && it.tilt > 0.8 ? it.r * 0.8 : it.h;
    g.position.set(it.x, it.y - it.bury * hh + 0.02, it.z);
    it.restPos = g.position.clone();
  }

  // 半埋的东西四周有一圈拱起来的泥
  makeMound(it) {
    const rnd = mulberry32(Math.floor(it.seed * 1000));
    const geo = new THREE.CircleGeometry(it.r * 1.25, 14, 0, Math.PI * 2);
    geo.rotateX(-Math.PI / 2);
    const p = geo.attributes.position;
    const cols = [];
    const shallow = it.y > -7;
    let peak = 0;
    const base = shallow ? [0.8, 0.72, 0.55] : [0.46, 0.42, 0.34];
    // 泥包贴着海底拱起来（坡上的不一头悬空、一头插进坡里）；斜插在坡上的东西（给了 moundAt：沿东西的长边挪多少米）
    // 泥包挪到埋下去的那一头。舱里的照旧是东西底下平的一圈（舱底是平的）
    const fit = !it.inHold;
    const co = Math.cos(it.rot), si = Math.sin(it.rot);
    const mx = it.x + co * it.moundAt, mz = it.z - si * it.moundAt;
    const my = fit ? seabedY(mx, mz) : it.y;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), z = p.getZ(i);
      const d = Math.hypot(x, z) / (it.r * 1.25);
      // 泥包最高不过东西露出泥面那截的三成（扁的东西——顺坡躺着的木板——不被自己的泥包盖住）
      const h = Math.max(0, 1 - d) * Math.min(0.12 * (0.7 + rnd() * 0.6) * it.bury * 2, MOUND_CAP * it.h * (1 - it.bury));
      // 贴着坡拱起来：坡上的泥包不悬空、不插进坡里
      const lx = x * 1.2, lz = z * 0.8;
      p.setY(i, h + (fit ? seabedY(mx + co * lx + si * lz, mz - si * lx + co * lz) - my : 0));
      if (i === 0) peak = h;
      const k = 0.9 + rnd() * 0.15;
      cols.push(base[0] * k, base[1] * k, base[2] * k);
    }
    geo.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
    geo.computeVertexNormals();
    const m = new THREE.Mesh(geo, this.moundMat);
    m.position.set(mx, my + 0.01, mz);
    m.scale.set(1.2, 1, 0.8);
    m.rotation.y = it.rot;
    // 泥包是个锥：中间最高、边上贴地。「看得见」要算东西露出泥包多少（sight.js）
    m.userData.peak = peak;
    m.userData.fit = fit;
    m.userData.R = it.r * 1.25;
    this.group.add(m);
    return m;
  }

  // 被取走：留下压痕（暗色的坑）
  removeFromSeabed(it) {
    if (it.mound) { this.group.remove(it.mound); it.mound = null; }
    it.state = 'net';
    this.addImprint(it.x, it.y, it.z, it.r * 0.9, it.rot, it.inHold);
  }

  addImprint(x, y, z, r, rot, inHold) {
    const geo = new THREE.CircleGeometry(r, 12);
    geo.rotateX(-Math.PI / 2);
    const cols = [];
    const p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const d = Math.hypot(p.getX(i), p.getZ(i)) / r;
      p.setY(i, -0.04 * (1 - d));
      const k = 0.62 + d * 0.25;
      cols.push(0.42 * k, 0.37 * k, 0.29 * k);
    }
    geo.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
    geo.computeVertexNormals();
    const m = new THREE.Mesh(geo, this.scarMat);
    m.position.set(x, y + 0.03, z);
    m.rotation.y = rot;
    m.scale.set(1.3, 1, 0.75);
    m.renderOrder = 1;
    this.decals.add(m);
  }

  // 网痕：一圈被网架压出来的沟和中间翻起的泥
  addScar(x, z, R, surfaceFn) {
    const segs = 36;
    const pos = [], cols = [], idx = [];
    for (let i = 0; i <= segs; i++) {
      const a = (i / segs) * Math.PI * 2;
      for (const [rr, dy, c] of [[R - 0.18, 0.02, 0.62], [R, -0.03, 0.5], [R + 0.16, 0.03, 0.66]]) {
        const px = x + Math.cos(a) * rr, pz = z + Math.sin(a) * rr;
        const sy = surfaceFn(px, pz);
        pos.push(px, sy + 0.035 + dy, pz);
        cols.push(0.5 * c * 1.1, 0.45 * c * 1.1, 0.35 * c * 1.1);
      }
    }
    for (let i = 0; i < segs; i++) {
      for (let k = 0; k < 2; k++) {
        const a = i * 3 + k, b = a + 1, c = (i + 1) * 3 + k, d = c + 1;
        idx.push(a, b, c, b, d, c);
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
    geo.setIndex(idx);
    geo.computeVertexNormals();
    const m = new THREE.Mesh(geo, toon({ vertexColors: true, side: THREE.DoubleSide }));
    this.decals.add(m);
  }

  onSeabed() {
    return this.items.filter((i) => i.state === 'seabed');
  }

  // 隐藏的船材：只用于网下沉时的碰撞，不在任何界面里
  hitsHiddenTimber(x, z, R) {
    const T = HIDDEN_TIMBER;
    const dx = Math.cos(T.rot), dz = -Math.sin(T.rot);
    const ax = T.x - dx * T.len / 2, az = T.z - dz * T.len / 2;
    const bx = T.x + dx * T.len / 2, bz = T.z + dz * T.len / 2;
    const vx = bx - ax, vz = bz - az;
    const t = Math.max(0, Math.min(1, ((x - ax) * vx + (z - az) * vz) / (vx * vx + vz * vz)));
    const px = ax + vx * t, pz = az + vz * t;
    return Math.hypot(x - px, z - pz) < R + T.r;
  }
}

export { WRECK };

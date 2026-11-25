// 海域运行时：由模板生成真实现场（沉船网格、物件、线索、碰撞顶面），持有这一趟里的状态
import * as THREE from 'three';
import { regionTemplate, SHIPS } from './sites.js';
import { buildShip, weatherGeometry, TopGrid, VRayIndex, hullFrame } from './wreck.js';
import { CATALOG, buildItemGeometry, buildAttachments } from './items.js';
import { heightAt, toWorld, toLocal, TYPE_NAME, compassWord } from './layout.js';
import { worldMat, itemMat } from '../render/materials.js';
import { Builder } from '../core/geo.js';
import { RNG, hash2 } from '../core/rng.js';
import { addDebris, markGeometry, decalMaterial, addMound } from './decor.js';
import { NetImprint } from './imprint.js';
import { lerp } from '../core/noise.js';
import { makeCreature } from '../eco/creatures.js';
import { NET_R, BAG_DROP } from '../game/net.js';

let _wreckMat = null, _decorMat = null, _moundMat = null;

const MUD_BY_ATTACH = { mud: 0xa89272 };
const MOUND_BY_ATTACH = { mud: 0xc2b28c };

export class RegionRuntime {
  // 现场分步生成：build() 是生成器，每一小步之后 yield，世界按每帧的时间预算推进（不卡画面）；
  // RegionRuntime.create() 一次做完（开局时用）。两种方式结果完全相同。
  static create(world, reg) { const rt = new RegionRuntime(world, reg); for (const _ of rt.build()); return rt; }
  constructor(world, reg) {
    this.world = world;
    this.reg = reg;
    this.id = reg.id;
    this.type = reg.type;
    this.name = TYPE_NAME[reg.type];
    this.group = new THREE.Group();
    this.group.name = 'region-' + reg.id;
    this.Mreg = new THREE.Matrix4().makeTranslation(reg.cx, 0, reg.cz)
      .multiply(new THREE.Matrix4().makeRotationY(-reg.heading))
      .multiply(new THREE.Matrix4().makeScale(1, 1, reg.mirror));
    if (!_wreckMat) { _wreckMat = worldMat({ side: THREE.DoubleSide, key: 'wreck' }); _decorMat = worldMat({ key: 'decor' }); _moundMat = worldMat({ key: 'mound' }); }
    this.items = new Map();
    this.creatures = [];
    this.netMarks = [];
    this.imprints = [];
    this.netImprints = []; // 每一网的网印（B8）：网圈、配重坑、爪沟、取走东西的坑
    this.decalGroup = new THREE.Group();
    this.group.add(this.decalGroup);
  }
  *build() {
    const world = this.world;
    this.T = regionTemplate(this.reg);
    yield;
    yield* this.buildWrecks();
    this.buildDebris();
    yield;
    yield* this.buildItems();
    this.buildMarks();
    yield;
    // 水上地标（浮标、废塔、礁石）由世界在更远处先建好，船开近时不会突然冒出来
    const P = (o) => (o.rel ? this.relWorld(o.rel) : this.W(o.x, o.z));
    this.obstacles = (this.T.obstacles || []).map((o) => { const [x, z] = P(o); return { ...o, x, z }; });
    this.sites = this.T.sites.map((s) => {
      const [x, z] = P(s);
      const o = { ...s, x, z };
      // 线索链：通向哪里、往哪个方向（方位词按世界方向现算）
      if (s.to) {
        const [tx, tz] = this.W(s.to[0], s.to[1]);
        o.to = [tx, tz];
        o.dir = compassWord(tx - x, tz - z);
        o.label = s.label.replace('{dir}', o.dir); o.short = (s.short || s.label).replace('{dir}', o.dir);
      }
      return o;
    });
    this.cover = (this.T.cover || []).map((c) => { if (c.item) { const it = this.items.get(this.id + ':' + c.item); if (it) return { ...c, x: it.x, z: it.z }; } const [x, z] = P(c); return { ...c, x, z }; });
    yield;
    for (const c of this.T.creatures) { const cr = makeCreature(this.resolveCreature(c), this, world); if (cr) this.creatures.push(cr); yield; }
  }
  // 相对沉船的位置：rel = { ship, s, side, out, along, v } → 世界 [x, z]
  relWorld(rel) {
    const w = this.wrecks.find((q) => q.id === rel.ship) || this.wrecks[0];
    const F = w.frame;
    const s = Math.max(0, Math.min(1, rel.s));
    const side = rel.side || 0;
    const p = F.pt(s, rel.v ?? 0.35, side || 1);
    if (!side) p.x = 0;
    const local = new THREE.Vector3(p.x, p.y, p.z + (rel.along || 0) + (rel.s < 0 ? rel.s * w.P.L : rel.s > 1 ? (rel.s - 1) * w.P.L : 0));
    const keel = new THREE.Vector3(0, p.y, local.z);
    const a = local.clone().applyMatrix4(w.M), k = keel.clone().applyMatrix4(w.M);
    let nx = a.x - k.x, nz = a.z - k.z; const L = Math.hypot(nx, nz) || 1; nx /= L; nz /= L;
    let x = a.x + nx * (rel.out || 0), z = a.z + nz * (rel.out || 0);
    // 不要落在船体顶面上：沿外法线推出去
    for (let i = 0; i < 12 && rel.clear !== false && this.surfaceKindAt(x, z) === 'hull'; i++) { x += nx * 0.5; z += nz * 0.5; }
    return [x, z];
  }
  resolveCreature(c) {
    const loc = (r) => { const [x, z] = this.relWorld(r); return toLocal(this.reg, x, z); };
    const out = { ...c };
    if (c.shelterRel) out.shelter = loc(c.shelterRel);
    if (c.routeRel) out.route = c.routeRel.map((r) => { const [x, z] = loc(r); return { x, z, dwell: r.dwell, dig: r.dig }; });
    if (c.nestRel) out.nest = loc(c.nestRel);
    if (c.homeRel) out.home = loc(c.homeRel);
    if (c.pathRel) out.path = c.pathRel.map(loc);
    // 会拨开某件埋藏物的生物：觅食点就是那件东西的真实位置
    if (c.dig && c.route) { const it = this.items.get(this.id + ':' + c.dig.item); if (it) { out.route = c.route.slice(); out.route[c.dig.at] = toLocal(this.reg, it.x, it.z); } }
    if (c.routeRel) out.route = out.route.map((p) => { if (!p.dig) return p; const it = this.items.get(this.id + ':' + p.dig); if (!it) return p; const [x, z] = toLocal(this.reg, it.x, it.z); return { ...p, x, z }; });
    return out;
  }
  W(lx, lz) { return toWorld(this.reg, lx, lz); }
  worldYaw(localYaw) { return (this.reg.mirror < 0 ? Math.PI - localYaw : localYaw) - this.reg.heading; }

  // —— 沉船 ——
  *buildWrecks() {
    this.wrecks = [];
    let minX = 1e9, minZ = 1e9, maxX = -1e9, maxZ = -1e9;
    const pieces = [];
    for (const w of this.T.wrecks) {
      const P = { ...SHIPS[w.ship], ...w.params, seed: w.seed + this.reg.idx * 7 };
      const { geo, meta, frame } = buildShip(P);
      yield;
      const p = w.pose;
      const Mpose = new THREE.Matrix4().makeTranslation(p.x, 0, p.z + (p.dz || 0))
        .multiply(new THREE.Matrix4().makeRotationY(p.yaw))
        .multiply(new THREE.Matrix4().makeRotationX(p.pitch || 0))
        .multiply(new THREE.Matrix4().makeRotationZ(p.roll || 0));
      const Mw = this.Mreg.clone().multiply(Mpose);
      geo.applyMatrix4(Mw);
      if (this.reg.mirror < 0) flipWinding(geo);
      // 下沉：让船体以合理姿态嵌入沙泥
      const pos = geo.attributes.position;
      let off;
      if (p.embedAt != null) {
        const kp = new THREE.Vector3(0, frame.keelY(p.embedAt), (p.embedAt - 0.5) * P.L).applyMatrix4(Mw);
        off = heightAt(kp.x, kp.z) - p.embed - kp.y;
      } else {
        const diffs = [];
        for (let i = 0; i < pos.count; i += 5) diffs.push(pos.getY(i) - heightAt(pos.getX(i), pos.getZ(i)));
        diffs.sort((a, b) => a - b);
        off = -diffs[Math.floor(diffs.length * 0.03)] - (p.embed || 0.5);
      }
      geo.translate(0, off, 0);
      geo.computeVertexNormals();
      yield;
      weatherGeometry(geo, w.weather || {}, null);
      const mesh = new THREE.Mesh(geo, _wreckMat);
      mesh.castShadow = true; mesh.receiveShadow = true;
      mesh.name = 'wreck-' + w.id;
      this.group.add(mesh);
      const Mfinal = new THREE.Matrix4().makeTranslation(0, off, 0).multiply(Mw);
      geo.computeBoundingBox();
      const rec = { id: w.id, mesh, frame, P, M: Mfinal, meta, vray: new VRayIndex(geo) };
      this.wrecks.push(rec);
      yield* rec.vray.build();
      const bb = geo.boundingBox;
      minX = Math.min(minX, bb.min.x); minZ = Math.min(minZ, bb.min.z); maxX = Math.max(maxX, bb.max.x); maxZ = Math.max(maxZ, bb.max.z);
      pieces.push(geo);
      // 附带构件（断桅等）
      for (const part of w.parts || []) this.T.debris.push({ ...part });
    }
    // 碎件也要进栅格，先放宽范围
    // （不进栅格的薄件——船板——不必把栅格撑大）
    for (const d of this.T.debris) { if (d.rel || d.kind === 'plank') continue; const [x, z] = this.W(d.x, d.z); minX = Math.min(minX, x - 6); maxX = Math.max(maxX, x + 6); minZ = Math.min(minZ, z - 6); maxZ = Math.max(maxZ, z + 6); }
    if (minX > maxX) { const c = this.W(0, 0); minX = c[0] - 2; maxX = c[0] + 2; minZ = c[1] - 2; maxZ = c[1] + 2; }
    this.grid = new TopGrid(minX - 8, minZ - 8, maxX + 8, maxZ + 8, 0.25);
    for (const g of pieces) yield* this.grid.addGeometrySteps(g);
    this.wreckMeshes = this.wrecks.map((w) => w.mesh);
  }

  buildDebris() {
    const b = new Builder();
    const solid = new Builder();
    const rng = new RNG(hash2(this.world.seed, 300 + this.reg.idx));
    const surf = (x, z) => this.surfaceTop(x, z, true);
    for (const d of this.T.debris) {
      const [x, z] = d.rel ? this.relWorld(d.rel) : this.W(d.x, d.z);
      const dd = { ...d, x, z, yaw: this.worldYaw(d.yaw || 0) };
      const isSolid = addDebris(b, dd, surf, rng);
      if (isSolid) addDebris(solid, dd, surf, new RNG(1));
    }
    if (b.count) {
      const g = b.build();
      const m = new THREE.Mesh(g, _decorMat); m.castShadow = true; m.receiveShadow = true; this.group.add(m);
    }
    if (solid.count) this.grid.addGeometry(solid.build());
  }

  // 地面与沉船顶面（网口触底、物件放置）
  surfaceTop(x, z, terrainOnlyFallback) {
    const t = heightAt(x, z);
    const g = this.grid ? this.grid.at(x, z) : -1e9;
    return g > t ? g : t;
  }
  surfaceKindAt(x, z) {
    const t = heightAt(x, z);
    const g = this.grid ? this.grid.at(x, z) : -1e9;
    if (g > t + 0.15) return 'hull';
    return null;
  }

  // 沉船内的落点：从上往下射线，取目标点之下最近的面
  placeInWreck(wid, X, Z, targetY, layer) {
    const w = this.wrecks.find((q) => q.id === wid);
    const hits = w.vray.hits(X, Z, targetY - 60, targetY + 40);
    let best = null;
    for (const y of hits) { if (y <= targetY + 0.5) { best = y; break; } }
    const firstY = hits.length ? hits[0] : -1e9;
    const y = best != null ? best : heightAt(X, Z);
    return { y: Math.max(y, heightAt(X, Z)), firstY };
  }

  // 在沉船里找“网口完整落在同一层”的位置（候选点越靠近设计位置越好）
  *findClearSpot(wid, x0, z0, targetY, maxR, near) {
    const footT = (cx, cz) => {
      let T = this.surfaceTop(cx, cz);
      for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2; for (const rr of [NET_R * 0.55, NET_R * 0.97]) T = Math.max(T, this.surfaceTop(cx + Math.cos(a) * rr, cz + Math.sin(a) * rr)); }
      return T;
    };
    let best = null, bd = 1e9, n = 0;
    for (let dz = -maxR; dz <= maxR + 1e-6; dz += 0.25) for (let dx = -maxR; dx <= maxR + 1e-6; dx += 0.25) {
      const d = Math.hypot(dx, dz);
      if (d > maxR || d >= bd) continue;
      if (++n % 24 === 0) yield;
      const x = x0 + dx, z = z0 + dz;
      const floor = this.placeInWreck(wid, x, z, targetY + 1.5, 'hold').y;
      if (floor < targetY - 3) continue;
      if (this.surfaceTop(x, z) > floor + 0.15) continue; // 正上方有遮挡
      if (near) {
        const dn = Math.hypot(x - near.x, z - near.z);
        if (dn < 0.55 || dn > 1.2) continue;
        const T = footT((x + near.x) / 2, (z + near.z) / 2);
        if (T > Math.min(floor, near.baseY) + BAG_DROP - 0.1) continue;
      } else if (footT(x, z) > floor + BAG_DROP - 0.1) continue;
      bd = d; best = { x, z, y: floor };
    }
    return best;
  }

  // 开阔落点：网口罩在这里时，触底面就是这里的地面（不被船体或高处托住）
  findOpenSpot(x0, z0, maxR) {
    const ok = (x, z) => {
      const f = this.surfaceTop(x, z);
      if (this.surfaceKindAt(x, z) === 'hull' || f > -1.8) return false;
      let T = f;
      for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; for (const rr of [NET_R * 0.55, NET_R * 0.97]) T = Math.max(T, this.surfaceTop(x + Math.cos(a) * rr, z + Math.sin(a) * rr)); }
      return T <= f + BAG_DROP - 0.2;
    };
    if (ok(x0, z0)) return [x0, z0];
    for (let r = 0.5; r <= maxR; r += 0.5) for (let k = 0; k < 16; k++) { const a = k / 16 * Math.PI * 2; const x = x0 + Math.cos(a) * r, z = z0 + Math.sin(a) * r; if (ok(x, z)) return [x, z]; }
    return null;
  }

  // 两件同网：找一个网口中心，两侧各有一处能放下且都在包络内的落点
  *findPairSpot(wid, x0, z0, targetY, maxR) {
    const footT = (cx, cz) => {
      let T = this.surfaceTop(cx, cz);
      for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2; for (const rr of [NET_R * 0.55, NET_R * 0.97]) T = Math.max(T, this.surfaceTop(cx + Math.cos(a) * rr, cz + Math.sin(a) * rr)); }
      return T;
    };
    const spot = (x, z) => { const f = this.placeInWreck(wid, x, z, targetY + 1.5, 'hold').y; return this.surfaceTop(x, z) > f + 0.15 ? null : f; };
    let best = null, bd = 1e9, n = 0;
    for (let dz = -maxR; dz <= maxR + 1e-6; dz += 0.25) for (let dx = -maxR; dx <= maxR + 1e-6; dx += 0.25) {
      const d = Math.hypot(dx, dz);
      if (d > maxR || d >= bd) continue;
      if (++n % 12 === 0) yield;
      const cx = x0 + dx, cz = z0 + dz;
      const T = footT(cx, cz);
      for (let k = 0; k < 8; k++) {
        const a = k / 8 * Math.PI;
        const ax = cx + Math.cos(a) * 0.5, az = cz + Math.sin(a) * 0.5, bx = cx - Math.cos(a) * 0.5, bz = cz - Math.sin(a) * 0.5;
        const fa = spot(ax, az), fb = spot(bx, bz);
        if (fa == null || fb == null) continue;
        if (fa < T - BAG_DROP + 0.1 || fb < T - BAG_DROP + 0.1 || fa < targetY - 3 || fb < targetY - 3) continue;
        bd = d; best = [{ x: ax, z: az, y: fa }, { x: bx, z: bz, y: fb }];
        break;
      }
    }
    return best;
  }

  // —— 物件 ——
  *buildItems() {
    const rng = new RNG(hash2(this.world.seed, 500 + this.reg.idx));
    for (const spec of this.T.items) {
      const def = CATALOG[spec.key];
      if (!def) continue;
      let x, z, y, burial = spec.burial || 0, onHull = false;
      if (spec.rel) {
        [x, z] = this.relWorld(spec.rel);
        const c = this.findOpenSpot(x, z, 4.5);
        if (c) { x = c[0]; z = c[1]; } else this.warnings = (this.warnings || []).concat(spec.id + ' 附近找不到开阔落点');
        y = this.surfaceTop(x, z);
        onHull = this.surfaceKindAt(x, z) === 'hull';
      } else if (spec.ship) {
        const w = this.wrecks.find((q) => q.id === spec.ship);
        const F = w.frame;
        let lp;
        if (spec.side) {
          // 落在某一舷的内壳上（倾覆后货物滑向低舷）
          const pr = F.pt(spec.s, spec.v ?? 0.4, spec.side);
          lp = new THREE.Vector3(pr.x - spec.side * (spec.inward ?? 0.4), pr.y + 0.35, pr.z).applyMatrix4(w.M);
        } else {
          const pr = F.pt(spec.s, spec.v ?? 0.15, 1);
          const lx = lerp(-pr.x, pr.x, spec.u ?? 0.5);
          lp = new THREE.Vector3(lx, pr.y, (spec.s - 0.5) * w.P.L).applyMatrix4(w.M);
        }
        x = lp.x; z = lp.z;
        const pl = this.placeInWreck(spec.ship, x, z, lp.y, spec.layer);
        y = pl.y; onHull = true;
        burial = spec.burial ?? 0.08;
        if (spec.layer === 'hold') {
          // 设计上应当能从破口垂直取到：在附近找一个网口能完整落下的位置
          let c = null;
          if (this._pairPos && this._pairPos[spec.id]) c = this._pairPos[spec.id];
          else if (spec.pairWith) {
            const pr = yield* this.findPairSpot(spec.ship, x, z, lp.y, 2.8);
            if (pr) { c = pr[0]; (this._pairPos = this._pairPos || {})[spec.pairWith] = pr[1]; }
          } else c = yield* this.findClearSpot(spec.ship, x, z, lp.y, 2.6, null);
          if (c) { x = c.x; z = c.z; y = c.y; }
          else this.warnings = (this.warnings || []).concat(spec.id + ' 没有可垂直取到的位置');
        }
      } else {
        [x, z] = this.W(spec.x, spec.z);
        y = this.surfaceTop(x, z);
        onHull = this.surfaceKindAt(x, z) === 'hull';
      }
      const it = {
        id: spec.id, key: spec.key, def, spec,
        name: spec.silver ? def.preciousName : def.name,
        value: spec.silver ? def.preciousValue : def.value,
        desc: spec.silver ? def.preciousDesc : def.desc,
        precious: !!(def.precious || spec.silver),
        silver: !!spec.silver,
        sealed: !!spec.sealed, natural: !!spec.natural,
        attach: spec.attach || 'mud',
        x, z, baseY: y, burial, rotY: this.worldYaw(spec.rotY || 0), tilt: spec.tilt || 0,
        onHull, state: 'seabed', region: this.id, seed: hash2(this.world.seed, hashId(spec.id)),
        vs: Math.max(1, Math.min(def.carry ? 2.1 : 1.5, 0.42 / def.r)),
        nest: spec.nest ? this.id + ':' + spec.nest : null, coverGrass: !!spec.coverGrass,
      };
      it.r = def.r * it.vs; it.h = def.h * it.vs;
      this.makeItemMesh(it);
      this.items.set(it.id, it);
      yield;
    }
  }
  makeItemMesh(it) {
    const g = new THREE.Group();
    const geo = buildItemGeometry(it.key, it.seed, {});
    if (it.vs !== 1) geo.scale(it.vs, it.vs, it.vs);
    const mat = itemMat(0.6, MUD_BY_ATTACH[it.attach] || 0x55462f);
    const body = new THREE.Mesh(geo, mat);
    body.castShadow = true; body.receiveShadow = true;
    g.add(body);
    const att = new THREE.Mesh(buildAttachments(geo, it.seed), _decorMat);
    att.castShadow = false;
    g.add(att);
    it.mesh = g; it.body = body; it.attachMesh = att;
    // 埋藏泥丘
    if (!it.onHull && it.burial > 0.3) {
      const mb = new Builder();
      addMound(mb, 0, 0, it.r * 1.1 + 0.12, () => 0, MOUND_BY_ATTACH[it.attach] || 0xc2b28c);
      const mound = new THREE.Mesh(mb.build(), _moundMat);
      mound.receiveShadow = true;
      it.mound = mound;
      this.group.add(mound);
    }
    this.placeItemMesh(it);
    this.group.add(g);
  }
  placeItemMesh(it) {
    const h = it.h;
    const g = it.mesh;
    g.position.set(it.x, it.baseY - it.burial * h * 1.05 + 0.01, it.z);
    g.rotation.set(0, it.rotY, 0);
    if (it.tilt) g.rotateX(it.tilt * 0.25);
    const dirt = Math.min(0.9, 0.36 + it.burial * 0.42);
    it.body.material.userData.u.uDirt.value = dirt;
    it.dirt = dirt;
    if (it.mound) {
      // 泥丘只围住埋着的部分：露出的硬边必须高过泥面
      const R0 = it.r * 1.1 + 0.12, moundH = 0.3 * R0;
      const exposed = Math.max(0.03, it.h * (1 - it.burial * 1.05));
      const s = 0.75 + it.burial * 0.5;
      const vy = Math.min(1.2, (it.burial > 0.75 ? 0.9 : 0.45) * Math.max(exposed, 0.12) / moundH);
      // 顺海流方向的一侧堆得多一点（泥脊）
      it.mound.position.set(it.x - 0.12 * R0, heightAt(it.x, it.z), it.z - 0.06 * R0);
      it.mound.scale.set(s * 1.25, vy, s);
      it.mound.rotation.y = 0.4;
      it.mound.visible = it.state === 'seabed';
    }
  }
  // 物件身上的可见状态（埋深变化：蟹翻泥、拿走旁边的东西）
  setBurial(it, b) { it.burial = b; this.placeItemMesh(it); }

  itemsNear(x, z, r) {
    const out = [];
    for (const it of this.items.values()) if (it.state === 'seabed' && Math.hypot(it.x - x, it.z - z) < r + it.r) out.push(it);
    return out;
  }

  // —— 线索痕迹 ——
  buildMarks() {
    for (const m of this.T.marks || []) {
      const mm = { ...m };
      if (m.relA) { [mm.ax, mm.az] = this.relWorld(m.relA); [mm.bx, mm.bz] = this.relWorld(m.relB); }
      else if (m.ax != null) { [mm.ax, mm.az] = this.W(m.ax, m.az); [mm.bx, mm.bz] = this.W(m.bx, m.bz); }
      if (m.x != null) [mm.x, mm.z] = this.W(m.x, m.z);
      this.addDecal(mm);
    }
  }
  addDecal(m) {
    const surf = (x, z) => this.surfaceTop(x, z);
    const g = markGeometry(m, surf);
    if (!g) return null;
    const mesh = new THREE.Mesh(g, decalMaterial());
    mesh.receiveShadow = true;
    mesh.renderOrder = 2;
    this.decalGroup.add(mesh);
    return mesh;
  }
  // 网印（B8）：触底时建好、藏着，提网时显出来；hull：落在沉船的板上（只是一层蹭开的淤泥，淡一些）
  addNetMark(x, z, r, hull = false) {
    this.netMarks.push({ x, z, r });
    const im = new NetImprint(this.decalGroup, x, z, r, (px, pz) => this.surfaceTop(px, pz), hull);
    this.netImprints.push(im);
    return im;
  }
  // 取走的东西留一个坑：落在哪一网的网印里就挖在那一网的印子上
  addImprint(x, z, r) {
    this.imprints.push({ x, z, r });
    for (let i = this.netImprints.length - 1; i >= 0; i--) if (this.netImprints[i].covers(x, z) && this.netImprints[i].addPit(x, z, r)) return;
    this.addDecal({ kind: 'imprint', x, z, r });
  }

}

function hashId(s) { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return h; }
function flipWinding(geo) {
  const p = geo.attributes.position, c = geo.attributes.color;
  for (let i = 0; i < p.count; i += 3) {
    for (const a of [p, c]) {
      if (!a) continue;
      const x = a.getX(i + 1), y = a.getY(i + 1), z = a.getZ(i + 1);
      a.setXYZ(i + 1, a.getX(i + 2), a.getY(i + 2), a.getZ(i + 2));
      a.setXYZ(i + 2, x, y, z);
    }
  }
}

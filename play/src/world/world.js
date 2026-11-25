// 世界：归潮沙湾一片海、它的现场、出发港口的码头景、地形块与植被
import { tag } from '../core/perf.js';
import * as THREE from 'three';
import { TerrainManager, CHUNK } from './terrain.js';
import { RegionRuntime } from './region.js';
import { regionTemplate } from './sites.js';
import { getRegion, heightAt, REGION_R, toWorld, HOME } from './layout.js';
import { decorateChunk, decorateChunkSteps } from './flora.js';
import { buildPort, buildLandmark } from './decor.js';
import { worldMat } from '../render/materials.js';
import { RNG, hash2 } from '../core/rng.js';

export class World {
  constructor(scene, seed) {
    this.scene = scene;
    this.seed = seed;
    this.regions = new Map();
    this.landmarks = [];
    this.terrain = new TerrainManager(scene);
    this.terrain.onChunk = (cx, cz, ch) => {
      const extras = decorateChunk(cx, cz, ch, this);
      for (const e of extras) { this.scene.add(e); ch.extras.push(e); }
    };
    const world = this;
    this.terrain.chunkExtras = function* (cx, cz, ch) { return yield* decorateChunkSteps(cx, cz, ch, world); };
    this.root = new THREE.Group();
    this.root.name = 'world';
    scene.add(this.root);
    this.portMat = worldMat({ key: 'port' });
    this.jobs = new Map();       // 排队中的生成工作（分帧做完）
    this.prepareRender = null;   // 新现场显示前的着色器准备（由游戏注入）
    this.lmDone = false;         // 水上地标（比海域现场更早、在更远处建好）
    this.homeMesh = null;        // 出发港口的码头（只是景）
  }
  // 焦点附近：登记要生成的海域、码头与地形块。budget ≥ 20 时当场做完（开局，画面在淡入淡出之下）；
  // 平时只排队，由 service() 每帧按时间预算一点点做，船开着画面也不顿。海域先于附近地形块完成，保证植被避开船体。
  update(fx, fz, budget = 2) {
    const sync = budget >= 20;
    // 焦点没怎么动就不必重新盘点（每个小步都调用；省下的是每帧成百个临时数组）
    if (!sync && this.lastScan && Math.abs(fx - this.lastScan[0]) + Math.abs(fz - this.lastScan[1]) < 3) return this.terrain.want.length;
    this.lastScan = [fx, fz];
    const d = getRegion();
    if (!this.regions.has(0) && !this.jobs.has('r0') && Math.hypot(d.cx - fx, d.cz - fz) < 420) {
      if (sync) this.createRegion();
      else this.queueRegion();
    }
    // 水上地标：船前后 950 米内的先建好（远处有雾，不会在眼前突然出现）
    if (!this.lmDone && !this.jobs.has('l0') && Math.abs(d.cx - fx) <= 950) {
      if (sync) this.addLandmarks();
      else this.jobs.set('l0', { x: d.cx, z: d.cz, gen: (function* (w) { yield; w.addLandmarks(); })(this) });
    }
    if (!this.homeMesh && !this.jobs.has('home') && Math.hypot(HOME.x - fx, HOME.z - fz) < 700) {
      if (sync) this.addHomeMesh();
      else this.jobs.set('home', { x: HOME.x, z: HOME.z, gen: (function* (w) { yield; w.addHomeMesh(); })(this) });
    }
    for (const r of this.regions.values()) r.group.visible = !!r.ready && Math.hypot(r.reg.cx - fx, r.reg.cz - fz) < 520;
    return this.terrain.update(fx, fz, sync ? budget : 0);
  }
  addLandmarks() {
    const reg = getRegion();
    const T = regionTemplate(reg);
    const rng = new RNG(hash2(this.seed, 700 + reg.idx));
    const ms = [];
    for (const lm of T.landmarks || []) {
      const [x, z] = toWorld(reg, lm.x, lm.z);
      const m = new THREE.Mesh(buildLandmark({ ...lm, x, z }, rng), this.portMat);
      m.position.set(x, 0, z);
      m.castShadow = true; m.receiveShadow = true;
      m.userData.landmark = lm;
      this.root.add(m); ms.push(m);
      this.addLandmark({ ...lm, x, z, region: reg.id });
    }
    this.lmDone = true;
  }
  addHomeMesh() {
    const m = new THREE.Mesh(buildPort(HOME, new RNG(hash2(this.seed, HOME.x | 0))), this.portMat);
    m.position.set(HOME.x, 0, HOME.z); m.castShadow = true; m.receiveShadow = true;
    this.root.add(m); this.homeMesh = m;
  }
  queueRegion() {
    const rt = new RegionRuntime(this, getRegion());
    const w = this;
    this.jobs.set('r0', { x: rt.reg.cx, z: rt.reg.cz, region: true, gen: (function* () { yield* rt.build(); w.addRegion(rt); })() });
  }
  createRegion() {
    const rt = RegionRuntime.create(this, getRegion());
    this.addRegion(rt);
    rt.ready = true;
    return rt;
  }
  addRegion(rt) {
    this.regions.set(0, rt);
    this.root.add(rt.group);
    // 新现场先在后台把着色器编好，再显示（第一次出现的生物、器物不会让画面卡一下）
    if (!rt.ready) {
      rt.group.visible = false;
      const p = this.prepareRender ? this.prepareRender(rt.group) : null;
      if (p && p.then) p.then(() => { rt.ready = true; }, () => { rt.ready = true; }); else rt.ready = true;
    }
  }
  // 每帧推进排队的生成工作，最多用 ms 毫秒；地形块按离焦点由近到远，海域工作先于与它重叠的地形块
  service(fx, fz, ms = 3) {
    const t0 = performance.now();
    let guard = 0;
    while (performance.now() - t0 < ms && guard++ < 4000) {
      let job = null, jd = 1e9, key = null;
      for (const [k, j] of this.jobs) { const d = Math.hypot(j.x - fx, j.z - fz); if (d < jd) { jd = d; job = j; key = k; } }
      const ch = this.terrain.nextJob(fx, fz, (x, z) => this.regionPendingNear(x, z));
      // 地形块与海域/码头轮流推进，谁也不会被饿着
      this.turn = !this.turn;
      if (ch && (!job || this.turn)) { if (ch.step()) tag('chunk'); continue; }
      if (!job) break;
      if (job.gen.next().done) { this.jobs.delete(key); tag('job:' + key); }
    }
  }
  regionPendingNear(x, z) {
    for (const j of this.jobs.values()) if (j.region && Math.abs(j.x - x) < 200 && Math.abs(j.z - z) < 200) return true;
    return false;
  }
  get busy() { return this.jobs.size > 0 || this.terrain.pending() > 0; }
  addLandmark(lm) { if (!this.landmarks.find((l) => l.x === lm.x && l.z === lm.z)) this.landmarks.push(lm); }
  regionAt(x, z, maxD = REGION_R) {
    let best = null, bd = maxD;
    for (const r of this.regions.values()) { const d = Math.hypot(r.reg.cx - x, r.reg.cz - z); if (d < bd) { bd = d; best = r; } }
    return best;
  }
  regionById(id) { for (const r of this.regions.values()) if (r.id === id) return r; return null; }
  surfaceTop(x, z) {
    let y = heightAt(x, z);
    for (const r of this.regions.values()) {
      if (Math.abs(r.reg.cx - x) > 160 || Math.abs(r.reg.cz - z) > 160) continue;
      const g = r.grid.at(x, z);
      if (g > y) y = g;
    }
    const rk = this.rockTop(x, z);
    return rk > y ? rk : y;
  }
  surfaceKind(x, z) {
    for (const r of this.regions.values()) {
      if (Math.abs(r.reg.cx - x) > 160 || Math.abs(r.reg.cz - z) > 160) continue;
      if (r.grid.at(x, z) > heightAt(x, z) + 0.15) return '船体';
    }
    if (this.rockTop(x, z) > heightAt(x, z) + 0.1) return '岩石';
    return null;
  }
  rockTop(x, z) {
    const cx = Math.floor(x / CHUNK), cz = Math.floor(z / CHUNK);
    const ch = this.terrain.chunks.get(cx + ',' + cz);
    if (!ch || !ch.extras) return -1e9;
    let top = -1e9;
    for (const e of ch.extras) {
      if (!e.isInstancedMesh || !e.userData.rocks) continue;
      for (const r of e.userData.rocks) {
        const d = Math.hypot(r[0] - x, r[2] - z);
        if (d < r[3]) { const t = r[1] + r[3] * 0.55 * Math.sqrt(1 - (d / r[3]) ** 2); if (t > top) top = t; }
      }
    }
    return top;
  }
  itemsNear(x, z, r) {
    const out = [];
    for (const rg of this.regions.values()) {
      if (Math.hypot(rg.reg.cx - x, rg.reg.cz - z) > 200 + r) continue;
      out.push(...rg.itemsNear(x, z, r));
    }
    return out;
  }
  // 埋着的硬物（网口压到会自动收回）
  obstaclesNear(x, z, r) {
    const out = [];
    for (const rg of this.regions.values()) {
      if (Math.hypot(rg.reg.cx - x, rg.reg.cz - z) > 200 + r) continue;
      for (const o of rg.obstacles || []) if (Math.hypot(o.x - x, o.z - z) < r + o.r) out.push(o);
    }
    return out;
  }
  allItems() { const out = []; for (const r of this.regions.values()) for (const it of r.items.values()) out.push(it); return out; }
  findItem(id) { for (const r of this.regions.values()) { const it = r.items.get(id); if (it) return it; } return null; }
  // 植被避让：沉船顶面、物件周围
  blockedForFlora(x, z, pad = 0.6) {
    for (const r of this.regions.values()) {
      if (Math.abs(r.reg.cx - x) > 170 || Math.abs(r.reg.cz - z) > 170) continue;
      if (r.grid.at(x, z) > heightAt(x, z) + 0.2) return true;
      for (const it of r.items.values()) if (!it.coverGrass && Math.abs(it.x - x) < 3 && Math.abs(it.z - z) < 3 && Math.hypot(it.x - x, it.z - z) < it.r + pad) return true;
    }
    return false;
  }
  coverAt(x, z) {
    for (const r of this.regions.values()) for (const c of r.cover) if (Math.hypot(c.x - x, c.z - z) < c.r) return c.density;
    return 0;
  }
}

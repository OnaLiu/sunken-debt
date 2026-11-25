// 生态调度：给每只生物一个“它此刻知道什么”的上下文——船在不在动、网在哪、这一处有没有人在看、
// 哪里刚被网翻过泥。生物自己决定做什么；这里只负责把这些“原因”交给它们，并让后果只在玩家看得见的地方发生。
import * as THREE from 'three';
import { heightAt } from '../world/layout.js';
import { sightRange } from './creatures.js';
import { Unearth } from './unearth.js';

const MUD = [0.6, 0.53, 0.4];
// 网痕成为觅食地：泥沉下去以后（约 10 秒）开始招来小生物，几分钟后就和别处一样了
const SCAR_READY = 10, SCAR_LIFE = 300;

export class EcoDirector {
  constructor(game) {
    this.g = game;
    this.frustum = new THREE.Frustum();
    this.m = new THREE.Matrix4();
    this.p = new THREE.Vector3();
    this.scars = [];        // 网翻过泥的地方 { x, z, r, t, id }
    this.scarN = 0;
    this.idleT = 0;         // 船停稳了多久
    this.ctx = this.makeCtx();
    this.unearth = new Unearth(this.ctx); // 蟹翻出东西的那一段过程（C2）
  }
  makeCtx() {
    const g = this.g, D = this;
    return {
      particles: g.particles,
      mudColor: () => MUD,
      onEvent: (type, cr, it) => g.onEcoEvent(type, cr, it),
      time: 0,
      netDown: false,
      netIn: null,
      boatIdle: 0,
      boat: g.boat,
      // 玩家此刻看不看得见这一点：在视野里、而且按水深够近；揭宝近景时镜头在甲板上，海底一律算看不见
      seen: (x, y, z) => D.seen(x, y, z),
      // 玩家会注意到这一点：按水深够近，在画面里或刚出画面边（出了边有边上的指向牌和声音告诉他在哪）
      noticed: (x, y, z) => D.noticed(x, y, z),
      // 开始翻出一件埋着的东西（过程见 unearth.js）
      unearth: (cr, it, region) => D.unearth.start(cr, it, region),
      // 让小鱼退开的东西：快速驶过的船、水里的网
      threatAt: (x, z, r) => D.threatAt(x, z, r),
      boatThreat: (x, z, r) => Math.abs(g.boat.speed) > 1.0 && Math.hypot(g.boat.x - x, g.boat.z - z) < r,
      // 附近刚被网翻过泥、已经沉下来的地方
      scarNear: (x, z, r, used) => D.scarNear(x, z, r, used),
    };
  }
  frame() {
    const cam = this.g.view.camera;
    cam.updateMatrixWorld();
    this.m.multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse);
    this.frustum.setFromProjectionMatrix(this.m);
    this.closeUp = this.g.reveal.closeUp;
  }
  seen(x, y, z) {
    if (this.closeUp) return false;
    const b = this.g.boat;
    if (Math.hypot(x - b.x, z - b.z) > sightRange(y)) return false;
    this.p.set(x, y + 0.3, z);
    return this.frustum.containsPoint(this.p);
  }
  noticed(x, y, z) {
    if (this.closeUp) return false;
    const b = this.g.boat;
    if (Math.hypot(x - b.x, z - b.z) > sightRange(y)) return false;
    this.p.set(x, y + 0.3, z).applyMatrix4(this.m);
    return this.p.z > -1 && this.p.z < 1 && Math.abs(this.p.x) < 1.7 && Math.abs(this.p.y) < 1.7;
  }
  threatAt(x, z, r) {
    const g = this.g, boat = g.boat, netIn = this.ctx.netIn;
    const sp = Math.abs(boat.speed);
    const db = Math.hypot(boat.x - x, boat.z - z);
    if (sp > 1.2 && db < r && heightAt(x, z) > -16) return [(x - boat.x) / db, (z - boat.z) / db];
    if (netIn) { const dn = Math.hypot(netIn.x - x, netIn.z - z); if (dn < 6) return [(x - netIn.x) / (dn || 1), (z - netIn.z) / (dn || 1)]; }
    return null;
  }
  // 网底沿触底：翻开的泥是一处新的觅食地
  addScar(x, z, r) {
    this.scars.push({ x, z, r, t: this.g.time, id: ++this.scarN });
    if (this.scars.length > 24) this.scars.shift();
  }
  scarNear(x, z, r, used) {
    const now = this.g.time;
    let best = null, bd = r;
    for (const s of this.scars) {
      const age = now - s.t;
      if (age < SCAR_READY || age > SCAR_LIFE || (used && used.has(s.id))) continue;
      const d = Math.hypot(s.x - x, s.z - z);
      if (d < bd) { bd = d; best = s; }
    }
    return best;
  }

  update(dt) {
    const g = this.g, boat = g.boat, ctx = this.ctx;
    this.frame();
    ctx.time = g.time;
    ctx.netIn = (g.op && g.op.y < 0) ? g.op : null;
    ctx.netDown = !!(g.op && (g.op.state === 'closing' || (g.op.state === 'lowering' && g.op.touched)));
    this.idleT = Math.abs(boat.speed) < 0.3 ? this.idleT + dt : 0;
    ctx.boatIdle = this.idleT;
    for (const r of g.world.regions.values()) {
      const d = Math.hypot(r.reg.cx - boat.x, r.reg.cz - boat.z);
      if (d > 320) continue;
      for (const c of r.creatures) c.update(dt, ctx);
    }
    this.unearth.update(dt);
  }
}

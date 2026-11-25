// 海底生态：一条清楚的因果关系。生物在玩家瞄准之前就在活动；切视角不重置；暂停才冻结。
// 会改变海底的事（翻开埋着的东西）只在玩家看得见的时候发生；没人看时它们照样走动、觅食，但不动东西。
// 蟹（停留/翻泥/躲藏/到刚下过网的泥里刨食）、鱼群（受惊成片让开、到网痕觅食、船停久了躲到船底）
import * as THREE from 'three';
import { instancedDepthMaterial } from '../render/materials.js';
import { heightAt } from '../world/layout.js';
import { RNG, hash2 } from '../core/rng.js';
import { angDiff, clamp, lerp } from '../core/noise.js';
import { CrabLook, schoolGeo, schoolMat } from './looks.js';
import { fxTag } from '../fx/tags.js';
import { UNEARTH } from './unearth.js';
import { SchoolMotion } from './schoolmove.js';
import { CrabGait } from './crabgait.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);

// 看得见这个深度的东西要多近（和脚圈、机器人用的同一条规则：水越深越要靠近）
export function sightRange(y) { return clamp(46 + y * 1.2, 14, 46); }
const seen = (ctx, x, y, z) => (ctx.seen ? ctx.seen(x, y, z) : true);
// 蟹要走之前（W6）：离走还有几秒触角开始抖；翻泥从还剩几秒开始变少、到还剩几秒停
const LEAVE_SIGN = 3.4, LEAVE_FADE = 4.4, LEAVE_STOP = 1.4;
const noticed = (ctx, x, y, z) => (ctx.noticed ? ctx.noticed(x, y, z) : seen(ctx, x, y, z));

function walkToward(o, tx, tz, speed, dt) {
  const dx = tx - o.x, dz = tz - o.z, d = Math.hypot(dx, dz);
  if (d < 0.04) return true;
  const st = Math.min(d, speed * dt);
  o.x += dx / d * st; o.z += dz / d * st;
  const th = Math.atan2(dx, dz);
  o.yaw += clamp(angDiff(o.yaw, th), -4 * dt, 4 * dt);
  return d - st < 0.04;
}

// ———————————— 蟹 ————————————
const NO_GAIT = { ox: 0, oz: 0, moving: false, pick: 0 }; // 被网压住时就画在规则位置上
export class Crab {
  constructor(spec, region, world) {
    this.spec = spec; this.region = region; this.world = world;
    this.id = spec.id; this.kind = 'crab'; this.catchable = spec.catchable !== false;
    this.name = '翻泥蟹'; this.value = 30; this.r = 0.42;
    this.desc = '在船肋和石缝之间觅食的大螯蟹，壳上长着细小的藤壶，螯上还沾着泥。';
    const [sx, sz] = region.W(spec.shelter[0], spec.shelter[1]);
    this.shelter = [sx, sz];
    this.route = spec.route.map((p) => { const [x, z] = region.W(p.x, p.z); return { x, z, dwell: p.dwell, dig: p.dig ? region.id + ':' + p.dig : null }; });
    this.x = sx; this.z = sz; this.yaw = 0;
    this.mode = 'hide'; this.leg = -1; this.t = (spec.phase || 0) % (spec.hide || 10); this.hideDur = spec.hide || 10;
    this.captured = false; this.digs = 0;
    this.tuck = 1;            // 1 = 缩在遮蔽里只露眼睛
    this.forage = null;       // 这一趟先去刨两下的网痕 { x, z, id }
    this.used = new Set();    // 去过的网痕
    this.gait = new CrabGait(); // 画出来的走走停停（A4，crabgait.js；规则里的位置不变）
    this.buildMesh();
    region.group.add(this.mesh);
  }
  buildMesh() {
    // 造型和动作在 looks.js：壳缘锯齿、斑点藤壶、分节的腿、两片钳的螯、会抖的眼柄和口器
    this.look = new CrabLook();
    const g = this.look.root;
    g.scale.setScalar(1.7);
    this.mesh = g;
  }
  position() { return V(this.x, heightAt(this.x, this.z) + 0.05, this.z); }
  inShelter() { return this.mode === 'hide' || (this.mode === 'flee' && Math.hypot(this.x - this.shelter[0], this.z - this.shelter[1]) < 0.4); }
  disturb(x, z, r) {
    if (this.captured) return;
    const hit = Math.hypot(this.x - x, this.z - z) < r;
    if (hit && this.mode !== 'hide') { this.mode = 'flee'; this.t = 0; this.kick = true; this.look.react(true, Math.atan2(x - this.x, z - this.z)); }
    else if (hit) this.look.peek(); // 缩着的时候被惊到：眼柄一下收回去
  }
  update(dt, ctx) {
    if (this.captured) return;
    if (this.trapped) { this.at = (this.at || 0) + dt * 20; this.animate(dt, true, false); if (!ctx.netDown) this.trapped = false; return; }
    this.t += dt;
    let moving = false, digging = false;
    if (this.mode === 'hide') {
      this.x = this.shelter[0]; this.z = this.shelter[1];
      // 外面不太平就不出来：船正从头顶开过
      if (ctx.boatThreat && ctx.boatThreat(this.x, this.z, 7)) this.t = Math.min(this.t, this.hideDur - 2.5);
      if (this.t > this.hideDur) {
        this.mode = 'walk'; this.leg = 0; this.t = 0;
        // 附近刚被网翻过、泥已经沉下来的地方：这一趟先绕过去刨两下
        const s = ctx.scarNear && ctx.scarNear(this.shelter[0], this.shelter[1], 11, this.used);
        if (s) {
          const dx = this.shelter[0] - s.x, dz = this.shelter[1] - s.z, L = Math.hypot(dx, dz) || 1, k = Math.min(s.r * 0.5, L);
          this.forage = { x: s.x + dx / L * k, z: s.z + dz / L * k, id: s.id };
          this.used.add(s.id);
        }
      }
    } else if (this.mode === 'walk') {
      const tgt = this.forage || (this.leg < this.route.length ? this.route[this.leg] : { x: this.shelter[0], z: this.shelter[1] });
      moving = true;
      if (walkToward(this, tgt.x, tgt.z, 0.38, dt)) {
        if (this.forage) { this.mode = 'forage'; this.t = 0; ctx.onEvent && ctx.onEvent('forage', this); }
        else if (this.leg >= this.route.length) { this.mode = 'hide'; this.t = 0; this.hideDur = this.spec.hide || 10; }
        else { this.mode = 'dwell'; this.t = 0; }
      }
    } else if (this.mode === 'forage') {
      // 刚翻过的泥里刨食：只是吃东西，不会刨出物件
      digging = this.t > 0.8 && this.t < 9 - LEAVE_STOP;
      this.digPuffs(dt, digging, 9, ctx);
      this.leaving(dt, 9, this.leg < this.route.length ? this.route[this.leg] : { x: this.shelter[0], z: this.shelter[1] }, ctx);
      if (this.t > 9) { this.forage = null; this.mode = 'walk'; this.t = 0; this.rs = 0; this.rd = 0; }
    } else if (this.mode === 'dwell') {
      // L：这一站待多久——翻出了东西（C2）就多待一会儿，等翻完再露出要走的样子（W6），两样不叠在一起
      const p = this.route[this.leg], L = p.dwell + (this.digHold || 0);
      digging = this.t > 1.5 && this.t < L - LEAVE_STOP;
      this.digPuffs(dt, digging, L, ctx);
      this.leaving(dt, L, this.leg + 1 < this.route.length ? this.route[this.leg + 1] : { x: this.shelter[0], z: this.shelter[1] }, ctx);
      // 还在刨的时候才翻得到（停了手、转身要走了就不翻）
      if (p.dig && !p.dug && this.t > 2.2 && this.t < L - LEAVE_STOP) {
        const it = this.region.items.get(p.dig);
        if (!it || it.state !== 'seabed' || it.burial <= 0.45) p.dug = true;
        else if (noticed(ctx, it.x, it.baseY, it.z)) {
          // 翻开只发生在玩家会注意到的时候（画面里，或刚出画面边——边上有指向牌和声音）：没人看时它照样刨，
          // 但要等下一趟有人看着才刨到那件东西。翻的过程（越刨越急、泥柱冲起、硬角拱出来）见 unearth.js
          ctx.unearth(this, it, this.region);
          // 翻的这 1.7 秒蟹照样使劲刨，翻完以后泥团才开始变少（W6）
          this.digHold = Math.max(this.digHold || 0, this.t + UNEARTH.end + LEAVE_FADE - p.dwell);
          p.dug = true;
        }
      }
      if (this.t > L) { this.leg++; this.mode = 'walk'; this.t = 0; this.rs = 0; this.rd = 0; this.digHold = 0; }
    } else if (this.mode === 'flee') {
      moving = true;
      if (walkToward(this, this.shelter[0], this.shelter[1], 1.3, dt)) { this.mode = 'hide'; this.t = 0; this.hideDur = 16; }
    }
    if (this.kick) { this.kick = false; ctx.particles.puff(this.x, heightAt(this.x, this.z), this.z, ctx.mudColor(this.region), 6, 0.35); }
    this.gait.update(dt, this, ctx);
    this.animate(dt, moving, digging);
  }
  // 翻泥冒的泥团：停下来的最后几秒越冒越少、越小（W6）
  digPuffs(dt, digging, L, ctx) {
    if (!digging) return;
    const k = 1 - clamp((this.t - (L - LEAVE_FADE)) / (LEAVE_FADE - LEAVE_STOP), 0, 1);
    this.digK = 0.35 + 0.65 * k;
    if (Math.random() < dt * 3 * k * k) ctx.particles.puff(this.x + Math.sin(this.yaw) * 0.25, heightAt(this.x, this.z), this.z + Math.cos(this.yaw) * 0.25, ctx.mudColor(this.region), Math.max(1, Math.round(3 * k)), 0.3 * (0.6 + 0.4 * k));
  }
  // 要走了（W6，档：轻，只在海底看得见、不加界面）：停下来的最后 LEAVE_SIGN 秒触角开始抖、越抖越急，眼柄四下张望；
  // 最后 1.1 秒身子抬起来、两螯收到身前、慢慢转向下一处，然后才走。nx/nz：接着要去哪
  leaving(dt, L, next, ctx) {
    this.rs = clamp((this.t - (L - LEAVE_SIGN)) / LEAVE_SIGN, 0, 1);
    this.rd = clamp((this.t - (L - 1.1)) / 1.1, 0, 1);
    if (this.rd > 0) { const th = Math.atan2(next.x - this.x, next.z - this.z); this.yaw += clamp(angDiff(this.yaw, th), -1.6 * dt, 1.6 * dt); }
    if (this.rs > 0 && !this.signed) {
      const y = heightAt(this.x, this.z);
      if (seen(ctx, this.x, y, this.z)) { this.signed = true; fxTag('W6', '蟹要走了：触角抖、泥团变少', 'W6'); }
    }
    if (this.rs <= 0) this.signed = false;
  }
  animate(dt, moving, digging) {
    // 躲进去时身子压进泥里、只露眼柄；出来前先把身子抬起来
    const want = this.mode === 'hide' ? 1 : 0;
    this.tuck += clamp(want - this.tuck, -dt * 2.2, dt * 2.5);
    // 画出来的位置：走走停停时落在规则位置后面一点（gait）
    const G = this.trapped ? NO_GAIT : this.gait, vx = this.x + G.ox, vz = this.z + G.oz;
    const y = heightAt(vx, vz);
    this.mesh.position.set(vx, y + 0.02 - this.tuck * 0.24, vz);
    this.mesh.rotation.y = this.yaw;
    // 横着走、翻泥时两螯交替铲、待机眼柄抖口器动螯偶尔开合；受击一缩往后跳、威吓举螯；被网压住时挣扎
    const still = this.mode === 'dwell' || this.mode === 'forage';
    if (this.mode === 'walk') moving = G.moving;
    else if (moving === false && G.moving) moving = true;
    let digK = this.digK;
    if (G.pick > 0 && !digging) { digging = true; digK = 0.45; }
    this.look.update(dt, { moving, fast: this.mode === 'flee', digging, digK, fold: this.tuck, yaw: this.yaw, trapped: !!this.trapped, restless: still ? this.rs : 0, ready: still ? this.rd : 0 });
  }
  capture() { this.captured = true; }
  takeMesh() { this.tuck = 0; this.look.reset(); this.mesh.visible = true; return this.mesh; }
  // 网里、甲板上、水槽里：腿乱蹬、螯乱夹、身子扭（只按 t 摆，不依赖别的状态）
  wriggle(m, t) { this.look.struggle(t); }
}

// ———————————— 鱼群（实例化） ————————————
// 沙湾的小鱼：蓝灰
const SCHOOL_LOOK = { h: [0.52, 0.06], s: 0.25, l: [0.36, 0.12], len: 1 };
export class School {
  constructor(spec, region, world) {
    this.spec = spec; this.region = region; this.id = spec.id; this.kind = 'school'; this.catchable = false;
    const [hx, hz] = region.W(spec.home[0], spec.home[1]);
    this.home = [hx, hz]; this.radius = spec.radius;
    this.cx = hx; this.cz = hz; this.t = (hash2(world.seed, spec.id.length * 13) % 1000) / 10;
    this.flee = 0; this.fx = 0; this.fz = 0;
    this.feed = null; this.feedT = 0; this.used = new Set(); this.lookT = 0;
    this.spread = 1.4; this.dip = 0; this.shadeK = 0;
    this.n = spec.count;
    // 每条鱼游的时候尾巴摆（顶点着色器按实例相位弯），受惊时摆得快；这一群一个材质实例，共用一个程序
    this.mat = schoolMat(); this.swim = 0;
    this.im = new THREE.InstancedMesh(schoolGeo(), this.mat, this.n);
    this.im.frustumCulled = false; this.im.castShadow = true; this.im.customDepthMaterial = instancedDepthMaterial();
    const c = new THREE.Color();
    const L = SCHOOL_LOOK;
    this.len = L.len;
    this.off = [];
    const rng = new RNG(hash2(world.seed, spec.count * 31 + region.reg.idx));
    for (let i = 0; i < this.n; i++) { this.off.push([rng.range(-1, 1), rng.range(-0.4, 0.4), rng.range(-1, 1), rng.next() * 6.28, 0.8 + rng.next() * 0.5]); c.setHSL(L.h[0] + rng.next() * L.h[1], L.s, L.l[0] + rng.next() * L.l[1]); this.im.setColorAt(i, c); }
    region.group.add(this.im);
    this.pos = this.off.map(() => new THREE.Vector3(hx, -5, hz));
    this.dummy = new THREE.Object3D();
    this.prev = [hx, hz];
    this.motion = new SchoolMotion(this); // 群里每一条怎么游：转向一道波、侧身一闪、分两股、惊散后慢慢回来（A4，schoolmove.js）
  }
  center() { return [this.cx, this.cz]; }
  // s ≥ 1（网触底那一下）：不光整群游开，每条鱼先从那一点往外一炸（约 1.4 秒），再慢慢聚回来
  disturb(x, z, r, s) { const d = Math.hypot(this.cx - x, this.cz - z); if (d < r + this.radius * 0.5) { this.flee = Math.max(this.flee, 3.5 * s); const L = d || 1; this.fx = (this.cx - x) / L; this.fz = (this.cz - z) / L; this.feed = null; if (s >= 1) { this.burst = 1; this.bx = x; this.bz = z; } } }
  update(dt, ctx) {
    this.t += dt;
    let tx = this.home[0] + Math.sin(this.t * 0.11) * this.radius * 0.7 + Math.sin(this.t * 0.27) * this.radius * 0.25;
    let tz = this.home[1] + Math.cos(this.t * 0.09) * this.radius * 0.7;
    // 威胁：船驶近、网入水
    const th = ctx.threatAt ? ctx.threatAt(this.cx, this.cz, 14) : null;
    if (th) { this.flee = Math.max(this.flee, 2.5); this.fx = th[0]; this.fz = th[1]; this.feed = null; }
    // 刚被网翻过的泥沉下来以后：成群游过去，压低身子啄食
    this.lookT -= dt;
    if (this.flee <= 0 && !this.feed && this.lookT <= 0 && ctx.scarNear) {
      this.lookT = 4;
      const s = ctx.scarNear(this.cx, this.cz, 26, this.used);
      if (s) { this.feed = s; this.feedT = 0; this.used.add(s.id); }
    }
    let wantSpread = 1.4, wantDip = 0, shade = false;
    if (this.feed) {
      this.feedT += dt;
      tx = this.feed.x + Math.sin(this.t * 0.7) * 0.8; tz = this.feed.z + Math.cos(this.t * 0.6) * 0.8;
      wantSpread = 1.0; wantDip = Math.hypot(this.cx - this.feed.x, this.cz - this.feed.z) < 3 ? 1 : 0;
      if (this.feedT > 24) this.feed = null;
    } else if (ctx.boatIdle > 10 && ctx.boat && heightAt(ctx.boat.x, ctx.boat.z) < -5 && Math.hypot(ctx.boat.x - this.home[0], ctx.boat.z - this.home[1]) < this.radius + 20) {
      // 船停久了：小鱼聚到船底的阴影里，一开船就炸开
      tx = ctx.boat.x + Math.sin(this.t * 0.5) * 1.2; tz = ctx.boat.z + Math.cos(this.t * 0.4) * 1.2;
      wantSpread = 0.9; shade = true;
    }
    // 平静的时候（不逃、不觅食、不躲船底）隔几秒整群换个方向冲一小段（A4）
    const calm = this.flee <= 0 && !this.feed && !shade;
    let sp = 0.9;
    [tx, tz, sp] = this.motion.steer(dt, tx, tz, calm, ctx);
    if (this.flee > 0) { this.flee -= dt; tx = this.cx + this.fx * 6; tz = this.cz + this.fz * 6; wantSpread = 0.7; sp = 3.2; }
    const k = 1 - Math.exp(-dt * 1.5);
    this.spread += (wantSpread - this.spread) * k; this.dip += (wantDip - this.dip) * k; this.shadeK += ((shade ? 1 : 0) - this.shadeK) * k;
    const dx = tx - this.cx, dz = tz - this.cz, d = Math.hypot(dx, dz);
    if (d > 0.01) { const st = Math.min(d, sp * dt); this.cx += dx / d * st; this.cz += dz / d * st; }
    this.swim += dt * (this.flee > 0 ? 22 : this.dip > 0.5 ? 6 : 9);
    this.mat.userData.u.uSwimT.value = this.swim; this.mat.userData.u.uSwimA.value = this.flee > 0 ? 0.05 : 0.032;
    const gy = heightAt(this.cx, this.cz);
    const baseY = lerp(gy + lerp(this.spec.depthOff, 0.5, this.dip), -2.6, this.shadeK);
    this.motion.place(dt, ctx, baseY, calm);
    if (this.burst > 0) this.burst = Math.max(0, this.burst - dt / 1.4);
    this.prev = [this.cx, this.cz];
  }
}
export function makeCreature(spec, region, world) {
  switch (spec.kind) {
    case 'crab': return new Crab(spec, region, world);
    case 'school': return new School(spec, region, world);
  }
  return null;
}

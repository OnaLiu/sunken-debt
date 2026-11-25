import * as THREE from 'three';
import { toon } from '../render/materials.js';
import { GeoBuilder } from '../util/builder.js';
import { seabedY } from '../world/terrain.js';
import { clamp, mulberry32 } from '../util/math.js';

// 小鱼群：在遮蔽附近聚散；船、网靠近时成片让开，之后慢慢回来；大轮廓经过前先散开。
const V = (x, y, z) => new THREE.Vector3(x, y, z);
// 被大轮廓惊走时往哪逃：背着深槽（槽在南边），往北偏西
const LEV_FLEE = { x: -0.29, z: -0.96 };

function fishGeo() {
  const b = new GeoBuilder();
  const C = (r, g, bb) => new THREE.Color(r, g, bb);
  // 从上往下看：背是平的一条深青（亮水面上靠它显出来），两侧斜面银白（深草床上靠它显出来、反光一整片），
  // 侧面一道金线，肚子白，头那一节暗一点（鳃盖）
  const back = C(0.36, 0.45, 0.45), flank = C(0.9, 0.92, 0.88), belly = C(0.96, 0.95, 0.88);
  const stripe = C(0.94, 0.82, 0.5), gill = C(0.74, 0.8, 0.8), fin = C(0.9, 0.72, 0.36), eye = C(0.05, 0.06, 0.07), ridge = C(0.3, 0.4, 0.42);
  // 局部 x 朝头。身子一节一节，截面是平顶平底的六边形：[x, 半高, 半宽, 中心高]
  // 身子不往后收得太细：从上面看鱼身得一直宽到尾巴根，远看才是一条完整的鱼，不是半截
  const ST = [[0.11, 0.022, 0.016, -0.002], [0.08, 0.034, 0.023, 0], [0.04, 0.041, 0.026, 0.003], [-0.01, 0.039, 0.025, 0.002], [-0.052, 0.03, 0.021, 0], [-0.085, 0.017, 0.014, 0]];
  const HEX = [[1, 0], [0.55, 1], [-0.55, 1], [-1, 0], [-0.55, -1], [0.55, -1]];
  const ring = ([x, h, w, yc]) => HEX.map(([cz, cy]) => V(x, yc + cy * h, cz * w));
  const rings = ST.map(ring);
  // 面朝外（看法线和截面中心的方向，反了就倒过来）
  const out = (a, bq, c, d, col, cy) => {
    const n = bq.clone().sub(a).cross(d.clone().sub(a)), m = a.clone().add(c).multiplyScalar(0.5);
    if (n.y * (m.y - cy) + n.z * m.z < 0) b.quad(d, c, bq, a, col);
    else b.quad(a, bq, c, d, col);
  };
  // k：0 右上斜面、1 背、2 左上斜面、3 左下斜面、4 肚子、5 右下斜面
  const faceCol = (s, k) => {
    if (k === 1) return back;
    if (k === 4) return belly;
    if (k === 0 || k === 2) return s === 0 ? gill : s === 2 || s === 3 ? stripe : flank;
    return flank;
  };
  const NS = HEX.length;
  for (let s = 0; s < rings.length - 1; s++) {
    for (let k = 0; k < NS; k++) {
      const k1 = (k + 1) % NS;
      out(rings[s][k], rings[s][k1], rings[s + 1][k1], rings[s + 1][k], faceCol(s, k), (ST[s][3] + ST[s + 1][3]) / 2);
    }
  }
  // 吻端收成一点，尾柄封口
  const tip = V(0.122, -0.003, 0), end = V(-0.085, 0, 0);
  for (let k = 0; k < NS; k++) {
    const k1 = (k + 1) % NS, col = k === 1 ? back : k === 4 ? belly : gill;
    const a = rings[0][k], c = rings[0][k1];
    if (c.clone().sub(a).cross(tip.clone().sub(a)).dot(a.clone().sub(V(0.11, 0, 0))) > 0) b.tri(a, c, tip, col); else b.tri(a, tip, c, col);
    const e0 = rings[rings.length - 1][k], e1 = rings[rings.length - 1][k1];
    if (e1.clone().sub(e0).cross(end.clone().sub(e0)).x < 0) b.tri(e0, e1, end, back); else b.tri(e0, end, e1, back);
  }
  // 眼睛：两边各一个黑点
  for (const sz of [-1, 1]) b.box(V(0.084, 0.01, sz * 0.019), V(0.007, 0, 0), V(0, 0.007, 0), V(0, 0, 0.003), eye);
  // 鳍都两面画
  const fin2 = (a, bq, c, col) => { b.tri(a, bq, c, col); b.tri(a, c, bq, col); };
  // 叉形尾：上下两片，中间凹进去；两片稍稍往两边张开一点，从上面看也是一个「V」
  fin2(V(-0.08, 0.004, 0), V(-0.168, 0.062, 0.018), V(-0.13, 0.004, 0.004), fin);
  fin2(V(-0.08, -0.004, 0), V(-0.13, -0.004, -0.004), V(-0.163, -0.054, -0.018), fin);
  // 背鳍往后掠、胸鳍往两边张、臀鳍一小片
  fin2(V(0.03, 0.043, 0), V(-0.035, 0.036, 0), V(-0.04, 0.078, 0), ridge);
  for (const sz of [-1, 1]) fin2(V(0.052, -0.012, sz * 0.02), V(0.03, -0.006, sz * 0.022), V(0.018, -0.026, sz * 0.046), fin);
  fin2(V(-0.03, -0.032, 0), V(-0.062, -0.018, 0), V(-0.066, -0.046, 0), fin);
  return b.build();
}

export class FishLife {
  constructor(g) {
    this.g = g;
    this.schools = [];
    this.mat = toon({ vertexColors: true, fish: true, spec: 0.7, shin: 30 });
    this.geo = fishGeo();
    this.m4 = new THREE.Matrix4();
    this.q = new THREE.Quaternion();
    this.e = new THREE.Euler(0, 0, 0, 'YZX');
    this.s = new THREE.Vector3();
  }

  reset() {
    for (const s of this.schools) this.g.world.scene.remove(s.mesh);
    this.schools = [];
    this.bursts = [];
    // 浅滩草床、浅滩石堆、沉船肋骨间、深槽上壁
    this.add({ x: -112, z: -36, y: -2.2, n: 26, r: 7, scale: 1.25, tint: [1, 1, 1], seed: 1 });
    this.add({ x: -84, z: -33, y: -1.8, n: 18, r: 5, scale: 1.1, tint: [1, 0.95, 0.85], seed: 2 });
    this.add({ x: 3.5, z: 9.5, y: -6.5, n: 24, r: 6, scale: 1.35, tint: [0.92, 1, 1.05], seed: 3 });
    this.add({ x: -4, z: 26, y: -12, n: 20, r: 7, scale: 1.5, tint: [0.85, 0.95, 1.05], seed: 4 });
    this.add({ x: -58, z: -20, y: -4, n: 14, r: 6, scale: 1.2, tint: [1, 1, 1], seed: 5 });
  }

  add(o) {
    const rnd = mulberry32(o.seed * 31);
    const mesh = new THREE.InstancedMesh(this.geo, this.mat, o.n);
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    mesh.frustumCulled = false;
    const col = new THREE.Color();
    const fish = [];
    for (let i = 0; i < o.n; i++) {
      const a = rnd() * Math.PI * 2, d = rnd() * o.r * 0.6;
      const p = V(o.x + Math.cos(a) * d, o.y + (rnd() - 0.5) * 1.2, o.z + Math.sin(a) * d);
      const k = 0.85 + rnd() * 0.3;
      fish.push({ p, v: V(Math.cos(a), 0, Math.sin(a)).multiplyScalar(0.6), s: o.scale * (0.8 + rnd() * 0.45), ph: rnd() * 10, lag: rnd(), ck: k });
      col.setRGB(o.tint[0] * k, o.tint[1] * k, o.tint[2] * k);
      mesh.setColorAt(i, col);
    }
    mesh.instanceColor.needsUpdate = true;
    mesh.castShadow = true;
    this.g.world.scene.add(mesh);
    this.schools.push({ ...o, mesh, fish, home: V(o.x, o.y, o.z), scatter: 0, rnd, wander: V(), wt: 0 });
  }

  update(dt, t) {
    const g = this.g;
    const threats = [];
    // 船：浅水里船身压过来，鱼让开
    const bp = g.boatCtl.pos;
    // 三种惊扰三种样子：船压过来——往两边让开；网扎下来——一下炸开、钻进草里；大轮廓——老远就整群一齐转身、闪一片银光，往同一个方向（背着深槽）冲出去
    // 开着的船是大威胁；停稳了只剩船身那一小圈，鱼散开后一条两条慢慢游回来
    const bsp = Math.abs(g.boatCtl.speed);
    threats.push({ x: bp.x, y: -1.5, z: bp.z, r: 5 + Math.min(bsp, 6) * 1.9, k: 0.5 + 0.5 * clamp(bsp / 2, 0, 1), kind: 'boat' });
    if (g.netop && g.netop.phase !== 'idle') {
      const n = g.netop.netPos;
      threats.push({ x: n.x, y: n.y - 0.6, z: n.z, r: 6, k: 1.4, kind: 'net' });
    }
    const lev = g.leviathan;
    // 大轮廓：老远（离它的头 60 米）就整群往同一个方向——背着深槽、往北偏西——成片地逃，逃得远、很久才回来。
    // 它刚出来时还在深槽底下、画面里看不见，船附近的鱼这时候就先逃了（先看到鱼逃，几秒后才看到它）
    if (lev && lev.active) threats.push({ x: lev.head.x, y: lev.head.y, z: lev.head.z, r: 60, k: 2.2, far: true, kind: 'lev', dir: LEV_FLEE });
    // 一下惊出来（第一眼看见沉船：光扫过船身，鱼从船肋里往外炸开、往上冒）：只惊一下，过后慢慢游回去
    for (const b of this.bursts) threats.push(b);
    this.bursts = this.bursts.filter((b) => (b.life -= dt) > 0);
    let maxSpeed = 0;
    for (const S of this.schools) {
      // 学校整体：有威胁时散开，否则慢慢回到遮蔽
      let alarm = 0, cause = null, levA = 0;
      for (const th of threats) {
        const d = Math.hypot(S.home.x - th.x, S.home.z - th.z);
        const a = d < th.r + S.r ? th.k * (1 - d / (th.r + S.r)) : 0;
        if (a > alarm) { alarm = a; cause = th.kind; }
        if (th.kind === 'lev') levA = a;
      }
      // 被大轮廓惊走：整群往同一个方向跑出二十几米，它走远以后很久才一点点回来
      if (levA > 0.3) { if (!S.bolt) { S.flashT = 0; S.flashDur = 5.5; S.boltT = 0; } S.bolt = 1; }
      // 从船肋里一下惊出来：也侧身闪一下银光（短一些，不带一路的闪烁）
      else if (cause === 'burst' && alarm > 0.35 && !(S.flashT < (S.flashDur || 0))) { S.flashT = 0; S.flashDur = 2.2; }
      else if (S.bolt) S.bolt = S.bolt > 0.01 ? S.bolt * Math.exp(-dt * 0.07) : 0;
      if (S.bolt) S.boltT += dt;
      const was = S.scatter;
      S.scatter = Math.max(S.scatter * Math.exp(-dt * 0.35), alarm);
      if (alarm > 0.35) S.cause = cause;
      // 一下散开（不是一直被追着）：报给游戏，出声
      if (S.scatter > 0.45 && was <= 0.45 && this.onScatter) this.onScatter(S, cause);
      if (S.swirlT > 0) S.swirlT -= dt;
      S.wt -= dt;
      if (S.wt <= 0) {
        S.wt = 2 + S.rnd() * 3;
        const a = S.rnd() * Math.PI * 2;
        S.wander.set(Math.cos(a) * S.r * 0.5, (S.rnd() - 0.5) * 0.8, Math.sin(a) * S.r * 0.5);
      }
      const goal = S.home.clone().add(S.wander);
      // 顺着坡往北、往浅处冲（离开深槽），不是往深处钻
      if (S.bolt) goal.add(V(LEV_FLEE.x * 26 * S.bolt, 3 * S.bolt, LEV_FLEE.z * 26 * S.bolt));
      // 停下来看时：一群鱼绕着草床兜一圈
      if (S.swirlT > 0) {
        const a = (S.swirlA = (S.swirlA || 0) + dt * 0.9);
        goal.set(S.home.x + Math.cos(a) * S.r * 0.75, S.home.y + Math.sin(a * 2) * 0.3, S.home.z + Math.sin(a) * S.r * 0.75);
      }
      // 中心
      const c = V();
      for (const f of S.fish) c.add(f.p);
      c.multiplyScalar(1 / S.fish.length);
      for (let i = 0; i < S.fish.length; i++) {
        const f = S.fish[i];
        const acc = V();
        // 聚：往群中心和目标
        acc.addScaledVector(c.clone().sub(f.p), 0.35);
        // 散开后一条两条慢慢游回来：每条鱼回来的早晚不一样
        const back = clamp(((1 - Math.min(1, S.scatter)) - f.lag * 0.55) / 0.45, 0, 1);
        acc.addScaledVector(goal.clone().sub(f.p), (S.swirlT > 0 ? 0.6 : 0.25) * Math.max(back, (S.bolt || 0) * 0.8));
        // 分：别挤一起
        for (let j = 0; j < S.fish.length; j += 2) {
          if (j === i) continue;
          const o = S.fish[j];
          const dx = f.p.x - o.p.x, dy = f.p.y - o.p.y, dz = f.p.z - o.p.z;
          const d2 = dx * dx + dy * dy + dz * dz;
          if (d2 < 0.25 && d2 > 1e-5) { const k = (0.25 - d2) * 6; acc.x += dx * k; acc.y += dy * k; acc.z += dz * k; }
        }
        // 避：船、网、大轮廓
        for (const th of threats) {
          const dx = f.p.x - th.x, dy = f.p.y - th.y, dz = f.p.z - th.z;
          const d = Math.hypot(dx, dz);
          const R = th.r * (th.far ? 1.2 : 0.8);
          if (d < R) {
            const k = (1 - d / R) * 9 * th.k * (th.kind === 'net' ? 1.5 : 1);
            // 大轮廓：不是四散，是一整片往同一个方向
            const ux = th.dir ? th.dir.x : dx / (d || 1), uz = th.dir ? th.dir.z : dz / (d || 1);
            acc.x += ux * k;
            acc.z += uz * k;
            // 网：钻向海底的草里；大轮廓：顺着坡往浅处冲；船：浅浅地让开
            acc.y += th.far ? 0.6 : th.kind === 'net' ? -2.2 : th.kind === 'burst' ? 1.6 : dy > 0 ? 0.5 : -0.8;
          }
        }
        // 被大轮廓惊走的头几秒：一齐往同一个方向猛冲（比船、网惊散快得多）
        if (S.bolt && S.boltT < 3.5) {
          const kb = 7 * clamp((S.boltT - f.lag * 0.35) / 0.3, 0, 1);
          acc.x += LEV_FLEE.x * kb;
          acc.z += LEV_FLEE.z * kb;
        }
        // 摆动
        acc.x += Math.sin(t * 1.3 + f.ph) * 0.3;
        acc.z += Math.cos(t * 1.1 + f.ph * 1.3) * 0.3;
        f.v.addScaledVector(acc, dt);
        const sp = f.v.length();
        const max = 1.1 + Math.max(S.scatter * 3.2, (S.bolt || 0) * 4.2);
        if (sp > max) f.v.multiplyScalar(max / sp);
        if (sp < 0.35) f.v.multiplyScalar(0.35 / Math.max(sp, 0.01));
        f.p.addScaledVector(f.v, dt);
        // 不出水、不钻地
        const floor = seabedY(f.p.x, f.p.z) + 0.45;
        if (f.p.y < floor) { f.p.y = floor; f.v.y = Math.abs(f.v.y) * 0.5; }
        if (f.p.y > -0.5) { f.p.y = -0.5; f.v.y = -Math.abs(f.v.y); }
        f.v.y *= Math.exp(-dt * 1.5);
        const yaw = Math.atan2(-f.v.z, f.v.x);
        const pitch = clamp(Math.atan2(f.v.y, Math.hypot(f.v.x, f.v.z)), -0.5, 0.5);
        this.e.set(0, yaw, pitch);
        this.q.setFromEuler(this.e);
        this.s.setScalar(f.s);
        this.m4.compose(f.p, this.q, this.s);
        S.mesh.setMatrixAt(i, this.m4);
      }
      S.mesh.instanceMatrix.needsUpdate = true;
      // 被大轮廓惊走：整群同时转身，侧身一片银光从一头闪到另一头；冲出去的一路上一条条鱼还在翻身闪光，
      // 远看是一道闪烁的银流（只有它会这样，船和网惊散都不闪）
      const fd = S.flashDur || 5.5;
      if (S.flashT !== undefined && S.flashT < fd) {
        S.flashT += dt;
        const col = this._c || (this._c = new THREE.Color());
        const tail = clamp((fd - S.flashT) / 1.5, 0, 1) * (fd < 5 ? 0.6 : 1);
        for (let i = 0; i < S.fish.length; i++) {
          const f = S.fish[i];
          const u = (S.flashT - f.lag * 0.7) / 0.5;
          const b0 = u > 0 && u < 1 ? Math.sin(u * Math.PI) : 0;
          const tw = S.flashT > 0.9 ? Math.pow(Math.max(0, Math.sin(S.flashT * 6.5 + f.ph * 2.7)), 10) * 0.8 * tail : 0;
          const b = Math.max(b0, tw);
          // 亮过白色：压得过水色，远处看是一片银光
          const k = f.ck * (1 + 3.2 * b);
          col.setRGB(S.tint[0] * k, S.tint[1] * k, S.tint[2] * k);
          S.mesh.setColorAt(i, col);
        }
        S.mesh.instanceColor.needsUpdate = true;
      }
      maxSpeed = Math.max(maxSpeed, S.scatter);
    }
    this.mat.uniforms.uFishSpeed.value = Math.min(1, maxSpeed);
  }

  // 离某处最近的一群（停下来看时挑一群兜圈）
  nearest(x, z, r) {
    let best = null, bd = r;
    for (const S of this.schools) {
      const d = Math.hypot(S.home.x - x, S.home.z - z);
      if (d < bd && S.scatter < 0.2) { bd = d; best = S; }
    }
    return best;
  }

  burst(x, y, z, r = 8, k = 1.7, dur = 1.0) {
    this.bursts.push({ x, y, z, r, k, life: dur, kind: 'burst' });
  }

  swirl(S, dur) {
    S.swirlT = dur;
    S.swirlA = Math.atan2(S.fish[0].p.z - S.home.z, S.fish[0].p.x - S.home.x);
  }

  // 给机器人和字幕用：某处的鱼群刚刚散开
  scatterNear(x, z, r) {
    return this.schools.some((s) => s.scatter > 0.5 && Math.hypot(s.home.x - x, s.home.z - z) < r);
  }
}

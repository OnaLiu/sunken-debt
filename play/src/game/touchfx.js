// 网触底（B7，标志时刻 S2）：每一网的核心手感，“轻而准”——声音和画面同一帧，从作业的大景（24 米外）也看得出。
//   预兆：网兜离底 1 米，海底压上来一块网的影子，网口下的草开始往外倒；
//   爆发：闷响（audio 'thump'，越深越低）；同一帧，网圈下一圈泥沙贴着海底翻出去、八个配重下各喷一股沙，海底一道沙浪往外推；
//   余波：鱼群一下炸开（eco 里），泥团慢慢长大、顺海流飘走、变淡；
//   余韵：草保持倒伏，网提起以后在回收和冲洗期间慢慢立回来；网印留在泥上整趟不消失（region.addNetMark，原来就有）。
//   第一网（F4，op.big）：沙浪推得更远、泥沙多一些大一些（整块按 op.big 放大）。
import * as THREE from 'three';
import { SHARED, WATER_GLSL } from '../render/materials.js';
import { NET_R } from './net.js';
import { fxTag } from '../fx/tags.js';

const RMAX = 4.4, NR = 16, NS = 56;
const RING_T = 0.95;     // 沙浪推出去的时长
const CHURN_T = 4.5;     // 翻起的那一片暗泥慢慢淡掉
const RECOVER = 11;      // 网提起后，草用这么久立回来（前 1.5 秒还趴着）

export class TouchFx {
  constructor(scene, world) {
    this.scene = scene; this.world = world;
    this.cur = null; this.slot = 0;
    this.press = [];     // 每格：{ D: uPress 那一格, s, liftT }
    for (const D of SHARED.uPress.value) D.z = 0; // 新开一趟：上一趟压倒的草立回来
  }
  // 网在水下的每一帧：网兜底离触底面还有 h 米（下沉、闭网、提起都调）
  track(op, h) {
    let C = this.cur;
    if (!C || C.op !== op) C = this.begin(op);
    C.h = h; C.tracking = true;
    // 网口下的草：离底 1 米起开始往外倒（水被网架推着先压过去）
    if (!C.hit) C.P.s = Math.max(C.P.s, 0.32 * smooth01(1 - h / 1.0));
  }
  begin(op) {
    if (this.cur) this.cur.tracking = false;
    const x = op.x, z = op.z;
    // 越深，水把这一下吃掉得越多：沙浪宽一点、亮一点，泥团大一点（4 米以内不加，16 米加满）
    const dg = Math.max(0, Math.min(1, (-op.T - 4) / 12)), k = op.big || 1;
    const geo = drape(x, z, (px, pz) => this.world.surfaceTop(px, pz), RMAX * k);
    const u = {
      uC: { value: new THREE.Vector2(x, z) }, uR: { value: NET_R },
      uShadow: { value: 0 }, uChurn: { value: 0 }, uRing: { value: NET_R }, uRingA: { value: 0 }, uGain: { value: Math.min(1, dg + (k - 1)) }, uMax: { value: RMAX * k },
    };
    const mesh = new THREE.Mesh(geo, groundMat(u));
    mesh.renderOrder = 2; mesh.frustumCulled = false;
    this.scene.add(mesh);
    // 草的压伏用两格轮流（上一网还没立好时，换一格压，不让它突然弹起）
    this.slot = (this.slot + 1) % 2;
    const D = SHARED.uPress.value[this.slot];
    D.set(x, z, 0, NET_R);
    const P = { D, s: 0, liftT: -1 };
    this.press[this.slot] = P;
    this.cur = { op, x, z, dg, k, mesh, u, h: 9, hit: false, t: 0, ringT: -1, churnT: -1, tracking: true, P };
    return this.cur;
  }
  // 触底那一帧：沙浪、泥沙一圈、配重下的沙股；草整片趴下
  hit(op, particles, color) {
    const C = this.cur && this.cur.op === op ? this.cur : this.begin(op);
    C.hit = true; C.ringT = 0; C.churnT = 0; C.P.s = 1;
    const x = C.x, z = C.z, y = op.T, K = C.k, sz = (1 + 0.6 * C.dg) * (1 + (K - 1) * 0.6), nk = (n) => Math.round(n * K);
    const dark = [color[0] * 0.66, color[1] * 0.64, color[2] * 0.62];
    // 贴着海底往外翻的一圈泥沙（同一帧就看得见：淡入只占寿命的 2%）
    for (let i = 0, n = nk(46); i < n; i++) {
      const a = (i + Math.random() * 0.6) / n * Math.PI * 2, r0 = NET_R * (0.88 + Math.random() * 0.14);
      const sp = (2.4 + Math.random() * 1.6) * K;
      particles.mud.emit(x + Math.cos(a) * r0, y + 0.08 + Math.random() * 0.18, z + Math.sin(a) * r0,
        Math.cos(a) * sp, 0.25 + Math.random() * 0.45, Math.sin(a) * sp,
        2.4 + Math.random() * 1.6, (0.5 + Math.random() * 0.35) * sz, dark[0], dark[1], dark[2], 0.85, 2.2, 1.7, 0.05, 0.02);
    }
    // 网架的八个配重各压出一股沙（短、快，给这一下一个“咔”的轮廓）
    for (let k = 0; k < 8; k++) {
      const a = k / 8 * Math.PI * 2;
      for (let j = 0, n = nk(4); j < n; j++) {
        const sp = (3.6 + Math.random() * 1.8) * K, sa = a + (Math.random() - 0.5) * 0.35;
        particles.mud.emit(x + Math.cos(a) * NET_R, y + 0.06, z + Math.sin(a) * NET_R,
          Math.cos(sa) * sp, 0.9 + Math.random() * 1.2, Math.sin(sa) * sp,
          0.7 + Math.random() * 0.4, (0.24 + Math.random() * 0.14) * sz, dark[0] * 0.9, dark[1] * 0.9, dark[2] * 0.9, 0.95, 1.2, 2.4, 1.6, 0.02);
      }
    }
    // 慢慢长大、往上翻、顺海流飘走的泥团（余波：十来秒里变淡，冲洗快完时水又清了）
    for (let i = 0, n = nk(30); i < n; i++) {
      const a = Math.random() * Math.PI * 2, d = NET_R * (0.5 + Math.random() * 0.8) * K;
      const sp = 0.3 + Math.random() * 0.8;
      particles.mud.emit(x + Math.cos(a) * d, y + 0.15 + Math.random() * 0.4, z + Math.sin(a) * d,
        Math.cos(a) * sp, 0.18 + Math.random() * 0.35, Math.sin(a) * sp,
        7 + Math.random() * 5, (0.85 + Math.random() * 0.6) * sz, color[0], color[1], color[2], 0.42, 2.6, 0.6, 0.02, 0.06);
    }
    fxTag('B7', '网触底');
  }
  // 网开始往上提：草从这时起慢慢立回来
  lift(op) { const C = this.cur; if (C && C.op === op && C.P.liftT < 0) C.P.liftT = 0; }
  // 这一网结束（网离开水下）：不再跟踪，影子淡掉
  done(op) { if (this.cur && this.cur.op === op) this.cur.tracking = false; }

  update(dt) {
    for (const P of this.press) {
      if (!P) continue;
      if (P.liftT >= 0) { P.liftT += dt; P.s = Math.min(P.s, 1 - smooth01((P.liftT - 1.5) / RECOVER)); }
      P.D.z = P.s;
    }
    const C = this.cur;
    if (!C) return;
    C.t += dt;
    const u = C.u;
    // 网的影子：离底 1.8 米以内压上来，越近越深；网提起来就跟着淡掉
    const want = C.tracking ? 0.5 * (1 - smooth01(C.h / 1.8)) : 0;
    u.uShadow.value += (want - u.uShadow.value) * Math.min(1, dt * (C.tracking ? 14 : 4));
    if (C.ringT >= 0) {
      C.ringT += dt;
      const k = Math.min(1, C.ringT / (RING_T * (0.6 + 0.4 * C.k)));
      u.uRing.value = NET_R * 0.92 + (u.uMax.value * 0.9 - NET_R * 0.92) * (1 - Math.pow(1 - k, 2.6));
      u.uRingA.value = Math.pow(1 - k, 1.4);
    }
    if (C.churnT >= 0) { C.churnT += dt; u.uChurn.value = 0.55 * Math.max(0, 1 - C.churnT / CHURN_T); }
    // 都淡完了：拿掉这块贴地的网格
    if (!C.tracking && u.uShadow.value < 0.01 && u.uRingA.value < 0.01 && u.uChurn.value < 0.01 && (C.ringT < 0 || C.ringT > RING_T * (0.6 + 0.4 * C.k))) {
      this.scene.remove(C.mesh); C.mesh.geometry.dispose(); C.mesh.material.dispose();
      this.cur = null;
    }
  }
}

function smooth01(x) { const t = Math.max(0, Math.min(1, x)); return t * t * (3 - 2 * t); }

// 贴着海底起伏的一块圆（极坐标网格）：每个点照着那里的海底高度抬一点点
function drape(cx, cz, surf, RM = RMAX) {
  const pos = [cx, surf(cx, cz) + 0.04, cz], idx = [];
  for (let i = 1; i <= NR; i++) for (let j = 0; j < NS; j++) {
    const a = j / NS * Math.PI * 2, r = RM * i / NR;
    const x = cx + Math.cos(a) * r, z = cz + Math.sin(a) * r;
    pos.push(x, surf(x, z) + 0.04, z);
  }
  for (let j = 0; j < NS; j++) idx.push(0, 1 + ((j + 1) % NS), 1 + j);
  for (let i = 1; i < NR; i++) for (let j = 0; j < NS; j++) {
    const a = 1 + (i - 1) * NS + j, b = 1 + (i - 1) * NS + (j + 1) % NS, c = 1 + i * NS + j, d = 1 + i * NS + (j + 1) % NS;
    idx.push(a, b, c, b, d, c);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  return g;
}

// 影子（网压上来）、翻起的暗泥、往外推的沙浪：一个片元里画完，照样受水下吸收和散射
function groundMat(u) {
  return new THREE.ShaderMaterial({
    uniforms: Object.assign({}, SHARED, u),
    transparent: true, depthWrite: false,
    polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -6,
    vertexShader: /* glsl */`
      varying vec3 vW;
      void main() { vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: /* glsl */`
      varying vec3 vW;
      uniform vec2 uC; uniform float uR; uniform float uShadow; uniform float uChurn; uniform float uRing; uniform float uRingA; uniform float uGain; uniform float uMax;
      ${WATER_GLSL}
      float h21(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      void main() {
        vec2 q = vW.xz - uC;
        float d = length(q);
        float ang = atan(q.y, q.x);
        float wob = 0.06 * sin(ang * 7.0 + 1.3) + 0.04 * sin(ang * 13.0);
        // 网的影子：网口那么大的一块，边缘软
        float sh = uShadow * (1.0 - smoothstep(uR * 0.7, uR * 1.3, d));
        // 翻起的暗泥：网口一圈和外面一点，边缘毛
        float ch = uChurn * (1.0 - smoothstep(uR * (0.95 + wob), uR * (1.75 + wob), d)) * (0.75 + 0.25 * h21(floor(vW.xz * 6.0)));
        // 沙浪：前沿亮（沙脊迎着光）、后面一道暗槽
        float r = uRing * (1.0 + wob * 0.5);
        float crest = exp(-pow((d - r) / (0.16 * (1.0 + 0.7 * uGain)), 2.0));
        float trough = exp(-pow((d - r + 0.42 * (1.0 + 0.4 * uGain)) / (0.3 * (1.0 + 0.4 * uGain)), 2.0));
        float ra = uRingA * (1.0 - smoothstep(uMax * 0.75, uMax, d));
        vec3 dark = vec3(0.13, 0.11, 0.08), mud = vec3(0.3, 0.25, 0.18), sand = vec3(0.86, 0.79, 0.62);
        vec3 c = dark; float a = sh;
        float tr = trough * ra * 0.85;
        if (ch > a) { c = mix(c, mud, ch / max(ch + a, 0.001)); a = max(a, ch); }
        if (tr > 0.0) { c = mix(c, mud * 0.8, tr / max(tr + a, 0.001)); a = max(a, tr); }
        float cr = crest * ra;
        c = mix(c, sand, clamp(cr * 1.4, 0.0, 1.0)); a = max(a, min(1.0, cr * (0.9 + 0.3 * uGain)));
        if (a < 0.004) discard;
        c = applyWater(c, vW, vec3(0.0, 1.0, 0.0), 1.0);
        // 深处：沙脊多亮一点（水把亮的那一侧也吃掉了）
        c += cr * uGain * vec3(0.10, 0.12, 0.11);
        gl_FragColor = vec4(c, a);
        #include <colorspace_fragment>
      }`,
  });
}

import * as THREE from 'three';
import { U } from '../render/materials.js';
import { COMMON } from '../render/shaders.js';
import { LOW_H } from '../config.js';

// 像素方块粒子：泡、泥云、水花、喷水、滴水、烟、海雪、闪光。
// 水下的粒子和其他东西走同一个水色衰减。

// shape：0 方/圆点  1 软云  2 水滴（左上一点高光）  3 闪光（十字星）  4 泥点（不规则的团）  5 细点（按盖住多少淡下去）
// max：最多画多大（低分辨率像素）。近景时粒子不会变成一个个大方块
const TYPES = {
  bubble: { size: 0.09, life: 3.2, color: [0.85, 0.97, 1.0], alpha: 0.9, buoy: 1.6, drag: 1.5, wobble: 0.6, under: true, shape: 2, max: 4 },
  // 沉船缝里冒的那一串：深处也留住几成亮（不被水色吃掉）
  wbub: { size: 0.12, life: 8, color: [0.88, 0.98, 1.0], alpha: 0.95, buoy: 1.6, drag: 1.5, wobble: 0.6, under: true, keep: 0.6, shape: 2, max: 5 },
  mud: { size: 1.2, life: 6.5, color: [0.42, 0.36, 0.27], alpha: 0.62, buoy: 0.05, drag: 1.2, grow: 1.2, current: 0.6, under: true, soft: true },
  silt: { size: 0.5, life: 4.0, color: [0.6, 0.54, 0.42], alpha: 0.45, buoy: 0.02, drag: 1.4, grow: 0.8, current: 0.5, under: true, soft: true },
  splash: { size: 0.18, life: 0.9, color: [0.92, 0.97, 1.0], alpha: 1.0, gravity: 9.0, drag: 0.4, shape: 2, max: 5 },
  spray: { size: 0.075, life: 0.55, color: [0.82, 0.92, 1.0], alpha: 0.9, gravity: 7.0, drag: 0.2, shape: 2, max: 3 },
  drip: { size: 0.06, life: 1.0, color: [0.6, 0.55, 0.42], alpha: 0.95, gravity: 9.8, drag: 0.1, shape: 2, max: 3 },
  mudsplat: { size: 0.12, life: 1.4, color: [0.36, 0.3, 0.22], alpha: 1.0, gravity: 9.8, drag: 0.3, floorStop: true, shape: 4, max: 6 },
  smoke: { size: 0.5, life: 3.0, color: [0.32, 0.32, 0.34], alpha: 0.5, buoy: 1.4, drag: 0.8, grow: 1.4, wind: true, soft: true },
  // 起步那一口浓烟：黑、厚、往上一冲再被风带走
  puff: { size: 0.8, life: 3.4, color: [0.13, 0.13, 0.14], alpha: 0.82, buoy: 1.1, drag: 1.1, grow: 1.9, wind: true, soft: true },
  // 海雪：慢慢淡进来、落到海底以前淡掉、贴着镜头的不画；比一个像素小的按面积淡下去（不在 1 格和 2 格之间跳）
  snow: { size: 0.04, life: 14, color: [0.8, 0.88, 0.84], alpha: 0.4, buoy: -0.03, drag: 2.0, current: 0.8, under: true, shape: 5, max: 2, fadeIn: 1.6, floorFade: 0.35, near: [4, 9] },
  spark: { size: 0.075, life: 1.2, color: [1.0, 0.93, 0.62], alpha: 1.0, gravity: -0.4, drag: 1.5, twinkle: true, shape: 3, max: 7 },
  foam: { size: 0.32, life: 2.6, color: [0.95, 0.98, 0.98], alpha: 0.85, drag: 2.5, flat: true, grow: 0.4, shape: 0, max: 6 },
  sand: { size: 0.14, life: 1.6, color: [0.82, 0.74, 0.56], alpha: 0.9, gravity: 1.6, drag: 2.0, under: true, shape: 4, max: 4 },
  ring: { size: 0.22, life: 0.8, color: [1.0, 0.95, 0.75], alpha: 1.0, drag: 3.0, twinkle: true, shape: 3, max: 9 },
  // 网口扬起的泥云：比海底亮、深处也不被水色吃掉太多（keep），慢慢胀大、随水流飘
  cloud: { size: 1.5, life: 5.5, color: [0.78, 0.72, 0.58], alpha: 0.78, buoy: 0.0, drag: 1.6, grow: 1.1, current: 0.7, under: true, soft: true, keep: 0.72 },
  // 甲板上的泥块：成块往下掉、落地摊住
  chunk: { size: 0.26, life: 2.2, color: [0.33, 0.27, 0.19], alpha: 1.0, gravity: 9.8, drag: 0.25, floorStop: true, shape: 4, max: 9 },
  // 一线反光：细长的白点，不是十字星（露头、确认时金属的那一线光）
  glint: { size: 0.1, life: 0.5, color: [0.92, 0.97, 1.0], alpha: 1.0, drag: 6.0, shape: 0, max: 4 },
  // 海底金属上阳光一扫的那一闪：十字星，隔着水也看得见一点
  flick: { size: 0.5, life: 0.45, color: [1.0, 1.0, 0.97], alpha: 1.0, drag: 8.0, under: true, keep: 0.85, hot: true, shape: 3, max: 11 },
  // 银光：从开着的匣子里往上冒的淡淡一缕
  shine: { size: 0.2, life: 1.0, color: [0.9, 0.95, 1.0], alpha: 0.3, buoy: 0.9, drag: 1.2, grow: 0.6, soft: true },
  // 溅出来的银币：落在甲板上躺着闪
  coin: { size: 0.075, life: 3.2, color: [0.86, 0.88, 0.92], alpha: 1.0, gravity: 9.8, drag: 0.4, floorStop: true, twinkle: true, shape: 0, max: 4 },
  // 水槽里吐的泡
  tbub: { size: 0.05, life: 0.9, color: [0.9, 0.98, 1.0], alpha: 0.9, buoy: 0.4, drag: 2.0, shape: 2, max: 3 },
  // 舱里光柱中飘着的灰：细小、慢、一闪一闪
  mote: { size: 0.035, life: 4.5, color: [1.0, 0.9, 0.7], alpha: 0.85, buoy: 0.0, drag: 0.6, twinkle: true, shape: 0, max: 2, fadeIn: 1.0 },
  // 舱口扬起的灰
  dust: { size: 0.22, life: 1.4, color: [0.62, 0.56, 0.46], alpha: 0.45, buoy: 0.3, drag: 2.2, grow: 1.2, soft: true },
};

export class Particles {
  constructor(max = 5000) {
    this.max = max;
    this.n = 0;
    this.p = new Float32Array(max * 3);
    this.v = new Float32Array(max * 3);
    this.life = new Float32Array(max);
    this.age = new Float32Array(max);
    this.size = new Float32Array(max);
    this.type = new Array(max);
    this.colr = new Float32Array(max * 3);
    this.floorY = new Float32Array(max);
    this.seed = new Float32Array(max);

    const mkGeo = () => {
      const geo = new THREE.BufferGeometry();
      const b = {
        geo,
        pos: new THREE.BufferAttribute(new Float32Array(max * 3), 3).setUsage(THREE.DynamicDrawUsage),
        col: new THREE.BufferAttribute(new Float32Array(max * 4), 4).setUsage(THREE.DynamicDrawUsage),
        size: new THREE.BufferAttribute(new Float32Array(max), 1).setUsage(THREE.DynamicDrawUsage),
        soft: new THREE.BufferAttribute(new Float32Array(max * 3), 3).setUsage(THREE.DynamicDrawUsage),
      };
      geo.setAttribute('position', b.pos);
      geo.setAttribute('aCol', b.col);
      geo.setAttribute('aSize', b.size);
      geo.setAttribute('aShape', b.soft);
      geo.setDrawRange(0, 0);
      return b;
    };
    this.bufUnder = mkGeo();
    this.bufOver = mkGeo();
    const mat = new THREE.ShaderMaterial({
      uniforms: { ...U, uScale: { value: 1 } },
      vertexShader: /* glsl */ `
        ${COMMON}
        attribute vec4 aCol;
        attribute float aSize;
        attribute vec3 aShape;
        uniform float uScale;
        varying vec4 vCol;
        varying vec3 vShape;
        varying float vPx;
        void main(){
          vec4 wp = modelMatrix * vec4(position, 1.0);
          vec4 mv = viewMatrix * wp;
          gl_Position = projectionMatrix * mv;
          float px = min(aSize * uScale / -mv.z, aShape.y);
          gl_PointSize = max(1.0, floor(px + 0.5));
          // 细点：画成整格（1 格、2 格），亮度按它本来盖住的面积给，大小换档时总的亮不跳
          float cover = 1.0;
          if (aShape.x > 4.5) {
            gl_PointSize = max(1.0, ceil(px - 0.001));
            cover = min(1.0, (px * px) / (gl_PointSize * gl_PointSize));
            // 镜头转得、推得快时细点淡下去：一帧跳几格的小白点最闪
            cover *= 1.0 - 0.8 * uMotion;
          }
          vPx = gl_PointSize;
          float tr;
          vec3 c = waterTint(aCol.rgb, wp.xyz, tr);
          // keep：深处也留住几成本色和不透明（网口泥云这类要看得见的）
          float keep = aShape.z > 3.5 ? aShape.z - 4.0 : (aShape.z > 1.5 ? aShape.z - 2.0 : 0.0);
          // hot：金属上的一点高光，隔着水也比海底亮（不往暗里压）
          float hot = step(3.5, aShape.z);
          c = mix(c, aCol.rgb * mix(0.62, 1.1, hot), keep * (1.0 - tr) * mix(0.55, 1.0, hot));
          vCol = vec4(c, aCol.a * cover * (wp.y < 0.0 ? mix(mix(mix(0.25, 0.9, keep), 1.0, hot), 1.0, tr) : 1.0));
          vShape = aShape;
        }
      `,
      fragmentShader: /* glsl */ `
        varying vec4 vCol;
        varying vec3 vShape;
        varying float vPx;
        void main(){
          vec2 q = gl_PointCoord - 0.5;
          float d = length(q);
          float kind = vShape.x;
          vec3 c = vCol.rgb;
          float a = vCol.a;
          if (kind > 0.5 && kind < 1.5) {
            // 软粒子：圆、边缘按棋盘格掉像素（像素风的半透明）
            if (d > 0.5) discard;
            float edge = smoothstep(0.5, 0.15, d);
            vec2 f = floor(gl_FragCoord.xy);
            float chk = mod(f.x + f.y, 2.0);
            if (edge < 0.45 && chk > 0.5) discard;
            a *= 0.55 + edge * 0.45;
          } else if (vPx >= 3.0) {
            vec2 ip = floor(gl_PointCoord * vPx);
            float ctr = floor(vPx * 0.5);
            if (kind > 2.5 && kind < 3.5) {
              // 十字星：中间一横一竖，大的再加一圈亮心
              bool arm = ip.x == ctr || ip.y == ctr;
              bool core = vPx >= 5.0 && abs(ip.x - ctr) <= 1.0 && abs(ip.y - ctr) <= 1.0 && abs(ip.x - ctr) + abs(ip.y - ctr) <= 1.0;
              if (!arm && !core) discard;
              float r = max(abs(ip.x - ctr), abs(ip.y - ctr)) / max(ctr, 1.0);
              c = mix(c, vec3(1.0), (1.0 - r) * 0.5);
              a *= 1.0 - r * 0.45;
            } else if (kind > 3.5 && kind < 4.5) {
              // 泥点：边缘按角度起伏的团，下半边暗一点
              float ang = atan(q.y, q.x);
              float rr = 0.5 * (0.78 + 0.22 * sin(ang * 3.0 + vShape.z * 6.28) * cos(ang * 2.0 - vShape.z * 3.1));
              if (d > rr) discard;
              c *= 1.0 - step(0.05, q.y + q.x * 0.5) * 0.22;
            } else {
              if (d > 0.5) discard;
              if (kind > 1.5 && kind < 2.5) {
                // 水滴：左上一个亮点，右下沿暗一圈
                vec2 hl = q + vec2(0.17, 0.17);
                c = mix(c, vec3(1.0), step(length(hl), 0.16) * 0.8);
                c *= 1.0 - step(0.36, d) * step(0.0, q.x + q.y) * 0.25;
              }
            }
          }
          gl_FragColor = vec4(c, a);
        }
      `,
      transparent: true,
      depthWrite: false,
    });
    // 泥雾、沙子盖住海底的东西时，连它的轮廓一起盖住（见 pipeline.js 的 keepAlpha）
    mat.userData.coverItems = true;
    // 水下的粒子在水面之前画，水面以上的在水面之后画
    this.points = new THREE.Points(this.bufUnder.geo, mat);
    this.points.frustumCulled = false;
    this.points.renderOrder = 5;
    this.points.name = 'particles';
    this.above = new THREE.Points(this.bufOver.geo, mat);
    this.above.frustumCulled = false;
    this.above.renderOrder = 20;
    this.above.name = 'particles-above';
    this.mat = mat;
  }

  setScale(projScale) {
    this.mat.uniforms.uScale.value = projScale;
  }

  emit(type, x, y, z, vx = 0, vy = 0, vz = 0, opts = {}) {
    if (this.n >= this.max) return -1;
    const T = TYPES[type];
    const i = this.n++;
    this.p[i * 3] = x; this.p[i * 3 + 1] = y; this.p[i * 3 + 2] = z;
    this.v[i * 3] = vx; this.v[i * 3 + 1] = vy; this.v[i * 3 + 2] = vz;
    this.life[i] = (opts.life ?? T.life) * (0.75 + Math.random() * 0.5);
    this.age[i] = 0;
    this.size[i] = (opts.size ?? T.size) * (0.7 + Math.random() * 0.6);
    this.type[i] = T;
    const c = opts.color ?? T.color;
    this.colr[i * 3] = c[0]; this.colr[i * 3 + 1] = c[1]; this.colr[i * 3 + 2] = c[2];
    this.floorY[i] = opts.floorY ?? -1e9;
    this.seedN = (this.seedN || 0) + 1;
    this.seed[i] = (this.seedN * 0.6180339) % 1;
    return i;
  }

  update(dt) {
    const cur = U.uCurrent.value;
    const t = U.uTime.value;
    let w = 0;
    for (let i = 0; i < this.n; i++) {
      const T = this.type[i];
      this.age[i] += dt;
      if (this.age[i] >= this.life[i]) continue;
      const i3 = i * 3;
      let vx = this.v[i3], vy = this.v[i3 + 1], vz = this.v[i3 + 2];
      const dr = Math.exp(-(T.drag || 0) * dt);
      vx *= dr; vy *= dr; vz *= dr;
      if (T.gravity) vy -= T.gravity * dt;
      if (T.buoy) vy += T.buoy * dt;
      if (T.current) { vx += cur.x * T.current * dt; vz += cur.y * T.current * dt; }
      if (T.wind) { vx += 0.8 * dt; vz += 0.3 * dt; }
      let px = this.p[i3] + vx * dt, py = this.p[i3 + 1] + vy * dt, pz = this.p[i3 + 2] + vz * dt;
      if (T.wobble) { px += Math.sin(t * 7 + i) * T.wobble * dt; pz += Math.cos(t * 6 + i * 1.3) * T.wobble * dt; }
      if (T.under && py > -0.05) {
        if (T === TYPES.bubble || T === TYPES.wbub) { this.age[i] = this.life[i]; continue; }
        py = -0.05; vy = 0;
      }
      if (T.floorStop && py < this.floorY[i]) { py = this.floorY[i]; vy = 0; vx *= 0.5; vz *= 0.5; }
      if (!T.under && !T.flat && !T.floorStop && py < -0.1 && T !== TYPES.smoke) { this.age[i] = this.life[i]; continue; }
      if (T.flat) py = 0.05;
      // 压实
      const j3 = w * 3;
      this.p[j3] = px; this.p[j3 + 1] = py; this.p[j3 + 2] = pz;
      this.v[j3] = vx; this.v[j3 + 1] = vy; this.v[j3 + 2] = vz;
      this.life[w] = this.life[i]; this.age[w] = this.age[i]; this.size[w] = this.size[i]; this.type[w] = T;
      this.colr[j3] = this.colr[i3]; this.colr[j3 + 1] = this.colr[i3 + 1]; this.colr[j3 + 2] = this.colr[i3 + 2];
      this.floorY[w] = this.floorY[i];
      this.seed[w] = this.seed[i];
      w++;
    }
    this.n = w;
    let nu = 0, no = 0;
    const U_ = this.bufUnder, O_ = this.bufOver;
    for (let i = 0; i < this.n; i++) {
      const T = this.type[i];
      const k = this.age[i] / this.life[i];
      const under = this.p[i * 3 + 1] < 0.02;
      const B = under ? U_ : O_;
      const j = under ? nu++ : no++;
      const pa = B.pos.array, ca = B.col.array;
      pa[j * 3] = this.p[i * 3]; pa[j * 3 + 1] = this.p[i * 3 + 1]; pa[j * 3 + 2] = this.p[i * 3 + 2];
      let a = T.alpha * (1 - k * k);
      if (T.soft) a *= Math.min(1, this.age[i] * 3);
      // 烟飘到镜头跟前就淡掉（不糊住整个画面）
      if (T.wind && this.eye) {
        const e = this.eye, ex = this.p[i * 3] - e.x, ey = this.p[i * 3 + 1] - e.y, ez = this.p[i * 3 + 2] - e.z;
        a *= Math.min(1, Math.max(0, (Math.sqrt(ex * ex + ey * ey + ez * ez) - 4) / 8));
      }
      if (T.twinkle) a *= 0.5 + 0.5 * Math.sin(this.age[i] * 30 + i);
      if (T.fadeIn) a *= Math.min(1, this.age[i] / T.fadeIn);
      if (T.floorFade) a *= Math.min(1, Math.max(0, (this.p[i * 3 + 1] - this.floorY[i]) / T.floorFade));
      if (T.near && this.eye) {
        const e = this.eye, ex = this.p[i * 3] - e.x, ey = this.p[i * 3 + 1] - e.y, ez = this.p[i * 3 + 2] - e.z;
        const d = Math.sqrt(ex * ex + ey * ey + ez * ez);
        a *= Math.min(1, Math.max(0, (d - T.near[0]) / (T.near[1] - T.near[0])));
      }
      ca[j * 4] = this.colr[i * 3]; ca[j * 4 + 1] = this.colr[i * 3 + 1]; ca[j * 4 + 2] = this.colr[i * 3 + 2]; ca[j * 4 + 3] = a;
      B.size.array[j] = this.size[i] * (1 + (T.grow || 0) * k * 2);
      const sa = B.soft.array;
      sa[j * 3] = T.soft ? 1 : (T.shape ?? 0);
      sa[j * 3 + 1] = T.soft ? 9999 : (T.max ?? 9999);
      sa[j * 3 + 2] = T.keep ? (T.hot ? 4 : 2) + T.keep : this.seed[i];
    }
    for (const [B, n] of [[U_, nu], [O_, no]]) {
      B.pos.needsUpdate = B.col.needsUpdate = B.size.needsUpdate = B.soft.needsUpdate = true;
      B.pos.updateRanges.length = 0;
      B.geo.setDrawRange(0, n);
    }
  }

  // —— 常用组合 ——
  burst(type, x, y, z, n, speed, spread = 1, opts = {}) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = Math.random() * spread;
      const up = opts.up ?? 0.6;
      this.emit(type, x + Math.cos(a) * r * 0.3, y, z + Math.sin(a) * r * 0.3,
        Math.cos(a) * speed * (0.4 + Math.random()), speed * up * (0.5 + Math.random()), Math.sin(a) * speed * (0.4 + Math.random()), opts);
    }
  }
}

export function projScaleFor(fovDeg) {
  // 粒子像素尺寸：世界尺寸 × 这个系数 / 深度 = 低分辨率像素
  return LOW_H / (2 * Math.tan(THREE.MathUtils.degToRad(fovDeg / 2)));
}

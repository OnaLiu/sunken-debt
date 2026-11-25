// 粒子：泥云（水下柔和、受水体衰减）、水花/水滴/冲洗水柱、气泡、揭宝闪光（叠加）、
//       水面以上的硬水花（入水、出水、缆绳甩水：像素画里一颗颗白点，落回水面就没了）
import * as THREE from 'three';
import { SHARED, WATER_GLSL } from './materials.js';

class Pool {
  constructor(scene, max, additive, underwater) {
    this.max = max;
    this.pos = new Float32Array(max * 3);
    this.col = new Float32Array(max * 4);
    this.size = new Float32Array(max);
    this.vel = new Float32Array(max * 3);
    this.life = new Float32Array(max);
    this.age = new Float32Array(max);
    this.grow = new Float32Array(max);
    this.drag = new Float32Array(max);
    this.grav = new Float32Array(max);
    this.base = new Float32Array(max * 4);
    this.size0 = new Float32Array(max);
    this.fin = new Float32Array(max); // 淡入占寿命的几成（默认 0.1；要“同一帧就看得见”的给 0）
    this.n = 0;
    this.sea = false; // 落回水面（y < 0 往下走）就没了：水面以上的水花用
    this.pop = false; // 往上浮的（重力为负的气泡）到水面就破了：水下的池子用
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    g.setAttribute('aCol', new THREE.BufferAttribute(this.col, 4));
    g.setAttribute('aSize', new THREE.BufferAttribute(this.size, 1));
    this.geo = g;
    this.uniforms = Object.assign({ uScale: { value: 540 } }, SHARED);
    const mat = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      transparent: true, depthWrite: false,
      blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
      vertexShader: /* glsl */`
        attribute vec4 aCol; attribute float aSize; uniform float uScale;
        varying vec4 vCol; varying vec3 vW;
        void main() {
          vCol = aCol; vW = (modelMatrix * vec4(position, 1.0)).xyz;
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = max(1.0, aSize * uScale / -mv.z);
        }`,
      fragmentShader: /* glsl */`
        varying vec4 vCol; varying vec3 vW;
        ${WATER_GLSL}
        void main() {
          vec2 q = gl_PointCoord - 0.5;
          float d = dot(q, q) * 4.0;
          if (d > 1.0) discard;
          float a = vCol.a * ${underwater ? '(1.0 - d) * (1.0 - d)' : '(d < 0.55 ? 1.0 : 0.0)'};
          vec3 c = vCol.rgb;
          ${underwater ? 'c = applyWater(c, vW, vec3(0.0, 1.0, 0.0), 1.0);' : ''}
          gl_FragColor = vec4(c, a);
          #include <colorspace_fragment>
        }`,
    });
    this.points = new THREE.Points(g, mat);
    this.points.frustumCulled = false;
    this.points.renderOrder = additive ? 5 : 3;
    scene.add(this.points);
  }
  emit(x, y, z, vx, vy, vz, life, size, r, g, b, a, grow = 0, drag = 0, grav = 0, fin = 0.1) {
    let i = this.n;
    if (i >= this.max) { i = Math.floor(Math.random() * this.max); } else this.n++;
    this.pos[i * 3] = x; this.pos[i * 3 + 1] = y; this.pos[i * 3 + 2] = z;
    this.vel[i * 3] = vx; this.vel[i * 3 + 1] = vy; this.vel[i * 3 + 2] = vz;
    this.life[i] = life; this.age[i] = 0; this.size0[i] = size; this.grow[i] = grow; this.drag[i] = drag; this.grav[i] = grav; this.fin[i] = fin;
    this.base[i * 4] = r; this.base[i * 4 + 1] = g; this.base[i * 4 + 2] = b; this.base[i * 4 + 3] = a;
  }
  update(dt, current) {
    let i = 0;
    while (i < this.n) {
      this.age[i] += dt;
      if (this.age[i] >= this.life[i]) {
        const j = this.n - 1;
        if (i !== j) {
          for (const arr of [this.pos, this.vel]) { arr[i * 3] = arr[j * 3]; arr[i * 3 + 1] = arr[j * 3 + 1]; arr[i * 3 + 2] = arr[j * 3 + 2]; }
          for (let k = 0; k < 4; k++) this.base[i * 4 + k] = this.base[j * 4 + k];
          this.life[i] = this.life[j]; this.age[i] = this.age[j]; this.size0[i] = this.size0[j]; this.grow[i] = this.grow[j]; this.drag[i] = this.drag[j]; this.grav[i] = this.grav[j]; this.fin[i] = this.fin[j];
        }
        this.n--;
        continue;
      }
      if (this.sea && this.pos[i * 3 + 1] < -0.04 && this.vel[i * 3 + 1] < 0) this.age[i] = this.life[i];
      else if (this.pop && this.grav[i] < 0 && this.pos[i * 3 + 1] > -0.03) this.age[i] = this.life[i];
      const dr = Math.exp(-this.drag[i] * dt);
      this.vel[i * 3] *= dr; this.vel[i * 3 + 1] *= dr; this.vel[i * 3 + 2] *= dr;
      this.vel[i * 3 + 1] -= this.grav[i] * dt;
      let cx = 0, cz = 0;
      if (current && this.pos[i * 3 + 1] < 0) { cx = current.x * 0.25; cz = current.y * 0.25; }
      this.pos[i * 3] += (this.vel[i * 3] + cx) * dt; this.pos[i * 3 + 1] += this.vel[i * 3 + 1] * dt; this.pos[i * 3 + 2] += (this.vel[i * 3 + 2] + cz) * dt;
      const t = this.age[i] / this.life[i];
      this.size[i] = this.size0[i] * (1 + this.grow[i] * Math.sqrt(t));
      const fi = this.fin[i], fade = t < fi ? t / fi : 1 - (t - fi) / (1 - fi);
      this.col[i * 4] = this.base[i * 4]; this.col[i * 4 + 1] = this.base[i * 4 + 1]; this.col[i * 4 + 2] = this.base[i * 4 + 2];
      this.col[i * 4 + 3] = this.base[i * 4 + 3] * Math.max(0, fade);
      i++;
    }
    this.geo.setDrawRange(0, this.n);
    this.geo.attributes.position.needsUpdate = true;
    this.geo.attributes.aCol.needsUpdate = true;
    this.geo.attributes.aSize.needsUpdate = true;
  }
}

export class Particles {
  constructor(scene) {
    this.mud = new Pool(scene, 2600, false, true);
    this.water = new Pool(scene, 2400, false, true); this.water.pop = true;
    this.spark = new Pool(scene, 900, true, false);
    this.spray = new Pool(scene, 1600, false, false); this.spray.sea = true;
  }
  setScale(viewH, fovDeg) { const s = viewH / (2 * Math.tan(THREE.MathUtils.degToRad(fovDeg) / 2)); for (const p of [this.mud, this.water, this.spark, this.spray]) p.uniforms.uScale.value = s; }
  update(dt, current) { this.mud.update(dt, current); this.water.update(dt, current); this.spark.update(dt, null); this.spray.update(dt, null); }
  // 触底泥云：局部、有方向（顺海流），十余秒内恢复
  mudCloud(x, y, z, r, color, strength = 1) {
    const n = Math.round(46 * strength);
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, d = Math.random() * r;
      const sp = 0.4 + Math.random() * 1.1;
      this.mud.emit(x + Math.cos(a) * d, y + 0.1 + Math.random() * 0.3, z + Math.sin(a) * d,
        Math.cos(a) * sp, 0.25 + Math.random() * 0.5, Math.sin(a) * sp,
        7 + Math.random() * 7, 0.7 + Math.random() * 0.6, color[0], color[1], color[2], 0.55 * strength, 2.6, 0.6, 0.03);
    }
  }
  puff(x, y, z, color, n = 10, size = 0.4) {
    for (let i = 0; i < n; i++) this.mud.emit(x + (Math.random() - 0.5) * 0.4, y + 0.05, z + (Math.random() - 0.5) * 0.4, (Math.random() - 0.5) * 0.5, 0.2 + Math.random() * 0.3, (Math.random() - 0.5) * 0.5, 3 + Math.random() * 3, size, color[0], color[1], color[2], 0.5, 2.0, 0.8, 0.02);
  }
  splash(x, z, r = 1.8, n = 60) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, d = r * (0.6 + Math.random() * 0.5);
      this.water.emit(x + Math.cos(a) * d, 0.1, z + Math.sin(a) * d, Math.cos(a) * (0.6 + Math.random()), 2 + Math.random() * 3.5, Math.sin(a) * (0.6 + Math.random()), 0.9 + Math.random() * 0.5, 0.14 + Math.random() * 0.12, 0.85, 0.93, 0.95, 0.9, 0, 0.3, 9.8);
    }
  }
  bubbles(x, y, z, n = 3) {
    for (let i = 0; i < n; i++) this.water.emit(x + (Math.random() - 0.5) * 1.2, y, z + (Math.random() - 0.5) * 1.2, 0, 1.2 + Math.random(), 0, 2 + Math.random() * 2, 0.07 + Math.random() * 0.06, 0.8, 0.95, 1.0, 0.7, 0, 0, -0.3);
  }
  drips(x, y, z, r, n = 4, color = [0.55, 0.5, 0.4]) {
    for (let i = 0; i < n; i++) { const a = Math.random() * 6.28, d = Math.random() * r; this.water.emit(x + Math.cos(a) * d, y, z + Math.sin(a) * d, 0, -0.5, 0, 0.8, 0.08, color[0], color[1], color[2], 0.9, 0, 0, 9.8); }
  }
  hose(from, to, n = 6) {
    for (let i = 0; i < n; i++) {
      const dx = to.x - from.x, dy = to.y - from.y, dz = to.z - from.z;
      const L = Math.hypot(dx, dy, dz) || 1;
      const sp = 7 + Math.random() * 2;
      this.water.emit(from.x, from.y, from.z, dx / L * sp + (Math.random() - 0.5) * 0.8, dy / L * sp + 1.2 + (Math.random() - 0.5) * 0.6, dz / L * sp + (Math.random() - 0.5) * 0.8, L / sp + 0.15, 0.075, 0.86, 0.94, 0.98, 0.85, 0, 0, 5);
    }
  }
  // 船尾航迹与船首浪花（水面上，慢慢散开）
  wake(x, z, hx, hz, speed) {
    const sx = -hz, sz = hx; // 右舷方向
    for (const side of [-1, 1]) {
      const vx = sx * side * (0.6 + Math.random() * 0.5) - hx * speed * 0.15, vz = sz * side * (0.6 + Math.random() * 0.5) - hz * speed * 0.15;
      this.water.emit(x + sx * side * 1.6 + (Math.random() - 0.5) * 0.6, 0.06, z + sz * side * 1.6 + (Math.random() - 0.5) * 0.6, vx, 0, vz, 2.6 + Math.random() * 1.2, 0.3 + Math.random() * 0.2, 0.92, 0.97, 0.98, 0.55, 2.2, 0.8, 0);
    }
  }
  bowSpray(x, z, hx, hz, speed) {
    const sx = -hz, sz = hx;
    for (const side of [-1, 1]) this.water.emit(x + sx * side * 0.9, 0.3, z + sz * side * 0.9, sx * side * (1.5 + Math.random()) + hx * speed * 0.5, 0.8 + Math.random() * 1.2, sz * side * (1.5 + Math.random()) + hz * speed * 0.5, 0.6, 0.12, 0.92, 0.97, 1.0, 0.8, 0.5, 0.4, 9.8);
  }
  splat(x, y, z, n = 4) {
    for (let i = 0; i < n; i++) { const a = Math.random() * 6.28; this.water.emit(x, y, z, Math.cos(a) * (0.8 + Math.random()), 0.6 + Math.random() * 1.2, Math.sin(a) * (0.8 + Math.random()), 0.35 + Math.random() * 0.2, 0.08 + Math.random() * 0.05, 0.9, 0.95, 0.98, 0.7, 1.5, 0.5, 6); }
  }
  mudChunks(x, y, z, r, color, n = 12) {
    for (let i = 0; i < n; i++) { const a = Math.random() * 6.28; this.water.emit(x + Math.cos(a) * r, y + Math.random() * r, z + Math.sin(a) * r, Math.cos(a) * (1 + Math.random() * 1.5), 1 + Math.random() * 1.5, Math.sin(a) * (1 + Math.random() * 1.5), 0.7 + Math.random() * 0.4, 0.08 + Math.random() * 0.08, color[0], color[1], color[2], 1, 0, 0.2, 9.8); }
  }
  // 连续的一股金星（每帧几颗，例如珍品余波里往上飘的、展示时身上的闪）：和 sparkle 一样，只是“一股”不是“一下”
  motes(x, y, z, r, n, gold = true) { this.glints(x, y, z, r, n, gold); }
  sparkle(x, y, z, r, n, gold = true) { this.glints(x, y, z, r, n, gold); }
  glints(x, y, z, r, n, gold) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, e = Math.random() * Math.PI - Math.PI / 2;
      const sp = 0.6 + Math.random() * 2.2;
      this.spark.emit(x + Math.cos(a) * r * Math.random(), y + Math.random() * 0.3, z + Math.sin(a) * r * Math.random(), Math.cos(a) * Math.cos(e) * sp, Math.abs(Math.sin(e)) * sp + 0.6, Math.sin(a) * Math.cos(e) * sp, 1.2 + Math.random() * 1.4, 0.03 + Math.random() * 0.045,
        gold ? 1.0 : 0.85, gold ? 0.82 : 0.95, gold ? 0.45 : 1.0, 1, 0, 1.2, -0.25);
    }
  }

  // —— 一网的前半（B5、B6、B9、B11）——
  // 入水（B5）：网圈一整圈砸进水里，水冠沿着网圈往上往外翻，中间一股水柱，外面一层细雾；同一帧就看得见
  plunge(x, z, R) {
    const S = this.spray;
    for (let i = 0; i < 44; i++) {
      const a = (i + Math.random() * 0.7) / 44 * Math.PI * 2, out = 1.2 + Math.random() * 1.9, up = 2.6 + Math.random() * 3.2;
      S.emit(x + Math.cos(a) * R * (0.92 + Math.random() * 0.12), 0.08, z + Math.sin(a) * R * (0.92 + Math.random() * 0.12),
        Math.cos(a) * out, up, Math.sin(a) * out, 0.75 + Math.random() * 0.4, 0.15 + Math.random() * 0.16, 0.93, 0.97, 0.98, 1, -0.35, 0.7, 9.8, 0);
    }
    for (let i = 0; i < 16; i++) {
      const a = Math.random() * Math.PI * 2, d = Math.random() * R * 0.35;
      S.emit(x + Math.cos(a) * d, 0.1, z + Math.sin(a) * d, Math.cos(a) * 0.5, 4.2 + Math.random() * 2.6, Math.sin(a) * 0.5, 0.9 + Math.random() * 0.3, 0.12 + Math.random() * 0.1, 0.96, 0.99, 1.0, 1, -0.3, 0.4, 9.8, 0);
    }
    for (let i = 0; i < 26; i++) {
      const a = Math.random() * Math.PI * 2, sp = 2.5 + Math.random() * 3;
      S.emit(x + Math.cos(a) * R, 0.15, z + Math.sin(a) * R, Math.cos(a) * sp, 1.2 + Math.random() * 1.8, Math.sin(a) * sp, 0.4 + Math.random() * 0.3, 0.05 + Math.random() * 0.04, 0.9, 0.96, 0.98, 0.85, 0, 1.6, 6, 0);
    }
    // 网兜里兜着的空气被压出来：网圈下一圈大泡，往上冲
    for (let i = 0; i < 34; i++) {
      const a = Math.random() * Math.PI * 2, d = R * (0.6 + Math.random() * 0.45);
      this.water.emit(x + Math.cos(a) * d, -0.3 - Math.random() * 0.9, z + Math.sin(a) * d, (Math.random() - 0.5) * 0.4, 1.8 + Math.random() * 1.4, (Math.random() - 0.5) * 0.4, 0.5 + Math.random() * 0.5, 0.1 + Math.random() * 0.08, 0.86, 0.97, 1.0, 0.85, 0, 0.4, -0.6, 0);
    }
  }
  // 下沉（B6）：网身上一路冒出来的气泡（网往下走，泡往上走，拉成一串）
  trail(x, y, z, R, n = 2) {
    for (let i = 0; i < n; i++) {
      const top = Math.random() < 0.45, a = Math.random() * Math.PI * 2;
      const px = top ? x + (Math.random() - 0.5) * 0.25 : x + Math.cos(a) * R * 0.95, pz = top ? z + (Math.random() - 0.5) * 0.25 : z + Math.sin(a) * R * 0.95;
      this.water.emit(px, y + (top ? 1.7 : 0), pz, (Math.random() - 0.5) * 0.35, 1.0 + Math.random() * 1.1, (Math.random() - 0.5) * 0.35, 1.8 + Math.random() * 1.6, 0.08 + Math.random() * 0.09, 0.86, 0.98, 1.0, 0.9, 0.4, 0.2, -0.5, 0.05);
    }
  }
  // 过一个秒结，网兜吐一团大泡
  burp(x, y, z, n = 9) {
    for (let i = 0; i < n; i++) this.water.emit(x + (Math.random() - 0.5) * 0.9, y - 0.4 + Math.random() * 0.5, z + (Math.random() - 0.5) * 0.9, (Math.random() - 0.5) * 0.6, 1.6 + Math.random() * 1.2, (Math.random() - 0.5) * 0.6, 1.6 + Math.random() * 1.2, 0.15 + Math.random() * 0.1, 0.88, 0.98, 1.0, 0.92, 0.3, 0.25, -0.7, 0);
  }
  // 缆绳一下绷直（B9）：水面以上那一段甩下一串水珠
  flick(ax, ay, az, bx, by, bz, sx, sz, n = 18) {
    for (let i = 0; i < n; i++) {
      const t = Math.random(), x = ax + (bx - ax) * t, y = ay + (by - ay) * t, z = az + (bz - az) * t;
      if (y < 0.05) continue;
      const k = 1.2 + Math.random() * 1.6;
      this.spray.emit(x, y, z, sx * k + (Math.random() - 0.5) * 0.6, 0.4 + Math.random() * 1.2, sz * k + (Math.random() - 0.5) * 0.6, 0.5 + Math.random() * 0.4, 0.05 + Math.random() * 0.04, 0.9, 0.96, 0.98, 0.95, 0, 0.5, 9.8, 0);
    }
  }
  // 网兜离开泥（B9）：网底下翻起一小团泥，被拽着往上带
  suck(x, y, z, R, color, k = 1) {
    for (let i = 0; i < Math.round(22 * k); i++) {
      const a = Math.random() * Math.PI * 2, d = Math.random() * R * 0.75;
      this.mud.emit(x + Math.cos(a) * d, y + 0.05 + Math.random() * 0.2, z + Math.sin(a) * d, Math.cos(a) * 0.4, 0.7 + Math.random() * 1.0, Math.sin(a) * 0.4, 3 + Math.random() * 3, (0.5 + Math.random() * 0.4) * (0.8 + 0.4 * k), color[0] * 0.8, color[1] * 0.78, color[2] * 0.75, 0.7, 2.0, 1.4, 0.15, 0.02);
    }
  }
  // 破水而出（B11）：网圈顶开水面，水冠往上翻（跟着网的速度一起走）
  breach(x, z, R, vy, k = 1) {
    const S = this.spray;
    for (let i = 0; i < Math.round(40 * (0.7 + 0.3 * k)); i++) {
      const a = (i + Math.random()) / 40 * Math.PI * 2, out = 0.6 + Math.random() * 1.6;
      S.emit(x + Math.cos(a) * R * (0.9 + Math.random() * 0.2), 0.05, z + Math.sin(a) * R * (0.9 + Math.random() * 0.2),
        Math.cos(a) * out, vy * (0.55 + Math.random() * 0.5) + 1.0, Math.sin(a) * out, 0.6 + Math.random() * 0.4, 0.13 + Math.random() * 0.14, 0.93, 0.97, 0.98, 1, -0.3, 0.6, 9.8, 0);
    }
    for (let i = 0; i < 18; i++) {
      const a = Math.random() * Math.PI * 2, d = Math.random() * R * 0.8;
      S.emit(x + Math.cos(a) * d, 0.06, z + Math.sin(a) * d, Math.cos(a) * 0.8, vy * 0.6 + 1.5 + Math.random() * 1.5, Math.sin(a) * 0.8, 0.5 + Math.random() * 0.3, 0.1 + Math.random() * 0.08, 0.95, 0.98, 1.0, 1, -0.2, 0.5, 9.8, 0);
    }
  }
  // 网兜出水时，水从网眼里哗地泄下来（带泥色）：从整个网兜的面上往下浇（网圈 yTop 到兜底 yBot，越往下兜越窄），
  // 一股股往下掉，落回水面就没了。从网兜四周浇下来，斜着看、正上方看都看得见
  pour(x, yTop, yBot, z, R, n, color, mud = 0.35) {
    const c0 = 0.88 - mud * 0.3;
    for (let i = 0; i < n; i++) {
      const u = Math.random() ** 0.7, y = yTop + (yBot - yTop) * u, r = R * (0.95 - 0.6 * u) * (0.85 + Math.random() * 0.2);
      if (y < 0.03) continue;
      const a = Math.random() * Math.PI * 2, c = Math.random() < mud ? 1 : 0, o = 0.25 + Math.random() * 0.4;
      this.spray.emit(x + Math.cos(a) * r, y, z + Math.sin(a) * r, Math.cos(a) * o, -0.4 - Math.random() * 1.2, Math.sin(a) * o, 1.4, 0.07 + Math.random() * 0.08,
        c ? color[0] * 1.1 : c0, c ? color[1] * 1.1 : c0 + 0.06, c ? color[2] * 1.1 : c0 + 0.08, 0.95, 0, 0.1, 9.8, 0);
    }
  }
  // 泄下来的水砸在水面上，溅起几颗
  splashBack(x, z, R, n) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, d = R * Math.sqrt(Math.random());
      this.spray.emit(x + Math.cos(a) * d, 0.05, z + Math.sin(a) * d, (Math.random() - 0.5) * 1.4, 0.8 + Math.random() * 1.4, (Math.random() - 0.5) * 1.4, 0.35 + Math.random() * 0.2, 0.05 + Math.random() * 0.04, 0.92, 0.97, 0.99, 0.9, 0, 0.4, 9.8, 0);
    }
  }
}

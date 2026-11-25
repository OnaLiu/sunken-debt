// 烟囱的烟：硬边的像素烟团，写深度——后期的水面、天空处理把它当成实物，不会把它抹掉（普通半透明粒子在天空前会被整块盖掉）。
// 淡出用抖动镂空，和像素画风一致。开船冒淡烟（烧油看得见），油见底靠备用油柜时冒一顿一顿的黑烟。
import * as THREE from 'three';

export class Smoke {
  constructor(scene, uScale, max = 220) {
    this.max = max; this.n = 0;
    this.pos = new Float32Array(max * 3); this.vel = new Float32Array(max * 3);
    this.col = new Float32Array(max * 4); this.base = new Float32Array(max * 4);
    this.size = new Float32Array(max); this.size0 = new Float32Array(max); this.grow = new Float32Array(max);
    this.life = new Float32Array(max); this.age = new Float32Array(max);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    g.setAttribute('aCol', new THREE.BufferAttribute(this.col, 4));
    g.setAttribute('aSize', new THREE.BufferAttribute(this.size, 1));
    g.setDrawRange(0, 0);
    this.geo = g;
    const mat = new THREE.ShaderMaterial({
      uniforms: { uScale: uScale || { value: 540 } },
      vertexShader: /* glsl */`
        attribute vec4 aCol; attribute float aSize; uniform float uScale;
        varying vec4 vCol;
        void main() {
          vCol = aCol;
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = max(1.0, aSize * uScale / -mv.z);
        }`,
      fragmentShader: /* glsl */`
        varying vec4 vCol;
        void main() {
          vec2 q = gl_PointCoord - 0.5;
          float d = dot(q, q) * 4.0;
          if (d > 1.0) discard;
          // 抖动镂空：越淡、越靠边，镂掉的像素越多
          float th = fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715))));
          if (vCol.a * (1.15 - d * 0.6) < th) discard;
          gl_FragColor = vec4(vCol.rgb * (1.0 - d * 0.25), 1.0);
          #include <colorspace_fragment>
        }`,
    });
    this.points = new THREE.Points(g, mat);
    this.points.frustumCulled = false;
    scene.add(this.points);
  }
  emit(x, y, z, vx, vy, vz, life, size, r, g, b, a, grow = 1.5) {
    let i = this.n;
    if (i >= this.max) i = Math.floor(Math.random() * this.max); else this.n++;
    this.pos.set([x, y, z], i * 3); this.vel.set([vx, vy, vz], i * 3);
    this.base.set([r, g, b, a], i * 4);
    this.life[i] = life; this.age[i] = 0; this.size0[i] = size; this.grow[i] = grow;
  }
  update(dt) {
    let i = 0;
    while (i < this.n) {
      this.age[i] += dt;
      if (this.age[i] >= this.life[i]) {
        const j = --this.n;
        if (i !== j) {
          this.pos.copyWithin(i * 3, j * 3, j * 3 + 3); this.vel.copyWithin(i * 3, j * 3, j * 3 + 3); this.base.copyWithin(i * 4, j * 4, j * 4 + 4);
          this.life[i] = this.life[j]; this.age[i] = this.age[j]; this.size0[i] = this.size0[j]; this.grow[i] = this.grow[j];
        }
        continue;
      }
      const dr = Math.exp(-0.9 * dt);
      for (let k = 0; k < 3; k++) { this.vel[i * 3 + k] *= dr; this.pos[i * 3 + k] += this.vel[i * 3 + k] * dt; }
      this.vel[i * 3 + 1] += 0.25 * dt; // 热烟往上走
      const t = this.age[i] / this.life[i];
      this.size[i] = this.size0[i] * (1 + this.grow[i] * Math.sqrt(t));
      this.col.set([this.base[i * 4], this.base[i * 4 + 1], this.base[i * 4 + 2], this.base[i * 4 + 3] * (t < 0.08 ? t / 0.08 : 1 - (t - 0.08) / 0.92)], i * 4);
      i++;
    }
    this.geo.setDrawRange(0, this.n);
    if (this.n || this.wasN) {
      this.geo.attributes.position.needsUpdate = true; this.geo.attributes.aCol.needsUpdate = true; this.geo.attributes.aSize.needsUpdate = true;
    }
    this.wasN = this.n;
  }
}

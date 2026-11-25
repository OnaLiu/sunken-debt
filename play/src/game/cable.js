// 吊索（B9 收紧）：臂端滑轮到网架顶的一根钢缆，分成十几段，能松、能绷、能抖。
//   网挂着、往下放：绷着（网架的分量吊在上面），只随水流轻轻晃
//   网架搁在海底、网口收紧的那一秒：松下来，往水流那边弯出一个肚子
//   绞车一吃上劲：一下绷直，整根抖两下（pluck），水面以上那段甩下一串水珠
// 别处要它抖一下（例如碰到硬物）也调 pluck(幅度)。
import * as THREE from 'three';
import { basicWaterMat } from '../render/materials.js';

const SEG = 18, SIDES = 4, RAD = 0.035;

export class Cable {
  constructor(scene) {
    const g = new THREE.BufferGeometry();
    this.pos = new Float32Array((SEG + 1) * SIDES * 3);
    g.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    const idx = [];
    for (let i = 0; i < SEG; i++) for (let k = 0; k < SIDES; k++) {
      const a = i * SIDES + k, b = i * SIDES + (k + 1) % SIDES, c = a + SIDES, d = b + SIDES;
      idx.push(a, c, b, b, c, d);
    }
    g.setIndex(idx);
    this.mesh = new THREE.Mesh(g, basicWaterMat(0x1a1c1c, { key: 'cable', side: THREE.DoubleSide }));
    this.mesh.frustumCulled = false;
    scene.add(this.mesh);
    this.slack = 0;      // 0 绷着 … 1 松到底
    this.slackWant = 0;
    this.vib = [];       // 正在抖的：{ amp, t, f, mode }
    this.side = new THREE.Vector3(1, 0, 0);
    this.t = 0;
    this.pts = Array.from({ length: SEG + 1 }, () => new THREE.Vector3());
  }
  // 松（网架搁在底上）/ 绷（吃上劲）
  setSlack(on) { this.slackWant = on ? 1 : 0; }
  // 抖一下：amp 米（中段最大），f 次每秒
  pluck(amp = 0.14, f = 7) { this.vib.push({ amp, t: 0, f, mode: 1 }); this.vib.push({ amp: amp * 0.45, t: 0, f: f * 2.1, mode: 2 }); if (this.vib.length > 6) this.vib.splice(0, 2); }
  // a：臂端（上），b：网架顶（下）；current：水流方向（x, z），肚子往那边弯
  update(dt, a, b, current) {
    this.t += dt;
    // 松得慢（网架落定、缆绳一节节放下来），绷得快（绞车一下吃上劲）
    const k = this.slackWant > this.slack ? 2.2 : 14;
    this.slack += (this.slackWant - this.slack) * Math.min(1, dt * k);
    for (const v of this.vib) v.t += dt;
    this.vib = this.vib.filter((v) => v.t < 1.6);
    const L = Math.max(0.05, a.distanceTo(b));
    // 弯的方向：水平面里垂直于缆绳、偏向水流
    const cx = current ? current.x : 0.5, cz = current ? current.y : 0.2, cl = Math.hypot(cx, cz) || 1;
    this.side.set(cx / cl, 0, cz / cl);
    const belly = this.slack * Math.min(0.75, 0.06 + L * 0.05);
    for (let i = 0; i <= SEG; i++) {
      const s = i / SEG, P = this.pts[i];
      P.lerpVectors(a, b, s);
      const bow = Math.sin(Math.PI * s);
      // 松：往水流那边鼓、往下塌一点
      P.addScaledVector(this.side, belly * bow);
      P.y -= belly * 0.55 * bow;
      // 绷着也有一点点晃（水流推着）
      P.x += Math.sin(this.t * 1.7 + s * 3) * 0.02 * bow; P.z += Math.cos(this.t * 1.3 + s * 2) * 0.02 * bow;
      for (const v of this.vib) {
        const e = v.amp * Math.exp(-v.t * 3.2) * Math.sin(v.t * v.f * Math.PI * 2) * Math.sin(Math.PI * s * v.mode);
        P.addScaledVector(this.side, e); P.y += e * 0.35;
      }
    }
    // 每一节画成一根四棱的细管
    const up = new THREE.Vector3(), t0 = new THREE.Vector3(), n1 = new THREE.Vector3(), n2 = new THREE.Vector3();
    for (let i = 0; i <= SEG; i++) {
      const P = this.pts[i], Q = this.pts[Math.min(SEG, i + 1)], O = this.pts[Math.max(0, i - 1)];
      t0.subVectors(Q, O).normalize();
      up.set(0, 1, 0); if (Math.abs(t0.y) > 0.9) up.set(1, 0, 0);
      n1.crossVectors(t0, up).normalize(); n2.crossVectors(t0, n1).normalize();
      for (let k = 0; k < SIDES; k++) {
        const ang = k / SIDES * Math.PI * 2, c = Math.cos(ang) * RAD, sn = Math.sin(ang) * RAD, o = (i * SIDES + k) * 3;
        this.pos[o] = P.x + n1.x * c + n2.x * sn; this.pos[o + 1] = P.y + n1.y * c + n2.y * sn; this.pos[o + 2] = P.z + n1.z * c + n2.z * sn;
      }
    }
    this.mesh.geometry.attributes.position.needsUpdate = true;
  }
  // 中间一点（甩水用）
  point(s, out) { const i = Math.round(s * SEG); return out.copy(this.pts[Math.max(0, Math.min(SEG, i))]); }
}

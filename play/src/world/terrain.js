// 地形分块网格：1 m 采样，按焦点加载；底质决定颜色与着色器细节（沙纹、泥斑、礁壳）
import * as THREE from 'three';
import { heightAt, biomeAt } from './layout.js';
import { patchMaterial } from '../render/materials.js';
import { fbm, smooth } from '../core/noise.js';

export const CHUNK = 48;
const RES = 1;

const C_SAND = new THREE.Color(0xe6dbbd);
const C_SAND2 = new THREE.Color(0xcdbf98);
const C_MUD = new THREE.Color(0x4a4236);
const C_ROCK = new THREE.Color(0xd9d6c8);
const C_ROCK2 = new THREE.Color(0x8d8a7c);
const C_GRASSB = new THREE.Color(0x8f9a62);
const C_LAND = new THREE.Color(0x6f8a4a);
const C_BEACH = new THREE.Color(0xe2d3a6);
const C_CLIFF = new THREE.Color(0x857a68);

export function terrainMaterial() {
  const m = new THREE.MeshLambertMaterial({ vertexColors: true });
  patchMaterial(m, {
    key: 'terrain',
    vertexPars: 'attribute vec4 aSurf; varying vec4 vSurf;',
    vertex: '#include <begin_vertex>\nvSurf = aSurf;',
    fragPars: 'varying vec4 vSurf; uniform vec2 uCurrent;',
    frag: /* glsl */`{
  vec2 p = vWPos.xz;
  // 沙纹：垂直于海流方向，带扭曲
  vec2 cd = normalize(uCurrent + vec2(0.001));
  float warp = vn3(vec3(p * 0.15, 0.0)) * 3.0;
  float rip = sin(dot(p, cd) * 2.6 + warp * 2.0);
  rip = smoothstep(-0.2, 1.0, rip);
  float sandish = vSurf.x * (1.0 - smoothstep(-22.0, -30.0, vWPos.y) * 0.5);
  diffuseColor.rgb *= 1.0 + (rip - 0.5) * 0.16 * sandish;
  // 颗粒
  float g = vn3(vec3(p * 3.0, 1.0));
  diffuseColor.rgb *= 1.0 + (g - 0.5) * 0.12;
  // 泥：暗斑与细小反光
  float mm = vn3(vec3(p * 0.6, 3.0));
  diffuseColor.rgb *= 1.0 - vSurf.y * smoothstep(0.55, 0.8, mm) * 0.25;
  // 礁壳：白斑
  float cr = vn3(vec3(p * 1.4, 5.0));
  diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.92, 0.9, 0.82), vSurf.z * smoothstep(0.6, 0.75, cr) * 0.5);
  // 草床底下的暗绿根层
  diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(0.72, 0.85, 0.6), vSurf.w * smoothstep(0.3, 0.7, vn3(vec3(p * 0.9, 9.0))));
}`,
  });
  return m;
}

export function buildChunk(cx, cz, mat) { const it = buildChunkSteps(cx, cz, mat); let r; while (!(r = it.next()).done); return r.value; }
// 可分帧：每算完几行 yield 一次，最后返回网格
export function* buildChunkSteps(cx, cz, mat) {
  const n = CHUNK / RES + 1;
  const x0 = cx * CHUNK, z0 = cz * CHUNK;
  const H = new Float32Array((n + 2) * (n + 2));
  for (let j = -1; j <= n; j++) {
    for (let i = -1; i <= n; i++) H[(j + 1) * (n + 2) + (i + 1)] = heightAt(x0 + i * RES, z0 + j * RES);
    if ((j & 7) === 7) yield;
  }
  const hAt = (i, j) => H[(j + 1) * (n + 2) + (i + 1)];
  const pos = new Float32Array(n * n * 3), nor = new Float32Array(n * n * 3), colr = new Float32Array(n * n * 3), surf = new Float32Array(n * n * 4);
  const c = new THREE.Color();
  let minY = 1e9, maxY = -1e9;
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
    if (i === 0 && (j & 7) === 7) yield;
    const k = j * n + i;
    const x = x0 + i * RES, z = z0 + j * RES, y = hAt(i, j);
    pos[k * 3] = x; pos[k * 3 + 1] = y; pos[k * 3 + 2] = z;
    minY = Math.min(minY, y); maxY = Math.max(maxY, y);
    const dx = hAt(i + 1, j) - hAt(i - 1, j), dz = hAt(i, j + 1) - hAt(i, j - 1);
    const nl = Math.hypot(dx, 2 * RES, dz);
    nor[k * 3] = -dx / nl; nor[k * 3 + 1] = 2 * RES / nl; nor[k * 3 + 2] = -dz / nl;
    const slope = 1 - nor[k * 3 + 1];
    if (y > -0.4) {
      // 陆地
      const beach = 1 - smooth(0.4, 2.4, y);
      c.copy(C_LAND).lerp(C_CLIFF, smooth(0.08, 0.3, slope)).lerp(C_BEACH, beach);
      c.multiplyScalar(0.9 + fbm(x * 0.1, z * 0.1, 2) * 0.2);
      surf[k * 4] = beach; surf[k * 4 + 1] = 0; surf[k * 4 + 2] = 0; surf[k * 4 + 3] = 0;
    } else {
      const b = biomeAt(x, z, y);
      const v = fbm(x * 0.07, z * 0.07, 2);
      c.copy(C_SAND).lerp(C_SAND2, 0.5 + v * 0.8);
      c.lerp(C_MUD, b[1]);
      const rk = Math.max(b[2], smooth(0.25, 0.55, slope) * 0.8);
      c.lerp(C_ROCK.clone().lerp(C_ROCK2, smooth(0.1, 0.6, slope) * 0.6 + (b[1] > 0.4 ? 0.5 : 0)), rk);
      c.lerp(C_GRASSB, b[3] * 0.55);
      surf[k * 4] = b[0]; surf[k * 4 + 1] = b[1]; surf[k * 4 + 2] = rk; surf[k * 4 + 3] = b[3];
    }
    colr[k * 3] = c.r; colr[k * 3 + 1] = c.g; colr[k * 3 + 2] = c.b;
  }
  const idx = [];
  for (let j = 0; j < n - 1; j++) for (let i = 0; i < n - 1; i++) {
    const a = j * n + i, b = a + 1, d = a + n, e = d + 1;
    if ((i + j) & 1) { idx.push(a, d, b, b, d, e); } else { idx.push(a, d, e, a, e, b); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  g.setAttribute('color', new THREE.BufferAttribute(colr, 3));
  g.setAttribute('aSurf', new THREE.BufferAttribute(surf, 4));
  g.setIndex(idx);
  g.computeBoundingSphere();
  const mesh = new THREE.Mesh(g, mat);
  mesh.receiveShadow = true;
  mesh.castShadow = maxY > -1.0; // 陆地投影
  mesh.userData.chunk = [cx, cz];
  mesh.userData.minY = minY; mesh.userData.maxY = maxY;
  return mesh;
}

export class TerrainManager {
  constructor(scene) {
    this.scene = scene;
    this.mat = terrainMaterial();
    this.chunks = new Map();
    this.group = new THREE.Group();
    this.group.name = 'terrain';
    scene.add(this.group);
    this.radius = 200;
    this.onChunk = null;      // (cx, cz, ch) 新块回调：布置草、石（同步）
    this.chunkExtras = null;  // (cx, cz, ch) 同上的分帧版本（生成器，返回要加入场景的物体）
    this.want = [];
    this.cur = null;          // 正在分帧生成的块
  }
  key(cx, cz) { return cx + ',' + cz; }
  // 登记焦点附近缺的块（由近到远）；budget > 0 时当场生成这么多块
  update(fx, fz, budget = 0) {
    const r = this.radius;
    const c0x = Math.floor((fx - r) / CHUNK), c1x = Math.floor((fx + r) / CHUNK);
    const c0z = Math.floor((fz - r) / CHUNK), c1z = Math.floor((fz + r) / CHUNK);
    const want = [];
    for (let cz = c0z; cz <= c1z; cz++) for (let cx = c0x; cx <= c1x; cx++) {
      const mx = (cx + 0.5) * CHUNK, mz = (cz + 0.5) * CHUNK;
      const d = Math.hypot(mx - fx, mz - fz);
      if (d > r + CHUNK * 0.71) continue;
      const k = this.key(cx, cz);
      if (!this.chunks.has(k)) want.push([d, cx, cz, k]);
    }
    want.sort((a, b) => a[0] - b[0]);
    let built = 0;
    for (const [, cx, cz, k] of want) {
      if (built >= budget) break;
      if (this.cur && this.cur.k === k) this.cur = null;
      const m = buildChunk(cx, cz, this.mat);
      const ch = { mesh: m, cx, cz, extras: [] };
      if (this.onChunk) this.onChunk(cx, cz, ch);
      this.addChunk(k, ch);
      built++;
    }
    this.want = built ? want.slice(built) : want;
    // 卸载远处（状态不在这里，只是渲染）
    for (const [k, ch] of this.chunks) {
      const mx = (ch.cx + 0.5) * CHUNK, mz = (ch.cz + 0.5) * CHUNK;
      if (Math.hypot(mx - fx, mz - fz) > r + CHUNK * 2.2) {
        this.group.remove(ch.mesh); ch.mesh.geometry.dispose();
        for (const e of ch.extras) { e.parent && e.parent.remove(e); e.geometry && e.geometry.dispose(); }
        this.chunks.delete(k);
      }
    }
    if (this.cur) { const mx = (this.cur.cx + 0.5) * CHUNK, mz = (this.cur.cz + 0.5) * CHUNK; if (Math.hypot(mx - fx, mz - fz) > r + CHUNK * 2.2) this.cur = null; }
    return this.want.length;
  }
  addChunk(k, ch) {
    this.group.add(ch.mesh);
    for (const e of ch.extras) if (!e.parent) this.scene.add(e);
    this.chunks.set(k, ch);
  }
  pending() { return this.want.length + (this.cur ? 1 : 0); }
  // 下一块要分帧生成的地形（blocked(x, z)：与它重叠的海域还没生成完，先等）
  nextJob(fx, fz, blocked) {
    if (!this.cur) {
      for (const [d, cx, cz, k] of this.want) {
        if (this.chunks.has(k)) continue;
        if (blocked && blocked((cx + 0.5) * CHUNK, (cz + 0.5) * CHUNK)) continue;
        const self = this;
        const gen = (function* () {
          const mesh = yield* buildChunkSteps(cx, cz, self.mat);
          const ch = { mesh, cx, cz, extras: [] };
          if (self.chunkExtras) ch.extras = yield* self.chunkExtras(cx, cz, ch);
          else if (self.onChunk) self.onChunk(cx, cz, ch);
          return ch;
        })();
        this.cur = { cx, cz, k, d, gen, step: () => this.stepCur() };
        break;
      }
    }
    return this.cur;
  }
  stepCur() {
    const c = this.cur;
    if (!c) return true;
    const r = c.gen.next();
    if (r.done) {
      this.cur = null;
      if (!this.chunks.has(c.k)) this.addChunk(c.k, r.value);
      this.want = this.want.filter((w) => w[3] !== c.k);
      return true;
    }
    return false;
  }
}

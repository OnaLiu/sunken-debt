// 海草（随海流与扰动摆动）、礁石、海星海胆等：按地形块布置的实例化网格
import * as THREE from 'three';
import { patchMaterial, instancedDepthMaterial } from '../render/materials.js';
import { biomeAt, heightAt } from './layout.js';
import { CHUNK } from './terrain.js';
import { RNG, hash2 } from '../core/rng.js';
import { rock } from '../core/geo.js';
import { fbm } from '../core/noise.js';

let grassGeo, grassMat, rockGeos, rockMat, starGeo, starMat;

function initShared() {
  if (grassGeo) return;
  // 叶片：高度归一（0..1），沿 +y，渐细
  // 叶片中段略宽、梢头收尖、整片往一侧微弯（不是一根直条）
  const segs = 5, pos = [], idx = [];
  for (let i = 0; i <= segs; i++) {
    const t = i / segs, w = 0.5 * (0.75 + Math.sin(t * Math.PI) * 0.45) * (1 - t * 0.8), bend = t * t * 0.18;
    pos.push(-w + bend, t, bend * 0.6, w + bend, t, bend * 0.6);
  }
  for (let i = 0; i < segs; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  grassGeo = new THREE.BufferGeometry();
  grassGeo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  grassGeo.setIndex(idx);
  grassGeo.computeVertexNormals();
  grassMat = new THREE.MeshLambertMaterial({ side: THREE.DoubleSide });
  patchMaterial(grassMat, {
    key: 'grass',
    // 根部暗、梢头亮一点（透光的嫩叶），叶缘比叶心暗
    frag: /* glsl */`{
  float ty = clamp(vOPos.y, 0.0, 1.0);
  diffuseColor.rgb *= mix(0.5, 1.28, ty);
  diffuseColor.rgb += vec3(0.05, 0.07, 0.0) * smoothstep(0.55, 1.0, ty);
  diffuseColor.rgb *= 1.0 - 0.25 * smoothstep(0.2, 0.5, abs(vOPos.x - ty * ty * 0.18) / max(0.05, 0.5 * (1.0 - ty * 0.8)));
}`,
    vertex: /* glsl */`
vec3 transformed = vec3(position);
#ifdef USE_INSTANCING
{
  vec3 ip = vec3(instanceMatrix[3][0], instanceMatrix[3][1], instanceMatrix[3][2]);
  float k = position.y * position.y;
  vec2 cur = uCurrent * (0.55 + 0.45 * sin(uTime * 1.1 + ip.x * 0.37 + ip.z * 0.23)) + vec2(sin(uTime * 1.7 + ip.z * 1.3), cos(uTime * 1.3 + ip.x * 1.1)) * 0.1;
  // 一道涌从头顶经过（A4，materials.js 的 surgeAt）：整片草顺着它往前一倒再回来，梢头抖一阵；浅处最明显
  float sg = surgeAt(ip.xz) * (1.0 - smoothstep(5.0, 14.0, -ip.y));
  cur += vec2(0.8, 0.6) * (sg - 0.18) * 0.95 + vec2(sin(uTime * 6.3 + ip.x * 2.9), cos(uTime * 5.7 + ip.z * 3.1)) * 0.09 * sg;
  for (int i = 0; i < 6; i++) {
    vec2 d = ip.xz - uDist[i].xy;
    float r = max(uDist[i].w, 0.1);
    float s = uDist[i].z * exp(-dot(d, d) / (r * r));
    cur += normalize(d + vec2(0.001, 0.0)) * s * 1.4;
  }
  vec3 wd = vec3(cur.x, -length(cur) * 0.4, cur.y) * k;
  // 网架压过的那一圈：叶片绕根部往外倒伏（不是梢头被推开），网口里整片趴下，网口外一两米里越远倒得越少
  for (int i = 0; i < 2; i++) {
    vec2 dp = ip.xz - uPress[i].xy;
    float dl = length(dp), R = uPress[i].w;
    float p = uPress[i].z * (1.0 - smoothstep(R * 0.8, R * 1.95, dl));
    if (p > 0.001) {
      vec2 dir = dl > 0.02 ? dp / dl : vec2(0.7071, 0.7071);
      float H = length(instanceMatrix[1].xyz);
      float t = position.y;
      float th = p * 1.32 * (0.45 + 0.55 * t);
      wd *= 1.0 - 0.85 * p;
      wd += vec3(dir.x * sin(th), cos(th) - 1.0, dir.y * sin(th)) * t * H;
    }
  }
  transformed += inverse(mat3(instanceMatrix)) * wd;
}
#endif`,
  });
  const r = new RNG(77);
  rockGeos = [rock(1, r, 1, 0.6), rock(1, r, 1, 0.75), rock(1, r, 0, 0.5)];
  rockMat = new THREE.MeshLambertMaterial({ flatShading: true });
  // 礁石：顶上落着一层细沙、背阴的下半截发暗，零星几块藻斑
  patchMaterial(rockMat, { key: 'rock', frag: /* glsl */`{
  float up = smoothstep(0.12, 0.5, vOPos.y);
  diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * 0.45 + vec3(0.36, 0.34, 0.27), up * 0.55);
  diffuseColor.rgb *= 0.78 + 0.22 * smoothstep(-0.45, 0.1, vOPos.y);
  float al = smoothstep(0.62, 0.72, vn3(vOPos * 4.2 + 2.0));
  diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.16, 0.24, 0.14), al * 0.5 * (1.0 - up));
}` });
  // 海星（五角）
  const sg = new THREE.CylinderGeometry(0.16, 0.16, 0.04, 10);
  const p = sg.attributes.position;
  for (let i = 0; i < p.count; i++) { const a = Math.atan2(p.getZ(i), p.getX(i)); const rr = Math.hypot(p.getX(i), p.getZ(i)); const f = 0.45 + 0.55 * Math.pow(Math.abs(Math.cos(a * 2.5)), 2); p.setX(i, Math.cos(a) * rr * f); p.setZ(i, Math.sin(a) * rr * f); }
  sg.computeVertexNormals();
  starGeo = sg;
  starMat = new THREE.MeshLambertMaterial({ flatShading: true });
  patchMaterial(starMat, { key: 'star' });
}

// 为一个地形块生成海草/礁石；blocked(x,z) 由世界提供（沉船、物件附近不长草）
const UP = new THREE.Vector3(0, 1, 0);
export function decorateChunk(cx, cz, ch, world) { const it = decorateChunkSteps(cx, cz, ch, world); let r; while (!(r = it.next()).done); return r.value; }
// 可分帧：每扫一批采样点 yield 一次，最后返回要加入场景的草、石、海星
export function* decorateChunkSteps(cx, cz, ch, world) {
  initShared();
  const rng = new RNG(hash2(cx * 7919 + 13, cz * 104729 + 7));
  const x0 = cx * CHUNK, z0 = cz * CHUNK;
  const grass = [];
  const rocks = [];
  const stars = [];
  const step = 0.75;
  for (let gz = 0; gz < CHUNK; gz += step) for (let gx = 0; gx < CHUNK; gx += step) {
    if (gx === 0 && (gz / step) % 6 === 5) yield;
    const x = x0 + gx + rng.range(-0.3, 0.3), z = z0 + gz + rng.range(-0.3, 0.3);
    const h = heightAt(x, z);
    if (h > -1.2) continue;
    const b = biomeAt(x, z, h);
    let gw = b[3];
    const cov = world.coverAt(x, z);
    if (cov > 0) gw = Math.max(gw, 0.9);
    if (gw > 0.18 && rng.next() < gw * 0.9 * (cov > 0 ? 3 : 1)) {
      if (cov <= 0 && world.blockedForFlora(x, z)) continue;
      const n = 2 + Math.floor(rng.next() * 4 * gw);
      for (let k = 0; k < n; k++) grass.push(x + rng.range(-0.25, 0.25), h - 0.05, z + rng.range(-0.25, 0.25), 0.55 + rng.next() * 0.9 * (0.5 + gw), rng.next() * Math.PI, rng.next());
    }
    if (rng.next() < 0.012 + b[2] * 0.05 && !world.blockedForFlora(x, z, 1.5)) {
      const s = 0.25 + rng.next() * (b[2] > 0.4 ? 1.6 : 0.7);
      rocks.push([x, h - s * 0.25, z, s, rng.next() * 6, b[2] > 0.4 ? 1 : b[1] > 0.5 ? 2 : 0]);
    }
    if (rng.next() < 0.004 && b[0] > 0.4 && !world.blockedForFlora(x, z, 0.6)) stars.push([x, h + 0.01, z, rng.next() * 6, rng.next()]);
  }
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), s3 = new THREE.Vector3(), p3 = new THREE.Vector3(), c = new THREE.Color();
  const out = [];
  if (grass.length) {
    const im = new THREE.InstancedMesh(grassGeo, grassMat, grass.length / 6);
    for (let i = 0; i < grass.length / 6; i++) {
      const x = grass[i * 6], y = grass[i * 6 + 1], z = grass[i * 6 + 2], hgt = grass[i * 6 + 3], rot = grass[i * 6 + 4], cv = grass[i * 6 + 5];
      q.setFromAxisAngle(UP, rot);
      m4.compose(p3.set(x, y, z), q, s3.set(0.09 + cv * 0.05, hgt, 1));
      im.setMatrixAt(i, m4);
      c.setHSL(0.22 + cv * 0.08, 0.45 + cv * 0.2, 0.28 + cv * 0.14);
      im.setColorAt(i, c);
    }
    im.instanceMatrix.needsUpdate = true;
    im.frustumCulled = false;
    out.push(im);
  }
  if (rocks.length) {
    for (let v = 0; v < rockGeos.length; v++) {
      const sub = rocks.filter((r, i) => i % rockGeos.length === v);
      if (!sub.length) continue;
      const im = new THREE.InstancedMesh(rockGeos[v], rockMat, sub.length);
      sub.forEach(([x, y, z, s, rot, kind], i) => {
        q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), rot);
        m4.compose(p3.set(x, y, z), q, s3.set(s, s * (0.7 + (i % 3) * 0.15), s * 1.1));
        im.setMatrixAt(i, m4);
        if (kind === 1) c.setRGB(0.7, 0.68, 0.6); else if (kind === 2) c.setRGB(0.12, 0.11, 0.1); else c.setRGB(0.24, 0.23, 0.2);
        c.multiplyScalar(0.85 + (i % 5) * 0.06);
        im.setColorAt(i, c);
      });
      im.castShadow = true; im.receiveShadow = true; im.customDepthMaterial = instancedDepthMaterial();
      im.userData.rocks = sub.map(([x, y, z, sc]) => [x, y, z, sc]);
      out.push(im);
    }
  }
  if (stars.length) {
    const im = new THREE.InstancedMesh(starGeo, starMat, stars.length);
    stars.forEach(([x, y, z, rot, cv], i) => {
      q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), rot);
      m4.compose(p3.set(x, y, z), q, s3.set(1, 1, 1));
      im.setMatrixAt(i, m4);
      c.setHSL(0.02 + cv * 0.06, 0.6, 0.45); im.setColorAt(i, c);
    });
    out.push(im);
  }
  return out;
}

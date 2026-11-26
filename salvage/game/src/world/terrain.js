import * as THREE from 'three';
import { clamp } from '../util/math.js';
import { seabedY, seabedColor, TERRAIN_BOUNDS, GROUND_SITE, LANE_BUOYS } from '../sea/index.js';
import { toon } from '../render/materials.js';
import { texture, pixels } from '../assets/assets.js';
import { GROUND } from './seabedkit.js';

// 海底，全游戏一份：网格怎么铺、地贴图怎么接、法线、航路浮标的样子。
// 海底多高、什么颜色、铺多大、浮标摆在哪是这片海的（sea/<海>/seabed.js、layout.js）：
// 从这里拿到的 seabedY、seabedColor 就是当前这片海的，共用的系统都从这里问海底多高。
export { seabedY, seabedColor, TERRAIN_BOUNDS };

export function seabedNormal(x, z, e = 0.35) {
  const hx = seabedY(x + e, z) - seabedY(x - e, z);
  const hz = seabedY(x, z + e) - seabedY(x, z - e);
  const n = new THREE.Vector3(-hx, 2 * e, -hz);
  return n.normalize();
}

// ——— 海底的地贴图：顶点色定大块，贴图只给颗粒 ———
// 平铺的沙底、泥底各一张（24 米一张），沉船场地一整张（x −14…34、z −8…40）；图的上边是北。
// 颜色接法（notes.md「换素材那一轮再加一条」）：贴图不直接当颜色铺，除以它自己低频的那一层（约 4 米糊开），
// 只剩颗粒、碎壳、浅坑、沟这些细节，乘到顶点色上；三张一样处理，场地图边上和平铺的混过去，接不出边
// （平铺的那几片 3～6 米的亮暗斑也除掉了：大块的亮暗归顶点色，留着它场地边上会接出一道）。没有素材就是 null，照旧用代码的斑点。
const GROUND_TILE = 24; // 平铺一张多少米（素材单子定的）
const LOW_CELL = 0.75; // 低频那一层一格多少米，再横竖各糊三遍（盒子半径 5 格），约 4 米

// 一张贴图低频的那一层：先按格子取平均，再糊开；线性插值着读。wrap：平铺的那两张四边接着糊
function lowOf(px, meters, wrap) {
  const N = Math.round(meters / LOW_CELL), cw = px.w / N, ch = px.h / N, d = px.data;
  let a = new Float32Array(N * N * 3);
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    let r = 0, g = 0, b = 0, n = 0;
    for (let y = Math.floor(j * ch); y < Math.floor((j + 1) * ch); y += 2) for (let x = Math.floor(i * cw); x < Math.floor((i + 1) * cw); x += 2) {
      const k = (y * px.w + x) * 4; r += d[k]; g += d[k + 1]; b += d[k + 2]; n++;
    }
    const o = (j * N + i) * 3; a[o] = r / n; a[o + 1] = g / n; a[o + 2] = b / n;
  }
  const R = 5, tmp = new Float32Array(a.length);
  const pass = (src, dst, dx, dy) => {
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) for (let c = 0; c < 3; c++) {
      let s = 0;
      for (let k = -R; k <= R; k++) {
        const ii = wrap ? (i + k * dx + N) % N : clamp(i + k * dx, 0, N - 1), jj = wrap ? (j + k * dy + N) % N : clamp(j + k * dy, 0, N - 1);
        s += src[(jj * N + ii) * 3 + c];
      }
      dst[(j * N + i) * 3 + c] = s / (2 * R + 1);
    }
  };
  for (let t = 0; t < 3; t++) { pass(a, tmp, 1, 0); pass(tmp, a, 0, 1); }
  const u8 = new Uint8Array(N * N * 4);
  for (let k = 0; k < N * N; k++) { u8[k * 4] = a[k * 3]; u8[k * 4 + 1] = a[k * 3 + 1]; u8[k * 4 + 2] = a[k * 3 + 2]; u8[k * 4 + 3] = 255; }
  const t = new THREE.DataTexture(u8, N, N, THREE.RGBAFormat);
  t.colorSpace = THREE.NoColorSpace;
  t.magFilter = t.minFilter = THREE.LinearFilter;
  t.wrapS = t.wrapT = wrap ? THREE.RepeatWrapping : THREE.ClampToEdgeWrapping;
  t.needsUpdate = true;
  return t;
}

function groundMaps() {
  const sand = texture(GROUND.sand, true), mud = texture(GROUND.mud, true);
  if (!sand || !mud) return null;
  const site = texture(GROUND.site);
  const S = GROUND_SITE;
  return {
    sand, mud, tile: GROUND_TILE,
    sandLow: lowOf(pixels(GROUND.sand), GROUND_TILE, true), mudLow: lowOf(pixels(GROUND.mud), GROUND_TILE, true),
    site: site || sand, siteLow: site ? lowOf(pixels(GROUND.site), S.size, false) : sand,
    siteRect: new THREE.Vector4(S.x0, S.z0, 1 / S.size, site ? 1 : 0),
  };
}


export function buildTerrain() {
  const B = TERRAIN_BOUNDS;
  const step = 1.0;
  const nx = Math.round((B.x1 - B.x0) / step) + 1;
  const nz = Math.round((B.z1 - B.z0) / step) + 1;
  const pos = new Float32Array(nx * nz * 3);
  const col = new Float32Array(nx * nz * 3);
  const rip = new Float32Array(nx * nz);
  const mudw = new Float32Array(nx * nz);
  const heights = new Float32Array(nx * nz);
  for (let j = 0; j < nz; j++) {
    for (let i = 0; i < nx; i++) {
      const x = B.x0 + i * step, z = B.z0 + j * step;
      const y = seabedY(x, z);
      const k = j * nx + i;
      heights[k] = y;
      pos[k * 3] = x; pos[k * 3 + 1] = y; pos[k * 3 + 2] = z;
      const c = seabedColor(x, z, y);
      col[k * 3] = c[0]; col[k * 3 + 1] = c[1]; col[k * 3 + 2] = c[2];
      rip[k] = c[3];
      mudw[k] = c[4];
    }
  }
  const idx = new Uint32Array((nx - 1) * (nz - 1) * 6);
  let p = 0;
  for (let j = 0; j < nz - 1; j++) {
    for (let i = 0; i < nx - 1; i++) {
      const a = j * nx + i, b = a + 1, c = a + nx, d = c + 1;
      // 交替对角线，减少方向性
      if ((i + j) & 1) { idx[p++] = a; idx[p++] = c; idx[p++] = b; idx[p++] = b; idx[p++] = c; idx[p++] = d; }
      else { idx[p++] = a; idx[p++] = c; idx[p++] = d; idx[p++] = a; idx[p++] = d; idx[p++] = b; }
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  geo.setAttribute('aRipple', new THREE.BufferAttribute(rip, 1));
  geo.setAttribute('aMud', new THREE.BufferAttribute(mudw, 1));
  geo.setIndex(new THREE.BufferAttribute(idx, 1));
  geo.computeVertexNormals();
  const ground = groundMaps();
  const mat = toon({ vertexColors: true, seabed: true, ground });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = false;
  mesh.receiveShadow = true;
  mesh.name = 'terrain';
  return mesh;
}

export function buildLaneBuoys() {
  const group = new THREE.Group();
  const red = toon({ color: 0xc8432f, spec: 0.3 });
  const green = toon({ color: 0x3f8f5a, spec: 0.3 });
  const dark = toon({ color: 0x2c2a28 });
  const buoys = [];
  for (const b of LANE_BUOYS) {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.55, 1.1, 8), b.color === 'red' ? red : green);
    body.position.y = 0.2;
    const top = new THREE.Mesh(b.color === 'red' ? new THREE.ConeGeometry(0.32, 0.7, 8) : new THREE.CylinderGeometry(0.28, 0.28, 0.6, 8), b.color === 'red' ? red : green);
    top.position.y = 1.1;
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.2, 4), dark);
    pole.position.y = 0.9;
    // 锚链：斜着没进水里，几米以下就看不清了
    const chain = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 3.6, 4), dark);
    chain.position.set(0.55, -1.75, 0);
    chain.rotation.z = 0.32;
    g.add(body, top, pole, chain);
    g.position.set(b.x, 0, b.z);
    g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    group.add(g);
    buoys.push(g);
  }
  return { group, buoys };
}

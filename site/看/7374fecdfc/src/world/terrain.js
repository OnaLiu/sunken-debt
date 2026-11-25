import * as THREE from 'three';
import { fbm, vnoise, mulberry32, smoothstep, segDist, clamp } from '../util/math.js';
import { SHOAL, SHOAL_CRABS, WEED_BED, RIDGE, WRECK, DRAG_GROOVE, KEEL_SCRAPE, trenchZ, LANE_BUOYS } from './layout.js';
import { toon } from '../render/materials.js';
import { mergedOf, texture, pixels } from '../assets/assets.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

// 海底高度：返回 y（负数，水面为 0）
// 船头方向 = 把 +x 绕 y 转 yaw：(cos, -sin)
const BX = Math.cos(WRECK.yaw), BZ = -Math.sin(WRECK.yaw);
const SX = Math.sin(WRECK.yaw), SZ = Math.cos(WRECK.yaw); // 右舷方向

export const WRECK_AXES = { bx: BX, bz: BZ, sx: SX, sz: SZ };

function polyDist(px, pz, pts) {
  let d = 1e9, along = 0, best = 0, acc = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, az] = pts[i], [bx, bz] = pts[i + 1];
    const sd = segDist(px, pz, ax, az, bx, bz);
    const len = Math.hypot(bx - ax, bz - az);
    if (sd < d) {
      d = sd;
      const t = clamp(((px - ax) * (bx - ax) + (pz - az) * (bz - az)) / (len * len), 0, 1);
      best = acc + t * len;
    }
    acc += len;
  }
  along = best / acc;
  return { d, t: along };
}

function ridgeHeight(x, z) {
  const R = RIDGE;
  const sd = segDist(x, z, R.ax, R.az, R.bx, R.bz);
  if (sd > 9) return 0;
  // 沿脊方向的位置（用 z 近似）
  let h = (1 - smoothstep(1.5, 8.5, sd + fbm(x * 0.15, z * 0.15, 3, 9) * 3)) * 3.2;
  h *= 0.75 + 0.5 * vnoise(z * 0.12, x * 0.1, 5);
  // 豁口
  const gap = smoothstep(R.gapA - 3, R.gapA, z) * (1 - smoothstep(R.gapB, R.gapB + 3, z));
  h *= 1 - gap * 0.92;
  return h;
}

export function seabedY(x, z) {
  let d = 10.0;
  d += fbm(x * 0.018, z * 0.018, 3, 3) * 1.4;
  d += Math.max(0, z + 10) * 0.15 - Math.max(0, z - 20) * 0.05;
  // 浅滩
  const sdx = x - SHOAL.x, sdz = (z - SHOAL.z) * 1.15;
  d -= 6.1 * Math.exp(-(sdx * sdx + sdz * sdz) / (2 * 15 * 15));
  // 草床略高
  // 深槽
  const tz = trenchZ(x);
  const td = Math.abs(z - tz);
  const tfade = smoothstep(-95, -40, x);
  const tk = 1 - smoothstep(3.0, 21.0, td + fbm(x * 0.08, z * 0.08, 2, 4) * 2.5);
  d += 14.0 * tk * tk * (3 - 2 * tk) * tfade;
  // 东边更深一点，海湾外
  d += smoothstep(40, 130, x) * 6;
  // 边缘往下沉，免得看见地形的边
  d += smoothstep(-200, -250, x) * 10 + smoothstep(100, 140, x) * 10 + smoothstep(-90, -125, z) * 3 + smoothstep(85, 115, z) * 12;
  // 礁脊
  d -= ridgeHeight(x, z);
  // 拖锚沟
  const g = polyDist(x, z, DRAG_GROOVE);
  if (g.d < 1.4) {
    const fade = smoothstep(0.0, 0.25, g.t);
    d += (1 - smoothstep(0.1, 0.42, g.d)) * 0.26 * fade;
    d -= (smoothstep(0.3, 0.55, g.d) * (1 - smoothstep(0.55, 1.3, g.d))) * 0.09 * fade;
  }
  const k = polyDist(x, z, KEEL_SCRAPE);
  if (k.d < 2.2) {
    d += (1 - smoothstep(0.2, 1.6, k.d)) * 0.16 * (1 - k.t);
  }
  // 沉船压出的沙堆：右舷（低的一侧）堆得高
  {
    const rx = x - WRECK.x, rz = z - WRECK.z;
    const along = rx * BX + rz * BZ;
    const side = rx * SX + rz * SZ;
    const al = clamp(along, -10.5, 10.5);
    const dx = along - al;
    const sideC = side - 2.6;
    const dist = Math.sqrt(dx * dx + sideC * sideC);
    d -= (1 - smoothstep(0.5, 5.2, dist)) * 1.25;
    // 左舷一侧被水流掏出浅坑
    const sideP = side + 3.4;
    const distP = Math.sqrt(dx * dx + sideP * sideP * 1.5);
    d += (1 - smoothstep(0.5, 3.5, distP)) * 0.35;
  }
  // 细节起伏
  d += fbm(x * 0.21, z * 0.21, 2, 11) * 0.18;
  return -d;
}

// 底质：返回 [r,g,b,ripple,泥]（泥：0 是沙底、1 是泥底，挑铺哪一张颗粒贴图）
const C = {
  sandShallow: [0.9, 0.82, 0.62],
  sand: [0.76, 0.71, 0.58],
  silt: [0.56, 0.54, 0.47],
  mud: [0.47, 0.43, 0.36],
  weed: [0.52, 0.55, 0.38],
  rock: [0.5, 0.52, 0.5],
  deep: [0.38, 0.4, 0.4],
  groove: [0.58, 0.52, 0.42],
};
const mix3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

export function seabedColor(x, z, y) {
  const depth = -y;
  let c = mix3(C.sandShallow, C.sand, smoothstep(4, 11, depth));
  let ripple = 1;
  // 深处泥沙
  const silt = smoothstep(13, 22, depth);
  c = mix3(c, C.silt, silt);
  ripple *= 1 - silt * 0.6;
  // 草床底质
  const wx = (x - WEED_BED.x) / WEED_BED.rx, wz = (z - WEED_BED.z) / WEED_BED.rz;
  const wb = (1 - smoothstep(0.6, 1.3, Math.sqrt(wx * wx + wz * wz) + fbm(x * 0.1, z * 0.1, 2, 2) * 0.4));
  c = mix3(c, C.weed, wb * 0.8);
  ripple *= 1 - wb * 0.7;
  // 礁脊石面
  const rh = ridgeHeight(x, z);
  const rk = smoothstep(0.7, 1.8, rh);
  c = mix3(c, C.rock, rk);
  ripple *= 1 - rk;
  // 沉船周围的泥
  const rx = x - WRECK.x, rz = z - WRECK.z;
  const md = Math.hypot(rx * 0.9, rz * 0.75);
  const mudK = (1 - smoothstep(9, 22, md + fbm(x * 0.12, z * 0.12, 2, 7) * 5)) * 0.85;
  c = mix3(c, C.mud, mudK);
  ripple *= 1 - mudK * 0.6;
  // 深槽
  const td = Math.abs(z - trenchZ(x));
  const tk = (1 - smoothstep(6, 14, td)) * smoothstep(-80, -40, x);
  c = mix3(c, C.deep, tk);
  // 拖锚沟里翻出来的湿沙
  const g = polyDist(x, z, DRAG_GROOVE);
  if (g.d < 0.6) c = mix3(c, C.groove, (1 - smoothstep(0.15, 0.6, g.d)) * 0.8);
  const k = polyDist(x, z, KEEL_SCRAPE);
  if (k.d < 1.8) c = mix3(c, C.groove, (1 - smoothstep(0.3, 1.8, k.d)) * 0.45 * (1 - k.t));
  // 斑驳
  const n = vnoise(x * 0.5, z * 0.5, 31);
  c = c.map((v) => v * (0.94 + n * 0.1));
  const mudW = Math.max(silt, mudK / 0.85, tk, rk);
  return [c[0], c[1], c[2], ripple, mudW];
}

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
const GROUND = { sand: '地-沙底', mud: '地-泥底', site: '地-沉船场地' }; // 不是玩家看的：素材的文件名
const GROUND_TILE = 24; // 平铺一张多少米（素材单子定的）
const GROUND_SITE = { x0: -14, z0: -8, size: 48 }; // 场地图盖住哪一块（素材单子定的）
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

export const TERRAIN_BOUNDS = { x0: -250, x1: 140, z0: -125, z1: 115 };

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

// ——— 海底装饰：石头、海草、海带、碎壳 ———

function rockGeometry(seed) {
  const g = new THREE.IcosahedronGeometry(1, 1);
  const p = g.attributes.position;
  const rnd = mulberry32(seed);
  const v = new THREE.Vector3();
  const offs = new Map();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const key = `${v.x.toFixed(3)},${v.y.toFixed(3)},${v.z.toFixed(3)}`;
    if (!offs.has(key)) offs.set(key, 0.72 + rnd() * 0.5);
    const s = offs.get(key);
    v.multiplyScalar(s);
    v.y *= 0.62;
    if (v.y < -0.1) v.y *= 0.4;
    p.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals();
  return g;
}

// 一簇海草：六七片叶子从一个根上往外弯开，从上往下看是一朵星形，不是一根根竖线。
// 叶面朝上偏外，顶上接到光；高 ≈ 1（实例按高度缩放）
function tuftGeometry() {
  const rnd = mulberry32(4242);
  const pos = [], nor = [], idx = [];
  const nBlades = 6, segs = 4;
  for (let k = 0; k < nBlades; k++) {
    const az = (k / nBlades) * Math.PI * 2 + (rnd() - 0.5) * 0.7;
    const lean = 0.18 + rnd() * 0.42;
    const hk = 0.62 + rnd() * 0.38;
    const dx = Math.cos(az), dz = Math.sin(az);
    const wx = -dz, wz = dx; // 叶宽方向（切向）
    const base = pos.length / 3;
    let x = (rnd() - 0.5) * 0.06, y = 0, z = (rnd() - 0.5) * 0.06;
    for (let i = 0; i <= segs; i++) {
      const t = i / segs;
      const w = 0.105 * (1 - t * 0.62) * (0.85 + rnd() * 0.3);
      pos.push(x - wx * w, y, z - wz * w, x + wx * w, y, z + wz * w);
      const th = lean * (0.35 + 1.1 * t);
      // 法线：叶面朝外上方，再往上偏一些，从上面看是亮的
      const nx = dx * Math.cos(th) * 0.55, ny = 1.0, nz = dz * Math.cos(th) * 0.55;
      const l = Math.hypot(nx, ny, nz);
      nor.push(nx / l, ny / l, nz / l, nx / l, ny / l, nz / l);
      const step = hk / segs;
      x += dx * Math.sin(th) * step;
      z += dz * Math.sin(th) * step;
      y += Math.cos(th) * step;
    }
    for (let i = 0; i < segs; i++) {
      const a = base + i * 2;
      idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setIndex(idx);
  return g;
}

function kelpGeometry() {
  const segs = 7;
  const pos = [], idx = [];
  for (let i = 0; i <= segs; i++) {
    const t = i / segs;
    const w = 0.09 + Math.sin(t * Math.PI) * 0.1;
    pos.push(-w, t, 0, w, t, 0);
  }
  for (let i = 0; i < segs; i++) {
    const a = i * 2;
    idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  const n = [];
  for (let i = 0; i < pos.length / 3; i++) n.push(0, 0.3, 1);
  g.setAttribute('normal', new THREE.Float32BufferAttribute(n, 3));
  return g;
}

export function buildDecor(avoid) {
  const group = new THREE.Group();
  group.name = 'decor';
  const rnd = mulberry32(1234);
  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();
  const s = new THREE.Vector3();
  const v = new THREE.Vector3();
  const col = new THREE.Color();

  const blocked = (x, z, r) => avoid.some((a) => Math.hypot(a.x - x, a.z - z) < a.r + r);

  // —— 石头 ——
  const rockSpots = [];
  // 礁脊
  for (let i = 0; i < 110; i++) {
    const t = rnd();
    const x = RIDGE.ax + (RIDGE.bx - RIDGE.ax) * t + (rnd() - 0.5) * 9;
    const z = RIDGE.az + (RIDGE.bz - RIDGE.az) * t + (rnd() - 0.5) * 4;
    if (z > RIDGE.gapA - 1 && z < RIDGE.gapB + 1 && rnd() < 0.85) continue;
    rockSpots.push([x, z, 0.5 + rnd() * 1.7]);
  }
  // 散石
  for (let i = 0; i < 140; i++) {
    const x = -230 + rnd() * 350, z = -110 + rnd() * 200;
    rockSpots.push([x, z, 0.25 + rnd() * rnd() * 1.4]);
  }
  // 浅滩边的几块石头（蟹和鱼躲的地方）
  const shoalRocks = [[-86.5, -24.2, 1.1], [-84.9, -22.8, 0.7], [-76.2, -33.1, 0.9], [-72.0, -30.4, 1.3], [-88.6, -30.5, 0.6], [-69.5, -27.6, 0.55]];
  rockSpots.push(...shoalRocks);
  // 三块礁石：有素材用素材（原点在底面中心、底下 0.2 米埋进沙里，2 米大、1.1 米高），没有就用代码画的那三块
  const ROCK_ASSETS = ['礁石-大', '礁石-中', '礁石-小']; // 不是玩家看的：素材的文件名
  const rockSrc = ROCK_ASSETS.map((n, i) => {
    const a = mergedOf(n);
    if (!a) return { geo: rockGeometry(i + 1), mat: null, asset: false };
    const geo = a.geometries.length > 1 ? mergeGeometries(a.geometries) : a.geometries[0];
    return { geo, mat: toon({ color: 0xffffff, flat: true, map: a.map, moss: { color: 0x5e6e44, amount: 0.7 } }), asset: true };
  });
  const rockMatCode = toon({ color: 0xffffff, flat: true, moss: { color: 0x5e6e44, amount: 0.7 } });
  const rockSets = rockSrc.map((r) => { const m = new THREE.InstancedMesh(r.geo, r.mat || rockMatCode, Math.ceil(rockSpots.length / 3) + 2); m.userData.asset = r.asset; return m; });
  rockSets.forEach((m) => { m.count = 0; m.castShadow = true; m.instanceMatrix.setUsage(THREE.StaticDrawUsage); });
  const rockList = [];
  for (const [x, z, r] of rockSpots) {
    if (blocked(x, z, r)) continue;
    const y = seabedY(x, z);
    const set = rockSets[Math.floor(rnd() * 3)];
    e.set((rnd() - 0.5) * 0.3, rnd() * 6.28, (rnd() - 0.5) * 0.3);
    q.setFromEuler(e);
    s.set(r * (0.8 + rnd() * 0.5), r * (0.7 + rnd() * 0.6), r * (0.8 + rnd() * 0.5));
    // 素材的礁石原点在底面（埋进沙里的那一截在原点下面）：放在海底那一点；代码画的那块原点在中间，抬一点
    m4.compose(v.set(x, set.userData.asset ? y : y + r * 0.1, z), q, s);
    set.setMatrixAt(set.count, m4);
    // 实例颜色：代码画的那块靠它定灰色；素材自己带颜色，只在 1 上下差一点点（随机数照旧取这么多次，后面摆的海草、碎壳不挪）
    const g = 0.42 + rnd() * 0.14;
    const k1 = rnd(), k2 = rnd() < 0.3;
    if (set.userData.asset) {
      const t = 0.94 + (g - 0.42) * 0.85;
      col.setRGB(t, t * (1.0 + k1 * 0.03), t);
      if (k2) col.setRGB(t * 0.97, t * 1.02, t * 0.93);
    } else {
      col.setRGB(g * 0.95, g * (1.0 + k1 * 0.08), g * 0.95);
      if (k2) col.setRGB(g * 0.9, g * 1.05, g * 0.8);
    }
    set.setColorAt(set.count, col);
    set.count++;
    rockList.push({ x, z, r });
  }
  rockSets.forEach((m) => { m.instanceColor && (m.instanceColor.needsUpdate = true); group.add(m); });

  // —— 海草 ——
  const blades = [];
  const addPatch = (cx, cz, rx, rz, n, hmin, hmax, dens = 1) => {
    for (let i = 0; i < n; i++) {
      // 成簇：先选簇中心再撒
      const a = rnd() * Math.PI * 2, rr = Math.sqrt(rnd());
      const px = cx + Math.cos(a) * rx * rr, pz = cz + Math.sin(a) * rz * rr;
      const tuft = 4 + Math.floor(rnd() * 7 * dens);
      for (let k = 0; k < tuft; k++) {
        const x = px + (rnd() - 0.5) * 0.7, z = pz + (rnd() - 0.5) * 0.7;
        if (blocked(x, z, 0.3)) continue;
        blades.push([x, z, hmin + rnd() * (hmax - hmin)]);
      }
    }
  };
  addPatch(WEED_BED.x, WEED_BED.z, WEED_BED.rx, WEED_BED.rz, 520, 0.5, 1.15, 1.2);
  addPatch(-86, -24, 6, 4, 70, 0.35, 0.75);
  addPatch(-73, -31, 5, 4, 60, 0.35, 0.7);
  addPatch(-90, -33, 4, 3, 40, 0.3, 0.6);
  addPatch(-140, -36, 8, 6, 60, 0.4, 0.8);
  addPatch(-62, -20, 5, 4, 40, 0.3, 0.6);
  addPatch(-11, 1, 5, 4, 50, 0.4, 0.9);
  addPatch(-6, 18, 4, 4, 30, 0.4, 0.8);
  addPatch(-170, -52, 9, 6, 60, 0.4, 0.9);
  const bladeMat = toon({ color: 0xffffff, sway: 1.0, side: THREE.DoubleSide });
  // 每三个叶位种一簇（随机数照旧逐个取，后面海带、碎壳的位置不变）
  const bladeMesh = new THREE.InstancedMesh(tuftGeometry(), bladeMat, Math.ceil(blades.length / 3));
  let bc = 0;
  for (let i = 0; i < blades.length; i++) {
    const [x, z, h] = blades[i];
    const y = seabedY(x, z);
    e.set((rnd() - 0.5) * 0.3, rnd() * 6.28, (rnd() - 0.5) * 0.3);
    q.setFromEuler(e);
    const wsc = 1 + rnd() * 0.6;
    const t = rnd();
    const yellow = rnd() < 0.18;
    if (i % 3 || SHOAL_CRABS.some((c) => Math.hypot(c.x - x, c.z - z) < 1.3)) continue;
    s.set(0.75 + wsc * 0.35, h, 0.75 + wsc * 0.35);
    m4.compose(v.set(x, y - 0.04, z), q, s);
    bladeMesh.setMatrixAt(bc, m4);
    col.setRGB(0.56 + t * 0.2, 0.78 + t * 0.12, 0.36 + t * 0.06);
    if (yellow) col.setRGB(0.8, 0.76, 0.4);
    bladeMesh.setColorAt(bc, col);
    bc++;
  }
  bladeMesh.count = bc;
  bladeMesh.castShadow = false;
  bladeMesh.instanceColor.needsUpdate = true;
  group.add(bladeMesh);

  // —— 海带：长在礁脊和沉船边，给竖向的轮廓 ——
  const kelps = [];
  for (let i = 0; i < 90; i++) {
    const t = rnd();
    const x = RIDGE.ax + (RIDGE.bx - RIDGE.ax) * t + (rnd() - 0.5) * 6;
    const z = RIDGE.az + (RIDGE.bz - RIDGE.az) * t + (rnd() - 0.5) * 3;
    if (z > RIDGE.gapA && z < RIDGE.gapB) continue;
    kelps.push([x, z, 2.2 + rnd() * 3.2]);
  }
  for (let i = 0; i < 26; i++) {
    const a = rnd() * 6.28, r = 9 + rnd() * 7;
    kelps.push([WRECK.x + Math.cos(a) * r - 4, WRECK.z + Math.sin(a) * r, 1.8 + rnd() * 2.6]);
  }
  for (let i = 0; i < 20; i++) kelps.push([WEED_BED.x + (rnd() - 0.5) * 26, WEED_BED.z + (rnd() - 0.5) * 18, 2 + rnd() * 2.5]);
  const kelpMat = toon({ color: 0xffffff, sway: 2.2, side: THREE.DoubleSide });
  const kelpMesh = new THREE.InstancedMesh(kelpGeometry(), kelpMat, kelps.length * 3);
  let kc = 0;
  for (const [x, z, h] of kelps) {
    if (blocked(x, z, 0.5)) continue;
    const y = seabedY(x, z);
    const fr = 2 + Math.floor(rnd() * 2);
    for (let k = 0; k < fr; k++) {
      e.set((rnd() - 0.5) * 0.25, rnd() * 6.28, (rnd() - 0.5) * 0.25);
      q.setFromEuler(e);
      s.set(1 + rnd() * 0.4, h * (0.7 + rnd() * 0.4), 1);
      m4.compose(v.set(x + (rnd() - 0.5) * 0.4, y - 0.05, z + (rnd() - 0.5) * 0.4), q, s);
      kelpMesh.setMatrixAt(kc, m4);
      const t = rnd();
      col.setRGB(0.5 + t * 0.12, 0.46 + t * 0.1, 0.22);
      kelpMesh.setColorAt(kc, col);
      kc++;
    }
  }
  kelpMesh.count = kc;
  kelpMesh.instanceColor.needsUpdate = true;
  kelpMesh.castShadow = true;
  group.add(kelpMesh);

  // —— 碎壳和小卵石：浅水的颗粒感 ——
  // 接了地的素材以后不摆：沙底贴图里已经画了碎壳堆和小卵石（规格第 8 节的颜色和大小），这些 3D 的碎粒比它亮、比它大，又几乎看不见（一平方米 0.09 颗）；
  // 没有地的素材时照旧摆（放在最后，随机数少取不挪前面任何东西）
  if (texture(GROUND.sand, true)) return { group, rocks: rockList, bladeMesh, kelpMesh };
  const shellGeo = new THREE.IcosahedronGeometry(0.07, 0);
  const shellMat = toon({ color: 0xffffff, flat: true });
  const nShell = 900;
  const shells = new THREE.InstancedMesh(shellGeo, shellMat, nShell);
  let sc = 0;
  for (let i = 0; i < nShell * 3 && sc < nShell; i++) {
    const x = -130 + rnd() * 140, z = -60 + rnd() * 70;
    const y = seabedY(x, z);
    if (y < -9 && rnd() < 0.8) continue;
    e.set(rnd() * 3, rnd() * 6.28, rnd() * 3);
    q.setFromEuler(e);
    const r = 0.6 + rnd() * 1.4;
    s.set(r, r * 0.5, r);
    m4.compose(v.set(x, y + 0.02, z), q, s);
    shells.setMatrixAt(sc, m4);
    const w = rnd();
    if (w < 0.5) col.setRGB(0.95, 0.9, 0.8); else if (w < 0.8) col.setRGB(0.62, 0.6, 0.56); else col.setRGB(0.85, 0.66, 0.55);
    shells.setColorAt(sc, col);
    sc++;
  }
  shells.count = sc;
  shells.instanceColor.needsUpdate = true;
  group.add(shells);

  return { group, rocks: rockList, bladeMesh, kelpMesh };
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

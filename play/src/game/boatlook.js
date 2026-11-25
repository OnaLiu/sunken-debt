// 打捞船的造型（boat.js 引用，只管“看起来”和“动起来”）：
// 船壳与平甲板一张着色（一条条木板、板缝错缝、钢走道、排水口、白水线、钢板接缝、锈迹流痕、接触阴影、泥水痕），
// 甲板上一件件的东西（各自成件、各有细节、落地处压暗），驾驶室与吊臂的细节，以及会动的小件
// （雷达、桅顶小旗、舷灯慢闪、冲洗时转的水管卷、吊钩与马灯随船晃、液压油缸随俯仰伸缩、开船时船尾热气）。
import * as THREE from 'three';
import { buildShip, hullFrame } from '../world/wreck.js';
import { Builder, box, cyl, sph, tor, cone, lathe, rod, tube, col, M, shade, mix } from '../core/geo.js';
import { patchMaterial, basicWaterMat } from '../render/materials.js';
import { noise2, clamp, smooth, angDiff } from '../core/noise.js';
import { RNG } from '../core/rng.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const PI = Math.PI;
const DY = 1.32;            // 甲板面＝BOAT.deckY：船员、货物、泥包都站在这一层，甲板就铺平在这一层
const ROOF = DY + 2.29;     // 驾驶室顶面
const C = {
  cream: col(0xd9cfb2), cream2: col(0xc3b893), creamW: col(0xece6d2), roof: col(0x1f2a2c), dark: col(0x1f2a2c),
  steel: col(0x5a5e5c), steelL: col(0x868a83), steelD: col(0x383c3b), galv: col(0x7f857e), iron: col(0x2b2e2d), chrome: col(0xb9bdb5),
  ochre: col(0xd49a22), ochreD: col(0xa5741a), ochreW: col(0xd8c49a),
  red: col(0x9a3324), redB: col(0xb83a26), white: col(0xe8e3d6), door: col(0x5a3a26),
  wood: col(0x8a6a44), woodD: col(0x4e3a28), rope: col(0x9c8758), ropeD: col(0x6c5a38), rubber: col(0x1c1e1f), brass: col(0xb8924a),
  water: col(0x3f7a80), waterL: col(0x67a3a2), dirty: col(0x4a4a3c), hose: col(0x3f7444), tarp: col(0x4a6a80), rust: col(0x7a4020),
  drum: col(0x2f5a86), plastic: col(0xc8562a), mud: col(0x5a4a34), mop: col(0xbdb6a4), machine: col(0x4a6a58), lamp: col(0x8a2a1c),
  glass: col(0x00ffff), haz: col(0xff00ff),   // 两种“标记色”：着色器里换成玻璃反光、黑黄警示斜纹
};

// —— 船体几何的查询（与 buildShip 用同一套 hullFrame）——
let F = null, PL = 15.2;
const sOf = (z) => clamp(z / PL + 0.5, 0, 1);
// 船壳外皮在局部高度 y 处的半宽
function hullX(z, y) { const s = sOf(z), k = F.keelY(s), t = F.topY(s); return F.pt(s, clamp((y + 1.2 - k) / (t - k), 0, 1), 1).x; }
const topAt = (z) => F.topY(sOf(z)) - 1.2;     // 舷墙顶
const deckHW = (z) => hullX(z, DY);             // 甲板层的半宽
// 舷侧外法线（右舷；左舷把 x 取反）：按半宽随 z 的变化算
function sideN(z, y) { const d = (hullX(z + 0.05, y) - hullX(z - 0.05, y)) / 0.1; const l = Math.hypot(1, d); return [1 / l, -d / l]; }

// 局部坐标系里摆东西：p(几何, 颜色, x, y, z, rx, ry, rz, sx, sy, sz)
function at(b, base) { return (g, c, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = sx, sz = sx) => b.add(g, c, base.clone().multiply(M(x, y, z, rx, ry, rz, sx, sy, sz))); }
// 平贴在面上的小方片（法线 n 水平）
function patch(b, cx, cy, cz, nx, nz, w, h, c) {
  const rx = nz, rz = -nx;
  const p = (u, v) => V(cx + rx * u, cy + v, cz + rz * u);
  b.quad(p(-w / 2, -h / 2), p(w / 2, -h / 2), p(w / 2, h / 2), p(-w / 2, h / 2), c);
}

// ———————————————————————— 材质 ————————————————————————
const HULL_GLSL = /* glsl */`
uniform sampler2D uDeckTex;
uniform vec3 uWood, uTar, uSteel, uRust, uYel, uMud, uRed, uBoot, uBand, uBulw, uHazK;
varying float vSkin;
float hs1(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
// 抗锯齿细线（周期 1，线宽 w，fw 为屏幕导数）；远处按覆盖率淡成平均色，不闪
float lineAA(float x, float w, float fw) { fw = max(fw, 1e-5); float d = abs(fract(x + 0.5) - 0.5); return clamp((w * 0.5 + fw * 0.5 - d) / fw, 0.0, 1.0) * min(1.0, w / fw); }
float bandAA(float x, float a, float b, float fw) { fw = max(fw, 1e-5); return clamp((x - a) / fw + 0.5, 0.0, 1.0) * clamp((b - x) / fw + 0.5, 0.0, 1.0); }
// 甲板：顺船长铺的木板（沥青板缝、端接错开、每块明度不同、木纹、钉眼），舷边钢走道与黄线、水沟、排水口，
// 吊臂底座的警示圈、船尾警示边，清洗位的格栅坑与排水槽，泥水痕与接触阴影（烘在一张小贴图里）
vec3 deckCol(vec3 P, vec3 fw, vec4 dt, float fwE) {
  float x = P.x, z = P.z, edge = dt.a * 0.8;
  float dfa = 1.0 - clamp(fw.x * 22.0 - 0.4, 0.0, 1.0);
  float px = x / 0.16 + 0.5, pi = floor(px);
  float pz = (z + fract(pi * 0.618) * 2.4) / 2.4, si = floor(pz);
  float h1 = hs1(vec2(pi, si)), h2 = hs1(vec2(si + 3.7, pi - 1.3));
  vec3 c = uWood * (0.82 + 0.3 * h1);
  c *= mix(vec3(1.0), vec3(1.08, 0.97, 0.86), h2 * 0.8);
  float g1 = vn3(vec3(x * 34.0 + h1 * 17.0, h2 * 9.0, z * 1.7)), g2 = vn3(vec3(x * 80.0, h1 * 31.0, z * 6.0));
  c *= 1.0 + ((g1 - 0.5) * 0.26 + (g2 - 0.5) * 0.12) * dfa;
  float seam = max(lineAA(px, 0.085, fw.x / 0.16), lineAA(pz, 0.006, fw.z / 2.4));
  float nz = abs(fract(z / 0.6 + 0.5) - 0.5) * 0.6, nx = (abs(fract(px) - 0.5) - 0.27) * 0.16;
  float nail = (1.0 - smoothstep(0.007, 0.007 + fw.x * 1.2, length(vec2(nx, nz)))) * dfa;
  c = mix(c, uTar * 1.7, nail * 0.6);
  c = mix(c, uTar, seam * 0.82);
  float worn = smoothstep(0.25, 0.62, vn3(vec3(x * 9.0, 3.0, z * 9.0)));
  // 舱口四周的钢围边
  float hm = bandAA(abs(x), -1.0, 1.1, fw.x) * bandAA(abs(z + 3.25), -1.0, 1.1, fw.z);
  c = mix(c, uSteel * (0.72 + 0.22 * vn3(P * 5.0)), hm);
  // 清洗位：格栅底下的污水坑、通往右舷排水口的排水槽
  float gs = bandAA(abs(x - 0.9), -1.0, 0.96, fw.x) * bandAA(abs(z + 6.0), -1.0, 0.91, fw.z);
  c = mix(c, vec3(0.03, 0.026, 0.02) * (0.7 + 0.6 * vn3(P * 9.0)), gs);
  float ch = bandAA(abs(z + 6.0), -1.0, 0.075, fw.z) * clamp((x - 1.86) / max(fw.x, 1e-4) + 0.5, 0.0, 1.0);
  c = mix(c, mix(vec3(0.02), uSteel * 0.75, lineAA(x / 0.05, 0.45, fw.x / 0.05)), ch);
  // 舷边钢走道（花纹钢板，锈边）与内沿黄线
  float side = step(z, 4.3) * step(-7.45, z);
  float walk = (1.0 - clamp((edge - 0.36) / max(fwE, 1e-4) + 0.5, 0.0, 1.0)) * side;
  if (walk > 0.0) {
    vec2 q = vec2(x + z, x - z) * 10.0, f = fract(q) - 0.5;
    float fq = max((fw.x + fw.z) * 10.0, 1e-4);
    vec2 ff = mod(floor(q.x) + floor(q.y), 2.0) > 0.5 ? f.yx : f;
    float bump = clamp((0.09 - abs(ff.x)) / fq, 0.0, 1.0) * clamp((0.34 - abs(ff.y)) / fq, 0.0, 1.0) * clamp(1.5 - fq * 3.0, 0.0, 1.0);
    vec3 s = uSteel * (0.86 + 0.18 * vn3(P * 2.7)) * (1.0 + 0.32 * bump);
    s = mix(s, s * 0.5, lineAA(z / 1.2 + 0.25, 0.012, fw.z / 1.2));
    float rs = smoothstep(0.6, 0.84, vn3(vec3(x * 6.0, 1.0, z * 2.0)) * 0.7 + vn3(P * 13.0) * 0.3 + (1.0 - edge / 0.36) * 0.2);
    s = mix(s, uRust * (0.8 + 0.4 * vn3(P * 20.0)), rs * 0.6);
    c = mix(c, s, walk);
  }
  c = mix(c, uYel * (0.85 + 0.2 * h1), bandAA(edge, 0.365, 0.405, fwE) * side * worn * 0.85);
  c = mix(c, uSteel * 0.33, 1.0 - clamp((edge - 0.05) / max(fwE, 1e-4) + 0.5, 0.0, 1.0));
  float dz = abs(fract((z + 6.0) / 1.2 + 0.5) - 0.5) * 1.2;
  float drain = (1.0 - clamp((edge - 0.08) / max(fwE, 1e-4) + 0.5, 0.0, 1.0)) * (1.0 - clamp((dz - 0.1) / max(fw.z, 1e-4) + 0.5, 0.0, 1.0)) * step(z, 1.8);
  c = mix(c, mix(vec3(0.012), uSteel * 0.5, lineAA(dz / 0.05, 0.3, fw.z / 0.05)), drain * 0.92);
  // 吊臂底座外一圈黑黄警示漆、船尾边的警示斜纹
  vec2 cr = P.xz - vec2(0.0, -0.9);
  float r = length(cr);
  float st = step(0.5, fract(atan(cr.y, cr.x) * 3.8197 + r * 1.5));
  c = mix(c, mix(uYel, uHazK, st) * (0.8 + 0.25 * worn), bandAA(r, 0.89, 1.04, fw.x) * (0.55 + 0.45 * worn));
  float sb = 1.0 - clamp((z + 7.43) / max(fw.z, 1e-4) + 0.5, 0.0, 1.0);
  c = mix(c, mix(uYel, uHazK, step(0.5, fract((x - z) * 2.2))) * (0.8 + 0.25 * worn), sb * (0.6 + 0.4 * worn));
  // 泥水痕：湿处发暗，泥点发褐；接触阴影
  float n1 = vn3(vec3(x * 4.0, 5.0, z * 4.0)), n2 = vn3(vec3(x * 15.0, 1.0, z * 15.0));
  float wet = clamp(dt.g * (0.65 + 0.7 * n1), 0.0, 1.0);
  c *= 1.0 - 0.42 * wet;
  c = mix(c, c * vec3(0.92, 0.97, 1.06), wet * 0.4);
  float mud = smoothstep(0.3, 0.62, dt.b * (0.55 + 0.75 * n1) + (n2 - 0.5) * 0.25);
  c = mix(c, uMud * (0.75 + 0.5 * n2), mud * 0.85);
  return c * (1.0 - dt.r * 0.74);
}
// 船壳：吃水下红色防污漆、白水线、上沿奶白条、钢板接缝、吃水标记、排水口和锈迹流痕；舷墙内侧刷浅色
vec3 hullCol(vec3 P, vec3 fn, vec3 c, vec3 fw) {
  bool tr = P.z < -7.35 && abs(fn.z) > abs(fn.x);
  vec3 outw = tr ? vec3(0.0, 0.0, -1.0) : vec3(sign(P.x), 0.0, 0.0);
  float y = P.y;
  float dz = abs(fract((P.z + 6.0) / 1.2 + 0.5) - 0.5) * 1.2;
  if (dot(fn, outw) > 0.0) {
    float nn = vn3(P * vec3(2.0, 6.0, 2.0));
    vec3 b = mix(c, uBand * (0.94 + 0.1 * nn), bandAA(y, 1.06, 1.3, fw.y) * (tr ? 1.0 : step(1.5, abs(P.x))));
    b *= 1.0 - 0.22 * (1.0 - smoothstep(0.1, 0.36, y)) * (0.4 + nn);
    float strake = floor((y + 1.2) / 0.42);
    float seam = max(lineAA((P.z + hs1(vec2(strake, 2.0)) * 1.9) / 1.9, 0.007, fw.z / 1.9), lineAA((y + 1.2) / 0.42, 0.03, fw.y / 0.42));
    b *= 1.0 - 0.3 * seam * (tr ? 0.4 : 1.0);
    // 排水口下、锚链孔下、零星几处的锈迹流痕
    float L = ${DY.toFixed(2)} - y;
    float s1 = (1.0 - smoothstep(0.012 + max(L, 0.0) * 0.02, 0.03 + max(L, 0.0) * 0.06, dz)) * smoothstep(0.9, 0.05, L) * step(-0.02, L) * step(P.z, 2.2) * step(-7.3, P.z);
    float ha = abs(abs(P.z) - 5.75) + step(P.z, 0.0) * 9.0;
    float s3 = (1.0 - smoothstep(0.03, 0.08 + max(1.45 - y, 0.0) * 0.05, ha)) * smoothstep(1.0, 0.0, 1.45 - y) * step(y, 1.45);
    float cz = floor(P.z / 0.37);
    float s2 = step(0.8, hs1(vec2(cz, 7.0))) * (1.0 - smoothstep(0.015, 0.05, abs(fract(P.z / 0.37) - 0.5) * 0.37)) * smoothstep(0.55, 0.0, 1.05 - y) * step(y, 1.05);
    float rs = clamp(max(max(s1, s3), s2 * 0.75) * (0.4 + 0.9 * vn3(vec3(P.z * 25.0, y * 3.0, 1.0))), 0.0, 1.0);
    b = mix(b, uRust * (0.85 + 0.3 * nn), rs * 0.65);
    b = mix(b, vec3(0.012), (1.0 - smoothstep(0.08, 0.08 + fw.z, dz)) * bandAA(y, ${(DY - 0.01).toFixed(2)}, ${(DY + 0.07).toFixed(2)}, fw.y) * step(P.z, -5.0));
    // 吃水标记（首、尾两处，长短相间的白刻度）
    float dm = min(abs(abs(P.z) - (P.z > 0.0 ? 6.15 : 7.12)), 1.0);
    float k = (y + 0.4) / 0.2;
    b = mix(b, uBoot, bandAA(fract(k), -1.0, 0.2, fw.y / 0.2) * step(dm, mod(floor(k), 2.0) < 0.5 ? 0.1 : 0.05) * step(-0.4, y) * step(y, 1.0) * (tr ? 0.0 : 1.0));
    // 白水线、红色防污漆（压在最上面：水线要干净）
    b = mix(b, uBoot, bandAA(y, 0.03, 0.115, fw.y));
    b = mix(b, uRed * (0.82 + 0.3 * nn), clamp((0.03 - y) / max(fw.y, 1e-4) + 0.5, 0.0, 1.0));
    return b;
  }
  if (y > ${(DY - 0.01).toFixed(2)}) {
    vec3 b = uBulw * (0.9 + 0.14 * vn3(P * 3.0));
    b *= 1.0 - 0.3 * (1.0 - smoothstep(${DY.toFixed(2)}, ${(DY + 0.14).toFixed(2)}, y));
    b = mix(b, uRust, smoothstep(0.7, 0.9, vn3(vec3(P.z * 6.0, y * 1.5, 2.0))) * 0.45);
    return mix(b, vec3(0.012), (1.0 - smoothstep(0.08, 0.08 + fw.z, dz)) * bandAA(y, ${(DY - 0.02).toFixed(2)}, ${(DY + 0.07).toFixed(2)}, fw.y) * step(P.z, -5.0));
  }
  return c;
}`;

let _hullMat = null, _propsMat = null;
function hullMaterial(tex) {
  const u = {
    uDeckTex: { value: tex },
    uWood: { value: col(0xa68c62) }, uTar: { value: col(0x2a2018) }, uSteel: { value: col(0x7b807a) }, uRust: { value: col(0x7e4522) },
    uYel: { value: col(0xd9a527) }, uMud: { value: col(0x4f4130) }, uRed: { value: col(0x9e2f1f) }, uBoot: { value: col(0xe2ddd0) },
    uBand: { value: col(0xd4ccb4) }, uBulw: { value: col(0xc9bf9f) }, uHazK: { value: col(0x1c1d1c) },
  };
  const m = new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true, side: THREE.DoubleSide });
  return patchMaterial(m, {
    key: 'boathull', uniforms: u, fragPars: HULL_GLSL,
    vertexPars: 'attribute float aSkin; varying float vSkin;',
    vertex: '#include <begin_vertex>\nvSkin = aSkin;',
    frag: `{
  vec3 P = vOPos, fw = fwidth(P);
  vec3 fnO = normalize(cross(dFdx(P), dFdy(P)));
  vec4 dt = texture2D(uDeckTex, vec2((P.z + 7.8) / 15.6, (P.x + 3.0) / 6.0));
  float fwE = fwidth(dt.a) * 0.8;
  if (vSkin > 0.5) {
    if (abs(P.y - ${DY.toFixed(2)}) < 0.004 && abs(fnO.y) > 0.9) diffuseColor.rgb = deckCol(P, fw, dt, fwE);
    else diffuseColor.rgb = hullCol(P, fnO, diffuseColor.rgb, fw);
  }
}`,
  });
}
// 甲板上各件、驾驶室、吊臂共用：两种标记色换成黑黄警示斜纹、玻璃反光
export function propsMaterial() {
  if (_propsMat) return _propsMat;
  const u = { uHazY: { value: col(0xe0a722) }, uHazK: { value: col(0x1d1e1d) }, uGlass: { value: col(0x1d2a33) }, uSky: { value: col(0x9fc4cc) } };
  const m = new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true });
  _propsMat = patchMaterial(m, {
    key: 'boatprops', uniforms: u,
    fragPars: 'uniform vec3 uHazY, uHazK, uGlass, uSky;',
    frag: `{
  float hz = (vOPos.x + vOPos.y + vOPos.z) * 3.0, hw = max(fwidth(hz), 1e-4);
  if (vColor.r > 0.97 && vColor.g < 0.03 && vColor.b > 0.97) {
    float st = clamp((abs(fract(hz) - 0.5) - 0.25) / hw + 0.5, 0.0, 1.0);
    diffuseColor.rgb = mix(uHazY, uHazK, st) * (0.86 + 0.22 * vn3(vOPos * 9.0));
  } else if (vColor.r < 0.03 && vColor.g > 0.97 && vColor.b > 0.97) {
    float k = fract(vOPos.y * 1.7 + (vOPos.x + vOPos.z) * 0.35);
    float gl = smoothstep(0.86, 0.95, fract((vOPos.x + vOPos.z) * 1.3 + vOPos.y * 2.2));
    diffuseColor.rgb = mix(uGlass, uSky, 0.16 + 0.3 * smoothstep(0.2, 0.9, k)) + uSky * gl * 0.4;
  }
}`,
  });
  return _propsMat;
}

// ———————————————————————— 甲板贴图：接触阴影 R、湿 G、泥 B、到舷边的距离 A ————————————————————————
const TU = 256, TV = 128;
function bakeDeckTex(K) {
  const data = new Uint8Array(TU * TV * 4);
  const ao = new Float32Array(TU * TV), wet = new Float32Array(TU * TV), mud = new Float32Array(TU * TV);
  const zOf = (i) => -7.8 + (i + 0.5) * 15.6 / TU, xOf = (j) => -3.0 + (j + 0.5) * 6.0 / TV;
  const iOf = (z) => (z + 7.8) / 15.6 * TU - 0.5, jOf = (x) => (x + 3.0) / 6.0 * TV - 0.5;
  // 圆角矩形（可转）：值 = k × 软边衰减；dst 里取最大
  const stamp = (dst, x, z, hx, hz, rot, soft, k, round = 0) => {
    const R = Math.hypot(hx, hz) + soft;
    const i0 = Math.max(0, Math.floor(iOf(z - R))), i1 = Math.min(TU - 1, Math.ceil(iOf(z + R)));
    const j0 = Math.max(0, Math.floor(jOf(x - R))), j1 = Math.min(TV - 1, Math.ceil(jOf(x + R)));
    const c = Math.cos(rot), s = Math.sin(rot), rr = round ? Math.min(hx, hz) : Math.min(hx, hz) * 0.35;
    for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) {
      const dx = xOf(j) - x, dz = zOf(i) - z;
      const lx = Math.abs(dx * c - dz * s), lz = Math.abs(dx * s + dz * c);
      const qx = Math.max(lx - hx + rr, 0), qz = Math.max(lz - hz + rr, 0);
      const d = Math.hypot(qx, qz) + Math.min(Math.max(lx - hx + rr, lz - hz + rr), 0) - rr;
      const v = k * (1 - smooth(-soft * 0.3, soft, d));
      const o = i + j * TU;
      if (v > dst[o]) dst[o] = v;
    }
  };
  for (const a of K.ao) stamp(ao, ...a);
  for (const w of K.wet) stamp(w[0] === 'mud' ? mud : wet, ...w.slice(1));
  const hw = new Float32Array(TU), sl = new Float32Array(TU);
  for (let i = 0; i < TU; i++) { const z = zOf(i); hw[i] = z < -PL / 2 || z > PL / 2 ? 0 : deckHW(z); sl[i] = (deckHW(clamp(z + 0.05, -7.6, 7.6)) - deckHW(clamp(z - 0.05, -7.6, 7.6))) / 0.1; }
  for (let j = 0; j < TV; j++) for (let i = 0; i < TU; i++) {
    const o = i + j * TU, p = o * 4;
    const d = (hw[i] - Math.abs(xOf(j))) / Math.hypot(1, sl[i]);
    data[p] = clamp(ao[o], 0, 1) * 255; data[p + 1] = clamp(wet[o], 0, 1) * 255; data[p + 2] = clamp(mud[o], 0, 1) * 255; data[p + 3] = clamp(d / 0.8, 0, 1) * 255;
  }
  const tex = new THREE.DataTexture(data, TU, TV, THREE.RGBAFormat, THREE.UnsignedByteType);
  tex.magFilter = THREE.LinearFilter; tex.minFilter = THREE.LinearFilter; tex.generateMipmaps = false; tex.needsUpdate = true;
  return tex;
}
const aoRect = (K, x, z, hx, hz, rot = 0, soft = 0.12, k = 0.55) => K.ao.push([x, z, hx, hz, rot, soft, k, 0]);
const aoDisc = (K, x, z, r, soft = 0.1, k = 0.55) => K.ao.push([x, z, r, r, 0, soft, k, 1]);

// ———————————————————————— 船壳＋平甲板 ————————————————————————
function buildHull(P) {
  const { geo } = buildShip({ ...P, deck: false }); // 甲板另铺：平的一层，正好在船员脚下
  geo.translate(0, -1.2, 0);
  const pos = geo.attributes.position, cl = geo.attributes.color, n = pos.count;
  const woodG = col(P.wood).g, ribG = woodG * 0.8;
  const b = new Builder();
  b.add(geo, null);
  geo.dispose();
  // 甲板：按船壳内沿（甲板层）铺成平面，船首那段原来翘起的甲板压平（船员、锚机都站在平面上），舷墙内侧露出来
  const zs = [];
  for (let z = -PL / 2; z < PL / 2 - 0.08; z += (z < -6.6 || z > 1.8) ? 0.2 : 0.5) zs.push(z);
  zs.push(PL / 2 - 0.06);
  const us = [-1, -0.75, -0.4, 0, 0.4, 0.75, 1], white = col(0xffffff);
  for (let i = 0; i < zs.length - 1; i++) {
    const z0 = zs[i], z1 = zs[i + 1], w0 = Math.max(0, deckHW(z0) - 0.012), w1 = Math.max(0, deckHW(z1) - 0.012);
    for (let k = 0; k < us.length - 1; k++) b.quad(V(us[k] * w0, DY, z0), V(us[k] * w1, DY, z1), V(us[k + 1] * w1, DY, z1), V(us[k + 1] * w0, DY, z0), white);
  }
  // 哪些面是船壳外皮（着色器画水线、接缝、锈迹），哪些是护舷、肋骨、龙骨、舵这些“附件”（保留顶点色）
  const skin = new Float32Array(b.n).fill(1);
  const red = [0.36, 0.08, 0.05], bul = shade(C.cream2, 0.86);
  for (let i = 0; i < n; i += 3) {
    let cx = 0, cy = 0, cz = 0, tr = true, plank = true;
    for (let k = 0; k < 3; k++) { cx += pos.getX(i + k); cy += pos.getY(i + k); cz += pos.getZ(i + k); if (Math.abs(pos.getZ(i + k) + PL / 2) > 1e-3) tr = false; if (cl.getY(i + k) < woodG * 0.95) plank = false; }
    cx /= 3; cy /= 3; cz /= 3;
    const zc = clamp(cz, -PL / 2, PL / 2);
    const isSkin = plank && (tr || (Math.abs(hullX(zc, cy) - Math.abs(cx)) < 0.04 && cy <= topAt(zc) + 0.005));
    const rib = !isSkin && Math.abs(cl.getY(i) - ribG) < ribG * 0.03;
    for (let k = 0; k < 3; k++) {
      const o = (i + k) * 3, y = b.pos[o + 1], x = b.pos[o];
      skin[i + k] = isSkin ? 1 : 0;
      if (!isSkin && !rib && y > DY && y < topAt(b.pos[o + 2]) - 0.02) { const hx = hullX(b.pos[o + 2], y); if (Math.abs(x) < hx) b.pos[o] = Math.sign(x) * (hx + 0.004); } // 护舷条不从舷墙里面冒出来
      if (y < 0.05) { b.colr[o] = red[0]; b.colr[o + 1] = red[1]; b.colr[o + 2] = red[2]; }
      else if (!isSkin && !rib && y > 1.05 && y < 1.32 && Math.abs(x) > 1.5) { b.colr[o] = 0.75; b.colr[o + 1] = 0.72; b.colr[o + 2] = 0.62; } // 上面那道护舷刷奶白（原来的白条）
      else if (rib && y > DY - 0.03) {
        if (topAt(b.pos[o + 2]) < DY + 0.3) b.pos[o + 1] = DY - 0.03;   // 舷墙矮的地方肋骨头不冒出甲板
        else { b.colr[o] = bul.r; b.colr[o + 1] = bul.g; b.colr[o + 2] = bul.b; } // 船首高舷墙里的肋骨跟着刷浅色
      }
    }
  }
  const g = b.build();
  g.setAttribute('aSkin', new THREE.BufferAttribute(skin, 1));
  return g;
}

// ———————————————————————— 一件件的东西 ————————————————————————
function crate(K, x, z, w, h, d, ry, rng, y0 = DY, tone = 1) {
  const p = at(K.b, M(x, y0, z, 0, ry, 0)), wd = shade(C.wood, tone);
  p(box(w - 0.03, h - 0.02, d - 0.03), shade(C.woodD, tone), 0, (h - 0.02) / 2, 0);
  const sh = (h - 0.05) / 3, t = () => shade(wd, 0.86 + rng.next() * 0.26);
  for (let i = 0; i < 3; i++) {
    const y = 0.025 + sh * (i + 0.5);
    p(box(w - 0.1, sh - 0.025, 0.022), t(), 0, y, d / 2 - 0.008); p(box(w - 0.1, sh - 0.025, 0.022), t(), 0, y, -d / 2 + 0.008);
    p(box(0.022, sh - 0.025, d - 0.1), t(), w / 2 - 0.008, y, 0); p(box(0.022, sh - 0.025, d - 0.1), t(), -w / 2 + 0.008, y, 0);
    p(box(w - 0.03, 0.022, d / 3 - 0.025), t(), 0, h - 0.006, -d / 3 + i * d / 3);
  }
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    p(box(0.055, h, 0.055), shade(wd, 0.8), sx * (w / 2 - 0.022), h / 2, sz * (d / 2 - 0.022));
    for (const yy of [0.04, h - 0.04]) p(box(0.078, 0.08, 0.078), C.iron, sx * (w / 2 - 0.024), yy, sz * (d / 2 - 0.024)); // 角铁
  }
  p(box(w + 0.03, 0.02, 0.035), C.rope, 0, h + 0.012, 0); p(box(0.035, 0.02, d + 0.03), C.rope, 0, h + 0.012, 0); // 十字捆绳
  p(box(0.02, h, 0.035), C.rope, w / 2 + 0.013, h / 2, 0); p(box(0.02, h, 0.035), C.rope, -w / 2 - 0.013, h / 2, 0);
  p(box(0.035, h, 0.02), C.rope, 0, h / 2, d / 2 + 0.013); p(box(0.035, h, 0.02), C.rope, 0, h / 2, -d / 2 - 0.013);
  p(sph(0.036, 5, 4), C.ropeD, 0.03, h + 0.03, 0.03);
  p(box(0.15, 0.08, 0.006), C.dark, -w * 0.2, h * 0.6, d / 2 + 0.014); // 刷的记号
  if (y0 <= DY + 0.01) aoRect(K, x, z, w / 2 + 0.01, d / 2 + 0.01, ry, 0.13, 0.62);
}
function drum(K, x, z, r, h, paint, ry, seed) {
  const p = at(K.b, M(x, DY, z, 0, ry, 0));
  const rusty = (px, py, pz) => { const n = noise2(px * 6 + seed, py * 7 + pz * 6) * 0.5 + 0.5 + (py < DY + 0.18 ? 0.25 : 0); return n > 0.68 ? mix(paint, C.rust, Math.min(1, (n - 0.68) * 3.2)) : paint; };
  K.b.add(new THREE.CylinderGeometry(r, r, h, 14, 4, true), rusty, M(x, DY + h / 2, z, 0, ry, 0));
  p(cyl(r * 0.96, r * 0.96, 0.02, 14), shade(paint, 1.08), 0, h - 0.012, 0);            // 桶盖（略凹）
  p(tor(r * 0.985, 0.02, 4, 14), shade(paint, 0.78), 0, h - 0.004, 0, PI / 2);          // 上下卷边
  p(tor(r * 0.985, 0.02, 4, 14), shade(paint, 0.62), 0, 0.012, 0, PI / 2);
  for (const k of [0.3, 0.7]) p(tor(r * 1.004, 0.018, 4, 14), shade(paint, 0.82), 0, h * k, 0, PI / 2); // 滚箍
  p(new THREE.CylinderGeometry(r * 1.016, r * 1.016, 0.1, 14, 1, true), C.white, 0, h * 0.5, 0);  // 标签带
  p(cyl(0.032, 0.036, 0.024, 6), C.steelL, r * 0.55, h, 0); p(cyl(0.02, 0.022, 0.02, 6), C.steelL, -r * 0.5, h - 0.002, r * 0.25); // 桶塞
  aoDisc(K, x, z, r + 0.02, 0.11, 0.66);
}
function bucket(K, x, z, ry, paint, water) {
  const p = at(K.b, M(x, DY, z, 0, ry, 0));
  p(cyl(0.15, 0.12, 0.28, 10, true), paint, 0, 0.14, 0);
  p(cyl(0.144, 0.115, 0.27, 10, true), shade(paint, 0.55), 0, 0.145, 0, 0, 0, 0, -1, 1, 1); // 内壁（镜像翻面朝里）
  p(cyl(0.116, 0.116, 0.012, 10), shade(paint, 0.45), 0, 0.012, 0);
  p(tor(0.15, 0.012, 4, 10), shade(paint, 0.85), 0, 0.28, 0, PI / 2);
  if (water) p(cyl(0.14, 0.14, 0.012, 10), C.dirty, 0, 0.2, 0);
  p(tor(0.15, 0.008, 3, 8, PI), C.steelD, 0, 0.27, 0, -0.55, 0, 0);   // 提梁
  aoDisc(K, x, z, 0.155, 0.08, 0.62);
}
function toolbox(K, x, z, ry, paint) {
  const p = at(K.b, M(x, DY, z, 0, ry, 0));
  p(box(0.46, 0.15, 0.21), paint, 0, 0.075, 0);
  p(box(0.47, 0.055, 0.22), shade(paint, 1.12), 0, 0.178, 0);
  p(box(0.476, 0.012, 0.224), C.dark, 0, 0.152, 0);
  for (const sx of [-1, 1]) { p(box(0.03, 0.06, 0.03), C.steelD, sx * 0.12, 0.23, 0); p(box(0.04, 0.05, 0.015), C.steelL, sx * 0.15, 0.152, 0.112); }
  p(box(0.27, 0.025, 0.03), C.dark, 0, 0.265, 0);
  p(box(0.24, 0.02, 0.05), C.steelL, 0.02, 0.215, -0.04, 0, 0.3, 0); // 盖上搁着的扳手
  aoRect(K, x, z, 0.235, 0.11, ry, 0.08, 0.62);
}
function lifeRing(K, x, y, z, ry, wall = true) {
  const c = Math.cos(ry), s = Math.sin(ry);
  K.b.add(tor(0.27, 0.075, 6, 16), (px, py, pz) => { const a = Math.atan2(py - y, (px - x) * c - (pz - z) * s); return (Math.floor((a + PI) / (PI / 2) + 0.5) & 1) ? C.white : C.redB; }, M(x, y, z, 0, ry, 0));
  K.b.add(tor(0.355, 0.011, 3, 20), C.rope, M(x, y, z, 0, ry, 0));          // 扶手绳
  for (let k = 0; k < 4; k++) { const a = k * PI / 2 + PI / 4; K.b.add(box(0.17, 0.03, 0.03), C.rope, M(x + Math.cos(a) * 0.31 * c, y + Math.sin(a) * 0.31, z - Math.cos(a) * 0.31 * s, 0, ry, a)); }
  if (wall) K.b.add(box(0.07, 0.14, 0.05), C.steelD, M(x - s * 0.09, y + 0.28, z - c * 0.09, 0, ry, 0)); // 挂钩
}
function bollard(K, x, z, ry, dbl) {
  const p = at(K.b, M(x, DY, z, 0, ry, 0)), posts = dbl ? [-0.15, 0.15] : [0];
  p(box(dbl ? 0.52 : 0.26, 0.04, 0.26), C.iron, 0, 0.02, 0);
  for (const o of posts) {
    p(cyl(0.075, 0.088, 0.3, 10), C.dark, o, 0.17, 0);
    p(new THREE.CylinderGeometry(0.085, 0.086, 0.07, 10, 1, true), C.steelL, o, 0.25, 0); // 被缆绳磨亮的一圈
    p(cyl(0.105, 0.1, 0.035, 10), C.dark, o, 0.335, 0);
  }
  aoRect(K, x, z, dbl ? 0.27 : 0.14, 0.14, ry, 0.08, 0.6);
}
function extinguisher(K, x, y, z, ry) {
  const p = at(K.b, M(x, y, z, 0, ry, 0));
  p(cyl(0.065, 0.065, 0.36, 10), C.redB, 0, 0, 0);
  p(sph(0.065, 10, 5), C.redB, 0, 0.18, 0, 0, 0, 0, 1, 0.7, 1);
  p(new THREE.CylinderGeometry(0.07, 0.07, 0.1, 10, 1, true), C.white, 0, 0.0, 0);
  p(cyl(0.02, 0.025, 0.06, 6), C.dark, 0, 0.25, 0); p(box(0.11, 0.018, 0.025), C.dark, 0.035, 0.285, 0);
  K.b.add(rod(V(0.03, 0.24, -0.03).applyMatrix4(M(x, y, z, 0, ry, 0)), V(0.075, -0.06, -0.05).applyMatrix4(M(x, y, z, 0, ry, 0)), 0.012, 4), C.dark);
  p(box(0.035, 0.07, 0.035), C.dark, 0.075, -0.09, -0.05);
  p(box(0.16, 0.035, 0.03), C.steelD, 0, 0.06, 0.07); p(box(0.16, 0.035, 0.03), C.steelD, 0, -0.1, 0.07); // 卡箍
}
// 拖把：一大把垂下来的布条（湿了发灰），落在甲板上摊开一点
function mop(K, bx, bz, tx, ty, tz) {
  K.b.add(rod(V(bx, DY + 0.26, bz), V(tx, ty, tz), 0.016, 5), C.wood);
  K.b.add(cyl(0.045, 0.05, 0.06, 8), C.steelD, M(bx, DY + 0.27, bz));
  K.b.add(cone(0.1, 0.22, 8), shade(C.mop, 0.8), M(bx, DY + 0.13, bz, PI, 0, 0));
  for (let i = 0; i < 14; i++) { const a = i / 14 * PI * 2, r = 0.05 + (i & 1) * 0.03; K.b.add(box(0.045, 0.26, 0.02), shade(C.mop, 0.72 + (i % 4) * 0.09), M(bx + Math.cos(a) * r, DY + 0.12, bz + Math.sin(a) * r, 0, -a + PI / 2, 0.22 + (i % 3) * 0.08)); }
  aoDisc(K, bx, bz, 0.16, 0.07, 0.55);
}
function deckBrush(K, hx, hz, tx, ty, tz) {
  const p = at(K.b, M(hx, DY, hz, 0, Math.atan2(tx - hx, tz - hz) + PI / 2, 0));
  p(box(0.3, 0.05, 0.08), C.wood, 0, 0.065, 0); p(box(0.28, 0.04, 0.065), C.ropeD, 0, 0.02, 0);
  K.b.add(rod(V(hx, DY + 0.09, hz), V(tx, ty, tz), 0.016, 5), C.wood);
  aoRect(K, hx, hz, 0.16, 0.05, Math.atan2(tx - hx, tz - hz) + PI / 2, 0.06, 0.55);
}
// 盖着油布的一堆杂物：底下几块箱子撑出起伏，油布垂到甲板，两道绳子捆着
function tarpPile(K, x, z, hx, hz, ry, seed) {
  const under = [[-0.14, -0.1, 0.2, 0.2, 0.56], [0.17, 0.12, 0.19, 0.2, 0.4], [0.06, -0.2, 0.24, 0.12, 0.3], [-0.2, 0.2, 0.13, 0.14, 0.64]];
  const NX = 10, NZ = 10, ex = hx, ez = hz, mx = M(x, DY, z, 0, ry, 0);
  const ht = (lx, lz) => {
    let h = 0;
    for (const [ux, uz, a, b2, uh] of under) { const d = Math.hypot(Math.max(0, Math.abs(lx - ux) - a), Math.max(0, Math.abs(lz - uz) - b2)); h = Math.max(h, uh - d * 1.7); }
    const e = Math.max(Math.abs(lx) / ex, Math.abs(lz) / ez);
    return Math.max(0.012, Math.min(h + noise2(lx * 7 + seed, lz * 7) * 0.03, (1 - e) * 2.4 + 0.012));
  };
  const pt = (i, j) => { const lx = -ex + 2 * ex * i / NX, lz = -ez + 2 * ez * j / NZ; return V(lx, ht(lx, lz), lz).applyMatrix4(mx); };
  for (let j = 0; j < NZ; j++) for (let i = 0; i < NX; i++) {
    const n = noise2(i * 0.7 + seed, j * 0.7) * 0.5 + 0.5;
    K.b.quad(pt(i, j), pt(i, j + 1), pt(i + 1, j + 1), pt(i + 1, j), shade(n > 0.62 ? mix(C.tarp, col(0x6a8494), 0.4) : C.tarp, 0.86 + n * 0.22));
  }
  for (const f of [-0.42, 0.38]) { // 捆绳
    let prev = null;
    for (let i = 0; i <= NX; i++) { const lx = -ex + 2 * ex * i / NX, lz = f * ez, q = V(lx, ht(lx, lz) + 0.014, lz).applyMatrix4(mx); if (prev) K.b.add(rod(prev, q, 0.013, 4), C.rope); prev = q; }
  }
  for (let k = 0; k < 6; k++) { const lx = (k % 3 - 1) * ex * 0.8, lz = (k < 3 ? -1 : 1) * ez * 0.97; K.b.add(box(0.03, 0.02, 0.03), C.steelL, M(0, 0, 0).copy(mx).multiply(M(lx, 0.02, lz))); } // 扣眼
  aoRect(K, x, z, hx + 0.02, hz + 0.02, ry, 0.12, 0.6);
}
function plasticCrate(K, x, y, z, ry, c) {
  const p = at(K.b, M(x, y, z, 0, ry, 0));
  p(box(0.3, 0.2, 0.5), c, 0, 0.1, 0);
  p(box(0.27, 0.02, 0.47), shade(c, 0.5), 0, 0.195, 0);                         // 箱口（里面暗）
  p(box(0.32, 0.03, 0.52), shade(c, 1.1), 0, 0.205, 0, 0, 0, 0, 1, 1, 1);
  for (const sz of [-0.15, 0, 0.15]) for (const sx of [-1, 1]) p(box(0.012, 0.17, 0.03), shade(c, 0.8), sx * 0.155, 0.09, sz); // 竖筋
  for (const sz of [-1, 1]) p(box(0.1, 0.035, 0.012), C.dark, 0, 0.16, sz * 0.252);  // 把手孔
}
function lanternGeo() {
  const b = new Builder();
  b.add(tor(0.05, 0.006, 3, 8, PI), C.steelD, M(0, -0.06, 0));
  b.add(cone(0.075, 0.07, 8), C.lamp, M(0, -0.1, 0));
  b.add(cyl(0.022, 0.022, 0.04, 6), C.lamp, M(0, -0.06, 0));
  b.add(cyl(0.062, 0.072, 0.025, 8), C.lamp, M(0, -0.145, 0));
  for (let k = 0; k < 4; k++) { const a = k * PI / 2 + PI / 4; b.add(box(0.008, 0.14, 0.008), C.steelD, M(Math.cos(a) * 0.066, -0.225, Math.sin(a) * 0.066)); }
  b.add(cyl(0.075, 0.082, 0.065, 8), C.lamp, M(0, -0.33, 0));
  b.add(cyl(0.02, 0.02, 0.02, 6), C.brass, M(0.07, -0.33, 0, 0, 0, PI / 2));
  return b.build();
}

// 一路栏杆：沿船壳内沿立柱，两道扶手；船首舷墙高的地方立在舷墙里侧
function rails(K) {
  const b = K.b;
  for (const side of [-1, 1]) {
    const top = [], mid = [];
    for (let z = -7.15; z <= 6.95; z += z > 4.6 ? 0.55 : 1.0) {
      const w = side * (deckHW(z) - 0.09), ty = Math.max(DY + 0.82, topAt(z) + 0.3);
      b.add(box(0.045, ty - DY, 0.045), C.steel, M(w, (ty + DY) / 2, z));
      b.add(box(0.075, 0.035, 0.075), C.rust, M(w, DY + 0.018, z));
      aoDisc(K, w, z, 0.04, 0.05, 0.35);
      top.push(V(w, ty, z));
      mid.push(topAt(z) < DY + 0.3 ? V(w, DY + 0.42, z) : null);
    }
    for (let i = 0; i < top.length - 1; i++) {
      b.add(rod(top[i], top[i + 1], 0.024, 5), C.steelL);
      if (mid[i] && mid[i + 1]) b.add(rod(mid[i], mid[i + 1], 0.017, 4), C.steel);
    }
    K.railEnd = K.railEnd || []; K.railEnd.push(top[top.length - 1]);
  }
  b.add(rod(K.railEnd[0], K.railEnd[1], 0.024, 5), C.steelL); // 船首把两边接起来
}

// 舱口：厚木围板（三层厚板、钢压条、铁包角带铆钉、楔耳）、暗的舱底、翻下来靠在后围板上的舱盖板、吊灯柱
function hatch(K, rng) {
  const hz = -3.25, H = 0.5, p = at(K.b, M(0, DY, hz));
  const tone = () => shade(C.wood, 0.84 + rng.next() * 0.28);
  p(box(1.93, H - 0.02, 0.12), C.woodD, 0, (H - 0.02) / 2, 0.9); p(box(1.93, H - 0.02, 0.12), C.woodD, 0, (H - 0.02) / 2, -0.9);
  p(box(0.12, H - 0.02, 1.68), C.woodD, 0.9, (H - 0.02) / 2, 0); p(box(0.12, H - 0.02, 1.68), C.woodD, -0.9, (H - 0.02) / 2, 0);
  for (let i = 0; i < 3; i++) {
    const y = 0.085 + i * 0.165, hh = 0.155;
    p(box(1.95, hh, 0.15), tone(), 0, y, 0.9); p(box(1.95, hh, 0.15), tone(), 0, y, -0.9);
    p(box(0.15, hh, 1.65), tone(), 0.9, y, 0); p(box(0.15, hh, 1.65), tone(), -0.9, y, 0);
  }
  p(box(1.99, 0.03, 0.19), C.steelD, 0, H + 0.005, 0.9); p(box(1.99, 0.03, 0.19), C.steelD, 0, H + 0.005, -0.9);
  p(box(0.19, 0.03, 1.61), C.steelD, 0.9, H + 0.005, 0); p(box(0.19, 0.03, 1.61), C.steelD, -0.9, H + 0.005, 0);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    p(box(0.25, H - 0.03, 0.016), C.iron, sx * 0.855, H / 2 - 0.005, sz * 0.983);
    p(box(0.016, H - 0.03, 0.25), C.iron, sx * 0.983, H / 2 - 0.005, sz * 0.855);
    for (const yy of [0.09, 0.25, 0.41]) { p(box(0.032, 0.032, 0.014), C.steelL, sx * 0.9, yy, sz * 0.993); p(box(0.014, 0.032, 0.032), C.steelL, sx * 0.993, yy, sz * 0.9); }
  }
  for (const t of [-0.45, 0.45]) { p(box(0.08, 0.07, 0.05), C.iron, t, 0.34, 0.995); p(box(0.08, 0.07, 0.05), C.iron, t, 0.34, -0.995); p(box(0.05, 0.07, 0.08), C.iron, 0.995, 0.34, t); p(box(0.05, 0.07, 0.08), C.iron, -0.995, 0.34, t); }
  p(box(1.65, 0.05, 1.65), col(0x120d09), 0, 0.02, 0);
  for (const x of [-0.55, -0.18, 0.18, 0.55]) p(box(0.025, 0.052, 1.65), col(0x070504), x, 0.021, 0);
  // 吊灯柱（前围板上两根），左边那根挂着马灯
  for (const sx of [-1, 1]) { p(box(0.06, 0.9, 0.06), C.steel, sx * 0.55, 0.6, 0.9); p(box(0.08, 0.03, 0.08), C.steelD, sx * 0.55, 1.06, 0.9); }
  p(box(0.24, 0.03, 0.03), C.steelD, -0.66, 1.02, 0.9);
  K.lanternAt.push(V(-0.76, DY + 1.0, hz + 0.9));
  // 舱盖板：三块，翻下来斜靠在后围板外面（不高过围板，不挡舱里那一堆）
  const th = 0.38, w = 0.44, t = 0.045, ca = Math.cos(th), sa = Math.sin(th);
  for (let i = 0; i < 3; i++) {
    const zb = hz - 0.975 - sa * w - 0.012 - i * (t + 0.006) / ca, cy = w / 2 * ca + t / 2 * sa, cz = zb + w / 2 * sa - t / 2 * ca;
    const q = at(K.b, M(0, DY + cy, cz, -(PI / 2 - th), 0, 0));
    q(box(1.72, t, w), tone(), 0, 0, 0);
    for (const sx of [-0.62, 0.62]) q(box(0.05, t + 0.012, w + 0.004), C.iron, sx, 0, 0);
    q(box(0.1, t + 0.006, 0.1), C.white, -0.2 + i * 0.2, 0.002, 0.04);
    q(tor(0.045, 0.01, 3, 8, PI), C.rope, 0.82, 0.03, 0.05, PI / 2, 0, 0);
  }
  aoRect(K, 0, hz - 1.2, 0.88, 0.13, 0, 0.1, 0.55);
  aoRect(K, 0, hz, 0.985, 0.985, 0, 0.16, 0.62);
}

// 清洗位：钢格栅（框、一根根栅条、两道横撑，沾着泥）；水管卷（架子、转鼓、缠着的水管）；水桶；甲板上一截水管通到格栅
function washStation(K, rng) {
  const gx = 0.9, gz = -6.0, HX = 0.97, HZ = 0.92, b = K.b;
  b.add(box(2 * HX + 0.06, 0.045, 0.06), C.galv, M(gx, DY + 0.0225, gz - HZ)); b.add(box(2 * HX + 0.06, 0.045, 0.06), C.galv, M(gx, DY + 0.0225, gz + HZ));
  b.add(box(0.06, 0.045, 2 * HZ), C.galv, M(gx - HX, DY + 0.0225, gz)); b.add(box(0.06, 0.045, 2 * HZ), C.galv, M(gx + HX, DY + 0.0225, gz));
  for (let i = 0; i < 19; i++) {
    const xx = gx - HX + 0.07 + i * (2 * HX - 0.14) / 18, m = rng.next();
    b.add(box(0.03, 0.036, 2 * HZ - 0.04), m > 0.55 ? mix(C.galv, C.mud, 0.35 + m * 0.4) : shade(C.galv, 0.82 + m * 0.3), M(xx, DY + 0.02, gz));
  }
  for (const s of [-0.45, 0.45]) b.add(box(2 * HX - 0.04, 0.024, 0.04), shade(C.galv, 0.7), M(gx, DY + 0.012, gz + s));
  aoRect(K, gx, gz, HX + 0.03, HZ + 0.03, 0, 0.05, 0.3);
  // 水管卷（转轴沿船宽，侧面朝两舷的镜头，冲洗时转起来看得见）
  const rx = -0.52, rz = -5.6, hy = DY + 0.4;
  for (const sx of [-0.165, 0.165]) {
    b.add(rod(V(rx + sx, DY + 0.03, rz - 0.27), V(rx + sx, hy, rz), 0.022, 5), C.steel);
    b.add(rod(V(rx + sx, DY + 0.03, rz + 0.27), V(rx + sx, hy, rz), 0.022, 5), C.steel);
    b.add(box(0.05, 0.035, 0.62), C.steelD, M(rx + sx, DY + 0.018, rz));
    b.add(cyl(0.05, 0.05, 0.05, 8), C.steelD, M(rx + sx, hy, rz, 0, 0, PI / 2));
  }
  b.add(box(0.38, 0.03, 0.05), C.steelD, M(rx, DY + 0.1, rz - 0.19)); b.add(box(0.38, 0.03, 0.05), C.steelD, M(rx, DY + 0.1, rz + 0.19));
  aoRect(K, rx, rz, 0.2, 0.32, 0, 0.1, 0.5);
  const r = new Builder();
  r.add(cyl(0.11, 0.11, 0.24, 10), C.steelD, M(0, 0, 0, 0, 0, PI / 2)); r.add(cyl(0.025, 0.025, 0.5, 6), C.chrome, M(0, 0, 0, 0, 0, PI / 2));
  for (const sx of [-0.118, 0.118]) {
    r.add(cyl(0.29, 0.29, 0.016, 14), C.red, M(sx, 0, 0, 0, 0, PI / 2));
    for (let k = 0; k < 4; k++) { const a = k * PI / 2 + 0.4; r.add(cyl(0.045, 0.045, 0.022, 6), C.dark, M(sx, Math.cos(a) * 0.19, Math.sin(a) * 0.19, 0, 0, PI / 2)); }
    r.add(box(0.024, 0.075, 0.03), C.white, M(sx * 1.03, 0.245, 0));
  }
  for (let k = 0; k < 4; k++) for (let l = 0; l < 2; l++) r.add(tor(0.155 + l * 0.05, 0.026, 4, 12), shade(C.hose, 0.88 + 0.14 * ((k + l) & 1)), M(-0.075 + k * 0.05, 0, 0, 0, PI / 2, 0));
  r.add(box(0.018, 0.2, 0.028), C.steelD, M(0.22, 0.1, 0)); r.add(cyl(0.02, 0.02, 0.1, 6), C.dark, M(0.27, 0.2, 0, 0, 0, PI / 2)); // 摇把
  K.reel = { geo: r.build(), pos: V(rx, hy, rz) };
  // 从鼓上放下来一截，在甲板上弯到格栅边，枪头搁在格栅上
  const pts = [V(rx + 0.02, hy - 0.2, rz + 0.12), V(rx + 0.08, DY + 0.06, rz + 0.36), V(rx + 0.25, DY + 0.024, rz + 0.62), V(rx + 0.52, DY + 0.024, rz + 0.66), V(rx + 0.68, DY + 0.03, rz + 0.5), V(rx + 0.78, DY + 0.07, rz + 0.3)];
  b.add(tube(pts, 0.024, 4), C.hose);
  b.add(cyl(0.028, 0.034, 0.16, 6), C.brass, M(rx + 0.84, DY + 0.085, rz + 0.16, PI / 2 - 0.15, 0.6, 0));
  for (const q of pts.slice(2, 5)) aoDisc(K, q.x, q.z, 0.04, 0.05, 0.4);
  bucket(K, -0.52, -6.18, 0.3, C.galv, true);
  b.add(box(0.06, 0.03, 0.2), C.wood, M(-0.5, DY + 0.27, -6.16, 0.2, 0.4, 0.5)); b.add(box(0.05, 0.02, 0.17), C.ropeD, M(-0.52, DY + 0.25, -6.17, 0.2, 0.4, 0.5)); // 桶里的刷子
  // 湿与泥：格栅四周、通往右舷排水口的槽、溅出去的泥点、往舱口抱东西滴的水
  K.wet.push(['wet', gx, gz, 1.15, 1.08, 0, 0.75, 0.85, 1], ['mud', gx, gz, 1.0, 0.95, 0, 0.55, 0.7, 1], ['wet', 2.35, gz, 0.55, 0.12, 0, 0.15, 0.9], ['mud', 2.35, gz, 0.55, 0.09, 0, 0.12, 0.6]);
  K.wet.push(['wet', rx + 0.35, rz + 0.5, 0.35, 0.2, 0.4, 0.2, 0.5], ['wet', -1.15, -6.0, 0.62, 0.75, 0, 0.12, 0.35]);
  for (let i = 0; i < 46; i++) {
    const a = rng.next() * PI * 2, d = 0.95 + rng.next() * 1.3, x = gx + Math.cos(a) * d * 1.05, z = gz + Math.sin(a) * d * 0.85;
    if (Math.abs(x) > 2.6 || z < -7.5) continue;
    const r0 = 0.03 + rng.next() * 0.09;
    K.wet.push(['mud', x, z, r0, r0 * (0.6 + rng.next() * 0.6), rng.next() * 3, 0.03, 0.55 + rng.next() * 0.4, 1], ['wet', x, z, r0 * 1.6, r0 * 1.4, 0, 0.05, 0.6, 1]);
  }
  for (let i = 0; i < 16; i++) { const t = i / 15, x = 0.6 - t * 0.55 + Math.sin(i * 2.1) * 0.12, z = -5.0 + t * 0.62 + Math.cos(i * 1.7) * 0.06; K.wet.push(['wet', x, z, 0.05 + (i % 3) * 0.02, 0.04, 0, 0.04, 0.55, 1], ['mud', x, z, 0.03, 0.025, 0, 0.03, 0.35, 1]); }
}

// 驾驶室：窗框一格格、门（门框、圆窗、门把、合页、踢脚板）、钢板接缝与铆钉、梯子、灭火器、救生圈、消防栓箱、舷灯罩；
// 屋顶栏杆、雷达底座、探照灯、汽笛、天线、救生筏筒、烟囱细节、桅杆（桅灯罩、横桁、旗杆）
function wheelhouse(K) {
  const b = K.b, y0 = DY, z0 = 3.1, c = C.cream;
  // 空心的驾驶室：四面薄墙，窗洞里是半透明玻璃（另一个网格），里面有操纵台、舵轮、罗经座和海图桌——
  // 站在舵后的船长从窗里看得见；人走到驾驶室后面，按墙和窗框的轮廓被挡住
  const T = 0.06, WB = 1.235, WT = 2.005, X0 = -1.55, X1 = 1.55, Z0 = 1.6, Z1 = 4.6;
  const wallX = (xa, xb, ya, yb, z, col2 = c) => b.add(box(xb - xa, yb - ya, T), col2, M((xa + xb) / 2, y0 + (ya + yb) / 2, z));
  const wallZ = (za, zb, ya, yb, x, col2 = c) => b.add(box(T, yb - ya, zb - za), col2, M(x, y0 + (ya + yb) / 2, (za + zb) / 2));
  for (const z of [Z1 - T / 2, Z0 + T / 2]) { wallX(X0, X1, 0, WB, z); wallX(X0, X1, WT, 2.1, z); }
  for (const x of [X1 - T / 2, X0 + T / 2]) { wallZ(Z0, Z1, 0, WB, x); wallZ(Z0, Z1, WT, 2.1, x); }
  for (const [xa, xb] of [[-1.55, -1.46], [-0.8, -0.71], [-0.05, 0.05], [0.71, 0.8], [1.46, 1.55]]) wallX(xa, xb, WB, WT, Z1 - T / 2);
  for (const [xa, xb] of [[-1.55, -1.12], [-0.64, -0.54], [-0.06, 1.55]]) wallX(xa, xb, WB, WT, Z0 + T / 2);
  for (const x of [X1 - T / 2, X0 + T / 2]) for (const [za, zb] of [[1.6, 1.68], [2.42, 2.58], [3.32, 3.48], [4.22, 4.6]]) wallZ(za, zb, WB, WT, x);
  // 勒脚一圈、外墙钢板接缝（只沿外皮，不穿进屋里）
  for (const z of [Z1 + 0.005, Z0 - 0.005]) b.add(box(3.16, 0.14, 0.05), C.cream2, M(0, y0 + 0.07, z));
  for (const x of [X1 + 0.005, X0 - 0.005]) b.add(box(0.05, 0.14, 3.06), C.cream2, M(x, y0 + 0.07, z0));
  const sc = shade(c, 0.72);
  for (const z of [Z1 + 0.004, Z0 - 0.004]) { b.add(box(3.115, 0.014, 0.012), sc, M(0, y0 + 1.13, z)); b.add(box(0.014, 1.0, 0.012), sc, M(0, y0 + 0.62, z)); }
  for (const x of [X1 + 0.004, X0 - 0.004]) { b.add(box(0.012, 0.014, 3.015), sc, M(x, y0 + 1.13, z0)); b.add(box(0.012, 1.0, 0.014), sc, M(x, y0 + 0.62, z0)); }
  // 屋里：木地板、操纵台（仪表、油门杆）、舵轮（立柱、轮辐、把手）、罗经座、海图桌和一盏小灯
  const inW = col(0x9c9278), dk = col(0x2a2e2c);
  b.add(box(3.0, 0.02, 2.88), col(0x6a5238), M(0, y0 + 0.01, z0));
  b.add(box(2.7, 0.95, 0.42), col(0x3a4a4c), M(0, y0 + 0.475, Z1 - T - 0.21));
  b.add(box(2.7, 0.06, 0.5), dk, M(0, y0 + 0.98, Z1 - T - 0.25, -0.3, 0, 0));
  for (const x of [-0.9, -0.5, 0.95, 1.2]) { b.add(cyl(0.07, 0.07, 0.02, 10), col(0xd8d0b0), M(x, y0 + 1.03, Z1 - 0.32, PI / 2 - 0.3, 0, 0)); b.add(box(0.01, 0.06, 0.012), col(0x1a1a1a), M(x, y0 + 1.04, Z1 - 0.31, -0.3, 0, 0.6)); }
  b.add(box(0.05, 0.22, 0.05), C.steelL, M(-0.1, y0 + 1.1, Z1 - 0.4, -0.4, 0, 0)); b.add(sph(0.045, 6, 4), col(0xb03020), M(-0.1, y0 + 1.21, Z1 - 0.45));
  const hx = 0.45, hz = 3.92, hy = y0 + 1.15;
  b.add(box(0.14, 1.0, 0.14), dk, M(hx, y0 + 0.55, hz + 0.12));
  b.add(cyl(0.05, 0.05, 0.22, 8), C.brass, M(hx, hy, hz + 0.04, PI / 2, 0, 0));
  b.add(tor(0.27, 0.025, 5, 16), col(0x7a5030), M(hx, hy, hz - 0.06));
  for (let k = 0; k < 8; k++) { const a = k * PI / 4; b.add(rod(V(hx, hy, hz - 0.06), V(hx + Math.cos(a) * 0.36, hy + Math.sin(a) * 0.36, hz - 0.06), 0.014, 4), col(0x8a5a34)); b.add(sph(0.022, 5, 3), col(0x8a5a34), M(hx + Math.cos(a) * 0.37, hy + Math.sin(a) * 0.37, hz - 0.06)); }
  b.add(cyl(0.05, 0.05, 0.05, 10), C.brass, M(hx, hy, hz - 0.07, PI / 2, 0, 0));
  b.add(cyl(0.11, 0.13, 0.9, 10), col(0x6a4a2e), M(-0.55, y0 + 0.45, 3.95)); b.add(sph(0.13, 10, 6), C.brass, M(-0.55, y0 + 0.95, 3.95, 0, 0, 0, 1, 0.6, 1));
  b.add(box(0.55, 0.85, 1.0), col(0x5a4430), M(-1.17, y0 + 0.425, 2.5)); b.add(box(0.6, 0.04, 1.05), col(0x7a5c3c), M(-1.17, y0 + 0.87, 2.5)); b.add(box(0.42, 0.005, 0.6), col(0xd8ccaa), M(-1.15, y0 + 0.895, 2.5, 0, 0.08, 0));
  b.add(box(2.96, 0.02, 2.86), inW, M(0, y0 + 2.085, z0));
  K.lanternAt.push(V(-0.9, y0 + 2.05, 3.0));
  const rv = (x, y, z) => b.add(box(0.03, 0.03, 0.03), shade(c, 0.86), M(x, y, z));
  for (let x = -1.45; x <= 1.46; x += 0.29) { rv(x, y0 + 1.13, 4.605); rv(x, y0 + 1.13, 1.595); rv(x, y0 + 0.2, 4.605); }
  for (let z = 1.75; z <= 4.5; z += 0.29) { rv(1.555, y0 + 1.13, z); rv(-1.555, y0 + 1.13, z); }
  for (const x of [-1.555, 1.555]) for (let y = y0 + 0.3; y < y0 + 1.1; y += 0.27) { rv(x, y, 4.56); rv(x, y, 1.64); }
  // 窗：一块块玻璃，奶白窗框
  const wy = y0 + 1.62, wh = 0.72; // 大窗：舵后船长的脸露在窗里
  const pane = (x, z, w, nx, nz) => {
    const al = nx === 0;
    K.gl.add(box(al ? w : 0.02, wh, al ? 0.02 : w), col(0x9fc4cc), M(x, wy, z));
    const ox = nx * 0.012, oz = nz * 0.012;
    b.add(box(al ? w + 0.09 : 0.045, 0.045, al ? 0.045 : w + 0.09), C.creamW, M(x + ox, wy + wh / 2 + 0.02, z + oz));
    b.add(box(al ? w + 0.09 : 0.045, 0.06, al ? 0.045 : w + 0.09), C.creamW, M(x + ox, wy - wh / 2 - 0.025, z + oz));
    for (const s of [-1, 1]) b.add(box(0.045, wh + 0.05, 0.045), C.creamW, M(al ? x + s * (w / 2 + 0.02) : x + ox, wy, al ? z + oz : z + s * (w / 2 + 0.02)));
  };
  for (const x of [-1.13, -0.38, 0.38, 1.13]) pane(x, 4.605, 0.66, 0, 1);
  for (const s of [-1, 1]) for (const z of [2.05, 2.95, 3.85]) pane(s * 1.555, z, 0.74, s, 0);
  for (const x of [-0.88, -0.3]) pane(x, 1.595, 0.48, 0, -1);
  b.add(box(3.3, 0.035, 0.26), C.roof, M(0, wy + wh / 2 + 0.07, 4.7, 0.18, 0, 0)); // 前窗遮阳檐
  for (const x of [-0.38, 0.38]) b.add(box(0.014, 0.38, 0.014), C.dark, M(x - 0.08, wy - 0.12, 4.63, 0, 0, 0.55)); // 雨刷
  // 门（后壁右侧）
  b.add(box(1.0, 1.72, 0.04), C.cream2, M(0.6, y0 + 0.86, 1.585));
  b.add(box(0.86, 1.6, 0.06), C.door, M(0.6, y0 + 0.82, 1.57));
  b.add(tor(0.11, 0.025, 4, 12), C.brass, M(0.6, y0 + 1.25, 1.535));
  b.add(cyl(0.095, 0.095, 0.02, 12), C.glass, M(0.6, y0 + 1.25, 1.538, PI / 2, 0, 0));
  b.add(box(0.05, 0.13, 0.03), C.brass, M(0.96, y0 + 0.85, 1.528)); b.add(sph(0.032, 6, 4), C.brass, M(0.96, y0 + 0.85, 1.505));
  for (const y of [0.35, 1.3]) b.add(box(0.03, 0.12, 0.04), C.iron, M(0.19, y0 + y, 1.535));
  b.add(box(0.8, 0.17, 0.012), C.steelL, M(0.6, y0 + 0.12, 1.535));
  b.add(box(1.04, 0.07, 0.2), C.iron, M(0.6, y0 + 0.035, 1.5));
  aoRect(K, 0, z0, 1.58, 1.53, 0, 0.18, 0.6);
  // 后壁：梯子（上到屋顶）、灭火器、门边挂马灯
  for (const x of [-1.5, -1.22]) { b.add(box(0.04, 2.62, 0.04), C.steelL, M(x, y0 + 1.31, 1.52)); for (const y of [0.5, 1.5]) b.add(box(0.03, 0.03, 0.08), C.steelD, M(x, y0 + y, 1.56)); }
  for (let y = y0 + 0.3; y < y0 + 2.2; y += 0.3) b.add(box(0.3, 0.03, 0.03), C.steelL, M(-1.36, y, 1.52));
  aoRect(K, -1.36, 1.52, 0.17, 0.05, 0, 0.05, 0.4);
  extinguisher(K, -0.45, y0 + 0.78, 1.51, 0);
  b.add(box(0.03, 0.03, 0.09), C.steelD, M(1.3, y0 + 1.76, 1.55)); b.add(box(0.025, 0.06, 0.025), C.steelD, M(1.3, y0 + 1.74, 1.51));
  K.lanternAt.push(V(1.3, y0 + 1.72, 1.51));
  // 右壁救生圈，左壁消防栓箱，两侧舷灯罩（灯片另做，会慢闪）
  lifeRing(K, 1.64, y0 + 0.9, 2.45, PI / 2);
  b.add(box(0.1, 0.5, 0.44), C.redB, M(-1.6, y0 + 0.78, 2.5)); b.add(box(0.012, 0.46, 0.012), C.dark, M(-1.652, y0 + 0.78, 2.5));
  b.add(box(0.012, 0.08, 0.2), C.white, M(-1.656, y0 + 0.92, 2.4)); b.add(box(0.02, 0.06, 0.03), C.brass, M(-1.66, y0 + 0.7, 2.62));
  for (const s of [-1, 1]) { b.add(box(0.1, 0.17, 0.2), C.dark, M(s * 1.6, y0 + 1.05, 4.34)); b.add(box(0.02, 0.22, 0.36), C.dark, M(s * 1.6, y0 + 1.05, 4.18)); }
  K.lights.push({ c: 0xff3a2a, p: V(-1.66, y0 + 1.05, 4.38), s: [0.04, 0.1, 0.12] }, { c: 0x3dff6a, p: V(1.66, y0 + 1.05, 4.38), s: [0.04, 0.1, 0.12] });
  // 屋顶
  b.add(box(3.5, 0.18, 3.5), C.roof, M(0, y0 + 2.2, z0));
  b.add(box(3.54, 0.04, 3.54), C.cream2, M(0, y0 + 2.12, z0));
  const posts = [];
  for (let k = 0; k <= 4; k++) { const t = -1.68 + k * 0.84; posts.push([t, 1.42], [t, 4.78]); }
  for (let k = 1; k < 4; k++) { const t = 1.42 + k * 0.84; posts.push([-1.68, t], [1.68, t]); }
  for (const [x, z] of posts) b.add(box(0.035, 0.4, 0.035), C.steel, M(x, ROOF + 0.2, z));
  const rr = (a, c2) => b.add(rod(V(a[0], ROOF + 0.4, a[1]), V(c2[0], ROOF + 0.4, c2[1]), 0.02, 4), C.steelL);
  rr([-1.68, 4.78], [1.68, 4.78]); rr([-1.68, 1.42], [-1.68, 4.78]); rr([1.68, 1.42], [1.68, 4.78]); rr([1.68, 1.42], [-0.84, 1.42]);
  // 雷达底座（天线另做，会转）、探照灯、救生筏筒、天线、GPS
  b.add(box(0.26, 0.3, 0.26), C.creamW, M(-0.25, ROOF + 0.15, 4.05)); b.add(cyl(0.1, 0.12, 0.06, 8), C.dark, M(-0.25, ROOF + 0.33, 4.05));
  K.radarAt = V(-0.25, ROOF + 0.38, 4.05);
  b.add(cyl(0.07, 0.09, 0.06, 8), C.dark, M(1.25, ROOF + 0.03, 4.45)); b.add(cyl(0.025, 0.025, 0.2, 6), C.dark, M(1.25, ROOF + 0.15, 4.45));
  b.add(box(0.32, 0.035, 0.05), C.dark, M(1.25, ROOF + 0.26, 4.45)); for (const s of [-1, 1]) b.add(box(0.03, 0.18, 0.05), C.dark, M(1.25 + s * 0.15, ROOF + 0.34, 4.45));
  b.add(cyl(0.12, 0.135, 0.3, 10), C.creamW, M(1.25, ROOF + 0.38, 4.47, PI / 2, 0, 0)); b.add(cyl(0.106, 0.106, 0.02, 10), col(0xf2e6b0), M(1.25, ROOF + 0.38, 4.625, PI / 2, 0, 0));
  b.add(cyl(0.1, 0.1, 0.03, 10), C.dark, M(1.25, ROOF + 0.38, 4.31, PI / 2, 0, 0));
  for (const x of [0.28, 0.82]) b.add(box(0.06, 0.12, 0.44), C.dark, M(x, ROOF + 0.06, 2.0));
  b.add(cyl(0.21, 0.21, 0.74, 12), C.white, M(0.55, ROOF + 0.3, 2.0, 0, 0, PI / 2));
  for (const x of [0.33, 0.77]) b.add(tor(0.212, 0.014, 3, 12), C.dark, M(x, ROOF + 0.3, 2.0, 0, PI / 2, 0));
  for (const s of [-1, 1]) { b.add(box(0.06, 0.08, 0.06), C.dark, M(s * 1.45, ROOF + 0.04, 1.6)); b.add(rod(V(s * 1.45, ROOF + 0.08, 1.6), V(s * 1.47, ROOF + 1.7, 1.6), 0.013, 4), C.creamW); }
  b.add(cyl(0.015, 0.015, 0.12, 4), C.dark, M(1.3, ROOF + 0.06, 2.6)); b.add(sph(0.075, 8, 4), C.creamW, M(1.3, ROOF + 0.13, 2.6, 0, 0, 0, 1, 0.6, 1));
  // 烟囱：底座、红箍两道白边、顶口卷边和烟熏黑、前面的汽笛
  b.add(cyl(0.5, 0.55, 0.12, 12), C.dark, M(-0.6, ROOF + 0.06, 2.2));
  b.add(cyl(0.38, 0.42, 1.6, 12), C.dark, M(-0.6, y0 + 2.9, 2.2));
  b.add(cyl(0.4, 0.4, 0.25, 12), C.red, M(-0.6, y0 + 3.4, 2.2));
  for (const y of [3.265, 3.535]) b.add(cyl(0.402, 0.402, 0.025, 12), C.creamW, M(-0.6, y0 + y, 2.2));
  b.add(tor(0.375, 0.035, 4, 12), C.iron, M(-0.6, y0 + 3.7, 2.2, PI / 2));
  b.add(cyl(0.34, 0.34, 0.02, 12), col(0x0a0a0a), M(-0.6, y0 + 3.66, 2.2));
  b.add(box(0.26, 0.04, 0.1), C.dark, M(-0.6, y0 + 3.05, 2.62));
  for (const s of [-1, 1]) b.add(cone(0.065, 0.34, 8), C.brass, M(-0.6 + s * 0.08, y0 + 3.1, 2.75, -PI / 2, 0, 0));
  b.add(rod(V(-0.6, ROOF + 0.1, 2.64), V(-0.6, y0 + 3.04, 2.64), 0.02, 4), C.dark);
  // 桅杆：杆、横桁、桅灯罩、顶灯座、旗杆；两根信号绳
  b.add(cyl(0.06, 0.07, 3.0, 6), C.dark, M(0.7, y0 + 3.6, 3.6));
  b.add(box(1.2, 0.06, 0.06), C.dark, M(0.7, y0 + 4.6, 3.6));
  b.add(box(0.11, 0.15, 0.1), C.dark, M(0.7, y0 + 4.3, 3.69));
  b.add(cyl(0.08, 0.09, 0.04, 8), C.dark, M(0.7, y0 + 5.09, 3.6)); b.add(cyl(0.085, 0.07, 0.03, 8), C.dark, M(0.7, y0 + 5.235, 3.6));
  b.add(cyl(0.013, 0.013, 0.48, 4), C.creamW, M(0.7, y0 + 5.49, 3.6)); b.add(sph(0.025, 5, 3), C.brass, M(0.7, y0 + 5.74, 3.6));
  b.add(rod(V(0.12, y0 + 4.6, 3.6), V(-0.1, ROOF + 0.4, 4.78), 0.006, 3), C.ropeD); b.add(rod(V(1.28, y0 + 4.6, 3.6), V(1.68, ROOF + 0.4, 3.8), 0.006, 3), C.ropeD);
  K.lights.push({ c: 0xfff4d8, p: V(0.7, y0 + 4.3, 3.75), s: [0.07, 0.09, 0.03] }, { c: 0xfff4d8, p: V(0.7, y0 + 5.16, 3.6), s: [0.12, 0.1, 0.12], round: true });
  K.flagAt = V(0.7, y0 + 5.72, 3.6);
}

// 船首：锚机（底座、齿轮箱、两只链轮带刹车、两头绞缆筒、手轮）、锚链进锚链管、双系缆桩、导缆滚轮
function bow(K) {
  const b = K.b, z0 = 5.4, p = at(b, M(0, DY, z0));
  p(box(1.25, 0.1, 0.62), C.iron, 0, 0.05, 0);
  p(box(0.46, 0.4, 0.5), C.machine, 0, 0.3, 0); p(box(0.5, 0.06, 0.54), shade(C.machine, 0.8), 0, 0.52, 0);
  p(cyl(0.05, 0.05, 1.36, 8), C.steelD, 0, 0.4, 0, 0, 0, PI / 2);
  for (const s of [-1, 1]) {
    p(cyl(0.19, 0.19, 0.12, 12), C.dark, s * 0.36, 0.4, 0, 0, 0, PI / 2);
    p(tor(0.2, 0.025, 4, 12), C.rust, s * 0.36, 0.4, 0, 0, PI / 2, 0);
    p(box(0.06, 0.32, 0.36), C.iron, s * 0.27, 0.22, 0);
    b.add(lathe([[0.15, 0], [0.115, 0.05], [0.1, 0.13], [0.115, 0.21], [0.15, 0.26], [0.001, 0.27]], 12), C.steelL, M(s * 0.5, DY + 0.4, z0, 0, 0, -s * PI / 2));
    p(tor(0.085, 0.012, 3, 10), C.red, s * 0.36, 0.66, 0.2, 0, 0, 0); p(cyl(0.012, 0.012, 0.2, 4), C.steelD, s * 0.36, 0.55, 0.2);
    // 锚链：一节节环，正反相间，从链轮顶上下来，斜着进舷边的锚链管
    const a = V(s * 0.36, DY + 0.56, z0 + 0.1), m = V(s * 0.5, DY + 0.03, z0 + 0.62), e = V(s * 1.02, DY + 0.03, 6.05);
    let k = 0;
    for (const [A, B2] of [[a, m], [m, e]]) {
      const L = A.distanceTo(B2), n = Math.max(2, Math.round(L / 0.075));
      for (let i = 0; i < n; i++, k++) {
        const t = (i + 0.5) / n, q = A.clone().lerp(B2, t), d = B2.clone().sub(A).normalize();
        const ry = Math.atan2(-d.z, d.x), rz = Math.asin(clamp(d.y, -1, 1));
        b.add(tor(0.036, 0.011, 3, 6), C.iron, M(q.x, q.y + (k & 1 ? 0 : 0.01), q.z, k & 1 ? PI / 2 : 0, ry, rz, 1.45, 1, 1, 'YZX'));
      }
    }
    b.add(cyl(0.1, 0.11, 0.06, 10), C.iron, M(e.x + s * 0.05, DY + 0.03, e.z + 0.04));
    b.add(cyl(0.07, 0.07, 0.065, 10), col(0x0a0a0a), M(e.x + s * 0.05, DY + 0.035, e.z + 0.04));
    aoRect(K, (a.x + e.x) / 2, (a.z + e.z) / 2, 0.06, 0.45, Math.atan2(e.x - a.x, e.z - a.z), 0.06, 0.35);
    bollard(K, s * 0.62, 6.78, PI / 2 + s * 0.35, true);
    const fz = 6.25, fx = s * (deckHW(fz) - 0.08), fy = topAt(fz);
    b.add(box(0.14, 0.05, 0.32), C.iron, M(fx, fy + 0.02, fz, 0, s * 0.5, 0));
    for (const o of [-0.1, 0.1]) b.add(cyl(0.045, 0.045, 0.16, 8), C.steelD, M(fx + Math.sin(s * 0.5) * o, fy + 0.12, fz + Math.cos(s * 0.5) * o));
  }
  aoRect(K, 0, z0, 0.64, 0.33, 0, 0.12, 0.62);
}

// 船壳外面：旧轮胎护舷（绳子拴在栏杆上）、舷窗、锚链孔和锚、船名（方块拼的字母）、船尾排气管、导缆钳
const FONT = { C: ['111', '100', '100', '100', '111'], H: ['101', '101', '111', '101', '101'], E: ['111', '100', '110', '100', '111'], N: ['1001', '1101', '1011', '1001', '1001'], Z: ['111', '001', '010', '100', '111'], A: ['010', '101', '111', '101', '101'], I: ['111', '010', '010', '010', '111'], S: ['111', '100', '111', '001', '111'], D: ['110', '101', '101', '101', '110'], '0': ['111', '101', '101', '101', '111'], '7': ['111', '001', '010', '010', '010'], '-': ['000', '000', '111', '000', '000'] };
function lettersOnHull(K, text, side, z0, y0, px, c) {
  let z = z0;
  const dir = side > 0 ? -1 : 1;   // 从舷外看从左往右读
  for (const ch of text) {
    const g = FONT[ch]; if (!g) { z += dir * px * 2; continue; }
    for (let row = 0; row < 5; row++) for (let colI = 0; colI < g[row].length; colI++) {
      if (g[row][colI] !== '1') continue;
      const zz = z + dir * (colI + 0.5) * px, yy = y0 + (4 - row + 0.5) * px;
      const [nx, nz] = sideN(zz, yy), x = side * (hullX(zz, yy) + 0.008);
      patch(K.b, x, yy, zz, side * nx, nz, px * 0.92, px * 0.92, c);
    }
    z += dir * (g[0].length + 1) * px;
  }
}
function lettersOnTransom(K, text, x0, y0, px, c) {
  let x = x0;
  for (const ch of text) {
    const g = FONT[ch]; if (!g) { x -= px * 2; continue; }
    for (let row = 0; row < 5; row++) for (let colI = 0; colI < g[row].length; colI++) if (g[row][colI] === '1') patch(K.b, x - (colI + 0.5) * px, y0 + (4 - row + 0.5) * px, -PL / 2 - 0.008, 0, -1, px * 0.92, px * 0.92, c);
    x -= (g[0].length + 1) * px;
  }
}
function hullOutside(K) {
  const b = K.b;
  for (const side of [-1, 1]) {
    for (const z of [-5.0, -2.5, 0.6]) {           // 旧轮胎护舷
      const y = 0.75, x = side * (hullX(z, y) + 0.21);
      b.add(tor(0.25, 0.095, 6, 12), (px, py, pz) => (noise2(px * 9, py * 9 + pz * 3) > 0.35 ? col(0x2a2b2b) : C.rubber), M(x, y, z, 0, PI / 2, side * 0.12, 1, 1, 1, 'ZYX'));
      b.add(rod(V(x - side * 0.02, y + 0.33, z), V(side * (deckHW(z) - 0.09), DY + 0.8, z + 0.05), 0.014, 4), C.rope);
    }
    for (const z of [2.25, 3.25]) {                  // 舷窗
      const y = 0.74, [nx, nz] = sideN(z, y), x = side * (hullX(z, y) + 0.01), ry = Math.atan2(side * nx, nz);
      b.add(tor(0.12, 0.03, 4, 12), C.brass, M(x, y, z, 0, ry, 0));
      b.add(cyl(0.1, 0.1, 0.02, 10), C.glass, M(x - side * nx * 0.005, y, z, PI / 2, ry, 0));
    }
    { // 锚链孔和锚
      const z = 5.75, y = topAt(z) - 0.42, [nx, nz] = sideN(z, y), x = side * hullX(z, y), ry = Math.atan2(side * nx, nz);
      b.add(tor(0.13, 0.045, 5, 12), C.iron, M(x + side * nx * 0.02, y, z + nz * 0.02, 0, ry, 0));
      b.add(cyl(0.1, 0.1, 0.03, 10), col(0x0a0a0a), M(x, y, z, PI / 2, ry, 0));
      const q = at(b, M(x + side * nx * 0.07, y, z + nz * 0.07, 0, ry, 0));
      q(box(0.08, 0.6, 0.07), C.iron, 0, -0.34, 0.0);
      q(box(0.34, 0.08, 0.12), C.iron, 0, -0.66, 0.0);
      for (const s of [-1, 1]) q(box(0.08, 0.3, 0.07), shade(C.iron, 1.15), s * 0.14, -0.55, 0.02, 0.15, 0, s * 0.55);
      q(tor(0.05, 0.015, 3, 8), C.iron, 0, -0.02, 0.0, 0, PI / 2, 0);
    }
    for (const z of [-7.2]) { const x = side * 2.12; bollard(K, x, z - 0.18, 0, false); }
  }
  // 船名：左右舷首部奶白条上的深色方块字；船尾分两段写船名和船籍港编号
  lettersOnHull(K, 'CHENZHAI', 1, 5.0, 0.86, 0.042, C.creamW);
  lettersOnHull(K, 'CHENZHAI', -1, 3.62, 0.86, 0.042, C.creamW);
  lettersOnTransom(K, 'CHEN', 1.25, 0.72, 0.05, C.white); lettersOnTransom(K, 'ZHAI', -0.3, 0.72, 0.05, C.white);
  lettersOnTransom(K, 'SD-07', 0.95, 0.5, 0.034, C.white);
  for (const s of [-1, 1]) {           // 船尾排气管（开船时冒热气）、尾部导缆钳
    b.add(cyl(0.065, 0.075, 0.18, 8), C.iron, M(s * 0.75, 0.36, -PL / 2 - 0.08, PI / 2, 0, 0));
    b.add(cyl(0.05, 0.05, 0.02, 8), col(0x050505), M(s * 0.75, 0.36, -PL / 2 - 0.172, PI / 2, 0, 0));
    const ty = topAt(-PL / 2 + 0.05);
    b.add(box(0.3, 0.06, 0.14), C.iron, M(s * 1.55, ty + 0.03, -PL / 2 + 0.06));
    b.add(tor(0.075, 0.03, 4, 10), C.iron, M(s * 1.55, ty + 0.12, -PL / 2 + 0.06, 0, 0, 0, 1.4, 1, 1));
  }
}

// 甲板上其余的东西：吊臂底座（螺栓、警示带）、缆绳卷、木箱/油桶/油布堆、舱口边的工具箱与小绳卷、
// 左舷尾的塑料箱、右舷栏杆上的拖把和甲板刷、灭火器、浮子串、左舷尾救生圈
function deckItems(K, rng) {
  const b = K.b;
  b.add(cyl(0.75, 0.85, 0.35, 16), C.steel, M(0, DY + 0.17, -0.9));
  b.add(new THREE.CylinderGeometry(0.766, 0.795, 0.12, 16, 1, true), C.haz, M(0, DY + 0.27, -0.9));
  b.add(cyl(0.89, 0.89, 0.03, 20), C.steelD, M(0, DY + 0.015, -0.9));
  for (let k = 0; k < 16; k++) { const a = k / 16 * PI * 2; b.add(cyl(0.022, 0.026, 0.035, 6), C.iron, M(Math.cos(a) * 0.87, DY + 0.045, -0.9 + Math.sin(a) * 0.87)); }
  aoDisc(K, 0, -0.9, 0.86, 0.14, 0.6);
  // 盘好的缆绳：几圈叠着，最上面一圈收小，绳头甩出来
  const cx = 1.25, cz = -1.9;
  for (let k = 0; k < 4; k++) b.add(tor(0.36 - k * 0.025, 0.045, 5, 16), (px, py, pz) => ((Math.floor(Math.atan2(pz - cz, px - cx) * 8 + k * 2) & 1) ? C.rope : shade(C.rope, 0.86)), M(cx + Math.sin(k) * 0.015, DY + 0.045 + k * 0.075, cz, PI / 2, 0, 0));
  b.add(tor(0.2, 0.04, 5, 12), C.ropeD, M(cx + 0.05, DY + 0.33, cz, PI / 2 + 0.1, 0, 0));
  b.add(tube([V(cx + 0.33, DY + 0.06, cz + 0.12), V(cx + 0.48, DY + 0.03, cz + 0.32), V(cx + 0.42, DY + 0.03, cz + 0.52)], 0.04, 4), C.rope);
  aoDisc(K, cx, cz, 0.42, 0.12, 0.6);
  // 驾驶室后壁左边一角：油布盖着的一堆、木箱（上面一罐漆）、蓝油桶
  tarpPile(K, -1.2, 1.08, 0.4, 0.4, 0.05, 3.1);
  crate(K, -0.6, 1.33, 0.42, 0.42, 0.42, 0.18, rng);
  b.add(cyl(0.08, 0.08, 0.12, 8), C.ochre, M(-0.6, DY + 0.5, 1.33)); b.add(cyl(0.082, 0.082, 0.012, 8), C.steelL, M(-0.6, DY + 0.566, 1.33));
  drum(K, -0.56, 0.86, 0.24, 0.84, C.drum, 0.4, 7.3);
  // 舱口后两角：工具箱、一小盘撇缆
  toolbox(K, 1.08, -4.36, 0.08, C.redB);
  for (let k = 0; k < 3; k++) b.add(tor(0.13 - k * 0.018, 0.022, 4, 12), shade(C.rope, 0.9 + k * 0.06), M(-1.08, DY + 0.022 + k * 0.035, -4.36, PI / 2, 0, 0));
  aoDisc(K, -1.08, -4.36, 0.16, 0.06, 0.55);
  // 左舷尾：两只叠着的塑料箱
  plasticCrate(K, -2.56, DY, -5.75, 0.03, C.plastic); plasticCrate(K, -2.56, DY + 0.22, -5.74, -0.06, shade(C.plastic, 0.9));
  aoRect(K, -2.56, -5.75, 0.16, 0.26, 0, 0.1, 0.6);
  lifeRing(K, -2.9, DY + 0.5, -6.4, PI / 2, false);
  // 右舷尾栏杆：拖把和甲板刷靠着，灭火器卡在立柱上
  const rx = deckHW(-6.7) - 0.09;
  mop(K, rx - 0.14, -6.95, rx - 0.02, DY + 1.25, -6.9);
  deckBrush(K, rx - 0.22, -6.5, rx - 0.01, DY + 0.84, -6.42);
  extinguisher(K, deckHW(-5.15) - 0.18, DY + 0.4, -5.15, PI / 2);
  // 右舷栏杆外搭着一串渔网浮子
  const fx = deckHW(-2.9) + 0.06;
  let prev = V(fx - 0.12, DY + 0.82, -3.45);
  for (let i = 0; i <= 10; i++) {
    const t = i / 10, z = -3.45 + t * 1.1, y = DY + 0.82 - Math.sin(t * PI) * 0.36, q = V(fx + Math.sin(t * PI) * 0.05, y, z);
    b.add(rod(prev, q, 0.01, 3), C.rope); prev = q;
    if (i > 0 && i < 10 && (i & 1)) b.add(sph(0.07, 7, 5), i % 4 === 1 ? C.plastic : C.white, M(q.x + 0.02, q.y - 0.07, q.z, 0, 0, 0, 1, 0.85, 1));
  }
}

// ———————————————————————— 吊臂各段 ————————————————————————
export function craneGeos() {
  const och = C.ochre, dark = C.dark;
  const tb = new Builder();
  tb.add(cyl(0.55, 0.6, 0.9, 12), och, M(0, 0.45, 0));
  tb.add(tor(0.6, 0.05, 4, 20), C.iron, M(0, 0.06, 0, PI / 2));               // 回转支承
  tb.add(box(1.1, 0.9, 1.2), och, M(0, 1.05, -0.2));
  tb.add(box(1.16, 0.05, 1.26), C.ochreD, M(0, 1.52, -0.2));                  // 顶盖
  tb.add(box(0.7, 0.5, 0.06), C.glass, M(0.25, 1.15, -0.82));                  // 驾驶小室窗（后、右）
  tb.add(box(0.78, 0.05, 0.07), C.ochreD, M(0.25, 1.42, -0.83)); tb.add(box(0.78, 0.05, 0.07), C.ochreD, M(0.25, 0.88, -0.83));
  tb.add(box(0.06, 0.4, 0.62), C.glass, M(0.56, 1.15, -0.3));
  tb.add(box(0.07, 0.05, 0.7), C.ochreD, M(0.565, 1.38, -0.3)); tb.add(box(0.07, 0.05, 0.7), C.ochreD, M(0.565, 0.93, -0.3));
  tb.add(box(0.78, 0.4, 0.14), C.haz, M(-0.05, 0.82, -0.87));                  // 配重（黑黄斜纹）
  tb.add(cyl(0.18, 0.18, 0.62, 12), dark, M(0, 1.62, -0.45, 0, 0, PI / 2));    // 起升卷筒
  for (let k = -2; k <= 2; k++) tb.add(cyl(0.187, 0.187, 0.045, 12), C.steelL, M(k * 0.1, 1.62, -0.45, 0, 0, PI / 2));
  for (const s of [-1, 1]) tb.add(cyl(0.23, 0.23, 0.03, 12), C.ochreD, M(s * 0.32, 1.62, -0.45, 0, 0, PI / 2));
  for (const s of [-1, 1]) tb.add(box(0.07, 0.56, 0.56), C.ochreD, M(s * 0.32, 1.36, 0.28));     // 臂根耳板
  tb.add(cyl(0.3, 0.3, 0.5, 8), dark, M(0, 1.5, 0.3, 0, 0, PI / 2));
  tb.add(cyl(0.06, 0.06, 0.76, 8), C.chrome, M(0, 1.5, 0.3, 0, 0, PI / 2));
  tb.add(box(0.26, 0.2, 0.32), C.ochreD, M(0, 0.72, 0.48));                   // 油缸下铰座
  tb.add(cyl(0.05, 0.05, 0.3, 6), C.chrome, M(0, 0.72, 0.62, 0, 0, PI / 2));
  for (const s of [-1, 1]) tb.add(rod(V(s * 0.2, 0.6, 0.42), V(s * 0.12, 0.95, 0.55), 0.02, 4), C.rubber);  // 液压软管
  tb.add(box(0.3, 0.12, 0.012), C.white, M(-0.2, 1.2, -0.806));                // 铭牌
  const s0 = new Builder();
  s0.add(box(0.5, 0.5, 4.3), och, M(0, 0, 2.15));
  for (let z = 0.4; z < 3.7; z += 0.6) s0.add(box(0.54, 0.08, 0.08), dark, M(0, 0.22, z));
  s0.add(box(0.51, 0.51, 0.34), C.haz, M(0, 0, 3.98));                          // 臂口警示斜纹
  s0.add(box(0.6, 0.06, 0.16), C.iron, M(0, 0.28, 4.24)); s0.add(box(0.6, 0.06, 0.16), C.iron, M(0, -0.28, 4.24)); // 套接箍
  for (const s of [-1, 1]) s0.add(box(0.06, 0.62, 0.16), C.iron, M(s * 0.28, 0, 4.24));
  for (const s of [-1, 1]) { s0.add(box(0.026, 0.026, 3.5), C.ochreW, M(s * 0.245, 0.245, 1.95)); s0.add(box(0.03, 0.03, 3.3), C.rubber, M(s * 0.265, -0.12, 2.0)); } // 磨亮的棱、液压软管
  s0.add(box(0.505, 0.02, 3.6), C.ochreD, M(0, -0.245, 2.0));                  // 底面油污
  s0.add(box(0.012, 0.14, 0.46), dark, M(0.256, 0.05, 1.3));                   // 载荷牌
  for (let k = 0; k < 4; k++) s0.add(box(0.014, 0.025, 0.06 + (k % 2) * 0.05), C.white, M(0.26, 0.09 - (k >> 1) * 0.06, 1.17 + (k % 2) * 0.15));
  s0.add(cyl(0.08, 0.08, 0.12, 8), dark, M(0, 0.3, 0.25, 0, 0, PI / 2)); for (const s of [-1, 1]) s0.add(box(0.03, 0.16, 0.2), C.ochreD, M(s * 0.075, 0.3, 0.25));
  s0.add(box(0.028, 0.028, 4.05), C.iron, M(0, 0.375, 2.28));                   // 钢缆（臂根导轮到臂口这一段）
  s0.add(cyl(0.05, 0.05, 0.12, 8), dark, M(0, 0.33, 4.3, 0, 0, PI / 2));         // 臂口导轮
  const s1 = new Builder();
  s1.add(box(0.38, 0.38, 4.4), shade(och, 0.92), M(0, 0, -2.2));
  s1.add(box(0.39, 0.39, 0.3), C.haz, M(0, 0, -0.32));
  s1.add(box(0.46, 0.05, 0.13), C.iron, M(0, 0.215, -0.07)); s1.add(box(0.46, 0.05, 0.13), C.iron, M(0, -0.215, -0.07));
  for (const s of [-1, 1]) { s1.add(box(0.05, 0.48, 0.13), C.iron, M(s * 0.215, 0, -0.07)); s1.add(box(0.02, 0.02, 3.8), C.ochreW, M(s * 0.186, 0.186, -2.3)); }
  const s2 = new Builder();
  s2.add(box(0.28, 0.28, 4.8), shade(och, 0.85), M(0, 0, -2.4));
  s2.add(box(0.29, 0.29, 0.26), C.haz, M(0, 0, -0.42));
  for (const s of [-1, 1]) { s2.add(box(0.04, 0.44, 0.5), och, M(s * 0.13, -0.1, -0.03)); s2.add(box(0.016, 0.016, 4.0), C.ochreW, M(s * 0.137, 0.137, -2.6)); }
  s2.add(cyl(0.2, 0.2, 0.12, 14), dark, M(0, -0.1, 0, 0, 0, PI / 2));          // 臂端滑轮
  s2.add(tor(0.2, 0.024, 4, 14), C.steelD, M(0, -0.1, 0, 0, PI / 2, 0));
  s2.add(cyl(0.04, 0.04, 0.36, 8), C.chrome, M(0, -0.1, 0, 0, 0, PI / 2));
  s2.add(box(0.03, 0.12, 0.03), C.steelD, M(0, -0.2, -0.2)); s2.add(cone(0.12, 0.09, 8), dark, M(0, -0.25, -0.2)); // 工作灯罩
  return { turret: tb.build(), sec0: s0.build(), sec1: s1.build(), sec2: s2.build() };
}
// 活体水槽（单独的网格：揭宝近景挡镜头时会暂时隐去）
export function tankGeo(T) {
  const b = new Builder(), x = T.x, z = T.z, w = C.water;
  b.add(box(1.0, 0.1, 1.3), C.steel, M(x, DY + 0.05, z));
  b.add(box(0.95, 0.02, 1.25), shade(w, 0.55), M(x, DY + 0.11, z));               // 槽底（玻璃槽，水和槽里的活物另做成半透明）
  for (const k of [-0.4, 0, 0.4]) for (const s of [-1, 1]) b.add(box(0.03, 0.5, 0.05), shade(w, 0.78), M(x + s * 0.485, DY + 0.36, z + k));
  for (const k of [-0.28, 0.28]) for (const s of [-1, 1]) b.add(box(0.05, 0.5, 0.03), shade(w, 0.78), M(x + k, DY + 0.36, z + s * 0.635));
  b.add(box(1.0, 0.04, 0.06), C.steelD, M(x, DY + 0.675, z - 0.62)); b.add(box(1.0, 0.04, 0.06), C.steelD, M(x, DY + 0.675, z + 0.62));
  b.add(box(0.06, 0.04, 1.3), C.steelD, M(x - 0.47, DY + 0.675, z)); b.add(box(0.06, 0.04, 1.3), C.steelD, M(x + 0.47, DY + 0.675, z));
  for (const [px, pz] of [[-0.48, -0.63], [0.48, -0.63], [-0.48, 0.63], [0.48, 0.63]]) b.add(box(0.06, 0.75, 0.06), C.steel, M(x + px, DY + 0.38, z + pz));
  b.add(rod(V(x + 0.3, DY + 0.02, z - 0.69), V(x + 0.3, DY + 0.8, z - 0.69), 0.03, 6), C.steelD);
  b.add(rod(V(x + 0.3, DY + 0.8, z - 0.69), V(x + 0.3, DY + 0.76, z - 0.45), 0.03, 6), C.steelD);
  b.add(tor(0.07, 0.012, 3, 10), C.red, M(x + 0.3, DY + 0.45, z - 0.73)); b.add(box(0.14, 0.012, 0.012), C.red, M(x + 0.3, DY + 0.45, z - 0.73));
  b.add(cyl(0.035, 0.035, 0.08, 6), C.brass, M(x - 0.3, DY + 0.16, z + 0.66, PI / 2, 0, 0));
  b.add(box(0.22, 0.1, 0.006), C.white, M(x, DY + 0.45, z + 0.629));
  const g = b.build();
  groundShade(g);
  return g;
}
// 水槽里的水：半透明的一槽海水，水面一层亮一点、随船晃出细波；槽里的活物透过玻璃看得见
export function tankWater(T) {
  const b = new Builder();
  b.add(box(0.93, 0.5, 1.23), C.water, M(T.x, DY + 0.37, T.z));
  const m = patchMaterial(new THREE.MeshLambertMaterial({ vertexColors: true, transparent: true, opacity: 0.38, depthWrite: false }), {
    key: 'tankwater',
    preWater: `{ vec3 Vt = normalize(cameraPosition - vWPos); float top = step(0.6, wn.y);
  float rip = sin(vWPos.x * 23.0 + uTime * 3.1) * sin(vWPos.z * 19.0 - uTime * 2.3);
  outgoingLight = mix(outgoingLight, vec3(0.7, 0.86, 0.86), top * (0.14 + 0.12 * rip)) + vec3(0.9) * top * smoothstep(0.75, 0.98, rip) * 0.25;
  diffuseColor.a = mix(0.3, 0.4, top) + 0.25 * pow(1.0 - abs(dot(normalize(wn), Vt)), 2.0); }`, // 水面薄一点：从大景往下看也看得见槽里的蟹在走（A6）
  });
  const mesh = new THREE.Mesh(b.build(), m);
  mesh.renderOrder = 3;
  return mesh;
}

// 落地处压暗：贴着甲板（或驾驶室顶）的那一圈顶点按离地高度压暗，矮小的东西压得重、高大的墙面几乎不压
function groundShade(g) {
  const p = g.attributes.position.array, c = g.attributes.color.array;
  for (let t = 0; t < p.length; t += 9) {
    const y0 = Math.min(p[t + 1], p[t + 4], p[t + 7]), y1 = Math.max(p[t + 1], p[t + 4], p[t + 7]);
    const kk = smooth(0.9, 0.2, y1 - y0);
    if (kk <= 0) continue;
    for (let v = 0; v < 3; v++) {
      const o = t + v * 3;
      if ((c[o] > 0.97 && c[o + 1] < 0.03 && c[o + 2] > 0.97) || (c[o] < 0.03 && c[o + 1] > 0.97 && c[o + 2] > 0.97)) continue;
      const x = p[o], y = p[o + 1], z = p[o + 2];
      const onRoof = Math.abs(x) < 1.76 && z > 1.34 && z < 4.86 && y > ROOF - 0.02;
      const h = y - (onRoof ? ROOF : DY);
      if (h < -0.01 || h > 0.16) continue;
      const f = 1 - (1 - (0.56 + 0.44 * smooth(0, 0.16, h))) * kk;
      c[o] *= f; c[o + 1] *= f; c[o + 2] *= f;
    }
  }
  g.attributes.color.needsUpdate = true;
}

// ———————————————————————— 组装 ————————————————————————
export function buildLook(P, B) {
  F = hullFrame(P); PL = P.L;
  const rng = new RNG(20261014);
  const K = { b: new Builder(), gl: new Builder(), ao: [], wet: [], lights: [], lanternAt: [], reel: null, radarAt: null, flagAt: null };
  const hullGeo = buildHull(P);
  wheelhouse(K); rails(K); hatch(K, rng); washStation(K, rng); bow(K); hullOutside(K); deckItems(K, rng);
  const pm = propsMaterial();
  const dg = K.b.build(); groundShade(dg);
  const deckMesh = new THREE.Mesh(dg, pm); deckMesh.castShadow = true; deckMesh.receiveShadow = true;
  const hull = new THREE.Mesh(hullGeo, hullMaterial(bakeDeckTex(K)));
  hull.castShadow = true; hull.receiveShadow = true;
  const L = { hull, deckMesh, mat: pm, extras: [], t: null, flagYaw: 0, reelV: 0, lit: [], lanterns: [] };
  // 会动的小件
  const radar = new Builder();
  radar.add(box(1.1, 0.08, 0.13), C.creamW, M(0, 0.05, 0)); radar.add(box(1.08, 0.05, 0.012), C.dark, M(0, 0.05, 0.068)); radar.add(cyl(0.06, 0.07, 0.06, 8), C.dark, M(0, -0.01, 0));
  L.radar = new THREE.Mesh(radar.build(), pm); L.radar.position.copy(K.radarAt); L.radar.castShadow = true;
  const reel = new THREE.Mesh(K.reel.geo, pm); reel.castShadow = true; L.reel = new THREE.Group(); L.reel.position.copy(K.reel.pos); L.reel.add(reel);
  // 桅顶小旗（顶点着色器里随风抖）
  const fb = new Builder(), FW = 0.46, FH = 0.3, NX = 8;
  for (let i = 0; i < NX; i++) for (let j = 0; j < 2; j++) {
    const x0 = FW * i / NX, x1 = FW * (i + 1) / NX, y0 = -FH * (j + 1) / 2, y1 = -FH * j / 2;
    fb.quad(V(x0, y0, 0), V(x1, y0, 0), V(x1, y1, 0), V(x0, y1, 0), j === 0 ? C.ochre : C.dark);
  }
  L.flagU = { value: new THREE.Vector3(0, 0.5, 0) };
  const fm = patchMaterial(new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true, side: THREE.DoubleSide }), {
    key: 'boatflag', uniforms: { uFlag: L.flagU }, vertexPars: 'uniform vec3 uFlag;',
    vertex: `vec3 transformed = vec3(position);
float fk = clamp(position.x / ${FW.toFixed(2)}, 0.0, 1.0);
transformed.z += (sin(position.x * 11.0 - uFlag.x) * 0.07 + sin(position.x * 23.0 - uFlag.x * 1.7 + position.y * 9.0) * 0.025) * fk * uFlag.y;
transformed.y -= fk * fk * 0.18 * (1.0 - uFlag.y);
transformed.x -= fk * fk * 0.1 * (1.0 - uFlag.y);`,
  });
  L.flag = new THREE.Mesh(fb.build(), fm); L.flag.position.copy(K.flagAt);
  // 灯片：舷灯左红右绿、桅灯白，慢慢一明一暗
  for (const l of K.lights) {
    const m = basicWaterMat(l.c, { key: 'boatlight' });
    const mesh = new THREE.Mesh(l.round ? new THREE.CylinderGeometry(l.s[0] * 0.5, l.s[0] * 0.5, l.s[1], 8) : new THREE.BoxGeometry(...l.s), m);
    mesh.position.copy(l.p);
    L.lit.push({ m, base: new THREE.Color(l.c), ph: L.lit.length * 0.7 });
    L.extras.push(mesh);
  }
  // 马灯（挂着，随船晃；灯罩里一点暖光微微跳）
  const lg = lanternGeo(), glass = basicWaterMat(0xffc870, { key: 'boatlight' });
  L.glass = glass;
  for (const p of K.lanternAt) {
    const g = new THREE.Group(); g.position.copy(p);
    const body = new THREE.Mesh(lg, pm); body.castShadow = true; g.add(body);
    const gl = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.058, 0.13, 8), glass); gl.position.y = -0.225; g.add(gl);
    L.lanterns.push(g); L.extras.push(g);
  }
  // 船尾排气口的热气（开船时才有）
  const sg = new THREE.BufferGeometry(), sp = [], sh = [];
  for (const s of [-1, 1]) for (const rot of [0, PI / 2]) {
    const cx = s * 0.75, cz = -PL / 2 - 0.25, dx = Math.cos(rot) * 0.16, dz = Math.sin(rot) * 0.16;
    for (let k = 0; k < 8; k++) {
      const a = k / 8, b2 = (k + 1) / 8, ya = 0.42 + a * 1.25, yb = 0.42 + b2 * 1.25, ra = 0.6 + a * 0.9, rb = 0.6 + b2 * 0.9;
      const q = [[cx - dx * ra, ya, cz - dz * ra - a * 0.35, a], [cx + dx * ra, ya, cz + dz * ra - a * 0.35, a], [cx + dx * rb, yb, cz + dz * rb - b2 * 0.35, b2], [cx - dx * rb, yb, cz - dz * rb - b2 * 0.35, b2]];
      for (const i of [0, 1, 2, 0, 2, 3]) { sp.push(q[i][0], q[i][1], q[i][2]); sh.push(q[i][3]); }
    }
  }
  sg.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3)); sg.setAttribute('aH', new THREE.Float32BufferAttribute(sh, 1));
  L.heatU = { uT: { value: 0 }, uK: { value: 0 } };
  L.heat = new THREE.Mesh(sg, new THREE.ShaderMaterial({
    uniforms: L.heatU, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    vertexShader: /* glsl */`uniform float uT; uniform float uK; attribute float aH; varying float vH; varying vec3 vP;
void main() { vec3 p = position; vH = aH; p.x += (sin(aH * 9.0 - uT * 11.0 + p.z * 7.0) * 0.07 + sin(aH * 17.0 - uT * 17.0 + p.x * 5.0) * 0.035) * aH; p.z -= aH * aH * 0.6 * uK; vP = p;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0); }`,
    fragmentShader: /* glsl */`uniform float uT; uniform float uK; varying float vH; varying vec3 vP;
void main() { float a = uK * 0.2 * smoothstep(0.0, 0.18, vH) * (1.0 - smoothstep(0.45, 1.0, vH)) * (0.5 + 0.5 * sin(vH * 24.0 - uT * 18.0 + vP.x * 29.0 + vP.z * 13.0));
  if (a < 0.012) discard; gl_FragColor = vec4(0.95, 0.92, 0.86, a);
  #include <colorspace_fragment>
}`,
  }));
  L.heat.frustumCulled = false; L.heat.visible = false;
  // 驾驶室窗玻璃：半透明，看得见屋里；按观察角度从透到反光（掠射时更像一面镜子）
  const gm = patchMaterial(new THREE.MeshLambertMaterial({ vertexColors: true, transparent: true, opacity: 0.3, depthWrite: false, side: THREE.DoubleSide }), {
    key: 'boatglass',
    preWater: `{ vec3 Vg = normalize(cameraPosition - vWPos); float fr = pow(1.0 - abs(dot(normalize(wn), Vg)), 3.0);
  outgoingLight = mix(outgoingLight * 0.6, vec3(0.62, 0.74, 0.76), fr * 0.7); diffuseColor.a = 0.22 + 0.6 * fr; }`,
  });
  L.windows = new THREE.Mesh(K.gl.build(), gm); L.windows.renderOrder = 2;
  L.extras.push(L.radar, L.reel, L.flag, L.heat, L.windows);
  return L;
}

// 吊臂上会动的：液压油缸（随俯仰伸缩）、卷筒到臂根的一段钢缆、臂口到臂端滑轮的一段钢缆、臂端下面晃的吊钩滑轮
export function attachCraneLook(L, boat) {
  const pm = L.mat, cb = new Builder();
  cb.add(cyl(0.085, 0.085, 1.1, 10), C.ochreD, M(0, 0.55, 0)); cb.add(cyl(0.1, 0.1, 0.08, 10), C.iron, M(0, 1.08, 0)); cb.add(box(0.12, 0.14, 0.12), C.iron, M(0, 0, 0));
  const rb = new Builder();
  rb.add(cyl(0.045, 0.045, 1.1, 8), C.chrome, M(0, -0.55, 0)); rb.add(box(0.1, 0.12, 0.1), C.iron, M(0, 0, 0));
  L.barrel = new THREE.Mesh(cb.build(), pm); L.rodM = new THREE.Mesh(rb.build(), pm);
  L.barrel.castShadow = L.rodM.castShadow = true;
  boat.craneYawNode.add(L.barrel, L.rodM);
  const cg = new THREE.BoxGeometry(0.028, 0.028, 1);
  const cm = new Builder(); cm.add(cg, C.iron); const cgeo = cm.build();
  L.cab1 = new THREE.Mesh(cgeo, pm); L.cab2 = new THREE.Mesh(cgeo, pm);
  boat.craneYawNode.add(L.cab1); boat.boomNode.add(L.cab2);
  const hb = new Builder();
  hb.add(box(0.03, 0.14, 0.03), C.steelD, M(0, -0.08, 0));
  hb.add(box(0.15, 0.2, 0.1), C.haz, M(0, -0.25, 0));
  hb.add(cyl(0.07, 0.07, 0.11, 10), C.dark, M(0, -0.25, 0, 0, 0, PI / 2));
  hb.add(cyl(0.02, 0.02, 0.08, 6), C.steelD, M(0, -0.39, 0));
  hb.add(tor(0.06, 0.017, 4, 10, PI * 1.4), C.ochre, M(0.02, -0.48, 0, 0, 0, -0.65));
  L.hook = new THREE.Mesh(hb.build(), pm); L.hook.castShadow = true;
  boat.boomNode.add(L.hook);
  L.v1 = new THREE.Vector3(); L.v2 = new THREE.Vector3(); L.up = new THREE.Vector3(0, 1, 0); L.fz = new THREE.Vector3(0, 0, 1);
}
// 把一段（单位长、沿 z 的）钢缆摆到 a→b
function seg(L, mesh, ax, ay, az, bx, by, bz) {
  const d = L.v1.set(bx - ax, by - ay, bz - az), len = d.length() || 1e-3;
  mesh.position.set((ax + bx) / 2, (ay + by) / 2, (az + bz) / 2);
  mesh.quaternion.setFromUnitVectors(L.fz, d.multiplyScalar(1 / len));
  mesh.scale.set(1, 1, len);
}

// 吊着重东西时臂往下弯（C4）：整根臂在根部多垂一点，每一节再在套口处往下折一点（里面套着的那截不顶穿外面那节）。
// b：弯的程度（1 = 吊着珍品，负的是卸了劲往上弹）；e1、e2：第一、二节伸出了多少米。返回 [臂根多垂, 第一节折, 第二节再折]（弧度），
// 和分量压弯（B10）、被拽（W5）的角度加在一起，由 boat.updateVisual 摆臂；吊钩、马灯、油缸、钢缆在 animateLook 里跟着臂端、臂根走
export function flexAngles(e1, e2, b) {
  if (!b) return [0, 0, 0];
  const m1 = 0.055 / Math.max(0.4, 4.4 - e1), m2 = 0.05 / Math.max(0.4, 4.5 - e2);
  return [0.035 * b, clamp(0.055 * b, -m1, m1), clamp(0.05 * b, -m2, m2)];
}

// 每帧：vis.washing（或 boat.washing）= 正在冲洗
export function animateLook(L, boat, t, vis) {
  const dt = L.t == null ? 0 : clamp(t - L.t, 0, 0.1); L.t = t;
  L.radar.rotation.y = t * 2.4;
  // 小旗朝视风的下风方向（真风 − 船速，换到船上的方向）；风越大抖得越快越平
  const h = boat.heading, sp = boat.speed, ch = Math.cos(h), sh = Math.sin(h);
  const gw = 1 + 1.6 * (boat.gustFx || 0); // 一阵风扫过（A3，breeze.js）
  const ax = 2.2 * gw - sh * sp, az = 1.3 * gw - ch * sp, lx = ax * ch - az * sh, lz = ax * sh + az * ch, aw = Math.hypot(lx, lz);
  L.flagYaw += angDiff(L.flagYaw, Math.atan2(-lz, lx)) * Math.min(1, dt * 2.5);
  L.flag.rotation.y = L.flagYaw;
  L.flagU.value.x += dt * (5 + aw * 1.5); L.flagU.value.y = clamp(0.3 + aw * 0.075, 0.3, 1);
  // 舷灯、桅灯慢闪
  for (const l of L.lit) { const k = 0.5 + 0.5 * Math.sin(t * 1.9 + l.ph); l.m.color.copy(l.base).multiplyScalar(0.4 + 0.6 * k * k); }
  L.glass.color.setRGB(1, 0.78, 0.44).multiplyScalar(0.85 + 0.15 * Math.sin(t * 13.0) * Math.sin(t * 7.3 + 1.0));
  // 水管卷：冲洗时转起来（快慢有个过程）
  const washing = vis && vis.washing != null ? !!vis.washing : !!boat.washing;
  L.reelV += ((washing ? 3.4 : 0) - L.reelV) * Math.min(1, dt * 2.2);
  L.reel.rotation.x -= L.reelV * dt;
  // 挂着的东西在世界里大致竖直：相对船身朝侧倾的反方向摆，再加一点自己的晃
  const roll = boat.bob.rotation.z, pit = boat.bob.rotation.x;
  for (let i = 0; i < L.lanterns.length; i++) { const g = L.lanterns[i]; g.rotation.set(-pit * 2.5 + Math.sin(t * 1.4 + i) * 0.05, 0, -roll * 3 + Math.sin(t * 1.9 + i * 2) * 0.09); }
  // 吊钩挂在臂端滑轮下面（吊臂被压弯时跟着臂端走，自己仍然竖直往下垂）
  const tp = boat.tipNode.position, tz = tp.z;
  L.hook.position.set(0, tp.y + 0.1, tz);
  L.hook.rotation.set(-boat.boomNode.rotation.x - pit * 2 + Math.sin(t * 1.6) * 0.06, 0, -roll * 2.5 + Math.sin(t * 1.25 + 0.7) * 0.07);
  // 液压油缸：下铰在转台前面，上铰在第一节臂底下（随俯仰算）
  const c = Math.cos(-boat.boomNode.rotation.x), s = Math.sin(-boat.boomNode.rotation.x); // 压弯时油缸跟着臂根一起被压短一点
  const by = 1.5 - 0.27 * c + 1.7 * s, bz = 0.3 + 0.27 * s + 1.7 * c;
  L.v2.set(0, by - 0.72, bz - 0.62).normalize();
  L.barrel.position.set(0, 0.72, 0.62); L.barrel.quaternion.setFromUnitVectors(L.up, L.v2);
  L.rodM.position.set(0, by, bz); L.rodM.quaternion.copy(L.barrel.quaternion);
  // 钢缆：卷筒顶 → 臂根导轮（转台坐标），臂口导轮 → 臂端滑轮顶（臂坐标）
  seg(L, L.cab1, 0, 1.8, -0.45, 0, 1.5 + 0.38 * c + 0.25 * s, 0.3 - 0.38 * s + 0.25 * c);
  seg(L, L.cab2, 0, 0.375, 4.3, 0, tp.y + 0.3, tz - 0.04);
  // 开船时船尾排气口有热气
  const hk = smooth(0.8, 4.5, Math.abs(sp));
  L.heatU.uK.value = hk; L.heatU.uT.value = t; L.heat.visible = hk > 0.01;
}

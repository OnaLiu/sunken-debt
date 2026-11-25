// 共用材质：Lambert + 顶点色 + 水下吸收／散射 + 焦散；物件另带“泥垢”遮盖
import * as THREE from 'three';

export const NREG = 8;
export const SHARED = {
  uTime: { value: 0 },
  uWReg: { value: Array.from({ length: NREG }, () => new THREE.Vector4(0, 0, 100, 0)) },
  uWExt: { value: Array.from({ length: NREG }, () => new THREE.Vector4(0.06, 0.04, 0.035, 0)) },
  uWCol: { value: Array.from({ length: NREG }, () => new THREE.Vector4(0.02, 0.1, 0.12, 1)) },
  uWBaseExt: { value: new THREE.Vector4(0.12, 0.06, 0.05, 0) },
  uWBaseCol: { value: new THREE.Vector4(0.015, 0.075, 0.085, 1) },
  uCausticOn: { value: 1 },
  uCurrent: { value: new THREE.Vector2(0.5, 0.2) },
  uDist: { value: Array.from({ length: 6 }, () => new THREE.Vector4(0, 0, 0, 1)) },
  // 网架压在海底：x, z, 压倒几成（0~1）, 网口半径。草在这一圈里整片倒伏，回收和冲洗期间慢慢立回来（两格：上一网还没立好时不会突然弹起）
  uPress: { value: Array.from({ length: 2 }, () => new THREE.Vector4(0, 0, 0, 1)) },
  uLamp: { value: new THREE.Vector4(0, -1, 0, 0) },
  uSunDirW: { value: new THREE.Vector3(-0.45, 0.82, 0.36).normalize() },
  uSunIrr: { value: new THREE.Color(1.0, 0.94, 0.85).multiplyScalar(3.1) },
  uLampCol: { value: new THREE.Color(1.0, 0.86, 0.62) },
};

// 海底的涌（A4 海底是活的）：一道道从头顶经过的涌（约 8 秒一道，往东北走，每道快慢有点不一样），0..1，浪头那一窄条最大。
// 草跟着往前一倒再回来、梢头抖一阵，沙上的光斑跟着亮一下、晃一下。草（顶点）和光斑（片元）用同一个，所以对得上
export const SURGE_GLSL = /* glsl */`
float surgeAt(vec2 p) { float ph = dot(p, vec2(0.8, 0.6)) * 0.085 - uTime * 0.78; float s = 0.5 + 0.5 * sin(ph + 0.6 * sin(ph * 0.37 + 1.3)); return s * s * s * s; }
`;

export const WATER_GLSL = /* glsl */`
uniform float uTime;
uniform vec4 uWReg[${NREG}];
uniform vec4 uWExt[${NREG}];
uniform vec4 uWCol[${NREG}];
uniform vec4 uWBaseExt;
uniform vec4 uWBaseCol;
uniform float uCausticOn;
uniform vec4 uLamp;
uniform vec3 uLampCol;
uniform vec3 uSunDirW;
uniform vec3 uSunIrr;
void waterParams(vec2 p, out vec3 ext, out vec4 wcol) {
  float ws = 1.0; ext = uWBaseExt.rgb; wcol = uWBaseCol;
  for (int i = 0; i < ${NREG}; i++) {
    vec2 d = p - uWReg[i].xy;
    float r = max(uWReg[i].z, 1.0);
    float w = uWReg[i].w * exp(-dot(d, d) / (r * r));
    ext += uWExt[i].rgb * w; wcol += uWCol[i] * w; ws += w;
  }
  ext /= ws; wcol /= ws;
}
${SURGE_GLSL}
float causticPat(vec2 uv, float time) {
  vec2 p = mod(uv * 6.28318, 6.28318) - 250.0;
  vec2 i = p; float c = 1.0; float inten = 0.005;
  for (int n = 0; n < 3; n++) {
    float t = time * (1.0 - (3.5 / float(n + 1)));
    i = p + vec2(cos(t - i.x) + sin(t + i.y), sin(t - i.y) + cos(t + i.x));
    c += 1.0 / length(vec2(p.x / (sin(i.x + t) / inten), p.y / (cos(i.y + t) / inten)));
  }
  c /= 3.0; c = 1.17 - pow(c, 1.4);
  return clamp(pow(abs(c), 8.0), 0.0, 1.5);
}
vec3 applyWater(vec3 c, vec3 wp, vec3 n, float shadow) {
  float k = smoothstep(0.08, -0.35, wp.y);
  if (k <= 0.0) return c;
  vec3 ext; vec4 wcol; waterParams(wp.xz, ext, wcol);
  float depth = max(-wp.y, 0.0);
  vec3 down = exp(-ext * depth * 0.8);
  vec3 lit = c * down;
  // 涌经过时光斑亮一下、往前晃一点（A4）
  float sg = surgeAt(wp.xz) * (1.0 - smoothstep(4.0, 14.0, depth));
  vec2 cw = wp.xz + vec2(0.8, 0.6) * sg * 0.7;
  float cs = (causticPat(cw / 7.0, uTime * 0.7) + 0.6 * causticPat(cw / 3.1 + 3.7, uTime * 0.9)) * (1.0 + 0.65 * sg);
  lit += c * cs * down * 1.35 * wcol.a * uCausticOn * clamp(n.y * 1.2, 0.0, 1.0) * (0.25 + 0.75 * shadow) * exp(-depth * 0.05);
  // 作业灯：从臂端/网架往下照的一圈暖光（越接近海底越清楚）
  if (uLamp.w > 0.0) {
    float vd = max(uLamp.y - wp.y, 0.0);
    vec2 dl = wp.xz - uLamp.xz;
    float R = 1.5 + vd * 0.14;
    float fall = exp(-dot(dl, dl) / (R * R)) * exp(-length(ext) * vd * 0.35) * (0.08 + 0.92 * smoothstep(4.0, 18.0, vd));
    lit += c * uLampCol * uLamp.w * fall;
  }
  vec3 cam = cameraPosition;
  float L = cam.y > 0.0 ? length(wp - cam) * depth / max(cam.y - wp.y, 0.001) : length(wp - cam);
  vec3 T = exp(-ext * L);
  vec3 scat = wcol.rgb * (0.3 + 0.7 * exp(-depth * 0.055));
  return mix(c, lit * T + scat * (1.0 - T), k);
}
`;

const NOISE3 = /* glsl */`
float h31(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float vn3(vec3 x) {
  vec3 i = floor(x); vec3 f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(h31(i), h31(i + vec3(1,0,0)), f.x), mix(h31(i + vec3(0,1,0)), h31(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(h31(i + vec3(0,0,1)), h31(i + vec3(1,0,1)), f.x), mix(h31(i + vec3(0,1,1)), h31(i + vec3(1,1,1)), f.x), f.y), f.z);
}
`;

// 水面以上的高光强度（按材质）：钢和漆面亮、木头和布暗；水下不打太阳高光（由吸收、焦散说话）
const SPEC = { boat: 0.22, boatdeck: 0.1, crane: 0.32, netframe: 0.3, netrib: 0.2, netload: 0.08, crew: 0.07, port: 0.06, wreck: 0.03, decor: 0.05, item: 0.22, itemD: 0.22, shellx: 0.1, shell4: 0.14, slab: 0.14, debris: 0.06 };

// 在 Lambert 材质上注入水下效果。opts.dirt: 物件泥垢；opts.vertex: 顶点位移代码；opts.frag: 额外片元代码
export function patchMaterial(mat, opts = {}) {
  const key = opts.key || 'w';
  const spec = opts.spec != null ? opts.spec : SPEC[key] != null ? SPEC[key] : 0.04;
  mat.customProgramCacheKey = () => 'cz-' + key;
  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, SHARED);
    if (opts.uniforms) Object.assign(shader.uniforms, opts.uniforms);
    let vs = shader.vertexShader;
    vs = vs.replace('#include <common>', `#include <common>
varying vec3 vWPos; varying vec3 vOPos;
uniform float uTime; uniform vec2 uCurrent; uniform vec4 uDist[6]; uniform vec4 uPress[2];
${SURGE_GLSL}
${opts.vertexPars || ''}`);
    if (opts.vertex) vs = vs.replace('#include <begin_vertex>', opts.vertex);
    vs = vs.replace('#include <worldpos_vertex>', `#include <worldpos_vertex>
{ vec4 wq = vec4(transformed, 1.0);
#ifdef USE_INSTANCING
  wq = instanceMatrix * wq;
#endif
  wq = modelMatrix * wq; vWPos = wq.xyz; vOPos = position; }`);
    shader.vertexShader = vs;
    let fs = shader.fragmentShader;
    fs = fs.replace('#include <common>', `#include <common>
varying vec3 vWPos; varying vec3 vOPos;
${WATER_GLSL}
${NOISE3}
${opts.fragPars || ''}`);
    fs = fs.replace('#include <shadowmap_pars_fragment>', '#include <shadowmap_pars_fragment>\n#include <shadowmask_pars_fragment>');
    // 大尺度的明暗起伏（物体自己的坐标，跟着物体走）：大块平面不再是一整片平色；幅度很小，不脏
    fs = fs.replace('#include <color_fragment>', `#include <color_fragment>
#ifndef CZ_FLATCOL
  diffuseColor.rgb *= 0.95 + 0.1 * vn3(vOPos * 0.85 + 3.1);
#endif
` + (opts.frag || ''));
    fs = fs.replace('#include <opaque_fragment>', `{
  float shw = 1.0;
#ifdef USE_SHADOWMAP
  shw = getShadowMask();
#endif
  vec3 wn = inverseTransformDirection(normal, viewMatrix);
  // 水越深，散射越把影子冲淡（浅水影子锐利，深处只剩柔和的暗区）
  {
    float dd = max(-vWPos.y, 0.0);
    float soft = smoothstep(3.0, 22.0, dd) * 0.75;
    outgoingLight += diffuseColor.rgb * RECIPROCAL_PI * uSunIrr * max(dot(wn, uSunDirW), 0.0) * (1.0 - shw) * soft;
  }
  // 水面以上：背光一侧的轮廓亮一线（天光色，按固有色染），太阳在朝向合适的面上闪一下（平面着色下一面一面地闪）
  {
    float above = smoothstep(-0.5, 0.2, vWPos.y);
    if (above > 0.0) {
      vec3 V = normalize(cameraPosition - vWPos);
      float ndv = clamp(dot(wn, V), 0.0, 1.0);
      float back = 0.45 + 0.55 * clamp(-dot(V.xz, uSunDirW.xz) / max(length(uSunDirW.xz), 1e-3), 0.0, 1.0);
      outgoingLight += diffuseColor.rgb * vec3(0.62, 0.78, 0.82) * pow(1.0 - ndv, 3.0) * 0.55 * back * above;
      vec3 Hh = normalize(uSunDirW + V);
      outgoingLight += uSunIrr * pow(max(dot(wn, Hh), 0.0), 42.0) * ${spec.toFixed(3)} * (0.3 + 0.7 * shw) * above;
    }
  }
  ${opts.preWater || ''}
  outgoingLight = applyWater(outgoingLight, vWPos, wn, shw);
}
#include <opaque_fragment>`);
    shader.fragmentShader = fs;
    if (opts.onShader) opts.onShader(shader);
  };
  return mat;
}

// 成组实例（礁石、鱼群）投影用的深度材质：和普通网格分开，阴影这一遍渲染就不会每帧在两种程序之间来回重算
let _instDepth = null;
export function instancedDepthMaterial() { return _instDepth || (_instDepth = new THREE.MeshDepthMaterial()); }

// 通用世界材质（静态造型）
export function worldMat(opts = {}) {
  const m = new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: opts.flat !== false, side: opts.side || THREE.FrontSide, transparent: !!opts.transparent, opacity: opts.opacity ?? 1, depthWrite: opts.depthWrite ?? true });
  if (opts.emissive) m.emissive = new THREE.Color(opts.emissive);
  return patchMaterial(m, { key: opts.key || ('world' + (opts.side === THREE.DoubleSide ? 'D' : '') + (opts.flat === false ? 'S' : '')) });
}

// 物件材质：带泥垢遮盖（uDirt 0~1）。每件物件独立实例，共享程序
export function itemMat(dirt = 0.7, mud = 0x4a3b2a, opts = {}) {
  const m = new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true, side: opts.side || THREE.FrontSide });
  const u = {
    uDirt: { value: dirt },
    uMudCol: { value: new THREE.Color(mud) },
    uDirtScale: { value: opts.scale || 5.0 },
    uGlow: { value: 0 },
    uGlowCol: { value: new THREE.Color(0xffe2a0) },
    uMark: { value: 0 }, // 珍品确认：这件东西的像素在画面里做个记号（透明度通道 +1），世界褪成灰时只有它留着颜色
    // 冲洗（B13、B15）：水先冲开的那一块“窗口”（物件自己的坐标：中心 xyz、半径 w），窗口里先干净、露出材质；
    // uWinGlow：窗口刚冲开时按材质亮一下（rgb 颜色、a 强度）
    uWin: { value: new THREE.Vector4(0, 0, 0, 0) },
    uWinGlow: { value: new THREE.Vector4(1, 1, 1, 0) },
    // 揭幕（B17）：一道反光沿物件的长轴扫过去（轴 xyz、强度 w；位置 x、宽 y）
    uSweep: { value: new THREE.Vector4(0, 1, 0, 0) },
    uSweepP: { value: new THREE.Vector2(0, 0.1) },
    // 珍品露头（C5）：水先冲开的那一角（物件局部坐标的球心、半径）、冲开了几成——那一块没泥、湿亮
    uPeek: { value: new THREE.Vector4(0, 0, 0, 0.1) }, uPeekA: { value: 0 },
  };
  m.userData.u = u;
  patchMaterial(m, {
    key: 'item' + (opts.side === THREE.DoubleSide ? 'D' : ''),
    uniforms: u,
    fragPars: 'uniform float uDirt; uniform vec3 uMudCol; uniform float uDirtScale; uniform float uGlow; uniform vec3 uGlowCol; uniform float uMark; uniform vec4 uWin; uniform vec4 uWinGlow; uniform vec4 uSweep; uniform vec2 uSweepP; float czWin; uniform vec4 uPeek; uniform float uPeekA; float peekK;',
    onShader: (sh) => { sh.fragmentShader = sh.fragmentShader.replace('#include <opaque_fragment>', '#include <opaque_fragment>\n  gl_FragColor.a += uMark;'); },
    frag: `{
  float nz = vn3(vOPos * uDirtScale) * 0.62 + vn3(vOPos * uDirtScale * 3.1 + 7.0) * 0.38;
  czWin = uWin.w > 0.0 ? 1.0 - smoothstep(uWin.w * 0.55, uWin.w, length(vOPos - uWin.xyz) + (nz - 0.5) * 0.45 * uWin.w) : 0.0;
  float edge = smoothstep(uDirt - 0.06, uDirt + 0.02, nz + czWin * 1.2);
  peekK = uPeekA * (1.0 - smoothstep(uPeek.w * 0.55, uPeek.w, length(vOPos - uPeek.xyz)));
  float m = (1.0 - edge) * (1.0 - peekK);
  vec3 mud = uMudCol * (0.7 + 0.5 * vn3(vOPos * 21.0));
  diffuseColor.rgb = mix(diffuseColor.rgb, mud, m);
  float rim = 1.0 - smoothstep(0.0, 0.05, abs(nz + czWin * 1.2 - uDirt));
  diffuseColor.rgb *= 1.0 - 0.3 * rim * step(0.02, uDirt) * step(uDirt, 0.98);
}`,
    preWater: `float fres = pow(1.0 - abs(dot(normalize(vViewPosition), normal)), 2.0);
  outgoingLight += uGlowCol * uGlow * (0.4 + 0.6 * fres);
  outgoingLight += uGlowCol * peekK * (0.04 + 0.3 * fres);
  { float fr = pow(1.0 - abs(dot(normalize(vViewPosition), normal)), 1.5);
    outgoingLight += uWinGlow.rgb * uWinGlow.a * czWin * (0.45 + 0.55 * fr);
    if (uSweep.w > 0.0) { float sd = (dot(vOPos, uSweep.xyz) - uSweepP.x) / uSweepP.y; outgoingLight += vec3(1.0, 0.97, 0.9) * uSweep.w * exp(-sd * sd) * (0.5 + 0.5 * fr); } }`,
  });
  return m;
}

// 自发光、不受光照的辅助（灯、UI 线），仍受水下衰减
export function basicWaterMat(color, opts = {}) {
  const m = new THREE.MeshBasicMaterial({ color, transparent: !!opts.transparent, opacity: opts.opacity ?? 1, depthWrite: opts.depthWrite ?? true, side: opts.side || THREE.FrontSide, vertexColors: !!opts.vertexColors, blending: opts.blending || THREE.NormalBlending });
  m.customProgramCacheKey = () => 'czb' + (opts.key || '');
  m.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, SHARED);
    shader.vertexShader = shader.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vWPos;')
      .replace('#include <worldpos_vertex>', `#include <worldpos_vertex>
{ vec4 wq = vec4(transformed, 1.0);
#ifdef USE_INSTANCING
  wq = instanceMatrix * wq;
#endif
  wq = modelMatrix * wq; vWPos = wq.xyz; }`);
    shader.fragmentShader = shader.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vWPos;\n' + WATER_GLSL)
      .replace('#include <opaque_fragment>', `outgoingLight = applyWater(outgoingLight, vWPos, vec3(0.0,1.0,0.0), 1.0);\n#include <opaque_fragment>`);
  };
  return m;
}

import * as THREE from 'three';
import { TOON_VERT, TOON_FRAG, SHADOW_VERT, SHADOW_FRAG } from './shaders.js';
import { WATER, SUN_DIR } from '../config.js';

// 所有材质共享的一份 uniform：改一次，场景里每个东西一起变
const sun = new THREE.Vector3(...SUN_DIR).normalize();

export const U = {
  uTime: { value: 0 },
  uSunDir: { value: sun },
  uSunCol: { value: new THREE.Color(1.0, 0.86, 0.68) },
  uAmbSky: { value: new THREE.Color(0.42, 0.52, 0.62) },
  uAmbGround: { value: new THREE.Color(0.22, 0.24, 0.27) },
  uWaterShallow: { value: new THREE.Color(...WATER.shallow) },
  uWaterDeep: { value: new THREE.Color(...WATER.deep) },
  uKView: { value: WATER.kView },
  uKDown: { value: WATER.kDown },
  uFogCol: { value: new THREE.Color(0.78, 0.78, 0.76) },
  uFogNear: { value: 140 },
  uFogFar: { value: 520 },
  uWobble: { value: 1 },
  uCurrent: { value: new THREE.Vector2(0.55, 0.12) },
  uCaustic: { value: 1 },
  uMotion: { value: 0 },
  uShadowMap: { value: null },
  uShadowMat: { value: new THREE.Matrix4() },
  uShadowTexel: { value: 1 / 2048 },
  uShadowSpan: { value: 46 },
};

// 草被网压倒的点：xy=位置 z=半径 w=强度
export const PRESS = { uPress: { value: Array.from({ length: 8 }, () => new THREE.Vector4(0, 0, 0, 0)) } };

const shadowCache = new Map();

/**
 * 卡通材质。opts:
 *  color, vertexColors, spec, shin, emissive, flat, sway(振幅), fish, cloth, mud(对象), seabed, glint,
 *  side, transparent, opacity
 */
export function toon(opts = {}) {
  const defines = {};
  if (opts.flat) defines.FLAT = '';
  if (opts.sway) { defines.SWAY = ''; defines.SWAY_AMP = opts.sway.toFixed(3); }
  if (opts.fish) defines.FISH = '';
  if (opts.cloth) defines.CLOTH = '';
  if (opts.mud) defines.MUD = '';
  if (opts.seabed) defines.SEABED = '';
  if (opts.glint) defines.GLINT = '';
  if (opts.net) defines.NET = '';
  if (opts.dissolve) defines.DISSOLVE = '';
  if (opts.wood) defines.WOOD = '';
  if (opts.moss) defines.MOSS = '';
  if (opts.see) defines.SEE = opts.see.toFixed(3);
  if (opts.clear) defines.CLEAR = opts.clear.toFixed(3);
  // 能捞的东西（海底散货、蟹）：在低分辨率画面的 alpha 里记一笔，合成时给它描一圈轮廓（见 pipeline.js）
  if (opts.item) defines.ITEM = '';

  const uniforms = {
    ...U,
    uColor: { value: new THREE.Color(opts.color ?? 0xffffff) },
    uSpec: { value: opts.spec ?? 0 },
    uShin: { value: opts.shin ?? 24 },
    uEmissive: { value: new THREE.Color(opts.emissive ?? 0x000000) },
    uOpacity: { value: opts.opacity ?? 1 },
  };
  if (opts.sway) Object.assign(uniforms, PRESS);
  if (opts.fish) uniforms.uFishSpeed = { value: 0 };
  if (opts.cloth) uniforms.uClothAmp = { value: opts.cloth };
  if (opts.seabed) uniforms.uRippleDir = { value: new THREE.Vector2(0.92, 0.4).normalize() };
  if (opts.glint) uniforms.uGlint = { value: 0 };
  if (opts.item) uniforms.uItemMark = { value: 0 };
  if (opts.net) uniforms.uNetGrid = { value: new THREE.Vector2(...opts.net) };
  if (opts.dissolve) { uniforms.uDissolve = { value: 0 }; uniforms.uDissolveSeed = { value: Math.random() * 40 }; }
  // wood: {w 板宽, len 一段板长, seam 板缝深浅, grain 木纹}
  if (opts.wood) { const w = opts.wood; uniforms.uWood = { value: new THREE.Vector4(w.w ?? 0.2, w.len ?? 2.6, w.seam ?? 1, w.grain ?? 1) }; }
  // moss: {color, amount}
  if (opts.moss) { const c = new THREE.Color(opts.moss.color ?? 0x5a6e3a); uniforms.uMoss = { value: new THREE.Vector4(c.r, c.g, c.b, opts.moss.amount ?? 1) }; }
  if (opts.mud) {
    const m = opts.mud;
    uniforms.uMud = { value: m.amount ?? 1 };
    uniforms.uMudInflate = { value: m.inflate ?? 0.05 };
    uniforms.uMudSeed = { value: m.seed ?? Math.random() * 50 };
    uniforms.uMudScale = { value: m.scale ?? 4 };
    uniforms.uMudCol = { value: new THREE.Color(m.color ?? 0x4a3e2c) };
    uniforms.uCrust = { value: m.crust ?? 1 };
    uniforms.uWashDir = { value: new THREE.Vector3(0, 1, 0) };
    uniforms.uWashBias = { value: 0 };
  }

  const mat = new THREE.ShaderMaterial({
    uniforms,
    defines,
    vertexShader: TOON_VERT,
    fragmentShader: TOON_FRAG,
    vertexColors: !!opts.vertexColors,
    side: opts.side ?? THREE.FrontSide,
    transparent: !!opts.transparent,
    depthWrite: opts.depthWrite ?? true,
  });
  mat.userData.toon = true;
  // 阴影用不着 ITEM（只关合成时的轮廓）：去掉它，和别的材质照旧共用一份阴影材质
  let sdef = defines;
  if ('ITEM' in defines) { sdef = { ...defines }; delete sdef.ITEM; }
  mat.userData.shadowMat = shadowMaterialFor(sdef, uniforms, opts.side ?? THREE.FrontSide);
  return mat;
}

function shadowMaterialFor(defines, uniforms, side) {
  const key = JSON.stringify(defines) + '|' + side;
  // 有逐个物体 uniform（泥、布）的变体不能共享
  const shareable = !('MUD' in defines) && !('CLOTH' in defines) && !('DISSOLVE' in defines);
  if (shareable && shadowCache.has(key)) return shadowCache.get(key);
  const su = { ...U };
  for (const k of ['uPress', 'uFishSpeed', 'uClothAmp', 'uMud', 'uMudInflate', 'uMudSeed', 'uMudScale', 'uNetGrid', 'uDissolve', 'uDissolveSeed']) {
    if (uniforms[k]) su[k] = uniforms[k];
  }
  const m = new THREE.ShaderMaterial({
    uniforms: su,
    defines,
    vertexShader: SHADOW_VERT,
    fragmentShader: SHADOW_FRAG,
    side: THREE.DoubleSide,
  });
  if (shareable) shadowCache.set(key, m);
  return m;
}

// 为每个网格复制一份带独立泥量的材质（揭宝时逐件洗）
export function cloneMud(mat, amount, seed) {
  const m = mat.clone();
  m.uniforms = { ...mat.uniforms };
  for (const k of ['uColor', 'uSpec', 'uShin', 'uEmissive', 'uOpacity', 'uMud', 'uMudInflate', 'uMudSeed', 'uMudScale', 'uMudCol', 'uCrust', 'uGlint', 'uDissolve', 'uDissolveSeed', 'uWashDir', 'uWashBias']) {
    if (mat.uniforms[k]) m.uniforms[k] = { value: mat.uniforms[k].value.clone ? mat.uniforms[k].value.clone() : mat.uniforms[k].value };
  }
  if (amount !== undefined && m.uniforms.uMud) m.uniforms.uMud.value = amount;
  if (seed !== undefined && m.uniforms.uMudSeed) m.uniforms.uMudSeed.value = seed;
  m.userData = { ...mat.userData, toon: true };
  m.userData.shadowMat = shadowMaterialFor(m.defines, m.uniforms, m.side);
  return m;
}

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { FILES } from './files.gen.js';

// 做好的素材（src/assets/素材.json 列着用到哪些）。模型打开以前要先解码：入口（main.js、gallery.js）先 await loadAssets() 再建场景。
// 每个模型拆成几块：名字以 metal 开头的是金属、其余是哑光（规格第 11 节）；单独一个节点的会动的部件（银币匣的 lid）另放。
// 几何体一律换成逐面的法线（和程序画的东西一样是硬棱的方块感）；底色贴图按原值采样（游戏不做颜色管理），近处最近点、远处取 mip 平均，不闪。

const MODELS = {};
const MOVING = ['lid'];
let ready = null;

function prepTexture(tex) {
  if (!tex || tex.userData.prepped) return tex;
  tex.colorSpace = THREE.NoColorSpace;
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.generateMipmaps = true;
  tex.anisotropy = 1;
  tex.needsUpdate = true;
  tex.userData.prepped = true;
  return tex;
}

function flatGeo(g, m) {
  let geo = g.index ? g.toNonIndexed() : g.clone();
  if (m) geo.applyMatrix4(m);
  for (const k of Object.keys(geo.attributes)) if (!['position', 'normal', 'uv'].includes(k)) geo.deleteAttribute(k);
  geo.computeVertexNormals();
  return geo;
}

function parseOne(name, bin) {
  return new Promise((resolve, reject) => {
    const buf = bin.buffer.slice(bin.byteOffset, bin.byteOffset + bin.byteLength);
    new GLTFLoader().parse(buf, '', (gltf) => {
      const root = gltf.scene;
      root.updateMatrixWorld(true);
      const parts = [], moving = {};
      const inv = new THREE.Matrix4();
      root.traverse((o) => {
        if (!o.isMesh) return;
        // 在不在会动的部件下面（单子里写了名字的节点：银币匣的 lid），在的话几何体放进那个节点自己的坐标
        let pivot = null;
        for (let p = o.parent; p && p !== root; p = p.parent) if (MOVING.includes(p.name)) { pivot = p; break; }
        const m = new THREE.Matrix4();
        if (pivot) m.copy(inv.copy(pivot.matrixWorld).invert()).multiply(o.matrixWorld);
        else m.copy(o.matrixWorld);
        const part = { name: o.name, metal: /^metal/i.test(o.name), geometry: flatGeo(o.geometry, m), map: prepTexture(o.material && o.material.map) };
        if (pivot) {
          const key = pivot.name;
          if (!moving[key]) { const pos = new THREE.Vector3(); pivot.getWorldPosition(pos); moving[key] = { pos, parts: [] }; }
          moving[key].parts.push(part);
        } else parts.push(part);
      });
      MODELS[name] = { parts, moving };
      resolve();
    }, (e) => reject(new Error(name + ': ' + (e && e.message))));
  });
}

// 图（地的贴图、图标）先解码好：贴图要同步拿到像素（算平均色、低频那一层），建场景时不再等
const IMAGES = {};
function decodeOne(name, url) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => { IMAGES[name] = img; resolve(); };
    img.onerror = () => resolve(); // 解不开的照旧用代码画的那一份
    img.src = url;
  });
}

export function loadAssets() {
  if (!ready) {
    const entries = Object.entries(FILES);
    ready = Promise.all([
      ...entries.filter(([, v]) => v instanceof Uint8Array).map(([n, v]) => parseOne(n, v)),
      ...entries.filter(([, v]) => typeof v === 'string').map(([n, v]) => decodeOne(n, v)),
    ]).then(() => MODELS);
  }
  return ready;
}

// 一张铺在地上的贴图（底色，按原值读）：近处最近点、远处取 mip 平均；repeat 平铺；图的上边是北（−z），不上下翻
const TEX = {};
export function texture(name, repeat = false) {
  const key = name + (repeat ? '#r' : '');
  if (TEX[key]) return TEX[key];
  const img = IMAGES[name];
  if (!img) return null;
  const t = new THREE.Texture(img);
  t.flipY = false;
  t.wrapS = t.wrapT = repeat ? THREE.RepeatWrapping : THREE.ClampToEdgeWrapping;
  prepTexture(t);
  TEX[key] = t;
  return t;
}

// 一张图的像素（RGBA，一行一行从上往下）：{ w, h, data }；没有就是 null
const PIX = {};
export function pixels(name) {
  if (PIX[name]) return PIX[name];
  const img = IMAGES[name];
  if (!img) return null;
  const w = img.naturalWidth, h = img.naturalHeight;
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d', { willReadFrequently: true });
  g.drawImage(img, 0, 0);
  PIX[name] = { w, h, data: g.getImageData(0, 0, w, h).data };
  return PIX[name];
}

// 一个模型：{ parts: [{name, metal, geometry, map}], moving: { lid: {pos, parts} } }；没有就是 null（没接素材的照旧用代码画）
export function model(name) {
  return MODELS[name] || null;
}

// 一张图（图标）：data URL
export function image(name) {
  const v = FILES[name];
  return typeof v === 'string' ? v : null;
}

// 把一个模型里同一张贴图的几块并成一块几何体（实例化、合并摆放用）
export function mergedOf(name) {
  const m = model(name);
  if (!m) return null;
  const all = [...m.parts, ...Object.values(m.moving).flatMap((v) => v.parts)];
  return { geometries: all.map((p) => p.geometry), map: all[0].map, metal: all.map((p) => p.metal) };
}

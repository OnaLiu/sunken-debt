import * as THREE from 'three';
import { buildItemModel } from '../world/items.js';
import { ITEM_DEFS } from '../world/layout.js';
import { Crab } from '../life/crab.js';

// 收获单上的小图：用和游戏里同一套模型，在高空的小场景里各拍一张（洗干净以后的样子）。
// 24 格见方，在界面上一律按整 3 倍（72 像素）摆：一格就是 3 屏幕像素，和场景、铜铁面板的像素一样粗；
// 外面描一圈暗边、贴边一圈亮边（和游戏里能捞的东西同一个描法）
export const THUMB = 24;

export class Thumbs {
  constructor(g) {
    this.g = g;
    this.cache = null;
  }

  get() {
    if (!this.cache) this.cache = this.render();
    return this.cache;
  }

  render() {
    const r = this.g.pipe.renderer;
    const S = THUMB;
    const rt = new THREE.WebGLRenderTarget(S, S, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter });
    const scene = new THREE.Scene();
    const cam = new THREE.PerspectiveCamera(30, 1, 0.05, 50);
    const base = new THREE.Vector3(0, 300, 0);
    const out = {};
    const px = new Uint8Array(S * S * 4);
    const cv = document.createElement('canvas');
    cv.width = S;
    cv.height = S;
    const ctx = cv.getContext('2d');
    const img = ctx.createImageData(S, S);
    for (const kind of Object.keys(ITEM_DEFS)) {
      let group;
      if (kind === 'crab') {
        const c = new Crab({ scale: 1.6 });
        group = c.group;
      } else {
        const m = buildItemModel(kind, { seed: 0.4, mud: 0 });
        group = m.group;
        if (m.lid) m.lid.rotation.x = -1.2;
      }
      group.position.copy(base);
      scene.add(group);
      const box = new THREE.Box3().setFromObject(group);
      const c = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3()).length();
      // 拍得满一点：按包围盒八个角投到画面上的大小推近，四边各留一格给描边
      let d = size * 1.9 + 0.1;
      const dir = new THREE.Vector3(0.62, 0.55, 0.56).normalize();
      const corner = new THREE.Vector3();
      for (let it = 0; it < 3; it++) {
        cam.position.copy(c).addScaledVector(dir, d);
        cam.lookAt(c);
        cam.updateMatrixWorld(true);
        let m = 0;
        for (let k = 0; k < 8; k++) {
          corner.set(k & 1 ? box.max.x : box.min.x, k & 2 ? box.max.y : box.min.y, k & 4 ? box.max.z : box.min.z).project(cam);
          m = Math.max(m, Math.abs(corner.x), Math.abs(corner.y));
        }
        d *= m / ((S - 4) / S);
      }
      cam.position.copy(c).addScaledVector(dir, d);
      cam.lookAt(c);
      cam.updateMatrixWorld(true);
      r.setRenderTarget(rt);
      r.setClearColor(0x000000, 0);
      r.clear(true, true, false);
      r.render(scene, cam);
      r.readRenderTargetPixels(rt, 0, 0, S, S, px);
      // 翻转、去背景
      const D = img.data;
      for (let y = 0; y < S; y++) {
        for (let x = 0; x < S; x++) {
          const si = ((S - 1 - y) * S + x) * 4, di = (y * S + x) * 4;
          D[di] = px[si];
          D[di + 1] = px[si + 1];
          D[di + 2] = px[si + 2];
          D[di + 3] = px[si + 3] > 0 ? 255 : 0;
        }
      }
      // 描边：贴着东西的空格涂暗边，东西自己最外一圈提亮一点
      const solid = (x, y) => x >= 0 && y >= 0 && x < S && y < S && D[(y * S + x) * 4 + 3] > 0;
      const edge = [], rim = [];
      for (let y = 0; y < S; y++) {
        for (let x = 0; x < S; x++) {
          const n = solid(x - 1, y) + solid(x + 1, y) + solid(x, y - 1) + solid(x, y + 1);
          if (!solid(x, y)) { if (n) edge.push(x, y); } else if (n < 4) rim.push(x, y);
        }
      }
      for (let k = 0; k < rim.length; k += 2) {
        const i = (rim[k + 1] * S + rim[k]) * 4;
        for (let j = 0; j < 3; j++) D[i + j] = Math.min(255, D[i + j] * 1.18 + 8);
      }
      for (let k = 0; k < edge.length; k += 2) {
        const i = (edge[k + 1] * S + edge[k]) * 4;
        D[i] = 42; D[i + 1] = 28; D[i + 2] = 14; D[i + 3] = 255;
      }
      ctx.putImageData(img, 0, 0);
      out[kind] = cv.toDataURL();
      scene.remove(group);
    }
    r.setRenderTarget(null);
    rt.dispose();
    return out;
  }
}

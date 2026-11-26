import * as THREE from 'three';
import { buildItemModel } from '../world/items.js';
import { ITEM_DEFS } from '../game/itemdefs.js';
import { Crab } from '../life/crab.js';

// 收获单上的小图：用和游戏里同一套模型，在高空的小场景里各拍一张（洗干净以后的样子）。
// 24 格见方，在界面上一律按整 3 倍（72 像素）摆：一格就是 3 屏幕像素，和场景、铜铁面板的像素一样粗；
// 外面描一圈暗边、贴边一圈亮边（和游戏里能捞的东西同一个描法）
export const THUMB = 24;

// 取景用的点：这一部分每个网格的顶点（隔几个取一个），世界坐标
function framePts(obj) {
  const out = [];
  obj.updateMatrixWorld(true);
  obj.traverse((o) => {
    if (!o.isMesh || !o.geometry || !o.geometry.attributes.position) return;
    const a = o.geometry.attributes.position;
    for (let i = 0; i < a.count; i += 3) out.push(new THREE.Vector3().fromBufferAttribute(a, i).applyMatrix4(o.matrixWorld));
  });
  return out.length ? out : null;
}

export class Thumbs {
  constructor(g) {
    this.g = g;
    this.cache = null;
  }

  get() {
    if (!this.cache) this.cache = this.render();
    return this.cache;
  }

  // 拍小图用的小场景、相机和画布（第一次用时建好，之后一直留着：甲板上的泥包要等第一包码上去才拍）
  ensure() {
    if (this.rig) return this.rig;
    const S = THUMB;
    const rt = new THREE.WebGLRenderTarget(S, S, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter });
    const scene = new THREE.Scene();
    const cam = new THREE.PerspectiveCamera(30, 1, 0.05, 50);
    const base = new THREE.Vector3(0, 300, 0);
    const px = new Uint8Array(S * S * 4);
    const cv = document.createElement('canvas');
    cv.width = S;
    cv.height = S;
    const ctx = cv.getContext('2d');
    const img = ctx.createImageData(S, S);
    this.rig = { S, rt, scene, cam, base, px, cv, ctx, img };
    return this.rig;
  }

  // 拍一张：frame 是按哪一部分取景（不写就是整个）
  shoot(group, frame) {
    const r = this.g.pipe.renderer;
    const { S, rt, scene, cam, base, px, cv, ctx, img } = this.ensure();
    {
      group.position.copy(base);
      scene.add(group);
      group.updateMatrixWorld(true);
      const box = new THREE.Box3().setFromObject(frame || group);
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
        // 圆的东西（泥团）按它身上的点取景，不按包围盒的角（圆团只占盒子里内切的那一圈，拍出来偏小）
        const pts = frame ? framePts(frame) : null;
        if (pts) for (const q of pts) { corner.copy(q).project(cam); m = Math.max(m, Math.abs(corner.x), Math.abs(corner.y)); }
        else for (let k = 0; k < 8; k++) {
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
      scene.remove(group);
      r.setRenderTarget(null);
      return cv.toDataURL();
    }
  }

  render() {
    const out = {};
    const shoot = (group, frame) => this.shoot(group, frame);
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
      out[kind] = shoot(group);
    }
    // 码在甲板上还没冲的泥包（甲板那一排格子里）：同一个泥包模型拍一张，和游戏里码着的是同一个样子
    return out;
  }

  // 码在甲板上还没冲的泥包（甲板那一排格子里）：照第一包码上甲板的泥包拍一张（同一个模型、同一身泥），之后一直用这一张。
  // 按泥壳取景（挂在外面垂下来的海草不算，泥团占满一格）
  bundle() {
    const out = this.get();
    if (out.bundle) return out.bundle;
    const S = this.g.deck && this.g.deck.slots.find((q) => q.bundle && !q.fall);
    if (!S) return null;
    const b = S.bundle;
    const grp = b.group.clone(true);
    grp.rotation.set(0, 0, 0);
    grp.scale.set(1, 1, 1);
    const shell = grp.children[b.group.children.indexOf(b.shell)];
    out.bundle = this.shoot(grp, shell);
    return out.bundle;
  }
}

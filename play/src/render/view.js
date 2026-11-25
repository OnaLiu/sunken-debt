// 渲染器、灯光、阴影跟随、水体参数随海域混合
import * as THREE from 'three';
import { createPost } from './post.js';
import { SHARED, NREG } from './materials.js';
import { WATER, regionsNear, HOME } from '../world/layout.js';

export const LOGICAL_W = 1920, LOGICAL_H = 1080;

export class View {
  constructor(canvas, pixelScale = 2) {
    this.canvas = canvas;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance', preserveDrawingBuffer: false });
    this.renderer.setPixelRatio(1);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.scene = new THREE.Scene();
    this.overlay = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(42, 16 / 9, 0.5, 1600);
    this.camera.position.set(0, 30, 40);
    this.pixelScale = pixelScale;
    const W = Math.round(LOGICAL_W / pixelScale), H = Math.round(LOGICAL_H / pixelScale);
    this.renderer.setSize(W, H, false);
    this.post = createPost(this.renderer, W, H);

    // 灯光：偏暖的斜阳 + 天空/海底半球光
    this.sunDir = new THREE.Vector3(-0.45, 0.82, 0.36).normalize();
    this.sun = new THREE.DirectionalLight(0xfff0d8, 3.1);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    const sc = this.sun.shadow.camera;
    sc.left = -55; sc.right = 55; sc.top = 55; sc.bottom = -55; sc.near = 1; sc.far = 260;
    this.sun.shadow.bias = -0.0006;
    this.sun.shadow.normalBias = 0.04;
    this.scene.add(this.sun, this.sun.target);
    this.hemi = new THREE.HemisphereLight(0xbfe0e6, 0x5a5440, 1.25);
    this.scene.add(this.hemi);
    this.post.uniforms.uSunDir.value.copy(this.sunDir);
    this.focus = new THREE.Vector3();
  }
  setPixelScale(s) {
    this.pixelScale = s;
    const W = Math.round(LOGICAL_W / s), H = Math.round(LOGICAL_H / s);
    this.renderer.setSize(W, H, false);
    this.post.setSize(W, H);
  }
  // 焦点附近的水体参数写入 uniform（最多 NREG 个影响源）
  updateWater(fx, fz) {
    const srcs = [];
    for (const r of regionsNear(fx, 520)) srcs.push({ x: r.cx, z: r.cz, rad: 115, w: 5.5, p: WATER[r.type] });
    // 出发港口的港池（开局身后）
    if (Math.abs(HOME.x - fx) < 520) srcs.push({ x: HOME.x, z: HOME.z + 10, rad: 60, w: 3, p: WATER.port });
    srcs.sort((a, b) => Math.hypot(a.x - fx, a.z - fz) - Math.hypot(b.x - fx, b.z - fz));
    for (let i = 0; i < NREG; i++) {
      const s = srcs[i];
      if (!s) { SHARED.uWReg.value[i].set(0, 0, 1, 0); continue; }
      SHARED.uWReg.value[i].set(s.x, s.z, s.rad, s.w);
      SHARED.uWExt.value[i].set(s.p.ext[0], s.p.ext[1], s.p.ext[2], 0);
      SHARED.uWCol.value[i].set(s.p.col[0], s.p.col[1], s.p.col[2], s.p.caustic);
    }
    const b = WATER.base;
    SHARED.uWBaseExt.value.set(b.ext[0], b.ext[1], b.ext[2], 0);
    SHARED.uWBaseCol.value.set(b.col[0], b.col[1], b.col[2], b.caustic);
  }
  // 在后台并行编译 obj 用到的着色器（与真实渲染同一个目标：场景画进离屏缓冲，叠加层画到屏幕）
  prepare(obj, overlay = false) {
    const r = this.renderer;
    if (!r.compileAsync) return Promise.resolve();
    const prev = r.getRenderTarget();
    r.setRenderTarget(overlay ? null : this.post.rt);
    let p;
    try { p = r.compileAsync(obj, this.camera, overlay ? this.overlay : this.scene); } finally { r.setRenderTarget(prev); }
    return p;
  }
  // waterTime：水面这一层的时间（设置开着、游戏暂停时水面照样动，D3）；不给就和 time 一样
  render(time, waterTime = time) {
    SHARED.uTime.value = time;
    this.post.uniforms.uTime.value = waterTime;
    // 阴影相机跟随焦点（按纹素对齐，避免游泳）
    const f = this.focus;
    const texel = 110 / 2048;
    const fx = Math.round(f.x / texel) * texel, fz = Math.round(f.z / texel) * texel;
    this.sun.target.position.set(fx, f.y, fz);
    this.sun.position.set(fx + this.sunDir.x * 120, f.y + this.sunDir.y * 120, fz + this.sunDir.z * 120);
    this.sun.target.updateMatrixWorld();
    this.post.render(this.scene, this.camera, this.overlay);
  }
}

import * as THREE from 'three';
import { clamp, damp, dampAngle, wrapAngle } from '../util/math.js';

// 观察镜头：围着船和当前作业区转。只改视线，不变成能钻进沉船的潜水器（镜头始终在水面以上）。
// 镜头稳、玩久了不晕（设计第 9 节）：
// - 视野开阔（竖直 45°，横着约 72°）：转一点只扫过画面的一小块；
// - 鼠标、右摇杆转得适中，快慢和上下反转在设置里调；
// - 视点用临界阻尼的弹簧跟（起步、停下都是缓的，不跟着鼠标一下一下地顿）；
// - 推到甲板近景、拉回大视野：绕着要看的那一点按方向、俯角、远近（远近按比例）插值，起止都是缓的，不走直线横扫；
// - 砸甲板那一沉一弹、震动：镜头整体平移，不转（转动最容易晕）
export const FOV = 45;
// 鼠标：每个 CSS 像素转多少弧度（「中」档）；右摇杆推满每秒转多少弧度
const MOUSE_YAW = 0.0022;
const MOUSE_PITCH = 0.0016;
const STICK_YAW = 1.25;
const STICK_PITCH = 0.8;
// 视点弹簧的角频率（临界阻尼）：越大跟得越紧
const PIVOT_W = 8;
const smoother = (t) => t * t * t * (t * (t * 6 - 15) + 10);

export class CameraRig {
  constructor() {
    this.cam = new THREE.PerspectiveCamera(FOV, 16 / 9, 0.5, 900);
    this.yaw = -Math.PI / 2;
    this.pitch = 0.9;
    this.dist = 26;
    this.yawT = this.yaw;
    this.pitchT = this.pitch;
    this.distT = this.dist;
    this.pivot = new THREE.Vector3();
    this.pivotT = new THREE.Vector3();
    this.pivotV = new THREE.Vector3();
    this.alt = { pos: new THREE.Vector3(), look: new THREE.Vector3(), w: 0, fov: 30 };
    this.altFrom = 0;
    this.altTo = 0;
    this.altT = 0;
    this.altDur = 1;
    this.shakeAmp = 0;
    this.shakeT = 0;
    this.thY = 0;
    this.thV = 0;
    this.lookAtPt = new THREE.Vector3();
    this.focusDist = 30;
    this.minPitch = 0.42;
    this.maxPitch = 1.28;
    this.minDist = 11;
    this.maxDist = 42;
    this.fovAdd = 0; // 开船时视角宽一点（chase.js）
    // 设置里的「镜头快慢」（倍数）、「上下反转」
    this.lookK = 1;
    this.invertY = false;
    // 视点上下的弹簧另给一个角频率（0 = 和水平一样）：网在水里时视点跟着网上下，慢一点
    this.pivotWy = 0;
    this._orbit = new THREE.Vector3();
    this._look = new THREE.Vector3();
    this._pos = new THREE.Vector3();
  }

  snapTo() {
    this.yaw = this.yawT;
    this.pitch = this.pitchT;
    this.dist = this.distT;
    this.pivot.copy(this.pivotT);
    this.pivotV.set(0, 0, 0);
  }

  // 右摇杆转镜头：往右推，镜头往右看（绕着视点往左转过去）；往上推，往上看（设置里可反转）。
  // 轻推慢、推满快（1.5 次方）：微调时不一下转过头
  look(lx, ly, zoom, dt) {
    const c = (v) => Math.sign(v) * Math.pow(Math.abs(v), 1.5);
    this.yawT -= c(lx) * STICK_YAW * this.lookK * dt;
    this.pitchT = clamp(this.pitchT - c(ly) * STICK_PITCH * this.lookK * (this.invertY ? -1 : 1) * dt, this.minPitch, this.maxPitch);
    this.zoom(zoom, dt);
  }

  // 鼠标转镜头：挪多少转多少，没有惯性；px、py 是 CSS 像素
  mouseTurn(px, py) {
    return { yaw: -px * MOUSE_YAW * this.lookK, pitch: py * MOUSE_PITCH * this.lookK * (this.invertY ? -1 : 1) };
  }

  lookMouse(px, py) {
    const q = this.mouseTurn(px, py);
    this.yawT += q.yaw;
    this.pitchT = clamp(this.pitchT + q.pitch, this.minPitch, this.maxPitch);
  }

  zoom(zoom, dt) {
    this.distT = clamp(this.distT + zoom * 0.9 * (dt > 0 ? 1 : 0) * (this.distT / 30), this.minDist, this.maxDist);
  }

  // 近景（冲洗）和大视野之间平滑过渡
  blendTo(w, dur) {
    this.altFrom = this.alt.w;
    this.altTo = w;
    this.altT = 0;
    this.altDur = Math.max(0.01, dur);
  }

  // 震：幅度只取六成（以前镜头转着震，现在整体平移着震，同样的数看着更猛）
  shake(a) {
    this.shakeAmp = Math.max(this.shakeAmp, a * 0.6);
  }

  // 重东西砸下来那一下：画面整个往下一沉、轻轻弹回来停住（镜头连同它看的那一点往上一抬再落回：只平移，不点头）
  thump(a) {
    this.thV = (this.thV || 0) + a * 12;
  }

  update(dt) {
    this.yaw = dampAngle(this.yaw, this.yawT, 10, dt);
    this.pitch = damp(this.pitch, this.pitchT, 10, dt);
    this.dist = damp(this.dist, this.distT, 6, dt);
    // 视点：临界阻尼弹簧（一步一步积分，帧长不一也稳）
    if (dt > 0) {
      const n = Math.max(1, Math.ceil(dt / (1 / 120)));
      const h = dt / n;
      for (let i = 0; i < n; i++) {
        for (const k of ['x', 'y', 'z']) {
          const w = k === 'y' && this.pivotWy ? this.pivotWy : PIVOT_W;
          const a = w * w * (this.pivotT[k] - this.pivot[k]) - 2 * w * this.pivotV[k];
          this.pivotV[k] += a * h;
          this.pivot[k] += this.pivotV[k] * h;
        }
      }
    }
    if (this.altT < this.altDur) {
      this.altT = Math.min(this.altDur, this.altT + dt);
      this.alt.w = this.altFrom + (this.altTo - this.altFrom) * smoother(this.altT / this.altDur);
    }
    const w = this.alt.w;
    const look = this._look.copy(this.pivot);
    let yaw = this.yaw, pitch = this.pitch, dist = this.dist;
    let fov = FOV + this.fovAdd;
    if (w > 1e-4) {
      // 近景那一头的方向、俯角、远近（相对它看的那一点）
      const A = this.alt;
      const ox = A.pos.x - A.look.x, oy = A.pos.y - A.look.y, oz = A.pos.z - A.look.z;
      const ad = Math.max(0.01, Math.hypot(ox, oy, oz));
      const ayaw = Math.atan2(ox, oz), apitch = Math.asin(clamp(oy / ad, -1, 1));
      look.lerp(A.look, w);
      yaw = this.yaw + wrapAngle(ayaw - this.yaw) * w;
      pitch = this.pitch + (apitch - this.pitch) * w;
      dist = Math.exp(Math.log(this.dist) + (Math.log(ad) - Math.log(this.dist)) * w);
      fov += (A.fov - fov) * w;
    }
    const cp = Math.cos(pitch), sp = Math.sin(pitch);
    const pos = this._pos.set(look.x + Math.sin(yaw) * cp * dist, look.y + sp * dist, look.z + Math.cos(yaw) * cp * dist);
    if (pos.y < 1.5) pos.y = 1.5;
    if (this.thV || this.thY) {
      // 弹簧：一沉、轻轻弹回一点就停（阻尼比约 0.7）；镜头和它看的那一点一起挪
      this.thV += (-120 * this.thY - 15 * this.thV) * dt;
      this.thY += this.thV * dt;
      if (Math.abs(this.thY) < 1e-4 && Math.abs(this.thV) < 1e-3) { this.thY = 0; this.thV = 0; }
      pos.y += this.thY;
      look.y += this.thY;
    }
    if (this.shakeAmp > 0.001) {
      // 震：镜头和看的那一点一起平移（画面整体晃，不转）
      this.shakeT += dt * 30;
      const sx = Math.sin(this.shakeT * 1.3) * this.shakeAmp, sy = Math.sin(this.shakeT * 1.7 + 1) * this.shakeAmp * 0.7;
      pos.x += sx; look.x += sx;
      pos.y += sy; look.y += sy;
      this.shakeAmp *= Math.exp(-dt * 8);
    }
    this.cam.fov = fov;
    this.cam.position.copy(pos);
    this.cam.lookAt(look);
    this.cam.updateProjectionMatrix();
    this.cam.updateMatrixWorld(true);
    this.lookAtPt.copy(look);
    this.focusDist = pos.distanceTo(look);
  }

  // 摇杆方向（相对镜头）→ 世界水平方向
  stickToWorld(mx, my) {
    const fx = -Math.sin(this.yaw), fz = -Math.cos(this.yaw);
    const rx = Math.cos(this.yaw), rz = -Math.sin(this.yaw);
    return { x: rx * mx + fx * my, z: rz * mx + fz * my };
  }
}

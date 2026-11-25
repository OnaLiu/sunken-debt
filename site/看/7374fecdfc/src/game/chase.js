import { clamp, wrapAngle } from '../util/math.js';

// 跟船的镜头：开船、停着、下网同一个，只有这一个（打捞这一屏从头到尾都在跟；揭宝、开冲、收工、开舱照它们自己的镜头）。
// 怎么跟照载具求生的追车镜头（它 js/camera.js 的 chaseTarget，高的那一种）：在船后上方，跟着船头转（4.5），
// 开得越快退得越远、压得越低、看得越宽、看得越靠前；倒船时也照船头；鼠标不管镜头。
// 高低、远近不照搬它的数：它离地很平，看的是前面一长段路；这里要看的是水底。抬到停着、慢开、开足都看得见船边的海底。
// 跟在船后还有一样好处：船头在画面上总朝上，按 D 看着就是往右转、按 A 就是往左转。
// 停着时按住右键拖看四周，是在跟船的镜头上偏开一点（off），再开船就收回来。
// 全游戏一份：以后每一段都用这一份。
const FOLLOW = 4.5; // 镜头跟船头转的快慢（载具求生的数）
const SPEED = 2.2; // 车速传到镜头上的快慢（载具求生的数）
const STILL = { pitch: 0.96, dist: 30, look: 0.5, fov: 0 };
const FAST = { pitch: 0.88, dist: 35, look: 2.5, fov: 4 }; // 载具求生：开足了视角宽 4 度
const VEYE = -1;
const ZOOM_IN = 0.4, ZOOM_OUT = 1.35;
const KEEP = 1.4; // 拖着看四周偏开不到这么多（弧度）时，停着只转船头不用收：船头还在画面上半边，往哪边转看着就是哪边
const DROP = 0.4; // 拖着看四周最多压低多少（再低满屏是水面反光）
const ease = (u) => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2);
const smooth = (u) => u * u * u * (u * (u * 6 - 15) + 10);
const damp = (a, b, k, dt) => b + (a - b) * Math.exp(-k * dt);

export class Chase {
  constructor() {
    this.reset();
    this.want = null;
  }

  reset() {
    this.on = false;
    this.t = 0;
    this.zoom = this.zoomT = 1;
    this.sp = 0;
    this.yawV = 0;
    this.fovAdd = 0;
    this.fovWant = 0;
    this.offYaw = this.offPitch = 0; // 拖着看四周偏开了多少
    this.offYawT = this.offPitchT = 0;
    this.ret = null;
  }

  start(cam) {
    if (this.on) return;
    this.on = true;
    this.t = 0;
    this.yaw = cam.yaw;
    this.offYaw = this.offPitch = this.offYawT = this.offPitchT = 0;
    this.ret = null;
    this.from = { yaw: cam.yaw, pitch: cam.pitch, dist: cam.dist, fov: this.fovAdd, pivot: cam.pivot.clone() };
    this.keepDist = this.keepDist || cam.distT;
  }

  // 一打开、再来一次：直接就在船后
  snap(cam, bc, vmax) {
    this.reset();
    this.start(cam);
    this.t = 99;
    this.yaw = behind(bc);
    this.keepDist = null;
    this.aim(cam, bc, 0, vmax);
    cam.snapTo();
  }

  // 让出去：dist 给了就回到那个远近（揭宝这些的镜头），不给就留在这儿
  stop(cam, dist) {
    if (!this.on) return;
    this.on = false;
    if (dist) cam.distT = dist;
    this.keepDist = null;
  }

  // 没在跟船：视角宽窄慢慢回去
  relax(cam, dt) {
    if (this.on) return;
    this.fovAdd = Math.abs(this.fovAdd) < 0.01 ? 0 : damp(this.fovAdd, 0, 3, dt);
    cam.fovAdd = this.fovAdd;
  }

  wheel(z) {
    this.zoomT = clamp(this.zoomT * (1 + z * 0.02), ZOOM_IN, ZOOM_OUT);
  }

  // 按住右键拖：在跟船的镜头上偏开 (dy, dp)
  drag(cam, dy, dp) {
    this.ret = null;
    this.offYawT += dy;
    const base = cam.pitchT - this.offPitchUse;
    this.offPitchT = clamp(clamp(this.offPitchT + dp, -DROP, 0.3), cam.minPitch - base, cam.maxPitch - base);
  }

  // 按了开船的键：偏开的收回来，起止都缓。船头这会儿在画面下半边的话，按 D 从右边转回来、按 A 从左边转回来——
  // 往哪边打，看着船头就往哪边走
  drive(go, steer) {
    if (this.ret || (!this.offYawT && !this.offPitchT)) return;
    let o = wrapAngle(this.offYaw);
    if (!go && Math.abs(o) < KEEP) return;
    if (Math.abs(o) > Math.PI / 2) {
      if (steer > 0 && o < 0) o += Math.PI * 2;
      else if (steer < 0 && o > 0) o -= Math.PI * 2;
    }
    this.ret = { yaw: o, pitch: this.offPitch, t: 0, T: 0.55 + 0.3 * Math.abs(o) };
    this.offYawT = this.offPitchT = 0;
  }

  // 这一帧镜头想在哪（写进 cam.*T，第一眼看见沉船那一下还会在上面再偏一点）
  aim(cam, bc, dt, vmax) {
    const sp = clamp(Math.max(0, bc.speed) / vmax, 0, 1);
    this.sp = damp(this.sp, sp, SPEED, dt);
    this.t += dt;
    this.zoom = damp(this.zoom, this.zoomT, 6, dt);
    const R = this.ret;
    if (R) {
      R.t += dt;
      const u = Math.min(1, R.t / R.T), k = 1 - smooth(u);
      this.offYaw = R.yaw * k;
      this.offPitch = R.pitch * k;
      if (u >= 1) this.ret = null;
    } else {
      this.offYaw = damp(this.offYaw, this.offYawT, 14, dt);
      this.offPitch = damp(this.offPitch, this.offPitchT, 14, dt);
    }
    const y0 = this.yaw;
    this.yaw = wrapAngle(this.yaw + wrapAngle(behind(bc) - this.yaw) * (1 - Math.exp(-FOLLOW * dt)));
    this.yawV = dt > 0 ? wrapAngle(this.yaw - y0) / dt : 0;
    const k = this.sp * this.sp * (3 - 2 * this.sp);
    const mix = (q) => STILL[q] + (FAST[q] - STILL[q]) * k;
    const look = mix('look');
    // 看的地方在镜头朝向的前面，不是船头前面：镜头跟着船头慢慢转过来
    const fx = -Math.sin(this.yaw), fz = -Math.cos(this.yaw);
    cam.pivotT.set(bc.pos.x + fx * look, VEYE, bc.pos.z + fz * look);
    cam.distT = mix('dist') * this.zoom;
    const p0 = mix('pitch');
    cam.pitchT = clamp(p0 + this.offPitch, cam.minPitch, cam.maxPitch);
    this.offPitchUse = cam.pitchT - p0;
    cam.yawT = this.yaw + this.offYaw;
    this.fovWant = mix('fov');
  }

  // 还在跟着动（船走着、转着、镜头还没落定）：鼠标没动时不重新挑打捞点
  get moving() { return this.on && (this.sp > 0.03 || this.t < 1.2 || Math.abs(this.yawV) > 0.03 || !!this.ret); }

  // 把想在哪落到镜头上：刚进来从原来那儿滑过去，滑到以后一步不差地跟着
  commit(cam) {
    const F = this.from;
    const turn = Math.abs(wrapAngle(cam.yawT - F.yaw));
    const u = Math.min(1, this.t / (0.8 + 0.35 * turn)), e = ease(u);
    cam.yaw = u >= 1 ? cam.yawT : F.yaw + wrapAngle(cam.yawT - F.yaw) * e;
    cam.pitch = F.pitch + (cam.pitchT - F.pitch) * e;
    cam.dist = Math.exp(Math.log(F.dist) + (Math.log(cam.distT) - Math.log(F.dist)) * e);
    cam.pivot.lerpVectors(F.pivot, cam.pivotT, e);
    cam.pivotV.set(0, 0, 0);
    this.fovAdd = F.fov + (this.fovWant - F.fov) * e;
    cam.fovAdd = this.fovAdd;
  }
}

// 正对着船尾、船头朝上时镜头的朝向
const behind = (bc) => Math.atan2(-Math.cos(bc.heading), Math.sin(bc.heading));

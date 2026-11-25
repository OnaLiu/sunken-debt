import * as THREE from 'three';
import { VIEW_W, VIEW_H } from '../config.js';
import { clamp, smoothstep } from '../util/math.js';

// 按住左 Shift：镜头靠近指针这一刻指着的那块海底，松开回去。停着、开着船、网在水里都行。
// 怎么靠近：顺着「眼睛 → 指着的那一点」的视线往前推一截，再收窄视角（像举起望远镜），那一点始终在指针底下；
// 指针挪到别处，就换成顺着那一处的视线。方向只跟着收窄的视角偏一点点，画面不打转。
// 指着哪一点照没靠近时的镜头算（base），靠近以后画面放大了也不会自己越跑越远；挑打捞点也照它算，按着 Shift 下网、开船和不按一样。
// 眼睛一直在水面以上：水里那一段视线和没靠近时一样长，浅水看得见、越深越难辨认，靠近了也是这样。
// 全游戏一份。
const NEAR = 0.5; // 往前推到原来离那一点的几成
const EYE_Y = 12; // 眼睛最低离水面多高（自己的船不糊满画面）
const ZOOM = 2.2; // 视角收窄，再放大几倍
const REACH = 46; // 指得再远也只看到离船这么远
const RAMP = 0.2, W_K = 11; // 靠近、回去：先匀着走，再过一道弹簧（临界阻尼）——起步、停下都缓，半秒多一点
const W_P = 13; // 指针挪到别处时跟过去的弹簧
const _d = new THREE.Vector3(), _e = new THREE.Vector3(), _q = new THREE.Quaternion();

export class Peek {
  constructor(g) {
    this.g = g;
    this.base = new THREE.PerspectiveCamera(); // 没靠近时的镜头
    this.at = new THREE.Vector3(); // 指针指着的海底（照没靠近时的镜头）
    this.ok = false; // 这会儿有指着的海底
    // 镜头靠近的那一点：画面上哪里（弹簧跟着指针）、离没靠近的眼睛多远。记画面上的位置，船开着也不落在后面
    this.p = new THREE.Vector3();
    this.s = { x: 0, y: 0, d: 0, vx: 0, vy: 0 };
    this.reset();
  }

  reset() {
    this.k = 0;
    this.kv = 0;
    this.u = 0;
    this.on = false;
  }

  // 指针指着的海底：看得见指针、在海上这一屏的时候才有（冲洗、揭宝、开舱时指针收着）
  get can() {
    const g = this.g;
    return g.moment.on && (g.mode === 'arm' || g.mode === 'net') && g.cam.alt.w < 0.01 && g.input.device === 'kb' && g.input.state.ptr.ok;
  }

  // 没靠近时，这一点在画面上哪里
  project(p, out = _e) {
    out.copy(p).project(this.base);
    return { x: (out.x * 0.5 + 0.5) * VIEW_W, y: (-out.y * 0.5 + 0.5) * VIEW_H, z: out.z };
  }

  // 视线从指针底下穿过去，落在海底（沉船的面也算）哪一点
  find(P) {
    const b = this.base, g = this.g;
    _d.set((P.x / VIEW_W) * 2 - 1, 1 - (P.y / VIEW_H) * 2, 0.5).unproject(b).sub(b.position).normalize();
    const o = b.position, bp = g.boatCtl.pos;
    let t = _d.y < -0.02 ? -o.y / _d.y : 1e9;
    // 从水面往下走，走到海底为止
    let a = t, hit = false;
    for (let i = 0; i < 80 && t < 1e8; i++) {
      const x = o.x + _d.x * t, y = o.y + _d.y * t, z = o.z + _d.z * t;
      const s = g.world.surfaceAt(x, z).y;
      if (y <= s) { hit = true; break; }
      if (Math.hypot(x - bp.x, z - bp.z) > REACH) break;
      a = t;
      t += clamp((y - s) * 0.7, 0.25, 3);
    }
    if (hit) {
      for (let i = 0; i < 7; i++) {
        const m = (a + t) / 2;
        if (o.y + _d.y * m <= g.world.surfaceAt(o.x + _d.x * m, o.z + _d.z * m).y) t = m; else a = m;
      }
    } else if (t > 1e8) return false;
    this.at.copy(o).addScaledVector(_d, t);
    return true;
  }

  // 每帧镜头摆好以后：先记下没靠近的样子，再靠近
  update(dt) {
    const g = this.g, cam = g.cam, c = cam.cam, b = this.base;
    b.position.copy(c.position);
    b.quaternion.copy(c.quaternion);
    b.matrixWorld.copy(c.matrixWorld);
    b.matrixWorldInverse.copy(c.matrixWorldInverse);
    b.projectionMatrix.copy(c.projectionMatrix);
    b.projectionMatrixInverse.copy(c.projectionMatrixInverse);
    const inp = g.input.state;
    this.ok = this.can && this.find(inp.ptr);
    const on = (this.on = this.ok && !!inp.peek);
    if (!on && this.k < 1e-3) { this.k = this.kv = this.u = 0; return; }
    const S = this.s, D = this.ok ? b.position.distanceTo(this.at) : S.d;
    if (this.k < 1e-3) { S.x = inp.ptr.x; S.y = inp.ptr.y; S.d = D; S.vx = S.vy = 0; }
    const n = Math.max(1, Math.ceil(dt * 120)), h = dt / n;
    for (let i = 0; i < n && h > 0; i++) {
      this.u = clamp(this.u + (on ? h : -h) / RAMP, 0, 1);
      this.kv += (W_K * W_K * (this.u - this.k) - 2 * W_K * this.kv) * h;
      this.k += this.kv * h;
      if (!this.ok) continue;
      S.vx += (W_P * W_P * (inp.ptr.x - S.x) - 2 * W_P * S.vx) * h;
      S.vy += (W_P * W_P * (inp.ptr.y - S.y) - 2 * W_P * S.vy) * h;
      S.x += S.vx * h;
      S.y += S.vy * h;
      S.d += (D - S.d) * (1 - Math.exp(-10 * h));
    }
    this.p.set((S.x / VIEW_W) * 2 - 1, 1 - (S.y / VIEW_H) * 2, 0.5).unproject(b).sub(b.position).normalize().multiplyScalar(S.d).add(b.position);
    this.k = clamp(this.k, 0, 1);
    // 靠近到几成：眼睛不低过 EYE_Y
    const P = this.p, D0 = b.position.distanceTo(P);
    const s = Math.min(1, Math.max(NEAR, (EYE_Y - P.y) / Math.max(1, b.position.y - P.y)));
    const f = Math.pow(s, this.k);
    c.position.lerpVectors(P, b.position, f);
    // 那一点在没靠近的画面上是哪个方向（镜头自己的坐标）；视角收窄以后还在画面上同一处，要转过去多少
    const t0 = Math.tan(THREE.MathUtils.degToRad(c.fov / 2)), t1 = t0 * Math.pow(ZOOM, -this.k);
    _d.copy(P).sub(b.position).applyQuaternion(_q.copy(b.quaternion).invert());
    const ax = clamp(_d.x / -_d.z, -t0 * c.aspect, t0 * c.aspect), ay = clamp(_d.y / -_d.z, -t0, t0);
    _d.set(ax, ay, -1).normalize();
    _e.set((ax * t1) / t0, (ay * t1) / t0, -1).normalize();
    c.quaternion.copy(b.quaternion).multiply(_q.setFromUnitVectors(_e, _d));
    c.fov = THREE.MathUtils.radToDeg(Math.atan(t1)) * 2;
    c.updateProjectionMatrix();
    c.updateMatrixWorld(true);
    // 像素格、影子照这会儿看的地方
    const k = smoothstep(0, 1, this.k);
    cam.focusDist += (D0 * f - cam.focusDist) * k;
    cam.lookAtPt.lerp(P, k);
  }
}

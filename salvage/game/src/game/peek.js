import * as THREE from 'three';
import { VIEW_W, VIEW_H } from '../config.js';
import { clamp, smoothstep } from '../util/math.js';
import { N } from './tables.js';

// 按住左 Shift：镜头靠近指针指着的那块海底，把它放到画面正中，松开回去。停着、开着船、网在水里都行。
// 怎么靠近：顺着「眼睛 → 指着的那一点」的视线往前推一截，再收窄视角（像举起望远镜），那一点同时缓缓走到画面正中。
// 按着时指针跟着它指着的那一处：鼠标在画面上挪多少，指针就挪多少，指到看得见的哪儿就是哪儿；
// 相机一直朝着让指针落在正中去移（起步、停下都缓，最快不超过一个速度），到了正中就停住，不再动。
// 所以按着时指针是画出来的一支（keyshow.js），鼠标自己锁在画面里；锁不上（浏览器不给）也照样，只是鼠标推到屏幕边上就推不动了。
// 松开以后指针还指着那一处，跟着画面退回去；这时它和鼠标差着的那一点，挪鼠标的时候一路补上。
// 指着哪一点照没靠近时的镜头算（base）：挑打捞点照它算，按着 Shift 下网、开船和不按一样。
// 眼睛一直在水面以上：水里那一段视线和没靠近时一样长，浅水看得见、越深越难辨认，靠近了也是这样。
// 全游戏一份。
const NEAR = 0.5; // 往前推到原来离那一点的几成
const EYE_Y = 12; // 眼睛最低离水面多高（自己的船不糊满画面）
const ZOOM = 2.2; // 视角收窄，再放大几倍
const REACH = 46; // 指得再远也只看到离船这么远
const RAMP = 0.2, W_K = 11; // 靠近、回去：先匀着走，再过一道弹簧（临界阻尼）——起步、停下都缓，半秒多一点
const D_K = 4; // 扫过高低不平的地方，推近的远近跟着变的快慢
const EDGE = 48; // 指针离画面边最少多远（像素）：推得快，相机没跟上时停在边上
const BACK = 0.6; // 松开以后挪鼠标，每挪一像素补上几像素
const _d = new THREE.Vector3(), _e = new THREE.Vector3(), _q = new THREE.Quaternion(), _n = new THREE.Vector3();

export class Peek {
  constructor(g) {
    this.g = g;
    this.base = new THREE.PerspectiveCamera(); // 没靠近时的镜头
    this.at = new THREE.Vector3(); // 指针指着的海底（照没靠近时的镜头）
    this.ok = false; // 这会儿有指着的海底
    // 镜头靠近的那一点：没靠近的画面上哪里（缓缓跟着指针）、离没靠近的眼睛多远。记画面上的位置，船开着也不落在后面
    this.p = new THREE.Vector3();
    this.q = new THREE.Vector3();
    this.s = { x: 0, y: 0, d: 0, vx: 0, vy: 0 };
    this.shown = { x: 0, y: 0 }; // 指针画在画面上哪里
    this.b = { x: 0, y: 0 }; // 指针指着没靠近的画面上哪里
    this.off = { x: 0, y: 0 }; // 它和鼠标自己差多少
    this.reset();
  }

  reset() {
    this.off.x = this.off.y = 0;
    this.w = this.wv = this.rel = 0;
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

  // 指针是画出来的那一支（和鼠标自己不在一处）
  get own() {
    return this.can && !this.g.input.botDriven && (this.k > 0 || !!(this.off.x || this.off.y));
  }

  // 每帧读完输入以后：指针指着哪
  aim(inp) {
    const g = this.g, I = g.input, P = inp.ptr, O = this.off, B = this.b;
    I.canPeek = this.can && !I.botDriven;
    if (!I.canPeek) {
      O.x = O.y = 0;
    } else {
      const dx = inp.drag ? 0 : inp.px / I.scale, dy = inp.drag ? 0 : inp.py / I.scale;
      if (this.k > 0) {
        this.push(dx, dy);
        O.x = B.x - P.rx; O.y = B.y - P.ry;
      } else {
        const L = Math.hypot(O.x, O.y), f = L > 1 ? Math.max(0, 1 - (BACK * Math.hypot(dx, dy)) / L) : 0;
        O.x *= f; O.y *= f;
        B.x = clamp(P.rx + O.x, 0, VIEW_W); B.y = clamp(P.ry + O.y, 0, VIEW_H);
        if (O.x || O.y) { O.x = B.x - P.rx; O.y = B.y - P.ry; }
      }
      if (O.x || O.y) { P.x = P.sx = B.x; P.y = P.sy = B.y; }
    }
    if (this.k > 0 && this.can) { P.sx = this.shown.x; P.sy = this.shown.y; }
    B.x = P.x; B.y = P.y;
  }

  // 鼠标挪了一下：指针在画面上挪一样多，挪到的那儿在没靠近的画面上是哪里
  push(dx, dy) {
    const B = this.b, S = this.shown;
    if (!dx && !dy) return;
    const x = clamp(S.x + dx, EDGE, VIEW_W - EDGE), y = clamp(S.y + dy, EDGE, VIEW_H - EDGE);
    this.under(x, y);
    S.x = x; S.y = y;
  }

  // 画面上这一点，在没靠近的画面上是哪里（照看着的那一点那么远）
  under(x, y) {
    const c = this.g.cam.cam, B = this.b;
    c.getWorldDirection(_n);
    _d.set((x / VIEW_W) * 2 - 1, 1 - (y / VIEW_H) * 2, 0.5).unproject(c).sub(c.position);
    const t = _e.copy(this.p).sub(c.position).dot(_n) / _d.dot(_n);
    if (!(t > 0)) return;
    const q = this.project(_d.multiplyScalar(t).add(c.position));
    B.x = clamp(q.x, 4, VIEW_W - 4); B.y = clamp(q.y, 4, VIEW_H - 4);
  }

  // 指针画在画面上哪里
  show() {
    const c = this.g.cam.cam, B = this.b, b = this.base;
    c.getWorldDirection(_n);
    _d.set((B.x / VIEW_W) * 2 - 1, 1 - (B.y / VIEW_H) * 2, 0.5).unproject(b).sub(b.position);
    const t = _e.copy(this.p).sub(b.position).dot(_n) / _d.dot(_n);
    _e.copy(b.position).addScaledVector(_d, t).project(c);
    this.shown.x = (_e.x * 0.5 + 0.5) * VIEW_W; this.shown.y = (-_e.y * 0.5 + 0.5) * VIEW_H;
  }

  // 没靠近时，这一点在画面上哪里
  project(p, out = _e) {
    out.copy(p).project(this.base);
    return { x: (out.x * 0.5 + 0.5) * VIEW_W, y: (-out.y * 0.5 + 0.5) * VIEW_H, z: out.z };
  }

  // 视线从画面上这一点（P）穿过去，落在海底（沉船的面也算）哪一点
  find(P, out) {
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
    out.copy(o).addScaledVector(_d, t);
    return true;
  }

  // 视线跟着指针走一步：临界阻尼，最快不超过一个速度
  follow(P, h) {
    const S = this.s, T = N('看海底·跟过去'), V = N('看海底·最快'); // 表的 id，不是玩家看的
    const w = 2 / T, e = Math.exp(-w * h);
    let dx = S.x - P.x, dy = S.y - P.y;
    const d = Math.hypot(dx, dy), k = d > V * T ? (V * T) / d : 1;
    dx *= k; dy *= k;
    const tx = (S.vx + w * dx) * h, ty = (S.vy + w * dy) * h;
    const ox = S.x - dx, oy = S.y - dy;
    S.vx = (S.vx - w * tx) * e; S.vy = (S.vy - w * ty) * e;
    S.x = ox + (dx + tx) * e; S.y = oy + (dy + ty) * e;
  }

  // 指着的那一点往画面正中走一步：临界阻尼，最快不超过一个速度
  centre(h) {
    const L = Math.max(1, Math.hypot(this.s.x - VIEW_W / 2, this.s.y - VIEW_H / 2));
    const T = N('看海底·到正中'), V = N('看海底·到正中最快') / L; // 表的 id，不是玩家看的
    const o = 2 / T, e = Math.exp(-o * h), x0 = 1 - this.w, x = Math.min(x0, V * T);
    const t = (-this.wv + o * x) * h;
    this.wv = -((-this.wv - o * t) * e);
    this.w = clamp(1 - (x0 - x + (x + t) * e), 0, 1);
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
    this.ok = this.can && this.find(inp.ptr, this.at);
    const on = (this.on = this.ok && !!inp.peek);
    if (!on && this.k < 1e-3) { this.k = this.kv = this.u = this.w = this.wv = 0; return; }
    const S = this.s;
    // 刚按下、画面还没动：直接从指针这儿靠近
    if (this.k < 0.02) { if (!this.k) this.w = this.wv = 0; S.x = inp.ptr.x; S.y = inp.ptr.y; S.vx = S.vy = 0; if (this.ok) S.d = b.position.distanceTo(this.at); }
    const D = this.ok && this.find(S, this.q) ? b.position.distanceTo(this.q) : S.d;
    const n = Math.max(1, Math.ceil(dt * 120)), h = dt / n;
    for (let i = 0; i < n && h > 0; i++) {
      this.u = clamp(this.u + (on ? h : -h) / RAMP, 0, 1);
      this.kv += (W_K * W_K * (this.u - this.k) - 2 * W_K * this.kv) * h;
      this.k += this.kv * h;
      if (!this.ok) continue;
      this.follow(inp.ptr, h);
      S.d += (D - S.d) * (1 - Math.exp(-D_K * h));
      if (on) this.centre(h);
    }
    // 松开：跟着退回去
    if (on) this.rel = this.w / Math.max(this.k, 1e-3);
    else this.w = clamp(this.rel * this.k, 0, 1), this.wv = 0;
    this.p.set((S.x / VIEW_W) * 2 - 1, 1 - (S.y / VIEW_H) * 2, 0.5).unproject(b).sub(b.position).normalize().multiplyScalar(S.d).add(b.position);
    this.k = clamp(this.k, 0, 1);
    // 靠近到几成：眼睛不低过 EYE_Y
    const P = this.p, D0 = b.position.distanceTo(P);
    const s = Math.min(1, Math.max(NEAR, (EYE_Y - P.y) / Math.max(1, b.position.y - P.y)));
    const f = Math.pow(s, this.k);
    c.position.lerpVectors(P, b.position, f);
    // 那一点在没靠近的画面上是哪个方向（镜头自己的坐标）；视角收窄以后它在画面上走到离正中几成的地方，要转过去多少
    const t0 = Math.tan(THREE.MathUtils.degToRad(c.fov / 2)), t1 = t0 * Math.pow(ZOOM, -this.k);
    _d.copy(P).sub(b.position).applyQuaternion(_q.copy(b.quaternion).invert());
    const ax = clamp(_d.x / -_d.z, -t0 * c.aspect, t0 * c.aspect), ay = clamp(_d.y / -_d.z, -t0, t0);
    _d.set(ax, ay, -1).normalize();
    const left = (t1 / t0) * (1 - this.w);
    _e.set(ax * left, ay * left, -1).normalize();
    c.quaternion.copy(b.quaternion).multiply(_q.setFromUnitVectors(_e, _d));
    c.fov = THREE.MathUtils.radToDeg(Math.atan(t1)) * 2;
    c.updateProjectionMatrix();
    c.updateMatrixWorld(true);
    // 像素格、影子照这会儿看的地方
    const k = smoothstep(0, 1, this.k);
    cam.focusDist += (D0 * f - cam.focusDist) * k;
    cam.lookAtPt.lerp(P, k);
    // 指针画在哪；推出画面的拉回边上
    this.show();
    const Q = this.shown, I = inp.ptr;
    if (on && !g.input.botDriven) {
      const x = clamp(Q.x, EDGE, VIEW_W - EDGE), y = clamp(Q.y, EDGE, VIEW_H - EDGE);
      if ((x !== Q.x || y !== Q.y) && this.w > 0.98) { this.under(x, y); this.show(); I.x = this.b.x; I.y = this.b.y; this.off.x = I.x - I.rx; this.off.y = I.y - I.ry; }
    }
    I.sx = Q.x; I.sy = Q.y;
  }
}

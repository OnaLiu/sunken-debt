// 按“开始航程”以后海面这一侧（第十四批 G3：出发！）。标题那一侧（按钮、汽笛、往水面扎下去）在 src/ui/title.js。
// 只在标题上按“开始航程”这一条路上有（main.js 的 departTransition）；“再来一次”、自动演示、测试里直接开的一趟都没有它。
// 全是表现，不碰规则：船不挪、不烧油，镜头只改画出来的那一帧（游戏自己的镜头照常跟着船走，交回来时正好接上）。
//   黑场：镜头已经摆在船的右后方二十几米、贴着水面，船身、船尾和前面的海都在画里（远处的海蚀柱、岬角）
//   海面亮起（lightUp）：先是一层暖白的光（像刚从暗处出来、太阳照在水上），1.4 秒里退掉；
//     船尾的水已经在翻：螺旋桨搅起一团白水往后推，身后一道刚划出来的 V 字航迹一路拖回码头那边，船尾推出一圈波纹，
//     船身吃一下劲往下一坐再浮起来；机器“突、突、突”咬上三下、船尾的水“哗”地翻起来（castOff），海和机器的声音跟着画面一起起来
//   0.5 秒以后镜头从右后方的水面上升起来、往后退、转到平常开船的位置（2.3 秒，先慢后快再慢），交给游戏自己的镜头
import * as THREE from 'three';
import { fxTag } from '../fx/tags.js';

const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const smooth = (u) => u * u * u * (u * (u * 6 - 15) + 10);
const angLerp = (a, b, k) => { let d = b - a; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; return a + d * k; };
const _p = new THREE.Vector3(), _l = new THREE.Vector3(), _f = new THREE.Vector3();

// 一开始的镜头（相对船）：船尾后面偏一点、贴着水面，朝船头前面看
const START = { yaw: Math.PI + 0.5, pitch: 0.1, dist: 26, lookY: 1.4 }; // 右舷后方、贴着水：码头在左舷，挡不着
const HOLD = 0.5, GLIDE = 2.3, SUN = 1.4, CHURN = 2.4;

export class Opening {
  constructor(g, root) {
    this.g = g; this.root = root;
    this.t = -1;        // 海面亮起以后几秒（-1：还在黑场里）
    this.done = false;
    this.churnAcc = 0;
    // 暖白的那一层光（在黑场下面，黑场退掉时它已经在）
    const s = this.sun = document.createElement('div');
    s.className = 'g3sun';
    root.appendChild(s);
  }
  // 黑场开始退的那一刻（main.js 调）
  lightUp() {
    if (this.t >= 0 || this.done) return;
    const g = this.g, b = g.boat, P = g.particles;
    this.t = 0;
    this.sun.style.opacity = '0.62';
    g.audio && g.audio.play('castOff');
    g.audio && g.audio.unhush(0.1, 1.6);
    fxTag('G3', '开始航程·海面亮起，船已在动', 'G3|light');
    // 身后一道刚划出来的航迹：V 字两道白浪，越往后越宽、越淡、越早散掉（看得出船是从码头那边开出来的）。
    // 水面会画航迹（第十一批 A1 的 wake.js）时补进水面里，和开起来以后的航迹是同一种；没有时才用粒子撒
    const hx = Math.sin(b.heading), hz = Math.cos(b.heading), sx = -hz, sz = hx;
    if (g.wake && g.wake.seed) g.wake.seed();
    else for (let d = 3; d < 30; d += 0.9) {
      const k = d / 30, spread = 1.5 + d * 0.13;
      for (const side of [-1, 1]) {
        const x = b.x - hx * (7.4 + d) + sx * side * spread + (Math.random() - 0.5) * 0.6, z = b.z - hz * (7.4 + d) + sz * side * spread + (Math.random() - 0.5) * 0.6;
        P.water.emit(x, 0.06, z, sx * side * 0.35, 0, sz * side * 0.35, 3.4 - 2.2 * k + Math.random() * 0.6, 0.34 + 0.2 * k, 0.92, 0.97, 0.98, 0.55 - 0.3 * k, 2.2, 0.8, 0);
      }
      // 中间那一道被螺旋桨搅过的浅色水
      if (d < 16) P.water.emit(b.x - hx * (7.4 + d), 0.05, b.z - hz * (7.4 + d), 0, 0, 0, 2.6 - d * 0.1, 0.55, 0.9, 0.96, 0.97, 0.32 - d * 0.014, 2.6, 0.9, 0);
    }
    // 船尾推出一圈波纹；船身吃一下劲往下一坐
    g.ripples && g.ripples.add(b.x - hx * 7.6, b.z - hz * 7.6, { amp: 0.75, speed: 4.2, life: 4.2, r0: 2.4 });
    b.dip && b.dip(0.07, 0, -4);
  }
  // 每一帧在游戏自己的镜头算完以后调（game.update 的最后）
  update(dt) {
    if (this.done) return;
    const g = this.g, b = g.boat, cam = g.view.camera, c = g.cam;
    if (this.t >= 0) this.t += dt;
    const t = Math.max(0, this.t);
    // 船尾的水在翻：螺旋桨搅起白水往后推（越来越小，2.4 秒收住）
    if (this.t >= 0 && t < CHURN) {
      const k = 1 - t / CHURN, hx = Math.sin(b.heading), hz = Math.cos(b.heading), sx = -hz, sz = hx;
      this.churnAcc += dt * (26 * k + 4);
      while (this.churnAcc > 1) {
        this.churnAcc -= 1;
        const sd = (Math.random() - 0.5) * 2.2, v = 1.4 + Math.random() * 1.6 * k;
        g.particles.water.emit(b.x - hx * 7.9 + sx * sd, 0.07, b.z - hz * 7.9 + sz * sd, -hx * v + sx * sd * 0.5, 0, -hz * v + sz * sd * 0.5, 1.6 + Math.random() * 0.9, 0.3 + Math.random() * 0.25, 0.94, 0.98, 1.0, 0.5 + 0.25 * k, 2.4, 0.9, 0);
      }
    }
    // 暖白的光退掉
    if (this.t >= 0) { const u = clamp(t / SUN, 0, 1); this.sun.style.opacity = (0.62 * Math.pow(1 - u, 1.7)).toFixed(3); }
    // 镜头：从船尾后面贴着水面，升起来、退出去、转到平常的位置
    const w = this.t < 0 ? 0 : smooth(clamp((t - HOLD) / GLIDE, 0, 1));
    const fx = b.x + Math.sin(b.heading) * 3, fz = b.z + Math.cos(b.heading) * 3;
    // 游戏自己的镜头（相对它看的那一点）：方位、俯仰、距离
    _f.copy(c.look); cam.position.copy(c.pos);
    const ex = c.pos.x - c.look.x, ey = c.pos.y - c.look.y, ez = c.pos.z - c.look.z;
    const eDist = Math.hypot(ex, ey, ez), eYaw = Math.atan2(ex, ez), ePitch = Math.asin(clamp(ey / Math.max(1e-3, eDist), -1, 1));
    const yaw = angLerp(b.heading + START.yaw, eYaw, w), pitch = START.pitch + (ePitch - START.pitch) * w, dist = START.dist + (eDist - START.dist) * w;
    _l.set(fx + (_f.x - fx) * w, START.lookY + (_f.y - START.lookY) * w, fz + (_f.z - fz) * w);
    _p.set(_l.x + Math.sin(yaw) * Math.cos(pitch) * dist, _l.y + Math.sin(pitch) * dist, _l.z + Math.cos(yaw) * Math.cos(pitch) * dist);
    if (_p.y < 1.4) _p.y = 1.4;
    cam.position.copy(_p); cam.lookAt(_l);
    if (this.t >= HOLD + GLIDE && this.t >= SUN) this.end();
  }
  // 放完：画面交回游戏自己的镜头（这时两边已经一样了）
  end() {
    if (this.done) return;
    this.done = true;
    this.sun.remove();
  }
}

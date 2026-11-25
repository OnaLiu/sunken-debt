// 开局 2.5 秒（第十四批 G4：往那边去）。只在自己开的一趟的开头有一次（自动演示里机器人在开，不画）；不说话。
//   从船头前面起，水面上一道虚线 0.85 秒里朝红浮标描出去，描的那一头带一点亮；画面里画不下就停在屏幕边上，
//   箭头落在那里弹一下，旁边一枚小小的红浮标（浮标在画面里时就是它自己那里亮一圈）；
//   箭头落下那一刻，远处浮标上的铃“叮……当”，从它那一边传过来，浮标那里的水面推出一圈波纹。
//   之后虚线一直朝那边流，每 1.5 秒有一道亮光顺着它跑过去；船头怎么转，虚线都从船头起、指着浮标。
//   朝它开起来：虚线亮一下、流得更快，然后从船这头往远处收走；一直不动，9 秒时再轻轻响一次、箭头再弹一下；
//   16 秒、转入作业或者已经开到它跟前 40 米：淡掉。
import { MARK, W, H } from '../ui/overlay.js';
import { fxTag } from '../fx/tags.js';

const DRAW = 0.85;
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const ease3 = (u) => 1 - Math.pow(1 - u, 3);
const smooth = (u) => u * u * (3 - 2 * u);

export class Guide {
  constructor(g) {
    this.g = g; this.t = 0;
    const b = g.boat, lm = g.world.landmarks.find((l) => l.kind === 'buoy');
    this.to = lm ? { x: lm.x, z: lm.z } : { x: b.x + 120, z: b.z };
    this.from0 = { x: b.x, z: b.z };
    this.ack = -1; this.out = -1; this.ringT = -9; this.rang = false; this.nudged = false; this.done = false;
    fxTag('G4', '往那边去·虚线指向浮标', 'G4');
  }
  update(dt) {
    if (this.done) return;
    this.t += dt;
    const g = this.g, b = g.boat, t = this.t;
    if (!this.rang && t >= DRAW) { this.rang = true; this.ring(false); }
    const dx = this.to.x - b.x, dz = this.to.z - b.z, d = Math.hypot(dx, dz) || 1;
    const facing = (Math.sin(b.heading) * dx + Math.cos(b.heading) * dz) / d;
    // 朝它开起来了
    if (this.ack < 0 && this.out < 0 && t > DRAW * 0.6 && b.speed > 1.2 && facing > 0.64) { this.ack = t; fxTag('G4', '往那边去·朝它开了，虚线收起', 'G4'); }
    // 一直没动：再提醒一次（轻一点）
    if (this.ack < 0 && this.out < 0 && !this.nudged && t > 9 && Math.hypot(b.x - this.from0.x, b.z - this.from0.z) < 2) { this.nudged = true; this.ring(true); }
    if (this.ack < 0 && this.out < 0 && (t > 16 || g.mode === 'work' || d < 40)) this.out = t;
    if ((this.ack >= 0 && t > this.ack + 1.6) || (this.out >= 0 && t > this.out + 1.0)) this.done = true;
  }
  // 浮标上的铃（从它那一边传过来）、浮标那里的水面推出一圈波纹
  ring(soft) {
    const g = this.g, cam = g.view.camera, e = cam.matrixWorld.elements;
    const dx = this.to.x - cam.position.x, dz = this.to.z - cam.position.z, d = Math.hypot(dx, dz) || 1;
    const pan = clamp((e[0] * dx + e[2] * dz) / d, -1, 1) * 0.8; // 镜头的右手方向
    g.audio && g.audio.play('buoyBell', { pan, soft: soft ? 1 : 0 });
    g.ripples && g.ripples.add(this.to.x, this.to.z, { amp: soft ? 0.4 : 0.6, speed: 2.6, life: 3.6, r0: 1.0 });
    this.ringT = this.t;
  }
  // 世界标记层（overlay.js）每帧调：ov 是标记层，cam 是镜头
  draw(ov, cam) {
    if (this.done) return;
    const g = this.g, b = g.boat, t = this.t, x = ov.ctx;
    const hx = Math.sin(b.heading), hz = Math.cos(b.heading);
    const ox = b.x + hx * 9.5, oz = b.z + hz * 9.5;
    // 从船头到浮标：一路投到屏幕上，出了屏幕（或压到面板）就停
    const pts = [], N = 56;
    // 面板四周多留 64 像素：箭头和它前面那枚小浮标都得露在面板外面
    const nearPanel = (p, m) => ov.obst.some((o) => p.x > o.x - m && p.x < o.x + o.w + m && p.y > o.y - m && p.y < o.y + o.h + m);
    let cut = false;
    for (let i = 0; i <= N; i++) {
      const k = i / N, p = ov.project(cam, ox + (this.to.x - ox) * k, 0.2, oz + (this.to.z - oz) * k);
      const okp = p && p.on && p.x > 70 && p.x < W - 70 && p.y > 80 && p.y < H - 70 && !nearPanel(p, 64);
      if (!okp) { cut = i > 0; break; }
      pts.push(p);
    }
    if (pts.length < 2) return;
    const seg = [0];
    for (let i = 1; i < pts.length; i++) seg.push(seg[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
    const L = seg[seg.length - 1];
    if (L < 30) return;
    const at = (s) => {
      s = clamp(s, 0, L);
      let i = 1; while (i < seg.length - 1 && seg[i] < s) i++;
      const u = (s - seg[i - 1]) / Math.max(1e-3, seg[i] - seg[i - 1]);
      return { x: pts[i - 1].x + (pts[i].x - pts[i - 1].x) * u, y: pts[i - 1].y + (pts[i].y - pts[i - 1].y) * u, a: Math.atan2(pts[i].y - pts[i - 1].y, pts[i].x - pts[i - 1].x) };
    };
    const path = (s0, s1) => {
      x.beginPath(); const p0 = at(s0); x.moveTo(p0.x, p0.y);
      for (let i = 1; i < pts.length; i++) if (seg[i] > s0 && seg[i] < s1) x.lineTo(pts[i].x, pts[i].y);
      const p1 = at(s1); x.lineTo(p1.x, p1.y);
    };
    // 描出去、收回来、淡掉
    const kd = ease3(clamp(t / DRAW, 0, 1));
    const s1 = L * kd;
    const s0 = this.ack >= 0 ? L * smooth(clamp((t - this.ack - 0.35) / 1.1, 0, 1)) : 0;
    let alpha = clamp(t / 0.15, 0, 1);
    if (this.out >= 0) alpha *= 1 - clamp((t - this.out) / 1.0, 0, 1);
    if (this.ack >= 0) alpha *= 1 - clamp((t - this.ack - 0.9) / 0.7, 0, 1);
    if (alpha <= 0.01 || s1 - s0 < 4) return;
    const bright = this.ack >= 0 ? 1 - clamp((t - this.ack) / 0.5, 0, 1) : 0;
    const col = MARK.find;
    const flow = t * 30 + (this.ack >= 0 ? (t - this.ack) * 70 : 0);
    x.save();
    x.lineCap = 'round'; x.lineJoin = 'round';
    x.globalAlpha = alpha;
    x.setLineDash([16, 10]); x.lineDashOffset = -flow;
    path(s0, s1); x.lineWidth = 9; x.strokeStyle = 'rgba(6,12,14,0.6)'; x.stroke();
    path(s0, s1); x.lineWidth = 4.2 + 1.6 * bright; x.strokeStyle = col;
    if (bright > 0) { x.shadowColor = col; x.shadowBlur = 14 * bright; }
    x.stroke();
    x.shadowBlur = 0; x.setLineDash([]);
    // 每 1.5 秒一道亮光顺着跑过去（描完以后）
    if (t > DRAW + 0.2 && this.ack < 0) {
      const ph = ((t - DRAW - 0.2) % 1.5) / 0.95;
      if (ph < 1) {
        const c = s0 + (s1 - s0) * ph;
        x.globalAlpha = alpha * Math.sin(ph * Math.PI) * 0.9;
        path(Math.max(s0, c - 46), Math.min(s1, c)); x.lineWidth = 3.4; x.strokeStyle = '#ffffff'; x.shadowColor = col; x.shadowBlur = 12; x.stroke(); x.shadowBlur = 0;
      }
    }
    // 描的那一头：一点亮
    const tip = at(s1);
    if (kd < 1) {
      x.globalAlpha = alpha;
      const gr = x.createRadialGradient(tip.x, tip.y, 0, tip.x, tip.y, 16);
      gr.addColorStop(0, 'rgba(255,255,255,0.95)'); gr.addColorStop(0.35, 'rgba(207,239,248,0.6)'); gr.addColorStop(1, 'rgba(207,239,248,0)');
      x.fillStyle = gr; x.beginPath(); x.arc(tip.x, tip.y, 16, 0, 6.283); x.fill();
    }
    // 箭头：落下那一下弹大再回来；提醒那一下再弹一次；平时轻轻地呼吸
    if (kd >= 1 && s1 - s0 > 20) {
      const r = t - this.ringT, pop = r >= 0 && r < 0.5 ? 1 + 0.75 * Math.exp(-r * 7) * Math.cos(r * 16) : 1;
      const hs = (1.4 + 0.07 * Math.sin(t * 3.4)) * pop * (1 + 0.25 * bright);
      x.globalAlpha = alpha;
      x.save(); x.translate(tip.x, tip.y); x.rotate(tip.a);
      x.beginPath(); x.moveTo(13 * hs, 0); x.lineTo(-9 * hs, -11 * hs); x.lineTo(-4 * hs, 0); x.lineTo(-9 * hs, 11 * hs); x.closePath();
      x.lineWidth = 4; x.strokeStyle = 'rgba(6,12,14,0.75)'; x.stroke(); x.fillStyle = col; x.fill();
      x.restore();
      // 浮标不在画面里：箭头前面一枚小红浮标（铃响时顶上的灯亮）
      const bp = ov.project(cam, this.to.x, 1.6, this.to.z);
      const seen = bp && bp.on && !cut;
      const lamp = r >= 0 && r < 1.6 ? Math.exp(-r * 2.2) : 0;
      if (!seen) {
        const bx = tip.x + Math.cos(tip.a) * 27 * hs, by = tip.y + Math.sin(tip.a) * 27 * hs;
        this.buoyIcon(x, bx, by, pop, lamp, alpha);
        ov.icons.push({ x: bx, y: by, kind: 'guideBuoy' });
      } else {
        // 浮标就在画面里：它那里亮一圈
        for (let i = 0; i < 2; i++) {
          const q = clamp((r - i * 0.18) / 1.1, 0, 1);
          if (r < 0 || q >= 1) continue;
          x.globalAlpha = alpha * (1 - q); x.strokeStyle = '#ff9a7a'; x.lineWidth = 3 * (1 - q) + 1;
          x.beginPath(); x.arc(bp.x, bp.y, 10 + 34 * q, 0, 6.283); x.stroke();
        }
        if (lamp > 0) { x.globalAlpha = alpha * lamp; const gr = x.createRadialGradient(bp.x, bp.y - 6, 0, bp.x, bp.y - 6, 14); gr.addColorStop(0, '#fff3d0'); gr.addColorStop(1, 'rgba(255,90,60,0)'); x.fillStyle = gr; x.beginPath(); x.arc(bp.x, bp.y - 6, 14, 0, 6.283); x.fill(); }
      }
      ov.icons.push({ x: tip.x, y: tip.y, kind: 'guide', drawn: 1 });
    }
    x.restore();
  }
  // 一枚小红浮标：圆筒、尖顶、顶上一盏灯
  buoyIcon(x, cx, cy, pop, lamp, alpha) {
    const s = 1.3 * pop;
    x.save(); x.translate(cx, cy); x.scale(s, s); x.globalAlpha = alpha;
    x.lineWidth = 3; x.strokeStyle = 'rgba(6,12,14,0.8)';
    x.beginPath(); x.moveTo(-7, 6); x.lineTo(-6, -4); x.lineTo(0, -15); x.lineTo(6, -4); x.lineTo(7, 6); x.closePath(); x.stroke();
    x.fillStyle = '#d4503a'; x.fill();
    x.fillStyle = '#f2e6d2'; x.fillRect(-6.4, -1.5, 12.8, 2.6);
    x.beginPath(); x.ellipse(0, 7.5, 10, 2.6, 0, 0, 6.283); x.strokeStyle = 'rgba(207,239,248,0.75)'; x.lineWidth = 1.6; x.stroke();
    const lg = 0.35 + 0.65 * lamp;
    const gr = x.createRadialGradient(0, -17, 0, 0, -17, 6 + 10 * lamp);
    gr.addColorStop(0, `rgba(255,243,208,${lg})`); gr.addColorStop(1, 'rgba(255,120,80,0)');
    x.fillStyle = gr; x.beginPath(); x.arc(0, -17, 6 + 10 * lamp, 0, 6.283); x.fill();
    x.restore();
  }
}

// 世界标记层：按屏幕原来的分辨率画（字是高清字体，不跟着 960×540 的像素画面一起放大）。
// 画三类东西：能交互的东西（看得见的松散物、看得见但被挡住的、埋着的硬物）；
// 出手前的预兆（前方浅水会搁浅）；要等的事还剩多久（回收、吊臂到位、冲洗）——一个计时圈加秒数，挂在那件事本身上。
// 字只有秒数、浅滩逼近时船员喊的“浅了！”和冲洗时能按的那个键；排版：避开界面面板、彼此不压、不出屏幕边，放不下就挪到旁边拉一根引线。
// 标记大小按屏幕像素算：镜头拉远拉近，字和图标大小不变。
import * as THREE from 'three';
import { BAG_DROP, NET_R, footprintTop } from '../game/net.js';
import { clamp } from '../core/noise.js';
import { drawTeach } from './teach.js';

export const W = 1920, H = 1080;
const EDGE = 10;
export const FONT = '"PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans CJK SC", "Source Han Sans SC", sans-serif';
export const MARK = {
  loose: '#ffe7a3',   // 看得见的松散物：网能兜
  blocked: '#a9b8b4', // 看得见，但正上方有甲板或船壳挡着，网下不去
  hazard: '#ff6a4a',  // 埋着的硬物：网碰到会自动收回
  shoal: '#ff5a3a',   // 前方浅水：再近（约 1.5 秒撞上）
  shoalNear: '#ffc24a', // 前方浅水：近（约 3 秒撞上）
  timer: '#8fe8dc',   // 等待计时
  find: '#cfeff8',    // 刚发现的地点、线索链往哪边去
  far: '#7cc6f0',     // 远处更深的残骸（只给位置）：深海蓝
  dig: '#f3d79c',     // 生物刚翻出东西的地方：沙色
};
const _v = new THREE.Vector3();

// 看得见吗：水越深越要靠近才认得出（和机器人“注意到”的规则一样）
export function itemSeen(it, bx, bz) {
  if (it.state !== 'seabed' || it.burial > 0.72) return false;
  const range = clamp(50 - Math.max(0, -it.baseY) * 1.25, 15, 50);
  return Math.hypot(it.x - bx, it.z - bz) < range;
}

export class Overlay {
  constructor(canvas) {
    this.c = canvas;
    this.ctx = canvas.getContext('2d');
    this.k = 1;
    this.placed = [];  // 这一帧画出来的字块（测试读取）
    this.icons = [];   // 这一帧画出来的图标
    this.obst = [];
    this.reach = new Map();
    this.dev = 'kb';   // 键鼠 / 手柄：键帽只写正在用的那一种
  }
  setScale(s, dpr) {
    const w = Math.max(1, Math.round(W * s * dpr)), h = Math.max(1, Math.round(H * s * dpr));
    if (this.c.width !== w || this.c.height !== h) { this.c.width = w; this.c.height = h; }
    this.k = w / W;
  }
  clear() {
    const x = this.ctx;
    x.setTransform(1, 0, 0, 1, 0, 0);
    x.clearRect(0, 0, this.c.width, this.c.height);
    x.setTransform(this.k, 0, 0, this.k, 0, 0);
    this.placed = []; this.icons = [];
  }
  project(cam, x, y, z) {
    _v.set(x, y, z).project(cam);
    if (!(_v.z > -1 && _v.z < 1)) return null;
    return { x: (_v.x + 1) / 2 * W, y: (1 - _v.y) / 2 * H, on: _v.x > -1 && _v.x < 1 && _v.y > -1 && _v.y < 1 };
  }
  hit(r) {
    for (const o of this.obst) if (r.x < o.x + o.w && r.x + r.w > o.x && r.y < o.y + o.h && r.y + r.h > o.y) return true;
    for (const o of this.placed) if (r.x < o.x + o.w + 3 && r.x + r.w + 3 > o.x && r.y < o.y + o.h + 3 && r.y + r.h + 3 > o.y) return true;
    return false;
  }
  inPanel(x, y) { for (const o of this.obst) if (x > o.x - 6 && x < o.x + o.w + 6 && y > o.y - 6 && y < o.y + o.h + 6) return true; return false; }
  // 在锚点附近找一个不压别人的位置
  place(ax, ay, w, h) {
    const C = [[-w / 2, -h - 10], [16, -h / 2], [-w - 16, -h / 2], [-w / 2, 12], [-w / 2, -2 * h - 18], [26, -h - 26], [-w - 26, -h - 26], [26, 22], [-w - 26, 22], [-w / 2, -3 * h - 26], [-w / 2, 2 * h + 4], [60, -h / 2], [-w - 60, -h / 2], [-w / 2, -4 * h - 34], [90, -h - 40], [-w - 90, -h - 40]];
    for (const [dx, dy] of C) {
      const r = { x: clamp(ax + dx, EDGE, W - EDGE - w), y: clamp(ay + dy, EDGE, H - EDGE - h), w, h };
      if (!this.hit(r)) return r;
    }
    return null;
  }
  font(px, wt = 600) { this.ctx.font = `${wt} ${px}px ${FONT}`; }
  // 字块：可带一个计时圈；lines = [{ t, c, px, cap }]，cap 是行首的一枚键帽（只写正在用的设备的键）
  label(ax, ay, lines, o = {}) {
    const x = this.ctx;
    const ring = o.ring != null;
    let w = 0, h = 8;
    for (const L of lines) { this.font(L.px || 15, L.wt || 600); L.cw = L.cap ? x.measureText(L.cap).width + 14 : 0; L.w = x.measureText(L.t).width + L.cw; w = Math.max(w, L.w); h += (L.px || 15) + 5; }
    h += 1;
    w += 18 + (ring ? 26 : 0);
    const r = this.place(ax, ay, Math.ceil(w), Math.ceil(h));
    if (!r) return null;
    r.text = lines.map((L) => L.t).join(' / '); r.kind = o.kind || 'label';
    this.placed.push(r);
    const A = o.alpha == null ? 1 : o.alpha;
    x.globalAlpha = A;
    // 离锚点远了就拉一根引线（锚点上一颗小铆点）
    const cx = clamp(ax, r.x, r.x + r.w), cy = clamp(ay, r.y, r.y + r.h);
    if (Math.hypot(cx - ax, cy - ay) > 14 && !o.noLeader) {
      x.strokeStyle = 'rgba(10,20,22,0.85)'; x.lineWidth = 3.5; x.beginPath(); x.moveTo(ax, ay); x.lineTo(cx, cy); x.stroke();
      x.strokeStyle = o.color || 'rgba(230,240,235,0.85)'; x.lineWidth = 1.5; x.beginPath(); x.moveTo(ax, ay); x.lineTo(cx, cy); x.stroke();
      x.fillStyle = '#061012'; x.beginPath(); x.arc(ax, ay, 3.2, 0, 6.3); x.fill();
      x.fillStyle = o.color || '#e8f0ec'; x.beginPath(); x.arc(ax, ay, 1.8, 0, 6.3); x.fill();
    }
    // 小铭牌：深青搪瓷底（上亮下暗）、硬投影、一圈细边、顶上一道高光；名字牌左边一条职责色
    x.fillStyle = 'rgba(0,0,0,0.45)'; roundRect(x, r.x + 1, r.y + 2.5, r.w, r.h, 3); x.fill();
    const bg = x.createLinearGradient(0, r.y, 0, r.y + r.h);
    bg.addColorStop(0, o.bg || 'rgba(24,50,56,0.93)'); bg.addColorStop(1, o.bg || 'rgba(6,16,19,0.93)');
    x.fillStyle = bg; roundRect(x, r.x, r.y, r.w, r.h, 3); x.fill();
    x.strokeStyle = 'rgba(2,6,8,0.9)'; x.lineWidth = 1; roundRect(x, r.x - 0.5, r.y - 0.5, r.w + 1, r.h + 1, 3.5); x.stroke();
    x.strokeStyle = o.color || 'rgba(200,220,215,0.5)'; x.lineWidth = 1.5; roundRect(x, r.x + 0.75, r.y + 0.75, r.w - 1.5, r.h - 1.5, 3); x.stroke();
    x.fillStyle = 'rgba(255,240,200,0.16)'; x.fillRect(r.x + 3, r.y + 2, r.w - 6, 1);
    if (o.stripe) { x.fillStyle = o.stripe; x.fillRect(r.x + 2.5, r.y + 3, 3, r.h - 6); }
    let ty = r.y + 4;
    const tx = r.x + 9 + (ring ? 26 : 0);
    x.textBaseline = 'top';
    for (const L of lines) {
      this.font(L.px || 15, L.wt || 600);
      if (L.cap) {
        const kh = (L.px || 15) + 3;
        x.fillStyle = '#1e363c'; roundRect(x, tx, ty - 1, L.cw - 6, kh, 3); x.fill();
        x.strokeStyle = 'rgba(160,190,186,0.8)'; x.lineWidth = 1; roundRect(x, tx + 0.5, ty - 0.5, L.cw - 7, kh - 1, 3); x.stroke();
        x.fillStyle = '#f6ead0'; x.fillText(L.cap, tx + 4, ty + 1);
      }
      x.fillStyle = L.c || '#eef4f0'; x.fillText(L.t, tx + L.cw, ty + 1); ty += (L.px || 15) + 5;
    }
    if (ring) {
      const rx = r.x + 9 + 10, ry = r.y + r.h / 2;
      x.lineWidth = 3; x.strokeStyle = 'rgba(255,255,255,0.18)'; x.beginPath(); x.arc(rx, ry, 9, 0, Math.PI * 2); x.stroke();
      x.strokeStyle = o.color || MARK.timer; x.beginPath(); x.arc(rx, ry, 9, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * clamp(o.ring, 0, 1)); x.stroke();
      // 走到的那一头一颗亮点
      const ea = -Math.PI / 2 + Math.PI * 2 * clamp(o.ring, 0, 1);
      x.fillStyle = '#ffffff'; x.beginPath(); x.arc(rx + Math.cos(ea) * 9, ry + Math.sin(ea) * 9, 2, 0, 6.3); x.fill();
    }
    x.globalAlpha = 1;
    return r;
  }

  // —— 图标 ——
  diamond(p, color, alpha, lid) {
    const x = this.ctx, s = 7;
    x.globalAlpha = alpha;
    x.lineWidth = 4; x.strokeStyle = 'rgba(6,12,14,0.8)';
    x.beginPath(); x.moveTo(p.x, p.y - s); x.lineTo(p.x + s, p.y); x.lineTo(p.x, p.y + s); x.lineTo(p.x - s, p.y); x.closePath(); x.stroke();
    x.lineWidth = 2; x.strokeStyle = color; x.stroke();
    if (lid) { x.lineWidth = 4; x.strokeStyle = 'rgba(6,12,14,0.8)'; x.beginPath(); x.moveTo(p.x - 9, p.y - 11); x.lineTo(p.x + 9, p.y - 11); x.stroke(); x.lineWidth = 2.5; x.strokeStyle = color; x.stroke(); }
    else { x.fillStyle = color; x.fillRect(p.x - 1.5, p.y - 1.5, 3, 3); }
    x.globalAlpha = 1;
  }
  netCorners(p, age, alpha) {
    const x = this.ctx, k = Math.min(1, age / 0.22), d = 15 + 12 * Math.pow(1 - k, 2), L = 7;
    x.globalAlpha = alpha;
    for (const pass of [0, 1]) {
      x.lineWidth = pass ? 2 : 4.5; x.strokeStyle = pass ? MARK.loose : 'rgba(6,12,14,0.8)';
      x.beginPath();
      for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { x.moveTo(p.x + sx * d, p.y + sy * (d - L)); x.lineTo(p.x + sx * d, p.y + sy * d); x.lineTo(p.x + sx * (d - L), p.y + sy * d); }
      x.stroke();
    }
    if (age < 0.3) { x.globalAlpha = alpha * (1 - age / 0.3) * 0.5; x.fillStyle = MARK.loose; x.beginPath(); x.arc(p.x, p.y, d, 0, 6.3); x.fill(); }
    x.globalAlpha = 1;
  }
  // 红三角（埋着的硬物）；k 放大倍数，glow 外面一圈红光（W4 压上时）
  hazard(p, alpha, k = 1, glow = 0) {
    const x = this.ctx;
    x.save(); x.translate(p.x, p.y); x.scale(k, k);
    x.globalAlpha = alpha;
    if (glow > 0) {
      const gr = x.createRadialGradient(0, 0, 2, 0, 0, 22);
      gr.addColorStop(0, `rgba(255,90,58,${0.55 * glow})`); gr.addColorStop(1, 'rgba(255,90,58,0)');
      x.fillStyle = gr; x.beginPath(); x.arc(0, -1, 22, 0, 6.3); x.fill();
    }
    x.beginPath(); x.moveTo(0, -10); x.lineTo(9, 6); x.lineTo(-9, 6); x.closePath();
    x.lineWidth = 4; x.strokeStyle = 'rgba(6,12,14,0.85)'; x.stroke();
    x.fillStyle = MARK.hazard; x.fill();
    x.fillStyle = '#1a0a06'; x.fillRect(-1, -5, 2, 6); x.fillRect(-1, 2.5, 2, 2);
    x.restore();
  }
  // W4 压上：网口圈上朝硬物的那一点也挂一枚红三角（和圈同一层：触底面）；硬物那枚三角就在旁边时不重复画。
  // 那一点被面板挡着（网口圈落在画面下沿时常见）：挂到圈在画面上最高、没被挡的那一点
  rimHazard(cam, g, o, H, near) {
    const dx = o.x - g.aim.x, dz = o.z - g.aim.z, L = Math.hypot(dx, dz) || 1;
    const y = g.est.T + 0.06;
    let p = this.project(cam, g.aim.x + dx / L * NET_R, y, g.aim.z + dz / L * NET_R);
    if (p && p.on && near && Math.hypot(near.x - p.x, near.y + 12 - p.y) < 34) return;
    if (!p || !p.on || this.inPanel(p.x, p.y) || this.inPanel(p.x, p.y - 12)) {
      p = null;
      for (let i = 0; i < 24; i++) {
        const a = i / 24 * Math.PI * 2, q = this.project(cam, g.aim.x + Math.cos(a) * NET_R, y, g.aim.z + Math.sin(a) * NET_R);
        if (q && q.on && !this.inPanel(q.x, q.y) && !this.inPanel(q.x, q.y - 12) && (!p || q.y < p.y)) p = q;
      }
      if (!p) return;
    }
    const age = g.time - H.t;
    const s = age < 0.18 ? 0.4 + 0.85 * age / 0.18 : 1.25 - 0.2 * Math.min(1, (age - 0.18) / 0.2);
    this.hazard({ x: p.x, y: p.y - 9 }, Math.min(1, age * 8), Math.max(0.4, s));
    this.icons.push({ x: p.x, y: p.y - 9, kind: 'hazardRim' });
  }
  // W2 前方浅滩的弧：横在船头要去的路上，两头往回弯。近——细的黄虚线；再近——红、粗、两道，前后抖（约 7 下/秒）
  shoalArc(cam, s, sw, now) {
    const x = this.ctx, red = sw.level === 2, age = now - sw.lvT;
    const hx = s.hx, hz = s.hz, ang = Math.atan2(hx, hz);
    const fade = 0.4 + 0.6 * Math.min(1, age / 0.22); // 一出来就看得见，0.2 秒亮足
    // 再近：前后抖（世界里 ±0.35 米）；刚变红那一下弧张开一点再收回
    const shake = red ? 0.35 * Math.sin(age * Math.PI * 2 * 7) * (0.75 + 0.25 * Math.sin(age * 23)) : 0;
    const span = red ? 1.05 + 0.3 * Math.exp(-age * 7) : 0.85 + 0.15 * sw.k;
    const rings = red ? [[0, 6], [-1.3, 6.6]] : [[0, 6]];
    const color = red ? MARK.shoal : MARK.shoalNear;
    const pulse = red ? 1 : 0.8 + 0.2 * sw.k;
    for (const [off, r] of rings) {
      const cx = s.x + hx * (shake + off) - hx * r, cz = s.z + hz * (shake + off) - hz * r;
      const pts = [];
      for (let i = 0; i <= 40; i++) { const a = ang - span + 2 * span * i / 40; pts.push(this.project(cam, cx + Math.sin(a) * r, 0.12, cz + Math.cos(a) * r)); }
      x.globalAlpha = fade * pulse * (off ? 0.8 : 1);
      for (const pass of [0, 1]) {
        x.setLineDash(red ? [18, 7] : [9, 9]);
        x.lineWidth = pass ? (red ? 4.5 : 2.6) : (red ? 8.5 : 5.5);
        x.strokeStyle = pass ? color : 'rgba(6,12,14,0.6)';
        x.beginPath(); let pen = false;
        for (const p of pts) { if (!p) { pen = false; continue; } if (!pen) { x.moveTo(p.x, p.y); pen = true; } else x.lineTo(p.x, p.y); }
        x.stroke();
      }
    }
    x.setLineDash([]); x.globalAlpha = 1;
    const c = this.project(cam, s.x, 0.12, s.z);
    if (c) this.icons.push({ x: c.x, y: c.y, kind: 'shoal', lv: sw.level });
  }
  // W2 再近：离船头最近的那个人头上一句“浅了！”（气泡，尾巴指着他的头；1.5 秒）
  shoutBubble(cam, g) {
    const sw = g.shoalWatch; if (!sw || !sw.shouter || !sw.shouter.head) return;
    const age = g.time - sw.shoutT;
    if (age < 0.05 || age > 1.55) return;
    sw.shouter.head.getWorldPosition(_v);
    const p = this.project(cam, _v.x, _v.y + 0.5, _v.z);
    if (!p || !p.on || this.inPanel(p.x, p.y)) return;
    const x = this.ctx, a = age - 0.05;
    const k = a < 0.1 ? 0.55 + 0.6 * a / 0.1 : a < 0.2 ? 1.15 - 0.15 * (a - 0.1) / 0.1 : 1;
    const alpha = Math.min(1, (1.5 - a) / 0.3);
    this.font(24, 800);
    const t = '浅了！', w = x.measureText(t).width + 26, h = 38;
    x.save(); x.translate(p.x, p.y - 12); x.scale(k, k); x.globalAlpha = alpha;
    // 白底红边的气泡，尾巴朝下指着他
    x.beginPath(); roundRect(x, -w / 2, -h - 10, w, h, 9);
    x.fillStyle = 'rgba(0,0,0,0.45)'; x.translate(1, 2.5); x.fill(); x.translate(-1, -2.5);
    x.beginPath(); x.moveTo(-8, -11); x.lineTo(0, 0); x.lineTo(8, -11); x.closePath();
    x.fillStyle = '#fff6ea'; x.fill(); x.lineWidth = 2.5; x.strokeStyle = MARK.shoal; x.stroke();
    roundRect(x, -w / 2, -h - 10, w, h, 9); x.fillStyle = '#fff6ea'; x.fill(); x.lineWidth = 2.5; x.strokeStyle = MARK.shoal; x.stroke();
    x.fillStyle = '#fff6ea'; x.fillRect(-7, -13, 14, 4);
    x.fillStyle = '#c4271a'; x.textBaseline = 'middle'; x.textAlign = 'center'; x.fillText(t, 0, -h / 2 - 10);
    x.restore(); x.textAlign = 'left';
    this.placed.push({ x: p.x - w / 2, y: p.y - 12 - h - 10, w, h, text: t, kind: 'shout' });
  }
  // 水面上的一圈（按世界坐标投影，虚线）
  worldCircle(cam, cx, cz, r, y, color, dash, alpha = 1, a0 = 0, a1 = Math.PI * 2) {
    const x = this.ctx;
    const pts = [];
    const n = 48;
    for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; const p = this.project(cam, cx + Math.sin(a) * r, y, cz + Math.cos(a) * r); if (p) pts.push(p); else pts.push(null); }
    x.globalAlpha = alpha;
    for (const pass of [0, 1]) {
      x.setLineDash(dash ? [10, 7] : []);
      x.lineWidth = pass ? 2 : 4.5; x.strokeStyle = pass ? color : 'rgba(6,12,14,0.6)';
      x.beginPath(); let pen = false;
      for (const p of pts) { if (!p) { pen = false; continue; } if (!pen) { x.moveTo(p.x, p.y); pen = true; } else x.lineTo(p.x, p.y); }
      x.stroke();
    }
    x.setLineDash([]); x.globalAlpha = 1;
  }

  // —— 每帧 ——
  draw(g, obst, opts) {
    this.reachLeft = 3; // 每画一帧最多新算 3 件“网能不能下到它那一层”
    this.clear();
    if (!g || opts.hidden) return;
    this.obst = obst;
    const cam = g.view.camera, boat = g.boat;
    const R = g.reveal.active;
    const revealing = (R && R.phase !== 'pull') || !!g.reveal.pre; // 镜头提前走到近景的那一会儿也算
    // 1) 要等的事：计时圈加秒数挂在那件事本身上；冲洗时多一枚能加快的键（加快了圈变橙）
    for (const w of g.waits()) {
      const p = this.project(cam, w.at.x, w.at.y, w.at.z);
      if (!p || !p.on || this.inPanel(p.x, p.y)) continue;
      // 冲洗加快（B16）：按下那一刻数字从原来的秒数一下子滚到加快后的（0.28 秒），牌子放大一下再回来，外面一圈橙光扩开；再催一把时小跳一下
      const ft = w.fastT != null ? w.fastT : -1, pop = ft >= 0 && ft < 0.4 ? 1 + 0.45 * Math.pow(1 - ft / 0.4, 2) : w.pulseT < 0.25 ? 1 + 0.14 * (1 - w.pulseT / 0.25) : 1;
      const shown = ft >= 0 && ft < 0.28 && w.jump != null ? w.jump + (w.remain - w.jump) * (1 - Math.pow(1 - ft / 0.28, 3)) : w.remain;
      const lines = [{ t: `${shown.toFixed(1)} 秒`, c: w.fast ? '#ffe2bc' : '#eafff9', px: Math.round(16 * pop) }];
      const teach = w.kind === 'wash' && g.firsts && (g.firsts.teach || g.firsts.teachDue()); // 第一次揭晓（F5）：牌子下面多一行教加快，小键帽先不挂
      if (w.kind === 'wash' && !w.fast && !teach) lines.push({ t: '加快', cap: this.dev === 'pad' ? 'Ⓐ' : '空格', c: '#b9d6cf', px: 13, wt: 500 });
      else if (w.kind === 'wash' && w.fast) lines.push({ t: '加快 ×2.4', c: '#ffb45a', px: Math.round(13 * (1 + (pop - 1) * 0.6)), wt: 700 });
      const lr = this.label(p.x, p.y, lines, { ring: w.total > 0 ? 1 - w.remain / w.total : 0, color: w.fast ? '#ffb45a' : MARK.timer, kind: 'timer' });
      if (lr && teach) drawTeach(this, lr, teach, this.dev);
      if (lr && ft >= 0 && ft < 0.45) {
        const x = this.ctx, u = ft / 0.45;
        x.globalAlpha = 1 - u; x.strokeStyle = '#ffb45a'; x.lineWidth = 3 * (1 - u) + 1;
        roundRect(x, lr.x - 18 * u - 2, lr.y - 12 * u - 2, lr.w + 36 * u + 4, lr.h + 24 * u + 4, 5 + 6 * u); x.stroke();
        x.globalAlpha = 1;
      }
    }
    if (opts.modal) return;
    if (revealing) return;
    const work = g.mode === 'work';
    // 2) 出手前的预兆：前方浅水会搁浅（W2：近——细的黄虚线弧；再近——红、粗、两道、前后抖，喊话的人头上一句“浅了！”）
    if (g.shoal && g.shoalWatch && g.shoalWatch.level) this.shoalArc(cam, g.shoal, g.shoalWatch, g.time);
    this.shoutBubble(cam, g);
    // 3) 海底：看得见的松散物（网能兜）、看得见但被挡住的、埋着的硬物
    for (const r of g.world.regions.values()) {
      if (!r.group.visible || Math.abs(r.reg.cx - boat.x) > 260 || Math.abs(r.reg.cz - boat.z) > 260) continue;
      for (const it of r.items.values()) {
        if (!itemSeen(it, boat.x, boat.z)) continue;
        const p = this.project(cam, it.x, it.baseY + Math.max(0.35, it.h || 0.3) + 0.25, it.z);
        if (!p || !p.on || this.inPanel(p.x, p.y)) continue;
        const d = Math.hypot(it.x - boat.x, it.z - boat.z);
        const blocked = this.blocked(g, it);
        if (blocked == null) continue; // 这一帧还没轮到算（每帧只算几件，免得一下子卡一帧）
        const alpha = clamp(1.15 - d / 55, 0.45, 1) * clamp(1.2 - Math.max(0, -it.baseY) / 28, 0.45, 1); // 远了、深了都淡一些
        this.diamond(p, blocked ? MARK.blocked : MARK.loose, alpha, blocked);
        this.icons.push({ x: p.x, y: p.y, kind: blocked ? 'blocked' : 'loose', id: it.id });
        // 移动落点时整件进了网口、网兜得到它：菱形外面套一个角框（进来的那一下从外面收进来）（B3）
        const tin = work && !blocked && g.findFx ? g.findFx.inNet.get(it.id) : null;
        if (tin != null) this.netCorners(p, g.time - tin, alpha);
      }
      for (const o of r.obstacles || []) {
        const gy = g.world.surfaceTop(o.x, o.z);
        const range = clamp(50 - Math.max(0, -gy) * 1.25, 15, 50);
        if (Math.hypot(o.x - boat.x, o.z - boat.z) > range) continue;
        const p = this.project(cam, o.x, gy + 0.9, o.z);
        if (!p || !p.on || this.inPanel(p.x, p.y)) { if (work && g.est && g.hazAim && g.hazAim.o === o && g.hazAim.level === 2) this.rimHazard(cam, g, o, g.hazAim, null); continue; }
        // W4：网口靠近、压上它时，三角跳一下（压上那一下跳得高、放大再落回，之后慢慢一胀一缩）
        const H = g.hazAim && g.hazAim.o === o && g.hazAim.level ? g.hazAim : null;
        const hop = H ? hazardHop(H.level, g.time - H.t) : null;
        if (hop) { p.y -= hop.y; this.hazard(p, 1, hop.s, hop.glow); }
        else this.hazard(p, 0.95);
        this.icons.push({ x: p.x, y: p.y, kind: 'hazard', lv: H ? H.level : 0, s: hop ? hop.s : 1 });
        if (H && H.level === 2 && work && g.est) this.rimHazard(cam, g, o, H, p);
      }
    }
    // 开局的指向虚线：从船头指向红浮标（G4，src/game/guide.js）
    if (g.guide && !work) g.guide.draw(this, cam);
    // 4) 刚发现的地点：水面上亮一圈（远处的只给位置），线索链再画一条指向虚线；不在画面里就在屏幕边上给一个箭头；
    //    生物刚翻出东西的地方也亮一圈（作业时也画）
    this.pings(g, cam, work);
  }
  // 刚发现的地点（第八批 B1、C1、C2）：
  //   看清一处现场：水面上三道涟漪从正中扩开，最后一道停在现场边上成为轮廓；正中亮一下；名字从那里浮起来（B1）
  //   线索：起点一圈涟漪，虚线从起点一路描到它指的地方，虚线朝那边流（B1）
  //   远处更深的残骸：虚线小圈弹出来，之后一下一下往外推声呐波纹（招手）；不在画面里时边上的指向牌大一号、深海蓝、一下一下往外探（C1）
  //   蟹翻出东西：沙色的小涟漪圈住那件东西（不在画面里时边上的沙色指向牌弹一下）（C2）
  pings(g, cam, work) {
    for (const p of g.pings || []) {
      const age = g.time - p.t;
      const life = p.life || 7; // 第一次发现（F2）挂得久一点
      if (age > life || (work && !p.dig)) continue; // 作业时只亮生物刚翻出东西的那一圈
      const alpha = Math.min(1, age * 3) * (1 - Math.max(0, age - (life - 2)) / 2);
      const far = p.stage === 'far', color = p.dig ? MARK.dig : far ? MARK.far : MARK.find;
      const c = this.project(cam, p.x, p.y ?? 0.2, p.z); // 生物翻出的东西：圈画在海底那一层（围住蟹和那件东西），不是水面上
      if (c && c.on && !this.inPanel(c.x, c.y)) {
        if (p.guide) this.worldArrow(cam, p.x, p.z, p.to[0], p.to[1], MARK.find, alpha);
        else if (p.to) this.clueLine(cam, p, age, alpha);
        else if (far) this.farMark(cam, p, age, alpha);
        else this.ripples(cam, p, age, alpha, color);
        if (p.label && !p.said) this.floatName(c, p.label, age, !!p.first);
        this.icons.push({ x: c.x, y: c.y, kind: 'ping', stage: p.stage, dig: !!p.dig });
      } else this.edgeArrow(cam, p.x, p.z, color, alpha, { age, far, dig: !!p.dig });
    }
  }
  // 水面上的一圈：自己定粗细、虚实、外面一层同色的光（涟漪、轮廓、声呐波纹都用它）
  ring(cam, cx, cz, r, color, alpha, lw = 2, dash = null, glow = 0, y = 0.2) {
    if (alpha <= 0.01 || r <= 0.05) return;
    const x = this.ctx, pts = [];
    for (let i = 0; i <= 48; i++) { const a = i / 48 * Math.PI * 2; pts.push(this.project(cam, cx + Math.sin(a) * r, y, cz + Math.cos(a) * r)); }
    const path = () => { x.beginPath(); let pen = false; for (const p of pts) { if (!p) { pen = false; continue; } if (!pen) { x.moveTo(p.x, p.y); pen = true; } else x.lineTo(p.x, p.y); } };
    x.setLineDash(dash || []);
    if (glow) { path(); x.globalAlpha = clamp(alpha * 0.22, 0, 1); x.lineWidth = lw + glow; x.strokeStyle = color; x.stroke(); }
    x.globalAlpha = clamp(alpha, 0, 1);
    path(); x.lineWidth = lw + 2.4; x.strokeStyle = 'rgba(6,12,14,0.45)'; x.stroke();
    path(); x.lineWidth = lw; x.strokeStyle = color; x.stroke();
    x.setLineDash([]); x.globalAlpha = 1;
  }
  // 三道涟漪从正中扩开（前两道扩过边、淡掉；第三道停在边上成为轮廓，之后轻轻地呼吸），正中亮一下
  ripples(cam, p, age, alpha, color) {
    // 第一次发现（F2）：浪推得远一号（1.35 倍）、多一道，浪尖的光更宽；停下来的那一道照样描在现场边上
    const F = p.first ? 1 : 0, N = 3 + F;
    const R = p.dig ? (p.r || 2.6) : Math.max(6, p.r || 8), RW = R * (1 + 0.35 * F), D = (p.dig ? 0.9 : 1.5) * (1 + 0.25 * F), Y = p.y ?? 0.2;
    for (let i = 0; i < N; i++) {
      const tt = age - i * 0.22;
      if (tt <= 0) continue;
      const k = Math.min(1, tt / D), e = 1 - Math.pow(1 - k, 3);
      if (i < N - 1) {
        // 一道浪：亮的浪尖，里面跟着一道淡的
        if (k < 1) { const rr = RW * (0.08 + 1.22 * e), a = alpha * Math.pow(1 - k, 1.4); this.ring(cam, p.x, p.z, rr, color, a * 0.95, (1.4 + 2.4 * (1 - k)) * (1 + 0.4 * F), null, 7 * (1 - k) * (1 + F), Y); this.ring(cam, p.x, p.z, rr * 0.9, color, a * 0.35, 1, null, 0, Y); }
      } else {
        const settle = Math.max(0, tt - D), breath = settle > 0 ? 0.82 + 0.18 * Math.cos(settle * 2.4) : 1;
        this.ring(cam, p.x, p.z, R * (0.08 + 0.92 * e), color, alpha * breath, settle > 0 ? 2 : 2 + 1.5 * (1 - k), null, settle > 0 ? 0 : 7 * (1 - k), Y);
      }
    }
    if (age < 0.5 * (1 + F)) {
      const c = this.project(cam, p.x, Y, p.z); if (!c) return;
      const k = age / (0.5 * (1 + F)), x = this.ctx;
      x.globalAlpha = (1 - k) * 0.9; x.fillStyle = color;
      x.beginPath(); x.arc(c.x, c.y, 3 + 16 * (1 + F) * Math.sqrt(k), 0, 6.3); x.fill();
      x.globalAlpha = 1; x.fillStyle = '#ffffff'; x.beginPath(); x.arc(c.x, c.y, 2.5 * (1 - k) + 0.5, 0, 6.3); x.fill();
    }
  }
  // 名字从涟漪正中浮起来：0.9 秒升到上方，字距从宽收紧；一根细线连着水面上那一点；3.4 秒淡掉
  // 第一次发现（F2）：字大一号、带一圈光，挂 5.6 秒
  floatName(c, label, age, first = false) {
    const life = first ? 5.6 : 3.6;
    if (age > life) return;
    const x = this.ctx, k = Math.min(1, age / 0.9), e = 1 - Math.pow(1 - k, 3);
    const a = Math.min(1, age / 0.35) * (1 - clamp((age - life + 0.9) / 0.9, 0, 1));
    const y = c.y - 18 - 54 * e;
    if (this.inPanel(c.x, y)) return;
    x.globalAlpha = a * 0.6; x.strokeStyle = MARK.find; x.lineWidth = 1.4;
    x.beginPath(); x.moveTo(c.x, c.y - 4); x.lineTo(c.x, y + 6); x.stroke();
    this.font(first ? 34 : 28, 800);
    if ('letterSpacing' in x) x.letterSpacing = (2 + 10 * (1 - e)).toFixed(1) + 'px';
    const w = x.measureText(label).width, tx = clamp(c.x - w / 2, EDGE, W - EDGE - w);
    x.textBaseline = 'bottom'; x.globalAlpha = a;
    x.lineWidth = 5.5; x.strokeStyle = 'rgba(4,12,16,0.85)'; x.lineJoin = 'round'; x.strokeText(label, tx, y);
    if (first) { x.shadowColor = MARK.find; x.shadowBlur = 10 + 14 * (1 - k) + 4 * Math.sin(age * 3); }
    x.fillStyle = '#eef9fb'; x.fillText(label, tx, y);
    x.shadowBlur = 0;
    if ('letterSpacing' in x) x.letterSpacing = '0px';
    x.globalAlpha = 1;
    this.icons.push({ x: c.x, y, kind: 'siteName', text: label });
  }
  // 线索：起点一圈涟漪，虚线 1 秒里从起点描到它指的地方，箭头到了弹一下；之后虚线朝那边流
  clueLine(cam, p, age, alpha) {
    const F = p.first ? 1 : 0; // 第一次发现线索（F2）：起点的圈大一号、多一道
    for (let i = 0; i < 2 + F; i++) { const tt = age - i * 0.2, k = Math.min(1, Math.max(0, tt) / (1.2 + 0.4 * F)); if (tt > 0 && k < 1) this.ring(cam, p.x, p.z, 1 + (7 + 4 * F) * (1 - Math.pow(1 - k, 3)), MARK.find, alpha * (1 - k), (1.4 + 2 * (1 - k)) * (1 + 0.4 * F), null, 5 * (1 - k) * (1 + F)); }
    const k = clamp((age - 0.1) / 1.0, 0, 1), e = 1 - Math.pow(1 - k, 2);
    if (k <= 0) return;
    const ha = clamp((age - 1.1) / 0.25, 0, 1);
    this.worldArrow(cam, p.x, p.z, p.to[0], p.to[1], MARK.find, alpha, { k: e, flow: age * 26, head: k < 1 ? 0 : 1 + 0.45 * (1 - ha) * Math.sin(ha * Math.PI) * 2 });
  }
  // 远处更深的残骸（画面里）：虚线小圈弹出来，一下一下往外推声呐波纹
  farMark(cam, p, age, alpha) {
    const k = Math.min(1, age / 0.4), back = 1 + 2.2 * Math.pow(k - 1, 3) + 1.2 * Math.pow(k - 1, 2); // 弹出来（略冲过头）
    this.ring(cam, p.x, p.z, 9 * back, MARK.far, alpha, age < 0.6 ? 3 : 2, [10, 7], age < 0.8 ? 9 * (1 - age / 0.8) : 0);
    for (let n = 0; n < 6; n++) {
      const tt = age - 0.25 - n * 1.1;
      if (tt <= 0 || tt > 1.05) continue;
      const q = tt / 1.05;
      this.ring(cam, p.x, p.z, 9 + 13 * (1 - Math.pow(1 - q, 2)), MARK.far, alpha * (1 - q) * 0.8, 1.6, null, 4 * (1 - q));
    }
  }
  // 水面上的一条指向虚线（线索链往哪边去）；o.k 只描到这一段、o.flow 虚线往前流、o.head 箭头大小（0 不画）
  worldArrow(cam, ax, az, bx, bz, color, alpha, o = {}) {
    const K = o.k == null ? 1 : o.k;
    const x = this.ctx, n = 16, pts = [];
    for (let i = 0; i <= n; i++) { const t = i / n * K; const p = this.project(cam, ax + (bx - ax) * t, 0.2, az + (bz - az) * t); if (p) pts.push(p); }
    if (pts.length < 3) return;
    x.globalAlpha = alpha;
    for (const pass of [0, 1]) {
      x.setLineDash([12, 8]); x.lineDashOffset = -(o.flow || 0); x.lineWidth = pass ? 2.2 : 5; x.strokeStyle = pass ? color : 'rgba(6,12,14,0.6)';
      x.beginPath(); pts.forEach((p, i) => (i ? x.lineTo(p.x, p.y) : x.moveTo(p.x, p.y))); x.stroke();
    }
    x.setLineDash([]); x.lineDashOffset = 0;
    const hs = o.head == null ? 1 : o.head;
    if (hs > 0) {
      const e = pts[pts.length - 1], q = pts[pts.length - 2];
      const a = Math.atan2(e.y - q.y, e.x - q.x);
      x.beginPath(); x.moveTo(e.x + Math.cos(a) * 12 * hs, e.y + Math.sin(a) * 12 * hs); x.lineTo(e.x + Math.cos(a + 2.5) * 11 * hs, e.y + Math.sin(a + 2.5) * 11 * hs); x.lineTo(e.x + Math.cos(a - 2.5) * 11 * hs, e.y + Math.sin(a - 2.5) * 11 * hs); x.closePath();
      x.lineWidth = 4; x.strokeStyle = 'rgba(6,12,14,0.7)'; x.stroke(); x.fillStyle = color; x.fill();
    }
    x.globalAlpha = 1;
  }
  // 不在画面里：在屏幕边上画一个指向它的牌子（按镜头朝向算方位）。出现时从大弹回来、外面亮一圈；
  // 远处的（C1）大一号、深海蓝，之后每 1.1 秒朝外探一下、推出一道声呐弧——在招手
  edgeArrow(cam, wx, wz, color, alpha, o = {}) {
    cam.getWorldDirection(_v); const fx = _v.x, fz = _v.z, fl = Math.hypot(fx, fz) || 1;
    const dx = wx - cam.position.x, dz = wz - cam.position.z;
    const f = (dx * fx + dz * fz) / fl, r = (-dx * fz + dz * fx) / fl;
    const a = Math.atan2(r, f); // 0 = 镜头正前方（画面上方），正 = 右
    const cx = W / 2, cy = H / 2, rx = W / 2 - 70, ry = H / 2 - 90;
    // 沿着从屏幕中心指过去的方向，找一个不压面板的位置；都压着就不画（提示里已经写了方向）
    let px = 0, py = 0, ok = false;
    for (let k = 1; k >= 0.55 && !ok; k -= 0.09) { px = cx + Math.sin(a) * rx * k; py = cy - Math.cos(a) * ry * k; ok = !this.inPanel(px, py) && !this.inPanel(px, py - 22) && !this.inPanel(px - 14, py + 6) && !this.inPanel(px + 14, py + 6); }
    if (!ok) return;
    const age = o.age ?? 9, base = o.far ? 1.6 : o.dig ? 1.2 : 1;
    const pk = Math.min(1, age / 0.35), pop = 1 + 0.8 * Math.pow(1 - pk, 2);
    // 招手：每 1.1 秒朝外探一下（远处的才有）
    const ph = o.far && age > 0.5 ? ((age - 0.5) % 1.1) / 1.1 : 1, reach = ph < 0.3 ? Math.sin(ph / 0.3 * Math.PI) * 8 : 0;
    const s = base * pop;
    const x = this.ctx;
    x.save(); x.translate(px + Math.sin(a) * reach, py - Math.cos(a) * reach); x.rotate(a);
    // 出现时外面亮一圈
    if (age < 0.6) { const q = age / 0.6; x.globalAlpha = alpha * (1 - q) * 0.9; x.strokeStyle = color; x.lineWidth = 3 * (1 - q) + 1; x.beginPath(); x.arc(0, -2, 14 + 34 * q, 0, 6.3); x.stroke(); }
    // 声呐弧：从尖角往外推
    if (o.far && age > 0.5) for (const lag of [0, 0.16]) {
      const q = (ph - lag) / 0.7;
      if (q <= 0 || q >= 1) continue;
      const rr = 22 * s + 34 * q;
      for (const pass of [0, 1]) { x.globalAlpha = alpha * (1 - q) * (pass ? 0.9 : 0.5); x.strokeStyle = pass ? color : 'rgba(6,12,14,0.8)'; x.lineWidth = pass ? 2.5 : 5; x.beginPath(); x.arc(0, 0, rr, -Math.PI / 2 - 0.62, -Math.PI / 2 + 0.62); x.stroke(); }
    }
    x.globalAlpha = alpha;
    x.scale(s, s);
    // 一枚深色小圆牌垫底（亮水面上也看得见），描一圈同色的边
    x.fillStyle = 'rgba(5,14,20,0.72)'; x.beginPath(); x.arc(0, 0, 19, 0, 6.3); x.fill();
    x.globalAlpha = alpha * 0.8; x.strokeStyle = color; x.lineWidth = 1.5; x.beginPath(); x.arc(0, 0, 19, 0, 6.3); x.stroke();
    x.globalAlpha = alpha;
    // 和水面上那一圈同一个样子（虚线小圈），外面加一个朝它的尖角——不像鼠标箭头
    for (const pass of [0, 1]) {
      x.setLineDash([5, 4]); x.lineWidth = pass ? 2 : 4.5; x.strokeStyle = pass ? color : 'rgba(6,12,14,0.7)';
      x.beginPath(); x.ellipse(0, 5, 11, 6, 0, 0, Math.PI * 2); x.stroke();
    }
    x.setLineDash([]);
    x.beginPath(); x.moveTo(0, -27); x.lineTo(8.5, -11); x.lineTo(-8.5, -11); x.closePath();
    x.lineWidth = 4; x.strokeStyle = 'rgba(6,12,14,0.8)'; x.stroke(); x.fillStyle = color; x.fill();
    x.restore();
    x.globalAlpha = 1;
    this.icons.push({ x: px, y: py, kind: 'pingEdge', far: !!o.far, dig: !!o.dig, s: +s.toFixed(2) });
  }
  // 网能不能从正上方下到它那一层：在能把它整件罩进网口的那些网口位置里找，有一处够得着就算能（和闭网判定同一个网口足迹）；
  // 物件不动就只算一次；每帧最多算 3 件新的
  blocked(g, it) {
    const key = it.id + ':' + it.x.toFixed(1) + ',' + it.z.toFixed(1) + ',' + it.baseY.toFixed(1);
    const c = this.reach.get(it.id);
    if (c && c.key === key) return c.v;
    if (this.reachLeft <= 0) return c ? c.v : null;
    this.reachLeft--;
    const slack = Math.max(0, NET_R - (it.r || 0.3) * 0.85 - 0.05);
    let v = true;
    for (const [ox, oz] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1], [0.7, 0.7], [-0.7, 0.7], [0.7, -0.7], [-0.7, -0.7], [0.5, 0], [-0.5, 0], [0, 0.5], [0, -0.5]]) {
      if (footprintTop(g.world, it.x + ox * slack, it.z + oz * slack) - it.baseY <= BAG_DROP + 0.05) { v = false; break; }
    }
    this.reach.set(it.id, { key, v });
    return v;
  }
}

// W4 三角跳一下：靠近——小跳、大一点；压上——高高跳起、放大再落回，之后一胀一缩
function hazardHop(lv, age) {
  if (lv === 1) {
    const y = age < 0.32 ? 7 * Math.sin(age / 0.32 * Math.PI) : 0;
    return { y, s: 1.18, glow: 0 };
  }
  const y = age < 0.36 ? 16 * Math.sin(age / 0.36 * Math.PI) : age < 0.56 ? 4 * Math.sin((age - 0.36) / 0.2 * Math.PI) : 0;
  const s = age < 0.12 ? 1.18 + 0.5 * age / 0.12 : age < 0.45 ? 1.68 - 0.33 * (age - 0.12) / 0.33 : 1.35 + 0.07 * Math.sin((age - 0.45) * 6);
  return { y, s, glow: age < 0.45 ? 1 : 0.55 + 0.25 * Math.sin((age - 0.45) * 6) };
}

function roundRect(x, X, Y, w, h, r) { x.beginPath(); x.moveTo(X + r, Y); x.arcTo(X + w, Y, X + w, Y + h, r); x.arcTo(X + w, Y + h, X, Y + h, r); x.arcTo(X, Y + h, X, Y, r); x.arcTo(X, Y, X + w, Y, r); x.closePath(); }

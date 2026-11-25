// 第一次的短字（第十三批：F7 被拒、F8 搁浅、F9 空网）：一张小牌挂在出事的地方——
// 世界里的一点（每帧投影到画面上，跟着走）或界面上的一块（按它现在排在哪）。
// 出来、停住、淡掉全按游戏时间算（慢放、暂停跟着走），不靠 CSS 动画；只管摆，说什么、什么时候说由 game/lessons.js 定。
import * as THREE from 'three';

const W = 1920, H = 1080, EDGE = 18;
const _v = new THREE.Vector3();
const ease = (u) => 1 - (1 - u) * (1 - u);
// 冲出来：先大一点、再落到原大，带一点回弹
const popK = (t, from) => (t < 0.12 ? from + (1.06 - from) * ease(t / 0.12) : t < 0.24 ? 1.06 - 0.06 * ease((t - 0.12) / 0.12) : 1);

export class Notes {
  constructor(root) {
    this.root = root;
    this.el = document.createElement('div');
    this.el.className = 'notes';
    root.appendChild(this.el);
    this.list = [];
    this.avoid = null; // () => 界面面板的矩形（舞台坐标）：挂着 avoid 的牌子压到它们时挪开
  }
  // at(): 返回 { x, y }（舞台坐标，1920×1080）或 null（这一帧看不见）
  // minY：牌子最高摆到哪（让开顶上的面板）
  // tick(n, a)：每帧摆好以后再调一下（要自己再动点什么的，比如 F10 名字的字距）
  // place：'above' 牌子在点的上方、尾巴朝下指着它；'below' 在下方、尾巴朝上；'left' 在左边、尾巴朝右；'free' 就摆在那一点上、不带尾巴
  add({ cls = '', html, at, life = 2.6, place = 'above', gap = 16, from = 0.6, shakeAt = -1, tick = null, minY = EDGE, avoid = false }) {
    const el = document.createElement('div');
    el.className = 'note ' + cls + ' ' + place;
    el.innerHTML = `<div class="nb">${html}</div>`;
    el.style.opacity = '0';
    this.el.appendChild(el);
    const n = { el, at, life, place, gap, from, t: 0, shakeAt, tick, minY, avoid, w: el.offsetWidth, h: el.offsetHeight };
    this.list.push(n);
    this.layout(n);
    return n;
  }
  clear() { for (const n of this.list) n.el.remove(); this.list = []; }
  update(dt) {
    for (const n of this.list) { n.t += dt; this.layout(n); }
    const dead = this.list.filter((n) => n.t >= n.life);
    if (dead.length) { for (const n of dead) n.el.remove(); this.list = this.list.filter((n) => n.t < n.life); }
  }
  layout(n) {
    const p = n.t >= 0 && n.at && n.at();
    if (!p) { n.el.style.opacity = '0'; return; }
    const t = n.t, k = popK(t, n.from);
    const a = Math.min(1, t / 0.08) * Math.min(1, (n.life - t) / 0.35);
    let x = p.x, y = p.y;
    const w = n.w, h = n.h;
    // 牌子的左上角（按原大算，缩放绕尾巴尖）
    let L, T, ox, oy;
    if (n.place === 'below') { L = x - w / 2; T = y + n.gap; ox = w / 2; oy = 0; }
    else if (n.place === 'left') { L = x - w - n.gap; T = y - h / 2; ox = w; oy = h / 2; }
    else if (n.place === 'free') { L = x - w / 2; T = y - h / 2; ox = w / 2; oy = h / 2; }
    else { L = x - w / 2; T = y - h - n.gap; ox = w / 2; oy = h; }
    // 别出画：贴边挪进来（尾巴还是指着原来那一点，所以只挪牌子、尾巴跟着画在 --tx 处）
    let L2 = Math.max(EDGE, Math.min(W - EDGE - w, L)), T2 = Math.max(n.minY, Math.min(H - EDGE - h, T));
    // 压到界面面板（结果卡、油表……）：先往左让、再往右让（尾巴还指着原来那一点，贴在牌子边上）
    if (n.avoid && this.avoid) {
      const obst = this.avoid() || [], hit = (x0) => obst.find((o) => x0 < o.x + o.w + 8 && x0 + w > o.x - 8 && T2 < o.y + o.h + 8 && T2 + h > o.y - 8);
      const o = hit(L2);
      if (o) { const a = o.x - 8 - w, b = o.x + o.w + 8; if (a >= EDGE && !hit(a)) L2 = a; else if (b + w <= W - EDGE && !hit(b)) L2 = b; }
    }
    // 抖一下（被拒的那一下：和按钮、油表的抖同一拍）
    let sx = 0;
    if (n.shakeAt >= 0 && t > n.shakeAt && t < n.shakeAt + 0.3) { const u = (t - n.shakeAt) / 0.3; sx = Math.sin(u * Math.PI * 6) * 6 * (1 - u); }
    n.el.style.transform = `translate(${(L2 + sx).toFixed(1)}px,${T2.toFixed(1)}px) scale(${k.toFixed(3)})`;
    n.el.style.transformOrigin = `${(ox + (L - L2)).toFixed(1)}px ${(oy + (T - T2)).toFixed(1)}px`;
    n.el.style.setProperty('--tx', (ox + (L - L2)).toFixed(1) + 'px');
    n.el.style.setProperty('--ty', (oy + (T - T2)).toFixed(1) + 'px');
    n.el.style.opacity = a.toFixed(3);
    if (n.tick) n.tick(n, a);
  }
}

// 世界坐标 → 舞台坐标；在镜头后面或出了画面返回 null
export function stageOf(cam, x, y, z, margin = 0.05) {
  _v.set(x, y, z).project(cam);
  if (!(_v.z > -1 && _v.z < 1) || Math.abs(_v.x) > 1 + margin || Math.abs(_v.y) > 1 + margin) return null;
  return { x: (_v.x + 1) / 2 * W, y: (1 - _v.y) / 2 * H };
}

import { mulberry32 } from '../util/math.js';

// 债本还清那一页的背面：下一片海的画（锈钟峡）。一道窄峡从上往下看，几十条不同年代的沉船叠着躺，偏蓝，
// 每一条的船头都朝着同一个方向（和沙湾那一条一样朝着岸）。72×48 格的像素画，屏幕上整格放大。
// 临时的：代码画的，回本机换 Codex 出的那一张（notes.md「要回本机做的」）。
const HULLS = [
  // 木帆船（几种木色）、铁壳（锈红）、钢壳（灰）：看得出不是同一个年代的
  ['#6b4a2b', '#3a2616'], ['#7d5a36', '#432c18'], ['#5c4026', '#2e1f12'],
  ['#7a3e24', '#3e1e10'], ['#8a4a2a', '#45220f'],
  ['#5d6a70', '#2c3438'], ['#4f5c62', '#262e32'],
];

export function drawStrait(cv) {
  const c = cv.getContext('2d'), W = cv.width, H = cv.height;
  const R = mulberry32(4127);
  // 水：上浅下深，偏蓝
  for (let y = 0; y < H; y++) {
    const k = y / H;
    c.fillStyle = `rgb(${Math.round(34 - 20 * k)},${Math.round(96 - 52 * k)},${Math.round(122 - 60 * k)})`;
    c.fillRect(0, y, W, 1);
  }
  // 峡谷两边的石壁：中间一道窄的水道
  const left = (y) => 15 + Math.round(4 * Math.sin(y * 0.21) + 2 * Math.sin(y * 0.57 + 1));
  const right = (y) => W - 15 + Math.round(4 * Math.sin(y * 0.17 + 2) + 2 * Math.sin(y * 0.61));
  for (let y = 0; y < H; y++) {
    const l = left(y), r = right(y);
    c.fillStyle = '#16262c';
    c.fillRect(0, y, l, 1);
    c.fillRect(r, y, W - r, 1);
    // 石壁的边亮一格
    c.fillStyle = '#2e4a52';
    c.fillRect(l - 1, y, 1, 1);
    c.fillRect(r, y, 1, 1);
  }
  // 沉船：船头都朝上（同一个方向），一条压着一条
  const ships = [];
  for (let i = 0; i < 34; i++) {
    const y = 3 + R() * (H - 4);
    const l = left(Math.round(y)) + 2, r = right(Math.round(y)) - 2;
    const L = 5 + Math.floor(R() * 8), w = 2 + Math.floor(R() * 2);
    ships.push({ x: l + R() * Math.max(1, r - l - w), y, L, w, col: HULLS[Math.floor(R() * HULLS.length)], mast: R() < 0.5 });
  }
  ships.sort((a, b) => a.y - b.y);
  for (const s of ships) {
    const x0 = Math.round(s.x), y0 = Math.round(s.y - s.L / 2);
    for (let t = 0; t < s.L; t++) {
      // 船头那一截收尖
      const ww = t < 2 ? Math.max(1, s.w - 2 + t) : s.w;
      const xo = x0 + Math.floor((s.w - ww) / 2);
      c.fillStyle = s.col[1];
      c.fillRect(xo - 1, y0 + t, ww + 2, 1);
      c.fillStyle = s.col[0];
      c.fillRect(xo, y0 + t, ww, 1);
    }
    c.fillStyle = s.col[1];
    c.fillRect(x0 - 1, y0 - 1, s.w + 2, 1);
    // 断桅：一道斜线
    if (s.mast) {
      c.fillStyle = '#2a1a10';
      for (let k = 0; k < 4; k++) c.fillRect(x0 + Math.floor(s.w / 2) + k, y0 + Math.floor(s.L / 2) - k, 1, 1);
    }
  }
  // 整张蒙一层蓝，越深越暗
  c.fillStyle = 'rgba(20,70,110,0.32)';
  c.fillRect(0, 0, W, H);
  // 水面的几道亮纹
  c.fillStyle = 'rgba(200,240,255,0.22)';
  for (let i = 0; i < 9; i++) c.fillRect(Math.floor(R() * W), Math.floor(R() * H * 0.5), 3 + Math.floor(R() * 4), 1);
}

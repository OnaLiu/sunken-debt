// 界面上的像素圆：进度圈、下网预告的圈、入舱章。和铜铁面板一套：按场景的像素大小（3 屏幕像素一格）一格一格画，
// 黑描边、铜（铁）身、上左受光下右背光；屏幕上一律按整 3 倍摆，像素粗细和别处一样。

function canvas(w, h) {
  const cv = document.createElement('canvas');
  cv.width = w;
  cv.height = h;
  return cv;
}
function hex(c) {
  const n = parseInt(c.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function put(D, W, x, y, col, a = 1) {
  if (!col) return;
  const i = (y * W + x) * 4, [r, g, b] = hex(col);
  D[i] = r; D[i + 1] = g; D[i + 2] = b; D[i + 3] = Math.round(255 * a);
}
// 光从左上来：法线朝左上为正
const litOf = (dx, dy, r) => -(dx + dy) / (r * Math.SQRT2 || 1);
// 每格自己的小随机（印泥的斑驳），同一格每次都一样
const hash = (x, y, s = 0) => {
  let h = Math.imul(x * 374761393 + y * 668265263 + s * 2246822519, 3266489917) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};

// —— 下网预告的圈 ——
// kind：yes 金圈（铜）、no 灰圈（铁、虚线）、hard 橙圈（锈、虚线）、near 淡圈。n：直径几格
const MARK = {
  yes: { o: '#2a1806', oa: 0.85, ia: 0.6, mid: '#ffd36a', hi: '#fff2c0', lo: '#d29a36', mid2: '#f0bd52', hi2: '#fff2c0', lo2: '#b9822a', a: 1 },
  no: { o: '#04090b', oa: 0.5, ia: 0.4, mid: '#e2ecea', hi: '#ffffff', lo: '#a9bab8', mid2: '#c8d6d4', hi2: '#f4fbfa', lo2: '#8fa3a1', a: 0.88, dash: true },
  hard: { o: '#2a1206', oa: 0.6, ia: 0.45, mid: '#ff9a4a', hi: '#ffc88a', lo: '#d0702a', mid2: '#f28a3a', hi2: '#ffc88a', lo2: '#b85c20', a: 1, dash: true },
  near: { o: '#04090b', oa: 0.22, mid: '#e8f4f0', hi: '#e8f4f0', lo: '#e8f4f0', a: 0.5, thin: true },
};
const markCache = new Map();
export function markSprite(kind, n) {
  const key = kind + n;
  let cv = markCache.get(key);
  if (cv) return cv;
  const P = MARK[kind];
  cv = canvas(n, n);
  const c = cv.getContext('2d'), im = c.createImageData(n, n), D = im.data;
  const R = n / 2;
  const body = P.thin ? 1 : kind === 'yes' || n >= 12 ? 2 : 1;
  // 虚线：一圈分成整数段（每段六格左右），每段亮七成、空三成，段和段一样长
  const segs = Math.max(6, Math.round((2 * Math.PI * (R - 1.5)) / 6));
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      const dx = x + 0.5 - R, dy = y + 0.5 - R, r = Math.hypot(dx, dy), band = R - r;
      if (band < 0) continue;
      if (P.dash) {
        const f = ((Math.atan2(dy, dx) / (2 * Math.PI) + 1) * segs) % 1;
        if (f > 0.7) continue;
      }
      const lit = litOf(dx, dy, r);
      if (band < 1) put(D, n, x, y, P.o, P.oa * P.a);
      else if (band < 1 + body) {
        // 外一道朝外：上左亮下右暗；里一道朝里：反过来
        const outer = band < 2 || body === 1;
        const col = outer ? (lit > 0.45 ? P.hi : lit < -0.45 ? P.lo : P.mid) : (lit < -0.45 ? P.hi2 : lit > 0.45 ? P.lo2 : P.mid2);
        put(D, n, x, y, col, P.a);
      } else if (band < 2 + body && !P.thin && !P.dash) put(D, n, x, y, P.o, P.ia * P.a);
    }
  }
  c.putImageData(im, 0, 0);
  markCache.set(key, cv);
  return cv;
}

// 灰圈上的红牌打叉、橙圈上的锈牌「!」：11 格的小圆牌（屏幕上 33 像素），黑边、上左亮下右暗
const BD = 11;
const X_PAL = { o: '#2a0e08', h: '#ffc4ae', g: '#ff8a6a', c: '#cf5e48' };
const W_PAL = { o: '#2a1206', h: '#ffc88a', g: '#ff9a4a', c: '#c8642a' };
// 叉：先左上到右下一笔，再右上到左下一笔（strokes：画到第几格，0—9）
const X_PIX = [[3, 3], [4, 4], [5, 5], [6, 6], [7, 7], [7, 3], [6, 4], [4, 6], [3, 7]];
const BANG = [[5, 2], [5, 3], [5, 4], [5, 5], [5, 7]];
function disc(c, x0, y0, pal) {
  const R = BD / 2;
  for (let y = 0; y < BD; y++) {
    for (let x = 0; x < BD; x++) {
      const dx = x + 0.5 - R, dy = y + 0.5 - R, r = Math.hypot(dx, dy), band = R - r;
      if (band < 0) continue;
      const lit = litOf(dx, dy, r);
      c.fillStyle = band < 1 ? pal.o : band < 2.2 && lit > 0.35 ? pal.h : band < 2.2 && lit < -0.35 ? pal.c : pal.g;
      c.fillRect(x0 + x, y0 + y, 1, 1);
    }
  }
}
export function drawXBadge(c, x0, y0, strokes = 9) {
  disc(c, x0, y0, X_PAL);
  c.fillStyle = '#2a0e08';
  for (let i = 0; i < Math.min(strokes, 9); i++) c.fillRect(x0 + X_PIX[i][0], y0 + X_PIX[i][1], 1, 1);
}
export function drawWarnBadge(c, x0, y0) {
  disc(c, x0, y0, W_PAL);
  c.fillStyle = '#10181b';
  for (const [x, y] of BANG) c.fillRect(x0 + x, y0 + y, 1, 1);
}

// —— 进度圈：铜边小表盘（28×28 格，屏幕上 84 像素）——
// 外黑边、铜圈（上左亮、下右暗）、黑沟、刻度槽（12 道刻度），走过的格子一格一格亮起来，走在最前面那几格最亮
export const PROG_N = 28;
let progCells = null;
function progLayout() {
  if (progCells) return progCells;
  const N = PROG_N, R = N / 2;
  progCells = [];
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const dx = x + 0.5 - R, dy = y + 0.5 - R, r = Math.hypot(dx, dy);
      if (r >= 13.6) continue;
      // 从十二点钟方向顺时针转了多少（0—1）
      const a = ((Math.atan2(dx, -dy) / (2 * Math.PI)) + 1) % 1;
      const lit = litOf(dx, dy, r);
      const tick = Math.abs(((a * 12 + 0.5) % 1) - 0.5) < 0.12;
      const zone = r >= 12.6 ? 'o' : r >= 11.0 ? 'rim' : r >= 10.0 ? 'o' : r >= 6.6 ? 'trk' : r >= 5.8 ? 'in' : 'disc';
      progCells.push({ x, y, a, lit, tick, zone, r });
    }
  }
  return progCells;
}
export function drawProg(cv, p, fast) {
  const N = PROG_N, c = cv.getContext('2d');
  const im = c.createImageData(N, N), D = im.data;
  const rim = fast ? ['#fff6d6', '#ffe08a', '#b88838'] : ['#ffe7a6', '#c99a48', '#8a5e1f'];
  const fill = fast ? ['#c8ffc8', '#7fe08a', '#4aa85a'] : ['#ffffff', '#e8f4f0', '#a9bcb8'];
  p = Math.max(0, Math.min(1, p));
  for (const k of progLayout()) {
    if (k.zone === 'o') put(D, N, k.x, k.y, '#04090b');
    else if (k.zone === 'rim') put(D, N, k.x, k.y, k.lit > 0.4 ? rim[0] : k.lit < -0.4 ? rim[2] : rim[1]);
    else if (k.zone === 'in') put(D, N, k.x, k.y, '#04090b', 0.7);
    else if (k.zone === 'disc') put(D, N, k.x, k.y, '#09161a', 0.74);
    else if (k.a < p) {
      // 走过的：最前面那几格最亮
      const head = p - k.a < 0.035 && p < 1;
      put(D, N, k.x, k.y, head ? fill[0] : k.lit > 0.4 ? fill[0] : k.lit < -0.4 ? fill[2] : fill[1]);
    } else put(D, N, k.x, k.y, k.tick ? '#4d6662' : '#0b1a1f', k.tick ? 0.95 : 0.85);
  }
  c.putImageData(im, 0, 0);
}

// —— 收工圈：模式牌上那只小表盘（13×13 格，屏幕上 39 像素）——
// 和进度圈一套：外黑边、铜圈、黑沟、刻度槽，按住 B 时走过的格子一格一格亮，走满就收工
export const QUIT_N = 13;
let quitCells = null;
export function drawQuit(cv, p) {
  const N = QUIT_N, R = N / 2, c = cv.getContext('2d');
  if (!quitCells) {
    quitCells = [];
    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        const dx = x + 0.5 - R, dy = y + 0.5 - R, r = Math.hypot(dx, dy);
        if (r >= 6.5) continue;
        const a = ((Math.atan2(dx, -dy) / (2 * Math.PI)) + 1) % 1;
        const zone = r >= 5.6 ? 'o' : r >= 4.6 ? 'rim' : r >= 4.0 ? 'o' : r >= 2.2 ? 'trk' : 'disc';
        quitCells.push({ x, y, a, lit: litOf(dx, dy, r), zone });
      }
    }
  }
  const im = c.createImageData(N, N), D = im.data;
  p = Math.max(0, Math.min(1, p));
  for (const k of quitCells) {
    if (k.zone === 'o') put(D, N, k.x, k.y, '#04090b');
    else if (k.zone === 'rim') put(D, N, k.x, k.y, k.lit > 0.4 ? '#ffe7a6' : k.lit < -0.4 ? '#8a5e1f' : '#c99a48');
    else if (k.zone === 'disc') put(D, N, k.x, k.y, '#09161a', 0.85);
    else if (k.a < p) put(D, N, k.x, k.y, p - k.a < 0.06 && p < 1 ? '#ffffff' : k.lit < -0.4 ? '#a9bcb8' : '#e8f4f0');
    else put(D, N, k.x, k.y, '#0b1a1f', 0.9);
  }
  c.putImageData(im, 0, 0);
}

// —— 入舱章：红印泥，外面一道粗圈、里面一道细圈，中间一只锚 ——
// 一格一格画好（不让浏览器转、不让它缩放，格子才齐）；印泥有深有浅、有几处没沾上，圈外溅几点
export const STAMP_N = 40;
// 锚正着一格一格画（斜着画格子就糊了，斜的那股劲交给盖下去那一下）
const ANCHOR = [
  '.........oooo.........',
  '........oooooo........',
  '........oo..oo........',
  '........oo..oo........',
  '........oooooo........',
  '.........oooo.........',
  '..........oo..........',
  '....oooooooooooooo....',
  '....oooooooooooooo....',
  '..........oo..........',
  '..........oo..........',
  '..........oo..........',
  '..........oo..........',
  '.o........oo........o.',
  'ooo.......oo.......ooo',
  'oooo......oo......oooo',
  '.ooo......oo......ooo.',
  '.ooo......oo......ooo.',
  '..ooo.....oo.....ooo..',
  '...ooo....oo....ooo...',
  '....oooo..oo..oooo....',
  '......oooooooooo......',
  '........oooooo........',
];
export function drawStamp(cv) {
  const N = STAMP_N, c = cv.getContext('2d'), im = c.createImageData(N, N), D = im.data;
  const R = N / 2, ax = 9, ay = 9;
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const dx = x + 0.5 - R, dy = y + 0.5 - R, r = Math.hypot(dx, dy);
      const row = ANCHOR[y - ay];
      const ink = (r >= 16.5 && r < 19.4) || (r >= 13.8 && r < 15.0) || (row !== undefined && row[x - ax] === 'o');
      const h = hash(x, y, 3);
      if (ink) {
        if (h < 0.035) continue;
        put(D, N, x, y, '#b22a1e', h < 0.14 ? 0.55 : h > 0.9 ? 0.95 : 0.84);
      } else if (r < 19.4 && r > 3 && h > 0.988) put(D, N, x, y, '#b22a1e', 0.35);
    }
  }
  c.putImageData(im, 0, 0);
}

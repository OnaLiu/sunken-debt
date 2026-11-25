// 画面上的几何：一堆点的凸包（逆时针）、点到线段的距离、点到凸多边形的距离（在里面是负的）
export function hull2(pts) {
  const p = pts.map((q) => ({ x: q.x, y: q.y })).sort((a, b) => a.x - b.x || a.y - b.y);
  if (p.length < 3) return p;
  const cross = (o, a, b) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  const lo = [], up = [];
  for (const q of p) { while (lo.length >= 2 && cross(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
  for (let i = p.length - 1; i >= 0; i--) { const q = p[i]; while (up.length >= 2 && cross(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
  lo.pop(); up.pop();
  return lo.concat(up);
}
export function segDist(a, b, p) {
  const dx = b.x - a.x, dy = b.y - a.y;
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy || 1)));
  return Math.hypot(a.x + dx * t - p.x, a.y + dy * t - p.y);
}
export function polyDist(poly, p) {
  let d = 1e9, inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[j], b = poly[i];
    d = Math.min(d, segDist(a, b, p));
    if ((a.y > p.y) !== (b.y > p.y) && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x) inside = !inside;
  }
  return inside ? -d : d;
}

// 一块方牌子（左上角 x, y，宽 w 高 h）离自己的船（boatOnScreen 给的船身外轮廓和吊臂）有没有 m 像素
export function rectClearOfBoat(B, x, y, w, h, m) {
  const x0 = x - m, y0 = y - m, x1 = x + w + m, y1 = y + h + m;
  const inR = (q) => q.x > x0 && q.x < x1 && q.y > y0 && q.y < y1;
  if (B.poly.length > 2) {
    if (B.poly.some(inR)) return false;
    for (let i = 0; i <= 2; i++) for (let j = 0; j <= 2; j++) if (polyDist(B.poly, { x: x + (w * i) / 2, y: y + (h * j) / 2 }) < m) return false;
  }
  const { a, b, r } = B.crane;
  for (let k = 0; k <= 12; k++) {
    const q = { x: a.x + ((b.x - a.x) * k) / 12, y: a.y + ((b.y - a.y) * k) / 12 };
    if (q.x > x0 - r && q.x < x1 + r && q.y > y0 - r && q.y < y1 + r) return false;
  }
  return true;
}

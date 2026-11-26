import { mulberry32 } from '../util/math.js';
import { seabedY } from '../world/terrain.js';
import { N, T } from './tables.js';

// 一趟一潮（设计第 2、13.5 节）：第一趟照原来一模一样（银币匣一定在）；从第二趟起，每一潮重铺海底的散货。
// 全游戏一份：每片海照同一个顺序铺——地形和沉船不动、线索不动，货从破损的舱口和船腹再冲出来一些，
// 重的留在船边或坡底，小件顺着有关的方向散开；一处聚积的几件一网带得走，分开的两堆之间有真正的空隙。
// 东西在出海那一刻就铺好、固定在海底，按下网之后不再抽。
//
// 这里是「怎么铺」（同一潮每次一样、堆和堆之间留空、挤着了挪一挪、稀罕的几成、太深的不摆）；
// 「这片海有哪几处来源、每处冲出来什么、堆在哪」是这片海的（sea/<海>/tide.js，归潮沙湾的是 sea/shawan/tide.js）。
// 模型、泥包、看得见判定照旧是 itemsys.js 那一份。
export { tideLayout } from '../sea/index.js';

// 铺第 n 潮用的一套工具。sources：每处来源 { kinds, rare }；from：每处来源在收获单上叫什么（配表「文案」的 id）；
// keepOut：不压着的（埋着的船材这类）[{x, z, r}]；radius(kind)：一件占多大
export function tideBench(n, { sources, from, keepOut = [], radius = () => 0.42 }) {
  const R = mulberry32(9173 + n * 7919);
  const pick = (a) => a[Math.floor(R() * a.length)];
  const range = (a, b) => a + R() * (b - a);
  const loose = [], hold = [];
  let k = 0;
  const id = (kind) => `t${n}-${kind}-${k++}`;
  const taken = [];
  // 摆一件：离已经摆下的东西留出空隙（同一堆里挨着，堆和堆之间分得开），不压着埋着的硬物
  const room = (x, z, r) => taken.every((o) => Math.hypot(o.x - x, o.z - z) > o.r + r + 0.12) && keepOut.every((o) => Math.hypot(x - o.x, z - o.z) > o.r);
  // 摆一件：挤着了就在附近另找一处（最多试几次），还放不下就不摆
  const put = (src, kind, x0, z0, extra = {}, jit = 0.5) => {
    const r = radius(kind);
    let x = x0, z = z0, k = 0;
    while (!room(x, z, r) && k++ < 6) { x = x0 + range(-jit, jit); z = z0 + range(-jit, jit); }
    if (!room(x, z, r)) return false;
    taken.push({ x, z, r });
    loose.push({ id: id(kind), kind, x, z, rot: range(0, Math.PI * 2), tilt: extra.tilt ?? range(0, 0.4), bury: extra.bury ?? range(0.08, 0.3), from: T(from[src]), ...extra });
    return true;
  };
  // 舱底的一件（lx/t 是舱底的坐标）
  const putHold = (kind, lx, t, extra = {}) => hold.push({ id: id(kind), kind, lx, t, from: T(from.hold), ...extra });
  const rare = (src) => sources[src].rare.length && R() < N('潮·稀罕的几成', 0.2);
  // 太深够不着的（深槽太陡的地方）不摆：作业深度以内才算
  const done = () => ({ loose: loose.filter((s) => seabedY(s.x, s.z) > -29.5), hold });
  return { R, pick, range, put, putHold, rare, done };
}

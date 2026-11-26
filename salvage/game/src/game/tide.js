import { mulberry32 } from '../util/math.js';
import { wreckToWorld, TUBE_SPOT, ANCHOR_SPOT, HIDDEN_TIMBER } from '../world/layout.js';
import { seabedY } from '../world/terrain.js';
import { N, T } from './tables.js';

// 一趟一潮（设计第 2、13.5 节）：第一趟照原来一模一样（银币匣一定在）；从第二趟起，每一潮重铺海底的散货。
// 全游戏一份：每片海照同一个顺序铺——地形和沉船不动、线索不动，货从破损的舱口和船腹再冲出来一些，
// 重的留在船边或坡底，小件顺着有关的方向散开；一处聚积的几件一网带得走，分开的两堆之间有真正的空隙。
// 东西在出海那一刻就铺好、固定在海底，按下网之后不再抽。
//
// 这里只管「这一潮有哪些东西、各在哪」，模型、泥包、看得见判定照旧是 itemsys.js 那一份。
// 归潮沙湾的几处来源（都是 13.3 节的三处现场里本来就有的）：
//   浅滩（锚拖过的沟边）、沉船甲板那一侧的外侧散落区、断舱里（舱底淤泥面上）、坡下掩埋区、深槽上壁。

// 每处来源能冲出来什么（kind 是道具定义里的形状；名字、价值在配表「捞获」）
const SOURCES = {
  // 浅滩：锚链拖过翻出来的零碎，偶尔一副锚
  shoal: { kinds: ['tube', 'pulley', 'hinge', 'pulley', 'hinge'], rare: ['anchor'] },
  // 外侧散落：从两道舱口翻出来的货，重的在船边
  outer: { kinds: ['jar', 'jar2', 'copperset', 'barrel', 'rope', 'sack', 'jar', 'barrel'], rare: ['seal'] },
  // 断舱里：舱底淤泥面上的货，珍贵的那一匣只在这里
  hold: { kinds: ['sack', 'copperset', 'jar'], rare: ['chest'] },
  // 坡下：滚下去的，半埋
  slope: { kinds: ['tube2', 'barrel', 'copperset'], rare: [] },
  // 深槽上壁：船尾掉下去的
  trench: { kinds: ['lantern'], rare: [] },
};

// 这一件从哪儿捞的（收获单签上第二行）
const FROM = { shoal: '地点·浅滩', outer: '地点·船边', hold: '地点·断舱', slope: '地点·坡下', trench: '地点·深槽' };

// 第 n 潮（n ≥ 2）的散货：返回 { loose: [世界坐标的], hold: [舱底的，lx/t 是舱底的坐标] }
export function tideLayout(n) {
  const R = mulberry32(9173 + n * 7919);
  const pick = (a) => a[Math.floor(R() * a.length)];
  const range = (a, b) => a + R() * (b - a);
  const loose = [], hold = [];
  let k = 0;
  const id = (kind) => `t${n}-${kind}-${k++}`;
  const taken = [];
  // 摆一件：离已经摆下的东西留出空隙（同一堆里挨着，堆和堆之间分得开），不压着埋着的船材
  const room = (x, z, r) => taken.every((o) => Math.hypot(o.x - x, o.z - z) > o.r + r + 0.12) && Math.hypot(x - HIDDEN_TIMBER.x, z - HIDDEN_TIMBER.z) > 2.2;
  // 摆一件：挤着了就在附近另找一处（最多试几次），还放不下就不摆
  const put = (src, kind, x0, z0, extra = {}, jit = 0.5) => {
    const r = kind === 'anchor' ? 0.95 : 0.42;
    let x = x0, z = z0, k = 0;
    while (!room(x, z, r) && k++ < 6) { x = x0 + range(-jit, jit); z = z0 + range(-jit, jit); }
    if (!room(x, z, r)) return false;
    taken.push({ x, z, r });
    loose.push({ id: id(kind), kind, x, z, rot: range(0, Math.PI * 2), tilt: extra.tilt ?? range(0, 0.4), bury: extra.bury ?? range(0.08, 0.3), from: T(FROM[src]), ...extra });
    return true;
  };
  const rare = (src) => SOURCES[src].rare.length && R() < N('潮·稀罕的几成', 0.2);

  // 浅滩：一两堆，锚拖过的沟边（铜筒那一窝附近）
  const piles = 1 + Math.floor(R() * 2);
  for (let p = 0; p < piles; p++) {
    const cx = TUBE_SPOT.x + range(-3, 5), cz = TUBE_SPOT.z + range(-2.5, 3.5);
    const m = 2 + Math.floor(R() * 2);
    for (let i = 0; i < m; i++) put('shoal', pick(SOURCES.shoal.kinds), cx + range(-0.9, 0.9), cz + range(-0.9, 0.9));
  }
  if (rare('shoal')) put('shoal', 'anchor', ANCHOR_SPOT.x + range(-3, 3), ANCHOR_SPOT.z + range(-3, 3), { bury: 0.18 });

  // 外侧散落区：沿船身甲板那一侧排开几堆，每堆一到三件（一网罩得住一堆），堆和堆之间隔开
  const outerN = Math.round(N('潮·船边几堆', 6));
  for (let p = 0; p < outerN; p++) {
    const along = -5.6 + ((p + 0.5) / outerN) * 11.2 + range(-0.35, 0.35), side = range(7.3, 9.3);
    const c = wreckToWorld(along, side);
    const m = 1 + Math.floor(R() * 3);
    for (let i = 0; i < m; i++) {
      const kind = i === 0 && rare('outer') ? pick(SOURCES.outer.rare) : pick(SOURCES.outer.kinds);
      const upright = kind === 'jar' || kind === 'jar2' || kind === 'barrel';
      put('outer', kind, c.x + range(-0.75, 0.75), c.z + range(-0.75, 0.75), upright ? { tilt: range(1.2, 1.57) } : {});
    }
  }

  // 断舱里：舱底淤泥面上两三件；珍贵的那一匣只在这里，几潮才有一次
  const holdN = 2 + Math.floor(R() * 2);
  const spots = [[2.75, 0.55], [1.85, 0.42], [3.4, 0.35], [1.2, 0.6]];
  for (let i = 0; i < holdN; i++) {
    const kind = i === 0 && R() < N('潮·银币匣的几成', 0.5) ? 'chest' : pick(SOURCES.hold.kinds);
    const [lx, t] = spots[i];
    hold.push({ id: id(kind), kind, lx: lx + range(-0.15, 0.15), t: t + range(-0.05, 0.05), rot: range(0, Math.PI * 2), tilt: range(0, 0.25), bury: range(0.18, 0.34), from: T(FROM.hold) });
  }

  // 坡下：一两件半埋的，顺着船尾往下
  const slopeN = 1 + Math.floor(R() * 2);
  for (let i = 0; i < slopeN; i++) put('slope', pick(SOURCES.slope.kinds), range(8, 14), range(20.5, 25.5), { bury: range(0.18, 0.3), tilt: range(0, 0.3) });
  // 深槽上壁：船尾那盏灯这一潮冲没冲下来
  if (R() < N('潮·深槽有货的几成', 0.5)) put('trench', 'lantern', range(6.5, 10), range(28.5, 30.5), { bury: 0.2, tilt: range(0.2, 0.6) });

  // 太深够不着的（深槽太陡的地方）不摆：作业深度以内才算
  return { loose: loose.filter((s) => seabedY(s.x, s.z) > -29.5), hold };
}

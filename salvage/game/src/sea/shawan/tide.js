import { wreckToWorld, TUBE_SPOT, ANCHOR_SPOT, HIDDEN_TIMBER } from './layout.js';
import { tideBench } from '../../game/tide.js';
import { N } from '../../game/tables.js';
import { seabedY } from '../../world/terrain.js';

// 归潮沙湾每一潮海底铺什么（第二趟起；第一趟照 layout.js 摆好的那一份）。怎么铺是全游戏一份（game/tide.js 的 tideBench）。
// 几处来源（都是 13.3 节的三处现场里本来就有的）：
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

// 埋着的船材露出来的那一角（坡上那一端，浅一点）：game.placeTimberCorner 露的就是这一端
export function timberCorner() {
  const T = HIDDEN_TIMBER, dx = Math.cos(T.rot), dz = -Math.sin(T.rot);
  const a = { x: T.x - dx * T.len * 0.5, z: T.z - dz * T.len * 0.5 }, b = { x: T.x + dx * T.len * 0.5, z: T.z + dz * T.len * 0.5 };
  const e = seabedY(a.x, a.z) > seabedY(b.x, b.z) ? a : b, o = e === a ? b : a;
  return { e, ux: (e.x - o.x) / T.len, uz: (e.z - o.z) / T.len };
}
// 第三潮那盏灯：离露出的那一角「第三潮·铜灯离船材」米，在船材朝船尾外那一侧（垂直船材）——白圈罩住灯就罩住那一角
export function lampSpot() {
  const { e, ux, uz } = timberCorner(), d = N('第三潮·铜灯离船材', 0.8);
  return { x: e.x + uz * d, z: e.z - ux * d };
}
// 第三潮船尾外那一小堆碎陶片（沉船坐标：船尾再往后、偏甲板那一侧）
export const SHARDS_AT = wreckToWorld(-9.6, 2.4);

// 第 n 潮（n ≥ 2）的散货：返回 { loose: [世界坐标的], hold: [舱底的，lx/t 是舱底的坐标] }
export function tideLayout(n) {
  const { R, pick, range, put, pin, putHold, rare, done } = tideBench(n, {
    sources: SOURCES, from: FROM,
    keepOut: [{ x: HIDDEN_TIMBER.x, z: HIDDEN_TIMBER.z, r: 2.2 }], // 不压着埋着的船材
    radius: (kind) => (kind === 'anchor' ? 0.95 : 0.42),
  });

  // 第三潮（切片小段 5「最后一网」）：坡上埋着的那截船材露出的那一角旁边，一定有一盏铜灯（露着上半截）；
  // 沉船船尾外一小堆碎陶片。两处都只有停到船尾外（LAST_PARK）才够得着：船边、断舱那两处停船够不着
  if (n === 3) {
    const L = lampSpot();
    pin('slope', 'lantern', L.x, L.z, { bury: N('第三潮·铜灯埋多深', 0.2), tilt: 0.45, rot: 0.9 });
    const c = SHARDS_AT;
    const m = Math.round(N('第三潮·碎陶片几件', 3));
    for (let i = 0; i < m; i++) {
      const a = (i / m) * Math.PI * 2 + 0.4;
      pin('outer', 'shards', c.x + Math.cos(a) * 0.38, c.z + Math.sin(a) * 0.38, { rot: a * 1.7, tilt: 0.1, bury: 0.06 });
    }
  }

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
    putHold(kind, lx + range(-0.15, 0.15), t + range(-0.05, 0.05), { rot: range(0, Math.PI * 2), tilt: range(0, 0.25), bury: range(0.18, 0.34) });
  }

  // 坡下：一两件半埋的，顺着船尾往下（第三潮坡上只有那盏灯）
  const slopeN = n === 3 ? 0 : 1 + Math.floor(R() * 2);
  for (let i = 0; i < slopeN; i++) put('slope', pick(SOURCES.slope.kinds), range(8, 14), range(20.5, 25.5), { bury: range(0.18, 0.3), tilt: range(0, 0.3) });
  // 深槽上壁：船尾那盏灯这一潮冲没冲下来
  if (n !== 3 && R() < N('潮·深槽有货的几成', 0.5)) put('trench', 'lantern', range(6.5, 10), range(28.5, 30.5), { bury: 0.2, tilt: range(0.2, 0.6) });

  return done();
}

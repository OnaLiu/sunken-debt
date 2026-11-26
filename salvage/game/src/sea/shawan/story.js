import * as THREE from 'three';
import { T } from '../../game/tables.js';
import { seabedY } from './seabed.js';
import { SHOAL, SHOAL_MARK, WRECK, TRAIL, SEAL_SPOT, NET_SPOTS, SLOPE_LEAD, wreckToWorld } from './layout.js';

// 归潮沙湾这一片海的事件和路线：到了哪（地名横幅、远处的钟）、第一眼看见沉船、
// 方向箭头一处处往哪指（浅滩标杆 → 船板 → 沉船 → 坡下）、暂停页上这里叫什么、收获单上这件从哪儿捞的。
// 地名横幅、看见沉船那一下的镜头和光、冒泡、亮一圈这些「怎么演」是全游戏一份（game.js 的 arrive、sightWreck、trenchBurp、ping），
// 这里只定「这片海什么时候演哪一下」。g.flags 里的 shoal、wreck、slope、trailIdx、wreckNets 是这片海记的到过哪。

export const story = {
  update(g, dt) {
    const F = g.flags;
    const bp = g.boatCtl.pos;
    const dShoal = Math.hypot(bp.x - SHOAL.x, bp.z - SHOAL.z);
    const dWreck = Math.hypot(bp.x - WRECK.x, bp.z - WRECK.z);
    if (!F.shoal && dShoal < 24) {
      F.shoal = true;
      g.arrive(T('地名·浅滩'), 784);
    }
    // 第一眼看见沉船：42 米内、它进了画面（再近到 30 米就不等了）
    if (!F.wreck && (dWreck < 30 || (dWreck < 42 && g.inView(WRECK.x, -5, WRECK.z, 0.08)))) {
      F.wreck = true;
      g.sightWreck();
    }
    // 蟹翻过的泥里露出硬边：在那儿亮一圈（看得见的时候）
    if (F.crabExposed && !F.crabSaid) {
      const sp = wreckToWorld(SEAL_SPOT.along, SEAL_SPOT.side);
      const sy = seabedY(sp.x, sp.z);
      const s = g.project(new THREE.Vector3(sp.x, sy, sp.z));
      // 甲板近景（冲洗、揭晓）时不亮：那时看的是甲板，亮环会隔着甲板画出来、和揭晓抢；拉回大视野、收获落进格子以后再亮
      if (g.quietT > 2.4 && s.z < 1 && s.x > 100 && s.x < 1820 && s.y > 80 && s.y < 1000 && Math.hypot(g.cam.pivot.x - sp.x, g.cam.pivot.z - sp.z) < 30) {
        F.crabSaid = true;
        g.ping(sp.x, sy, sp.z);
      }
    }
    // C12 在沉船下过两网、回去开船：箭头第一次指向坡下的那一刻，远处深槽里冒上来一大串泡
    if (!F.slopeSaid && (g.mode === 'sail' || (g.moment.run && g.mode === 'arm')) && story.lead(g) === SLOPE_LEAD) {
      F.slopeSaid = true;
      g.trenchBurp({ x: SLOPE_LEAD.x + 3, z: SLOPE_LEAD.z + 8 });
    }
    const trenchNear = story.nearTrench(bp);
    if (!F.slope && trenchNear) {
      F.slope = true;
      g.arrive(T('地名·深槽'), 392);
    }
    // 线索一段段往东南：经过一块船板，箭头就指向下一块
    while (F.trailIdx < TRAIL.length && Math.hypot(bp.x - TRAIL[F.trailIdx].x, bp.z - TRAIL[F.trailIdx].z) < 12) F.trailIdx++;
    // 大轮廓：看懂普通生物以后才出现。离深槽近了，或者在沉船这儿下过几网
    const lev = g.leviathan;
    if (!lev.active && !lev.done && g.trip.time > 55) {
      if (trenchNear || (F.wreck && g.trip.nets >= 3)) g.threat.armed = true;
    }
  },

  // 到了深槽那一片没有
  nearTrench(bp) {
    return bp.z > 14 && bp.x > -16 && bp.x < 40;
  },

  // 下一处线索在哪：起步指向浅滩的标杆；浅滩下过一网（或者开离浅滩）以后，顺着散落的船板往东南；
  // 认出沉船就先不指；在沉船这儿下过两网以后，顺着船尾和滚落的货指向坡下，到了深槽不再指。只给方向，不给落点。
  lead(g) {
    const F = g.flags;
    if (F.wreck) return !F.slope && F.wreckNets >= 2 ? SLOPE_LEAD : null;
    if (!F.shoal) return SHOAL_MARK;
    const bp = g.boatCtl.pos;
    if (g.trip.nets < 1 && Math.hypot(bp.x - SHOAL.x, bp.z - SHOAL.z) < 30) return null;
    if (F.trailIdx < TRAIL.length) return TRAIL[F.trailIdx];
    return WRECK;
  },

  // 箭头指着的这一处之后还有下一处吗（顺着船板一块接一块；最后一块之后是沉船）：快到这一处时箭头先转过去
  leadNext(L) {
    const i = TRAIL.indexOf(L);
    if (i < 0) return null;
    return i + 1 < TRAIL.length ? TRAIL[i + 1] : WRECK;
  },

  // 这里叫什么（暂停页的标题）
  placeName(g) {
    const bp = g.boatCtl.pos;
    const dWreck = Math.hypot(bp.x - WRECK.x, bp.z - WRECK.z);
    if (story.nearTrench(bp) && dWreck > 16) return T('地名·深槽');
    if (dWreck < 30) return T('地名·沉船');
    if (Math.hypot(bp.x - SHOAL.x, bp.z - SHOAL.z) < 30) return T('地名·浅滩');
    if (bp.x < -112) return T('地名·港外航路');
    return T('地名·归潮沙湾');
  },

  // 已经认得这片海了（一局里第二潮起、小样那一刻、效果页摆位）：浅滩、沉船、线索都算到过。
  // all：连坡下也算到过、深槽那一串泡也冒过了
  known(F, all = false) {
    Object.assign(F, { shoal: true, wreck: true, trailIdx: TRAIL.length });
    if (all) Object.assign(F, { slope: true, slopeSaid: true });
  },
};

// 这件东西是从哪儿捞上来的（收获单签上第二行）：第一趟按网位，后来每一潮的货自己带着（tide.js 的 from）
const PLACE_OF = {};
for (const [k, ids] of Object.entries(NET_SPOTS)) {
  // 表的 id，不是玩家看的：地名在配表「文案」
  const p = { shoal: '地点·浅滩', anchor: '地点·浅滩', hold: '地点·断舱', jars: '地点·船边', pots: '地点·船边', dig: '地点·船边', slope: '地点·坡下', trench: '地点·深槽' }[k];
  for (const id of ids) PLACE_OF[id] = p;
}
export function placeOf(id, at) {
  if (id && PLACE_OF[id]) return T(PLACE_OF[id]);
  if (id && id.startsWith('trail')) return T('地点·航路');  // 表的 id，不是玩家看的
  if (at) {
    if (Math.hypot(at.x - SHOAL.x, at.z - SHOAL.z) < 30) return T('地点·浅滩');  // 表的 id，不是玩家看的
    if (Math.hypot(at.x - WRECK.x, at.z - WRECK.z) < 26) return T('地点·船边');  // 表的 id，不是玩家看的
  }
  return '';
}

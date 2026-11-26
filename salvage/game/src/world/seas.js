// 一片海一份：这一片海自己的东西（名字、地名、深浅、要什么设备、摆放在哪一份文件里）。
// 共用的系统（开船、吊臂和网、打捞点、揭宝、开舱、债本、船坞、船员、镜头、界面、声音……）整个游戏一份，
// 不认得是哪一片海：要用到「这片海叫什么、这里叫什么」的，问这里（见 共用的系统.md「一片海一份的」）。
// 后面的段（锈钟峡、无光层、债底）做三小段时在这里把自己那一份填上、`ready` 改成 true，
// 地形、沉船、摆放照沙湾那一套代码出（world/terrain、wreck、layout），只换数和摆放，不另写一份共用的。
import { WRECK, SHOAL, NET_SPOTS } from './layout.js';
import { T, N, SPILL_KINDS } from '../game/tables.js';

// 沙湾摆好的那几处 → 名牌上写的出处（文案表的 id）
const FROM = {};
for (const [k, ids] of Object.entries(NET_SPOTS)) {
  const p = { shoal: '出处·浅滩', anchor: '出处·浅滩', hold: '出处·断舱', jars: '出处·船边', pots: '出处·船边', dig: '出处·船边', slope: '出处·坡下', trench: '出处·深槽' }[k];
  for (const id of ids) FROM[id] = p;
}

export const SEAS = [
  {
    key: '沙湾',
    name: '海·沙湾', // 文案表的 id
    depth: [0, 30], // 米：设计第 8 节
    gear: [], // 起步就有
    ready: true,
    // 每潮重铺（设计「一趟一潮」）：冲出来的是哪几样（几成机会）、落在哪两堆旁边（沉船坐标，along、side 上下各散开多少）、
    // 每潮几件（第 2 潮几件、以后每潮多几件、最多多几件）。数在 配表.md「切片的数」，两堆在哪是这片海的摆放
    get spill() {
      const da = N('冲出来·一堆多长'), ds = N('冲出来·一堆多宽');
      return {
        kinds: SPILL_KINDS,
        at: [{ along: 3.1, side: 8.1, da, ds }, { along: -3.1, side: 8.1, da, ds }],
        n: [N('冲出来·第2潮几件'), N('冲出来·最多多几件'), N('冲出来·每潮多几件')],
      };
    },
    // 这件东西是从哪儿捞上来的（揭晓、开舱名牌的第二行）：摆好的那几处按 NET_SPOTS 认，别的按捞的地方离哪近
    from(id, at) {
      if (id && FROM[id]) return T(FROM[id]);
      if (id && id.startsWith('trail')) return T('出处·航路');
      if (at) {
        if (Math.hypot(at.x - SHOAL.x, at.z - SHOAL.z) < 30) return T('出处·浅滩');
        if (Math.hypot(at.x - WRECK.x, at.z - WRECK.z) < 26) return T('出处·船边');
      }
      return '';
    },
    // 这里叫什么：从近到远看，先对上的那一处（暂停页标题、左上地名）
    place(bp, g) {
      const dWreck = Math.hypot(bp.x - WRECK.x, bp.z - WRECK.z);
      if (g.nearTrench(bp) && dWreck > 16) return T('地名·深槽');
      if (dWreck < 30) return T('地名·沉船');
      if (Math.hypot(bp.x - SHOAL.x, bp.z - SHOAL.z) < 30) return T('地名·通透浅滩');
      if (bp.x < -112) return T('地名·港外航路');
      return T(this.name);
    },
  },
  // 下面三片还没做（债本还清那一页开它）：设计第 8 节，做到那一段时填上自己的地名、摆放
  { key: '锈钟峡', depth: [30, 120], gear: ['缆长', '灯'], ready: false },
  { key: '无光层', depth: [120, 500], gear: ['灯', '声呐', '缆长'], ready: false },
  { key: '债底', depth: [500, 900], gear: ['缆长'], ready: false },
];

// 现在在哪一片海（这一版只有沙湾）
export const SEA = SEAS[0];

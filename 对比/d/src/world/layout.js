// 归潮沙湾这一片海的摆放。顺序照设计文档 4.5：
// 地形和海流 → 一场事故 → 主要残骸和货堆 → 有限的散落和掩埋 → 线索 → 生物利用这些空间。
//
// 事故：一条中世纪木帆商船夜里擦上浅滩，船腹撞破，掉了几件东西和船板；
// 下锚想稳住，锚在沙里拖出一道沟，缆绳崩断；船被风浪推下缓坡，侧卧沉在坡上，
// 船头仍朝着岸。货从翻开的舱口和船腹破口散出，重的留在船边，滚的顺坡往下到了深槽边。

export const START = { x: -152, z: -40, heading: 0 }; // heading 0 = 朝东(+x)

// 港外航路的浮标（成对）
export const LANE_BUOYS = [];
for (let x = -214; x <= -118; x += 24) {
  LANE_BUOYS.push({ x, z: -48.5, color: 'red' });
  LANE_BUOYS.push({ x: x + 8, z: -31.5, color: 'green' });
}

export const SHOAL = { x: -82, z: -30 };
export const SHOAL_MARK = { x: -91, z: -38.5 }; // 浅滩标杆，从航路就看得见
// 浅滩两只小蟹的窝：窝口一小块沙地不长草，钻进去、探出眼柄都看得见
export const SHOAL_CRABS = [{ x: -86.5, z: -33.5 }, { x: -76, z: -31 }];

// 浅滩：铜筒半埋，旁边两个零件；几米外一副锚，锚后是拖出来的沟，断缆朝东南
export const TUBE_SPOT = { x: -80.4, z: -27.2 };
export const ANCHOR_SPOT = { x: -74.6, z: -22.9, rot: -0.62 };
export const DRAG_GROOVE = [
  [-93.5, -36.0],
  [-87.0, -31.4],
  [-80.8, -26.6], // 经过铜筒旁：铜筒是锚链拖动时从泥里翻出来的一截
  [-76.0, -24.0],
];
export const KEEL_SCRAPE = [
  [-70.0, -19.0],
  [-61.0, -13.0],
  [-52.0, -8.0],
];

// 浅滩到沉船之间的船板、桶板、绳头：都来自同一条船，指向东南
export const TRAIL = [
  { kind: 'plank', x: -67.5, z: -16.8, rot: 0.5 },
  { kind: 'stave', x: -59.4, z: -12.1, rot: 1.9 },
  { kind: 'plank', x: -49.8, z: -6.4, rot: 2.6 },
  { kind: 'ropebit', x: -40.2, z: -2.6, rot: 0.3 },
  { kind: 'plank', x: -30.5, z: 0.6, rot: 1.2 },
  { kind: 'shards', x: -21.0, z: 3.0, rot: 0.0 },
];

// 礁脊：南北向一道石脊，中间有一个豁口，船当年从豁口漂过去
export const RIDGE = { ax: -50, az: -54, bx: -43, bz: 30, gapA: -11.5, gapB: -0.5 };
export const WEED_BED = { x: -114, z: -37, rx: 16, rz: 11 };

// 沉船：船头朝西北偏北（岸的方向），向右舷侧卧，甲板朝东上方，左舷船腹朝西上方
export const WRECK = {
  x: 2.0,
  z: 8.0,
  yaw: 1.897, // 船头指向 (-0.32, -0.95)
  heel: 0.8, // 约 46°，向右舷
  pitch: 0.13, // 船尾顺坡低
  length: 22,
  beam: 7.2,
};

// 深槽：沿东西走向，西浅东深
export function trenchZ(x) {
  return 36.5 + 0.14 * x + 3.0 * Math.sin(x * 0.05);
}

// 道具定义：名字、价值、尺寸、珍贵与否。价值只在揭晓那一刻才给玩家看。
export const ITEM_DEFS = {
  tube: { name: '黄铜信筒', value: 140, r: 0.42, look: 'metal-tube', desc: '筒盖封蜡完好，筒身刻着商号的帆船徽记' },
  pulley: { name: '铜滑轮', value: 45, r: 0.22, look: 'part', desc: '绳槽磨得发亮，还能转' },
  hinge: { name: '舱门铜铰链', value: 28, r: 0.18, look: 'part', desc: '和信筒一样的帆船压花' },
  anchor: { name: '熟铁锚', value: 220, r: 0.95, look: 'anchor', heavy: true, desc: '锚杆上还套着半截断缆' },
  jar: { name: '双耳陶罐', value: 85, r: 0.34, look: 'jar', desc: '软木塞还封着，里面晃着油' },
  jar2: { name: '双耳陶罐', value: 85, r: 0.34, look: 'jar', desc: '肩上有窑口的指印' },
  copperset: { name: '一摞铜锅', value: 165, r: 0.42, look: 'metal-round', desc: '五口铜锅套在一起，麻绳还捆着' },
  rope: { name: '旧缆绳卷', value: 12, r: 0.36, look: 'rope', desc: '泡软了，还能当材料' },
  barrel: { name: '箍桶', value: 60, r: 0.42, look: 'barrel', desc: '铁箍锈了，桶身还严实' },
  sack: { name: '封铅货袋', value: 95, r: 0.36, look: 'sack', desc: '袋口铅封压着商号印' },
  chest: { name: '银币匣', value: 1800, r: 0.36, look: 'box-iron', precious: true, heavy: true, desc: '铁箍小匣里，一整匣银币' },
  seal: { name: '商号铜印', value: 260, r: 0.2, look: 'small-hard', desc: '印面刻着帆船和两个字母' },
  crab: { name: '石蟹', value: 30, r: 0.24, look: 'crab', alive: true, desc: '放进水槽，回港再说' },
  tube2: { name: '黄铜信筒', value: 150, r: 0.42, look: 'metal-edge', desc: '和浅滩那只同款，筒里卷着信' },
  lantern: { name: '船尾铜灯', value: 340, r: 0.4, look: 'lantern', desc: '四面玻璃碎了三面，灯座还刻着年份' },
  plank: { name: '船板残片', value: 5, r: 0.95, look: 'plank', desc: '橡木，钉孔一排' },
  stave: { name: '桶板', value: 3, r: 0.45, look: 'plank', desc: '从一只箍桶上散下来的' },
  ropebit: { name: '断缆头', value: 4, r: 0.4, look: 'rope', desc: '断口毛糙，是崩断的' },
  shards: { name: '碎陶片', value: 2, r: 0.4, look: 'shards', desc: '和船上的陶罐一个颜色' },
};

// 不在沉船里的打捞物（世界坐标；bury=埋深比例 0..1）
export const LOOSE_ITEMS = [
  { id: 'tube', kind: 'tube', x: -80.6, z: -27.3, rot: 0.55, tilt: 0.22, bury: 0.42 },
  { id: 'pulley', kind: 'pulley', x: -79.7, z: -26.6, rot: 1.2, bury: 0.12 },
  { id: 'hinge', kind: 'hinge', x: -81.35, z: -27.9, rot: 2.2, bury: 0.1 },
  { id: 'anchor', kind: 'anchor', x: -74.6, z: -22.9, rot: -0.62, bury: 0.18 },
  // 坡下掩埋区：信筒顺坡滚下来，横在坡上（筒身顺着等高线，从坡上看过来整根都在画面上），筒尾扎进泥里、
  // 带盖的那一头翘出泥面（泥包堆在扎进去的那一头）；旁边一截船材全埋着（看不见的硬物）。
  // 看上去露出大半截（bury 0.2，15 米水下也看得出是个铜筒，铜色单独少吸一点：clear），筒尾扎得和浅滩那只一样牢（grip 0.42）：
  // 网刮到船材时照样会掉
  { id: 'tube2', kind: 'tube2', x: 11.6, z: 23.4, rot: 3.1, tilt: 0.12, bury: 0.2, grip: 0.42, moundAt: -0.5, mud: 0.24, clear: 0.2 },
  // 深槽上壁：船尾铜灯
  { id: 'lantern', kind: 'lantern', x: 8.2, z: 29.6, rot: 0.8, tilt: 0.5, bury: 0.2 },
];
export const HIDDEN_TIMBER = { x: 13.2, z: 22.2, len: 3.4, rot: 2.5, r: 0.32 }; // 只露出一个角

// 沉船坐标：along 沿船头方向，side 往右舷（甲板朝的那一侧，东边）
const BX = Math.cos(WRECK.yaw), BZ = -Math.sin(WRECK.yaw);
const SX = Math.sin(WRECK.yaw), SZ = Math.cos(WRECK.yaw);
export function wreckToWorld(along, side) {
  return { x: WRECK.x + BX * along + SX * side, z: WRECK.z + BZ * along + SZ * side };
}

// 沉船外侧散落区：货从两道舱口翻出来，落在甲板那一侧的海底
export const OUTER_ITEMS = [
  { id: 'jar', kind: 'jar', along: 3.0, side: 7.7, rot: 0.4, tilt: 1.35, bury: 0.15 },
  { id: 'jar2', kind: 'jar2', along: 3.95, side: 8.35, rot: 2.1, tilt: 1.5, bury: 0.12 },
  { id: 'rope', kind: 'rope', along: 2.35, side: 8.05, rot: 0.0, bury: 0.05 },
  { id: 'copperset', kind: 'copperset', along: -2.55, side: 7.55, rot: 1.0, tilt: 0.25, bury: 0.2 },
  { id: 'barrel', kind: 'barrel', along: -3.75, side: 8.45, rot: 0.3, tilt: 1.57, bury: 0.15 },
];

// 蟹翻泥会翻出来的印章（事先就埋着）；蟹的窝在一块斜靠着的舱盖底下
export const SEAL_SPOT = { along: 0.35, side: 7.25, bury: 0.95 };
export const CRAB_HOME = { along: 1.0, side: 6.25 };
export const HATCH_COVER = { along: 1.05, side: 6.55, rot: 0.35 };
export const CRAB_STOPS = [
  { along: 0.35, side: 7.25, dig: true, t: 7.5 },
  { along: 2.7, side: 7.15, t: 5.5 },
  { along: -2.0, side: 6.95, t: 6.0 },
];

// 网位：这一片海里值得下网的地方（设计第 0 节「一共 6—8 个能下网的地方」），每处是哪几件东西。
// 收工按网位算：捞过 6 处以上、看见过的都捞上来了，游戏替玩家收工（设计第 2 节「6—8 个网位都捞过」）
export const NET_SPOTS = {
  shoal: ['tube', 'pulley', 'hinge'], // 浅滩那一小组：半埋的铜筒和旁边的零件
  anchor: ['anchor'], // 几米外那副锚
  hold: ['chest', 'sack'], // 断舱里
  jars: ['jar', 'jar2', 'rope'], // 外侧：两只陶罐和缆绳
  pots: ['copperset', 'barrel'], // 外侧：铜锅和箍桶
  dig: ['seal'], // 蟹翻出来的那一处
  slope: ['tube2'], // 坡下掩埋区
  trench: ['lantern'], // 深槽上壁
};
export const SPOTS_TO_END = 6;

export const LEVIATHAN_PATH = { fromX: 70, toX: -95 };

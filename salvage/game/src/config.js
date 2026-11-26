// 全局常量：画面、作业、时长。改这里会同时影响游戏、自动演示和效果页。

export const VIEW_W = 1920;
export const VIEW_H = 1080;
// 像素风：场景先画在低分辨率上，再整数倍放大（3×）
export const LOW_W = 640;
export const LOW_H = 360;
export const LOW_PAD = 2; // 四周多画一圈像素，给镜头亚像素平移留余量

export const WATER_Y = 0;

// 吊臂与网
// 网口半径（米）：船坞里升「网」会变大（一局的设备，run.js 照配表设）。全游戏读的都是这一个，改它用 setNetR
export let NET_R = 1.4;
const netHooks = [];
export function setNetR(r) { if (r === NET_R) return; NET_R = r; for (const f of netHooks) f(r); }
export function onNetR(f) { netHooks.push(f); }
export const ARM_MIN = 4.2; // 臂端离吊机中心的最小水平距离
export const ARM_MAX = 10.6; // 最大水平伸距
export const ARM_TIP_H = 5.2; // 臂端离水面高度
export const MAX_WORK_DEPTH = 30; // 最大作业深度

// 油
// 油箱装多少：船坞里升「油箱」会变大（run.js 照配表设）；油表满格就是它
export let FUEL_MAX = 110;
export function setFuelMax(v) { FUEL_MAX = v; }
// 开船、转头扣的油在 配表.md「小样的数」，怎么扣在 boatCtl.js 的 moveFuel
// 每一网的作业油取整：屏幕上的数就是实际扣的数，和油表上的整数直接比
export const netFuelCost = (depth) => Math.round(5 + depth * 0.25);

// 航行
export const BOAT_MAX_SPEED = 7.2;
export const BOAT_ACCEL = 3.2;

// 网的运动
export const NET_DROP_AIR = 5.0; // 空中下放 m/s
export const NET_SINK = 6.2; // 水下沉降 m/s
export const NET_LIFT = 6.8;
export const NET_CLOSE_T = 0.75;
export const NET_SWING_T = 1.15;
export const NET_SET_T = 0.45;

// 揭宝时长（设计文档 7.2）
export const WASH_NORMAL = 4.2;
export const WASH_PRECIOUS = 5.4;
export const SHOW_NORMAL = 2.25;
export const SHOW_PRECIOUS = 3.2;
export const PULLBACK_T = 1.25;
export const WASH_EMPTY = 2.2; // 只有泥沙时的冲洗
export const WASH_SPEEDUP = 2.4; // A 加快倍率

// 水
export const WATER = {
  kView: 0.034, // 视线在水里每米的衰减
  kDown: 0.038, // 光从水面下到物体每米的衰减
  shallow: [0.36, 0.74, 0.70],
  deep: [0.03, 0.17, 0.27],
};

export const SUN_DIR = [0.18, 0.86, 0.42]; // 指向太阳（会被归一化）：高、偏南，沉船两面都照得到

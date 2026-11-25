// 帧标记：记下这一帧里发生了哪些“可能贵”的事（新界面、生成完一块地形、揭宝换阶段……），长帧记录里一起带出，便于定位卡顿
export const frameTags = [];
export function tag(s) { if (frameTags.length < 24) frameTags.push(s); }

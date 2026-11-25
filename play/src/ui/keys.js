// 按键：写成键帽，只写玩家正在用的那一种设备（键鼠或手柄）——同一个键不写两种说法。
// 屏幕上只在第一次到一个地方时飞进来几行（航行、作业）；全部按键只在“操作说明”里列一张表。

const GLYPH = {
  kb: { A: '空格', C: 'C', Y: 'Tab', start: 'Esc', move: 'W A S D', throttle: 'W S', steer: 'A D', look: 'Q E', click: '左键' },
  pad: { A: 'Ⓐ', C: 'Ⓑ', Y: 'Ⓨ', start: 'Start', move: '左摇杆', throttle: '左摇杆', steer: '左摇杆', look: '右摇杆', click: '' },
};
export function glyph(action, dev = 'kb') { return (GLYPH[dev] || GLYPH.kb)[action] || ''; }
// 一组键帽（“W S” 是两个键）
export function cap(action, dev = 'kb') {
  const g = glyph(action, dev);
  return g ? `<span class="kc">${g.split(' ').map((t) => `<i>${t}</i>`).join('')}</span>` : '';
}

// 第一次到这个地方：几行最要紧的键（手柄上同一根摇杆的合成一行）
const FIRST = {
  sail: [['throttle', '开船'], ['steer', '转向'], ['Y', '作业'], ['look', '转视角']],
  work: [['move', '移臂'], ['click', '点落点'], ['Y', '航行']],
};
export function firstKeys(place, dev = 'kb') {
  const rows = [];
  for (const [a, t] of FIRST[place] || []) {
    const g = glyph(a, dev);
    if (!g) continue;
    const same = rows.find((r) => r.g === g);
    if (same) same.t += '、' + t; else rows.push({ a, g, t });
  }
  return rows.map((r) => [cap(r.a, dev), r.t, r.a]); // 第三项是哪个动作（第一次进作业时用过的打勾，F3）
}

// 操作说明：一张表（做什么 / 键鼠 / 手柄）
export const HELP = [
  ['开船、转向', 'W A S D', '左摇杆'],
  ['航行 ⇄ 作业', 'Tab', 'Ⓨ'],
  ['移动臂端', 'W A S D · 左键', '左摇杆'],
  ['下网、加快冲洗、再来一次', '空格', 'Ⓐ'],
  ['转视角、俯仰', 'Q E · R F', '右摇杆'],
  ['远近', '滚轮', 'LB RB'],
  ['收起结果卡', 'C', 'Ⓑ'],
  ['暂停', 'Esc', 'Start'],
  ['隐藏界面', 'F1', ''],
];
export function capsOf(text) { return text ? text.split(' · ').map((part) => `<span class="kc">${part.split(' ').map((t) => `<i>${t}</i>`).join('')}</span>`).join('') : ''; }

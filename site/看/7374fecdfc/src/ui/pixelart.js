// 界面上的像素画：面板框、铜牌、货签、纸边……按场景的像素大小（3 屏幕像素一格）画，和船上的东西是一套。
// 每张是 12×12 格的九宫格（四角 4 格不拉伸，中间那一格行列都是匀的），挂成 CSS 变量给 border-image 用。
const PX = 3;

function paint(rows, pal) {
  const h = rows.length, w = rows[0].length;
  const cv = document.createElement('canvas');
  cv.width = w * PX;
  cv.height = h * PX;
  const c = cv.getContext('2d');
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const k = rows[y][x];
      if (k === '.' || !pal[k]) continue;
      c.fillStyle = pal[k];
      c.fillRect(x * PX, y * PX, PX, PX);
    }
  }
  return cv.toDataURL();
}

// 铁皮面板：黑描边、青铁边框（上左受光、下右背光）、内沟，四角各一块带铆钉的铜角
const IRON = [
  '.oooooooooo.',
  'oLLMaaaaLLMo',
  'oLHDbbbbLHDo',
  'oMDDggggMDDo',
  'oabg....gbco',
  'oabg....gbco',
  'oabg....gbco',
  'oabg....gbco',
  'oLLMggggLLMo',
  'oLHDbbbbLHDo',
  'oMDDccccMDDo',
  '.oooooooooo.',
];
const IRON_PAL = {
  o: '#04090b', a: '#4f7174', b: '#2b474b', c: '#13242a', g: '#081215',
  L: '#f2d08a', M: '#b98b3e', D: '#6a4719', H: '#fff7dc',
};

// 铜牌：模式牌、选中的菜单、按钮。四角各一颗凸起的铆钉
const BRASS = [
  '.oooooooooo.',
  'oWWWWWWWWWWo',
  'oWhmFFFFhmDo',
  'oWmdFFFFmdDo',
  'oWFFFFFFFFDo',
  'oWFFFFFFFFDo',
  'oWFFFFFFFFDo',
  'oWFFFFFFFFDo',
  'oWhmFFFFhmDo',
  'oWmdFFFFmdDo',
  'oSDDDDDDDDDo',
  '.oooooooooo.',
];
const BRASS_PAL = {
  o: '#2a1806', W: '#ffe7a6', F: '#e2ad4c', D: '#8a5e1f', S: '#b88838',
  h: '#fff6d6', m: '#c6913a', d: '#5a3a12',
};
// 暗铜牌：没选中的按钮
const BRASS_DIM_PAL = {
  o: '#04090b', W: '#5b6f68', F: '#22363a', D: '#0f1d21', S: '#2b3f40',
  h: '#c9a865', m: '#7a6236', d: '#2a1e0e',
};

// 货签：牛皮纸，左边两角斜切（签孔另画）
const TAG = [
  '...oooooooo.',
  '..oTTTTTTTTo',
  '.oTPPPPPPPSo',
  'oTPPPPPPPPSo',
  'oTPPPPPPPPSo',
  'oTPPPPPPPPSo',
  'oTPPPPPPPPSo',
  'oTPPPPPPPPSo',
  'oTPPPPPPPPSo',
  '.oTPPPPPPPSo',
  '..oSSSSSSSSo',
  '...oooooooo.',
];
const TAG_PAL = { o: '#3a2814', T: '#fff3d2', P: '#e8d3a0', S: '#bf9f62' };
const TAG_GOLD_PAL = { o: '#3a2006', T: '#fff1b0', P: '#f3cf6a', S: '#b9822a' };

// 签孔：铜圈，中间一个洞
const EYE = [
  '.oooo.',
  'oLLLMo',
  'oLKKDo',
  'oMKKDo',
  'oMDDDo',
  '.oooo.',
];
const EYE_PAL = { o: '#3a2814', L: '#f2d08a', M: '#c99a48', D: '#7a5420', K: '#24170a' };

// 纸：收获单。台阶形的角、烤黄的边
const PAPER = [
  '..oooooooo..',
  '.oeeeeeeeeo.',
  'oesssssssseo',
  'oesPPPPPPseo',
  'oesPPPPPPseo',
  'oesPPPPPPseo',
  'oesPPPPPPseo',
  'oesPPPPPPseo',
  'oesPPPPPPseo',
  'oesssssssseo',
  '.oeeeeeeeeo.',
  '..oooooooo..',
];
const PAPER_PAL = { o: '#3e2c18', e: '#b4935e', s: '#dcc89c', P: '#ecdfc1' };

// 装饰卷草：珍贵物名字两边。杆从外往里变粗，靠字的一头是一颗菱形和一个点；描边自动加
function flourish() {
  const W = 40, H = 11, cy = 5;
  const g = Array.from({ length: H }, () => Array(W).fill('.'));
  // 外头一个小卷
  for (const [x, y] of [[2, 2], [3, 2], [4, 2], [1, 3], [1, 4], [5, 3], [5, 4], [2, 5], [3, 5], [4, 5], [3, 4]]) g[y][x] = 'G';
  for (let x = 5; x <= 30; x++) {
    g[cy][x] = 'G';
    if (x > 12) { g[cy - 1][x] = 'W'; }
    if (x > 18) { g[cy + 1][x] = 'g'; }
  }
  // 菱形
  const dx = 33, r = 4;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const d = Math.abs(x - dx) + Math.abs(y - cy);
      if (d > r) continue;
      const s = x - dx + y - cy;
      g[y][x] = s < -1 ? 'W' : s > 1 ? 'g' : 'G';
    }
  }
  g[cy][38] = 'G';
  // 描边
  const out = g.map((row) => row.slice());
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (g[y][x] !== '.') continue;
      const n = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b]) => g[y + b] && g[y + b][x + a] && g[y + b][x + a] !== '.');
      if (n) out[y][x] = 'o';
    }
  }
  return out.map((r) => r.join(''));
}
const FLOURISH_PAL = { o: '#3a1e04', W: '#fff1b8', G: '#ffd36a', g: '#c0821c' };

let done = false;
export function installArt() {
  if (done || typeof document === 'undefined') return;
  done = true;
  const s = document.documentElement.style;
  s.setProperty('--px-iron', `url(${paint(IRON, IRON_PAL)})`);
  s.setProperty('--px-brass', `url(${paint(BRASS, BRASS_PAL)})`);
  s.setProperty('--px-brass-dim', `url(${paint(BRASS, BRASS_DIM_PAL)})`);
  s.setProperty('--px-tag', `url(${paint(TAG, TAG_PAL)})`);
  s.setProperty('--px-tag-gold', `url(${paint(TAG, TAG_GOLD_PAL)})`);
  s.setProperty('--px-eye', `url(${paint(EYE, EYE_PAL)})`);
  s.setProperty('--px-paper', `url(${paint(PAPER, PAPER_PAL)})`);
  s.setProperty('--px-iron-red', `url(${paint(IRON, { ...IRON_PAL, a: '#a0574a', b: '#6a2c22', c: '#341511', g: '#160807' })})`);
  const fl = flourish();
  s.setProperty('--px-flourish-l', `url(${paint(fl, FLOURISH_PAL)})`);
  s.setProperty('--px-flourish-r', `url(${paint(fl.map((r) => [...r].reverse().join('')), FLOURISH_PAL)})`);
}

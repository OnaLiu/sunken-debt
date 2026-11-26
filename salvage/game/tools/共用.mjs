// 共用的系统查一遍：node tools/共用.mjs
// 1. src/ 下每一份 .js 都在 共用的系统.md 里认了归哪一类（共用的系统／一片海一份的／工具和页面），没认的、认了两次的、写了却不在的都列出来。
// 2. 共用的那几份里不写死哪一片海：玩家看得到的海名、地名不在代码里（去表里，seas.js 问），
//    直接从 world/layout.js 拿沙湾摆放的列出来（下一片海接进来时改成问 world/seas.js 的 SEA；列着不算错，数目多了才要看）。
// 有毛病退出码 1。
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const game = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const doc = fs.readFileSync(path.join(game, '共用的系统.md'), 'utf8');

// 文档里每一类底下认的文件：「## 」标题下出现的 `src/...js`
const kinds = {};
let cur = null;
for (const line of doc.split('\n')) {
  const h = line.match(/^## (.+)/);
  if (h) { cur = h[1].trim(); continue; }
  if (!cur) continue;
  for (const m of line.matchAll(/`(src\/[^`\s]+?\.js)`/g)) (kinds[cur] = kinds[cur] || new Set()).add(m[1]);
}
const SHARED = '共用的系统', SEA = '一片海一份的', TOOL = '工具和页面', LEFT = '还没收成一份的';
for (const k of [SHARED, SEA, TOOL]) if (!kinds[k]) { console.log(`共用的系统.md 里没有「## ${k}」`); process.exit(1); }

const files = [];
(function walk(d) {
  for (const f of fs.readdirSync(path.join(game, d), { withFileTypes: true })) {
    const p = d + '/' + f.name;
    if (f.isDirectory()) walk(p);
    else if (f.name.endsWith('.js')) files.push(p);
  }
})('src');

const bad = [];
const where = (f) => [SHARED, SEA, TOOL].filter((k) => kinds[k].has(f));
for (const f of files) {
  const w = where(f);
  if (!w.length) bad.push(`没认归哪一类：${f}`);
  if (w.length > 1) bad.push(`认了两类（${w.join('、')}）：${f}`);
}
for (const k of [SHARED, SEA, TOOL, LEFT]) for (const f of kinds[k] || []) if (!files.includes(f)) bad.push(`「${k}」里写了、却没有这份：${f}`);

// 共用的里不写死海名、地名（注释不算）
const seaWords = ['归潮沙湾', '锈钟峡', '无光层', '债底', '通透浅滩', '港外航路', '深槽'];
const layoutUse = [];
// 效果清单的说明（效果页上给做游戏的人看的「什么时候、想要的感受」）不是游戏里玩家看的字，不查海名
const NOTE_ONLY = new Set(['src/fx/fxtext.js', 'src/fx/registry.js']);
for (const f of kinds[SHARED]) {
  if (!files.includes(f)) continue;
  const src = fs.readFileSync(path.join(game, f), 'utf8');
  src.split('\n').forEach((line, i) => {
    const code = line.replace(/\/\/.*$/, '');
    for (const m of code.matchAll(/(['"`])([^'"`\n]*)\1/g)) {
      const w = seaWords.find((s) => m[2].includes(s));
      // 表的 id（T('地名·深槽')、'海·沙湾'）不是玩家看的字
      if (w && !NOTE_ONLY.has(f) && !/^(地名|海|出处)·/.test(m[2])) bad.push(`共用的里写死了「${w}」：${f}:${i + 1}`);
    }
  });
  const im = src.match(/import\s*\{([^}]*)\}\s*from\s*'[./]*(?:world\/)?layout\.js'/);
  if (im) {
    // 东西的样子（ITEM_DEFS）是全游戏一份的捞获定义，不算沙湾的摆放
    const names = im[1].split(',').map((s) => s.trim()).filter((s) => s && s !== 'ITEM_DEFS');
    if (names.length) layoutUse.push(`${f}：${names.join('、')}`);
  }
}

const count = (k) => (kinds[k] ? kinds[k].size : 0);
console.log(`src 里 ${files.length} 份：共用的系统 ${count(SHARED)}，一片海一份的 ${count(SEA)}，工具和页面 ${count(TOOL)}`);
console.log(`共用的里直接拿沙湾摆放的 ${layoutUse.length} 份（下一片海接进来时改成问 SEA）：`);
for (const l of layoutUse) console.log('  ' + l);
if (bad.length) {
  console.log(`\n毛病 ${bad.length} 处：`);
  for (const b of bad) console.log('  ' + b);
  process.exit(1);
}
console.log('\n没有毛病：每一份都认了归哪一类，共用的里没写死海名、地名。');

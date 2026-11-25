// 排字：玩家看得到的字怎么排，游戏和审表页共用这一份（L2-game/flow.md「审表」）。
// 规矩是用户在禁忌当铺（当时叫诡异古董店）审卡页上一遍遍调定的（2026-11-09～11-12，L2-game/flow-iterations.md）：
// 【名词】照这个游戏的名词表分类上色、名词表里没有的标出来；属性、能量这类有图的【火】画成图；数字醒目、颜色跟着它数的东西；
// 一条效果一行、前面一个点；{颜色:字} 手写上色；照《炉石传说》不画括号、关键词加粗（默认就这样，look.bold 写 false 才关）。
// 2026-11-14 起：玩家看到的字处处这样（卡上、界面、文案），游戏里和审卡页上一个样；名词表一个游戏一张、带类别（L2-game/full-design/rounds/f05-tables.md）。
//
// 表里的字这样写（写表的轮次照这里写；审表页只给用户看，2026-11-14 起页面上不再教怎么写）：
//   名词写在【】里：照名词表的类别上色，不画括号、加粗，后面跟的冒号一起加粗（【打中时】：）；名词表里没有的标波浪线，就是写错了或名词表漏了。
//   名词表里的词（两个字以上）在玩家看到的字里处处写成【词】：没写的是漏标，审卡页上标虚线（biao.py terms 也列出来）；故意不标的短语写在名词表「不标」一列。
//   look.bare 里的词不加【】也上色（look.bold.keyword 配了就不上色），不算漏标。
//   属性、能量这类 look.icons 里有图的词写【火】，显示成图。
//   look.bold.footIcons 配了：卡上画成徽记的那几个名字（门路这类，look.card.foot.icons）写在【】里，字里画成徽记小图。
//   数字不用标：自动加粗，颜色跟着它数的东西（5点伤害、3点【护盾】、【金币】+2；没跟着东西的用 look.colors.数字；look.bold.number 配了是一个颜色）；后面跟着单位的 N 是要看局面才知道的数，一样醒目。
//   别的字要上色写 {颜色:字}：颜色是 look.colors 里的名字，或 红 橙 黄 绿 青 蓝 紫 金 灰 白。look.rules 自动上色的不用写。
//   写对了：本机生成的审表页（biao.py build）上名词、图标、徽记、颜色都是游戏里该有的样子，没有一处波浪线、一处虚线；biao.py terms 说标全了。
// 名词表每个游戏只有一张（设计里，带「类别」一列，类别就是 look.colors 里的颜色名）：审表页照它认词（biao.py 把它并进 look.terms），
// 游戏读 biao.py 生成的同一份（切过来的游戏是 gen 生成的表数据里的 look；别的游戏是每轮开工前放进 kit/名词表.js 的 globalThis.GAME_LOOK）。
//
// 用法（游戏里一样，脚本由 rounds.py 每轮放到游戏的 kit/paizi.js）：
//   const P = PaiZi.make(look, { has: f => 有没有这张图, glossary: {名词: 意思}, unmarked: 查漏标用的 {words, skip}（审表页给；游戏不用给） });
//   玩家看到的字都用它画（卡上、牌子上、界面、提示、对白），不另写一套上色加粗：审卡页上什么样，游戏里就什么样。
//   P.segs('造成6点【伤害】', 前几行)   → 一段段：{t:'text'|'kw'|'num'|'icon'|'crest'|'mark'|'bad', ...}，审表页拿它拼网页，游戏拿它画
//   P.draw(ctx, 卡面字, { x, y, w, h, size, img })  → 在画布上一行一条效果画出来，返回 { lines, over }（over：放不下）
//   换成别的语言（2026-11-18）：P.segs(译文, 前几行, 中文原句, 中文前几行)、P.draw(ctx, 译文, { …, src: 中文原句 })，或者 make 时给 env.source(译文) → 中文原句：
//     数的颜色照中文那一句里同一个数（伤害、护盾、状态、生命各一种，译文里认不出数的是什么）；自己拆字的游戏用 PaiZi.pairNums(译文的数, 中文的数) 对。
//     折行的标点规矩 PaiZi.isClose / isOpen 已经带着日文小假名、长音和西文标点，游戏不另补一份。
//   P.chunks('车辆的耐久。降到0时') → 换行时不能从中间断开的小块（名词表里的词整块、别的照分词、标点粘前后）；自己折行的地方照它断，一个词不拆到两行
//   （没有名词表的地方用 PaiZi.chunks(字, 词表)）。P.draw 和审表页都照它排（2026-11-17）
//   P.glossTerms(卡面字, 费用) → 卡上出现的、名词表里有的词（卡旁名词面板列哪几个）
//   PaiZi.fill('造成{伤害}点伤害', 这一行) → 字里的 {列名} 换成这一行的值（审表配置写了 fill: true 的表）
//   会换的词和画成图标的词：表里写 {n}（局面里才定的数）、〔金币〕（游戏里画成图标的词）的，排出来不露这些记号，照玩家看到的样子：
//     〔词〕有图（look.icons）画图，没图照关键词的样子；{词} 换成 env.slots 里给的那个（审卡页给审表配置的 vary），没给的画成醒目的 N。
//     游戏自己知道这一刻的数，先换好再给（2026-11-15，载具求生审卡页露〔车身〕〔金币〕、何医生那张露 {n}）。
(function (root) {
  'use strict';
  // 谁都能用的颜色；游戏可以在 look.colors 里加自己的（比如「名词」）
  const PALETTE = { 红: '#ff6b5e', 橙: '#ff9f43', 黄: '#ffd84d', 绿: '#6fd17f', 青: '#4fd1c5', 蓝: '#6fa8ff', 紫: '#c08bff', 金: '#ffc846', 灰: '#9a9890', 白: '#f5f0e6' };
  // 手写上色：{红:这几个字}，全角半角都认
  const MARK = /[{｛]([^:：{}｛｝\n]{1,8})[:：]([^{}｛｝]*)[}｝]/g;
  // N 是要看局面才知道的数（上个敌方回合你【挨打】N次）：后面跟着单位时和数字一样醒目、一样跟它数的东西上色，战斗里换成现在的数（不认「几」：名词表的说明里「有几个」「打几下」是平常的话）
  const UNIT = '点|层|次|个回合|个|张|件|回合|种|只';
  const VAR = '(?<![A-Za-z])N(?=' + UNIT + ')';
  const NUM = new RegExp('(?:[+＋\\-－]?\\d+(?:\\.\\d+)?%?|' + VAR + ')(?:' + UNIT + ')?', 'g');
  const NUMB = new RegExp('[+＋\\-－]?\\d+(?:\\.\\d+)?%?|' + VAR + '', 'g');  // look.bold：只有数本身加粗，「点」「层」照常
  const LEAD = new RegExp('^(?:、[+＋\\-－]?\\d+(?:\\.\\d+)?%?)*(?:' + UNIT + ')?');
  const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // {列名}（不带冒号）换成同一行那一列的值：卡上写的数就是游戏算的那一列（审表配置 fill: true 时，审表页和游戏都照它换）
  const fill = (str, values) => String(str == null ? '' : str).replace(/[{｛]([^:：{}｛｝\n]{1,16})[}｝]/g,
    (m, k) => values && Object.prototype.hasOwnProperty.call(values, k) && values[k] != null ? String(values[k]) : m);

  // —— 换行不拆词：一段平常的字拆成不能从中间断开的小块（用户 2026-11-17：审表页上「车辆趴」换行「窝。」、牌子上「耐」「久」拆在两行） ——
  //   名词表里的词（words）整块；别的照中文分词（Intl.Segmenter，没有它的浏览器退回一个字一块）；
  //   收尾的标点（，。、；：！？）」』……）粘在前一块上，不落到下一行开头；开头的标点（（「『《“）粘在后一块上，不留在上一行末尾。
  //   一块比一整行还宽时由画的那一方逐字断（P.draw、审表页的 overflow-wrap），字不溢出。
  // 换成别的语言也一样（2026-11-18，禁忌当铺换成日文、西文时看到的）：日文的小假名（ゃ っ ォ）、长音「ー」、「々」「・」和西文的 ,.;:!?) 一样不放行首；
  //   西文开头的 ¿ ¡ „ 不留行尾；法文「manquante :」「jeu !」标点前的空格和标点一起粘在前一个词后面；不断行的空格（\u00A0 \u202F）前后都粘着。
  const OPEN = '([{（［｛「『《〈【〔〖〘〚“‘„‚¿¡';
  const CLOSE = ')]}）］｝」』》〉】〕〗〙〛”’，。、；：！？,.;:!?…‥—～〜%％·・‼⁇⁈⁉' +
    'ぁぃぅぇぉっゃゅょゎゕゖァィゥェォッャュョヮヵヶㇰㇱㇲㇳㇴㇵㇶㇷㇸㇹㇺㇻㇼㇽㇾㇿーゝゞヽヾ々〻゛゜';
  const FUNC = '的了着过是在和与及或都也就还被把给让对向从为而又';
  const NB = '\u00A0\u202F\u2007\u2060';  // 不断行的空格：前后的字粘在一起
  const brk = c => !!c && /\s/.test(c) && !NB.includes(c);  // 能在这里折行的空格
  const endsBrk = s => brk(String(s).slice(-1));
  const startsBrk = s => brk(String(s)[0]);
  // 一块里分隔的「 · 」「 / 」（前面带空格）也算收尾：粘在前一块后面，折行不落在下一行开头（满载而归 2026-11-15，biao.js glueSeps 同一条）；
  // 空格后面跟着收尾标点的（法文「 :」「 !」）一样
  const isClose = s => {
    if (!s) return false;
    s = String(s);
    if (CLOSE.includes(s[0]) || NB.includes(s[0])) return true;
    const t = s.replace(/^\s+/, '');
    return t !== s && !!t && (t[0] === '/' || CLOSE.includes(t[0]));
  };
  const isOpen = s => !!s && (OPEN.includes(s[s.length - 1]) || NB.includes(s[s.length - 1]));
  let SEG = null, GSEG = null;
  try { SEG = typeof Intl === 'object' && Intl.Segmenter ? new Intl.Segmenter('zh-Hans', { granularity: 'word' }) : null; } catch (e) { SEG = null; }
  // 逐字断时一个「字」是看得见的一个字：泰文、越南文叠在字母上下的记号跟着字母，不拆开
  try { GSEG = typeof Intl === 'object' && Intl.Segmenter ? new Intl.Segmenter(undefined, { granularity: 'grapheme' }) : null; } catch (e) { GSEG = null; }
  const graphemes = s => (GSEG ? [...GSEG.segment(String(s))].map(x => x.segment) : [...String(s)]);
  const wordsRe = new Map();  // 同一份词表只编一次
  function chunks(str, words) {
    const s = String(str == null ? '' : str), toks = [];
    if (!s) return toks;
    const list = (words || []).filter(w => typeof w === 'string' && w.length > 1);
    const key = list.join('\u0001');
    let re = wordsRe.get(key);
    if (re === undefined) { re = list.length ? new RegExp(list.slice().sort((a, b) => b.length - a.length).map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'), 'g') : null; wordsRe.set(key, re); }
    // 分词器的词典不全（「产出」「更久」「矿车」会分成单字）：连着的单字合成一块；合起来超过 4 个字的，只在虚字（的、在、都……）后面断开
    const loose = t => {
      if (!t) return;
      const segs = SEG ? [...SEG.segment(t)].map(x => x.segment) : [...t];
      let run = '';
      const flushRun = () => {
        if (!run) return;
        if ([...run].length <= 4) { toks.push(run); run = ''; return; }
        let part = '';
        const cs = [...run];
        cs.forEach((ch, i) => { part += ch; if (FUNC.includes(ch) && cs.length - i - 1 >= 2 && [...part].length >= 1) { toks.push(part); part = ''; } });
        if (part) toks.push(part);
        run = '';
      };
      for (const x of segs) { if (/^[㐀-鿿]$/.test(x)) run += x; else { flushRun(); toks.push(x); } }
      flushRun();
    };
    let at = 0;
    if (re) for (const m of s.matchAll(re)) { loose(s.slice(at, m.index)); toks.push(m[0]); at = m.index + m[0].length; }
    loose(s.slice(at));
    for (let i = 0; i + 1 < toks.length; i++) if (/^\s+$/.test(toks[i]) && toks[i + 1] && (toks[i + 1][0] === '/' || CLOSE.includes(toks[i + 1][0]))) toks.splice(i, 2, toks[i] + toks[i + 1]);
    const out = [];
    for (const t of toks) {
      const prev = out.length ? out[out.length - 1] : '';
      if (prev && !endsBrk(prev) && (isClose(t) || (isOpen(prev) && !startsBrk(t)))) out[out.length - 1] = prev + t;
      else out.push(t);
    }
    return out;
  }

  // —— 换成别的语言：数的颜色照中文那一句里同一个数（用户 2026-11-18：「卡上的数换成别的语言也照中文分颜色」，伤害、护盾、状态、生命各一种） ——
  //   别的语言里认不出一个数数的是伤害、护盾还是层数，所以不在译文里猜：照中文原句排一遍，译文里的数一个个对到中文里同一个数，用它的颜色。
  //   pairNums(译文里的数, 中文里的数) → 每个数对上中文第几个（-1 对不上）：数一样的按先后对；两边一样多、有的数对不上（译文换了说法）的照同一个位置。
  //   全角、阿拉伯文的数字也认得出是同一个数。自己拆字的游戏也照它对（PaiZi.pairNums），不另写一套。
  const DIGIT = s => String(s).replace(/[０-９]/g, d => String(d.charCodeAt(0) - 0xFF10))
    .replace(/[٠-٩]/g, d => String(d.charCodeAt(0) - 0x660)).replace(/[۰-۹]/g, d => String(d.charCodeAt(0) - 0x6F0));
  const numKey = s => { const m = /\d+(?:\.\d+)?|N/.exec(DIGIT(s)); return m ? m[0] : String(s); };
  function pairNums(nums, srcNums) {
    const a = (nums || []).map(numKey), b = (srcNums || []).map(numKey), used = b.map(() => false);
    const out = a.map(k => { const j = b.findIndex((x, n) => !used[n] && x === k); if (j >= 0) used[j] = true; return j; });
    if (a.length === b.length) out.forEach((j, i) => { if (j < 0 && !used[i]) { out[i] = i; used[i] = true; } });
    return out;
  }

  function make(look, env) {
    const L = look || {}, E = env || {};
    const has = E.has || (() => true);
    const slots = E.slots && typeof E.slots === 'object' ? E.slots : null;  // 会换的词换成什么（{n}、〔键〕）
    const glossary = E.glossary || {};
    const colors = Object.assign({}, L.colors || {});
    const icons = L.icons || {};
    const terms = new Map();
    for (const [c, ws] of Object.entries(L.terms || {})) for (const w of ws) terms.set(w, c);
    const bare = (L.bare || []).slice().sort((a, b) => b.length - a.length);
    // 换行时整块不拆的词：名词表里的（词里带【】{} 的短语不算）、look.terms 里的、look.bare 里的、这个游戏自己加的 look.words
    const keepWords = [...new Set([...Object.keys(glossary), ...terms.keys(), ...bare, ...(L.words || [])])]
      .filter(w => typeof w === 'string' && w.length > 1 && w.length <= 12 && !/[【】{}｛｝〔〕\s\n]/.test(w));
    const chunksOf = s => chunks(s, keepWords);
    const rules = (L.rules || []).map(r => ({ re: r.re, color: r.color, say: r.say }));
    const B = L.bold === false ? null : (L.bold && typeof L.bold === 'object' ? L.bold : {});  // 加粗默认就开（用户 2026-11-14）
    const foot = L.card && L.card.foot;
    const badges = B && B.footIcons && foot && typeof foot === 'object' ? foot.icons || {} : {};
    const matchers = rules.map(r => ({ kind: 'rule', re: new RegExp(r.re, 'g'), r }))
      .concat([{ kind: 'term', re: /【([^】\n]{1,12})】/g }])
      .concat(bare.length && (!B || !B.keyword) ? [{ kind: 'bare', re: new RegExp(bare.map(esc).join('|'), 'g') }] : [])
      .concat([{ kind: 'slot', re: /〔([^〔〕\n]{1,12})〕|[{｛]([^:：{}｛｝\n]{1,16})[}｝]/g }])
      .concat([{ kind: 'num', re: B ? NUMB : NUM }]);

    const colorOf = name => (name && (colors[name] || PALETTE[name])) || null;
    const termColor = w => colorOf(terms.get(w)) || colorOf('名词') || PALETTE.蓝;
    const kwColor = w => (B && B.keyword) || (w && terms.has(w) ? termColor(w) : null) || colorOf('名词') || PALETTE.金;
    const numColorFixed = () => B && B.number ? B.number : null;
    const badgeOf = w => { const f = badges[w]; return f && has(f) ? f : null; };
    // 有图：图的路径；词在 look.icons 里但图还没有：''；不是图标词：null
    const iconOf = w => { const f = icons[w]; return f && has(f) ? f : f ? '' : null; };

    let prevText = '';  // 卡面上这一行前面的几行（「改为」找它换掉的那个数）
    // 漏标：名词表里的词没写成【词】的地方（和 biao.py missing_marks 同一个认法：长的先认，【】{} 〔〕 里的不查，名词表「不标」写着的短语里的不算）
    const UN = E.unmarked && Array.isArray(E.unmarked.words) && E.unmarked.words.length ? E.unmarked : null;
    function missing(s) {
      if (!UN) return [];
      const masked = new Uint8Array(s.length), out = [];
      for (const m of s.matchAll(/【[^】\n]{1,12}】|[{｛][^{}｛｝\n]*[}｝]|〔[^〔〕\n]*〕/g)) masked.fill(1, m.index, m.index + m[0].length);
      for (let i = 0; i < s.length;) {
        const w = masked[i] ? null : UN.words.find(x => s.startsWith(x, i) && !masked.subarray(i, i + x.length).some(Boolean));
        if (!w) { i++; continue; }
        const skip = (UN.skip && UN.skip[w]) || [];
        if (!skip.some(p => p.includes(w) && i >= p.indexOf(w) && s.startsWith(p, i - p.indexOf(w)))) out.push({ a: i, b: i + w.length, w });
        i += w.length;
      }
      return out;
    }
    let misses = [];  // 这一段字里漏标的位置（segs 开头算好，text 拆的时候照它）
    // 数字数的是什么：紧跟在后面的【名词】或词（「N次7点伤害」隔着一个数也算），或者紧挨在前面的（【护盾】+2、伤害+4、生命12、【出手】过N次）；
    // 都没有、前面是「改为」的（改为3次、改为14点），跟它换掉的那个同单位的数一个颜色
    function numColor(s, start, end) {
      let after = s.slice(end).replace(LEAD, '');
      if (/^(?:[+＋\-－]?\d|N)/.test(after)) after = after.replace(/^(?:[+＋\-－]?\d+(?:\.\d+)?%?|N)/, '').replace(LEAD, '');
      let m = /^【([^】\n]{1,12})】/.exec(after);
      if (m) return icons[m[1]] ? null : termColor(m[1]);
      for (const w of bare) if (after.startsWith(w)) return colorOf(terms.get(w));
      const before = s.slice(0, start);
      m = /【([^】\n]{1,12})】过?$/.exec(before);
      if (m) return icons[m[1]] ? null : termColor(m[1]);
      for (const w of bare) if (before.endsWith(w)) return colorOf(terms.get(w));
      if (/改为$/.test(before)) {
        const pre = prevText ? prevText + '\n' : '', all = pre + before;  // 卡面一行一行画，被换掉的数常在上一行（造成4点伤害2次 / ……改为3次）
        const u = new RegExp('^[+＋\\-－]?(?:\\d+(?:\\.\\d+)?%?|N)(' + UNIT + ')').exec(s.slice(start));
        if (u) {
          let c = null;  // 「第3次【出手】起」这类数的是第几次，不是被换掉的那个数
          for (const x of all.matchAll(new RegExp('[+＋\\-－]?\\d+(?:\\.\\d+)?%?(?=' + esc(u[1]) + ')', 'g'))) {
            if (all[x.index - 1] === '第') continue;
            const k = numColor(all, x.index, x.index + x[0].length); if (k) c = k;
          }
          return c;
        }
      }
      return null;
    }
    const text = (out, s, base) => {
      if (!s) return;
      let at = 0;
      if (base != null) for (const x of misses) {
        if (x.a < base + at || x.b > base + s.length) continue;
        if (x.a > base + at) out.push({ t: 'text', s: s.slice(at, x.a - base) });
        out.push({ t: 'miss', s: x.w, w: x.w, title: '名词表里有「' + x.w + '」，这里没写成【' + x.w + '】：漏标了，或者这一处写进名词表「不标」' });
        at = x.b - base;
      }
      if (at < s.length) out.push({ t: 'text', s: s.slice(at) });
    };
    // 已经上了色的一段里，数字照样加粗
    function nums(out, s) {
      let last = 0;
      for (const m of s.matchAll(B ? NUMB : NUM)) {
        text(out, s.slice(last, m.index));
        out.push({ t: 'num', s: m[0], color: numColorFixed() });
        last = m.index + m[0].length;
      }
      text(out, s.slice(last));
    }
    function auto(out, s, base) {
      let at = 0;
      while (at < s.length) {
        let best = null;
        for (const x of matchers) {
          x.re.lastIndex = at;
          let m = x.re.exec(s);
          while (m && !m[0]) { x.re.lastIndex = m.index + 1; m = x.re.exec(s); }
          if (m && (!best || m.index < best.m.index)) best = { x, m };
        }
        if (!best) break;
        const { x, m } = best;
        let end = m.index + m[0].length;
        text(out, s.slice(at, m.index), base == null ? null : base + at);
        if (x.kind === 'term') {
          const w = m[1], ic = iconOf(w), known = terms.has(w), unk = '名词表里没有「' + w + '」：写错了，还是要加进名词表？';
          if (ic !== null) out.push({ t: 'icon', w, src: ic });
          else if (B && badgeOf(w)) out.push({ t: 'crest', w, src: badgeOf(w) });
          else if (B) {
            const colon = /^[：:]/.test(s.slice(end)) ? s[end] : '';
            end += colon.length;
            out.push({ t: 'kw', w, s: w + colon, bold: true, known, color: kwColor(w), title: known ? glossary[w] || terms.get(w) : unk });
          } else out.push({ t: 'kw', w, s: m[0], bold: false, known, color: termColor(w), title: known ? terms.get(w) : unk });
        } else if (x.kind === 'slot') {
          const v = slots && Object.prototype.hasOwnProperty.call(slots, m[0]) && slots[m[0]] != null ? String(slots[m[0]]) : null;
          if (m[1] != null && v != null) nums(out, v);  // 〔键〕→ E
          else if (m[1] != null) {
            const w = m[1], ic = iconOf(w);
            if (ic !== null) out.push({ t: 'icon', w, src: ic });
            else out.push({ t: 'kw', w, s: w, bold: !!B, known: true, color: kwColor(w), title: glossary[w] || w });
          } else out.push({ t: 'num', s: v != null ? v : 'N', color: B && B.number ? B.number : numColor(s, m.index, end) || colorOf('数字') });
        } else if (x.kind === 'num') {
          out.push({ t: 'num', s: m[0], color: B && B.number ? B.number : numColor(s, m.index, end) || colorOf('数字') });
        } else {
          const kids = []; nums(kids, m[0]);
          out.push({ t: 'mark', color: x.kind === 'bare' ? colorOf(terms.get(m[0])) : colorOf(x.r.color), kids });
        }
        at = end;
      }
      text(out, s.slice(at), base == null ? null : base + at);
    }
    // 一段段里的数（{} 上色的、look.rules 上色的那几段里的也算），带它画出来的颜色
    const numsIn = (list, inherit, acc) => {
      for (const g of list) { if (g.t === 'num') acc.push({ g, color: g.color || inherit || null }); else if (g.t === 'mark') numsIn(g.kids, g.color || inherit, acc); }
      return acc;
    };
    // 一段字拆成一段段；prev 是卡面上这一行前面的几行。
    // 换成别的语言时给 src（这一句的中文原句，srcPrev 是中文这一行前面的几行；没给时问 env.source(这一句)）：数的颜色照中文里同一个数
    function segs(str, prev, src, srcPrev) {
      const out = [], keep = prevText, keepMiss = misses;
      prevText = prev || '';
      let last = 0;
      str = String(str);
      misses = missing(str);
      for (const m of str.matchAll(MARK)) {
        auto(out, str.slice(last, m.index), last);
        const c = colorOf(m[1]);
        const kids = []; nums(kids, m[2]);
        out.push(c ? { t: 'mark', color: c, kids } : { t: 'bad', s: m[0], title: '不认得「' + m[1] + '」这个颜色，上面「怎么写」里有能用的' });
        last = m.index + m[0].length;
      }
      auto(out, str.slice(last), last);
      prevText = keep; misses = keepMiss;
      if (src === undefined && typeof E.source === 'function') src = E.source(str);
      if (src != null && String(src) !== str && !(B && B.number)) {
        const mine = numsIn(out, null, []), theirs = numsIn(segs(String(src), srcPrev || '', null), null, []);
        pairNums(mine.map(x => x.g.s), theirs.map(x => x.g.s)).forEach((j, i) => { if (j >= 0) mine[i].g.color = theirs[j].color; });
      }
      return out;
    }
    // 卡上出现的、名词表里有的词：【】里的、费用里画成图的（维护、献血），plain 里不加【】也认的
    function glossTerms(str, spend, plain) {
      const G = glossary, s = String(str || ''), seen = [];
      for (const m of s.matchAll(/【([^】\n]{1,12})】/g)) if (G[m[1]] && iconOf(m[1]) === null && !seen.includes(m[1])) seen.push(m[1]);
      for (const m of String(spend || '').matchAll(/([^\d、，,\s·；;]+?)([1-9]\d*)/g)) if (G[m[1]] && iconOf(m[1]) === null && !seen.includes(m[1])) seen.push(m[1]);
      // 词里带【火】这样的，任何【】都算（「你的【火】技能」认得出「你的【体】技能」），带数字的任何数都算（「生效2次」认得出「生效3次」）
      for (const k of (plain || [])) {
        if (!G[k] || seen.includes(k)) continue;
        const re = new RegExp(esc(k).replace(/【[^】]*】/g, '【[^】]+】').replace(/\d+/g, '\\d+'));
        if (re.test(s)) seen.push(k);
      }
      return seen;
    }

    // —— 画布上画：一条效果一行，前面一个点（opts.dot === false 不加点、opts.align 'center' 居中），字超出宽度自动折行 ——
    // opts: x, y, w, h（字框），size（字号，默认 26），lineHeight（默认 1.4 倍），font（字体，默认系统黑体），color（平常字的颜色），
    //       img(src) → 已经载好的图（Image/Canvas），没有就画名字的头一个字；返回 { lines: 画了几行, over: 放不下 }
    function draw(ctx, str, opts) {
      const o = Object.assign({ size: 26, lineHeight: 1.4, font: '"PingFang SC","Microsoft YaHei","Noto Sans CJK SC",sans-serif', color: '#f2ead8', dot: true, align: 'left' }, opts || {});
      const lh = o.size * o.lineHeight, rows = [];
      const lines = s => String(s || '').split('\n').map(x => x.trim()).filter(Boolean);
      const effects = lines(str);
      // 换成别的语言：opts.src 是中文原句（没给时问 env.source），一行对一行；行数对不上的，每一行都拿整段中文去对
      const src = o.src !== undefined ? o.src : typeof E.source === 'function' ? E.source(String(str || '')) : null;
      const srcFx = src != null && String(src) !== String(str || '') ? lines(src) : null;
      const sameRows = !!srcFx && srcFx.length === effects.length;
      const fontOf = bold => (bold ? '700 ' : '400 ') + o.size + 'px ' + o.font;
      effects.forEach((line, i) => {
        // 一段段拆成不能从中间断开的小块：平常的字一个词一块（chunks：名词表里的词、分出来的词，标点粘在前后），图、数字、名词整块
        const pieces = [];
        const push = (seg, inherit) => {
          if (seg.t === 'miss') pieces.push({ s: seg.s, color: inherit || o.color, bold: !!(inherit && seg.bold) });
          else if (seg.t === 'text') for (const c of chunksOf(seg.s)) pieces.push({ s: c, color: inherit || o.color, bold: !!(inherit && seg.bold) });
          else if (seg.t === 'mark') seg.kids.forEach(k => push(k, seg.color || o.color));
          else if (seg.t === 'num') pieces.push({ s: seg.s, color: seg.color || inherit || o.color, bold: true });
          else if (seg.t === 'kw') pieces.push({ s: seg.bold ? seg.s : seg.s, color: seg.color, bold: seg.bold });
          else if (seg.t === 'icon' || seg.t === 'crest') pieces.push({ icon: seg.src, w: seg.w });
          else pieces.push({ s: seg.s, color: PALETTE.红, bold: false });
        };
        const prev = effects.slice(0, i).join('\n');
        (srcFx ? segs(line, prev, sameRows ? srcFx[i] : srcFx.join('\n'), sameRows ? srcFx.slice(0, i).join('\n') : '') : segs(line, prev)).forEach(s => push(s));
        let cur = [], width = 0;
        const dotW = o.dot && o.align !== 'center' ? o.size * 0.8 : 0;
        const room = o.w - dotW;
        const flush = first => { rows.push({ pieces: cur, width, first }); cur = []; width = 0; };
        let first = true;
        const widthOf = p => { if (p.icon !== undefined) return o.size * 1.05; ctx.font = fontOf(p.bold); return ctx.measureText(p.s).width; };
        // 收尾的标点粘着前一块、开头的标点粘着后一块（块和块之间也一样：「车辆【趴窝】。」的「。」跟着趴窝走）
        const atoms = [];
        for (const p of pieces) {
          p.width = widthOf(p);
          const prev = atoms.length ? atoms[atoms.length - 1] : null, last = prev && prev[prev.length - 1];
          const glue = (prev && p.icon === undefined && isClose(p.s)) || (last && last.icon === undefined && isOpen(last.s) && !endsBrk(last.s) && !(p.s && startsBrk(p.s)));
          if (glue && prev) prev.push(p); else atoms.push([p]);
        }
        const blank = u => u.every(p => p.icon === undefined && !p.s.trim());
        // 一块一块往行里放：放不下就折到下一行；折下来的那一行不以空格开头（空格正好放不下时也一样）
        const put = u => {
          const uw = u.reduce((n, p) => n + p.width, 0);
          if (!cur.length && !first && blank(u)) return;
          if (width + uw > room && cur.length) { flush(first); first = false; if (blank(u)) return; }
          for (const p of u) { cur.push(p); width += p.width; }
        };
        for (const a of atoms) {
          const aw = a.reduce((n, p) => n + p.width, 0);
          if (aw <= room) { put(a); continue; }
          // 一块比一整行还宽：只有这时才逐字断，字不溢出。
          // 逐字断也守标点（日文「ジャッ / ジメント」「ショット：」一整块比一行宽时看到的）：小假名、长音、收尾的标点（连同它前面的空格）粘着前一个字，
          // 开头的括号粘着后一个字，一起折下去
          const units = [];
          for (const p of a) {
            const gs = p.icon !== undefined ? [null] : graphemes(p.s);
            for (const g of gs) {
              const q = g === null ? p : Object.assign({}, p, { s: g });
              if (g !== null) q.width = widthOf(q);
              const lastU = units[units.length - 1], lastQ = lastU && lastU[lastU.length - 1];
              if (lastU && g !== null && isClose(g)) {
                if (units.length > 1 && blank(lastU)) units[units.length - 2].push(...units.pop());
                units[units.length - 1].push(q);
              } else if (lastQ && lastQ.icon === undefined && isOpen(lastQ.s) && !(g !== null && brk(g))) lastU.push(q);
              else units.push([q]);
            }
          }
          for (const u of units) put(u);
        }
        if (cur.length) flush(first);
      });
      const fits = Math.max(1, Math.floor((o.h || Infinity) / lh));
      const over = rows.length > fits;
      ctx.save();
      ctx.textBaseline = 'middle';
      rows.slice(0, fits).forEach((r, i) => {
        const cy = o.y + lh * i + lh / 2;
        const dotW = o.dot && o.align !== 'center' ? o.size * 0.8 : 0;
        let x = o.align === 'center' ? o.x + (o.w - r.width) / 2 : o.x + dotW;
        if (r.first && dotW) { ctx.fillStyle = o.color; ctx.beginPath(); ctx.arc(o.x + o.size * 0.3, cy, o.size * 0.12, 0, Math.PI * 2); ctx.fill(); }
        for (const p of r.pieces) {
          if (p.icon !== undefined) {
            const im = p.icon && o.img ? o.img(p.icon) : null;
            if (im) ctx.drawImage(im, x, cy - o.size * 0.5, o.size, o.size);
            else { ctx.font = fontOf(true); ctx.fillStyle = o.color; ctx.fillText((p.w || '?').slice(0, 1), x, cy); }
          } else { ctx.font = fontOf(p.bold); ctx.fillStyle = p.color; ctx.fillText(p.s, x, cy); }
          x += p.width;
        }
      });
      ctx.restore();
      return { lines: rows.length, over };
    }

    return { PALETTE, MARK, UNIT, fill, look: L, colors, icons, terms, bare, B, badges, colorOf, termColor, kwColor, badgeOf, iconOf, segs, glossTerms, draw, missing, chunks: chunksOf, keepWords, isClose, isOpen, pairNums };
  }

  const api = { make, fill, chunks, isClose, isOpen, pairNums, PALETTE, MARK, UNIT };
  root.PaiZi = api;
  if (typeof module === 'object' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);

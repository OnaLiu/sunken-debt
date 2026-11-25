// Go straight to a moment of the game, run a probe there, take a screenshot: the one command every game has for it (a kit file;
// rounds.py puts the committed copy in a game's tools/ before each game round, beside chrome.mjs). 2026-11-14 (调试工具体检: three
// games each grew their own, 载具求生 had three copies of one `moment.mjs` among 343 one-off folders, and rounds kept writing 2–5
// one-off scripts a round, rewriting the whole script for each new probe; user: 「其他的可以按照你的建议执行」).
//
//   node tools/moment.mjs <segment|-> [seconds,…] [options]      every moment: one line of JSON on stdout, a PNG, the probe's value
//   node tools/moment.mjs --help                                    usage, and the moments this game reaches and the probes it keeps
//
//   segment     what the game's own file's `start` takes (below; without one: a URL query such as `scenario=boss`, or a kit
//               scenario name; `-` = the page as it loads)
//   seconds     from the start of the segment (or from the moment --until found), comma separated; default 0
//   --probe JS | @file.js | @name    run in the page at every moment; its value (awaited) goes in the output. @name: one of the
//               game's kept probes (its files' `probes`). A new problem changes only the probe, never this command.
//   --until JS  fast-forward until this is true first (checked every frame); --max <s> how far to look (default 600)
//   --pre JS    run in the page right after the segment starts
//   --page P    the page (default: the game's `page`, else index.html); --url U a full URL instead
//   --out DIR   where shots and log.txt go (default <game>/.ai/试跑/moment/<name>); --name N; --size 1920x1080; --no-shot
//   --texts     every moment also lists the words on the screen in the frame the shot shows: [{s, x, y, w, h, px, color, alpha, outline, kind}] in
//               screenshot pixels (canvas fillText/strokeText, text a cached canvas carries onto the screen, and the page's own HTML text);
//               px is the size on the 1920×1080 screen. `biao.py catch` finds each line of the 文案 page with it (2026-11-16)
//   --game DIR  the game folder, when this copy of the tool is not the one in its tools/ (the skill's kit copy run on a game)
//   --realtime S  after the last moment, hand the game back to the real clock and play S seconds: frame rate and worst frame,
//               measured as chrome.mjs measureFair does (its browser at normal priority while other tests run a class down; only
//               those S seconds are the measurement; run again at once when work of the game's own priority held it back; the last
//               line says whether it measured true: one not measured true is no conclusion)
//   --hz H      the screen's refresh rate the virtual clock plays (default 60): a frame is 1/H s, so a second is a second at any H; a game
//               whose rules move in fixed steps whatever the screen does is in the same place at the same second at 60, 120 and 144
//   --still S   after the last moment, play S more seconds at --hz frame by frame: how many different pictures the page's canvases showed
//               (a pause, a card held up, a game standing still: 1) and the box where they changed, then the probe again (probeAfter: the
//               same at any --hz when the game runs as fast at any refresh rate). With the game's own clock, its clock.real hands the game
//               to the virtual clock for these frames. 2026-11-21 (满载而归: a tutorial card and Esc in a fight shook the picture on a
//               120/144 Hz screen; this tool only played 60 Hz, where it barely shows)
//
// Fast clock: with the game's own (its file's `clock`) only the last few frames before each shot are drawn; without it the page's
// requestAnimationFrame, performance.now and Date.now run on a virtual clock this tool moves (every frame drawn, still far faster than
// real time; timers set with setTimeout keep real time). The moment reached is the one playing from the start reaches.
//
// The game's own (never overwritten by the kit), where a round that made a new moment reachable leaves it: one file a line,
// tools/moment.game/<line>.mjs (--help names this copy's: the segment in .ai/line.json, 主文件夹 in the main copy), which only that line
// changes, so lines working at once never edit one file and their merges don't stop on it (载具求生 2026-11-14: the 全游戏 line and
// 第五章 each added their branch to one tools/moment.game.mjs, 16:48 and 20:33 both merges stopped on it). tools/moment.game.mjs, where
// a game began with all of it in one, is still read and no longer added to. Each file:
//   export default {
//     owns: (seg) => true | false,   // or a RegExp, or a list: the segments this file starts (the others' are theirs; the old file: the rest)
//     reaches: 'which segments and moments this reaches and how to name them',   // printed by --help: later rounds look here first
//     page: 'index.html' | (seg) => 'ch4.html',   query: (seg) => 'mute',          // the page and what goes in its URL
//     ready: 'JS, true once the page can start a segment',  start: (seg) => 'JS that starts it',
//     clock: { advance: (frames, draw) => 'JS: move frames of 1/60 s, draw the last one when draw', now: 'JS: game seconds',
//              real: 'JS: back to the real clock (for --realtime)' },             // optional: the game's own fast clock
//     pre: 'JS run before the page's own scripts',                                 // optional
//     probes: { name: 'JS' },                                                      // probes worth keeping, by name: --probe @name
//   };
// A segment is started by the first file that owns it: this line's own, then the other lines' by name, then the old file. Probes of all
// files are kept (the same name twice: the first, in that order). A file that doesn't load is left out and said on stderr.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnChrome, startMeasure, noteOf } from './chrome.mjs';

const GAME_ARG = (() => { const i = process.argv.indexOf('--game'); return i >= 0 && process.argv[i + 1] ? path.resolve(process.argv[i + 1]) : null; })();
const HERE = path.dirname(fileURLToPath(import.meta.url)), ROOT = GAME_ARG || path.dirname(HERE);
const TOOLS = GAME_ARG ? path.join(GAME_ARG, 'tools') : HERE;
const ADAPTER = path.join(TOOLS, 'moment.game.mjs'), PARTS = path.join(TOOLS, 'moment.game');
const WARM = 4; // frames drawn before a shot with the game's own clock, as a player's screen would have them
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function parse(argv) {
  const o = { pos: [], max: 600, size: [1920, 1080], shot: true };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i], v = () => argv[++i];
    if (a === '--help' || a === '-h') o.help = true;
    else if (a === '--probe') o.probe = v();
    else if (a === '--until') o.until = v();
    else if (a === '--max') o.max = +v();
    else if (a === '--pre') o.pre = v();
    else if (a === '--page') o.page = v();
    else if (a === '--url') o.url = v();
    else if (a === '--out') o.out = v();
    else if (a === '--name') o.name = v();
    else if (a === '--size') o.size = v().split(/[x×,]/).map(Number);
    else if (a === '--no-shot') o.shot = false;
    else if (a === '--texts') o.texts = true;
    else if (a === '--game') v();
    else if (a === '--realtime') o.realtime = +v();
    else if (a === '--hz') o.hz = +v();
    else if (a === '--still') o.still = +v();
    else o.pos.push(a);
  }
  o.seg = o.pos[0] && o.pos[0] !== '-' ? o.pos[0] : null;
  o.times = (o.pos[1] ?? '0').split(',').filter((x) => x !== '').map(Number).sort((a, b) => a - b);
  return o;
}

function lineName() { // the line this copy runs (chain.py line writes .ai/line.json at the repository's top); none: the main copy
  for (let d = ROOT; ; d = path.dirname(d)) {
    const f = path.join(d, '.ai', 'line.json');
    if (fs.existsSync(f)) {
      try { return String(JSON.parse(fs.readFileSync(f, 'utf8')).segment || '').replace(/[\\/:*?"<>|]+/g, '-').trim() || null; } catch { return null; }
    }
    if (fs.existsSync(path.join(d, '.git')) || path.dirname(d) === d) return null;
  }
}
const MINE = path.join(PARTS, `${lineName() || '主文件夹'}.mjs`);
const rel = (f) => path.relative(ROOT, f).split(path.sep).join('/');

async function adapters() { // [{ file, game, old }]: this line's own first, the other lines' by name, the old one-file last
  const files = fs.existsSync(PARTS) ? fs.readdirSync(PARTS).filter((n) => n.endsWith('.mjs')).sort().map((n) => path.join(PARTS, n)) : [];
  const order = [...files.filter((f) => f === MINE), ...files.filter((f) => f !== MINE)].map((file) => ({ file, old: false }));
  if (fs.existsSync(ADAPTER)) order.push({ file: ADAPTER, old: true });
  const out = [];
  for (const x of order) {
    try { const m = await import(pathToFileURL(x.file).href); out.push({ ...x, game: m.default || m }); } catch (e) {
      process.stderr.write(`${rel(x.file)} 读不进来，这一回不用它：${String(e && e.message || e).split('\n')[0]}\n`);
    }
  }
  return out;
}
const owns = (g, seg) => (typeof g.owns === 'function' ? !!g.owns(seg) : g.owns instanceof RegExp ? g.owns.test(seg)
  : Array.isArray(g.owns) ? g.owns.includes(seg) : false);

function pick(list, seg) { // the one file that starts this segment, with every file's probes
  if (!list.length) return null;
  const old = list.find((x) => x.old);
  const one = (seg !== null && list.find((x) => !x.old && owns(x.game, seg))) || old
    || (seg === null ? list.find((x) => x.file === MINE) || list[0] : null);
  if (!one) throw new Error(`不认得这一段：${seg}（${list.map((x) => rel(x.file)).join('、')} 都没写 owns 认它；--help 看到得了的）`);
  const probes = {};
  for (const x of list) for (const [k, v] of Object.entries(x.game.probes || {})) if (!(k in probes)) probes[k] = v;
  return { ...one.game, probes, from: rel(one.file) };
}
const call = (f, ...a) => (typeof f === 'function' ? f(...a) : f);

function help(list) {
  console.log(fs.readFileSync(fileURLToPath(import.meta.url), 'utf8').split('\nimport ')[0].replace(/^\/\/ ?/gm, ''));
  const where = `这一条线新做到的一刻、新攒的探针写进 ${rel(MINE)}（只有这条线改它；${list.some((x) => x.old) ? 'tools/moment.game.mjs 和' : ''}别的线那几份不改；`
    + '新的一份写上 owns，认它自己开的那几段）。';
  if (!list.length) {
    console.log('这个游戏还没有 tools/moment.game/ 也没有 tools/moment.game.mjs：现在只能用虚拟钟从页面载入（或 ?scenario=）往后推。'
      + '哪一轮让游戏能直接到某一段，把怎么到写进去（格式在上面），后面的轮次跑 --help 就看得到。' + where);
    return;
  }
  console.log('这个游戏到得了的：');
  for (const x of list) console.log(`（${rel(x.file)}）\n${x.game.reaches || '（reaches 没写）'}`);
  const p = [...new Set(list.flatMap((x) => Object.keys(x.game.probes || {})))];
  console.log(p.length ? `攒下的探针（--probe @名字）：${p.join('、')}` : '还没有攒下的探针（probes）');
  console.log(where);
}

// The virtual clock for a game without its own (installed before the page's scripts): while loading, frames run with time held;
// after __moment.hold() only __moment.advance moves it, a frame 1/hz s; __moment.real() hands it back to the real clock. Under a game's
// own clock (--still) it starts as the real clock, untouched, until hold().
const vclock = (hz, under) => `(() => { if (window.__moment) return;
  const raf = window.requestAnimationFrame.bind(window), pnow = performance.now.bind(performance), dnow = Date.now, STEP = 1000 / ${hz};
  window.__momentRaf = raf;
  const M = window.__moment = { t: 0, base: pnow(), date: dnow(), mode: '${under ? 'real' : 'load'}', q: [], errors: [], realAt: 0, hz: ${hz} };
  M.realAt = M.base;
  performance.now = () => M.mode === 'real' ? M.base + M.t + (pnow() - M.realAt) : M.base + M.t;
  Date.now = () => M.mode === 'real' ? M.date + M.t + (pnow() - M.realAt) : M.date + M.t;
  const req = (cb) => { if (M.mode === 'real') return raf((ts) => { if (M.mode === 'real') cb(M.base + M.t + (ts - M.realAt)); else M.q.push(cb); });
    M.q.push(cb); return M.q.length; };
  window.requestAnimationFrame = req;
  const run = (cbs, at) => { for (const cb of cbs) { try { cb(at); } catch (e) { M.errors.push(String(e && e.stack || e)); } } };
  const pump = () => { if (M.mode !== 'load') return; const cbs = M.q; M.q = []; run(cbs, M.base + M.t); raf(pump); };
  if (M.mode === 'load') raf(pump);
  M.hold = () => { if (M.mode === 'real') M.t += pnow() - M.realAt; M.mode = 'fast'; };
  M.advance = (n) => { for (let i = 0; i < n; i++) { M.t += STEP; const cbs = M.q; M.q = []; run(cbs, M.base + M.t); } return M.t / 1000; };
  M.now = () => M.t / 1000;
  M.real = () => { M.mode = 'real'; M.realAt = pnow(); const cbs = M.q; M.q = []; for (const cb of cbs) req(cb); };
})();`;

// --still: frame by frame on the virtual clock, every canvas on the screen copied in the task that drew it (a WebGL canvas is still readable
// there), each picture hashed and compared with the first.
const STILL = `(frames, warm) => {
  const W = innerWidth, H = innerHeight, pad = document.createElement('canvas'); pad.width = W; pad.height = H;
  const g = pad.getContext('2d', { willReadFrequently: true });
  const grab = () => { g.clearRect(0, 0, W, H);
    for (const c of document.querySelectorAll('canvas')) { if (!c.width || !c.height) continue; const r = c.getBoundingClientRect(), s = getComputedStyle(c);
      if (r.width < 1 || r.height < 1 || r.right <= 0 || r.bottom <= 0 || r.left >= W || r.top >= H || s.visibility === 'hidden' || +s.opacity === 0) continue;
      try { g.drawImage(c, r.left, r.top, r.width, r.height); } catch (e) { /* a canvas that can't be read */ } }
    return new Uint32Array(g.getImageData(0, 0, W, H).data.buffer); };
  for (let i = 0; i < warm; i++) __moment.advance(1);
  const seen = new Set(); let first = null, x0 = W, y0 = H, x1 = -1, y1 = -1, most = 0;
  for (let i = warm; i < frames; i++) {
    __moment.advance(1); const a = grab(); let h = 2166136261, diff = 0;
    for (let k = 0; k < a.length; k++) { const v = a[k]; h = Math.imul(h ^ v, 16777619);
      if (first && v !== first[k]) { diff++; const x = k % W, y = (k / W) | 0; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; } }
    if (!first) first = a; seen.add(h >>> 0); if (diff > most) most = diff;
  }
  return { pictures: seen.size, box: x1 < 0 ? null : [x0, y0, x1 - x0 + 1, y1 - y0 + 1], px: most };
}`;

// --texts: the words drawn in the frame on the screen. Every fillText/strokeText is kept with its box (through the canvas transform); a
// canvas not on the page keeps its own and hands them on when it is drawn onto one that is; a canvas cleared or painted over whole starts
// its frame again; what one task (a frame) drew on a canvas replaces what that canvas had. take() gives screenshot pixels and adds HTML text.
// Painted over whole means hidden: an opaque colour, gradient, pattern or picture at full alpha drawn normally. A dimming layer, scanlines,
// a flash, a fill at alpha 0 or a picture that is see-through leave the words under them on the screen and on the list (午夜机台 2026-11-21:
// the forge reel's 「升品！」, the siege's 「巨石阵 · 定住」 and fx.pop's words were drawn before a dim layer, a scanline pattern at alpha 0.3
// and a whole-screen box at alpha 0, and the list lost them).
const TEXTREC = `(() => { if (window.__texts) return;
  const P = CanvasRenderingContext2D.prototype, X = window.__texts = { cur: null, shown: new Map(), off: new WeakMap() };
  const fpx = (f) => { const m = /(\\d+(?:\\.\\d+)?)px/.exec(f || ''); return m ? +m[1] : 10; };
  const pt = (m, x, y) => [m.a * x + m.c * y + m.e, m.b * x + m.d * y + m.f];
  const flush = () => { const c = X.cur; X.cur = null; if (!c) return; for (const [cv, segs] of c) X.shown.set(cv, segs); };
  const cur = (cv) => { if (!X.cur) { X.cur = new Map(); queueMicrotask(flush); } let a = X.cur.get(cv); if (!a) { a = (X.shown.get(cv) || []).slice(); X.cur.set(cv, a); } return a; };
  const listOf = (cv) => cv.isConnected ? cur(cv) : (X.off.get(cv) || (X.off.set(cv, []), X.off.get(cv)));
  const restart = (cv) => { if (cv.isConnected) { cur(cv).length = 0; } else X.off.set(cv, []); };
  const whole = (ctx, x, y, w, h) => { const cv = ctx.canvas, m = ctx.getTransform(); const a = pt(m, x, y), b = pt(m, x + w, y + h);
    return Math.abs(b[0] - a[0]) * Math.abs(b[1] - a[1]) >= 0.9 * cv.width * cv.height; };
  const rec = (ctx, s, x, y, fill) => { s = String(s); const cv = ctx.canvas; if (!cv || !s.trim()) return;
    const mt = ctx.measureText(s), m = ctx.getTransform(), size = fpx(ctx.font);
    const l = x - (mt.actualBoundingBoxLeft || 0), r = x + (mt.actualBoundingBoxRight || mt.width);
    const t = y - (mt.fontBoundingBoxAscent || mt.actualBoundingBoxAscent || size * 0.8), b = y + (mt.fontBoundingBoxDescent || mt.actualBoundingBoxDescent || size * 0.2);
    const ps = [pt(m, l, t), pt(m, r, t), pt(m, l, b), pt(m, r, b)], xs = ps.map((p) => p[0]), ys = ps.map((p) => p[1]);
    const seg = { s, x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys),
      px: size * (Math.sqrt(Math.abs(m.a * m.d - m.b * m.c)) || 1), color: typeof ctx.fillStyle === 'string' ? ctx.fillStyle : '', alpha: ctx.globalAlpha, outline: !fill };
    const list = listOf(cv), same = list.find((o) => o.s === s && Math.abs(o.x - seg.x) < 1 && Math.abs(o.y - seg.y) < 1);
    if (!same) list.push(seg); else if (fill) { same.color = seg.color; same.alpha = seg.alpha; } else same.outline = true; };
  for (const k of ['fillText', 'strokeText']) { const f = P[k]; P[k] = function (s, x, y, ...r) { try { rec(this, s, x, y, k === 'fillText'); } catch (e) { } return f.call(this, s, x, y, ...r); }; }
  const pad = (w, h) => { if (window.OffscreenCanvas) return new OffscreenCanvas(w, h).getContext('2d', { willReadFrequently: true }); const c = document.createElement('canvas'); c.width = w; c.height = h; return c.getContext('2d', { willReadFrequently: true }); };
  let ink = null, peek = null; const raw = P.drawImage, grads = new WeakMap(), pats = new WeakMap(), seenSrc = new WeakMap();
  const solidColour = (c) => { try { ink = ink || pad(1, 1); ink.fillStyle = '#000'; ink.fillStyle = c; const v = ink.fillStyle; return typeof v === 'string' && v[0] === '#'; } catch (e) { return false; } };
  // a picture hides what is under it: every alpha of it at 8×8 is 255; null when it cannot be read (then it counts as hiding, as before).
  // The whole bitmap, whatever size the picture reports: a game that makes a half-size canvas report its drawn size read 3/4 empty here,
  // its opaque floor counted as see-through and the battle buffer never started a frame again (午夜机台 2026-11-21, below)
  const solidSrc = (src) => { try { const w = src.videoWidth || src.naturalWidth || src.width, h = src.videoHeight || src.naturalHeight || src.height; if (!w || !h) return false;
      peek = peek || pad(8, 8); peek.globalCompositeOperation = 'copy'; peek.imageSmoothingQuality = 'high'; (peek instanceof CanvasRenderingContext2D ? raw : peek.drawImage).call(peek, src, 0, 0, 8, 8);
      const d = peek.getImageData(0, 0, 8, 8).data; for (let i = 3; i < d.length; i += 4) if (d[i] < 255) return false; return true; } catch (e) { return null; } };
  const srcSolid = (src) => { const c = src instanceof HTMLCanvasElement || (window.OffscreenCanvas && src instanceof OffscreenCanvas), k = seenSrc.get(src);
    if (k && (!c || ++k.n < 60)) return k.v; const v = solidSrc(src); seenSrc.set(src, { v, n: 0 }); return v; };
  if (window.CanvasGradient) { const a = CanvasGradient.prototype.addColorStop; CanvasGradient.prototype.addColorStop = function (o, c) { const r = a.call(this, o, c);
    try { const g = grads.get(this) || { n: 0, see: false }; g.n++; if (!solidColour(c)) g.see = true; grads.set(this, g); } catch (e) { } return r; }; }
  const cp = P.createPattern; P.createPattern = function (src, rep) { const p = cp.call(this, src, rep); try { if (p) pats.set(p, solidSrc(src) === true); } catch (e) { } return p; };
  const plain = (ctx) => ctx.globalCompositeOperation === 'copy' || (ctx.globalCompositeOperation === 'source-over' && ctx.globalAlpha >= 0.995);
  const hides = (ctx) => { if (ctx.globalCompositeOperation === 'copy') return true; if (!plain(ctx)) return false; const f = ctx.fillStyle;
    if (typeof f === 'string') return f[0] === '#'; const g = grads.get(f); return g ? g.n > 0 && !g.see : pats.get(f) === true; };
  for (const k of ['clearRect', 'fillRect']) { const f = P[k]; P[k] = function (x, y, w, h) { try { if (this.canvas && whole(this, x, y, w, h) && (k === 'clearRect' || hides(this))) restart(this.canvas); } catch (e) { } return f.call(this, x, y, w, h); }; }
  const di = P.drawImage; P.drawImage = function (src, ...a) { try { const cv = this.canvas;
      let sx = 0, sy = 0, sw = src.width, sh = src.height, dx, dy, dw, dh;
      if (a.length >= 8) [sx, sy, sw, sh, dx, dy, dw, dh] = a; else if (a.length >= 4) [dx, dy, dw, dh] = a; else { [dx, dy] = a; dw = sw; dh = sh; }
      // the words the picture carries, read before a cover starts this canvas again (a canvas drawn onto itself keeps its own). A picture
      // that covers the canvas whole starts it again even when it carries words: they are what is on it now (午夜机台 2026-11-21: a buffer
      // copied onto the screen each frame left a moving word on the list at every place it had been)
      const own = src instanceof HTMLCanvasElement ? (src.isConnected ? (X.cur && X.cur.get(src)) || X.shown.get(src) : X.off.get(src)) : null, from = own && own.slice();
      if (cv && whole(this, dx, dy, dw, dh) && (this.globalCompositeOperation === 'copy' || (plain(this) && srcSolid(src) !== false))) restart(cv);
      // words a picture carries land where it is drawn; a word already at that spot is the same word on the screen, not one more: a glow or
      // blur pass that draws a canvas back onto itself (bloom, depth of field) doubled its list every frame and the tool hung on a battle
      // (午夜机台 2026-11-21: 960×360 battle buffer → 480×180 → back with 'lighter', a list of 500 000 after 0.3 s)
      if (cv && from && from.length && sw && sh) { const m = this.getTransform(), kx = dw / sw, ky = dh / sh, list = listOf(cv), at = new Map();
        const key = (o) => o.s + '\\u0000' + Math.round(o.x) + '\\u0000' + Math.round(o.y); for (const o of list) at.set(key(o), o);
        for (const g of from) { if (g.x + g.w < sx || g.x > sx + sw || g.y + g.h < sy || g.y > sy + sh) continue;
          const a1 = pt(m, dx + (g.x - sx) * kx, dy + (g.y - sy) * ky), a2 = pt(m, dx + (g.x + g.w - sx) * kx, dy + (g.y + g.h - sy) * ky);
          const c = { ...g, x: Math.min(a1[0], a2[0]), y: Math.min(a1[1], a2[1]), w: Math.abs(a2[0] - a1[0]), h: Math.abs(a2[1] - a1[1]),
            px: g.px * Math.abs(ky) * (Math.sqrt(Math.abs(m.a * m.d - m.b * m.c)) || 1), alpha: g.alpha * this.globalAlpha };
          const k = key(c), same = at.get(k); if (!same) { list.push(c); at.set(k, c); } else if (c.alpha > same.alpha) same.alpha = c.alpha; } }
    } catch (e) { } return di.call(this, src, ...a); };
  X.take = () => { const out = [];
    const shown = new Map(X.shown); if (X.cur) for (const [cv, segs] of X.cur) shown.set(cv, segs);
    for (const [cv, segs] of shown) { if (!cv.isConnected) continue; const r = cv.getBoundingClientRect(); if (!r.width || !r.height) continue;
      const kx = r.width / cv.width, ky = r.height / cv.height, st = getComputedStyle(cv); if (st.visibility === 'hidden' || st.display === 'none') continue;
      for (const g of segs) out.push({ s: g.s, x: Math.round(r.left + g.x * kx), y: Math.round(r.top + g.y * ky), w: Math.round(g.w * kx), h: Math.round(g.h * ky),
        px: Math.round(g.px * ky * 10) / 10, color: g.color, alpha: Math.round(g.alpha * 100) / 100, ...(g.outline ? { outline: true } : {}), kind: 'canvas' }); }
    const w = document.createTreeWalker(document.body || document.documentElement, NodeFilter.SHOW_TEXT);
    for (let n; (n = w.nextNode());) { const s = n.nodeValue; if (!s || !s.trim()) continue; const el = n.parentElement; if (!el || /^(SCRIPT|STYLE|NOSCRIPT)$/.test(el.tagName)) continue;
      const st = getComputedStyle(el); if (st.visibility === 'hidden' || st.display === 'none' || +st.opacity === 0) continue;
      const rg = document.createRange(); rg.selectNodeContents(n); const b = rg.getBoundingClientRect();
      if (b.width < 1 || b.height < 1 || b.bottom < 0 || b.right < 0 || b.top > innerHeight || b.left > innerWidth) continue;
      out.push({ s: s.trim(), x: Math.round(b.left), y: Math.round(b.top), w: Math.round(b.width), h: Math.round(b.height), px: parseFloat(st.fontSize), color: st.color, alpha: +st.opacity, kind: 'html' }); }
    return out; };
})();`;

async function cdpPage(port) {
  const list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  const ws = new WebSocket(list.find((t) => t.type === 'page').webSocketDebuggerUrl);
  await new Promise((r, j) => { ws.onopen = r; ws.onerror = () => j(new Error('DevTools connection failed')); });
  let id = 0; const wait = new Map(), errors = [];
  ws.onmessage = (e) => {
    const m = JSON.parse(e.data);
    if (m.id && wait.has(m.id)) { const { r, j } = wait.get(m.id); wait.delete(m.id); m.error ? j(new Error(m.error.message)) : r(m.result); }
    else if (m.method === 'Runtime.exceptionThrown') { const d = m.params.exceptionDetails; errors.push(String(d.exception?.description || d.text).split('\n')[0]); }
    else if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') errors.push(m.params.args.map((x) => x.value ?? x.description ?? '').join(' ').slice(0, 300));
  };
  const send = (method, params = {}) => new Promise((r, j) => { const i = ++id; wait.set(i, { r, j }); ws.send(JSON.stringify({ id: i, method, params })); });
  const evaluate = async (expression) => {
    const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    if (r.exceptionDetails) throw new Error(String(r.exceptionDetails.exception?.description || r.exceptionDetails.text).split('\n')[0]);
    return r.result.value;
  };
  return { send, evaluate, errors, close: () => ws.close() };
}

function probeOf(spec, game) {
  if (!spec) return null;
  if (spec.startsWith('@')) {
    const name = spec.slice(1);
    if (game?.probes?.[name]) return game.probes[name];
    const f = path.resolve(name);
    if (fs.existsSync(f)) return fs.readFileSync(f, 'utf8');
    throw new Error(`no probe ${name}: neither a file nor one of the game's kept probes (--help)`);
  }
  return spec;
}

async function run(o, game) {
  const [w, h] = o.size;
  const name = o.name || `m-${(o.seg || 'page').replace(/[^\w.一-鿿-]+/g, '_')}`;
  const out = path.resolve(o.out || path.join(ROOT, '.ai', '试跑', 'moment', name));
  fs.mkdirSync(out, { recursive: true });
  const logf = path.join(out, 'log.txt');
  const emit = (row) => { const s = JSON.stringify(row); console.log(s); fs.appendFileSync(logf, s + '\n'); };
  const own = game?.clock?.advance, hz = o.hz > 0 ? o.hz : 60, under = !!own && o.still > 0, rate = own ? 60 : hz;
  if (under && !game.clock.real) { emit({ error: `${game.from} 的 clock 没写 real（怎么把游戏交回真时钟），--still 接不过来` }); return 1; }
  let url = o.url;
  if (!url) {
    const page = o.page || call(game?.page, o.seg) || 'index.html';
    const q = [call(game?.query, o.seg), !game && o.seg ? (o.seg.includes('=') ? o.seg : `scenario=${encodeURIComponent(o.seg)}`) : ''].filter(Boolean).join('&');
    url = pathToFileURL(path.resolve(ROOT, page)).href + (q ? (page.includes('?') ? '&' : '?') + q : '');
  }
  const chrome = spawnChrome(['--headless=new', '--remote-debugging-port=0', `--window-size=${w},${h}`, '--hide-scrollbars',
    '--allow-file-access-from-files', '--autoplay-policy=no-user-gesture-required', '--enable-webgl', '--ignore-gpu-blocklist', 'about:blank'],
  { tmp: path.join(ROOT, '.ai', '试跑', 'chrome'), realtime: o.realtime > 0 });
  const bye = () => chrome.close();
  let p;
  try {
    p = await cdpPage(await chrome.port(60000));
    await p.send('Runtime.enable');
    await p.send('Page.enable');
    await p.send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: false });
    if (!own || under) await p.send('Page.addScriptToEvaluateOnNewDocument', { source: vclock(hz, under) });
    if (o.texts) await p.send('Page.addScriptToEvaluateOnNewDocument', { source: TEXTREC });
    if (game?.pre) await p.send('Page.addScriptToEvaluateOnNewDocument', { source: game.pre });
    await p.send('Page.navigate', { url });
    const ready = game?.ready || 'document.readyState === "complete"';
    let up = false;
    for (const end = Date.now() + 120000; Date.now() < end; await sleep(100)) { try { if (await p.evaluate(`!!(${ready})`)) { up = true; break; } } catch { /* page still loading */ } }
    if (!up) { emit({ error: `页面没到能开段的样子（ready 一直不成立）：${ready}`, url, errors: p.errors.slice(0, 5) }); return 1; }
    const adv = (n, draw) => (own ? game.clock.advance(n, draw) : `__moment.advance(${n})`);
    const now = own ? game.clock.now : '__moment.now()';
    if (!own) await p.evaluate('__moment.hold()');
    if (game?.start && o.seg !== null) await p.evaluate(`(() => { ${call(game.start, o.seg)}; })()`);
    if (o.pre) await p.evaluate(`(() => { ${o.pre}; })()`);
    let t0 = await p.evaluate(now);
    if (o.until) {
      let hit = -1;
      for (let f = 0; f < o.max * rate && hit < 0; f += 600) {
        const r = await p.evaluate(`(() => { for (let i = 0; i < 600; i++) { if (${o.until}) return i; ${adv(1, false)}; } return -1; })()`);
        if (r >= 0) hit = f + r;
      }
      if (hit < 0) { emit({ error: `推了 ${o.max} 秒，没等到 ${o.until}`, errors: p.errors.slice(0, 5) }); return 1; }
      t0 = await p.evaluate(now);
      emit({ until: o.until, at: +(t0).toFixed(2) });
    }
    const probe = probeOf(o.probe, game);
    let at = 0;
    for (const T of o.times) {
      const n = Math.max(0, Math.round((T - at) * rate));
      if (own) {
        const draw = Math.min(n, WARM);
        if (n - draw > 0) await p.evaluate(`(() => { ${adv(n - draw, false)}; })()`);
        for (let i = 0; i < draw; i++) await p.evaluate(`(() => { ${adv(1, true)}; })()`);
        if (!draw) await p.evaluate(`(() => { ${adv(0, true)}; })()`);
      } else if (n) await p.evaluate(adv(n));
      at = T;
      const row = { t: T, game: +((await p.evaluate(now)) - 0).toFixed(2) };
      if (probe) { // an expression, or statements that `return` the value
        const body = /\breturn\b/.test(probe) ? `{ ${probe} }` : `(${probe.trim().replace(/;\s*$/, '')})`;
        try { row.probe = await p.evaluate(`(async () => ${body})()`); } catch (e) { row.probeError = e.message; }
      }
      if (o.texts) { try { row.texts = await p.evaluate('window.__texts ? __texts.take() : null'); } catch (e) { row.textsError = e.message; } }
      if (o.shot) {
        const f = path.join(out, `${name}-${String(Math.round(T * 100)).padStart(5, '0')}.png`);
        fs.writeFileSync(f, Buffer.from((await p.send('Page.captureScreenshot', { format: 'png' })).data, 'base64'));
        row.shot = f;
      }
      const errs = [...p.errors.splice(0), ...(own && !under ? [] : await p.evaluate('__moment.errors.splice(0)'))];
      if (errs.length) row.errors = errs.slice(0, 5);
      emit(row);
    }
    if (o.still > 0) {
      if (under) await p.evaluate(`(() => { __moment.hold(); ${game.clock.real}; })()`);
      const frames = Math.max(1, Math.round(o.still * hz)), warm = under ? Math.min(2, frames - 1) : 0; // the hand-over frame or two first
      const r = await p.evaluate(`(${STILL})(${frames}, ${warm})`);
      const row = { still: o.still, hz, frames: frames - warm, pictures: r.pictures, box: r.box, px: r.px };
      if (!own) row.game = +(await p.evaluate(now)).toFixed(2);
      if (probe) {
        const body = /\breturn\b/.test(probe) ? `{ ${probe} }` : `(${probe.trim().replace(/;\s*$/, '')})`;
        try { row.probeAfter = await p.evaluate(`(async () => ${body})()`); } catch (e) { row.probeError = e.message; }
      }
      if (o.shot) { const f = path.join(out, `${name}-still.png`); fs.writeFileSync(f, Buffer.from((await p.send('Page.captureScreenshot', { format: 'png' })).data, 'base64')); row.shot = f; }
      const errs = [...p.errors.splice(0), ...(await p.evaluate('__moment.errors.splice(0)'))];
      if (errs.length) row.errors = errs.slice(0, 5);
      emit(row);
    }
    if (o.realtime > 0) {
      if (own && !game.clock.real) { emit({ error: `${game.from} 的 clock 没写 real（怎么把游戏交回真时钟），量不了真时间` }); return 1; }
      await p.evaluate(own && !under ? `(() => { ${game.clock.real}; })()` : '__moment.real()');
      const m = await startMeasure(); // only these seconds are the measurement
      let fr;
      try { fr = await p.evaluate(`new Promise((done) => { const raf = window.__momentRaf || requestAnimationFrame, gaps = []; let last = 0;
        const end = performance.now() + ${o.realtime * 1000};
        const tick = (ts) => { if (last) gaps.push(ts - last); last = ts; if (performance.now() < end) raf(tick); else done(gaps); }; raf(tick); })`); }
      finally { o.verdict = await m.stop(); }
      const sorted = [...fr].sort((a, b) => a - b), total = fr.reduce((a, b) => a + b, 0);
      const row = { realtime: o.realtime, fps: +(fr.length / (total / 1000 || 1)).toFixed(1), worstMs: +(sorted[sorted.length - 1] || 0).toFixed(1),
        p95Ms: +(sorted[Math.floor(sorted.length * 0.95)] || 0).toFixed(1), frames: fr.length };
      if (o.shot) { const f = path.join(out, `${name}-realtime.png`); fs.writeFileSync(f, Buffer.from((await p.send('Page.captureScreenshot', { format: 'png' })).data, 'base64')); row.shot = f; }
      const errs = p.errors.splice(0);
      if (errs.length) row.errors = errs.slice(0, 5);
      emit(row);
    }
    return 0;
  } finally { try { p?.close(); } catch { /* gone */ } await bye(); }
}

const o = parse(process.argv.slice(2));
const list = await adapters();
if (o.help || !o.pos.length) { help(list); process.exit(o.help ? 0 : 2); }
let game;
try { game = pick(list, o.seg); } catch (e) { console.log(JSON.stringify({ error: e.message })); process.exit(2); }
let code;
for (let i = 0; ; i++) {
  o.verdict = null;
  code = await run(o, game);
  if (!(o.realtime > 0) || !o.verdict) break;
  const done = o.verdict.fair !== false || i + 1 >= 2, note = noteOf(o.verdict, i, done);
  if (done) { console.log(JSON.stringify({ fair: o.verdict.fair, tries: i + 1, probe: o.verdict.probe, note })); break; }
  process.stderr.write(note + '\n');
}
process.exit(code);

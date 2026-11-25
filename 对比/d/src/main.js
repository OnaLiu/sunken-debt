import { Game } from './game/game.js';
import { VIEW_W, VIEW_H } from './config.js';
import { EffectsPage } from './fx/effects.js';
import { renderLog, toWav } from './audio/audio.js';
import { canSee, seeItem, hiddenWhy, itemHiddenWhy, showingOf, compareWreckRay } from './game/sight.js';

// 固定 1920×1080 的逻辑画面，按放它的框（平时是整个窗口；效果页是右边那一块）整体等比缩放、留边
const canvas = document.getElementById('view');
const stage = document.getElementById('stage');
const frame = document.getElementById('frame');
function fit() {
  const W = frame.clientWidth || window.innerWidth, H = frame.clientHeight || window.innerHeight;
  const s = Math.min(W / VIEW_W, H / VIEW_H);
  stage.style.transform = `translate(${(W - VIEW_W * s) / 2}px, ${(H - VIEW_H * s) / 2}px) scale(${s})`;
}
window.addEventListener('resize', fit);
fit();
window.__fit = fit;

const mode = window.SUNKEN_MODE || 'game';
const q = new URLSearchParams(location.search);
const fxMode = mode === 'effects';
// 效果页：随机数固定，每次放都一样（只在这一页；游戏和自动演示照旧）
if (fxMode) EffectsPage.seed(20261016);
const game = new Game(canvas, document.getElementById('ui'), { demo: mode === 'demo', tags: fxMode || !!window.SUNKEN_TAGS || q.get('tags') === '1' });
window.__game = game;

if (q.get('autostart') === 'demo') game.startPlay(true);
else if (q.get('autostart') === 'play') game.startPlay(false);
const timeScale = Number(q.get('speed') || 1);
// 录像用：manual=1 时画面不自己走，由 __advance 一帧一帧推进（固定步长，录出来不掉帧）
const manual = q.get('manual') === '1';
window.__advance = (n = 1, dt = 1 / 60) => { for (let i = 0; i < n; i++) game.frame(dt); };
// 录像用：把 audio.startRec 记下的一段在离线 AudioContext 里重放（tools/pairclip.mjs）
window.__audioLib = { renderLog, toWav };
// 自查用：「看得见」的判断（界面标记和机器人用的同一份），tools/seecheck.mjs 拿它和画面对
window.__sight = { canSee, seeItem, hiddenWhy, itemHiddenWhy, showingOf, compareWreckRay };

const fx = fxMode ? new EffectsPage(game, q) : null;
window.__fx = fx;

let last = performance.now();
let frames = 0;
const ft = [];
function loop(now) {
  if ((manual || (fx && fx.external)) && frames >= 3) { requestAnimationFrame(loop); return; }
  let dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
  last = now;
  ft.push(dt);
  if (ft.length > 240) ft.shift();
  dt *= timeScale;
  if (fx && frames >= 3) fx.tick(dt);
  else {
    // 加速测试时分步走，保持每步不超过 1/30 秒
    const steps = Math.max(1, Math.ceil(dt / 0.034));
    for (let i = 0; i < steps; i++) game.frame(dt / steps);
  }
  frames++;
  if (frames === 3) { window.__ready = true; if (fx) fx.boot(); }
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

window.__info = () => ({
  mode: game.mode,
  time: +game.trip.time.toFixed(1),
  fuel: +game.trip.fuel.toFixed(1),
  nets: game.trip.nets,
  haul: game.trip.haul.map((h) => h.name),
  boat: [+game.boatCtl.pos.x.toFixed(1), +game.boatCtl.pos.z.toFixed(1)],
  calls: game.pipe.renderer.info.render.calls,
  tris: game.pipe.renderer.info.render.triangles,
  avgMs: +((ft.reduce((a, b) => a + b, 0) / Math.max(1, ft.length)) * 1000).toFixed(2),
  maxMs: +(Math.max(...ft) * 1000).toFixed(1),
  bot: game.bot ? game.bot.stage : null,
  seen: game.bot ? game.bot.seen.size : 0,
});

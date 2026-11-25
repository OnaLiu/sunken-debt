import { Game } from './game/game.js';
import { loadAssets } from './assets/assets.js';
import { VIEW_W, VIEW_H } from './config.js';
import { EffectsPage } from './fx/effects.js';
import { CssClock } from './ui/cssclock.js';
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

// 素材（模型、图标）先解码，再建场景（解不开的那几样照旧用代码画）
loadAssets().catch((e) => console.error('素材', e)).then(start);

function start() {
  const mode = window.SUNKEN_MODE || 'game';
  const q = new URLSearchParams(location.search);
  const fxMode = mode === 'effects';
  // 效果页：随机数固定，每次放都一样（只在这一页；游戏和自动演示照旧）
  if (fxMode) EffectsPage.seed(20261016);
  const game = new Game(canvas, document.getElementById('ui'), { demo: mode === 'demo', tags: fxMode || !!window.SUNKEN_TAGS || q.get('tags') === '1' });
  window.__game = game;

  // 一打开就是第一段·归潮沙湾的这一刻（小样）：停在沉船旁边、在打捞模式里。
  // trip=1：原来那一整趟（标题、出港、收获单），留着给效果页和以后的段用
  const wholeTrip = q.get('trip') === '1' || fxMode;
  const touch = !!(window.HengPing && window.HengPing.touch);
  if (!wholeTrip) {
    game.moment.begin();
    // fill=1：从「甲板码满、等开冲」那一刻放（展示页里看招牌那一扇小窗）；再来一次也从这儿
    if (q.get('fill') === '1') { game.moment.autoFill = [['jar', 'jar2', 'rope'], ['copperset'], ['barrel'], ['seal'], ['chest', 'sack']]; game.moment.prefill(game.moment.autoFill); }
    // 自动演示：demo.html、地址里带 demo=1 / autostart=demo、触屏（手机平板只看演示）
    if (mode === 'demo' || q.get('demo') === '1' || q.get('autostart') === 'demo' || touch) game.startMomentDemo();
    // 触屏：点一下暂停时挑看哪一段（这一版只有这一刻的开头）；暂停时声音也停
    if (window.HengPing) {
      window.HengPing.segments([{ name: game.moment.segName(), go: () => { game.moment.begin(); if (!game.bot) game.startMomentDemo(); else game.bot.restart(); } }]);
      window.HengPing.onPause((on) => { const c = game.audio.ctx; if (c) { if (on) c.suspend(); else c.resume(); } });
    }
  } else if (q.get('autostart') === 'demo') game.startPlay(true);
  else if (q.get('autostart') === 'play') game.startPlay(false);
  const timeScale = Number(q.get('speed') || 1);
  // 录像用：manual=1 时画面不自己走，由 __advance 一帧一帧推进（固定步长，录出来不掉帧）
  window.__manual = q.get('manual') === '1';
  // 快钟推进时界面的 CSS 动画也按同一个钟走（截出来的界面和真玩到这一秒一样）；交回真时钟时放开
  const cssClock = new CssClock();
  window.__advance = (n = 1, dt = 1 / 60) => { for (let i = 0; i < n; i++) { game.frame(dt); cssClock.tick(dt); } };
  window.__cssClock = cssClock;
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
    if ((window.__manual || (fx && fx.external)) && frames >= 3) { requestAnimationFrame(loop); return; }
    if (cssClock.anims.size && !window.__manual) cssClock.release();
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
    // 第一帧真的画出来以后才算页面好了（展示页、试跑等这一下）
    if (frames === 2) window.__pageReady = true;
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
}

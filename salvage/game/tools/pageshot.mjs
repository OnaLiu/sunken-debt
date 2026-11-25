// 给他看的页照手机竖屏截图：默认 1080×1920 竖屏（360×640 的手机屏、三倍像素）、触屏、手机的字号，和他手机上看到的一样（用户 2026-11-15：
// 「你现在的很多页面的布局，不是1920*1080竖屏的，这就导致手机上看到的，跟你自己渲染出来看到的不一样……网页上一个样子，手机上一个样，还给反复改」）。
// 演示（能玩的游戏）不用这个：照老规矩横屏 1920×1080（tools/check.mjs）。
//
// 跑：node tools/pageshot.mjs <页面地址或本地 html> [截图.png] [--full] [--wait 毫秒] [--size 宽x高] [--land]
//   --land：同一台手机横过来（640×360 触屏，截出来 1920×1080），看游戏在手机上横着拿是什么样（user-goals.md 第 17 条）。
//   截图默认写在 .ai/pageshot/<页面名>.png；--full 截整页（往下滑看得到的都在一张里）；--size 只在要对照别的尺寸时用（例如 1440x900 看电脑上）。
//   打印一行 JSON：截图在哪、页面多宽多高、有没有比屏幕宽（手机上要横着拖的）的东西、字比手机正文小的有几处，
//   字号不在微信那几档上的（offsize：iOS 默认文字大小下的微信正文 17、说明 14、最小 12、标题 17，微信文章大标题 22、二级 20；用户 2026-11-15「字号都要按照微信的字号对齐」）。
//   画游戏里样子的地方（canvas、svg、卡面 .bcard、截图、照游戏样子的名词说明 .gw、卡上照游戏放大的数 .num）不算。
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {spawnChrome} from './chrome.mjs';

const args = process.argv.slice(2), opt = n => { const i = args.indexOf(n); return i >= 0 ? args.splice(i, 2)[1] : null; };
const full = args.includes('--full') && !!args.splice(args.indexOf('--full'), 1);
const land = args.includes('--land') && !!args.splice(args.indexOf('--land'), 1);  // 同一台手机横过来拿（640×360、触屏）：看游戏在手机上横着是什么样
const waitMs = +(opt('--wait') || 1500), size = opt('--size');
const [target, outArg] = args;
if (!target) { console.error('用法：node tools/pageshot.mjs <页面地址或本地 html> [截图.png] [--full] [--wait 毫秒] [--size 宽x高] [--land]'); process.exit(2); }
const url = /^[a-z]+:\/\//i.test(target) ? target : pathToFileURL(path.resolve(target)).href;
const phone = !size;
const [W, H, DPR] = phone ? (land ? [640, 360, 3] : [360, 640, 3]) : [...size.split('x').map(Number), 1];
const out = outArg || path.join('.ai', 'pageshot', (path.basename(new URL(url).pathname.replace(/\/$/, '/index.html'), '.html') || 'page') + '.png');
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';
const wait = ms => new Promise(r => setTimeout(r, ms));

const chrome = spawnChrome(['--headless=new', '--remote-debugging-port=0', '--hide-scrollbars', `--window-size=${W},${H}`, 'about:blank'], {stdio: 'ignore'});
try {
  const port = await chrome.port();
  let list; for (let i = 0; i < 80 && !list; i++) { try { list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json(); } catch { await wait(250); } }
  const ws = new WebSocket(list.find(t => t.type === 'page').webSocketDebuggerUrl);
  await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
  let id = 0; const pend = new Map();
  ws.onmessage = ev => { const m = JSON.parse(ev.data); if (m.id && pend.has(m.id)) { const p = pend.get(m.id); pend.delete(m.id); m.error ? p.j(new Error(m.error.message)) : p.r(m.result); } };
  const send = (method, params = {}) => new Promise((r, j) => { const i = ++id; pend.set(i, {r, j}); ws.send(JSON.stringify({id: i, method, params})); });
  await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', {width: W, height: H, deviceScaleFactor: DPR, mobile: phone, screenWidth: W, screenHeight: H});
  if (phone) { await send('Emulation.setTouchEmulationEnabled', {enabled: true, maxTouchPoints: 5}); await send('Emulation.setUserAgentOverride', {userAgent: UA}); }
  await send('Page.navigate', {url});
  await wait(waitMs);
  const r = await send('Runtime.evaluate', {returnByValue: true, expression: `(() => {
    const vw = document.documentElement.clientWidth, wide = [], small = [], off = {}, WX = [12, 14, 17, 20, 22];
    for (const el of document.querySelectorAll('body *')) {
      const b = el.getBoundingClientRect(); if (!b.width || !b.height) continue;
      if (b.right > vw + 1 && getComputedStyle(el).position !== 'fixed' && wide.length < 5) wide.push((el.className || el.tagName) + ' ' + Math.round(b.right));
      const t = [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim());
      if (t && parseFloat(getComputedStyle(el).fontSize) < 12 && small.length < 5) small.push((el.textContent || '').trim().slice(0, 20));
      const fs = parseFloat(getComputedStyle(el).fontSize);
      if (t && !el.closest('canvas,svg,.bcard,.shot,.gw,.num') && !WX.some(x => Math.abs(x - fs) < 0.6)) (off[Math.round(fs * 10) / 10] = off[Math.round(fs * 10) / 10] || []).length < 3 && off[Math.round(fs * 10) / 10].push((el.textContent || '').trim().slice(0, 16));
    }
    return {w: vw, h: document.documentElement.scrollHeight, wide, small, offsize: Object.fromEntries(Object.entries(off).map(([k, v]) => [k + 'px', v]))};
  })()`});
  const shot = await send('Page.captureScreenshot', {format: 'png', captureBeyondViewport: full});
  fs.mkdirSync(path.dirname(out), {recursive: true});
  fs.writeFileSync(out, Buffer.from(shot.data, 'base64'));
  console.log(JSON.stringify({shot: out, screen: phone ? '1080×1920 竖屏（360×640 手机，三倍像素）' : size, page: r.result.value}));
  ws.close();
} finally { await chrome.close(); }

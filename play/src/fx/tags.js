// 效果标签：每放一个效果，在画面右下角写出它的编号和名字（效果清单.md 里的编号）。
// 只在 game-tagged.html 和效果单里打开（页面在 game.js 之前设 window.__FX_TAGS = true）；平时只记一笔，不画。
// 记下的每一笔（游戏时间、编号、名字）给无头测量和效果单读：window.__fxTagLog。在框架里时同时告诉外面的页面；
// 也可以给 window.__fxListen 一个函数，收到 (编号, 名字)。
// 同一个效果一会儿里又放了一次，原来那条闪一下、记个次数；一个效果分几段（例如珍品确认的憋住、爆发、余波，燃油的黄、红）
// 给同一个 key，就只刷新那一条的字，不另起一行。
const MAX_SHOW = 6, LIFE = 3.2;
let box = null;
const live = new Map(); // 编号 → { el, until, n }

export function fxTag(id, name, key = null) {
  if (window.__fxTagMute) return; // 效果单摆场面（快进）的时候不记
  const g = window.__game;
  const t = g ? +g.time.toFixed(2) : 0;
  const log = (window.__fxTagLog = window.__fxTagLog || []);
  log.push({ id, name, t });
  if (log.length > 600) log.splice(0, 200);
  if (window.parent && window.parent !== window) { try { window.parent.postMessage({ type: 'fxtag', id, name, t }, '*'); } catch (e) { /* 外面的页面不收就算了 */ } }
  if (window.__fxListen) { try { window.__fxListen(id, name); } catch (e) { /* 听的人出错不影响游戏 */ } }
  if (!window.__FX_TAGS) return;
  if (!box) {
    const stage = document.getElementById('stage');
    if (!stage) return;
    box = document.createElement('div'); box.id = 'fxtags'; stage.appendChild(box);
  }
  const now = performance.now() / 1000;
  key = key || id + '|' + name;
  const cur = live.get(key);
  // 同一个效果一会儿里又放了一次：原来那条闪一下、记个次数（同一个 key 换了一段就换字），不另起一行
  if (cur && cur.el.isConnected && cur.until > now) {
    cur.n++; cur.until = now + LIFE;
    const nm = cur.el.querySelector('span');
    if (nm.textContent !== name) { nm.textContent = name; cur.n = 1; }
    cur.el.querySelector('.n').textContent = cur.n > 1 ? '×' + cur.n : '';
    cur.el.classList.remove('again'); void cur.el.offsetWidth; cur.el.classList.add('again');
    box.appendChild(cur.el);
    return;
  }
  const el = document.createElement('div');
  el.className = 'fxtag';
  el.innerHTML = `<b></b><span></span><i class="n"></i>`;
  el.querySelector('b').textContent = id; el.querySelector('span').textContent = name;
  box.appendChild(el);
  const rec = { el, until: now + LIFE, n: 1 };
  live.set(key, rec);
  while (box.children.length > MAX_SHOW) box.firstChild.remove();
  const out = () => {
    if (rec.until > performance.now() / 1000 + 0.05) { setTimeout(out, (rec.until - performance.now() / 1000) * 1000); return; }
    el.classList.add('out'); setTimeout(() => { el.remove(); if (live.get(key) === rec) live.delete(key); }, 400);
  };
  setTimeout(out, LIFE * 1000);
}

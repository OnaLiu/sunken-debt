// 横屏一版（所有游戏共用，kit/zongtai/hengping.js；rounds.py 每轮开工前放进游戏的 kit/hengping.js，和 paizi.js 一样以技能最后一次提交的为准）。
// 用户 2026-11-13：「游戏不用设计手机玩法，在手机上看，就看文本，图片，视频，或者自动演示就行了，不让手动控制。想要手动控制，就在网页端……游戏只做一个版本的
// 就是1920*1080横屏，手机就横屏看，电脑网页就正常横着看」，看了设计「照这样排」。user-goals.md 第 17 条是目标，这一份是照它做的共用的那一半：
//   - 电脑上（有鼠标、触控板）什么都不动：游戏照常铺满窗口，自己玩、看演示都照游戏自己的。
//   - 触屏（手机、平板）上：手指、点按、键盘都不进游戏（游戏写的事件监听收不到）；点一下屏幕是暂停、接着放，暂停时看得到挑哪一段（游戏报给它的段）
//     和「自己玩请在电脑上打开」；竖着拿时提示横过来看，演示照放。
// 游戏要做的另一半（这个文件做不了的）：触屏打开就放自动演示（HengPing.touch 为真时直接开演示，不停在开始页等点），演示能从每一段开头放（报给 HengPing.segments）。
// 用法：放在游戏所有脚本最前面 <script src="kit/hengping.js"></script>；
//   if (HengPing.touch) startDemo();                     触屏：一打开就放演示
//   HengPing.segments([{ name: '开打', go: () => demoFrom(3) }, …])   暂停时挑看哪一段
//   HengPing.onPause(on => …)                            暂停、接着放时游戏自己还要停的（声音这类）；画面照 requestAnimationFrame 走的不用管，它替你停
(function () {
  'use strict';
  if (window.HengPing) return;
  const mq = q => { try { return matchMedia(q).matches; } catch (e) { return false; } };
  const touch = mq('(pointer: coarse)') && !mq('(any-pointer: fine)');
  let segs = [], pauseFns = [], held = null, ui = null;
  const HP = window.HengPing = {
    touch,
    paused: false,
    segments(list) { segs = Array.isArray(list) ? list.filter(s => s && s.name && typeof s.go === 'function') : []; if (ui) draw(); },
    onPause(fn) { if (typeof fn === 'function') pauseFns.push(fn); },
    pause(on) { setPause(on === undefined ? !HP.paused : !!on); },
  };
  if (!touch) return;

  // 画面照 requestAnimationFrame 走：暂停时先攒着不给，接着放时一起还回去
  const raf = window.requestAnimationFrame.bind(window), queue = [];
  window.requestAnimationFrame = f => { if (HP.paused) { queue.push(f); return 0; } return raf(f); };
  function setPause(on) {
    if (HP.paused === on) return;
    HP.paused = on;
    document.querySelectorAll('video,audio').forEach(m => { try { on ? m.pause() : m.play().catch(() => {}); } catch (e) {} });
    for (const fn of pauseFns) { try { fn(on); } catch (e) {} }
    if (!on) queue.splice(0).forEach(f => raf(f));
    draw();
  }

  // 手指、点按、键盘都不进游戏：在最外面一层先拦下（这一份要放在游戏脚本最前面）；我们自己的那几颗按钮照常
  const ours = e => e.target && e.target.closest && e.target.closest('[data-hengping]');
  const block = e => { if (ours(e)) return; e.stopImmediatePropagation(); if (e.cancelable && e.type !== 'touchstart' && e.type !== 'touchend') e.preventDefault(); };  // 按下、抬起照常，点一下才合成得出 click（暂停）
  for (const t of ['pointerdown', 'pointermove', 'pointerup', 'pointercancel', 'mousedown', 'mousemove', 'mouseup', 'touchstart', 'touchmove', 'touchend',
    'dblclick', 'contextmenu', 'wheel', 'keydown', 'keyup', 'keypress', 'gesturestart'])
    window.addEventListener(t, block, { capture: true, passive: false });
  window.addEventListener('click', e => { if (ours(e)) return; block(e); setPause(!HP.paused); }, { capture: true, passive: false });

  function el(tag, css, text) { const x = document.createElement(tag); if (css) x.style.cssText = css; if (text) x.textContent = text; x.setAttribute('data-hengping', ''); return x; }
  function draw() {
    if (!document.body) return;
    if (!ui) {
      ui = el('div', 'position:fixed;inset:0;pointer-events:none;z-index:2147483000;font:600 16px/1.4 -apple-system,"PingFang SC",sans-serif;color:#fff');
      // 点我们自己的按钮也不冒到游戏那里（游戏多半在 window 上听）
      for (const t of ['pointerdown', 'pointerup', 'mousedown', 'mouseup', 'touchstart', 'touchend', 'click']) ui.addEventListener(t, e => e.stopPropagation());
      document.body.appendChild(ui);
    }
    const land = innerWidth >= innerHeight;
    ui.replaceChildren();
    if (!land) ui.appendChild(el('div', 'position:absolute;left:50%;bottom:12%;transform:translateX(-50%);padding:10px 18px;border-radius:22px;background:rgba(0,0,0,.66);white-space:nowrap;font-size:17px', '⟲ 横过来看，满屏放'));
    if (!HP.paused) return;
    const box = el('div', 'position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);min-width:220px;max-width:90vw;padding:14px 16px;border-radius:14px;background:rgba(10,12,16,.82);pointer-events:auto;text-align:center');
    box.appendChild(el('div', 'font-size:17px;margin-bottom:8px', '暂停了'));
    const btn = (text, fn) => { const b = el('button', 'display:block;width:100%;margin:6px 0;padding:8px 12px;border:0;border-radius:18px;background:#2b6fd6;color:#fff;font:inherit;font-size:17px', text); b.addEventListener('click', e => { e.stopPropagation(); fn(); }); return b; };
    box.appendChild(btn('接着放', () => setPause(false)));
    for (const s of segs) box.appendChild(btn('从「' + s.name + '」看', () => { setPause(false); try { s.go(); } catch (e) {} }));
    box.appendChild(el('div', 'margin-top:8px;font-size:14px;font-weight:400;color:#cfd3da', '手机上只看演示，自己玩请在电脑上打开'));
    ui.appendChild(box);
  }
  addEventListener('resize', draw);
  addEventListener('orientationchange', draw);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', draw); else draw();
})();

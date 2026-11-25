// 自动演示的横幅（第十四批 G5：知道随时能接手）。横幅本身在 hud.js（setDemo），这里只管它怎么动、怎么响。
//   演示开始：横幅从屏幕上沿落下来、弹一下
//   演示中按了别的键：每按一下，横幅上的 Esc 键帽都被按下去一下（告诉你按的该是它）；隔 1.2 秒以上的那一下，
//     横幅再一跳、键帽外面推出一圈金光，轻轻“笃笃”两声（不是“不行”，是“我在这儿”）；6 秒里按了 3 下还没接管，
//     横幅底下冒出一句“按 Esc 就能自己开”
//   按 Esc（或者点横幅）接管：横幅上的字换成“交给你了”、红灯变绿，0.4 秒后往上收走；车钟手柄“咔”一下、两个暖音往上走。
//     真的横幅当场就藏起来（hidden），收走的是一个影子；开船的键同时从左边飞进来
import { cap } from './keys.js';
import { fxTag } from '../fx/tags.js';

const st = { pulseT: -9, presses: [], hintT: -9 };
const now = () => performance.now() / 1000;

// hud.setDemo(true) 从藏着变成露出来时调
export function demoIn(el) {
  el.classList.remove('g5in'); void el.offsetWidth; el.classList.add('g5in');
  st.presses = []; st.pulseT = -9;
  fxTag('G5', '自动演示·横幅落下来', 'G5');
}

// 演示中按了别的键（main.js 的 demoNudge）
export function demoNudge(hud, audio) {
  const el = hud.el.demo;
  if (!el || el.hidden) return;
  const t = now();
  el.classList.remove('g5key'); void el.offsetWidth; el.classList.add('g5key');
  st.presses = st.presses.filter((p) => t - p < 6); st.presses.push(t);
  if (t - st.pulseT >= 1.2) {
    st.pulseT = t;
    el.classList.remove('pulse', 'g5in'); void el.offsetWidth; el.classList.add('pulse');
    const k = el.querySelector('.kc');
    if (k) { const r = document.createElement('span'); r.className = 'g5ring'; k.appendChild(r); setTimeout(() => r.remove(), 800); }
    audio && audio.play('demoHint');
    fxTag('G5', '演示中按了别的键·横幅提示 Esc', 'G5');
  }
  if (st.presses.length >= 3 && t - st.hintT > 5) {
    st.hintT = t;
    const old = el.querySelector('.g5hint'); if (old) old.remove();
    const h = document.createElement('div'); h.className = 'g5hint';
    h.innerHTML = `按 ${cap('start', hud.dev)} 就能自己开`;
    el.appendChild(h); setTimeout(() => h.remove(), 2600);
    fxTag('G5', '演示中连按·“按 Esc 就能自己开”', 'G5');
  }
}

// Esc 接管（main.js 的 stopPilot，在 hud.setDemo(false) 之前调）
export function demoTakeover(hud, audio) {
  const el = hud.el.demo;
  if (!el || el.hidden) return;
  const g = document.createElement('div');
  g.className = 'demo-banner g5ghost';
  g.innerHTML = `<span class="g5was">${el.innerHTML.replace(/<div class="g5hint"[\s\S]*$/, '')}</span><span class="g5now">交给你了</span>`;
  el.parentNode.appendChild(g);
  setTimeout(() => g.remove(), 1100);
  audio && audio.play('takeover');
  fxTag('G5', 'Esc 接管·交给你了', 'G5');
}

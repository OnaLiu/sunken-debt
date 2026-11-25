// 再来一次（D1）：按下去车钟叮叮，收获单往下滑走 → 黑场（至少 0.4 秒；新的一趟在黑场里建好、先开上一小段）→
// 黑幕带着软边从下往上抹开：海面先亮，船已经在走，发动机一口气起来；界面晚半拍才出来。
// 和标题进游戏的黑场（main.js 的 transition）分开写：那一个是开场（第十四批）。
import { fxTag } from '../fx/tags.js';

const BLACK_IN = 360, HOLD = 400, OPEN = 800, UI_LATE = 450;

// stage：放画面和界面的那一层；hud：界面根；build()：建新的一趟（黑场里做）；prepare()：新场景的着色器编好（返回 Promise）；
// lit()：黑幕开始抹开的那一刻（游戏记下画面亮了，F1 第一次推油门等它）
export function playAgain({ stage, hud, audio, build, prepare, lit }) {
  let veil = stage.querySelector('.again-veil');
  if (!veil) { veil = document.createElement('div'); veil.className = 'again-veil'; stage.appendChild(veil); }
  audio && audio.play('again');
  fxTag('D1', '再来一次·车钟叮叮，单子滑走', 'D1');
  const card = hud.querySelector('.modal.haul .pcard');
  if (card) card.classList.add('go');
  veil.className = 'again-veil';
  void veil.offsetWidth;
  veil.classList.add('on');
  return new Promise((done) => setTimeout(() => {
    const t0 = performance.now();
    hud.classList.add('arriving');
    build();
    fxTag('D1', '再来一次·黑场（新的一趟已经开起来）', 'D1');
    const open = () => setTimeout(() => requestAnimationFrame(() => requestAnimationFrame(() => {
      veil.classList.add('open');
      lit && lit();
      audio && audio.play('againGo');
      fxTag('D1', '再来一次·海面先亮，船已经在走', 'D1');
      setTimeout(() => { hud.classList.remove('arriving'); hud.classList.add('arrived'); }, UI_LATE);
      setTimeout(() => hud.classList.remove('arrived'), UI_LATE + 700);
      setTimeout(() => { veil.className = 'again-veil'; done(); }, OPEN + 200);
    })), Math.max(0, HOLD - (performance.now() - t0)));
    prepare().then(open, open);
  }, BLACK_IN));
}

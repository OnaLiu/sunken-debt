// 界面图标：数量用图标加数字，模式和方向用图形。都用 currentColor，颜色跟着所在的地方走。
import { image } from '../assets/assets.js';

const svg = (body, vb = '0 0 24 24') => `<svg class="ic" viewBox="${vb}" aria-hidden="true">${body}</svg>`;

export const ICON = {
  // 燃油：加油机（仪表盘上的那个油量标志）
  fuel: svg('<path fill="currentColor" fill-rule="evenodd" d="M5 2h9a1 1 0 0 1 1 1v17h1v2H3v-2h1V3a1 1 0 0 1 1-1zm1.6 2.6v5.2h5.8V4.6z"/><path d="M15 8.5h2.4v9a1.6 1.6 0 0 0 3.2 0V8.2L18 5.2" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round" stroke-linecap="round"/>'),
  // 钱币
  coin: svg('<circle cx="12" cy="12" r="9" fill="currentColor"/><circle cx="12" cy="12" r="5.6" fill="none" stroke="rgba(0,0,0,.38)" stroke-width="1.8"/><rect x="11" y="9" width="2" height="6" fill="rgba(0,0,0,.38)"/>'),
  // 泥包（甲板上码着、还没冲的那一团）：素材还没有（素材/待画.md「图标-泥包」），先用代码画
  bundle: svg('<path fill="currentColor" d="M4 15.5C3 11 6 6.5 12 6.3c6-.2 9 4.2 8 9.2-.4 2.2-3.6 3.3-8 3.3s-7.6-1.1-8-3.3z"/><path d="M5.2 12.5c3-2.4 10.6-2.4 13.6 0M7 8.8c1.8 3 1.8 6.8.6 9.6M17 8.8c-1.8 3-1.8 6.8-.6 9.6" fill="none" stroke="rgba(0,0,0,.42)" stroke-width="1.5"/><path d="M8 18.6v2.6M15.5 18.7v2" stroke="currentColor" stroke-width="1.6"/>'),
  // 货箱（件数）
  crate: svg('<rect x="3" y="6" width="18" height="14" fill="currentColor"/><path d="M3 10h18M9 6v14M15 6v14" stroke="rgba(0,0,0,.38)" stroke-width="1.6"/><rect x="5" y="3" width="14" height="3" fill="currentColor"/>'),
  // 水深：往下的箭头压着一道水面
  depth: svg('<path d="M2 6c3-2 5-2 8 0s5 2 8 0 3-1 4-1" fill="none" stroke="currentColor" stroke-width="2"/><path fill="currentColor" d="M11 9h2v8h3l-4 5-4-5h3z"/>'),
  // 开船：船身和驾驶室
  sail: svg('<path fill="currentColor" d="M2 13h20l-3 6H5z"/><rect x="7" y="7" width="7" height="6" fill="currentColor"/><rect x="15" y="4" width="2" height="9" fill="currentColor"/>'),
  // 调臂：吊臂和吊钩
  arm: svg('<path fill="currentColor" d="M3 20h8v2H3zM6 20V9l13-6 1 2-12 5.5V20z"/><path d="M18 5v7" stroke="currentColor" stroke-width="1.6"/><path d="M18 12a2.6 2.6 0 1 1-2.6 2.6" fill="none" stroke="currentColor" stroke-width="2"/>'),
  // 作业：网架下到水里
  net: svg('<path d="M12 2v6" stroke="currentColor" stroke-width="2"/><ellipse cx="12" cy="9.5" rx="7" ry="2.2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M5 9.5l2 10h10l2-10M9 10l1 9.5M15 10l-1 9.5M6 14.5h12" fill="none" stroke="currentColor" stroke-width="1.6"/>'),
  // 网口落点
  ring: svg('<circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-dasharray="4.5 2.6"/><path d="M12 9v6M9 12h6" stroke="currentColor" stroke-width="1.8"/>'),
  // 下网预告：金圈带得上来；灰圈打叉碰得到、带不上来；橙圈会刮到硬东西
  yes: svg('<circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="3.4"/>'),
  // 和海面上的一样：打叉是红牌黑叉，橙圈右上角挂一块锈牌「!」
  miss: svg('<circle cx="11" cy="13" r="8" fill="none" stroke="currentColor" stroke-width="2.4" stroke-dasharray="3.6 2.4"/><circle cx="17.6" cy="6.4" r="5.4" fill="#ff8a6a" stroke="#2a0e08" stroke-width="1.4"/><path d="M15.6 4.4l4 4M19.6 4.4l-4 4" stroke="#2a0e08" stroke-width="1.8"/>'),
  hard: svg('<circle cx="11" cy="13" r="8" fill="none" stroke="currentColor" stroke-width="2.4" stroke-dasharray="3.6 2.4"/><circle cx="17.6" cy="6.4" r="5.4" fill="#ff9a4a" stroke="#2a1206" stroke-width="1.4"/><path d="M17.6 3.6v3.8" stroke="#10181b" stroke-width="1.9"/><rect x="16.65" y="8.3" width="1.9" height="1.9" fill="#10181b"/>'),
  // 够得着的范围：船外一圈虚线
  reach: svg('<circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="1.8" stroke-dasharray="2.8 2.2"/><path fill="currentColor" d="M8 10.5h8l-1.2 3H9.2z"/>'),
  // 方向
  arrow: svg('<path fill="currentColor" opacity=".5" d="M1 3h5.5l9 9-9 9H1l9-9z"/><path fill="currentColor" d="M9 3h5.5l9 9-9 9H9l9-9z"/>'),
  // 回波（测深图）
  sonar: svg('<rect x="2" y="3" width="20" height="18" fill="none" stroke="currentColor" stroke-width="2"/><path d="M4 14l4-1 3 1 4-2 5 1v6H4z" fill="currentColor"/><rect x="9" y="7" width="2" height="2" fill="currentColor"/><rect x="14" y="8" width="2" height="2" fill="currentColor"/>'),
  // 挡住 / 不行
  no: svg('<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2.6"/><path d="M6 18L18 6" stroke="currentColor" stroke-width="2.6"/>'),
  // 自动演示：播放
  play: svg('<path fill="currentColor" d="M7 4l13 8-13 8z"/>'),
  // 锚：标题下的徽记、收获单上的入舱章
  anchor: svg('<circle cx="12" cy="4.6" r="2.3" fill="none" stroke="currentColor" stroke-width="1.9"/><path d="M12 7v14M7.5 10.5h9" stroke="currentColor" stroke-width="2.2"/><path d="M3.5 13.5c.6 4.4 4 7.2 8.5 7.2s7.9-2.8 8.5-7.2" fill="none" stroke="currentColor" stroke-width="2.2"/><path fill="currentColor" d="M1.6 14.8l2-3.6 2.3 3.4zM22.4 14.8l-2-3.6-2.3 3.4z"/>'),
  // 债本：一本厚账，书脊上一道铁箍（素材还没有，先用代码画：素材/待画.md「图标-债本」）
  book: svg('<path fill="currentColor" d="M5 2.5h13.5V19H6.6a1.6 1.6 0 0 0 0 3.2h11.9V20.4H20V23.7H6.6A3.1 3.1 0 0 1 3.5 20.6V4a1.5 1.5 0 0 1 1.5-1.5z"/><path d="M8 7.2h7.5M8 10.6h5.2" stroke="rgba(0,0,0,.42)" stroke-width="1.7"/><rect x="3.5" y="13.6" width="15" height="2" fill="rgba(0,0,0,.3)"/>'),
  // 甲板：加宽的平台上码着两包（素材还没有，先用代码画：素材/待画.md「图标-甲板」）
  deck: svg('<path fill="currentColor" d="M1.5 16h21l-2.4 4.6H3.9z"/><path fill="currentColor" d="M3.4 15.2c-.5-2.6 1-4.8 3.9-4.9 2.9-.1 4.4 2 3.9 4.9zM12.8 15.2c-.5-2.6 1-4.8 3.9-4.9 2.9-.1 4.4 2 3.9 4.9z"/><path d="M1.5 13.6h21" stroke="currentColor" stroke-width="1.4" stroke-dasharray="2 1.6"/>'),
  // 水泵：泵身、一根水管喷出水（素材还没有，先用代码画：素材/待画.md「图标-水泵」）
  pump: svg('<rect x="2.5" y="11" width="9" height="9.5" rx="1.4" fill="currentColor"/><circle cx="7" cy="15.7" r="2.4" fill="none" stroke="rgba(0,0,0,.42)" stroke-width="1.6"/><path d="M11.5 13.5h3.6a3 3 0 0 0 3-3V7" fill="none" stroke="currentColor" stroke-width="2.4"/><path d="M18 5.4l-2.6-2.6M18 5.4V1.6M18 5.4l2.6-2.6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>'),
};

// 做好了素材的图标（素材/规格.md 第 9 节）：12×12 格的白色剪影，用 CSS 遮罩照所在的地方上色（和原来的矢量图一样跟着 currentColor），
// 大小取最近的 12 的整数倍（一格整数个像素，不糊）。遮罩放在里面一层，外层的投影滤镜（drop-shadow）照旧描出剪影的边
const PX = { fuel: '图标-燃油', coin: '图标-钱币', crate: '图标-件数', depth: '图标-水深', arm: '图标-打捞', net: '图标-作业' }; // 不是玩家看的：素材的文件名
for (const [k, n] of Object.entries(PX)) {
  const url = image(n);
  if (url) ICON[k] = `<span class="ic px" aria-hidden="true"><i style="-webkit-mask-image:url(${url});mask-image:url(${url})"></i></span>`;
}

// 打包：src/main.js → build/game.js，src/gallery.js → build/gallery.js（经典脚本，file:// 直接双击 index.html 也能运行）
// 对比/d/ 那一版入库时没带这份脚本；照它的 build/ 和早期 rounds/001-r00-free/tools/build.mjs 补回。
import * as esbuild from 'esbuild';
const watch = process.argv.includes('--watch');
const dev = watch || process.argv.includes('--dev');
const opts = {
  entryPoints: { game: 'src/main.js', gallery: 'src/gallery.js' },
  bundle: true,
  format: 'iife',
  target: ['chrome110', 'safari16'],
  outdir: 'build',
  minify: !dev,
  sourcemap: dev ? 'inline' : false,
  legalComments: 'none',
  logLevel: 'info',
  // 素材（src/assets/files/，tools/素材进游戏.py 从 素材/ 搬来的）：模型当二进制、图当 data URL 打进代码，file:// 打开也能用
  loader: { '.glb': 'binary', '.png': 'dataurl' },
};
if (watch) { const ctx = await esbuild.context(opts); await ctx.watch(); }
else await esbuild.build(opts);

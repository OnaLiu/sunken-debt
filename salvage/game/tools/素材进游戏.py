#!/usr/bin/env python3
"""把游戏用到的素材搬进游戏自己的目录（素材/ 不上网页）。

python3 tools/素材进游戏.py
  照 src/assets/素材.json 的「用到」，把 素材/<名字>/out.glb（模型）或 out.png（图）复制成 src/assets/files/<名字>.glb|.png，
  生成 src/assets/files.gen.js（esbuild 把 .glb 当二进制、.png 当 data URL 打进 build/game.js、build/gallery.js），
  最后列出每样多大、一共多大。素材重出以后重跑一遍再 npm run build。
"""
import json, shutil, sys
from pathlib import Path

game = Path(__file__).resolve().parent.parent
src = game / 'src' / 'assets'
names = json.loads((src / '素材.json').read_text())['用到']
files = src / 'files'
files.mkdir(exist_ok=True)
keep, lines, total = set(), [], 0
for i, n in enumerate(names):
    d = game / '素材' / n
    f = d / 'out.glb'
    if not f.exists():
        f = d / 'out.png'
    if not f.exists():
        sys.exit(f'没有 {d}/out.glb 或 out.png')
    to = files / (n + f.suffix)
    shutil.copyfile(f, to)
    keep.add(to.name)
    total += to.stat().st_size
    lines.append((i, n, to.name, to.stat().st_size))
for old in files.iterdir():
    if old.name not in keep:
        old.unlink()
out = ['// 生成：tools/素材进游戏.py（不要手改：改 素材.json 再重跑）', '']
out += [f"import a{i} from './files/{fn}';" for i, n, fn, _ in lines]
out += ['', 'export const FILES = {']
out += [f"  '{n}': a{i}," for i, n, fn, _ in lines]
out += ['};', '']
(src / 'files.gen.js').write_text('\n'.join(out))
for _, n, fn, s in lines:
    print(f'{s/1024:8.1f} KB  {fn}')
print(f'{total/1024/1024:8.2f} MB  一共 {len(lines)} 样')

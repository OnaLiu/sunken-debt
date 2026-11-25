"""素材摆位图：把游戏里一块海底现在的样子画成两张图，给做素材的人对位置用（不是素材本身）。

  <地块>-底色.png   这一块地现在每一处的底色（地形顶点色双线性放大），正上方看，上北（-z）右东（+x）
  <地块>-摆位图.png 同一张叠上坐标格（每 4 米）、深度数字、沉船占地（褐点）、断桅（浅褐点）、礁石（灰圈）、捞获（金圈和名字）

用法（先用 moment.mjs 的探针「素材·地块」把那一块的数拿出来，再画）：
  node tools/moment.mjs 这一刻 0.3 --probe @素材·地块 --no-shot [--pre "window.__region=[x0,x1,z0,z1]"] > .ai/试跑/地块.json
  python3 tools/素材摆位图.py .ai/试跑/地块.json 素材/基准/场地 [--ppm 42.67] [--label 沉船@1,7 --label 断桅@12.5,9.6 ...]
第一段·归潮沙湾 素材单（2026-11-21）用它画了 素材/基准/场地-底色.png、场地-摆位图.png。
"""
import json, sys, argparse
import numpy as np
from PIL import Image, ImageDraw, ImageFont

ap = argparse.ArgumentParser()
ap.add_argument('src'); ap.add_argument('out')
ap.add_argument('--ppm', type=float, default=2048 / 48)
ap.add_argument('--label', action='append', default=[])
a = ap.parse_args()
line = [l for l in open(a.src, encoding='utf-8').read().splitlines() if l.startswith('{') and '"probe"' in l][-1]
d = json.loads(line)['probe']
X0, X1, Z0, Z1 = d['region']
ppm = a.ppm
W, H = round((X1 - X0) * ppm), round((Z1 - Z0) * ppm)
nx, nz = X1 - X0 + 1, Z1 - Z0 + 1
col = np.zeros((nz, nx, 3)); hgt = np.zeros((nz, nx))
for x, z, y, r, g, b in d['grid']:
    i, j = int(round(x - X0)), int(round(z - Z0)); col[j, i] = (r, g, b); hgt[j, i] = y

def up(arr):
    jj = np.linspace(0, nz - 1, H); ii = np.linspace(0, nx - 1, W)
    j0 = np.floor(jj).astype(int).clip(0, nz - 2); i0 = np.floor(ii).astype(int).clip(0, nx - 2)
    fj = (jj - j0)[:, None]; fi = (ii - i0)[None, :]
    if arr.ndim == 3: fj = fj[..., None]; fi = fi[..., None]
    return arr[j0][:, i0] * (1 - fj) * (1 - fi) + arr[j0][:, i0 + 1] * (1 - fj) * fi + arr[j0 + 1][:, i0] * fj * (1 - fi) + arr[j0 + 1][:, i0 + 1] * fj * fi

C = up(col); HH = up(hgt)
base = Image.fromarray((C.clip(0, 1) * 255).astype(np.uint8))
base.save(a.out + '-底色.png')
im = base.convert('RGBA'); ov = Image.new('RGBA', im.size, (0, 0, 0, 0)); dr = ImageDraw.Draw(ov)
font = small = ImageFont.load_default()
for f in ['/System/Library/Fonts/PingFang.ttc', '/System/Library/Fonts/STHeiti Medium.ttc', '/System/Library/Fonts/Hiragino Sans GB.ttc']:
    try: font = ImageFont.truetype(f, 26); small = ImageFont.truetype(f, 20); break
    except Exception: pass
P = lambda x, z: ((x - X0) * ppm, (z - Z0) * ppm)
TXT = dict(fill=(255, 255, 255, 255), font=font, stroke_width=3, stroke_fill=(0, 0, 0, 255))
lv = np.floor(-HH / 2.0)
ys, xs = np.nonzero((lv[1:, 1:] != lv[:-1, 1:]) | (lv[1:, 1:] != lv[1:, :-1]))
for y, x in zip(ys, xs): ov.putpixel((int(x), int(y)), (20, 40, 60, 150))
for x in range(X0 + 2, X1, 8):
    for z in range(Z0 + 2, Z1, 6):
        px, py = P(x, z); dr.text((px, py), f'{-hgt[z - Z0, x - X0]:.0f}米深', fill=(25, 45, 70, 235), font=small)
for x in range(X0, X1 + 1, 4):
    dr.line([P(x, Z0), P(x, Z1)], fill=(255, 255, 255, 60), width=1); dr.text((P(x, Z0)[0] + 3, 2), f'x{x}', fill=(255, 255, 255, 200), font=small)
for z in range(Z0, Z1 + 1, 4):
    dr.line([P(X0, z), P(X1, z)], fill=(255, 255, 255, 60), width=1); dr.text((3, P(X0, z)[1] + 2), f'z{z}', fill=(255, 255, 255, 200), font=small)
inR = lambda x, z: X0 <= x <= X1 and Z0 <= z <= Z1
for x, z, y in d['wreck']:
    if inR(x, z): px, py = P(x, z); dr.ellipse([px - 9, py - 9, px + 9, py + 9], fill=(110, 60, 30, 70))
for x, z, y in d['mast']:
    if inR(x, z): px, py = P(x, z); dr.ellipse([px - 6, py - 6, px + 6, py + 6], fill=(140, 90, 40, 120))
for k, x, z in d['rocks']:
    if k.startswith('Ico'): px, py = P(x, z); dr.ellipse([px - 14, py - 14, px + 14, py + 14], outline=(60, 60, 60, 230), width=3)
NAMES = {'jar': '陶罐', 'jar2': '陶罐', 'rope': '缆绳卷', 'copperset': '铜锅', 'barrel': '箍桶', 'seal': '铜印（埋着）', 'chest': '银币匣（舱里）', 'sack': '货袋（舱里）',
         'tube': '信筒', 'tube2': '信筒', 'lantern': '铜灯', 'pulley': '滑轮', 'hinge': '铰链', 'anchor': '锚', 'plank': '船板', 'stave': '桶板', 'ropebit': '断缆头', 'shards': '碎陶片'}
for k, x, z, y in d['items']:
    if inR(x, z):
        px, py = P(x, z); r = 0.45 * ppm
        dr.ellipse([px - r, py - r, px + r, py + r], outline=(255, 210, 60, 255), width=4)
        dr.text((px + r + 4, py - 14), NAMES.get(k, k), **{**TXT, 'fill': (255, 230, 120, 255)})
for lab in a.label:
    t, xz = lab.rsplit('@', 1); x, z = map(float, xz.split(',')); dr.text(P(x, z), t, **TXT)
sx, sy = P(X1 - 10, Z1 - 1.5); dr.line([sx, sy, sx + 4 * ppm, sy], fill=(255, 255, 255, 255), width=6); dr.text((sx, sy - 34), '4 米', **TXT)
dr.text((W - 160, 20), '↑ 北（-z）', **TXT)
Image.alpha_composite(im, ov).convert('RGB').save(a.out + '-摆位图.png')
print(a.out + '-底色.png', a.out + '-摆位图.png', f'{W}×{H}')

from pathlib import Path
from PIL import Image, ImageDraw, PngImagePlugin

root = Path(__file__).resolve().parent
rows = [
    '............',
    '......#####.',
    '..#####...#.',
    '..##......#.',
    '..##......#.',
    '..##....#.#.',
    '..##....###.',
    '..##........',
    '..##........',
    '.####.......',
    '.####.......',
    '............',
]
# Quantize image_gen alpha, remove fringes, and repair to the exact stencil.
source = Image.open(root / 'generated.png').convert('RGBA')
alpha = source.getchannel('A')
bbox = alpha.point(lambda a: 255 if a >= 128 else 0).getbbox()
assert bbox
coverage = alpha.crop(bbox).resize((10, 10), Image.Resampling.BOX)
logical = Image.new('RGBA', (12, 12), (0, 0, 0, 0))
for y in range(10):
    for x in range(10):
        if coverage.getpixel((x, y)) >= 128:
            logical.putpixel((x+1, y+1), (255, 255, 255, 255))
for y, row in enumerate(rows):
    for x, cell in enumerate(row):
        logical.putpixel((x, y), (255, 255, 255, 255) if cell == '#' else (0, 0, 0, 0))
out = logical.resize((72, 72), Image.Resampling.NEAREST)
meta = PngImagePlugin.PngInfo()
meta.add(b'sRGB', b'\x00')
out.save(root / 'out.png', pnginfo=meta)

saved = Image.open(root / 'out.png').convert('RGBA')
assert saved.size == (72, 72)
assert set(saved.getdata()) == {(0, 0, 0, 0), (255, 255, 255, 255)}
for size in (72, 36, 24):
    small = saved.resize((size, size), Image.Resampling.NEAREST)
    step = size // 12
    for y, row in enumerate(rows):
        for x, cell in enumerate(row):
            block = small.crop((x*step, y*step, (x+1)*step, (y+1)*step))
            assert set(block.getdata()) == {(255, 255, 255, 255) if cell == '#' else (0, 0, 0, 0)}
cells = {(x, y) for y, row in enumerate(rows) for x, cell in enumerate(row) if cell == '#'}
seen = {next(iter(cells))}
pending = list(seen)
while pending:
    x, y = pending.pop()
    for neighbor in ((x-1,y), (x+1,y), (x,y-1), (x,y+1)):
        if neighbor in cells and neighbor not in seen:
            seen.add(neighbor)
            pending.append(neighbor)
assert seen == cells
preview = Image.new('RGBA', (540, 290), '#18373B')
d = ImageDraw.Draw(preview)
for x, size in [(24,72), (140,36), (220,24)]:
    d.text((x,16), f'{size} px', fill='white')
    preview.alpha_composite(saved.resize((size,size), Image.Resampling.NEAREST), (x,42))
preview.alpha_composite(saved.resize((240,240), Image.Resampling.NEAREST), (290,24))
preview.convert('RGB').save(root / 'preview.png')
print('PASS: exact matrix at 72/36/24px; RGBA PNG; pure white and transparent; one edge-connected component.')
print('\n'.join(rows))

from PIL import Image, ImageDraw
from pathlib import Path

source = Image.open('/Users/vinaygao/.codex/generated_images/01a1fd77-78b0-7f10-b2d5-f658ae734d31/exec-5847c357-bb32-409c-850a-5bfe687ed17e.png').convert('RGBA')
# Sample the generated pump onto its intended logical grid, then repair its
# broken transparency and align the supplied exact geometry to whole cells.
mask = source.getchannel('A').crop((238,180,1042,1104)).resize((12,12), Image.Resampling.BOX).point(lambda v: 255 if v >= 128 else 0)
d = ImageDraw.Draw(mask)
# Remove generated edge residue and regularize the six-by-ten pump body.
d.rectangle((0,0,11,11), fill=0)
d.rectangle((1,0,6,9), fill=255)
d.rectangle((2,1,5,3), fill=0)
# Eight-cell plinth, extending one cell beyond each side of the body.
d.rectangle((0,10,7,10), fill=255)
# One-cell hose, stepping from upper right into a separated hanging U hook.
for x,y in [(7,2),(8,2),(9,2),(9,3),(10,3),(10,4),(10,5),(10,6),(10,7),(10,8),(9,8),(8,8),(8,7),(8,6),(8,5)]:
    d.point((x,y), fill=255)
icon = Image.new('RGBA',(12,12),(255,255,255,0))
icon.putalpha(mask)
icon = icon.resize((72,72),Image.Resampling.NEAREST)
icon.save('out.png')
# Review the delivered silhouette at all three intended display sizes.
preview = Image.new('RGB',(660,310),'#152d30')
for size,x in [(72,35),(36,140),(24,215)]:
    im=icon.resize((size,size),Image.Resampling.NEAREST)
    preview.paste(im,(x,35),im)
large=icon.resize((216,216),Image.Resampling.NEAREST)
preview.paste(large,(310,35),large)
ref=Image.open('/Users/vinaygao/Projects/sunken-debt/salvage/game/素材/基准/图标-现在.png').convert('RGB')
preview.paste(ref.crop((20,20,120,150)),(35,150))
preview.save('preview.png')
# Verify binary alpha, pure white, uniform six-pixel cells, exact window.
a=Image.open('out.png').convert('RGBA')
assert a.size == (72,72)
assert set(a.getdata()) == {(255,255,255,0),(255,255,255,255)}
for y in range(12):
    for x in range(12):
        assert len(set(a.crop((x*6,y*6,x*6+6,y*6+6)).getdata())) == 1
assert all(mask.getpixel((x,y)) == 0 for y in range(1,4) for x in range(2,6))
assert mask.getbbox() == (0,0,11,11)
print('Verified: 72x72 RGBA, white/transparent only, 6x6 cells, 4x3 window, 11x11 silhouette.')
print('\n'.join(''.join('#' if mask.getpixel((x,y)) else '.' for x in range(12)) for y in range(12)))

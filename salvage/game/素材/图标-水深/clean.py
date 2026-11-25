from PIL import Image, ImageDraw
import json
source = Image.open('generated.png').convert('RGBA')
# Quantize the generated silhouette onto the specified logical grid.
alpha = source.getchannel('A').crop((80, 64, 1160, 1174)).resize((12, 12), Image.Resampling.BOX)
grid = alpha.point(lambda v: 255 if v >= 128 else 0)
# Correct displaced boundary cells to the requested wave and arrow geometry.
rows = [
'............',
'.##....##...',
'#..#..#..##.',
'....##......',
'............',
'.....##.....',
'.....##.....',
'.....##.....',
'.....##.....',
'...######...',
'....####....',
'.....##.....',
]
for y,row in enumerate(rows):
    for x,cell in enumerate(row):
        grid.putpixel((x,y), 255 if cell=='#' else 0)
icon = Image.new('RGBA',(12,12),(255,255,255,0))
icon.putalpha(grid)
icon = icon.resize((72,72),Image.Resampling.NEAREST)
icon.save('out.png')
# Inspect against the fuel icon at game display sizes.
fuel = Image.open('/Users/vinaygao/Projects/sunken-debt/salvage/game/素材/图标-燃油/out.png').convert('RGBA')
preview = Image.new('RGB',(600,300),'#173236')
draw = ImageDraw.Draw(preview)
for i,size in enumerate([72,36,24]):
    x = 30+i*190
    draw.text((x,18),f'{size} px',(220,220,220))
    preview.paste(icon.resize((size,size),Image.Resampling.NEAREST),(x,50),icon.resize((size,size),Image.Resampling.NEAREST))
    f=fuel.resize((size,size),Image.Resampling.NEAREST)
    preview.paste(f,(x+size+14,50),f)
large=icon.resize((144,144),Image.Resampling.NEAREST)
preview.paste(large,(30,145),large)
preview.save('preview.png')
assert icon.size == (72,72)
assert set(icon.getdata()) == {(255,255,255,0),(255,255,255,255)}
for y in range(12):
    for x in range(12):
        assert len(set(icon.crop((x*6,y*6,x*6+6,y*6+6)).getdata()))==1
print(json.dumps({'size':icon.size,'alpha_bbox':icon.getbbox(),'colors':len(set(icon.getdata())),'grid':'12x12; uniform 6x6 cells'},ensure_ascii=False))

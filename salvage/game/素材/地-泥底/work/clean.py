from PIL import Image,ImageDraw,ImageCms
import numpy as np
from scipy import ndimage as nd
import random,json
from pathlib import Path
N=1024
rng=random.Random(421067)
raw=np.asarray(Image.open('work/generated.png').convert('RGB')).astype(float)
centers=np.array([[137,130,113],[126,117,100],[119,108,89],[107,107,102]])
k=((raw[:,:,None,:]-centers[None,None,:,:])**2).sum(-1).argmin(-1)
colors=['#8F8A78','#7F7868','#786E5C','#616666']
out=Image.new('RGB',(N,N),colors[0])
def wrap_paste(mask,color,cx,cy):
 w,h=mask.size
 for dx in [-N,0,N]:
  for dy in [-N,0,N]:out.paste(color,(cx-w//2+dx,cy-h//2+dy),mask)
# Preserve the generated patch silhouettes; calibrate scale, flatten colors, wrap edges.
patches=[(1,127,226,345,290),(1,201,180,76,610),(2,1,180,1006,40),(2,41,245,805,815),(3,1,182,843,389),(3,2,188,341,1006),(2,2,156,536,595)]
for c,idx,width,x,y in patches:
 lab,num=nd.label(k==c); s=nd.find_objects(lab)[idx-1]
 # Use complete generated silhouettes for fragments cut off by the original frame.
 if s[1].start==0 or s[1].stop==raw.shape[1] or s[0].start==0 or s[0].stop==raw.shape[0]:
  sourceclass,sourceidx=(1,127) if idx%2 else (2,41)
  source,_=nd.label(k==sourceclass);ss=nd.find_objects(source)[sourceidx-1]
  mask=Image.fromarray(np.uint8(source[ss]==sourceidx)*255)
  angle={201:73,1:-37,2:118}.get(idx,31)
  mask=mask.rotate(angle,resample=Image.Resampling.NEAREST,expand=True)
  box=mask.getbbox();mask=mask.crop(box)
  # A restrained shear varies the reused fragment while keeping the generated contour.
  m=np.asarray(mask);pad=round(m.shape[1]*.25);warped=np.zeros((m.shape[0],m.shape[1]+pad*2),dtype=np.uint8)
  for row in range(m.shape[0]):
   shift=round(pad*.8*np.sin(row/m.shape[0]*3.1+.7))
   warped[row,pad+shift:pad+shift+m.shape[1]]=m[row]
  mask=Image.fromarray(warped);mask=mask.crop(mask.getbbox())
 else:mask=Image.fromarray(np.uint8(lab[s]==idx)*255)
 w,h=mask.size; scale=width/max(w,h); width=round(w*scale); h=round(h*scale)
 small=mask.resize((max(1,round(width/3)),max(1,round(h/3))),Image.Resampling.NEAREST)
 mask=small.resize((small.width*3,small.height*3),Image.Resampling.NEAREST)
 wrap_paste(mask,colors[c],x,y)
# Exact sized sparse details, periodic positions and flat intrinsic colors.
d=ImageDraw.Draw(out)
def rect(x,y,w,h,color):
 for dx in [-N,0,N]:
  for dy in [-N,0,N]:d.rectangle((x+dx,y+dy,x+w-1+dx,y+h-1+dy),fill=color)
clusters=[(157,126),(560,78),(736,211),(991,281),(450,431),(111,414),(642,527),(264,714),(926,665),(587,915),(60,933),(796,1004)]
for x,y in clusters:
 used=[]
 for i in range(rng.randint(3,6)):
  for attempt in range(100):
   a,b=rng.randint(-13,13),rng.randint(-12,12)
   if all((a-u)**2+(b-v)**2>=64 for u,v in used):break
  used.append((a,b));rect(x+a,y+b,5,5,'#9A9482');rect(x+a+1,y+b+1,3,3,'#5C5445')
for x,y,length,width in [(295,100,24,5),(645,350,29,4),(196,516,18,5),(466,650,32,6),(863,561,16,4),(144,827,25,5),(748,960,21,4)]:
 # one flat diagonally stepped groove, total length measured along its axis
 span=round(length/2**0.5)
 for t in range(0,span,3):rect(x+t,y+round(t*.83),min(3,span-t),width,'#7F7868')
for i in range(92):
 x,y=rng.randrange(N),rng.randrange(N)
 if all((min(abs(x-cx),N-abs(x-cx)))**2+(min(abs(y-cy),N-abs(y-cy)))**2>26**2 for cx,cy in clusters):rect(x,y,3,3,'#A8A394')
profile=ImageCms.ImageCmsProfile(ImageCms.createProfile('sRGB')).tobytes()
out.save('out.png',icc_profile=profile,optimize=True)
tiled=Image.new('RGB',(N*3,N*3))
for x in range(3):
 for y in range(3):tiled.paste(out,(x*N,y*N))
tiled.save('work/平铺检查-3x3.png',optimize=True)
tiled.resize((1536,1536),Image.Resampling.NEAREST).save('work/平铺检查-缩览.png')
ref=Image.open('/Users/vinaygao/Projects/sunken-debt/salvage/game/素材/地-沙底/out.png').convert('RGB')
compare=Image.new('RGB',(2048,1024));compare.paste(ref,(0,0));compare.paste(out,(1024,0));compare.resize((1536,768),Image.Resampling.NEAREST).save('work/沙底对照.png')
a=np.array(out)
check={'size':out.size,'mode':out.mode,'colors':len(out.getcolors(N*N)),'palette_counts':{str(tuple(c)):int(n) for n,c in out.getcolors(N*N)},'edge_mean_jump_x':float(abs(a[:,0].astype(float)-a[:,-1]).mean()),'edge_mean_jump_y':float(abs(a[0].astype(float)-a[-1]).mean())}
Path('work/检查.json').write_text(json.dumps(check,ensure_ascii=False,indent=2))
print(json.dumps(check,ensure_ascii=False))

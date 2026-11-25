from PIL import Image, ImageCms
import numpy as np
from scipy.ndimage import gaussian_filter
from pathlib import Path
import random, json, math
N=1024
rng=random.Random(20261121)
base=(143,138,120); dark=[(127,120,104),(120,110,92)]
a=np.empty((N,N,3),np.uint8);a[:]=base
raw=np.asarray(Image.open('work/generated-v2.png').convert('RGB').resize((N,N),Image.Resampling.BOX)).astype(float)
gray=raw.mean(2)
# Recover the image_gen stipple distribution, removing its continuous lighting variation.
local=gaussian_filter(gray,9,mode='wrap')
chips=(local-gray>3.5)&(local-gray<19)&(gray>104)
density=gaussian_filter(chips.astype(float),7,mode='wrap')
patchmask=np.zeros((N,N),bool)
transition=np.zeros((N,N),bool)
def square(x,y,w,h,color,mask=None):
 yy=(np.arange(y,y+h)%N)[:,None];xx=(np.arange(x,x+w)%N)[None,:]
 a[yy,xx]=color
 if mask is not None:mask[yy,xx]=True
# Four separately scaled generated regions. Two wrap horizontally, one vertically.
patches=[((180,300,800,585),355,220,478,405,0),((660,0,1024,170),332,220,1003,157,1),((0,515,220,810),305,230,23,757,0),((440,825,1024,1024),397,235,690,1009,1)]
patch_stats=[]
for box,w,h,cx,cy,ci in patches:
 x0,y0,x1,y1=box
 f=density[y0:y1,x0:x1]
 f=np.array(Image.fromarray(f.astype('float32')).resize((w,h),Image.Resampling.BILINEAR))
 # No hard boundary: 43–64px transition and interrupted, stippled interiors.
 yy,xx=np.mgrid[:h,:w]
 edge=np.minimum.reduce([xx,yy,w-1-xx,h-1-yy])
 f=gaussian_filter(f,18)
 f=np.clip(f/max(.025,float(np.quantile(f,.97))),0,1)**.5
 f*=np.clip(edge/47,0,1)
 probs=f*.12
 count=0
 for y in range(0,h,4):
  for x in range(0,w,4):
   if rng.random()<probs[y,x]:
    size=rng.choices([2,3,4],[.15,.6,.25])[0]
    px=cx-w//2+x;py=cy-h//2+y
    square(px,py,size,size,dark[ci if rng.random()<.64 else 0],patchmask)
    count+=1
 patch_stats.append({'length_px':w,'width_px':h,'center':[cx,cy],'chips':count})
# Irregular well-spaced details across the whole toroidal field.
# Sparse outer transition tails; every grain is at least 2×2, never subpixel noise.
for i in range(2600):
 x,y=rng.randrange(N),rng.randrange(N)
 size=rng.choices([2,3],[.8,.2])[0]
 square(x,y,size,size,dark[0],patchmask)
details=np.zeros((N,N),bool)
centres=[]
while len(centres)<31:
 x,y=rng.randrange(N),rng.randrange(N)
 if all(min(abs(x-u),N-abs(x-u))**2+min(abs(y-v),N-abs(y-v))**2>100**2 for u,v in centres):centres.append((x,y))
wormcounts=[]
for x,y in centres:
 used=[];k=rng.randint(3,6)
 for i in range(k):
  while True:
   u,v=rng.randrange(-17,18),rng.randrange(-15,16)
   if all((u-p)**2+(v-q)**2>=64 for p,q in used):break
  used.append((u,v))
  square(x+u,y+v,5,5,(154,148,130),details)
  square(x+u+1,y+v+1,3,3,(92,84,69),details)
 wormcounts.append(k)
grooves=[]
for i in range(18):
 x,y=rng.randrange(N),rng.randrange(N)
 length=rng.randint(13,34);width=rng.randint(4,6)
 # staircase strip using 2px steps, never isolated single-pixel texture.
 steps=round(length/math.sqrt(2)/2)
 for t in range(steps):square(x+2*t,y+2*t,2,width,dark[0],details)
 grooves.append([x,y,length,width])
used=[]
for i in range(432):
 while True:
  x,y=rng.randrange(N),rng.randrange(N)
  if all(min(abs(x-u),N-abs(x-u))**2+min(abs(y-v),N-abs(y-v))**2>9**2 for u,v in used) and not details[np.ix_(np.arange(y,y+3)%N,np.arange(x,x+3)%N)].any():break
 used.append((x,y));square(x,y,3,3,(168,163,148),details)
out=Image.fromarray(a)
profile=ImageCms.ImageCmsProfile(ImageCms.createProfile('sRGB')).tobytes()
out.save('out.png',icc_profile=profile,optimize=True)
# Required acceptance views: 512px tiles in a 3×3 array, plus native-size tiling and comparison.
for size,name in [(512,'平铺检查-缩览.png'),(1024,'平铺检查-3x3.png')]:
 tile=out.resize((size,size),Image.Resampling.NEAREST);canvas=Image.new('RGB',(size*3,size*3))
 for x in range(3):
  for y in range(3):canvas.paste(tile,(x*size,y*size))
 canvas.save('work/'+name,optimize=True)
sand=Image.open('/Users/vinaygao/Projects/sunken-debt/salvage/game/素材/地-沙底/out.png').convert('RGB')
compare=Image.new('RGB',(2048,1024));compare.paste(sand,(0,0));compare.paste(out,(1024,0));compare.save('work/沙底对照.png',optimize=True)
# Offset view moves all original boundaries into the middle.
Image.fromarray(np.roll(a,(512,512),(0,1))).save('work/移位接缝检查.png')
colors,counts=np.unique(a.reshape(-1,3),axis=0,return_counts=True)
mean=a.mean((0,1));delta=mean-np.array(base)
check={'size':[N,N],'mode':out.mode,'mean_rgb':mean.tolist(),'mean_delta':delta.tolist(),'patches':patch_stats,'worm_clusters':len(centres),'holes_per_cluster':wormcounts,'grooves':grooves,'debris':432,'debris_per_m2':432/576,'fine_details_fraction':float(details.mean()),'stipple_and_details_fraction':float((details|patchmask).mean()),'palette':{'#%02X%02X%02X'%tuple(c):int(n) for c,n in zip(colors,counts)},'edge_jump_x':float(np.abs(a[:,0].astype(float)-a[:,-1]).mean()),'edge_jump_y':float(np.abs(a[0].astype(float)-a[-1]).mean())}
assert max(abs(delta))<=3
assert not np.all(a==[97,102,102],axis=2).any()
Path('work/检查.json').write_text(json.dumps(check,ensure_ascii=False,indent=2))
print(json.dumps(check,ensure_ascii=False))

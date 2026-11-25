from PIL import Image, ImageCms
import numpy as np
from scipy import ndimage as nd
import json, math
rng=np.random.default_rng(20261121)
N=1024
pal=np.array([[194,181,148],[204,190,154],[179,166,133],[219,214,189],[184,174,150],[138,140,134],[168,163,148],[143,138,120]],dtype=np.uint8)
src=np.array(Image.open('work/generated-v2.png').convert('RGB').resize((N,N),Image.Resampling.LANCZOS))
# Retain generated deposit surface variations and fragment silhouettes; clean to a pixel grid.
lum=src.mean(2)
field=nd.gaussian_filter(lum,18,mode='wrap')
field=(field-field.mean())/(field.std()+1e-9)
Y,X=np.mgrid[:512,:512]*2+1
lab=np.zeros((512,512),np.uint8)
patches=[(75,228,470,260,-28,1),(659,705,446,262,26,1),(650,52,491,264,17,2),(293,694,435,258,-38,2)]
patch_stats=[]
for k,(cx,cy,w,h,angle,color) in enumerate(patches):
 dx=(X-cx+512)%1024-512;dy=(Y-cy+512)%1024-512
 t=np.deg2rad(angle);u=dx*np.cos(t)+dy*np.sin(t);v=-dx*np.sin(t)+dy*np.cos(t)
 phi=np.arctan2(v/(h/2),u/(w/2))
 radius=np.sqrt((u/(w/2))**2+(v/(h/2))**2)
 # Broad asymmetry comes from the generated sand, not cut polygon outlines.
 edge=1+.09*np.sin(3*phi+k)+.055*np.sin(5*phi+1.7*k)+.07*field[1::2,1::2]
 signed=(edge-radius)*(h/2)
 probability=.7*np.clip((signed+28)/56,0,1)
 # Disconnected generated micro-deposits dissolve the broad shape throughout.
 # The source field modulates sparse grains without leaving one solid central island.
 modulation=np.clip(.19+.055*field[1::2,1::2],.12,.30)
 probability*=modulation
 # 2x2 and 4x4 grains: each larger grain is indivisible.
 grain=rng.random((256,256)).repeat(2,0).repeat(2,1)
 fine=rng.random((512,512))
 draw=np.where(rng.random((256,256)).repeat(2,0).repeat(2,1)<.45,grain,fine)
 m=draw<probability
 lab[m]=color
 patch_stats.append({'color':int(color),'center':[cx,cy],'length_px':w,'transition_px':56,'painted_px':int(m.sum()*4)})
labels=lab.repeat(2,0).repeat(2,1)
detail=np.zeros((N,N),np.uint8)
protected=np.zeros((N,N),bool)
# Source chip silhouettes are reduced to 2px cells before stamping, dropping anti-alias and shading.
bright=(src[:,:,0]>209)&(src[:,:,1]>199)&((src[:,:,0]-src[:,:,2])<48)
cc,n=nd.label(bright)
pool=[]
for i,sl in enumerate(nd.find_objects(cc),1):
 if sl is None:continue
 m=cc[sl]==i
 if 5<=m.sum()<=100 and max(m.shape)<=16:
  z=Image.fromarray((m*255).astype('uint8')).resize((2,2),Image.Resampling.BOX)
  mask=np.array(z)>80
  if mask.sum()>=2:pool.append(mask)
assert pool

def stamp(x,y,mask,color):
 if mask.shape!=(3,3):x=(x//2)*2;y=(y//2)*2
 yy,xx=np.nonzero(mask)
 yy=(yy+y)%N;xx=(xx+x)%N
 if protected[yy,xx].any():return
 detail[yy,xx]=color
 if mask.shape==(3,3):protected[yy,xx]=True

def chip(x,y,color,large=False):
 if large:
  mask=pool[int(rng.integers(len(pool)))].repeat(2,0).repeat(2,1)
 else:mask=np.ones((2,2),bool)
 stamp(int(x),int(y),mask,color)

# Fourteen small shell beds, sampled from dense center to sparse outskirts.
beds=[(111,102),(369,184),(766,132),(963,315),(599,370),(243,398),(72,596),(443,614),(808,518),(662,774),(938,872),(275,858),(480,976),(63,960)]
for j,(cx,cy) in enumerate(beds):
 radius=int(rng.integers(27,33))
 # 4px fragments with irregular gaps, each minimum color component 2x2.
 for oy in range(-radius,radius+1,4):
  for ox in range(-radius,radius+1,4):
   r=np.hypot(ox/(radius*(1+.17*np.sin(oy/9+j))),oy/radius)
   r*=1+.14*np.sin(ox/11+oy/13+j*2)
   p=.98*max(0,1-r**2)**.35 if r<1 else 0
   if rng.random()<p:
    mask=pool[int(rng.integers(len(pool)))].repeat(2,0).repeat(2,1)
    # Mostly muted shell, bright chips remain small and interspersed.
    c=3 if rng.random()<.075 else 4
    stamp(cx+ox,cy+oy,mask,c)
# 1.65 isolated 3x3 shells per square metre. Avoid overwriting beds and preserve 3px squares.
placed=0
while placed<950:
 x,y=map(int,rng.integers(4,N-4,2))
 if detail[y-2:y+5,x-2:x+5].any():continue
 if np.any(labels[y-2:y+5,x-2:x+5]!=0):continue
 stamp(x,y,np.ones((3,3),bool),3 if rng.random()<.20 else 4)
 placed+=1
# 18 pebble groups, each 3-8 flat stones, a 2px grid avoids isolated subtexel colors.
pebbles=[(207,74),(549,146),(856,237),(57,350),(401,314),(721,447),(924,567),(213,619),(521,539),(681,650),(338,738),(117,810),(780,889),(577,921),(981,70),(423,33),(26,704),(920,1001)]
for cx,cy in pebbles:
 used=[]
 for j in range(int(rng.integers(3,9))):
  for _ in range(200):
   ox,oy=map(int,rng.integers(-10,11,2)*2)
   if all(abs(ox-a)>=6 or abs(oy-b)>=6 for a,b in used):break
  used.append((ox,oy))
  chip(cx+ox,cy+oy,5 if rng.random()<.35 else 6,True)
# Twenty-five tiny dark-speck pockets.
for j in range(25):
 cx,cy=map(int,rng.integers(0,N,2))
 for k in range(int(rng.integers(3,7))):
  ox,oy=map(int,rng.integers(-7,8,2)*2)
  chip(cx+ox,cy+oy,7,False)
labels[detail>0]=detail[detail>0]
arr=pal[labels]
img=Image.fromarray(arr)
profile=ImageCms.ImageCmsProfile(ImageCms.createProfile('sRGB')).tobytes()
img.save('out.png',icc_profile=profile)
small=img.resize((512,512),Image.Resampling.NEAREST)
preview=Image.new('RGB',(1536,1536))
for y in range(3):
 for x in range(3):preview.paste(small,(512*x,512*y))
preview.save('work/平铺检查-3x3.png')
img.crop((0,0,512,512)).resize((1024,1024),Image.Resampling.NEAREST).save('work/颗粒检查-2x.png')
# Seam energy is compared against internal neighboring columns/rows; toroidal placement has no border edit.
a=arr.astype(float)
seam=[float(np.abs(a[:,0]-a[:,-1]).mean()),float(np.abs(a[0]-a[-1]).mean())]
internal=[float(np.abs(a[:,1:]-a[:,:-1]).mean()),float(np.abs(a[1:]-a[:-1]).mean())]
report={'size':list(img.size),'mode':img.mode,'mean_RGB':a.mean((0,1)).tolist(),'mean_error':(a.mean((0,1))-pal[0]).tolist(),'detail_coverage_percent':float((detail>0).mean()*100),'shell_beds':14,'isolated_shells':placed,'pebble_groups':18,'dark_speck_pockets':25,'patches':patch_stats,'edge_step_RGB':seam,'internal_step_RGB':internal,'source_chip_silhouettes':len(pool)}
assert np.max(np.abs(a.mean((0,1))-pal[0]))<=3,report
assert 3<=(detail>0).mean()*100<=6,report
open('work/验收.json','w').write(json.dumps(report,indent=2,ensure_ascii=False))
print(json.dumps(report,indent=2,ensure_ascii=False))

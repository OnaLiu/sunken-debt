from PIL import Image, ImageDraw, ImageCms, ImageFilter
import numpy as np
from scipy import ndimage as nd
import random, json
random.seed(219)
N=1024
src=Image.open('work/generated.png').convert('RGB').resize((N,N),Image.Resampling.NEAREST)
a=np.array(src).astype(int)
# Recover generated flat regions, discarding the model's fine tonal noise.
centers=np.array([[185,172,141],[194,180,145],[172,160,129],[218,211,178],[168,157,126],[137,142,133],[159,159,139],[140,129,97]])
labels=((a[:,:,None,:]-centers[None,None,:,:])**2).sum(-1).argmin(-1)
colors=['#C2B594','#CCBE9A','#B3A685','#DBD6BD','#B8AE96','#8A8C86','#A8A394','#8F8A78']
canvas=Image.new('RGB',(N,N),colors[0])
def components(mask,minsize=1):
 lab,n=nd.label(mask); out=[]
 for k,sl in enumerate(nd.find_objects(lab),1):
  if sl is None:continue
  m=lab[sl]==k
  if m.sum()>=minsize:out.append((int(m.sum()),sl,m))
 return sorted(out,key=lambda v:-v[0])
def paste_wrap(sprite,x,y):
 for dx in [-N,0,N]:
  for dy in [-N,0,N]: canvas.paste(sprite,(x+dx,y+dy),sprite)
def patch(mask,color,size,angle,center):
 raw=Image.fromarray((mask*255).astype('uint8'))
 padded=Image.new('L',(raw.width+120,raw.height+120));padded.paste(raw,(60,60))
 rounded=padded.filter(ImageFilter.GaussianBlur(12)).point(lambda p:255 if p>120 else 0)
 rounded=rounded.crop(rounded.getbbox())
 # Break regular silhouettes using coarse, continuous displacement of generated masks.
 rw,rh=rounded.size
 rng=np.random.default_rng(int(mask.sum())+angle)
 fields=[]
 for _ in range(2):
  coarse=Image.fromarray(rng.uniform(0,255,(8,8)).astype('uint8')).resize((rw,rh),Image.Resampling.BICUBIC)
  fields.append((np.array(coarse).astype(float)-127.5)/127.5*18)
 yy,xx=np.mgrid[:rh,:rw]
 warped=nd.map_coordinates(np.array(rounded),[yy+fields[0],xx+fields[1]],order=0,mode='constant',cval=0)
 parts=components(warped>0,1)
 lab,n=nd.label(warped>0)
 sizes=np.bincount(lab.ravel());sizes[0]=0
 rounded=Image.fromarray(((lab==sizes.argmax())*255).astype('uint8'))
 im=rounded.resize(size,Image.Resampling.NEAREST)
 im=im.rotate(angle,Image.Resampling.NEAREST,expand=True)
 im=im.resize((max(1,im.width//3),max(1,im.height//3)),Image.Resampling.NEAREST)
 im=im.resize((im.width*3,im.height*3),Image.Resampling.NEAREST)
 # Keep the generated contours, with every boundary step at least three pixels.
 sprite=Image.new('RGBA',im.size,color);sprite.putalpha(im)
 paste_wrap(sprite,center[0]-im.width//2,center[1]-im.height//2)
# Reuse generated irregular silhouettes, corrected to 3–6 m scale, wrapped on a torus.
light=components(labels==1,1000);dark=components(labels==2,1000)
print('patch source areas',[(v[0],v[2].shape) for v in light],[(v[0],v[2].shape) for v in dark])
for i,(pos,sz,rot) in enumerate([((62,100),(193,157),19),((640,263),(224,173),-23),((873,738),(168,212),47),((309,813),(149,151),5)]):
 patch(light[i%len(light)][2],colors[1],sz,rot,pos)
for i,(pos,sz,rot) in enumerate([((360,362),(211,157),-11),((967,353),(163,184),25),((550,968),(224,180),-48),((184,615),(139,163),61)]):
 patch(dark[i%len(dark)][2],colors[2],sz,rot,pos)
# Extract genuine fragment silhouettes from generation and constrain each to requested texel size.
shell=components(labels==3,5)
pebble=components(labels==5,5)
def fragment(pool,color,w,h):
 m=random.choice(pool[:70])[2]
 mask=Image.fromarray((m*255).astype('uint8')).resize((w,h),Image.Resampling.NEAREST)
 # Small chips use solid blocks so there are no sub-three-pixel flecks.
 mask=Image.new('L',(w,h),255)
 im=Image.new('RGBA',(w,h),color); im.putalpha(mask);return im
shellpos=[(165,206),(438,107),(770,479),(285,539),(593,663),(62,873),(932,956),(987,62)]
for cx,cy in shellpos:
 radius=random.randint(12,27)
 count=random.randint(25,44)
 placed=[]
 for j in range(count):
  for attempt in range(100):
   x=round(random.gauss(0,radius*.38));y=round(random.gauss(0,radius*.32))
   if x*x+y*y>radius*radius:continue
   if all(abs(x-u)>=5 or abs(y-v)>=5 for u,v in placed):break
  else:continue
  placed.append((x,y))
  paste_wrap(fragment(shell,random.choice(colors[3:5]),random.randint(3,4),random.randint(3,4)),cx+x,cy+y)
for cx,cy in [(91,390),(337,71),(543,302),(856,170),(967,591),(431,729),(741,876),(195,967),(680,52),(338,917),(46,699)]:
 placed=[]
 for j in range(random.randint(3,8)):
  for attempt in range(60):
   x=random.randint(-10,10);y=random.randint(-8,8)
   if all(abs(x-u)>=6 or abs(y-v)>=6 for u,v in placed):break
  placed.append((x,y))
  paste_wrap(fragment(pebble,random.choice(colors[5:7]),random.randint(3,5),random.randint(3,4)),cx+x,cy+y)
for cx,cy in [(249,314),(699,327),(842,619),(503,495),(357,1007),(80,47)]:
 for j in range(random.randint(3,5)):
  paste_wrap(Image.new('RGBA',(3,3),colors[7]),cx+random.randint(-9,9),cy+random.randint(-8,8))
# Match three-pixel boundary bands exactly for robust nearest-neighbor wrap.
 final=np.array(canvas)
 final[-3:,:,:]=final[0:1,:,:]
 final[:3,:,:]=final[0:1,:,:]
 final[:,-3:,:]=final[:,0:1,:]
 final[:,:3,:]=final[:,0:1,:]
 canvas=Image.fromarray(final)
 profile=ImageCms.ImageCmsProfile(ImageCms.createProfile('sRGB')).tobytes()
canvas.save('out.png',icc_profile=profile)
small=canvas.resize((512,512),Image.Resampling.NEAREST)
preview=Image.new('RGB',(1536,1536))
for x in range(3):
 for y in range(3):preview.paste(small,(x*512,y*512))
preview.save('work/平铺检查-3x3.png')
arr=np.array(canvas)
unique,counts=np.unique(arr.reshape(-1,3),axis=0,return_counts=True)
print('colors',dict(zip([tuple(x) for x in unique],map(int,counts))))
print('edge differences LR/TB',np.sum(np.any(arr[:,0]!=arr[:,-1],axis=1)),np.sum(np.any(arr[0]!=arr[-1],axis=1)))

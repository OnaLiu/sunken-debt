from PIL import Image, ImageDraw, ImageCms, ImageFilter
import numpy as np
from scipy import ndimage as ndi
from pathlib import Path
import json, math
R=Path('/Users/vinaygao/Projects/sunken-debt/salvage/game/素材')
N=2048; S=N/48; rng=np.random.default_rng(2718)
base=Image.open(R/'基准/场地-底色.png').convert('RGB')
im=base.copy(); d=ImageDraw.Draw(im)
def px(x,z):return (round((x+14)*S),round((z+8)*S))
def poly(points,c):
 global im,d
 mask=Image.new('L',(N,N));md=ImageDraw.Draw(mask);md.polygon([px(*p) for p in points],fill=255)
 # Irregular flat material edges on a 3px grid, without shaded contour bands.
 arr=np.asarray(mask)>0
 signed=ndi.distance_transform_edt(arr)-ndi.distance_transform_edt(~arr)
 coarse=Image.fromarray(rng.integers(0,256,(70,70),dtype=np.uint8)).resize((N,N),Image.Resampling.BICUBIC)
 perturb=(np.asarray(coarse).astype(float)-127.5)/127.5*18
 m=Image.fromarray(((signed+perturb)>0).astype('uint8')*255).resize((683,683),Image.Resampling.NEAREST).resize((N,N),Image.Resampling.NEAREST)
 im=Image.composite(Image.new('RGB',(N,N),c),im,m);d=ImageDraw.Draw(im)

def chip(x,y,c,size=None):
 w=int(rng.integers(3,5)) if size is None else size
 d.rectangle((int(x),int(y),int(x)+w-1,int(y)+w-1),fill=c)
def cluster(x,z,n=12,rad=20,kind='sand'):
 cx,cy=px(x,z)
 for k in range(n):
  a=rng.uniform(0,2*math.pi);r=rad*math.sqrt(rng.random());xx=cx+math.cos(a)*r;yy=cy+math.sin(a)*r
  c=rng.choice(['#DBD6BD','#B8AE96','#A8A394'] if kind=='sand' else ['#A8A394','#9A9482','#5C5445'])
  chip(xx,yy,c)
# West scour follows the actual western hull contour; angular earth, no shaded lip.
west=[(1.2,-2.9),(-.3,-1.4),(-1.2,.5),(-1.3,3),(-1.0,5),(-.5,7.5),(.3,10),(1.4,12.7),(2.9,15.3),(4.7,16.8)]
outer=[(x-2.0-.32*math.sin(i*1.6),z+.15*math.cos(i)) for i,(x,z) in enumerate(west)]
poly(west+outer[::-1],'#5C5445')
# Irregular wet sand immediately east of wreck.
east=[(4.6,-3.0),(5.5,-1.7),(5.7,.5),(5.8,3.1),(6.4,6),(7.0,8.6),(7.7,11.7),(8.2,14.1),(9.2,16.5)]
poly(east+[(x+1.25+.22*math.sin(i*1.7),z) for i,(x,z) in enumerate(east)][::-1],'#94856B')
# Buried hull footprint, no painted timbers or cargo silhouettes.
hull=[(2.8,-3.7),(4.6,-3),(5.5,-1.7),(5.7,.5),(5.8,3.1),(6.4,6),(7,8.6),(7.7,11.7),(8.2,14.1),(9.2,16.5),(8.1,17.1),(6.4,17.0),(4.7,16.8),(2.9,15.3),(1.4,12.7),(.3,10),(-.5,7.5),(-1,5),(-1.3,3),(-1.2,.5),(-.3,-1.4),(1.2,-2.9)]
poly(hull,'#6E6555')
# Small irregular patches break up disturbed ground, avoiding a uniform artificial outline.
for _ in range(210):
 x=rng.uniform(5.8,11.8);z=rng.uniform(-1,16)
 if x<6.3+.19*z or x>8.2+.19*z:continue
 cx,cy=px(x,z); w=int(rng.integers(5,18)); h=int(rng.integers(4,11))
 d.polygon([(cx,cy),(cx+w,cy),(cx+w+3,cy+h//2),(cx+w-3,cy+h),(cx-3,cy+h-3)],fill=rng.choice(['#94856B','#8B7D65','#81735E']))
# Use generated image's shell/pebble placement; remove all generated broad areas and artifacts.
gen=np.asarray(Image.open('work/generated.png').convert('RGB')).astype(float)
bright=(gen[:,:,0]>198)&(gen[:,:,1]>191)&(gen[:,:,2]>163)
labs,n=ndi.label(bright)
kept=0
for sl in ndi.find_objects(labs):
 if sl is None:continue
 yy,xx=sl;w=xx.stop-xx.start;h=yy.stop-yy.start
 if not (1<=w<=6 and 1<=h<=6):continue
 x=(xx.start+xx.stop)/2/gen.shape[1]*N;y=(yy.start+yy.stop)/2/gen.shape[0]*N
 wx=x/S-14;z=y/S-8
 if z>29 or (-3<wx<10 and -4<z<18):continue
 chip(x,y,rng.choice(['#DBD6BD','#B8AE96','#A8A394']));kept+=1
# Sand reference density: about ten shell clusters per 1024 square, plus sparse pebble groups.
for _ in range(32):
 x=rng.uniform(-13.5,33.5);z=rng.uniform(-7.5,22)
 if x<12 and x>-4 and z<18:continue
 cluster(x,z,int(rng.integers(13,29)),int(rng.integers(12,22)))
for _ in range(62):
 x=rng.uniform(-13.8,33.8);z=rng.uniform(-7.8,24)
 if -3<x<10 and -4<z<18:continue
 cx,cy=px(x,z)
 for _ in range(int(rng.integers(2,7))):chip(cx+rng.uniform(-9,9),cy+rng.uniform(-9,9),rng.choice(['#8A8C86','#A8A394','#9A9076']))
# Tiny scattered fragments, not potsherds; each speck is exactly 3 or 4 pixels.
for _ in range(430):
 x=rng.uniform(7,12);z=rng.uniform(0,10);cx,cy=px(x,z)
 chip(cx,cy,rng.choice(['#DBD6BD','#573D26','#6E6555','#94856B'],p=[.24,.24,.32,.20]))
# Pebbles at base of scour.
for _ in range(58):
 i=int(rng.integers(1,len(west)-1));x,z=west[i];cx,cy=px(x-rng.uniform(.5,1.7),z+rng.uniform(-.5,.5));chip(cx,cy,rng.choice(['#8A8C86','#A8A394','#786E5C']))
# Mast groove: center 0.6m is clean earth, two banks each 0.4m wide.
a=np.array([10.2,4.3]);b=np.array([22.1,8.2]);v=b-a;normal=np.array([-v[1],v[0]])/np.linalg.norm(v)
for sign in [-1,1]:
 bank=[tuple(a+normal*.3*sign),tuple(b+normal*.3*sign),tuple(b+normal*.7*sign),tuple(a+normal*.7*sign)]
 d.polygon([px(*p) for p in bank],fill='#94856B')
# Crab paired scrapes on a curved path, 4x2 each, spacing 7 px.
p0=np.array(px(7.9,3.2),float);p1=np.array(px(8.8,5.3),float);p2=np.array(px(9.2,7.7),float)
t=np.linspace(0,1,1200); pts=(1-t[:,None])**2*p0+2*(1-t[:,None])*t[:,None]*p1+t[:,None]**2*p2
for x,z in [(7.9,3.2),(8.8,5.3),(9.2,7.7)]:
 cx,cy=px(x,z);d.polygon([(cx-6,cy-8),(cx+6,cy-7),(cx+9,cy),(cx+4,cy+8),(cx-7,cy+6),(cx-9,cy-2)],fill='#6E6555')
acc=0
for i in range(1,len(pts)):
 acc+=np.linalg.norm(pts[i]-pts[i-1])
 if acc<7:continue
 acc=0;cx,cy=pts[i]
 for sign in [-1,1]:
  x=round(cx+sign*5);y=round(cy);d.rectangle((x,y,x+3,y+1),fill='#6E6555')
# Sparse downhill mud streaks, exactly 6-10 px across and 2-4m long.
for _ in range(30):
 x=rng.uniform(-13,33);z=rng.uniform(16.5,27);cx,cy=px(x,z);w=int(rng.integers(6,11));ln=round(rng.uniform(2,4)*S)
 # Keep the requested mud color where it belongs; sparse broken streaks blend with adjacent ground.
 local=im.getpixel((max(0,min(N-1,cx)),max(0,min(N-1,cy))))
 c=tuple(round(.50*a+.50*b) for a,b in zip(local,(127,120,104)))
 d.polygon([(cx,cy),(cx+w,cy+8),(cx+w+3,cy+ln//2),(cx+w,cy+ln),(cx,cy+ln-9),(cx-3,cy+ln//2)],fill=c)
for x,z in [(-9,18.5),(-4,21.8),(4,19.9),(14,20),(24,22),(29,25),(7,25.5)]:cluster(x,z,int(rng.integers(10,22)),20,'mud')
for _ in range(95):
 x=rng.uniform(-13.9,33.9);z=rng.uniform(30.2,39.9);cx,cy=px(x,z);chip(cx,cy,'#5C5445',3)
# sRGB PNG; opaque terrain, native 2048 square.
profile=ImageCms.ImageCmsProfile(ImageCms.createProfile('sRGB')).tobytes()
im.save('out.png',icc_profile=profile,optimize=True)
comparison=Image.new('RGB',(1024,512));comparison.paste(base.resize((512,512),Image.Resampling.LANCZOS),(0,0));comparison.paste(im.resize((512,512),Image.Resampling.LANCZOS),(512,0));comparison.save('work/512对照.png')
im.crop((850,410,1250,810)).resize((800,800),Image.Resampling.NEAREST).save('work/细节检查.png')
json.dump({'size':im.size,'mode':im.mode,'generated_chips_retained':kept,'base_reference_unmoved':True,'pixel_per_metre':S},open('work/检查.json','w'),ensure_ascii=False,indent=2)
print('Saved out.png; generated particles:',kept)

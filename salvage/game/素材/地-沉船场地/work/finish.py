"""Add native-resolution particles to the approved terrain, without resampling it."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageCms
import numpy as np
from scipy import ndimage as ndi
import hashlib, json, math
ROOT=Path(__file__).resolve().parent.parent
REF=Path('/Users/vinaygao/Projects/sunken-debt/salvage/game/素材')
N=2048; S=N/48
base=Image.open(ROOT/'work/out-before-recut.png').convert('RGB')
b=np.array(base); ref=np.array(Image.open(REF/'基准/场地-底色.png').convert('RGB'))
assert base.size==(N,N) and ref.shape==b.shape
atlas=Image.open(ROOT/'work/particles-imagegen.png').convert('RGBA')
at=np.array(atlas)
rng=np.random.default_rng(int.from_bytes(hashlib.sha256(at.tobytes()).digest()[:8],'little'))
yy,xx=np.indices((N,N)); sand=(ref[:,:,0]>=165)&(yy<1621); mud=(ref[:,:,0]<165)&(yy<1621)
# Protect all existing additions as well as explicit geometric exclusion zones.
protected=np.any(b!=ref,axis=2)
mask=Image.new('1',(N,N));md=ImageDraw.Draw(mask)
def px(x,z):return round((x+14)*S),round((z+8)*S)
hull=[(2.8,-3.7),(4.6,-3),(5.5,-1.7),(5.7,.5),(5.8,3.1),(6.4,6),(7,8.6),(7.7,11.7),(8.2,14.1),(9.2,16.5),(8.1,17.1),(6.4,17),(4.7,16.8),(2.9,15.3),(1.4,12.7),(.3,10),(-.5,7.5),(-1,5),(-1.3,3),(-1.2,.5),(-.3,-1.4),(1.2,-2.9)]
md.polygon([px(*p) for p in hull],fill=1)
md.rectangle((*px(7,0),*px(12,10)),fill=1)
a=np.array([10.2,4.3]);v=np.array([11.9,3.9]);normal=np.array([-v[1],v[0]])/np.linalg.norm(v)
md.polygon([px(*p) for p in [a+normal*.3,a+v+normal*.3,a+v-normal*.3,a-normal*.3]],fill=1)
protected|=np.array(mask)
protected=ndi.binary_dilation(protected,iterations=3)
allowed={'sand':sand&~protected,'mud':mud&~protected}
result=b.copy();layer=np.zeros((N,N,4),np.uint8);occupied=np.zeros((N,N),bool); records=[]
colors={c:tuple(bytes.fromhex(c[1:])) for c in ['#DBD6BD','#B8AE96','#8A8C86','#A8A394','#8F8A78','#5C5445','#9A9482','#7F7868']}
def stamp(x,y,w,h,c,region,kind,ring=False):
 x=int(x);y=int(y)
 if x<3 or y<3 or x+w>N-3 or y+h>N-3:return False
 if not allowed[region][y:y+h,x:x+w].all():return False
 if occupied[y-3:y+h+3,x-3:x+w+3].any():return False
 result[y:y+h,x:x+w]=colors[c];layer[y:y+h,x:x+w,:3]=colors[c];layer[y:y+h,x:x+w,3]=255
 occupied[y:y+h,x:x+w]=1
 if ring:
  result[y+1:y+4,x+1:x+4]=colors['#5C5445'];layer[y+1:y+4,x+1:x+4,:3]=colors['#5C5445']
 records.append(dict(x=x,y=y,w=w,h=h,color=c,region=region,kind=kind));return True
coords={r:np.argwhere(m) for r,m in allowed.items()}
def center(region):
 y,x=coords[region][rng.integers(len(coords[region]))];return int(x),int(y)
def scatter(region,count,kind,c,w=3,h=3,bounds=None):
 done=0
 for _ in range(count*300):
  if done==count:break
  if bounds:
   x=int(rng.integers(bounds[0],bounds[2]-w));y=int(rng.integers(bounds[1],bounds[3]-h))
  else:x,y=center(region)
  if not bounds and crop[0]<=x<crop[2] and crop[1]<=y<crop[3] and kind=='single_shell':continue
  if stamp(x,y,w,h,str(rng.choice(c)),region,kind):done+=1
 assert done==count,(kind,done,count)
crop=(*px(22,-7),*px(32,3))
# Standalone shell density is independently countable, including exactly 175 in the requested crop.
sa=allowed['sand'].sum()/S**2;ma=allowed['mud'].sum()/S**2
scatter('sand',175,'single_shell',['#DBD6BD','#B8AE96'],bounds=crop)
scatter('sand',round(sa*1.75)-175,'single_shell',['#DBD6BD','#B8AE96'])
# Small nearby pebble and dark-dot groups, with no large material patches.
for region,area,rate,kind,nrange,cs in [('sand',sa,30,'pebbles',(3,8),['#8A8C86','#A8A394']),('sand',sa,25,'dark_dots',(3,5),['#8F8A78']),('mud',ma,20,'wormholes',(6,6),['#9A9482'])]:
 for _ in range(round(area/rate)):
  cx,cy=center(region);done=0
  for attempt in range(500):
   if done>=nrange[1] or (done>=nrange[0] and rng.random()<.15):break
   x=cx+int(rng.integers(-20,21));y=cy+int(rng.integers(-20,21))
   w,h=(5,5) if kind=='wormholes' else (int(rng.integers(3,6)),int(rng.integers(3,5))) if kind=='pebbles' else (3,3)
   done+=stamp(x,y,w,h,str(rng.choice(cs)),region,kind,ring=kind=='wormholes')
scatter('mud',round(ma*.75),'pale_debris',['#A8A394'])
# Shallow furrows are stair-stepped rectangles at native resolution: no one-pixel diagonals.
for _ in range(round(ma/30)):
 for attempt in range(300):
  x,y=center('mud');ln=int(rng.integers(28,35));width=6
  steps=math.ceil(ln/3);points=[(x+i*3,y+i*3) for i in range(steps)]
  if all(px0+6<N and py0+6<N and allowed['mud'][py0:py0+6,px0:px0+6].all() and not occupied[py0-3:py0+9,px0-3:px0+9].any() for px0,py0 in points):
   for px0,py0 in points:
    result[py0:py0+6,px0:px0+6]=colors['#7F7868'];layer[py0:py0+6,px0:px0+6,:3]=colors['#7F7868'];layer[py0:py0+6,px0:px0+6,3]=255;occupied[py0:py0+6,px0:px0+6]=1
   records.append(dict(x=x,y=y,w=ln,h=6,region='mud',kind='furrow'));break
# Atlas luminance supplies organic cluster variation; only exact native 3x3 palette stamps survive cleanup.
centers=[]
for _ in range(round(sa/40)):
 for attempt in range(10000):
  cx,cy=center('sand');rad=32
  if cx<rad+3 or cy<rad+3 or cx>N-rad-3 or cy>N-rad-3:continue
  if not allowed['sand'][cy-rad:cy+rad+1,cx-rad:cx+rad+1].all():continue
  if any((cx-x)**2+(cy-y)**2<(S*2)**2 for x,y in centers):continue
  centers.append((cx,cy));break
candidates=[]
for ci,(cx,cy) in enumerate(centers):
 for dy in range(-30,31,3):
  for dx in range(-30,31,3):
   r=math.hypot(dx,dy)/32
   if r>1:continue
   x=cx+dx;y=cy+dy
   if occupied[y-3:y+6,x-3:x+6].any():continue
   ax=(ci*83+dx*7)%atlas.width;ay=(ci*131+dy*7)%atlas.height
   sample=at[ay,ax];variation=(float(sample[0])+float(sample[1])+float(sample[3]))/765
   priority=rng.random()/max(.12,.96-.72*r*r)-variation*.025
   candidates.append((priority,x,y,'#DBD6BD' if sample[0]>=sample[1] and rng.random()<.5 else '#B8AE96'))
# Shell pile tiles can touch along 3px edges, but never overlap a prior particle.
target=round(sand.sum()*.033)
current=int(np.any(result!=b,axis=2)[sand].sum())
for _,x,y,c in sorted(candidates):
 if current>=target:break
 result[y:y+3,x:x+3]=colors[c];layer[y:y+3,x:x+3,:3]=colors[c];layer[y:y+3,x:x+3,3]=255;occupied[y:y+3,x:x+3]=1
 records.append(dict(x=x,y=y,w=3,h=3,color=c,region='sand',kind='shell_pile'))
 current+=int(np.any(result[y:y+3,x:x+3]!=b[y:y+3,x:x+3],axis=2).sum())
assert .03 <= np.any(result!=b,axis=2)[sand].mean() <= .04
assert .01 <= np.any(result!=b,axis=2)[mud].mean() <= .02
profile=ImageCms.ImageCmsProfile(ImageCms.createProfile('sRGB')).tobytes()
out=Image.fromarray(result);out.save(ROOT/'out.png',icc_profile=profile,optimize=True)
Image.fromarray(layer).save(ROOT/'work/颗粒叠层.png',optimize=True)
diff=np.any(result!=b,axis=2)
assert not diff[protected].any() and not diff[yy>=1621].any()
assert np.array_equal(result[~(layer[:,:,3]>0)],b[~(layer[:,:,3]>0)])
assert {tuple(c) for c in result[diff]}<=set(colors.values())
# Previews only are reduced; out.png and its source/overlay are never resampled.
comparison=Image.new('RGB',(1536,512))
for i,img in enumerate([Image.fromarray(ref),base,out]):comparison.paste(img.resize((512,512),Image.Resampling.NEAREST),(i*512,0))
comparison.save(ROOT/'work/512对照.png')
ref_sand=Image.open(REF/'地-沙底/out.png').convert('RGB')
close=Image.new('RGB',((crop[2]-crop[0])*2,crop[3]-crop[1]));close.paste(out.crop(crop),(0,0));close.paste(ref_sand.crop((0,0,crop[2]-crop[0],crop[3]-crop[1])),(crop[2]-crop[0],0));close.save(ROOT/'work/细节检查.png')
# Count horizontal one-pixel color runs in the untouched source separately: its gradients already contain them.
def onepx(a):
 change=np.any(a[:,1:]!=a[:,:-1],axis=2)
 return int((change[:,1:]&change[:,:-1]).sum())
clean_layer=layer.copy()
for p in records:
 if p['kind']=='wormholes':clean_layer[p['y']:p['y']+5,p['x']:p['x']+5]=0
# Every horizontal run introduced by non-ring particles has native width >=3.
ch=np.any(clean_layer[:,1:]!=clean_layer[:,:-1],axis=2)
assert not (ch[:,1:]&ch[:,:-1]).any()
report={'new_layer_non_ring_one_pixel_horizontal_runs':int((ch[:,1:]&ch[:,:-1]).sum()),'source':'work/out-before-recut.png','size':[N,N],'mode':'RGB','resized':False,'imagegen_atlas':'work/particles-imagegen.png','new_palette':list(colors),'protected_pixels_changed':int(diff[protected].sum()),'deep_pixels_changed':int(diff[yy>=1621].sum()),'sand_changed_fraction':float(diff[sand].mean()),'mud_changed_fraction':float(diff[mud].mean()),'sand_area_m2':float(sa),'mud_area_m2':float(ma),'shell_pile_count':len(centers),'single_shells_in_requested_crop':sum(p['kind']=='single_shell' and crop[0]<=p['x']<crop[2] and crop[1]<=p['y']<crop[3] for p in records),'counts':{k:sum(p['kind']==k for p in records) for k in sorted(set(p['kind'] for p in records))},'original_one_pixel_horizontal_runs':onepx(b),'final_one_pixel_horizontal_runs':onepx(result),'row_check_note':'Original gradient and legacy marks already contain 1px runs and are preserved. New marks are native 3px blocks, 5px ringed holes or 6px stepped furrows; no upscale is performed.'}
(ROOT/'work/检查.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
(ROOT/'work/颗粒坐标.json').write_text(json.dumps(records,ensure_ascii=False))
print(json.dumps(report,ensure_ascii=False,indent=2))

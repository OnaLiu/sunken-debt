(()=>{var Mu=0,Ml=1,Eu=2;var Yo=1,wu=2,no=3,Qn=0,fn=1,me=2,ui=0,ji=1,Ai=2,El=3,wl=4,wa=5;var Ci=100,bu=101,Su=102,Tu=103,Ru=104,ba=200,io=201,Au=202,Cu=203,Zo=204,so=205,Pu=206,Iu=207,Du=208,Lu=209,Nu=210,Hu=211,Uu=212,ku=213,Fu=214,Xr=0,qr=1,Yr=2,Zs=3,Zr=4,$r=5,Kr=6,Jr=7,bl=0,zu=1,Ou=2,ti=0,Sl=1,Tl=2,Rl=3,Al=4,Cl=5,Pl=6,Il=7;var Dl=300,Qi=301,vs=302,Sa=303,Ta=304,$o=306,jr=1e3,ci=1001,Qr=1002,Ve=1003,Vu=1004;var Ko=1005;var hn=1006,Ra=1007;var ts=1008;var En=1009,Ll=1010,Nl=1011,oo=1012,Aa=1013,Un=1014,Vn=1015,ei=1016,Ca=1017,Pa=1018,es=1020,Hl=35902,Ul=35899,kl=1021,Fl=1022,Bn=1023,li=1026,di=1027,Ia=1028,Da=1029,ns=1030,La=1031;var Na=1033,Jo=33776,jo=33777,Qo=33778,tr=33779,Ha=35840,Ua=35841,ka=35842,Fa=35843,za=36196,Oa=37492,Va=37496,Ba=37488,Ga=37489,er=37490,Wa=37491,Xa=37808,qa=37809,Ya=37810,Za=37811,$a=37812,Ka=37813,Ja=37814,ja=37815,Qa=37816,tc=37817,ec=37818,nc=37819,ic=37820,sc=37821,oc=36492,rc=36494,ac=36495,cc=36283,lc=36284,nr=36285,hc=36286;var Po=2300,ta=2301,Gr=2302,fl=2303,pl=2400,ml=2401,gl=2402;var Bu=3200;var zl=0,Gu=1,Pi="",In="srgb",gs="srgb-linear",Io="linear",Te="srgb";var Wr=7680;var Wu=519,Xu=512,qu=513,Yu=514,uc=515,Zu=516,$u=517,dc=518,Ku=519,fc=35044,ni=35048;var Ol="300 es",Jn=2e3,Do=2001;function $d(i){for(let t=i.length-1;t>=0;--t)if(i[t]>=65535)return!0;return!1}function Kd(i){return ArrayBuffer.isView(i)&&!(i instanceof DataView)}function Lo(i){return document.createElementNS("http://www.w3.org/1999/xhtml",i)}function Ju(){let i=Lo("canvas");return i.style.display="block",i}var $h={},$s=null;function Vl(...i){let t="THREE."+i.shift();$s?$s("log",t,...i):console.log(t,...i)}function ju(i){let t=i[0];if(typeof t=="string"&&t.startsWith("TSL:")){let e=i[1];e&&e.isStackTrace?i[0]+=" "+e.getLocation():i[1]='Stack trace not available. Enable "THREE.Node.captureStackTrace" to capture stack traces.'}return i}function Wt(...i){i=ju(i);let t="THREE."+i.shift();if($s)$s("warn",t,...i);else{let e=i[0];e&&e.isStackTrace?console.warn(e.getError(t)):console.warn(t,...i)}}function Xt(...i){i=ju(i);let t="THREE."+i.shift();if($s)$s("error",t,...i);else{let e=i[0];e&&e.isStackTrace?console.error(e.getError(t)):console.error(t,...i)}}function ms(...i){let t=i.join(" ");t in $h||($h[t]=!0,Wt(...i))}function Qu(i,t,e){return new Promise(function(n,s){function o(){switch(i.clientWaitSync(t,i.SYNC_FLUSH_COMMANDS_BIT,0)){case i.WAIT_FAILED:s();break;case i.TIMEOUT_EXPIRED:setTimeout(o,e);break;default:n()}}setTimeout(o,e)})}var t0={[Xr]:qr,[Yr]:Kr,[Zr]:Jr,[Zs]:$r,[qr]:Xr,[Kr]:Yr,[Jr]:Zr,[$r]:Zs},hi=class{addEventListener(t,e){this._listeners===void 0&&(this._listeners={});let n=this._listeners;n[t]===void 0&&(n[t]=[]),n[t].indexOf(e)===-1&&n[t].push(e)}hasEventListener(t,e){let n=this._listeners;return n===void 0?!1:n[t]!==void 0&&n[t].indexOf(e)!==-1}removeEventListener(t,e){let n=this._listeners;if(n===void 0)return;let s=n[t];if(s!==void 0){let o=s.indexOf(e);o!==-1&&s.splice(o,1)}}dispatchEvent(t){let e=this._listeners;if(e===void 0)return;let n=e[t.type];if(n!==void 0){t.target=this;let s=n.slice(0);for(let o=0,r=s.length;o<r;o++)s[o].call(this,t);t.target=null}}},gn=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"],Kh=1234567,Ao=Math.PI/180,Ks=180/Math.PI;function ro(){let i=Math.random()*4294967295|0,t=Math.random()*4294967295|0,e=Math.random()*4294967295|0,n=Math.random()*4294967295|0;return(gn[i&255]+gn[i>>8&255]+gn[i>>16&255]+gn[i>>24&255]+"-"+gn[t&255]+gn[t>>8&255]+"-"+gn[t>>16&15|64]+gn[t>>24&255]+"-"+gn[e&63|128]+gn[e>>8&255]+"-"+gn[e>>16&255]+gn[e>>24&255]+gn[n&255]+gn[n>>8&255]+gn[n>>16&255]+gn[n>>24&255]).toLowerCase()}function fe(i,t,e){return Math.max(t,Math.min(e,i))}function Bl(i,t){return(i%t+t)%t}function Jd(i,t,e,n,s){return n+(i-t)*(s-n)/(e-t)}function jd(i,t,e){return i!==t?(e-i)/(t-i):0}function Co(i,t,e){return(1-e)*i+e*t}function Qd(i,t,e,n){return Co(i,t,1-Math.exp(-e*n))}function tf(i,t=1){return t-Math.abs(Bl(i,t*2)-t)}function ef(i,t,e){return i<=t?0:i>=e?1:(i=(i-t)/(e-t),i*i*(3-2*i))}function nf(i,t,e){return i<=t?0:i>=e?1:(i=(i-t)/(e-t),i*i*i*(i*(i*6-15)+10))}function sf(i,t){return i+Math.floor(Math.random()*(t-i+1))}function of(i,t){return i+Math.random()*(t-i)}function rf(i){return i*(.5-Math.random())}function af(i){i!==void 0&&(Kh=i);let t=Kh+=1831565813;return t=Math.imul(t^t>>>15,t|1),t^=t+Math.imul(t^t>>>7,t|61),((t^t>>>14)>>>0)/4294967296}function cf(i){return i*Ao}function lf(i){return i*Ks}function hf(i){return i>0&&Number.isInteger(i)&&2**Math.round(Math.log2(i))===i}function uf(i){return Math.pow(2,Math.ceil(Math.log(i)/Math.LN2))}function df(i){return Math.pow(2,Math.floor(Math.log(i)/Math.LN2))}function ff(i,t,e,n,s){let o=Math.cos,r=Math.sin,a=o(e/2),l=r(e/2),c=o((t+n)/2),h=r((t+n)/2),d=o((t-n)/2),u=r((t-n)/2),m=o((n-t)/2),g=r((n-t)/2);switch(s){case"XYX":i.set(a*h,l*d,l*u,a*c);break;case"YZY":i.set(l*u,a*h,l*d,a*c);break;case"ZXZ":i.set(l*d,l*u,a*h,a*c);break;case"XZX":i.set(a*h,l*g,l*m,a*c);break;case"YXY":i.set(l*m,a*h,l*g,a*c);break;case"ZYZ":i.set(l*g,l*m,a*h,a*c);break;default:Wt("MathUtils: .setQuaternionFromProperEuler() encountered an unknown order: "+s)}}function qs(i,t){switch(t.constructor){case Float32Array:return i;case Uint32Array:return i/4294967295;case Uint16Array:return i/65535;case Uint8Array:case Uint8ClampedArray:return i/255;case Int32Array:return Math.max(i/2147483647,-1);case Int16Array:return Math.max(i/32767,-1);case Int8Array:return Math.max(i/127,-1);default:throw new Error("THREE.MathUtils: Invalid component type.")}}function Mn(i,t){switch(t.constructor){case Float32Array:return i;case Uint32Array:return Math.round(i*4294967295);case Uint16Array:return Math.round(i*65535);case Uint8Array:case Uint8ClampedArray:return Math.round(i*255);case Int32Array:return Math.round(i*2147483647);case Int16Array:return Math.round(i*32767);case Int8Array:return Math.round(i*127);default:throw new Error("THREE.MathUtils: Invalid component type.")}}var _s={DEG2RAD:Ao,RAD2DEG:Ks,generateUUID:ro,clamp:fe,euclideanModulo:Bl,mapLinear:Jd,inverseLerp:jd,lerp:Co,damp:Qd,pingpong:tf,smoothstep:ef,smootherstep:nf,randInt:sf,randFloat:of,randFloatSpread:rf,seededRandom:af,degToRad:cf,radToDeg:lf,isPowerOfTwo:hf,ceilPowerOfTwo:uf,floorPowerOfTwo:df,setQuaternionFromProperEuler:ff,normalize:Mn,denormalize:qs},Yl=class Yl{constructor(t=0,e=0){this.x=t,this.y=e}get width(){return this.x}set width(t){this.x=t}get height(){return this.y}set height(t){this.y=t}set(t,e){return this.x=t,this.y=e,this}setScalar(t){return this.x=t,this.y=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;default:throw new Error("THREE.Vector2: index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;default:throw new Error("THREE.Vector2: index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y)}copy(t){return this.x=t.x,this.y=t.y,this}add(t){return this.x+=t.x,this.y+=t.y,this}addScalar(t){return this.x+=t,this.y+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this}subScalar(t){return this.x-=t,this.y-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this}multiply(t){return this.x*=t.x,this.y*=t.y,this}multiplyScalar(t){return this.x*=t,this.y*=t,this}divide(t){return this.x/=t.x,this.y/=t.y,this}divideScalar(t){return this.multiplyScalar(1/t)}applyMatrix3(t){let e=this.x,n=this.y,s=t.elements;return this.x=s[0]*e+s[3]*n+s[6],this.y=s[1]*e+s[4]*n+s[7],this}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this}clamp(t,e){return this.x=fe(this.x,t.x,e.x),this.y=fe(this.y,t.y,e.y),this}clampScalar(t,e){return this.x=fe(this.x,t,e),this.y=fe(this.y,t,e),this}clampLength(t,e){let n=this.length();return this.divideScalar(n||1).multiplyScalar(fe(n,t,e))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(t){return this.x*t.x+this.y*t.y}cross(t){return this.x*t.y-this.y*t.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(t){let e=Math.sqrt(this.lengthSq()*t.lengthSq());if(e===0)return Math.PI/2;let n=this.dot(t)/e;return Math.acos(fe(n,-1,1))}distanceTo(t){return Math.sqrt(this.distanceToSquared(t))}distanceToSquared(t){let e=this.x-t.x,n=this.y-t.y;return e*e+n*n}manhattanDistanceTo(t){return Math.abs(this.x-t.x)+Math.abs(this.y-t.y)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this}lerpVectors(t,e,n){return this.x=t.x+(e.x-t.x)*n,this.y=t.y+(e.y-t.y)*n,this}equals(t){return t.x===this.x&&t.y===this.y}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this}rotateAround(t,e){let n=Math.cos(e),s=Math.sin(e),o=this.x-t.x,r=this.y-t.y;return this.x=o*n-r*s+t.x,this.y=o*s+r*n+t.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}};Yl.prototype.isVector2=!0;var Zt=Yl,Ze=class{constructor(t=0,e=0,n=0,s=1){this.isQuaternion=!0,this._x=t,this._y=e,this._z=n,this._w=s}static slerpFlat(t,e,n,s,o,r,a){let l=n[s+0],c=n[s+1],h=n[s+2],d=n[s+3],u=o[r+0],m=o[r+1],g=o[r+2],y=o[r+3];if(d!==y||l!==u||c!==m||h!==g){let p=l*u+c*m+h*g+d*y;p<0&&(u=-u,m=-m,g=-g,y=-y,p=-p);let f=1-a;if(p<.9995){let v=Math.acos(p),S=Math.sin(v);f=Math.sin(f*v)/S,a=Math.sin(a*v)/S,l=l*f+u*a,c=c*f+m*a,h=h*f+g*a,d=d*f+y*a}else{l=l*f+u*a,c=c*f+m*a,h=h*f+g*a,d=d*f+y*a;let v=1/Math.sqrt(l*l+c*c+h*h+d*d);l*=v,c*=v,h*=v,d*=v}}t[e]=l,t[e+1]=c,t[e+2]=h,t[e+3]=d}static multiplyQuaternionsFlat(t,e,n,s,o,r){let a=n[s],l=n[s+1],c=n[s+2],h=n[s+3],d=o[r],u=o[r+1],m=o[r+2],g=o[r+3];return t[e]=a*g+h*d+l*m-c*u,t[e+1]=l*g+h*u+c*d-a*m,t[e+2]=c*g+h*m+a*u-l*d,t[e+3]=h*g-a*d-l*u-c*m,t}get x(){return this._x}set x(t){this._x=t,this._onChangeCallback()}get y(){return this._y}set y(t){this._y=t,this._onChangeCallback()}get z(){return this._z}set z(t){this._z=t,this._onChangeCallback()}get w(){return this._w}set w(t){this._w=t,this._onChangeCallback()}set(t,e,n,s){return this._x=t,this._y=e,this._z=n,this._w=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(t){return this._x=t.x,this._y=t.y,this._z=t.z,this._w=t.w,this._onChangeCallback(),this}setFromEuler(t,e=!0){let n=t._x,s=t._y,o=t._z,r=t._order,a=Math.cos,l=Math.sin,c=a(n/2),h=a(s/2),d=a(o/2),u=l(n/2),m=l(s/2),g=l(o/2);switch(r){case"XYZ":this._x=u*h*d+c*m*g,this._y=c*m*d-u*h*g,this._z=c*h*g+u*m*d,this._w=c*h*d-u*m*g;break;case"YXZ":this._x=u*h*d+c*m*g,this._y=c*m*d-u*h*g,this._z=c*h*g-u*m*d,this._w=c*h*d+u*m*g;break;case"ZXY":this._x=u*h*d-c*m*g,this._y=c*m*d+u*h*g,this._z=c*h*g+u*m*d,this._w=c*h*d-u*m*g;break;case"ZYX":this._x=u*h*d-c*m*g,this._y=c*m*d+u*h*g,this._z=c*h*g-u*m*d,this._w=c*h*d+u*m*g;break;case"YZX":this._x=u*h*d+c*m*g,this._y=c*m*d+u*h*g,this._z=c*h*g-u*m*d,this._w=c*h*d-u*m*g;break;case"XZY":this._x=u*h*d-c*m*g,this._y=c*m*d-u*h*g,this._z=c*h*g+u*m*d,this._w=c*h*d+u*m*g;break;default:Wt("Quaternion: .setFromEuler() encountered an unknown order: "+r)}return e===!0&&this._onChangeCallback(),this}setFromAxisAngle(t,e){let n=e/2,s=Math.sin(n);return this._x=t.x*s,this._y=t.y*s,this._z=t.z*s,this._w=Math.cos(n),this._onChangeCallback(),this}setFromRotationMatrix(t){let e=t.elements,n=e[0],s=e[4],o=e[8],r=e[1],a=e[5],l=e[9],c=e[2],h=e[6],d=e[10],u=n+a+d;if(u>0){let m=.5/Math.sqrt(u+1);this._w=.25/m,this._x=(h-l)*m,this._y=(o-c)*m,this._z=(r-s)*m}else if(n>a&&n>d){let m=2*Math.sqrt(1+n-a-d);this._w=(h-l)/m,this._x=.25*m,this._y=(s+r)/m,this._z=(o+c)/m}else if(a>d){let m=2*Math.sqrt(1+a-n-d);this._w=(o-c)/m,this._x=(s+r)/m,this._y=.25*m,this._z=(l+h)/m}else{let m=2*Math.sqrt(1+d-n-a);this._w=(r-s)/m,this._x=(o+c)/m,this._y=(l+h)/m,this._z=.25*m}return this._onChangeCallback(),this}setFromUnitVectors(t,e){let n=t.dot(e)+1;return n<1e-8?(n=0,Math.abs(t.x)>Math.abs(t.z)?(this._x=-t.y,this._y=t.x,this._z=0,this._w=n):(this._x=0,this._y=-t.z,this._z=t.y,this._w=n)):(this._x=t.y*e.z-t.z*e.y,this._y=t.z*e.x-t.x*e.z,this._z=t.x*e.y-t.y*e.x,this._w=n),this.normalize()}angleTo(t){return 2*Math.acos(Math.abs(fe(this.dot(t),-1,1)))}rotateTowards(t,e){let n=this.angleTo(t);if(n===0)return this;let s=Math.min(1,e/n);return this.slerp(t,s),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(t){return this._x*t._x+this._y*t._y+this._z*t._z+this._w*t._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let t=this.length();return t===0?(this._x=0,this._y=0,this._z=0,this._w=1):(t=1/t,this._x=this._x*t,this._y=this._y*t,this._z=this._z*t,this._w=this._w*t),this._onChangeCallback(),this}multiply(t){return this.multiplyQuaternions(this,t)}premultiply(t){return this.multiplyQuaternions(t,this)}multiplyQuaternions(t,e){let n=t._x,s=t._y,o=t._z,r=t._w,a=e._x,l=e._y,c=e._z,h=e._w;return this._x=n*h+r*a+s*c-o*l,this._y=s*h+r*l+o*a-n*c,this._z=o*h+r*c+n*l-s*a,this._w=r*h-n*a-s*l-o*c,this._onChangeCallback(),this}slerp(t,e){let n=t._x,s=t._y,o=t._z,r=t._w,a=this.dot(t);a<0&&(n=-n,s=-s,o=-o,r=-r,a=-a);let l=1-e;if(a<.9995){let c=Math.acos(a),h=Math.sin(c);l=Math.sin(l*c)/h,e=Math.sin(e*c)/h,this._x=this._x*l+n*e,this._y=this._y*l+s*e,this._z=this._z*l+o*e,this._w=this._w*l+r*e,this._onChangeCallback()}else this._x=this._x*l+n*e,this._y=this._y*l+s*e,this._z=this._z*l+o*e,this._w=this._w*l+r*e,this.normalize();return this}slerpQuaternions(t,e,n){return this.copy(t).slerp(e,n)}random(){let t=2*Math.PI*Math.random(),e=2*Math.PI*Math.random(),n=Math.random(),s=Math.sqrt(1-n),o=Math.sqrt(n);return this.set(s*Math.sin(t),s*Math.cos(t),o*Math.sin(e),o*Math.cos(e))}equals(t){return t._x===this._x&&t._y===this._y&&t._z===this._z&&t._w===this._w}fromArray(t,e=0){return this._x=t[e],this._y=t[e+1],this._z=t[e+2],this._w=t[e+3],this._onChangeCallback(),this}toArray(t=[],e=0){return t[e]=this._x,t[e+1]=this._y,t[e+2]=this._z,t[e+3]=this._w,t}fromBufferAttribute(t,e){return this._x=t.getX(e),this._y=t.getY(e),this._z=t.getZ(e),this._w=t.getW(e),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(t){return this._onChangeCallback=t,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}},Zl=class Zl{constructor(t=0,e=0,n=0){this.x=t,this.y=e,this.z=n}set(t,e,n){return n===void 0&&(n=this.z),this.x=t,this.y=e,this.z=n,this}setScalar(t){return this.x=t,this.y=t,this.z=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setZ(t){return this.z=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;case 2:this.z=e;break;default:throw new Error("THREE.Vector3: index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("THREE.Vector3: index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this}add(t){return this.x+=t.x,this.y+=t.y,this.z+=t.z,this}addScalar(t){return this.x+=t,this.y+=t,this.z+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this.z=t.z+e.z,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this.z+=t.z*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this.z-=t.z,this}subScalar(t){return this.x-=t,this.y-=t,this.z-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this.z=t.z-e.z,this}multiply(t){return this.x*=t.x,this.y*=t.y,this.z*=t.z,this}multiplyScalar(t){return this.x*=t,this.y*=t,this.z*=t,this}multiplyVectors(t,e){return this.x=t.x*e.x,this.y=t.y*e.y,this.z=t.z*e.z,this}applyEuler(t){return this.applyQuaternion(Jh.setFromEuler(t))}applyAxisAngle(t,e){return this.applyQuaternion(Jh.setFromAxisAngle(t,e))}applyMatrix3(t){let e=this.x,n=this.y,s=this.z,o=t.elements;return this.x=o[0]*e+o[3]*n+o[6]*s,this.y=o[1]*e+o[4]*n+o[7]*s,this.z=o[2]*e+o[5]*n+o[8]*s,this}applyNormalMatrix(t){return this.applyMatrix3(t).normalize()}applyMatrix4(t){let e=this.x,n=this.y,s=this.z,o=t.elements,r=1/(o[3]*e+o[7]*n+o[11]*s+o[15]);return this.x=(o[0]*e+o[4]*n+o[8]*s+o[12])*r,this.y=(o[1]*e+o[5]*n+o[9]*s+o[13])*r,this.z=(o[2]*e+o[6]*n+o[10]*s+o[14])*r,this}applyQuaternion(t){let e=this.x,n=this.y,s=this.z,o=t.x,r=t.y,a=t.z,l=t.w,c=2*(r*s-a*n),h=2*(a*e-o*s),d=2*(o*n-r*e);return this.x=e+l*c+r*d-a*h,this.y=n+l*h+a*c-o*d,this.z=s+l*d+o*h-r*c,this}project(t){return this.applyMatrix4(t.matrixWorldInverse).applyMatrix4(t.projectionMatrix)}unproject(t){return this.applyMatrix4(t.projectionMatrixInverse).applyMatrix4(t.matrixWorld)}transformDirection(t){let e=this.x,n=this.y,s=this.z,o=t.elements;return this.x=o[0]*e+o[4]*n+o[8]*s,this.y=o[1]*e+o[5]*n+o[9]*s,this.z=o[2]*e+o[6]*n+o[10]*s,this.normalize()}divide(t){return this.x/=t.x,this.y/=t.y,this.z/=t.z,this}divideScalar(t){return this.multiplyScalar(1/t)}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this.z=Math.min(this.z,t.z),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this.z=Math.max(this.z,t.z),this}clamp(t,e){return this.x=fe(this.x,t.x,e.x),this.y=fe(this.y,t.y,e.y),this.z=fe(this.z,t.z,e.z),this}clampScalar(t,e){return this.x=fe(this.x,t,e),this.y=fe(this.y,t,e),this.z=fe(this.z,t,e),this}clampLength(t,e){let n=this.length();return this.divideScalar(n||1).multiplyScalar(fe(n,t,e))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(t){return this.x*t.x+this.y*t.y+this.z*t.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this.z+=(t.z-this.z)*e,this}lerpVectors(t,e,n){return this.x=t.x+(e.x-t.x)*n,this.y=t.y+(e.y-t.y)*n,this.z=t.z+(e.z-t.z)*n,this}cross(t){return this.crossVectors(this,t)}crossVectors(t,e){let n=t.x,s=t.y,o=t.z,r=e.x,a=e.y,l=e.z;return this.x=s*l-o*a,this.y=o*r-n*l,this.z=n*a-s*r,this}projectOnVector(t){let e=t.lengthSq();if(e===0)return this.set(0,0,0);let n=t.dot(this)/e;return this.copy(t).multiplyScalar(n)}projectOnPlane(t){return Yc.copy(this).projectOnVector(t),this.sub(Yc)}reflect(t){return this.sub(Yc.copy(t).multiplyScalar(2*this.dot(t)))}angleTo(t){let e=Math.sqrt(this.lengthSq()*t.lengthSq());if(e===0)return Math.PI/2;let n=this.dot(t)/e;return Math.acos(fe(n,-1,1))}distanceTo(t){return Math.sqrt(this.distanceToSquared(t))}distanceToSquared(t){let e=this.x-t.x,n=this.y-t.y,s=this.z-t.z;return e*e+n*n+s*s}manhattanDistanceTo(t){return Math.abs(this.x-t.x)+Math.abs(this.y-t.y)+Math.abs(this.z-t.z)}setFromSpherical(t){return this.setFromSphericalCoords(t.radius,t.phi,t.theta)}setFromSphericalCoords(t,e,n){let s=Math.sin(e)*t;return this.x=s*Math.sin(n),this.y=Math.cos(e)*t,this.z=s*Math.cos(n),this}setFromCylindrical(t){return this.setFromCylindricalCoords(t.radius,t.theta,t.y)}setFromCylindricalCoords(t,e,n){return this.x=t*Math.sin(e),this.y=n,this.z=t*Math.cos(e),this}setFromMatrixPosition(t){let e=t.elements;return this.x=e[12],this.y=e[13],this.z=e[14],this}setFromMatrixScale(t){let e=this.setFromMatrixColumn(t,0).length(),n=this.setFromMatrixColumn(t,1).length(),s=this.setFromMatrixColumn(t,2).length();return this.x=e,this.y=n,this.z=s,this}setFromMatrixColumn(t,e){return this.fromArray(t.elements,e*4)}setFromMatrix3Column(t,e){return this.fromArray(t.elements,e*3)}setFromEuler(t){return this.x=t._x,this.y=t._y,this.z=t._z,this}setFromColor(t){return this.x=t.r,this.y=t.g,this.z=t.b,this}equals(t){return t.x===this.x&&t.y===this.y&&t.z===this.z}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this.z=t[e+2],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t[e+2]=this.z,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this.z=t.getZ(e),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){let t=Math.random()*Math.PI*2,e=Math.random()*2-1,n=Math.sqrt(1-e*e);return this.x=n*Math.cos(t),this.y=e,this.z=n*Math.sin(t),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}};Zl.prototype.isVector3=!0;var x=Zl,Yc=new x,Jh=new Ze,$l=class $l{constructor(t,e,n,s,o,r,a,l,c){this.elements=[1,0,0,0,1,0,0,0,1],t!==void 0&&this.set(t,e,n,s,o,r,a,l,c)}set(t,e,n,s,o,r,a,l,c){let h=this.elements;return h[0]=t,h[1]=s,h[2]=a,h[3]=e,h[4]=o,h[5]=l,h[6]=n,h[7]=r,h[8]=c,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(t){let e=this.elements,n=t.elements;return e[0]=n[0],e[1]=n[1],e[2]=n[2],e[3]=n[3],e[4]=n[4],e[5]=n[5],e[6]=n[6],e[7]=n[7],e[8]=n[8],this}extractBasis(t,e,n){return t.setFromMatrix3Column(this,0),e.setFromMatrix3Column(this,1),n.setFromMatrix3Column(this,2),this}setFromMatrix4(t){let e=t.elements;return this.set(e[0],e[4],e[8],e[1],e[5],e[9],e[2],e[6],e[10]),this}multiply(t){return this.multiplyMatrices(this,t)}premultiply(t){return this.multiplyMatrices(t,this)}multiplyMatrices(t,e){let n=t.elements,s=e.elements,o=this.elements,r=n[0],a=n[3],l=n[6],c=n[1],h=n[4],d=n[7],u=n[2],m=n[5],g=n[8],y=s[0],p=s[3],f=s[6],v=s[1],S=s[4],_=s[7],b=s[2],E=s[5],A=s[8];return o[0]=r*y+a*v+l*b,o[3]=r*p+a*S+l*E,o[6]=r*f+a*_+l*A,o[1]=c*y+h*v+d*b,o[4]=c*p+h*S+d*E,o[7]=c*f+h*_+d*A,o[2]=u*y+m*v+g*b,o[5]=u*p+m*S+g*E,o[8]=u*f+m*_+g*A,this}multiplyScalar(t){let e=this.elements;return e[0]*=t,e[3]*=t,e[6]*=t,e[1]*=t,e[4]*=t,e[7]*=t,e[2]*=t,e[5]*=t,e[8]*=t,this}determinant(){let t=this.elements,e=t[0],n=t[1],s=t[2],o=t[3],r=t[4],a=t[5],l=t[6],c=t[7],h=t[8];return e*r*h-e*a*c-n*o*h+n*a*l+s*o*c-s*r*l}invert(){let t=this.elements,e=t[0],n=t[1],s=t[2],o=t[3],r=t[4],a=t[5],l=t[6],c=t[7],h=t[8],d=h*r-a*c,u=a*l-h*o,m=c*o-r*l,g=e*d+n*u+s*m;if(g===0)return this.set(0,0,0,0,0,0,0,0,0);let y=1/g;return t[0]=d*y,t[1]=(s*c-h*n)*y,t[2]=(a*n-s*r)*y,t[3]=u*y,t[4]=(h*e-s*l)*y,t[5]=(s*o-a*e)*y,t[6]=m*y,t[7]=(n*l-c*e)*y,t[8]=(r*e-n*o)*y,this}transpose(){let t,e=this.elements;return t=e[1],e[1]=e[3],e[3]=t,t=e[2],e[2]=e[6],e[6]=t,t=e[5],e[5]=e[7],e[7]=t,this}getNormalMatrix(t){return this.setFromMatrix4(t).invert().transpose()}transposeIntoArray(t){let e=this.elements;return t[0]=e[0],t[1]=e[3],t[2]=e[6],t[3]=e[1],t[4]=e[4],t[5]=e[7],t[6]=e[2],t[7]=e[5],t[8]=e[8],this}setUvTransform(t,e,n,s,o,r,a){let l=Math.cos(o),c=Math.sin(o);return this.set(n*l,n*c,-n*(l*r+c*a)+r+t,-s*c,s*l,-s*(-c*r+l*a)+a+e,0,0,1),this}scale(t,e){return ms("Matrix3: .scale() is deprecated. Use .makeScale() instead."),this.premultiply(Zc.makeScale(t,e)),this}rotate(t){return ms("Matrix3: .rotate() is deprecated. Use .makeRotation() instead."),this.premultiply(Zc.makeRotation(-t)),this}translate(t,e){return ms("Matrix3: .translate() is deprecated. Use .makeTranslation() instead."),this.premultiply(Zc.makeTranslation(t,e)),this}makeTranslation(t,e){return t.isVector2?this.set(1,0,t.x,0,1,t.y,0,0,1):this.set(1,0,t,0,1,e,0,0,1),this}makeRotation(t){let e=Math.cos(t),n=Math.sin(t);return this.set(e,-n,0,n,e,0,0,0,1),this}makeScale(t,e){return this.set(t,0,0,0,e,0,0,0,1),this}equals(t){let e=this.elements,n=t.elements;for(let s=0;s<9;s++)if(e[s]!==n[s])return!1;return!0}fromArray(t,e=0){for(let n=0;n<9;n++)this.elements[n]=t[n+e];return this}toArray(t=[],e=0){let n=this.elements;return t[e]=n[0],t[e+1]=n[1],t[e+2]=n[2],t[e+3]=n[3],t[e+4]=n[4],t[e+5]=n[5],t[e+6]=n[6],t[e+7]=n[7],t[e+8]=n[8],t}clone(){return new this.constructor().fromArray(this.elements)}};$l.prototype.isMatrix3=!0;var Jt=$l,Zc=new Jt,jh=new Jt().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),Qh=new Jt().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);function pf(){let i={enabled:!0,workingColorSpace:gs,spaces:{},convert:function(s,o,r){return this.enabled===!1||o===r||!o||!r||(this.spaces[o].transfer===Te&&(s.r=bi(s.r),s.g=bi(s.g),s.b=bi(s.b)),this.spaces[o].primaries!==this.spaces[r].primaries&&(s.applyMatrix3(this.spaces[o].toXYZ),s.applyMatrix3(this.spaces[r].fromXYZ)),this.spaces[r].transfer===Te&&(s.r=Ys(s.r),s.g=Ys(s.g),s.b=Ys(s.b))),s},workingToColorSpace:function(s,o){return this.convert(s,this.workingColorSpace,o)},colorSpaceToWorking:function(s,o){return this.convert(s,o,this.workingColorSpace)},getPrimaries:function(s){return this.spaces[s].primaries},getTransfer:function(s){return s===Pi?Io:this.spaces[s].transfer},getToneMappingMode:function(s){return this.spaces[s].outputColorSpaceConfig.toneMappingMode||"standard"},getLuminanceCoefficients:function(s,o=this.workingColorSpace){return s.fromArray(this.spaces[o].luminanceCoefficients)},define:function(s){Object.assign(this.spaces,s)},_getMatrix:function(s,o,r){return s.copy(this.spaces[o].toXYZ).multiply(this.spaces[r].fromXYZ)},_getDrawingBufferColorSpace:function(s){return this.spaces[s].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(s=this.workingColorSpace){return this.spaces[s].workingColorSpaceConfig.unpackColorSpace},fromWorkingColorSpace:function(s,o){return ms("ColorManagement: .fromWorkingColorSpace() has been renamed to .workingToColorSpace()."),i.workingToColorSpace(s,o)},toWorkingColorSpace:function(s,o){return ms("ColorManagement: .toWorkingColorSpace() has been renamed to .colorSpaceToWorking()."),i.colorSpaceToWorking(s,o)}},t=[.64,.33,.3,.6,.15,.06],e=[.2126,.7152,.0722],n=[.3127,.329];return i.define({[gs]:{primaries:t,whitePoint:n,transfer:Io,toXYZ:jh,fromXYZ:Qh,luminanceCoefficients:e,workingColorSpaceConfig:{unpackColorSpace:In},outputColorSpaceConfig:{drawingBufferColorSpace:In}},[In]:{primaries:t,whitePoint:n,transfer:Te,toXYZ:jh,fromXYZ:Qh,luminanceCoefficients:e,outputColorSpaceConfig:{drawingBufferColorSpace:In}}}),i}var ce=pf();function bi(i){return i<.04045?i*.0773993808:Math.pow(i*.9478672986+.0521327014,2.4)}function Ys(i){return i<.0031308?i*12.92:1.055*Math.pow(i,.41666)-.055}var Ds,ea=class{static getDataURL(t,e="image/png"){if(/^data:/i.test(t.src)||typeof HTMLCanvasElement>"u")return t.src;let n;if(t instanceof HTMLCanvasElement)n=t;else{Ds===void 0&&(Ds=Lo("canvas")),Ds.width=t.width,Ds.height=t.height;let s=Ds.getContext("2d");t instanceof ImageData?s.putImageData(t,0,0):s.drawImage(t,0,0,t.width,t.height),n=Ds}return n.toDataURL(e)}static sRGBToLinear(t){if(typeof HTMLImageElement<"u"&&t instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&t instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&t instanceof ImageBitmap){let e=Lo("canvas");e.width=t.width,e.height=t.height;let n=e.getContext("2d");n.drawImage(t,0,0,t.width,t.height);let s=n.getImageData(0,0,t.width,t.height),o=s.data;for(let r=0;r<o.length;r++)o[r]=bi(o[r]/255)*255;return n.putImageData(s,0,0),e}else if(t.data){let e=t.data.slice(0);for(let n=0;n<e.length;n++)e instanceof Uint8Array||e instanceof Uint8ClampedArray?e[n]=Math.floor(bi(e[n]/255)*255):e[n]=bi(e[n]);return{data:e,width:t.width,height:t.height}}else return Wt("ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),t}},mf=0,Js=class{constructor(t=null){this.isTextureSource=!0,Object.defineProperty(this,"id",{value:mf++}),this.uuid=ro(),this.data=t,this.dataReady=!0,this.version=0}getSize(t){let e=this.data;return typeof HTMLVideoElement<"u"&&e instanceof HTMLVideoElement?t.set(e.videoWidth,e.videoHeight,0):typeof VideoFrame<"u"&&e instanceof VideoFrame?t.set(e.displayWidth,e.displayHeight,0):e!==null?t.set(e.width,e.height,e.depth||0):t.set(0,0,0),t}set needsUpdate(t){t===!0&&this.version++}toJSON(t){let e=t===void 0||typeof t=="string";if(!e&&t.images[this.uuid]!==void 0)return t.images[this.uuid];let n={uuid:this.uuid,url:""},s=this.data;if(s!==null){let o;if(Array.isArray(s)){o=[];for(let r=0,a=s.length;r<a;r++)s[r].isDataTexture?o.push($c(s[r].image)):o.push($c(s[r]))}else o=$c(s);n.url=o}return e||(t.images[this.uuid]=n),n}};function $c(i){return typeof HTMLImageElement<"u"&&i instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&i instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&i instanceof ImageBitmap?ea.getDataURL(i):i.data?{data:Array.from(i.data),width:i.width,height:i.height,type:i.data.constructor.name}:(Wt("Texture: Unable to serialize Texture."),{})}var gf=0,Kc=new x,Sn=class i extends hi{constructor(t=i.DEFAULT_IMAGE,e=i.DEFAULT_MAPPING,n=ci,s=ci,o=hn,r=ts,a=Bn,l=En,c=i.DEFAULT_ANISOTROPY,h=Pi){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:gf++}),this.uuid=ro(),this.name="",this.source=new Js(t),this.mipmaps=[],this.mapping=e,this.channel=0,this.wrapS=n,this.wrapT=s,this.magFilter=o,this.minFilter=r,this.anisotropy=c,this.format=a,this.internalFormat=null,this.type=l,this.offset=new Zt(0,0),this.repeat=new Zt(1,1),this.center=new Zt(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new Jt,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=h,this.userData={},this.updateRanges=[],this.version=0,this.onUpdate=null,this.renderTarget=null,this.isRenderTargetTexture=!1,this.isArrayTexture=!!(t&&t.depth&&t.depth>1),this.pmremVersion=0,this.normalized=!1}get width(){return this.source.getSize(Kc).x}get height(){return this.source.getSize(Kc).y}get depth(){return this.source.getSize(Kc).z}get image(){return this.source.data}set image(t){this.source.data=t}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}addUpdateRange(t,e){this.updateRanges.push({start:t,count:e})}clearUpdateRanges(){this.updateRanges.length=0}clone(){return new this.constructor().copy(this)}copy(t){return this.name=t.name,this.source=t.source,this.mipmaps=t.mipmaps.slice(0),this.mapping=t.mapping,this.channel=t.channel,this.wrapS=t.wrapS,this.wrapT=t.wrapT,this.magFilter=t.magFilter,this.minFilter=t.minFilter,this.anisotropy=t.anisotropy,this.format=t.format,this.internalFormat=t.internalFormat,this.type=t.type,this.normalized=t.normalized,this.offset.copy(t.offset),this.repeat.copy(t.repeat),this.center.copy(t.center),this.rotation=t.rotation,this.matrixAutoUpdate=t.matrixAutoUpdate,this.matrix.copy(t.matrix),this.generateMipmaps=t.generateMipmaps,this.premultiplyAlpha=t.premultiplyAlpha,this.flipY=t.flipY,this.unpackAlignment=t.unpackAlignment,this.colorSpace=t.colorSpace,this.renderTarget=t.renderTarget,this.isRenderTargetTexture=t.isRenderTargetTexture,this.isArrayTexture=t.isArrayTexture,this.userData=JSON.parse(JSON.stringify(t.userData)),this.needsUpdate=!0,this}setValues(t){for(let e in t){let n=t[e];if(n===void 0){Wt(`Texture.setValues(): parameter '${e}' has value of undefined.`);continue}let s=this[e];if(s===void 0){Wt(`Texture.setValues(): property '${e}' does not exist.`);continue}s&&n&&s.isVector2&&n.isVector2||s&&n&&s.isVector3&&n.isVector3||s&&n&&s.isMatrix3&&n.isMatrix3?s.copy(n):this[e]=n}}toJSON(t){let e=t===void 0||typeof t=="string";if(!e&&t.textures[this.uuid]!==void 0)return t.textures[this.uuid];let n={metadata:{version:4.7,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(t).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,normalized:this.normalized,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(n.userData=this.userData),e||(t.textures[this.uuid]=n),n}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(t){if(this.mapping!==Dl)return t;if(t.applyMatrix3(this.matrix),t.x<0||t.x>1)switch(this.wrapS){case jr:t.x=t.x-Math.floor(t.x);break;case ci:t.x=t.x<0?0:1;break;case Qr:Math.abs(Math.floor(t.x)%2)===1?t.x=Math.ceil(t.x)-t.x:t.x=t.x-Math.floor(t.x);break}if(t.y<0||t.y>1)switch(this.wrapT){case jr:t.y=t.y-Math.floor(t.y);break;case ci:t.y=t.y<0?0:1;break;case Qr:Math.abs(Math.floor(t.y)%2)===1?t.y=Math.ceil(t.y)-t.y:t.y=t.y-Math.floor(t.y);break}return this.flipY&&(t.y=1-t.y),t}set needsUpdate(t){t===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(t){t===!0&&this.pmremVersion++}};Sn.DEFAULT_IMAGE=null;Sn.DEFAULT_MAPPING=Dl;Sn.DEFAULT_ANISOTROPY=1;var Kl=class Kl{constructor(t=0,e=0,n=0,s=1){this.x=t,this.y=e,this.z=n,this.w=s}get width(){return this.z}set width(t){this.z=t}get height(){return this.w}set height(t){this.w=t}set(t,e,n,s){return this.x=t,this.y=e,this.z=n,this.w=s,this}setScalar(t){return this.x=t,this.y=t,this.z=t,this.w=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setZ(t){return this.z=t,this}setW(t){return this.w=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;case 2:this.z=e;break;case 3:this.w=e;break;default:throw new Error("THREE.Vector4: index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("THREE.Vector4: index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this.w=t.w!==void 0?t.w:1,this}add(t){return this.x+=t.x,this.y+=t.y,this.z+=t.z,this.w+=t.w,this}addScalar(t){return this.x+=t,this.y+=t,this.z+=t,this.w+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this.z=t.z+e.z,this.w=t.w+e.w,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this.z+=t.z*e,this.w+=t.w*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this.z-=t.z,this.w-=t.w,this}subScalar(t){return this.x-=t,this.y-=t,this.z-=t,this.w-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this.z=t.z-e.z,this.w=t.w-e.w,this}multiply(t){return this.x*=t.x,this.y*=t.y,this.z*=t.z,this.w*=t.w,this}multiplyScalar(t){return this.x*=t,this.y*=t,this.z*=t,this.w*=t,this}applyMatrix4(t){let e=this.x,n=this.y,s=this.z,o=this.w,r=t.elements;return this.x=r[0]*e+r[4]*n+r[8]*s+r[12]*o,this.y=r[1]*e+r[5]*n+r[9]*s+r[13]*o,this.z=r[2]*e+r[6]*n+r[10]*s+r[14]*o,this.w=r[3]*e+r[7]*n+r[11]*s+r[15]*o,this}divide(t){return this.x/=t.x,this.y/=t.y,this.z/=t.z,this.w/=t.w,this}divideScalar(t){return this.multiplyScalar(1/t)}setAxisAngleFromQuaternion(t){this.w=2*Math.acos(t.w);let e=Math.sqrt(1-t.w*t.w);return e<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=t.x/e,this.y=t.y/e,this.z=t.z/e),this}setAxisAngleFromRotationMatrix(t){let e,n,s,o,l=t.elements,c=l[0],h=l[4],d=l[8],u=l[1],m=l[5],g=l[9],y=l[2],p=l[6],f=l[10];if(Math.abs(h-u)<.01&&Math.abs(d-y)<.01&&Math.abs(g-p)<.01){if(Math.abs(h+u)<.1&&Math.abs(d+y)<.1&&Math.abs(g+p)<.1&&Math.abs(c+m+f-3)<.1)return this.set(1,0,0,0),this;e=Math.PI;let S=(c+1)/2,_=(m+1)/2,b=(f+1)/2,E=(h+u)/4,A=(d+y)/4,M=(g+p)/4;return S>_&&S>b?S<.01?(n=0,s=.707106781,o=.707106781):(n=Math.sqrt(S),s=E/n,o=A/n):_>b?_<.01?(n=.707106781,s=0,o=.707106781):(s=Math.sqrt(_),n=E/s,o=M/s):b<.01?(n=.707106781,s=.707106781,o=0):(o=Math.sqrt(b),n=A/o,s=M/o),this.set(n,s,o,e),this}let v=Math.sqrt((p-g)*(p-g)+(d-y)*(d-y)+(u-h)*(u-h));return Math.abs(v)<.001&&(v=1),this.x=(p-g)/v,this.y=(d-y)/v,this.z=(u-h)/v,this.w=Math.acos((c+m+f-1)/2),this}setFromMatrixPosition(t){let e=t.elements;return this.x=e[12],this.y=e[13],this.z=e[14],this.w=e[15],this}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this.z=Math.min(this.z,t.z),this.w=Math.min(this.w,t.w),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this.z=Math.max(this.z,t.z),this.w=Math.max(this.w,t.w),this}clamp(t,e){return this.x=fe(this.x,t.x,e.x),this.y=fe(this.y,t.y,e.y),this.z=fe(this.z,t.z,e.z),this.w=fe(this.w,t.w,e.w),this}clampScalar(t,e){return this.x=fe(this.x,t,e),this.y=fe(this.y,t,e),this.z=fe(this.z,t,e),this.w=fe(this.w,t,e),this}clampLength(t,e){let n=this.length();return this.divideScalar(n||1).multiplyScalar(fe(n,t,e))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(t){return this.x*t.x+this.y*t.y+this.z*t.z+this.w*t.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this.z+=(t.z-this.z)*e,this.w+=(t.w-this.w)*e,this}lerpVectors(t,e,n){return this.x=t.x+(e.x-t.x)*n,this.y=t.y+(e.y-t.y)*n,this.z=t.z+(e.z-t.z)*n,this.w=t.w+(e.w-t.w)*n,this}equals(t){return t.x===this.x&&t.y===this.y&&t.z===this.z&&t.w===this.w}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this.z=t[e+2],this.w=t[e+3],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t[e+2]=this.z,t[e+3]=this.w,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this.z=t.getZ(e),this.w=t.getW(e),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}};Kl.prototype.isVector4=!0;var _e=Kl,na=class extends hi{constructor(t=1,e=1,n={}){super(),n=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:hn,depthBuffer:!0,stencilBuffer:!1,resolveColorBuffer:!0,resolveDepthBuffer:!0,resolveStencilBuffer:!0,storeMultisampledColorBuffer:!0,storeMultisampledDepthBuffer:!0,storeMultisampledStencilBuffer:!0,depthTexture:null,samples:0,count:1,depth:1,multiview:!1,useArrayDepthTexture:!1},n),this.isRenderTarget=!0,this.width=t,this.height=e,this.depth=n.depth,this.scissor=new _e(0,0,t,e),this.scissorTest=!1,this.viewport=new _e(0,0,t,e),this.textures=[];let s={width:t,height:e,depth:n.depth},o=new Sn(s),r=n.count;for(let a=0;a<r;a++)this.textures[a]=o.clone(),this.textures[a].isRenderTargetTexture=!0,this.textures[a].renderTarget=this;this._setTextureOptions(n),this.depthBuffer=n.depthBuffer,this.stencilBuffer=n.stencilBuffer,this.resolveColorBuffer=n.resolveColorBuffer,this.resolveDepthBuffer=n.resolveDepthBuffer,this.resolveStencilBuffer=n.resolveStencilBuffer,this.storeMultisampledColorBuffer=n.storeMultisampledColorBuffer,this.storeMultisampledDepthBuffer=n.storeMultisampledDepthBuffer,this.storeMultisampledStencilBuffer=n.storeMultisampledStencilBuffer,this._depthTexture=null,this.depthTexture=n.depthTexture,this.samples=n.samples,this.multiview=n.multiview,this.useArrayDepthTexture=n.useArrayDepthTexture}_setTextureOptions(t={}){let e={minFilter:hn,generateMipmaps:!1,flipY:!1,internalFormat:null};t.mapping!==void 0&&(e.mapping=t.mapping),t.wrapS!==void 0&&(e.wrapS=t.wrapS),t.wrapT!==void 0&&(e.wrapT=t.wrapT),t.wrapR!==void 0&&(e.wrapR=t.wrapR),t.magFilter!==void 0&&(e.magFilter=t.magFilter),t.minFilter!==void 0&&(e.minFilter=t.minFilter),t.format!==void 0&&(e.format=t.format),t.type!==void 0&&(e.type=t.type),t.anisotropy!==void 0&&(e.anisotropy=t.anisotropy),t.colorSpace!==void 0&&(e.colorSpace=t.colorSpace),t.flipY!==void 0&&(e.flipY=t.flipY),t.generateMipmaps!==void 0&&(e.generateMipmaps=t.generateMipmaps),t.internalFormat!==void 0&&(e.internalFormat=t.internalFormat);for(let n=0;n<this.textures.length;n++)this.textures[n].setValues(e)}get texture(){return this.textures[0]}set texture(t){this.textures[0]=t}set depthTexture(t){this._depthTexture!==null&&this._depthTexture.renderTarget===this&&(this._depthTexture.renderTarget=null),t!==null&&t.renderTarget===null&&(t.renderTarget=this),this._depthTexture=t}get depthTexture(){return this._depthTexture}setSize(t,e,n=1){if(this.width!==t||this.height!==e||this.depth!==n){this.width=t,this.height=e,this.depth=n;for(let s=0,o=this.textures.length;s<o;s++)this.textures[s].image.width=t,this.textures[s].image.height=e,this.textures[s].image.depth=n,this.textures[s].isData3DTexture!==!0&&(this.textures[s].isArrayTexture=this.textures[s].image.depth>1);this.dispose()}this.viewport.set(0,0,t,e),this.scissor.set(0,0,t,e)}clone(){return new this.constructor().copy(this)}copy(t){this.width=t.width,this.height=t.height,this.depth=t.depth,this.scissor.copy(t.scissor),this.scissorTest=t.scissorTest,this.viewport.copy(t.viewport),this.textures.length=0;for(let e=0,n=t.textures.length;e<n;e++){this.textures[e]=t.textures[e].clone(),this.textures[e].isRenderTargetTexture=!0,this.textures[e].renderTarget=this;let s=Object.assign({},t.textures[e].image);this.textures[e].source=new Js(s)}if(this.depthBuffer=t.depthBuffer,this.stencilBuffer=t.stencilBuffer,this.resolveColorBuffer=t.resolveColorBuffer,this.resolveDepthBuffer=t.resolveDepthBuffer,this.resolveStencilBuffer=t.resolveStencilBuffer,this.storeMultisampledColorBuffer=t.storeMultisampledColorBuffer,this.storeMultisampledDepthBuffer=t.storeMultisampledDepthBuffer,this.storeMultisampledStencilBuffer=t.storeMultisampledStencilBuffer,t.depthTexture!==null)if(t.depthTexture.renderTarget===t){let e=t.depthTexture.clone();e.renderTarget=null,this.depthTexture=e}else this.depthTexture=t.depthTexture;return this.samples=t.samples,this.multiview=t.multiview,this.useArrayDepthTexture=t.useArrayDepthTexture,this}dispose(){this.dispatchEvent({type:"dispose"})}},un=class extends na{constructor(t=1,e=1,n={}){super(t,e,n),this.isWebGLRenderTarget=!0}},No=class extends Sn{constructor(t=null,e=1,n=1,s=1){super(null),this.isDataArrayTexture=!0,this.image={data:t,width:e,height:n,depth:s},this.magFilter=Ve,this.minFilter=Ve,this.wrapR=ci,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}copy(t){return super.copy(t),this.wrapR=t.wrapR,this}addLayerUpdate(t){this.layerUpdates.add(t)}clearLayerUpdates(){this.layerUpdates.clear()}};var ia=class extends Sn{constructor(t=null,e=1,n=1,s=1){super(null),this.isData3DTexture=!0,this.image={data:t,width:e,height:n,depth:s},this.magFilter=Ve,this.minFilter=Ve,this.wrapR=ci,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}copy(t){return super.copy(t),this.wrapR=t.wrapR,this}};var Ea=class Ea{constructor(t,e,n,s,o,r,a,l,c,h,d,u,m,g,y,p){this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],t!==void 0&&this.set(t,e,n,s,o,r,a,l,c,h,d,u,m,g,y,p)}set(t,e,n,s,o,r,a,l,c,h,d,u,m,g,y,p){let f=this.elements;return f[0]=t,f[4]=e,f[8]=n,f[12]=s,f[1]=o,f[5]=r,f[9]=a,f[13]=l,f[2]=c,f[6]=h,f[10]=d,f[14]=u,f[3]=m,f[7]=g,f[11]=y,f[15]=p,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new Ea().fromArray(this.elements)}copy(t){let e=this.elements,n=t.elements;return e[0]=n[0],e[1]=n[1],e[2]=n[2],e[3]=n[3],e[4]=n[4],e[5]=n[5],e[6]=n[6],e[7]=n[7],e[8]=n[8],e[9]=n[9],e[10]=n[10],e[11]=n[11],e[12]=n[12],e[13]=n[13],e[14]=n[14],e[15]=n[15],this}copyPosition(t){let e=this.elements,n=t.elements;return e[12]=n[12],e[13]=n[13],e[14]=n[14],this}setFromMatrix3(t){let e=t.elements;return this.set(e[0],e[3],e[6],0,e[1],e[4],e[7],0,e[2],e[5],e[8],0,0,0,0,1),this}extractBasis(t,e,n){return this.determinantAffine()===0?(t.set(1,0,0),e.set(0,1,0),n.set(0,0,1),this):(t.setFromMatrixColumn(this,0),e.setFromMatrixColumn(this,1),n.setFromMatrixColumn(this,2),this)}makeBasis(t,e,n){return this.set(t.x,e.x,n.x,0,t.y,e.y,n.y,0,t.z,e.z,n.z,0,0,0,0,1),this}extractRotation(t){if(t.determinantAffine()===0)return this.identity();let e=this.elements,n=t.elements,s=1/Ls.setFromMatrixColumn(t,0).length(),o=1/Ls.setFromMatrixColumn(t,1).length(),r=1/Ls.setFromMatrixColumn(t,2).length();return e[0]=n[0]*s,e[1]=n[1]*s,e[2]=n[2]*s,e[3]=0,e[4]=n[4]*o,e[5]=n[5]*o,e[6]=n[6]*o,e[7]=0,e[8]=n[8]*r,e[9]=n[9]*r,e[10]=n[10]*r,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,this}makeRotationFromEuler(t){let e=this.elements,n=t.x,s=t.y,o=t.z,r=Math.cos(n),a=Math.sin(n),l=Math.cos(s),c=Math.sin(s),h=Math.cos(o),d=Math.sin(o);if(t.order==="XYZ"){let u=r*h,m=r*d,g=a*h,y=a*d;e[0]=l*h,e[4]=-l*d,e[8]=c,e[1]=m+g*c,e[5]=u-y*c,e[9]=-a*l,e[2]=y-u*c,e[6]=g+m*c,e[10]=r*l}else if(t.order==="YXZ"){let u=l*h,m=l*d,g=c*h,y=c*d;e[0]=u+y*a,e[4]=g*a-m,e[8]=r*c,e[1]=r*d,e[5]=r*h,e[9]=-a,e[2]=m*a-g,e[6]=y+u*a,e[10]=r*l}else if(t.order==="ZXY"){let u=l*h,m=l*d,g=c*h,y=c*d;e[0]=u-y*a,e[4]=-r*d,e[8]=g+m*a,e[1]=m+g*a,e[5]=r*h,e[9]=y-u*a,e[2]=-r*c,e[6]=a,e[10]=r*l}else if(t.order==="ZYX"){let u=r*h,m=r*d,g=a*h,y=a*d;e[0]=l*h,e[4]=g*c-m,e[8]=u*c+y,e[1]=l*d,e[5]=y*c+u,e[9]=m*c-g,e[2]=-c,e[6]=a*l,e[10]=r*l}else if(t.order==="YZX"){let u=r*l,m=r*c,g=a*l,y=a*c;e[0]=l*h,e[4]=y-u*d,e[8]=g*d+m,e[1]=d,e[5]=r*h,e[9]=-a*h,e[2]=-c*h,e[6]=m*d+g,e[10]=u-y*d}else if(t.order==="XZY"){let u=r*l,m=r*c,g=a*l,y=a*c;e[0]=l*h,e[4]=-d,e[8]=c*h,e[1]=u*d+y,e[5]=r*h,e[9]=m*d-g,e[2]=g*d-m,e[6]=a*h,e[10]=y*d+u}return e[3]=0,e[7]=0,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,this}makeRotationFromQuaternion(t){return this.compose(xf,t,yf)}lookAt(t,e,n){let s=this.elements;return Cn.subVectors(t,e),Cn.lengthSq()===0&&(Cn.z=1),Cn.normalize(),Vi.crossVectors(n,Cn),Vi.lengthSq()===0&&(Math.abs(n.z)===1?Cn.x+=1e-4:Cn.z+=1e-4,Cn.normalize(),Vi.crossVectors(n,Cn)),Vi.normalize(),Mr.crossVectors(Cn,Vi),s[0]=Vi.x,s[4]=Mr.x,s[8]=Cn.x,s[1]=Vi.y,s[5]=Mr.y,s[9]=Cn.y,s[2]=Vi.z,s[6]=Mr.z,s[10]=Cn.z,this}multiply(t){return this.multiplyMatrices(this,t)}premultiply(t){return this.multiplyMatrices(t,this)}multiplyMatrices(t,e){let n=t.elements,s=e.elements,o=this.elements,r=n[0],a=n[4],l=n[8],c=n[12],h=n[1],d=n[5],u=n[9],m=n[13],g=n[2],y=n[6],p=n[10],f=n[14],v=n[3],S=n[7],_=n[11],b=n[15],E=s[0],A=s[4],M=s[8],w=s[12],T=s[1],P=s[5],N=s[9],F=s[13],D=s[2],z=s[6],L=s[10],U=s[14],O=s[3],k=s[7],W=s[11],q=s[15];return o[0]=r*E+a*T+l*D+c*O,o[4]=r*A+a*P+l*z+c*k,o[8]=r*M+a*N+l*L+c*W,o[12]=r*w+a*F+l*U+c*q,o[1]=h*E+d*T+u*D+m*O,o[5]=h*A+d*P+u*z+m*k,o[9]=h*M+d*N+u*L+m*W,o[13]=h*w+d*F+u*U+m*q,o[2]=g*E+y*T+p*D+f*O,o[6]=g*A+y*P+p*z+f*k,o[10]=g*M+y*N+p*L+f*W,o[14]=g*w+y*F+p*U+f*q,o[3]=v*E+S*T+_*D+b*O,o[7]=v*A+S*P+_*z+b*k,o[11]=v*M+S*N+_*L+b*W,o[15]=v*w+S*F+_*U+b*q,this}multiplyScalar(t){let e=this.elements;return e[0]*=t,e[4]*=t,e[8]*=t,e[12]*=t,e[1]*=t,e[5]*=t,e[9]*=t,e[13]*=t,e[2]*=t,e[6]*=t,e[10]*=t,e[14]*=t,e[3]*=t,e[7]*=t,e[11]*=t,e[15]*=t,this}determinant(){let t=this.elements,e=t[0],n=t[4],s=t[8],o=t[12],r=t[1],a=t[5],l=t[9],c=t[13],h=t[2],d=t[6],u=t[10],m=t[14],g=t[3],y=t[7],p=t[11],f=t[15],v=l*m-c*u,S=a*m-c*d,_=a*u-l*d,b=r*m-c*h,E=r*u-l*h,A=r*d-a*h;return e*(y*v-p*S+f*_)-n*(g*v-p*b+f*E)+s*(g*S-y*b+f*A)-o*(g*_-y*E+p*A)}determinantAffine(){let t=this.elements,e=t[0],n=t[4],s=t[8],o=t[1],r=t[5],a=t[9],l=t[2],c=t[6],h=t[10];return e*(r*h-a*c)-n*(o*h-a*l)+s*(o*c-r*l)}transpose(){let t=this.elements,e;return e=t[1],t[1]=t[4],t[4]=e,e=t[2],t[2]=t[8],t[8]=e,e=t[6],t[6]=t[9],t[9]=e,e=t[3],t[3]=t[12],t[12]=e,e=t[7],t[7]=t[13],t[13]=e,e=t[11],t[11]=t[14],t[14]=e,this}setPosition(t,e,n){let s=this.elements;return t.isVector3?(s[12]=t.x,s[13]=t.y,s[14]=t.z):(s[12]=t,s[13]=e,s[14]=n),this}invert(){let t=this.elements,e=t[0],n=t[1],s=t[2],o=t[3],r=t[4],a=t[5],l=t[6],c=t[7],h=t[8],d=t[9],u=t[10],m=t[11],g=t[12],y=t[13],p=t[14],f=t[15],v=e*a-n*r,S=e*l-s*r,_=e*c-o*r,b=n*l-s*a,E=n*c-o*a,A=s*c-o*l,M=h*y-d*g,w=h*p-u*g,T=h*f-m*g,P=d*p-u*y,N=d*f-m*y,F=u*f-m*p,D=v*F-S*N+_*P+b*T-E*w+A*M;if(D===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);let z=1/D;return t[0]=(a*F-l*N+c*P)*z,t[1]=(s*N-n*F-o*P)*z,t[2]=(y*A-p*E+f*b)*z,t[3]=(u*E-d*A-m*b)*z,t[4]=(l*T-r*F-c*w)*z,t[5]=(e*F-s*T+o*w)*z,t[6]=(p*_-g*A-f*S)*z,t[7]=(h*A-u*_+m*S)*z,t[8]=(r*N-a*T+c*M)*z,t[9]=(n*T-e*N-o*M)*z,t[10]=(g*E-y*_+f*v)*z,t[11]=(d*_-h*E-m*v)*z,t[12]=(a*w-r*P-l*M)*z,t[13]=(e*P-n*w+s*M)*z,t[14]=(y*S-g*b-p*v)*z,t[15]=(h*b-d*S+u*v)*z,this}scale(t){let e=this.elements,n=t.x,s=t.y,o=t.z;return e[0]*=n,e[4]*=s,e[8]*=o,e[1]*=n,e[5]*=s,e[9]*=o,e[2]*=n,e[6]*=s,e[10]*=o,e[3]*=n,e[7]*=s,e[11]*=o,this}getMaxScaleOnAxis(){let t=this.elements,e=t[0]*t[0]+t[1]*t[1]+t[2]*t[2],n=t[4]*t[4]+t[5]*t[5]+t[6]*t[6],s=t[8]*t[8]+t[9]*t[9]+t[10]*t[10];return Math.sqrt(Math.max(e,n,s))}makeTranslation(t,e,n){return t.isVector3?this.set(1,0,0,t.x,0,1,0,t.y,0,0,1,t.z,0,0,0,1):this.set(1,0,0,t,0,1,0,e,0,0,1,n,0,0,0,1),this}makeRotationX(t){let e=Math.cos(t),n=Math.sin(t);return this.set(1,0,0,0,0,e,-n,0,0,n,e,0,0,0,0,1),this}makeRotationY(t){let e=Math.cos(t),n=Math.sin(t);return this.set(e,0,n,0,0,1,0,0,-n,0,e,0,0,0,0,1),this}makeRotationZ(t){let e=Math.cos(t),n=Math.sin(t);return this.set(e,-n,0,0,n,e,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(t,e){let n=Math.cos(e),s=Math.sin(e),o=1-n,r=t.x,a=t.y,l=t.z,c=o*r,h=o*a;return this.set(c*r+n,c*a-s*l,c*l+s*a,0,c*a+s*l,h*a+n,h*l-s*r,0,c*l-s*a,h*l+s*r,o*l*l+n,0,0,0,0,1),this}makeScale(t,e,n){return this.set(t,0,0,0,0,e,0,0,0,0,n,0,0,0,0,1),this}makeShear(t,e,n,s,o,r){return this.set(1,n,o,0,t,1,r,0,e,s,1,0,0,0,0,1),this}compose(t,e,n){let s=this.elements,o=e._x,r=e._y,a=e._z,l=e._w,c=o+o,h=r+r,d=a+a,u=o*c,m=o*h,g=o*d,y=r*h,p=r*d,f=a*d,v=l*c,S=l*h,_=l*d,b=n.x,E=n.y,A=n.z;return s[0]=(1-(y+f))*b,s[1]=(m+_)*b,s[2]=(g-S)*b,s[3]=0,s[4]=(m-_)*E,s[5]=(1-(u+f))*E,s[6]=(p+v)*E,s[7]=0,s[8]=(g+S)*A,s[9]=(p-v)*A,s[10]=(1-(u+y))*A,s[11]=0,s[12]=t.x,s[13]=t.y,s[14]=t.z,s[15]=1,this}decompose(t,e,n){let s=this.elements;t.x=s[12],t.y=s[13],t.z=s[14];let o=this.determinantAffine();if(o===0)return n.set(1,1,1),e.identity(),this;let r=Ls.set(s[0],s[1],s[2]).length(),a=Ls.set(s[4],s[5],s[6]).length(),l=Ls.set(s[8],s[9],s[10]).length();o<0&&(r=-r),Yn.copy(this);let c=1/r,h=1/a,d=1/l;return Yn.elements[0]*=c,Yn.elements[1]*=c,Yn.elements[2]*=c,Yn.elements[4]*=h,Yn.elements[5]*=h,Yn.elements[6]*=h,Yn.elements[8]*=d,Yn.elements[9]*=d,Yn.elements[10]*=d,e.setFromRotationMatrix(Yn),n.x=r,n.y=a,n.z=l,this}makePerspective(t,e,n,s,o,r,a=Jn,l=!1){let c=this.elements,h=2*o/(e-t),d=2*o/(n-s),u=(e+t)/(e-t),m=(n+s)/(n-s),g,y;if(l)g=o/(r-o),y=r*o/(r-o);else if(a===Jn)g=-(r+o)/(r-o),y=-2*r*o/(r-o);else if(a===Do)g=-r/(r-o),y=-r*o/(r-o);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+a);return c[0]=h,c[4]=0,c[8]=u,c[12]=0,c[1]=0,c[5]=d,c[9]=m,c[13]=0,c[2]=0,c[6]=0,c[10]=g,c[14]=y,c[3]=0,c[7]=0,c[11]=-1,c[15]=0,this}makeOrthographic(t,e,n,s,o,r,a=Jn,l=!1){let c=this.elements,h=2/(e-t),d=2/(n-s),u=-(e+t)/(e-t),m=-(n+s)/(n-s),g,y;if(l)g=1/(r-o),y=r/(r-o);else if(a===Jn)g=-2/(r-o),y=-(r+o)/(r-o);else if(a===Do)g=-1/(r-o),y=-o/(r-o);else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+a);return c[0]=h,c[4]=0,c[8]=0,c[12]=u,c[1]=0,c[5]=d,c[9]=0,c[13]=m,c[2]=0,c[6]=0,c[10]=g,c[14]=y,c[3]=0,c[7]=0,c[11]=0,c[15]=1,this}equals(t){let e=this.elements,n=t.elements;for(let s=0;s<16;s++)if(e[s]!==n[s])return!1;return!0}fromArray(t,e=0){for(let n=0;n<16;n++)this.elements[n]=t[n+e];return this}toArray(t=[],e=0){let n=this.elements;return t[e]=n[0],t[e+1]=n[1],t[e+2]=n[2],t[e+3]=n[3],t[e+4]=n[4],t[e+5]=n[5],t[e+6]=n[6],t[e+7]=n[7],t[e+8]=n[8],t[e+9]=n[9],t[e+10]=n[10],t[e+11]=n[11],t[e+12]=n[12],t[e+13]=n[13],t[e+14]=n[14],t[e+15]=n[15],t}};Ea.prototype.isMatrix4=!0;var le=Ea,Ls=new x,Yn=new le,xf=new x(0,0,0),yf=new x(1,1,1),Vi=new x,Mr=new x,Cn=new x,tu=new le,eu=new Ze,Dn=class i{constructor(t=0,e=0,n=0,s=i.DEFAULT_ORDER){this.isEuler=!0,this._x=t,this._y=e,this._z=n,this._order=s}get x(){return this._x}set x(t){this._x=t,this._onChangeCallback()}get y(){return this._y}set y(t){this._y=t,this._onChangeCallback()}get z(){return this._z}set z(t){this._z=t,this._onChangeCallback()}get order(){return this._order}set order(t){this._order=t,this._onChangeCallback()}set(t,e,n,s=this._order){return this._x=t,this._y=e,this._z=n,this._order=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(t){return this._x=t._x,this._y=t._y,this._z=t._z,this._order=t._order,this._onChangeCallback(),this}setFromRotationMatrix(t,e=this._order,n=!0){let s=t.elements,o=s[0],r=s[4],a=s[8],l=s[1],c=s[5],h=s[9],d=s[2],u=s[6],m=s[10];switch(e){case"XYZ":this._y=Math.asin(fe(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(-h,m),this._z=Math.atan2(-r,o)):(this._x=Math.atan2(u,c),this._z=0);break;case"YXZ":this._x=Math.asin(-fe(h,-1,1)),Math.abs(h)<.9999999?(this._y=Math.atan2(a,m),this._z=Math.atan2(l,c)):(this._y=Math.atan2(-d,o),this._z=0);break;case"ZXY":this._x=Math.asin(fe(u,-1,1)),Math.abs(u)<.9999999?(this._y=Math.atan2(-d,m),this._z=Math.atan2(-r,c)):(this._y=0,this._z=Math.atan2(l,o));break;case"ZYX":this._y=Math.asin(-fe(d,-1,1)),Math.abs(d)<.9999999?(this._x=Math.atan2(u,m),this._z=Math.atan2(l,o)):(this._x=0,this._z=Math.atan2(-r,c));break;case"YZX":this._z=Math.asin(fe(l,-1,1)),Math.abs(l)<.9999999?(this._x=Math.atan2(-h,c),this._y=Math.atan2(-d,o)):(this._x=0,this._y=Math.atan2(a,m));break;case"XZY":this._z=Math.asin(-fe(r,-1,1)),Math.abs(r)<.9999999?(this._x=Math.atan2(u,c),this._y=Math.atan2(a,o)):(this._x=Math.atan2(-h,m),this._y=0);break;default:Wt("Euler: .setFromRotationMatrix() encountered an unknown order: "+e)}return this._order=e,n===!0&&this._onChangeCallback(),this}setFromQuaternion(t,e,n){return tu.makeRotationFromQuaternion(t),this.setFromRotationMatrix(tu,e,n)}setFromVector3(t,e=this._order){return this.set(t.x,t.y,t.z,e)}reorder(t){return eu.setFromEuler(this),this.setFromQuaternion(eu,t)}equals(t){return t._x===this._x&&t._y===this._y&&t._z===this._z&&t._order===this._order}fromArray(t){return this._x=t[0],this._y=t[1],this._z=t[2],t[3]!==void 0&&(this._order=t[3]),this._onChangeCallback(),this}toArray(t=[],e=0){return t[e]=this._x,t[e+1]=this._y,t[e+2]=this._z,t[e+3]=this._order,t}_onChange(t){return this._onChangeCallback=t,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}};Dn.DEFAULT_ORDER="XYZ";var js=class{constructor(){this.mask=1}set(t){this.mask=(1<<t|0)>>>0}enable(t){this.mask|=1<<t|0}enableAll(){this.mask=-1}toggle(t){this.mask^=1<<t|0}disable(t){this.mask&=~(1<<t|0)}disableAll(){this.mask=0}test(t){return(this.mask&t.mask)!==0}isEnabled(t){return(this.mask&(1<<t|0))!==0}},vf=0,nu=new x,Ns=new Ze,vi=new le,Er=new x,Eo=new x,_f=new x,Mf=new Ze,iu=new x(1,0,0),su=new x(0,1,0),ou=new x(0,0,1),ru={type:"added"},Ef={type:"removed"},Hs={type:"childadded",child:null},Jc={type:"childremoved",child:null},Ln=class i extends hi{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:vf++}),this.uuid=ro(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=i.DEFAULT_UP.clone();let t=new x,e=new Dn,n=new Ze,s=new x(1,1,1);function o(){n.setFromEuler(e,!1)}function r(){e.setFromQuaternion(n,void 0,!1)}e._onChange(o),n._onChange(r),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:t},rotation:{configurable:!0,enumerable:!0,value:e},quaternion:{configurable:!0,enumerable:!0,value:n},scale:{configurable:!0,enumerable:!0,value:s},modelViewMatrix:{value:new le},normalMatrix:{value:new Jt}}),this.matrix=new le,this.matrixWorld=new le,this.matrixAutoUpdate=i.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=i.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new js,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.customDepthMaterial=void 0,this.customDistanceMaterial=void 0,this.static=!1,this.userData={},this.pivot=null}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(t){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(t),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(t){return this.quaternion.premultiply(t),this}setRotationFromAxisAngle(t,e){this.quaternion.setFromAxisAngle(t,e)}setRotationFromEuler(t){this.quaternion.setFromEuler(t,!0)}setRotationFromMatrix(t){this.quaternion.setFromRotationMatrix(t)}setRotationFromQuaternion(t){this.quaternion.copy(t)}rotateOnAxis(t,e){return Ns.setFromAxisAngle(t,e),this.quaternion.multiply(Ns),this}rotateOnWorldAxis(t,e){return Ns.setFromAxisAngle(t,e),this.quaternion.premultiply(Ns),this}rotateX(t){return this.rotateOnAxis(iu,t)}rotateY(t){return this.rotateOnAxis(su,t)}rotateZ(t){return this.rotateOnAxis(ou,t)}translateOnAxis(t,e){return nu.copy(t).applyQuaternion(this.quaternion),this.position.add(nu.multiplyScalar(e)),this}translateX(t){return this.translateOnAxis(iu,t)}translateY(t){return this.translateOnAxis(su,t)}translateZ(t){return this.translateOnAxis(ou,t)}localToWorld(t){return this.updateWorldMatrix(!0,!1),t.applyMatrix4(this.matrixWorld)}worldToLocal(t){return this.updateWorldMatrix(!0,!1),t.applyMatrix4(vi.copy(this.matrixWorld).invert())}lookAt(t,e,n){t.isVector3?Er.copy(t):Er.set(t,e,n);let s=this.parent;this.updateWorldMatrix(!0,!1),Eo.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?vi.lookAt(Eo,Er,this.up):vi.lookAt(Er,Eo,this.up),this.quaternion.setFromRotationMatrix(vi),s&&(vi.extractRotation(s.matrixWorld),Ns.setFromRotationMatrix(vi),this.quaternion.premultiply(Ns.invert()))}add(t){if(arguments.length>1){for(let e=0;e<arguments.length;e++)this.add(arguments[e]);return this}return t===this?(Xt("Object3D.add: object can't be added as a child of itself.",t),this):(t&&t.isObject3D?(t.removeFromParent(),t.parent=this,this.children.push(t),t.dispatchEvent(ru),Hs.child=t,this.dispatchEvent(Hs),Hs.child=null):Xt("Object3D.add: object not an instance of THREE.Object3D.",t),this)}remove(t){if(arguments.length>1){for(let n=0;n<arguments.length;n++)this.remove(arguments[n]);return this}let e=this.children.indexOf(t);return e!==-1&&(t.parent=null,this.children.splice(e,1),t.dispatchEvent(Ef),Jc.child=t,this.dispatchEvent(Jc),Jc.child=null),this}removeFromParent(){let t=this.parent;return t!==null&&t.remove(this),this}clear(){return this.remove(...this.children)}attach(t){return this.updateWorldMatrix(!0,!1),vi.copy(this.matrixWorld).invert(),t.parent!==null&&(t.parent.updateWorldMatrix(!0,!1),vi.multiply(t.parent.matrixWorld)),t.applyMatrix4(vi),t.removeFromParent(),t.parent=this,this.children.push(t),t.updateWorldMatrix(!1,!0),t.dispatchEvent(ru),Hs.child=t,this.dispatchEvent(Hs),Hs.child=null,this}getObjectById(t){return this.getObjectByProperty("id",t)}getObjectByName(t){return this.getObjectByProperty("name",t)}getObjectByProperty(t,e){if(this[t]===e)return this;for(let n=0,s=this.children.length;n<s;n++){let r=this.children[n].getObjectByProperty(t,e);if(r!==void 0)return r}}getObjectsByProperty(t,e,n=[]){this[t]===e&&n.push(this);let s=this.children;for(let o=0,r=s.length;o<r;o++)s[o].getObjectsByProperty(t,e,n);return n}getWorldPosition(t){return this.updateWorldMatrix(!0,!1),t.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(t){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Eo,t,_f),t}getWorldScale(t){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Eo,Mf,t),t}getWorldDirection(t){this.updateWorldMatrix(!0,!1);let e=this.matrixWorld.elements;return t.set(e[8],e[9],e[10]).normalize()}raycast(){}intersectsFrustum(){}traverse(t){t(this);let e=this.children;for(let n=0,s=e.length;n<s;n++)e[n].traverse(t)}traverseVisible(t){if(this.visible===!1)return;t(this);let e=this.children;for(let n=0,s=e.length;n<s;n++)e[n].traverseVisible(t)}traverseAncestors(t){let e=this.parent;e!==null&&(t(e),e.traverseAncestors(t))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale);let t=this.pivot;if(t!==null){let e=t.x,n=t.y,s=t.z,o=this.matrix.elements;o[12]+=e-o[0]*e-o[4]*n-o[8]*s,o[13]+=n-o[1]*e-o[5]*n-o[9]*s,o[14]+=s-o[2]*e-o[6]*n-o[10]*s}this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(t){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||t)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,t=!0);let e=this.children;for(let n=0,s=e.length;n<s;n++)e[n].updateMatrixWorld(t)}updateWorldMatrix(t,e,n=!1){let s=this.parent;if(t===!0&&s!==null&&s.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||n)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,n=!0),e===!0){let o=this.children;for(let r=0,a=o.length;r<a;r++)o[r].updateWorldMatrix(!1,!0,n)}}toJSON(t){let e=t===void 0||typeof t=="string",n={};e&&(t={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},n.metadata={version:4.7,type:"Object",generator:"Object3D.toJSON"});let s={};s.uuid=this.uuid,s.type=this.type,s.name=this.name,s.castShadow=this.castShadow,s.receiveShadow=this.receiveShadow,s.visible=this.visible,s.frustumCulled=this.frustumCulled,s.renderOrder=this.renderOrder,s.static=this.static,s.matrixAutoUpdate=this.matrixAutoUpdate,Object.keys(this.userData).length>0&&(s.userData=this.userData),s.layers=this.layers.mask,s.matrix=this.matrix.toArray(),s.up=this.up.toArray(),this.pivot!==null&&(s.pivot=this.pivot.toArray()),this.morphTargetDictionary!==void 0&&(s.morphTargetDictionary=Object.assign({},this.morphTargetDictionary)),this.morphTargetInfluences!==void 0&&(s.morphTargetInfluences=this.morphTargetInfluences.slice()),this.isInstancedMesh&&(s.type="InstancedMesh",s.count=this.count,s.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(s.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(s.type="BatchedMesh",s.perObjectFrustumCulled=this.perObjectFrustumCulled,s.sortObjects=this.sortObjects,s.drawRanges=this._drawRanges,s.reservedRanges=this._reservedRanges,s.geometryInfo=this._geometryInfo.map(a=>({...a,boundingBox:a.boundingBox?a.boundingBox.toJSON():void 0,boundingSphere:a.boundingSphere?a.boundingSphere.toJSON():void 0})),s.instanceInfo=this._instanceInfo.map(a=>({...a})),s.availableInstanceIds=this._availableInstanceIds.slice(),s.availableGeometryIds=this._availableGeometryIds.slice(),s.nextIndexStart=this._nextIndexStart,s.nextVertexStart=this._nextVertexStart,s.geometryCount=this._geometryCount,s.maxInstanceCount=this._maxInstanceCount,s.maxVertexCount=this._maxVertexCount,s.maxIndexCount=this._maxIndexCount,s.geometryInitialized=this._geometryInitialized,s.matricesTexture=this._matricesTexture.toJSON(t),s.indirectTexture=this._indirectTexture.toJSON(t),this._colorsTexture!==null&&(s.colorsTexture=this._colorsTexture.toJSON(t)),this.boundingSphere!==null&&(s.boundingSphere=this.boundingSphere.toJSON()),this.boundingBox!==null&&(s.boundingBox=this.boundingBox.toJSON()));function o(a,l){return a[l.uuid]===void 0&&(a[l.uuid]=l.toJSON(t)),l.uuid}if(this.isScene)this.background&&(this.background.isColor?s.background=this.background.toJSON():this.background.isTexture&&(s.background=this.background.toJSON(t).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(s.environment=this.environment.toJSON(t).uuid);else if(this.isMesh||this.isLine||this.isPoints){s.geometry=o(t.geometries,this.geometry);let a=this.geometry.parameters;if(a!==void 0&&a.shapes!==void 0){let l=a.shapes;if(Array.isArray(l))for(let c=0,h=l.length;c<h;c++){let d=l[c];o(t.shapes,d)}else o(t.shapes,l)}}if(this.isSkinnedMesh&&(s.bindMode=this.bindMode,s.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(o(t.skeletons,this.skeleton),s.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){let a=[];for(let l=0,c=this.material.length;l<c;l++)a.push(o(t.materials,this.material[l]));s.material=a}else s.material=o(t.materials,this.material);if(this.children.length>0){s.children=[];for(let a=0;a<this.children.length;a++)s.children.push(this.children[a].toJSON(t).object)}if(this.animations.length>0){s.animations=[];for(let a=0;a<this.animations.length;a++){let l=this.animations[a];s.animations.push(o(t.animations,l))}}if(e){let a=r(t.geometries),l=r(t.materials),c=r(t.textures),h=r(t.images),d=r(t.shapes),u=r(t.skeletons),m=r(t.animations),g=r(t.nodes);a.length>0&&(n.geometries=a),l.length>0&&(n.materials=l),c.length>0&&(n.textures=c),h.length>0&&(n.images=h),d.length>0&&(n.shapes=d),u.length>0&&(n.skeletons=u),m.length>0&&(n.animations=m),g.length>0&&(n.nodes=g)}return n.object=s,n;function r(a){let l=[];for(let c in a){let h=a[c];delete h.metadata,l.push(h)}return l}}clone(t){return new this.constructor().copy(this,t)}copy(t,e=!0){if(this.name=t.name,this.up.copy(t.up),this.position.copy(t.position),this.rotation.order=t.rotation.order,this.quaternion.copy(t.quaternion),this.scale.copy(t.scale),this.pivot=t.pivot!==null?t.pivot.clone():null,this.matrix.copy(t.matrix),this.matrixWorld.copy(t.matrixWorld),this.matrixAutoUpdate=t.matrixAutoUpdate,this.matrixWorldAutoUpdate=t.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=t.matrixWorldNeedsUpdate,this.layers.mask=t.layers.mask,this.visible=t.visible,this.castShadow=t.castShadow,this.receiveShadow=t.receiveShadow,this.frustumCulled=t.frustumCulled,this.renderOrder=t.renderOrder,this.static=t.static,this.animations=t.animations.slice(),this.userData=JSON.parse(JSON.stringify(t.userData)),e===!0)for(let n=0;n<t.children.length;n++){let s=t.children[n];this.add(s.clone())}return this}dispose(){this.dispatchEvent({type:"dispose"})}};Ln.DEFAULT_UP=new x(0,1,0);Ln.DEFAULT_MATRIX_AUTO_UPDATE=!0;Ln.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;var yt=class extends Ln{constructor(){super(),this.isGroup=!0,this.type="Group"}},wf={type:"move"},Qs=class{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new yt,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new yt,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new x,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new x),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new yt,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new x,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new x,this._grip.eventsEnabled=!1),this._grip}dispatchEvent(t){return this._targetRay!==null&&this._targetRay.dispatchEvent(t),this._grip!==null&&this._grip.dispatchEvent(t),this._hand!==null&&this._hand.dispatchEvent(t),this}connect(t){if(t&&t.hand){let e=this._hand;if(e)for(let n of t.hand.values())this._getHandJoint(e,n)}return this.dispatchEvent({type:"connected",data:t}),this}disconnect(t){return this.dispatchEvent({type:"disconnected",data:t}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(t,e,n){let s=null,o=null,r=null,a=this._targetRay,l=this._grip,c=this._hand;if(t&&e.session.visibilityState!=="visible-blurred"){if(c&&t.hand){r=!0;for(let y of t.hand.values()){let p=e.getJointPose(y,n),f=this._getHandJoint(c,y);p!==null&&(f.matrix.fromArray(p.transform.matrix),f.matrix.decompose(f.position,f.rotation,f.scale),f.matrixWorldNeedsUpdate=!0,f.jointRadius=p.radius),f.visible=p!==null}let h=c.joints["index-finger-tip"],d=c.joints["thumb-tip"],u=h.position.distanceTo(d.position),m=.02,g=.005;c.inputState.pinching&&u>m+g?(c.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:t.handedness,target:this})):!c.inputState.pinching&&u<=m-g&&(c.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:t.handedness,target:this}))}else l!==null&&t.gripSpace&&(o=e.getPose(t.gripSpace,n),o!==null&&(l.matrix.fromArray(o.transform.matrix),l.matrix.decompose(l.position,l.rotation,l.scale),l.matrixWorldNeedsUpdate=!0,o.linearVelocity?(l.hasLinearVelocity=!0,l.linearVelocity.copy(o.linearVelocity)):l.hasLinearVelocity=!1,o.angularVelocity?(l.hasAngularVelocity=!0,l.angularVelocity.copy(o.angularVelocity)):l.hasAngularVelocity=!1,l.eventsEnabled&&l.dispatchEvent({type:"gripUpdated",data:t,target:this})));a!==null&&(s=e.getPose(t.targetRaySpace,n),s===null&&o!==null&&(s=o),s!==null&&(a.matrix.fromArray(s.transform.matrix),a.matrix.decompose(a.position,a.rotation,a.scale),a.matrixWorldNeedsUpdate=!0,s.linearVelocity?(a.hasLinearVelocity=!0,a.linearVelocity.copy(s.linearVelocity)):a.hasLinearVelocity=!1,s.angularVelocity?(a.hasAngularVelocity=!0,a.angularVelocity.copy(s.angularVelocity)):a.hasAngularVelocity=!1,this.dispatchEvent(wf)))}return a!==null&&(a.visible=s!==null),l!==null&&(l.visible=o!==null),c!==null&&(c.visible=r!==null),this}_getHandJoint(t,e){if(t.joints[e.jointName]===void 0){let n=new yt;n.matrixAutoUpdate=!1,n.visible=!1,t.joints[e.jointName]=n,t.add(n)}return t.joints[e.jointName]}},e0={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},Bi={h:0,s:0,l:0},wr={h:0,s:0,l:0};function jc(i,t,e){return e<0&&(e+=1),e>1&&(e-=1),e<1/6?i+(t-i)*6*e:e<1/2?t:e<2/3?i+(t-i)*6*(2/3-e):i}var J=class{constructor(t,e,n){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(t,e,n)}set(t,e,n){if(e===void 0&&n===void 0){let s=t;s&&s.isColor?this.copy(s):typeof s=="number"?this.setHex(s):typeof s=="string"&&this.setStyle(s)}else this.setRGB(t,e,n);return this}setScalar(t){return this.r=t,this.g=t,this.b=t,this}setHex(t,e=In){return t=Math.floor(t),this.r=(t>>16&255)/255,this.g=(t>>8&255)/255,this.b=(t&255)/255,ce.colorSpaceToWorking(this,e),this}setRGB(t,e,n,s=ce.workingColorSpace){return this.r=t,this.g=e,this.b=n,ce.colorSpaceToWorking(this,s),this}setHSL(t,e,n,s=ce.workingColorSpace){if(t=Bl(t,1),e=fe(e,0,1),n=fe(n,0,1),e===0)this.r=this.g=this.b=n;else{let o=n<=.5?n*(1+e):n+e-n*e,r=2*n-o;this.r=jc(r,o,t+1/3),this.g=jc(r,o,t),this.b=jc(r,o,t-1/3)}return ce.colorSpaceToWorking(this,s),this}setStyle(t,e=In){function n(o){o!==void 0&&parseFloat(o)<1&&Wt("Color: Alpha component of "+t+" will be ignored.")}let s;if(s=/^(\w+)\(([^\)]*)\)/.exec(t)){let o,r=s[1],a=s[2];switch(r){case"rgb":case"rgba":if(o=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return n(o[4]),this.setRGB(Math.min(255,parseInt(o[1],10))/255,Math.min(255,parseInt(o[2],10))/255,Math.min(255,parseInt(o[3],10))/255,e);if(o=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return n(o[4]),this.setRGB(Math.min(100,parseInt(o[1],10))/100,Math.min(100,parseInt(o[2],10))/100,Math.min(100,parseInt(o[3],10))/100,e);break;case"hsl":case"hsla":if(o=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return n(o[4]),this.setHSL(parseFloat(o[1])/360,parseFloat(o[2])/100,parseFloat(o[3])/100,e);break;default:Wt("Color: Unknown color model "+t)}}else if(s=/^\#([A-Fa-f\d]+)$/.exec(t)){let o=s[1],r=o.length;if(r===3)return this.setRGB(parseInt(o.charAt(0),16)/15,parseInt(o.charAt(1),16)/15,parseInt(o.charAt(2),16)/15,e);if(r===6)return this.setHex(parseInt(o,16),e);Wt("Color: Invalid hex color "+t)}else if(t&&t.length>0)return this.setColorName(t,e);return this}setColorName(t,e=In){let n=e0[t.toLowerCase()];return n!==void 0?this.setHex(n,e):Wt("Color: Unknown color "+t),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(t){return this.r=t.r,this.g=t.g,this.b=t.b,this}copySRGBToLinear(t){return this.r=bi(t.r),this.g=bi(t.g),this.b=bi(t.b),this}copyLinearToSRGB(t){return this.r=Ys(t.r),this.g=Ys(t.g),this.b=Ys(t.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(t=In){return ce.workingToColorSpace(xn.copy(this),t),Math.round(fe(xn.r*255,0,255))*65536+Math.round(fe(xn.g*255,0,255))*256+Math.round(fe(xn.b*255,0,255))}getHexString(t=In){return("000000"+this.getHex(t).toString(16)).slice(-6)}getHSL(t,e=ce.workingColorSpace){ce.workingToColorSpace(xn.copy(this),e);let n=xn.r,s=xn.g,o=xn.b,r=Math.max(n,s,o),a=Math.min(n,s,o),l,c,h=(a+r)/2;if(a===r)l=0,c=0;else{let d=r-a;switch(c=h<=.5?d/(r+a):d/(2-r-a),r){case n:l=(s-o)/d+(s<o?6:0);break;case s:l=(o-n)/d+2;break;case o:l=(n-s)/d+4;break}l/=6}return t.h=l,t.s=c,t.l=h,t}getRGB(t,e=ce.workingColorSpace){return ce.workingToColorSpace(xn.copy(this),e),t.r=xn.r,t.g=xn.g,t.b=xn.b,t}getStyle(t=In){ce.workingToColorSpace(xn.copy(this),t);let e=xn.r,n=xn.g,s=xn.b;return t!==In?`color(${t} ${e.toFixed(3)} ${n.toFixed(3)} ${s.toFixed(3)})`:`rgb(${Math.round(e*255)},${Math.round(n*255)},${Math.round(s*255)})`}offsetHSL(t,e,n){return this.getHSL(Bi),this.setHSL(Bi.h+t,Bi.s+e,Bi.l+n)}add(t){return this.r+=t.r,this.g+=t.g,this.b+=t.b,this}addColors(t,e){return this.r=t.r+e.r,this.g=t.g+e.g,this.b=t.b+e.b,this}addScalar(t){return this.r+=t,this.g+=t,this.b+=t,this}sub(t){return this.r=Math.max(0,this.r-t.r),this.g=Math.max(0,this.g-t.g),this.b=Math.max(0,this.b-t.b),this}multiply(t){return this.r*=t.r,this.g*=t.g,this.b*=t.b,this}multiplyScalar(t){return this.r*=t,this.g*=t,this.b*=t,this}lerp(t,e){return this.r+=(t.r-this.r)*e,this.g+=(t.g-this.g)*e,this.b+=(t.b-this.b)*e,this}lerpColors(t,e,n){return this.r=t.r+(e.r-t.r)*n,this.g=t.g+(e.g-t.g)*n,this.b=t.b+(e.b-t.b)*n,this}lerpHSL(t,e){this.getHSL(Bi),t.getHSL(wr);let n=Co(Bi.h,wr.h,e),s=Co(Bi.s,wr.s,e),o=Co(Bi.l,wr.l,e);return this.setHSL(n,s,o),this}setFromVector3(t){return this.r=t.x,this.g=t.y,this.b=t.z,this}applyMatrix3(t){let e=this.r,n=this.g,s=this.b,o=t.elements;return this.r=o[0]*e+o[3]*n+o[6]*s,this.g=o[1]*e+o[4]*n+o[7]*s,this.b=o[2]*e+o[5]*n+o[8]*s,this}equals(t){return t.r===this.r&&t.g===this.g&&t.b===this.b}fromArray(t,e=0){return this.r=t[e],this.g=t[e+1],this.b=t[e+2],this}toArray(t=[],e=0){return t[e]=this.r,t[e+1]=this.g,t[e+2]=this.b,t}fromBufferAttribute(t,e){return this.r=t.getX(e),this.g=t.getY(e),this.b=t.getZ(e),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}},xn=new J;J.NAMES=e0;var xs=class extends Ln{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new Dn,this.environmentIntensity=1,this.environmentRotation=new Dn,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(t,e){return super.copy(t,e),t.background!==null&&(this.background=t.background.clone()),t.environment!==null&&(this.environment=t.environment.clone()),t.fog!==null&&(this.fog=t.fog.clone()),this.backgroundBlurriness=t.backgroundBlurriness,this.backgroundIntensity=t.backgroundIntensity,this.backgroundRotation.copy(t.backgroundRotation),this.environmentIntensity=t.environmentIntensity,this.environmentRotation.copy(t.environmentRotation),t.overrideMaterial!==null&&(this.overrideMaterial=t.overrideMaterial.clone()),this.matrixAutoUpdate=t.matrixAutoUpdate,this}toJSON(t){let e=super.toJSON(t);return this.fog!==null&&(e.object.fog=this.fog.toJSON()),e.object.backgroundBlurriness=this.backgroundBlurriness,e.object.backgroundIntensity=this.backgroundIntensity,e.object.backgroundRotation=this.backgroundRotation.toArray(),e.object.environmentIntensity=this.environmentIntensity,e.object.environmentRotation=this.environmentRotation.toArray(),e}},Zn=new x,_i=new x,Qc=new x,Mi=new x,Us=new x,ks=new x,au=new x,tl=new x,el=new x,nl=new x,il=new _e,sl=new _e,ol=new _e,qi=class i{constructor(t=new x,e=new x,n=new x){this.a=t,this.b=e,this.c=n}static getNormal(t,e,n,s){s.subVectors(n,e),Zn.subVectors(t,e),s.cross(Zn);let o=s.lengthSq();return o>0?s.multiplyScalar(1/Math.sqrt(o)):s.set(0,0,0)}static getBarycoord(t,e,n,s,o){Zn.subVectors(s,e),_i.subVectors(n,e),Qc.subVectors(t,e);let r=Zn.dot(Zn),a=Zn.dot(_i),l=Zn.dot(Qc),c=_i.dot(_i),h=_i.dot(Qc),d=r*c-a*a;if(d===0)return o.set(0,0,0),null;let u=1/d,m=(c*l-a*h)*u,g=(r*h-a*l)*u;return o.set(1-m-g,g,m)}static containsPoint(t,e,n,s){return this.getBarycoord(t,e,n,s,Mi)===null?!1:Mi.x>=0&&Mi.y>=0&&Mi.x+Mi.y<=1}static getInterpolation(t,e,n,s,o,r,a,l){return this.getBarycoord(t,e,n,s,Mi)===null?(l.x=0,l.y=0,"z"in l&&(l.z=0),"w"in l&&(l.w=0),null):(l.setScalar(0),l.addScaledVector(o,Mi.x),l.addScaledVector(r,Mi.y),l.addScaledVector(a,Mi.z),l)}static getInterpolatedAttribute(t,e,n,s,o,r){return il.setScalar(0),sl.setScalar(0),ol.setScalar(0),il.fromBufferAttribute(t,e),sl.fromBufferAttribute(t,n),ol.fromBufferAttribute(t,s),r.setScalar(0),r.addScaledVector(il,o.x),r.addScaledVector(sl,o.y),r.addScaledVector(ol,o.z),r}static isFrontFacing(t,e,n,s){return Zn.subVectors(n,e),_i.subVectors(t,e),Zn.cross(_i).dot(s)<0}set(t,e,n){return this.a.copy(t),this.b.copy(e),this.c.copy(n),this}setFromPointsAndIndices(t,e,n,s){return this.a.copy(t[e]),this.b.copy(t[n]),this.c.copy(t[s]),this}setFromAttributeAndIndices(t,e,n,s){return this.a.fromBufferAttribute(t,e),this.b.fromBufferAttribute(t,n),this.c.fromBufferAttribute(t,s),this}clone(){return new this.constructor().copy(this)}copy(t){return this.a.copy(t.a),this.b.copy(t.b),this.c.copy(t.c),this}getArea(){return Zn.subVectors(this.c,this.b),_i.subVectors(this.a,this.b),Zn.cross(_i).length()*.5}getMidpoint(t){return t.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(t){return i.getNormal(this.a,this.b,this.c,t)}getPlane(t){return t.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(t,e){return i.getBarycoord(t,this.a,this.b,this.c,e)}getInterpolation(t,e,n,s,o){return i.getInterpolation(t,this.a,this.b,this.c,e,n,s,o)}containsPoint(t){return i.containsPoint(t,this.a,this.b,this.c)}isFrontFacing(t){return i.isFrontFacing(this.a,this.b,this.c,t)}intersectsBox(t){return t.intersectsTriangle(this)}closestPointToPoint(t,e){let n=this.a,s=this.b,o=this.c,r,a;Us.subVectors(s,n),ks.subVectors(o,n),tl.subVectors(t,n);let l=Us.dot(tl),c=ks.dot(tl);if(l<=0&&c<=0)return e.copy(n);el.subVectors(t,s);let h=Us.dot(el),d=ks.dot(el);if(h>=0&&d<=h)return e.copy(s);let u=l*d-h*c;if(u<=0&&l>=0&&h<=0)return r=l/(l-h),e.copy(n).addScaledVector(Us,r);nl.subVectors(t,o);let m=Us.dot(nl),g=ks.dot(nl);if(g>=0&&m<=g)return e.copy(o);let y=m*c-l*g;if(y<=0&&c>=0&&g<=0)return a=c/(c-g),e.copy(n).addScaledVector(ks,a);let p=h*g-m*d;if(p<=0&&d-h>=0&&m-g>=0)return au.subVectors(o,s),a=(d-h)/(d-h+(m-g)),e.copy(s).addScaledVector(au,a);let f=1/(p+y+u);return r=y*f,a=u*f,e.copy(n).addScaledVector(Us,r).addScaledVector(ks,a)}equals(t){return t.a.equals(this.a)&&t.b.equals(this.b)&&t.c.equals(this.c)}},Tn=class{constructor(t=new x(1/0,1/0,1/0),e=new x(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=t,this.max=e}set(t,e){return this.min.copy(t),this.max.copy(e),this}setFromArray(t){this.makeEmpty();for(let e=0,n=t.length;e<n;e+=3)this.expandByPoint($n.fromArray(t,e));return this}setFromBufferAttribute(t){this.makeEmpty();for(let e=0,n=t.count;e<n;e++)this.expandByPoint($n.fromBufferAttribute(t,e));return this}setFromPoints(t){this.makeEmpty();for(let e=0,n=t.length;e<n;e++)this.expandByPoint(t[e]);return this}setFromCenterAndSize(t,e){let n=$n.copy(e).multiplyScalar(.5);return this.min.copy(t).sub(n),this.max.copy(t).add(n),this}setFromObject(t,e=!1){return this.makeEmpty(),this.expandByObject(t,e)}clone(){return new this.constructor().copy(this)}copy(t){return this.min.copy(t.min),this.max.copy(t.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(t){return this.isEmpty()?t.set(0,0,0):t.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(t){return this.isEmpty()?t.set(0,0,0):t.subVectors(this.max,this.min)}expandByPoint(t){return this.min.min(t),this.max.max(t),this}expandByVector(t){return this.min.sub(t),this.max.add(t),this}expandByScalar(t){return this.min.addScalar(-t),this.max.addScalar(t),this}expandByObject(t,e=!1){t.updateWorldMatrix(!1,!1);let n=t.geometry;if(n!==void 0){let o=n.getAttribute("position");if(e===!0&&o!==void 0&&t.isInstancedMesh!==!0)for(let r=0,a=o.count;r<a;r++)t.isMesh===!0?t.getVertexPosition(r,$n):$n.fromBufferAttribute(o,r),$n.applyMatrix4(t.matrixWorld),this.expandByPoint($n);else t.boundingBox!==void 0?(t.boundingBox===null&&t.computeBoundingBox(),br.copy(t.boundingBox)):(n.boundingBox===null&&n.computeBoundingBox(),br.copy(n.boundingBox)),br.applyMatrix4(t.matrixWorld),this.union(br)}let s=t.children;for(let o=0,r=s.length;o<r;o++)this.expandByObject(s[o],e);return this}containsPoint(t){return t.x>=this.min.x&&t.x<=this.max.x&&t.y>=this.min.y&&t.y<=this.max.y&&t.z>=this.min.z&&t.z<=this.max.z}containsBox(t){return this.min.x<=t.min.x&&t.max.x<=this.max.x&&this.min.y<=t.min.y&&t.max.y<=this.max.y&&this.min.z<=t.min.z&&t.max.z<=this.max.z}getParameter(t,e){return e.set((t.x-this.min.x)/(this.max.x-this.min.x),(t.y-this.min.y)/(this.max.y-this.min.y),(t.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(t){return t.max.x>=this.min.x&&t.min.x<=this.max.x&&t.max.y>=this.min.y&&t.min.y<=this.max.y&&t.max.z>=this.min.z&&t.min.z<=this.max.z}intersectsSphere(t){return this.clampPoint(t.center,$n),$n.distanceToSquared(t.center)<=t.radius*t.radius}intersectsPlane(t){let e,n;return t.normal.x>0?(e=t.normal.x*this.min.x,n=t.normal.x*this.max.x):(e=t.normal.x*this.max.x,n=t.normal.x*this.min.x),t.normal.y>0?(e+=t.normal.y*this.min.y,n+=t.normal.y*this.max.y):(e+=t.normal.y*this.max.y,n+=t.normal.y*this.min.y),t.normal.z>0?(e+=t.normal.z*this.min.z,n+=t.normal.z*this.max.z):(e+=t.normal.z*this.max.z,n+=t.normal.z*this.min.z),e<=-t.constant&&n>=-t.constant}intersectsTriangle(t){if(this.isEmpty())return!1;this.getCenter(wo),Sr.subVectors(this.max,wo),Fs.subVectors(t.a,wo),zs.subVectors(t.b,wo),Os.subVectors(t.c,wo),Gi.subVectors(zs,Fs),Wi.subVectors(Os,zs),us.subVectors(Fs,Os);let e=[0,-Gi.z,Gi.y,0,-Wi.z,Wi.y,0,-us.z,us.y,Gi.z,0,-Gi.x,Wi.z,0,-Wi.x,us.z,0,-us.x,-Gi.y,Gi.x,0,-Wi.y,Wi.x,0,-us.y,us.x,0];return!rl(e,Fs,zs,Os,Sr)||(e=[1,0,0,0,1,0,0,0,1],!rl(e,Fs,zs,Os,Sr))?!1:(Tr.crossVectors(Gi,Wi),e=[Tr.x,Tr.y,Tr.z],rl(e,Fs,zs,Os,Sr))}clampPoint(t,e){return e.copy(t).clamp(this.min,this.max)}distanceToPoint(t){return this.clampPoint(t,$n).distanceTo(t)}getBoundingSphere(t){return this.isEmpty()?t.makeEmpty():(this.getCenter(t.center),t.radius=this.getSize($n).length()*.5),t}intersect(t){return this.min.max(t.min),this.max.min(t.max),this.isEmpty()&&this.makeEmpty(),this}union(t){return this.min.min(t.min),this.max.max(t.max),this}applyMatrix4(t){return this.isEmpty()?this:(Ei[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(t),Ei[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(t),Ei[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(t),Ei[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(t),Ei[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(t),Ei[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(t),Ei[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(t),Ei[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(t),this.setFromPoints(Ei),this)}translate(t){return this.min.add(t),this.max.add(t),this}equals(t){return t.min.equals(this.min)&&t.max.equals(this.max)}toJSON(){return{min:this.min.toArray(),max:this.max.toArray()}}fromJSON(t){return this.min.fromArray(t.min),this.max.fromArray(t.max),this}},Ei=[new x,new x,new x,new x,new x,new x,new x,new x],$n=new x,br=new Tn,Fs=new x,zs=new x,Os=new x,Gi=new x,Wi=new x,us=new x,wo=new x,Sr=new x,Tr=new x,ds=new x;function rl(i,t,e,n,s){for(let o=0,r=i.length-3;o<=r;o+=3){ds.fromArray(i,o);let a=s.x*Math.abs(ds.x)+s.y*Math.abs(ds.y)+s.z*Math.abs(ds.z),l=t.dot(ds),c=e.dot(ds),h=n.dot(ds);if(Math.max(-Math.max(l,c,h),Math.min(l,c,h))>a)return!1}return!0}var Qe=new x,Rr=new Zt,bf=0,ve=class extends hi{constructor(t,e,n=!1){if(super(),Array.isArray(t))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,Object.defineProperty(this,"id",{value:bf++}),this.name="",this.array=t,this.itemSize=e,this.count=t!==void 0?t.length/e:0,this.normalized=n,this.usage=fc,this.updateRanges=[],this.gpuType=Vn,this.version=0}onUploadCallback(){}set needsUpdate(t){t===!0&&this.version++}setUsage(t){return this.usage=t,this}addUpdateRange(t,e){this.updateRanges.push({start:t,count:e})}clearUpdateRanges(){this.updateRanges.length=0}copy(t){return this.name=t.name,this.array=new t.array.constructor(t.array),this.itemSize=t.itemSize,this.count=t.count,this.normalized=t.normalized,this.usage=t.usage,this.gpuType=t.gpuType,this}copyAt(t,e,n){t*=this.itemSize,n*=e.itemSize;for(let s=0,o=this.itemSize;s<o;s++)this.array[t+s]=e.array[n+s];return this}copyArray(t){return this.array.set(t),this}applyMatrix3(t){if(this.itemSize===2)for(let e=0,n=this.count;e<n;e++)Rr.fromBufferAttribute(this,e),Rr.applyMatrix3(t),this.setXY(e,Rr.x,Rr.y);else if(this.itemSize===3)for(let e=0,n=this.count;e<n;e++)Qe.fromBufferAttribute(this,e),Qe.applyMatrix3(t),this.setXYZ(e,Qe.x,Qe.y,Qe.z);return this}applyMatrix4(t){for(let e=0,n=this.count;e<n;e++)Qe.fromBufferAttribute(this,e),Qe.applyMatrix4(t),this.setXYZ(e,Qe.x,Qe.y,Qe.z);return this}applyNormalMatrix(t){for(let e=0,n=this.count;e<n;e++)Qe.fromBufferAttribute(this,e),Qe.applyNormalMatrix(t),this.setXYZ(e,Qe.x,Qe.y,Qe.z);return this}transformDirection(t){for(let e=0,n=this.count;e<n;e++)Qe.fromBufferAttribute(this,e),Qe.transformDirection(t),this.setXYZ(e,Qe.x,Qe.y,Qe.z);return this}set(t,e=0){return this.array.set(t,e),this}getComponent(t,e){let n=this.array[t*this.itemSize+e];return this.normalized&&(n=qs(n,this.array)),n}setComponent(t,e,n){return this.normalized&&(n=Mn(n,this.array)),this.array[t*this.itemSize+e]=n,this}getX(t){let e=this.array[t*this.itemSize];return this.normalized&&(e=qs(e,this.array)),e}setX(t,e){return this.normalized&&(e=Mn(e,this.array)),this.array[t*this.itemSize]=e,this}getY(t){let e=this.array[t*this.itemSize+1];return this.normalized&&(e=qs(e,this.array)),e}setY(t,e){return this.normalized&&(e=Mn(e,this.array)),this.array[t*this.itemSize+1]=e,this}getZ(t){let e=this.array[t*this.itemSize+2];return this.normalized&&(e=qs(e,this.array)),e}setZ(t,e){return this.normalized&&(e=Mn(e,this.array)),this.array[t*this.itemSize+2]=e,this}getW(t){let e=this.array[t*this.itemSize+3];return this.normalized&&(e=qs(e,this.array)),e}setW(t,e){return this.normalized&&(e=Mn(e,this.array)),this.array[t*this.itemSize+3]=e,this}setXY(t,e,n){return t*=this.itemSize,this.normalized&&(e=Mn(e,this.array),n=Mn(n,this.array)),this.array[t+0]=e,this.array[t+1]=n,this}setXYZ(t,e,n,s){return t*=this.itemSize,this.normalized&&(e=Mn(e,this.array),n=Mn(n,this.array),s=Mn(s,this.array)),this.array[t+0]=e,this.array[t+1]=n,this.array[t+2]=s,this}setXYZW(t,e,n,s,o){return t*=this.itemSize,this.normalized&&(e=Mn(e,this.array),n=Mn(n,this.array),s=Mn(s,this.array),o=Mn(o,this.array)),this.array[t+0]=e,this.array[t+1]=n,this.array[t+2]=s,this.array[t+3]=o,this}onUpload(t){return this.onUploadCallback=t,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){let t={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return t.name=this.name,t.usage=this.usage,t.gpuType=this.gpuType,t}dispose(){this.dispatchEvent({type:"dispose"})}};var Ho=class extends ve{constructor(t,e,n){super(new Uint16Array(t),e,n)}};var Uo=class extends ve{constructor(t,e,n){super(new Uint32Array(t),e,n)}};var qt=class extends ve{constructor(t,e,n){super(new Float32Array(t),e,n)}},Sf=new Tn,bo=new x,al=new x,Si=class{constructor(t=new x,e=-1){this.isSphere=!0,this.center=t,this.radius=e}set(t,e){return this.center.copy(t),this.radius=e,this}setFromPoints(t,e){let n=this.center;e!==void 0?n.copy(e):Sf.setFromPoints(t).getCenter(n);let s=0;for(let o=0,r=t.length;o<r;o++)s=Math.max(s,n.distanceToSquared(t[o]));return this.radius=Math.sqrt(s),this}copy(t){return this.center.copy(t.center),this.radius=t.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(t){return t.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(t){return t.distanceTo(this.center)-this.radius}intersectsSphere(t){let e=this.radius+t.radius;return t.center.distanceToSquared(this.center)<=e*e}intersectsBox(t){return t.intersectsSphere(this)}intersectsPlane(t){return Math.abs(t.distanceToPoint(this.center))<=this.radius}clampPoint(t,e){let n=this.center.distanceToSquared(t);return e.copy(t),n>this.radius*this.radius&&(e.sub(this.center).normalize(),e.multiplyScalar(this.radius).add(this.center)),e}getBoundingBox(t){return this.isEmpty()?(t.makeEmpty(),t):(t.set(this.center,this.center),t.expandByScalar(this.radius),t)}applyMatrix4(t){return this.center.applyMatrix4(t),this.radius=this.radius*t.getMaxScaleOnAxis(),this}translate(t){return this.center.add(t),this}expandByPoint(t){if(this.isEmpty())return this.center.copy(t),this.radius=0,this;bo.subVectors(t,this.center);let e=bo.lengthSq();if(e>this.radius*this.radius){let n=Math.sqrt(e),s=(n-this.radius)*.5;this.center.addScaledVector(bo,s/n),this.radius+=s}return this}union(t){return t.isEmpty()?this:this.isEmpty()?(this.copy(t),this):(this.center.equals(t.center)===!0?this.radius=Math.max(this.radius,t.radius):(al.subVectors(t.center,this.center).setLength(t.radius),this.expandByPoint(bo.copy(t.center).add(al)),this.expandByPoint(bo.copy(t.center).sub(al))),this)}equals(t){return t.center.equals(this.center)&&t.radius===this.radius}clone(){return new this.constructor().copy(this)}toJSON(){return{radius:this.radius,center:this.center.toArray()}}fromJSON(t){return this.radius=t.radius,this.center.fromArray(t.center),this}},Tf=0,zn=new le,cl=new Ln,Vs=new x,Pn=new Tn,So=new Tn,an=new x,oe=class i extends hi{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:Tf++}),this.uuid=ro(),this.name="",this.type="BufferGeometry",this.index=null,this.indirect=null,this.indirectOffset=0,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={},this._transformed=!1}getIndex(){return this.index}setIndex(t){return Array.isArray(t)?this.index=new($d(t)?Uo:Ho)(t,1):this.index=t,this}setIndirect(t,e=0){return this.indirect=t,this.indirectOffset=e,this}getIndirect(){return this.indirect}getAttribute(t){return this.attributes[t]}setAttribute(t,e){return this.attributes[t]=e,this}deleteAttribute(t){return delete this.attributes[t],this}hasAttribute(t){return this.attributes[t]!==void 0}addGroup(t,e,n=0){this.groups.push({start:t,count:e,materialIndex:n})}clearGroups(){this.groups=[]}setDrawRange(t,e){this.drawRange.start=t,this.drawRange.count=e}applyMatrix4(t){let e=this.attributes.position;e!==void 0&&(e.applyMatrix4(t),e.needsUpdate=!0);let n=this.attributes.normal;if(n!==void 0){let o=new Jt().getNormalMatrix(t);n.applyNormalMatrix(o),n.needsUpdate=!0}let s=this.attributes.tangent;return s!==void 0&&(s.transformDirection(t),s.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this._transformed=!0,this}applyQuaternion(t){return zn.makeRotationFromQuaternion(t),this.applyMatrix4(zn),this}rotateX(t){return zn.makeRotationX(t),this.applyMatrix4(zn),this}rotateY(t){return zn.makeRotationY(t),this.applyMatrix4(zn),this}rotateZ(t){return zn.makeRotationZ(t),this.applyMatrix4(zn),this}translate(t,e,n){return zn.makeTranslation(t,e,n),this.applyMatrix4(zn),this}scale(t,e,n){return zn.makeScale(t,e,n),this.applyMatrix4(zn),this}lookAt(t){return cl.lookAt(t),cl.updateMatrix(),this.applyMatrix4(cl.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(Vs).negate(),this.translate(Vs.x,Vs.y,Vs.z),this}setFromPoints(t){let e=this.getAttribute("position");if(e===void 0){let n=[];for(let s=0,o=t.length;s<o;s++){let r=t[s];n.push(r.x,r.y,r.z||0)}this.setAttribute("position",new qt(n,3))}else{let n=Math.min(t.length,e.count);for(let s=0;s<n;s++){let o=t[s];e.setXYZ(s,o.x,o.y,o.z||0)}t.length>e.count&&Wt("BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry."),e.needsUpdate=!0}return this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new Tn);let t=this.attributes.position,e=this.morphAttributes.position;if(t&&t.isGLBufferAttribute){Xt("BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new x(-1/0,-1/0,-1/0),new x(1/0,1/0,1/0));return}if(t!==void 0){if(this.boundingBox.setFromBufferAttribute(t),e)for(let n=0,s=e.length;n<s;n++){let o=e[n];Pn.setFromBufferAttribute(o),this.morphTargetsRelative?(an.addVectors(this.boundingBox.min,Pn.min),this.boundingBox.expandByPoint(an),an.addVectors(this.boundingBox.max,Pn.max),this.boundingBox.expandByPoint(an)):(this.boundingBox.expandByPoint(Pn.min),this.boundingBox.expandByPoint(Pn.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&Xt('BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new Si);let t=this.attributes.position,e=this.morphAttributes.position;if(t&&t.isGLBufferAttribute){Xt("BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new x,1/0);return}if(t){let n=this.boundingSphere.center;if(Pn.setFromBufferAttribute(t),e)for(let o=0,r=e.length;o<r;o++){let a=e[o];So.setFromBufferAttribute(a),this.morphTargetsRelative?(an.addVectors(Pn.min,So.min),Pn.expandByPoint(an),an.addVectors(Pn.max,So.max),Pn.expandByPoint(an)):(Pn.expandByPoint(So.min),Pn.expandByPoint(So.max))}Pn.getCenter(n);let s=0;for(let o=0,r=t.count;o<r;o++)an.fromBufferAttribute(t,o),s=Math.max(s,n.distanceToSquared(an));if(e)for(let o=0,r=e.length;o<r;o++){let a=e[o],l=this.morphTargetsRelative;for(let c=0,h=a.count;c<h;c++)an.fromBufferAttribute(a,c),l&&(Vs.fromBufferAttribute(t,c),an.add(Vs)),s=Math.max(s,n.distanceToSquared(an))}this.boundingSphere.radius=Math.sqrt(s),isNaN(this.boundingSphere.radius)&&Xt('BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){let t=this.index,e=this.attributes;if(t===null||e.position===void 0||e.normal===void 0||e.uv===void 0){Xt("BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}let n=e.position,s=e.normal,o=e.uv,r=this.getAttribute("tangent");(r===void 0||r.count!==n.count)&&(r=new ve(new Float32Array(4*n.count),4),this.setAttribute("tangent",r));let a=[],l=[];for(let M=0;M<n.count;M++)a[M]=new x,l[M]=new x;let c=new x,h=new x,d=new x,u=new Zt,m=new Zt,g=new Zt,y=new x,p=new x;function f(M,w,T){c.fromBufferAttribute(n,M),h.fromBufferAttribute(n,w),d.fromBufferAttribute(n,T),u.fromBufferAttribute(o,M),m.fromBufferAttribute(o,w),g.fromBufferAttribute(o,T),h.sub(c),d.sub(c),m.sub(u),g.sub(u);let P=1/(m.x*g.y-g.x*m.y);isFinite(P)&&(y.copy(h).multiplyScalar(g.y).addScaledVector(d,-m.y).multiplyScalar(P),p.copy(d).multiplyScalar(m.x).addScaledVector(h,-g.x).multiplyScalar(P),a[M].add(y),a[w].add(y),a[T].add(y),l[M].add(p),l[w].add(p),l[T].add(p))}let v=this.groups;v.length===0&&(v=[{start:0,count:t.count}]);for(let M=0,w=v.length;M<w;++M){let T=v[M],P=T.start,N=T.count;for(let F=P,D=P+N;F<D;F+=3)f(t.getX(F+0),t.getX(F+1),t.getX(F+2))}let S=new x,_=new x,b=new x,E=new x;function A(M){b.fromBufferAttribute(s,M),E.copy(b);let w=a[M];S.copy(w),S.sub(b.multiplyScalar(b.dot(w))).normalize(),_.crossVectors(E,w);let P=_.dot(l[M])<0?-1:1;r.setXYZW(M,S.x,S.y,S.z,P)}for(let M=0,w=v.length;M<w;++M){let T=v[M],P=T.start,N=T.count;for(let F=P,D=P+N;F<D;F+=3)A(t.getX(F+0)),A(t.getX(F+1)),A(t.getX(F+2))}this._transformed=!0}computeVertexNormals(){let t=this.index,e=this.getAttribute("position");if(e!==void 0){let n=this.getAttribute("normal");if(n===void 0||n.count!==e.count)n=new ve(new Float32Array(e.count*3),3),this.setAttribute("normal",n);else for(let u=0,m=n.count;u<m;u++)n.setXYZ(u,0,0,0);let s=new x,o=new x,r=new x,a=new x,l=new x,c=new x,h=new x,d=new x;if(t)for(let u=0,m=t.count;u<m;u+=3){let g=t.getX(u+0),y=t.getX(u+1),p=t.getX(u+2);s.fromBufferAttribute(e,g),o.fromBufferAttribute(e,y),r.fromBufferAttribute(e,p),h.subVectors(r,o),d.subVectors(s,o),h.cross(d),a.fromBufferAttribute(n,g),l.fromBufferAttribute(n,y),c.fromBufferAttribute(n,p),a.add(h),l.add(h),c.add(h),n.setXYZ(g,a.x,a.y,a.z),n.setXYZ(y,l.x,l.y,l.z),n.setXYZ(p,c.x,c.y,c.z)}else for(let u=0,m=e.count;u<m;u+=3)s.fromBufferAttribute(e,u+0),o.fromBufferAttribute(e,u+1),r.fromBufferAttribute(e,u+2),h.subVectors(r,o),d.subVectors(s,o),h.cross(d),n.setXYZ(u+0,h.x,h.y,h.z),n.setXYZ(u+1,h.x,h.y,h.z),n.setXYZ(u+2,h.x,h.y,h.z);this.normalizeNormals(),n.needsUpdate=!0}}normalizeNormals(){let t=this.attributes.normal;for(let e=0,n=t.count;e<n;e++)an.fromBufferAttribute(t,e),an.normalize(),t.setXYZ(e,an.x,an.y,an.z)}toNonIndexed(){function t(a,l){let c=a.array,h=a.itemSize,d=a.normalized,u=new c.constructor(l.length*h),m=0,g=0;for(let y=0,p=l.length;y<p;y++){a.isInterleavedBufferAttribute?m=l[y]*a.data.stride+a.offset:m=l[y]*h;for(let f=0;f<h;f++)u[g++]=c[m++]}return new ve(u,h,d)}if(this.index===null)return Wt("BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;let e=new i,n=this.index.array,s=this.attributes;for(let a in s){let l=s[a],c=t(l,n);e.setAttribute(a,c)}let o=this.morphAttributes;for(let a in o){let l=[],c=o[a];for(let h=0,d=c.length;h<d;h++){let u=c[h],m=t(u,n);l.push(m)}e.morphAttributes[a]=l}e.morphTargetsRelative=this.morphTargetsRelative;let r=this.groups;for(let a=0,l=r.length;a<l;a++){let c=r[a];e.addGroup(c.start,c.count,c.materialIndex)}return e}toJSON(){let t={metadata:{version:4.7,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(t.uuid=this.uuid,t.type=this.parameters!==void 0&&this._transformed===!0?"BufferGeometry":this.type,t.name=this.name,Object.keys(this.userData).length>0&&(t.userData=this.userData),this.parameters!==void 0&&this._transformed!==!0){let l=this.parameters;for(let c in l)l[c]!==void 0&&(t[c]=l[c]);return t}t.data={attributes:{}};let e=this.index;e!==null&&(t.data.index={type:e.array.constructor.name,array:Array.prototype.slice.call(e.array)});let n=this.attributes;for(let l in n){let c=n[l];t.data.attributes[l]=c.toJSON(t.data)}let s={},o=!1;for(let l in this.morphAttributes){let c=this.morphAttributes[l],h=[];for(let d=0,u=c.length;d<u;d++){let m=c[d];h.push(m.toJSON(t.data))}h.length>0&&(s[l]=h,o=!0)}o&&(t.data.morphAttributes=s,t.data.morphTargetsRelative=this.morphTargetsRelative);let r=this.groups;r.length>0&&(t.data.groups=JSON.parse(JSON.stringify(r)));let a=this.boundingSphere;return a!==null&&(t.data.boundingSphere=a.toJSON()),t}clone(){return new this.constructor().copy(this)}copy(t){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;let e={};this.name=t.name;let n=t.index;n!==null&&this.setIndex(n.clone());let s=t.attributes;for(let c in s){let h=s[c];this.setAttribute(c,h.clone(e))}let o=t.morphAttributes;for(let c in o){let h=[],d=o[c];for(let u=0,m=d.length;u<m;u++)h.push(d[u].clone(e));this.morphAttributes[c]=h}this.morphTargetsRelative=t.morphTargetsRelative;let r=t.groups;for(let c=0,h=r.length;c<h;c++){let d=r[c];this.addGroup(d.start,d.count,d.materialIndex)}let a=t.boundingBox;a!==null&&(this.boundingBox=a.clone());let l=t.boundingSphere;return l!==null&&(this.boundingSphere=l.clone()),this.drawRange.start=t.drawRange.start,this.drawRange.count=t.drawRange.count,this.userData=t.userData,this._transformed=t._transformed,this}dispose(){this.dispatchEvent({type:"dispose"})}};var ll=new x,Rf=new x,Af=new Jt,Kn=class{constructor(t=new x(1,0,0),e=0){this.isPlane=!0,this.normal=t,this.constant=e}set(t,e){return this.normal.copy(t),this.constant=e,this}setComponents(t,e,n,s){return this.normal.set(t,e,n),this.constant=s,this}setFromNormalAndCoplanarPoint(t,e){return this.normal.copy(t),this.constant=-e.dot(this.normal),this}setFromCoplanarPoints(t,e,n){let s=ll.subVectors(n,e).cross(Rf.subVectors(t,e)).normalize();return this.setFromNormalAndCoplanarPoint(s,t),this}copy(t){return this.normal.copy(t.normal),this.constant=t.constant,this}normalize(){let t=1/this.normal.length();return this.normal.multiplyScalar(t),this.constant*=t,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(t){return this.normal.dot(t)+this.constant}distanceToSphere(t){return this.distanceToPoint(t.center)-t.radius}projectPoint(t,e){return e.copy(t).addScaledVector(this.normal,-this.distanceToPoint(t))}intersectLine(t,e,n=!0){let s=t.delta(ll),o=this.normal.dot(s);if(o===0)return this.distanceToPoint(t.start)===0?e.copy(t.start):null;let r=-(t.start.dot(this.normal)+this.constant)/o;return n===!0&&(r<0||r>1)?null:e.copy(t.start).addScaledVector(s,r)}intersectsLine(t){let e=this.distanceToPoint(t.start),n=this.distanceToPoint(t.end);return e<0&&n>0||n<0&&e>0}intersectsBox(t){return t.intersectsPlane(this)}intersectsSphere(t){return t.intersectsPlane(this)}coplanarPoint(t){return t.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(t,e){let n=e||Af.getNormalMatrix(t),s=this.coplanarPoint(ll).applyMatrix4(t),o=this.normal.applyMatrix3(n).normalize();return this.constant=-s.dot(o),this}translate(t){return this.constant-=t.dot(this.normal),this}equals(t){return t.normal.equals(this.normal)&&t.constant===this.constant}clone(){return new this.constructor().copy(this)}toJSON(){return{normal:this.normal.toArray(),constant:this.constant}}fromJSON(t){return this.normal.fromArray(t.normal),this.constant=t.constant,this}},Cf=0,Yi=class extends hi{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:Cf++}),this.uuid=ro(),this.name="",this.type="Material",this.blending=ji,this.side=Qn,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=Zo,this.blendDst=so,this.blendEquation=Ci,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new J(0,0,0),this.blendAlpha=0,this.depthFunc=Zs,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=Wu,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=Wr,this.stencilZFail=Wr,this.stencilZPass=Wr,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.allowOverride=!0,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(t){this._alphaTest>0!=t>0&&this.version++,this._alphaTest=t}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(t){if(t!==void 0)for(let e in t){let n=t[e];if(n===void 0){Wt(`Material: parameter '${e}' has value of undefined.`);continue}let s=this[e];if(s===void 0){Wt(`Material: '${e}' is not a property of THREE.${this.type}.`);continue}s&&s.isColor?s.set(n):s&&s.isVector2&&n&&n.isVector2||s&&s.isEuler&&n&&n.isEuler||s&&s.isVector3&&n&&n.isVector3?s.copy(n):this[e]=n}}toJSON(t){let e=t===void 0||typeof t=="string";e&&(t={textures:{},images:{}});let n={metadata:{version:4.7,type:"Material",generator:"Material.toJSON"}};n.uuid=this.uuid,n.type=this.type,n.blending=this.blending,n.side=this.side,n.shadowSide=this.shadowSide,n.vertexColors=this.vertexColors,n.opacity=this.opacity,n.transparent=this.transparent,n.blendSrc=this.blendSrc,n.blendDst=this.blendDst,n.blendEquation=this.blendEquation,n.blendSrcAlpha=this.blendSrcAlpha,n.blendDstAlpha=this.blendDstAlpha,n.blendEquationAlpha=this.blendEquationAlpha,n.blendColor=this.blendColor.getHex(),n.blendAlpha=this.blendAlpha,n.depthFunc=this.depthFunc,n.depthTest=this.depthTest,n.depthWrite=this.depthWrite,n.colorWrite=this.colorWrite,n.clipIntersection=this.clipIntersection,n.clipShadows=this.clipShadows,n.stencilWriteMask=this.stencilWriteMask,n.stencilFunc=this.stencilFunc,n.stencilRef=this.stencilRef,n.stencilFuncMask=this.stencilFuncMask,n.stencilFail=this.stencilFail,n.stencilZFail=this.stencilZFail,n.stencilZPass=this.stencilZPass,n.stencilWrite=this.stencilWrite,n.polygonOffset=this.polygonOffset,n.polygonOffsetFactor=this.polygonOffsetFactor,n.polygonOffsetUnits=this.polygonOffsetUnits,n.dithering=this.dithering,n.alphaTest=this.alphaTest,n.alphaHash=this.alphaHash,n.alphaToCoverage=this.alphaToCoverage,n.premultipliedAlpha=this.premultipliedAlpha,n.forceSinglePass=this.forceSinglePass,n.allowOverride=this.allowOverride,n.visible=this.visible,n.toneMapped=this.toneMapped,n.name=this.name,this.color&&this.color.isColor&&(n.color=this.color.getHex()),this.roughness!==void 0&&(n.roughness=this.roughness),this.metalness!==void 0&&(n.metalness=this.metalness),this.sheen!==void 0&&(n.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(n.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(n.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(n.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&(n.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(n.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(n.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(n.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(n.shininess=this.shininess),this.clearcoat!==void 0&&(n.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(n.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(n.clearcoatMap=this.clearcoatMap.toJSON(t).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(n.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(t).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(n.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(t).uuid,n.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.sheenColorMap&&this.sheenColorMap.isTexture&&(n.sheenColorMap=this.sheenColorMap.toJSON(t).uuid),this.sheenRoughnessMap&&this.sheenRoughnessMap.isTexture&&(n.sheenRoughnessMap=this.sheenRoughnessMap.toJSON(t).uuid),this.dispersion!==void 0&&(n.dispersion=this.dispersion),this.retroreflectivity!==void 0&&(n.retroreflectivity=this.retroreflectivity),this.iridescence!==void 0&&(n.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(n.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(n.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(n.iridescenceMap=this.iridescenceMap.toJSON(t).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(n.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(t).uuid),this.anisotropy!==void 0&&(n.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(n.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(n.anisotropyMap=this.anisotropyMap.toJSON(t).uuid),this.map&&this.map.isTexture&&(n.map=this.map.toJSON(t).uuid),this.matcap&&this.matcap.isTexture&&(n.matcap=this.matcap.toJSON(t).uuid),this.alphaMap&&this.alphaMap.isTexture&&(n.alphaMap=this.alphaMap.toJSON(t).uuid),this.lightMap&&this.lightMap.isTexture&&(n.lightMap=this.lightMap.toJSON(t).uuid,n.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(n.aoMap=this.aoMap.toJSON(t).uuid,n.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(n.bumpMap=this.bumpMap.toJSON(t).uuid,n.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(n.normalMap=this.normalMap.toJSON(t).uuid,n.normalMapType=this.normalMapType,n.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(n.displacementMap=this.displacementMap.toJSON(t).uuid,n.displacementScale=this.displacementScale,n.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(n.roughnessMap=this.roughnessMap.toJSON(t).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(n.metalnessMap=this.metalnessMap.toJSON(t).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(n.emissiveMap=this.emissiveMap.toJSON(t).uuid),this.specularMap&&this.specularMap.isTexture&&(n.specularMap=this.specularMap.toJSON(t).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(n.specularIntensityMap=this.specularIntensityMap.toJSON(t).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(n.specularColorMap=this.specularColorMap.toJSON(t).uuid),this.envMap&&this.envMap.isTexture&&(n.envMap=this.envMap.toJSON(t).uuid,this.combine!==void 0&&(n.combine=this.combine)),this.envMapRotation!==void 0&&(n.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(n.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(n.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(n.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(n.gradientMap=this.gradientMap.toJSON(t).uuid),this.transmission!==void 0&&(n.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(n.transmissionMap=this.transmissionMap.toJSON(t).uuid),this.thickness!==void 0&&(n.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(n.thicknessMap=this.thicknessMap.toJSON(t).uuid),this.attenuationDistance!==void 0&&(n.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(n.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(n.size=this.size),this.sizeAttenuation!==void 0&&(n.sizeAttenuation=this.sizeAttenuation),Array.isArray(this.clippingPlanes)&&this.clippingPlanes.length>0&&(n.clippingPlanes=this.clippingPlanes.map(o=>o.toJSON())),this.rotation!==void 0&&(n.rotation=this.rotation),this.depthPacking!==void 0&&(n.depthPacking=this.depthPacking),this.linewidth!==void 0&&(n.linewidth=this.linewidth),this.linecap!==void 0&&(n.linecap=this.linecap),this.linejoin!==void 0&&(n.linejoin=this.linejoin),this.dashSize!==void 0&&(n.dashSize=this.dashSize),this.gapSize!==void 0&&(n.gapSize=this.gapSize),this.scale!==void 0&&(n.scale=this.scale),this.wireframe!==void 0&&(n.wireframe=this.wireframe),this.wireframeLinewidth!==void 0&&(n.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!==void 0&&(n.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!==void 0&&(n.wireframeLinejoin=this.wireframeLinejoin),this.flatShading!==void 0&&(n.flatShading=this.flatShading),this.fog!==void 0&&(n.fog=this.fog),Object.keys(this.userData).length>0&&(n.userData=this.userData);function s(o){let r=[];for(let a in o){let l=o[a];delete l.metadata,r.push(l)}return r}if(e){let o=s(t.textures),r=s(t.images);o.length>0&&(n.textures=o),r.length>0&&(n.images=r)}return n}fromJSON(t,e){if(t.uuid!==void 0&&(this.uuid=t.uuid),t.name!==void 0&&(this.name=t.name),t.color!==void 0&&this.color!==void 0&&this.color.setHex(t.color),t.roughness!==void 0&&(this.roughness=t.roughness),t.metalness!==void 0&&(this.metalness=t.metalness),t.sheen!==void 0&&(this.sheen=t.sheen),t.sheenColor!==void 0&&(this.sheenColor=new J().setHex(t.sheenColor)),t.sheenRoughness!==void 0&&(this.sheenRoughness=t.sheenRoughness),t.emissive!==void 0&&this.emissive!==void 0&&this.emissive.setHex(t.emissive),t.specular!==void 0&&this.specular!==void 0&&this.specular.setHex(t.specular),t.specularIntensity!==void 0&&(this.specularIntensity=t.specularIntensity),t.specularColor!==void 0&&this.specularColor!==void 0&&this.specularColor.setHex(t.specularColor),t.shininess!==void 0&&(this.shininess=t.shininess),t.clearcoat!==void 0&&(this.clearcoat=t.clearcoat),t.clearcoatRoughness!==void 0&&(this.clearcoatRoughness=t.clearcoatRoughness),t.dispersion!==void 0&&(this.dispersion=t.dispersion),t.retroreflectivity!==void 0&&(this.retroreflectivity=t.retroreflectivity),t.iridescence!==void 0&&(this.iridescence=t.iridescence),t.iridescenceIOR!==void 0&&(this.iridescenceIOR=t.iridescenceIOR),t.iridescenceThicknessRange!==void 0&&(this.iridescenceThicknessRange=t.iridescenceThicknessRange),t.transmission!==void 0&&(this.transmission=t.transmission),t.thickness!==void 0&&(this.thickness=t.thickness),t.attenuationDistance!==void 0&&(this.attenuationDistance=t.attenuationDistance),t.attenuationColor!==void 0&&this.attenuationColor!==void 0&&this.attenuationColor.setHex(t.attenuationColor),t.anisotropy!==void 0&&(this.anisotropy=t.anisotropy),t.anisotropyRotation!==void 0&&(this.anisotropyRotation=t.anisotropyRotation),t.fog!==void 0&&(this.fog=t.fog),t.flatShading!==void 0&&(this.flatShading=t.flatShading),t.blending!==void 0&&(this.blending=t.blending),t.combine!==void 0&&(this.combine=t.combine),t.side!==void 0&&(this.side=t.side),t.shadowSide!==void 0&&(this.shadowSide=t.shadowSide),t.opacity!==void 0&&(this.opacity=t.opacity),t.transparent!==void 0&&(this.transparent=t.transparent),t.alphaTest!==void 0&&(this.alphaTest=t.alphaTest),t.alphaHash!==void 0&&(this.alphaHash=t.alphaHash),t.depthFunc!==void 0&&(this.depthFunc=t.depthFunc),t.depthTest!==void 0&&(this.depthTest=t.depthTest),t.depthWrite!==void 0&&(this.depthWrite=t.depthWrite),t.colorWrite!==void 0&&(this.colorWrite=t.colorWrite),t.clippingPlanes!==void 0&&(this.clippingPlanes=t.clippingPlanes.map(n=>new Kn().fromJSON(n))),t.clipIntersection!==void 0&&(this.clipIntersection=t.clipIntersection),t.clipShadows!==void 0&&(this.clipShadows=t.clipShadows),t.depthPacking!==void 0&&(this.depthPacking=t.depthPacking),t.blendSrc!==void 0&&(this.blendSrc=t.blendSrc),t.blendDst!==void 0&&(this.blendDst=t.blendDst),t.blendEquation!==void 0&&(this.blendEquation=t.blendEquation),t.blendSrcAlpha!==void 0&&(this.blendSrcAlpha=t.blendSrcAlpha),t.blendDstAlpha!==void 0&&(this.blendDstAlpha=t.blendDstAlpha),t.blendEquationAlpha!==void 0&&(this.blendEquationAlpha=t.blendEquationAlpha),t.blendColor!==void 0&&this.blendColor!==void 0&&this.blendColor.setHex(t.blendColor),t.blendAlpha!==void 0&&(this.blendAlpha=t.blendAlpha),t.stencilWriteMask!==void 0&&(this.stencilWriteMask=t.stencilWriteMask),t.stencilFunc!==void 0&&(this.stencilFunc=t.stencilFunc),t.stencilRef!==void 0&&(this.stencilRef=t.stencilRef),t.stencilFuncMask!==void 0&&(this.stencilFuncMask=t.stencilFuncMask),t.stencilFail!==void 0&&(this.stencilFail=t.stencilFail),t.stencilZFail!==void 0&&(this.stencilZFail=t.stencilZFail),t.stencilZPass!==void 0&&(this.stencilZPass=t.stencilZPass),t.stencilWrite!==void 0&&(this.stencilWrite=t.stencilWrite),t.wireframe!==void 0&&(this.wireframe=t.wireframe),t.wireframeLinewidth!==void 0&&(this.wireframeLinewidth=t.wireframeLinewidth),t.wireframeLinecap!==void 0&&(this.wireframeLinecap=t.wireframeLinecap),t.wireframeLinejoin!==void 0&&(this.wireframeLinejoin=t.wireframeLinejoin),t.rotation!==void 0&&(this.rotation=t.rotation),t.linewidth!==void 0&&(this.linewidth=t.linewidth),t.linecap!==void 0&&(this.linecap=t.linecap),t.linejoin!==void 0&&(this.linejoin=t.linejoin),t.dashSize!==void 0&&(this.dashSize=t.dashSize),t.gapSize!==void 0&&(this.gapSize=t.gapSize),t.scale!==void 0&&(this.scale=t.scale),t.polygonOffset!==void 0&&(this.polygonOffset=t.polygonOffset),t.polygonOffsetFactor!==void 0&&(this.polygonOffsetFactor=t.polygonOffsetFactor),t.polygonOffsetUnits!==void 0&&(this.polygonOffsetUnits=t.polygonOffsetUnits),t.dithering!==void 0&&(this.dithering=t.dithering),t.alphaToCoverage!==void 0&&(this.alphaToCoverage=t.alphaToCoverage),t.premultipliedAlpha!==void 0&&(this.premultipliedAlpha=t.premultipliedAlpha),t.forceSinglePass!==void 0&&(this.forceSinglePass=t.forceSinglePass),t.allowOverride!==void 0&&(this.allowOverride=t.allowOverride),t.visible!==void 0&&(this.visible=t.visible),t.toneMapped!==void 0&&(this.toneMapped=t.toneMapped),t.userData!==void 0&&(this.userData=t.userData),t.vertexColors!==void 0&&(typeof t.vertexColors=="number"?this.vertexColors=t.vertexColors>0:this.vertexColors=t.vertexColors),t.size!==void 0&&(this.size=t.size),t.sizeAttenuation!==void 0&&(this.sizeAttenuation=t.sizeAttenuation),t.map!==void 0&&(this.map=e[t.map]||null),t.matcap!==void 0&&(this.matcap=e[t.matcap]||null),t.alphaMap!==void 0&&(this.alphaMap=e[t.alphaMap]||null),t.bumpMap!==void 0&&(this.bumpMap=e[t.bumpMap]||null),t.bumpScale!==void 0&&(this.bumpScale=t.bumpScale),t.normalMap!==void 0&&(this.normalMap=e[t.normalMap]||null),t.normalMapType!==void 0&&(this.normalMapType=t.normalMapType),t.normalScale!==void 0){let n=t.normalScale;Array.isArray(n)===!1&&(n=[n,n]),this.normalScale=new Zt().fromArray(n)}return t.displacementMap!==void 0&&(this.displacementMap=e[t.displacementMap]||null),t.displacementScale!==void 0&&(this.displacementScale=t.displacementScale),t.displacementBias!==void 0&&(this.displacementBias=t.displacementBias),t.roughnessMap!==void 0&&(this.roughnessMap=e[t.roughnessMap]||null),t.metalnessMap!==void 0&&(this.metalnessMap=e[t.metalnessMap]||null),t.emissiveMap!==void 0&&(this.emissiveMap=e[t.emissiveMap]||null),t.emissiveIntensity!==void 0&&(this.emissiveIntensity=t.emissiveIntensity),t.specularMap!==void 0&&(this.specularMap=e[t.specularMap]||null),t.specularIntensityMap!==void 0&&(this.specularIntensityMap=e[t.specularIntensityMap]||null),t.specularColorMap!==void 0&&(this.specularColorMap=e[t.specularColorMap]||null),t.envMap!==void 0&&(this.envMap=e[t.envMap]||null),t.envMapRotation!==void 0&&this.envMapRotation.fromArray(t.envMapRotation),t.envMapIntensity!==void 0&&(this.envMapIntensity=t.envMapIntensity),t.reflectivity!==void 0&&(this.reflectivity=t.reflectivity),t.refractionRatio!==void 0&&(this.refractionRatio=t.refractionRatio),t.lightMap!==void 0&&(this.lightMap=e[t.lightMap]||null),t.lightMapIntensity!==void 0&&(this.lightMapIntensity=t.lightMapIntensity),t.aoMap!==void 0&&(this.aoMap=e[t.aoMap]||null),t.aoMapIntensity!==void 0&&(this.aoMapIntensity=t.aoMapIntensity),t.gradientMap!==void 0&&(this.gradientMap=e[t.gradientMap]||null),t.clearcoatMap!==void 0&&(this.clearcoatMap=e[t.clearcoatMap]||null),t.clearcoatRoughnessMap!==void 0&&(this.clearcoatRoughnessMap=e[t.clearcoatRoughnessMap]||null),t.clearcoatNormalMap!==void 0&&(this.clearcoatNormalMap=e[t.clearcoatNormalMap]||null),t.clearcoatNormalScale!==void 0&&(this.clearcoatNormalScale=new Zt().fromArray(t.clearcoatNormalScale)),t.iridescenceMap!==void 0&&(this.iridescenceMap=e[t.iridescenceMap]||null),t.iridescenceThicknessMap!==void 0&&(this.iridescenceThicknessMap=e[t.iridescenceThicknessMap]||null),t.transmissionMap!==void 0&&(this.transmissionMap=e[t.transmissionMap]||null),t.thicknessMap!==void 0&&(this.thicknessMap=e[t.thicknessMap]||null),t.anisotropyMap!==void 0&&(this.anisotropyMap=e[t.anisotropyMap]||null),t.sheenColorMap!==void 0&&(this.sheenColorMap=e[t.sheenColorMap]||null),t.sheenRoughnessMap!==void 0&&(this.sheenRoughnessMap=e[t.sheenRoughnessMap]||null),this}clone(){return new this.constructor().copy(this)}copy(t){this.name=t.name,this.blending=t.blending,this.side=t.side,this.vertexColors=t.vertexColors,this.opacity=t.opacity,this.transparent=t.transparent,this.blendSrc=t.blendSrc,this.blendDst=t.blendDst,this.blendEquation=t.blendEquation,this.blendSrcAlpha=t.blendSrcAlpha,this.blendDstAlpha=t.blendDstAlpha,this.blendEquationAlpha=t.blendEquationAlpha,this.blendColor.copy(t.blendColor),this.blendAlpha=t.blendAlpha,this.depthFunc=t.depthFunc,this.depthTest=t.depthTest,this.depthWrite=t.depthWrite,this.stencilWriteMask=t.stencilWriteMask,this.stencilFunc=t.stencilFunc,this.stencilRef=t.stencilRef,this.stencilFuncMask=t.stencilFuncMask,this.stencilFail=t.stencilFail,this.stencilZFail=t.stencilZFail,this.stencilZPass=t.stencilZPass,this.stencilWrite=t.stencilWrite;let e=t.clippingPlanes,n=null;if(e!==null){let s=e.length;n=new Array(s);for(let o=0;o!==s;++o)n[o]=e[o].clone()}return this.clippingPlanes=n,this.clipIntersection=t.clipIntersection,this.clipShadows=t.clipShadows,this.shadowSide=t.shadowSide,this.colorWrite=t.colorWrite,this.precision=t.precision,this.polygonOffset=t.polygonOffset,this.polygonOffsetFactor=t.polygonOffsetFactor,this.polygonOffsetUnits=t.polygonOffsetUnits,this.dithering=t.dithering,this.alphaTest=t.alphaTest,this.alphaHash=t.alphaHash,this.alphaToCoverage=t.alphaToCoverage,this.premultipliedAlpha=t.premultipliedAlpha,this.forceSinglePass=t.forceSinglePass,this.allowOverride=t.allowOverride,this.visible=t.visible,this.toneMapped=t.toneMapped,this.userData=JSON.parse(JSON.stringify(t.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(t){t===!0&&this.version++}};var wi=new x,hl=new x,Ar=new x,Cr=new x,to=class{constructor(t=new x,e=new x(0,0,-1)){this.origin=t,this.direction=e}set(t,e){return this.origin.copy(t),this.direction.copy(e),this}copy(t){return this.origin.copy(t.origin),this.direction.copy(t.direction),this}at(t,e){return e.copy(this.origin).addScaledVector(this.direction,t)}lookAt(t){return this.direction.copy(t).sub(this.origin).normalize(),this}recast(t){return this.origin.copy(this.at(t,wi)),this}closestPointToPoint(t,e){e.subVectors(t,this.origin);let n=e.dot(this.direction);return n<0?e.copy(this.origin):e.copy(this.origin).addScaledVector(this.direction,n)}distanceToPoint(t){return Math.sqrt(this.distanceSqToPoint(t))}distanceSqToPoint(t){let e=wi.subVectors(t,this.origin).dot(this.direction);return e<0?this.origin.distanceToSquared(t):(wi.copy(this.origin).addScaledVector(this.direction,e),wi.distanceToSquared(t))}distanceSqToSegment(t,e,n,s){hl.copy(t).add(e).multiplyScalar(.5),Ar.copy(e).sub(t).normalize(),Cr.copy(this.origin).sub(hl);let o=t.distanceTo(e)*.5,r=-this.direction.dot(Ar),a=Cr.dot(this.direction),l=-Cr.dot(Ar),c=Cr.lengthSq(),h=Math.abs(1-r*r),d,u,m,g;if(h>0)if(d=r*l-a,u=r*a-l,g=o*h,d>=0)if(u>=-g)if(u<=g){let y=1/h;d*=y,u*=y,m=d*(d+r*u+2*a)+u*(r*d+u+2*l)+c}else u=o,d=Math.max(0,-(r*u+a)),m=-d*d+u*(u+2*l)+c;else u=-o,d=Math.max(0,-(r*u+a)),m=-d*d+u*(u+2*l)+c;else u<=-g?(d=Math.max(0,-(-r*o+a)),u=d>0?-o:Math.min(Math.max(-o,-l),o),m=-d*d+u*(u+2*l)+c):u<=g?(d=0,u=Math.min(Math.max(-o,-l),o),m=u*(u+2*l)+c):(d=Math.max(0,-(r*o+a)),u=d>0?o:Math.min(Math.max(-o,-l),o),m=-d*d+u*(u+2*l)+c);else u=r>0?-o:o,d=Math.max(0,-(r*u+a)),m=-d*d+u*(u+2*l)+c;return n&&n.copy(this.origin).addScaledVector(this.direction,d),s&&s.copy(hl).addScaledVector(Ar,u),m}intersectSphere(t,e){if(t.radius<0)return null;wi.subVectors(t.center,this.origin);let n=wi.dot(this.direction),s=wi.dot(wi)-n*n,o=t.radius*t.radius;if(s>o)return null;let r=Math.sqrt(o-s),a=n-r,l=n+r;return l<0?null:a<0?this.at(l,e):this.at(a,e)}intersectsSphere(t){return t.radius<0?!1:this.distanceSqToPoint(t.center)<=t.radius*t.radius}distanceToPlane(t){let e=t.normal.dot(this.direction);if(e===0)return t.distanceToPoint(this.origin)===0?0:null;let n=-(this.origin.dot(t.normal)+t.constant)/e;return n>=0?n:null}intersectPlane(t,e){let n=this.distanceToPlane(t);return n===null?null:this.at(n,e)}intersectsPlane(t){let e=t.distanceToPoint(this.origin);return e===0||t.normal.dot(this.direction)*e<0}intersectBox(t,e){let n,s,o,r,a,l,c=1/this.direction.x,h=1/this.direction.y,d=1/this.direction.z,u=this.origin;return c>=0?(n=(t.min.x-u.x)*c,s=(t.max.x-u.x)*c):(n=(t.max.x-u.x)*c,s=(t.min.x-u.x)*c),h>=0?(o=(t.min.y-u.y)*h,r=(t.max.y-u.y)*h):(o=(t.max.y-u.y)*h,r=(t.min.y-u.y)*h),n>r||o>s||((o>n||isNaN(n))&&(n=o),(r<s||isNaN(s))&&(s=r),d>=0?(a=(t.min.z-u.z)*d,l=(t.max.z-u.z)*d):(a=(t.max.z-u.z)*d,l=(t.min.z-u.z)*d),n>l||a>s)||((a>n||n!==n)&&(n=a),(l<s||s!==s)&&(s=l),s<0)?null:this.at(n>=0?n:s,e)}intersectsBox(t){return this.intersectBox(t,wi)!==null}intersectTriangle(t,e,n,s,o){let r=this.origin,a=this.direction,l=a.x,c=a.y,h=a.z,d=t.x-r.x,u=t.y-r.y,m=t.z-r.z,g=e.x-r.x,y=e.y-r.y,p=e.z-r.z,f=n.x-r.x,v=n.y-r.y,S=n.z-r.z,_=Math.abs(l),b=Math.abs(c),E=Math.abs(h),A,M,w,T,P,N,F,D,z,L,U,O;if(_>=b&&_>=E?(w=l,N=d,z=g,O=f,l>=0?(A=c,M=h,T=u,P=m,F=y,D=p,L=v,U=S):(A=h,M=c,T=m,P=u,F=p,D=y,L=S,U=v)):b>=E?(w=c,N=u,z=y,O=v,c>=0?(A=h,M=l,T=m,P=d,F=p,D=g,L=S,U=f):(A=l,M=h,T=d,P=m,F=g,D=p,L=f,U=S)):(w=h,N=m,z=p,O=S,h>=0?(A=l,M=c,T=d,P=u,F=g,D=y,L=f,U=v):(A=c,M=l,T=u,P=d,F=y,D=g,L=v,U=f)),w===0)return null;let k=A/w,W=M/w,q=1/w,at=T-k*N,it=P-W*N,lt=F-k*z,wt=D-W*z,gt=L-k*O,K=U-W*O,tt=gt*wt-K*lt,dt=at*K-it*gt,Ct=lt*it-wt*at;if(s){if(tt<0||dt<0||Ct<0)return null}else if((tt<0||dt<0||Ct<0)&&(tt>0||dt>0||Ct>0))return null;let _t=tt+dt+Ct;if(_t===0)return null;let $t=q*(tt*N+dt*z+Ct*O);return(_t>0?$t<0:$t>0)?null:this.at($t/_t,o)}applyMatrix4(t){return this.origin.applyMatrix4(t),this.direction.transformDirection(t),this}equals(t){return t.origin.equals(this.origin)&&t.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}},Ti=class extends Yi{constructor(t){super(),this.isMeshBasicMaterial=!0,this.type="MeshBasicMaterial",this.color=new J(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Dn,this.combine=bl,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.lightMap=t.lightMap,this.lightMapIntensity=t.lightMapIntensity,this.aoMap=t.aoMap,this.aoMapIntensity=t.aoMapIntensity,this.specularMap=t.specularMap,this.alphaMap=t.alphaMap,this.envMap=t.envMap,this.envMapRotation.copy(t.envMapRotation),this.combine=t.combine,this.reflectivity=t.reflectivity,this.refractionRatio=t.refractionRatio,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.wireframeLinecap=t.wireframeLinecap,this.wireframeLinejoin=t.wireframeLinejoin,this.fog=t.fog,this}},cu=new le,fs=new to,Pr=new Si,lu=new x,Ir=new x,Dr=new x,Lr=new x,ul=new x,Nr=new x,hu=new x,Hr=new x,ut=class extends Ln{constructor(t=new oe,e=new Ti){super(),this.isMesh=!0,this.type="Mesh",this.geometry=t,this.material=e,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.count=1,this.updateMorphTargets()}copy(t,e){return super.copy(t,e),t.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=t.morphTargetInfluences.slice()),t.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},t.morphTargetDictionary)),this.material=Array.isArray(t.material)?t.material.slice():t.material,this.geometry=t.geometry,this}updateMorphTargets(){let e=this.geometry.morphAttributes,n=Object.keys(e);if(n.length>0){let s=e[n[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let o=0,r=s.length;o<r;o++){let a=s[o].name||String(o);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=o}}}}getVertexPosition(t,e){let n=this.geometry,s=n.attributes.position,o=n.morphAttributes.position,r=n.morphTargetsRelative;e.fromBufferAttribute(s,t);let a=this.morphTargetInfluences;if(o&&a){Nr.set(0,0,0);for(let l=0,c=o.length;l<c;l++){let h=a[l],d=o[l];h!==0&&(ul.fromBufferAttribute(d,t),r?Nr.addScaledVector(ul,h):Nr.addScaledVector(ul.sub(e),h))}e.add(Nr)}return e}intersectsFrustum(t){return t.intersectsObject(this)}raycast(t,e){let n=this.geometry,s=this.material,o=this.matrixWorld;s!==void 0&&(n.boundingSphere===null&&n.computeBoundingSphere(),Pr.copy(n.boundingSphere),Pr.applyMatrix4(o),fs.copy(t.ray).recast(t.near),!(Pr.containsPoint(fs.origin)===!1&&(fs.intersectSphere(Pr,lu)===null||fs.origin.distanceToSquared(lu)>(t.far-t.near)**2))&&(cu.copy(o).invert(),fs.copy(t.ray).applyMatrix4(cu),!(n.boundingBox!==null&&fs.intersectsBox(n.boundingBox)===!1)&&this._computeIntersections(t,e,fs)))}_computeIntersections(t,e,n){let s,o=this.geometry,r=this.material,a=o.index,l=o.attributes.position,c=o.attributes.uv,h=o.attributes.uv1,d=o.attributes.normal,u=o.groups,m=o.drawRange;if(a!==null)if(Array.isArray(r))for(let g=0,y=u.length;g<y;g++){let p=u[g],f=r[p.materialIndex],v=Math.max(p.start,m.start),S=Math.min(a.count,Math.min(p.start+p.count,m.start+m.count));for(let _=v,b=S;_<b;_+=3){let E=a.getX(_),A=a.getX(_+1),M=a.getX(_+2);s=Ur(this,f,t,n,c,h,d,E,A,M),s&&(s.faceIndex=Math.floor(_/3),s.face.materialIndex=p.materialIndex,e.push(s))}}else{let g=Math.max(0,m.start),y=Math.min(a.count,m.start+m.count);for(let p=g,f=y;p<f;p+=3){let v=a.getX(p),S=a.getX(p+1),_=a.getX(p+2);s=Ur(this,r,t,n,c,h,d,v,S,_),s&&(s.faceIndex=Math.floor(p/3),e.push(s))}}else if(l!==void 0)if(Array.isArray(r))for(let g=0,y=u.length;g<y;g++){let p=u[g],f=r[p.materialIndex],v=Math.max(p.start,m.start),S=Math.min(l.count,Math.min(p.start+p.count,m.start+m.count));for(let _=v,b=S;_<b;_+=3){let E=_,A=_+1,M=_+2;s=Ur(this,f,t,n,c,h,d,E,A,M),s&&(s.faceIndex=Math.floor(_/3),s.face.materialIndex=p.materialIndex,e.push(s))}}else{let g=Math.max(0,m.start),y=Math.min(l.count,m.start+m.count);for(let p=g,f=y;p<f;p+=3){let v=p,S=p+1,_=p+2;s=Ur(this,r,t,n,c,h,d,v,S,_),s&&(s.faceIndex=Math.floor(p/3),e.push(s))}}}};function Pf(i,t,e,n,s,o,r,a){let l;if(t.side===fn?l=n.intersectTriangle(r,o,s,!0,a):l=n.intersectTriangle(s,o,r,t.side===Qn,a),l===null)return null;Hr.copy(a),Hr.applyMatrix4(i.matrixWorld);let c=e.ray.origin.distanceTo(Hr);return c<e.near||c>e.far?null:{distance:c,point:Hr.clone(),object:i}}function Ur(i,t,e,n,s,o,r,a,l,c){i.getVertexPosition(a,Ir),i.getVertexPosition(l,Dr),i.getVertexPosition(c,Lr);let h=Pf(i,t,e,n,Ir,Dr,Lr,hu);if(h){let d=new x;qi.getBarycoord(hu,Ir,Dr,Lr,d),s&&(h.uv=qi.getInterpolatedAttribute(s,a,l,c,d,new Zt)),o&&(h.uv1=qi.getInterpolatedAttribute(o,a,l,c,d,new Zt)),r&&(h.normal=qi.getInterpolatedAttribute(r,a,l,c,d,new x),h.normal.dot(n.direction)>0&&h.normal.multiplyScalar(-1));let u={a,b:l,c,normal:new x,materialIndex:0};qi.getNormal(Ir,Dr,Lr,u.normal),h.face=u,h.barycoord=d}return h}var ko=class extends Sn{constructor(t=null,e=1,n=1,s,o,r,a,l,c=Ve,h=Ve,d,u){super(null,r,a,l,c,h,s,o,d,u),this.isDataTexture=!0,this.image={data:t,width:e,height:n},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}};var Fo=class extends ve{constructor(t,e,n,s=1){super(t,e,n),this.isInstancedBufferAttribute=!0,this.meshPerAttribute=s}copy(t){return super.copy(t),this.meshPerAttribute=t.meshPerAttribute,this}toJSON(){let t=super.toJSON();return t.meshPerAttribute=this.meshPerAttribute,t.isInstancedBufferAttribute=!0,t}},Bs=new le,uu=new le,kr=[],du=new Tn,If=new le,To=new ut,Ro=new Si,Ri=class extends ut{constructor(t,e,n){super(t,e),this.isInstancedMesh=!0,this.instanceMatrix=new Fo(new Float32Array(n*16),16),this.instanceColor=null,this.morphTexture=null,this.count=n,this.boundingBox=null,this.boundingSphere=null;for(let s=0;s<n;s++)this.setMatrixAt(s,If)}computeBoundingBox(){let t=this.geometry,e=this.count;this.boundingBox===null&&(this.boundingBox=new Tn),t.boundingBox===null&&t.computeBoundingBox(),this.boundingBox.makeEmpty();for(let n=0;n<e;n++)this.getMatrixAt(n,Bs),du.copy(t.boundingBox).applyMatrix4(Bs),this.boundingBox.union(du)}computeBoundingSphere(){let t=this.geometry,e=this.count;this.boundingSphere===null&&(this.boundingSphere=new Si),t.boundingSphere===null&&t.computeBoundingSphere(),this.boundingSphere.makeEmpty();for(let n=0;n<e;n++)this.getMatrixAt(n,Bs),Ro.copy(t.boundingSphere).applyMatrix4(Bs),this.boundingSphere.union(Ro)}copy(t,e){return super.copy(t,e),this.instanceMatrix.copy(t.instanceMatrix),t.morphTexture!==null&&(this.morphTexture=t.morphTexture.clone()),t.instanceColor!==null&&(this.instanceColor=t.instanceColor.clone()),this.count=t.count,t.boundingBox!==null&&(this.boundingBox=t.boundingBox.clone()),t.boundingSphere!==null&&(this.boundingSphere=t.boundingSphere.clone()),this}getColorAt(t,e){return this.instanceColor===null?e.setRGB(1,1,1):e.fromArray(this.instanceColor.array,t*3)}getMatrixAt(t,e){return e.fromArray(this.instanceMatrix.array,t*16)}getMorphAt(t,e){let n=e.morphTargetInfluences,s=this.morphTexture.source.data.data,o=n.length+1,r=t*o+1;for(let a=0;a<n.length;a++)n[a]=s[r+a]}raycast(t,e){let n=this.matrixWorld,s=this.count;if(To.geometry=this.geometry,To.material=this.material,To.material!==void 0&&(this.boundingSphere===null&&this.computeBoundingSphere(),Ro.copy(this.boundingSphere),Ro.applyMatrix4(n),t.ray.intersectsSphere(Ro)!==!1))for(let o=0;o<s;o++){this.getMatrixAt(o,Bs),uu.multiplyMatrices(n,Bs),To.matrixWorld=uu,To.raycast(t,kr);for(let r=0,a=kr.length;r<a;r++){let l=kr[r];l.instanceId=o,l.object=this,e.push(l)}kr.length=0}}setColorAt(t,e){return this.instanceColor===null&&(this.instanceColor=new Fo(new Float32Array(this.instanceMatrix.count*3).fill(1),3)),e.toArray(this.instanceColor.array,t*3),this}setMatrixAt(t,e){return e.toArray(this.instanceMatrix.array,t*16),this}setMorphAt(t,e){let n=e.morphTargetInfluences,s=n.length+1;this.morphTexture===null&&(this.morphTexture=new ko(new Float32Array(s*this.count),s,this.count,Ia,Vn));let o=this.morphTexture.source.data.data,r=0;for(let c=0;c<n.length;c++)r+=n[c];let a=this.geometry.morphTargetsRelative?1:1-r,l=s*t;return o[l]=a,o.set(n,l+1),this}updateMorphTargets(){}dispose(){super.dispose(),this.morphTexture!==null&&(this.morphTexture.dispose(),this.morphTexture=null)}},ps=new Si,Df=new Zt(.5,.5),Fr=new x,zo=class{constructor(t=new Kn,e=new Kn,n=new Kn,s=new Kn,o=new Kn,r=new Kn){this.planes=[t,e,n,s,o,r]}set(t,e,n,s,o,r){let a=this.planes;return a[0].copy(t),a[1].copy(e),a[2].copy(n),a[3].copy(s),a[4].copy(o),a[5].copy(r),this}copy(t){let e=this.planes;for(let n=0;n<6;n++)e[n].copy(t.planes[n]);return this}setFromProjectionMatrix(t,e=Jn,n=!1){let s=this.planes,o=t.elements,r=o[0],a=o[1],l=o[2],c=o[3],h=o[4],d=o[5],u=o[6],m=o[7],g=o[8],y=o[9],p=o[10],f=o[11],v=o[12],S=o[13],_=o[14],b=o[15];if(s[0].setComponents(c-r,m-h,f-g,b-v).normalize(),s[1].setComponents(c+r,m+h,f+g,b+v).normalize(),s[2].setComponents(c+a,m+d,f+y,b+S).normalize(),s[3].setComponents(c-a,m-d,f-y,b-S).normalize(),n)s[4].setComponents(l,u,p,_).normalize(),s[5].setComponents(c-l,m-u,f-p,b-_).normalize();else if(s[4].setComponents(c-l,m-u,f-p,b-_).normalize(),e===Jn)s[5].setComponents(c+l,m+u,f+p,b+_).normalize();else if(e===Do)s[5].setComponents(l,u,p,_).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+e);return this}intersectsObject(t){if(t.boundingSphere!==void 0)t.boundingSphere===null&&t.computeBoundingSphere(),ps.copy(t.boundingSphere).applyMatrix4(t.matrixWorld);else{let e=t.geometry;e.boundingSphere===null&&e.computeBoundingSphere(),ps.copy(e.boundingSphere).applyMatrix4(t.matrixWorld)}return this.intersectsSphere(ps)}intersectsSprite(t){ps.center.set(0,0,0);let e=Df.distanceTo(t.center);return ps.radius=.7071067811865476+e,ps.applyMatrix4(t.matrixWorld),this.intersectsSphere(ps)}intersectsSphere(t){let e=this.planes,n=t.center,s=-t.radius;for(let o=0;o<6;o++)if(e[o].distanceToPoint(n)<s)return!1;return!0}intersectsBox(t){let e=this.planes;for(let n=0;n<6;n++){let s=e[n];if(Fr.x=s.normal.x>0?t.max.x:t.min.x,Fr.y=s.normal.y>0?t.max.y:t.min.y,Fr.z=s.normal.z>0?t.max.z:t.min.z,s.distanceToPoint(Fr)<0)return!1}return!0}containsPoint(t){let e=this.planes;for(let n=0;n<6;n++)if(e[n].distanceToPoint(t)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}};var sa=class extends Yi{constructor(t){super(),this.isPointsMaterial=!0,this.type="PointsMaterial",this.color=new J(16777215),this.map=null,this.alphaMap=null,this.size=1,this.sizeAttenuation=!0,this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.alphaMap=t.alphaMap,this.size=t.size,this.sizeAttenuation=t.sizeAttenuation,this.fog=t.fog,this}},fu=new le,xl=new to,zr=new Si,Or=new x,eo=class extends Ln{constructor(t=new oe,e=new sa){super(),this.isPoints=!0,this.type="Points",this.geometry=t,this.material=e,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.updateMorphTargets()}copy(t,e){return super.copy(t,e),this.material=Array.isArray(t.material)?t.material.slice():t.material,this.geometry=t.geometry,this}intersectsFrustum(t){return t.intersectsObject(this)}raycast(t,e){let n=this.geometry,s=this.matrixWorld,o=t.params.Points.threshold,r=n.drawRange;if(n.boundingSphere===null&&n.computeBoundingSphere(),zr.copy(n.boundingSphere),zr.applyMatrix4(s),zr.radius+=o,t.ray.intersectsSphere(zr)===!1)return;fu.copy(s).invert(),xl.copy(t.ray).applyMatrix4(fu);let a=o/((this.scale.x+this.scale.y+this.scale.z)/3),l=a*a,c=n.index,d=n.attributes.position;if(c!==null){let u=Math.max(0,r.start),m=Math.min(c.count,r.start+r.count);for(let g=u,y=m;g<y;g++){let p=c.getX(g);Or.fromBufferAttribute(d,p),pu(Or,p,l,s,t,e,this)}}else{let u=Math.max(0,r.start),m=Math.min(d.count,r.start+r.count);for(let g=u,y=m;g<y;g++)Or.fromBufferAttribute(d,g),pu(Or,g,l,s,t,e,this)}}updateMorphTargets(){let e=this.geometry.morphAttributes,n=Object.keys(e);if(n.length>0){let s=e[n[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let o=0,r=s.length;o<r;o++){let a=s[o].name||String(o);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=o}}}}};function pu(i,t,e,n,s,o,r){let a=xl.distanceSqToPoint(i);if(a<e){let l=new x;xl.closestPointToPoint(i,l),l.applyMatrix4(n);let c=s.ray.origin.distanceTo(l);if(c<s.near||c>s.far)return;o.push({distance:c,distanceToRay:Math.sqrt(a),point:l,index:t,face:null,faceIndex:null,barycoord:null,object:r})}}var Oo=class extends Sn{constructor(t=[],e=Qi,n,s,o,r,a,l,c,h){super(t,e,n,s,o,r,a,l,c,h),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(t){this.image=t}};var jn=class extends Sn{constructor(t,e,n=Un,s,o,r,a=Ve,l=Ve,c,h=li,d=1){if(h!==li&&h!==di)throw new Error("THREE.DepthTexture: format must be either THREE.DepthFormat or THREE.DepthStencilFormat");let u={width:t,height:e,depth:d};super(u,s,o,r,a,l,h,n,c),this.isDepthTexture=!0,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(t){return super.copy(t),this.source=new Js(Object.assign({},t.image)),this.compareFunction=t.compareFunction,this}toJSON(t){let e=super.toJSON(t);return e.compareFunction=this.compareFunction,e}},oa=class extends jn{constructor(t,e=Un,n=Qi,s,o,r=Ve,a=Ve,l,c=li){let h={width:t,height:t,depth:1},d=[h,h,h,h,h,h];super(t,t,e,n,s,o,r,a,l,c),this.image=d,this.isCubeDepthTexture=!0,this.isCubeTexture=!0}get images(){return this.image}set images(t){this.image=t}},Vo=class extends Sn{constructor(t=null){super(),this.sourceTexture=t,this.isExternalTexture=!0}copy(t){return super.copy(t),this.sourceTexture=t.sourceTexture,this}},dn=class i extends oe{constructor(t=1,e=1,n=1,s=1,o=1,r=1){super(),this.type="BoxGeometry",this.parameters={width:t,height:e,depth:n,widthSegments:s,heightSegments:o,depthSegments:r};let a=this;s=Math.floor(s),o=Math.floor(o),r=Math.floor(r);let l=[],c=[],h=[],d=[],u=0,m=0;g("z","y","x",-1,-1,n,e,t,r,o,0),g("z","y","x",1,-1,n,e,-t,r,o,1),g("x","z","y",1,1,t,n,e,s,r,2),g("x","z","y",1,-1,t,n,-e,s,r,3),g("x","y","z",1,-1,t,e,n,s,o,4),g("x","y","z",-1,-1,t,e,-n,s,o,5),this.setIndex(l),this.setAttribute("position",new qt(c,3)),this.setAttribute("normal",new qt(h,3)),this.setAttribute("uv",new qt(d,2));function g(y,p,f,v,S,_,b,E,A,M,w){let T=_/A,P=b/M,N=_/2,F=b/2,D=E/2,z=A+1,L=M+1,U=0,O=0,k=new x;for(let W=0;W<L;W++){let q=W*P-F;for(let at=0;at<z;at++){let it=at*T-N;k[y]=it*v,k[p]=q*S,k[f]=D,c.push(k.x,k.y,k.z),k[y]=0,k[p]=0,k[f]=E>0?1:-1,h.push(k.x,k.y,k.z),d.push(at/A),d.push(1-W/M),U+=1}}for(let W=0;W<M;W++)for(let q=0;q<A;q++){let at=u+q+z*W,it=u+q+z*(W+1),lt=u+(q+1)+z*(W+1),wt=u+(q+1)+z*W;l.push(at,it,wt),l.push(it,lt,wt),O+=6}a.addGroup(m,O,w),m+=O,u+=U}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new i(t.width,t.height,t.depth,t.widthSegments,t.heightSegments,t.depthSegments)}};var qe=class i extends oe{constructor(t=1,e=1,n=1,s=32,o=1,r=!1,a=0,l=Math.PI*2){super(),this.type="CylinderGeometry",this.parameters={radiusTop:t,radiusBottom:e,height:n,radialSegments:s,heightSegments:o,openEnded:r,thetaStart:a,thetaLength:l};let c=this;s=Math.floor(s),o=Math.floor(o);let h=[],d=[],u=[],m=[],g=0,y=[],p=n/2,f=0;v(),r===!1&&(t>0&&S(!0),e>0&&S(!1)),this.setIndex(h),this.setAttribute("position",new qt(d,3)),this.setAttribute("normal",new qt(u,3)),this.setAttribute("uv",new qt(m,2));function v(){let _=new x,b=new x,E=0,A=(e-t)/n;for(let M=0;M<=o;M++){let w=[],T=M/o,P=T*(e-t)+t;for(let N=0;N<=s;N++){let F=N/s,D=F*l+a,z=Math.sin(D),L=Math.cos(D);b.x=P*z,b.y=-T*n+p,b.z=P*L,d.push(b.x,b.y,b.z),_.set(z,A,L).normalize(),u.push(_.x,_.y,_.z),m.push(F,1-T),w.push(g++)}y.push(w)}for(let M=0;M<s;M++)for(let w=0;w<o;w++){let T=y[w][M],P=y[w+1][M],N=y[w+1][M+1],F=y[w][M+1];(t>0||w!==0)&&(h.push(T,P,F),E+=3),(e>0||w!==o-1)&&(h.push(P,N,F),E+=3)}c.addGroup(f,E,0),f+=E}function S(_){let b=g,E=new Zt,A=new x,M=0,w=_===!0?t:e,T=_===!0?1:-1;for(let N=1;N<=s;N++)d.push(0,p*T,0),u.push(0,T,0),m.push(.5,.5),g++;let P=g;for(let N=0;N<=s;N++){let D=N/s*l+a,z=Math.cos(D),L=Math.sin(D);A.x=w*L,A.y=p*T,A.z=w*z,d.push(A.x,A.y,A.z),u.push(0,T,0),E.x=z*.5+.5,E.y=L*.5*T+.5,m.push(E.x,E.y),g++}for(let N=0;N<s;N++){let F=b+N,D=P+N;_===!0?h.push(D,D+1,F):h.push(D+1,D,F),M+=3}c.addGroup(f,M,_===!0?1:2),f+=M}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new i(t.radiusTop,t.radiusBottom,t.height,t.radialSegments,t.heightSegments,t.openEnded,t.thetaStart,t.thetaLength)}},ys=class i extends qe{constructor(t=1,e=1,n=32,s=1,o=!1,r=0,a=Math.PI*2){super(0,t,e,n,s,o,r,a),this.type="ConeGeometry",this.parameters={radius:t,height:e,radialSegments:n,heightSegments:s,openEnded:o,thetaStart:r,thetaLength:a}}static fromJSON(t){return new i(t.radius,t.height,t.radialSegments,t.heightSegments,t.openEnded,t.thetaStart,t.thetaLength)}},ra=class i extends oe{constructor(t=[],e=[],n=1,s=0){super(),this.type="PolyhedronGeometry",this.parameters={vertices:t,indices:e,radius:n,detail:s};let o=[],r=[];a(s),c(n),h(),this.setAttribute("position",new qt(o,3)),this.setAttribute("normal",new qt(o.slice(),3)),this.setAttribute("uv",new qt(r,2)),s===0?this.computeVertexNormals():this.normalizeNormals();function a(v){let S=new x,_=new x,b=new x;for(let E=0;E<e.length;E+=3)m(e[E+0],S),m(e[E+1],_),m(e[E+2],b),l(S,_,b,v)}function l(v,S,_,b){let E=b+1,A=[];for(let M=0;M<=E;M++){A[M]=[];let w=v.clone().lerp(_,M/E),T=S.clone().lerp(_,M/E),P=E-M;for(let N=0;N<=P;N++)N===0&&M===E?A[M][N]=w:A[M][N]=w.clone().lerp(T,N/P)}for(let M=0;M<E;M++)for(let w=0;w<2*(E-M)-1;w++){let T=Math.floor(w/2);w%2===0?(u(A[M][T+1]),u(A[M+1][T]),u(A[M][T])):(u(A[M][T+1]),u(A[M+1][T+1]),u(A[M+1][T]))}}function c(v){let S=new x;for(let _=0;_<o.length;_+=3)S.x=o[_+0],S.y=o[_+1],S.z=o[_+2],S.normalize().multiplyScalar(v),o[_+0]=S.x,o[_+1]=S.y,o[_+2]=S.z}function h(){let v=new x;for(let S=0;S<o.length;S+=3){v.x=o[S+0],v.y=o[S+1],v.z=o[S+2];let _=p(v)/2/Math.PI+.5,b=f(v)/Math.PI+.5;r.push(_,1-b)}g(),d()}function d(){for(let v=0;v<r.length;v+=6){let S=r[v+0],_=r[v+2],b=r[v+4],E=Math.max(S,_,b),A=Math.min(S,_,b);E>.9&&A<.1&&(S<.2&&(r[v+0]+=1),_<.2&&(r[v+2]+=1),b<.2&&(r[v+4]+=1))}}function u(v){o.push(v.x,v.y,v.z)}function m(v,S){let _=v*3;S.x=t[_+0],S.y=t[_+1],S.z=t[_+2]}function g(){let v=new x,S=new x,_=new x,b=new x,E=new Zt,A=new Zt,M=new Zt;for(let w=0,T=0;w<o.length;w+=9,T+=6){v.set(o[w+0],o[w+1],o[w+2]),S.set(o[w+3],o[w+4],o[w+5]),_.set(o[w+6],o[w+7],o[w+8]),E.set(r[T+0],r[T+1]),A.set(r[T+2],r[T+3]),M.set(r[T+4],r[T+5]),b.copy(v).add(S).add(_).divideScalar(3);let P=p(b);y(E,T+0,v,P),y(A,T+2,S,P),y(M,T+4,_,P)}}function y(v,S,_,b){b<0&&v.x===1&&(r[S]=v.x-1),_.x===0&&_.z===0&&(r[S]=b/2/Math.PI+.5)}function p(v){return Math.atan2(v.z,-v.x)}function f(v){return Math.atan2(-v.y,Math.sqrt(v.x*v.x+v.z*v.z))}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new i(t.vertices,t.indices,t.radius,t.detail)}};var On=class i extends ra{constructor(t=1,e=0){let n=(1+Math.sqrt(5))/2,s=[-1,n,0,1,n,0,-1,-n,0,1,-n,0,0,-1,n,0,1,n,0,-1,-n,0,1,-n,n,0,-1,n,0,1,-n,0,-1,-n,0,1],o=[0,11,5,0,5,1,0,1,7,0,7,10,0,10,11,1,5,9,5,11,4,11,10,2,10,7,6,7,1,8,3,9,4,3,4,2,3,2,6,3,6,8,3,8,9,4,9,5,2,4,11,6,2,10,8,6,7,9,8,1];super(s,o,t,e),this.type="IcosahedronGeometry",this.parameters={radius:t,detail:e}}static fromJSON(t){return new i(t.radius,t.detail)}};var Nn=class i extends oe{constructor(t=1,e=1,n=1,s=1){super(),this.type="PlaneGeometry",this.parameters={width:t,height:e,widthSegments:n,heightSegments:s};let o=t/2,r=e/2,a=Math.floor(n),l=Math.floor(s),c=a+1,h=l+1,d=t/a,u=e/l,m=[],g=[],y=[],p=[];for(let f=0;f<h;f++){let v=f*u-r;for(let S=0;S<c;S++){let _=S*d-o;g.push(_,-v,0),y.push(0,0,1),p.push(S/a),p.push(1-f/l)}}for(let f=0;f<l;f++)for(let v=0;v<a;v++){let S=v+c*f,_=v+c*(f+1),b=v+1+c*(f+1),E=v+1+c*f;m.push(S,_,E),m.push(_,b,E)}this.setIndex(m),this.setAttribute("position",new qt(g,3)),this.setAttribute("normal",new qt(y,3)),this.setAttribute("uv",new qt(p,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new i(t.width,t.height,t.widthSegments,t.heightSegments)}};var Bo=class i extends oe{constructor(t=1,e=32,n=16,s=0,o=Math.PI*2,r=0,a=Math.PI){super(),this.type="SphereGeometry",this.parameters={radius:t,widthSegments:e,heightSegments:n,phiStart:s,phiLength:o,thetaStart:r,thetaLength:a},e=Math.max(3,Math.floor(e)),n=Math.max(2,Math.floor(n));let l=Math.min(r+a,Math.PI),c=0,h=[],d=new x,u=new x,m=[],g=[],y=[],p=[];for(let f=0;f<=n;f++){let v=[],S=f/n,_=r+S*a,b=t*Math.cos(_),E=Math.sqrt(t*t-b*b),A=0;f===0&&r===0?A=.5/e:f===n&&l===Math.PI&&(A=-.5/e);for(let M=0;M<=e;M++){let w=M/e,T=s+w*o;d.x=-E*Math.cos(T),d.y=b,d.z=E*Math.sin(T),g.push(d.x,d.y,d.z),u.copy(d).normalize(),y.push(u.x,u.y,u.z),p.push(w+A,1-S),v.push(c++)}h.push(v)}for(let f=0;f<n;f++)for(let v=0;v<e;v++){let S=h[f][v+1],_=h[f][v],b=h[f+1][v],E=h[f+1][v+1];(f!==0||r>0)&&m.push(S,_,E),(f!==n-1||l<Math.PI)&&m.push(_,b,E)}this.setIndex(m),this.setAttribute("position",new qt(g,3)),this.setAttribute("normal",new qt(y,3)),this.setAttribute("uv",new qt(p,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new i(t.radius,t.widthSegments,t.heightSegments,t.phiStart,t.phiLength,t.thetaStart,t.thetaLength)}};var Go=class i extends oe{constructor(t=1,e=.4,n=12,s=48,o=Math.PI*2,r=0,a=Math.PI*2){super(),this.type="TorusGeometry",this.parameters={radius:t,tube:e,radialSegments:n,tubularSegments:s,arc:o,thetaStart:r,thetaLength:a},n=Math.floor(n),s=Math.floor(s);let l=[],c=[],h=[],d=[],u=new x,m=new x,g=new x;for(let y=0;y<=n;y++){let p=r+y/n*a;for(let f=0;f<=s;f++){let v=f/s*o;m.x=(t+e*Math.cos(p))*Math.cos(v),m.y=(t+e*Math.cos(p))*Math.sin(v),m.z=e*Math.sin(p),c.push(m.x,m.y,m.z),u.x=t*Math.cos(v),u.y=t*Math.sin(v),g.subVectors(m,u).normalize(),h.push(g.x,g.y,g.z),d.push(f/s),d.push(y/n)}}for(let y=1;y<=n;y++)for(let p=1;p<=s;p++){let f=(s+1)*y+p-1,v=(s+1)*(y-1)+p-1,S=(s+1)*(y-1)+p,_=(s+1)*y+p;l.push(f,v,_),l.push(v,S,_)}this.setIndex(l),this.setAttribute("position",new qt(c,3)),this.setAttribute("normal",new qt(h,3)),this.setAttribute("uv",new qt(d,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new i(t.radius,t.tube,t.radialSegments,t.tubularSegments,t.arc,t.thetaStart,t.thetaLength)}};function Ms(i){let t={};for(let e in i){t[e]={};for(let n in i[e]){let s=i[e][n];if(mu(s))s.isRenderTargetTexture?(Wt("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),t[e][n]=null):t[e][n]=s.clone();else if(Array.isArray(s))if(mu(s[0])){let o=[];for(let r=0,a=s.length;r<a;r++)o[r]=s[r].clone();t[e][n]=o}else t[e][n]=s.slice();else t[e][n]=s}}return t}function yn(i){let t={};for(let e=0;e<i.length;e++){let n=Ms(i[e]);for(let s in n)t[s]=n[s]}return t}function mu(i){return i&&(i.isColor||i.isMatrix3||i.isMatrix4||i.isVector2||i.isVector3||i.isVector4||i.isTexture||i.isQuaternion)}function Lf(i){let t=[];for(let e=0;e<i.length;e++)t.push(i[e].clone());return t}function Gl(i){let t=i.getRenderTarget();return t===null?i.outputColorSpace:t.isXRRenderTarget===!0?t.texture.colorSpace:ce.workingColorSpace}var n0={clone:Ms,merge:yn},Nf=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,Hf=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`,Ue=class extends Yi{constructor(t){super(),this.isShaderMaterial=!0,this.type="ShaderMaterial",this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=Nf,this.fragmentShader=Hf,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,t!==void 0&&this.setValues(t)}copy(t){return super.copy(t),this.fragmentShader=t.fragmentShader,this.vertexShader=t.vertexShader,this.uniforms=Ms(t.uniforms),this.uniformsGroups=Lf(t.uniformsGroups),this.defines=Object.assign({},t.defines),this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.fog=t.fog,this.lights=t.lights,this.clipping=t.clipping,this.extensions=Object.assign({},t.extensions),this.glslVersion=t.glslVersion,this.defaultAttributeValues=Object.assign({},t.defaultAttributeValues),this.index0AttributeName=t.index0AttributeName,this.uniformsNeedUpdate=t.uniformsNeedUpdate,this}toJSON(t){let e=super.toJSON(t);e.glslVersion=this.glslVersion,e.uniforms={};for(let s in this.uniforms){let r=this.uniforms[s].value;r&&r.isTexture?e.uniforms[s]={type:"t",value:r.toJSON(t).uuid}:r&&r.isColor?e.uniforms[s]={type:"c",value:r.getHex()}:r&&r.isVector2?e.uniforms[s]={type:"v2",value:r.toArray()}:r&&r.isVector3?e.uniforms[s]={type:"v3",value:r.toArray()}:r&&r.isVector4?e.uniforms[s]={type:"v4",value:r.toArray()}:r&&r.isMatrix3?e.uniforms[s]={type:"m3",value:r.toArray()}:r&&r.isMatrix4?e.uniforms[s]={type:"m4",value:r.toArray()}:e.uniforms[s]={value:r}}Object.keys(this.defines).length>0&&(e.defines=this.defines),e.vertexShader=this.vertexShader,e.fragmentShader=this.fragmentShader,e.lights=this.lights,e.clipping=this.clipping;let n={};for(let s in this.extensions)this.extensions[s]===!0&&(n[s]=!0);return Object.keys(n).length>0&&(e.extensions=n),e}fromJSON(t,e){if(super.fromJSON(t,e),t.uniforms!==void 0)for(let n in t.uniforms){let s=t.uniforms[n];switch(this.uniforms[n]={},s.type){case"t":this.uniforms[n].value=e[s.value]||null;break;case"c":this.uniforms[n].value=new J().setHex(s.value);break;case"v2":this.uniforms[n].value=new Zt().fromArray(s.value);break;case"v3":this.uniforms[n].value=new x().fromArray(s.value);break;case"v4":this.uniforms[n].value=new _e().fromArray(s.value);break;case"m3":this.uniforms[n].value=new Jt().fromArray(s.value);break;case"m4":this.uniforms[n].value=new le().fromArray(s.value);break;default:this.uniforms[n].value=s.value}}if(t.defines!==void 0&&(this.defines=t.defines),t.vertexShader!==void 0&&(this.vertexShader=t.vertexShader),t.fragmentShader!==void 0&&(this.fragmentShader=t.fragmentShader),t.glslVersion!==void 0&&(this.glslVersion=t.glslVersion),t.extensions!==void 0)for(let n in t.extensions)this.extensions[n]=t.extensions[n];return t.lights!==void 0&&(this.lights=t.lights),t.clipping!==void 0&&(this.clipping=t.clipping),this}},aa=class extends Ue{constructor(t){super(t),this.isRawShaderMaterial=!0,this.type="RawShaderMaterial"}};var ca=class extends Yi{constructor(t){super(),this.isMeshDepthMaterial=!0,this.type="MeshDepthMaterial",this.depthPacking=Bu,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(t)}copy(t){return super.copy(t),this.depthPacking=t.depthPacking,this.map=t.map,this.alphaMap=t.alphaMap,this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this}},la=class extends Yi{constructor(t){super(),this.isMeshDistanceMaterial=!0,this.type="MeshDistanceMaterial",this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(t)}copy(t){return super.copy(t),this.map=t.map,this.alphaMap=t.alphaMap,this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this}};function Gs(i,t){return!i||i.constructor===t?i:typeof t.BYTES_PER_ELEMENT=="number"?new t(i):Array.prototype.slice.call(i)}function dl(i){return i!==void 0&&i.inTangents!==void 0&&i.outTangents!==void 0}var Zi=class{constructor(t,e,n,s){this.parameterPositions=t,this._cachedIndex=0,this.resultBuffer=s!==void 0?s:new e.constructor(n),this.sampleValues=e,this.valueSize=n,this.settings=null,this.DefaultSettings_={}}evaluate(t){let e=this.parameterPositions,n=this._cachedIndex,s=e[n],o=e[n-1];n:{t:{let r;e:{i:if(!(t<s)){for(let a=n+2;;){if(s===void 0){if(t<o)break i;return n=e.length,this._cachedIndex=n,this.copySampleValue_(n-1)}if(n===a)break;if(o=s,s=e[++n],t<s)break t}r=e.length;break e}if(!(t>=o)){let a=e[1];t<a&&(n=2,o=a);for(let l=n-2;;){if(o===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(n===l)break;if(s=o,o=e[--n-1],t>=o)break t}r=n,n=0;break e}break n}for(;n<r;){let a=n+r>>>1;t<e[a]?r=a:n=a+1}if(s=e[n],o=e[n-1],o===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(s===void 0)return n=e.length,this._cachedIndex=n,this.copySampleValue_(n-1)}this._cachedIndex=n,this.intervalChanged_(n,o,s)}return this.interpolate_(n,o,t,s)}getSettings_(){return this.settings||this.DefaultSettings_}copySampleValue_(t){let e=this.resultBuffer,n=this.sampleValues,s=this.valueSize,o=t*s;for(let r=0;r!==s;++r)e[r]=n[o+r];return e}interpolate_(){throw new Error("THREE.Interpolant: Call to abstract method.")}intervalChanged_(){}},ha=class extends Zi{constructor(t,e,n,s){super(t,e,n,s),this._weightPrev=-0,this._offsetPrev=-0,this._weightNext=-0,this._offsetNext=-0,this.DefaultSettings_={endingStart:pl,endingEnd:pl}}intervalChanged_(t,e,n){let s=this.parameterPositions,o=t-2,r=t+1,a=s[o],l=s[r];if(a===void 0)switch(this.getSettings_().endingStart){case ml:o=t,a=2*e-n;break;case gl:o=s.length-2,a=e+s[o]-s[o+1];break;default:o=t,a=n}if(l===void 0)switch(this.getSettings_().endingEnd){case ml:r=t,l=2*n-e;break;case gl:r=1,l=n+s[1]-s[0];break;default:r=t-1,l=e}let c=(n-e)*.5,h=this.valueSize;this._weightPrev=c/(e-a),this._weightNext=c/(l-n),this._offsetPrev=o*h,this._offsetNext=r*h}interpolate_(t,e,n,s){let o=this.resultBuffer,r=this.sampleValues,a=this.valueSize,l=t*a,c=l-a,h=this._offsetPrev,d=this._offsetNext,u=this._weightPrev,m=this._weightNext,g=(n-e)/(s-e),y=g*g,p=y*g,f=-u*p+2*u*y-u*g,v=(1+u)*p+(-1.5-2*u)*y+(-.5+u)*g+1,S=(-1-m)*p+(1.5+m)*y+.5*g,_=m*p-m*y;for(let b=0;b!==a;++b)o[b]=f*r[h+b]+v*r[c+b]+S*r[l+b]+_*r[d+b];return o}},ua=class extends Zi{constructor(t,e,n,s){super(t,e,n,s)}interpolate_(t,e,n,s){let o=this.resultBuffer,r=this.sampleValues,a=this.valueSize,l=t*a,c=l-a,h=(n-e)/(s-e),d=1-h;for(let u=0;u!==a;++u)o[u]=r[c+u]*d+r[l+u]*h;return o}},da=class extends Zi{constructor(t,e,n,s){super(t,e,n,s)}interpolate_(t){return this.copySampleValue_(t-1)}},fa=class extends Zi{interpolate_(t,e,n,s){let o=this.resultBuffer,r=this.sampleValues,a=this.valueSize,l=t*a,c=l-a,h=this.inTangents,d=this.outTangents;if(!h||!d){let g=(n-e)/(s-e),y=1-g;for(let p=0;p!==a;++p)o[p]=r[c+p]*y+r[l+p]*g;return o}let u=a*2,m=t-1;for(let g=0;g!==a;++g){let y=r[c+g],p=r[l+g],f=m*u+g*2,v=d[f],S=d[f+1],_=t*u+g*2,b=h[_],E=h[_+1],A=kf(n,e,v,b,s);o[g]=i0(A,y,S,E,p)}return o}};function i0(i,t,e,n,s){let o=1-i;return o*o*o*t+3*o*o*i*e+3*o*i*i*n+i*i*i*s}function Uf(i,t,e,n,s){let o=1-i;return 3*o*o*(e-t)+6*o*i*(n-e)+3*i*i*(s-n)}function kf(i,t,e,n,s){let o=(i-t)/(s-t);for(let r=0;r<8;r++){let a=i0(o,t,e,n,s)-i;if(Math.abs(a)<1e-10)break;let l=Uf(o,t,e,n,s);if(Math.abs(l)<1e-10)break;o=Math.max(0,Math.min(1,o-a/l))}return o}var Hn=class{constructor(t,e,n,s){if(t===void 0)throw new Error("THREE.KeyframeTrack: track name is undefined");if(e===void 0||e.length===0)throw new Error("THREE.KeyframeTrack: no keyframes in track named "+t);this.name=t,this.times=Gs(e,this.TimeBufferType),this.values=Gs(n,this.ValueBufferType),this.setInterpolation(s||this.DefaultInterpolation)}static toJSON(t){let e=t.constructor,n;if(e.toJSON!==this.toJSON)n=e.toJSON(t);else{n={name:t.name,times:Gs(t.times,Array),values:Gs(t.values,Array)};let s=t.getInterpolation();s!==t.DefaultInterpolation&&(n.interpolation=s),dl(t.settings)&&(n.settings={inTangents:Gs(t.settings.inTangents,Array),outTangents:Gs(t.settings.outTangents,Array)})}return n.type=t.ValueTypeName,n}InterpolantFactoryMethodDiscrete(t){return new da(this.times,this.values,this.getValueSize(),t)}InterpolantFactoryMethodLinear(t){return new ua(this.times,this.values,this.getValueSize(),t)}InterpolantFactoryMethodSmooth(t){return new ha(this.times,this.values,this.getValueSize(),t)}InterpolantFactoryMethodBezier(t){let e=new fa(this.times,this.values,this.getValueSize(),t);return this.settings&&(e.inTangents=this.settings.inTangents,e.outTangents=this.settings.outTangents),e}setInterpolation(t){let e;switch(t){case Po:e=this.InterpolantFactoryMethodDiscrete;break;case ta:e=this.InterpolantFactoryMethodLinear;break;case Gr:e=this.InterpolantFactoryMethodSmooth;break;case fl:e=this.InterpolantFactoryMethodBezier;break}if(e===void 0){let n="unsupported interpolation for "+this.ValueTypeName+" keyframe track named "+this.name;if(this.createInterpolant===void 0)if(t!==this.DefaultInterpolation)this.setInterpolation(this.DefaultInterpolation);else throw new Error(n);return Wt("KeyframeTrack:",n),this}return this.createInterpolant=e,this}getInterpolation(){switch(this.createInterpolant){case this.InterpolantFactoryMethodDiscrete:return Po;case this.InterpolantFactoryMethodLinear:return ta;case this.InterpolantFactoryMethodSmooth:return Gr;case this.InterpolantFactoryMethodBezier:return fl}}getValueSize(){return this.values.length/this.times.length}shift(t){if(t!==0){let e=this.times;for(let n=0,s=e.length;n!==s;++n)e[n]+=t}return this}scale(t){if(t!==1){let e=this.times;for(let n=0,s=e.length;n!==s;++n)e[n]*=t;dl(this.settings)&&(gu(this.settings.inTangents,t),gu(this.settings.outTangents,t))}return this}trim(t,e){let n=this.times,s=n.length,o=0,r=s-1;for(;o!==s&&n[o]<t;)++o;for(;r!==-1&&n[r]>e;)--r;if(++r,o!==0||r!==s){o>=r&&(r=Math.max(r,1),o=r-1);let a=this.getValueSize();this.times=n.slice(o,r),this.values=this.values.slice(o*a,r*a)}return this}validate(){let t=!0,e=this.getValueSize();e-Math.floor(e)!==0&&(Xt("KeyframeTrack: Invalid value size in track.",this),t=!1);let n=this.times,s=this.values,o=n.length;o===0&&(Xt("KeyframeTrack: Track is empty.",this),t=!1);let r=null;for(let a=0;a!==o;a++){let l=n[a];if(typeof l=="number"&&isNaN(l)){Xt("KeyframeTrack: Time is not a valid number.",this,a,l),t=!1;break}if(r!==null&&r>l){Xt("KeyframeTrack: Out of order keys.",this,a,l,r),t=!1;break}r=l}if(s!==void 0&&Kd(s))for(let a=0,l=s.length;a!==l;++a){let c=s[a];if(isNaN(c)){Xt("KeyframeTrack: Value is not a valid number.",this,a,c),t=!1;break}}return t}optimize(){let t=this.times.slice(),e=this.values.slice(),n=this.getValueSize(),s=this.getInterpolation()===Gr,o=t.length-1,r=1;for(let a=1;a<o;++a){let l=!1,c=t[a],h=t[a+1];if(c!==h&&(a!==1||c!==t[0]))if(s)l=!0;else{let d=a*n,u=d-n,m=d+n;for(let g=0;g!==n;++g){let y=e[d+g];if(y!==e[u+g]||y!==e[m+g]){l=!0;break}}}if(l){if(a!==r){t[r]=t[a];let d=a*n,u=r*n;for(let m=0;m!==n;++m)e[u+m]=e[d+m]}++r}}if(o>0){t[r]=t[o];for(let a=o*n,l=r*n,c=0;c!==n;++c)e[l+c]=e[a+c];++r}return r!==t.length?(this.times=t.slice(0,r),this.values=e.slice(0,r*n)):(this.times=t,this.values=e),this}clone(){let t=this.times.slice(),e=this.values.slice(),n=this.constructor,s=new n(this.name,t,e);return s.createInterpolant=this.createInterpolant,dl(this.settings)&&(s.settings={inTangents:this.settings.inTangents.slice(),outTangents:this.settings.outTangents.slice()}),s}};function gu(i,t){for(let e=0,n=i.length;e!==n;e+=2)i[e]*=t}Hn.prototype.ValueTypeName="";Hn.prototype.TimeBufferType=Float32Array;Hn.prototype.ValueBufferType=Float32Array;Hn.prototype.DefaultInterpolation=ta;var $i=class extends Hn{constructor(t,e,n){super(t,e,n)}};$i.prototype.ValueTypeName="bool";$i.prototype.ValueBufferType=Array;$i.prototype.DefaultInterpolation=Po;$i.prototype.InterpolantFactoryMethodLinear=void 0;$i.prototype.InterpolantFactoryMethodSmooth=void 0;var pa=class extends Hn{constructor(t,e,n,s){super(t,e,n,s)}};pa.prototype.ValueTypeName="color";var ma=class extends Hn{constructor(t,e,n,s){super(t,e,n,s)}};ma.prototype.ValueTypeName="number";var ga=class extends Zi{constructor(t,e,n,s){super(t,e,n,s)}interpolate_(t,e,n,s){let o=this.resultBuffer,r=this.sampleValues,a=this.valueSize,l=(n-e)/(s-e),c=t*a;for(let h=c+a;c!==h;c+=4)Ze.slerpFlat(o,0,r,c-a,r,c,l);return o}},Wo=class extends Hn{constructor(t,e,n,s){super(t,e,n,s)}InterpolantFactoryMethodLinear(t){return new ga(this.times,this.values,this.getValueSize(),t)}};Wo.prototype.ValueTypeName="quaternion";Wo.prototype.InterpolantFactoryMethodSmooth=void 0;var Ki=class extends Hn{constructor(t,e,n){super(t,e,n)}};Ki.prototype.ValueTypeName="string";Ki.prototype.ValueBufferType=Array;Ki.prototype.DefaultInterpolation=Po;Ki.prototype.InterpolantFactoryMethodLinear=void 0;Ki.prototype.InterpolantFactoryMethodSmooth=void 0;var xa=class extends Hn{constructor(t,e,n,s){super(t,e,n,s)}};xa.prototype.ValueTypeName="vector";var ya=class{constructor(t,e,n){let s=this,o=!1,r=0,a=0,l,c=[];this.onStart=void 0,this.onLoad=t,this.onProgress=e,this.onError=n,this._abortController=null,this.itemStart=function(h){a++,o===!1&&s.onStart!==void 0&&s.onStart(h,r,a),o=!0},this.itemEnd=function(h){r++,s.onProgress!==void 0&&s.onProgress(h,r,a),r===a&&(o=!1,s.onLoad!==void 0&&s.onLoad())},this.itemError=function(h){s.onError!==void 0&&s.onError(h)},this.resolveURL=function(h){return h=h.normalize("NFC"),l?l(h):h},this.setURLModifier=function(h){return l=h,this},this.addHandler=function(h,d){return c.push(h,d),this},this.removeHandler=function(h){let d=c.indexOf(h);return d!==-1&&c.splice(d,2),this},this.getHandler=function(h){for(let d=0,u=c.length;d<u;d+=2){let m=c[d],g=c[d+1];if(m.global&&(m.lastIndex=0),m.test(h))return g}return null},this.abort=function(){return this.abortController.abort(),this._abortController=null,this}}get abortController(){return this._abortController||(this._abortController=new AbortController),this._abortController}},s0=new ya,va=class{constructor(t){this.manager=t!==void 0?t:s0,this.crossOrigin="anonymous",this.withCredentials=!1,this.path="",this.resourcePath="",this.requestHeader={},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}load(){}loadAsync(t,e){let n=this;return new Promise(function(s,o){n.load(t,s,e,o)})}parse(){}setCrossOrigin(t){return this.crossOrigin=t,this}setWithCredentials(t){return this.withCredentials=t,this}setPath(t){return this.path=t,this}setResourcePath(t){return this.resourcePath=t,this}setRequestHeader(t){return this.requestHeader=t,this}abort(){return this}};va.DEFAULT_MATERIAL_NAME="__DEFAULT";var Vr=new x,Br=new Ze,ai=new x,Xo=class extends Ln{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new le,this.projectionMatrix=new le,this.projectionMatrixInverse=new le,this.coordinateSystem=Jn,this._reversedDepth=!1}get reversedDepth(){return this._reversedDepth}copy(t,e){return super.copy(t,e),this.matrixWorldInverse.copy(t.matrixWorldInverse),this.projectionMatrix.copy(t.projectionMatrix),this.projectionMatrixInverse.copy(t.projectionMatrixInverse),this.coordinateSystem=t.coordinateSystem,this}getWorldDirection(t){return super.getWorldDirection(t).negate()}updateMatrixWorld(t){super.updateMatrixWorld(t),this.matrixWorld.decompose(Vr,Br,ai),ai.x===1&&ai.y===1&&ai.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(Vr,Br,ai.set(1,1,1)).invert()}updateWorldMatrix(t,e,n=!1){super.updateWorldMatrix(t,e,n),this.matrixWorld.decompose(Vr,Br,ai),ai.x===1&&ai.y===1&&ai.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(Vr,Br,ai.set(1,1,1)).invert()}clone(){return new this.constructor().copy(this)}},Xi=new x,xu=new Zt,yu=new Zt,nn=class extends Xo{constructor(t=50,e=1,n=.1,s=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=t,this.zoom=1,this.near=n,this.far=s,this.focus=10,this.aspect=e,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(t,e){return super.copy(t,e),this.fov=t.fov,this.zoom=t.zoom,this.near=t.near,this.far=t.far,this.focus=t.focus,this.aspect=t.aspect,this.view=t.view===null?null:Object.assign({},t.view),this.filmGauge=t.filmGauge,this.filmOffset=t.filmOffset,this}setFocalLength(t){let e=.5*this.getFilmHeight()/t;this.fov=Ks*2*Math.atan(e),this.updateProjectionMatrix()}getFocalLength(){let t=Math.tan(Ao*.5*this.fov);return .5*this.getFilmHeight()/t}getEffectiveFOV(){return Ks*2*Math.atan(Math.tan(Ao*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(t,e,n){Xi.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),e.set(Xi.x,Xi.y).multiplyScalar(-t/Xi.z),Xi.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),n.set(Xi.x,Xi.y).multiplyScalar(-t/Xi.z)}getViewSize(t,e){return this.getViewBounds(t,xu,yu),e.subVectors(yu,xu)}setViewOffset(t,e,n,s,o,r){this.aspect=t/e,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=t,this.view.fullHeight=e,this.view.offsetX=n,this.view.offsetY=s,this.view.width=o,this.view.height=r,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let t=this.near,e=t*Math.tan(Ao*.5*this.fov)/this.zoom,n=2*e,s=this.aspect*n,o=-.5*s,r=this.view;if(this.view!==null&&this.view.enabled){let l=r.fullWidth,c=r.fullHeight;o+=r.offsetX*s/l,e-=r.offsetY*n/c,s*=r.width/l,n*=r.height/c}let a=this.filmOffset;a!==0&&(o+=t*a/this.getFilmWidth()),this.projectionMatrix.makePerspective(o,o+s,e,e-n,t,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(t){let e=super.toJSON(t);return e.object.fov=this.fov,e.object.zoom=this.zoom,e.object.near=this.near,e.object.far=this.far,e.object.focus=this.focus,e.object.aspect=this.aspect,this.view!==null&&(e.object.view=Object.assign({},this.view)),e.object.filmGauge=this.filmGauge,e.object.filmOffset=this.filmOffset,e}};var Ji=class extends Xo{constructor(t=-1,e=1,n=1,s=-1,o=.1,r=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=t,this.right=e,this.top=n,this.bottom=s,this.near=o,this.far=r,this.updateProjectionMatrix()}copy(t,e){return super.copy(t,e),this.left=t.left,this.right=t.right,this.top=t.top,this.bottom=t.bottom,this.near=t.near,this.far=t.far,this.zoom=t.zoom,this.view=t.view===null?null:Object.assign({},t.view),this}setViewOffset(t,e,n,s,o,r){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=t,this.view.fullHeight=e,this.view.offsetX=n,this.view.offsetY=s,this.view.width=o,this.view.height=r,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let t=(this.right-this.left)/(2*this.zoom),e=(this.top-this.bottom)/(2*this.zoom),n=(this.right+this.left)/2,s=(this.top+this.bottom)/2,o=n-t,r=n+t,a=s+e,l=s-e;if(this.view!==null&&this.view.enabled){let c=(this.right-this.left)/this.view.fullWidth/this.zoom,h=(this.top-this.bottom)/this.view.fullHeight/this.zoom;o+=c*this.view.offsetX,r=o+c*this.view.width,a-=h*this.view.offsetY,l=a-h*this.view.height}this.projectionMatrix.makeOrthographic(o,r,a,l,this.near,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(t){let e=super.toJSON(t);return e.object.zoom=this.zoom,e.object.left=this.left,e.object.right=this.right,e.object.top=this.top,e.object.bottom=this.bottom,e.object.near=this.near,e.object.far=this.far,this.view!==null&&(e.object.view=Object.assign({},this.view)),e}};var Ws=-90,Xs=1,_a=class extends Ln{constructor(t,e,n){super(),this.type="CubeCamera",this.renderTarget=n,this.coordinateSystem=null,this.activeMipmapLevel=0;let s=new nn(Ws,Xs,t,e);s.layers=this.layers,this.add(s);let o=new nn(Ws,Xs,t,e);o.layers=this.layers,this.add(o);let r=new nn(Ws,Xs,t,e);r.layers=this.layers,this.add(r);let a=new nn(Ws,Xs,t,e);a.layers=this.layers,this.add(a);let l=new nn(Ws,Xs,t,e);l.layers=this.layers,this.add(l);let c=new nn(Ws,Xs,t,e);c.layers=this.layers,this.add(c)}updateCoordinateSystem(){let t=this.coordinateSystem,e=this.children.concat(),[n,s,o,r,a,l]=e;for(let c of e)this.remove(c);if(t===Jn)n.up.set(0,1,0),n.lookAt(1,0,0),s.up.set(0,1,0),s.lookAt(-1,0,0),o.up.set(0,0,-1),o.lookAt(0,1,0),r.up.set(0,0,1),r.lookAt(0,-1,0),a.up.set(0,1,0),a.lookAt(0,0,1),l.up.set(0,1,0),l.lookAt(0,0,-1);else if(t===Do)n.up.set(0,-1,0),n.lookAt(-1,0,0),s.up.set(0,-1,0),s.lookAt(1,0,0),o.up.set(0,0,1),o.lookAt(0,1,0),r.up.set(0,0,-1),r.lookAt(0,-1,0),a.up.set(0,-1,0),a.lookAt(0,0,1),l.up.set(0,-1,0),l.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+t);for(let c of e)this.add(c),c.updateMatrixWorld()}update(t,e){this.parent===null&&this.updateMatrixWorld();let{renderTarget:n,activeMipmapLevel:s}=this;this.coordinateSystem!==t.coordinateSystem&&(this.coordinateSystem=t.coordinateSystem,this.updateCoordinateSystem());let[o,r,a,l,c,h]=this.children,d=t.getRenderTarget(),u=t.getActiveCubeFace(),m=t.getActiveMipmapLevel(),g=t.xr.enabled;t.xr.enabled=!1;let y=n.texture.generateMipmaps;n.texture.generateMipmaps=!1;let p=!1;t.isWebGLRenderer===!0?p=t.state.buffers.depth.getReversed():p=t.reversedDepthBuffer,t.setRenderTarget(n,0,s),p&&t.autoClear===!1&&t.clearDepth(),t.render(e,o),t.setRenderTarget(n,1,s),p&&t.autoClear===!1&&t.clearDepth(),t.render(e,r),t.setRenderTarget(n,2,s),p&&t.autoClear===!1&&t.clearDepth(),t.render(e,a),t.setRenderTarget(n,3,s),p&&t.autoClear===!1&&t.clearDepth(),t.render(e,l),t.setRenderTarget(n,4,s),p&&t.autoClear===!1&&t.clearDepth(),t.render(e,c),n.texture.generateMipmaps=y,t.setRenderTarget(n,5,s),p&&t.autoClear===!1&&t.clearDepth(),t.render(e,h),t.setRenderTarget(d,u,m),t.xr.enabled=g,n.texture.needsPMREMUpdate=!0}},Ma=class extends nn{constructor(t=[]){super(),this.isArrayCamera=!0,this.isMultiViewCamera=!1,this.cameras=t}};var Wl="\\[\\]\\.:\\/",Ff=new RegExp("["+Wl+"]","g"),Xl="[^"+Wl+"]",zf="[^"+Wl.replace("\\.","")+"]",Of=/((?:WC+[\/:])*)/.source.replace("WC",Xl),Vf=/(WCOD+)?/.source.replace("WCOD",zf),Bf=/(?:\.(WC+)(?:\[(.+)\])?)?/.source.replace("WC",Xl),Gf=/\.(WC+)(?:\[(.+)\])?/.source.replace("WC",Xl),Wf=new RegExp("^"+Of+Vf+Bf+Gf+"$"),Xf=["material","materials","bones","map"],yl=class{constructor(t,e,n){let s=n||Oe.parseTrackName(e);this._targetGroup=t,this._bindings=t.subscribe_(e,s)}getValue(t,e){this.bind();let n=this._targetGroup.nCachedObjects_,s=this._bindings[n];s!==void 0&&s.getValue(t,e)}setValue(t,e){let n=this._bindings;for(let s=this._targetGroup.nCachedObjects_,o=n.length;s!==o;++s)n[s].setValue(t,e)}bind(){let t=this._bindings;for(let e=this._targetGroup.nCachedObjects_,n=t.length;e!==n;++e)t[e].bind()}unbind(){let t=this._bindings;for(let e=this._targetGroup.nCachedObjects_,n=t.length;e!==n;++e)t[e].unbind()}},Oe=class i{constructor(t,e,n){this.path=e,this.parsedPath=n||i.parseTrackName(e),this.node=i.findNode(t,this.parsedPath.nodeName),this.rootNode=t,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}static create(t,e,n){return t&&t.isAnimationObjectGroup?new i.Composite(t,e,n):new i(t,e,n)}static sanitizeNodeName(t){return t.replace(/\s/g,"_").replace(Ff,"")}static parseTrackName(t){let e=Wf.exec(t);if(e===null)throw new Error("THREE.PropertyBinding: Cannot parse trackName: "+t);let n={nodeName:e[2],objectName:e[3],objectIndex:e[4],propertyName:e[5],propertyIndex:e[6]},s=n.nodeName&&n.nodeName.lastIndexOf(".");if(s!==void 0&&s!==-1){let o=n.nodeName.substring(s+1);Xf.indexOf(o)!==-1&&(n.nodeName=n.nodeName.substring(0,s),n.objectName=o)}if(n.propertyName===null||n.propertyName.length===0)throw new Error("THREE.PropertyBinding: can not parse propertyName from trackName: "+t);return n}static findNode(t,e){if(e===void 0||e===""||e==="."||e===-1||e===t.name||e===t.uuid)return t;if(t.skeleton){let n=t.skeleton.getBoneByName(e);if(n!==void 0)return n}if(t.children){let n=function(o){for(let r=0;r<o.length;r++){let a=o[r];if(a.name===e||a.uuid===e)return a;let l=n(a.children);if(l)return l}return null},s=n(t.children);if(s)return s}return null}_getValue_unavailable(){}_setValue_unavailable(){}_getValue_direct(t,e){t[e]=this.targetObject[this.propertyName]}_getValue_array(t,e){let n=this.resolvedProperty;for(let s=0,o=n.length;s!==o;++s)t[e++]=n[s]}_getValue_arrayElement(t,e){t[e]=this.resolvedProperty[this.propertyIndex]}_getValue_toArray(t,e){this.resolvedProperty.toArray(t,e)}_setValue_direct(t,e){this.targetObject[this.propertyName]=t[e]}_setValue_direct_setNeedsUpdate(t,e){this.targetObject[this.propertyName]=t[e],this.targetObject.needsUpdate=!0}_setValue_direct_setMatrixWorldNeedsUpdate(t,e){this.targetObject[this.propertyName]=t[e],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_array(t,e){let n=this.resolvedProperty;for(let s=0,o=n.length;s!==o;++s)n[s]=t[e++]}_setValue_array_setNeedsUpdate(t,e){let n=this.resolvedProperty;for(let s=0,o=n.length;s!==o;++s)n[s]=t[e++];this.targetObject.needsUpdate=!0}_setValue_array_setMatrixWorldNeedsUpdate(t,e){let n=this.resolvedProperty;for(let s=0,o=n.length;s!==o;++s)n[s]=t[e++];this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_arrayElement(t,e){this.resolvedProperty[this.propertyIndex]=t[e]}_setValue_arrayElement_setNeedsUpdate(t,e){this.resolvedProperty[this.propertyIndex]=t[e],this.targetObject.needsUpdate=!0}_setValue_arrayElement_setMatrixWorldNeedsUpdate(t,e){this.resolvedProperty[this.propertyIndex]=t[e],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_fromArray(t,e){this.resolvedProperty.fromArray(t,e)}_setValue_fromArray_setNeedsUpdate(t,e){this.resolvedProperty.fromArray(t,e),this.targetObject.needsUpdate=!0}_setValue_fromArray_setMatrixWorldNeedsUpdate(t,e){this.resolvedProperty.fromArray(t,e),this.targetObject.matrixWorldNeedsUpdate=!0}_getValue_unbound(t,e){this.bind(),this.getValue(t,e)}_setValue_unbound(t,e){this.bind(),this.setValue(t,e)}bind(){let t=this.node,e=this.parsedPath,n=e.objectName,s=e.propertyName,o=e.propertyIndex;if(t||(t=i.findNode(this.rootNode,e.nodeName),this.node=t),this.getValue=this._getValue_unavailable,this.setValue=this._setValue_unavailable,!t){Wt("PropertyBinding: No target node found for track: "+this.path+".");return}if(n){let c=e.objectIndex;switch(n){case"materials":if(!t.material){Xt("PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!t.material.materials){Xt("PropertyBinding: Can not bind to material.materials as node.material does not have a materials array.",this);return}t=t.material.materials;break;case"bones":if(!t.skeleton){Xt("PropertyBinding: Can not bind to bones as node does not have a skeleton.",this);return}t=t.skeleton.bones;for(let h=0;h<t.length;h++)if(t[h].name===c){c=h;break}break;case"map":if("map"in t){t=t.map;break}if(!t.material){Xt("PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!t.material.map){Xt("PropertyBinding: Can not bind to material.map as node.material does not have a map.",this);return}t=t.material.map;break;default:if(t[n]===void 0){Xt("PropertyBinding: Can not bind to objectName of node undefined.",this);return}t=t[n]}if(c!==void 0){if(t[c]===void 0){Xt("PropertyBinding: Trying to bind to objectIndex of objectName, but is undefined.",this,t);return}t=t[c]}}let r=t[s];if(r===void 0){let c=e.nodeName;Xt("PropertyBinding: Trying to update property for track: "+c+"."+s+" but it wasn't found.",t);return}let a=this.Versioning.None;this.targetObject=t,t.isMaterial===!0?a=this.Versioning.NeedsUpdate:t.isObject3D===!0&&(a=this.Versioning.MatrixWorldNeedsUpdate);let l=this.BindingType.Direct;if(o!==void 0){if(s==="morphTargetInfluences"){if(!t.geometry){Xt("PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.",this);return}if(!t.geometry.morphAttributes){Xt("PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.morphAttributes.",this);return}t.morphTargetDictionary[o]!==void 0&&(o=t.morphTargetDictionary[o])}l=this.BindingType.ArrayElement,this.resolvedProperty=r,this.propertyIndex=o}else r.fromArray!==void 0&&r.toArray!==void 0?(l=this.BindingType.HasFromToArray,this.resolvedProperty=r):Array.isArray(r)?(l=this.BindingType.EntireArray,this.resolvedProperty=r):this.propertyName=s;this.getValue=this.GetterByBindingType[l],this.setValue=this.SetterByBindingTypeAndVersioning[l][a]}unbind(){this.node=null,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}};Oe.Composite=yl;Oe.prototype.BindingType={Direct:0,EntireArray:1,ArrayElement:2,HasFromToArray:3};Oe.prototype.Versioning={None:0,NeedsUpdate:1,MatrixWorldNeedsUpdate:2};Oe.prototype.GetterByBindingType=[Oe.prototype._getValue_direct,Oe.prototype._getValue_array,Oe.prototype._getValue_arrayElement,Oe.prototype._getValue_toArray];Oe.prototype.SetterByBindingTypeAndVersioning=[[Oe.prototype._setValue_direct,Oe.prototype._setValue_direct_setNeedsUpdate,Oe.prototype._setValue_direct_setMatrixWorldNeedsUpdate],[Oe.prototype._setValue_array,Oe.prototype._setValue_array_setNeedsUpdate,Oe.prototype._setValue_array_setMatrixWorldNeedsUpdate],[Oe.prototype._setValue_arrayElement,Oe.prototype._setValue_arrayElement_setNeedsUpdate,Oe.prototype._setValue_arrayElement_setMatrixWorldNeedsUpdate],[Oe.prototype._setValue_fromArray,Oe.prototype._setValue_fromArray_setNeedsUpdate,Oe.prototype._setValue_fromArray_setMatrixWorldNeedsUpdate]];var Wy=new Float32Array(1);var vu=new le,qo=class{constructor(t,e,n=0,s=1/0){this.ray=new to(t,e),this.near=n,this.far=s,this.camera=null,this.layers=new js,this.params={Mesh:{},Line:{threshold:1},LOD:{},Points:{threshold:1},Sprite:{}}}set(t,e){this.ray.set(t,e)}setFromCamera(t,e){e.isPerspectiveCamera?(this.ray.origin.setFromMatrixPosition(e.matrixWorld),this.ray.direction.set(t.x,t.y,.5).unproject(e).sub(this.ray.origin).normalize(),this.camera=e):e.isOrthographicCamera?(this.ray.origin.set(t.x,t.y,e.projectionMatrix.elements[14]).unproject(e),this.ray.direction.set(0,0,-1).transformDirection(e.matrixWorld),this.camera=e):Xt("Raycaster: Unsupported camera type: "+e.type)}setFromXRController(t){return vu.identity().extractRotation(t.matrixWorld),this.ray.origin.setFromMatrixPosition(t.matrixWorld),this.ray.direction.set(0,0,-1).applyMatrix4(vu),this}intersectObject(t,e=!0,n=[]){return vl(t,this,n,e),n.sort(_u),n}intersectObjects(t,e=!0,n=[]){for(let s=0,o=t.length;s<o;s++)vl(t[s],this,n,e);return n.sort(_u),n}};function _u(i,t){return i.distance-t.distance}function vl(i,t,e,n){let s=!0;if(i.layers.test(t.layers)&&i.raycast(t,e)===!1&&(s=!1),s===!0&&n===!0){let o=i.children;for(let r=0,a=o.length;r<a;r++)vl(o[r],t,e,!0)}}var Jl=class Jl{constructor(t,e,n,s){this.elements=[1,0,0,1],t!==void 0&&this.set(t,e,n,s)}identity(){return this.set(1,0,0,1),this}fromArray(t,e=0){for(let n=0;n<4;n++)this.elements[n]=t[n+e];return this}set(t,e,n,s){let o=this.elements;return o[0]=t,o[2]=e,o[1]=n,o[3]=s,this}};Jl.prototype.isMatrix2=!0;var _l=Jl;function ql(i,t,e,n){let s=qf(n);switch(e){case kl:return i*t;case Ia:return i*t/s.components*s.byteLength;case Da:return i*t/s.components*s.byteLength;case ns:return i*t*2/s.components*s.byteLength;case La:return i*t*2/s.components*s.byteLength;case Fl:return i*t*3/s.components*s.byteLength;case Bn:return i*t*4/s.components*s.byteLength;case Na:return i*t*4/s.components*s.byteLength;case Jo:case jo:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*8;case Qo:case tr:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*16;case Ua:case Fa:return Math.max(i,16)*Math.max(t,8)/4;case Ha:case ka:return Math.max(i,8)*Math.max(t,8)/2;case za:case Oa:case Ba:case Ga:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*8;case Va:case er:case Wa:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*16;case Xa:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*16;case qa:return Math.floor((i+4)/5)*Math.floor((t+3)/4)*16;case Ya:return Math.floor((i+4)/5)*Math.floor((t+4)/5)*16;case Za:return Math.floor((i+5)/6)*Math.floor((t+4)/5)*16;case $a:return Math.floor((i+5)/6)*Math.floor((t+5)/6)*16;case Ka:return Math.floor((i+7)/8)*Math.floor((t+4)/5)*16;case Ja:return Math.floor((i+7)/8)*Math.floor((t+5)/6)*16;case ja:return Math.floor((i+7)/8)*Math.floor((t+7)/8)*16;case Qa:return Math.floor((i+9)/10)*Math.floor((t+4)/5)*16;case tc:return Math.floor((i+9)/10)*Math.floor((t+5)/6)*16;case ec:return Math.floor((i+9)/10)*Math.floor((t+7)/8)*16;case nc:return Math.floor((i+9)/10)*Math.floor((t+9)/10)*16;case ic:return Math.floor((i+11)/12)*Math.floor((t+9)/10)*16;case sc:return Math.floor((i+11)/12)*Math.floor((t+11)/12)*16;case oc:case rc:case ac:return Math.ceil(i/4)*Math.ceil(t/4)*16;case cc:case lc:return Math.ceil(i/4)*Math.ceil(t/4)*8;case nr:case hc:return Math.ceil(i/4)*Math.ceil(t/4)*16}throw new Error(`Unable to determine texture byte length for ${e} format.`)}function qf(i){switch(i){case En:case Ll:return{byteLength:1,components:1};case oo:case Nl:case ei:return{byteLength:2,components:1};case Ca:case Pa:return{byteLength:2,components:4};case Un:case Aa:case Vn:return{byteLength:4,components:1};case Hl:case Ul:return{byteLength:4,components:3}}throw new Error(`THREE.TextureUtils: Unknown texture type ${i}.`)}typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:"186"}}));typeof window<"u"&&(window.__THREE__?Wt("WARNING: Multiple instances of Three.js being imported."):window.__THREE__="186");function T0(){let i=null,t=!1,e=null,n=null;function s(o,r){n=i.requestAnimationFrame(s),e(o,r)}return{start:function(){t!==!0&&e!==null&&i!==null&&(n=i.requestAnimationFrame(s),t=!0)},stop:function(){i!==null&&i.cancelAnimationFrame(n),t=!1},setAnimationLoop:function(o){e=o},setContext:function(o){i=o}}}function Jf(i){let t=new WeakMap;function e(a,l){let c=a.array,h=a.usage,d=c.byteLength,u=i.createBuffer();i.bindBuffer(l,u),i.bufferData(l,c,h),a.onUploadCallback();let m;if(c instanceof Float32Array)m=i.FLOAT;else if(typeof Float16Array<"u"&&c instanceof Float16Array)m=i.HALF_FLOAT;else if(c instanceof Uint16Array)a.isFloat16BufferAttribute?m=i.HALF_FLOAT:m=i.UNSIGNED_SHORT;else if(c instanceof Int16Array)m=i.SHORT;else if(c instanceof Uint32Array)m=i.UNSIGNED_INT;else if(c instanceof Int32Array)m=i.INT;else if(c instanceof Int8Array)m=i.BYTE;else if(c instanceof Uint8Array)m=i.UNSIGNED_BYTE;else if(c instanceof Uint8ClampedArray)m=i.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+c);return{buffer:u,type:m,bytesPerElement:c.BYTES_PER_ELEMENT,version:a.version,size:d}}function n(a,l,c){let h=l.array,d=l.updateRanges;if(i.bindBuffer(c,a),d.length===0)i.bufferSubData(c,0,h);else{d.sort((m,g)=>m.start-g.start);let u=0;for(let m=1;m<d.length;m++){let g=d[u],y=d[m];y.start<=g.start+g.count+1?g.count=Math.max(g.count,y.start+y.count-g.start):(++u,d[u]=y)}d.length=u+1;for(let m=0,g=d.length;m<g;m++){let y=d[m];i.bufferSubData(c,y.start*h.BYTES_PER_ELEMENT,h,y.start,y.count)}l.clearUpdateRanges()}l.onUploadCallback()}function s(a){return a.isInterleavedBufferAttribute&&(a=a.data),t.get(a)}function o(a){a.isInterleavedBufferAttribute&&(a=a.data);let l=t.get(a);l&&(i.deleteBuffer(l.buffer),t.delete(a))}function r(a,l){if(a.isInterleavedBufferAttribute&&(a=a.data),a.isGLBufferAttribute){let h=t.get(a);(!h||h.version<a.version)&&t.set(a,{buffer:a.buffer,type:a.type,bytesPerElement:a.elementSize,version:a.version});return}let c=t.get(a);if(c===void 0)t.set(a,e(a,l));else if(c.version<a.version){if(c.size!==a.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");n(c.buffer,a,l),c.version=a.version}}return{get:s,remove:o,update:r}}var jf=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,Qf=`#ifdef USE_ALPHAHASH
	const float ALPHA_HASH_SCALE = 0.05;
	float hash2D( vec2 value ) {
		return fract( 1.0e4 * sin( 17.0 * value.x + 0.1 * value.y ) * ( 0.1 + abs( sin( 13.0 * value.y + value.x ) ) ) );
	}
	float hash3D( vec3 value ) {
		return hash2D( vec2( hash2D( value.xy ), value.z ) );
	}
	float getAlphaHashThreshold( vec3 position ) {
		float maxDeriv = max(
			length( dFdx( position.xyz ) ),
			length( dFdy( position.xyz ) )
		);
		float pixScale = 1.0 / ( ALPHA_HASH_SCALE * maxDeriv );
		vec2 pixScales = vec2(
			exp2( floor( log2( pixScale ) ) ),
			exp2( ceil( log2( pixScale ) ) )
		);
		vec2 alpha = vec2(
			hash3D( floor( pixScales.x * position.xyz ) ),
			hash3D( floor( pixScales.y * position.xyz ) )
		);
		float lerpFactor = fract( log2( pixScale ) );
		float x = ( 1.0 - lerpFactor ) * alpha.x + lerpFactor * alpha.y;
		float a = min( lerpFactor, 1.0 - lerpFactor );
		vec3 cases = vec3(
			x * x / ( 2.0 * a * ( 1.0 - a ) ),
			( x - 0.5 * a ) / ( 1.0 - a ),
			1.0 - ( ( 1.0 - x ) * ( 1.0 - x ) / ( 2.0 * a * ( 1.0 - a ) ) )
		);
		float threshold = ( x < ( 1.0 - a ) )
			? ( ( x < a ) ? cases.x : cases.y )
			: cases.z;
		return clamp( threshold , 1.0e-6, 1.0 );
	}
#endif`,tp=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,ep=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,np=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,ip=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,sp=`#ifdef USE_AOMAP
	float ambientOcclusion = ( texture2D( aoMap, vAoMapUv ).r - 1.0 ) * aoMapIntensity + 1.0;
	reflectedLight.indirectDiffuse *= ambientOcclusion;
	#if defined( USE_CLEARCOAT ) 
		clearcoatSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_SHEEN ) 
		sheenSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD )
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );
	#endif
#endif`,op=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,rp=`#ifdef USE_BATCHING
	#if ! defined( GL_ANGLE_multi_draw )
	#define gl_DrawID _gl_DrawID
	uniform int _gl_DrawID;
	#endif
	uniform highp sampler2D batchingTexture;
	uniform highp usampler2D batchingIdTexture;
	mat4 getBatchingMatrix( const in float i ) {
		int size = textureSize( batchingTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( batchingTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( batchingTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( batchingTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( batchingTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
	float getIndirectIndex( const in int i ) {
		int size = textureSize( batchingIdTexture, 0 ).x;
		int x = i % size;
		int y = i / size;
		return float( texelFetch( batchingIdTexture, ivec2( x, y ), 0 ).r );
	}
#endif
#ifdef USE_BATCHING_COLOR
	uniform sampler2D batchingColorTexture;
	vec4 getBatchingColor( const in float i ) {
		int size = textureSize( batchingColorTexture, 0 ).x;
		int j = int( i );
		int x = j % size;
		int y = j / size;
		return texelFetch( batchingColorTexture, ivec2( x, y ), 0 );
	}
#endif`,ap=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,cp=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,lp=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,hp=`float G_BlinnPhong_Implicit( ) {
	return 0.25;
}
float D_BlinnPhong( const in float shininess, const in float dotNH ) {
	return RECIPROCAL_PI * ( shininess * 0.5 + 1.0 ) * pow( dotNH, shininess );
}
vec3 BRDF_BlinnPhong( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 specularColor, const in float shininess ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( specularColor, 1.0, dotVH );
	float G = G_BlinnPhong_Implicit( );
	float D = D_BlinnPhong( shininess, dotNH );
	return F * ( G * D );
} // validated`,up=`#ifdef USE_IRIDESCENCE
	const mat3 XYZ_TO_REC709 = mat3(
		 3.2404542, -0.9692660,  0.0556434,
		-1.5371385,  1.8760108, -0.2040259,
		-0.4985314,  0.0415560,  1.0572252
	);
	vec3 Fresnel0ToIor( vec3 fresnel0 ) {
		vec3 sqrtF0 = sqrt( fresnel0 );
		return ( vec3( 1.0 ) + sqrtF0 ) / ( vec3( 1.0 ) - sqrtF0 );
	}
	vec3 IorToFresnel0( vec3 transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - vec3( incidentIor ) ) / ( transmittedIor + vec3( incidentIor ) ) );
	}
	float IorToFresnel0( float transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - incidentIor ) / ( transmittedIor + incidentIor ));
	}
	vec3 evalSensitivity( float OPD, vec3 shift ) {
		float phase = 2.0 * PI * OPD * 1.0e-9;
		vec3 val = vec3( 5.4856e-13, 4.4201e-13, 5.2481e-13 );
		vec3 pos = vec3( 1.6810e+06, 1.7953e+06, 2.2084e+06 );
		vec3 var = vec3( 4.3278e+09, 9.3046e+09, 6.6121e+09 );
		vec3 xyz = val * sqrt( 2.0 * PI * var ) * cos( pos * phase + shift ) * exp( - pow2( phase ) * var );
		xyz.x += 9.7470e-14 * sqrt( 2.0 * PI * 4.5282e+09 ) * cos( 2.2399e+06 * phase + shift[ 0 ] ) * exp( - 4.5282e+09 * pow2( phase ) );
		xyz /= 1.0685e-7;
		vec3 rgb = XYZ_TO_REC709 * xyz;
		return rgb;
	}
	vec3 evalIridescence( float outsideIOR, float eta2, float cosTheta1, float thinFilmThickness, vec3 baseF0 ) {
		vec3 I;
		float iridescenceIOR = mix( outsideIOR, eta2, smoothstep( 0.0, 0.03, thinFilmThickness ) );
		float sinTheta2Sq = pow2( outsideIOR / iridescenceIOR ) * ( 1.0 - pow2( cosTheta1 ) );
		float cosTheta2Sq = 1.0 - sinTheta2Sq;
		if ( cosTheta2Sq < 0.0 ) {
			return vec3( 1.0 );
		}
		float cosTheta2 = sqrt( cosTheta2Sq );
		float R0 = IorToFresnel0( iridescenceIOR, outsideIOR );
		float R12 = F_Schlick( R0, 1.0, cosTheta1 );
		float T121 = 1.0 - R12;
		float phi12 = 0.0;
		if ( iridescenceIOR < outsideIOR ) phi12 = PI;
		float phi21 = PI - phi12;
		vec3 baseIOR = Fresnel0ToIor( clamp( baseF0, 0.0, 0.9999 ) );		vec3 R1 = IorToFresnel0( baseIOR, iridescenceIOR );
		vec3 R23 = F_Schlick( R1, 1.0, cosTheta2 );
		vec3 phi23 = vec3( 0.0 );
		if ( baseIOR[ 0 ] < iridescenceIOR ) phi23[ 0 ] = PI;
		if ( baseIOR[ 1 ] < iridescenceIOR ) phi23[ 1 ] = PI;
		if ( baseIOR[ 2 ] < iridescenceIOR ) phi23[ 2 ] = PI;
		float OPD = 2.0 * iridescenceIOR * thinFilmThickness * cosTheta2;
		vec3 phi = vec3( phi21 ) + phi23;
		vec3 R123 = clamp( R12 * R23, 1e-5, 0.9999 );
		vec3 r123 = sqrt( R123 );
		vec3 Rs = pow2( T121 ) * R23 / ( vec3( 1.0 ) - R123 );
		vec3 C0 = R12 + Rs;
		I = C0;
		vec3 Cm = Rs - T121;
		for ( int m = 1; m <= 2; ++ m ) {
			Cm *= r123;
			vec3 Sm = 2.0 * evalSensitivity( float( m ) * OPD, float( m ) * phi );
			I += Cm * Sm;
		}
		return max( I, vec3( 0.0 ) );
	}
#endif`,dp=`#ifdef USE_BUMPMAP
	uniform sampler2D bumpMap;
	uniform float bumpScale;
	vec2 dHdxy_fwd() {
		vec2 dSTdx = dFdx( vBumpMapUv );
		vec2 dSTdy = dFdy( vBumpMapUv );
		float Hll = bumpScale * texture2D( bumpMap, vBumpMapUv ).x;
		float dBx = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdx ).x - Hll;
		float dBy = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdy ).x - Hll;
		return vec2( dBx, dBy );
	}
	vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection ) {
		vec3 vSigmaX = normalize( dFdx( surf_pos.xyz ) );
		vec3 vSigmaY = normalize( dFdy( surf_pos.xyz ) );
		vec3 vN = surf_norm;
		vec3 R1 = cross( vSigmaY, vN );
		vec3 R2 = cross( vN, vSigmaX );
		float fDet = dot( vSigmaX, R1 ) * faceDirection;
		vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
		return normalize( abs( fDet ) * surf_norm - vGrad );
	}
#endif`,fp=`#if NUM_CLIPPING_PLANES > 0
	vec4 plane;
	#ifdef ALPHA_TO_COVERAGE
		float distanceToPlane, distanceGradient;
		float clipOpacity = 1.0;
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
			distanceGradient = fwidth( distanceToPlane ) / 2.0;
			clipOpacity *= smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			if ( clipOpacity == 0.0 ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			float unionClipOpacity = 1.0;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
				distanceGradient = fwidth( distanceToPlane ) / 2.0;
				unionClipOpacity *= 1.0 - smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			}
			#pragma unroll_loop_end
			clipOpacity *= 1.0 - unionClipOpacity;
		#endif
		diffuseColor.a *= clipOpacity;
		if ( diffuseColor.a == 0.0 ) discard;
	#else
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			if ( dot( vClipPosition, plane.xyz ) > plane.w ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			bool clipped = true;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				clipped = ( dot( vClipPosition, plane.xyz ) > plane.w ) && clipped;
			}
			#pragma unroll_loop_end
			if ( clipped ) discard;
		#endif
	#endif
#endif`,pp=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,mp=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,gp=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,xp=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#endif`,yp=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#endif`,vp=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec4 vColor;
#endif`,_p=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	vColor = vec4( 1.0 );
#endif
#ifdef USE_COLOR_ALPHA
	vColor *= color;
#elif defined( USE_COLOR )
	vColor.rgb *= color;
#endif
#ifdef USE_INSTANCING_COLOR
	vColor.rgb *= instanceColor.rgb;
#endif
#ifdef USE_BATCHING_COLOR
	vColor *= getBatchingColor( getIndirectIndex( gl_DrawID ) );
#endif`,Mp=`#define PI 3.141592653589793
#define PI2 6.283185307179586
#define PI_HALF 1.5707963267948966
#define RECIPROCAL_PI 0.3183098861837907
#define RECIPROCAL_PI2 0.15915494309189535
#define EPSILON 1e-6
#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
#define whiteComplement( a ) ( 1.0 - saturate( a ) )
float pow2( const in float x ) { return x*x; }
vec3 pow2( const in vec3 x ) { return x*x; }
float pow3( const in float x ) { return x*x*x; }
float pow4( const in float x ) { float x2 = x*x; return x2*x2; }
float max3( const in vec3 v ) { return max( max( v.x, v.y ), v.z ); }
float average( const in vec3 v ) { return dot( v, vec3( 0.3333333 ) ); }
highp float rand( const in vec2 uv ) {
	const highp float a = 12.9898, b = 78.233, c = 43758.5453;
	highp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );
	return fract( sin( sn ) * c );
}
#ifdef HIGH_PRECISION
	float precisionSafeLength( vec3 v ) { return length( v ); }
#else
	float precisionSafeLength( vec3 v ) {
		float maxComponent = max3( abs( v ) );
		return length( v / maxComponent ) * maxComponent;
	}
#endif
struct IncidentLight {
	vec3 color;
	vec3 direction;
	bool visible;
};
struct ReflectedLight {
	vec3 directDiffuse;
	vec3 directSpecular;
	vec3 indirectDiffuse;
	vec3 indirectSpecular;
};
#ifdef USE_ALPHAHASH
	varying vec3 vPosition;
#endif
vec3 transformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );
}
#define inverseTransformDirection transformDirectionByInverseViewMatrix
vec3 transformNormalByInverseViewMatrix( in vec3 normal, in mat4 viewMatrix ) {
	return normalize( ( vec4( normal, 0.0 ) * viewMatrix ).xyz );
}
vec3 transformDirectionByInverseViewMatrix( in vec3 dir, in mat4 viewMatrix ) {
	return normalize( ( vec4( dir, 0.0 ) * viewMatrix ).xyz );
}
bool isPerspectiveMatrix( mat4 m ) {
	return m[ 2 ][ 3 ] == - 1.0;
}
vec2 equirectUv( in vec3 dir ) {
	float u = atan( dir.z, dir.x ) * RECIPROCAL_PI2 + 0.5;
	float v = asin( clamp( dir.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;
	return vec2( u, v );
}
vec3 BRDF_Lambert( const in vec3 diffuseColor ) {
	return RECIPROCAL_PI * diffuseColor;
}
vec3 F_Schlick( const in vec3 f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
}
float F_Schlick( const in float f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
} // validated`,Ep=`#ifdef ENVMAP_TYPE_CUBE_UV
	#define cubeUV_minMipLevel 4.0
	#define cubeUV_minTileSize 16.0
	float getFace( vec3 direction ) {
		vec3 absDirection = abs( direction );
		float face = - 1.0;
		if ( absDirection.x > absDirection.z ) {
			if ( absDirection.x > absDirection.y )
				face = direction.x > 0.0 ? 0.0 : 3.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		} else {
			if ( absDirection.z > absDirection.y )
				face = direction.z > 0.0 ? 2.0 : 5.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		}
		return face;
	}
	vec2 getUV( vec3 direction, float face ) {
		vec2 uv;
		if ( face == 0.0 ) {
			uv = vec2( direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 1.0 ) {
			uv = vec2( - direction.x, - direction.z ) / abs( direction.y );
		} else if ( face == 2.0 ) {
			uv = vec2( - direction.x, direction.y ) / abs( direction.z );
		} else if ( face == 3.0 ) {
			uv = vec2( - direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 4.0 ) {
			uv = vec2( - direction.x, direction.z ) / abs( direction.y );
		} else {
			uv = vec2( direction.x, direction.y ) / abs( direction.z );
		}
		return 0.5 * ( uv + 1.0 );
	}
	vec3 bilinearCubeUV( sampler2D envMap, vec3 direction, float mipInt ) {
		float face = getFace( direction );
		float filterInt = max( cubeUV_minMipLevel - mipInt, 0.0 );
		mipInt = max( mipInt, cubeUV_minMipLevel );
		float faceSize = exp2( mipInt );
		highp vec2 uv = getUV( direction, face ) * ( faceSize - 2.0 ) + 1.0;
		if ( face > 2.0 ) {
			uv.y += faceSize;
			face -= 3.0;
		}
		uv.x += face * faceSize;
		uv.x += filterInt * 3.0 * cubeUV_minTileSize;
		uv.y += 4.0 * ( exp2( CUBEUV_MAX_MIP ) - faceSize );
		uv.x *= CUBEUV_TEXEL_WIDTH;
		uv.y *= CUBEUV_TEXEL_HEIGHT;
		#ifdef texture2DGradEXT
			return texture2DGradEXT( envMap, uv, vec2( 0.0 ), vec2( 0.0 ) ).rgb;
		#else
			return texture2D( envMap, uv ).rgb;
		#endif
	}
	#define cubeUV_r0 1.0
	#define cubeUV_m0 - 2.0
	#define cubeUV_r1 0.8
	#define cubeUV_m1 - 1.0
	#define cubeUV_r4 0.4
	#define cubeUV_m4 2.0
	#define cubeUV_r5 0.305
	#define cubeUV_m5 3.0
	#define cubeUV_r6 0.21
	#define cubeUV_m6 4.0
	float roughnessToMip( float roughness ) {
		float mip = 0.0;
		if ( roughness >= cubeUV_r1 ) {
			mip = ( cubeUV_r0 - roughness ) * ( cubeUV_m1 - cubeUV_m0 ) / ( cubeUV_r0 - cubeUV_r1 ) + cubeUV_m0;
		} else if ( roughness >= cubeUV_r4 ) {
			mip = ( cubeUV_r1 - roughness ) * ( cubeUV_m4 - cubeUV_m1 ) / ( cubeUV_r1 - cubeUV_r4 ) + cubeUV_m1;
		} else if ( roughness >= cubeUV_r5 ) {
			mip = ( cubeUV_r4 - roughness ) * ( cubeUV_m5 - cubeUV_m4 ) / ( cubeUV_r4 - cubeUV_r5 ) + cubeUV_m4;
		} else if ( roughness >= cubeUV_r6 ) {
			mip = ( cubeUV_r5 - roughness ) * ( cubeUV_m6 - cubeUV_m5 ) / ( cubeUV_r5 - cubeUV_r6 ) + cubeUV_m5;
		} else {
			mip = - 2.0 * log2( 1.16 * roughness );		}
		return mip;
	}
	vec4 textureCubeUV( sampler2D envMap, vec3 sampleDir, float roughness ) {
		float mip = clamp( roughnessToMip( roughness ), cubeUV_m0, CUBEUV_MAX_MIP );
		float mipF = fract( mip );
		float mipInt = floor( mip );
		vec3 color0 = bilinearCubeUV( envMap, sampleDir, mipInt );
		if ( mipF == 0.0 ) {
			return vec4( color0, 1.0 );
		} else {
			vec3 color1 = bilinearCubeUV( envMap, sampleDir, mipInt + 1.0 );
			return vec4( mix( color0, color1, mipF ), 1.0 );
		}
	}
#endif`,wp=`vec3 transformedNormal = objectNormal;
#ifdef USE_TANGENT
	vec3 transformedTangent = objectTangent;
#endif
#ifdef USE_BATCHING
	mat3 bm = mat3( batchingMatrix );
	transformedNormal /= vec3( dot( bm[ 0 ], bm[ 0 ] ), dot( bm[ 1 ], bm[ 1 ] ), dot( bm[ 2 ], bm[ 2 ] ) );
	transformedNormal = bm * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = bm * transformedTangent;
	#endif
#endif
#ifdef USE_INSTANCING
	mat3 im = mat3( instanceMatrix );
	transformedNormal /= vec3( dot( im[ 0 ], im[ 0 ] ), dot( im[ 1 ], im[ 1 ] ), dot( im[ 2 ], im[ 2 ] ) );
	transformedNormal = im * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = im * transformedTangent;
	#endif
#endif
transformedNormal = normalMatrix * transformedNormal;
#ifdef FLIP_SIDED
	transformedNormal = - transformedNormal;
#endif
#ifdef USE_TANGENT
	transformedTangent = ( modelViewMatrix * vec4( transformedTangent, 0.0 ) ).xyz;
#endif`,bp=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,Sp=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,Tp=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,Rp=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,Ap="gl_FragColor = linearToOutputTexel( gl_FragColor );",Cp=`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,Pp=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vec3 cameraToFrag;
		if ( isOrthographic ) {
			cameraToFrag = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToFrag = normalize( vWorldPosition - cameraPosition );
		}
		vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vec3 reflectVec = reflect( cameraToFrag, worldNormal );
		#else
			vec3 reflectVec = refract( cameraToFrag, worldNormal, refractionRatio );
		#endif
	#else
		vec3 reflectVec = vReflect;
	#endif
	#ifdef ENVMAP_TYPE_CUBE
		vec4 envColor = textureCube( envMap, envMapRotation * reflectVec );
		#ifdef ENVMAP_BLENDING_MULTIPLY
			outgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, specularStrength * reflectivity );
		#elif defined( ENVMAP_BLENDING_MIX )
			outgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity );
		#elif defined( ENVMAP_BLENDING_ADD )
			outgoingLight += envColor.xyz * specularStrength * reflectivity;
		#endif
	#endif
#endif`,Ip=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
#endif`,Dp=`#ifdef USE_ENVMAP
	uniform float reflectivity;
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		varying vec3 vWorldPosition;
		uniform float refractionRatio;
	#else
		varying vec3 vReflect;
	#endif
#endif`,Lp=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,Np=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vWorldPosition = worldPosition.xyz;
	#else
		vec3 cameraToVertex;
		if ( isOrthographic ) {
			cameraToVertex = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToVertex = normalize( worldPosition.xyz - cameraPosition );
		}
		vec3 worldNormal = transformNormalByInverseViewMatrix( transformedNormal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vReflect = reflect( cameraToVertex, worldNormal );
		#else
			vReflect = refract( cameraToVertex, worldNormal, refractionRatio );
		#endif
	#endif
#endif`,Hp=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,Up=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,kp=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,Fp=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,zp=`#ifdef USE_GRADIENTMAP
	uniform sampler2D gradientMap;
#endif
vec3 getGradientIrradiance( vec3 normal, vec3 lightDirection ) {
	float dotNL = dot( normal, lightDirection );
	vec2 coord = vec2( dotNL * 0.5 + 0.5, 0.0 );
	#ifdef USE_GRADIENTMAP
		return vec3( texture2D( gradientMap, coord ).r );
	#else
		vec2 fw = fwidth( coord ) * 0.5;
		return mix( vec3( 0.7 ), vec3( 1.0 ), smoothstep( 0.7 - fw.x, 0.7 + fw.x, coord.x ) );
	#endif
}`,Op=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,Vp=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,Bp=`varying vec3 vViewPosition;
struct LambertMaterial {
	vec3 diffuseColor;
	float specularStrength;
};
void RE_Direct_Lambert( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Lambert( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Lambert
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,Gp=`uniform bool receiveShadow;
uniform vec3 ambientLightColor;
#if defined( USE_LIGHT_PROBES )
	uniform vec3 lightProbe[ 9 ];
#endif
vec3 shGetIrradianceAt( in vec3 normal, in vec3 shCoefficients[ 9 ] ) {
	float x = normal.x, y = normal.y, z = normal.z;
	vec3 result = shCoefficients[ 0 ] * 0.886227;
	result += shCoefficients[ 1 ] * 2.0 * 0.511664 * y;
	result += shCoefficients[ 2 ] * 2.0 * 0.511664 * z;
	result += shCoefficients[ 3 ] * 2.0 * 0.511664 * x;
	result += shCoefficients[ 4 ] * 2.0 * 0.429043 * x * y;
	result += shCoefficients[ 5 ] * 2.0 * 0.429043 * y * z;
	result += shCoefficients[ 6 ] * ( 0.743125 * z * z - 0.247708 );
	result += shCoefficients[ 7 ] * 2.0 * 0.429043 * x * z;
	result += shCoefficients[ 8 ] * 0.429043 * ( x * x - y * y );
	return result;
}
vec3 getLightProbeIrradiance( const in vec3 lightProbe[ 9 ], const in vec3 normal ) {
	vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
	vec3 irradiance = shGetIrradianceAt( worldNormal, lightProbe );
	return irradiance;
}
vec3 getAmbientLightIrradiance( const in vec3 ambientLightColor ) {
	vec3 irradiance = ambientLightColor;
	return irradiance;
}
float getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {
	float distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );
	if ( cutoffDistance > 0.0 ) {
		distanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );
	}
	return distanceFalloff;
}
float getSpotAttenuation( const in float coneCosine, const in float penumbraCosine, const in float angleCosine ) {
	return smoothstep( coneCosine, penumbraCosine, angleCosine );
}
#if NUM_SUN_LIGHTS > 0
	struct SunLight {
		vec3 direction;
		vec3 color;
	};
	uniform SunLight sunLights[ NUM_SUN_LIGHTS ];
	void getSunLightInfo( const in SunLight sunLight, out IncidentLight light ) {
		light.color = sunLight.color;
		light.direction = sunLight.direction;
		light.visible = true;
	}
#endif
#if NUM_DIR_LIGHTS > 0
	struct DirectionalLight {
		vec3 direction;
		vec3 color;
	};
	uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];
	void getDirectionalLightInfo( const in DirectionalLight directionalLight, out IncidentLight light ) {
		light.color = directionalLight.color;
		light.direction = directionalLight.direction;
		light.visible = true;
	}
#endif
#if NUM_POINT_LIGHTS > 0
	struct PointLight {
		vec3 position;
		vec3 color;
		float distance;
		float decay;
	};
	uniform PointLight pointLights[ NUM_POINT_LIGHTS ];
	void getPointLightInfo( const in PointLight pointLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = pointLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float lightDistance = length( lVector );
		light.color = pointLight.color;
		light.color *= getDistanceAttenuation( lightDistance, pointLight.distance, pointLight.decay );
		light.visible = ( light.color != vec3( 0.0 ) );
	}
#endif
#if NUM_SPOT_LIGHTS > 0
	struct SpotLight {
		vec3 position;
		vec3 direction;
		vec3 color;
		float distance;
		float decay;
		float coneCos;
		float penumbraCos;
	};
	uniform SpotLight spotLights[ NUM_SPOT_LIGHTS ];
	void getSpotLightInfo( const in SpotLight spotLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = spotLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float angleCos = dot( light.direction, spotLight.direction );
		float spotAttenuation = getSpotAttenuation( spotLight.coneCos, spotLight.penumbraCos, angleCos );
		if ( spotAttenuation > 0.0 ) {
			float lightDistance = length( lVector );
			light.color = spotLight.color * spotAttenuation;
			light.color *= getDistanceAttenuation( lightDistance, spotLight.distance, spotLight.decay );
			light.visible = ( light.color != vec3( 0.0 ) );
		} else {
			light.color = vec3( 0.0 );
			light.visible = false;
		}
	}
#endif
#if NUM_RECT_AREA_LIGHTS > 0
	struct RectAreaLight {
		vec3 color;
		vec3 position;
		vec3 halfWidth;
		vec3 halfHeight;
	};
	uniform sampler2D ltc_1;	uniform sampler2D ltc_2;
	uniform RectAreaLight rectAreaLights[ NUM_RECT_AREA_LIGHTS ];
#endif
#if NUM_HEMI_LIGHTS > 0
	struct HemisphereLight {
		vec3 direction;
		vec3 skyColor;
		vec3 groundColor;
	};
	uniform HemisphereLight hemisphereLights[ NUM_HEMI_LIGHTS ];
	vec3 getHemisphereLightIrradiance( const in HemisphereLight hemiLight, const in vec3 normal ) {
		float dotNL = dot( normal, hemiLight.direction );
		float hemiDiffuseWeight = 0.5 * dotNL + 0.5;
		vec3 irradiance = mix( hemiLight.groundColor, hemiLight.skyColor, hemiDiffuseWeight );
		return irradiance;
	}
#endif
#include <lightprobes_pars_fragment>`,Wp=`#ifdef USE_ENVMAP
	vec3 getIBLIrradiance( const in vec3 normal ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * worldNormal, 1.0 );
			return PI * envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 reflectVec = reflect( - viewDir, normal );
			reflectVec = normalize( mix( reflectVec, normal, pow4( roughness ) ) );
			reflectVec = transformDirectionByInverseViewMatrix( reflectVec, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * reflectVec, roughness );
			return envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	#ifdef USE_RETROREFLECTION
		vec3 getIBLRetroRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
			#ifdef ENVMAP_TYPE_CUBE_UV
				vec3 retroVec = normalize( mix( viewDir, normal, pow4( roughness ) ) );
				retroVec = transformDirectionByInverseViewMatrix( retroVec, viewMatrix );
				vec4 envMapColor = textureCubeUV( envMap, envMapRotation * retroVec, roughness );
				return envMapColor.rgb * envMapIntensity;
			#else
				return vec3( 0.0 );
			#endif
		}
	#endif
	#ifdef USE_ANISOTROPY
		vec3 getIBLAnisotropyRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
			#ifdef ENVMAP_TYPE_CUBE_UV
				vec3 bentNormal = cross( bitangent, viewDir );
				bentNormal = normalize( cross( bentNormal, bitangent ) );
				bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
				return getIBLRadiance( viewDir, bentNormal, roughness );
			#else
				return vec3( 0.0 );
			#endif
		}
		#ifdef USE_RETROREFLECTION
			vec3 getIBLAnisotropyRetroRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
				#ifdef ENVMAP_TYPE_CUBE_UV
					vec3 bentNormal = cross( bitangent, viewDir );
					bentNormal = normalize( cross( bentNormal, bitangent ) );
					bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
					return getIBLRetroRadiance( viewDir, bentNormal, roughness );
				#else
					return vec3( 0.0 );
				#endif
			}
		#endif
	#endif
#endif`,Xp=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,qp=`varying vec3 vViewPosition;
struct ToonMaterial {
	vec3 diffuseColor;
};
void RE_Direct_Toon( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 irradiance = getGradientIrradiance( geometryNormal, directLight.direction ) * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Toon( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Toon
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,Yp=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,Zp=`varying vec3 vViewPosition;
struct BlinnPhongMaterial {
	vec3 diffuseColor;
	vec3 specularColor;
	float specularShininess;
	float specularStrength;
};
void RE_Direct_BlinnPhong( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
	reflectedLight.directSpecular += irradiance * BRDF_BlinnPhong( directLight.direction, geometryViewDir, geometryNormal, material.specularColor, material.specularShininess ) * material.specularStrength;
}
void RE_IndirectDiffuse_BlinnPhong( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_BlinnPhong
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,$p=`PhysicalMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.diffuseContribution = diffuseColor.rgb * ( 1.0 - metalnessFactor );
material.metalness = metalnessFactor;
vec3 dxy = max( abs( dFdx( nonPerturbedNormal ) ), abs( dFdy( nonPerturbedNormal ) ) );
float geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );
material.roughness = max( roughnessFactor, 0.0525 );material.roughness += geometryRoughness;
material.roughness = min( material.roughness, 1.0 );
#ifdef IOR
	material.ior = ior;
	#ifdef USE_SPECULAR
		float specularIntensityFactor = specularIntensity;
		vec3 specularColorFactor = specularColor;
		#ifdef USE_SPECULAR_COLORMAP
			specularColorFactor *= texture2D( specularColorMap, vSpecularColorMapUv ).rgb;
		#endif
		#ifdef USE_SPECULAR_INTENSITYMAP
			specularIntensityFactor *= texture2D( specularIntensityMap, vSpecularIntensityMapUv ).a;
		#endif
		material.specularF90 = mix( specularIntensityFactor, 1.0, metalnessFactor );
	#else
		float specularIntensityFactor = 1.0;
		vec3 specularColorFactor = vec3( 1.0 );
		material.specularF90 = 1.0;
	#endif
	material.specularColor = min( pow2( ( material.ior - 1.0 ) / ( material.ior + 1.0 ) ) * specularColorFactor, vec3( 1.0 ) ) * specularIntensityFactor;
	material.specularColorBlended = mix( material.specularColor, diffuseColor.rgb, metalnessFactor );
#else
	material.specularColor = vec3( 0.04 );
	material.specularColorBlended = mix( material.specularColor, diffuseColor.rgb, metalnessFactor );
	material.specularF90 = 1.0;
#endif
#ifdef USE_CLEARCOAT
	material.clearcoat = clearcoat;
	material.clearcoatRoughness = clearcoatRoughness;
	material.clearcoatF0 = vec3( 0.04 );
	material.clearcoatF90 = 1.0;
	#ifdef USE_CLEARCOATMAP
		material.clearcoat *= texture2D( clearcoatMap, vClearcoatMapUv ).x;
	#endif
	#ifdef USE_CLEARCOAT_ROUGHNESSMAP
		material.clearcoatRoughness *= texture2D( clearcoatRoughnessMap, vClearcoatRoughnessMapUv ).y;
	#endif
	material.clearcoat = saturate( material.clearcoat );	material.clearcoatRoughness = max( material.clearcoatRoughness, 0.0525 );
	material.clearcoatRoughness += geometryRoughness;
	material.clearcoatRoughness = min( material.clearcoatRoughness, 1.0 );
#endif
#ifdef USE_DISPERSION
	material.dispersion = dispersion;
#endif
#ifdef USE_RETROREFLECTION
	material.retroreflectivity = retroreflectivity;
#endif
#ifdef USE_IRIDESCENCE
	material.iridescence = iridescence;
	material.iridescenceIOR = iridescenceIOR;
	#ifdef USE_IRIDESCENCEMAP
		material.iridescence *= texture2D( iridescenceMap, vIridescenceMapUv ).r;
	#endif
	#ifdef USE_IRIDESCENCE_THICKNESSMAP
		material.iridescenceThickness = (iridescenceThicknessMaximum - iridescenceThicknessMinimum) * texture2D( iridescenceThicknessMap, vIridescenceThicknessMapUv ).g + iridescenceThicknessMinimum;
	#else
		material.iridescenceThickness = iridescenceThicknessMaximum;
	#endif
#endif
#ifdef USE_SHEEN
	material.sheenColor = sheenColor;
	#ifdef USE_SHEEN_COLORMAP
		material.sheenColor *= texture2D( sheenColorMap, vSheenColorMapUv ).rgb;
	#endif
	material.sheenRoughness = clamp( sheenRoughness, 0.0001, 1.0 );
	#ifdef USE_SHEEN_ROUGHNESSMAP
		material.sheenRoughness *= texture2D( sheenRoughnessMap, vSheenRoughnessMapUv ).a;
	#endif
#endif
#ifdef USE_ANISOTROPY
	#ifdef USE_ANISOTROPYMAP
		mat2 anisotropyMat = mat2( anisotropyVector.x, anisotropyVector.y, - anisotropyVector.y, anisotropyVector.x );
		vec3 anisotropyPolar = texture2D( anisotropyMap, vAnisotropyMapUv ).rgb;
		vec2 anisotropyV = anisotropyMat * normalize( 2.0 * anisotropyPolar.rg - vec2( 1.0 ) ) * anisotropyPolar.b;
	#else
		vec2 anisotropyV = anisotropyVector;
	#endif
	material.anisotropy = length( anisotropyV );
	if( material.anisotropy == 0.0 ) {
		anisotropyV = vec2( 1.0, 0.0 );
	} else {
		anisotropyV /= material.anisotropy;
		material.anisotropy = saturate( material.anisotropy );
	}
	material.alphaT = mix( pow2( material.roughness ), 1.0, pow2( material.anisotropy ) );
	material.anisotropyT = tbn[ 0 ] * anisotropyV.x + tbn[ 1 ] * anisotropyV.y;
	material.anisotropyB = tbn[ 1 ] * anisotropyV.x - tbn[ 0 ] * anisotropyV.y;
#endif`,Kp=`uniform sampler2D dfgLUT;
struct PhysicalMaterial {
	vec3 diffuseColor;
	vec3 diffuseContribution;
	vec3 specularColor;
	vec3 specularColorBlended;
	float roughness;
	float metalness;
	float specularF90;
	float dispersion;
	vec2 dfg;
	vec3 multiScatteringCompensation;
	#ifdef USE_RETROREFLECTION
		float retroreflectivity;
	#endif
	#ifdef USE_CLEARCOAT
		float clearcoat;
		float clearcoatRoughness;
		vec3 clearcoatF0;
		float clearcoatF90;
	#endif
	#ifdef USE_IRIDESCENCE
		float iridescence;
		float iridescenceIOR;
		float iridescenceThickness;
		vec3 iridescenceFresnel;
		vec3 iridescenceF0Dielectric;
		vec3 iridescenceF0Metallic;
	#endif
	#ifdef USE_SHEEN
		vec3 sheenColor;
		float sheenRoughness;
	#endif
	#ifdef IOR
		float ior;
	#endif
	#ifdef USE_TRANSMISSION
		float transmission;
		float transmissionAlpha;
		float thickness;
		float attenuationDistance;
		vec3 attenuationColor;
	#endif
	#ifdef USE_ANISOTROPY
		float anisotropy;
		float alphaT;
		vec3 anisotropyT;
		vec3 anisotropyB;
	#endif
};
vec3 clearcoatSpecularDirect = vec3( 0.0 );
vec3 clearcoatSpecularIndirect = vec3( 0.0 );
vec3 sheenSpecularDirect = vec3( 0.0 );
vec3 sheenSpecularIndirect = vec3(0.0 );
vec3 Schlick_to_F0( const in vec3 f, const in float f90, const in float dotVH ) {
    float x = clamp( 1.0 - dotVH, 0.0, 1.0 );
    float x2 = x * x;
    float x5 = clamp( x * x2 * x2, 0.0, 0.9999 );
    return ( f - vec3( f90 ) * x5 ) / ( 1.0 - x5 );
}
float V_GGX_SmithCorrelated( const in float alpha, const in float dotNL, const in float dotNV ) {
	float a2 = pow2( alpha );
	float gv = dotNL * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNV ) );
	float gl = dotNV * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNL ) );
	return 0.5 / max( gv + gl, EPSILON );
}
float D_GGX( const in float alpha, const in float dotNH ) {
	float a2 = pow2( alpha );
	float denom = pow2( dotNH ) * ( a2 - 1.0 ) + 1.0;
	return RECIPROCAL_PI * a2 / pow2( denom );
}
#ifdef USE_ANISOTROPY
	float V_GGX_SmithCorrelated_Anisotropic( const in float alphaT, const in float alphaB, const in float dotTV, const in float dotBV, const in float dotTL, const in float dotBL, const in float dotNV, const in float dotNL ) {
		float gv = dotNL * length( vec3( alphaT * dotTV, alphaB * dotBV, dotNV ) );
		float gl = dotNV * length( vec3( alphaT * dotTL, alphaB * dotBL, dotNL ) );
		return 0.5 / max( gv + gl, EPSILON );
	}
	float D_GGX_Anisotropic( const in float alphaT, const in float alphaB, const in float dotNH, const in float dotTH, const in float dotBH ) {
		float a2 = alphaT * alphaB;
		highp vec3 v = vec3( alphaB * dotTH, alphaT * dotBH, a2 * dotNH );
		highp float v2 = dot( v, v );
		float w2 = a2 / v2;
		return RECIPROCAL_PI * a2 * pow2 ( w2 );
	}
#endif
#ifdef USE_CLEARCOAT
	vec3 BRDF_GGX_Clearcoat( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material) {
		vec3 f0 = material.clearcoatF0;
		float f90 = material.clearcoatF90;
		float roughness = material.clearcoatRoughness;
		float alpha = pow2( roughness );
		vec3 halfDir = normalize( lightDir + viewDir );
		float dotNL = saturate( dot( normal, lightDir ) );
		float dotNV = saturate( dot( normal, viewDir ) );
		float dotNH = saturate( dot( normal, halfDir ) );
		float dotVH = saturate( dot( viewDir, halfDir ) );
		vec3 F = F_Schlick( f0, f90, dotVH );
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
		return F * ( V * D );
	}
#endif
vec3 BRDF_GGX( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 f0 = material.specularColorBlended;
	float f90 = material.specularF90;
	float roughness = material.roughness;
	float alpha = pow2( roughness );
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( f0, f90, dotVH );
	#ifdef USE_IRIDESCENCE
		F = mix( F, material.iridescenceFresnel, material.iridescence );
	#endif
	#ifdef USE_ANISOTROPY
		float dotTL = dot( material.anisotropyT, lightDir );
		float dotTV = dot( material.anisotropyT, viewDir );
		float dotTH = dot( material.anisotropyT, halfDir );
		float dotBL = dot( material.anisotropyB, lightDir );
		float dotBV = dot( material.anisotropyB, viewDir );
		float dotBH = dot( material.anisotropyB, halfDir );
		float V = V_GGX_SmithCorrelated_Anisotropic( material.alphaT, alpha, dotTV, dotBV, dotTL, dotBL, dotNV, dotNL );
		float D = D_GGX_Anisotropic( material.alphaT, alpha, dotNH, dotTH, dotBH );
	#else
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
	#endif
	return F * ( V * D );
}
vec2 LTC_Uv( const in vec3 N, const in vec3 V, const in float roughness ) {
	const float LUT_SIZE = 64.0;
	const float LUT_SCALE = ( LUT_SIZE - 1.0 ) / LUT_SIZE;
	const float LUT_BIAS = 0.5 / LUT_SIZE;
	float dotNV = saturate( dot( N, V ) );
	vec2 uv = vec2( roughness, sqrt( 1.0 - dotNV ) );
	uv = uv * LUT_SCALE + LUT_BIAS;
	return uv;
}
float LTC_ClippedSphereFormFactor( const in vec3 f ) {
	float l = length( f );
	return max( ( l * l + f.z ) / ( l + 1.0 ), 0.0 );
}
vec3 LTC_EdgeVectorFormFactor( const in vec3 v1, const in vec3 v2 ) {
	float x = dot( v1, v2 );
	float y = abs( x );
	float a = 0.8543985 + ( 0.4965155 + 0.0145206 * y ) * y;
	float b = 3.4175940 + ( 4.1616724 + y ) * y;
	float v = a / b;
	float theta_sintheta = ( x > 0.0 ) ? v : 0.5 * inversesqrt( max( 1.0 - x * x, 1e-7 ) ) - v;
	return cross( v1, v2 ) * theta_sintheta;
}
vec3 LTC_Evaluate( const in vec3 N, const in vec3 V, const in vec3 P, const in mat3 mInv, const in vec3 rectCoords[ 4 ] ) {
	vec3 v1 = rectCoords[ 1 ] - rectCoords[ 0 ];
	vec3 v2 = rectCoords[ 3 ] - rectCoords[ 0 ];
	vec3 lightNormal = cross( v1, v2 );
	if( dot( lightNormal, P - rectCoords[ 0 ] ) < 0.0 ) return vec3( 0.0 );
	vec3 T1, T2;
	T1 = normalize( V - N * dot( V, N ) );
	T2 = - cross( N, T1 );
	mat3 mat = mInv * transpose( mat3( T1, T2, N ) );
	vec3 coords[ 4 ];
	coords[ 0 ] = mat * ( rectCoords[ 0 ] - P );
	coords[ 1 ] = mat * ( rectCoords[ 1 ] - P );
	coords[ 2 ] = mat * ( rectCoords[ 2 ] - P );
	coords[ 3 ] = mat * ( rectCoords[ 3 ] - P );
	coords[ 0 ] = normalize( coords[ 0 ] );
	coords[ 1 ] = normalize( coords[ 1 ] );
	coords[ 2 ] = normalize( coords[ 2 ] );
	coords[ 3 ] = normalize( coords[ 3 ] );
	vec3 vectorFormFactor = vec3( 0.0 );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 0 ], coords[ 1 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 1 ], coords[ 2 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 2 ], coords[ 3 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 3 ], coords[ 0 ] );
	float result = LTC_ClippedSphereFormFactor( vectorFormFactor );
	return vec3( result );
}
#if defined( USE_SHEEN )
float D_Charlie( float roughness, float dotNH ) {
	float alpha = pow2( roughness );
	float invAlpha = 1.0 / alpha;
	float cos2h = dotNH * dotNH;
	float sin2h = max( 1.0 - cos2h, 0.0078125 );
	return ( 2.0 + invAlpha ) * pow( sin2h, invAlpha * 0.5 ) / ( 2.0 * PI );
}
float V_Neubelt( float dotNV, float dotNL ) {
	return saturate( 1.0 / ( 4.0 * ( dotNL + dotNV - dotNL * dotNV ) ) );
}
vec3 BRDF_Sheen( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, vec3 sheenColor, const in float sheenRoughness ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float D = D_Charlie( sheenRoughness, dotNH );
	float V = V_Neubelt( dotNV, dotNL );
	return sheenColor * ( D * V );
}
#endif
float IBLSheenBRDF( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	float r2 = roughness * roughness;
	float rInv = 1.0 / ( roughness + 0.1 );
	float a = -1.9362 + 1.0678 * roughness + 0.4573 * r2 - 0.8469 * rInv;
	float b = -0.6014 + 0.5538 * roughness - 0.4670 * r2 - 0.1255 * rInv;
	float DG = exp( a * dotNV + b );
	return saturate( DG );
}
vec3 EnvironmentBRDF( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	vec2 fab = texture2D( dfgLUT, vec2( roughness, dotNV ) ).rg;
	return specularColor * fab.x + specularF90 * fab.y;
}
#ifdef USE_IRIDESCENCE
void computeMultiscatteringIridescence( const in vec2 fab, const in vec3 specularColor, const in float specularF90, const in float iridescence, const in vec3 iridescenceF0, inout vec3 singleScatter, inout vec3 multiScatter ) {
#else
void computeMultiscattering( const in vec2 fab, const in vec3 specularColor, const in float specularF90, inout vec3 singleScatter, inout vec3 multiScatter ) {
#endif
	#ifdef USE_IRIDESCENCE
		vec3 Fr = mix( specularColor, iridescenceF0, iridescence );
	#else
		vec3 Fr = specularColor;
	#endif
	vec3 FssEss = Fr * fab.x + specularF90 * fab.y;
	float Ess = fab.x + fab.y;
	float Ems = 1.0 - Ess;
	vec3 Favg = Fr + ( 1.0 - Fr ) * 0.047619;	vec3 Fms = FssEss * Favg / ( 1.0 - Ems * Favg );
	singleScatter += FssEss;
	multiScatter += Fms * Ems;
}
#if NUM_RECT_AREA_LIGHTS > 0
	void RE_Direct_RectArea_Physical( const in RectAreaLight rectAreaLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
		vec3 normal = geometryNormal;
		vec3 viewDir = geometryViewDir;
		vec3 position = geometryPosition;
		vec3 lightPos = rectAreaLight.position;
		vec3 halfWidth = rectAreaLight.halfWidth;
		vec3 halfHeight = rectAreaLight.halfHeight;
		vec3 lightColor = rectAreaLight.color;
		float roughness = material.roughness;
		vec3 rectCoords[ 4 ];
		rectCoords[ 0 ] = lightPos + halfWidth - halfHeight;		rectCoords[ 1 ] = lightPos - halfWidth - halfHeight;
		rectCoords[ 2 ] = lightPos - halfWidth + halfHeight;
		rectCoords[ 3 ] = lightPos + halfWidth + halfHeight;
		vec2 uv = LTC_Uv( normal, viewDir, roughness );
		vec4 t1 = texture2D( ltc_1, uv );
		vec4 t2 = texture2D( ltc_2, uv );
		mat3 mInv = mat3(
			vec3( t1.x, 0, t1.y ),
			vec3(    0, 1,    0 ),
			vec3( t1.z, 0, t1.w )
		);
		vec3 fresnel = ( material.specularColorBlended * t2.x + ( material.specularF90 - material.specularColorBlended ) * t2.y );
		reflectedLight.directSpecular += lightColor * fresnel * LTC_Evaluate( normal, viewDir, position, mInv, rectCoords );
		reflectedLight.directDiffuse += lightColor * material.diffuseContribution * LTC_Evaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords );
		#ifdef USE_CLEARCOAT
			vec3 Ncc = geometryClearcoatNormal;
			vec2 uvClearcoat = LTC_Uv( Ncc, viewDir, material.clearcoatRoughness );
			vec4 t1Clearcoat = texture2D( ltc_1, uvClearcoat );
			vec4 t2Clearcoat = texture2D( ltc_2, uvClearcoat );
			mat3 mInvClearcoat = mat3(
				vec3( t1Clearcoat.x, 0, t1Clearcoat.y ),
				vec3(             0, 1,             0 ),
				vec3( t1Clearcoat.z, 0, t1Clearcoat.w )
			);
			vec3 fresnelClearcoat = material.clearcoatF0 * t2Clearcoat.x + ( material.clearcoatF90 - material.clearcoatF0 ) * t2Clearcoat.y;
			clearcoatSpecularDirect += lightColor * fresnelClearcoat * LTC_Evaluate( Ncc, viewDir, position, mInvClearcoat, rectCoords );
		#endif
	}
#endif
void RE_Direct_Physical( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	#ifdef USE_CLEARCOAT
		float dotNLcc = saturate( dot( geometryClearcoatNormal, directLight.direction ) );
		vec3 ccIrradiance = dotNLcc * directLight.color;
		clearcoatSpecularDirect += ccIrradiance * BRDF_GGX_Clearcoat( directLight.direction, geometryViewDir, geometryClearcoatNormal, material );
	#endif
	#ifdef USE_SHEEN
 
 		sheenSpecularDirect += irradiance * BRDF_Sheen( directLight.direction, geometryViewDir, geometryNormal, material.sheenColor, material.sheenRoughness );
 
 		float sheenAlbedoV = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
 		float sheenAlbedoL = IBLSheenBRDF( geometryNormal, directLight.direction, material.sheenRoughness );
 
 		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * max( sheenAlbedoV, sheenAlbedoL );
 
 		irradiance *= sheenEnergyComp;
 
 	#endif
	vec3 specularBRDF = BRDF_GGX( directLight.direction, geometryViewDir, geometryNormal, material );
	#ifdef USE_RETROREFLECTION
		vec3 retroViewDir = reflect( - geometryViewDir, geometryNormal );
		vec3 retroSpecularBRDF = BRDF_GGX( directLight.direction, retroViewDir, geometryNormal, material );
		specularBRDF = mix( specularBRDF, retroSpecularBRDF, saturate( material.retroreflectivity ) );
	#endif
	reflectedLight.directSpecular += irradiance * specularBRDF * material.multiScatteringCompensation;
	vec3 halfDir = normalize( directLight.direction + geometryViewDir );
	float dotVH = saturate( dot( geometryViewDir, halfDir ) );
	vec3 F = F_Schlick( material.specularColor, material.specularF90, dotVH );
	#ifdef USE_RETROREFLECTION
		vec3 retroHalfDir = normalize( directLight.direction + retroViewDir );
		float dotRetroVH = saturate( dot( retroViewDir, retroHalfDir ) );
		vec3 retroF = F_Schlick( material.specularColor, material.specularF90, dotRetroVH );
		F = mix( F, retroF, saturate( material.retroreflectivity ) );
	#endif
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseContribution ) * ( 1.0 - F );
}
void RE_IndirectDiffuse_Physical( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 singleScattering = vec3( 0.0 );
	vec3 multiScattering = vec3( 0.0 );
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( material.dfg, material.specularColor, material.specularF90, material.iridescence, material.iridescenceF0Dielectric, singleScattering, multiScattering );
	#else
		computeMultiscattering( material.dfg, material.specularColor, material.specularF90, singleScattering, multiScattering );
	#endif
	vec3 diffuse = irradiance * BRDF_Lambert( material.diffuseContribution ) * ( 1.0 - singleScattering - multiScattering );
	#ifdef USE_SHEEN
		float sheenAlbedo = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
		sheenSpecularIndirect += irradiance * material.sheenColor * sheenAlbedo * RECIPROCAL_PI;
		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * sheenAlbedo;
		diffuse *= sheenEnergyComp;
	#endif
	reflectedLight.indirectDiffuse += diffuse;
}
void RE_IndirectSpecular_Physical( const in vec3 radiance, const in vec3 irradiance, const in vec3 clearcoatRadiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight) {
	#ifdef USE_CLEARCOAT
		clearcoatSpecularIndirect += clearcoatRadiance * EnvironmentBRDF( geometryClearcoatNormal, geometryViewDir, material.clearcoatF0, material.clearcoatF90, material.clearcoatRoughness );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularIndirect += irradiance * material.sheenColor * IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness ) * RECIPROCAL_PI;
 	#endif
	vec3 singleScatteringDielectric = vec3( 0.0 );
	vec3 multiScatteringDielectric = vec3( 0.0 );
	vec3 singleScatteringMetallic = vec3( 0.0 );
	vec3 multiScatteringMetallic = vec3( 0.0 );
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( material.dfg, material.specularColor, material.specularF90, material.iridescence, material.iridescenceF0Dielectric, singleScatteringDielectric, multiScatteringDielectric );
		computeMultiscatteringIridescence( material.dfg, material.diffuseColor, material.specularF90, material.iridescence, material.iridescenceF0Metallic, singleScatteringMetallic, multiScatteringMetallic );
	#else
		computeMultiscattering( material.dfg, material.specularColor, material.specularF90, singleScatteringDielectric, multiScatteringDielectric );
		computeMultiscattering( material.dfg, material.diffuseColor, material.specularF90, singleScatteringMetallic, multiScatteringMetallic );
	#endif
	vec3 singleScattering = mix( singleScatteringDielectric, singleScatteringMetallic, material.metalness );
	vec3 multiScattering = mix( multiScatteringDielectric, multiScatteringMetallic, material.metalness );
	vec3 totalScatteringDielectric = singleScatteringDielectric + multiScatteringDielectric;
	vec3 diffuse = material.diffuseContribution * ( 1.0 - totalScatteringDielectric );
	vec3 cosineWeightedIrradiance = irradiance * RECIPROCAL_PI;
	vec3 indirectSpecular = radiance * singleScattering;
	indirectSpecular += multiScattering * cosineWeightedIrradiance;
	vec3 indirectDiffuse = diffuse * cosineWeightedIrradiance;
	#ifdef USE_SHEEN
		float sheenAlbedo = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * sheenAlbedo;
		indirectSpecular *= sheenEnergyComp;
		indirectDiffuse *= sheenEnergyComp;
	#endif
	reflectedLight.indirectSpecular += indirectSpecular;
	reflectedLight.indirectDiffuse += indirectDiffuse;
}
#define RE_Direct				RE_Direct_Physical
#define RE_Direct_RectArea		RE_Direct_RectArea_Physical
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Physical
#define RE_IndirectSpecular		RE_IndirectSpecular_Physical
float computeSpecularOcclusion( const in float dotNV, const in float ambientOcclusion, const in float roughness ) {
	return saturate( pow( dotNV + ambientOcclusion, exp2( - 16.0 * roughness - 1.0 ) ) - 1.0 + ambientOcclusion );
}`,Jp=`
vec3 geometryPosition = - vViewPosition;
vec3 geometryNormal = normal;
vec3 geometryViewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );
vec3 geometryClearcoatNormal = vec3( 0.0 );
#ifdef USE_CLEARCOAT
	geometryClearcoatNormal = clearcoatNormal;
#endif
#ifdef USE_IRIDESCENCE
	float dotNVi = saturate( dot( normal, geometryViewDir ) );
	if ( material.iridescenceThickness == 0.0 ) {
		material.iridescence = 0.0;
	} else {
		material.iridescence = saturate( material.iridescence );
	}
	if ( material.iridescence > 0.0 ) {
		vec3 iridescenceFresnelDielectric = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.specularColor );
		vec3 iridescenceFresnelMetallic = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.diffuseColor );
		material.iridescenceFresnel = mix( iridescenceFresnelDielectric, iridescenceFresnelMetallic, material.metalness );
		material.iridescenceF0Dielectric = Schlick_to_F0( iridescenceFresnelDielectric, 1.0, dotNVi );
		material.iridescenceF0Metallic = Schlick_to_F0( iridescenceFresnelMetallic, 1.0, dotNVi );
	}
#endif
#ifdef STANDARD
	float dotNVms = saturate( dot( geometryNormal, geometryViewDir ) );
	material.dfg = texture2D( dfgLUT, vec2( material.roughness, dotNVms ) ).rg;
	#if ( NUM_SUN_LIGHTS > 0 || NUM_DIR_LIGHTS > 0 || NUM_POINT_LIGHTS > 0 || NUM_SPOT_LIGHTS > 0 )
		float EssMs = material.dfg.x + material.dfg.y;
		material.multiScatteringCompensation = 1.0 + material.specularColorBlended * ( 1.0 / EssMs - 1.0 );
	#endif
#endif
IncidentLight directLight;
#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )
	PointLight pointLight;
	#if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {
		pointLight = pointLights[ i ];
		getPointLightInfo( pointLight, geometryPosition, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS ) && ( defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_BASIC ) )
		pointLightShadow = pointLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowIntensity, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )
	SpotLight spotLight;
	vec4 spotColor;
	vec3 spotLightCoord;
	bool inSpotLightMap;
	#if defined( USE_SHADOWMAP ) && NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {
		spotLight = spotLights[ i ];
		getSpotLightInfo( spotLight, geometryPosition, directLight );
		#if ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#define SPOT_LIGHT_MAP_INDEX UNROLLED_LOOP_INDEX
		#elif ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		#define SPOT_LIGHT_MAP_INDEX NUM_SPOT_LIGHT_MAPS
		#else
		#define SPOT_LIGHT_MAP_INDEX ( UNROLLED_LOOP_INDEX - NUM_SPOT_LIGHT_SHADOWS + NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#endif
		#if ( SPOT_LIGHT_MAP_INDEX < NUM_SPOT_LIGHT_MAPS )
			spotLightCoord = vSpotLightCoord[ i ].xyz / vSpotLightCoord[ i ].w;
			inSpotLightMap = all( lessThan( abs( spotLightCoord * 2. - 1. ), vec3( 1.0 ) ) );
			spotColor = texture2D( spotLightMap[ SPOT_LIGHT_MAP_INDEX ], spotLightCoord.xy );
			directLight.color = inSpotLightMap ? directLight.color * spotColor.rgb : directLight.color;
		#endif
		#undef SPOT_LIGHT_MAP_INDEX
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		spotLightShadow = spotLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowIntensity, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SUN_LIGHTS > 0 ) && defined( RE_Direct )
	SunLight sunLight;
	#if defined( USE_SHADOWMAP ) && NUM_SUN_LIGHT_SHADOWS > 0
	SunLightShadow sunLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SUN_LIGHTS; i ++ ) {
		sunLight = sunLights[ i ];
		getSunLightInfo( sunLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SUN_LIGHT_SHADOWS )
		sunLightShadow = sunLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getSunShadow( sunShadowMap[ i ], sunLightShadow, UNROLLED_LOOP_INDEX ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )
	DirectionalLight directionalLight;
	#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
		directionalLight = directionalLights[ i ];
		getDirectionalLightInfo( directionalLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )
		directionalLightShadow = directionalLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowIntensity, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )
	RectAreaLight rectAreaLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {
		rectAreaLight = rectAreaLights[ i ];
		RE_Direct_RectArea( rectAreaLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if defined( RE_IndirectDiffuse )
	vec3 iblIrradiance = vec3( 0.0 );
	vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );
	#if defined( USE_LIGHT_PROBES )
		irradiance += getLightProbeIrradiance( lightProbe, geometryNormal );
	#endif
	#if ( NUM_HEMI_LIGHTS > 0 )
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {
			irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal );
		}
		#pragma unroll_loop_end
	#endif
	#ifdef USE_LIGHT_PROBES_GRID
		vec3 probeWorldPos = ( ( vec4( geometryPosition, 1.0 ) - viewMatrix[ 3 ] ) * viewMatrix ).xyz;
		vec3 probeWorldNormal = transformNormalByInverseViewMatrix( geometryNormal, viewMatrix );
		irradiance += getLightProbeGridIrradiance( probeWorldPos, probeWorldNormal );
	#endif
#endif
#if defined( RE_IndirectSpecular )
	vec3 radiance = vec3( 0.0 );
	vec3 clearcoatRadiance = vec3( 0.0 );
#endif`,jp=`#if defined( RE_IndirectDiffuse )
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
		irradiance += lightMapIrradiance;
	#endif
	#if defined( USE_ENVMAP ) && defined( ENVMAP_TYPE_CUBE_UV )
		#if defined( STANDARD ) || defined( LAMBERT ) || defined( PHONG )
			iblIrradiance += getIBLIrradiance( geometryNormal );
		#endif
	#endif
#endif
#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )
	#ifdef USE_ANISOTROPY
		vec3 iblRadiance = getIBLAnisotropyRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
	#else
		vec3 iblRadiance = getIBLRadiance( geometryViewDir, geometryNormal, material.roughness );
	#endif
	#ifdef USE_RETROREFLECTION
		#ifdef USE_ANISOTROPY
			vec3 retroIBLRadiance = getIBLAnisotropyRetroRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
		#else
			vec3 retroIBLRadiance = getIBLRetroRadiance( geometryViewDir, geometryNormal, material.roughness );
		#endif
		iblRadiance = mix( iblRadiance, retroIBLRadiance, saturate( material.retroreflectivity ) );
	#endif
	radiance += iblRadiance;
	#ifdef USE_CLEARCOAT
		clearcoatRadiance += getIBLRadiance( geometryViewDir, geometryClearcoatNormal, material.clearcoatRoughness );
	#endif
#endif`,Qp=`#if defined( RE_IndirectDiffuse )
	#if defined( LAMBERT ) || defined( PHONG )
		irradiance += iblIrradiance;
	#endif
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,tm=`#ifdef USE_LIGHT_PROBES_GRID
uniform highp sampler3D probesSH;
uniform vec3 probesMin;
uniform vec3 probesMax;
uniform vec3 probesResolution;
vec3 getLightProbeGridIrradiance( vec3 worldPos, vec3 worldNormal ) {
	vec3 res = probesResolution;
	vec3 gridRange = probesMax - probesMin;
	vec3 resMinusOne = res - 1.0;
	vec3 probeSpacing = gridRange / resMinusOne;
	vec3 samplePos = worldPos + worldNormal * probeSpacing * 0.5;
	vec3 uvw = clamp( ( samplePos - probesMin ) / gridRange, 0.0, 1.0 );
	uvw = uvw * resMinusOne / res + 0.5 / res;
	float nz          = res.z;
	float paddedSlices = nz + 2.0;
	float atlasDepth  = 7.0 * paddedSlices;
	float uvZBase     = uvw.z * nz + 1.0;
	vec4 s0 = texture( probesSH, vec3( uvw.xy, ( uvZBase                       ) / atlasDepth ) );
	vec4 s1 = texture( probesSH, vec3( uvw.xy, ( uvZBase +       paddedSlices   ) / atlasDepth ) );
	vec4 s2 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 2.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s3 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 3.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s4 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 4.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s5 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 5.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s6 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 6.0 * paddedSlices   ) / atlasDepth ) );
	vec3 c0 = s0.xyz;
	vec3 c1 = vec3( s0.w, s1.xy );
	vec3 c2 = vec3( s1.zw, s2.x );
	vec3 c3 = s2.yzw;
	vec3 c4 = s3.xyz;
	vec3 c5 = vec3( s3.w, s4.xy );
	vec3 c6 = vec3( s4.zw, s5.x );
	vec3 c7 = s5.yzw;
	vec3 c8 = s6.xyz;
	float x = worldNormal.x, y = worldNormal.y, z = worldNormal.z;
	vec3 result = c0 * 0.886227;
	result += c1 * 2.0 * 0.511664 * y;
	result += c2 * 2.0 * 0.511664 * z;
	result += c3 * 2.0 * 0.511664 * x;
	result += c4 * 2.0 * 0.429043 * x * y;
	result += c5 * 2.0 * 0.429043 * y * z;
	result += c6 * ( 0.743125 * z * z - 0.247708 );
	result += c7 * 2.0 * 0.429043 * x * z;
	result += c8 * 0.429043 * ( x * x - y * y );
	return max( result, vec3( 0.0 ) );
}
#endif`,em=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,nm=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,im=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,sm=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,om=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,rm=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,am=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
	#if defined( USE_POINTS_UV )
		vec2 uv = vUv;
	#else
		vec2 uv = ( uvTransform * vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;
	#endif
#endif
#ifdef USE_MAP
	diffuseColor *= texture2D( map, uv );
#endif
#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, uv ).g;
#endif`,cm=`#if defined( USE_POINTS_UV )
	varying vec2 vUv;
#else
	#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
		uniform mat3 uvTransform;
	#endif
#endif
#ifdef USE_MAP
	uniform sampler2D map;
#endif
#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,lm=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,hm=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,um=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,dm=`#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,fm=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,pm=`#ifdef USE_MORPHTARGETS
	#ifndef USE_INSTANCING_MORPH
		uniform float morphTargetBaseInfluence;
		uniform float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	#endif
	uniform sampler2DArray morphTargetsTexture;
	uniform ivec2 morphTargetsTextureSize;
	vec4 getMorph( const in int vertexIndex, const in int morphTargetIndex, const in int offset ) {
		int texelIndex = vertexIndex * MORPHTARGETS_TEXTURE_STRIDE + offset;
		int y = texelIndex / morphTargetsTextureSize.x;
		int x = texelIndex - y * morphTargetsTextureSize.x;
		ivec3 morphUV = ivec3( x, y, morphTargetIndex );
		return texelFetch( morphTargetsTexture, morphUV, 0 );
	}
#endif`,mm=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,gm=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
#ifdef FLAT_SHADED
	vec3 fdx = dFdx( vViewPosition );
	vec3 fdy = dFdy( vViewPosition );
	vec3 normal = normalize( cross( fdx, fdy ) );
#else
	vec3 normal = normalize( vNormal );
	#ifdef DOUBLE_SIDED
		normal *= faceDirection;
	#endif
#endif
#if defined( USE_NORMALMAP_TANGENTSPACE ) || defined( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY )
	#ifdef USE_TANGENT
		mat3 tbn = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn = getTangentFrame( - vViewPosition, normal,
		#if defined( USE_NORMALMAP )
			vNormalMapUv
		#elif defined( USE_CLEARCOAT_NORMALMAP )
			vClearcoatNormalMapUv
		#else
			vUv
		#endif
		);
	#endif
	#ifdef DOUBLE_SIDED
		tbn[0] *= faceDirection;
		tbn[1] *= faceDirection;
	#endif
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	#ifdef USE_TANGENT
		mat3 tbn2 = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn2 = getTangentFrame( - vViewPosition, normal, vClearcoatNormalMapUv );
	#endif
	#ifdef DOUBLE_SIDED
		tbn2[0] *= faceDirection;
		tbn2[1] *= faceDirection;
	#endif
#endif
vec3 nonPerturbedNormal = normal;`,xm=`#ifdef USE_NORMALMAP_OBJECTSPACE
	normal = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#ifdef FLIP_SIDED
		normal = - normal;
	#endif
	#ifdef DOUBLE_SIDED
		normal = normal * faceDirection;
	#endif
	normal = normalize( normalMatrix * normal );
#elif defined( USE_NORMALMAP_TANGENTSPACE )
	vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#if defined( USE_PACKED_NORMALMAP )
		mapN = vec3( mapN.xy, sqrt( saturate( 1.0 - dot( mapN.xy, mapN.xy ) ) ) );
	#endif
	mapN.xy *= normalScale;
	normal = normalize( tbn * mapN );
#elif defined( USE_BUMPMAP )
	normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );
#endif`,ym=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,vm=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,_m=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
		#ifdef FLIP_SIDED
			vBitangent = - vBitangent;
		#endif
	#endif
#endif`,Mm=`#ifdef USE_NORMALMAP
	uniform sampler2D normalMap;
	uniform vec2 normalScale;
#endif
#ifdef USE_NORMALMAP_OBJECTSPACE
	uniform mat3 normalMatrix;
#endif
#if ! defined ( USE_TANGENT ) && ( defined ( USE_NORMALMAP_TANGENTSPACE ) || defined ( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY ) )
	mat3 getTangentFrame( vec3 eye_pos, vec3 surf_norm, vec2 uv ) {
		vec3 q0 = dFdx( eye_pos.xyz );
		vec3 q1 = dFdy( eye_pos.xyz );
		vec2 st0 = dFdx( uv.st );
		vec2 st1 = dFdy( uv.st );
		vec3 N = surf_norm;
		vec3 q1perp = cross( q1, N );
		vec3 q0perp = cross( N, q0 );
		vec3 T = q1perp * st0.x + q0perp * st1.x;
		vec3 B = q1perp * st0.y + q0perp * st1.y;
		float det = max( dot( T, T ), dot( B, B ) );
		float scale = ( det == 0.0 ) ? 0.0 : inversesqrt( det );
		return mat3( T * scale, B * scale, N );
	}
#endif`,Em=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,wm=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,bm=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,Sm=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,Tm=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,Rm=`vec3 packNormalToRGB( const in vec3 normal ) {
	return normalize( normal ) * 0.5 + 0.5;
}
vec3 unpackRGBToNormal( const in vec3 rgb ) {
	return 2.0 * rgb.xyz - 1.0;
}
const float PackUpscale = 256. / 255.;const float UnpackDownscale = 255. / 256.;const float ShiftRight8 = 1. / 256.;
const float Inv255 = 1. / 255.;
const vec4 PackFactors = vec4( 1.0, 256.0, 256.0 * 256.0, 256.0 * 256.0 * 256.0 );
const vec2 UnpackFactors2 = vec2( UnpackDownscale, 1.0 / PackFactors.g );
const vec3 UnpackFactors3 = vec3( UnpackDownscale / PackFactors.rg, 1.0 / PackFactors.b );
const vec4 UnpackFactors4 = vec4( UnpackDownscale / PackFactors.rgb, 1.0 / PackFactors.a );
vec4 packDepthToRGBA( const in float v ) {
	if( v <= 0.0 )
		return vec4( 0., 0., 0., 0. );
	if( v >= 1.0 )
		return vec4( 1., 1., 1., 1. );
	float vuf;
	float af = modf( v * PackFactors.a, vuf );
	float bf = modf( vuf * ShiftRight8, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec4( vuf * Inv255, gf * PackUpscale, bf * PackUpscale, af );
}
vec3 packDepthToRGB( const in float v ) {
	if( v <= 0.0 )
		return vec3( 0., 0., 0. );
	if( v >= 1.0 )
		return vec3( 1., 1., 1. );
	float vuf;
	float bf = modf( v * PackFactors.b, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec3( vuf * Inv255, gf * PackUpscale, bf );
}
vec2 packDepthToRG( const in float v ) {
	if( v <= 0.0 )
		return vec2( 0., 0. );
	if( v >= 1.0 )
		return vec2( 1., 1. );
	float vuf;
	float gf = modf( v * 256., vuf );
	return vec2( vuf * Inv255, gf );
}
float unpackRGBAToDepth( const in vec4 v ) {
	return dot( v, UnpackFactors4 );
}
float unpackRGBToDepth( const in vec3 v ) {
	return dot( v, UnpackFactors3 );
}
float unpackRGToDepth( const in vec2 v ) {
	return v.r * UnpackFactors2.r + v.g * UnpackFactors2.g;
}
vec4 pack2HalfToRGBA( const in vec2 v ) {
	vec4 r = vec4( v.x, fract( v.x * 255.0 ), v.y, fract( v.y * 255.0 ) );
	return vec4( r.x - r.y / 255.0, r.y, r.z - r.w / 255.0, r.w );
}
vec2 unpackRGBATo2Half( const in vec4 v ) {
	return vec2( v.x + ( v.y / 255.0 ), v.z + ( v.w / 255.0 ) );
}
float viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {
	return ( viewZ + near ) / ( near - far );
}
float orthographicDepthToViewZ( const in float depth, const in float near, const in float far ) {
	#ifdef USE_REVERSED_DEPTH_BUFFER
	
		return depth * ( far - near ) - far;
	#else
		return depth * ( near - far ) - near;
	#endif
}
float viewZToPerspectiveDepth( const in float viewZ, const in float near, const in float far ) {
	return ( ( near + viewZ ) * far ) / ( ( far - near ) * viewZ );
}
float perspectiveDepthToViewZ( const in float depth, const in float near, const in float far ) {
	
	#ifdef USE_REVERSED_DEPTH_BUFFER
		return ( near * far ) / ( ( near - far ) * depth - near );
	#else
		return ( near * far ) / ( ( far - near ) * depth - far );
	#endif
}`,Am=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,Cm=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,Pm=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,Im=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,Dm=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,Lm=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,Nm=`#if NUM_SPOT_LIGHT_COORDS > 0
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#if NUM_SPOT_LIGHT_MAPS > 0
	uniform sampler2D spotLightMap[ NUM_SPOT_LIGHT_MAPS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_SUN_LIGHT_SHADOWS > 0
		#define SUN_LIGHT_CASCADES 2
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow sunShadowMap[ NUM_SUN_LIGHT_SHADOWS ];
		#else
			uniform sampler2D sunShadowMap[ NUM_SUN_LIGHT_SHADOWS ];
		#endif
		uniform mat4 sunShadowMatrix[ NUM_SUN_LIGHT_SHADOWS * SUN_LIGHT_CASCADES ];
		uniform vec4 sunShadowCascade[ NUM_SUN_LIGHT_SHADOWS * SUN_LIGHT_CASCADES ];
		varying vec4 vSunShadowWorldPosition;
		varying vec3 vSunShadowWorldNormal;
		struct SunLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SunLightShadow sunLightShadows[ NUM_SUN_LIGHT_SHADOWS ];
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		#else
			uniform sampler2D directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		#endif
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		#else
			uniform sampler2D spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		#endif
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform samplerCubeShadow pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		#elif defined( SHADOWMAP_TYPE_BASIC )
			uniform samplerCube pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		#endif
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
	#if defined( SHADOWMAP_TYPE_PCF )
		float interleavedGradientNoise( vec2 position ) {
			return fract( 52.9829189 * fract( dot( position, vec2( 0.06711056, 0.00583715 ) ) ) );
		}
		vec2 vogelDiskSample( int sampleIndex, int samplesCount, float phi ) {
			const float goldenAngle = 2.399963229728653;
			float r = sqrt( ( float( sampleIndex ) + 0.5 ) / float( samplesCount ) );
			float theta = float( sampleIndex ) * goldenAngle + phi;
			return vec2( cos( theta ), sin( theta ) ) * r;
		}
	#endif
	#if defined( SHADOWMAP_TYPE_PCF )
		float getShadow( sampler2DShadow shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			shadowCoord.z += shadowBias;
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
				float radius = shadowRadius * texelSize.x;
				float phi = interleavedGradientNoise( gl_FragCoord.xy ) * PI2;
				shadow = (
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 0, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 1, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 2, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 3, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 4, 5, phi ) * radius, shadowCoord.z ) )
				) * 0.2;
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#elif defined( SHADOWMAP_TYPE_VSM )
		float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				shadowCoord.z -= shadowBias;
			#else
				shadowCoord.z += shadowBias;
			#endif
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				vec2 distribution = texture2D( shadowMap, shadowCoord.xy ).rg;
				float mean = distribution.x;
				float variance = distribution.y * distribution.y;
				#ifdef USE_REVERSED_DEPTH_BUFFER
					float hard_shadow = step( mean, shadowCoord.z );
				#else
					float hard_shadow = step( shadowCoord.z, mean );
				#endif
				
				if ( hard_shadow == 1.0 ) {
					shadow = 1.0;
				} else {
					variance = max( variance, 0.0000001 );
					float d = shadowCoord.z - mean;
					float p_max = variance / ( variance + d * d );
					p_max = clamp( ( p_max - 0.3 ) / 0.65, 0.0, 1.0 );
					shadow = max( hard_shadow, p_max );
				}
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#else
		float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				shadowCoord.z -= shadowBias;
			#else
				shadowCoord.z += shadowBias;
			#endif
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				float depth = texture2D( shadowMap, shadowCoord.xy ).r;
				#ifdef USE_REVERSED_DEPTH_BUFFER
					shadow = step( depth, shadowCoord.z );
				#else
					shadow = step( shadowCoord.z, depth );
				#endif
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#endif
	#if NUM_SUN_LIGHT_SHADOWS > 0
		float getSunShadow(
			#if defined( SHADOWMAP_TYPE_PCF )
				sampler2DShadow shadowMap,
			#else
				sampler2D shadowMap,
			#endif
			SunLightShadow sunLightShadow,
			int shadowIndex
		) {
			vec4 shadowWorldPosition = vec4( vSunShadowWorldPosition.xyz + vSunShadowWorldNormal * sunLightShadow.shadowNormalBias, 1.0 );
			float viewDepth = vSunShadowWorldPosition.w;
			int cascadeOffset = shadowIndex * SUN_LIGHT_CASCADES;
			float shadow = 1.0;
			for ( int i = SUN_LIGHT_CASCADES - 1; i >= 0; i -- ) {
				vec4 cascade = sunShadowCascade[ cascadeOffset + i ];
				if ( viewDepth >= cascade.x && viewDepth < cascade.y ) {
					float cascadeShadow = getShadow(
						shadowMap,
						sunLightShadow.shadowMapSize,
						sunLightShadow.shadowIntensity,
						sunLightShadow.shadowBias,
						sunLightShadow.shadowRadius,
						sunShadowMatrix[ cascadeOffset + i ] * shadowWorldPosition
					);
					shadow = mix( cascadeShadow, shadow, smoothstep( cascade.z, cascade.y, viewDepth ) );
				}
			}
			return shadow;
		}
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
	#if defined( SHADOWMAP_TYPE_PCF )
	float getPointShadow( samplerCubeShadow shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		vec3 bd3D = normalize( lightToPosition );
		vec3 absVec = abs( lightToPosition );
		float viewSpaceZ = max( max( absVec.x, absVec.y ), absVec.z );
		if ( viewSpaceZ - shadowCameraFar <= 0.0 && viewSpaceZ - shadowCameraNear >= 0.0 ) {
			#ifdef USE_REVERSED_DEPTH_BUFFER
				float dp = ( shadowCameraNear * ( shadowCameraFar - viewSpaceZ ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
				dp -= shadowBias;
			#else
				float dp = ( shadowCameraFar * ( viewSpaceZ - shadowCameraNear ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
				dp += shadowBias;
			#endif
			float texelSize = shadowRadius / shadowMapSize.x;
			vec3 absDir = abs( bd3D );
			vec3 tangent = absDir.x > absDir.z ? vec3( 0.0, 1.0, 0.0 ) : vec3( 1.0, 0.0, 0.0 );
			tangent = normalize( cross( bd3D, tangent ) );
			vec3 bitangent = cross( bd3D, tangent );
			float phi = interleavedGradientNoise( gl_FragCoord.xy ) * PI2;
			vec2 sample0 = vogelDiskSample( 0, 5, phi );
			vec2 sample1 = vogelDiskSample( 1, 5, phi );
			vec2 sample2 = vogelDiskSample( 2, 5, phi );
			vec2 sample3 = vogelDiskSample( 3, 5, phi );
			vec2 sample4 = vogelDiskSample( 4, 5, phi );
			shadow = (
				texture( shadowMap, vec4( bd3D + ( tangent * sample0.x + bitangent * sample0.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample1.x + bitangent * sample1.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample2.x + bitangent * sample2.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample3.x + bitangent * sample3.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample4.x + bitangent * sample4.y ) * texelSize, dp ) )
			) * 0.2;
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	#elif defined( SHADOWMAP_TYPE_BASIC )
	float getPointShadow( samplerCube shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		vec3 absVec = abs( lightToPosition );
		float viewSpaceZ = max( max( absVec.x, absVec.y ), absVec.z );
		if ( viewSpaceZ - shadowCameraFar <= 0.0 && viewSpaceZ - shadowCameraNear >= 0.0 ) {
			float dp = ( shadowCameraFar * ( viewSpaceZ - shadowCameraNear ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
			dp += shadowBias;
			vec3 bd3D = normalize( lightToPosition );
			float depth = textureCube( shadowMap, bd3D ).r;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				depth = 1.0 - depth;
			#endif
			shadow = step( dp, depth );
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	#endif
	#endif
#endif`,Hm=`#if NUM_SPOT_LIGHT_COORDS > 0
	uniform mat4 spotLightMatrix[ NUM_SPOT_LIGHT_COORDS ];
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_SUN_LIGHT_SHADOWS > 0
		varying vec4 vSunShadowWorldPosition;
		varying vec3 vSunShadowWorldNormal;
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform mat4 directionalShadowMatrix[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform mat4 pointShadowMatrix[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
#endif`,Um=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_SUN_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
	#ifdef HAS_NORMAL
		vec3 shadowWorldNormal = transformNormalByInverseViewMatrix( transformedNormal, viewMatrix );
	#else
		vec3 shadowWorldNormal = vec3( 0.0 );
	#endif
	vec4 shadowWorldPosition;
#endif
#if defined( USE_SHADOWMAP )
	#if NUM_SUN_LIGHT_SHADOWS > 0
		vSunShadowWorldPosition = vec4( worldPosition.xyz, - mvPosition.z );
		vSunShadowWorldNormal = shadowWorldNormal;
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * directionalLightShadows[ i ].shadowNormalBias, 0 );
			vDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * pointLightShadows[ i ].shadowNormalBias, 0 );
			vPointShadowCoord[ i ] = pointShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
#endif
#if NUM_SPOT_LIGHT_COORDS > 0
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_COORDS; i ++ ) {
		shadowWorldPosition = worldPosition;
		#if ( defined( USE_SHADOWMAP ) && UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
			shadowWorldPosition.xyz += shadowWorldNormal * spotLightShadows[ i ].shadowNormalBias;
		#endif
		vSpotLightCoord[ i ] = spotLightMatrix[ i ] * shadowWorldPosition;
	}
	#pragma unroll_loop_end
#endif`,km=`float getShadowMask() {
	float shadow = 1.0;
	#ifdef USE_SHADOWMAP
	#if NUM_SUN_LIGHT_SHADOWS > 0
	SunLightShadow sunLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SUN_LIGHT_SHADOWS; i ++ ) {
		sunLight = sunLightShadows[ i ];
		shadow *= receiveShadow ? getSunShadow( sunShadowMap[ i ], sunLight, UNROLLED_LOOP_INDEX ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
		directionalLight = directionalLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowIntensity, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_SHADOWS; i ++ ) {
		spotLight = spotLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowIntensity, spotLight.shadowBias, spotLight.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0 && ( defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_BASIC ) )
	PointLightShadow pointLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
		pointLight = pointLightShadows[ i ];
		shadow *= receiveShadow ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowIntensity, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ], pointLight.shadowCameraNear, pointLight.shadowCameraFar ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#endif
	return shadow;
}`,Fm=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,zm=`#ifdef USE_SKINNING
	uniform mat4 bindMatrix;
	uniform mat4 bindMatrixInverse;
	uniform highp sampler2D boneTexture;
	mat4 getBoneMatrix( const in float i ) {
		int size = textureSize( boneTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( boneTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( boneTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( boneTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( boneTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
#endif`,Om=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,Vm=`#ifdef USE_SKINNING
	mat4 skinMatrix = mat4( 0.0 );
	skinMatrix += skinWeight.x * boneMatX;
	skinMatrix += skinWeight.y * boneMatY;
	skinMatrix += skinWeight.z * boneMatZ;
	skinMatrix += skinWeight.w * boneMatW;
	skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;
	objectNormal = vec4( skinMatrix * vec4( objectNormal, 0.0 ) ).xyz;
	#ifdef USE_TANGENT
		objectTangent = vec4( skinMatrix * vec4( objectTangent, 0.0 ) ).xyz;
	#endif
#endif`,Bm=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,Gm=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,Wm=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,Xm=`#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
uniform float toneMappingExposure;
vec3 LinearToneMapping( vec3 color ) {
	return saturate( toneMappingExposure * color );
}
vec3 ReinhardToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	return saturate( color / ( vec3( 1.0 ) + color ) );
}
vec3 CineonToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	color = max( vec3( 0.0 ), color - 0.004 );
	return pow( ( color * ( 6.2 * color + 0.5 ) ) / ( color * ( 6.2 * color + 1.7 ) + 0.06 ), vec3( 2.2 ) );
}
vec3 RRTAndODTFit( vec3 v ) {
	vec3 a = v * ( v + 0.0245786 ) - 0.000090537;
	vec3 b = v * ( 0.983729 * v + 0.4329510 ) + 0.238081;
	return a / b;
}
vec3 ACESFilmicToneMapping( vec3 color ) {
	const mat3 ACESInputMat = mat3(
		vec3( 0.59719, 0.07600, 0.02840 ),		vec3( 0.35458, 0.90834, 0.13383 ),
		vec3( 0.04823, 0.01566, 0.83777 )
	);
	const mat3 ACESOutputMat = mat3(
		vec3(  1.60475, -0.10208, -0.00327 ),		vec3( -0.53108,  1.10813, -0.07276 ),
		vec3( -0.07367, -0.00605,  1.07602 )
	);
	color *= toneMappingExposure / 0.6;
	color = ACESInputMat * color;
	color = RRTAndODTFit( color );
	color = ACESOutputMat * color;
	return saturate( color );
}
const mat3 LINEAR_REC2020_TO_LINEAR_SRGB = mat3(
	vec3( 1.6605, - 0.1246, - 0.0182 ),
	vec3( - 0.5876, 1.1329, - 0.1006 ),
	vec3( - 0.0728, - 0.0083, 1.1187 )
);
const mat3 LINEAR_SRGB_TO_LINEAR_REC2020 = mat3(
	vec3( 0.6274, 0.0691, 0.0164 ),
	vec3( 0.3293, 0.9195, 0.0880 ),
	vec3( 0.0433, 0.0113, 0.8956 )
);
vec3 agxDefaultContrastApprox( vec3 x ) {
	vec3 x2 = x * x;
	vec3 x4 = x2 * x2;
	return + 15.5 * x4 * x2
		- 40.14 * x4 * x
		+ 31.96 * x4
		- 6.868 * x2 * x
		+ 0.4298 * x2
		+ 0.1191 * x
		- 0.00232;
}
vec3 AgXToneMapping( vec3 color ) {
	const mat3 AgXInsetMatrix = mat3(
		vec3( 0.856627153315983, 0.137318972929847, 0.11189821299995 ),
		vec3( 0.0951212405381588, 0.761241990602591, 0.0767994186031903 ),
		vec3( 0.0482516061458583, 0.101439036467562, 0.811302368396859 )
	);
	const mat3 AgXOutsetMatrix = mat3(
		vec3( 1.1271005818144368, - 0.1413297634984383, - 0.14132976349843826 ),
		vec3( - 0.11060664309660323, 1.157823702216272, - 0.11060664309660294 ),
		vec3( - 0.016493938717834573, - 0.016493938717834257, 1.2519364065950405 )
	);
	const float AgxMinEv = - 12.47393;	const float AgxMaxEv = 4.026069;
	color *= toneMappingExposure;
	color = LINEAR_SRGB_TO_LINEAR_REC2020 * color;
	color = AgXInsetMatrix * color;
	color = max( color, 1e-10 );	color = log2( color );
	color = ( color - AgxMinEv ) / ( AgxMaxEv - AgxMinEv );
	color = clamp( color, 0.0, 1.0 );
	color = agxDefaultContrastApprox( color );
	color = AgXOutsetMatrix * color;
	color = pow( max( vec3( 0.0 ), color ), vec3( 2.2 ) );
	color = LINEAR_REC2020_TO_LINEAR_SRGB * color;
	color = clamp( color, 0.0, 1.0 );
	return color;
}
vec3 NeutralToneMapping( vec3 color ) {
	const float StartCompression = 0.8 - 0.04;
	const float Desaturation = 0.15;
	color *= toneMappingExposure;
	float x = min( color.r, min( color.g, color.b ) );
	float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
	color -= offset;
	float peak = max( color.r, max( color.g, color.b ) );
	if ( peak < StartCompression ) return color;
	float d = 1. - StartCompression;
	float newPeak = 1. - d * d / ( peak + d - StartCompression );
	color *= newPeak / peak;
	float g = 1. - 1. / ( Desaturation * ( peak - newPeak ) + 1. );
	return mix( color, vec3( newPeak ), g );
}
vec3 CustomToneMapping( vec3 color ) { return color; }`,qm=`#ifdef USE_TRANSMISSION
	material.transmission = transmission;
	material.transmissionAlpha = 1.0;
	material.thickness = thickness;
	material.attenuationDistance = attenuationDistance;
	material.attenuationColor = attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		material.transmission *= texture2D( transmissionMap, vTransmissionMapUv ).r;
	#endif
	#ifdef USE_THICKNESSMAP
		material.thickness *= texture2D( thicknessMap, vThicknessMapUv ).g;
	#endif
	vec3 pos = vWorldPosition;
	vec3 v = normalize( cameraPosition - pos );
	vec3 n = transformNormalByInverseViewMatrix( normal, viewMatrix );
	vec4 transmitted = getIBLVolumeRefraction(
		n, v, material.roughness, material.diffuseContribution, material.specularColorBlended, material.specularF90,
		pos, modelMatrix, viewMatrix, projectionMatrix, material.dispersion, material.ior, material.thickness,
		material.attenuationColor, material.attenuationDistance );
	material.transmissionAlpha = mix( material.transmissionAlpha, transmitted.a, material.transmission );
	totalDiffuse = mix( totalDiffuse, transmitted.rgb, material.transmission );
#endif`,Ym=`#ifdef USE_TRANSMISSION
	uniform float transmission;
	uniform float thickness;
	uniform float attenuationDistance;
	uniform vec3 attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		uniform sampler2D transmissionMap;
	#endif
	#ifdef USE_THICKNESSMAP
		uniform sampler2D thicknessMap;
	#endif
	uniform vec2 transmissionSamplerSize;
	uniform sampler2D transmissionSamplerMap;
	uniform mat4 modelMatrix;
	uniform mat4 projectionMatrix;
	varying vec3 vWorldPosition;
	float w0( float a ) {
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - a + 3.0 ) - 3.0 ) + 1.0 );
	}
	float w1( float a ) {
		return ( 1.0 / 6.0 ) * ( a *  a * ( 3.0 * a - 6.0 ) + 4.0 );
	}
	float w2( float a ){
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - 3.0 * a + 3.0 ) + 3.0 ) + 1.0 );
	}
	float w3( float a ) {
		return ( 1.0 / 6.0 ) * ( a * a * a );
	}
	float g0( float a ) {
		return w0( a ) + w1( a );
	}
	float g1( float a ) {
		return w2( a ) + w3( a );
	}
	float h0( float a ) {
		return - 1.0 + w1( a ) / ( w0( a ) + w1( a ) );
	}
	float h1( float a ) {
		return 1.0 + w3( a ) / ( w2( a ) + w3( a ) );
	}
	vec4 bicubic( sampler2D tex, vec2 uv, vec4 texelSize, float lod ) {
		uv = uv * texelSize.zw + 0.5;
		vec2 iuv = floor( uv );
		vec2 fuv = fract( uv );
		float g0x = g0( fuv.x );
		float g1x = g1( fuv.x );
		float h0x = h0( fuv.x );
		float h1x = h1( fuv.x );
		float h0y = h0( fuv.y );
		float h1y = h1( fuv.y );
		vec2 p0 = ( vec2( iuv.x + h0x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p1 = ( vec2( iuv.x + h1x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p2 = ( vec2( iuv.x + h0x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		vec2 p3 = ( vec2( iuv.x + h1x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		return g0( fuv.y ) * ( g0x * textureLod( tex, p0, lod ) + g1x * textureLod( tex, p1, lod ) ) +
			g1( fuv.y ) * ( g0x * textureLod( tex, p2, lod ) + g1x * textureLod( tex, p3, lod ) );
	}
	vec4 textureBicubic( sampler2D sampler, vec2 uv, float lod ) {
		vec2 fLodSize = vec2( textureSize( sampler, int( lod ) ) );
		vec2 cLodSize = vec2( textureSize( sampler, int( lod + 1.0 ) ) );
		vec2 fLodSizeInv = 1.0 / fLodSize;
		vec2 cLodSizeInv = 1.0 / cLodSize;
		vec4 fSample = bicubic( sampler, uv, vec4( fLodSizeInv, fLodSize ), floor( lod ) );
		vec4 cSample = bicubic( sampler, uv, vec4( cLodSizeInv, cLodSize ), ceil( lod ) );
		return mix( fSample, cSample, fract( lod ) );
	}
	vec3 getVolumeTransmissionRay( const in vec3 n, const in vec3 v, const in float thickness, const in float ior, const in mat4 modelMatrix ) {
		vec3 refractionVector = refract( - v, normalize( n ), 1.0 / ior );
		vec3 modelScale;
		modelScale.x = length( vec3( modelMatrix[ 0 ].xyz ) );
		modelScale.y = length( vec3( modelMatrix[ 1 ].xyz ) );
		modelScale.z = length( vec3( modelMatrix[ 2 ].xyz ) );
		return normalize( refractionVector ) * thickness * modelScale;
	}
	float applyIorToRoughness( const in float roughness, const in float ior ) {
		return roughness * clamp( ior * 2.0 - 2.0, 0.0, 1.0 );
	}
	vec4 getTransmissionSample( const in vec2 fragCoord, const in float roughness, const in float ior ) {
		float lod = log2( transmissionSamplerSize.x ) * applyIorToRoughness( roughness, ior );
		return textureBicubic( transmissionSamplerMap, fragCoord.xy, lod );
	}
	vec3 volumeAttenuation( const in float transmissionDistance, const in vec3 attenuationColor, const in float attenuationDistance ) {
		if ( isinf( attenuationDistance ) ) {
			return vec3( 1.0 );
		} else {
			vec3 attenuationCoefficient = -log( attenuationColor ) / attenuationDistance;
			vec3 transmittance = exp( - attenuationCoefficient * transmissionDistance );			return transmittance;
		}
	}
	vec4 getIBLVolumeRefraction( const in vec3 n, const in vec3 v, const in float roughness, const in vec3 diffuseColor,
		const in vec3 specularColor, const in float specularF90, const in vec3 position, const in mat4 modelMatrix,
		const in mat4 viewMatrix, const in mat4 projMatrix, const in float dispersion, const in float ior, const in float thickness,
		const in vec3 attenuationColor, const in float attenuationDistance ) {
		vec4 transmittedLight;
		vec3 transmittance;
		#ifdef USE_DISPERSION
			float halfSpread = ( ior - 1.0 ) * 0.025 * dispersion;
			vec3 iors = vec3( ior - halfSpread, ior, ior + halfSpread );
			for ( int i = 0; i < 3; i ++ ) {
				vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, iors[ i ], modelMatrix );
				vec3 refractedRayExit = position + transmissionRay;
				vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
				vec2 refractionCoords = ndcPos.xy / ndcPos.w;
				refractionCoords += 1.0;
				refractionCoords /= 2.0;
				vec4 transmissionSample = getTransmissionSample( refractionCoords, roughness, iors[ i ] );
				transmittedLight[ i ] = transmissionSample[ i ];
				transmittedLight.a += transmissionSample.a;
				transmittance[ i ] = diffuseColor[ i ] * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance )[ i ];
			}
			transmittedLight.a /= 3.0;
		#else
			vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, ior, modelMatrix );
			vec3 refractedRayExit = position + transmissionRay;
			vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
			vec2 refractionCoords = ndcPos.xy / ndcPos.w;
			refractionCoords += 1.0;
			refractionCoords /= 2.0;
			transmittedLight = getTransmissionSample( refractionCoords, roughness, ior );
			transmittance = diffuseColor * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance );
		#endif
		vec3 attenuatedColor = transmittance * transmittedLight.rgb;
		vec3 F = EnvironmentBRDF( n, v, specularColor, specularF90, roughness );
		float transmittanceFactor = ( transmittance.r + transmittance.g + transmittance.b ) / 3.0;
		return vec4( ( 1.0 - F ) * attenuatedColor, 1.0 - ( 1.0 - transmittedLight.a ) * transmittanceFactor );
	}
#endif`,Zm=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_SPECULARMAP
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,$m=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	uniform mat3 mapTransform;
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	uniform mat3 alphaMapTransform;
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	uniform mat3 lightMapTransform;
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	uniform mat3 aoMapTransform;
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	uniform mat3 bumpMapTransform;
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	uniform mat3 normalMapTransform;
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_DISPLACEMENTMAP
	uniform mat3 displacementMapTransform;
	varying vec2 vDisplacementMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	uniform mat3 emissiveMapTransform;
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	uniform mat3 metalnessMapTransform;
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	uniform mat3 roughnessMapTransform;
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	uniform mat3 anisotropyMapTransform;
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	uniform mat3 clearcoatMapTransform;
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform mat3 clearcoatNormalMapTransform;
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform mat3 clearcoatRoughnessMapTransform;
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	uniform mat3 sheenColorMapTransform;
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	uniform mat3 sheenRoughnessMapTransform;
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	uniform mat3 iridescenceMapTransform;
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform mat3 iridescenceThicknessMapTransform;
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SPECULARMAP
	uniform mat3 specularMapTransform;
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	uniform mat3 specularColorMapTransform;
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	uniform mat3 specularIntensityMapTransform;
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,Km=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	vUv = vec3( uv, 1 ).xy;
#endif
#ifdef USE_MAP
	vMapUv = ( mapTransform * vec3( MAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ALPHAMAP
	vAlphaMapUv = ( alphaMapTransform * vec3( ALPHAMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_LIGHTMAP
	vLightMapUv = ( lightMapTransform * vec3( LIGHTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_AOMAP
	vAoMapUv = ( aoMapTransform * vec3( AOMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_BUMPMAP
	vBumpMapUv = ( bumpMapTransform * vec3( BUMPMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_NORMALMAP
	vNormalMapUv = ( normalMapTransform * vec3( NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_DISPLACEMENTMAP
	vDisplacementMapUv = ( displacementMapTransform * vec3( DISPLACEMENTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_EMISSIVEMAP
	vEmissiveMapUv = ( emissiveMapTransform * vec3( EMISSIVEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_METALNESSMAP
	vMetalnessMapUv = ( metalnessMapTransform * vec3( METALNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ROUGHNESSMAP
	vRoughnessMapUv = ( roughnessMapTransform * vec3( ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ANISOTROPYMAP
	vAnisotropyMapUv = ( anisotropyMapTransform * vec3( ANISOTROPYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOATMAP
	vClearcoatMapUv = ( clearcoatMapTransform * vec3( CLEARCOATMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	vClearcoatNormalMapUv = ( clearcoatNormalMapTransform * vec3( CLEARCOAT_NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	vClearcoatRoughnessMapUv = ( clearcoatRoughnessMapTransform * vec3( CLEARCOAT_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCEMAP
	vIridescenceMapUv = ( iridescenceMapTransform * vec3( IRIDESCENCEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	vIridescenceThicknessMapUv = ( iridescenceThicknessMapTransform * vec3( IRIDESCENCE_THICKNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_COLORMAP
	vSheenColorMapUv = ( sheenColorMapTransform * vec3( SHEEN_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	vSheenRoughnessMapUv = ( sheenRoughnessMapTransform * vec3( SHEEN_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULARMAP
	vSpecularMapUv = ( specularMapTransform * vec3( SPECULARMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_COLORMAP
	vSpecularColorMapUv = ( specularColorMapTransform * vec3( SPECULAR_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	vSpecularIntensityMapUv = ( specularIntensityMapTransform * vec3( SPECULAR_INTENSITYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_TRANSMISSIONMAP
	vTransmissionMapUv = ( transmissionMapTransform * vec3( TRANSMISSIONMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_THICKNESSMAP
	vThicknessMapUv = ( thicknessMapTransform * vec3( THICKNESSMAP_UV, 1 ) ).xy;
#endif`,Jm=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`,jm=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,Qm=`uniform sampler2D t2D;
uniform float backgroundIntensity;
varying vec2 vUv;
void main() {
	vec4 texColor = texture2D( t2D, vUv );
	#ifdef DECODE_VIDEO_TEXTURE
		texColor = vec4( mix( pow( texColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), texColor.rgb * 0.0773993808, vec3( lessThanEqual( texColor.rgb, vec3( 0.04045 ) ) ) ), texColor.w );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,tg=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,eg=`#ifdef ENVMAP_TYPE_CUBE
	uniform samplerCube envMap;
#elif defined( ENVMAP_TYPE_CUBE_UV )
	uniform sampler2D envMap;
#endif
uniform float backgroundBlurriness;
uniform float backgroundIntensity;
uniform mat3 backgroundRotation;
varying vec3 vWorldDirection;
#include <cube_uv_reflection_fragment>
void main() {
	#ifdef ENVMAP_TYPE_CUBE
		vec4 texColor = textureCube( envMap, backgroundRotation * vWorldDirection );
	#elif defined( ENVMAP_TYPE_CUBE_UV )
		vec4 texColor = textureCubeUV( envMap, backgroundRotation * vWorldDirection, backgroundBlurriness );
	#else
		vec4 texColor = vec4( 0.0, 0.0, 0.0, 1.0 );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,ng=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,ig=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,sg=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
varying vec2 vHighPrecisionZW;
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vHighPrecisionZW = gl_Position.zw;
}`,og=`#if DEPTH_PACKING == 3200
	uniform float opacity;
#endif
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
varying vec2 vHighPrecisionZW;
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#if DEPTH_PACKING == 3200
		diffuseColor.a = opacity;
	#endif
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <logdepthbuf_fragment>
	#ifdef USE_REVERSED_DEPTH_BUFFER
		float fragCoordZ = vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ];
	#else
		float fragCoordZ = 0.5 * vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ] + 0.5;
	#endif
	#if DEPTH_PACKING == 3200
		gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );
	#elif DEPTH_PACKING == 3201
		gl_FragColor = packDepthToRGBA( fragCoordZ );
	#elif DEPTH_PACKING == 3202
		gl_FragColor = vec4( packDepthToRGB( fragCoordZ ), 1.0 );
	#elif DEPTH_PACKING == 3203
		gl_FragColor = vec4( packDepthToRG( fragCoordZ ), 0.0, 1.0 );
	#endif
}`,rg=`#define DISTANCE
varying vec3 vWorldPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <worldpos_vertex>
	#include <clipping_planes_vertex>
	vWorldPosition = worldPosition.xyz;
}`,ag=`#define DISTANCE
uniform vec3 referencePosition;
uniform float nearDistance;
uniform float farDistance;
varying vec3 vWorldPosition;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	float dist = length( vWorldPosition - referencePosition );
	dist = ( dist - nearDistance ) / ( farDistance - nearDistance );
	dist = saturate( dist );
	gl_FragColor = vec4( dist, 0.0, 0.0, 1.0 );
}`,cg=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,lg=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,hg=`uniform float scale;
attribute float lineDistance;
varying float vLineDistance;
#include <common>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	vLineDistance = scale * lineDistance;
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,ug=`uniform vec3 diffuse;
uniform float opacity;
uniform float dashSize;
uniform float totalSize;
varying float vLineDistance;
#include <common>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	if ( mod( vLineDistance, totalSize ) > dashSize ) {
		discard;
	}
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,dg=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#if defined ( USE_ENVMAP ) || defined ( USE_SKINNING )
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinbase_vertex>
		#include <skinnormal_vertex>
		#include <defaultnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <fog_vertex>
}`,fg=`uniform vec3 diffuse;
uniform float opacity;
#ifndef FLAT_SHADED
	varying vec3 vNormal;
#endif
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		reflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;
	#else
		reflectedLight.indirectDiffuse += vec3( 1.0 );
	#endif
	#include <aomap_fragment>
	reflectedLight.indirectDiffuse *= diffuseColor.rgb;
	vec3 outgoingLight = reflectedLight.indirectDiffuse;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,pg=`#define LAMBERT
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,mg=`#define LAMBERT
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_lambert_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_lambert_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,gg=`#define MATCAP
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <displacementmap_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
	vViewPosition = - mvPosition.xyz;
}`,xg=`#define MATCAP
uniform vec3 diffuse;
uniform float opacity;
uniform sampler2D matcap;
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	vec3 viewDir = normalize( vViewPosition );
	vec3 x = normalize( vec3( viewDir.z, 0.0, - viewDir.x ) );
	vec3 y = cross( viewDir, x );
	vec2 uv = vec2( dot( x, normal ), dot( y, normal ) ) * 0.495 + 0.5;
	#ifdef USE_MATCAP
		vec4 matcapColor = texture2D( matcap, uv );
	#else
		vec4 matcapColor = vec4( vec3( mix( 0.2, 0.8, uv.y ) ), 1.0 );
	#endif
	vec3 outgoingLight = diffuseColor.rgb * matcapColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,yg=`#define NORMAL
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	vViewPosition = - mvPosition.xyz;
#endif
}`,vg=`#define NORMAL
uniform float opacity;
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <uv_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 0.0, 0.0, 0.0, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	gl_FragColor = vec4( normalize( normal ) * 0.5 + 0.5, diffuseColor.a );
	#ifdef OPAQUE
		gl_FragColor.a = 1.0;
	#endif
}`,_g=`#define PHONG
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,Mg=`#define PHONG
uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_phong_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Eg=`#define STANDARD
varying vec3 vViewPosition;
#ifdef USE_TRANSMISSION
	varying vec3 vWorldPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
#ifdef USE_TRANSMISSION
	vWorldPosition = worldPosition.xyz;
#endif
}`,wg=`#define STANDARD
#ifdef PHYSICAL
	#define IOR
	#define USE_SPECULAR
#endif
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;
#ifdef IOR
	uniform float ior;
#endif
#ifdef USE_SPECULAR
	uniform float specularIntensity;
	uniform vec3 specularColor;
	#ifdef USE_SPECULAR_COLORMAP
		uniform sampler2D specularColorMap;
	#endif
	#ifdef USE_SPECULAR_INTENSITYMAP
		uniform sampler2D specularIntensityMap;
	#endif
#endif
#ifdef USE_CLEARCOAT
	uniform float clearcoat;
	uniform float clearcoatRoughness;
#endif
#ifdef USE_DISPERSION
	uniform float dispersion;
#endif
#ifdef USE_RETROREFLECTION
	uniform float retroreflectivity;
#endif
#ifdef USE_IRIDESCENCE
	uniform float iridescence;
	uniform float iridescenceIOR;
	uniform float iridescenceThicknessMinimum;
	uniform float iridescenceThicknessMaximum;
#endif
#ifdef USE_SHEEN
	uniform vec3 sheenColor;
	uniform float sheenRoughness;
	#ifdef USE_SHEEN_COLORMAP
		uniform sampler2D sheenColorMap;
	#endif
	#ifdef USE_SHEEN_ROUGHNESSMAP
		uniform sampler2D sheenRoughnessMap;
	#endif
#endif
#ifdef USE_ANISOTROPY
	uniform vec2 anisotropyVector;
	#ifdef USE_ANISOTROPYMAP
		uniform sampler2D anisotropyMap;
	#endif
#endif
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <iridescence_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_physical_pars_fragment>
#include <transmission_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <clearcoat_pars_fragment>
#include <iridescence_pars_fragment>
#include <roughnessmap_pars_fragment>
#include <metalnessmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <roughnessmap_fragment>
	#include <metalnessmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <clearcoat_normal_fragment_begin>
	#include <clearcoat_normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_physical_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
	vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;
	#include <transmission_fragment>
	vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;
	#ifdef USE_SHEEN
 
		outgoingLight = outgoingLight + sheenSpecularDirect + sheenSpecularIndirect;
 
 	#endif
	#ifdef USE_CLEARCOAT
		float dotNVcc = saturate( dot( geometryClearcoatNormal, geometryViewDir ) );
		vec3 Fcc = F_Schlick( material.clearcoatF0, material.clearcoatF90, dotNVcc );
		outgoingLight = outgoingLight * ( 1.0 - material.clearcoat * Fcc ) + ( clearcoatSpecularDirect + clearcoatSpecularIndirect ) * material.clearcoat;
	#endif
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,bg=`#define TOON
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,Sg=`#define TOON
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <gradientmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_toon_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_toon_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Tg=`uniform float size;
uniform float scale;
#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
#ifdef USE_POINTS_UV
	varying vec2 vUv;
	uniform mat3 uvTransform;
#endif
void main() {
	#ifdef USE_POINTS_UV
		vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	#endif
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	gl_PointSize = size;
	#ifdef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );
	#endif
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <fog_vertex>
}`,Rg=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <color_pars_fragment>
#include <map_particle_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_particle_fragment>
	#include <color_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,Ag=`#include <common>
#include <batching_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <shadowmap_pars_vertex>
void main() {
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,Cg=`uniform vec3 color;
uniform float opacity;
#include <common>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <logdepthbuf_pars_fragment>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
void main() {
	#include <logdepthbuf_fragment>
	gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,Pg=`uniform float rotation;
uniform vec2 center;
#include <common>
#include <uv_pars_vertex>
#include <fog_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	vec4 mvPosition = modelViewMatrix[ 3 ];
	vec2 scale = vec2( length( modelMatrix[ 0 ].xyz ), length( modelMatrix[ 1 ].xyz ) );
	#ifndef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) scale *= - mvPosition.z;
	#endif
	vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale;
	vec2 rotatedPosition;
	rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
	rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;
	mvPosition.xy += rotatedPosition;
	gl_Position = projectionMatrix * mvPosition;
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,Ig=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,re={alphahash_fragment:jf,alphahash_pars_fragment:Qf,alphamap_fragment:tp,alphamap_pars_fragment:ep,alphatest_fragment:np,alphatest_pars_fragment:ip,aomap_fragment:sp,aomap_pars_fragment:op,batching_pars_vertex:rp,batching_vertex:ap,begin_vertex:cp,beginnormal_vertex:lp,bsdfs:hp,iridescence_fragment:up,bumpmap_pars_fragment:dp,clipping_planes_fragment:fp,clipping_planes_pars_fragment:pp,clipping_planes_pars_vertex:mp,clipping_planes_vertex:gp,color_fragment:xp,color_pars_fragment:yp,color_pars_vertex:vp,color_vertex:_p,common:Mp,cube_uv_reflection_fragment:Ep,defaultnormal_vertex:wp,displacementmap_pars_vertex:bp,displacementmap_vertex:Sp,emissivemap_fragment:Tp,emissivemap_pars_fragment:Rp,colorspace_fragment:Ap,colorspace_pars_fragment:Cp,envmap_fragment:Pp,envmap_common_pars_fragment:Ip,envmap_pars_fragment:Dp,envmap_pars_vertex:Lp,envmap_physical_pars_fragment:Wp,envmap_vertex:Np,fog_vertex:Hp,fog_pars_vertex:Up,fog_fragment:kp,fog_pars_fragment:Fp,gradientmap_pars_fragment:zp,lightmap_pars_fragment:Op,lights_lambert_fragment:Vp,lights_lambert_pars_fragment:Bp,lights_pars_begin:Gp,lights_toon_fragment:Xp,lights_toon_pars_fragment:qp,lights_phong_fragment:Yp,lights_phong_pars_fragment:Zp,lights_physical_fragment:$p,lights_physical_pars_fragment:Kp,lights_fragment_begin:Jp,lights_fragment_maps:jp,lights_fragment_end:Qp,lightprobes_pars_fragment:tm,logdepthbuf_fragment:em,logdepthbuf_pars_fragment:nm,logdepthbuf_pars_vertex:im,logdepthbuf_vertex:sm,map_fragment:om,map_pars_fragment:rm,map_particle_fragment:am,map_particle_pars_fragment:cm,metalnessmap_fragment:lm,metalnessmap_pars_fragment:hm,morphinstance_vertex:um,morphcolor_vertex:dm,morphnormal_vertex:fm,morphtarget_pars_vertex:pm,morphtarget_vertex:mm,normal_fragment_begin:gm,normal_fragment_maps:xm,normal_pars_fragment:ym,normal_pars_vertex:vm,normal_vertex:_m,normalmap_pars_fragment:Mm,clearcoat_normal_fragment_begin:Em,clearcoat_normal_fragment_maps:wm,clearcoat_pars_fragment:bm,iridescence_pars_fragment:Sm,opaque_fragment:Tm,packing:Rm,premultiplied_alpha_fragment:Am,project_vertex:Cm,dithering_fragment:Pm,dithering_pars_fragment:Im,roughnessmap_fragment:Dm,roughnessmap_pars_fragment:Lm,shadowmap_pars_fragment:Nm,shadowmap_pars_vertex:Hm,shadowmap_vertex:Um,shadowmask_pars_fragment:km,skinbase_vertex:Fm,skinning_pars_vertex:zm,skinning_vertex:Om,skinnormal_vertex:Vm,specularmap_fragment:Bm,specularmap_pars_fragment:Gm,tonemapping_fragment:Wm,tonemapping_pars_fragment:Xm,transmission_fragment:qm,transmission_pars_fragment:Ym,uv_pars_fragment:Zm,uv_pars_vertex:$m,uv_vertex:Km,worldpos_vertex:Jm,background_vert:jm,background_frag:Qm,backgroundCube_vert:tg,backgroundCube_frag:eg,cube_vert:ng,cube_frag:ig,depth_vert:sg,depth_frag:og,distance_vert:rg,distance_frag:ag,equirect_vert:cg,equirect_frag:lg,linedashed_vert:hg,linedashed_frag:ug,meshbasic_vert:dg,meshbasic_frag:fg,meshlambert_vert:pg,meshlambert_frag:mg,meshmatcap_vert:gg,meshmatcap_frag:xg,meshnormal_vert:yg,meshnormal_frag:vg,meshphong_vert:_g,meshphong_frag:Mg,meshphysical_vert:Eg,meshphysical_frag:wg,meshtoon_vert:bg,meshtoon_frag:Sg,points_vert:Tg,points_frag:Rg,shadow_vert:Ag,shadow_frag:Cg,sprite_vert:Pg,sprite_frag:Ig},bt={common:{diffuse:{value:new J(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new Jt},alphaMap:{value:null},alphaMapTransform:{value:new Jt},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new Jt}},envmap:{envMap:{value:null},envMapRotation:{value:new Jt},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98},dfgLUT:{value:null}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new Jt}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new Jt}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new Jt},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new Jt},normalScale:{value:new Zt(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new Jt},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new Jt}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new Jt}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new Jt}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new J(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},sunLights:{value:[],properties:{direction:{},color:{}}},sunLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},sunShadowMatrix:{value:[]},sunShadowCascade:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null},probesSH:{value:null},probesMin:{value:new x},probesMax:{value:new x},probesResolution:{value:new x}},points:{diffuse:{value:new J(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new Jt},alphaTest:{value:0},uvTransform:{value:new Jt}},sprite:{diffuse:{value:new J(16777215)},opacity:{value:1},center:{value:new Zt(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new Jt},alphaMap:{value:null},alphaMapTransform:{value:new Jt},alphaTest:{value:0}}},pi={basic:{uniforms:yn([bt.common,bt.specularmap,bt.envmap,bt.aomap,bt.lightmap,bt.fog]),vertexShader:re.meshbasic_vert,fragmentShader:re.meshbasic_frag},lambert:{uniforms:yn([bt.common,bt.specularmap,bt.envmap,bt.aomap,bt.lightmap,bt.emissivemap,bt.bumpmap,bt.normalmap,bt.displacementmap,bt.fog,bt.lights,{emissive:{value:new J(0)},envMapIntensity:{value:1}}]),vertexShader:re.meshlambert_vert,fragmentShader:re.meshlambert_frag},phong:{uniforms:yn([bt.common,bt.specularmap,bt.envmap,bt.aomap,bt.lightmap,bt.emissivemap,bt.bumpmap,bt.normalmap,bt.displacementmap,bt.fog,bt.lights,{emissive:{value:new J(0)},specular:{value:new J(1118481)},shininess:{value:30},envMapIntensity:{value:1}}]),vertexShader:re.meshphong_vert,fragmentShader:re.meshphong_frag},standard:{uniforms:yn([bt.common,bt.envmap,bt.aomap,bt.lightmap,bt.emissivemap,bt.bumpmap,bt.normalmap,bt.displacementmap,bt.roughnessmap,bt.metalnessmap,bt.fog,bt.lights,{emissive:{value:new J(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:re.meshphysical_vert,fragmentShader:re.meshphysical_frag},toon:{uniforms:yn([bt.common,bt.aomap,bt.lightmap,bt.emissivemap,bt.bumpmap,bt.normalmap,bt.displacementmap,bt.gradientmap,bt.fog,bt.lights,{emissive:{value:new J(0)}}]),vertexShader:re.meshtoon_vert,fragmentShader:re.meshtoon_frag},matcap:{uniforms:yn([bt.common,bt.bumpmap,bt.normalmap,bt.displacementmap,bt.fog,{matcap:{value:null}}]),vertexShader:re.meshmatcap_vert,fragmentShader:re.meshmatcap_frag},points:{uniforms:yn([bt.points,bt.fog]),vertexShader:re.points_vert,fragmentShader:re.points_frag},dashed:{uniforms:yn([bt.common,bt.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:re.linedashed_vert,fragmentShader:re.linedashed_frag},depth:{uniforms:yn([bt.common,bt.displacementmap]),vertexShader:re.depth_vert,fragmentShader:re.depth_frag},normal:{uniforms:yn([bt.common,bt.bumpmap,bt.normalmap,bt.displacementmap,{opacity:{value:1}}]),vertexShader:re.meshnormal_vert,fragmentShader:re.meshnormal_frag},sprite:{uniforms:yn([bt.sprite,bt.fog]),vertexShader:re.sprite_vert,fragmentShader:re.sprite_frag},background:{uniforms:{uvTransform:{value:new Jt},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:re.background_vert,fragmentShader:re.background_frag},backgroundCube:{uniforms:{envMap:{value:null},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new Jt}},vertexShader:re.backgroundCube_vert,fragmentShader:re.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:re.cube_vert,fragmentShader:re.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:re.equirect_vert,fragmentShader:re.equirect_frag},distance:{uniforms:yn([bt.common,bt.displacementmap,{referencePosition:{value:new x},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:re.distance_vert,fragmentShader:re.distance_frag},shadow:{uniforms:yn([bt.lights,bt.fog,{color:{value:new J(0)},opacity:{value:1}}]),vertexShader:re.shadow_vert,fragmentShader:re.shadow_frag}};pi.physical={uniforms:yn([pi.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new Jt},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new Jt},clearcoatNormalScale:{value:new Zt(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new Jt},dispersion:{value:0},retroreflectivity:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new Jt},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new Jt},sheen:{value:0},sheenColor:{value:new J(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new Jt},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new Jt},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new Jt},transmissionSamplerSize:{value:new Zt},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new Jt},attenuationDistance:{value:0},attenuationColor:{value:new J(0)},specularColor:{value:new J(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new Jt},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new Jt},anisotropyVector:{value:new Zt},anisotropyMap:{value:null},anisotropyMapTransform:{value:new Jt}}]),vertexShader:re.meshphysical_vert,fragmentShader:re.meshphysical_frag};var pc={r:0,b:0,g:0},Dg=new le,R0=new Jt;R0.set(-1,0,0,0,1,0,0,0,1);function Lg(i,t,e,n,s,o){let r=new J(0),a=s===!0?0:1,l,c,h=null,d=0,u=null;function m(v){let S=v.isScene===!0?v.background:null;if(S&&S.isTexture){let _=v.backgroundBlurriness>0;S=t.get(S,_)}return S}function g(v){let S=!1,_=m(v);_===null?p(r,a):_&&_.isColor&&(p(_,1),S=!0);let b=i.xr.getEnvironmentBlendMode();b==="additive"?e.buffers.color.setClear(0,0,0,1,o):b==="alpha-blend"&&e.buffers.color.setClear(0,0,0,0,o),(i.autoClear||S)&&(e.buffers.depth.setTest(!0),e.buffers.depth.setMask(!0),e.buffers.color.setMask(!0),i.clear(i.autoClearColor,i.autoClearDepth,i.autoClearStencil))}function y(v,S){let _=m(S);_&&(_.isCubeTexture||_.mapping===$o)?(c===void 0&&(c=new ut(new dn(1,1,1),new Ue({name:"BackgroundCubeMaterial",uniforms:Ms(pi.backgroundCube.uniforms),vertexShader:pi.backgroundCube.vertexShader,fragmentShader:pi.backgroundCube.fragmentShader,side:fn,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),c.geometry.deleteAttribute("normal"),c.geometry.deleteAttribute("uv"),c.onBeforeRender=function(b,E,A){this.matrixWorld.copyPosition(A.matrixWorld)},Object.defineProperty(c.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),n.update(c)),c.material.uniforms.envMap.value=_,c.material.uniforms.backgroundBlurriness.value=S.backgroundBlurriness,c.material.uniforms.backgroundIntensity.value=S.backgroundIntensity,c.material.uniforms.backgroundRotation.value.setFromMatrix4(Dg.makeRotationFromEuler(S.backgroundRotation)).transpose(),_.isCubeTexture&&_.isRenderTargetTexture===!1&&c.material.uniforms.backgroundRotation.value.premultiply(R0),c.material.toneMapped=ce.getTransfer(_.colorSpace)!==Te,(h!==_||d!==_.version||u!==i.toneMapping)&&(c.material.needsUpdate=!0,h=_,d=_.version,u=i.toneMapping),c.layers.enableAll(),v.unshift(c,c.geometry,c.material,0,0,null)):_&&_.isTexture&&(l===void 0&&(l=new ut(new Nn(2,2),new Ue({name:"BackgroundMaterial",uniforms:Ms(pi.background.uniforms),vertexShader:pi.background.vertexShader,fragmentShader:pi.background.fragmentShader,side:Qn,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),l.geometry.deleteAttribute("normal"),Object.defineProperty(l.material,"map",{get:function(){return this.uniforms.t2D.value}}),n.update(l)),l.material.uniforms.t2D.value=_,l.material.uniforms.backgroundIntensity.value=S.backgroundIntensity,l.material.toneMapped=ce.getTransfer(_.colorSpace)!==Te,_.matrixAutoUpdate===!0&&_.updateMatrix(),l.material.uniforms.uvTransform.value.copy(_.matrix),(h!==_||d!==_.version||u!==i.toneMapping)&&(l.material.needsUpdate=!0,h=_,d=_.version,u=i.toneMapping),l.layers.enableAll(),v.unshift(l,l.geometry,l.material,0,0,null))}function p(v,S){v.getRGB(pc,Gl(i)),e.buffers.color.setClear(pc.r,pc.g,pc.b,S,o)}function f(){c!==void 0&&(c.geometry.dispose(),c.material.dispose(),c=void 0),l!==void 0&&(l.geometry.dispose(),l.material.dispose(),l=void 0)}return{getClearColor:function(){return r},setClearColor:function(v,S=1){r.set(v),a=S,p(r,a)},getClearAlpha:function(){return a},setClearAlpha:function(v){a=v,p(r,a)},render:g,addToRenderList:y,dispose:f}}function Ng(i,t){let e=i.getParameter(i.MAX_VERTEX_ATTRIBS),n={},s=u(null),o=s,r=!1;function a(P,N,F,D,z){let L=!1,U=d(P,D,F,N);o!==U&&(o=U,c(o.object)),L=m(P,D,F,z),L&&g(P,D,F,z),z!==null&&t.update(z,i.ELEMENT_ARRAY_BUFFER),(L||r)&&(r=!1,_(P,N,F,D),z!==null&&i.bindBuffer(i.ELEMENT_ARRAY_BUFFER,t.get(z).buffer))}function l(){return i.createVertexArray()}function c(P){return i.bindVertexArray(P)}function h(P){return i.deleteVertexArray(P)}function d(P,N,F,D){let z=D.wireframe===!0,L=n[N.id];L===void 0&&(L={},n[N.id]=L);let U=P.isInstancedMesh===!0?P.id:0,O=L[U];O===void 0&&(O={},L[U]=O);let k=O[F.id];k===void 0&&(k={},O[F.id]=k);let W=k[z];return W===void 0&&(W=u(l()),k[z]=W),W}function u(P){let N=[],F=[],D=[];for(let z=0;z<e;z++)N[z]=0,F[z]=0,D[z]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:N,enabledAttributes:F,attributeDivisors:D,object:P,attributes:{},index:null}}function m(P,N,F,D){let z=o.attributes,L=N.attributes,U=0,O=F.getAttributes();for(let k in O)if(O[k].location>=0){let q=z[k],at=L[k];if(at===void 0&&(k==="instanceMatrix"&&P.instanceMatrix&&(at=P.instanceMatrix),k==="instanceColor"&&P.instanceColor&&(at=P.instanceColor)),q===void 0||q.attribute!==at||at&&q.data!==at.data)return!0;U++}return o.attributesNum!==U||o.index!==D}function g(P,N,F,D){let z={},L=N.attributes,U=0,O=F.getAttributes();for(let k in O)if(O[k].location>=0){let q=L[k];q===void 0&&(k==="instanceMatrix"&&P.instanceMatrix&&(q=P.instanceMatrix),k==="instanceColor"&&P.instanceColor&&(q=P.instanceColor));let at={};at.attribute=q,q&&q.data&&(at.data=q.data),z[k]=at,U++}o.attributes=z,o.attributesNum=U,o.index=D}function y(){let P=o.newAttributes;for(let N=0,F=P.length;N<F;N++)P[N]=0}function p(P){f(P,0)}function f(P,N){let F=o.newAttributes,D=o.enabledAttributes,z=o.attributeDivisors;F[P]=1,D[P]===0&&(i.enableVertexAttribArray(P),D[P]=1),z[P]!==N&&(i.vertexAttribDivisor(P,N),z[P]=N)}function v(){let P=o.newAttributes,N=o.enabledAttributes;for(let F=0,D=N.length;F<D;F++)N[F]!==P[F]&&(i.disableVertexAttribArray(F),N[F]=0)}function S(P,N,F,D,z,L,U){U===!0?i.vertexAttribIPointer(P,N,F,z,L):i.vertexAttribPointer(P,N,F,D,z,L)}function _(P,N,F,D){y();let z=D.attributes,L=F.getAttributes(),U=N.defaultAttributeValues;for(let O in L){let k=L[O];if(k.location>=0){let W=z[O];if(W===void 0&&(O==="instanceMatrix"&&P.instanceMatrix&&(W=P.instanceMatrix),O==="instanceColor"&&P.instanceColor&&(W=P.instanceColor)),W!==void 0){let q=W.normalized,at=W.itemSize,it=t.get(W);if(it===void 0)continue;let lt=it.buffer,wt=it.type,gt=it.bytesPerElement,K=wt===i.INT||wt===i.UNSIGNED_INT||W.gpuType===Aa;if(W.isInterleavedBufferAttribute){let tt=W.data,dt=tt.stride,Ct=W.offset;if(tt.isInstancedInterleavedBuffer){for(let _t=0;_t<k.locationSize;_t++)f(k.location+_t,tt.meshPerAttribute);P.isInstancedMesh!==!0&&D._maxInstanceCount===void 0&&(D._maxInstanceCount=tt.meshPerAttribute*tt.count)}else for(let _t=0;_t<k.locationSize;_t++)p(k.location+_t);i.bindBuffer(i.ARRAY_BUFFER,lt);for(let _t=0;_t<k.locationSize;_t++)S(k.location+_t,at/k.locationSize,wt,q,dt*gt,(Ct+at/k.locationSize*_t)*gt,K)}else{if(W.isInstancedBufferAttribute){for(let tt=0;tt<k.locationSize;tt++)f(k.location+tt,W.meshPerAttribute);P.isInstancedMesh!==!0&&D._maxInstanceCount===void 0&&(D._maxInstanceCount=W.meshPerAttribute*W.count)}else for(let tt=0;tt<k.locationSize;tt++)p(k.location+tt);i.bindBuffer(i.ARRAY_BUFFER,lt);for(let tt=0;tt<k.locationSize;tt++)S(k.location+tt,at/k.locationSize,wt,q,at*gt,at/k.locationSize*tt*gt,K)}}else if(U!==void 0){let q=U[O];if(q!==void 0)switch(q.length){case 2:i.vertexAttrib2fv(k.location,q);break;case 3:i.vertexAttrib3fv(k.location,q);break;case 4:i.vertexAttrib4fv(k.location,q);break;default:i.vertexAttrib1fv(k.location,q)}}}}v()}function b(){w();for(let P in n){let N=n[P];for(let F in N){let D=N[F];for(let z in D){let L=D[z];for(let U in L)h(L[U].object),delete L[U];delete D[z]}}delete n[P]}}function E(P){if(n[P.id]===void 0)return;let N=n[P.id];for(let F in N){let D=N[F];for(let z in D){let L=D[z];for(let U in L)h(L[U].object),delete L[U];delete D[z]}}delete n[P.id]}function A(P){for(let N in n){let F=n[N];for(let D in F){let z=F[D];if(z[P.id]===void 0)continue;let L=z[P.id];for(let U in L)h(L[U].object),delete L[U];delete z[P.id]}}}function M(P){for(let N in n){let F=n[N],D=P.isInstancedMesh===!0?P.id:0,z=F[D];if(z!==void 0){for(let L in z){let U=z[L];for(let O in U)h(U[O].object),delete U[O];delete z[L]}delete F[D],Object.keys(F).length===0&&delete n[N]}}}function w(){T(),r=!0,o!==s&&(o=s,c(o.object))}function T(){s.geometry=null,s.program=null,s.wireframe=!1}return{setup:a,reset:w,resetDefaultState:T,dispose:b,releaseStatesOfGeometry:E,releaseStatesOfObject:M,releaseStatesOfProgram:A,initAttributes:y,enableAttribute:p,disableUnusedAttributes:v}}function Hg(i,t,e){let n;function s(l){n=l}function o(l,c){i.drawArrays(n,l,c),e.update(c,n,1)}function r(l,c,h){h!==0&&(i.drawArraysInstanced(n,l,c,h),e.update(c,n,h))}function a(l,c,h){if(h===0)return;t.get("WEBGL_multi_draw").multiDrawArraysWEBGL(n,l,0,c,0,h);let u=0;for(let m=0;m<h;m++)u+=c[m];e.update(u,n,1)}this.setMode=s,this.render=o,this.renderInstances=r,this.renderMultiDraw=a}function Ug(i,t,e,n){let s;function o(){if(s!==void 0)return s;if(t.has("EXT_texture_filter_anisotropic")===!0){let A=t.get("EXT_texture_filter_anisotropic");s=i.getParameter(A.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else s=0;return s}function r(A){return!(A!==Bn&&n.convert(A)!==i.getParameter(i.IMPLEMENTATION_COLOR_READ_FORMAT))}function a(A){let M=A===ei&&(t.has("EXT_color_buffer_half_float")||t.has("EXT_color_buffer_float"));return!(A!==En&&A!==Vn&&!M&&n.convert(A)!==i.getParameter(i.IMPLEMENTATION_COLOR_READ_TYPE))}function l(A){if(A==="highp"){if(i.getShaderPrecisionFormat(i.VERTEX_SHADER,i.HIGH_FLOAT).precision>0&&i.getShaderPrecisionFormat(i.FRAGMENT_SHADER,i.HIGH_FLOAT).precision>0)return"highp";A="mediump"}return A==="mediump"&&i.getShaderPrecisionFormat(i.VERTEX_SHADER,i.MEDIUM_FLOAT).precision>0&&i.getShaderPrecisionFormat(i.FRAGMENT_SHADER,i.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let c=e.precision!==void 0?e.precision:"highp",h=l(c);h!==c&&(Wt("WebGLRenderer:",c,"not supported, using",h,"instead."),c=h);let d=e.logarithmicDepthBuffer===!0,u=e.reversedDepthBuffer===!0&&t.has("EXT_clip_control");e.reversedDepthBuffer===!0&&u===!1&&Wt("WebGLRenderer: Unable to use reversed depth buffer due to missing EXT_clip_control extension. Fallback to default depth buffer.");let m=i.getParameter(i.MAX_TEXTURE_IMAGE_UNITS),g=i.getParameter(i.MAX_VERTEX_TEXTURE_IMAGE_UNITS),y=i.getParameter(i.MAX_TEXTURE_SIZE),p=i.getParameter(i.MAX_CUBE_MAP_TEXTURE_SIZE),f=i.getParameter(i.MAX_VERTEX_ATTRIBS),v=i.getParameter(i.MAX_VERTEX_UNIFORM_VECTORS),S=i.getParameter(i.MAX_VARYING_VECTORS),_=i.getParameter(i.MAX_FRAGMENT_UNIFORM_VECTORS),b=i.getParameter(i.MAX_SAMPLES),E=i.getParameter(i.SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:o,getMaxPrecision:l,textureFormatReadable:r,textureTypeReadable:a,precision:c,logarithmicDepthBuffer:d,reversedDepthBuffer:u,maxTextures:m,maxVertexTextures:g,maxTextureSize:y,maxCubemapSize:p,maxAttributes:f,maxVertexUniforms:v,maxVaryings:S,maxFragmentUniforms:_,maxSamples:b,samples:E}}function kg(i){let t=this,e=null,n=0,s=!1,o=!1,r=new Kn,a=new Jt,l={value:null,needsUpdate:!1};this.uniform=l,this.numPlanes=0,this.numIntersection=0,this.init=function(d,u){let m=d.length!==0||u||n!==0||s;return s=u,n=d.length,m},this.beginShadows=function(){o=!0,h(null)},this.endShadows=function(){o=!1},this.setGlobalState=function(d,u){e=h(d,u,0)},this.setState=function(d,u,m){let g=d.clippingPlanes,y=d.clipIntersection,p=d.clipShadows,f=i.get(d);if(!s||g===null||g.length===0||o&&!p)o?h(null):c();else{let v=o?0:n,S=v*4,_=f.clippingState||null;l.value=_,_=h(g,u,S,m);for(let b=0;b!==S;++b)_[b]=e[b];f.clippingState=_,this.numIntersection=y?this.numPlanes:0,this.numPlanes+=v}};function c(){l.value!==e&&(l.value=e,l.needsUpdate=n>0),t.numPlanes=n,t.numIntersection=0}function h(d,u,m,g){let y=d!==null?d.length:0,p=null;if(y!==0){if(p=l.value,g!==!0||p===null){let f=m+y*4,v=u.matrixWorldInverse;a.getNormalMatrix(v),(p===null||p.length<f)&&(p=new Float32Array(f));for(let S=0,_=m;S!==y;++S,_+=4)r.copy(d[S]).applyMatrix4(v,a),r.normal.toArray(p,_),p[_+3]=r.constant}l.value=p,l.needsUpdate=!0}return t.numPlanes=y,t.numIntersection=0,p}}var co=4,Fg=6,zg=20,Og=256,ir=new Ji,o0=new J,jl=null,Ql=0,th=0,eh=!1,Vg=new x,Es=new x,gc=class{constructor(t){this._renderer=t,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._sizeLods=[],this._lodMeshes=[],this._backgroundBox=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._blurMaterial=null,this._ggxMaterial=null}fromScene(t,e=0,n=.1,s=100,o={}){let{size:r=256,position:a=Vg}=o;jl=this._renderer.getRenderTarget(),Ql=this._renderer.getActiveCubeFace(),th=this._renderer.getActiveMipmapLevel(),eh=this._renderer.xr.enabled,this._renderer.xr.enabled=!1,this._setSize(r);let l=this._allocateTargets();return l.depthBuffer=!0,this._sceneToCubeUV(t,n,s,l,a),e>0&&this._blur(l,0,0,e),this._applyPMREM(l),this._cleanup(l),l}fromEquirectangular(t,e=null){return this._fromTexture(t,e)}fromCubemap(t,e=null){return this._fromTexture(t,e)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=c0(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=a0(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose(),this._backgroundBox!==null&&(this._backgroundBox.geometry.dispose(),this._backgroundBox.material.dispose())}_setSize(t){this._lodMax=Math.floor(Math.log2(t)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._ggxMaterial!==null&&this._ggxMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let t=0;t<this._lodMeshes.length;t++)this._lodMeshes[t].geometry.dispose()}_cleanup(t){this._renderer.setRenderTarget(jl,Ql,th),this._renderer.xr.enabled=eh,t.scissorTest=!1,ao(t,0,0,t.width,t.height)}_fromTexture(t,e){t.mapping===Qi||t.mapping===vs?this._setSize(t.image.length===0?16:t.image[0].width||t.image[0].image.width):this._setSize(t.image.width/4),jl=this._renderer.getRenderTarget(),Ql=this._renderer.getActiveCubeFace(),th=this._renderer.getActiveMipmapLevel(),eh=this._renderer.xr.enabled,this._renderer.xr.enabled=!1;let n=e||this._allocateTargets();return this._textureToCubeUV(t,n),this._applyPMREM(n),this._cleanup(n),n}_allocateTargets(){let t=3*Math.max(this._cubeSize,112),e=4*this._cubeSize,n={magFilter:hn,minFilter:hn,generateMipmaps:!1,type:ei,format:Bn,colorSpace:gs,depthBuffer:!1},s=r0(t,e,n);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==t||this._pingPongRenderTarget.height!==e){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=r0(t,e,n);let{_lodMax:o}=this;({lodMeshes:this._lodMeshes,sizeLods:this._sizeLods}=Bg(o)),this._blurMaterial=Wg(o,t,e),this._ggxMaterial=Gg(o,t,e)}return s}_compileMaterial(t){let e=new ut(new oe,t);this._renderer.compile(e,ir)}_sceneToCubeUV(t,e,n,s,o){let l=new nn(90,1,e,n),c=[1,-1,1,1,1,1],h=[1,1,1,-1,-1,-1],d=this._renderer,u=d.autoClear,m=d.toneMapping;d.getClearColor(o0),d.toneMapping=ti,d.autoClear=!1,d.state.buffers.depth.getReversed()&&(d.setRenderTarget(s),d.clearDepth(),d.setRenderTarget(null)),this._backgroundBox===null&&(this._backgroundBox=new ut(new dn,new Ti({name:"PMREM.Background",side:fn,depthWrite:!1,depthTest:!1})));let y=this._backgroundBox,p=y.material,f=!1,v=t.background;v?v.isColor&&(p.color.copy(v),t.background=null,f=!0):(p.color.copy(o0),f=!0);for(let S=0;S<6;S++){let _=S%3;_===0?(l.up.set(0,c[S],0),l.position.set(o.x,o.y,o.z),l.lookAt(o.x+h[S],o.y,o.z)):_===1?(l.up.set(0,0,c[S]),l.position.set(o.x,o.y,o.z),l.lookAt(o.x,o.y+h[S],o.z)):(l.up.set(0,c[S],0),l.position.set(o.x,o.y,o.z),l.lookAt(o.x,o.y,o.z+h[S]));let b=this._cubeSize;ao(s,_*b,S>2?b:0,b,b),d.setRenderTarget(s),f&&d.render(y,l),d.render(t,l)}d.toneMapping=m,d.autoClear=u,t.background=v}_textureToCubeUV(t,e){let n=this._renderer,s=t.mapping===Qi||t.mapping===vs;s?(this._cubemapMaterial===null&&(this._cubemapMaterial=c0()),this._cubemapMaterial.uniforms.flipEnvMap.value=t.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=a0());let o=s?this._cubemapMaterial:this._equirectMaterial,r=this._lodMeshes[0];r.material=o;let a=o.uniforms;a.envMap.value=t;let l=this._cubeSize;ao(e,0,0,3*l,2*l),n.setRenderTarget(e),n.render(r,ir)}_applyPMREM(t){let e=this._renderer,n=e.autoClear;e.autoClear=!1;let s=this._lodMeshes.length;for(let o=1;o<s;o++)this._applyGGXFilter(t,o-1,o);e.autoClear=n}_applyGGXFilter(t,e,n){let s=this._renderer,o=this._pingPongRenderTarget,r=this._ggxMaterial,a=this._lodMeshes[n];a.material=r;let l=r.uniforms,c=n/(this._lodMeshes.length-1),h=e/(this._lodMeshes.length-1),d=Math.sqrt(c*c-h*h),u=c*1.25,m=d*u,{_lodMax:g}=this,y=this._sizeLods[n],p=3*y*(n>g-co?n-g+co:0),f=4*(this._cubeSize-y);l.envMap.value=t.texture,l.roughness.value=m,l.mipInt.value=g-e,ao(o,p,f,3*y,2*y),s.setRenderTarget(o),s.render(a,ir),l.envMap.value=o.texture,l.roughness.value=0,l.mipInt.value=g-n,ao(t,p,f,3*y,2*y),s.setRenderTarget(t),s.render(a,ir)}_blur(t,e,n,s){let o=this._pingPongRenderTarget,r=Math.min(s,Math.PI)/Math.SQRT2;this._blurPass(t,o,e,n,r),this._blurPass(o,t,n,n,r)}_blurPass(t,e,n,s,o){let r=this._renderer,a=this._blurMaterial,l=this._lodMeshes[s];l.material=a;let c=a.uniforms;c.envMap.value=t.texture,c.sigma.value=o,c.mipInt.value=this._lodMax-n;let h=this._sizeLods[s],d=3*h*(s>this._lodMax-co?s-this._lodMax+co:0),u=4*(this._cubeSize-h);ao(e,d,u,3*h,2*h),r.setRenderTarget(e),r.render(l,ir)}};function Bg(i){let t=[],e=[],n=i,s=i-co+1+Fg;for(let o=0;o<s;o++){let r=Math.pow(2,n);t.push(r);let a=1/(r-2),l=-a,c=1+a,h=[l,l,c,l,c,c,l,l,c,c,l,c],d=6,u=6,m=3,g=new Float32Array(m*u*d),y=new Float32Array(m*u*d);for(let f=0;f<d;f++){let v=f%3*2/3-1,S=f>2?0:-1,_=[v,S,0,v+2/3,S,0,v+2/3,S+1,0,v,S,0,v+2/3,S+1,0,v,S+1,0];g.set(_,m*u*f);for(let b=0;b<u;b++){let E=h[b*2]*2-1,A=h[b*2+1]*2-1;f===0?Es.set(1,A,E):f===1?Es.set(-E,1,-A):f===2?Es.set(-E,A,1):f===3?Es.set(-1,A,-E):f===4?Es.set(-E,-1,A):Es.set(E,A,-1),Es.toArray(y,(f*u+b)*m)}}let p=new oe;p.setAttribute("position",new ve(g,m)),p.setAttribute("outputDirection",new ve(y,m)),e.push(new ut(p,null)),n>co&&n--}return{lodMeshes:e,sizeLods:t}}function r0(i,t,e){let n=new un(i,t,e);return n.texture.mapping=$o,n.texture.name="PMREM.cubeUv",n.scissorTest=!0,n}function ao(i,t,e,n,s){i.viewport.set(t,e,n,s),i.scissor.set(t,e,n,s)}function Gg(i,t,e){return new Ue({name:"PMREMGGXConvolution",defines:{GGX_SAMPLES:Og,CUBEUV_TEXEL_WIDTH:1/t,CUBEUV_TEXEL_HEIGHT:1/e,CUBEUV_MAX_MIP:`${i}.0`},uniforms:{envMap:{value:null},roughness:{value:0},mipInt:{value:0}},vertexShader:vc(),fragmentShader:`

			precision highp float;
			precision highp int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform float roughness;
			uniform float mipInt;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			#define PI 3.14159265359

			// Van der Corput radical inverse
			float radicalInverse_VdC(uint bits) {
				bits = (bits << 16u) | (bits >> 16u);
				bits = ((bits & 0x55555555u) << 1u) | ((bits & 0xAAAAAAAAu) >> 1u);
				bits = ((bits & 0x33333333u) << 2u) | ((bits & 0xCCCCCCCCu) >> 2u);
				bits = ((bits & 0x0F0F0F0Fu) << 4u) | ((bits & 0xF0F0F0F0u) >> 4u);
				bits = ((bits & 0x00FF00FFu) << 8u) | ((bits & 0xFF00FF00u) >> 8u);
				return float(bits) * 2.3283064365386963e-10; // / 0x100000000
			}

			// Hammersley sequence
			vec2 hammersley(uint i, uint N) {
				return vec2(float(i) / float(N), radicalInverse_VdC(i));
			}

			// GGX VNDF importance sampling (Eric Heitz 2018)
			// "Sampling the GGX Distribution of Visible Normals"
			// https://jcgt.org/published/0007/04/01/
			vec3 importanceSampleGGX_VNDF(vec2 Xi, vec3 V, float roughness) {
				float alpha = roughness * roughness;

				// Section 4.1: Orthonormal basis
				vec3 T1 = vec3(1.0, 0.0, 0.0);
				vec3 T2 = cross(V, T1);

				// Section 4.2: Parameterization of projected area
				float r = sqrt(Xi.x);
				float phi = 2.0 * PI * Xi.y;
				float t1 = r * cos(phi);
				float t2 = r * sin(phi);
				float s = 0.5 * (1.0 + V.z);
				t2 = (1.0 - s) * sqrt(1.0 - t1 * t1) + s * t2;

				// Section 4.3: Reprojection onto hemisphere
				vec3 Nh = t1 * T1 + t2 * T2 + sqrt(max(0.0, 1.0 - t1 * t1 - t2 * t2)) * V;

				// Section 3.4: Transform back to ellipsoid configuration
				return normalize(vec3(alpha * Nh.x, alpha * Nh.y, max(0.0, Nh.z)));
			}

			void main() {
				vec3 N = normalize(vOutputDirection);
				vec3 V = N; // Assume view direction equals normal for pre-filtering

				vec3 prefilteredColor = vec3(0.0);
				float totalWeight = 0.0;

				// For very low roughness, just sample the environment directly
				if (roughness < 0.001) {
					gl_FragColor = vec4(bilinearCubeUV(envMap, N, mipInt), 1.0);
					return;
				}

				// Tangent space basis for VNDF sampling
				vec3 up = abs(N.z) < 0.999 ? vec3(0.0, 0.0, 1.0) : vec3(1.0, 0.0, 0.0);
				vec3 tangent = normalize(cross(up, N));
				vec3 bitangent = cross(N, tangent);

				for(uint i = 0u; i < uint(GGX_SAMPLES); i++) {
					vec2 Xi = hammersley(i, uint(GGX_SAMPLES));

					// For PMREM, V = N, so in tangent space V is always (0, 0, 1)
					vec3 H_tangent = importanceSampleGGX_VNDF(Xi, vec3(0.0, 0.0, 1.0), roughness);

					// Transform H back to world space
					vec3 H = normalize(tangent * H_tangent.x + bitangent * H_tangent.y + N * H_tangent.z);
					vec3 L = normalize(2.0 * dot(V, H) * H - V);

					float NdotL = max(dot(N, L), 0.0);

					if(NdotL > 0.0) {
						// Sample environment at fixed mip level
						// VNDF importance sampling handles the distribution filtering
						vec3 sampleColor = bilinearCubeUV(envMap, L, mipInt);

						// Weight by NdotL for the split-sum approximation
						// VNDF PDF naturally accounts for the visible microfacet distribution
						prefilteredColor += sampleColor * NdotL;
						totalWeight += NdotL;
					}
				}

				if (totalWeight > 0.0) {
					prefilteredColor = prefilteredColor / totalWeight;
				}

				gl_FragColor = vec4(prefilteredColor, 1.0);
			}
		`,blending:ui,depthTest:!1,depthWrite:!1})}function Wg(i,t,e){return new Ue({name:"SphericalGaussianBlur",defines:{SAMPLES:zg,CUBEUV_TEXEL_WIDTH:1/t,CUBEUV_TEXEL_HEIGHT:1/e,CUBEUV_MAX_MIP:`${i}.0`},uniforms:{envMap:{value:null},sigma:{value:0},mipInt:{value:0}},vertexShader:vc(),fragmentShader:`

			precision highp float;
			precision highp int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform float sigma;
			uniform float mipInt;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			#define PI 3.14159265359
			#define GOLDEN_ANGLE 2.39996322973

			void main() {

				if ( sigma == 0.0 ) {

					gl_FragColor = vec4( bilinearCubeUV( envMap, vOutputDirection, mipInt ), 1.0 );
					return;

				}

				vec3 outputDirection = normalize( vOutputDirection );

				vec3 up = abs( outputDirection.z ) < 0.999 ? vec3( 0.0, 0.0, 1.0 ) : vec3( 1.0, 0.0, 0.0 );
				vec3 tangent = normalize( cross( up, outputDirection ) );
				vec3 bitangent = cross( outputDirection, tangent );

				// Truncate the kernel at three standard deviations or at the antipode.
				float thetaMax = min( 3.0 * sigma, PI );
				float truncation = 1.0 - exp( - 0.5 * thetaMax * thetaMax / ( sigma * sigma ) );

				vec3 accumColor = vec3( 0.0 );
				float accumWeight = 0.0;

				for ( int i = 0; i < SAMPLES; i ++ ) {

					// Stratified inverse-CDF sampling of the Gaussian, placed on a golden-angle spiral.
					float stratum = ( float( i ) + 0.5 ) / float( SAMPLES );
					float theta = sigma * sqrt( - 2.0 * log( 1.0 - stratum * truncation ) );
					float phi = float( i ) * GOLDEN_ANGLE;

					vec3 offset = cos( phi ) * tangent + sin( phi ) * bitangent;
					vec3 sampleDirection = cos( theta ) * outputDirection + sin( theta ) * offset;

					// Correct the planar sample density to solid angle.
					float weight = sin( theta ) / theta;

					accumColor += weight * bilinearCubeUV( envMap, sampleDirection, mipInt );
					accumWeight += weight;

				}

				gl_FragColor = vec4( accumColor / accumWeight, 1.0 );

			}
		`,blending:ui,depthTest:!1,depthWrite:!1})}function a0(){return new Ue({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:vc(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;

			#include <common>

			void main() {

				vec3 outputDirection = normalize( vOutputDirection );
				vec2 uv = equirectUv( outputDirection );

				gl_FragColor = vec4( texture2D ( envMap, uv ).rgb, 1.0 );

			}
		`,blending:ui,depthTest:!1,depthWrite:!1})}function c0(){return new Ue({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:vc(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:ui,depthTest:!1,depthWrite:!1})}function vc(){return`

		precision mediump float;
		precision mediump int;

		attribute vec3 outputDirection;

		varying vec3 vOutputDirection;

		void main() {

			vOutputDirection = outputDirection;
			gl_Position = vec4( position, 1.0 );

		}
	`}var xc=class extends un{constructor(t=1,e={}){super(t,t,e),this.isWebGLCubeRenderTarget=!0;let n={width:t,height:t,depth:1},s=[n,n,n,n,n,n];this.texture=new Oo(s),this._setTextureOptions(e),this.texture.isRenderTargetTexture=!0}fromEquirectangularTexture(t,e){this.texture.type=e.type,this.texture.colorSpace=e.colorSpace,this.texture.generateMipmaps=e.generateMipmaps,this.texture.minFilter=e.minFilter,this.texture.magFilter=e.magFilter;let n={uniforms:{tEquirect:{value:null}},vertexShader:`

				varying vec3 vWorldDirection;

				vec3 transformDirection( in vec3 dir, in mat4 matrix ) {

					return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );

				}

				void main() {

					vWorldDirection = transformDirection( position, modelMatrix );

					#include <begin_vertex>
					#include <project_vertex>

				}
			`,fragmentShader:`

				uniform sampler2D tEquirect;

				varying vec3 vWorldDirection;

				#include <common>

				void main() {

					vec3 direction = normalize( vWorldDirection );

					vec2 sampleUV = equirectUv( direction );

					gl_FragColor = texture2D( tEquirect, sampleUV );

				}
			`},s=new dn(5,5,5),o=new Ue({name:"CubemapFromEquirect",uniforms:Ms(n.uniforms),vertexShader:n.vertexShader,fragmentShader:n.fragmentShader,side:fn,blending:ui});o.uniforms.tEquirect.value=e;let r=new ut(s,o),a=e.minFilter;return e.minFilter===ts&&(e.minFilter=hn),new _a(1,10,this).update(t,r),e.minFilter=a,r.geometry.dispose(),r.material.dispose(),this}clear(t,e=!0,n=!0,s=!0){let o=t.getRenderTarget();for(let r=0;r<6;r++)t.setRenderTarget(this,r),t.clear(e,n,s);t.setRenderTarget(o)}};function Xg(i){let t=new WeakMap,e=new WeakMap,n=null;function s(u,m=!1){return u==null?null:m?r(u):o(u)}function o(u){if(u&&u.isTexture){let m=u.mapping;if(m===Sa||m===Ta)if(t.has(u)){let g=t.get(u).texture;return a(g,u.mapping)}else{let g=u.image;if(g&&g.height>0){let y=new xc(g.height);return y.fromEquirectangularTexture(i,u),t.set(u,y),u.addEventListener("dispose",c),a(y.texture,u.mapping)}else return null}}return u}function r(u){if(u&&u.isTexture){let m=u.mapping,g=m===Sa||m===Ta,y=m===Qi||m===vs;if(g||y){let p=e.get(u),f=p!==void 0?p.texture.pmremVersion:0;if(u.isRenderTargetTexture&&u.pmremVersion!==f)return n===null&&(n=new gc(i)),p=g?n.fromEquirectangular(u,p):n.fromCubemap(u,p),p.texture.pmremVersion=u.pmremVersion,e.set(u,p),p.texture;if(p!==void 0)return p.texture;{let v=u.image;return g&&v&&v.height>0||y&&v&&l(v)?(n===null&&(n=new gc(i)),p=g?n.fromEquirectangular(u):n.fromCubemap(u),p.texture.pmremVersion=u.pmremVersion,e.set(u,p),u.addEventListener("dispose",h),p.texture):null}}}return u}function a(u,m){return m===Sa?u.mapping=Qi:m===Ta&&(u.mapping=vs),u}function l(u){let m=0,g=6;for(let y=0;y<g;y++)u[y]!==void 0&&m++;return m===g}function c(u){let m=u.target;m.removeEventListener("dispose",c);let g=t.get(m);g!==void 0&&(t.delete(m),g.dispose())}function h(u){let m=u.target;m.removeEventListener("dispose",h);let g=e.get(m);g!==void 0&&(e.delete(m),g.dispose())}function d(){t=new WeakMap,e=new WeakMap,n!==null&&(n.dispose(),n=null)}return{get:s,dispose:d}}function qg(i){let t={};function e(n){if(t[n]!==void 0)return t[n];let s=i.getExtension(n);return t[n]=s,s}return{has:function(n){return e(n)!==null},init:function(){e("EXT_color_buffer_float"),e("WEBGL_clip_cull_distance"),e("OES_texture_float_linear"),e("EXT_color_buffer_half_float"),e("WEBGL_multisampled_render_to_texture"),e("WEBGL_render_shared_exponent")},get:function(n){let s=e(n);return s===null&&ms("WebGLRenderer: "+n+" extension not supported."),s}}}function Yg(i,t,e,n){let s={},o=new WeakMap;function r(d){let u=d.target;u.index!==null&&t.remove(u.index);for(let g in u.attributes)t.remove(u.attributes[g]);u.removeEventListener("dispose",r),delete s[u.id];let m=o.get(u);m&&(t.remove(m),o.delete(u)),n.releaseStatesOfGeometry(u),u.isInstancedBufferGeometry===!0&&delete u._maxInstanceCount,e.memory.geometries--}function a(d,u){return s[u.id]===!0||(u.addEventListener("dispose",r),s[u.id]=!0,e.memory.geometries++),u}function l(d){let u=d.attributes;for(let m in u)t.update(u[m],i.ARRAY_BUFFER)}function c(d){let u=[],m=d.index,g=d.attributes.position,y=0;if(g===void 0)return;if(m!==null){let v=m.array;y=m.version;for(let S=0,_=v.length;S<_;S+=3){let b=v[S+0],E=v[S+1],A=v[S+2];u.push(b,E,E,A,A,b)}}else{let v=g.array;y=g.version;for(let S=0,_=v.length/3-1;S<_;S+=3){let b=S+0,E=S+1,A=S+2;u.push(b,E,E,A,A,b)}}let p=new(g.count>=65535?Uo:Ho)(u,1);p.version=y;let f=o.get(d);f&&t.remove(f),o.set(d,p)}function h(d){let u=o.get(d);if(u){let m=d.index;m!==null&&u.version<m.version&&c(d)}else c(d);return o.get(d)}return{get:a,update:l,getWireframeAttribute:h}}function Zg(i,t,e){let n;function s(d){n=d}let o,r;function a(d){o=d.type,r=d.bytesPerElement}function l(d,u){i.drawElements(n,u,o,d*r),e.update(u,n,1)}function c(d,u,m){m!==0&&(i.drawElementsInstanced(n,u,o,d*r,m),e.update(u,n,m))}function h(d,u,m){if(m===0)return;t.get("WEBGL_multi_draw").multiDrawElementsWEBGL(n,u,0,o,d,0,m);let y=0;for(let p=0;p<m;p++)y+=u[p];e.update(y,n,1)}this.setMode=s,this.setIndex=a,this.render=l,this.renderInstances=c,this.renderMultiDraw=h}function $g(i){let t={geometries:0,textures:0},e={frame:0,calls:0,triangles:0,points:0,lines:0};function n(o,r,a){switch(e.calls++,r){case i.TRIANGLES:e.triangles+=a*(o/3);break;case i.LINES:e.lines+=a*(o/2);break;case i.LINE_STRIP:e.lines+=a*(o-1);break;case i.LINE_LOOP:e.lines+=a*o;break;case i.POINTS:e.points+=a*o;break;default:Xt("WebGLInfo: Unknown draw mode:",r);break}}function s(){e.calls=0,e.triangles=0,e.points=0,e.lines=0}return{memory:t,render:e,programs:null,autoReset:!0,reset:s,update:n}}function Kg(i,t,e){let n=new WeakMap,s=new _e;function o(r,a,l){let c=r.morphTargetInfluences,h=a.morphAttributes.position||a.morphAttributes.normal||a.morphAttributes.color,d=h!==void 0?h.length:0,u=n.get(a);if(u===void 0||u.count!==d){let w=function(){A.dispose(),n.delete(a),a.removeEventListener("dispose",w)};u!==void 0&&u.texture.dispose();let m=a.morphAttributes.position!==void 0,g=a.morphAttributes.normal!==void 0,y=a.morphAttributes.color!==void 0,p=a.morphAttributes.position||[],f=a.morphAttributes.normal||[],v=a.morphAttributes.color||[],S=0;m===!0&&(S=1),g===!0&&(S=2),y===!0&&(S=3);let _=a.attributes.position.count*S,b=1;_>t.maxTextureSize&&(b=Math.ceil(_/t.maxTextureSize),_=t.maxTextureSize);let E=new Float32Array(_*b*4*d),A=new No(E,_,b,d);A.type=Vn,A.needsUpdate=!0;let M=S*4;for(let T=0;T<d;T++){let P=p[T],N=f[T],F=v[T],D=_*b*4*T;for(let z=0;z<P.count;z++){let L=z*M;m===!0&&(s.fromBufferAttribute(P,z),E[D+L+0]=s.x,E[D+L+1]=s.y,E[D+L+2]=s.z,E[D+L+3]=0),g===!0&&(s.fromBufferAttribute(N,z),E[D+L+4]=s.x,E[D+L+5]=s.y,E[D+L+6]=s.z,E[D+L+7]=0),y===!0&&(s.fromBufferAttribute(F,z),E[D+L+8]=s.x,E[D+L+9]=s.y,E[D+L+10]=s.z,E[D+L+11]=F.itemSize===4?s.w:1)}}u={count:d,texture:A,size:new Zt(_,b)},n.set(a,u),a.addEventListener("dispose",w)}if(r.isInstancedMesh===!0&&r.morphTexture!==null)l.getUniforms().setValue(i,"morphTexture",r.morphTexture,e);else{let m=0;for(let y=0;y<c.length;y++)m+=c[y];let g=a.morphTargetsRelative?1:1-m;l.getUniforms().setValue(i,"morphTargetBaseInfluence",g),l.getUniforms().setValue(i,"morphTargetInfluences",c)}l.getUniforms().setValue(i,"morphTargetsTexture",u.texture,e),l.getUniforms().setValue(i,"morphTargetsTextureSize",u.size)}return{update:o}}function Jg(i,t,e,n,s){let o=new WeakMap;function r(c){let h=s.render.frame,d=c.geometry,u=t.get(c,d);if(o.get(u)!==h&&(t.update(u),o.set(u,h)),c.isInstancedMesh&&(c.hasEventListener("dispose",l)===!1&&c.addEventListener("dispose",l),o.get(c)!==h&&(e.update(c.instanceMatrix,i.ARRAY_BUFFER),c.instanceColor!==null&&e.update(c.instanceColor,i.ARRAY_BUFFER),o.set(c,h))),c.isSkinnedMesh){let m=c.skeleton;o.get(m)!==h&&(m.update(),o.set(m,h))}return u}function a(){o=new WeakMap}function l(c){let h=c.target;h.removeEventListener("dispose",l),n.releaseStatesOfObject(h),e.remove(h.instanceMatrix),h.instanceColor!==null&&e.remove(h.instanceColor)}return{update:r,dispose:a}}var jg={[Sl]:"LINEAR_TONE_MAPPING",[Tl]:"REINHARD_TONE_MAPPING",[Rl]:"CINEON_TONE_MAPPING",[Al]:"ACES_FILMIC_TONE_MAPPING",[Pl]:"AGX_TONE_MAPPING",[Il]:"NEUTRAL_TONE_MAPPING",[Cl]:"CUSTOM_TONE_MAPPING"};function Qg(i,t,e,n,s,o){let r=new un(t,e,{type:i,depthBuffer:s,stencilBuffer:o,samples:n?4:0,storeMultisampledDepthBuffer:!1,storeMultisampledStencilBuffer:!1,resolveDepthBuffer:!1,resolveStencilBuffer:!1}),a=null,l=null,c=new oe;c.setAttribute("position",new qt([-1,3,0,-1,-1,0,3,-1,0],3)),c.setAttribute("uv",new qt([0,2,0,0,2,0],2));let h=new aa({uniforms:{tDiffuse:{value:null}},vertexShader:`
			precision highp float;

			uniform mat4 modelViewMatrix;
			uniform mat4 projectionMatrix;

			attribute vec3 position;
			attribute vec2 uv;

			varying vec2 vUv;

			void main() {
				vUv = uv;
				gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
			}`,fragmentShader:`
			precision highp float;

			uniform sampler2D tDiffuse;

			varying vec2 vUv;

			#include <tonemapping_pars_fragment>
			#include <colorspace_pars_fragment>

			void main() {
				gl_FragColor = texture2D( tDiffuse, vUv );

				#ifdef LINEAR_TONE_MAPPING
					gl_FragColor.rgb = LinearToneMapping( gl_FragColor.rgb );
				#elif defined( REINHARD_TONE_MAPPING )
					gl_FragColor.rgb = ReinhardToneMapping( gl_FragColor.rgb );
				#elif defined( CINEON_TONE_MAPPING )
					gl_FragColor.rgb = CineonToneMapping( gl_FragColor.rgb );
				#elif defined( ACES_FILMIC_TONE_MAPPING )
					gl_FragColor.rgb = ACESFilmicToneMapping( gl_FragColor.rgb );
				#elif defined( AGX_TONE_MAPPING )
					gl_FragColor.rgb = AgXToneMapping( gl_FragColor.rgb );
				#elif defined( NEUTRAL_TONE_MAPPING )
					gl_FragColor.rgb = NeutralToneMapping( gl_FragColor.rgb );
				#elif defined( CUSTOM_TONE_MAPPING )
					gl_FragColor.rgb = CustomToneMapping( gl_FragColor.rgb );
				#endif

				#ifdef SRGB_TRANSFER
					gl_FragColor = sRGBTransferOETF( gl_FragColor );
				#endif
			}`,depthTest:!1,depthWrite:!1}),d=new ut(c,h),u=new Ji(-1,1,1,-1,0,1),m=null,g=null,y=!1,p,f=null,v=[],S=!1;this.setSize=function(_,b){r.setSize(_,b),a!==null&&a.setSize(_,b),l!==null&&l.setSize(_,b);for(let E=0;E<v.length;E++){let A=v[E];A.setSize&&A.setSize(_,b)}},this.setEffects=function(_){v=_,S=v.length>0&&v[0].isRenderPass===!0;let b=r.width,E=r.height;v.length>0&&a===null&&(a=new un(b,E,{type:ei,depthBuffer:!1,stencilBuffer:!1}),l=new un(b,E,{type:ei,depthBuffer:!1,stencilBuffer:!1}));for(let A=0;A<v.length;A++){let M=v[A];M.setSize&&M.setSize(b,E)}},this.begin=function(_,b){if(y||_.toneMapping===ti&&v.length===0)return!1;if(f=b,b!==null){let E=b.width,A=b.height;(r.width!==E||r.height!==A)&&this.setSize(E,A)}return S===!1&&_.setRenderTarget(r),p=_.toneMapping,_.toneMapping=ti,!0},this.hasRenderPass=function(){return S},this.end=function(_,b){_.toneMapping=p,y=!0;let E=r,A=a;for(let M=0;M<v.length;M++){let w=v[M];w.enabled!==!1&&(w.render(_,A,E,b),w.needsSwap!==!1&&(E=A,A=A===a?l:a))}if(m!==_.outputColorSpace||g!==_.toneMapping){m=_.outputColorSpace,g=_.toneMapping,h.defines={},ce.getTransfer(m)===Te&&(h.defines.SRGB_TRANSFER="");let M=jg[g];M&&(h.defines[M]=""),h.needsUpdate=!0}h.uniforms.tDiffuse.value=E.texture,_.setRenderTarget(f),_.render(d,u),f=null,y=!1},this.isCompositing=function(){return y},this.dispose=function(){r.dispose(),a!==null&&a.dispose(),l!==null&&l.dispose(),c.dispose(),h.dispose()}}var A0=new Sn,sh=new jn(1,1),C0=new No,P0=new ia,I0=new Oo,l0=[],h0=[],u0=new Float32Array(16),d0=new Float32Array(9),f0=new Float32Array(4);function ho(i,t,e){let n=i[0];if(n<=0||n>0)return i;let s=t*e,o=l0[s];if(o===void 0&&(o=new Float32Array(s),l0[s]=o),t!==0){n.toArray(o,0);for(let r=1,a=0;r!==t;++r)a+=e,i[r].toArray(o,a)}return o}function sn(i,t){if(i.length!==t.length)return!1;for(let e=0,n=i.length;e<n;e++)if(i[e]!==t[e])return!1;return!0}function on(i,t){for(let e=0,n=t.length;e<n;e++)i[e]=t[e]}function _c(i,t){let e=h0[t];e===void 0&&(e=new Int32Array(t),h0[t]=e);for(let n=0;n!==t;++n)e[n]=i.allocateTextureUnit();return e}function tx(i,t){let e=this.cache;e[0]!==t&&(i.uniform1f(this.addr,t),e[0]=t)}function ex(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(i.uniform2f(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(sn(e,t))return;i.uniform2fv(this.addr,t),on(e,t)}}function nx(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(i.uniform3f(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else if(t.r!==void 0)(e[0]!==t.r||e[1]!==t.g||e[2]!==t.b)&&(i.uniform3f(this.addr,t.r,t.g,t.b),e[0]=t.r,e[1]=t.g,e[2]=t.b);else{if(sn(e,t))return;i.uniform3fv(this.addr,t),on(e,t)}}function ix(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(i.uniform4f(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(sn(e,t))return;i.uniform4fv(this.addr,t),on(e,t)}}function sx(i,t){let e=this.cache,n=t.elements;if(n===void 0){if(sn(e,t))return;i.uniformMatrix2fv(this.addr,!1,t),on(e,t)}else{if(sn(e,n))return;f0.set(n),i.uniformMatrix2fv(this.addr,!1,f0),on(e,n)}}function ox(i,t){let e=this.cache,n=t.elements;if(n===void 0){if(sn(e,t))return;i.uniformMatrix3fv(this.addr,!1,t),on(e,t)}else{if(sn(e,n))return;d0.set(n),i.uniformMatrix3fv(this.addr,!1,d0),on(e,n)}}function rx(i,t){let e=this.cache,n=t.elements;if(n===void 0){if(sn(e,t))return;i.uniformMatrix4fv(this.addr,!1,t),on(e,t)}else{if(sn(e,n))return;u0.set(n),i.uniformMatrix4fv(this.addr,!1,u0),on(e,n)}}function ax(i,t){let e=this.cache;e[0]!==t&&(i.uniform1i(this.addr,t),e[0]=t)}function cx(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(i.uniform2i(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(sn(e,t))return;i.uniform2iv(this.addr,t),on(e,t)}}function lx(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(i.uniform3i(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else{if(sn(e,t))return;i.uniform3iv(this.addr,t),on(e,t)}}function hx(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(i.uniform4i(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(sn(e,t))return;i.uniform4iv(this.addr,t),on(e,t)}}function ux(i,t){let e=this.cache;e[0]!==t&&(i.uniform1ui(this.addr,t),e[0]=t)}function dx(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(i.uniform2ui(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(sn(e,t))return;i.uniform2uiv(this.addr,t),on(e,t)}}function fx(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(i.uniform3ui(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else{if(sn(e,t))return;i.uniform3uiv(this.addr,t),on(e,t)}}function px(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(i.uniform4ui(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(sn(e,t))return;i.uniform4uiv(this.addr,t),on(e,t)}}function mx(i,t,e){let n=this.cache,s=e.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s);let o;this.type===i.SAMPLER_2D_SHADOW?(sh.compareFunction=e.isReversedDepthBuffer()?dc:uc,o=sh):o=A0,e.setTexture2D(t||o,s)}function gx(i,t,e){let n=this.cache,s=e.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),e.setTexture3D(t||P0,s)}function xx(i,t,e){let n=this.cache,s=e.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),e.setTextureCube(t||I0,s)}function yx(i,t,e){let n=this.cache,s=e.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),e.setTexture2DArray(t||C0,s)}function vx(i){switch(i){case 5126:return tx;case 35664:return ex;case 35665:return nx;case 35666:return ix;case 35674:return sx;case 35675:return ox;case 35676:return rx;case 5124:case 35670:return ax;case 35667:case 35671:return cx;case 35668:case 35672:return lx;case 35669:case 35673:return hx;case 5125:return ux;case 36294:return dx;case 36295:return fx;case 36296:return px;case 35678:case 36198:case 36298:case 36306:case 35682:return mx;case 35679:case 36299:case 36307:return gx;case 35680:case 36300:case 36308:case 36293:return xx;case 36289:case 36303:case 36311:case 36292:return yx}}function _x(i,t){i.uniform1fv(this.addr,t)}function Mx(i,t){let e=ho(t,this.size,2);i.uniform2fv(this.addr,e)}function Ex(i,t){let e=ho(t,this.size,3);i.uniform3fv(this.addr,e)}function wx(i,t){let e=ho(t,this.size,4);i.uniform4fv(this.addr,e)}function bx(i,t){let e=ho(t,this.size,4);i.uniformMatrix2fv(this.addr,!1,e)}function Sx(i,t){let e=ho(t,this.size,9);i.uniformMatrix3fv(this.addr,!1,e)}function Tx(i,t){let e=ho(t,this.size,16);i.uniformMatrix4fv(this.addr,!1,e)}function Rx(i,t){i.uniform1iv(this.addr,t)}function Ax(i,t){i.uniform2iv(this.addr,t)}function Cx(i,t){i.uniform3iv(this.addr,t)}function Px(i,t){i.uniform4iv(this.addr,t)}function Ix(i,t){i.uniform1uiv(this.addr,t)}function Dx(i,t){i.uniform2uiv(this.addr,t)}function Lx(i,t){i.uniform3uiv(this.addr,t)}function Nx(i,t){i.uniform4uiv(this.addr,t)}function Hx(i,t,e){let n=this.cache,s=t.length,o=_c(e,s);sn(n,o)||(i.uniform1iv(this.addr,o),on(n,o));let r;this.type===i.SAMPLER_2D_SHADOW?r=sh:r=A0;for(let a=0;a!==s;++a)e.setTexture2D(t[a]||r,o[a])}function Ux(i,t,e){let n=this.cache,s=t.length,o=_c(e,s);sn(n,o)||(i.uniform1iv(this.addr,o),on(n,o));for(let r=0;r!==s;++r)e.setTexture3D(t[r]||P0,o[r])}function kx(i,t,e){let n=this.cache,s=t.length,o=_c(e,s);sn(n,o)||(i.uniform1iv(this.addr,o),on(n,o));for(let r=0;r!==s;++r)e.setTextureCube(t[r]||I0,o[r])}function Fx(i,t,e){let n=this.cache,s=t.length,o=_c(e,s);sn(n,o)||(i.uniform1iv(this.addr,o),on(n,o));for(let r=0;r!==s;++r)e.setTexture2DArray(t[r]||C0,o[r])}function zx(i){switch(i){case 5126:return _x;case 35664:return Mx;case 35665:return Ex;case 35666:return wx;case 35674:return bx;case 35675:return Sx;case 35676:return Tx;case 5124:case 35670:return Rx;case 35667:case 35671:return Ax;case 35668:case 35672:return Cx;case 35669:case 35673:return Px;case 5125:return Ix;case 36294:return Dx;case 36295:return Lx;case 36296:return Nx;case 35678:case 36198:case 36298:case 36306:case 35682:return Hx;case 35679:case 36299:case 36307:return Ux;case 35680:case 36300:case 36308:case 36293:return kx;case 36289:case 36303:case 36311:case 36292:return Fx}}var oh=class{constructor(t,e,n){this.id=t,this.addr=n,this.cache=[],this.type=e.type,this.setValue=vx(e.type)}},rh=class{constructor(t,e,n){this.id=t,this.addr=n,this.cache=[],this.type=e.type,this.size=e.size,this.setValue=zx(e.type)}},ah=class{constructor(t){this.id=t,this.seq=[],this.map={}}setValue(t,e,n){let s=this.seq;for(let o=0,r=s.length;o!==r;++o){let a=s[o];a.setValue(t,e[a.id],n)}}},nh=/(\w+)(\])?(\[|\.)?/g;function p0(i,t){i.seq.push(t),i.map[t.id]=t}function Ox(i,t,e){let n=i.name,s=n.length;for(nh.lastIndex=0;;){let o=nh.exec(n),r=nh.lastIndex,a=o[1],l=o[2]==="]",c=o[3];if(l&&(a=a|0),c===void 0||c==="["&&r+2===s){p0(e,c===void 0?new oh(a,i,t):new rh(a,i,t));break}else{let d=e.map[a];d===void 0&&(d=new ah(a),p0(e,d)),e=d}}}var lo=class{constructor(t,e){this.seq=[],this.map={};let n=t.getProgramParameter(e,t.ACTIVE_UNIFORMS);for(let r=0;r<n;++r){let a=t.getActiveUniform(e,r),l=t.getUniformLocation(e,a.name);Ox(a,l,this)}let s=[],o=[];for(let r of this.seq)r.type===t.SAMPLER_2D_SHADOW||r.type===t.SAMPLER_CUBE_SHADOW||r.type===t.SAMPLER_2D_ARRAY_SHADOW?s.push(r):o.push(r);s.length>0&&(this.seq=s.concat(o))}setValue(t,e,n,s){let o=this.map[e];o!==void 0&&o.setValue(t,n,s)}setOptional(t,e,n){let s=e[n];s!==void 0&&this.setValue(t,n,s)}static upload(t,e,n,s){for(let o=0,r=e.length;o!==r;++o){let a=e[o],l=n[a.id];l.needsUpdate!==!1&&a.setValue(t,l.value,s)}}static seqWithValue(t,e){let n=[];for(let s=0,o=t.length;s!==o;++s){let r=t[s];r.id in e&&n.push(r)}return n}};function m0(i,t,e){let n=i.createShader(t);return i.shaderSource(n,e),i.compileShader(n),n}var Vx=37297,Bx=0;function Gx(i,t){let e=i.split(`
`),n=[],s=Math.max(t-6,0),o=Math.min(t+6,e.length);for(let r=s;r<o;r++){let a=r+1;n.push(`${a===t?">":" "} ${a}: ${e[r]}`)}return n.join(`
`)}var g0=new Jt;function Wx(i){ce._getMatrix(g0,ce.workingColorSpace,i);let t=`mat3( ${g0.elements.map(e=>e.toFixed(4))} )`;switch(ce.getTransfer(i)){case Io:return[t,"LinearTransferOETF"];case Te:return[t,"sRGBTransferOETF"];default:return Wt("WebGLProgram: Unsupported color space: ",i),[t,"LinearTransferOETF"]}}function x0(i,t,e){let n=i.getShaderParameter(t,i.COMPILE_STATUS),o=(i.getShaderInfoLog(t)||"").trim();if(n&&o==="")return"";let r=/ERROR: 0:(\d+)/.exec(o);if(r){let a=parseInt(r[1]);return e.toUpperCase()+`

`+o+`

`+Gx(i.getShaderSource(t),a)}else return o}function Xx(i,t){let e=Wx(t);return[`vec4 ${i}( vec4 value ) {`,`	return ${e[1]}( vec4( value.rgb * ${e[0]}, value.a ) );`,"}"].join(`
`)}var qx={[Sl]:"Linear",[Tl]:"Reinhard",[Rl]:"Cineon",[Al]:"ACESFilmic",[Pl]:"AgX",[Il]:"Neutral",[Cl]:"Custom"};function Yx(i,t){let e=qx[t];return e===void 0?(Wt("WebGLProgram: Unsupported toneMapping:",t),"vec3 "+i+"( vec3 color ) { return LinearToneMapping( color ); }"):"vec3 "+i+"( vec3 color ) { return "+e+"ToneMapping( color ); }"}var mc=new x;function Zx(){ce.getLuminanceCoefficients(mc);let i=mc.x.toFixed(4),t=mc.y.toFixed(4),e=mc.z.toFixed(4);return["float luminance( const in vec3 rgb ) {",`	const vec3 weights = vec3( ${i}, ${t}, ${e} );`,"	return dot( weights, rgb );","}"].join(`
`)}function $x(i){return[i.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",i.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(or).join(`
`)}function Kx(i){let t=[];for(let e in i){let n=i[e];n!==!1&&t.push("#define "+e+" "+n)}return t.join(`
`)}function Jx(i,t){let e={},n=i.getProgramParameter(t,i.ACTIVE_ATTRIBUTES);for(let s=0;s<n;s++){let o=i.getActiveAttrib(t,s),r=o.name,a=1;o.type===i.FLOAT_MAT2&&(a=2),o.type===i.FLOAT_MAT3&&(a=3),o.type===i.FLOAT_MAT4&&(a=4),e[r]={type:o.type,location:i.getAttribLocation(t,r),locationSize:a}}return e}function or(i){return i!==""}function y0(i,t){let e=t.numSpotLightShadows+t.numSpotLightMaps-t.numSpotLightShadowsWithMaps;return i.replace(/NUM_SUN_LIGHTS/g,t.numSunLights).replace(/NUM_DIR_LIGHTS/g,t.numDirLights).replace(/NUM_SPOT_LIGHTS/g,t.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,t.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,e).replace(/NUM_RECT_AREA_LIGHTS/g,t.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,t.numPointLights).replace(/NUM_HEMI_LIGHTS/g,t.numHemiLights).replace(/NUM_SUN_LIGHT_SHADOWS/g,t.numSunLightShadows).replace(/NUM_DIR_LIGHT_SHADOWS/g,t.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,t.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,t.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,t.numPointLightShadows)}function v0(i,t){return i.replace(/NUM_CLIPPING_PLANES/g,t.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,t.numClippingPlanes-t.numClipIntersection)}var jx=/^[ \t]*#include +<([\w\d./]+)>/gm;function ch(i){return i.replace(jx,t1)}var Qx=new Map;function t1(i,t){let e=re[t];if(e===void 0){let n=Qx.get(t);if(n!==void 0)e=re[n],Wt('WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',t,n);else throw new Error("THREE.WebGLProgram: Can not resolve #include <"+t+">")}return ch(e)}var e1=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function _0(i){return i.replace(e1,n1)}function n1(i,t,e,n){let s="";for(let o=parseInt(t);o<parseInt(e);o++)s+=n.replace(/\[\s*i\s*\]/g,"[ "+o+" ]").replace(/UNROLLED_LOOP_INDEX/g,o);return s}function M0(i){let t=`precision ${i.precision} float;
	precision ${i.precision} int;
	precision ${i.precision} sampler2D;
	precision ${i.precision} samplerCube;
	precision ${i.precision} sampler3D;
	precision ${i.precision} sampler2DArray;
	precision ${i.precision} sampler2DShadow;
	precision ${i.precision} samplerCubeShadow;
	precision ${i.precision} sampler2DArrayShadow;
	precision ${i.precision} isampler2D;
	precision ${i.precision} isampler3D;
	precision ${i.precision} isamplerCube;
	precision ${i.precision} isampler2DArray;
	precision ${i.precision} usampler2D;
	precision ${i.precision} usampler3D;
	precision ${i.precision} usamplerCube;
	precision ${i.precision} usampler2DArray;
	`;return i.precision==="highp"?t+=`
#define HIGH_PRECISION`:i.precision==="mediump"?t+=`
#define MEDIUM_PRECISION`:i.precision==="lowp"&&(t+=`
#define LOW_PRECISION`),t}var i1={[Yo]:"SHADOWMAP_TYPE_PCF",[no]:"SHADOWMAP_TYPE_VSM"};function s1(i){return i1[i.shadowMapType]||"SHADOWMAP_TYPE_BASIC"}var o1={[Qi]:"ENVMAP_TYPE_CUBE",[vs]:"ENVMAP_TYPE_CUBE",[$o]:"ENVMAP_TYPE_CUBE_UV"};function r1(i){return i.envMap===!1?"ENVMAP_TYPE_CUBE":o1[i.envMapMode]||"ENVMAP_TYPE_CUBE"}var a1={[vs]:"ENVMAP_MODE_REFRACTION"};function c1(i){return i.envMap===!1?"ENVMAP_MODE_REFLECTION":a1[i.envMapMode]||"ENVMAP_MODE_REFLECTION"}var l1={[bl]:"ENVMAP_BLENDING_MULTIPLY",[zu]:"ENVMAP_BLENDING_MIX",[Ou]:"ENVMAP_BLENDING_ADD"};function h1(i){return i.envMap===!1?"ENVMAP_BLENDING_NONE":l1[i.combine]||"ENVMAP_BLENDING_NONE"}function u1(i){let t=i.envMapCubeUVHeight;if(t===null)return null;let e=Math.log2(t)-2,n=1/t;return{texelWidth:1/(3*Math.max(Math.pow(2,e),112)),texelHeight:n,maxMip:e}}function d1(i,t,e,n){let s=i.getContext(),o=e.defines,r=e.vertexShader,a=e.fragmentShader,l=s1(e),c=r1(e),h=c1(e),d=h1(e),u=u1(e),m=$x(e),g=Kx(o),y=s.createProgram(),p,f,v=e.glslVersion?"#version "+e.glslVersion+`
`:"";e.isRawShaderMaterial?(p=["#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,g].filter(or).join(`
`),p.length>0&&(p+=`
`),f=["#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,g].filter(or).join(`
`),f.length>0&&(f+=`
`)):(p=[M0(e),"#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,g,e.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",e.batching?"#define USE_BATCHING":"",e.batchingColor?"#define USE_BATCHING_COLOR":"",e.instancing?"#define USE_INSTANCING":"",e.instancingColor?"#define USE_INSTANCING_COLOR":"",e.instancingMorph?"#define USE_INSTANCING_MORPH":"",e.useFog&&e.fog?"#define USE_FOG":"",e.useFog&&e.fogExp2?"#define FOG_EXP2":"",e.map?"#define USE_MAP":"",e.envMap?"#define USE_ENVMAP":"",e.envMap?"#define "+h:"",e.lightMap?"#define USE_LIGHTMAP":"",e.aoMap?"#define USE_AOMAP":"",e.bumpMap?"#define USE_BUMPMAP":"",e.normalMap?"#define USE_NORMALMAP":"",e.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",e.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",e.displacementMap?"#define USE_DISPLACEMENTMAP":"",e.emissiveMap?"#define USE_EMISSIVEMAP":"",e.anisotropy?"#define USE_ANISOTROPY":"",e.anisotropyMap?"#define USE_ANISOTROPYMAP":"",e.clearcoatMap?"#define USE_CLEARCOATMAP":"",e.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",e.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",e.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",e.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",e.specularMap?"#define USE_SPECULARMAP":"",e.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",e.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",e.roughnessMap?"#define USE_ROUGHNESSMAP":"",e.metalnessMap?"#define USE_METALNESSMAP":"",e.alphaMap?"#define USE_ALPHAMAP":"",e.alphaHash?"#define USE_ALPHAHASH":"",e.transmission?"#define USE_TRANSMISSION":"",e.transmissionMap?"#define USE_TRANSMISSIONMAP":"",e.thicknessMap?"#define USE_THICKNESSMAP":"",e.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",e.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",e.mapUv?"#define MAP_UV "+e.mapUv:"",e.alphaMapUv?"#define ALPHAMAP_UV "+e.alphaMapUv:"",e.lightMapUv?"#define LIGHTMAP_UV "+e.lightMapUv:"",e.aoMapUv?"#define AOMAP_UV "+e.aoMapUv:"",e.emissiveMapUv?"#define EMISSIVEMAP_UV "+e.emissiveMapUv:"",e.bumpMapUv?"#define BUMPMAP_UV "+e.bumpMapUv:"",e.normalMapUv?"#define NORMALMAP_UV "+e.normalMapUv:"",e.displacementMapUv?"#define DISPLACEMENTMAP_UV "+e.displacementMapUv:"",e.metalnessMapUv?"#define METALNESSMAP_UV "+e.metalnessMapUv:"",e.roughnessMapUv?"#define ROUGHNESSMAP_UV "+e.roughnessMapUv:"",e.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+e.anisotropyMapUv:"",e.clearcoatMapUv?"#define CLEARCOATMAP_UV "+e.clearcoatMapUv:"",e.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+e.clearcoatNormalMapUv:"",e.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+e.clearcoatRoughnessMapUv:"",e.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+e.iridescenceMapUv:"",e.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+e.iridescenceThicknessMapUv:"",e.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+e.sheenColorMapUv:"",e.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+e.sheenRoughnessMapUv:"",e.specularMapUv?"#define SPECULARMAP_UV "+e.specularMapUv:"",e.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+e.specularColorMapUv:"",e.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+e.specularIntensityMapUv:"",e.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+e.transmissionMapUv:"",e.thicknessMapUv?"#define THICKNESSMAP_UV "+e.thicknessMapUv:"",e.vertexTangents&&e.flatShading===!1?"#define USE_TANGENT":"",e.vertexNormals?"#define HAS_NORMAL":"",e.vertexColors?"#define USE_COLOR":"",e.vertexAlphas?"#define USE_COLOR_ALPHA":"",e.vertexUv1s?"#define USE_UV1":"",e.vertexUv2s?"#define USE_UV2":"",e.vertexUv3s?"#define USE_UV3":"",e.pointsUvs?"#define USE_POINTS_UV":"",e.flatShading?"#define FLAT_SHADED":"",e.skinning?"#define USE_SKINNING":"",e.morphTargets?"#define USE_MORPHTARGETS":"",e.morphNormals&&e.flatShading===!1?"#define USE_MORPHNORMALS":"",e.morphColors?"#define USE_MORPHCOLORS":"",e.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+e.morphTextureStride:"",e.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+e.morphTargetsCount:"",e.doubleSided?"#define DOUBLE_SIDED":"",e.flipSided?"#define FLIP_SIDED":"",e.shadowMapEnabled?"#define USE_SHADOWMAP":"",e.shadowMapEnabled?"#define "+l:"",e.sizeAttenuation?"#define USE_SIZEATTENUATION":"",e.numLightProbes>0?"#define USE_LIGHT_PROBES":"",e.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",e.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","	uniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(or).join(`
`),f=[M0(e),"#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,g,e.useFog&&e.fog?"#define USE_FOG":"",e.useFog&&e.fogExp2?"#define FOG_EXP2":"",e.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",e.map?"#define USE_MAP":"",e.matcap?"#define USE_MATCAP":"",e.envMap?"#define USE_ENVMAP":"",e.envMap?"#define "+c:"",e.envMap?"#define "+h:"",e.envMap?"#define "+d:"",u?"#define CUBEUV_TEXEL_WIDTH "+u.texelWidth:"",u?"#define CUBEUV_TEXEL_HEIGHT "+u.texelHeight:"",u?"#define CUBEUV_MAX_MIP "+u.maxMip+".0":"",e.lightMap?"#define USE_LIGHTMAP":"",e.aoMap?"#define USE_AOMAP":"",e.bumpMap?"#define USE_BUMPMAP":"",e.normalMap?"#define USE_NORMALMAP":"",e.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",e.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",e.packedNormalMap?"#define USE_PACKED_NORMALMAP":"",e.emissiveMap?"#define USE_EMISSIVEMAP":"",e.anisotropy?"#define USE_ANISOTROPY":"",e.anisotropyMap?"#define USE_ANISOTROPYMAP":"",e.clearcoat?"#define USE_CLEARCOAT":"",e.clearcoatMap?"#define USE_CLEARCOATMAP":"",e.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",e.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",e.dispersion?"#define USE_DISPERSION":"",e.retroreflection?"#define USE_RETROREFLECTION":"",e.iridescence?"#define USE_IRIDESCENCE":"",e.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",e.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",e.specularMap?"#define USE_SPECULARMAP":"",e.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",e.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",e.roughnessMap?"#define USE_ROUGHNESSMAP":"",e.metalnessMap?"#define USE_METALNESSMAP":"",e.alphaMap?"#define USE_ALPHAMAP":"",e.alphaTest?"#define USE_ALPHATEST":"",e.alphaHash?"#define USE_ALPHAHASH":"",e.sheen?"#define USE_SHEEN":"",e.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",e.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",e.transmission?"#define USE_TRANSMISSION":"",e.transmissionMap?"#define USE_TRANSMISSIONMAP":"",e.thicknessMap?"#define USE_THICKNESSMAP":"",e.vertexTangents&&e.flatShading===!1?"#define USE_TANGENT":"",e.vertexColors||e.instancingColor?"#define USE_COLOR":"",e.vertexAlphas||e.batchingColor?"#define USE_COLOR_ALPHA":"",e.vertexUv1s?"#define USE_UV1":"",e.vertexUv2s?"#define USE_UV2":"",e.vertexUv3s?"#define USE_UV3":"",e.pointsUvs?"#define USE_POINTS_UV":"",e.gradientMap?"#define USE_GRADIENTMAP":"",e.flatShading?"#define FLAT_SHADED":"",e.doubleSided?"#define DOUBLE_SIDED":"",e.flipSided?"#define FLIP_SIDED":"",e.shadowMapEnabled?"#define USE_SHADOWMAP":"",e.shadowMapEnabled?"#define "+l:"",e.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",e.numLightProbes>0?"#define USE_LIGHT_PROBES":"",e.numLightProbeGrids>0?"#define USE_LIGHT_PROBES_GRID":"",e.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",e.decodeVideoTextureEmissive?"#define DECODE_VIDEO_TEXTURE_EMISSIVE":"",e.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",e.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",e.toneMapping!==ti?"#define TONE_MAPPING":"",e.toneMapping!==ti?re.tonemapping_pars_fragment:"",e.toneMapping!==ti?Yx("toneMapping",e.toneMapping):"",e.dithering?"#define DITHERING":"",e.opaque?"#define OPAQUE":"",re.colorspace_pars_fragment,Xx("linearToOutputTexel",e.outputColorSpace),Zx(),e.useDepthPacking?"#define DEPTH_PACKING "+e.depthPacking:"",`
`].filter(or).join(`
`)),r=ch(r),r=y0(r,e),r=v0(r,e),a=ch(a),a=y0(a,e),a=v0(a,e),r=_0(r),a=_0(a),e.isRawShaderMaterial!==!0&&(v=`#version 300 es
`,p=[m,"#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+p,f=["#define varying in",e.glslVersion===Ol?"":"layout(location = 0) out highp vec4 pc_fragColor;",e.glslVersion===Ol?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+f);let S=v+p+r,_=v+f+a,b=m0(s,s.VERTEX_SHADER,S),E=m0(s,s.FRAGMENT_SHADER,_);s.attachShader(y,b),s.attachShader(y,E),e.index0AttributeName!==void 0?s.bindAttribLocation(y,0,e.index0AttributeName):e.hasPositionAttribute===!0&&s.bindAttribLocation(y,0,"position"),s.linkProgram(y);function A(P){if(i.debug.checkShaderErrors){let N=s.getProgramInfoLog(y)||"",F=s.getShaderInfoLog(b)||"",D=s.getShaderInfoLog(E)||"",z=N.trim(),L=F.trim(),U=D.trim(),O=!0,k=!0;if(s.getProgramParameter(y,s.LINK_STATUS)===!1)if(O=!1,typeof i.debug.onShaderError=="function")i.debug.onShaderError(s,y,b,E);else{let W=x0(s,b,"vertex"),q=x0(s,E,"fragment");Xt("WebGLProgram: Shader Error "+s.getError()+" - VALIDATE_STATUS "+s.getProgramParameter(y,s.VALIDATE_STATUS)+`

Material Name: `+P.name+`
Material Type: `+P.type+`

Program Info Log: `+z+`
`+W+`
`+q)}else z!==""?Wt("WebGLProgram: Program Info Log:",z):(L===""||U==="")&&(k=!1);k&&(P.diagnostics={runnable:O,programLog:z,vertexShader:{log:L,prefix:p},fragmentShader:{log:U,prefix:f}})}s.deleteShader(b),s.deleteShader(E),M=new lo(s,y),w=Jx(s,y)}let M;this.getUniforms=function(){return M===void 0&&A(this),M};let w;this.getAttributes=function(){return w===void 0&&A(this),w};let T=e.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return T===!1&&(T=s.getProgramParameter(y,Vx)),T},this.destroy=function(){n.releaseStatesOfProgram(this),s.deleteProgram(y),this.program=void 0},this.type=e.shaderType,this.name=e.shaderName,this.id=Bx++,this.cacheKey=t,this.usedTimes=1,this.program=y,this.vertexShader=b,this.fragmentShader=E,this}var f1=0,lh=class{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(t,e,n){let s=this._getShaderCacheForMaterial(t);return s.has(e)===!1&&(s.add(e),e.usedTimes++),s.has(n)===!1&&(s.add(n),n.usedTimes++),this}remove(t){let e=this.materialCache.get(t);for(let n of e)n.usedTimes--,n.usedTimes===0&&this.shaderCache.delete(n.code);return this.materialCache.delete(t),this}getVertexShaderStage(t){return this._getShaderStage(t.vertexShader)}getFragmentShaderStage(t){return this._getShaderStage(t.fragmentShader)}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(t){let e=this.materialCache,n=e.get(t);return n===void 0&&(n=new Set,e.set(t,n)),n}_getShaderStage(t){let e=this.shaderCache,n=e.get(t);return n===void 0&&(n=new hh(t),e.set(t,n)),n}},hh=class{constructor(t){this.id=f1++,this.code=t,this.usedTimes=0}};function p1(i){return i===ns||i===er||i===nr}function m1(i,t,e,n,s,o){let r=new js,a=new lh,l=new Set,c=[],h=new Map,d=n.logarithmicDepthBuffer,u=n.precision,m={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distance",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function g(M){return l.add(M),M===0?"uv":`uv${M}`}function y(M,w,T,P,N,F){let D=P.fog,z=N.geometry,L=M.isMeshStandardMaterial||M.isMeshLambertMaterial||M.isMeshPhongMaterial?P.environment:null,U=M.isMeshStandardMaterial||M.isMeshLambertMaterial&&!M.envMap||M.isMeshPhongMaterial&&!M.envMap,O=t.get(M.envMap||L,U),k=O&&O.mapping===$o?O.image.height:null,W=m[M.type];M.precision!==null&&(u=n.getMaxPrecision(M.precision),u!==M.precision&&Wt("WebGLProgram.getParameters:",M.precision,"not supported, using",u,"instead."));let q=z.morphAttributes.position||z.morphAttributes.normal||z.morphAttributes.color,at=q!==void 0?q.length:0,it=0;z.morphAttributes.position!==void 0&&(it=1),z.morphAttributes.normal!==void 0&&(it=2),z.morphAttributes.color!==void 0&&(it=3);let lt,wt,gt,K;if(W){let Ne=pi[W];lt=Ne.vertexShader,wt=Ne.fragmentShader}else{lt=M.vertexShader,wt=M.fragmentShader;let Ne=a.getVertexShaderStage(M),be=a.getFragmentShaderStage(M);a.update(M,Ne,be),gt=Ne.id,K=be.id}let tt=i.getRenderTarget(),dt=i.state.buffers.depth.getReversed(),Ct=N.isInstancedMesh===!0,_t=N.isBatchedMesh===!0,$t=!!M.map,Ee=!!M.matcap,te=!!O,ee=!!M.aoMap,xe=!!M.lightMap,ne=!!M.bumpMap&&M.wireframe===!1,we=!!M.normalMap,Pe=!!M.displacementMap,Xe=!!M.emissiveMap,Fe=!!M.metalnessMap,We=!!M.roughnessMap,V=M.anisotropy>0,ue=M.clearcoat>0,Kt=M.dispersion>0,H=M.retroreflectivity>0,R=M.iridescence>0,X=M.sheen>0,$=M.transmission>0,nt=V&&!!M.anisotropyMap,ft=ue&&!!M.clearcoatMap,mt=ue&&!!M.clearcoatNormalMap,st=ue&&!!M.clearcoatRoughnessMap,rt=R&&!!M.iridescenceMap,xt=R&&!!M.iridescenceThicknessMap,et=X&&!!M.sheenColorMap,pt=X&&!!M.sheenRoughnessMap,ht=!!M.specularMap,Pt=!!M.specularColorMap,Lt=!!M.specularIntensityMap,Yt=$&&!!M.transmissionMap,B=$&&!!M.thicknessMap,Mt=!!M.gradientMap,ot=!!M.alphaMap,Et=M.alphaTest>0,At=!!M.alphaHash,ct=!!M.extensions,Ot=ti;M.toneMapped&&(tt===null||tt.isXRRenderTarget===!0)&&(Ot=i.toneMapping);let kt={shaderID:W,shaderType:M.type,shaderName:M.name,vertexShader:lt,fragmentShader:wt,defines:M.defines,customVertexShaderID:gt,customFragmentShaderID:K,isRawShaderMaterial:M.isRawShaderMaterial===!0,glslVersion:M.glslVersion,precision:u,batching:_t,batchingColor:_t&&N._colorsTexture!==null,instancing:Ct,instancingColor:Ct&&N.instanceColor!==null,instancingMorph:Ct&&N.morphTexture!==null,outputColorSpace:tt===null?i.outputColorSpace:tt.isXRRenderTarget===!0?tt.texture.colorSpace:ce.workingColorSpace,alphaToCoverage:!!M.alphaToCoverage,map:$t,matcap:Ee,envMap:te,envMapMode:te&&O.mapping,envMapCubeUVHeight:k,aoMap:ee,lightMap:xe,bumpMap:ne,normalMap:we,displacementMap:Pe,emissiveMap:Xe,normalMapObjectSpace:we&&M.normalMapType===Gu,normalMapTangentSpace:we&&M.normalMapType===zl,packedNormalMap:we&&M.normalMapType===zl&&p1(M.normalMap.format),metalnessMap:Fe,roughnessMap:We,anisotropy:V,anisotropyMap:nt,clearcoat:ue,clearcoatMap:ft,clearcoatNormalMap:mt,clearcoatRoughnessMap:st,dispersion:Kt,retroreflection:H,iridescence:R,iridescenceMap:rt,iridescenceThicknessMap:xt,sheen:X,sheenColorMap:et,sheenRoughnessMap:pt,specularMap:ht,specularColorMap:Pt,specularIntensityMap:Lt,transmission:$,transmissionMap:Yt,thicknessMap:B,gradientMap:Mt,opaque:M.transparent===!1&&M.blending===ji&&M.alphaToCoverage===!1,alphaMap:ot,alphaTest:Et,alphaHash:At,combine:M.combine,mapUv:$t&&g(M.map.channel),aoMapUv:ee&&g(M.aoMap.channel),lightMapUv:xe&&g(M.lightMap.channel),bumpMapUv:ne&&g(M.bumpMap.channel),normalMapUv:we&&g(M.normalMap.channel),displacementMapUv:Pe&&g(M.displacementMap.channel),emissiveMapUv:Xe&&g(M.emissiveMap.channel),metalnessMapUv:Fe&&g(M.metalnessMap.channel),roughnessMapUv:We&&g(M.roughnessMap.channel),anisotropyMapUv:nt&&g(M.anisotropyMap.channel),clearcoatMapUv:ft&&g(M.clearcoatMap.channel),clearcoatNormalMapUv:mt&&g(M.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:st&&g(M.clearcoatRoughnessMap.channel),iridescenceMapUv:rt&&g(M.iridescenceMap.channel),iridescenceThicknessMapUv:xt&&g(M.iridescenceThicknessMap.channel),sheenColorMapUv:et&&g(M.sheenColorMap.channel),sheenRoughnessMapUv:pt&&g(M.sheenRoughnessMap.channel),specularMapUv:ht&&g(M.specularMap.channel),specularColorMapUv:Pt&&g(M.specularColorMap.channel),specularIntensityMapUv:Lt&&g(M.specularIntensityMap.channel),transmissionMapUv:Yt&&g(M.transmissionMap.channel),thicknessMapUv:B&&g(M.thicknessMap.channel),alphaMapUv:ot&&g(M.alphaMap.channel),vertexTangents:!!z.attributes.tangent&&(we||V),vertexNormals:!!z.attributes.normal,vertexColors:M.vertexColors,vertexAlphas:M.vertexColors===!0&&!!z.attributes.color&&z.attributes.color.itemSize===4,pointsUvs:N.isPoints===!0&&!!z.attributes.uv&&($t||ot),fog:!!D,useFog:M.fog===!0,fogExp2:!!D&&D.isFogExp2,flatShading:M.wireframe===!1&&(M.flatShading===!0||z.attributes.normal===void 0&&we===!1&&(M.isMeshLambertMaterial||M.isMeshPhongMaterial||M.isMeshStandardMaterial||M.isMeshPhysicalMaterial)),sizeAttenuation:M.sizeAttenuation===!0,logarithmicDepthBuffer:d,reversedDepthBuffer:dt,skinning:N.isSkinnedMesh===!0,hasPositionAttribute:z.attributes.position!==void 0,morphTargets:z.morphAttributes.position!==void 0,morphNormals:z.morphAttributes.normal!==void 0,morphColors:z.morphAttributes.color!==void 0,morphTargetsCount:at,morphTextureStride:it,numSunLights:w.sun.length,numDirLights:w.directional.length,numPointLights:w.point.length,numSpotLights:w.spot.length,numSpotLightMaps:w.spotLightMap.length,numRectAreaLights:w.rectArea.length,numHemiLights:w.hemi.length,numSunLightShadows:w.sunShadowMap.length,numDirLightShadows:w.directionalShadowMap.length,numPointLightShadows:w.pointShadowMap.length,numSpotLightShadows:w.spotShadowMap.length,numSpotLightShadowsWithMaps:w.numSpotLightShadowsWithMaps,numLightProbes:w.numLightProbes,numLightProbeGrids:F.length,numClippingPlanes:o.numPlanes,numClipIntersection:o.numIntersection,dithering:M.dithering,shadowMapEnabled:i.shadowMap.enabled&&T.length>0,shadowMapType:i.shadowMap.type,toneMapping:Ot,decodeVideoTexture:$t&&M.map.isVideoTexture===!0&&ce.getTransfer(M.map.colorSpace)===Te,decodeVideoTextureEmissive:Xe&&M.emissiveMap.isVideoTexture===!0&&ce.getTransfer(M.emissiveMap.colorSpace)===Te,premultipliedAlpha:M.premultipliedAlpha,doubleSided:M.side===me,flipSided:M.side===fn,useDepthPacking:M.depthPacking>=0,depthPacking:M.depthPacking||0,index0AttributeName:M.index0AttributeName,extensionClipCullDistance:ct&&M.extensions.clipCullDistance===!0&&e.has("WEBGL_clip_cull_distance"),extensionMultiDraw:(ct&&M.extensions.multiDraw===!0||_t)&&e.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:e.has("KHR_parallel_shader_compile"),customProgramCacheKey:M.customProgramCacheKey()};return kt.vertexUv1s=l.has(1),kt.vertexUv2s=l.has(2),kt.vertexUv3s=l.has(3),l.clear(),kt}function p(M){let w=[];if(M.shaderID?w.push(M.shaderID):(w.push(M.customVertexShaderID),w.push(M.customFragmentShaderID)),M.defines!==void 0)for(let T in M.defines)w.push(T),w.push(M.defines[T]);return M.isRawShaderMaterial===!1&&(f(w,M),v(w,M),w.push(i.outputColorSpace)),w.push(M.customProgramCacheKey),w.join()}function f(M,w){M.push(w.precision),M.push(w.outputColorSpace),M.push(w.envMapMode),M.push(w.envMapCubeUVHeight),M.push(w.mapUv),M.push(w.alphaMapUv),M.push(w.lightMapUv),M.push(w.aoMapUv),M.push(w.bumpMapUv),M.push(w.normalMapUv),M.push(w.displacementMapUv),M.push(w.emissiveMapUv),M.push(w.metalnessMapUv),M.push(w.roughnessMapUv),M.push(w.anisotropyMapUv),M.push(w.clearcoatMapUv),M.push(w.clearcoatNormalMapUv),M.push(w.clearcoatRoughnessMapUv),M.push(w.iridescenceMapUv),M.push(w.iridescenceThicknessMapUv),M.push(w.sheenColorMapUv),M.push(w.sheenRoughnessMapUv),M.push(w.specularMapUv),M.push(w.specularColorMapUv),M.push(w.specularIntensityMapUv),M.push(w.transmissionMapUv),M.push(w.thicknessMapUv),M.push(w.combine),M.push(w.fogExp2),M.push(w.sizeAttenuation),M.push(w.morphTargetsCount),M.push(w.morphAttributeCount),M.push(w.numSunLights),M.push(w.numDirLights),M.push(w.numPointLights),M.push(w.numSpotLights),M.push(w.numSpotLightMaps),M.push(w.numHemiLights),M.push(w.numRectAreaLights),M.push(w.numSunLightShadows),M.push(w.numDirLightShadows),M.push(w.numPointLightShadows),M.push(w.numSpotLightShadows),M.push(w.numSpotLightShadowsWithMaps),M.push(w.numLightProbes),M.push(w.shadowMapType),M.push(w.toneMapping),M.push(w.numClippingPlanes),M.push(w.numClipIntersection),M.push(w.depthPacking)}function v(M,w){r.disableAll(),w.instancing&&r.enable(0),w.instancingColor&&r.enable(1),w.instancingMorph&&r.enable(2),w.matcap&&r.enable(3),w.envMap&&r.enable(4),w.normalMapObjectSpace&&r.enable(5),w.normalMapTangentSpace&&r.enable(6),w.clearcoat&&r.enable(7),w.iridescence&&r.enable(8),w.alphaTest&&r.enable(9),w.vertexColors&&r.enable(10),w.vertexAlphas&&r.enable(11),w.vertexUv1s&&r.enable(12),w.vertexUv2s&&r.enable(13),w.vertexUv3s&&r.enable(14),w.vertexTangents&&r.enable(15),w.anisotropy&&r.enable(16),w.alphaHash&&r.enable(17),w.batching&&r.enable(18),w.dispersion&&r.enable(19),w.retroreflection&&r.enable(24),w.batchingColor&&r.enable(20),w.gradientMap&&r.enable(21),w.packedNormalMap&&r.enable(22),w.vertexNormals&&r.enable(23),M.push(r.mask),r.disableAll(),w.fog&&r.enable(0),w.useFog&&r.enable(1),w.flatShading&&r.enable(2),w.logarithmicDepthBuffer&&r.enable(3),w.reversedDepthBuffer&&r.enable(4),w.skinning&&r.enable(5),w.morphTargets&&r.enable(6),w.morphNormals&&r.enable(7),w.morphColors&&r.enable(8),w.premultipliedAlpha&&r.enable(9),w.shadowMapEnabled&&r.enable(10),w.doubleSided&&r.enable(11),w.flipSided&&r.enable(12),w.useDepthPacking&&r.enable(13),w.dithering&&r.enable(14),w.transmission&&r.enable(15),w.sheen&&r.enable(16),w.opaque&&r.enable(17),w.pointsUvs&&r.enable(18),w.decodeVideoTexture&&r.enable(19),w.decodeVideoTextureEmissive&&r.enable(20),w.alphaToCoverage&&r.enable(21),w.numLightProbeGrids>0&&r.enable(22),w.hasPositionAttribute&&r.enable(23),M.push(r.mask)}function S(M){let w=m[M.type],T;if(w){let P=pi[w];T=n0.clone(P.uniforms)}else T=M.uniforms;return T}function _(M,w){let T=h.get(w);return T!==void 0?++T.usedTimes:(T=new d1(i,w,M,s),c.push(T),h.set(w,T)),T}function b(M){if(--M.usedTimes===0){let w=c.indexOf(M);c[w]=c[c.length-1],c.pop(),h.delete(M.cacheKey),M.destroy()}}function E(M){a.remove(M)}function A(){a.dispose()}return{getParameters:y,getProgramCacheKey:p,getUniforms:S,acquireProgram:_,releaseProgram:b,releaseShaderCache:E,programs:c,dispose:A}}function g1(){let i=new WeakMap;function t(r){return i.has(r)}function e(r){let a=i.get(r);return a===void 0&&(a={},i.set(r,a)),a}function n(r){i.delete(r)}function s(r,a,l){i.get(r)[a]=l}function o(){i=new WeakMap}return{has:t,get:e,remove:n,update:s,dispose:o}}function x1(i,t){return i.groupOrder!==t.groupOrder?i.groupOrder-t.groupOrder:i.renderOrder!==t.renderOrder?i.renderOrder-t.renderOrder:i.material.id!==t.material.id?i.material.id-t.material.id:i.materialVariant!==t.materialVariant?i.materialVariant-t.materialVariant:i.z!==t.z?i.z-t.z:i.id-t.id}function E0(i,t){return i.groupOrder!==t.groupOrder?i.groupOrder-t.groupOrder:i.renderOrder!==t.renderOrder?i.renderOrder-t.renderOrder:i.z!==t.z?t.z-i.z:i.id-t.id}function w0(){let i=[],t=0,e=[],n=[],s=[];function o(){t=0,e.length=0,n.length=0,s.length=0}function r(u){let m=0;return u.isInstancedMesh&&(m+=2),u.isSkinnedMesh&&(m+=1),m}function a(u,m,g,y,p,f){let v=i[t];return v===void 0?(v={id:u.id,object:u,geometry:m,material:g,materialVariant:r(u),groupOrder:y,renderOrder:u.renderOrder,z:p,group:f},i[t]=v):(v.id=u.id,v.object=u,v.geometry=m,v.material=g,v.materialVariant=r(u),v.groupOrder=y,v.renderOrder=u.renderOrder,v.z=p,v.group=f),t++,v}function l(u,m,g,y,p,f,v){v.reversedDepth===!0&&(p=-p);let S=a(u,m,g,y,p,f);g.transmission>0?n.push(S):g.transparent===!0?s.push(S):e.push(S)}function c(u,m,g,y,p,f){let v=a(u,m,g,y,p,f);g.transmission>0?n.unshift(v):g.transparent===!0?s.unshift(v):e.unshift(v)}function h(u,m){e.length>1&&e.sort(u||x1),n.length>1&&n.sort(m||E0),s.length>1&&s.sort(m||E0)}function d(){for(let u=t,m=i.length;u<m;u++){let g=i[u];if(g.id===null)break;g.id=null,g.object=null,g.geometry=null,g.material=null,g.group=null}}return{opaque:e,transmissive:n,transparent:s,init:o,push:l,unshift:c,finish:d,sort:h}}function y1(){let i=new WeakMap;function t(n,s){let o=i.get(n),r;return o===void 0?(r=new w0,i.set(n,[r])):s>=o.length?(r=new w0,o.push(r)):r=o[s],r}function e(){i=new WeakMap}return{get:t,dispose:e}}function v1(){let i={};return{get:function(t){if(i[t.id]!==void 0)return i[t.id];let e;switch(t.type){case"SunLight":case"DirectionalLight":e={direction:new x,color:new J};break;case"SpotLight":e={position:new x,direction:new x,color:new J,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":e={position:new x,color:new J,distance:0,decay:0};break;case"HemisphereLight":e={direction:new x,skyColor:new J,groundColor:new J};break;case"RectAreaLight":e={color:new J,position:new x,halfWidth:new x,halfHeight:new x};break}return i[t.id]=e,e}}}function _1(){let i={};return{get:function(t){if(i[t.id]!==void 0)return i[t.id];let e;switch(t.type){case"SunLight":case"DirectionalLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Zt};break;case"SpotLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Zt};break;case"PointLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Zt,shadowCameraNear:1,shadowCameraFar:1e3};break}return i[t.id]=e,e}}}var M1=0;function E1(i,t){return(t.castShadow?2:0)-(i.castShadow?2:0)+(t.map?1:0)-(i.map?1:0)}function w1(i){let t=new v1,e=_1(),n={version:0,hash:{sunLength:-1,directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numSunShadows:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],sun:[],sunShadow:[],sunShadowMap:[],sunShadowMatrix:[],sunShadowCascade:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let c=0;c<9;c++)n.probe.push(new x);let s=new x,o=new le,r=new le;function a(c){let h=0,d=0,u=0;for(let N=0;N<9;N++)n.probe[N].set(0,0,0);let m=0,g=0,y=0,p=0,f=0,v=0,S=0,_=0,b=0,E=0,A=0,M=0,w=0,T=0;c.sort(E1);for(let N=0,F=c.length;N<F;N++){let D=c[N],z=D.color,L=D.intensity,U=D.distance,O=null;if(D.shadow&&D.shadow.map&&(D.shadow.map.texture.format===ns?O=D.shadow.map.texture:O=D.shadow.map.depthTexture||D.shadow.map.texture),D.isAmbientLight)h+=z.r*L,d+=z.g*L,u+=z.b*L;else if(D.isLightProbe){for(let k=0;k<9;k++)n.probe[k].addScaledVector(D.sh.coefficients[k],L);T++}else if(D.isSunLight){let k=t.get(D);if(k.color.copy(D.color).multiplyScalar(D.intensity),D.castShadow){let W=D.shadow,q=e.get(D);q.shadowIntensity=W.intensity,q.shadowBias=W.bias,q.shadowNormalBias=W.normalBias,q.shadowRadius=W.radius,q.shadowMapSize.copy(W.mapSize).multiply(W.getFrameExtents()),n.sunShadow[g]=q,n.sunShadowMap[g]=O;let at=W.getViewportCount();for(let it=0;it<at;it++)n.sunShadowMatrix[y+it]=W.getMatrix(it),n.sunShadowCascade[y+it]=W._cascadeData[it];y+=at,g++}n.sun[m]=k,m++}else if(D.isDirectionalLight){let k=t.get(D);if(k.color.copy(D.color).multiplyScalar(D.intensity),D.castShadow){let W=D.shadow,q=e.get(D);q.shadowIntensity=W.intensity,q.shadowBias=W.bias,q.shadowNormalBias=W.normalBias,q.shadowRadius=W.radius,q.shadowMapSize=W.mapSize,n.directionalShadow[p]=q,n.directionalShadowMap[p]=O,n.directionalShadowMatrix[p]=D.shadow.matrix,b++}n.directional[p]=k,p++}else if(D.isSpotLight){let k=t.get(D);k.position.setFromMatrixPosition(D.matrixWorld),k.color.copy(z).multiplyScalar(L),k.distance=U,k.coneCos=Math.cos(D.angle),k.penumbraCos=Math.cos(D.angle*(1-D.penumbra)),k.decay=D.decay,n.spot[v]=k;let W=D.shadow;if(D.map&&(n.spotLightMap[M]=D.map,M++,W.updateMatrices(D),D.castShadow&&w++),n.spotLightMatrix[v]=W.matrix,D.castShadow){let q=e.get(D);q.shadowIntensity=W.intensity,q.shadowBias=W.bias,q.shadowNormalBias=W.normalBias,q.shadowRadius=W.radius,q.shadowMapSize=W.mapSize,n.spotShadow[v]=q,n.spotShadowMap[v]=O,A++}v++}else if(D.isRectAreaLight){let k=t.get(D);k.color.copy(z).multiplyScalar(L),k.halfWidth.set(D.width*.5,0,0),k.halfHeight.set(0,D.height*.5,0),n.rectArea[S]=k,S++}else if(D.isPointLight){let k=t.get(D);if(k.color.copy(D.color).multiplyScalar(D.intensity),k.distance=D.distance,k.decay=D.decay,D.castShadow){let W=D.shadow,q=e.get(D);q.shadowIntensity=W.intensity,q.shadowBias=W.bias,q.shadowNormalBias=W.normalBias,q.shadowRadius=W.radius,q.shadowMapSize=W.mapSize,q.shadowCameraNear=W.camera.near,q.shadowCameraFar=W.camera.far,n.pointShadow[f]=q,n.pointShadowMap[f]=O,n.pointShadowMatrix[f]=D.shadow.matrix,E++}n.point[f]=k,f++}else if(D.isHemisphereLight){let k=t.get(D);k.skyColor.copy(D.color).multiplyScalar(L),k.groundColor.copy(D.groundColor).multiplyScalar(L),n.hemi[_]=k,_++}}S>0&&(i.has("OES_texture_float_linear")===!0?(n.rectAreaLTC1=bt.LTC_FLOAT_1,n.rectAreaLTC2=bt.LTC_FLOAT_2):(n.rectAreaLTC1=bt.LTC_HALF_1,n.rectAreaLTC2=bt.LTC_HALF_2)),n.ambient[0]=h,n.ambient[1]=d,n.ambient[2]=u;let P=n.hash;(P.sunLength!==m||P.directionalLength!==p||P.pointLength!==f||P.spotLength!==v||P.rectAreaLength!==S||P.hemiLength!==_||P.numSunShadows!==g||P.numDirectionalShadows!==b||P.numPointShadows!==E||P.numSpotShadows!==A||P.numSpotMaps!==M||P.numLightProbes!==T)&&(n.sun.length=m,n.directional.length=p,n.spot.length=v,n.rectArea.length=S,n.point.length=f,n.hemi.length=_,n.sunShadow.length=g,n.sunShadowMap.length=g,n.sunShadowMatrix.length=y,n.sunShadowCascade.length=y,n.directionalShadow.length=b,n.directionalShadowMap.length=b,n.directionalShadowMatrix.length=b,n.pointShadow.length=E,n.pointShadowMap.length=E,n.pointShadowMatrix.length=E,n.spotShadow.length=A,n.spotShadowMap.length=A,n.spotLightMatrix.length=A+M-w,n.spotLightMap.length=M,n.numSpotLightShadowsWithMaps=w,n.numLightProbes=T,P.sunLength=m,P.directionalLength=p,P.pointLength=f,P.spotLength=v,P.rectAreaLength=S,P.hemiLength=_,P.numSunShadows=g,P.numDirectionalShadows=b,P.numPointShadows=E,P.numSpotShadows=A,P.numSpotMaps=M,P.numLightProbes=T,n.version=M1++)}function l(c,h){let d=0,u=0,m=0,g=0,y=0,p=0,f=h.matrixWorldInverse;for(let v=0,S=c.length;v<S;v++){let _=c[v];if(_.isSunLight){let b=n.sun[d];b.direction.setFromMatrixPosition(_.matrixWorld),b.direction.transformDirection(f),d++}else if(_.isDirectionalLight){let b=n.directional[u];b.direction.setFromMatrixPosition(_.matrixWorld),s.setFromMatrixPosition(_.target.matrixWorld),b.direction.sub(s),b.direction.transformDirection(f),u++}else if(_.isSpotLight){let b=n.spot[g];b.position.setFromMatrixPosition(_.matrixWorld),b.position.applyMatrix4(f),b.direction.setFromMatrixPosition(_.matrixWorld),s.setFromMatrixPosition(_.target.matrixWorld),b.direction.sub(s),b.direction.transformDirection(f),g++}else if(_.isRectAreaLight){let b=n.rectArea[y];b.position.setFromMatrixPosition(_.matrixWorld),b.position.applyMatrix4(f),r.identity(),o.copy(_.matrixWorld),o.premultiply(f),r.extractRotation(o),b.halfWidth.set(_.width*.5,0,0),b.halfHeight.set(0,_.height*.5,0),b.halfWidth.applyMatrix4(r),b.halfHeight.applyMatrix4(r),y++}else if(_.isPointLight){let b=n.point[m];b.position.setFromMatrixPosition(_.matrixWorld),b.position.applyMatrix4(f),m++}else if(_.isHemisphereLight){let b=n.hemi[p];b.direction.setFromMatrixPosition(_.matrixWorld),b.direction.transformDirection(f),p++}}}return{setup:a,setupView:l,state:n}}function b0(i){let t=new w1(i),e=[],n=[],s=[];function o(u){d.camera=u,e.length=0,n.length=0,s.length=0}function r(u){e.push(u)}function a(u){n.push(u)}function l(u){s.push(u)}function c(){t.setup(e)}function h(u){t.setupView(e,u)}let d={lightsArray:e,shadowsArray:n,lightProbeGridArray:s,camera:null,lights:t,transmissionRenderTarget:{},textureUnits:0};return{init:o,state:d,setupLights:c,setupLightsView:h,pushLight:r,pushShadow:a,pushLightProbeGrid:l}}function b1(i){let t=new WeakMap;function e(s,o=0){let r=t.get(s),a;return r===void 0?(a=new b0(i),t.set(s,[a])):o>=r.length?(a=new b0(i),r.push(a)):a=r[o],a}function n(){t=new WeakMap}return{get:e,dispose:n}}var S1=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,T1=`uniform sampler2D shadow_pass;
uniform vec2 resolution;
uniform float radius;
void main() {
	const float samples = float( VSM_SAMPLES );
	float mean = 0.0;
	float squared_mean = 0.0;
	float uvStride = samples <= 1.0 ? 0.0 : 2.0 / ( samples - 1.0 );
	float uvStart = samples <= 1.0 ? 0.0 : - 1.0;
	for ( float i = 0.0; i < samples; i ++ ) {
		float uvOffset = uvStart + i * uvStride;
		#ifdef HORIZONTAL_PASS
			vec2 distribution = texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( uvOffset, 0.0 ) * radius ) / resolution ).rg;
			mean += distribution.x;
			squared_mean += distribution.y * distribution.y + distribution.x * distribution.x;
		#else
			float depth = texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( 0.0, uvOffset ) * radius ) / resolution ).r;
			mean += depth;
			squared_mean += depth * depth;
		#endif
	}
	mean = mean / samples;
	squared_mean = squared_mean / samples;
	float std_dev = sqrt( max( 0.0, squared_mean - mean * mean ) );
	gl_FragColor = vec4( mean, std_dev, 0.0, 1.0 );
}`,R1=[new x(1,0,0),new x(-1,0,0),new x(0,1,0),new x(0,-1,0),new x(0,0,1),new x(0,0,-1)],A1=[new x(0,-1,0),new x(0,-1,0),new x(0,0,1),new x(0,0,-1),new x(0,-1,0),new x(0,-1,0)],S0=new le,sr=new x,ih=new x;function C1(i,t,e){let n=new zo,s=new Zt,o=new Zt,r=new _e,a=new ca,l=new la,c={},h=e.maxTextureSize,d={[Qn]:fn,[fn]:Qn,[me]:me},u=new Ue({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new Zt},radius:{value:4}},vertexShader:S1,fragmentShader:T1}),m=u.clone();m.defines.HORIZONTAL_PASS=1;let g=new oe;g.setAttribute("position",new ve(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));let y=new ut(g,u),p=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=Yo;let f=this.type;this.render=function(E,A,M){if(p.enabled===!1||p.autoUpdate===!1&&p.needsUpdate===!1||E.length===0)return;this.type===wu&&(Wt("WebGLShadowMap: PCFSoftShadowMap has been removed. Using PCFShadowMap instead."),this.type=Yo);let w=i.getRenderTarget(),T=i.getActiveCubeFace(),P=i.getActiveMipmapLevel(),N=i.state;N.setBlending(ui),N.buffers.depth.getReversed()===!0?N.buffers.color.setClear(0,0,0,0):N.buffers.color.setClear(1,1,1,1),N.buffers.depth.setTest(!0),N.setScissorTest(!1);let F=f!==this.type;F&&A.traverse(function(D){D.material&&(Array.isArray(D.material)?D.material.forEach(z=>z.needsUpdate=!0):D.material.needsUpdate=!0)});for(let D=0,z=E.length;D<z;D++){let L=E[D],U=L.shadow;if(U===void 0){Wt("WebGLShadowMap:",L,"has no shadow.");continue}if(U.autoUpdate===!1&&U.needsUpdate===!1)continue;s.copy(U.mapSize);let O=U.getFrameExtents();s.multiply(O),o.copy(U.mapSize),(s.x>h||s.y>h)&&(s.x>h&&(o.x=Math.floor(h/O.x),s.x=o.x*O.x,U.mapSize.x=o.x),s.y>h&&(o.y=Math.floor(h/O.y),s.y=o.y*O.y,U.mapSize.y=o.y));let k=i.state.buffers.depth.getReversed();if(U.camera._reversedDepth=k,U.map===null||F===!0){if(U.map!==null&&(U.map.depthTexture!==null&&(U.map.depthTexture.dispose(),U.map.depthTexture=null),U.map.dispose()),this.type===no){if(L.isPointLight){Wt("WebGLShadowMap: VSM shadow maps are not supported for PointLights. Use PCF or BasicShadowMap instead.");continue}U.map=new un(s.x,s.y,{format:ns,type:ei,minFilter:hn,magFilter:hn,generateMipmaps:!1}),U.map.texture.name=L.name+".shadowMap",U.map.depthTexture=new jn(s.x,s.y,Vn),U.map.depthTexture.name=L.name+".shadowMapDepth",U.map.depthTexture.format=li,U.map.depthTexture.compareFunction=null,U.map.depthTexture.minFilter=Ve,U.map.depthTexture.magFilter=Ve}else L.isPointLight?(U.map=new xc(s.x),U.map.depthTexture=new oa(s.x,Un)):(U.map=new un(s.x,s.y),U.map.depthTexture=new jn(s.x,s.y,Un)),U.map.depthTexture.name=L.name+".shadowMap",U.map.depthTexture.format=li,this.type===Yo?(U.map.depthTexture.compareFunction=k?dc:uc,U.map.depthTexture.minFilter=hn,U.map.depthTexture.magFilter=hn):(U.map.depthTexture.compareFunction=null,U.map.depthTexture.minFilter=Ve,U.map.depthTexture.magFilter=Ve);U.camera.updateProjectionMatrix()}U.map.isWebGLCubeRenderTarget!==!0&&(U.map.width!==s.x||U.map.height!==s.y)&&U.map.setSize(s.x,s.y);let W=U.map.isWebGLCubeRenderTarget?6:U.getViewportCount();L.isPointLight!==!0&&U.updateMatrices(L,M);for(let q=0;q<W;q++){let at=U.getCamera(q);if(L.isPointLight){let it=U.camera,lt=U.matrix,wt=L.distance||it.far;wt!==it.far&&(it.far=wt,it.updateProjectionMatrix()),sr.setFromMatrixPosition(L.matrixWorld),it.position.copy(sr),ih.copy(it.position),ih.add(R1[q]),it.up.copy(A1[q]),it.lookAt(ih),it.updateMatrixWorld(),lt.makeTranslation(-sr.x,-sr.y,-sr.z),S0.multiplyMatrices(it.projectionMatrix,it.matrixWorldInverse),U._frustum.setFromProjectionMatrix(S0,it.coordinateSystem,it.reversedDepth)}if(U.map.isWebGLCubeRenderTarget)i.setRenderTarget(U.map,q),i.clear();else{q===0&&(i.setRenderTarget(U.map),i.clear());let it=U.getViewport(q);r.set(o.x*it.x,o.y*it.y,o.x*it.z,o.y*it.w),N.viewport(r)}n=U.getFrustum(q),_(A,M,at,L,this.type)}U.isPointLightShadow!==!0&&this.type===no&&v(U,M),U.needsUpdate=!1}f=this.type,p.needsUpdate=!1,i.setRenderTarget(w,T,P)};function v(E,A){let M=t.update(y);u.defines.VSM_SAMPLES!==E.blurSamples&&(u.defines.VSM_SAMPLES=E.blurSamples,m.defines.VSM_SAMPLES=E.blurSamples,u.needsUpdate=!0,m.needsUpdate=!0),E.mapPass===null?E.mapPass=new un(s.x,s.y,{format:ns,type:ei}):(E.mapPass.width!==E.map.width||E.mapPass.height!==E.map.height)&&E.mapPass.setSize(E.map.width,E.map.height),u.uniforms.shadow_pass.value=E.map.depthTexture,u.uniforms.resolution.value.set(E.map.width,E.map.height),u.uniforms.radius.value=E.radius,i.setRenderTarget(E.mapPass),i.clear(),i.renderBufferDirect(A,null,M,u,y,null),m.uniforms.shadow_pass.value=E.mapPass.texture,m.uniforms.resolution.value.set(E.map.width,E.map.height),m.uniforms.radius.value=E.radius,i.setRenderTarget(E.map),i.clear(),i.renderBufferDirect(A,null,M,m,y,null)}function S(E,A,M,w){let T=null,P=M.isPointLight===!0?E.customDistanceMaterial:E.customDepthMaterial;if(P!==void 0)T=P;else if(T=M.isPointLight===!0?l:a,i.localClippingEnabled&&A.clipShadows===!0&&Array.isArray(A.clippingPlanes)&&A.clippingPlanes.length!==0||A.displacementMap&&A.displacementScale!==0||A.alphaMap&&A.alphaTest>0||A.map&&A.alphaTest>0||A.alphaToCoverage===!0){let N=T.uuid,F=A.uuid,D=c[N];D===void 0&&(D={},c[N]=D);let z=D[F];z===void 0&&(z=T.clone(),D[F]=z,A.addEventListener("dispose",b)),T=z}if(T.visible=A.visible,T.wireframe=A.wireframe,w===no?T.side=A.shadowSide!==null?A.shadowSide:A.side:T.side=A.shadowSide!==null?A.shadowSide:d[A.side],T.alphaMap=A.alphaMap,T.alphaTest=A.alphaToCoverage===!0?.5:A.alphaTest,T.map=A.map,T.clipShadows=A.clipShadows,T.clippingPlanes=A.clippingPlanes,T.clipIntersection=A.clipIntersection,T.displacementMap=A.displacementMap,T.displacementScale=A.displacementScale,T.displacementBias=A.displacementBias,T.wireframeLinewidth=A.wireframeLinewidth,T.linewidth=A.linewidth,M.isPointLight===!0&&T.isMeshDistanceMaterial===!0){let N=i.properties.get(T);N.light=M}return T}function _(E,A,M,w,T){if(E.visible===!1)return;if(E.layers.test(A.layers)&&(E.isMesh||E.isLine||E.isPoints)&&(E.castShadow||E.receiveShadow&&T===no)&&(!E.frustumCulled||E.intersectsFrustum(n))){E.modelViewMatrix.multiplyMatrices(M.matrixWorldInverse,E.matrixWorld);let F=t.update(E),D=E.material;if(Array.isArray(D)){let z=F.groups;for(let L=0,U=z.length;L<U;L++){let O=z[L],k=D[O.materialIndex];if(k&&k.visible){let W=S(E,k,w,T);E.onBeforeShadow(i,E,A,M,F,W,O),i.renderBufferDirect(M,null,F,W,E,O),E.onAfterShadow(i,E,A,M,F,W,O)}}}else if(D.visible){let z=S(E,D,w,T);E.onBeforeShadow(i,E,A,M,F,z,null),i.renderBufferDirect(M,null,F,z,E,null),E.onAfterShadow(i,E,A,M,F,z,null)}}let N=E.children;for(let F=0,D=N.length;F<D;F++)_(N[F],A,M,w,T)}function b(E){E.target.removeEventListener("dispose",b);for(let M in c){let w=c[M],T=E.target.uuid;T in w&&(w[T].dispose(),delete w[T])}}}function P1(i,t){function e(){let B=!1,Mt=new _e,ot=null,Et=new _e(0,0,0,0);return{setMask:function(At){ot!==At&&!B&&(i.colorMask(At,At,At,At),ot=At)},setLocked:function(At){B=At},setClear:function(At,ct,Ot,kt,Ne){Ne===!0&&(At*=kt,ct*=kt,Ot*=kt),Mt.set(At,ct,Ot,kt),Et.equals(Mt)===!1&&(i.clearColor(At,ct,Ot,kt),Et.copy(Mt))},reset:function(){B=!1,ot=null,Et.set(-1,0,0,0)}}}function n(){let B=!1,Mt=!1,ot=null,Et=null,At=null;return{setReversed:function(ct){if(Mt!==ct){let Ot=t.get("EXT_clip_control");ct?Ot.clipControlEXT(Ot.LOWER_LEFT_EXT,Ot.ZERO_TO_ONE_EXT):Ot.clipControlEXT(Ot.LOWER_LEFT_EXT,Ot.NEGATIVE_ONE_TO_ONE_EXT),Mt=ct;let kt=At;At=null,this.setClear(kt)}},getReversed:function(){return Mt},setTest:function(ct){ct?tt(i.DEPTH_TEST):dt(i.DEPTH_TEST)},setMask:function(ct){ot!==ct&&!B&&(i.depthMask(ct),ot=ct)},setFunc:function(ct){if(Mt&&(ct=t0[ct]),Et!==ct){switch(ct){case Xr:i.depthFunc(i.NEVER);break;case qr:i.depthFunc(i.ALWAYS);break;case Yr:i.depthFunc(i.LESS);break;case Zs:i.depthFunc(i.LEQUAL);break;case Zr:i.depthFunc(i.EQUAL);break;case $r:i.depthFunc(i.GEQUAL);break;case Kr:i.depthFunc(i.GREATER);break;case Jr:i.depthFunc(i.NOTEQUAL);break;default:i.depthFunc(i.LEQUAL)}Et=ct}},setLocked:function(ct){B=ct},setClear:function(ct){At!==ct&&(At=ct,Mt&&(ct=1-ct),i.clearDepth(ct))},reset:function(){B=!1,ot=null,Et=null,At=null,Mt=!1}}}function s(){let B=!1,Mt=null,ot=null,Et=null,At=null,ct=null,Ot=null,kt=null,Ne=null;return{setTest:function(be){B||(be?tt(i.STENCIL_TEST):dt(i.STENCIL_TEST))},setMask:function(be){Mt!==be&&!B&&(i.stencilMask(be),Mt=be)},setFunc:function(be,qn,oi){(ot!==be||Et!==qn||At!==oi)&&(i.stencilFunc(be,qn,oi),ot=be,Et=qn,At=oi)},setOp:function(be,qn,oi){(ct!==be||Ot!==qn||kt!==oi)&&(i.stencilOp(be,qn,oi),ct=be,Ot=qn,kt=oi)},setLocked:function(be){B=be},setClear:function(be){Ne!==be&&(i.clearStencil(be),Ne=be)},reset:function(){B=!1,Mt=null,ot=null,Et=null,At=null,ct=null,Ot=null,kt=null,Ne=null}}}let o=new e,r=new n,a=new s,l=new WeakMap,c=new WeakMap,h={},d={},u={},m=new WeakMap,g=[],y=null,p=!1,f=null,v=null,S=null,_=null,b=null,E=null,A=null,M=new J(0,0,0),w=0,T=!1,P=null,N=null,F=null,D=null,z=null,L=i.getParameter(i.MAX_COMBINED_TEXTURE_IMAGE_UNITS),U=!1,O=0,k=i.getParameter(i.VERSION);k.indexOf("WebGL")!==-1?(O=parseFloat(/^WebGL (\d)/.exec(k)[1]),U=O>=1):k.indexOf("OpenGL ES")!==-1&&(O=parseFloat(/^OpenGL ES (\d)/.exec(k)[1]),U=O>=2);let W=null,q={},at=i.getParameter(i.SCISSOR_BOX),it=i.getParameter(i.VIEWPORT),lt=new _e().fromArray(at),wt=new _e().fromArray(it);function gt(B,Mt,ot,Et){let At=new Uint8Array(4),ct=i.createTexture();i.bindTexture(B,ct),i.texParameteri(B,i.TEXTURE_MIN_FILTER,i.NEAREST),i.texParameteri(B,i.TEXTURE_MAG_FILTER,i.NEAREST);for(let Ot=0;Ot<ot;Ot++)B===i.TEXTURE_3D||B===i.TEXTURE_2D_ARRAY?i.texImage3D(Mt,0,i.RGBA,1,1,Et,0,i.RGBA,i.UNSIGNED_BYTE,At):i.texImage2D(Mt+Ot,0,i.RGBA,1,1,0,i.RGBA,i.UNSIGNED_BYTE,At);return ct}let K={};K[i.TEXTURE_2D]=gt(i.TEXTURE_2D,i.TEXTURE_2D,1),K[i.TEXTURE_CUBE_MAP]=gt(i.TEXTURE_CUBE_MAP,i.TEXTURE_CUBE_MAP_POSITIVE_X,6),K[i.TEXTURE_2D_ARRAY]=gt(i.TEXTURE_2D_ARRAY,i.TEXTURE_2D_ARRAY,1,1),K[i.TEXTURE_3D]=gt(i.TEXTURE_3D,i.TEXTURE_3D,1,1),o.setClear(0,0,0,1),r.setClear(1),a.setClear(0),tt(i.DEPTH_TEST),r.setFunc(Zs),ne(!1),we(Ml),tt(i.CULL_FACE),ee(ui);function tt(B){h[B]!==!0&&(i.enable(B),h[B]=!0)}function dt(B){h[B]!==!1&&(i.disable(B),h[B]=!1)}function Ct(B,Mt){return u[B]!==Mt?(i.bindFramebuffer(B,Mt),u[B]=Mt,B===i.DRAW_FRAMEBUFFER&&(u[i.FRAMEBUFFER]=Mt),B===i.FRAMEBUFFER&&(u[i.DRAW_FRAMEBUFFER]=Mt),!0):!1}function _t(B,Mt){let ot=g,Et=!1;if(B){ot=m.get(Mt),ot===void 0&&(ot=[],m.set(Mt,ot));let At=B.textures;if(ot.length!==At.length||ot[0]!==i.COLOR_ATTACHMENT0){for(let ct=0,Ot=At.length;ct<Ot;ct++)ot[ct]=i.COLOR_ATTACHMENT0+ct;ot.length=At.length,Et=!0}}else ot[0]!==i.BACK&&(ot[0]=i.BACK,Et=!0);Et&&i.drawBuffers(ot)}function $t(B){return y!==B?(i.useProgram(B),y=B,!0):!1}let Ee={[Ci]:i.FUNC_ADD,[bu]:i.FUNC_SUBTRACT,[Su]:i.FUNC_REVERSE_SUBTRACT};Ee[Tu]=i.MIN,Ee[Ru]=i.MAX;let te={[ba]:i.ZERO,[io]:i.ONE,[Au]:i.SRC_COLOR,[Zo]:i.SRC_ALPHA,[Nu]:i.SRC_ALPHA_SATURATE,[Du]:i.DST_COLOR,[Pu]:i.DST_ALPHA,[Cu]:i.ONE_MINUS_SRC_COLOR,[so]:i.ONE_MINUS_SRC_ALPHA,[Lu]:i.ONE_MINUS_DST_COLOR,[Iu]:i.ONE_MINUS_DST_ALPHA,[Hu]:i.CONSTANT_COLOR,[Uu]:i.ONE_MINUS_CONSTANT_COLOR,[ku]:i.CONSTANT_ALPHA,[Fu]:i.ONE_MINUS_CONSTANT_ALPHA};function ee(B,Mt,ot,Et,At,ct,Ot,kt,Ne,be){if(B===ui){p===!0&&(dt(i.BLEND),p=!1);return}if(p===!1&&(tt(i.BLEND),p=!0),B!==wa){if(B!==f||be!==T){if((v!==Ci||b!==Ci)&&(i.blendEquation(i.FUNC_ADD),v=Ci,b=Ci),be)switch(B){case ji:i.blendFuncSeparate(i.ONE,i.ONE_MINUS_SRC_ALPHA,i.ONE,i.ONE_MINUS_SRC_ALPHA);break;case Ai:i.blendFunc(i.ONE,i.ONE);break;case El:i.blendFuncSeparate(i.ZERO,i.ONE_MINUS_SRC_COLOR,i.ZERO,i.ONE);break;case wl:i.blendFuncSeparate(i.DST_COLOR,i.ONE_MINUS_SRC_ALPHA,i.ZERO,i.ONE);break;default:Xt("WebGLState: Invalid blending: ",B);break}else switch(B){case ji:i.blendFuncSeparate(i.SRC_ALPHA,i.ONE_MINUS_SRC_ALPHA,i.ONE,i.ONE_MINUS_SRC_ALPHA);break;case Ai:i.blendFuncSeparate(i.SRC_ALPHA,i.ONE,i.ONE,i.ONE);break;case El:Xt("WebGLState: SubtractiveBlending requires material.premultipliedAlpha = true");break;case wl:Xt("WebGLState: MultiplyBlending requires material.premultipliedAlpha = true");break;default:Xt("WebGLState: Invalid blending: ",B);break}S=null,_=null,E=null,A=null,M.set(0,0,0),w=0,f=B,T=be}return}At=At||Mt,ct=ct||ot,Ot=Ot||Et,(Mt!==v||At!==b)&&(i.blendEquationSeparate(Ee[Mt],Ee[At]),v=Mt,b=At),(ot!==S||Et!==_||ct!==E||Ot!==A)&&(i.blendFuncSeparate(te[ot],te[Et],te[ct],te[Ot]),S=ot,_=Et,E=ct,A=Ot),(kt.equals(M)===!1||Ne!==w)&&(i.blendColor(kt.r,kt.g,kt.b,Ne),M.copy(kt),w=Ne),f=B,T=!1}function xe(B,Mt){B.side===me?dt(i.CULL_FACE):tt(i.CULL_FACE);let ot=B.side===fn;Mt&&(ot=!ot),ne(ot),B.blending===ji&&B.transparent===!1?ee(ui):ee(B.blending,B.blendEquation,B.blendSrc,B.blendDst,B.blendEquationAlpha,B.blendSrcAlpha,B.blendDstAlpha,B.blendColor,B.blendAlpha,B.premultipliedAlpha),r.setFunc(B.depthFunc),r.setTest(B.depthTest),r.setMask(B.depthWrite),o.setMask(B.colorWrite);let Et=B.stencilWrite;a.setTest(Et),Et&&(a.setMask(B.stencilWriteMask),a.setFunc(B.stencilFunc,B.stencilRef,B.stencilFuncMask),a.setOp(B.stencilFail,B.stencilZFail,B.stencilZPass)),Xe(B.polygonOffset,B.polygonOffsetFactor,B.polygonOffsetUnits),B.alphaToCoverage===!0?tt(i.SAMPLE_ALPHA_TO_COVERAGE):dt(i.SAMPLE_ALPHA_TO_COVERAGE)}function ne(B){P!==B&&(B?i.frontFace(i.CW):i.frontFace(i.CCW),P=B)}function we(B){B!==Mu?(tt(i.CULL_FACE),B!==N&&(B===Ml?i.cullFace(i.BACK):B===Eu?i.cullFace(i.FRONT):i.cullFace(i.FRONT_AND_BACK))):dt(i.CULL_FACE),N=B}function Pe(B){B!==F&&(U&&i.lineWidth(B),F=B)}function Xe(B,Mt,ot){B?(tt(i.POLYGON_OFFSET_FILL),(D!==Mt||z!==ot)&&(D=Mt,z=ot,r.getReversed()&&(Mt=-Mt),i.polygonOffset(Mt,ot))):dt(i.POLYGON_OFFSET_FILL)}function Fe(B){B?tt(i.SCISSOR_TEST):dt(i.SCISSOR_TEST)}function We(B){B===void 0&&(B=i.TEXTURE0+L-1),W!==B&&(i.activeTexture(B),W=B)}function V(B,Mt,ot){ot===void 0&&(W===null?ot=i.TEXTURE0+L-1:ot=W);let Et=q[ot];Et===void 0&&(Et={type:void 0,texture:void 0},q[ot]=Et),(Et.type!==B||Et.texture!==Mt)&&(W!==ot&&(i.activeTexture(ot),W=ot),i.bindTexture(B,Mt||K[B]),Et.type=B,Et.texture=Mt)}function ue(){let B=q[W];B!==void 0&&B.type!==void 0&&(i.bindTexture(B.type,null),B.type=void 0,B.texture=void 0)}function Kt(){try{i.compressedTexImage2D(...arguments)}catch(B){Xt("WebGLState:",B)}}function H(){try{i.compressedTexImage3D(...arguments)}catch(B){Xt("WebGLState:",B)}}function R(){try{i.texSubImage2D(...arguments)}catch(B){Xt("WebGLState:",B)}}function X(){try{i.texSubImage3D(...arguments)}catch(B){Xt("WebGLState:",B)}}function $(){try{i.compressedTexSubImage2D(...arguments)}catch(B){Xt("WebGLState:",B)}}function nt(){try{i.compressedTexSubImage3D(...arguments)}catch(B){Xt("WebGLState:",B)}}function ft(){try{i.texStorage2D(...arguments)}catch(B){Xt("WebGLState:",B)}}function mt(){try{i.texStorage3D(...arguments)}catch(B){Xt("WebGLState:",B)}}function st(){try{i.texImage2D(...arguments)}catch(B){Xt("WebGLState:",B)}}function rt(){try{i.texImage3D(...arguments)}catch(B){Xt("WebGLState:",B)}}function xt(B){return d[B]!==void 0?d[B]:i.getParameter(B)}function et(B,Mt){d[B]!==Mt&&(i.pixelStorei(B,Mt),d[B]=Mt)}function pt(B){lt.equals(B)===!1&&(i.scissor(B.x,B.y,B.z,B.w),lt.copy(B))}function ht(B){wt.equals(B)===!1&&(i.viewport(B.x,B.y,B.z,B.w),wt.copy(B))}function Pt(B,Mt){let ot=c.get(Mt);ot===void 0&&(ot=new WeakMap,c.set(Mt,ot));let Et=ot.get(B);Et===void 0&&(Et=i.getUniformBlockIndex(Mt,B.name),ot.set(B,Et))}function Lt(B,Mt){let Et=c.get(Mt).get(B);l.get(Mt)!==Et&&(i.uniformBlockBinding(Mt,Et,B.__bindingPointIndex),l.set(Mt,Et))}function Yt(){i.disable(i.BLEND),i.disable(i.CULL_FACE),i.disable(i.DEPTH_TEST),i.disable(i.POLYGON_OFFSET_FILL),i.disable(i.SCISSOR_TEST),i.disable(i.STENCIL_TEST),i.disable(i.SAMPLE_ALPHA_TO_COVERAGE),i.blendEquation(i.FUNC_ADD),i.blendFunc(i.ONE,i.ZERO),i.blendFuncSeparate(i.ONE,i.ZERO,i.ONE,i.ZERO),i.blendColor(0,0,0,0),i.colorMask(!0,!0,!0,!0),i.clearColor(0,0,0,0),i.depthMask(!0),i.depthFunc(i.LESS),r.setReversed(!1),i.clearDepth(1),i.stencilMask(4294967295),i.stencilFunc(i.ALWAYS,0,4294967295),i.stencilOp(i.KEEP,i.KEEP,i.KEEP),i.clearStencil(0),i.cullFace(i.BACK),i.frontFace(i.CCW),i.polygonOffset(0,0),i.activeTexture(i.TEXTURE0),i.bindFramebuffer(i.FRAMEBUFFER,null),i.bindFramebuffer(i.DRAW_FRAMEBUFFER,null),i.bindFramebuffer(i.READ_FRAMEBUFFER,null),i.useProgram(null),i.lineWidth(1),i.scissor(0,0,i.canvas.width,i.canvas.height),i.viewport(0,0,i.canvas.width,i.canvas.height),i.pixelStorei(i.PACK_ALIGNMENT,4),i.pixelStorei(i.UNPACK_ALIGNMENT,4),i.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,!1),i.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,!1),i.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,i.BROWSER_DEFAULT_WEBGL),i.pixelStorei(i.PACK_ROW_LENGTH,0),i.pixelStorei(i.PACK_SKIP_PIXELS,0),i.pixelStorei(i.PACK_SKIP_ROWS,0),i.pixelStorei(i.UNPACK_ROW_LENGTH,0),i.pixelStorei(i.UNPACK_IMAGE_HEIGHT,0),i.pixelStorei(i.UNPACK_SKIP_PIXELS,0),i.pixelStorei(i.UNPACK_SKIP_ROWS,0),i.pixelStorei(i.UNPACK_SKIP_IMAGES,0),h={},d={},W=null,q={},u={},m=new WeakMap,g=[],y=null,p=!1,f=null,v=null,S=null,_=null,b=null,E=null,A=null,M=new J(0,0,0),w=0,T=!1,P=null,N=null,F=null,D=null,z=null,lt.set(0,0,i.canvas.width,i.canvas.height),wt.set(0,0,i.canvas.width,i.canvas.height),o.reset(),r.reset(),a.reset()}return{buffers:{color:o,depth:r,stencil:a},enable:tt,disable:dt,bindFramebuffer:Ct,drawBuffers:_t,useProgram:$t,setBlending:ee,setMaterial:xe,setFlipSided:ne,setCullFace:we,setLineWidth:Pe,setPolygonOffset:Xe,setScissorTest:Fe,activeTexture:We,bindTexture:V,unbindTexture:ue,compressedTexImage2D:Kt,compressedTexImage3D:H,texImage2D:st,texImage3D:rt,pixelStorei:et,getParameter:xt,updateUBOMapping:Pt,uniformBlockBinding:Lt,texStorage2D:ft,texStorage3D:mt,texSubImage2D:R,texSubImage3D:X,compressedTexSubImage2D:$,compressedTexSubImage3D:nt,scissor:pt,viewport:ht,reset:Yt}}function I1(i,t,e,n,s,o,r){let a=t.has("WEBGL_multisampled_render_to_texture")?t.get("WEBGL_multisampled_render_to_texture"):null,l=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),c=new Zt,h=new WeakMap,d=new Set,u,m=new WeakMap,g=!1;try{g=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function y(H,R){return g?new OffscreenCanvas(H,R):Lo("canvas")}function p(H,R,X){let $=1,nt=Kt(H);if((nt.width>X||nt.height>X)&&($=X/Math.max(nt.width,nt.height)),$<1)if(typeof HTMLImageElement<"u"&&H instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&H instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&H instanceof ImageBitmap||typeof VideoFrame<"u"&&H instanceof VideoFrame){let ft=Math.floor($*nt.width),mt=Math.floor($*nt.height);u===void 0&&(u=y(ft,mt));let st=R?y(ft,mt):u;return st.width=ft,st.height=mt,st.getContext("2d").drawImage(H,0,0,ft,mt),Wt("WebGLRenderer: Texture has been resized from ("+nt.width+"x"+nt.height+") to ("+ft+"x"+mt+")."),st}else return"data"in H&&Wt("WebGLRenderer: Image in DataTexture is too big ("+nt.width+"x"+nt.height+")."),H;return H}function f(H){return H.generateMipmaps}function v(H){i.generateMipmap(H)}function S(H){return H.isWebGLCubeRenderTarget?i.TEXTURE_CUBE_MAP:H.isWebGL3DRenderTarget?i.TEXTURE_3D:H.isWebGLArrayRenderTarget||H.isCompressedArrayTexture?i.TEXTURE_2D_ARRAY:i.TEXTURE_2D}function _(H,R,X,$,nt,ft=!1){if(H!==null){if(i[H]!==void 0)return i[H];Wt("WebGLRenderer: Attempt to use non-existing WebGL internal format '"+H+"'")}let mt;$&&(mt=t.get("EXT_texture_norm16"),mt||Wt("WebGLRenderer: Unable to use normalized textures without EXT_texture_norm16 extension"));let st=R;if(R===i.RED&&(X===i.FLOAT&&(st=i.R32F),X===i.HALF_FLOAT&&(st=i.R16F),X===i.UNSIGNED_BYTE&&(st=i.R8),X===i.UNSIGNED_SHORT&&mt&&(st=mt.R16_EXT),X===i.SHORT&&mt&&(st=mt.R16_SNORM_EXT)),R===i.RED_INTEGER&&(X===i.UNSIGNED_BYTE&&(st=i.R8UI),X===i.UNSIGNED_SHORT&&(st=i.R16UI),X===i.UNSIGNED_INT&&(st=i.R32UI),X===i.BYTE&&(st=i.R8I),X===i.SHORT&&(st=i.R16I),X===i.INT&&(st=i.R32I)),R===i.RG&&(X===i.FLOAT&&(st=i.RG32F),X===i.HALF_FLOAT&&(st=i.RG16F),X===i.UNSIGNED_BYTE&&(st=i.RG8),X===i.UNSIGNED_SHORT&&mt&&(st=mt.RG16_EXT),X===i.SHORT&&mt&&(st=mt.RG16_SNORM_EXT)),R===i.RG_INTEGER&&(X===i.UNSIGNED_BYTE&&(st=i.RG8UI),X===i.UNSIGNED_SHORT&&(st=i.RG16UI),X===i.UNSIGNED_INT&&(st=i.RG32UI),X===i.BYTE&&(st=i.RG8I),X===i.SHORT&&(st=i.RG16I),X===i.INT&&(st=i.RG32I)),R===i.RGB_INTEGER&&(X===i.UNSIGNED_BYTE&&(st=i.RGB8UI),X===i.UNSIGNED_SHORT&&(st=i.RGB16UI),X===i.UNSIGNED_INT&&(st=i.RGB32UI),X===i.BYTE&&(st=i.RGB8I),X===i.SHORT&&(st=i.RGB16I),X===i.INT&&(st=i.RGB32I)),R===i.RGBA_INTEGER&&(X===i.UNSIGNED_BYTE&&(st=i.RGBA8UI),X===i.UNSIGNED_SHORT&&(st=i.RGBA16UI),X===i.UNSIGNED_INT&&(st=i.RGBA32UI),X===i.BYTE&&(st=i.RGBA8I),X===i.SHORT&&(st=i.RGBA16I),X===i.INT&&(st=i.RGBA32I)),R===i.RGB&&(X===i.UNSIGNED_SHORT&&mt&&(st=mt.RGB16_EXT),X===i.SHORT&&mt&&(st=mt.RGB16_SNORM_EXT),X===i.UNSIGNED_INT_5_9_9_9_REV&&(st=i.RGB9_E5),X===i.UNSIGNED_INT_10F_11F_11F_REV&&(st=i.R11F_G11F_B10F)),R===i.RGBA){let rt=ft?Io:ce.getTransfer(nt);X===i.FLOAT&&(st=i.RGBA32F),X===i.HALF_FLOAT&&(st=i.RGBA16F),X===i.UNSIGNED_BYTE&&(st=rt===Te?i.SRGB8_ALPHA8:i.RGBA8),X===i.UNSIGNED_SHORT&&mt&&(st=mt.RGBA16_EXT),X===i.SHORT&&mt&&(st=mt.RGBA16_SNORM_EXT),X===i.UNSIGNED_SHORT_4_4_4_4&&(st=i.RGBA4),X===i.UNSIGNED_SHORT_5_5_5_1&&(st=i.RGB5_A1)}return(st===i.R16F||st===i.R32F||st===i.RG16F||st===i.RG32F||st===i.RGBA16F||st===i.RGBA32F)&&t.get("EXT_color_buffer_float"),st}function b(H,R){let X;return H?R===null||R===Un||R===es?X=i.DEPTH24_STENCIL8:R===Vn?X=i.DEPTH32F_STENCIL8:R===oo&&(X=i.DEPTH24_STENCIL8,Wt("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")):R===null||R===Un||R===es?X=i.DEPTH_COMPONENT24:R===Vn?X=i.DEPTH_COMPONENT32F:R===oo&&(X=i.DEPTH_COMPONENT16),X}function E(H,R){return f(H)===!0||H.isFramebufferTexture&&H.minFilter!==Ve&&H.minFilter!==hn?Math.log2(Math.max(R.width,R.height))+1:H.mipmaps!==void 0&&H.mipmaps.length>0?H.mipmaps.length:H.isCompressedTexture&&Array.isArray(H.image)?R.mipmaps.length:1}function A(H){let R=H.target;R.removeEventListener("dispose",A),w(R),R.isVideoTexture&&h.delete(R),R.isHTMLTexture&&d.delete(R)}function M(H){let R=H.target;R.removeEventListener("dispose",M),P(R)}function w(H){let R=n.get(H);if(R.__webglInit===void 0)return;let X=H.source,$=m.get(X);if($){let nt=$[R.__cacheKey];nt.usedTimes--,nt.usedTimes===0&&T(H),Object.keys($).length===0&&m.delete(X)}n.remove(H)}function T(H){let R=n.get(H);i.deleteTexture(R.__webglTexture);let X=H.source,$=m.get(X);delete $[R.__cacheKey],r.memory.textures--}function P(H){let R=n.get(H);if(H.depthTexture&&(H.depthTexture.dispose(),n.remove(H.depthTexture)),H.isWebGLCubeRenderTarget)for(let $=0;$<6;$++){if(Array.isArray(R.__webglFramebuffer[$]))for(let nt=0;nt<R.__webglFramebuffer[$].length;nt++)i.deleteFramebuffer(R.__webglFramebuffer[$][nt]);else i.deleteFramebuffer(R.__webglFramebuffer[$]);R.__webglDepthbuffer&&i.deleteRenderbuffer(R.__webglDepthbuffer[$])}else{if(Array.isArray(R.__webglFramebuffer))for(let $=0;$<R.__webglFramebuffer.length;$++)i.deleteFramebuffer(R.__webglFramebuffer[$]);else i.deleteFramebuffer(R.__webglFramebuffer);if(R.__webglDepthbuffer&&i.deleteRenderbuffer(R.__webglDepthbuffer),R.__webglMultisampledFramebuffer&&i.deleteFramebuffer(R.__webglMultisampledFramebuffer),R.__webglColorRenderbuffer)for(let $=0;$<R.__webglColorRenderbuffer.length;$++)R.__webglColorRenderbuffer[$]&&i.deleteRenderbuffer(R.__webglColorRenderbuffer[$]);R.__webglDepthRenderbuffer&&i.deleteRenderbuffer(R.__webglDepthRenderbuffer)}let X=H.textures;for(let $=0,nt=X.length;$<nt;$++){let ft=n.get(X[$]);ft.__webglTexture&&(i.deleteTexture(ft.__webglTexture),r.memory.textures--),n.remove(X[$])}n.remove(H)}let N=0;function F(){N=0}function D(){return N}function z(H){N=H}function L(){let H=N;return H>=s.maxTextures&&Wt("WebGLTextures: Trying to use "+(H+1)+" texture units while this GPU supports only "+s.maxTextures),N+=1,H}function U(H){let R=[];return R.push(H.wrapS),R.push(H.wrapT),R.push(H.wrapR||0),R.push(H.magFilter),R.push(H.minFilter),R.push(H.anisotropy),R.push(H.internalFormat),R.push(H.format),R.push(H.type),R.push(H.generateMipmaps),R.push(H.premultiplyAlpha),R.push(H.flipY),R.push(H.unpackAlignment),R.push(H.colorSpace),R.join()}function O(H,R){let X=n.get(H);if(H.isVideoTexture&&V(H),H.isRenderTargetTexture===!1&&H.isExternalTexture!==!0&&H.version>0&&X.__version!==H.version){let $=H.image;if($===null)Wt("WebGLRenderer: Texture marked for update but no image data found.");else if($.complete===!1)Wt("WebGLRenderer: Texture marked for update but image is incomplete");else{dt(X,H,R);return}}else H.isExternalTexture&&(X.__webglTexture=H.sourceTexture?H.sourceTexture:null);e.bindTexture(i.TEXTURE_2D,X.__webglTexture,i.TEXTURE0+R)}function k(H,R){let X=n.get(H);if(H.isRenderTargetTexture===!1&&H.version>0&&X.__version!==H.version){dt(X,H,R);return}else H.isExternalTexture&&(X.__webglTexture=H.sourceTexture?H.sourceTexture:null);e.bindTexture(i.TEXTURE_2D_ARRAY,X.__webglTexture,i.TEXTURE0+R)}function W(H,R){let X=n.get(H);if(H.isRenderTargetTexture===!1&&H.version>0&&X.__version!==H.version){dt(X,H,R);return}e.bindTexture(i.TEXTURE_3D,X.__webglTexture,i.TEXTURE0+R)}function q(H,R){let X=n.get(H);if(H.isCubeDepthTexture!==!0&&H.version>0&&X.__version!==H.version){Ct(X,H,R);return}e.bindTexture(i.TEXTURE_CUBE_MAP,X.__webglTexture,i.TEXTURE0+R)}let at={[jr]:i.REPEAT,[ci]:i.CLAMP_TO_EDGE,[Qr]:i.MIRRORED_REPEAT},it={[Ve]:i.NEAREST,[Vu]:i.NEAREST_MIPMAP_NEAREST,[Ko]:i.NEAREST_MIPMAP_LINEAR,[hn]:i.LINEAR,[Ra]:i.LINEAR_MIPMAP_NEAREST,[ts]:i.LINEAR_MIPMAP_LINEAR},lt={[Xu]:i.NEVER,[Ku]:i.ALWAYS,[qu]:i.LESS,[uc]:i.LEQUAL,[Yu]:i.EQUAL,[dc]:i.GEQUAL,[Zu]:i.GREATER,[$u]:i.NOTEQUAL};function wt(H,R){if(R.type===Vn&&t.has("OES_texture_float_linear")===!1&&(R.magFilter===hn||R.magFilter===Ra||R.magFilter===Ko||R.magFilter===ts||R.minFilter===hn||R.minFilter===Ra||R.minFilter===Ko||R.minFilter===ts)&&Wt("WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device."),i.texParameteri(H,i.TEXTURE_WRAP_S,at[R.wrapS]),i.texParameteri(H,i.TEXTURE_WRAP_T,at[R.wrapT]),(H===i.TEXTURE_3D||H===i.TEXTURE_2D_ARRAY)&&i.texParameteri(H,i.TEXTURE_WRAP_R,at[R.wrapR]),i.texParameteri(H,i.TEXTURE_MAG_FILTER,it[R.magFilter]),i.texParameteri(H,i.TEXTURE_MIN_FILTER,it[R.minFilter]),R.compareFunction&&(i.texParameteri(H,i.TEXTURE_COMPARE_MODE,i.COMPARE_REF_TO_TEXTURE),i.texParameteri(H,i.TEXTURE_COMPARE_FUNC,lt[R.compareFunction])),t.has("EXT_texture_filter_anisotropic")===!0){if(R.magFilter===Ve||R.minFilter!==Ko&&R.minFilter!==ts||R.type===Vn&&t.has("OES_texture_float_linear")===!1)return;if(R.anisotropy>1||n.get(R).__currentAnisotropy){let X=t.get("EXT_texture_filter_anisotropic");i.texParameterf(H,X.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(R.anisotropy,s.getMaxAnisotropy())),n.get(R).__currentAnisotropy=R.anisotropy}}}function gt(H,R){let X=!1;H.__webglInit===void 0&&(H.__webglInit=!0,R.addEventListener("dispose",A));let $=R.source,nt=m.get($);nt===void 0&&(nt={},m.set($,nt));let ft=U(R);if(ft!==H.__cacheKey){nt[ft]===void 0&&(nt[ft]={texture:i.createTexture(),usedTimes:0},r.memory.textures++,X=!0),nt[ft].usedTimes++;let mt=nt[H.__cacheKey];mt!==void 0&&(nt[H.__cacheKey].usedTimes--,mt.usedTimes===0&&T(R)),H.__cacheKey=ft,H.__webglTexture=nt[ft].texture}return X}function K(H,R,X){return Math.floor(Math.floor(H/X)/R)}function tt(H,R,X,$){let ft=H.updateRanges;if(ft.length===0)e.texSubImage2D(i.TEXTURE_2D,0,0,0,R.width,R.height,X,$,R.data);else{ft.sort((et,pt)=>et.start-pt.start);let mt=0;for(let et=1;et<ft.length;et++){let pt=ft[mt],ht=ft[et],Pt=pt.start+pt.count,Lt=K(ht.start,R.width,4),Yt=K(pt.start,R.width,4);ht.start<=Pt+1&&Lt===Yt&&K(ht.start+ht.count-1,R.width,4)===Lt?pt.count=Math.max(pt.count,ht.start+ht.count-pt.start):(++mt,ft[mt]=ht)}ft.length=mt+1;let st=e.getParameter(i.UNPACK_ROW_LENGTH),rt=e.getParameter(i.UNPACK_SKIP_PIXELS),xt=e.getParameter(i.UNPACK_SKIP_ROWS);e.pixelStorei(i.UNPACK_ROW_LENGTH,R.width);for(let et=0,pt=ft.length;et<pt;et++){let ht=ft[et],Pt=Math.floor(ht.start/4),Lt=Math.ceil(ht.count/4),Yt=Pt%R.width,B=Math.floor(Pt/R.width),Mt=Lt,ot=1;e.pixelStorei(i.UNPACK_SKIP_PIXELS,Yt),e.pixelStorei(i.UNPACK_SKIP_ROWS,B),e.texSubImage2D(i.TEXTURE_2D,0,Yt,B,Mt,ot,X,$,R.data)}H.clearUpdateRanges(),e.pixelStorei(i.UNPACK_ROW_LENGTH,st),e.pixelStorei(i.UNPACK_SKIP_PIXELS,rt),e.pixelStorei(i.UNPACK_SKIP_ROWS,xt)}}function dt(H,R,X){let $=i.TEXTURE_2D;(R.isDataArrayTexture||R.isCompressedArrayTexture)&&($=i.TEXTURE_2D_ARRAY),R.isData3DTexture&&($=i.TEXTURE_3D);let nt=gt(H,R),ft=R.source;e.bindTexture($,H.__webglTexture,i.TEXTURE0+X);let mt=n.get(ft);if(ft.version!==mt.__version||nt===!0){if(e.activeTexture(i.TEXTURE0+X),(typeof ImageBitmap<"u"&&R.image instanceof ImageBitmap)===!1){let ot=ce.getPrimaries(ce.workingColorSpace),Et=R.colorSpace===Pi?null:ce.getPrimaries(R.colorSpace),At=R.colorSpace===Pi||ot===Et?i.NONE:i.BROWSER_DEFAULT_WEBGL;e.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,R.flipY),e.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,R.premultiplyAlpha),e.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,At)}e.pixelStorei(i.UNPACK_ALIGNMENT,R.unpackAlignment);let rt=p(R.image,!1,s.maxTextureSize);rt=ue(R,rt);let xt=o.convert(R.format,R.colorSpace),et=o.convert(R.type),pt=_(R.internalFormat,xt,et,R.normalized,R.colorSpace,R.isVideoTexture);wt($,R);let ht,Pt=R.mipmaps,Lt=R.isVideoTexture!==!0,Yt=mt.__version===void 0||nt===!0,B=ft.dataReady,Mt=E(R,rt);if(R.isDepthTexture)pt=b(R.format===di,R.type),Yt&&(Lt?e.texStorage2D(i.TEXTURE_2D,1,pt,rt.width,rt.height):e.texImage2D(i.TEXTURE_2D,0,pt,rt.width,rt.height,0,xt,et,null));else if(R.isDataTexture)if(Pt.length>0){Lt&&Yt&&e.texStorage2D(i.TEXTURE_2D,Mt,pt,Pt[0].width,Pt[0].height);for(let ot=0,Et=Pt.length;ot<Et;ot++)ht=Pt[ot],Lt?B&&e.texSubImage2D(i.TEXTURE_2D,ot,0,0,ht.width,ht.height,xt,et,ht.data):e.texImage2D(i.TEXTURE_2D,ot,pt,ht.width,ht.height,0,xt,et,ht.data);R.generateMipmaps=!1}else Lt?(Yt&&e.texStorage2D(i.TEXTURE_2D,Mt,pt,rt.width,rt.height),B&&tt(R,rt,xt,et)):e.texImage2D(i.TEXTURE_2D,0,pt,rt.width,rt.height,0,xt,et,rt.data);else if(R.isCompressedTexture)if(R.isCompressedArrayTexture){Lt&&Yt&&e.texStorage3D(i.TEXTURE_2D_ARRAY,Mt,pt,Pt[0].width,Pt[0].height,rt.depth);for(let ot=0,Et=Pt.length;ot<Et;ot++)if(ht=Pt[ot],R.format!==Bn)if(xt!==null)if(Lt){if(B)if(R.layerUpdates.size>0){let At=ql(ht.width,ht.height,R.format,R.type);for(let ct of R.layerUpdates){let Ot=ht.data.subarray(ct*At/ht.data.BYTES_PER_ELEMENT,(ct+1)*At/ht.data.BYTES_PER_ELEMENT);e.compressedTexSubImage3D(i.TEXTURE_2D_ARRAY,ot,0,0,ct,ht.width,ht.height,1,xt,Ot)}}else e.compressedTexSubImage3D(i.TEXTURE_2D_ARRAY,ot,0,0,0,ht.width,ht.height,rt.depth,xt,ht.data)}else e.compressedTexImage3D(i.TEXTURE_2D_ARRAY,ot,pt,ht.width,ht.height,rt.depth,0,ht.data,0,0);else Wt("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else Lt?B&&e.texSubImage3D(i.TEXTURE_2D_ARRAY,ot,0,0,0,ht.width,ht.height,rt.depth,xt,et,ht.data):e.texImage3D(i.TEXTURE_2D_ARRAY,ot,pt,ht.width,ht.height,rt.depth,0,xt,et,ht.data);R.layerUpdates.size>0&&R.clearLayerUpdates()}else{Lt&&Yt&&e.texStorage2D(i.TEXTURE_2D,Mt,pt,Pt[0].width,Pt[0].height);for(let ot=0,Et=Pt.length;ot<Et;ot++)ht=Pt[ot],R.format!==Bn?xt!==null?Lt?B&&e.compressedTexSubImage2D(i.TEXTURE_2D,ot,0,0,ht.width,ht.height,xt,ht.data):e.compressedTexImage2D(i.TEXTURE_2D,ot,pt,ht.width,ht.height,0,ht.data):Wt("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):Lt?B&&e.texSubImage2D(i.TEXTURE_2D,ot,0,0,ht.width,ht.height,xt,et,ht.data):e.texImage2D(i.TEXTURE_2D,ot,pt,ht.width,ht.height,0,xt,et,ht.data)}else if(R.isDataArrayTexture)if(Lt){if(Yt&&e.texStorage3D(i.TEXTURE_2D_ARRAY,Mt,pt,rt.width,rt.height,rt.depth),B)if(R.layerUpdates.size>0){let ot=ql(rt.width,rt.height,R.format,R.type);for(let Et of R.layerUpdates){let At=rt.data.subarray(Et*ot/rt.data.BYTES_PER_ELEMENT,(Et+1)*ot/rt.data.BYTES_PER_ELEMENT);e.texSubImage3D(i.TEXTURE_2D_ARRAY,0,0,0,Et,rt.width,rt.height,1,xt,et,At)}R.clearLayerUpdates()}else e.texSubImage3D(i.TEXTURE_2D_ARRAY,0,0,0,0,rt.width,rt.height,rt.depth,xt,et,rt.data)}else e.texImage3D(i.TEXTURE_2D_ARRAY,0,pt,rt.width,rt.height,rt.depth,0,xt,et,rt.data);else if(R.isData3DTexture)Lt?(Yt&&e.texStorage3D(i.TEXTURE_3D,Mt,pt,rt.width,rt.height,rt.depth),B&&e.texSubImage3D(i.TEXTURE_3D,0,0,0,0,rt.width,rt.height,rt.depth,xt,et,rt.data)):e.texImage3D(i.TEXTURE_3D,0,pt,rt.width,rt.height,rt.depth,0,xt,et,rt.data);else if(R.isFramebufferTexture){if(Yt)if(Lt)e.texStorage2D(i.TEXTURE_2D,Mt,pt,rt.width,rt.height);else{let ot=rt.width,Et=rt.height;for(let At=0;At<Mt;At++)e.texImage2D(i.TEXTURE_2D,At,pt,ot,Et,0,xt,et,null),ot>>=1,Et>>=1}}else if(R.isHTMLTexture){if("texElementImage2D"in i){let ot=i.canvas;if(ot.hasAttribute("layoutsubtree")||ot.setAttribute("layoutsubtree","true"),rt.parentNode!==ot){ot.appendChild(rt),d.add(R),ot.onpaint=Et=>{let At=Et.changedElements;for(let ct of d)At.includes(ct.image)&&(ct.needsUpdate=!0)},ot.requestPaint();return}if(i.texElementImage2D.length===3)i.texElementImage2D(i.TEXTURE_2D,i.RGBA8,rt);else{let At=i.RGBA,ct=i.RGBA,Ot=i.UNSIGNED_BYTE;i.texElementImage2D(i.TEXTURE_2D,0,At,ct,Ot,rt)}i.texParameteri(i.TEXTURE_2D,i.TEXTURE_MIN_FILTER,i.LINEAR),i.texParameteri(i.TEXTURE_2D,i.TEXTURE_WRAP_S,i.CLAMP_TO_EDGE),i.texParameteri(i.TEXTURE_2D,i.TEXTURE_WRAP_T,i.CLAMP_TO_EDGE)}}else if(Pt.length>0){if(Lt&&Yt){let ot=Kt(Pt[0]);e.texStorage2D(i.TEXTURE_2D,Mt,pt,ot.width,ot.height)}for(let ot=0,Et=Pt.length;ot<Et;ot++)ht=Pt[ot],Lt?B&&e.texSubImage2D(i.TEXTURE_2D,ot,0,0,xt,et,ht):e.texImage2D(i.TEXTURE_2D,ot,pt,xt,et,ht);R.generateMipmaps=!1}else if(Lt){if(Yt){let ot=Kt(rt);e.texStorage2D(i.TEXTURE_2D,Mt,pt,ot.width,ot.height)}B&&e.texSubImage2D(i.TEXTURE_2D,0,0,0,xt,et,rt)}else e.texImage2D(i.TEXTURE_2D,0,pt,xt,et,rt);f(R)&&v($),mt.__version=ft.version,R.onUpdate&&R.onUpdate(R)}H.__version=R.version}function Ct(H,R,X){if(R.image.length!==6)return;let $=gt(H,R),nt=R.source;e.bindTexture(i.TEXTURE_CUBE_MAP,H.__webglTexture,i.TEXTURE0+X);let ft=n.get(nt);if(nt.version!==ft.__version||$===!0){e.activeTexture(i.TEXTURE0+X);let mt=ce.getPrimaries(ce.workingColorSpace),st=R.colorSpace===Pi?null:ce.getPrimaries(R.colorSpace),rt=R.colorSpace===Pi||mt===st?i.NONE:i.BROWSER_DEFAULT_WEBGL;e.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,R.flipY),e.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,R.premultiplyAlpha),e.pixelStorei(i.UNPACK_ALIGNMENT,R.unpackAlignment),e.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,rt);let xt=R.isCompressedTexture||R.image[0].isCompressedTexture,et=R.image[0]&&R.image[0].isDataTexture,pt=[];for(let ct=0;ct<6;ct++)!xt&&!et?pt[ct]=p(R.image[ct],!0,s.maxCubemapSize):pt[ct]=et?R.image[ct].image:R.image[ct],pt[ct]=ue(R,pt[ct]);let ht=pt[0],Pt=o.convert(R.format,R.colorSpace),Lt=o.convert(R.type),Yt=_(R.internalFormat,Pt,Lt,R.normalized,R.colorSpace),B=R.isVideoTexture!==!0,Mt=ft.__version===void 0||$===!0,ot=nt.dataReady,Et=E(R,ht);wt(i.TEXTURE_CUBE_MAP,R);let At;if(xt){B&&Mt&&e.texStorage2D(i.TEXTURE_CUBE_MAP,Et,Yt,ht.width,ht.height);for(let ct=0;ct<6;ct++){At=pt[ct].mipmaps;for(let Ot=0;Ot<At.length;Ot++){let kt=At[Ot];R.format!==Bn?Pt!==null?B?ot&&e.compressedTexSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ct,Ot,0,0,kt.width,kt.height,Pt,kt.data):e.compressedTexImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ct,Ot,Yt,kt.width,kt.height,0,kt.data):Wt("WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):B?ot&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ct,Ot,0,0,kt.width,kt.height,Pt,Lt,kt.data):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ct,Ot,Yt,kt.width,kt.height,0,Pt,Lt,kt.data)}}}else{if(At=R.mipmaps,B&&Mt){At.length>0&&Et++;let ct=Kt(pt[0]);e.texStorage2D(i.TEXTURE_CUBE_MAP,Et,Yt,ct.width,ct.height)}for(let ct=0;ct<6;ct++)if(et){B?ot&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ct,0,0,0,pt[ct].width,pt[ct].height,Pt,Lt,pt[ct].data):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ct,0,Yt,pt[ct].width,pt[ct].height,0,Pt,Lt,pt[ct].data);for(let Ot=0;Ot<At.length;Ot++){let Ne=At[Ot].image[ct].image;B?ot&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ct,Ot+1,0,0,Ne.width,Ne.height,Pt,Lt,Ne.data):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ct,Ot+1,Yt,Ne.width,Ne.height,0,Pt,Lt,Ne.data)}}else{B?ot&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ct,0,0,0,Pt,Lt,pt[ct]):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ct,0,Yt,Pt,Lt,pt[ct]);for(let Ot=0;Ot<At.length;Ot++){let kt=At[Ot];B?ot&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ct,Ot+1,0,0,Pt,Lt,kt.image[ct]):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ct,Ot+1,Yt,Pt,Lt,kt.image[ct])}}}f(R)&&v(i.TEXTURE_CUBE_MAP),ft.__version=nt.version,R.onUpdate&&R.onUpdate(R)}H.__version=R.version}function _t(H,R,X,$,nt,ft){let mt=o.convert(X.format,X.colorSpace),st=o.convert(X.type),rt=_(X.internalFormat,mt,st,X.normalized,X.colorSpace),xt=n.get(R),et=n.get(X);if(et.__renderTarget=R,!xt.__hasExternalTextures){let pt=Math.max(1,R.width>>ft),ht=Math.max(1,R.height>>ft);nt===i.TEXTURE_3D||nt===i.TEXTURE_2D_ARRAY?e.texImage3D(nt,ft,rt,pt,ht,R.depth,0,mt,st,null):e.texImage2D(nt,ft,rt,pt,ht,0,mt,st,null)}e.bindFramebuffer(i.FRAMEBUFFER,H),We(R)?a.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,$,nt,et.__webglTexture,0,Fe(R)):(nt===i.TEXTURE_2D||nt>=i.TEXTURE_CUBE_MAP_POSITIVE_X&&nt<=i.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&i.framebufferTexture2D(i.FRAMEBUFFER,$,nt,et.__webglTexture,ft),e.bindFramebuffer(i.FRAMEBUFFER,null)}function $t(H,R,X){if(i.bindRenderbuffer(i.RENDERBUFFER,H),R.depthBuffer){let $=R.depthTexture,nt=$&&$.isDepthTexture?$.type:null,ft=b(R.stencilBuffer,nt),mt=R.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT;We(R)?a.renderbufferStorageMultisampleEXT(i.RENDERBUFFER,Fe(R),ft,R.width,R.height):X?i.renderbufferStorageMultisample(i.RENDERBUFFER,Fe(R),ft,R.width,R.height):i.renderbufferStorage(i.RENDERBUFFER,ft,R.width,R.height),i.framebufferRenderbuffer(i.FRAMEBUFFER,mt,i.RENDERBUFFER,H)}else{let $=R.textures;for(let nt=0;nt<$.length;nt++){let ft=$[nt],mt=o.convert(ft.format,ft.colorSpace),st=o.convert(ft.type),rt=_(ft.internalFormat,mt,st,ft.normalized,ft.colorSpace);We(R)?a.renderbufferStorageMultisampleEXT(i.RENDERBUFFER,Fe(R),rt,R.width,R.height):X?i.renderbufferStorageMultisample(i.RENDERBUFFER,Fe(R),rt,R.width,R.height):i.renderbufferStorage(i.RENDERBUFFER,rt,R.width,R.height)}}i.bindRenderbuffer(i.RENDERBUFFER,null)}function Ee(H,R,X){let $=R.isWebGLCubeRenderTarget===!0;if(e.bindFramebuffer(i.FRAMEBUFFER,H),!(R.depthTexture&&R.depthTexture.isDepthTexture))throw new Error("THREE.WebGLTextures: renderTarget.depthTexture must be an instance of THREE.DepthTexture.");let nt=n.get(R.depthTexture);if(nt.__renderTarget=R,(!nt.__webglTexture||R.depthTexture.image.width!==R.width||R.depthTexture.image.height!==R.height)&&(R.depthTexture.image.width=R.width,R.depthTexture.image.height=R.height,R.depthTexture.needsUpdate=!0),$){if(nt.__webglInit===void 0&&(nt.__webglInit=!0,R.depthTexture.addEventListener("dispose",A)),nt.__webglTexture===void 0){nt.__webglTexture=i.createTexture(),e.bindTexture(i.TEXTURE_CUBE_MAP,nt.__webglTexture),wt(i.TEXTURE_CUBE_MAP,R.depthTexture);let xt=o.convert(R.depthTexture.format),et=o.convert(R.depthTexture.type),pt;R.depthTexture.format===li?pt=i.DEPTH_COMPONENT24:R.depthTexture.format===di&&(pt=i.DEPTH24_STENCIL8);for(let ht=0;ht<6;ht++)i.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ht,0,pt,R.width,R.height,0,xt,et,null)}}else O(R.depthTexture,0);let ft=nt.__webglTexture,mt=Fe(R),st=$?i.TEXTURE_CUBE_MAP_POSITIVE_X+X:i.TEXTURE_2D,rt=R.depthTexture.format===di?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT;if(R.depthTexture.format===li)We(R)?a.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,rt,st,ft,0,mt):i.framebufferTexture2D(i.FRAMEBUFFER,rt,st,ft,0);else if(R.depthTexture.format===di)We(R)?a.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,rt,st,ft,0,mt):i.framebufferTexture2D(i.FRAMEBUFFER,rt,st,ft,0);else throw new Error("THREE.WebGLTextures: Unknown depthTexture format.")}function te(H){let R=n.get(H),X=H.isWebGLCubeRenderTarget===!0;if(R.__boundDepthTexture!==H.depthTexture){let $=H.depthTexture;if(R.__depthDisposeCallback&&R.__depthDisposeCallback(),$){let nt=()=>{delete R.__boundDepthTexture,delete R.__depthDisposeCallback,$.removeEventListener("dispose",nt)};$.addEventListener("dispose",nt),R.__depthDisposeCallback=nt}R.__boundDepthTexture=$}if(H.depthTexture&&!R.__autoAllocateDepthBuffer)if(X)for(let $=0;$<6;$++)Ee(R.__webglFramebuffer[$],H,$);else{let $=H.texture.mipmaps;$&&$.length>0?Ee(R.__webglFramebuffer[0],H,0):Ee(R.__webglFramebuffer,H,0)}else if(X){R.__webglDepthbuffer=[];for(let $=0;$<6;$++)if(e.bindFramebuffer(i.FRAMEBUFFER,R.__webglFramebuffer[$]),R.__webglDepthbuffer[$]===void 0)R.__webglDepthbuffer[$]=i.createRenderbuffer(),$t(R.__webglDepthbuffer[$],H,!1);else{let nt=H.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,ft=R.__webglDepthbuffer[$];i.bindRenderbuffer(i.RENDERBUFFER,ft),i.framebufferRenderbuffer(i.FRAMEBUFFER,nt,i.RENDERBUFFER,ft)}}else{let $=H.texture.mipmaps;if($&&$.length>0?e.bindFramebuffer(i.FRAMEBUFFER,R.__webglFramebuffer[0]):e.bindFramebuffer(i.FRAMEBUFFER,R.__webglFramebuffer),R.__webglDepthbuffer===void 0)R.__webglDepthbuffer=i.createRenderbuffer(),$t(R.__webglDepthbuffer,H,!1);else{let nt=H.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,ft=R.__webglDepthbuffer;i.bindRenderbuffer(i.RENDERBUFFER,ft),i.framebufferRenderbuffer(i.FRAMEBUFFER,nt,i.RENDERBUFFER,ft)}}e.bindFramebuffer(i.FRAMEBUFFER,null)}function ee(H,R,X){let $=n.get(H);R!==void 0&&_t($.__webglFramebuffer,H,H.texture,i.COLOR_ATTACHMENT0,i.TEXTURE_2D,0),X!==void 0&&te(H)}function xe(H){let R=H.texture,X=n.get(H),$=n.get(R);H.addEventListener("dispose",M);let nt=H.textures,ft=H.isWebGLCubeRenderTarget===!0,mt=nt.length>1;if(mt||($.__webglTexture===void 0&&($.__webglTexture=i.createTexture()),$.__version=R.version,r.memory.textures++),ft){X.__webglFramebuffer=[];for(let st=0;st<6;st++)if(R.mipmaps&&R.mipmaps.length>0){X.__webglFramebuffer[st]=[];for(let rt=0;rt<R.mipmaps.length;rt++)X.__webglFramebuffer[st][rt]=i.createFramebuffer()}else X.__webglFramebuffer[st]=i.createFramebuffer()}else{if(R.mipmaps&&R.mipmaps.length>0){X.__webglFramebuffer=[];for(let st=0;st<R.mipmaps.length;st++)X.__webglFramebuffer[st]=i.createFramebuffer()}else X.__webglFramebuffer=i.createFramebuffer();if(mt)for(let st=0,rt=nt.length;st<rt;st++){let xt=n.get(nt[st]);xt.__webglTexture===void 0&&(xt.__webglTexture=i.createTexture(),r.memory.textures++)}if(H.samples>0&&We(H)===!1){X.__webglMultisampledFramebuffer=i.createFramebuffer(),X.__webglColorRenderbuffer=[],e.bindFramebuffer(i.FRAMEBUFFER,X.__webglMultisampledFramebuffer);for(let st=0;st<nt.length;st++){let rt=nt[st];X.__webglColorRenderbuffer[st]=i.createRenderbuffer(),i.bindRenderbuffer(i.RENDERBUFFER,X.__webglColorRenderbuffer[st]);let xt=o.convert(rt.format,rt.colorSpace),et=o.convert(rt.type),pt=_(rt.internalFormat,xt,et,rt.normalized,rt.colorSpace,H.isXRRenderTarget===!0),ht=Fe(H);i.renderbufferStorageMultisample(i.RENDERBUFFER,ht,pt,H.width,H.height),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+st,i.RENDERBUFFER,X.__webglColorRenderbuffer[st])}i.bindRenderbuffer(i.RENDERBUFFER,null),H.depthBuffer&&(X.__webglDepthRenderbuffer=i.createRenderbuffer(),$t(X.__webglDepthRenderbuffer,H,!0)),e.bindFramebuffer(i.FRAMEBUFFER,null)}}if(ft){e.bindTexture(i.TEXTURE_CUBE_MAP,$.__webglTexture),wt(i.TEXTURE_CUBE_MAP,R);for(let st=0;st<6;st++)if(R.mipmaps&&R.mipmaps.length>0)for(let rt=0;rt<R.mipmaps.length;rt++)_t(X.__webglFramebuffer[st][rt],H,R,i.COLOR_ATTACHMENT0,i.TEXTURE_CUBE_MAP_POSITIVE_X+st,rt);else _t(X.__webglFramebuffer[st],H,R,i.COLOR_ATTACHMENT0,i.TEXTURE_CUBE_MAP_POSITIVE_X+st,0);f(R)&&v(i.TEXTURE_CUBE_MAP),e.unbindTexture()}else if(mt){for(let st=0,rt=nt.length;st<rt;st++){let xt=nt[st],et=n.get(xt),pt=i.TEXTURE_2D;(H.isWebGL3DRenderTarget||H.isWebGLArrayRenderTarget)&&(pt=H.isWebGL3DRenderTarget?i.TEXTURE_3D:i.TEXTURE_2D_ARRAY),e.bindTexture(pt,et.__webglTexture),wt(pt,xt),_t(X.__webglFramebuffer,H,xt,i.COLOR_ATTACHMENT0+st,pt,0),f(xt)&&v(pt)}e.unbindTexture()}else{let st=i.TEXTURE_2D;if((H.isWebGL3DRenderTarget||H.isWebGLArrayRenderTarget)&&(st=H.isWebGL3DRenderTarget?i.TEXTURE_3D:i.TEXTURE_2D_ARRAY),e.bindTexture(st,$.__webglTexture),wt(st,R),R.mipmaps&&R.mipmaps.length>0)for(let rt=0;rt<R.mipmaps.length;rt++)_t(X.__webglFramebuffer[rt],H,R,i.COLOR_ATTACHMENT0,st,rt);else _t(X.__webglFramebuffer,H,R,i.COLOR_ATTACHMENT0,st,0);f(R)&&v(st),e.unbindTexture()}H.depthBuffer&&te(H)}function ne(H){let R=H.textures;for(let X=0,$=R.length;X<$;X++){let nt=R[X];if(f(nt)){let ft=S(H),mt=n.get(nt).__webglTexture;e.bindTexture(ft,mt),v(ft),e.unbindTexture()}}}let we=[],Pe=[];function Xe(H){if(H.samples>0){if(We(H)===!1){let R=H.textures,X=H.width,$=H.height,nt=i.COLOR_BUFFER_BIT,ft=H.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,mt=n.get(H),st=R.length>1;if(st)for(let xt=0;xt<R.length;xt++)e.bindFramebuffer(i.FRAMEBUFFER,mt.__webglMultisampledFramebuffer),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+xt,i.RENDERBUFFER,null),e.bindFramebuffer(i.FRAMEBUFFER,mt.__webglFramebuffer),i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0+xt,i.TEXTURE_2D,null,0);e.bindFramebuffer(i.READ_FRAMEBUFFER,mt.__webglMultisampledFramebuffer);let rt=H.texture.mipmaps;rt&&rt.length>0?e.bindFramebuffer(i.DRAW_FRAMEBUFFER,mt.__webglFramebuffer[0]):e.bindFramebuffer(i.DRAW_FRAMEBUFFER,mt.__webglFramebuffer);for(let xt=0;xt<R.length;xt++){if(H.resolveDepthBuffer&&(H.depthBuffer&&(nt|=i.DEPTH_BUFFER_BIT),H.stencilBuffer&&H.resolveStencilBuffer&&(nt|=i.STENCIL_BUFFER_BIT)),st){i.framebufferRenderbuffer(i.READ_FRAMEBUFFER,i.COLOR_ATTACHMENT0,i.RENDERBUFFER,mt.__webglColorRenderbuffer[xt]);let et=n.get(R[xt]).__webglTexture;i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0,i.TEXTURE_2D,et,0)}i.blitFramebuffer(0,0,X,$,0,0,X,$,nt,i.NEAREST),l===!0&&(we.length=0,Pe.length=0,we.push(i.COLOR_ATTACHMENT0+xt),H.depthBuffer&&H.storeMultisampledDepthBuffer===!1&&(we.push(ft),Pe.push(ft),i.invalidateFramebuffer(i.DRAW_FRAMEBUFFER,Pe)),i.invalidateFramebuffer(i.READ_FRAMEBUFFER,we))}if(e.bindFramebuffer(i.READ_FRAMEBUFFER,null),e.bindFramebuffer(i.DRAW_FRAMEBUFFER,null),st)for(let xt=0;xt<R.length;xt++){e.bindFramebuffer(i.FRAMEBUFFER,mt.__webglMultisampledFramebuffer),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+xt,i.RENDERBUFFER,mt.__webglColorRenderbuffer[xt]);let et=n.get(R[xt]).__webglTexture;e.bindFramebuffer(i.FRAMEBUFFER,mt.__webglFramebuffer),i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0+xt,i.TEXTURE_2D,et,0)}e.bindFramebuffer(i.DRAW_FRAMEBUFFER,mt.__webglMultisampledFramebuffer)}else if(H.depthBuffer&&H.storeMultisampledDepthBuffer===!1&&l){let R=H.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT;i.invalidateFramebuffer(i.DRAW_FRAMEBUFFER,[R])}}}function Fe(H){return Math.min(s.maxSamples,H.samples)}function We(H){let R=n.get(H);return H.samples>0&&t.has("WEBGL_multisampled_render_to_texture")===!0&&R.__useRenderToTexture!==!1}function V(H){let R=r.render.frame;h.get(H)!==R&&(h.set(H,R),H.update())}function ue(H,R){let X=H.colorSpace,$=H.format,nt=H.type;return H.isCompressedTexture===!0||H.isVideoTexture===!0||X!==gs&&X!==Pi&&(ce.getTransfer(X)===Te?($!==Bn||nt!==En)&&Wt("WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):Xt("WebGLTextures: Unsupported texture color space:",X)),R}function Kt(H){return typeof HTMLImageElement<"u"&&H instanceof HTMLImageElement?(c.width=H.naturalWidth||H.width,c.height=H.naturalHeight||H.height):typeof VideoFrame<"u"&&H instanceof VideoFrame?(c.width=H.displayWidth,c.height=H.displayHeight):(c.width=H.width,c.height=H.height),c}this.allocateTextureUnit=L,this.resetTextureUnits=F,this.getTextureUnits=D,this.setTextureUnits=z,this.setTexture2D=O,this.setTexture2DArray=k,this.setTexture3D=W,this.setTextureCube=q,this.rebindTextures=ee,this.setupRenderTarget=xe,this.updateRenderTargetMipmap=ne,this.updateMultisampleRenderTarget=Xe,this.setupDepthRenderbuffer=te,this.setupFrameBufferTexture=_t,this.useMultisampledRTT=We,this.isReversedDepthBuffer=function(){return e.buffers.depth.getReversed()}}function D1(i,t){function e(n,s=Pi){let o,r=ce.getTransfer(s);if(n===En)return i.UNSIGNED_BYTE;if(n===Ca)return i.UNSIGNED_SHORT_4_4_4_4;if(n===Pa)return i.UNSIGNED_SHORT_5_5_5_1;if(n===Hl)return i.UNSIGNED_INT_5_9_9_9_REV;if(n===Ul)return i.UNSIGNED_INT_10F_11F_11F_REV;if(n===Ll)return i.BYTE;if(n===Nl)return i.SHORT;if(n===oo)return i.UNSIGNED_SHORT;if(n===Aa)return i.INT;if(n===Un)return i.UNSIGNED_INT;if(n===Vn)return i.FLOAT;if(n===ei)return i.HALF_FLOAT;if(n===kl)return i.ALPHA;if(n===Fl)return i.RGB;if(n===Bn)return i.RGBA;if(n===li)return i.DEPTH_COMPONENT;if(n===di)return i.DEPTH_STENCIL;if(n===Ia)return i.RED;if(n===Da)return i.RED_INTEGER;if(n===ns)return i.RG;if(n===La)return i.RG_INTEGER;if(n===Na)return i.RGBA_INTEGER;if(n===Jo||n===jo||n===Qo||n===tr)if(r===Te)if(o=t.get("WEBGL_compressed_texture_s3tc_srgb"),o!==null){if(n===Jo)return o.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(n===jo)return o.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(n===Qo)return o.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(n===tr)return o.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(o=t.get("WEBGL_compressed_texture_s3tc"),o!==null){if(n===Jo)return o.COMPRESSED_RGB_S3TC_DXT1_EXT;if(n===jo)return o.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(n===Qo)return o.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(n===tr)return o.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(n===Ha||n===Ua||n===ka||n===Fa)if(o=t.get("WEBGL_compressed_texture_pvrtc"),o!==null){if(n===Ha)return o.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(n===Ua)return o.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(n===ka)return o.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(n===Fa)return o.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(n===za||n===Oa||n===Va||n===Ba||n===Ga||n===er||n===Wa)if(o=t.get("WEBGL_compressed_texture_etc"),o!==null){if(n===za||n===Oa)return r===Te?o.COMPRESSED_SRGB8_ETC2:o.COMPRESSED_RGB8_ETC2;if(n===Va)return r===Te?o.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:o.COMPRESSED_RGBA8_ETC2_EAC;if(n===Ba)return o.COMPRESSED_R11_EAC;if(n===Ga)return o.COMPRESSED_SIGNED_R11_EAC;if(n===er)return o.COMPRESSED_RG11_EAC;if(n===Wa)return o.COMPRESSED_SIGNED_RG11_EAC}else return null;if(n===Xa||n===qa||n===Ya||n===Za||n===$a||n===Ka||n===Ja||n===ja||n===Qa||n===tc||n===ec||n===nc||n===ic||n===sc)if(o=t.get("WEBGL_compressed_texture_astc"),o!==null){if(n===Xa)return r===Te?o.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:o.COMPRESSED_RGBA_ASTC_4x4_KHR;if(n===qa)return r===Te?o.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:o.COMPRESSED_RGBA_ASTC_5x4_KHR;if(n===Ya)return r===Te?o.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:o.COMPRESSED_RGBA_ASTC_5x5_KHR;if(n===Za)return r===Te?o.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:o.COMPRESSED_RGBA_ASTC_6x5_KHR;if(n===$a)return r===Te?o.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:o.COMPRESSED_RGBA_ASTC_6x6_KHR;if(n===Ka)return r===Te?o.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:o.COMPRESSED_RGBA_ASTC_8x5_KHR;if(n===Ja)return r===Te?o.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:o.COMPRESSED_RGBA_ASTC_8x6_KHR;if(n===ja)return r===Te?o.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:o.COMPRESSED_RGBA_ASTC_8x8_KHR;if(n===Qa)return r===Te?o.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:o.COMPRESSED_RGBA_ASTC_10x5_KHR;if(n===tc)return r===Te?o.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:o.COMPRESSED_RGBA_ASTC_10x6_KHR;if(n===ec)return r===Te?o.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:o.COMPRESSED_RGBA_ASTC_10x8_KHR;if(n===nc)return r===Te?o.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:o.COMPRESSED_RGBA_ASTC_10x10_KHR;if(n===ic)return r===Te?o.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:o.COMPRESSED_RGBA_ASTC_12x10_KHR;if(n===sc)return r===Te?o.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:o.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(n===oc||n===rc||n===ac)if(o=t.get("EXT_texture_compression_bptc"),o!==null){if(n===oc)return r===Te?o.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:o.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(n===rc)return o.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(n===ac)return o.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(n===cc||n===lc||n===nr||n===hc)if(o=t.get("EXT_texture_compression_rgtc"),o!==null){if(n===cc)return o.COMPRESSED_RED_RGTC1_EXT;if(n===lc)return o.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(n===nr)return o.COMPRESSED_RED_GREEN_RGTC2_EXT;if(n===hc)return o.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return n===es?i.UNSIGNED_INT_24_8:i[n]!==void 0?i[n]:null}return{convert:e}}var L1=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,N1=`
uniform sampler2DArray depthColor;
uniform float depthWidth;
uniform float depthHeight;

void main() {

	vec2 coord = vec2( gl_FragCoord.x / depthWidth, gl_FragCoord.y / depthHeight );

	if ( coord.x >= 1.0 ) {

		gl_FragDepth = texture( depthColor, vec3( coord.x - 1.0, coord.y, 1 ) ).r;

	} else {

		gl_FragDepth = texture( depthColor, vec3( coord.x, coord.y, 0 ) ).r;

	}

}`,uh=class{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(t,e){if(this.texture===null){let n=new Vo(t.texture);(t.depthNear!==e.depthNear||t.depthFar!==e.depthFar)&&(this.depthNear=t.depthNear,this.depthFar=t.depthFar),this.texture=n}}getMesh(t){if(this.texture!==null&&this.mesh===null){let e=t.cameras[0].viewport,n=new Ue({vertexShader:L1,fragmentShader:N1,uniforms:{depthColor:{value:this.texture},depthWidth:{value:e.z},depthHeight:{value:e.w}}});this.mesh=new ut(new Nn(20,20),n)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}},dh=class extends hi{constructor(t,e){super();let n=this,s=null,o=1,r=null,a="local-floor",l=1,c=null,h=null,d=null,u=null,m=null,g=null,y=typeof XRWebGLBinding<"u",p=new uh,f={},v=e.getContextAttributes(),S=null,_=null,b=[],E=[],A=new Zt,M=null,w=null,T=new nn;T.viewport=new _e;let P=new nn;P.viewport=new _e;let N=[T,P],F=new Ma,D=null,z=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(K){let tt=b[K];return tt===void 0&&(tt=new Qs,b[K]=tt),tt.getTargetRaySpace()},this.getControllerGrip=function(K){let tt=b[K];return tt===void 0&&(tt=new Qs,b[K]=tt),tt.getGripSpace()},this.getHand=function(K){let tt=b[K];return tt===void 0&&(tt=new Qs,b[K]=tt),tt.getHandSpace()};function L(K){let tt=E.indexOf(K.inputSource);if(tt===-1)return;let dt=b[tt];dt!==void 0&&(dt.update(K.inputSource,K.frame,c||r),dt.dispatchEvent({type:K.type,data:K.inputSource}))}function U(){s.removeEventListener("select",L),s.removeEventListener("selectstart",L),s.removeEventListener("selectend",L),s.removeEventListener("squeeze",L),s.removeEventListener("squeezestart",L),s.removeEventListener("squeezeend",L),s.removeEventListener("end",U),s.removeEventListener("inputsourceschange",O);for(let K=0;K<b.length;K++){let tt=E[K];tt!==null&&(E[K]=null,b[K].disconnect(tt))}D=null,z=null,p.reset();for(let K in f)delete f[K];if(t.setRenderTarget(S),m=null,u=null,d=null,s=null,_=null,gt.stop(),n.isPresenting=!1,t.setPixelRatio(M),t.setSize(A.width,A.height,!1),w!==null){let K=w.camera;K.fov=w.fov,K.zoom=w.zoom,K.updateProjectionMatrix(),w=null}n.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(K){o=K,n.isPresenting===!0&&Wt("WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(K){a=K,n.isPresenting===!0&&Wt("WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return c||r},this.setReferenceSpace=function(K){c=K},this.getBaseLayer=function(){return u!==null?u:m},this.getBinding=function(){return d===null&&y&&(d=new XRWebGLBinding(s,e)),d},this.getFrame=function(){return g},this.getSession=function(){return s},this.setSession=async function(K){if(s=K,s!==null){if(S=t.getRenderTarget(),s.addEventListener("select",L),s.addEventListener("selectstart",L),s.addEventListener("selectend",L),s.addEventListener("squeeze",L),s.addEventListener("squeezestart",L),s.addEventListener("squeezeend",L),s.addEventListener("end",U),s.addEventListener("inputsourceschange",O),v.xrCompatible!==!0&&await e.makeXRCompatible(),M=t.getPixelRatio(),t.getSize(A),y&&"createProjectionLayer"in XRWebGLBinding.prototype){let dt=null,Ct=null,_t=null;v.depth&&(_t=v.stencil?e.DEPTH24_STENCIL8:e.DEPTH_COMPONENT24,dt=v.stencil?di:li,Ct=v.stencil?es:Un);let $t={colorFormat:e.RGBA8,depthFormat:_t,scaleFactor:o};d=this.getBinding(),u=d.createProjectionLayer($t),s.updateRenderState({layers:[u]}),t.setPixelRatio(1),t.setSize(u.textureWidth,u.textureHeight,!1),_=new un(u.textureWidth,u.textureHeight,{format:Bn,type:En,depthTexture:new jn(u.textureWidth,u.textureHeight,Ct,void 0,void 0,void 0,void 0,void 0,void 0,dt),stencilBuffer:v.stencil,colorSpace:t.outputColorSpace,samples:v.antialias?4:0,resolveDepthBuffer:u.ignoreDepthValues===!1,resolveStencilBuffer:u.ignoreDepthValues===!1,storeMultisampledDepthBuffer:u.ignoreDepthValues===!1,storeMultisampledStencilBuffer:u.ignoreDepthValues===!1})}else{let dt={antialias:v.antialias,alpha:!0,depth:v.depth,stencil:v.stencil,framebufferScaleFactor:o};m=new XRWebGLLayer(s,e,dt),s.updateRenderState({baseLayer:m}),t.setPixelRatio(1),t.setSize(m.framebufferWidth,m.framebufferHeight,!1),_=new un(m.framebufferWidth,m.framebufferHeight,{format:Bn,type:En,colorSpace:t.outputColorSpace,stencilBuffer:v.stencil,resolveDepthBuffer:m.ignoreDepthValues===!1,resolveStencilBuffer:m.ignoreDepthValues===!1,storeMultisampledDepthBuffer:m.ignoreDepthValues===!1,storeMultisampledStencilBuffer:m.ignoreDepthValues===!1})}_.isXRRenderTarget=!0,this.setFoveation(l),c=null,r=await s.requestReferenceSpace(a),gt.setContext(s),gt.start(),n.isPresenting=!0,n.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(s!==null)return s.environmentBlendMode},this.getDepthTexture=function(){return p.getDepthTexture()};function O(K){for(let tt=0;tt<K.removed.length;tt++){let dt=K.removed[tt],Ct=E.indexOf(dt);Ct>=0&&(E[Ct]=null,b[Ct].disconnect(dt))}for(let tt=0;tt<K.added.length;tt++){let dt=K.added[tt],Ct=E.indexOf(dt);if(Ct===-1){for(let $t=0;$t<b.length;$t++)if($t>=E.length){E.push(dt),Ct=$t;break}else if(E[$t]===null){E[$t]=dt,Ct=$t;break}if(Ct===-1)break}let _t=b[Ct];_t&&_t.connect(dt)}}let k=new x,W=new x;function q(K,tt,dt){k.setFromMatrixPosition(tt.matrixWorld),W.setFromMatrixPosition(dt.matrixWorld);let Ct=k.distanceTo(W),_t=tt.projectionMatrix.elements,$t=dt.projectionMatrix.elements,Ee=_t[14]/(_t[10]-1),te=_t[14]/(_t[10]+1),ee=(_t[9]+1)/_t[5],xe=(_t[9]-1)/_t[5],ne=(_t[8]-1)/_t[0],we=($t[8]+1)/$t[0],Pe=Ee*ne,Xe=Ee*we,Fe=Ct/(-ne+we),We=Fe*-ne;if(tt.matrixWorld.decompose(K.position,K.quaternion,K.scale),K.translateX(We),K.translateZ(Fe),K.matrixWorld.compose(K.position,K.quaternion,K.scale),K.matrixWorldInverse.copy(K.matrixWorld).invert(),_t[10]===-1)K.projectionMatrix.copy(tt.projectionMatrix),K.projectionMatrixInverse.copy(tt.projectionMatrixInverse);else{let V=Ee+Fe,ue=te+Fe,Kt=Pe-We,H=Xe+(Ct-We),R=ee*te/ue*V,X=xe*te/ue*V;K.projectionMatrix.makePerspective(Kt,H,R,X,V,ue),K.projectionMatrixInverse.copy(K.projectionMatrix).invert()}}function at(K,tt){tt===null?K.matrixWorld.copy(K.matrix):K.matrixWorld.multiplyMatrices(tt.matrixWorld,K.matrix),K.matrixWorldInverse.copy(K.matrixWorld).invert()}this.updateCamera=function(K){if(s===null)return;let tt=K.near,dt=K.far;p.texture!==null&&(p.depthNear>0&&(tt=p.depthNear),p.depthFar>0&&(dt=p.depthFar)),F.near=P.near=T.near=tt,F.far=P.far=T.far=dt,(D!==F.near||z!==F.far)&&(s.updateRenderState({depthNear:F.near,depthFar:F.far}),D=F.near,z=F.far),F.layers.mask=K.layers.mask|6,T.layers.mask=F.layers.mask&-5,P.layers.mask=F.layers.mask&-3;let Ct=K.parent,_t=F.cameras;at(F,Ct);for(let $t=0;$t<_t.length;$t++)at(_t[$t],Ct);_t.length===2?q(F,T,P):F.projectionMatrix.copy(T.projectionMatrix),w===null&&K.isPerspectiveCamera&&(w={camera:K,fov:K.fov,zoom:K.zoom}),it(K,F,Ct)};function it(K,tt,dt){dt===null?K.matrix.copy(tt.matrixWorld):(K.matrix.copy(dt.matrixWorld),K.matrix.invert(),K.matrix.multiply(tt.matrixWorld)),K.matrix.decompose(K.position,K.quaternion,K.scale),K.updateMatrixWorld(!0),K.projectionMatrix.copy(tt.projectionMatrix),K.projectionMatrixInverse.copy(tt.projectionMatrixInverse),K.isPerspectiveCamera&&(K.fov=Ks*2*Math.atan(1/K.projectionMatrix.elements[5]),K.zoom=1)}this.getCamera=function(){return F},this.getFoveation=function(){if(!(u===null&&m===null))return l},this.setFoveation=function(K){l=K,u!==null&&(u.fixedFoveation=K),m!==null&&m.fixedFoveation!==void 0&&(m.fixedFoveation=K)},this.hasDepthSensing=function(){return p.texture!==null},this.getDepthSensingMesh=function(){return p.getMesh(F)},this.getCameraTexture=function(K){return f[K]};let lt=null;function wt(K,tt){if(h=tt.getViewerPose(c||r),g=tt,h!==null){let dt=h.views;m!==null&&(t.setRenderTargetFramebuffer(_,m.framebuffer),t.setRenderTarget(_));let Ct=!1;dt.length!==F.cameras.length&&(F.cameras.length=0,Ct=!0);for(let te=0;te<dt.length;te++){let ee=dt[te],xe=null;if(m!==null)xe=m.getViewport(ee);else{let we=d.getViewSubImage(u,ee);xe=we.viewport,te===0&&(t.setRenderTargetTextures(_,we.colorTexture,we.depthStencilTexture),t.setRenderTarget(_))}let ne=N[te];ne===void 0&&(ne=new nn,ne.layers.enable(te),ne.viewport=new _e,N[te]=ne),ne.matrix.fromArray(ee.transform.matrix),ne.matrix.decompose(ne.position,ne.quaternion,ne.scale),ne.projectionMatrix.fromArray(ee.projectionMatrix),ne.projectionMatrixInverse.copy(ne.projectionMatrix).invert(),ne.viewport.set(xe.x,xe.y,xe.width,xe.height),te===0&&(F.matrix.copy(ne.matrix),F.matrix.decompose(F.position,F.quaternion,F.scale)),Ct===!0&&F.cameras.push(ne)}let _t=s.enabledFeatures;if(_t&&_t.includes("depth-sensing")&&s.depthUsage=="gpu-optimized"&&y){d=n.getBinding();let te=d.getDepthInformation(dt[0]);te&&te.isValid&&te.texture&&p.init(te,s.renderState)}if(_t&&_t.includes("camera-access")&&y){t.state.unbindTexture(),d=n.getBinding();for(let te=0;te<dt.length;te++){let ee=dt[te].camera;if(ee){let xe=f[ee];xe||(xe=new Vo,f[ee]=xe);let ne=d.getCameraImage(ee);xe.sourceTexture=ne}}}}for(let dt=0;dt<b.length;dt++){let Ct=E[dt],_t=b[dt];Ct!==null&&_t!==void 0&&_t.update(Ct,tt,c||r)}lt&&lt(K,tt),tt.detectedPlanes&&n.dispatchEvent({type:"planesdetected",data:tt}),g=null}let gt=new T0;gt.setAnimationLoop(wt),this.setAnimationLoop=function(K){lt=K},this.dispose=function(){}}},H1=new le,D0=new Jt;D0.set(-1,0,0,0,1,0,0,0,1);function U1(i,t){function e(p,f){p.matrixAutoUpdate===!0&&p.updateMatrix(),f.value.copy(p.matrix)}function n(p,f){f.color.getRGB(p.fogColor.value,Gl(i)),f.isFog?(p.fogNear.value=f.near,p.fogFar.value=f.far):f.isFogExp2&&(p.fogDensity.value=f.density)}function s(p,f,v,S,_){f.isNodeMaterial?f.uniformsNeedUpdate=!1:f.isMeshBasicMaterial?o(p,f):f.isMeshLambertMaterial?(o(p,f),f.envMap&&(p.envMapIntensity.value=f.envMapIntensity)):f.isMeshToonMaterial?(o(p,f),d(p,f)):f.isMeshPhongMaterial?(o(p,f),h(p,f),f.envMap&&(p.envMapIntensity.value=f.envMapIntensity)):f.isMeshStandardMaterial?(o(p,f),u(p,f),f.isMeshPhysicalMaterial&&m(p,f,_)):f.isMeshMatcapMaterial?(o(p,f),g(p,f)):f.isMeshDepthMaterial?o(p,f):f.isMeshDistanceMaterial?(o(p,f),y(p,f)):f.isMeshNormalMaterial?o(p,f):f.isLineBasicMaterial?(r(p,f),f.isLineDashedMaterial&&a(p,f)):f.isPointsMaterial?l(p,f,v,S):f.isSpriteMaterial?c(p,f):f.isShadowMaterial?(p.color.value.copy(f.color),p.opacity.value=f.opacity):f.isShaderMaterial&&(f.uniformsNeedUpdate=!1)}function o(p,f){p.opacity.value=f.opacity,f.color&&p.diffuse.value.copy(f.color),f.emissive&&p.emissive.value.copy(f.emissive).multiplyScalar(f.emissiveIntensity),f.map&&(p.map.value=f.map,e(f.map,p.mapTransform)),f.alphaMap&&(p.alphaMap.value=f.alphaMap,e(f.alphaMap,p.alphaMapTransform)),f.bumpMap&&(p.bumpMap.value=f.bumpMap,e(f.bumpMap,p.bumpMapTransform),p.bumpScale.value=f.bumpScale,f.side===fn&&(p.bumpScale.value*=-1)),f.normalMap&&(p.normalMap.value=f.normalMap,e(f.normalMap,p.normalMapTransform),p.normalScale.value.copy(f.normalScale),f.side===fn&&p.normalScale.value.negate()),f.displacementMap&&(p.displacementMap.value=f.displacementMap,e(f.displacementMap,p.displacementMapTransform),p.displacementScale.value=f.displacementScale,p.displacementBias.value=f.displacementBias),f.emissiveMap&&(p.emissiveMap.value=f.emissiveMap,e(f.emissiveMap,p.emissiveMapTransform)),f.specularMap&&(p.specularMap.value=f.specularMap,e(f.specularMap,p.specularMapTransform)),f.alphaTest>0&&(p.alphaTest.value=f.alphaTest);let v=t.get(f),S=v.envMap,_=v.envMapRotation;S&&(p.envMap.value=S,p.envMapRotation.value.setFromMatrix4(H1.makeRotationFromEuler(_)).transpose(),S.isCubeTexture&&S.isRenderTargetTexture===!1&&p.envMapRotation.value.premultiply(D0),p.reflectivity.value=f.reflectivity,p.ior.value=f.ior,p.refractionRatio.value=f.refractionRatio),f.lightMap&&(p.lightMap.value=f.lightMap,p.lightMapIntensity.value=f.lightMapIntensity,e(f.lightMap,p.lightMapTransform)),f.aoMap&&(p.aoMap.value=f.aoMap,p.aoMapIntensity.value=f.aoMapIntensity,e(f.aoMap,p.aoMapTransform))}function r(p,f){p.diffuse.value.copy(f.color),p.opacity.value=f.opacity,f.map&&(p.map.value=f.map,e(f.map,p.mapTransform))}function a(p,f){p.dashSize.value=f.dashSize,p.totalSize.value=f.dashSize+f.gapSize,p.scale.value=f.scale}function l(p,f,v,S){p.diffuse.value.copy(f.color),p.opacity.value=f.opacity,p.size.value=f.size*v,p.scale.value=S*.5,f.map&&(p.map.value=f.map,e(f.map,p.uvTransform)),f.alphaMap&&(p.alphaMap.value=f.alphaMap,e(f.alphaMap,p.alphaMapTransform)),f.alphaTest>0&&(p.alphaTest.value=f.alphaTest)}function c(p,f){p.diffuse.value.copy(f.color),p.opacity.value=f.opacity,p.rotation.value=f.rotation,f.map&&(p.map.value=f.map,e(f.map,p.mapTransform)),f.alphaMap&&(p.alphaMap.value=f.alphaMap,e(f.alphaMap,p.alphaMapTransform)),f.alphaTest>0&&(p.alphaTest.value=f.alphaTest)}function h(p,f){p.specular.value.copy(f.specular),p.shininess.value=Math.max(f.shininess,1e-4)}function d(p,f){f.gradientMap&&(p.gradientMap.value=f.gradientMap)}function u(p,f){p.metalness.value=f.metalness,f.metalnessMap&&(p.metalnessMap.value=f.metalnessMap,e(f.metalnessMap,p.metalnessMapTransform)),p.roughness.value=f.roughness,f.roughnessMap&&(p.roughnessMap.value=f.roughnessMap,e(f.roughnessMap,p.roughnessMapTransform)),f.envMap&&(p.envMapIntensity.value=f.envMapIntensity)}function m(p,f,v){p.ior.value=f.ior,f.sheen>0&&(p.sheenColor.value.copy(f.sheenColor).multiplyScalar(f.sheen),p.sheenRoughness.value=f.sheenRoughness,f.sheenColorMap&&(p.sheenColorMap.value=f.sheenColorMap,e(f.sheenColorMap,p.sheenColorMapTransform)),f.sheenRoughnessMap&&(p.sheenRoughnessMap.value=f.sheenRoughnessMap,e(f.sheenRoughnessMap,p.sheenRoughnessMapTransform))),f.clearcoat>0&&(p.clearcoat.value=f.clearcoat,p.clearcoatRoughness.value=f.clearcoatRoughness,f.clearcoatMap&&(p.clearcoatMap.value=f.clearcoatMap,e(f.clearcoatMap,p.clearcoatMapTransform)),f.clearcoatRoughnessMap&&(p.clearcoatRoughnessMap.value=f.clearcoatRoughnessMap,e(f.clearcoatRoughnessMap,p.clearcoatRoughnessMapTransform)),f.clearcoatNormalMap&&(p.clearcoatNormalMap.value=f.clearcoatNormalMap,e(f.clearcoatNormalMap,p.clearcoatNormalMapTransform),p.clearcoatNormalScale.value.copy(f.clearcoatNormalScale),f.side===fn&&p.clearcoatNormalScale.value.negate())),f.dispersion>0&&(p.dispersion.value=f.dispersion),f.retroreflectivity>0&&(p.retroreflectivity.value=f.retroreflectivity),f.iridescence>0&&(p.iridescence.value=f.iridescence,p.iridescenceIOR.value=f.iridescenceIOR,p.iridescenceThicknessMinimum.value=f.iridescenceThicknessRange[0],p.iridescenceThicknessMaximum.value=f.iridescenceThicknessRange[1],f.iridescenceMap&&(p.iridescenceMap.value=f.iridescenceMap,e(f.iridescenceMap,p.iridescenceMapTransform)),f.iridescenceThicknessMap&&(p.iridescenceThicknessMap.value=f.iridescenceThicknessMap,e(f.iridescenceThicknessMap,p.iridescenceThicknessMapTransform))),f.transmission>0&&(p.transmission.value=f.transmission,p.transmissionSamplerMap.value=v.texture,p.transmissionSamplerSize.value.set(v.width,v.height),f.transmissionMap&&(p.transmissionMap.value=f.transmissionMap,e(f.transmissionMap,p.transmissionMapTransform)),p.thickness.value=f.thickness,f.thicknessMap&&(p.thicknessMap.value=f.thicknessMap,e(f.thicknessMap,p.thicknessMapTransform)),p.attenuationDistance.value=f.attenuationDistance,p.attenuationColor.value.copy(f.attenuationColor)),f.anisotropy>0&&(p.anisotropyVector.value.set(f.anisotropy*Math.cos(f.anisotropyRotation),f.anisotropy*Math.sin(f.anisotropyRotation)),f.anisotropyMap&&(p.anisotropyMap.value=f.anisotropyMap,e(f.anisotropyMap,p.anisotropyMapTransform))),p.specularIntensity.value=f.specularIntensity,p.specularColor.value.copy(f.specularColor),f.specularColorMap&&(p.specularColorMap.value=f.specularColorMap,e(f.specularColorMap,p.specularColorMapTransform)),f.specularIntensityMap&&(p.specularIntensityMap.value=f.specularIntensityMap,e(f.specularIntensityMap,p.specularIntensityMapTransform))}function g(p,f){f.matcap&&(p.matcap.value=f.matcap)}function y(p,f){let v=t.get(f).light;p.referencePosition.value.setFromMatrixPosition(v.matrixWorld),p.nearDistance.value=v.shadow.camera.near,p.farDistance.value=v.shadow.camera.far}return{refreshFogUniforms:n,refreshMaterialUniforms:s}}function k1(i,t,e,n){let s={},o={},r=[],a=i.getParameter(i.MAX_UNIFORM_BUFFER_BINDINGS);function l(_,b){let E=b.program;n.uniformBlockBinding(_,E)}function c(_,b){let E=s[_.id];E===void 0&&(p(_),E=h(_),s[_.id]=E,_.addEventListener("dispose",v));let A=b.program;n.updateUBOMapping(_,A);let M=t.render.frame;o[_.id]!==M&&(u(_),o[_.id]=M)}function h(_){let b=d();_.__bindingPointIndex=b;let E=i.createBuffer(),A=_.__size,M=_.usage;return i.bindBuffer(i.UNIFORM_BUFFER,E),i.bufferData(i.UNIFORM_BUFFER,A,M),i.bindBuffer(i.UNIFORM_BUFFER,null),i.bindBufferBase(i.UNIFORM_BUFFER,b,E),E}function d(){for(let _=0;_<a;_++)if(r.indexOf(_)===-1)return r.push(_),_;return Xt("WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function u(_){let b=s[_.id],E=_.uniforms,A=_.__cache;i.bindBuffer(i.UNIFORM_BUFFER,b);for(let M=0,w=E.length;M<w;M++){let T=E[M];if(Array.isArray(T))for(let P=0,N=T.length;P<N;P++)m(T[P],M,P,A);else m(T,M,0,A)}i.bindBuffer(i.UNIFORM_BUFFER,null)}function m(_,b,E,A){if(y(_,b,E,A)===!0){let M=_.__offset,w=_.value;if(Array.isArray(w)){let T=0;for(let P=0;P<w.length;P++){let N=w[P],F=f(N);g(N,_.__data,T),typeof N!="number"&&typeof N!="boolean"&&!N.isMatrix3&&!ArrayBuffer.isView(N)&&(T+=F.storage/Float32Array.BYTES_PER_ELEMENT)}}else g(w,_.__data,0);i.bufferSubData(i.UNIFORM_BUFFER,M,_.__data)}}function g(_,b,E){typeof _=="number"||typeof _=="boolean"?b[0]=_:_.isMatrix3?(b[0]=_.elements[0],b[1]=_.elements[1],b[2]=_.elements[2],b[3]=0,b[4]=_.elements[3],b[5]=_.elements[4],b[6]=_.elements[5],b[7]=0,b[8]=_.elements[6],b[9]=_.elements[7],b[10]=_.elements[8],b[11]=0):ArrayBuffer.isView(_)?b.set(new _.constructor(_.buffer,_.byteOffset,b.length)):_.toArray(b,E)}function y(_,b,E,A){let M=_.value,w=b+"_"+E;if(A[w]===void 0)return typeof M=="number"||typeof M=="boolean"?A[w]=M:ArrayBuffer.isView(M)?A[w]=M.slice():A[w]=M.clone(),!0;{let T=A[w];if(typeof M=="number"||typeof M=="boolean"){if(T!==M)return A[w]=M,!0}else{if(ArrayBuffer.isView(M))return!0;if(T.equals(M)===!1)return T.copy(M),!0}}return!1}function p(_){let b=_.uniforms,E=0,A=16;for(let w=0,T=b.length;w<T;w++){let P=Array.isArray(b[w])?b[w]:[b[w]];for(let N=0,F=P.length;N<F;N++){let D=P[N],z=Array.isArray(D.value)?D.value:[D.value];for(let L=0,U=z.length;L<U;L++){let O=z[L],k=f(O),W=E%A,q=W%k.boundary,at=W+q;E+=q,at!==0&&A-at<k.storage&&(E+=A-at),D.__data=new Float32Array(k.storage/Float32Array.BYTES_PER_ELEMENT),D.__offset=E,E+=k.storage}}}let M=E%A;return M>0&&(E+=A-M),_.__size=E,_.__cache={},this}function f(_){let b={boundary:0,storage:0};return typeof _=="number"||typeof _=="boolean"?(b.boundary=4,b.storage=4):_.isVector2?(b.boundary=8,b.storage=8):_.isVector3||_.isColor?(b.boundary=16,b.storage=12):_.isVector4?(b.boundary=16,b.storage=16):_.isMatrix3?(b.boundary=48,b.storage=48):_.isMatrix4?(b.boundary=64,b.storage=64):_.isTexture?Wt("WebGLRenderer: Texture samplers can not be part of an uniforms group."):ArrayBuffer.isView(_)?(b.boundary=16,b.storage=_.byteLength):Wt("WebGLRenderer: Unsupported uniform value type.",_),b}function v(_){let b=_.target;b.removeEventListener("dispose",v);let E=r.indexOf(b.__bindingPointIndex);r.splice(E,1),i.deleteBuffer(s[b.id]),delete s[b.id],delete o[b.id]}function S(){for(let _ in s)i.deleteBuffer(s[_]);r=[],s={},o={}}return{bind:l,update:c,dispose:S}}var F1=new Uint16Array([12469,15057,12620,14925,13266,14620,13807,14376,14323,13990,14545,13625,14713,13328,14840,12882,14931,12528,14996,12233,15039,11829,15066,11525,15080,11295,15085,10976,15082,10705,15073,10495,13880,14564,13898,14542,13977,14430,14158,14124,14393,13732,14556,13410,14702,12996,14814,12596,14891,12291,14937,11834,14957,11489,14958,11194,14943,10803,14921,10506,14893,10278,14858,9960,14484,14039,14487,14025,14499,13941,14524,13740,14574,13468,14654,13106,14743,12678,14818,12344,14867,11893,14889,11509,14893,11180,14881,10751,14852,10428,14812,10128,14765,9754,14712,9466,14764,13480,14764,13475,14766,13440,14766,13347,14769,13070,14786,12713,14816,12387,14844,11957,14860,11549,14868,11215,14855,10751,14825,10403,14782,10044,14729,9651,14666,9352,14599,9029,14967,12835,14966,12831,14963,12804,14954,12723,14936,12564,14917,12347,14900,11958,14886,11569,14878,11247,14859,10765,14828,10401,14784,10011,14727,9600,14660,9289,14586,8893,14508,8533,15111,12234,15110,12234,15104,12216,15092,12156,15067,12010,15028,11776,14981,11500,14942,11205,14902,10752,14861,10393,14812,9991,14752,9570,14682,9252,14603,8808,14519,8445,14431,8145,15209,11449,15208,11451,15202,11451,15190,11438,15163,11384,15117,11274,15055,10979,14994,10648,14932,10343,14871,9936,14803,9532,14729,9218,14645,8742,14556,8381,14461,8020,14365,7603,15273,10603,15272,10607,15267,10619,15256,10631,15231,10614,15182,10535,15118,10389,15042,10167,14963,9787,14883,9447,14800,9115,14710,8665,14615,8318,14514,7911,14411,7507,14279,7198,15314,9675,15313,9683,15309,9712,15298,9759,15277,9797,15229,9773,15166,9668,15084,9487,14995,9274,14898,8910,14800,8539,14697,8234,14590,7790,14479,7409,14367,7067,14178,6621,15337,8619,15337,8631,15333,8677,15325,8769,15305,8871,15264,8940,15202,8909,15119,8775,15022,8565,14916,8328,14804,8009,14688,7614,14569,7287,14448,6888,14321,6483,14088,6171,15350,7402,15350,7419,15347,7480,15340,7613,15322,7804,15287,7973,15229,8057,15148,8012,15046,7846,14933,7611,14810,7357,14682,7069,14552,6656,14421,6316,14251,5948,14007,5528,15356,5942,15356,5977,15353,6119,15348,6294,15332,6551,15302,6824,15249,7044,15171,7122,15070,7050,14949,6861,14818,6611,14679,6349,14538,6067,14398,5651,14189,5311,13935,4958,15359,4123,15359,4153,15356,4296,15353,4646,15338,5160,15311,5508,15263,5829,15188,6042,15088,6094,14966,6001,14826,5796,14678,5543,14527,5287,14377,4985,14133,4586,13869,4257,15360,1563,15360,1642,15358,2076,15354,2636,15341,3350,15317,4019,15273,4429,15203,4732,15105,4911,14981,4932,14836,4818,14679,4621,14517,4386,14359,4156,14083,3795,13808,3437,15360,122,15360,137,15358,285,15355,636,15344,1274,15322,2177,15281,2765,15215,3223,15120,3451,14995,3569,14846,3567,14681,3466,14511,3305,14344,3121,14037,2800,13753,2467,15360,0,15360,1,15359,21,15355,89,15346,253,15325,479,15287,796,15225,1148,15133,1492,15008,1749,14856,1882,14685,1886,14506,1783,14324,1608,13996,1398,13702,1183]),fi=null;function z1(){return fi===null&&(fi=new ko(F1,16,16,ns,ei),fi.name="DFG_LUT",fi.minFilter=hn,fi.magFilter=hn,fi.wrapS=ci,fi.wrapT=ci,fi.generateMipmaps=!1,fi.needsUpdate=!0),fi}var yc=class{constructor(t={}){let{canvas:e=Ju(),context:n=null,depth:s=!0,stencil:o=!1,alpha:r=!1,antialias:a=!1,premultipliedAlpha:l=!0,preserveDrawingBuffer:c=!1,powerPreference:h="default",failIfMajorPerformanceCaveat:d=!1,reversedDepthBuffer:u=!1,outputBufferType:m=En}=t;this.isWebGLRenderer=!0;let g;if(n!==null){if(typeof WebGLRenderingContext<"u"&&n instanceof WebGLRenderingContext)throw new Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");g=n.getContextAttributes().alpha}else g=r;let y=m,p=new Set([Na,La,Da]),f=new Set([En,Un,oo,es,Ca,Pa]),v=new Uint32Array(4),S=new Int32Array(4),_=new x,b=null,E=null,A=[],M=[],w=null;this.domElement=e,this.debug={checkShaderErrors:!0,diagnostics:{keywords:!1},onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this.toneMapping=ti,this.toneMappingExposure=1,this.transmissionResolutionScale=1;let T=this,P=!1,N=null,F=null,D=null,z=null;this._outputColorSpace=In;let L=0,U=0,O=null,k=-1,W=null,q=new _e,at=new _e,it=null,lt=new J(0),wt=0,gt=e.width,K=e.height,tt=1,dt=null,Ct=null,_t=new _e(0,0,gt,K),$t=new _e(0,0,gt,K),Ee=!1,te=new zo,ee=!1,xe=!1,ne=new le,we=new x,Pe=new _e,Xe={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0},Fe=!1;function We(){return O===null?tt:1}let V=n;function ue(C,G){return e.getContext(C,G)}let Kt,H,R,X,$,nt,ft,mt,st,rt,xt,et,pt,ht,Pt,Lt,Yt,B,Mt,ot,Et,At,ct;try{let C={alpha:!0,depth:s,stencil:o,antialias:a,premultipliedAlpha:l,preserveDrawingBuffer:c,powerPreference:h,failIfMajorPerformanceCaveat:d};if("setAttribute"in e&&e.setAttribute("data-engine",`three.js r${"186"}`),e.addEventListener("webglcontextlost",Ne,!1),e.addEventListener("webglcontextrestored",be,!1),e.addEventListener("webglcontextcreationerror",qn,!1),V===null){let G="webgl2";if(V=ue(G,C),V===null)throw ue(G)?new Error("THREE.WebGLRenderer: Error creating WebGL context with your selected attributes."):new Error("THREE.WebGLRenderer: Error creating WebGL context.")}Ot()}catch(C){throw e.removeEventListener("webglcontextlost",Ne,!1),e.removeEventListener("webglcontextrestored",be,!1),e.removeEventListener("webglcontextcreationerror",qn,!1),Xt("WebGLRenderer: "+C.message),C}function Ot(){Kt=new qg(V),Kt.init(),Et=new D1(V,Kt),H=new Ug(V,Kt,t,Et),R=new P1(V,Kt),H.reversedDepthBuffer&&u&&R.buffers.depth.setReversed(!0),F=V.createFramebuffer(),D=V.createFramebuffer(),z=V.createFramebuffer(),X=new $g(V),$=new g1,nt=new I1(V,Kt,R,$,H,Et,X),ft=new Xg(T),mt=new Jf(V),At=new Ng(V,mt),st=new Yg(V,mt,X,At),rt=new Jg(V,st,mt,At,X),B=new Kg(V,H,nt),Pt=new kg($),xt=new m1(T,ft,Kt,H,At,Pt),et=new U1(T,$),pt=new y1,ht=new b1(Kt),Yt=new Lg(T,ft,R,rt,g,l),Lt=new C1(T,rt,H),ct=new k1(V,X,H,R),Mt=new Hg(V,Kt,X),ot=new Zg(V,Kt,X),X.programs=xt.programs,T.capabilities=H,T.extensions=Kt,T.properties=$,T.renderLists=pt,T.shadowMap=Lt,T.state=R,T.info=X}y!==En&&(w=new Qg(y,e.width,e.height,a,s,o));let kt=new dh(T,V);this.xr=kt,this.getContext=function(){return V},this.getContextAttributes=function(){return V.getContextAttributes()},this.forceContextLoss=function(){let C=Kt.get("WEBGL_lose_context");C&&C.loseContext()},this.forceContextRestore=function(){let C=Kt.get("WEBGL_lose_context");C&&C.restoreContext()},this.getPixelRatio=function(){return tt},this.setPixelRatio=function(C){C!==void 0&&(tt=C,this.setSize(gt,K,!1))},this.getSize=function(C){return C.set(gt,K)},this.setSize=function(C,G,Q=!0){if(kt.isPresenting){Wt("WebGLRenderer: Can't change size while VR device is presenting.");return}gt=C,K=G,e.width=Math.floor(C*tt),e.height=Math.floor(G*tt),Q===!0&&(e.style.width=C+"px",e.style.height=G+"px"),w!==null&&w.setSize(e.width,e.height),this.setViewport(0,0,C,G)},this.getDrawingBufferSize=function(C){return C.set(gt*tt,K*tt).floor()},this.setDrawingBufferSize=function(C,G,Q){gt=C,K=G,tt=Q,e.width=Math.floor(C*Q),e.height=Math.floor(G*Q),this.setViewport(0,0,C,G)},this.setEffects=function(C){if(y===En){Xt("WebGLRenderer: setEffects() requires outputBufferType set to HalfFloatType or FloatType.");return}if(C){for(let G=0;G<C.length;G++)if(C[G].isOutputPass===!0){Wt("WebGLRenderer: OutputPass is not needed in setEffects(). Tone mapping and color space conversion are applied automatically.");break}}w.setEffects(C||[])},this.getCurrentViewport=function(C){return C.copy(q)},this.getViewport=function(C){return C.copy(_t)},this.setViewport=function(C,G,Q,Y){C.isVector4?_t.set(C.x,C.y,C.z,C.w):_t.set(C,G,Q,Y),R.viewport(q.copy(_t).multiplyScalar(tt).round())},this.getScissor=function(C){return C.copy($t)},this.setScissor=function(C,G,Q,Y){C.isVector4?$t.set(C.x,C.y,C.z,C.w):$t.set(C,G,Q,Y),R.scissor(at.copy($t).multiplyScalar(tt).round())},this.getScissorTest=function(){return Ee},this.setScissorTest=function(C){R.setScissorTest(Ee=C)},this.setOpaqueSort=function(C){dt=C},this.setTransparentSort=function(C){Ct=C},this.getClearColor=function(C){return C.copy(Yt.getClearColor())},this.setClearColor=function(){Yt.setClearColor(...arguments)},this.getClearAlpha=function(){return Yt.getClearAlpha()},this.setClearAlpha=function(){Yt.setClearAlpha(...arguments)},this.clear=function(C=!0,G=!0,Q=!0){let Y=0;if(C){let Z=!1;if(O!==null){let Tt=O.texture.format;Z=p.has(Tt)}if(Z){let Tt=O.texture.type,Dt=f.has(Tt),St=Yt.getClearColor(),Ht=Yt.getClearAlpha(),Ft=St.r,se=St.g,de=St.b;Dt?(v[0]=Ft,v[1]=se,v[2]=de,v[3]=Ht,V.clearBufferuiv(V.COLOR,0,v)):(S[0]=Ft,S[1]=se,S[2]=de,S[3]=Ht,V.clearBufferiv(V.COLOR,0,S))}else Y|=V.COLOR_BUFFER_BIT}G&&(Y|=V.DEPTH_BUFFER_BIT,this.state.buffers.depth.setMask(!0)),Q&&(Y|=V.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),Y!==0&&V.clear(Y)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.setNodesHandler=function(C){C.setRenderer(this),N=C},this.dispose=function(){e.removeEventListener("webglcontextlost",Ne,!1),e.removeEventListener("webglcontextrestored",be,!1),e.removeEventListener("webglcontextcreationerror",qn,!1),Yt.dispose(),pt.dispose(),ht.dispose(),$.dispose(),ft.dispose(),rt.dispose(),At.dispose(),ct.dispose(),xt.dispose(),kt.dispose(),kt.removeEventListener("sessionstart",Oh),kt.removeEventListener("sessionend",Vh),hs.stop()};function Ne(C){C.preventDefault(),Vl("WebGLRenderer: Context Lost."),P=!0}function be(){Vl("WebGLRenderer: Context Restored."),P=!1;let C=X.autoReset,G=Lt.enabled,Q=Lt.autoUpdate,Y=Lt.needsUpdate,Z=Lt.type;Ot(),X.autoReset=C,Lt.enabled=G,Lt.autoUpdate=Q,Lt.needsUpdate=Y,Lt.type=Z}function qn(C){Xt("WebGLRenderer: A WebGL context could not be created. Reason: ",C.statusMessage)}function oi(C){let G=C.target;G.removeEventListener("dispose",oi),Bd(G)}function Bd(C){Gd(C),$.remove(C)}function Gd(C){let G=$.get(C).programs;G!==void 0&&(G.forEach(function(Q){xt.releaseProgram(Q)}),C.isShaderMaterial&&xt.releaseShaderCache(C))}this.renderBufferDirect=function(C,G,Q,Y,Z,Tt){G===null&&(G=Xe);let Dt=Z.isMesh&&Z.matrixWorld.determinantAffine()<0,St=qd(C,G,Q,Y,Z);R.setMaterial(Y,Dt);let Ht=Q.index,Ft=1;if(Y.wireframe===!0){if(Ht=st.getWireframeAttribute(Q),Ht===void 0)return;Ft=2}let se=Q.drawRange,de=Q.attributes.position,Ut=se.start*Ft,Se=(se.start+se.count)*Ft;Tt!==null&&(Ut=Math.max(Ut,Tt.start*Ft),Se=Math.min(Se,(Tt.start+Tt.count)*Ft)),Ht!==null?(Ut=Math.max(Ut,0),Se=Math.min(Se,Ht.count)):de!=null&&(Ut=Math.max(Ut,0),Se=Math.min(Se,de.count));let je=Se-Ut;if(je<0||je===1/0)return;At.setup(Z,Y,St,Q,Ht);let ze,Le=Mt;if(Ht!==null&&(ze=mt.get(Ht),Le=ot,Le.setIndex(ze)),Z.isMesh)Y.wireframe===!0?(R.setLineWidth(Y.wireframeLinewidth*We()),Le.setMode(V.LINES)):Le.setMode(V.TRIANGLES);else if(Z.isLine){let mn=Y.linewidth;mn===void 0&&(mn=1),R.setLineWidth(mn*We()),Z.isLineSegments?Le.setMode(V.LINES):Z.isLineLoop?Le.setMode(V.LINE_LOOP):Le.setMode(V.LINE_STRIP)}else Z.isPoints?Le.setMode(V.POINTS):Z.isSprite&&Le.setMode(V.TRIANGLES);if(Z.isBatchedMesh)if(Kt.get("WEBGL_multi_draw"))Le.renderMultiDraw(Z._multiDrawStarts,Z._multiDrawCounts,Z._multiDrawCount);else{let mn=Z._multiDrawStarts,It=Z._multiDrawCounts,_n=Z._multiDrawCount,ye=Ht?mt.get(Ht).bytesPerElement:1,Fn=$.get(Y).currentProgram.getUniforms();for(let ri=0;ri<_n;ri++)Fn.setValue(V,"_gl_DrawID",ri),Le.render(mn[ri]/ye,It[ri])}else if(Z.isInstancedMesh)Le.renderInstances(Ut,je,Z.count);else if(Q.isInstancedBufferGeometry){let mn=Q._maxInstanceCount!==void 0?Q._maxInstanceCount:1/0,It=Math.min(Q.instanceCount,mn);Le.renderInstances(Ut,je,It)}else Le.render(Ut,je)};function zh(C,G,Q,Y){N!==null&&C.isNodeMaterial&&N.setObject(Y,C),ee===!0&&Pt.setState(C,Q,!1),C.transparent===!0&&C.side===me&&C.forceSinglePass===!1?(C.side=fn,C.needsUpdate=!0,_r(C,G,Y),C.side=Qn,C.needsUpdate=!0,_r(C,G,Y),C.side=me):_r(C,G,Y)}this.compile=function(C,G,Q=null){Q===null&&(Q=C),N!==null&&N.renderStart(C,G,Q),E=ht.get(Q),E.init(G),M.push(E),Q.traverseVisible(function(Z){Z.isLight&&Z.layers.test(G.layers)&&(E.pushLight(Z),Z.castShadow&&E.pushShadow(Z))}),C!==Q&&C.traverseVisible(function(Z){Z.isLight&&Z.layers.test(G.layers)&&(E.pushLight(Z),Z.castShadow&&E.pushShadow(Z))}),E.setupLights(),N!==null&&N.updateLights(E.state.lightsArray),xe=this.localClippingEnabled,ee=Pt.init(this.clippingPlanes,xe),ee===!0&&Pt.setGlobalState(this.clippingPlanes,G),N!==null&&Lt.render(E.state.shadowsArray,Q,G);let Y=new Set;return C.traverse(function(Z){if(!(Z.isMesh||Z.isPoints||Z.isLine||Z.isSprite))return;let Tt=Z.material;if(Tt)if(Array.isArray(Tt))for(let Dt=0;Dt<Tt.length;Dt++){let St=Tt[Dt];zh(St,Q,G,Z),Y.add(St)}else zh(Tt,Q,G,Z),Y.add(Tt)}),E=M.pop(),N!==null&&N.renderEnd(),Y},this.compileAsync=function(C,G,Q=null){let Y=this.compile(C,G,Q);return new Promise(Z=>{function Tt(){if(Y.forEach(function(Dt){let Ht=$.get(Dt).currentProgram;(Ht===void 0||Ht.isReady())&&Y.delete(Dt)}),Y.size===0){Z(C);return}setTimeout(Tt,10)}Kt.get("KHR_parallel_shader_compile")!==null?Tt():setTimeout(Tt,10)})};let Xc=null;function Wd(C){Xc&&Xc(C)}function Oh(){hs.stop()}function Vh(){hs.start()}let hs=new T0;hs.setAnimationLoop(Wd),typeof self<"u"&&hs.setContext(self),this.setAnimationLoop=function(C){Xc=C,kt.setAnimationLoop(C),C===null?hs.stop():hs.start()},kt.addEventListener("sessionstart",Oh),kt.addEventListener("sessionend",Vh),this.render=function(C,G){if(G!==void 0&&G.isCamera!==!0){Xt("WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(P===!0)return;N!==null&&N.renderStart(C,G);let Q=kt.enabled===!0&&kt.isPresenting===!0,Y=w!==null&&(O===null||Q)&&w.begin(T,O);if(C.matrixWorldAutoUpdate===!0&&C.updateMatrixWorld(),G.parent===null&&G.matrixWorldAutoUpdate===!0&&G.updateMatrixWorld(),kt.enabled===!0&&kt.isPresenting===!0&&(w===null||w.isCompositing()===!1)&&(kt.cameraAutoUpdate===!0&&kt.updateCamera(G),G=kt.getCamera()),C.isScene===!0&&C.onBeforeRender(T,C,G,O),E=ht.get(C,M.length),E.init(G),E.state.textureUnits=nt.getTextureUnits(),M.push(E),ne.multiplyMatrices(G.projectionMatrix,G.matrixWorldInverse),te.setFromProjectionMatrix(ne,Jn,G.reversedDepth),xe=this.localClippingEnabled,ee=Pt.init(this.clippingPlanes,xe),b=pt.get(C,A.length),b.init(),A.push(b),kt.enabled===!0&&kt.isPresenting===!0){let Dt=T.xr.getDepthSensingMesh();Dt!==null&&qc(Dt,G,-1/0,T.sortObjects)}qc(C,G,0,T.sortObjects),b.finish(),N!==null&&N.updateLights(E.state.lightsArray),T.sortObjects===!0&&b.sort(dt,Ct),Fe=kt.enabled===!1||kt.isPresenting===!1||kt.hasDepthSensing()===!1,Fe&&Yt.addToRenderList(b,C),this.info.render.frame++,this.info.autoReset===!0&&this.info.reset(),ee===!0&&Pt.beginShadows();let Z=E.state.shadowsArray;if(Lt.render(Z,C,G),ee===!0&&Pt.endShadows(),(Y&&w.hasRenderPass())===!1){let Dt=b.opaque,St=b.transmissive;if(E.setupLights(),G.isArrayCamera){let Ht=G.cameras;if(St.length>0)for(let Ft=0,se=Ht.length;Ft<se;Ft++){let de=Ht[Ft];Gh(Dt,St,C,de)}Fe&&Yt.render(C);for(let Ft=0,se=Ht.length;Ft<se;Ft++){let de=Ht[Ft];Bh(b,C,de,de.viewport)}}else St.length>0&&Gh(Dt,St,C,G),Fe&&Yt.render(C),Bh(b,C,G)}O!==null&&U===0&&(nt.updateMultisampleRenderTarget(O),nt.updateRenderTargetMipmap(O)),Y&&w.end(T),C.isScene===!0&&C.onAfterRender(T,C,G),At.resetDefaultState(),k=-1,W=null,M.pop(),M.length>0?(E=M[M.length-1],nt.setTextureUnits(E.state.textureUnits),ee===!0&&Pt.setGlobalState(T.clippingPlanes,E.state.camera)):E=null,A.pop(),A.length>0?b=A[A.length-1]:b=null,N!==null&&N.renderEnd()};function qc(C,G,Q,Y){if(C.visible===!1)return;if(C.layers.test(G.layers)){if(C.isGroup)Q=C.renderOrder;else if(C.isLOD)C.autoUpdate===!0&&C.update(G);else if(C.isLightProbeGrid)E.pushLightProbeGrid(C);else if(C.isLight)E.pushLight(C),C.castShadow&&E.pushShadow(C);else if(C.isSprite){if(!C.frustumCulled||C.intersectsFrustum(te)){Y&&Pe.setFromMatrixPosition(C.matrixWorld).applyMatrix4(ne);let Dt=rt.update(C),St=C.material;St.visible&&b.push(C,Dt,St,Q,Pe.z,null,G)}}else if((C.isMesh||C.isLine||C.isPoints)&&(!C.frustumCulled||C.intersectsFrustum(te))){let Dt=rt.update(C),St=C.material;if(Y&&(C.boundingSphere!==void 0?(C.boundingSphere===null&&C.computeBoundingSphere(),Pe.copy(C.boundingSphere.center)):(Dt.boundingSphere===null&&Dt.computeBoundingSphere(),Pe.copy(Dt.boundingSphere.center)),Pe.applyMatrix4(C.matrixWorld).applyMatrix4(ne)),Array.isArray(St)){let Ht=Dt.groups;for(let Ft=0,se=Ht.length;Ft<se;Ft++){let de=Ht[Ft],Ut=St[de.materialIndex];Ut&&Ut.visible&&b.push(C,Dt,Ut,Q,Pe.z,de,G)}}else St.visible&&b.push(C,Dt,St,Q,Pe.z,null,G)}}let Tt=C.children;for(let Dt=0,St=Tt.length;Dt<St;Dt++)qc(Tt[Dt],G,Q,Y)}function Bh(C,G,Q,Y){let{opaque:Z,transmissive:Tt,transparent:Dt}=C;E.setupLightsView(Q),ee===!0&&Pt.setGlobalState(T.clippingPlanes,Q),Y&&R.viewport(q.copy(Y)),Z.length>0&&vr(Z,G,Q),Tt.length>0&&vr(Tt,G,Q),Dt.length>0&&vr(Dt,G,Q),R.buffers.depth.setTest(!0),R.buffers.depth.setMask(!0),R.buffers.color.setMask(!0),R.setPolygonOffset(!1)}function Gh(C,G,Q,Y){if((Q.isScene===!0?Q.overrideMaterial:null)!==null)return;if(E.state.transmissionRenderTarget[Y.id]===void 0){let Ut=Kt.has("EXT_color_buffer_half_float")||Kt.has("EXT_color_buffer_float");E.state.transmissionRenderTarget[Y.id]=new un(1,1,{generateMipmaps:!0,type:Ut?ei:En,minFilter:ts,samples:Math.max(4,H.samples),stencilBuffer:o,resolveDepthBuffer:!1,resolveStencilBuffer:!1,storeMultisampledDepthBuffer:!1,storeMultisampledStencilBuffer:!1,colorSpace:ce.workingColorSpace})}let Tt=E.state.transmissionRenderTarget[Y.id],Dt=Y.viewport||q;Tt.setSize(Dt.z*T.transmissionResolutionScale,Dt.w*T.transmissionResolutionScale);let St=T.getRenderTarget(),Ht=T.getActiveCubeFace(),Ft=T.getActiveMipmapLevel();T.setRenderTarget(Tt),T.getClearColor(lt),wt=T.getClearAlpha(),wt<1&&T.setClearColor(16777215,.5),T.clear(),Fe&&Yt.render(Q);let se=T.toneMapping;T.toneMapping=ti;let de=Y.viewport;if(Y.viewport!==void 0&&(Y.viewport=void 0),E.setupLightsView(Y),ee===!0&&Pt.setGlobalState(T.clippingPlanes,Y),vr(C,Q,Y),nt.updateMultisampleRenderTarget(Tt),nt.updateRenderTargetMipmap(Tt),Kt.has("WEBGL_multisampled_render_to_texture")===!1){let Ut=!1;for(let Se=0,je=G.length;Se<je;Se++){let ze=G[Se],{object:Le,geometry:mn,material:It,group:_n}=ze;if(It.side===me&&Le.layers.test(Y.layers)){let ye=It.side;It.side=fn,It.needsUpdate=!0,Wh(Le,Q,Y,mn,It,_n),It.side=ye,It.needsUpdate=!0,Ut=!0}}Ut===!0&&(nt.updateMultisampleRenderTarget(Tt),nt.updateRenderTargetMipmap(Tt))}T.setRenderTarget(St,Ht,Ft),T.setClearColor(lt,wt),de!==void 0&&(Y.viewport=de),T.toneMapping=se}function vr(C,G,Q){let Y=G.isScene===!0?G.overrideMaterial:null;for(let Z=0,Tt=C.length;Z<Tt;Z++){let Dt=C[Z],{object:St,geometry:Ht,group:Ft}=Dt,se=Dt.material;se.allowOverride===!0&&Y!==null&&(se=Y),St.layers.test(Q.layers)&&Wh(St,G,Q,Ht,se,Ft)}}function Wh(C,G,Q,Y,Z,Tt){N!==null&&Z.isNodeMaterial&&N.setObject(C,Z),C.onBeforeRender(T,G,Q,Y,Z,Tt),C.modelViewMatrix.multiplyMatrices(Q.matrixWorldInverse,C.matrixWorld),C.normalMatrix.getNormalMatrix(C.modelViewMatrix),Z.onBeforeRender(T,G,Q,Y,C,Tt),Z.transparent===!0&&Z.side===me&&Z.forceSinglePass===!1?(Z.side=fn,Z.needsUpdate=!0,T.renderBufferDirect(Q,G,Y,Z,C,Tt),Z.side=Qn,Z.needsUpdate=!0,T.renderBufferDirect(Q,G,Y,Z,C,Tt),Z.side=me):T.renderBufferDirect(Q,G,Y,Z,C,Tt),C.onAfterRender(T,G,Q,Y,Z,Tt)}function _r(C,G,Q){G.isScene!==!0&&(G=Xe);let Y=$.get(C),Z=E.state.lights,Tt=E.state.shadowsArray,Dt=Z.state.version,St=xt.getParameters(C,Z.state,Tt,G,Q,E.state.lightProbeGridArray),Ht=xt.getProgramCacheKey(St),Ft=Y.programs;Y.environment=C.isMeshStandardMaterial||C.isMeshLambertMaterial||C.isMeshPhongMaterial?G.environment:null,Y.fog=G.fog;let se=C.isMeshStandardMaterial||C.isMeshLambertMaterial&&!C.envMap||C.isMeshPhongMaterial&&!C.envMap;Y.envMap=ft.get(C.envMap||Y.environment,se),Y.envMapRotation=Y.environment!==null&&C.envMap===null?G.environmentRotation:C.envMapRotation,Ft===void 0&&(C.addEventListener("dispose",oi),Ft=new Map,Y.programs=Ft);let de=Ft.get(Ht);if(de!==void 0){if(Y.currentProgram===de&&Y.lightsStateVersion===Dt)return qh(C,St),de}else St.uniforms=xt.getUniforms(C),N!==null&&C.isNodeMaterial&&N.build(C,Q,St),C.onBeforeCompile(St,T),de=xt.acquireProgram(St,Ht),Ft.set(Ht,de),Y.uniforms=St.uniforms;let Ut=Y.uniforms;return(!C.isShaderMaterial&&!C.isRawShaderMaterial||C.clipping===!0)&&(Ut.clippingPlanes=Pt.uniform),qh(C,St),Y.needsLights=Zd(C),Y.lightsStateVersion=Dt,Y.needsLights&&(Ut.ambientLightColor.value=Z.state.ambient,Ut.lightProbe.value=Z.state.probe,Ut.sunLights.value=Z.state.sun,Ut.sunLightShadows.value=Z.state.sunShadow,Ut.directionalLights.value=Z.state.directional,Ut.directionalLightShadows.value=Z.state.directionalShadow,Ut.spotLights.value=Z.state.spot,Ut.spotLightShadows.value=Z.state.spotShadow,Ut.rectAreaLights.value=Z.state.rectArea,Ut.ltc_1.value=Z.state.rectAreaLTC1,Ut.ltc_2.value=Z.state.rectAreaLTC2,Ut.pointLights.value=Z.state.point,Ut.pointLightShadows.value=Z.state.pointShadow,Ut.hemisphereLights.value=Z.state.hemi,Ut.sunShadowMatrix.value=Z.state.sunShadowMatrix,Ut.sunShadowCascade.value=Z.state.sunShadowCascade,Ut.directionalShadowMatrix.value=Z.state.directionalShadowMatrix,Ut.spotLightMatrix.value=Z.state.spotLightMatrix,Ut.spotLightMap.value=Z.state.spotLightMap,Ut.pointShadowMatrix.value=Z.state.pointShadowMatrix),Y.lightProbeGrid=E.state.lightProbeGridArray.length>0,Y.currentProgram=de,Y.uniformsList=null,de}function Xh(C){if(C.uniformsList===null){let G=C.currentProgram.getUniforms();C.uniformsList=lo.seqWithValue(G.seq,C.uniforms)}return C.uniformsList}function qh(C,G){let Q=$.get(C);Q.outputColorSpace=G.outputColorSpace,Q.batching=G.batching,Q.batchingColor=G.batchingColor,Q.instancing=G.instancing,Q.instancingColor=G.instancingColor,Q.instancingMorph=G.instancingMorph,Q.skinning=G.skinning,Q.morphTargets=G.morphTargets,Q.morphNormals=G.morphNormals,Q.morphColors=G.morphColors,Q.morphTargetsCount=G.morphTargetsCount,Q.numClippingPlanes=G.numClippingPlanes,Q.numIntersection=G.numClipIntersection,Q.vertexAlphas=G.vertexAlphas,Q.vertexTangents=G.vertexTangents,Q.toneMapping=G.toneMapping}function Xd(C,G){if(C.length===0)return null;if(C.length===1)return C[0].texture!==null?C[0]:null;_.setFromMatrixPosition(G.matrixWorld);for(let Q=0,Y=C.length;Q<Y;Q++){let Z=C[Q];if(Z.texture!==null&&Z.boundingBox.containsPoint(_))return Z}return null}function qd(C,G,Q,Y,Z){G.isScene!==!0&&(G=Xe),nt.resetTextureUnits();let Tt=G.fog,Dt=Y.isMeshStandardMaterial||Y.isMeshLambertMaterial||Y.isMeshPhongMaterial?G.environment:null,St=O===null?T.outputColorSpace:O.isXRRenderTarget===!0?O.texture.colorSpace:ce.workingColorSpace,Ht=Y.isMeshStandardMaterial||Y.isMeshLambertMaterial&&!Y.envMap||Y.isMeshPhongMaterial&&!Y.envMap,Ft=ft.get(Y.envMap||Dt,Ht),se=Y.vertexColors===!0&&!!Q.attributes.color&&Q.attributes.color.itemSize===4,de=!!Q.attributes.tangent&&(!!Y.normalMap||Y.anisotropy>0),Ut=!!Q.morphAttributes.position,Se=!!Q.morphAttributes.normal,je=!!Q.morphAttributes.color,ze=ti;Y.toneMapped&&(O===null||O.isXRRenderTarget===!0)&&(ze=T.toneMapping);let Le=Q.morphAttributes.position||Q.morphAttributes.normal||Q.morphAttributes.color,mn=Le!==void 0?Le.length:0,It=$.get(Y),_n=E.state.lights;if(ee===!0&&(xe===!0||C!==W)){let He=C===W&&Y.id===k;Pt.setState(Y,C,He)}let ye=!1;Y.version===It.__version?(It.needsLights&&It.lightsStateVersion!==_n.state.version||It.outputColorSpace!==St||Z.isBatchedMesh&&It.batching===!1||!Z.isBatchedMesh&&It.batching===!0||Z.isBatchedMesh&&It.batchingColor===!0&&Z._colorsTexture===null||Z.isBatchedMesh&&It.batchingColor===!1&&Z._colorsTexture!==null||Z.isInstancedMesh&&It.instancing===!1||!Z.isInstancedMesh&&It.instancing===!0||Z.isSkinnedMesh&&It.skinning===!1||!Z.isSkinnedMesh&&It.skinning===!0||Z.isInstancedMesh&&It.instancingColor===!0&&Z.instanceColor===null||Z.isInstancedMesh&&It.instancingColor===!1&&Z.instanceColor!==null||Z.isInstancedMesh&&It.instancingMorph===!0&&Z.morphTexture===null||Z.isInstancedMesh&&It.instancingMorph===!1&&Z.morphTexture!==null||It.envMap!==Ft||Y.fog===!0&&It.fog!==Tt||It.numClippingPlanes!==void 0&&(It.numClippingPlanes!==Pt.numPlanes||It.numIntersection!==Pt.numIntersection)||It.vertexAlphas!==se||It.vertexTangents!==de||It.morphTargets!==Ut||It.morphNormals!==Se||It.morphColors!==je||It.toneMapping!==ze||It.morphTargetsCount!==mn||!!It.lightProbeGrid!=E.state.lightProbeGridArray.length>0)&&(ye=!0):(ye=!0,It.__version=Y.version);let Fn=It.currentProgram;ye===!0&&(Fn=_r(Y,G,Z),N&&Y.isNodeMaterial&&N.onUpdateProgram(Y,Fn,It));let ri=!1,Fi=!1,Ps=!1,Ie=Fn.getUniforms(),Ye=It.uniforms;if(R.useProgram(Fn.program)&&(ri=!0,Fi=!0,Ps=!0),Y.id!==k&&(k=Y.id,Fi=!0),It.needsLights){let He=Xd(E.state.lightProbeGridArray,Z);It.lightProbeGrid!==He&&(It.lightProbeGrid=He,Fi=!0)}if(ri||W!==C){R.buffers.depth.getReversed()&&C.reversedDepth!==!0&&(C._reversedDepth=!0,C.updateProjectionMatrix()),Ie.setValue(V,"projectionMatrix",C.projectionMatrix),Ie.setValue(V,"viewMatrix",C.matrixWorldInverse);let Oi=Ie.map.cameraPosition;Oi!==void 0&&Oi.setValue(V,we.setFromMatrixPosition(C.matrixWorld)),H.logarithmicDepthBuffer&&Ie.setValue(V,"logDepthBufFC",2/(Math.log(C.far+1)/Math.LN2)),(Y.isMeshPhongMaterial||Y.isMeshToonMaterial||Y.isMeshLambertMaterial||Y.isMeshBasicMaterial||Y.isMeshStandardMaterial||Y.isShaderMaterial)&&Ie.setValue(V,"isOrthographic",C.isOrthographicCamera===!0),W!==C&&(W=C,Fi=!0,Ps=!0)}if(It.needsLights&&(_n.state.sunShadowMap.length>0&&Ie.setValue(V,"sunShadowMap",_n.state.sunShadowMap,nt),_n.state.directionalShadowMap.length>0&&Ie.setValue(V,"directionalShadowMap",_n.state.directionalShadowMap,nt),_n.state.spotShadowMap.length>0&&Ie.setValue(V,"spotShadowMap",_n.state.spotShadowMap,nt),_n.state.pointShadowMap.length>0&&Ie.setValue(V,"pointShadowMap",_n.state.pointShadowMap,nt)),Z.isSkinnedMesh){Ie.setOptional(V,Z,"bindMatrix"),Ie.setOptional(V,Z,"bindMatrixInverse");let He=Z.skeleton;He&&(He.boneTexture===null&&He.computeBoneTexture(),Ie.setValue(V,"boneTexture",He.boneTexture,nt))}Z.isBatchedMesh&&(Ie.setOptional(V,Z,"batchingTexture"),Ie.setValue(V,"batchingTexture",Z._matricesTexture,nt),Ie.setOptional(V,Z,"batchingIdTexture"),Ie.setValue(V,"batchingIdTexture",Z._indirectTexture,nt),Ie.setOptional(V,Z,"batchingColorTexture"),Z._colorsTexture!==null&&Ie.setValue(V,"batchingColorTexture",Z._colorsTexture,nt));let zi=Q.morphAttributes;if((zi.position!==void 0||zi.normal!==void 0||zi.color!==void 0)&&B.update(Z,Q,Fn),(Fi||It.receiveShadow!==Z.receiveShadow)&&(It.receiveShadow=Z.receiveShadow,Ie.setValue(V,"receiveShadow",Z.receiveShadow)),(Y.isMeshStandardMaterial||Y.isMeshLambertMaterial||Y.isMeshPhongMaterial)&&Y.envMap===null&&G.environment!==null&&(Ye.envMapIntensity.value=G.environmentIntensity),Ye.dfgLUT!==void 0&&(Ye.dfgLUT.value=z1()),Fi){if(Ie.setValue(V,"toneMappingExposure",T.toneMappingExposure),It.needsLights&&Yd(Ye,Ps),Tt&&Y.fog===!0&&et.refreshFogUniforms(Ye,Tt),et.refreshMaterialUniforms(Ye,Y,tt,K,E.state.transmissionRenderTarget[C.id]),It.needsLights&&It.lightProbeGrid){let He=It.lightProbeGrid;Ye.probesSH.value=He.texture,Ye.probesMin.value.copy(He.boundingBox.min),Ye.probesMax.value.copy(He.boundingBox.max),Ye.probesResolution.value.copy(He.resolution)}lo.upload(V,Xh(It),Ye,nt)}if(Y.isShaderMaterial&&Y.uniformsNeedUpdate===!0&&(lo.upload(V,Xh(It),Ye,nt),Y.uniformsNeedUpdate=!1),Y.isSpriteMaterial&&Ie.setValue(V,"center",Z.center),Ie.setValue(V,"modelViewMatrix",Z.modelViewMatrix),Ie.setValue(V,"normalMatrix",Z.normalMatrix),Ie.setValue(V,"modelMatrix",Z.matrixWorld),Y.uniformsGroups!==void 0){let He=Y.uniformsGroups;for(let Oi=0,Is=He.length;Oi<Is;Oi++){let Zh=He[Oi];ct.update(Zh,Fn),ct.bind(Zh,Fn)}}return Fn}function Yd(C,G){C.ambientLightColor.needsUpdate=G,C.lightProbe.needsUpdate=G,C.sunLights.needsUpdate=G,C.sunLightShadows.needsUpdate=G,C.directionalLights.needsUpdate=G,C.directionalLightShadows.needsUpdate=G,C.pointLights.needsUpdate=G,C.pointLightShadows.needsUpdate=G,C.spotLights.needsUpdate=G,C.spotLightShadows.needsUpdate=G,C.rectAreaLights.needsUpdate=G,C.hemisphereLights.needsUpdate=G}function Zd(C){return C.isMeshLambertMaterial||C.isMeshToonMaterial||C.isMeshPhongMaterial||C.isMeshStandardMaterial||C.isShadowMaterial||C.isShaderMaterial&&C.lights===!0}this.getActiveCubeFace=function(){return L},this.getActiveMipmapLevel=function(){return U},this.getRenderTarget=function(){return O},this.setRenderTargetTextures=function(C,G,Q){let Y=$.get(C);Y.__autoAllocateDepthBuffer=C.resolveDepthBuffer===!1,Y.__autoAllocateDepthBuffer===!1&&(Y.__useRenderToTexture=!1),$.get(C.texture).__webglTexture=G,$.get(C.depthTexture).__webglTexture=Y.__autoAllocateDepthBuffer?void 0:Q,Y.__hasExternalTextures=!0},this.setRenderTargetFramebuffer=function(C,G){let Q=$.get(C);Q.__webglFramebuffer=G,Q.__useDefaultFramebuffer=G===void 0},this.setRenderTarget=function(C,G=0,Q=0){O=C,L=G,U=Q;let Y=null,Z=!1,Tt=!1;if(C){let St=$.get(C);if(St.__useDefaultFramebuffer!==void 0){R.bindFramebuffer(V.FRAMEBUFFER,St.__webglFramebuffer),q.copy(C.viewport),at.copy(C.scissor),it=C.scissorTest,R.viewport(q),R.scissor(at),R.setScissorTest(it),k=-1;return}else if(St.__webglFramebuffer===void 0)nt.setupRenderTarget(C);else if(St.__hasExternalTextures)nt.rebindTextures(C,$.get(C.texture).__webglTexture,$.get(C.depthTexture).__webglTexture);else if(C.depthBuffer){let se=C.depthTexture;if(St.__boundDepthTexture!==se){if(se!==null&&$.has(se)&&(C.width!==se.image.width||C.height!==se.image.height))throw new Error("THREE.WebGLRenderer: Attached DepthTexture is initialized to the incorrect size.");nt.setupDepthRenderbuffer(C)}}let Ht=C.texture;(Ht.isData3DTexture||Ht.isDataArrayTexture||Ht.isCompressedArrayTexture)&&(Tt=!0);let Ft=$.get(C).__webglFramebuffer;C.isWebGLCubeRenderTarget?(Array.isArray(Ft[G])?Y=Ft[G][Q]:Y=Ft[G],Z=!0):C.samples>0&&nt.useMultisampledRTT(C)===!1?Y=$.get(C).__webglMultisampledFramebuffer:Array.isArray(Ft)?Y=Ft[Q]:Y=Ft,q.copy(C.viewport),at.copy(C.scissor),it=C.scissorTest}else q.copy(_t).multiplyScalar(tt).floor(),at.copy($t).multiplyScalar(tt).floor(),it=Ee;if(Q!==0&&(Y=F),R.bindFramebuffer(V.FRAMEBUFFER,Y)&&R.drawBuffers(C,Y),R.viewport(q),R.scissor(at),R.setScissorTest(it),Z){let St=$.get(C.texture);V.framebufferTexture2D(V.FRAMEBUFFER,V.COLOR_ATTACHMENT0,V.TEXTURE_CUBE_MAP_POSITIVE_X+G,St.__webglTexture,Q)}else if(Tt){let St=G;for(let Ht=0;Ht<C.textures.length;Ht++){let Ft=$.get(C.textures[Ht]);V.framebufferTextureLayer(V.FRAMEBUFFER,V.COLOR_ATTACHMENT0+Ht,Ft.__webglTexture,Q,St)}}else if(C!==null&&Q!==0){let St=$.get(C.texture);V.framebufferTexture2D(V.FRAMEBUFFER,V.COLOR_ATTACHMENT0,V.TEXTURE_2D,St.__webglTexture,Q)}k=-1};function Yh(C){let G=$.get(C);return(G.__readFormat!==C.format||G.__readType!==C.type)&&(G.__readFormat=C.format,G.__readType=C.type,G.__formatReadable=H.textureFormatReadable(C.format),G.__typeReadable=H.textureTypeReadable(C.type)),G}this.readRenderTargetPixels=function(C,G,Q,Y,Z,Tt,Dt,St=0){if(!(C&&C.isWebGLRenderTarget)){Xt("WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let Ht=$.get(C).__webglFramebuffer;if(C.isWebGLCubeRenderTarget&&Dt!==void 0&&(Ht=Ht[Dt]),Ht){R.bindFramebuffer(V.FRAMEBUFFER,Ht);try{let Ft=C.textures[St],se=Ft.format,de=Ft.type;C.textures.length>1&&V.readBuffer(V.COLOR_ATTACHMENT0+St);let Ut=Yh(Ft);if(Ut.__formatReadable===!1){Xt("WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}if(Ut.__typeReadable===!1){Xt("WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}G>=0&&G<=C.width-Y&&Q>=0&&Q<=C.height-Z&&V.readPixels(G,Q,Y,Z,Et.convert(se),Et.convert(de),Tt)}finally{let Ft=O!==null?$.get(O).__webglFramebuffer:null;R.bindFramebuffer(V.FRAMEBUFFER,Ft)}}},this.readRenderTargetPixelsAsync=async function(C,G,Q,Y,Z,Tt,Dt,St=0){if(!(C&&C.isWebGLRenderTarget))throw new Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let Ht=$.get(C).__webglFramebuffer;if(C.isWebGLCubeRenderTarget&&Dt!==void 0&&(Ht=Ht[Dt]),Ht)if(G>=0&&G<=C.width-Y&&Q>=0&&Q<=C.height-Z){R.bindFramebuffer(V.FRAMEBUFFER,Ht);let Ft=C.textures[St],se=Ft.format,de=Ft.type;C.textures.length>1&&V.readBuffer(V.COLOR_ATTACHMENT0+St);let Ut=Yh(Ft);if(Ut.__formatReadable===!1)throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(Ut.__typeReadable===!1)throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");let Se=V.createBuffer();V.bindBuffer(V.PIXEL_PACK_BUFFER,Se),V.bufferData(V.PIXEL_PACK_BUFFER,Tt.byteLength,V.STREAM_READ),V.readPixels(G,Q,Y,Z,Et.convert(se),Et.convert(de),0),V.bindBuffer(V.PIXEL_PACK_BUFFER,null);let je=O!==null?$.get(O).__webglFramebuffer:null;R.bindFramebuffer(V.FRAMEBUFFER,je);let ze=V.fenceSync(V.SYNC_GPU_COMMANDS_COMPLETE,0);return V.flush(),await Qu(V,ze,4),V.bindBuffer(V.PIXEL_PACK_BUFFER,Se),V.getBufferSubData(V.PIXEL_PACK_BUFFER,0,Tt),V.bindBuffer(V.PIXEL_PACK_BUFFER,null),V.deleteBuffer(Se),V.deleteSync(ze),Tt}else throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.")},this.copyFramebufferToTexture=function(C,G=null,Q=0){let Y=Math.pow(2,-Q),Z=Math.floor(C.image.width*Y),Tt=Math.floor(C.image.height*Y),Dt=G!==null?G.x:0,St=G!==null?G.y:0;nt.setTexture2D(C,0),V.copyTexSubImage2D(V.TEXTURE_2D,Q,0,0,Dt,St,Z,Tt),R.unbindTexture()},this.copyTextureToTexture=function(C,G,Q=null,Y=null,Z=0,Tt=0){let Dt,St,Ht,Ft,se,de,Ut,Se,je,ze=C.isCompressedTexture?C.mipmaps[Tt]:C.image;if(Q!==null)Dt=Q.max.x-Q.min.x,St=Q.max.y-Q.min.y,Ht=Q.isBox3?Q.max.z-Q.min.z:1,Ft=Q.min.x,se=Q.min.y,de=Q.isBox3?Q.min.z:0;else{let Ye=Math.pow(2,-Z);Dt=Math.floor(ze.width*Ye),St=Math.floor(ze.height*Ye),C.isDataArrayTexture?Ht=ze.depth:C.isData3DTexture?Ht=Math.floor(ze.depth*Ye):Ht=1,Ft=0,se=0,de=0}Y!==null?(Ut=Y.x,Se=Y.y,je=Y.z):(Ut=0,Se=0,je=0);let Le=Et.convert(G.format),mn=Et.convert(G.type),It;G.isData3DTexture?(nt.setTexture3D(G,0),It=V.TEXTURE_3D):G.isDataArrayTexture||G.isCompressedArrayTexture?(nt.setTexture2DArray(G,0),It=V.TEXTURE_2D_ARRAY):(nt.setTexture2D(G,0),It=V.TEXTURE_2D),R.activeTexture(V.TEXTURE0),R.pixelStorei(V.UNPACK_FLIP_Y_WEBGL,G.flipY),R.pixelStorei(V.UNPACK_PREMULTIPLY_ALPHA_WEBGL,G.premultiplyAlpha),R.pixelStorei(V.UNPACK_ALIGNMENT,G.unpackAlignment);let _n=R.getParameter(V.UNPACK_ROW_LENGTH),ye=R.getParameter(V.UNPACK_IMAGE_HEIGHT),Fn=R.getParameter(V.UNPACK_SKIP_PIXELS),ri=R.getParameter(V.UNPACK_SKIP_ROWS),Fi=R.getParameter(V.UNPACK_SKIP_IMAGES);R.pixelStorei(V.UNPACK_ROW_LENGTH,ze.width),R.pixelStorei(V.UNPACK_IMAGE_HEIGHT,ze.height),R.pixelStorei(V.UNPACK_SKIP_PIXELS,Ft),R.pixelStorei(V.UNPACK_SKIP_ROWS,se),R.pixelStorei(V.UNPACK_SKIP_IMAGES,de);let Ps=C.isDataArrayTexture||C.isData3DTexture,Ie=G.isDataArrayTexture||G.isData3DTexture;if(C.isDepthTexture){let Ye=$.get(C),zi=$.get(G),He=$.get(Ye.__renderTarget),Oi=$.get(zi.__renderTarget);R.bindFramebuffer(V.READ_FRAMEBUFFER,He.__webglFramebuffer),R.bindFramebuffer(V.DRAW_FRAMEBUFFER,Oi.__webglFramebuffer);for(let Is=0;Is<Ht;Is++)Ps&&(V.framebufferTextureLayer(V.READ_FRAMEBUFFER,V.COLOR_ATTACHMENT0,$.get(C).__webglTexture,Z,de+Is),V.framebufferTextureLayer(V.DRAW_FRAMEBUFFER,V.COLOR_ATTACHMENT0,$.get(G).__webglTexture,Tt,je+Is)),V.blitFramebuffer(Ft,se,Dt,St,Ut,Se,Dt,St,V.DEPTH_BUFFER_BIT,V.NEAREST);R.bindFramebuffer(V.READ_FRAMEBUFFER,null),R.bindFramebuffer(V.DRAW_FRAMEBUFFER,null)}else if(Z!==0||C.isRenderTargetTexture||$.has(C)){let Ye=$.get(C),zi=$.get(G);R.bindFramebuffer(V.READ_FRAMEBUFFER,D),R.bindFramebuffer(V.DRAW_FRAMEBUFFER,z);for(let He=0;He<Ht;He++)Ps?V.framebufferTextureLayer(V.READ_FRAMEBUFFER,V.COLOR_ATTACHMENT0,Ye.__webglTexture,Z,de+He):V.framebufferTexture2D(V.READ_FRAMEBUFFER,V.COLOR_ATTACHMENT0,V.TEXTURE_2D,Ye.__webglTexture,Z),Ie?V.framebufferTextureLayer(V.DRAW_FRAMEBUFFER,V.COLOR_ATTACHMENT0,zi.__webglTexture,Tt,je+He):V.framebufferTexture2D(V.DRAW_FRAMEBUFFER,V.COLOR_ATTACHMENT0,V.TEXTURE_2D,zi.__webglTexture,Tt),Z!==0?V.blitFramebuffer(Ft,se,Dt,St,Ut,Se,Dt,St,V.COLOR_BUFFER_BIT,V.NEAREST):Ie?V.copyTexSubImage3D(It,Tt,Ut,Se,je+He,Ft,se,Dt,St):V.copyTexSubImage2D(It,Tt,Ut,Se,Ft,se,Dt,St);R.bindFramebuffer(V.READ_FRAMEBUFFER,null),R.bindFramebuffer(V.DRAW_FRAMEBUFFER,null)}else Ie?C.isDataTexture||C.isData3DTexture?V.texSubImage3D(It,Tt,Ut,Se,je,Dt,St,Ht,Le,mn,ze.data):G.isCompressedArrayTexture?V.compressedTexSubImage3D(It,Tt,Ut,Se,je,Dt,St,Ht,Le,ze.data):V.texSubImage3D(It,Tt,Ut,Se,je,Dt,St,Ht,Le,mn,ze):C.isDataTexture?V.texSubImage2D(V.TEXTURE_2D,Tt,Ut,Se,Dt,St,Le,mn,ze.data):C.isCompressedTexture?V.compressedTexSubImage2D(V.TEXTURE_2D,Tt,Ut,Se,ze.width,ze.height,Le,ze.data):V.texSubImage2D(V.TEXTURE_2D,Tt,Ut,Se,Dt,St,Le,mn,ze);R.pixelStorei(V.UNPACK_ROW_LENGTH,_n),R.pixelStorei(V.UNPACK_IMAGE_HEIGHT,ye),R.pixelStorei(V.UNPACK_SKIP_PIXELS,Fn),R.pixelStorei(V.UNPACK_SKIP_ROWS,ri),R.pixelStorei(V.UNPACK_SKIP_IMAGES,Fi),Tt===0&&G.generateMipmaps&&V.generateMipmap(It),R.unbindTexture()},this.initRenderTarget=function(C){$.get(C).__webglFramebuffer===void 0&&nt.setupRenderTarget(C)},this.initTexture=function(C){C.isCubeTexture?nt.setTextureCube(C,0):C.isData3DTexture?nt.setTexture3D(C,0):C.isDataArrayTexture||C.isCompressedArrayTexture?nt.setTexture2DArray(C,0):nt.setTexture2D(C,0),R.unbindTexture()},this.resetState=function(){L=0,U=0,O=null,R.reset(),At.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return Jn}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(t){this._outputColorSpace=t;let e=this.getContext();e.drawingBufferColorSpace=ce._getDrawingBufferColorSpace(t),e.unpackColorSpace=ce._getUnpackColorSpace()}};var rr={kView:.034,kDown:.038,shallow:[.36,.74,.7],deep:[.03,.17,.27]},L0=[.18,.86,.42];var Ii=`
uniform float uTime;
uniform vec3 uSunDir;
uniform vec3 uSunCol;
uniform vec3 uAmbSky;
uniform vec3 uAmbGround;
uniform vec3 uWaterShallow;
uniform vec3 uWaterDeep;
uniform float uKView;
uniform float uKDown;
uniform vec3 uFogCol;
uniform float uFogNear;
uniform float uFogFar;
uniform float uWobble;
uniform vec2 uCurrent;
uniform float uCaustic;
// \u955C\u5934\u6B64\u523B\u5728\u753B\u9762\u4E0A\u8D70\u5F97\u591A\u5FEB\uFF080 \u9759\u6B62 \u2026 1 \u5F88\u5FEB\uFF09\uFF1A\u7126\u6563\u7EC6\u7EBF\u3001\u6D77\u96EA\u7EC6\u70B9\u6309\u5B83\u6DE1\u6210\u5E73\u5747\u4EAE\u5EA6\uFF0C\u5FEB\u8F6C\u5FEB\u63A8\u65F6\u4E0D\u4E00\u683C\u4E00\u683C\u5730\u95EA
uniform float uMotion;

float hash12(vec2 p){
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
float hash13(vec3 p3){
  p3 = fract(p3 * 0.1031);
  p3 += dot(p3, p3.zyx + 31.32);
  return fract((p3.x + p3.y) * p3.z);
}
float vnoise(vec2 p){
  vec2 i = floor(p); vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = hash12(i), b = hash12(i + vec2(1.0, 0.0));
  float c = hash12(i + vec2(0.0, 1.0)), d = hash12(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}
float vnoise3(vec3 p){
  vec3 i = floor(p); vec3 f = fract(p);
  vec3 u = f * f * (3.0 - 2.0 * f);
  float n000 = hash13(i), n100 = hash13(i + vec3(1,0,0));
  float n010 = hash13(i + vec3(0,1,0)), n110 = hash13(i + vec3(1,1,0));
  float n001 = hash13(i + vec3(0,0,1)), n101 = hash13(i + vec3(1,0,1));
  float n011 = hash13(i + vec3(0,1,1)), n111 = hash13(i + vec3(1,1,1));
  return mix(mix(mix(n000, n100, u.x), mix(n010, n110, u.x), u.y),
             mix(mix(n001, n101, u.x), mix(n011, n111, u.x), u.y), u.z);
}
float fbm2(vec2 p){
  float s = 0.0, a = 0.5;
  for (int i = 0; i < 4; i++){ s += a * vnoise(p); p = p * 2.03 + 7.1; a *= 0.5; }
  return s / 0.9375;
}

// \u7126\u6563\uFF1A\u4E24\u5C42\u4F1A\u52A8\u7684 Voronoi \u8FB9\uFF0C\u4EA4\u51FA\u4E00\u5F20\u7EC6\u4EAE\u7F51
vec2 hash22(vec2 p){
  vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973));
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.xx + p3.yz) * p3.zy);
}
// w\uFF1A\u4E00\u4E2A\u50CF\u7D20\u5728\u8FD9\u4E00\u5C42\u7F51\u4E0A\u5360\u591A\u5BBD\uFF08\u7247\u5143\u91CC\u7528 fwidth \u7B97\u597D\u4F20\u8FDB\u6765\uFF1B\u8FD9\u6BB5\u4E5F\u8FDB\u9876\u70B9\u7740\u8272\u5668\uFF0C\u90A3\u91CC\u6CA1\u6709 fwidth\uFF09
float causticLayer(vec2 p, float t, float w){
  vec2 i = floor(p), f = fract(p);
  float d1 = 8.0, d2 = 8.0;
  for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
    vec2 g = vec2(float(x), float(y));
    vec2 o = hash22(i + g);
    o = 0.5 + 0.42 * sin(t * 0.8 + 6.2831 * o);
    vec2 r = g + o - f;
    float d = dot(r, r);
    if (d < d1) { d2 = d1; d1 = d; } else if (d < d2) { d2 = d; }
  }
  float e = sqrt(d2) - sqrt(d1);
  // \u4E00\u4E2A\u50CF\u7D20\u5728\u7F51\u4E0A\u5360\u591A\u5BBD\uFF08\u8D34\u7740\u6C34\u9762\u659C\u770B\u3001\u79BB\u5F97\u8FDC\u65F6\u5F88\u5BBD\uFF09\uFF1A\u7EBF\u81F3\u5C11\u4E00\u4E2A\u50CF\u7D20\u5BBD\uFF0C\u4EAE\u5EA6\u6309\u53D8\u5BBD\u7684\u6BD4\u4F8B\u538B\u4E0B\u53BB\uFF1B
  // \u7F51\u773C\u7EC6\u5230\u4E00\u4E24\u4E2A\u50CF\u7D20\u7684\u5730\u65B9\u4E0D\u518D\u753B\u7EBF\uFF0C\u6362\u6210\u7F51\u7684\u5E73\u5747\u4EAE\u5EA6\u2014\u2014\u4E0D\u4F1A\u4E00\u683C\u4E00\u683C\u5730\u95EA
  float lw = 0.16 + w * 0.7;
  float line = (1.0 - smoothstep(0.0, lw, e)) * (0.16 / lw);
  // \u955C\u5934\u8F6C\u5F97\u3001\u63A8\u5F97\u5FEB\u65F6\u4E5F\u4E00\u6837\u6362\u6210\u5E73\u5747\u4EAE\u5EA6\uFF08\u50CF\u52A8\u6001\u6A21\u7CCA\uFF09\uFF1A\u7EC6\u7EBF\u5728\u753B\u9762\u4E0A\u4E00\u5E27\u8DF3\u51E0\u683C\u65F6\u6700\u95EA
  return mix(line, 0.19, max(smoothstep(0.12, 0.4, w), uMotion));
}
float caustics(vec2 xz, float t, float fw){
  float a = causticLayer(xz * 0.55, t, fw * 0.55);
  float b = causticLayer(xz * 0.43 + vec2(3.7, 1.3) + vec2(t * 0.05, -t * 0.04), t * 1.2 + 4.0, fw * 0.43);
  return clamp(a * 0.7 + b * 0.55 + a * b * 0.8, 0.0, 1.6);
}

// \u6C34\u4E0B\uFF1A\u89C6\u7EBF\u5728\u6C34\u91CC\u8D70\u8FC7\u7684\u8DEF\u7A0B + \u5149\u4E0B\u5230\u8FD9\u4E2A\u6DF1\u5EA6\u7684\u8DEF\u7A0B\uFF0C\u51B3\u5B9A\u80FD\u770B\u6E05\u591A\u5C11
vec3 waterTint(vec3 col, vec3 P, out float trans){
  trans = 1.0;
  if (P.y >= 0.0) {
    float d = length(P - cameraPosition);
    float f = smoothstep(uFogNear, uFogFar, d);
    return mix(col, uFogCol, f * 0.85);
  }
  float depth = -P.y;
  vec3 C = cameraPosition;
  float total = length(P - C);
  float frac = C.y > 0.0 ? depth / max(C.y - P.y, 0.001) : 1.0;
  float path = total * frac;
#ifdef SEE
  // \u5927\u8F6E\u5ED3\uFF1A\u5C11\u5403\u4E00\u70B9\u6C34\u8272\uFF0C\u9732\u51FA\u81EA\u5DF1\u7684\u6DF1\u8272\u2014\u2014\u8BFB\u8D77\u6765\u662F\u4E00\u6761\u6BD4\u6D77\u5E95\u66F4\u6697\u7684\u957F\u5F71
  trans = exp(-(path * uKView + depth * uKDown) * SEE);
#elif defined(CLEAR)
  // \u6DF1\u5904\u7684\u94DC\u4EF6\uFF1A\u5C11\u5403\u4E00\u70B9\u6C34\u8272\u3001\u5C11\u892A\u4E00\u70B9\u7EA2\uFF0C\u5341\u51E0\u7C73\u6C34\u4E0B\u8FD8\u900F\u5F97\u51FA\u94DC\u7684\u9EC4
  trans = exp(-(path * uKView + depth * uKDown) * CLEAR);
#else
  trans = exp(-(path * uKView + depth * uKDown));
#endif
#ifdef CLEAR
  vec3 absorb = exp(-vec3(0.034, 0.032, 0.020) * (path * 0.55 + depth) * CLEAR);
#else
  vec3 absorb = exp(-vec3(0.105, 0.032, 0.020) * (path * 0.55 + depth));
#endif
#ifdef SEE
  // \u5927\u8F6E\u5ED3\u6D6E\u5230\u6DF1\u69FD\u4E0A\u6CBF\u65F6\uFF0C\u56DB\u5468\u7684\u6C34\u8272\u4E5F\u6309\u6DF1\u69FD\u5E95\u90A3\u4E48\u6DF1\u7B97\uFF1A\u8BFB\u8D77\u6765\u662F\u4E00\u6761\u6BD4\u6DF1\u69FD\u66F4\u6697\u7684\u5F71\u5B50\uFF0C\u4E0D\u662F\u4E00\u6761\u88AB\u6D45\u6C34\u8272\u51B2\u4EAE\u7684\u7070\u5F71
  float deepness = 1.0 - exp(-((depth + 14.0) * 0.065 + path * 0.018));
#else
  float deepness = 1.0 - exp(-(depth * 0.065 + path * 0.018));
#endif
  vec3 waterCol = mix(uWaterShallow, uWaterDeep, deepness);
  return mix(waterCol, col * absorb, trans);
}

vec3 hemiAmb(vec3 N){
  return mix(uAmbGround, uAmbSky, N.y * 0.5 + 0.5);
}
`,O1=`
uniform sampler2D uShadowMap;
uniform mat4 uShadowMat;
uniform float uShadowTexel;
uniform float uShadowSpan;
float shadowAt(vec3 wp, vec3 N){
  // \u504F\u79FB\u8DDF\u7740\u9634\u5F71\u8D34\u56FE\u4E00\u683C\u7684\u5927\u5C0F\u8D70\uFF1A\u8FD1\u666F\u65F6\u5F71\u5B50\u8D34\u7740\u4E1C\u897F\uFF0C\u4E0D\u6D6E\u5F00
  vec4 sc = uShadowMat * vec4(wp + N * (0.015 + uShadowSpan * 0.0011), 1.0);
  vec3 s = sc.xyz / sc.w;
  if (s.x <= 0.002 || s.x >= 0.998 || s.y <= 0.002 || s.y >= 0.998 || s.z >= 1.0) return 1.0;
  float b = (0.02 + uShadowSpan * 0.0024) / 259.0;
  float o = uShadowTexel * 0.75;
  float sum = 0.0;
  sum += step(s.z - b, texture2D(uShadowMap, s.xy + vec2(-o, -o)).r);
  sum += step(s.z - b, texture2D(uShadowMap, s.xy + vec2( o, -o)).r);
  sum += step(s.z - b, texture2D(uShadowMap, s.xy + vec2(-o,  o)).r);
  sum += step(s.z - b, texture2D(uShadowMap, s.xy + vec2( o,  o)).r);
  return sum * 0.25;
}
`,N0=`
#ifdef SWAY
uniform vec4 uPress[8];
#endif
#ifdef MUD
uniform float uMud;
uniform float uMudInflate;
uniform float uMudSeed;
uniform float uMudScale;
#endif
#ifdef FISH
uniform float uFishSpeed;
#endif
#ifdef CLOTH
uniform float uClothAmp;
attribute float aCloth;
#endif

vec4 transformWorld(vec3 p, inout vec3 n, out vec3 localP){
  localP = p;
#ifdef MUD
  float mf = vnoise3(p * uMudScale + uMudSeed) * 0.65 + vnoise3(p * uMudScale * 2.7 + uMudSeed * 1.7) * 0.35;
  float lump = smoothstep(0.25, 0.85, mf);
  p += n * uMudInflate * uMud * (0.35 + lump * 0.9);
#endif
#ifdef FISH
  float fph = 0.0;
  #ifdef USE_INSTANCING
  fph = hash12(instanceMatrix[3].xz * 3.1) * 6.283;
  #endif
  float tailK = clamp(-p.x * 2.2, 0.0, 1.5);
  p.z += sin(uTime * (9.0 + uFishSpeed * 8.0) + fph + p.x * 5.0) * tailK * 0.11;
#endif
#ifdef CLOTH
  {
    float w = aCloth * uClothAmp;
    float ph = uTime * 1.25 + p.x * 0.55 + p.z * 0.45;
    p += vec3(uCurrent.x * 0.8, 1.0, uCurrent.y * 0.8) * (sin(ph) * 0.55 + sin(ph * 1.9 + 1.3) * 0.25 + 0.4) * w;
  }
#endif
  vec4 wp;
#ifdef USE_INSTANCING
  wp = modelMatrix * instanceMatrix * vec4(p, 1.0);
  n = mat3(modelMatrix) * mat3(instanceMatrix) * n;
#else
  wp = modelMatrix * vec4(p, 1.0);
  n = mat3(modelMatrix) * n;
#endif
#ifdef SWAY
  {
    vec3 base;
    float sy;
    #ifdef USE_INSTANCING
    base = (modelMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
    sy = length(instanceMatrix[1].xyz);
    #else
    base = (modelMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
    sy = 1.0;
    #endif
    float hn = clamp(p.y, 0.0, 1.0);
    float ph = hash12(base.xz) * 6.283;
    float k = hn * hn;
    vec2 sway = uCurrent * (0.55 + 0.25 * sin(uTime * 0.7 + base.x * 0.13));
    sway += vec2(sin(uTime * 1.25 + ph + base.x * 0.21), cos(uTime * 1.05 + ph * 1.3 + base.z * 0.19)) * 0.22 * SWAY_AMP;
    float flatK = 0.0;
    for (int i = 0; i < 8; i++) {
      vec4 pr = uPress[i];
      if (pr.w <= 0.0) continue;
      vec2 d = base.xz - pr.xy;
      float r = length(d);
      float f = pr.w * (1.0 - smoothstep(pr.z * 0.55, pr.z, r));
      sway += (d / max(r, 0.05)) * f * 1.4;
      flatK = max(flatK, f);
    }
    wp.xz += sway * k * sy;
    wp.y -= flatK * k * sy * 0.55;
  }
#endif
  if (wp.y < 0.0 && uWobble > 0.0) {
    float d = clamp(-wp.y / 10.0, 0.0, 1.0);
    float w = uWobble * 0.055 * d;
    wp.x += sin(uTime * 1.7 + wp.z * 0.55 + wp.x * 0.21) * w;
    wp.z += cos(uTime * 1.45 + wp.x * 0.5 - wp.z * 0.17) * w;
  }
  return wp;
}
`,H0=`
${Ii}
${N0}
varying vec3 vWorld;
varying vec3 vNormal;
varying vec3 vLocal;
#if defined(USE_COLOR) || defined(USE_INSTANCING_COLOR)
varying vec3 vColor;
#endif
#ifdef SWAY
varying float vH;
#endif
#ifdef SEABED
attribute float aRipple;
varying float vRipple;
#endif
#ifdef NET
varying vec2 vUv;
#endif
void main(){
  vec3 n = normal;
  vec3 lp;
  vec4 wp = transformWorld(position, n, lp);
  vWorld = wp.xyz;
  vNormal = normalize(n);
  vLocal = lp;
#if defined(USE_COLOR) || defined(USE_INSTANCING_COLOR)
  vColor = vec3(1.0);
  #ifdef USE_COLOR
  vColor *= color;
  #endif
  #ifdef USE_INSTANCING_COLOR
  vColor *= instanceColor;
  #endif
#endif
#ifdef SWAY
  vH = clamp(position.y, 0.0, 1.0);
#endif
#ifdef SEABED
  vRipple = aRipple;
#endif
#ifdef NET
  vUv = uv;
#endif
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`,U0=`
${Ii}
${O1}
uniform vec3 uColor;
uniform float uSpec;
uniform float uShin;
uniform vec3 uEmissive;
uniform float uOpacity;
#ifdef ITEM
uniform float uItemMark;
#endif
#ifdef MUD
uniform float uMud;
uniform float uMudSeed;
uniform float uMudScale;
uniform vec3 uMudCol;
uniform float uCrust;
uniform vec3 uWashDir;
uniform float uWashBias;
#endif
#ifdef SEABED
uniform vec2 uRippleDir;
#endif
#ifdef GLINT
uniform float uGlint;
#endif
#ifdef WOOD
uniform vec4 uWood;
#endif
#ifdef MOSS
uniform vec4 uMoss;
#endif
varying vec3 vWorld;
varying vec3 vNormal;
varying vec3 vLocal;
#ifdef USE_COLOR
varying vec3 vColor;
#endif
#ifdef SWAY
varying float vH;
#endif
#ifdef SEABED
varying float vRipple;
#endif
#ifdef NET
varying vec2 vUv;
uniform vec2 uNetGrid;
#endif
#ifdef DISSOLVE
uniform float uDissolve;
uniform float uDissolveSeed;
#endif

void main(){
#ifdef DISSOLVE
  float dn = vnoise3(vLocal * 3.1 + uDissolveSeed) * 0.6 + vnoise3(vLocal * 7.3 + uDissolveSeed) * 0.4;
  // \u4ECE\u4E0A\u5F80\u4E0B\u88AB\u51B2\u5F00
  float dh = dn - vLocal.y * 0.3 + 0.5;
  float dth = uDissolve * 1.62 - 0.1;
  if (dh < dth) discard;
  float rim = 1.0 - smoothstep(0.0, 0.07, dh - dth);
#endif
#ifdef NET
  {
    vec2 g = fract(vUv * uNetGrid);
    if (g.x > 0.2 && g.y > 0.2) discard;
  }
#endif
  vec3 albedo = uColor;
#ifdef USE_COLOR
  albedo *= vColor;
#endif
#ifdef SWAY
  albedo *= mix(0.74, 1.2, vH);
#endif
#ifdef FLAT
  vec3 N = normalize(cross(dFdx(vWorld), dFdy(vWorld)));
#else
  vec3 N = normalize(vNormal);
  if (!gl_FrontFacing) N = -N;
#endif
  float spec = uSpec;
  float shin = uShin;

#ifdef SEABED
  // \u6C99\u7EB9\uFF1A\u5782\u76F4\u4E8E\u6C34\u6D41\u7684\u7EC6\u7EB9\uFF0C\u8FDC\u5904\u6DE1\u51FA
  float camD = length(vWorld - cameraPosition);
  float rfade = 1.0 - smoothstep(26.0, 60.0, camD);
  vec2 rd = uRippleDir;
  float warp = vnoise(vWorld.xz * 0.35) * 3.0;
  float rp = sin(dot(vWorld.xz, rd) * 7.5 + warp * 2.0);
  float flatness = smoothstep(0.82, 0.97, N.y);
  vec2 perp = vec2(rd.x, rd.y);
  N = normalize(N + vec3(perp.x, 0.0, perp.y) * rp * 0.22 * rfade * flatness * vRipple);
  float speck = hash12(floor(vWorld.xz * 6.0));
  albedo *= 0.94 + speck * 0.1;
  albedo *= 0.9 + 0.2 * vnoise(vWorld.xz * 0.18);
#endif

#ifdef WOOD
  {
    // \u6728\u677F\uFF1A\u6CBF\u5C40\u90E8 x \u4E00\u6761\u6761\u94FA\u5F00\uFF0C\u677F\u7F1D\u3001\u9519\u5F00\u7684\u63A5\u5934\u3001\u6728\u7EB9\u548C\u9489\u773C\u3002
    // \u677F\u7A84\u5230\u4E24\u4E09\u4E2A\u50CF\u7D20\u65F6\u7F1D\u6DE1\u4E0B\u53BB\uFF0C\u8FDC\u770B\u662F\u4E00\u7247\u6728\u8272\uFF0C\u4E0D\u95EA
    float u = vLocal.z / uWood.x;
    float row = floor(u);
    float fu = fract(u);
    float off = hash12(vec2(row, 3.7)) * uWood.y;
    float v = (vLocal.x + off) / uWood.y;
    float seg = floor(v);
    float fv = fract(v);
    float fwU = fwidth(u);
    float fwV = fwidth(v);
    float vis = 1.0 - smoothstep(0.2, 0.38, fwU);
    float seamU = 1.0 - smoothstep(0.0, max(fwU * 1.1, 0.035), min(fu, 1.0 - fu));
    float seamV = 1.0 - smoothstep(0.0, max(fwV * 1.1, 0.004), min(fv, 1.0 - fv));
    float tone = hash12(vec2(row, seg) + 0.5);
    float gr = vnoise(vec2(vLocal.x * 2.4 + tone * 9.0, u * 5.0));
    float streak = vnoise(vec2(vLocal.x * 0.6 + row * 1.7, u * 1.5));
    albedo *= 0.9 + tone * 0.15 + ((gr - 0.5) * 0.16 * uWood.w + (streak - 0.5) * 0.1) * mix(0.4, 1.0, vis);
    albedo *= 1.0 - max(seamU, seamV * 0.85) * 0.45 * vis * uWood.z;
    // \u9489\u773C\uFF1A\u6BCF\u5757\u677F\u4E24\u5934\u5404\u4E00\u5BF9
    vec2 nl = vec2(min(fv, 1.0 - fv) * uWood.y - 0.06, abs(abs(fu - 0.5) - 0.25) * uWood.x);
    float nd = length(nl);
    float fwN = fwidth(vLocal.x) * 1.2;
    albedo *= 1.0 - (1.0 - smoothstep(0.012, 0.012 + max(fwN, 0.006), nd)) * 0.4 * (1.0 - smoothstep(0.12, 0.25, fwU));
  }
#endif

#ifdef MOSS
  {
    // \u6C34\u4E0B\u7684\u6728\u5934\u548C\u77F3\u5934\uFF1A\u671D\u4E0A\u7684\u9762\u957F\u4E00\u5C42\u6591\u9A73\u7684\u85FB\uFF0C\u96F6\u661F\u51E0\u70B9\u767D\u8272\u7684\u85E4\u58F6
    float up = clamp(N.y, 0.0, 1.0);
    float m = vnoise(vWorld.xz * 1.3 + vWorld.y * 0.8) * 0.62 + vnoise(vWorld.xz * 4.1 - vWorld.y * 1.9) * 0.38;
    float k = smoothstep(0.42, 0.7, m * (0.45 + up * 0.85)) * uMoss.w;
    albedo = mix(albedo, uMoss.rgb * (0.8 + m * 0.4), k);
    vec2 bc = vWorld.xz * 9.0 + vec2(vWorld.y * 5.0);
    float bk = step(0.94, hash12(floor(bc))) * (1.0 - smoothstep(0.25, 0.5, fwidth(bc.x)));
    albedo = mix(albedo, vec3(0.8, 0.78, 0.7), bk * 0.55 * uMoss.w * (1.0 - k * 0.6));
  }
#endif

#ifdef MUD
  float mf = vnoise3(vLocal * uMudScale + uMudSeed) * 0.65 + vnoise3(vLocal * uMudScale * 2.7 + uMudSeed * 1.7) * 0.35;
  float thresh = 1.08 - uMud * 1.25;
  thresh += dot(normalize(vLocal + vec3(0.0001)), uWashDir) * uWashBias;
  float cover = smoothstep(thresh - 0.05, thresh + 0.05, mf);
  float grain = vnoise3(vLocal * 22.0 + uMudSeed);
  vec3 mudc = uMudCol * (0.78 + grain * 0.4);
  float crustM = step(0.78, vnoise3(vLocal * 15.0 + uMudSeed * 3.1)) * uCrust * smoothstep(0.15, 0.6, uMud);
  mudc = mix(mudc, vec3(0.62, 0.6, 0.52), crustM);
  float wetEdge = smoothstep(thresh + 0.02, thresh + 0.10, mf) - smoothstep(thresh + 0.10, thresh + 0.2, mf);
  albedo = mix(albedo, mudc, cover);
  albedo *= 1.0 - wetEdge * 0.25 * uMud;
  spec = mix(spec, 0.35, cover * 0.6);
  shin = mix(shin, 18.0, cover);
#endif

  float sh = shadowAt(vWorld, N);
  // \u6DF1\u6C34\u91CC\u9634\u5F71\u88AB\u6563\u5C04\u5149\u51B2\u6DE1
  float under = clamp(-vWorld.y, 0.0, 60.0);
  float shadowFade = exp(-under * 0.05);
  float ndl = dot(N, uSunDir);
  float lit = clamp(ndl, 0.0, 1.0) * mix(1.0, sh, shadowFade);
  float band = lit > 0.5 ? 1.0 : (lit > 0.14 ? 0.62 : (lit > 0.02 ? 0.3 : 0.0));
  vec3 amb = hemiAmb(N);
  vec3 col = albedo * (amb + uSunCol * band);

  vec3 V = normalize(cameraPosition - vWorld);
  if (spec > 0.0) {
    vec3 H = normalize(uSunDir + V);
    float s = pow(max(dot(N, H), 0.0), shin) * lit;
#ifdef CLEAR
    // \u6DF1\u5904\u7684\u94DC\u4EF6\uFF1A\u5728\u6C34\u4E0B\u65F6\u9AD8\u5149\u5E26\u7740\u94DC\u81EA\u5DF1\u7684\u989C\u8272\uFF08\u91D1\u5C5E\u7684\u53CD\u5149\u662F\u6709\u989C\u8272\u7684\uFF09\uFF0C\u5C11\u5403\u6C34\u8272\u4EE5\u540E\u4E0D\u70E7\u6210\u4E00\u6761\u767D\uFF1B\u635E\u4E0A\u8239\u4EE5\u540E\u548C\u522B\u7684\u94DC\u4EF6\u4E00\u6837
    vec3 sc = mix(uSunCol, uSunCol * albedo / max(max(albedo.r, albedo.g), 0.05) * 0.3, smoothstep(0.0, 2.0, -vWorld.y));
#else
    vec3 sc = uSunCol;
#endif
    col += sc * step(0.5, s) * spec;
    col += sc * step(0.2, s) * spec * 0.35;
  }
#ifdef GLINT
  // \u91D1\u5C5E\u5728\u7F51\u53E3\u4E0B\u5076\u5C14\u95EA\u4E00\u4E0B\uFF08\u771F\u5B9E\u7684\u53CD\u5149\uFF0C\u4E0D\u662F\u63D0\u793A\uFF09
  // uGlint \u8D85\u8FC7 1\uFF1A\u9633\u5149\u6B63\u626B\u8FC7\u7684\u90A3\u4E00\u4E0B\uFF0C\u6574\u5757\u91D1\u5C5E\u4EAE\u8D77\u4E00\u7247\u788E\u5149\uFF08\u4E0D\u8D85\u8FC7 1 \u65F6\u548C\u5E73\u5E38\u4E00\u6837\uFF09
  float fl = clamp(uGlint - 1.0, 0.0, 1.0);
  float gl = step(mix(0.985, 0.5, fl), hash12(floor(vLocal.xz * 9.0) + floor(uTime * 2.5))) * min(uGlint, 1.0 + fl * 0.5);
  col += vec3(1.0, 0.95, 0.8) * gl * band;
#endif

  if (vWorld.y < 0.0) {
    float cz = exp(-under * 0.075) * uCaustic;
    vec2 cxz = vWorld.xz + uSunDir.xz * vWorld.y * 0.8;
    float c = caustics(cxz, uTime, fwidth(cxz.x) + fwidth(cxz.y));
    col += albedo * uSunCol * c * cz * clamp(N.y, 0.0, 1.0) * sh * 0.85;
  }
#ifdef DISSOLVE
  col *= 1.0 - rim * 0.35;
  col += rim * vec3(0.05, 0.04, 0.02);
#endif
  col += uEmissive;
#ifdef CLEAR
  // \u5C11\u5403\u4E86\u6C34\u8272\u5C31\u6BD4\u5468\u56F4\u4EAE\u4E00\u622A\uFF1A\u538B\u56DE\u6765\u4E00\u70B9\uFF0C\u94DC\u8272\u4E0D\u88AB\u63CF\u8FB9\u7684\u4EAE\u8FB9\u63A8\u5230\u53D1\u767D
  col *= mix(1.0, 0.74, smoothstep(0.0, 2.0, -vWorld.y));
#endif
#ifdef SEE
  // \u5927\u8F6E\u5ED3\u6D6E\u5230\u79BB\u6D77\u5E95\u4E24\u4E09\u7C73\u65F6\u8EAB\u4E0A\u88AB\u7167\u4EAE\uFF0C\u4F1A\u6BD4\u5E95\u4E0B\u7684\u6D77\u5E95\u8FD8\u4EAE\uFF1A\u5728\u6C34\u4E0B\u538B\u6697\u4E00\u622A\uFF0C\u59CB\u7EC8\u662F\u4E00\u6761\u6697\u5F71
  col *= mix(1.0, 0.6, smoothstep(0.0, 2.0, -vWorld.y));
#endif
  float tr;
  col = waterTint(col, vWorld, tr);
#ifdef ITEM
  gl_FragColor = vec4(col, uItemMark > 0.5 ? 0.0 : uOpacity);
#else
  gl_FragColor = vec4(col, uOpacity);
#endif
}
`,k0=`
${Ii}
${N0}
#ifdef NET
varying vec2 vUv;
#endif
#ifdef DISSOLVE
varying vec3 vLocal;
#endif
void main(){
  vec3 n = normal;
  vec3 lp;
  vec4 wp = transformWorld(position, n, lp);
#ifdef NET
  vUv = uv;
#endif
#ifdef DISSOLVE
  vLocal = lp;
#endif
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`,F0=`
#ifdef NET
varying vec2 vUv;
uniform vec2 uNetGrid;
#endif
#ifdef DISSOLVE
${Ii}
varying vec3 vLocal;
uniform float uDissolve;
uniform float uDissolveSeed;
#endif
void main(){
#ifdef DISSOLVE
  float dn = vnoise3(vLocal * 3.1 + uDissolveSeed) * 0.6 + vnoise3(vLocal * 7.3 + uDissolveSeed) * 0.4;
  if (dn - vLocal.y * 0.3 + 0.5 < uDissolve * 1.62 - 0.1) discard;
#endif
#ifdef NET
  vec2 g = fract(vUv * uNetGrid);
  if (g.x > 0.2 && g.y > 0.2) discard;
#endif
  gl_FragColor = vec4(1.0);
}
`;var V1=new x(...L0).normalize(),ke={uTime:{value:0},uSunDir:{value:V1},uSunCol:{value:new J(1,.86,.68)},uAmbSky:{value:new J(.42,.52,.62)},uAmbGround:{value:new J(.22,.24,.27)},uWaterShallow:{value:new J(...rr.shallow)},uWaterDeep:{value:new J(...rr.deep)},uKView:{value:rr.kView},uKDown:{value:rr.kDown},uFogCol:{value:new J(.78,.78,.76)},uFogNear:{value:140},uFogFar:{value:520},uWobble:{value:1},uCurrent:{value:new Zt(.55,.12)},uCaustic:{value:1},uMotion:{value:0},uShadowMap:{value:null},uShadowMat:{value:new le},uShadowTexel:{value:1/2048},uShadowSpan:{value:46}},B1={uPress:{value:Array.from({length:8},()=>new _e(0,0,0,0))}},fh=new Map;function Nt(i={}){let t={};i.flat&&(t.FLAT=""),i.sway&&(t.SWAY="",t.SWAY_AMP=i.sway.toFixed(3)),i.fish&&(t.FISH=""),i.cloth&&(t.CLOTH=""),i.mud&&(t.MUD=""),i.seabed&&(t.SEABED=""),i.glint&&(t.GLINT=""),i.net&&(t.NET=""),i.dissolve&&(t.DISSOLVE=""),i.wood&&(t.WOOD=""),i.moss&&(t.MOSS=""),i.see&&(t.SEE=i.see.toFixed(3)),i.clear&&(t.CLEAR=i.clear.toFixed(3)),i.item&&(t.ITEM="");let e={...ke,uColor:{value:new J(i.color??16777215)},uSpec:{value:i.spec??0},uShin:{value:i.shin??24},uEmissive:{value:new J(i.emissive??0)},uOpacity:{value:i.opacity??1}};if(i.sway&&Object.assign(e,B1),i.fish&&(e.uFishSpeed={value:0}),i.cloth&&(e.uClothAmp={value:i.cloth}),i.seabed&&(e.uRippleDir={value:new Zt(.92,.4).normalize()}),i.glint&&(e.uGlint={value:0}),i.item&&(e.uItemMark={value:0}),i.net&&(e.uNetGrid={value:new Zt(...i.net)}),i.dissolve&&(e.uDissolve={value:0},e.uDissolveSeed={value:Math.random()*40}),i.wood){let o=i.wood;e.uWood={value:new _e(o.w??.2,o.len??2.6,o.seam??1,o.grain??1)}}if(i.moss){let o=new J(i.moss.color??5926458);e.uMoss={value:new _e(o.r,o.g,o.b,i.moss.amount??1)}}if(i.mud){let o=i.mud;e.uMud={value:o.amount??1},e.uMudInflate={value:o.inflate??.05},e.uMudSeed={value:o.seed??Math.random()*50},e.uMudScale={value:o.scale??4},e.uMudCol={value:new J(o.color??4865580)},e.uCrust={value:o.crust??1},e.uWashDir={value:new x(0,1,0)},e.uWashBias={value:0}}let n=new Ue({uniforms:e,defines:t,vertexShader:H0,fragmentShader:U0,vertexColors:!!i.vertexColors,side:i.side??Qn,transparent:!!i.transparent,depthWrite:i.depthWrite??!0});n.userData.toon=!0;let s=t;return"ITEM"in t&&(s={...t},delete s.ITEM),n.userData.shadowMat=z0(s,e,i.side??Qn),n}function z0(i,t,e){let n=JSON.stringify(i)+"|"+e,s=!("MUD"in i)&&!("CLOTH"in i)&&!("DISSOLVE"in i);if(s&&fh.has(n))return fh.get(n);let o={...ke};for(let a of["uPress","uFishSpeed","uClothAmp","uMud","uMudInflate","uMudSeed","uMudScale","uNetGrid","uDissolve","uDissolveSeed"])t[a]&&(o[a]=t[a]);let r=new Ue({uniforms:o,defines:i,vertexShader:k0,fragmentShader:F0,side:me});return s&&fh.set(n,r),r}function O0(i,t,e){let n=i.clone();n.uniforms={...i.uniforms};for(let s of["uColor","uSpec","uShin","uEmissive","uOpacity","uMud","uMudInflate","uMudSeed","uMudScale","uMudCol","uCrust","uGlint","uDissolve","uDissolveSeed","uWashDir","uWashBias"])i.uniforms[s]&&(n.uniforms[s]={value:i.uniforms[s].value.clone?i.uniforms[s].value.clone():i.uniforms[s].value});return t!==void 0&&n.uniforms.uMud&&(n.uniforms.uMud.value=t),e!==void 0&&n.uniforms.uMudSeed&&(n.uniforms.uMudSeed.value=e),n.userData={...i.userData,toon:!0},n.userData.shadowMat=z0(n.defines,n.uniforms,n.side),n}ce.enabled=!1;var Mc=class{constructor(t){this.renderer=new yc({canvas:t,antialias:!1,powerPreference:"high-performance",preserveDrawingBuffer:!1}),this.renderer.outputColorSpace=gs,this.renderer.setPixelRatio(1),this.renderer.setSize(1920,1080,!1),this.renderer.autoClear=!0,this.renderer.sortObjects=!0,this.lowW=644,this.lowH=364;let e=new jn(this.lowW,this.lowH);e.format=di,e.type=es,e.minFilter=e.magFilter=Ve,this.low=new un(this.lowW,this.lowH,{minFilter:Ve,magFilter:Ve,depthBuffer:!0,stencilBuffer:!0,depthTexture:e,type:En}),this.shadowSize=2048;let n=new jn(this.shadowSize,this.shadowSize);n.type=Un,n.minFilter=n.magFilter=Ve,this.shadowRT=new un(this.shadowSize,this.shadowSize,{depthBuffer:!0,depthTexture:n,minFilter:Ve,magFilter:Ve}),this.shadowSpan=46,this.shadowCam=new Ji(-this.shadowSpan,this.shadowSpan,this.shadowSpan,-this.shadowSpan,1,260),ke.uShadowMap.value=n,ke.uShadowTexel.value=1/this.shadowSize,this._bias=new le().set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),this.offset=new Zt,this.quad=this._makeComposite(),this.renderCam=new nn(35,this.lowW/this.lowH,.5,900),this.snap=!0,this._swap=[]}_makeComposite(){let t=new Ue({uniforms:{tColor:{value:this.low.texture},tDepth:{value:this.low.depthTexture},uLowSize:{value:new Zt(this.lowW,this.lowH)},uPad:{value:2},uOff:{value:this.offset},uNear:{value:.5},uFar:{value:900},uInvVP:{value:new le},uCam:{value:new x},uKView:ke.uKView,uKDown:ke.uKDown,uVignette:{value:.22},uFlash:{value:0},uDim:{value:0},uFocus:{value:new _e(.5,.5,0,.2)},uGrade:{value:0},uTime:ke.uTime,uSunDir:ke.uSunDir,uShafts:{value:1},uMurk:{value:0},uBeam:{value:new _e(0,0,0,0)},uBeamDir:{value:new Zt(1,0)}},vertexShader:`
        varying vec2 vUv;
        void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
      `,fragmentShader:`
        uniform sampler2D tColor; uniform sampler2D tDepth;
        uniform vec2 uLowSize; uniform float uPad; uniform vec2 uOff;
        uniform float uNear; uniform float uFar;
        uniform mat4 uInvVP; uniform vec3 uCam;
        uniform float uKView; uniform float uKDown;
        uniform float uVignette; uniform float uFlash; uniform float uDim; uniform float uGrade; uniform vec4 uFocus;
        uniform float uTime; uniform vec3 uSunDir; uniform float uShafts; uniform float uMurk;
        uniform vec4 uBeam; uniform vec2 uBeamDir;
        varying vec2 vUv;
        float h12(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
        float vn(vec2 p){
          vec2 i = floor(p); vec2 f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
          return mix(mix(h12(i), h12(i + vec2(1.0, 0.0)), u.x), mix(h12(i + vec2(0.0, 1.0)), h12(i + vec2(1.0, 1.0)), u.x), u.y);
        }
        // \u6C34\u4E0B\u7684\u5149\u67F1\uFF1A\u987A\u7740\u89C6\u7EBF\u5728\u6C34\u91CC\u8D70\u8FC7\u7684\u4E00\u6BB5\u53D6\u51E0\u4E2A\u70B9\uFF0C\u6BCF\u70B9\u6CBF\u6298\u5C04\u540E\u7684\u9633\u5149\u65B9\u5411\u8FFD\u56DE\u6C34\u9762\uFF0C
        // \u6C34\u9762\u90A3\u91CC\u4EAE\u7684\u5730\u65B9\u5F80\u4E0B\u5C31\u662F\u4E00\u9053\u5149\u3002\u8D8A\u6DF1\u8D8A\u6DE1\uFF0C\u79BB\u773C\u775B\u8D8A\u8FDC\u8D8A\u88AB\u6C34\u5403\u6389
        float shaftAt(vec3 Q, vec3 Ld){
          vec2 s = Q.xz + Ld.xz * (-Q.y / Ld.y);
          float big = vn(s * 0.15 + vec2(uTime * 0.035, uTime * 0.021));
          float fine = vn(s * 0.5 - vec2(uTime * 0.09, -uTime * 0.05));
          return smoothstep(0.46, 0.8, big) * (0.45 + 0.55 * fine);
        }
        // \u626B\u5149\uFF1A\u6C34\u9762\u4E0A\u4E00\u6761\u5BBD\u5149\u5E26\uFF08\u6309\u5149\u7EBF\u8FDB\u6C34\u7684\u90A3\u4E00\u70B9\u7B97\uFF09\uFF0C\u6A2A\u7740\u4ECE\u8239\u5C3E\u8D70\u5230\u8239\u5934
        float beamAt(vec2 s){
          vec2 r = s - uBeam.xy;
          float u = dot(r, uBeamDir) - uBeam.z;
          float v = dot(r, vec2(-uBeamDir.y, uBeamDir.x));
          return exp(-u * u / 7.0) * smoothstep(11.0, 4.0, abs(v));
        }
        float lin(float d){ return uNear * uFar / (uFar - d * (uFar - uNear)); }
        float bayer4(vec2 p){
          vec2 q = mod(floor(p), 4.0);
          float i = q.x + q.y * 4.0;
          // 4x4 Bayer \u8868
          float m[16];
          m[0]=0.0; m[1]=8.0; m[2]=2.0; m[3]=10.0; m[4]=12.0; m[5]=4.0; m[6]=14.0; m[7]=6.0;
          m[8]=3.0; m[9]=11.0; m[10]=1.0; m[11]=9.0; m[12]=15.0; m[13]=7.0; m[14]=13.0; m[15]=5.0;
          for (int k = 0; k < 16; k++) if (float(k) == i) return m[k] / 16.0;
          return 0.0;
        }
        vec3 worldAt(vec2 uv, float d){
          vec4 p = uInvVP * vec4(uv * 2.0 - 1.0, d * 2.0 - 1.0, 1.0);
          return p.xyz / p.w;
        }
        void main(){
          vec2 inner = uLowSize - 2.0 * uPad;
          vec2 lp = vUv * inner + uPad + uOff;
          vec2 texel = floor(lp) + 0.5;
          vec2 px = 1.0 / uLowSize;
          vec2 uv = texel * px;
          vec4 c0 = texture2D(tColor, uv);
          vec3 col = c0.rgb;
          float d = texture2D(tDepth, uv).r;
          float zc = lin(d);
          float zl = lin(texture2D(tDepth, uv - vec2(px.x, 0.0)).r);
          float zr = lin(texture2D(tDepth, uv + vec2(px.x, 0.0)).r);
          float zu = lin(texture2D(tDepth, uv + vec2(0.0, px.y)).r);
          float zd = lin(texture2D(tDepth, uv - vec2(0.0, px.y)).r);
          float th = max(0.12, zc * 0.045);
          float vis = 1.0;
          if (d < 0.99999) {
            vec3 P = worldAt(uv, d);
            if (P.y < 0.0) {
              float depth = -P.y;
              float frac = uCam.y > 0.0 ? depth / max(uCam.y - P.y, 0.001) : 1.0;
              float path = length(P - uCam) * frac;
              vis = exp(-(path * uKView + depth * uKDown) * 1.15);
              // \u6C34\u4E0B\u7684\u7EC6\u788E\u4E1C\u897F\uFF08\u8349\u53F6\u3001\u788E\u58F3\uFF09\u4E0D\u63CF\u8FB9\uFF1A\u53EA\u7ED9\u5927\u8F6E\u5ED3\u63CF\uFF0C\u6D77\u5E95\u4E0D\u8D77\u9ED1\u6E23
              th *= 1.0 + 0.7 * smoothstep(0.5, 3.0, depth);
            }
          }
          float edge = 0.0;
          edge += step(th, zl - zc); edge += step(th, zr - zc);
          edge += step(th, zu - zc); edge += step(th, zd - zc);
          edge = min(edge, 1.0);
          col = mix(col, col * 0.5, edge * vis);
          // \u80FD\u635E\u7684\u4E1C\u897F\uFF08\u6D77\u5E95\u7684\u6563\u8D27\u3001\u5728\u5916\u9762\u7684\u87F9\uFF0Calpha \u8BB0\u6210 0\uFF09\uFF1A\u5916\u9762\u4E00\u5708\u6697\u8FB9\u3001\u8D34\u8FB9\u4E00\u5708\u4EAE\u8FB9\uFF0C\u5C0F\u4EF6\u5728\u4EAE\u6C99\u4E0A\u3001\u6DF1\u6C34\u91CC\u90FD\u548C\u80CC\u666F\u5206\u5F97\u5F00\u3002
          // \u8DDF\u7740\u6C34\u7684\u80FD\u89C1\u5EA6\u6DE1\u51FA\uFF0C\u548C\u300C\u770B\u5F97\u89C1\u300D\u7684\u5224\u65AD\uFF08sight.js \u91CC 0.085\uFF09\u5BF9\u9F50\uFF1A\u5224\u65AD\u8BF4\u770B\u5F97\u89C1\u7684\uFF0C\u753B\u9762\u4E0A\u8BA4\u5F97\u51FA\uFF1B\u8BF4\u770B\u4E0D\u89C1\u7684\uFF0C\u8F6E\u5ED3\u4E5F\u6CA1\u4E86
          {
            float mc = step(c0.a, 0.5);
            float ml = step(texture2D(tColor, uv - vec2(px.x, 0.0)).a, 0.5);
            float mr = step(texture2D(tColor, uv + vec2(px.x, 0.0)).a, 0.5);
            float mu = step(texture2D(tColor, uv + vec2(0.0, px.y)).a, 0.5);
            float md = step(texture2D(tColor, uv - vec2(0.0, px.y)).a, 0.5);
            // \u6697\u8FB9\u53EA\u753B\u5728\u4E1C\u897F\u540E\u9762\u7684\u80CC\u666F\u4E0A\uFF0C\u6321\u5728\u5B83\u524D\u9762\u7684\u4E0D\u753B
            float ring = max(max(ml * step(zl - 0.3, zc), mr * step(zr - 0.3, zc)), max(mu * step(zu - 0.3, zc), md * step(zd - 0.3, zc))) * (1.0 - mc);
            float rim = mc * (1.0 - min(min(ml, mr), min(mu, md)));
            float sv = smoothstep(0.06, 0.1, vis);
            col = mix(col, col * 0.32, ring * sv * 0.9);
            col = mix(col, col * 1.3 + vec3(0.035, 0.04, 0.035), rim * sv * 0.75);
          }
          // \u5927\u8F6E\u5ED3\u7ECF\u8FC7\u6700\u8FD1\u90A3\u51E0\u79D2\uFF1A\u6C34\u4E0B\u7684\u989C\u8272\u5F80\u6697\u84DD\u538B\u4E00\u70B9\uFF08\u8D8A\u6DF1\u538B\u5F97\u8D8A\u591A\uFF0C\u8239\u548C\u6C34\u9762\u4E0D\u52A8\uFF09
          if (uMurk > 0.0 && uCam.y > 0.0) {
            vec3 Pm = d < 0.99999 ? worldAt(uv, d) : worldAt(uv, 0.99999);
            col *= mix(vec3(1.0), vec3(0.6, 0.68, 0.8), uMurk * smoothstep(0.3, 5.0, -Pm.y));
          }
          // \u5149\u67F1
          if (uShafts > 0.0 && uCam.y > 0.0) {
            vec3 P = d < 0.99999 ? worldAt(uv, d) : worldAt(uv, 0.99999);
            if (P.y < 0.0) {
              vec3 rd = P - uCam;
              float tS = uCam.y / max(-rd.y, 1e-4);
              vec3 S = uCam + rd * tS;
              float L = length(P - S);
              vec3 Ld = normalize(vec3(uSunDir.x * 0.7, uSunDir.y, uSunDir.z * 0.7));
              float acc = 0.0;
              float j = bayer4(texel + 2.0);
              for (int i = 0; i < 7; i++) {
                float f = (float(i) + j) / 7.0;
                vec3 Q = mix(S, P, f * f);
                float dl = L * f * f;
                float sh = shaftAt(Q, Ld);
                if (uBeam.w > 0.0) sh += uBeam.w * 1.6 * beamAt(Q.xz + Ld.xz * (-Q.y / Ld.y));
                acc += sh * exp(-(-Q.y) * 0.05 - dl * 0.045) * (0.6 + 0.4 * f);
              }
              acc = acc / 7.0 * min(1.0, L / 14.0);
              col += vec3(0.45, 0.72, 0.74) * acc * 0.6 * uShafts;
              // \u626B\u5149\u843D\u5728\u4E1C\u897F\u4E0A\uFF1A\u8239\u8EAB\u3001\u6D77\u5E95\u88AB\u7167\u4EAE\u4E00\u6761\uFF0C\u968F\u5149\u5E26\u8D70\u8FC7\u53BB
              if (uBeam.w > 0.0) col += vec3(0.62, 0.86, 0.8) * uBeam.w * 0.55 * beamAt(P.xz + Ld.xz * (-P.y / Ld.y)) * exp(-L * 0.035) * smoothstep(0.2, 2.0, -P.y);
            }
          }
          // \u8C03\u8272\uFF1A\u8F7B\u5FAE\u538B\u6697\u8FB9\u7F18
          vec2 c = vUv - 0.5;
          float vg = 1.0 - dot(c, c) * uVignette * 2.2;
          col *= vg;
          float dimK = uDim;
          if (uFocus.z > 0.0) dimK *= smoothstep(uFocus.z, uFocus.z + uFocus.w, length((vUv - uFocus.xy) * vec2(1.7778, 1.0)));
          col = mix(col, col * vec3(0.55, 0.62, 0.78), dimK);
          col += uFlash * vec3(1.0, 0.92, 0.75);
          // \u91CF\u5316 + \u6296\u52A8\uFF0C\u7ED9\u6E10\u53D8\u4E00\u70B9\u50CF\u7D20\u9897\u7C92\u3002\u6863\u4F4D\u7EC6\u4E00\u4E9B\uFF1A\u6697\u5904\u7684\u6C34\u4E0D\u518D\u662F\u4E00\u7247"+"\u5B57\u82B1
          float L = 60.0;
          float b = bayer4(texel) - 0.5;
          col = floor(col * L + 0.5 + b * 0.62) / L;
          gl_FragColor = vec4(col, 1.0);
        }
      `,depthTest:!1,depthWrite:!1}),e=new oe;e.setAttribute("position",new qt([-1,-1,0,3,-1,0,-1,3,0],3)),e.setAttribute("uv",new qt([0,0,2,0,0,2],2));let n=new ut(e,t);n.frustumCulled=!1;let s=new xs;s.add(n);let o=new Ji(-1,1,1,-1,0,1);return{mat:t,scene:s,cam:o}}get compositeUniforms(){return this.quad.mat.uniforms}setCamera(t,e){let n=this.renderCam,s=this.lowH/360,o=Math.tan(_s.degToRad(t.fov/2))*s;if(n.fov=_s.radToDeg(Math.atan(o))*2,n.aspect=this.lowW/this.lowH,n.near=t.near,n.far=t.far,n.position.copy(t.position),n.quaternion.copy(t.quaternion),n.updateProjectionMatrix(),this.offset.set(0,0),this.snap){let a=2*e*Math.tan(_s.degToRad(t.fov/2))/360,l=new x(1,0,0).applyQuaternion(n.quaternion),c=new x(0,1,0).applyQuaternion(n.quaternion),h=n.position.dot(l),d=n.position.dot(c),u=Math.round(h/a)*a,m=Math.round(d/a)*a;n.position.addScaledVector(l,u-h).addScaledVector(c,m-d),this.offset.set((h-u)/a,(d-m)/a)}n.updateMatrixWorld(!0);let r=this.quad.mat.uniforms;r.uNear.value=n.near,r.uFar.value=n.far,r.uCam.value.copy(n.position),r.uInvVP.value.multiplyMatrices(n.projectionMatrix,n.matrixWorldInverse).invert()}updateShadow(t,e=30){let n=this.shadowCam,s=ke.uSunDir.value,o=Math.min(46,Math.max(5,Math.round(e*1.35*2)/2));o!==this.shadowSpan&&(this.shadowSpan=o,n.left=n.bottom=-o,n.right=n.top=o),ke.uShadowSpan.value=o;let r=this.shadowSpan*2/this.shadowSize;n.position.set(0,0,0),n.up.set(0,1,0),n.lookAt(-s.x,-s.y,-s.z),n.updateMatrixWorld(!0);let a=n.matrixWorldInverse,l=t.clone().applyMatrix4(a);l.x=Math.round(l.x/r)*r,l.y=Math.round(l.y/r)*r;let c=l.applyMatrix4(n.matrixWorld);n.position.copy(c).addScaledVector(s,120),n.updateMatrixWorld(!0),n.updateProjectionMatrix(),ke.uShadowMat.value.multiplyMatrices(this._bias,n.projectionMatrix).multiply(n.matrixWorldInverse)}renderShadow(t){let e=this.renderer,n=this._swap;n.length=0,t.traverseVisible(o=>{!o.isMesh&&!o.isPoints&&!o.isLine||(o.castShadow&&o.material&&o.material.userData&&o.material.userData.shadowMat?(n.push(o,o.material),o.material=o.material.userData.shadowMat):(n.push(o,null),o.visible=!1))});let s=t.background;t.background=null,e.setRenderTarget(this.shadowRT),e.setClearColor(16777215,1),e.clear(!0,!0,!1),ke.uShadowMap.value=null,e.render(t,this.shadowCam),ke.uShadowMap.value=this.shadowRT.depthTexture;for(let o=0;o<n.length;o+=2){let r=n[o];n[o+1]?r.material=n[o+1]:r.visible=!0}t.background=s}_keepAlpha(t){let e=n=>{let s=n.userData.keepAlpha;if(!n.transparent){s!==void 0&&(n.blending=s,delete n.userData.keepAlpha);return}if(s!==void 0||n.blending!==ji&&n.blending!==Ai)return;n.userData.keepAlpha=n.blending;let o=n.blending===Ai;n.blending=wa,n.blendEquation=n.blendEquationAlpha=Ci,n.blendSrc=Zo,n.blendDst=o?io:so,n.blendSrcAlpha=n.userData.coverItems?io:ba,n.blendDstAlpha=n.userData.coverItems?so:io};t.traverse(n=>{let s=n.material;s&&(Array.isArray(s)?s.forEach(e):e(s))})}render(t){this._keepAlpha(t);let e=this.renderer;e.setRenderTarget(this.low),e.setClearColor(0,1),e.clear(!0,!0,!0),e.render(t,this.renderCam),e.setRenderTarget(null),e.render(this.quad.scene,this.quad.cam)}};function Ce(i){let t=i>>>0;return function(){t=t+1831565813>>>0;let e=t;return e=Math.imul(e^e>>>15,e|1),e^=e+Math.imul(e^e>>>7,e|61),((e^e>>>14)>>>0)/4294967296}}function Ec(i,t,e=0){let n=Math.imul(i|0,374761393)+Math.imul(t|0,668265263)+Math.imul(e|0,1442695041);return n=Math.imul(n^n>>>13,1274126177),n^=n>>>16,(n>>>0)/4294967296}var V0=i=>i*i*(3-2*i);function ss(i,t,e=0){let n=Math.floor(i),s=Math.floor(t),o=i-n,r=t-s,a=Ec(n,s,e),l=Ec(n+1,s,e),c=Ec(n,s+1,e),h=Ec(n+1,s+1,e),d=V0(o),u=V0(r);return(a+(l-a)*d)*(1-u)+(c+(h-c)*d)*u}function mi(i,t,e=4,n=0){let s=0,o=.5,r=1,a=0;for(let l=0;l<e;l++)s+=o*(ss(i*r,t*r,n+l*17)*2-1),a+=o,o*=.5,r*=2.03;return s/a}var ge=(i,t,e)=>i<t?t:i>e?e:i,cr=(i,t,e)=>i+(t-i)*e,Vt=(i,t,e)=>{let n=ge((e-i)/(t-i),0,1);return n*n*(3-2*n)};var lr=i=>1-Math.pow(1-i,3);var hr=i=>1+2.70158*Math.pow(i-1,3)+1.70158*Math.pow(i-1,2),vn=(i,t,e,n)=>cr(i,t,1-Math.exp(-e*n));function uo(i,t,e,n){let s=wc(t-i);return i+s*(1-Math.exp(-e*n))}function wc(i){for(;i>Math.PI;)i-=Math.PI*2;for(;i<-Math.PI;)i+=Math.PI*2;return i}function mh(i,t,e,n,s,o){let r=s-e,a=o-n,l=i-e,c=t-n,h=ge((l*r+c*a)/(r*r+a*a||1),0,1),d=i-(e+r*h),u=t-(n+a*h);return Math.sqrt(d*d+u*u)}var bc=[];for(let i=-214;i<=-118;i+=24)bc.push({x:i,z:-48.5,color:"red"}),bc.push({x:i+8,z:-31.5,color:"green"});var Sc={x:-82,z:-30},ws={x:-91,z:-38.5},gh=[{x:-86.5,z:-33.5},{x:-76,z:-31}];var xh=[[-93.5,-36],[-87,-31.4],[-80.8,-26.6],[-76,-24]],yh=[[-70,-19],[-61,-13],[-52,-8]];var cn={ax:-50,az:-54,bx:-43,bz:30,gapA:-11.5,gapB:-.5},ii={x:-114,z:-37,rx:16,rz:11},ie={x:2,z:8,yaw:1.897,heel:.8,pitch:.13,length:22,beam:7.2};function Tc(i){return 36.5+.14*i+3*Math.sin(i*.05)}var Li={tube:{name:"\u9EC4\u94DC\u4FE1\u7B52",value:140,r:.42,look:"metal-tube",desc:"\u7B52\u76D6\u5C01\u8721\u5B8C\u597D\uFF0C\u7B52\u8EAB\u523B\u7740\u5546\u53F7\u7684\u5E06\u8239\u5FBD\u8BB0"},pulley:{name:"\u94DC\u6ED1\u8F6E",value:45,r:.22,look:"part",desc:"\u7EF3\u69FD\u78E8\u5F97\u53D1\u4EAE\uFF0C\u8FD8\u80FD\u8F6C"},hinge:{name:"\u8231\u95E8\u94DC\u94F0\u94FE",value:28,r:.18,look:"part",desc:"\u548C\u4FE1\u7B52\u4E00\u6837\u7684\u5E06\u8239\u538B\u82B1"},anchor:{name:"\u719F\u94C1\u951A",value:220,r:.95,look:"anchor",heavy:!0,desc:"\u951A\u6746\u4E0A\u8FD8\u5957\u7740\u534A\u622A\u65AD\u7F06"},jar:{name:"\u53CC\u8033\u9676\u7F50",value:85,r:.34,look:"jar",desc:"\u8F6F\u6728\u585E\u8FD8\u5C01\u7740\uFF0C\u91CC\u9762\u6643\u7740\u6CB9"},jar2:{name:"\u53CC\u8033\u9676\u7F50",value:85,r:.34,look:"jar",desc:"\u80A9\u4E0A\u6709\u7A91\u53E3\u7684\u6307\u5370"},copperset:{name:"\u4E00\u645E\u94DC\u9505",value:165,r:.42,look:"metal-round",desc:"\u4E94\u53E3\u94DC\u9505\u5957\u5728\u4E00\u8D77\uFF0C\u9EBB\u7EF3\u8FD8\u6346\u7740"},rope:{name:"\u65E7\u7F06\u7EF3\u5377",value:12,r:.36,look:"rope",desc:"\u6CE1\u8F6F\u4E86\uFF0C\u8FD8\u80FD\u5F53\u6750\u6599"},barrel:{name:"\u7B8D\u6876",value:60,r:.42,look:"barrel",desc:"\u94C1\u7B8D\u9508\u4E86\uFF0C\u6876\u8EAB\u8FD8\u4E25\u5B9E"},sack:{name:"\u5C01\u94C5\u8D27\u888B",value:95,r:.36,look:"sack",desc:"\u888B\u53E3\u94C5\u5C01\u538B\u7740\u5546\u53F7\u5370"},chest:{name:"\u94F6\u5E01\u5323",value:1800,r:.36,look:"box-iron",precious:!0,heavy:!0,desc:"\u94C1\u7B8D\u5C0F\u5323\u91CC\uFF0C\u4E00\u6574\u5323\u94F6\u5E01"},seal:{name:"\u5546\u53F7\u94DC\u5370",value:260,r:.2,look:"small-hard",desc:"\u5370\u9762\u523B\u7740\u5E06\u8239\u548C\u4E24\u4E2A\u5B57\u6BCD"},crab:{name:"\u77F3\u87F9",value:30,r:.24,look:"crab",alive:!0,desc:"\u653E\u8FDB\u6C34\u69FD\uFF0C\u56DE\u6E2F\u518D\u8BF4"},tube2:{name:"\u9EC4\u94DC\u4FE1\u7B52",value:150,r:.42,look:"metal-edge",desc:"\u548C\u6D45\u6EE9\u90A3\u53EA\u540C\u6B3E\uFF0C\u7B52\u91CC\u5377\u7740\u4FE1"},lantern:{name:"\u8239\u5C3E\u94DC\u706F",value:340,r:.4,look:"lantern",desc:"\u56DB\u9762\u73BB\u7483\u788E\u4E86\u4E09\u9762\uFF0C\u706F\u5EA7\u8FD8\u523B\u7740\u5E74\u4EFD"},plank:{name:"\u8239\u677F\u6B8B\u7247",value:5,r:.95,look:"plank",desc:"\u6A61\u6728\uFF0C\u9489\u5B54\u4E00\u6392"},stave:{name:"\u6876\u677F",value:3,r:.45,look:"plank",desc:"\u4ECE\u4E00\u53EA\u7B8D\u6876\u4E0A\u6563\u4E0B\u6765\u7684"},ropebit:{name:"\u65AD\u7F06\u5934",value:4,r:.4,look:"rope",desc:"\u65AD\u53E3\u6BDB\u7CD9\uFF0C\u662F\u5D29\u65AD\u7684"},shards:{name:"\u788E\u9676\u7247",value:2,r:.4,look:"shards",desc:"\u548C\u8239\u4E0A\u7684\u9676\u7F50\u4E00\u4E2A\u989C\u8272"}},B0=[{id:"tube",kind:"tube",x:-80.6,z:-27.3,rot:.55,tilt:.22,bury:.42},{id:"pulley",kind:"pulley",x:-79.7,z:-26.6,rot:1.2,bury:.12},{id:"hinge",kind:"hinge",x:-81.35,z:-27.9,rot:2.2,bury:.1},{id:"anchor",kind:"anchor",x:-74.6,z:-22.9,rot:-.62,bury:.18},{id:"tube2",kind:"tube2",x:11.6,z:23.4,rot:3.1,tilt:.12,bury:.2,grip:.42,moundAt:-.5,mud:.24,clear:.2},{id:"lantern",kind:"lantern",x:8.2,z:29.6,rot:.8,tilt:.5,bury:.2}];var W1=Math.cos(ie.yaw),X1=-Math.sin(ie.yaw),q1=Math.sin(ie.yaw),Y1=Math.cos(ie.yaw);function fo(i,t){return{x:ie.x+W1*i+q1*t,z:ie.z+X1*i+Y1*t}}var G0=[{id:"jar",kind:"jar",along:3,side:7.7,rot:.4,tilt:1.35,bury:.15},{id:"jar2",kind:"jar2",along:3.95,side:8.35,rot:2.1,tilt:1.5,bury:.12},{id:"rope",kind:"rope",along:2.35,side:8.05,rot:0,bury:.05},{id:"copperset",kind:"copperset",along:-2.55,side:7.55,rot:1,tilt:.25,bury:.2},{id:"barrel",kind:"barrel",along:-3.75,side:8.45,rot:.3,tilt:1.57,bury:.15}];var Rc={along:1.05,side:6.55,rot:.35};var W0={shoal:["tube","pulley","hinge"],anchor:["anchor"],hold:["chest","sack"],jars:["jar","jar2","rope"],pots:["copperset","barrel"],dig:["seal"],slope:["tube2"],trench:["lantern"]};var Z1=Math.cos(ie.yaw),$1=-Math.sin(ie.yaw),K1=Math.sin(ie.yaw),J1=Math.cos(ie.yaw);function Ac(i,t,e){let n=1e9,s=0,o=0,r=0;for(let a=0;a<e.length-1;a++){let[l,c]=e[a],[h,d]=e[a+1],u=mh(i,t,l,c,h,d),m=Math.hypot(h-l,d-c);if(u<n){n=u;let g=ge(((i-l)*(h-l)+(t-c)*(d-c))/(m*m),0,1);o=r+g*m}r+=m}return s=o/r,{d:n,t:s}}function X0(i,t){let e=cn,n=mh(i,t,e.ax,e.az,e.bx,e.bz);if(n>9)return 0;let s=(1-Vt(1.5,8.5,n+mi(i*.15,t*.15,3,9)*3))*3.2;s*=.75+.5*ss(t*.12,i*.1,5);let o=Vt(e.gapA-3,e.gapA,t)*(1-Vt(e.gapB,e.gapB+3,t));return s*=1-o*.92,s}function Be(i,t){let e=10;e+=mi(i*.018,t*.018,3,3)*1.4,e+=Math.max(0,t+10)*.15-Math.max(0,t-20)*.05;let n=i-Sc.x,s=(t-Sc.z)*1.15;e-=6.1*Math.exp(-(n*n+s*s)/450);let o=Tc(i),r=Math.abs(t-o),a=Vt(-95,-40,i),l=1-Vt(3,21,r+mi(i*.08,t*.08,2,4)*2.5);e+=14*l*l*(3-2*l)*a,e+=Vt(40,130,i)*6,e+=Vt(-200,-250,i)*10+Vt(100,140,i)*10+Vt(-90,-125,t)*3+Vt(85,115,t)*12,e-=X0(i,t);let c=Ac(i,t,xh);if(c.d<1.4){let d=Vt(0,.25,c.t);e+=(1-Vt(.1,.42,c.d))*.26*d,e-=Vt(.3,.55,c.d)*(1-Vt(.55,1.3,c.d))*.09*d}let h=Ac(i,t,yh);h.d<2.2&&(e+=(1-Vt(.2,1.6,h.d))*.16*(1-h.t));{let d=i-ie.x,u=t-ie.z,m=d*Z1+u*$1,g=d*K1+u*J1,y=ge(m,-10.5,10.5),p=m-y,f=g-2.6,v=Math.sqrt(p*p+f*f);e-=(1-Vt(.5,5.2,v))*1.25;let S=g+3.4,_=Math.sqrt(p*p+S*S*1.5);e+=(1-Vt(.5,3.5,_))*.35}return e+=mi(i*.21,t*.21,2,11)*.18,-e}var Ni={sandShallow:[.9,.82,.62],sand:[.76,.71,.58],silt:[.56,.54,.47],mud:[.47,.43,.36],weed:[.52,.55,.38],rock:[.5,.52,.5],deep:[.38,.4,.4],groove:[.58,.52,.42]},os=(i,t,e)=>[i[0]+(t[0]-i[0])*e,i[1]+(t[1]-i[1])*e,i[2]+(t[2]-i[2])*e];function j1(i,t,e){let n=-e,s=os(Ni.sandShallow,Ni.sand,Vt(4,11,n)),o=1,r=Vt(13,22,n);s=os(s,Ni.silt,r),o*=1-r*.6;let a=(i-ii.x)/ii.rx,l=(t-ii.z)/ii.rz,c=1-Vt(.6,1.3,Math.sqrt(a*a+l*l)+mi(i*.1,t*.1,2,2)*.4);s=os(s,Ni.weed,c*.8),o*=1-c*.7;let h=X0(i,t),d=Vt(.7,1.8,h);s=os(s,Ni.rock,d),o*=1-d;let u=i-ie.x,m=t-ie.z,g=Math.hypot(u*.9,m*.75),y=(1-Vt(9,22,g+mi(i*.12,t*.12,2,7)*5))*.85;s=os(s,Ni.mud,y),o*=1-y*.6;let p=Math.abs(t-Tc(i)),f=(1-Vt(6,14,p))*Vt(-80,-40,i);s=os(s,Ni.deep,f);let v=Ac(i,t,xh);v.d<.6&&(s=os(s,Ni.groove,(1-Vt(.15,.6,v.d))*.8));let S=Ac(i,t,yh);S.d<1.8&&(s=os(s,Ni.groove,(1-Vt(.3,1.8,S.d))*.45*(1-S.t)));let _=ss(i*.5,t*.5,31);return s=s.map(b=>b*(.94+_*.1)),[s[0],s[1],s[2],o]}function q0(i,t,e=.35){let n=Be(i+e,t)-Be(i-e,t),s=Be(i,t+e)-Be(i,t-e);return new x(-n,2*e,-s).normalize()}var Q1={x0:-250,x1:140,z0:-125,z1:115};function Y0(){let i=Q1,t=1,e=Math.round((i.x1-i.x0)/t)+1,n=Math.round((i.z1-i.z0)/t)+1,s=new Float32Array(e*n*3),o=new Float32Array(e*n*3),r=new Float32Array(e*n),a=new Float32Array(e*n);for(let m=0;m<n;m++)for(let g=0;g<e;g++){let y=i.x0+g*t,p=i.z0+m*t,f=Be(y,p),v=m*e+g;a[v]=f,s[v*3]=y,s[v*3+1]=f,s[v*3+2]=p;let S=j1(y,p,f);o[v*3]=S[0],o[v*3+1]=S[1],o[v*3+2]=S[2],r[v]=S[3]}let l=new Uint32Array((e-1)*(n-1)*6),c=0;for(let m=0;m<n-1;m++)for(let g=0;g<e-1;g++){let y=m*e+g,p=y+1,f=y+e,v=f+1;g+m&1?(l[c++]=y,l[c++]=f,l[c++]=p,l[c++]=p,l[c++]=f,l[c++]=v):(l[c++]=y,l[c++]=f,l[c++]=v,l[c++]=y,l[c++]=v,l[c++]=p)}let h=new oe;h.setAttribute("position",new ve(s,3)),h.setAttribute("color",new ve(o,3)),h.setAttribute("aRipple",new ve(r,1)),h.setIndex(new ve(l,1)),h.computeVertexNormals();let d=Nt({vertexColors:!0,seabed:!0}),u=new ut(h,d);return u.castShadow=!1,u.receiveShadow=!0,u.name="terrain",u}function vh(i){let t=new On(1,1),e=t.attributes.position,n=Ce(i),s=new x,o=new Map;for(let r=0;r<e.count;r++){s.fromBufferAttribute(e,r);let a=`${s.x.toFixed(3)},${s.y.toFixed(3)},${s.z.toFixed(3)}`;o.has(a)||o.set(a,.72+n()*.5);let l=o.get(a);s.multiplyScalar(l),s.y*=.62,s.y<-.1&&(s.y*=.4),e.setXYZ(r,s.x,s.y,s.z)}return t.computeVertexNormals(),t}function ty(){let i=Ce(4242),t=[],e=[],n=[],s=6,o=4;for(let a=0;a<s;a++){let l=a/s*Math.PI*2+(i()-.5)*.7,c=.18+i()*.42,h=.62+i()*.38,d=Math.cos(l),u=Math.sin(l),m=-u,g=d,y=t.length/3,p=(i()-.5)*.06,f=0,v=(i()-.5)*.06;for(let S=0;S<=o;S++){let _=S/o,b=.105*(1-_*.62)*(.85+i()*.3);t.push(p-m*b,f,v-g*b,p+m*b,f,v+g*b);let E=c*(.35+1.1*_),A=d*Math.cos(E)*.55,M=1,w=u*Math.cos(E)*.55,T=Math.hypot(A,M,w);e.push(A/T,M/T,w/T,A/T,M/T,w/T);let P=h/o;p+=d*Math.sin(E)*P,v+=u*Math.sin(E)*P,f+=Math.cos(E)*P}for(let S=0;S<o;S++){let _=y+S*2;n.push(_,_+2,_+1,_+1,_+2,_+3)}}let r=new oe;return r.setAttribute("position",new qt(t,3)),r.setAttribute("normal",new qt(e,3)),r.setIndex(n),r}function ey(){let t=[],e=[];for(let o=0;o<=7;o++){let r=o/7,a=.09+Math.sin(r*Math.PI)*.1;t.push(-a,r,0,a,r,0)}for(let o=0;o<7;o++){let r=o*2;e.push(r,r+1,r+2,r+1,r+3,r+2)}let n=new oe;n.setAttribute("position",new qt(t,3)),n.setIndex(e);let s=[];for(let o=0;o<t.length/3;o++)s.push(0,.3,1);return n.setAttribute("normal",new qt(s,3)),n}function Z0(i){let t=new yt;t.name="decor";let e=Ce(1234),n=new le,s=new Ze,o=new Dn,r=new x,a=new x,l=new J,c=(D,z,L)=>i.some(U=>Math.hypot(U.x-D,U.z-z)<U.r+L),h=[];for(let D=0;D<110;D++){let z=e(),L=cn.ax+(cn.bx-cn.ax)*z+(e()-.5)*9,U=cn.az+(cn.bz-cn.az)*z+(e()-.5)*4;U>cn.gapA-1&&U<cn.gapB+1&&e()<.85||h.push([L,U,.5+e()*1.7])}for(let D=0;D<140;D++){let z=-230+e()*350,L=-110+e()*200;h.push([z,L,.25+e()*e()*1.4])}let d=[[-86.5,-24.2,1.1],[-84.9,-22.8,.7],[-76.2,-33.1,.9],[-72,-30.4,1.3],[-88.6,-30.5,.6],[-69.5,-27.6,.55]];h.push(...d);let u=[vh(1),vh(2),vh(3)],m=Nt({color:16777215,flat:!0,moss:{color:6188612,amount:.7}}),g=u.map(D=>new Ri(D,m,Math.ceil(h.length/3)+2));g.forEach(D=>{D.count=0,D.castShadow=!0,D.instanceMatrix.setUsage(fc)});let y=[];for(let[D,z,L]of h){if(c(D,z,L))continue;let U=Be(D,z),O=g[Math.floor(e()*3)];o.set((e()-.5)*.3,e()*6.28,(e()-.5)*.3),s.setFromEuler(o),r.set(L*(.8+e()*.5),L*(.7+e()*.6),L*(.8+e()*.5)),n.compose(a.set(D,U+L*.1,z),s,r),O.setMatrixAt(O.count,n);let k=.42+e()*.14;l.setRGB(k*.95,k*(1+e()*.08),k*.95),e()<.3&&l.setRGB(k*.9,k*1.05,k*.8),O.setColorAt(O.count,l),O.count++,y.push({x:D,z,r:L})}g.forEach(D=>{D.instanceColor&&(D.instanceColor.needsUpdate=!0),t.add(D)});let p=[],f=(D,z,L,U,O,k,W,q=1)=>{for(let at=0;at<O;at++){let it=e()*Math.PI*2,lt=Math.sqrt(e()),wt=D+Math.cos(it)*L*lt,gt=z+Math.sin(it)*U*lt,K=4+Math.floor(e()*7*q);for(let tt=0;tt<K;tt++){let dt=wt+(e()-.5)*.7,Ct=gt+(e()-.5)*.7;c(dt,Ct,.3)||p.push([dt,Ct,k+e()*(W-k)])}}};f(ii.x,ii.z,ii.rx,ii.rz,520,.5,1.15,1.2),f(-86,-24,6,4,70,.35,.75),f(-73,-31,5,4,60,.35,.7),f(-90,-33,4,3,40,.3,.6),f(-140,-36,8,6,60,.4,.8),f(-62,-20,5,4,40,.3,.6),f(-11,1,5,4,50,.4,.9),f(-6,18,4,4,30,.4,.8),f(-170,-52,9,6,60,.4,.9);let v=Nt({color:16777215,sway:1,side:me}),S=new Ri(ty(),v,Math.ceil(p.length/3)),_=0;for(let D=0;D<p.length;D++){let[z,L,U]=p[D],O=Be(z,L);o.set((e()-.5)*.3,e()*6.28,(e()-.5)*.3),s.setFromEuler(o);let k=1+e()*.6,W=e(),q=e()<.18;D%3||gh.some(at=>Math.hypot(at.x-z,at.z-L)<1.3)||(r.set(.75+k*.35,U,.75+k*.35),n.compose(a.set(z,O-.04,L),s,r),S.setMatrixAt(_,n),l.setRGB(.56+W*.2,.78+W*.12,.36+W*.06),q&&l.setRGB(.8,.76,.4),S.setColorAt(_,l),_++)}S.count=_,S.castShadow=!1,S.instanceColor.needsUpdate=!0,t.add(S);let b=[];for(let D=0;D<90;D++){let z=e(),L=cn.ax+(cn.bx-cn.ax)*z+(e()-.5)*6,U=cn.az+(cn.bz-cn.az)*z+(e()-.5)*3;U>cn.gapA&&U<cn.gapB||b.push([L,U,2.2+e()*3.2])}for(let D=0;D<26;D++){let z=e()*6.28,L=9+e()*7;b.push([ie.x+Math.cos(z)*L-4,ie.z+Math.sin(z)*L,1.8+e()*2.6])}for(let D=0;D<20;D++)b.push([ii.x+(e()-.5)*26,ii.z+(e()-.5)*18,2+e()*2.5]);let E=Nt({color:16777215,sway:2.2,side:me}),A=new Ri(ey(),E,b.length*3),M=0;for(let[D,z,L]of b){if(c(D,z,.5))continue;let U=Be(D,z),O=2+Math.floor(e()*2);for(let k=0;k<O;k++){o.set((e()-.5)*.25,e()*6.28,(e()-.5)*.25),s.setFromEuler(o),r.set(1+e()*.4,L*(.7+e()*.4),1),n.compose(a.set(D+(e()-.5)*.4,U-.05,z+(e()-.5)*.4),s,r),A.setMatrixAt(M,n);let W=e();l.setRGB(.5+W*.12,.46+W*.1,.22),A.setColorAt(M,l),M++}}A.count=M,A.instanceColor.needsUpdate=!0,A.castShadow=!0,t.add(A);let w=new On(.07,0),T=Nt({color:16777215,flat:!0}),P=900,N=new Ri(w,T,P),F=0;for(let D=0;D<P*3&&F<P;D++){let z=-130+e()*140,L=-60+e()*70,U=Be(z,L);if(U<-9&&e()<.8)continue;o.set(e()*3,e()*6.28,e()*3),s.setFromEuler(o);let O=.6+e()*1.4;r.set(O,O*.5,O),n.compose(a.set(z,U+.02,L),s,r),N.setMatrixAt(F,n);let k=e();k<.5?l.setRGB(.95,.9,.8):k<.8?l.setRGB(.62,.6,.56):l.setRGB(.85,.66,.55),N.setColorAt(F,l),F++}return N.count=F,N.instanceColor.needsUpdate=!0,t.add(N),{group:t,rocks:y,bladeMesh:S,kelpMesh:A}}function $0(){let i=new yt,t=Nt({color:13124399,spec:.3}),e=Nt({color:4165466,spec:.3}),n=Nt({color:2894376}),s=[];for(let o of bc){let r=new yt,a=new ut(new qe(.42,.55,1.1,8),o.color==="red"?t:e);a.position.y=.2;let l=new ut(o.color==="red"?new ys(.32,.7,8):new qe(.28,.28,.6,8),o.color==="red"?t:e);l.position.y=1.1;let c=new ut(new qe(.05,.05,1.2,4),n);c.position.y=.9;let h=new ut(new qe(.06,.06,3.6,4),n);h.position.set(.55,-1.75,0),h.rotation.z=.32,r.add(a,l,c,h),r.position.set(o.x,0,o.z),r.traverse(d=>{d.isMesh&&(d.castShadow=!0)}),i.add(r),s.push(r)}return{group:i,buoys:s}}var ny=[[.9,.42,23,.11,1],[-.3,.95,15,.07,1.25],[.6,-.8,9,.035,1.6]];var K0=ny.map(([i,t,e,n,s])=>{let o=Math.hypot(i,t),r=Math.PI*2/e,a=s*Math.sqrt(9.8*r);return`{ vec2 d = vec2(${(i/o).toFixed(5)}, ${(t/o).toFixed(5)}); float ph = dot(p, d) * ${r.toFixed(5)} + t * ${a.toFixed(5)};
    h += ${n.toFixed(4)} * sin(ph); g += d * ${(n*r).toFixed(5)} * cos(ph); }`}).join(`
`);function J0(){let i=new Nn(1400,1400,180,180);i.rotateX(-Math.PI/2);let t=new Ue({uniforms:{...ke,uSkyTop:{value:new J(.5,.66,.74)},uSkyHor:{value:new J(.93,.86,.74)},uWake:{value:Array.from({length:24},()=>new _e(0,0,0,0))},uBoat:{value:new _e(0,0,0,0)},uDist:{value:new Zt(0,0)}},vertexShader:`
      ${Ii}
      varying vec3 vWorld;
      void waves(vec2 p, float t, out float h, out vec2 g){
        h = 0.0; g = vec2(0.0);
        ${K0}
      }
      void main(){
        vec4 wp = modelMatrix * vec4(position, 1.0);
        float h; vec2 g;
        waves(wp.xz, uTime, h, g);
        wp.y += h;
        vWorld = wp.xyz;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,fragmentShader:`
      ${Ii}
      uniform vec3 uSkyTop;
      uniform vec3 uSkyHor;
      uniform vec4 uWake[24];
      uniform vec4 uBoat;
      varying vec3 vWorld;
      void waves(vec2 p, float t, out float h, out vec2 g){
        h = 0.0; g = vec2(0.0);
        ${K0}
      }
      void main(){
        float h; vec2 g;
        waves(vWorld.xz, uTime, h, g);
        // \u7EC6\u788E\u7684\u6CE2\u7EB9
        vec2 rp = vWorld.xz * 0.9;
        float r1 = vnoise(rp + vec2(uTime * 0.35, uTime * 0.2));
        float r2 = vnoise(rp * 1.9 - vec2(uTime * 0.3, -uTime * 0.25));
        vec2 rg = vec2(r1 - 0.5, r2 - 0.5) * 0.22 * uWobble + vec2(0.0);
        vec3 N = normalize(vec3(-g.x - rg.x, 1.0, -g.y - rg.y));
        vec3 V = normalize(cameraPosition - vWorld);
        float dist = length(cameraPosition - vWorld);
        float ndv = max(dot(N, V), 0.0);
        float F = 0.025 + 0.975 * pow(1.0 - ndv, 5.0);
        vec3 R = reflect(-V, N);
        float sky = clamp(R.y, 0.0, 1.0);
        vec3 refl = mix(uSkyHor, uSkyTop, pow(sky, 0.6));
        // \u592A\u9633\u5728\u6C34\u9762\u7684\u788E\u5149\uFF1A\u4E00\u7C92\u4E00\u7C92\u5730\u95EA
        float sp = pow(max(dot(R, uSunDir), 0.0), 60.0);
        // \u4E00\u683C\u4E00\u683C\u7684\u5C0F\u4EAE\u70B9\uFF0C\u5404\u81EA\u9519\u5F00\u65F6\u95F4\u95EA\uFF1A\u8D8A\u9760\u8FD1\u592A\u9633\u5012\u5F71\u8D8A\u5BC6
        vec2 cell = floor(vWorld.xz * 10.0);
        float ph = hash12(cell * 1.37);
        float hh = hash12(cell + floor(uTime * 2.2 + ph * 5.0) * 17.31);
        float spark = step(1.0 - 0.055 * smoothstep(0.06, 0.6, sp), hh) * step(0.02, sp);
        // \u96F6\u661F\u7684\u6CE2\u5149
        float tw = step(0.93, vnoise(vWorld.xz * 3.4 + vec2(uTime * 0.9, uTime * 0.6))) * step(0.6, vnoise(vWorld.xz * 0.25 - uTime * 0.12));
        float ln = tw;
        float lineFade = 1.0 - smoothstep(25.0, 70.0, dist);
        // \u8239\u5C3E\u767D\u6D6A
        float foam = 0.0;
        for (int i = 0; i < 24; i++) {
          vec4 w = uWake[i];
          if (w.w <= 0.0) continue;
          float d = length(vWorld.xz - w.xy);
          float rr = w.z;
          // \u4E00\u5708\u7EC6\u788E\u7684\u767D\u6CAB\uFF1A\u4E2D\u95F4\u6563\u5F00\uFF0C\u8FB9\u4E0A\u7559\u4E00\u9053
          float ring = smoothstep(rr * 0.55, rr * 0.85, d) * (1.0 - smoothstep(rr * 0.85, rr, d));
          float core = 1.0 - smoothstep(0.0, rr * 0.6, d);
          float n = vnoise(vWorld.xz * 4.2 + float(i) * 7.0 + uTime * 0.6);
          float m = max(ring, core * 0.6) * w.w;
          foam = max(foam, step(0.62, n * 0.55 + m * 0.75) * m);
        }
        // \u8239\u8EAB\u8D34\u6C34\u5904\u7684\u4E00\u5708\u767D\u6CAB
        {
          vec2 bp = vWorld.xz - uBoat.xy;
          float c = cos(uBoat.z), s = sin(uBoat.z);
          vec2 lp = vec2(c * bp.x - s * bp.y, s * bp.x + c * bp.y);
          // \u8239\u8EAB\u6C34\u7EBF\u7684\u5F62\u72B6\uFF1A\u8239\u5934\u6536\u5C16\u3001\u8239\u5C3E\u7565\u6536
          float hb = lp.x > 0.5 ? 2.12 * sqrt(max(0.0, 1.0 - pow(min(1.0, (lp.x - 0.5) / 5.75), 2.2))) : 2.12 - 0.3 * clamp((-lp.x - 2.0) / 4.0, 0.0, 1.0);
          float bd = max(abs(lp.y) - hb, max(lp.x - 6.2, -lp.x - 6.0));
          float edge = (1.0 - smoothstep(0.0, 0.35 + uBoat.w * 0.5, bd)) * step(-0.05, bd);
          float n = vnoise(vWorld.xz * 3.0 + uTime * 1.3);
          foam = max(foam, edge * step(0.45, n + edge * 0.3) * (0.55 + uBoat.w * 0.45));
        }
        float alpha = clamp(F * 1.1 + 0.02, 0.0, 0.97);
        vec3 col = refl;
        col += uSunCol * spark * 0.9;
        alpha = max(alpha, spark * 0.65);
        col = mix(col, vec3(0.92, 0.97, 0.98), ln * lineFade * 0.7);
        alpha = max(alpha, ln * lineFade * 0.22);
        col = mix(col, vec3(0.96, 0.98, 0.98), foam);
        alpha = max(alpha, foam * 0.92);
        // \u8FDC\u5904\u7684\u6D77\u9762\u4E0E\u5929\u9645\u96FE\u878D\u5728\u4E00\u8D77
        float far = smoothstep(150.0, 600.0, dist);
        col = mix(col, uFogCol, far * 0.7);
        alpha = mix(alpha, 1.0, far);
        gl_FragColor = vec4(col, alpha);
      }
    `,transparent:!0,depthWrite:!1}),e=new ut(i,t);return e.name="water",e.renderOrder=10,e.frustumCulled=!1,e}function j0(i,t,e){let n=7.777777777777778;i.position.x=Math.round(t/n)*n,i.position.z=Math.round(e/n)*n}function Q0(){let i=new Bo(800,32,16),t=new Ue({uniforms:{uSunDir:ke.uSunDir,uTime:ke.uTime,uTop:{value:new J(.44,.6,.7)},uHor:{value:new J(.95,.86,.72)},uLow:{value:new J(.78,.78,.76)}},vertexShader:`
      varying vec3 vDir;
      void main(){
        vDir = normalize(position);
        vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        gl_Position = p.xyww;
      }
    `,fragmentShader:`
      uniform vec3 uSunDir; uniform float uTime;
      uniform vec3 uTop; uniform vec3 uHor; uniform vec3 uLow;
      varying vec3 vDir;
      float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
        return mix(mix(h(i), h(i+vec2(1,0)), f.x), mix(h(i+vec2(0,1)), h(i+vec2(1,1)), f.x), f.y); }
      void main(){
        vec3 d = normalize(vDir);
        float y = d.y;
        vec3 col = mix(uHor, uTop, smoothstep(0.0, 0.55, y));
        col = mix(col, uLow, smoothstep(0.0, -0.08, y));
        float sd = max(dot(d, normalize(uSunDir)), 0.0);
        col += vec3(1.0, 0.82, 0.55) * pow(sd, 18.0) * 0.45;
        col += vec3(1.0, 0.95, 0.8) * step(0.9985, sd);
        // \u5C42\u4E91
        vec2 cp = d.xz / max(y + 0.08, 0.04) * 1.6 + vec2(uTime * 0.01, 0.0);
        float c = n(cp * 0.8) * 0.6 + n(cp * 2.1) * 0.4;
        float cl = smoothstep(0.58, 0.72, c) * smoothstep(0.02, 0.2, y) * (1.0 - smoothstep(0.5, 0.8, y));
        vec3 cc = mix(vec3(0.98, 0.92, 0.84), vec3(1.0, 0.8, 0.62), pow(sd, 4.0));
        col = mix(col, cc, cl * 0.75);
        gl_FragColor = vec4(col, 1.0);
      }
    `,side:fn,depthWrite:!1}),e=new ut(i,t);return e.renderOrder=-10,e.frustumCulled=!1,e.name="sky",e}function td(){let i=new yt,t=Ce(77),e=[],n=[],s=[],o=120,r=-Math.PI*.98,a=-Math.PI*.02;for(let v=0;v<=o;v++){let S=r+(a-r)*(v/o),_=520+mi(v*.08,3,3,4)*60,b=Math.cos(S)*_-60,E=Math.sin(S)*_*.75-120,A=18+(mi(v*.05,1,4,8)*.5+.5)*70,M=Math.exp(-Math.pow((v-28)/7,2));A=A*(1-M*.6)+M*26,e.push(b,-2,E,b,A,E);let w=.55+t()*.05;n.push(w*.8,w*.85,w*.9,w*.86,w*.88,w*.88)}for(let v=0;v<o;v++){let S=v*2;s.push(S,S+2,S+1,S+1,S+2,S+3)}let l=new oe;l.setAttribute("position",new qt(e,3)),l.setAttribute("color",new qt(n,3)),l.setIndex(s),l.computeVertexNormals();let c=new ut(l,Nt({vertexColors:!0,color:10134438,side:me}));i.add(c);let h=r+(a-r)*(28/o),d=505,u=Math.cos(h)*d-60,m=Math.sin(h)*d*.75-120,g=new ut(new qe(2.2,3.2,22,8),Nt({color:15262422}));g.position.set(u,37,m);let y=new ut(new qe(2.5,2.7,4,8),Nt({color:11813946}));y.position.set(u,34,m);let p=new ut(new qe(2,2,3,8),Nt({color:16773824,emissive:8413216}));p.position.set(u,49.5,m);let f=new ut(new ys(2.6,3,8),Nt({color:3815994}));return f.position.set(u,52.5,m),i.add(g,y,p,f),i.name="coast",{group:i,lighthouse:new x(u,40,m)}}var Bt=class{constructor(){this.pos=[],this.nor=[],this.col=[],this.idx=[],this.n=0}_v(t,e,n,s,o){return this.pos.push(t.x,t.y,t.z),this.nor.push(e,n,s),this.col.push(o.r,o.g,o.b),this.n++}quad(t,e,n,s,o){let r=e.x-t.x,a=e.y-t.y,l=e.z-t.z,c=s.x-t.x,h=s.y-t.y,d=s.z-t.z,u=a*d-l*h,m=l*c-r*d,g=r*h-a*c,y=Math.hypot(u,m,g)||1;u/=y,m/=y,g/=y;let p=this._v(t,u,m,g,o),f=this._v(e,u,m,g,o),v=this._v(n,u,m,g,o),S=this._v(s,u,m,g,o);return this.idx.push(p,f,v,p,v,S),[u,m,g]}tri(t,e,n,s){let o=e.x-t.x,r=e.y-t.y,a=e.z-t.z,l=n.x-t.x,c=n.y-t.y,h=n.z-t.z,d=r*h-a*c,u=a*l-o*h,m=o*c-r*l,g=Math.hypot(d,u,m)||1;d/=g,u/=g,m/=g;let y=this._v(t,d,u,m,s),p=this._v(e,d,u,m,s),f=this._v(n,d,u,m,s);this.idx.push(y,p,f)}box(t,e,n,s,o){let r=(f,v,S)=>new x(t.x+e.x*f+n.x*v+s.x*S,t.y+e.y*f+n.y*v+s.y*S,t.z+e.z*f+n.z*v+s.z*S),a=r(-1,-1,-1),l=r(1,-1,-1),c=r(-1,1,-1),h=r(1,1,-1),d=r(-1,-1,1),u=r(1,-1,1),m=r(-1,1,1),g=r(1,1,1),y=e.clone().cross(n).dot(s)<0,p=(f,v,S,_)=>y?this.quad(_,S,v,f,o):this.quad(f,v,S,_,o);p(d,u,g,m),p(l,a,c,h),p(u,l,h,g),p(a,d,m,c),p(m,g,h,c),p(a,l,u,d)}beam(t,e,n,s,o,r){let a=e.clone().sub(t),l=a.length();if(l<1e-5)return;a.divideScalar(l);let c=a.clone().cross(n);c.lengthSq()<1e-6&&(c=a.clone().cross(new x(1,0,0))),c.normalize();let h=c.clone().cross(a).normalize(),d=t.clone().add(e).multiplyScalar(.5);this.box(d,a.multiplyScalar(l/2),h.multiplyScalar(o/2),c.multiplyScalar(s/2),r)}cylinder(t,e,n,s,o,r,a=!0,l=null){let c=e.clone().sub(t),h=c.length();c.normalize();let d=new x(0,1,0);Math.abs(c.dot(d))>.9&&d.set(1,0,0);let u=d.clone().cross(c).normalize(),m=c.clone().cross(u).normalize(),g=[],y=[];for(let p=0;p<o;p++){let f=p/o*Math.PI*2,v=Math.cos(f),S=Math.sin(f);g.push(t.clone().addScaledVector(u,v*n).addScaledVector(m,S*n));let _=l?l(p):0;y.push(t.clone().addScaledVector(c,h+_).addScaledVector(u,v*s).addScaledVector(m,S*s))}for(let p=0;p<o;p++){let f=(p+1)%o;this.quad(g[p],g[f],y[f],y[p],r)}if(a){let p=e.clone().addScaledVector(c,0);for(let f=0;f<o;f++){let v=(f+1)%o;this.tri(y[f],y[v],p,r)}}}build(){let t=new oe;return t.setAttribute("position",new qt(this.pos,3)),t.setAttribute("normal",new qt(this.nor,3)),t.setAttribute("color",new qt(this.col,3)),t.setIndex(this.idx),t.computeBoundingSphere(),t}get empty(){return this.n===0}};var $e={NONE:0,FLOOR:1,HULL:2,RIB:3,DECK:4,CASTLE:5,MAST:6,COAMING:7,CARGO:8},OE={[$e.HULL]:"\u8239\u58F3\u6321\u4F4F\uFF0C\u7F51\u4E0B\u4E0D\u53BB",[$e.RIB]:"\u8239\u808B\u6321\u4F4F\u7F51\u53E3",[$e.DECK]:"\u7532\u677F\u6321\u4F4F\uFF0C\u7F51\u7A7F\u4E0D\u8FC7",[$e.CASTLE]:"\u8239\u5C3E\u697C\u6709\u9876\uFF0C\u7F51\u7A7F\u4E0D\u8FC7",[$e.MAST]:"\u65AD\u6845\u6321\u4F4F\u7F51\u53E3",[$e.COAMING]:"\u8231\u53E3\u592A\u7A84\uFF0C\u7F51\u53E3\u5361\u5728\u8231\u6CBF",[$e.CARGO]:"\u8231\u91CC\u7684\u6876\u548C\u7BB1\u5B50\u6321\u4F4F\u7F51\u53E3"},Cc=class{constructor(t,e,n,s,o){this.x0=t,this.z0=e,this.cell=o,this.nx=Math.ceil((n-t)/o),this.nz=Math.ceil((s-e)/o),this.top=new Float32Array(this.nx*this.nz).fill(-1e9),this.tag=new Uint8Array(this.nx*this.nz)}addTriangle(t,e,n,s,o,r,a,l,c,h){let d=Math.min(t,s,a),u=Math.max(t,s,a),m=Math.min(n,r,c),g=Math.max(n,r,c),y=Math.max(0,Math.floor((d-this.x0)/this.cell)),p=Math.min(this.nx-1,Math.floor((u-this.x0)/this.cell)),f=Math.max(0,Math.floor((m-this.z0)/this.cell)),v=Math.min(this.nz-1,Math.floor((g-this.z0)/this.cell)),S=(r-c)*(t-a)+(a-s)*(n-c);if(!(Math.abs(S)<1e-7))for(let _=f;_<=v;_++){let b=this.z0+(_+.5)*this.cell;for(let E=y;E<=p;E++){let A=this.x0+(E+.5)*this.cell,M=((r-c)*(A-a)+(a-s)*(b-c))/S,w=((c-n)*(A-a)+(t-a)*(b-c))/S,T=1-M-w;if(M<-1e-4||w<-1e-4||T<-1e-4)continue;let P=M*e+w*o+T*l,N=_*this.nx+E;P>this.top[N]&&(this.top[N]=P,this.tag[N]=h)}}}addMesh(t,e){t.updateMatrixWorld(!0);let n=t.geometry,s=n.attributes.position,o=t.matrixWorld.elements,r=d=>o[0]*s.getX(d)+o[4]*s.getY(d)+o[8]*s.getZ(d)+o[12],a=d=>o[1]*s.getX(d)+o[5]*s.getY(d)+o[9]*s.getZ(d)+o[13],l=d=>o[2]*s.getX(d)+o[6]*s.getY(d)+o[10]*s.getZ(d)+o[14],c=n.index?n.index.array:null,h=c?c.length:s.count;for(let d=0;d<h;d+=3){let u=c?c[d]:d,m=c?c[d+1]:d+1,g=c?c[d+2]:d+2;this.addTriangle(r(u),a(u),l(u),r(m),a(m),l(m),r(g),a(g),l(g),e)}}sample(t,e){let n=Math.floor((t-this.x0)/this.cell),s=Math.floor((e-this.z0)/this.cell);if(n<0||s<0||n>=this.nx||s>=this.nz)return null;let o=s*this.nx+n;return this.tag[o]===$e.NONE?null:{y:this.top[o],tag:this.tag[o]}}};var Gn=-10.4,Ui=11.4,mo=.6;function _h(i){return i>7.2?5*Math.pow((i-7.2)/(Ui-7.2),1.7):i<-7.6?5.6*Math.pow((-7.6-i)/(-7.6-Gn),1.25):0}function Hi(i){return i>=0?4+1.35*Math.pow(i/Ui,2.2):4+1.7*Math.pow(i/Gn,2)}function iy(i){let t=i>=mo?(i-mo)/(Ui-mo):(mo-i)/(mo-Gn);return 3.6*Math.pow(Math.max(0,1-Math.pow(ge(t,0,1),2.3)),.6)}function sy(i){let t=Math.abs(i-mo)/10.8;return 2.9-1.3*t*t}function ln(i,t,e,n=new x){let s=_h(i),o=Hi(i),r=iy(i),a=sy(i),l=ge(t,0,1)*Math.PI/2,c=Math.cos(l),h=Math.sin(l),d=r*Math.pow(h,2/a)*(1-.06*Vt(.82,1,t)),u=s+(o-s)*(1-Math.pow(c,2/a));return n.set(i,u,e*d)}function bs(i,t,e){let s=ln(i,t,e),o=ln(i+.01,t,e).sub(s),r=ln(i,Math.min(1,t+.01),e).sub(s),a=e>0?o.cross(r):r.cross(o);return a.normalize(),a.z*e<0&&Math.abs(a.z)>.2&&a.negate(),a}function Ke(i){return Hi(i)-.85}function po(i,t){let e=0,n=1;for(let s=0;s<22;s++){let o=(e+n)/2;ln(i,o,1).y<t?e=o:n=o}return ln(i,e,1).z}var Pc={x:2.6,v:.86,rx:2.7,rv:.36};function ur(i,t,e,n=0){if(e>0)return!1;let s=(i-Pc.x)/Pc.rx,o=(t-Pc.v)/Pc.rv,r=ss(i*1.7,t*9,3)*.55+n;return s*s+o*o<.78+r*.5}function oy(i,t,e){return e<0&&t===7&&i>-6.5&&i<-4.7}var ed=[{x:-3,hx:.95,hz:.95},{x:5.55,hx:.7,hz:.85}],Ic={x0:.95,x1:4.4},Gt={plank:new J(.5,.38,.27),plankDark:new J(.3,.23,.17),inner:new J(.3,.23,.17),rib:new J(.42,.32,.23),deck:new J(.58,.48,.36),keel:new J(.27,.21,.16),wale:new J(.25,.19,.14),algae:new J(.4,.46,.28),paintRed:new J(.62,.3,.24),paintOchre:new J(.72,.58,.3),mud:new J(.36,.33,.27),holdMud:new J(.2,.18,.15),stone:new J(.66,.64,.58),cask:new J(.56,.44,.3),clay:new J(.72,.46,.32),iron:new J(.3,.24,.2),sail:new J(.78,.72,.6),rope:new J(.55,.48,.36)};function id(){let i=Ce(4242),t=new yt;t.name="wreck";let e=new yt;e.rotation.set(ie.heel,ie.yaw,ie.pitch,"YXZ"),t.add(e);let n=new le().makeRotationFromEuler(e.rotation),s=L=>L.clone().applyMatrix4(n).y,o={hull:new Bt,rib:new Bt,deck:new Bt,coaming:new Bt,castle:new Bt,mast:new Bt,floor:new Bt,cargo:new Bt},r=(L,U,O=Gt.plank)=>{let k=O.clone().multiplyScalar(.86+L*.22),W=s(U);return W>.35&&k.lerp(Gt.algae,ge((W-.35)*.6,0,.3)),k},a=70,l=[];for(let L=0;L<=a;L++)l.push(Gn+.08+(Ui-Gn-.16)*(L/a));let c=12,h=[];for(let L=0;L<=c;L++)h.push(.035+(1-.035)*(L/c));let d=.05,u=.085,m=new x;for(let L of[-1,1])for(let U=0;U<c;U++){let O=h[U],k=h[U+1],W=i(),q=(i()-.5)*.4,at=[],it=()=>{at.length>=2&&g(at,O,k,L,W),at=[]};for(let lt=0;lt<l.length;lt++){let wt=l[lt],gt=(O+k)/2;ur(wt,gt,L,q)||oy(wt,U,L)?it():at.push(wt)}it()}function g(L,U,O,k,W){let q=[],at=[],it=[],lt=[];for(let gt of L){let K=bs(gt,U,k),tt=bs(gt,O,k),dt=ln(gt,U,k).addScaledVector(K,d),Ct=ln(gt,O,k);q.push(dt),at.push(Ct),it.push(dt.clone().addScaledVector(K,-u-d*.6)),lt.push(Ct.clone().addScaledVector(tt,-u))}for(let gt=0;gt<L.length-1;gt++){let K=q[gt],tt=q[gt+1],dt=at[gt+1],Ct=at[gt],_t=bs((L[gt]+L[gt+1])/2,(U+O)/2,k),$t=Math.floor((L[gt]+30+W*7)/4.2)%2===0?1:.93,Ee=r(W,_t).multiplyScalar($t);k>0?o.hull.quad(K,tt,dt,Ct,Ee):o.hull.quad(Ct,dt,tt,K,Ee);let te=Gt.inner.clone().multiplyScalar(.85+W*.25),ee=it[gt],xe=it[gt+1],ne=lt[gt+1],we=lt[gt];k>0?o.hull.quad(we,ne,xe,ee,te):o.hull.quad(ee,xe,ne,we,te),k>0?o.hull.quad(ee,xe,tt,K,Ee.clone().multiplyScalar(.7)):o.hull.quad(K,tt,xe,ee,Ee.clone().multiplyScalar(.7))}let wt=new J(.7,.6,.46);for(let gt of[0,L.length-1]){let K=q[gt],tt=at[gt],dt=lt[gt],Ct=it[gt],_t=gt===0?1:-1;gt===0?o.hull.quad(K,tt,dt,Ct,wt):o.hull.quad(Ct,dt,tt,K,wt)}}{let L=o.hull;L.box(new x(-.2,-.12,0),new x(7.7,0,0),new x(0,.24,0),new x(0,0,.17),Gt.keel);let U=[];for(let lt=0;lt<=10;lt++){let wt=7.2+(Ui+.15-7.2)*(lt/10);U.push(new x(wt,_h(Math.min(wt,Ui))-.12,0))}for(let lt=0;lt<U.length-1;lt++)L.beam(U[lt],U[lt+1],new x(0,0,1),.34,.36,Gt.keel);let O=[];for(let lt=0;lt<=8;lt++){let wt=-7.6+(Gn-.1+7.6)*(lt/8);O.push(new x(wt,_h(Math.max(wt,Gn))-.12,0))}for(let lt=0;lt<O.length-1;lt++)L.beam(O[lt],O[lt+1],new x(0,0,1),.34,.4,Gt.keel);L.beam(new x(Gn-.05,5.4,0),new x(Gn-.25,7,0),new x(0,0,1),.3,.3,Gt.keel);let k=new yt,W=new x(Gn-.55,2.6,.25),q=new x(-.55,0,0).applyAxisAngle(new x(0,1,0),.5),at=new x(0,2.1,0).applyAxisAngle(new x(1,0,0),.18),it=new x(0,0,.08).applyAxisAngle(new x(0,1,0),.5);L.box(W,q,at,it,Gt.plankDark),L.box(W.clone().add(new x(0,1.6,0)),q.clone().multiplyScalar(.25),new x(0,.08,0),it.clone().multiplyScalar(1.6),Gt.iron)}for(let L of[-1,1]){for(let U of[.6,.83])for(let O=0;O<l.length-1;O++){let k=l[O],W=l[O+1];if(k<Gn+.5||W>Ui-.6||ur((k+W)/2,U,L,.05))continue;let q=bs(k,U,L),at=bs(W,U,L),it=ln(k,U,L).addScaledVector(q,d+.07),lt=ln(W,U,L).addScaledVector(at,d+.07);o.hull.beam(it,lt,q,.2,.17,Gt.wale)}for(let U of[-4.6,-2.2,.2,2.6,5]){if(ur(U,.72,L,.05))continue;let O=bs(U,.72,L),k=ln(U,.72,L).addScaledVector(O,-.1),W=k.clone().addScaledVector(O,.55);o.hull.beam(k,W,new x(1,0,0),.26,.26,Gt.wale)}}for(let L=-7.3;L<=8.4;L+=.62){for(let k of[-1,1]){let W=[];for(let it=0;it<=16;it++){let lt=it/16,wt=bs(L,Math.max(lt,.02),k);W.push({v:lt,p:ln(L,lt,k).addScaledVector(wt,-u-.1)})}let q=W.map(it=>!ur(L,it.v,k,-.12)),at=Math.floor(i()*2);for(let it=1;it<q.length;it++)!q[it]&&q[it-1]&&at-- >0&&(q[it]=!0);for(let it=0;it<W.length-1;it++)!q[it]||!q[it+1]||o.rib.beam(W[it].p,W[it+1].p,new x(1,0,0),.15,.17,Gt.rib.clone().multiplyScalar(.9+i()*.2))}let U=ln(L,.12,-1).add(new x(0,.22,0)),O=ln(L,.12,1).add(new x(0,.22,0));o.rib.beam(U,O,new x(1,0,0),.16,.2,Gt.rib)}let y=-5.8,p=7.2,f=34,v=12,S=(L,U)=>ed.some(O=>Math.abs(L-O.x)<O.hx&&Math.abs(U)<O.hz),_=(L,U)=>L>Ic.x0+ss(U*2,3,5)*.45&&L<Ic.x1-ss(U*2,4,6)*.45;for(let L=0;L<v;L++){let U=.88+i()*.2;for(let O=0;O<f;O++){let k=y+(p-y)*(O/f),W=y+(p-y)*((O+1)/f),q=po(k,Ke(k))-.12,at=po(W,Ke(W))-.12,it=-1+2*L/v,lt=-1+2*(L+1)/v,wt=(it+lt)/2*(q+at)/2,gt=(k+W)/2;if(S(gt,wt)||_(gt,wt))continue;let K=Ke(k),tt=Ke(W),dt=new x(k,K,it*q),Ct=new x(W,tt,it*at),_t=new x(W,tt,lt*at-.02),$t=new x(k,K,lt*q-.02),Ee=Gt.deck.clone().multiplyScalar(U*(Math.floor(k*.5+L*1.7)%3===0?.92:1));s(new x(0,1,0))>.25&&Ee.lerp(Gt.algae,.25),o.deck.quad(dt,$t,_t,Ct,Ee);let ee=new x(0,-.07,0);o.deck.quad(Ct.clone().add(ee),_t.clone().add(ee),$t.clone().add(ee),dt.clone().add(ee),Gt.inner)}}for(let L of ed){let U=Ke(L.x)+.15,O=Gt.plankDark;o.coaming.box(new x(L.x-L.hx-.06,U,0),new x(.06,0,0),new x(0,.22,0),new x(0,0,L.hz+.12),O),o.coaming.box(new x(L.x+L.hx+.06,U,0),new x(.06,0,0),new x(0,.22,0),new x(0,0,L.hz+.12),O),o.coaming.box(new x(L.x,U,-L.hz-.06),new x(L.hx,0,0),new x(0,.22,0),new x(0,0,.06),O),o.coaming.box(new x(L.x,U,L.hz+.06),new x(L.hx,0,0),new x(0,.22,0),new x(0,0,.06),O)}for(let L=-5.4;L<7;L+=1.25){if(L>Ic.x0-.3&&L<Ic.x1+.3)continue;let U=po(L,Ke(L))-.1;o.rib.box(new x(L,Ke(L)-.2,0),new x(.1,0,0),new x(0,.12,0),new x(0,0,U),Gt.rib)}for(let L of[-1,1])for(let U=0;U<l.length-1;U++){let O=l[U],k=l[U+1];if(O<Gn+.4||k>Ui-.3||ur((O+k)/2,.99,L,0))continue;let W=ln(O,1,L).add(new x(0,.05,0)),q=ln(k,1,L).add(new x(0,.05,0));o.hull.beam(W,q,new x(0,1,0),.2,.12,Gt.plankDark)}let b=-9.6,E=-5.8,A=Ke(-7.5)+2.35;{let L=o.castle;for(let k=b;k<E-.01;k+=.5){let W=po(k+.25,Ke(k+.25))-.12;L.box(new x(k+.25,Ke(k+.25)-.03,0),new x(.25,0,0),new x(0,.04,0),new x(0,0,W),Gt.deck)}let U=k=>Math.max(po(k,Hi(k)),.6)-.05;for(let k of[-1,1]){for(let W=b;W<E-.01;W+=.42){let q=W+.21,at=U(q)*k,it=Hi(q)-.1,lt=k<0&&q>-8.4&&q<-6.8,gt=(Math.floor((q-b)/.84)%2===0?Gt.paintRed:Gt.paintOchre).clone().lerp(Gt.plank,.62).multiplyScalar(.85+i()*.2);lt?(L.box(new x(q,(it+4.9+.2)/2+.1,at),new x(.2,0,0),new x(0,(5-it)/2+.05,0),new x(0,0,.06),gt),L.box(new x(q,(5.85+A)/2,at),new x(.2,0,0),new x(0,(A-5.85)/2,0),new x(0,0,.06),gt)):L.box(new x(q,(it+A)/2,at),new x(.2,0,0),new x(0,(A-it)/2,0),new x(0,0,.06),gt)}if(k<0){let W=U(-7.6)*k-.04;L.box(new x(-7.6,5,W),new x(.85,0,0),new x(0,.06,0),new x(0,0,.1),Gt.plankDark),L.box(new x(-7.6,5.86,W),new x(.85,0,0),new x(0,.06,0),new x(0,0,.1),Gt.plankDark)}}{let k=U(b+.1);L.box(new x(b,(Hi(b)+A)/2-.4,0),new x(.07,0,0),new x(0,(A-Hi(b))/2+.5,0),new x(0,0,k),Gt.paintRed.clone().lerp(Gt.plank,.5))}{let k=E,W=U(k),q=Ke(k),at=.6,it=1.75,lt=Gt.paintOchre.clone().lerp(Gt.plank,.5),wt=(W-at)/2;for(let gt of[-1,1])L.box(new x(k,(q+A)/2,gt*(at+wt)),new x(.07,0,0),new x(0,(A-q)/2,0),new x(0,0,wt),lt);L.box(new x(k,(q+it+A)/2,0),new x(.07,0,0),new x(0,(A-q-it)/2,0),new x(0,0,at),lt)}for(let k=-5;k<=5;k++){let W=k*.36,q=.85+i()*.2;L.box(new x((b+E)/2-.1,A+.05,W),new x((E-b)/2+.3,0,0),new x(0,.06,0),new x(0,0,.17),Gt.deck.clone().multiplyScalar(q))}let O=[[b-.15,-U(b+.3)-.05],[E+.25,-U(E)-.05],[E+.25,U(E)+.05],[b-.15,U(b+.3)+.05]];nd(L,O,A+.08,.72,[1],i),L.box(new x(-7.5,Ke(-7.5)+.35,-.7),new x(.4,0,0),new x(0,.33,0),new x(0,0,.32),Gt.plank),L.box(new x(-7.5,Ke(-7.5)+.35,-.7),new x(.42,0,0),new x(0,.05,0),new x(0,0,.34),Gt.iron),L.cylinder(new x(-6.9,Ke(-6.9),-1.1),new x(-6.9,Ke(-6.9)+.6,-1.1),.06,.04,6,new J(.8,.6,.3))}let M=7,w=10.9,T=Hi(M)+1.15;{let L=o.castle,U=O=>Math.max(po(Math.min(O,Ui-.3),Math.min(Hi(O),T))*1.02,.25);for(let O=0;O<8;O++)for(let k=M;k<w-.01;k+=.4){let W=k+.2,q=U(W)+.15,at=-1+2*O/8,it=-1+2*(O+1)/8,lt=new x(k,T,at*q),wt=new x(k+.4,T,at*(U(k+.4)+.15)),gt=new x(k+.4,T,it*(U(k+.4)+.15)),K=new x(k,T,it*q),tt=Gt.deck.clone().multiplyScalar(.85+(O*7+Math.floor(k*3))%5*.04);L.quad(lt,K,gt,wt,tt);let dt=new x(0,-.08,0);L.quad(wt.clone().add(dt),gt.clone().add(dt),K.clone().add(dt),lt.clone().add(dt),Gt.inner)}for(let O of[-1,1])for(let k=M;k<w-.3;k+=.4){let W=k+.2,q=(U(W)+.1)*O,at=Hi(W)-.2,it=Math.floor((W-M)/.8)%2===0?Gt.paintRed:Gt.paintOchre;L.box(new x(W,(at+T)/2,q),new x(.2,0,0),new x(0,(T-at)/2,0),new x(0,0,.06),it.clone().lerp(Gt.plank,.5))}{let O=[];for(let k=M+.05;k<=w-.15;k+=.6)O.push([k,-(U(k)+.1)]);O.push([w+.05,0]);for(let k=w-.15;k>=M+.05;k-=.6)O.push([k,U(k)+.1]);nd(L,O,T,.62,[],i,!1)}o.mast.cylinder(new x(8.6,T-.1,0),new x(8.6,T+1.1,0),.17,.15,7,Gt.plankDark,!0,O=>O%3===0?.25:-.1),o.mast.cylinder(new x(10.6,T-.3,0),new x(12.4,T+.5,0),.14,.11,6,Gt.plankDark,!0,O=>O%2?.2:-.1)}o.mast.cylinder(new x(.5,.25,0),new x(.5,Ke(.5)+2.3,0),.32,.29,9,new J(.5,.4,.3),!0,L=>[.5,-.2,.15,.7,-.1,.3,-.25,.1,.4][L]),o.mast.cylinder(new x(.5,Ke(.5)+.3,0),new x(.5,Ke(.5)+.45,0),.35,.35,9,Gt.iron,!1);let P=ry(o.floor,e);ay(o.cargo,o.floor,P,e,i);let N=Nt({vertexColors:!0,side:me,moss:{color:5662778,amount:.9}}),F={},D={hull:$e.HULL,rib:$e.RIB,deck:$e.DECK,coaming:$e.COAMING,castle:$e.CASTLE,mast:$e.MAST,floor:$e.FLOOR,cargo:$e.CARGO};for(let L of Object.keys(o)){if(o[L].empty)continue;let U=new ut(o[L].build(),L==="floor"?Nt({vertexColors:!0,seabed:!1}):N);U.castShadow=!0,U.name="wreck-"+L,U.userData.tag=D[L],e.add(U),F[L]=U}t.position.set(ie.x,0,ie.z),t.updateMatrixWorld(!0);let z=1/0;{let L=F.hull,U=L.geometry.attributes.position,O=new x;for(let k=0;k<U.count;k+=7){O.fromBufferAttribute(U,k).applyMatrix4(L.matrixWorld);let W=O.y-Be(O.x,O.z);W<z&&(z=W)}}return t.position.y=-z-.75,t.updateMatrixWorld(!0),{group:t,ship:e,meshes:F,floorInfo:P,rnd:i}}function nd(i,t,e,n,s,o,r=!0){let a=r?t.length:t.length-1,l=0;for(let c=0;c<a;c++){let[h,d]=t[c],[u,m]=t[(c+1)%t.length],g=Math.hypot(u-h,m-d),y=Math.max(1,Math.round(g/.42));for(let p=0;p<y;p++){let f=p/y,v=(p+1)/y;if(s.includes(c)&&f>.45)continue;let S=h+(u-h)*f,_=d+(m-d)*f,b=h+(u-h)*v,E=d+(m-d)*v,M=l++%2===0?n:n*.55,w=(Math.floor(l/2)%2===0?Gt.paintRed:Gt.paintOchre).clone().lerp(Gt.plank,.58).multiplyScalar(.85+o()*.2),T=new x((S+b)/2,e+M/2,(_+E)/2),P=new x((b-S)/2,0,(E-_)/2),N=new x(-(E-_),0,b-S).normalize().multiplyScalar(.07);i.box(T,P,new x(0,M/2,0),N,w),i.box(new x(T.x,e+M+.04,T.z),P.clone().multiplyScalar(1.02),new x(0,.05,0),N.clone().multiplyScalar(1.6),Gt.wale)}}}function ry(i,t){let e=ie.heel,n=Math.cos(e),s=Math.sin(e),o=-.15,r=[];for(let l=-6.6;l<=6.9;l+=.5){let c=[],h=Ke(l),d=0;for(let g=0;g<=40;g++){let y=g/40;ln(l,y,1).y<=h&&(d=y)}for(let g=24;g>=0;g--)c.push(ln(l,d*g/24,-1).clone());for(let g=1;g<=24;g++)c.push(ln(l,d*g/24,1).clone());let u=g=>g.y*n-g.z*s-o,m=[];for(let g=0;g<c.length;g++){let y=c[g],p=c[(g+1)%c.length],f=u(y),v=u(p);if(f<0!=v<0){let S=f/(f-v);m.push(y.clone().lerp(p,S))}}m.length>=2&&(m.sort((g,y)=>g.z-y.z),r.push({x:l,a:m[0],b:m[m.length-1]}))}let a=8;for(let l=0;l<r.length-1;l++){let c=r[l],h=r[l+1];for(let d=0;d<a;d++){let u=d/a,m=(d+1)/a,g=(E,A)=>(Math.sin(E*2.1+A*7)*.5+.5)*.12*Math.sin(A*Math.PI),y=(E,A)=>{let M=E.a.clone().lerp(E.b,A);return M.y+=g(E.x,A)*n,M.z-=g(E.x,A)*s,M},p=y(c,u),f=y(h,u),v=y(h,m),S=y(c,m),_=Math.sin((u+m)/2*Math.PI),b=Gt.holdMud.clone().multiplyScalar((.85+(l*3+d*5)%7*.035)*(.62+_*.38));i.quad(p,S,v,f,b)}}return{chords:r,level:o}}function ay(i,t,e,n,s){let o=n.quaternion.clone().invert(),r=new x(0,1,0).applyQuaternion(o),a=new x(1,0,0).addScaledVector(r,-r.x).normalize(),l=r.clone().cross(a).normalize(),c=(f,v,S=0)=>cy(e,f,v).addScaledVector(r,S),h=f=>a.clone().multiplyScalar(Math.cos(f)).addScaledVector(l,Math.sin(f)),d=(f,v)=>f.clone().multiplyScalar(1-v+s()*v*2),u=(f,v,S,_,b=.82,E=.3,A=.08)=>{let M=h(_),w=c(v,S,E-A),T=d(Gt.cask,.1),P=w.clone().addScaledVector(M,-b/2),N=w.clone().addScaledVector(M,b/2);f.cylinder(w,P,E,E*.84,9,T,!0),f.cylinder(w,N,E,E*.84,9,T,!0);for(let F of[-.36,-.14,.14,.36]){let D=w.clone().addScaledVector(M,F*b-.03),z=w.clone().addScaledVector(M,F*b+.03),L=E*(1-Math.abs(F)*.42)+.012;f.cylinder(D,z,L,L,9,Gt.iron,!1)}},m=(f,v,S,_,b=.32)=>{let E=h(_),A=r.clone().cross(E).normalize(),M=c(v,S,b*.8),w=d(Gt.plank,.08);f.box(M,E.clone().multiplyScalar(b*1.2),r.clone().multiplyScalar(b*.9),A.clone().multiplyScalar(b),w);for(let T=-1;T<=1;T++){let P=M.clone().addScaledVector(r,b*.9+.015).addScaledVector(A,T*b*.62);f.beam(P.clone().addScaledVector(E,-b*1.15),P.clone().addScaledVector(E,b*1.15),r,b*.5,.03,w.clone().multiplyScalar(T?.8:1.12))}},g=(f,v,S,_=.5)=>{for(let b=0;b<S;b++){let E=c(f+(s()-.5)*_*2,ge(v+(s()-.5)*_*.5,.02,.98),0),A=.08+s()*.1,M=h(s()*6.3).multiplyScalar(A*(1+s()*.5)),w=r.clone().multiplyScalar(A*(.55+s()*.35)),T=r.clone().cross(M).normalize().multiplyScalar(A*(.8+s()*.4));t.box(E.addScaledVector(r,w.length()*.45),M,w,T,d(Gt.stone,.12))}},y=(f,v,S,_)=>{let b=h(S),E=c(f,v,.03);t.beam(E.clone().addScaledVector(b,-_/2),E.clone().addScaledVector(b,_/2),r,.17,.045,d(Gt.deck,.12))},p=(f,v,S)=>{let _=h(S),b=c(f,v,.13);t.cylinder(b.clone().addScaledVector(_,-.18),b.clone().addScaledVector(_,.12),.1,.16,8,Gt.clay,!1,E=>E%3===0?-.06:.02);for(let E=0;E<4;E++){let A=c(f+(s()-.5)*.7,ge(v+(s()-.5)*.18,.02,.98),.02),M=h(s()*6.3).multiplyScalar(.07);t.box(A,M,r.clone().multiplyScalar(.015),r.clone().cross(M).normalize().multiplyScalar(.05),Gt.clay.clone().multiplyScalar(.9))}};u(i,.45,.8,.25),u(i,.3,.3,1.35,.78,.29),m(i,.62,.55,.15),u(i,4.9,.25,-.35),m(i,4.85,.72,.5,.3),u(i,5.15,.5,1.2,.76,.27),g(1.35,.12,6,.35),g(2.2,.9,5,.4),g(3.55,.1,6,.4),g(4.05,.88,4,.3),y(2.15,.2,.35,1.2),y(3.75,.55,1.75,.95),y(1.4,.72,-.5,.8),p(3.6,.32,2.2)}function cy(i,t,e){let n=i.chords,s=0;for(;s<n.length-2&&n[s+1].x<t;)s++;let o=n[s],r=n[s+1],a=ge((t-o.x)/(r.x-o.x),0,1),l=o.a.clone().lerp(r.a,a),c=o.b.clone().lerp(r.b,a);return l.lerp(c,e)}function sd(i){let t=new Cc(ie.x-20,ie.z-20,ie.x+20,ie.z+20,.12),e=["floor","cargo","hull","rib","deck","coaming","castle","mast"];for(let n of e)i.meshes[n]&&t.addMesh(i.meshes[n],i.meshes[n].userData.tag);return t}function od(i){let t=Ce(99),e=new yt;e.name="wreck-extras";let n=new Bt,s=new Bt,o=new J(.5,.41,.31),r=new J(.36,.3,.24),a=new J(.52,.46,.34),l=new x(.5,Ke(.5)+2.3,0).applyMatrix4(i.ship.matrixWorld),c=fo(.9,9),h=new x(Math.sin(ie.yaw)*.86-Math.cos(ie.yaw)*0,0,Math.cos(ie.yaw)*.86),d=new x(Math.sin(ie.yaw),0,Math.cos(ie.yaw)),u=new x(Math.cos(ie.yaw),0,-Math.sin(ie.yaw));h.copy(d).multiplyScalar(.8).addScaledVector(u,-.6).normalize();let m=12.5,g=[];for(let A=0;A<=10;A++){let M=A/10,w=c.x+h.x*m*M,T=c.z+h.z*m*M;g.push(new x(w,Be(w,T)+.28-.12*M,T))}for(let A=0;A<g.length-1;A++){let M=.3-.012*A,w=.3-.012*(A+1);n.cylinder(g[A],g[A+1],M,w,8,o.clone().multiplyScalar(.92+t()*.12),!1)}n.cylinder(g[0].clone().addScaledVector(h,-.01),g[0].clone().addScaledVector(h,-.45),.3,.26,8,r,!0,A=>A%2?.25:-.15);{let A=g[8],M=new x(0,1,0),w=h.clone().cross(M).normalize(),T=A.clone().add(new x(0,.55,0));for(let P=0;P<12;P++){let N=P/12*Math.PI*2,F=(P+1)/12*Math.PI*2,D=T.clone().addScaledVector(h,Math.cos(N)*.85).addScaledVector(M,Math.sin(N)*.85),z=T.clone().addScaledVector(h,Math.cos(F)*.85).addScaledVector(M,Math.sin(F)*.85);n.beam(D,z,w,.5,.08,P%3===0?r:o)}}let y=g[5].clone().add(new x(0,.3,0)),p=new x(-h.z,0,h.x).applyAxisAngle(new x(0,1,0),.35),f=y.clone().addScaledVector(p,-4.6),v=y.clone().addScaledVector(p,3.8);f.y=Be(f.x,f.z)+.15,v.y=Be(v.x,v.z)+.2,n.cylinder(f,y,.12,.16,6,o,!1),n.cylinder(y,v,.16,.11,6,o,!0);let S=new ut(n.build(),Nt({vertexColors:!0,moss:{color:5662778,amount:.9}}));S.castShadow=!0,S.userData.tag=$e.MAST,e.add(S);{let P=p.clone(),N=new x(-p.z,0,p.x);N.dot(d)<0&&N.negate();let F=[],D=[],z=[],L=[],U=[],O=new J(.62,.57,.47);for(let q=0;q<=10;q++){U.push([]);for(let at=0;at<=16;at++){let it=at/16-.5,lt=q/10,wt=y.clone().addScaledVector(P,it*7).addScaledVector(N,lt*4.2*.8),gt=Math.sin(it*7+lt*2)*.12+Math.sin(lt*5)*.1;wt.y=Be(wt.x,wt.z)+.12+gt+lt*lt*1,F.push(wt.x,wt.y,wt.z),D.push(lt*lt*(.7+.3*Math.abs(Math.sin(it*4))));let K=.82+.18*Math.sin(it*11+lt*6)*Math.sin(lt*9-it*3),tt=O.clone().multiplyScalar(K);(Math.abs(it+.12)<.05||Math.abs(lt-.45)<.05)&&tt.lerp(new J(.55,.26,.2),.8),z.push(tt.r,tt.g,tt.b),U[q].push(F.length/3-1)}}for(let q=0;q<10;q++)for(let at=0;at<16;at++){let it=at/16-.5,lt=q/10,wt=it>.12&&it<.3&&lt>.35&&lt<.62||it<-.32&&lt>.55,gt=lt>.65&&t()<(lt-.65)*2.4;if(wt||gt)continue;let K=U[q][at],tt=U[q][at+1],dt=U[q+1][at],Ct=U[q+1][at+1];L.push(K,dt,tt,tt,dt,Ct)}let k=new oe;k.setAttribute("position",new qt(F,3)),k.setAttribute("color",new qt(z,3)),k.setAttribute("aCloth",new qt(D,1)),k.setIndex(L),k.computeVertexNormals();let W=new ut(k,Nt({vertexColors:!0,cloth:.5,side:me}));W.castShadow=!0,e.add(W)}let _=[new x(0,4.1,3.5),new x(1.4,4.15,3.5),new x(-1.2,4.1,3.5),new x(.6,4.1,-3.45),new x(2,4.15,-3.4)].map(A=>A.applyMatrix4(i.ship.matrixWorld)),b=[g[3],g[5],g[7],g[6],g[9]];for(let A=0;A<_.length;A++){let M=_[A],w=b[A].clone().add(new x(0,.25,0)),T=10,P=M;for(let N=1;N<=T;N++){let F=N/T,D=M.clone().lerp(w,F);D.y-=Math.sin(F*Math.PI)*(.6+A*.15);let z=Be(D.x,D.z)+.05;D.y<z&&(D.y=z),s.beam(P,D,new x(0,1,0),.05,.05,a),P=D}}for(let A=0;A<4;A++){let M=g[2+A*2].clone().add(new x(0,.2,0)),w=M;for(let T=1;T<=6;T++){let P=M.clone().add(new x(Math.sin(T*.9+A)*.25,T*.38,Math.cos(T*.7+A)*.25));s.beam(w,P,new x(1,0,0),.045,.045,a),w=P}}let E=new ut(s.build(),Nt({vertexColors:!0}));E.castShadow=!0,e.add(E);{let A=new Bt,M=fo(Rc.along,Rc.side),w=Be(M.x,M.z),T=new yt,P=1.9,N=1.6;for(let D=0;D<6;D++){let z=-N/2+(D+.5)*(N/6);A.box(new x(0,0,z),new x(P/2,0,0),new x(0,.05,0),new x(0,0,.09),o.clone().multiplyScalar(.85+D%2*.1))}for(let D of[-P/2+.1,0,P/2-.1])A.box(new x(D,.07,0),new x(.07,0,0),new x(0,.05,0),new x(0,0,N/2),r);A.box(new x(0,-.32,N/2-.25),new x(.9,0,0),new x(0,.18,0),new x(0,0,.18),r);let F=new ut(A.build(),Nt({vertexColors:!0,moss:{color:5662778,amount:.8}}));F.castShadow=!0,T.add(F),T.position.set(M.x,w+.45,M.z),T.rotation.set(.42,ie.yaw+Rc.rot,0,"YXZ"),e.add(T)}return{group:e,mastMesh:S,mastBase:g[0],mastDir:h}}var Dc=class{constructor(){this.scene=new xs,this.sky=Q0(),this.scene.add(this.sky);let t=td();this.scene.add(t.group),this.lighthouse=t.lighthouse,this.terrain=Y0(),this.scene.add(this.terrain);let e=new ut(new Nn(2400,2400),Nt({color:2503471,flat:!0}));e.rotation.x=-Math.PI/2,e.position.set(-55,-62,0),e.name="abyss",this.scene.add(e),this.wreck=id(),this.scene.add(this.wreck.group),this.wreckZ=sd(this.wreck),this.extras=od(this.wreck),this.scene.add(this.extras.group),this.wreckZ.addMesh(this.extras.mastMesh,$e.MAST);let n=[...B0.map(o=>({x:o.x,z:o.z,r:1.4})),...G0.map(o=>({...fo(o.along,o.side),r:1.3})),{x:ie.x+1.5,z:ie.z,r:9.5},{x:ws.x,z:ws.z,r:1}];this.decor=Z0(n),this.scene.add(this.decor.group);let s=$0();this.scene.add(s.group),this.lane=s.group,this.buoys=s.buoys,this.mark=ly(),this.scene.add(this.mark),this.water=J0(),this.scene.add(this.water)}surfaceAt(t,e){let n=Be(t,e),s=this.wreckZ.sample(t,e);return s&&s.y>n?{y:s.y,tag:s.tag}:{y:n,tag:0}}};function ly(){let i=new yt,t=Nt({color:6968384}),e=Nt({color:14272928}),n=Nt({color:12077622,cloth:.25,side:me}),s=Be(ws.x,ws.z),o=-s+4.2,r=new ut(new qe(.11,.15,o,6),t);r.position.y=s+o/2;let a=new ut(new qe(.13,.13,.6,6),e);a.position.y=1.4;let l=new ut(new dn(1.1,.1,.1),t);l.position.y=3.6;let c=new ut(new Nn(1,.6,6,2),n);return c.geometry.translate(.5,0,0),c.position.set(.1,3.85,0),i.add(r,a,l,c),i.traverse(h=>{h.isMesh&&(h.castShadow=!0)}),i.position.set(ws.x,0,ws.z),i.rotation.y=.4,i}var I=(i,t,e)=>new x(i,t,e),zt=(i,t,e)=>new J(i,t,e),j={brass:zt(.88,.68,.3),brassDark:zt(.6,.42,.18),bronze:zt(.72,.5,.28),iron:zt(.36,.3,.27),rust:zt(.55,.32,.2),wood:zt(.5,.36,.22),woodDark:zt(.34,.24,.15),oak:zt(.42,.3,.19),clay:zt(.76,.44,.28),clayDark:zt(.56,.3,.2),glaze:zt(.36,.42,.3),copper:zt(.8,.46,.3),patina:zt(.38,.62,.52),rope:zt(.62,.52,.36),canvas:zt(.66,.6,.46),lead:zt(.5,.52,.55),silver:zt(.92,.93,.96),silverDark:zt(.62,.64,.68),wax:zt(.62,.16,.12),glass:zt(.55,.7,.66)};function Mh(i,t,e,n,s=0,o=0,r=0,a=null){for(let l=0;l<t.length-1;l++){let[c,h]=t[l],[d,u]=t[l+1];for(let m=0;m<e;m++){let g=m/e*Math.PI*2,y=(m+1)/e*Math.PI*2,p=I(o+Math.cos(g)*c,s+h,r+Math.sin(g)*c),f=I(o+Math.cos(y)*c,s+h,r+Math.sin(y)*c),v=I(o+Math.cos(y)*d,s+u,r+Math.sin(y)*d),S=I(o+Math.cos(g)*d,s+u,r+Math.sin(g)*d),_=a?a(l,m):n;i.quad(p,S,v,f,_)}}}function Lc(i,t,e,n,s,o){for(let r=0;r<t.length-1;r++){let[a,l]=t[r],[c,h]=t[r+1],d=typeof s=="function"?s(r):s;for(let u=0;u<e;u++){let m=u/e*Math.PI*2,g=(u+1)/e*Math.PI*2,y=[I(Math.cos(m)*a,l,Math.sin(m)*a),I(Math.cos(g)*a,l,Math.sin(g)*a),I(Math.cos(g)*c,h,Math.sin(g)*c),I(Math.cos(m)*c,h,Math.sin(m)*c)],p=(f,v)=>y[0].clone().lerp(y[1],f).lerp(y[3].clone().lerp(y[2],f),v);for(let f=0;f<n;f++)for(let v=0;v<d;v++)i.quad(p(f/n,v/d),p(f/n,(v+1)/d),p((f+1)/n,(v+1)/d),p((f+1)/n,v/d),o(r,u,f,v,d))}}}function Re(i,t,e,n){if(t.length===3){let[o,r,a]=t;r.clone().sub(o).cross(a.clone().sub(o)).dot(e)>=0?i.tri(o,r,a,n):i.tri(o,a,r,n);return}let s=t.reduce((o,r)=>o.add(r),I(0,0,0)).multiplyScalar(1/t.length);for(let o=0;o<t.length;o++){let r=t[o],a=t[(o+1)%t.length];a.clone().sub(r).cross(s.clone().sub(r)).dot(e)>=0?i.tri(r,a,s,n):i.tri(r,s,a,n)}}function Ss(i,t,e,n,s,o,r=6){Re(i,Array.from({length:r},(a,l)=>I(t+Math.cos(l/r*Math.PI*2)*s,e,n+Math.sin(l/r*Math.PI*2)*s)),I(0,1,0),o)}var Qt=(i,t)=>i.clone().multiplyScalar(t);function dr(i,t,e,n,s,o,r=Qt(o,.66)){let a=I(0,1,0);i.beam(t,e,a,n,s,o);let l=e.clone().sub(t),c=l.length();if(!r||c<.02)return;l.normalize();let h=l.clone().cross(a).normalize(),d=I(0,s/2+4e-4,0),u=Math.min(.012,c*.22),m=t.clone().addScaledVector(h,n*.45).add(d),g=t.clone().addScaledVector(l,c*.72).addScaledVector(h,-n*.45).add(d);Re(i,[m,m.clone().addScaledVector(l,u),g.clone().addScaledVector(l,u),g],a,r)}function Ts(i,t,e,n,s,o,r="y"){for(let a=0;a<s;a++){let l=a/s*Math.PI*2,c=(a+1)/s*Math.PI*2,h,d;r==="y"?(h=I(t.x+Math.cos(l)*e,t.y,t.z+Math.sin(l)*e),d=I(t.x+Math.cos(c)*e,t.y,t.z+Math.sin(c)*e)):r==="x"?(h=I(t.x,t.y+Math.cos(l)*e,t.z+Math.sin(l)*e),d=I(t.x,t.y+Math.cos(c)*e,t.z+Math.sin(c)*e)):(h=I(t.x+Math.cos(l)*e,t.y+Math.sin(l)*e,t.z),d=I(t.x+Math.cos(c)*e,t.y+Math.sin(c)*e,t.z)),i.beam(h,d,r==="y"?I(0,1,0):r==="x"?I(1,0,0):I(0,0,1),n,n,o)}}var fr={tube(i){i.metal.cylinder(I(-.72/2,0,0),I(.72/2,0,0),.085,.085,10,j.brass,!1),i.metal.cylinder(I(.72/2,0,0),I(.72/2+.07,0,0),.085+.016,.085+.012,10,j.brassDark,!0),i.metal.cylinder(I(-.72/2-.06,0,0),I(-.72/2,0,0),.085+.014,.085+.016,10,j.brassDark,!1),i.metal.cylinder(I(-.72/2-.06,0,0),I(-.72/2-.1,0,0),.085+.014,.03,10,j.brass,!0);for(let n of[-.2,0,.2])i.metal.cylinder(I(n-.012,0,0),I(n+.012,0,0),.085+.012,.085+.012,10,j.brassDark,!1);return i.metal.tri(I(-.08,.02,.085+.004),I(.06,.02,.085+.004),I(-.02,.075,.085*.55+.004),j.brassDark),i.metal.box(I(-.01,-.012,.085+.003),I(.08,0,0),I(0,.01,0),I(0,0,.003),j.brassDark),i.matte.box(I(.72/2+.075,0,0),I(.012,0,0),I(0,.04,0),I(0,0,.04),j.wax),Ts(i.metal,I(.1,.085+.03,0),.03,.012,6,j.brassDark,"x"),{h:.2,r:.42}},pulley(i){let t=[j.wood,j.wood.clone().multiplyScalar(.88),j.wood.clone().multiplyScalar(1.06),j.woodDark];for(let e of[-1,1]){let n=[0,.07,.15,.21,.28];for(let s=0;s<n.length-1;s++){let o=(n[s]+n[s+1])/2,r=(n[s+1]-n[s])/2;for(let[a,l]of[[-.1,-.016],[.016,.1]])i.matte.box(I(e*.046,o,(a+l)/2),I(.024,0,0),I(0,r,0),I(0,0,(l-a)/2),t[(s+(a>0?1:0))%3])}i.metal.box(I(e*.046,.14,0),I(.024,0,0),I(0,.14,0),I(0,0,.016),j.iron),i.metal.cylinder(I(e*.07,.12,0),I(e*.0728,.12,0),.026,.026,8,j.rust,!0)}i.matte.box(I(0,.262,0),I(.022,0,0),I(0,.018,0),I(0,0,.06),j.woodDark),i.matte.box(I(0,.012,0),I(.022,0,0),I(0,.012,0),I(0,0,.1),j.woodDark),i.metal.box(I(0,.285,0),I(.066,0,0),I(0,.005,0),I(0,0,.014),j.iron),i.metal.cylinder(I(-.075,.12,0),I(.075,.12,0),.016,.016,6,j.bronze,!0),i.metal.cylinder(I(-.02,.12,0),I(-.012,.12,0),.105,.105,12,j.bronze,!0),i.metal.cylinder(I(.012,.12,0),I(.02,.12,0),.105,.105,12,j.bronze,!0),i.metal.cylinder(I(-.012,.12,0),I(.012,.12,0),.092,.092,12,j.brassDark,!0),i.matte.beam(I(0,.222,-.02),I(0,.214,.045),I(1,0,0),.016,.014,j.rope),i.matte.beam(I(0,.214,.045),I(0,.17,.088),I(1,0,0),.016,.014,j.rope);for(let e=0;e<3;e++)i.matte.beam(I(0,.17,.088),I((e-1)*.008,.13-e*.012,.094),I(0,0,1),.005,.005,j.rope);return Ts(i.metal,I(0,.33,0),.05,.016,8,j.bronze,"z"),i.metal.box(I(0,.292,0),I(.012,0,0),I(0,.01,0),I(0,0,.02),j.rust),{h:.38,r:.22}},hinge(i){let t=Qt(j.bronze,.72),e=zt(.16,.1,.06),n=zt(.08,.06,.05),s=j.patina,o=I(0,1,0);i.metal.box(I(-.1,.008,0),I(.09,0,0),I(0,.008,0),I(0,0,.055),j.bronze);let r=.0168,a=(u,m)=>I(u,r,m);Re(i.metal,[a(-.188,-.053),a(-.012,-.053),a(-.012,-.045),a(-.188,-.045)],o,t),Re(i.metal,[a(-.188,.045),a(-.012,.045),a(-.012,.053),a(-.188,.053)],o,t),Re(i.metal,[a(-.188,-.045),a(-.18,-.045),a(-.18,.045),a(-.188,.045)],o,t),Re(i.metal,[a(-.146,.016),a(-.058,.016),a(-.07,.03),a(-.132,.03)],o,j.brassDark),Re(i.metal,[a(-.103,.016),a(-.097,.016),a(-.097,-.036),a(-.103,-.036)],o,j.brassDark),Re(i.metal,[a(-.106,.011),a(-.138,.011),a(-.106,-.03)],o,j.brassDark),Re(i.metal,[a(-.094,.011),a(-.068,.011),a(-.094,-.022)],o,j.brassDark);for(let u=0;u<4;u++)Re(i.metal,[a(-.15+u*.024,.04),a(-.138+u*.024,.035),a(-.126+u*.024,.04),a(-.138+u*.024,.044)],o,Qt(j.brassDark,1.1));[[-.165,-.03,.3],[-.165,.03,1.4],[-.035,-.03,2.2],[-.035,.03,.8]].forEach(([u,m,g])=>{i.metal.cylinder(I(u,.016,m),I(u,.0215,m),.0095,.0085,8,Qt(j.brass,.92),!0),i.metal.box(I(u,.0218,m),I(Math.cos(g)*.008,0,Math.sin(g)*.008),I(0,4e-4,0),I(-Math.sin(g)*.0018,0,Math.cos(g)*.0018),e)}),Re(i.metal,[a(-.188,-.01),a(-.176,-.016),a(-.168,-.004),a(-.176,.01),a(-.188,.006)],o,s),Re(i.metal,[a(-.05,-.044),a(-.03,-.044),a(-.024,-.038),a(-.04,-.033)],o,Qt(s,.9));let l=I(1,0,0).applyAxisAngle(I(0,0,1),.35),c=I(0,1,0).applyAxisAngle(I(0,0,1),.35),h=I(.1,.03,0),d=(u,m,g=.0088)=>h.clone().addScaledVector(l,u).addScaledVector(c,g).add(I(0,0,m));i.metal.box(h,Qt(l,.09),Qt(c,.008),I(0,0,.055),j.bronze),Re(i.metal,[d(-.088,-.053),d(.088,-.053),d(.088,-.045),d(-.088,-.045)],c,t),Re(i.metal,[d(-.088,.045),d(.088,.045),d(.088,.053),d(-.088,.053)],c,t),Re(i.metal,[d(.08,-.045),d(.088,-.045),d(.088,.045),d(.08,.045)],c,t);for(let[u,m,g]of[[-.035,.03,1.1],[.055,-.03,2.6]]){let p=(b,E)=>Array.from({length:8},(A,M)=>d(u+Math.cos(M/8*6.283)*b,m+Math.sin(M/8*6.283)*b,E));Re(i.metal,p(.009,.0092),c,Qt(j.brass,.92));let f=Math.cos(g)*.007,v=Math.sin(g)*.007,S=-Math.sin(g)*.0016,_=Math.cos(g)*.0016;Re(i.metal,[d(u-f-S,m-v-_,.0096),d(u+f-S,m+v-_,.0096),d(u+f+S,m+v+_,.0096),d(u-f+S,m-v+_,.0096)],c,e)}for(let[u,m]of[[-.035,-.03],[.055,.03]]){let y=p=>Array.from({length:8},(f,v)=>d(u+Math.cos(v/8*6.283)*p,m+Math.sin(v/8*6.283)*p,.0092));Re(i.metal,y(.0105),c,t),Re(i.metal,y(.0065),c,n)}Re(i.metal,[d(.06,.012),d(.085,.004),d(.088,.03),d(.07,.034)],c,s),i.metal.cylinder(I(0,.012,-.059),I(0,.012,.059),.011,.011,6,Qt(j.brassDark,.55),!0);for(let u=0;u<5;u++){let m=-.06+u*.0246,g=m+.0216,y=u%2?j.bronze:Qt(j.bronze,.86);i.metal.cylinder(I(0,.012,m),I(0,.012,g),.016,.016,6,y,!0),Re(i.metal,Array.from({length:6},(p,f)=>I(Math.cos(f/6*6.283)*.016,.012+Math.sin(f/6*6.283)*.016,m)),I(0,0,-1),y)}return{h:.06,r:.18}},anchor(i){let t=j.iron,e=j.rust;i.metal.beam(I(-.75,.06,0),I(.72,.06,0),I(0,1,0),.085,.085,t);let n=o=>{let r=[I(-.75,.06,0),I(-.68,.06,o*.22),I(-.52,.06,o*.4),I(-.3,.06,o*.5)];for(let l=0;l<r.length-1;l++)i.metal.beam(r[l],r[l+1],I(0,1,0),.075,.08,l===0?e:t);let a=r[3];i.metal.tri(a.clone().add(I(-.12,0,-o*.1)),a.clone().add(I(.16,0,o*.04)),a.clone().add(I(-.06,0,o*.14)),e),i.metal.tri(a.clone().add(I(-.12,.012,-o*.1)),a.clone().add(I(-.06,.012,o*.14)),a.clone().add(I(.16,.012,o*.04)),e)};n(1),n(-1),Ts(i.metal,I(.85,.06,0),.13,.04,10,t,"y"),i.matte.beam(I(.56,.06,0),I(.56,.06,0),I(0,1,0),.1,.1,j.woodDark),i.matte.box(I(.56,.12,.08),I(.06,0,0),I(0,.06,0),I(0,0,.55),j.woodDark),i.metal.box(I(.56,.12,.42),I(.065,0,0),I(0,.065,0),I(0,0,.025),t),i.metal.box(I(.56,.12,-.25),I(.065,0,0),I(0,.065,0),I(0,0,.025),t);let s=[I(.95,.06,0),I(1.15,.05,.05),I(1.35,.05,.02),I(1.5,.05,-.05)];for(let o=0;o<s.length-1;o++)i.matte.beam(s[o],s[o+1],I(0,1,0),.06,.06,j.rope);for(let o=0;o<4;o++)i.matte.beam(I(1.5,.05,-.05),I(1.6+o*.02,.05+o%2*.03,-.1+o*.05),I(0,1,0),.015,.015,j.rope);return{h:.2,r:.95}},jar(i,t){let e=[[.05,0],[.12,.02],[.17,.12],[.205,.28],[.19,.4],[.13,.48],[.07,.53],[.065,.6],[.08,.62],[.06,.63]],n=Ce(Math.floor(t*1e3)+5),s=n()*Math.PI*2,o=zt(.3,.15,.09),r=j.clay.clone().multiplyScalar(.9),a=zt(.86,.84,.74),l=zt(.34,.46,.3),c=Array.from({length:216},()=>n()),h=[0,1,2,1];Lc(i.matte,e,12,3,d=>d===3?5:d===1||d===2?4:1,(d,u,m,g)=>{if(d===0)return j.clayDark;if(d===4)return m===1&&u%3===0?j.glaze.clone().multiplyScalar(.82):j.glaze;if(d===5)return j.clayDark;if(d>=7)return u===Math.floor(t*12)%12&&m===1?j.clayDark.clone().multiplyScalar(.7):j.clay;if(d===3)return g===0||g===4||h[(u*3+m)%4]===g-1?o:j.clay;if(d===1||d===2){let y=(u+(m+.5)/3)/12*Math.PI*2,p=Math.cos(y-s),f=d===1?1-g*.15:.45-g*.12,v=c[(u*3+m)*6+(d-1)*3+Math.min(g,2)];if(p>.2&&v<f*p*.75)return v<f*p*.3?a:l;if(d===2&&g===2)return r}return j.clay});for(let d of[-1,1]){let u=[I(0,.5,d*.07),I(0,.56,d*.17),I(0,.47,d*.21),I(0,.38,d*.19)];for(let m=0;m<u.length-1;m++)i.matte.beam(u[m],u[m+1],I(1,0,0),.04,.03,j.clayDark)}i.matte.cylinder(I(0,.6,0),I(0,.66,0),.058,.055,8,zt(.66,.52,.34),!0);for(let d of[.556,.574])Ts(i.matte,I(0,d,0),.07,.012,8,j.rope.clone().multiplyScalar(d>.56?1:.85),"y");return t>.5&&i.matte.box(I(0,.32,.2),I(.03,0,0),I(0,.03,0),I(0,0,.006),j.clayDark),{h:.66,r:.34,upright:!0}},copperset(i){let t=Ce(31),e=Array.from({length:360},()=>.86+t()*.22),n=Qt(j.copper,.6),s=Qt(j.copper,1.14),o=zt(.2,.15,.12),r=I(0,1,0);for(let h=0;h<5;h++){let d=.3-h*.04,u=h*.045,m=[[d*.75,u],[d,u+.04],[d*1.02,u+.14],[d*1.06,u+.15]],g=h%2?j.copper:Qt(j.copper,.9);Lc(i.metal,m,12,2,p=>p===1?3:1,(p,f,v,S)=>{let _=(f*2+v+h*5)%9===0,b=(f+h*3)%7===0;return p===0?h===0?o:Qt(g,.8):p===2?b?j.patina:s:b&&S>=1?j.patina:_&&S>=2-(f+h)%2?Qt(j.patina,.92):Qt(g,e[((h*12+f)*2+v)*3+S])});let y=[[d*.75-.006,u+.006],[d-.008,u+.042],[d*1.02-.008,u+.14],[d*1.06-.012,u+.15]];Mh(i.metal,y.slice().reverse(),12,n,0,0,0,(p,f)=>p===2&&(f+h)%4===0?Qt(j.patina,.8):(f+h)%2?n:Qt(n,.9)),Ts(i.metal,I(0,u+.15-.006,0),d*1.06-.006,.012,12,s)}let a=.14*.75-.006,l=4*.045+.007;Re(i.metal,Array.from({length:12},(h,d)=>I(Math.cos(d/12*6.283)*a,l,Math.sin(d/12*6.283)*a)),r,Qt(j.patina,.75)),Re(i.metal,Array.from({length:12},(h,d)=>I(Math.cos(d/12*6.283)*a*.65,l+6e-4,Math.sin(d/12*6.283)*a*.65)),r,Qt(n,.85)),i.metal.beam(I(.3,.1,0),I(.48,.12,0),I(0,1,0),.04,.025,Qt(j.copper,.8));for(let h of[-.011,.011])Ss(i.metal,.33,.1162,h,.006,s,6);Ss(i.metal,.455,.1305,0,.008,zt(.1,.07,.05),6);let c=[j.rope,Qt(j.rope,.92),Qt(j.rope,1.06)];for(let h=0;h<12;h++){let d=-.33+h*.055;dr(i.matte,I(d,.32,0),I(d+.055,.32,0),.04,.036,c[h%3]),dr(i.matte,I(0,.32,d),I(0,.32,d+.055),.04,.036,c[(h+1)%3])}return i.matte.box(I(0,.32,0),I(.034,0,0),I(0,.0179,0),I(0,0,.034),Qt(j.rope,.74)),i.matte.box(I(0,.3204,0),I(.012,0,.012),I(0,.0179,0),I(-.03,0,.03),Qt(j.rope,.95)),{h:.36,r:.42,upright:!0}},rope(i){let t=Ce(53),e=[1,.92,1.06],n=zt(.27,.2,.13),s=zt(.36,.42,.24),o=I(0,1,0);for(let d=0;d<5;d++){let u=.32-d*.045,m=.04+d*.045,g=Qt(j.rope,.85+d%2*.12);for(let y=0;y<12;y++){let p=y/12*Math.PI*2,f=(y+1)/12*Math.PI*2,v=I(Math.cos(p)*u,m,Math.sin(p)*u),S=I(Math.cos(f)*u,m,Math.sin(f)*u);for(let _=0;_<3;_++){let b=Qt(g,e[(y*3+_+d)%3]),E=d===0&&y===2&&_===1||d===1&&y===8&&_===1;E?b=n:d===0&&y>=6&&y<=9&&t()<.55&&(b=g.clone().lerp(s,.55+t()*.3)),dr(i.matte,v.clone().lerp(S,_/3),v.clone().lerp(S,(_+1)/3),.075,.07,b,E?null:void 0)}}}for(let[d,u,m]of[[1.75,.338,.009],[1.92,.344,.007],[2.2,.336,.01],[2.45,.342,.006]])Ss(i.matte,Math.cos(d+1.6)*u,.0755,Math.sin(d+1.6)*u,m,zt(.84,.82,.72),6),Ss(i.matte,Math.cos(d+1.6)*u,.0758,Math.sin(d+1.6)*u,m*.45,zt(.34,.3,.26),4);let r=I(.32,.04,0),a=I(.5,.03,.18),l=a.clone().sub(r).normalize(),c=l.clone().cross(o).normalize(),h=r.clone().lerp(a,.74);for(let d=0;d<4;d++)dr(i.matte,r.clone().lerp(h,d/4),r.clone().lerp(h,(d+1)/4),.07,.07,d===1?n:Qt(j.rope,e[d%3]),d===1?null:void 0);for(let[d,u,m]of[[-.021,-.012,1],[0,.014,.9],[.021,-.006,1.06]]){let g=a.clone().addScaledVector(c,d).add(I(0,u,0)),y=h.clone().addScaledVector(c,d*.5).add(I(0,u*.4,0));i.matte.beam(h.clone().addScaledVector(l,-.01),y,o,.03,.03,Qt(j.rope,m)),i.matte.beam(y,g,o,.028,.028,Qt(j.rope,1.22*m))}return{h:.26,r:.36,upright:!0}},barrel(i,t){let e=[[.24,0],[.28,.12],[.305,.4],[.28,.68],[.24,.8]],n=Ce(Math.floor(t*1e3)+11),s=6,o=[3,7,7,3],r=Array.from({length:14},()=>.82+n()*.22),a=Array.from({length:14*s*20},()=>n()),l=Qt(j.woodDark,.72),c=zt(.62,.48,.3),h=zt(.2,.13,.08),d=zt(.86,.84,.74),u=zt(.34,.44,.28),m=n()*Math.PI*2,g=[.1,.32,.48,.7];Lc(i.matte,e,14,s,_=>o[_],(_,b,E,A,M)=>{if(E===0)return l;let w=e[_][1]+(e[_+1][1]-e[_][1])*(A+.5)/M,T=Math.round(w/.04-.5),P=a[(b*s+E)*20+T];if(b===3&&E>=2&&E<=4&&(T===9||T===10))return E===3?c:h;let N=(b+(E+.5)/s)/14*Math.PI*2,F=Math.cos(N-m),D=T<3||T>16?1:.45;if(F>.3&&P<F*D*.32)return P<F*D*.12?d:u;for(let L of g){let U=L-.022;if(w<U&&U-w<.09&&a[(b*s+E)*20+19-g.indexOf(L)]<.2){let O=a[(b*s+E)*20+15-g.indexOf(L)]<.5?.045:.085;if(U-w<O)return j.wood.clone().lerp(j.rust,.65-(U-w)*3)}}let z=r[b]*(P<.1?.84:P>.93?1.08:1);return Qt(j.wood,z)});let y=.8,p=.24,f=.215,v=.775,S=I(0,1,0);for(let _=0;_<14;_++){let b=_/14*Math.PI*2,E=(_+1)/14*Math.PI*2,A=b+(E-b)/s,M=(w,T,P)=>I(Math.cos(T)*w,P,Math.sin(T)*w);Re(i.matte,[M(f,b,y),M(p,b,y),M(p,A,y),M(f,A,y)],S,l),Re(i.matte,[M(f,A,y),M(p,A,y),M(p,E,y),M(f,E,y)],S,Qt(j.wood,1.18*r[_]))}return Mh(i.matte,[[f,y],[f,v]],14,Qt(j.woodDark,.6)),Re(i.matte,Array.from({length:14},(_,b)=>I(Math.cos(b/14*6.283)*f,v-.002,Math.sin(b/14*6.283)*f)),S,l),[[-f,-.074,.94],[-.068,.068,1.04],[.074,f,.88]].forEach(([_,b,E])=>{let A=[];for(let M=0;M<=4;M++){let w=_+(b-_)*M/4;A.push(I(w,v,Math.sqrt(Math.max(0,f*f-w*w))*.985))}for(let M=4;M>=0;M--){let w=_+(b-_)*M/4;A.push(I(w,v,-Math.sqrt(Math.max(0,f*f-w*w))*.985))}Re(i.matte,A,S,Qt(j.oak,E))}),g.forEach((_,b)=>{let E=M=>{let w=0;for(;w<e.length-2&&M>e[w+1][1];)w++;let[T,P]=e[w],[N,F]=e[w+1];return T+(N-T)*(M-P)/(F-P)},A=_<.2||_>.65?[[E(_-.022)+.002,_-.022],[E(_+.022)+.002,_+.022]]:[[.309,_-.022],[.309,_+.022]];Lc(i.metal,A,14,2,2,(M,w,T,P)=>{if(P===1&&T===0&&(w+b)%3===0)return Qt(j.silverDark,.8);let N=a[(w*2+T)*4+P+b*3];return N<.22?zt(.32,.18,.11):N>.8?Qt(j.rust,1.22):j.rust})}),{h:.8,r:.42,upright:!0}},sack(i,t){let e=Ce(Math.floor(t*1e3)),s=new On(.28,1).attributes.position,o=new x,r=[];for(let m=0;m<s.count;m++)o.fromBufferAttribute(s,m),o.y*=.62,o.x*=1.15,o.multiplyScalar(.92+e()*.14),r.push(o.clone().add(I(0,.18,0)));let a=zt(.44,.32,.19),l=zt(.4,.22,.14),c=j.canvas.clone().multiplyScalar(.74),h=zt(.36,.28,.2),d=(m,g)=>{let y=m.x,p=m.y-.18,f=m.z;if(Math.abs(y+.15)<.026||Math.abs(y-.18)<.026)return p>-.12?a:a.clone().multiplyScalar(.85);if(p>.06){let v=Math.hypot(y-.015,f);if(Math.abs(v-.1)<.018||v<.075&&(Math.abs(y-.015)<.016||Math.abs(f)<.016))return l}return f>.12&&Math.abs(y)<.09&&p<.11&&p>-.07?Math.abs(y)>.068||f<.142||p>.088||p<-.048?h:c:g};for(let m=0;m<r.length;m+=3){let g=j.canvas.clone().multiplyScalar(.88+e()*.16),y=r[m],p=r[m+1],f=r[m+2],v=8,S=(_,b)=>y.clone().multiplyScalar(1-(_+b)/v).addScaledVector(p,_/v).addScaledVector(f,b/v);for(let _=0;_<v;_++)for(let b=0;b<v-_;b++){let E=[S(_,b),S(_+1,b),S(_,b+1)];if(i.matte.tri(E[0],E[1],E[2],d(E[0].clone().add(E[1]).add(E[2]).multiplyScalar(1/3),g)),_+b<v-1){let A=[S(_+1,b),S(_+1,b+1),S(_,b+1)];i.matte.tri(A[0],A[1],A[2],d(A[0].clone().add(A[1]).add(A[2]).multiplyScalar(1/3),g))}}}let u=m=>[I(.3+.12*m,.2+.02*m,0),.07-.02*m];for(let[m,g,y]of[[0,.3,j.canvas.clone().multiplyScalar(.8)],[.3,.5,j.rope],[.5,.88,j.canvas.clone().multiplyScalar(.8)],[.88,1,j.canvas.clone().multiplyScalar(.62)]]){let[p,f]=u(m),[v,S]=u(g);i.matte.cylinder(p,v,f,S,6,y,g===1)}return i.matte.beam(I(.33,.21,0),I(.33,.1,.04),I(1,0,0),.015,.015,j.rope),i.metal.cylinder(I(.33,.08,.02),I(.33,.08,.06),.045,.045,8,j.lead,!0),i.metal.box(I(.33,.08,.061),I(.018,0,0),I(0,.006,0),I(0,0,.0015),zt(.3,.32,.35)),i.metal.box(I(.33,.08,.061),I(.006,0,0),I(0,.018,0),I(0,0,.0015),zt(.3,.32,.35)),{h:.36,r:.36,upright:!0}},chest(i){i.matte.box(I(0,.2/2,0),I(.25,0,0),I(0,.2/2,0),I(0,0,.17),j.oak);for(let r of[.2*.36,.2*.7]){for(let a of[-1,1])i.matte.box(I(0,r,a*(.17+.002)),I(.25-.004,0,0),I(0,.004,0),I(0,0,.002),j.woodDark);for(let a of[-1,1])i.matte.box(I(a*(.25+.002),r,0),I(.002,0,0),I(0,.004,0),I(0,0,.17-.004),j.woodDark)}for(let r of[-.17,0,.17])if(i.metal.box(I(r,.2/2,.17+.006),I(.022,0,0),I(0,.2/2+.004,0),I(0,0,.006),j.iron),i.metal.box(I(r,.2/2,-.17-.006),I(.022,0,0),I(0,.2/2+.004,0),I(0,0,.006),j.iron),i.metal.box(I(r,.004,0),I(.022,0,0),I(0,.006,0),I(0,0,.17+.006),j.iron),r!==0)for(let a of[.045,.155])i.metal.box(I(r,a,.17+.013),I(.008,0,0),I(0,.008,0),I(0,0,.004),j.silverDark);for(let r of[-1,1])for(let a of[-1,1])i.metal.box(I(r*(.25-.02),.2/2,a*(.17-.02)),I(.03,0,0),I(0,.2/2+.006,0),I(0,0,.03),j.iron);for(let r of[-1,1])i.metal.box(I(r*(.25+.006),.2*.62,0),I(.006,0,0),I(0,.022,0),I(0,0,.04),j.iron),Ts(i.metal,I(r*(.25+.02),.2*.5,0),.042,.012,8,j.rust,"x");i.metal.box(I(0,.2-.045,.17+.012),I(.048,0,0),I(0,.052,0),I(0,0,.006),j.rust),i.metal.box(I(0,.2-.04,.17+.019),I(.008,0,0),I(0,.016,0),I(0,0,.002),zt(.08,.06,.05)),i.metal.box(I(0,.2-.02,.17+.019),I(.012,0,0),I(0,.006,0),I(0,0,.002),zt(.08,.06,.05)),i.matte.box(I(0,.2-.03,0),I(.25-.03,0,0),I(0,.01,0),I(0,0,.17-.03),zt(.3,.2,.14));let s=Ce(17),o=[zt(.7,.72,.77),zt(.58,.6,.66),zt(.46,.48,.53),zt(.78,.77,.72)];for(let r=0;r<78;r++){let a=s()-.5,l=s()-.5,c=a*(.25*2-.08),h=l*(.17*2-.06),d=.05*(1-4*a*a)*(1-4*l*l),u=.2-.02+d+s()*.012,g=s()<.04?j.brass:o[Math.floor(s()*o.length)],y=(s()-.5)*.012,p=(s()-.5)*.012;i.metal.cylinder(I(c,u,h),I(c+y,u+.008,h+p),.022,.022,7,g,!0)}for(let[r,a,l]of[[.06,.17+.07,.3],[-.1,.17+.12,1.2],[.19,.17+.05,2],[-.02,.17+.18,.7]])i.metal.cylinder(I(r,.002,a),I(r+Math.cos(l)*.002,.01,a+Math.sin(l)*.002),.022,.022,7,o[Math.round(l*10)%3],!0);return{h:.2+.06,r:.36,upright:!0,lid:{W:.25,D:.17,H:.2}}},seal(i){let e=.11475000000000002,n=.05*1.35,s=e,o=.2,r=Math.cos(o),a=Math.sin(o),l=(y,p,f)=>{let v=y+.162,S=p;return I(v*r-S*a,v*a+S*r-.026*1.35,f)},c=(y,p,f)=>I(y*r-p*a,y*a+p*r,f),h=(y,p,f,v,S,_,b,E=i.metal)=>E.cylinder(l(y,s,0),l(p,s,0),f,v,S,_,b);h(-n,0,e,e,12,j.brass,!1),h(-n,-n-.014*1.35,e,.05*1.35,12,j.brassDark,!0);let d=[[.05,0],[.026,.02],[.021,.05],[.032,.062],[.032,.074],[.022,.086],[.026,.12],[.036,.135],[.042,.155],[.036,.175],[.018,.188],[0,.192]];for(let y=0;y<d.length-1;y++){let[p,f]=d[y],[v,S]=d[y+1];h(-n-(.014+f)*1.35,-n-(.014+S)*1.35,p*1.35,Math.max(.001,v*1.35),10,y===3||y>=7?j.brass:j.brassDark,y===d.length-2)}h(0,.006*1.35,e-.006*1.35,e-.006*1.35,12,j.wax,!0,i.matte),h(0,.009*1.35,e,e-.004*1.35,12,j.brassDark,!1);let u=.0085*1.35,m=(y,p,f,v,S=0)=>i.metal.box(l(u,s+p*1.35,y*1.35),c(.0022*1.35,0,0),c(0,Math.cos(S)*v*1.35,Math.sin(S)*v*1.35),c(0,-Math.sin(S)*f*1.35,Math.cos(S)*f*1.35),j.brass),g=y=>{let[p,f,v]=y.map(([_,b])=>l(u+.0027,s+b*1.35,_*1.35));f.clone().sub(p).cross(v.clone().sub(p)).x>=0?i.metal.tri(p,f,v,j.brass):i.metal.tri(p,v,f,j.brass)};return m(0,-.016,.04,.007),m(0,-.026,.028,.005),m(0,.012,.0025,.03),g([[.004,.04],[.004,-.007],[.036,-.007]]),g([[-.004,.034],[-.004,-.007],[-.03,-.007]]),m(-.021,-.05,.0022,.011,.35),m(-.013,-.05,.0022,.011,-.35),m(.016,-.05,.0022,.009),m(.022,-.041,.006,.0022),m(.022,-.059,.006,.0022),{h:2*e+.02,r:.2,upright:!1,face:[r,a,0]}},lantern(i){i.metal.cylinder(I(0,0,0),I(0,.06,0),.17,.16,8,j.bronze,!0);for(let e=0;e<4;e++){let n=e/4*Math.PI*2+Math.PI/4;i.metal.beam(I(Math.cos(n)*.14,.06,Math.sin(n)*.14),I(Math.cos(n)*.12,.62-.12,Math.sin(n)*.12),I(0,0,1),.025,.025,j.bronze)}return Mh(i.metal,[[.16,.62-.12],[.17,.62-.1],[.1,.62-.02],[.04,.62+.04],[0,.62+.05]],8,j.bronze),Ts(i.metal,I(0,.62+.1,0),.05,.016,8,j.bronzeDark||j.brassDark,"x"),i.matte.box(I(0,.28,.135),I(.09,0,0),I(0,.17,0),I(0,0,.004),j.glass),i.matte.tri(I(-.1,.06,-.13),I(-.02,.06,-.13),I(-.08,.2,-.13),j.glass),i.metal.cylinder(I(0,.06,0),I(0,.16,0),.03,.025,6,j.brassDark,!0),{h:.62+.12,r:.4,upright:!0}},plank(i,t){let e=Ce(Math.floor(t*999)),n=1.7,s=.12,o=.03;i.matte.box(I(0,o,0),I(n/2,0,0),I(0,o,0),I(0,0,s),j.oak.clone().multiplyScalar(.95+e()*.1)),i.matte.tri(I(n/2,o*2,-s),I(n/2+.16,o*2,-s*.3),I(n/2,o*2,s*.4),j.oak);for(let r=0;r<4;r++)i.matte.box(I(-.6+r*.32,o*2+.001,0),I(.012,0,0),I(0,.001,0),I(0,0,.012),j.woodDark);return{h:.06,r:.95}},stave(i){for(let t=0;t<6;t++){let e=t/6,n=(t+1)/6,s=Math.sin(e*Math.PI)*.06,o=Math.sin(n*Math.PI)*.06;i.matte.beam(I(-.4+e*.8,s+.02,0),I(-.4+n*.8,o+.02,0),I(0,1,0),.09,.025,j.wood)}return i.metal.box(I(.2,.08,0),I(.02,0,0),I(0,.01,0),I(0,0,.05),j.rust),{h:.1,r:.45}},ropebit(i){let t=[I(-.35,.04,0),I(-.15,.04,.06),I(.05,.035,.02),I(.25,.04,-.05)],e=[1,.92,1.06],n=zt(.27,.2,.13),s=zt(.34,.44,.26),o=I(0,1,0),r=0;for(let m=0;m<t.length-1;m++)for(let g=0;g<5;g++){let y=Qt(j.rope,e[r++%3]);m===0&&g===0?y=Qt(y,.62):m===0&&g===1?y=n:m===1&&g>=3&&(y=y.lerp(s,.35)),dr(i.matte,t[m].clone().lerp(t[m+1],g/5),t[m].clone().lerp(t[m+1],(g+1)/5),.07,.07,y,m===0&&g===1?null:void 0)}let a=t[2].clone().lerp(t[3],.45);Ss(i.matte,a.x,a.y+.0355,a.z,.013,zt(.84,.82,.72),6),Ss(i.matte,a.x,a.y+.0358,a.z,.005,zt(.32,.28,.24),4);let l=t[1].clone().lerp(t[2],.5).add(I(0,.036,.012)),c=t[1].clone().lerp(t[2],.95).add(I(0,.036,-.004));i.matte.beam(l,c,o,.012,.003,Qt(s,.8));let h=t[3],d=Array.from({length:5},(m,g)=>I(.36+g*.015,.04+g%2*.025,-.12+g*.05)),u=h.clone().lerp(t[2],.12);for(let m of[0,2,4])i.matte.beam(u,h.clone().lerp(d[m],.42),o,.028,.028,Qt(j.rope,e[m%3]));for(let m=0;m<5;m++){let g=h.clone().lerp(d[m],.55);i.matte.beam(h,g,o,.016,.016,Qt(j.rope,.95)),i.matte.beam(g,d[m],o,.016,.016,Qt(j.rope,1.25)),m<4&&i.matte.beam(h.clone().lerp(d[m],.4),h.clone().lerp(d[m].clone().lerp(d[m+1],.5),.85),o,.01,.01,Qt(j.rope,1.32))}return{h:.1,r:.4}},shards(i,t){let e=Ce(Math.floor(t*777)),n=Ce(Math.floor(t*777)+3),s=zt(.3,.15,.09),o=Qt(j.clay,.86),r=zt(.92,.66,.48),a=I(0,1,0),l=I(0,-1,0),c=Math.floor(t*4);for(let h=0;h<4;h++){let d=(e()-.5)*.4,u=(e()-.5)*.4,m=e()*6.28,g=.07+e()*.05,y=[0,2.1,4.2].map((T,P)=>I(d+Math.cos(m+T)*g,P===1?.05:.02,u+Math.sin(m+T)*g)),p=y[0].clone().add(y[1]).add(y[2]).multiplyScalar(1/3),f=Math.floor(n()*3),v=[];for(let T=0;T<3;T++){let P=y[T],N=y[(T+1)%3],F=y[(T+2)%3];T===f?v.push(P.clone().lerp(F,.1),P.clone().lerp(N,.1)):v.push(P.clone()),v.push(P.clone().lerp(N,.4+n()*.2).lerp(p,.06+n()*.1))}let S=T=>{let P=Math.hypot(T.x-p.x,T.z-p.z)/g;return I(T.x,T.y+.005*Math.max(0,1-P*P),T.z)},_=n()*Math.PI,b=Math.cos(_),E=Math.sin(_),A=(h+c)%4,M=T=>{let P=((T.x-p.x)*b+(T.z-p.z)*E)/g,N=(-(T.x-p.x)*E+(T.z-p.z)*b)/g;if(A===0)return P>.18?j.glaze:P>.04?s:j.clay;if(A===1){let F=Math.abs((N*1.6%1+1)%1-.5)*2;return P>-.2&&P<.02+F*.22?s:j.clay}return A===2?Math.floor((P+1)*4.5)%2?o:j.clay:Math.floor((P+1)*5)%2?j.clayDark:Qt(j.clayDark,.86)},w=(T,P,N,F)=>{if(F===0){let U=T.clone().add(P).add(N).multiplyScalar(.3333333333333333);Re(i.matte,[S(T),S(P),S(N)],a,M(U));return}let D=T.clone().lerp(P,.5),z=P.clone().lerp(N,.5),L=N.clone().lerp(T,.5);w(T,D,L,F-1),w(D,P,z,F-1),w(L,z,N,F-1),w(D,z,L,F-1)};for(let T=0;T<v.length;T++)w(p,v[T],v[(T+1)%v.length],2);A===3&&Ss(i.matte,p.x,p.y+.0065,p.z,.011,zt(.84,.82,.72),6);for(let T=0;T<v.length;T++){let P=S(v[T]),N=S(v[(T+1)%v.length]),F=P.clone().add(N).multiplyScalar(.5).sub(p).setY(0);Re(i.matte,[P,N,N.clone().add(I(0,-.01,0)),P.clone().add(I(0,-.01,0))],F,r)}Re(i.matte,v.map(T=>T.clone().add(I(0,-.01,0))),l,j.clayDark)}return{h:.06,r:.4}}};fr.tube2=fr.tube;fr.jar2=fr.jar;var hy={sand:{color:9075292},wreck:{color:4865580}};function go(i,t={}){let e=t.seed??.37,n={matte:new Bt,metal:new Bt},s=fr[i](n,e),o=new yt,r=t.mudColor??hy.wreck.color,a=[],l=(h,d)=>{if(h.empty)return null;let u=Nt({vertexColors:!0,spec:d?.65:0,shin:d?26:20,glint:d,clear:d?t.clear:void 0,item:!0,mud:{amount:t.mud??.3,inflate:t.inflate??0,seed:e*40+(d?7:0),scale:i==="anchor"?3.2:6.5,color:r,crust:1}}),m=new ut(h.build(),u);return m.castShadow=!0,a.push(u),o.add(m),m};l(n.matte,!1),l(n.metal,!0);let c=null;if(s.lid){let h=new Bt,{W:d,D:u}=s.lid;h.box(I(0,.03,u),I(d+.01,0,0),I(0,.03,0),I(0,0,u+.01),j.oak.clone().multiplyScalar(.92)),h.box(I(0,-.003,u),I(d-.02,0,0),I(0,.003,0),I(0,0,u-.02),zt(.42,.1,.1));for(let v of[u*.66,u*1.34])h.box(I(0,.061,v),I(d+.008,0,0),I(0,.002,0),I(0,0,.004),j.woodDark);let m=new Bt;for(let v of[-.17,0,.17])m.box(I(v,.062,u),I(.022,0,0),I(0,.006,0),I(0,0,u+.016),j.iron);m.box(I(0,.03,2*u+.016),I(.04,0,0),I(0,.035,0),I(0,0,.006),j.rust),m.box(I(0,-.015,2*u+.02),I(.014,0,0),I(0,.03,0),I(0,0,.004),j.iron),c=new yt,c.position.set(0,s.lid.H,-u);let g=Nt({vertexColors:!0,item:!0,mud:{amount:t.mud??.3,inflate:0,seed:3.3,scale:6.5,color:r,crust:1}}),y=Nt({vertexColors:!0,spec:.5,shin:26,item:!0,mud:{amount:t.mud??.3,inflate:0,seed:5.1,scale:6.5,color:r,crust:1}}),p=new ut(h.build(),g),f=new ut(m.build(),y);p.castShadow=f.castShadow=!0,c.add(p,f),a.push(g,y),o.add(c)}return{group:o,mats:a,info:s,lid:c}}function rs(i,t,e){for(let n of i.mats)n.uniforms.uMud.value=t,e!==void 0&&(n.uniforms.uMudInflate.value=e)}function xo(i,t){for(let e of i.mats)e.uniforms.uGlint&&(e.uniforms.uGlint.value=t)}var ae={deckY:.95,crane:new x(.6,0,0),pivotY:2.3,wash:new x(4.2,.95,0),stowTip:new x(4.2,5.25,0),hatch:{x:-1.6,z:0,hx:.6,hz:.6},tank:{x:-.4,z:1.45,hx:.45,hz:.3},halfLen:6};function Rn(i){return i<=.5?2.2-.34*Math.pow(ge((-i-2)/4,0,1),2):2.2*Math.sqrt(Math.max(0,1-Math.pow((i-.5)/5.75,2.2)))}function pr(i){return 1.3+.62*Math.pow(Vt(1,6.2,i),1.5)+.12*Vt(-3,-6,i)}function rd(i){return-1+1.45*Math.pow(Vt(3,6.25,i),1.6)+.22*Vt(-3.5,-6,i)}function si(i,t,e){let n=t*Math.PI/2,s=Rn(i)*Math.pow(Math.sin(n),.65),o=rd(i)+(pr(i)-rd(i))*Math.pow(1-Math.cos(n),1.15);return new x(i,o,e*s)}var vt={bottom:new J(.5,.2,.15),boot:new J(.92,.9,.84),top:new J(.17,.36,.38),topLight:new J(.22,.44,.45),rail:new J(.48,.34,.22),bulwarkIn:new J(.82,.8,.74),deck:new J(.74,.61,.45),deckEdge:new J(.5,.36,.24),bulwarkRib:new J(.74,.72,.66),white:new J(.92,.9,.84),glass:new J(.2,.28,.34),glassHi:new J(.42,.55,.6),fender:new J(.16,.17,.19),roof:new J(.3,.33,.36),yellow:new J(.92,.7,.2),yellowDark:new J(.62,.45,.14),black:new J(.14,.14,.15),red:new J(.72,.2,.16),steel:new J(.45,.47,.5),rust:new J(.62,.3,.17),rope:new J(.74,.64,.45),water:new J(.32,.6,.62),wood:new J(.55,.4,.27)};function cd(){let i=new yt;i.name="boat";let t=new yt;i.add(t);let e=new Bt,n=new Bt,s=[];for(let y=0;y<=32;y++)s.push(-6+12.2*(y/32));let o=16;for(let y of[-1,1])for(let p=0;p<s.length-1;p++)for(let f=0;f<o;f++){let v=f/o,S=(f+1)/o,_=si(s[p],v,y),b=si(s[p+1],v,y),E=si(s[p+1],S,y),A=si(s[p],S,y),M=(_.y+E.y)/2,w;M<-.04?w=vt.bottom:M<.14?w=vt.boot:M>pr((s[p]+s[p+1])/2)-.2?w=vt.topLight:w=vt.top,y>0?e.quad(_,b,E,A,w):e.quad(A,E,b,_,w)}{let p=[];for(let f=0;f<=o;f++)p.push(si(-6,f/o,1));for(let f=0;f<o;f++){let v=p[f],S=p[f+1],_=v.clone();_.z=-_.z;let b=S.clone();b.z=-b.z;let E=(v.y+S.y)/2,A=E<-.04?vt.bottom:E<.14?vt.boot:vt.top;e.quad(_,v,S,b,A)}e.box(new x(-6.03,.85,0),new x(.02,0,0),new x(0,.12,0),new x(0,0,1),vt.white)}for(let y of[-1,1])for(let p=0;p<s.length-1;p++){let f=s[p],v=s[p+1],S=Rn(f)-.12,_=Rn(v)-.12;if(S<.05&&_<.05)continue;let b=new x(f,ae.deckY,y*S),E=new x(v,ae.deckY,y*_),A=new x(v,pr(v),y*(Rn(v)-.1)),M=new x(f,pr(f),y*(Rn(f)-.1));y>0?n.quad(M,A,E,b,vt.bulwarkIn):n.quad(b,E,A,M,vt.bulwarkIn);let w=si(f,1,y).add(new x(0,.04,-y*.05)),T=si(v,1,y).add(new x(0,.04,-y*.05));n.beam(w,T,new x(0,1,0),.2,.09,vt.rail)}let r=new Bt;for(let y=0;y<s.length-1;y++){let p=s[y],f=s[y+1],v=Rn(p)-.1,S=Rn(f)-.1,_=9;for(let b=0;b<_;b++){let E=-1+2*b/_,A=-1+2*(b+1)/_,M=new x(p,ae.deckY,E*v),w=new x(f,ae.deckY,E*S),T=new x(f,ae.deckY,A*S),P=new x(p,ae.deckY,A*v),N=(p+f)/2,F=(E+A)/2*(v+S)/2;Math.abs(N-ae.hatch.x)<ae.hatch.hx&&Math.abs(F-ae.hatch.z)<ae.hatch.hz||r.quad(M,P,T,w,vt.deck)}}for(let y of[-1,1])for(let p=0;p<s.length-1;p++){let f=s[p],v=s[p+1],S=Rn(f)-.1,_=Rn(v)-.1;if(S<.08&&_<.08)continue;let b=new x(f,ae.deckY+.012,y*S),E=new x(v,ae.deckY+.012,y*_),A=new x(v,ae.deckY+.012,y*Math.max(0,_-.2)),M=new x(f,ae.deckY+.012,y*Math.max(0,S-.2));y>0?n.quad(b,E,A,M,vt.deckEdge):n.quad(M,A,E,b,vt.deckEdge)}for(let y of[-1,1]){for(let p=-4.6;p<=4.8;p+=.85){let f=Rn(p)-.13;if(f<.3)continue;let v=pr(p)-.05,S=new x(p,ae.deckY,y*(f-.02)),_=new x(p,v,y*(Rn(p)-.13));n.beam(S,_,new x(0,0,y),.07,.05,vt.bulwarkRib)}for(let p of[-3.9,-1.2,1.4,3.6]){let f=Rn(p)-.115;n.box(new x(p,ae.deckY+.07,y*f),new x(.16,0,0),new x(0,.055,0),new x(0,0,.012),vt.black),my(e,p,y)}}{let y=ae.hatch,p=ae.deckY,f=vt.wood;n.box(new x(y.x,p+.17,y.z-y.hz-.05),new x(y.hx+.1,0,0),new x(0,.17,0),new x(0,0,.05),f),n.box(new x(y.x,p+.17,y.z+y.hz+.05),new x(y.hx+.1,0,0),new x(0,.17,0),new x(0,0,.05),f),n.box(new x(y.x-y.hx-.05,p+.17,y.z),new x(.05,0,0),new x(0,.17,0),new x(0,0,y.hz),f),n.box(new x(y.x+y.hx+.05,p+.17,y.z),new x(.05,0,0),new x(0,.17,0),new x(0,0,y.hz),f),n.box(new x(y.x,p-.9,y.z),new x(y.hx,0,0),new x(0,.02,0),new x(0,0,y.hz),new J(.1,.09,.08));for(let S of[-1,1])n.box(new x(y.x+S*(y.hx-.02),p-.45,y.z),new x(.02,0,0),new x(0,.45,0),new x(0,0,y.hz),new J(.16,.14,.12));for(let S of[-1,1])n.box(new x(y.x,p-.45,y.z+S*(y.hz-.02)),new x(y.hx,0,0),new x(0,.45,0),new x(0,0,.02),new J(.08,.07,.06));let v=new x(y.x-y.hx-.4,p+.55,y.z);n.box(v,new x(.05,.02,0).applyAxisAngle(new x(0,0,1),-.35),new x(0,.62,0).applyAxisAngle(new x(0,0,1),-.35),new x(0,0,y.hz+.1),vt.wood.clone().multiplyScalar(.85))}{let y=ae.tank,p=ae.deckY,f=vt.steel;n.box(new x(y.x,p+.27,y.z-y.hz),new x(y.hx,0,0),new x(0,.27,0),new x(0,0,.04),f),n.box(new x(y.x,p+.27,y.z+y.hz),new x(y.hx,0,0),new x(0,.27,0),new x(0,0,.04),f),n.box(new x(y.x-y.hx,p+.27,y.z),new x(.04,0,0),new x(0,.27,0),new x(0,0,y.hz),f),n.box(new x(y.x+y.hx,p+.27,y.z),new x(.04,0,0),new x(0,.27,0),new x(0,0,y.hz),f),n.box(new x(y.x,p+.03,y.z),new x(y.hx,0,0),new x(0,.03,0),new x(0,0,y.hz),new J(.2,.3,.32))}{let v=ae.deckY,S=3.1,_=(-5+-2.5)/2;n.box(new x(_,(v+2)/2,0),new x((-2.5- -5)/2,0,0),new x(0,(2-v)/2,0),new x(0,0,1.35),vt.white),n.box(new x(_,2.55,0),new x((-2.5- -5)/2-.02,0,0),new x(0,.55,0),new x(0,0,1.35-.02),vt.glass);let b=[[-2.5,-1.35],[-2.5,-.45],[-2.5,.45],[-2.5,1.35],[-5,-1.35],[-5,1.35],[_,1.35],[_,-1.35]];for(let[E,A]of b)n.box(new x(E,2.55,A),new x(.06,0,0),new x(0,.56,0),new x(0,0,.06),vt.white);n.box(new x(_-.05,S+.06,0),new x((-2.5- -5)/2+.22,0,0),new x(0,.07,0),new x(0,0,1.35+.15),vt.roof),n.box(new x(-3.3,1.5,1.35+.01),new x(.36,0,0),new x(0,.55,0),new x(0,0,.02),vt.rail),n.box(new x(-3.3,1.52,1.35+.02),new x(.4,0,0),new x(0,.6,0),new x(0,0,.012),vt.white.clone().multiplyScalar(.85)),n.box(new x(-3.3,1.75,1.35+.04),new x(.14,0,0),new x(0,.14,0),new x(0,0,.012),vt.glass),n.box(new x(-3,1.45,1.35+.05),new x(.035,0,0),new x(0,.02,0),new x(0,0,.025),vt.yellow),n.box(new x(_,2,0),new x((-2.5- -5)/2+.05,0,0),new x(0,.035,0),new x(0,0,1.35+.05),vt.white),n.box(new x(_,3.02,0),new x((-2.5- -5)/2+.03,0,0),new x(0,.08,0),new x(0,0,1.35+.03),vt.topLight);for(let[E,A]of[[-1.15,-.65],[.6,1.1],[-.3,.2]])n.quad(new x(-2.475,2.1,E),new x(-2.475,2.1,E+.14),new x(-2.475,2.9,A+.14),new x(-2.475,2.9,A),vt.glassHi);for(let E of[-1,1])for(let[A,M]of[[-4.75,-4.35],[-3.55,-3.15]]){let w=E*1.375,T=[new x(A,2.1,w),new x(A+.12,2.1,w),new x(M+.12,2.9,w),new x(M,2.9,w)];E>0?n.quad(T[0],T[1],T[2],T[3],vt.glassHi):n.quad(T[3],T[2],T[1],T[0],vt.glassHi)}for(let E of[-4.5,-3])n.cylinder(new x(E,1.5,-1.35),new x(E,1.5,-1.35-.05),.16,.16,10,vt.steel,!0),n.cylinder(new x(E,1.5,-1.35-.02),new x(E,1.5,-1.35-.065),.11,.11,10,vt.glass,!0);n.cylinder(new x(-4.3,1.55,-1.35-.02),new x(-4.3,1.55,-1.35-.08),.32,.32,10,vt.red,!1),n.cylinder(new x(-4.3,1.55,-1.35-.03),new x(-4.3,1.55,-1.35-.09),.18,.18,10,vt.white,!0),n.cylinder(new x(-3.9,S+.1,0),new x(-3.9,5.6,0),.06,.05,6,vt.white),n.box(new x(-3.9,4.9,0),new x(.04,0,0),new x(0,.04,0),new x(0,0,.6),vt.white),n.box(new x(-3.9,5.28,0),new x(.07,0,0),new x(0,.035,0),new x(0,0,.45),vt.black),n.cylinder(new x(-3.9,5.18,0),new x(-3.9,5.245,0),.08,.08,6,vt.steel),n.box(new x(-3.9,5.62,0),new x(.05,0,0),new x(0,.05,0),new x(0,0,.05),new J(1,.85,.5));for(let E of[-.55,.55])n.box(new x(-3.9,4.98,E),new x(.05,0,0),new x(0,.05,0),new x(0,0,.04),E<0?vt.red:new J(.3,.7,.4));n.box(new x(-2.9,S+.3,.8),new x(.2,0,0),new x(0,.15,0),new x(0,0,.15),vt.black);{let E=S+.13,A=-5+.05,M=-2.5-.12,w=1.35,T=[[A,-w],[M,-w],[M,w],[A,w]];for(let F=0;F<4;F++){let[D,z]=T[F],[L,U]=T[(F+1)%4];n.beam(new x(D,E+.38,z),new x(L,E+.38,U),new x(0,1,0),.035,.035,vt.white)}for(let[F,D]of[...T,[(A+M)/2,-w],[(A+M)/2,w]])n.beam(new x(F,E,D),new x(F,E+.4,D),new x(1,0,0),.03,.03,vt.white);let P=-3.2,N=-.55;n.cylinder(new x(P-.42,E+.24,N),new x(P+.42,E+.24,N),.22,.22,10,vt.white,!0),n.cylinder(new x(P-.15,E+.24,N),new x(P-.1,E+.24,N),.225,.225,10,vt.red,!1),n.cylinder(new x(P+.1,E+.24,N),new x(P+.15,E+.24,N),.225,.225,10,vt.red,!1);for(let F of[-.3,.3])n.box(new x(P+F,E+.05,N),new x(.03,0,0),new x(0,.06,0),new x(0,0,.2),vt.steel);n.cylinder(new x(-2.75,E,-1.1),new x(-2.85,E+1.7,-1.1),.02,.012,4,vt.black),n.cylinder(new x(-3.55,E+.25,.75),new x(-3.25,E+.25,.75),.03,.08,6,vt.steel,!0)}n.cylinder(new x(-4.5,S+.1,-.75),new x(-4.55,4.25,-.75),.2,.2,8,vt.black),n.cylinder(new x(-4.52,3.7,-.75),new x(-4.53,3.95,-.75),.215,.215,8,vt.red,!1)}gy(n,new x(-5.5,ae.deckY,0),.38,vt.rope),n.cylinder(new x(5.6,ae.deckY,0),new x(5.6,ae.deckY+.35,0),.08,.08,6,vt.black),n.box(new x(5.6,ae.deckY+.35,0),new x(.05,0,0),new x(0,.04,0),new x(0,0,.22),vt.black),n.box(new x(-.3,ae.deckY+.25,-1.45),new x(.3,0,0),new x(0,.25,0),new x(0,0,.28),vt.wood),n.box(new x(-.95,ae.deckY+.2,-1.5),new x(.25,0,0),new x(0,.2,0),new x(0,0,.24),vt.wood.clone().multiplyScalar(.85));for(let y of[-1,1])for(let p of[-1.9,.7,3.1]){let f=si(p,1,y),v=si(p,.72,y),S=y*(Math.abs(v.z)+.14);n.beam(new x(p,f.y+.05,f.z),new x(p,v.y+.22,S),new x(1,0,0),.025,.025,vt.rope),n.cylinder(new x(p,v.y-.2,S),new x(p,v.y+.22,S),.13,.13,8,vt.fender,!0),n.cylinder(new x(p,v.y-.26,S),new x(p,v.y-.2,S),.08,.13,8,vt.fender,!1)}for(let[y,p,f,v,S,_]of[[-.3,.25,-1.45,.3,.25,.28],[-.95,.2,-1.5,.25,.2,.24]])for(let b of[-v*.6,v*.6])n.box(new x(y+b,ae.deckY+p,f),new x(.025,0,0),new x(0,S+.006,0),new x(0,0,_+.006),vt.wood.clone().multiplyScalar(.62));fy(n);for(let y of[-1.55,1.55])n.cylinder(new x(2.4,ae.deckY,y),new x(2.4,ae.deckY+1.6,y),.04,.04,5,vt.black),n.box(new x(2.4,ae.deckY+1.7,y),new x(.1,0,0),new x(0,.12,0),new x(0,0,.1),new J(1,.85,.5));let a=Nt({vertexColors:!0,spec:0}),l=new ut(e.build(),a),c=new ut(n.build(),Nt({vertexColors:!0,side:me})),h=new ut(r.build(),Nt({vertexColors:!0,wood:{w:.24,len:2.9,seam:.85,grain:1}}));l.castShadow=c.castShadow=!0,h.receiveShadow=!0,t.add(l,c,h);let d=py();t.add(d.group);{let y=ae.tank,p=new ut(new Nn((y.hx-.03)*2,(y.hz-.03)*2),new Ti({color:new J(.45,.78,.82),transparent:!0,opacity:.3,depthWrite:!1}));p.rotation.x=-Math.PI/2,p.position.set(y.x,ae.deckY+.43,y.z),p.renderOrder=3,p.name="tankWater",t.add(p)}let u=xy();u.root.position.set(ae.crane.x,ae.deckY,ae.crane.z),t.add(u.root);let m=yy();i.add(m.root);let g=uy();return i.add(g.mesh),{root:i,body:t,crane:u,net:m,hoist:g,hull:l,deck:c,fuel:d}}function uy(){let i=new qe(.035,.035,1,5,1,!0).translate(0,.5,0),t=new ut(i,Nt({color:2895924,spec:.4,shin:30}));t.name="hoist",t.castShadow=!0,t.frustumCulled=!1,t.visible=!1;let e=new x(0,1,0),n=new x;return{mesh:t,set(s,o){n.subVectors(o,s);let r=n.length();t.visible=r>.02,t.visible&&(t.position.copy(s),t.quaternion.setFromUnitVectors(e,n.divideScalar(r)),t.scale.set(1,r,1))}}}var ld=[{x:-4.5,z:.4},{x:-4.36,z:.99}],ki=.27,yo=.82,Nc=3.23,Eh=.03,wh=yo-.07,dy=[["#e9a940","#fff0b8"],["#f2d23a","#fff8c8"],["#ff8a36","#ffe0b0"],["#f0563c","#ffd0b8"],["#7a2418","#a8442e"]].map(([i,t])=>[new J(i),new J(t)]);function fy(i){let t=new J(.88,.88,.82);for(let e of ld){let n=(s,o=0,r=0)=>new x(e.x+o,Nc+s,e.z+r);i.cylinder(n(0),n(yo),ki,ki,10,t,!1),i.cylinder(n(yo),n(yo+.06),ki,ki*.72,10,t),i.cylinder(n(yo+.05,.05,-.04),n(yo+.12,.05,-.04),.06,.06,6,vt.red),i.box(n(.03),new x(ki+.04,0,0),new x(0,.03,0),new x(0,0,.05),vt.wood)}}function py(){let i=new yt;i.name="fuelTanks";let t=new qe(ki+.007,ki+.007,1,10,1,!0).translate(0,.5,0),e=new qe(ki+.011,ki+.011,.055,10,1,!0),n=Nt({color:16777215,spec:.3,shin:20}),s=Nt({color:16777215}),o=ld.map(c=>{let h=new ut(t,n),d=new ut(e,s);return h.position.set(c.x,Nc+Eh,c.z),h.scale.y=wh,d.position.set(c.x,Nc+Eh+wh,c.z),i.add(h,d),{fill:h,line:d}}),r=-1,a=-1,l=c=>{if(c===a)return;a=c;let[h,d]=dy[c];n.uniforms.uColor.value.copy(h),n.uniforms.uEmissive.value.copy(h).multiplyScalar(.55),s.uniforms.uColor.value.copy(d),s.uniforms.uEmissive.value.copy(d).multiplyScalar(.7)};return l(0),{group:i,update(c,h,d,u){r<0||h>r+.5?r=h:r+=(h-r)*Math.min(1,c*2.2);let m=110/2,g=[ge((r-m)/m,0,1),ge(r/m,0,1)];o.forEach((p,f)=>{let v=g[f]*wh;p.fill.visible=v>.004,p.fill.scale.y=Math.max(v,.001),p.line.visible=g[f]>.002,p.line.position.y=Nc+Eh+Math.max(v-.0275,.0275)});let y=d>=4?0:d===3?1:d===2?2:3;l(y===3&&Math.floor(u/.45)%2===1?4:y)}}}function my(i,t,e){for(let r=0;r<5;r++){let a=r/5,l=(r+1)/5,c=.97+(.62-.97)*a,h=.97+(.62-.97)*l,d=.07*(1-a*.7),u=.07*(1-l*.7),m=si(t,c,e),g=si(t,h,e),y=b=>{let E=b.clone();return E.z+=e*.012,E},p=y(m).add(new x(-d,0,0)),f=y(m).add(new x(d,0,0)),v=y(g).add(new x(u,0,0)),S=y(g).add(new x(-u,0,0)),_=vt.rust.clone().lerp(vt.top,.25+a*.5);e>0?i.quad(S,v,f,p,_):i.quad(p,f,v,S,_)}}function gy(i,t,e,n){for(let s=0;s<4;s++){let o=e-s*.06,r=t.y+.04+s*.05;for(let a=0;a<10;a++){let l=a/10*Math.PI*2,c=(a+1)/10*Math.PI*2;i.beam(new x(t.x+Math.cos(l)*o,r,t.z+Math.sin(l)*o),new x(t.x+Math.cos(c)*o,r,t.z+Math.sin(c)*o),new x(0,1,0),.07,.06,n.clone().multiplyScalar(.9+s%2*.12))}}}function xy(){let i=new yt,t=Nt({vertexColors:!0,spec:.25,shin:30}),e=new Bt;e.cylinder(new x(0,0,0),new x(0,.75,0),.5,.42,10,vt.yellowDark),e.cylinder(new x(0,.75,0),new x(0,.85,0),.55,.55,10,vt.black);let n=new ut(e.build(),t);i.add(n);let s=new yt;s.position.y=.85,i.add(s);let o=new Bt;o.box(new x(-.15,.32,0),new x(.55,0,0),new x(0,.32,0),new x(0,0,.42),vt.yellow),o.box(new x(-.15,.66,0),new x(.5,0,0),new x(0,.03,0),new x(0,0,.38),vt.yellowDark),o.box(new x(-.55,.85,-.3),new x(.02,0,0),new x(0,.2,0),new x(0,0,.02),vt.black),o.box(new x(-.55,.85,-.18),new x(.02,0,0),new x(0,.2,0),new x(0,0,.02),vt.black);for(let g of[-.2,.2])o.box(new x(.15,.85,g),new x(.18,0,0),new x(0,.25,0),new x(0,0,.04),vt.yellowDark);let r=new ut(o.build(),t);s.add(r);let a=new yt;a.position.set(.15,1.45-0,0),s.add(a);let l=4,c=[],h=[.34,.27,.2];for(let g=0;g<3;g++){let y=new Bt,p=h[g];y.box(new x(l/2,0,0),new x(l/2,0,0),new x(0,p/2,0),new x(0,0,p/2),g===0?vt.yellow:g===1?vt.yellow.clone().multiplyScalar(.94):vt.yellow.clone().multiplyScalar(.88));for(let v=0;v<3;v++)y.box(new x(l-.15-v*.22,0,0),new x(.06,0,0),new x(0,p/2+.005,0),new x(0,0,p/2+.005),vt.black);let f=new ut(y.build(),t);f.castShadow=!0,a.add(f),c.push(f)}let d=new yt,u=new Bt;u.cylinder(new x(0,0,-.1),new x(0,0,.1),.18,.18,10,vt.black),u.box(new x(.05,0,0),new x(.2,0,0),new x(0,.12,0),new x(0,0,.12),vt.yellowDark),d.add(new ut(u.build(),t)),a.add(d);let m=new ut(new qe(.07,.07,1,6),Nt({color:10133670,spec:.5,shin:40}));return s.add(m),[n,r,d.children[0],m].forEach(g=>g.castShadow=!0),{root:i,turret:s,boom:a,sections:c,head:d,ram:m,secLen:l}}function yy(){let i=new yt;i.name="netframe";let t=Nt({color:11684396,spec:.3,shin:20}),e=new ut(new Go(1.4,.075,6,28),t);e.rotation.x=Math.PI/2,e.castShadow=!0,i.add(e);let n=Nt({color:5593180,spec:.3});for(let v=0;v<8;v++){let S=v/8*Math.PI*2,_=new ut(new dn(.16,.14,.16),n);_.position.set(Math.cos(S)*1.4,-.05,Math.sin(S)*1.4),_.castShadow=!0,i.add(_)}let s=new Bt,o=new x(0,1.25,0);for(let v=0;v<4;v++){let S=v/4*Math.PI*2+Math.PI/4,_=new x(Math.cos(S)*1.4,.02,Math.sin(S)*1.4);s.beam(_,o,new x(0,1,0),.04,.04,new J(.25,.25,.27))}s.cylinder(new x(0,1.2,0),new x(0,1.45,0),.09,.07,6,new J(.2,.2,.2));let r=new ut(s.build(),Nt({vertexColors:!0}));r.castShadow=!0,i.add(r);let a=24,l=7,c=new oe,h=new Float32Array((a+1)*(l+1)*3),d=new Float32Array((a+1)*(l+1)*2),u=[];for(let v=0;v<=l;v++)for(let S=0;S<=a;S++){let _=v*(a+1)+S;if(d[_*2]=S/a,d[_*2+1]=v/l,S<a&&v<l){let b=_,E=_+1,A=_+a+1,M=A+1;u.push(b,A,E,E,A,M)}}c.setAttribute("position",new ve(h,3)),c.setAttribute("uv",new ve(d,2)),c.setIndex(u);let m=Nt({color:4082238,net:[a*1,l*2.2],side:me}),g=new ut(c,m);g.castShadow=!0,g.frustumCulled=!1,i.add(g);let y={close:0,bulge:.2,depth:.95};function p(){let v=c.attributes.position.array;for(let S=0;S<=l;S++){let _=S/l,b=1.4*(1-y.close*.86),E=1.4+(b-1.4)*Math.pow(_,1.4);E+=Math.sin(_*Math.PI)*y.bulge*(.4+y.close*.5);let A=-_*(y.depth+y.close*.35);for(let M=0;M<=a;M++){let w=M/a*Math.PI*2,T=(S*(a+1)+M)*3,P=Math.sin(w*3+_*4)*.03*_;v[T]=Math.cos(w)*(E+P),v[T+1]=A,v[T+2]=Math.sin(w)*(E+P)}}c.attributes.position.needsUpdate=!0,c.computeVertexNormals(),c.computeBoundingSphere()}p();let f=new yt;return f.position.y=-.7,i.add(f),{root:i,ring:e,skirt:g,state:y,updateSkirt:p,bag:f,hookY:1.45}}var hd=new x,Hc=new x,Uc=new x,kn=[[5.15,0],[4.55,-1],[4.55,1],[3,-1.45],[3,1.45],[1.4,-1.6],[1.4,1.6],[-.55,0],[-.6,-1.5],[-.6,.98],[-1.3,1],[-3.75,-1.72],[-3.75,1.74],[-5.45,-.72],[-5.45,.72],[4.2,0],[.55,-.98]],vy=[[0,1],[0,2],[1,3],[2,4],[1,15],[2,15],[3,15],[4,15],[3,5],[4,6],[5,16],[16,8],[5,8],[6,9],[8,7],[9,7],[9,10],[8,11],[10,12],[11,13],[12,14],[13,14],[5,7],[6,7],[10,7]],Th=kn.map(()=>[]);for(let[i,t]of vy){let e=Math.hypot(kn[i][0]-kn[t][0],kn[i][1]-kn[t][1]);Th[i].push([t,e]),Th[t].push([i,e])}function ud(i,t){let e=0,n=1e9;for(let s=0;s<kn.length;s++){let o=Math.hypot(kn[s][0]-i,kn[s][1]-t);o<n&&(n=o,e=s)}return e}function _y(i,t,e,n){let s=ud(i,t),o=ud(e,n),r=kn.map(()=>1/0),a=kn.map(()=>-1),l=kn.map(()=>!1);for(r[s]=0;;){let h=-1,d=1/0;for(let u=0;u<kn.length;u++)!l[u]&&r[u]<d&&(d=r[u],h=u);if(h<0||h===o)break;l[h]=!0;for(let[u,m]of Th[h])r[h]+m<r[u]&&(r[u]=r[h]+m,a[u]=h)}let c=[];for(let h=o;h!==-1;h=a[h])c.unshift(kn[h]);return c.length&&Math.hypot(c[0][0]-i,c[0][1]-t)<.4&&c.shift(),c.push([e,n]),c}var My=[{coat:15251504,pants:3818064,hat:15251504,skin:14198920,name:"\u8001\u5468",hair:10262156,beard:11841188,glove:14185514,boot:2762790,cuff:14209732,kind:"souwester",scale:1},{coat:3428474,pants:2960947,hat:12073520,skin:13146232,name:"\u963F\u5C9A",hair:1972760,glove:3816512,boot:2500910,cuff:4869718,kind:"beanie",stripe:14210248,scale:.97},{coat:7043658,shirt:7234130,pants:4865072,hat:3027512,skin:14725264,name:"\u5927\u5C71",hair:2760728,beard:3812384,boot:3812386,cuff:5915700,kind:"cap",vest:!0,scale:1.06},{coat:12104872,pants:3424330,hat:3824250,skin:11567208,name:"\u5C0F\u6EE1",hair:2892320,boot:2369066,cuff:3824250,kind:"watch",knit:!0,scale:.95}],tn=(i,t,e)=>new x(i,t,e),pe=i=>new J(i),Ge=(i,t)=>new J(i).multiplyScalar(t);function Me(i,t,e,n,s,o,r,a){i.box(tn(t,e,n),tn(s,0,0),tn(0,o,0),tn(0,0,r),a)}function Ae(i,t,e,n,s,o,r,a,l,c,h=0){let d=tn(t-o,n,e-r),u=tn(t+o,n,e-r),m=tn(t+o,n,e+r),g=tn(t-o,n,e+r),y=tn(t-a+h,s,e-l),p=tn(t+a+h,s,e-l),f=tn(t+a+h,s,e+l),v=tn(t-a+h,s,e+l);i.quad(d,u,m,g,c),i.quad(y,v,f,p,c),i.quad(u,p,f,m,c),i.quad(d,g,v,y,c),i.quad(g,m,f,v,c),i.quad(d,y,p,u,c)}var bh=null,wn=Ce(5150);function gi(i){bh||(bh=Nt({vertexColors:!0,spec:.12,shin:16}));let t=new ut(i.build(),bh);return t.castShadow=!0,t}var Wn=.88,Sh=.44,dd=.38,fd=.29,Rs=.25;var kc=class{constructor(t,e){let n=My[t];this.i=t,this.name=n.name,this.look=n,this.root=new yt,this.body=new yt,this.body.scale.setScalar(n.scale),this.root.add(this.body),this.hips=new yt,this.body.add(this.hips),this.buildHips(n),this.legL=new yt,this.legR=new yt,this.legL.position.set(0,Wn,-.1),this.legR.position.set(0,Wn,.1),this.kneeL=new yt,this.kneeR=new yt,this.ankleL=new yt,this.ankleR=new yt;for(let[s,o,r]of[[this.legL,this.kneeL,this.ankleL],[this.legR,this.kneeR,this.ankleR]])s.add(this.thighMesh(n)),o.position.y=-Sh,s.add(o),o.add(this.shinMesh(n)),r.position.y=-dd,o.add(r),r.add(this.footMesh(n));this.hips.add(this.legL,this.legR),this.torso=new yt,this.torso.position.y=Wn,this.hips.add(this.torso),this.torso.add(this.chestMesh(n)),this.head=new yt,this.head.position.y=.62,this.torso.add(this.head),this.head.add(this.headMesh(n)),this.eyes=this.eyeMesh(n),this.head.add(this.eyes),this.armL=new yt,this.armR=new yt,this.armL.position.set(0,.53,-.255),this.armR.position.set(0,.53,.255),this.elbowL=new yt,this.elbowR=new yt;for(let[s,o,r]of[[this.armL,this.elbowL,-1],[this.armR,this.elbowR,1]])s.add(this.upperMesh(n,r)),o.position.y=-fd,s.add(o),o.add(this.foreMesh(n,r));this.torso.add(this.armL,this.armR),this.nozzle=new yt;{let s=new Bt;s.cylinder(tn(0,-.29,0),tn(.2,-.27,0),.028,.022,6,pe(2763822)),s.cylinder(tn(.2,-.27,0),tn(.27,-.265,0),.032,.026,6,pe(11569722)),s.box(tn(.03,-.33,0),tn(.012,0,0),tn(0,.04,0),tn(0,0,.012),pe(2763822)),this.nozzle.add(gi(s))}this.nozzle.visible=!1,this.elbowR.add(this.nozzle),this.hold=new yt,this.hold.position.set(.42,1.12,0),this.root.add(this.hold),this.x=e[0],this.z=e[1],this.face=0,this.faceT=0,this.path=[],this.speed=0,this.walkPh=Math.random()*6,this.pose="stand",this.poseT=0,this.task=null,this.busy=!1,this.p={crouch:0,armF:0,armUp:0,lean:0,brow:0,coil:0,cheer:0,hose:0,lever:0,carry:0,look:0,rail:0,check:0,watch:0,shrug:0,peer:0,wipe:0},this.gest=null,this.backX=0,this.backZ=0,this.t=Math.random()*10,this.still=0,this.shift=0,this.shiftT=0,this.shiftAt=2+wn()*3,this.gaze=0,this.gazeT=0,this.gazeAt=1+wn()*3,this.blinkAt=1+wn()*3,this.blink=0,this.fidget=null,this.fidgetT=0,this.fidgetAt=5+wn()*6,this.flinch=0,this.flinchDir=1,this.brace=0,this.braceS=0,this.bx=0,this.bz=0,this.bvx=0,this.bvz=0,this.bw=5.4+t*7%5*.35}buildHips(t){let e=new Bt;if(Ae(e,0,0,Wn-.12,Wn+.04,.125,.175,.135,.18,pe(t.pants)),Me(e,0,Wn+.025,0,.142,.03,.187,pe(3811870)),Me(e,.142,Wn+.025,0,.008,.026,.03,pe(13148224)),!t.vest){let n=t.kind==="souwester"?.2:.1;Ae(e,0,0,Wn-n,Wn+.06,.16,.215,.15,.205,Ge(t.coat,.92)),Me(e,.155,Wn-n*.5,0,.012,n*.5+.03,.012,Ge(t.coat,.6))}this.hips.add(gi(e))}thighMesh(t){let e=new Bt;return Ae(e,0,0,-Sh-.02,.02,.07,.07,.088,.088,pe(t.pants)),Me(e,.072,-Sh+.06,0,.006,.05,.05,Ge(t.pants,1.18)),gi(e)}shinMesh(t){let e=new Bt;return Ae(e,0,0,-.18,.02,.068,.068,.072,.072,pe(t.pants)),Ae(e,0,0,-dd,-.14,.078,.076,.082,.08,pe(t.boot)),Me(e,0,-.13,0,.088,.03,.086,pe(t.cuff)),gi(e)}footMesh(t){let e=new Bt;return Me(e,.04,-.035,0,.115,.035,.078,pe(t.boot)),Ae(e,.17,0,-.07,-.01,.03,.07,.02,.06,pe(t.boot)),Me(e,.05,-.064,0,.15,.008,.08,pe(1315602)),gi(e)}chestMesh(t){let e=new Bt,n=t.vest?t.shirt:t.coat;if(Ae(e,0,0,0,.3,.145,.19,.155,.215,pe(n)),Ae(e,0,0,.3,.58,.155,.215,.13,.235,pe(n)),t.vest){for(let s of[.14,.36])Me(e,0,s,0,.157,.012,.222,Ge(t.shirt,.7));for(let s of[-1,1])Ae(e,.02,s*.13,-.02,.56,.135,.085,.118,.07,pe(t.coat)),Me(e,.147,.24,s*.12,.006,.05,.05,Ge(t.coat,.82)),Me(e,.15,.29,s*.12,.004,.01,.052,Ge(t.coat,.65));Ae(e,-.075,0,-.02,.56,.08,.205,.065,.2,pe(t.coat))}else{Me(e,.152,.28,0,.006,.28,.012,Ge(t.coat,.62));for(let s of[-1,1])Me(e,.15,.1,s*.1,.007,.055,.06,Ge(t.coat,.86)),Me(e,.153,.15,s*.1,.005,.01,.062,Ge(t.coat,.7));if(t.knit)for(let s=.05;s<.56;s+=.085)Me(e,0,s,0,.158,.01,.228-(s>.3?(s-.3)*.05:0),Ge(t.coat,.84));t.kind==="souwester"&&Ae(e,0,0,.44,.58,.158,.222,.134,.238,Ge(t.coat,.88)),t.stripe&&Me(e,0,.42,0,.158,.014,.232,pe(t.stripe))}return Ae(e,0,0,.54,.64,.11,.13,.1,.12,t.kind==="watch"?Ge(t.coat,.9):Ge(t.coat,.78)),Me(e,0,.62,0,.06,.04,.06,pe(t.skin)),gi(e)}headMesh(t){let e=new Bt,n=pe(t.skin);Ae(e,0,0,.02,.12,.1,.1,.115,.118,n),Ae(e,0,0,.12,.27,.115,.118,.11,.112,n),Ae(e,.122,0,.1,.16,.018,.022,.008,.015,Ge(t.skin,.9),-.01);for(let r of[-1,1])Me(e,-.01,.135,r*.12,.025,.035,.01,Ge(t.skin,.9)),Me(e,.113,.2,r*.052,.006,.009,.026,pe(t.hair));Me(e,.112,.065,0,.005,.006,.03,Ge(t.skin,.62));for(let r of[-1,1])Me(e,.112,.1,r*.07,.004,.02,.022,new J(t.skin).lerp(pe(13656144),.25));Me(e,-.085,.17,0,.035,.09,.118,pe(t.hair));for(let r of[-1,1])Me(e,.03,.19,r*.116,.06,.05,.006,pe(t.hair));t.beard&&(Ae(e,.045,0,-.005,.085,.075,.105,.075,.12,pe(t.beard)),Me(e,.118,.085,0,.007,.012,.04,pe(t.beard)));let s=pe(t.hat),o=Ge(t.hat,.78);return t.kind==="souwester"?(Ae(e,-.01,0,.24,.36,.13,.13,.09,.09,s),Ae(e,-.03,0,.225,.255,.2,.19,.19,.18,o,0),Ae(e,-.2,0,.17,.235,.06,.17,.04,.18,o,.02),Me(e,.12,.236,0,.012,.012,.13,Ge(t.hat,.6))):t.kind==="beanie"?(Ae(e,0,0,.21,.37,.125,.125,.085,.085,s),Ae(e,0,0,.2,.27,.13,.13,.13,.13,o),Me(e,0,.395,0,.035,.03,.035,Ge(t.hat,1.1))):t.kind==="cap"?(Ae(e,-.005,0,.22,.34,.122,.123,.095,.1,s),Ae(e,.18,0,.225,.245,.08,.1,.07,.095,o,.01),Me(e,.119,.29,0,.004,.025,.035,pe(13152368))):(Ae(e,0,0,.22,.33,.124,.124,.105,.105,s),Ae(e,0,0,.21,.26,.128,.128,.128,.128,o)),gi(e)}eyeMesh(){let t=new Bt;for(let n of[-1,1])Me(t,.117,0,n*.05,.006,.017,.015,pe(1776154));let e=gi(t);return e.position.y=.165,e}upperMesh(t,e){let n=new Bt,s=t.vest?t.shirt:t.coat;return Ae(n,0,0,-fd-.02,0,.058,.058,.07,.07,pe(s)),Me(n,0,-.02,e*.005,.075,.05,.072,pe(s)),t.vest&&Me(n,0,-.075,0,.061,.012,.061,Ge(t.shirt,.7)),t.kind==="souwester"&&Me(n,0,-.02,e*.005,.077,.052,.074,Ge(t.coat,.88)),gi(n)}foreMesh(t,e){let n=new Bt;t.vest?(Ae(n,0,0,-.08,.02,.064,.064,.066,.066,Ge(t.shirt,.85)),Ae(n,0,0,-Rs,-.08,.046,.046,.054,.054,pe(t.skin))):(Ae(n,0,0,-Rs,.02,.054,.054,.06,.06,pe(t.coat)),Me(n,0,-Rs+.025,0,.058,.025,.058,t.stripe?pe(t.stripe):Ge(t.coat,.78)));let s=t.glove?pe(t.glove):pe(t.skin);return Ae(n,.005,0,-Rs-.11,-Rs+0,.035,.04,.045,.045,s),Me(n,.04,-Rs-.035,-e*0,.016,.03,.018,t.glove?Ge(t.glove,.9):Ge(t.skin,.92)),gi(n)}goTo(t,e){this.path=_y(this.x,this.z,t,e)}get moving(){return this.path.length>0}startle(t=1,e=1){t>this.flinch&&(this.flinch=Math.min(1.2,t),this.flinchDir=e)}gesture(t,e={}){this.gest={kind:t,t:0,dur:e.dur??{nod:1.15,shrug:1.7,peer:2.2,back:1.9,steady:1.4,wipe:2.6}[t],dx:e.dx||0,dz:e.dz||0,tx:e.tx,tz:e.tz,delay:e.delay||0}}shakeDrops(t){if(!(!t||!t.fx)){this.root.updateMatrixWorld(!0);for(let[e,n]of[[this.elbowL,-1],[this.elbowR,1]]){e.localToWorld(Uc.set(.01,-Rs-.07,0)),this.root.localToWorld(Hc.set(1,0,n*.45)),this.root.localToWorld(hd.set(0,0,0)),Hc.sub(hd);for(let s=0;s<7;s++){let o=wn();t.fx.emit("splash",Uc.x,Uc.y,Uc.z,Hc.x*(1.1+o*1.4)+(wn()-.5)*.7,-.4+wn()*1.3,Hc.z*(1.1+o*1.4)+(wn()-.5)*.7,{size:.1+wn()*.05,life:.55})}}}}update(t,e){this.t+=t;let n=0;if(this.path.length){let[et,pt]=this.path[0],ht=et-this.x,Pt=pt-this.z,Lt=Math.hypot(ht,Pt),Yt=(this.p.carry>.5?1.25:1.6)*(this.slowK||1);if(Lt<.08)this.path.shift();else{let B=Math.min(Lt,Yt*t);this.x+=ht/Lt*B,this.z+=Pt/Lt*B,this.faceT=Math.atan2(-Pt,ht),n=Yt}}this.inPlace&&(n=this.inPlace),this.speed=vn(this.speed,n,10,t),this.face=uo(this.face,this.faceT,9,t);let s=this.p,o={crouch:0,armF:0,armUp:0,lean:0,brow:0,coil:0,cheer:0,hose:0,lever:0,carry:0,look:0,rail:0,check:0,watch:0,shrug:0,peer:0,wipe:0},r=this.moving||this.inPlace?s.carry>.5||this.pose==="carryWalk"?"carryWalk":"walk":this.pose;switch(r){case"crouch":o.crouch=1,o.armF=.9,o.lean=.5;break;case"carry":case"carryWalk":o.carry=1;break;case"lookout":o.brow=1,o.look=1;break;case"coil":o.crouch=.6,o.coil=1,o.lean=.35;break;case"lever":o.lever=1,o.lean=.1;break;case"rail":o.rail=1,o.lean=.55;break;case"hose":o.hose=1;break;case"watch":o.watch=1,o.look=.35;break;case"cheer":o.cheer=1,o.armUp=1;break;case"check":o.check=1,o.crouch=.45,o.lean=.45;break;default:break}let a=0,l=0,c=0,h=0,d=0,u=0,m=0,g=0,y=0,p=0;this.shakeK=0,this.shakeR=0,this.wipeSt=0;let f=this.gest;if(f)if(f.delay>0)f.delay-=t;else{f.t+=t;let et=f.t/f.dur,pt=Math.sin(Math.min(1,et)*Math.PI);if(f.kind==="shrug"&&(o.shrug=et<.74?1:0,et<.8&&(o.hose=0),y=et<.12?Math.sin(et/.12*Math.PI*.5):et<.62?1-.25*Math.sin((et-.12)/.5*Math.PI):et<.78?Math.cos((et-.62)/.16*Math.PI*.5):0,p=et>.22&&et<.7?Math.sin((et-.22)/.48*Math.PI*4)*Math.sin((et-.22)/.48*Math.PI):0),f.kind==="peer"&&(o.peer=et<.78?1:0,u=et<.16?Math.sin(et/.16*Math.PI*.5):et<.78?1:.5+.5*Math.cos((et-.78)/.22*Math.PI),p=et>.3&&et<.72?Math.sin((et-.3)/.42*Math.PI*2)*.6:0),f.kind==="steady"&&(g=et<.22?Math.sin(et/.22*Math.PI*.5):et<.62?1:.5+.5*Math.cos((et-.62)/.38*Math.PI),u=g,o.crouch=Math.max(o.crouch,.55*g)),f.kind==="wipe"){if(o.wipe=et<.5?1:0,this.wipeSt=et<.5?.5-.5*Math.cos(et/.5*Math.PI*4):0,et>.52&&et<.94){let ht=(et-.52)/.42*2%1;this.shakeK=1,this.shakeR=ht<.6?Math.sin(ht/.6*Math.PI*.5):Math.cos((ht-.6)/.4*Math.PI*.5)}for(let ht of[.52+.21*.85,.52+.21*1.85])et>=ht&&(f.fl??0)<ht&&(f.fl=ht,this.shakeDrops(e))}if(f.kind==="nod"){let ht=et<.55?Math.sin(et/.55*Math.PI):0,Pt=et>=.55&&et<.85?Math.sin((et-.55)/.3*Math.PI)*.45:0;if(a=(ht+Pt)*.5,l=(ht+Pt)*.2,s.hose<.3&&s.carry<.3){let Lt=et<.25?et/.25:et<.62?1:Math.max(0,1-(et-.62)/.33);c=Lt*Lt*(3-2*Lt),h=et>.62&&et<.86?Math.sin((et-.62)/.24*Math.PI):0}}f.kind==="back"&&(d=et<.14?Math.sin(et/.14*Math.PI*.5):et<.58?1:.5+.5*Math.cos((et-.58)/.42*Math.PI),m=et<.1?et/.1:et<.5?1:Math.max(0,1-(et-.5)/.3)),(f.kind==="peer"||f.kind==="steady")&&f.tx!==void 0&&et<.85&&(this.faceT=Math.atan2(-(f.tz-this.z),f.tx-this.x)),et>=1&&(this.gest=null)}let v=0,S=0;if(f&&f.kind==="back")v=f.dx*d,S=f.dz*d;else if(f&&u>0){let et=f.kind==="peer"?.32:.38,pt=Math.cos(this.face),ht=-Math.sin(this.face);if(f.tx!==void 0){let Lt=f.tx-this.x,Yt=f.tz-this.z,B=Math.hypot(Lt,Yt);B>.05&&(pt=Lt/B,ht=Yt/B)}let Pt=f.tx!==void 0?Math.max(0,Math.hypot(f.tx-this.x,f.tz-this.z)-.55):et;v=pt*Math.min(et,Pt)*u,S=ht*Math.min(et,Pt)*u}if(v||S){let et=ge(this.x+v,-5,5.2),pt=Math.max(.2,Rn(et)-.32);this.backX=et-this.x,this.backZ=ge(this.z+S,-pt,pt)-this.z}else this.backX=vn(this.backX,0,6,t),this.backZ=vn(this.backZ,0,6,t);this.guardK=m,this.reachK=g,this.shrugUp=y,this.headShake=p;for(let et in s)s[et]=vn(s[et],o[et],8,t);let _=!this.moving&&!this.inPlace&&(r==="stand"||r==="watch");this.still=_?this.still+t:0,this.shiftAt-=t,this.shiftAt<=0&&(this.shiftT=this.shiftT>0?-1:1,this.shiftAt=3+wn()*4),this.shift=vn(this.shift,_?this.shiftT:0,2.2,t),this.gazeAt-=t,this.gazeAt<=0&&(this.gazeT=(wn()*2-1)*.8,this.gazeAt=1.2+wn()*2.8),this.gaze=vn(this.gaze,this.gazeT,7,t),this.blinkAt-=t,this.blinkAt<=0&&(this.blink=.14,this.blinkAt=1.8+wn()*3.5),this.blink=Math.max(0,this.blink-t),this.fidgetAt-=t,_&&r==="stand"&&this.still>2&&this.fidgetAt<=0&&!this.fidget&&(this.fidget=["stretch","shoulders","neck"][Math.floor(wn()*3)],this.fidgetT=0);let b=0;if(this.fidget){this.fidgetT+=t;let et=this.fidget==="stretch"?2.4:1.6,pt=this.fidgetT/et;b=Math.sin(Math.min(1,pt)*Math.PI),b=b*b*(3-2*b),(pt>=1||!_)&&(this.fidget=null,this.fidgetAt=6+wn()*7,b=0)}let E=this.fidget==="stretch"?b:0,A=this.fidget==="shoulders"?b:0,M=this.fidget==="neck"?b:0;this.flinch=Math.max(0,this.flinch-t*1.6);let w=Math.sin(Math.min(1,this.flinch)*Math.PI*.5),T=w*w,P=ge(this.brace,-1,1),N=ge(this.braceS,-1,1),F=Math.min(1,(Math.abs(P)+Math.abs(N))*1.6)*s.rail,D=ge(this.speed/1.5,0,1);this.walkPh+=t*this.speed*4.2;let z=this.walkPh,L=Math.sin(z),U=-L,O=(s.carry>.5?.38:.5)*D,k=Math.max(0,Math.cos(z)),W=Math.max(0,-Math.cos(z)),q=(Math.abs(Math.cos(z))-.6)*.045*D,at=Math.sin(this.t*1.7+this.i);this.root.position.set(this.x+this.backX,ae.deckY,this.z+this.backZ),this.root.rotation.y=this.face;let it=this.guardK||0,lt=this.reachK||0,wt=this.shrugUp||0,gt=this.headShake||0,K=s.crouch*1+s.rail*.12+s.hose*.18+T*.25+Math.abs(P)*.12+Math.abs(N)*.08+F*.1+s.wipe*.12*this.wipeSt+l*.3+s.peer*.32+it*.22,tt=Wn*(1-Math.cos(K)),dt=s.cheer*Math.max(0,Math.sin(this.t*9))*.12,Ct=this.shift*.035;this.hips.position.set(-s.hose*.03-T*.05*this.flinchDir,-tt+q+dt+at*.004+wt*.06,Ct),this.hips.rotation.y=-L*.07*D,this.hips.rotation.x=-Ct*1.2;let _t=Ct/Wn,$t=s.hose*.22+s.lever*.12,Ee=L*O+K+$t+P*.15,te=U*O+K-$t*.6+P*.15,ee=.06+(this.shift>0?0:.1)*Math.abs(this.shift),xe=.06+(this.shift<0?0:.1)*Math.abs(this.shift),ne=-(2*K+D*(.12+.85*Math.pow(k,1.6))+ee*(1-D)+$t*.4),we=-(2*K+D*(.12+.85*Math.pow(W,1.6))+xe*(1-D));this.legL.rotation.set(_t+.03,0,Ee),this.legR.rotation.set(_t-.03,0,te),this.kneeL.rotation.z=ne,this.kneeR.rotation.z=we,this.ankleL.rotation.z=-(Ee+ne)+D*.25*Math.max(0,-L)*(1-k),this.ankleR.rotation.z=-(te+we)+D*.25*Math.max(0,-U)*(1-W),this.ankleL.rotation.x=-_t,this.ankleR.rotation.x=-_t;let Pe=this.shakeK||0,Xe=this.shakeR||0,Fe=s.lean*.6+s.peer*.95+s.crouch*.25-s.hose*.08+s.check*.1+s.watch*.08-E*.22-T*.3*this.flinchDir+P*.25+D*.08+s.wipe*(.1+.38*this.wipeSt)+Pe*.14*(1-Xe)+l-it*.32+lt*.55-wt*.24;this.torso.rotation.set(Ct*1.5+N*.24,L*.12*D+s.hose*.25,-Fe-at*.012);let We=L*.45*D*(1-s.carry)*(1-s.hose),V=-We+s.armF*.9,ue=We+s.armF*.9,Kt=.18+D*.25*(1+L)*.5+s.armF*.3,H=.18+D*.25*(1-L)*.5+s.armF*.3,R=.08,X=-.08,$=0,nt=0;V+=s.carry*.55,ue+=s.carry*.55,Kt+=s.carry*.75,H+=s.carry*.75,R+=s.carry*.12,X-=s.carry*.12,$-=s.carry*.3,nt+=s.carry*.3;let ft=Math.sin(this.t*23)*.025+Math.sin(this.t*7.3)*.02;if(ue+=s.hose*(.95+ft),H+=s.hose*.35,X+=s.hose*.3,V+=s.hose*(.75+ft),Kt+=s.hose*.95,R-=s.hose*.05,$-=s.hose*.55,nt+=s.hose*.15,ue+=s.lever*(.75+Math.sin(this.t*2.2)*.14),H+=s.lever*.35,V+=s.lever*.1,Kt+=s.lever*.5,R+=s.lever*.3,ue+=s.coil*(.7+Math.sin(this.t*5)*.32),H+=s.coil*(.55+Math.cos(this.t*5)*.3),V+=s.coil*.55,Kt+=s.coil*.9,R+=s.coil*.05,ue+=s.brow*1.6,H+=s.brow*1.85,X-=s.brow*.55,V+=s.rail*.75,ue+=s.rail*.75,Kt+=s.rail*.15,H+=s.rail*.15,R+=s.rail*.1,X-=s.rail*.1,ue+=s.check*(.75+Math.sin(this.t*6)*.08),H+=s.check*.35,V+=s.watch*.3,ue+=s.watch*.36,Kt+=s.watch*1.75,H+=s.watch*1.7,$-=s.watch*.95,nt+=s.watch*.85,s.cheer>.01){let et=Math.sin(this.t*9)*.3*s.cheer;V+=s.armUp*2.55+et,ue+=s.armUp*2.55-et,Kt+=s.cheer*.25,H+=s.cheer*.25,R-=s.cheer*.3,X+=s.cheer*.3}if(V+=s.shrug*.3,ue+=s.shrug*.3,Kt+=s.shrug*1.6,H+=s.shrug*1.6,R+=s.shrug*1.4,X-=s.shrug*1.4,V+=it*1.15,ue+=it*1.05,Kt+=it*1.45,H+=it*1.5,R+=it*.2,X-=it*.2,V+=lt*1,ue+=lt*1.2,Kt+=lt*.12,H+=lt*.05,R+=lt*.12,X-=lt*.12,s.wipe>.01){let et=this.wipeSt||0;V+=s.wipe*(.3-.9*et),ue+=s.wipe*(.3-.9*et),Kt+=s.wipe*(.9-.85*et),H+=s.wipe*(.9-.85*et),R+=s.wipe*.1,X-=s.wipe*.1,$-=s.wipe*.25*(1-et),nt+=s.wipe*.25*(1-et)}Pe>.01&&(V+=Pe*Xe*1.15,ue+=Pe*Xe*1.15,Kt+=Pe*Xe*1.25,H+=Pe*Xe*1.25,R+=Pe*(.12+.25*Xe),X-=Pe*(.12+.25*Xe)),ue+=c*1.6,H+=c*1.85-h*.7,X-=c*.55+h*.25,V+=s.peer*.85,ue+=s.peer*.85,Kt+=s.peer*.25,H+=s.peer*.25,R+=s.peer*.1,X-=s.peer*.1,V+=E*2.7,ue+=E*2.7,Kt+=E*.1,H+=E*.1,R-=E*.12,X+=E*.12;let mt=Math.sin(this.fidgetT*7)*A;V+=T*1.25,ue+=T*1.1,Kt+=T*1.3,H+=T*1.4,R+=T*.15,X-=T*.15;let st=Math.min(1,Math.abs(P)+Math.abs(N))*(1-s.rail);R+=st*.3+Math.max(0,-N)*.25,X-=st*.3+Math.max(0,N)*.25,V-=F*.2,ue-=F*.2,Kt+=F*.5,H+=F*.5,this.armL.rotation.set(R,$,V),this.armR.rotation.set(X,nt,ue),this.armL.position.y=.53+at*.004+mt*.04+A*.02+wt*.15,this.armR.position.y=.53+at*.004-mt*.04+A*.02+wt*.15,this.elbowL.rotation.z=Kt,this.elbowR.rotation.z=H,this.nozzle.visible=s.hose>.5;let rt=s.look*Math.sin(this.t*.5+this.i)*.7,xt=(1-s.look)*this.gaze*(_?1:.3)*(1-s.hose);this.head.rotation.set(M*Math.sin(this.fidgetT*4)*.25-Ct*1.5+s.shrug*.38,rt+xt+(this.headTurn||0)-L*.12*D-T*.35+gt*.45,s.lean*.3+s.peer*.45-s.crouch*.1+E*.35+T*.2-s.brow*.1-a-s.wipe*.3-Pe*.15-c*.1+it*.25+lt*.2),this.eyes.scale.y=this.blink>0||T>.5?.15:1}};var Rt=(i,t,e)=>new x(i,t,e),pd=.62,Fc=1.8;function Ey(i,t){let e=new yt,n=new yt;e.add(n);let s=new J(t),o=s.clone().multiplyScalar(.62),r=s.clone().lerp(new J(1,.85,.7),.25),a=new J(.86,.78,.62),l=new J(.16,.11,.09),c=s.clone().multiplyScalar(.78),h=new Bt,d=16,u=(w,T,P,N=0)=>{let F=[];for(let D=0;D<d;D++){let z=D/d*Math.PI*2,L=Math.cos(z)*w,U=Math.sin(z)*T;Math.cos(z)>0&&(L*=1-N*Math.pow(Math.cos(z),4)),F.push(Rt(L,P,U))}return F},m=Rt(-.01,.168,0),g=u(.085,.13,.155,.1),y=u(.15,.215,.105,.22),p=u(.165,.235,.07,.25),f=u(.14,.2,.03,.2),v=(w,T)=>{let P=w/d*Math.PI*2;return(Math.sin(P*3+1.3)>.55?1:0)?T.clone().lerp(c,.6):T};for(let w=0;w<d;w++){let T=(w+1)%d;h.tri(m,g[T],g[w],r),h.quad(g[w],g[T],y[T],y[w],v(w,r.clone().lerp(s,.4))),h.quad(y[w],y[T],p[T],p[w],v(w+3,s)),h.quad(p[w],p[T],f[T],f[w],o),h.tri(Rt(0,.025,0),f[w],f[T],a)}for(let w of[-1,1]){for(let[F,D]of[[.22,.03],[.5,.035],[.82,.04]]){let z=Math.cos(F)*.165*(1-.25*Math.pow(Math.cos(F),4)),L=w*Math.sin(F)*.235,U=Rt(Math.cos(F),0,w*Math.sin(F)),O=Rt(z,.075,L).addScaledVector(Rt(-U.z,0,U.x),.018),k=Rt(z,.075,L).addScaledVector(Rt(-U.z,0,U.x),-.018),W=Rt(z,.078,L).addScaledVector(U,D);h.tri(O,k,W,o),h.tri(k,O,W,o)}let T=1.35,P=Rt(Math.cos(T)*.165,.075,w*Math.sin(T)*.235),N=P.clone().add(Rt(.02,.01,w*.07));h.tri(P.clone().add(Rt(.025,0,0)),P.clone().add(Rt(-.025,0,0)),N,r),h.tri(P.clone().add(Rt(-.025,0,0)),P.clone().add(Rt(.025,0,0)),N,r)}h.box(Rt(.15,.05,0),Rt(.02,0,0),Rt(0,.022,0),Rt(0,0,.045),o);let S=new Bt;for(let w of[-1,1])S.box(Rt(.15,.125,w*.05),Rt(.012,0,0),Rt(0,.03,0),Rt(0,0,.012),o),S.box(Rt(.155,.16,w*.05),Rt(.019,0,0),Rt(0,.019,0),Rt(0,0,.019),new J(.06,.05,.045)),S.box(Rt(.163,.168,w*.045),Rt(.006,0,0),Rt(0,.006,0),Rt(0,0,.006),new J(.7,.68,.6));let _=Nt({vertexColors:!0,spec:.35,shin:18,item:!0}),b=new ut(h.build(),_);b.castShadow=!0,n.add(b);let E=new ut(S.build(),_);n.add(E);let A=[];for(let w of[-1,1])for(let T=0;T<4;T++){let P=new yt;P.position.set(.07-T*.055,.06,w*.18);let N=new Bt,F=1-Math.abs(T-1.2)*.08,D=Rt(0,0,0),z=Rt(0,.075,w*.13*F),L=Rt(0,.025,w*.235*F),U=Rt(0,-.06,w*.285*F);N.beam(D,z,Rt(1,0,0),.032,.026,s),N.beam(z,L,Rt(1,0,0),.026,.022,r.clone().lerp(s,.5)),N.beam(L,U,Rt(1,0,0),.018,.016,o),N.box(U,Rt(.008,0,0),Rt(0,.012,0),Rt(0,0,.008),l),N.box(z,Rt(.018,0,0),Rt(0,.016,0),Rt(0,0,.016),o);let O=new ut(N.build(),_);O.castShadow=!0,P.add(O),P.rotation.y=(T-1.5)*.32*w,n.add(P),A.push({g:P,s:w,i:T,base:P.rotation.y})}let M=[];for(let w of[-1,1]){let T=new yt;T.position.set(.14,.07,w*.1);let P=new Bt;P.beam(Rt(0,0,0),Rt(.06,.03,w*.07),Rt(0,1,0),.04,.035,s),P.beam(Rt(.06,.03,w*.07),Rt(.12,.035,w*.08),Rt(0,1,0),.042,.038,r.clone().lerp(s,.3)),P.box(Rt(.17,.04,w*.08),Rt(.055,0,0),Rt(0,.04,0),Rt(0,0,.034),r),P.box(Rt(.17,.065,w*.08),Rt(.045,0,0),Rt(0,.012,0),Rt(0,0,.026),r.clone().lerp(new J(1,1,1),.15)),P.beam(Rt(.22,.03,w*.075),Rt(.285,.022,w*.065),Rt(0,1,0),.026,.026,o),P.beam(Rt(.285,.022,w*.065),Rt(.31,.02,w*.06),Rt(0,1,0),.016,.016,l);let N=new ut(P.build(),_);N.castShadow=!0,T.add(N);let F=new yt;F.position.set(.215,.055,w*.09);let D=new Bt;D.beam(Rt(0,0,0),Rt(.07,-.01,-w*.012),Rt(0,1,0),.024,.022,o),D.beam(Rt(.07,-.01,-w*.012),Rt(.095,-.018,-w*.02),Rt(0,1,0),.015,.015,l);let z=new ut(D.build(),_);z.castShadow=!0,F.add(z),T.add(F),n.add(T),M.push({g:T,pinch:F,s:w})}return e.scale.setScalar(i),{root:e,body:n,eyes:E,legs:A,claws:M,mats:[_]}}var wy=0,cs=class{constructor(t){this.id=++wy,this.key=!!t.key,this.scale=t.scale||1.6,this.model=Ey(this.scale,t.color||12603434),this.group=this.model.root,this.pos=new x,this.dir=0,this.moveDir=0,this.speed=0,this.route=t.route,this.home=t.home,this.rnd=Ce(t.seed||7),this.state="rest",this.timer=t.startDelay??3,this.stop=-1,this.target=null,this.legPh=0,this.dig=0,this.mode="sea",this.hidden=!1,this.onDig=t.onDig||null,this.tracks=t.tracks||null,this.lastTrack=new x,this.r=.24*this.scale/1.6}place(t,e){this.pos.set(t,Be(t,e),e),this.lastTrack.copy(this.pos)}get catchable(){return this.mode==="sea"&&!this.hidden}capture(){this.mode="net",this.state="caught",this.mark(!1)}mark(t){for(let e of this.model.mats)e.uniforms.uItemMark&&(e.uniforms.uItemMark.value=t?1:0)}makeCaptive(){return this.mark(!1),this.group.parent&&this.group.parent.remove(this.group),this.group.position.set(0,0,0),this.group.rotation.set(0,0,0),this}setMode(t){this.mode=t,(t==="deck"||t==="tank")&&(this.group.rotation.set(0,this.group.rotation.y,0),t==="tank"&&(this.tankT=0))}startle(t,e,n){if(this.mode!=="sea"||this.state==="flee"||this.state==="hide")return;let s=Math.hypot(this.pos.x-t,this.pos.z-e);if(n&&s<n-.1){this.trapped={x:t,z:e,R:n,t:0},this.state="trapped";return}this.state="flee",this.target=this.home,this.fleeFrom={x:t,z:e},this.rear=pd,this.startled=!0}update(t,e,n){let s=this.model;if(this.mode==="net")return;if(this.mode==="held"){this.legPh+=t*16,this.animLegs(1.2,t,!0);return}if(this.mode==="deck"){this.legPh+=t*10,this.animLegs(.6,t,!0),s.body.position.y=.012*Math.sin(e*12),this.animThreat(t*.6,e);return}if(this.mode==="tank"){this.tankT+=t;let c=this.tankT,h=Math.sin(c*.35)*.12;this.group.position.x=-.4+h,this.group.position.z=1.45+Math.sin(c*.21+1)*.05,this.group.position.y=.95+.1;let d=Math.min(1,c/1.3),u=(d<.5?2*d*d:1-Math.pow(-2*d+2,2)/2)*Math.PI*2;this.group.rotation.y=.2+Math.sin(c*.3)*.4+u,this.legPh+=t*(c<1.3?16:6*Math.abs(Math.cos(c*.35))),this.animLegs(c<1.3?1:.5,t,!1),this.group.scale.setScalar(this.scale*.5);return}this.think(t,n),this.move(t),n&&n.sound&&this.sounds(t,n);let o=q0(this.pos.x,this.pos.z);this.group.position.copy(this.pos);let r=new Ze().setFromUnitVectors(Rt(0,1,0),o),a=new Ze().setFromAxisAngle(Rt(0,1,0),this.dir);this.group.quaternion.copy(r).multiply(a),this.group.visible=!0,this.animLegs(this.speed>.05?1:0,t,!1);let l=this.state==="dig"?1:0;this.dig=vn(this.dig,l,6,t);for(let c of s.claws){let h=e*6+(c.s>0?0:Math.PI);c.g.rotation.z=-this.dig*(.35+Math.max(0,Math.sin(h))*.6)+(1-this.dig)*Math.sin(e*1.3+c.s)*.08,c.pinch.rotation.y=c.s*(.1+Math.max(0,Math.sin(e*3+c.s))*.3)}s.body.rotation.z=-this.dig*.18,this.animBurrow(t,e,n),this.animRear(t,e)}animBurrow(t,e,n){let s=this.model,o=this.state==="hide",r=o&&this.timer<=Fc,a=o?r?.155:.27:0,l=this.sink||0;this.sink=vn(l,a,a>l?7:r?2.6:3.2,t),Math.abs(a-this.sink)>.02&&(this.legPh+=t*16,this.animLegs(1,t,!0)),this.eyeUp=vn(this.eyeUp||0,r?.06:0,r?3.5:6,t),s.body.position.y=-this.sink,s.eyes.position.y=this.eyeUp,s.body.rotation.y=r?Math.sin((Fc-this.timer)*2.4)*.4*Math.min(1,(Fc-this.timer)*1.5):vn(s.body.rotation.y,0,4,t);let c=n&&n.fx,h=o?r?"peek":"in":"out";if(c&&this.burrowSt&&h!==this.burrowSt){let d=this.scale/1.6,u=h==="peek"?3:9;for(let m=0;m<u;m++){let g=Math.random()*Math.PI*2,y=(h==="peek"?.4:.9)+Math.random()*.6;c.emit("sand",this.pos.x+Math.cos(g)*.12*d,this.pos.y+.05,this.pos.z+Math.sin(g)*.12*d,Math.cos(g)*y,.8+Math.random()*.9,Math.sin(g)*y)}c.emit("mud",this.pos.x,this.pos.y+.1,this.pos.z,0,.18,0,{size:(h==="peek"?.3:.55)*d*1.6,life:h==="peek"?1.8:3}),h!=="peek"&&n.sound&&n.sound("burrow",this)}this.burrowSt=h}animRear(t,e){let n=this.model;if(!(this.rear>-.3)){for(let a of n.claws)a.g.rotation.y=0;return}this.rear-=t;let s=1-this.rear/pd,o=Math.min(1,s/.12)*Math.min(1,(this.rear+.3)/.3),r=s<1?Math.max(0,Math.sin(s*Math.PI*4)):0;for(let a of n.claws)a.g.rotation.z=a.g.rotation.z*(1-o)+(.7+r*.32)*o,a.g.rotation.y=a.s*(.3+r*.12)*o,a.pinch.rotation.y=a.s*(.15+.5*r)*o;n.body.rotation.z+=.26*o,n.body.position.y+=(.025+r*.012)*o}animThreat(t,e){let n=this.model;if(this.threat=Math.max(0,(this.threat||0)-t*1.8),this.threat>0){let s=Math.sin(Math.min(1,this.threat)*Math.PI*.5),o=Math.sin(e*38)*.06*s;for(let r of n.claws)r.g.rotation.z=r.g.rotation.z*(1-s)+(.75+o)*s,r.g.rotation.y=r.s*.35*s,r.pinch.rotation.y=r.s*(.1+.55*s);n.body.rotation.z+=.22*s,n.body.position.y+=.02*s}else for(let s of n.claws)s.g.rotation.y=0}animLegs(t,e,n){let s=this.model;n||(this.legPh+=e*this.speed*30);for(let o of s.legs){let r=this.legPh+o.i*1.6+(o.s>0?Math.PI:0);o.g.rotation.x=Math.sin(r)*.35*t*o.s,o.g.rotation.y=o.base+Math.cos(r)*.22*t,n&&(o.g.rotation.x=Math.sin(r*1.7)*.6*t*o.s)}if(n)for(let o of s.claws)o.g.rotation.z=-.5+Math.sin(this.legPh*.8+o.s)*.5}sounds(t,e){this.sndT=(this.sndT||0)-t,this.startled&&(this.startled=!1,e.sound("threat",this),this.sndT=.5),!(this.sndT>0)&&((this.state==="walk"||this.state==="flee")&&this.speed>.05?(this.sndT=this.state==="flee"?.24:.46,e.sound("step",this)):this.state==="dig"&&(this.sndT=.5+this.rnd()*.35,e.sound("dig",this)))}think(t,e){switch(this.timer-=t,this.state){case"rest":this.speed=0,this.timer<=0&&this.nextStop();break;case"walk":case"flee":if(this.state==="flee"&&this.speed>.4&&e&&e.fx&&Math.random()<t*9){let n=this.moveDir+Math.PI+(Math.random()-.5)*1.2;e.fx.emit("sand",this.pos.x,this.pos.y+.04,this.pos.z,Math.cos(n)*.7,.7+Math.random()*.5,-Math.sin(n)*.7)}this.target&&Math.hypot(this.target.x-this.pos.x,this.target.z-this.pos.z)<.08&&(this.state==="flee"?(this.state="hide",this.timer=Fc+1.2+this.rnd()*1.2,this.hidden=!0):this.arrive());break;case"dig":case"pause":if(this.speed=0,this.state==="dig"&&this.onDig&&this.onDig(this,t),this.state==="dig"&&e&&e.fx&&Math.random()<t*3.2){let n=this.dir+(Math.random()-.5),s=this.pos.x+Math.cos(n)*.3*this.scale/1.6,o=this.pos.z-Math.sin(n)*.3*this.scale/1.6;e.fx.emit("mud",s,this.pos.y+.12,o,(Math.random()-.5)*.3,.25,(Math.random()-.5)*.3,{size:.45,life:4.5}),e.fx.emit("sand",s,this.pos.y+.05,o,(Math.random()-.5)*.8,.9,(Math.random()-.5)*.8)}this.timer<=0&&this.nextStop();break;case"hide":this.speed=0,this.timer<=0&&(this.hidden=!1,this.state="rest",this.timer=1,this.stop=-1);break;case"trapped":{let n=this.trapped;if(n.t+=t,!this.target||Math.hypot(this.target.x-this.pos.x,this.target.z-this.pos.z)<.1){let s=this.rnd()*Math.PI*2,o=this.rnd()*(n.R-.35);this.target={x:n.x+Math.cos(s)*o,z:n.z+Math.sin(s)*o}}n.t>6&&(this.state="rest",this.timer=.5,this.trapped=null);break}}}nextStop(){let t=this.route;this.stop=(this.stop+1)%(t.length+1),this.stop===t.length?(this.target=this.home,this.state="walk",this.homeBound=!0):(this.target=t[this.stop],this.state="walk",this.homeBound=!1)}arrive(){if(this.homeBound){this.state="hide",this.hidden=!0,this.timer=5+this.rnd()*3;return}let t=this.route[this.stop];this.state=t.dig?"dig":"pause",this.timer=t.t}predict(t,e=.05){let n=this.route,s=this.state,o=this.timer,r=this.stop,a=this.target,l=this.homeBound,c=this.pos.x,h=this.pos.z,d=this.speed,u=this.hidden,m=()=>{r=(r+1)%(n.length+1),l=r===n.length,a=l?this.home:n[r],s="walk"};for(let g=0;g<t;g+=e){if(o-=e,s==="rest")o<=0&&m();else if(s==="walk"||s==="flee"){if(a&&Math.hypot(a.x-c,a.z-h)<.08){if(s==="flee"||l)return{x:c,z:h,hidden:!0,st:"hide"};s=n[r].dig?"dig":"pause",o=n[r].t}}else s==="dig"||s==="pause"?o<=0&&m():s==="hide"&&o<=0&&(u=!1,s="rest",o=1,r=-1);let y=(s==="walk"||s==="flee")&&a;if(d=vn(d,y?s==="flee"?1.25:.42:0,5,e),y){let p=a.x-c,f=a.z-h,v=Math.hypot(p,f),S=Math.min(v,d*e);c+=p/(v||1)*S,h+=f/(v||1)*S}}return{x:c,z:h,hidden:u,st:s}}move(t){let e=this.target,n=(this.state==="walk"||this.state==="flee"||this.state==="trapped")&&e,s=this.state==="flee"?1.25:this.state==="trapped"?1.1:.42,o=this.state==="flee"&&this.rear>0;if(this.speed=vn(this.speed,n&&!o?s:0,o?12:5,t),o&&this.fleeFrom)this.dir=uo(this.dir,Math.atan2(-(this.fleeFrom.z-this.pos.z),this.fleeFrom.x-this.pos.x),9,t);else if(n){let r=e.x-this.pos.x,a=e.z-this.pos.z,l=Math.hypot(r,a),c=Math.atan2(-a,r);this.moveDir=c;let h=wc(c-this.dir)>0?Math.PI/2:-Math.PI/2;this.state!=="trapped"&&(this.dir=uo(this.dir,c-h,2.2,t));let d=Math.min(l,this.speed*t);if(this.pos.x+=r/(l||1)*d,this.pos.z+=a/(l||1)*d,this.trapped){let u=this.pos.x-this.trapped.x,m=this.pos.z-this.trapped.z,g=Math.hypot(u,m),y=this.trapped.R-.3;g>y&&(this.pos.x=this.trapped.x+u/g*y,this.pos.z=this.trapped.z+m/g*y)}}else if(this.state==="dig"||this.state==="pause"){let r=this.route[this.stop];r&&r.face!==void 0&&(this.dir=uo(this.dir,r.face,2,t))}this.pos.y=Be(this.pos.x,this.pos.z),this.tracks&&this.speed>.1&&this.pos.distanceTo(this.lastTrack)>.22*this.scale/1.6&&(this.tracks.add(this.pos,this.moveDir,this.scale),this.lastTrack.copy(this.pos))}animateStruggle(t,e){this.legPh+=t*18,this.animLegs(1.3,t,!0)}};var zc=.6,en=60,Xn=10;var De={back:new J(.15,.18,.2),flank:new J(.26,.3,.3),belly:new J(.5,.5,.45),spot:new J(.56,.6,.55),scar:new J(.62,.6,.54),crest:new J(.25,.17,.16),crestRay:new J(.13,.1,.1),fin:new J(.2,.22,.23),finRay:new J(.12,.13,.14),skull:new J(.18,.21,.22),jaw:new J(.42,.42,.38),mouth:new J(.1,.05,.05),tooth:new J(.78,.76,.66)};function md(i){let t=.95+.25*Vt(0,.1,i),e=1-Math.pow(Vt(.32,1,i),.85)*.93;return t*e*1.08}var jt=(i,t,e)=>new x(i,t,e);function by(i){let t=new yt,e=new Bt,n=(d,u,m,g,y,p,f,v,S=0)=>{let _=[jt(d,f-m+S,-g),jt(d,f-m+S,g),jt(d,f+m,g),jt(d,f+m,-g),jt(u,f-y+S,-p),jt(u,f-y+S,p),jt(u,f+y,p),jt(u,f+y,-p)];e.quad(_[0],_[1],_[2],_[3],v),e.quad(_[4],_[7],_[6],_[5],v),e.quad(_[3],_[2],_[6],_[7],v),e.quad(_[0],_[4],_[5],_[1],v),e.quad(_[1],_[5],_[6],_[2],v),e.quad(_[0],_[3],_[7],_[4],v)};n(-.6,1.2,.72,1.02,.55,.86,.12,De.skull),n(1.2,2.5,.55,.86,.32,.5,.16,De.skull),n(2.5,3.05,.32,.5,.18,.3,.2,De.skull.clone().multiplyScalar(1.15));for(let d of[-1,1]){e.box(jt(1.55,.72,d*.62),jt(.55,0,0),jt(0,.12,0),jt(0,0,.16),De.skull.clone().multiplyScalar(.8)),e.box(jt(2.85,.36,d*.16),jt(.06,0,0),jt(0,.03,0),jt(0,0,.05),De.mouth);for(let u=0;u<3;u++)e.box(jt(-.2-u*.22,.05,d*1),jt(.035,0,0),jt(0,.42,0),jt(0,0,.04),De.back.clone().multiplyScalar(.6))}for(let d=0;d<5;d++)e.box(jt(2.2-d*.55,.78-d*0,0),jt(.2,0,0),jt(0,.07,0),jt(0,0,.18-d*.015),De.spot.clone().multiplyScalar(.75));for(let d of[-1,1])for(let u=0;u<7;u++){let m=.9+u*.3,g=d*(.78-u*.07);e.tri(jt(m-.08,-.32,g),jt(m+.08,-.32,g),jt(m,-.55,g*.97),De.tooth),e.tri(jt(m+.08,-.32,g),jt(m-.08,-.32,g),jt(m,-.55,g*.97),De.tooth)}let s=new ut(e.build(),i);t.add(s);let o=new yt;o.position.set(-.3,-.25,0);let r=new Bt,a=(d,u,m,g,y,p,f)=>{let v=[jt(d,-m,-g),jt(d,-m,g),jt(d,0,g),jt(d,0,-g),jt(u,-y,-p),jt(u,-y,p),jt(u,0,p),jt(u,0,-p)];r.quad(v[0],v[1],v[2],v[3],f),r.quad(v[4],v[7],v[6],v[5],f),r.quad(v[3],v[2],v[6],v[7],De.mouth),r.quad(v[0],v[4],v[5],v[1],f),r.quad(v[1],v[5],v[6],v[2],f),r.quad(v[0],v[3],v[7],v[4],f)};a(0,1.6,.42,.92,.3,.7,De.jaw),a(1.6,3,.3,.7,.14,.32,De.jaw.clone().multiplyScalar(.92));for(let d of[-1,1])for(let u=0;u<7;u++){let m=1+u*.28,g=d*(.66-u*.055);r.tri(jt(m-.07,0,g),jt(m+.07,0,g),jt(m,.2,g*.97),De.tooth),r.tri(jt(m+.07,0,g),jt(m-.07,0,g),jt(m,.2,g*.97),De.tooth)}let l=new ut(r.build(),i);o.add(l),t.add(o);let c=Nt({color:10135706,emissive:4872784,see:zc}),h=[];for(let d of[-1,1]){let u=new ut(new On(.17,0),c);u.position.set(1.5,.5,d*.82),u.scale.set(1.2,.8,.6),t.add(u),h.push(u);let m=new ut(new dn(.06,.16,.02),Nt({color:789773}));m.position.set(1.55,.5,d*.92),t.add(m)}return t.traverse(d=>{d.isMesh&&(d.castShadow=!1)}),{head:t,jaw:o,eyes:h}}function Sy(i,t,e,n){let s=new Bt,o=[];for(let c=0;c<n;c++){let h=c/(n-1)*1-.15,d=t*(1-Math.abs(c/(n-1)-.35)*.6);o.push(jt(Math.sin(h)*d*.8,-.05*c,Math.cos(h)*d*e))}let r=jt(0,0,0);for(let c=0;c<n-1;c++){let h=c%2?De.fin:De.fin.clone().multiplyScalar(1.12);s.tri(r,o[c],o[c+1],h),s.tri(r,o[c+1],o[c],h)}for(let c=0;c<n;c++)s.beam(r,o[c],jt(0,1,0),.07,.05,De.finRay);let a=new ut(s.build(),i);a.castShadow=!0;let l=new yt;return l.add(a),l}var Oc=class{constructor(){this.group=new yt,this.group.name="leviathan-body";let t=Ce(909);this.mat=Nt({vertexColors:!0,flat:!0,spec:.18,shin:10,side:me,see:zc});let e=[],n=[],s=[],o=[];for(let _=0;_<en;_++)o.push(Math.pow(_/(en-1),1.05));let r=[];for(let _=0;_<46;_++)r.push([t()*.85+.03,(t()-.5)*3.2+(t()<.5?Math.PI*.5:-Math.PI*.5),.012+t()*.02]);let a=[[.22,.9,.06],[.31,-1.1,.05],[.47,.6,.04]];for(let _=0;_<en;_++){let b=o[_];for(let E=0;E<Xn;E++){let A=E/Xn*Math.PI*2;e.push([b,Math.cos(A),Math.sin(A),0]);let M=Math.cos(A),w=M>0?De.flank.clone().lerp(De.back,Vt(.1,.8,M)):De.flank.clone().lerp(De.belly,Vt(-.05,-.75,M));Math.sin(b*62)>.86&&M>-.3&&w.multiplyScalar(.82);for(let[T,P,N]of r){let F=Math.atan2(Math.sin(A-P),Math.cos(A-P));Math.abs(b-T)<N&&Math.abs(F)<.45&&w.lerp(De.spot,.75)}for(let[T,P,N]of a){let F=Math.atan2(Math.sin(A-P),Math.cos(A-P));Math.abs(b-T)<N&&Math.abs(F-(b-T)*6)<.18&&w.lerp(De.scar,.8)}if(n.push(w),_<en-1){let T=_*Xn+E,P=_*Xn+(E+1)%Xn;s.push(T,P,T+Xn,P,P+Xn,T+Xn)}}}let l=e.length;e.push([1,0,0,0]),n.push(De.back.clone());for(let _=0;_<Xn;_++)s.push((en-1)*Xn+_,(en-1)*Xn+(_+1)%Xn,l);let c=e.length,h=[];for(let _=1;_<en;_++)o[_]>.02&&o[_]<.98&&h.push(_);h.forEach((_,b)=>{let E=o[_];e.push([E,.9,0,1]),e.push([E,.9,0,2]);let A=b%2?De.crest:De.crestRay;if(n.push(A.clone().multiplyScalar(.8),A.clone()),b<h.length-1){let M=c+b*2;s.push(M,M+2,M+1,M+1,M+2,M+3)}});let d=e.length,u=[];for(let _=0;_<en;_++)o[_]>.42&&o[_]<.99&&u.push(_);for(let _ of[-1,1]){let b=e.length;u.forEach((E,A)=>{let M=o[E];e.push([M,-.15,_*.95,3]),e.push([M,-.15,_*.95,4*_]);let w=A%2?De.fin:De.finRay;if(n.push(w.clone(),w.clone().multiplyScalar(1.15)),A<u.length-1){let T=b+A*2;s.push(T,T+2,T+1,T+1,T+2,T+3)}})}this.rest=e;let m=e.length,g=new Float32Array(m*3),y=new Float32Array(m*3);n.forEach((_,b)=>{y[b*3]=_.r,y[b*3+1]=_.g,y[b*3+2]=_.b});let p=new oe;p.setAttribute("position",new ve(g,3).setUsage(ni)),p.setAttribute("normal",new ve(new Float32Array(m*3).fill(0),3)),p.setAttribute("color",new ve(y,3)),p.setIndex(s),this.geo=p,this.mesh=new ut(p,this.mat),this.mesh.frustumCulled=!1,this.mesh.castShadow=!0,this.group.add(this.mesh);let f=Nt({vertexColors:!0,flat:!0,side:me,see:zc}),v=by(this.mat);this.head=v.head,this.jaw=v.jaw,this.eyes=v.eyes,this.group.add(this.head),this.fins=[];for(let[_,b,E,A,M]of[[.07,4.6,.95,6,0],[.3,2.4,.8,5,1.2]])for(let w of[-1,1]){let T=Sy(f,b,E,A);this.group.add(T),this.fins.push({f:T,u:_,s:w,ph:M})}this.barbels=[];let S=Nt({color:3817536,flat:!0,side:me,see:zc});for(let _ of[-1,1]){let E=new oe;E.setAttribute("position",new ve(new Float32Array(168),3).setUsage(ni));let A=[];for(let w=0;w<13;w++)for(let T=0;T<4;T++){let P=w*4+T,N=w*4+(T+1)%4;A.push(P,N,P+4,N,N+4,P+4)}E.setIndex(A);let M=new ut(E,S);M.frustumCulled=!1,this.group.add(M),this.barbels.push({s:_,m:M,pts:Array.from({length:14},()=>new x),init:!1,N:14,seg:.42})}this.spine=Array.from({length:en},()=>new x),this._T=Array.from({length:en},()=>new x),this._N=Array.from({length:en},()=>new x),this._B=Array.from({length:en},()=>new x),this.ringU=o}pose(t,e,n=1){let s=this.rest,o=this.geo.attributes.position.array,r=new x(0,1,0);for(let l=0;l<en;l++)t(this.ringU[l],this.spine[l]);for(let l=0;l<en;l++){let c=this.spine[Math.max(0,l-1)],h=this.spine[Math.min(en-1,l+1)],d=this._T[l].subVectors(c,h).normalize(),u=this._B[l].crossVectors(d,r).normalize();if(this._N[l].crossVectors(u,d).normalize(),l>0&&l<en-1){let m=this._T[Math.max(0,l-1)]}}let a=l=>(.55+.45*Math.sin(Math.min(1,l*5)*Math.PI*.5))*(1-Vt(.7,1,l)*.75)*1;for(let l=0;l<s.length;l++){let[c,h,d,u]=s[l],m=Math.pow(c,1/1.05)*(en-1),g=Math.min(en-2,Math.floor(m)),y=m-g,p=gd.copy(this.spine[g]).lerp(this.spine[g+1],y),f=xd.copy(this._N[g]).lerp(this._N[g+1],y),v=Rh.copy(this._B[g]).lerp(this._B[g+1],y),S=md(c)*n,_=h*S*.78,b=d*S;if(u===1)_=S*.72,b=0;else if(u===2){let E=a(c)*n;_=S*.72+E,b=Math.sin(e*2.2-c*34)*.16*E}else if(u===3)_=-S*.1,b=Math.sign(d)*S*.92;else if(u===4||u===-4){let E=Math.sign(u),A=Math.sin(e*2.6-c*40+E),M=(.35+.35*Vt(.42,.8,c))*n*(1-Vt(.92,1,c)*.6);_=-S*.1+A*.14*M*2,b=E*(S*.92+M)}c>=.999&&u===0&&h===0&&d===0&&(_=0,b=0),o[l*3]=p.x+f.x*_+v.x*b,o[l*3+1]=p.y+f.y*_+v.y*b,o[l*3+2]=p.z+f.z*_+v.z*b}this.geo.attributes.position.needsUpdate=!0;{let l=this.spine[0],c=this._T[0],h=this._N[0],d=this._B[0],u=Ah.makeBasis(c,h,d);this.head.quaternion.setFromRotationMatrix(u),this.head.position.copy(l).addScaledVector(c,.55*n),this.head.scale.setScalar(n),this.jaw.rotation.z=-(.05+.13*Math.max(0,Math.sin(e*.45))**2);let m=Math.sin(e*.7)>.985?.2:1;for(let g of this.eyes)g.scale.y=.8*m}for(let l of this.fins){let c=Math.pow(l.u,.9523809523809523)*(en-1),h=Math.min(en-2,Math.floor(c)),d=this.spine[h],u=this._T[h],m=this._N[h],g=this._B[h];Ah.makeBasis(yd.copy(u).negate(),m,Rh.copy(g).negate()),l.f.quaternion.setFromRotationMatrix(Ah);let y=Math.sin(e*.9+l.ph)*.35,p=Math.sin(e*.9+l.ph-1.1)*.25;l.f.quaternion.multiply(Ty.setFromEuler(Ry.set(y*l.s,-l.s*p,0)));let f=md(l.u)*n;l.f.position.copy(d).addScaledVector(g,l.s*f*.85).addScaledVector(m,-f*.2),l.f.scale.set(n,n,-l.s*n)}{let l=this.spine[0],c=this._T[0],h=this._N[0],d=this._B[0];for(let u of this.barbels){let m=gd.copy(l).addScaledVector(c,3*n).addScaledVector(d,u.s*.3*n).addScaledVector(h,-.15*n),g=u.pts;if(!u.init){for(let p=0;p<u.N;p++)g[p].copy(m).addScaledVector(c,-p*u.seg*n).addScaledVector(d,u.s*p*.12);u.init=!0}g[0].copy(m);for(let p=1;p<u.N;p++){let f=yd.copy(g[p-1]).addScaledVector(c,-u.seg*n*.9).addScaledVector(d,u.s*u.seg*n*(.35-p*.02)+Math.sin(e*1.3-p*.55)*.12*n).addScaledVector(h,-u.seg*n*(.18+p*.015));g[p].lerp(f,.18);let v=vd.subVectors(g[p],g[p-1]),S=v.length()||1;g[p].copy(g[p-1]).addScaledVector(v,u.seg*n/S)}let y=u.m.geometry.attributes.position.array;for(let p=0;p<u.N;p++){let f=.07*(1-p/u.N*.8)*n,v=vd.subVectors(g[Math.min(u.N-1,p+1)],g[Math.max(0,p-1)]).normalize(),S=xd.crossVectors(v,r).normalize(),_=Rh.crossVectors(S,v).normalize();for(let b=0;b<4;b++){let E=b/4*Math.PI*2,A=(p*4+b)*3;y[A]=g[p].x+(S.x*Math.cos(E)+_.x*Math.sin(E))*f,y[A+1]=g[p].y+(S.y*Math.cos(E)+_.y*Math.sin(E))*f,y[A+2]=g[p].z+(S.z*Math.cos(E)+_.z*Math.sin(E))*f}}u.m.geometry.attributes.position.needsUpdate=!0}}}},gd=new x,xd=new x,Rh=new x,yd=new x,vd=new x,Ah=new le,Ty=new Ze,Ry=new Dn;var Ay=0,Vc=class{constructor(t,e={}){this.id=++Ay,this.items=t,this.crab=e.crab||null,this.group=new yt,this.group.name="bundle";let n=Ce(this.id*97+13);this.rnd=n;let s=[...t].sort((g,y)=>y.r-g.r),o=.35,r=[];s.forEach((g,y)=>{let p=0,f=0;if(y>0){let v=y*2.4+n()*.5,S=Math.min(.75,s[0].r*.6+g.r*.6);p=Math.cos(v)*S,f=Math.sin(v)*S}r.push({it:g,x:p,z:f}),o=Math.max(o,Math.hypot(p,f)+g.r*.85)}),this.crab&&(o=Math.max(o,.45)),o=Math.min(o+.12,1.15),t.some(g=>g.def.precious)&&(o*=1.2),this.R=o,this.inner=new yt,this.group.add(this.inner);for(let g of r){let y=g.it.model.group,p=y.quaternion.clone();y.position.set(g.x,0,g.z),y.quaternion.copy(p),this.inner.add(y),this.inner.updateMatrixWorld(!0);let f=new Tn().setFromObject(y);y.position.y=.01-f.min.y,rs(g.it.model,1,.045),g.it.state="bundle"}this.crab&&(this.inner.add(this.crab.group),this.crab.group.position.set(o*.45,.08,-o*.2),this.crab.group.rotation.set(.3,n()*6,.2));let a=new On(1,3),l=a.attributes.position,c=new x,h=n()*100;for(let g=0;g<l.count;g++){c.fromBufferAttribute(l,g);let y=Math.sin(c.x*3.1+h)*Math.sin(c.y*2.7+h*.7)*Math.sin(c.z*3.3-h),p=Math.sin(c.x*7.3+h*1.3)*Math.sin(c.z*6.1+c.y*5.2),f=1+y*.16+p*.06;c.multiplyScalar(f),c.y=c.y<0?c.y*.35:c.y*.82,l.setXYZ(g,c.x*o,c.y*o+o*.28,c.z*o)}a.computeVertexNormals(),this.shellMat=Nt({color:16777215,dissolve:!0,side:me,spec:.3,shin:14,mud:{amount:1,inflate:0,seed:n()*30,scale:3,color:4931374,crust:1}}),this.shell=new yt,this.group.add(this.shell),this.plates=this.buildPlates(a,o,n);let d=new Bt,u=new J(.25,.27,.22);for(let g=0;g<7;g++){let y=n()*Math.PI*2,p=y+1.2+n()*1.6,f=null;for(let v=0;v<=8;v++){let S=y+(p-y)*(v/8),_=.25+Math.sin(v/8*Math.PI)*.5+g%3*.12,b=new x(Math.cos(S)*Math.cos(_)*o*1.03,Math.sin(_)*o*.86+o*.28,Math.sin(S)*Math.cos(_)*o*1.03);f&&d.beam(f,b,new x(0,1,0),.035,.035,u),f=b}}let m=new J(.36,.48,.24);for(let g=0;g<6;g++){let y=n()*Math.PI*2,p=new x(Math.cos(y)*o*.95,o*.4+n()*o*.3,Math.sin(y)*o*.95),f=new x(Math.cos(y)*.5,-.8,Math.sin(y)*.5).normalize(),v=p;for(let S=1;S<=4;S++){let _=p.clone().addScaledVector(f,S*.12).add(new x(Math.sin(S+g)*.04,0,Math.cos(S*1.3+g)*.04));d.beam(v,_,new x(Math.cos(y),0,Math.sin(y)),.07,.015,m.clone().multiplyScalar(.9+n()*.25)),v=_}}for(let g=0;g<10;g++){let y=n()*Math.PI*2,p=n()*1.1,f=new x(Math.cos(y)*Math.cos(p)*o*1,Math.sin(p)*o*.82+o*.28,Math.sin(y)*Math.cos(p)*o*1);d.box(f,new x(.05,0,.02),new x(0,.02,0),new x(-.02,0,.05),new J(.86,.82,.72))}this.debrisMat=Nt({vertexColors:!0,dissolve:!0}),this.debrisMat.uniforms.uDissolveSeed.value=this.shellMat.uniforms.uDissolveSeed.value,this.debris=new ut(d.build(),this.debrisMat),this.debris.castShadow=!0,this.group.add(this.debris),this.heavy=t.some(g=>g.def.heavy),this.precious=t.some(g=>g.def.precious),this.empty=t.length===0&&!this.crab,this.wiggle=0}buildPlates(t,e,n){let s=t.attributes.position,o=t.attributes.normal,r=new x(0,e*.28,0),a=Math.round(7+e*6),l=[];for(let v=0;v<a;v++){let S=1-(v+.5)/a*2,_=Math.sqrt(1-S*S),b=v*2.39996+n()*.7;l.push(new x(Math.cos(b)*_,S+(n()-.5)*.2,Math.sin(b)*_).normalize())}let c=l.map(()=>[]),h=new x,d=new x,u=new x;for(let v=0;v<s.count/3;v++){h.fromBufferAttribute(s,v*3).add(d.fromBufferAttribute(s,v*3+1)).add(u.fromBufferAttribute(s,v*3+2)).divideScalar(3).sub(r),h.x+=Math.sin(h.y*9+h.z*5)*.08*e,h.normalize();let S=0,_=-2;for(let b=0;b<a;b++){let E=h.dot(l[b]);E>_&&(_=E,S=b)}c[S].push(v)}let m=.1+e*.12,g=v=>`${v.x.toFixed(4)},${v.y.toFixed(4)},${v.z.toFixed(4)}`,y=v=>v.clone().sub(r).normalize().multiplyScalar(-m).add(v),p=[];for(let v of c){if(!v.length)continue;let S=[],_=[],b=(D,z,L,U)=>{if(S.push(D.x,D.y,D.z,z.x,z.y,z.z,L.x,L.y,L.z),U)_.push(...U);else{let O=new x().subVectors(z,D).cross(new x().subVectors(L,D)).normalize();for(let k=0;k<3;k++)_.push(O.x,O.y,O.z)}},E=new Map,A=new x,M=1e9;for(let D of v){let z=[0,1,2].map(O=>new x().fromBufferAttribute(s,D*3+O)),L=[0,1,2].map(O=>new x().fromBufferAttribute(o,D*3+O));b(z[0],z[1],z[2],[L[0].x,L[0].y,L[0].z,L[1].x,L[1].y,L[1].z,L[2].x,L[2].y,L[2].z]);let U=z.map(y);b(U[0],U[2],U[1]);for(let O=0;O<3;O++){let k=z[O],W=z[(O+1)%3],q=g(k),at=g(W),it=q<at?q+"|"+at:at+"|"+q,lt=E.get(it);lt?lt.n++:E.set(it,{n:1,a:k,b:W,wa:U[O],wb:U[(O+1)%3]})}A.add(z[0]).add(z[1]).add(z[2]),M=Math.min(M,z[0].y,z[1].y,z[2].y)}for(let D of E.values())D.n===1&&(b(D.b,D.a,D.wa),b(D.b,D.wa,D.wb));A.divideScalar(v.length*3);let w=new oe;w.setAttribute("position",new qt(S,3)),w.setAttribute("normal",new qt(_,3));let T=O0(this.shellMat),P=new ut(w,T);P.castShadow=!0;let N=new yt;N.position.copy(A),P.position.copy(A).negate(),N.add(P),this.shell.add(N);let F=A.clone().sub(r);F.y*=.4,F.normalize(),p.push({pivot:N,mesh:P,mat:T,cen:A.clone(),out:F,low:M,h:A.y,state:"on",v:new x,av:new x,t:0,k:1})}let f=p.map(v=>({p:v,s:-v.h/e+n()*.55})).sort((v,S)=>v.s-S.s).map(v=>v.p);return f.forEach((v,S)=>{v.at=.035+S/Math.max(1,f.length-1)*.36+(n()-.5)*.02}),f}schedule(t,e=.04,n=.84){this.group.updateMatrixWorld(!0);let s=this.items.map(M=>({g:M.model.group,precious:!!M.def.precious}));this.crab&&s.push({g:this.crab.group,precious:!1});let o=[],r=new x,a=new x,l=new x;if(s.forEach((M,w)=>{let T=[];M.g.traverse(N=>{if(!N.isMesh||!N.geometry||!N.geometry.attributes.position||N.visible===!1)return;let F=N.geometry.attributes.position,D=N.geometry.attributes.normal,z=new Jt().getNormalMatrix(N.matrixWorld),L=Math.max(1,Math.floor(F.count/90));for(let U=0;U<F.count;U+=L)r.fromBufferAttribute(F,U).applyMatrix4(N.matrixWorld),!(D&&(a.fromBufferAttribute(D,U).applyMatrix3(z).normalize(),a.dot(l.subVectors(t,r))<=0))&&T.push(r.clone())});let P=Math.max(1,Math.ceil(T.length/70));for(let N=0;N<T.length;N+=P)o.push({p:T[N],ti:w,by:[]})}),!s.length){for(let M=0;M<24;M++){let w=M*2.39996,T=Math.sqrt((M+.5)/24)*this.R*.55;o.push({p:this.group.localToWorld(new x(Math.cos(w)*T,.05,Math.sin(w)*T)),ti:0,by:[]})}s.push({g:null,precious:!1})}let c=new qo,h=this.plates.map(M=>M.mesh);for(let M of o){let w=l.subVectors(M.p,t),T=w.length();c.set(t,w.divideScalar(T)),c.far=T-.005;let P=new Set;for(let N of c.intersectObjects(h,!1))P.add(N.object);M.by=this.plates.filter(N=>P.has(N.mesh))}this.expPts=o,this.expN=s.map((M,w)=>o.filter(T=>T.ti===w).length||1),this.expMain=s.findIndex(M=>M.precious);let d=new Set(this.plates),u=this.group.worldToLocal(t.clone()),m=M=>M.cen.clone().sub(new x(0,this.R*.28,0)).normalize().dot(u.clone().sub(M.cen).normalize()),g=M=>s.map((w,T)=>{let P=0,N=0;for(let F of o)F.ti===T&&(N++,F.by.every(D=>M.has(D))&&P++);return N?P/N:1}),y=M=>M.reduce((w,T)=>w+T,0),p=new Set;this.revealAt=null;let f=g(p),v=[],S=M=>{for(let F of M)p.add(F);let w=g(p);for(let F of M)p.delete(F);let T=y(w)-y(f),P=w.reduce((F,D)=>F+Math.max(0,D-.45),0),N=M.reduce((F,D)=>F+m(D),0)/M.length;return{set:M,e:w,d:T,det:this.determined(w),s:T+P*2-N*.2-M.length*.01}},_=.04*s.length;for(;d.size;){let M=[...d],w=null;for(let T of M){let P=S([T]);!P.det&&P.d>=_&&(!w||P.s<w.s)&&(w=P)}if(!w)for(let T=0;T<M.length;T++)for(let P=T+1;P<M.length;P++){let N=S([M[T],M[P]]);!N.det&&N.d>=_&&(!w||N.s<w.s)&&(w=N)}if(!w){let T=null;for(let P of M){let N=S([P]);N.det&&(!T||N.d>T.d)&&(T=N)}if(!T)for(let P=0;P<M.length;P++)for(let N=P+1;N<M.length;N++){let F=S([M[P],M[N]]);F.det&&(!T||F.d>T.d)&&(T=F)}T||(T=S(M)),w=T}for(let T of w.set)d.delete(T),p.add(T);if(v.push(w.set.sort((T,P)=>m(P)-m(T))),f=w.e,w.det)break}if(this.peekBeat=null,this.expMain>=0){let M=g(new Set)[this.expMain],w=new Set,T=-1;for(let N=0;N<v.length;N++){for(let F of v[N])w.add(F);if(g(w)[this.expMain]>M+.04){T=N;break}}let P=Math.max(1,Math.round(v.length*.36));T>P&&T<v.length-1&&(v.splice(P,0,v.splice(T,1)[0]),T=P),T>=0&&T<v.length-1&&(this.peekBeat=v[T])}let b=v.length,E=[];v.forEach((M,w)=>M.forEach((T,P)=>{T.at=e+(b>1?w/(b-1):1)*(n-e)-(M.length-1-P)*.03,E.push(T)}));let A=E.length;for(let M of this.plates)E.includes(M)||(M.at=1/0);return this.beats=v,this.peekAt=this.peekBeat?Math.max(...this.peekBeat.map(M=>M.at)):null,this.lastPlate=E[A-1],this.revealAt=n,this.schedOrder=E,E}determined(t){return!this.items.length&&!this.crab?t[0]>=.5:t.every(e=>e>=.5)&&t.reduce((e,n)=>e+n,0)/t.length>=.6}exposure(){if(!this.expPts)return[];let t=this.expN.map(()=>0);for(let e of this.expPts)e.by.every(n=>n.state!=="on")&&t[e.ti]++;return t.map((e,n)=>e/this.expN[n])}burst(){for(let t of this.plates){if(t.state==="gone")continue;t.state==="rest"&&t.pivot.scale.set(1,1,1),t.state="fall",t.t=0;let e=2.2+this.rnd()*1.4;t.v.copy(t.out).setY(0).normalize().multiplyScalar(e),t.v.y=.4+this.rnd()*.7;let n=new x(0,1,0).cross(t.out).normalize();t.av.copy(n).multiplyScalar(-(4+this.rnd()*5)),t.burst=!0}this.cracked=!0}washPlates(t,e,n){this.shT=(this.shT||0)+e;let s=null;for(let o of this.plates)if(o.state==="on")if(t>=o.at){o.state="fall",this.cracked=!0,o.t=0;let r=.35+this.rnd()*.35;o.v.copy(o.out).multiplyScalar(r),o.v.y=o.h>this.R*.5?.35:.05;let a=new x(0,1,0).cross(o.out).normalize();o.av.copy(a).multiplyScalar(-(1.6+this.rnd()*1.6)),n&&n(o,o.pivot.getWorldPosition(new x))}else{(!s||o.at<s.at)&&(s=o);let r=ge((t-(o.at-.03))/.03,0,1);o.pivot.position.copy(o.cen).addScaledVector(o.out,Math.sin(this.shT*47)*.014*r+r*.025)}else if(o.state==="fall"){if(o.t+=e,o.burst){let h=Math.max(0,1-o.t/.26);if(o.pivot.scale.setScalar(Math.max(.01,h*h*(3-2*h))),h<=0){o.state="gone",o.pivot.visible=!1;continue}}o.v.y-=9.8*e,o.pivot.position.addScaledVector(o.v,e),o.pivot.rotation.x+=o.av.x*e,o.pivot.rotation.y+=o.av.y*e,o.pivot.rotation.z+=o.av.z*e;let r=o.pivot.position.clone().sub(new x(0,this.R*.28,0)),a=Math.hypot(r.x,r.z),l=this.R*.95*Math.sqrt(Math.max(0,1-Math.pow(Math.max(0,r.y)/(this.R*.82),2)));!o.burst&&a<l&&a>.001&&(o.pivot.position.x*=l/a,o.pivot.position.z*=l/a);let c=o.pivot.position.y-(o.cen.y-o.low)*.6;o.burst&&c<=0?(o.pivot.position.y-=c,o.v.y=Math.abs(o.v.y)*.2,o.v.x*=.75,o.v.z*=.75):c<=0&&(o.pivot.position.y-=c,o.state="rest",o.t=0,o.impact=Math.abs(o.v.y),o.v.set(0,0,0),n&&n(o,o.pivot.getWorldPosition(new x),!0))}else if(o.state==="rest"){o.t+=e;let r=Math.min(1,o.t/.1);o.pivot.scale.set(1+r*.3,Math.max(.15,1-r*.5-o.t*.6),1+r*.3),o.mat.uniforms.uDissolve.value=ge((o.t-.08)/.55,0,1),o.t>.7&&(o.state="gone",o.pivot.visible=!1)}return s}setDissolve(t){this.shellMat.uniforms.uDissolve.value=t,this.debrisMat.uniforms.uDissolve.value=Math.min(1,t*1.6);for(let e of this.plates)e.state==="on"&&(e.mat.uniforms.uDissolve.value=t);this.shell.visible=t<.99,this.debris.visible=t<.62}setDebris(t){this.debrisMat.uniforms.uDissolve.value=t,this.debris.visible=t<.99}update(t,e){if(this.crab){this.wiggle+=t;let n=Math.max(0,Math.sin(this.wiggle*9)*Math.sin(this.wiggle*2.3))*(this.loud?.05:.035),s=0;this.loud&&(this.jabT=(this.jabT??.35)-t,this.jabT<=0&&(this.jabT=.7+this.rnd()*.55,this.jab=1,this.jabA=this.rnd()*Math.PI*2,this.onJab&&!this.cracked&&this.onJab(this.jabA)),this.jab=Math.max(0,(this.jab||0)-t*3.4),s=Math.sin(Math.min(1,(1-this.jab)*5)*Math.PI/2)*this.jab),this.cracked&&(n=0,s=0);let o=Math.cos(this.jabA||0),r=Math.sin(this.jabA||0),a=this.R;this.shell.scale.set(1+n+s*.07,1-n*.6-s*.06,1+n*.5+s*.07),this.shell.position.set(o*s*.08*a,s*.06*a,r*s*.08*a),this.shell.rotation.set(r*s*.24,0,-o*s*.24),this.crab.animateStruggle(t,e)}}};var pn=(i,t="0 0 24 24")=>`<svg class="ic" viewBox="${t}" aria-hidden="true">${i}</svg>`,mr={fuel:pn('<path fill="currentColor" fill-rule="evenodd" d="M5 2h9a1 1 0 0 1 1 1v17h1v2H3v-2h1V3a1 1 0 0 1 1-1zm1.6 2.6v5.2h5.8V4.6z"/><path d="M15 8.5h2.4v9a1.6 1.6 0 0 0 3.2 0V8.2L18 5.2" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round" stroke-linecap="round"/>'),coin:pn('<circle cx="12" cy="12" r="9" fill="currentColor"/><circle cx="12" cy="12" r="5.6" fill="none" stroke="rgba(0,0,0,.38)" stroke-width="1.8"/><rect x="11" y="9" width="2" height="6" fill="rgba(0,0,0,.38)"/>'),crate:pn('<rect x="3" y="6" width="18" height="14" fill="currentColor"/><path d="M3 10h18M9 6v14M15 6v14" stroke="rgba(0,0,0,.38)" stroke-width="1.6"/><rect x="5" y="3" width="14" height="3" fill="currentColor"/>'),depth:pn('<path d="M2 6c3-2 5-2 8 0s5 2 8 0 3-1 4-1" fill="none" stroke="currentColor" stroke-width="2"/><path fill="currentColor" d="M11 9h2v8h3l-4 5-4-5h3z"/>'),sail:pn('<path fill="currentColor" d="M2 13h20l-3 6H5z"/><rect x="7" y="7" width="7" height="6" fill="currentColor"/><rect x="15" y="4" width="2" height="9" fill="currentColor"/>'),arm:pn('<path fill="currentColor" d="M3 20h8v2H3zM6 20V9l13-6 1 2-12 5.5V20z"/><path d="M18 5v7" stroke="currentColor" stroke-width="1.6"/><path d="M18 12a2.6 2.6 0 1 1-2.6 2.6" fill="none" stroke="currentColor" stroke-width="2"/>'),net:pn('<path d="M12 2v6" stroke="currentColor" stroke-width="2"/><ellipse cx="12" cy="9.5" rx="7" ry="2.2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M5 9.5l2 10h10l2-10M9 10l1 9.5M15 10l-1 9.5M6 14.5h12" fill="none" stroke="currentColor" stroke-width="1.6"/>'),ring:pn('<circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-dasharray="4.5 2.6"/><path d="M12 9v6M9 12h6" stroke="currentColor" stroke-width="1.8"/>'),yes:pn('<circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="3.4"/>'),miss:pn('<circle cx="11" cy="13" r="8" fill="none" stroke="currentColor" stroke-width="2.4" stroke-dasharray="3.6 2.4"/><circle cx="17.6" cy="6.4" r="5.4" fill="#ff8a6a" stroke="#2a0e08" stroke-width="1.4"/><path d="M15.6 4.4l4 4M19.6 4.4l-4 4" stroke="#2a0e08" stroke-width="1.8"/>'),hard:pn('<circle cx="11" cy="13" r="8" fill="none" stroke="currentColor" stroke-width="2.4" stroke-dasharray="3.6 2.4"/><circle cx="17.6" cy="6.4" r="5.4" fill="#ff9a4a" stroke="#2a1206" stroke-width="1.4"/><path d="M17.6 3.6v3.8" stroke="#10181b" stroke-width="1.9"/><rect x="16.65" y="8.3" width="1.9" height="1.9" fill="#10181b"/>'),reach:pn('<circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="1.8" stroke-dasharray="2.8 2.2"/><path fill="currentColor" d="M8 10.5h8l-1.2 3H9.2z"/>'),arrow:pn('<path fill="currentColor" opacity=".5" d="M1 3h5.5l9 9-9 9H1l9-9z"/><path fill="currentColor" d="M9 3h5.5l9 9-9 9H9l9-9z"/>'),sonar:pn('<rect x="2" y="3" width="20" height="18" fill="none" stroke="currentColor" stroke-width="2"/><path d="M4 14l4-1 3 1 4-2 5 1v6H4z" fill="currentColor"/><rect x="9" y="7" width="2" height="2" fill="currentColor"/><rect x="14" y="8" width="2" height="2" fill="currentColor"/>'),no:pn('<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2.6"/><path d="M6 18L18 6" stroke="currentColor" stroke-width="2.6"/>'),play:pn('<path fill="currentColor" d="M7 4l13 8-13 8z"/>'),anchor:pn('<circle cx="12" cy="4.6" r="2.3" fill="none" stroke="currentColor" stroke-width="1.9"/><path d="M12 7v14M7.5 10.5h9" stroke="currentColor" stroke-width="2.2"/><path d="M3.5 13.5c.6 4.4 4 7.2 8.5 7.2s7.9-2.8 8.5-7.2" fill="none" stroke="currentColor" stroke-width="2.2"/><path fill="currentColor" d="M1.6 14.8l2-3.6 2.3 3.4zM22.4 14.8l-2-3.6-2.3 3.4z"/>')};function xi(i,t){let e=i.length,n=i[0].length,s=document.createElement("canvas");s.width=n*3,s.height=e*3;let o=s.getContext("2d");for(let r=0;r<e;r++)for(let a=0;a<n;a++){let l=i[r][a];l==="."||!t[l]||(o.fillStyle=t[l],o.fillRect(a*3,r*3,3,3))}return s.toDataURL()}var _d=[".oooooooooo.","oLLMaaaaLLMo","oLHDbbbbLHDo","oMDDggggMDDo","oabg....gbco","oabg....gbco","oabg....gbco","oabg....gbco","oLLMggggLLMo","oLHDbbbbLHDo","oMDDccccMDDo",".oooooooooo."],Md={o:"#04090b",a:"#4f7174",b:"#2b474b",c:"#13242a",g:"#081215",L:"#f2d08a",M:"#b98b3e",D:"#6a4719",H:"#fff7dc"},Ed=[".oooooooooo.","oWWWWWWWWWWo","oWhmFFFFhmDo","oWmdFFFFmdDo","oWFFFFFFFFDo","oWFFFFFFFFDo","oWFFFFFFFFDo","oWFFFFFFFFDo","oWhmFFFFhmDo","oWmdFFFFmdDo","oSDDDDDDDDDo",".oooooooooo."],Cy={o:"#2a1806",W:"#ffe7a6",F:"#e2ad4c",D:"#8a5e1f",S:"#b88838",h:"#fff6d6",m:"#c6913a",d:"#5a3a12"},Py={o:"#04090b",W:"#5b6f68",F:"#22363a",D:"#0f1d21",S:"#2b3f40",h:"#c9a865",m:"#7a6236",d:"#2a1e0e"},wd=["...oooooooo.","..oTTTTTTTTo",".oTPPPPPPPSo","oTPPPPPPPPSo","oTPPPPPPPPSo","oTPPPPPPPPSo","oTPPPPPPPPSo","oTPPPPPPPPSo","oTPPPPPPPPSo",".oTPPPPPPPSo","..oSSSSSSSSo","...oooooooo."],Iy={o:"#3a2814",T:"#fff3d2",P:"#e8d3a0",S:"#bf9f62"},Dy={o:"#3a2006",T:"#fff1b0",P:"#f3cf6a",S:"#b9822a"},Ly=[".oooo.","oLLLMo","oLKKDo","oMKKDo","oMDDDo",".oooo."],Ny={o:"#3a2814",L:"#f2d08a",M:"#c99a48",D:"#7a5420",K:"#24170a"},Hy=["..oooooooo..",".oeeeeeeeeo.","oesssssssseo","oesPPPPPPseo","oesPPPPPPseo","oesPPPPPPseo","oesPPPPPPseo","oesPPPPPPseo","oesPPPPPPseo","oesssssssseo",".oeeeeeeeeo.","..oooooooo.."],Uy={o:"#3e2c18",e:"#b4935e",s:"#dcc89c",P:"#ecdfc1"};function ky(){let n=Array.from({length:11},()=>Array(40).fill("."));for(let[a,l]of[[2,2],[3,2],[4,2],[1,3],[1,4],[5,3],[5,4],[2,5],[3,5],[4,5],[3,4]])n[l][a]="G";for(let a=5;a<=30;a++)n[5][a]="G",a>12&&(n[4][a]="W"),a>18&&(n[6][a]="g");let s=33,o=4;for(let a=0;a<11;a++)for(let l=0;l<40;l++){if(Math.abs(l-s)+Math.abs(a-5)>o)continue;let h=l-s+a-5;n[a][l]=h<-1?"W":h>1?"g":"G"}n[5][38]="G";let r=n.map(a=>a.slice());for(let a=0;a<11;a++)for(let l=0;l<40;l++){if(n[a][l]!==".")continue;[[1,0],[-1,0],[0,1],[0,-1]].some(([h,d])=>n[a+d]&&n[a+d][l+h]&&n[a+d][l+h]!==".")&&(r[a][l]="o")}return r.map(a=>a.join(""))}var bd={o:"#3a1e04",W:"#fff1b8",G:"#ffd36a",g:"#c0821c"},Sd=!1;function Ch(){if(Sd||typeof document>"u")return;Sd=!0;let i=document.documentElement.style;i.setProperty("--px-iron",`url(${xi(_d,Md)})`),i.setProperty("--px-brass",`url(${xi(Ed,Cy)})`),i.setProperty("--px-brass-dim",`url(${xi(Ed,Py)})`),i.setProperty("--px-tag",`url(${xi(wd,Iy)})`),i.setProperty("--px-tag-gold",`url(${xi(wd,Dy)})`),i.setProperty("--px-eye",`url(${xi(Ly,Ny)})`),i.setProperty("--px-paper",`url(${xi(Hy,Uy)})`),i.setProperty("--px-iron-red",`url(${xi(_d,{...Md,a:"#a0574a",b:"#6a2c22",c:"#341511",g:"#160807"})})`);let t=ky();i.setProperty("--px-flourish-l",`url(${xi(t,bd)})`),i.setProperty("--px-flourish-r",`url(${xi(t.map(e=>[...e].reverse().join("")),bd)})`)}var Td=(i,t="")=>`<span class="key ${t}">${i}</span>`;var gw={sail:{n:"\u5F00\u8239",ic:mr.sail},arm:{n:"\u6253\u635E",ic:mr.arm},net:{n:"\u4F5C\u4E1A",ic:mr.net},reveal:{n:"\u4F5C\u4E1A",ic:mr.net}};var Aw=new x(0,60,-340);var Cw=new J(.6,.5,.34),Pw=new Zt(-.62,.78).normalize(),Iw=new x,Dw=new x,zy={};for(let[i,t]of Object.entries(W0)){let e={shoal:"\u6D45\u6EE9",anchor:"\u6D45\u6EE9",hold:"\u6C89\u8239\xB7\u65AD\u8231",jars:"\u6C89\u8239\xB7\u8239\u8FB9",pots:"\u6C89\u8239\xB7\u8239\u8FB9",dig:"\u6C89\u8239\xB7\u8239\u8FB9",slope:"\u5761\u4E0B",trench:"\u6DF1\u69FD"}[i];for(let n of t)zy[n]=e}var Kw=[{x:-.72,z:0,face:Math.PI},{x:-1.6,z:-1.02,face:-Math.PI/2},{x:-1.6,z:1.02,face:Math.PI/2}];var Jw=new x,jw=new Ze,Qw=new x(0,1,0);function Ph(i,t,e,n){let s=Vt(0,.25,t)*(1-Vt(2.4,3.8,t));i.material.opacity=s*.26,i.quaternion.copy(n.quaternion),i.rotateZ(e*.25);let o=.45+lr(ge(t/.7,0,1))*.5;i.scale.set(o,o,o)}function Ih(){let i=[];for(let s=0;s<12;s++){let o=s/12*Math.PI*2+s%2*.1,r=s%2?.03:.055,a=s%2?1:1.55;i.push(0,0,0,Math.cos(o-r)*a,Math.sin(o-r)*a,0,Math.cos(o+r)*a,Math.sin(o+r)*a,0)}let e=new oe;e.setAttribute("position",new qt(i,3));let n=new ut(e,new Ti({color:16767370,transparent:!0,opacity:0,blending:Ai,depthWrite:!1,depthTest:!0,side:me}));return n.renderOrder=25,n.visible=!1,n.frustumCulled=!1,n}var Bc={bubble:{size:.09,life:3.2,color:[.85,.97,1],alpha:.9,buoy:1.6,drag:1.5,wobble:.6,under:!0,shape:2,max:4},wbub:{size:.12,life:8,color:[.88,.98,1],alpha:.95,buoy:1.6,drag:1.5,wobble:.6,under:!0,keep:.6,shape:2,max:5},mud:{size:1.2,life:6.5,color:[.42,.36,.27],alpha:.62,buoy:.05,drag:1.2,grow:1.2,current:.6,under:!0,soft:!0},silt:{size:.5,life:4,color:[.6,.54,.42],alpha:.45,buoy:.02,drag:1.4,grow:.8,current:.5,under:!0,soft:!0},splash:{size:.18,life:.9,color:[.92,.97,1],alpha:1,gravity:9,drag:.4,shape:2,max:5},spray:{size:.075,life:.55,color:[.82,.92,1],alpha:.9,gravity:7,drag:.2,shape:2,max:3},drip:{size:.06,life:1,color:[.6,.55,.42],alpha:.95,gravity:9.8,drag:.1,shape:2,max:3},mudsplat:{size:.12,life:1.4,color:[.36,.3,.22],alpha:1,gravity:9.8,drag:.3,floorStop:!0,shape:4,max:6},smoke:{size:.5,life:3,color:[.32,.32,.34],alpha:.5,buoy:1.4,drag:.8,grow:1.4,wind:!0,soft:!0},puff:{size:.8,life:3.4,color:[.13,.13,.14],alpha:.82,buoy:1.1,drag:1.1,grow:1.9,wind:!0,soft:!0},snow:{size:.04,life:14,color:[.8,.88,.84],alpha:.4,buoy:-.03,drag:2,current:.8,under:!0,shape:5,max:2,fadeIn:1.6,floorFade:.35,near:[4,9]},spark:{size:.075,life:1.2,color:[1,.93,.62],alpha:1,gravity:-.4,drag:1.5,twinkle:!0,shape:3,max:7},foam:{size:.32,life:2.6,color:[.95,.98,.98],alpha:.85,drag:2.5,flat:!0,grow:.4,shape:0,max:6},sand:{size:.14,life:1.6,color:[.82,.74,.56],alpha:.9,gravity:1.6,drag:2,under:!0,shape:4,max:4},ring:{size:.22,life:.8,color:[1,.95,.75],alpha:1,drag:3,twinkle:!0,shape:3,max:9},cloud:{size:1.5,life:5.5,color:[.78,.72,.58],alpha:.78,buoy:0,drag:1.6,grow:1.1,current:.7,under:!0,soft:!0,keep:.72},chunk:{size:.26,life:2.2,color:[.33,.27,.19],alpha:1,gravity:9.8,drag:.25,floorStop:!0,shape:4,max:9},glint:{size:.1,life:.5,color:[.92,.97,1],alpha:1,drag:6,shape:0,max:4},flick:{size:.5,life:.45,color:[1,1,.97],alpha:1,drag:8,under:!0,keep:.85,hot:!0,shape:3,max:11},shine:{size:.2,life:1,color:[.9,.95,1],alpha:.3,buoy:.9,drag:1.2,grow:.6,soft:!0},coin:{size:.075,life:3.2,color:[.86,.88,.92],alpha:1,gravity:9.8,drag:.4,floorStop:!0,twinkle:!0,shape:0,max:4},tbub:{size:.05,life:.9,color:[.9,.98,1],alpha:.9,buoy:.4,drag:2,shape:2,max:3},mote:{size:.035,life:4.5,color:[1,.9,.7],alpha:.85,buoy:0,drag:.6,twinkle:!0,shape:0,max:2,fadeIn:1},dust:{size:.22,life:1.4,color:[.62,.56,.46],alpha:.45,buoy:.3,drag:2.2,grow:1.2,soft:!0}},Gc=class{constructor(t=5e3){this.max=t,this.n=0,this.p=new Float32Array(t*3),this.v=new Float32Array(t*3),this.life=new Float32Array(t),this.age=new Float32Array(t),this.size=new Float32Array(t),this.type=new Array(t),this.colr=new Float32Array(t*3),this.floorY=new Float32Array(t),this.seed=new Float32Array(t);let e=()=>{let s=new oe,o={geo:s,pos:new ve(new Float32Array(t*3),3).setUsage(ni),col:new ve(new Float32Array(t*4),4).setUsage(ni),size:new ve(new Float32Array(t),1).setUsage(ni),soft:new ve(new Float32Array(t*3),3).setUsage(ni)};return s.setAttribute("position",o.pos),s.setAttribute("aCol",o.col),s.setAttribute("aSize",o.size),s.setAttribute("aShape",o.soft),s.setDrawRange(0,0),o};this.bufUnder=e(),this.bufOver=e();let n=new Ue({uniforms:{...ke,uScale:{value:1}},vertexShader:`
        ${Ii}
        attribute vec4 aCol;
        attribute float aSize;
        attribute vec3 aShape;
        uniform float uScale;
        varying vec4 vCol;
        varying vec3 vShape;
        varying float vPx;
        void main(){
          vec4 wp = modelMatrix * vec4(position, 1.0);
          vec4 mv = viewMatrix * wp;
          gl_Position = projectionMatrix * mv;
          float px = min(aSize * uScale / -mv.z, aShape.y);
          gl_PointSize = max(1.0, floor(px + 0.5));
          // \u7EC6\u70B9\uFF1A\u753B\u6210\u6574\u683C\uFF081 \u683C\u30012 \u683C\uFF09\uFF0C\u4EAE\u5EA6\u6309\u5B83\u672C\u6765\u76D6\u4F4F\u7684\u9762\u79EF\u7ED9\uFF0C\u5927\u5C0F\u6362\u6863\u65F6\u603B\u7684\u4EAE\u4E0D\u8DF3
          float cover = 1.0;
          if (aShape.x > 4.5) {
            gl_PointSize = max(1.0, ceil(px - 0.001));
            cover = min(1.0, (px * px) / (gl_PointSize * gl_PointSize));
            // \u955C\u5934\u8F6C\u5F97\u3001\u63A8\u5F97\u5FEB\u65F6\u7EC6\u70B9\u6DE1\u4E0B\u53BB\uFF1A\u4E00\u5E27\u8DF3\u51E0\u683C\u7684\u5C0F\u767D\u70B9\u6700\u95EA
            cover *= 1.0 - 0.8 * uMotion;
          }
          vPx = gl_PointSize;
          float tr;
          vec3 c = waterTint(aCol.rgb, wp.xyz, tr);
          // keep\uFF1A\u6DF1\u5904\u4E5F\u7559\u4F4F\u51E0\u6210\u672C\u8272\u548C\u4E0D\u900F\u660E\uFF08\u7F51\u53E3\u6CE5\u4E91\u8FD9\u7C7B\u8981\u770B\u5F97\u89C1\u7684\uFF09
          float keep = aShape.z > 3.5 ? aShape.z - 4.0 : (aShape.z > 1.5 ? aShape.z - 2.0 : 0.0);
          // hot\uFF1A\u91D1\u5C5E\u4E0A\u7684\u4E00\u70B9\u9AD8\u5149\uFF0C\u9694\u7740\u6C34\u4E5F\u6BD4\u6D77\u5E95\u4EAE\uFF08\u4E0D\u5F80\u6697\u91CC\u538B\uFF09
          float hot = step(3.5, aShape.z);
          c = mix(c, aCol.rgb * mix(0.62, 1.1, hot), keep * (1.0 - tr) * mix(0.55, 1.0, hot));
          vCol = vec4(c, aCol.a * cover * (wp.y < 0.0 ? mix(mix(mix(0.25, 0.9, keep), 1.0, hot), 1.0, tr) : 1.0));
          vShape = aShape;
        }
      `,fragmentShader:`
        varying vec4 vCol;
        varying vec3 vShape;
        varying float vPx;
        void main(){
          vec2 q = gl_PointCoord - 0.5;
          float d = length(q);
          float kind = vShape.x;
          vec3 c = vCol.rgb;
          float a = vCol.a;
          if (kind > 0.5 && kind < 1.5) {
            // \u8F6F\u7C92\u5B50\uFF1A\u5706\u3001\u8FB9\u7F18\u6309\u68CB\u76D8\u683C\u6389\u50CF\u7D20\uFF08\u50CF\u7D20\u98CE\u7684\u534A\u900F\u660E\uFF09
            if (d > 0.5) discard;
            float edge = smoothstep(0.5, 0.15, d);
            vec2 f = floor(gl_FragCoord.xy);
            float chk = mod(f.x + f.y, 2.0);
            if (edge < 0.45 && chk > 0.5) discard;
            a *= 0.55 + edge * 0.45;
          } else if (vPx >= 3.0) {
            vec2 ip = floor(gl_PointCoord * vPx);
            float ctr = floor(vPx * 0.5);
            if (kind > 2.5 && kind < 3.5) {
              // \u5341\u5B57\u661F\uFF1A\u4E2D\u95F4\u4E00\u6A2A\u4E00\u7AD6\uFF0C\u5927\u7684\u518D\u52A0\u4E00\u5708\u4EAE\u5FC3
              bool arm = ip.x == ctr || ip.y == ctr;
              bool core = vPx >= 5.0 && abs(ip.x - ctr) <= 1.0 && abs(ip.y - ctr) <= 1.0 && abs(ip.x - ctr) + abs(ip.y - ctr) <= 1.0;
              if (!arm && !core) discard;
              float r = max(abs(ip.x - ctr), abs(ip.y - ctr)) / max(ctr, 1.0);
              c = mix(c, vec3(1.0), (1.0 - r) * 0.5);
              a *= 1.0 - r * 0.45;
            } else if (kind > 3.5 && kind < 4.5) {
              // \u6CE5\u70B9\uFF1A\u8FB9\u7F18\u6309\u89D2\u5EA6\u8D77\u4F0F\u7684\u56E2\uFF0C\u4E0B\u534A\u8FB9\u6697\u4E00\u70B9
              float ang = atan(q.y, q.x);
              float rr = 0.5 * (0.78 + 0.22 * sin(ang * 3.0 + vShape.z * 6.28) * cos(ang * 2.0 - vShape.z * 3.1));
              if (d > rr) discard;
              c *= 1.0 - step(0.05, q.y + q.x * 0.5) * 0.22;
            } else {
              if (d > 0.5) discard;
              if (kind > 1.5 && kind < 2.5) {
                // \u6C34\u6EF4\uFF1A\u5DE6\u4E0A\u4E00\u4E2A\u4EAE\u70B9\uFF0C\u53F3\u4E0B\u6CBF\u6697\u4E00\u5708
                vec2 hl = q + vec2(0.17, 0.17);
                c = mix(c, vec3(1.0), step(length(hl), 0.16) * 0.8);
                c *= 1.0 - step(0.36, d) * step(0.0, q.x + q.y) * 0.25;
              }
            }
          }
          gl_FragColor = vec4(c, a);
        }
      `,transparent:!0,depthWrite:!1});n.userData.coverItems=!0,this.points=new eo(this.bufUnder.geo,n),this.points.frustumCulled=!1,this.points.renderOrder=5,this.points.name="particles",this.above=new eo(this.bufOver.geo,n),this.above.frustumCulled=!1,this.above.renderOrder=20,this.above.name="particles-above",this.mat=n}setScale(t){this.mat.uniforms.uScale.value=t}emit(t,e,n,s,o=0,r=0,a=0,l={}){if(this.n>=this.max)return-1;let c=Bc[t],h=this.n++;this.p[h*3]=e,this.p[h*3+1]=n,this.p[h*3+2]=s,this.v[h*3]=o,this.v[h*3+1]=r,this.v[h*3+2]=a,this.life[h]=(l.life??c.life)*(.75+Math.random()*.5),this.age[h]=0,this.size[h]=(l.size??c.size)*(.7+Math.random()*.6),this.type[h]=c;let d=l.color??c.color;return this.colr[h*3]=d[0],this.colr[h*3+1]=d[1],this.colr[h*3+2]=d[2],this.floorY[h]=l.floorY??-1e9,this.seedN=(this.seedN||0)+1,this.seed[h]=this.seedN*.6180339%1,h}update(t){let e=ke.uCurrent.value,n=ke.uTime.value,s=0;for(let c=0;c<this.n;c++){let h=this.type[c];if(this.age[c]+=t,this.age[c]>=this.life[c])continue;let d=c*3,u=this.v[d],m=this.v[d+1],g=this.v[d+2],y=Math.exp(-(h.drag||0)*t);u*=y,m*=y,g*=y,h.gravity&&(m-=h.gravity*t),h.buoy&&(m+=h.buoy*t),h.current&&(u+=e.x*h.current*t,g+=e.y*h.current*t),h.wind&&(u+=.8*t,g+=.3*t);let p=this.p[d]+u*t,f=this.p[d+1]+m*t,v=this.p[d+2]+g*t;if(h.wobble&&(p+=Math.sin(n*7+c)*h.wobble*t,v+=Math.cos(n*6+c*1.3)*h.wobble*t),h.under&&f>-.05){if(h===Bc.bubble||h===Bc.wbub){this.age[c]=this.life[c];continue}f=-.05,m=0}if(h.floorStop&&f<this.floorY[c]&&(f=this.floorY[c],m=0,u*=.5,g*=.5),!h.under&&!h.flat&&!h.floorStop&&f<-.1&&h!==Bc.smoke){this.age[c]=this.life[c];continue}h.flat&&(f=.05);let S=s*3;this.p[S]=p,this.p[S+1]=f,this.p[S+2]=v,this.v[S]=u,this.v[S+1]=m,this.v[S+2]=g,this.life[s]=this.life[c],this.age[s]=this.age[c],this.size[s]=this.size[c],this.type[s]=h,this.colr[S]=this.colr[d],this.colr[S+1]=this.colr[d+1],this.colr[S+2]=this.colr[d+2],this.floorY[s]=this.floorY[c],this.seed[s]=this.seed[c],s++}this.n=s;let o=0,r=0,a=this.bufUnder,l=this.bufOver;for(let c=0;c<this.n;c++){let h=this.type[c],d=this.age[c]/this.life[c],u=this.p[c*3+1]<.02,m=u?a:l,g=u?o++:r++,y=m.pos.array,p=m.col.array;y[g*3]=this.p[c*3],y[g*3+1]=this.p[c*3+1],y[g*3+2]=this.p[c*3+2];let f=h.alpha*(1-d*d);if(h.soft&&(f*=Math.min(1,this.age[c]*3)),h.wind&&this.eye){let S=this.eye,_=this.p[c*3]-S.x,b=this.p[c*3+1]-S.y,E=this.p[c*3+2]-S.z;f*=Math.min(1,Math.max(0,(Math.sqrt(_*_+b*b+E*E)-4)/8))}if(h.twinkle&&(f*=.5+.5*Math.sin(this.age[c]*30+c)),h.fadeIn&&(f*=Math.min(1,this.age[c]/h.fadeIn)),h.floorFade&&(f*=Math.min(1,Math.max(0,(this.p[c*3+1]-this.floorY[c])/h.floorFade))),h.near&&this.eye){let S=this.eye,_=this.p[c*3]-S.x,b=this.p[c*3+1]-S.y,E=this.p[c*3+2]-S.z,A=Math.sqrt(_*_+b*b+E*E);f*=Math.min(1,Math.max(0,(A-h.near[0])/(h.near[1]-h.near[0])))}p[g*4]=this.colr[c*3],p[g*4+1]=this.colr[c*3+1],p[g*4+2]=this.colr[c*3+2],p[g*4+3]=f,m.size.array[g]=this.size[c]*(1+(h.grow||0)*d*2);let v=m.soft.array;v[g*3]=h.soft?1:h.shape??0,v[g*3+1]=h.soft?9999:h.max??9999,v[g*3+2]=h.keep?(h.hot?4:2)+h.keep:this.seed[c]}for(let[c,h]of[[a,o],[l,r]])c.pos.needsUpdate=c.col.needsUpdate=c.size.needsUpdate=c.soft.needsUpdate=!0,c.pos.updateRanges.length=0,c.geo.setDrawRange(0,h)}burst(t,e,n,s,o,r,a=1,l={}){for(let c=0;c<o;c++){let h=Math.random()*Math.PI*2,d=Math.random()*a,u=l.up??.6;this.emit(t,e+Math.cos(h)*d*.3,n,s+Math.sin(h)*d*.3,Math.cos(h)*r*(.4+Math.random()),r*u*(.5+Math.random()),Math.sin(h)*r*(.4+Math.random()),l)}}};function Rd(i){return 360/(2*Math.tan(_s.degToRad(i/2)))}var Oy=document.getElementById("view"),Id=document.getElementById("stage");function Dd(){let i=Math.min(window.innerWidth/1920,window.innerHeight/1080);Id.style.transform=`translate(${(window.innerWidth-1920*i)/2}px, ${(window.innerHeight-1080*i)/2}px) scale(${i})`}window.addEventListener("resize",Dd);Dd();var gr=new Mc(Oy),xr=new Dc,Cs=xr.scene;xr.lane.visible=!1;xr.mark.visible=!1;var yi=new Gc(3e3);Cs.add(yi.points,yi.above);var An=new nn(32,1920/1080,.3,900),Ld=document.getElementById("ui");Ch();var _o=new x(-118,0,-52),ls=new yt;ls.position.copy(_o);Cs.add(ls);{let i=new ut(new dn(16,.5,7.5),Nt({color:10123858}));i.position.y=.35,i.castShadow=!0,ls.add(i);for(let t=-7;t<=7;t+=1){let e=new ut(new dn(.05,.02,7.5),Nt({color:7230518}));e.position.set(t+.5,.61,0),ls.add(e)}}var Mo=.61,As=[{k:"items",t:"\u7269\u4EF6"},{k:"crew",t:"\u8239\u5458"},{k:"crab",t:"\u87F9"},{k:"reveal",t:"\u73CD\u8D35\u63ED\u6653"},{k:"boat",t:"\u6253\u635E\u8239"},{k:"deep",t:"\u5927\u8F6E\u5ED3"}],Nd=0,Je={},yr=[];Je.items=new yt;ls.add(Je.items);var Hd=[];{let i=Object.keys(Li).filter(e=>e!=="crab"),t=6;i.forEach((e,n)=>{let s=go(e,{seed:.3+n*.07,mud:1,inflate:.04}),o=n%t,r=Math.floor(n/t),a=-5+o*2,l=-2.6+r*1.9;s.group.position.set(a,Mo,l),Je.items.add(s.group),Hd.push({m:s,k:e,x:a,z:l,ph:n*.35}),yr.push({tab:"items",obj:s.group,text:Li[e].name,h:(s.info&&s.info.h||.3)+.2,tag:Li[e].precious?"p":""})})}Je.crew=new yt;ls.add(Je.crew);var Vy=[["stand","\u5F85\u673A"],["walk","\u8D70\u8DEF"],["carryWalk","\u642C\u8D27"],["hose","\u51B2\u6D17"],["coil","\u7406\u7F06"],["lookout","\u77AD\u671B"],["cheer","\u6B22\u547C"],["lever","\u64CD\u7EB5\u540A\u673A"],["crouch","\u5F2F\u8170\u62FF\u8D77"],["watch","\u770B\u70ED\u95F9"],["rail","\u8DB4\u8237\u8FB9"],["flinch","\u5413\u4E00\u8DF3"]],By=Vy.map(([i,t],e)=>{let n=new kc(e%4,[-6.2+e*1.13,.6]);if(n.pose=i,n.face=n.faceT=-Math.PI/2,Je.crew.add(n.root),yr.push({tab:"crew",obj:n.root,text:t,h:2.3}),i==="carryWalk"||i==="crouch"){let s=go(i==="carryWalk"?"jar":"sack",{mud:0});i==="carryWalk"&&(n.hold.add(s.group),s.group.position.set(0,-.05,0))}return n});Je.crab=new yt;ls.add(Je.crab);var Ud=[{c:new cs({scale:2.4,color:13130284}),n:"\u6A2A\u7740\u8D70",mode:"walk"},{c:new cs({scale:2.4,color:13130284}),n:"\u7FFB\u6CE5",mode:"dig"},{c:new cs({scale:2.4,color:11821102}),n:"\u7F51\u91CC\u6323\u52A8",mode:"struggle"},{c:new cs({scale:2.4,color:13130284}),n:"\u53D7\u60CA\u4E3E\u87AF",mode:"threat"}];Ud.forEach((i,t)=>{i.c.group.position.set(-3.9+t*2.6,Mo,0),Je.crab.add(i.c.group),yr.push({tab:"crab",obj:i.c.group,text:i.n,h:.9})});Je.reveal=new yt;ls.add(Je.reveal);var he=null;function Uh(){he&&Je.reveal.remove(he.b.group);let i=go("chest",{seed:.5,mud:1,inflate:.045}),t={kind:"chest",def:Li.chest,model:i,r:Li.chest.r,h:i.info.h,tilt:0,bury:0},e=go("sack",{seed:.2,mud:1,inflate:.045}),n={kind:"sack",def:Li.sack,model:e,r:Li.sack.r,h:e.info.h,tilt:.2,bury:0},s=new Vc([t,n]);s.group.position.set(0,Mo,0),Je.reveal.add(s.group),he={b:s,it:t,it2:n,t:0,w:0,T:5.4,sched:!1,rt:null}}function Ad(i,t,e){if(!e&&i.burst)return;let n=Mo+.02;if(!e){for(let s=0;s<4;s++)yi.emit("chunk",t.x+(Math.random()-.5)*.15,t.y,t.z+(Math.random()-.5)*.15,(Math.random()-.5)*1.2,.4+Math.random()*.8,(Math.random()-.5)*1.2,{floorY:n,size:.12+Math.random()*.12});return}for(let s=0;s<7;s++){let o=Math.random()*Math.PI*2,r=.5+Math.random()*1.2;yi.emit(s<4?"chunk":"mudsplat",t.x,n+.06,t.z,Math.cos(o)*r,.6+Math.random()*.9,Math.sin(o)*r,{floorY:n,size:s<4?.1+Math.random()*.1:.05+Math.random()*.05})}}Uh();var vo=Ih();vo.visible=!0;Cs.add(vo);Je.boat=new yt;Cs.add(Je.boat);var kd=cd();kd.root.position.set(_o.x+2,0,_o.z+14);Je.boat.add(kd.root);Je.deep=new yt;Cs.add(Je.deep);var Fd=new Oc;Je.deep.add(Fd.group);var Lh=new x(_o.x,1.6,_o.z+40),Nh=.4;function zd(i){Fd.pose((t,e)=>e.set(Lh.x+(6-t*26)*Nh*1,Lh.y+Math.sin(i*.6-t*4.8)*.12,Lh.z+Math.sin(i*.9-t*6.7)*(.25+t*1.5)*Nh),i,Nh)}zd(0);var kh=document.createElement("div");kh.style.cssText="position:absolute;left:50%;top:36px;transform:translateX(-50%);display:flex;gap:0;pointer-events:auto";As.forEach((i,t)=>{let e=document.createElement("div");e.className="panel",e.style.cssText="padding:8px 18px 10px 8px;font-size:22px;letter-spacing:1px;cursor:pointer;margin-right:-3px;white-space:nowrap",e.innerHTML=`${Td(t+1)}${i.t}`,e.addEventListener("pointerdown",()=>Wc(t)),i.el=e,kh.append(e)});Ld.append(kh);for(let i of yr)i.el=document.createElement("div"),i.tab==="items"?(i.el.className="card small on"+(i.tag?" "+i.tag:""),i.el.innerHTML=`<i class="eye"></i><span class="nm">${i.text}</span>`):(i.el.className="sh",i.el.style.cssText="position:absolute;left:0;top:0;font-size:22px;font-weight:700;color:#f3ead8;white-space:nowrap",i.el.textContent=i.text),Ld.append(i.el);function Wc(i){Nd=i,As.forEach((t,e)=>{t.el.style.background=e===i?"#e8b04a":"",t.el.style.color=e===i?"#10181b":""});for(let t in Je)Je[t].visible=t===As[i].k||t==="boat"&&As[i].k==="boat";As[i].k==="reveal"&&Uh()}Wc(0);window.addEventListener("keydown",i=>{let t=Number(i.key);t>=1&&t<=As.length&&Wc(t-1)});var Od=0,Fh=!1,Hh=0;Id.addEventListener("mousedown",i=>{Fh=!0,Hh=i.clientX});window.addEventListener("mouseup",()=>Fh=!1);window.addEventListener("mousemove",i=>{Fh&&(Od+=(i.clientX-Hh)*.005,Hh=i.clientX)});var Gy={items:{look:[0,.6,-.4],dist:11.5,h:8.5},crew:{look:[0,1.2,.6],dist:13,h:5},crab:{look:[0,.6,0],dist:10,h:5.5},reveal:{look:[0,.6,0],dist:3.4,h:5.4},boat:{look:[2,2,14],dist:22,h:11},deep:{look:[-1.5,1.4,40],dist:12,h:6.5}},Cd=performance.now(),bn=0,Pd=0;function Vd(i){let t=Math.min(.05,(i-Cd)/1e3);Cd=i,bn+=t,ke.uTime.value+=t;let e=As[Nd].k;if(e==="items")for(let l of Hd){let c=(bn*.16+l.ph*.08)%1,h=c<.15?1:c<.55?1-Vt(.15,.55,c):c<.85?0:Vt(.85,1,c);rs(l.m,h,.04*h),xo(l.m,h<.05?.6:0),l.m.group.rotation.y=bn*.35+l.ph}if(e==="crew")for(let l of By)(l.pose==="walk"||l.pose==="carryWalk")&&(l.inPlace=1.4),l.pose==="flinch"&&l.flinch<=0&&l.t>(l.nextFl||0)&&(l.startle(1,1),l.nextFl=l.t+2.2),l.update(t),l.root.position.y=Mo;if(e==="deep"&&zd(bn),e==="crab"){let[l,c,h,d]=Ud;l.c.legPh+=t*12,l.c.animLegs(1,t,!1),l.c.group.position.x=-3.9+Math.sin(bn*.6)*.6,l.c.group.rotation.y=0,c.c.dig=1;for(let u of c.c.model.claws)u.g.rotation.z=-(.35+Math.max(0,Math.sin(bn*6+(u.s>0?0:Math.PI)))*.6);if(c.c.model.body.rotation.z=-.18,Math.random()<t*4){let u=c.c.group.getWorldPosition(new x);yi.emit("sand",u.x+.4,u.y+.05,u.z,(Math.random()-.5)*.8,1.2,(Math.random()-.5)*.8)}h.c.animateStruggle(t,bn),h.c.group.rotation.z=Math.sin(bn*7)*.15,(d.c.threat||0)<=0&&bn>(d.nextT||0)&&(d.c.threat=1,d.nextT=bn+2.2),d.c.model.body.rotation.z=0,d.c.model.body.position.y=0;for(let u of d.c.model.claws)u.g.rotation.z=Math.sin(bn*1.3+u.s)*.08;d.c.animThreat(t,bn)}if(e==="reveal"&&he){he.t+=t;let l=he.t,c=he.b;if(!he.sched&&l>=.6){he.sched=!0,c.schedule(An.position.clone(),.04,.86);let u=c.beats?c.beats.length:6;u>1&&(he.T=Math.min(5.4,Math.max(3.4,.7*(u-1)/.82)))}if(he.sched&&he.rt==null){he.w=Math.min(1,he.w+t/he.T);let u=he.w;c.washPlates(u,t,Ad),c.setDebris(Vt(.04,.5,u));let m=.045*(1-Vt(0,.12,u));for(let y of[he.it,he.it2]){rs(y.model,1,m);let p=y.model.group.getWorldPosition(new x),f=An.position.clone().sub(p).normalize();f.y+=y.def.precious?1.4:.5,f.normalize().applyQuaternion(y.model.group.getWorldQuaternion(new Ze).invert());for(let v of y.model.mats)v.uniforms.uWashDir&&(v.uniforms.uWashDir.value.copy(f),v.uniforms.uWashBias.value=y.def.precious&&u<.4?.45*Vt(.1,.36,u):.3*Vt(.3,.8,u))}!he.peeked&&(c.peekAt!=null&&u>=c.peekAt+.02||c.peekAt==null&&u>.4)&&(he.peeked=!0,xo(he.it.model,.9));let g=c.lastPlate;if(g&&g.state!=="on"&&g.t>=.08||u>=1){he.rt=l,c.burst(),c.setDebris(1);for(let p of[he.it,he.it2])for(let f of p.model.mats)f.uniforms.uWashBias&&(f.uniforms.uWashBias.value=0);let y=c.group.getWorldPosition(new x);for(let p=0;p<26;p++){let f=Math.random()*Math.PI*2,v=1.4+Math.random()*2.2;yi.emit(p<16?"chunk":"mudsplat",y.x+Math.cos(f)*.3,y.y+.25+Math.random()*.3,y.z+Math.sin(f)*.3,Math.cos(f)*v,.5+Math.random()*1,Math.sin(f)*v,{floorY:Mo+.02,size:p<16?.08+Math.random()*.12:.05+Math.random()*.05})}}}else if(he.rt!=null){c.washPlates(1,t,Ad);let u=ge((l-he.rt)/.14,0,1);rs(he.it.model,1-lr(u),0),rs(he.it2.model,1-lr(u),0)}c.update(t,bn);let h=he.rt!=null?l-he.rt:-1,d=gr.compositeUniforms;if(h>0){if(he.it.model.lid&&(he.it.model.lid.rotation.x=-hr(ge((h-.15)/.75,0,1))*1.95),xo(he.it.model,1),!he.burst){he.burst=!0;let u=he.it.model.group.getWorldPosition(new x);yi.burst("spark",u.x,u.y+.4,u.z,46,3.2,.3,{up:1.4}),vo.position.copy(u).add(new x(0,.35,0))}Ph(vo,h,bn,An),d.uFlash.value=h<.35?.55*(1-h/.35):0,d.uDim.value=.32*Vt(.1,.5,h)*(1-Vt(2.4,3.6,h));for(let u of he.it.model.mats)u.uniforms.uEmissive.value.setRGB(.32,.24,.1).multiplyScalar(Math.max(0,1-h/2.8));if(Math.random()<.5){let u=he.it.model.group.getWorldPosition(new x);yi.emit("spark",u.x+(Math.random()-.5)*.5,u.y+.4,u.z+(Math.random()-.5)*.4,0,.6+Math.random()*.6,0)}}else vo.material.opacity=0,d.uFlash.value=0,d.uDim.value=0;h>5&&Uh()}else vo.material.opacity=0;let n=Gy[e],s=new x(...n.look).add(_o),o=Math.PI*.5+Od+Math.sin(bn*.15)*.18;An.position.set(s.x+Math.cos(o)*.35*n.dist,s.y+n.h,s.z+Math.sin(o)*n.dist),An.lookAt(s),An.updateMatrixWorld(!0),xr.sky.position.copy(An.position),j0(xr.water,An.position.x,An.position.z),yi.update(t),yi.setScale(Rd(An.fov)),gr.setCamera(An,An.position.distanceTo(s)),gr.updateShadow(s,An.position.distanceTo(s)),gr.renderShadow(Cs),gr.render(Cs);let r=[];for(let l of yr){let c=l.tab===e;if(l.el.style.display=c?"":"none",!c)continue;let h=l.obj.getWorldPosition(new x);h.y+=l.h,h.project(An),l.w||(l.w=l.el.offsetWidth,l.hh=l.el.offsetHeight),r.push({l,x:(h.x+1)/2*1920,y:(1-h.y)/2*1080,z:h.z})}r.sort((l,c)=>l.z-c.z);let a=[];for(let l of r){let{l:c}=l,h=l.x-c.w/2,d=l.y;for(let u=!0,m=0;u&&m<8;m++){u=!1;for(let g of a)h+c.w+6<=g.x0||h>=g.x0+g.w+6||d+4<=g.y1-g.h||d-c.hh>=g.y1+4||(d=g.y1-g.h-4,u=!0)}a.push({x0:h,y1:d,w:c.w,h:c.hh}),c.el.style.translate=`${Math.round(h)}px ${Math.round(d-c.hh)}px`}Pd++,Pd===3&&(window.__ready=!0),requestAnimationFrame(Vd)}requestAnimationFrame(Vd);window.__setTab=Wc;})();

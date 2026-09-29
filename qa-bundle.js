(()=>{async function gf(n,t){try{let e=new Uint8Array(await n.slice(0,8388608).arrayBuffer()),i=new DataView(e.buffer),s=(a,l)=>new TextDecoder().decode(e.subarray(a,a+l)),r=(a,l)=>{l?.trim()&&(t[a]=l.trim())},o=(a,l)=>{!a.length||a.length>2*1024*1024||!["image/jpeg","image/png","image/webp"].includes(l)||(t.cover&&URL.revokeObjectURL(t.cover),t.artworkBlob=new Blob([a],{type:l}),t.cover=URL.createObjectURL(t.artworkBlob))};if(s(0,4)==="fLaC"){let a=4;for(;a+4<=e.length;){let l=e[a]&127,c=e[a]&128,h=e[a+1]<<16|e[a+2]<<8|e[a+3];if(a+=4,a+h>e.length)break;if(l===4){let u=a,d=i.getUint32(u,!0);if(u+=4+d,u+4>a+h)break;let f=i.getUint32(u,!0);for(u+=4;f--&&u+4<=a+h;){let m=i.getUint32(u,!0);if(u+=4,u+m>a+h)break;let _=s(u,m),g=_.indexOf("="),p=_.slice(0,g).toUpperCase(),S=_.slice(g+1);p==="TITLE"&&r("title",S),p==="ARTIST"&&r("artist",S),p==="ALBUM"&&r("album",S),u+=m}}if(l===6){let u=a+4,d=i.getUint32(u);u+=4;let f=s(u,d);u+=d;let m=i.getUint32(u);u+=4+m+16;let _=i.getUint32(u);u+=4,u+_<=a+h&&o(e.slice(u,u+_),f)}if(a+=h,c)break}}if(s(4,4)==="ftyp"){let a=function(l,c,h=0,u=""){if(!(h>8))for(let d=l;d+8<=c;){let f=i.getUint32(d),m=String.fromCharCode(...e.slice(d+4,d+8));if(f<8||d+f>c)break;if(m==="data"&&["\xA9nam","\xA9ART","aART","\xA9alb","covr"].includes(u)&&f>=16){let _=e.slice(d+16,d+f);u==="covr"?o(_,i.getUint32(d+8)===14?"image/png":"image/jpeg"):r(u==="\xA9nam"?"title":u==="\xA9alb"?"album":"artist",new TextDecoder().decode(_))}else["moov","udta","meta","ilst","\xA9nam","\xA9ART","aART","\xA9alb","covr"].includes(m)&&a(d+8+(m==="meta"?4:0),d+f,h+1,m);d+=f}};a(0,e.length)}}catch{}}var Ki=["A01","A02","B01","B02","C01","C02"];function Si(n){return`${n.artist||"UNKNOWN ARTIST"}${n.album||"LOCAL TAPES"}`}function _f(n,t){return[n.name,n.size,n.lastModified||0,Math.round(t*100)].join("|")}function zc(n,t){let e=new Set(n.filter(r=>r.cabinetSlot).map(r=>`${r.cabinetSlot.drawer}:${r.cabinetSlot.index}`)),i=n.filter(r=>Si(r)===Si(t)&&r.cabinetSlot),s=[...new Set([...i.map(r=>r.cabinetSlot.drawer),...Ki])];for(let r of s)for(let o=0;o<96;o++)if(!e.has(`${r}:${o}`))return{drawer:r,index:o};throw new Error("ARCHIVE FULL")}function xf(n){return{...n,id:String(n.id||n.trackId||crypto.randomUUID()),title:n.title||"UNTITLED",artist:n.artist||"UNKNOWN ARTIST",album:n.album||"LOCAL TAPES",audioBlob:n.audioBlob||n.blob||null,sourceRequired:!(n.audioBlob||n.blob),createdAt:n.createdAt||Date.now()}}var Ma=class{constructor(t="CASSETTE_WORLD_QA_20260929"){this.db=null,this.failure=null,this.name=t}async open(){if(!globalThis.indexedDB)throw new Error("ARCHIVE OFFLINE");return this.db=await new Promise((t,e)=>{let i=indexedDB.open(this.name,2),s=!1;i.onupgradeneeded=()=>{let r=i.result;for(let o of["tracks","albums","covers","preferences","session"])r.objectStoreNames.contains(o)||r.createObjectStore(o,{keyPath:"id"})},i.onerror=()=>e(i.error),i.onblocked=()=>{s=!0,e(new Error("ARCHIVE IN ANOTHER TAB"))},i.onsuccess=()=>{if(s){i.result.close();return}t(i.result)}}),this.db.onversionchange=()=>{this.db.close(),this.db=null,this.failure="ARCHIVE OFFLINE"},this}async all(t){return this.read(t,e=>e.getAll())}async get(t,e){return this.read(t,i=>i.get(e))}read(t,e){return this.db?new Promise((i,s)=>{let r=this.db.transaction(t,"readonly"),o=e(r.objectStore(t));o.onsuccess=()=>i(o.result),o.onerror=()=>s(o.error)}):Promise.reject(new Error("ARCHIVE OFFLINE"))}write(t,e){return this.db?new Promise((i,s)=>{let r=this.db.transaction(t,"readwrite");r.oncomplete=i,r.onerror=()=>s(r.error),r.onabort=()=>s(r.error||new Error("SAVE ERROR"));try{e(r)}catch(o){r.abort(),s(o)}}):Promise.reject(new Error("ARCHIVE OFFLINE"))}putTrack(t){let{objectURL:e,cover:i,sourceRequired:s,...r}=t;return this.write(["tracks","albums","covers"],o=>{o.objectStore("tracks").put(r),o.objectStore("albums").put({id:Si(t),title:t.album,artist:t.artist}),t.artworkBlob&&o.objectStore("covers").put({id:t.id,blob:t.artworkBlob})})}save(t,e){return this.write(["preferences","session"],i=>{i.objectStore("preferences").put({id:"current",...t}),i.objectStore("session").put({id:"current",...e})})}remove(t,e){return this.write(["tracks","covers","albums","session"],i=>{i.objectStore("tracks").delete(t.id),i.objectStore("covers").delete(t.id),e.some(s=>Si(s)===Si(t))||i.objectStore("albums").delete(Si(t)),i.objectStore("session").delete("current")})}clear(){return this.write(["tracks","covers","albums","session"],t=>{for(let e of["tracks","covers","albums","session"])t.objectStore(e).clear()})}};/**
 * @license
 * Copyright 2010-2024 Three.js Authors
 * SPDX-License-Identifier: MIT
 */var Fu="170",si={LEFT:0,MIDDLE:1,RIGHT:2,ROTATE:0,DOLLY:1,PAN:2},Js={ROTATE:0,PAN:1,DOLLY_PAN:2,DOLLY_ROTATE:3},X0=0,vf=1,Y0=2;var Np=1,Bu=2,Pi=3,rs=0,an=1,Dn=2,Gn=0,Dr=1,yf=2,Mf=3,Ef=4,q0=5,Fs=100,Z0=101,K0=102,$0=103,J0=104,j0=200,Q0=201,tg=202,eg=203,yh=204,Mh=205,ng=206,ig=207,sg=208,rg=209,og=210,ag=211,lg=212,cg=213,hg=214,Eh=0,bh=1,Sh=2,Or=3,Th=4,wh=5,Ah=6,Rh=7,Op=0,ug=1,dg=2,is=0,zu=1,ku=2,Hu=3,Xo=4,fg=5,Vu=6,Gu=7;var Fp=300,Fr=301,Br=302,Ch=303,Ph=304,zl=306,Ao=1e3,ks=1001,Ih=1002,ln=1003,pg=1004;var Ea=1005;var di=1006,kc=1007;var Hs=1008;var Li=1009,Bp=1010,zp=1011,Ro=1012,Wu=1013,Vs=1014,fi=1015,Fi=1016,Xu=1017,Yu=1018,zr=1020,kp=35902,Hp=1021,Vp=1022,Qn=1023,Gp=1024,Wp=1025,Lr=1026,kr=1027,qu=1028,Zu=1029,Xp=1030,Ku=1031;var $u=1033,$a=33776,Ja=33777,ja=33778,Qa=33779,Dh=35840,Lh=35841,Uh=35842,Nh=35843,Oh=36196,Fh=37492,Bh=37496,zh=37808,kh=37809,Hh=37810,Vh=37811,Gh=37812,Wh=37813,Xh=37814,Yh=37815,qh=37816,Zh=37817,Kh=37818,$h=37819,Jh=37820,jh=37821,tl=36492,Qh=36494,tu=36495,Yp=36283,eu=36284,nu=36285,iu=36286;var el=2300,su=2301,Hc=2302,bf=2400,Sf=2401,Tf=2402;var mg=3200,Ju=3201;var qp=0,gg=1,ns="",Ve="srgb",Yr="srgb-linear",kl="linear",xe="srgb";var pr=7680;var wf=519,_g=512,xg=513,vg=514,Zp=515,yg=516,Mg=517,Eg=518,bg=519,Af=35044;var Rf="300 es",Ii=2e3,nl=2001,Ui=class{addEventListener(t,e){this._listeners===void 0&&(this._listeners={});let i=this._listeners;i[t]===void 0&&(i[t]=[]),i[t].indexOf(e)===-1&&i[t].push(e)}hasEventListener(t,e){if(this._listeners===void 0)return!1;let i=this._listeners;return i[t]!==void 0&&i[t].indexOf(e)!==-1}removeEventListener(t,e){if(this._listeners===void 0)return;let s=this._listeners[t];if(s!==void 0){let r=s.indexOf(e);r!==-1&&s.splice(r,1)}}dispatchEvent(t){if(this._listeners===void 0)return;let i=this._listeners[t.type];if(i!==void 0){t.target=this;let s=i.slice(0);for(let r=0,o=s.length;r<o;r++)s[r].call(this,t);t.target=null}}},rn=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"],Cf=1234567,Eo=Math.PI/180,Co=180/Math.PI;function js(){let n=Math.random()*4294967295|0,t=Math.random()*4294967295|0,e=Math.random()*4294967295|0,i=Math.random()*4294967295|0;return(rn[n&255]+rn[n>>8&255]+rn[n>>16&255]+rn[n>>24&255]+"-"+rn[t&255]+rn[t>>8&255]+"-"+rn[t>>16&15|64]+rn[t>>24&255]+"-"+rn[e&63|128]+rn[e>>8&255]+"-"+rn[e>>16&255]+rn[e>>24&255]+rn[i&255]+rn[i>>8&255]+rn[i>>16&255]+rn[i>>24&255]).toLowerCase()}function Ke(n,t,e){return Math.max(t,Math.min(e,n))}function ju(n,t){return(n%t+t)%t}function Sg(n,t,e,i,s){return i+(n-t)*(s-i)/(e-t)}function Tg(n,t,e){return n!==t?(e-n)/(t-n):0}function bo(n,t,e){return(1-e)*n+e*t}function wg(n,t,e,i){return bo(n,t,1-Math.exp(-e*i))}function Ag(n,t=1){return t-Math.abs(ju(n,t*2)-t)}function Rg(n,t,e){return n<=t?0:n>=e?1:(n=(n-t)/(e-t),n*n*(3-2*n))}function Cg(n,t,e){return n<=t?0:n>=e?1:(n=(n-t)/(e-t),n*n*n*(n*(n*6-15)+10))}function Pg(n,t){return n+Math.floor(Math.random()*(t-n+1))}function Ig(n,t){return n+Math.random()*(t-n)}function Dg(n){return n*(.5-Math.random())}function Lg(n){n!==void 0&&(Cf=n);let t=Cf+=1831565813;return t=Math.imul(t^t>>>15,t|1),t^=t+Math.imul(t^t>>>7,t|61),((t^t>>>14)>>>0)/4294967296}function Ug(n){return n*Eo}function Ng(n){return n*Co}function Og(n){return(n&n-1)===0&&n!==0}function Fg(n){return Math.pow(2,Math.ceil(Math.log(n)/Math.LN2))}function Bg(n){return Math.pow(2,Math.floor(Math.log(n)/Math.LN2))}function zg(n,t,e,i,s){let r=Math.cos,o=Math.sin,a=r(e/2),l=o(e/2),c=r((t+i)/2),h=o((t+i)/2),u=r((t-i)/2),d=o((t-i)/2),f=r((i-t)/2),m=o((i-t)/2);switch(s){case"XYX":n.set(a*h,l*u,l*d,a*c);break;case"YZY":n.set(l*d,a*h,l*u,a*c);break;case"ZXZ":n.set(l*u,l*d,a*h,a*c);break;case"XZX":n.set(a*h,l*m,l*f,a*c);break;case"YXY":n.set(l*f,a*h,l*m,a*c);break;case"ZYZ":n.set(l*m,l*f,a*h,a*c);break;default:console.warn("THREE.MathUtils: .setQuaternionFromProperEuler() encountered an unknown order: "+s)}}function Cr(n,t){switch(t.constructor){case Float32Array:return n;case Uint32Array:return n/4294967295;case Uint16Array:return n/65535;case Uint8Array:return n/255;case Int32Array:return Math.max(n/2147483647,-1);case Int16Array:return Math.max(n/32767,-1);case Int8Array:return Math.max(n/127,-1);default:throw new Error("Invalid component type.")}}function mn(n,t){switch(t.constructor){case Float32Array:return n;case Uint32Array:return Math.round(n*4294967295);case Uint16Array:return Math.round(n*65535);case Uint8Array:return Math.round(n*255);case Int32Array:return Math.round(n*2147483647);case Int16Array:return Math.round(n*32767);case Int8Array:return Math.round(n*127);default:throw new Error("Invalid component type.")}}var vt={DEG2RAD:Eo,RAD2DEG:Co,generateUUID:js,clamp:Ke,euclideanModulo:ju,mapLinear:Sg,inverseLerp:Tg,lerp:bo,damp:wg,pingpong:Ag,smoothstep:Rg,smootherstep:Cg,randInt:Pg,randFloat:Ig,randFloatSpread:Dg,seededRandom:Lg,degToRad:Ug,radToDeg:Ng,isPowerOfTwo:Og,ceilPowerOfTwo:Fg,floorPowerOfTwo:Bg,setQuaternionFromProperEuler:zg,normalize:mn,denormalize:Cr},nt=class n{constructor(t=0,e=0){n.prototype.isVector2=!0,this.x=t,this.y=e}get width(){return this.x}set width(t){this.x=t}get height(){return this.y}set height(t){this.y=t}set(t,e){return this.x=t,this.y=e,this}setScalar(t){return this.x=t,this.y=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;default:throw new Error("index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;default:throw new Error("index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y)}copy(t){return this.x=t.x,this.y=t.y,this}add(t){return this.x+=t.x,this.y+=t.y,this}addScalar(t){return this.x+=t,this.y+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this}subScalar(t){return this.x-=t,this.y-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this}multiply(t){return this.x*=t.x,this.y*=t.y,this}multiplyScalar(t){return this.x*=t,this.y*=t,this}divide(t){return this.x/=t.x,this.y/=t.y,this}divideScalar(t){return this.multiplyScalar(1/t)}applyMatrix3(t){let e=this.x,i=this.y,s=t.elements;return this.x=s[0]*e+s[3]*i+s[6],this.y=s[1]*e+s[4]*i+s[7],this}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this}clamp(t,e){return this.x=Math.max(t.x,Math.min(e.x,this.x)),this.y=Math.max(t.y,Math.min(e.y,this.y)),this}clampScalar(t,e){return this.x=Math.max(t,Math.min(e,this.x)),this.y=Math.max(t,Math.min(e,this.y)),this}clampLength(t,e){let i=this.length();return this.divideScalar(i||1).multiplyScalar(Math.max(t,Math.min(e,i)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(t){return this.x*t.x+this.y*t.y}cross(t){return this.x*t.y-this.y*t.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(t){let e=Math.sqrt(this.lengthSq()*t.lengthSq());if(e===0)return Math.PI/2;let i=this.dot(t)/e;return Math.acos(Ke(i,-1,1))}distanceTo(t){return Math.sqrt(this.distanceToSquared(t))}distanceToSquared(t){let e=this.x-t.x,i=this.y-t.y;return e*e+i*i}manhattanDistanceTo(t){return Math.abs(this.x-t.x)+Math.abs(this.y-t.y)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this}lerpVectors(t,e,i){return this.x=t.x+(e.x-t.x)*i,this.y=t.y+(e.y-t.y)*i,this}equals(t){return t.x===this.x&&t.y===this.y}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this}rotateAround(t,e){let i=Math.cos(e),s=Math.sin(e),r=this.x-t.x,o=this.y-t.y;return this.x=r*i-o*s+t.x,this.y=r*s+o*i+t.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}},jt=class n{constructor(t,e,i,s,r,o,a,l,c){n.prototype.isMatrix3=!0,this.elements=[1,0,0,0,1,0,0,0,1],t!==void 0&&this.set(t,e,i,s,r,o,a,l,c)}set(t,e,i,s,r,o,a,l,c){let h=this.elements;return h[0]=t,h[1]=s,h[2]=a,h[3]=e,h[4]=r,h[5]=l,h[6]=i,h[7]=o,h[8]=c,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(t){let e=this.elements,i=t.elements;return e[0]=i[0],e[1]=i[1],e[2]=i[2],e[3]=i[3],e[4]=i[4],e[5]=i[5],e[6]=i[6],e[7]=i[7],e[8]=i[8],this}extractBasis(t,e,i){return t.setFromMatrix3Column(this,0),e.setFromMatrix3Column(this,1),i.setFromMatrix3Column(this,2),this}setFromMatrix4(t){let e=t.elements;return this.set(e[0],e[4],e[8],e[1],e[5],e[9],e[2],e[6],e[10]),this}multiply(t){return this.multiplyMatrices(this,t)}premultiply(t){return this.multiplyMatrices(t,this)}multiplyMatrices(t,e){let i=t.elements,s=e.elements,r=this.elements,o=i[0],a=i[3],l=i[6],c=i[1],h=i[4],u=i[7],d=i[2],f=i[5],m=i[8],_=s[0],g=s[3],p=s[6],S=s[1],M=s[4],x=s[7],L=s[2],R=s[5],C=s[8];return r[0]=o*_+a*S+l*L,r[3]=o*g+a*M+l*R,r[6]=o*p+a*x+l*C,r[1]=c*_+h*S+u*L,r[4]=c*g+h*M+u*R,r[7]=c*p+h*x+u*C,r[2]=d*_+f*S+m*L,r[5]=d*g+f*M+m*R,r[8]=d*p+f*x+m*C,this}multiplyScalar(t){let e=this.elements;return e[0]*=t,e[3]*=t,e[6]*=t,e[1]*=t,e[4]*=t,e[7]*=t,e[2]*=t,e[5]*=t,e[8]*=t,this}determinant(){let t=this.elements,e=t[0],i=t[1],s=t[2],r=t[3],o=t[4],a=t[5],l=t[6],c=t[7],h=t[8];return e*o*h-e*a*c-i*r*h+i*a*l+s*r*c-s*o*l}invert(){let t=this.elements,e=t[0],i=t[1],s=t[2],r=t[3],o=t[4],a=t[5],l=t[6],c=t[7],h=t[8],u=h*o-a*c,d=a*l-h*r,f=c*r-o*l,m=e*u+i*d+s*f;if(m===0)return this.set(0,0,0,0,0,0,0,0,0);let _=1/m;return t[0]=u*_,t[1]=(s*c-h*i)*_,t[2]=(a*i-s*o)*_,t[3]=d*_,t[4]=(h*e-s*l)*_,t[5]=(s*r-a*e)*_,t[6]=f*_,t[7]=(i*l-c*e)*_,t[8]=(o*e-i*r)*_,this}transpose(){let t,e=this.elements;return t=e[1],e[1]=e[3],e[3]=t,t=e[2],e[2]=e[6],e[6]=t,t=e[5],e[5]=e[7],e[7]=t,this}getNormalMatrix(t){return this.setFromMatrix4(t).invert().transpose()}transposeIntoArray(t){let e=this.elements;return t[0]=e[0],t[1]=e[3],t[2]=e[6],t[3]=e[1],t[4]=e[4],t[5]=e[7],t[6]=e[2],t[7]=e[5],t[8]=e[8],this}setUvTransform(t,e,i,s,r,o,a){let l=Math.cos(r),c=Math.sin(r);return this.set(i*l,i*c,-i*(l*o+c*a)+o+t,-s*c,s*l,-s*(-c*o+l*a)+a+e,0,0,1),this}scale(t,e){return this.premultiply(Vc.makeScale(t,e)),this}rotate(t){return this.premultiply(Vc.makeRotation(-t)),this}translate(t,e){return this.premultiply(Vc.makeTranslation(t,e)),this}makeTranslation(t,e){return t.isVector2?this.set(1,0,t.x,0,1,t.y,0,0,1):this.set(1,0,t,0,1,e,0,0,1),this}makeRotation(t){let e=Math.cos(t),i=Math.sin(t);return this.set(e,-i,0,i,e,0,0,0,1),this}makeScale(t,e){return this.set(t,0,0,0,e,0,0,0,1),this}equals(t){let e=this.elements,i=t.elements;for(let s=0;s<9;s++)if(e[s]!==i[s])return!1;return!0}fromArray(t,e=0){for(let i=0;i<9;i++)this.elements[i]=t[i+e];return this}toArray(t=[],e=0){let i=this.elements;return t[e]=i[0],t[e+1]=i[1],t[e+2]=i[2],t[e+3]=i[3],t[e+4]=i[4],t[e+5]=i[5],t[e+6]=i[6],t[e+7]=i[7],t[e+8]=i[8],t}clone(){return new this.constructor().fromArray(this.elements)}},Vc=new jt;function Kp(n){for(let t=n.length-1;t>=0;--t)if(n[t]>=65535)return!0;return!1}function Po(n){return document.createElementNS("http://www.w3.org/1999/xhtml",n)}function kg(){let n=Po("canvas");return n.style.display="block",n}var Pf={};function yo(n){n in Pf||(Pf[n]=!0,console.warn(n))}function Hg(n,t,e){return new Promise(function(i,s){function r(){switch(n.clientWaitSync(t,n.SYNC_FLUSH_COMMANDS_BIT,0)){case n.WAIT_FAILED:s();break;case n.TIMEOUT_EXPIRED:setTimeout(r,e);break;default:i()}}setTimeout(r,e)})}function Vg(n){let t=n.elements;t[2]=.5*t[2]+.5*t[3],t[6]=.5*t[6]+.5*t[7],t[10]=.5*t[10]+.5*t[11],t[14]=.5*t[14]+.5*t[15]}function Gg(n){let t=n.elements;t[11]===-1?(t[10]=-t[10]-1,t[14]=-t[14]):(t[10]=-t[10],t[14]=-t[14]+1)}var oe={enabled:!0,workingColorSpace:Yr,spaces:{},convert:function(n,t,e){return this.enabled===!1||t===e||!t||!e||(this.spaces[t].transfer===xe&&(n.r=Di(n.r),n.g=Di(n.g),n.b=Di(n.b)),this.spaces[t].primaries!==this.spaces[e].primaries&&(n.applyMatrix3(this.spaces[t].toXYZ),n.applyMatrix3(this.spaces[e].fromXYZ)),this.spaces[e].transfer===xe&&(n.r=Ur(n.r),n.g=Ur(n.g),n.b=Ur(n.b))),n},fromWorkingColorSpace:function(n,t){return this.convert(n,this.workingColorSpace,t)},toWorkingColorSpace:function(n,t){return this.convert(n,t,this.workingColorSpace)},getPrimaries:function(n){return this.spaces[n].primaries},getTransfer:function(n){return n===ns?kl:this.spaces[n].transfer},getLuminanceCoefficients:function(n,t=this.workingColorSpace){return n.fromArray(this.spaces[t].luminanceCoefficients)},define:function(n){Object.assign(this.spaces,n)},_getMatrix:function(n,t,e){return n.copy(this.spaces[t].toXYZ).multiply(this.spaces[e].fromXYZ)},_getDrawingBufferColorSpace:function(n){return this.spaces[n].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(n=this.workingColorSpace){return this.spaces[n].workingColorSpaceConfig.unpackColorSpace}};function Di(n){return n<.04045?n*.0773993808:Math.pow(n*.9478672986+.0521327014,2.4)}function Ur(n){return n<.0031308?n*12.92:1.055*Math.pow(n,.41666)-.055}var If=[.64,.33,.3,.6,.15,.06],Df=[.2126,.7152,.0722],Lf=[.3127,.329],Uf=new jt().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),Nf=new jt().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);oe.define({[Yr]:{primaries:If,whitePoint:Lf,transfer:kl,toXYZ:Uf,fromXYZ:Nf,luminanceCoefficients:Df,workingColorSpaceConfig:{unpackColorSpace:Ve},outputColorSpaceConfig:{drawingBufferColorSpace:Ve}},[Ve]:{primaries:If,whitePoint:Lf,transfer:xe,toXYZ:Uf,fromXYZ:Nf,luminanceCoefficients:Df,outputColorSpaceConfig:{drawingBufferColorSpace:Ve}}});var mr,ru=class{static getDataURL(t){if(/^data:/i.test(t.src)||typeof HTMLCanvasElement>"u")return t.src;let e;if(t instanceof HTMLCanvasElement)e=t;else{mr===void 0&&(mr=Po("canvas")),mr.width=t.width,mr.height=t.height;let i=mr.getContext("2d");t instanceof ImageData?i.putImageData(t,0,0):i.drawImage(t,0,0,t.width,t.height),e=mr}return e.width>2048||e.height>2048?(console.warn("THREE.ImageUtils.getDataURL: Image converted to jpg for performance reasons",t),e.toDataURL("image/jpeg",.6)):e.toDataURL("image/png")}static sRGBToLinear(t){if(typeof HTMLImageElement<"u"&&t instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&t instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&t instanceof ImageBitmap){let e=Po("canvas");e.width=t.width,e.height=t.height;let i=e.getContext("2d");i.drawImage(t,0,0,t.width,t.height);let s=i.getImageData(0,0,t.width,t.height),r=s.data;for(let o=0;o<r.length;o++)r[o]=Di(r[o]/255)*255;return i.putImageData(s,0,0),e}else if(t.data){let e=t.data.slice(0);for(let i=0;i<e.length;i++)e instanceof Uint8Array||e instanceof Uint8ClampedArray?e[i]=Math.floor(Di(e[i]/255)*255):e[i]=Di(e[i]);return{data:e,width:t.width,height:t.height}}else return console.warn("THREE.ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),t}},Wg=0,il=class{constructor(t=null){this.isSource=!0,Object.defineProperty(this,"id",{value:Wg++}),this.uuid=js(),this.data=t,this.dataReady=!0,this.version=0}set needsUpdate(t){t===!0&&this.version++}toJSON(t){let e=t===void 0||typeof t=="string";if(!e&&t.images[this.uuid]!==void 0)return t.images[this.uuid];let i={uuid:this.uuid,url:""},s=this.data;if(s!==null){let r;if(Array.isArray(s)){r=[];for(let o=0,a=s.length;o<a;o++)s[o].isDataTexture?r.push(Gc(s[o].image)):r.push(Gc(s[o]))}else r=Gc(s);i.url=r}return e||(t.images[this.uuid]=i),i}};function Gc(n){return typeof HTMLImageElement<"u"&&n instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&n instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&n instanceof ImageBitmap?ru.getDataURL(n):n.data?{data:Array.from(n.data),width:n.width,height:n.height,type:n.data.constructor.name}:(console.warn("THREE.Texture: Unable to serialize Texture."),{})}var Xg=0,_n=class n extends Ui{constructor(t=n.DEFAULT_IMAGE,e=n.DEFAULT_MAPPING,i=ks,s=ks,r=di,o=Hs,a=Qn,l=Li,c=n.DEFAULT_ANISOTROPY,h=ns){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:Xg++}),this.uuid=js(),this.name="",this.source=new il(t),this.mipmaps=[],this.mapping=e,this.channel=0,this.wrapS=i,this.wrapT=s,this.magFilter=r,this.minFilter=o,this.anisotropy=c,this.format=a,this.internalFormat=null,this.type=l,this.offset=new nt(0,0),this.repeat=new nt(1,1),this.center=new nt(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new jt,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=h,this.userData={},this.version=0,this.onUpdate=null,this.isRenderTargetTexture=!1,this.pmremVersion=0}get image(){return this.source.data}set image(t=null){this.source.data=t}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}clone(){return new this.constructor().copy(this)}copy(t){return this.name=t.name,this.source=t.source,this.mipmaps=t.mipmaps.slice(0),this.mapping=t.mapping,this.channel=t.channel,this.wrapS=t.wrapS,this.wrapT=t.wrapT,this.magFilter=t.magFilter,this.minFilter=t.minFilter,this.anisotropy=t.anisotropy,this.format=t.format,this.internalFormat=t.internalFormat,this.type=t.type,this.offset.copy(t.offset),this.repeat.copy(t.repeat),this.center.copy(t.center),this.rotation=t.rotation,this.matrixAutoUpdate=t.matrixAutoUpdate,this.matrix.copy(t.matrix),this.generateMipmaps=t.generateMipmaps,this.premultiplyAlpha=t.premultiplyAlpha,this.flipY=t.flipY,this.unpackAlignment=t.unpackAlignment,this.colorSpace=t.colorSpace,this.userData=JSON.parse(JSON.stringify(t.userData)),this.needsUpdate=!0,this}toJSON(t){let e=t===void 0||typeof t=="string";if(!e&&t.textures[this.uuid]!==void 0)return t.textures[this.uuid];let i={metadata:{version:4.6,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(t).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(i.userData=this.userData),e||(t.textures[this.uuid]=i),i}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(t){if(this.mapping!==Fp)return t;if(t.applyMatrix3(this.matrix),t.x<0||t.x>1)switch(this.wrapS){case Ao:t.x=t.x-Math.floor(t.x);break;case ks:t.x=t.x<0?0:1;break;case Ih:Math.abs(Math.floor(t.x)%2)===1?t.x=Math.ceil(t.x)-t.x:t.x=t.x-Math.floor(t.x);break}if(t.y<0||t.y>1)switch(this.wrapT){case Ao:t.y=t.y-Math.floor(t.y);break;case ks:t.y=t.y<0?0:1;break;case Ih:Math.abs(Math.floor(t.y)%2)===1?t.y=Math.ceil(t.y)-t.y:t.y=t.y-Math.floor(t.y);break}return this.flipY&&(t.y=1-t.y),t}set needsUpdate(t){t===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(t){t===!0&&this.pmremVersion++}};_n.DEFAULT_IMAGE=null;_n.DEFAULT_MAPPING=Fp;_n.DEFAULT_ANISOTROPY=1;var Ee=class n{constructor(t=0,e=0,i=0,s=1){n.prototype.isVector4=!0,this.x=t,this.y=e,this.z=i,this.w=s}get width(){return this.z}set width(t){this.z=t}get height(){return this.w}set height(t){this.w=t}set(t,e,i,s){return this.x=t,this.y=e,this.z=i,this.w=s,this}setScalar(t){return this.x=t,this.y=t,this.z=t,this.w=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setZ(t){return this.z=t,this}setW(t){return this.w=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;case 2:this.z=e;break;case 3:this.w=e;break;default:throw new Error("index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this.w=t.w!==void 0?t.w:1,this}add(t){return this.x+=t.x,this.y+=t.y,this.z+=t.z,this.w+=t.w,this}addScalar(t){return this.x+=t,this.y+=t,this.z+=t,this.w+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this.z=t.z+e.z,this.w=t.w+e.w,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this.z+=t.z*e,this.w+=t.w*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this.z-=t.z,this.w-=t.w,this}subScalar(t){return this.x-=t,this.y-=t,this.z-=t,this.w-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this.z=t.z-e.z,this.w=t.w-e.w,this}multiply(t){return this.x*=t.x,this.y*=t.y,this.z*=t.z,this.w*=t.w,this}multiplyScalar(t){return this.x*=t,this.y*=t,this.z*=t,this.w*=t,this}applyMatrix4(t){let e=this.x,i=this.y,s=this.z,r=this.w,o=t.elements;return this.x=o[0]*e+o[4]*i+o[8]*s+o[12]*r,this.y=o[1]*e+o[5]*i+o[9]*s+o[13]*r,this.z=o[2]*e+o[6]*i+o[10]*s+o[14]*r,this.w=o[3]*e+o[7]*i+o[11]*s+o[15]*r,this}divide(t){return this.x/=t.x,this.y/=t.y,this.z/=t.z,this.w/=t.w,this}divideScalar(t){return this.multiplyScalar(1/t)}setAxisAngleFromQuaternion(t){this.w=2*Math.acos(t.w);let e=Math.sqrt(1-t.w*t.w);return e<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=t.x/e,this.y=t.y/e,this.z=t.z/e),this}setAxisAngleFromRotationMatrix(t){let e,i,s,r,l=t.elements,c=l[0],h=l[4],u=l[8],d=l[1],f=l[5],m=l[9],_=l[2],g=l[6],p=l[10];if(Math.abs(h-d)<.01&&Math.abs(u-_)<.01&&Math.abs(m-g)<.01){if(Math.abs(h+d)<.1&&Math.abs(u+_)<.1&&Math.abs(m+g)<.1&&Math.abs(c+f+p-3)<.1)return this.set(1,0,0,0),this;e=Math.PI;let M=(c+1)/2,x=(f+1)/2,L=(p+1)/2,R=(h+d)/4,C=(u+_)/4,D=(m+g)/4;return M>x&&M>L?M<.01?(i=0,s=.707106781,r=.707106781):(i=Math.sqrt(M),s=R/i,r=C/i):x>L?x<.01?(i=.707106781,s=0,r=.707106781):(s=Math.sqrt(x),i=R/s,r=D/s):L<.01?(i=.707106781,s=.707106781,r=0):(r=Math.sqrt(L),i=C/r,s=D/r),this.set(i,s,r,e),this}let S=Math.sqrt((g-m)*(g-m)+(u-_)*(u-_)+(d-h)*(d-h));return Math.abs(S)<.001&&(S=1),this.x=(g-m)/S,this.y=(u-_)/S,this.z=(d-h)/S,this.w=Math.acos((c+f+p-1)/2),this}setFromMatrixPosition(t){let e=t.elements;return this.x=e[12],this.y=e[13],this.z=e[14],this.w=e[15],this}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this.z=Math.min(this.z,t.z),this.w=Math.min(this.w,t.w),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this.z=Math.max(this.z,t.z),this.w=Math.max(this.w,t.w),this}clamp(t,e){return this.x=Math.max(t.x,Math.min(e.x,this.x)),this.y=Math.max(t.y,Math.min(e.y,this.y)),this.z=Math.max(t.z,Math.min(e.z,this.z)),this.w=Math.max(t.w,Math.min(e.w,this.w)),this}clampScalar(t,e){return this.x=Math.max(t,Math.min(e,this.x)),this.y=Math.max(t,Math.min(e,this.y)),this.z=Math.max(t,Math.min(e,this.z)),this.w=Math.max(t,Math.min(e,this.w)),this}clampLength(t,e){let i=this.length();return this.divideScalar(i||1).multiplyScalar(Math.max(t,Math.min(e,i)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(t){return this.x*t.x+this.y*t.y+this.z*t.z+this.w*t.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this.z+=(t.z-this.z)*e,this.w+=(t.w-this.w)*e,this}lerpVectors(t,e,i){return this.x=t.x+(e.x-t.x)*i,this.y=t.y+(e.y-t.y)*i,this.z=t.z+(e.z-t.z)*i,this.w=t.w+(e.w-t.w)*i,this}equals(t){return t.x===this.x&&t.y===this.y&&t.z===this.z&&t.w===this.w}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this.z=t[e+2],this.w=t[e+3],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t[e+2]=this.z,t[e+3]=this.w,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this.z=t.getZ(e),this.w=t.getW(e),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}},ou=class extends Ui{constructor(t=1,e=1,i={}){super(),this.isRenderTarget=!0,this.width=t,this.height=e,this.depth=1,this.scissor=new Ee(0,0,t,e),this.scissorTest=!1,this.viewport=new Ee(0,0,t,e);let s={width:t,height:e,depth:1};i=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:di,depthBuffer:!0,stencilBuffer:!1,resolveDepthBuffer:!0,resolveStencilBuffer:!0,depthTexture:null,samples:0,count:1},i);let r=new _n(s,i.mapping,i.wrapS,i.wrapT,i.magFilter,i.minFilter,i.format,i.type,i.anisotropy,i.colorSpace);r.flipY=!1,r.generateMipmaps=i.generateMipmaps,r.internalFormat=i.internalFormat,this.textures=[];let o=i.count;for(let a=0;a<o;a++)this.textures[a]=r.clone(),this.textures[a].isRenderTargetTexture=!0;this.depthBuffer=i.depthBuffer,this.stencilBuffer=i.stencilBuffer,this.resolveDepthBuffer=i.resolveDepthBuffer,this.resolveStencilBuffer=i.resolveStencilBuffer,this.depthTexture=i.depthTexture,this.samples=i.samples}get texture(){return this.textures[0]}set texture(t){this.textures[0]=t}setSize(t,e,i=1){if(this.width!==t||this.height!==e||this.depth!==i){this.width=t,this.height=e,this.depth=i;for(let s=0,r=this.textures.length;s<r;s++)this.textures[s].image.width=t,this.textures[s].image.height=e,this.textures[s].image.depth=i;this.dispose()}this.viewport.set(0,0,t,e),this.scissor.set(0,0,t,e)}clone(){return new this.constructor().copy(this)}copy(t){this.width=t.width,this.height=t.height,this.depth=t.depth,this.scissor.copy(t.scissor),this.scissorTest=t.scissorTest,this.viewport.copy(t.viewport),this.textures.length=0;for(let i=0,s=t.textures.length;i<s;i++)this.textures[i]=t.textures[i].clone(),this.textures[i].isRenderTargetTexture=!0;let e=Object.assign({},t.texture.image);return this.texture.source=new il(e),this.depthBuffer=t.depthBuffer,this.stencilBuffer=t.stencilBuffer,this.resolveDepthBuffer=t.resolveDepthBuffer,this.resolveStencilBuffer=t.resolveStencilBuffer,t.depthTexture!==null&&(this.depthTexture=t.depthTexture.clone()),this.samples=t.samples,this}dispose(){this.dispatchEvent({type:"dispose"})}},xn=class extends ou{constructor(t=1,e=1,i={}){super(t,e,i),this.isWebGLRenderTarget=!0}},sl=class extends _n{constructor(t=null,e=1,i=1,s=1){super(null),this.isDataArrayTexture=!0,this.image={data:t,width:e,height:i,depth:s},this.magFilter=ln,this.minFilter=ln,this.wrapR=ks,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}addLayerUpdate(t){this.layerUpdates.add(t)}clearLayerUpdates(){this.layerUpdates.clear()}};var au=class extends _n{constructor(t=null,e=1,i=1,s=1){super(null),this.isData3DTexture=!0,this.image={data:t,width:e,height:i,depth:s},this.magFilter=ln,this.minFilter=ln,this.wrapR=ks,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}};var ei=class{constructor(t=0,e=0,i=0,s=1){this.isQuaternion=!0,this._x=t,this._y=e,this._z=i,this._w=s}static slerpFlat(t,e,i,s,r,o,a){let l=i[s+0],c=i[s+1],h=i[s+2],u=i[s+3],d=r[o+0],f=r[o+1],m=r[o+2],_=r[o+3];if(a===0){t[e+0]=l,t[e+1]=c,t[e+2]=h,t[e+3]=u;return}if(a===1){t[e+0]=d,t[e+1]=f,t[e+2]=m,t[e+3]=_;return}if(u!==_||l!==d||c!==f||h!==m){let g=1-a,p=l*d+c*f+h*m+u*_,S=p>=0?1:-1,M=1-p*p;if(M>Number.EPSILON){let L=Math.sqrt(M),R=Math.atan2(L,p*S);g=Math.sin(g*R)/L,a=Math.sin(a*R)/L}let x=a*S;if(l=l*g+d*x,c=c*g+f*x,h=h*g+m*x,u=u*g+_*x,g===1-a){let L=1/Math.sqrt(l*l+c*c+h*h+u*u);l*=L,c*=L,h*=L,u*=L}}t[e]=l,t[e+1]=c,t[e+2]=h,t[e+3]=u}static multiplyQuaternionsFlat(t,e,i,s,r,o){let a=i[s],l=i[s+1],c=i[s+2],h=i[s+3],u=r[o],d=r[o+1],f=r[o+2],m=r[o+3];return t[e]=a*m+h*u+l*f-c*d,t[e+1]=l*m+h*d+c*u-a*f,t[e+2]=c*m+h*f+a*d-l*u,t[e+3]=h*m-a*u-l*d-c*f,t}get x(){return this._x}set x(t){this._x=t,this._onChangeCallback()}get y(){return this._y}set y(t){this._y=t,this._onChangeCallback()}get z(){return this._z}set z(t){this._z=t,this._onChangeCallback()}get w(){return this._w}set w(t){this._w=t,this._onChangeCallback()}set(t,e,i,s){return this._x=t,this._y=e,this._z=i,this._w=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(t){return this._x=t.x,this._y=t.y,this._z=t.z,this._w=t.w,this._onChangeCallback(),this}setFromEuler(t,e=!0){let i=t._x,s=t._y,r=t._z,o=t._order,a=Math.cos,l=Math.sin,c=a(i/2),h=a(s/2),u=a(r/2),d=l(i/2),f=l(s/2),m=l(r/2);switch(o){case"XYZ":this._x=d*h*u+c*f*m,this._y=c*f*u-d*h*m,this._z=c*h*m+d*f*u,this._w=c*h*u-d*f*m;break;case"YXZ":this._x=d*h*u+c*f*m,this._y=c*f*u-d*h*m,this._z=c*h*m-d*f*u,this._w=c*h*u+d*f*m;break;case"ZXY":this._x=d*h*u-c*f*m,this._y=c*f*u+d*h*m,this._z=c*h*m+d*f*u,this._w=c*h*u-d*f*m;break;case"ZYX":this._x=d*h*u-c*f*m,this._y=c*f*u+d*h*m,this._z=c*h*m-d*f*u,this._w=c*h*u+d*f*m;break;case"YZX":this._x=d*h*u+c*f*m,this._y=c*f*u+d*h*m,this._z=c*h*m-d*f*u,this._w=c*h*u-d*f*m;break;case"XZY":this._x=d*h*u-c*f*m,this._y=c*f*u-d*h*m,this._z=c*h*m+d*f*u,this._w=c*h*u+d*f*m;break;default:console.warn("THREE.Quaternion: .setFromEuler() encountered an unknown order: "+o)}return e===!0&&this._onChangeCallback(),this}setFromAxisAngle(t,e){let i=e/2,s=Math.sin(i);return this._x=t.x*s,this._y=t.y*s,this._z=t.z*s,this._w=Math.cos(i),this._onChangeCallback(),this}setFromRotationMatrix(t){let e=t.elements,i=e[0],s=e[4],r=e[8],o=e[1],a=e[5],l=e[9],c=e[2],h=e[6],u=e[10],d=i+a+u;if(d>0){let f=.5/Math.sqrt(d+1);this._w=.25/f,this._x=(h-l)*f,this._y=(r-c)*f,this._z=(o-s)*f}else if(i>a&&i>u){let f=2*Math.sqrt(1+i-a-u);this._w=(h-l)/f,this._x=.25*f,this._y=(s+o)/f,this._z=(r+c)/f}else if(a>u){let f=2*Math.sqrt(1+a-i-u);this._w=(r-c)/f,this._x=(s+o)/f,this._y=.25*f,this._z=(l+h)/f}else{let f=2*Math.sqrt(1+u-i-a);this._w=(o-s)/f,this._x=(r+c)/f,this._y=(l+h)/f,this._z=.25*f}return this._onChangeCallback(),this}setFromUnitVectors(t,e){let i=t.dot(e)+1;return i<Number.EPSILON?(i=0,Math.abs(t.x)>Math.abs(t.z)?(this._x=-t.y,this._y=t.x,this._z=0,this._w=i):(this._x=0,this._y=-t.z,this._z=t.y,this._w=i)):(this._x=t.y*e.z-t.z*e.y,this._y=t.z*e.x-t.x*e.z,this._z=t.x*e.y-t.y*e.x,this._w=i),this.normalize()}angleTo(t){return 2*Math.acos(Math.abs(Ke(this.dot(t),-1,1)))}rotateTowards(t,e){let i=this.angleTo(t);if(i===0)return this;let s=Math.min(1,e/i);return this.slerp(t,s),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(t){return this._x*t._x+this._y*t._y+this._z*t._z+this._w*t._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let t=this.length();return t===0?(this._x=0,this._y=0,this._z=0,this._w=1):(t=1/t,this._x=this._x*t,this._y=this._y*t,this._z=this._z*t,this._w=this._w*t),this._onChangeCallback(),this}multiply(t){return this.multiplyQuaternions(this,t)}premultiply(t){return this.multiplyQuaternions(t,this)}multiplyQuaternions(t,e){let i=t._x,s=t._y,r=t._z,o=t._w,a=e._x,l=e._y,c=e._z,h=e._w;return this._x=i*h+o*a+s*c-r*l,this._y=s*h+o*l+r*a-i*c,this._z=r*h+o*c+i*l-s*a,this._w=o*h-i*a-s*l-r*c,this._onChangeCallback(),this}slerp(t,e){if(e===0)return this;if(e===1)return this.copy(t);let i=this._x,s=this._y,r=this._z,o=this._w,a=o*t._w+i*t._x+s*t._y+r*t._z;if(a<0?(this._w=-t._w,this._x=-t._x,this._y=-t._y,this._z=-t._z,a=-a):this.copy(t),a>=1)return this._w=o,this._x=i,this._y=s,this._z=r,this;let l=1-a*a;if(l<=Number.EPSILON){let f=1-e;return this._w=f*o+e*this._w,this._x=f*i+e*this._x,this._y=f*s+e*this._y,this._z=f*r+e*this._z,this.normalize(),this}let c=Math.sqrt(l),h=Math.atan2(c,a),u=Math.sin((1-e)*h)/c,d=Math.sin(e*h)/c;return this._w=o*u+this._w*d,this._x=i*u+this._x*d,this._y=s*u+this._y*d,this._z=r*u+this._z*d,this._onChangeCallback(),this}slerpQuaternions(t,e,i){return this.copy(t).slerp(e,i)}random(){let t=2*Math.PI*Math.random(),e=2*Math.PI*Math.random(),i=Math.random(),s=Math.sqrt(1-i),r=Math.sqrt(i);return this.set(s*Math.sin(t),s*Math.cos(t),r*Math.sin(e),r*Math.cos(e))}equals(t){return t._x===this._x&&t._y===this._y&&t._z===this._z&&t._w===this._w}fromArray(t,e=0){return this._x=t[e],this._y=t[e+1],this._z=t[e+2],this._w=t[e+3],this._onChangeCallback(),this}toArray(t=[],e=0){return t[e]=this._x,t[e+1]=this._y,t[e+2]=this._z,t[e+3]=this._w,t}fromBufferAttribute(t,e){return this._x=t.getX(e),this._y=t.getY(e),this._z=t.getZ(e),this._w=t.getW(e),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(t){return this._onChangeCallback=t,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}},w=class n{constructor(t=0,e=0,i=0){n.prototype.isVector3=!0,this.x=t,this.y=e,this.z=i}set(t,e,i){return i===void 0&&(i=this.z),this.x=t,this.y=e,this.z=i,this}setScalar(t){return this.x=t,this.y=t,this.z=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setZ(t){return this.z=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;case 2:this.z=e;break;default:throw new Error("index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this}add(t){return this.x+=t.x,this.y+=t.y,this.z+=t.z,this}addScalar(t){return this.x+=t,this.y+=t,this.z+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this.z=t.z+e.z,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this.z+=t.z*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this.z-=t.z,this}subScalar(t){return this.x-=t,this.y-=t,this.z-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this.z=t.z-e.z,this}multiply(t){return this.x*=t.x,this.y*=t.y,this.z*=t.z,this}multiplyScalar(t){return this.x*=t,this.y*=t,this.z*=t,this}multiplyVectors(t,e){return this.x=t.x*e.x,this.y=t.y*e.y,this.z=t.z*e.z,this}applyEuler(t){return this.applyQuaternion(Of.setFromEuler(t))}applyAxisAngle(t,e){return this.applyQuaternion(Of.setFromAxisAngle(t,e))}applyMatrix3(t){let e=this.x,i=this.y,s=this.z,r=t.elements;return this.x=r[0]*e+r[3]*i+r[6]*s,this.y=r[1]*e+r[4]*i+r[7]*s,this.z=r[2]*e+r[5]*i+r[8]*s,this}applyNormalMatrix(t){return this.applyMatrix3(t).normalize()}applyMatrix4(t){let e=this.x,i=this.y,s=this.z,r=t.elements,o=1/(r[3]*e+r[7]*i+r[11]*s+r[15]);return this.x=(r[0]*e+r[4]*i+r[8]*s+r[12])*o,this.y=(r[1]*e+r[5]*i+r[9]*s+r[13])*o,this.z=(r[2]*e+r[6]*i+r[10]*s+r[14])*o,this}applyQuaternion(t){let e=this.x,i=this.y,s=this.z,r=t.x,o=t.y,a=t.z,l=t.w,c=2*(o*s-a*i),h=2*(a*e-r*s),u=2*(r*i-o*e);return this.x=e+l*c+o*u-a*h,this.y=i+l*h+a*c-r*u,this.z=s+l*u+r*h-o*c,this}project(t){return this.applyMatrix4(t.matrixWorldInverse).applyMatrix4(t.projectionMatrix)}unproject(t){return this.applyMatrix4(t.projectionMatrixInverse).applyMatrix4(t.matrixWorld)}transformDirection(t){let e=this.x,i=this.y,s=this.z,r=t.elements;return this.x=r[0]*e+r[4]*i+r[8]*s,this.y=r[1]*e+r[5]*i+r[9]*s,this.z=r[2]*e+r[6]*i+r[10]*s,this.normalize()}divide(t){return this.x/=t.x,this.y/=t.y,this.z/=t.z,this}divideScalar(t){return this.multiplyScalar(1/t)}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this.z=Math.min(this.z,t.z),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this.z=Math.max(this.z,t.z),this}clamp(t,e){return this.x=Math.max(t.x,Math.min(e.x,this.x)),this.y=Math.max(t.y,Math.min(e.y,this.y)),this.z=Math.max(t.z,Math.min(e.z,this.z)),this}clampScalar(t,e){return this.x=Math.max(t,Math.min(e,this.x)),this.y=Math.max(t,Math.min(e,this.y)),this.z=Math.max(t,Math.min(e,this.z)),this}clampLength(t,e){let i=this.length();return this.divideScalar(i||1).multiplyScalar(Math.max(t,Math.min(e,i)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(t){return this.x*t.x+this.y*t.y+this.z*t.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this.z+=(t.z-this.z)*e,this}lerpVectors(t,e,i){return this.x=t.x+(e.x-t.x)*i,this.y=t.y+(e.y-t.y)*i,this.z=t.z+(e.z-t.z)*i,this}cross(t){return this.crossVectors(this,t)}crossVectors(t,e){let i=t.x,s=t.y,r=t.z,o=e.x,a=e.y,l=e.z;return this.x=s*l-r*a,this.y=r*o-i*l,this.z=i*a-s*o,this}projectOnVector(t){let e=t.lengthSq();if(e===0)return this.set(0,0,0);let i=t.dot(this)/e;return this.copy(t).multiplyScalar(i)}projectOnPlane(t){return Wc.copy(this).projectOnVector(t),this.sub(Wc)}reflect(t){return this.sub(Wc.copy(t).multiplyScalar(2*this.dot(t)))}angleTo(t){let e=Math.sqrt(this.lengthSq()*t.lengthSq());if(e===0)return Math.PI/2;let i=this.dot(t)/e;return Math.acos(Ke(i,-1,1))}distanceTo(t){return Math.sqrt(this.distanceToSquared(t))}distanceToSquared(t){let e=this.x-t.x,i=this.y-t.y,s=this.z-t.z;return e*e+i*i+s*s}manhattanDistanceTo(t){return Math.abs(this.x-t.x)+Math.abs(this.y-t.y)+Math.abs(this.z-t.z)}setFromSpherical(t){return this.setFromSphericalCoords(t.radius,t.phi,t.theta)}setFromSphericalCoords(t,e,i){let s=Math.sin(e)*t;return this.x=s*Math.sin(i),this.y=Math.cos(e)*t,this.z=s*Math.cos(i),this}setFromCylindrical(t){return this.setFromCylindricalCoords(t.radius,t.theta,t.y)}setFromCylindricalCoords(t,e,i){return this.x=t*Math.sin(e),this.y=i,this.z=t*Math.cos(e),this}setFromMatrixPosition(t){let e=t.elements;return this.x=e[12],this.y=e[13],this.z=e[14],this}setFromMatrixScale(t){let e=this.setFromMatrixColumn(t,0).length(),i=this.setFromMatrixColumn(t,1).length(),s=this.setFromMatrixColumn(t,2).length();return this.x=e,this.y=i,this.z=s,this}setFromMatrixColumn(t,e){return this.fromArray(t.elements,e*4)}setFromMatrix3Column(t,e){return this.fromArray(t.elements,e*3)}setFromEuler(t){return this.x=t._x,this.y=t._y,this.z=t._z,this}setFromColor(t){return this.x=t.r,this.y=t.g,this.z=t.b,this}equals(t){return t.x===this.x&&t.y===this.y&&t.z===this.z}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this.z=t[e+2],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t[e+2]=this.z,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this.z=t.getZ(e),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){let t=Math.random()*Math.PI*2,e=Math.random()*2-1,i=Math.sqrt(1-e*e);return this.x=i*Math.cos(t),this.y=e,this.z=i*Math.sin(t),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}},Wc=new w,Of=new ei,Wn=class{constructor(t=new w(1/0,1/0,1/0),e=new w(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=t,this.max=e}set(t,e){return this.min.copy(t),this.max.copy(e),this}setFromArray(t){this.makeEmpty();for(let e=0,i=t.length;e<i;e+=3)this.expandByPoint($n.fromArray(t,e));return this}setFromBufferAttribute(t){this.makeEmpty();for(let e=0,i=t.count;e<i;e++)this.expandByPoint($n.fromBufferAttribute(t,e));return this}setFromPoints(t){this.makeEmpty();for(let e=0,i=t.length;e<i;e++)this.expandByPoint(t[e]);return this}setFromCenterAndSize(t,e){let i=$n.copy(e).multiplyScalar(.5);return this.min.copy(t).sub(i),this.max.copy(t).add(i),this}setFromObject(t,e=!1){return this.makeEmpty(),this.expandByObject(t,e)}clone(){return new this.constructor().copy(this)}copy(t){return this.min.copy(t.min),this.max.copy(t.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(t){return this.isEmpty()?t.set(0,0,0):t.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(t){return this.isEmpty()?t.set(0,0,0):t.subVectors(this.max,this.min)}expandByPoint(t){return this.min.min(t),this.max.max(t),this}expandByVector(t){return this.min.sub(t),this.max.add(t),this}expandByScalar(t){return this.min.addScalar(-t),this.max.addScalar(t),this}expandByObject(t,e=!1){t.updateWorldMatrix(!1,!1);let i=t.geometry;if(i!==void 0){let r=i.getAttribute("position");if(e===!0&&r!==void 0&&t.isInstancedMesh!==!0)for(let o=0,a=r.count;o<a;o++)t.isMesh===!0?t.getVertexPosition(o,$n):$n.fromBufferAttribute(r,o),$n.applyMatrix4(t.matrixWorld),this.expandByPoint($n);else t.boundingBox!==void 0?(t.boundingBox===null&&t.computeBoundingBox(),ba.copy(t.boundingBox)):(i.boundingBox===null&&i.computeBoundingBox(),ba.copy(i.boundingBox)),ba.applyMatrix4(t.matrixWorld),this.union(ba)}let s=t.children;for(let r=0,o=s.length;r<o;r++)this.expandByObject(s[r],e);return this}containsPoint(t){return t.x>=this.min.x&&t.x<=this.max.x&&t.y>=this.min.y&&t.y<=this.max.y&&t.z>=this.min.z&&t.z<=this.max.z}containsBox(t){return this.min.x<=t.min.x&&t.max.x<=this.max.x&&this.min.y<=t.min.y&&t.max.y<=this.max.y&&this.min.z<=t.min.z&&t.max.z<=this.max.z}getParameter(t,e){return e.set((t.x-this.min.x)/(this.max.x-this.min.x),(t.y-this.min.y)/(this.max.y-this.min.y),(t.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(t){return t.max.x>=this.min.x&&t.min.x<=this.max.x&&t.max.y>=this.min.y&&t.min.y<=this.max.y&&t.max.z>=this.min.z&&t.min.z<=this.max.z}intersectsSphere(t){return this.clampPoint(t.center,$n),$n.distanceToSquared(t.center)<=t.radius*t.radius}intersectsPlane(t){let e,i;return t.normal.x>0?(e=t.normal.x*this.min.x,i=t.normal.x*this.max.x):(e=t.normal.x*this.max.x,i=t.normal.x*this.min.x),t.normal.y>0?(e+=t.normal.y*this.min.y,i+=t.normal.y*this.max.y):(e+=t.normal.y*this.max.y,i+=t.normal.y*this.min.y),t.normal.z>0?(e+=t.normal.z*this.min.z,i+=t.normal.z*this.max.z):(e+=t.normal.z*this.max.z,i+=t.normal.z*this.min.z),e<=-t.constant&&i>=-t.constant}intersectsTriangle(t){if(this.isEmpty())return!1;this.getCenter(uo),Sa.subVectors(this.max,uo),gr.subVectors(t.a,uo),_r.subVectors(t.b,uo),xr.subVectors(t.c,uo),$i.subVectors(_r,gr),Ji.subVectors(xr,_r),Ps.subVectors(gr,xr);let e=[0,-$i.z,$i.y,0,-Ji.z,Ji.y,0,-Ps.z,Ps.y,$i.z,0,-$i.x,Ji.z,0,-Ji.x,Ps.z,0,-Ps.x,-$i.y,$i.x,0,-Ji.y,Ji.x,0,-Ps.y,Ps.x,0];return!Xc(e,gr,_r,xr,Sa)||(e=[1,0,0,0,1,0,0,0,1],!Xc(e,gr,_r,xr,Sa))?!1:(Ta.crossVectors($i,Ji),e=[Ta.x,Ta.y,Ta.z],Xc(e,gr,_r,xr,Sa))}clampPoint(t,e){return e.copy(t).clamp(this.min,this.max)}distanceToPoint(t){return this.clampPoint(t,$n).distanceTo(t)}getBoundingSphere(t){return this.isEmpty()?t.makeEmpty():(this.getCenter(t.center),t.radius=this.getSize($n).length()*.5),t}intersect(t){return this.min.max(t.min),this.max.min(t.max),this.isEmpty()&&this.makeEmpty(),this}union(t){return this.min.min(t.min),this.max.max(t.max),this}applyMatrix4(t){return this.isEmpty()?this:(Ti[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(t),Ti[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(t),Ti[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(t),Ti[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(t),Ti[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(t),Ti[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(t),Ti[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(t),Ti[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(t),this.setFromPoints(Ti),this)}translate(t){return this.min.add(t),this.max.add(t),this}equals(t){return t.min.equals(this.min)&&t.max.equals(this.max)}},Ti=[new w,new w,new w,new w,new w,new w,new w,new w],$n=new w,ba=new Wn,gr=new w,_r=new w,xr=new w,$i=new w,Ji=new w,Ps=new w,uo=new w,Sa=new w,Ta=new w,Is=new w;function Xc(n,t,e,i,s){for(let r=0,o=n.length-3;r<=o;r+=3){Is.fromArray(n,r);let a=s.x*Math.abs(Is.x)+s.y*Math.abs(Is.y)+s.z*Math.abs(Is.z),l=t.dot(Is),c=e.dot(Is),h=i.dot(Is);if(Math.max(-Math.max(l,c,h),Math.min(l,c,h))>a)return!1}return!0}var Yg=new Wn,fo=new w,Yc=new w,os=class{constructor(t=new w,e=-1){this.isSphere=!0,this.center=t,this.radius=e}set(t,e){return this.center.copy(t),this.radius=e,this}setFromPoints(t,e){let i=this.center;e!==void 0?i.copy(e):Yg.setFromPoints(t).getCenter(i);let s=0;for(let r=0,o=t.length;r<o;r++)s=Math.max(s,i.distanceToSquared(t[r]));return this.radius=Math.sqrt(s),this}copy(t){return this.center.copy(t.center),this.radius=t.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(t){return t.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(t){return t.distanceTo(this.center)-this.radius}intersectsSphere(t){let e=this.radius+t.radius;return t.center.distanceToSquared(this.center)<=e*e}intersectsBox(t){return t.intersectsSphere(this)}intersectsPlane(t){return Math.abs(t.distanceToPoint(this.center))<=this.radius}clampPoint(t,e){let i=this.center.distanceToSquared(t);return e.copy(t),i>this.radius*this.radius&&(e.sub(this.center).normalize(),e.multiplyScalar(this.radius).add(this.center)),e}getBoundingBox(t){return this.isEmpty()?(t.makeEmpty(),t):(t.set(this.center,this.center),t.expandByScalar(this.radius),t)}applyMatrix4(t){return this.center.applyMatrix4(t),this.radius=this.radius*t.getMaxScaleOnAxis(),this}translate(t){return this.center.add(t),this}expandByPoint(t){if(this.isEmpty())return this.center.copy(t),this.radius=0,this;fo.subVectors(t,this.center);let e=fo.lengthSq();if(e>this.radius*this.radius){let i=Math.sqrt(e),s=(i-this.radius)*.5;this.center.addScaledVector(fo,s/i),this.radius+=s}return this}union(t){return t.isEmpty()?this:this.isEmpty()?(this.copy(t),this):(this.center.equals(t.center)===!0?this.radius=Math.max(this.radius,t.radius):(Yc.subVectors(t.center,this.center).setLength(t.radius),this.expandByPoint(fo.copy(t.center).add(Yc)),this.expandByPoint(fo.copy(t.center).sub(Yc))),this)}equals(t){return t.center.equals(this.center)&&t.radius===this.radius}clone(){return new this.constructor().copy(this)}},wi=new w,qc=new w,wa=new w,ji=new w,Zc=new w,Aa=new w,Kc=new w,Gs=class{constructor(t=new w,e=new w(0,0,-1)){this.origin=t,this.direction=e}set(t,e){return this.origin.copy(t),this.direction.copy(e),this}copy(t){return this.origin.copy(t.origin),this.direction.copy(t.direction),this}at(t,e){return e.copy(this.origin).addScaledVector(this.direction,t)}lookAt(t){return this.direction.copy(t).sub(this.origin).normalize(),this}recast(t){return this.origin.copy(this.at(t,wi)),this}closestPointToPoint(t,e){e.subVectors(t,this.origin);let i=e.dot(this.direction);return i<0?e.copy(this.origin):e.copy(this.origin).addScaledVector(this.direction,i)}distanceToPoint(t){return Math.sqrt(this.distanceSqToPoint(t))}distanceSqToPoint(t){let e=wi.subVectors(t,this.origin).dot(this.direction);return e<0?this.origin.distanceToSquared(t):(wi.copy(this.origin).addScaledVector(this.direction,e),wi.distanceToSquared(t))}distanceSqToSegment(t,e,i,s){qc.copy(t).add(e).multiplyScalar(.5),wa.copy(e).sub(t).normalize(),ji.copy(this.origin).sub(qc);let r=t.distanceTo(e)*.5,o=-this.direction.dot(wa),a=ji.dot(this.direction),l=-ji.dot(wa),c=ji.lengthSq(),h=Math.abs(1-o*o),u,d,f,m;if(h>0)if(u=o*l-a,d=o*a-l,m=r*h,u>=0)if(d>=-m)if(d<=m){let _=1/h;u*=_,d*=_,f=u*(u+o*d+2*a)+d*(o*u+d+2*l)+c}else d=r,u=Math.max(0,-(o*d+a)),f=-u*u+d*(d+2*l)+c;else d=-r,u=Math.max(0,-(o*d+a)),f=-u*u+d*(d+2*l)+c;else d<=-m?(u=Math.max(0,-(-o*r+a)),d=u>0?-r:Math.min(Math.max(-r,-l),r),f=-u*u+d*(d+2*l)+c):d<=m?(u=0,d=Math.min(Math.max(-r,-l),r),f=d*(d+2*l)+c):(u=Math.max(0,-(o*r+a)),d=u>0?r:Math.min(Math.max(-r,-l),r),f=-u*u+d*(d+2*l)+c);else d=o>0?-r:r,u=Math.max(0,-(o*d+a)),f=-u*u+d*(d+2*l)+c;return i&&i.copy(this.origin).addScaledVector(this.direction,u),s&&s.copy(qc).addScaledVector(wa,d),f}intersectSphere(t,e){wi.subVectors(t.center,this.origin);let i=wi.dot(this.direction),s=wi.dot(wi)-i*i,r=t.radius*t.radius;if(s>r)return null;let o=Math.sqrt(r-s),a=i-o,l=i+o;return l<0?null:a<0?this.at(l,e):this.at(a,e)}intersectsSphere(t){return this.distanceSqToPoint(t.center)<=t.radius*t.radius}distanceToPlane(t){let e=t.normal.dot(this.direction);if(e===0)return t.distanceToPoint(this.origin)===0?0:null;let i=-(this.origin.dot(t.normal)+t.constant)/e;return i>=0?i:null}intersectPlane(t,e){let i=this.distanceToPlane(t);return i===null?null:this.at(i,e)}intersectsPlane(t){let e=t.distanceToPoint(this.origin);return e===0||t.normal.dot(this.direction)*e<0}intersectBox(t,e){let i,s,r,o,a,l,c=1/this.direction.x,h=1/this.direction.y,u=1/this.direction.z,d=this.origin;return c>=0?(i=(t.min.x-d.x)*c,s=(t.max.x-d.x)*c):(i=(t.max.x-d.x)*c,s=(t.min.x-d.x)*c),h>=0?(r=(t.min.y-d.y)*h,o=(t.max.y-d.y)*h):(r=(t.max.y-d.y)*h,o=(t.min.y-d.y)*h),i>o||r>s||((r>i||isNaN(i))&&(i=r),(o<s||isNaN(s))&&(s=o),u>=0?(a=(t.min.z-d.z)*u,l=(t.max.z-d.z)*u):(a=(t.max.z-d.z)*u,l=(t.min.z-d.z)*u),i>l||a>s)||((a>i||i!==i)&&(i=a),(l<s||s!==s)&&(s=l),s<0)?null:this.at(i>=0?i:s,e)}intersectsBox(t){return this.intersectBox(t,wi)!==null}intersectTriangle(t,e,i,s,r){Zc.subVectors(e,t),Aa.subVectors(i,t),Kc.crossVectors(Zc,Aa);let o=this.direction.dot(Kc),a;if(o>0){if(s)return null;a=1}else if(o<0)a=-1,o=-o;else return null;ji.subVectors(this.origin,t);let l=a*this.direction.dot(Aa.crossVectors(ji,Aa));if(l<0)return null;let c=a*this.direction.dot(Zc.cross(ji));if(c<0||l+c>o)return null;let h=-a*ji.dot(Kc);return h<0?null:this.at(h/o,r)}applyMatrix4(t){return this.origin.applyMatrix4(t),this.direction.transformDirection(t),this}equals(t){return t.origin.equals(this.origin)&&t.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}},be=class n{constructor(t,e,i,s,r,o,a,l,c,h,u,d,f,m,_,g){n.prototype.isMatrix4=!0,this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],t!==void 0&&this.set(t,e,i,s,r,o,a,l,c,h,u,d,f,m,_,g)}set(t,e,i,s,r,o,a,l,c,h,u,d,f,m,_,g){let p=this.elements;return p[0]=t,p[4]=e,p[8]=i,p[12]=s,p[1]=r,p[5]=o,p[9]=a,p[13]=l,p[2]=c,p[6]=h,p[10]=u,p[14]=d,p[3]=f,p[7]=m,p[11]=_,p[15]=g,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new n().fromArray(this.elements)}copy(t){let e=this.elements,i=t.elements;return e[0]=i[0],e[1]=i[1],e[2]=i[2],e[3]=i[3],e[4]=i[4],e[5]=i[5],e[6]=i[6],e[7]=i[7],e[8]=i[8],e[9]=i[9],e[10]=i[10],e[11]=i[11],e[12]=i[12],e[13]=i[13],e[14]=i[14],e[15]=i[15],this}copyPosition(t){let e=this.elements,i=t.elements;return e[12]=i[12],e[13]=i[13],e[14]=i[14],this}setFromMatrix3(t){let e=t.elements;return this.set(e[0],e[3],e[6],0,e[1],e[4],e[7],0,e[2],e[5],e[8],0,0,0,0,1),this}extractBasis(t,e,i){return t.setFromMatrixColumn(this,0),e.setFromMatrixColumn(this,1),i.setFromMatrixColumn(this,2),this}makeBasis(t,e,i){return this.set(t.x,e.x,i.x,0,t.y,e.y,i.y,0,t.z,e.z,i.z,0,0,0,0,1),this}extractRotation(t){let e=this.elements,i=t.elements,s=1/vr.setFromMatrixColumn(t,0).length(),r=1/vr.setFromMatrixColumn(t,1).length(),o=1/vr.setFromMatrixColumn(t,2).length();return e[0]=i[0]*s,e[1]=i[1]*s,e[2]=i[2]*s,e[3]=0,e[4]=i[4]*r,e[5]=i[5]*r,e[6]=i[6]*r,e[7]=0,e[8]=i[8]*o,e[9]=i[9]*o,e[10]=i[10]*o,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,this}makeRotationFromEuler(t){let e=this.elements,i=t.x,s=t.y,r=t.z,o=Math.cos(i),a=Math.sin(i),l=Math.cos(s),c=Math.sin(s),h=Math.cos(r),u=Math.sin(r);if(t.order==="XYZ"){let d=o*h,f=o*u,m=a*h,_=a*u;e[0]=l*h,e[4]=-l*u,e[8]=c,e[1]=f+m*c,e[5]=d-_*c,e[9]=-a*l,e[2]=_-d*c,e[6]=m+f*c,e[10]=o*l}else if(t.order==="YXZ"){let d=l*h,f=l*u,m=c*h,_=c*u;e[0]=d+_*a,e[4]=m*a-f,e[8]=o*c,e[1]=o*u,e[5]=o*h,e[9]=-a,e[2]=f*a-m,e[6]=_+d*a,e[10]=o*l}else if(t.order==="ZXY"){let d=l*h,f=l*u,m=c*h,_=c*u;e[0]=d-_*a,e[4]=-o*u,e[8]=m+f*a,e[1]=f+m*a,e[5]=o*h,e[9]=_-d*a,e[2]=-o*c,e[6]=a,e[10]=o*l}else if(t.order==="ZYX"){let d=o*h,f=o*u,m=a*h,_=a*u;e[0]=l*h,e[4]=m*c-f,e[8]=d*c+_,e[1]=l*u,e[5]=_*c+d,e[9]=f*c-m,e[2]=-c,e[6]=a*l,e[10]=o*l}else if(t.order==="YZX"){let d=o*l,f=o*c,m=a*l,_=a*c;e[0]=l*h,e[4]=_-d*u,e[8]=m*u+f,e[1]=u,e[5]=o*h,e[9]=-a*h,e[2]=-c*h,e[6]=f*u+m,e[10]=d-_*u}else if(t.order==="XZY"){let d=o*l,f=o*c,m=a*l,_=a*c;e[0]=l*h,e[4]=-u,e[8]=c*h,e[1]=d*u+_,e[5]=o*h,e[9]=f*u-m,e[2]=m*u-f,e[6]=a*h,e[10]=_*u+d}return e[3]=0,e[7]=0,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,this}makeRotationFromQuaternion(t){return this.compose(qg,t,Zg)}lookAt(t,e,i){let s=this.elements;return Cn.subVectors(t,e),Cn.lengthSq()===0&&(Cn.z=1),Cn.normalize(),Qi.crossVectors(i,Cn),Qi.lengthSq()===0&&(Math.abs(i.z)===1?Cn.x+=1e-4:Cn.z+=1e-4,Cn.normalize(),Qi.crossVectors(i,Cn)),Qi.normalize(),Ra.crossVectors(Cn,Qi),s[0]=Qi.x,s[4]=Ra.x,s[8]=Cn.x,s[1]=Qi.y,s[5]=Ra.y,s[9]=Cn.y,s[2]=Qi.z,s[6]=Ra.z,s[10]=Cn.z,this}multiply(t){return this.multiplyMatrices(this,t)}premultiply(t){return this.multiplyMatrices(t,this)}multiplyMatrices(t,e){let i=t.elements,s=e.elements,r=this.elements,o=i[0],a=i[4],l=i[8],c=i[12],h=i[1],u=i[5],d=i[9],f=i[13],m=i[2],_=i[6],g=i[10],p=i[14],S=i[3],M=i[7],x=i[11],L=i[15],R=s[0],C=s[4],D=s[8],b=s[12],y=s[1],I=s[5],Y=s[9],V=s[13],F=s[2],X=s[6],z=s[10],J=s[14],k=s[3],rt=s[7],ct=s[11],mt=s[15];return r[0]=o*R+a*y+l*F+c*k,r[4]=o*C+a*I+l*X+c*rt,r[8]=o*D+a*Y+l*z+c*ct,r[12]=o*b+a*V+l*J+c*mt,r[1]=h*R+u*y+d*F+f*k,r[5]=h*C+u*I+d*X+f*rt,r[9]=h*D+u*Y+d*z+f*ct,r[13]=h*b+u*V+d*J+f*mt,r[2]=m*R+_*y+g*F+p*k,r[6]=m*C+_*I+g*X+p*rt,r[10]=m*D+_*Y+g*z+p*ct,r[14]=m*b+_*V+g*J+p*mt,r[3]=S*R+M*y+x*F+L*k,r[7]=S*C+M*I+x*X+L*rt,r[11]=S*D+M*Y+x*z+L*ct,r[15]=S*b+M*V+x*J+L*mt,this}multiplyScalar(t){let e=this.elements;return e[0]*=t,e[4]*=t,e[8]*=t,e[12]*=t,e[1]*=t,e[5]*=t,e[9]*=t,e[13]*=t,e[2]*=t,e[6]*=t,e[10]*=t,e[14]*=t,e[3]*=t,e[7]*=t,e[11]*=t,e[15]*=t,this}determinant(){let t=this.elements,e=t[0],i=t[4],s=t[8],r=t[12],o=t[1],a=t[5],l=t[9],c=t[13],h=t[2],u=t[6],d=t[10],f=t[14],m=t[3],_=t[7],g=t[11],p=t[15];return m*(+r*l*u-s*c*u-r*a*d+i*c*d+s*a*f-i*l*f)+_*(+e*l*f-e*c*d+r*o*d-s*o*f+s*c*h-r*l*h)+g*(+e*c*u-e*a*f-r*o*u+i*o*f+r*a*h-i*c*h)+p*(-s*a*h-e*l*u+e*a*d+s*o*u-i*o*d+i*l*h)}transpose(){let t=this.elements,e;return e=t[1],t[1]=t[4],t[4]=e,e=t[2],t[2]=t[8],t[8]=e,e=t[6],t[6]=t[9],t[9]=e,e=t[3],t[3]=t[12],t[12]=e,e=t[7],t[7]=t[13],t[13]=e,e=t[11],t[11]=t[14],t[14]=e,this}setPosition(t,e,i){let s=this.elements;return t.isVector3?(s[12]=t.x,s[13]=t.y,s[14]=t.z):(s[12]=t,s[13]=e,s[14]=i),this}invert(){let t=this.elements,e=t[0],i=t[1],s=t[2],r=t[3],o=t[4],a=t[5],l=t[6],c=t[7],h=t[8],u=t[9],d=t[10],f=t[11],m=t[12],_=t[13],g=t[14],p=t[15],S=u*g*c-_*d*c+_*l*f-a*g*f-u*l*p+a*d*p,M=m*d*c-h*g*c-m*l*f+o*g*f+h*l*p-o*d*p,x=h*_*c-m*u*c+m*a*f-o*_*f-h*a*p+o*u*p,L=m*u*l-h*_*l-m*a*d+o*_*d+h*a*g-o*u*g,R=e*S+i*M+s*x+r*L;if(R===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);let C=1/R;return t[0]=S*C,t[1]=(_*d*r-u*g*r-_*s*f+i*g*f+u*s*p-i*d*p)*C,t[2]=(a*g*r-_*l*r+_*s*c-i*g*c-a*s*p+i*l*p)*C,t[3]=(u*l*r-a*d*r-u*s*c+i*d*c+a*s*f-i*l*f)*C,t[4]=M*C,t[5]=(h*g*r-m*d*r+m*s*f-e*g*f-h*s*p+e*d*p)*C,t[6]=(m*l*r-o*g*r-m*s*c+e*g*c+o*s*p-e*l*p)*C,t[7]=(o*d*r-h*l*r+h*s*c-e*d*c-o*s*f+e*l*f)*C,t[8]=x*C,t[9]=(m*u*r-h*_*r-m*i*f+e*_*f+h*i*p-e*u*p)*C,t[10]=(o*_*r-m*a*r+m*i*c-e*_*c-o*i*p+e*a*p)*C,t[11]=(h*a*r-o*u*r-h*i*c+e*u*c+o*i*f-e*a*f)*C,t[12]=L*C,t[13]=(h*_*s-m*u*s+m*i*d-e*_*d-h*i*g+e*u*g)*C,t[14]=(m*a*s-o*_*s-m*i*l+e*_*l+o*i*g-e*a*g)*C,t[15]=(o*u*s-h*a*s+h*i*l-e*u*l-o*i*d+e*a*d)*C,this}scale(t){let e=this.elements,i=t.x,s=t.y,r=t.z;return e[0]*=i,e[4]*=s,e[8]*=r,e[1]*=i,e[5]*=s,e[9]*=r,e[2]*=i,e[6]*=s,e[10]*=r,e[3]*=i,e[7]*=s,e[11]*=r,this}getMaxScaleOnAxis(){let t=this.elements,e=t[0]*t[0]+t[1]*t[1]+t[2]*t[2],i=t[4]*t[4]+t[5]*t[5]+t[6]*t[6],s=t[8]*t[8]+t[9]*t[9]+t[10]*t[10];return Math.sqrt(Math.max(e,i,s))}makeTranslation(t,e,i){return t.isVector3?this.set(1,0,0,t.x,0,1,0,t.y,0,0,1,t.z,0,0,0,1):this.set(1,0,0,t,0,1,0,e,0,0,1,i,0,0,0,1),this}makeRotationX(t){let e=Math.cos(t),i=Math.sin(t);return this.set(1,0,0,0,0,e,-i,0,0,i,e,0,0,0,0,1),this}makeRotationY(t){let e=Math.cos(t),i=Math.sin(t);return this.set(e,0,i,0,0,1,0,0,-i,0,e,0,0,0,0,1),this}makeRotationZ(t){let e=Math.cos(t),i=Math.sin(t);return this.set(e,-i,0,0,i,e,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(t,e){let i=Math.cos(e),s=Math.sin(e),r=1-i,o=t.x,a=t.y,l=t.z,c=r*o,h=r*a;return this.set(c*o+i,c*a-s*l,c*l+s*a,0,c*a+s*l,h*a+i,h*l-s*o,0,c*l-s*a,h*l+s*o,r*l*l+i,0,0,0,0,1),this}makeScale(t,e,i){return this.set(t,0,0,0,0,e,0,0,0,0,i,0,0,0,0,1),this}makeShear(t,e,i,s,r,o){return this.set(1,i,r,0,t,1,o,0,e,s,1,0,0,0,0,1),this}compose(t,e,i){let s=this.elements,r=e._x,o=e._y,a=e._z,l=e._w,c=r+r,h=o+o,u=a+a,d=r*c,f=r*h,m=r*u,_=o*h,g=o*u,p=a*u,S=l*c,M=l*h,x=l*u,L=i.x,R=i.y,C=i.z;return s[0]=(1-(_+p))*L,s[1]=(f+x)*L,s[2]=(m-M)*L,s[3]=0,s[4]=(f-x)*R,s[5]=(1-(d+p))*R,s[6]=(g+S)*R,s[7]=0,s[8]=(m+M)*C,s[9]=(g-S)*C,s[10]=(1-(d+_))*C,s[11]=0,s[12]=t.x,s[13]=t.y,s[14]=t.z,s[15]=1,this}decompose(t,e,i){let s=this.elements,r=vr.set(s[0],s[1],s[2]).length(),o=vr.set(s[4],s[5],s[6]).length(),a=vr.set(s[8],s[9],s[10]).length();this.determinant()<0&&(r=-r),t.x=s[12],t.y=s[13],t.z=s[14],Jn.copy(this);let c=1/r,h=1/o,u=1/a;return Jn.elements[0]*=c,Jn.elements[1]*=c,Jn.elements[2]*=c,Jn.elements[4]*=h,Jn.elements[5]*=h,Jn.elements[6]*=h,Jn.elements[8]*=u,Jn.elements[9]*=u,Jn.elements[10]*=u,e.setFromRotationMatrix(Jn),i.x=r,i.y=o,i.z=a,this}makePerspective(t,e,i,s,r,o,a=Ii){let l=this.elements,c=2*r/(e-t),h=2*r/(i-s),u=(e+t)/(e-t),d=(i+s)/(i-s),f,m;if(a===Ii)f=-(o+r)/(o-r),m=-2*o*r/(o-r);else if(a===nl)f=-o/(o-r),m=-o*r/(o-r);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+a);return l[0]=c,l[4]=0,l[8]=u,l[12]=0,l[1]=0,l[5]=h,l[9]=d,l[13]=0,l[2]=0,l[6]=0,l[10]=f,l[14]=m,l[3]=0,l[7]=0,l[11]=-1,l[15]=0,this}makeOrthographic(t,e,i,s,r,o,a=Ii){let l=this.elements,c=1/(e-t),h=1/(i-s),u=1/(o-r),d=(e+t)*c,f=(i+s)*h,m,_;if(a===Ii)m=(o+r)*u,_=-2*u;else if(a===nl)m=r*u,_=-1*u;else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+a);return l[0]=2*c,l[4]=0,l[8]=0,l[12]=-d,l[1]=0,l[5]=2*h,l[9]=0,l[13]=-f,l[2]=0,l[6]=0,l[10]=_,l[14]=-m,l[3]=0,l[7]=0,l[11]=0,l[15]=1,this}equals(t){let e=this.elements,i=t.elements;for(let s=0;s<16;s++)if(e[s]!==i[s])return!1;return!0}fromArray(t,e=0){for(let i=0;i<16;i++)this.elements[i]=t[i+e];return this}toArray(t=[],e=0){let i=this.elements;return t[e]=i[0],t[e+1]=i[1],t[e+2]=i[2],t[e+3]=i[3],t[e+4]=i[4],t[e+5]=i[5],t[e+6]=i[6],t[e+7]=i[7],t[e+8]=i[8],t[e+9]=i[9],t[e+10]=i[10],t[e+11]=i[11],t[e+12]=i[12],t[e+13]=i[13],t[e+14]=i[14],t[e+15]=i[15],t}},vr=new w,Jn=new be,qg=new w(0,0,0),Zg=new w(1,1,1),Qi=new w,Ra=new w,Cn=new w,Ff=new be,Bf=new ei,pi=class n{constructor(t=0,e=0,i=0,s=n.DEFAULT_ORDER){this.isEuler=!0,this._x=t,this._y=e,this._z=i,this._order=s}get x(){return this._x}set x(t){this._x=t,this._onChangeCallback()}get y(){return this._y}set y(t){this._y=t,this._onChangeCallback()}get z(){return this._z}set z(t){this._z=t,this._onChangeCallback()}get order(){return this._order}set order(t){this._order=t,this._onChangeCallback()}set(t,e,i,s=this._order){return this._x=t,this._y=e,this._z=i,this._order=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(t){return this._x=t._x,this._y=t._y,this._z=t._z,this._order=t._order,this._onChangeCallback(),this}setFromRotationMatrix(t,e=this._order,i=!0){let s=t.elements,r=s[0],o=s[4],a=s[8],l=s[1],c=s[5],h=s[9],u=s[2],d=s[6],f=s[10];switch(e){case"XYZ":this._y=Math.asin(Ke(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(-h,f),this._z=Math.atan2(-o,r)):(this._x=Math.atan2(d,c),this._z=0);break;case"YXZ":this._x=Math.asin(-Ke(h,-1,1)),Math.abs(h)<.9999999?(this._y=Math.atan2(a,f),this._z=Math.atan2(l,c)):(this._y=Math.atan2(-u,r),this._z=0);break;case"ZXY":this._x=Math.asin(Ke(d,-1,1)),Math.abs(d)<.9999999?(this._y=Math.atan2(-u,f),this._z=Math.atan2(-o,c)):(this._y=0,this._z=Math.atan2(l,r));break;case"ZYX":this._y=Math.asin(-Ke(u,-1,1)),Math.abs(u)<.9999999?(this._x=Math.atan2(d,f),this._z=Math.atan2(l,r)):(this._x=0,this._z=Math.atan2(-o,c));break;case"YZX":this._z=Math.asin(Ke(l,-1,1)),Math.abs(l)<.9999999?(this._x=Math.atan2(-h,c),this._y=Math.atan2(-u,r)):(this._x=0,this._y=Math.atan2(a,f));break;case"XZY":this._z=Math.asin(-Ke(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(d,c),this._y=Math.atan2(a,r)):(this._x=Math.atan2(-h,f),this._y=0);break;default:console.warn("THREE.Euler: .setFromRotationMatrix() encountered an unknown order: "+e)}return this._order=e,i===!0&&this._onChangeCallback(),this}setFromQuaternion(t,e,i){return Ff.makeRotationFromQuaternion(t),this.setFromRotationMatrix(Ff,e,i)}setFromVector3(t,e=this._order){return this.set(t.x,t.y,t.z,e)}reorder(t){return Bf.setFromEuler(this),this.setFromQuaternion(Bf,t)}equals(t){return t._x===this._x&&t._y===this._y&&t._z===this._z&&t._order===this._order}fromArray(t){return this._x=t[0],this._y=t[1],this._z=t[2],t[3]!==void 0&&(this._order=t[3]),this._onChangeCallback(),this}toArray(t=[],e=0){return t[e]=this._x,t[e+1]=this._y,t[e+2]=this._z,t[e+3]=this._order,t}_onChange(t){return this._onChangeCallback=t,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}};pi.DEFAULT_ORDER="XYZ";var Io=class{constructor(){this.mask=1}set(t){this.mask=(1<<t|0)>>>0}enable(t){this.mask|=1<<t|0}enableAll(){this.mask=-1}toggle(t){this.mask^=1<<t|0}disable(t){this.mask&=~(1<<t|0)}disableAll(){this.mask=0}test(t){return(this.mask&t.mask)!==0}isEnabled(t){return(this.mask&(1<<t|0))!==0}},Kg=0,zf=new w,yr=new ei,Ai=new be,Ca=new w,po=new w,$g=new w,Jg=new ei,kf=new w(1,0,0),Hf=new w(0,1,0),Vf=new w(0,0,1),Gf={type:"added"},jg={type:"removed"},Mr={type:"childadded",child:null},$c={type:"childremoved",child:null},$e=class n extends Ui{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:Kg++}),this.uuid=js(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=n.DEFAULT_UP.clone();let t=new w,e=new pi,i=new ei,s=new w(1,1,1);function r(){i.setFromEuler(e,!1)}function o(){e.setFromQuaternion(i,void 0,!1)}e._onChange(r),i._onChange(o),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:t},rotation:{configurable:!0,enumerable:!0,value:e},quaternion:{configurable:!0,enumerable:!0,value:i},scale:{configurable:!0,enumerable:!0,value:s},modelViewMatrix:{value:new be},normalMatrix:{value:new jt}}),this.matrix=new be,this.matrixWorld=new be,this.matrixAutoUpdate=n.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=n.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new Io,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.userData={}}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(t){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(t),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(t){return this.quaternion.premultiply(t),this}setRotationFromAxisAngle(t,e){this.quaternion.setFromAxisAngle(t,e)}setRotationFromEuler(t){this.quaternion.setFromEuler(t,!0)}setRotationFromMatrix(t){this.quaternion.setFromRotationMatrix(t)}setRotationFromQuaternion(t){this.quaternion.copy(t)}rotateOnAxis(t,e){return yr.setFromAxisAngle(t,e),this.quaternion.multiply(yr),this}rotateOnWorldAxis(t,e){return yr.setFromAxisAngle(t,e),this.quaternion.premultiply(yr),this}rotateX(t){return this.rotateOnAxis(kf,t)}rotateY(t){return this.rotateOnAxis(Hf,t)}rotateZ(t){return this.rotateOnAxis(Vf,t)}translateOnAxis(t,e){return zf.copy(t).applyQuaternion(this.quaternion),this.position.add(zf.multiplyScalar(e)),this}translateX(t){return this.translateOnAxis(kf,t)}translateY(t){return this.translateOnAxis(Hf,t)}translateZ(t){return this.translateOnAxis(Vf,t)}localToWorld(t){return this.updateWorldMatrix(!0,!1),t.applyMatrix4(this.matrixWorld)}worldToLocal(t){return this.updateWorldMatrix(!0,!1),t.applyMatrix4(Ai.copy(this.matrixWorld).invert())}lookAt(t,e,i){t.isVector3?Ca.copy(t):Ca.set(t,e,i);let s=this.parent;this.updateWorldMatrix(!0,!1),po.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?Ai.lookAt(po,Ca,this.up):Ai.lookAt(Ca,po,this.up),this.quaternion.setFromRotationMatrix(Ai),s&&(Ai.extractRotation(s.matrixWorld),yr.setFromRotationMatrix(Ai),this.quaternion.premultiply(yr.invert()))}add(t){if(arguments.length>1){for(let e=0;e<arguments.length;e++)this.add(arguments[e]);return this}return t===this?(console.error("THREE.Object3D.add: object can't be added as a child of itself.",t),this):(t&&t.isObject3D?(t.removeFromParent(),t.parent=this,this.children.push(t),t.dispatchEvent(Gf),Mr.child=t,this.dispatchEvent(Mr),Mr.child=null):console.error("THREE.Object3D.add: object not an instance of THREE.Object3D.",t),this)}remove(t){if(arguments.length>1){for(let i=0;i<arguments.length;i++)this.remove(arguments[i]);return this}let e=this.children.indexOf(t);return e!==-1&&(t.parent=null,this.children.splice(e,1),t.dispatchEvent(jg),$c.child=t,this.dispatchEvent($c),$c.child=null),this}removeFromParent(){let t=this.parent;return t!==null&&t.remove(this),this}clear(){return this.remove(...this.children)}attach(t){return this.updateWorldMatrix(!0,!1),Ai.copy(this.matrixWorld).invert(),t.parent!==null&&(t.parent.updateWorldMatrix(!0,!1),Ai.multiply(t.parent.matrixWorld)),t.applyMatrix4(Ai),t.removeFromParent(),t.parent=this,this.children.push(t),t.updateWorldMatrix(!1,!0),t.dispatchEvent(Gf),Mr.child=t,this.dispatchEvent(Mr),Mr.child=null,this}getObjectById(t){return this.getObjectByProperty("id",t)}getObjectByName(t){return this.getObjectByProperty("name",t)}getObjectByProperty(t,e){if(this[t]===e)return this;for(let i=0,s=this.children.length;i<s;i++){let o=this.children[i].getObjectByProperty(t,e);if(o!==void 0)return o}}getObjectsByProperty(t,e,i=[]){this[t]===e&&i.push(this);let s=this.children;for(let r=0,o=s.length;r<o;r++)s[r].getObjectsByProperty(t,e,i);return i}getWorldPosition(t){return this.updateWorldMatrix(!0,!1),t.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(t){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(po,t,$g),t}getWorldScale(t){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(po,Jg,t),t}getWorldDirection(t){this.updateWorldMatrix(!0,!1);let e=this.matrixWorld.elements;return t.set(e[8],e[9],e[10]).normalize()}raycast(){}traverse(t){t(this);let e=this.children;for(let i=0,s=e.length;i<s;i++)e[i].traverse(t)}traverseVisible(t){if(this.visible===!1)return;t(this);let e=this.children;for(let i=0,s=e.length;i<s;i++)e[i].traverseVisible(t)}traverseAncestors(t){let e=this.parent;e!==null&&(t(e),e.traverseAncestors(t))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale),this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(t){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||t)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,t=!0);let e=this.children;for(let i=0,s=e.length;i<s;i++)e[i].updateMatrixWorld(t)}updateWorldMatrix(t,e){let i=this.parent;if(t===!0&&i!==null&&i.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),e===!0){let s=this.children;for(let r=0,o=s.length;r<o;r++)s[r].updateWorldMatrix(!1,!0)}}toJSON(t){let e=t===void 0||typeof t=="string",i={};e&&(t={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},i.metadata={version:4.6,type:"Object",generator:"Object3D.toJSON"});let s={};s.uuid=this.uuid,s.type=this.type,this.name!==""&&(s.name=this.name),this.castShadow===!0&&(s.castShadow=!0),this.receiveShadow===!0&&(s.receiveShadow=!0),this.visible===!1&&(s.visible=!1),this.frustumCulled===!1&&(s.frustumCulled=!1),this.renderOrder!==0&&(s.renderOrder=this.renderOrder),Object.keys(this.userData).length>0&&(s.userData=this.userData),s.layers=this.layers.mask,s.matrix=this.matrix.toArray(),s.up=this.up.toArray(),this.matrixAutoUpdate===!1&&(s.matrixAutoUpdate=!1),this.isInstancedMesh&&(s.type="InstancedMesh",s.count=this.count,s.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(s.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(s.type="BatchedMesh",s.perObjectFrustumCulled=this.perObjectFrustumCulled,s.sortObjects=this.sortObjects,s.drawRanges=this._drawRanges,s.reservedRanges=this._reservedRanges,s.visibility=this._visibility,s.active=this._active,s.bounds=this._bounds.map(a=>({boxInitialized:a.boxInitialized,boxMin:a.box.min.toArray(),boxMax:a.box.max.toArray(),sphereInitialized:a.sphereInitialized,sphereRadius:a.sphere.radius,sphereCenter:a.sphere.center.toArray()})),s.maxInstanceCount=this._maxInstanceCount,s.maxVertexCount=this._maxVertexCount,s.maxIndexCount=this._maxIndexCount,s.geometryInitialized=this._geometryInitialized,s.geometryCount=this._geometryCount,s.matricesTexture=this._matricesTexture.toJSON(t),this._colorsTexture!==null&&(s.colorsTexture=this._colorsTexture.toJSON(t)),this.boundingSphere!==null&&(s.boundingSphere={center:s.boundingSphere.center.toArray(),radius:s.boundingSphere.radius}),this.boundingBox!==null&&(s.boundingBox={min:s.boundingBox.min.toArray(),max:s.boundingBox.max.toArray()}));function r(a,l){return a[l.uuid]===void 0&&(a[l.uuid]=l.toJSON(t)),l.uuid}if(this.isScene)this.background&&(this.background.isColor?s.background=this.background.toJSON():this.background.isTexture&&(s.background=this.background.toJSON(t).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(s.environment=this.environment.toJSON(t).uuid);else if(this.isMesh||this.isLine||this.isPoints){s.geometry=r(t.geometries,this.geometry);let a=this.geometry.parameters;if(a!==void 0&&a.shapes!==void 0){let l=a.shapes;if(Array.isArray(l))for(let c=0,h=l.length;c<h;c++){let u=l[c];r(t.shapes,u)}else r(t.shapes,l)}}if(this.isSkinnedMesh&&(s.bindMode=this.bindMode,s.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(r(t.skeletons,this.skeleton),s.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){let a=[];for(let l=0,c=this.material.length;l<c;l++)a.push(r(t.materials,this.material[l]));s.material=a}else s.material=r(t.materials,this.material);if(this.children.length>0){s.children=[];for(let a=0;a<this.children.length;a++)s.children.push(this.children[a].toJSON(t).object)}if(this.animations.length>0){s.animations=[];for(let a=0;a<this.animations.length;a++){let l=this.animations[a];s.animations.push(r(t.animations,l))}}if(e){let a=o(t.geometries),l=o(t.materials),c=o(t.textures),h=o(t.images),u=o(t.shapes),d=o(t.skeletons),f=o(t.animations),m=o(t.nodes);a.length>0&&(i.geometries=a),l.length>0&&(i.materials=l),c.length>0&&(i.textures=c),h.length>0&&(i.images=h),u.length>0&&(i.shapes=u),d.length>0&&(i.skeletons=d),f.length>0&&(i.animations=f),m.length>0&&(i.nodes=m)}return i.object=s,i;function o(a){let l=[];for(let c in a){let h=a[c];delete h.metadata,l.push(h)}return l}}clone(t){return new this.constructor().copy(this,t)}copy(t,e=!0){if(this.name=t.name,this.up.copy(t.up),this.position.copy(t.position),this.rotation.order=t.rotation.order,this.quaternion.copy(t.quaternion),this.scale.copy(t.scale),this.matrix.copy(t.matrix),this.matrixWorld.copy(t.matrixWorld),this.matrixAutoUpdate=t.matrixAutoUpdate,this.matrixWorldAutoUpdate=t.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=t.matrixWorldNeedsUpdate,this.layers.mask=t.layers.mask,this.visible=t.visible,this.castShadow=t.castShadow,this.receiveShadow=t.receiveShadow,this.frustumCulled=t.frustumCulled,this.renderOrder=t.renderOrder,this.animations=t.animations.slice(),this.userData=JSON.parse(JSON.stringify(t.userData)),e===!0)for(let i=0;i<t.children.length;i++){let s=t.children[i];this.add(s.clone())}return this}};$e.DEFAULT_UP=new w(0,1,0);$e.DEFAULT_MATRIX_AUTO_UPDATE=!0;$e.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;var jn=new w,Ri=new w,Jc=new w,Ci=new w,Er=new w,br=new w,Wf=new w,jc=new w,Qc=new w,th=new w,eh=new Ee,nh=new Ee,ih=new Ee,Bs=class n{constructor(t=new w,e=new w,i=new w){this.a=t,this.b=e,this.c=i}static getNormal(t,e,i,s){s.subVectors(i,e),jn.subVectors(t,e),s.cross(jn);let r=s.lengthSq();return r>0?s.multiplyScalar(1/Math.sqrt(r)):s.set(0,0,0)}static getBarycoord(t,e,i,s,r){jn.subVectors(s,e),Ri.subVectors(i,e),Jc.subVectors(t,e);let o=jn.dot(jn),a=jn.dot(Ri),l=jn.dot(Jc),c=Ri.dot(Ri),h=Ri.dot(Jc),u=o*c-a*a;if(u===0)return r.set(0,0,0),null;let d=1/u,f=(c*l-a*h)*d,m=(o*h-a*l)*d;return r.set(1-f-m,m,f)}static containsPoint(t,e,i,s){return this.getBarycoord(t,e,i,s,Ci)===null?!1:Ci.x>=0&&Ci.y>=0&&Ci.x+Ci.y<=1}static getInterpolation(t,e,i,s,r,o,a,l){return this.getBarycoord(t,e,i,s,Ci)===null?(l.x=0,l.y=0,"z"in l&&(l.z=0),"w"in l&&(l.w=0),null):(l.setScalar(0),l.addScaledVector(r,Ci.x),l.addScaledVector(o,Ci.y),l.addScaledVector(a,Ci.z),l)}static getInterpolatedAttribute(t,e,i,s,r,o){return eh.setScalar(0),nh.setScalar(0),ih.setScalar(0),eh.fromBufferAttribute(t,e),nh.fromBufferAttribute(t,i),ih.fromBufferAttribute(t,s),o.setScalar(0),o.addScaledVector(eh,r.x),o.addScaledVector(nh,r.y),o.addScaledVector(ih,r.z),o}static isFrontFacing(t,e,i,s){return jn.subVectors(i,e),Ri.subVectors(t,e),jn.cross(Ri).dot(s)<0}set(t,e,i){return this.a.copy(t),this.b.copy(e),this.c.copy(i),this}setFromPointsAndIndices(t,e,i,s){return this.a.copy(t[e]),this.b.copy(t[i]),this.c.copy(t[s]),this}setFromAttributeAndIndices(t,e,i,s){return this.a.fromBufferAttribute(t,e),this.b.fromBufferAttribute(t,i),this.c.fromBufferAttribute(t,s),this}clone(){return new this.constructor().copy(this)}copy(t){return this.a.copy(t.a),this.b.copy(t.b),this.c.copy(t.c),this}getArea(){return jn.subVectors(this.c,this.b),Ri.subVectors(this.a,this.b),jn.cross(Ri).length()*.5}getMidpoint(t){return t.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(t){return n.getNormal(this.a,this.b,this.c,t)}getPlane(t){return t.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(t,e){return n.getBarycoord(t,this.a,this.b,this.c,e)}getInterpolation(t,e,i,s,r){return n.getInterpolation(t,this.a,this.b,this.c,e,i,s,r)}containsPoint(t){return n.containsPoint(t,this.a,this.b,this.c)}isFrontFacing(t){return n.isFrontFacing(this.a,this.b,this.c,t)}intersectsBox(t){return t.intersectsTriangle(this)}closestPointToPoint(t,e){let i=this.a,s=this.b,r=this.c,o,a;Er.subVectors(s,i),br.subVectors(r,i),jc.subVectors(t,i);let l=Er.dot(jc),c=br.dot(jc);if(l<=0&&c<=0)return e.copy(i);Qc.subVectors(t,s);let h=Er.dot(Qc),u=br.dot(Qc);if(h>=0&&u<=h)return e.copy(s);let d=l*u-h*c;if(d<=0&&l>=0&&h<=0)return o=l/(l-h),e.copy(i).addScaledVector(Er,o);th.subVectors(t,r);let f=Er.dot(th),m=br.dot(th);if(m>=0&&f<=m)return e.copy(r);let _=f*c-l*m;if(_<=0&&c>=0&&m<=0)return a=c/(c-m),e.copy(i).addScaledVector(br,a);let g=h*m-f*u;if(g<=0&&u-h>=0&&f-m>=0)return Wf.subVectors(r,s),a=(u-h)/(u-h+(f-m)),e.copy(s).addScaledVector(Wf,a);let p=1/(g+_+d);return o=_*p,a=d*p,e.copy(i).addScaledVector(Er,o).addScaledVector(br,a)}equals(t){return t.a.equals(this.a)&&t.b.equals(this.b)&&t.c.equals(this.c)}},$p={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},ts={h:0,s:0,l:0},Pa={h:0,s:0,l:0};function sh(n,t,e){return e<0&&(e+=1),e>1&&(e-=1),e<1/6?n+(t-n)*6*e:e<1/2?t:e<2/3?n+(t-n)*6*(2/3-e):n}var Yt=class{constructor(t,e,i){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(t,e,i)}set(t,e,i){if(e===void 0&&i===void 0){let s=t;s&&s.isColor?this.copy(s):typeof s=="number"?this.setHex(s):typeof s=="string"&&this.setStyle(s)}else this.setRGB(t,e,i);return this}setScalar(t){return this.r=t,this.g=t,this.b=t,this}setHex(t,e=Ve){return t=Math.floor(t),this.r=(t>>16&255)/255,this.g=(t>>8&255)/255,this.b=(t&255)/255,oe.toWorkingColorSpace(this,e),this}setRGB(t,e,i,s=oe.workingColorSpace){return this.r=t,this.g=e,this.b=i,oe.toWorkingColorSpace(this,s),this}setHSL(t,e,i,s=oe.workingColorSpace){if(t=ju(t,1),e=Ke(e,0,1),i=Ke(i,0,1),e===0)this.r=this.g=this.b=i;else{let r=i<=.5?i*(1+e):i+e-i*e,o=2*i-r;this.r=sh(o,r,t+1/3),this.g=sh(o,r,t),this.b=sh(o,r,t-1/3)}return oe.toWorkingColorSpace(this,s),this}setStyle(t,e=Ve){function i(r){r!==void 0&&parseFloat(r)<1&&console.warn("THREE.Color: Alpha component of "+t+" will be ignored.")}let s;if(s=/^(\w+)\(([^\)]*)\)/.exec(t)){let r,o=s[1],a=s[2];switch(o){case"rgb":case"rgba":if(r=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return i(r[4]),this.setRGB(Math.min(255,parseInt(r[1],10))/255,Math.min(255,parseInt(r[2],10))/255,Math.min(255,parseInt(r[3],10))/255,e);if(r=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return i(r[4]),this.setRGB(Math.min(100,parseInt(r[1],10))/100,Math.min(100,parseInt(r[2],10))/100,Math.min(100,parseInt(r[3],10))/100,e);break;case"hsl":case"hsla":if(r=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return i(r[4]),this.setHSL(parseFloat(r[1])/360,parseFloat(r[2])/100,parseFloat(r[3])/100,e);break;default:console.warn("THREE.Color: Unknown color model "+t)}}else if(s=/^\#([A-Fa-f\d]+)$/.exec(t)){let r=s[1],o=r.length;if(o===3)return this.setRGB(parseInt(r.charAt(0),16)/15,parseInt(r.charAt(1),16)/15,parseInt(r.charAt(2),16)/15,e);if(o===6)return this.setHex(parseInt(r,16),e);console.warn("THREE.Color: Invalid hex color "+t)}else if(t&&t.length>0)return this.setColorName(t,e);return this}setColorName(t,e=Ve){let i=$p[t.toLowerCase()];return i!==void 0?this.setHex(i,e):console.warn("THREE.Color: Unknown color "+t),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(t){return this.r=t.r,this.g=t.g,this.b=t.b,this}copySRGBToLinear(t){return this.r=Di(t.r),this.g=Di(t.g),this.b=Di(t.b),this}copyLinearToSRGB(t){return this.r=Ur(t.r),this.g=Ur(t.g),this.b=Ur(t.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(t=Ve){return oe.fromWorkingColorSpace(on.copy(this),t),Math.round(Ke(on.r*255,0,255))*65536+Math.round(Ke(on.g*255,0,255))*256+Math.round(Ke(on.b*255,0,255))}getHexString(t=Ve){return("000000"+this.getHex(t).toString(16)).slice(-6)}getHSL(t,e=oe.workingColorSpace){oe.fromWorkingColorSpace(on.copy(this),e);let i=on.r,s=on.g,r=on.b,o=Math.max(i,s,r),a=Math.min(i,s,r),l,c,h=(a+o)/2;if(a===o)l=0,c=0;else{let u=o-a;switch(c=h<=.5?u/(o+a):u/(2-o-a),o){case i:l=(s-r)/u+(s<r?6:0);break;case s:l=(r-i)/u+2;break;case r:l=(i-s)/u+4;break}l/=6}return t.h=l,t.s=c,t.l=h,t}getRGB(t,e=oe.workingColorSpace){return oe.fromWorkingColorSpace(on.copy(this),e),t.r=on.r,t.g=on.g,t.b=on.b,t}getStyle(t=Ve){oe.fromWorkingColorSpace(on.copy(this),t);let e=on.r,i=on.g,s=on.b;return t!==Ve?`color(${t} ${e.toFixed(3)} ${i.toFixed(3)} ${s.toFixed(3)})`:`rgb(${Math.round(e*255)},${Math.round(i*255)},${Math.round(s*255)})`}offsetHSL(t,e,i){return this.getHSL(ts),this.setHSL(ts.h+t,ts.s+e,ts.l+i)}add(t){return this.r+=t.r,this.g+=t.g,this.b+=t.b,this}addColors(t,e){return this.r=t.r+e.r,this.g=t.g+e.g,this.b=t.b+e.b,this}addScalar(t){return this.r+=t,this.g+=t,this.b+=t,this}sub(t){return this.r=Math.max(0,this.r-t.r),this.g=Math.max(0,this.g-t.g),this.b=Math.max(0,this.b-t.b),this}multiply(t){return this.r*=t.r,this.g*=t.g,this.b*=t.b,this}multiplyScalar(t){return this.r*=t,this.g*=t,this.b*=t,this}lerp(t,e){return this.r+=(t.r-this.r)*e,this.g+=(t.g-this.g)*e,this.b+=(t.b-this.b)*e,this}lerpColors(t,e,i){return this.r=t.r+(e.r-t.r)*i,this.g=t.g+(e.g-t.g)*i,this.b=t.b+(e.b-t.b)*i,this}lerpHSL(t,e){this.getHSL(ts),t.getHSL(Pa);let i=bo(ts.h,Pa.h,e),s=bo(ts.s,Pa.s,e),r=bo(ts.l,Pa.l,e);return this.setHSL(i,s,r),this}setFromVector3(t){return this.r=t.x,this.g=t.y,this.b=t.z,this}applyMatrix3(t){let e=this.r,i=this.g,s=this.b,r=t.elements;return this.r=r[0]*e+r[3]*i+r[6]*s,this.g=r[1]*e+r[4]*i+r[7]*s,this.b=r[2]*e+r[5]*i+r[8]*s,this}equals(t){return t.r===this.r&&t.g===this.g&&t.b===this.b}fromArray(t,e=0){return this.r=t[e],this.g=t[e+1],this.b=t[e+2],this}toArray(t=[],e=0){return t[e]=this.r,t[e+1]=this.g,t[e+2]=this.b,t}fromBufferAttribute(t,e){return this.r=t.getX(e),this.g=t.getY(e),this.b=t.getZ(e),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}},on=new Yt;Yt.NAMES=$p;var Qg=0,as=class extends Ui{static get type(){return"Material"}get type(){return this.constructor.type}set type(t){}constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:Qg++}),this.uuid=js(),this.name="",this.blending=Dr,this.side=rs,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=yh,this.blendDst=Mh,this.blendEquation=Fs,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new Yt(0,0,0),this.blendAlpha=0,this.depthFunc=Or,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=wf,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=pr,this.stencilZFail=pr,this.stencilZPass=pr,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(t){this._alphaTest>0!=t>0&&this.version++,this._alphaTest=t}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(t){if(t!==void 0)for(let e in t){let i=t[e];if(i===void 0){console.warn(`THREE.Material: parameter '${e}' has value of undefined.`);continue}let s=this[e];if(s===void 0){console.warn(`THREE.Material: '${e}' is not a property of THREE.${this.type}.`);continue}s&&s.isColor?s.set(i):s&&s.isVector3&&i&&i.isVector3?s.copy(i):this[e]=i}}toJSON(t){let e=t===void 0||typeof t=="string";e&&(t={textures:{},images:{}});let i={metadata:{version:4.6,type:"Material",generator:"Material.toJSON"}};i.uuid=this.uuid,i.type=this.type,this.name!==""&&(i.name=this.name),this.color&&this.color.isColor&&(i.color=this.color.getHex()),this.roughness!==void 0&&(i.roughness=this.roughness),this.metalness!==void 0&&(i.metalness=this.metalness),this.sheen!==void 0&&(i.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(i.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(i.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(i.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&this.emissiveIntensity!==1&&(i.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(i.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(i.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(i.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(i.shininess=this.shininess),this.clearcoat!==void 0&&(i.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(i.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(i.clearcoatMap=this.clearcoatMap.toJSON(t).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(i.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(t).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(i.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(t).uuid,i.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.dispersion!==void 0&&(i.dispersion=this.dispersion),this.iridescence!==void 0&&(i.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(i.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(i.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(i.iridescenceMap=this.iridescenceMap.toJSON(t).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(i.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(t).uuid),this.anisotropy!==void 0&&(i.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(i.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(i.anisotropyMap=this.anisotropyMap.toJSON(t).uuid),this.map&&this.map.isTexture&&(i.map=this.map.toJSON(t).uuid),this.matcap&&this.matcap.isTexture&&(i.matcap=this.matcap.toJSON(t).uuid),this.alphaMap&&this.alphaMap.isTexture&&(i.alphaMap=this.alphaMap.toJSON(t).uuid),this.lightMap&&this.lightMap.isTexture&&(i.lightMap=this.lightMap.toJSON(t).uuid,i.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(i.aoMap=this.aoMap.toJSON(t).uuid,i.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(i.bumpMap=this.bumpMap.toJSON(t).uuid,i.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(i.normalMap=this.normalMap.toJSON(t).uuid,i.normalMapType=this.normalMapType,i.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(i.displacementMap=this.displacementMap.toJSON(t).uuid,i.displacementScale=this.displacementScale,i.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(i.roughnessMap=this.roughnessMap.toJSON(t).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(i.metalnessMap=this.metalnessMap.toJSON(t).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(i.emissiveMap=this.emissiveMap.toJSON(t).uuid),this.specularMap&&this.specularMap.isTexture&&(i.specularMap=this.specularMap.toJSON(t).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(i.specularIntensityMap=this.specularIntensityMap.toJSON(t).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(i.specularColorMap=this.specularColorMap.toJSON(t).uuid),this.envMap&&this.envMap.isTexture&&(i.envMap=this.envMap.toJSON(t).uuid,this.combine!==void 0&&(i.combine=this.combine)),this.envMapRotation!==void 0&&(i.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(i.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(i.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(i.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(i.gradientMap=this.gradientMap.toJSON(t).uuid),this.transmission!==void 0&&(i.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(i.transmissionMap=this.transmissionMap.toJSON(t).uuid),this.thickness!==void 0&&(i.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(i.thicknessMap=this.thicknessMap.toJSON(t).uuid),this.attenuationDistance!==void 0&&this.attenuationDistance!==1/0&&(i.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(i.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(i.size=this.size),this.shadowSide!==null&&(i.shadowSide=this.shadowSide),this.sizeAttenuation!==void 0&&(i.sizeAttenuation=this.sizeAttenuation),this.blending!==Dr&&(i.blending=this.blending),this.side!==rs&&(i.side=this.side),this.vertexColors===!0&&(i.vertexColors=!0),this.opacity<1&&(i.opacity=this.opacity),this.transparent===!0&&(i.transparent=!0),this.blendSrc!==yh&&(i.blendSrc=this.blendSrc),this.blendDst!==Mh&&(i.blendDst=this.blendDst),this.blendEquation!==Fs&&(i.blendEquation=this.blendEquation),this.blendSrcAlpha!==null&&(i.blendSrcAlpha=this.blendSrcAlpha),this.blendDstAlpha!==null&&(i.blendDstAlpha=this.blendDstAlpha),this.blendEquationAlpha!==null&&(i.blendEquationAlpha=this.blendEquationAlpha),this.blendColor&&this.blendColor.isColor&&(i.blendColor=this.blendColor.getHex()),this.blendAlpha!==0&&(i.blendAlpha=this.blendAlpha),this.depthFunc!==Or&&(i.depthFunc=this.depthFunc),this.depthTest===!1&&(i.depthTest=this.depthTest),this.depthWrite===!1&&(i.depthWrite=this.depthWrite),this.colorWrite===!1&&(i.colorWrite=this.colorWrite),this.stencilWriteMask!==255&&(i.stencilWriteMask=this.stencilWriteMask),this.stencilFunc!==wf&&(i.stencilFunc=this.stencilFunc),this.stencilRef!==0&&(i.stencilRef=this.stencilRef),this.stencilFuncMask!==255&&(i.stencilFuncMask=this.stencilFuncMask),this.stencilFail!==pr&&(i.stencilFail=this.stencilFail),this.stencilZFail!==pr&&(i.stencilZFail=this.stencilZFail),this.stencilZPass!==pr&&(i.stencilZPass=this.stencilZPass),this.stencilWrite===!0&&(i.stencilWrite=this.stencilWrite),this.rotation!==void 0&&this.rotation!==0&&(i.rotation=this.rotation),this.polygonOffset===!0&&(i.polygonOffset=!0),this.polygonOffsetFactor!==0&&(i.polygonOffsetFactor=this.polygonOffsetFactor),this.polygonOffsetUnits!==0&&(i.polygonOffsetUnits=this.polygonOffsetUnits),this.linewidth!==void 0&&this.linewidth!==1&&(i.linewidth=this.linewidth),this.dashSize!==void 0&&(i.dashSize=this.dashSize),this.gapSize!==void 0&&(i.gapSize=this.gapSize),this.scale!==void 0&&(i.scale=this.scale),this.dithering===!0&&(i.dithering=!0),this.alphaTest>0&&(i.alphaTest=this.alphaTest),this.alphaHash===!0&&(i.alphaHash=!0),this.alphaToCoverage===!0&&(i.alphaToCoverage=!0),this.premultipliedAlpha===!0&&(i.premultipliedAlpha=!0),this.forceSinglePass===!0&&(i.forceSinglePass=!0),this.wireframe===!0&&(i.wireframe=!0),this.wireframeLinewidth>1&&(i.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!=="round"&&(i.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!=="round"&&(i.wireframeLinejoin=this.wireframeLinejoin),this.flatShading===!0&&(i.flatShading=!0),this.visible===!1&&(i.visible=!1),this.toneMapped===!1&&(i.toneMapped=!1),this.fog===!1&&(i.fog=!1),Object.keys(this.userData).length>0&&(i.userData=this.userData);function s(r){let o=[];for(let a in r){let l=r[a];delete l.metadata,o.push(l)}return o}if(e){let r=s(t.textures),o=s(t.images);r.length>0&&(i.textures=r),o.length>0&&(i.images=o)}return i}clone(){return new this.constructor().copy(this)}copy(t){this.name=t.name,this.blending=t.blending,this.side=t.side,this.vertexColors=t.vertexColors,this.opacity=t.opacity,this.transparent=t.transparent,this.blendSrc=t.blendSrc,this.blendDst=t.blendDst,this.blendEquation=t.blendEquation,this.blendSrcAlpha=t.blendSrcAlpha,this.blendDstAlpha=t.blendDstAlpha,this.blendEquationAlpha=t.blendEquationAlpha,this.blendColor.copy(t.blendColor),this.blendAlpha=t.blendAlpha,this.depthFunc=t.depthFunc,this.depthTest=t.depthTest,this.depthWrite=t.depthWrite,this.stencilWriteMask=t.stencilWriteMask,this.stencilFunc=t.stencilFunc,this.stencilRef=t.stencilRef,this.stencilFuncMask=t.stencilFuncMask,this.stencilFail=t.stencilFail,this.stencilZFail=t.stencilZFail,this.stencilZPass=t.stencilZPass,this.stencilWrite=t.stencilWrite;let e=t.clippingPlanes,i=null;if(e!==null){let s=e.length;i=new Array(s);for(let r=0;r!==s;++r)i[r]=e[r].clone()}return this.clippingPlanes=i,this.clipIntersection=t.clipIntersection,this.clipShadows=t.clipShadows,this.shadowSide=t.shadowSide,this.colorWrite=t.colorWrite,this.precision=t.precision,this.polygonOffset=t.polygonOffset,this.polygonOffsetFactor=t.polygonOffsetFactor,this.polygonOffsetUnits=t.polygonOffsetUnits,this.dithering=t.dithering,this.alphaTest=t.alphaTest,this.alphaHash=t.alphaHash,this.alphaToCoverage=t.alphaToCoverage,this.premultipliedAlpha=t.premultipliedAlpha,this.forceSinglePass=t.forceSinglePass,this.visible=t.visible,this.toneMapped=t.toneMapped,this.userData=JSON.parse(JSON.stringify(t.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(t){t===!0&&this.version++}onBuild(){console.warn("Material: onBuild() has been removed.")}},Je=class extends as{static get type(){return"MeshBasicMaterial"}constructor(t){super(),this.isMeshBasicMaterial=!0,this.color=new Yt(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new pi,this.combine=Op,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.lightMap=t.lightMap,this.lightMapIntensity=t.lightMapIntensity,this.aoMap=t.aoMap,this.aoMapIntensity=t.aoMapIntensity,this.specularMap=t.specularMap,this.alphaMap=t.alphaMap,this.envMap=t.envMap,this.envMapRotation.copy(t.envMapRotation),this.combine=t.combine,this.reflectivity=t.reflectivity,this.refractionRatio=t.refractionRatio,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.wireframeLinecap=t.wireframeLinecap,this.wireframeLinejoin=t.wireframeLinejoin,this.fog=t.fog,this}};var He=new w,Ia=new nt,en=class{constructor(t,e,i=!1){if(Array.isArray(t))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,this.name="",this.array=t,this.itemSize=e,this.count=t!==void 0?t.length/e:0,this.normalized=i,this.usage=Af,this.updateRanges=[],this.gpuType=fi,this.version=0}onUploadCallback(){}set needsUpdate(t){t===!0&&this.version++}setUsage(t){return this.usage=t,this}addUpdateRange(t,e){this.updateRanges.push({start:t,count:e})}clearUpdateRanges(){this.updateRanges.length=0}copy(t){return this.name=t.name,this.array=new t.array.constructor(t.array),this.itemSize=t.itemSize,this.count=t.count,this.normalized=t.normalized,this.usage=t.usage,this.gpuType=t.gpuType,this}copyAt(t,e,i){t*=this.itemSize,i*=e.itemSize;for(let s=0,r=this.itemSize;s<r;s++)this.array[t+s]=e.array[i+s];return this}copyArray(t){return this.array.set(t),this}applyMatrix3(t){if(this.itemSize===2)for(let e=0,i=this.count;e<i;e++)Ia.fromBufferAttribute(this,e),Ia.applyMatrix3(t),this.setXY(e,Ia.x,Ia.y);else if(this.itemSize===3)for(let e=0,i=this.count;e<i;e++)He.fromBufferAttribute(this,e),He.applyMatrix3(t),this.setXYZ(e,He.x,He.y,He.z);return this}applyMatrix4(t){for(let e=0,i=this.count;e<i;e++)He.fromBufferAttribute(this,e),He.applyMatrix4(t),this.setXYZ(e,He.x,He.y,He.z);return this}applyNormalMatrix(t){for(let e=0,i=this.count;e<i;e++)He.fromBufferAttribute(this,e),He.applyNormalMatrix(t),this.setXYZ(e,He.x,He.y,He.z);return this}transformDirection(t){for(let e=0,i=this.count;e<i;e++)He.fromBufferAttribute(this,e),He.transformDirection(t),this.setXYZ(e,He.x,He.y,He.z);return this}set(t,e=0){return this.array.set(t,e),this}getComponent(t,e){let i=this.array[t*this.itemSize+e];return this.normalized&&(i=Cr(i,this.array)),i}setComponent(t,e,i){return this.normalized&&(i=mn(i,this.array)),this.array[t*this.itemSize+e]=i,this}getX(t){let e=this.array[t*this.itemSize];return this.normalized&&(e=Cr(e,this.array)),e}setX(t,e){return this.normalized&&(e=mn(e,this.array)),this.array[t*this.itemSize]=e,this}getY(t){let e=this.array[t*this.itemSize+1];return this.normalized&&(e=Cr(e,this.array)),e}setY(t,e){return this.normalized&&(e=mn(e,this.array)),this.array[t*this.itemSize+1]=e,this}getZ(t){let e=this.array[t*this.itemSize+2];return this.normalized&&(e=Cr(e,this.array)),e}setZ(t,e){return this.normalized&&(e=mn(e,this.array)),this.array[t*this.itemSize+2]=e,this}getW(t){let e=this.array[t*this.itemSize+3];return this.normalized&&(e=Cr(e,this.array)),e}setW(t,e){return this.normalized&&(e=mn(e,this.array)),this.array[t*this.itemSize+3]=e,this}setXY(t,e,i){return t*=this.itemSize,this.normalized&&(e=mn(e,this.array),i=mn(i,this.array)),this.array[t+0]=e,this.array[t+1]=i,this}setXYZ(t,e,i,s){return t*=this.itemSize,this.normalized&&(e=mn(e,this.array),i=mn(i,this.array),s=mn(s,this.array)),this.array[t+0]=e,this.array[t+1]=i,this.array[t+2]=s,this}setXYZW(t,e,i,s,r){return t*=this.itemSize,this.normalized&&(e=mn(e,this.array),i=mn(i,this.array),s=mn(s,this.array),r=mn(r,this.array)),this.array[t+0]=e,this.array[t+1]=i,this.array[t+2]=s,this.array[t+3]=r,this}onUpload(t){return this.onUploadCallback=t,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){let t={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return this.name!==""&&(t.name=this.name),this.usage!==Af&&(t.usage=this.usage),t}};var rl=class extends en{constructor(t,e,i){super(new Uint16Array(t),e,i)}};var ol=class extends en{constructor(t,e,i){super(new Uint32Array(t),e,i)}};var le=class extends en{constructor(t,e,i){super(new Float32Array(t),e,i)}},t_=0,Vn=new be,rh=new $e,Sr=new w,Pn=new Wn,mo=new Wn,Ze=new w,Fe=class n extends Ui{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:t_++}),this.uuid=js(),this.name="",this.type="BufferGeometry",this.index=null,this.indirect=null,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={}}getIndex(){return this.index}setIndex(t){return Array.isArray(t)?this.index=new(Kp(t)?ol:rl)(t,1):this.index=t,this}setIndirect(t){return this.indirect=t,this}getIndirect(){return this.indirect}getAttribute(t){return this.attributes[t]}setAttribute(t,e){return this.attributes[t]=e,this}deleteAttribute(t){return delete this.attributes[t],this}hasAttribute(t){return this.attributes[t]!==void 0}addGroup(t,e,i=0){this.groups.push({start:t,count:e,materialIndex:i})}clearGroups(){this.groups=[]}setDrawRange(t,e){this.drawRange.start=t,this.drawRange.count=e}applyMatrix4(t){let e=this.attributes.position;e!==void 0&&(e.applyMatrix4(t),e.needsUpdate=!0);let i=this.attributes.normal;if(i!==void 0){let r=new jt().getNormalMatrix(t);i.applyNormalMatrix(r),i.needsUpdate=!0}let s=this.attributes.tangent;return s!==void 0&&(s.transformDirection(t),s.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this}applyQuaternion(t){return Vn.makeRotationFromQuaternion(t),this.applyMatrix4(Vn),this}rotateX(t){return Vn.makeRotationX(t),this.applyMatrix4(Vn),this}rotateY(t){return Vn.makeRotationY(t),this.applyMatrix4(Vn),this}rotateZ(t){return Vn.makeRotationZ(t),this.applyMatrix4(Vn),this}translate(t,e,i){return Vn.makeTranslation(t,e,i),this.applyMatrix4(Vn),this}scale(t,e,i){return Vn.makeScale(t,e,i),this.applyMatrix4(Vn),this}lookAt(t){return rh.lookAt(t),rh.updateMatrix(),this.applyMatrix4(rh.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(Sr).negate(),this.translate(Sr.x,Sr.y,Sr.z),this}setFromPoints(t){let e=this.getAttribute("position");if(e===void 0){let i=[];for(let s=0,r=t.length;s<r;s++){let o=t[s];i.push(o.x,o.y,o.z||0)}this.setAttribute("position",new le(i,3))}else{for(let i=0,s=e.count;i<s;i++){let r=t[i];e.setXYZ(i,r.x,r.y,r.z||0)}t.length>e.count&&console.warn("THREE.BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry."),e.needsUpdate=!0}return this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new Wn);let t=this.attributes.position,e=this.morphAttributes.position;if(t&&t.isGLBufferAttribute){console.error("THREE.BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new w(-1/0,-1/0,-1/0),new w(1/0,1/0,1/0));return}if(t!==void 0){if(this.boundingBox.setFromBufferAttribute(t),e)for(let i=0,s=e.length;i<s;i++){let r=e[i];Pn.setFromBufferAttribute(r),this.morphTargetsRelative?(Ze.addVectors(this.boundingBox.min,Pn.min),this.boundingBox.expandByPoint(Ze),Ze.addVectors(this.boundingBox.max,Pn.max),this.boundingBox.expandByPoint(Ze)):(this.boundingBox.expandByPoint(Pn.min),this.boundingBox.expandByPoint(Pn.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&console.error('THREE.BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new os);let t=this.attributes.position,e=this.morphAttributes.position;if(t&&t.isGLBufferAttribute){console.error("THREE.BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new w,1/0);return}if(t){let i=this.boundingSphere.center;if(Pn.setFromBufferAttribute(t),e)for(let r=0,o=e.length;r<o;r++){let a=e[r];mo.setFromBufferAttribute(a),this.morphTargetsRelative?(Ze.addVectors(Pn.min,mo.min),Pn.expandByPoint(Ze),Ze.addVectors(Pn.max,mo.max),Pn.expandByPoint(Ze)):(Pn.expandByPoint(mo.min),Pn.expandByPoint(mo.max))}Pn.getCenter(i);let s=0;for(let r=0,o=t.count;r<o;r++)Ze.fromBufferAttribute(t,r),s=Math.max(s,i.distanceToSquared(Ze));if(e)for(let r=0,o=e.length;r<o;r++){let a=e[r],l=this.morphTargetsRelative;for(let c=0,h=a.count;c<h;c++)Ze.fromBufferAttribute(a,c),l&&(Sr.fromBufferAttribute(t,c),Ze.add(Sr)),s=Math.max(s,i.distanceToSquared(Ze))}this.boundingSphere.radius=Math.sqrt(s),isNaN(this.boundingSphere.radius)&&console.error('THREE.BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){let t=this.index,e=this.attributes;if(t===null||e.position===void 0||e.normal===void 0||e.uv===void 0){console.error("THREE.BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}let i=e.position,s=e.normal,r=e.uv;this.hasAttribute("tangent")===!1&&this.setAttribute("tangent",new en(new Float32Array(4*i.count),4));let o=this.getAttribute("tangent"),a=[],l=[];for(let D=0;D<i.count;D++)a[D]=new w,l[D]=new w;let c=new w,h=new w,u=new w,d=new nt,f=new nt,m=new nt,_=new w,g=new w;function p(D,b,y){c.fromBufferAttribute(i,D),h.fromBufferAttribute(i,b),u.fromBufferAttribute(i,y),d.fromBufferAttribute(r,D),f.fromBufferAttribute(r,b),m.fromBufferAttribute(r,y),h.sub(c),u.sub(c),f.sub(d),m.sub(d);let I=1/(f.x*m.y-m.x*f.y);isFinite(I)&&(_.copy(h).multiplyScalar(m.y).addScaledVector(u,-f.y).multiplyScalar(I),g.copy(u).multiplyScalar(f.x).addScaledVector(h,-m.x).multiplyScalar(I),a[D].add(_),a[b].add(_),a[y].add(_),l[D].add(g),l[b].add(g),l[y].add(g))}let S=this.groups;S.length===0&&(S=[{start:0,count:t.count}]);for(let D=0,b=S.length;D<b;++D){let y=S[D],I=y.start,Y=y.count;for(let V=I,F=I+Y;V<F;V+=3)p(t.getX(V+0),t.getX(V+1),t.getX(V+2))}let M=new w,x=new w,L=new w,R=new w;function C(D){L.fromBufferAttribute(s,D),R.copy(L);let b=a[D];M.copy(b),M.sub(L.multiplyScalar(L.dot(b))).normalize(),x.crossVectors(R,b);let I=x.dot(l[D])<0?-1:1;o.setXYZW(D,M.x,M.y,M.z,I)}for(let D=0,b=S.length;D<b;++D){let y=S[D],I=y.start,Y=y.count;for(let V=I,F=I+Y;V<F;V+=3)C(t.getX(V+0)),C(t.getX(V+1)),C(t.getX(V+2))}}computeVertexNormals(){let t=this.index,e=this.getAttribute("position");if(e!==void 0){let i=this.getAttribute("normal");if(i===void 0)i=new en(new Float32Array(e.count*3),3),this.setAttribute("normal",i);else for(let d=0,f=i.count;d<f;d++)i.setXYZ(d,0,0,0);let s=new w,r=new w,o=new w,a=new w,l=new w,c=new w,h=new w,u=new w;if(t)for(let d=0,f=t.count;d<f;d+=3){let m=t.getX(d+0),_=t.getX(d+1),g=t.getX(d+2);s.fromBufferAttribute(e,m),r.fromBufferAttribute(e,_),o.fromBufferAttribute(e,g),h.subVectors(o,r),u.subVectors(s,r),h.cross(u),a.fromBufferAttribute(i,m),l.fromBufferAttribute(i,_),c.fromBufferAttribute(i,g),a.add(h),l.add(h),c.add(h),i.setXYZ(m,a.x,a.y,a.z),i.setXYZ(_,l.x,l.y,l.z),i.setXYZ(g,c.x,c.y,c.z)}else for(let d=0,f=e.count;d<f;d+=3)s.fromBufferAttribute(e,d+0),r.fromBufferAttribute(e,d+1),o.fromBufferAttribute(e,d+2),h.subVectors(o,r),u.subVectors(s,r),h.cross(u),i.setXYZ(d+0,h.x,h.y,h.z),i.setXYZ(d+1,h.x,h.y,h.z),i.setXYZ(d+2,h.x,h.y,h.z);this.normalizeNormals(),i.needsUpdate=!0}}normalizeNormals(){let t=this.attributes.normal;for(let e=0,i=t.count;e<i;e++)Ze.fromBufferAttribute(t,e),Ze.normalize(),t.setXYZ(e,Ze.x,Ze.y,Ze.z)}toNonIndexed(){function t(a,l){let c=a.array,h=a.itemSize,u=a.normalized,d=new c.constructor(l.length*h),f=0,m=0;for(let _=0,g=l.length;_<g;_++){a.isInterleavedBufferAttribute?f=l[_]*a.data.stride+a.offset:f=l[_]*h;for(let p=0;p<h;p++)d[m++]=c[f++]}return new en(d,h,u)}if(this.index===null)return console.warn("THREE.BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;let e=new n,i=this.index.array,s=this.attributes;for(let a in s){let l=s[a],c=t(l,i);e.setAttribute(a,c)}let r=this.morphAttributes;for(let a in r){let l=[],c=r[a];for(let h=0,u=c.length;h<u;h++){let d=c[h],f=t(d,i);l.push(f)}e.morphAttributes[a]=l}e.morphTargetsRelative=this.morphTargetsRelative;let o=this.groups;for(let a=0,l=o.length;a<l;a++){let c=o[a];e.addGroup(c.start,c.count,c.materialIndex)}return e}toJSON(){let t={metadata:{version:4.6,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(t.uuid=this.uuid,t.type=this.type,this.name!==""&&(t.name=this.name),Object.keys(this.userData).length>0&&(t.userData=this.userData),this.parameters!==void 0){let l=this.parameters;for(let c in l)l[c]!==void 0&&(t[c]=l[c]);return t}t.data={attributes:{}};let e=this.index;e!==null&&(t.data.index={type:e.array.constructor.name,array:Array.prototype.slice.call(e.array)});let i=this.attributes;for(let l in i){let c=i[l];t.data.attributes[l]=c.toJSON(t.data)}let s={},r=!1;for(let l in this.morphAttributes){let c=this.morphAttributes[l],h=[];for(let u=0,d=c.length;u<d;u++){let f=c[u];h.push(f.toJSON(t.data))}h.length>0&&(s[l]=h,r=!0)}r&&(t.data.morphAttributes=s,t.data.morphTargetsRelative=this.morphTargetsRelative);let o=this.groups;o.length>0&&(t.data.groups=JSON.parse(JSON.stringify(o)));let a=this.boundingSphere;return a!==null&&(t.data.boundingSphere={center:a.center.toArray(),radius:a.radius}),t}clone(){return new this.constructor().copy(this)}copy(t){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;let e={};this.name=t.name;let i=t.index;i!==null&&this.setIndex(i.clone(e));let s=t.attributes;for(let c in s){let h=s[c];this.setAttribute(c,h.clone(e))}let r=t.morphAttributes;for(let c in r){let h=[],u=r[c];for(let d=0,f=u.length;d<f;d++)h.push(u[d].clone(e));this.morphAttributes[c]=h}this.morphTargetsRelative=t.morphTargetsRelative;let o=t.groups;for(let c=0,h=o.length;c<h;c++){let u=o[c];this.addGroup(u.start,u.count,u.materialIndex)}let a=t.boundingBox;a!==null&&(this.boundingBox=a.clone());let l=t.boundingSphere;return l!==null&&(this.boundingSphere=l.clone()),this.drawRange.start=t.drawRange.start,this.drawRange.count=t.drawRange.count,this.userData=t.userData,this}dispose(){this.dispatchEvent({type:"dispose"})}},Xf=new be,Ds=new Gs,Da=new os,Yf=new w,La=new w,Ua=new w,Na=new w,oh=new w,Oa=new w,qf=new w,Fa=new w,Ft=class extends $e{constructor(t=new Fe,e=new Je){super(),this.isMesh=!0,this.type="Mesh",this.geometry=t,this.material=e,this.updateMorphTargets()}copy(t,e){return super.copy(t,e),t.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=t.morphTargetInfluences.slice()),t.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},t.morphTargetDictionary)),this.material=Array.isArray(t.material)?t.material.slice():t.material,this.geometry=t.geometry,this}updateMorphTargets(){let e=this.geometry.morphAttributes,i=Object.keys(e);if(i.length>0){let s=e[i[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,o=s.length;r<o;r++){let a=s[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=r}}}}getVertexPosition(t,e){let i=this.geometry,s=i.attributes.position,r=i.morphAttributes.position,o=i.morphTargetsRelative;e.fromBufferAttribute(s,t);let a=this.morphTargetInfluences;if(r&&a){Oa.set(0,0,0);for(let l=0,c=r.length;l<c;l++){let h=a[l],u=r[l];h!==0&&(oh.fromBufferAttribute(u,t),o?Oa.addScaledVector(oh,h):Oa.addScaledVector(oh.sub(e),h))}e.add(Oa)}return e}raycast(t,e){let i=this.geometry,s=this.material,r=this.matrixWorld;s!==void 0&&(i.boundingSphere===null&&i.computeBoundingSphere(),Da.copy(i.boundingSphere),Da.applyMatrix4(r),Ds.copy(t.ray).recast(t.near),!(Da.containsPoint(Ds.origin)===!1&&(Ds.intersectSphere(Da,Yf)===null||Ds.origin.distanceToSquared(Yf)>(t.far-t.near)**2))&&(Xf.copy(r).invert(),Ds.copy(t.ray).applyMatrix4(Xf),!(i.boundingBox!==null&&Ds.intersectsBox(i.boundingBox)===!1)&&this._computeIntersections(t,e,Ds)))}_computeIntersections(t,e,i){let s,r=this.geometry,o=this.material,a=r.index,l=r.attributes.position,c=r.attributes.uv,h=r.attributes.uv1,u=r.attributes.normal,d=r.groups,f=r.drawRange;if(a!==null)if(Array.isArray(o))for(let m=0,_=d.length;m<_;m++){let g=d[m],p=o[g.materialIndex],S=Math.max(g.start,f.start),M=Math.min(a.count,Math.min(g.start+g.count,f.start+f.count));for(let x=S,L=M;x<L;x+=3){let R=a.getX(x),C=a.getX(x+1),D=a.getX(x+2);s=Ba(this,p,t,i,c,h,u,R,C,D),s&&(s.faceIndex=Math.floor(x/3),s.face.materialIndex=g.materialIndex,e.push(s))}}else{let m=Math.max(0,f.start),_=Math.min(a.count,f.start+f.count);for(let g=m,p=_;g<p;g+=3){let S=a.getX(g),M=a.getX(g+1),x=a.getX(g+2);s=Ba(this,o,t,i,c,h,u,S,M,x),s&&(s.faceIndex=Math.floor(g/3),e.push(s))}}else if(l!==void 0)if(Array.isArray(o))for(let m=0,_=d.length;m<_;m++){let g=d[m],p=o[g.materialIndex],S=Math.max(g.start,f.start),M=Math.min(l.count,Math.min(g.start+g.count,f.start+f.count));for(let x=S,L=M;x<L;x+=3){let R=x,C=x+1,D=x+2;s=Ba(this,p,t,i,c,h,u,R,C,D),s&&(s.faceIndex=Math.floor(x/3),s.face.materialIndex=g.materialIndex,e.push(s))}}else{let m=Math.max(0,f.start),_=Math.min(l.count,f.start+f.count);for(let g=m,p=_;g<p;g+=3){let S=g,M=g+1,x=g+2;s=Ba(this,o,t,i,c,h,u,S,M,x),s&&(s.faceIndex=Math.floor(g/3),e.push(s))}}}};function e_(n,t,e,i,s,r,o,a){let l;if(t.side===an?l=i.intersectTriangle(o,r,s,!0,a):l=i.intersectTriangle(s,r,o,t.side===rs,a),l===null)return null;Fa.copy(a),Fa.applyMatrix4(n.matrixWorld);let c=e.ray.origin.distanceTo(Fa);return c<e.near||c>e.far?null:{distance:c,point:Fa.clone(),object:n}}function Ba(n,t,e,i,s,r,o,a,l,c){n.getVertexPosition(a,La),n.getVertexPosition(l,Ua),n.getVertexPosition(c,Na);let h=e_(n,t,e,i,La,Ua,Na,qf);if(h){let u=new w;Bs.getBarycoord(qf,La,Ua,Na,u),s&&(h.uv=Bs.getInterpolatedAttribute(s,a,l,c,u,new nt)),r&&(h.uv1=Bs.getInterpolatedAttribute(r,a,l,c,u,new nt)),o&&(h.normal=Bs.getInterpolatedAttribute(o,a,l,c,u,new w),h.normal.dot(i.direction)>0&&h.normal.multiplyScalar(-1));let d={a,b:l,c,normal:new w,materialIndex:0};Bs.getNormal(La,Ua,Na,d.normal),h.face=d,h.barycoord=u}return h}var bn=class n extends Fe{constructor(t=1,e=1,i=1,s=1,r=1,o=1){super(),this.type="BoxGeometry",this.parameters={width:t,height:e,depth:i,widthSegments:s,heightSegments:r,depthSegments:o};let a=this;s=Math.floor(s),r=Math.floor(r),o=Math.floor(o);let l=[],c=[],h=[],u=[],d=0,f=0;m("z","y","x",-1,-1,i,e,t,o,r,0),m("z","y","x",1,-1,i,e,-t,o,r,1),m("x","z","y",1,1,t,i,e,s,o,2),m("x","z","y",1,-1,t,i,-e,s,o,3),m("x","y","z",1,-1,t,e,i,s,r,4),m("x","y","z",-1,-1,t,e,-i,s,r,5),this.setIndex(l),this.setAttribute("position",new le(c,3)),this.setAttribute("normal",new le(h,3)),this.setAttribute("uv",new le(u,2));function m(_,g,p,S,M,x,L,R,C,D,b){let y=x/C,I=L/D,Y=x/2,V=L/2,F=R/2,X=C+1,z=D+1,J=0,k=0,rt=new w;for(let ct=0;ct<z;ct++){let mt=ct*I-V;for(let kt=0;kt<X;kt++){let Xt=kt*y-Y;rt[_]=Xt*S,rt[g]=mt*M,rt[p]=F,c.push(rt.x,rt.y,rt.z),rt[_]=0,rt[g]=0,rt[p]=R>0?1:-1,h.push(rt.x,rt.y,rt.z),u.push(kt/C),u.push(1-ct/D),J+=1}}for(let ct=0;ct<D;ct++)for(let mt=0;mt<C;mt++){let kt=d+mt+X*ct,Xt=d+mt+X*(ct+1),Z=d+(mt+1)+X*(ct+1),st=d+(mt+1)+X*ct;l.push(kt,Xt,st),l.push(Xt,Z,st),k+=6}a.addGroup(f,k,b),f+=k,d+=J}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new n(t.width,t.height,t.depth,t.widthSegments,t.heightSegments,t.depthSegments)}};function Hr(n){let t={};for(let e in n){t[e]={};for(let i in n[e]){let s=n[e][i];s&&(s.isColor||s.isMatrix3||s.isMatrix4||s.isVector2||s.isVector3||s.isVector4||s.isTexture||s.isQuaternion)?s.isRenderTargetTexture?(console.warn("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),t[e][i]=null):t[e][i]=s.clone():Array.isArray(s)?t[e][i]=s.slice():t[e][i]=s}}return t}function gn(n){let t={};for(let e=0;e<n.length;e++){let i=Hr(n[e]);for(let s in i)t[s]=i[s]}return t}function n_(n){let t=[];for(let e=0;e<n.length;e++)t.push(n[e].clone());return t}function Jp(n){let t=n.getRenderTarget();return t===null?n.outputColorSpace:t.isXRRenderTarget===!0?t.texture.colorSpace:oe.workingColorSpace}var Qs={clone:Hr,merge:gn},i_=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,s_=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`,cn=class extends as{static get type(){return"ShaderMaterial"}constructor(t){super(),this.isShaderMaterial=!0,this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=i_,this.fragmentShader=s_,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,t!==void 0&&this.setValues(t)}copy(t){return super.copy(t),this.fragmentShader=t.fragmentShader,this.vertexShader=t.vertexShader,this.uniforms=Hr(t.uniforms),this.uniformsGroups=n_(t.uniformsGroups),this.defines=Object.assign({},t.defines),this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.fog=t.fog,this.lights=t.lights,this.clipping=t.clipping,this.extensions=Object.assign({},t.extensions),this.glslVersion=t.glslVersion,this}toJSON(t){let e=super.toJSON(t);e.glslVersion=this.glslVersion,e.uniforms={};for(let s in this.uniforms){let o=this.uniforms[s].value;o&&o.isTexture?e.uniforms[s]={type:"t",value:o.toJSON(t).uuid}:o&&o.isColor?e.uniforms[s]={type:"c",value:o.getHex()}:o&&o.isVector2?e.uniforms[s]={type:"v2",value:o.toArray()}:o&&o.isVector3?e.uniforms[s]={type:"v3",value:o.toArray()}:o&&o.isVector4?e.uniforms[s]={type:"v4",value:o.toArray()}:o&&o.isMatrix3?e.uniforms[s]={type:"m3",value:o.toArray()}:o&&o.isMatrix4?e.uniforms[s]={type:"m4",value:o.toArray()}:e.uniforms[s]={value:o}}Object.keys(this.defines).length>0&&(e.defines=this.defines),e.vertexShader=this.vertexShader,e.fragmentShader=this.fragmentShader,e.lights=this.lights,e.clipping=this.clipping;let i={};for(let s in this.extensions)this.extensions[s]===!0&&(i[s]=!0);return Object.keys(i).length>0&&(e.extensions=i),e}},al=class extends $e{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new be,this.projectionMatrix=new be,this.projectionMatrixInverse=new be,this.coordinateSystem=Ii}copy(t,e){return super.copy(t,e),this.matrixWorldInverse.copy(t.matrixWorldInverse),this.projectionMatrix.copy(t.projectionMatrix),this.projectionMatrixInverse.copy(t.projectionMatrixInverse),this.coordinateSystem=t.coordinateSystem,this}getWorldDirection(t){return super.getWorldDirection(t).negate()}updateMatrixWorld(t){super.updateMatrixWorld(t),this.matrixWorldInverse.copy(this.matrixWorld).invert()}updateWorldMatrix(t,e){super.updateWorldMatrix(t,e),this.matrixWorldInverse.copy(this.matrixWorld).invert()}clone(){return new this.constructor().copy(this)}},es=new w,Zf=new nt,Kf=new nt,tn=class extends al{constructor(t=50,e=1,i=.1,s=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=t,this.zoom=1,this.near=i,this.far=s,this.focus=10,this.aspect=e,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(t,e){return super.copy(t,e),this.fov=t.fov,this.zoom=t.zoom,this.near=t.near,this.far=t.far,this.focus=t.focus,this.aspect=t.aspect,this.view=t.view===null?null:Object.assign({},t.view),this.filmGauge=t.filmGauge,this.filmOffset=t.filmOffset,this}setFocalLength(t){let e=.5*this.getFilmHeight()/t;this.fov=Co*2*Math.atan(e),this.updateProjectionMatrix()}getFocalLength(){let t=Math.tan(Eo*.5*this.fov);return .5*this.getFilmHeight()/t}getEffectiveFOV(){return Co*2*Math.atan(Math.tan(Eo*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(t,e,i){es.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),e.set(es.x,es.y).multiplyScalar(-t/es.z),es.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),i.set(es.x,es.y).multiplyScalar(-t/es.z)}getViewSize(t,e){return this.getViewBounds(t,Zf,Kf),e.subVectors(Kf,Zf)}setViewOffset(t,e,i,s,r,o){this.aspect=t/e,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=t,this.view.fullHeight=e,this.view.offsetX=i,this.view.offsetY=s,this.view.width=r,this.view.height=o,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let t=this.near,e=t*Math.tan(Eo*.5*this.fov)/this.zoom,i=2*e,s=this.aspect*i,r=-.5*s,o=this.view;if(this.view!==null&&this.view.enabled){let l=o.fullWidth,c=o.fullHeight;r+=o.offsetX*s/l,e-=o.offsetY*i/c,s*=o.width/l,i*=o.height/c}let a=this.filmOffset;a!==0&&(r+=t*a/this.getFilmWidth()),this.projectionMatrix.makePerspective(r,r+s,e,e-i,t,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(t){let e=super.toJSON(t);return e.object.fov=this.fov,e.object.zoom=this.zoom,e.object.near=this.near,e.object.far=this.far,e.object.focus=this.focus,e.object.aspect=this.aspect,this.view!==null&&(e.object.view=Object.assign({},this.view)),e.object.filmGauge=this.filmGauge,e.object.filmOffset=this.filmOffset,e}},Tr=-90,wr=1,lu=class extends $e{constructor(t,e,i){super(),this.type="CubeCamera",this.renderTarget=i,this.coordinateSystem=null,this.activeMipmapLevel=0;let s=new tn(Tr,wr,t,e);s.layers=this.layers,this.add(s);let r=new tn(Tr,wr,t,e);r.layers=this.layers,this.add(r);let o=new tn(Tr,wr,t,e);o.layers=this.layers,this.add(o);let a=new tn(Tr,wr,t,e);a.layers=this.layers,this.add(a);let l=new tn(Tr,wr,t,e);l.layers=this.layers,this.add(l);let c=new tn(Tr,wr,t,e);c.layers=this.layers,this.add(c)}updateCoordinateSystem(){let t=this.coordinateSystem,e=this.children.concat(),[i,s,r,o,a,l]=e;for(let c of e)this.remove(c);if(t===Ii)i.up.set(0,1,0),i.lookAt(1,0,0),s.up.set(0,1,0),s.lookAt(-1,0,0),r.up.set(0,0,-1),r.lookAt(0,1,0),o.up.set(0,0,1),o.lookAt(0,-1,0),a.up.set(0,1,0),a.lookAt(0,0,1),l.up.set(0,1,0),l.lookAt(0,0,-1);else if(t===nl)i.up.set(0,-1,0),i.lookAt(-1,0,0),s.up.set(0,-1,0),s.lookAt(1,0,0),r.up.set(0,0,1),r.lookAt(0,1,0),o.up.set(0,0,-1),o.lookAt(0,-1,0),a.up.set(0,-1,0),a.lookAt(0,0,1),l.up.set(0,-1,0),l.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+t);for(let c of e)this.add(c),c.updateMatrixWorld()}update(t,e){this.parent===null&&this.updateMatrixWorld();let{renderTarget:i,activeMipmapLevel:s}=this;this.coordinateSystem!==t.coordinateSystem&&(this.coordinateSystem=t.coordinateSystem,this.updateCoordinateSystem());let[r,o,a,l,c,h]=this.children,u=t.getRenderTarget(),d=t.getActiveCubeFace(),f=t.getActiveMipmapLevel(),m=t.xr.enabled;t.xr.enabled=!1;let _=i.texture.generateMipmaps;i.texture.generateMipmaps=!1,t.setRenderTarget(i,0,s),t.render(e,r),t.setRenderTarget(i,1,s),t.render(e,o),t.setRenderTarget(i,2,s),t.render(e,a),t.setRenderTarget(i,3,s),t.render(e,l),t.setRenderTarget(i,4,s),t.render(e,c),i.texture.generateMipmaps=_,t.setRenderTarget(i,5,s),t.render(e,h),t.setRenderTarget(u,d,f),t.xr.enabled=m,i.texture.needsPMREMUpdate=!0}},ll=class extends _n{constructor(t,e,i,s,r,o,a,l,c,h){t=t!==void 0?t:[],e=e!==void 0?e:Fr,super(t,e,i,s,r,o,a,l,c,h),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(t){this.image=t}},cu=class extends xn{constructor(t=1,e={}){super(t,t,e),this.isWebGLCubeRenderTarget=!0;let i={width:t,height:t,depth:1},s=[i,i,i,i,i,i];this.texture=new ll(s,e.mapping,e.wrapS,e.wrapT,e.magFilter,e.minFilter,e.format,e.type,e.anisotropy,e.colorSpace),this.texture.isRenderTargetTexture=!0,this.texture.generateMipmaps=e.generateMipmaps!==void 0?e.generateMipmaps:!1,this.texture.minFilter=e.minFilter!==void 0?e.minFilter:di}fromEquirectangularTexture(t,e){this.texture.type=e.type,this.texture.colorSpace=e.colorSpace,this.texture.generateMipmaps=e.generateMipmaps,this.texture.minFilter=e.minFilter,this.texture.magFilter=e.magFilter;let i={uniforms:{tEquirect:{value:null}},vertexShader:`

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
			`},s=new bn(5,5,5),r=new cn({name:"CubemapFromEquirect",uniforms:Hr(i.uniforms),vertexShader:i.vertexShader,fragmentShader:i.fragmentShader,side:an,blending:Gn});r.uniforms.tEquirect.value=e;let o=new Ft(s,r),a=e.minFilter;return e.minFilter===Hs&&(e.minFilter=di),new lu(1,10,this).update(t,o),e.minFilter=a,o.geometry.dispose(),o.material.dispose(),this}clear(t,e,i,s){let r=t.getRenderTarget();for(let o=0;o<6;o++)t.setRenderTarget(this,o),t.clear(e,i,s);t.setRenderTarget(r)}},ah=new w,r_=new w,o_=new jt,In=class{constructor(t=new w(1,0,0),e=0){this.isPlane=!0,this.normal=t,this.constant=e}set(t,e){return this.normal.copy(t),this.constant=e,this}setComponents(t,e,i,s){return this.normal.set(t,e,i),this.constant=s,this}setFromNormalAndCoplanarPoint(t,e){return this.normal.copy(t),this.constant=-e.dot(this.normal),this}setFromCoplanarPoints(t,e,i){let s=ah.subVectors(i,e).cross(r_.subVectors(t,e)).normalize();return this.setFromNormalAndCoplanarPoint(s,t),this}copy(t){return this.normal.copy(t.normal),this.constant=t.constant,this}normalize(){let t=1/this.normal.length();return this.normal.multiplyScalar(t),this.constant*=t,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(t){return this.normal.dot(t)+this.constant}distanceToSphere(t){return this.distanceToPoint(t.center)-t.radius}projectPoint(t,e){return e.copy(t).addScaledVector(this.normal,-this.distanceToPoint(t))}intersectLine(t,e){let i=t.delta(ah),s=this.normal.dot(i);if(s===0)return this.distanceToPoint(t.start)===0?e.copy(t.start):null;let r=-(t.start.dot(this.normal)+this.constant)/s;return r<0||r>1?null:e.copy(t.start).addScaledVector(i,r)}intersectsLine(t){let e=this.distanceToPoint(t.start),i=this.distanceToPoint(t.end);return e<0&&i>0||i<0&&e>0}intersectsBox(t){return t.intersectsPlane(this)}intersectsSphere(t){return t.intersectsPlane(this)}coplanarPoint(t){return t.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(t,e){let i=e||o_.getNormalMatrix(t),s=this.coplanarPoint(ah).applyMatrix4(t),r=this.normal.applyMatrix3(i).normalize();return this.constant=-s.dot(r),this}translate(t){return this.constant-=t.dot(this.normal),this}equals(t){return t.normal.equals(this.normal)&&t.constant===this.constant}clone(){return new this.constructor().copy(this)}},Ls=new os,za=new w,Do=class{constructor(t=new In,e=new In,i=new In,s=new In,r=new In,o=new In){this.planes=[t,e,i,s,r,o]}set(t,e,i,s,r,o){let a=this.planes;return a[0].copy(t),a[1].copy(e),a[2].copy(i),a[3].copy(s),a[4].copy(r),a[5].copy(o),this}copy(t){let e=this.planes;for(let i=0;i<6;i++)e[i].copy(t.planes[i]);return this}setFromProjectionMatrix(t,e=Ii){let i=this.planes,s=t.elements,r=s[0],o=s[1],a=s[2],l=s[3],c=s[4],h=s[5],u=s[6],d=s[7],f=s[8],m=s[9],_=s[10],g=s[11],p=s[12],S=s[13],M=s[14],x=s[15];if(i[0].setComponents(l-r,d-c,g-f,x-p).normalize(),i[1].setComponents(l+r,d+c,g+f,x+p).normalize(),i[2].setComponents(l+o,d+h,g+m,x+S).normalize(),i[3].setComponents(l-o,d-h,g-m,x-S).normalize(),i[4].setComponents(l-a,d-u,g-_,x-M).normalize(),e===Ii)i[5].setComponents(l+a,d+u,g+_,x+M).normalize();else if(e===nl)i[5].setComponents(a,u,_,M).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+e);return this}intersectsObject(t){if(t.boundingSphere!==void 0)t.boundingSphere===null&&t.computeBoundingSphere(),Ls.copy(t.boundingSphere).applyMatrix4(t.matrixWorld);else{let e=t.geometry;e.boundingSphere===null&&e.computeBoundingSphere(),Ls.copy(e.boundingSphere).applyMatrix4(t.matrixWorld)}return this.intersectsSphere(Ls)}intersectsSprite(t){return Ls.center.set(0,0,0),Ls.radius=.7071067811865476,Ls.applyMatrix4(t.matrixWorld),this.intersectsSphere(Ls)}intersectsSphere(t){let e=this.planes,i=t.center,s=-t.radius;for(let r=0;r<6;r++)if(e[r].distanceToPoint(i)<s)return!1;return!0}intersectsBox(t){let e=this.planes;for(let i=0;i<6;i++){let s=e[i];if(za.x=s.normal.x>0?t.max.x:t.min.x,za.y=s.normal.y>0?t.max.y:t.min.y,za.z=s.normal.z>0?t.max.z:t.min.z,s.distanceToPoint(za)<0)return!1}return!0}containsPoint(t){let e=this.planes;for(let i=0;i<6;i++)if(e[i].distanceToPoint(t)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}};function jp(){let n=null,t=!1,e=null,i=null;function s(r,o){e(r,o),i=n.requestAnimationFrame(s)}return{start:function(){t!==!0&&e!==null&&(i=n.requestAnimationFrame(s),t=!0)},stop:function(){n.cancelAnimationFrame(i),t=!1},setAnimationLoop:function(r){e=r},setContext:function(r){n=r}}}function a_(n){let t=new WeakMap;function e(a,l){let c=a.array,h=a.usage,u=c.byteLength,d=n.createBuffer();n.bindBuffer(l,d),n.bufferData(l,c,h),a.onUploadCallback();let f;if(c instanceof Float32Array)f=n.FLOAT;else if(c instanceof Uint16Array)a.isFloat16BufferAttribute?f=n.HALF_FLOAT:f=n.UNSIGNED_SHORT;else if(c instanceof Int16Array)f=n.SHORT;else if(c instanceof Uint32Array)f=n.UNSIGNED_INT;else if(c instanceof Int32Array)f=n.INT;else if(c instanceof Int8Array)f=n.BYTE;else if(c instanceof Uint8Array)f=n.UNSIGNED_BYTE;else if(c instanceof Uint8ClampedArray)f=n.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+c);return{buffer:d,type:f,bytesPerElement:c.BYTES_PER_ELEMENT,version:a.version,size:u}}function i(a,l,c){let h=l.array,u=l.updateRanges;if(n.bindBuffer(c,a),u.length===0)n.bufferSubData(c,0,h);else{u.sort((f,m)=>f.start-m.start);let d=0;for(let f=1;f<u.length;f++){let m=u[d],_=u[f];_.start<=m.start+m.count+1?m.count=Math.max(m.count,_.start+_.count-m.start):(++d,u[d]=_)}u.length=d+1;for(let f=0,m=u.length;f<m;f++){let _=u[f];n.bufferSubData(c,_.start*h.BYTES_PER_ELEMENT,h,_.start,_.count)}l.clearUpdateRanges()}l.onUploadCallback()}function s(a){return a.isInterleavedBufferAttribute&&(a=a.data),t.get(a)}function r(a){a.isInterleavedBufferAttribute&&(a=a.data);let l=t.get(a);l&&(n.deleteBuffer(l.buffer),t.delete(a))}function o(a,l){if(a.isInterleavedBufferAttribute&&(a=a.data),a.isGLBufferAttribute){let h=t.get(a);(!h||h.version<a.version)&&t.set(a,{buffer:a.buffer,type:a.type,bytesPerElement:a.elementSize,version:a.version});return}let c=t.get(a);if(c===void 0)t.set(a,e(a,l));else if(c.version<a.version){if(c.size!==a.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");i(c.buffer,a,l),c.version=a.version}}return{get:s,remove:r,update:o}}var ni=class n extends Fe{constructor(t=1,e=1,i=1,s=1){super(),this.type="PlaneGeometry",this.parameters={width:t,height:e,widthSegments:i,heightSegments:s};let r=t/2,o=e/2,a=Math.floor(i),l=Math.floor(s),c=a+1,h=l+1,u=t/a,d=e/l,f=[],m=[],_=[],g=[];for(let p=0;p<h;p++){let S=p*d-o;for(let M=0;M<c;M++){let x=M*u-r;m.push(x,-S,0),_.push(0,0,1),g.push(M/a),g.push(1-p/l)}}for(let p=0;p<l;p++)for(let S=0;S<a;S++){let M=S+c*p,x=S+c*(p+1),L=S+1+c*(p+1),R=S+1+c*p;f.push(M,x,R),f.push(x,L,R)}this.setIndex(f),this.setAttribute("position",new le(m,3)),this.setAttribute("normal",new le(_,3)),this.setAttribute("uv",new le(g,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new n(t.width,t.height,t.widthSegments,t.heightSegments)}},l_=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,c_=`#ifdef USE_ALPHAHASH
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
#endif`,h_=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,u_=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,d_=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,f_=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,p_=`#ifdef USE_AOMAP
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
#endif`,m_=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,g_=`#ifdef USE_BATCHING
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
	vec3 getBatchingColor( const in float i ) {
		int size = textureSize( batchingColorTexture, 0 ).x;
		int j = int( i );
		int x = j % size;
		int y = j / size;
		return texelFetch( batchingColorTexture, ivec2( x, y ), 0 ).rgb;
	}
#endif`,__=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,x_=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,v_=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,y_=`float G_BlinnPhong_Implicit( ) {
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
} // validated`,M_=`#ifdef USE_IRIDESCENCE
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
#endif`,E_=`#ifdef USE_BUMPMAP
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
#endif`,b_=`#if NUM_CLIPPING_PLANES > 0
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
#endif`,S_=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,T_=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,w_=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,A_=`#if defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#elif defined( USE_COLOR )
	diffuseColor.rgb *= vColor;
#endif`,R_=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR )
	varying vec3 vColor;
#endif`,C_=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec3 vColor;
#endif`,P_=`#if defined( USE_COLOR_ALPHA )
	vColor = vec4( 1.0 );
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	vColor = vec3( 1.0 );
#endif
#ifdef USE_COLOR
	vColor *= color;
#endif
#ifdef USE_INSTANCING_COLOR
	vColor.xyz *= instanceColor.xyz;
#endif
#ifdef USE_BATCHING_COLOR
	vec3 batchingColor = getBatchingColor( getIndirectIndex( gl_DrawID ) );
	vColor.xyz *= batchingColor.xyz;
#endif`,I_=`#define PI 3.141592653589793
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
vec3 inverseTransformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( vec4( dir, 0.0 ) * matrix ).xyz );
}
mat3 transposeMat3( const in mat3 m ) {
	mat3 tmp;
	tmp[ 0 ] = vec3( m[ 0 ].x, m[ 1 ].x, m[ 2 ].x );
	tmp[ 1 ] = vec3( m[ 0 ].y, m[ 1 ].y, m[ 2 ].y );
	tmp[ 2 ] = vec3( m[ 0 ].z, m[ 1 ].z, m[ 2 ].z );
	return tmp;
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
} // validated`,D_=`#ifdef ENVMAP_TYPE_CUBE_UV
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
#endif`,L_=`vec3 transformedNormal = objectNormal;
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
	#ifdef FLIP_SIDED
		transformedTangent = - transformedTangent;
	#endif
#endif`,U_=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,N_=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,O_=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,F_=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,B_="gl_FragColor = linearToOutputTexel( gl_FragColor );",z_=`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,k_=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vec3 cameraToFrag;
		if ( isOrthographic ) {
			cameraToFrag = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToFrag = normalize( vWorldPosition - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vec3 reflectVec = reflect( cameraToFrag, worldNormal );
		#else
			vec3 reflectVec = refract( cameraToFrag, worldNormal, refractionRatio );
		#endif
	#else
		vec3 reflectVec = vReflect;
	#endif
	#ifdef ENVMAP_TYPE_CUBE
		vec4 envColor = textureCube( envMap, envMapRotation * vec3( flipEnvMap * reflectVec.x, reflectVec.yz ) );
	#else
		vec4 envColor = vec4( 0.0 );
	#endif
	#ifdef ENVMAP_BLENDING_MULTIPLY
		outgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, specularStrength * reflectivity );
	#elif defined( ENVMAP_BLENDING_MIX )
		outgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity );
	#elif defined( ENVMAP_BLENDING_ADD )
		outgoingLight += envColor.xyz * specularStrength * reflectivity;
	#endif
#endif`,H_=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform float flipEnvMap;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
	
#endif`,V_=`#ifdef USE_ENVMAP
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
#endif`,G_=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,W_=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vWorldPosition = worldPosition.xyz;
	#else
		vec3 cameraToVertex;
		if ( isOrthographic ) {
			cameraToVertex = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToVertex = normalize( worldPosition.xyz - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vReflect = reflect( cameraToVertex, worldNormal );
		#else
			vReflect = refract( cameraToVertex, worldNormal, refractionRatio );
		#endif
	#endif
#endif`,X_=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,Y_=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,q_=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,Z_=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,K_=`#ifdef USE_GRADIENTMAP
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
}`,$_=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,J_=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,j_=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,Q_=`uniform bool receiveShadow;
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
	vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
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
#endif`,tx=`#ifdef USE_ENVMAP
	vec3 getIBLIrradiance( const in vec3 normal ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * worldNormal, 1.0 );
			return PI * envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 reflectVec = reflect( - viewDir, normal );
			reflectVec = normalize( mix( reflectVec, normal, roughness * roughness) );
			reflectVec = inverseTransformDirection( reflectVec, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * reflectVec, roughness );
			return envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
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
	#endif
#endif`,ex=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,nx=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,ix=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,sx=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,rx=`PhysicalMaterial material;
material.diffuseColor = diffuseColor.rgb * ( 1.0 - metalnessFactor );
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
	material.specularColor = mix( min( pow2( ( material.ior - 1.0 ) / ( material.ior + 1.0 ) ) * specularColorFactor, vec3( 1.0 ) ) * specularIntensityFactor, diffuseColor.rgb, metalnessFactor );
#else
	material.specularColor = mix( vec3( 0.04 ), diffuseColor.rgb, metalnessFactor );
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
	material.sheenRoughness = clamp( sheenRoughness, 0.07, 1.0 );
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
#endif`,ox=`struct PhysicalMaterial {
	vec3 diffuseColor;
	float roughness;
	vec3 specularColor;
	float specularF90;
	float dispersion;
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
		vec3 iridescenceF0;
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
		float v = 0.5 / ( gv + gl );
		return saturate(v);
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
	vec3 f0 = material.specularColor;
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
	mat3 mat = mInv * transposeMat3( mat3( T1, T2, N ) );
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
	float a = roughness < 0.25 ? -339.2 * r2 + 161.4 * roughness - 25.9 : -8.48 * r2 + 14.3 * roughness - 9.95;
	float b = roughness < 0.25 ? 44.0 * r2 - 23.7 * roughness + 3.26 : 1.97 * r2 - 3.27 * roughness + 0.72;
	float DG = exp( a * dotNV + b ) + ( roughness < 0.25 ? 0.0 : 0.1 * ( roughness - 0.25 ) );
	return saturate( DG * RECIPROCAL_PI );
}
vec2 DFGApprox( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	const vec4 c0 = vec4( - 1, - 0.0275, - 0.572, 0.022 );
	const vec4 c1 = vec4( 1, 0.0425, 1.04, - 0.04 );
	vec4 r = roughness * c0 + c1;
	float a004 = min( r.x * r.x, exp2( - 9.28 * dotNV ) ) * r.x + r.y;
	vec2 fab = vec2( - 1.04, 1.04 ) * a004 + r.zw;
	return fab;
}
vec3 EnvironmentBRDF( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness ) {
	vec2 fab = DFGApprox( normal, viewDir, roughness );
	return specularColor * fab.x + specularF90 * fab.y;
}
#ifdef USE_IRIDESCENCE
void computeMultiscatteringIridescence( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float iridescence, const in vec3 iridescenceF0, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#else
void computeMultiscattering( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#endif
	vec2 fab = DFGApprox( normal, viewDir, roughness );
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
		vec3 fresnel = ( material.specularColor * t2.x + ( vec3( 1.0 ) - material.specularColor ) * t2.y );
		reflectedLight.directSpecular += lightColor * fresnel * LTC_Evaluate( normal, viewDir, position, mInv, rectCoords );
		reflectedLight.directDiffuse += lightColor * material.diffuseColor * LTC_Evaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords );
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
	#endif
	reflectedLight.directSpecular += irradiance * BRDF_GGX( directLight.direction, geometryViewDir, geometryNormal, material );
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Physical( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectSpecular_Physical( const in vec3 radiance, const in vec3 irradiance, const in vec3 clearcoatRadiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight) {
	#ifdef USE_CLEARCOAT
		clearcoatSpecularIndirect += clearcoatRadiance * EnvironmentBRDF( geometryClearcoatNormal, geometryViewDir, material.clearcoatF0, material.clearcoatF90, material.clearcoatRoughness );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularIndirect += irradiance * material.sheenColor * IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
	#endif
	vec3 singleScattering = vec3( 0.0 );
	vec3 multiScattering = vec3( 0.0 );
	vec3 cosineWeightedIrradiance = irradiance * RECIPROCAL_PI;
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.iridescence, material.iridescenceFresnel, material.roughness, singleScattering, multiScattering );
	#else
		computeMultiscattering( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.roughness, singleScattering, multiScattering );
	#endif
	vec3 totalScattering = singleScattering + multiScattering;
	vec3 diffuse = material.diffuseColor * ( 1.0 - max( max( totalScattering.r, totalScattering.g ), totalScattering.b ) );
	reflectedLight.indirectSpecular += radiance * singleScattering;
	reflectedLight.indirectSpecular += multiScattering * cosineWeightedIrradiance;
	reflectedLight.indirectDiffuse += diffuse * cosineWeightedIrradiance;
}
#define RE_Direct				RE_Direct_Physical
#define RE_Direct_RectArea		RE_Direct_RectArea_Physical
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Physical
#define RE_IndirectSpecular		RE_IndirectSpecular_Physical
float computeSpecularOcclusion( const in float dotNV, const in float ambientOcclusion, const in float roughness ) {
	return saturate( pow( dotNV + ambientOcclusion, exp2( - 16.0 * roughness - 1.0 ) ) - 1.0 + ambientOcclusion );
}`,ax=`
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
		material.iridescenceFresnel = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.specularColor );
		material.iridescenceF0 = Schlick_to_F0( material.iridescenceFresnel, 1.0, dotNVi );
	}
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
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS )
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
#endif
#if defined( RE_IndirectSpecular )
	vec3 radiance = vec3( 0.0 );
	vec3 clearcoatRadiance = vec3( 0.0 );
#endif`,lx=`#if defined( RE_IndirectDiffuse )
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
		irradiance += lightMapIrradiance;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD ) && defined( ENVMAP_TYPE_CUBE_UV )
		iblIrradiance += getIBLIrradiance( geometryNormal );
	#endif
#endif
#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )
	#ifdef USE_ANISOTROPY
		radiance += getIBLAnisotropyRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
	#else
		radiance += getIBLRadiance( geometryViewDir, geometryNormal, material.roughness );
	#endif
	#ifdef USE_CLEARCOAT
		clearcoatRadiance += getIBLRadiance( geometryViewDir, geometryClearcoatNormal, material.clearcoatRoughness );
	#endif
#endif`,cx=`#if defined( RE_IndirectDiffuse )
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,hx=`#if defined( USE_LOGDEPTHBUF )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,ux=`#if defined( USE_LOGDEPTHBUF )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,dx=`#ifdef USE_LOGDEPTHBUF
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,fx=`#ifdef USE_LOGDEPTHBUF
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,px=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,mx=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,gx=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
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
#endif`,_x=`#if defined( USE_POINTS_UV )
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
#endif`,xx=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,vx=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,yx=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,Mx=`#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,Ex=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,bx=`#ifdef USE_MORPHTARGETS
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
#endif`,Sx=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,Tx=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
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
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
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
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn2[0] *= faceDirection;
		tbn2[1] *= faceDirection;
	#endif
#endif
vec3 nonPerturbedNormal = normal;`,wx=`#ifdef USE_NORMALMAP_OBJECTSPACE
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
	mapN.xy *= normalScale;
	normal = normalize( tbn * mapN );
#elif defined( USE_BUMPMAP )
	normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );
#endif`,Ax=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,Rx=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,Cx=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
	#endif
#endif`,Px=`#ifdef USE_NORMALMAP
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
#endif`,Ix=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,Dx=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,Lx=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,Ux=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,Nx=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,Ox=`vec3 packNormalToRGB( const in vec3 normal ) {
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
	return depth * ( near - far ) - near;
}
float viewZToPerspectiveDepth( const in float viewZ, const in float near, const in float far ) {
	return ( ( near + viewZ ) * far ) / ( ( far - near ) * viewZ );
}
float perspectiveDepthToViewZ( const in float depth, const in float near, const in float far ) {
	return ( near * far ) / ( ( far - near ) * depth - far );
}`,Fx=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,Bx=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,zx=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,kx=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,Hx=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,Vx=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,Gx=`#if NUM_SPOT_LIGHT_COORDS > 0
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#if NUM_SPOT_LIGHT_MAPS > 0
	uniform sampler2D spotLightMap[ NUM_SPOT_LIGHT_MAPS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform sampler2D directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
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
		uniform sampler2D spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
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
		uniform sampler2D pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
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
	float texture2DCompare( sampler2D depths, vec2 uv, float compare ) {
		return step( compare, unpackRGBAToDepth( texture2D( depths, uv ) ) );
	}
	vec2 texture2DDistribution( sampler2D shadow, vec2 uv ) {
		return unpackRGBATo2Half( texture2D( shadow, uv ) );
	}
	float VSMShadow (sampler2D shadow, vec2 uv, float compare ){
		float occlusion = 1.0;
		vec2 distribution = texture2DDistribution( shadow, uv );
		float hard_shadow = step( compare , distribution.x );
		if (hard_shadow != 1.0 ) {
			float distance = compare - distribution.x ;
			float variance = max( 0.00000, distribution.y * distribution.y );
			float softness_probability = variance / (variance + distance * distance );			softness_probability = clamp( ( softness_probability - 0.3 ) / ( 0.95 - 0.3 ), 0.0, 1.0 );			occlusion = clamp( max( hard_shadow, softness_probability ), 0.0, 1.0 );
		}
		return occlusion;
	}
	float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
		float shadow = 1.0;
		shadowCoord.xyz /= shadowCoord.w;
		shadowCoord.z += shadowBias;
		bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
		bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
		if ( frustumTest ) {
		#if defined( SHADOWMAP_TYPE_PCF )
			vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
			float dx0 = - texelSize.x * shadowRadius;
			float dy0 = - texelSize.y * shadowRadius;
			float dx1 = + texelSize.x * shadowRadius;
			float dy1 = + texelSize.y * shadowRadius;
			float dx2 = dx0 / 2.0;
			float dy2 = dy0 / 2.0;
			float dx3 = dx1 / 2.0;
			float dy3 = dy1 / 2.0;
			shadow = (
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy1 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy1 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy1 ), shadowCoord.z )
			) * ( 1.0 / 17.0 );
		#elif defined( SHADOWMAP_TYPE_PCF_SOFT )
			vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
			float dx = texelSize.x;
			float dy = texelSize.y;
			vec2 uv = shadowCoord.xy;
			vec2 f = fract( uv * shadowMapSize + 0.5 );
			uv -= f * texelSize;
			shadow = (
				texture2DCompare( shadowMap, uv, shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + vec2( dx, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + vec2( 0.0, dy ), shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + texelSize, shadowCoord.z ) +
				mix( texture2DCompare( shadowMap, uv + vec2( -dx, 0.0 ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 0.0 ), shadowCoord.z ),
					 f.x ) +
				mix( texture2DCompare( shadowMap, uv + vec2( -dx, dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, dy ), shadowCoord.z ),
					 f.x ) +
				mix( texture2DCompare( shadowMap, uv + vec2( 0.0, -dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 0.0, 2.0 * dy ), shadowCoord.z ),
					 f.y ) +
				mix( texture2DCompare( shadowMap, uv + vec2( dx, -dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( dx, 2.0 * dy ), shadowCoord.z ),
					 f.y ) +
				mix( mix( texture2DCompare( shadowMap, uv + vec2( -dx, -dy ), shadowCoord.z ),
						  texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, -dy ), shadowCoord.z ),
						  f.x ),
					 mix( texture2DCompare( shadowMap, uv + vec2( -dx, 2.0 * dy ), shadowCoord.z ),
						  texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 2.0 * dy ), shadowCoord.z ),
						  f.x ),
					 f.y )
			) * ( 1.0 / 9.0 );
		#elif defined( SHADOWMAP_TYPE_VSM )
			shadow = VSMShadow( shadowMap, shadowCoord.xy, shadowCoord.z );
		#else
			shadow = texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z );
		#endif
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	vec2 cubeToUV( vec3 v, float texelSizeY ) {
		vec3 absV = abs( v );
		float scaleToCube = 1.0 / max( absV.x, max( absV.y, absV.z ) );
		absV *= scaleToCube;
		v *= scaleToCube * ( 1.0 - 2.0 * texelSizeY );
		vec2 planar = v.xy;
		float almostATexel = 1.5 * texelSizeY;
		float almostOne = 1.0 - almostATexel;
		if ( absV.z >= almostOne ) {
			if ( v.z > 0.0 )
				planar.x = 4.0 - v.x;
		} else if ( absV.x >= almostOne ) {
			float signX = sign( v.x );
			planar.x = v.z * signX + 2.0 * signX;
		} else if ( absV.y >= almostOne ) {
			float signY = sign( v.y );
			planar.x = v.x + 2.0 * signY + 2.0;
			planar.y = v.z * signY - 2.0;
		}
		return vec2( 0.125, 0.25 ) * planar + vec2( 0.375, 0.75 );
	}
	float getPointShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		
		float lightToPositionLength = length( lightToPosition );
		if ( lightToPositionLength - shadowCameraFar <= 0.0 && lightToPositionLength - shadowCameraNear >= 0.0 ) {
			float dp = ( lightToPositionLength - shadowCameraNear ) / ( shadowCameraFar - shadowCameraNear );			dp += shadowBias;
			vec3 bd3D = normalize( lightToPosition );
			vec2 texelSize = vec2( 1.0 ) / ( shadowMapSize * vec2( 4.0, 2.0 ) );
			#if defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_PCF_SOFT ) || defined( SHADOWMAP_TYPE_VSM )
				vec2 offset = vec2( - 1, 1 ) * shadowRadius * texelSize.y;
				shadow = (
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxx, texelSize.y ), dp )
				) * ( 1.0 / 9.0 );
			#else
				shadow = texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp );
			#endif
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
#endif`,Wx=`#if NUM_SPOT_LIGHT_COORDS > 0
	uniform mat4 spotLightMatrix[ NUM_SPOT_LIGHT_COORDS ];
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#ifdef USE_SHADOWMAP
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
#endif`,Xx=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
	vec3 shadowWorldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
	vec4 shadowWorldPosition;
#endif
#if defined( USE_SHADOWMAP )
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
#endif`,Yx=`float getShadowMask() {
	float shadow = 1.0;
	#ifdef USE_SHADOWMAP
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
	#if NUM_POINT_LIGHT_SHADOWS > 0
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
}`,qx=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,Zx=`#ifdef USE_SKINNING
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
#endif`,Kx=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,$x=`#ifdef USE_SKINNING
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
#endif`,Jx=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,jx=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,Qx=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,tv=`#ifndef saturate
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
vec3 CustomToneMapping( vec3 color ) { return color; }`,ev=`#ifdef USE_TRANSMISSION
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
	vec3 n = inverseTransformDirection( normal, viewMatrix );
	vec4 transmitted = getIBLVolumeRefraction(
		n, v, material.roughness, material.diffuseColor, material.specularColor, material.specularF90,
		pos, modelMatrix, viewMatrix, projectionMatrix, material.dispersion, material.ior, material.thickness,
		material.attenuationColor, material.attenuationDistance );
	material.transmissionAlpha = mix( material.transmissionAlpha, transmitted.a, material.transmission );
	totalDiffuse = mix( totalDiffuse, transmitted.rgb, material.transmission );
#endif`,nv=`#ifdef USE_TRANSMISSION
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
#endif`,iv=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,sv=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,rv=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,ov=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`,av=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,lv=`uniform sampler2D t2D;
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
}`,cv=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,hv=`#ifdef ENVMAP_TYPE_CUBE
	uniform samplerCube envMap;
#elif defined( ENVMAP_TYPE_CUBE_UV )
	uniform sampler2D envMap;
#endif
uniform float flipEnvMap;
uniform float backgroundBlurriness;
uniform float backgroundIntensity;
uniform mat3 backgroundRotation;
varying vec3 vWorldDirection;
#include <cube_uv_reflection_fragment>
void main() {
	#ifdef ENVMAP_TYPE_CUBE
		vec4 texColor = textureCube( envMap, backgroundRotation * vec3( flipEnvMap * vWorldDirection.x, vWorldDirection.yz ) );
	#elif defined( ENVMAP_TYPE_CUBE_UV )
		vec4 texColor = textureCubeUV( envMap, backgroundRotation * vWorldDirection, backgroundBlurriness );
	#else
		vec4 texColor = vec4( 0.0, 0.0, 0.0, 1.0 );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,uv=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,dv=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,fv=`#include <common>
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
}`,pv=`#if DEPTH_PACKING == 3200
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
	float fragCoordZ = 0.5 * vHighPrecisionZW[0] / vHighPrecisionZW[1] + 0.5;
	#if DEPTH_PACKING == 3200
		gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );
	#elif DEPTH_PACKING == 3201
		gl_FragColor = packDepthToRGBA( fragCoordZ );
	#elif DEPTH_PACKING == 3202
		gl_FragColor = vec4( packDepthToRGB( fragCoordZ ), 1.0 );
	#elif DEPTH_PACKING == 3203
		gl_FragColor = vec4( packDepthToRG( fragCoordZ ), 0.0, 1.0 );
	#endif
}`,mv=`#define DISTANCE
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
}`,gv=`#define DISTANCE
uniform vec3 referencePosition;
uniform float nearDistance;
uniform float farDistance;
varying vec3 vWorldPosition;
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <clipping_planes_pars_fragment>
void main () {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	float dist = length( vWorldPosition - referencePosition );
	dist = ( dist - nearDistance ) / ( farDistance - nearDistance );
	dist = saturate( dist );
	gl_FragColor = packDepthToRGBA( dist );
}`,_v=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,xv=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,vv=`uniform float scale;
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
}`,yv=`uniform vec3 diffuse;
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
}`,Mv=`#include <common>
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
}`,Ev=`uniform vec3 diffuse;
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
}`,bv=`#define LAMBERT
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
}`,Sv=`#define LAMBERT
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <packing>
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
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
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
}`,Tv=`#define MATCAP
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
}`,wv=`#define MATCAP
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
}`,Av=`#define NORMAL
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
}`,Rv=`#define NORMAL
uniform float opacity;
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <packing>
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
	gl_FragColor = vec4( packNormalToRGB( normal ), diffuseColor.a );
	#ifdef OPAQUE
		gl_FragColor.a = 1.0;
	#endif
}`,Cv=`#define PHONG
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
}`,Pv=`#define PHONG
uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;
#include <common>
#include <packing>
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
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
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
}`,Iv=`#define STANDARD
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
}`,Dv=`#define STANDARD
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
#include <packing>
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
		float sheenEnergyComp = 1.0 - 0.157 * max3( material.sheenColor );
		outgoingLight = outgoingLight * sheenEnergyComp + sheenSpecularDirect + sheenSpecularIndirect;
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
}`,Lv=`#define TOON
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
}`,Uv=`#define TOON
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <packing>
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
}`,Nv=`uniform float size;
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
}`,Ov=`uniform vec3 diffuse;
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
}`,Fv=`#include <common>
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
}`,Bv=`uniform vec3 color;
uniform float opacity;
#include <common>
#include <packing>
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
}`,zv=`uniform float rotation;
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
}`,kv=`uniform vec3 diffuse;
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
}`,te={alphahash_fragment:l_,alphahash_pars_fragment:c_,alphamap_fragment:h_,alphamap_pars_fragment:u_,alphatest_fragment:d_,alphatest_pars_fragment:f_,aomap_fragment:p_,aomap_pars_fragment:m_,batching_pars_vertex:g_,batching_vertex:__,begin_vertex:x_,beginnormal_vertex:v_,bsdfs:y_,iridescence_fragment:M_,bumpmap_pars_fragment:E_,clipping_planes_fragment:b_,clipping_planes_pars_fragment:S_,clipping_planes_pars_vertex:T_,clipping_planes_vertex:w_,color_fragment:A_,color_pars_fragment:R_,color_pars_vertex:C_,color_vertex:P_,common:I_,cube_uv_reflection_fragment:D_,defaultnormal_vertex:L_,displacementmap_pars_vertex:U_,displacementmap_vertex:N_,emissivemap_fragment:O_,emissivemap_pars_fragment:F_,colorspace_fragment:B_,colorspace_pars_fragment:z_,envmap_fragment:k_,envmap_common_pars_fragment:H_,envmap_pars_fragment:V_,envmap_pars_vertex:G_,envmap_physical_pars_fragment:tx,envmap_vertex:W_,fog_vertex:X_,fog_pars_vertex:Y_,fog_fragment:q_,fog_pars_fragment:Z_,gradientmap_pars_fragment:K_,lightmap_pars_fragment:$_,lights_lambert_fragment:J_,lights_lambert_pars_fragment:j_,lights_pars_begin:Q_,lights_toon_fragment:ex,lights_toon_pars_fragment:nx,lights_phong_fragment:ix,lights_phong_pars_fragment:sx,lights_physical_fragment:rx,lights_physical_pars_fragment:ox,lights_fragment_begin:ax,lights_fragment_maps:lx,lights_fragment_end:cx,logdepthbuf_fragment:hx,logdepthbuf_pars_fragment:ux,logdepthbuf_pars_vertex:dx,logdepthbuf_vertex:fx,map_fragment:px,map_pars_fragment:mx,map_particle_fragment:gx,map_particle_pars_fragment:_x,metalnessmap_fragment:xx,metalnessmap_pars_fragment:vx,morphinstance_vertex:yx,morphcolor_vertex:Mx,morphnormal_vertex:Ex,morphtarget_pars_vertex:bx,morphtarget_vertex:Sx,normal_fragment_begin:Tx,normal_fragment_maps:wx,normal_pars_fragment:Ax,normal_pars_vertex:Rx,normal_vertex:Cx,normalmap_pars_fragment:Px,clearcoat_normal_fragment_begin:Ix,clearcoat_normal_fragment_maps:Dx,clearcoat_pars_fragment:Lx,iridescence_pars_fragment:Ux,opaque_fragment:Nx,packing:Ox,premultiplied_alpha_fragment:Fx,project_vertex:Bx,dithering_fragment:zx,dithering_pars_fragment:kx,roughnessmap_fragment:Hx,roughnessmap_pars_fragment:Vx,shadowmap_pars_fragment:Gx,shadowmap_pars_vertex:Wx,shadowmap_vertex:Xx,shadowmask_pars_fragment:Yx,skinbase_vertex:qx,skinning_pars_vertex:Zx,skinning_vertex:Kx,skinnormal_vertex:$x,specularmap_fragment:Jx,specularmap_pars_fragment:jx,tonemapping_fragment:Qx,tonemapping_pars_fragment:tv,transmission_fragment:ev,transmission_pars_fragment:nv,uv_pars_fragment:iv,uv_pars_vertex:sv,uv_vertex:rv,worldpos_vertex:ov,background_vert:av,background_frag:lv,backgroundCube_vert:cv,backgroundCube_frag:hv,cube_vert:uv,cube_frag:dv,depth_vert:fv,depth_frag:pv,distanceRGBA_vert:mv,distanceRGBA_frag:gv,equirect_vert:_v,equirect_frag:xv,linedashed_vert:vv,linedashed_frag:yv,meshbasic_vert:Mv,meshbasic_frag:Ev,meshlambert_vert:bv,meshlambert_frag:Sv,meshmatcap_vert:Tv,meshmatcap_frag:wv,meshnormal_vert:Av,meshnormal_frag:Rv,meshphong_vert:Cv,meshphong_frag:Pv,meshphysical_vert:Iv,meshphysical_frag:Dv,meshtoon_vert:Lv,meshtoon_frag:Uv,points_vert:Nv,points_frag:Ov,shadow_vert:Fv,shadow_frag:Bv,sprite_vert:zv,sprite_frag:kv},dt={common:{diffuse:{value:new Yt(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new jt},alphaMap:{value:null},alphaMapTransform:{value:new jt},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new jt}},envmap:{envMap:{value:null},envMapRotation:{value:new jt},flipEnvMap:{value:-1},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new jt}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new jt}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new jt},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new jt},normalScale:{value:new nt(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new jt},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new jt}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new jt}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new jt}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new Yt(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMap:{value:[]},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotShadowMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMap:{value:[]},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null}},points:{diffuse:{value:new Yt(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new jt},alphaTest:{value:0},uvTransform:{value:new jt}},sprite:{diffuse:{value:new Yt(16777215)},opacity:{value:1},center:{value:new nt(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new jt},alphaMap:{value:null},alphaMapTransform:{value:new jt},alphaTest:{value:0}}},ui={basic:{uniforms:gn([dt.common,dt.specularmap,dt.envmap,dt.aomap,dt.lightmap,dt.fog]),vertexShader:te.meshbasic_vert,fragmentShader:te.meshbasic_frag},lambert:{uniforms:gn([dt.common,dt.specularmap,dt.envmap,dt.aomap,dt.lightmap,dt.emissivemap,dt.bumpmap,dt.normalmap,dt.displacementmap,dt.fog,dt.lights,{emissive:{value:new Yt(0)}}]),vertexShader:te.meshlambert_vert,fragmentShader:te.meshlambert_frag},phong:{uniforms:gn([dt.common,dt.specularmap,dt.envmap,dt.aomap,dt.lightmap,dt.emissivemap,dt.bumpmap,dt.normalmap,dt.displacementmap,dt.fog,dt.lights,{emissive:{value:new Yt(0)},specular:{value:new Yt(1118481)},shininess:{value:30}}]),vertexShader:te.meshphong_vert,fragmentShader:te.meshphong_frag},standard:{uniforms:gn([dt.common,dt.envmap,dt.aomap,dt.lightmap,dt.emissivemap,dt.bumpmap,dt.normalmap,dt.displacementmap,dt.roughnessmap,dt.metalnessmap,dt.fog,dt.lights,{emissive:{value:new Yt(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:te.meshphysical_vert,fragmentShader:te.meshphysical_frag},toon:{uniforms:gn([dt.common,dt.aomap,dt.lightmap,dt.emissivemap,dt.bumpmap,dt.normalmap,dt.displacementmap,dt.gradientmap,dt.fog,dt.lights,{emissive:{value:new Yt(0)}}]),vertexShader:te.meshtoon_vert,fragmentShader:te.meshtoon_frag},matcap:{uniforms:gn([dt.common,dt.bumpmap,dt.normalmap,dt.displacementmap,dt.fog,{matcap:{value:null}}]),vertexShader:te.meshmatcap_vert,fragmentShader:te.meshmatcap_frag},points:{uniforms:gn([dt.points,dt.fog]),vertexShader:te.points_vert,fragmentShader:te.points_frag},dashed:{uniforms:gn([dt.common,dt.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:te.linedashed_vert,fragmentShader:te.linedashed_frag},depth:{uniforms:gn([dt.common,dt.displacementmap]),vertexShader:te.depth_vert,fragmentShader:te.depth_frag},normal:{uniforms:gn([dt.common,dt.bumpmap,dt.normalmap,dt.displacementmap,{opacity:{value:1}}]),vertexShader:te.meshnormal_vert,fragmentShader:te.meshnormal_frag},sprite:{uniforms:gn([dt.sprite,dt.fog]),vertexShader:te.sprite_vert,fragmentShader:te.sprite_frag},background:{uniforms:{uvTransform:{value:new jt},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:te.background_vert,fragmentShader:te.background_frag},backgroundCube:{uniforms:{envMap:{value:null},flipEnvMap:{value:-1},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new jt}},vertexShader:te.backgroundCube_vert,fragmentShader:te.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:te.cube_vert,fragmentShader:te.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:te.equirect_vert,fragmentShader:te.equirect_frag},distanceRGBA:{uniforms:gn([dt.common,dt.displacementmap,{referencePosition:{value:new w},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:te.distanceRGBA_vert,fragmentShader:te.distanceRGBA_frag},shadow:{uniforms:gn([dt.lights,dt.fog,{color:{value:new Yt(0)},opacity:{value:1}}]),vertexShader:te.shadow_vert,fragmentShader:te.shadow_frag}};ui.physical={uniforms:gn([ui.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new jt},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new jt},clearcoatNormalScale:{value:new nt(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new jt},dispersion:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new jt},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new jt},sheen:{value:0},sheenColor:{value:new Yt(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new jt},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new jt},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new jt},transmissionSamplerSize:{value:new nt},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new jt},attenuationDistance:{value:0},attenuationColor:{value:new Yt(0)},specularColor:{value:new Yt(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new jt},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new jt},anisotropyVector:{value:new nt},anisotropyMap:{value:null},anisotropyMapTransform:{value:new jt}}]),vertexShader:te.meshphysical_vert,fragmentShader:te.meshphysical_frag};var ka={r:0,b:0,g:0},Us=new pi,Hv=new be;function Vv(n,t,e,i,s,r,o){let a=new Yt(0),l=r===!0?0:1,c,h,u=null,d=0,f=null;function m(S){let M=S.isScene===!0?S.background:null;return M&&M.isTexture&&(M=(S.backgroundBlurriness>0?e:t).get(M)),M}function _(S){let M=!1,x=m(S);x===null?p(a,l):x&&x.isColor&&(p(x,1),M=!0);let L=n.xr.getEnvironmentBlendMode();L==="additive"?i.buffers.color.setClear(0,0,0,1,o):L==="alpha-blend"&&i.buffers.color.setClear(0,0,0,0,o),(n.autoClear||M)&&(i.buffers.depth.setTest(!0),i.buffers.depth.setMask(!0),i.buffers.color.setMask(!0),n.clear(n.autoClearColor,n.autoClearDepth,n.autoClearStencil))}function g(S,M){let x=m(M);x&&(x.isCubeTexture||x.mapping===zl)?(h===void 0&&(h=new Ft(new bn(1,1,1),new cn({name:"BackgroundCubeMaterial",uniforms:Hr(ui.backgroundCube.uniforms),vertexShader:ui.backgroundCube.vertexShader,fragmentShader:ui.backgroundCube.fragmentShader,side:an,depthTest:!1,depthWrite:!1,fog:!1})),h.geometry.deleteAttribute("normal"),h.geometry.deleteAttribute("uv"),h.onBeforeRender=function(L,R,C){this.matrixWorld.copyPosition(C.matrixWorld)},Object.defineProperty(h.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),s.update(h)),Us.copy(M.backgroundRotation),Us.x*=-1,Us.y*=-1,Us.z*=-1,x.isCubeTexture&&x.isRenderTargetTexture===!1&&(Us.y*=-1,Us.z*=-1),h.material.uniforms.envMap.value=x,h.material.uniforms.flipEnvMap.value=x.isCubeTexture&&x.isRenderTargetTexture===!1?-1:1,h.material.uniforms.backgroundBlurriness.value=M.backgroundBlurriness,h.material.uniforms.backgroundIntensity.value=M.backgroundIntensity,h.material.uniforms.backgroundRotation.value.setFromMatrix4(Hv.makeRotationFromEuler(Us)),h.material.toneMapped=oe.getTransfer(x.colorSpace)!==xe,(u!==x||d!==x.version||f!==n.toneMapping)&&(h.material.needsUpdate=!0,u=x,d=x.version,f=n.toneMapping),h.layers.enableAll(),S.unshift(h,h.geometry,h.material,0,0,null)):x&&x.isTexture&&(c===void 0&&(c=new Ft(new ni(2,2),new cn({name:"BackgroundMaterial",uniforms:Hr(ui.background.uniforms),vertexShader:ui.background.vertexShader,fragmentShader:ui.background.fragmentShader,side:rs,depthTest:!1,depthWrite:!1,fog:!1})),c.geometry.deleteAttribute("normal"),Object.defineProperty(c.material,"map",{get:function(){return this.uniforms.t2D.value}}),s.update(c)),c.material.uniforms.t2D.value=x,c.material.uniforms.backgroundIntensity.value=M.backgroundIntensity,c.material.toneMapped=oe.getTransfer(x.colorSpace)!==xe,x.matrixAutoUpdate===!0&&x.updateMatrix(),c.material.uniforms.uvTransform.value.copy(x.matrix),(u!==x||d!==x.version||f!==n.toneMapping)&&(c.material.needsUpdate=!0,u=x,d=x.version,f=n.toneMapping),c.layers.enableAll(),S.unshift(c,c.geometry,c.material,0,0,null))}function p(S,M){S.getRGB(ka,Jp(n)),i.buffers.color.setClear(ka.r,ka.g,ka.b,M,o)}return{getClearColor:function(){return a},setClearColor:function(S,M=1){a.set(S),l=M,p(a,l)},getClearAlpha:function(){return l},setClearAlpha:function(S){l=S,p(a,l)},render:_,addToRenderList:g}}function Gv(n,t){let e=n.getParameter(n.MAX_VERTEX_ATTRIBS),i={},s=d(null),r=s,o=!1;function a(y,I,Y,V,F){let X=!1,z=u(V,Y,I);r!==z&&(r=z,c(r.object)),X=f(y,V,Y,F),X&&m(y,V,Y,F),F!==null&&t.update(F,n.ELEMENT_ARRAY_BUFFER),(X||o)&&(o=!1,x(y,I,Y,V),F!==null&&n.bindBuffer(n.ELEMENT_ARRAY_BUFFER,t.get(F).buffer))}function l(){return n.createVertexArray()}function c(y){return n.bindVertexArray(y)}function h(y){return n.deleteVertexArray(y)}function u(y,I,Y){let V=Y.wireframe===!0,F=i[y.id];F===void 0&&(F={},i[y.id]=F);let X=F[I.id];X===void 0&&(X={},F[I.id]=X);let z=X[V];return z===void 0&&(z=d(l()),X[V]=z),z}function d(y){let I=[],Y=[],V=[];for(let F=0;F<e;F++)I[F]=0,Y[F]=0,V[F]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:I,enabledAttributes:Y,attributeDivisors:V,object:y,attributes:{},index:null}}function f(y,I,Y,V){let F=r.attributes,X=I.attributes,z=0,J=Y.getAttributes();for(let k in J)if(J[k].location>=0){let ct=F[k],mt=X[k];if(mt===void 0&&(k==="instanceMatrix"&&y.instanceMatrix&&(mt=y.instanceMatrix),k==="instanceColor"&&y.instanceColor&&(mt=y.instanceColor)),ct===void 0||ct.attribute!==mt||mt&&ct.data!==mt.data)return!0;z++}return r.attributesNum!==z||r.index!==V}function m(y,I,Y,V){let F={},X=I.attributes,z=0,J=Y.getAttributes();for(let k in J)if(J[k].location>=0){let ct=X[k];ct===void 0&&(k==="instanceMatrix"&&y.instanceMatrix&&(ct=y.instanceMatrix),k==="instanceColor"&&y.instanceColor&&(ct=y.instanceColor));let mt={};mt.attribute=ct,ct&&ct.data&&(mt.data=ct.data),F[k]=mt,z++}r.attributes=F,r.attributesNum=z,r.index=V}function _(){let y=r.newAttributes;for(let I=0,Y=y.length;I<Y;I++)y[I]=0}function g(y){p(y,0)}function p(y,I){let Y=r.newAttributes,V=r.enabledAttributes,F=r.attributeDivisors;Y[y]=1,V[y]===0&&(n.enableVertexAttribArray(y),V[y]=1),F[y]!==I&&(n.vertexAttribDivisor(y,I),F[y]=I)}function S(){let y=r.newAttributes,I=r.enabledAttributes;for(let Y=0,V=I.length;Y<V;Y++)I[Y]!==y[Y]&&(n.disableVertexAttribArray(Y),I[Y]=0)}function M(y,I,Y,V,F,X,z){z===!0?n.vertexAttribIPointer(y,I,Y,F,X):n.vertexAttribPointer(y,I,Y,V,F,X)}function x(y,I,Y,V){_();let F=V.attributes,X=Y.getAttributes(),z=I.defaultAttributeValues;for(let J in X){let k=X[J];if(k.location>=0){let rt=F[J];if(rt===void 0&&(J==="instanceMatrix"&&y.instanceMatrix&&(rt=y.instanceMatrix),J==="instanceColor"&&y.instanceColor&&(rt=y.instanceColor)),rt!==void 0){let ct=rt.normalized,mt=rt.itemSize,kt=t.get(rt);if(kt===void 0)continue;let Xt=kt.buffer,Z=kt.type,st=kt.bytesPerElement,Tt=Z===n.INT||Z===n.UNSIGNED_INT||rt.gpuType===Wu;if(rt.isInterleavedBufferAttribute){let ht=rt.data,Bt=ht.stride,Zt=rt.offset;if(ht.isInstancedInterleavedBuffer){for(let Gt=0;Gt<k.locationSize;Gt++)p(k.location+Gt,ht.meshPerAttribute);y.isInstancedMesh!==!0&&V._maxInstanceCount===void 0&&(V._maxInstanceCount=ht.meshPerAttribute*ht.count)}else for(let Gt=0;Gt<k.locationSize;Gt++)g(k.location+Gt);n.bindBuffer(n.ARRAY_BUFFER,Xt);for(let Gt=0;Gt<k.locationSize;Gt++)M(k.location+Gt,mt/k.locationSize,Z,ct,Bt*st,(Zt+mt/k.locationSize*Gt)*st,Tt)}else{if(rt.isInstancedBufferAttribute){for(let ht=0;ht<k.locationSize;ht++)p(k.location+ht,rt.meshPerAttribute);y.isInstancedMesh!==!0&&V._maxInstanceCount===void 0&&(V._maxInstanceCount=rt.meshPerAttribute*rt.count)}else for(let ht=0;ht<k.locationSize;ht++)g(k.location+ht);n.bindBuffer(n.ARRAY_BUFFER,Xt);for(let ht=0;ht<k.locationSize;ht++)M(k.location+ht,mt/k.locationSize,Z,ct,mt*st,mt/k.locationSize*ht*st,Tt)}}else if(z!==void 0){let ct=z[J];if(ct!==void 0)switch(ct.length){case 2:n.vertexAttrib2fv(k.location,ct);break;case 3:n.vertexAttrib3fv(k.location,ct);break;case 4:n.vertexAttrib4fv(k.location,ct);break;default:n.vertexAttrib1fv(k.location,ct)}}}}S()}function L(){D();for(let y in i){let I=i[y];for(let Y in I){let V=I[Y];for(let F in V)h(V[F].object),delete V[F];delete I[Y]}delete i[y]}}function R(y){if(i[y.id]===void 0)return;let I=i[y.id];for(let Y in I){let V=I[Y];for(let F in V)h(V[F].object),delete V[F];delete I[Y]}delete i[y.id]}function C(y){for(let I in i){let Y=i[I];if(Y[y.id]===void 0)continue;let V=Y[y.id];for(let F in V)h(V[F].object),delete V[F];delete Y[y.id]}}function D(){b(),o=!0,r!==s&&(r=s,c(r.object))}function b(){s.geometry=null,s.program=null,s.wireframe=!1}return{setup:a,reset:D,resetDefaultState:b,dispose:L,releaseStatesOfGeometry:R,releaseStatesOfProgram:C,initAttributes:_,enableAttribute:g,disableUnusedAttributes:S}}function Wv(n,t,e){let i;function s(c){i=c}function r(c,h){n.drawArrays(i,c,h),e.update(h,i,1)}function o(c,h,u){u!==0&&(n.drawArraysInstanced(i,c,h,u),e.update(h,i,u))}function a(c,h,u){if(u===0)return;t.get("WEBGL_multi_draw").multiDrawArraysWEBGL(i,c,0,h,0,u);let f=0;for(let m=0;m<u;m++)f+=h[m];e.update(f,i,1)}function l(c,h,u,d){if(u===0)return;let f=t.get("WEBGL_multi_draw");if(f===null)for(let m=0;m<c.length;m++)o(c[m],h[m],d[m]);else{f.multiDrawArraysInstancedWEBGL(i,c,0,h,0,d,0,u);let m=0;for(let _=0;_<u;_++)m+=h[_]*d[_];e.update(m,i,1)}}this.setMode=s,this.render=r,this.renderInstances=o,this.renderMultiDraw=a,this.renderMultiDrawInstances=l}function Xv(n,t,e,i){let s;function r(){if(s!==void 0)return s;if(t.has("EXT_texture_filter_anisotropic")===!0){let C=t.get("EXT_texture_filter_anisotropic");s=n.getParameter(C.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else s=0;return s}function o(C){return!(C!==Qn&&i.convert(C)!==n.getParameter(n.IMPLEMENTATION_COLOR_READ_FORMAT))}function a(C){let D=C===Fi&&(t.has("EXT_color_buffer_half_float")||t.has("EXT_color_buffer_float"));return!(C!==Li&&i.convert(C)!==n.getParameter(n.IMPLEMENTATION_COLOR_READ_TYPE)&&C!==fi&&!D)}function l(C){if(C==="highp"){if(n.getShaderPrecisionFormat(n.VERTEX_SHADER,n.HIGH_FLOAT).precision>0&&n.getShaderPrecisionFormat(n.FRAGMENT_SHADER,n.HIGH_FLOAT).precision>0)return"highp";C="mediump"}return C==="mediump"&&n.getShaderPrecisionFormat(n.VERTEX_SHADER,n.MEDIUM_FLOAT).precision>0&&n.getShaderPrecisionFormat(n.FRAGMENT_SHADER,n.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let c=e.precision!==void 0?e.precision:"highp",h=l(c);h!==c&&(console.warn("THREE.WebGLRenderer:",c,"not supported, using",h,"instead."),c=h);let u=e.logarithmicDepthBuffer===!0,d=e.reverseDepthBuffer===!0&&t.has("EXT_clip_control"),f=n.getParameter(n.MAX_TEXTURE_IMAGE_UNITS),m=n.getParameter(n.MAX_VERTEX_TEXTURE_IMAGE_UNITS),_=n.getParameter(n.MAX_TEXTURE_SIZE),g=n.getParameter(n.MAX_CUBE_MAP_TEXTURE_SIZE),p=n.getParameter(n.MAX_VERTEX_ATTRIBS),S=n.getParameter(n.MAX_VERTEX_UNIFORM_VECTORS),M=n.getParameter(n.MAX_VARYING_VECTORS),x=n.getParameter(n.MAX_FRAGMENT_UNIFORM_VECTORS),L=m>0,R=n.getParameter(n.MAX_SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:r,getMaxPrecision:l,textureFormatReadable:o,textureTypeReadable:a,precision:c,logarithmicDepthBuffer:u,reverseDepthBuffer:d,maxTextures:f,maxVertexTextures:m,maxTextureSize:_,maxCubemapSize:g,maxAttributes:p,maxVertexUniforms:S,maxVaryings:M,maxFragmentUniforms:x,vertexTextures:L,maxSamples:R}}function Yv(n){let t=this,e=null,i=0,s=!1,r=!1,o=new In,a=new jt,l={value:null,needsUpdate:!1};this.uniform=l,this.numPlanes=0,this.numIntersection=0,this.init=function(u,d){let f=u.length!==0||d||i!==0||s;return s=d,i=u.length,f},this.beginShadows=function(){r=!0,h(null)},this.endShadows=function(){r=!1},this.setGlobalState=function(u,d){e=h(u,d,0)},this.setState=function(u,d,f){let m=u.clippingPlanes,_=u.clipIntersection,g=u.clipShadows,p=n.get(u);if(!s||m===null||m.length===0||r&&!g)r?h(null):c();else{let S=r?0:i,M=S*4,x=p.clippingState||null;l.value=x,x=h(m,d,M,f);for(let L=0;L!==M;++L)x[L]=e[L];p.clippingState=x,this.numIntersection=_?this.numPlanes:0,this.numPlanes+=S}};function c(){l.value!==e&&(l.value=e,l.needsUpdate=i>0),t.numPlanes=i,t.numIntersection=0}function h(u,d,f,m){let _=u!==null?u.length:0,g=null;if(_!==0){if(g=l.value,m!==!0||g===null){let p=f+_*4,S=d.matrixWorldInverse;a.getNormalMatrix(S),(g===null||g.length<p)&&(g=new Float32Array(p));for(let M=0,x=f;M!==_;++M,x+=4)o.copy(u[M]).applyMatrix4(S,a),o.normal.toArray(g,x),g[x+3]=o.constant}l.value=g,l.needsUpdate=!0}return t.numPlanes=_,t.numIntersection=0,g}}function qv(n){let t=new WeakMap;function e(o,a){return a===Ch?o.mapping=Fr:a===Ph&&(o.mapping=Br),o}function i(o){if(o&&o.isTexture){let a=o.mapping;if(a===Ch||a===Ph)if(t.has(o)){let l=t.get(o).texture;return e(l,o.mapping)}else{let l=o.image;if(l&&l.height>0){let c=new cu(l.height);return c.fromEquirectangularTexture(n,o),t.set(o,c),o.addEventListener("dispose",s),e(c.texture,o.mapping)}else return null}}return o}function s(o){let a=o.target;a.removeEventListener("dispose",s);let l=t.get(a);l!==void 0&&(t.delete(a),l.dispose())}function r(){t=new WeakMap}return{get:i,dispose:r}}var Vr=class extends al{constructor(t=-1,e=1,i=1,s=-1,r=.1,o=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=t,this.right=e,this.top=i,this.bottom=s,this.near=r,this.far=o,this.updateProjectionMatrix()}copy(t,e){return super.copy(t,e),this.left=t.left,this.right=t.right,this.top=t.top,this.bottom=t.bottom,this.near=t.near,this.far=t.far,this.zoom=t.zoom,this.view=t.view===null?null:Object.assign({},t.view),this}setViewOffset(t,e,i,s,r,o){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=t,this.view.fullHeight=e,this.view.offsetX=i,this.view.offsetY=s,this.view.width=r,this.view.height=o,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let t=(this.right-this.left)/(2*this.zoom),e=(this.top-this.bottom)/(2*this.zoom),i=(this.right+this.left)/2,s=(this.top+this.bottom)/2,r=i-t,o=i+t,a=s+e,l=s-e;if(this.view!==null&&this.view.enabled){let c=(this.right-this.left)/this.view.fullWidth/this.zoom,h=(this.top-this.bottom)/this.view.fullHeight/this.zoom;r+=c*this.view.offsetX,o=r+c*this.view.width,a-=h*this.view.offsetY,l=a-h*this.view.height}this.projectionMatrix.makeOrthographic(r,o,a,l,this.near,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(t){let e=super.toJSON(t);return e.object.zoom=this.zoom,e.object.left=this.left,e.object.right=this.right,e.object.top=this.top,e.object.bottom=this.bottom,e.object.near=this.near,e.object.far=this.far,this.view!==null&&(e.object.view=Object.assign({},this.view)),e}},Pr=4,$f=[.125,.215,.35,.446,.526,.582],zs=20,lh=new Vr,Jf=new Yt,ch=null,hh=0,uh=0,dh=!1,Os=(1+Math.sqrt(5))/2,Ar=1/Os,jf=[new w(-Os,Ar,0),new w(Os,Ar,0),new w(-Ar,0,Os),new w(Ar,0,Os),new w(0,Os,-Ar),new w(0,Os,Ar),new w(-1,1,-1),new w(1,1,-1),new w(-1,1,1),new w(1,1,1)],Gr=class{constructor(t){this._renderer=t,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._lodPlanes=[],this._sizeLods=[],this._sigmas=[],this._blurMaterial=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._compileMaterial(this._blurMaterial)}fromScene(t,e=0,i=.1,s=100){ch=this._renderer.getRenderTarget(),hh=this._renderer.getActiveCubeFace(),uh=this._renderer.getActiveMipmapLevel(),dh=this._renderer.xr.enabled,this._renderer.xr.enabled=!1,this._setSize(256);let r=this._allocateTargets();return r.depthBuffer=!0,this._sceneToCubeUV(t,i,s,r),e>0&&this._blur(r,0,0,e),this._applyPMREM(r),this._cleanup(r),r}fromEquirectangular(t,e=null){return this._fromTexture(t,e)}fromCubemap(t,e=null){return this._fromTexture(t,e)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=ep(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=tp(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose()}_setSize(t){this._lodMax=Math.floor(Math.log2(t)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let t=0;t<this._lodPlanes.length;t++)this._lodPlanes[t].dispose()}_cleanup(t){this._renderer.setRenderTarget(ch,hh,uh),this._renderer.xr.enabled=dh,t.scissorTest=!1,Ha(t,0,0,t.width,t.height)}_fromTexture(t,e){t.mapping===Fr||t.mapping===Br?this._setSize(t.image.length===0?16:t.image[0].width||t.image[0].image.width):this._setSize(t.image.width/4),ch=this._renderer.getRenderTarget(),hh=this._renderer.getActiveCubeFace(),uh=this._renderer.getActiveMipmapLevel(),dh=this._renderer.xr.enabled,this._renderer.xr.enabled=!1;let i=e||this._allocateTargets();return this._textureToCubeUV(t,i),this._applyPMREM(i),this._cleanup(i),i}_allocateTargets(){let t=3*Math.max(this._cubeSize,112),e=4*this._cubeSize,i={magFilter:di,minFilter:di,generateMipmaps:!1,type:Fi,format:Qn,colorSpace:Yr,depthBuffer:!1},s=Qf(t,e,i);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==t||this._pingPongRenderTarget.height!==e){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=Qf(t,e,i);let{_lodMax:r}=this;({sizeLods:this._sizeLods,lodPlanes:this._lodPlanes,sigmas:this._sigmas}=Zv(r)),this._blurMaterial=Kv(r,t,e)}return s}_compileMaterial(t){let e=new Ft(this._lodPlanes[0],t);this._renderer.compile(e,lh)}_sceneToCubeUV(t,e,i,s){let a=new tn(90,1,e,i),l=[1,-1,1,1,1,1],c=[1,1,1,-1,-1,-1],h=this._renderer,u=h.autoClear,d=h.toneMapping;h.getClearColor(Jf),h.toneMapping=is,h.autoClear=!1;let f=new Je({name:"PMREM.Background",side:an,depthWrite:!1,depthTest:!1}),m=new Ft(new bn,f),_=!1,g=t.background;g?g.isColor&&(f.color.copy(g),t.background=null,_=!0):(f.color.copy(Jf),_=!0);for(let p=0;p<6;p++){let S=p%3;S===0?(a.up.set(0,l[p],0),a.lookAt(c[p],0,0)):S===1?(a.up.set(0,0,l[p]),a.lookAt(0,c[p],0)):(a.up.set(0,l[p],0),a.lookAt(0,0,c[p]));let M=this._cubeSize;Ha(s,S*M,p>2?M:0,M,M),h.setRenderTarget(s),_&&h.render(m,a),h.render(t,a)}m.geometry.dispose(),m.material.dispose(),h.toneMapping=d,h.autoClear=u,t.background=g}_textureToCubeUV(t,e){let i=this._renderer,s=t.mapping===Fr||t.mapping===Br;s?(this._cubemapMaterial===null&&(this._cubemapMaterial=ep()),this._cubemapMaterial.uniforms.flipEnvMap.value=t.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=tp());let r=s?this._cubemapMaterial:this._equirectMaterial,o=new Ft(this._lodPlanes[0],r),a=r.uniforms;a.envMap.value=t;let l=this._cubeSize;Ha(e,0,0,3*l,2*l),i.setRenderTarget(e),i.render(o,lh)}_applyPMREM(t){let e=this._renderer,i=e.autoClear;e.autoClear=!1;let s=this._lodPlanes.length;for(let r=1;r<s;r++){let o=Math.sqrt(this._sigmas[r]*this._sigmas[r]-this._sigmas[r-1]*this._sigmas[r-1]),a=jf[(s-r-1)%jf.length];this._blur(t,r-1,r,o,a)}e.autoClear=i}_blur(t,e,i,s,r){let o=this._pingPongRenderTarget;this._halfBlur(t,o,e,i,s,"latitudinal",r),this._halfBlur(o,t,i,i,s,"longitudinal",r)}_halfBlur(t,e,i,s,r,o,a){let l=this._renderer,c=this._blurMaterial;o!=="latitudinal"&&o!=="longitudinal"&&console.error("blur direction must be either latitudinal or longitudinal!");let h=3,u=new Ft(this._lodPlanes[s],c),d=c.uniforms,f=this._sizeLods[i]-1,m=isFinite(r)?Math.PI/(2*f):2*Math.PI/(2*zs-1),_=r/m,g=isFinite(r)?1+Math.floor(h*_):zs;g>zs&&console.warn(`sigmaRadians, ${r}, is too large and will clip, as it requested ${g} samples when the maximum is set to ${zs}`);let p=[],S=0;for(let C=0;C<zs;++C){let D=C/_,b=Math.exp(-D*D/2);p.push(b),C===0?S+=b:C<g&&(S+=2*b)}for(let C=0;C<p.length;C++)p[C]=p[C]/S;d.envMap.value=t.texture,d.samples.value=g,d.weights.value=p,d.latitudinal.value=o==="latitudinal",a&&(d.poleAxis.value=a);let{_lodMax:M}=this;d.dTheta.value=m,d.mipInt.value=M-i;let x=this._sizeLods[s],L=3*x*(s>M-Pr?s-M+Pr:0),R=4*(this._cubeSize-x);Ha(e,L,R,3*x,2*x),l.setRenderTarget(e),l.render(u,lh)}};function Zv(n){let t=[],e=[],i=[],s=n,r=n-Pr+1+$f.length;for(let o=0;o<r;o++){let a=Math.pow(2,s);e.push(a);let l=1/a;o>n-Pr?l=$f[o-n+Pr-1]:o===0&&(l=0),i.push(l);let c=1/(a-2),h=-c,u=1+c,d=[h,h,u,h,u,u,h,h,u,u,h,u],f=6,m=6,_=3,g=2,p=1,S=new Float32Array(_*m*f),M=new Float32Array(g*m*f),x=new Float32Array(p*m*f);for(let R=0;R<f;R++){let C=R%3*2/3-1,D=R>2?0:-1,b=[C,D,0,C+2/3,D,0,C+2/3,D+1,0,C,D,0,C+2/3,D+1,0,C,D+1,0];S.set(b,_*m*R),M.set(d,g*m*R);let y=[R,R,R,R,R,R];x.set(y,p*m*R)}let L=new Fe;L.setAttribute("position",new en(S,_)),L.setAttribute("uv",new en(M,g)),L.setAttribute("faceIndex",new en(x,p)),t.push(L),s>Pr&&s--}return{lodPlanes:t,sizeLods:e,sigmas:i}}function Qf(n,t,e){let i=new xn(n,t,e);return i.texture.mapping=zl,i.texture.name="PMREM.cubeUv",i.scissorTest=!0,i}function Ha(n,t,e,i,s){n.viewport.set(t,e,i,s),n.scissor.set(t,e,i,s)}function Kv(n,t,e){let i=new Float32Array(zs),s=new w(0,1,0);return new cn({name:"SphericalGaussianBlur",defines:{n:zs,CUBEUV_TEXEL_WIDTH:1/t,CUBEUV_TEXEL_HEIGHT:1/e,CUBEUV_MAX_MIP:`${n}.0`},uniforms:{envMap:{value:null},samples:{value:1},weights:{value:i},latitudinal:{value:!1},dTheta:{value:0},mipInt:{value:0},poleAxis:{value:s}},vertexShader:Qu(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform int samples;
			uniform float weights[ n ];
			uniform bool latitudinal;
			uniform float dTheta;
			uniform float mipInt;
			uniform vec3 poleAxis;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			vec3 getSample( float theta, vec3 axis ) {

				float cosTheta = cos( theta );
				// Rodrigues' axis-angle rotation
				vec3 sampleDirection = vOutputDirection * cosTheta
					+ cross( axis, vOutputDirection ) * sin( theta )
					+ axis * dot( axis, vOutputDirection ) * ( 1.0 - cosTheta );

				return bilinearCubeUV( envMap, sampleDirection, mipInt );

			}

			void main() {

				vec3 axis = latitudinal ? poleAxis : cross( poleAxis, vOutputDirection );

				if ( all( equal( axis, vec3( 0.0 ) ) ) ) {

					axis = vec3( vOutputDirection.z, 0.0, - vOutputDirection.x );

				}

				axis = normalize( axis );

				gl_FragColor = vec4( 0.0, 0.0, 0.0, 1.0 );
				gl_FragColor.rgb += weights[ 0 ] * getSample( 0.0, axis );

				for ( int i = 1; i < n; i++ ) {

					if ( i >= samples ) {

						break;

					}

					float theta = dTheta * float( i );
					gl_FragColor.rgb += weights[ i ] * getSample( -1.0 * theta, axis );
					gl_FragColor.rgb += weights[ i ] * getSample( theta, axis );

				}

			}
		`,blending:Gn,depthTest:!1,depthWrite:!1})}function tp(){return new cn({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:Qu(),fragmentShader:`

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
		`,blending:Gn,depthTest:!1,depthWrite:!1})}function ep(){return new cn({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:Qu(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:Gn,depthTest:!1,depthWrite:!1})}function Qu(){return`

		precision mediump float;
		precision mediump int;

		attribute float faceIndex;

		varying vec3 vOutputDirection;

		// RH coordinate system; PMREM face-indexing convention
		vec3 getDirection( vec2 uv, float face ) {

			uv = 2.0 * uv - 1.0;

			vec3 direction = vec3( uv, 1.0 );

			if ( face == 0.0 ) {

				direction = direction.zyx; // ( 1, v, u ) pos x

			} else if ( face == 1.0 ) {

				direction = direction.xzy;
				direction.xz *= -1.0; // ( -u, 1, -v ) pos y

			} else if ( face == 2.0 ) {

				direction.x *= -1.0; // ( -u, v, 1 ) pos z

			} else if ( face == 3.0 ) {

				direction = direction.zyx;
				direction.xz *= -1.0; // ( -1, v, -u ) neg x

			} else if ( face == 4.0 ) {

				direction = direction.xzy;
				direction.xy *= -1.0; // ( -u, -1, v ) neg y

			} else if ( face == 5.0 ) {

				direction.z *= -1.0; // ( u, v, -1 ) neg z

			}

			return direction;

		}

		void main() {

			vOutputDirection = getDirection( uv, faceIndex );
			gl_Position = vec4( position, 1.0 );

		}
	`}function $v(n){let t=new WeakMap,e=null;function i(a){if(a&&a.isTexture){let l=a.mapping,c=l===Ch||l===Ph,h=l===Fr||l===Br;if(c||h){let u=t.get(a),d=u!==void 0?u.texture.pmremVersion:0;if(a.isRenderTargetTexture&&a.pmremVersion!==d)return e===null&&(e=new Gr(n)),u=c?e.fromEquirectangular(a,u):e.fromCubemap(a,u),u.texture.pmremVersion=a.pmremVersion,t.set(a,u),u.texture;if(u!==void 0)return u.texture;{let f=a.image;return c&&f&&f.height>0||h&&f&&s(f)?(e===null&&(e=new Gr(n)),u=c?e.fromEquirectangular(a):e.fromCubemap(a),u.texture.pmremVersion=a.pmremVersion,t.set(a,u),a.addEventListener("dispose",r),u.texture):null}}}return a}function s(a){let l=0,c=6;for(let h=0;h<c;h++)a[h]!==void 0&&l++;return l===c}function r(a){let l=a.target;l.removeEventListener("dispose",r);let c=t.get(l);c!==void 0&&(t.delete(l),c.dispose())}function o(){t=new WeakMap,e!==null&&(e.dispose(),e=null)}return{get:i,dispose:o}}function Jv(n){let t={};function e(i){if(t[i]!==void 0)return t[i];let s;switch(i){case"WEBGL_depth_texture":s=n.getExtension("WEBGL_depth_texture")||n.getExtension("MOZ_WEBGL_depth_texture")||n.getExtension("WEBKIT_WEBGL_depth_texture");break;case"EXT_texture_filter_anisotropic":s=n.getExtension("EXT_texture_filter_anisotropic")||n.getExtension("MOZ_EXT_texture_filter_anisotropic")||n.getExtension("WEBKIT_EXT_texture_filter_anisotropic");break;case"WEBGL_compressed_texture_s3tc":s=n.getExtension("WEBGL_compressed_texture_s3tc")||n.getExtension("MOZ_WEBGL_compressed_texture_s3tc")||n.getExtension("WEBKIT_WEBGL_compressed_texture_s3tc");break;case"WEBGL_compressed_texture_pvrtc":s=n.getExtension("WEBGL_compressed_texture_pvrtc")||n.getExtension("WEBKIT_WEBGL_compressed_texture_pvrtc");break;default:s=n.getExtension(i)}return t[i]=s,s}return{has:function(i){return e(i)!==null},init:function(){e("EXT_color_buffer_float"),e("WEBGL_clip_cull_distance"),e("OES_texture_float_linear"),e("EXT_color_buffer_half_float"),e("WEBGL_multisampled_render_to_texture"),e("WEBGL_render_shared_exponent")},get:function(i){let s=e(i);return s===null&&yo("THREE.WebGLRenderer: "+i+" extension not supported."),s}}}function jv(n,t,e,i){let s={},r=new WeakMap;function o(u){let d=u.target;d.index!==null&&t.remove(d.index);for(let m in d.attributes)t.remove(d.attributes[m]);for(let m in d.morphAttributes){let _=d.morphAttributes[m];for(let g=0,p=_.length;g<p;g++)t.remove(_[g])}d.removeEventListener("dispose",o),delete s[d.id];let f=r.get(d);f&&(t.remove(f),r.delete(d)),i.releaseStatesOfGeometry(d),d.isInstancedBufferGeometry===!0&&delete d._maxInstanceCount,e.memory.geometries--}function a(u,d){return s[d.id]===!0||(d.addEventListener("dispose",o),s[d.id]=!0,e.memory.geometries++),d}function l(u){let d=u.attributes;for(let m in d)t.update(d[m],n.ARRAY_BUFFER);let f=u.morphAttributes;for(let m in f){let _=f[m];for(let g=0,p=_.length;g<p;g++)t.update(_[g],n.ARRAY_BUFFER)}}function c(u){let d=[],f=u.index,m=u.attributes.position,_=0;if(f!==null){let S=f.array;_=f.version;for(let M=0,x=S.length;M<x;M+=3){let L=S[M+0],R=S[M+1],C=S[M+2];d.push(L,R,R,C,C,L)}}else if(m!==void 0){let S=m.array;_=m.version;for(let M=0,x=S.length/3-1;M<x;M+=3){let L=M+0,R=M+1,C=M+2;d.push(L,R,R,C,C,L)}}else return;let g=new(Kp(d)?ol:rl)(d,1);g.version=_;let p=r.get(u);p&&t.remove(p),r.set(u,g)}function h(u){let d=r.get(u);if(d){let f=u.index;f!==null&&d.version<f.version&&c(u)}else c(u);return r.get(u)}return{get:a,update:l,getWireframeAttribute:h}}function Qv(n,t,e){let i;function s(d){i=d}let r,o;function a(d){r=d.type,o=d.bytesPerElement}function l(d,f){n.drawElements(i,f,r,d*o),e.update(f,i,1)}function c(d,f,m){m!==0&&(n.drawElementsInstanced(i,f,r,d*o,m),e.update(f,i,m))}function h(d,f,m){if(m===0)return;t.get("WEBGL_multi_draw").multiDrawElementsWEBGL(i,f,0,r,d,0,m);let g=0;for(let p=0;p<m;p++)g+=f[p];e.update(g,i,1)}function u(d,f,m,_){if(m===0)return;let g=t.get("WEBGL_multi_draw");if(g===null)for(let p=0;p<d.length;p++)c(d[p]/o,f[p],_[p]);else{g.multiDrawElementsInstancedWEBGL(i,f,0,r,d,0,_,0,m);let p=0;for(let S=0;S<m;S++)p+=f[S]*_[S];e.update(p,i,1)}}this.setMode=s,this.setIndex=a,this.render=l,this.renderInstances=c,this.renderMultiDraw=h,this.renderMultiDrawInstances=u}function ty(n){let t={geometries:0,textures:0},e={frame:0,calls:0,triangles:0,points:0,lines:0};function i(r,o,a){switch(e.calls++,o){case n.TRIANGLES:e.triangles+=a*(r/3);break;case n.LINES:e.lines+=a*(r/2);break;case n.LINE_STRIP:e.lines+=a*(r-1);break;case n.LINE_LOOP:e.lines+=a*r;break;case n.POINTS:e.points+=a*r;break;default:console.error("THREE.WebGLInfo: Unknown draw mode:",o);break}}function s(){e.calls=0,e.triangles=0,e.points=0,e.lines=0}return{memory:t,render:e,programs:null,autoReset:!0,reset:s,update:i}}function ey(n,t,e){let i=new WeakMap,s=new Ee;function r(o,a,l){let c=o.morphTargetInfluences,h=a.morphAttributes.position||a.morphAttributes.normal||a.morphAttributes.color,u=h!==void 0?h.length:0,d=i.get(a);if(d===void 0||d.count!==u){let b=function(){C.dispose(),i.delete(a),a.removeEventListener("dispose",b)};d!==void 0&&d.texture.dispose();let f=a.morphAttributes.position!==void 0,m=a.morphAttributes.normal!==void 0,_=a.morphAttributes.color!==void 0,g=a.morphAttributes.position||[],p=a.morphAttributes.normal||[],S=a.morphAttributes.color||[],M=0;f===!0&&(M=1),m===!0&&(M=2),_===!0&&(M=3);let x=a.attributes.position.count*M,L=1;x>t.maxTextureSize&&(L=Math.ceil(x/t.maxTextureSize),x=t.maxTextureSize);let R=new Float32Array(x*L*4*u),C=new sl(R,x,L,u);C.type=fi,C.needsUpdate=!0;let D=M*4;for(let y=0;y<u;y++){let I=g[y],Y=p[y],V=S[y],F=x*L*4*y;for(let X=0;X<I.count;X++){let z=X*D;f===!0&&(s.fromBufferAttribute(I,X),R[F+z+0]=s.x,R[F+z+1]=s.y,R[F+z+2]=s.z,R[F+z+3]=0),m===!0&&(s.fromBufferAttribute(Y,X),R[F+z+4]=s.x,R[F+z+5]=s.y,R[F+z+6]=s.z,R[F+z+7]=0),_===!0&&(s.fromBufferAttribute(V,X),R[F+z+8]=s.x,R[F+z+9]=s.y,R[F+z+10]=s.z,R[F+z+11]=V.itemSize===4?s.w:1)}}d={count:u,texture:C,size:new nt(x,L)},i.set(a,d),a.addEventListener("dispose",b)}if(o.isInstancedMesh===!0&&o.morphTexture!==null)l.getUniforms().setValue(n,"morphTexture",o.morphTexture,e);else{let f=0;for(let _=0;_<c.length;_++)f+=c[_];let m=a.morphTargetsRelative?1:1-f;l.getUniforms().setValue(n,"morphTargetBaseInfluence",m),l.getUniforms().setValue(n,"morphTargetInfluences",c)}l.getUniforms().setValue(n,"morphTargetsTexture",d.texture,e),l.getUniforms().setValue(n,"morphTargetsTextureSize",d.size)}return{update:r}}function ny(n,t,e,i){let s=new WeakMap;function r(l){let c=i.render.frame,h=l.geometry,u=t.get(l,h);if(s.get(u)!==c&&(t.update(u),s.set(u,c)),l.isInstancedMesh&&(l.hasEventListener("dispose",a)===!1&&l.addEventListener("dispose",a),s.get(l)!==c&&(e.update(l.instanceMatrix,n.ARRAY_BUFFER),l.instanceColor!==null&&e.update(l.instanceColor,n.ARRAY_BUFFER),s.set(l,c))),l.isSkinnedMesh){let d=l.skeleton;s.get(d)!==c&&(d.update(),s.set(d,c))}return u}function o(){s=new WeakMap}function a(l){let c=l.target;c.removeEventListener("dispose",a),e.remove(c.instanceMatrix),c.instanceColor!==null&&e.remove(c.instanceColor)}return{update:r,dispose:o}}var cl=class extends _n{constructor(t,e,i,s,r,o,a,l,c,h=Lr){if(h!==Lr&&h!==kr)throw new Error("DepthTexture format must be either THREE.DepthFormat or THREE.DepthStencilFormat");i===void 0&&h===Lr&&(i=Vs),i===void 0&&h===kr&&(i=zr),super(null,s,r,o,a,l,h,i,c),this.isDepthTexture=!0,this.image={width:t,height:e},this.magFilter=a!==void 0?a:ln,this.minFilter=l!==void 0?l:ln,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(t){return super.copy(t),this.compareFunction=t.compareFunction,this}toJSON(t){let e=super.toJSON(t);return this.compareFunction!==null&&(e.compareFunction=this.compareFunction),e}},Qp=new _n,np=new cl(1,1),tm=new sl,em=new au,nm=new ll,ip=[],sp=[],rp=new Float32Array(16),op=new Float32Array(9),ap=new Float32Array(4);function qr(n,t,e){let i=n[0];if(i<=0||i>0)return n;let s=t*e,r=ip[s];if(r===void 0&&(r=new Float32Array(s),ip[s]=r),t!==0){i.toArray(r,0);for(let o=1,a=0;o!==t;++o)a+=e,n[o].toArray(r,a)}return r}function Ge(n,t){if(n.length!==t.length)return!1;for(let e=0,i=n.length;e<i;e++)if(n[e]!==t[e])return!1;return!0}function We(n,t){for(let e=0,i=t.length;e<i;e++)n[e]=t[e]}function Hl(n,t){let e=sp[t];e===void 0&&(e=new Int32Array(t),sp[t]=e);for(let i=0;i!==t;++i)e[i]=n.allocateTextureUnit();return e}function iy(n,t){let e=this.cache;e[0]!==t&&(n.uniform1f(this.addr,t),e[0]=t)}function sy(n,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(n.uniform2f(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(Ge(e,t))return;n.uniform2fv(this.addr,t),We(e,t)}}function ry(n,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(n.uniform3f(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else if(t.r!==void 0)(e[0]!==t.r||e[1]!==t.g||e[2]!==t.b)&&(n.uniform3f(this.addr,t.r,t.g,t.b),e[0]=t.r,e[1]=t.g,e[2]=t.b);else{if(Ge(e,t))return;n.uniform3fv(this.addr,t),We(e,t)}}function oy(n,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(n.uniform4f(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(Ge(e,t))return;n.uniform4fv(this.addr,t),We(e,t)}}function ay(n,t){let e=this.cache,i=t.elements;if(i===void 0){if(Ge(e,t))return;n.uniformMatrix2fv(this.addr,!1,t),We(e,t)}else{if(Ge(e,i))return;ap.set(i),n.uniformMatrix2fv(this.addr,!1,ap),We(e,i)}}function ly(n,t){let e=this.cache,i=t.elements;if(i===void 0){if(Ge(e,t))return;n.uniformMatrix3fv(this.addr,!1,t),We(e,t)}else{if(Ge(e,i))return;op.set(i),n.uniformMatrix3fv(this.addr,!1,op),We(e,i)}}function cy(n,t){let e=this.cache,i=t.elements;if(i===void 0){if(Ge(e,t))return;n.uniformMatrix4fv(this.addr,!1,t),We(e,t)}else{if(Ge(e,i))return;rp.set(i),n.uniformMatrix4fv(this.addr,!1,rp),We(e,i)}}function hy(n,t){let e=this.cache;e[0]!==t&&(n.uniform1i(this.addr,t),e[0]=t)}function uy(n,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(n.uniform2i(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(Ge(e,t))return;n.uniform2iv(this.addr,t),We(e,t)}}function dy(n,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(n.uniform3i(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else{if(Ge(e,t))return;n.uniform3iv(this.addr,t),We(e,t)}}function fy(n,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(n.uniform4i(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(Ge(e,t))return;n.uniform4iv(this.addr,t),We(e,t)}}function py(n,t){let e=this.cache;e[0]!==t&&(n.uniform1ui(this.addr,t),e[0]=t)}function my(n,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(n.uniform2ui(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(Ge(e,t))return;n.uniform2uiv(this.addr,t),We(e,t)}}function gy(n,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(n.uniform3ui(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else{if(Ge(e,t))return;n.uniform3uiv(this.addr,t),We(e,t)}}function _y(n,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(n.uniform4ui(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(Ge(e,t))return;n.uniform4uiv(this.addr,t),We(e,t)}}function xy(n,t,e){let i=this.cache,s=e.allocateTextureUnit();i[0]!==s&&(n.uniform1i(this.addr,s),i[0]=s);let r;this.type===n.SAMPLER_2D_SHADOW?(np.compareFunction=Zp,r=np):r=Qp,e.setTexture2D(t||r,s)}function vy(n,t,e){let i=this.cache,s=e.allocateTextureUnit();i[0]!==s&&(n.uniform1i(this.addr,s),i[0]=s),e.setTexture3D(t||em,s)}function yy(n,t,e){let i=this.cache,s=e.allocateTextureUnit();i[0]!==s&&(n.uniform1i(this.addr,s),i[0]=s),e.setTextureCube(t||nm,s)}function My(n,t,e){let i=this.cache,s=e.allocateTextureUnit();i[0]!==s&&(n.uniform1i(this.addr,s),i[0]=s),e.setTexture2DArray(t||tm,s)}function Ey(n){switch(n){case 5126:return iy;case 35664:return sy;case 35665:return ry;case 35666:return oy;case 35674:return ay;case 35675:return ly;case 35676:return cy;case 5124:case 35670:return hy;case 35667:case 35671:return uy;case 35668:case 35672:return dy;case 35669:case 35673:return fy;case 5125:return py;case 36294:return my;case 36295:return gy;case 36296:return _y;case 35678:case 36198:case 36298:case 36306:case 35682:return xy;case 35679:case 36299:case 36307:return vy;case 35680:case 36300:case 36308:case 36293:return yy;case 36289:case 36303:case 36311:case 36292:return My}}function by(n,t){n.uniform1fv(this.addr,t)}function Sy(n,t){let e=qr(t,this.size,2);n.uniform2fv(this.addr,e)}function Ty(n,t){let e=qr(t,this.size,3);n.uniform3fv(this.addr,e)}function wy(n,t){let e=qr(t,this.size,4);n.uniform4fv(this.addr,e)}function Ay(n,t){let e=qr(t,this.size,4);n.uniformMatrix2fv(this.addr,!1,e)}function Ry(n,t){let e=qr(t,this.size,9);n.uniformMatrix3fv(this.addr,!1,e)}function Cy(n,t){let e=qr(t,this.size,16);n.uniformMatrix4fv(this.addr,!1,e)}function Py(n,t){n.uniform1iv(this.addr,t)}function Iy(n,t){n.uniform2iv(this.addr,t)}function Dy(n,t){n.uniform3iv(this.addr,t)}function Ly(n,t){n.uniform4iv(this.addr,t)}function Uy(n,t){n.uniform1uiv(this.addr,t)}function Ny(n,t){n.uniform2uiv(this.addr,t)}function Oy(n,t){n.uniform3uiv(this.addr,t)}function Fy(n,t){n.uniform4uiv(this.addr,t)}function By(n,t,e){let i=this.cache,s=t.length,r=Hl(e,s);Ge(i,r)||(n.uniform1iv(this.addr,r),We(i,r));for(let o=0;o!==s;++o)e.setTexture2D(t[o]||Qp,r[o])}function zy(n,t,e){let i=this.cache,s=t.length,r=Hl(e,s);Ge(i,r)||(n.uniform1iv(this.addr,r),We(i,r));for(let o=0;o!==s;++o)e.setTexture3D(t[o]||em,r[o])}function ky(n,t,e){let i=this.cache,s=t.length,r=Hl(e,s);Ge(i,r)||(n.uniform1iv(this.addr,r),We(i,r));for(let o=0;o!==s;++o)e.setTextureCube(t[o]||nm,r[o])}function Hy(n,t,e){let i=this.cache,s=t.length,r=Hl(e,s);Ge(i,r)||(n.uniform1iv(this.addr,r),We(i,r));for(let o=0;o!==s;++o)e.setTexture2DArray(t[o]||tm,r[o])}function Vy(n){switch(n){case 5126:return by;case 35664:return Sy;case 35665:return Ty;case 35666:return wy;case 35674:return Ay;case 35675:return Ry;case 35676:return Cy;case 5124:case 35670:return Py;case 35667:case 35671:return Iy;case 35668:case 35672:return Dy;case 35669:case 35673:return Ly;case 5125:return Uy;case 36294:return Ny;case 36295:return Oy;case 36296:return Fy;case 35678:case 36198:case 36298:case 36306:case 35682:return By;case 35679:case 36299:case 36307:return zy;case 35680:case 36300:case 36308:case 36293:return ky;case 36289:case 36303:case 36311:case 36292:return Hy}}var hu=class{constructor(t,e,i){this.id=t,this.addr=i,this.cache=[],this.type=e.type,this.setValue=Ey(e.type)}},uu=class{constructor(t,e,i){this.id=t,this.addr=i,this.cache=[],this.type=e.type,this.size=e.size,this.setValue=Vy(e.type)}},du=class{constructor(t){this.id=t,this.seq=[],this.map={}}setValue(t,e,i){let s=this.seq;for(let r=0,o=s.length;r!==o;++r){let a=s[r];a.setValue(t,e[a.id],i)}}},fh=/(\w+)(\])?(\[|\.)?/g;function lp(n,t){n.seq.push(t),n.map[t.id]=t}function Gy(n,t,e){let i=n.name,s=i.length;for(fh.lastIndex=0;;){let r=fh.exec(i),o=fh.lastIndex,a=r[1],l=r[2]==="]",c=r[3];if(l&&(a=a|0),c===void 0||c==="["&&o+2===s){lp(e,c===void 0?new hu(a,n,t):new uu(a,n,t));break}else{let u=e.map[a];u===void 0&&(u=new du(a),lp(e,u)),e=u}}}var Nr=class{constructor(t,e){this.seq=[],this.map={};let i=t.getProgramParameter(e,t.ACTIVE_UNIFORMS);for(let s=0;s<i;++s){let r=t.getActiveUniform(e,s),o=t.getUniformLocation(e,r.name);Gy(r,o,this)}}setValue(t,e,i,s){let r=this.map[e];r!==void 0&&r.setValue(t,i,s)}setOptional(t,e,i){let s=e[i];s!==void 0&&this.setValue(t,i,s)}static upload(t,e,i,s){for(let r=0,o=e.length;r!==o;++r){let a=e[r],l=i[a.id];l.needsUpdate!==!1&&a.setValue(t,l.value,s)}}static seqWithValue(t,e){let i=[];for(let s=0,r=t.length;s!==r;++s){let o=t[s];o.id in e&&i.push(o)}return i}};function cp(n,t,e){let i=n.createShader(t);return n.shaderSource(i,e),n.compileShader(i),i}var Wy=37297,Xy=0;function Yy(n,t){let e=n.split(`
`),i=[],s=Math.max(t-6,0),r=Math.min(t+6,e.length);for(let o=s;o<r;o++){let a=o+1;i.push(`${a===t?">":" "} ${a}: ${e[o]}`)}return i.join(`
`)}var hp=new jt;function qy(n){oe._getMatrix(hp,oe.workingColorSpace,n);let t=`mat3( ${hp.elements.map(e=>e.toFixed(4))} )`;switch(oe.getTransfer(n)){case kl:return[t,"LinearTransferOETF"];case xe:return[t,"sRGBTransferOETF"];default:return console.warn("THREE.WebGLProgram: Unsupported color space: ",n),[t,"LinearTransferOETF"]}}function up(n,t,e){let i=n.getShaderParameter(t,n.COMPILE_STATUS),s=n.getShaderInfoLog(t).trim();if(i&&s==="")return"";let r=/ERROR: 0:(\d+)/.exec(s);if(r){let o=parseInt(r[1]);return e.toUpperCase()+`

`+s+`

`+Yy(n.getShaderSource(t),o)}else return s}function Zy(n,t){let e=qy(t);return[`vec4 ${n}( vec4 value ) {`,`	return ${e[1]}( vec4( value.rgb * ${e[0]}, value.a ) );`,"}"].join(`
`)}function Ky(n,t){let e;switch(t){case zu:e="Linear";break;case ku:e="Reinhard";break;case Hu:e="Cineon";break;case Xo:e="ACESFilmic";break;case Vu:e="AgX";break;case Gu:e="Neutral";break;case fg:e="Custom";break;default:console.warn("THREE.WebGLProgram: Unsupported toneMapping:",t),e="Linear"}return"vec3 "+n+"( vec3 color ) { return "+e+"ToneMapping( color ); }"}var Va=new w;function $y(){oe.getLuminanceCoefficients(Va);let n=Va.x.toFixed(4),t=Va.y.toFixed(4),e=Va.z.toFixed(4);return["float luminance( const in vec3 rgb ) {",`	const vec3 weights = vec3( ${n}, ${t}, ${e} );`,"	return dot( weights, rgb );","}"].join(`
`)}function Jy(n){return[n.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",n.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(Mo).join(`
`)}function jy(n){let t=[];for(let e in n){let i=n[e];i!==!1&&t.push("#define "+e+" "+i)}return t.join(`
`)}function Qy(n,t){let e={},i=n.getProgramParameter(t,n.ACTIVE_ATTRIBUTES);for(let s=0;s<i;s++){let r=n.getActiveAttrib(t,s),o=r.name,a=1;r.type===n.FLOAT_MAT2&&(a=2),r.type===n.FLOAT_MAT3&&(a=3),r.type===n.FLOAT_MAT4&&(a=4),e[o]={type:r.type,location:n.getAttribLocation(t,o),locationSize:a}}return e}function Mo(n){return n!==""}function dp(n,t){let e=t.numSpotLightShadows+t.numSpotLightMaps-t.numSpotLightShadowsWithMaps;return n.replace(/NUM_DIR_LIGHTS/g,t.numDirLights).replace(/NUM_SPOT_LIGHTS/g,t.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,t.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,e).replace(/NUM_RECT_AREA_LIGHTS/g,t.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,t.numPointLights).replace(/NUM_HEMI_LIGHTS/g,t.numHemiLights).replace(/NUM_DIR_LIGHT_SHADOWS/g,t.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,t.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,t.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,t.numPointLightShadows)}function fp(n,t){return n.replace(/NUM_CLIPPING_PLANES/g,t.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,t.numClippingPlanes-t.numClipIntersection)}var tM=/^[ \t]*#include +<([\w\d./]+)>/gm;function fu(n){return n.replace(tM,nM)}var eM=new Map;function nM(n,t){let e=te[t];if(e===void 0){let i=eM.get(t);if(i!==void 0)e=te[i],console.warn('THREE.WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',t,i);else throw new Error("Can not resolve #include <"+t+">")}return fu(e)}var iM=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function pp(n){return n.replace(iM,sM)}function sM(n,t,e,i){let s="";for(let r=parseInt(t);r<parseInt(e);r++)s+=i.replace(/\[\s*i\s*\]/g,"[ "+r+" ]").replace(/UNROLLED_LOOP_INDEX/g,r);return s}function mp(n){let t=`precision ${n.precision} float;
	precision ${n.precision} int;
	precision ${n.precision} sampler2D;
	precision ${n.precision} samplerCube;
	precision ${n.precision} sampler3D;
	precision ${n.precision} sampler2DArray;
	precision ${n.precision} sampler2DShadow;
	precision ${n.precision} samplerCubeShadow;
	precision ${n.precision} sampler2DArrayShadow;
	precision ${n.precision} isampler2D;
	precision ${n.precision} isampler3D;
	precision ${n.precision} isamplerCube;
	precision ${n.precision} isampler2DArray;
	precision ${n.precision} usampler2D;
	precision ${n.precision} usampler3D;
	precision ${n.precision} usamplerCube;
	precision ${n.precision} usampler2DArray;
	`;return n.precision==="highp"?t+=`
#define HIGH_PRECISION`:n.precision==="mediump"?t+=`
#define MEDIUM_PRECISION`:n.precision==="lowp"&&(t+=`
#define LOW_PRECISION`),t}function rM(n){let t="SHADOWMAP_TYPE_BASIC";return n.shadowMapType===Np?t="SHADOWMAP_TYPE_PCF":n.shadowMapType===Bu?t="SHADOWMAP_TYPE_PCF_SOFT":n.shadowMapType===Pi&&(t="SHADOWMAP_TYPE_VSM"),t}function oM(n){let t="ENVMAP_TYPE_CUBE";if(n.envMap)switch(n.envMapMode){case Fr:case Br:t="ENVMAP_TYPE_CUBE";break;case zl:t="ENVMAP_TYPE_CUBE_UV";break}return t}function aM(n){let t="ENVMAP_MODE_REFLECTION";if(n.envMap)switch(n.envMapMode){case Br:t="ENVMAP_MODE_REFRACTION";break}return t}function lM(n){let t="ENVMAP_BLENDING_NONE";if(n.envMap)switch(n.combine){case Op:t="ENVMAP_BLENDING_MULTIPLY";break;case ug:t="ENVMAP_BLENDING_MIX";break;case dg:t="ENVMAP_BLENDING_ADD";break}return t}function cM(n){let t=n.envMapCubeUVHeight;if(t===null)return null;let e=Math.log2(t)-2,i=1/t;return{texelWidth:1/(3*Math.max(Math.pow(2,e),7*16)),texelHeight:i,maxMip:e}}function hM(n,t,e,i){let s=n.getContext(),r=e.defines,o=e.vertexShader,a=e.fragmentShader,l=rM(e),c=oM(e),h=aM(e),u=lM(e),d=cM(e),f=Jy(e),m=jy(r),_=s.createProgram(),g,p,S=e.glslVersion?"#version "+e.glslVersion+`
`:"";e.isRawShaderMaterial?(g=["#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,m].filter(Mo).join(`
`),g.length>0&&(g+=`
`),p=["#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,m].filter(Mo).join(`
`),p.length>0&&(p+=`
`)):(g=[mp(e),"#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,m,e.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",e.batching?"#define USE_BATCHING":"",e.batchingColor?"#define USE_BATCHING_COLOR":"",e.instancing?"#define USE_INSTANCING":"",e.instancingColor?"#define USE_INSTANCING_COLOR":"",e.instancingMorph?"#define USE_INSTANCING_MORPH":"",e.useFog&&e.fog?"#define USE_FOG":"",e.useFog&&e.fogExp2?"#define FOG_EXP2":"",e.map?"#define USE_MAP":"",e.envMap?"#define USE_ENVMAP":"",e.envMap?"#define "+h:"",e.lightMap?"#define USE_LIGHTMAP":"",e.aoMap?"#define USE_AOMAP":"",e.bumpMap?"#define USE_BUMPMAP":"",e.normalMap?"#define USE_NORMALMAP":"",e.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",e.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",e.displacementMap?"#define USE_DISPLACEMENTMAP":"",e.emissiveMap?"#define USE_EMISSIVEMAP":"",e.anisotropy?"#define USE_ANISOTROPY":"",e.anisotropyMap?"#define USE_ANISOTROPYMAP":"",e.clearcoatMap?"#define USE_CLEARCOATMAP":"",e.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",e.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",e.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",e.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",e.specularMap?"#define USE_SPECULARMAP":"",e.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",e.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",e.roughnessMap?"#define USE_ROUGHNESSMAP":"",e.metalnessMap?"#define USE_METALNESSMAP":"",e.alphaMap?"#define USE_ALPHAMAP":"",e.alphaHash?"#define USE_ALPHAHASH":"",e.transmission?"#define USE_TRANSMISSION":"",e.transmissionMap?"#define USE_TRANSMISSIONMAP":"",e.thicknessMap?"#define USE_THICKNESSMAP":"",e.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",e.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",e.mapUv?"#define MAP_UV "+e.mapUv:"",e.alphaMapUv?"#define ALPHAMAP_UV "+e.alphaMapUv:"",e.lightMapUv?"#define LIGHTMAP_UV "+e.lightMapUv:"",e.aoMapUv?"#define AOMAP_UV "+e.aoMapUv:"",e.emissiveMapUv?"#define EMISSIVEMAP_UV "+e.emissiveMapUv:"",e.bumpMapUv?"#define BUMPMAP_UV "+e.bumpMapUv:"",e.normalMapUv?"#define NORMALMAP_UV "+e.normalMapUv:"",e.displacementMapUv?"#define DISPLACEMENTMAP_UV "+e.displacementMapUv:"",e.metalnessMapUv?"#define METALNESSMAP_UV "+e.metalnessMapUv:"",e.roughnessMapUv?"#define ROUGHNESSMAP_UV "+e.roughnessMapUv:"",e.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+e.anisotropyMapUv:"",e.clearcoatMapUv?"#define CLEARCOATMAP_UV "+e.clearcoatMapUv:"",e.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+e.clearcoatNormalMapUv:"",e.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+e.clearcoatRoughnessMapUv:"",e.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+e.iridescenceMapUv:"",e.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+e.iridescenceThicknessMapUv:"",e.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+e.sheenColorMapUv:"",e.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+e.sheenRoughnessMapUv:"",e.specularMapUv?"#define SPECULARMAP_UV "+e.specularMapUv:"",e.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+e.specularColorMapUv:"",e.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+e.specularIntensityMapUv:"",e.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+e.transmissionMapUv:"",e.thicknessMapUv?"#define THICKNESSMAP_UV "+e.thicknessMapUv:"",e.vertexTangents&&e.flatShading===!1?"#define USE_TANGENT":"",e.vertexColors?"#define USE_COLOR":"",e.vertexAlphas?"#define USE_COLOR_ALPHA":"",e.vertexUv1s?"#define USE_UV1":"",e.vertexUv2s?"#define USE_UV2":"",e.vertexUv3s?"#define USE_UV3":"",e.pointsUvs?"#define USE_POINTS_UV":"",e.flatShading?"#define FLAT_SHADED":"",e.skinning?"#define USE_SKINNING":"",e.morphTargets?"#define USE_MORPHTARGETS":"",e.morphNormals&&e.flatShading===!1?"#define USE_MORPHNORMALS":"",e.morphColors?"#define USE_MORPHCOLORS":"",e.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+e.morphTextureStride:"",e.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+e.morphTargetsCount:"",e.doubleSided?"#define DOUBLE_SIDED":"",e.flipSided?"#define FLIP_SIDED":"",e.shadowMapEnabled?"#define USE_SHADOWMAP":"",e.shadowMapEnabled?"#define "+l:"",e.sizeAttenuation?"#define USE_SIZEATTENUATION":"",e.numLightProbes>0?"#define USE_LIGHT_PROBES":"",e.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",e.reverseDepthBuffer?"#define USE_REVERSEDEPTHBUF":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","	uniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(Mo).join(`
`),p=[mp(e),"#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,m,e.useFog&&e.fog?"#define USE_FOG":"",e.useFog&&e.fogExp2?"#define FOG_EXP2":"",e.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",e.map?"#define USE_MAP":"",e.matcap?"#define USE_MATCAP":"",e.envMap?"#define USE_ENVMAP":"",e.envMap?"#define "+c:"",e.envMap?"#define "+h:"",e.envMap?"#define "+u:"",d?"#define CUBEUV_TEXEL_WIDTH "+d.texelWidth:"",d?"#define CUBEUV_TEXEL_HEIGHT "+d.texelHeight:"",d?"#define CUBEUV_MAX_MIP "+d.maxMip+".0":"",e.lightMap?"#define USE_LIGHTMAP":"",e.aoMap?"#define USE_AOMAP":"",e.bumpMap?"#define USE_BUMPMAP":"",e.normalMap?"#define USE_NORMALMAP":"",e.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",e.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",e.emissiveMap?"#define USE_EMISSIVEMAP":"",e.anisotropy?"#define USE_ANISOTROPY":"",e.anisotropyMap?"#define USE_ANISOTROPYMAP":"",e.clearcoat?"#define USE_CLEARCOAT":"",e.clearcoatMap?"#define USE_CLEARCOATMAP":"",e.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",e.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",e.dispersion?"#define USE_DISPERSION":"",e.iridescence?"#define USE_IRIDESCENCE":"",e.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",e.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",e.specularMap?"#define USE_SPECULARMAP":"",e.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",e.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",e.roughnessMap?"#define USE_ROUGHNESSMAP":"",e.metalnessMap?"#define USE_METALNESSMAP":"",e.alphaMap?"#define USE_ALPHAMAP":"",e.alphaTest?"#define USE_ALPHATEST":"",e.alphaHash?"#define USE_ALPHAHASH":"",e.sheen?"#define USE_SHEEN":"",e.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",e.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",e.transmission?"#define USE_TRANSMISSION":"",e.transmissionMap?"#define USE_TRANSMISSIONMAP":"",e.thicknessMap?"#define USE_THICKNESSMAP":"",e.vertexTangents&&e.flatShading===!1?"#define USE_TANGENT":"",e.vertexColors||e.instancingColor||e.batchingColor?"#define USE_COLOR":"",e.vertexAlphas?"#define USE_COLOR_ALPHA":"",e.vertexUv1s?"#define USE_UV1":"",e.vertexUv2s?"#define USE_UV2":"",e.vertexUv3s?"#define USE_UV3":"",e.pointsUvs?"#define USE_POINTS_UV":"",e.gradientMap?"#define USE_GRADIENTMAP":"",e.flatShading?"#define FLAT_SHADED":"",e.doubleSided?"#define DOUBLE_SIDED":"",e.flipSided?"#define FLIP_SIDED":"",e.shadowMapEnabled?"#define USE_SHADOWMAP":"",e.shadowMapEnabled?"#define "+l:"",e.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",e.numLightProbes>0?"#define USE_LIGHT_PROBES":"",e.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",e.decodeVideoTextureEmissive?"#define DECODE_VIDEO_TEXTURE_EMISSIVE":"",e.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",e.reverseDepthBuffer?"#define USE_REVERSEDEPTHBUF":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",e.toneMapping!==is?"#define TONE_MAPPING":"",e.toneMapping!==is?te.tonemapping_pars_fragment:"",e.toneMapping!==is?Ky("toneMapping",e.toneMapping):"",e.dithering?"#define DITHERING":"",e.opaque?"#define OPAQUE":"",te.colorspace_pars_fragment,Zy("linearToOutputTexel",e.outputColorSpace),$y(),e.useDepthPacking?"#define DEPTH_PACKING "+e.depthPacking:"",`
`].filter(Mo).join(`
`)),o=fu(o),o=dp(o,e),o=fp(o,e),a=fu(a),a=dp(a,e),a=fp(a,e),o=pp(o),a=pp(a),e.isRawShaderMaterial!==!0&&(S=`#version 300 es
`,g=[f,"#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+g,p=["#define varying in",e.glslVersion===Rf?"":"layout(location = 0) out highp vec4 pc_fragColor;",e.glslVersion===Rf?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+p);let M=S+g+o,x=S+p+a,L=cp(s,s.VERTEX_SHADER,M),R=cp(s,s.FRAGMENT_SHADER,x);s.attachShader(_,L),s.attachShader(_,R),e.index0AttributeName!==void 0?s.bindAttribLocation(_,0,e.index0AttributeName):e.morphTargets===!0&&s.bindAttribLocation(_,0,"position"),s.linkProgram(_);function C(I){if(n.debug.checkShaderErrors){let Y=s.getProgramInfoLog(_).trim(),V=s.getShaderInfoLog(L).trim(),F=s.getShaderInfoLog(R).trim(),X=!0,z=!0;if(s.getProgramParameter(_,s.LINK_STATUS)===!1)if(X=!1,typeof n.debug.onShaderError=="function")n.debug.onShaderError(s,_,L,R);else{let J=up(s,L,"vertex"),k=up(s,R,"fragment");console.error("THREE.WebGLProgram: Shader Error "+s.getError()+" - VALIDATE_STATUS "+s.getProgramParameter(_,s.VALIDATE_STATUS)+`

Material Name: `+I.name+`
Material Type: `+I.type+`

Program Info Log: `+Y+`
`+J+`
`+k)}else Y!==""?console.warn("THREE.WebGLProgram: Program Info Log:",Y):(V===""||F==="")&&(z=!1);z&&(I.diagnostics={runnable:X,programLog:Y,vertexShader:{log:V,prefix:g},fragmentShader:{log:F,prefix:p}})}s.deleteShader(L),s.deleteShader(R),D=new Nr(s,_),b=Qy(s,_)}let D;this.getUniforms=function(){return D===void 0&&C(this),D};let b;this.getAttributes=function(){return b===void 0&&C(this),b};let y=e.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return y===!1&&(y=s.getProgramParameter(_,Wy)),y},this.destroy=function(){i.releaseStatesOfProgram(this),s.deleteProgram(_),this.program=void 0},this.type=e.shaderType,this.name=e.shaderName,this.id=Xy++,this.cacheKey=t,this.usedTimes=1,this.program=_,this.vertexShader=L,this.fragmentShader=R,this}var uM=0,pu=class{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(t){let e=t.vertexShader,i=t.fragmentShader,s=this._getShaderStage(e),r=this._getShaderStage(i),o=this._getShaderCacheForMaterial(t);return o.has(s)===!1&&(o.add(s),s.usedTimes++),o.has(r)===!1&&(o.add(r),r.usedTimes++),this}remove(t){let e=this.materialCache.get(t);for(let i of e)i.usedTimes--,i.usedTimes===0&&this.shaderCache.delete(i.code);return this.materialCache.delete(t),this}getVertexShaderID(t){return this._getShaderStage(t.vertexShader).id}getFragmentShaderID(t){return this._getShaderStage(t.fragmentShader).id}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(t){let e=this.materialCache,i=e.get(t);return i===void 0&&(i=new Set,e.set(t,i)),i}_getShaderStage(t){let e=this.shaderCache,i=e.get(t);return i===void 0&&(i=new mu(t),e.set(t,i)),i}},mu=class{constructor(t){this.id=uM++,this.code=t,this.usedTimes=0}};function dM(n,t,e,i,s,r,o){let a=new Io,l=new pu,c=new Set,h=[],u=s.logarithmicDepthBuffer,d=s.vertexTextures,f=s.precision,m={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distanceRGBA",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function _(b){return c.add(b),b===0?"uv":`uv${b}`}function g(b,y,I,Y,V){let F=Y.fog,X=V.geometry,z=b.isMeshStandardMaterial?Y.environment:null,J=(b.isMeshStandardMaterial?e:t).get(b.envMap||z),k=J&&J.mapping===zl?J.image.height:null,rt=m[b.type];b.precision!==null&&(f=s.getMaxPrecision(b.precision),f!==b.precision&&console.warn("THREE.WebGLProgram.getParameters:",b.precision,"not supported, using",f,"instead."));let ct=X.morphAttributes.position||X.morphAttributes.normal||X.morphAttributes.color,mt=ct!==void 0?ct.length:0,kt=0;X.morphAttributes.position!==void 0&&(kt=1),X.morphAttributes.normal!==void 0&&(kt=2),X.morphAttributes.color!==void 0&&(kt=3);let Xt,Z,st,Tt;if(rt){let ve=ui[rt];Xt=ve.vertexShader,Z=ve.fragmentShader}else Xt=b.vertexShader,Z=b.fragmentShader,l.update(b),st=l.getVertexShaderID(b),Tt=l.getFragmentShaderID(b);let ht=n.getRenderTarget(),Bt=n.state.buffers.depth.getReversed(),Zt=V.isInstancedMesh===!0,Gt=V.isBatchedMesh===!0,ue=!!b.map,tt=!!b.matcap,at=!!J,A=!!b.aoMap,It=!!b.lightMap,it=!!b.bumpMap,Et=!!b.normalMap,ut=!!b.displacementMap,Ht=!!b.emissiveMap,yt=!!b.metalnessMap,T=!!b.roughnessMap,v=b.anisotropy>0,H=b.clearcoat>0,K=b.dispersion>0,et=b.iridescence>0,$=b.sheen>0,wt=b.transmission>0,ft=v&&!!b.anisotropyMap,Mt=H&&!!b.clearcoatMap,ie=H&&!!b.clearcoatNormalMap,ot=H&&!!b.clearcoatRoughnessMap,bt=et&&!!b.iridescenceMap,Vt=et&&!!b.iridescenceThicknessMap,qt=$&&!!b.sheenColorMap,St=$&&!!b.sheenRoughnessMap,ae=!!b.specularMap,Qt=!!b.specularColorMap,we=!!b.specularIntensityMap,U=wt&&!!b.transmissionMap,pt=wt&&!!b.thicknessMap,q=!!b.gradientMap,Q=!!b.alphaMap,xt=b.alphaTest>0,gt=!!b.alphaHash,$t=!!b.extensions,Oe=is;b.toneMapped&&(ht===null||ht.isXRRenderTarget===!0)&&(Oe=n.toneMapping);let sn={shaderID:rt,shaderType:b.type,shaderName:b.name,vertexShader:Xt,fragmentShader:Z,defines:b.defines,customVertexShaderID:st,customFragmentShaderID:Tt,isRawShaderMaterial:b.isRawShaderMaterial===!0,glslVersion:b.glslVersion,precision:f,batching:Gt,batchingColor:Gt&&V._colorsTexture!==null,instancing:Zt,instancingColor:Zt&&V.instanceColor!==null,instancingMorph:Zt&&V.morphTexture!==null,supportsVertexTextures:d,outputColorSpace:ht===null?n.outputColorSpace:ht.isXRRenderTarget===!0?ht.texture.colorSpace:Yr,alphaToCoverage:!!b.alphaToCoverage,map:ue,matcap:tt,envMap:at,envMapMode:at&&J.mapping,envMapCubeUVHeight:k,aoMap:A,lightMap:It,bumpMap:it,normalMap:Et,displacementMap:d&&ut,emissiveMap:Ht,normalMapObjectSpace:Et&&b.normalMapType===gg,normalMapTangentSpace:Et&&b.normalMapType===qp,metalnessMap:yt,roughnessMap:T,anisotropy:v,anisotropyMap:ft,clearcoat:H,clearcoatMap:Mt,clearcoatNormalMap:ie,clearcoatRoughnessMap:ot,dispersion:K,iridescence:et,iridescenceMap:bt,iridescenceThicknessMap:Vt,sheen:$,sheenColorMap:qt,sheenRoughnessMap:St,specularMap:ae,specularColorMap:Qt,specularIntensityMap:we,transmission:wt,transmissionMap:U,thicknessMap:pt,gradientMap:q,opaque:b.transparent===!1&&b.blending===Dr&&b.alphaToCoverage===!1,alphaMap:Q,alphaTest:xt,alphaHash:gt,combine:b.combine,mapUv:ue&&_(b.map.channel),aoMapUv:A&&_(b.aoMap.channel),lightMapUv:It&&_(b.lightMap.channel),bumpMapUv:it&&_(b.bumpMap.channel),normalMapUv:Et&&_(b.normalMap.channel),displacementMapUv:ut&&_(b.displacementMap.channel),emissiveMapUv:Ht&&_(b.emissiveMap.channel),metalnessMapUv:yt&&_(b.metalnessMap.channel),roughnessMapUv:T&&_(b.roughnessMap.channel),anisotropyMapUv:ft&&_(b.anisotropyMap.channel),clearcoatMapUv:Mt&&_(b.clearcoatMap.channel),clearcoatNormalMapUv:ie&&_(b.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:ot&&_(b.clearcoatRoughnessMap.channel),iridescenceMapUv:bt&&_(b.iridescenceMap.channel),iridescenceThicknessMapUv:Vt&&_(b.iridescenceThicknessMap.channel),sheenColorMapUv:qt&&_(b.sheenColorMap.channel),sheenRoughnessMapUv:St&&_(b.sheenRoughnessMap.channel),specularMapUv:ae&&_(b.specularMap.channel),specularColorMapUv:Qt&&_(b.specularColorMap.channel),specularIntensityMapUv:we&&_(b.specularIntensityMap.channel),transmissionMapUv:U&&_(b.transmissionMap.channel),thicknessMapUv:pt&&_(b.thicknessMap.channel),alphaMapUv:Q&&_(b.alphaMap.channel),vertexTangents:!!X.attributes.tangent&&(Et||v),vertexColors:b.vertexColors,vertexAlphas:b.vertexColors===!0&&!!X.attributes.color&&X.attributes.color.itemSize===4,pointsUvs:V.isPoints===!0&&!!X.attributes.uv&&(ue||Q),fog:!!F,useFog:b.fog===!0,fogExp2:!!F&&F.isFogExp2,flatShading:b.flatShading===!0,sizeAttenuation:b.sizeAttenuation===!0,logarithmicDepthBuffer:u,reverseDepthBuffer:Bt,skinning:V.isSkinnedMesh===!0,morphTargets:X.morphAttributes.position!==void 0,morphNormals:X.morphAttributes.normal!==void 0,morphColors:X.morphAttributes.color!==void 0,morphTargetsCount:mt,morphTextureStride:kt,numDirLights:y.directional.length,numPointLights:y.point.length,numSpotLights:y.spot.length,numSpotLightMaps:y.spotLightMap.length,numRectAreaLights:y.rectArea.length,numHemiLights:y.hemi.length,numDirLightShadows:y.directionalShadowMap.length,numPointLightShadows:y.pointShadowMap.length,numSpotLightShadows:y.spotShadowMap.length,numSpotLightShadowsWithMaps:y.numSpotLightShadowsWithMaps,numLightProbes:y.numLightProbes,numClippingPlanes:o.numPlanes,numClipIntersection:o.numIntersection,dithering:b.dithering,shadowMapEnabled:n.shadowMap.enabled&&I.length>0,shadowMapType:n.shadowMap.type,toneMapping:Oe,decodeVideoTexture:ue&&b.map.isVideoTexture===!0&&oe.getTransfer(b.map.colorSpace)===xe,decodeVideoTextureEmissive:Ht&&b.emissiveMap.isVideoTexture===!0&&oe.getTransfer(b.emissiveMap.colorSpace)===xe,premultipliedAlpha:b.premultipliedAlpha,doubleSided:b.side===Dn,flipSided:b.side===an,useDepthPacking:b.depthPacking>=0,depthPacking:b.depthPacking||0,index0AttributeName:b.index0AttributeName,extensionClipCullDistance:$t&&b.extensions.clipCullDistance===!0&&i.has("WEBGL_clip_cull_distance"),extensionMultiDraw:($t&&b.extensions.multiDraw===!0||Gt)&&i.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:i.has("KHR_parallel_shader_compile"),customProgramCacheKey:b.customProgramCacheKey()};return sn.vertexUv1s=c.has(1),sn.vertexUv2s=c.has(2),sn.vertexUv3s=c.has(3),c.clear(),sn}function p(b){let y=[];if(b.shaderID?y.push(b.shaderID):(y.push(b.customVertexShaderID),y.push(b.customFragmentShaderID)),b.defines!==void 0)for(let I in b.defines)y.push(I),y.push(b.defines[I]);return b.isRawShaderMaterial===!1&&(S(y,b),M(y,b),y.push(n.outputColorSpace)),y.push(b.customProgramCacheKey),y.join()}function S(b,y){b.push(y.precision),b.push(y.outputColorSpace),b.push(y.envMapMode),b.push(y.envMapCubeUVHeight),b.push(y.mapUv),b.push(y.alphaMapUv),b.push(y.lightMapUv),b.push(y.aoMapUv),b.push(y.bumpMapUv),b.push(y.normalMapUv),b.push(y.displacementMapUv),b.push(y.emissiveMapUv),b.push(y.metalnessMapUv),b.push(y.roughnessMapUv),b.push(y.anisotropyMapUv),b.push(y.clearcoatMapUv),b.push(y.clearcoatNormalMapUv),b.push(y.clearcoatRoughnessMapUv),b.push(y.iridescenceMapUv),b.push(y.iridescenceThicknessMapUv),b.push(y.sheenColorMapUv),b.push(y.sheenRoughnessMapUv),b.push(y.specularMapUv),b.push(y.specularColorMapUv),b.push(y.specularIntensityMapUv),b.push(y.transmissionMapUv),b.push(y.thicknessMapUv),b.push(y.combine),b.push(y.fogExp2),b.push(y.sizeAttenuation),b.push(y.morphTargetsCount),b.push(y.morphAttributeCount),b.push(y.numDirLights),b.push(y.numPointLights),b.push(y.numSpotLights),b.push(y.numSpotLightMaps),b.push(y.numHemiLights),b.push(y.numRectAreaLights),b.push(y.numDirLightShadows),b.push(y.numPointLightShadows),b.push(y.numSpotLightShadows),b.push(y.numSpotLightShadowsWithMaps),b.push(y.numLightProbes),b.push(y.shadowMapType),b.push(y.toneMapping),b.push(y.numClippingPlanes),b.push(y.numClipIntersection),b.push(y.depthPacking)}function M(b,y){a.disableAll(),y.supportsVertexTextures&&a.enable(0),y.instancing&&a.enable(1),y.instancingColor&&a.enable(2),y.instancingMorph&&a.enable(3),y.matcap&&a.enable(4),y.envMap&&a.enable(5),y.normalMapObjectSpace&&a.enable(6),y.normalMapTangentSpace&&a.enable(7),y.clearcoat&&a.enable(8),y.iridescence&&a.enable(9),y.alphaTest&&a.enable(10),y.vertexColors&&a.enable(11),y.vertexAlphas&&a.enable(12),y.vertexUv1s&&a.enable(13),y.vertexUv2s&&a.enable(14),y.vertexUv3s&&a.enable(15),y.vertexTangents&&a.enable(16),y.anisotropy&&a.enable(17),y.alphaHash&&a.enable(18),y.batching&&a.enable(19),y.dispersion&&a.enable(20),y.batchingColor&&a.enable(21),b.push(a.mask),a.disableAll(),y.fog&&a.enable(0),y.useFog&&a.enable(1),y.flatShading&&a.enable(2),y.logarithmicDepthBuffer&&a.enable(3),y.reverseDepthBuffer&&a.enable(4),y.skinning&&a.enable(5),y.morphTargets&&a.enable(6),y.morphNormals&&a.enable(7),y.morphColors&&a.enable(8),y.premultipliedAlpha&&a.enable(9),y.shadowMapEnabled&&a.enable(10),y.doubleSided&&a.enable(11),y.flipSided&&a.enable(12),y.useDepthPacking&&a.enable(13),y.dithering&&a.enable(14),y.transmission&&a.enable(15),y.sheen&&a.enable(16),y.opaque&&a.enable(17),y.pointsUvs&&a.enable(18),y.decodeVideoTexture&&a.enable(19),y.decodeVideoTextureEmissive&&a.enable(20),y.alphaToCoverage&&a.enable(21),b.push(a.mask)}function x(b){let y=m[b.type],I;if(y){let Y=ui[y];I=Qs.clone(Y.uniforms)}else I=b.uniforms;return I}function L(b,y){let I;for(let Y=0,V=h.length;Y<V;Y++){let F=h[Y];if(F.cacheKey===y){I=F,++I.usedTimes;break}}return I===void 0&&(I=new hM(n,y,b,r),h.push(I)),I}function R(b){if(--b.usedTimes===0){let y=h.indexOf(b);h[y]=h[h.length-1],h.pop(),b.destroy()}}function C(b){l.remove(b)}function D(){l.dispose()}return{getParameters:g,getProgramCacheKey:p,getUniforms:x,acquireProgram:L,releaseProgram:R,releaseShaderCache:C,programs:h,dispose:D}}function fM(){let n=new WeakMap;function t(o){return n.has(o)}function e(o){let a=n.get(o);return a===void 0&&(a={},n.set(o,a)),a}function i(o){n.delete(o)}function s(o,a,l){n.get(o)[a]=l}function r(){n=new WeakMap}return{has:t,get:e,remove:i,update:s,dispose:r}}function pM(n,t){return n.groupOrder!==t.groupOrder?n.groupOrder-t.groupOrder:n.renderOrder!==t.renderOrder?n.renderOrder-t.renderOrder:n.material.id!==t.material.id?n.material.id-t.material.id:n.z!==t.z?n.z-t.z:n.id-t.id}function gp(n,t){return n.groupOrder!==t.groupOrder?n.groupOrder-t.groupOrder:n.renderOrder!==t.renderOrder?n.renderOrder-t.renderOrder:n.z!==t.z?t.z-n.z:n.id-t.id}function _p(){let n=[],t=0,e=[],i=[],s=[];function r(){t=0,e.length=0,i.length=0,s.length=0}function o(u,d,f,m,_,g){let p=n[t];return p===void 0?(p={id:u.id,object:u,geometry:d,material:f,groupOrder:m,renderOrder:u.renderOrder,z:_,group:g},n[t]=p):(p.id=u.id,p.object=u,p.geometry=d,p.material=f,p.groupOrder=m,p.renderOrder=u.renderOrder,p.z=_,p.group=g),t++,p}function a(u,d,f,m,_,g){let p=o(u,d,f,m,_,g);f.transmission>0?i.push(p):f.transparent===!0?s.push(p):e.push(p)}function l(u,d,f,m,_,g){let p=o(u,d,f,m,_,g);f.transmission>0?i.unshift(p):f.transparent===!0?s.unshift(p):e.unshift(p)}function c(u,d){e.length>1&&e.sort(u||pM),i.length>1&&i.sort(d||gp),s.length>1&&s.sort(d||gp)}function h(){for(let u=t,d=n.length;u<d;u++){let f=n[u];if(f.id===null)break;f.id=null,f.object=null,f.geometry=null,f.material=null,f.group=null}}return{opaque:e,transmissive:i,transparent:s,init:r,push:a,unshift:l,finish:h,sort:c}}function mM(){let n=new WeakMap;function t(i,s){let r=n.get(i),o;return r===void 0?(o=new _p,n.set(i,[o])):s>=r.length?(o=new _p,r.push(o)):o=r[s],o}function e(){n=new WeakMap}return{get:t,dispose:e}}function gM(){let n={};return{get:function(t){if(n[t.id]!==void 0)return n[t.id];let e;switch(t.type){case"DirectionalLight":e={direction:new w,color:new Yt};break;case"SpotLight":e={position:new w,direction:new w,color:new Yt,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":e={position:new w,color:new Yt,distance:0,decay:0};break;case"HemisphereLight":e={direction:new w,skyColor:new Yt,groundColor:new Yt};break;case"RectAreaLight":e={color:new Yt,position:new w,halfWidth:new w,halfHeight:new w};break}return n[t.id]=e,e}}}function _M(){let n={};return{get:function(t){if(n[t.id]!==void 0)return n[t.id];let e;switch(t.type){case"DirectionalLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new nt};break;case"SpotLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new nt};break;case"PointLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new nt,shadowCameraNear:1,shadowCameraFar:1e3};break}return n[t.id]=e,e}}}var xM=0;function vM(n,t){return(t.castShadow?2:0)-(n.castShadow?2:0)+(t.map?1:0)-(n.map?1:0)}function yM(n){let t=new gM,e=_M(),i={version:0,hash:{directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let c=0;c<9;c++)i.probe.push(new w);let s=new w,r=new be,o=new be;function a(c){let h=0,u=0,d=0;for(let b=0;b<9;b++)i.probe[b].set(0,0,0);let f=0,m=0,_=0,g=0,p=0,S=0,M=0,x=0,L=0,R=0,C=0;c.sort(vM);for(let b=0,y=c.length;b<y;b++){let I=c[b],Y=I.color,V=I.intensity,F=I.distance,X=I.shadow&&I.shadow.map?I.shadow.map.texture:null;if(I.isAmbientLight)h+=Y.r*V,u+=Y.g*V,d+=Y.b*V;else if(I.isLightProbe){for(let z=0;z<9;z++)i.probe[z].addScaledVector(I.sh.coefficients[z],V);C++}else if(I.isDirectionalLight){let z=t.get(I);if(z.color.copy(I.color).multiplyScalar(I.intensity),I.castShadow){let J=I.shadow,k=e.get(I);k.shadowIntensity=J.intensity,k.shadowBias=J.bias,k.shadowNormalBias=J.normalBias,k.shadowRadius=J.radius,k.shadowMapSize=J.mapSize,i.directionalShadow[f]=k,i.directionalShadowMap[f]=X,i.directionalShadowMatrix[f]=I.shadow.matrix,S++}i.directional[f]=z,f++}else if(I.isSpotLight){let z=t.get(I);z.position.setFromMatrixPosition(I.matrixWorld),z.color.copy(Y).multiplyScalar(V),z.distance=F,z.coneCos=Math.cos(I.angle),z.penumbraCos=Math.cos(I.angle*(1-I.penumbra)),z.decay=I.decay,i.spot[_]=z;let J=I.shadow;if(I.map&&(i.spotLightMap[L]=I.map,L++,J.updateMatrices(I),I.castShadow&&R++),i.spotLightMatrix[_]=J.matrix,I.castShadow){let k=e.get(I);k.shadowIntensity=J.intensity,k.shadowBias=J.bias,k.shadowNormalBias=J.normalBias,k.shadowRadius=J.radius,k.shadowMapSize=J.mapSize,i.spotShadow[_]=k,i.spotShadowMap[_]=X,x++}_++}else if(I.isRectAreaLight){let z=t.get(I);z.color.copy(Y).multiplyScalar(V),z.halfWidth.set(I.width*.5,0,0),z.halfHeight.set(0,I.height*.5,0),i.rectArea[g]=z,g++}else if(I.isPointLight){let z=t.get(I);if(z.color.copy(I.color).multiplyScalar(I.intensity),z.distance=I.distance,z.decay=I.decay,I.castShadow){let J=I.shadow,k=e.get(I);k.shadowIntensity=J.intensity,k.shadowBias=J.bias,k.shadowNormalBias=J.normalBias,k.shadowRadius=J.radius,k.shadowMapSize=J.mapSize,k.shadowCameraNear=J.camera.near,k.shadowCameraFar=J.camera.far,i.pointShadow[m]=k,i.pointShadowMap[m]=X,i.pointShadowMatrix[m]=I.shadow.matrix,M++}i.point[m]=z,m++}else if(I.isHemisphereLight){let z=t.get(I);z.skyColor.copy(I.color).multiplyScalar(V),z.groundColor.copy(I.groundColor).multiplyScalar(V),i.hemi[p]=z,p++}}g>0&&(n.has("OES_texture_float_linear")===!0?(i.rectAreaLTC1=dt.LTC_FLOAT_1,i.rectAreaLTC2=dt.LTC_FLOAT_2):(i.rectAreaLTC1=dt.LTC_HALF_1,i.rectAreaLTC2=dt.LTC_HALF_2)),i.ambient[0]=h,i.ambient[1]=u,i.ambient[2]=d;let D=i.hash;(D.directionalLength!==f||D.pointLength!==m||D.spotLength!==_||D.rectAreaLength!==g||D.hemiLength!==p||D.numDirectionalShadows!==S||D.numPointShadows!==M||D.numSpotShadows!==x||D.numSpotMaps!==L||D.numLightProbes!==C)&&(i.directional.length=f,i.spot.length=_,i.rectArea.length=g,i.point.length=m,i.hemi.length=p,i.directionalShadow.length=S,i.directionalShadowMap.length=S,i.pointShadow.length=M,i.pointShadowMap.length=M,i.spotShadow.length=x,i.spotShadowMap.length=x,i.directionalShadowMatrix.length=S,i.pointShadowMatrix.length=M,i.spotLightMatrix.length=x+L-R,i.spotLightMap.length=L,i.numSpotLightShadowsWithMaps=R,i.numLightProbes=C,D.directionalLength=f,D.pointLength=m,D.spotLength=_,D.rectAreaLength=g,D.hemiLength=p,D.numDirectionalShadows=S,D.numPointShadows=M,D.numSpotShadows=x,D.numSpotMaps=L,D.numLightProbes=C,i.version=xM++)}function l(c,h){let u=0,d=0,f=0,m=0,_=0,g=h.matrixWorldInverse;for(let p=0,S=c.length;p<S;p++){let M=c[p];if(M.isDirectionalLight){let x=i.directional[u];x.direction.setFromMatrixPosition(M.matrixWorld),s.setFromMatrixPosition(M.target.matrixWorld),x.direction.sub(s),x.direction.transformDirection(g),u++}else if(M.isSpotLight){let x=i.spot[f];x.position.setFromMatrixPosition(M.matrixWorld),x.position.applyMatrix4(g),x.direction.setFromMatrixPosition(M.matrixWorld),s.setFromMatrixPosition(M.target.matrixWorld),x.direction.sub(s),x.direction.transformDirection(g),f++}else if(M.isRectAreaLight){let x=i.rectArea[m];x.position.setFromMatrixPosition(M.matrixWorld),x.position.applyMatrix4(g),o.identity(),r.copy(M.matrixWorld),r.premultiply(g),o.extractRotation(r),x.halfWidth.set(M.width*.5,0,0),x.halfHeight.set(0,M.height*.5,0),x.halfWidth.applyMatrix4(o),x.halfHeight.applyMatrix4(o),m++}else if(M.isPointLight){let x=i.point[d];x.position.setFromMatrixPosition(M.matrixWorld),x.position.applyMatrix4(g),d++}else if(M.isHemisphereLight){let x=i.hemi[_];x.direction.setFromMatrixPosition(M.matrixWorld),x.direction.transformDirection(g),_++}}}return{setup:a,setupView:l,state:i}}function xp(n){let t=new yM(n),e=[],i=[];function s(h){c.camera=h,e.length=0,i.length=0}function r(h){e.push(h)}function o(h){i.push(h)}function a(){t.setup(e)}function l(h){t.setupView(e,h)}let c={lightsArray:e,shadowsArray:i,camera:null,lights:t,transmissionRenderTarget:{}};return{init:s,state:c,setupLights:a,setupLightsView:l,pushLight:r,pushShadow:o}}function MM(n){let t=new WeakMap;function e(s,r=0){let o=t.get(s),a;return o===void 0?(a=new xp(n),t.set(s,[a])):r>=o.length?(a=new xp(n),o.push(a)):a=o[r],a}function i(){t=new WeakMap}return{get:e,dispose:i}}var Lo=class extends as{static get type(){return"MeshDepthMaterial"}constructor(t){super(),this.isMeshDepthMaterial=!0,this.depthPacking=mg,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(t)}copy(t){return super.copy(t),this.depthPacking=t.depthPacking,this.map=t.map,this.alphaMap=t.alphaMap,this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this}},gu=class extends as{static get type(){return"MeshDistanceMaterial"}constructor(t){super(),this.isMeshDistanceMaterial=!0,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(t)}copy(t){return super.copy(t),this.map=t.map,this.alphaMap=t.alphaMap,this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this}},EM=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,bM=`uniform sampler2D shadow_pass;
uniform vec2 resolution;
uniform float radius;
#include <packing>
void main() {
	const float samples = float( VSM_SAMPLES );
	float mean = 0.0;
	float squared_mean = 0.0;
	float uvStride = samples <= 1.0 ? 0.0 : 2.0 / ( samples - 1.0 );
	float uvStart = samples <= 1.0 ? 0.0 : - 1.0;
	for ( float i = 0.0; i < samples; i ++ ) {
		float uvOffset = uvStart + i * uvStride;
		#ifdef HORIZONTAL_PASS
			vec2 distribution = unpackRGBATo2Half( texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( uvOffset, 0.0 ) * radius ) / resolution ) );
			mean += distribution.x;
			squared_mean += distribution.y * distribution.y + distribution.x * distribution.x;
		#else
			float depth = unpackRGBAToDepth( texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( 0.0, uvOffset ) * radius ) / resolution ) );
			mean += depth;
			squared_mean += depth * depth;
		#endif
	}
	mean = mean / samples;
	squared_mean = squared_mean / samples;
	float std_dev = sqrt( squared_mean - mean * mean );
	gl_FragColor = pack2HalfToRGBA( vec2( mean, std_dev ) );
}`;function SM(n,t,e){let i=new Do,s=new nt,r=new nt,o=new Ee,a=new Lo({depthPacking:Ju}),l=new gu,c={},h=e.maxTextureSize,u={[rs]:an,[an]:rs,[Dn]:Dn},d=new cn({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new nt},radius:{value:4}},vertexShader:EM,fragmentShader:bM}),f=d.clone();f.defines.HORIZONTAL_PASS=1;let m=new Fe;m.setAttribute("position",new en(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));let _=new Ft(m,d),g=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=Np;let p=this.type;this.render=function(R,C,D){if(g.enabled===!1||g.autoUpdate===!1&&g.needsUpdate===!1||R.length===0)return;let b=n.getRenderTarget(),y=n.getActiveCubeFace(),I=n.getActiveMipmapLevel(),Y=n.state;Y.setBlending(Gn),Y.buffers.color.setClear(1,1,1,1),Y.buffers.depth.setTest(!0),Y.setScissorTest(!1);let V=p!==Pi&&this.type===Pi,F=p===Pi&&this.type!==Pi;for(let X=0,z=R.length;X<z;X++){let J=R[X],k=J.shadow;if(k===void 0){console.warn("THREE.WebGLShadowMap:",J,"has no shadow.");continue}if(k.autoUpdate===!1&&k.needsUpdate===!1)continue;s.copy(k.mapSize);let rt=k.getFrameExtents();if(s.multiply(rt),r.copy(k.mapSize),(s.x>h||s.y>h)&&(s.x>h&&(r.x=Math.floor(h/rt.x),s.x=r.x*rt.x,k.mapSize.x=r.x),s.y>h&&(r.y=Math.floor(h/rt.y),s.y=r.y*rt.y,k.mapSize.y=r.y)),k.map===null||V===!0||F===!0){let mt=this.type!==Pi?{minFilter:ln,magFilter:ln}:{};k.map!==null&&k.map.dispose(),k.map=new xn(s.x,s.y,mt),k.map.texture.name=J.name+".shadowMap",k.camera.updateProjectionMatrix()}n.setRenderTarget(k.map),n.clear();let ct=k.getViewportCount();for(let mt=0;mt<ct;mt++){let kt=k.getViewport(mt);o.set(r.x*kt.x,r.y*kt.y,r.x*kt.z,r.y*kt.w),Y.viewport(o),k.updateMatrices(J,mt),i=k.getFrustum(),x(C,D,k.camera,J,this.type)}k.isPointLightShadow!==!0&&this.type===Pi&&S(k,D),k.needsUpdate=!1}p=this.type,g.needsUpdate=!1,n.setRenderTarget(b,y,I)};function S(R,C){let D=t.update(_);d.defines.VSM_SAMPLES!==R.blurSamples&&(d.defines.VSM_SAMPLES=R.blurSamples,f.defines.VSM_SAMPLES=R.blurSamples,d.needsUpdate=!0,f.needsUpdate=!0),R.mapPass===null&&(R.mapPass=new xn(s.x,s.y)),d.uniforms.shadow_pass.value=R.map.texture,d.uniforms.resolution.value=R.mapSize,d.uniforms.radius.value=R.radius,n.setRenderTarget(R.mapPass),n.clear(),n.renderBufferDirect(C,null,D,d,_,null),f.uniforms.shadow_pass.value=R.mapPass.texture,f.uniforms.resolution.value=R.mapSize,f.uniforms.radius.value=R.radius,n.setRenderTarget(R.map),n.clear(),n.renderBufferDirect(C,null,D,f,_,null)}function M(R,C,D,b){let y=null,I=D.isPointLight===!0?R.customDistanceMaterial:R.customDepthMaterial;if(I!==void 0)y=I;else if(y=D.isPointLight===!0?l:a,n.localClippingEnabled&&C.clipShadows===!0&&Array.isArray(C.clippingPlanes)&&C.clippingPlanes.length!==0||C.displacementMap&&C.displacementScale!==0||C.alphaMap&&C.alphaTest>0||C.map&&C.alphaTest>0){let Y=y.uuid,V=C.uuid,F=c[Y];F===void 0&&(F={},c[Y]=F);let X=F[V];X===void 0&&(X=y.clone(),F[V]=X,C.addEventListener("dispose",L)),y=X}if(y.visible=C.visible,y.wireframe=C.wireframe,b===Pi?y.side=C.shadowSide!==null?C.shadowSide:C.side:y.side=C.shadowSide!==null?C.shadowSide:u[C.side],y.alphaMap=C.alphaMap,y.alphaTest=C.alphaTest,y.map=C.map,y.clipShadows=C.clipShadows,y.clippingPlanes=C.clippingPlanes,y.clipIntersection=C.clipIntersection,y.displacementMap=C.displacementMap,y.displacementScale=C.displacementScale,y.displacementBias=C.displacementBias,y.wireframeLinewidth=C.wireframeLinewidth,y.linewidth=C.linewidth,D.isPointLight===!0&&y.isMeshDistanceMaterial===!0){let Y=n.properties.get(y);Y.light=D}return y}function x(R,C,D,b,y){if(R.visible===!1)return;if(R.layers.test(C.layers)&&(R.isMesh||R.isLine||R.isPoints)&&(R.castShadow||R.receiveShadow&&y===Pi)&&(!R.frustumCulled||i.intersectsObject(R))){R.modelViewMatrix.multiplyMatrices(D.matrixWorldInverse,R.matrixWorld);let V=t.update(R),F=R.material;if(Array.isArray(F)){let X=V.groups;for(let z=0,J=X.length;z<J;z++){let k=X[z],rt=F[k.materialIndex];if(rt&&rt.visible){let ct=M(R,rt,b,y);R.onBeforeShadow(n,R,C,D,V,ct,k),n.renderBufferDirect(D,null,V,ct,R,k),R.onAfterShadow(n,R,C,D,V,ct,k)}}}else if(F.visible){let X=M(R,F,b,y);R.onBeforeShadow(n,R,C,D,V,X,null),n.renderBufferDirect(D,null,V,X,R,null),R.onAfterShadow(n,R,C,D,V,X,null)}}let Y=R.children;for(let V=0,F=Y.length;V<F;V++)x(Y[V],C,D,b,y)}function L(R){R.target.removeEventListener("dispose",L);for(let D in c){let b=c[D],y=R.target.uuid;y in b&&(b[y].dispose(),delete b[y])}}}var TM={[Eh]:bh,[Sh]:Ah,[Th]:Rh,[Or]:wh,[bh]:Eh,[Ah]:Sh,[Rh]:Th,[wh]:Or};function wM(n,t){function e(){let U=!1,pt=new Ee,q=null,Q=new Ee(0,0,0,0);return{setMask:function(xt){q!==xt&&!U&&(n.colorMask(xt,xt,xt,xt),q=xt)},setLocked:function(xt){U=xt},setClear:function(xt,gt,$t,Oe,sn){sn===!0&&(xt*=Oe,gt*=Oe,$t*=Oe),pt.set(xt,gt,$t,Oe),Q.equals(pt)===!1&&(n.clearColor(xt,gt,$t,Oe),Q.copy(pt))},reset:function(){U=!1,q=null,Q.set(-1,0,0,0)}}}function i(){let U=!1,pt=!1,q=null,Q=null,xt=null;return{setReversed:function(gt){if(pt!==gt){let $t=t.get("EXT_clip_control");pt?$t.clipControlEXT($t.LOWER_LEFT_EXT,$t.ZERO_TO_ONE_EXT):$t.clipControlEXT($t.LOWER_LEFT_EXT,$t.NEGATIVE_ONE_TO_ONE_EXT);let Oe=xt;xt=null,this.setClear(Oe)}pt=gt},getReversed:function(){return pt},setTest:function(gt){gt?ht(n.DEPTH_TEST):Bt(n.DEPTH_TEST)},setMask:function(gt){q!==gt&&!U&&(n.depthMask(gt),q=gt)},setFunc:function(gt){if(pt&&(gt=TM[gt]),Q!==gt){switch(gt){case Eh:n.depthFunc(n.NEVER);break;case bh:n.depthFunc(n.ALWAYS);break;case Sh:n.depthFunc(n.LESS);break;case Or:n.depthFunc(n.LEQUAL);break;case Th:n.depthFunc(n.EQUAL);break;case wh:n.depthFunc(n.GEQUAL);break;case Ah:n.depthFunc(n.GREATER);break;case Rh:n.depthFunc(n.NOTEQUAL);break;default:n.depthFunc(n.LEQUAL)}Q=gt}},setLocked:function(gt){U=gt},setClear:function(gt){xt!==gt&&(pt&&(gt=1-gt),n.clearDepth(gt),xt=gt)},reset:function(){U=!1,q=null,Q=null,xt=null,pt=!1}}}function s(){let U=!1,pt=null,q=null,Q=null,xt=null,gt=null,$t=null,Oe=null,sn=null;return{setTest:function(ve){U||(ve?ht(n.STENCIL_TEST):Bt(n.STENCIL_TEST))},setMask:function(ve){pt!==ve&&!U&&(n.stencilMask(ve),pt=ve)},setFunc:function(ve,Zn,Ei){(q!==ve||Q!==Zn||xt!==Ei)&&(n.stencilFunc(ve,Zn,Ei),q=ve,Q=Zn,xt=Ei)},setOp:function(ve,Zn,Ei){(gt!==ve||$t!==Zn||Oe!==Ei)&&(n.stencilOp(ve,Zn,Ei),gt=ve,$t=Zn,Oe=Ei)},setLocked:function(ve){U=ve},setClear:function(ve){sn!==ve&&(n.clearStencil(ve),sn=ve)},reset:function(){U=!1,pt=null,q=null,Q=null,xt=null,gt=null,$t=null,Oe=null,sn=null}}}let r=new e,o=new i,a=new s,l=new WeakMap,c=new WeakMap,h={},u={},d=new WeakMap,f=[],m=null,_=!1,g=null,p=null,S=null,M=null,x=null,L=null,R=null,C=new Yt(0,0,0),D=0,b=!1,y=null,I=null,Y=null,V=null,F=null,X=n.getParameter(n.MAX_COMBINED_TEXTURE_IMAGE_UNITS),z=!1,J=0,k=n.getParameter(n.VERSION);k.indexOf("WebGL")!==-1?(J=parseFloat(/^WebGL (\d)/.exec(k)[1]),z=J>=1):k.indexOf("OpenGL ES")!==-1&&(J=parseFloat(/^OpenGL ES (\d)/.exec(k)[1]),z=J>=2);let rt=null,ct={},mt=n.getParameter(n.SCISSOR_BOX),kt=n.getParameter(n.VIEWPORT),Xt=new Ee().fromArray(mt),Z=new Ee().fromArray(kt);function st(U,pt,q,Q){let xt=new Uint8Array(4),gt=n.createTexture();n.bindTexture(U,gt),n.texParameteri(U,n.TEXTURE_MIN_FILTER,n.NEAREST),n.texParameteri(U,n.TEXTURE_MAG_FILTER,n.NEAREST);for(let $t=0;$t<q;$t++)U===n.TEXTURE_3D||U===n.TEXTURE_2D_ARRAY?n.texImage3D(pt,0,n.RGBA,1,1,Q,0,n.RGBA,n.UNSIGNED_BYTE,xt):n.texImage2D(pt+$t,0,n.RGBA,1,1,0,n.RGBA,n.UNSIGNED_BYTE,xt);return gt}let Tt={};Tt[n.TEXTURE_2D]=st(n.TEXTURE_2D,n.TEXTURE_2D,1),Tt[n.TEXTURE_CUBE_MAP]=st(n.TEXTURE_CUBE_MAP,n.TEXTURE_CUBE_MAP_POSITIVE_X,6),Tt[n.TEXTURE_2D_ARRAY]=st(n.TEXTURE_2D_ARRAY,n.TEXTURE_2D_ARRAY,1,1),Tt[n.TEXTURE_3D]=st(n.TEXTURE_3D,n.TEXTURE_3D,1,1),r.setClear(0,0,0,1),o.setClear(1),a.setClear(0),ht(n.DEPTH_TEST),o.setFunc(Or),it(!1),Et(vf),ht(n.CULL_FACE),A(Gn);function ht(U){h[U]!==!0&&(n.enable(U),h[U]=!0)}function Bt(U){h[U]!==!1&&(n.disable(U),h[U]=!1)}function Zt(U,pt){return u[U]!==pt?(n.bindFramebuffer(U,pt),u[U]=pt,U===n.DRAW_FRAMEBUFFER&&(u[n.FRAMEBUFFER]=pt),U===n.FRAMEBUFFER&&(u[n.DRAW_FRAMEBUFFER]=pt),!0):!1}function Gt(U,pt){let q=f,Q=!1;if(U){q=d.get(pt),q===void 0&&(q=[],d.set(pt,q));let xt=U.textures;if(q.length!==xt.length||q[0]!==n.COLOR_ATTACHMENT0){for(let gt=0,$t=xt.length;gt<$t;gt++)q[gt]=n.COLOR_ATTACHMENT0+gt;q.length=xt.length,Q=!0}}else q[0]!==n.BACK&&(q[0]=n.BACK,Q=!0);Q&&n.drawBuffers(q)}function ue(U){return m!==U?(n.useProgram(U),m=U,!0):!1}let tt={[Fs]:n.FUNC_ADD,[Z0]:n.FUNC_SUBTRACT,[K0]:n.FUNC_REVERSE_SUBTRACT};tt[$0]=n.MIN,tt[J0]=n.MAX;let at={[j0]:n.ZERO,[Q0]:n.ONE,[tg]:n.SRC_COLOR,[yh]:n.SRC_ALPHA,[og]:n.SRC_ALPHA_SATURATE,[sg]:n.DST_COLOR,[ng]:n.DST_ALPHA,[eg]:n.ONE_MINUS_SRC_COLOR,[Mh]:n.ONE_MINUS_SRC_ALPHA,[rg]:n.ONE_MINUS_DST_COLOR,[ig]:n.ONE_MINUS_DST_ALPHA,[ag]:n.CONSTANT_COLOR,[lg]:n.ONE_MINUS_CONSTANT_COLOR,[cg]:n.CONSTANT_ALPHA,[hg]:n.ONE_MINUS_CONSTANT_ALPHA};function A(U,pt,q,Q,xt,gt,$t,Oe,sn,ve){if(U===Gn){_===!0&&(Bt(n.BLEND),_=!1);return}if(_===!1&&(ht(n.BLEND),_=!0),U!==q0){if(U!==g||ve!==b){if((p!==Fs||x!==Fs)&&(n.blendEquation(n.FUNC_ADD),p=Fs,x=Fs),ve)switch(U){case Dr:n.blendFuncSeparate(n.ONE,n.ONE_MINUS_SRC_ALPHA,n.ONE,n.ONE_MINUS_SRC_ALPHA);break;case yf:n.blendFunc(n.ONE,n.ONE);break;case Mf:n.blendFuncSeparate(n.ZERO,n.ONE_MINUS_SRC_COLOR,n.ZERO,n.ONE);break;case Ef:n.blendFuncSeparate(n.ZERO,n.SRC_COLOR,n.ZERO,n.SRC_ALPHA);break;default:console.error("THREE.WebGLState: Invalid blending: ",U);break}else switch(U){case Dr:n.blendFuncSeparate(n.SRC_ALPHA,n.ONE_MINUS_SRC_ALPHA,n.ONE,n.ONE_MINUS_SRC_ALPHA);break;case yf:n.blendFunc(n.SRC_ALPHA,n.ONE);break;case Mf:n.blendFuncSeparate(n.ZERO,n.ONE_MINUS_SRC_COLOR,n.ZERO,n.ONE);break;case Ef:n.blendFunc(n.ZERO,n.SRC_COLOR);break;default:console.error("THREE.WebGLState: Invalid blending: ",U);break}S=null,M=null,L=null,R=null,C.set(0,0,0),D=0,g=U,b=ve}return}xt=xt||pt,gt=gt||q,$t=$t||Q,(pt!==p||xt!==x)&&(n.blendEquationSeparate(tt[pt],tt[xt]),p=pt,x=xt),(q!==S||Q!==M||gt!==L||$t!==R)&&(n.blendFuncSeparate(at[q],at[Q],at[gt],at[$t]),S=q,M=Q,L=gt,R=$t),(Oe.equals(C)===!1||sn!==D)&&(n.blendColor(Oe.r,Oe.g,Oe.b,sn),C.copy(Oe),D=sn),g=U,b=!1}function It(U,pt){U.side===Dn?Bt(n.CULL_FACE):ht(n.CULL_FACE);let q=U.side===an;pt&&(q=!q),it(q),U.blending===Dr&&U.transparent===!1?A(Gn):A(U.blending,U.blendEquation,U.blendSrc,U.blendDst,U.blendEquationAlpha,U.blendSrcAlpha,U.blendDstAlpha,U.blendColor,U.blendAlpha,U.premultipliedAlpha),o.setFunc(U.depthFunc),o.setTest(U.depthTest),o.setMask(U.depthWrite),r.setMask(U.colorWrite);let Q=U.stencilWrite;a.setTest(Q),Q&&(a.setMask(U.stencilWriteMask),a.setFunc(U.stencilFunc,U.stencilRef,U.stencilFuncMask),a.setOp(U.stencilFail,U.stencilZFail,U.stencilZPass)),Ht(U.polygonOffset,U.polygonOffsetFactor,U.polygonOffsetUnits),U.alphaToCoverage===!0?ht(n.SAMPLE_ALPHA_TO_COVERAGE):Bt(n.SAMPLE_ALPHA_TO_COVERAGE)}function it(U){y!==U&&(U?n.frontFace(n.CW):n.frontFace(n.CCW),y=U)}function Et(U){U!==X0?(ht(n.CULL_FACE),U!==I&&(U===vf?n.cullFace(n.BACK):U===Y0?n.cullFace(n.FRONT):n.cullFace(n.FRONT_AND_BACK))):Bt(n.CULL_FACE),I=U}function ut(U){U!==Y&&(z&&n.lineWidth(U),Y=U)}function Ht(U,pt,q){U?(ht(n.POLYGON_OFFSET_FILL),(V!==pt||F!==q)&&(n.polygonOffset(pt,q),V=pt,F=q)):Bt(n.POLYGON_OFFSET_FILL)}function yt(U){U?ht(n.SCISSOR_TEST):Bt(n.SCISSOR_TEST)}function T(U){U===void 0&&(U=n.TEXTURE0+X-1),rt!==U&&(n.activeTexture(U),rt=U)}function v(U,pt,q){q===void 0&&(rt===null?q=n.TEXTURE0+X-1:q=rt);let Q=ct[q];Q===void 0&&(Q={type:void 0,texture:void 0},ct[q]=Q),(Q.type!==U||Q.texture!==pt)&&(rt!==q&&(n.activeTexture(q),rt=q),n.bindTexture(U,pt||Tt[U]),Q.type=U,Q.texture=pt)}function H(){let U=ct[rt];U!==void 0&&U.type!==void 0&&(n.bindTexture(U.type,null),U.type=void 0,U.texture=void 0)}function K(){try{n.compressedTexImage2D.apply(n,arguments)}catch(U){console.error("THREE.WebGLState:",U)}}function et(){try{n.compressedTexImage3D.apply(n,arguments)}catch(U){console.error("THREE.WebGLState:",U)}}function $(){try{n.texSubImage2D.apply(n,arguments)}catch(U){console.error("THREE.WebGLState:",U)}}function wt(){try{n.texSubImage3D.apply(n,arguments)}catch(U){console.error("THREE.WebGLState:",U)}}function ft(){try{n.compressedTexSubImage2D.apply(n,arguments)}catch(U){console.error("THREE.WebGLState:",U)}}function Mt(){try{n.compressedTexSubImage3D.apply(n,arguments)}catch(U){console.error("THREE.WebGLState:",U)}}function ie(){try{n.texStorage2D.apply(n,arguments)}catch(U){console.error("THREE.WebGLState:",U)}}function ot(){try{n.texStorage3D.apply(n,arguments)}catch(U){console.error("THREE.WebGLState:",U)}}function bt(){try{n.texImage2D.apply(n,arguments)}catch(U){console.error("THREE.WebGLState:",U)}}function Vt(){try{n.texImage3D.apply(n,arguments)}catch(U){console.error("THREE.WebGLState:",U)}}function qt(U){Xt.equals(U)===!1&&(n.scissor(U.x,U.y,U.z,U.w),Xt.copy(U))}function St(U){Z.equals(U)===!1&&(n.viewport(U.x,U.y,U.z,U.w),Z.copy(U))}function ae(U,pt){let q=c.get(pt);q===void 0&&(q=new WeakMap,c.set(pt,q));let Q=q.get(U);Q===void 0&&(Q=n.getUniformBlockIndex(pt,U.name),q.set(U,Q))}function Qt(U,pt){let Q=c.get(pt).get(U);l.get(pt)!==Q&&(n.uniformBlockBinding(pt,Q,U.__bindingPointIndex),l.set(pt,Q))}function we(){n.disable(n.BLEND),n.disable(n.CULL_FACE),n.disable(n.DEPTH_TEST),n.disable(n.POLYGON_OFFSET_FILL),n.disable(n.SCISSOR_TEST),n.disable(n.STENCIL_TEST),n.disable(n.SAMPLE_ALPHA_TO_COVERAGE),n.blendEquation(n.FUNC_ADD),n.blendFunc(n.ONE,n.ZERO),n.blendFuncSeparate(n.ONE,n.ZERO,n.ONE,n.ZERO),n.blendColor(0,0,0,0),n.colorMask(!0,!0,!0,!0),n.clearColor(0,0,0,0),n.depthMask(!0),n.depthFunc(n.LESS),o.setReversed(!1),n.clearDepth(1),n.stencilMask(4294967295),n.stencilFunc(n.ALWAYS,0,4294967295),n.stencilOp(n.KEEP,n.KEEP,n.KEEP),n.clearStencil(0),n.cullFace(n.BACK),n.frontFace(n.CCW),n.polygonOffset(0,0),n.activeTexture(n.TEXTURE0),n.bindFramebuffer(n.FRAMEBUFFER,null),n.bindFramebuffer(n.DRAW_FRAMEBUFFER,null),n.bindFramebuffer(n.READ_FRAMEBUFFER,null),n.useProgram(null),n.lineWidth(1),n.scissor(0,0,n.canvas.width,n.canvas.height),n.viewport(0,0,n.canvas.width,n.canvas.height),h={},rt=null,ct={},u={},d=new WeakMap,f=[],m=null,_=!1,g=null,p=null,S=null,M=null,x=null,L=null,R=null,C=new Yt(0,0,0),D=0,b=!1,y=null,I=null,Y=null,V=null,F=null,Xt.set(0,0,n.canvas.width,n.canvas.height),Z.set(0,0,n.canvas.width,n.canvas.height),r.reset(),o.reset(),a.reset()}return{buffers:{color:r,depth:o,stencil:a},enable:ht,disable:Bt,bindFramebuffer:Zt,drawBuffers:Gt,useProgram:ue,setBlending:A,setMaterial:It,setFlipSided:it,setCullFace:Et,setLineWidth:ut,setPolygonOffset:Ht,setScissorTest:yt,activeTexture:T,bindTexture:v,unbindTexture:H,compressedTexImage2D:K,compressedTexImage3D:et,texImage2D:bt,texImage3D:Vt,updateUBOMapping:ae,uniformBlockBinding:Qt,texStorage2D:ie,texStorage3D:ot,texSubImage2D:$,texSubImage3D:wt,compressedTexSubImage2D:ft,compressedTexSubImage3D:Mt,scissor:qt,viewport:St,reset:we}}function vp(n,t,e,i){let s=AM(i);switch(e){case Hp:return n*t;case Gp:return n*t;case Wp:return n*t*2;case qu:return n*t/s.components*s.byteLength;case Zu:return n*t/s.components*s.byteLength;case Xp:return n*t*2/s.components*s.byteLength;case Ku:return n*t*2/s.components*s.byteLength;case Vp:return n*t*3/s.components*s.byteLength;case Qn:return n*t*4/s.components*s.byteLength;case $u:return n*t*4/s.components*s.byteLength;case $a:case Ja:return Math.floor((n+3)/4)*Math.floor((t+3)/4)*8;case ja:case Qa:return Math.floor((n+3)/4)*Math.floor((t+3)/4)*16;case Lh:case Nh:return Math.max(n,16)*Math.max(t,8)/4;case Dh:case Uh:return Math.max(n,8)*Math.max(t,8)/2;case Oh:case Fh:return Math.floor((n+3)/4)*Math.floor((t+3)/4)*8;case Bh:return Math.floor((n+3)/4)*Math.floor((t+3)/4)*16;case zh:return Math.floor((n+3)/4)*Math.floor((t+3)/4)*16;case kh:return Math.floor((n+4)/5)*Math.floor((t+3)/4)*16;case Hh:return Math.floor((n+4)/5)*Math.floor((t+4)/5)*16;case Vh:return Math.floor((n+5)/6)*Math.floor((t+4)/5)*16;case Gh:return Math.floor((n+5)/6)*Math.floor((t+5)/6)*16;case Wh:return Math.floor((n+7)/8)*Math.floor((t+4)/5)*16;case Xh:return Math.floor((n+7)/8)*Math.floor((t+5)/6)*16;case Yh:return Math.floor((n+7)/8)*Math.floor((t+7)/8)*16;case qh:return Math.floor((n+9)/10)*Math.floor((t+4)/5)*16;case Zh:return Math.floor((n+9)/10)*Math.floor((t+5)/6)*16;case Kh:return Math.floor((n+9)/10)*Math.floor((t+7)/8)*16;case $h:return Math.floor((n+9)/10)*Math.floor((t+9)/10)*16;case Jh:return Math.floor((n+11)/12)*Math.floor((t+9)/10)*16;case jh:return Math.floor((n+11)/12)*Math.floor((t+11)/12)*16;case tl:case Qh:case tu:return Math.ceil(n/4)*Math.ceil(t/4)*16;case Yp:case eu:return Math.ceil(n/4)*Math.ceil(t/4)*8;case nu:case iu:return Math.ceil(n/4)*Math.ceil(t/4)*16}throw new Error(`Unable to determine texture byte length for ${e} format.`)}function AM(n){switch(n){case Li:case Bp:return{byteLength:1,components:1};case Ro:case zp:case Fi:return{byteLength:2,components:1};case Xu:case Yu:return{byteLength:2,components:4};case Vs:case Wu:case fi:return{byteLength:4,components:1};case kp:return{byteLength:4,components:3}}throw new Error(`Unknown texture type ${n}.`)}function RM(n,t,e,i,s,r,o){let a=t.has("WEBGL_multisampled_render_to_texture")?t.get("WEBGL_multisampled_render_to_texture"):null,l=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),c=new nt,h=new WeakMap,u,d=new WeakMap,f=!1;try{f=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function m(T,v){return f?new OffscreenCanvas(T,v):Po("canvas")}function _(T,v,H){let K=1,et=yt(T);if((et.width>H||et.height>H)&&(K=H/Math.max(et.width,et.height)),K<1)if(typeof HTMLImageElement<"u"&&T instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&T instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&T instanceof ImageBitmap||typeof VideoFrame<"u"&&T instanceof VideoFrame){let $=Math.floor(K*et.width),wt=Math.floor(K*et.height);u===void 0&&(u=m($,wt));let ft=v?m($,wt):u;return ft.width=$,ft.height=wt,ft.getContext("2d").drawImage(T,0,0,$,wt),console.warn("THREE.WebGLRenderer: Texture has been resized from ("+et.width+"x"+et.height+") to ("+$+"x"+wt+")."),ft}else return"data"in T&&console.warn("THREE.WebGLRenderer: Image in DataTexture is too big ("+et.width+"x"+et.height+")."),T;return T}function g(T){return T.generateMipmaps}function p(T){n.generateMipmap(T)}function S(T){return T.isWebGLCubeRenderTarget?n.TEXTURE_CUBE_MAP:T.isWebGL3DRenderTarget?n.TEXTURE_3D:T.isWebGLArrayRenderTarget||T.isCompressedArrayTexture?n.TEXTURE_2D_ARRAY:n.TEXTURE_2D}function M(T,v,H,K,et=!1){if(T!==null){if(n[T]!==void 0)return n[T];console.warn("THREE.WebGLRenderer: Attempt to use non-existing WebGL internal format '"+T+"'")}let $=v;if(v===n.RED&&(H===n.FLOAT&&($=n.R32F),H===n.HALF_FLOAT&&($=n.R16F),H===n.UNSIGNED_BYTE&&($=n.R8)),v===n.RED_INTEGER&&(H===n.UNSIGNED_BYTE&&($=n.R8UI),H===n.UNSIGNED_SHORT&&($=n.R16UI),H===n.UNSIGNED_INT&&($=n.R32UI),H===n.BYTE&&($=n.R8I),H===n.SHORT&&($=n.R16I),H===n.INT&&($=n.R32I)),v===n.RG&&(H===n.FLOAT&&($=n.RG32F),H===n.HALF_FLOAT&&($=n.RG16F),H===n.UNSIGNED_BYTE&&($=n.RG8)),v===n.RG_INTEGER&&(H===n.UNSIGNED_BYTE&&($=n.RG8UI),H===n.UNSIGNED_SHORT&&($=n.RG16UI),H===n.UNSIGNED_INT&&($=n.RG32UI),H===n.BYTE&&($=n.RG8I),H===n.SHORT&&($=n.RG16I),H===n.INT&&($=n.RG32I)),v===n.RGB_INTEGER&&(H===n.UNSIGNED_BYTE&&($=n.RGB8UI),H===n.UNSIGNED_SHORT&&($=n.RGB16UI),H===n.UNSIGNED_INT&&($=n.RGB32UI),H===n.BYTE&&($=n.RGB8I),H===n.SHORT&&($=n.RGB16I),H===n.INT&&($=n.RGB32I)),v===n.RGBA_INTEGER&&(H===n.UNSIGNED_BYTE&&($=n.RGBA8UI),H===n.UNSIGNED_SHORT&&($=n.RGBA16UI),H===n.UNSIGNED_INT&&($=n.RGBA32UI),H===n.BYTE&&($=n.RGBA8I),H===n.SHORT&&($=n.RGBA16I),H===n.INT&&($=n.RGBA32I)),v===n.RGB&&H===n.UNSIGNED_INT_5_9_9_9_REV&&($=n.RGB9_E5),v===n.RGBA){let wt=et?kl:oe.getTransfer(K);H===n.FLOAT&&($=n.RGBA32F),H===n.HALF_FLOAT&&($=n.RGBA16F),H===n.UNSIGNED_BYTE&&($=wt===xe?n.SRGB8_ALPHA8:n.RGBA8),H===n.UNSIGNED_SHORT_4_4_4_4&&($=n.RGBA4),H===n.UNSIGNED_SHORT_5_5_5_1&&($=n.RGB5_A1)}return($===n.R16F||$===n.R32F||$===n.RG16F||$===n.RG32F||$===n.RGBA16F||$===n.RGBA32F)&&t.get("EXT_color_buffer_float"),$}function x(T,v){let H;return T?v===null||v===Vs||v===zr?H=n.DEPTH24_STENCIL8:v===fi?H=n.DEPTH32F_STENCIL8:v===Ro&&(H=n.DEPTH24_STENCIL8,console.warn("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")):v===null||v===Vs||v===zr?H=n.DEPTH_COMPONENT24:v===fi?H=n.DEPTH_COMPONENT32F:v===Ro&&(H=n.DEPTH_COMPONENT16),H}function L(T,v){return g(T)===!0||T.isFramebufferTexture&&T.minFilter!==ln&&T.minFilter!==di?Math.log2(Math.max(v.width,v.height))+1:T.mipmaps!==void 0&&T.mipmaps.length>0?T.mipmaps.length:T.isCompressedTexture&&Array.isArray(T.image)?v.mipmaps.length:1}function R(T){let v=T.target;v.removeEventListener("dispose",R),D(v),v.isVideoTexture&&h.delete(v)}function C(T){let v=T.target;v.removeEventListener("dispose",C),y(v)}function D(T){let v=i.get(T);if(v.__webglInit===void 0)return;let H=T.source,K=d.get(H);if(K){let et=K[v.__cacheKey];et.usedTimes--,et.usedTimes===0&&b(T),Object.keys(K).length===0&&d.delete(H)}i.remove(T)}function b(T){let v=i.get(T);n.deleteTexture(v.__webglTexture);let H=T.source,K=d.get(H);delete K[v.__cacheKey],o.memory.textures--}function y(T){let v=i.get(T);if(T.depthTexture&&(T.depthTexture.dispose(),i.remove(T.depthTexture)),T.isWebGLCubeRenderTarget)for(let K=0;K<6;K++){if(Array.isArray(v.__webglFramebuffer[K]))for(let et=0;et<v.__webglFramebuffer[K].length;et++)n.deleteFramebuffer(v.__webglFramebuffer[K][et]);else n.deleteFramebuffer(v.__webglFramebuffer[K]);v.__webglDepthbuffer&&n.deleteRenderbuffer(v.__webglDepthbuffer[K])}else{if(Array.isArray(v.__webglFramebuffer))for(let K=0;K<v.__webglFramebuffer.length;K++)n.deleteFramebuffer(v.__webglFramebuffer[K]);else n.deleteFramebuffer(v.__webglFramebuffer);if(v.__webglDepthbuffer&&n.deleteRenderbuffer(v.__webglDepthbuffer),v.__webglMultisampledFramebuffer&&n.deleteFramebuffer(v.__webglMultisampledFramebuffer),v.__webglColorRenderbuffer)for(let K=0;K<v.__webglColorRenderbuffer.length;K++)v.__webglColorRenderbuffer[K]&&n.deleteRenderbuffer(v.__webglColorRenderbuffer[K]);v.__webglDepthRenderbuffer&&n.deleteRenderbuffer(v.__webglDepthRenderbuffer)}let H=T.textures;for(let K=0,et=H.length;K<et;K++){let $=i.get(H[K]);$.__webglTexture&&(n.deleteTexture($.__webglTexture),o.memory.textures--),i.remove(H[K])}i.remove(T)}let I=0;function Y(){I=0}function V(){let T=I;return T>=s.maxTextures&&console.warn("THREE.WebGLTextures: Trying to use "+T+" texture units while this GPU supports only "+s.maxTextures),I+=1,T}function F(T){let v=[];return v.push(T.wrapS),v.push(T.wrapT),v.push(T.wrapR||0),v.push(T.magFilter),v.push(T.minFilter),v.push(T.anisotropy),v.push(T.internalFormat),v.push(T.format),v.push(T.type),v.push(T.generateMipmaps),v.push(T.premultiplyAlpha),v.push(T.flipY),v.push(T.unpackAlignment),v.push(T.colorSpace),v.join()}function X(T,v){let H=i.get(T);if(T.isVideoTexture&&ut(T),T.isRenderTargetTexture===!1&&T.version>0&&H.__version!==T.version){let K=T.image;if(K===null)console.warn("THREE.WebGLRenderer: Texture marked for update but no image data found.");else if(K.complete===!1)console.warn("THREE.WebGLRenderer: Texture marked for update but image is incomplete");else{Z(H,T,v);return}}e.bindTexture(n.TEXTURE_2D,H.__webglTexture,n.TEXTURE0+v)}function z(T,v){let H=i.get(T);if(T.version>0&&H.__version!==T.version){Z(H,T,v);return}e.bindTexture(n.TEXTURE_2D_ARRAY,H.__webglTexture,n.TEXTURE0+v)}function J(T,v){let H=i.get(T);if(T.version>0&&H.__version!==T.version){Z(H,T,v);return}e.bindTexture(n.TEXTURE_3D,H.__webglTexture,n.TEXTURE0+v)}function k(T,v){let H=i.get(T);if(T.version>0&&H.__version!==T.version){st(H,T,v);return}e.bindTexture(n.TEXTURE_CUBE_MAP,H.__webglTexture,n.TEXTURE0+v)}let rt={[Ao]:n.REPEAT,[ks]:n.CLAMP_TO_EDGE,[Ih]:n.MIRRORED_REPEAT},ct={[ln]:n.NEAREST,[pg]:n.NEAREST_MIPMAP_NEAREST,[Ea]:n.NEAREST_MIPMAP_LINEAR,[di]:n.LINEAR,[kc]:n.LINEAR_MIPMAP_NEAREST,[Hs]:n.LINEAR_MIPMAP_LINEAR},mt={[_g]:n.NEVER,[bg]:n.ALWAYS,[xg]:n.LESS,[Zp]:n.LEQUAL,[vg]:n.EQUAL,[Eg]:n.GEQUAL,[yg]:n.GREATER,[Mg]:n.NOTEQUAL};function kt(T,v){if(v.type===fi&&t.has("OES_texture_float_linear")===!1&&(v.magFilter===di||v.magFilter===kc||v.magFilter===Ea||v.magFilter===Hs||v.minFilter===di||v.minFilter===kc||v.minFilter===Ea||v.minFilter===Hs)&&console.warn("THREE.WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device."),n.texParameteri(T,n.TEXTURE_WRAP_S,rt[v.wrapS]),n.texParameteri(T,n.TEXTURE_WRAP_T,rt[v.wrapT]),(T===n.TEXTURE_3D||T===n.TEXTURE_2D_ARRAY)&&n.texParameteri(T,n.TEXTURE_WRAP_R,rt[v.wrapR]),n.texParameteri(T,n.TEXTURE_MAG_FILTER,ct[v.magFilter]),n.texParameteri(T,n.TEXTURE_MIN_FILTER,ct[v.minFilter]),v.compareFunction&&(n.texParameteri(T,n.TEXTURE_COMPARE_MODE,n.COMPARE_REF_TO_TEXTURE),n.texParameteri(T,n.TEXTURE_COMPARE_FUNC,mt[v.compareFunction])),t.has("EXT_texture_filter_anisotropic")===!0){if(v.magFilter===ln||v.minFilter!==Ea&&v.minFilter!==Hs||v.type===fi&&t.has("OES_texture_float_linear")===!1)return;if(v.anisotropy>1||i.get(v).__currentAnisotropy){let H=t.get("EXT_texture_filter_anisotropic");n.texParameterf(T,H.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(v.anisotropy,s.getMaxAnisotropy())),i.get(v).__currentAnisotropy=v.anisotropy}}}function Xt(T,v){let H=!1;T.__webglInit===void 0&&(T.__webglInit=!0,v.addEventListener("dispose",R));let K=v.source,et=d.get(K);et===void 0&&(et={},d.set(K,et));let $=F(v);if($!==T.__cacheKey){et[$]===void 0&&(et[$]={texture:n.createTexture(),usedTimes:0},o.memory.textures++,H=!0),et[$].usedTimes++;let wt=et[T.__cacheKey];wt!==void 0&&(et[T.__cacheKey].usedTimes--,wt.usedTimes===0&&b(v)),T.__cacheKey=$,T.__webglTexture=et[$].texture}return H}function Z(T,v,H){let K=n.TEXTURE_2D;(v.isDataArrayTexture||v.isCompressedArrayTexture)&&(K=n.TEXTURE_2D_ARRAY),v.isData3DTexture&&(K=n.TEXTURE_3D);let et=Xt(T,v),$=v.source;e.bindTexture(K,T.__webglTexture,n.TEXTURE0+H);let wt=i.get($);if($.version!==wt.__version||et===!0){e.activeTexture(n.TEXTURE0+H);let ft=oe.getPrimaries(oe.workingColorSpace),Mt=v.colorSpace===ns?null:oe.getPrimaries(v.colorSpace),ie=v.colorSpace===ns||ft===Mt?n.NONE:n.BROWSER_DEFAULT_WEBGL;n.pixelStorei(n.UNPACK_FLIP_Y_WEBGL,v.flipY),n.pixelStorei(n.UNPACK_PREMULTIPLY_ALPHA_WEBGL,v.premultiplyAlpha),n.pixelStorei(n.UNPACK_ALIGNMENT,v.unpackAlignment),n.pixelStorei(n.UNPACK_COLORSPACE_CONVERSION_WEBGL,ie);let ot=_(v.image,!1,s.maxTextureSize);ot=Ht(v,ot);let bt=r.convert(v.format,v.colorSpace),Vt=r.convert(v.type),qt=M(v.internalFormat,bt,Vt,v.colorSpace,v.isVideoTexture);kt(K,v);let St,ae=v.mipmaps,Qt=v.isVideoTexture!==!0,we=wt.__version===void 0||et===!0,U=$.dataReady,pt=L(v,ot);if(v.isDepthTexture)qt=x(v.format===kr,v.type),we&&(Qt?e.texStorage2D(n.TEXTURE_2D,1,qt,ot.width,ot.height):e.texImage2D(n.TEXTURE_2D,0,qt,ot.width,ot.height,0,bt,Vt,null));else if(v.isDataTexture)if(ae.length>0){Qt&&we&&e.texStorage2D(n.TEXTURE_2D,pt,qt,ae[0].width,ae[0].height);for(let q=0,Q=ae.length;q<Q;q++)St=ae[q],Qt?U&&e.texSubImage2D(n.TEXTURE_2D,q,0,0,St.width,St.height,bt,Vt,St.data):e.texImage2D(n.TEXTURE_2D,q,qt,St.width,St.height,0,bt,Vt,St.data);v.generateMipmaps=!1}else Qt?(we&&e.texStorage2D(n.TEXTURE_2D,pt,qt,ot.width,ot.height),U&&e.texSubImage2D(n.TEXTURE_2D,0,0,0,ot.width,ot.height,bt,Vt,ot.data)):e.texImage2D(n.TEXTURE_2D,0,qt,ot.width,ot.height,0,bt,Vt,ot.data);else if(v.isCompressedTexture)if(v.isCompressedArrayTexture){Qt&&we&&e.texStorage3D(n.TEXTURE_2D_ARRAY,pt,qt,ae[0].width,ae[0].height,ot.depth);for(let q=0,Q=ae.length;q<Q;q++)if(St=ae[q],v.format!==Qn)if(bt!==null)if(Qt){if(U)if(v.layerUpdates.size>0){let xt=vp(St.width,St.height,v.format,v.type);for(let gt of v.layerUpdates){let $t=St.data.subarray(gt*xt/St.data.BYTES_PER_ELEMENT,(gt+1)*xt/St.data.BYTES_PER_ELEMENT);e.compressedTexSubImage3D(n.TEXTURE_2D_ARRAY,q,0,0,gt,St.width,St.height,1,bt,$t)}v.clearLayerUpdates()}else e.compressedTexSubImage3D(n.TEXTURE_2D_ARRAY,q,0,0,0,St.width,St.height,ot.depth,bt,St.data)}else e.compressedTexImage3D(n.TEXTURE_2D_ARRAY,q,qt,St.width,St.height,ot.depth,0,St.data,0,0);else console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else Qt?U&&e.texSubImage3D(n.TEXTURE_2D_ARRAY,q,0,0,0,St.width,St.height,ot.depth,bt,Vt,St.data):e.texImage3D(n.TEXTURE_2D_ARRAY,q,qt,St.width,St.height,ot.depth,0,bt,Vt,St.data)}else{Qt&&we&&e.texStorage2D(n.TEXTURE_2D,pt,qt,ae[0].width,ae[0].height);for(let q=0,Q=ae.length;q<Q;q++)St=ae[q],v.format!==Qn?bt!==null?Qt?U&&e.compressedTexSubImage2D(n.TEXTURE_2D,q,0,0,St.width,St.height,bt,St.data):e.compressedTexImage2D(n.TEXTURE_2D,q,qt,St.width,St.height,0,St.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):Qt?U&&e.texSubImage2D(n.TEXTURE_2D,q,0,0,St.width,St.height,bt,Vt,St.data):e.texImage2D(n.TEXTURE_2D,q,qt,St.width,St.height,0,bt,Vt,St.data)}else if(v.isDataArrayTexture)if(Qt){if(we&&e.texStorage3D(n.TEXTURE_2D_ARRAY,pt,qt,ot.width,ot.height,ot.depth),U)if(v.layerUpdates.size>0){let q=vp(ot.width,ot.height,v.format,v.type);for(let Q of v.layerUpdates){let xt=ot.data.subarray(Q*q/ot.data.BYTES_PER_ELEMENT,(Q+1)*q/ot.data.BYTES_PER_ELEMENT);e.texSubImage3D(n.TEXTURE_2D_ARRAY,0,0,0,Q,ot.width,ot.height,1,bt,Vt,xt)}v.clearLayerUpdates()}else e.texSubImage3D(n.TEXTURE_2D_ARRAY,0,0,0,0,ot.width,ot.height,ot.depth,bt,Vt,ot.data)}else e.texImage3D(n.TEXTURE_2D_ARRAY,0,qt,ot.width,ot.height,ot.depth,0,bt,Vt,ot.data);else if(v.isData3DTexture)Qt?(we&&e.texStorage3D(n.TEXTURE_3D,pt,qt,ot.width,ot.height,ot.depth),U&&e.texSubImage3D(n.TEXTURE_3D,0,0,0,0,ot.width,ot.height,ot.depth,bt,Vt,ot.data)):e.texImage3D(n.TEXTURE_3D,0,qt,ot.width,ot.height,ot.depth,0,bt,Vt,ot.data);else if(v.isFramebufferTexture){if(we)if(Qt)e.texStorage2D(n.TEXTURE_2D,pt,qt,ot.width,ot.height);else{let q=ot.width,Q=ot.height;for(let xt=0;xt<pt;xt++)e.texImage2D(n.TEXTURE_2D,xt,qt,q,Q,0,bt,Vt,null),q>>=1,Q>>=1}}else if(ae.length>0){if(Qt&&we){let q=yt(ae[0]);e.texStorage2D(n.TEXTURE_2D,pt,qt,q.width,q.height)}for(let q=0,Q=ae.length;q<Q;q++)St=ae[q],Qt?U&&e.texSubImage2D(n.TEXTURE_2D,q,0,0,bt,Vt,St):e.texImage2D(n.TEXTURE_2D,q,qt,bt,Vt,St);v.generateMipmaps=!1}else if(Qt){if(we){let q=yt(ot);e.texStorage2D(n.TEXTURE_2D,pt,qt,q.width,q.height)}U&&e.texSubImage2D(n.TEXTURE_2D,0,0,0,bt,Vt,ot)}else e.texImage2D(n.TEXTURE_2D,0,qt,bt,Vt,ot);g(v)&&p(K),wt.__version=$.version,v.onUpdate&&v.onUpdate(v)}T.__version=v.version}function st(T,v,H){if(v.image.length!==6)return;let K=Xt(T,v),et=v.source;e.bindTexture(n.TEXTURE_CUBE_MAP,T.__webglTexture,n.TEXTURE0+H);let $=i.get(et);if(et.version!==$.__version||K===!0){e.activeTexture(n.TEXTURE0+H);let wt=oe.getPrimaries(oe.workingColorSpace),ft=v.colorSpace===ns?null:oe.getPrimaries(v.colorSpace),Mt=v.colorSpace===ns||wt===ft?n.NONE:n.BROWSER_DEFAULT_WEBGL;n.pixelStorei(n.UNPACK_FLIP_Y_WEBGL,v.flipY),n.pixelStorei(n.UNPACK_PREMULTIPLY_ALPHA_WEBGL,v.premultiplyAlpha),n.pixelStorei(n.UNPACK_ALIGNMENT,v.unpackAlignment),n.pixelStorei(n.UNPACK_COLORSPACE_CONVERSION_WEBGL,Mt);let ie=v.isCompressedTexture||v.image[0].isCompressedTexture,ot=v.image[0]&&v.image[0].isDataTexture,bt=[];for(let Q=0;Q<6;Q++)!ie&&!ot?bt[Q]=_(v.image[Q],!0,s.maxCubemapSize):bt[Q]=ot?v.image[Q].image:v.image[Q],bt[Q]=Ht(v,bt[Q]);let Vt=bt[0],qt=r.convert(v.format,v.colorSpace),St=r.convert(v.type),ae=M(v.internalFormat,qt,St,v.colorSpace),Qt=v.isVideoTexture!==!0,we=$.__version===void 0||K===!0,U=et.dataReady,pt=L(v,Vt);kt(n.TEXTURE_CUBE_MAP,v);let q;if(ie){Qt&&we&&e.texStorage2D(n.TEXTURE_CUBE_MAP,pt,ae,Vt.width,Vt.height);for(let Q=0;Q<6;Q++){q=bt[Q].mipmaps;for(let xt=0;xt<q.length;xt++){let gt=q[xt];v.format!==Qn?qt!==null?Qt?U&&e.compressedTexSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+Q,xt,0,0,gt.width,gt.height,qt,gt.data):e.compressedTexImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+Q,xt,ae,gt.width,gt.height,0,gt.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):Qt?U&&e.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+Q,xt,0,0,gt.width,gt.height,qt,St,gt.data):e.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+Q,xt,ae,gt.width,gt.height,0,qt,St,gt.data)}}}else{if(q=v.mipmaps,Qt&&we){q.length>0&&pt++;let Q=yt(bt[0]);e.texStorage2D(n.TEXTURE_CUBE_MAP,pt,ae,Q.width,Q.height)}for(let Q=0;Q<6;Q++)if(ot){Qt?U&&e.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+Q,0,0,0,bt[Q].width,bt[Q].height,qt,St,bt[Q].data):e.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+Q,0,ae,bt[Q].width,bt[Q].height,0,qt,St,bt[Q].data);for(let xt=0;xt<q.length;xt++){let $t=q[xt].image[Q].image;Qt?U&&e.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+Q,xt+1,0,0,$t.width,$t.height,qt,St,$t.data):e.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+Q,xt+1,ae,$t.width,$t.height,0,qt,St,$t.data)}}else{Qt?U&&e.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+Q,0,0,0,qt,St,bt[Q]):e.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+Q,0,ae,qt,St,bt[Q]);for(let xt=0;xt<q.length;xt++){let gt=q[xt];Qt?U&&e.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+Q,xt+1,0,0,qt,St,gt.image[Q]):e.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+Q,xt+1,ae,qt,St,gt.image[Q])}}}g(v)&&p(n.TEXTURE_CUBE_MAP),$.__version=et.version,v.onUpdate&&v.onUpdate(v)}T.__version=v.version}function Tt(T,v,H,K,et,$){let wt=r.convert(H.format,H.colorSpace),ft=r.convert(H.type),Mt=M(H.internalFormat,wt,ft,H.colorSpace),ie=i.get(v),ot=i.get(H);if(ot.__renderTarget=v,!ie.__hasExternalTextures){let bt=Math.max(1,v.width>>$),Vt=Math.max(1,v.height>>$);et===n.TEXTURE_3D||et===n.TEXTURE_2D_ARRAY?e.texImage3D(et,$,Mt,bt,Vt,v.depth,0,wt,ft,null):e.texImage2D(et,$,Mt,bt,Vt,0,wt,ft,null)}e.bindFramebuffer(n.FRAMEBUFFER,T),Et(v)?a.framebufferTexture2DMultisampleEXT(n.FRAMEBUFFER,K,et,ot.__webglTexture,0,it(v)):(et===n.TEXTURE_2D||et>=n.TEXTURE_CUBE_MAP_POSITIVE_X&&et<=n.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&n.framebufferTexture2D(n.FRAMEBUFFER,K,et,ot.__webglTexture,$),e.bindFramebuffer(n.FRAMEBUFFER,null)}function ht(T,v,H){if(n.bindRenderbuffer(n.RENDERBUFFER,T),v.depthBuffer){let K=v.depthTexture,et=K&&K.isDepthTexture?K.type:null,$=x(v.stencilBuffer,et),wt=v.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT,ft=it(v);Et(v)?a.renderbufferStorageMultisampleEXT(n.RENDERBUFFER,ft,$,v.width,v.height):H?n.renderbufferStorageMultisample(n.RENDERBUFFER,ft,$,v.width,v.height):n.renderbufferStorage(n.RENDERBUFFER,$,v.width,v.height),n.framebufferRenderbuffer(n.FRAMEBUFFER,wt,n.RENDERBUFFER,T)}else{let K=v.textures;for(let et=0;et<K.length;et++){let $=K[et],wt=r.convert($.format,$.colorSpace),ft=r.convert($.type),Mt=M($.internalFormat,wt,ft,$.colorSpace),ie=it(v);H&&Et(v)===!1?n.renderbufferStorageMultisample(n.RENDERBUFFER,ie,Mt,v.width,v.height):Et(v)?a.renderbufferStorageMultisampleEXT(n.RENDERBUFFER,ie,Mt,v.width,v.height):n.renderbufferStorage(n.RENDERBUFFER,Mt,v.width,v.height)}}n.bindRenderbuffer(n.RENDERBUFFER,null)}function Bt(T,v){if(v&&v.isWebGLCubeRenderTarget)throw new Error("Depth Texture with cube render targets is not supported");if(e.bindFramebuffer(n.FRAMEBUFFER,T),!(v.depthTexture&&v.depthTexture.isDepthTexture))throw new Error("renderTarget.depthTexture must be an instance of THREE.DepthTexture");let K=i.get(v.depthTexture);K.__renderTarget=v,(!K.__webglTexture||v.depthTexture.image.width!==v.width||v.depthTexture.image.height!==v.height)&&(v.depthTexture.image.width=v.width,v.depthTexture.image.height=v.height,v.depthTexture.needsUpdate=!0),X(v.depthTexture,0);let et=K.__webglTexture,$=it(v);if(v.depthTexture.format===Lr)Et(v)?a.framebufferTexture2DMultisampleEXT(n.FRAMEBUFFER,n.DEPTH_ATTACHMENT,n.TEXTURE_2D,et,0,$):n.framebufferTexture2D(n.FRAMEBUFFER,n.DEPTH_ATTACHMENT,n.TEXTURE_2D,et,0);else if(v.depthTexture.format===kr)Et(v)?a.framebufferTexture2DMultisampleEXT(n.FRAMEBUFFER,n.DEPTH_STENCIL_ATTACHMENT,n.TEXTURE_2D,et,0,$):n.framebufferTexture2D(n.FRAMEBUFFER,n.DEPTH_STENCIL_ATTACHMENT,n.TEXTURE_2D,et,0);else throw new Error("Unknown depthTexture format")}function Zt(T){let v=i.get(T),H=T.isWebGLCubeRenderTarget===!0;if(v.__boundDepthTexture!==T.depthTexture){let K=T.depthTexture;if(v.__depthDisposeCallback&&v.__depthDisposeCallback(),K){let et=()=>{delete v.__boundDepthTexture,delete v.__depthDisposeCallback,K.removeEventListener("dispose",et)};K.addEventListener("dispose",et),v.__depthDisposeCallback=et}v.__boundDepthTexture=K}if(T.depthTexture&&!v.__autoAllocateDepthBuffer){if(H)throw new Error("target.depthTexture not supported in Cube render targets");Bt(v.__webglFramebuffer,T)}else if(H){v.__webglDepthbuffer=[];for(let K=0;K<6;K++)if(e.bindFramebuffer(n.FRAMEBUFFER,v.__webglFramebuffer[K]),v.__webglDepthbuffer[K]===void 0)v.__webglDepthbuffer[K]=n.createRenderbuffer(),ht(v.__webglDepthbuffer[K],T,!1);else{let et=T.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT,$=v.__webglDepthbuffer[K];n.bindRenderbuffer(n.RENDERBUFFER,$),n.framebufferRenderbuffer(n.FRAMEBUFFER,et,n.RENDERBUFFER,$)}}else if(e.bindFramebuffer(n.FRAMEBUFFER,v.__webglFramebuffer),v.__webglDepthbuffer===void 0)v.__webglDepthbuffer=n.createRenderbuffer(),ht(v.__webglDepthbuffer,T,!1);else{let K=T.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT,et=v.__webglDepthbuffer;n.bindRenderbuffer(n.RENDERBUFFER,et),n.framebufferRenderbuffer(n.FRAMEBUFFER,K,n.RENDERBUFFER,et)}e.bindFramebuffer(n.FRAMEBUFFER,null)}function Gt(T,v,H){let K=i.get(T);v!==void 0&&Tt(K.__webglFramebuffer,T,T.texture,n.COLOR_ATTACHMENT0,n.TEXTURE_2D,0),H!==void 0&&Zt(T)}function ue(T){let v=T.texture,H=i.get(T),K=i.get(v);T.addEventListener("dispose",C);let et=T.textures,$=T.isWebGLCubeRenderTarget===!0,wt=et.length>1;if(wt||(K.__webglTexture===void 0&&(K.__webglTexture=n.createTexture()),K.__version=v.version,o.memory.textures++),$){H.__webglFramebuffer=[];for(let ft=0;ft<6;ft++)if(v.mipmaps&&v.mipmaps.length>0){H.__webglFramebuffer[ft]=[];for(let Mt=0;Mt<v.mipmaps.length;Mt++)H.__webglFramebuffer[ft][Mt]=n.createFramebuffer()}else H.__webglFramebuffer[ft]=n.createFramebuffer()}else{if(v.mipmaps&&v.mipmaps.length>0){H.__webglFramebuffer=[];for(let ft=0;ft<v.mipmaps.length;ft++)H.__webglFramebuffer[ft]=n.createFramebuffer()}else H.__webglFramebuffer=n.createFramebuffer();if(wt)for(let ft=0,Mt=et.length;ft<Mt;ft++){let ie=i.get(et[ft]);ie.__webglTexture===void 0&&(ie.__webglTexture=n.createTexture(),o.memory.textures++)}if(T.samples>0&&Et(T)===!1){H.__webglMultisampledFramebuffer=n.createFramebuffer(),H.__webglColorRenderbuffer=[],e.bindFramebuffer(n.FRAMEBUFFER,H.__webglMultisampledFramebuffer);for(let ft=0;ft<et.length;ft++){let Mt=et[ft];H.__webglColorRenderbuffer[ft]=n.createRenderbuffer(),n.bindRenderbuffer(n.RENDERBUFFER,H.__webglColorRenderbuffer[ft]);let ie=r.convert(Mt.format,Mt.colorSpace),ot=r.convert(Mt.type),bt=M(Mt.internalFormat,ie,ot,Mt.colorSpace,T.isXRRenderTarget===!0),Vt=it(T);n.renderbufferStorageMultisample(n.RENDERBUFFER,Vt,bt,T.width,T.height),n.framebufferRenderbuffer(n.FRAMEBUFFER,n.COLOR_ATTACHMENT0+ft,n.RENDERBUFFER,H.__webglColorRenderbuffer[ft])}n.bindRenderbuffer(n.RENDERBUFFER,null),T.depthBuffer&&(H.__webglDepthRenderbuffer=n.createRenderbuffer(),ht(H.__webglDepthRenderbuffer,T,!0)),e.bindFramebuffer(n.FRAMEBUFFER,null)}}if($){e.bindTexture(n.TEXTURE_CUBE_MAP,K.__webglTexture),kt(n.TEXTURE_CUBE_MAP,v);for(let ft=0;ft<6;ft++)if(v.mipmaps&&v.mipmaps.length>0)for(let Mt=0;Mt<v.mipmaps.length;Mt++)Tt(H.__webglFramebuffer[ft][Mt],T,v,n.COLOR_ATTACHMENT0,n.TEXTURE_CUBE_MAP_POSITIVE_X+ft,Mt);else Tt(H.__webglFramebuffer[ft],T,v,n.COLOR_ATTACHMENT0,n.TEXTURE_CUBE_MAP_POSITIVE_X+ft,0);g(v)&&p(n.TEXTURE_CUBE_MAP),e.unbindTexture()}else if(wt){for(let ft=0,Mt=et.length;ft<Mt;ft++){let ie=et[ft],ot=i.get(ie);e.bindTexture(n.TEXTURE_2D,ot.__webglTexture),kt(n.TEXTURE_2D,ie),Tt(H.__webglFramebuffer,T,ie,n.COLOR_ATTACHMENT0+ft,n.TEXTURE_2D,0),g(ie)&&p(n.TEXTURE_2D)}e.unbindTexture()}else{let ft=n.TEXTURE_2D;if((T.isWebGL3DRenderTarget||T.isWebGLArrayRenderTarget)&&(ft=T.isWebGL3DRenderTarget?n.TEXTURE_3D:n.TEXTURE_2D_ARRAY),e.bindTexture(ft,K.__webglTexture),kt(ft,v),v.mipmaps&&v.mipmaps.length>0)for(let Mt=0;Mt<v.mipmaps.length;Mt++)Tt(H.__webglFramebuffer[Mt],T,v,n.COLOR_ATTACHMENT0,ft,Mt);else Tt(H.__webglFramebuffer,T,v,n.COLOR_ATTACHMENT0,ft,0);g(v)&&p(ft),e.unbindTexture()}T.depthBuffer&&Zt(T)}function tt(T){let v=T.textures;for(let H=0,K=v.length;H<K;H++){let et=v[H];if(g(et)){let $=S(T),wt=i.get(et).__webglTexture;e.bindTexture($,wt),p($),e.unbindTexture()}}}let at=[],A=[];function It(T){if(T.samples>0){if(Et(T)===!1){let v=T.textures,H=T.width,K=T.height,et=n.COLOR_BUFFER_BIT,$=T.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT,wt=i.get(T),ft=v.length>1;if(ft)for(let Mt=0;Mt<v.length;Mt++)e.bindFramebuffer(n.FRAMEBUFFER,wt.__webglMultisampledFramebuffer),n.framebufferRenderbuffer(n.FRAMEBUFFER,n.COLOR_ATTACHMENT0+Mt,n.RENDERBUFFER,null),e.bindFramebuffer(n.FRAMEBUFFER,wt.__webglFramebuffer),n.framebufferTexture2D(n.DRAW_FRAMEBUFFER,n.COLOR_ATTACHMENT0+Mt,n.TEXTURE_2D,null,0);e.bindFramebuffer(n.READ_FRAMEBUFFER,wt.__webglMultisampledFramebuffer),e.bindFramebuffer(n.DRAW_FRAMEBUFFER,wt.__webglFramebuffer);for(let Mt=0;Mt<v.length;Mt++){if(T.resolveDepthBuffer&&(T.depthBuffer&&(et|=n.DEPTH_BUFFER_BIT),T.stencilBuffer&&T.resolveStencilBuffer&&(et|=n.STENCIL_BUFFER_BIT)),ft){n.framebufferRenderbuffer(n.READ_FRAMEBUFFER,n.COLOR_ATTACHMENT0,n.RENDERBUFFER,wt.__webglColorRenderbuffer[Mt]);let ie=i.get(v[Mt]).__webglTexture;n.framebufferTexture2D(n.DRAW_FRAMEBUFFER,n.COLOR_ATTACHMENT0,n.TEXTURE_2D,ie,0)}n.blitFramebuffer(0,0,H,K,0,0,H,K,et,n.NEAREST),l===!0&&(at.length=0,A.length=0,at.push(n.COLOR_ATTACHMENT0+Mt),T.depthBuffer&&T.resolveDepthBuffer===!1&&(at.push($),A.push($),n.invalidateFramebuffer(n.DRAW_FRAMEBUFFER,A)),n.invalidateFramebuffer(n.READ_FRAMEBUFFER,at))}if(e.bindFramebuffer(n.READ_FRAMEBUFFER,null),e.bindFramebuffer(n.DRAW_FRAMEBUFFER,null),ft)for(let Mt=0;Mt<v.length;Mt++){e.bindFramebuffer(n.FRAMEBUFFER,wt.__webglMultisampledFramebuffer),n.framebufferRenderbuffer(n.FRAMEBUFFER,n.COLOR_ATTACHMENT0+Mt,n.RENDERBUFFER,wt.__webglColorRenderbuffer[Mt]);let ie=i.get(v[Mt]).__webglTexture;e.bindFramebuffer(n.FRAMEBUFFER,wt.__webglFramebuffer),n.framebufferTexture2D(n.DRAW_FRAMEBUFFER,n.COLOR_ATTACHMENT0+Mt,n.TEXTURE_2D,ie,0)}e.bindFramebuffer(n.DRAW_FRAMEBUFFER,wt.__webglMultisampledFramebuffer)}else if(T.depthBuffer&&T.resolveDepthBuffer===!1&&l){let v=T.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT;n.invalidateFramebuffer(n.DRAW_FRAMEBUFFER,[v])}}}function it(T){return Math.min(s.maxSamples,T.samples)}function Et(T){let v=i.get(T);return T.samples>0&&t.has("WEBGL_multisampled_render_to_texture")===!0&&v.__useRenderToTexture!==!1}function ut(T){let v=o.render.frame;h.get(T)!==v&&(h.set(T,v),T.update())}function Ht(T,v){let H=T.colorSpace,K=T.format,et=T.type;return T.isCompressedTexture===!0||T.isVideoTexture===!0||H!==Yr&&H!==ns&&(oe.getTransfer(H)===xe?(K!==Qn||et!==Li)&&console.warn("THREE.WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):console.error("THREE.WebGLTextures: Unsupported texture color space:",H)),v}function yt(T){return typeof HTMLImageElement<"u"&&T instanceof HTMLImageElement?(c.width=T.naturalWidth||T.width,c.height=T.naturalHeight||T.height):typeof VideoFrame<"u"&&T instanceof VideoFrame?(c.width=T.displayWidth,c.height=T.displayHeight):(c.width=T.width,c.height=T.height),c}this.allocateTextureUnit=V,this.resetTextureUnits=Y,this.setTexture2D=X,this.setTexture2DArray=z,this.setTexture3D=J,this.setTextureCube=k,this.rebindTextures=Gt,this.setupRenderTarget=ue,this.updateRenderTargetMipmap=tt,this.updateMultisampleRenderTarget=It,this.setupDepthRenderbuffer=Zt,this.setupFrameBufferTexture=Tt,this.useMultisampledRTT=Et}function CM(n,t){function e(i,s=ns){let r,o=oe.getTransfer(s);if(i===Li)return n.UNSIGNED_BYTE;if(i===Xu)return n.UNSIGNED_SHORT_4_4_4_4;if(i===Yu)return n.UNSIGNED_SHORT_5_5_5_1;if(i===kp)return n.UNSIGNED_INT_5_9_9_9_REV;if(i===Bp)return n.BYTE;if(i===zp)return n.SHORT;if(i===Ro)return n.UNSIGNED_SHORT;if(i===Wu)return n.INT;if(i===Vs)return n.UNSIGNED_INT;if(i===fi)return n.FLOAT;if(i===Fi)return n.HALF_FLOAT;if(i===Hp)return n.ALPHA;if(i===Vp)return n.RGB;if(i===Qn)return n.RGBA;if(i===Gp)return n.LUMINANCE;if(i===Wp)return n.LUMINANCE_ALPHA;if(i===Lr)return n.DEPTH_COMPONENT;if(i===kr)return n.DEPTH_STENCIL;if(i===qu)return n.RED;if(i===Zu)return n.RED_INTEGER;if(i===Xp)return n.RG;if(i===Ku)return n.RG_INTEGER;if(i===$u)return n.RGBA_INTEGER;if(i===$a||i===Ja||i===ja||i===Qa)if(o===xe)if(r=t.get("WEBGL_compressed_texture_s3tc_srgb"),r!==null){if(i===$a)return r.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(i===Ja)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(i===ja)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(i===Qa)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(r=t.get("WEBGL_compressed_texture_s3tc"),r!==null){if(i===$a)return r.COMPRESSED_RGB_S3TC_DXT1_EXT;if(i===Ja)return r.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(i===ja)return r.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(i===Qa)return r.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(i===Dh||i===Lh||i===Uh||i===Nh)if(r=t.get("WEBGL_compressed_texture_pvrtc"),r!==null){if(i===Dh)return r.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(i===Lh)return r.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(i===Uh)return r.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(i===Nh)return r.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(i===Oh||i===Fh||i===Bh)if(r=t.get("WEBGL_compressed_texture_etc"),r!==null){if(i===Oh||i===Fh)return o===xe?r.COMPRESSED_SRGB8_ETC2:r.COMPRESSED_RGB8_ETC2;if(i===Bh)return o===xe?r.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:r.COMPRESSED_RGBA8_ETC2_EAC}else return null;if(i===zh||i===kh||i===Hh||i===Vh||i===Gh||i===Wh||i===Xh||i===Yh||i===qh||i===Zh||i===Kh||i===$h||i===Jh||i===jh)if(r=t.get("WEBGL_compressed_texture_astc"),r!==null){if(i===zh)return o===xe?r.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:r.COMPRESSED_RGBA_ASTC_4x4_KHR;if(i===kh)return o===xe?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:r.COMPRESSED_RGBA_ASTC_5x4_KHR;if(i===Hh)return o===xe?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:r.COMPRESSED_RGBA_ASTC_5x5_KHR;if(i===Vh)return o===xe?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:r.COMPRESSED_RGBA_ASTC_6x5_KHR;if(i===Gh)return o===xe?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:r.COMPRESSED_RGBA_ASTC_6x6_KHR;if(i===Wh)return o===xe?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:r.COMPRESSED_RGBA_ASTC_8x5_KHR;if(i===Xh)return o===xe?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:r.COMPRESSED_RGBA_ASTC_8x6_KHR;if(i===Yh)return o===xe?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:r.COMPRESSED_RGBA_ASTC_8x8_KHR;if(i===qh)return o===xe?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:r.COMPRESSED_RGBA_ASTC_10x5_KHR;if(i===Zh)return o===xe?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:r.COMPRESSED_RGBA_ASTC_10x6_KHR;if(i===Kh)return o===xe?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:r.COMPRESSED_RGBA_ASTC_10x8_KHR;if(i===$h)return o===xe?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:r.COMPRESSED_RGBA_ASTC_10x10_KHR;if(i===Jh)return o===xe?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:r.COMPRESSED_RGBA_ASTC_12x10_KHR;if(i===jh)return o===xe?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:r.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(i===tl||i===Qh||i===tu)if(r=t.get("EXT_texture_compression_bptc"),r!==null){if(i===tl)return o===xe?r.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:r.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(i===Qh)return r.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(i===tu)return r.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(i===Yp||i===eu||i===nu||i===iu)if(r=t.get("EXT_texture_compression_rgtc"),r!==null){if(i===tl)return r.COMPRESSED_RED_RGTC1_EXT;if(i===eu)return r.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(i===nu)return r.COMPRESSED_RED_GREEN_RGTC2_EXT;if(i===iu)return r.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return i===zr?n.UNSIGNED_INT_24_8:n[i]!==void 0?n[i]:null}return{convert:e}}var _u=class extends tn{constructor(t=[]){super(),this.isArrayCamera=!0,this.cameras=t}},ti=class extends $e{constructor(){super(),this.isGroup=!0,this.type="Group"}},PM={type:"move"},So=class{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new ti,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new ti,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new w,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new w),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new ti,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new w,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new w),this._grip}dispatchEvent(t){return this._targetRay!==null&&this._targetRay.dispatchEvent(t),this._grip!==null&&this._grip.dispatchEvent(t),this._hand!==null&&this._hand.dispatchEvent(t),this}connect(t){if(t&&t.hand){let e=this._hand;if(e)for(let i of t.hand.values())this._getHandJoint(e,i)}return this.dispatchEvent({type:"connected",data:t}),this}disconnect(t){return this.dispatchEvent({type:"disconnected",data:t}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(t,e,i){let s=null,r=null,o=null,a=this._targetRay,l=this._grip,c=this._hand;if(t&&e.session.visibilityState!=="visible-blurred"){if(c&&t.hand){o=!0;for(let _ of t.hand.values()){let g=e.getJointPose(_,i),p=this._getHandJoint(c,_);g!==null&&(p.matrix.fromArray(g.transform.matrix),p.matrix.decompose(p.position,p.rotation,p.scale),p.matrixWorldNeedsUpdate=!0,p.jointRadius=g.radius),p.visible=g!==null}let h=c.joints["index-finger-tip"],u=c.joints["thumb-tip"],d=h.position.distanceTo(u.position),f=.02,m=.005;c.inputState.pinching&&d>f+m?(c.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:t.handedness,target:this})):!c.inputState.pinching&&d<=f-m&&(c.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:t.handedness,target:this}))}else l!==null&&t.gripSpace&&(r=e.getPose(t.gripSpace,i),r!==null&&(l.matrix.fromArray(r.transform.matrix),l.matrix.decompose(l.position,l.rotation,l.scale),l.matrixWorldNeedsUpdate=!0,r.linearVelocity?(l.hasLinearVelocity=!0,l.linearVelocity.copy(r.linearVelocity)):l.hasLinearVelocity=!1,r.angularVelocity?(l.hasAngularVelocity=!0,l.angularVelocity.copy(r.angularVelocity)):l.hasAngularVelocity=!1));a!==null&&(s=e.getPose(t.targetRaySpace,i),s===null&&r!==null&&(s=r),s!==null&&(a.matrix.fromArray(s.transform.matrix),a.matrix.decompose(a.position,a.rotation,a.scale),a.matrixWorldNeedsUpdate=!0,s.linearVelocity?(a.hasLinearVelocity=!0,a.linearVelocity.copy(s.linearVelocity)):a.hasLinearVelocity=!1,s.angularVelocity?(a.hasAngularVelocity=!0,a.angularVelocity.copy(s.angularVelocity)):a.hasAngularVelocity=!1,this.dispatchEvent(PM)))}return a!==null&&(a.visible=s!==null),l!==null&&(l.visible=r!==null),c!==null&&(c.visible=o!==null),this}_getHandJoint(t,e){if(t.joints[e.jointName]===void 0){let i=new ti;i.matrixAutoUpdate=!1,i.visible=!1,t.joints[e.jointName]=i,t.add(i)}return t.joints[e.jointName]}},IM=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,DM=`
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

}`,xu=class{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(t,e,i){if(this.texture===null){let s=new _n,r=t.properties.get(s);r.__webglTexture=e.texture,(e.depthNear!=i.depthNear||e.depthFar!=i.depthFar)&&(this.depthNear=e.depthNear,this.depthFar=e.depthFar),this.texture=s}}getMesh(t){if(this.texture!==null&&this.mesh===null){let e=t.cameras[0].viewport,i=new cn({vertexShader:IM,fragmentShader:DM,uniforms:{depthColor:{value:this.texture},depthWidth:{value:e.z},depthHeight:{value:e.w}}});this.mesh=new Ft(new ni(20,20),i)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}},vu=class extends Ui{constructor(t,e){super();let i=this,s=null,r=1,o=null,a="local-floor",l=1,c=null,h=null,u=null,d=null,f=null,m=null,_=new xu,g=e.getContextAttributes(),p=null,S=null,M=[],x=[],L=new nt,R=null,C=new tn;C.viewport=new Ee;let D=new tn;D.viewport=new Ee;let b=[C,D],y=new _u,I=null,Y=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(Z){let st=M[Z];return st===void 0&&(st=new So,M[Z]=st),st.getTargetRaySpace()},this.getControllerGrip=function(Z){let st=M[Z];return st===void 0&&(st=new So,M[Z]=st),st.getGripSpace()},this.getHand=function(Z){let st=M[Z];return st===void 0&&(st=new So,M[Z]=st),st.getHandSpace()};function V(Z){let st=x.indexOf(Z.inputSource);if(st===-1)return;let Tt=M[st];Tt!==void 0&&(Tt.update(Z.inputSource,Z.frame,c||o),Tt.dispatchEvent({type:Z.type,data:Z.inputSource}))}function F(){s.removeEventListener("select",V),s.removeEventListener("selectstart",V),s.removeEventListener("selectend",V),s.removeEventListener("squeeze",V),s.removeEventListener("squeezestart",V),s.removeEventListener("squeezeend",V),s.removeEventListener("end",F),s.removeEventListener("inputsourceschange",X);for(let Z=0;Z<M.length;Z++){let st=x[Z];st!==null&&(x[Z]=null,M[Z].disconnect(st))}I=null,Y=null,_.reset(),t.setRenderTarget(p),f=null,d=null,u=null,s=null,S=null,Xt.stop(),i.isPresenting=!1,t.setPixelRatio(R),t.setSize(L.width,L.height,!1),i.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(Z){r=Z,i.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(Z){a=Z,i.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return c||o},this.setReferenceSpace=function(Z){c=Z},this.getBaseLayer=function(){return d!==null?d:f},this.getBinding=function(){return u},this.getFrame=function(){return m},this.getSession=function(){return s},this.setSession=async function(Z){if(s=Z,s!==null){if(p=t.getRenderTarget(),s.addEventListener("select",V),s.addEventListener("selectstart",V),s.addEventListener("selectend",V),s.addEventListener("squeeze",V),s.addEventListener("squeezestart",V),s.addEventListener("squeezeend",V),s.addEventListener("end",F),s.addEventListener("inputsourceschange",X),g.xrCompatible!==!0&&await e.makeXRCompatible(),R=t.getPixelRatio(),t.getSize(L),s.renderState.layers===void 0){let st={antialias:g.antialias,alpha:!0,depth:g.depth,stencil:g.stencil,framebufferScaleFactor:r};f=new XRWebGLLayer(s,e,st),s.updateRenderState({baseLayer:f}),t.setPixelRatio(1),t.setSize(f.framebufferWidth,f.framebufferHeight,!1),S=new xn(f.framebufferWidth,f.framebufferHeight,{format:Qn,type:Li,colorSpace:t.outputColorSpace,stencilBuffer:g.stencil})}else{let st=null,Tt=null,ht=null;g.depth&&(ht=g.stencil?e.DEPTH24_STENCIL8:e.DEPTH_COMPONENT24,st=g.stencil?kr:Lr,Tt=g.stencil?zr:Vs);let Bt={colorFormat:e.RGBA8,depthFormat:ht,scaleFactor:r};u=new XRWebGLBinding(s,e),d=u.createProjectionLayer(Bt),s.updateRenderState({layers:[d]}),t.setPixelRatio(1),t.setSize(d.textureWidth,d.textureHeight,!1),S=new xn(d.textureWidth,d.textureHeight,{format:Qn,type:Li,depthTexture:new cl(d.textureWidth,d.textureHeight,Tt,void 0,void 0,void 0,void 0,void 0,void 0,st),stencilBuffer:g.stencil,colorSpace:t.outputColorSpace,samples:g.antialias?4:0,resolveDepthBuffer:d.ignoreDepthValues===!1})}S.isXRRenderTarget=!0,this.setFoveation(l),c=null,o=await s.requestReferenceSpace(a),Xt.setContext(s),Xt.start(),i.isPresenting=!0,i.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(s!==null)return s.environmentBlendMode},this.getDepthTexture=function(){return _.getDepthTexture()};function X(Z){for(let st=0;st<Z.removed.length;st++){let Tt=Z.removed[st],ht=x.indexOf(Tt);ht>=0&&(x[ht]=null,M[ht].disconnect(Tt))}for(let st=0;st<Z.added.length;st++){let Tt=Z.added[st],ht=x.indexOf(Tt);if(ht===-1){for(let Zt=0;Zt<M.length;Zt++)if(Zt>=x.length){x.push(Tt),ht=Zt;break}else if(x[Zt]===null){x[Zt]=Tt,ht=Zt;break}if(ht===-1)break}let Bt=M[ht];Bt&&Bt.connect(Tt)}}let z=new w,J=new w;function k(Z,st,Tt){z.setFromMatrixPosition(st.matrixWorld),J.setFromMatrixPosition(Tt.matrixWorld);let ht=z.distanceTo(J),Bt=st.projectionMatrix.elements,Zt=Tt.projectionMatrix.elements,Gt=Bt[14]/(Bt[10]-1),ue=Bt[14]/(Bt[10]+1),tt=(Bt[9]+1)/Bt[5],at=(Bt[9]-1)/Bt[5],A=(Bt[8]-1)/Bt[0],It=(Zt[8]+1)/Zt[0],it=Gt*A,Et=Gt*It,ut=ht/(-A+It),Ht=ut*-A;if(st.matrixWorld.decompose(Z.position,Z.quaternion,Z.scale),Z.translateX(Ht),Z.translateZ(ut),Z.matrixWorld.compose(Z.position,Z.quaternion,Z.scale),Z.matrixWorldInverse.copy(Z.matrixWorld).invert(),Bt[10]===-1)Z.projectionMatrix.copy(st.projectionMatrix),Z.projectionMatrixInverse.copy(st.projectionMatrixInverse);else{let yt=Gt+ut,T=ue+ut,v=it-Ht,H=Et+(ht-Ht),K=tt*ue/T*yt,et=at*ue/T*yt;Z.projectionMatrix.makePerspective(v,H,K,et,yt,T),Z.projectionMatrixInverse.copy(Z.projectionMatrix).invert()}}function rt(Z,st){st===null?Z.matrixWorld.copy(Z.matrix):Z.matrixWorld.multiplyMatrices(st.matrixWorld,Z.matrix),Z.matrixWorldInverse.copy(Z.matrixWorld).invert()}this.updateCamera=function(Z){if(s===null)return;let st=Z.near,Tt=Z.far;_.texture!==null&&(_.depthNear>0&&(st=_.depthNear),_.depthFar>0&&(Tt=_.depthFar)),y.near=D.near=C.near=st,y.far=D.far=C.far=Tt,(I!==y.near||Y!==y.far)&&(s.updateRenderState({depthNear:y.near,depthFar:y.far}),I=y.near,Y=y.far),C.layers.mask=Z.layers.mask|2,D.layers.mask=Z.layers.mask|4,y.layers.mask=C.layers.mask|D.layers.mask;let ht=Z.parent,Bt=y.cameras;rt(y,ht);for(let Zt=0;Zt<Bt.length;Zt++)rt(Bt[Zt],ht);Bt.length===2?k(y,C,D):y.projectionMatrix.copy(C.projectionMatrix),ct(Z,y,ht)};function ct(Z,st,Tt){Tt===null?Z.matrix.copy(st.matrixWorld):(Z.matrix.copy(Tt.matrixWorld),Z.matrix.invert(),Z.matrix.multiply(st.matrixWorld)),Z.matrix.decompose(Z.position,Z.quaternion,Z.scale),Z.updateMatrixWorld(!0),Z.projectionMatrix.copy(st.projectionMatrix),Z.projectionMatrixInverse.copy(st.projectionMatrixInverse),Z.isPerspectiveCamera&&(Z.fov=Co*2*Math.atan(1/Z.projectionMatrix.elements[5]),Z.zoom=1)}this.getCamera=function(){return y},this.getFoveation=function(){if(!(d===null&&f===null))return l},this.setFoveation=function(Z){l=Z,d!==null&&(d.fixedFoveation=Z),f!==null&&f.fixedFoveation!==void 0&&(f.fixedFoveation=Z)},this.hasDepthSensing=function(){return _.texture!==null},this.getDepthSensingMesh=function(){return _.getMesh(y)};let mt=null;function kt(Z,st){if(h=st.getViewerPose(c||o),m=st,h!==null){let Tt=h.views;f!==null&&(t.setRenderTargetFramebuffer(S,f.framebuffer),t.setRenderTarget(S));let ht=!1;Tt.length!==y.cameras.length&&(y.cameras.length=0,ht=!0);for(let Zt=0;Zt<Tt.length;Zt++){let Gt=Tt[Zt],ue=null;if(f!==null)ue=f.getViewport(Gt);else{let at=u.getViewSubImage(d,Gt);ue=at.viewport,Zt===0&&(t.setRenderTargetTextures(S,at.colorTexture,d.ignoreDepthValues?void 0:at.depthStencilTexture),t.setRenderTarget(S))}let tt=b[Zt];tt===void 0&&(tt=new tn,tt.layers.enable(Zt),tt.viewport=new Ee,b[Zt]=tt),tt.matrix.fromArray(Gt.transform.matrix),tt.matrix.decompose(tt.position,tt.quaternion,tt.scale),tt.projectionMatrix.fromArray(Gt.projectionMatrix),tt.projectionMatrixInverse.copy(tt.projectionMatrix).invert(),tt.viewport.set(ue.x,ue.y,ue.width,ue.height),Zt===0&&(y.matrix.copy(tt.matrix),y.matrix.decompose(y.position,y.quaternion,y.scale)),ht===!0&&y.cameras.push(tt)}let Bt=s.enabledFeatures;if(Bt&&Bt.includes("depth-sensing")){let Zt=u.getDepthInformation(Tt[0]);Zt&&Zt.isValid&&Zt.texture&&_.init(t,Zt,s.renderState)}}for(let Tt=0;Tt<M.length;Tt++){let ht=x[Tt],Bt=M[Tt];ht!==null&&Bt!==void 0&&Bt.update(ht,st,c||o)}mt&&mt(Z,st),st.detectedPlanes&&i.dispatchEvent({type:"planesdetected",data:st}),m=null}let Xt=new jp;Xt.setAnimationLoop(kt),this.setAnimationLoop=function(Z){mt=Z},this.dispose=function(){}}},Ns=new pi,LM=new be;function UM(n,t){function e(g,p){g.matrixAutoUpdate===!0&&g.updateMatrix(),p.value.copy(g.matrix)}function i(g,p){p.color.getRGB(g.fogColor.value,Jp(n)),p.isFog?(g.fogNear.value=p.near,g.fogFar.value=p.far):p.isFogExp2&&(g.fogDensity.value=p.density)}function s(g,p,S,M,x){p.isMeshBasicMaterial||p.isMeshLambertMaterial?r(g,p):p.isMeshToonMaterial?(r(g,p),u(g,p)):p.isMeshPhongMaterial?(r(g,p),h(g,p)):p.isMeshStandardMaterial?(r(g,p),d(g,p),p.isMeshPhysicalMaterial&&f(g,p,x)):p.isMeshMatcapMaterial?(r(g,p),m(g,p)):p.isMeshDepthMaterial?r(g,p):p.isMeshDistanceMaterial?(r(g,p),_(g,p)):p.isMeshNormalMaterial?r(g,p):p.isLineBasicMaterial?(o(g,p),p.isLineDashedMaterial&&a(g,p)):p.isPointsMaterial?l(g,p,S,M):p.isSpriteMaterial?c(g,p):p.isShadowMaterial?(g.color.value.copy(p.color),g.opacity.value=p.opacity):p.isShaderMaterial&&(p.uniformsNeedUpdate=!1)}function r(g,p){g.opacity.value=p.opacity,p.color&&g.diffuse.value.copy(p.color),p.emissive&&g.emissive.value.copy(p.emissive).multiplyScalar(p.emissiveIntensity),p.map&&(g.map.value=p.map,e(p.map,g.mapTransform)),p.alphaMap&&(g.alphaMap.value=p.alphaMap,e(p.alphaMap,g.alphaMapTransform)),p.bumpMap&&(g.bumpMap.value=p.bumpMap,e(p.bumpMap,g.bumpMapTransform),g.bumpScale.value=p.bumpScale,p.side===an&&(g.bumpScale.value*=-1)),p.normalMap&&(g.normalMap.value=p.normalMap,e(p.normalMap,g.normalMapTransform),g.normalScale.value.copy(p.normalScale),p.side===an&&g.normalScale.value.negate()),p.displacementMap&&(g.displacementMap.value=p.displacementMap,e(p.displacementMap,g.displacementMapTransform),g.displacementScale.value=p.displacementScale,g.displacementBias.value=p.displacementBias),p.emissiveMap&&(g.emissiveMap.value=p.emissiveMap,e(p.emissiveMap,g.emissiveMapTransform)),p.specularMap&&(g.specularMap.value=p.specularMap,e(p.specularMap,g.specularMapTransform)),p.alphaTest>0&&(g.alphaTest.value=p.alphaTest);let S=t.get(p),M=S.envMap,x=S.envMapRotation;M&&(g.envMap.value=M,Ns.copy(x),Ns.x*=-1,Ns.y*=-1,Ns.z*=-1,M.isCubeTexture&&M.isRenderTargetTexture===!1&&(Ns.y*=-1,Ns.z*=-1),g.envMapRotation.value.setFromMatrix4(LM.makeRotationFromEuler(Ns)),g.flipEnvMap.value=M.isCubeTexture&&M.isRenderTargetTexture===!1?-1:1,g.reflectivity.value=p.reflectivity,g.ior.value=p.ior,g.refractionRatio.value=p.refractionRatio),p.lightMap&&(g.lightMap.value=p.lightMap,g.lightMapIntensity.value=p.lightMapIntensity,e(p.lightMap,g.lightMapTransform)),p.aoMap&&(g.aoMap.value=p.aoMap,g.aoMapIntensity.value=p.aoMapIntensity,e(p.aoMap,g.aoMapTransform))}function o(g,p){g.diffuse.value.copy(p.color),g.opacity.value=p.opacity,p.map&&(g.map.value=p.map,e(p.map,g.mapTransform))}function a(g,p){g.dashSize.value=p.dashSize,g.totalSize.value=p.dashSize+p.gapSize,g.scale.value=p.scale}function l(g,p,S,M){g.diffuse.value.copy(p.color),g.opacity.value=p.opacity,g.size.value=p.size*S,g.scale.value=M*.5,p.map&&(g.map.value=p.map,e(p.map,g.uvTransform)),p.alphaMap&&(g.alphaMap.value=p.alphaMap,e(p.alphaMap,g.alphaMapTransform)),p.alphaTest>0&&(g.alphaTest.value=p.alphaTest)}function c(g,p){g.diffuse.value.copy(p.color),g.opacity.value=p.opacity,g.rotation.value=p.rotation,p.map&&(g.map.value=p.map,e(p.map,g.mapTransform)),p.alphaMap&&(g.alphaMap.value=p.alphaMap,e(p.alphaMap,g.alphaMapTransform)),p.alphaTest>0&&(g.alphaTest.value=p.alphaTest)}function h(g,p){g.specular.value.copy(p.specular),g.shininess.value=Math.max(p.shininess,1e-4)}function u(g,p){p.gradientMap&&(g.gradientMap.value=p.gradientMap)}function d(g,p){g.metalness.value=p.metalness,p.metalnessMap&&(g.metalnessMap.value=p.metalnessMap,e(p.metalnessMap,g.metalnessMapTransform)),g.roughness.value=p.roughness,p.roughnessMap&&(g.roughnessMap.value=p.roughnessMap,e(p.roughnessMap,g.roughnessMapTransform)),p.envMap&&(g.envMapIntensity.value=p.envMapIntensity)}function f(g,p,S){g.ior.value=p.ior,p.sheen>0&&(g.sheenColor.value.copy(p.sheenColor).multiplyScalar(p.sheen),g.sheenRoughness.value=p.sheenRoughness,p.sheenColorMap&&(g.sheenColorMap.value=p.sheenColorMap,e(p.sheenColorMap,g.sheenColorMapTransform)),p.sheenRoughnessMap&&(g.sheenRoughnessMap.value=p.sheenRoughnessMap,e(p.sheenRoughnessMap,g.sheenRoughnessMapTransform))),p.clearcoat>0&&(g.clearcoat.value=p.clearcoat,g.clearcoatRoughness.value=p.clearcoatRoughness,p.clearcoatMap&&(g.clearcoatMap.value=p.clearcoatMap,e(p.clearcoatMap,g.clearcoatMapTransform)),p.clearcoatRoughnessMap&&(g.clearcoatRoughnessMap.value=p.clearcoatRoughnessMap,e(p.clearcoatRoughnessMap,g.clearcoatRoughnessMapTransform)),p.clearcoatNormalMap&&(g.clearcoatNormalMap.value=p.clearcoatNormalMap,e(p.clearcoatNormalMap,g.clearcoatNormalMapTransform),g.clearcoatNormalScale.value.copy(p.clearcoatNormalScale),p.side===an&&g.clearcoatNormalScale.value.negate())),p.dispersion>0&&(g.dispersion.value=p.dispersion),p.iridescence>0&&(g.iridescence.value=p.iridescence,g.iridescenceIOR.value=p.iridescenceIOR,g.iridescenceThicknessMinimum.value=p.iridescenceThicknessRange[0],g.iridescenceThicknessMaximum.value=p.iridescenceThicknessRange[1],p.iridescenceMap&&(g.iridescenceMap.value=p.iridescenceMap,e(p.iridescenceMap,g.iridescenceMapTransform)),p.iridescenceThicknessMap&&(g.iridescenceThicknessMap.value=p.iridescenceThicknessMap,e(p.iridescenceThicknessMap,g.iridescenceThicknessMapTransform))),p.transmission>0&&(g.transmission.value=p.transmission,g.transmissionSamplerMap.value=S.texture,g.transmissionSamplerSize.value.set(S.width,S.height),p.transmissionMap&&(g.transmissionMap.value=p.transmissionMap,e(p.transmissionMap,g.transmissionMapTransform)),g.thickness.value=p.thickness,p.thicknessMap&&(g.thicknessMap.value=p.thicknessMap,e(p.thicknessMap,g.thicknessMapTransform)),g.attenuationDistance.value=p.attenuationDistance,g.attenuationColor.value.copy(p.attenuationColor)),p.anisotropy>0&&(g.anisotropyVector.value.set(p.anisotropy*Math.cos(p.anisotropyRotation),p.anisotropy*Math.sin(p.anisotropyRotation)),p.anisotropyMap&&(g.anisotropyMap.value=p.anisotropyMap,e(p.anisotropyMap,g.anisotropyMapTransform))),g.specularIntensity.value=p.specularIntensity,g.specularColor.value.copy(p.specularColor),p.specularColorMap&&(g.specularColorMap.value=p.specularColorMap,e(p.specularColorMap,g.specularColorMapTransform)),p.specularIntensityMap&&(g.specularIntensityMap.value=p.specularIntensityMap,e(p.specularIntensityMap,g.specularIntensityMapTransform))}function m(g,p){p.matcap&&(g.matcap.value=p.matcap)}function _(g,p){let S=t.get(p).light;g.referencePosition.value.setFromMatrixPosition(S.matrixWorld),g.nearDistance.value=S.shadow.camera.near,g.farDistance.value=S.shadow.camera.far}return{refreshFogUniforms:i,refreshMaterialUniforms:s}}function NM(n,t,e,i){let s={},r={},o=[],a=n.getParameter(n.MAX_UNIFORM_BUFFER_BINDINGS);function l(S,M){let x=M.program;i.uniformBlockBinding(S,x)}function c(S,M){let x=s[S.id];x===void 0&&(m(S),x=h(S),s[S.id]=x,S.addEventListener("dispose",g));let L=M.program;i.updateUBOMapping(S,L);let R=t.render.frame;r[S.id]!==R&&(d(S),r[S.id]=R)}function h(S){let M=u();S.__bindingPointIndex=M;let x=n.createBuffer(),L=S.__size,R=S.usage;return n.bindBuffer(n.UNIFORM_BUFFER,x),n.bufferData(n.UNIFORM_BUFFER,L,R),n.bindBuffer(n.UNIFORM_BUFFER,null),n.bindBufferBase(n.UNIFORM_BUFFER,M,x),x}function u(){for(let S=0;S<a;S++)if(o.indexOf(S)===-1)return o.push(S),S;return console.error("THREE.WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function d(S){let M=s[S.id],x=S.uniforms,L=S.__cache;n.bindBuffer(n.UNIFORM_BUFFER,M);for(let R=0,C=x.length;R<C;R++){let D=Array.isArray(x[R])?x[R]:[x[R]];for(let b=0,y=D.length;b<y;b++){let I=D[b];if(f(I,R,b,L)===!0){let Y=I.__offset,V=Array.isArray(I.value)?I.value:[I.value],F=0;for(let X=0;X<V.length;X++){let z=V[X],J=_(z);typeof z=="number"||typeof z=="boolean"?(I.__data[0]=z,n.bufferSubData(n.UNIFORM_BUFFER,Y+F,I.__data)):z.isMatrix3?(I.__data[0]=z.elements[0],I.__data[1]=z.elements[1],I.__data[2]=z.elements[2],I.__data[3]=0,I.__data[4]=z.elements[3],I.__data[5]=z.elements[4],I.__data[6]=z.elements[5],I.__data[7]=0,I.__data[8]=z.elements[6],I.__data[9]=z.elements[7],I.__data[10]=z.elements[8],I.__data[11]=0):(z.toArray(I.__data,F),F+=J.storage/Float32Array.BYTES_PER_ELEMENT)}n.bufferSubData(n.UNIFORM_BUFFER,Y,I.__data)}}}n.bindBuffer(n.UNIFORM_BUFFER,null)}function f(S,M,x,L){let R=S.value,C=M+"_"+x;if(L[C]===void 0)return typeof R=="number"||typeof R=="boolean"?L[C]=R:L[C]=R.clone(),!0;{let D=L[C];if(typeof R=="number"||typeof R=="boolean"){if(D!==R)return L[C]=R,!0}else if(D.equals(R)===!1)return D.copy(R),!0}return!1}function m(S){let M=S.uniforms,x=0,L=16;for(let C=0,D=M.length;C<D;C++){let b=Array.isArray(M[C])?M[C]:[M[C]];for(let y=0,I=b.length;y<I;y++){let Y=b[y],V=Array.isArray(Y.value)?Y.value:[Y.value];for(let F=0,X=V.length;F<X;F++){let z=V[F],J=_(z),k=x%L,rt=k%J.boundary,ct=k+rt;x+=rt,ct!==0&&L-ct<J.storage&&(x+=L-ct),Y.__data=new Float32Array(J.storage/Float32Array.BYTES_PER_ELEMENT),Y.__offset=x,x+=J.storage}}}let R=x%L;return R>0&&(x+=L-R),S.__size=x,S.__cache={},this}function _(S){let M={boundary:0,storage:0};return typeof S=="number"||typeof S=="boolean"?(M.boundary=4,M.storage=4):S.isVector2?(M.boundary=8,M.storage=8):S.isVector3||S.isColor?(M.boundary=16,M.storage=12):S.isVector4?(M.boundary=16,M.storage=16):S.isMatrix3?(M.boundary=48,M.storage=48):S.isMatrix4?(M.boundary=64,M.storage=64):S.isTexture?console.warn("THREE.WebGLRenderer: Texture samplers can not be part of an uniforms group."):console.warn("THREE.WebGLRenderer: Unsupported uniform value type.",S),M}function g(S){let M=S.target;M.removeEventListener("dispose",g);let x=o.indexOf(M.__bindingPointIndex);o.splice(x,1),n.deleteBuffer(s[M.id]),delete s[M.id],delete r[M.id]}function p(){for(let S in s)n.deleteBuffer(s[S]);o=[],s={},r={}}return{bind:l,update:c,dispose:p}}var hl=class{constructor(t={}){let{canvas:e=kg(),context:i=null,depth:s=!0,stencil:r=!1,alpha:o=!1,antialias:a=!1,premultipliedAlpha:l=!0,preserveDrawingBuffer:c=!1,powerPreference:h="default",failIfMajorPerformanceCaveat:u=!1,reverseDepthBuffer:d=!1}=t;this.isWebGLRenderer=!0;let f;if(i!==null){if(typeof WebGLRenderingContext<"u"&&i instanceof WebGLRenderingContext)throw new Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");f=i.getContextAttributes().alpha}else f=o;let m=new Uint32Array(4),_=new Int32Array(4),g=null,p=null,S=[],M=[];this.domElement=e,this.debug={checkShaderErrors:!0,onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this._outputColorSpace=Ve,this.toneMapping=is,this.toneMappingExposure=1;let x=this,L=!1,R=0,C=0,D=null,b=-1,y=null,I=new Ee,Y=new Ee,V=null,F=new Yt(0),X=0,z=e.width,J=e.height,k=1,rt=null,ct=null,mt=new Ee(0,0,z,J),kt=new Ee(0,0,z,J),Xt=!1,Z=new Do,st=!1,Tt=!1,ht=new be,Bt=new be,Zt=new w,Gt=new Ee,ue={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0},tt=!1;function at(){return D===null?k:1}let A=i;function It(E,N){return e.getContext(E,N)}try{let E={alpha:!0,depth:s,stencil:r,antialias:a,premultipliedAlpha:l,preserveDrawingBuffer:c,powerPreference:h,failIfMajorPerformanceCaveat:u};if("setAttribute"in e&&e.setAttribute("data-engine",`three.js r${Fu}`),e.addEventListener("webglcontextlost",Q,!1),e.addEventListener("webglcontextrestored",xt,!1),e.addEventListener("webglcontextcreationerror",gt,!1),A===null){let N="webgl2";if(A=It(N,E),A===null)throw It(N)?new Error("Error creating WebGL context with your selected attributes."):new Error("Error creating WebGL context.")}}catch(E){throw console.error("THREE.WebGLRenderer: "+E.message),E}let it,Et,ut,Ht,yt,T,v,H,K,et,$,wt,ft,Mt,ie,ot,bt,Vt,qt,St,ae,Qt,we,U;function pt(){it=new Jv(A),it.init(),Qt=new CM(A,it),Et=new Xv(A,it,t,Qt),ut=new wM(A,it),Et.reverseDepthBuffer&&d&&ut.buffers.depth.setReversed(!0),Ht=new ty(A),yt=new fM,T=new RM(A,it,ut,yt,Et,Qt,Ht),v=new qv(x),H=new $v(x),K=new a_(A),we=new Gv(A,K),et=new jv(A,K,Ht,we),$=new ny(A,et,K,Ht),qt=new ey(A,Et,T),ot=new Yv(yt),wt=new dM(x,v,H,it,Et,we,ot),ft=new UM(x,yt),Mt=new mM,ie=new MM(it),Vt=new Vv(x,v,H,ut,$,f,l),bt=new SM(x,$,Et),U=new NM(A,Ht,Et,ut),St=new Wv(A,it,Ht),ae=new Qv(A,it,Ht),Ht.programs=wt.programs,x.capabilities=Et,x.extensions=it,x.properties=yt,x.renderLists=Mt,x.shadowMap=bt,x.state=ut,x.info=Ht}pt();let q=new vu(x,A);this.xr=q,this.getContext=function(){return A},this.getContextAttributes=function(){return A.getContextAttributes()},this.forceContextLoss=function(){let E=it.get("WEBGL_lose_context");E&&E.loseContext()},this.forceContextRestore=function(){let E=it.get("WEBGL_lose_context");E&&E.restoreContext()},this.getPixelRatio=function(){return k},this.setPixelRatio=function(E){E!==void 0&&(k=E,this.setSize(z,J,!1))},this.getSize=function(E){return E.set(z,J)},this.setSize=function(E,N,G=!0){if(q.isPresenting){console.warn("THREE.WebGLRenderer: Can't change size while VR device is presenting.");return}z=E,J=N,e.width=Math.floor(E*k),e.height=Math.floor(N*k),G===!0&&(e.style.width=E+"px",e.style.height=N+"px"),this.setViewport(0,0,E,N)},this.getDrawingBufferSize=function(E){return E.set(z*k,J*k).floor()},this.setDrawingBufferSize=function(E,N,G){z=E,J=N,k=G,e.width=Math.floor(E*G),e.height=Math.floor(N*G),this.setViewport(0,0,E,N)},this.getCurrentViewport=function(E){return E.copy(I)},this.getViewport=function(E){return E.copy(mt)},this.setViewport=function(E,N,G,W){E.isVector4?mt.set(E.x,E.y,E.z,E.w):mt.set(E,N,G,W),ut.viewport(I.copy(mt).multiplyScalar(k).round())},this.getScissor=function(E){return E.copy(kt)},this.setScissor=function(E,N,G,W){E.isVector4?kt.set(E.x,E.y,E.z,E.w):kt.set(E,N,G,W),ut.scissor(Y.copy(kt).multiplyScalar(k).round())},this.getScissorTest=function(){return Xt},this.setScissorTest=function(E){ut.setScissorTest(Xt=E)},this.setOpaqueSort=function(E){rt=E},this.setTransparentSort=function(E){ct=E},this.getClearColor=function(E){return E.copy(Vt.getClearColor())},this.setClearColor=function(){Vt.setClearColor.apply(Vt,arguments)},this.getClearAlpha=function(){return Vt.getClearAlpha()},this.setClearAlpha=function(){Vt.setClearAlpha.apply(Vt,arguments)},this.clear=function(E=!0,N=!0,G=!0){let W=0;if(E){let O=!1;if(D!==null){let lt=D.texture.format;O=lt===$u||lt===Ku||lt===Zu}if(O){let lt=D.texture.type,_t=lt===Li||lt===Vs||lt===Ro||lt===zr||lt===Xu||lt===Yu,At=Vt.getClearColor(),Rt=Vt.getClearAlpha(),Kt=At.r,Jt=At.g,Ct=At.b;_t?(m[0]=Kt,m[1]=Jt,m[2]=Ct,m[3]=Rt,A.clearBufferuiv(A.COLOR,0,m)):(_[0]=Kt,_[1]=Jt,_[2]=Ct,_[3]=Rt,A.clearBufferiv(A.COLOR,0,_))}else W|=A.COLOR_BUFFER_BIT}N&&(W|=A.DEPTH_BUFFER_BIT),G&&(W|=A.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),A.clear(W)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.dispose=function(){e.removeEventListener("webglcontextlost",Q,!1),e.removeEventListener("webglcontextrestored",xt,!1),e.removeEventListener("webglcontextcreationerror",gt,!1),Mt.dispose(),ie.dispose(),yt.dispose(),v.dispose(),H.dispose(),$.dispose(),we.dispose(),U.dispose(),wt.dispose(),q.dispose(),q.removeEventListener("sessionstart",lf),q.removeEventListener("sessionend",cf),Cs.stop()};function Q(E){E.preventDefault(),console.log("THREE.WebGLRenderer: Context Lost."),L=!0}function xt(){console.log("THREE.WebGLRenderer: Context Restored."),L=!1;let E=Ht.autoReset,N=bt.enabled,G=bt.autoUpdate,W=bt.needsUpdate,O=bt.type;pt(),Ht.autoReset=E,bt.enabled=N,bt.autoUpdate=G,bt.needsUpdate=W,bt.type=O}function gt(E){console.error("THREE.WebGLRenderer: A WebGL context could not be created. Reason: ",E.statusMessage)}function $t(E){let N=E.target;N.removeEventListener("dispose",$t),Oe(N)}function Oe(E){sn(E),yt.remove(E)}function sn(E){let N=yt.get(E).programs;N!==void 0&&(N.forEach(function(G){wt.releaseProgram(G)}),E.isShaderMaterial&&wt.releaseShaderCache(E))}this.renderBufferDirect=function(E,N,G,W,O,lt){N===null&&(N=ue);let _t=O.isMesh&&O.matrixWorld.determinant()<0,At=V0(E,N,G,W,O);ut.setMaterial(W,_t);let Rt=G.index,Kt=1;if(W.wireframe===!0){if(Rt=et.getWireframeAttribute(G),Rt===void 0)return;Kt=2}let Jt=G.drawRange,Ct=G.attributes.position,pe=Jt.start*Kt,Ae=(Jt.start+Jt.count)*Kt;lt!==null&&(pe=Math.max(pe,lt.start*Kt),Ae=Math.min(Ae,(lt.start+lt.count)*Kt)),Rt!==null?(pe=Math.max(pe,0),Ae=Math.min(Ae,Rt.count)):Ct!=null&&(pe=Math.max(pe,0),Ae=Math.min(Ae,Ct.count));let Ce=Ae-pe;if(Ce<0||Ce===1/0)return;we.setup(O,W,At,G,Rt);let En,ge=St;if(Rt!==null&&(En=K.get(Rt),ge=ae,ge.setIndex(En)),O.isMesh)W.wireframe===!0?(ut.setLineWidth(W.wireframeLinewidth*at()),ge.setMode(A.LINES)):ge.setMode(A.TRIANGLES);else if(O.isLine){let Ut=W.linewidth;Ut===void 0&&(Ut=1),ut.setLineWidth(Ut*at()),O.isLineSegments?ge.setMode(A.LINES):O.isLineLoop?ge.setMode(A.LINE_LOOP):ge.setMode(A.LINE_STRIP)}else O.isPoints?ge.setMode(A.POINTS):O.isSprite&&ge.setMode(A.TRIANGLES);if(O.isBatchedMesh)if(O._multiDrawInstances!==null)ge.renderMultiDrawInstances(O._multiDrawStarts,O._multiDrawCounts,O._multiDrawCount,O._multiDrawInstances);else if(it.get("WEBGL_multi_draw"))ge.renderMultiDraw(O._multiDrawStarts,O._multiDrawCounts,O._multiDrawCount);else{let Ut=O._multiDrawStarts,bi=O._multiDrawCounts,_e=O._multiDrawCount,Kn=Rt?K.get(Rt).bytesPerElement:1,fr=yt.get(W).currentProgram.getUniforms();for(let Rn=0;Rn<_e;Rn++)fr.setValue(A,"_gl_DrawID",Rn),ge.render(Ut[Rn]/Kn,bi[Rn])}else if(O.isInstancedMesh)ge.renderInstances(pe,Ce,O.count);else if(G.isInstancedBufferGeometry){let Ut=G._maxInstanceCount!==void 0?G._maxInstanceCount:1/0,bi=Math.min(G.instanceCount,Ut);ge.renderInstances(pe,Ce,bi)}else ge.render(pe,Ce)};function ve(E,N,G){E.transparent===!0&&E.side===Dn&&E.forceSinglePass===!1?(E.side=an,E.needsUpdate=!0,ya(E,N,G),E.side=rs,E.needsUpdate=!0,ya(E,N,G),E.side=Dn):ya(E,N,G)}this.compile=function(E,N,G=null){G===null&&(G=E),p=ie.get(G),p.init(N),M.push(p),G.traverseVisible(function(O){O.isLight&&O.layers.test(N.layers)&&(p.pushLight(O),O.castShadow&&p.pushShadow(O))}),E!==G&&E.traverseVisible(function(O){O.isLight&&O.layers.test(N.layers)&&(p.pushLight(O),O.castShadow&&p.pushShadow(O))}),p.setupLights();let W=new Set;return E.traverse(function(O){if(!(O.isMesh||O.isPoints||O.isLine||O.isSprite))return;let lt=O.material;if(lt)if(Array.isArray(lt))for(let _t=0;_t<lt.length;_t++){let At=lt[_t];ve(At,G,O),W.add(At)}else ve(lt,G,O),W.add(lt)}),M.pop(),p=null,W},this.compileAsync=function(E,N,G=null){let W=this.compile(E,N,G);return new Promise(O=>{function lt(){if(W.forEach(function(_t){yt.get(_t).currentProgram.isReady()&&W.delete(_t)}),W.size===0){O(E);return}setTimeout(lt,10)}it.get("KHR_parallel_shader_compile")!==null?lt():setTimeout(lt,10)})};let Zn=null;function Ei(E){Zn&&Zn(E)}function lf(){Cs.stop()}function cf(){Cs.start()}let Cs=new jp;Cs.setAnimationLoop(Ei),typeof self<"u"&&Cs.setContext(self),this.setAnimationLoop=function(E){Zn=E,q.setAnimationLoop(E),E===null?Cs.stop():Cs.start()},q.addEventListener("sessionstart",lf),q.addEventListener("sessionend",cf),this.render=function(E,N){if(N!==void 0&&N.isCamera!==!0){console.error("THREE.WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(L===!0)return;if(E.matrixWorldAutoUpdate===!0&&E.updateMatrixWorld(),N.parent===null&&N.matrixWorldAutoUpdate===!0&&N.updateMatrixWorld(),q.enabled===!0&&q.isPresenting===!0&&(q.cameraAutoUpdate===!0&&q.updateCamera(N),N=q.getCamera()),E.isScene===!0&&E.onBeforeRender(x,E,N,D),p=ie.get(E,M.length),p.init(N),M.push(p),Bt.multiplyMatrices(N.projectionMatrix,N.matrixWorldInverse),Z.setFromProjectionMatrix(Bt),Tt=this.localClippingEnabled,st=ot.init(this.clippingPlanes,Tt),g=Mt.get(E,S.length),g.init(),S.push(g),q.enabled===!0&&q.isPresenting===!0){let lt=x.xr.getDepthSensingMesh();lt!==null&&Bc(lt,N,-1/0,x.sortObjects)}Bc(E,N,0,x.sortObjects),g.finish(),x.sortObjects===!0&&g.sort(rt,ct),tt=q.enabled===!1||q.isPresenting===!1||q.hasDepthSensing()===!1,tt&&Vt.addToRenderList(g,E),this.info.render.frame++,st===!0&&ot.beginShadows();let G=p.state.shadowsArray;bt.render(G,E,N),st===!0&&ot.endShadows(),this.info.autoReset===!0&&this.info.reset();let W=g.opaque,O=g.transmissive;if(p.setupLights(),N.isArrayCamera){let lt=N.cameras;if(O.length>0)for(let _t=0,At=lt.length;_t<At;_t++){let Rt=lt[_t];uf(W,O,E,Rt)}tt&&Vt.render(E);for(let _t=0,At=lt.length;_t<At;_t++){let Rt=lt[_t];hf(g,E,Rt,Rt.viewport)}}else O.length>0&&uf(W,O,E,N),tt&&Vt.render(E),hf(g,E,N);D!==null&&(T.updateMultisampleRenderTarget(D),T.updateRenderTargetMipmap(D)),E.isScene===!0&&E.onAfterRender(x,E,N),we.resetDefaultState(),b=-1,y=null,M.pop(),M.length>0?(p=M[M.length-1],st===!0&&ot.setGlobalState(x.clippingPlanes,p.state.camera)):p=null,S.pop(),S.length>0?g=S[S.length-1]:g=null};function Bc(E,N,G,W){if(E.visible===!1)return;if(E.layers.test(N.layers)){if(E.isGroup)G=E.renderOrder;else if(E.isLOD)E.autoUpdate===!0&&E.update(N);else if(E.isLight)p.pushLight(E),E.castShadow&&p.pushShadow(E);else if(E.isSprite){if(!E.frustumCulled||Z.intersectsSprite(E)){W&&Gt.setFromMatrixPosition(E.matrixWorld).applyMatrix4(Bt);let _t=$.update(E),At=E.material;At.visible&&g.push(E,_t,At,G,Gt.z,null)}}else if((E.isMesh||E.isLine||E.isPoints)&&(!E.frustumCulled||Z.intersectsObject(E))){let _t=$.update(E),At=E.material;if(W&&(E.boundingSphere!==void 0?(E.boundingSphere===null&&E.computeBoundingSphere(),Gt.copy(E.boundingSphere.center)):(_t.boundingSphere===null&&_t.computeBoundingSphere(),Gt.copy(_t.boundingSphere.center)),Gt.applyMatrix4(E.matrixWorld).applyMatrix4(Bt)),Array.isArray(At)){let Rt=_t.groups;for(let Kt=0,Jt=Rt.length;Kt<Jt;Kt++){let Ct=Rt[Kt],pe=At[Ct.materialIndex];pe&&pe.visible&&g.push(E,_t,pe,G,Gt.z,Ct)}}else At.visible&&g.push(E,_t,At,G,Gt.z,null)}}let lt=E.children;for(let _t=0,At=lt.length;_t<At;_t++)Bc(lt[_t],N,G,W)}function hf(E,N,G,W){let O=E.opaque,lt=E.transmissive,_t=E.transparent;p.setupLightsView(G),st===!0&&ot.setGlobalState(x.clippingPlanes,G),W&&ut.viewport(I.copy(W)),O.length>0&&va(O,N,G),lt.length>0&&va(lt,N,G),_t.length>0&&va(_t,N,G),ut.buffers.depth.setTest(!0),ut.buffers.depth.setMask(!0),ut.buffers.color.setMask(!0),ut.setPolygonOffset(!1)}function uf(E,N,G,W){if((G.isScene===!0?G.overrideMaterial:null)!==null)return;p.state.transmissionRenderTarget[W.id]===void 0&&(p.state.transmissionRenderTarget[W.id]=new xn(1,1,{generateMipmaps:!0,type:it.has("EXT_color_buffer_half_float")||it.has("EXT_color_buffer_float")?Fi:Li,minFilter:Hs,samples:4,stencilBuffer:r,resolveDepthBuffer:!1,resolveStencilBuffer:!1,colorSpace:oe.workingColorSpace}));let lt=p.state.transmissionRenderTarget[W.id],_t=W.viewport||I;lt.setSize(_t.z,_t.w);let At=x.getRenderTarget();x.setRenderTarget(lt),x.getClearColor(F),X=x.getClearAlpha(),X<1&&x.setClearColor(16777215,.5),x.clear(),tt&&Vt.render(G);let Rt=x.toneMapping;x.toneMapping=is;let Kt=W.viewport;if(W.viewport!==void 0&&(W.viewport=void 0),p.setupLightsView(W),st===!0&&ot.setGlobalState(x.clippingPlanes,W),va(E,G,W),T.updateMultisampleRenderTarget(lt),T.updateRenderTargetMipmap(lt),it.has("WEBGL_multisampled_render_to_texture")===!1){let Jt=!1;for(let Ct=0,pe=N.length;Ct<pe;Ct++){let Ae=N[Ct],Ce=Ae.object,En=Ae.geometry,ge=Ae.material,Ut=Ae.group;if(ge.side===Dn&&Ce.layers.test(W.layers)){let bi=ge.side;ge.side=an,ge.needsUpdate=!0,df(Ce,G,W,En,ge,Ut),ge.side=bi,ge.needsUpdate=!0,Jt=!0}}Jt===!0&&(T.updateMultisampleRenderTarget(lt),T.updateRenderTargetMipmap(lt))}x.setRenderTarget(At),x.setClearColor(F,X),Kt!==void 0&&(W.viewport=Kt),x.toneMapping=Rt}function va(E,N,G){let W=N.isScene===!0?N.overrideMaterial:null;for(let O=0,lt=E.length;O<lt;O++){let _t=E[O],At=_t.object,Rt=_t.geometry,Kt=W===null?_t.material:W,Jt=_t.group;At.layers.test(G.layers)&&df(At,N,G,Rt,Kt,Jt)}}function df(E,N,G,W,O,lt){E.onBeforeRender(x,N,G,W,O,lt),E.modelViewMatrix.multiplyMatrices(G.matrixWorldInverse,E.matrixWorld),E.normalMatrix.getNormalMatrix(E.modelViewMatrix),O.onBeforeRender(x,N,G,W,E,lt),O.transparent===!0&&O.side===Dn&&O.forceSinglePass===!1?(O.side=an,O.needsUpdate=!0,x.renderBufferDirect(G,N,W,O,E,lt),O.side=rs,O.needsUpdate=!0,x.renderBufferDirect(G,N,W,O,E,lt),O.side=Dn):x.renderBufferDirect(G,N,W,O,E,lt),E.onAfterRender(x,N,G,W,O,lt)}function ya(E,N,G){N.isScene!==!0&&(N=ue);let W=yt.get(E),O=p.state.lights,lt=p.state.shadowsArray,_t=O.state.version,At=wt.getParameters(E,O.state,lt,N,G),Rt=wt.getProgramCacheKey(At),Kt=W.programs;W.environment=E.isMeshStandardMaterial?N.environment:null,W.fog=N.fog,W.envMap=(E.isMeshStandardMaterial?H:v).get(E.envMap||W.environment),W.envMapRotation=W.environment!==null&&E.envMap===null?N.environmentRotation:E.envMapRotation,Kt===void 0&&(E.addEventListener("dispose",$t),Kt=new Map,W.programs=Kt);let Jt=Kt.get(Rt);if(Jt!==void 0){if(W.currentProgram===Jt&&W.lightsStateVersion===_t)return pf(E,At),Jt}else At.uniforms=wt.getUniforms(E),E.onBeforeCompile(At,x),Jt=wt.acquireProgram(At,Rt),Kt.set(Rt,Jt),W.uniforms=At.uniforms;let Ct=W.uniforms;return(!E.isShaderMaterial&&!E.isRawShaderMaterial||E.clipping===!0)&&(Ct.clippingPlanes=ot.uniform),pf(E,At),W.needsLights=W0(E),W.lightsStateVersion=_t,W.needsLights&&(Ct.ambientLightColor.value=O.state.ambient,Ct.lightProbe.value=O.state.probe,Ct.directionalLights.value=O.state.directional,Ct.directionalLightShadows.value=O.state.directionalShadow,Ct.spotLights.value=O.state.spot,Ct.spotLightShadows.value=O.state.spotShadow,Ct.rectAreaLights.value=O.state.rectArea,Ct.ltc_1.value=O.state.rectAreaLTC1,Ct.ltc_2.value=O.state.rectAreaLTC2,Ct.pointLights.value=O.state.point,Ct.pointLightShadows.value=O.state.pointShadow,Ct.hemisphereLights.value=O.state.hemi,Ct.directionalShadowMap.value=O.state.directionalShadowMap,Ct.directionalShadowMatrix.value=O.state.directionalShadowMatrix,Ct.spotShadowMap.value=O.state.spotShadowMap,Ct.spotLightMatrix.value=O.state.spotLightMatrix,Ct.spotLightMap.value=O.state.spotLightMap,Ct.pointShadowMap.value=O.state.pointShadowMap,Ct.pointShadowMatrix.value=O.state.pointShadowMatrix),W.currentProgram=Jt,W.uniformsList=null,Jt}function ff(E){if(E.uniformsList===null){let N=E.currentProgram.getUniforms();E.uniformsList=Nr.seqWithValue(N.seq,E.uniforms)}return E.uniformsList}function pf(E,N){let G=yt.get(E);G.outputColorSpace=N.outputColorSpace,G.batching=N.batching,G.batchingColor=N.batchingColor,G.instancing=N.instancing,G.instancingColor=N.instancingColor,G.instancingMorph=N.instancingMorph,G.skinning=N.skinning,G.morphTargets=N.morphTargets,G.morphNormals=N.morphNormals,G.morphColors=N.morphColors,G.morphTargetsCount=N.morphTargetsCount,G.numClippingPlanes=N.numClippingPlanes,G.numIntersection=N.numClipIntersection,G.vertexAlphas=N.vertexAlphas,G.vertexTangents=N.vertexTangents,G.toneMapping=N.toneMapping}function V0(E,N,G,W,O){N.isScene!==!0&&(N=ue),T.resetTextureUnits();let lt=N.fog,_t=W.isMeshStandardMaterial?N.environment:null,At=D===null?x.outputColorSpace:D.isXRRenderTarget===!0?D.texture.colorSpace:Yr,Rt=(W.isMeshStandardMaterial?H:v).get(W.envMap||_t),Kt=W.vertexColors===!0&&!!G.attributes.color&&G.attributes.color.itemSize===4,Jt=!!G.attributes.tangent&&(!!W.normalMap||W.anisotropy>0),Ct=!!G.morphAttributes.position,pe=!!G.morphAttributes.normal,Ae=!!G.morphAttributes.color,Ce=is;W.toneMapped&&(D===null||D.isXRRenderTarget===!0)&&(Ce=x.toneMapping);let En=G.morphAttributes.position||G.morphAttributes.normal||G.morphAttributes.color,ge=En!==void 0?En.length:0,Ut=yt.get(W),bi=p.state.lights;if(st===!0&&(Tt===!0||E!==y)){let Hn=E===y&&W.id===b;ot.setState(W,E,Hn)}let _e=!1;W.version===Ut.__version?(Ut.needsLights&&Ut.lightsStateVersion!==bi.state.version||Ut.outputColorSpace!==At||O.isBatchedMesh&&Ut.batching===!1||!O.isBatchedMesh&&Ut.batching===!0||O.isBatchedMesh&&Ut.batchingColor===!0&&O.colorTexture===null||O.isBatchedMesh&&Ut.batchingColor===!1&&O.colorTexture!==null||O.isInstancedMesh&&Ut.instancing===!1||!O.isInstancedMesh&&Ut.instancing===!0||O.isSkinnedMesh&&Ut.skinning===!1||!O.isSkinnedMesh&&Ut.skinning===!0||O.isInstancedMesh&&Ut.instancingColor===!0&&O.instanceColor===null||O.isInstancedMesh&&Ut.instancingColor===!1&&O.instanceColor!==null||O.isInstancedMesh&&Ut.instancingMorph===!0&&O.morphTexture===null||O.isInstancedMesh&&Ut.instancingMorph===!1&&O.morphTexture!==null||Ut.envMap!==Rt||W.fog===!0&&Ut.fog!==lt||Ut.numClippingPlanes!==void 0&&(Ut.numClippingPlanes!==ot.numPlanes||Ut.numIntersection!==ot.numIntersection)||Ut.vertexAlphas!==Kt||Ut.vertexTangents!==Jt||Ut.morphTargets!==Ct||Ut.morphNormals!==pe||Ut.morphColors!==Ae||Ut.toneMapping!==Ce||Ut.morphTargetsCount!==ge)&&(_e=!0):(_e=!0,Ut.__version=W.version);let Kn=Ut.currentProgram;_e===!0&&(Kn=ya(W,N,O));let fr=!1,Rn=!1,co=!1,Pe=Kn.getUniforms(),hi=Ut.uniforms;if(ut.useProgram(Kn.program)&&(fr=!0,Rn=!0,co=!0),W.id!==b&&(b=W.id,Rn=!0),fr||y!==E){ut.buffers.depth.getReversed()?(ht.copy(E.projectionMatrix),Vg(ht),Gg(ht),Pe.setValue(A,"projectionMatrix",ht)):Pe.setValue(A,"projectionMatrix",E.projectionMatrix),Pe.setValue(A,"viewMatrix",E.matrixWorldInverse);let qi=Pe.map.cameraPosition;qi!==void 0&&qi.setValue(A,Zt.setFromMatrixPosition(E.matrixWorld)),Et.logarithmicDepthBuffer&&Pe.setValue(A,"logDepthBufFC",2/(Math.log(E.far+1)/Math.LN2)),(W.isMeshPhongMaterial||W.isMeshToonMaterial||W.isMeshLambertMaterial||W.isMeshBasicMaterial||W.isMeshStandardMaterial||W.isShaderMaterial)&&Pe.setValue(A,"isOrthographic",E.isOrthographicCamera===!0),y!==E&&(y=E,Rn=!0,co=!0)}if(O.isSkinnedMesh){Pe.setOptional(A,O,"bindMatrix"),Pe.setOptional(A,O,"bindMatrixInverse");let Hn=O.skeleton;Hn&&(Hn.boneTexture===null&&Hn.computeBoneTexture(),Pe.setValue(A,"boneTexture",Hn.boneTexture,T))}O.isBatchedMesh&&(Pe.setOptional(A,O,"batchingTexture"),Pe.setValue(A,"batchingTexture",O._matricesTexture,T),Pe.setOptional(A,O,"batchingIdTexture"),Pe.setValue(A,"batchingIdTexture",O._indirectTexture,T),Pe.setOptional(A,O,"batchingColorTexture"),O._colorsTexture!==null&&Pe.setValue(A,"batchingColorTexture",O._colorsTexture,T));let ho=G.morphAttributes;if((ho.position!==void 0||ho.normal!==void 0||ho.color!==void 0)&&qt.update(O,G,Kn),(Rn||Ut.receiveShadow!==O.receiveShadow)&&(Ut.receiveShadow=O.receiveShadow,Pe.setValue(A,"receiveShadow",O.receiveShadow)),W.isMeshGouraudMaterial&&W.envMap!==null&&(hi.envMap.value=Rt,hi.flipEnvMap.value=Rt.isCubeTexture&&Rt.isRenderTargetTexture===!1?-1:1),W.isMeshStandardMaterial&&W.envMap===null&&N.environment!==null&&(hi.envMapIntensity.value=N.environmentIntensity),Rn&&(Pe.setValue(A,"toneMappingExposure",x.toneMappingExposure),Ut.needsLights&&G0(hi,co),lt&&W.fog===!0&&ft.refreshFogUniforms(hi,lt),ft.refreshMaterialUniforms(hi,W,k,J,p.state.transmissionRenderTarget[E.id]),Nr.upload(A,ff(Ut),hi,T)),W.isShaderMaterial&&W.uniformsNeedUpdate===!0&&(Nr.upload(A,ff(Ut),hi,T),W.uniformsNeedUpdate=!1),W.isSpriteMaterial&&Pe.setValue(A,"center",O.center),Pe.setValue(A,"modelViewMatrix",O.modelViewMatrix),Pe.setValue(A,"normalMatrix",O.normalMatrix),Pe.setValue(A,"modelMatrix",O.matrixWorld),W.isShaderMaterial||W.isRawShaderMaterial){let Hn=W.uniformsGroups;for(let qi=0,Zi=Hn.length;qi<Zi;qi++){let mf=Hn[qi];U.update(mf,Kn),U.bind(mf,Kn)}}return Kn}function G0(E,N){E.ambientLightColor.needsUpdate=N,E.lightProbe.needsUpdate=N,E.directionalLights.needsUpdate=N,E.directionalLightShadows.needsUpdate=N,E.pointLights.needsUpdate=N,E.pointLightShadows.needsUpdate=N,E.spotLights.needsUpdate=N,E.spotLightShadows.needsUpdate=N,E.rectAreaLights.needsUpdate=N,E.hemisphereLights.needsUpdate=N}function W0(E){return E.isMeshLambertMaterial||E.isMeshToonMaterial||E.isMeshPhongMaterial||E.isMeshStandardMaterial||E.isShadowMaterial||E.isShaderMaterial&&E.lights===!0}this.getActiveCubeFace=function(){return R},this.getActiveMipmapLevel=function(){return C},this.getRenderTarget=function(){return D},this.setRenderTargetTextures=function(E,N,G){yt.get(E.texture).__webglTexture=N,yt.get(E.depthTexture).__webglTexture=G;let W=yt.get(E);W.__hasExternalTextures=!0,W.__autoAllocateDepthBuffer=G===void 0,W.__autoAllocateDepthBuffer||it.has("WEBGL_multisampled_render_to_texture")===!0&&(console.warn("THREE.WebGLRenderer: Render-to-texture extension was disabled because an external texture was provided"),W.__useRenderToTexture=!1)},this.setRenderTargetFramebuffer=function(E,N){let G=yt.get(E);G.__webglFramebuffer=N,G.__useDefaultFramebuffer=N===void 0},this.setRenderTarget=function(E,N=0,G=0){D=E,R=N,C=G;let W=!0,O=null,lt=!1,_t=!1;if(E){let Rt=yt.get(E);if(Rt.__useDefaultFramebuffer!==void 0)ut.bindFramebuffer(A.FRAMEBUFFER,null),W=!1;else if(Rt.__webglFramebuffer===void 0)T.setupRenderTarget(E);else if(Rt.__hasExternalTextures)T.rebindTextures(E,yt.get(E.texture).__webglTexture,yt.get(E.depthTexture).__webglTexture);else if(E.depthBuffer){let Ct=E.depthTexture;if(Rt.__boundDepthTexture!==Ct){if(Ct!==null&&yt.has(Ct)&&(E.width!==Ct.image.width||E.height!==Ct.image.height))throw new Error("WebGLRenderTarget: Attached DepthTexture is initialized to the incorrect size.");T.setupDepthRenderbuffer(E)}}let Kt=E.texture;(Kt.isData3DTexture||Kt.isDataArrayTexture||Kt.isCompressedArrayTexture)&&(_t=!0);let Jt=yt.get(E).__webglFramebuffer;E.isWebGLCubeRenderTarget?(Array.isArray(Jt[N])?O=Jt[N][G]:O=Jt[N],lt=!0):E.samples>0&&T.useMultisampledRTT(E)===!1?O=yt.get(E).__webglMultisampledFramebuffer:Array.isArray(Jt)?O=Jt[G]:O=Jt,I.copy(E.viewport),Y.copy(E.scissor),V=E.scissorTest}else I.copy(mt).multiplyScalar(k).floor(),Y.copy(kt).multiplyScalar(k).floor(),V=Xt;if(ut.bindFramebuffer(A.FRAMEBUFFER,O)&&W&&ut.drawBuffers(E,O),ut.viewport(I),ut.scissor(Y),ut.setScissorTest(V),lt){let Rt=yt.get(E.texture);A.framebufferTexture2D(A.FRAMEBUFFER,A.COLOR_ATTACHMENT0,A.TEXTURE_CUBE_MAP_POSITIVE_X+N,Rt.__webglTexture,G)}else if(_t){let Rt=yt.get(E.texture),Kt=N||0;A.framebufferTextureLayer(A.FRAMEBUFFER,A.COLOR_ATTACHMENT0,Rt.__webglTexture,G||0,Kt)}b=-1},this.readRenderTargetPixels=function(E,N,G,W,O,lt,_t){if(!(E&&E.isWebGLRenderTarget)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let At=yt.get(E).__webglFramebuffer;if(E.isWebGLCubeRenderTarget&&_t!==void 0&&(At=At[_t]),At){ut.bindFramebuffer(A.FRAMEBUFFER,At);try{let Rt=E.texture,Kt=Rt.format,Jt=Rt.type;if(!Et.textureFormatReadable(Kt)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}if(!Et.textureTypeReadable(Jt)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}N>=0&&N<=E.width-W&&G>=0&&G<=E.height-O&&A.readPixels(N,G,W,O,Qt.convert(Kt),Qt.convert(Jt),lt)}finally{let Rt=D!==null?yt.get(D).__webglFramebuffer:null;ut.bindFramebuffer(A.FRAMEBUFFER,Rt)}}},this.readRenderTargetPixelsAsync=async function(E,N,G,W,O,lt,_t){if(!(E&&E.isWebGLRenderTarget))throw new Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let At=yt.get(E).__webglFramebuffer;if(E.isWebGLCubeRenderTarget&&_t!==void 0&&(At=At[_t]),At){let Rt=E.texture,Kt=Rt.format,Jt=Rt.type;if(!Et.textureFormatReadable(Kt))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(!Et.textureTypeReadable(Jt))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");if(N>=0&&N<=E.width-W&&G>=0&&G<=E.height-O){ut.bindFramebuffer(A.FRAMEBUFFER,At);let Ct=A.createBuffer();A.bindBuffer(A.PIXEL_PACK_BUFFER,Ct),A.bufferData(A.PIXEL_PACK_BUFFER,lt.byteLength,A.STREAM_READ),A.readPixels(N,G,W,O,Qt.convert(Kt),Qt.convert(Jt),0);let pe=D!==null?yt.get(D).__webglFramebuffer:null;ut.bindFramebuffer(A.FRAMEBUFFER,pe);let Ae=A.fenceSync(A.SYNC_GPU_COMMANDS_COMPLETE,0);return A.flush(),await Hg(A,Ae,4),A.bindBuffer(A.PIXEL_PACK_BUFFER,Ct),A.getBufferSubData(A.PIXEL_PACK_BUFFER,0,lt),A.deleteBuffer(Ct),A.deleteSync(Ae),lt}else throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.")}},this.copyFramebufferToTexture=function(E,N=null,G=0){E.isTexture!==!0&&(yo("WebGLRenderer: copyFramebufferToTexture function signature has changed."),N=arguments[0]||null,E=arguments[1]);let W=Math.pow(2,-G),O=Math.floor(E.image.width*W),lt=Math.floor(E.image.height*W),_t=N!==null?N.x:0,At=N!==null?N.y:0;T.setTexture2D(E,0),A.copyTexSubImage2D(A.TEXTURE_2D,G,0,0,_t,At,O,lt),ut.unbindTexture()},this.copyTextureToTexture=function(E,N,G=null,W=null,O=0){E.isTexture!==!0&&(yo("WebGLRenderer: copyTextureToTexture function signature has changed."),W=arguments[0]||null,E=arguments[1],N=arguments[2],O=arguments[3]||0,G=null);let lt,_t,At,Rt,Kt,Jt,Ct,pe,Ae,Ce=E.isCompressedTexture?E.mipmaps[O]:E.image;G!==null?(lt=G.max.x-G.min.x,_t=G.max.y-G.min.y,At=G.isBox3?G.max.z-G.min.z:1,Rt=G.min.x,Kt=G.min.y,Jt=G.isBox3?G.min.z:0):(lt=Ce.width,_t=Ce.height,At=Ce.depth||1,Rt=0,Kt=0,Jt=0),W!==null?(Ct=W.x,pe=W.y,Ae=W.z):(Ct=0,pe=0,Ae=0);let En=Qt.convert(N.format),ge=Qt.convert(N.type),Ut;N.isData3DTexture?(T.setTexture3D(N,0),Ut=A.TEXTURE_3D):N.isDataArrayTexture||N.isCompressedArrayTexture?(T.setTexture2DArray(N,0),Ut=A.TEXTURE_2D_ARRAY):(T.setTexture2D(N,0),Ut=A.TEXTURE_2D),A.pixelStorei(A.UNPACK_FLIP_Y_WEBGL,N.flipY),A.pixelStorei(A.UNPACK_PREMULTIPLY_ALPHA_WEBGL,N.premultiplyAlpha),A.pixelStorei(A.UNPACK_ALIGNMENT,N.unpackAlignment);let bi=A.getParameter(A.UNPACK_ROW_LENGTH),_e=A.getParameter(A.UNPACK_IMAGE_HEIGHT),Kn=A.getParameter(A.UNPACK_SKIP_PIXELS),fr=A.getParameter(A.UNPACK_SKIP_ROWS),Rn=A.getParameter(A.UNPACK_SKIP_IMAGES);A.pixelStorei(A.UNPACK_ROW_LENGTH,Ce.width),A.pixelStorei(A.UNPACK_IMAGE_HEIGHT,Ce.height),A.pixelStorei(A.UNPACK_SKIP_PIXELS,Rt),A.pixelStorei(A.UNPACK_SKIP_ROWS,Kt),A.pixelStorei(A.UNPACK_SKIP_IMAGES,Jt);let co=E.isDataArrayTexture||E.isData3DTexture,Pe=N.isDataArrayTexture||N.isData3DTexture;if(E.isRenderTargetTexture||E.isDepthTexture){let hi=yt.get(E),ho=yt.get(N),Hn=yt.get(hi.__renderTarget),qi=yt.get(ho.__renderTarget);ut.bindFramebuffer(A.READ_FRAMEBUFFER,Hn.__webglFramebuffer),ut.bindFramebuffer(A.DRAW_FRAMEBUFFER,qi.__webglFramebuffer);for(let Zi=0;Zi<At;Zi++)co&&A.framebufferTextureLayer(A.READ_FRAMEBUFFER,A.COLOR_ATTACHMENT0,yt.get(E).__webglTexture,O,Jt+Zi),E.isDepthTexture?(Pe&&A.framebufferTextureLayer(A.DRAW_FRAMEBUFFER,A.COLOR_ATTACHMENT0,yt.get(N).__webglTexture,O,Ae+Zi),A.blitFramebuffer(Rt,Kt,lt,_t,Ct,pe,lt,_t,A.DEPTH_BUFFER_BIT,A.NEAREST)):Pe?A.copyTexSubImage3D(Ut,O,Ct,pe,Ae+Zi,Rt,Kt,lt,_t):A.copyTexSubImage2D(Ut,O,Ct,pe,Ae+Zi,Rt,Kt,lt,_t);ut.bindFramebuffer(A.READ_FRAMEBUFFER,null),ut.bindFramebuffer(A.DRAW_FRAMEBUFFER,null)}else Pe?E.isDataTexture||E.isData3DTexture?A.texSubImage3D(Ut,O,Ct,pe,Ae,lt,_t,At,En,ge,Ce.data):N.isCompressedArrayTexture?A.compressedTexSubImage3D(Ut,O,Ct,pe,Ae,lt,_t,At,En,Ce.data):A.texSubImage3D(Ut,O,Ct,pe,Ae,lt,_t,At,En,ge,Ce):E.isDataTexture?A.texSubImage2D(A.TEXTURE_2D,O,Ct,pe,lt,_t,En,ge,Ce.data):E.isCompressedTexture?A.compressedTexSubImage2D(A.TEXTURE_2D,O,Ct,pe,Ce.width,Ce.height,En,Ce.data):A.texSubImage2D(A.TEXTURE_2D,O,Ct,pe,lt,_t,En,ge,Ce);A.pixelStorei(A.UNPACK_ROW_LENGTH,bi),A.pixelStorei(A.UNPACK_IMAGE_HEIGHT,_e),A.pixelStorei(A.UNPACK_SKIP_PIXELS,Kn),A.pixelStorei(A.UNPACK_SKIP_ROWS,fr),A.pixelStorei(A.UNPACK_SKIP_IMAGES,Rn),O===0&&N.generateMipmaps&&A.generateMipmap(Ut),ut.unbindTexture()},this.copyTextureToTexture3D=function(E,N,G=null,W=null,O=0){return E.isTexture!==!0&&(yo("WebGLRenderer: copyTextureToTexture3D function signature has changed."),G=arguments[0]||null,W=arguments[1]||null,E=arguments[2],N=arguments[3],O=arguments[4]||0),yo('WebGLRenderer: copyTextureToTexture3D function has been deprecated. Use "copyTextureToTexture" instead.'),this.copyTextureToTexture(E,N,G,W,O)},this.initRenderTarget=function(E){yt.get(E).__webglFramebuffer===void 0&&T.setupRenderTarget(E)},this.initTexture=function(E){E.isCubeTexture?T.setTextureCube(E,0):E.isData3DTexture?T.setTexture3D(E,0):E.isDataArrayTexture||E.isCompressedArrayTexture?T.setTexture2DArray(E,0):T.setTexture2D(E,0),ut.unbindTexture()},this.resetState=function(){R=0,C=0,D=null,ut.reset(),we.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return Ii}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(t){this._outputColorSpace=t;let e=this.getContext();e.drawingBufferColorspace=oe._getDrawingBufferColorSpace(t),e.unpackColorSpace=oe._getUnpackColorSpace()}};var ul=class n{constructor(t,e=1,i=1e3){this.isFog=!0,this.name="",this.color=new Yt(t),this.near=e,this.far=i}clone(){return new n(this.color,this.near,this.far)}toJSON(){return{type:"Fog",name:this.name,color:this.color.getHex(),near:this.near,far:this.far}}},Ws=class extends $e{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new pi,this.environmentIntensity=1,this.environmentRotation=new pi,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(t,e){return super.copy(t,e),t.background!==null&&(this.background=t.background.clone()),t.environment!==null&&(this.environment=t.environment.clone()),t.fog!==null&&(this.fog=t.fog.clone()),this.backgroundBlurriness=t.backgroundBlurriness,this.backgroundIntensity=t.backgroundIntensity,this.backgroundRotation.copy(t.backgroundRotation),this.environmentIntensity=t.environmentIntensity,this.environmentRotation.copy(t.environmentRotation),t.overrideMaterial!==null&&(this.overrideMaterial=t.overrideMaterial.clone()),this.matrixAutoUpdate=t.matrixAutoUpdate,this}toJSON(t){let e=super.toJSON(t);return this.fog!==null&&(e.object.fog=this.fog.toJSON()),this.backgroundBlurriness>0&&(e.object.backgroundBlurriness=this.backgroundBlurriness),this.backgroundIntensity!==1&&(e.object.backgroundIntensity=this.backgroundIntensity),e.object.backgroundRotation=this.backgroundRotation.toArray(),this.environmentIntensity!==1&&(e.object.environmentIntensity=this.environmentIntensity),e.object.environmentRotation=this.environmentRotation.toArray(),e}};var yu=class extends _n{constructor(t=null,e=1,i=1,s,r,o,a,l,c=ln,h=ln,u,d){super(null,o,a,l,c,h,s,r,u,d),this.isDataTexture=!0,this.image={data:t,width:e,height:i},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}};var Uo=class extends en{constructor(t,e,i,s=1){super(t,e,i),this.isInstancedBufferAttribute=!0,this.meshPerAttribute=s}copy(t){return super.copy(t),this.meshPerAttribute=t.meshPerAttribute,this}toJSON(){let t=super.toJSON();return t.meshPerAttribute=this.meshPerAttribute,t.isInstancedBufferAttribute=!0,t}},Rr=new be,yp=new be,Ga=[],Mp=new Wn,OM=new be,go=new Ft,_o=new os,No=class extends Ft{constructor(t,e,i){super(t,e),this.isInstancedMesh=!0,this.instanceMatrix=new Uo(new Float32Array(i*16),16),this.instanceColor=null,this.morphTexture=null,this.count=i,this.boundingBox=null,this.boundingSphere=null;for(let s=0;s<i;s++)this.setMatrixAt(s,OM)}computeBoundingBox(){let t=this.geometry,e=this.count;this.boundingBox===null&&(this.boundingBox=new Wn),t.boundingBox===null&&t.computeBoundingBox(),this.boundingBox.makeEmpty();for(let i=0;i<e;i++)this.getMatrixAt(i,Rr),Mp.copy(t.boundingBox).applyMatrix4(Rr),this.boundingBox.union(Mp)}computeBoundingSphere(){let t=this.geometry,e=this.count;this.boundingSphere===null&&(this.boundingSphere=new os),t.boundingSphere===null&&t.computeBoundingSphere(),this.boundingSphere.makeEmpty();for(let i=0;i<e;i++)this.getMatrixAt(i,Rr),_o.copy(t.boundingSphere).applyMatrix4(Rr),this.boundingSphere.union(_o)}copy(t,e){return super.copy(t,e),this.instanceMatrix.copy(t.instanceMatrix),t.morphTexture!==null&&(this.morphTexture=t.morphTexture.clone()),t.instanceColor!==null&&(this.instanceColor=t.instanceColor.clone()),this.count=t.count,t.boundingBox!==null&&(this.boundingBox=t.boundingBox.clone()),t.boundingSphere!==null&&(this.boundingSphere=t.boundingSphere.clone()),this}getColorAt(t,e){e.fromArray(this.instanceColor.array,t*3)}getMatrixAt(t,e){e.fromArray(this.instanceMatrix.array,t*16)}getMorphAt(t,e){let i=e.morphTargetInfluences,s=this.morphTexture.source.data.data,r=i.length+1,o=t*r+1;for(let a=0;a<i.length;a++)i[a]=s[o+a]}raycast(t,e){let i=this.matrixWorld,s=this.count;if(go.geometry=this.geometry,go.material=this.material,go.material!==void 0&&(this.boundingSphere===null&&this.computeBoundingSphere(),_o.copy(this.boundingSphere),_o.applyMatrix4(i),t.ray.intersectsSphere(_o)!==!1))for(let r=0;r<s;r++){this.getMatrixAt(r,Rr),yp.multiplyMatrices(i,Rr),go.matrixWorld=yp,go.raycast(t,Ga);for(let o=0,a=Ga.length;o<a;o++){let l=Ga[o];l.instanceId=r,l.object=this,e.push(l)}Ga.length=0}}setColorAt(t,e){this.instanceColor===null&&(this.instanceColor=new Uo(new Float32Array(this.instanceMatrix.count*3).fill(1),3)),e.toArray(this.instanceColor.array,t*3)}setMatrixAt(t,e){e.toArray(this.instanceMatrix.array,t*16)}setMorphAt(t,e){let i=e.morphTargetInfluences,s=i.length+1;this.morphTexture===null&&(this.morphTexture=new yu(new Float32Array(s*this.count),s,this.count,qu,fi));let r=this.morphTexture.source.data.data,o=0;for(let c=0;c<i.length;c++)o+=i[c];let a=this.geometry.morphTargetsRelative?1:1-o,l=s*t;r[l]=a,r.set(i,l+1)}updateMorphTargets(){}dispose(){return this.dispatchEvent({type:"dispose"}),this.morphTexture!==null&&(this.morphTexture.dispose(),this.morphTexture=null),this}};var Oo=class extends as{static get type(){return"LineBasicMaterial"}constructor(t){super(),this.isLineBasicMaterial=!0,this.color=new Yt(16777215),this.map=null,this.linewidth=1,this.linecap="round",this.linejoin="round",this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.linewidth=t.linewidth,this.linecap=t.linecap,this.linejoin=t.linejoin,this.fog=t.fog,this}},dl=new w,fl=new w,Ep=new be,xo=new Gs,Wa=new os,ph=new w,bp=new w,pl=class extends $e{constructor(t=new Fe,e=new Oo){super(),this.isLine=!0,this.type="Line",this.geometry=t,this.material=e,this.updateMorphTargets()}copy(t,e){return super.copy(t,e),this.material=Array.isArray(t.material)?t.material.slice():t.material,this.geometry=t.geometry,this}computeLineDistances(){let t=this.geometry;if(t.index===null){let e=t.attributes.position,i=[0];for(let s=1,r=e.count;s<r;s++)dl.fromBufferAttribute(e,s-1),fl.fromBufferAttribute(e,s),i[s]=i[s-1],i[s]+=dl.distanceTo(fl);t.setAttribute("lineDistance",new le(i,1))}else console.warn("THREE.Line.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}raycast(t,e){let i=this.geometry,s=this.matrixWorld,r=t.params.Line.threshold,o=i.drawRange;if(i.boundingSphere===null&&i.computeBoundingSphere(),Wa.copy(i.boundingSphere),Wa.applyMatrix4(s),Wa.radius+=r,t.ray.intersectsSphere(Wa)===!1)return;Ep.copy(s).invert(),xo.copy(t.ray).applyMatrix4(Ep);let a=r/((this.scale.x+this.scale.y+this.scale.z)/3),l=a*a,c=this.isLineSegments?2:1,h=i.index,d=i.attributes.position;if(h!==null){let f=Math.max(0,o.start),m=Math.min(h.count,o.start+o.count);for(let _=f,g=m-1;_<g;_+=c){let p=h.getX(_),S=h.getX(_+1),M=Xa(this,t,xo,l,p,S);M&&e.push(M)}if(this.isLineLoop){let _=h.getX(m-1),g=h.getX(f),p=Xa(this,t,xo,l,_,g);p&&e.push(p)}}else{let f=Math.max(0,o.start),m=Math.min(d.count,o.start+o.count);for(let _=f,g=m-1;_<g;_+=c){let p=Xa(this,t,xo,l,_,_+1);p&&e.push(p)}if(this.isLineLoop){let _=Xa(this,t,xo,l,m-1,f);_&&e.push(_)}}}updateMorphTargets(){let e=this.geometry.morphAttributes,i=Object.keys(e);if(i.length>0){let s=e[i[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,o=s.length;r<o;r++){let a=s[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=r}}}}};function Xa(n,t,e,i,s,r){let o=n.geometry.attributes.position;if(dl.fromBufferAttribute(o,s),fl.fromBufferAttribute(o,r),e.distanceSqToSegment(dl,fl,ph,bp)>i)return;ph.applyMatrix4(n.matrixWorld);let l=t.ray.origin.distanceTo(ph);if(!(l<t.near||l>t.far))return{distance:l,point:bp.clone().applyMatrix4(n.matrixWorld),index:s,face:null,faceIndex:null,barycoord:null,object:n}}var ls=class extends _n{constructor(t,e,i,s,r,o,a,l,c){super(t,e,i,s,r,o,a,l,c),this.isCanvasTexture=!0,this.needsUpdate=!0}},Xn=class{constructor(){this.type="Curve",this.arcLengthDivisions=200}getPoint(){return console.warn("THREE.Curve: .getPoint() not implemented."),null}getPointAt(t,e){let i=this.getUtoTmapping(t);return this.getPoint(i,e)}getPoints(t=5){let e=[];for(let i=0;i<=t;i++)e.push(this.getPoint(i/t));return e}getSpacedPoints(t=5){let e=[];for(let i=0;i<=t;i++)e.push(this.getPointAt(i/t));return e}getLength(){let t=this.getLengths();return t[t.length-1]}getLengths(t=this.arcLengthDivisions){if(this.cacheArcLengths&&this.cacheArcLengths.length===t+1&&!this.needsUpdate)return this.cacheArcLengths;this.needsUpdate=!1;let e=[],i,s=this.getPoint(0),r=0;e.push(0);for(let o=1;o<=t;o++)i=this.getPoint(o/t),r+=i.distanceTo(s),e.push(r),s=i;return this.cacheArcLengths=e,e}updateArcLengths(){this.needsUpdate=!0,this.getLengths()}getUtoTmapping(t,e){let i=this.getLengths(),s=0,r=i.length,o;e?o=e:o=t*i[r-1];let a=0,l=r-1,c;for(;a<=l;)if(s=Math.floor(a+(l-a)/2),c=i[s]-o,c<0)a=s+1;else if(c>0)l=s-1;else{l=s;break}if(s=l,i[s]===o)return s/(r-1);let h=i[s],d=i[s+1]-h,f=(o-h)/d;return(s+f)/(r-1)}getTangent(t,e){let s=t-1e-4,r=t+1e-4;s<0&&(s=0),r>1&&(r=1);let o=this.getPoint(s),a=this.getPoint(r),l=e||(o.isVector2?new nt:new w);return l.copy(a).sub(o).normalize(),l}getTangentAt(t,e){let i=this.getUtoTmapping(t);return this.getTangent(i,e)}computeFrenetFrames(t,e){let i=new w,s=[],r=[],o=[],a=new w,l=new be;for(let f=0;f<=t;f++){let m=f/t;s[f]=this.getTangentAt(m,new w)}r[0]=new w,o[0]=new w;let c=Number.MAX_VALUE,h=Math.abs(s[0].x),u=Math.abs(s[0].y),d=Math.abs(s[0].z);h<=c&&(c=h,i.set(1,0,0)),u<=c&&(c=u,i.set(0,1,0)),d<=c&&i.set(0,0,1),a.crossVectors(s[0],i).normalize(),r[0].crossVectors(s[0],a),o[0].crossVectors(s[0],r[0]);for(let f=1;f<=t;f++){if(r[f]=r[f-1].clone(),o[f]=o[f-1].clone(),a.crossVectors(s[f-1],s[f]),a.length()>Number.EPSILON){a.normalize();let m=Math.acos(Ke(s[f-1].dot(s[f]),-1,1));r[f].applyMatrix4(l.makeRotationAxis(a,m))}o[f].crossVectors(s[f],r[f])}if(e===!0){let f=Math.acos(Ke(r[0].dot(r[t]),-1,1));f/=t,s[0].dot(a.crossVectors(r[0],r[t]))>0&&(f=-f);for(let m=1;m<=t;m++)r[m].applyMatrix4(l.makeRotationAxis(s[m],f*m)),o[m].crossVectors(s[m],r[m])}return{tangents:s,normals:r,binormals:o}}clone(){return new this.constructor().copy(this)}copy(t){return this.arcLengthDivisions=t.arcLengthDivisions,this}toJSON(){let t={metadata:{version:4.6,type:"Curve",generator:"Curve.toJSON"}};return t.arcLengthDivisions=this.arcLengthDivisions,t.type=this.type,t}fromJSON(t){return this.arcLengthDivisions=t.arcLengthDivisions,this}},Fo=class extends Xn{constructor(t=0,e=0,i=1,s=1,r=0,o=Math.PI*2,a=!1,l=0){super(),this.isEllipseCurve=!0,this.type="EllipseCurve",this.aX=t,this.aY=e,this.xRadius=i,this.yRadius=s,this.aStartAngle=r,this.aEndAngle=o,this.aClockwise=a,this.aRotation=l}getPoint(t,e=new nt){let i=e,s=Math.PI*2,r=this.aEndAngle-this.aStartAngle,o=Math.abs(r)<Number.EPSILON;for(;r<0;)r+=s;for(;r>s;)r-=s;r<Number.EPSILON&&(o?r=0:r=s),this.aClockwise===!0&&!o&&(r===s?r=-s:r=r-s);let a=this.aStartAngle+t*r,l=this.aX+this.xRadius*Math.cos(a),c=this.aY+this.yRadius*Math.sin(a);if(this.aRotation!==0){let h=Math.cos(this.aRotation),u=Math.sin(this.aRotation),d=l-this.aX,f=c-this.aY;l=d*h-f*u+this.aX,c=d*u+f*h+this.aY}return i.set(l,c)}copy(t){return super.copy(t),this.aX=t.aX,this.aY=t.aY,this.xRadius=t.xRadius,this.yRadius=t.yRadius,this.aStartAngle=t.aStartAngle,this.aEndAngle=t.aEndAngle,this.aClockwise=t.aClockwise,this.aRotation=t.aRotation,this}toJSON(){let t=super.toJSON();return t.aX=this.aX,t.aY=this.aY,t.xRadius=this.xRadius,t.yRadius=this.yRadius,t.aStartAngle=this.aStartAngle,t.aEndAngle=this.aEndAngle,t.aClockwise=this.aClockwise,t.aRotation=this.aRotation,t}fromJSON(t){return super.fromJSON(t),this.aX=t.aX,this.aY=t.aY,this.xRadius=t.xRadius,this.yRadius=t.yRadius,this.aStartAngle=t.aStartAngle,this.aEndAngle=t.aEndAngle,this.aClockwise=t.aClockwise,this.aRotation=t.aRotation,this}},Mu=class extends Fo{constructor(t,e,i,s,r,o){super(t,e,i,i,s,r,o),this.isArcCurve=!0,this.type="ArcCurve"}};function td(){let n=0,t=0,e=0,i=0;function s(r,o,a,l){n=r,t=a,e=-3*r+3*o-2*a-l,i=2*r-2*o+a+l}return{initCatmullRom:function(r,o,a,l,c){s(o,a,c*(a-r),c*(l-o))},initNonuniformCatmullRom:function(r,o,a,l,c,h,u){let d=(o-r)/c-(a-r)/(c+h)+(a-o)/h,f=(a-o)/h-(l-o)/(h+u)+(l-a)/u;d*=h,f*=h,s(o,a,d,f)},calc:function(r){let o=r*r,a=o*r;return n+t*r+e*o+i*a}}}var Ya=new w,mh=new td,gh=new td,_h=new td,Bo=class extends Xn{constructor(t=[],e=!1,i="centripetal",s=.5){super(),this.isCatmullRomCurve3=!0,this.type="CatmullRomCurve3",this.points=t,this.closed=e,this.curveType=i,this.tension=s}getPoint(t,e=new w){let i=e,s=this.points,r=s.length,o=(r-(this.closed?0:1))*t,a=Math.floor(o),l=o-a;this.closed?a+=a>0?0:(Math.floor(Math.abs(a)/r)+1)*r:l===0&&a===r-1&&(a=r-2,l=1);let c,h;this.closed||a>0?c=s[(a-1)%r]:(Ya.subVectors(s[0],s[1]).add(s[0]),c=Ya);let u=s[a%r],d=s[(a+1)%r];if(this.closed||a+2<r?h=s[(a+2)%r]:(Ya.subVectors(s[r-1],s[r-2]).add(s[r-1]),h=Ya),this.curveType==="centripetal"||this.curveType==="chordal"){let f=this.curveType==="chordal"?.5:.25,m=Math.pow(c.distanceToSquared(u),f),_=Math.pow(u.distanceToSquared(d),f),g=Math.pow(d.distanceToSquared(h),f);_<1e-4&&(_=1),m<1e-4&&(m=_),g<1e-4&&(g=_),mh.initNonuniformCatmullRom(c.x,u.x,d.x,h.x,m,_,g),gh.initNonuniformCatmullRom(c.y,u.y,d.y,h.y,m,_,g),_h.initNonuniformCatmullRom(c.z,u.z,d.z,h.z,m,_,g)}else this.curveType==="catmullrom"&&(mh.initCatmullRom(c.x,u.x,d.x,h.x,this.tension),gh.initCatmullRom(c.y,u.y,d.y,h.y,this.tension),_h.initCatmullRom(c.z,u.z,d.z,h.z,this.tension));return i.set(mh.calc(l),gh.calc(l),_h.calc(l)),i}copy(t){super.copy(t),this.points=[];for(let e=0,i=t.points.length;e<i;e++){let s=t.points[e];this.points.push(s.clone())}return this.closed=t.closed,this.curveType=t.curveType,this.tension=t.tension,this}toJSON(){let t=super.toJSON();t.points=[];for(let e=0,i=this.points.length;e<i;e++){let s=this.points[e];t.points.push(s.toArray())}return t.closed=this.closed,t.curveType=this.curveType,t.tension=this.tension,t}fromJSON(t){super.fromJSON(t),this.points=[];for(let e=0,i=t.points.length;e<i;e++){let s=t.points[e];this.points.push(new w().fromArray(s))}return this.closed=t.closed,this.curveType=t.curveType,this.tension=t.tension,this}};function Sp(n,t,e,i,s){let r=(i-t)*.5,o=(s-e)*.5,a=n*n,l=n*a;return(2*e-2*i+r+o)*l+(-3*e+3*i-2*r-o)*a+r*n+e}function FM(n,t){let e=1-n;return e*e*t}function BM(n,t){return 2*(1-n)*n*t}function zM(n,t){return n*n*t}function To(n,t,e,i){return FM(n,t)+BM(n,e)+zM(n,i)}function kM(n,t){let e=1-n;return e*e*e*t}function HM(n,t){let e=1-n;return 3*e*e*n*t}function VM(n,t){return 3*(1-n)*n*n*t}function GM(n,t){return n*n*n*t}function wo(n,t,e,i,s){return kM(n,t)+HM(n,e)+VM(n,i)+GM(n,s)}var ml=class extends Xn{constructor(t=new nt,e=new nt,i=new nt,s=new nt){super(),this.isCubicBezierCurve=!0,this.type="CubicBezierCurve",this.v0=t,this.v1=e,this.v2=i,this.v3=s}getPoint(t,e=new nt){let i=e,s=this.v0,r=this.v1,o=this.v2,a=this.v3;return i.set(wo(t,s.x,r.x,o.x,a.x),wo(t,s.y,r.y,o.y,a.y)),i}copy(t){return super.copy(t),this.v0.copy(t.v0),this.v1.copy(t.v1),this.v2.copy(t.v2),this.v3.copy(t.v3),this}toJSON(){let t=super.toJSON();return t.v0=this.v0.toArray(),t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t.v3=this.v3.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v0.fromArray(t.v0),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this.v3.fromArray(t.v3),this}},gl=class extends Xn{constructor(t=new w,e=new w,i=new w,s=new w){super(),this.isCubicBezierCurve3=!0,this.type="CubicBezierCurve3",this.v0=t,this.v1=e,this.v2=i,this.v3=s}getPoint(t,e=new w){let i=e,s=this.v0,r=this.v1,o=this.v2,a=this.v3;return i.set(wo(t,s.x,r.x,o.x,a.x),wo(t,s.y,r.y,o.y,a.y),wo(t,s.z,r.z,o.z,a.z)),i}copy(t){return super.copy(t),this.v0.copy(t.v0),this.v1.copy(t.v1),this.v2.copy(t.v2),this.v3.copy(t.v3),this}toJSON(){let t=super.toJSON();return t.v0=this.v0.toArray(),t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t.v3=this.v3.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v0.fromArray(t.v0),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this.v3.fromArray(t.v3),this}},_l=class extends Xn{constructor(t=new nt,e=new nt){super(),this.isLineCurve=!0,this.type="LineCurve",this.v1=t,this.v2=e}getPoint(t,e=new nt){let i=e;return t===1?i.copy(this.v2):(i.copy(this.v2).sub(this.v1),i.multiplyScalar(t).add(this.v1)),i}getPointAt(t,e){return this.getPoint(t,e)}getTangent(t,e=new nt){return e.subVectors(this.v2,this.v1).normalize()}getTangentAt(t,e){return this.getTangent(t,e)}copy(t){return super.copy(t),this.v1.copy(t.v1),this.v2.copy(t.v2),this}toJSON(){let t=super.toJSON();return t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this}},xl=class extends Xn{constructor(t=new w,e=new w){super(),this.isLineCurve3=!0,this.type="LineCurve3",this.v1=t,this.v2=e}getPoint(t,e=new w){let i=e;return t===1?i.copy(this.v2):(i.copy(this.v2).sub(this.v1),i.multiplyScalar(t).add(this.v1)),i}getPointAt(t,e){return this.getPoint(t,e)}getTangent(t,e=new w){return e.subVectors(this.v2,this.v1).normalize()}getTangentAt(t,e){return this.getTangent(t,e)}copy(t){return super.copy(t),this.v1.copy(t.v1),this.v2.copy(t.v2),this}toJSON(){let t=super.toJSON();return t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this}},vl=class extends Xn{constructor(t=new nt,e=new nt,i=new nt){super(),this.isQuadraticBezierCurve=!0,this.type="QuadraticBezierCurve",this.v0=t,this.v1=e,this.v2=i}getPoint(t,e=new nt){let i=e,s=this.v0,r=this.v1,o=this.v2;return i.set(To(t,s.x,r.x,o.x),To(t,s.y,r.y,o.y)),i}copy(t){return super.copy(t),this.v0.copy(t.v0),this.v1.copy(t.v1),this.v2.copy(t.v2),this}toJSON(){let t=super.toJSON();return t.v0=this.v0.toArray(),t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v0.fromArray(t.v0),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this}},yl=class extends Xn{constructor(t=new w,e=new w,i=new w){super(),this.isQuadraticBezierCurve3=!0,this.type="QuadraticBezierCurve3",this.v0=t,this.v1=e,this.v2=i}getPoint(t,e=new w){let i=e,s=this.v0,r=this.v1,o=this.v2;return i.set(To(t,s.x,r.x,o.x),To(t,s.y,r.y,o.y),To(t,s.z,r.z,o.z)),i}copy(t){return super.copy(t),this.v0.copy(t.v0),this.v1.copy(t.v1),this.v2.copy(t.v2),this}toJSON(){let t=super.toJSON();return t.v0=this.v0.toArray(),t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v0.fromArray(t.v0),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this}},Ml=class extends Xn{constructor(t=[]){super(),this.isSplineCurve=!0,this.type="SplineCurve",this.points=t}getPoint(t,e=new nt){let i=e,s=this.points,r=(s.length-1)*t,o=Math.floor(r),a=r-o,l=s[o===0?o:o-1],c=s[o],h=s[o>s.length-2?s.length-1:o+1],u=s[o>s.length-3?s.length-1:o+2];return i.set(Sp(a,l.x,c.x,h.x,u.x),Sp(a,l.y,c.y,h.y,u.y)),i}copy(t){super.copy(t),this.points=[];for(let e=0,i=t.points.length;e<i;e++){let s=t.points[e];this.points.push(s.clone())}return this}toJSON(){let t=super.toJSON();t.points=[];for(let e=0,i=this.points.length;e<i;e++){let s=this.points[e];t.points.push(s.toArray())}return t}fromJSON(t){super.fromJSON(t),this.points=[];for(let e=0,i=t.points.length;e<i;e++){let s=t.points[e];this.points.push(new nt().fromArray(s))}return this}},El=Object.freeze({__proto__:null,ArcCurve:Mu,CatmullRomCurve3:Bo,CubicBezierCurve:ml,CubicBezierCurve3:gl,EllipseCurve:Fo,LineCurve:_l,LineCurve3:xl,QuadraticBezierCurve:vl,QuadraticBezierCurve3:yl,SplineCurve:Ml}),bl=class extends Xn{constructor(){super(),this.type="CurvePath",this.curves=[],this.autoClose=!1}add(t){this.curves.push(t)}closePath(){let t=this.curves[0].getPoint(0),e=this.curves[this.curves.length-1].getPoint(1);if(!t.equals(e)){let i=t.isVector2===!0?"LineCurve":"LineCurve3";this.curves.push(new El[i](e,t))}return this}getPoint(t,e){let i=t*this.getLength(),s=this.getCurveLengths(),r=0;for(;r<s.length;){if(s[r]>=i){let o=s[r]-i,a=this.curves[r],l=a.getLength(),c=l===0?0:1-o/l;return a.getPointAt(c,e)}r++}return null}getLength(){let t=this.getCurveLengths();return t[t.length-1]}updateArcLengths(){this.needsUpdate=!0,this.cacheLengths=null,this.getCurveLengths()}getCurveLengths(){if(this.cacheLengths&&this.cacheLengths.length===this.curves.length)return this.cacheLengths;let t=[],e=0;for(let i=0,s=this.curves.length;i<s;i++)e+=this.curves[i].getLength(),t.push(e);return this.cacheLengths=t,t}getSpacedPoints(t=40){let e=[];for(let i=0;i<=t;i++)e.push(this.getPoint(i/t));return this.autoClose&&e.push(e[0]),e}getPoints(t=12){let e=[],i;for(let s=0,r=this.curves;s<r.length;s++){let o=r[s],a=o.isEllipseCurve?t*2:o.isLineCurve||o.isLineCurve3?1:o.isSplineCurve?t*o.points.length:t,l=o.getPoints(a);for(let c=0;c<l.length;c++){let h=l[c];i&&i.equals(h)||(e.push(h),i=h)}}return this.autoClose&&e.length>1&&!e[e.length-1].equals(e[0])&&e.push(e[0]),e}copy(t){super.copy(t),this.curves=[];for(let e=0,i=t.curves.length;e<i;e++){let s=t.curves[e];this.curves.push(s.clone())}return this.autoClose=t.autoClose,this}toJSON(){let t=super.toJSON();t.autoClose=this.autoClose,t.curves=[];for(let e=0,i=this.curves.length;e<i;e++){let s=this.curves[e];t.curves.push(s.toJSON())}return t}fromJSON(t){super.fromJSON(t),this.autoClose=t.autoClose,this.curves=[];for(let e=0,i=t.curves.length;e<i;e++){let s=t.curves[e];this.curves.push(new El[s.type]().fromJSON(s))}return this}},Ni=class extends bl{constructor(t){super(),this.type="Path",this.currentPoint=new nt,t&&this.setFromPoints(t)}setFromPoints(t){this.moveTo(t[0].x,t[0].y);for(let e=1,i=t.length;e<i;e++)this.lineTo(t[e].x,t[e].y);return this}moveTo(t,e){return this.currentPoint.set(t,e),this}lineTo(t,e){let i=new _l(this.currentPoint.clone(),new nt(t,e));return this.curves.push(i),this.currentPoint.set(t,e),this}quadraticCurveTo(t,e,i,s){let r=new vl(this.currentPoint.clone(),new nt(t,e),new nt(i,s));return this.curves.push(r),this.currentPoint.set(i,s),this}bezierCurveTo(t,e,i,s,r,o){let a=new ml(this.currentPoint.clone(),new nt(t,e),new nt(i,s),new nt(r,o));return this.curves.push(a),this.currentPoint.set(r,o),this}splineThru(t){let e=[this.currentPoint.clone()].concat(t),i=new Ml(e);return this.curves.push(i),this.currentPoint.copy(t[t.length-1]),this}arc(t,e,i,s,r,o){let a=this.currentPoint.x,l=this.currentPoint.y;return this.absarc(t+a,e+l,i,s,r,o),this}absarc(t,e,i,s,r,o){return this.absellipse(t,e,i,i,s,r,o),this}ellipse(t,e,i,s,r,o,a,l){let c=this.currentPoint.x,h=this.currentPoint.y;return this.absellipse(t+c,e+h,i,s,r,o,a,l),this}absellipse(t,e,i,s,r,o,a,l){let c=new Fo(t,e,i,s,r,o,a,l);if(this.curves.length>0){let u=c.getPoint(0);u.equals(this.currentPoint)||this.lineTo(u.x,u.y)}this.curves.push(c);let h=c.getPoint(1);return this.currentPoint.copy(h),this}copy(t){return super.copy(t),this.currentPoint.copy(t.currentPoint),this}toJSON(){let t=super.toJSON();return t.currentPoint=this.currentPoint.toArray(),t}fromJSON(t){return super.fromJSON(t),this.currentPoint.fromArray(t.currentPoint),this}};var Xs=class n extends Fe{constructor(t=1,e=1,i=1,s=32,r=1,o=!1,a=0,l=Math.PI*2){super(),this.type="CylinderGeometry",this.parameters={radiusTop:t,radiusBottom:e,height:i,radialSegments:s,heightSegments:r,openEnded:o,thetaStart:a,thetaLength:l};let c=this;s=Math.floor(s),r=Math.floor(r);let h=[],u=[],d=[],f=[],m=0,_=[],g=i/2,p=0;S(),o===!1&&(t>0&&M(!0),e>0&&M(!1)),this.setIndex(h),this.setAttribute("position",new le(u,3)),this.setAttribute("normal",new le(d,3)),this.setAttribute("uv",new le(f,2));function S(){let x=new w,L=new w,R=0,C=(e-t)/i;for(let D=0;D<=r;D++){let b=[],y=D/r,I=y*(e-t)+t;for(let Y=0;Y<=s;Y++){let V=Y/s,F=V*l+a,X=Math.sin(F),z=Math.cos(F);L.x=I*X,L.y=-y*i+g,L.z=I*z,u.push(L.x,L.y,L.z),x.set(X,C,z).normalize(),d.push(x.x,x.y,x.z),f.push(V,1-y),b.push(m++)}_.push(b)}for(let D=0;D<s;D++)for(let b=0;b<r;b++){let y=_[b][D],I=_[b+1][D],Y=_[b+1][D+1],V=_[b][D+1];(t>0||b!==0)&&(h.push(y,I,V),R+=3),(e>0||b!==r-1)&&(h.push(I,Y,V),R+=3)}c.addGroup(p,R,0),p+=R}function M(x){let L=m,R=new nt,C=new w,D=0,b=x===!0?t:e,y=x===!0?1:-1;for(let Y=1;Y<=s;Y++)u.push(0,g*y,0),d.push(0,y,0),f.push(.5,.5),m++;let I=m;for(let Y=0;Y<=s;Y++){let F=Y/s*l+a,X=Math.cos(F),z=Math.sin(F);C.x=b*z,C.y=g*y,C.z=b*X,u.push(C.x,C.y,C.z),d.push(0,y,0),R.x=X*.5+.5,R.y=z*.5*y+.5,f.push(R.x,R.y),m++}for(let Y=0;Y<s;Y++){let V=L+Y,F=I+Y;x===!0?h.push(F,F+1,V):h.push(F+1,F,V),D+=3}c.addGroup(p,D,x===!0?1:2),p+=D}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new n(t.radiusTop,t.radiusBottom,t.height,t.radialSegments,t.heightSegments,t.openEnded,t.thetaStart,t.thetaLength)}},Sl=class n extends Xs{constructor(t=1,e=1,i=32,s=1,r=!1,o=0,a=Math.PI*2){super(0,t,e,i,s,r,o,a),this.type="ConeGeometry",this.parameters={radius:t,height:e,radialSegments:i,heightSegments:s,openEnded:r,thetaStart:o,thetaLength:a}}static fromJSON(t){return new n(t.radius,t.height,t.radialSegments,t.heightSegments,t.openEnded,t.thetaStart,t.thetaLength)}};var Ys=class extends Ni{constructor(t){super(t),this.uuid=js(),this.type="Shape",this.holes=[]}getPointsHoles(t){let e=[];for(let i=0,s=this.holes.length;i<s;i++)e[i]=this.holes[i].getPoints(t);return e}extractPoints(t){return{shape:this.getPoints(t),holes:this.getPointsHoles(t)}}copy(t){super.copy(t),this.holes=[];for(let e=0,i=t.holes.length;e<i;e++){let s=t.holes[e];this.holes.push(s.clone())}return this}toJSON(){let t=super.toJSON();t.uuid=this.uuid,t.holes=[];for(let e=0,i=this.holes.length;e<i;e++){let s=this.holes[e];t.holes.push(s.toJSON())}return t}fromJSON(t){super.fromJSON(t),this.uuid=t.uuid,this.holes=[];for(let e=0,i=t.holes.length;e<i;e++){let s=t.holes[e];this.holes.push(new Ni().fromJSON(s))}return this}},WM={triangulate:function(n,t,e=2){let i=t&&t.length,s=i?t[0]*e:n.length,r=im(n,0,s,e,!0),o=[];if(!r||r.next===r.prev)return o;let a,l,c,h,u,d,f;if(i&&(r=KM(n,t,r,e)),n.length>80*e){a=c=n[0],l=h=n[1];for(let m=e;m<s;m+=e)u=n[m],d=n[m+1],u<a&&(a=u),d<l&&(l=d),u>c&&(c=u),d>h&&(h=d);f=Math.max(c-a,h-l),f=f!==0?32767/f:0}return zo(r,o,e,a,l,f,0),o}};function im(n,t,e,i,s){let r,o;if(s===o1(n,t,e,i)>0)for(r=t;r<e;r+=i)o=Tp(r,n[r],n[r+1],o);else for(r=e-i;r>=t;r-=i)o=Tp(r,n[r],n[r+1],o);return o&&Vl(o,o.next)&&(Ho(o),o=o.next),o}function qs(n,t){if(!n)return n;t||(t=n);let e=n,i;do if(i=!1,!e.steiner&&(Vl(e,e.next)||Le(e.prev,e,e.next)===0)){if(Ho(e),e=t=e.prev,e===e.next)break;i=!0}else e=e.next;while(i||e!==t);return t}function zo(n,t,e,i,s,r,o){if(!n)return;!o&&r&&t1(n,i,s,r);let a=n,l,c;for(;n.prev!==n.next;){if(l=n.prev,c=n.next,r?YM(n,i,s,r):XM(n)){t.push(l.i/e|0),t.push(n.i/e|0),t.push(c.i/e|0),Ho(n),n=c.next,a=c.next;continue}if(n=c,n===a){o?o===1?(n=qM(qs(n),t,e),zo(n,t,e,i,s,r,2)):o===2&&ZM(n,t,e,i,s,r):zo(qs(n),t,e,i,s,r,1);break}}}function XM(n){let t=n.prev,e=n,i=n.next;if(Le(t,e,i)>=0)return!1;let s=t.x,r=e.x,o=i.x,a=t.y,l=e.y,c=i.y,h=s<r?s<o?s:o:r<o?r:o,u=a<l?a<c?a:c:l<c?l:c,d=s>r?s>o?s:o:r>o?r:o,f=a>l?a>c?a:c:l>c?l:c,m=i.next;for(;m!==t;){if(m.x>=h&&m.x<=d&&m.y>=u&&m.y<=f&&Ir(s,a,r,l,o,c,m.x,m.y)&&Le(m.prev,m,m.next)>=0)return!1;m=m.next}return!0}function YM(n,t,e,i){let s=n.prev,r=n,o=n.next;if(Le(s,r,o)>=0)return!1;let a=s.x,l=r.x,c=o.x,h=s.y,u=r.y,d=o.y,f=a<l?a<c?a:c:l<c?l:c,m=h<u?h<d?h:d:u<d?u:d,_=a>l?a>c?a:c:l>c?l:c,g=h>u?h>d?h:d:u>d?u:d,p=Eu(f,m,t,e,i),S=Eu(_,g,t,e,i),M=n.prevZ,x=n.nextZ;for(;M&&M.z>=p&&x&&x.z<=S;){if(M.x>=f&&M.x<=_&&M.y>=m&&M.y<=g&&M!==s&&M!==o&&Ir(a,h,l,u,c,d,M.x,M.y)&&Le(M.prev,M,M.next)>=0||(M=M.prevZ,x.x>=f&&x.x<=_&&x.y>=m&&x.y<=g&&x!==s&&x!==o&&Ir(a,h,l,u,c,d,x.x,x.y)&&Le(x.prev,x,x.next)>=0))return!1;x=x.nextZ}for(;M&&M.z>=p;){if(M.x>=f&&M.x<=_&&M.y>=m&&M.y<=g&&M!==s&&M!==o&&Ir(a,h,l,u,c,d,M.x,M.y)&&Le(M.prev,M,M.next)>=0)return!1;M=M.prevZ}for(;x&&x.z<=S;){if(x.x>=f&&x.x<=_&&x.y>=m&&x.y<=g&&x!==s&&x!==o&&Ir(a,h,l,u,c,d,x.x,x.y)&&Le(x.prev,x,x.next)>=0)return!1;x=x.nextZ}return!0}function qM(n,t,e){let i=n;do{let s=i.prev,r=i.next.next;!Vl(s,r)&&sm(s,i,i.next,r)&&ko(s,r)&&ko(r,s)&&(t.push(s.i/e|0),t.push(i.i/e|0),t.push(r.i/e|0),Ho(i),Ho(i.next),i=n=r),i=i.next}while(i!==n);return qs(i)}function ZM(n,t,e,i,s,r){let o=n;do{let a=o.next.next;for(;a!==o.prev;){if(o.i!==a.i&&i1(o,a)){let l=rm(o,a);o=qs(o,o.next),l=qs(l,l.next),zo(o,t,e,i,s,r,0),zo(l,t,e,i,s,r,0);return}a=a.next}o=o.next}while(o!==n)}function KM(n,t,e,i){let s=[],r,o,a,l,c;for(r=0,o=t.length;r<o;r++)a=t[r]*i,l=r<o-1?t[r+1]*i:n.length,c=im(n,a,l,i,!1),c===c.next&&(c.steiner=!0),s.push(n1(c));for(s.sort($M),r=0;r<s.length;r++)e=JM(s[r],e);return e}function $M(n,t){return n.x-t.x}function JM(n,t){let e=jM(n,t);if(!e)return t;let i=rm(e,n);return qs(i,i.next),qs(e,e.next)}function jM(n,t){let e=t,i=-1/0,s,r=n.x,o=n.y;do{if(o<=e.y&&o>=e.next.y&&e.next.y!==e.y){let d=e.x+(o-e.y)*(e.next.x-e.x)/(e.next.y-e.y);if(d<=r&&d>i&&(i=d,s=e.x<e.next.x?e:e.next,d===r))return s}e=e.next}while(e!==t);if(!s)return null;let a=s,l=s.x,c=s.y,h=1/0,u;e=s;do r>=e.x&&e.x>=l&&r!==e.x&&Ir(o<c?r:i,o,l,c,o<c?i:r,o,e.x,e.y)&&(u=Math.abs(o-e.y)/(r-e.x),ko(e,n)&&(u<h||u===h&&(e.x>s.x||e.x===s.x&&QM(s,e)))&&(s=e,h=u)),e=e.next;while(e!==a);return s}function QM(n,t){return Le(n.prev,n,t.prev)<0&&Le(t.next,n,n.next)<0}function t1(n,t,e,i){let s=n;do s.z===0&&(s.z=Eu(s.x,s.y,t,e,i)),s.prevZ=s.prev,s.nextZ=s.next,s=s.next;while(s!==n);s.prevZ.nextZ=null,s.prevZ=null,e1(s)}function e1(n){let t,e,i,s,r,o,a,l,c=1;do{for(e=n,n=null,r=null,o=0;e;){for(o++,i=e,a=0,t=0;t<c&&(a++,i=i.nextZ,!!i);t++);for(l=c;a>0||l>0&&i;)a!==0&&(l===0||!i||e.z<=i.z)?(s=e,e=e.nextZ,a--):(s=i,i=i.nextZ,l--),r?r.nextZ=s:n=s,s.prevZ=r,r=s;e=i}r.nextZ=null,c*=2}while(o>1);return n}function Eu(n,t,e,i,s){return n=(n-e)*s|0,t=(t-i)*s|0,n=(n|n<<8)&16711935,n=(n|n<<4)&252645135,n=(n|n<<2)&858993459,n=(n|n<<1)&1431655765,t=(t|t<<8)&16711935,t=(t|t<<4)&252645135,t=(t|t<<2)&858993459,t=(t|t<<1)&1431655765,n|t<<1}function n1(n){let t=n,e=n;do(t.x<e.x||t.x===e.x&&t.y<e.y)&&(e=t),t=t.next;while(t!==n);return e}function Ir(n,t,e,i,s,r,o,a){return(s-o)*(t-a)>=(n-o)*(r-a)&&(n-o)*(i-a)>=(e-o)*(t-a)&&(e-o)*(r-a)>=(s-o)*(i-a)}function i1(n,t){return n.next.i!==t.i&&n.prev.i!==t.i&&!s1(n,t)&&(ko(n,t)&&ko(t,n)&&r1(n,t)&&(Le(n.prev,n,t.prev)||Le(n,t.prev,t))||Vl(n,t)&&Le(n.prev,n,n.next)>0&&Le(t.prev,t,t.next)>0)}function Le(n,t,e){return(t.y-n.y)*(e.x-t.x)-(t.x-n.x)*(e.y-t.y)}function Vl(n,t){return n.x===t.x&&n.y===t.y}function sm(n,t,e,i){let s=Za(Le(n,t,e)),r=Za(Le(n,t,i)),o=Za(Le(e,i,n)),a=Za(Le(e,i,t));return!!(s!==r&&o!==a||s===0&&qa(n,e,t)||r===0&&qa(n,i,t)||o===0&&qa(e,n,i)||a===0&&qa(e,t,i))}function qa(n,t,e){return t.x<=Math.max(n.x,e.x)&&t.x>=Math.min(n.x,e.x)&&t.y<=Math.max(n.y,e.y)&&t.y>=Math.min(n.y,e.y)}function Za(n){return n>0?1:n<0?-1:0}function s1(n,t){let e=n;do{if(e.i!==n.i&&e.next.i!==n.i&&e.i!==t.i&&e.next.i!==t.i&&sm(e,e.next,n,t))return!0;e=e.next}while(e!==n);return!1}function ko(n,t){return Le(n.prev,n,n.next)<0?Le(n,t,n.next)>=0&&Le(n,n.prev,t)>=0:Le(n,t,n.prev)<0||Le(n,n.next,t)<0}function r1(n,t){let e=n,i=!1,s=(n.x+t.x)/2,r=(n.y+t.y)/2;do e.y>r!=e.next.y>r&&e.next.y!==e.y&&s<(e.next.x-e.x)*(r-e.y)/(e.next.y-e.y)+e.x&&(i=!i),e=e.next;while(e!==n);return i}function rm(n,t){let e=new bu(n.i,n.x,n.y),i=new bu(t.i,t.x,t.y),s=n.next,r=t.prev;return n.next=t,t.prev=n,e.next=s,s.prev=e,i.next=e,e.prev=i,r.next=i,i.prev=r,i}function Tp(n,t,e,i){let s=new bu(n,t,e);return i?(s.next=i.next,s.prev=i,i.next.prev=s,i.next=s):(s.prev=s,s.next=s),s}function Ho(n){n.next.prev=n.prev,n.prev.next=n.next,n.prevZ&&(n.prevZ.nextZ=n.nextZ),n.nextZ&&(n.nextZ.prevZ=n.prevZ)}function bu(n,t,e){this.i=n,this.x=t,this.y=e,this.prev=null,this.next=null,this.z=0,this.prevZ=null,this.nextZ=null,this.steiner=!1}function o1(n,t,e,i){let s=0;for(let r=t,o=e-i;r<e;r+=i)s+=(n[o]-n[r])*(n[r+1]+n[o+1]),o=r;return s}var ss=class n{static area(t){let e=t.length,i=0;for(let s=e-1,r=0;r<e;s=r++)i+=t[s].x*t[r].y-t[r].x*t[s].y;return i*.5}static isClockWise(t){return n.area(t)<0}static triangulateShape(t,e){let i=[],s=[],r=[];wp(t),Ap(i,t);let o=t.length;e.forEach(wp);for(let l=0;l<e.length;l++)s.push(o),o+=e[l].length,Ap(i,e[l]);let a=WM.triangulate(i,s);for(let l=0;l<a.length;l+=3)r.push(a.slice(l,l+3));return r}};function wp(n){let t=n.length;t>2&&n[t-1].equals(n[0])&&n.pop()}function Ap(n,t){for(let e=0;e<t.length;e++)n.push(t[e].x),n.push(t[e].y)}var Tl=class n extends Fe{constructor(t=new Ys([new nt(.5,.5),new nt(-.5,.5),new nt(-.5,-.5),new nt(.5,-.5)]),e={}){super(),this.type="ExtrudeGeometry",this.parameters={shapes:t,options:e},t=Array.isArray(t)?t:[t];let i=this,s=[],r=[];for(let a=0,l=t.length;a<l;a++){let c=t[a];o(c)}this.setAttribute("position",new le(s,3)),this.setAttribute("uv",new le(r,2)),this.computeVertexNormals();function o(a){let l=[],c=e.curveSegments!==void 0?e.curveSegments:12,h=e.steps!==void 0?e.steps:1,u=e.depth!==void 0?e.depth:1,d=e.bevelEnabled!==void 0?e.bevelEnabled:!0,f=e.bevelThickness!==void 0?e.bevelThickness:.2,m=e.bevelSize!==void 0?e.bevelSize:f-.1,_=e.bevelOffset!==void 0?e.bevelOffset:0,g=e.bevelSegments!==void 0?e.bevelSegments:3,p=e.extrudePath,S=e.UVGenerator!==void 0?e.UVGenerator:a1,M,x=!1,L,R,C,D;p&&(M=p.getSpacedPoints(h),x=!0,d=!1,L=p.computeFrenetFrames(h,!1),R=new w,C=new w,D=new w),d||(g=0,f=0,m=0,_=0);let b=a.extractPoints(c),y=b.shape,I=b.holes;if(!ss.isClockWise(y)){y=y.reverse();for(let tt=0,at=I.length;tt<at;tt++){let A=I[tt];ss.isClockWise(A)&&(I[tt]=A.reverse())}}let V=ss.triangulateShape(y,I),F=y;for(let tt=0,at=I.length;tt<at;tt++){let A=I[tt];y=y.concat(A)}function X(tt,at,A){return at||console.error("THREE.ExtrudeGeometry: vec does not exist"),tt.clone().addScaledVector(at,A)}let z=y.length,J=V.length;function k(tt,at,A){let It,it,Et,ut=tt.x-at.x,Ht=tt.y-at.y,yt=A.x-tt.x,T=A.y-tt.y,v=ut*ut+Ht*Ht,H=ut*T-Ht*yt;if(Math.abs(H)>Number.EPSILON){let K=Math.sqrt(v),et=Math.sqrt(yt*yt+T*T),$=at.x-Ht/K,wt=at.y+ut/K,ft=A.x-T/et,Mt=A.y+yt/et,ie=((ft-$)*T-(Mt-wt)*yt)/(ut*T-Ht*yt);It=$+ut*ie-tt.x,it=wt+Ht*ie-tt.y;let ot=It*It+it*it;if(ot<=2)return new nt(It,it);Et=Math.sqrt(ot/2)}else{let K=!1;ut>Number.EPSILON?yt>Number.EPSILON&&(K=!0):ut<-Number.EPSILON?yt<-Number.EPSILON&&(K=!0):Math.sign(Ht)===Math.sign(T)&&(K=!0),K?(It=-Ht,it=ut,Et=Math.sqrt(v)):(It=ut,it=Ht,Et=Math.sqrt(v/2))}return new nt(It/Et,it/Et)}let rt=[];for(let tt=0,at=F.length,A=at-1,It=tt+1;tt<at;tt++,A++,It++)A===at&&(A=0),It===at&&(It=0),rt[tt]=k(F[tt],F[A],F[It]);let ct=[],mt,kt=rt.concat();for(let tt=0,at=I.length;tt<at;tt++){let A=I[tt];mt=[];for(let It=0,it=A.length,Et=it-1,ut=It+1;It<it;It++,Et++,ut++)Et===it&&(Et=0),ut===it&&(ut=0),mt[It]=k(A[It],A[Et],A[ut]);ct.push(mt),kt=kt.concat(mt)}for(let tt=0;tt<g;tt++){let at=tt/g,A=f*Math.cos(at*Math.PI/2),It=m*Math.sin(at*Math.PI/2)+_;for(let it=0,Et=F.length;it<Et;it++){let ut=X(F[it],rt[it],It);ht(ut.x,ut.y,-A)}for(let it=0,Et=I.length;it<Et;it++){let ut=I[it];mt=ct[it];for(let Ht=0,yt=ut.length;Ht<yt;Ht++){let T=X(ut[Ht],mt[Ht],It);ht(T.x,T.y,-A)}}}let Xt=m+_;for(let tt=0;tt<z;tt++){let at=d?X(y[tt],kt[tt],Xt):y[tt];x?(C.copy(L.normals[0]).multiplyScalar(at.x),R.copy(L.binormals[0]).multiplyScalar(at.y),D.copy(M[0]).add(C).add(R),ht(D.x,D.y,D.z)):ht(at.x,at.y,0)}for(let tt=1;tt<=h;tt++)for(let at=0;at<z;at++){let A=d?X(y[at],kt[at],Xt):y[at];x?(C.copy(L.normals[tt]).multiplyScalar(A.x),R.copy(L.binormals[tt]).multiplyScalar(A.y),D.copy(M[tt]).add(C).add(R),ht(D.x,D.y,D.z)):ht(A.x,A.y,u/h*tt)}for(let tt=g-1;tt>=0;tt--){let at=tt/g,A=f*Math.cos(at*Math.PI/2),It=m*Math.sin(at*Math.PI/2)+_;for(let it=0,Et=F.length;it<Et;it++){let ut=X(F[it],rt[it],It);ht(ut.x,ut.y,u+A)}for(let it=0,Et=I.length;it<Et;it++){let ut=I[it];mt=ct[it];for(let Ht=0,yt=ut.length;Ht<yt;Ht++){let T=X(ut[Ht],mt[Ht],It);x?ht(T.x,T.y+M[h-1].y,M[h-1].x+A):ht(T.x,T.y,u+A)}}}Z(),st();function Z(){let tt=s.length/3;if(d){let at=0,A=z*at;for(let It=0;It<J;It++){let it=V[It];Bt(it[2]+A,it[1]+A,it[0]+A)}at=h+g*2,A=z*at;for(let It=0;It<J;It++){let it=V[It];Bt(it[0]+A,it[1]+A,it[2]+A)}}else{for(let at=0;at<J;at++){let A=V[at];Bt(A[2],A[1],A[0])}for(let at=0;at<J;at++){let A=V[at];Bt(A[0]+z*h,A[1]+z*h,A[2]+z*h)}}i.addGroup(tt,s.length/3-tt,0)}function st(){let tt=s.length/3,at=0;Tt(F,at),at+=F.length;for(let A=0,It=I.length;A<It;A++){let it=I[A];Tt(it,at),at+=it.length}i.addGroup(tt,s.length/3-tt,1)}function Tt(tt,at){let A=tt.length;for(;--A>=0;){let It=A,it=A-1;it<0&&(it=tt.length-1);for(let Et=0,ut=h+g*2;Et<ut;Et++){let Ht=z*Et,yt=z*(Et+1),T=at+It+Ht,v=at+it+Ht,H=at+it+yt,K=at+It+yt;Zt(T,v,H,K)}}}function ht(tt,at,A){l.push(tt),l.push(at),l.push(A)}function Bt(tt,at,A){Gt(tt),Gt(at),Gt(A);let It=s.length/3,it=S.generateTopUV(i,s,It-3,It-2,It-1);ue(it[0]),ue(it[1]),ue(it[2])}function Zt(tt,at,A,It){Gt(tt),Gt(at),Gt(It),Gt(at),Gt(A),Gt(It);let it=s.length/3,Et=S.generateSideWallUV(i,s,it-6,it-3,it-2,it-1);ue(Et[0]),ue(Et[1]),ue(Et[3]),ue(Et[1]),ue(Et[2]),ue(Et[3])}function Gt(tt){s.push(l[tt*3+0]),s.push(l[tt*3+1]),s.push(l[tt*3+2])}function ue(tt){r.push(tt.x),r.push(tt.y)}}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}toJSON(){let t=super.toJSON(),e=this.parameters.shapes,i=this.parameters.options;return l1(e,i,t)}static fromJSON(t,e){let i=[];for(let r=0,o=t.shapes.length;r<o;r++){let a=e[t.shapes[r]];i.push(a)}let s=t.options.extrudePath;return s!==void 0&&(t.options.extrudePath=new El[s.type]().fromJSON(s)),new n(i,t.options)}},a1={generateTopUV:function(n,t,e,i,s){let r=t[e*3],o=t[e*3+1],a=t[i*3],l=t[i*3+1],c=t[s*3],h=t[s*3+1];return[new nt(r,o),new nt(a,l),new nt(c,h)]},generateSideWallUV:function(n,t,e,i,s,r){let o=t[e*3],a=t[e*3+1],l=t[e*3+2],c=t[i*3],h=t[i*3+1],u=t[i*3+2],d=t[s*3],f=t[s*3+1],m=t[s*3+2],_=t[r*3],g=t[r*3+1],p=t[r*3+2];return Math.abs(a-h)<Math.abs(o-c)?[new nt(o,1-l),new nt(c,1-u),new nt(d,1-m),new nt(_,1-p)]:[new nt(a,1-l),new nt(h,1-u),new nt(f,1-m),new nt(g,1-p)]}};function l1(n,t,e){if(e.shapes=[],Array.isArray(n))for(let i=0,s=n.length;i<s;i++){let r=n[i];e.shapes.push(r.uuid)}else e.shapes.push(n.uuid);return e.options=Object.assign({},t),t.extrudePath!==void 0&&(e.options.extrudePath=t.extrudePath.toJSON()),e}var wl=class n extends Fe{constructor(t=.5,e=1,i=32,s=1,r=0,o=Math.PI*2){super(),this.type="RingGeometry",this.parameters={innerRadius:t,outerRadius:e,thetaSegments:i,phiSegments:s,thetaStart:r,thetaLength:o},i=Math.max(3,i),s=Math.max(1,s);let a=[],l=[],c=[],h=[],u=t,d=(e-t)/s,f=new w,m=new nt;for(let _=0;_<=s;_++){for(let g=0;g<=i;g++){let p=r+g/i*o;f.x=u*Math.cos(p),f.y=u*Math.sin(p),l.push(f.x,f.y,f.z),c.push(0,0,1),m.x=(f.x/e+1)/2,m.y=(f.y/e+1)/2,h.push(m.x,m.y)}u+=d}for(let _=0;_<s;_++){let g=_*(i+1);for(let p=0;p<i;p++){let S=p+g,M=S,x=S+i+1,L=S+i+2,R=S+1;a.push(M,x,R),a.push(x,L,R)}}this.setIndex(a),this.setAttribute("position",new le(l,3)),this.setAttribute("normal",new le(c,3)),this.setAttribute("uv",new le(h,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new n(t.innerRadius,t.outerRadius,t.thetaSegments,t.phiSegments,t.thetaStart,t.thetaLength)}},Al=class n extends Fe{constructor(t=new Ys([new nt(0,.5),new nt(-.5,-.5),new nt(.5,-.5)]),e=12){super(),this.type="ShapeGeometry",this.parameters={shapes:t,curveSegments:e};let i=[],s=[],r=[],o=[],a=0,l=0;if(Array.isArray(t)===!1)c(t);else for(let h=0;h<t.length;h++)c(t[h]),this.addGroup(a,l,h),a+=l,l=0;this.setIndex(i),this.setAttribute("position",new le(s,3)),this.setAttribute("normal",new le(r,3)),this.setAttribute("uv",new le(o,2));function c(h){let u=s.length/3,d=h.extractPoints(e),f=d.shape,m=d.holes;ss.isClockWise(f)===!1&&(f=f.reverse());for(let g=0,p=m.length;g<p;g++){let S=m[g];ss.isClockWise(S)===!0&&(m[g]=S.reverse())}let _=ss.triangulateShape(f,m);for(let g=0,p=m.length;g<p;g++){let S=m[g];f=f.concat(S)}for(let g=0,p=f.length;g<p;g++){let S=f[g];s.push(S.x,S.y,0),r.push(0,0,1),o.push(S.x,S.y)}for(let g=0,p=_.length;g<p;g++){let S=_[g],M=S[0]+u,x=S[1]+u,L=S[2]+u;i.push(M,x,L),l+=3}}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}toJSON(){let t=super.toJSON(),e=this.parameters.shapes;return c1(e,t)}static fromJSON(t,e){let i=[];for(let s=0,r=t.shapes.length;s<r;s++){let o=e[t.shapes[s]];i.push(o)}return new n(i,t.curveSegments)}};function c1(n,t){if(t.shapes=[],Array.isArray(n))for(let e=0,i=n.length;e<i;e++){let s=n[e];t.shapes.push(s.uuid)}else t.shapes.push(n.uuid);return t}var Rl=class n extends Fe{constructor(t=1,e=32,i=16,s=0,r=Math.PI*2,o=0,a=Math.PI){super(),this.type="SphereGeometry",this.parameters={radius:t,widthSegments:e,heightSegments:i,phiStart:s,phiLength:r,thetaStart:o,thetaLength:a},e=Math.max(3,Math.floor(e)),i=Math.max(2,Math.floor(i));let l=Math.min(o+a,Math.PI),c=0,h=[],u=new w,d=new w,f=[],m=[],_=[],g=[];for(let p=0;p<=i;p++){let S=[],M=p/i,x=0;p===0&&o===0?x=.5/e:p===i&&l===Math.PI&&(x=-.5/e);for(let L=0;L<=e;L++){let R=L/e;u.x=-t*Math.cos(s+R*r)*Math.sin(o+M*a),u.y=t*Math.cos(o+M*a),u.z=t*Math.sin(s+R*r)*Math.sin(o+M*a),m.push(u.x,u.y,u.z),d.copy(u).normalize(),_.push(d.x,d.y,d.z),g.push(R+x,1-M),S.push(c++)}h.push(S)}for(let p=0;p<i;p++)for(let S=0;S<e;S++){let M=h[p][S+1],x=h[p][S],L=h[p+1][S],R=h[p+1][S+1];(p!==0||o>0)&&f.push(M,x,R),(p!==i-1||l<Math.PI)&&f.push(x,L,R)}this.setIndex(f),this.setAttribute("position",new le(m,3)),this.setAttribute("normal",new le(_,3)),this.setAttribute("uv",new le(g,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new n(t.radius,t.widthSegments,t.heightSegments,t.phiStart,t.phiLength,t.thetaStart,t.thetaLength)}};var Cl=class n extends Fe{constructor(t=1,e=.4,i=12,s=48,r=Math.PI*2){super(),this.type="TorusGeometry",this.parameters={radius:t,tube:e,radialSegments:i,tubularSegments:s,arc:r},i=Math.floor(i),s=Math.floor(s);let o=[],a=[],l=[],c=[],h=new w,u=new w,d=new w;for(let f=0;f<=i;f++)for(let m=0;m<=s;m++){let _=m/s*r,g=f/i*Math.PI*2;u.x=(t+e*Math.cos(g))*Math.cos(_),u.y=(t+e*Math.cos(g))*Math.sin(_),u.z=e*Math.sin(g),a.push(u.x,u.y,u.z),h.x=t*Math.cos(_),h.y=t*Math.sin(_),d.subVectors(u,h).normalize(),l.push(d.x,d.y,d.z),c.push(m/s),c.push(f/i)}for(let f=1;f<=i;f++)for(let m=1;m<=s;m++){let _=(s+1)*f+m-1,g=(s+1)*(f-1)+m-1,p=(s+1)*(f-1)+m,S=(s+1)*f+m;o.push(_,g,S),o.push(g,p,S)}this.setIndex(o),this.setAttribute("position",new le(a,3)),this.setAttribute("normal",new le(l,3)),this.setAttribute("uv",new le(c,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new n(t.radius,t.tube,t.radialSegments,t.tubularSegments,t.arc)}};var Pl=class n extends Fe{constructor(t=new yl(new w(-1,-1,0),new w(-1,1,0),new w(1,1,0)),e=64,i=1,s=8,r=!1){super(),this.type="TubeGeometry",this.parameters={path:t,tubularSegments:e,radius:i,radialSegments:s,closed:r};let o=t.computeFrenetFrames(e,r);this.tangents=o.tangents,this.normals=o.normals,this.binormals=o.binormals;let a=new w,l=new w,c=new nt,h=new w,u=[],d=[],f=[],m=[];_(),this.setIndex(m),this.setAttribute("position",new le(u,3)),this.setAttribute("normal",new le(d,3)),this.setAttribute("uv",new le(f,2));function _(){for(let M=0;M<e;M++)g(M);g(r===!1?e:0),S(),p()}function g(M){h=t.getPointAt(M/e,h);let x=o.normals[M],L=o.binormals[M];for(let R=0;R<=s;R++){let C=R/s*Math.PI*2,D=Math.sin(C),b=-Math.cos(C);l.x=b*x.x+D*L.x,l.y=b*x.y+D*L.y,l.z=b*x.z+D*L.z,l.normalize(),d.push(l.x,l.y,l.z),a.x=h.x+i*l.x,a.y=h.y+i*l.y,a.z=h.z+i*l.z,u.push(a.x,a.y,a.z)}}function p(){for(let M=1;M<=e;M++)for(let x=1;x<=s;x++){let L=(s+1)*(M-1)+(x-1),R=(s+1)*M+(x-1),C=(s+1)*M+x,D=(s+1)*(M-1)+x;m.push(L,R,D),m.push(R,C,D)}}function S(){for(let M=0;M<=e;M++)for(let x=0;x<=s;x++)c.x=M/e,c.y=x/s,f.push(c.x,c.y)}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}toJSON(){let t=super.toJSON();return t.path=this.parameters.path.toJSON(),t}static fromJSON(t){return new n(new El[t.path.type]().fromJSON(t.path),t.tubularSegments,t.radius,t.radialSegments,t.closed)}};var Il=class extends cn{static get type(){return"RawShaderMaterial"}constructor(t){super(t),this.isRawShaderMaterial=!0}},Zs=class extends as{static get type(){return"MeshStandardMaterial"}constructor(t){super(),this.isMeshStandardMaterial=!0,this.defines={STANDARD:""},this.color=new Yt(16777215),this.roughness=1,this.metalness=0,this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new Yt(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=qp,this.normalScale=new nt(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.roughnessMap=null,this.metalnessMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new pi,this.envMapIntensity=1,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.defines={STANDARD:""},this.color.copy(t.color),this.roughness=t.roughness,this.metalness=t.metalness,this.map=t.map,this.lightMap=t.lightMap,this.lightMapIntensity=t.lightMapIntensity,this.aoMap=t.aoMap,this.aoMapIntensity=t.aoMapIntensity,this.emissive.copy(t.emissive),this.emissiveMap=t.emissiveMap,this.emissiveIntensity=t.emissiveIntensity,this.bumpMap=t.bumpMap,this.bumpScale=t.bumpScale,this.normalMap=t.normalMap,this.normalMapType=t.normalMapType,this.normalScale.copy(t.normalScale),this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this.roughnessMap=t.roughnessMap,this.metalnessMap=t.metalnessMap,this.alphaMap=t.alphaMap,this.envMap=t.envMap,this.envMapRotation.copy(t.envMapRotation),this.envMapIntensity=t.envMapIntensity,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.wireframeLinecap=t.wireframeLinecap,this.wireframeLinejoin=t.wireframeLinejoin,this.flatShading=t.flatShading,this.fog=t.fog,this}};function Ka(n,t,e){return!n||!e&&n.constructor===t?n:typeof t.BYTES_PER_ELEMENT=="number"?new t(n):Array.prototype.slice.call(n)}function h1(n){return ArrayBuffer.isView(n)&&!(n instanceof DataView)}var Wr=class{constructor(t,e,i,s){this.parameterPositions=t,this._cachedIndex=0,this.resultBuffer=s!==void 0?s:new e.constructor(i),this.sampleValues=e,this.valueSize=i,this.settings=null,this.DefaultSettings_={}}evaluate(t){let e=this.parameterPositions,i=this._cachedIndex,s=e[i],r=e[i-1];n:{t:{let o;e:{i:if(!(t<s)){for(let a=i+2;;){if(s===void 0){if(t<r)break i;return i=e.length,this._cachedIndex=i,this.copySampleValue_(i-1)}if(i===a)break;if(r=s,s=e[++i],t<s)break t}o=e.length;break e}if(!(t>=r)){let a=e[1];t<a&&(i=2,r=a);for(let l=i-2;;){if(r===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(i===l)break;if(s=r,r=e[--i-1],t>=r)break t}o=i,i=0;break e}break n}for(;i<o;){let a=i+o>>>1;t<e[a]?o=a:i=a+1}if(s=e[i],r=e[i-1],r===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(s===void 0)return i=e.length,this._cachedIndex=i,this.copySampleValue_(i-1)}this._cachedIndex=i,this.intervalChanged_(i,r,s)}return this.interpolate_(i,r,t,s)}getSettings_(){return this.settings||this.DefaultSettings_}copySampleValue_(t){let e=this.resultBuffer,i=this.sampleValues,s=this.valueSize,r=t*s;for(let o=0;o!==s;++o)e[o]=i[r+o];return e}interpolate_(){throw new Error("call to abstract method")}intervalChanged_(){}},Su=class extends Wr{constructor(t,e,i,s){super(t,e,i,s),this._weightPrev=-0,this._offsetPrev=-0,this._weightNext=-0,this._offsetNext=-0,this.DefaultSettings_={endingStart:bf,endingEnd:bf}}intervalChanged_(t,e,i){let s=this.parameterPositions,r=t-2,o=t+1,a=s[r],l=s[o];if(a===void 0)switch(this.getSettings_().endingStart){case Sf:r=t,a=2*e-i;break;case Tf:r=s.length-2,a=e+s[r]-s[r+1];break;default:r=t,a=i}if(l===void 0)switch(this.getSettings_().endingEnd){case Sf:o=t,l=2*i-e;break;case Tf:o=1,l=i+s[1]-s[0];break;default:o=t-1,l=e}let c=(i-e)*.5,h=this.valueSize;this._weightPrev=c/(e-a),this._weightNext=c/(l-i),this._offsetPrev=r*h,this._offsetNext=o*h}interpolate_(t,e,i,s){let r=this.resultBuffer,o=this.sampleValues,a=this.valueSize,l=t*a,c=l-a,h=this._offsetPrev,u=this._offsetNext,d=this._weightPrev,f=this._weightNext,m=(i-e)/(s-e),_=m*m,g=_*m,p=-d*g+2*d*_-d*m,S=(1+d)*g+(-1.5-2*d)*_+(-.5+d)*m+1,M=(-1-f)*g+(1.5+f)*_+.5*m,x=f*g-f*_;for(let L=0;L!==a;++L)r[L]=p*o[h+L]+S*o[c+L]+M*o[l+L]+x*o[u+L];return r}},Tu=class extends Wr{constructor(t,e,i,s){super(t,e,i,s)}interpolate_(t,e,i,s){let r=this.resultBuffer,o=this.sampleValues,a=this.valueSize,l=t*a,c=l-a,h=(i-e)/(s-e),u=1-h;for(let d=0;d!==a;++d)r[d]=o[c+d]*u+o[l+d]*h;return r}},wu=class extends Wr{constructor(t,e,i,s){super(t,e,i,s)}interpolate_(t){return this.copySampleValue_(t-1)}},ii=class{constructor(t,e,i,s){if(t===void 0)throw new Error("THREE.KeyframeTrack: track name is undefined");if(e===void 0||e.length===0)throw new Error("THREE.KeyframeTrack: no keyframes in track named "+t);this.name=t,this.times=Ka(e,this.TimeBufferType),this.values=Ka(i,this.ValueBufferType),this.setInterpolation(s||this.DefaultInterpolation)}static toJSON(t){let e=t.constructor,i;if(e.toJSON!==this.toJSON)i=e.toJSON(t);else{i={name:t.name,times:Ka(t.times,Array),values:Ka(t.values,Array)};let s=t.getInterpolation();s!==t.DefaultInterpolation&&(i.interpolation=s)}return i.type=t.ValueTypeName,i}InterpolantFactoryMethodDiscrete(t){return new wu(this.times,this.values,this.getValueSize(),t)}InterpolantFactoryMethodLinear(t){return new Tu(this.times,this.values,this.getValueSize(),t)}InterpolantFactoryMethodSmooth(t){return new Su(this.times,this.values,this.getValueSize(),t)}setInterpolation(t){let e;switch(t){case el:e=this.InterpolantFactoryMethodDiscrete;break;case su:e=this.InterpolantFactoryMethodLinear;break;case Hc:e=this.InterpolantFactoryMethodSmooth;break}if(e===void 0){let i="unsupported interpolation for "+this.ValueTypeName+" keyframe track named "+this.name;if(this.createInterpolant===void 0)if(t!==this.DefaultInterpolation)this.setInterpolation(this.DefaultInterpolation);else throw new Error(i);return console.warn("THREE.KeyframeTrack:",i),this}return this.createInterpolant=e,this}getInterpolation(){switch(this.createInterpolant){case this.InterpolantFactoryMethodDiscrete:return el;case this.InterpolantFactoryMethodLinear:return su;case this.InterpolantFactoryMethodSmooth:return Hc}}getValueSize(){return this.values.length/this.times.length}shift(t){if(t!==0){let e=this.times;for(let i=0,s=e.length;i!==s;++i)e[i]+=t}return this}scale(t){if(t!==1){let e=this.times;for(let i=0,s=e.length;i!==s;++i)e[i]*=t}return this}trim(t,e){let i=this.times,s=i.length,r=0,o=s-1;for(;r!==s&&i[r]<t;)++r;for(;o!==-1&&i[o]>e;)--o;if(++o,r!==0||o!==s){r>=o&&(o=Math.max(o,1),r=o-1);let a=this.getValueSize();this.times=i.slice(r,o),this.values=this.values.slice(r*a,o*a)}return this}validate(){let t=!0,e=this.getValueSize();e-Math.floor(e)!==0&&(console.error("THREE.KeyframeTrack: Invalid value size in track.",this),t=!1);let i=this.times,s=this.values,r=i.length;r===0&&(console.error("THREE.KeyframeTrack: Track is empty.",this),t=!1);let o=null;for(let a=0;a!==r;a++){let l=i[a];if(typeof l=="number"&&isNaN(l)){console.error("THREE.KeyframeTrack: Time is not a valid number.",this,a,l),t=!1;break}if(o!==null&&o>l){console.error("THREE.KeyframeTrack: Out of order keys.",this,a,l,o),t=!1;break}o=l}if(s!==void 0&&h1(s))for(let a=0,l=s.length;a!==l;++a){let c=s[a];if(isNaN(c)){console.error("THREE.KeyframeTrack: Value is not a valid number.",this,a,c),t=!1;break}}return t}optimize(){let t=this.times.slice(),e=this.values.slice(),i=this.getValueSize(),s=this.getInterpolation()===Hc,r=t.length-1,o=1;for(let a=1;a<r;++a){let l=!1,c=t[a],h=t[a+1];if(c!==h&&(a!==1||c!==t[0]))if(s)l=!0;else{let u=a*i,d=u-i,f=u+i;for(let m=0;m!==i;++m){let _=e[u+m];if(_!==e[d+m]||_!==e[f+m]){l=!0;break}}}if(l){if(a!==o){t[o]=t[a];let u=a*i,d=o*i;for(let f=0;f!==i;++f)e[d+f]=e[u+f]}++o}}if(r>0){t[o]=t[r];for(let a=r*i,l=o*i,c=0;c!==i;++c)e[l+c]=e[a+c];++o}return o!==t.length?(this.times=t.slice(0,o),this.values=e.slice(0,o*i)):(this.times=t,this.values=e),this}clone(){let t=this.times.slice(),e=this.values.slice(),i=this.constructor,s=new i(this.name,t,e);return s.createInterpolant=this.createInterpolant,s}};ii.prototype.TimeBufferType=Float32Array;ii.prototype.ValueBufferType=Float32Array;ii.prototype.DefaultInterpolation=su;var Ks=class extends ii{constructor(t,e,i){super(t,e,i)}};Ks.prototype.ValueTypeName="bool";Ks.prototype.ValueBufferType=Array;Ks.prototype.DefaultInterpolation=el;Ks.prototype.InterpolantFactoryMethodLinear=void 0;Ks.prototype.InterpolantFactoryMethodSmooth=void 0;var Au=class extends ii{};Au.prototype.ValueTypeName="color";var Ru=class extends ii{};Ru.prototype.ValueTypeName="number";var Cu=class extends Wr{constructor(t,e,i,s){super(t,e,i,s)}interpolate_(t,e,i,s){let r=this.resultBuffer,o=this.sampleValues,a=this.valueSize,l=(i-e)/(s-e),c=t*a;for(let h=c+a;c!==h;c+=4)ei.slerpFlat(r,0,o,c-a,o,c,l);return r}},Dl=class extends ii{InterpolantFactoryMethodLinear(t){return new Cu(this.times,this.values,this.getValueSize(),t)}};Dl.prototype.ValueTypeName="quaternion";Dl.prototype.InterpolantFactoryMethodSmooth=void 0;var $s=class extends ii{constructor(t,e,i){super(t,e,i)}};$s.prototype.ValueTypeName="string";$s.prototype.ValueBufferType=Array;$s.prototype.DefaultInterpolation=el;$s.prototype.InterpolantFactoryMethodLinear=void 0;$s.prototype.InterpolantFactoryMethodSmooth=void 0;var Pu=class extends ii{};Pu.prototype.ValueTypeName="vector";var Rp={enabled:!1,files:{},add:function(n,t){this.enabled!==!1&&(this.files[n]=t)},get:function(n){if(this.enabled!==!1)return this.files[n]},remove:function(n){delete this.files[n]},clear:function(){this.files={}}},Iu=class{constructor(t,e,i){let s=this,r=!1,o=0,a=0,l,c=[];this.onStart=void 0,this.onLoad=t,this.onProgress=e,this.onError=i,this.itemStart=function(h){a++,r===!1&&s.onStart!==void 0&&s.onStart(h,o,a),r=!0},this.itemEnd=function(h){o++,s.onProgress!==void 0&&s.onProgress(h,o,a),o===a&&(r=!1,s.onLoad!==void 0&&s.onLoad())},this.itemError=function(h){s.onError!==void 0&&s.onError(h)},this.resolveURL=function(h){return l?l(h):h},this.setURLModifier=function(h){return l=h,this},this.addHandler=function(h,u){return c.push(h,u),this},this.removeHandler=function(h){let u=c.indexOf(h);return u!==-1&&c.splice(u,2),this},this.getHandler=function(h){for(let u=0,d=c.length;u<d;u+=2){let f=c[u],m=c[u+1];if(f.global&&(f.lastIndex=0),f.test(h))return m}return null}}},u1=new Iu,Vo=class{constructor(t){this.manager=t!==void 0?t:u1,this.crossOrigin="anonymous",this.withCredentials=!1,this.path="",this.resourcePath="",this.requestHeader={}}load(){}loadAsync(t,e){let i=this;return new Promise(function(s,r){i.load(t,s,e,r)})}parse(){}setCrossOrigin(t){return this.crossOrigin=t,this}setWithCredentials(t){return this.withCredentials=t,this}setPath(t){return this.path=t,this}setResourcePath(t){return this.resourcePath=t,this}setRequestHeader(t){return this.requestHeader=t,this}};Vo.DEFAULT_MATERIAL_NAME="__DEFAULT";var Du=class extends Vo{constructor(t){super(t)}load(t,e,i,s){this.path!==void 0&&(t=this.path+t),t=this.manager.resolveURL(t);let r=this,o=Rp.get(t);if(o!==void 0)return r.manager.itemStart(t),setTimeout(function(){e&&e(o),r.manager.itemEnd(t)},0),o;let a=Po("img");function l(){h(),Rp.add(t,this),e&&e(this),r.manager.itemEnd(t)}function c(u){h(),s&&s(u),r.manager.itemError(t),r.manager.itemEnd(t)}function h(){a.removeEventListener("load",l,!1),a.removeEventListener("error",c,!1)}return a.addEventListener("load",l,!1),a.addEventListener("error",c,!1),t.slice(0,5)!=="data:"&&this.crossOrigin!==void 0&&(a.crossOrigin=this.crossOrigin),r.manager.itemStart(t),a.src=t,a}};var Ll=class extends Vo{constructor(t){super(t)}load(t,e,i,s){let r=new _n,o=new Du(this.manager);return o.setCrossOrigin(this.crossOrigin),o.setPath(this.path),o.load(t,function(a){r.image=a,r.needsUpdate=!0,e!==void 0&&e(r)},i,s),r}},Go=class extends $e{constructor(t,e=1){super(),this.isLight=!0,this.type="Light",this.color=new Yt(t),this.intensity=e}dispose(){}copy(t,e){return super.copy(t,e),this.color.copy(t.color),this.intensity=t.intensity,this}toJSON(t){let e=super.toJSON(t);return e.object.color=this.color.getHex(),e.object.intensity=this.intensity,this.groundColor!==void 0&&(e.object.groundColor=this.groundColor.getHex()),this.distance!==void 0&&(e.object.distance=this.distance),this.angle!==void 0&&(e.object.angle=this.angle),this.decay!==void 0&&(e.object.decay=this.decay),this.penumbra!==void 0&&(e.object.penumbra=this.penumbra),this.shadow!==void 0&&(e.object.shadow=this.shadow.toJSON()),this.target!==void 0&&(e.object.target=this.target.uuid),e}},Wo=class extends Go{constructor(t,e,i){super(t,i),this.isHemisphereLight=!0,this.type="HemisphereLight",this.position.copy($e.DEFAULT_UP),this.updateMatrix(),this.groundColor=new Yt(e)}copy(t,e){return super.copy(t,e),this.groundColor.copy(t.groundColor),this}},xh=new be,Cp=new w,Pp=new w,Ul=class{constructor(t){this.camera=t,this.intensity=1,this.bias=0,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new nt(512,512),this.map=null,this.mapPass=null,this.matrix=new be,this.autoUpdate=!0,this.needsUpdate=!1,this._frustum=new Do,this._frameExtents=new nt(1,1),this._viewportCount=1,this._viewports=[new Ee(0,0,1,1)]}getViewportCount(){return this._viewportCount}getFrustum(){return this._frustum}updateMatrices(t){let e=this.camera,i=this.matrix;Cp.setFromMatrixPosition(t.matrixWorld),e.position.copy(Cp),Pp.setFromMatrixPosition(t.target.matrixWorld),e.lookAt(Pp),e.updateMatrixWorld(),xh.multiplyMatrices(e.projectionMatrix,e.matrixWorldInverse),this._frustum.setFromProjectionMatrix(xh),i.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),i.multiply(xh)}getViewport(t){return this._viewports[t]}getFrameExtents(){return this._frameExtents}dispose(){this.map&&this.map.dispose(),this.mapPass&&this.mapPass.dispose()}copy(t){return this.camera=t.camera.clone(),this.intensity=t.intensity,this.bias=t.bias,this.radius=t.radius,this.mapSize.copy(t.mapSize),this}clone(){return new this.constructor().copy(this)}toJSON(){let t={};return this.intensity!==1&&(t.intensity=this.intensity),this.bias!==0&&(t.bias=this.bias),this.normalBias!==0&&(t.normalBias=this.normalBias),this.radius!==1&&(t.radius=this.radius),(this.mapSize.x!==512||this.mapSize.y!==512)&&(t.mapSize=this.mapSize.toArray()),t.camera=this.camera.toJSON(!1).object,delete t.camera.matrix,t}};var Ip=new be,vo=new w,vh=new w,Lu=class extends Ul{constructor(){super(new tn(90,1,.5,500)),this.isPointLightShadow=!0,this._frameExtents=new nt(4,2),this._viewportCount=6,this._viewports=[new Ee(2,1,1,1),new Ee(0,1,1,1),new Ee(3,1,1,1),new Ee(1,1,1,1),new Ee(3,0,1,1),new Ee(1,0,1,1)],this._cubeDirections=[new w(1,0,0),new w(-1,0,0),new w(0,0,1),new w(0,0,-1),new w(0,1,0),new w(0,-1,0)],this._cubeUps=[new w(0,1,0),new w(0,1,0),new w(0,1,0),new w(0,1,0),new w(0,0,1),new w(0,0,-1)]}updateMatrices(t,e=0){let i=this.camera,s=this.matrix,r=t.distance||i.far;r!==i.far&&(i.far=r,i.updateProjectionMatrix()),vo.setFromMatrixPosition(t.matrixWorld),i.position.copy(vo),vh.copy(i.position),vh.add(this._cubeDirections[e]),i.up.copy(this._cubeUps[e]),i.lookAt(vh),i.updateMatrixWorld(),s.makeTranslation(-vo.x,-vo.y,-vo.z),Ip.multiplyMatrices(i.projectionMatrix,i.matrixWorldInverse),this._frustum.setFromProjectionMatrix(Ip)}},Nl=class extends Go{constructor(t,e,i=0,s=2){super(t,e),this.isPointLight=!0,this.type="PointLight",this.distance=i,this.decay=s,this.shadow=new Lu}get power(){return this.intensity*4*Math.PI}set power(t){this.intensity=t/(4*Math.PI)}dispose(){this.shadow.dispose()}copy(t,e){return super.copy(t,e),this.distance=t.distance,this.decay=t.decay,this.shadow=t.shadow.clone(),this}},Uu=class extends Ul{constructor(){super(new Vr(-5,5,5,-5,.5,500)),this.isDirectionalLightShadow=!0}},Xr=class extends Go{constructor(t,e){super(t,e),this.isDirectionalLight=!0,this.type="DirectionalLight",this.position.copy($e.DEFAULT_UP),this.updateMatrix(),this.target=new $e,this.shadow=new Uu}dispose(){this.shadow.dispose()}copy(t){return super.copy(t),this.target=t.target.clone(),this.shadow=t.shadow.clone(),this}};var Ol=class{constructor(t=!0){this.autoStart=t,this.startTime=0,this.oldTime=0,this.elapsedTime=0,this.running=!1}start(){this.startTime=Dp(),this.oldTime=this.startTime,this.elapsedTime=0,this.running=!0}stop(){this.getElapsedTime(),this.running=!1,this.autoStart=!1}getElapsedTime(){return this.getDelta(),this.elapsedTime}getDelta(){let t=0;if(this.autoStart&&!this.running)return this.start(),0;if(this.running){let e=Dp();t=(e-this.oldTime)/1e3,this.oldTime=e,this.elapsedTime+=t}return t}};function Dp(){return performance.now()}var ed="\\[\\]\\.:\\/",d1=new RegExp("["+ed+"]","g"),nd="[^"+ed+"]",f1="[^"+ed.replace("\\.","")+"]",p1=/((?:WC+[\/:])*)/.source.replace("WC",nd),m1=/(WCOD+)?/.source.replace("WCOD",f1),g1=/(?:\.(WC+)(?:\[(.+)\])?)?/.source.replace("WC",nd),_1=/\.(WC+)(?:\[(.+)\])?/.source.replace("WC",nd),x1=new RegExp("^"+p1+m1+g1+_1+"$"),v1=["material","materials","bones","map"],Nu=class{constructor(t,e,i){let s=i||Ie.parseTrackName(e);this._targetGroup=t,this._bindings=t.subscribe_(e,s)}getValue(t,e){this.bind();let i=this._targetGroup.nCachedObjects_,s=this._bindings[i];s!==void 0&&s.getValue(t,e)}setValue(t,e){let i=this._bindings;for(let s=this._targetGroup.nCachedObjects_,r=i.length;s!==r;++s)i[s].setValue(t,e)}bind(){let t=this._bindings;for(let e=this._targetGroup.nCachedObjects_,i=t.length;e!==i;++e)t[e].bind()}unbind(){let t=this._bindings;for(let e=this._targetGroup.nCachedObjects_,i=t.length;e!==i;++e)t[e].unbind()}},Ie=class n{constructor(t,e,i){this.path=e,this.parsedPath=i||n.parseTrackName(e),this.node=n.findNode(t,this.parsedPath.nodeName),this.rootNode=t,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}static create(t,e,i){return t&&t.isAnimationObjectGroup?new n.Composite(t,e,i):new n(t,e,i)}static sanitizeNodeName(t){return t.replace(/\s/g,"_").replace(d1,"")}static parseTrackName(t){let e=x1.exec(t);if(e===null)throw new Error("PropertyBinding: Cannot parse trackName: "+t);let i={nodeName:e[2],objectName:e[3],objectIndex:e[4],propertyName:e[5],propertyIndex:e[6]},s=i.nodeName&&i.nodeName.lastIndexOf(".");if(s!==void 0&&s!==-1){let r=i.nodeName.substring(s+1);v1.indexOf(r)!==-1&&(i.nodeName=i.nodeName.substring(0,s),i.objectName=r)}if(i.propertyName===null||i.propertyName.length===0)throw new Error("PropertyBinding: can not parse propertyName from trackName: "+t);return i}static findNode(t,e){if(e===void 0||e===""||e==="."||e===-1||e===t.name||e===t.uuid)return t;if(t.skeleton){let i=t.skeleton.getBoneByName(e);if(i!==void 0)return i}if(t.children){let i=function(r){for(let o=0;o<r.length;o++){let a=r[o];if(a.name===e||a.uuid===e)return a;let l=i(a.children);if(l)return l}return null},s=i(t.children);if(s)return s}return null}_getValue_unavailable(){}_setValue_unavailable(){}_getValue_direct(t,e){t[e]=this.targetObject[this.propertyName]}_getValue_array(t,e){let i=this.resolvedProperty;for(let s=0,r=i.length;s!==r;++s)t[e++]=i[s]}_getValue_arrayElement(t,e){t[e]=this.resolvedProperty[this.propertyIndex]}_getValue_toArray(t,e){this.resolvedProperty.toArray(t,e)}_setValue_direct(t,e){this.targetObject[this.propertyName]=t[e]}_setValue_direct_setNeedsUpdate(t,e){this.targetObject[this.propertyName]=t[e],this.targetObject.needsUpdate=!0}_setValue_direct_setMatrixWorldNeedsUpdate(t,e){this.targetObject[this.propertyName]=t[e],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_array(t,e){let i=this.resolvedProperty;for(let s=0,r=i.length;s!==r;++s)i[s]=t[e++]}_setValue_array_setNeedsUpdate(t,e){let i=this.resolvedProperty;for(let s=0,r=i.length;s!==r;++s)i[s]=t[e++];this.targetObject.needsUpdate=!0}_setValue_array_setMatrixWorldNeedsUpdate(t,e){let i=this.resolvedProperty;for(let s=0,r=i.length;s!==r;++s)i[s]=t[e++];this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_arrayElement(t,e){this.resolvedProperty[this.propertyIndex]=t[e]}_setValue_arrayElement_setNeedsUpdate(t,e){this.resolvedProperty[this.propertyIndex]=t[e],this.targetObject.needsUpdate=!0}_setValue_arrayElement_setMatrixWorldNeedsUpdate(t,e){this.resolvedProperty[this.propertyIndex]=t[e],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_fromArray(t,e){this.resolvedProperty.fromArray(t,e)}_setValue_fromArray_setNeedsUpdate(t,e){this.resolvedProperty.fromArray(t,e),this.targetObject.needsUpdate=!0}_setValue_fromArray_setMatrixWorldNeedsUpdate(t,e){this.resolvedProperty.fromArray(t,e),this.targetObject.matrixWorldNeedsUpdate=!0}_getValue_unbound(t,e){this.bind(),this.getValue(t,e)}_setValue_unbound(t,e){this.bind(),this.setValue(t,e)}bind(){let t=this.node,e=this.parsedPath,i=e.objectName,s=e.propertyName,r=e.propertyIndex;if(t||(t=n.findNode(this.rootNode,e.nodeName),this.node=t),this.getValue=this._getValue_unavailable,this.setValue=this._setValue_unavailable,!t){console.warn("THREE.PropertyBinding: No target node found for track: "+this.path+".");return}if(i){let c=e.objectIndex;switch(i){case"materials":if(!t.material){console.error("THREE.PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!t.material.materials){console.error("THREE.PropertyBinding: Can not bind to material.materials as node.material does not have a materials array.",this);return}t=t.material.materials;break;case"bones":if(!t.skeleton){console.error("THREE.PropertyBinding: Can not bind to bones as node does not have a skeleton.",this);return}t=t.skeleton.bones;for(let h=0;h<t.length;h++)if(t[h].name===c){c=h;break}break;case"map":if("map"in t){t=t.map;break}if(!t.material){console.error("THREE.PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!t.material.map){console.error("THREE.PropertyBinding: Can not bind to material.map as node.material does not have a map.",this);return}t=t.material.map;break;default:if(t[i]===void 0){console.error("THREE.PropertyBinding: Can not bind to objectName of node undefined.",this);return}t=t[i]}if(c!==void 0){if(t[c]===void 0){console.error("THREE.PropertyBinding: Trying to bind to objectIndex of objectName, but is undefined.",this,t);return}t=t[c]}}let o=t[s];if(o===void 0){let c=e.nodeName;console.error("THREE.PropertyBinding: Trying to update property for track: "+c+"."+s+" but it wasn't found.",t);return}let a=this.Versioning.None;this.targetObject=t,t.needsUpdate!==void 0?a=this.Versioning.NeedsUpdate:t.matrixWorldNeedsUpdate!==void 0&&(a=this.Versioning.MatrixWorldNeedsUpdate);let l=this.BindingType.Direct;if(r!==void 0){if(s==="morphTargetInfluences"){if(!t.geometry){console.error("THREE.PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.",this);return}if(!t.geometry.morphAttributes){console.error("THREE.PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.morphAttributes.",this);return}t.morphTargetDictionary[r]!==void 0&&(r=t.morphTargetDictionary[r])}l=this.BindingType.ArrayElement,this.resolvedProperty=o,this.propertyIndex=r}else o.fromArray!==void 0&&o.toArray!==void 0?(l=this.BindingType.HasFromToArray,this.resolvedProperty=o):Array.isArray(o)?(l=this.BindingType.EntireArray,this.resolvedProperty=o):this.propertyName=s;this.getValue=this.GetterByBindingType[l],this.setValue=this.SetterByBindingTypeAndVersioning[l][a]}unbind(){this.node=null,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}};Ie.Composite=Nu;Ie.prototype.BindingType={Direct:0,EntireArray:1,ArrayElement:2,HasFromToArray:3};Ie.prototype.Versioning={None:0,NeedsUpdate:1,MatrixWorldNeedsUpdate:2};Ie.prototype.GetterByBindingType=[Ie.prototype._getValue_direct,Ie.prototype._getValue_array,Ie.prototype._getValue_arrayElement,Ie.prototype._getValue_toArray];Ie.prototype.SetterByBindingTypeAndVersioning=[[Ie.prototype._setValue_direct,Ie.prototype._setValue_direct_setNeedsUpdate,Ie.prototype._setValue_direct_setMatrixWorldNeedsUpdate],[Ie.prototype._setValue_array,Ie.prototype._setValue_array_setNeedsUpdate,Ie.prototype._setValue_array_setMatrixWorldNeedsUpdate],[Ie.prototype._setValue_arrayElement,Ie.prototype._setValue_arrayElement_setNeedsUpdate,Ie.prototype._setValue_arrayElement_setMatrixWorldNeedsUpdate],[Ie.prototype._setValue_fromArray,Ie.prototype._setValue_fromArray_setNeedsUpdate,Ie.prototype._setValue_fromArray_setMatrixWorldNeedsUpdate]];var WE=new Float32Array(1);var Lp=new be,Fl=class{constructor(t,e,i=0,s=1/0){this.ray=new Gs(t,e),this.near=i,this.far=s,this.camera=null,this.layers=new Io,this.params={Mesh:{},Line:{threshold:1},LOD:{},Points:{threshold:1},Sprite:{}}}set(t,e){this.ray.set(t,e)}setFromCamera(t,e){e.isPerspectiveCamera?(this.ray.origin.setFromMatrixPosition(e.matrixWorld),this.ray.direction.set(t.x,t.y,.5).unproject(e).sub(this.ray.origin).normalize(),this.camera=e):e.isOrthographicCamera?(this.ray.origin.set(t.x,t.y,(e.near+e.far)/(e.near-e.far)).unproject(e),this.ray.direction.set(0,0,-1).transformDirection(e.matrixWorld),this.camera=e):console.error("THREE.Raycaster: Unsupported camera type: "+e.type)}setFromXRController(t){return Lp.identity().extractRotation(t.matrixWorld),this.ray.origin.setFromMatrixPosition(t.matrixWorld),this.ray.direction.set(0,0,-1).applyMatrix4(Lp),this}intersectObject(t,e=!0,i=[]){return Ou(t,this,i,e),i.sort(Up),i}intersectObjects(t,e=!0,i=[]){for(let s=0,r=t.length;s<r;s++)Ou(t[s],this,i,e);return i.sort(Up),i}};function Up(n,t){return n.distance-t.distance}function Ou(n,t,e,i){let s=!0;if(n.layers.test(t.layers)&&n.raycast(t,e)===!1&&(s=!1),s===!0&&i===!0){let r=n.children;for(let o=0,a=r.length;o<a;o++)Ou(r[o],t,e,!0)}}var Oi=class{constructor(t=1,e=0,i=0){return this.radius=t,this.phi=e,this.theta=i,this}set(t,e,i){return this.radius=t,this.phi=e,this.theta=i,this}copy(t){return this.radius=t.radius,this.phi=t.phi,this.theta=t.theta,this}makeSafe(){return this.phi=Math.max(1e-6,Math.min(Math.PI-1e-6,this.phi)),this}setFromVector3(t){return this.setFromCartesianCoords(t.x,t.y,t.z)}setFromCartesianCoords(t,e,i){return this.radius=Math.sqrt(t*t+e*e+i*i),this.radius===0?(this.theta=0,this.phi=0):(this.theta=Math.atan2(t,i),this.phi=Math.acos(Ke(e/this.radius,-1,1))),this}clone(){return new this.constructor().copy(this)}};var Bl=class extends Ui{constructor(t,e=null){super(),this.object=t,this.domElement=e,this.enabled=!0,this.state=-1,this.keys={},this.mouseButtons={LEFT:null,MIDDLE:null,RIGHT:null},this.touches={ONE:null,TWO:null}}connect(){}disconnect(){}dispose(){}update(){}};typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:Fu}}));typeof window<"u"&&(window.__THREE__?console.warn("WARNING: Multiple instances of Three.js being imported."):window.__THREE__=Fu);function om({props:n,group:t,box:e,label:i,rod:s,screw:r,interactive:o,M:a,cassette:l,disposeGroup:c}){let h=t(n,10.1,.17,-.8),u=[],d=[],f=8;h.scale.setScalar(.64),h.rotation.y=-.28;let m={activeDrawer:null,pages:Object.fromEntries(Ki.map(F=>[F,0])),selectedTape:null,removeArmed:null},_=[],g=null;for(let F of[-2.94,2.94])e(h,.16,6.9,3.2,F,3.48,0,a.cream,.04);e(h,5.9,6.9,.13,0,3.48,-1.55,a.metal,.02),e(h,6.04,.18,3.2,0,6.97,0,a.cream),e(h,6.04,.22,3.2,0,.18,0,a.dark);for(let F of[-2.6,2.6])for(let X of[-1.2,1.2])e(h,.35,.18,.35,F,.09,X,a.rubber);let p=i(h,"CASSETTE ARCHIVE / 06",5.2,.26,0,6.63,1.62,{mono:!0,res:512});o(p,"cabinet");let S=i(h,"ARCHIVE 000",3.2,.17,-.65,.57,1.63,{mono:!0,res:512}),M=e(h,1.25,.4,.09,2.13,.57,1.64,a.orange);o(M,"archiveImport"),i(M,"+ AUDIO",1.07,.17,0,0,.06,{mono:!0,res:256});for(let F=0;F<6;F++){let X=Ki[F],z=5.73-F*.88,J=t(h,0,z,0);e(h,5.76,.075,3.04,0,z-.18,0,a.metal,0);for(let Xt of[-2.78,2.78])e(h,.06,.11,2.85,Xt,z-.03,0,a.dark,0),e(J,.06,.09,2.7,Xt,0,0,a.chrome,0),e(h,.1,.2,.15,Xt,z,1.3,a.orange);e(J,5.48,.085,2.85,0,0,0,a.dark,.015);for(let Xt of[-2.7,2.7])e(J,.07,.55,2.8,Xt,.27,0,a.metal,0);e(J,5.45,.5,.08,0,.25,-1.38,a.metal,0);let k=e(J,5.68,.77,.12,0,.22,1.46,a.cream,.03);o(k,"drawer",X);let rt=t(J,0,.28,1.59);for(let Xt of[-.8,.8])e(rt,.07,.14,.18,Xt,0,0,a.metal);s(rt,[-.8,0,.12],[.8,0,.12],.045,a.chrome),o(rt,"drawer",X),i(J,X,.5,.18,-2.35,.38,1.535,{mono:!0,color:"#a54c28",res:128});let ct=i(J,"EMPTY / 000",2.3,.17,-1.15,.06,1.535,{mono:!0,res:512});o(ct,"drawer",X);let mt=i(J,"01 / 12",.88,.13,1.93,.32,1.535,{mono:!0,res:256});for(let[Xt,Z]of[[-1,1.55],[1,2.37]]){let st=e(J,.36,.26,.11,Z,.04,1.59,a.dark);o(st,"archivePage",{id:X,direction:Xt}),i(st,Xt<0?"\u2039":"\u203A",.27,.17,0,0,.063,{color:"#eee9d7",res:128})}for(let Xt of[-1.32,0,1.32])e(J,.025,.18,2.55,Xt,.12,-.01,a.metal,0);for(let Xt of[-2.65,2.65])r(J,Xt,.49,1.535,.035);let kt=t(J);u.push({id:X,carrier:J,contents:kt,handle:rt,indexLabel:ct,pageLabel:mt,open:0,target:0,y:z})}let x=e(h,5.45,.28,.08,0,.95,1.63,a.dark);o(x,"archiveService"),i(x,"SERVICE / REMOVE SELECTED",4.9,.15,0,0,.051,{mono:!0,color:"#ddc3a0",res:512}),i(h,"TAP SELECT / TAP AGAIN LOAD",4.8,.12,0,6.36,1.62,{mono:!0,res:512});function L(F){let X=u.find(J=>J.id===F.cabinetSlot.drawer)||u[0],z=F.cabinetSlot.index%f;return{d:X,point:new w((z%4-1.5)*1.32,.18,-.78+Math.floor(z/4)*1.24)}}function R(F){for(let X of[...F.contents.children])F.contents.remove(X),c(X),X.clear()}function C(F){R(F);let X=m.pages[F.id]||0;F.pageLabel.userData.setText(`${String(X+1).padStart(2,"0")} / 12`);let z=_.filter(k=>k.cabinetSlot.drawer===F.id),J=z.filter(k=>Math.floor(k.cabinetSlot.index/f)===X);if(F.indexLabel.userData.setText((J[0]?.album||z[0]?.album||"EMPTY").slice(0,22)+" / "+z.length),F.target!==0)for(let k of J){let rt=_.indexOf(k),{point:ct}=L(k),mt=d[rt];if(mt.position.copy(ct),mt.visible=k.id!==g,k.id===g){let Z=i(F.contents,"IN MACHINE",1.16,.2,ct.x,.11,ct.z,{mono:!0,res:256,color:"#a4522b"});Z.rotation.x=-Math.PI/2;continue}let kt=l(mt,k.title,k.labelStyle||"#c9b779",.34);kt.rotation.x=-Math.PI/2;let Xt=i(kt,k.title.slice(0,24),3,.23,0,.9,.22,{mono:!0,res:256});if(mt.userData.action={kind:"track",value:rt},mt.userData.lift=k.id===m.selectedTape?.17:0,k.cover){let Z=new Ll().load(k.cover,()=>{kt.parent||Z.dispose()});Z.colorSpace=Ve;let st=new Ft(new ni(.5,.5),new Je({map:Z}));st.position.set(-1.18,.5,.24),kt.add(st)}F.contents.add(mt)}}function D(F,X){for(let z of u)R(z);for(let z of d)z.parent&&z.parent.remove(z);d.length=0,_=F,g=X,_.forEach(z=>{let{d:J,point:k}=L(z),rt=t(J.contents);rt.position.copy(k),rt.visible=z.id!==g,d.push(rt)});for(let z of u)C(z);S.userData.setText("ARCHIVE "+String(_.length).padStart(3,"0"))}function b(F,X){m.activeDrawer=X?F:null;for(let z of u)z.target=X&&z.id===F?2.5:0,z.target&&C(z)}function y(F=g){g=F;for(let X of u)C(X)}function I(F,X,z){h.position.z=vt.damp(h.position.z,z?-4:-.8,4,F);let J=!1;for(let k of u){let rt=k.carrier.position.z;k.open=vt.damp(k.open,k.target,8,F),k.carrier.position.z=k.open,k.handle.position.z=1.59+(Math.abs(k.open-k.target)>.05?.04:0),!k.target&&k.open<.015&&k.contents.children.some(ct=>ct.children.length)&&R(k);for(let ct of k.contents.children)ct.userData.lift!==void 0&&(ct.position.y=vt.damp(ct.position.y,.18+ct.userData.lift,15,F));J||(J=Math.abs(rt-k.open)>1e-4)}return J}function Y(F){let{d:X,point:z}=L(_[F]);return X.carrier.updateWorldMatrix(!0,!1),X.carrier.localToWorld(z)}function V(F){let X=_[F];m.pages[X.cabinetSlot.drawer]=Math.floor(X.cabinetSlot.index/f),b(X.cabinetSlot.drawer,!0)}return{root:h,drawers:u,anchors:d,state:m,rebuild:D,refresh:y,setOpen:b,tick:I,position:Y,reveal:V,service:x,count:S,locate:L,pageSize:f}}var y1=[{id:"studio",model:"C\u201482",name:"STUDIO SILVER",detail:"BRUSHED ALLOY / 1982",scale:[1,1,1],antenna:.98,handle:1,colors:{silver:"#b6bcb8",edge:"#d1d4cf",dark:"#303735",cream:"#e4e0d2",orange:"#bc582c",metal:"#8c9590"},roughness:.42,metalness:.35},{id:"field",model:"F\u201486",name:"FIELD EDITION",detail:"WARM IVORY / 1986",scale:[1.055,.965,1.06],antenna:.77,handle:.85,colors:{silver:"#c9bfa8",edge:"#e1d4b8",dark:"#4e574e",cream:"#f2e7cd",orange:"#a84725",metal:"#a6a394"},roughness:.64,metalness:.14},{id:"night",model:"N\u201490",name:"NIGHT SESSION",detail:"GRAPHITE / 1990",scale:[.975,1.035,.99],antenna:.86,handle:1.08,colors:{silver:"#48504e",edge:"#6b7470",dark:"#1a2325",cream:"#afb7ad",orange:"#bf8146",metal:"#89948e"},roughness:.35,metalness:.48},{id:"coral",model:"P\u201484",name:"SUNSET POP",detail:"CORAL / ENAMEL / 1984",scale:[1.035,.965,1.02],antenna:.75,handle:.91,colors:{silver:"#bd6958",edge:"#f0bf98",dark:"#493c39",cream:"#f5ddbb",orange:"#eaa958",metal:"#9e7e6b"},roughness:.46,metalness:.18},{id:"lagoon",model:"B\u201487",name:"LAGOON BLUE",detail:"OCEAN BLUE / 1987",scale:[.975,1.025,1],antenna:.94,handle:1.04,stripes:1,colors:{silver:"#547f90",edge:"#a6c4c9",dark:"#273d49",cream:"#d9e6d9",orange:"#d5a467",metal:"#91a6aa"},roughness:.38,metalness:.34},{id:"olive",model:"F\u201488",name:"TRAIL RADIO",detail:"OLIVE / UTILITY / 1988",scale:[1.06,.95,1.075],antenna:.67,handle:.86,colors:{silver:"#707a50",edge:"#b4b18a",dark:"#303b30",cream:"#d7cfaa",orange:"#d19952",metal:"#8f9780"},roughness:.82,metalness:.08},{id:"walnut",model:"W\u201479",name:"WALNUT CLUB",detail:"TIMBER / CHAMPAGNE / 1979",scale:[1.045,.985,1.06],antenna:.78,handle:.93,wood:1,colors:{silver:"#b5a387",edge:"#dac39a",dark:"#382e29",cream:"#eee0bf",orange:"#b27543",metal:"#b7a483"},roughness:.55,metalness:.37},{id:"metro",model:"M\u201491",name:"METRO CHROME",detail:"INK / CHROME / 1991",scale:[1.075,.925,.97],antenna:.66,handle:.88,stripes:1,colors:{silver:"#343d46",edge:"#b9c6cb",dark:"#151e29",cream:"#d1dadd",orange:"#be594a",metal:"#aabcc3"},roughness:.23,metalness:.67},{id:"polar",model:"A\u201493",name:"POLAR STUDIO",detail:"PORCELAIN / MINIMAL / 1993",scale:[.965,1.045,.975],antenna:.9,handle:1.03,stripes:.7,colors:{silver:"#e2e1d6",edge:"#f1efe4",dark:"#677778",cream:"#f1e9d5",orange:"#709b93",metal:"#bac6c3"},roughness:.66,metalness:.12},{id:"timber",model:"T\u201476",name:"TIMBER HOUSE",detail:"FULL WOOD CABINET / 1976",scale:[1.055,.975,1.06],antenna:.8,handle:.93,wood:1,caseWood:1,colors:{silver:"#9b704a",edge:"#d3b88b",dark:"#382b24",cream:"#e9d3a9",orange:"#ad6a37",metal:"#b59a76"},roughness:.8,metalness:.08},{id:"orbit",model:"R\u201401",name:"ORBIT TOMORROW",detail:"RETRO FUTURE / CHROME + CYAN",scale:[1.075,.955,1.035],antenna:.67,handle:.89,future:1,stripes:.45,colors:{silver:"#c7d9d6",edge:"#e5e8d9",dark:"#293d48",cream:"#f0e8cf",orange:"#d67749",metal:"#abc8cc"},roughness:.26,metalness:.5},{id:"mono",model:"B\u201402",name:"BLACK / WHITE",detail:"MONOCHROME / SATIN ENAMEL",scale:[1,.98,1.015],antenna:.88,handle:1,stripes:1,colors:{silver:"#eceeea",edge:"#fafaf5",dark:"#141719",cream:"#e7e9e5",orange:"#2b3032",metal:"#969e9e"},roughness:.48,metalness:.19}],tr=[{title:"THE ORIGINALS",year:"1982\u20141990",styles:["studio","field","night"]},{title:"COLOUR STUDIES",year:"1984\u20141988",styles:["coral","lagoon","olive"]},{title:"MATERIAL CULTURE",year:"1979\u20141993",styles:["walnut","metro","polar"]},{title:"FORM & FANTASY",year:"SPECIAL EDITIONS",styles:["timber","orbit","mono"]}];function Gl(n){let t=y1.find(e=>e.id===n);if(!t)throw Error("Unknown machine style");return t}var Wl={left:{target:[-4.65,4.5,1.3],offset:[-3.2,2,10.7],width:7.4},center:{target:[0,4.05,1.35],offset:[.7,1.1,10.7],width:6.5},right:{target:[4.65,4.8,1.3],offset:[3.2,2.2,10.7],width:7.3},top:{target:[0,7.25,.15],offset:[4.5,9.7,10.9],width:15.6},back:{target:[0,4,-1.4],offset:[-4,3.1,-16.6],width:15.2},vu:{target:[0,6.2,1.45],offset:[.6,1.05,8.5],width:5.6},tape:{target:[0,3.65,1.25],offset:[.6,1,9.3],width:5.9},eq:{target:[4.63,6.25,1.42],offset:[2,2.1,8.6],width:5.5}};function am(n,t,e,i){if(!Number.isFinite(n)||n<=0||!Number.isFinite(e)||e<=0)throw Error("Invalid focus geometry");return Math.max(i,n/(2*Math.tan(t*Math.PI/360)*e)*1.12)}var sd=.27,M1=.585,cm=.15;function rd(n){let t=Math.max(0,Math.min(1,n)),e=M1**2-sd**2;return[Math.sqrt(sd**2+(1-t)*e),Math.sqrt(sd**2+t*e)]}function lm(n,t,e,i,s,r){let o=i-n,a=s-t,l=Math.hypot(o,a),c=(e-.095)/l,h=Math.sqrt(1-c*c),u=o/l,d=a/l,m=[[u*c-d*h,d*c+u*h],[u*c+d*h,d*c-u*h]].sort((_,g)=>r*(g[0]-_[0]))[0];return{n:m,pack:[n+(e+.004)*m[0],t+(e+.004)*m[1]],guide:[i+.099*m[0],s+.099*m[1]]}}function E1(n){let t=rd(n),e=lm(-.84,-.1,t[0],-1.27,-.7,-1),i=lm(.84,-.1,t[1],1.27,-.7,1),s=[],r=(l,c)=>s.push(new w(l,c,cm));r(...e.pack);let o=Math.atan2(e.n[1],e.n[0]),a=-Math.PI/2;for(;a<o;)a+=Math.PI*2;for(let l=0;l<=24;l++){let c=o+(a-o)*l/24;r(-1.27+.099*Math.cos(c),-.7+.099*Math.sin(c))}for(o=-Math.PI/2,a=Math.atan2(i.n[1],i.n[0]);a<o;)a+=Math.PI*2;for(let l=0;l<=24;l++){let c=o+(a-o)*l/24;r(1.27+.099*Math.cos(c),-.7+.099*Math.sin(c))}return r(...i.pack),{points:s,radii:t}}function od(n,t){let{points:e,radii:i}=E1(t),s=e.length,r=n.getAttribute("position");if(!r){r=new en(new Float32Array(s*4*3),3),n.setAttribute("position",r);let o=[];for(let a=0;a<s-1;a++)for(let l=0;l<4;l++){let c=a*4+l,h=a*4+(l+1)%4,u=h+4,d=c+4;o.push(c,h,u,c,u,d)}o.push(0,2,1,0,3,2,(s-1)*4,(s-1)*4+1,(s-1)*4+2,(s-1)*4,(s-1)*4+2,(s-1)*4+3);for(let a=0;a<o.length;a+=3)[o[a+1],o[a+2]]=[o[a+2],o[a+1]];n.setIndex(o)}for(let o=0;o<s;o++){let a=e[Math.max(0,o-1)],l=e[Math.min(s-1,o+1)],c=l.x-a.x,h=l.y-a.y,u=Math.hypot(c,h),d=-h/u*.004,f=c/u*.004;for(let m=0;m<4;m++){let _=m<2?-1:1;r.setXYZ(o*4+m,e[o].x+d*_,e[o].y+f*_,cm+([0,3].includes(m)?-.04:.04))}}return r.needsUpdate=!0,n.computeVertexNormals(),n.computeBoundingSphere(),i}var Xl=[[-6.68,-2.7],[6.68,-2.7],[-6.68,2.66],[6.68,2.66]],ad={x:-2.48,faceY:6.9,faceZ:1.575,footZ:3.25,footY:.23,capRadius:.05,railSpacing:.58,rungCount:21};function hm(n=[1,1,1],t=0,e=0){let i=ad,s=[i.x*n[0],i.faceY*n[1]+t,(i.faceZ+e)*n[2]+i.capRadius],r=s[1]-i.footY,o=i.footZ-s[2];return{base:[s[0],i.footY,i.footZ],target:s,length:Math.hypot(r,o),angle:-Math.atan2(o,r)}}var Zr={left:[-4.55,.17,2.95],observer:[-7.35,.17,5.1],bench:[-5.2,0,5.94],benchSitter:[0,.31,.24],crateSitter:[0,.23,.18]},Ln={rung:9,rungY:.18+9*.32,rootZ:.19,treadHeight:.04,treadY:.18+9*.32+.015,gripY:.18+10*.32};Ln.rootY=Ln.treadY+Ln.treadHeight/2+.003;function um(n,t,e,i){let{group:s,box:r,rod:o,ball:a}=t,{cloth:l,pants:c,skin:h,dark:u}=e,d=i==="sit",f=i==="climb",m=s(n,0,.28,0);r(m,.16,.23,.105,0,.075,0,l,.045);let _=s(m,0,.22,0);a(_,.079,0,.052,0,h);let g=a(_,.079,0,.078,-.01,u);g.scale.y=.56;let p=[],S=[],M=[],x=[];for(let L of[-1,1]){let R=s(m,L*.105,.15,0),C=f?[L*.025,-.09,.09]:[L*.026,-.145,0],D=f?[L*.055,Ln.gripY-Ln.rootY-.43,Ln.rootZ]:[L*.026,-.22,.03];o(R,[0,0,0],C,.026,l),o(R,C,D,.022,h),x.push(a(R,.027,...D,h)),p.push(R);let b=s(n,L*.052,d?.27:.25,0),y=d?[0,0,.13]:f?[0,-.105,.12]:[0,-.215,.015];o(b,[0,0,0],y,.028,c),(d||f)&&o(b,y,[0,d?-.235:-.21,d?.15:.17],.026,c),M.push(r(b,.069,.04,f?.14:.12,0,d?-.25:-.23,f?Ln.rootZ:d?.18:.045,u,.01)),S.push(b)}return{body:m,head:_,arms:p,legs:S,shoes:M,hands:x}}function ld(n,t,e,i,s,r,o,a){let l=Math.min(.08,Math.max(0,i));for(;l>0;){let c=Math.min(l,.008333333333333333);t+=(s*(e-n)-r*t)*c,n+=t*c,n<o&&(n=o,t=Math.max(0,t)),n>a&&(n=a,t=Math.min(0,t)),l-=c}return{position:n,velocity:t}}function dm(n,t,e,i){let s=e.x-t.x,r=e.y-t.y,o=s*s+r*r;if(o<1)return 0;let a=((n.x-t.x)*s+(n.y-t.y)*r)/o;return Math.round(Math.max(0,Math.min(1,a))*(i-1))}function fm(n,t,e=!1){let i=e?1.24:1,s=Math.max(28,(t.maxX-t.minX)/2)*i,r=Math.max(30,(t.maxY-t.minY)/2)*i;return((n.x-(t.minX+t.maxX)/2)/s)**2+((n.y-(t.minY+t.maxY)/2)/r)**2<=1}function pm(n){return n.length<2?[...n]:[n[1],...n.slice(2),n[0]]}var Yl=.042,cd=.024,Bi=.17;function mm(n){let t=n.createGain();t.gain.value=.15,t.connect(n.destination);let e=[],i=n.createBuffer(1,Math.ceil(n.sampleRate*.6),n.sampleRate),s=i.getChannelData(0),r=8571646;for(let c=0;c<s.length;c++)r^=r<<13,r^=r>>>17,r^=r<<5,s[c]=(r>>>0)/4294967295*2-1;function o(c,h,u,d=1800,f=.7){let m=n.createBufferSource(),_=n.createBiquadFilter(),g=n.createGain();m.buffer=i,_.type="bandpass",_.frequency.value=d,_.Q.value=f,g.gain.setValueAtTime(1e-5,c),g.gain.exponentialRampToValueAtTime(Math.max(.001,u),c+.003),g.gain.exponentialRampToValueAtTime(1e-5,c+h),m.connect(_).connect(g).connect(t),m.start(c),m.stop(c+h+.01),m.onended=()=>{m.disconnect(),_.disconnect(),g.disconnect()}}function a(c,h,u,d=.055){let f=n.createOscillator(),m=n.createGain();f.type="triangle",f.frequency.setValueAtTime(h,c),f.frequency.exponentialRampToValueAtTime(h*.44,c+d),m.gain.setValueAtTime(u,c),m.gain.exponentialRampToValueAtTime(1e-5,c+d),f.connect(m).connect(t),f.start(c),f.stop(c+d+.01),f.onended=()=>{f.disconnect(),m.disconnect()}}function l(c,h=1){o(c,.026,.46*h,2300,1.2),a(c+.003,230,.32*h,.045)}return{setVolume(c){t.gain.setTargetAtTime(Math.min(.22,Math.max(0,c)*.2),n.currentTime,.02)},play(c){if(n.state!=="running")return;let h=n.currentTime+.006;if(e.push({kind:c,at:h}),e.length>32&&e.shift(),c==="paper")o(h,.37,.2,2400,.4),o(h+.13,.25,.09,4100,.3);else if(c==="key")l(h,.42);else if(c==="detent")o(h,.012,.065,3e3,1.4);else if(c==="door-open")l(h,.75),a(h+.04,155,.2,.17),o(h+.06,.36,.1,800,.6);else if(c==="door-close")o(h,.24,.085,650,.7),l(h+.3,.8),a(h+.305,115,.25,.08);else if(c==="tape-in")o(h,.29,.18,1100,.6),l(h+.28,.6),l(h+.34,.25);else if(c==="tape-out")l(h,.55),o(h+.05,.27,.13,1200,.8),a(h+.24,340,.1,.05);else if(c==="service-open"){for(let u=0;u<4;u++)o(h+u*.055,.03,.1,1600+u*150,1);a(h+.25,120,.14,.08)}else c==="service-close"&&(l(h,.35),l(h+.09,.45),a(h+.15,140,.18,.07))},get events(){return e.map(c=>({...c}))}}}var Zl=["mp3","mpga","wav","wave","ogg","oga","opus","aac","m4a","m4b","mp4","flac","webm","weba","aif","aiff","aifc","au","snd"],gm="audio/*,"+Zl.map(n=>"."+n).join(",");function _m(n){return/^audio\//i.test(n.type)||Zl.includes(n.name.split(".").pop().toLowerCase())}var ql=(n,t,e)=>String.fromCharCode(...new Uint8Array(n.buffer,n.byteOffset+t,e));function hn(n="UNSUPPORTED AUDIO CODEC"){throw new Error(n)}function b1(n,t,e,i,s=!1){if(s)return e===32?n.getFloat32(t,i):n.getFloat64(t,i);if(e===8)return n.getInt8(t)/128;if(e===16)return n.getInt16(t,i)/32768;if(e===24){let r=i?n.getUint8(t)|n.getUint8(t+1)<<8|n.getUint8(t+2)<<16:n.getUint8(t)<<16|n.getUint8(t+1)<<8|n.getUint8(t+2);return r&8388608&&(r-=16777216),r/8388608}if(e===32)return n.getInt32(t,i)/2147483648;hn()}function S1(n,t){if(t){n^=85;let i=(n&15)<<4,s=(n&112)>>4;return i+=s===0?8:264,s>1&&(i<<=s-1),(n&128?i:-i)/32768}n=~n&255;let e=((n&15)<<3)+132<<((n&112)>>4);return(n&128?132-e:e-132)/32768}function T1(n){n.byteLength<24&&hn("DAMAGED AUDIO FILE");let t=new DataView(n),e=ql(t,0,4),i,s,r,o,a,l,c=!1,h=!1,u=null;if(e==="FORM"){let p=ql(t,8,4);["AIFF","AIFC"].includes(p)||hn();let S="NONE",M=!1,x=!1;for(let L=12;L+8<=t.byteLength;){let R=ql(t,L,4),C=t.getUint32(L+4),D=L+8,b=D+C;if(b>t.byteLength&&hn("TRUNCATED AUDIO FILE"),R==="COMM"){C<18&&hn("DAMAGED AIFF HEADER"),i=t.getUint16(D),r=t.getUint32(D+2),l=t.getUint16(D+6);let y=t.getUint16(D+8);s=(t.getUint32(D+10)*4294967296+t.getUint32(D+14))*Math.pow(2,(y&32767)-16383-63)*(y&32768?-1:1),p==="AIFC"&&(C<22&&hn(),S=ql(t,D+18,4)),M=!0}if(R==="SSND"){C<8&&hn();let y=t.getUint32(D);o=D+8+y,a=C-8-y,a<0&&hn(),x=!0}L=b+(C&1)}(!M||!x)&&hn("INCOMPLETE AIFF FILE"),c=S==="sowt",h=["fl32","FL32","fl64","FL64"].includes(S),u=["ulaw","ULAW","alaw","ALAW"].includes(S)?S.toLowerCase():null,["NONE","twos","sowt","fl32","FL32","fl64","FL64","ulaw","ULAW","alaw","ALAW"].includes(S)||hn("AIFC COMPRESSION NOT SUPPORTED"),h&&(l=/32/.test(S)?32:64),u&&(l=8)}else if(e===".snd"){o=t.getUint32(4),a=t.getUint32(8);let p=t.getUint32(12);s=t.getUint32(16),i=t.getUint32(20),l={1:8,2:8,3:16,4:24,5:32,6:32,7:64,27:8}[p],l||hn("AU COMPRESSION NOT SUPPORTED"),h=p===6||p===7,u=p===1?"ulaw":p===27?"alaw":null,(o<24||o>t.byteLength)&&hn("DAMAGED AU HEADER"),a===4294967295&&(a=t.byteLength-o),r=Math.floor(a/(i*(l/8)))}else hn("UNRECOGNIZED AUDIO FILE");s=Math.round(s),(!Number.isInteger(i)||i<1||i>8||!Number.isFinite(s)||s<1e3||s>384e3||!Number.isInteger(r)||r<1||!([8,16,24,32].includes(l)||h&&l===64))&&hn("INVALID AUDIO PARAMETERS");let d=l/8,f=r*i;(o+f*d>t.byteLength||f*d>a)&&hn("TRUNCATED AUDIO FILE"),f*2>512*1024*1024&&hn("AUDIO FILE TOO LARGE");let m=new ArrayBuffer(44+f*2),_=new DataView(m),g=(p,S)=>{for(let M=0;M<S.length;M++)_.setUint8(p+M,S.charCodeAt(M))};g(0,"RIFF"),_.setUint32(4,m.byteLength-8,!0),g(8,"WAVEfmt "),_.setUint32(16,16,!0),_.setUint16(20,1,!0),_.setUint16(22,i,!0),_.setUint32(24,s,!0),_.setUint32(28,s*i*2,!0),_.setUint16(32,i*2,!0),_.setUint16(34,16,!0),g(36,"data"),_.setUint32(40,f*2,!0);for(let p=0;p<f;p++){let S=u?S1(t.getUint8(o+p),u==="alaw"):b1(t,o+p*d,l,c,h);S=Number.isFinite(S)?Math.max(-1,Math.min(1,S)):0,_.setInt16(44+p*2,Math.round(S*(S<0?32768:32767)),!0)}return{buffer:m,duration:r/s,channels:i,sampleRate:s}}async function xm(n){let t=n.name.split(".").pop().toLowerCase();if(["aif","aiff","aifc","au","snd"].includes(t)){let i=T1(await n.arrayBuffer());return{...i,blob:new Blob([i.buffer],{type:"audio/wav"}),converted:!0}}let e={mpga:"audio/mpeg",wave:"audio/wav",oga:"audio/ogg",opus:"audio/ogg",m4b:"audio/mp4",mp4:"audio/mp4",weba:"audio/webm"}[t];return{blob:e?new Blob([n],{type:e}):n,converted:!1,duration:0}}var vm={type:"change"},ud={type:"start"},Mm={type:"end"},Kl=new Gs,ym=new In,w1=Math.cos(70*vt.DEG2RAD),Xe=new w,Sn=2*Math.PI,Se={NONE:-1,ROTATE:0,DOLLY:1,PAN:2,TOUCH_ROTATE:3,TOUCH_PAN:4,TOUCH_DOLLY_PAN:5,TOUCH_DOLLY_ROTATE:6},hd=1e-6,$l=class extends Bl{constructor(t,e=null){super(t,e),this.state=Se.NONE,this.enabled=!0,this.target=new w,this.cursor=new w,this.minDistance=0,this.maxDistance=1/0,this.minZoom=0,this.maxZoom=1/0,this.minTargetRadius=0,this.maxTargetRadius=1/0,this.minPolarAngle=0,this.maxPolarAngle=Math.PI,this.minAzimuthAngle=-1/0,this.maxAzimuthAngle=1/0,this.enableDamping=!1,this.dampingFactor=.05,this.enableZoom=!0,this.zoomSpeed=1,this.enableRotate=!0,this.rotateSpeed=1,this.enablePan=!0,this.panSpeed=1,this.screenSpacePanning=!0,this.keyPanSpeed=7,this.zoomToCursor=!1,this.autoRotate=!1,this.autoRotateSpeed=2,this.keys={LEFT:"ArrowLeft",UP:"ArrowUp",RIGHT:"ArrowRight",BOTTOM:"ArrowDown"},this.mouseButtons={LEFT:si.ROTATE,MIDDLE:si.DOLLY,RIGHT:si.PAN},this.touches={ONE:Js.ROTATE,TWO:Js.DOLLY_PAN},this.target0=this.target.clone(),this.position0=this.object.position.clone(),this.zoom0=this.object.zoom,this._domElementKeyEvents=null,this._lastPosition=new w,this._lastQuaternion=new ei,this._lastTargetPosition=new w,this._quat=new ei().setFromUnitVectors(t.up,new w(0,1,0)),this._quatInverse=this._quat.clone().invert(),this._spherical=new Oi,this._sphericalDelta=new Oi,this._scale=1,this._panOffset=new w,this._rotateStart=new nt,this._rotateEnd=new nt,this._rotateDelta=new nt,this._panStart=new nt,this._panEnd=new nt,this._panDelta=new nt,this._dollyStart=new nt,this._dollyEnd=new nt,this._dollyDelta=new nt,this._dollyDirection=new w,this._mouse=new nt,this._performCursorZoom=!1,this._pointers=[],this._pointerPositions={},this._controlActive=!1,this._onPointerMove=R1.bind(this),this._onPointerDown=A1.bind(this),this._onPointerUp=C1.bind(this),this._onContextMenu=O1.bind(this),this._onMouseWheel=D1.bind(this),this._onKeyDown=L1.bind(this),this._onTouchStart=U1.bind(this),this._onTouchMove=N1.bind(this),this._onMouseDown=P1.bind(this),this._onMouseMove=I1.bind(this),this._interceptControlDown=F1.bind(this),this._interceptControlUp=B1.bind(this),this.domElement!==null&&this.connect(),this.update()}connect(){this.domElement.addEventListener("pointerdown",this._onPointerDown),this.domElement.addEventListener("pointercancel",this._onPointerUp),this.domElement.addEventListener("contextmenu",this._onContextMenu),this.domElement.addEventListener("wheel",this._onMouseWheel,{passive:!1}),this.domElement.getRootNode().addEventListener("keydown",this._interceptControlDown,{passive:!0,capture:!0}),this.domElement.style.touchAction="none"}disconnect(){this.domElement.removeEventListener("pointerdown",this._onPointerDown),this.domElement.removeEventListener("pointermove",this._onPointerMove),this.domElement.removeEventListener("pointerup",this._onPointerUp),this.domElement.removeEventListener("pointercancel",this._onPointerUp),this.domElement.removeEventListener("wheel",this._onMouseWheel),this.domElement.removeEventListener("contextmenu",this._onContextMenu),this.stopListenToKeyEvents(),this.domElement.getRootNode().removeEventListener("keydown",this._interceptControlDown,{capture:!0}),this.domElement.style.touchAction="auto"}dispose(){this.disconnect()}getPolarAngle(){return this._spherical.phi}getAzimuthalAngle(){return this._spherical.theta}getDistance(){return this.object.position.distanceTo(this.target)}listenToKeyEvents(t){t.addEventListener("keydown",this._onKeyDown),this._domElementKeyEvents=t}stopListenToKeyEvents(){this._domElementKeyEvents!==null&&(this._domElementKeyEvents.removeEventListener("keydown",this._onKeyDown),this._domElementKeyEvents=null)}saveState(){this.target0.copy(this.target),this.position0.copy(this.object.position),this.zoom0=this.object.zoom}reset(){this.target.copy(this.target0),this.object.position.copy(this.position0),this.object.zoom=this.zoom0,this.object.updateProjectionMatrix(),this.dispatchEvent(vm),this.update(),this.state=Se.NONE}update(t=null){let e=this.object.position;Xe.copy(e).sub(this.target),Xe.applyQuaternion(this._quat),this._spherical.setFromVector3(Xe),this.autoRotate&&this.state===Se.NONE&&this._rotateLeft(this._getAutoRotationAngle(t)),this.enableDamping?(this._spherical.theta+=this._sphericalDelta.theta*this.dampingFactor,this._spherical.phi+=this._sphericalDelta.phi*this.dampingFactor):(this._spherical.theta+=this._sphericalDelta.theta,this._spherical.phi+=this._sphericalDelta.phi);let i=this.minAzimuthAngle,s=this.maxAzimuthAngle;isFinite(i)&&isFinite(s)&&(i<-Math.PI?i+=Sn:i>Math.PI&&(i-=Sn),s<-Math.PI?s+=Sn:s>Math.PI&&(s-=Sn),i<=s?this._spherical.theta=Math.max(i,Math.min(s,this._spherical.theta)):this._spherical.theta=this._spherical.theta>(i+s)/2?Math.max(i,this._spherical.theta):Math.min(s,this._spherical.theta)),this._spherical.phi=Math.max(this.minPolarAngle,Math.min(this.maxPolarAngle,this._spherical.phi)),this._spherical.makeSafe(),this.enableDamping===!0?this.target.addScaledVector(this._panOffset,this.dampingFactor):this.target.add(this._panOffset),this.target.sub(this.cursor),this.target.clampLength(this.minTargetRadius,this.maxTargetRadius),this.target.add(this.cursor);let r=!1;if(this.zoomToCursor&&this._performCursorZoom||this.object.isOrthographicCamera)this._spherical.radius=this._clampDistance(this._spherical.radius);else{let o=this._spherical.radius;this._spherical.radius=this._clampDistance(this._spherical.radius*this._scale),r=o!=this._spherical.radius}if(Xe.setFromSpherical(this._spherical),Xe.applyQuaternion(this._quatInverse),e.copy(this.target).add(Xe),this.object.lookAt(this.target),this.enableDamping===!0?(this._sphericalDelta.theta*=1-this.dampingFactor,this._sphericalDelta.phi*=1-this.dampingFactor,this._panOffset.multiplyScalar(1-this.dampingFactor)):(this._sphericalDelta.set(0,0,0),this._panOffset.set(0,0,0)),this.zoomToCursor&&this._performCursorZoom){let o=null;if(this.object.isPerspectiveCamera){let a=Xe.length();o=this._clampDistance(a*this._scale);let l=a-o;this.object.position.addScaledVector(this._dollyDirection,l),this.object.updateMatrixWorld(),r=!!l}else if(this.object.isOrthographicCamera){let a=new w(this._mouse.x,this._mouse.y,0);a.unproject(this.object);let l=this.object.zoom;this.object.zoom=Math.max(this.minZoom,Math.min(this.maxZoom,this.object.zoom/this._scale)),this.object.updateProjectionMatrix(),r=l!==this.object.zoom;let c=new w(this._mouse.x,this._mouse.y,0);c.unproject(this.object),this.object.position.sub(c).add(a),this.object.updateMatrixWorld(),o=Xe.length()}else console.warn("WARNING: OrbitControls.js encountered an unknown camera type - zoom to cursor disabled."),this.zoomToCursor=!1;o!==null&&(this.screenSpacePanning?this.target.set(0,0,-1).transformDirection(this.object.matrix).multiplyScalar(o).add(this.object.position):(Kl.origin.copy(this.object.position),Kl.direction.set(0,0,-1).transformDirection(this.object.matrix),Math.abs(this.object.up.dot(Kl.direction))<w1?this.object.lookAt(this.target):(ym.setFromNormalAndCoplanarPoint(this.object.up,this.target),Kl.intersectPlane(ym,this.target))))}else if(this.object.isOrthographicCamera){let o=this.object.zoom;this.object.zoom=Math.max(this.minZoom,Math.min(this.maxZoom,this.object.zoom/this._scale)),o!==this.object.zoom&&(this.object.updateProjectionMatrix(),r=!0)}return this._scale=1,this._performCursorZoom=!1,r||this._lastPosition.distanceToSquared(this.object.position)>hd||8*(1-this._lastQuaternion.dot(this.object.quaternion))>hd||this._lastTargetPosition.distanceToSquared(this.target)>hd?(this.dispatchEvent(vm),this._lastPosition.copy(this.object.position),this._lastQuaternion.copy(this.object.quaternion),this._lastTargetPosition.copy(this.target),!0):!1}_getAutoRotationAngle(t){return t!==null?Sn/60*this.autoRotateSpeed*t:Sn/60/60*this.autoRotateSpeed}_getZoomScale(t){let e=Math.abs(t*.01);return Math.pow(.95,this.zoomSpeed*e)}_rotateLeft(t){this._sphericalDelta.theta-=t}_rotateUp(t){this._sphericalDelta.phi-=t}_panLeft(t,e){Xe.setFromMatrixColumn(e,0),Xe.multiplyScalar(-t),this._panOffset.add(Xe)}_panUp(t,e){this.screenSpacePanning===!0?Xe.setFromMatrixColumn(e,1):(Xe.setFromMatrixColumn(e,0),Xe.crossVectors(this.object.up,Xe)),Xe.multiplyScalar(t),this._panOffset.add(Xe)}_pan(t,e){let i=this.domElement;if(this.object.isPerspectiveCamera){let s=this.object.position;Xe.copy(s).sub(this.target);let r=Xe.length();r*=Math.tan(this.object.fov/2*Math.PI/180),this._panLeft(2*t*r/i.clientHeight,this.object.matrix),this._panUp(2*e*r/i.clientHeight,this.object.matrix)}else this.object.isOrthographicCamera?(this._panLeft(t*(this.object.right-this.object.left)/this.object.zoom/i.clientWidth,this.object.matrix),this._panUp(e*(this.object.top-this.object.bottom)/this.object.zoom/i.clientHeight,this.object.matrix)):(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - pan disabled."),this.enablePan=!1)}_dollyOut(t){this.object.isPerspectiveCamera||this.object.isOrthographicCamera?this._scale/=t:(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."),this.enableZoom=!1)}_dollyIn(t){this.object.isPerspectiveCamera||this.object.isOrthographicCamera?this._scale*=t:(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."),this.enableZoom=!1)}_updateZoomParameters(t,e){if(!this.zoomToCursor)return;this._performCursorZoom=!0;let i=this.domElement.getBoundingClientRect(),s=t-i.left,r=e-i.top,o=i.width,a=i.height;this._mouse.x=s/o*2-1,this._mouse.y=-(r/a)*2+1,this._dollyDirection.set(this._mouse.x,this._mouse.y,1).unproject(this.object).sub(this.object.position).normalize()}_clampDistance(t){return Math.max(this.minDistance,Math.min(this.maxDistance,t))}_handleMouseDownRotate(t){this._rotateStart.set(t.clientX,t.clientY)}_handleMouseDownDolly(t){this._updateZoomParameters(t.clientX,t.clientX),this._dollyStart.set(t.clientX,t.clientY)}_handleMouseDownPan(t){this._panStart.set(t.clientX,t.clientY)}_handleMouseMoveRotate(t){this._rotateEnd.set(t.clientX,t.clientY),this._rotateDelta.subVectors(this._rotateEnd,this._rotateStart).multiplyScalar(this.rotateSpeed);let e=this.domElement;this._rotateLeft(Sn*this._rotateDelta.x/e.clientHeight),this._rotateUp(Sn*this._rotateDelta.y/e.clientHeight),this._rotateStart.copy(this._rotateEnd),this.update()}_handleMouseMoveDolly(t){this._dollyEnd.set(t.clientX,t.clientY),this._dollyDelta.subVectors(this._dollyEnd,this._dollyStart),this._dollyDelta.y>0?this._dollyOut(this._getZoomScale(this._dollyDelta.y)):this._dollyDelta.y<0&&this._dollyIn(this._getZoomScale(this._dollyDelta.y)),this._dollyStart.copy(this._dollyEnd),this.update()}_handleMouseMovePan(t){this._panEnd.set(t.clientX,t.clientY),this._panDelta.subVectors(this._panEnd,this._panStart).multiplyScalar(this.panSpeed),this._pan(this._panDelta.x,this._panDelta.y),this._panStart.copy(this._panEnd),this.update()}_handleMouseWheel(t){this._updateZoomParameters(t.clientX,t.clientY),t.deltaY<0?this._dollyIn(this._getZoomScale(t.deltaY)):t.deltaY>0&&this._dollyOut(this._getZoomScale(t.deltaY)),this.update()}_handleKeyDown(t){let e=!1;switch(t.code){case this.keys.UP:t.ctrlKey||t.metaKey||t.shiftKey?this._rotateUp(Sn*this.rotateSpeed/this.domElement.clientHeight):this._pan(0,this.keyPanSpeed),e=!0;break;case this.keys.BOTTOM:t.ctrlKey||t.metaKey||t.shiftKey?this._rotateUp(-Sn*this.rotateSpeed/this.domElement.clientHeight):this._pan(0,-this.keyPanSpeed),e=!0;break;case this.keys.LEFT:t.ctrlKey||t.metaKey||t.shiftKey?this._rotateLeft(Sn*this.rotateSpeed/this.domElement.clientHeight):this._pan(this.keyPanSpeed,0),e=!0;break;case this.keys.RIGHT:t.ctrlKey||t.metaKey||t.shiftKey?this._rotateLeft(-Sn*this.rotateSpeed/this.domElement.clientHeight):this._pan(-this.keyPanSpeed,0),e=!0;break}e&&(t.preventDefault(),this.update())}_handleTouchStartRotate(t){if(this._pointers.length===1)this._rotateStart.set(t.pageX,t.pageY);else{let e=this._getSecondPointerPosition(t),i=.5*(t.pageX+e.x),s=.5*(t.pageY+e.y);this._rotateStart.set(i,s)}}_handleTouchStartPan(t){if(this._pointers.length===1)this._panStart.set(t.pageX,t.pageY);else{let e=this._getSecondPointerPosition(t),i=.5*(t.pageX+e.x),s=.5*(t.pageY+e.y);this._panStart.set(i,s)}}_handleTouchStartDolly(t){let e=this._getSecondPointerPosition(t),i=t.pageX-e.x,s=t.pageY-e.y,r=Math.sqrt(i*i+s*s);this._dollyStart.set(0,r)}_handleTouchStartDollyPan(t){this.enableZoom&&this._handleTouchStartDolly(t),this.enablePan&&this._handleTouchStartPan(t)}_handleTouchStartDollyRotate(t){this.enableZoom&&this._handleTouchStartDolly(t),this.enableRotate&&this._handleTouchStartRotate(t)}_handleTouchMoveRotate(t){if(this._pointers.length==1)this._rotateEnd.set(t.pageX,t.pageY);else{let i=this._getSecondPointerPosition(t),s=.5*(t.pageX+i.x),r=.5*(t.pageY+i.y);this._rotateEnd.set(s,r)}this._rotateDelta.subVectors(this._rotateEnd,this._rotateStart).multiplyScalar(this.rotateSpeed);let e=this.domElement;this._rotateLeft(Sn*this._rotateDelta.x/e.clientHeight),this._rotateUp(Sn*this._rotateDelta.y/e.clientHeight),this._rotateStart.copy(this._rotateEnd)}_handleTouchMovePan(t){if(this._pointers.length===1)this._panEnd.set(t.pageX,t.pageY);else{let e=this._getSecondPointerPosition(t),i=.5*(t.pageX+e.x),s=.5*(t.pageY+e.y);this._panEnd.set(i,s)}this._panDelta.subVectors(this._panEnd,this._panStart).multiplyScalar(this.panSpeed),this._pan(this._panDelta.x,this._panDelta.y),this._panStart.copy(this._panEnd)}_handleTouchMoveDolly(t){let e=this._getSecondPointerPosition(t),i=t.pageX-e.x,s=t.pageY-e.y,r=Math.sqrt(i*i+s*s);this._dollyEnd.set(0,r),this._dollyDelta.set(0,Math.pow(this._dollyEnd.y/this._dollyStart.y,this.zoomSpeed)),this._dollyOut(this._dollyDelta.y),this._dollyStart.copy(this._dollyEnd);let o=(t.pageX+e.x)*.5,a=(t.pageY+e.y)*.5;this._updateZoomParameters(o,a)}_handleTouchMoveDollyPan(t){this.enableZoom&&this._handleTouchMoveDolly(t),this.enablePan&&this._handleTouchMovePan(t)}_handleTouchMoveDollyRotate(t){this.enableZoom&&this._handleTouchMoveDolly(t),this.enableRotate&&this._handleTouchMoveRotate(t)}_addPointer(t){this._pointers.push(t.pointerId)}_removePointer(t){delete this._pointerPositions[t.pointerId];for(let e=0;e<this._pointers.length;e++)if(this._pointers[e]==t.pointerId){this._pointers.splice(e,1);return}}_isTrackingPointer(t){for(let e=0;e<this._pointers.length;e++)if(this._pointers[e]==t.pointerId)return!0;return!1}_trackPointer(t){let e=this._pointerPositions[t.pointerId];e===void 0&&(e=new nt,this._pointerPositions[t.pointerId]=e),e.set(t.pageX,t.pageY)}_getSecondPointerPosition(t){let e=t.pointerId===this._pointers[0]?this._pointers[1]:this._pointers[0];return this._pointerPositions[e]}_customWheelEvent(t){let e=t.deltaMode,i={clientX:t.clientX,clientY:t.clientY,deltaY:t.deltaY};switch(e){case 1:i.deltaY*=16;break;case 2:i.deltaY*=100;break}return t.ctrlKey&&!this._controlActive&&(i.deltaY*=10),i}};function A1(n){this.enabled!==!1&&(this._pointers.length===0&&(this.domElement.setPointerCapture(n.pointerId),this.domElement.addEventListener("pointermove",this._onPointerMove),this.domElement.addEventListener("pointerup",this._onPointerUp)),!this._isTrackingPointer(n)&&(this._addPointer(n),n.pointerType==="touch"?this._onTouchStart(n):this._onMouseDown(n)))}function R1(n){this.enabled!==!1&&(n.pointerType==="touch"?this._onTouchMove(n):this._onMouseMove(n))}function C1(n){switch(this._removePointer(n),this._pointers.length){case 0:this.domElement.releasePointerCapture(n.pointerId),this.domElement.removeEventListener("pointermove",this._onPointerMove),this.domElement.removeEventListener("pointerup",this._onPointerUp),this.dispatchEvent(Mm),this.state=Se.NONE;break;case 1:let t=this._pointers[0],e=this._pointerPositions[t];this._onTouchStart({pointerId:t,pageX:e.x,pageY:e.y});break}}function P1(n){let t;switch(n.button){case 0:t=this.mouseButtons.LEFT;break;case 1:t=this.mouseButtons.MIDDLE;break;case 2:t=this.mouseButtons.RIGHT;break;default:t=-1}switch(t){case si.DOLLY:if(this.enableZoom===!1)return;this._handleMouseDownDolly(n),this.state=Se.DOLLY;break;case si.ROTATE:if(n.ctrlKey||n.metaKey||n.shiftKey){if(this.enablePan===!1)return;this._handleMouseDownPan(n),this.state=Se.PAN}else{if(this.enableRotate===!1)return;this._handleMouseDownRotate(n),this.state=Se.ROTATE}break;case si.PAN:if(n.ctrlKey||n.metaKey||n.shiftKey){if(this.enableRotate===!1)return;this._handleMouseDownRotate(n),this.state=Se.ROTATE}else{if(this.enablePan===!1)return;this._handleMouseDownPan(n),this.state=Se.PAN}break;default:this.state=Se.NONE}this.state!==Se.NONE&&this.dispatchEvent(ud)}function I1(n){switch(this.state){case Se.ROTATE:if(this.enableRotate===!1)return;this._handleMouseMoveRotate(n);break;case Se.DOLLY:if(this.enableZoom===!1)return;this._handleMouseMoveDolly(n);break;case Se.PAN:if(this.enablePan===!1)return;this._handleMouseMovePan(n);break}}function D1(n){this.enabled===!1||this.enableZoom===!1||this.state!==Se.NONE||(n.preventDefault(),this.dispatchEvent(ud),this._handleMouseWheel(this._customWheelEvent(n)),this.dispatchEvent(Mm))}function L1(n){this.enabled===!1||this.enablePan===!1||this._handleKeyDown(n)}function U1(n){switch(this._trackPointer(n),this._pointers.length){case 1:switch(this.touches.ONE){case Js.ROTATE:if(this.enableRotate===!1)return;this._handleTouchStartRotate(n),this.state=Se.TOUCH_ROTATE;break;case Js.PAN:if(this.enablePan===!1)return;this._handleTouchStartPan(n),this.state=Se.TOUCH_PAN;break;default:this.state=Se.NONE}break;case 2:switch(this.touches.TWO){case Js.DOLLY_PAN:if(this.enableZoom===!1&&this.enablePan===!1)return;this._handleTouchStartDollyPan(n),this.state=Se.TOUCH_DOLLY_PAN;break;case Js.DOLLY_ROTATE:if(this.enableZoom===!1&&this.enableRotate===!1)return;this._handleTouchStartDollyRotate(n),this.state=Se.TOUCH_DOLLY_ROTATE;break;default:this.state=Se.NONE}break;default:this.state=Se.NONE}this.state!==Se.NONE&&this.dispatchEvent(ud)}function N1(n){switch(this._trackPointer(n),this.state){case Se.TOUCH_ROTATE:if(this.enableRotate===!1)return;this._handleTouchMoveRotate(n),this.update();break;case Se.TOUCH_PAN:if(this.enablePan===!1)return;this._handleTouchMovePan(n),this.update();break;case Se.TOUCH_DOLLY_PAN:if(this.enableZoom===!1&&this.enablePan===!1)return;this._handleTouchMoveDollyPan(n),this.update();break;case Se.TOUCH_DOLLY_ROTATE:if(this.enableZoom===!1&&this.enableRotate===!1)return;this._handleTouchMoveDollyRotate(n),this.update();break;default:this.state=Se.NONE}}function O1(n){this.enabled!==!1&&n.preventDefault()}function F1(n){n.key==="Control"&&(this._controlActive=!0,this.domElement.getRootNode().addEventListener("keyup",this._interceptControlUp,{passive:!0,capture:!0}))}function B1(n){n.key==="Control"&&(this._controlActive=!1,this.domElement.getRootNode().removeEventListener("keyup",this._interceptControlUp,{passive:!0,capture:!0}))}var Yo=new w;function Yn(n,t,e,i,s,r){let o=2*Math.PI*s/4,a=Math.max(r-2*s,0),l=Math.PI/4;Yo.copy(t),Yo[i]=0,Yo.normalize();let c=.5*o/(o+a),h=1-Yo.angleTo(n)/l;return Math.sign(Yo[e])===1?h*c:a/(o+a)+c+c*(1-h)}var Jl=class extends bn{constructor(t=1,e=1,i=1,s=2,r=.1){if(s=s*2+1,r=Math.min(t/2,e/2,i/2,r),super(1,1,1,s,s,s),s===1)return;let o=this.toNonIndexed();this.index=null,this.attributes.position=o.attributes.position,this.attributes.normal=o.attributes.normal,this.attributes.uv=o.attributes.uv;let a=new w,l=new w,c=new w(t,e,i).divideScalar(2).subScalar(r),h=this.attributes.position.array,u=this.attributes.normal.array,d=this.attributes.uv.array,f=h.length/6,m=new w,_=.5/s;for(let g=0,p=0;g<h.length;g+=3,p+=2)switch(a.fromArray(h,g),l.copy(a),l.x-=Math.sign(l.x)*_,l.y-=Math.sign(l.y)*_,l.z-=Math.sign(l.z)*_,l.normalize(),h[g+0]=c.x*Math.sign(a.x)+l.x*r,h[g+1]=c.y*Math.sign(a.y)+l.y*r,h[g+2]=c.z*Math.sign(a.z)+l.z*r,u[g+0]=l.x,u[g+1]=l.y,u[g+2]=l.z,Math.floor(g/f)){case 0:m.set(1,0,0),d[p+0]=Yn(m,l,"z","y",r,i),d[p+1]=1-Yn(m,l,"y","z",r,e);break;case 1:m.set(-1,0,0),d[p+0]=1-Yn(m,l,"z","y",r,i),d[p+1]=1-Yn(m,l,"y","z",r,e);break;case 2:m.set(0,1,0),d[p+0]=1-Yn(m,l,"x","z",r,t),d[p+1]=Yn(m,l,"z","x",r,i);break;case 3:m.set(0,-1,0),d[p+0]=1-Yn(m,l,"x","z",r,t),d[p+1]=1-Yn(m,l,"z","x",r,i);break;case 4:m.set(0,0,1),d[p+0]=1-Yn(m,l,"x","y",r,t),d[p+1]=1-Yn(m,l,"y","x",r,e);break;case 5:m.set(0,0,-1),d[p+0]=Yn(m,l,"x","y",r,t),d[p+1]=1-Yn(m,l,"y","x",r,e);break}}};var jl=class extends Ws{constructor(){super();let t=new bn;t.deleteAttribute("uv");let e=new Zs({side:an}),i=new Zs,s=new Nl(16777215,900,28,2);s.position.set(.418,16.199,.3),this.add(s);let r=new Ft(t,e);r.position.set(-.757,13.219,.717),r.scale.set(31.713,28.305,28.591),this.add(r);let o=new Ft(t,i);o.position.set(-10.906,2.009,1.846),o.rotation.set(0,-.195,0),o.scale.set(2.328,7.905,4.651),this.add(o);let a=new Ft(t,i);a.position.set(-5.607,-.754,-.758),a.rotation.set(0,.994,0),a.scale.set(1.97,1.534,3.955),this.add(a);let l=new Ft(t,i);l.position.set(6.167,.857,7.803),l.rotation.set(0,.561,0),l.scale.set(3.927,6.285,3.687),this.add(l);let c=new Ft(t,i);c.position.set(-2.017,.018,6.124),c.rotation.set(0,.333,0),c.scale.set(2.002,4.566,2.064),this.add(c);let h=new Ft(t,i);h.position.set(2.291,-.756,-2.621),h.rotation.set(0,-.286,0),h.scale.set(1.546,1.552,1.496),this.add(h);let u=new Ft(t,i);u.position.set(-2.193,-.369,-5.547),u.rotation.set(0,.516,0),u.scale.set(3.875,3.487,2.986),this.add(u);let d=new Ft(t,Kr(50));d.position.set(-16.116,14.37,8.208),d.scale.set(.1,2.428,2.739),this.add(d);let f=new Ft(t,Kr(50));f.position.set(-16.109,18.021,-8.207),f.scale.set(.1,2.425,2.751),this.add(f);let m=new Ft(t,Kr(17));m.position.set(14.904,12.198,-1.832),m.scale.set(.15,4.265,6.331),this.add(m);let _=new Ft(t,Kr(43));_.position.set(-.462,8.89,14.52),_.scale.set(4.38,5.441,.088),this.add(_);let g=new Ft(t,Kr(20));g.position.set(3.235,11.486,-12.541),g.scale.set(2.5,2,.1),this.add(g);let p=new Ft(t,Kr(100));p.position.set(0,20,0),p.scale.set(1,.1,1),this.add(p)}dispose(){let t=new Set;this.traverse(e=>{e.isMesh&&(t.add(e.geometry),t.add(e.material))});for(let e of t)e.dispose()}};function Kr(n){let t=new Je;return t.color.setScalar(n),t}var Em={name:"CopyShader",uniforms:{tDiffuse:{value:null},opacity:{value:1}},vertexShader:`

		varying vec2 vUv;

		void main() {

			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,fragmentShader:`

		uniform float opacity;

		uniform sampler2D tDiffuse;

		varying vec2 vUv;

		void main() {

			vec4 texel = texture2D( tDiffuse, vUv );
			gl_FragColor = opacity * texel;


		}`};var Un=class{constructor(){this.isPass=!0,this.enabled=!0,this.needsSwap=!0,this.clear=!1,this.renderToScreen=!1}setSize(){}render(){console.error("THREE.Pass: .render() must be implemented in derived pass.")}dispose(){}},z1=new Vr(-1,1,1,-1,0,1),dd=class extends Fe{constructor(){super(),this.setAttribute("position",new le([-1,3,0,-1,-1,0,3,-1,0],3)),this.setAttribute("uv",new le([0,2,0,0,2,0],2))}},k1=new dd,cs=class{constructor(t){this._mesh=new Ft(k1,t)}dispose(){this._mesh.geometry.dispose()}render(t){t.render(this._mesh,z1)}get material(){return this._mesh.material}set material(t){this._mesh.material=t}};var Ql=class extends Un{constructor(t,e){super(),this.textureID=e!==void 0?e:"tDiffuse",t instanceof cn?(this.uniforms=t.uniforms,this.material=t):t&&(this.uniforms=Qs.clone(t.uniforms),this.material=new cn({name:t.name!==void 0?t.name:"unspecified",defines:Object.assign({},t.defines),uniforms:this.uniforms,vertexShader:t.vertexShader,fragmentShader:t.fragmentShader})),this.fsQuad=new cs(this.material)}render(t,e,i){this.uniforms[this.textureID]&&(this.uniforms[this.textureID].value=i.texture),this.fsQuad.material=this.material,this.renderToScreen?(t.setRenderTarget(null),this.fsQuad.render(t)):(t.setRenderTarget(e),this.clear&&t.clear(t.autoClearColor,t.autoClearDepth,t.autoClearStencil),this.fsQuad.render(t))}dispose(){this.material.dispose(),this.fsQuad.dispose()}};var qo=class extends Un{constructor(t,e){super(),this.scene=t,this.camera=e,this.clear=!0,this.needsSwap=!1,this.inverse=!1}render(t,e,i){let s=t.getContext(),r=t.state;r.buffers.color.setMask(!1),r.buffers.depth.setMask(!1),r.buffers.color.setLocked(!0),r.buffers.depth.setLocked(!0);let o,a;this.inverse?(o=0,a=1):(o=1,a=0),r.buffers.stencil.setTest(!0),r.buffers.stencil.setOp(s.REPLACE,s.REPLACE,s.REPLACE),r.buffers.stencil.setFunc(s.ALWAYS,o,4294967295),r.buffers.stencil.setClear(a),r.buffers.stencil.setLocked(!0),t.setRenderTarget(i),this.clear&&t.clear(),t.render(this.scene,this.camera),t.setRenderTarget(e),this.clear&&t.clear(),t.render(this.scene,this.camera),r.buffers.color.setLocked(!1),r.buffers.depth.setLocked(!1),r.buffers.color.setMask(!0),r.buffers.depth.setMask(!0),r.buffers.stencil.setLocked(!1),r.buffers.stencil.setFunc(s.EQUAL,1,4294967295),r.buffers.stencil.setOp(s.KEEP,s.KEEP,s.KEEP),r.buffers.stencil.setLocked(!0)}},tc=class extends Un{constructor(){super(),this.needsSwap=!1}render(t){t.state.buffers.stencil.setLocked(!1),t.state.buffers.stencil.setTest(!1)}};var ec=class{constructor(t,e){if(this.renderer=t,this._pixelRatio=t.getPixelRatio(),e===void 0){let i=t.getSize(new nt);this._width=i.width,this._height=i.height,e=new xn(this._width*this._pixelRatio,this._height*this._pixelRatio,{type:Fi}),e.texture.name="EffectComposer.rt1"}else this._width=e.width,this._height=e.height;this.renderTarget1=e,this.renderTarget2=e.clone(),this.renderTarget2.texture.name="EffectComposer.rt2",this.writeBuffer=this.renderTarget1,this.readBuffer=this.renderTarget2,this.renderToScreen=!0,this.passes=[],this.copyPass=new Ql(Em),this.copyPass.material.blending=Gn,this.clock=new Ol}swapBuffers(){let t=this.readBuffer;this.readBuffer=this.writeBuffer,this.writeBuffer=t}addPass(t){this.passes.push(t),t.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}insertPass(t,e){this.passes.splice(e,0,t),t.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}removePass(t){let e=this.passes.indexOf(t);e!==-1&&this.passes.splice(e,1)}isLastEnabledPass(t){for(let e=t+1;e<this.passes.length;e++)if(this.passes[e].enabled)return!1;return!0}render(t){t===void 0&&(t=this.clock.getDelta());let e=this.renderer.getRenderTarget(),i=!1;for(let s=0,r=this.passes.length;s<r;s++){let o=this.passes[s];if(o.enabled!==!1){if(o.renderToScreen=this.renderToScreen&&this.isLastEnabledPass(s),o.render(this.renderer,this.writeBuffer,this.readBuffer,t,i),o.needsSwap){if(i){let a=this.renderer.getContext(),l=this.renderer.state.buffers.stencil;l.setFunc(a.NOTEQUAL,1,4294967295),this.copyPass.render(this.renderer,this.writeBuffer,this.readBuffer,t),l.setFunc(a.EQUAL,1,4294967295)}this.swapBuffers()}qo!==void 0&&(o instanceof qo?i=!0:o instanceof tc&&(i=!1))}}this.renderer.setRenderTarget(e)}reset(t){if(t===void 0){let e=this.renderer.getSize(new nt);this._pixelRatio=this.renderer.getPixelRatio(),this._width=e.width,this._height=e.height,t=this.renderTarget1.clone(),t.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}this.renderTarget1.dispose(),this.renderTarget2.dispose(),this.renderTarget1=t,this.renderTarget2=t.clone(),this.writeBuffer=this.renderTarget1,this.readBuffer=this.renderTarget2}setSize(t,e){this._width=t,this._height=e;let i=this._width*this._pixelRatio,s=this._height*this._pixelRatio;this.renderTarget1.setSize(i,s),this.renderTarget2.setSize(i,s);for(let r=0;r<this.passes.length;r++)this.passes[r].setSize(i,s)}setPixelRatio(t){this._pixelRatio=t,this.setSize(this._width,this._height)}dispose(){this.renderTarget1.dispose(),this.renderTarget2.dispose(),this.copyPass.dispose()}};var nc=class extends Un{constructor(t,e,i=null,s=null,r=null){super(),this.scene=t,this.camera=e,this.overrideMaterial=i,this.clearColor=s,this.clearAlpha=r,this.clear=!0,this.clearDepth=!1,this.needsSwap=!1,this._oldClearColor=new Yt}render(t,e,i){let s=t.autoClear;t.autoClear=!1;let r,o;this.overrideMaterial!==null&&(o=this.scene.overrideMaterial,this.scene.overrideMaterial=this.overrideMaterial),this.clearColor!==null&&(t.getClearColor(this._oldClearColor),t.setClearColor(this.clearColor,t.getClearAlpha())),this.clearAlpha!==null&&(r=t.getClearAlpha(),t.setClearAlpha(this.clearAlpha)),this.clearDepth==!0&&t.clearDepth(),t.setRenderTarget(this.renderToScreen?null:i),this.clear===!0&&t.clear(t.autoClearColor,t.autoClearDepth,t.autoClearStencil),t.render(this.scene,this.camera),this.clearColor!==null&&t.setClearColor(this._oldClearColor),this.clearAlpha!==null&&t.setClearAlpha(r),this.overrideMaterial!==null&&(this.scene.overrideMaterial=o),t.autoClear=s}};var bm={name:"BokehShader",defines:{DEPTH_PACKING:1,PERSPECTIVE_CAMERA:1},uniforms:{tColor:{value:null},tDepth:{value:null},focus:{value:1},aspect:{value:1},aperture:{value:.025},maxblur:{value:.01},nearClip:{value:1},farClip:{value:1e3}},vertexShader:`

		varying vec2 vUv;

		void main() {

			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,fragmentShader:`

		#include <common>

		varying vec2 vUv;

		uniform sampler2D tColor;
		uniform sampler2D tDepth;

		uniform float maxblur; // max blur amount
		uniform float aperture; // aperture - bigger values for shallower depth of field

		uniform float nearClip;
		uniform float farClip;

		uniform float focus;
		uniform float aspect;

		#include <packing>

		float getDepth( const in vec2 screenPosition ) {
			#if DEPTH_PACKING == 1
			return unpackRGBAToDepth( texture2D( tDepth, screenPosition ) );
			#else
			return texture2D( tDepth, screenPosition ).x;
			#endif
		}

		float getViewZ( const in float depth ) {
			#if PERSPECTIVE_CAMERA == 1
			return perspectiveDepthToViewZ( depth, nearClip, farClip );
			#else
			return orthographicDepthToViewZ( depth, nearClip, farClip );
			#endif
		}


		void main() {

			vec2 aspectcorrect = vec2( 1.0, aspect );

			float viewZ = getViewZ( getDepth( vUv ) );

			float factor = ( focus + viewZ ); // viewZ is <= 0, so this is a difference equation

			vec2 dofblur = vec2 ( clamp( factor * aperture, -maxblur, maxblur ) );

			vec2 dofblur9 = dofblur * 0.9;
			vec2 dofblur7 = dofblur * 0.7;
			vec2 dofblur4 = dofblur * 0.4;

			vec4 col = vec4( 0.0 );

			col += texture2D( tColor, vUv.xy );
			col += texture2D( tColor, vUv.xy + ( vec2(  0.0,   0.4  ) * aspectcorrect ) * dofblur );
			col += texture2D( tColor, vUv.xy + ( vec2(  0.15,  0.37 ) * aspectcorrect ) * dofblur );
			col += texture2D( tColor, vUv.xy + ( vec2(  0.29,  0.29 ) * aspectcorrect ) * dofblur );
			col += texture2D( tColor, vUv.xy + ( vec2( -0.37,  0.15 ) * aspectcorrect ) * dofblur );
			col += texture2D( tColor, vUv.xy + ( vec2(  0.40,  0.0  ) * aspectcorrect ) * dofblur );
			col += texture2D( tColor, vUv.xy + ( vec2(  0.37, -0.15 ) * aspectcorrect ) * dofblur );
			col += texture2D( tColor, vUv.xy + ( vec2(  0.29, -0.29 ) * aspectcorrect ) * dofblur );
			col += texture2D( tColor, vUv.xy + ( vec2( -0.15, -0.37 ) * aspectcorrect ) * dofblur );
			col += texture2D( tColor, vUv.xy + ( vec2(  0.0,  -0.4  ) * aspectcorrect ) * dofblur );
			col += texture2D( tColor, vUv.xy + ( vec2( -0.15,  0.37 ) * aspectcorrect ) * dofblur );
			col += texture2D( tColor, vUv.xy + ( vec2( -0.29,  0.29 ) * aspectcorrect ) * dofblur );
			col += texture2D( tColor, vUv.xy + ( vec2(  0.37,  0.15 ) * aspectcorrect ) * dofblur );
			col += texture2D( tColor, vUv.xy + ( vec2( -0.4,   0.0  ) * aspectcorrect ) * dofblur );
			col += texture2D( tColor, vUv.xy + ( vec2( -0.37, -0.15 ) * aspectcorrect ) * dofblur );
			col += texture2D( tColor, vUv.xy + ( vec2( -0.29, -0.29 ) * aspectcorrect ) * dofblur );
			col += texture2D( tColor, vUv.xy + ( vec2(  0.15, -0.37 ) * aspectcorrect ) * dofblur );

			col += texture2D( tColor, vUv.xy + ( vec2(  0.15,  0.37 ) * aspectcorrect ) * dofblur9 );
			col += texture2D( tColor, vUv.xy + ( vec2( -0.37,  0.15 ) * aspectcorrect ) * dofblur9 );
			col += texture2D( tColor, vUv.xy + ( vec2(  0.37, -0.15 ) * aspectcorrect ) * dofblur9 );
			col += texture2D( tColor, vUv.xy + ( vec2( -0.15, -0.37 ) * aspectcorrect ) * dofblur9 );
			col += texture2D( tColor, vUv.xy + ( vec2( -0.15,  0.37 ) * aspectcorrect ) * dofblur9 );
			col += texture2D( tColor, vUv.xy + ( vec2(  0.37,  0.15 ) * aspectcorrect ) * dofblur9 );
			col += texture2D( tColor, vUv.xy + ( vec2( -0.37, -0.15 ) * aspectcorrect ) * dofblur9 );
			col += texture2D( tColor, vUv.xy + ( vec2(  0.15, -0.37 ) * aspectcorrect ) * dofblur9 );

			col += texture2D( tColor, vUv.xy + ( vec2(  0.29,  0.29 ) * aspectcorrect ) * dofblur7 );
			col += texture2D( tColor, vUv.xy + ( vec2(  0.40,  0.0  ) * aspectcorrect ) * dofblur7 );
			col += texture2D( tColor, vUv.xy + ( vec2(  0.29, -0.29 ) * aspectcorrect ) * dofblur7 );
			col += texture2D( tColor, vUv.xy + ( vec2(  0.0,  -0.4  ) * aspectcorrect ) * dofblur7 );
			col += texture2D( tColor, vUv.xy + ( vec2( -0.29,  0.29 ) * aspectcorrect ) * dofblur7 );
			col += texture2D( tColor, vUv.xy + ( vec2( -0.4,   0.0  ) * aspectcorrect ) * dofblur7 );
			col += texture2D( tColor, vUv.xy + ( vec2( -0.29, -0.29 ) * aspectcorrect ) * dofblur7 );
			col += texture2D( tColor, vUv.xy + ( vec2(  0.0,   0.4  ) * aspectcorrect ) * dofblur7 );

			col += texture2D( tColor, vUv.xy + ( vec2(  0.29,  0.29 ) * aspectcorrect ) * dofblur4 );
			col += texture2D( tColor, vUv.xy + ( vec2(  0.4,   0.0  ) * aspectcorrect ) * dofblur4 );
			col += texture2D( tColor, vUv.xy + ( vec2(  0.29, -0.29 ) * aspectcorrect ) * dofblur4 );
			col += texture2D( tColor, vUv.xy + ( vec2(  0.0,  -0.4  ) * aspectcorrect ) * dofblur4 );
			col += texture2D( tColor, vUv.xy + ( vec2( -0.29,  0.29 ) * aspectcorrect ) * dofblur4 );
			col += texture2D( tColor, vUv.xy + ( vec2( -0.4,   0.0  ) * aspectcorrect ) * dofblur4 );
			col += texture2D( tColor, vUv.xy + ( vec2( -0.29, -0.29 ) * aspectcorrect ) * dofblur4 );
			col += texture2D( tColor, vUv.xy + ( vec2(  0.0,   0.4  ) * aspectcorrect ) * dofblur4 );

			gl_FragColor = col / 41.0;
			gl_FragColor.a = 1.0;

		}`};var ic=class extends Un{constructor(t,e,i){super(),this.scene=t,this.camera=e;let s=i.focus!==void 0?i.focus:1,r=i.aperture!==void 0?i.aperture:.025,o=i.maxblur!==void 0?i.maxblur:1;this.renderTargetDepth=new xn(1,1,{minFilter:ln,magFilter:ln,type:Fi}),this.renderTargetDepth.texture.name="BokehPass.depth",this.materialDepth=new Lo,this.materialDepth.depthPacking=Ju,this.materialDepth.blending=Gn;let a=bm,l=Qs.clone(a.uniforms);l.tDepth.value=this.renderTargetDepth.texture,l.focus.value=s,l.aspect.value=e.aspect,l.aperture.value=r,l.maxblur.value=o,l.nearClip.value=e.near,l.farClip.value=e.far,this.materialBokeh=new cn({defines:Object.assign({},a.defines),uniforms:l,vertexShader:a.vertexShader,fragmentShader:a.fragmentShader}),this.uniforms=l,this.fsQuad=new cs(this.materialBokeh),this._oldClearColor=new Yt}render(t,e,i){this.scene.overrideMaterial=this.materialDepth,t.getClearColor(this._oldClearColor);let s=t.getClearAlpha(),r=t.autoClear;t.autoClear=!1,t.setClearColor(16777215),t.setClearAlpha(1),t.setRenderTarget(this.renderTargetDepth),t.clear(),t.render(this.scene,this.camera),this.uniforms.tColor.value=i.texture,this.uniforms.nearClip.value=this.camera.near,this.uniforms.farClip.value=this.camera.far,this.renderToScreen?(t.setRenderTarget(null),this.fsQuad.render(t)):(t.setRenderTarget(e),t.clear(),this.fsQuad.render(t)),this.scene.overrideMaterial=null,t.setClearColor(this._oldClearColor),t.setClearAlpha(s),t.autoClear=r}setSize(t,e){this.materialBokeh.uniforms.aspect.value=t/e,this.renderTargetDepth.setSize(t,e)}dispose(){this.renderTargetDepth.dispose(),this.materialDepth.dispose(),this.materialBokeh.dispose(),this.fsQuad.dispose()}};var Sm={name:"OutputShader",uniforms:{tDiffuse:{value:null},toneMappingExposure:{value:1}},vertexShader:`
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

		#include <tonemapping_pars_fragment>
		#include <colorspace_pars_fragment>

		varying vec2 vUv;

		void main() {

			gl_FragColor = texture2D( tDiffuse, vUv );

			// tone mapping

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

			#endif

			// color space

			#ifdef SRGB_TRANSFER

				gl_FragColor = sRGBTransferOETF( gl_FragColor );

			#endif

		}`};var sc=class extends Un{constructor(){super();let t=Sm;this.uniforms=Qs.clone(t.uniforms),this.material=new Il({name:t.name,uniforms:this.uniforms,vertexShader:t.vertexShader,fragmentShader:t.fragmentShader}),this.fsQuad=new cs(this.material),this._outputColorSpace=null,this._toneMapping=null}render(t,e,i){this.uniforms.tDiffuse.value=i.texture,this.uniforms.toneMappingExposure.value=t.toneMappingExposure,(this._outputColorSpace!==t.outputColorSpace||this._toneMapping!==t.toneMapping)&&(this._outputColorSpace=t.outputColorSpace,this._toneMapping=t.toneMapping,this.material.defines={},oe.getTransfer(this._outputColorSpace)===xe&&(this.material.defines.SRGB_TRANSFER=""),this._toneMapping===zu?this.material.defines.LINEAR_TONE_MAPPING="":this._toneMapping===ku?this.material.defines.REINHARD_TONE_MAPPING="":this._toneMapping===Hu?this.material.defines.CINEON_TONE_MAPPING="":this._toneMapping===Xo?this.material.defines.ACES_FILMIC_TONE_MAPPING="":this._toneMapping===Vu?this.material.defines.AGX_TONE_MAPPING="":this._toneMapping===Gu&&(this.material.defines.NEUTRAL_TONE_MAPPING=""),this.material.needsUpdate=!0),this.renderToScreen===!0?(t.setRenderTarget(null),this.fsQuad.render(t)):(t.setRenderTarget(e),this.clear&&t.clear(t.autoClearColor,t.autoClearDepth,t.autoClearStencil),this.fsQuad.render(t))}dispose(){this.material.dispose(),this.fsQuad.dispose()}};function wm(n,t=!1){let e=n[0].index!==null,i=new Set(Object.keys(n[0].attributes)),s=new Set(Object.keys(n[0].morphAttributes)),r={},o={},a=n[0].morphTargetsRelative,l=new Fe,c=0;for(let h=0;h<n.length;++h){let u=n[h],d=0;if(e!==(u.index!==null))return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+h+". All geometries must have compatible attributes; make sure index attribute exists among all geometries, or in none of them."),null;for(let f in u.attributes){if(!i.has(f))return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+h+'. All geometries must have compatible attributes; make sure "'+f+'" attribute exists among all geometries, or in none of them.'),null;r[f]===void 0&&(r[f]=[]),r[f].push(u.attributes[f]),d++}if(d!==i.size)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+h+". Make sure all geometries have the same number of attributes."),null;if(a!==u.morphTargetsRelative)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+h+". .morphTargetsRelative must be consistent throughout all geometries."),null;for(let f in u.morphAttributes){if(!s.has(f))return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+h+".  .morphAttributes must be consistent throughout all geometries."),null;o[f]===void 0&&(o[f]=[]),o[f].push(u.morphAttributes[f])}if(t){let f;if(e)f=u.index.count;else if(u.attributes.position!==void 0)f=u.attributes.position.count;else return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+h+". The geometry must have either an index or a position attribute"),null;l.addGroup(c,f,h),c+=f}}if(e){let h=0,u=[];for(let d=0;d<n.length;++d){let f=n[d].index;for(let m=0;m<f.count;++m)u.push(f.getX(m)+h);h+=n[d].attributes.position.count}l.setIndex(u)}for(let h in r){let u=Tm(r[h]);if(!u)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed while trying to merge the "+h+" attribute."),null;l.setAttribute(h,u)}for(let h in o){let u=o[h][0].length;if(u===0)break;l.morphAttributes=l.morphAttributes||{},l.morphAttributes[h]=[];for(let d=0;d<u;++d){let f=[];for(let _=0;_<o[h].length;++_)f.push(o[h][_][d]);let m=Tm(f);if(!m)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed while trying to merge the "+h+" morphAttribute."),null;l.morphAttributes[h].push(m)}}return l}function Tm(n){let t,e,i,s=-1,r=0;for(let c=0;c<n.length;++c){let h=n[c];if(t===void 0&&(t=h.array.constructor),t!==h.array.constructor)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.array must be of consistent array types across matching attributes."),null;if(e===void 0&&(e=h.itemSize),e!==h.itemSize)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.itemSize must be consistent across matching attributes."),null;if(i===void 0&&(i=h.normalized),i!==h.normalized)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.normalized must be consistent across matching attributes."),null;if(s===-1&&(s=h.gpuType),s!==h.gpuType)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.gpuType must be consistent across matching attributes."),null;r+=h.count*e}let o=new t(r),a=new en(o,e,i),l=0;for(let c=0;c<n.length;++c){let h=n[c];if(h.isInterleavedBufferAttribute){let u=l/e;for(let d=0,f=h.count;d<f;d++)for(let m=0;m<e;m++){let _=h.getComponent(d,m);a.setComponent(d+u,m,_)}}else o.set(h.array,l);l+=h.count*e}return s!==void 0&&(a.gpuType=s),a}var gi=/CassetteWallpaper/i.test(navigator.userAgent);window.__wallpaperInactive=window.__wallpaperInactive??!1;window.__wallpaperSleeping=window.__wallpaperSleeping??!1;var qn=matchMedia("(pointer: coarse)").matches,H1={isMobile:qn,isTouch:navigator.maxTouchPoints>0,isIOS:/iPad|iPhone|iPod/.test(navigator.userAgent)||/Mac/.test(navigator.platform)&&navigator.maxTouchPoints>1},_i=!1,fs=Math.min(devicePixelRatio,qn?1.25:1.5),dn=document.querySelector("#world"),ce=new hl({canvas:dn,antialias:!0,alpha:!1,powerPreference:"low-power"});ce.setPixelRatio(gi?1:fs);ce.setSize(innerWidth,innerHeight);ce.shadowMap.enabled=!0;ce.shadowMap.autoUpdate=!1;ce.info.autoReset=!1;ce.shadowMap.type=Bu;ce.toneMapping=Xo;ce.toneMappingExposure=1;var Qe=new Ws;Qe.background=new Yt("#eeede7");Qe.fog=new ul("#eeede7",45,85);var Wt=new tn(39,innerWidth/innerHeight,.15,120),xs=new w(11,12,26);innerWidth/innerHeight<.85&&xs.set(5,12,Math.max(32,34/Wt.aspect));Wt.position.copy(xs).multiplyScalar(1.08);var Ot=new $l(Wt,dn);Ot.target.set(0,3.2,0);Ot.enableDamping=!0;Ot.dampingFactor=.065;Ot.minDistance=8;Ot.maxDistance=innerWidth/innerHeight<.85?80:48;Ot.minPolarAngle=.28;Ot.maxPolarAngle=Math.PI/2-.025;Ot.enablePan=!0;Ot.screenSpacePanning=!0;Ot.enabled=!gi;Ot.enableZoom=!gi;Ot.mouseButtons={LEFT:si.ROTATE,MIDDLE:si.DOLLY,RIGHT:si.PAN};var qm=new Gr(ce),Zm=new jl;Qe.environment=qm.fromScene(Zm,.04).texture;Qe.environmentIntensity=.45;Zm.dispose();qm.dispose();Qe.add(new Wo(16053484,11249305,.8));var bs=new Xr(16774885,2.3);bs.position.set(-10,18,12);bs.castShadow=!0;bs.shadow.mapSize.set(gi||qn?1024:2048,gi||qn?1024:2048);Object.assign(bs.shadow.camera,{left:-16,right:16,top:16,bottom:-16,near:1,far:50});bs.shadow.bias=-25e-5;bs.shadow.normalBias=.025;bs.shadow.radius=5;Qe.add(bs);var Km=new Xr(15200506,.85);Km.position.set(8,12,-9);Qe.add(Km);var Qr=null,no=null;!gi&&!qn&&(Qr=new ec(ce),Qr.addPass(new nc(Qe,Wt)),no=new ic(Qe,Wt,{focus:25,aperture:18e-6,maxblur:.003}),no.enabled=!1,Qr.addPass(no),Qr.addPass(new sc));var de=(n,t=.6,e=0,i={})=>new Zs({color:n,roughness:t,metalness:e,...i}),P={silver:de("#b6bcb8",.42,.35),edge:de("#d1d4cf",.38,.44),cream:de("#e4e0d2",.64),dark:de("#303735",.68),black:de("#131b1c",.74),rubber:de("#232929",.92),metal:de("#8c9590",.32,.78),chrome:de("#cad0c8",.22,.86),orange:de("#bc582c",.55),red:de("#853d30"),pcb:de("#3e6555",.7),copper:de("#bd9a60",.4,.67),paper:de("#e6dfc9",.87),glass:de("#929f98",.15,.08,{transparent:!0,opacity:.15,depthWrite:!1}),smoke:de("#495d55",.24,.15,{transparent:!0,opacity:.2,depthWrite:!1}),tape:de("#372b22",.62,.08),green:de("#9eae75",.6,0,{emissive:"#4c582a",emissiveIntensity:.18})},ee=new ti;Qe.add(ee);var fe=new ti;Qe.add(fe);var Ad=[];var $m=[];var Jm=[],ai=[],jm=[],ps={},Ye={},vc=[],V1=0;function re(n,t=0,e=0,i=0){let s=new ti;return s.position.set(t,e,i),n.add(s),s}function j(n,t,e,i,s,r,o,a=P.silver,l=.035){let c=l?new Jl(t,e,i,2,Math.min(l,t/3,e/3,i/3)):new bn(t,e,i),h=new Ft(c,a);return h.position.set(s,r,o),h.castShadow=!0,h.receiveShadow=!0,n.add(h),h}function ne(n,t,e,i,s,r,o=P.metal,a=40,l="z"){let c=new Ft(new Xs(t,t,e,a),o);return l==="z"&&(c.rotation.x=Math.PI/2),c.position.set(i,s,r),c.castShadow=!0,c.receiveShadow=!0,n.add(c),c}function On(n,t,e,i,s,r,o=P.dark){let a=new Ft(new Cl(t,e,10,72),o);return a.position.set(i,s,r),a.castShadow=!0,n.add(a),a}function yc(n,t,e,i,s,r){let o=new Ft(new Rl(t,16,12),r);return o.position.set(e,i,s),o.castShadow=!0,n.add(o),o}function pn(n,t,e,i,s=P.metal){t=new w(...t),e=new w(...e);let r=new Ft(new Xs(i,i,t.distanceTo(e),10),s);return r.position.copy(t).add(e).multiplyScalar(.5),r.quaternion.setFromUnitVectors(new w(0,1,0),e.sub(t).normalize()),r.castShadow=!0,n.add(r),r}function Qm(n,t,e,i,s=!1){let r=new Bo(t.map(a=>new w(...a)),s),o=new Ft(new Pl(r,80,e,6,s),i);return o.castShadow=!0,o.userData.path=r,n.add(o),o}function Dt(n,t,e,i,s,r,o,a={}){let l=document.createElement("canvas");l.width=a.res||1024,l.height=Math.max(64,Math.round(l.width*i/e));let c=l.getContext("2d"),h=t;function u(_){c.clearRect(0,0,l.width,l.height),a.bg&&(c.fillStyle=a.bg,c.fillRect(0,0,l.width,l.height)),c.fillStyle=a.color||"#26312e",c.textAlign=a.align||"center",c.textBaseline="middle";let g=String(_).split(`
`);c.font=`${a.weight||600} ${Math.round(l.height/(g.length+.45))}px ${a.mono?"monospace":"Arial, sans-serif"}`,g.forEach((p,S)=>c.fillText(p,a.align==="left"?10:l.width/2,l.height*(S+.5)/g.length,l.width-20))}u(t);let d=new ls(l);d.colorSpace=Ve,d.anisotropy=4;let f=new Je({map:d,transparent:!0,depthWrite:!1,toneMapped:!1,side:Dn}),m=new Ft(new ni(e,i),f);return m.position.set(s,r,o),n.add(m),m.userData.setText=_=>{h=_,u(_),d.needsUpdate=!0},m.userData.setInk=_=>{a.color=_,u(h),d.needsUpdate=!0},m}function ca(n,t,e,i,s=.075){ne(n,s,.035,t,e,i,P.metal,16);let r=j(n,s*1.25,.014,.013,t,e,i+.025,P.dark,0);r.rotation.z=.35}function Rd(n,t,e,i){ne(n,.058,.024,t,e,i,P.metal,24);for(let s of[.3,Math.PI/2+.3]){let r=j(n,.068,.009,.002,t,e,i+.013,P.dark,0);r.rotation.z=s}}function he(n,t,e,i,s,r,o){let a=re(ee,t,e,i);return a.userData.part={id:++V1,name:n,base:a.position.clone(),offset:new w(s,r,o)},Ad.push(a),a}function Me(n,t,e){return n.userData.action={kind:t,value:e},n}var aS=j(Qe,200,.1,200,0,-.4,0,de("#eeede7",.95),0),lS=j(Qe,22.2,.5,18.4,1.9,-.08,.1,de("#e1e0d7",.87),.15);function G1(n,t,e,i,s=.2){let r=document.createElement("canvas");r.width=r.height=128;let o=r.getContext("2d"),a=o.createRadialGradient(64,64,2,64,64,64);a.addColorStop(0,`rgba(42,39,31,${s})`),a.addColorStop(1,"rgba(42,39,31,0)"),o.fillStyle=a,o.fillRect(0,0,128,128);let l=new Ft(new ni(e,i),new Je({map:new ls(r),transparent:!0,depthWrite:!1}));l.rotation.x=-Math.PI/2,l.position.set(n,.18,t),Qe.add(l)}G1(0,.1,18,8,.3);var cS=j(fe,4.55,.03,.76,-4.8,.195,-3.7,P.paper,.025),W1=Dt(fe,"CASSETTE WORLD   /   C\u201482",4.15,.2,-4.8,.217,-3.84,{weight:700});W1.rotation.x=-Math.PI/2;var X1=Dt(fe,"A MINIATURE ANALOG MUSIC MACHINE",4.1,.1,-4.8,.219,-3.55,{mono:!0});X1.rotation.x=-Math.PI/2;var t0=he("01 \xB7 ALUMINIUM CHASSIS",0,1.02,0,0,0,0);j(t0,13.7,.22,2.8,0,0,0,P.dark,.075);for(let n of[-5.8,5.8])for(let t of[-.83,.83])j(t0,1.05,.67,.63,n,-.49,t,P.rubber,.09);var Be=he("02 \xB7 INJECTION-MOULDED FRONT",0,4.13,1.34,0,-2.15,4.1),Mi=new Ys;Mi.moveTo(-7,-3);Mi.lineTo(7,-3);Mi.lineTo(7,3);Mi.lineTo(-7,3);Mi.closePath();for(let n of[-4.7,4.7]){let t=new Ni;t.absarc(n,-.55,2.03,0,Math.PI*2,!0),Mi.holes.push(t)}var ao=new Ni;ao.moveTo(-2.15,-2.1);ao.lineTo(-2.15,1.05);ao.lineTo(2.15,1.05);ao.lineTo(2.15,-2.1);ao.closePath();Mi.holes.push(ao);function Cd(n,t,e,i){let s=new Ni;s.moveTo(n,t),s.lineTo(n,i),s.lineTo(e,i),s.lineTo(e,t),s.closePath(),Mi.holes.push(s)}Cd(-2.18,-2.85,2.18,-2.28);Cd(-1.96,1.17,1.96,2.55);Cd(2.81,1.57,6.46,2.68);for(let[n,t,e]of[[-5.62,1.96,.43],[-4.35,1.99,.28],[-3.43,1.99,.28]]){let i=new Ni;i.absarc(n,t,e,0,Math.PI*2,!0),Mi.holes.push(i)}var ha=new Ft(new Tl(Mi,{depth:.19,bevelEnabled:!0,bevelSegments:2,steps:1,bevelSize:.03,bevelThickness:.045}),P.silver);ha.castShadow=!0;ha.receiveShadow=!0;Be.add(ha);Me(ha,"focus");for(let n of[-2.89,2.86])j(Be,13.7,.045,.045,0,n,.265,P.edge,.015);for(let[n,t]of Xl)On(Be,.074,.01,n,t,.241,P.dark);Dt(Be,"CASSETTE",2.44,.24,-5.22,2.73,.265,{weight:800});Dt(Be,"WORLD",1.46,.095,-5.7,2.49,.266,{weight:600});var Y1=Dt(Be,"C\u201482",1.6,.2,5.7,2.8,.266,{weight:700});Dt(Be,"PRECISION TAPE TRANSPORT",3.6,.105,0,1.17,.266,{mono:!0});for(let n of[-4.7,4.7])Dt(Be,"2-WAY SPEAKER SYSTEM",3,.12,n,-2.78,.27,{mono:!0}),Dt(Be,"8\u03A9     /     15W",1.3,.11,n,-2.54,.27,{mono:!0});var Yi=he("03 \xB7 REAR ENCLOSURE",0,4.12,-1.34,.25,.3,-3);j(Yi,14,6,.24,0,0,0,P.dark,.12);for(let[n,t]of Xl){let e=re(Yi,n,t,-.128);e.rotation.y=Math.PI,Rd(e,0,0,0)}for(let n=0;n<35;n++)j(Yi,.15,1.2,.05,-5.7+n*.33,1.42,-.15,P.black,.02);var e0=Dt(Yi,`CASSETTE SYSTEM C-82
DC 9V  \xB7  6 \xD7 R20 / D
SERIAL 008417
MADE FOR CASSETTE WORLD`,3.8,1.05,2.8,-.25,-.145,{bg:"#b1b5a9",mono:!0});e0.rotation.y=Math.PI;var q1=Dt(Yi,`SERVICE 08.17.92
INSPECTED  /  OK`,1.5,.45,-4.8,-1.9,-.15,{bg:"#d6bf85",mono:!0});q1.rotation.y=Math.PI;var io=he("04 \xB7 BATTERY COMPARTMENT",-2.5,2.75,-1.52,-1.7,-.3,-3.6);j(io,5.5,1.6,.12,0,0,0,P.rubber,.08);var Z1=Dt(io,"BATTERY  /  OPEN \u2192",3,.14,0,0,-.075,{color:"#92968c",mono:!0});Z1.rotation.y=Math.PI;for(let n=0;n<6;n++){let t=ne(io,.28,1.3,-2.1+n*.84,0,.5,P.dark,20,"y");Dt(io,"R20",.27,.12,-2.1+n*.84,0,.81,{color:"#b8ad83"}),ne(io,.21,.035,-2.1+n*.84,.67,.5,P.copper,20,"y")}var kn=he("05 \xB7 TOP COVER",0,7.03,0,0,2.1,-.1);j(kn,14.13,.25,2.97,0,0,0,P.edge,.085);for(let n of[-6.67,6.67])for(let t of[-1.11,1.11]){let e=re(kn,n,.133,t);e.rotation.x=-Math.PI/2,Rd(e,0,0,0)}var Pd=he("06 \xB7 LEFT SIDE PANEL",-6.96,4.1,0,-1.65,.1,-.4);j(Pd,.24,5.96,2.81,0,0,0,P.silver,.075);var Mc=he("07 \xB7 RIGHT SIDE PANEL",6.96,4.1,0,1.65,.1,-.4);j(Mc,.24,5.96,2.81,0,0,0,P.silver,.075);for(let n=0;n<17;n++)j(Mc,.028,.095,1.72,.13,1.5-n*.16,0,P.dark,.01);var fd=he("08 \xB7 HEADPHONE / AUX / DC",7.1,2.2,.25,2.2,-.1,.1);for(let n=0;n<3;n++){ne(fd,.13,.065,0,n*.47,0,P.black,24).rotation.set(0,0,Math.PI/2);let e=On(fd,.14,.025,.055,n*.47,0,P.chrome);e.rotation.y=Math.PI/2;let i=Dt(fd,["DC 9V","AUX","PHONES"][n],.65,.09,.07,n*.47+.2,0,{mono:!0});i.rotation.y=Math.PI/2}var xi=he("09 \xB7 CARRY HANDLE",0,7.12,-.15,0,3.1,-.35);j(xi,.42,1.5,.5,-3.4,.72,0,P.dark,.12);j(xi,.42,1.5,.5,3.4,.72,0,P.dark,.12);j(xi,7.15,.43,.54,0,1.44,0,P.dark,.14);j(xi,5.85,.09,.59,0,1.63,0,P.rubber,.025);for(let n of[-3.4,3.4])ne(xi,.21,.58,n,.12,0,P.metal);var vi=he("10 \xB7 TELESCOPIC ANTENNA",5.5,7.2,-.82,1.2,3,-.8);ne(vi,.2,.19,0,0,0,P.chrome,24,"y");pn(vi,[0,0,0],[1.65,4,-.18],.047,P.chrome);pn(vi,[.8,1.94,-.087],[1.73,4.22,-.19],.027,P.chrome);yc(vi,.072,1.73,4.22,-.19,P.chrome);function Rm(n,t){let e=he(`${t} \xB7 WOOFER ASSEMBLY`,n,3.58,1.34,Math.sign(n)*4.55,.3,2.1);ne(e,1.98,.23,0,0,-.12,P.dark,72),ne(e,1.15,.65,0,0,-.55,P.metal,48),ne(e,.74,.35,0,0,-1,P.black,40),On(e,1.84,.11,0,0,.12,P.rubber),On(e,1.63,.09,0,0,.13,P.black);let i=re(e),s=new Ft(new Sl(1.54,.36,80,1,!0),P.rubber);s.rotation.x=-Math.PI/2,s.position.z=-.015,i.add(s);let r=yc(i,.57,0,0,.075,P.black);r.scale.z=.45;for(let f=.72;f<1.53;f+=.13)On(i,f,.018,0,0,.14-(f-.7)*.16,P.dark);Jm.push(i);for(let f=0;f<8;f++){let m=f*Math.PI/4;ca(e,Math.cos(m)*1.84,Math.sin(m)*1.84,.24,.055)}let o=he(`${t} \xB7 STEEL MESH GRILLE`,n,3.58,1.73,Math.sign(n)*4.8,.4,4.4);On(o,1.99,.085,0,0,0,P.dark),On(o,1.91,.024,0,0,.03,P.metal);let a=45,l=3.78/a,c=[];for(let f=-22;f<=22;f++){let m=f*l,_=Math.sqrt(1.87**2-m**2);Number.isFinite(_)&&(c.push([m,0,l*.19,_*2]),c.push([0,m,_*2,l*.19]))}let h=new No(new bn(1,1,.025),P.black,c.length),u=new $e;c.forEach((f,m)=>{u.position.set(f[0],f[1],.05),u.scale.set(f[2],f[3],1),u.updateMatrix(),h.setMatrixAt(m,u.matrix)}),o.add(h),Me(h,"speaker",o),o.userData.localStage=0;let d=j(o,.7,.3,.07,0,-1.64,.09,P.edge,.025);return Dt(o,"C / W",.48,.13,0,-1.64,.133,{weight:800}),{driver:e,grille:o}}var so=[Rm(-4.7,"11"),Rm(4.7,"12")],ua=he("13 \xB7 CASSETTE CRADLE",0,3.59,.76,-3.3,.6,-.3);j(ua,4.43,3.32,.24,0,0,0,P.black,.08);j(ua,3.72,2.64,.07,0,0,.15,P.dark,.06);for(let n of[-.83,.83])ne(ua,.14,.45,n,.05,.37,P.chrome,24);var Ss=Dt(ua,`NO TAPE
INSERT AUDIO`,2.35,.64,0,-.25,.29,{color:"#b3bcac",mono:!0});Me(Ss,"import");Ss.visible=!1;Dt(ua,"LOCAL AUDIO ONLY  \xB7  OPEN TO INSERT",3.28,.095,0,-1.21,.27,{color:"#879387",mono:!0});var n0=he("14 \xB7 DAMPED CASSETTE DOOR",0,2.05,1.66,4.3,2.6,4.8),Fn=re(n0);for(let n of[-2.02,2.02])j(Fn,.18,3.1,.19,n,1.54,0,P.dark,.06);for(let n of[.08,3.03])j(Fn,4.2,.17,.19,0,n,0,P.dark,.05);var K1=j(Fn,3.82,2.57,.07,0,1.59,.01,P.smoke,.05);Me(K1,"door");j(Fn,3.83,.39,.075,0,.4,.065,P.silver,.015);Dt(Fn,"AUTO REVERSE",2.15,.16,0,.42,.109,{weight:800});Dt(Fn,"FULL LOGIC  /  SOFT EJECT",2.9,.095,0,2.78,.118,{color:"#c5cdc1",mono:!0});j(Fn,.68,.11,.06,0,3.06,.14,P.orange,.02);for(let n of[-1.82,1.82])ne(Fn,.085,.19,n,.06,0,P.chrome);var je=0,Cm=0,Pm=0;function vn(n,t=!1){let e=n?1.53:0;Math.abs(e-je)<.01||(je=e,t||zn(n?"door-open":"door-close"),n&&ci("tape"))}function hr(n,t="SUMMER 1997",e="#cab86e",i=1){let s=re(n);s.scale.setScalar(i),j(s,3.55,2.24,.3,0,0,0,de("#7f8c7f",.35,.08,{transparent:!0,opacity:.48}),.12),j(s,3.28,.75,.035,0,.62,.181,de(e,.8),.035);let r=Dt(s,t.toUpperCase(),2.68,.19,0,.62,.204,{weight:700});Dt(s,"A",.22,.21,-1.43,.62,.204,{weight:800}),Dt(s,"LOCAL TAPE    /    TYPE I    /    C-82",2.95,.095,0,.88,.204,{mono:!0}),Dt(s,"STEREO  \xB7  NORMAL BIAS  \xB7  120\u03BCs",2.85,.065,0,-.99,.197,{mono:!0});let o=re(s),a=[],l=[];for(let d of[-.84,.84]){On(o,.63,.018,d,-.1,.185,P.metal);let f=re(o,d,-.1,.15),m=ne(f,.58,.08,0,0,0,P.tape,64),_=re(f);for(let g of[.32,.38,.44,.5,.56])On(_,g,.003,0,0,.041,P.dark);ne(f,.255,.14,0,0,.045,P.cream,32),ne(f,.13,.155,0,0,.065,P.dark,20);for(let g=0;g<6;g++){let p=g*Math.PI/3;j(f,.085,.13,.03,Math.cos(p)*.188,Math.sin(p)*.188,.13,P.edge,.01).rotation.z=p}a.push({reel:f,wound:m,layers:_})}let c=new Fe,h=od(c,0),u=new Ft(c,P.tape);u.userData.dynamic=!0,o.add(u),a.forEach(({wound:d,layers:f},m)=>{let _=h[m]/.58;d.scale.set(_,1,_),f.scale.set(_,_,1)});for(let d of[-1.27,1.27]){let f=re(o,d,-.7,.15);ne(f,.095,.08,0,0,0,P.cream,24),j(f,.1,.018,.01,0,0,.046,P.dark,0),l.push(f),ne(o,.033,.14,d,-.7,.15,P.chrome,12)}j(o,.29,.12,.13,0,-.89,.11,P.metal,.015),j(o,.22,.046,.082,0,-.826,.15,P.paper,.006);for(let d of[-1.6,1.6])for(let f of[-.93,.96])ca(s,d,f,.18,.05);for(let d of[-1.1,1.1])j(s,.3,.08,.15,d,1.1,-.025,P.black,.01);return s.userData={spool:a,titleLabel:r,tapePath:u,guideRollers:l,mechanism:o,ribbonProgress:0},s}var qe=he("15 \xB7 SIDE A / MAGNETIC TAPE",0,3.59,1.19,0,2.3,3.1),rr=hr(qe,"LOCAL TAPE");qe.visible=!1;Me(rr,"seek");var $1=he("36 \xB7 CONTROL MOUNTING PLATE",0,5.99,1.27,0,1.2,-.65);j($1,4.12,1.61,.11,0,0,0,P.dark,.04);var dc=[],$o=he("16 \xB7 DUAL ANALOG VU",0,6.3,1.58,0,1.4,1.9);function i0(n,t){j($o,1.78,.66,.19,n,0,0,P.dark,.06);let e=document.createElement("canvas");e.width=512,e.height=190;let i=e.getContext("2d");i.fillStyle="#d6cba6",i.fillRect(0,0,512,190),i.strokeStyle="#46503e",i.lineWidth=3,i.beginPath(),i.arc(256,207,155,Math.PI*1.16,Math.PI*1.84),i.stroke();for(let a=0;a<13;a++){let l=Math.PI*(1.16+a*.68/12);i.strokeStyle=a>9?"#b34728":"#3a493b",i.beginPath(),i.moveTo(256+Math.cos(l)*147,207+Math.sin(l)*147),i.lineTo(256+Math.cos(l)*168,207+Math.sin(l)*168),i.stroke()}i.fillStyle="#374638",i.font="19px monospace",i.fillText("\u221220   \u221210    \u22123  0  +3",58,62),i.font="bold 23px Arial",i.fillText("VU  "+t,207,165);let s=new ls(e);s.colorSpace=Ve;let r=new Ft(new ni(1.58,.49),new Je({map:s}));r.position.set(n,.01,.103),$o.add(r);let o=re($o,n,-.25,.128);j(o,.017,.48,.009,0,.25,0,P.dark,.002),ne(o,.055,.02,0,0,0,P.dark,16),o.rotation.z=1.03,dc.push(o),j($o,1.62,.52,.033,n,.01,.155,P.glass,.02)}i0(-.94,"L");i0(.94,"R");Me($o,"region","vu");var s0=he("17 \xB7 LCD / TAPE STATUS",-.56,5.56,1.55,-.25,.5,1.4);j(s0,2.72,.46,.12,0,0,0,P.dark,.035);var J1=Dt(s0,"STANDBY   \u2014   C82",2.53,.26,0,0,.066,{mono:!0,color:"#364c3d",bg:"#a8b39a",weight:500}),da=he("18 \xB7 MECHANICAL COUNTER",1.42,5.56,1.6,.6,.4,2);j(da,.95,.43,.12,0,0,0,P.black,.02);var r0=[];for(let n=0;n<3;n++){let t=re(da,(n-1)*.255,0,.02);for(let e=0;e<10;e++){let i=e*Math.PI*2/10,s=Dt(t,String(e),.215,.22,0,Math.sin(i)*.305,Math.cos(i)*.305,{mono:!0,bg:"#202725",color:"#dfdfc9",res:128});s.rotation.x=-i}r0.push(t)}j(da,.94,.25,.33,0,.25,.22,P.dark,.015);j(da,.94,.25,.33,0,-.25,.22,P.dark,.015);Dt(da,"TAPE COUNTER",.98,.09,0,.39,.07,{mono:!0});var ea=he("19 \xB7 INTERLOCK KEY BANK",0,1.56,1.63,0,-.65,2.25);j(ea,4.6,.74,.105,0,0,-.22,P.rubber,.035);var j1=[["prev","I\u25C0"],["rew","\u25C0\u25C0"],["play","\u25B6"],["pause","\u2161"],["stop","\u25A0 / \u23CF"],["ff","\u25B6\u25B6"],["next","\u25B6I"],["record","\u25CF"]];j1.forEach(([n,t],e)=>{let i=(e-3.5)*.52;j(ea,.505,.475,.085,i,0,.025,P.dark,.025),j(ea,.46,.025,.025,i,-.24,.067,P.metal,.005);let s=re(ea,i,0,.2),r=j(s,.455,.415,.32,0,0,0,n==="play"?P.orange:n==="record"?P.dark:P.cream,.034);Dt(s,t,.36,.18,0,.046,.174,{color:n==="play"?"#f6e6c9":n==="record"?"#bf6046":"#26342e"}),Dt(s,n==="stop"?"STOP/EJ":n.toUpperCase(),.4,.075,0,-.115,.175,{color:n==="play"?"#f6e6c9":n==="record"?"#b4bdac":"#424b43",mono:!0}),Me(r,"button",n),ps[n]=s,s.userData.velocity=0,pn(s,[0,0,-.15],[0,0,-1.2],.035,P.chrome),j(s,.15,.12,.35,0,-.16,-.8,P.metal,.01)});var o0=de("#ac6f32",.3,0,{emissive:"#d88732",emissiveIntensity:.6}),hS=ne(Be,.053,.04,-3.4,2.48,.27,o0,20);Dt(Be,"POWER",.55,.075,-3.4,2.29,.275,{mono:!0});function Id(n,t,e,i,s,r,o=.5){let a=he(`${20+Object.keys(Ye).length} \xB7 ${n}`,t,e,i,Math.sign(t)*.45,.8,1.9);ne(a,s+.085,.07,0,0,-.095,P.rubber,48),On(a,s+.075,.018,0,0,0,P.dark);for(let h=0;h<11;h++){let u=(-135+h*27)*Math.PI/180;pn(a,[Math.sin(u)*(s+.09),Math.cos(u)*(s+.09),.02],[Math.sin(u)*(s+.15),Math.cos(u)*(s+.15),.02],.009,P.dark)}let l=re(a,0,0,.07);ne(l,s,.23,0,0,0,P.dark,64),ne(l,s*.86,.03,0,0,.13,P.edge,64),j(l,.045,s*.38,.014,0,s*.52,.154,P.dark,.006);for(let h=0;h<44;h++){let u=h/44*Math.PI*2;pn(l,[Math.sin(u)*s,Math.cos(u)*s,-.06],[Math.sin(u)*s,Math.cos(u)*s,.1],.009,P.metal)}Dt(a,n,s*2+.5,.11,0,-s-.28,.01,{mono:!0});let c=ne(a,s+.05,.29,0,0,.03,new Je({visible:!1}),40);return Me(c,"knob",r),Me(a,"knob",r),Ye[r]={part:a,rot:l,value:o,displayValue:o,radius:s,lastDetent:Math.round(o*40),lastTick:0},a}Id("VOLUME",-5.62,6.09,1.62,.4,"volume",.68);Id("BASS",-4.35,6.12,1.62,.24,"bass",.5);Id("TREBLE",-3.43,6.12,1.62,.24,"treble",.5);var ms=he("23 \xB7 FIVE-BAND EQUALIZER",4.63,6.25,1.56,1.1,1.35,2);j(ms,3.83,1.24,.1,0,0,-.17,P.rubber,.04);j(ms,3.53,1,.11,0,0,0,P.dark,.035);Dt(ms,"GRAPHIC EQUALIZER",2.9,.1,0,.45,.064,{color:"#c5c9b9",mono:!0});[60,250,1e3,4e3,12e3].forEach((n,t)=>{let e=(t-2)*.59;j(ms,.043,.6,.022,e,.035,.065,P.black,.009);for(let r=-2;r<=2;r++)j(ms,.17,.011,.005,e,r*.127+.035,.075,P.metal,0);let i=re(ms,e,.035,.095),s=j(i,.28,.11,.1,0,0,0,P.cream,.018);j(i,.23,.018,.008,0,0,.055,P.orange,.002),Me(s,"eq",t),vc.push(i),Dt(ms,["60","250","1K","4K","12K"][t],.36,.075,e,-.39,.067,{mono:!0,color:"#c7ceba"})});for(let n=0;n<14;n++){let t=de(n>10?"#9a643d":"#829566",.5,0,{emissive:n>10?"#ca632d":"#76934f",emissiveIntensity:.025});j(Be,.12,.046,.018,3.42+n*.2,.99,.267,t,.004),jm.push(t)}var Q1=he("24 \xB7 TOP MODE CONTROLS",0,7.2,.78,0,2.4,.9);function Dd(n,t,e,i){let s=re(Q1,n,0,0);j(s,2.18,.09,.91,0,0,0,P.dark,.045),j(s,2.06,.012,.79,0,.05,0,P.metal,.03),j(s,1.35,.025,.18,0,.063,.05,P.black,.025);let r=Dt(s,t,1.92,.145,0,.064,-.26,{color:"#e3dfce",mono:!0});r.rotation.x=-Math.PI/2;let o=j(s,.34,.105,.27,-.47,.109,.05,P.cream,.026);for(let l=-1;l<=1;l++)j(o,.018,.008,.16,l*.065,.056,0,P.metal,.003);let a=[];return i.forEach((l,c)=>{let h=-.47+c*.94/(i.length-1),u=j(s,.94/(i.length-1),.007,.2,h,.064,.29,P.dark,.008);Me(u,"selectorState",{kind:e,index:c});let d=Dt(s,l,.82/(i.length-1),.105,h,.07,.29,{mono:!0,color:c?"#9ca69d":"#f0c681"});d.rotation.x=-Math.PI/2,Me(d,"selectorState",{kind:e,index:c}),a.push(d),j(s,.018,.016,.055,h,.079,.05,P.orange,.002)}),Me(o,"selector",e),Me(s,"selector",e),{tab:o,group:s,marks:a,states:i,lastIndex:0}}var Ld=Dd(-4.15,"OUTPUT","stereo",["STEREO","MONO"]),Ud=Dd(-1.45,"PLAY ORDER","shuffle",["IN ORDER","SHUFFLE"]),Nd=Dd(1.25,"TAPE LOOP","repeat",["OFF","ONE","ALL"]),Ec={stereo:Ld,shuffle:Ud,repeat:Nd},tE=Dt(kn,"C / W  \u2022  ANALOG CONTROL",2.5,.13,-.1,.131,-.92,{mono:!0});tE.rotation.x=-Math.PI/2;var a0=j(kn,.62,.035,.62,5.8,.14,.57,P.orange,.02);Me(a0,"explode");var bc=Dt(kn,"+",.25,.25,5.8,.17,.57,{color:"#eadfc6"});bc.rotation.x=-Math.PI/2;Me(bc,"explode");var l0=Dt(kn,"SERVICE \xB7 DOUBLE TAP",1.9,.12,5.5,.157,.99,{mono:!0});l0.rotation.x=-Math.PI/2;var Od=he("25 \xB7 TAPE TRANSPORT PLATE",0,3.76,.24,0,0,-.2);j(Od,4.35,3.4,.16,0,0,0,P.metal,.06);for(let n of[-1.96,1.96])for(let t of[-1.45,1.45])ca(Od,n,t,.1,.07);function lo(n,t,e,i,s){let r=re(n,e,i,s);ne(r,t,.13,0,0,0,P.cream,40),ne(r,t*.38,.16,0,0,0,P.dark,24),ne(r,.055,.2,0,0,.02,P.chrome,16);for(let o=0;o<20;o++){let a=o*Math.PI/10;j(r,t*.15,t*.25,.12,Math.sin(a)*t,Math.cos(a)*t,0,P.cream,.008).rotation.z=-a}return $m.push(r),r}var eE=he("26 \xB7 CAPSTAN FLYWHEEL",.86,3.83,.52,.5,.35,.5);lo(eE,.7,0,0,0);var nE=he("27 \xB7 SUPPLY REEL DRIVE",-.86,3.83,.51,-.5,.35,.5);lo(nE,.48,0,0,0);var Sc=he("28 \xB7 CAPSTAN MOTOR / 9V DC",-1.42,2.65,.52,-1.05,-.8,.3);ne(Sc,.37,.76,0,0,0,P.metal,40);ne(Sc,.28,.06,0,0,.41,P.dark,30);lo(Sc,.17,0,0,.47);Dt(Sc,"9V DC",.49,.12,0,-.12,.4,{mono:!0});var Fd=he("29 \xB7 ELASTOMER DRIVE BELT",0,0,.75,0,0,.9);Qm(Fd,[[-1.6,2.64,0],[-1.58,2.38,0],[-1.22,2.44,0],[1.46,3.47,0],[1.49,4.01,0],[1.05,4.47,0],[.46,4.34,0],[-1.6,2.64,0]],.027,P.rubber,!0);var vd=j(Fd,.1,.06,.06,-1.48,2.43,0,P.metal,.01),Bd=he("30 \xB7 AUTO-REVERSE GEAR TRAIN",0,2.87,.56,.3,-.65,.6);lo(Bd,.32,-.55,0,0);lo(Bd,.25,.04,.15,0);lo(Bd,.36,.65,.1,0);var iE=he("31 \xB7 STEREO PLAYBACK HEAD",0,2.56,.87,0,-1.25,1.3),or=re(iE);j(or,1.9,.18,.37,0,0,0,P.dark,.025);j(or,.54,.39,.42,0,.17,0,P.chrome,.06);j(or,.32,.25,.025,0,.23,.222,P.dark,.008);for(let n of[-.77,.77])ne(or,.17,.26,n,.19,0,P.rubber,24),ne(or,.045,.32,n,.19,.02,P.chrome,16);Dt(Od,`C82 / TRANSPORT
DO NOT TOUCH`,1.65,.32,0,1.25,.095,{mono:!0});var wn=he("32 \xB7 AUDIO PCB / REV 03",0,3.84,-.77,2,1,-2.3);j(wn,10.55,4.24,.12,0,0,0,P.pcb,.04);for(let n=0;n<30;n++){let t=-4.8+n%15*.67,e=n<15?-.65:1.45;pn(wn,[t,e,.076],[t+.21,e-.3,.076],.013,P.copper),pn(wn,[t+.21,e-.3,.076],[t+.21,-1.77,.076],.013,P.copper)}for(let n=0;n<14;n++){let t=-4.5+n*.68,e=n%2?-.65:1.14;ne(wn,.125,.39,t,e,.25,P.dark,20),ne(wn,.118,.025,t,e,.46,P.metal,20),j(wn,.05,.18,.025,t,e,.478,P.black,.004)}for(let n=0;n<5;n++){let t=-3.7+n*1.8;j(wn,.8,.49,.2,t,.28,.2,P.black,.035);for(let e=0;e<6;e++)j(wn,.06,.18,.05,t-.3+e*.12,.59,.13,P.chrome,.006),j(wn,.06,.18,.05,t-.3+e*.12,-.03,.13,P.chrome,.006);Dt(wn,"C82-"+(41+n),.59,.115,t,.28,.307,{color:"#92998e",mono:!0})}for(let n=0;n<22;n++){let t=-4.7+n%11*.89,e=n<11?-1.46:1.75;pn(wn,[t-.18,e,.11],[t+.18,e,.11],.015,P.chrome),j(wn,.22,.07,.08,t,e,.15,n%3===0?P.orange:P.paper,.015)}Dt(wn,"C82 AUDIO SYSTEM   /   REV 03",3.95,.15,1.8,-1.95,.075,{mono:!0,color:"#d8d8b6"});var c0=de("#658966",.3,0,{emissive:"#7eab56",emissiveIntensity:.2});ne(wn,.07,.13,-4.8,1.8,.15,c0,16);var zd=he("33 \xB7 REGULATED POWER SUPPLY",4.9,2.09,-.39,1.7,-.7,-1.9);j(zd,1.85,1.39,1.1,0,0,0,P.dark,.09);j(zd,1.5,.7,1.14,0,0,0,P.metal,.03);Dt(zd,`TRANSFORMER
DC 9V`,1.12,.35,0,0,.58,{mono:!0,bg:"#c1b88f"});var sE=he("34 \xB7 SIGNAL WIRING LOOM",0,0,0,0,-.1,-.75);for(let n=0;n<3;n++)Qm(sE,[[-5,3+n*.06,.15],[-3,2.1+n*.12,-.3],[0,2.05+n*.07,-.8],[3.3,2.5+n*.1,-.4],[4.8,3.5+n*.06,.1]],.02,[P.orange,P.dark,P.paper][n]);var yd=he("35 \xB7 M3 ENCLOSURE SCREWS",0,0,0,0,.2,4);for(let[n,t]of Xl)Rd(yd,n,Be.position.y+t,1.585),ne(yd,.022,.27,n,Be.position.y+t,1.444,P.chrome,12);var Tc=document.createElement("canvas");Tc.width=128;Tc.height=512;var nr=Tc.getContext("2d");nr.fillStyle="#76503b";nr.fillRect(0,0,128,512);for(let n=0;n<110;n++){nr.strokeStyle=n%3?"rgba(35,18,10,.16)":"rgba(239,198,128,.18)",nr.beginPath();let t=n*1.19;nr.moveTo(t,0),nr.bezierCurveTo(t+Math.sin(n)*6,160,t-3,310,t+Math.cos(n)*4,512),nr.stroke()}var na=new ls(Tc);na.colorSpace=Ve;na.wrapS=na.wrapT=Ao;P.veneer=de("#ffffff",.7,.04,{map:na,transparent:!0,opacity:0,depthWrite:!1});P.grilleStripe=de("#c1c7bd",.36,.6,{transparent:!0,opacity:0,depthWrite:!1});for(let n of[Pd,Mc])j(n,.035,5.59,2.53,Math.sign(n.position.x)*.139,0,0,P.veneer,.025);for(let{grille:n}of so)for(let t=-8;t<=8;t++){let e=t*.205,i=2*Math.sqrt(1.83**2-e*e);j(n,i,.034,.025,0,e,.074,P.grilleStripe,.008)}P.caseWood=de("#d0a575",.78,.04,{map:na,transparent:!0,opacity:0,depthWrite:!1});var h0=new Ft(ha.geometry,P.caseWood);h0.position.z=.004;Be.add(h0);j(kn,14.134,.256,2.974,0,0,0,P.caseWood,.085);var uS=j(Yi,13.72,5.76,.006,0,0,-.124,P.caseWood,.02);P.future=de("#9bdfdc",.26,.5,{emissive:"#55aaa8",emissiveIntensity:.7,transparent:!0,opacity:0,depthWrite:!1});for(let{grille:n}of so)On(n,2.025,.018,0,0,.12,P.future);j(Be,4.5,.027,.018,0,2.84,.252,P.future,.006);for(let n of[-6.86,6.86])j(Be,.025,4.82,.018,n,0,.252,P.future,.006);var Pt=om({props:fe,group:re,box:j,label:Dt,rod:pn,screw:ca,interactive:Me,M:P,cassette:hr,disposeGroup:Dc}),u0=Pt.root,ys=Pt.anchors,fa=j(u0,2,.24,.08,0,6.03,1.6,P.dark);Me(fa,"archiveImport");var wc=Dt(u0,"+ LOCAL AUDIO",1.8,.15,0,6.03,1.65,{mono:!0,color:"#dedcca",res:256});Me(wc,"archiveImport");var d0=hr(fe,"SUMMER 1997","#bda061",.64);d0.position.set(-5.7,.266,4.65);d0.rotation.set(-Math.PI/2,0,-.2);for(let n=0;n<3;n++){let t=re(fe,-2.9+n*.17,.3+n*.17,4.9);t.rotation.y=-.35+n*.08,j(t,2.44,.14,1.59,0,0,0,n===1?P.dark:P.paper,.035);let e=Dt(t,["PLAY AFTER MIDNIGHT","FIELD NOTES  /  1992","SIDE B  /  TOKYO"][n],2.13,.24,0,.08,0,{mono:!0,color:n===1?"#ccc9b6":"#4c5348"});e.rotation.x=-Math.PI/2}var ur=re(fe,-7.5,.4,1.8);j(ur,1.23,.45,.75,0,0,0,P.orange,.06);var rE=j(ur,1.23,.09,.75,0,.43,-.28,P.orange,.04);rE.rotation.x=-.65;j(ur,.46,.045,.09,0,.63,-.37,P.dark,.01);for(let n=0;n<3;n++)pn(ur,[-.4+n*.35,.3,-.2],[-.25+n*.3,.31,.22],.025,P.chrome);j(ur,1.02,.08,.53,0,.25,0,P.dark,.025);j(ur,.14,.18,.045,0,.07,.399,P.metal,.014);for(let n of[-.42,.42])pn(ur,[n-.08,.24,-.38],[n+.08,.24,-.38],.037,P.metal);var dS=j(fe,1.43,.012,1.05,1.3,.177,6.05,P.paper,.005),oE=Dt(fe,`C-82
SERVICE MANUAL
TRANSPORT / REV.03`,1.2,.68,1.3,.185,6.05,{mono:!0});oE.rotation.x=-Math.PI/2;var Ms=re(fe),kd=[],Hd=[],Vd=[],Gd=[];for(let n of[-.29,.29]){let t=pn(Ms,[n,0,0],[n,1,0],.026,P.metal);kd.push(t),Hd.push(yc(Ms,.05,n,0,0,P.rubber)),Vd.push(j(fe,.14,.08,.24,0,Bi+.04,0,P.rubber,.015))}for(let n=0;n<ad.rungCount;n++)Gd.push(pn(Ms,[-.29,.18+n*.32,0],[.29,.18+n*.32,0],.025,P.chrome));var Im="";function Wd(n=.195*(1-ee.scale.y)){let t=hm(ee.scale.toArray(),n,P.caseWood.opacity>0?.004:0),e=t.length.toFixed(5)+":"+t.base[0].toFixed(5);e!==Im&&(Im=e,Gd.forEach(i=>i.visible=i.position.y<t.length-.12),Ms.position.fromArray(t.base),Ms.rotation.set(t.angle,0,0),kd.forEach((i,s)=>{i.scale.y=t.length,i.position.y=t.length/2,Hd[s].position.y=t.length,Vd[s].position.set(t.base[0]+(s?.29:-.29),Bi+.04,t.base[2])}))}Wd();function An(n,t,e,i,s="#b77143",r="stand",o=0){let a=re(n,t,e,i);a.rotation.y=o;let l=de(s,.88),c=de("#455354",.9),h=de("#c9ad89",.82),{body:u,head:d,arms:f,legs:m,shoes:_,hands:g}=um(a,{group:re,box:j,rod:pn,ball:yc},{cloth:l,pants:c,skin:h,dark:P.dark},r),p=ai.length,S=r==="work"||r==="carry";f.forEach(x=>x.rotation.x=S?-1.65:0);let M=ne(a,.155,.66,0,.32,0,new Je({visible:!1}),12,"y");return Me(M,"person",p),ai.push({g:a,body:u,head:d,arms:f,legs:m,shoes:_,hands:g,pose:r,base:a.position.clone(),angle:o,armBase:S?-1.65:0,activity:"idle",until:0,look:null,respond:p<3,phase:p*1.7}),a}var Xd=re(fe,...Zr.bench);j(Xd,1.2,.1,.53,0,.5,0,P.paper,.025);for(let n of[-.46,.46])for(let t of[-.16,.16])j(Xd,.085,.28,.085,n,.31,t,P.dark,.01);An(fe,...Zr.left,"#87968a","stand",-.3);An(fe,3.2,Bi,3.65,"#b56f42","stand",.2);An(Xd,...Zr.benchSitter,"#667883","sit",0);An(fe,-7.16,Bi,2.6,"#d2bc83","work",-.9);An(fe,...Zr.observer,"#a1a898","stand",-.4);var Yd=re(fe,8.15,0,7.35);j(Yd,.42,.3,.4,0,.32,0,P.paper,.025);for(let n of[.23,.34,.43])j(Yd,.44,.016,.415,0,n,0,P.metal,.004);An(Yd,...Zr.crateSitter,"#63776f","sit",0);An(fe,.15,Bi,5.2,"#98794f","work",2.5);var fS=j(Ms,.49,Ln.treadHeight,.19,0,Ln.treadY,0,P.dark,.006);for(let n of[-.065,0,.065])j(Ms,.43,.003,.008,0,Ln.rootY-.0015,n,P.rubber,.002);An(Ms,0,Ln.rootY,Ln.rootZ,"#bd663a","climb",Math.PI);An(kn,-2.72,.125,-.65,"#c0a975","stand",-.3);An(kn,-5.75,-.115,1.49,"#5f7477","sit",0);An(fe,-.9,Bi,3.38,"#788772","carry",-1.4);An(fe,.7,Bi,3.38,"#bb935f","carry",1.4);var aE=An(Pt.root,-3.6,0,1.9,"#98794f","work",1.1);aE.scale.setScalar(1/.64);ai.at(-1).archiveWorker=!0;var f0=An(Pt.root,1.8,7.06,-.7,"#75897b","work",0);f0.scale.setScalar(1/.64);ai.at(-1).archiveWorker=!0;j(f0,.33,.045,.25,0,.42,.22,P.paper,.008);function ci(n,t=null){let e=performance.now();ai.forEach((i,s)=>{if(i.archiveWorker&&(n==="archive"||n==="tape")){i.activity="point",i.until=e+3200,i.look=t||Pt.root.localToWorld(new w(0,3,3));return}if(i.pose==="climb"){i.activity="listen",i.until=e+1800,i.look=t;return}n==="tape"&&(i.pose==="work"||i.pose==="carry"||s<2)?(i.activity="point",i.until=e+2800,i.look=new w(0,3.5,2.5)):n==="service"?(i.activity="balance",i.until=e+4300,i.look=new w(0,5,0)):n==="play"&&i.respond?(i.activity="listen",i.until=e+2200):n==="knob"&&s<2&&(i.activity="listen",i.until=e+1300,i.look=t)})}function lE(n){let t=ai[n];t&&(t.activity=t.pose==="climb"?"listen":"wave",t.until=performance.now()+2400,t.look=Wt.position.clone())}var cE=hr(fe,"FIELD RECORDINGS","#ad8658",.38);cE.position.set(-.1,.62,3.48);var pa=re(fe,-2.44,.772,4.81);ne(pa,.065,.12,0,0,0,P.cream,24,"y");ne(pa,.051,.008,0,.055,0,P.tape,24,"y");On(pa,.056,.009,0,.061,0,P.cream).rotation.x=-Math.PI/2;On(pa,.035,.011,.074,.002,0,P.cream);var qd=re(fe,1.17,.19,4.84);j(qd,1.35,.035,.48,0,0,0,P.metal,.045);for(let n of[-.23,.23])j(qd,1.31,.06,.025,0,.025,n,P.metal,.01);pn(fe,[-6.9,.23,2.1],[-6.4,.23,2.4],.019,P.chrome);pn(fe,[-6.45,.23,2.37],[-6.26,.23,2.49],.04,P.orange);for(let n=0;n<5;n++){let t=re(qd,-.43+n*.2,.045,n%2*.12-.06);t.rotation.x=-Math.PI/2,ca(t,0,0,0,.035)}var Ac=re(fe,7.9,.178,-3.05);Ac.rotation.y=.5;var pS=j(Ac,1.6,.96,.018,0,.48,0,P.paper,.014),hE=j(Ac,1.6,.96/Math.cos(.38),.018,0,.48,-.48*Math.tan(.38),P.paper,.01);hE.rotation.x=.38;Dt(Ac,`FIELD GUIDE
DRAG TAPES TO THE DOOR
PULL THE ADVERT CORNER
TOP SLIDERS \xB7 CLICK / DRAG
1\u20134 \xB7 FOCUS  /  ESC \xB7 BACK`,1.39,.75,0,.49,.015,{mono:!0});vi.scale.y=Gl("studio").antenna;var ro="studio",Jo=!1,p0=0,fn="overview",Zd=re(fe,-4.28,Bi+cd/2,7.74);Zd.rotation.x=-Math.PI/2;Zd.rotation.z=.016;var m0=[],uE=[],ri=[],us=[tr.length-1,...tr.slice(0,-1).map((n,t)=>t)],Vi=!1;function dE(n){let t=new Map,e=[];function i(u){if(t.has(u))return t.get(u);let d=u.clone();for(let[f,m]of Object.entries(n.colors))u===P[f]&&d.color.set(m);return u===P.silver&&(d.roughness=n.roughness,d.metalness=n.metalness),u===P.veneer&&(d.opacity=n.wood||0),u===P.caseWood&&(d.opacity=n.caseWood||0),u===P.future&&(d.opacity=n.future||0),u===P.grilleStripe&&(d.opacity=n.stripes||0,d.color.set(n.colors.edge)),t.set(u,d),d}function s(u,d=!1){if(d=d||["night","metro","lagoon","olive","coral","timber"].includes(n.id)&&[Be,kn,...Object.values(Ye).map(m=>m.part)].includes(u),u.isMesh&&u.material.visible===!1)return null;let f;if(u.isInstancedMesh?(f=new No(u.geometry,i(u.material),u.count),f.instanceMatrix.copy(u.instanceMatrix)):u.isMesh?f=new Ft(u.geometry,Array.isArray(u.material)?u.material.map(i):i(u.material)):f=new ti,d&&u.userData.setInk&&u!==bc&&u.material?.map){let m=document.createElement("canvas"),_=u.material.map.image;m.width=_.width,m.height=_.height;let g=m.getContext("2d");g.drawImage(_,0,0),g.globalCompositeOperation="source-in",g.fillStyle="#d9dfd1",g.fillRect(0,0,m.width,m.height);let p=new ls(m);p.colorSpace=Ve,f.material=f.material.clone(),f.material.map=p,e.push({texture:p,material:f.material})}f.position.copy(u.position),f.quaternion.copy(u.quaternion),f.scale.copy(u.scale),f.visible=u===qe?!0:u.visible,u===vi&&(f.scale.y=n.antenna),u===xi&&(f.scale.y=n.handle);for(let m of u.children){let _=s(m,d);_&&f.add(_)}return f}let r=new Ws;r.background=new Yt("#ded8c7"),r.environment=Qe.environment,r.environmentIntensity=.45;let o=s(ee);o.scale.fromArray(n.scale),r.add(o),r.add(new Wo(16774623,6975849,1.2));let a=new Xr(16775399,2.5);a.position.set(-8,15,13),r.add(a);let l=new tn(33,2,.1,80);l.position.set(13,10,27),l.lookAt(0,5.1,0);let c=new xn(400,200,{depthBuffer:!0});c.texture.colorSpace=Ve;let h=ce.getRenderTarget();ce.setRenderTarget(c),ce.render(r,l),ce.setRenderTarget(h);for(let u of t.values())u.dispose();for(let{texture:u,material:d}of e)u.dispose(),d.dispose();return uE.push(c),c.texture}function g0(n){return{x:n*.1,y:n*.01,z:(tr.length-1-n)*Yl,angle:-n*.018}}function fE(n,t){let e=g0(t);n.group.position.set(e.x,e.y,e.z),n.group.rotation.z=e.angle}for(let[n,t]of tr.entries()){let e=re(Zd);j(e,6.65,2.64,cd,0,0,0,de(["#e6dfc9","#e9daca","#d8dfd9","#e0ddd2"][n],.89),.009),Dt(e,"CASSETTE WORLD",2.68,.22,-1.66,1.02,.018,{weight:800}),Dt(e,t.title+"  /  "+t.year,2.9,.105,1.58,1.01,.018,{mono:!0}),j(e,6.1,.012,.006,0,.82,.017,P.dark,0);for(let[c,h]of t.styles.entries()){let u=Gl(h),d=(c-1)*2.12,f=new Ft(new ni(1.99,1),new Je({map:dE(u),toneMapped:!1}));f.position.set(d,.18,.02),e.add(f),Me(f,"style",u.id);let m=Dt(e,u.model+"  "+u.name,1.99,.13,d,-.48,.02,{weight:700});Me(m,"style",u.id);let _=Dt(e,u.detail,1.99,.075,d,-.67,.02,{mono:!0});Me(_,"style",u.id),m0.push({picture:f,name:m,style:u,pageIndex:n})}Dt(e,String(n+1).padStart(2,"0")+" / "+String(tr.length).padStart(2,"0")+"  \u2022  CHOOSE YOUR EDITION",3.9,.1,-1.04,-1.07,.02,{mono:!0});let i=re(e,2.77,-1,.023),s=new Ys;s.moveTo(-.38,-.2),s.lineTo(.4,-.2),s.lineTo(.4,.35),s.closePath();let r=new Ft(new Al(s),new Je({color:["#ac7350","#628982","#808791","#688e8f"][n],side:Dn}));i.add(r),Me(i,"adNext");let o=Dt(e,"PULL NEXT \u2197",1.33,.115,2.07,-1.055,.027,{mono:!0});Me(o,"adNext");let a=Dt(e,"SELECTED",.81,.12,-2.12,-.85,.022,{mono:!0,color:"#9a4c2c"}),l={group:e,stamp:a,corner:i,styles:t.styles};fE(l,us.indexOf(n)),ri.push(l)}function _0(){for(let n of ri){let t=n.styles.indexOf(ro);n.stamp.visible=t>=0,n.stamp.position.x=(t-1)*2.12}}_0();async function pE(){if(Lt||Vi)return;Vi=!0,zn("paper");let n=ri[us[1]],t=n.group.position.clone();await ki(430,o=>{n.group.position.y=vt.lerp(t.y,-3.03,nn(o)),n.group.position.x=vt.lerp(t.x,.34,nn(o))}),await ki(170,o=>{n.group.position.z=vt.lerp(t.z,(tr.length-1)*Yl+.2,nn(o)),n.group.rotation.z=vt.lerp(-.018,-.055,nn(o))});let e=ri[us[0]],i=us.slice(2).map(o=>({page:ri[o],z:ri[o].group.position.z})),s=e.group.position.clone();await ki(380,o=>{e.group.position.y=vt.lerp(s.y,-3.03,nn(o))}),await ki(170,o=>{e.group.position.z=vt.lerp(s.z,0,nn(o));for(let a of i)a.page.group.position.z=a.z+Yl*nn(o)}),us=pm(us);let r=us.map((o,a)=>({page:ri[o],from:ri[o].group.position.clone(),angle:ri[o].group.rotation.z,to:g0(a)}));await ki(620,o=>{let a=nn(o);for(let l of r)l.page.group.position.set(vt.lerp(l.from.x,l.to.x,a),vt.lerp(l.from.y,l.to.y,a),vt.lerp(l.from.z,l.to.z,a)),l.page.group.rotation.z=vt.lerp(l.angle,l.to.angle,a)}),Vi=!1,ce.shadowMap.needsUpdate=!0}var Md=[];for(let n of[Be,kn,...Object.values(Ye).map(t=>t.part)])n.traverse(t=>{t.userData.setInk&&t!==bc&&t!==l0&&Md.push(t)});var Zo=new Yt("#26312e"),Dm=0;async function x0(n){let t=Gl(n);if(n===ro&&!Jo)return;if(Lt||Jo||Vi){se("WAIT FOR MECHANISM");return}if(me&&await Rs(),me||Lt)return;Jo=!0,Lt=!0,Ne="TRANSITION",ci("service"),zn("service-open");let e=ee.scale.clone(),i=new w(...t.scale),s=vi.scale.y,r=xi.scale.y,o=P.veneer.opacity,a=P.grilleStripe.opacity,l=P.caseWood.opacity,c=P.future.opacity,h=Object.fromEntries(Object.keys(t.colors).map(_=>[_,P[_].color.clone()])),u=P.silver.roughness,d=P.silver.metalness,f=Zo.clone(),m=new Yt(["night","metro","lagoon","olive","coral","timber"].includes(n)?"#e7e7d9":"#26312e");ws(xs.clone(),new w(0,3.65,0),1200),await ki(2200,_=>{let g=nn(_);ee.scale.lerpVectors(e,i,g),p0=.195*(1-ee.scale.y),Wd(),vi.scale.y=vt.lerp(s,t.antenna,g),xi.scale.y=vt.lerp(r,t.handle,g),P.caseWood.opacity=vt.lerp(l,t.caseWood||0,g),P.future.opacity=vt.lerp(c,t.future||0,g),P.veneer.opacity=vt.lerp(o,t.wood||0,g),P.grilleStripe.opacity=vt.lerp(a,t.stripes||0,g),P.grilleStripe.color.copy(P.edge.color);for(let[p,S]of Object.entries(t.colors))P[p].color.copy(h[p]).lerp(new Yt(S),g);if(P.silver.roughness=vt.lerp(u,t.roughness,g),P.silver.metalness=vt.lerp(d,t.metalness,g),performance.now()-Dm>80){Zo.copy(f).lerp(m,g);for(let p of Md)p.userData.setInk("#"+Zo.getHexString());Dm=performance.now()}}),Zo.copy(m);for(let _ of Md)_.userData.setInk("#"+Zo.getHexString());ro=n,Y1.userData.setText(t.model),e0.userData.setText(`CASSETTE SYSTEM ${t.model}
DC 9V  \xB7  6 \xD7 R20 / D
SERIAL 008417
MADE FOR CASSETTE WORLD`),_0(),Jo=!1,Lt=!1,Ne="OVERVIEW",yn=!1,fn="overview",zn("service-close"),ce.shadowMap.needsUpdate=!0}var mE=new Set([...kd,...Hd,...Vd,...Gd,Ld.tab,Ud.tab,Nd.tab,vd,...ai.map(n=>n.head),...rr.userData.spool.map(n=>n.wound)]);function Kd(n){for(let e of[...n.children])e.isGroup&&Kd(e);let t=new Map;for(let e of n.children){if(!e.isMesh||e.isInstancedMesh||e.userData.action||e.userData.dynamic||mE.has(e)||e.material.map||e.material.transparent||Array.isArray(e.material)||!e.visible)continue;let i=e.material.uuid;t.has(i)||t.set(i,[]),t.get(i).push(e)}for(let e of t.values()){if(e.length<2)continue;let i=e.map(o=>(o.updateMatrix(),(o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone()).applyMatrix4(o.matrix))),s=wm(i,!1);if(i.forEach(o=>o.dispose()),!s)continue;let r=new Ft(s,e[0].material);r.castShadow=!0,r.receiveShadow=!0,n.add(r),e.forEach(o=>{n.remove(o),o.geometry.dispose()})}}var pd=new Map;fe.traverse(n=>{if(!n.isMesh)return;let t=n;for(;t;){if(t===Pt.root)return;t=t.parent}let e=i=>Object.values(P).includes(i)?(pd.has(i)||pd.set(i,i.clone()),pd.get(i)):i;n.material=Array.isArray(n.material)?n.material.map(e):e(n.material)});Kd(ee);Kd(fe);if(qn){let n=new Je({visible:!1});for(let[t,e]of Object.entries(ps)){let i=new Ft(new bn(.57,.58,.2),n);i.position.z=.08,e.add(i),Me(i,"button",t)}for(let[t,e]of Object.entries(Ye)){let i=new Ft(new Xs(e.radius*1.35,e.radius*1.35,.24,12),n);i.rotation.x=Math.PI/2,i.position.z=.1,e.part.add(i),Me(i,"knob",t)}for(let[t,e]of vc.entries()){let i=new Ft(new bn(.43,.31,.13),n);e.add(i),Me(i,"eq",t)}}var zt=new Audio;zt.preload="metadata";var B={currentTrack:-1,currentTime:0,duration:0,playing:!1,paused:!1,volume:.68,muted:!1,shuffle:!1,repeatMode:"off",playbackRate:1,playlist:[],bass:0,treble:0,stereoMono:!1,eq:[0,0,0,0,0]},ia,li=0,ye=null,ze,Lm,fc,hs,jo,Qo,to,ds,ac,lc,rc;var Jr;var md=new Uint8Array(256),gE=new Uint8Array(512),_E=new Uint8Array(512),Ne="INTRO",Re="NO_TAPE",yn=!1,me=!1,Lt=!1,Te=!1,Wi="",Tn=0,Ed=!1,v0="",y0=0,Nt=null,er=null,Es=performance.now(),M0=performance.now(),ir=!1,zi=0,jr=0,ta=0,$r=0,Um=0,cc=0,Nm="",hc=[];function Bn(n){return new Promise(t=>Rc(n,()=>{},t))}function ki(n,t){return new Promise(e=>Rc(n,t,e))}function Rc(n,t,e,i=0){hc.push({start:performance.now()+i,duration:Math.max(1,n),update:t,complete:e})}var nn=n=>n*n*(3-2*n),E0=n=>1-(1-n)**3;function se(n,t=1800){v0=n,y0=performance.now()+t}function b0(){if(ze)return;ze=new(window.AudioContext||window.webkitAudioContext),Lm=ze.createMediaElementSource(zt),fc=[60,250,1e3,4e3,12e3].map((t,e)=>{let i=ze.createBiquadFilter();return i.type=e===0?"lowshelf":e===4?"highshelf":"peaking",i.frequency.value=t,i.Q.value=.8,i}),jo=ze.createBiquadFilter(),jo.type="lowshelf",jo.frequency.value=160,Qo=ze.createBiquadFilter(),Qo.type="highshelf",Qo.frequency.value=6e3,to=ze.createGain(),to.channelCount=2,to.channelCountMode="explicit",Jr=ze.createGain(),Jr.channelCountMode="explicit",Jr.channelInterpretation="speakers",Jr.channelCount=2,ds=ze.createAnalyser(),ds.fftSize=512,ds.smoothingTimeConstant=.8,ac=ze.createAnalyser(),lc=ze.createAnalyser(),ac.fftSize=lc.fftSize=512,rc=ze.createChannelSplitter(2),ia=mm(ze),hs=ze.createDynamicsCompressor(),hs.threshold.value=-1,hs.knee.value=0,hs.ratio.value=12,hs.attack.value=.004,hs.release.value=.09;let n=[Lm,...fc,jo,Qo,Jr,to,hs,ds];n.forEach((t,e)=>{e<n.length-1&&t.connect(n[e+1])}),ds.connect(ze.destination),ds.connect(rc),rc.connect(ac,0),rc.connect(lc,1),Ts()}function Ts(){if(Mn(),!ze)return;ia?.setVolume(B.muted?0:B.volume),Jr.channelCount=B.stereoMono?1:2;let n=ze.currentTime;fc.forEach((t,e)=>t.gain.setTargetAtTime(B.eq[e],n,.025)),jo.gain.setTargetAtTime(B.bass,n,.025),Qo.gain.setTargetAtTime(B.treble,n,.025),to.gain.setTargetAtTime(B.muted?0:Math.pow(B.volume,1.7),n,.025)}function bd(n){B.volume=vt.clamp(n,0,1),Ye.volume.value=B.volume,Ts(),se(`VOLUME ${Math.round(n*100)}`)}function S0(){B.muted=!B.muted,Ts(),se(B.muted?"SPEAKERS OFF":"SPEAKERS ON")}function ma(){b0(),ze.state==="suspended"&&ze.resume().catch(()=>{})}function zn(n){ia&&ia.play(n)}function Xi(n){let t=ps[n];t&&(t.userData.pulse=performance.now()+160,zn("key"))}function eo(n=!0){Lt||performance.now()<Pm||(Pm=performance.now()+260,vn(n),Ss.visible=n&&!Te,fa.visible=yn,wc.visible=yn,Re=n?"EJECTED":Te?"TAPE_LOADED":"NO_TAPE",Xi("stop"))}function $d(){Lt||(li++,zt.pause(),B.paused=!1,eo(!je),Re=je?"EJECTED":"STOPPED")}async function yi(){if(Lt)return;let n=++li;if(!Te){if(B.playlist.length){await _a(0,!0);return}eo(!0),pc();return}if(Wi="",b0(),await ze.resume(),je&&(vn(!1),await Bn(650)),!(!Te||Lt||n!==li)){try{await zt.play(),ci("play")}catch{se("PRESS PLAY TO RESUME")}Xi("play")}}function Cc(){li++,zt.pause(),B.paused=!0,Re="PAUSED",Xi("pause")}function Jd(){if(li++,Lt){zt.pause(),mi(0),B.paused=!1,Re="STOPPED",Xi("stop");return}if(!B.playing&&!B.paused&&zt.currentTime<.08){$d();return}zt.pause(),mi(0),B.paused=!1,Re="STOPPED",Xi("stop")}function mi(n){!Te||!Number.isFinite(zt.duration)||(zt.currentTime=vt.clamp(n,0,zt.duration),B.currentTime=zt.currentTime,Mn())}function T0(n){Tn||!Te||Lt||(Ed=!zt.paused,Tn=n,zt.pause(),Re=n>0?"FAST_FORWARD":"REWIND",Xi(n>0?"ff":"rew"))}function ga(){Tn&&(Tn=0,Re=Ed?"PLAYING":B.paused?"PAUSED":"STOPPED",Ed&&yi())}async function jd(){Lt||!Te||(li++,Lt=!0,zt.pause(),B.paused=!1,Re="TRANSITION",ci("tape"),vn(!0),await Bn(650),await tf(B.currentTrack),Te=!1,qe.visible=!1,qe.position.copy(qe.userData.part.base),zt.removeAttribute("src"),zt.load(),B.currentTrack=-1,B.currentTime=0,B.duration=0,B.playing=!1,Lt=!1,Ss.visible=!0,Re="EJECTED",Wi="",Pt.refresh(null),Mn(),"mediaSession"in navigator&&(navigator.mediaSession.metadata=null,navigator.mediaSession.playbackState="none"))}function w0(n=1){let t=B.playlist.length;if(t<2)return 0;if(B.shuffle){let e;do e=Math.floor(Math.random()*t);while(e===B.currentTrack);return e}return(B.currentTrack+n+t)%t}function ar(n=1){if(!(Lt||!B.playlist.length)){if(n<0&&zt.currentTime>3){mi(0),Xi("prev");return}Xi(n>0?"next":"prev"),_a(w0(n),!zt.paused)}}function Qd(n){return n==="stereo"?Number(B.stereoMono):n==="shuffle"?Number(B.shuffle):["off","one","all"].indexOf(B.repeatMode)}function Sd(n,t){let e=Ec[n];e&&(t=Math.max(0,Math.min(e.states.length-1,t)),Qd(n)!==t&&(n==="stereo"?(B.stereoMono=t===1,Ts(),se(t?"MONO OUTPUT":"STEREO OUTPUT")):n==="shuffle"?(B.shuffle=t===1,se(t?"PLAY ORDER / SHUFFLE":"PLAY ORDER / IN ORDER")):(B.repeatMode=["off","one","all"][t],se("TAPE LOOP / "+["OFF","ONE TRACK","ALL TAPES"][t])),zn("detent"),ci("knob"),Mn()))}function xE(n,t){let e=Ec[n];e.group.updateWorldMatrix(!0,!1);let i=[-.47,.47].map(s=>D0(e.group.localToWorld(new w(s,.13,.05))));Sd(n,dm({x:t.clientX,y:t.clientY},...i,e.states.length))}function A0(n){if("mediaSession"in navigator)try{navigator.mediaSession.metadata=new MediaMetadata({title:n.title,artist:n.artist,album:n.album,artwork:n.cover?[{src:n.cover}]:[]})}catch{}}for(let n of["play","pause","timeupdate","durationchange","ratechange","volumechange","ended"])zt.addEventListener(n,()=>{if(B.playing=!zt.paused&&!zt.ended,B.currentTime=zt.currentTime,B.duration=Number.isFinite(zt.duration)?zt.duration:0,B.playbackRate=zt.playbackRate,n==="play"&&(B.paused=!1,Re="PLAYING"),n==="pause"&&!Tn&&Re==="PLAYING"&&(B.paused=!0,Re="PAUSED"),n==="durationchange"&&B.currentTrack>=0){let t=B.playlist[B.currentTrack];t.duration=B.duration}if("mediaSession"in navigator){navigator.mediaSession.playbackState=zt.paused?"paused":"playing";try{B.duration&&navigator.mediaSession.setPositionState({duration:B.duration,playbackRate:zt.playbackRate,position:Math.min(B.currentTime,B.duration)})}catch{}}});zt.addEventListener("ended",()=>{B.paused=!1,B.repeatMode==="one"?(mi(0),yi()):B.shuffle||B.currentTrack<B.playlist.length-1||B.repeatMode==="all"?_a(w0(1),!0):Re="STOPPED"});zt.addEventListener("error",()=>{Wi=zt.error?.code===4?"UNSUPPORTED AUDIO CODEC":"TAPE ERROR",zt.pause(),vn(!0),Re="EJECTED"});if("mediaSession"in navigator)for(let[n,t]of Object.entries({play:yi,pause:Cc,stop:()=>{li++,zt.pause(),mi(0),B.paused=!1,Re="STOPPED"},previoustrack:()=>ar(-1),nexttrack:()=>ar(1),seekbackward:e=>mi(zt.currentTime-(e.seekOffset||10)),seekforward:e=>mi(zt.currentTime+(e.seekOffset||10)),seekto:e=>mi(e.seekTime)}))try{navigator.mediaSession.setActionHandler(n,t)}catch{}function gd(n){if(!n.length)return"";let t=n[0];try{return new TextDecoder(t===1?"utf-16":t===2?"utf-16be":t===3?"utf-8":"iso-8859-1").decode(n.slice(1)).replace(/\0/g,"").trim()}catch{return""}}async function vE(n,t){try{let e=new Uint8Array(await n.slice(0,524288).arrayBuffer());if(String.fromCharCode(...e.slice(0,3))!=="ID3")return;let i=e[3];if(i!==3&&i!==4)return;let s=10;for(;s+10<e.length;){let r=String.fromCharCode(...e.slice(s,s+4));if(!/^[A-Z0-9]{4}$/.test(r))break;let o=e.slice(s+4,s+8),a=i===4?(o[0]&127)<<21|(o[1]&127)<<14|(o[2]&127)<<7|o[3]&127:o[0]*16777216+o[1]*65536+o[2]*256+o[3];if(a<=0||s+10+a>e.length)break;let l=e.slice(s+10,s+10+a);if(r==="TIT2"&&(t.title=gd(l)||t.title),r==="TPE1"&&(t.artist=gd(l)||t.artist),r==="TALB"&&(t.album=gd(l)||t.album),r==="APIC"){let c=1;for(;c<l.length&&l[c]!==0;)c++;let h=new TextDecoder().decode(l.slice(1,c));c+=2;let u=l[0]===1||l[0]===2?2:1;for(;c+u<=l.length&&(l[c]!==0||u===2&&l[c+1]!==0);)c+=u;c+=u,["image/jpeg","image/png","image/webp"].includes(h)&&c<l.length&&l.length-c<=2*1024*1024&&(t.artworkBlob=new Blob([l.slice(c)],{type:h}),t.cover=URL.createObjectURL(t.artworkBlob))}s+=10+a}}catch{}}var _d=Promise.resolve();function R0(n){let t=[...n];return _d=_d.then(()=>ME(t)).catch(()=>se("AUDIO IMPORT ERROR",3500)),_d}function yE(n){return new Promise((t,e)=>{let i=new Audio,s=setTimeout(()=>r(new Error("AUDIO LOAD TIMEOUT")),1e4);function r(o){clearTimeout(s);let a=i.duration;i.onloadedmetadata=i.onerror=null,i.removeAttribute("src"),i.load(),o?e(o):t(Number.isFinite(a)?a:0)}i.onloadedmetadata=()=>r(),i.onerror=()=>r(new Error("UNSUPPORTED AUDIO CODEC")),i.preload="metadata",i.src=n})}async function ME(n){await HE;let t=n.filter(_m);if(!t.length){se("AUDIO FILES ONLY",3500);return}navigator.storage?.persist&&navigator.storage.persist().catch(()=>{});let e=B.playlist.length,i=0,s=0;for(let o of t){let a,l;try{se("READING / "+o.name.slice(0,22),15e3),await new Promise(m=>setTimeout(m,0));let c=await xm(o);a=URL.createObjectURL(c.blob);let h=c.duration||await yE(a),u=_f(o,h);if(B.playlist.some(m=>m.fingerprint===u)){s++,URL.revokeObjectURL(a);continue}l={id:crypto.randomUUID?.()||String(Date.now()+Math.random()),title:o.name.replace(/\.[^.]+$/,""),artist:"UNKNOWN ARTIST",album:"LOCAL TAPES",duration:h,format:o.name.split(".").pop().toUpperCase(),fileSize:o.size,size:o.size,mimeType:c.blob.type,audioBlob:c.blob,originalBlob:c.converted?o:null,artworkBlob:null,cover:null,objectURL:a,fingerprint:u,fileName:o.name,lastModified:o.lastModified,createdAt:Date.now(),updatedAt:Date.now(),converted:c.converted,labelStyle:Pc[B.playlist.length%5]},await vE(o,l),await gf(o,l);let d=B.playlist.find(m=>Si(m)===Si(l));d?.labelStyle&&(l.labelStyle=d.labelStyle);let f=B.playlist.find(m=>m.sourceRequired&&(m.fileName===o.name||m.title===l.title));if(f?(l.id=f.id,l.createdAt=f.createdAt,l.cabinetSlot=f.cabinetSlot):l.cabinetSlot=zc(B.playlist,l),un.db)try{await un.putTrack(l)}catch(m){throw Nc(m),m}if(f){let m=B.playlist.indexOf(f);f.cover&&URL.revokeObjectURL(f.cover),B.playlist[m]=l,se("SOURCE RESTORED",4e3)}else B.playlist.push(l);if(Pt.rebuild(B.playlist,cr()),B.playlist.length-e<=3){Pt.reveal(B.playlist.length-1);let m=ys.at(-1);if(m){let _=m.position.y;m.position.y+=.8,Rc(280,g=>m.position.y=_+.8*(1-E0(g)))}await Bn(300)}}catch(c){a&&URL.revokeObjectURL(a),l?.cover&&URL.revokeObjectURL(l.cover),i++,Wi=c.name==="QuotaExceededError"?"ARCHIVE FULL":String(c.message||"AUDIO FILE ERROR")}}let r=B.playlist.length-e;if(Pt.refresh(cr()),Mn(),of(),r){if(se(`${r} ARCHIVED${i?" / "+i+" SKIPPED":""}`,4e3),!Te){for(;Lt;)await Bn(100);await _a(e,!1),se("ARCHIVED / PRESS PLAY",4500)}}else se(s?"TAPE EXISTS":Wi||"UNSUPPORTED AUDIO CODEC",5e3)}var vs=document.querySelector("#files");vs.accept=gm;vs.addEventListener("change",()=>{ma(),R0(vs.files),vs.value=""});var Pc=["#c9b779","#a0b4a8","#c59172","#a8a6b8","#d1c7b2"];function Ic(n){return ee.updateMatrixWorld(!0),ee.worldToLocal(Pt.position(n))}async function De(n,t,e,i=null,s=null,r=0){let o=n.position.clone(),a=n.scale.x,l=n.rotation.x,c=n.rotation.y;await ki(e,h=>{let u=nn(h);n.position.lerpVectors(o,t,u),n.rotation.y=vt.lerp(c,r,u),i!==null&&n.scale.setScalar(vt.lerp(a,i,u)),s!==null&&(n.rotation.x=vt.lerp(l,s,u))})}async function tf(n){Pt.reveal(n),await Bn(350);let t=hr(ee,B.playlist[n].title,Pc[n%5]);t.position.copy(qe.position),qe.visible=!1;let e=Ic(n),i=9.2;zn("tape-out"),await De(t,new w(t.position.x,t.position.y,i),360),await De(t,new w(e.x,Math.max(e.y+1.8,6.6,t.position.y),i),480,.49),await De(t,new w(e.x,e.y+1.5,e.z),250),await De(t,e,300,.34*Pt.root.scale.x,-Math.PI/2,Pt.root.rotation.y),ys[n].visible=!0,ee.remove(t),Dc(t)}async function _a(n,t=!1){if(Lt||!B.playlist[n])return;if(!la(n)){se("SOURCE REQUIRED",4500);return}if(Te&&n===B.currentTrack){t&&yi();return}let e=++li;Lt=!0,zt.pause(),B.paused=!1,Re="TRANSITION",Ne=me?"DISASSEMBLY":"TRANSITION",ci("tape"),vn(!0),await Bn(650),Te&&await tf(B.currentTrack),Pt.reveal(n),await Bn(350);let i=qe.userData.part.base.clone().add(me?qe.userData.part.offset:new w),s=Ic(n),r=9.2,o=Math.max(s.y+1.5,6.6,i.y+.4),a=hr(ee,B.playlist[n].title,Pc[n%5],.34*Pt.root.scale.x);a.rotation.y=Pt.root.rotation.y,a.rotation.x=-Math.PI/2,a.position.copy(s),ys[n].visible=!1,await De(a,new w(s.x,o,s.z),260,.49,0),await De(a,new w(s.x,o,r),220),await De(a,new w(i.x,o,r),410,1),await De(a,new w(i.x,i.y,r),180),await C0(n,a,i,t,e)}async function C0(n,t,e,i,s){zn("tape-in"),await De(t,e,440),ee.remove(t),Dc(t),qe.position.copy(e),Te=!0,qe.visible=!0,B.currentTrack=n;let r=B.playlist[n];if(rr.userData.titleLabel.userData.setText(r.title.toUpperCase()),zt.src=la(n),zt.load(),Pt.refresh(r.id),Mn(),Wi="",Ss.visible=!1,A0(r),vn(!1),await Bn(650),Lt=!1,Ne=me?"DISASSEMBLY":"FOCUS",Wi){Re="EJECTED",vn(!0);return}Re="TAPE_LOADED",i&&s===li&&yi()}var dr=re(ee,0,3.59,5.08);dr.visible=!1;var P0=de("#b9be92",.7,0,{emissive:"#637047",emissiveIntensity:.2});for(let n of[-1.95,1.95])j(dr,.035,2.52,.025,n,0,0,P0,.006);for(let n of[-1.25,1.25])j(dr,3.94,.035,.025,0,n,0,P0,.006);var I0=Dt(dr,"RELEASE TO LOAD",3.8,.21,0,1.52,.025,{mono:!0,color:"#425137",bg:"#e2e4cb"});function D0(n){let t=n.project(Wt);return{x:(t.x+1)*innerWidth/2,y:(1-t.y)*innerHeight/2}}function EE(){ee.updateWorldMatrix(!0,!1);let n=[[-2.65,1.9],[2.65,1.9],[-2.65,5.6],[2.65,5.6]].map(([t,e])=>D0(ee.localToWorld(new w(t,e,1.7))));return{minX:Math.min(...n.map(t=>t.x)),maxX:Math.max(...n.map(t=>t.x)),minY:Math.min(...n.map(t=>t.y)),maxY:Math.max(...n.map(t=>t.y))}}function bE(n){if(Lt||me||Vi||!ys[n]?.visible||!la(n))return se(me?"ASSEMBLE BEFORE DRAGGING":"WAIT FOR MECHANISM"),!1;ke=null,Ot.enabled=!1;let t=hr(ee,B.playlist[n].title,Pc[n%5],.34*Pt.root.scale.x);t.rotation.x=-Math.PI/2,t.position.copy(Ic(n)),ye={index:n,object:t,target:t.position.clone(),ready:!1,readySince:0,doorWasOpen:je>0,wasPlaying:B.playing,wasPaused:B.paused,transport:Re,scene:Ne,intent:++li,finishing:!1,lifted:!1,pointer:null,planeZ:Math.max(5.3,t.position.z+1),savedPosition:Wt.position.clone(),savedTarget:Ot.target.clone()};let e=ye,i=t.position.clone();return e.pickup=(async()=>{await De(t,new w(i.x,i.y+1.5,i.z),170,.49,0),await De(t,new w(i.x,i.y+1.5,e.planeZ),160),e.lifted=!0})(),ys[n].visible=!1,Lt=!0,Ne="TAPE_DRAG",_s.visible=!1,gs.visible=!1,dr.visible=!0,I0.userData.setText("DRAG HERE TO LOAD"),ci("tape"),se("DRAG TAPE TO THE CASSETTE DOOR",4e3),!0}function ef(n){let t=ye;if(!t||t.finishing)return;t.pointer={clientX:n.clientX,clientY:n.clientY},gc.set(n.clientX/innerWidth*2-1,-n.clientY/innerHeight*2+1),mc.setFromCamera(gc,Wt),ee.updateWorldMatrix(!0,!1);let e=mc.ray.clone().applyMatrix4(ee.matrixWorld.clone().invert()),i=new w;e.intersectPlane(new In(new w(0,0,1),-t.planeZ),i)&&t.target.set(vt.clamp(i.x,-9.5,12.5),vt.clamp(i.y,1.65,10),t.planeZ);let r=ee.worldToLocal(Wt.position.clone()),o=r.z>2.4&&fm({x:n.clientX,y:n.clientY},EE(),t.ready);o!==t.ready&&(t.ready=o,dr.visible=!0,I0.userData.setText(o?"RELEASE TO LOAD":"DRAG HERE TO LOAD"),o?(t.readySince=performance.now(),zt.pause(),vn(!0),Re="TRANSITION",se("RELEASE TO LOAD",5e3),zn("detent")):(vn(t.doorWasOpen),se("RELEASE OUTSIDE TO RETURN",2500))),o&&t.target.set(0,3.59,5.3),dn.style.cursor=o?"copy":"grabbing"}async function xa(n=!1){let t=ye;if(!t||t.finishing)return;t.finishing=!0,dr.visible=!1,dn.style.cursor="grab";let e=Ue?.id;if(Ue=null,Nt=null,Ot.enabled=!0,e!==void 0){Gi.delete(e);try{dn.releasePointerCapture(e)}catch{}}try{if(await t.pickup,n&&t.ready){vn(!0),zt.pause(),B.paused=!1,Re="TRANSITION",await De(t.object,new w(-3.2,6.55,5.3),360,1),await Bn(Math.max(0,650-(performance.now()-t.readySince))),Te&&await tf(B.currentTrack);let i=qe.userData.part.base.clone();await De(t.object,new w(0,6.55,5.3),280,1),await De(t.object,new w(0,i.y,5.3),280),ye=null,await C0(t.index,t.object,i,t.wasPlaying,t.intent),oi("center")}else{let i=Ic(t.index);await De(t.object,new w(i.x,Math.max(i.y+1.6,6.6,t.object.position.y),9.2),380,.49),await De(t.object,new w(i.x,i.y+1.5,i.z),220),await De(t.object,i,260,.34*Pt.root.scale.x,-Math.PI/2,Pt.root.rotation.y),ee.remove(t.object),Dc(t.object),ys[t.index].visible=!0,ye=null,Lt=!1,Ne=t.scene,vn(t.doorWasOpen),B.paused=t.wasPaused,Re=t.transport,t.wasPlaying&&t.intent===li&&zt.paused&&yi(),ws(t.savedPosition,t.savedTarget,650),se("TAPE RETURNED TO ARCHIVE")}}catch(i){ee.remove(t.object),ys[t.index].visible=!0,ye=null,Lt=!1,vn(!0),se("TAPE COULD NOT BE LOADED",3500),console.error(i)}ce.shadowMap.needsUpdate=!0}function Dc(n){let t=new Set(Object.values(P)),e=new Set;n.traverse(i=>{if(i.isMesh){i.geometry.dispose();for(let s of Array.isArray(i.material)?i.material:[i.material])t.has(s)||e.add(s)}});for(let i of e)i.map?.dispose(),i.dispose()}window.addEventListener("pagehide",n=>{if(!n.persisted)for(let t of B.playlist)t.objectURL&&URL.revokeObjectURL(t.objectURL),t.cover&&URL.revokeObjectURL(t.cover)});var ke=null;function ws(n,t,e=1300){for(ke={start:performance.now(),duration:e,fromTarget:Ot.target.clone(),toTarget:t.clone(),from:new Oi().setFromVector3(Wt.position.clone().sub(Ot.target)),to:new Oi().setFromVector3(n.clone().sub(t))};ke.to.theta-ke.from.theta>Math.PI;)ke.to.theta-=Math.PI*2;for(;ke.to.theta-ke.from.theta<-Math.PI;)ke.to.theta+=Math.PI*2}function As(){ir||(ir=!0,ee.position.y=0,fe.scale.setScalar(1),Ne="OVERVIEW")}function nf(n,t,e){let i=am(e,Wt.fov,Wt.aspect,t.length());return n.clone().add(t.normalize().multiplyScalar(i))}function pc(){!me&&(!yn||!["center","tape"].includes(fn))&&oi("center")}function L0(n){let t=n?lr(n,!0):null;if(!t)return"center";let e=ee.worldToLocal(t.point.clone()),i=sa(t.object);return i===kn||i===xi||i===vi||e.y>7?"top":i===Yi||i===io||e.z<-.8?"back":e.x<-2.35?"left":e.x>2.35?"right":"center"}function sf(){if(!Lt){if(me){Rs();return}yn=!1,fn="overview",Ne="OVERVIEW",ws(xs.clone(),new w(2,3.2,0))}}function oi(n){if(Lt||me)return;As();let t=Wl[n]||Wl.center;fn=n,yn=!0,Ne="FOCUS",fa.visible=!0,wc.visible=!0,ee.updateWorldMatrix(!0,!1);let e=ee.localToWorld(new w(...t.target)),i=new w(...t.offset),s=nf(e,i,t.width*ee.scale.x);ws(s,e,1050)}var Om=0;async function Rs(){if(Lt||performance.now()-Om<1e3)return;Om=performance.now(),As(),me=!me,Lt=!0,Ne="TRANSITION",yn=!0,fn=me?"service":"center",fa.visible=!0,wc.visible=!0,ke=null,ci("service"),zn(me?"service-open":"service-close");let n=me;vn(!1);let t=[];for(let e of Ad){let i=e.userData.part,s=i.base.clone().add(n?i.offset:new w);e.userData.localStage=0;let r=so.some(a=>a.driver===e),o=so.some(a=>a.grille===e);t.push((async()=>{if(e===Be){if(n){await Bn(900),await De(e,new w(0,4.13,s.z),560);let l=e.position.clone();await ki(620,c=>{e.position.lerpVectors(l,s,nn(c)),e.rotation.x=-1.2*nn(c)})}else{await Bn(850);let l=e.position.clone(),c=e.rotation.x;await ki(600,h=>{e.position.lerpVectors(l,new w(0,4.13,l.z),nn(h)),e.rotation.x=c*(1-nn(h))}),await De(e,s,580)}return}if(await Bn(n?e===qe?2110:r?150:o?0:550:r||o?2080:e===yd?2950:0),r||o){if(n){let l=e.position.clone();l.z=r?4.15:5.85,await De(e,l,370),await De(e,s,510)}else{let l=s.clone();l.z=r?4.15:5.85,await De(e,l,500),await De(e,s,370)}return}await De(e,s,n?690:760)})())}ws(n?new w(19.5,15.5,30).multiplyScalar(innerWidth/innerHeight<.85?1.8:1):new w(3.5,6.6,innerWidth/innerHeight<.85?48:18.9),new w(0,4.15,0),1800),await Promise.all(t),Lt=!1,Ne=n?"DISASSEMBLY":"FOCUS",n||zn("service-close"),ce.shadowMap.needsUpdate=!0}function SE(n){if(Lt||me)return;Lt=!0,Bn(750).then(()=>{Lt=!1,ce.shadowMap.needsUpdate=!0}),n.userData.localStage=(n.userData.localStage+1)%3;let t=n.userData.localStage,e=so.find(i=>i.grille===n);for(let[i,s]of[[e.grille,t?1.25:0],[e.driver,t===2?.66:0]]){let r=i.position.clone(),o=i.userData.part.base.clone();o.z+=s,Rc(700,a=>i.position.lerpVectors(r,o,nn(a)))}}var gs=re(Qe);gs.visible=!1;var TE=Dt(gs,"",2.8,.66,1.78,.45,0,{mono:!0,bg:"#e0dfd2",res:768}),wE=new Fe().setFromPoints([new w,new w(.45,.45,0),new w(.45,.45,0)]),AE=new pl(wE,new Oo({color:"#7a8175",transparent:!0,opacity:.7}));gs.add(AE);var _s=new Ft(new wl(.074,.084,32),new Je({color:"#d1a067",side:Dn,transparent:!0,opacity:.8,depthTest:!1}));_s.renderOrder=99;Qe.add(_s);_s.visible=!1;var mc=new Fl,gc=new nt;function RE(n){for(;n;){if(!n.visible)return!1;n=n.parent}return!0}function Lc(n){for(;n;){if(n.userData.action)return{object:n,...n.userData.action};n=n.parent}return null}function sa(n){for(;n;){if(n.userData.part)return n;n=n.parent}return null}function lr(n,t=!1){gc.set(n.clientX/innerWidth*2-1,-n.clientY/innerHeight*2+1),mc.setFromCamera(gc,Wt);let e=mc.intersectObjects(t?[ee]:[ee,fe],!0).filter(o=>RE(o.object));if(!e.length)return null;let i=e[0];if(t)return i;let s=null;for(let o=i.object;o;o=o.parent)if(ri.some(a=>a.group===o)){s=o;break}let r=o=>{if(!s)return!0;for(;o;){if(o===s)return!0;o=o.parent}return!1};return e.find(o=>o.distance-i.distance<.075&&r(o.object)&&Lc(o.object))||i}function CE(n,t){if(!n||Lt)return;Es=performance.now();let{kind:e,value:i}=n;if(!zE(e,i,t)){if(e==="adNext"){pE();return}if(e==="style"){x0(i);return}if(e==="focus"){oi(i||L0(t));return}if(e==="explode"){se("DOUBLE TAP + / HOLD TO SERVICE");return}if(e==="person"){lE(i);return}if(e==="import"){if(!yn){pc();return}if(!je){eo(!0);return}vs.click();return}if(e==="button"){yn||pc(),i==="play"?yi():i==="pause"?B.playing?Cc():yi():i==="stop"?Jd():i==="next"?ar(1):i==="prev"?ar(-1):i==="record"&&(Xi("record"),je?vs.click():eo(!0));return}if(e==="door"){if(fn!=="center"&&fn!=="tape"){oi("center");return}Te?je&&eo(!1):je?vs.click():eo(!0);return}if(e==="seek"){je>.9&&jd();return}if(e==="knob"){i==="volume"&&S0();return}if(e==="track"){OE(i);return}if(e==="selectorState"){Sd(i.kind,i.index);return}if(e==="selector"){Sd(i,(Qd(i)+1)%Ec[i].states.length);return}if(e==="speaker"){let s=i.position.x<0?"left":"right";t?.shiftKey?SE(i):oi(s);return}if(e==="region"){oi(i);return}}}var Ue=null,oo=null;var Nn=null,Gi=new Set;function PE(){let n=Wt.position.clone(),t=Ot.target.clone(),e=Ot.enableDamping;Ot.enableDamping=!1,Ot.update(),Ot.enableDamping=e,Wt.position.copy(n),Ot.target.copy(t),Ot.enabled=!1}function IE(n){let t=Ye[n].part.getWorldPosition(new w).project(Wt);return{x:(t.x+1)*innerWidth/2,y:(1-t.y)*innerHeight/2}}function U0(n,t,e=!1){let i=Ye[n],s=vt.clamp(t,0,1);n!=="volume"&&Math.abs(s-.5)<(e?.005:.012)&&(s=.5),i.value=s,n==="volume"?bd(s):(B[n]=(s-.5)*24,Ts(),se(`${n.toUpperCase()} ${B[n].toFixed(1)} dB${e?" FINE":""}`));let r=Math.round(s*40),o=performance.now();r!==i.lastDetent&&o-i.lastTick>55&&(zn("detent"),i.lastTick=o,i.lastDetent=r),ci("knob",i.part.getWorldPosition(new w))}dn.addEventListener("pointerdown",n=>{if(!_i)return;if(As(),ma(),Es=performance.now(),ke=null,Gi.add(n.pointerId),Gi.size>1){ye&&xa(!1),clearTimeout(oo),Nn=null,Ue=null,Nt=null,ga(),Ot.enabled=!0;return}let t=lr(n),e=t?Lc(t.object):null;if(!e&&t&&sa(t.object)&&(e={kind:"focus",value:L0(n),object:sa(t.object)}),Ue={x:n.clientX,y:n.clientY,time:performance.now(),a:e,id:n.pointerId,moved:!1},e&&e.kind!=="focus"&&!Lt&&(PE(),dn.setPointerCapture(n.pointerId)),e&&!Lt&&(["knob","eq","seek","track","selector","selectorState","drawer"].includes(e.kind)||e.kind==="door"&&Te&&!je||e.kind==="button"&&["ff","rew"].includes(e.value)))if(e.kind==="button")T0(e.value==="ff"?1:-1);else{let i=e.kind==="knob"?IE(e.value):null;Nt={...e,startX:n.clientX,startY:n.clientY,lastX:n.clientX,lastY:n.clientY,startValue:e.kind==="knob"?Ye[e.value].value:e.kind==="eq"?B.eq[e.value]:B.currentTime,rawValue:e.kind==="knob"?Ye[e.value].value:0,center:i,lastAngle:i?Math.atan2(n.clientX-i.x,i.y-n.clientY):0,axis:n.altKey?"angular":null,activated:!1}}(e?.kind==="explode"||qn&&e?.kind==="focus")&&!Lt&&(oo=setTimeout(()=>{Ue&&!Ue.moved&&Gi.size===1&&(Nn=null,Ue=null,Nt=null,Ot.enabled=!0,Rs())},950))},{capture:!0});dn.addEventListener("pointermove",n=>{if(Es=performance.now(),Ue&&n.pointerId===Ue.id&&Math.hypot(Ue.x-n.clientX,Ue.y-n.clientY)>3&&(Ue.moved=!0,clearTimeout(oo),Nn=null,ye||(ke=null)),Ue?.id===n.pointerId&&Nt?.kind==="drawer"){if(Math.hypot(n.clientX-Nt.startX,n.clientY-Nt.startY)>16){Nt.activated||(Nt.activated=!0,z0(Nt.value,n.clientY>Nt.startY));return}return}if(Ue?.id===n.pointerId&&Nt?.kind==="track"){!ye&&Math.hypot(n.clientX-Nt.startX,n.clientY-Nt.startY)>6&&bE(Nt.value),ye&&ef(n);return}if(Nt&&!Lt&&Ue?.id===n.pointerId){let e=n.clientX-Nt.startX,i=n.clientY-Nt.startY;if(!Nt.activated&&Math.hypot(e,i)<3)return;Nt.activated||(Nt.activated=!0,Nt.axis||(Nt.axis=Math.abs(i)>=Math.abs(e)*.8?"vertical":"horizontal"));let s=n.clientX-Nt.lastX,r=Nt.lastY-n.clientY,o=n.shiftKey?.2:1;if(Nt.kind==="selector"||Nt.kind==="selectorState")xE(Nt.kind==="selector"?Nt.value:Nt.value.kind,n);else if(Nt.kind==="knob"){let a;if(Nt.axis==="angular"){let l=Math.atan2(n.clientX-Nt.center.x,Nt.center.y-n.clientY),c=l-Nt.lastAngle;for(;c>Math.PI;)c-=Math.PI*2;for(;c<-Math.PI;)c+=Math.PI*2;a=Math.hypot(n.clientX-Nt.center.x,n.clientY-Nt.center.y)>8?vt.clamp(c,-.4,.4)/(Math.PI*1.5):0,Nt.lastAngle=l}else a=Nt.axis==="vertical"?r/(qn?190:260):s/(qn?230:320);Nt.rawValue=vt.clamp(Nt.rawValue+a*o,0,1),U0(Nt.value,Nt.rawValue,n.shiftKey),dn.style.cursor="grabbing"}else Nt.kind==="eq"?(B.eq[Nt.value]=vt.clamp(B.eq[Nt.value]+r/7*o,-12,12),Ts(),se(`${[60,250,"1K","4K","12K"][Nt.value]} Hz ${B.eq[Nt.value].toFixed(1)}dB`)):je<.9&&mi(Nt.startValue+e/350*B.duration);Nt.lastX=n.clientX,Nt.lastY=n.clientY;return}let t=lr(n,me);er=t?me?sa(t.object):Lc(t.object):null,dn.style.cursor=er?.kind==="knob"?"ns-resize":er?"pointer":"grab",_s.visible=!!er&&!me,_s.visible&&(_s.position.copy(t.point),_s.quaternion.copy(Wt.quaternion)),gs.visible=!!er&&me,gs.visible&&(gs.position.copy(t.point),gs.quaternion.copy(Wt.quaternion),TE.userData.setText(`PART ${String(er.userData.part.id).padStart(3,"0")}
${er.userData.part.name.split(" \xB7 ")[1]}`))});function DE(n){if(clearTimeout(oo),Gi.delete(n.pointerId),Ue&&Ue.id!==n.pointerId)return;let t=Ue,e=!!Tn;ga(),Ot.enabled=!0,Nt=null,Ue=null;try{dn.releasePointerCapture(n.pointerId)}catch{}if(ye&&!ye.finishing){ef(n),xa(ye.ready&&Gi.size===0);return}if(!t||t.moved||e||Gi.size)return;let i=t.a,s=performance.now();if(i?.kind==="explode"){Nn&&s-Nn.time<340&&s-Nn.time>65&&Math.hypot(Nn.x-n.clientX,Nn.y-n.clientY)<9&&s-t.time<240?(Nn=null,Rs()):(Nn={time:s,x:n.clientX,y:n.clientY},se("DOUBLE TAP + / HOLD TO SERVICE"));return}if(Nn=null,me&&(!i||["focus","speaker","region"].includes(i.kind))){let r=lr(n,!0),o=r?sa(r.object):null;if(o&&!Lt){let a=o.getWorldPosition(new w),l=Wt.position.clone().sub(Ot.target).normalize();ws(a.clone().addScaledVector(l,10),a,900),Ne="PART_FOCUS"}return}i&&CE(i,n)}dn.addEventListener("pointerup",DE,{capture:!0});dn.addEventListener("pointercancel",n=>{ye&&xa(!1),Gi.delete(n.pointerId),clearTimeout(oo),Ue=null,Nt=null,Nn=null,ga(),Ot.enabled=!0});window.addEventListener("blur",()=>{ye&&xa(!1);for(let[n,t]of Object.entries(oa))clearTimeout(t.timer),delete oa[n];Gi.clear(),clearTimeout(oo),Nn=null,ga(),Nt=null,Ue=null,Ot.enabled=!0});dn.addEventListener("dblclick",n=>{n.preventDefault(),!Lt&&!lr(n,!0)&&!lr(n)&&sf()});dn.addEventListener("wheel",n=>{let t=lr(n),e=t?Lc(t.object):null;e?.kind==="knob"&&!Lt&&(n.preventDefault(),n.stopImmediatePropagation(),ma(),Es=performance.now(),ke=null,U0(e.value,Ye[e.value].value-Math.sign(n.deltaY)*(n.shiftKey?.003:.015),n.shiftKey))},{passive:!1,capture:!0});dn.addEventListener("contextmenu",n=>n.preventDefault());Ot.addEventListener("start",()=>{Es=performance.now(),ke=null});var ra=0;window.addEventListener("dragenter",n=>{n.preventDefault(),ra++,As(),pc(),Lt||vn(!0),Ss.visible=!Te,se("INSERT LOCAL AUDIO")});window.addEventListener("dragover",n=>{n.preventDefault(),n.dataTransfer.dropEffect="copy"});window.addEventListener("dragleave",n=>{n.preventDefault(),ra=Math.max(0,ra-1)});window.addEventListener("drop",n=>{n.preventDefault(),ma(),ra=0,R0(n.dataTransfer.files)});var oa={};function rf(n){gi&&(Ot.enabled=n,Ot.enableZoom=n,n||Ot.resetState?.())}window.addEventListener("keydown",n=>{if(n.key==="Alt"&&rf(!0),!(n.target.tagName==="INPUT"||n.metaKey||n.ctrlKey)&&(Es=performance.now(),As(),ma(),["Space","ArrowLeft","ArrowRight","ArrowUp","ArrowDown"].includes(n.code)&&n.preventDefault(),!(n.repeat&&!["ArrowUp","ArrowDown"].includes(n.code))))switch(n.code){case"Space":B.playing?Cc():yi();break;case"KeyS":Jd();break;case"KeyE":$d();break;case"KeyM":S0();break;case"KeyX":Rs();break;case"Escape":case"Digit0":ye?xa(!1):sf();break;case"Digit1":oi("left");break;case"Digit2":oi("center");break;case"Digit3":oi("right");break;case"Digit4":oi("top");break;case"ArrowUp":bd(Math.min(1,B.volume+.04));break;case"ArrowDown":bd(Math.max(0,B.volume-.04));break;case"ArrowLeft":case"ArrowRight":oa[n.code]={time:performance.now(),timer:setTimeout(()=>T0(n.code==="ArrowRight"?1:-1),230)};break}});window.addEventListener("keyup",n=>{n.key==="Alt"&&rf(!1);let t=oa[n.code];t&&(clearTimeout(t.timer),performance.now()-t.time<230?ar(n.code==="ArrowRight"?1:-1):ga(),delete oa[n.code])});window.addEventListener("blur",()=>rf(!1));function Fm(n){return Number.isFinite(n)?`${Math.floor(n/60).toString().padStart(2,"0")}:${Math.floor(n%60).toString().padStart(2,"0")}`:"00:00"}function Bm(n,t){n.getByteTimeDomainData(t);let e=0;for(let i of t)e+=((i-128)/128)**2;return Math.sqrt(e/t.length)}var uc=performance.now(),zm=0,km=0,Td=60,Hm=0,aa=60,Vm=0,xd=Fd.children.find(n=>n.userData.path)?.userData.path,LE=new Wn(new w(-7.45,.2,-1.95),new w(7.45,7.48,2)),UE=Ad.filter(n=>[Be,Yi,kn,Pd,Mc,...so.flatMap(t=>[t.grille,t.driver])].includes(n)).map(n=>{n.updateWorldMatrix(!0,!0);let t=new Wn().setFromObject(n);return t.min.sub(n.position),t.max.sub(n.position),t.expandByScalar(.24),{p:n,box:t}});function Gm(n,t){if(!t.containsPoint(n))return;let e=[["x",t.min.x-.04],["x",t.max.x+.04],["y",t.max.y+.04],["z",t.min.z-.04],["z",t.max.z+.04]];e.sort((i,s)=>Math.abs(i[1]-n[i[0]])-Math.abs(s[1]-n[s[0]])),n[e[0][0]]=e[0][1]}function NE(){if(Wt.position.y=Math.max(.58,Wt.position.y),me)for(let{p:n,box:t}of UE){let e=n.worldToLocal(Wt.position.clone());t.containsPoint(e)&&(Gm(e,t),Wt.position.copy(n.localToWorld(e)))}else{ee.updateWorldMatrix(!0,!1);let n=ee.worldToLocal(Wt.position.clone());Gm(n,LE),Wt.position.copy(ee.localToWorld(n))}Wt.lookAt(Ot.target)}function N0(n){if(requestAnimationFrame(N0),!_i||document.hidden||gi&&window.__wallpaperSleeping){uc=n;return}if(Td=gi?window.__wallpaperInactive?15:Lt||Ue||ke||ye||n-Es<1800?45:B.playing?30:24:Lt||Ue||ke||Vi||!ir||n-Es<1500?60:B.playing?30:20,n-zm<1e3/Td-.5)return;zm=n,ce.info.reset();let t=Math.min((n-uc)/1e3,.05);uc=n,aa=vt.damp(aa,1/Math.max(t,.001),2,t),n-Hm>(gi?180:100)&&(!ir||Lt||Vi||Math.abs(Fn.rotation.x-je)>.001||ai.some(c=>c.until>n))&&(ce.shadowMap.needsUpdate=!0,Hm=n),Pt.tick(t,n,me)&&(ce.shadowMap.needsUpdate=!0);for(let c=hc.length-1;c>=0;c--){let h=hc[c],u=(n-h.start)/h.duration;u<0||(h.update(Math.min(1,u)),u>=1&&(hc.splice(c,1),h.complete?.()))}if(!ir){let c=vt.clamp((n-M0)/3e3,0,1);ee.position.y=-8*(1-E0(c)),fe.scale.setScalar(Math.max(.001,nn(vt.clamp((c-.45)/.5,0,1)))),xi.rotation.z=Math.sin(c*18)*.006*(1-c),vi.rotation.z=Math.sin(c*23)*.016*(1-c),c>=1&&(As(),Wt.position.copy(xs))}if(ke){let c=ke,h=Math.min(1,(n-c.start)/c.duration),u=nn(h);Ot.target.lerpVectors(c.fromTarget,c.toTarget,u);let d=new Oi(vt.lerp(c.from.radius,c.to.radius,u),vt.lerp(c.from.phi,c.to.phi,u),vt.lerp(c.from.theta,c.to.theta,u));Wt.position.copy(Ot.target).add(new w().setFromSpherical(d)),h===1&&(ke=null)}if(ye&&!ye.finishing){let c=ye,h=ee.localToWorld(new w(vt.clamp(c.object.position.x*.32,0,3),4.1,3.4)),u=nf(h,new w(1.4,7,19),Math.max(14,Math.abs(c.object.position.x)+7)),d=1-Math.exp(-4*t);Ot.target.lerp(h,d),Wt.position.lerp(u,d),Wt.lookAt(Ot.target),Wt.updateMatrixWorld(),c.pointer&&ef(c.pointer)}Ot.target.x=vt.clamp(Ot.target.x,-10,15),Ot.target.y=vt.clamp(Ot.target.y,1,10),Ot.target.z=vt.clamp(Ot.target.z,-9,8),Ot.enabled&&Ot.update(),NE();let e=ld(Fn.rotation.x,Cm,je,t,85,18,0,1.53);if(Fn.rotation.x=e.position,Cm=e.velocity,Te&&!Lt){let c=qe.userData.part;qe.position.z=vt.damp(qe.position.z,c.base.z+(me?c.offset.z:0)+(je>.9?.36:0),9,t)}Tn&&Te&&mi(zt.currentTime+Tn*t*16);let i=0,s=0,r=0;if(ds&&B.playing&&!Tn){ds.getByteFrequencyData(md);let c=Math.max(2,Math.round(220/(ze.sampleRate/512)));for(let h=1;h<c;h++)i+=md[h]/255;i/=c-1,s=Math.min(1,Bm(ac,gE)*3.5),r=Math.min(1,Bm(lc,_E)*3.5)}zi=vt.damp(zi,i,i>zi?17:9,t),jr=vt.damp(jr,s,s>jr?20:5,t),ta=vt.damp(ta,r,r>ta?20:5,t),dc[0].rotation.z=1.05-jr*2.05,dc[1].rotation.z=1.05-ta*2.05,$r=vt.damp($r,Tn?Tn*16:B.playing?1:0,14,t);let o=B.duration?vt.clamp(B.currentTime/B.duration,0,1):0,a=rr.userData,l=rd(o);if(Math.abs(o-a.ribbonProgress)>5e-5&&(od(a.tapePath.geometry,o),a.ribbonProgress=o),a.spool.forEach(({reel:c,wound:h,layers:u},d)=>{let f=l[d];h.scale.set(f/.58,1,f/.58),u.scale.set(f/.58,f/.58,1),c.rotation.z-=t*$r*.8/(f+.15)}),a.mechanism.position.z=vt.damp(a.mechanism.position.z,me&&!Lt?.65:0,12,t),ir&&(Lt||n-km>1e3)&&(km=n),rr.userData.guideRollers.forEach(c=>c.rotation.z-=t*$r*5),$m.forEach((c,h)=>c.rotation.z+=t*$r*(h%2?1:-1)*(1.3+h*.1)),Vm+=t*$r*.22,xd){let c=(Vm%1+1)%1;vd.position.copy(xd.getPointAt(c));let h=xd.getTangentAt(c);vd.rotation.z=Math.atan2(h.y,h.x)}Jm.forEach((c,h)=>c.position.z=Math.sin(n*.12+h*.07)*zi*.038),or.position.y=vt.damp(or.position.y,B.playing?.09:0,12,t),ir&&(ee.position.y=p0+Math.sin(n*.12)*zi*.004,Wd(ee.position.y)),ai.forEach((c,h)=>{let u=n<c.until,d=u?Math.sin(Math.min(1,(c.until-n)/400)*Math.PI/2):0,f=n*.001,m=B.playing&&c.respond,_=u?c.activity:"idle";c.body.rotation.x=vt.damp(c.body.rotation.x,m?Math.sin(f*3.2+c.phase)*zi*.045:0,9,t),c.head.rotation.x=vt.damp(c.head.rotation.x,m?Math.sin(f*4+c.phase)*zi*.13:_==="point"?-.18:0,8,t);let g=0;if(u&&c.look){let p=c.g.worldToLocal(c.look.clone());g=vt.clamp(Math.atan2(p.x,p.z),-.75,.75)}c.head.rotation.y=vt.damp(c.head.rotation.y,g,7,t),c.arms.forEach((p,S)=>{if(c.pose==="climb"){p.rotation.set(0,0,0);return}let M=c.armBase,x=0;_==="wave"&&S===1?(x=(2.2+Math.sin(f*10)*.25)*d,M=-.3):_==="point"&&S===1?(M=-1.6*d,x=-.22*d):_==="balance"?(x=(S?1:-1)*.65*d,M=-.25*d):c.pose==="work"&&S===1&&(M=c.armBase+Math.sin(f*1.6+c.phase)*.1),p.rotation.x=vt.damp(p.rotation.x,M,11,t),p.rotation.z=vt.damp(p.rotation.z,x,11,t)}),c.legs.forEach(p=>{p.rotation.x=0})}),pa.rotation.z=Math.sin(n*.075)*zi*.008,jm.forEach((c,h)=>{let u=B.playing&&md[Math.min(255,2+h*8)]/255>(h%7+1)/9;c.emissiveIntensity=vt.damp(c.emissiveIntensity,u?.7:.02,12,t)}),c0.emissiveIntensity=.12+jr*.6;for(let[c,h]of Object.entries(ps)){let d=(c==="play"?B.playing:c==="pause"?B.paused:c==="ff"?Tn>0:c==="rew"?Tn<0:!1)||h.userData.pulse>n,f=ld(h.position.z,h.userData.velocity||0,d?.2-.075:.2,t,650,45,.2-.075,.2);h.position.z=f.position,h.userData.velocity=f.velocity}for(let c of Object.values(Ye))c.displayValue=vt.damp(c.displayValue,c.value,24,t),c.rot.rotation.z=-(c.displayValue-.5)*Math.PI*1.5;vc.forEach((c,h)=>c.position.y=vt.damp(c.position.y,.035+B.eq[h]/12*.25,20,t));for(let[c,h]of Object.entries(Ec)){let u=Qd(c);h.tab.position.x=vt.damp(h.tab.position.x,-.47+u*.94/(h.states.length-1),18,t),u!==h.lastIndex&&(h.marks.forEach((d,f)=>d.userData.setInk(f===u?"#f0c681":"#9ca69d")),h.lastIndex=u)}if(cc=vt.damp(cc,o*999,12,t),r0.forEach((c,h)=>{let u=10**(2-h),d=cc/u,f=Math.floor(d),m=d-f;d=h===2?d:f+Math.max(0,(m-.94)/.06),c.rotation.x=d*Math.PI*2/10}),n-Um>130){Um=n;let c=Wi||(n<y0?v0:Te?`${String(B.currentTrack+1).padStart(2,"0")} ${Fm(B.currentTime)} / ${Fm(B.duration)}`:yn?"NO TAPE   /   EJECT":"STANDBY   \u2014   C82");c!==Nm&&(J1.userData.setText(c),Nm=c)}if(o0.emissiveIntensity=B.playing?.8:.18,ye&&!ye.finishing&&ye.lifted){let c=ye;c.object.position.lerp(c.target,1-Math.exp(-18*t)),c.object.scale.setScalar(vt.damp(c.object.scale.x,c.ready?1:.62,12,t))}ra?P.smoke.opacity=.34:P.smoke.opacity=.2,no?(no.enabled=!qn&&yn&&!ke&&Ne==="PART_FOCUS",no.uniforms.focus.value=Wt.position.distanceTo(Ot.target),Qr.render()):ce.render(Qe,Wt)}ce.shadowMap.needsUpdate=!0;requestAnimationFrame(N0);var un=new Ma,O0={},_c=0,Wm="",wd=null,Uc=!0,sr=!1;function cr(){return Te?B.playlist[B.currentTrack]?.id:null}function Nc(n){let t=n?.name==="QuotaExceededError"?"ARCHIVE FULL":n?.message==="ARCHIVE OFFLINE"?"ARCHIVE OFFLINE":"SAVE ERROR";se(t,7e3),Pt.count.userData.setText(t)}async function of(){if(navigator.storage?.estimate)try{let{usage:n,quota:t}=await navigator.storage.estimate();O0={usage:n,quota:t},t&&n/t>.85&&(se("LOW STORAGE",6e3),Pt.count.userData.setText("LOW STORAGE"))}catch{}}function la(n){let t=B.playlist[n];return t?(!t.objectURL&&t.audioBlob&&(t.objectURL=URL.createObjectURL(t.audioBlob)),t.objectURL):null}function F0(){return{volume:B.volume,muted:B.muted,bass:B.bass,treble:B.treble,eq:[...B.eq],shuffle:B.shuffle,repeatMode:B.repeatMode,stereoMono:B.stereoMono,mobileQuality:fs,lastSelectedAlbum:B.playlist.find(n=>n.id===Pt.state.selectedTape)?.album||null,style:ro}}function B0(){if(Lt||ye||ke||Tn||Vi||sr)return wd;let n={currentTrackId:cr(),currentTime:B.currentTime,tapeInserted:Te,cabinetOpen:!!Pt.state.activeDrawer,activeDrawer:Pt.state.activeDrawer,pages:{...Pt.state.pages},selectedTape:Pt.state.selectedTape,cameraPosition:Wt.position.toArray(),cameraTarget:Ot.target.toArray(),explodedView:me,focusedPart:fn,lastStableState:Ne,doorOpen:je>0,wasPlaying:B.playing,updatedAt:Date.now(),...F0()};return wd=n,n}async function af(){if(clearTimeout(_c),_c=0,Uc||!_i||!un.db)return;let n=B0();if(n)try{await un.save(F0(),n)}catch(t){Nc(t)}}function Mn(){Uc||!_i||(clearTimeout(_c),_c=setTimeout(af,400))}function xc(){if(Lt)return;As(),yn=!0,fn="cabinet",Ne="CABINET_FOCUS",Pt.root.updateWorldMatrix(!0,!1);let n=Pt.root.localToWorld(new w(0,3.8,2));ws(nf(n,new w(1,6.7,12),6.5),n,950)}function z0(n,t){Lt||sr||(xc(),ci("archive"),Pt.setOpen(n,t??Pt.state.activeDrawer!==n),Ne=Pt.state.activeDrawer?"DRAWER_OPEN":"CABINET_FOCUS",zn("door-open"),ce.shadowMap.needsUpdate=!0,Mn())}function OE(n){let t=B.playlist[n];if(t){if(Pt.state.selectedTape===t.id){_a(n,B.playing);return}ci("archive"),Pt.state.selectedTape=t.id,Pt.state.removeArmed=null,Pt.refresh(cr()),Ne="TAPE_SELECT",se(t.sourceRequired?"SOURCE REQUIRED":t.title.slice(0,20)+" / TAP TO LOAD",4500),Mn()}}var Hi=null;async function FE(){let n=Pt.state.selectedTape,t=B.playlist.find(e=>e.id===n);if(!t){se("SELECT A TAPE FIRST");return}if(!Hi||Hi.id!==n||performance.now()>Hi.until){Hi={id:n,until:performance.now()+6500},se("REMOVE "+t.title.slice(0,12)+"? PRESS SERVICE",6500),Pt.count.userData.setText("PRESS SERVICE TO REMOVE");return}Hi=null,await k0([t])}async function k0(n,t=!1){if(Lt||sr)return;sr=!0;let e=new Set(n.map(i=>i.id));try{e.has(cr())&&await jd();let i=B.playlist.filter(r=>!e.has(r.id)),s=cr();if(un.db)if(t)await un.clear();else for(let r of n)await un.remove(r,i);for(let r of n)r.objectURL&&URL.revokeObjectURL(r.objectURL),r.cover&&URL.revokeObjectURL(r.cover);B.playlist=i,B.currentTrack=s?i.findIndex(r=>r.id===s):-1,Pt.state.selectedTape=null,Pt.rebuild(i,s),se(t?"ARCHIVE CLEARED":"TAPE REMOVED",4e3),wd=null}catch(i){Nc(i)}finally{sr=!1,Mn(),of()}}async function BE(){Lt||sr||(Te&&await jd(),me&&await Rs(),Object.assign(B,{volume:.68,muted:!1,bass:0,treble:0,eq:[0,0,0,0,0],shuffle:!1,repeatMode:"off",stereoMono:!1}),Ye.volume.value=.68,Ye.bass.value=Ye.treble.value=.5,Pt.setOpen(null,!1),Ts(),sf(),se("MACHINE RESET / ARCHIVE KEPT",5e3),Mn())}function zE(n,t,e){if(!["cabinet","drawer","archivePage","archiveImport","archiveService","resetMachine","clearArchive"].includes(n))return!1;if(sr)return!0;if(n==="cabinet"&&xc(),n==="drawer"&&z0(t),n==="archivePage"){let i=Pt.state.pages[t.id]||0;Pt.state.pages[t.id]=(i+t.direction+12)%12,Pt.setOpen(t.id,!0),xc(),Mn()}return n==="archiveImport"&&vs.click(),n==="archiveService"&&FE(),n==="resetMachine"&&BE(),n==="clearArchive"&&(Hi?.id==="ALL"&&performance.now()<Hi.until?(Hi=null,k0([...B.playlist],!0)):(Hi={id:"ALL",until:performance.now()+6500},se("CLEAR ARCHIVE? PRESS RED AGAIN",6500))),!0}var Oc=re(Yi,0,0,-.2);Oc.rotation.y=Math.PI;j(Oc,3.5,1.05,.1,0,-.75,0,P.dark);Dt(Oc,"ARCHIVE SERVICE / DOUBLE CONFIRM",3.25,.13,0,-.42,.06,{mono:!0,color:"#dacbb0",res:512});for(let[n,t,e,i]of[["resetMachine","RESET MACHINE",-.84,P.cream],["clearArchive","CLEAR ARCHIVE",.84,P.orange]]){let s=j(Oc,1.5,.32,.12,e,-.82,.13,i);Me(s,n),Dt(s,t,1.35,.12,0,0,.069,{mono:!0,res:256})}function Xm(n){if(n){for(let t of["muted","shuffle","stereoMono"])typeof n[t]=="boolean"&&(B[t]=n[t]);for(let[t,e,i]of[["volume",0,1],["bass",-12,12],["treble",-12,12]])Number.isFinite(n[t])&&(B[t]=vt.clamp(n[t],e,i));Array.isArray(n.eq)&&n.eq.length===5&&(B.eq=n.eq.map(t=>Number.isFinite(t)?vt.clamp(t,-12,12):0)),["off","one","all"].includes(n.repeatMode)&&(B.repeatMode=n.repeatMode),Ye.volume.value=B.volume,Ye.bass.value=B.bass/24+.5,Ye.treble.value=B.treble/24+.5,qn&&Number.isFinite(n.mobileQuality)&&(fs=vt.clamp(n.mobileQuality,.75,1.35),ce.setPixelRatio(fs)),Ts()}}async function kE(){Ne="BOOT";let n,t;try{await un.open(),t=await un.get("preferences","current"),Xm(t);let e=(await un.all("tracks")).sort((s,r)=>(s.createdAt||0)-(r.createdAt||0)||String(s.id).localeCompare(String(r.id))),i=[];for(let s of e){let r=xf(s),o=r.cabinetSlot,a=o&&Ki.includes(o.drawer)&&Number.isInteger(o.index)&&o.index>=0&&o.index<96&&!i.some(l=>l.cabinetSlot.drawer===o.drawer&&l.cabinetSlot.index===o.index);if(a||(r.cabinetSlot=zc(i,r)),r.artworkBlob)r.cover=URL.createObjectURL(r.artworkBlob);else{let l=await un.get("covers",r.id);l?.blob&&(r.artworkBlob=l.blob,r.cover=URL.createObjectURL(l.blob))}i.push(r),a||await un.putTrack(r)}B.playlist=i,n=await un.get("session","current")}catch(e){Nc(e),un.db?.close(),un.db=null}try{if(n){Ne="RESTORING",As(),Xm(t||n),Pt.state.pages={...Pt.state.pages,...Object.fromEntries(Object.entries(n.pages||{}).filter(([i,s])=>Ki.includes(i)&&Number.isInteger(s)&&s>=0&&s<12))},Pt.state.selectedTape=n.selectedTape||null;let e=B.playlist.findIndex(i=>i.id===n.currentTrackId);if(n.tapeInserted&&e>=0&&la(e)){let i=B.playlist[e];B.currentTrack=e,Te=!0,qe.visible=!0,Ss.visible=!1,rr.userData.titleLabel.userData.setText(i.title.toUpperCase()),B.duration=i.duration||0,B.currentTime=Math.max(0,Math.min(n.currentTime||0,i.duration||0)),cc=i.duration?B.currentTime/i.duration*999:0;let s=B.currentTime;zt.addEventListener("loadedmetadata",()=>{zt.currentTime=Math.min(s,zt.duration||s),B.currentTime=zt.currentTime},{once:!0}),zt.src=la(e),zt.load(),B.paused=!0,Re="PAUSED",A0(i)}vn(!!n.doorOpen,!0),Fn.rotation.x=je}if(Pt.rebuild(B.playlist,cr()),n?.activeDrawer&&Ki.includes(n.activeDrawer)){Pt.setOpen(n.activeDrawer,!0);for(let e of Pt.drawers)e.open=e.target,e.carrier.position.z=e.target}if(_i=!0,n){t?.style&&t.style!==ro&&await x0(t.style),n.explodedView&&await Rs(),ke=null;let e=i=>Array.isArray(i)&&i.length===3&&i.every(s=>Number.isFinite(s)&&Math.abs(s)<120);e(n.cameraPosition)&&Wt.position.fromArray(n.cameraPosition),e(n.cameraTarget)&&Ot.target.fromArray(n.cameraTarget),fn=n.focusedPart||"overview",yn=fn!=="overview",Ne=me?"DISASSEMBLY":fn==="cabinet"?"CABINET_FOCUS":yn?"FOCUS":"OVERVIEW",Wt.lookAt(Ot.target),se(Te?"RESTORED / PRESS PLAY":B.playlist.length+" TAPES RESTORED",5500)}else M0=performance.now(),Ne="INTRO"}catch(e){se("RESTORE ERROR / ARCHIVE KEPT",7e3),console.error(e)}finally{_i=!0,Uc=!1,ce.shadowMap.needsUpdate=!0,of()}}var HE=kE();setInterval(()=>{if(!_i||Uc||document.hidden)return;let n=B0();if(!n)return;let t=JSON.stringify({...n,updatedAt:0,currentTime:Math.floor(n.currentTime/5)*5,cameraPosition:n.cameraPosition.map(e=>+e.toFixed(3)),cameraTarget:n.cameraTarget.map(e=>+e.toFixed(3))});t!==Wm&&(Wm=t,Mn())},300);Ot.addEventListener("end",Mn);for(let n of["play","pause","seeked","ended"])zt.addEventListener(n,Mn);function H0(){B.playing=!zt.paused&&!zt.ended,B.paused=Te&&!B.playing,B.currentTime=zt.currentTime||0,Te&&(Re=B.playing?"PLAYING":"PAUSED")}document.addEventListener("visibilitychange",()=>{document.hidden?af():(H0(),uc=performance.now(),ce.shadowMap.needsUpdate=!0)});window.addEventListener("pagehide",()=>{af()});window.addEventListener("pageshow",n=>{n.persisted&&H0()});var oc=0;setInterval(()=>{!qn||document.hidden||Lt||!_i||(aa<18?oc++:oc=0,oc>=3&&fs>.8&&(fs=Math.max(.8,fs-.15),ce.setPixelRatio(fs),Fc(!1),oc=0,Mn()))},4e3);function Fc(n=!0){let t=innerWidth,e=innerHeight;Wt.aspect=t/e,Wt.updateProjectionMatrix(),ce.setSize(t,e),Qr?.setSize(t,e),Ot.maxDistance=Wt.aspect<.85?100:60,xs.set(11,12,26),Wt.aspect<.85&&xs.set(5,12,Math.max(32,34/Wt.aspect)),n&&_i&&!Lt&&!me&&(fn==="cabinet"?xc():yn&&Wl[fn]?oi(fn):ws(xs.clone(),new w(2,3.2,0),600))}window.addEventListener("resize",()=>Fc());window.addEventListener("orientationchange",()=>Fc());window.visualViewport?.addEventListener("resize",()=>Fc(!1));if(document.modelContext?.registerTool){let n=new AbortController,t=e=>{try{Promise.resolve(document.modelContext.registerTool(e,{signal:n.signal})).catch(()=>{})}catch{}};t({name:"read_cassette_state",description:"Read local cassette player state and imported tape names.",inputSchema:{type:"object",properties:{},additionalProperties:!1},annotations:{readOnlyHint:!0,untrustedContentHint:!0},execute:()=>({...window.cassetteWorld.state,positions:window.cassetteWorld.objectPositions})}),t({name:"control_cassette",description:"Operate the physical cassette transport or service view.",inputSchema:{type:"object",properties:{action:{type:"string",enum:["play","pause","stop","eject","next","previous","service"]}},required:["action"],additionalProperties:!1},execute:async({action:e})=>{let i={play:yi,pause:Cc,stop:Jd,eject:$d,next:ar,previous:()=>ar(-1),service:Rs};if(!Object.hasOwn(i,e))throw Error("Unknown action");if(Lt)throw Error("Mechanical transition in progress");return await i[e](),Lt&&await new Promise(s=>{let r=()=>Lt?setTimeout(r,100):s();r()}),{transport:Re,playing:B.playing,service:me}}}),window.addEventListener("pagehide",()=>n.abort(),{once:!0})}window.cassetteWorld={get state(){return{...B,playlist:B.playlist.map(({objectURL:n,cover:t,audioBlob:e,originalBlob:i,artworkBlob:s,...r})=>r),version:"5.0",archive:{ready:_i,persistent:!!un.db,drawer:Pt.state.activeDrawer,selected:Pt.state.selectedTape,storage:O0,renderedTapes:Pt.drawers.reduce((n,t)=>n+t.contents.children.length,0)},device:H1,camera:{position:Wt.position.toArray(),target:Ot.target.toArray(),aspect:Wt.aspect},performance:{fps:Math.round(aa),targetFrameRate:Td,pixelRatio:ce.getPixelRatio(),geometries:ce.info.memory.geometries,textures:ce.info.memory.textures},style:ro,styleAnimating:Jo,advertisements:{order:[...us],animating:Vi},tapeDrag:ye?{index:ye.index,ready:ye.ready}:null,focusArea:fn,formats:Zl,error:Wi,foley:ia?.events||[],people:ai.map(n=>({pose:n.pose,activity:performance.now()<n.until?n.activity:"idle",arm:n.arms[1].rotation.z})),sceneState:Ne,transportState:Re,exploded:me,busy:Lt,loaded:Te,door:Fn.rotation.x,drawCalls:ce.info.render.calls,fps:Math.round(aa),response:{bass:zi,left:jr,right:ta},filterGains:fc?.map(n=>n.gain.value),volumeGain:to?.gain.value,peakReduction:hs?.reduction,mechanics:{reels:rr.userData.spool.map(n=>({angle:n.reel.rotation.z,radius:n.wound.scale.x})),play:ps.play.position.z,pause:ps.pause.position.z,capExposure:ea.position.z+ps.play.position.z+.16-(Be.position.z+.235),needle:dc[0].rotation.z}}},get objectPositions(){let n={};for(let[t,e]of Object.entries(ps)){let i=e.getWorldPosition(new w).project(Wt);n[t]=[(i.x+1)*innerWidth/2,(1-i.y)*innerHeight/2]}for(let[t,e]of Object.entries(Ye)){let i=e.part.getWorldPosition(new w).project(Wt);n[t]=[(i.x+1)*innerWidth/2,(1-i.y)*innerHeight/2]}for(let[t,e]of[["door",n0],["import",Ss],["eq",ms],...vc.map((i,s)=>["eq"+s,i]),["stereo",Ld.group],["shuffle",Ud.group],["repeat",Nd.group],["tape",qe],["service",a0],...ri.map((i,s)=>["ad-corner-"+s,i.corner]),...ys.map((i,s)=>["archive-"+s,i]),["cabinet",Pt.root],["archiveImport",fa],["archiveService",Pt.service],...Pt.drawers.map(i=>["drawer-"+i.id,i.handle]),...m0.map(i=>["style-"+i.style.id,i.picture]),...ai.map((i,s)=>["person"+s,i.head])]){let i=e.getWorldPosition(new w).project(Wt);n[t]=[(i.x+1)*innerWidth/2,(1-i.y)*innerHeight/2]}return n}};})();

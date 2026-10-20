import {Group,BufferGeometry,BufferAttribute,Points,Mesh,Vector3,Vector2,Vector4,DoubleSide,ShaderMaterial,Color,AdditiveBlending} from 'three';
import analysisSource from './firework-worker-source.js';
import {SCORE_VERSION,atmosphereScore,visibleEvents,backgroundScore,launchPosition} from './firework-score.js';
const KEY='cassette-world.environment.fireworks.v1';
const hash=s=>{let h=2166136261;for(const c of String(s))h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0;};
const rng=seed=>()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
async function cache(key,value){return new Promise(resolve=>{const req=indexedDB.open('CassetteWorldFireworkScores',1);req.onupgradeneeded=()=>req.result.createObjectStore('scores');req.onerror=()=>resolve(null);req.onsuccess=()=>{const db=req.result,tx=db.transaction('scores',value?'readwrite':'readonly'),store=tx.objectStore('scores'),r=value?store.put(value,key):store.get(key);r.onsuccess=()=>resolve(value||r.result);r.onerror=()=>resolve(null);tx.oncomplete=()=>db.close();tx.onabort=()=>{db.close();resolve(null);};};});}

// A firework reads as a firework only when a single spark is smaller than the gaps
// between sparks. Soft blobs the size of a fingertip overlap into wool; hard 2px
// cores on thin curved tails read as radial structure at 150-250px across.
const SPARK_CORE=0.50;     // world-space diameter of one spark
const TRAIL_STEPS=4;
const PALETTE=[
 {main:'#ffc247',core:'#fff6dc'}, // amber
 {main:'#ff7a3d',core:'#ffe0cc'}, // ember
 {main:'#5fe0ff',core:'#e0f9ff'}, // cyan
 {main:'#dcb8ff',core:'#f7efff'}, // violet
 {main:'#ff8fc0',core:'#ffe6f2'}, // magenta
 {main:'#9dffb4',core:'#e8fff0'}  // jade
].map(p=>({main:new Color(p.main),core:new Color(p.core)}));

export function createFireworks({scene,renderer,camera,audio,getTrack,timeSystem,host}){
 let enabled=false,density='sparse';try{const saved=JSON.parse(localStorage.getItem(KEY)||'{}');enabled=!!saved.enabled;density=saved.density==='rich'?'rich':'sparse';}catch{}
 const mobile=matchMedia('(pointer:coarse)').matches,reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const root=new Group();root.name='Far shore fireworks';scene.add(root);

 // ---- sparks: one draw call, world-space sizing so distance never inflates them ----
 const capacity=mobile?1500:5200;
 const position=new Float32Array(capacity*3),tint=new Float32Array(capacity*3),radius=new Float32Array(capacity),alpha=new Float32Array(capacity);
 const geometry=new BufferGeometry();
 geometry.setAttribute('position',new BufferAttribute(position,3));
 geometry.setAttribute('tint',new BufferAttribute(tint,3));
 geometry.setAttribute('radius',new BufferAttribute(radius,1));
 geometry.setAttribute('alpha',new BufferAttribute(alpha,1));
 geometry.setDrawRange(0,0);
 const material=new ShaderMaterial({
  transparent:true,depthWrite:false,blending:AdditiveBlending,toneMapped:false,
  uniforms:{focal:{value:1200}},
  vertexShader:`attribute vec3 tint;attribute float radius;attribute float alpha;uniform float focal;varying vec3 vTint;varying float vAlpha;
void main(){vTint=tint;vAlpha=alpha;vec4 mv=modelViewMatrix*vec4(position,1.0);gl_PointSize=clamp(radius*focal/max(1.0,-mv.z),1.1,240.0);gl_Position=projectionMatrix*mv;}`,
  fragmentShader:`varying vec3 vTint;varying float vAlpha;
void main(){vec2 q=gl_PointCoord-.5;float r=length(q)*2.0;if(r>1.0)discard;
 float hot=exp(-r*r*6.2);float glow=exp(-r*r*1.45);float a=vAlpha*(hot*.70+glow*.30);
 if(a<.003)discard;gl_FragColor=vec4(vTint*(.92+.52*hot),a);}`
 });
 const sparks=new Points(geometry,material);sparks.frustumCulled=false;root.add(sparks);

 // ---- tails: screen-space quads, ~1.7px wide, gaussian edge, no fullscreen blur ----
 const trailCapacity=mobile?24000:72000;
 const trailPosition=new Float32Array(trailCapacity*3),trailTint=new Float32Array(trailCapacity*3),trailAlpha=new Float32Array(trailCapacity),trailOther=new Float32Array(trailCapacity*3),trailSide=new Float32Array(trailCapacity),trailWidth=new Float32Array(trailCapacity);
 const trailGeometry=new BufferGeometry();
 trailGeometry.setAttribute('position',new BufferAttribute(trailPosition,3));
 trailGeometry.setAttribute('tint',new BufferAttribute(trailTint,3));
 trailGeometry.setAttribute('alpha',new BufferAttribute(trailAlpha,1));
 trailGeometry.setAttribute('other',new BufferAttribute(trailOther,3));
 trailGeometry.setAttribute('side',new BufferAttribute(trailSide,1));
trailGeometry.setAttribute('w',new BufferAttribute(trailWidth,1));
 trailGeometry.setDrawRange(0,0);
 const trailMaterial=new ShaderMaterial({
  side:DoubleSide,transparent:true,depthWrite:false,blending:AdditiveBlending,toneMapped:false,
  uniforms:{viewport:{value:new Vector2(1500,1000)}},
  vertexShader:`attribute vec3 tint;attribute float alpha;attribute vec3 other;attribute float side;attribute float w;uniform vec2 viewport;varying vec3 vTint;varying float vAlpha;varying float vEdge;
void main(){vTint=tint;vAlpha=alpha;vEdge=side;vec4 p=projectionMatrix*modelViewMatrix*vec4(position,1.0);vec4 q=projectionMatrix*modelViewMatrix*vec4(other,1.0);
 vec2 d=(q.xy/q.w-p.xy/p.w)*viewport;float len=length(d);vec2 n=len>.0001?vec2(-d.y,d.x)/len:vec2(1.0,0.0);
 p.xy+=n*side*w*.5/viewport*p.w;gl_Position=p;}`,
  fragmentShader:`varying vec3 vTint;varying float vAlpha;varying float vEdge;
void main(){float soft=exp(-vEdge*vEdge*1.35)*smoothstep(1.0,.18,abs(vEdge));gl_FragColor=vec4(vTint,vAlpha*soft);}`
 });
 const tails=new Mesh(trailGeometry,trailMaterial);tails.frustumCulled=false;root.add(tails);
 let trailCount=0;
 const viewport=new Vector4();
 tails.onBeforeRender=r=>{r.getCurrentViewport(viewport);trailMaterial.uniforms.viewport.value.set(viewport.z,viewport.w);};

 const ui=document.createElement('fieldset');ui.id='environment-fireworks-settings';ui.innerHTML='<legend>远岸烟火</legend><label>远岸烟火 <input type="checkbox" aria-label="远岸烟火"></label><label>烟火密度 <select aria-label="烟火密度"><option value="sparse">疏朗</option><option value="rich">丰富</option></select></label><p data-firework-status>开启后随当前歌曲编排，不改变时间和音乐音量。</p>';
 (host||document.querySelector('#environment-water-settings')).append(ui);
 const toggle=ui.querySelector('input'),select=ui.querySelector('select'),status=ui.querySelector('p');
 toggle.checked=enabled;select.value=density;

 let px=1,background=null,backgroundActive=0,score=null,trackKey='',generation=0,worker=null,disposed=false,analyzing=false,active=0,mode='idle',cached=false,lastTime=-1,randomCache=new Map(),count=0,context=null,viewKey='';
 const projected=new Vector3();

 function clear(){trailGeometry.setDrawRange(0,0);geometry.setDrawRange(0,0);active=0;backgroundActive=0;root.visible=false;}
 function save(){try{localStorage.setItem(KEY,JSON.stringify({enabled,density}));}catch{}}
 function cancel(){generation++;worker?.terminate();worker=null;analyzing=false;}
 function setEnabled(v){enabled=!!v;toggle.checked=enabled;save();if(!enabled){cancel();clear();trackKey='';score=null;background=null;randomCache.clear();}else tick();}
 toggle.onchange=()=>setEnabled(toggle.checked);
 select.onchange=()=>{density=select.value;lastTime=-1;save();};

 async function prepare(track,key){cancel();const token=generation;analyzing=true;cached=false;mode='analyzing';status.textContent='正在为这首歌编排远岸烟火…';
  const blob=track.audioBlob;
  if(!blob||blob.size>256*1024*1024||track.duration>2700){score=atmosphereScore(track.duration,hash(key));mode='atmosphere';analyzing=false;status.textContent='此来源无法预读完整音频，使用稀疏氛围编排；不预测突发重音。';return;}
  try{const saved=await cache(key);if(token!==generation)return;if(saved){score=saved;cached=true;}else{
   const Decoder=globalThis.OfflineAudioContext||globalThis.webkitOfflineAudioContext;context=new Decoder(1,1,11025);const decoded=await context.decodeAudioData(await blob.arrayBuffer());context=null;if(token!==generation)return;
   if(decoded.duration>2700)throw Error('long audio');
   const pcm=new Float32Array(decoded.length),channels=decoded.numberOfChannels;
   for(let start=0;start<pcm.length;start+=110250){const end=Math.min(pcm.length,start+110250);for(let c=0;c<channels;c++){const data=decoded.getChannelData(c);for(let j=start;j<end;j++)pcm[j]+=data[j]/channels;}await new Promise(r=>setTimeout(r,0));if(token!==generation)return;}
   const url=URL.createObjectURL(new Blob([analysisSource],{type:'text/javascript'}));worker=new Worker(url);URL.revokeObjectURL(url);
   const result=await new Promise((resolve,reject)=>{worker.onmessage=({data})=>data.error?reject(Error(data.error)):resolve(data.score);worker.onerror=reject;worker.postMessage({pcm:pcm.buffer,rate:decoded.sampleRate,seed:hash(key)},[pcm.buffer]);});if(token!==generation)return;worker.terminate();worker=null;score=result;await cache(key,result);
  }if(token!==generation)return;mode=score.mode;analyzing=false;status.textContent='歌曲专属编排 · '+score.events.length+' 次候选绽放'+(cached?' · 已读取缓存':'');
  }catch(e){if(token!==generation)return;worker?.terminate();worker=null;score=atmosphereScore(track.duration,hash(key));mode='atmosphere';analyzing=false;status.textContent='此音频未能预分析，使用稀疏氛围编排。';}
 }

 // Shell + inner core. The inner layer is what makes a burst read as a sphere
 // rather than a ring of dots: it burns whiter, shorter and at ~45% radius.
 function pattern(e){
  if(randomCache.has(e.seed))return randomCache.get(e.seed);
  const r=rng(e.seed),list=[];
  const outer=e.background?(mobile?30:48):(mobile?36:64),inner=e.background?0:(mobile?12:26);
  for(let i=0;i<outer;i++){
   let v=1-2*(i+.5)/outer,phi=i*2.39996323+r()*.13;
   if(e.shape===1){ // layered petals: latitude bands instead of one smooth shell
    const bands=11,per=outer/bands,band=Math.floor(i/per),u=(i-band*per)/per;
    v=1-2*(band+.5)/bands+(r()-.5)*.10;
    phi=u*Math.PI*2+band*1.13+(r()-.5)*.22;
   }
   if(e.shape===2)v=Math.abs(v)*.92+.04; // willow keeps its mass above the horizon
   v=Math.max(-.995,Math.min(.995,v));
   const rad=Math.sqrt(1-v*v);
   list.push({x:Math.cos(phi)*rad,y:v,z:Math.sin(phi)*rad,speed:.82+r()*.36,life:e.shape===2?1.95+r()*.55:e.shape===1?1.85+r()*.5:1.7+r()*.55,phase:r()*6.28,tw:r(),size:SPARK_CORE*(.85+r()*.4),gain:2.05,core:false,trail:r()<.42});
  }
  for(let i=0;i<inner;i++){
   const v=1-2*(i+.5)/inner,phi=i*2.39996323+r()*.3,rad=Math.sqrt(1-v*v);
   list.push({x:Math.cos(phi)*rad,y:v,z:Math.sin(phi)*rad,speed:.38+r()*.07,life:(e.shape===2?1.1:1.35)+r()*.3,phase:r()*6.28,tw:r(),size:SPARK_CORE*.9,gain:1.65,core:true,trail:r()<.3});
  }
  randomCache.set(e.seed,list);if(randomCache.size>8)randomCache.delete(randomCache.keys().next().value);
  return list;
 }
 // Drag dominates for the first half second, gravity owns the tail. That bend is
 // the whole silhouette of a peony; a straight radial burst looks like a dandelion.
 function sparkAt(e,p,age){
  // Two-stage expansion: the break is fast, then the shell coasts and sags.
  // A single exponential either snaps open or crawls; this keeps velocity alive
  // late enough for the tail to stay visible at 2s.
  const d=e.size*p.speed*(.8*(1-Math.exp(-2.2*age))+.2*(1-Math.exp(-.35*age)));
  const g=e.shape===2?1.6:.95;
  return[e.position[0]+p.x*d,e.position[1]+p.y*d-.5*g*age*age,e.position[2]+p.z*d];
 }
 function put(x,y,z,color,a,size){
  if(count>=capacity||a<.003)return;
  const i=count*3;position[i]=x;position[i+1]=y;position[i+2]=z;
  tint[i]=color.r;tint[i+1]=color.g;tint[i+2]=color.b;
  alpha[count]=a;radius[count]=size;count++;
 }
 function segment(a,b,color,alphaA,alphaB,wA,wB){
  if(trailCount+6>trailCapacity)return;
  for(const [end,side] of [[0,-1],[0,1],[1,-1],[1,-1],[0,1],[1,1]]){
   const q=trailCount*3,v=end?b:a,o=end?[2*b[0]-a[0],2*b[1]-a[1],2*b[2]-a[2]]:b;
   trailPosition[q]=v[0];trailPosition[q+1]=v[1];trailPosition[q+2]=v[2];
   trailOther[q]=o[0];trailOther[q+1]=o[1];trailOther[q+2]=o[2];
   trailTint[q]=color.r;trailTint[q+1]=color.g;trailTint[q+2]=color.b;
   trailSide[trailCount]=side;trailAlpha[trailCount]=end?alphaB:alphaA;
   trailWidth[trailCount++]=end?wB:wA;
  }
 }
 function visibility(e){
  if(!camera)return 1;
  projected.set(e.position[0],e.position[1],e.position[2]).project(camera);
  if(projected.z<-1||projected.z>1)return 0;
  const margin=Math.min(1-Math.abs(projected.x),1-Math.abs(projected.y));
  return Math.max(0,Math.min(1,margin/.14));
 }

 function drawBurst(e,t,contrast,allowLaunch){
  const [x,y,z]=e.position,age=t-e.burst;
  const skin=PALETTE[e.color%PALETTE.length];
  const fade=visibility(e)*(e.background?.7:1);
  // Everything downstream is scaled by this one number. It is deliberately below
  // 1: the show belongs to the far shore, so it should sit behind the radio, not
  // compete with it. Raise this and the fireworks start shouting.
  contrast*=.58*fade;
  if(contrast<.003)return;

  if(age<0){ // ascent: a burning shell, not a dot
   if(!allowLaunch)return;
   const head=launchPosition(e,t),warm=PALETTE[0].main,hot=PALETTE[0].core;
   const flick=.84+.16*Math.sin(t*41+e.seed%89);
   // Warm body first, white-hot centre second. A single white point reads as a
   // star; a small amber ball with a core reads as something on fire.
   put(head[0],head[1],head[2],warm,contrast*.78*flick,.58);
   put(head[0],head[1],head[2],hot,contrast*1.35*flick,.24);
   // Sputter: grains shed along the last half second of travel, drifting upward
   // through the tail so the ascent is a fuse, not a laser.
   const sr=rng((e.seed^0x1d872b41)>>>0);
   for(let k=0;k<6;k++){
    const u=sr(),v=sr(),back=.04+((k/6+t*.55)%1)*.38;
    const q=launchPosition(e,Math.max(e.launch,t-back)),spread=.08+back*.20;
    put(q[0]+(u-.5)*spread,q[1]+(v-.5)*spread*.8,q[2]+(u-.5)*spread*.5,
        warm,contrast*.50*(1-back*1.7)*flick,.15+v*.11);
   }
   const span=.42,steps=9;
   for(let k=0;k<steps;k++){
    const a=t-k*span/steps,b=a-span/steps;
    if(a<e.launch)break;
    const pa=launchPosition(e,Math.max(e.launch,a)),pb=launchPosition(e,Math.max(e.launch,b));
    const f=1-k/steps;
    segment(pa,pb,PALETTE[0].main,contrast*1.15*f,contrast*1.15*(f-1/steps),3.6*px*f,3.6*px*(f-1/steps));
   }
   return;
  }

  // Ignition: a hot flash plus a wide, very faint halo that lifts the sky.
  const flash=Math.exp(-age*26);
  if(flash>.02)put(x,y,z,skin.core,contrast*flash*1.0,1.8+4.0*flash);
  // Lit smoke. A burst seen from the far shore is never sharp: the shell lights
  // its own smoke, and that envelope is what turns dots into a glow. It grows
  // with the shell instead of sitting at a fixed size, and outlives the sparks.
  const halo=Math.exp(-age*1.7);
  if(halo>.02)put(x,y,z,skin.main,contrast*halo*.085,12+e.size*.85*(1-Math.exp(-age*1.5)));
  const plasma=Math.exp(-age*5.5);
  if(plasma>.02)put(x,y,z,skin.core,contrast*plasma*.18,2.4+3.0*(1-Math.exp(-age*9)));
  const ember=Math.exp(-age*1.5);
  if(ember>.02)put(x,y,z,skin.main,contrast*ember*.055,5.0);

  // Tail length is a fraction of the shell radius, not a duration. A time-based
  // tail shrinks as drag kills the spark, which is why early versions turned
  // into fur near the end of the burn.
  const tailFrac=e.shape===2?.5:e.shape===1?.28:.15;
  for(const p of pattern(e)){
   if(age>=p.life)continue;
   const n=age/p.life;
   const head=sparkAt(e,p,age);
   const ignite=Math.min(1,age*30);
   let tw=.76+.24*Math.sin(age*(13+p.tw*11)+p.phase);
   if(n>.5)tw*=.48+.52*Math.abs(Math.sin(age*(24+p.tw*17)+p.phase*1.9));
   const a=contrast*Math.pow(1-n,1.15)*ignite*tw*p.gain;
   const col=p.core?skin.core:skin.main;
   put(head[0],head[1],head[2],col,a,p.size);
   // Instantaneous speed along the analytic path; the tail spans a fixed world
   // length, so seeking and pausing never change its silhouette.
   if(!p.trail)continue;
   const v=p.speed*(.8*2.2*Math.exp(-2.2*age)+.2*.35*Math.exp(-.35*age));
   const span=Math.min(age*.92,tailFrac/Math.max(.12,v));
   for(let k=0;k<TRAIL_STEPS;k++){
    const u=k/TRAIL_STEPS,w=(k+1)/TRAIL_STEPS;
    const ta=age-u*span,tb=age-w*span;
    if(ta<=0||tb<=0)break;
    const pa=sparkAt(e,p,ta),pb=sparkAt(e,p,tb);
    const b=contrast*Math.pow(1-n,1.2)*ignite*tw*(p.core?.80:1.0);
    segment(pa,pb,col,b*Math.pow(1-u,1.5),b*Math.pow(1-w,1.5),6.2*px*(1-u*.68),6.2*px*(1-w*.68));
   }
  }
 }

 // A single shell on a 1500px frame reads as one lonely dandelion. Accented
 // events get one smaller companion a beat later, off to the side, in a
 // neighbouring hue: a two-burst phrase instead of one puff. The companion is
 // mirrored back if it would land on the antenna or the frame edge.
 function draw(e,t,contrast){
  drawBurst(e,t,contrast,true);
  if(e.background||!e.accent||mobile)return;
  const r=rng((e.seed^0x5bf03635)>>>0);
  const dx=(r()-.5)*36,dy=(r()*.8+.15)*7.5,dz=(r()-.5)*10;
  const twin={
   ...e,
   position:[e.position[0]+dx,e.position[1]+dy,e.position[2]+dz],
   burst:e.burst+.21,launch:e.launch+.21,
   size:e.size*.64,seed:(e.seed+7919)>>>0,color:(e.color+3)%PALETTE.length
  };
  if(camera){
   projected.set(twin.position[0],twin.position[1],twin.position[2]).project(camera);
   if(Math.abs(projected.x)>.6)twin.position[0]-=dx*2;
  }
  drawBurst(twin,t,contrast*.95,false);
 }

 function tick(){
  if(disposed||!enabled||document.hidden){clear();return;}
  const track=getTrack();if(!track||!audio.src){clear();return;}
  const key=String(track.id)+'|'+(track.audioBlob?.size||'stream')+'|'+SCORE_VERSION;
  if(trackKey!==key){trackKey=key;score=null;background=null;lastTime=-1;randomCache.clear();clear();prepare(track,key);}
  if(!score)return;
  if(!background)background=backgroundScore(score.duration||track.duration,hash(key),score.events);
  const t=audio.currentTime||0;
  camera?.updateMatrixWorld();
  const nextView=camera?camera.matrixWorld.elements.join(',')+camera.projectionMatrix.elements.join(','):'';
  if(t===lastTime&&root.visible&&viewKey===nextView)return;
  viewKey=nextView;lastTime=t;root.visible=true;trailCount=0;count=0;

  // Point size must be expressed in drawing-buffer pixels, not CSS pixels.
  const bufferHeight=renderer.domElement.height||1000;
  material.uniforms.focal.value=bufferHeight/(2*Math.tan((camera?.fov||39)*Math.PI/360));
  px=renderer.getPixelRatio();

  const state=timeSystem?.state,stars=state?.stars||0;
  const contrast=.13+.90*stars+.25*(state?.dawnGlow||0)+.30*(state?.phase==='sunset'?1:0)*Math.max(0,Math.min(1,1-(state?.frontFill||0)/4.8));
  const list=visibleEvents(score.events,t,mode==='atmosphere'?'sparse':density,reduced.matches);
  const small=reduced.matches?[]:visibleEvents(background,t,'rich').filter((e,i)=>density==='rich'||i%4!==3).slice(0,Math.min(1,3-list.length));
  backgroundActive=small.length;active=list.length+small.length;
  for(const e of [...list,...small])draw(e,t,contrast);

  geometry.setDrawRange(0,count);
  for(const a of Object.values(geometry.attributes))a.needsUpdate=true;
  trailGeometry.setDrawRange(0,trailCount);
  for(const a of Object.values(trailGeometry.attributes))a.needsUpdate=true;
 }
 const hide=()=>{if(document.hidden)clear();else{lastTime=-1;tick();}};
 document.addEventListener('visibilitychange',hide);

 return{
  tick,setEnabled,
  get schedule(){return score?score.events.map(e=>({...e,position:[...e.position]})):[];},
  get backgroundSchedule(){return background?background.map(e=>({...e,position:[...e.position]})):[];},
  get state(){return{backgroundActive,backgroundEvents:background?.length||0,enabled,density,mode,analyzing,cached,trackKey,events:score?.events.length||0,active,particles:count,trailSegments:trailCount/6,time:audio.currentTime||0,version:SCORE_VERSION};},
  dispose(){disposed=true;cancel();clear();document.removeEventListener('visibilitychange',hide);root.removeFromParent();trailGeometry.dispose();trailMaterial.dispose();geometry.dispose();material.dispose();ui.remove();}
 };
}

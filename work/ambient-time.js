import {sampleDayCycle} from './day-cycle.js';
import {sunsetPalette} from './sunset-sky.js';
import {createTimeMaterials} from './time-materials.js';
// Time owns light and sky; weather owns geometry. Midday restores the captured studio.
const KEY='cassette-world.environment.time.v1';
export function createAmbientTime({scene,renderer,types:T,host,snow,ground,waterUniforms}){
 const Color=scene.fog.color.constructor;
 const color=s=>new Color(s);
 const materials=createTimeMaterials(scene,Color);
 const snowShade=new Color().setRGB(.34,.43,.49),snowLight=new Color().setRGB(.84,.86,.85),flakeTint=new Color().setRGB(.90,.93,.93);
 const baseline={background:snow.originalColors.background.clone(),fog:snow.originalColors.fog.clone(),environment:scene.environmentIntensity,exposure:renderer.toneMappingExposure,near:scene.fog.near,far:scene.fog.far};
 // A broad front bounce keeps the face readable while the sun/moon remains behind it.
 // Reuse the existing area-light implementation; no extra shadow map or render pass.
 const areaTemplate=scene.children.find(o=>o.isRectAreaLight);
 const frontFill=areaTemplate?.clone();
 if(frontFill){frontFill.name='Time / front bounce';frontFill.intensity=0;frontFill.width=14;frontFill.height=10;frontFill.position.set(1,18,16);frontFill.lookAt(0,0,0);scene.add(frontFill);}
 const lights=[];scene.traverse(o=>{if(o.isLight)lights.push({o,color:o.color.clone(),ground:o.groundColor?.clone(),intensity:o.intensity,position:o.position.clone(),quaternion:o.quaternion.clone()});});
 const profiles={
  midday:{sky:'#cecdc5',horizon:'#cecdc5',fog:'#cecdc5',sun:'#fff5e2',fill:'#edf0e8',ground:'#9d9b8d',front:0,frontColor:'#edf0e8',power:1,environment:1,exposure:1,position:[-8,20,10],shadow:[.34,.43,.49],snow:[.84,.86,.85],water:[.12,.20,.17]},
  sunset:{sky:'#586078',horizon:'#eab18a',fog:'#a9a5b3',sun:'#ffd19a',fill:'#9aacc8',ground:'#737f96',front:2.8,frontColor:'#c7ced9',power:.8,environment:.68,exposure:.98,position:[-25,10,-8],shadow:[.30,.35,.46],snow:[.91,.72,.57],water:[.22,.17,.18]},
  sunrise:{sky:'#a2b1c2',horizon:'#edcbb2',fog:'#d2c3bb',sun:'#ffdab3',fill:'#b6c9df',ground:'#9794a0',front:3,frontColor:'#e6dfd5',power:.8,environment:.8,exposure:1,position:[16,11,-10],shadow:[.37,.43,.53],snow:[.88,.80,.70],water:[.16,.20,.23]},
  night:{sky:'#273447',horizon:'#657087',fog:'#596579',sun:'#baccea',fill:'#879bc0',ground:'#4c5368',front:4.8,frontColor:'#a8bfdf',power:.32,environment:.45,exposure:.95,position:[-10,19,-7],shadow:[.14,.20,.29],snow:[.48,.57,.69],water:[.06,.11,.19]}
 };
 let mode='manual',phase='midday',progress=1,disposed=false,lastClock=-1;
 try{const saved=JSON.parse(localStorage.getItem(KEY)||'null');if(saved){mode=saved.mode==='clock'?'clock':'manual';if(profiles[saved.phase])phase=saved.phase;}}catch{}
 const ui=document.createElement('fieldset');ui.id='environment-time-settings';ui.innerHTML='<legend>一天的光线</legend><label>时间方式 <select aria-label="时间方式"><option value="manual">手动选择</option><option value="clock">跟随现实时间</option></select></label><label>光线 <select aria-label="时段"><option value="sunrise">日出</option><option value="midday">日中 · 原始光照</option><option value="sunset">日落</option><option value="night">夜晚</option></select></label><p>日落带来暖色侧光与冷色阴影，可搭配水面或雪地。跟随本机时间连续变化：凌晨渐明、上午转入日光，14 点后逐渐染上晚霞，19–21 点慢慢入夜；水雪、材质与星光同步渐变。</p>';
 host.append(ui);const [modeInput,phaseInput]=ui.querySelectorAll('select');
 const previewButton=document.createElement('button');previewButton.type='button';previewButton.textContent='快速模拟一天 · 60 秒';ui.append(previewButton);
 let preview=null;
 function stopPreview(restore=true){if(!preview)return;const saved=preview;preview=null;previewButton.textContent='快速模拟一天 · 60 秒';if(restore){mode=saved.mode;if(mode==='clock'){applyClock();sync();}else setPhase(saved.phase);} }
 function startPreview(){if(preview){stopPreview();return;}preview={elapsed:0,mode,phase};previewButton.textContent='停止模拟 · 恢复原时间';applyClock(previewDate(0));}
 function previewDate(elapsed){const d=new Date();d.setHours(0,0,0,0);d.setMilliseconds((4.5+elapsed/60*24)*3600000);return d;}
 previewButton.addEventListener('click',startPreview);
 const uniforms={skyFog:{value:scene.fog.color.clone()},nightAmount:{value:phase==='night'?1:0},dawnAmount:{value:phase==='sunrise'?1:0},sunsetAmount:{value:phase==='sunset'?1:0},top:{value:color(profiles[phase].sky)},horizon:{value:color(profiles[phase].horizon)},inverseProjection:{value:new T.Matrix4()},cameraWorld:{value:new T.Matrix4()}};
 materials.uniforms.timeSunsetAmount=uniforms.sunsetAmount;
 // Let distant ground fog meet the same angular sky; no separate horizon strip.
 const groundMaterial=ground?.material;
 const oldGroundCompile=groundMaterial?.onBeforeCompile,oldGroundKey=groundMaterial?.customProgramCacheKey;
 if(groundMaterial){groundMaterial.onBeforeCompile=function(shader,...args){oldGroundCompile?.call(this,shader,...args);shader.uniforms.timeSunset=uniforms.sunsetAmount;shader.vertexShader='varying vec3 timeGroundPosition;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <worldpos_vertex>','#include <worldpos_vertex>\ntimeGroundPosition=(modelMatrix*vec4(transformed,1.0)).xyz;');shader.fragmentShader='varying vec3 timeGroundPosition;uniform float timeSunset;\n'+sunsetPalette+shader.fragmentShader;shader.fragmentShader=shader.fragmentShader.replace('#include <fog_fragment>',`#ifdef USE_FOG
  #ifdef FOG_EXP2
   float timeFogFactor=1.0-exp(-fogDensity*fogDensity*vFogDepth*vFogDepth);
  #else
   float timeFogFactor=smoothstep(fogNear,fogFar,vFogDepth);
  #endif
  vec3 goldenFog=sunsetSky(normalize(timeGroundPosition-cameraPosition));
  #ifdef TONE_MAPPING
   goldenFog=toneMapping(goldenFog);
  #endif
  goldenFog=linearToOutputTexel(vec4(goldenFog,1.0)).rgb;
  vec3 timeFog=mix(fogColor,goldenFog,timeSunset);
  vec3 nearGround=gl_FragColor.rgb*mix(vec3(1.0),vec3(.86,.84,.91),timeSunset);
  gl_FragColor.rgb=mix(nearGround,timeFog,timeFogFactor);
 #endif`);};groundMaterial.customProgramCacheKey=function(){return oldGroundKey.call(this)+'|golden-hour-ground-v1'};groundMaterial.needsUpdate=true;}
 const sky=new T.Mesh(new T.PlaneGeometry(2,2),new T.ShaderMaterial({name:'Time of day / soft sky',depthWrite:false,uniforms,vertexShader:'varying vec2 skyUV;void main(){skyUV=position.xy;gl_Position=vec4(position.xy,.999999,1.0);}',fragmentShader:`
 varying vec2 skyUV;uniform vec3 skyFog;uniform vec3 top;uniform vec3 horizon;uniform float sunsetAmount;uniform float nightAmount;uniform float dawnAmount;uniform mat4 inverseProjection;uniform mat4 cameraWorld;
 ${sunsetPalette}
 float starHash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
 void main(){
  vec4 v=inverseProjection*vec4(skyUV,1.0,1.0);vec3 ray=normalize(mat3(cameraWorld)*v.xyz);
  float h=smoothstep(-.48,.18,ray.y);
  vec3 sky=mix(horizon,top,h);
  sky=mix(sky,sunsetSky(ray),sunsetAmount);
  // Dawn is broad scattered light, with no disc or hard-edged rays.
  vec3 dawnDirection=normalize(vec3(.6,-.10,-1.0));
  float dawnFacing=pow(max(dot(ray,dawnDirection),0.0),5.0);
  float dawnBand=exp(-pow((ray.y+.25)/.24,2.0));
  sky+=dawnAmount*(vec3(.42,.23,.08)*dawnFacing+vec3(.16,.075,.025)*dawnBand);
  // Stars live in angular world coordinates: fixed during orbiting and reflected by water.
  vec2 celestial=vec2(atan(ray.x,ray.z)/6.2831853+.5,asin(clamp(ray.y,-1.0,1.0))/3.14159265+.5);
  vec2 grid=celestial*vec2(480.0,240.0),cell=floor(grid);
  vec2 center=vec2(starHash(cell+7.2),starHash(cell+31.6))*.7+.15;
  vec2 delta=fract(grid)-center;
  float seed=starHash(cell),radius=mix(.008,.026,starHash(cell+12.1));
  float aa=max(length(fwidth(grid))*.35,.006);
  float star=(1.0-smoothstep(radius,radius+aa,length(delta)))*step(.965,seed);
  float starHeight=smoothstep(-.3,.04,ray.y);
  vec3 starColor=mix(vec3(.75,.86,1.0),vec3(1.0,.86,.67),starHash(cell+65.0));
  sky+=starColor*star*mix(.8,2.3,starHash(cell+43.2))*starHeight*nightAmount;
  gl_FragColor=vec4(sky,1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
  gl_FragColor.rgb=mix(skyFog,gl_FragColor.rgb,smoothstep(-.12,.10,ray.y)*(1.0-sunsetAmount)+sunsetAmount);
 }`}));
 sky.name='Time sky';sky.frustumCulled=false;sky.renderOrder=-1000;sky.raycast=()=>{};sky.userData.environmentOnly=true;sky.onBeforeRender=(r,s,c)=>{uniforms.skyFog.value.copy(scene.fog.color);if(!r.getRenderTarget()||r.getRenderTarget().texture.colorSpace==='srgb')uniforms.skyFog.value.convertLinearToSRGB();uniforms.inverseProjection.value.copy(c.projectionMatrixInverse);uniforms.cameraWorld.value.copy(c.matrixWorld);};scene.add(sky);
 let from=null;
 function snapshot(){return {water:waterUniforms.waterTint.value.clone(),waterSun:waterUniforms.sunTint.value.clone(),snowShade:snowShade.clone(),snowLight:snowLight.clone(),flake:flakeTint.clone(),reflection:materials.uniforms.timeReflectionTint.value.clone(),ink:materials.uniforms.timeInkTint.value.clone(),inkAmount:materials.uniforms.timeInkAmount.value,near:scene.fog.near,far:scene.fog.far,background:scene.background.clone(),fog:scene.fog.color.clone(),environment:scene.environmentIntensity,exposure:renderer.toneMappingExposure,top:uniforms.top.value.clone(),horizon:uniforms.horizon.value.clone(),sunset:uniforms.sunsetAmount.value,night:uniforms.nightAmount.value,dawn:uniforms.dawnAmount.value,lights:lights.map(({o})=>({color:o.color.clone(),ground:o.groundColor?.clone(),intensity:o.intensity,position:o.position.clone()}))};}
 let clockEndpoints=null,clockSample=null;
 function applyClock(date=new Date()){
  // Endpoint snapshots are rebuilt only when the weather changes, never each frame.
  if(!clockEndpoints){clockEndpoints={};for(const key of Object.keys(profiles)){from=snapshot();phase=key;progress=1;apply(1);clockEndpoints[key]=snapshot();}}
  clockSample=sampleDayCycle(date);from=clockEndpoints[clockSample.from];phase=clockSample.to;progress=1;apply(clockSample.blend);
  phaseInput.value=clockSample.blend<.5?clockSample.from:clockSample.to;
 }
 function setMode(value){stopPreview(false);mode=value==='clock'?'clock':'manual';if(mode==='clock'){applyClock();sync();}else setPhase(phase);lastClock=-1;}

 function sync(){modeInput.value=mode;phaseInput.value=phase;phaseInput.disabled=mode==='clock';try{localStorage.setItem(KEY,JSON.stringify({mode,phase}));}catch{}}
 function setPhase(value,immediate=false){if(!profiles[value])return;stopPreview(false);materials.scan();from=snapshot();phase=value;progress=immediate?1:0;sync();apply(immediate?1:0);}
 function apply(t){const p=profiles[phase],day=phase==='midday',s=snow.state.enabled;
  uniforms.nightAmount.value=from.night+((phase==='night'?1:0)-from.night)*t;
  uniforms.dawnAmount.value=from.dawn+((phase==='sunrise'?1:0)-from.dawn)*t;
  uniforms.sunsetAmount.value=from.sunset+((phase==='sunset'?1:0)-from.sunset)*t;
  waterUniforms.timeSunset.value=uniforms.sunsetAmount.value;
  scene.fog.near=from.near+((day?baseline.near:30)-from.near)*t;scene.fog.far=from.far+((day?baseline.far:85)-from.far)*t;
  const bg=day?(s?color('#d3dad8'):baseline.background):color(p.fog);
  scene.background.copy(from.background).lerp(bg,t);scene.fog.color.copy(from.fog).lerp(day?(s?bg:baseline.fog):bg,t);
  scene.environmentIntensity=from.environment+(baseline.environment*p.environment-from.environment)*t;renderer.toneMappingExposure=from.exposure+(baseline.exposure*p.exposure-from.exposure)*t;
  uniforms.top.value.copy(from.top).lerp(color(p.sky),t);uniforms.horizon.value.copy(from.horizon).lerp(color(p.horizon),t);sky.visible=!day||t<1;
  lights.forEach((b,i)=>{const o=b.o,a=from.lights[i];o.color.copy(a.color).lerp(o===frontFill?color(p.frontColor):day?b.color:color(o.isHemisphereLight?p.fill:o.isDirectionalLight&&!o.castShadow?p.fill:p.sun),t);const targetIntensity=o===frontFill?p.front:b.intensity*(phase==='sunset'?(o.isRectAreaLight?.30:o.castShadow?2.1:.72):p.power);o.intensity=a.intensity+(targetIntensity-a.intensity)*t;if(o.groundColor)o.groundColor.copy(a.ground).lerp(day?b.ground:color(p.ground),t);
   if(o!==frontFill&&(o.isRectAreaLight||o.castShadow)){// Keep the softbox overhead: a low area-light plane cuts the distant floor into lit/unlit halves.
   const target=day||o.isRectAreaLight?b.position:new T.Vector3(...p.position);o.position.copy(a.position).lerp(target,t);if(o.isRectAreaLight){if(day&&t===1)o.quaternion.copy(b.quaternion);else o.lookAt(1,3,-1);}}
  });
  uniforms.skyFog.value.copy(scene.fog.color);
  const reflection=phase==='sunset'?[1.06,.95,.91]:phase==='sunrise'?[1.06,.96,.87]:phase==='night'?[.65,.79,1.03]:[1,1,1];
  materials.uniforms.timeReflectionTint.value.copy(from.reflection).lerp(new Color().setRGB(...reflection),t);
  materials.uniforms.timeInkTint.value.copy(from.ink).lerp(color(phase==='night'?'#d1d9df':phase==='sunset'?'#877084':'#817565'),t);
  materials.uniforms.timeInkAmount.value=from.inkAmount+((phase==='night'?.78:phase==='sunset'?.20:phase==='sunrise'?.10:0)-from.inkAmount)*t;
  snowShade.copy(from.snowShade).lerp(new Color().setRGB(...p.shadow),t);snowLight.copy(from.snowLight).lerp(new Color().setRGB(...p.snow),t);
  flakeTint.copy(from.flake).lerp(day?new Color().setRGB(.90,.93,.93):color(phase==='sunset'?'#efd2c0':phase==='night'?'#aebed6':'#f3e5d5'),t);
  waterUniforms.fogNear.value=scene.fog.near;waterUniforms.fogFar.value=scene.fog.far;waterUniforms.fogColor.value.copy(scene.fog.color);waterUniforms.waterTint.value.copy(from.water).lerp(new Color().setRGB(...p.water),t);waterUniforms.sunTint.value.copy(from.waterSun).lerp(day?new Color().setRGB(.96,.98,.92):color(p.sun),t);
  snow.setLighting({sunset:uniforms.sunsetAmount.value,shadow:snowShade.toArray(),light:snowLight.toArray(),flake:flakeTint,fog:scene.fog.color,near:scene.fog.near,far:scene.fog.far});
  if(t<1||progress===1)renderer.shadowMap.needsUpdate=true;
 }
 modeInput.addEventListener('change',()=>setMode(modeInput.value));phaseInput.addEventListener('change',()=>setPhase(phaseInput.value));
 let weather=snow.state.enabled;
 if(mode==='clock'){applyClock();sync();}else setPhase(phase,true);
 return {refreshMaterials:materials.scan,setPhase,setMode,tick(dt){
  if(disposed||document.hidden)return;
  if(weather!==snow.state.enabled){weather=snow.state.enabled;materials.scan();clockEndpoints=null;if(mode==='clock'||preview)lastClock=-1;else{from=snapshot();progress=1;apply(1);}}
  if(preview){preview.elapsed=Math.min(60,preview.elapsed+Math.min(.1,Math.max(0,dt)));if(preview.elapsed>=60){stopPreview();}else applyClock(previewDate(preview.elapsed));return;}
  if(mode==='clock'){const second=Math.floor(Date.now()/1000);if(second!==lastClock){lastClock=second;applyClock();}return;}
  if(progress<1){progress=Math.min(1,progress+Math.min(.1,Math.max(0,dt))/2.2);apply(progress*progress*(3-2*progress));}
 },get state(){return {mode,phase,transition:progress,preview:preview?{elapsed:preview.elapsed,duration:60}:null,cycle:mode==='clock'||preview?clockSample:null,background:scene.fog.color.getHexString(),reflectionTint:materials.uniforms.timeReflectionTint.value.toArray(),lyricLift:materials.uniforms.timeInkAmount.value,waterTint:waterUniforms.waterTint.value.toArray(),snowTint:snowLight.toArray(),frontFill:frontFill?.intensity||0,stars:uniforms.nightAmount.value,dawnGlow:uniforms.dawnAmount.value,sunDisc:false,localHour:new Date().getHours()};},dispose(){disposed=true;if(groundMaterial){groundMaterial.onBeforeCompile=oldGroundCompile;groundMaterial.customProgramCacheKey=oldGroundKey;groundMaterial.needsUpdate=true;}materials.dispose();if(frontFill)scene.remove(frontFill);ui.remove();scene.remove(sky);sky.geometry.dispose();sky.material.dispose();}};
}

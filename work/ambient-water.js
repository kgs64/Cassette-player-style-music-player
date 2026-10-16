import {enhanceSettingsLayout} from './settings-layout.js';
import {createAmbientRain} from './ambient-rain.js';
import {sunsetPalette} from './sunset-sky.js';
import {createAmbientTime} from './ambient-time.js';
import {compactPlinth} from './plinth-layout.js';
import {createAmbientSnow} from './ambient-snow.js';
// Pool environment: independent scene objects, existing audio envelope and render loop.
// Planar reflection clipping follows Three.js r170 Water.js (MIT, see third-party notices).
const KEY='cassette-world.environment.water.v1';
const MAX_RIPPLES=6, WATER_Y=-.14, MAX_HEIGHT=.192, FLOOR_Y=-1.55;
const waveGLSL=`
uniform float waterTime;
uniform float waterEnergy;
uniform float waterVolume;
uniform vec4 waterRipples[6];
// x = height, yz = analytic world-space gradient. Both shader stages share this function.
vec3 waterWave(vec2 p){
 // Quiet water has only a barely perceptible drift. Music emits broad outward wave packets.
 float phase=dot(p,vec2(.11,.08))-waterTime*.2;
 vec3 w=vec3(.0015*sin(phase),vec2(.000165,.00012)*cos(phase));
 for(int i=0;i<6;i++){
  vec4 r=waterRipples[i];float age=waterTime-r.z;
  if(age>=0.0 && age<6.8 && r.w>0.0){
   vec2 delta=p-r.xy;vec2 stretch=vec2(1.13,.96);float dist=length(delta/stretch);float q=dist-(8.8+age*4.5);
   float fade=exp(-age*.22)*smoothstep(0.0,.26,age)*(1.0-smoothstep(5.5,6.8,age));
   float envelope=exp(-q*q*.10)*fade*r.w*.21*waterVolume;
   float wave=sin(q*1.0);float derivative=cos(q)-q*.20*wave;
   w.x+=envelope*wave;w.yz+=delta/(stretch*stretch*max(dist,.001))*envelope*derivative;
  }
 }
 return w*.8;
}
`;

const boundaryGLSL=`
float poolDistance(vec2 p,vec2 halfSize,float radius){vec2 q=abs(p)-halfSize+radius;return length(max(q,0.0))+min(max(q.x,q.y),0.0)-radius;}
`;
export function createAmbientWater({scene,ground,base,camera,renderer,types:T}){
 const layout=compactPlinth(base);
 let enabled=true;try{enabled=localStorage.getItem(KEY)!=='off';}catch{}
 let snow=null,timeSystem=null,rain=null;
 let root=null,mesh=null,reflection=null,refraction=null,elapsed=0,level=0,previousEnergy=0,lastPulse=-10,pulseIndex=0,pulseCount=0,compiled=false,disposed=false,rendering=false,reflectionFrames=0,outputVolume=0;
 const originalGroundMaterial=ground.material,originalGroundShadow=ground.castShadow,originalGroundVisible=ground.visible,originalBaseVisible=base.visible,resources=[];
 const ripples=new Float32Array(MAX_RIPPLES*4);
 for(let i=0;i<MAX_RIPPLES;i++)ripples[i*4+2]=-100;
 const textureMatrix=new T.Matrix4(),eye=new T.Vector3(),clipPlane=new T.Vector4(),q=new T.Vector4(),plane=new T.Plane(),normal=new T.Vector3(0,1,0),waterPosition=new T.Vector3(base.position.x,WATER_Y,base.position.z),look=new T.Vector3(),target=new T.Vector3(),rotation=new T.Matrix4(),viewport=new T.Vector4(),scissor=new T.Vector4();
 const mirrorCamera=camera.clone();
 const uniforms={timeSunset:{value:0},waterTint:{value:scene.fog.color.clone().setRGB(.12,.20,.17)},sunTint:{value:scene.fog.color.clone().setRGB(.96,.98,.92)},plinthHalfSize:{value:[layout.halfWidth-.01,layout.halfDepth-.01]},fogColor:{value:scene.fog.color.clone()},fogNear:{value:scene.fog.near},fogFar:{value:scene.fog.far},waterTime:{value:0},waterEnergy:{value:0},waterVolume:{value:0},waterRipples:{value:ripples},mirrorTexture:{value:null},underwaterTexture:{value:null},underwaterDepth:{value:null},textureMatrix:{value:textureMatrix},eye:{value:eye},nearFar:{value:[camera.near,camera.far]},poolCenter:{value:[base.position.x,base.position.z]}};
 function remember(resource){resources.push(resource);return resource;}
 function add(geometry,material,name){const object=new T.Mesh(remember(geometry),remember(material));object.name=name;object.raycast=()=>{};object.userData.environmentOnly=true;root.add(object);return object;}
 function stone(color,roughness=.7){const m=originalGroundMaterial.clone();m.color.set(color);m.roughness=roughness;m.metalness=0;return m;}
 function createBasin(){
  root=new T.Group();root.name='Music pool environment';root.position.set(base.position.x,0,base.position.z);scene.add(root);
  // Hide, never reshape, the old ground. The original object is restored when disabled.
  ground.visible=false;
  const bottomMat=stone('#758c81',.82);
  const bottom=add(new T.PlaneGeometry(600,600),bottomMat,'Unpatterned submerged floor');bottom.rotation.x=-Math.PI/2;bottom.position.y=FLOOR_Y;bottom.receiveShadow=true;
  // One continuous plinth removes the groove between two separately rounded boxes.
  // Translate the lower half of a private clone, preserving the original top and bevel.
  const geometry=base.geometry.clone();geometry.computeBoundingBox();
  const extension=base.position.y+geometry.boundingBox.min.y-FLOOR_Y;
  const positions=geometry.attributes.position;
  for(let i=0;i<positions.count;i++)if(positions.getY(i)<0)positions.setY(i,positions.getY(i)-extension);
  positions.needsUpdate=true;geometry.computeBoundingBox();geometry.computeBoundingSphere();
  const support=add(geometry,base.material.clone(),'Continuous water plinth');
  support.position.y=base.position.y;support.receiveShadow=base.receiveShadow;support.castShadow=base.castShadow;
  base.visible=false;
 }
 function makeSurface(){
  createBasin();
  reflection=new T.WebGLRenderTarget(1024,1024,{type:1016});refraction=new T.WebGLRenderTarget(1024,1024,{type:1016});
  refraction.depthTexture=new T.DepthTexture(1024,1024);uniforms.mirrorTexture.value=reflection.texture;uniforms.underwaterTexture.value=refraction.texture;uniforms.underwaterDepth.value=refraction.depthTexture;
  const material=new T.ShaderMaterial({name:'Music pool / reflection and depth absorption',uniforms,depthWrite:true,fog:true,
   vertexShader:`
    varying vec2 waterPoint;varying vec4 reflectedPosition;varying vec4 refractedPosition;varying vec3 waterWorld;varying float waterViewDepth;
    uniform mat4 textureMatrix;
    #include <fog_pars_vertex>
    ${waveGLSL}
    void main(){
     waterPoint=vec2(position.x,-position.y);
     vec3 displaced=position;displaced.z+=clamp(waterWave(waterPoint).x,-.192,.192);
     vec4 world=modelMatrix*vec4(displaced,1.0);waterWorld=world.xyz;
     reflectedPosition=textureMatrix*world;
     vec4 view=modelViewMatrix*vec4(displaced,1.0);waterViewDepth=-view.z;
     refractedPosition=projectionMatrix*view;gl_Position=refractedPosition;
     #ifdef USE_FOG
     vFogDepth=-view.z;
     #endif
    }`,
   fragmentShader:`
    uniform vec2 plinthHalfSize;uniform sampler2D mirrorTexture;uniform sampler2D underwaterTexture;uniform sampler2D underwaterDepth;
    uniform float timeSunset;uniform vec3 waterTint;uniform vec3 sunTint;uniform vec3 eye;uniform vec2 nearFar;
    varying vec2 waterPoint;varying vec4 reflectedPosition;varying vec4 refractedPosition;varying vec3 waterWorld;varying float waterViewDepth;
    #include <common>
    #include <packing>
    #include <fog_pars_fragment>
    ${waveGLSL}
    ${boundaryGLSL}
    ${sunsetPalette}
    void main(){
     if(poolDistance(waterPoint,plinthHalfSize,.15)<-.025)discard;
     vec3 shape=waterWave(waterPoint);
     float distanceFade=1.0-smoothstep(24.0,65.0,length(eye-waterWorld));
     vec3 n=normalize(vec3(-shape.y*2.0*distanceFade,1.0,-shape.z*2.0*distanceFade));
     vec3 v=normalize(eye-waterWorld);
     vec2 uv=refractedPosition.xy/refractedPosition.w*.5+.5;
     float rawDepth=texture2D(underwaterDepth,uv).r;
     float sceneZ=-perspectiveDepthToViewZ(rawDepth,nearFar.x,nearFar.y);
     float thickness=clamp((sceneZ-waterViewDepth)*max(.15,v.y),0.0,3.0);
     vec2 refractUV=clamp(uv+n.xz*.018*min(thickness,1.5),vec2(.002),vec2(.998));
     float distortedZ=-perspectiveDepthToViewZ(texture2D(underwaterDepth,refractUV).r,nearFar.x,nearFar.y);
     if(distortedZ<waterViewDepth+.015)refractUV=uv;
     vec3 transmitted=texture2D(underwaterTexture,refractUV).rgb;
     vec3 absorption=exp(-vec3(.32,.18,.14)*thickness);
     transmitted=transmitted*absorption+waterTint*(1.0-absorption);
     vec2 reflectUV=reflectedPosition.xy/reflectedPosition.w+n.xz*.021;
     vec3 reflected=texture2D(mirrorTexture,clamp(reflectUV,vec2(.002),vec2(.998))).rgb;
     // Preserve real object reflections close to the plinth; open water carries the sky.
     vec3 reflectedRay=reflect(-v,n);
     vec3 skyReflection=sunsetSky(vec3(reflectedRay.x,reflectedRay.y-.40,reflectedRay.z));
     float openWater=smoothstep(2.0,18.0,poolDistance(waterPoint,plinthHalfSize,.15));
     reflected=mix(reflected,skyReflection,timeSunset*mix(.28,.88,openWater));
     transmitted=mix(transmitted,transmitted*.65+skyReflection*.35,timeSunset*.60);
     float fresnel=mix(.12,.48,timeSunset)+mix(.76,.66,timeSunset)*pow(1.0-max(dot(n,v),0.0),3.5);
     vec3 light=normalize(vec3(-.35,1.0,.45));
     // A broad, low-contrast wash; no repeated sharp glints across every crest.
     float wash=pow(max(dot(n,normalize(normalize(vec3(-.18,1.0,-.65))+v)),0.0),8.0)*.085;
     transmitted*=.96+.06*max(dot(n,light),0.0);
     vec3 color=mix(transmitted,reflected,fresnel)+sunTint*wash;
     gl_FragColor=vec4(color,1.0);
     #include <tonemapping_fragment>
     #include <colorspace_fragment>
     #ifdef USE_FOG
      vec3 distantSky=sunsetSky(normalize(waterWorld-eye));
      #ifdef TONE_MAPPING
       distantSky=toneMapping(distantSky);
      #endif
      distantSky=linearToOutputTexel(vec4(distantSky,1.0)).rgb;
      float haze=smoothstep(fogNear,fogFar,vFogDepth);
      gl_FragColor.rgb=mix(gl_FragColor.rgb,mix(fogColor,distantSky,timeSunset),haze);
     #endif
    }`});
  mesh=add(new T.PlaneGeometry(600,600,640,640),material,'Music-reactive pool surface');mesh.rotation.x=-Math.PI/2;mesh.position.y=WATER_Y;mesh.renderOrder=2;
  mesh.onBeforeRender=renderPool;renderer.shadowMap.needsUpdate=true;compiled=true;
 }
 function renderPool(activeRenderer,activeScene,activeCamera){
  if(rendering||!enabled||activeCamera!==camera||scene.overrideMaterial||camera.position.y<=WATER_Y)return;
  rendering=true;
  const oldTarget=renderer.getRenderTarget(),oldXr=renderer.xr.enabled,oldAuto=renderer.shadowMap.autoUpdate,oldNeeds=renderer.shadowMap.needsUpdate,oldScissorTest=renderer.getScissorTest();
  renderer.getViewport(viewport);renderer.getScissor(scissor);
  try{
   const aspect=renderer.domElement.width/renderer.domElement.height,w=1280,h=Math.max(256,Math.round(w/aspect));
   if(refraction.width!==w||refraction.height!==h){refraction.setSize(w,h);reflection.setSize(w,h);}
   uniforms.nearFar.value[0]=camera.near;uniforms.nearFar.value[1]=camera.far;eye.setFromMatrixPosition(camera.matrixWorld);
   mirrorCamera.position.copy(eye);mirrorCamera.position.y=2*WATER_Y-eye.y;
   rotation.extractRotation(camera.matrixWorld);look.set(0,0,-1).applyMatrix4(rotation).add(eye);
   target.copy(look);target.y=2*WATER_Y-look.y;
   mirrorCamera.up.set(0,1,0).applyMatrix4(rotation).reflect(normal);mirrorCamera.lookAt(target);
   mirrorCamera.far=camera.far;mirrorCamera.near=camera.near;mirrorCamera.updateMatrixWorld();mirrorCamera.projectionMatrix.copy(camera.projectionMatrix);
   textureMatrix.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1).multiply(mirrorCamera.projectionMatrix).multiply(mirrorCamera.matrixWorldInverse);
   plane.setFromNormalAndCoplanarPoint(normal,waterPosition).applyMatrix4(mirrorCamera.matrixWorldInverse);
   clipPlane.set(plane.normal.x,plane.normal.y,plane.normal.z,plane.constant);
   const projection=mirrorCamera.projectionMatrix.elements;
   q.set((Math.sign(clipPlane.x)+projection[8])/projection[0],(Math.sign(clipPlane.y)+projection[9])/projection[5],-1,(1+projection[10])/projection[14]);
   clipPlane.multiplyScalar(2/clipPlane.dot(q));projection[2]=clipPlane.x;projection[6]=clipPlane.y;projection[10]=clipPlane.z+1-.001;projection[14]=clipPlane.w;
   mirrorCamera.projectionMatrixInverse.copy(mirrorCamera.projectionMatrix).invert();
   mesh.visible=false;renderer.xr.enabled=false;renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=false;
   renderer.setRenderTarget(reflection);renderer.state.buffers.depth.setMask(true);renderer.clear();renderer.render(scene,mirrorCamera);
   renderer.setRenderTarget(refraction);renderer.state.buffers.depth.setMask(true);renderer.clear();renderer.render(scene,camera);
   reflectionFrames++;
  }finally{
   mesh.visible=true;renderer.xr.enabled=oldXr;renderer.shadowMap.autoUpdate=oldAuto;renderer.shadowMap.needsUpdate=oldNeeds;
   renderer.setRenderTarget(oldTarget);renderer.setViewport(viewport);renderer.setScissor(scissor);renderer.setScissorTest(oldScissorTest);rendering=false;
  }
 }
 function release(){
  if(root)scene.remove(root);for(const resource of resources.splice(0))resource.dispose();reflection?.dispose();refraction?.dispose();
  root=mesh=reflection=refraction=null;ground.material=originalGroundMaterial;ground.castShadow=originalGroundShadow;ground.visible=originalGroundVisible;base.visible=originalBaseVisible;compiled=false;renderer.shadowMap.needsUpdate=true;
  uniforms.mirrorTexture.value=uniforms.underwaterTexture.value=uniforms.underwaterDepth.value=null;
 }
 function resetWaves(){outputVolume=0;uniforms.waterVolume.value=0;level=previousEnergy=0;lastPulse=-10;for(let i=0;i<MAX_RIPPLES;i++){ripples[i*4+2]=-100;ripples[i*4+3]=0;}uniforms.waterEnergy.value=0;}
 function setEnabled(value){if(disposed)return;enabled=!!value;if(enabled){snow?.setEnabled(false);if(!mesh)makeSurface();}if(!enabled){if(mesh)release();resetWaves();}try{localStorage.setItem(KEY,enabled?'on':'off');}catch{}checkbox.checked=enabled;timeSystem?.refreshMaterials();}
 function tick(dt,bass=0,loudness=0,playing=false,volume=1){
  timeSystem?.tick(dt);snow?.tick(dt);rain?.tick(dt,bass,loudness,playing,volume);
  if(!enabled||disposed||document.hidden)return;
  dt=Math.max(0,Math.min(.05,Number.isFinite(dt)?dt:0));elapsed+=dt;
  const audibleVolume=Number.isFinite(volume)?Math.min(1,Math.max(0,volume)):0;
  outputVolume+=(audibleVolume-outputVolume)*(1-Math.exp(-dt*10));
  uniforms.waterVolume.value=outputVolume;
  const energy=playing?Math.min(1,Math.max(0,bass*.65+loudness*.35)):0;
  level+=(energy-level)*(1-Math.exp(-dt*(energy>level?12:3)));
  if(playing&&audibleVolume>.001&&energy>.035&&elapsed-lastPulse>1.05&&(energy-previousEnergy>.018||elapsed-lastPulse>1.65)){
   const index=(pulseIndex++%MAX_RIPPLES)*4;
   ripples[index]=-base.position.x;ripples[index+1]=.2-base.position.z;ripples[index+2]=elapsed;ripples[index+3]=Math.min(1,.35+energy*1.15);
   lastPulse=elapsed;pulseCount++;
  }
  previousEnergy=energy;uniforms.waterTime.value=elapsed;uniforms.waterEnergy.value=level;
 }
 const section=document.createElement('fieldset');section.id='environment-water-settings';
 section.innerHTML='<legend>环境氛围</legend><label>音乐波纹 <input type="checkbox" aria-label="音乐波纹" data-water-enabled></label><p>磁带机的振动形成向四周扩散的宽幅波纹，暂停后逐渐平静。水可触及底座侧面，顶面保持干燥。关闭后恢复原来的地面，选择会保存在本机。</p>';
 const checkbox=section.querySelector('input');checkbox.checked=enabled;checkbox.addEventListener('change',()=>setEnabled(checkbox.checked));
 const host=document.querySelector('#machine-settings article');if(host)host.insertBefore(section,host.querySelector('section'));
 snow=createAmbientSnow({scene,ground,base,renderer,types:T,host:section,onEnable:()=>setEnabled(false)});
 if(enabled)makeSurface();
 timeSystem=createAmbientTime({scene,ground,renderer,types:T,host:section,snow,waterUniforms:uniforms});
 rain=createAmbientRain({scene,ground,base,types:T,host:section,water:()=>enabled,snow});
 enhanceSettingsLayout(host);
 return {tick,setEnabled,snow,timeSystem,rain,get state(){return {enabled,rain:rain.state,layout,volume:outputVolume,amplitude:MAX_HEIGHT*outputVolume,compiled,time:elapsed,energy:level,pulses:pulseCount,activeRipples:Array.from({length:MAX_RIPPLES},(_,i)=>ripples[i*4+3]>0&&elapsed-ripples[i*4+2]<6.8).filter(Boolean).length,surfaceY:WATER_Y,maxCrest:WATER_Y+MAX_HEIGHT,plinthTop:base.position.y+.25,poolFloor:FLOOR_Y,depth:WATER_Y-FLOOR_Y,footprint:[600,600],vertices:mesh?.geometry.attributes.position.count||0,reflectionPasses:enabled?2:0,reflectionFrames,renderTargetSize:reflection?[reflection.width,reflection.height]:null};},dispose(){rain.dispose();timeSystem.dispose();snow.dispose();release();section.remove();disposed=true;}};
}

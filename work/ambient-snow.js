import {sunsetPalette} from './sunset-sky.js';
// Snow is decorative: one static landscape and one GPU-animated billboard batch.
// Shares the existing Three.js runtime, camera depth and frame loop; never intercepts input.
const KEY='cassette-world.environment.snow.v1';
export function createAmbientSnow({scene,ground,base,renderer,types:T,host,onEnable}){
 let enabled=false,root=null,flakes=null,time=0,disposed=false,relief=null;
 try{enabled=localStorage.getItem(KEY)==='on';}catch{}
 const {halfWidth,halfDepth}=base.userData.compactLayout;
 const original={ground:ground.visible,background:scene.background?.isColor?scene.background.clone():null,fog:scene.fog?.color.clone()};
 const lighting={snowSunset:{value:0},snowShade:{value:[.34,.43,.49]},snowLight:{value:[.84,.86,.85]}};
 const resources=[],count=1100,reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const section=document.createElement('label');section.innerHTML='雪天与雪地 <input type="checkbox" aria-label="雪天与雪地" data-snow-enabled>';
 host.append(section);
 const description=document.createElement('p');description.textContent='柔和飘雪与起伏雪地。雪花避开白色底座上的设备，雪地与水面分别使用；关闭后恢复原来的地面。';host.append(description);
 const checkbox=section.querySelector('input');checkbox.checked=enabled;checkbox.addEventListener('change',()=>setEnabled(checkbox.checked));
 function own(resource){resources.push(resource);return resource;}
 function add(geometry,material,name){const mesh=new T.Mesh(own(geometry),own(material));mesh.name=name;mesh.raycast=()=>{};mesh.userData.environmentOnly=true;root.add(mesh);return mesh;}
 function build(){
  root=new T.Group();root.name='Snow day environment';root.position.set(base.position.x,0,base.position.z);scene.add(root);ground.visible=false;
  // Wide, unpatterned drifts, held below the original plinth top. No snow on controls.
  const geometry=new T.PlaneGeometry(180,180,240,240),p=geometry.attributes.position;
  relief={nearPeak:0,farPeak:0};
  for(let i=0;i<p.count;i++){
   const x=p.getX(i),z=-p.getY(i),edge=Math.max(Math.abs(x)-halfWidth,Math.abs(z)-halfDepth);
   const smooth=t=>{t=Math.min(1,Math.max(0,t));return t*t*(3-2*t);};
   const blend=smooth((edge-2)/9),rear=smooth((-z-halfDepth-3)/12);
   const swell=.035*Math.sin(x*.11+z*.07)+.025*Math.cos(z*.15-x*.06);
   const mound=(cx,cz,h,spread)=>h*Math.exp(-((x-cx)**2+(z-cz)**2)/spread);
   // Low, irregular drifts remain beside the base; larger gentle hills sit farther behind it.
   const drifts=mound(-18,-halfDepth-11,.9,70)+mound(-2,-halfDepth-17,1.35,95)+mound(15,-halfDepth-12,.65,65)+mound(26,-halfDepth-24,1.0,105)+mound(-23,-halfDepth-28,.75,120)+mound(7,-halfDepth-33,1.1,140);
   const nearDrifts=mound(-halfWidth-2.2,1.5,.42,9)+mound(halfWidth+2.5,-1,.36,11)+mound(-4,halfDepth+2.5,.32,11)+mound(6,halfDepth+2.8,.27,13)+mound(3,-halfDepth-2.5,.35,16);
   const nearBlend=smooth(edge/1.7);
   const height=blend*swell+rear*drifts+nearBlend*nearDrifts;
   p.setZ(i,-.325+height);
   if(edge>0&&edge<5.5)relief.nearPeak=Math.max(relief.nearPeak,height);
   if(z<-halfDepth-8)relief.farPeak=Math.max(relief.farPeak,height);
  }
  geometry.computeVertexNormals();geometry.computeBoundingSphere();
  // Sculpted banks need directional tone separation under the studio's broad fill.
  // Local plane normal.z is world up; retain actual cast-shadow attenuation.
  const material=ground.material.clone();material.color.set('#e1e6e5');material.roughness=.98;material.metalness=0;material.envMapIntensity=.2;
  material.onBeforeCompile=shader=>{Object.assign(shader.uniforms,lighting);
   shader.vertexShader='varying vec3 snowWorld;varying float snowHeight;varying vec3 snowNormal;\n'+shader.vertexShader;
   shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nsnowHeight=position.z;snowNormal=normal;snowWorld=(modelMatrix*vec4(position,1.0)).xyz;');
   shader.fragmentShader=sunsetPalette+'uniform float snowSunset;varying vec3 snowWorld;uniform vec3 snowShade;uniform vec3 snowLight;varying float snowHeight;varying vec3 snowNormal;\n'+shader.fragmentShader;
   shader.fragmentShader=shader.fragmentShader.replace('#include <opaque_fragment>',`
    vec3 snowN=normalize(vec3(snowNormal.xy*2.6,snowNormal.z));
    float softLight=smoothstep(.42,.94,dot(snowN,normalize(vec3(-.55,-.65,1.0))));
    float bank=smoothstep(-.25,1.6,snowHeight);
    vec3 snowInk=mix(snowShade,snowLight,softLight*.65+bank*.35);
    vec3 shadowAttenuation=clamp(outgoingLight/max(diffuseColor.rgb,vec3(.01)),vec3(.2),vec3(1.0));
    outgoingLight=snowInk*shadowAttenuation;
    #include <opaque_fragment>`);
   shader.fragmentShader=shader.fragmentShader.replace('#include <fog_fragment>',`#ifdef USE_FOG
    #ifdef FOG_EXP2
     float snowFogFactor=1.0-exp(-fogDensity*fogDensity*vFogDepth*vFogDepth);
    #else
     float snowFogFactor=smoothstep(fogNear,fogFar,vFogDepth);
    #endif
    vec3 snowHorizon=sunsetSky(normalize(snowWorld-cameraPosition));
    #ifdef TONE_MAPPING
     snowHorizon=toneMapping(snowHorizon);
    #endif
    snowHorizon=linearToOutputTexel(vec4(snowHorizon,1.0)).rgb;
    gl_FragColor.rgb=mix(gl_FragColor.rgb,mix(fogColor,snowHorizon,snowSunset),snowFogFactor);
   #endif`);
  };
  material.customProgramCacheKey=()=> 'snow-distant-drifts-v6-sunset';
  const land=add(geometry,material,'Soft unpatterned snowdrifts');land.rotation.x=-Math.PI/2;land.receiveShadow=true;
  // Seeded particles, generated once. Particle centers move in the vertex shader.
  const batch=new T.PlaneGeometry(1,1),Attribute=batch.attributes.position.constructor;
  const vertices=[],uvs=[],origins=[],params=[],indices=[];
  let seed=7413;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  for(let i=0;i<count;i++){
   let x,z;do{x=(random()-.5)*74;z=(random()-.5)*64;}while(Math.abs(x)<halfWidth+1.5&&Math.abs(z)<halfDepth+1.5);
   const y=random()*28,speed=.65+random()*.85,size=.032+random()*.065,phase=random()*Math.PI*2;
   for(const [vx,vy,u,v] of [[-1,-1,0,0],[1,-1,1,0],[1,1,1,1],[-1,1,0,1]]){vertices.push(vx,vy,0);uvs.push(u,v);origins.push(x,y,z);params.push(speed,size,phase);}
   const n=i*4;indices.push(n,n+1,n+2,n,n+2,n+3);
  }
  batch.setAttribute('position',new Attribute(new Float32Array(vertices),3));batch.setAttribute('uv',new Attribute(new Float32Array(uvs),2));batch.setAttribute('flakeOrigin',new Attribute(new Float32Array(origins),3));batch.setAttribute('flakeParams',new Attribute(new Float32Array(params),3));batch.setIndex(indices);
  const shader=new T.ShaderMaterial({name:'Soft falling snow',transparent:true,depthTest:true,depthWrite:false,fog:true,uniforms:{flakeTint:{value:scene.fog.color.clone().setRGB(.90,.93,.93)},snowTime:{value:time},fogColor:{value:scene.fog.color.clone()},fogNear:{value:scene.fog.near},fogFar:{value:scene.fog.far}},
   vertexShader:`
    attribute vec3 flakeOrigin;attribute vec3 flakeParams;uniform float snowTime;
    varying vec2 snowUV;varying float snowOpacity;
    #include <fog_pars_vertex>
    void main(){
     vec3 center=flakeOrigin;float t=snowTime*flakeParams.x;
     center.y=mod(center.y-t+280.0,28.0)-.28;
     center.x+=sin(snowTime*.25+flakeParams.z)*.45;
     center.z+=cos(snowTime*.21+flakeParams.z)*.4;
     vec4 mvPosition=modelViewMatrix*vec4(center,1.0);
     mvPosition.xy+=position.xy*flakeParams.y;
     snowUV=uv;snowOpacity=smoothstep(-.28,.5,center.y)*(1.0-smoothstep(22.0,27.7,center.y));
     gl_Position=projectionMatrix*mvPosition;
     #include <fog_vertex>
    }`,
   fragmentShader:`
    uniform vec3 flakeTint;varying vec2 snowUV;varying float snowOpacity;
    #include <fog_pars_fragment>
    void main(){
     float d=length((snowUV-.5)*2.0);float alpha=(1.0-smoothstep(.12,1.0,d))*.76*snowOpacity;
     if(alpha<.015)discard;gl_FragColor=vec4(flakeTint,alpha);
     #include <tonemapping_fragment>
     #include <colorspace_fragment>
     #include <fog_fragment>
    }`});
  flakes=add(batch,shader,'Falling snow / one batch');flakes.frustumCulled=false;flakes.renderOrder=3;flakes.visible=!reduced.matches;
  if(scene.background?.isColor)scene.background.set('#d3dad8');if(scene.fog)scene.fog.color.set('#d3dad8');
  shader.uniforms.fogColor.value.copy(scene.fog.color);renderer.shadowMap.needsUpdate=true;
 }
 function release(){if(root)scene.remove(root);for(const resource of resources.splice(0))resource.dispose();root=flakes=null;ground.visible=original.ground;if(original.background)scene.background.copy(original.background);if(original.fog)scene.fog.color.copy(original.fog);renderer.shadowMap.needsUpdate=true;}
 function setEnabled(value){if(disposed)return;const next=!!value;if(next===enabled&&!!root===next)return;if(next)onEnable();enabled=next;if(enabled&&!root)build();if(!enabled&&root)release();checkbox.checked=enabled;try{localStorage.setItem(KEY,enabled?'on':'off');}catch{}}
 const onReduced=()=>{if(flakes)flakes.visible=!reduced.matches;};reduced.addEventListener('change',onReduced);
 if(enabled){onEnable();build();}
 return {originalColors:original,setEnabled,setLighting(p){lighting.snowSunset.value=p.sunset||0;lighting.snowShade.value=p.shadow;lighting.snowLight.value=p.light;if(flakes){const u=flakes.material.uniforms;u.fogColor.value.copy(p.fog);u.flakeTint.value.copy(p.flake);u.fogNear.value=p.near;u.fogFar.value=p.far;}},tick(dt){if(!enabled||document.hidden||reduced.matches)return;time+=Math.max(0,Math.min(.05,Number.isFinite(dt)?dt:0));flakes.material.uniforms.snowTime.value=time;},get state(){return {enabled,time,relief,flakes:root?count:0,falling:!!flakes?.visible,groundY:-.325,plinthTop:base.position.y+.25,drawCalls:root?(flakes?.visible?2:1):0};},dispose(){release();section.remove();description.remove();reduced.removeEventListener('change',onReduced);disposed=true;}};
}

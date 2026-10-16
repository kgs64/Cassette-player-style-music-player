// GPU rain and pooled ballistic splash droplets. No per-frame object allocation.
const KEY='cassette-world.environment.rain.v1',COUNT=2400;
export function createAmbientRain({scene,ground,base,types:T,host,water,snow}){
 let enabled=false,root=null,time=0,density=.22,weather='',impacts=0,disposed=false;
 try{enabled=localStorage.getItem(KEY)==='on';}catch{}
 const coolTint=scene.fog.color.clone().setRGB(.34,.42,.50);
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const label=document.createElement('label');label.innerHTML='音乐雨天 <input type="checkbox" aria-label="音乐雨天" data-rain-enabled>';host.append(label);
 const note=document.createElement('p');note.textContent='雨量随音乐律动增减，停播时保持小雨。可叠加水池或雪天，雨滴避开桌面上的设备，落地时溅起小水滴。';host.append(note);
 const check=label.querySelector('input');
 const uniforms={rainTime:{value:0},rainDensity:{value:.22},rainTint:{value:scene.fog.color.clone()},fogColor:{value:scene.fog.color.clone()},fogNear:{value:30},fogFar:{value:85}};
 const anchors=[];let seed=7931;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 for(let i=0;i<COUNT;i++){let x,z;do{x=(random()-.5)*64;z=(random()-.5)*60;}while(Math.abs(x-base.position.x)<base.userData.compactLayout.halfWidth+.8&&Math.abs(z-base.position.z)<base.userData.compactLayout.halfDepth+.8);anchors.push([x,z,random(),random()]);}
 function surface(x,z){if(water())return -.12;const land=scene.getObjectByName('Soft unpatterned snowdrifts');if(snow.state.enabled&&land){const p=land.geometry.attributes.position,lx=x-land.parent.position.x,lz=z-land.parent.position.z;const ix=Math.round((lx+90)/180*240),iz=Math.round((lz+90)/180*240);if(ix>=0&&ix<=240&&iz>=0&&iz<=240)return p.getZ(iz*241+ix)+.015;}return ground.position.y+.065;}
 function batch(splash){const template=new T.PlaneGeometry(1,1),Attribute=template.attributes.position.constructor;const copies=splash?5:1,n=COUNT*copies,pos=[],uv=[],a=[],indices=[];for(let i=0;i<n;i++){const index=Math.floor(i/copies),[x,z,r,offset]=anchors[index],y=surface(x,z);for(let k=0;k<4;k++){pos.push((k%2)-.5,k<2?.5:-.5,0);uv.push(k%2,k<2?1:0);a.push(x,y,z,r); }const j=i*4;indices.push(j,j+2,j+1,j+2,j+3,j+1);}
 template.setAttribute('position',new Attribute(new Float32Array(pos),3));template.setAttribute('uv',new Attribute(new Float32Array(uv),2));template.setAttribute('rainAnchor',new Attribute(new Float32Array(a),4));const seeds=[];for(let i=0;i<n;i++)for(let k=0;k<4;k++)seeds.push(anchors[Math.floor(i/copies)][3],i%copies);template.setAttribute('rainSeed',new Attribute(new Float32Array(seeds),2));template.setIndex(indices);
 const shader=new T.ShaderMaterial({name:splash?'Rain / pooled splash droplets':'Rain / falling streaks',uniforms,transparent:true,depthWrite:false,vertexShader:`
 attribute vec4 rainAnchor;attribute vec2 rainSeed;uniform float rainTime;uniform float rainDensity;
 varying vec2 rainUV;varying float rainAlpha;varying float rainDepth;
 void main(){rainUV=uv;float speed=mix(.48,.78,rainSeed.x);float phase=fract(rainTime*speed+rainSeed.x);float rainGate=1.0-smoothstep(rainDensity-.015,rainDensity+.015,rainAnchor.w);vec3 world=rainAnchor.xyz;
 ${splash?`float age=phase/.20;float angle=rainSeed.y*1.256637+rainSeed.x*6.28318;float life=clamp(age,0.0,1.0);world.xz+=vec2(cos(angle),sin(angle))*.36*life;world.y+=.015+1.0*life-1.0*life*life;rainAlpha=rainGate*(1.0-life)*.65*step(age,1.0);vec4 view=viewMatrix*vec4(world,1.0);view.xy+=position.xy*.075;`:`world.y+=18.0*(1.0-phase);rainAlpha=rainGate*.58;vec4 view=viewMatrix*vec4(world,1.0);view.xy+=position.xy*vec2(.032,.40+rainSeed.x*.28);`}
 rainDepth=-view.z;gl_Position=projectionMatrix*view;
 }`,fragmentShader:`uniform vec3 rainTint;uniform vec3 fogColor;uniform float fogNear;uniform float fogFar;varying vec2 rainUV;varying float rainAlpha;varying float rainDepth;
 void main(){vec2 p=rainUV*2.0-1.0;float shape=${splash?'1.0-smoothstep(.45,1.0,length(p))':'(1.0-smoothstep(.15,1.0,abs(p.x)))*(1.0-abs(p.y))'};float alpha=shape*rainAlpha*(1.0-smoothstep(fogNear,fogFar,rainDepth));if(alpha<.005)discard;gl_FragColor=vec4(${splash?'rainTint+vec3(.22)':'rainTint'},alpha);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 }`});const mesh=new T.Mesh(template,shader);mesh.name=splash?'Rain impact droplets':'Falling rain';mesh.frustumCulled=false;mesh.renderOrder=4;mesh.raycast=()=>{};mesh.userData.environmentOnly=true;root.add(mesh);}
 function release(){if(!root)return;scene.remove(root);root.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});root=null;}
 function build(){release();root=new T.Group();root.name='Music rain environment';scene.add(root);batch(false);batch(true);root.visible=!reduced.matches;weather=`${water()}:${snow.state.enabled}`;}
 function setEnabled(value){if(disposed)return;enabled=!!value;if(enabled)build();else release();check.checked=enabled;try{localStorage.setItem(KEY,enabled?'on':'off');}catch{}}
 function onReduced(){if(root)root.visible=!reduced.matches;}reduced.addEventListener('change',onReduced);check.addEventListener('change',()=>setEnabled(check.checked));check.checked=enabled;if(enabled)build();
 return {setEnabled,tick(dt,bass=0,loudness=0,playing=false,volume=1){if(!enabled||disposed||document.hidden)return;if(weather!==`${water()}:${snow.state.enabled}`)build();if(reduced.matches)return;dt=Math.min(.05,Math.max(0,dt||0));time+=dt;const energy=playing?Math.min(1,Math.max(0,(bass*.65+loudness*.35)*volume)):0;const target=.22+.70*Math.sqrt(energy);density+=(target-density)*(1-Math.exp(-dt*(target>density?9:2.5)));uniforms.rainTime.value=time;uniforms.rainDensity.value=density;uniforms.rainTint.value.copy(scene.fog.color).lerp(coolTint,.65);uniforms.fogColor.value.copy(scene.fog.color);uniforms.fogNear.value=scene.fog.near;uniforms.fogFar.value=scene.fog.far;impacts+=dt*COUNT*density*.63;},get state(){return {enabled,density,drops:root?Math.round(COUNT*density):0,splashDroplets:root?COUNT*5:0,estimatedImpacts:Math.floor(impacts),time,surface:water()?'water':snow.state.enabled?'snow':'ground',drawCalls:root?2:0,reducedMotion:reduced.matches};},dispose(){release();label.remove();note.remove();reduced.removeEventListener('change',onReduced);disposed=true;}};
}

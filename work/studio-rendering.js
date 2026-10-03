import * as THREE from 'three';
import {RectAreaLightUniformsLib} from 'three/addons/lights/RectAreaLightUniformsLib.js';

// Project-owned mathematical softboxes. PMREM is generated once, never per frame.
// Keep the existing geometry, interaction and animation budget unchanged.
export function createStudioRendering({renderer,scene,key,rim,hemisphere,mobile,wallpaperMode}){
 const width=512,height=256,data=new Uint16Array(width*height*4);
 const lights=[{direction:new THREE.Vector3(-8,20,10).normalize(),radius:.68,power:3.1,color:[1,.96,.88]},
  {direction:new THREE.Vector3(9,14,-6).normalize(),radius:.55,power:1.6,color:[.91,.96,1]}];
 const direction=new THREE.Vector3();
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  // DataTexture has flipY=false: row 0 is south, matching Three's equirectUv.
  const latitude=Math.PI*((y+.5)/height-.5),theta=2*Math.PI*((x+.5)/width-.5);
  direction.set(Math.cos(latitude)*Math.cos(theta),Math.sin(latitude),Math.cos(latitude)*Math.sin(theta));
  const base=.46+.12*Math.max(0,direction.y),rgb=[base,base*.99,base*.95];
  for(const light of lights){const angle=Math.acos(THREE.MathUtils.clamp(direction.dot(light.direction),-1,1));const weight=Math.exp(-Math.pow(angle/light.radius,6))*light.power;for(let i=0;i<3;i++)rgb[i]+=weight*light.color[i];}
  const index=(y*width+x)*4;for(let i=0;i<3;i++)data[index+i]=THREE.DataUtils.toHalfFloat(rgb[i]);data[index+3]=THREE.DataUtils.toHalfFloat(1);
 }
 const panorama=new THREE.DataTexture(data,width,height,THREE.RGBAFormat,THREE.HalfFloatType);
 panorama.mapping=THREE.EquirectangularReflectionMapping;panorama.colorSpace=THREE.LinearSRGBColorSpace;panorama.needsUpdate=true;
 const generator=new THREE.PMREMGenerator(renderer);const environment=generator.fromEquirectangular(panorama);
 panorama.dispose();generator.dispose();scene.environment=environment.texture;scene.environmentIntensity=.75;
 renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.94;
 scene.background.set('#cecdc5');scene.fog.color.copy(scene.background);scene.fog.near=55;scene.fog.far=105;
 hemisphere.color.set('#ecebe1');hemisphere.groundColor.set('#9d9b8d');hemisphere.intensity=.32;
 key.color.set('#fff5e2');key.intensity=.9;key.position.set(-8,20,10);key.target.position.set(1,3,-1);scene.add(key.target);
 // Broad area illumination gives distance falloff across the backdrop. A weaker,
 // cached directional map supplies occlusion (Three r170 area lights have no shadows).
 RectAreaLightUniformsLib.init();const softbox=new THREE.RectAreaLight('#fff5e2',14,11,11);
 softbox.position.copy(key.position);softbox.lookAt(key.target.position);scene.add(softbox);
 // PCFSoft ignores radius in r170. PCF uses the existing cached shadow map with a softer kernel.
 renderer.shadowMap.type=THREE.PCFShadowMap;key.shadow.radius=3;key.shadow.bias=-.00008;key.shadow.normalBias=.055;
 key.shadow.mapSize.set(mobile||wallpaperMode?1024:2048,mobile||wallpaperMode?1024:2048);
 Object.assign(key.shadow.camera,{left:-15,right:18,top:15,bottom:-15,near:1,far:55});key.shadow.camera.updateProjectionMatrix();
 rim.color.set('#edf0e8');rim.intensity=.42;rim.position.set(9,14,-6);rim.target.position.set(1,3,-1);scene.add(rim.target);
 const textures=[];
 function finishMaterials(materials){
  const size=64,normal=new Uint8Array(size*size*4),roughness=new Uint8Array(size*size*4);
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
   const index=(y*size+x)*4,grain=Math.sin(y*Math.PI/4)*.7+Math.sin(y*Math.PI*2/3)*.3;
   normal.set([128,Math.round(128+grain*6),255,255],index);const value=Math.round(242+grain*7);roughness.set([value,value,value,255],index);
  }
  function texture(bytes){const map=new THREE.DataTexture(bytes,size,size,THREE.RGBAFormat);map.wrapS=map.wrapT=THREE.RepeatWrapping;map.repeat.set(2,2);map.generateMipmaps=true;map.minFilter=THREE.LinearMipmapLinearFilter;map.magFilter=THREE.LinearFilter;map.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());map.needsUpdate=true;textures.push(map);return map;}
  const normalMap=texture(normal),roughnessMap=texture(roughness);
  for(const name of ['silver','edge','metal','chrome']){const material=materials[name];material.normalMap=normalMap;material.normalScale.set(.12,.12);material.roughnessMap=roughnessMap;material.needsUpdate=true;}
  // More matte on plastic and paper; glass remains a single inexpensive transparent layer.
  materials.dark.roughness=.78;materials.black.roughness=.83;materials.paper.roughness=.92;materials.glass.roughness=.19;materials.smoke.roughness=.25;
 }
 return {finishMaterials,get state(){return {profile:'softbox-studio',environment:'generated-hdr',environmentIntensity:scene.environmentIntensity,exposure:renderer.toneMappingExposure,keyPosition:key.position.toArray(),shadowSize:key.shadow.mapSize.x,areaSize:[softbox.width,softbox.height],postprocessing:'focus-only',sharedMaps:textures.length};},dispose(){environment.dispose();for(const texture of textures)texture.dispose();scene.remove(softbox);}};
}

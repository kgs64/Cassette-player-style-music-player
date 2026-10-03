import {GTAOPass} from 'three/addons/postprocessing/GTAOPass.js';

// Desktop opt-in: half-size normals/AO, short-radius contact detail, eight samples.
export function createStudioOcclusion(scene,camera,width,height){
 const pass=new GTAOPass(scene,camera,Math.ceil(width/2),Math.ceil(height/2));
 pass.updateGtaoMaterial({radius:.9,thickness:.8,distanceExponent:1,distanceFallOff:1,scale:1,samples:8,screenSpaceRadius:false});
 pass.updatePdMaterial({samples:8,radius:4});pass.blendIntensity=.7;
 const size=pass.setSize.bind(pass);pass.setSize=(w,h)=>size(Math.max(1,Math.ceil(w/2)),Math.max(1,Math.ceil(h/2)));
 const hidden=[];
 // Transparent windows and print decals must not turn into solid AO occluders.
 pass.overrideVisibility=()=>{hidden.length=0;scene.traverse(object=>{
  if(!object.visible)return;
  const materials=object.material?(Array.isArray(object.material)?object.material:[object.material]):[];
  if(object.isPoints||object.isLine||materials.some(m=>!m.visible||m.isMeshBasicMaterial||(m.transparent&&m.opacity<.95))){hidden.push(object);object.visible=false;}
 });};
 pass.restoreVisibility=()=>{for(const object of hidden)object.visible=true;hidden.length=0;};
 const dispose=pass.dispose.bind(pass);pass.dispose=()=>{dispose();pass.gtaoMaterial.dispose();pass.blendMaterial.dispose();pass.depthTexture.dispose();hidden.length=0;};
 return pass;
}

import * as THREE from 'three';

// Render only the small region behind the lens, at 2.4x magnification.
// The target exists only while held; no full-screen duplicate renderer.
export function createLensOptics(glass,scene,camera,renderer){
 const material=new THREE.MeshBasicMaterial({depthWrite:true,depthTest:true});
 const aperture=new THREE.Mesh(new THREE.CircleGeometry(.49,64),material);
 aperture.rotation.x=-Math.PI/2;aperture.position.y=.032;aperture.visible=false;glass.add(aperture);
 const view=new THREE.PerspectiveCamera(),center=new THREE.Vector3(),edge=new THREE.Vector3();
 // Prevent the original transparent glass and scene decals from blending over the image.
 const nativeGlass=[];glass.traverse(o=>{if(o!==aperture&&o.isMesh&&o.material?.transparent)nativeGlass.push([o,o.visible]);});
 let target=null,last=0;
 return {render(now,active){
  if(!active){aperture.visible=false;for(const [o,visible] of nativeGlass)o.visible=visible;if(target){target.dispose();target=null;material.map=null;}return;}
  const size=innerWidth<650?512:768;
  if(!target||target.width!==size){target?.dispose();target=new THREE.WebGLRenderTarget(size,size,{depthBuffer:true});material.map=target.texture;material.needsUpdate=true;last=0;}
  for(const [o] of nativeGlass)o.visible=false;
  aperture.visible=true;if(now-last<1000/18)return;last=now;
  camera.updateMatrixWorld();glass.updateWorldMatrix(true,false);
  center.set(0,0,0).applyMatrix4(glass.matrixWorld).project(camera);
  edge.set(.49,0,0).applyMatrix4(glass.matrixWorld).project(camera);
  const diameter=Math.max(32,Math.abs(edge.x-center.x)*innerWidth),crop=diameter/2.4;
  view.copy(camera);view.setViewOffset(innerWidth,innerHeight,(center.x+1)*innerWidth/2-crop/2,(1-center.y)*innerHeight/2-crop/2,crop,crop);
  const previous=renderer.getRenderTarget(),shadow=renderer.shadowMap.needsUpdate;
  glass.visible=false;renderer.shadowMap.needsUpdate=false;
  try{renderer.setRenderTarget(target);renderer.clear();renderer.render(scene,view);}
  finally{renderer.setRenderTarget(previous);renderer.shadowMap.needsUpdate=shadow;glass.visible=true;}
 }};
}

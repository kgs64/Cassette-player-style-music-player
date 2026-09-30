import * as THREE from 'three';

// The real scene remains visible through the glass; no second WebGL view or
// per-frame texture capture is needed. Camera inspection supplies the close-up.
export function createLensMotion(glass, scene, camera, sign, onSettle) {
 const homeParent=glass.parent,homePosition=glass.position.clone(),homeRotation=glass.quaternion.clone();
 const position=new THREE.Vector3(),rotation=new THREE.Quaternion(),tilt=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0),Math.PI/2);
 const shadowMeshes=[];glass.traverse(o=>{if(o.isMesh)shadowMeshes.push([o,o.castShadow]);});
 let raised=false,phase='resting';
 function setRaised(value){
  if(raised===value)return;raised=value;phase=value?'lifting':'lowering';
  if(glass.parent!==scene){scene.updateMatrixWorld(true);scene.attach(glass);}
  sign.visible=!value;shadowMeshes.forEach(([o])=>o.castShadow=false);
 }
 function tick(dt){
  if(phase==='resting')return;
  const narrow=innerWidth<650,scale=raised?(narrow?.55:1):1;
  if(raised){camera.updateMatrixWorld();position.set(0,narrow?.43:0,-2.5).applyMatrix4(camera.matrixWorld);rotation.copy(camera.quaternion).multiply(tilt);}
  else{homeParent.updateWorldMatrix(true,false);position.copy(homePosition).applyMatrix4(homeParent.matrixWorld);homeParent.getWorldQuaternion(rotation);rotation.multiply(homeRotation);}
  const alpha=1-Math.exp(-9*dt);glass.position.lerp(position,alpha);glass.quaternion.slerp(rotation,alpha);glass.scale.setScalar(THREE.MathUtils.damp(glass.scale.x,scale,9,dt));
  if(glass.position.distanceToSquared(position)<.00001&&glass.quaternion.angleTo(rotation)<.003&&Math.abs(glass.scale.x-scale)<.003){
   if(!raised){homeParent.attach(glass);glass.position.copy(homePosition);glass.quaternion.copy(homeRotation);glass.scale.setScalar(1);shadowMeshes.forEach(([o,cast])=>o.castShadow=cast);phase='resting';onSettle();}
   else phase='held';
  }
 }
 return {setRaised,tick,get phase(){return phase;},get active(){return phase!=='resting';},get moving(){return phase==='lifting'||phase==='lowering';}};
}

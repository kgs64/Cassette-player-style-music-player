import * as THREE from 'three';
// One bounded texture per tape; callbacks cannot resurrect disposed tape models.
export function decorateTape(tape,track){
 const u=tape.userData;u.artGeneration=(u.artGeneration||0)+1;const generation=u.artGeneration;
 if(u.coverMesh){u.coverMesh.removeFromParent();u.coverMesh.geometry.dispose();u.coverMesh.material.map?.dispose();u.coverMesh.material.dispose();u.coverMesh=null;}
 u.titleLabel.userData.setText(track.title.toUpperCase());u.titleLabel.scale.x=track.cover?.76:1;u.titleLabel.position.x=track.cover?.36:0;
 if(!track.cover)return;
 const canvas=document.createElement('canvas');canvas.width=canvas.height=256;
 const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=4;
 const mesh=new THREE.Mesh(new THREE.PlaneGeometry(.52,.52),new THREE.MeshBasicMaterial({map:texture,toneMapped:false,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1}));mesh.position.set(-1.12,.62,.218);tape.add(mesh);u.coverMesh=mesh;
 const image=new Image();image.onload=()=>{if(u.disposed||u.artGeneration!==generation)return;const size=Math.min(image.width,image.height);canvas.getContext('2d').drawImage(image,(image.width-size)/2,(image.height-size)/2,size,size,0,0,256,256);texture.needsUpdate=true;};image.onerror=()=>{if(!u.disposed&&u.artGeneration===generation){mesh.visible=false;u.titleLabel.scale.x=1;u.titleLabel.position.x=0;}};image.src=track.cover;
}

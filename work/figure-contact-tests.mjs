import assert from 'node:assert/strict';
import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {ladderPose,LADDER_SUPPORT,FRONT_FASTENERS} from './housing.js';
import {MACHINE_STYLES} from './styles.js';
import {buildFigure,FIGURE_PLACEMENT as P,CLIMBER as C} from './figures.js';
const material=new THREE.MeshBasicMaterial();
function group(parent,x=0,y=0,z=0){const g=new THREE.Group();g.position.set(x,y,z);parent.add(g);return g;}
function box(parent,w,h,d,x,y,z,mat=material,round=.035){const m=new THREE.Mesh(round?new RoundedBoxGeometry(w,h,d,2,Math.min(round,w/3,h/3,d/3)):new THREE.BoxGeometry(w,h,d),mat);m.position.set(x,y,z);parent.add(m);return m;}
function ball(parent,r,x,y,z,mat=material){const m=new THREE.Mesh(new THREE.SphereGeometry(r,16,12),mat);m.position.set(x,y,z);parent.add(m);return m;}
function rod(parent,a,b,r,mat=material){a=new THREE.Vector3(...a);b=new THREE.Vector3(...b);const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,a.distanceTo(b),10),mat);m.position.copy(a).add(b).multiplyScalar(.5);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),b.sub(a).normalize());parent.add(m);return m;}
function figure(parent,position,pose='stand',yaw=0){const g=group(parent,...position);g.rotation.y=yaw;const rig=buildFigure(g,{group,box,ball,rod},{cloth:material,pants:material,skin:material,dark:material},pose);return {g,...rig};}
function bounds(object){object.updateWorldMatrix(true,true);return new THREE.Box3().setFromObject(object);}
const scene=new THREE.Group();
const spare=group(scene,-5.7,.266,4.65);spare.rotation.set(-Math.PI/2,0,-.2);spare.scale.setScalar(.64);box(spare,3.55,2.24,.43,0,0,.05);
const cases=[];for(let i=0;i<3;i++){const g=group(scene,-2.9+i*.17,.3+i*.17,4.9);g.rotation.y=-.35+i*.08;box(g,2.44,.14,1.59,0,0,0);cases.push(g);}
const observer=figure(scene,P.observer,'stand',-.4),left=figure(scene,P.left,'stand',-.3);
const bench=group(scene,...P.bench),seat=box(bench,1.20,.10,.53,0,.50,0);const sitter=figure(bench,P.benchSitter,'sit');
const crate=group(scene,7.6,0,6.7),crateBox=box(crate,.44,.30,.415,0,.32,0),crateSitter=figure(crate,P.crateSitter,'sit');
for(const [name,person]of [['left',left],['observer',observer],['bench sitter',sitter]])for(const obstacle of [spare,...cases])assert(!bounds(person.g).intersectsBox(bounds(obstacle)),`${name} intersects a cassette or case stack`);
for(const [name,person]of [['left',left],['observer',observer]])for(const shoe of person.shoes)assert(Math.abs(bounds(shoe).min.y-.17)<1e-7,`${name} sole misses table`);
for(const [name,person,support]of [['bench',sitter,seat],['crate',crateSitter,crateBox]]){
 for(const leg of person.legs)leg.traverse(mesh=>{if(mesh.isMesh)assert(!bounds(mesh).intersectsBox(bounds(support)),`${name} lower body penetrates seat`);});
 // Body base contacts the seat; calves are outside its front edge.
 assert(Math.abs(bounds(person.body.children[0]).min.y-bounds(support).max.y)<1e-7,`${name} body floats above seat`);
}
for(const style of MACHINE_STYLES){
 const offset=.195*(1-style.scale[1]),pose=ladderPose(style.scale,offset,style.caseWood?.004:0),ladder=group(scene,...pose.base);ladder.rotation.set(pose.angle,0,0);
 const climber=figure(ladder,[0,C.rootY,C.rootZ],'climb',Math.PI);scene.updateMatrixWorld(true);const inv=ladder.matrixWorld.clone().invert();
 const top=ladder.localToWorld(new THREE.Vector3(0,pose.length,0));assert(top.distanceTo(new THREE.Vector3(...pose.target))<1e-7,`${style.id} ladder misses shell`);
 assert(Math.abs(top.z-LADDER_SUPPORT.capRadius-(LADDER_SUPPORT.faceZ+(style.caseWood?.004:0))*style.scale[2])<1e-7,'Rubber cap must meet front shell');
 assert(Math.abs(top.y-(LADDER_SUPPORT.faceY*style.scale[1]+offset))<1e-7,'Ladder leans on solid upper fascia');
 assert(C.gripY<pose.length-.15,'Climber grips a rung below the rail ends');
 for(const x of [-.29,.29]){const foot=box(scene,.14,.08,.24,pose.base[0]+x,.21,pose.base[2]);assert(Math.abs(bounds(foot).min.y-.17)<1e-7,'Ladder rubber foot misses ground');}
for(const shoe of climber.shoes){const matrix=inv.clone().multiply(shoe.matrixWorld);const vertices=shoe.geometry.attributes.position;let lowest=Infinity;for(let i=0;i<vertices.count;i++){const p=new THREE.Vector3().fromBufferAttribute(vertices,i).applyMatrix4(matrix);lowest=Math.min(lowest,p.y);assert(Math.abs(p.x)<.245&&Math.abs(p.z)<.095,'Shoe overhangs its tread');}assert(Math.abs(lowest-C.rootY)<1e-7,'Shoe floats above ladder tread');}
for(const hand of climber.hands){const center=hand.getWorldPosition(new THREE.Vector3()).applyMatrix4(inv);assert(Math.abs(center.z)<1e-7&&Math.abs(center.y-C.gripY)<1e-7,'Hand does not meet next rung');assert(Math.abs(center.x)<.265,'Hand misses rung width');}
scene.remove(ladder);
}
assert.equal(new Set(FRONT_FASTENERS.map(p=>p.join(','))).size,4);
for(const [x,y]of FRONT_FASTENERS){assert(Math.abs(x)+.074<7&&Math.abs(y)+.074<3);for(const sx of [-4.7,4.7])assert(Math.hypot(x-sx,y+.55)>2.03+.074,'Screw overlaps speaker opening');assert(Math.abs(x)>6.5,'Screw crowds central controls');}
console.log('PASS actual figure meshes: grounded soles, clear cassette/case bounds, seated legs outside supports, ladder-to-shell contact in all 12 styles, boot contact, hand grips, and housing fastener clearance.');

for(const variant of ['classic','cap','coat','backpack','curly','headphones']){const root=group(scene,0,.17,0);const rig=buildFigure(root,{group,box,ball,rod},{cloth:material,pants:material,skin:material,dark:material},'work',variant);for(const shoe of rig.shoes)assert(Math.abs(bounds(shoe).min.y-.17)<1e-7,variant+' sole misses table');assert(bounds(root).min.y>=.17-1e-7,variant+' penetrates support');scene.remove(root);}
console.log('PASS six figure variants retain grounded soles and clear their support');

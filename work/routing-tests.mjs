import assert from 'node:assert/strict';
import * as THREE from 'three';
import {tapePoints,tapeRadii,updateRibbon,cableCurve,TAPE_CORE,TAPE_FULL} from './routing.js';
import {MACHINE_STYLES} from './styles.js';
const geometry=new THREE.BufferGeometry();
for(let step=0;step<=1000;step++){
 const progress=step/1000,{points,radii}=tapePoints(progress);
 assert(Math.abs(radii[0]**2+radii[1]**2-TAPE_CORE**2-TAPE_FULL**2)<1e-12,'Tape area is not conserved');
 for(const [i,x]of [[0,-.84],[points.length-1,.84]]){const end=points[i],r=radii[i?1:0];assert(Math.abs(Math.hypot(end.x-x,end.y+.1)-(r+.004))<1e-10,'Ribbon is detached from wound tape');}
 for(const [at,next,x]of [[0,1,-.84],[points.length-1,points.length-2,.84]]){const normal=new THREE.Vector2(points[at].x-x,points[at].y+.1),line=new THREE.Vector2(points[next].x-points[at].x,points[next].y-points[at].y);assert(Math.abs(normal.dot(line))<1e-10,'Ribbon cuts into reel instead of leaving tangentially');}
 for(const point of points){assert(Number.isFinite(point.x+point.y+point.z));assert(point.y>=-.800&&Math.abs(point.x)<1.45);}
 if(step%10===0)updateRibbon(geometry,progress);
}
const index=geometry.index,position=geometry.attributes.position;let frontFaces=0;
for(let i=0;i<index.count;i+=3){const a=new THREE.Vector3().fromBufferAttribute(position,index.getX(i)),b=new THREE.Vector3().fromBufferAttribute(position,index.getX(i+1)),c=new THREE.Vector3().fromBufferAttribute(position,index.getX(i+2));if(Math.abs(a.z-.19)<1e-6&&Math.abs(b.z-.19)<1e-6&&Math.abs(c.z-.19)<1e-6){assert(b.sub(a).cross(c.sub(a)).z>0,'Ribbon front face is culled');frontFaces++;}}
assert(frontFaces>10);
for(const style of MACHINE_STYLES)for(const service of [0,.5,1]){
 const [sx,sy,sz]=style.scale,offset=.195*(1-sy);const plug=new THREE.Vector3((7.1+2.2*service+.65)*sx,(3.14-.1*service)*sy+offset,(.25+.1*service)*sz),curve=cableCurve(plug);
 assert(curve.getPoint(0).distanceTo(plug)<1e-10);assert(curve.getPoint(1).distanceTo(new THREE.Vector3(4.87,.275,6.8))<1e-10);
 const direction=curve.getPoint(.00001).sub(plug).normalize();assert(direction.x>.999,'Cable bends into socket immediately');
 for(let i=0;i<=1500;i++){const p=curve.getPoint(i/1500);assert(p.y-.035>=.17-1e-8,'Cable penetrates tabletop');const inCabinet=p.x<7.10*sx+.035&&p.z<1.6*sz+.035&&p.y<7.3*sy+.035;assert(!inCabinet,'Cable enters cabinet');if(p.z>3.1&&p.z<6.2&&p.y<2)assert(p.x-.035>8.79,'Cable cuts through cassette rack');if(p.x>7.25&&p.x<7.9&&p.y<.9)assert(p.z-.035>7.1,'Cable cuts through seated figure');}
}
console.log('PASS 1,001 tape positions: area conservation, tangential contacts, continuous ribbon and outward faces.');
console.log('PASS cable samples across 12 styles and 3 service stages: outward exit, cabinet/rack/figure clearance, tabletop support and both endpoints.');

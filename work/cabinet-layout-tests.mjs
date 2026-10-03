import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createCabinet} from './cabinet.js';
import {DRAWERS} from './archive.js';
const props=new THREE.Group(),material=new THREE.MeshBasicMaterial();
const group=(parent,x=0,y=0,z=0)=>{const g=new THREE.Group();g.position.set(x,y,z);parent.add(g);return g;};
const box=(p,w,h,d,x,y,z)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);m.position.set(x,y,z);p.add(m);return m;};
const label=(p,t,w,h,x,y,z)=>{const g=group(p,x,y,z);g.userData.setText=()=>{};return g;};
const cabinet=createCabinet({props,group,box,label,rod:()=>{},screw:()=>{},interactive:()=>{},M:{},cassette:p=>group(p),disposeGroup:()=>{}});
const tracks=Array.from({length:576},(_,i)=>({id:String(i),title:'Test '+i,cabinetSlot:{drawer:DRAWERS[Math.floor(i/96)],index:i%96}}));
cabinet.rebuild(tracks,null);assert.equal(cabinet.drawers.length,1);
for(let i=0;i<576;i++){cabinet.reveal(i);assert.equal(cabinet.state.pages.A01,Math.floor(i/8));assert(cabinet.anchors[i].parent===cabinet.drawers[0].contents);assert.equal(cabinet.drawers[0].contents.children.length,8);}
assert.equal(cabinet.root.position.z,5);assert.equal(cabinet.root.position.x,7.4);
console.log('PASS all 576 legacy slots accessible in one drawer, eight models per page');

cabinet.reveal(0);cabinet.setTransit(0,true);cabinet.reveal(1);assert(!cabinet.drawers[0].contents.children.includes(cabinet.anchors[0]));cabinet.refresh();assert(!cabinet.drawers[0].contents.children.includes(cabinet.anchors[0]));cabinet.setTransit(0,false);assert(cabinet.drawers[0].contents.children.includes(cabinet.anchors[0]));console.log('PASS moving tape stays absent through drawer rebuilds and returns once');

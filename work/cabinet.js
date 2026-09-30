import {decorateTape} from './tape-art.js';
import * as THREE from 'three';
import {DRAWERS,DRAWER_CAPACITY} from './archive.js';
export function createCabinet({props,group,box,label,rod,screw,interactive,M,cassette,disposeGroup}){
 const root=group(props,7.4,.17,5.0),drawers=[],anchors=[],PAGE=8;
 root.scale.setScalar(.75);root.rotation.y=-.28;
 const state={activeDrawer:null,pages:Object.fromEntries(DRAWERS.map(id=>[id,0])),selectedTape:null,removeArmed:null};
 let tracks=[],loadedId=null;const inTransit=new Set();
 for(const x of [-2.94,2.94])interactive(box(root,.16,1.50,3.2,x,1.05,0,M.cream,.04),'cabinet');
 interactive(box(root,5.9,1.50,.13,0,1.05,-1.55,M.metal,.02),'cabinet');interactive(box(root,6.04,.18,3.2,0,1.89,0,M.cream),'cabinet');
 interactive(box(root,6.04,.22,3.2,0,.18,0,M.dark),'cabinet');for(const x of [-2.6,2.6])for(const z of [-1.2,1.2])box(root,.35,.18,.35,x,.09,z,M.rubber);
 const badge=label(root,'CASSETTE ARCHIVE / 01',4.8,.12,0,1.89,1.62,{mono:true,res:512});interactive(badge,'cabinet');
 const count=label(root,'ARCHIVE 000',3.2,.17,-.65,.10,1.63,{mono:true,res:512});
 const add=box(root,1.25,.18,.09,2.13,.10,1.64,M.orange);interactive(add,'archiveImport');label(add,'+ AUDIO',1.07,.12,0,0,.06,{mono:true,res:256});
 for(let i=0;i<1;i++){
  const id=DRAWERS[i],y=.78,carrier=group(root,0,y,0);
  interactive(box(root,5.76,.075,3.04,0,y-.18,0,M.metal,0),'cabinet');
  for(const x of [-2.78,2.78]){box(root,.06,.11,2.85,x,y-.03,0,M.dark,0);box(carrier,.06,.09,2.7,x,0,0,M.chrome,0);box(root,.10,.2,.15,x,y,1.30,M.orange);}
  interactive(box(carrier,5.48,.085,2.85,0,0,0,M.dark,.015),'cabinet');
  for(const x of [-2.7,2.7])interactive(box(carrier,.07,.55,2.8,x,.27,0,M.metal,0),'cabinet');
  interactive(box(carrier,5.45,.5,.08,0,.25,-1.38,M.metal,0),'cabinet');
  const face=box(carrier,5.68,.77,.12,0,.22,1.46,M.cream,.03);interactive(face,'drawer',id);
  const handle=group(carrier,0,.28,1.59);for(const x of [-.8,.8])box(handle,.07,.14,.18,x,0,0,M.metal);rod(handle,[-.8,0,.12],[.8,0,.12],.045,M.chrome);interactive(handle,'drawer',id);
  label(carrier,id,.5,.18,-2.35,.38,1.535,{mono:true,color:'#963d20',res:320,weight:800});
  const indexLabel=label(carrier,'EMPTY / 000',2.3,.17,-1.15,.06,1.535,{mono:true,res:512});interactive(indexLabel,'drawer',id);
  const pageLabel=label(carrier,'01 / 72',.88,.13,1.93,.32,1.535,{mono:true,res:256});
  for(const [direction,x]of [[-1,1.55],[1,2.37]]){const key=box(carrier,.36,.26,.11,x,.04,1.59,M.dark);interactive(key,'archivePage',{id,direction});label(key,direction<0?'‹':'›',.27,.17,0,0,.063,{color:'#eee9d7',res:128});}
  for(const x of [-1.32,0,1.32])box(carrier,.025,.18,2.55,x,.12,-.01,M.metal,0);
  for(const x of [-2.65,2.65])screw(carrier,x,.49,1.535,.035);
  const contents=group(carrier);drawers.push({id,carrier,contents,handle,indexLabel,pageLabel,open:0,target:0,y});
 }
 const service=box(root,5.45,.28,.08,0,.32,1.63,M.dark);interactive(service,'archiveService');label(service,'SERVICE / REMOVE SELECTED',4.9,.15,0,0,.051,{mono:true,color:'#ddc3a0',res:512});
 const flatSlot=t=>Math.max(0,DRAWERS.indexOf(t.cabinetSlot.drawer))*DRAWER_CAPACITY+t.cabinetSlot.index;
 function locate(t){const d=drawers[0],n=flatSlot(t)%PAGE;return {d,point:new THREE.Vector3((n%4-1.5)*1.32,.18,-.78+Math.floor(n/4)*1.24)};}
 function clearContents(d){for(const child of [...d.contents.children]){d.contents.remove(child);disposeGroup(child);child.clear();}}
 function paint(d){clearContents(d);const page=state.pages[d.id]||0;d.pageLabel.userData.setText(`${String(page+1).padStart(2,'0')} / 72`);
  const all=tracks,visible=all.filter(t=>Math.floor(flatSlot(t)/PAGE)===page);
  d.indexLabel.userData.setText((visible[0]?.album||all[0]?.album||'EMPTY').slice(0,22)+' / '+all.length);
  if(d.target===0)return;
  for(const t of visible){const i=tracks.indexOf(t),{point}=locate(t),a=anchors[i];a.position.copy(point);a.visible=t.id!==loadedId&&!inTransit.has(t.id)&&!t.onRecorder;
   if(inTransit.has(t.id)||t.onRecorder)continue;
   if(t.id===loadedId){const card=label(d.contents,'IN MACHINE',1.16,.2,point.x,.11,point.z,{mono:true,res:256,color:'#a4522b'});card.rotation.x=-Math.PI/2;continue;}
   const tape=cassette(a,t.title,t.labelStyle||'#c9b779',.34);decorateTape(tape,t);tape.rotation.x=-Math.PI/2;
   a.userData.action={kind:'track',value:i};a.userData.lift=t.id===state.selectedTape?.17:0;
   d.contents.add(a);
  }
 }
 function rebuild(list,current){for(const d of drawers)clearContents(d);for(const a of anchors)if(a.parent)a.parent.remove(a);anchors.length=0;tracks=list;loadedId=current;
  tracks.forEach(t=>{const {d,point}=locate(t),a=group(d.contents);a.position.copy(point);a.visible=t.id!==loadedId;anchors.push(a);});
  for(const d of drawers)paint(d);count.userData.setText('ARCHIVE '+String(tracks.length).padStart(3,'0'));
 }
 function setOpen(id,open){if(id&&id!=='A01')state.pages.A01=DRAWERS.indexOf(id)*12+(state.pages[id]||0);id='A01';state.activeDrawer=open?id:null;for(const d of drawers){d.target=open&&d.id===id?2.5:0;if(d.target)paint(d);}}
 function refresh(current=loadedId){loadedId=current;for(const d of drawers)paint(d);}
 function tick(dt,now,disassembled){root.position.z=THREE.MathUtils.damp(root.position.z,disassembled?6.4:5.0,4,dt);let moving=false;for(const d of drawers){const before=d.carrier.position.z;d.open=THREE.MathUtils.damp(d.open,d.target,8,dt);d.carrier.position.z=d.open;d.handle.position.z=1.59+(Math.abs(d.open-d.target)>.05?.04:0);if(!d.target&&d.open<.015&&d.contents.children.some(c=>c.children.length))clearContents(d);for(const a of d.contents.children)if(a.userData.lift!==undefined)a.position.y=THREE.MathUtils.damp(a.position.y,.18+a.userData.lift,15,dt);moving ||= Math.abs(before-d.open)>.0001;}return moving;}
 function setTransit(index,moving){const t=tracks[index];if(!t)return;if(moving){inTransit.add(t.id);anchors[index].visible=false;}else{inTransit.delete(t.id);refresh();}}
 function position(index){const {d,point}=locate(tracks[index]);if(tracks[index].id===state.selectedTape)point.y+=.17;d.carrier.updateWorldMatrix(true,false);return d.carrier.localToWorld(point);}
 function reveal(index){const t=tracks[index];state.pages.A01=Math.floor(flatSlot(t)/PAGE);setOpen('A01',true);}
 return {root,drawers,anchors,state,rebuild,refresh,setOpen,tick,position,reveal,service,count,locate,pageSize:PAGE,pageCount:72,setTransit,add};
}

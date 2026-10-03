import {DRAWERS,DRAWER_CAPACITY} from './archive.js';
const collator=new Intl.Collator('zh-CN',{numeric:true,sensitivity:'base'});
const compare=(a,b,key)=>collator.compare(String(a[key]||''),String(b[key]||''));
export function flatCabinetSlot(track){const s=track.cabinetSlot;return s?Math.max(0,DRAWERS.indexOf(s.drawer))*DRAWER_CAPACITY+s.index:Number.MAX_SAFE_INTEGER;}
// Cabinet positions are independent of playlist indices and stable track IDs.
export function planCabinetOrder(tracks,mode){
 if(!['album','artist','title','oldest','newest'].includes(mode))throw Error('Unknown cabinet order');
 if(tracks.length>DRAWERS.length*DRAWER_CAPACITY)throw Error('ARCHIVE FULL');
 const ordered=[...tracks].sort((a,b)=>{
  let result=0;if(mode==='album')result=compare(a,b,'album')||compare(a,b,'artist')||compare(a,b,'title');
  else if(mode==='artist')result=compare(a,b,'artist')||compare(a,b,'album')||compare(a,b,'title');
  else if(mode==='title')result=compare(a,b,'title');
  else result=((a.createdAt||0)-(b.createdAt||0))*(mode==='newest'?-1:1);
  return result||flatCabinetSlot(a)-flatCabinetSlot(b)||collator.compare(a.id,b.id);
 });
 return ordered.map((track,index)=>({id:track.id,cabinetSlot:{drawer:DRAWERS[Math.floor(index/DRAWER_CAPACITY)],index:index%DRAWER_CAPACITY}}));
}

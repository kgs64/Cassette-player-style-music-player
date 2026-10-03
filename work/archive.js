export const DRAWERS=['A01','A02','B01','B02','C01','C02'];
export const DRAWER_CAPACITY=96;
export function albumKey(t){return `${t.artist||'UNKNOWN ARTIST'}\u001f${t.album||'LOCAL TAPES'}`;}
export function fingerprint(file,duration){return [file.name,file.size,file.lastModified||0,Math.round(duration*100)].join('|');}
export function assignSlot(tracks,track){
 const used=new Set(tracks.filter(t=>t.cabinetSlot).map(t=>`${t.cabinetSlot.drawer}:${t.cabinetSlot.index}`));
 const related=tracks.filter(t=>albumKey(t)===albumKey(track)&&t.cabinetSlot);
 const preferred=[...new Set([...related.map(t=>t.cabinetSlot.drawer),...DRAWERS])];
 for(const drawer of preferred)for(let index=0;index<DRAWER_CAPACITY;index++)if(!used.has(`${drawer}:${index}`))return {drawer,index};
 throw new Error('ARCHIVE FULL');
}
export function normalizeTrack(t){return {...t,id:String(t.id||t.trackId||crypto.randomUUID()),title:t.title||'UNTITLED',artist:t.artist||'UNKNOWN ARTIST',album:t.album||'LOCAL TAPES',audioBlob:t.audioBlob||t.blob||null,sourceRequired:!(t.audioBlob||t.blob),createdAt:t.createdAt||Date.now()};}
export class ArchiveDB {
 constructor(name='CASSETTE_WORLD_DB'){this.db=null;this.failure=null;this.name=name;}
 async open(){
  if(!globalThis.indexedDB)throw new Error('ARCHIVE OFFLINE');
  this.db=await new Promise((resolve,reject)=>{
   const request=indexedDB.open(this.name,2);let rejected=false;
   request.onupgradeneeded=()=>{const db=request.result;for(const name of ['tracks','albums','covers','preferences','session'])if(!db.objectStoreNames.contains(name))db.createObjectStore(name,{keyPath:'id'});};
   request.onerror=()=>reject(request.error);request.onblocked=()=>{rejected=true;reject(new Error('ARCHIVE IN ANOTHER TAB'));};
   request.onsuccess=()=>{if(rejected){request.result.close();return;}resolve(request.result);};
  });
  this.db.onversionchange=()=>{this.db.close();this.db=null;this.failure='ARCHIVE OFFLINE';};return this;
 }
 async all(store){return this.read(store,s=>s.getAll());}
 async get(store,id){return this.read(store,s=>s.get(id));}
 read(store,run){if(!this.db)return Promise.reject(new Error('ARCHIVE OFFLINE'));return new Promise((resolve,reject)=>{const tx=this.db.transaction(store,'readonly'),r=run(tx.objectStore(store));r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
 write(stores,run){if(!this.db)return Promise.reject(new Error('ARCHIVE OFFLINE'));return new Promise((resolve,reject)=>{const tx=this.db.transaction(stores,'readwrite');tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||new Error('SAVE ERROR'));try{run(tx);}catch(e){tx.abort();reject(e);}});}
 putTrack(track){const {objectURL,cover,sourceRequired,...record}=track;return this.write(['tracks','albums','covers'],tx=>{tx.objectStore('tracks').put(record);tx.objectStore('albums').put({id:albumKey(track),title:track.album,artist:track.artist});if(track.artworkBlob)tx.objectStore('covers').put({id:track.id,blob:track.artworkBlob});});}
 save(preferences,session){return this.write(['preferences','session'],tx=>{tx.objectStore('preferences').put({id:'current',...preferences});tx.objectStore('session').put({id:'current',...session});});}
 updateSlots(updates){return this.write(['tracks'],tx=>{const store=tx.objectStore('tracks');for(const update of updates){const request=store.get(update.id);request.onsuccess=()=>{if(!request.result){tx.abort();return;}store.put({...request.result,cabinetSlot:update.cabinetSlot,updatedAt:Date.now()});};}});}
 removeTracks(tracks,remaining){return this.write(['tracks','covers','albums','session'],tx=>{const keptAlbums=new Set(remaining.map(albumKey));for(const track of tracks){tx.objectStore('tracks').delete(track.id);tx.objectStore('covers').delete(track.id);if(!keptAlbums.has(albumKey(track)))tx.objectStore('albums').delete(albumKey(track));}tx.objectStore('session').delete('current');});}
 remove(track,remaining){return this.removeTracks([track],remaining);}
 clear(){return this.write(['tracks','covers','albums','session'],tx=>{for(const name of ['tracks','covers','albums','session'])tx.objectStore(name).clear();});}
}

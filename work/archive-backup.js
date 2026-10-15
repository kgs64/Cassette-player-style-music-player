import {ArchiveDB,assignSlot,DRAWERS,normalizeTrack} from './archive.js';
import {createStoredZip} from './zip-store.js';
const FORMAT='cassette-world-collection', VERSION=1;
const copy=x=>JSON.parse(JSON.stringify(x));
const fail=message=>{throw Error(message);};
const clean=x=>JSON.parse(JSON.stringify(x,(k,v)=>['__proto__','constructor','prototype','objectURL','cover','sourceRequired'].includes(k)||v instanceof Blob?undefined:v));
const prefIds=['current','playback-lists','online-terminal'];
const crcTable=Uint32Array.from({length:256},(_,i)=>{let c=i;for(let k=0;k<8;k++)c=c&1?0xedb88320^(c>>>1):c>>>1;return c>>>0;});
async function checksum(blob){let c=0xffffffff;const reader=blob.stream().getReader();try{for(;;){const {value,done}=await reader.read();if(done)break;for(const n of value)c=crcTable[(c^n)&255]^(c>>>8);}}finally{reader.releaseLock();}return(c^0xffffffff)>>>0;}
export async function snapshot(db){const [tracks,covers,preferences]=await Promise.all(['tracks','covers','preferences'].map(s=>db.all(s)));return {tracks,covers,preferences:preferences.filter(p=>prefIds.includes(p.id))};}
export async function exportCollection(data,progress=()=>{}){
 const entries=[],manifest={format:FORMAT,version:VERSION,createdAt:new Date().toISOString(),tracks:[],preferences:clean(data.preferences)};
 for(let i=0;i<data.tracks.length;i++){
  const t=data.tracks[i],record=clean(t);record.assets={};
  const blobs={audioBlob:t.audioBlob||t.blob,artworkBlob:t.artworkBlob||data.covers.find(c=>c.id===t.id)?.blob,originalBlob:t.originalBlob};delete record.blob;
  for(const [key,blob]of Object.entries(blobs)){if(!(blob instanceof Blob))continue;const name=`media/${i}/${key}`;record.assets[key]={path:name,type:blob.type,size:blob.size};entries.push({name,blob});}
  manifest.tracks.push(record);
 }
 entries.unshift({name:'collection.json',blob:new Blob([JSON.stringify(manifest)],{type:'application/json'})});
 if(entries.reduce((n,e)=>n+e.blob.size+76+new TextEncoder().encode(e.name).length*2,22)>0xffffffff)fail('收藏超过 4 GB，当前 ZIP 备份暂不支持');
 if(entries.length>65535)fail('档案文件过多，请分批备份');
 return createStoredZip(entries,progress);
}
// Read only this application's uncompressed ZIP format, slicing large audio instead of decoding it.
export async function readCollection(file,progress=()=>{}){
 if(!(file instanceof Blob)||file.size<22)fail('这不是有效的收藏备份');
 const tail=new Uint8Array(await file.slice(Math.max(0,file.size-65557)).arrayBuffer()),tv=new DataView(tail.buffer);let end=-1;
 for(let i=tail.length-22;i>=0;i--)if(tv.getUint32(i,true)===0x06054b50&&i+22+tv.getUint16(i+20,true)===tail.length){end=i;break;}
 if(end<0)fail('备份不完整，找不到 ZIP 目录');
 const count=tv.getUint16(end+10,true),size=tv.getUint32(end+12,true),offset=tv.getUint32(end+16,true);
 if(tv.getUint16(end+4,true)||tv.getUint16(end+6,true)||count!==tv.getUint16(end+8,true)||offset+size!==file.size-tail.length+end||size>16*1024*1024||count>2000)fail('不支持的备份目录');
 const bytes=new Uint8Array(await file.slice(offset,offset+size).arrayBuffer()),v=new DataView(bytes.buffer),items=new Map();let at=0;
 for(let i=0;i<count;i++){
  if(at+46>bytes.length||v.getUint32(at,true)!==0x02014b50)fail('备份目录损坏');
  const flags=v.getUint16(at+8,true),method=v.getUint16(at+10,true),crc=v.getUint32(at+16,true),length=v.getUint32(at+24,true),nameLength=v.getUint16(at+28,true),extra=v.getUint16(at+30,true),comment=v.getUint16(at+32,true),local=v.getUint32(at+42,true);
  if(method!==0||(flags&~0x0800)||v.getUint32(at+20,true)!==length||at+46+nameLength+extra+comment>bytes.length)fail('请使用本项目导出的未压缩备份');
  const name=new TextDecoder('utf-8',{fatal:true}).decode(bytes.subarray(at+46,at+46+nameLength));
  if(items.has(name)||!/^(collection\.json|media\/\d+\/(audioBlob|artworkBlob|originalBlob))$/.test(name)||local+30>offset)fail('备份文件名无效或重复');
  const header=new DataView(await file.slice(local,local+30).arrayBuffer());
  if(header.getUint32(0,true)!==0x04034b50||header.getUint16(8,true)!==0||header.getUint32(14,true)!==crc||header.getUint32(22,true)!==length||header.getUint16(26,true)!==nameLength)fail('备份文件头损坏');
  const start=local+30+nameLength+header.getUint16(28,true);
  if(start+length>offset||new TextDecoder().decode(await file.slice(local+30,local+30+nameLength).arrayBuffer())!==name)fail('备份文件范围无效');
  items.set(name,{blob:file.slice(start,start+length),crc,start,end:start+length,local});at+=46+nameLength+extra+comment;
 }
 if(at!==size)fail('备份目录长度不匹配');
 let previous=0;for(const item of [...items.values()].sort((a,b)=>a.local-b.local)){if(item.local<previous)fail('备份文件范围重叠');previous=item.end;}
 const json=items.get('collection.json');if(!json||json.blob.size>16*1024*1024)fail('缺少收藏清单或清单过大');
 if(await checksum(json.blob)!==json.crc)fail('收藏清单校验失败');
 const manifest=JSON.parse(await json.blob.text(),(k,v)=>['__proto__','constructor','prototype'].includes(k)?undefined:v);
 if(manifest.format!==FORMAT||manifest.version!==VERSION||!Array.isArray(manifest.tracks)||manifest.tracks.length>576||!Array.isArray(manifest.preferences))fail('不支持的收藏备份版本');
 const tracks=[],ids=new Set(),used=new Set(['collection.json']);let completed=0;
 for(const raw of manifest.tracks){
  if(!raw||typeof raw.id!=='string'||!raw.id||ids.has(raw.id)||typeof raw.title!=='string'||typeof raw.artist!=='string'||typeof raw.album!=='string')fail('歌曲清单无效');ids.add(raw.id);
  const t=clean(raw);delete t.assets;t.onRecorder=false;
  for(const [key,a]of Object.entries(raw.assets||{})){
   if(!['audioBlob','artworkBlob','originalBlob'].includes(key)||!a||typeof a.path!=='string'||used.has(a.path))fail('歌曲资源引用无效');
   const item=items.get(a.path);if(!item||item.blob.size!==a.size||typeof a.type!=='string'||a.type.length>200)fail('备份缺少歌曲资源');
   if(await checksum(item.blob)!==item.crc)fail('歌曲或封面校验失败，未导入任何内容');
   t[key]=item.blob.slice(0,item.blob.size,a.type);used.add(a.path);progress(++completed,count-1);
  }
  tracks.push(normalizeTrack(t));
 }
 if(used.size!==items.size)fail('备份包含未引用的文件');
 for(const p of manifest.preferences){if(!p||typeof p.id!=='string')fail('偏好清单无效');if(p.id==='playback-lists'&&(!Array.isArray(p.lists)||p.lists.length>30))fail('播放列表清单无效');if(p.id==='online-terminal'&&p.favorites!=null&&(!Array.isArray(p.favorites)||p.favorites.length>1000))fail('在线收藏清单无效');if(p.id==='current'&&p.preferenceCards?.custom!=null&&(!Array.isArray(p.preferenceCards.custom)||p.preferenceCards.custom.length>24))fail('偏好卡清单无效');}
 const preferences=manifest.preferences.filter(p=>p&&prefIds.includes(p.id));if(new Set(preferences.map(p=>p.id)).size!==preferences.length)fail('偏好记录重复');
 return {tracks,preferences};
}
const trackIdentity=t=>t.fingerprint?`fp:${t.fingerprint}`:null;
function mergeLists(current,incoming,mapping,validIds){
 const lists=copy(current?.lists||[]),occupied=new Set(lists.map(l=>l.id));let added=0;
 for(const list of incoming?.lists||[]){
  if(!list||typeof list.name!=='string'||!Array.isArray(list.entries)||list.entries.length>300)fail('播放列表格式无效');
  const entries=list.entries.map(e=>e.kind==='local'?{...e,id:mapping.get(String(e.id))||String(e.id)}:e).filter(e=>e.kind==='local'?validIds.has(e.id):e.kind==='online'&&e.track?.id&&['audius','meting'].includes(e.track.provider));
  const candidate={...list,name:list.name.slice(0,60),entries};
  if(lists.some(l=>l.name===candidate.name&&JSON.stringify(l.entries)===JSON.stringify(entries)))continue;
  if(occupied.has(candidate.id)||typeof candidate.id!=='string')candidate.id=crypto.randomUUID();occupied.add(candidate.id);lists.push(candidate);added++;
 }
 if(lists.length>30)fail('合并后超过 30 个播放列表，请先整理现有列表');
 return {record:{...current,id:'playback-lists',lists,selectedId:current?.selectedId||lists[0]?.id||null},added};
}
export function planRestore(existing,incoming,{applySettings=false}={}){
 const tracks=[...existing.tracks],added=[],mapping=new Map(),fingerprints=new Map(tracks.map(t=>[trackIdentity(t),t]).filter(([k])=>k));let duplicates=0;
 for(const raw of incoming.tracks){
  const same=tracks.find(t=>t.id===raw.id),fp=trackIdentity(raw),match=fp&&fingerprints.get(fp)||same&&same.title===raw.title&&same.artist===raw.artist&&(same.audioBlob?.size||0)===(raw.audioBlob?.size||0)&&same;
  if(match){mapping.set(raw.id,match.id);duplicates++;continue;}
  const t={...raw,id:same?crypto.randomUUID():raw.id,onRecorder:false};mapping.set(raw.id,t.id);
  const slot=t.cabinetSlot;if(!slot||!DRAWERS.includes(slot.drawer)||!Number.isInteger(slot.index)||slot.index<0||slot.index>=96||tracks.some(r=>r.cabinetSlot?.drawer===slot.drawer&&r.cabinetSlot.index===slot.index))t.cabinetSlot=assignSlot(tracks,t);
  tracks.push(t);added.push(t);if(fp)fingerprints.set(fp,t);
 }
 const prefs=new Map(existing.preferences.map(p=>[p.id,copy(p)])),source=new Map(incoming.preferences.map(p=>[p.id,p]));
 const lists=mergeLists(prefs.get('playback-lists'),source.get('playback-lists'),mapping,new Set(tracks.map(t=>t.id)));prefs.set('playback-lists',lists.record);
 const cur=prefs.get('current')||{id:'current'},inc=source.get('current');
 if(inc){const custom=copy(cur.preferenceCards?.custom||[]);for(const c of inc.preferenceCards?.custom||[]){if(!custom.some(x=>JSON.stringify(x)===JSON.stringify(c)))custom.push({...c,id:custom.some(x=>x.id===c.id)?crypto.randomUUID():c.id});}if(custom.length>24)fail('合并后超过 24 张偏好卡，请先整理偏好卡');prefs.set('current',{...(applySettings?copy(inc):cur),id:'current',preferenceCards:{...(cur.preferenceCards||inc.preferenceCards),custom}});}
 const online=prefs.get('online-terminal'),io=source.get('online-terminal');if(io){const favorites=copy(online?.favorites||[]);for(const t of io.favorites||[])if(!favorites.some(x=>x.id===t.id&&x.provider===t.provider))favorites.push(t);if(favorites.length>200)fail('合并后超过 200 首在线收藏，请先整理在线收藏');prefs.set('online-terminal',{...copy(online||io),id:'online-terminal',favorites});}
 return {added,duplicates,listsAdded:lists.added,preferences:[...prefs.values()],bytes:added.reduce((n,t)=>n+['audioBlob','artworkBlob','originalBlob'].reduce((s,k)=>s+(t[k]?.size||0),0),0)};
}
const stamp=data=>JSON.stringify({tracks:data.tracks.map(t=>[t.id,t.updatedAt,t.cabinetSlot,t.audioBlob?.size]),preferences:data.preferences});
export async function commitRestore(db,existing,plan){
 if(navigator.storage?.estimate){const {usage=0,quota}=await navigator.storage.estimate();if(quota&&plan.bytes>quota-usage)fail('浏览器存储空间不足，请先释放空间');}
 const expected=stamp(existing);
 await db.write(['tracks','covers','albums','preferences'],tx=>{
  let rows,prefs;const finish=()=>{if(!rows||!prefs)return;if(stamp({tracks:rows,preferences:prefs.filter(p=>prefIds.includes(p.id))})!==expected){tx.abort();return;}
   for(const t of plan.added){const {objectURL,cover,sourceRequired,...record}=t;tx.objectStore('tracks').put(record);tx.objectStore('albums').put({id:t.artist+'\u001f'+t.album,title:t.album,artist:t.artist});if(t.artworkBlob)tx.objectStore('covers').put({id:t.id,blob:t.artworkBlob});}
   for(const p of plan.preferences)tx.objectStore('preferences').put(p);
  };
  tx.objectStore('tracks').getAll().onsuccess=e=>{rows=e.target.result;finish();};tx.objectStore('preferences').getAll().onsuccess=e=>{prefs=e.target.result;finish();};
 });
}
export function mountBackup(host){
 const section=document.createElement('section');section.id='collection-backup';section.innerHTML='<h3>收藏备份与恢复</h3><p>备份音频、封面、歌词、柜内位置、播放列表与偏好卡。在线歌曲仅保存记录，仍需联网播放。保存文件夹授权不会复制。</p><div style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" data-export>导出收藏备份</button><button type="button" data-import>选择备份恢复</button></div><input type="file" accept=".zip,application/zip" hidden style="display:none" data-backup-file><p role="status" aria-live="polite" data-message></p><div hidden data-preview><p data-summary></p><label style="display:flex;gap:8px"><input type="checkbox" style="width:auto" data-apply>使用备份中的音量、皮肤与歌词设置</label><p>合并恢复，不覆盖已有歌曲，保留当前播放列表与偏好卡。完成后将重新载入页面，音乐会暂停。</p><button type="button" data-confirm>合并恢复并重新载入</button> <button type="button" data-cancel>取消</button></div>';
 host.append(section);const q=s=>section.querySelector(s),message=q('[data-message]'),preview=q('[data-preview]'),input=q('input[type=file]');let incoming=null,working=false;
 const say=s=>message.textContent=s;
 async function connected(fn){const db=await new ArchiveDB().open();try{return await fn(db);}finally{db.db?.close();}}
 async function job(fn){if(working)return;working=true;for(const b of section.querySelectorAll('button'))b.disabled=true;try{await fn();}catch(e){say(e.name==='QuotaExceededError'?'存储空间不足，原收藏已保留。':e.message||'操作未完成，原收藏已保留。');}finally{working=false;for(const b of section.querySelectorAll('button'))b.disabled=false;}}
 q('[data-export]').onclick=()=>job(async()=>{say('正在整理收藏…');await new Promise(r=>setTimeout(r,650));const blob=await connected(async db=>exportCollection(await snapshot(db),(n,total)=>say(`正在备份 ${n} / ${total}`)));const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`Cassette-World-${new Date().toISOString().slice(0,10)}.zip`;a.click();setTimeout(()=>URL.revokeObjectURL(url),60000);say('备份已生成，请保留下载的 ZIP 文件。');});
 q('[data-import]').onclick=()=>input.click();
 const describe=async()=>{const plan=await connected(async db=>planRestore(await snapshot(db),incoming,{applySettings:q('[data-apply]').checked}));q('[data-summary]').textContent=`档案共 ${incoming.tracks.length} 首：新增 ${plan.added.length} 首，重复跳过 ${plan.duplicates} 首，新增 ${plan.listsAdded} 个播放列表。`;};
 input.onchange=()=>job(async()=>{preview.hidden=true;incoming=null;const file=input.files[0];input.value='';if(!file)return;say('正在校验备份…');incoming=await readCollection(file,(n,total)=>say(`正在校验 ${n} / ${total}`));await describe();preview.hidden=false;say('校验通过，尚未写入收藏。');});
 q('[data-cancel]').onclick=()=>{preview.hidden=true;incoming=null;say('已取消，收藏未改变。');};
 q('[data-confirm]').onclick=()=>job(async()=>{if(!incoming)return;say('正在合并收藏，请勿关闭页面…');await connected(async db=>{const existing=await snapshot(db),plan=planRestore(existing,incoming,{applySettings:q('[data-apply]').checked});await commitRestore(db,existing,plan);});say('恢复完成，正在重新载入…');/* Keep the old page's exit autosave from replacing restored preferences. */for(const event of ['pagehide','visibilitychange'])window.addEventListener(event,e=>e.stopImmediatePropagation(),{capture:true,once:true});location.reload();});
}
export function installBackup(){const tryMount=()=>{const host=document.querySelector('#machine-settings article');if(!host)return false;if(!host.querySelector('#collection-backup'))mountBackup(host);return true;};if(tryMount())return;const observer=new MutationObserver(()=>{if(tryMount())observer.disconnect();});observer.observe(document.body,{childList:true,subtree:true});}

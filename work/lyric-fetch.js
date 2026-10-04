import {parseLyrics,MAX_LYRIC_BYTES} from './lyric-data.js';
const fold=s=>String(s||'').normalize('NFKC').toLocaleLowerCase().replace(/[^\p{L}\p{N}]/gu,'');
export function lyricSignature(meta){
 let title=String(meta.title||'').trim(),artist=String(meta.artist||'').trim();
 if(!artist||/^(UNKNOWN ARTIST|未知歌手)$/i.test(artist)){
  const parts=title.split(/\s+[-–—]\s+/);if(parts.length!==2)return null;[artist,title]=parts.map(s=>s.trim());
 }
 const duration=Number(meta.duration);if(!title||!artist||title.length>250||artist.length>250||!Number.isFinite(duration)||duration<1||duration>3600)return null;
 const album=/^(LOCAL TAPES|本地磁带|UNKNOWN ALBUM)$/i.test(String(meta.album||''))?'':String(meta.album||'').trim();return {title,artist,album,duration};
}
export function matchLyricRecord(meta,record){
 if(!record||fold(meta.title)!==fold(record.trackName)||fold(meta.artist)!==fold(record.artistName)||!Number.isFinite(record.duration)||Math.abs(record.duration-meta.duration)>2)return null;
 if(meta.album&&fold(meta.album)!==fold(record.albumName))return null;
 if(record.instrumental)return {status:'instrumental',lyrics:null};
 const source=typeof record.syncedLyrics==='string'&&record.syncedLyrics.trim()?record.syncedLyrics:record.plainLyrics;
 if(typeof source!=='string'||source.length>MAX_LYRIC_BYTES)return null;const lyrics=parseLyrics(source);if(!lyrics.cues.length)return null;
 return {status:'found',lyrics,provider:'LRCLIB',recordId:record.id};
}
export function createLyricLookup({fetcher=(...args)=>fetch(...args),timeoutMs=8000,intervalMs=300,client='Cassette World/5.15 (local web client)'}={}){
 let queue=Promise.resolve(),nextAt=0,retryAt=0;const cache=new Map();
 const state={pending:0,last:'idle',provider:'LRCLIB'};
 async function run(signature){
  if(Date.now()<retryAt)return {status:'rate-limited',lyrics:null};
  if(nextAt>Date.now())await new Promise(resolve=>setTimeout(resolve,nextAt-Date.now()));
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),timeoutMs);
  try{
   const url=new URL('https://lrclib.net/api/get');url.searchParams.set('track_name',signature.title);url.searchParams.set('artist_name',signature.artist);url.searchParams.set('duration',String(Math.round(signature.duration)));if(signature.album)url.searchParams.set('album_name',signature.album);
   const response=await fetcher(url.href,{signal:controller.signal,headers:{'Lrclib-Client':client},credentials:'omit',referrerPolicy:'no-referrer'});
   if(response.status===429){const header=response.headers.get('Retry-After'),seconds=Number(header);retryAt=Number.isFinite(seconds)&&seconds>0?Date.now()+seconds*1000:Math.max(Date.now()+60000,Date.parse(header)||0);return {status:'rate-limited',lyrics:null};}
   if(response.status===404)return {status:'not-found',lyrics:null};if(!response.ok)return {status:'unavailable',lyrics:null};
   let text='';if(response.body?.getReader){const reader=response.body.getReader(),chunks=[];let size=0;while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>1024*1024){controller.abort();return {status:'unavailable',lyrics:null};}chunks.push(value);}const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}text=new TextDecoder().decode(bytes);}else text=await response.text();
   if(text.length>1024*1024)return {status:'unavailable',lyrics:null};return matchLyricRecord(signature,JSON.parse(text))||{status:'no-exact-match',lyrics:null};
  }catch(error){return {status:error.name==='AbortError'?'timeout':'unavailable',lyrics:null};}
  finally{clearTimeout(timer);nextAt=Date.now()+intervalMs;}
 }
 return {state,lookup(meta){const signature=lyricSignature(meta);if(!signature){state.last='missing-metadata';return Promise.resolve({status:'missing-metadata',lyrics:null});}
  const key=JSON.stringify(signature),cached=cache.get(key);if(cached&&Date.now()-cached.at<15*60*1000){state.last=cached.result.status;return Promise.resolve(cached.result);}
  state.pending++;const task=queue.then(()=>run(signature)).then(result=>{if(['found','instrumental','not-found'].includes(result.status)){cache.set(key,{result,at:Date.now()});while(cache.size>32)cache.delete(cache.keys().next().value);}state.last=result.status;return result;}).finally(()=>state.pending--);queue=task.catch(()=>{});return task;
 }};
}

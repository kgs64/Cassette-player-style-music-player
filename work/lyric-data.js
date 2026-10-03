// Local, bounded lyric data. Never guess timing for unsynchronised text.
export const MAX_LYRIC_BYTES=512*1024;
export function parseLyrics(source){
 if(typeof source!=='string')return {timed:false,cues:[]};
 source=source.slice(0,MAX_LYRIC_BYTES).replace(/^\uFEFF/,'');
 const offset=Number(source.match(/\[offset:([+-]?\d+)\]/i)?.[1]||0)/1000;
 const timed=[],plain=[];
 for(const row of source.split(/\r?\n/).slice(0,4000)){
  const tags=[...row.matchAll(/\[(\d{1,3}):(\d{2})(?:[.:](\d{1,3}))?\]/g)];
  const text=row.replace(/\[[^\]]*\]/g,'').trim().slice(0,400);
  if(tags.length){for(const tag of tags){const seconds=Number(tag[2]);if(seconds<60)timed.push({time:Math.max(0,Number(tag[1])*60+seconds+Number('0.'+(tag[3]||'0'))+offset),text});}}
  else if(text)plain.push(text);
 }
 const cues=timed.length?timed.sort((a,b)=>a.time-b.time).slice(0,3000):plain.slice(0,1000).map(text=>({time:null,text}));
 // Multiple translations at the same timestamp share a physical page.
 const merged=[];for(const cue of cues){const last=merged.at(-1);if(timed.length&&last?.time===cue.time){if(cue.text)last.text=(last.text+'\n'+cue.text).trim().slice(0,600);}else merged.push({...cue});}
 return {timed:timed.length>0,cues:merged};
}
export function lyricIndex(data,time){
 if(!data?.cues?.length)return -1;if(!data.timed)return 0;
 let lo=0,hi=data.cues.length-1,found=-1;while(lo<=hi){const mid=(lo+hi)>>1;if(data.cues[mid].time<=time){found=mid;lo=mid+1;}else hi=mid-1;}return found;
}
export function lyricStem(name){return String(name||'').replace(/\.[^.]+$/,'').normalize('NFKC').trim().toLocaleLowerCase();}
export function matchLyricTrack(fileName,tracks,fallbackId=null){
 const stem=lyricStem(fileName),matches=tracks.filter(t=>lyricStem(t.fileName)===stem||lyricStem(t.title)===stem);
 if(matches.length===1)return matches[0];if(matches.length>1)return null;return tracks.find(t=>t.id===fallbackId)||null;
}
function decoder(code){return new TextDecoder(code===1?'utf-16':code===2?'utf-16be':code===3?'utf-8':'iso-8859-1');}
function terminated(bytes,start,width){let p=start;while(p+width<=bytes.length){if(bytes[p]===0&&(width===1||bytes[p+1]===0))return p;p+=width;}return bytes.length;}
export function decodeLyricFrame(id,data){
 if(data.length<5||data[0]>3)return null;const width=[1,2].includes(data[0])?2:1,decode=decoder(data[0]);
 if(id==='USLT'){const end=terminated(data,4,width);return parseLyrics(decode.decode(data.subarray(end+width)).replace(/\0/g,''));}
 // SYLT format 2 uses milliseconds; MPEG-frame timing needs a frame index and
 // is deliberately not interpreted as milliseconds.
 if(id==='SYLT'&&data[4]===2){let p=terminated(data,6,width)+width;const cues=[],v=new DataView(data.buffer,data.byteOffset,data.byteLength);while(p<data.length&&cues.length<3000){const end=terminated(data,p,width),at=end+width;if(at+4>data.length)break;const text=decode.decode(data.subarray(p,end)).replace(/\0/g,'').trim();cues.push({time:v.getUint32(at)/1000,text:text.slice(0,400)});p=at+4;}cues.sort((a,b)=>a.time-b.time);return {timed:true,cues};}return null;
}
export async function readLyricMetadata(blob){
 try{
  const b=new Uint8Array(await blob.slice(0,8*1024*1024).arrayBuffer());if(new TextDecoder().decode(b.subarray(0,3))!=='ID3'||![3,4].includes(b[3]))return null;
  let p=10;if(b[5]&64){if(b.length<14)return null;const ext=b[3]===4?((b[10]&127)<<21)|((b[11]&127)<<14)|((b[12]&127)<<7)|(b[13]&127):new DataView(b.buffer).getUint32(10)+4;p+=ext;}
  while(p+10<=b.length){const id=new TextDecoder().decode(b.subarray(p,p+4));if(!/^[A-Z0-9]{4}$/.test(id))break;const n=b[3]===4?((b[p+4]&127)<<21)|((b[p+5]&127)<<14)|((b[p+6]&127)<<7)|(b[p+7]&127):new DataView(b.buffer).getUint32(p+4);if(n<=0||p+10+n>b.length)break;
   if(['USLT','SYLT'].includes(id)&&n<=MAX_LYRIC_BYTES){const result=decodeLyricFrame(id,b.subarray(p+10,p+10+n));if(result?.cues.length)return result;}p+=10+n;
  }
 }catch{/* Missing or malformed lyrics never block playback. */}return null;
}

export function serializeLyrics(data){
 if(!data?.cues?.length)return '';return data.cues.map(cue=>{if(!data.timed)return cue.text;const milliseconds=Math.max(0,Math.round(cue.time*1000)),minutes=Math.floor(milliseconds/60000),seconds=Math.floor(milliseconds/1000)%60;const stamp=`[${String(minutes).padStart(2,'0')}:${String(seconds).padStart(2,'0')}.${String(milliseconds%1000).padStart(3,'0')}]`;return cue.text.split('\n').map(row=>stamp+row).join('\n');}).join('\n').slice(0,MAX_LYRIC_BYTES);
}

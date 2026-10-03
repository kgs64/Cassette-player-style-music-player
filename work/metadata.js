import {parseLyrics} from './lyric-data.js';
// Bounded local metadata readers. Playback codec support is still decided by Audio.
export async function readExtendedMetadata(file,t){
 try{
  const bytes=new Uint8Array(await file.slice(0,8*1024*1024).arrayBuffer()),v=new DataView(bytes.buffer),ascii=(p,n)=>new TextDecoder().decode(bytes.subarray(p,p+n));
  const set=(key,value)=>{if(value?.trim())t[key]=value.trim();};
  const cover=(data,type)=>{if(!data.length||data.length>2*1024*1024||!['image/jpeg','image/png','image/webp'].includes(type))return;if(t.cover)URL.revokeObjectURL(t.cover);t.artworkBlob=new Blob([data],{type});t.cover=URL.createObjectURL(t.artworkBlob);};
  if(ascii(0,4)==='fLaC'){
   let p=4;while(p+4<=bytes.length){const type=bytes[p]&127,last=bytes[p]&128,n=(bytes[p+1]<<16)|(bytes[p+2]<<8)|bytes[p+3];p+=4;if(p+n>bytes.length)break;
    if(type===4){let q=p,vendor=v.getUint32(q,true);q+=4+vendor;if(q+4>p+n)break;let count=v.getUint32(q,true);q+=4;while(count--&&q+4<=p+n){const length=v.getUint32(q,true);q+=4;if(q+length>p+n)break;const text=ascii(q,length),eq=text.indexOf('='),key=text.slice(0,eq).toUpperCase(),value=text.slice(eq+1);if(['LYRICS','UNSYNCEDLYRICS'].includes(key))t.lyrics=parseLyrics(value);if(key==='TITLE')set('title',value);if(key==='ARTIST')set('artist',value);if(key==='ALBUM')set('album',value);q+=length;}}
    if(type===6){let q=p+4;const mimeLength=v.getUint32(q);q+=4;const mime=ascii(q,mimeLength);q+=mimeLength;const description=v.getUint32(q);q+=4+description+16;const length=v.getUint32(q);q+=4;if(q+length<=p+n)cover(bytes.slice(q,q+length),mime);}
    p+=n;if(last)break;
   }
  }
  // iTunes MP4 metadata atoms. Walk only validated atom boundaries.
  if(ascii(4,4)==='ftyp'){
   function walk(start,end,depth=0,parent=''){
    if(depth>8)return;for(let p=start;p+8<=end;){const n=v.getUint32(p),type=String.fromCharCode(...bytes.slice(p+4,p+8));if(n<8||p+n>end)break;
     if(type==='data'&&['©nam','©ART','aART','©alb','©lyr','covr'].includes(parent)&&n>=16){const data=bytes.slice(p+16,p+n);if(parent==='©lyr')t.lyrics=parseLyrics(new TextDecoder().decode(data));else if(parent==='covr')cover(data,v.getUint32(p+8)===14?'image/png':'image/jpeg');else set(parent==='©nam'?'title':parent==='©alb'?'album':'artist',new TextDecoder().decode(data));}
     else if(['moov','udta','meta','ilst','©nam','©ART','aART','©alb','©lyr','covr'].includes(type))walk(p+8+(type==='meta'?4:0),p+n,depth+1,type);
     p+=n;
    }
   }walk(0,bytes.length);
  }
 }catch{/* Malformed or unsupported tags never block a playable audio file. */}
}

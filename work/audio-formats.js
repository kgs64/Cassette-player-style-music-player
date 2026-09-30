import {ENCRYPTED_EXTENSIONS,encryptedFile} from './music-import.js';
// Native containers use the browser decoder. AIFF/AIFC PCM and AU are converted
// locally into PCM WAV, including endian conversion and 8/16/24/32-bit samples.
// Layout: Apple AIFF 1.3 / AIFC COMM+SSND, and Sun/NeXT .snd header.
export const AUDIO_EXTENSIONS=['mp3','mpga','wav','wave','ogg','oga','opus','aac','m4a','m4b','mp4','flac','webm','weba','aif','aiff','aifc','au','snd',...ENCRYPTED_EXTENSIONS];
export const AUDIO_ACCEPT='audio/*,'+AUDIO_EXTENSIONS.map(e=>'.'+e).join(',')+',.db,.json';
export function acceptsAudio(file){return encryptedFile(file)||/^audio\//i.test(file.type)||AUDIO_EXTENSIONS.includes(file.name.split('.').pop().toLowerCase());}
const text=(v,p,n)=>String.fromCharCode(...new Uint8Array(v.buffer,v.byteOffset+p,n));
function fail(message='UNSUPPORTED AUDIO CODEC'){throw new Error(message);}
function unpack(v,at,bits,little,float=false){
  if(float)return bits===32?v.getFloat32(at,little):v.getFloat64(at,little);
  if(bits===8)return v.getInt8(at)/128;
  if(bits===16)return v.getInt16(at,little)/32768;
  if(bits===24){let n=little?v.getUint8(at)|(v.getUint8(at+1)<<8)|(v.getUint8(at+2)<<16):(v.getUint8(at)<<16)|(v.getUint8(at+1)<<8)|v.getUint8(at+2);if(n&0x800000)n-=0x1000000;return n/8388608;}
  if(bits===32)return v.getInt32(at,little)/2147483648;
  fail();
}
function expandLaw(byte,aLaw){if(aLaw){byte^=0x55;let sample=(byte&15)<<4,segment=(byte&112)>>4;sample+=segment===0?8:264;if(segment>1)sample<<=segment-1;return ((byte&128)?sample:-sample)/32768;}
  byte=(~byte)&255;const sample=(((byte&15)<<3)+132)<<((byte&112)>>4);return ((byte&128)?132-sample:sample-132)/32768;
}
export function decodeLegacy(buffer){
  if(buffer.byteLength<24)fail('DAMAGED AUDIO FILE');const v=new DataView(buffer);const signature=text(v,0,4);
  let channels,rate,frames,start,available,bits,little=false,float=false,law=null;
  if(signature==='FORM'){
    const form=text(v,8,4);if(!['AIFF','AIFC'].includes(form))fail();let codec='NONE',comm=false,ssnd=false;
    for(let p=12;p+8<=v.byteLength;){const id=text(v,p,4),size=v.getUint32(p+4),q=p+8,end=q+size;if(end>v.byteLength)fail('TRUNCATED AUDIO FILE');
      if(id==='COMM'){if(size<18)fail('DAMAGED AIFF HEADER');channels=v.getUint16(q);frames=v.getUint32(q+2);bits=v.getUint16(q+6);const exponent=v.getUint16(q+8);const mantissa=v.getUint32(q+10)*4294967296+v.getUint32(q+14);rate=mantissa*Math.pow(2,(exponent&32767)-16383-63)*(exponent&32768?-1:1);if(form==='AIFC'){if(size<22)fail();codec=text(v,q+18,4);}comm=true;}
      if(id==='SSND'){if(size<8)fail();const offset=v.getUint32(q);start=q+8+offset;available=size-8-offset;if(available<0)fail();ssnd=true;}
      p=end+(size&1);
    }
    if(!comm||!ssnd)fail('INCOMPLETE AIFF FILE');
    little=codec==='sowt';float=['fl32','FL32','fl64','FL64'].includes(codec);law=['ulaw','ULAW','alaw','ALAW'].includes(codec)?codec.toLowerCase():null;
    if(!['NONE','twos','sowt','fl32','FL32','fl64','FL64','ulaw','ULAW','alaw','ALAW'].includes(codec))fail('AIFC COMPRESSION NOT SUPPORTED');
    if(float)bits=/32/.test(codec)?32:64;if(law)bits=8;
  }else if(signature==='.snd'){
    start=v.getUint32(4);available=v.getUint32(8);const encoding=v.getUint32(12);rate=v.getUint32(16);channels=v.getUint32(20);
    const mapping={1:8,2:8,3:16,4:24,5:32,6:32,7:64,27:8};bits=mapping[encoding];if(!bits)fail('AU COMPRESSION NOT SUPPORTED');float=encoding===6||encoding===7;law=encoding===1?'ulaw':encoding===27?'alaw':null;
    if(start<24||start>v.byteLength)fail('DAMAGED AU HEADER');if(available===0xffffffff)available=v.byteLength-start;
    frames=Math.floor(available/(channels*(bits/8)));
  }else fail('UNRECOGNIZED AUDIO FILE');
  rate=Math.round(rate);if(!Number.isInteger(channels)||channels<1||channels>8||!Number.isFinite(rate)||rate<1000||rate>384000||!Number.isInteger(frames)||frames<1||!([8,16,24,32].includes(bits)||(float&&bits===64)))fail('INVALID AUDIO PARAMETERS');
  const stride=bits/8,total=frames*channels;if(start+total*stride>v.byteLength||total*stride>available)fail('TRUNCATED AUDIO FILE');if(total*2>512*1024*1024)fail('AUDIO FILE TOO LARGE');
  const result=new ArrayBuffer(44+total*2),out=new DataView(result);const put=(p,s)=>{for(let i=0;i<s.length;i++)out.setUint8(p+i,s.charCodeAt(i));};
  put(0,'RIFF');out.setUint32(4,result.byteLength-8,true);put(8,'WAVEfmt ');out.setUint32(16,16,true);out.setUint16(20,1,true);out.setUint16(22,channels,true);out.setUint32(24,rate,true);out.setUint32(28,rate*channels*2,true);out.setUint16(32,channels*2,true);out.setUint16(34,16,true);put(36,'data');out.setUint32(40,total*2,true);
  for(let i=0;i<total;i++){let n=law?expandLaw(v.getUint8(start+i),law==='alaw'):unpack(v,start+i*stride,bits,little,float);n=Number.isFinite(n)?Math.max(-1,Math.min(1,n)):0;out.setInt16(44+i*2,Math.round(n*(n<0?32768:32767)),true);}
  return {buffer:result,duration:frames/rate,channels,sampleRate:rate};
}
export async function prepareAudio(file){const ext=file.name.split('.').pop().toLowerCase();if(['aif','aiff','aifc','au','snd'].includes(ext)){const decoded=decodeLegacy(await file.arrayBuffer());return {...decoded,blob:new Blob([decoded.buffer],{type:'audio/wav'}),converted:true};}
  const mime={mpga:'audio/mpeg',wave:'audio/wav',oga:'audio/ogg',opus:'audio/ogg',m4b:'audio/mp4',mp4:'audio/mp4',weba:'audio/webm'}[ext];return {blob:mime?new Blob([file],{type:mime}):file,converted:false,duration:0};
}

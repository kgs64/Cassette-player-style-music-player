import encoderSource from './encoder-source.js';
function encoderWorker(){
 let encoder,parts=[],frames=0;
 self.onmessage=({data:m})=>{try{
  if(m.type==='start'){encoder=new lamejs.Mp3Encoder(m.channels,44100,192);parts=[];frames=0;postMessage({type:'ready'});}
  if(m.type==='chunk'){const left=new Float32Array(m.left),right=m.right?new Float32Array(m.right):null;
   for(let p=0;p<left.length;p+=1152){const n=Math.min(1152,left.length-p),l=new Int16Array(n),r=right?new Int16Array(n):null;for(let i=0;i<n;i++){const a=Math.max(-1,Math.min(1,left[p+i]));l[i]=a<0?a*32768:a*32767;if(r){const b=Math.max(-1,Math.min(1,right[p+i]));r[i]=b<0?b*32768:b*32767;}}const bytes=r?encoder.encodeBuffer(l,r):encoder.encodeBuffer(l);if(bytes.length)parts.push(new Uint8Array(bytes));}
   frames+=left.length;postMessage({type:'chunk',frames});}
  if(m.type==='finish'){const tail=encoder.flush();if(tail.length)parts.push(new Uint8Array(tail));const blob=new Blob(parts,{type:'audio/mpeg'});parts=[];encoder=null;postMessage({type:'done',blob});}
 }catch(error){postMessage({type:'error',message:error.message});}};
}
export async function transcodeMp3(blob,{onProgress=()=>{},duration=0}={}){
 if(blob.size>64*1024*1024||duration>600)throw new Error('USE AUDIO UNDER 10 MIN / 64 MB');
 onProgress(0,'DECODING');
 const Decoder=globalThis.OfflineAudioContext||globalThis.webkitOfflineAudioContext;if(!Decoder)throw new Error('AUDIO DECODER UNAVAILABLE');
 let pcm;try{pcm=await new Decoder(2,1,44100).decodeAudioData(await blob.arrayBuffer());}catch{throw new Error('UNSUPPORTED AUDIO CODEC');}
 if(pcm.length*pcm.numberOfChannels*4>128*1024*1024)throw new Error('AUDIO EXCEEDS MEMORY LIMIT');
 const source=new Blob([encoderSource,'\n(',encoderWorker.toString(),')();'],{type:'text/javascript'}),url=URL.createObjectURL(source);let worker;
 try{worker=new Worker(url);const request=(message,transfer=[])=>new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(new Error('ENCODER TIMEOUT')),30000);worker.onmessage=({data})=>{clearTimeout(timer);data.type==='error'?reject(new Error(data.message)):resolve(data);};worker.onerror=event=>{clearTimeout(timer);reject(new Error(event.message||'ENCODER FAILED'));};worker.postMessage(message,transfer);});
  const channels=Math.min(2,pcm.numberOfChannels);await request({type:'start',channels});
  for(let at=0;at<pcm.length;at+=23040){const end=Math.min(at+23040,pcm.length),left=pcm.getChannelData(0).slice(at,end),right=channels===2?pcm.getChannelData(1).slice(at,end):null;await request({type:'chunk',left:left.buffer,right:right?.buffer},right?[left.buffer,right.buffer]:[left.buffer]);onProgress(end/pcm.length,'ENCODING');}
  const result=await request({type:'finish'});return {blob:result.blob,duration:pcm.duration,converted:true};
 }finally{worker?.terminate();URL.revokeObjectURL(url);pcm=null;}
}

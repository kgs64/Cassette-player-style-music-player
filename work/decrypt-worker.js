import {decryptAudio,readKggKeys} from './decrypt-audio.js';
self.onmessage=async({data})=>{try{if(data.type==='keys')postMessage({type:'done',keys:await readKggKeys(data.file)});else postMessage({type:'done',...await decryptAudio(data.file,{keys:data.keys,onProgress:p=>postMessage({type:'progress',progress:p})})});}catch(e){postMessage({type:'error',message:e.message||'DECRYPTION FAILED'});}};

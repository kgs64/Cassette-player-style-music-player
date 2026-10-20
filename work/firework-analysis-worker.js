import {makeScore} from './firework-score.js';
self.onmessage=({data})=>{try{postMessage({score:makeScore(new Float32Array(data.pcm),data.rate,data.seed)});}catch(e){postMessage({error:e.message});}};

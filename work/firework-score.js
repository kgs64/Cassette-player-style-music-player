// Pure, seeded score generator. Runs in a Worker; independent of playback volume.
export const SCORE_VERSION=21;
// Two world-space clusters behind the machine, with a small central allowance.
// Depth stays inside the 120-unit far plane: at -85 the camera distance already
// reached 112 and anything deeper was clipped away instead of drawn. The right
// cluster stops short of the antenna, which owns screen x ~0.70 at this distance.
export function farShorePosition(random){const depth=-58-random()*10,zone=random(),offset=zone<.12?(random()-.5)*10:(zone<.56?-(24+random()*10):(15+random()*8));return[depth*.42+offset,5.2+random()*1.3,depth];}
function chooseShape(random){const n=random();return n<.42?0:n<.68?1:2;}
export function makeScore(samples,sampleRate,seed=1){
 const hop=1024,frames=[],random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 let low=0,last=0;const alpha=1-Math.exp(-2*Math.PI*160/sampleRate);
 for(let p=0;p<samples.length;p+=hop){let power=0,bass=0,flux=0;const end=Math.min(samples.length,p+hop);for(let j=p;j<end;j++){const x=samples[j];low+=alpha*(x-low);power+=x*x;bass+=low*low;flux+=Math.abs(x-last);last=x;}const n=end-p;frames.push({time:p/sampleRate,energy:Math.sqrt(power/n),bass:Math.sqrt(bass/n),edge:flux/n});}
 const sorted=frames.map(f=>f.energy).sort((a,b)=>a-b),q=p=>sorted[Math.min(sorted.length-1,Math.floor(sorted.length*p))]||0,lo=q(.15),hi=q(.92);
 const candidates=[];
 for(let i=2;i<frames.length-2;i++){const f=frames[i],before=frames.slice(Math.max(0,i-12),i),mean=before.reduce((s,v)=>s+v.energy,0)/before.length,bmean=before.reduce((s,v)=>s+v.bass,0)/before.length;
 const relative=Math.min(1,Math.max(0,(f.energy-lo)/Math.max(.0001,hi-lo)));
 const onset=Math.max(0,(f.energy-mean)/Math.max(.008,mean))+.7*Math.max(0,(f.bass-bmean)/Math.max(.008,bmean));
 const strength=.5*relative+.5*Math.min(1,onset);
 if(f.energy>.004&&relative>.19&&f.energy>=frames[i-1].energy&&f.energy>=frames[i+1].energy)candidates.push({time:f.time,strength,onset,relative});}
 // Choose representative accents in broad phrase windows, not individual beats.
 const events=[];let lastBurst=-10,smooth=.5;
 for(let start=3;start<samples.length/sampleRate-2;start+=3.15){const options=candidates.filter(f=>f.time>=start&&f.time<start+3.15&&f.time-lastBurst>=2.55);options.sort((a,b)=>(b.strength+b.onset*.12)-(a.strength+a.onset*.12));const f=options[0];if(!f)continue;
 smooth=.55*smooth+.45*f.strength;const ascent=2.1+random()*.6;
 const event={launch:f.time-ascent,burst:f.time,ascent,position:farShorePosition(random),size:9.6+Math.sqrt(smooth)*2.2,color:(r=>r<.80?0:r<.90?1:r<.96?2:r<.98?4:3)(random()),shape:chooseShape(random),seed:Math.floor(random()*4294967296),strength:f.strength,accent:f.relative>.7};
 if(event.launch>=0){events.push(event);lastBurst=f.time;}
 }
 return{version:SCORE_VERSION,duration:samples.length/sampleRate,events,features:{frames:frames.length,lowEnergy:lo,highEnergy:hi,candidates:candidates.length},mode:'preanalyzed'};
}
export function scoreWorker(){self.onmessage=({data})=>{try{postMessage({score:makeScore(new Float32Array(data.pcm),data.rate,data.seed)});}catch(e){postMessage({error:e.message});}};}
export function atmosphereScore(duration,seed){const events=[];let s=seed>>>0;const r=()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return s/4294967296;};for(let burst=8;burst<Math.min(duration||14400,14400);burst+=5.5+r()*4){const ascent=2.1+r()*.5;events.push({launch:burst-ascent,burst,ascent,position:farShorePosition(r),size:7.4+r()*1.0,color:0,shape:chooseShape(r),seed:Math.floor(r()*4294967296),strength:.4,accent:false});}return{version:SCORE_VERSION,events,mode:'atmosphere',duration};}
export function visibleEvents(events,time,density='sparse',reduced=false){return events.filter((e,i)=>(density==='rich'||i%3!==2)&&(!reduced||i%3===0)&&time>=e.launch&&time<e.burst+2.8).slice(-3);}

// Small incidental bursts add distant life without following beats or changing the music score.
export function backgroundScore(duration,seed,main=[]){let s=(seed^0x739ab51)>>>0;const r=()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return s/4294967296;};const events=[];
 for(let planned=4.5+r()*2;planned<Math.min(duration||14400,14400)-1;planned+=6+r()*3){let burst=planned;
 // Nudge incidental bursts into nearby gaps instead of throwing most of them away.
 for(let k=0;k<10&&main.some(m=>Math.abs(m.burst-burst)<.6);k++)burst+=.14;
 const ascent=1.8+r()*.5,depth=-62-r()*8,side=r()<.5?-1:1;
 const e={launch:burst-ascent,burst,ascent,position:[depth*.42+side*(18+r()*8),6.0+r()*1.1,depth],size:6.2+r()*.8,color:r()<.75?0:2,shape:r()<.7?0:1,seed:Math.floor(r()*4294967296),strength:.25,accent:false,background:true};
 if((!events.length||burst-events[events.length-1].burst>4)&&main.every(m=>Math.abs(m.burst-burst)>=.6))events.push(e);
 }return events;
}
// The launcher sits outboard of the machine, bending toward the exact burst center.
export function launchPosition(e,time){const q=Math.max(0,Math.min(1,(time-e.launch)/e.ascent)),side=e.position[0]-e.position[2]*.42<0?-1:1;return[e.position[0]+side*1.5*(1-q)+Math.sin(q*Math.PI)*.22,.3+(e.position[1]-.3)*(1-Math.pow(1-q,1.25)),e.position[2]+(1-q)*.9];}

const fs=require('fs'),path=require('path'),{buildSync}=require('esbuild');
const worker=buildSync({entryPoints:[path.join(__dirname,'firework-analysis-worker.js')],bundle:true,minify:true,format:'iife',target:'es2020',write:false}).outputFiles[0].text;fs.writeFileSync(path.join(__dirname,'firework-worker-source.js'),'export default '+JSON.stringify(worker)+';');
const js=buildSync({stdin:{contents:"import {createFireworks} from './ambient-fireworks.js';window.createCassetteFireworks=createFireworks;",resolveDir:__dirname},bundle:true,minify:true,format:'iife',target:'es2020',write:false}).outputFiles[0].text.replace(/<\/script/gi,'<\\/script');
for(const name of ['index.html','cassette-world.html']){const p=path.join(__dirname,'../outputs',name);let html=fs.readFileSync(p,'utf8');html=html.replace(/<script data-fireworks>[\s\S]*?<\/script>/g,'').replace('</head>','<script data-fireworks>'+js+'</script></head>');
const init='window.cassetteFireworks=window.createCassetteFireworks({scene:Qe,renderer:Q0,camera:VA,audio:FA,getTrack:()=>I0||G.playlist[G.currentTrack],timeSystem:window.cassetteWater.timeSystem});';
html=html.replace('renderer:Q0,audio:FA,getTrack:()=>I0||G.playlist[G.currentTrack],timeSystem:window.cassetteWater.timeSystem','renderer:Q0,camera:VA,audio:FA,getTrack:()=>I0||G.playlist[G.currentTrack],timeSystem:window.cassetteWater.timeSystem');
if(!html.includes(init)){if(!html.includes('window.cassetteWorld='))throw Error('bootstrap missing');html=html.replace('window.cassetteWorld=',init+'window.cassetteWorld=');}
const tick='window.cassetteFireworks?.tick(),window.cassetteWater?.tick(A,Yg';if(!html.includes(tick))html=html.replace('window.cassetteWater?.tick(A,Yg',tick);
fs.writeFileSync(p,html);}
console.log('Built far shore fireworks, retained delivered scene');

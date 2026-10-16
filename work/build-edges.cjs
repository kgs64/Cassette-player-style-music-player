// Narrow patch: preserve delivered scene updates absent from the older full-build baseline.
const fs=require('node:fs'),path=require('node:path');
const files=['index.html','cassette-world.html'].map(n=>path.join(__dirname,'../outputs',n));
const replacements=[
 ['ui=Math.min(devicePixelRatio,be?1.25:1.5)','ui=be?Math.min(devicePixelRatio,1.25):Math.min(2,Math.max(1.25,devicePixelRatio))'],
 ['t.samples=Math.min(4,Q0.capabilities.maxSamples)','t.samples=Math.min(8,Q0.capabilities.maxSamples)']
];
const results=files.map(file=>{let html=fs.readFileSync(file,'utf8');for(const [from,to]of replacements){if(html.includes(to))continue;if(html.split(from).length!==2)throw Error('Unexpected rendering bootstrap: '+from);html=html.replace(from,to);}return html;});
if(results[0]!==results[1])throw Error('Delivered pages differ');files.forEach((f,i)=>fs.writeFileSync(f,results[i]));console.log('Updated desktop edge sampling; preserved delivered scene.');

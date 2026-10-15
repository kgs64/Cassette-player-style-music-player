const fs=require('fs'),path=require('path'),{buildSync}=require('esbuild');
const js=buildSync({stdin:{contents:"import {installInspectorCover} from './inspector-cover.js';installInspectorCover();",resolveDir:__dirname},bundle:true,minify:true,format:'iife',target:'es2020',write:false}).outputFiles[0].text.replace(/<\/script/gi,'<\\/script');
const patches=[
 ['l.append(_),oA&&e(J),mA()}let $=""','l.append(_),oA&&e(J),N()!==$?mA():cA()}let $=""'],
 ['w=J.id,eA(),l.hidden=!1,l.replaceChildren();','w=J.id,l.dataset.trackId=J.id,eA(),l.hidden=!1,l.replaceChildren();'],
 ['_.className="tape-row";let bA=c===','_.className="tape-row",_.dataset.trackId=p.id;let bA=c===']
];
for(const name of ['index.html','cassette-world.html']){const p=path.join(__dirname,'../outputs',name);let html=fs.readFileSync(p,'utf8');for(const [before,after]of patches){if(html.includes(after))continue;if(html.split(before).length!==2)throw Error('Unexpected inspector baseline: '+before);html=html.replace(before,after);}html=html.replace(/<script data-inspector-cover>[\s\S]*?<\/script>/g,'').replace('</body>',`<script data-inspector-cover>${js}</script></body>`);fs.writeFileSync(p,html);}console.log('Updated collection cover presentation.');

const fs=require('fs'),path=require('path');const helper=fs.readFileSync(path.join(__dirname,'cabinet-pages.js'),'utf8');
for(const name of ['index.html','cassette-world.html']){const p=path.join(__dirname,'../outputs',name);let s=fs.readFileSync(p,'utf8');
if(s.includes('id="cabinet-pages"'))s=s.replace(/<script id="cabinet-pages">[\s\S]*?<\/script>/,'');
s=s.replace('</head>','<script id="cabinet-pages">'+helper+'</script></head>');
const old='(g+A.direction+pA.pageCount)%pA.pageCount',updated='globalThis.cassetteCabinetPages.next(G.playlist,Et,g,A.direction,pA.pageSize)';
if(s.includes(old))s=s.replace(old,updated);else if(!s.includes(updated))throw Error('Page handler not found');fs.writeFileSync(p,s);}

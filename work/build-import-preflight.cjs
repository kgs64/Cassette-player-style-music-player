const fs=require('fs'),path=require('path');const root=path.join(__dirname,'..');
const helper=fs.readFileSync(path.join(__dirname,'import-preflight.js'),'utf8');
for(const name of ['index.html','cassette-world.html']){
 const p=path.join(root,'outputs',name);let s=fs.readFileSync(p,'utf8');
 if(s.includes('id="import-preflight"'))s=s.replace(/<script id="import-preflight">[\s\S]*?<\/script>/,'');
 s=s.replace('</head>','<script id="import-preflight">'+helper+'</script></head>');
 const marker='navigator.storage?.persist&&navigator.storage.persist().catch(()=>{});let I=0,C=0,B=0,Q;';
 const replacement='const preflight=globalThis.cassetteImportPreflight.filter(g,G.playlist);g=preflight.pending;const skippedCount=preflight.skipped.length;if(skippedCount)A0(`已跳过 ${skippedCount} 首已导入歌曲 · 待处理 ${g.length} 首`,5000);if(!g.length){if(i.length)await na(i);return}'+marker;
 if(!s.includes('const preflight=globalThis.cassetteImportPreflight')){if(!s.includes(marker))throw Error('Import entry not found');s=s.replace(marker,replacement);}
 fs.writeFileSync(p,s);
}

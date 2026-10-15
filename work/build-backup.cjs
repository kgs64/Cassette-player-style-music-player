// Patch the current delivered page without rebuilding its older scene source.
const fs=require('fs'),path=require('path'),esbuild=require('esbuild');
const root=__dirname;
const js=esbuild.buildSync({stdin:{contents:"import {installBackup} from './archive-backup.js';installBackup();",resolveDir:root},bundle:true,minify:true,format:'iife',target:'es2020',write:false}).outputFiles[0].text.replace(/<\/script/gi,'<\\/script');
for(const name of ['index.html','cassette-world.html']){
 const file=path.join(root,'../outputs',name);let html=fs.readFileSync(file,'utf8');
 html=html.replace(/<script data-collection-backup>[\s\S]*?<\/script>/g,'');
 html=html.replace('</body>',`<script data-collection-backup>${js}</script></body>`);fs.writeFileSync(file,html);
}
console.log('Updated collection backup in both existing web pages.');

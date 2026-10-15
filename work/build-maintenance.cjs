const fs=require('fs'),path=require('path'),esbuild=require('esbuild');const root=__dirname;
const js=esbuild.buildSync({stdin:{contents:"import {installLyricAudit} from './lyric-audit.js';installLyricAudit();",resolveDir:root},bundle:true,minify:true,format:'iife',target:'es2020',write:false}).outputFiles[0].text.replace(/<\/script/gi,'<\\/script');
const replacements=[
 ['return{timed:e.length>0,cues:I}}function Ir',String.raw`return{timed:e.length>0,cues:I,...(I.length&&(t.match(/\[(ti|ar|al):/i))?{metadata:{title:t.match(/\[ti:([^\]\r\n]*)\]/i)?.[1]?.trim()||"",artist:t.match(/\[ar:([^\]\r\n]*)\]/i)?.[1]?.trim()||"",album:t.match(/\[al:([^\]\r\n]*)\]/i)?.[1]?.trim()||""}}:{})}}function Ir`],
 ['function xt(){if(TA)return;','function xt(){if(TA||q0==="cabinet")return;'],
 ['function Il(t,A){TA||Xe||(xt(),Ct("archive"),','function Il(t,A){TA||Xe||(Ct("archive"),']
];
const bridge='window.cassetteMaintenance={async setLyrics(id,lyrics,fileName){if(!zt||Xe||TA)throw Error("设备正在工作，请稍后重试");const track=G.playlist.find(t=>t.id===id);if(!track)throw Error("歌曲已被移除，请重新自检");if(!Array.isArray(lyrics?.cues)||!lyrics.cues.some(c=>c.text?.trim()))throw Error("歌词为空");const record={...track,lyrics,lyricsOrigin:"lrc",lyricsFileName:fileName,lyricStatus:"local",lyricsRead:true,updatedAt:Date.now()};if(!f0.db)throw Error("本地收藏不可用");await f0.putTrack(record);Object.assign(track,record);ze=performance.now();_0();}};';
for(const name of ['index.html','cassette-world.html']){
 const file=path.join(root,'../outputs',name);let html=fs.readFileSync(file,'utf8');
 for(const [before,after]of replacements){if(html.includes(after))continue;if(html.split(before).length!==2)throw Error('Unexpected scene baseline: '+before);html=html.replace(before,after);}
 if(!html.includes('window.cassetteMaintenance=')){if(html.split('window.cassetteWorld=').length!==2)throw Error('Missing scene state');html=html.replace('window.cassetteWorld=',bridge+'window.cassetteWorld=');}
 html=html.replace(/<script data-lyric-audit>[\s\S]*?<\/script>/g,'').replace('</body>',`<script data-lyric-audit>${js}</script></body>`);fs.writeFileSync(file,html);
}
console.log('Updated cabinet camera behavior and lyric audit, retaining delivered scene.');

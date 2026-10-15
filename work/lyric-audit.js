import {ArchiveDB} from './archive.js';
import {parseLyrics,readLyricMetadata,MAX_LYRIC_BYTES} from './lyric-data.js';
const fold=s=>String(s||'').normalize('NFKC').toLocaleLowerCase().replace(/[^\p{L}\p{N}]/gu,'');
const texts=data=>(Array.isArray(data?.cues)?data.cues:[]).map(c=>typeof c?.text==='string'?c.text.trim():'').filter(Boolean);
const content=data=>fold(texts(data).join('\n'));
export function auditLyrics(tracks){
 const results=tracks.map(t=>{const lines=texts(t.lyrics),issues=[];const cues=t.lyrics?.cues;
  const instrumental=t.lyricStatus==='instrumental';
  if(!lines.length&&!instrumental)issues.push({code:'missing',message:'没有可显示的歌词'});
  if(instrumental&&lines.length)issues.push({code:'instrumental-conflict',message:'歌曲标为纯音乐，却保存了歌词，请核对'});
  if(t.lyrics&&(!Array.isArray(cues)||cues.some(c=>!c||typeof c.text!=='string')))issues.push({code:'invalid',message:'歌词数据结构不完整'});
  if(t.lyrics?.timed&&Array.isArray(cues)){
   const times=cues.map(c=>c?.time);if(times.some(n=>!Number.isFinite(n)||n<0)||times.some((n,i)=>i&&n<times[i-1]))issues.push({code:'timeline',message:'时间标签无效或顺序错误'});
   const end=Math.max(...times.filter(Number.isFinite),0);if(Number.isFinite(t.duration)&&t.duration>0&&end>t.duration+Math.max(3,t.duration*.03))issues.push({code:'duration',message:`歌词时间到 ${Math.round(end)} 秒，歌曲仅 ${Math.round(t.duration)} 秒，可能为另一版本`});
  }
  const meta=t.lyrics?.metadata||t.lyricsMatch||{};
  if(meta.title&&fold(meta.title)!==fold(t.title))issues.push({code:'title',message:`歌词标注曲名“${meta.title}”，与歌曲不同`});
  if(meta.artist&&t.artist&&!/unknown|未知/i.test(t.artist)&&fold(meta.artist)!==fold(t.artist))issues.push({code:'artist',message:`歌词标注歌手“${meta.artist}”，与歌曲不同`});
  return {id:t.id,title:t.title,artist:t.artist,album:t.album,issues,instrumental,lines:lines.slice(0,4),origin:t.lyricsOrigin||'未记录',lyrics:t.lyrics};
 });
 const groups=new Map();for(const r of results){const key=content(r.lyrics);if(key.length<80)continue;const group=groups.get(key)||[];group.push(r);groups.set(key,group);}
 for(const group of groups.values())if(new Set(group.map(r=>fold(r.title))).size>1)for(const r of group)r.issues.push({code:'duplicate',message:'与其他歌名的歌曲使用相同歌词，请核对',related:group.filter(x=>x.id!==r.id).map(x=>({id:x.id,title:x.title,artist:x.artist}))});
 return results;
}
export function parseAuditedLrc(text,name){const lyrics=parseLyrics(text);const tag=key=>text.match(new RegExp('\\['+key+':([^\\]\\r\\n]*)\\]','i'))?.[1]?.trim();lyrics.metadata={title:tag('ti')||'',artist:tag('ar')||'',album:tag('al')||'',fileName:name};return lyrics;}
export async function scanLyrics(tracks,{embedded=true,progress=()=>{},cancelled=()=>false}={}){
 const rows=auditLyrics(tracks);
 for(let i=0;i<tracks.length;i++){
  if(cancelled())throw new DOMException('自检已取消','AbortError');const t=tracks[i],r=rows[i];
  if(embedded&&t.audioBlob){const data=await readLyricMetadata(t.audioBlob);const stored=content(t.lyrics),inside=content(data);
   if(inside&&!stored)r.issues.push({code:'embedded-available',message:'音频标签内有歌词，但当前磁带未使用'});
   else if(inside&&stored&&inside!==stored)r.issues.push({code:'embedded-different',message:'保存的歌词与音频内嵌歌词不同，可能为翻译、修订或配错，需人工核对'});
  }
  progress(i+1,tracks.length);await new Promise(r=>setTimeout(r,0));
 }
 return rows;
}
export function mountLyricAudit(host){
 const section=document.createElement('section');section.id='lyric-audit';section.innerHTML='<h3>歌曲歌词自检</h3><p>检查缺失、时间轴和可能错配的歌词；标记只供核对，不自动删除或替换。没有曲名标签的歌词，无法仅凭内容确定属于哪首歌。</p><label style="display:flex;gap:8px"><input type="checkbox" data-embedded checked style="width:auto">对照音频内嵌歌词（逐首读取标签，不解码音频）</label><button type="button" data-scan>开始歌词自检</button> <button type="button" data-stop hidden>取消自检</button><p role="status" aria-live="polite" data-status></p><div hidden data-results><label>显示 <select data-filter><option value="issues">待核对歌曲</option><option value="missing">缺失歌词</option><option value="suspect">可能错配 / 时间异常</option><option value="all">全部歌曲</option></select></label><button type="button" data-report>下载自检报告</button><div data-rows></div></div>';
 host.append(section);const q=s=>section.querySelector(s);let rows=[],tracks=[],scanning=false,cancel=false,target=null;const input=document.createElement('input');input.type='file';input.accept='.lrc,text/plain';input.hidden=true;input.style.display='none';section.append(input);
 const notice=text=>q('[data-status]').textContent=text;
 async function readTracks(){const db=await new ArchiveDB().open();try{return await db.all('tracks');}finally{db.db.close();}}
 function draw(){const mode=q('[data-filter]').value,container=q('[data-rows]');container.replaceChildren();const filtered=rows.filter(r=>mode==='all'||mode==='missing'&&r.issues.some(i=>i.code==='missing')||mode==='suspect'&&r.issues.some(i=>!['missing','embedded-available'].includes(i.code))||mode==='issues'&&r.issues.length);
  for(const r of filtered){const item=document.createElement('details');item.style.cssText='border-top:1px solid #b3b6a5;padding:8px 0';const title=document.createElement('summary');title.textContent=`${r.title} · ${r.artist} — ${r.issues.length?'待核对':r.instrumental?'纯音乐':'未发现异常'}`;item.append(title);for(const issue of r.issues){const p=document.createElement('p');p.textContent=issue.message+(issue.related?'：'+issue.related.map(x=>x.title).join('、'):'');item.append(p);}const text=document.createElement('p');text.style.whiteSpace='pre-wrap';text.textContent='当前歌词节选：\n'+(r.lines.join('\n')||'无');item.append(text);const replace=document.createElement('button');replace.type='button';replace.textContent='为此歌曲导入正确 LRC';replace.onclick=()=>{target=r;input.click();};item.append(replace);container.append(item);}
  if(!filtered.length){const p=document.createElement('p');p.textContent='此分类没有歌曲。';container.append(p);}
 }
 q('[data-filter]').onchange=draw;
 q('[data-scan]').onclick=async()=>{if(scanning)return;scanning=true;cancel=false;q('[data-scan]').disabled=true;q('[data-stop]').hidden=false;q('[data-results]').hidden=true;try{tracks=await readTracks();rows=await scanLyrics(tracks,{embedded:q('[data-embedded]').checked,progress:(n,total)=>notice(`正在检查 ${n} / ${total}`),cancelled:()=>cancel});const missing=rows.filter(r=>r.issues.some(i=>i.code==='missing')).length,suspect=rows.filter(r=>r.issues.some(i=>!['missing','embedded-available'].includes(i.code))).length;notice(`已检查 ${rows.length} 首；缺失 ${missing} 首，待核对匹配或时间轴 ${suspect} 首。纯音乐 ${rows.filter(r=>r.instrumental).length} 首。仅检查本地收藏，不包含未保存的在线歌曲。`);q('[data-results]').hidden=false;draw();}catch(e){notice(e.name==='AbortError'?'已取消，歌曲和歌词未改变。':'自检未完成：'+e.message);}finally{scanning=false;q('[data-scan]').disabled=false;q('[data-stop]').hidden=true;}};
 q('[data-stop]').onclick=()=>{cancel=true;};
 input.onchange=async()=>{const file=input.files[0],row=target;input.value='';if(!file||!row)return;try{if(file.size>MAX_LYRIC_BYTES||!/\.lrc$/i.test(file.name))throw Error('请选择 512 KB 以内的 LRC 文件');const lyrics=parseAuditedLrc(await file.text(),file.name);if(!texts(lyrics).length)throw Error('文件中没有可显示的歌词');const meta=lyrics.metadata;if((meta.title&&fold(meta.title)!==fold(row.title))||(meta.artist&&fold(meta.artist)!==fold(row.artist))){if(!window.confirm(`LRC 标注：${meta.title||'未标曲名'} · ${meta.artist||'未标歌手'}\n目标歌曲：${row.title} · ${row.artist}\n仍要替换此歌曲的歌词吗？`))return;}
   if(!window.cassetteMaintenance?.setLyrics)throw Error('当前页面尚未准备好，请刷新后重试');await window.cassetteMaintenance.setLyrics(row.id,lyrics,file.name);notice(`已更新“${row.title}”的歌词，重新自检可核对结果。`);const t=tracks.find(t=>t.id===row.id);if(t)t.lyrics=lyrics;rows=auditLyrics(tracks);draw();
  }catch(e){notice('歌词未替换：'+e.message);}};
 q('[data-report]').onclick=()=>{const report={checkedAt:new Date().toISOString(),scope:'local-collection',note:'疑似错配需要人工核对；无标签歌词不能确认语义归属',songs:rows.map(({lyrics,...r})=>r)},url=URL.createObjectURL(new Blob([JSON.stringify(report,null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='Cassette-歌词自检.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),60000);};
}
export function installLyricAudit(){const mount=()=>{const host=document.querySelector('#machine-settings article');if(!host)return false;if(!host.querySelector('#lyric-audit'))mountLyricAudit(host);return true;};if(mount())return;const observer=new MutationObserver(()=>{if(mount())observer.disconnect();});observer.observe(document.body,{childList:true,subtree:true});}

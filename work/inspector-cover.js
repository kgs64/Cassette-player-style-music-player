// Collection browser: preserve the original controls and handlers, with independent list/detail scrolling.
export function installInspectorCover(){
 if(document.querySelector('#inspector-cover-style'))return;
 const style=document.createElement('style');style.id='inspector-cover-style';style.textContent=`
 #tape-inspector{width:400px;padding:18px;scrollbar-width:thin;scrollbar-color:#adb3a3 transparent;scroll-padding-top:230px}
 #tape-inspector .collection-top{position:sticky;top:-18px;z-index:4;margin:-18px -18px 0;padding:18px 18px 0;background:#e8e3d5;border-bottom:1px solid #b3b6a5}
 #tape-inspector .collection-top header{position:static;margin:0;padding:0;border:0;background:transparent;gap:12px}
 #tape-inspector .collection-top header button{width:36px;min-height:36px;padding:4px;flex:none}
 #tape-inspector .collection-top h2{font-size:17px;letter-spacing:.02em}
 #tape-inspector .collection-top .hint{font-size:12px;line-height:1.6;margin:8px 0;color:#737b6c}
 #tape-inspector .collection-top input{margin:10px 0;padding:10px 12px}
 #tape-inspector .collection-top nav{margin:0;border:0}
 #tape-inspector .collection-top nav button{font-size:13px;min-height:42px;padding:9px 4px}
 #tape-detail.collection-song{padding:20px 0 18px;margin:0 0 14px;border-bottom:1px solid #b3b6a5}
 #tape-inspector .collection-hero{display:grid;grid-template-columns:112px minmax(0,1fr);gap:16px;align-items:center;margin-bottom:18px}
 #tape-inspector .collection-art{width:112px;aspect-ratio:1;overflow:hidden;background:#d4d3c3;border:1px solid #b4b9a7;border-radius:3px;box-shadow:0 4px 12px #303d3812;position:relative;display:grid;place-items:center}
 #tape-inspector .collection-art img{display:block;width:100%;height:100%;object-fit:cover;position:absolute;inset:0}
 #tape-inspector .collection-record{width:76px;height:76px;border-radius:50%;background:repeating-radial-gradient(circle,#48584c 0 2px,#526053 3px 4px);display:grid;place-items:center;transform:rotate(-15deg)}
 #tape-inspector .collection-record:before{content:'';width:27px;height:27px;border:10px solid #d9cba3;background:#7b8774;border-radius:50%}
 #tape-inspector .collection-kicker{display:block;font:10px/1.5 ui-monospace,monospace;letter-spacing:.15em;color:#7b8373;margin-bottom:7px}
 #tape-inspector .collection-title{font-size:19px;line-height:1.4;overflow-wrap:anywhere;margin:0 0 7px;font-weight:650;color:#2e4037}
 #tape-inspector .collection-artist{font-size:13px;color:#52634f;margin:0 0 4px;overflow-wrap:anywhere}
 #tape-inspector .collection-album{font-size:12px;line-height:1.5;color:#7b806f;margin:0;overflow-wrap:anywhere}
 #tape-detail.collection-song dl{display:grid;grid-template-columns:1fr 1fr;margin:0 0 16px;gap:12px 18px;padding:14px 0;border-top:1px solid #c1c3b4;border-bottom:1px solid #c1c3b4}
 #tape-inspector .collection-field dt{font-size:11px;color:#7d8473;margin-bottom:3px}
 #tape-inspector .collection-field dd{font-size:13px;line-height:1.5;margin:0;overflow-wrap:anywhere}
 #tape-inspector .collection-field[data-wide]{grid-column:1/-1}
 #tape-inspector .collection-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px}
 #tape-detail.collection-song .collection-actions button{margin:0;padding:9px 8px;font-size:13px;min-height:40px}
 #tape-detail.collection-song .collection-actions .collection-back{grid-column:1/-1;background:#3d5549;border-color:#3d5549;color:#f8f3e5}
 #tape-detail.collection-song .collection-actions .collection-delete{grid-column:1/-1;justify-self:start;margin-top:5px;background:transparent;border:0;padding:4px 0;min-height:30px;color:#8a5945;font-size:12px}

 #tape-inspector .song-main img,#tape-inspector .cover-placeholder{width:48px;height:48px;border-radius:2px}
 #tape-inspector .tape-row{padding:8px 0;gap:6px}
 #tape-inspector .song-main{padding:4px 0;gap:11px;text-align:left}
 #tape-inspector .song-info small{max-width:220px}
 @media(max-width:650px){#tape-inspector{width:auto;padding:14px}#tape-inspector .collection-top{top:-14px;margin:-14px -14px 0;padding:14px 14px 0}#tape-inspector .collection-hero{grid-template-columns:92px minmax(0,1fr);gap:12px}#tape-inspector .collection-art{width:92px}#tape-inspector .collection-title{font-size:17px}}

 #tape-inspector{display:flex;flex-direction:column;height:min(880px,calc(100dvh - 36px));overflow:hidden;scroll-padding:0}
 #tape-inspector .collection-top{position:relative;top:auto;flex:none;margin:-18px -18px 0}
 #tape-inspector .collection-top .hint{display:none}
 #tape-inspector .collection-content{display:flex;flex-direction:column;flex:1;min-height:0;overflow:hidden}
 #tape-inspector .collection-browser{flex:1;min-height:150px;overflow:auto;overscroll-behavior:contain;scrollbar-width:thin;padding-right:3px;scrollbar-gutter:stable}
 #tape-inspector #tape-detail.collection-song{flex:0 1 auto;max-height:47%;overflow:auto;overscroll-behavior:contain;scrollbar-width:thin;padding:12px 3px 12px 0;margin:0}
 #tape-inspector .collection-detail-top{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:10px;font-size:11px;color:#7b8373}
 #tape-inspector .collection-detail-top .collection-back{margin:0;padding:3px 7px;min-height:28px;font-size:12px;background:transparent;border-color:transparent;color:#52634f}
 #tape-inspector .collection-hero{grid-template-columns:80px minmax(0,1fr);gap:12px;margin-bottom:10px}
 #tape-inspector .collection-art{width:80px}
 #tape-inspector .collection-record{width:58px;height:58px}
 #tape-inspector .collection-title{font-size:16px;line-height:1.35;margin-bottom:5px}
 #tape-inspector .collection-kicker{display:none}
 #tape-inspector .collection-artist{font-size:12px;margin-bottom:3px}
 #tape-inspector .collection-album{font-size:11px}
 #tape-inspector .collection-metadata summary{font-size:12px;color:#68765f;cursor:pointer;min-height:30px;padding:5px 0}
 #tape-detail.collection-song .collection-metadata dl{padding:10px 0;margin:0 0 8px;gap:8px 14px}
 #tape-inspector .collection-actions{grid-template-columns:1fr 1fr}
 #tape-detail.collection-song .collection-actions button{min-height:34px;font-size:12px;padding:6px}
 #tape-inspector .collection-metadata .collection-delete{border:0;background:transparent;min-height:30px;padding:4px 0;font-size:12px;color:#8a5945}
 #tape-inspector .collection-browser .search-filter{margin:10px 0 6px}
 #tape-inspector .collection-browser #tape-status{margin:7px 0;font-size:11px}
 #tape-inspector .song-main:hover{background:#344c4309}
 #tape-inspector .song-main[aria-current=true]{box-shadow:inset 3px 0 #526b55;background:#344c4310;padding-left:8px}
 @media(max-height:700px){#tape-inspector .collection-top input{margin:6px 0;padding:8px}#tape-inspector #tape-detail.collection-song{max-height:43%}}
 `;document.head.append(style);
 let metadataExpanded=false;
 function enhance(panel){
  if(!panel.querySelector('.collection-top')){const top=document.createElement('div');top.className='collection-top';const children=[...panel.children].filter(e=>e.matches('header,p.hint,input[type=search],nav'));panel.prepend(top);top.append(...children);}
  const detail=panel.querySelector('#tape-detail');if(!detail)return;
  if(!panel.querySelector('.collection-content')){const content=document.createElement('div'),browser=document.createElement('div');content.className='collection-content';browser.className='collection-browser';const others=[...panel.children].filter(e=>!e.classList.contains('collection-top')&&e!==detail);content.append(detail,browser);browser.append(...others);panel.append(content);}
  const opened=!detail.hidden&&detail.childElementCount>0;panel.toggleAttribute('data-detail-open',opened);
  const tape=detail.querySelector('.inspection-tape');
  for(const b of panel.querySelectorAll('#tape-results .song-main')){const chosen=opened&&detail.dataset.trackId&&b.closest('.tape-row')?.dataset.trackId===detail.dataset.trackId;if(chosen){if(b.getAttribute('aria-current')!=='true')b.setAttribute('aria-current','true');}else b.removeAttribute('aria-current');}
  if(!tape)return;
  detail.classList.add('collection-song');const title=tape.querySelector('strong')?.textContent||'未命名歌曲',image=tape.querySelector('img'),dl=detail.querySelector('dl'),fields=[];
  if(dl)for(const dt of [...dl.querySelectorAll('dt')]){const dd=dt.nextElementSibling;if(dd?.tagName==='DD')fields.push({key:dt.textContent,value:dd.textContent,dt,dd});}
  const get=key=>fields.find(f=>f.key===key)?.value||'';
  const hero=document.createElement('div');hero.className='collection-hero';const art=document.createElement('div');art.className='collection-art';const fallback=document.createElement('span');fallback.className='collection-record';fallback.setAttribute('role','img');fallback.setAttribute('aria-label','暂无歌曲封面');art.append(fallback);
  if(image){image.alt=title+' · 歌曲封面';image.loading='eager';image.onerror=()=>image.remove();art.append(image);if(image.complete&&!image.naturalWidth)image.remove();}
  const info=document.createElement('div'),kicker=document.createElement('span');kicker.className='collection-kicker';kicker.textContent='LOCAL COLLECTION';const heading=document.createElement('h3');heading.className='collection-title';heading.textContent=title;
  const artist=document.createElement('p');artist.className='collection-artist';artist.textContent=get('歌手')||'未知歌手';const album=document.createElement('p');album.className='collection-album';album.textContent=get('专辑')||'本地磁带';info.append(kicker,heading,artist,album);hero.append(art,info);tape.replaceWith(hero);
  const metadata=document.createElement('details');metadata.className='collection-metadata';metadata.open=metadataExpanded;metadata.addEventListener('toggle',()=>{metadataExpanded=metadata.open;});const summary=document.createElement('summary');summary.textContent='歌曲信息 · '+[get('时长'),get('格式')].filter(Boolean).join(' / ');metadata.append(summary);
  if(dl){dl.replaceChildren();for(const f of fields){if(['歌手','专辑'].includes(f.key))continue;const cell=document.createElement('div');cell.className='collection-field';if(f.key==='歌词')cell.dataset.wide='';cell.append(f.dt,f.dd);dl.append(cell);}metadata.append(dl);}
  const buttons=[...detail.children].filter(e=>e.tagName==='BUTTON');const actions=document.createElement('div');actions.className='collection-actions';const top=document.createElement('div');top.className='collection-detail-top';const caption=document.createElement('span');caption.textContent='歌曲详情 · 可直接点选下方其他歌曲';top.append(caption);
  buttons.forEach((b,i)=>{if(i===0){b.classList.add('collection-back');b.textContent='收起详情 ×';top.append(b);}else if(b.classList.contains('danger')){b.classList.add('collection-delete');b.textContent='从本地收藏删除…';metadata.append(b);}else actions.append(b);});detail.prepend(top);detail.append(metadata,actions);

 }
 let pending=false,watched=null;
 const update=()=>{pending=false;if(watched)enhance(watched);};
 const observer=new MutationObserver(()=>{if(pending)return;pending=true;queueMicrotask(update);});
 const mount=()=>{const panel=document.querySelector('#tape-inspector');if(!panel)return false;watched=panel;panel.addEventListener('keydown',e=>{const detail=panel.querySelector('#tape-detail');if(e.key==='Escape'&&detail&&!detail.hidden){e.preventDefault();e.stopImmediatePropagation();detail.querySelector('.collection-back')?.click();}},{capture:true});enhance(panel);observer.observe(panel,{childList:true,subtree:true,attributes:true,attributeFilter:['hidden']});return true;};
 if(!mount()){const waiting=new MutationObserver(()=>{if(mount())waiting.disconnect();});waiting.observe(document.body,{childList:true});}
}

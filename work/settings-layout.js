// Reparent existing controls: keep their original listeners, values and persistence.
export function enhanceSettingsLayout(article){
 if(!article||article.dataset.organized)return;article.dataset.organized='true';
 const original=[...article.children],header=article.querySelector('header');
 const nav=document.createElement('nav');nav.className='settings-nav';nav.setAttribute('aria-label','设置分类');
 const body=document.createElement('div');body.className='settings-content';
 const names=['播放与画面','环境与时间','歌词','收藏与保存','在线点歌','使用说明'];
 const groups=names.map((name,i)=>{const section=document.createElement('div');section.id='settings-page-'+i;section.className='settings-page';section.setAttribute('aria-label',name);body.append(section);return section;});

 for(const node of original){if(node===header)continue;let group=0;
  if(node.id==='environment-water-settings')group=1;
  else if(node.id==='lyric-audit'||node.querySelector('[name="lyricPageSize"]'))group=2;
  else if(node.id==='collection-backup'||node.querySelector('[data-choose-folder]'))group=3;
  else if(node.querySelector('[data-online-provider]'))group=4;
  else if(node.id==='quick-guide')group=5;

  groups[group].append(node);
 }
 article.append(nav,body);
 // Archive tools mount after the scene factory returns; route those late sections too.
 const lateSections=new MutationObserver(records=>{for(const record of records)for(const node of record.addedNodes){if(node.nodeType!==1||node.parentElement!==article||node===nav||node===body||node===header)continue;groups[node.id==='lyric-audit'?2:node.id==='collection-backup'?3:5].append(node);}});
 lateSections.observe(article,{childList:true});
 const buttons=names.map((name,i)=>{const button=document.createElement('button');button.type='button';button.textContent=name;button.setAttribute('aria-controls',groups[i].id);button.onclick=()=>select(i);nav.append(button);return button;});
 function select(index){groups.forEach((group,i)=>group.hidden=i!==index);buttons.forEach((button,i)=>button.setAttribute('aria-pressed',String(i===index)));body.scrollTop=0;}
 select(0);
 for(const input of article.querySelectorAll('input[type="range"]')){const output=document.createElement('output');output.className='settings-value';input.parentElement.classList.add('settings-range');input.after(output);const sync=()=>output.value=input.name==='volume'?Math.round(Number(input.value))+'%':Number(input.value).toFixed(2)+'×';input.addEventListener('input',sync);sync();input._settingsValueSync=sync;}
 const panel=article.closest('#machine-settings');
 const observer=new MutationObserver(()=>{if(!panel.hidden)for(const input of article.querySelectorAll('input[type="range"]'))input._settingsValueSync?.();});observer.observe(panel,{attributes:true,attributeFilter:['hidden']});
 // The original focus trap predates category pages; exclude controls in hidden pages.
 panel.addEventListener('keydown',event=>{if(event.key!=='Tab')return;const items=[...panel.querySelectorAll('button:not(:disabled),input:not(:disabled),select:not(:disabled),summary,a[href]')].filter(e=>e.getClientRects().length);const first=items[0],last=items.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}event.stopImmediatePropagation();},true);
 const style=document.createElement('style');style.textContent=`
 #machine-settings article[data-organized]{width:min(760px,100%);height:min(760px,88dvh);max-height:88dvh;display:flex;flex-direction:column;overflow:hidden;padding:0;border-radius:12px;background:#eee9db;font:15px/1.65 system-ui;color:#344039}
 #machine-settings article[data-organized] header{flex:none;padding:18px 24px;border-bottom:1px solid #b8b9a7;background:#e8e2d2;gap:16px}
 #machine-settings article[data-organized] header button{width:40px;min-height:40px;font-size:22px;padding:0}
 #machine-settings .settings-nav{display:flex;flex-wrap:wrap;gap:6px;padding:12px 24px;border-bottom:1px solid #c8c7b5;flex:none}
 #machine-settings .settings-nav button{border-color:transparent;background:transparent;min-height:38px;padding:5px 12px;font-size:14px}
 #machine-settings .settings-nav button[aria-pressed=true]{background:#40564a;color:#faf5e7;border-color:#40564a}
 #machine-settings .settings-content{overflow:auto;overscroll-behavior:contain;padding:8px 24px 24px;flex:1;min-height:0;scrollbar-gutter:stable}
 #machine-settings .settings-page[hidden]{display:none}
 #machine-settings .settings-page>label,#machine-settings .settings-page fieldset>label{grid-template-columns:minmax(125px,1fr) minmax(180px,270px);gap:16px;margin:0;padding:14px 0;border-bottom:1px solid #c7c6b744}
 #machine-settings .settings-page h3{font-size:16px;margin:20px 0 8px;color:#384d40}
 #machine-settings .settings-page section+section{border-top:1px solid #c2c3b1;margin-top:22px;padding-top:4px}
 #machine-settings .settings-page p{line-height:1.75;margin:10px 0 16px;color:#6a705f;font-size:13px;overflow-wrap:anywhere}
 #machine-settings .settings-page fieldset{margin:16px 0;padding:4px 16px 10px;border-color:#babda9;background:#f7f2e540}
 #machine-settings .settings-page legend{font-weight:600;color:#53614c;font-size:14px}
 #machine-settings .settings-page input[type=checkbox]{width:19px;height:19px;justify-self:end;accent-color:#52674f}
 #machine-settings .settings-page input[type=range]{min-width:0;accent-color:#647654}
 #machine-settings .settings-page label.settings-range{grid-template-columns:minmax(125px,1fr) minmax(120px,210px) 46px;gap:12px}
 #machine-settings .settings-value{font:12px/1.5 ui-monospace,monospace;text-align:right;color:#65705c}
 #machine-settings .settings-page select{width:100%;min-width:0;background:#faf6ec}
 #machine-settings .settings-page button{margin:4px 6px 4px 0;font-size:14px;min-height:40px}
 #machine-settings .settings-page input[type=url]{box-sizing:border-box}
 #machine-settings .settings-page #quick-guide{border:0;margin:8px 0;padding:0}
 #machine-settings button:disabled{opacity:.5;cursor:not-allowed}
 @media(max-width:600px){#machine-settings .settings-nav{padding:10px 14px;gap:3px}#machine-settings .settings-nav button{padding:5px 9px}#machine-settings .settings-content{padding:8px 16px 20px}#machine-settings .settings-page>label,#machine-settings .settings-page fieldset>label{grid-template-columns:1fr minmax(130px,50%);gap:10px}#machine-settings .settings-page label.settings-range{grid-template-columns:1fr minmax(90px,35%) 42px}}
 `;document.head.append(style);
}

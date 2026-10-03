import * as THREE from 'three';
import {lyricIndex} from './lyric-data.js';

const THEMES={
 paper:{paper:'#ede7d8',stand:'#bcb8a8',ink:'#655f50',environment:'#696357',metal:'#9c9e95',pixel:false},
 dark:{paper:'#343a38',stand:'#444c49',ink:'#c9c0ac',environment:'#c6bda9',metal:'#92978f',pixel:false},
 future:{paper:'#ced9d3',stand:'#a9bbb4',ink:'#667e73',environment:'#829a8d',metal:'#a5b9b3',pixel:false},
 pixel:{paper:'#e4e0ce',stand:'#878e7d',ink:'#626b57',environment:'#727964',metal:'#909c8c',pixel:true}
};
export function lyricTheme(id){return id==='pixel'?'pixel':id==='orbit'?'future':['night','metro','lagoon','olive','coral','timber'].includes(id)?'dark':'paper';}
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

export function createLyricWorld({props,group,box,rod,ring,interactive,TABLE_TOP,mobile,onDirty}){
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const paper=new THREE.MeshStandardMaterial({color:THEMES.paper.paper,roughness:.96,side:THREE.DoubleSide});
 const stand=new THREE.MeshStandardMaterial({color:THEMES.paper.stand,roughness:.88});
 const metal=new THREE.MeshStandardMaterial({color:THEMES.paper.metal,roughness:.33,metalness:.7});
 const root=group(props,2.4,TABLE_TOP,7.88);root.name='Lyric desk calendar';root.rotation.y=.26;interactive(root,'lyrics');
 box(root,2.50,.07,1.03,0,.035,0,stand,.025);
 for(const x of [-1.12,1.12]){
  rod(root,[x,.085,.43],[x,1.23,-.04],.024,metal);rod(root,[x,1.23,-.04],[x,.085,-.43],.024,metal);
 }
 rod(root,[-1.12,.10,-.40],[1.12,.10,-.40],.024,metal);
 const back=box(root,2.31,1.17,.026,0,.665,-.238,stand,.009);back.rotation.x=.32;
 const hinge=group(root,0,1.205,-.028);hinge.rotation.x=-.40;
 const sheet=new THREE.PlaneGeometry(2.34,1.10,24,12);sheet.translate(0,-.575,0);
 const positions=sheet.attributes.position;for(let i=0;i<positions.count;i++){
  const x=positions.getX(i),y=positions.getY(i),bottom=clamp((-y-.73)/.40,0,1);
  positions.setZ(i,.010+bottom*bottom*(.018+.030*(Math.abs(x)/1.17)**3));
 }sheet.computeVertexNormals();
 const page=new THREE.Mesh(sheet,paper);page.castShadow=page.receiveShadow=true;hinge.add(page);interactive(page,'lyrics');
 const reverse=new THREE.Mesh(sheet.clone(),paper);reverse.position.z=-.012;hinge.add(reverse);
 for(const x of [-.73,.73]){const binding=ring(root,.105,.016,x,1.225,-.026,metal);binding.rotation.y=Math.PI/2;}
 const hit=box(root,2.47,1.19,.035,0,.63,.20,new THREE.MeshBasicMaterial({visible:false}),0);hit.rotation.x=-.40;interactive(hit,'lyrics');
 const environment=group(props,0,0,-7.6);environment.name='Lyrics printed in backdrop space';environment.rotation.set(0,0,0);environment.visible=false;
 const textures=[],ownedMaterials=[],cells=[];
 const pageSize=mobile?768:1024;
 function texture(canvas){const t=new THREE.CanvasTexture(canvas);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;t.minFilter=THREE.LinearMipmapLinearFilter;textures.push(t);return t;}
 function canvas(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return c;}
 function print(c,text,color,{bold=false,page=false,pixel=false}={}){
  let bounds=null;const ctx=c.getContext('2d');ctx.clearRect(0,0,c.width,c.height);
  // Coarse fourfold reduction left only ~13 pixels per background glyph.
  // Preserve a printed dot character without throwing away its letter shapes.
  const scale=pixel?2:1;let target=c,ink=ctx;
  if(pixel){target=canvas(c.width/scale,c.height/scale);ink=target.getContext('2d');}
  const w=target.width,h=target.height,face=pixel?'"Courier New", "Songti SC", monospace':'Baskerville, Georgia, "Songti SC", STSong, serif';ink.textAlign='center';ink.textBaseline='middle';ink.fillStyle=color;
  if(page){
   ink.font=`${Math.round(h*.052)}px ${face}`;ink.globalAlpha=.60;ink.fillText('LYRIC NOTES  /  C—82',w/2,h*.11);ink.globalAlpha=1;
   const rows=wrap(text,ink,w*.85,Math.round(h*.115),pixel).slice(0,3);
   const size=Math.round(h*.115);ink.font=`400 ${size}px ${face}`;
   rows.forEach((row,i)=>ink.fillText(row,w/2,h*.49+(i-(rows.length-1)/2)*size*1.30));
   ink.font=`${Math.round(h*.044)}px ${face}`;ink.globalAlpha=.50;ink.fillText('DOUBLE TAP  /  AMBIENT LYRICS',w/2,h*.90);ink.globalAlpha=1;
  }else{
   let size=h*.66;
   const line=String(text).replace(/\n/g,'  ·  ');ink.font=`400 ${size}px ${face}`;
   while(size>h*.36&&ink.measureText(line).width>w*.94){size-=1;ink.font=`400 ${size}px ${face}`;}
   const clipped=ellipsize(line,ink,w*.94);const width=ink.measureText(clipped).width;bounds={x0:(w-width)/2/w,x1:(w+width)/2/w,y0:.17,y1:.83};ink.fillText(clipped,w/2,h/2);
   // A subpixel ink spread changes weight without changing glyph positions.
   if(bold){ink.lineWidth=.34/scale;ink.strokeStyle=color;ink.strokeText(clipped,w/2,h/2);}
  }
  // Deterministic pinholes suggest paper absorption, not screen grain.
  ink.globalCompositeOperation='destination-out';ink.fillStyle='rgba(0,0,0,.10)';for(let i=0;i<90;i++)ink.fillRect((i*83)%w,(i*47)%h,1,1);ink.globalCompositeOperation='source-over';
  if(pixel){ctx.imageSmoothingEnabled=false;ctx.drawImage(target,0,0,c.width,c.height);}
  return bounds;
 }
 function ellipsize(text,ctx,width){if(ctx.measureText(text).width<=width)return text;let result=text;while(result.length>1&&ctx.measureText(result+'…').width>width)result=result.slice(0,-1);return result===text?result:result+'…';}
 function wrap(text,ctx,width,size,pixel){
  ctx.font=`400 ${size}px ${pixel?'"Courier New", "Songti SC", monospace':'Baskerville, Georgia, "Songti SC", STSong, serif'}`;const rows=[];
  for(const paragraph of String(text).split('\n')){let row='';const tokens=paragraph.match(/[A-Za-z0-9’']+|\s+|./gu)||[];
   for(const token of tokens){if(row.trim()&&ctx.measureText(row+token).width>width){rows.push(row.trim());row='';}if(!row&&/^\s+$/.test(token))continue;
    if(ctx.measureText(token).width>width){for(const ch of Array.from(token)){if(row&&ctx.measureText(row+ch).width>width){rows.push(row.trim());row='';}row+=ch;}}else row+=token;
   }if(row.trim())rows.push(row.trim());
  }if(rows.length>3)rows[2]=ellipsize(rows.slice(2).join(' '),ctx,width);return rows;
 }
 const pageLayers=[0,1].map(i=>{
  const c=canvas(pageSize,pageSize/2),t=texture(c),m=new THREE.MeshBasicMaterial({map:t,transparent:true,depthWrite:false,side:THREE.DoubleSide,toneMapped:false});ownedMaterials.push(m);
  const mesh=new THREE.Mesh(sheet.clone(),m);mesh.position.z=.009+i*.001;mesh.renderOrder=3+i;hinge.add(mesh);return {canvas:c,texture:t,mesh};
 });
 for(let i=0;i<7;i++){
  const cell=group(environment);cell.visible=false;
  const layers=[false,true].map(bold=>{const c=canvas(mobile?1536:2048,mobile?120:160),t=texture(c),m=new THREE.MeshBasicMaterial({map:t,transparent:true,depthWrite:false,toneMapped:false,side:THREE.DoubleSide,opacity:0});ownedMaterials.push(m);const mesh=new THREE.Mesh(new THREE.PlaneGeometry(26,2.03),m);mesh.position.z=bold?.002:0;cell.add(mesh);interactive(mesh,'ambientLyric',i);return {canvas:c,texture:t,mesh,bold};});
  cells.push({root:cell,layers,index:null,text:'',alpha:0,y:0,targetY:0,targetAlpha:0,press:0,hover:false});
 }
 let themeId='paper',theme=THEMES.paper,enabled=false,fade=0,data=null,trackId=null,current=-2,pageText='',oldPageText='',transition=1,bounce=0,pressed=-1,style='studio';
 const state={enabled:false,current:-1,hasLyrics:false,timed:false,theme:'paper',currentText:'',hovered:-1,opacity:0,moving:false};
 function renderPage(layer,text){print(layer.canvas,text,theme.ink,{page:true,pixel:theme.pixel});layer.texture.needsUpdate=true;}
 function pageChange(text){if(text===pageText)return;oldPageText=pageText;pageText=text;renderPage(pageLayers[0],oldPageText);renderPage(pageLayers[1],pageText);transition=reduced?1:0;}
 function paintCell(c){for(const layer of c.layers){const bounds=print(layer.canvas,c.text,theme.environment,{bold:layer.bold,pixel:theme.pixel});if(!layer.bold)c.bounds=bounds;layer.texture.needsUpdate=true;}}
 function reconcile(index){
  const wanted=[];if(data?.cues.length){for(let i=index-2;i<=index+2;i++)if(i>=0&&i<data.cues.length)wanted.push(i);}
  for(const c of cells)if(!wanted.includes(c.index))c.targetAlpha=0;
  for(const i of wanted){let c=cells.find(c=>c.index===i);if(!c){c=cells.filter(c=>!wanted.includes(c.index)).sort((a,b)=>a.alpha-b.alpha)[0];c.index=i;c.text=data.cues[i].text;c.alpha=0;c.y=9.8-(i-index)*1.85-.24;paintCell(c);}
   const distance=Math.abs(i-index);c.targetY=9.8-(i-index)*1.85;c.targetAlpha=distance===0?.28:distance===1?.125:.050;c.root.visible=true;
  }
  pageChange(index>=0?data.cues[index].text:data?.cues.length?'等待这一句开始':'歌词随磁带来到这里\n导入同名 LRC 歌词');
  state.current=index;state.currentText=index>=0?data.cues[index].text:'';
 }
 function setTheme(id){style=id;const next=lyricTheme(id);if(next===themeId)return;themeId=next;theme=THEMES[next];state.theme=next;paper.color.set(theme.paper);stand.color.set(theme.stand);metal.color.set(theme.metal);paper.roughness=next==='future'?.72:.96;renderPage(pageLayers[0],oldPageText);renderPage(pageLayers[1],pageText);for(const c of cells)paintCell(c);onDirty();}
 function setHovered(slot){pressed=slot;state.hovered=slot>=0?cells[slot]?.index??-1:-1;}
 function update(dt,track,time){
  if(trackId!==(track?.id||null)||data!==(track?.lyrics||null)){trackId=track?.id||null;data=track?.lyrics||null;current=-2;setHovered(-1);for(const c of cells){c.index=null;c.alpha=0;c.targetAlpha=0;}state.hasLyrics=!!data?.cues?.length;state.timed=!!data?.timed;}
  const next=lyricIndex(data,time);if(next!==current){current=next;reconcile(next);}
  fade=THREE.MathUtils.damp(fade,enabled?1:0,enabled?2.5:3.0,dt);if(Math.abs(fade-(enabled?1:0))<.001)fade=enabled?1:0;
  environment.visible=fade>.001&&state.hasLyrics;
  transition=Math.min(1,transition+dt/(reduced?.01:.78));const eased=transition*transition*(3-2*transition);
  pageLayers[0].mesh.material.opacity=1-eased;pageLayers[0].mesh.position.y=eased*.045;
  pageLayers[1].mesh.material.opacity=eased;pageLayers[1].mesh.position.y=(1-eased)*-.045;
  if(bounce>0){bounce=Math.max(0,bounce-dt);hinge.rotation.x=-.40+(reduced?0:Math.sin((.7-bounce)*Math.PI*5)*bounce*.035);}else hinge.rotation.x=-.40;
  let active=bounce>0||transition<1||(fade>0&&fade<1);
  for(let i=0;i<cells.length;i++){
   const c=cells[i],target=i===pressed?1:0;c.press=THREE.MathUtils.damp(c.press,target,target?13:8,dt);if(Math.abs(c.press-target)<.002)c.press=target;
   // Keep every line centered on the machine's X axis, without a left offset.
   c.alpha=THREE.MathUtils.damp(c.alpha,c.targetAlpha,4.5,dt);c.y=THREE.MathUtils.damp(c.y,c.targetY,4,dt);c.root.position.set(0,c.y,0);
   // Keep the background quiet under both hover and touch; no scale or offset.
   const alpha=c.alpha*fade*(1+c.press*.27);c.layers[0].mesh.material.opacity=alpha*(1-c.press);c.layers[1].mesh.material.opacity=alpha*c.press;c.root.visible=c.alpha>.001;
   active ||= Math.abs(c.press-target)>.002||Math.abs(c.alpha-c.targetAlpha)>.002||Math.abs(c.y-c.targetY)>.002;
  }
  state.opacity=fade;state.moving=active;state.enabled=enabled;
 }
 function toggle(){enabled=!enabled;state.enabled=enabled;bounce=.7;setHovered(-1);onDirty();return enabled;}
 function setEnabled(value){enabled=!!value;state.enabled=enabled;}
 function isTouchable(slot,uv){const c=cells[slot],b=c?.bounds;return environment.visible&&c?.alpha*fade>.012&&!!b&&(!uv||(uv.x>=b.x0&&uv.x<=b.x1&&uv.y>=b.y0&&uv.y<=b.y1));}
 function dispose(){for(const t of textures)t.dispose();for(const m of [...ownedMaterials,paper,stand,metal])m.dispose();for(const g of [root,environment]){g.traverse(o=>o.geometry?.dispose());g.removeFromParent();}}
 pageChange('歌词随磁带来到这里\n导入同名 LRC 歌词');transition=1;
 return {root,hinge,environment,state,cells,toggle,setEnabled,setTheme,setHovered,isTouchable,update,dispose,get moving(){return state.moving;},get paperMoving(){return bounce>0;}};
}

import * as THREE from 'three';
export function createOnlineTerminalModel({props,group,box,cyl,ring,label,interactive,M,TABLE_TOP,onDirty}){
 const bodyMat=M.cream.clone(),edge=M.metal.clone(),dark=M.dark.clone(),paper=M.paper.clone();bodyMat.metalness=.38;bodyMat.roughness=.42;edge.roughness=.34;
 const lcd=new THREE.MeshStandardMaterial({color:'#ccd798',roughness:.76,emissive:'#aebd78',emissiveIntensity:.13});
 const root=group(props,1.45,TABLE_TOP,4.82);root.rotation.y=.18;root.scale.setScalar(.58);root.name='Pocket flash MP3 player';
 for(const x of [-.78,.78])for(const z of [-1.12,1.12])box(root,.18,.06,.22,x,.03,z,M.rubber,.025);
 interactive(box(root,2.20,.40,2.95,0,.25,0,bodyMat,.17),'terminal');box(root,2.205,.014,2.78,0,.23,0,edge,.08);
 const face=group(root,0,.462,0);face.rotation.x=-Math.PI/2;
 interactive(box(face,2.04,2.77,.045,0,0,0,dark,.13),'terminal');
 box(face,1.94,1.52,.04,0,.57,.036,edge,.06);
 const screen=box(face,1.82,1.40,.016,0,.57,.063,lcd,.035);interactive(screen,'terminal');
 const display=label(face,'♫',.30,.26,0,.57,.075,{color:'#35432d',weight:500,res:256});interactive(display,'terminal');
 const brand=label(face,'C82  /  FLASH',1.18,.048,0,1.359,.032,{color:'#c6c9b8',res:512});
 const controls=group(face,0,-.72,.04),keys={};
 cyl(controls,.49,.022,0,0,0,M.rubber,64);ring(controls,.49,.009,0,0,.018,edge);
 for(const [id,text,x,y,w,h]of [['up','▴',0,.30,.28,.22],['down','▾',0,-.30,.28,.22],['left','◂',-.30,0,.22,.28],['right','▸',.30,0,.22,.28],['confirm','●',0,0,.25,.25]]){
  const key=group(controls,x,y,.048);
  if(id==='confirm'){cyl(key,.137,.044,0,0,0,bodyMat,48);ring(key,.135,.005,0,0,.023,edge);}else box(key,w,h,.042,0,0,0,dark,.065);
  label(key,text,w*.49,h*.40,0,0,.026,{color:id==='confirm'?'#344333':'#d3d7be',weight:500,res:256});interactive(key,'terminalKey',id);key.userData.baseZ=key.position.z;keys[id]=key;
 }
 // Fasteners and engraved grips lie outside every moving key's footprint.
 for(const x of [-.94,.94])for(const y of [-1.31,1.31]){cyl(face,.018,.009,x,y,.03,edge,16);box(face,.024,.003,.003,x,y,.036,M.dark,.001);}
 for(const x of [-.77,.77])for(const y of [-.52,-.59,-.66])box(face,.16,.007,.003,x,y,.029,edge,.001);
 const back=group(face,-.70,-1.12,.047);box(back,.25,.18,.037,0,0,0,dark,.055);label(back,'↩',.15,.10,0,0,.021,{color:'#d3d7be',weight:500,res:256});interactive(back,'terminalKey','back');back.userData.baseZ=back.position.z;keys.back=back;
 const ledMat=new THREE.MeshStandardMaterial({color:'#93a76d',emissive:'#728b43',emissiveIntensity:.12});cyl(face,.028,.015,.78,1.30,.04,ledMat,16);
 box(root,.013,.032,.80,1.106,.13,.10,M.black,.006);
 for(const z of [-.65,-.43,-.21])box(root,.012,.10,.08,1.105,.27,z,M.rubber,.006);
 box(root,.012,.11,.36,-1.104,.24,.65,M.black,.014);
 const card=group(root,1.12,.13,.10);card.visible=false;box(card,1.22,.016,.85,.51,0,0,paper,.018);const cardTarget=label(card,'点歌卡',1.10,.70,.51,.012,0,{res:768,color:'#655c49'});cardTarget.rotation.x=-Math.PI/2;interactive(card,'onlineCard');
 const state={phase:'idle',lastTitle:'',selection:0,cardId:null,focused:false};let extension=0,target=0,lastText='',pressUntil={};
 function phase(value,title){state.phase=value;if(title)state.lastTitle=title;const connection={searching:'正在查找',connecting:'正在连接',playing:'正在播放',ready:'连接就绪',error:'连接失败',empty:'未找到歌曲'}[value]||'待机';const titleLine=state.lastTitle?(state.lastTitle.length>24?state.lastTitle.slice(0,23)+'…':state.lastTitle):'搜索歌曲';const text='♫';if(text!==lastText){display.userData.setText(text);lastText=text;}ledMat.emissiveIntensity=value==='playing'?.35:.08;}
 function selected(track,index){state.selection=index;state.cardId=track.provider+':'+track.id;cardTarget.userData.setText('ONLINE / 点歌卡\n'+track.title+'\n'+track.artist+'\n点击变带装入');card.visible=true;cardTarget.visible=false;extension=0;target=1;onDirty();}
 function tick(dt){const before=extension;extension=THREE.MathUtils.damp(extension,target,10,dt);if(Math.abs(extension-target)<.002)extension=target;card.position.x=.55+extension*.65;cardTarget.visible=extension>.96;let moving=Math.abs(extension-before)>.001;for(const [id,k]of Object.entries(keys)){const z=k.userData.baseZ-(performance.now()<(pressUntil[id]||0)?.015:0);const old=k.position.z;k.position.z=THREE.MathUtils.damp(old,z,35,dt);moving ||= Math.abs(old-k.position.z)>.0002;}if(moving)onDirty();return moving;}
 function setStyle(){bodyMat.color.copy(M.cream.color);dark.color.copy(M.dark.color);edge.color.copy(M.metal.color);bodyMat.roughness=Math.max(.4,M.silver.roughness);onDirty();}
 function setFocused(value){state.focused=value;display.visible=!value;}
 function corners(){return [[-.91,1.27,.077],[.91,1.27,.077],[-.91,-.13,.077]].map(p=>face.localToWorld(new THREE.Vector3(...p)));}
 phase('idle');return {root,face,screen,display,keys,card,cardTarget,state,phase,selected,tick,setStyle,setFocused,corners,press(id){pressUntil[id]=performance.now()+160;onDirty();},get moving(){return Math.abs(extension-target)>.002;}};
}

import {decorateTape} from './tape-art.js';
import * as THREE from 'three';
export function createRecorder({parent,group,box,cyl,ring,label,interactive,M,cassette,disposeGroup}){
 const root=group(parent,-.35,1.98,-.30),state={phase:'idle',progress:0,trackId:null},reels=[];let output=null;
 for(const x of [-1.8,1.8])for(const z of [-.63,.63])box(root,.22,.10,.22,x,.05,z,M.rubber);
 interactive(box(root,4.3,.94,1.9,0,.57,0,M.cream,.065),'recorderFocus');interactive(box(root,4.1,.08,1.72,0,1.08,0,M.metal,.025),'recorderFocus');
 const panel=box(root,3.94,.68,.08,0,.6,.98,M.dark,.024);interactive(panel,'recorderFocus');
 const display=label(root,'READY / IMPORT AUDIO',3.45,.18,0,.79,1.032,{mono:true,color:'#d6dfad',bg:'#303c32',res:512});
 const key=box(root,.77,.24,.13,-1.52,.40,1.09,M.orange,.025);interactive(key,'recorderImport');label(key,'IMPORT',.67,.12,0,0,.076,{mono:true,res:384,weight:800});
 interactive(box(root,2.38,.17,.12,.50,.41,1.04,M.black,.02),'recorderFocus');interactive(box(root,2.50,.035,1.05,.50,.275,1.55,M.metal,.012),'recorderFocus');
 for(const x of [-.65,.65]){const g=group(root,x,.28,-.03);g.position.y=1.13;g.rotation.x=-Math.PI/2;const reel=cyl(g,.30,.065,0,0,0,M.dark,24);for(let i=0;i<3;i++){const spoke=box(g,.055,.29,.06,0,.14,.035,M.chrome,.01);spoke.rotation.z=i*Math.PI*2/3;}reels.push(g);}
 label(root,'C—REC  /  MP3 192',2.9,.068,0,.988,.979,{mono:true,res:256});
 const meter=box(root,3.35,.025,.025,0,.64,1.04,M.orange,.003);meter.scale.x=.001;
 const save=box(root,.75,.2,.08,-1.52,.09,1.11,M.dark,.01);interactive(save,'recorderSave');label(save,'MP3 ↓',.62,.13,0,0,.05,{mono:true,color:'#f4f0dc',res:384,weight:800});
 const folder=box(root,.94,.10,.48,-1.48,1.16,-.12,M.orange,.02);interactive(folder,'recorderFolder');const folderLabel=label(folder,'FOLDER',.82,.24,0,.06,0,{mono:true,res:256});folderLabel.rotation.x=-Math.PI/2;
 function clear(){if(output){output.removeFromParent();disposeGroup(output);output=null;}state.trackId=null;state.phase='idle';state.progress=0;meter.scale.x=.001;meter.position.x=-1.675;display.userData.setText('READY / IMPORT AUDIO');}
 function makeOutput(track,index){clear();state.trackId=track.id;output=cassette(root,track.title,track.labelStyle||'#c9b779',.34);decorateTape(output,track);output.rotation.x=-Math.PI/2;output.position.set(.50,.41,.38);interactive(output,'recorderTape',index);return output;}
 function progress(fraction,phase){state.phase=phase.toLowerCase();state.progress=fraction;meter.scale.x=Math.max(.001,fraction);meter.position.x=-1.675+1.675*meter.scale.x;display.userData.setText(['ENCODING','DECRYPTING'].includes(phase)?`${phase==='ENCODING'?'WRITING MP3':'READING TAPE'} / ${Math.floor(fraction*100)}%`:phase);}
 function tick(dt,now){const working=['decoding','encoding','reading','decrypting','finishing'].includes(state.phase);if(working)for(const reel of reels)reel.rotation.z-=dt*3.5;return working;}
 function ready(){state.phase='ready';display.userData.setText('READY / TAP TAPE TO SAVE MP3');}
 function fail(message){state.phase='error';display.userData.setText(message.slice(0,30));}
 return {root,state,display,key,save,folder,reels,makeOutput,clear,progress,tick,ready,fail,get output(){return output;}};
}

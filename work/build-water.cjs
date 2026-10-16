const fs=require('fs'),path=require('path'),{buildSync}=require('esbuild');
const root=__dirname;
const js=buildSync({stdin:{contents:"import {createAmbientWater} from './ambient-water.js';window.createCassetteWater=createAmbientWater;",resolveDir:root},bundle:true,minify:true,format:'iife',target:'es2020',write:false}).outputFiles[0].text.replace(/<\/script/gi,'<\\/script');
const oldInit='window.cassetteWater=window.createCassetteWater({scene:Qe,ground:Gw,base:kw,PlaneGeometry:We});';
const init='window.cassetteWater=window.createCassetteWater({scene:Qe,ground:Gw,base:kw,camera:VA,renderer:Q0,types:{Mesh:B0,Group:gg,PlaneGeometry:We,ShaderMaterial:ne,WebGLRenderTarget:ue,DepthTexture:qI,Vector3:F,Vector4:Ee,Matrix4:kw.matrix.constructor,Plane:wt}});';
const before='JE[0].rotation.z=1.05-iC*2.05',after='window.cassetteWater?.tick(A,Yg,Math.max(iC,cB),G.playing,G.muted?0:G.volume),'+before;
const files=['index.html','cassette-world.html'].map(name=>path.join(root,'../outputs',name));
const results=files.map(file=>{
 let html=fs.readFileSync(file,'utf8');if(html.includes(oldInit))html=html.replace(oldInit,init);
 html=html.replace('window.cassetteWater?.tick(A,Yg,Math.max(iC,cB),G.playing),','window.cassetteWater?.tick(A,Yg,Math.max(iC,cB),G.playing,G.muted?0:G.volume),');
 if(!html.includes(init)){if(html.split('window.cassetteWorld=').length!==2)throw Error('Unexpected scene bootstrap');html=html.replace('window.cassetteWorld=',init+'window.cassetteWorld=');}
 if(!html.includes(after)){if(html.split(before).length!==2)throw Error('Unexpected audio envelope');html=html.replace(before,after);}
 const oldState='environment:{water:window.cassetteWater?.state},rendering:{...Eh.state,';
 const previousState='environment:{water:window.cassetteWater?.state,snow:window.cassetteWater?.snow.state},rendering:{...Eh.state,';
 const state='environment:{water:window.cassetteWater?.state,snow:window.cassetteWater?.snow.state,time:window.cassetteWater?.timeSystem.state},rendering:{...Eh.state,';
 html=html.replace(previousState,state);
 html=html.replace(oldState,state);
 if(!html.includes(state)){if(html.split('rendering:{...Eh.state,').length!==2)throw Error('Unexpected rendering state');html=html.replace('rendering:{...Eh.state,',state);}
 html=html.replace(/<script data-ambient-water>[\s\S]*?<\/script>/g,'').replace('</head>',`<script data-ambient-water>${js}</script></head>`);
 return html;
});
if(results[0]!==results[1])throw Error('Delivered pages differ; inspect before updating');
files.forEach((file,i)=>fs.writeFileSync(file,results[i]));console.log('Built ambient water; retained current delivered scene.');

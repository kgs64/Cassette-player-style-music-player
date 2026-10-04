import {createPreferenceCards} from './preference-cards.js';
import {createStoredZip} from './zip-store.js';
import {createPlaybackLists} from './playback-lists.js';
import {createOnlineTerminalModel} from './online-terminal-model.js';
import {createOnlineTerminal} from './online-terminal.js';
import {safeOnlineUrl} from './online-music.js';
import {createLyricLookup} from './lyric-fetch.js';
import {planCabinetOrder,flatCabinetSlot} from './archive-order.js';
import {createLensOptics} from './lens-optics.js';
import {createLensMotion} from './lens-motion.js';
import {createSettings} from './settings.js';
import {createMagnifier} from './magnifier.js';
import {decorateTape} from './tape-art.js';
import {LocalAlbums} from './local-albums.js';
import {unlockAudioFile,loadImportKeys,keyFile,encryptedFile} from './music-import.js';
import {tagMp3} from './mp3-tags.js';
import {readExtendedMetadata} from './metadata.js';
import {ArchiveDB,DRAWERS,assignSlot,albumKey,fingerprint,normalizeTrack} from './archive.js';
import {createRecorder} from './recorder.js';
import {transcodeMp3} from './mp3-transcoder.js';
import {createCabinet} from './cabinet.js';
import * as THREE from 'three';
import {MACHINE_STYLES,AD_COLLECTIONS,getMachineStyle,FOCUS_AREAS,fitFocusDistance} from './styles.js';
import {tapeRadii,updateRibbon} from './routing.js';
import {FRONT_FASTENERS,LADDER_SUPPORT,ladderPose} from './housing.js';
import {smoothTapeMotion} from './drag-motion.js';
import {buildFigure,FIGURE_PLACEMENT,CLIMBER} from './figures.js';
import {springStep,OPEN_ANGLE,KEY_REST,KEY_TRAVEL} from './physics.js';
import {selectorIndex,insideTapeZone,rotatePaperOrder,PAPER_STEP,PAPER_THICKNESS,TABLE_TOP} from './interaction.js';
import {createFoley} from './foley.js';
import {createLyricWorld} from './lyric-world.js';
import {parseLyrics,matchLyricTrack,MAX_LYRIC_BYTES,readLyricMetadata,lyricStem} from './lyric-data.js';
import {createStudioRendering} from './studio-rendering.js';
import {createStudioOcclusion} from './studio-occlusion.js';
import {AUDIO_ACCEPT,AUDIO_EXTENSIONS,acceptsAudio,prepareAudio} from './audio-formats.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { BokehPass } from 'three/addons/postprocessing/BokehPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const wallpaperMode=/CassetteWallpaper/i.test(navigator.userAgent);
window.__wallpaperInactive=window.__wallpaperInactive??false;
window.__wallpaperSleeping=window.__wallpaperSleeping??false;
const mobile = matchMedia('(pointer: coarse)').matches;
const device={isMobile:mobile,isTouch:navigator.maxTouchPoints>0,isIOS:/iPad|iPhone|iPod/.test(navigator.userAgent)||(/Mac/.test(navigator.platform)&&navigator.maxTouchPoints>1)};
let bootReady=false,qualityRatio=Math.min(devicePixelRatio,mobile?1.25:1.5);
const canvas = document.querySelector('#world');
const renderer = new THREE.WebGLRenderer({canvas, antialias:true, alpha:false,powerPreference:'low-power'});
renderer.setPixelRatio(wallpaperMode?1:qualityRatio);
renderer.setSize(innerWidth,innerHeight);
renderer.shadowMap.enabled=true;renderer.shadowMap.autoUpdate=false;renderer.info.autoReset=false;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.0;
const scene = new THREE.Scene(); scene.background=new THREE.Color('#eeede7');scene.fog=new THREE.Fog('#eeede7',45,85);
const camera=new THREE.PerspectiveCamera(39,innerWidth/innerHeight,.3,120);
const homePosition=new THREE.Vector3(11,12,26);if(innerWidth/innerHeight<.85)homePosition.set(5,12,Math.max(32,34/camera.aspect));
camera.position.copy(homePosition).multiplyScalar(1.08);
const controls=new OrbitControls(camera,canvas);controls.target.set(0,3.2,0);controls.enableDamping=true;controls.dampingFactor=.065;controls.minDistance=8;controls.maxDistance=innerWidth/innerHeight<.85?80:48;controls.minPolarAngle=.28;controls.maxPolarAngle=Math.PI/2-.025;controls.enablePan=true;controls.screenSpacePanning=true;controls.enabled=!wallpaperMode;controls.enableZoom=!wallpaperMode;
controls.mouseButtons={LEFT:THREE.MOUSE.ROTATE,MIDDLE:THREE.MOUSE.DOLLY,RIGHT:THREE.MOUSE.PAN};
const hemisphere=new THREE.HemisphereLight(0xf4f4ec,0xaba699,.8);scene.add(hemisphere);
const key=new THREE.DirectionalLight(0xfff6e5,2.3);key.position.set(-10,18,12);key.castShadow=true;key.shadow.mapSize.set(wallpaperMode||mobile?1024:2048,wallpaperMode||mobile?1024:2048);Object.assign(key.shadow.camera,{left:-16,right:16,top:16,bottom:-16,near:1,far:50});key.shadow.bias=-.00025;key.shadow.normalBias=.025;key.shadow.radius=5;scene.add(key);
const rim=new THREE.DirectionalLight(0xe7f0fa,.85);rim.position.set(8,12,-9);scene.add(rim);
const studioRendering=createStudioRendering({renderer,scene,key,rim,hemisphere,mobile,wallpaperMode});
let composer=null,bokeh=null,renderQuality=0;
function destroyComposer(){if(!composer)return;for(const pass of composer.passes)pass.dispose?.();composer.dispose();composer=null;bokeh=null;}
function setRenderQuality(value){const next=value===1&&!mobile&&!wallpaperMode?1:0;if(next!==renderQuality){destroyComposer();renderQuality=next;}renderer.shadowMap.needsUpdate=true;}
function createFocusComposer(){composer=new EffectComposer(renderer);for(const target of [composer.renderTarget1,composer.renderTarget2])target.samples=Math.min(4,renderer.capabilities.maxSamples);composer.addPass(new RenderPass(scene,camera));if(renderQuality)composer.addPass(createStudioOcclusion(scene,camera,innerWidth,innerHeight));bokeh=new BokehPass(scene,camera,{focus:25,aperture:.000018,maxblur:.003});bokeh.enabled=false;composer.addPass(bokeh);composer.addPass(new OutputPass());}
const mat=(c,r=.6,m=0,more={})=>new THREE.MeshStandardMaterial({color:c,roughness:r,metalness:m,...more});
const M={silver:mat('#b6bcb8',.42,.35),edge:mat('#d1d4cf',.38,.44),cream:mat('#e4e0d2',.64),dark:mat('#303735',.68),black:mat('#131b1c',.74),rubber:mat('#232929',.92),metal:mat('#8c9590',.32,.78),chrome:mat('#cad0c8',.22,.86),orange:mat('#bc582c',.55),red:mat('#853d30'),pcb:mat('#3e6555',.7),copper:mat('#bd9a60',.4,.67),paper:mat('#e6dfc9',.87),glass:mat('#929f98',.15,.08,{transparent:true,opacity:.15,depthWrite:false}),smoke:mat('#495d55',.24,.15,{transparent:true,opacity:.2,depthWrite:false}),tape:mat('#372b22',.62,.08),green:mat('#9eae75',.6,0,{emissive:'#4c582a',emissiveIntensity:.18})};
studioRendering.finishMaterials(M);
const model=new THREE.Group();scene.add(model);const props=new THREE.Group();scene.add(props);
const parts=[],hits=[],gears=[],reels=[],cones=[],people=[],lamps=[],buttons={},knobs={},eqSliders=[];
let uid=0;
function group(parent,x=0,y=0,z=0){const g=new THREE.Group();g.position.set(x,y,z);parent.add(g);return g;}
function box(parent,w,h,d,x,y,z,material=M.silver,round=.035){const geo=round?new RoundedBoxGeometry(w,h,d,2,Math.min(round,w/3,h/3,d/3)):new THREE.BoxGeometry(w,h,d);const mesh=new THREE.Mesh(geo,material);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;}
function cyl(parent,r,h,x,y,z,material=M.metal,segments=40,axis='z'){const mesh=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,segments),material);if(axis==='z')mesh.rotation.x=Math.PI/2;mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;}
function ring(parent,r,t,x,y,z,material=M.dark){const mesh=new THREE.Mesh(new THREE.TorusGeometry(r,t,10,72),material);mesh.position.set(x,y,z);mesh.castShadow=true;parent.add(mesh);return mesh;}
function ball(parent,r,x,y,z,material){const mesh=new THREE.Mesh(new THREE.SphereGeometry(r,16,12),material);mesh.position.set(x,y,z);mesh.castShadow=true;parent.add(mesh);return mesh;}
function rod(parent,a,b,r,material=M.metal){a=new THREE.Vector3(...a);b=new THREE.Vector3(...b);const mesh=new THREE.Mesh(new THREE.CylinderGeometry(r,r,a.distanceTo(b),10),material);mesh.position.copy(a).add(b).multiplyScalar(.5);mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),b.sub(a).normalize());mesh.castShadow=true;parent.add(mesh);return mesh;}
function pathTube(parent,pts,r,material,closed=false){const curve=new THREE.CatmullRomCurve3(pts.map(p=>new THREE.Vector3(...p)),closed);const m=new THREE.Mesh(new THREE.TubeGeometry(curve,80,r,6,closed),material);m.castShadow=true;m.userData.path=curve;parent.add(m);return m;}
function label(parent,text,w,h,x,y,z,opt={}){
 const c=document.createElement('canvas');
 // Size the print from its physical width. This keeps small switches legible
 // without turning every wide decorative label into a large GPU texture.
 c.width=Math.min(mobile?1024:1536,Math.max(opt.res||0,Math.ceil(w*(mobile?240:340)),256));
 c.height=Math.max(96,Math.round(c.width*h/w));
 const ctx=c.getContext('2d',{alpha:true}),padding=Math.max(8,Math.round(c.width*.018));let currentText=text;
 function font(size){return `${opt.weight||(opt.mono?700:700)} ${Math.max(10,Math.round(size))}px ${opt.mono?'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace':'Arial, Helvetica Neue, sans-serif'}`;}
 function fitted(value,base,maxWidth){let size=base;ctx.font=font(size);while(size>base*.72&&ctx.measureText(value).width>maxWidth){size-=2;ctx.font=font(size);}if(ctx.measureText(value).width<=maxWidth)return {value,size};let out=value;while(out.length>2&&ctx.measureText(out+'…').width>maxWidth)out=out.slice(0,-1);return {value:out+'…',size};}
 function paint(value){ctx.clearRect(0,0,c.width,c.height);if(opt.bg){ctx.fillStyle=opt.bg;ctx.fillRect(0,0,c.width,c.height);}const color=opt.color||'#26312e',rows=String(value).split('\n'),base=c.height/(rows.length+.42),maxWidth=c.width-padding*2;ctx.textAlign=opt.align||'center';ctx.textBaseline='middle';ctx.lineJoin='round';ctx.fontKerning='normal';for(const [i,row]of rows.entries()){const fit=fitted(row,base,maxWidth),xx=opt.align==='left'?padding:c.width/2,yy=c.height*(i+.5)/rows.length;ctx.font=font(fit.size);ctx.lineWidth=Math.max(1,fit.size*.026);ctx.strokeStyle=opt.outline||(/^(#(?:[d-f]|[89a-f][0-9a-f]))/i.test(color)?'rgba(20,28,25,.28)':'rgba(255,255,240,.24)');ctx.strokeText(fit.value,xx,yy);ctx.fillStyle=color;ctx.fillText(fit.value,xx,yy);}}
 paint(text);const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=Math.min(renderer.capabilities.getMaxAnisotropy(),mobile?4:8);texture.minFilter=THREE.LinearMipmapLinearFilter;texture.magFilter=THREE.LinearFilter;
 const material=new THREE.MeshBasicMaterial({map:texture,transparent:true,depthWrite:false,toneMapped:false,side:THREE.DoubleSide,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1});const mesh=new THREE.Mesh(new THREE.PlaneGeometry(w,h),material);mesh.position.set(x,y,z);parent.add(mesh);mesh.userData.setText=t=>{if(currentText===t)return;currentText=t;paint(t);texture.needsUpdate=true;};mesh.userData.setInk=color=>{if(opt.color===color)return;opt.color=color;paint(currentText);texture.needsUpdate=true;};return mesh;
}
function screw(parent,x,y,z,s=.075){cyl(parent,s,.035,x,y,z,M.metal,16);const slit=box(parent,s*1.25,.014,.013,x,y,z+.025,M.dark,0);slit.rotation.z=.35;}
function housingScrew(parent,x,y,z){cyl(parent,.058,.024,x,y,z,M.metal,24);for(const angle of [.3,Math.PI/2+.3]){const slot=box(parent,.068,.009,.002,x,y,z+.013,M.dark,0);slot.rotation.z=angle;}}
function part(name,x,y,z,dx,dy,dz){const g=group(model,x,y,z);g.userData.part={id:++uid,name,base:g.position.clone(),offset:new THREE.Vector3(dx,dy,dz)};parts.push(g);return g;}
function interactive(object,kind,value){object.userData.action={kind,value};return object;}
function halo(parent,w,h,x,y,z){return box(parent,w,h,.008,x,y,z,M.dark,.025);}

// The photography plinth is the entire world. No screen-space interface.
const ground=box(scene,200,.1,200,0,-.4,0,mat('#e9e6dc',.95),0);
const base=box(scene,22.2,.5,18.4,1.9,-.08,.1,mat('#e4e1d6',.87),.15);
const contactCanvas=document.createElement('canvas');contactCanvas.width=contactCanvas.height=128;
const contactContext=contactCanvas.getContext('2d'),contactGradient=contactContext.createRadialGradient(64,64,2,64,64,64);contactGradient.addColorStop(0,'rgba(42,39,31,1)');contactGradient.addColorStop(1,'rgba(42,39,31,0)');contactContext.fillStyle=contactGradient;contactContext.fillRect(0,0,128,128);
const contactTexture=new THREE.CanvasTexture(contactCanvas);contactTexture.colorSpace=THREE.SRGBColorSpace;
function contact(x,z,sx,sz,opacity=.2){const p=new THREE.Mesh(new THREE.PlaneGeometry(sx,sz),new THREE.MeshBasicMaterial({map:contactTexture,transparent:true,depthWrite:false,opacity,toneMapped:false}));p.rotation.x=-Math.PI/2;p.position.set(x,.18,z);p.renderOrder=1;scene.add(p);return p;}
contact(0,.1,18,8,.3);
const basePlaque=box(props,4.55,.03,.76,-4.8,.195,-3.7,M.paper,.025);const baseTitle=label(props,'CASSETTE WORLD   /   C—82',4.15,.2,-4.8,.217,-3.84,{weight:700});baseTitle.rotation.x=-Math.PI/2;
const baseFine=label(props,'A MINIATURE ANALOG MUSIC MACHINE',4.1,.1,-4.8,.219,-3.55,{mono:true});baseFine.rotation.x=-Math.PI/2;

// A split shell, including working front apertures and a serviced rear panel.
const chassis=part('01 · ALUMINIUM CHASSIS',0,1.02,0,0,0,0);box(chassis,13.7,.22,2.8,0,0,0,M.dark,.075);
for(const x of [-5.8,5.8])for(const z of [-.83,.83])box(chassis,1.05,.67,.63,x,-.49,z,M.rubber,.09);
const shell=part('02 · INJECTION-MOULDED FRONT',0,4.13,1.34,0,-2.15,4.1);
const frontShape=new THREE.Shape();frontShape.moveTo(-7,-3);frontShape.lineTo(7,-3);frontShape.lineTo(7,3);frontShape.lineTo(-7,3);frontShape.closePath();
for(const x of [-4.7,4.7]){const h=new THREE.Path();h.absarc(x,-.55,2.03,0,Math.PI*2,true);frontShape.holes.push(h);}
const hole=new THREE.Path();hole.moveTo(-2.15,-2.1);hole.lineTo(-2.15,1.05);hole.lineTo(2.15,1.05);hole.lineTo(2.15,-2.1);hole.closePath();frontShape.holes.push(hole);
// Apertures allow caps, meter modules and shafts to pass through the fascia.
function cutRectangle(x0,y0,x1,y1){const h=new THREE.Path();h.moveTo(x0,y0);h.lineTo(x0,y1);h.lineTo(x1,y1);h.lineTo(x1,y0);h.closePath();frontShape.holes.push(h);}
cutRectangle(-2.18,-2.85,2.18,-2.28);cutRectangle(-1.96,1.17,1.96,2.55);cutRectangle(2.81,1.57,6.46,2.68);
for(const [x,y,r]of [[-5.62,1.96,.43],[-4.35,1.99,.28],[-3.43,1.99,.28]]){const h=new THREE.Path();h.absarc(x,y,r,0,Math.PI*2,true);frontShape.holes.push(h);}
const face=new THREE.Mesh(new THREE.ExtrudeGeometry(frontShape,{depth:.19,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:.03,bevelThickness:.045}),M.silver);face.castShadow=true;face.receiveShadow=true;shell.add(face);interactive(face,'focus');
for(const y of [-2.89,2.86])box(shell,13.7,.045,.045,0,y,.265,M.edge,.015);
for(const [x,y]of FRONT_FASTENERS)ring(shell,.074,.010,x,y,.241,M.dark);
label(shell,'CASSETTE',2.44,.24,-5.22,2.73,.265,{weight:800});label(shell,'WORLD',1.46,.095,-5.7,2.49,.266,{weight:600});
const modelBadge=label(shell,'C—82',1.6,.2,5.7,2.80,.266,{weight:700});

for(const x of [-4.7,4.7]){label(shell,'2-WAY SPEAKER SYSTEM',3,.12,x,-2.78,.27,{mono:true});label(shell,'8Ω     /     15W',1.3,.11,x,-2.54,.27,{mono:true});}
const rear=part('03 · REAR ENCLOSURE',0,4.12,-1.34,.25,.3,-3);box(rear,14,6,.24,0,0,0,M.dark,.12);
for(const [x,y]of FRONT_FASTENERS){const sg=group(rear,x,y,-.128);sg.rotation.y=Math.PI;housingScrew(sg,0,0,0);}
for(let i=0;i<35;i++)box(rear,.15,1.2,.05,-5.7+i*.33,1.42,-.15,M.black,.02);
const rearName=label(rear,'CASSETTE SYSTEM C-82\nDC 9V  ·  6 × R20 / D\nSERIAL 008417\nMADE FOR CASSETTE WORLD',3.8,1.05,2.8,-.25,-.145,{bg:'#b1b5a9',mono:true});rearName.rotation.y=Math.PI;
const service=label(rear,'SERVICE 08.17.92\nINSPECTED  /  OK',1.5,.45,-4.8,-1.9,-.15,{bg:'#d6bf85',mono:true});service.rotation.y=Math.PI;
const battery=part('04 · BATTERY COMPARTMENT',-2.5,2.75,-1.52,-1.7,-.3,-3.6);box(battery,5.5,1.6,.12,0,0,0,M.rubber,.08);const batText=label(battery,'BATTERY  /  OPEN →',3,.14,0,0,-.075,{color:'#92968c',mono:true});batText.rotation.y=Math.PI;
for(let i=0;i<6;i++){const b=cyl(battery,.28,1.3,-2.1+i*.84,0,.5,M.dark,20,'y');label(battery,'R20',.27,.12,-2.1+i*.84,0,.81,{color:'#b8ad83'});cyl(battery,.21,.035,-2.1+i*.84,.67,.5,M.copper,20,'y');}
const top=part('05 · TOP COVER',0,7.03,0,0,2.1,-.1);box(top,14.13,.25,2.97,0,0,0,M.edge,.085);
for(const x of [-6.67,6.67])for(const z of [-1.11,1.11]){const mount=group(top,x,.133,z);mount.rotation.x=-Math.PI/2;housingScrew(mount,0,0,0);}
const leftside=part('06 · LEFT SIDE PANEL',-6.96,4.1,0,-1.65,.1,-.4);box(leftside,.24,5.96,2.81,0,0,0,M.silver,.075);
const rightside=part('07 · RIGHT SIDE PANEL',6.96,4.1,0,1.65,.1,-.4);box(rightside,.24,5.96,2.81,0,0,0,M.silver,.075);
for(let i=0;i<17;i++)box(rightside,.028,.095,1.72,.13,1.5-i*.16,0,M.dark,.01);
const ports=part('08 · HEADPHONE / AUX / DC',7.1,2.2,.25,2.2,-.1,.1);for(let i=0;i<3;i++){const p=cyl(ports,.13,.065,0,i*.47,0,M.black,24);p.rotation.set(0,0,Math.PI/2);const rr=ring(ports,.14,.025,.055,i*.47,0,M.chrome);rr.rotation.y=Math.PI/2;const l=label(ports,['DC 9V','AUX','PHONES'][i],.65,.09,.07,i*.47+.2,0,{mono:true});l.rotation.y=Math.PI/2;}
const handle=part('09 · CARRY HANDLE',0,7.12,-.15,0,3.1,-.35);box(handle,.42,1.5,.5,-3.4,.72,0,M.dark,.12);box(handle,.42,1.5,.5,3.4,.72,0,M.dark,.12);box(handle,7.15,.43,.54,0,1.44,0,M.dark,.14);box(handle,5.85,.09,.59,0,1.63,0,M.rubber,.025);for(const x of [-3.4,3.4])cyl(handle,.21,.58,x,.12,0,M.metal);
const antenna=part('10 · TELESCOPIC ANTENNA',5.5,7.2,-.82,1.2,3,-.8);cyl(antenna,.2,.19,0,0,0,M.chrome,24,'y');rod(antenna,[0,0,0],[1.65,4,-.18],.047,M.chrome);rod(antenna,[.8,1.94,-.087],[1.73,4.22,-.19],.027,M.chrome);ball(antenna,.072,1.73,4.22,-.19,M.chrome);

// Layered acoustic drivers and an instanced woven steel grille.
function speaker(x,side){const driver=part(`${side} · WOOFER ASSEMBLY`,x,3.58,1.34,Math.sign(x)*4.55,.3,2.1);cyl(driver,1.98,.23,0,0,-.12,M.dark,72);cyl(driver,1.15,.65,0,0,-.55,M.metal,48);cyl(driver,.74,.35,0,0,-1,M.black,40);ring(driver,1.84,.11,0,0,.12,M.rubber);ring(driver,1.63,.09,0,0,.13,M.black);
const coneGroup=group(driver);const cone=new THREE.Mesh(new THREE.ConeGeometry(1.54,.36,80,1,true),M.rubber);cone.rotation.x=-Math.PI/2;cone.position.z=-.015;coneGroup.add(cone);const cap=ball(coneGroup,.57,0,0,.075,M.black);cap.scale.z=.45;for(let r=.72;r<1.53;r+=.13)ring(coneGroup,r,.018,0,0,.14-(r-.7)*.16,M.dark);cones.push(coneGroup);
for(let i=0;i<8;i++){const a=i*Math.PI/4;screw(driver,Math.cos(a)*1.84,Math.sin(a)*1.84,.24,.055);}
const grille=part(`${side} · STEEL MESH GRILLE`,x,3.58,1.73,Math.sign(x)*4.8,.4,4.4);ring(grille,1.99,.085,0,0,0,M.dark);ring(grille,1.91,.024,0,0,.03,M.metal);
const n=45,spacing=3.78/n;const bars=[];for(let i=-22;i<=22;i++){const off=i*spacing,extent=Math.sqrt(1.87**2-off**2);if(Number.isFinite(extent)){bars.push([off,0,spacing*.19,extent*2]);bars.push([0,off,extent*2,spacing*.19]);}}
const mesh=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,.025),M.black,bars.length);const dummy=new THREE.Object3D();bars.forEach((a,i)=>{dummy.position.set(a[0],a[1],i%2?.078:.05);dummy.scale.set(a[2],a[3],1);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);});grille.add(mesh);interactive(mesh,'speaker',grille);grille.userData.localStage=0;
const badge=box(grille,.7,.3,.07,0,-1.64,.09,M.edge,.025);label(grille,'C / W',.48,.13,0,-1.64,.133,{weight:800});return {driver,grille};}
const speakers=[speaker(-4.7,'11'),speaker(4.7,'12')];

// The well is empty until an actual local file is imported.
const well=part('13 · CASSETTE CRADLE',0,3.59,.76,-3.3,.6,-.3);box(well,4.43,3.32,.24,0,0,0,M.black,.08);box(well,3.72,2.64,.07,0,0,.15,M.dark,.06);
for(const x of [-.83,.83])cyl(well,.14,.45,x,.05,.37,M.chrome,24);
const importPlate=label(well,'NO TAPE\nINSERT AUDIO',2.35,.64,0,-.25,.29,{color:'#b3bcac',mono:true});interactive(importPlate,'import');importPlate.visible=false;
label(well,'LOCAL AUDIO ONLY  ·  OPEN TO INSERT',3.28,.095,0,-1.21,.27,{color:'#879387',mono:true});
const doorPart=part('14 · DAMPED CASSETTE DOOR',0,2.05,1.66,4.3,2.6,4.8);const door=group(doorPart);
for(const x of [-2.02,2.02])box(door,.18,3.1,.19,x,1.54,0,M.dark,.06);for(const y of [.08,3.03])box(door,4.2,.17,.19,0,y,0,M.dark,.05);
const windowPane=box(door,3.82,2.57,.07,0,1.59,.01,M.smoke,.05);interactive(windowPane,'door');
box(door,3.83,.39,.075,0,.4,.065,M.silver,.015);label(door,'AUTO REVERSE',2.15,.16,0,.42,.109,{weight:800});label(door,'FULL LOGIC  /  SOFT EJECT',2.9,.095,0,2.78,.118,{color:'#c5cdc1',mono:true});
box(door,.68,.11,.06,0,3.06,.14,M.orange,.02);for(const x of [-1.82,1.82])cyl(door,.085,.19,x,.06,0,M.chrome);
let doorTarget=0,doorVelocity=0,doorDebounce=0;
function setDoorTarget(open,silent=false){const next=open?OPEN_ANGLE:0;if(Math.abs(next-doorTarget)<.01)return;doorTarget=next;if(!silent)mechanicalSound(open?'door-open':'door-close');if(open)reactPeople('tape');}

// Individual tape: actual spools, visible wound tape, rollers, screws and label.
function cassette(parent,title='SUMMER 1997',color='#cab86e',scale=1){const g=group(parent);g.scale.setScalar(scale);box(g,3.55,2.24,.3,0,0,0,mat('#7f8c7f',.35,.08,{transparent:true,opacity:.48}),.12);box(g,3.28,.75,.035,0,.62,.181,mat(color,.8),.035);const titleLabel=label(g,title.toUpperCase(),2.68,.22,0,.61,.207,{weight:800,res:1024});label(g,'A',.18,.17,-1.48,.28,.214,{weight:800,res:256});label(g,'LOCAL TAPE  /  TYPE I  /  C-82',2.95,.105,0,.88,.207,{mono:true,res:1024});label(g,'STEREO  ·  NORMAL BIAS  ·  120μs',2.85,.078,0,-.99,.201,{mono:true,res:1024});
const mechanism=group(g),spool=[],guideRollers=[];for(const x of [-.84,.84]){ring(mechanism,.63,.018,x,-.1,.185,M.metal);const reel=group(mechanism,x,-.1,.15);const wound=cyl(reel,.58,.08,0,0,0,M.tape,64);const layers=group(reel);for(const r of [.32,.38,.44,.50,.56])ring(layers,r,.003,0,0,.041,M.dark);cyl(reel,.255,.14,0,0,.045,M.cream,32);cyl(reel,.13,.155,0,0,.065,M.dark,20);for(let i=0;i<6;i++){const a=i*Math.PI/3;box(reel,.085,.13,.03,Math.cos(a)*.188,Math.sin(a)*.188,.13,M.edge,.01).rotation.z=a;}spool.push({reel,wound,layers});}
const ribbonGeometry=new THREE.BufferGeometry();const initialRadii=updateRibbon(ribbonGeometry,0);const tapePath=new THREE.Mesh(ribbonGeometry,M.tape);tapePath.userData.dynamic=true;mechanism.add(tapePath);spool.forEach(({wound,layers},i)=>{const scale=initialRadii[i]/.58;wound.scale.set(scale,1,scale);layers.scale.set(scale,scale,1);});
for(const x of [-1.27,1.27]){const guide=group(mechanism,x,-.7,.15);cyl(guide,.095,.08,0,0,0,M.cream,24);box(guide,.1,.018,.01,0,0,.046,M.dark,0);guideRollers.push(guide);cyl(mechanism,.033,.14,x,-.7,.15,M.chrome,12);}box(mechanism,.29,.12,.13,0,-.89,.11,M.metal,.015);box(mechanism,.22,.046,.082,0,-.826,.15,M.paper,.006);
for(const x of [-1.6,1.6])for(const y of [-.93,.96])screw(g,x,y,.18,.05);for(const x of [-1.1,1.1])box(g,.3,.08,.15,x,1.1,-.025,M.black,.01);
g.userData={spool,titleLabel,tapePath,guideRollers,mechanism,ribbonProgress:0};return g;}
const loadedTape=part('15 · SIDE A / MAGNETIC TAPE',0,3.59,1.19,0,2.3,3.1);const tapeModel=cassette(loadedTape,'LOCAL TAPE');loadedTape.visible=false;interactive(tapeModel,'seek');

// VU faces are printed textures; needles, frames and glass remain geometry.
const fasciaCarrier=part('36 · CONTROL MOUNTING PLATE',0,5.99,1.27,0,1.2,-.65);box(fasciaCarrier,4.12,1.61,.11,0,0,0,M.dark,.04);
const vuNeedles=[];const vu=part('16 · DUAL ANALOG VU',0,6.3,1.58,0,1.4,1.9);
function meter(x,channel){box(vu,1.78,.66,.19,x,0,0,M.dark,.06);const c=document.createElement('canvas');c.width=512;c.height=190;const k=c.getContext('2d');k.fillStyle='#d6cba6';k.fillRect(0,0,512,190);k.strokeStyle='#46503e';k.lineWidth=3;k.beginPath();k.arc(256,207,155,Math.PI*1.16,Math.PI*1.84);k.stroke();for(let i=0;i<13;i++){let a=Math.PI*(1.16+i*.68/12);k.strokeStyle=i>9?'#b34728':'#3a493b';k.beginPath();k.moveTo(256+Math.cos(a)*147,207+Math.sin(a)*147);k.lineTo(256+Math.cos(a)*168,207+Math.sin(a)*168);k.stroke();}k.fillStyle='#374638';k.font='19px monospace';k.fillText('−20   −10    −3  0  +3',58,62);k.font='bold 23px Arial';k.fillText('VU  '+channel,207,165);const tx=new THREE.CanvasTexture(c);tx.colorSpace=THREE.SRGBColorSpace;const face=new THREE.Mesh(new THREE.PlaneGeometry(1.58,.49),new THREE.MeshBasicMaterial({map:tx}));face.position.set(x,.01,.103);vu.add(face);const pivot=group(vu,x,-.25,.128);box(pivot,.017,.48,.009,0,.25,0,M.dark,.002);cyl(pivot,.055,.02,0,0,0,M.dark,16);pivot.rotation.z=1.03;vuNeedles.push(pivot);box(vu,1.62,.52,.033,x,.01,.155,M.glass,.02);}
meter(-.94,'L');meter(.94,'R');interactive(vu,'region','vu');
const lcdPart=part('17 · LCD / TAPE STATUS',-.56,5.56,1.55,-.25,.5,1.4);box(lcdPart,2.72,.46,.12,0,0,0,M.dark,.035);const lcd=label(lcdPart,'STANDBY   —   C82',2.53,.26,0,0,.066,{mono:true,color:'#364c3d',bg:'#a8b39a',weight:500});
label(lcdPart,'PRECISION TRANSPORT',2.35,.065,0,-.190,.067,{mono:true});
const counterPart=part('18 · MECHANICAL COUNTER',1.42,5.56,1.6,.6,.4,2);box(counterPart,.95,.43,.12,0,0,0,M.black,.02);
const digitRollers=[];for(let i=0;i<3;i++){const roll=group(counterPart,(i-1)*.255,0,.02);for(let j=0;j<10;j++){const a=j*Math.PI*2/10;const digit=label(roll,String(j),.215,.22,0,Math.sin(a)*.305,Math.cos(a)*.305,{mono:true,bg:'#202725',color:'#dfdfc9',res:128});digit.rotation.x=-a;}digitRollers.push(roll);}box(counterPart,.94,.25,.33,0,.25,.22,M.dark,.015);box(counterPart,.94,.25,.33,0,-.25,.22,M.dark,.015);
label(counterPart,'TAPE COUNTER',.98,.09,0,.39,.07,{mono:true});

// Transport keys with separate rods and springs, visible when dismantled.
const transport=part('19 · INTERLOCK KEY BANK',0,1.56,1.63,0,-.65,2.25);
box(transport,4.60,.74,.105,0,0,-.22,M.rubber,.035);
const keyDefs=[['prev','I◀'],['rew','◀◀'],['play','▶'],['pause','Ⅱ'],['stop','■ / ⏏'],['ff','▶▶'],['next','▶I'],['record','●']];
keyDefs.forEach(([id,symbol],i)=>{
 const x=(i-3.5)*.52;
 box(transport,.505,.475,.085,x,0,.025,M.dark,.025);
 box(transport,.46,.025,.025,x,-.24,.067,M.metal,.005);
 const k=group(transport,x,0,KEY_REST);
 const button=box(k,.455,.415,.32,0,0,0,id==='play'?M.orange:id==='record'?M.dark:M.cream,.034);
 label(k,symbol,.36,.18,0,.046,.174,{color:id==='play'?'#f6e6c9':id==='record'?'#bf6046':'#26342e'});
 label(k,id==='stop'?'STOP/EJ':id.toUpperCase(),.40,.075,0,-.115,.175,{color:id==='play'?'#f6e6c9':id==='record'?'#b4bdac':'#424b43',mono:true});
 interactive(box(k,.505,.48,.33,0,0,0,new THREE.MeshBasicMaterial({visible:false}),.025),'button',id);interactive(button,'button',id);buttons[id]=k;k.userData.velocity=0;
 rod(k,[0,0,-.15],[0,0,-1.2],.035,M.chrome);box(k,.15,.12,.35,0,-.16,-.8,M.metal,.01);
});
const ledMaterial=mat('#ac6f32',.3,0,{emissive:'#d88732',emissiveIntensity:.6});const powerLED=cyl(shell,.053,.04,-3.4,2.48,.27,ledMaterial,20);label(shell,'POWER',.55,.075,-3.4,2.29,.275,{mono:true});
function knob(name,x,y,z,r,type,initial=.5){const p=part(`${20+Object.keys(knobs).length} · ${name}`,x,y,z,Math.sign(x)*.45,.8,1.9);cyl(p,r+.085,.07,0,0,-.095,M.rubber,48);ring(p,r+.075,.018,0,0,0,M.dark);for(let i=0;i<11;i++){const a=(-135+i*27)*Math.PI/180;rod(p,[Math.sin(a)*(r+.09),Math.cos(a)*(r+.09),.02],[Math.sin(a)*(r+.15),Math.cos(a)*(r+.15),.02],.009,M.dark);}const rot=group(p,0,0,.07);cyl(rot,r,.23,0,0,0,M.dark,64);cyl(rot,r*.86,.03,0,0,.13,M.edge,64);box(rot,.045,r*.38,.014,0,r*.52,.154,M.dark,.006);for(let i=0;i<44;i++){const a=i/44*Math.PI*2;rod(rot,[Math.sin(a)*r,Math.cos(a)*r,-.06],[Math.sin(a)*r,Math.cos(a)*r,.1],.009,M.metal);}label(p,name,r*2+.5,.09,0,-r-.12,.01,{mono:true});const hit=cyl(p,r+.12,.29,0,0,.03,new THREE.MeshBasicMaterial({visible:false}),40);interactive(hit,'knob',type);interactive(p,'knob',type);knobs[type]={part:p,rot,value:initial,displayValue:initial,radius:r,lastDetent:Math.round(initial*40),lastTick:0};return p;}
knob('VOLUME',-5.62,6.09,1.62,.4,'volume',.68);knob('BASS',-4.35,6.12,1.62,.24,'bass',.5);knob('TREBLE',-3.43,6.12,1.62,.24,'treble',.5);
const eqPart=part('23 · FIVE-BAND EQUALIZER',4.63,6.25,1.56,1.1,1.35,2);box(eqPart,3.83,1.24,.10,0,0,-.17,M.rubber,.04);box(eqPart,3.53,1.0,.11,0,0,0,M.dark,.035);label(eqPart,'GRAPHIC EQUALIZER',2.9,.1,0,.45,.064,{color:'#c5c9b9',mono:true});
[60,250,1000,4000,12000].forEach((f,i)=>{const x=(i-2)*.59;box(eqPart,.043,.6,.022,x,.035,.065,M.black,.009);for(let j=-2;j<=2;j++)box(eqPart,.17,.011,.005,x,j*.127+.035,.075,M.metal,0);const g=group(eqPart,x,.035,.095);const h=box(g,.28,.11,.1,0,0,0,M.cream,.018);box(g,.23,.018,.008,0,0,.055,M.orange,.002);interactive(h,'eq',i);eqSliders.push(g);label(eqPart,['60','250','1K','4K','12K'][i],.36,.075,x,-.39,.067,{mono:true,color:'#c7ceba'});});
// A restrained row of physical level LEDs.
for(let i=0;i<14;i++){const material=mat(i>10?'#9a643d':'#829566',.5,0,{emissive:i>10?'#ca632d':'#76934f',emissiveIntensity:.025});box(shell,.12,.046,.018,3.42+i*.2,.99,.267,material,.004);lamps.push(material);}
const selectorPart=part('24 · TOP MODE CONTROLS',0,7.20,.78,0,2.4,.9);
function selector(x,title,kind,states){
 const g=group(selectorPart,x,0,0);box(g,2.18,.09,.91,0,0,0,M.dark,.045);box(g,2.06,.012,.79,0,.050,0,M.metal,.03);
 box(g,1.35,.025,.18,0,.063,.05,M.black,.025);
 const titlePrint=label(g,title,1.92,.145,0,.064,-.26,{color:'#e3dfce',mono:true});titlePrint.rotation.x=-Math.PI/2;
 const tab=box(g,.34,.105,.27,-.47,.109,.05,M.cream,.026);for(let i=-1;i<=1;i++)box(tab,.018,.008,.16,i*.065,.056,0,M.metal,.003);
 const marks=[];states.forEach((state,i)=>{const xx=-.47+i*.94/(states.length-1);const pad=box(g,.94/(states.length-1),.007,.20,xx,.064,.29,M.dark,.008);interactive(pad,'selectorState',{kind,index:i});const mark=label(g,state,.82/(states.length-1),.105,xx,.070,.29,{mono:true,color:i?'#9ca69d':'#f0c681'});mark.rotation.x=-Math.PI/2;interactive(mark,'selectorState',{kind,index:i});marks.push(mark);box(g,.018,.016,.055,xx,.079,.05,M.orange,.002);});
 interactive(tab,'selector',kind);interactive(g,'selector',kind);return {tab,group:g,marks,states,lastIndex:0};
}
const stereoSwitch=selector(-4.15,'OUTPUT','stereo',['STEREO','MONO']);const randomSwitch=selector(-1.45,'PLAY ORDER','shuffle',['IN ORDER','SHUFFLE']);const repeatSwitch=selector(1.25,'TAPE LOOP','repeat',['OFF','ONE','ALL']);
const topSelectors={stereo:stereoSwitch,shuffle:randomSwitch,repeat:repeatSwitch};
const topPrint=label(top,'C / W  •  ANALOG CONTROL',2.5,.13,-.1,.131,-.92,{mono:true});topPrint.rotation.x=-Math.PI/2;
const servicePoint=box(top,.62,.035,.62,5.8,.14,.57,M.orange,.02);interactive(servicePoint,'explode');const serviceText=label(top,'+',.25,.25,5.8,.17,.57,{color:'#eadfc6'});serviceText.rotation.x=-Math.PI/2;interactive(serviceText,'explode');const serviceHint=label(top,'SERVICE · DOUBLE TAP',1.9,.12,5.5,.157,.99,{mono:true});serviceHint.rotation.x=-Math.PI/2;

// Serviceable mechanics: flywheel, capstan, belt, gears and retracting stereo head.
const deck=part('25 · TAPE TRANSPORT PLATE',0,3.76,.24,0,0,-.2);box(deck,4.35,3.4,.16,0,0,0,M.metal,.06);
for(const x of [-1.96,1.96])for(const y of [-1.45,1.45])screw(deck,x,y,.1,.07);
function gear(parent,r,x,y,z){const g=group(parent,x,y,z);cyl(g,r,.13,0,0,0,M.cream,40);cyl(g,r*.38,.16,0,0,0,M.dark,24);cyl(g,.055,.2,0,0,.02,M.chrome,16);for(let i=0;i<20;i++){const a=i*Math.PI/10;box(g,r*.15,r*.25,.12,Math.sin(a)*r,Math.cos(a)*r,0,M.cream,.008).rotation.z=-a;}gears.push(g);return g;}
const flywheel=part('26 · CAPSTAN FLYWHEEL',.86,3.83,.52,.5,.35,.5);gear(flywheel,.7,0,0,0);const secondWheel=part('27 · SUPPLY REEL DRIVE',-.86,3.83,.51,-.5,.35,.5);gear(secondWheel,.48,0,0,0);
const motor=part('28 · CAPSTAN MOTOR / 9V DC',-1.42,2.65,.52,-1.05,-.8,.3);cyl(motor,.37,.76,0,0,0,M.metal,40);cyl(motor,.28,.06,0,0,.41,M.dark,30);gear(motor,.17,0,0,.47);label(motor,'9V DC',.49,.12,0,-.12,.4,{mono:true});
const belt=part('29 · ELASTOMER DRIVE BELT',0,0,.75,0,0,.9);pathTube(belt,[[-1.6,2.64,0],[-1.58,2.38,0],[-1.22,2.44,0],[1.46,3.47,0],[1.49,4.01,0],[1.05,4.47,0],[.46,4.34,0],[-1.6,2.64,0]],.027,M.rubber,true);
const beltMarker=box(belt,.1,.06,.06,-1.48,2.43,0,M.metal,.01);
const gearsPart=part('30 · AUTO-REVERSE GEAR TRAIN',0,2.87,.56,.3,-.65,.6);gear(gearsPart,.32,-.55,0,0);gear(gearsPart,.25,.04,.15,0);gear(gearsPart,.36,.65,.1,0);
const headPart=part('31 · STEREO PLAYBACK HEAD',0,2.56,.87,0,-1.25,1.3);const head=group(headPart);box(head,1.9,.18,.37,0,0,0,M.dark,.025);box(head,.54,.39,.42,0,.17,0,M.chrome,.06);box(head,.32,.25,.025,0,.23,.222,M.dark,.008);for(const x of [-.77,.77]){cyl(head,.17,.26,x,.19,0,M.rubber,24);cyl(head,.045,.32,x,.19,.02,M.chrome,16);}
label(deck,'C82 / TRANSPORT\nDO NOT TOUCH',1.65,.32,0,1.25,.095,{mono:true});
const pcb=part('32 · AUDIO PCB / REV 03',0,3.84,-.77,2,1,-2.3);box(pcb,10.55,4.24,.12,0,0,0,M.pcb,.04);
// Circuit traces are geometry, so they remain legible from oblique service views.
for(let i=0;i<30;i++){const x=-4.8+(i%15)*.67,y=i<15?-.65:1.45;rod(pcb,[x,y,.076],[x+.21,y-.3,.076],.013,M.copper);rod(pcb,[x+.21,y-.3,.076],[x+.21,-1.77,.076],.013,M.copper);}
for(let i=0;i<14;i++){const x=-4.5+i*.68,y=i%2?-.65:1.14;cyl(pcb,.125,.39,x,y,.25,M.dark,20);cyl(pcb,.118,.025,x,y,.46,M.metal,20);box(pcb,.05,.18,.025,x,y,.478,M.black,.004);}
for(let i=0;i<5;i++){const x=-3.7+i*1.8;box(pcb,.8,.49,.2,x,.28,.2,M.black,.035);for(let j=0;j<6;j++){box(pcb,.06,.18,.05,x-.3+j*.12,.59,.13,M.chrome,.006);box(pcb,.06,.18,.05,x-.3+j*.12,-.03,.13,M.chrome,.006);}label(pcb,'C82-'+(41+i),.59,.115,x,.28,.307,{color:'#92998e',mono:true});}
for(let i=0;i<22;i++){const x=-4.7+(i%11)*.89,y=i<11?-1.46:1.75;rod(pcb,[x-.18,y,.11],[x+.18,y,.11],.015,M.chrome);box(pcb,.22,.07,.08,x,y,.15,i%3===0?M.orange:M.paper,.015);}
label(pcb,'C82 AUDIO SYSTEM   /   REV 03',3.95,.15,1.8,-1.95,.075,{mono:true,color:'#d8d8b6'});
const pcbLED=mat('#658966',.3,0,{emissive:'#7eab56',emissiveIntensity:.2});cyl(pcb,.07,.13,-4.8,1.8,.15,pcbLED,16);
const psu=part('33 · REGULATED POWER SUPPLY',4.9,2.09,-.39,1.7,-.7,-1.9);box(psu,1.85,1.39,1.1,0,0,0,M.dark,.09);box(psu,1.5,.7,1.14,0,0,0,M.metal,.03);label(psu,'TRANSFORMER\nDC 9V',1.12,.35,0,0,.58,{mono:true,bg:'#c1b88f'});
const wiring=part('34 · SIGNAL WIRING LOOM',0,0,0,0,-.1,-.75);for(let i=0;i<3;i++)pathTube(wiring,[[-5,3+i*.06,.15],[-3,2.1+i*.12,-.3],[0,2.05+i*.07,-.8],[3.3,2.5+i*.1,-.4],[4.8,3.5+i*.06,.1]],.02,[M.orange,M.dark,M.paper][i]);
const fixings=part('35 · M3 ENCLOSURE SCREWS',0,0,0,0,.2,4);for(const [x,y]of FRONT_FASTENERS){housingScrew(fixings,x,shell.position.y+y,1.585);cyl(fixings,.022,.27,x,shell.position.y+y,1.444,M.chrome,12);}

// Optional wood cheeks and horizontal grille ribs belong to the selected edition.
const woodCanvas=document.createElement('canvas');woodCanvas.width=128;woodCanvas.height=512;const woodCtx=woodCanvas.getContext('2d');woodCtx.fillStyle='#76503b';woodCtx.fillRect(0,0,128,512);for(let i=0;i<110;i++){woodCtx.strokeStyle=i%3?'rgba(35,18,10,.16)':'rgba(239,198,128,.18)';woodCtx.beginPath();const x=i*1.19;woodCtx.moveTo(x,0);woodCtx.bezierCurveTo(x+Math.sin(i)*6,160,x-3,310,x+Math.cos(i)*4,512);woodCtx.stroke();}const woodTexture=new THREE.CanvasTexture(woodCanvas);woodTexture.colorSpace=THREE.SRGBColorSpace;
woodTexture.wrapS=woodTexture.wrapT=THREE.RepeatWrapping;
M.veneer=mat('#ffffff',.7,.04,{map:woodTexture,transparent:true,opacity:0,depthWrite:false});M.grilleStripe=mat('#c1c7bd',.36,.6,{transparent:true,opacity:0,depthWrite:false});
for(const side of [leftside,rightside])box(side,.035,5.59,2.53,Math.sign(side.position.x)*.139,0,0,M.veneer,.025);
for(const {grille}of speakers)for(let i=-8;i<=8;i++){const y=i*.205,w=2*Math.sqrt(1.83**2-y*y);box(grille,w,.034,.025,0,y,.11,M.grilleStripe,.008);}

M.caseWood=mat('#d0a575',.78,.04,{map:woodTexture,transparent:true,opacity:0,depthWrite:false});
const woodFront=new THREE.Mesh(new THREE.ShapeGeometry(frontShape,48),M.caseWood);woodFront.position.z=.248;woodFront.receiveShadow=true;shell.add(woodFront);
const woodTop=new THREE.Mesh(new THREE.PlaneGeometry(13.92,2.76),M.caseWood);woodTop.rotation.x=-Math.PI/2;woodTop.position.y=.134;woodTop.receiveShadow=true;top.add(woodTop);const woodBack=box(rear,13.72,5.76,.006,0,0,-.124,M.caseWood,.02);
M.future=mat('#9bdfdc',.26,.5,{emissive:'#55aaa8',emissiveIntensity:.7,transparent:true,opacity:0,depthWrite:false});
for(const {grille}of speakers)ring(grille,2.025,.018,0,0,.12,M.future);
box(shell,4.5,.027,.018,0,2.84,.252,M.future,.006);for(const x of [-6.86,6.86])box(shell,.025,4.82,.018,x,0,.252,M.future,.006);

// One physical drawer; legacy archive slots remain addressable across 72 pages.
const cabinet=createCabinet({props,group,box,label,rod,screw,interactive,M,cassette,disposeGroup});
contact(cabinet.root.position.x,cabinet.root.position.z,5.4,3.5,.25);
const magnifyingGlass=group(props,10.8,TABLE_TOP+.095,5.15);magnifyingGlass.rotation.y=-.55;
ring(magnifyingGlass,.57,.055,0,0,0,M.chrome).rotation.x=-Math.PI/2;
ring(magnifyingGlass,.50,.021,0,.012,0,M.copper).rotation.x=-Math.PI/2;
cyl(magnifyingGlass,.49,.018,0,0,0,M.glass,48,'y');
rod(magnifyingGlass,[0,0,.54],[0,0,1.07],.07,M.chrome);box(magnifyingGlass,.22,.17,.84,0,0,1.35,M.dark,.07);
const lensHit=cyl(magnifyingGlass,.63,.13,0,0,0,new THREE.MeshBasicMaterial({visible:false}),32,'y');interactive(magnifyingGlass,'magnifier');interactive(lensHit,'magnifier');
const lensSign=label(magnifyingGlass,'INSPECT / SEARCH',1.65,.17,0,-.075,2.02,{mono:true,res:256});lensSign.rotation.x=-Math.PI/2;props.updateMatrixWorld(true);props.attach(lensSign);

const library=cabinet.root,libraryTapes=cabinet.anchors;
const recorder=createRecorder({parent:library,group,box,cyl,ring,label,interactive,M,cassette,disposeGroup});
const importSlot=recorder.key,importSlotLabel=group(library);

const spare=cassette(props,'SUMMER 1997','#bda061',.64);spare.position.set(-5.7,.266,4.65);spare.rotation.set(-Math.PI/2,0,-.2);

const toolbox=group(props,-7.5,.4,1.8);interactive(toolbox,'settings');label(toolbox,'SETTINGS',1,.16,0,-.04,.386,{color:'#fff1d0',weight:800});box(toolbox,1.23,.45,.75,0,0,0,M.orange,.06);const lid=box(toolbox,1.23,.09,.75,0,.43,-.28,M.orange,.04);lid.rotation.x=-.65;box(toolbox,.46,.045,.09,0,.63,-.37,M.dark,.01);for(let i=0;i<3;i++)rod(toolbox,[-.4+i*.35,.3,-.2],[-.25+i*.3,.31,.22],.025,M.chrome);
box(toolbox,1.02,.08,.53,0,.25,0,M.dark,.025);box(toolbox,.14,.18,.045,0,.07,.399,M.metal,.014);for(const x of [-.42,.42])rod(toolbox,[x-.08,.24,-.38],[x+.08,.24,-.38],.037,M.metal);
const manual=box(props,1.43,.012,1.05,1.30,.177,6.60,M.paper,.005);const manualText=label(props,'C-82\nSERVICE MANUAL\nTRANSPORT / REV.03',1.2,.68,1.30,.185,6.60,{mono:true});manualText.rotation.x=-Math.PI/2;

const ladder=group(props);const ladderRails=[],ladderCaps=[],ladderFeet=[],ladderRungs=[];
for(const x of [-.29,.29]){const rail=rod(ladder,[x,0,0],[x,1,0],.026,M.metal);ladderRails.push(rail);ladderCaps.push(ball(ladder,.05,x,0,0,M.rubber));ladderFeet.push(box(props,.14,.08,.24,0,TABLE_TOP+.04,0,M.rubber,.015));}
for(let i=0;i<LADDER_SUPPORT.rungCount;i++)ladderRungs.push(rod(ladder,[-.29,.18+i*.32,0],[.29,.18+i*.32,0],.025,M.chrome));
let lastLadderPose='';
function updateLadder(offsetY=.195*(1-model.scale.y)){const pose=ladderPose(model.scale.toArray(),offsetY,M.caseWood.opacity>0?.004:0);const signature=pose.length.toFixed(5)+':'+pose.base[0].toFixed(5);if(signature===lastLadderPose)return;lastLadderPose=signature;ladderRungs.forEach(rung=>rung.visible=rung.position.y<pose.length-.12);ladder.position.fromArray(pose.base);ladder.rotation.set(pose.angle,0,0);ladderRails.forEach((rail,i)=>{rail.scale.y=pose.length;rail.position.y=pose.length/2;ladderCaps[i].position.y=pose.length;ladderFeet[i].position.set(pose.base[0]+(i? .29:-.29),TABLE_TOP+.04,pose.base[2]);});}
updateLadder();

function person(parent,x,y,z,color='#b77143',pose='stand',angle=0){
 const g=group(parent,x,y,z);g.rotation.y=angle;
 const cloth=mat(color,.88),pants=mat('#455354',.9),skin=mat('#c9ad89',.82);
 const variant=pose==='climb'?'classic':['classic','cap','coat','backpack','curly','headphones'][people.length%6];const {body,head,arms,legs,shoes,hands}=buildFigure(g,{group,box,rod,ball},{cloth,pants,skin,dark:M.dark},pose,variant);g.userData.variant=variant;
 const id=people.length,reach=pose==='work'||pose==='carry';arms.forEach(a=>a.rotation.x=reach?-1.65:0);
 const target=cyl(g,.155,.66,0,.32,0,new THREE.MeshBasicMaterial({visible:false}),12,'y');interactive(target,'person',id);
 people.push({g,body,head,arms,legs,shoes,hands,pose,base:g.position.clone(),angle,armBase:reach?-1.65:0,activity:'idle',until:0,look:null,respond:id<3,phase:id*1.7});return g;
}
// Feet are rooted at the support surface; seated hips rest .24 above the root.
const bench=group(props,...FIGURE_PLACEMENT.bench);box(bench,1.20,.10,.53,0,.50,0,M.paper,.025);for(const x of [-.46,.46])for(const z of [-.16,.16])box(bench,.085,.28,.085,x,.31,z,M.dark,.01);
person(props,...FIGURE_PLACEMENT.left,'#87968a','stand',-.3);person(props,3.2,TABLE_TOP,3.65,'#b56f42','stand',.2);person(bench,...FIGURE_PLACEMENT.benchSitter,'#667883','sit',0);
person(props,-7.16,TABLE_TOP,2.6,'#d2bc83','work',-.9);person(props,...FIGURE_PLACEMENT.observer,'#a1a898','stand',-.4);
const seatCrate=group(props,10.5,0,7.8);box(seatCrate,.42,.30,.40,0,.32,0,M.paper,.025);for(const y of [.23,.34,.43])box(seatCrate,.44,.016,.415,0,y,0,M.metal,.004);person(seatCrate,...FIGURE_PLACEMENT.crateSitter,'#63776f','sit',0);
person(props,-1.35,TABLE_TOP,5.45,'#98794f','work',2.5);const ladderTread=box(ladder,.49,CLIMBER.treadHeight,.19,0,CLIMBER.treadY,0,M.dark,.006);for(const z of [-.065,0,.065])box(ladder,.43,.003,.008,0,CLIMBER.rootY-.0015,z,M.rubber,.002);person(ladder,0,CLIMBER.rootY,CLIMBER.rootZ,'#bd663a','climb',Math.PI);
person(top,-2.72,.125,-.65,'#c0a975','stand',-.3);person(top,-5.75,-.115,1.49,'#5f7477','sit',0);
person(props,-.9,TABLE_TOP,3.38,'#788772','carry',-1.4);person(props,.7,TABLE_TOP,3.38,'#bb935f','carry',1.4);
const archiveHelper=person(cabinet.root,-3.6,0,1.9,'#98794f','work',1.1);archiveHelper.scale.setScalar(1/.75);people.at(-1).archiveWorker=true;
const archiveClerk=person(cabinet.root,2.7,1.98,-.7,'#75897b','work',0);archiveClerk.scale.setScalar(1/.75);people.at(-1).archiveWorker=true;
box(archiveClerk,.33,.045,.25,0,.42,.22,M.paper,.008);
// Shared, static contact patches anchor figures without another scene render.
scene.updateMatrixWorld(true);
const floorFigures=people.filter(p=>p.g.getWorldPosition(new THREE.Vector3()).y<=TABLE_TOP+.01);
const footShadows=new THREE.InstancedMesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({map:contactTexture,transparent:true,depthWrite:false,opacity:.24,toneMapped:false}),floorFigures.length);
const shadowPose=new THREE.Object3D();shadowPose.rotation.x=-Math.PI/2;shadowPose.scale.set(.72,.46,1);
floorFigures.forEach((p,i)=>{shadowPose.position.copy(p.g.getWorldPosition(new THREE.Vector3()));shadowPose.position.y=TABLE_TOP+.014;shadowPose.updateMatrix();footShadows.setMatrixAt(i,shadowPose.matrix);});scene.add(footShadows);
function reactPeople(activity,point=null){const now=performance.now();people.forEach((p,i)=>{if(p.archiveWorker&&(activity==='archive'||activity==='tape')){p.activity='point';p.until=now+3200;p.look=point||cabinet.root.localToWorld(new THREE.Vector3(0,3,3));return;}if(p.pose==='climb'){p.activity='listen';p.until=now+1800;p.look=point;return;}if(activity==='tape'&&(p.pose==='work'||p.pose==='carry'||i<2)){p.activity='point';p.until=now+2800;p.look=new THREE.Vector3(0,3.5,2.5);}else if(activity==='service'){p.activity='balance';p.until=now+4300;p.look=new THREE.Vector3(0,5,0);}else if(activity==='play'&&p.respond){p.activity='listen';p.until=now+2200;}else if(activity==='knob'&&i<2){p.activity='listen';p.until=now+1300;p.look=point;}});}
function greetPerson(index){const p=people[index];if(!p)return;p.activity=p.pose==='climb'?'listen':'wave';p.until=performance.now()+2400;p.look=camera.position.clone();}
const carried=cassette(props,'FIELD RECORDINGS','#ad8658',.38);carried.position.set(-.1,.62,3.48);
const coffee=group(props,-2.44,.772,4.81);cyl(coffee,.065,.12,0,0,0,M.cream,24,'y');cyl(coffee,.051,.008,0,.055,0,M.tape,24,'y');ring(coffee,.056,.009,0,.061,0,M.cream).rotation.x=-Math.PI/2;ring(coffee,.035,.011,.074,.002,0,M.cream);
const screwTray=group(props,-8.1,.19,3.8);box(screwTray,1.35,.035,.48,0,0,0,M.metal,.045);for(const z of [-.23,.23])box(screwTray,1.31,.06,.025,0,.025,z,M.metal,.01);
rod(props,[-6.9,.23,2.1],[-6.4,.23,2.4],.019,M.chrome);rod(props,[-6.45,.23,2.37],[-6.26,.23,2.49],.04,M.orange);for(let i=0;i<5;i++){const fastener=group(screwTray,-.43+i*.2,.045,(i%2)*.12-.06);fastener.rotation.x=-Math.PI/2;screw(fastener,0,0,0,.035);}
// A folded instruction card belongs to the model, never to the page chrome.
const guide=group(props,7.9,.178,-3.05);guide.rotation.y=.5;const card=box(guide,1.6,.96,.018,0,.48,0,M.paper,.014);const cardBack=box(guide,1.6,.96/Math.cos(.38),.018,0,.48,-.48*Math.tan(.38),M.paper,.01);cardBack.rotation.x=.38;label(guide,'FIELD GUIDE\nDRAG TAPES TO THE DOOR\nPULL THE ADVERT CORNER\nTOP SLIDERS · CLICK / DRAG\n1–4 · FOCUS  /  ESC · BACK',1.39,.75,0,.49,.015,{mono:true});

antenna.scale.y=getMachineStyle('studio').antenna;

// The advertisement is a real printed object. Each picture is rendered from
// this same model and that edition's materials, never an unrelated placeholder.
let currentStyle='studio',styleAnimating=false,styleGroundOffset=0,focusArea='overview';
const advertisement=group(props,-4.28,TABLE_TOP+PAPER_THICKNESS/2,7.74);advertisement.rotation.x=-Math.PI/2;advertisement.rotation.z=.016;
const styleCards=[],printTargets=[],adPages=[];let adOrder=[AD_COLLECTIONS.length-1,...AD_COLLECTIONS.slice(0,-1).map((_,i)=>i)],adAnimating=false;
function makeStylePrint(style){
 const materialCopies=new Map(),printInk=[];
 function printMaterial(material){if(materialCopies.has(material))return materialCopies.get(material);const copy=material.clone();for(const [key,color]of Object.entries(style.colors))if(material===M[key])copy.color.set(color);if(material===M.silver){copy.roughness=style.roughness;copy.metalness=style.metalness;}if(material===M.veneer)copy.opacity=style.wood||0;if(material===M.caseWood)copy.opacity=style.caseWood||0;if(material===M.future)copy.opacity=style.future||0;if(material===M.grilleStripe){copy.opacity=style.stripes||0;copy.color.set(style.colors.edge);}materialCopies.set(material,copy);return copy;}
 function duplicate(source,lightInk=false){
  lightInk=lightInk||(['night','metro','lagoon','olive','coral','timber'].includes(style.id)&&[shell,top,...Object.values(knobs).map(k=>k.part)].includes(source));
  if(source.isMesh&&source.material.visible===false)return null;
  let copy;if(source.isInstancedMesh){copy=new THREE.InstancedMesh(source.geometry,printMaterial(source.material),source.count);copy.instanceMatrix.copy(source.instanceMatrix);}
  else if(source.isMesh)copy=new THREE.Mesh(source.geometry,Array.isArray(source.material)?source.material.map(printMaterial):printMaterial(source.material));
  else copy=new THREE.Group();
  if(lightInk&&source.userData.setInk&&source!==serviceText&&source.material?.map){const c=document.createElement('canvas'),image=source.material.map.image;c.width=image.width;c.height=image.height;const ctx=c.getContext('2d');ctx.drawImage(image,0,0);ctx.globalCompositeOperation='source-in';ctx.fillStyle='#d9dfd1';ctx.fillRect(0,0,c.width,c.height);const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;copy.material=copy.material.clone();copy.material.map=texture;printInk.push({texture,material:copy.material});}
  copy.position.copy(source.position);copy.quaternion.copy(source.quaternion);copy.scale.copy(source.scale);copy.visible=source===loadedTape?true:source.visible;
  if(source===antenna)copy.scale.y=style.antenna;if(source===handle)copy.scale.y=style.handle;
    for(const child of source.children){const c=duplicate(child,lightInk);if(c)copy.add(c);}return copy;
 }
 const printScene=new THREE.Scene();printScene.background=new THREE.Color('#ded8c7');printScene.environment=scene.environment;printScene.environmentIntensity=.45;
 const object=duplicate(model);object.scale.fromArray(style.scale);printScene.add(object);printScene.add(new THREE.HemisphereLight(0xfff5df,0x6a7169,1.2));const light=new THREE.DirectionalLight(0xfff8e7,2.5);light.position.set(-8,15,13);printScene.add(light);
 const lens=new THREE.PerspectiveCamera(33,2.0,.1,80);lens.position.set(13,10,27);lens.lookAt(0,5.1,0);
 const target=new THREE.WebGLRenderTarget(400,200,{depthBuffer:true});target.texture.colorSpace=THREE.SRGBColorSpace;
 const previousTarget=renderer.getRenderTarget();renderer.setRenderTarget(target);renderer.render(printScene,lens);renderer.setRenderTarget(previousTarget);
 for(const m of materialCopies.values())m.dispose();for(const {texture,material}of printInk){texture.dispose();material.dispose();}printTargets.push(target);return target.texture;
}
function paperPose(rank){return {x:rank*.10,y:rank*.010,z:(AD_COLLECTIONS.length-1-rank)*PAPER_STEP,angle:-rank*.018};}
function setPaperPose(page,rank){const p=paperPose(rank);page.group.position.set(p.x,p.y,p.z);page.group.rotation.z=p.angle;}
for(const [pageIndex,collection]of AD_COLLECTIONS.entries()){
 const page=group(advertisement);interactive(page,'adFocus');box(page,6.65,2.64,PAPER_THICKNESS,0,0,0,mat(['#e6dfc9','#e9daca','#d8dfd9','#e0ddd2'][pageIndex%4],.89),.009);
 const focusLabel=label(page,'CASSETTE WORLD',2.68,.22,-1.66,1.02,.018,{weight:800});label(page,collection.title+'  /  '+collection.year,2.9,.105,1.58,1.01,.018,{mono:true});box(page,6.10,.012,.006,0,.82,.017,M.dark,0);
 for(const [i,id]of collection.styles.entries()){
  const style=getMachineStyle(id),x=(i-1)*2.12;const picture=new THREE.Mesh(new THREE.PlaneGeometry(1.99,1.00),new THREE.MeshBasicMaterial({map:makeStylePrint(style),toneMapped:false}));picture.position.set(x,.18,.020);page.add(picture);interactive(picture,'style',style.id);
  const name=label(page,style.model+'  '+style.name,1.99,.13,x,-.48,.020,{weight:700});interactive(name,'style',style.id);const detail=label(page,style.detail,1.99,.075,x,-.67,.020,{mono:true});interactive(detail,'style',style.id);styleCards.push({picture,name,style,pageIndex});
 }
 label(page,String(pageIndex+1).padStart(2,'0')+' / '+String(AD_COLLECTIONS.length).padStart(2,'0')+'  •  CHOOSE YOUR EDITION',3.9,.10,-1.04,-1.07,.020,{mono:true});
 // A folded corner is a generous physical target, also reachable by touch.
 const corner=group(page,2.77,-1.00,.023);const fold=new THREE.Shape();fold.moveTo(-.38,-.20);fold.lineTo(.40,-.20);fold.lineTo(.40,.35);fold.closePath();const folded=new THREE.Mesh(new THREE.ShapeGeometry(fold),new THREE.MeshBasicMaterial({color:['#ac7350','#628982','#808791','#688e8f'][pageIndex],side:THREE.DoubleSide}));corner.add(folded);interactive(corner,'adNext');
 const pull=label(page,'PULL NEXT ↗',1.33,.115,2.07,-1.055,.027,{mono:true});interactive(pull,'adNext');
 const stamp=label(page,'SELECTED',.81,.12,-2.12,-.85,.022,{mono:true,color:'#9a4c2c'});const record={group:page,stamp,corner,focusLabel,styles:collection.styles};setPaperPose(record,adOrder.indexOf(pageIndex));adPages.push(record);
}
function syncAdSelection(){for(const page of adPages){const index=page.styles.indexOf(currentStyle);page.stamp.visible=index>=0;page.stamp.position.x=(index-1)*2.12;}}
syncAdSelection();
async function cycleAdvertisement(){
 if(busy||adAnimating)return;adAnimating=true;mechanicalSound('paper');const page=adPages[adOrder[1]],from=page.group.position.clone();
 await animateMotion(430,t=>{page.group.position.y=THREE.MathUtils.lerp(from.y,-3.03,ease(t));page.group.position.x=THREE.MathUtils.lerp(from.x,.34,ease(t));});
 await animateMotion(170,t=>{page.group.position.z=THREE.MathUtils.lerp(from.z,(AD_COLLECTIONS.length-1)*PAPER_STEP+.20,ease(t));page.group.rotation.z=THREE.MathUtils.lerp(-.018,-.055,ease(t));});
 const oldTop=adPages[adOrder[0]],lowerPages=adOrder.slice(2).map(id=>({page:adPages[id],z:adPages[id].group.position.z})),oldPosition=oldTop.group.position.clone();
 await animateMotion(380,t=>{oldTop.group.position.y=THREE.MathUtils.lerp(oldPosition.y,-3.03,ease(t));});
 await animateMotion(170,t=>{oldTop.group.position.z=THREE.MathUtils.lerp(oldPosition.z,0,ease(t));for(const lower of lowerPages)lower.page.group.position.z=lower.z+PAPER_STEP*ease(t);});
 adOrder=rotatePaperOrder(adOrder);const changes=adOrder.map((id,rank)=>({page:adPages[id],from:adPages[id].group.position.clone(),angle:adPages[id].group.rotation.z,to:paperPose(rank)}));
 await animateMotion(620,t=>{const u=ease(t);for(const c of changes){c.page.group.position.set(THREE.MathUtils.lerp(c.from.x,c.to.x,u),THREE.MathUtils.lerp(c.from.y,c.to.y,u),THREE.MathUtils.lerp(c.from.z,c.to.z,u));c.page.group.rotation.z=THREE.MathUtils.lerp(c.angle,c.to.angle,u);}});
 adAnimating=false;renderer.shadowMap.needsUpdate=true;
}
const adaptiveInk=[];for(const root of [shell,top,...Object.values(knobs).map(k=>k.part)])root.traverse(o=>{if(o.userData.setInk&&o!==serviceText&&o!==serviceHint)adaptiveInk.push(o);});let inkColor=new THREE.Color('#26312e');
let cableTick=0;


async function changeStyle(id){
 const style=getMachineStyle(id);if(id===currentStyle&&!styleAnimating)return;if(busy||styleAnimating||adAnimating){status('WAIT FOR MECHANISM');return;}
 if(exploded)await toggleExplode();if(exploded||busy)return;
 styleAnimating=true;busy=true;sceneState='TRANSITION';reactPeople('service');mechanicalSound('service-open');
 const fromScale=model.scale.clone(),toScale=new THREE.Vector3(...style.scale),fromAntenna=antenna.scale.y,fromHandle=handle.scale.y,fromWood=M.veneer.opacity,fromStripes=M.grilleStripe.opacity,fromCaseWood=M.caseWood.opacity,fromFuture=M.future.opacity;
 const colors=Object.fromEntries(Object.keys(style.colors).map(k=>[k,M[k].color.clone()]));const roughness=M.silver.roughness,metalness=M.silver.metalness,fromInk=inkColor.clone(),toInk=new THREE.Color(['night','metro','lagoon','olive','coral','timber'].includes(id)?'#e7e7d9':'#26312e');
 moveCamera(homePosition.clone(),new THREE.Vector3(0,3.65,0),1200);
 await animateMotion(2200,t=>{const u=ease(t);model.scale.lerpVectors(fromScale,toScale,u);styleGroundOffset=.195*(1-model.scale.y);updateLadder();antenna.scale.y=THREE.MathUtils.lerp(fromAntenna,style.antenna,u);handle.scale.y=THREE.MathUtils.lerp(fromHandle,style.handle,u);M.caseWood.opacity=THREE.MathUtils.lerp(fromCaseWood,style.caseWood||0,u);M.future.opacity=THREE.MathUtils.lerp(fromFuture,style.future||0,u);M.veneer.opacity=THREE.MathUtils.lerp(fromWood,style.wood||0,u);M.grilleStripe.opacity=THREE.MathUtils.lerp(fromStripes,style.stripes||0,u);M.grilleStripe.color.copy(M.edge.color);for(const [key,color]of Object.entries(style.colors))M[key].color.copy(colors[key]).lerp(new THREE.Color(color),u);M.silver.roughness=THREE.MathUtils.lerp(roughness,style.roughness,u);M.silver.metalness=THREE.MathUtils.lerp(metalness,style.metalness,u);
   if(performance.now()-cableTick>80){inkColor.copy(fromInk).lerp(toInk,u);for(const label of adaptiveInk)label.userData.setInk('#'+inkColor.getHexString());cableTick=performance.now();}
 });
 inkColor.copy(toInk);for(const label of adaptiveInk)label.userData.setInk('#'+inkColor.getHexString());currentStyle=id;lyricWorld.setTheme(id);terminalModel.setStyle();modelBadge.userData.setText(style.model);rearName.userData.setText(`CASSETTE SYSTEM ${style.model}\nDC 9V  ·  6 × R20 / D\nSERIAL 008417\nMADE FOR CASSETTE WORLD`);syncAdSelection();
 styleAnimating=false;busy=false;sceneState='OVERVIEW';focused=false;focusArea='overview';mechanicalSound('service-close');renderer.shadowMap.needsUpdate=true;
}

const terminalModel=createOnlineTerminalModel({props,group,box,cyl,ring,label,interactive,M,TABLE_TOP,onDirty:()=>{renderer.shadowMap.needsUpdate=true;}});
const lyricWorld=createLyricWorld({props,group,box,rod,ring,interactive,TABLE_TOP,mobile,onDirty:()=>{renderer.shadowMap.needsUpdate=true;}});

// Merge static geometry per material and parent; keep each mechanical degree of freedom intact.
lyricWorld.root.traverse(o=>{if(o.isMesh)o.userData.dynamic=true;});
const dynamicMeshes=new Set([...ladderRails,...ladderCaps,...ladderFeet,...ladderRungs,...recorder.reels,stereoSwitch.tab,randomSwitch.tab,repeatSwitch.tab,beltMarker,...people.map(p=>p.head),...tapeModel.userData.spool.map(s=>s.wound)]);
function consolidate(root){for(const child of [...root.children])if(child.isGroup)consolidate(child);const buckets=new Map();for(const m of root.children){if(!m.isMesh||m.isInstancedMesh||m.userData.action||m.userData.dynamic||dynamicMeshes.has(m)||m.material.map||m.material.transparent||Array.isArray(m.material)||!m.visible)continue;const key=m.material.uuid;if(!buckets.has(key))buckets.set(key,[]);buckets.get(key).push(m);}for(const list of buckets.values()){if(list.length<2)continue;const geometries=list.map(m=>{m.updateMatrix();return (m.geometry.index?m.geometry.toNonIndexed():m.geometry.clone()).applyMatrix4(m.matrix);});const geo=mergeGeometries(geometries,false);geometries.forEach(g=>g.dispose());if(!geo)continue;const merged=new THREE.Mesh(geo,list[0].material);merged.castShadow=true;merged.receiveShadow=true;root.add(merged);list.forEach(m=>{root.remove(m);m.geometry.dispose();});}}
const propMaterialCopies=new Map();props.traverse(o=>{if(!o.isMesh)return;let ancestor=o;while(ancestor){if(ancestor===cabinet.root)return;ancestor=ancestor.parent;}const clone=m=>{if(!Object.values(M).includes(m))return m;if(!propMaterialCopies.has(m))propMaterialCopies.set(m,m.clone());return propMaterialCopies.get(m);};o.material=Array.isArray(o.material)?o.material.map(clone):clone(o.material);});
consolidate(model);consolidate(props);
const lensMotion=createLensMotion(magnifyingGlass,scene,camera,lensSign,()=>{renderer.shadowMap.needsUpdate=true;});
const lensOptics=createLensOptics(magnifyingGlass,scene,camera,renderer);
let effectsEnabled=true,onlineLyrics=false;
const lyricLookup=createLyricLookup({client:'Cassette World/5.14 ('+(location.origin==='null'?'file://cassette-world.html':location.origin)+')'});


if(mobile){
 const touchMaterial=new THREE.MeshBasicMaterial({visible:false});
 for(const [id,g]of Object.entries(buttons)){const hit=new THREE.Mesh(new THREE.BoxGeometry(.57,.58,.20),touchMaterial);hit.position.z=.08;g.add(hit);interactive(hit,'button',id);}
 for(const [id,n]of Object.entries(knobs)){const hit=new THREE.Mesh(new THREE.CylinderGeometry(n.radius*1.35,n.radius*1.35,.24,12),touchMaterial);hit.rotation.x=Math.PI/2;hit.position.z=.1;n.part.add(hit);interactive(hit,'knob',id);}
 for(const [i,g]of eqSliders.entries()){const hit=new THREE.Mesh(new THREE.BoxGeometry(.43,.31,.13),touchMaterial);g.add(hit);interactive(hit,'eq',i);}
}

// Audio engine: one media element, one source and a true five-band signal path.
const audio=new Audio();audio.preload='metadata';audio.setAttribute('playsinline','');
const playerState={currentTrack:-1,currentTime:0,duration:0,playing:false,paused:false,volume:.68,muted:false,shuffle:false,repeatMode:'off',playbackRate:1,playlist:[],bass:0,treble:0,stereoMono:false,eq:[0,0,0,0,0]};
let onlineTrack=null,onlineLoaded=false,localResumeTime=0,onlineIntent=0;const onlineImportMeta=new WeakMap();
let foley;let transportRequest=0;let tapeDrag=null;let context,source,filters,limiter,bassFilter,trebleFilter,gain,analyser,analyserL,analyserR,splitter,merger,monoGain,stereoMono=false;
let spectrum=new Uint8Array(256),waveL=new Uint8Array(512),waveR=new Uint8Array(512);
let sceneState='INTRO',transportState='NO_TAPE',focused=false,exploded=false,busy=false,loaded=false,errorText='',scan=0,scanResume=false,transientStatus='',statusUntil=0,drag=null,hover=null,lastInteraction=performance.now(),introStart=performance.now(),introDone=false;
let smoothBass=0,smoothLevelL=0,smoothLevelR=0,drive=0,displayTick=0,activeCounter=0,lastDisplay='';
const timelines=[];function waitMotion(duration){return new Promise(resolve=>tween(duration,()=>{},resolve));}
function animateMotion(duration,update){return new Promise(resolve=>tween(duration,update,resolve));}
function tween(duration,update,complete,delay=0){if(document.hidden){try{update(1);}finally{complete?.();}return;}timelines.push({start:performance.now()+delay,duration:Math.max(1,duration),update,complete});}
function flushTimelines(){const pending=timelines.splice(0);for(const tw of pending){try{tw.update(1);}finally{tw.complete?.();}}}
const ease=t=>t*t*(3-2*t);const easeOut=t=>1-(1-t)**3;
function status(text,ms=1800){transientStatus=text;statusUntil=performance.now()+ms;}
function initAudio(){if(context)return;context=new (window.AudioContext||window.webkitAudioContext)();source=context.createMediaElementSource(audio);filters=[60,250,1000,4000,12000].map((f,i)=>{const n=context.createBiquadFilter();n.type=i===0?'lowshelf':i===4?'highshelf':'peaking';n.frequency.value=f;n.Q.value=.8;return n;});bassFilter=context.createBiquadFilter();bassFilter.type='lowshelf';bassFilter.frequency.value=160;trebleFilter=context.createBiquadFilter();trebleFilter.type='highshelf';trebleFilter.frequency.value=6000;gain=context.createGain();gain.channelCount=2;gain.channelCountMode='explicit';monoGain=context.createGain();monoGain.channelCountMode='explicit';monoGain.channelInterpretation='speakers';monoGain.channelCount=2;analyser=context.createAnalyser();analyser.fftSize=512;analyser.smoothingTimeConstant=.8;analyserL=context.createAnalyser();analyserR=context.createAnalyser();analyserL.fftSize=analyserR.fftSize=512;splitter=context.createChannelSplitter(2);foley=createFoley(context);limiter=context.createDynamicsCompressor();limiter.threshold.value=-1;limiter.knee.value=0;limiter.ratio.value=12;limiter.attack.value=.004;limiter.release.value=.09;const nodes=[source,...filters,bassFilter,trebleFilter,monoGain,gain,limiter,analyser];nodes.forEach((n,i)=>{if(i<nodes.length-1)n.connect(nodes[i+1]);});analyser.connect(context.destination);analyser.connect(splitter);splitter.connect(analyserL,0);splitter.connect(analyserR,1);syncAudio();}
function syncAudio(){queueArchiveSave();if(!context)return;foley?.setVolume(playerState.muted?0:playerState.volume);monoGain.channelCount=playerState.stereoMono?1:2;const t=context.currentTime;filters.forEach((f,i)=>f.gain.setTargetAtTime(playerState.eq[i],t,.025));bassFilter.gain.setTargetAtTime(playerState.bass,t,.025);trebleFilter.gain.setTargetAtTime(playerState.treble,t,.025);gain.gain.setTargetAtTime(playerState.muted?0:Math.pow(playerState.volume,1.7),t,.025);}
function setVolume(v){playerState.volume=THREE.MathUtils.clamp(v,0,1);knobs.volume.value=playerState.volume;if(playerState.muted&&playerState.volume>0)playerState.muted=false;syncAudio();status(`VOLUME ${Math.round(v*100)}`);}
function mute(){playerState.muted=!playerState.muted;syncAudio();status(playerState.muted?'SPEAKERS OFF':'SPEAKERS ON');}
function unlockAudio(){initAudio();if(context.state==='suspended')context.resume().catch(()=>{});}
function mechanicalSound(kind){if(!foley||!effectsEnabled)return;foley.play(kind);}
function pulse(id){const b=buttons[id];if(b){b.userData.pulse=performance.now()+160;mechanicalSound('key');}}
function openDoor(open=true){if(busy)return;if(performance.now()<doorDebounce)return;doorDebounce=performance.now()+260;setDoorTarget(open);importPlate.visible=open&&!loaded;importSlot.visible=true;importSlotLabel.visible=focused;transportState=open?'EJECTED':loaded?'TAPE_LOADED':'NO_TAPE';pulse('stop');}
async function eject(){if(busy)return;if(onlineLoaded){busy=true;transportRequest++;onlineIntent++;audio.pause();setDoorTarget(true);try{await waitMotion(550);await returnOnlineTape(true);leaveOnline();transportState='EJECTED';}finally{busy=false;}return;}if(onlineTrack)leaveOnline();transportRequest++;audio.pause();playerState.paused=false;openDoor(!doorTarget);transportState=doorTarget?'EJECTED':'STOPPED';}
async function play(){if(busy)return;if(onlineTrack){unlockAudio();try{await audio.play();pulse('play');}catch{onlineTerminal.error('请再次点击播放，或更换歌曲。');}return;}const intent=++transportRequest;if(!loaded){if(playbackLists.active()?.entries.length){playbackLists.select(playbackLists.state.activeId);playbackLists.start().catch(e=>status(e.message,5000));return;}if(playerState.playlist.length){await selectTrack(0,true);return;}openDoor(true);focusMachine();return;}errorText='';initAudio();await context.resume();if(doorTarget){setDoorTarget(false);await waitMotion(650);}if(!loaded||busy||intent!==transportRequest)return;try{await audio.play();reactPeople('play');}catch(e){status('PRESS PLAY TO RESUME');}pulse('play');}
function pause(){transportRequest++;audio.pause();playerState.paused=true;transportState='PAUSED';pulse('pause');}
function stop(){if(onlineTrack){transportRequest++;audio.pause();seek(0);playerState.paused=false;transportState='ONLINE_STOPPED';pulse('stop');return;}transportRequest++;if(busy){audio.pause();seek(0);playerState.paused=false;transportState='STOPPED';pulse('stop');return;}const wasStopped=!playerState.playing&&!playerState.paused&&audio.currentTime<.08;if(wasStopped){eject();return;}audio.pause();seek(0);playerState.paused=false;transportState='STOPPED';pulse('stop');}
function seek(t){if((!loaded&&!onlineTrack)||!Number.isFinite(audio.duration))return;audio.currentTime=THREE.MathUtils.clamp(t,0,audio.duration);playerState.currentTime=audio.currentTime;queueArchiveSave();}
function startScan(direction){if(scan||(!loaded&&!onlineTrack)||busy)return;scanResume=!audio.paused;scan=direction;audio.pause();transportState=direction>0?'FAST_FORWARD':'REWIND';pulse(direction>0?'ff':'rew');}
function endScan(){if(!scan)return;scan=0;transportState=scanResume?'PLAYING':playerState.paused?'PAUSED':'STOPPED';if(scanResume)play();}
async function unloadTape(){if(busy||!loaded)return;if(onlineTrack)leaveOnline();transportRequest++;busy=true;audio.pause();playerState.paused=false;transportState='TRANSITION';reactPeople('tape');setDoorTarget(true);await waitMotion(650);await returnTape(playerState.currentTrack);
 loaded=false;loadedTape.visible=false;loadedTape.position.copy(loadedTape.userData.part.base);audio.removeAttribute('src');audio.load();playerState.currentTrack=-1;playerState.currentTime=0;playerState.duration=0;playerState.playing=false;busy=false;importPlate.visible=true;transportState='EJECTED';errorText='';
 cabinet.refresh(null);queueArchiveSave();if('mediaSession'in navigator){navigator.mediaSession.metadata=null;navigator.mediaSession.playbackState='none';}}
function nextIndex(direction=1){const n=playerState.playlist.length;if(n<2)return 0;if(playerState.shuffle){let next;do{next=Math.floor(Math.random()*n);}while(next===playerState.currentTrack);return next;}return (playerState.currentTrack+direction+n)%n;}
function next(direction=1){if(busy)return;if(playbackLists.active()?.entries.length){if(direction<0&&audio.currentTime>3){seek(0);return;}advancePlaybackList(direction);return;}if(onlineTrack){onlineTerminal.nextTrack(direction);return;}if(busy||!playerState.playlist.length)return;if(direction<0&&audio.currentTime>3){seek(0);pulse('prev');return;}pulse(direction>0?'next':'prev');selectTrack(nextIndex(direction),!audio.paused);}
function selectorValue(kind){return kind==='stereo'?Number(playerState.stereoMono):kind==='shuffle'?Number(playerState.shuffle):['off','one','all'].indexOf(playerState.repeatMode);}
function applySelector(kind,index){const selector=topSelectors[kind];if(!selector)return;index=Math.max(0,Math.min(selector.states.length-1,index));if(selectorValue(kind)===index)return;
 if(kind==='stereo'){playerState.stereoMono=index===1;syncAudio();status(index?'MONO OUTPUT':'STEREO OUTPUT');}
 else if(kind==='shuffle'){playerState.shuffle=index===1;status(index?'PLAY ORDER / SHUFFLE':'PLAY ORDER / IN ORDER');}
 else{playerState.repeatMode=['off','one','all'][index];status('TAPE LOOP / '+['OFF','ONE TRACK','ALL TAPES'][index]);}
 mechanicalSound('detent');reactPeople('knob');queueArchiveSave();
}
function cycleShuffle(){applySelector('shuffle',1-selectorValue('shuffle'));}
function cycleRepeat(){applySelector('repeat',(selectorValue('repeat')+1)%3);}
function dragSelector(kind,e){const selector=topSelectors[kind];selector.group.updateWorldMatrix(true,false);const endpoints=[-.47,.47].map(x=>screenPosition(selector.group.localToWorld(new THREE.Vector3(x,.13,.05))));applySelector(kind,selectorIndex({x:e.clientX,y:e.clientY},...endpoints,selector.states.length));}
function metadataSession(track){if(!('mediaSession'in navigator))return;try{navigator.mediaSession.metadata=new MediaMetadata({title:track.title,artist:track.artist,album:track.album,artwork:track.cover?[{src:track.cover}]:[]});}catch{} }
for(const event of ['play','pause','timeupdate','durationchange','ratechange','volumechange','ended'])audio.addEventListener(event,()=>{playerState.playing=!audio.paused&&!audio.ended;playerState.currentTime=audio.currentTime;playerState.duration=Number.isFinite(audio.duration)?audio.duration:0;playerState.playbackRate=audio.playbackRate;if(event==='play'){playerState.paused=false;transportState='PLAYING';if(onlineTrack)terminalModel.phase('playing',onlineTrack.title);}if(event==='pause'&&!scan&&transportState==='PLAYING'){playerState.paused=true;transportState='PAUSED';if(onlineTrack)terminalModel.phase('ready');}if(event==='durationchange'&&!onlineTrack&&playerState.currentTrack>=0){const t=playerState.playlist[playerState.currentTrack];t.duration=playerState.duration;}if('mediaSession'in navigator){navigator.mediaSession.playbackState=audio.paused?'paused':'playing';try{if(playerState.duration)navigator.mediaSession.setPositionState({duration:playerState.duration,playbackRate:audio.playbackRate,position:Math.min(playerState.currentTime,playerState.duration)});}catch{}}});
audio.addEventListener('ended',()=>{playerState.paused=false;if(playbackLists.active()?.entries.length){if(playerState.repeatMode==='one'){seek(0);play();}else advancePlaybackList(1,true);return;}if(onlineTrack){if(playerState.repeatMode==='one'){seek(0);play();}else{transportState='ONLINE_STOPPED';terminalModel.phase('ready');}return;}if(playerState.repeatMode==='one'){seek(0);play();}else if(playerState.shuffle||playerState.currentTrack<playerState.playlist.length-1||playerState.repeatMode==='all'){selectTrack(nextIndex(1),true);}else transportState='STOPPED';});
audio.addEventListener('error',()=>{if(onlineTrack){onlineTerminal.error('在线播放连接失败，可重新点歌；本地磁带不受影响。');audio.pause();transportState='ONLINE_ERROR';return;}errorText=audio.error?.code===4?'UNSUPPORTED AUDIO CODEC':'TAPE ERROR';audio.pause();setDoorTarget(true);transportState='EJECTED';});
if('mediaSession'in navigator){for(const [action,fn]of Object.entries({play,pause,stop:()=>{transportRequest++;audio.pause();seek(0);playerState.paused=false;transportState='STOPPED';},previoustrack:()=>next(-1),nexttrack:()=>next(1),seekbackward:d=>seek(audio.currentTime-(d.seekOffset||10)),seekforward:d=>seek(audio.currentTime+(d.seekOffset||10)),seekto:d=>seek(d.seekTime)})){try{navigator.mediaSession.setActionHandler(action,fn);}catch{}}}
function decodeID3Text(bytes){if(!bytes.length)return '';const encoding=bytes[0];try{return new TextDecoder(encoding===1?'utf-16':encoding===2?'utf-16be':encoding===3?'utf-8':'iso-8859-1').decode(bytes.slice(1)).replace(/\0/g,'').trim();}catch{return '';}}
async function readMetadata(file,track){try{const bytes=new Uint8Array(await file.slice(0,512*1024).arrayBuffer());if(String.fromCharCode(...bytes.slice(0,3))!=='ID3')return;const version=bytes[3];if(version!==3&&version!==4)return;let p=10;while(p+10<bytes.length){const id=String.fromCharCode(...bytes.slice(p,p+4));if(!/^[A-Z0-9]{4}$/.test(id))break;const b=bytes.slice(p+4,p+8);const size=version===4?((b[0]&127)<<21)|((b[1]&127)<<14)|((b[2]&127)<<7)|(b[3]&127):(b[0]*16777216+b[1]*65536+b[2]*256+b[3]);if(size<=0||p+10+size>bytes.length)break;const data=bytes.slice(p+10,p+10+size);if(id==='TIT2')track.title=decodeID3Text(data)||track.title;if(id==='TPE1')track.artist=decodeID3Text(data)||track.artist;if(id==='TALB')track.album=decodeID3Text(data)||track.album;if(id==='APIC'){let q=1;while(q<data.length&&data[q]!==0)q++;const mime=new TextDecoder().decode(data.slice(1,q));q+=2;const width=data[0]===1||data[0]===2?2:1;while(q+width<=data.length&&(data[q]!==0||(width===2&&data[q+1]!==0)))q+=width;q+=width;if(['image/jpeg','image/png','image/webp'].includes(mime)&&q<data.length&&data.length-q<=2*1024*1024){track.artworkBlob=new Blob([data.slice(q)],{type:mime});track.cover=URL.createObjectURL(track.artworkBlob);}}p+=10+size;}}catch{} }
let importQueue=Promise.resolve();
let importChannel='archive';
function requestImport(channel){importChannel=channel;fileInput.click();}
function addFiles(files,channel='archive'){const batch=[...files];importQueue=importQueue.then(()=>importAudioBatch(batch,channel)).catch(()=>status('AUDIO IMPORT ERROR',3500));return importQueue;}
function probeDuration(url){return new Promise((resolve,reject)=>{const probe=new Audio();const timer=setTimeout(()=>end(new Error('AUDIO LOAD TIMEOUT')),10000);function end(error){clearTimeout(timer);const duration=probe.duration;probe.onloadedmetadata=probe.onerror=null;probe.removeAttribute('src');probe.load();error?reject(error):resolve(Number.isFinite(duration)?duration:0);}probe.onloadedmetadata=()=>end();probe.onerror=()=>end(new Error('UNSUPPORTED AUDIO CODEC'));probe.preload='metadata';probe.src=url;});}
async function archiveRecorderTape(){
 const index=playerState.playlist.findIndex(t=>t.id===recorder.state.trackId);if(index<0||!recorder.output)return;
 const t=playerState.playlist[index],object=recorder.output;cabinet.reveal(index);await waitMotion(150);model.attach(object);const slot=localArchivePosition(index);
 await moveSegment(object,new THREE.Vector3(slot.x,Math.max(slot.y+.9,object.position.y),slot.z),230,.34*cabinet.root.scale.x,-Math.PI/2,cabinet.root.rotation.y);
 await moveSegment(object,slot,160,.34*cabinet.root.scale.x,-Math.PI/2,cabinet.root.rotation.y);
 recorder.clear();t.onRecorder=false;t.updatedAt=Date.now();if(archive.db)await archive.putTrack(t);cabinet.refresh(currentTapeId());mechanicalSound('detent');queueArchiveSave();
}
async function saveRecorderMp3(){const t=playerState.playlist.find(t=>t.id===recorder.state.trackId);if(!t?.audioBlob)return;
 const exportFile=new File([t.audioBlob],(t.title||'Cassette').replace(/[\\/:*?"<>|]/g,'_')+'.mp3',{type:'audio/mpeg'});
 if(device.isIOS&&navigator.canShare?.({files:[exportFile]})){try{await navigator.share({files:[exportFile]});return;}catch(e){if(e.name==='AbortError')return;status('SHARE UNAVAILABLE / DOWNLOADING',4000);}}
 const url=URL.createObjectURL(t.audioBlob),a=document.createElement('a');a.href=url;a.download=(t.title||'Cassette').replace(/[\/:*?"<>|]/g,'_')+'.mp3';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);mechanicalSound('detent');}
function downloadRecordedOne(id){const t=playerState.playlist.find(t=>t.id===id);if(!t?.recorded||t.format!=='MP3'||!t.audioBlob)throw Error('这首歌尚未刻录为 MP3');const url=URL.createObjectURL(t.audioBlob),a=document.createElement('a');a.href=url;a.download=(t.title||'歌曲').replace(/[\\/:*?"<>|]/g,'_')+'.mp3';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);}
async function downloadRecordedBatch(ids,onProgress){
 const chosen=new Set(ids),tracks=playerState.playlist.filter(t=>chosen.has(t.id)&&t.recorded&&t.format==='MP3'&&t.audioBlob);if(!tracks.length)throw Error('没有可下载的已刻录 MP3');const clean=s=>String(s||'未命名').replace(/[\\/:*?"<>|]/g,'_').replace(/^\.+$/,'_').slice(0,100);const names=new Set(),entries=tracks.map(t=>{const base=clean(t.artist)+'/'+clean(t.album)+'/'+clean(t.title);let name=base+'.mp3',n=2;while(names.has(name))name=base+' ('+(n++)+').mp3';names.add(name);return {name,blob:t.audioBlob};});const zip=await createStoredZip(entries,onProgress),url=URL.createObjectURL(zip),a=document.createElement('a');a.href=url;a.download='Cassette-World-MP3.zip';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);return tracks.length;
}
const IMPORT_MIME={mp3:'audio/mpeg',mpga:'audio/mpeg',wav:'audio/wav',wave:'audio/wav',ogg:'audio/ogg',oga:'audio/ogg',opus:'audio/ogg',aac:'audio/aac',m4a:'audio/mp4',m4b:'audio/mp4',mp4:'audio/mp4',flac:'audio/flac',webm:'audio/webm',weba:'audio/webm'};
const formatProbe=document.createElement('audio');
function nativePlayable(blob,ext){const mime=blob.type||IMPORT_MIME[ext]||'';if(!mime)return false;try{return formatProbe.canPlayType(mime)!=='';}catch{return false;}}
// Two independent channels. ARCHIVE keeps the file as encoded when the browser
// can already play it and files the tape straight into the cabinet; RECORDER
// encodes to 192 kbps MP3 (existing MP3 frames are kept) and parks the tape at the C-REC outlet.
async function importAudioBatch(files,channel='archive'){
 const toRecorder=channel==='recorder';
 // iOS may pass files with an unknown UTI; the extension validator below is
 // authoritative, and the recorder should report rejected batches locally.
 await archiveBoot;const accepted=files.filter(f=>!keyFile(f)&&acceptsAudio(f));const lyricFiles=files.filter(f=>/\.lrc$/i.test(f.name));if(!accepted.length&&lyricFiles.length){await importLyrics(lyricFiles);return;}if(!accepted.length){status('AUDIO FILES ONLY',3500);if(toRecorder)recorder.fail('AUDIO FILES ONLY');return;}
 if(navigator.storage?.persist)navigator.storage.persist().catch(()=>{});
 let completed=0,rejected=0,position=0;
 let importKeys;try{if(toRecorder)recorder.progress(0,'READING');importKeys=await loadImportKeys(files);}catch(error){errorText=error.message;if(toRecorder)recorder.fail(errorText);status(errorText,7000);return;}
 for(const file of accepted){let url,t,committed=false;position++;try{
  if(file.size>64*1024*1024)throw new Error('USE AUDIO UNDER 64 MB');
  const stem=file.name.replace(/\.[^.]+$/,'').slice(0,16).toUpperCase();
  if(toRecorder)recorder.progress(0,'READING');else status(`READING ${position}/${accepted.length}  ·  ${stem}`,5000);
  reactPeople('archive');lastInteraction=performance.now();
  const report=(p,phase)=>{if(toRecorder)recorder.progress(p,phase);};
  const unlocked=await unlockAudioFile(file,{keys:importKeys,onProgress:report});
  const sourceFile=unlocked.ext?new File([unlocked.blob],file.name.replace(/\.[^.]+$/,'')+'.'+unlocked.ext,{type:unlocked.blob.type}):file;
  const prepared=await prepareAudio(sourceFile),probeURL=URL.createObjectURL(prepared.blob);let duration;
  try{duration=prepared.duration||await probeDuration(probeURL);}finally{URL.revokeObjectURL(probeURL);}
  const identity=fingerprint(file,duration);if(playerState.playlist.some(t=>t.fingerprint===identity)){if(toRecorder)recorder.fail('ALREADY IN ARCHIVE');status('ALREADY IN ARCHIVE',3500);continue;}
  const ext=file.name.split('.').pop().toLowerCase();
  let blob=prepared.blob,format=prepared.converted?'WAV':(unlocked.ext||ext).toUpperCase(),converted=!!prepared.converted;
  t={id:crypto.randomUUID?.()||String(Date.now()+Math.random()),title:file.name.replace(/\.[^.]+$/,''),artist:'UNKNOWN ARTIST',album:'LOCAL TAPES',duration,format,sourceFormat:ext.toUpperCase(),fileSize:file.size,size:blob.size,mimeType:blob.type||'',audioBlob:blob,originalBlob:null,artworkBlob:null,cover:null,objectURL:url,fingerprint:identity,fileName:file.name,lastModified:file.lastModified,createdAt:Date.now(),updatedAt:Date.now(),converted,recorded:toRecorder,onRecorder:toRecorder,labelStyle:TAPE_COLORS[playerState.playlist.length%5]};
  await readMetadata(sourceFile,t);await readExtendedMetadata(sourceFile,t);t.lyrics=t.lyrics||await readLyricMetadata(sourceFile);t.lyricsRead=true;
  const imported=onlineImportMeta.get(file);if(imported){for(const key of ['title','artist','album','lyrics'])if(imported[key])t[key]=imported[key];t.onlineSource=imported.onlineSource;if(t.lyrics?.cues?.length)t.lyricsOrigin='online';}
  for(const field of ['title','artist','album'])if(typeof unlocked.meta?.[field]==='string'&&unlocked.meta[field])t[field]=unlocked.meta[field];
  if(unlocked.meta?.artworkBlob){if(t.cover)URL.revokeObjectURL(t.cover);t.artworkBlob=unlocked.meta.artworkBlob;t.cover=URL.createObjectURL(t.artworkBlob);}
  const companion=lyricFiles.find(f=>lyricStem(f.name)===lyricStem(file.name));
  if(companion&&companion.size<=MAX_LYRIC_BYTES){const data=parseLyrics(await companion.text());if(data.cues.length){t.lyrics=data;t.lyricsOrigin='lrc';}}
  if(t.lyrics?.cues.length){t.lyricStatus='local';t.lyricsOrigin ||= 'embedded';}
  const pendingLyrics=toRecorder&&onlineLyrics&&!t.lyrics?.cues.length?lyricLookup.lookup(t):Promise.resolve(null);
  if((toRecorder&&format!=='MP3')||!nativePlayable(blob,unlocked.ext||ext)){const encoded=await transcodeMp3(blob,{duration,onProgress:report});blob=encoded.blob;format='MP3';converted=true;duration=encoded.duration;}
  const found=await pendingLyrics;if(found){t.lyricStatus=found.status;if(found.lyrics){t.lyrics=found.lyrics;t.lyricsOrigin='online';t.lyricsProvider=found.provider;t.lyricsRecordId=found.recordId;}}
  url=URL.createObjectURL(blob);Object.assign(t,{audioBlob:blob,objectURL:url,size:blob.size,mimeType:blob.type,duration,format,converted});
  if(toRecorder){blob=await tagMp3(blob,t);URL.revokeObjectURL(url);url=URL.createObjectURL(blob);Object.assign(t,{audioBlob:blob,size:blob.size,mimeType:blob.type,objectURL:url});}
  const related=playerState.playlist.find(r=>albumKey(r)===albumKey(t));if(related?.labelStyle)t.labelStyle=related.labelStyle;
  while(busy||archiveOperation)await new Promise(resolve=>setTimeout(resolve,100));archiveOperation=true;
  if(toRecorder){recorder.progress(1,'FINISHING');await archiveRecorderTape();}
  const legacy=playerState.playlist.find(r=>r.sourceRequired&&(r.fileName===file.name||r.title===t.title));if(legacy){t.id=legacy.id;t.createdAt=legacy.createdAt;t.cabinetSlot=legacy.cabinetSlot;}else t.cabinetSlot=assignSlot(playerState.playlist,t);
  if(archive.db)await archive.putTrack(t);committed=true;
  if(legacy){const at=playerState.playlist.indexOf(legacy);if(legacy.cover)URL.revokeObjectURL(legacy.cover);playerState.playlist[at]=t;}else playerState.playlist.push(t);
  cabinet.rebuild(playerState.playlist,currentTapeId());const index=playerState.playlist.indexOf(t);
  if(toRecorder){await localAlbums.save(t);const output=recorder.makeOutput(t,index);mechanicalSound('tape-out');await moveSegment(output,new THREE.Vector3(.50,.41,1.75),340,.34,-Math.PI/2,0);recorder.ready();status(localAlbums.message,5000);}
  else{cabinet.reveal(index);mechanicalSound('detent');status(`${stem} FILED TO THE ARCHIVE`,3200);}
  errorText='';completed++;reactPeople('archive');
 }catch(error){if(!committed){if(url)URL.revokeObjectURL(url);if(t?.cover)URL.revokeObjectURL(t.cover);}rejected++;const failedExt=(file.name.split('.').pop()||'').toUpperCase();errorText=error.name==='QuotaExceededError'?'ARCHIVE FULL':error.message==='UNSUPPORTED AUDIO CODEC'?`${failedExt} NOT PLAYABLE HERE`:String(error.message||'CONVERSION FAILED');if(toRecorder)recorder.fail(errorText);status(errorText,5000);
 }finally{archiveOperation=false;queueArchiveSave();}}
 if(lyricFiles.length)await importLyrics(lyricFiles,false);
 checkStorage();if(completed){const done=toRecorder?completed+' MP3 READY':completed+' TAPES FILED'+(loaded?'':'  ·  DRAG ONE TO THE DOOR');status(done+(toRecorder?' / '+localAlbums.message:'')+(rejected?' / '+rejected+' SKIPPED':''),5500);}
}
// iOS maps accept strings to UTIs and disables encrypted/local formats that
// have no registered UTI. acceptsAudio() still validates every selected file.
const fileInput=document.querySelector('#files');fileInput.accept=device.isIOS?'':AUDIO_ACCEPT+',.lrc';fileInput.addEventListener('change',()=>{unlockAudio();addFiles(fileInput.files,importChannel);fileInput.value='';});
const lyricInput=document.createElement('input');lyricInput.type='file';lyricInput.accept=device.isIOS?'':'.lrc,text/plain';lyricInput.multiple=true;lyricInput.id='lyric-files';document.body.append(lyricInput);
lyricInput.addEventListener('change',()=>{const batch=[...lyricInput.files];importQueue=importQueue.then(()=>importLyrics(batch)).catch(()=>status('LYRIC IMPORT ERROR'));lyricInput.value='';});
async function importLyrics(files,allowCurrent=true){
 let attached=0;for(const file of files){if(!/\.lrc$/i.test(file.name)||file.size>MAX_LYRIC_BYTES){status('USE LRC UNDER 512 KB',4500);continue;}
 const fallback=allowCurrent&&files.length===1?(cabinet.state.selectedTape||currentTapeId()):null;
 const track=matchLyricTrack(file.name,playerState.playlist,fallback);if(!track){status('LRC: MATCH THE AUDIO FILE NAME',5500);continue;}
 const data=parseLyrics(await file.text());if(!data.cues.length){status('NO LYRICS IN THIS FILE',4500);continue;}
 const record={...track,lyrics:data,lyricsOrigin:'lrc',lyricStatus:'local',lyricsRead:true,updatedAt:Date.now()};if(archive.db)await archive.putTrack(record);Object.assign(track,record);attached++;
 }if(attached){lastInteraction=performance.now();status(attached+' LYRIC SHEETS FILED',4000);queueArchiveSave();}
}
const checkedLyrics=new Set();
function loadStoredLyrics(track){if(!track||track.lyricsRead||track.lyrics||checkedLyrics.has(track.id)||!track.audioBlob)return;checkedLyrics.add(track.id);readLyricMetadata(track.audioBlob).then(async data=>{if(!playerState.playlist.includes(track))return;track.lyricsRead=true;if(data)track.lyrics=data;if(archive.db)await archive.putTrack(track);lastInteraction=performance.now();}).catch(()=>{});}
const TAPE_COLORS=['#c9b779','#a0b4a8','#c59172','#a8a6b8','#d1c7b2'];
function localArchivePosition(index){model.updateMatrixWorld(true);return model.worldToLocal(cabinet.position(index));}
async function moveSegment(object,to,duration,scale=null,rotation=null,yaw=0){const from=object.position.clone(),fromScale=object.scale.x,fromRotation=object.rotation.x,fromYaw=object.rotation.y;duration=Math.max(duration,from.distanceTo(to)*85);await animateMotion(duration,t=>{const u=t*t*t*(t*(t*6-15)+10);object.position.lerpVectors(from,to,u);object.rotation.y=THREE.MathUtils.lerp(fromYaw,yaw,u);if(scale!==null)object.scale.setScalar(THREE.MathUtils.lerp(fromScale,scale,u));if(rotation!==null)object.rotation.x=THREE.MathUtils.lerp(fromRotation,rotation,u);});}
async function returnTape(index){
 cabinet.setTransit(index,true);cabinet.reveal(index);await waitMotion(160);
 const tape=cassette(model,playerState.playlist[index].title,playerState.playlist[index].labelStyle||TAPE_COLORS[index%5]);decorateTape(tape,playerState.playlist[index]);tape.position.copy(loadedTape.position);loadedTape.visible=false;
 const slot=localArchivePosition(index),frontZ=6.2;mechanicalSound('tape-out');
 await moveSegment(tape,new THREE.Vector3(tape.position.x,tape.position.y,frontZ),220);
 await moveSegment(tape,new THREE.Vector3(slot.x,Math.max(slot.y+1.8,3.0,tape.position.y),frontZ),280,.49);
 await moveSegment(tape,new THREE.Vector3(slot.x,slot.y+1.5,slot.z),160);
 await moveSegment(tape,slot,170,.34*cabinet.root.scale.x,-Math.PI/2,cabinet.root.rotation.y);model.remove(tape);disposeGroup(tape);cabinet.refresh(null);cabinet.setTransit(index,false);
}
async function selectTrack(index,autoplay=false){
 if(busy||!playerState.playlist[index])return;if(!ensureTrackURL(index)){status('SOURCE REQUIRED',4500);return;}if(onlineTrack){busy=true;audio.pause();setDoorTarget(true);try{await waitMotion(550);await returnOnlineTape(true);leaveOnline();}finally{busy=false;}}if(loaded&&index===playerState.currentTrack){if(autoplay)play();return;}
 const intent=++transportRequest;busy=true;audio.pause();playerState.paused=false;transportState='TRANSITION';sceneState=exploded?'DISASSEMBLY':'TRANSITION';reactPeople('tape');setDoorTarget(true);
 if(playerState.playlist[index].onRecorder)await archiveRecorderTape();
 await waitMotion(650);if(loaded)await returnTape(playerState.currentTrack);cabinet.reveal(index);await waitMotion(350);
 const target=loadedTape.userData.part.base.clone().add(exploded?loadedTape.userData.part.offset:new THREE.Vector3());
 const origin=localArchivePosition(index),frontZ=9.2,flightY=Math.max(origin.y+1.5,3.0,target.y+.4);
 const tape=cassette(model,playerState.playlist[index].title,playerState.playlist[index].labelStyle||TAPE_COLORS[index%5],.34*cabinet.root.scale.x);decorateTape(tape,playerState.playlist[index]);tape.rotation.y=cabinet.root.rotation.y;tape.rotation.x=-Math.PI/2;tape.position.copy(origin);cabinet.setTransit(index,true);
 await moveSegment(tape,new THREE.Vector3(origin.x,flightY,origin.z),180,.49,0);
 await moveSegment(tape,new THREE.Vector3(origin.x,flightY,frontZ),220);
 await moveSegment(tape,new THREE.Vector3(target.x,flightY,frontZ),410,1);
 await moveSegment(tape,new THREE.Vector3(target.x,target.y,frontZ),180);
 await seatTape(index,tape,target,autoplay,intent);
}
async function seatTape(index,tape,target,autoplay,intent){
 if(onlineTrack)leaveOnline();
 mechanicalSound('tape-in');await moveSegment(tape,target,440);
 model.remove(tape);disposeGroup(tape);loadedTape.position.copy(target);loaded=true;loadedTape.visible=true;
 playerState.currentTrack=index;const tr=playerState.playlist[index];decorateTape(tapeModel,tr);
 audio.src=ensureTrackURL(index);audio.load();cabinet.refresh(tr.id);cabinet.setTransit(index,false);queueArchiveSave();errorText='';importPlate.visible=false;metadataSession(tr);setDoorTarget(false);await waitMotion(650);
 busy=false;sceneState=exploded?'DISASSEMBLY':'FOCUS';if(errorText){transportState='EJECTED';setDoorTarget(true);return;}transportState='TAPE_LOADED';if(autoplay&&intent===transportRequest)play();
}
// A dragged tape stays outside the housing until the door clears its full width.
const dropGuide=group(model,0,3.59,5.08);dropGuide.visible=false;const guideMaterial=mat('#b9be92',.7,0,{emissive:'#637047',emissiveIntensity:.2});
for(const x of [-1.95,1.95])box(dropGuide,.035,2.52,.025,x,0,0,guideMaterial,.006);for(const y of [-1.25,1.25])box(dropGuide,3.94,.035,.025,0,y,0,guideMaterial,.006);
const dropLabel=label(dropGuide,'RELEASE TO LOAD',3.8,.21,0,1.52,.025,{mono:true,color:'#425137',bg:'#e2e4cb'});
function screenPosition(world){const p=world.project(camera);return {x:(p.x+1)*innerWidth/2,y:(1-p.y)*innerHeight/2};}
function tapeZone(){model.updateWorldMatrix(true,false);const points=[[-2.65,1.9],[2.65,1.9],[-2.65,5.6],[2.65,5.6]].map(([x,y])=>screenPosition(model.localToWorld(new THREE.Vector3(x,y,1.7))));return {minX:Math.min(...points.map(p=>p.x)),maxX:Math.max(...points.map(p=>p.x)),minY:Math.min(...points.map(p=>p.y)),maxY:Math.max(...points.map(p=>p.y))};}
function recorderTapePosition(){const at=new THREE.Vector3(.50,.41,.38);recorder.root.updateWorldMatrix(true,false);recorder.root.localToWorld(at);model.updateWorldMatrix(true,false);return model.worldToLocal(at);}
function cabinetScreenZone(){cabinet.root.updateWorldMatrix(true,false);const corners=[];for(const x of [-3.15,3.15])for(const y of [.2,2.05])for(const z of [-1.7,1.7])corners.push(screenPosition(cabinet.root.localToWorld(new THREE.Vector3(x,y,z))));const xs=corners.map(p=>p.x),ys=corners.map(p=>p.y);return {minX:Math.min(...xs),maxX:Math.max(...xs),minY:Math.min(...ys),maxY:Math.max(...ys)};}
function insideCabinetZone(point){if(!point)return false;const zone=cabinetScreenZone(),mx=(zone.maxX-zone.minX)*.05,my=(zone.maxY-zone.minY)*.05;return point.clientX>=zone.minX-mx&&point.clientX<=zone.maxX+mx&&point.clientY>=zone.minY-my&&point.clientY<=zone.maxY+my;}
// A tape can be picked up from the archive drawer or from the recorder outlet.
function beginTapeDrag(index,fromRecorder=false){
 if(busy||exploded||adAnimating||!ensureTrackURL(index)){status(exploded?'ASSEMBLE BEFORE DRAGGING':'WAIT FOR MECHANISM');return false;}
 if(fromRecorder){if(!recorder.output)return false;}
 else if(!libraryTapes[index]?.visible)return false;
 cameraMotion=null;controls.enabled=false;
 const origin=fromRecorder?recorderTapePosition():localArchivePosition(index);
 const object=cassette(model,playerState.playlist[index].title,playerState.playlist[index].labelStyle||TAPE_COLORS[index%5],.34*cabinet.root.scale.x);decorateTape(object,playerState.playlist[index]);object.rotation.x=-Math.PI/2;object.rotation.y=cabinet.root.rotation.y;object.position.copy(origin);
 tapeDrag={index,origin:fromRecorder?'recorder':'drawer',object,target:object.position.clone(),ready:false,readySince:0,doorWasOpen:doorTarget>0,wasPlaying:playerState.playing,wasPaused:playerState.paused,transport:transportState,scene:sceneState,intent:++transportRequest,velocity:new THREE.Vector3(),finishing:false,lifted:false,pointer:null,planeZ:Math.max(5.3,origin.z+1),savedPosition:camera.position.clone(),savedTarget:controls.target.clone()};
 if(fromRecorder)recorder.clear();else cabinet.setTransit(index,true);
 const d=tapeDrag;d.pickup=(async()=>{await moveSegment(object,new THREE.Vector3(origin.x,origin.y+1.5,origin.z),180,.49,0);await moveSegment(object,new THREE.Vector3(origin.x,origin.y+1.5,d.planeZ),140);d.lifted=true;})();
 busy=true;sceneState='TAPE_DRAG';hoverRing.visible=false;infoGroup.visible=false;dropGuide.visible=true;dropLabel.userData.setText('DRAG HERE TO LOAD');reactPeople('tape');status(fromRecorder?'DRAG TO THE DOOR TO LOAD  ·  DROP ON THE CABINET TO FILE':'DRAG TAPE TO THE CASSETTE DOOR',4000);return true;
}
function updateTapeDrag(e){const d=tapeDrag;if(!d||d.finishing)return;d.pointer={clientX:e.clientX,clientY:e.clientY};
 pointer.set(e.clientX/innerWidth*2-1,-e.clientY/innerHeight*2+1);raycaster.setFromCamera(pointer,camera);model.updateWorldMatrix(true,false);
 const localRay=raycaster.ray.clone().applyMatrix4(model.matrixWorld.clone().invert()),at=new THREE.Vector3();const hit=localRay.intersectPlane(new THREE.Plane(new THREE.Vector3(0,0,1),-d.planeZ),at);
 if(hit)d.target.set(THREE.MathUtils.clamp(at.x,-9.5,12.5),THREE.MathUtils.clamp(at.y,1.65,10),d.planeZ);
 const cameraLocal=model.worldToLocal(camera.position.clone()),ready=cameraLocal.z>2.4&&insideTapeZone({x:e.clientX,y:e.clientY},tapeZone(),d.ready);
 if(ready!==d.ready){d.ready=ready;dropGuide.visible=true;dropLabel.userData.setText(ready?'RELEASE TO LOAD':d.origin==='recorder'?'DOOR = LOAD / CABINET = FILE':'DRAG HERE TO LOAD');if(ready){d.readySince=performance.now();setDoorTarget(true);status('RELEASE TO LOAD',5000);mechanicalSound('detent');}else{setDoorTarget(d.doorWasOpen);status(d.origin==='recorder'?'DROP ON THE CABINET TO FILE  ·  ELSEWHERE RETURNS TO C-REC':'RELEASE OUTSIDE TO RETURN',3200);}}
 if(ready)d.target.set(0,3.59,5.3);canvas.style.cursor=ready?'copy':'grabbing';
}
async function finishTapeDrag(drop=false){const d=tapeDrag;if(!d||d.finishing)return;d.finishing=true;dropGuide.visible=false;canvas.style.cursor='grab';const pointerId=down?.id;down=null;drag=null;controls.enabled=true;if(pointerId!==undefined){activePointers.delete(pointerId);try{canvas.releasePointerCapture(pointerId);}catch{}}
 try{
  await d.pickup;
  if(drop&&d.ready){
   const track=playerState.playlist[d.index];
   if(d.origin==='recorder'&&track){track.onRecorder=false;track.updatedAt=Date.now();if(archive.db)await archive.putTrack(track);}
   setDoorTarget(true);audio.pause();playerState.paused=false;transportState='TRANSITION';
   await moveSegment(d.object,new THREE.Vector3(-3.2,6.55,5.3),360,1);await waitMotion(Math.max(0,650-(performance.now()-d.readySince)));
   if(loaded)await returnTape(playerState.currentTrack);else if(onlineLoaded){await returnOnlineTape(false);leaveOnline();}
   const target=loadedTape.userData.part.base.clone();await moveSegment(d.object,new THREE.Vector3(0,6.55,5.3),280,1);await moveSegment(d.object,new THREE.Vector3(0,target.y,5.3),280);
   tapeDrag=null;await seatTape(d.index,d.object,target,d.wasPlaying,d.intent);focusRegion('center');
  }else if(d.origin==='recorder'){
   await returnRecorderTape(d);
  }else{
   const slot=localArchivePosition(d.index);await moveSegment(d.object,new THREE.Vector3(slot.x,Math.max(slot.y+1.6,3.0,d.object.position.y),6.2),240,.49);await moveSegment(d.object,new THREE.Vector3(slot.x,slot.y+1.5,slot.z),150);await moveSegment(d.object,slot,170,.34*cabinet.root.scale.x,-Math.PI/2,cabinet.root.rotation.y);
   model.remove(d.object);disposeGroup(d.object);cabinet.setTransit(d.index,false);tapeDrag=null;busy=false;sceneState=d.scene;setDoorTarget(d.doorWasOpen);playerState.paused=d.wasPaused;transportState=d.transport;if(d.wasPlaying&&d.intent===transportRequest&&audio.paused)play();moveCamera(d.savedPosition,d.savedTarget,650);status('TAPE RETURNED TO ARCHIVE');
  }
 }catch(error){model.remove(d.object);cabinet.setTransit(d.index,false);setDoorTarget(d.origin==='recorder'?d.doorWasOpen:true);tapeDrag=null;busy=false;status('TAPE COULD NOT BE LOADED',3500);console.error(error);}
 renderer.shadowMap.needsUpdate=true;
}
// A tape pulled off the C-REC outlet either files into the cabinet or goes back.
async function returnRecorderTape(d){
 const track=playerState.playlist[d.index],toArchive=insideCabinetZone(d.pointer);
 model.remove(d.object);disposeGroup(d.object);
 if(toArchive){
  if(track){track.onRecorder=false;track.updatedAt=Date.now();if(archive.db)await archive.putTrack(track);}
  cabinet.reveal(d.index);cabinet.refresh(currentTapeId());mechanicalSound('detent');status('TAPE FILED TO THE ARCHIVE');
 }else{
  if(track){recorder.makeOutput(track,d.index);recorder.ready();}
  mechanicalSound('tape-in');status('TAPE RETURNED TO THE RECORDER');
 }
 tapeDrag=null;busy=false;sceneState=d.scene;playerState.paused=d.wasPaused;transportState=d.transport;if(d.wasPlaying&&d.intent===transportRequest&&audio.paused)play();moveCamera(d.savedPosition,d.savedTarget,650);
}
function disposeGroup(g){const shared=new Set(Object.values(M)),materials=new Set();g.traverse(o=>{o.userData.disposed=true;if(o.isMesh){o.geometry.dispose();for(const material of (Array.isArray(o.material)?o.material:[o.material]))if(!shared.has(material))materials.add(material);}});for(const material of materials){material.map?.dispose();material.dispose();}}
window.addEventListener('pagehide',e=>{if(e.persisted)return;for(const t of playerState.playlist){if(t.objectURL)URL.revokeObjectURL(t.objectURL);if(t.cover)URL.revokeObjectURL(t.cover);}});

// Camera rig interpolates spherical coordinates, tracing an arc around the machine.
let cameraMotion=null;
function moveCamera(position,target,duration=1300){cameraMotion={start:performance.now(),duration,fromTarget:controls.target.clone(),toTarget:target.clone(),from:new THREE.Spherical().setFromVector3(camera.position.clone().sub(controls.target)),to:new THREE.Spherical().setFromVector3(position.clone().sub(target))};while(cameraMotion.to.theta-cameraMotion.from.theta>Math.PI)cameraMotion.to.theta-=Math.PI*2;while(cameraMotion.to.theta-cameraMotion.from.theta< -Math.PI)cameraMotion.to.theta+=Math.PI*2;}
function finishIntro(){if(introDone)return;introDone=true;model.position.y=0;props.scale.setScalar(1);sceneState='OVERVIEW';}
function fitRegionPosition(target,offset,width){const distance=fitFocusDistance(width,camera.fov,camera.aspect,offset.length());return target.clone().add(offset.normalize().multiplyScalar(distance));}
function focusMachine(){if(!exploded&&(!focused||!['center','tape'].includes(focusArea)))focusRegion('center');}
function zoneAt(event){const hit=event?pick(event,true):null;if(!hit)return 'center';const point=model.worldToLocal(hit.point.clone());const part=partOf(hit.object);if(part===top||part===handle||part===antenna||point.y>7.0)return 'top';if(part===rear||part===battery||point.z<-.8)return 'back';return point.x< -2.35?'left':point.x>2.35?'right':'center';}
function focusObject(object){
 if(busy||!object)return;finishIntro();let targetObject=object;
 for(let o=object;o&&o!==scene;o=o.parent){targetObject=o;if(o===recorder.root){focusRecorder();return;}if(o===cabinet.root){focusCabinet();return;}if(adPages.some(p=>p.group===o)||o.userData.part||o.parent===props)break;}
 const bounds=new THREE.Box3().setFromObject(targetObject);if(bounds.isEmpty())return;const at=bounds.getCenter(new THREE.Vector3()),size=bounds.getSize(new THREE.Vector3());const isPaper=adPages.some(p=>p.group===targetObject);
 const offset=isPaper?new THREE.Vector3(0,10,5):camera.position.clone().sub(controls.target).normalize().multiplyScalar(8);
 focused=true;focusArea=isPaper?'advertisement':targetObject===lyricWorld.root?'lyrics':'object';sceneState='OBJECT_FOCUS';moveCamera(fitRegionPosition(at,offset,Math.max(3,size.length()*1.15)),at,650);
}
function overview(){if(busy)return;if(exploded){toggleExplode();return;}focused=false;focusArea='overview';sceneState='OVERVIEW';moveCamera(homePosition.clone(),new THREE.Vector3(2,3.2,0));}
function focusRegion(which){
 if(which==='cabinet')return focusCabinet();if(which==='recorder')return focusRecorder();
 if(busy||exploded)return;finishIntro();const region=FOCUS_AREAS[which]||FOCUS_AREAS.center;focusArea=which;focused=true;sceneState='FOCUS';importSlot.visible=true;importSlotLabel.visible=true;
 model.updateWorldMatrix(true,false);const target=model.localToWorld(new THREE.Vector3(...region.target));const offset=new THREE.Vector3(...region.offset);const position=fitRegionPosition(target,offset,region.width*model.scale.x);moveCamera(position,target,1050);
}
let lastService=0;
async function toggleExplode(){
 if(busy||performance.now()-lastService<1000)return;lastService=performance.now();finishIntro();exploded=!exploded;busy=true;sceneState='TRANSITION';focused=true;focusArea=exploded?'service':'center';importSlot.visible=true;importSlotLabel.visible=true;cameraMotion=null;reactPeople('service');mechanicalSound(exploded?'service-open':'service-close');
 const opening=exploded;setDoorTarget(false);const jobs=[];
 for(const p of parts){const data=p.userData.part,to=data.base.clone().add(opening?data.offset:new THREE.Vector3());p.userData.localStage=0;
   const isDriver=speakers.some(s=>s.driver===p),isGrille=speakers.some(s=>s.grille===p);
   jobs.push((async()=>{
     if(p===shell){if(opening){await waitMotion(900);await moveSegment(p,new THREE.Vector3(0,4.13,to.z),560);const from=p.position.clone();await animateMotion(620,t=>{p.position.lerpVectors(from,to,ease(t));p.rotation.x=-1.2*ease(t);});}
       else{await waitMotion(850);const from=p.position.clone(),angle=p.rotation.x;await animateMotion(600,t=>{p.position.lerpVectors(from,new THREE.Vector3(0,4.13,from.z),ease(t));p.rotation.x=angle*(1-ease(t));});await moveSegment(p,to,580);}return;}
     let delay=opening?(p===loadedTape?2110:(isDriver?150:isGrille?0:550)):(isDriver||isGrille?2080:p===fixings?2950:0);
     await waitMotion(delay);
     if(isDriver||isGrille){if(opening){const clear=p.position.clone();clear.z=isDriver?4.15:5.85;await moveSegment(p,clear,370);await moveSegment(p,to,510);}else{const align=to.clone();align.z=isDriver?4.15:5.85;await moveSegment(p,align,500);await moveSegment(p,to,370);}return;}
     await moveSegment(p,to,opening?690:760);
   })());
 }
 moveCamera(opening?new THREE.Vector3(19.5,15.5,30).multiplyScalar(innerWidth/innerHeight<.85?1.8:1):new THREE.Vector3(3.5,6.6,innerWidth/innerHeight<.85?48:18.9),new THREE.Vector3(0,4.15,0),1800);
 await Promise.all(jobs);busy=false;sceneState=opening?'DISASSEMBLY':'FOCUS';if(!opening)mechanicalSound('service-close');renderer.shadowMap.needsUpdate=true;
}
function localSpeaker(grille){if(busy||exploded)return;busy=true;waitMotion(750).then(()=>{busy=false;renderer.shadowMap.needsUpdate=true;});grille.userData.localStage=(grille.userData.localStage+1)%3;const stage=grille.userData.localStage;const s=speakers.find(s=>s.grille===grille);for(const [p,amount]of [[s.grille,stage?1.25:0],[s.driver,stage===2?.66:0]]){const from=p.position.clone();const to=p.userData.part.base.clone();to.z+=amount;tween(700,t=>p.position.lerpVectors(from,to,ease(t)));}}
const infoGroup=group(scene);infoGroup.visible=false;const infoLabel=label(infoGroup,'',2.8,.66,1.78,.45,0,{mono:true,bg:'#e0dfd2',res:768});const lineGeo=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(),new THREE.Vector3(.45,.45,0),new THREE.Vector3(.45,.45,0)]);const infoLine=new THREE.Line(lineGeo,new THREE.LineBasicMaterial({color:'#7a8175',transparent:true,opacity:.7}));infoGroup.add(infoLine);
const hoverRing=new THREE.Mesh(new THREE.RingGeometry(.074,.084,32),new THREE.MeshBasicMaterial({color:'#d1a067',side:THREE.DoubleSide,transparent:true,opacity:.8,depthTest:false}));hoverRing.renderOrder=99;scene.add(hoverRing);hoverRing.visible=false;
const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();
function visibleTree(o){while(o){if(!o.visible)return false;o=o.parent;}return true;}
function actionOf(o){while(o){if(o.userData.action)return {object:o,...o.userData.action};o=o.parent;}return null;}
function partOf(o){while(o){if(o.userData.part)return o;o=o.parent;}return null;}
function pick(event,all=false){pointer.set(event.clientX/innerWidth*2-1,-event.clientY/innerHeight*2+1);raycaster.setFromCamera(pointer,camera);
 const intersections=raycaster.intersectObjects(all?[model]:[model,props],true).filter(h=>visibleTree(h.object)&&(!(actionOf(h.object)?.kind==='ambientLyric')||lyricWorld.isTouchable(actionOf(h.object).value,h.uv)));if(!intersections.length)return null;
 const first=intersections[0];if(all)return first;
 // Opaque housing blocks controls on the other side. Printed decals allow a
 // nearby control surface to be selected without clicking through the cabinet.
 let page=null;for(let o=first.object;o;o=o.parent)if(adPages.some(p=>p.group===o)){page=o;break;}
 const samePage=o=>{if(!page)return true;while(o){if(o===page)return true;o=o.parent;}return false;};
 return intersections.find(h=>h.distance-first.distance<.075&&samePage(h.object)&&actionOf(h.object))||first;
}
function act(action,event){if(!action||busy)return;lastInteraction=performance.now();const {kind,value}=action;
if(kind==='preferenceCard'){preferenceCards.tap();return;}if(kind==='lyrics'){lyricNoteTap(event);return;}if(kind==='ambientLyric')return;
if(kind==='terminal'){onlineTerminal.open();return;}if(kind==='terminalKey'){onlineTerminal.key(value);return;}if(kind==='onlineCard'){onlineTerminal.play();return;}if(kind==='settings'){settings.open();return;}if(kind==='magnifier'){focusCabinet();inspector.active?inspector.close():inspector.open();return;}if(inspector.active&&['track','recorderTape','seek'].includes(kind)){const t=kind==='track'?playerState.playlist[value]:kind==='recorderTape'?playerState.playlist.find(t=>t.id===recorder.state.trackId):playerState.playlist[playerState.currentTrack];if(t)inspector.inspect(t,kind==='seek');if(kind==='track')selectArchiveTape(value);return;}if(kind==='recorderFolder'){chooseAlbumFolder();return;}if(archiveAction(kind,value,event))return;
if(kind==='adFocus'){focusObject(action.object);return;}if(kind==='adNext'){cycleAdvertisement();return;}if(kind==='style'){changeStyle(value);return;}if(kind==='focus'){focusRegion(value||zoneAt(event));return;}if(kind==='explode'){status('DOUBLE TAP + / HOLD TO SERVICE');return;}if(kind==='person'){greetPerson(value);return;}if(kind==='import'){focusCabinet();requestImport('archive');return;}
if(kind==='recorderFocus'){focusRecorder();return;}
if(kind==='button'){if(!focused)focusMachine();if(value==='play')play();else if(value==='pause')playerState.playing?pause():play();else if(value==='stop')stop();else if(value==='next')next(1);else if(value==='prev')next(-1);else if(value==='record'){pulse('record');focusRecorder();requestImport('recorder');}return;}
if(kind==='door'){if(focusArea!=='center'&&focusArea!=='tape'){focusRegion('center');return;}if(!loaded&&!onlineLoaded){if(doorTarget)fileInput.click();else openDoor(true);}else if(doorTarget){openDoor(false);}return;}
if(kind==='seek'){if(doorTarget>.9)unloadTape();return;}if(kind==='knob'){if(value==='volume')status(`VOLUME ${Math.round(playerState.volume*100)}${playerState.muted?'  /  MUTED':''}`);return;}if(kind==='track'){selectArchiveTape(value);return;}if(kind==='selectorState'){applySelector(value.kind,value.index);return;}if(kind==='selector'){applySelector(value,(selectorValue(value)+1)%topSelectors[value].states.length);return;}if(kind==='speaker'){const area=value.position.x<0?'left':'right';if(event?.shiftKey)localSpeaker(value);else focusRegion(area);return;}if(kind==='region'){focusRegion(value);return;}}
let lastLyricTap=null,lastLyricToggle=0,lyricClickTimer=null;
function lyricNoteTap(event={},short=true){
 if(busy||!short)return;const now=performance.now(),double=lastLyricTap&&now-lastLyricTap.time<360&&Math.hypot((event.clientX||0)-lastLyricTap.x,(event.clientY||0)-lastLyricTap.y)<18&&event.pointerType===lastLyricTap.type;
 if(double){clearTimeout(lyricClickTimer);lastLyricTap=null;if(inspector.active)inspector.lower();focusObject(lyricWorld.root);mechanicalSound('paper');return;}
 lastLyricTap={time:now,x:event.clientX||0,y:event.clientY||0,type:event.pointerType};clearTimeout(lyricClickTimer);lyricClickTimer=setTimeout(()=>{lastLyricTap=null;lyricWorld.toggle();mechanicalSound('paper');queueArchiveSave();},360);
}
let down=null,longPress=null,clickTimer=null,lastServiceTap=null,focusArm=null;const activePointers=new Set();
function freezeCamera(){const position=camera.position.clone(),target=controls.target.clone(),damping=controls.enableDamping;controls.enableDamping=false;controls.update();controls.enableDamping=damping;camera.position.copy(position);controls.target.copy(target);controls.enabled=false;}
function knobScreen(type){const p=knobs[type].part.getWorldPosition(new THREE.Vector3()).project(camera);return {x:(p.x+1)*innerWidth/2,y:(1-p.y)*innerHeight/2};}
function setKnob(type,raw,fine=false){const knob=knobs[type];let v=THREE.MathUtils.clamp(raw,0,1);if(type!=='volume'&&Math.abs(v-.5)<(fine?.005:.012))v=.5;knob.value=v;
 if(type==='volume')setVolume(v);else{playerState[type]=(v-.5)*24;syncAudio();status(`${type.toUpperCase()} ${playerState[type].toFixed(1)} dB${fine?' FINE':''}`);}
 const detent=Math.round(v*40),now=performance.now();if(detent!==knob.lastDetent&&now-knob.lastTick>55){mechanicalSound('detent');knob.lastTick=now;knob.lastDetent=detent;}
 reactPeople('knob',knob.part.getWorldPosition(new THREE.Vector3()));
}
canvas.addEventListener('pointerdown',e=>{
 if(!bootReady)return;
 if(terminalView){e.stopImmediatePropagation();e.preventDefault();if(terminalView.mode!=='held')return;const h=pick(e),a=h?actionOf(h.object):null;let inside=false;for(let o=h?.object;o;o=o.parent)if(o===terminalModel.root)inside=true;if(!inside){onlineTerminal.close();return;}if(a?.kind==='terminalKey'){terminalPointer={id:e.pointerId,key:a.value};terminalModel.press(a.value);canvas.setPointerCapture(e.pointerId);}else if(a?.kind==='onlineCard')onlineTerminal.play();return;}
 finishIntro();unlockAudio();lastInteraction=performance.now();cameraMotion=null;activePointers.add(e.pointerId);
 if(activePointers.size>1){if(tapeDrag)finishTapeDrag(false);clearTimeout(longPress);focusArm=null;lastServiceTap=null;down=null;drag=null;endScan();controls.enabled=true;return;}
 const hit=pick(e);let a=hit?actionOf(hit.object):null;if(!a&&hit&&partOf(hit.object))a={kind:'focus',value:zoneAt(e),object:partOf(hit.object)};
 if(lastLyricTap&&performance.now()-lastLyricTap.time<360&&Math.hypot(e.clientX-lastLyricTap.x,e.clientY-lastLyricTap.y)<18&&e.pointerType===lastLyricTap.type)a={kind:'lyrics',object:lyricWorld.root};
 if(inspector.active&&(a?.kind==='track'||a?.kind==='recorderTape'))inspector.lower();
 lyricWorld.setHovered(a?.kind==='ambientLyric'?a.value:-1);
 down={x:e.clientX,y:e.clientY,time:performance.now(),a,hit:hit?.object,id:e.pointerId,moved:false};
 if(a&&a.kind!=='focus'&&!busy){freezeCamera();canvas.setPointerCapture(e.pointerId);}
 if(a&&!busy&&(['terminalKnob','knob','eq','seek','track','recorderTape','selector','selectorState','drawer'].includes(a.kind)||(a.kind==='door'&&(loaded||onlineLoaded)&&!doorTarget)||(a.kind==='button'&&['ff','rew'].includes(a.value)))){
  if(a.kind==='button')startScan(a.value==='ff'?1:-1);
  else{const center=a.kind==='knob'?knobScreen(a.value):null;drag={...a,startX:e.clientX,startY:e.clientY,lastX:e.clientX,lastY:e.clientY,startValue:a.kind==='knob'?knobs[a.value].value:a.kind==='eq'?playerState.eq[a.value]:playerState.currentTime,rawValue:a.kind==='knob'?knobs[a.value].value:0,center,lastAngle:center?Math.atan2(e.clientX-center.x,center.y-e.clientY):0,axis:e.altKey?'angular':null,activated:false};}
 }
 if(a?.kind==='explode'&&!busy)longPress=setTimeout(()=>{if(down&&!down.moved&&activePointers.size===1){lastServiceTap=null;down=null;drag=null;controls.enabled=true;toggleExplode();}},950);
 else if(a?.kind!=='lyrics'&&a?.kind!=='ambientLyric'&&!busy&&focusArm&&performance.now()-focusArm.time<1400&&(Math.hypot(e.clientX-focusArm.x,e.clientY-focusArm.y)<22||partOf(hit?.object)&&partOf(hit.object)===partOf(focusArm.object))){
  const object=focusArm.object;focusArm=null;freezeCamera();status('HOLD TO FOCUS',1000);
  longPress=setTimeout(()=>{if(down&&!down.moved&&activePointers.size===1){endScan();down=null;drag=null;controls.enabled=true;focusObject(object);mechanicalSound('detent');}},650);
 }
},{capture:true});
canvas.addEventListener('pointermove',e=>{
 if(terminalView){e.stopImmediatePropagation();return;}
 lastInteraction=performance.now();if(down&&e.pointerId===down.id&&Math.hypot(down.x-e.clientX,down.y-e.clientY)>(e.pointerType==='touch'?8:3)){down.moved=true;clearTimeout(longPress);focusArm=null;lastServiceTap=null;if(!tapeDrag)cameraMotion=null;}
 if(down?.id===e.pointerId&&drag?.kind==='drawer'){if(Math.hypot(e.clientX-drag.startX,e.clientY-drag.startY)>16){if(!drag.activated){drag.activated=true;toggleDrawer(drag.value,e.clientY>drag.startY);}return;}return;}
 if(down?.id===e.pointerId&&(drag?.kind==='track'||drag?.kind==='recorderTape')){
  if(!tapeDrag&&Math.hypot(e.clientX-drag.startX,e.clientY-drag.startY)>6)beginTapeDrag(drag.value,drag.kind==='recorderTape');
  if(tapeDrag)updateTapeDrag(e);return;
 }

 if(drag&&!busy&&down?.id===e.pointerId){
  const totalX=e.clientX-drag.startX,totalY=e.clientY-drag.startY;
  if(!drag.activated&&Math.hypot(totalX,totalY)<3)return;
  if(!drag.activated){drag.activated=true;if(!drag.axis)drag.axis=Math.abs(totalY)>=Math.abs(totalX)*.8?'vertical':'horizontal';}
  const dx=e.clientX-drag.lastX,dy=drag.lastY-e.clientY,fine=e.shiftKey?.2:1;
  if(drag.kind==='selector'||drag.kind==='selectorState'){dragSelector(drag.kind==='selector'?drag.value:drag.value.kind,e);}
  else if(drag.kind==='terminalKnob'){drag.tunerDistance=(drag.tunerDistance||0)+dy+dx;const steps=Math.trunc(drag.tunerDistance/18);if(steps){onlineTerminal.step(steps);drag.tunerDistance-=steps*18;mechanicalSound('detent');}}
  else if(drag.kind==='knob'){
    let change;if(drag.axis==='angular'){const angle=Math.atan2(e.clientX-drag.center.x,drag.center.y-e.clientY);let delta=angle-drag.lastAngle;while(delta>Math.PI)delta-=Math.PI*2;while(delta< -Math.PI)delta+=Math.PI*2;change=Math.hypot(e.clientX-drag.center.x,e.clientY-drag.center.y)>8?THREE.MathUtils.clamp(delta,-.4,.4)/(Math.PI*1.5):0;drag.lastAngle=angle;}
    else change=drag.axis==='vertical'?dy/(mobile?190:260):dx/(mobile?230:320);
    drag.rawValue=THREE.MathUtils.clamp(drag.rawValue+change*fine,0,1);setKnob(drag.value,drag.rawValue,e.shiftKey);canvas.style.cursor='grabbing';
  }else if(drag.kind==='eq'){playerState.eq[drag.value]=THREE.MathUtils.clamp(playerState.eq[drag.value]+dy/7*fine,-12,12);syncAudio();status(`${[60,250,'1K','4K','12K'][drag.value]} Hz ${playerState.eq[drag.value].toFixed(1)}dB`);}
  else if(doorTarget<.9)seek(drag.startValue+totalX/350*playerState.duration);
  drag.lastX=e.clientX;drag.lastY=e.clientY;return;
 }
 const hit=pick(e,exploded);hover=hit?(exploded?partOf(hit.object):actionOf(hit.object)):null;
 lyricWorld.setHovered(!down&&e.pointerType!=='touch'&&hover?.kind==='ambientLyric'?hover.value:down?.a?.kind==='ambientLyric'&&!down.moved?down.a.value:-1);
 canvas.style.cursor=hover?.kind==='knob'?'ns-resize':hover?'pointer':'grab';hoverRing.visible=!!hover&&!exploded&&!['ambientLyric','lyrics'].includes(hover?.kind);
 if(hoverRing.visible){hoverRing.position.copy(hit.point);hoverRing.quaternion.copy(camera.quaternion);}
 infoGroup.visible=!!hover&&exploded;if(infoGroup.visible){infoGroup.position.copy(hit.point);infoGroup.quaternion.copy(camera.quaternion);infoLabel.userData.setText(`PART ${String(hover.userData.part.id).padStart(3,'0')}\n${hover.userData.part.name.split(' · ')[1]}`);}
});
function release(e){
 if(terminalView||terminalPointer){e.stopImmediatePropagation();if(terminalPointer?.id===e.pointerId){const k=terminalPointer.key;terminalPointer=null;try{canvas.releasePointerCapture(e.pointerId);}catch{}onlineTerminal.key(k);}return;}
 lyricWorld.setHovered(-1);clearTimeout(longPress);activePointers.delete(e.pointerId);if(down&&down.id!==e.pointerId)return;
 const released=down,wasScan=!!scan;endScan();controls.enabled=true;drag=null;down=null;try{canvas.releasePointerCapture(e.pointerId);}catch{}
 if(tapeDrag&&!tapeDrag.finishing){updateTapeDrag(e);finishTapeDrag(tapeDrag.ready&&activePointers.size===0);return;}
 if(!released||released.moved||wasScan||activePointers.size)return;
 const a=released.a,now=performance.now();
 if(a?.kind==='explode'){
  const deliberate=lastServiceTap&&now-lastServiceTap.time<340&&now-lastServiceTap.time>65&&Math.hypot(lastServiceTap.x-e.clientX,lastServiceTap.y-e.clientY)<9&&now-released.time<240;
  if(deliberate){lastServiceTap=null;toggleExplode();}else{lastServiceTap={time:now,x:e.clientX,y:e.clientY};status('DOUBLE TAP + / HOLD TO SERVICE');}return;
 }
 lastServiceTap=null;
 if(released.hit&&!['ambientLyric','lyrics','preferenceCard'].includes(a?.kind)&&now-released.time<350)focusArm={time:now,x:e.clientX,y:e.clientY,object:released.hit};
 if(exploded&&(!a||['focus','speaker','region'].includes(a.kind))){const hit=pick(e,true),p=hit?partOf(hit.object):null;if(p&&!busy){const at=p.getWorldPosition(new THREE.Vector3()),direction=camera.position.clone().sub(controls.target).normalize();moveCamera(at.clone().addScaledVector(direction,10),at,900);sceneState='PART_FOCUS';}return;}
 if(a?.kind==='lyrics'){lyricNoteTap(e,now-released.time<300);return;}
 if(a)act(a,e);
}
canvas.addEventListener('pointerup',release,{capture:true});
canvas.addEventListener('pointerleave',()=>{lyricWorld.setHovered(-1);hoverRing.visible=false;});
canvas.addEventListener('pointercancel',e=>{lyricWorld.setHovered(-1);if(tapeDrag)finishTapeDrag(false);activePointers.delete(e.pointerId);clearTimeout(longPress);down=null;drag=null;focusArm=null;lastServiceTap=null;endScan();controls.enabled=!terminalView;});
window.addEventListener('blur',()=>{lyricWorld.setHovered(-1);if(tapeDrag)finishTapeDrag(false);for(const [code,held]of Object.entries(heldArrows)){clearTimeout(held.timer);delete heldArrows[code];}activePointers.clear();clearTimeout(longPress);focusArm=null;lastServiceTap=null;endScan();drag=null;down=null;controls.enabled=!terminalView;});
canvas.addEventListener('dblclick',e=>{e.preventDefault();if(performance.now()-lastLyricToggle<500||actionOf(pick(e)?.object)?.kind==='lyrics')return;if(!busy&&!pick(e,true)&&!pick(e))overview();});
canvas.addEventListener('wheel',e=>{if(terminalView){e.preventDefault();e.stopImmediatePropagation();return;}const hit=pick(e),a=hit?actionOf(hit.object):null;if(a?.kind==='terminalKnob'&&!busy){e.preventDefault();e.stopImmediatePropagation();onlineTerminal.step(Math.sign(e.deltaY));return;}if(a?.kind==='knob'&&!busy){e.preventDefault();e.stopImmediatePropagation();unlockAudio();lastInteraction=performance.now();cameraMotion=null;setKnob(a.value,knobs[a.value].value-Math.sign(e.deltaY)*(e.shiftKey?.003:.015),e.shiftKey);}}, {passive:false,capture:true});
canvas.addEventListener('contextmenu',e=>e.preventDefault());
controls.addEventListener('start',()=>{lastInteraction=performance.now();cameraMotion=null;});
let dragDepth=0;window.addEventListener('dragenter',e=>{e.preventDefault();dragDepth++;finishIntro();focusCabinet();status('DROP TO FILE INTO THE ARCHIVE');});window.addEventListener('dragover',e=>{e.preventDefault();e.dataTransfer.dropEffect='copy';});window.addEventListener('dragleave',e=>{e.preventDefault();dragDepth=Math.max(0,dragDepth-1);});window.addEventListener('drop',e=>{e.preventDefault();unlockAudio();dragDepth=0;addFiles(e.dataTransfer.files,'archive');});
const heldArrows={};function wallpaperOrbit(active){if(!wallpaperMode)return;controls.enabled=active;controls.enableZoom=active;if(!active)controls.resetState?.();}window.addEventListener('keydown',e=>{if(e.key==='Alt')wallpaperOrbit(true);if(settings.active){if(e.code==='Escape')settings.close();return;}if(inspector.active&&e.code==='Escape'){inspector.close();return;}if(e.target.closest?.('#online-terminal'))return;if(onlineTerminal.active&&e.code==='Escape'){onlineTerminal.close();return;}if(onlineTerminal.active&&!e.target.closest?.('input,textarea')){const k={ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right',Enter:'confirm',Backspace:'back'}[e.code];if(k){e.preventDefault();onlineTerminal.key(k);return;}}if(e.target.closest?.('#tape-inspector')||e.target.tagName==='INPUT'||e.metaKey||e.ctrlKey)return;lastInteraction=performance.now();finishIntro();unlockAudio();if(['Space','ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.code))e.preventDefault();if(e.repeat&&!['ArrowUp','ArrowDown'].includes(e.code))return;switch(e.code){case'Space':playerState.playing?pause():play();break;case'KeyL':lyricWorld.toggle();queueArchiveSave();break;case'KeyS':stop();break;case'KeyE':eject();break;case'KeyM':mute();break;case'KeyX':toggleExplode();break;case'Escape':case'Digit0':if(tapeDrag)finishTapeDrag(false);else overview();break;case'Digit1':focusRegion('left');break;case'Digit2':focusRegion('center');break;case'Digit3':focusRegion('right');break;case'Digit4':focusRegion('top');break;case'ArrowUp':setVolume(Math.min(1,playerState.volume+.04));break;case'ArrowDown':setVolume(Math.max(0,playerState.volume-.04));break;case'ArrowLeft':case'ArrowRight':heldArrows[e.code]={time:performance.now(),timer:setTimeout(()=>startScan(e.code==='ArrowRight'?1:-1),230)};break;}});
window.addEventListener('keyup',e=>{if(e.key==='Alt')wallpaperOrbit(false);const held=heldArrows[e.code];if(held){clearTimeout(held.timer);if(performance.now()-held.time<230)next(e.code==='ArrowRight'?1:-1);else endScan();delete heldArrows[e.code];}});window.addEventListener('blur',()=>wallpaperOrbit(false));

// One render loop reads the same state as pointer, keyboard and system media controls.
function formatTime(t){if(!Number.isFinite(t))return '00:00';return `${Math.floor(t/60).toString().padStart(2,'0')}:${Math.floor(t%60).toString().padStart(2,'0')}`;}
function rms(analyser,buffer){analyser.getByteTimeDomainData(buffer);let sum=0;for(const n of buffer)sum+=((n-128)/128)**2;return Math.sqrt(sum/buffer.length);}
let previous=performance.now(),lastFrame=0,cableCheck=0,targetFrameRate=60;
let shadowTick=0,fps=60,beltTravel=0,mechanismShadowDirty=false;
const beltCurve=belt.children.find(o=>o.userData.path)?.userData.path;
const cabinetBounds=new THREE.Box3(new THREE.Vector3(-7.45,.20,-1.95),new THREE.Vector3(7.45,7.48,2.0));
const serviceBounds=parts.filter(p=>[shell,rear,top,leftside,rightside,...speakers.flatMap(s=>[s.grille,s.driver])].includes(p)).map(p=>{p.updateWorldMatrix(true,true);const box=new THREE.Box3().setFromObject(p);box.min.sub(p.position);box.max.sub(p.position);box.expandByScalar(.24);return {p,box};});
function pushOutside(point,box){if(!box.containsPoint(point))return;const candidates=[['x',box.min.x-.04],['x',box.max.x+.04],['y',box.max.y+.04],['z',box.min.z-.04],['z',box.max.z+.04]];candidates.sort((a,b)=>Math.abs(a[1]-point[a[0]])-Math.abs(b[1]-point[b[0]]));point[candidates[0][0]]=candidates[0][1];}
function constrainCamera(){camera.position.y=Math.max(.58,camera.position.y);if(!exploded){model.updateWorldMatrix(true,false);const local=model.worldToLocal(camera.position.clone());pushOutside(local,cabinetBounds);camera.position.copy(model.localToWorld(local));}else for(const {p,box}of serviceBounds){const local=p.worldToLocal(camera.position.clone());if(box.containsPoint(local)){pushOutside(local,box);camera.position.copy(p.localToWorld(local));}}camera.lookAt(controls.target);}

function frame(now){requestAnimationFrame(frame);if(!bootReady||document.hidden||(wallpaperMode&&window.__wallpaperSleeping)){previous=now;return;}targetFrameRate=wallpaperMode?(window.__wallpaperInactive?15:(busy||down||cameraMotion||tapeDrag||now-lastInteraction<1800?45:playerState.playing?30:24)):(busy||down||cameraMotion||terminalView?.mode==='enter'||terminalView?.mode==='exit'||preferenceCards.moving||lyricWorld.moving||lensMotion.moving||adAnimating||recorder.state.phase==='encoding'||!introDone||now-lastInteraction<1500?60:playerState.playing?30:20);if(recorder.state.phase==='encoding'&&!busy&&!down&&!cameraMotion)targetFrameRate=30;if(now-lastFrame<1000/targetFrameRate-.5)return;lastFrame=now;renderer.info.reset();const dt=Math.min((now-previous)/1000,.05);previous=now;fps=THREE.MathUtils.damp(fps,1/Math.max(dt,.001),2,dt);if(now-shadowTick>(wallpaperMode?180:100)&&(!introDone||busy||adAnimating||Math.abs(door.rotation.x-doorTarget)>.001||lyricWorld.paperMoving||people.some(p=>p.until>now))){renderer.shadowMap.needsUpdate=true;shadowTick=now;}
const recorderMoving=recorder.tick(dt,now),cabinetMoving=cabinet.tick(dt,now,exploded);
if(terminalModel.tick(dt)||recorderMoving||cabinetMoving)mechanismShadowDirty=true;
if(mechanismShadowDirty&&now-shadowTick>100){renderer.shadowMap.needsUpdate=true;shadowTick=now;mechanismShadowDirty=false;}
for(let i=timelines.length-1;i>=0;i--){const tw=timelines[i],t=(now-tw.start)/tw.duration;if(t<0)continue;tw.update(Math.min(1,t));if(t>=1){timelines.splice(i,1);tw.complete?.();}}
if(!introDone){const t=THREE.MathUtils.clamp((now-introStart)/3000,0,1);model.position.y=-8*(1-easeOut(t));props.scale.setScalar(Math.max(.001,ease(THREE.MathUtils.clamp((t-.45)/.5,0,1))));handle.rotation.z=Math.sin(t*18)*.006*(1-t);antenna.rotation.z=Math.sin(t*23)*.016*(1-t);if(t>=1){finishIntro();camera.position.copy(homePosition);}}
if(cameraMotion){const m=cameraMotion,t=Math.min(1,(now-m.start)/m.duration),u=ease(t);controls.target.lerpVectors(m.fromTarget,m.toTarget,u);const s=new THREE.Spherical(THREE.MathUtils.lerp(m.from.radius,m.to.radius,u),THREE.MathUtils.lerp(m.from.phi,m.to.phi,u),THREE.MathUtils.lerp(m.from.theta,m.to.theta,u));camera.position.copy(controls.target).add(new THREE.Vector3().setFromSpherical(s));if(t===1)cameraMotion=null;}
if(false&&!cameraMotion&&!down&&now-lastInteraction>18000&&!busy){const axis=camera.position.clone().sub(controls.target);axis.applyAxisAngle(new THREE.Vector3(0,1,0),Math.sin(now*.00012)*dt*.0012);camera.position.copy(controls.target).add(axis);}
if(tapeDrag&&!tapeDrag.finishing){const d=tapeDrag;const center=model.localToWorld(new THREE.Vector3(THREE.MathUtils.clamp(d.object.position.x*.32,0,3),4.1,3.4));const desired=fitRegionPosition(center,new THREE.Vector3(1.4,7,19),Math.max(14,Math.abs(d.object.position.x)+7));const u=1-Math.exp(-4*dt);controls.target.lerp(center,u);camera.position.lerp(desired,u);camera.lookAt(controls.target);camera.updateMatrixWorld();if(d.pointer)updateTapeDrag(d.pointer);}
if(terminalView)updateTerminalCamera(now,dt);else{controls.target.x=THREE.MathUtils.clamp(controls.target.x,-10,15);controls.target.y=THREE.MathUtils.clamp(controls.target.y,inspector.active?-3:1,10);controls.target.z=THREE.MathUtils.clamp(controls.target.z,-9,8);if(controls.enabled)controls.update();constrainCamera();}lensMotion.tick(dt);
const hinge=springStep(door.rotation.x,doorVelocity,doorTarget,dt,85,18,0,OPEN_ANGLE);door.rotation.x=hinge.position;doorVelocity=hinge.velocity;if((loaded||onlineLoaded)&&!busy){const d=loadedTape.userData.part;loadedTape.position.z=THREE.MathUtils.damp(loadedTape.position.z,d.base.z+(exploded?d.offset.z:0)+(doorTarget>.9?.36:0),9,dt);}
if(scan&&(loaded||onlineTrack))seek(audio.currentTime+scan*dt*16);
let bass=0,left=0,right=0;if(analyser&&playerState.playing&&!scan){analyser.getByteFrequencyData(spectrum);const bins=Math.max(2,Math.round(220/(context.sampleRate/512)));for(let i=1;i<bins;i++)bass+=spectrum[i]/255; bass/=bins-1;left=Math.min(1,rms(analyserL,waveL)*3.5);right=Math.min(1,rms(analyserR,waveR)*3.5);}
smoothBass=THREE.MathUtils.damp(smoothBass,bass,bass>smoothBass?17:9,dt);smoothLevelL=THREE.MathUtils.damp(smoothLevelL,left,left>smoothLevelL?20:5,dt);smoothLevelR=THREE.MathUtils.damp(smoothLevelR,right,right>smoothLevelR?20:5,dt);
vuNeedles[0].rotation.z=1.05-smoothLevelL*2.05;vuNeedles[1].rotation.z=1.05-smoothLevelR*2.05;
drive=THREE.MathUtils.damp(drive,scan?scan*16:playerState.playing?1:0,14,dt);const tapeDuration=playerState.duration;const progress=tapeDuration?THREE.MathUtils.clamp(playerState.currentTime/tapeDuration,0,1):0;
const tapeData=tapeModel.userData,radii=tapeRadii(progress);if(Math.abs(progress-tapeData.ribbonProgress)>.00005){updateRibbon(tapeData.tapePath.geometry,progress);tapeData.ribbonProgress=progress;}
tapeData.spool.forEach(({reel,wound,layers},i)=>{const r=radii[i];wound.scale.set(r/.58,1,r/.58);layers.scale.set(r/.58,r/.58,1);reel.rotation.z-=dt*drive*.8/(r+.15);});
tapeData.mechanism.position.z=THREE.MathUtils.damp(tapeData.mechanism.position.z,exploded&&!busy?.65:0,12,dt);
if(introDone&&(busy||now-cableCheck>1000)){cableCheck=now;}

tapeModel.userData.guideRollers.forEach(g=>g.rotation.z-=dt*drive*5);gears.forEach((g,i)=>g.rotation.z+=dt*drive*(i%2?1:-1)*(1.3+i*.1));beltTravel+=dt*drive*.22;if(beltCurve){const u=(beltTravel%1+1)%1;beltMarker.position.copy(beltCurve.getPointAt(u));const tangent=beltCurve.getTangentAt(u);beltMarker.rotation.z=Math.atan2(tangent.y,tangent.x);}
cones.forEach((g,i)=>g.position.z=Math.sin(now*.12+i*.07)*smoothBass*.038);head.position.y=THREE.MathUtils.damp(head.position.y,playerState.playing?.09:0,12,dt);
if(introDone){model.position.y=styleGroundOffset+Math.sin(now*.12)*smoothBass*.004;updateLadder(model.position.y);}
people.forEach((p,i)=>{
 const active=now<p.until,pulse=active?Math.sin(Math.min(1,(p.until-now)/400)*Math.PI/2):0,t=now*.001;
 const listen=playerState.playing&&p.respond,activity=active?p.activity:'idle';
 p.body.rotation.x=THREE.MathUtils.damp(p.body.rotation.x,listen?Math.sin(t*3.2+p.phase)*smoothBass*.045:0,9,dt);
 p.head.rotation.x=THREE.MathUtils.damp(p.head.rotation.x,listen?Math.sin(t*4+p.phase)*smoothBass*.13:activity==='point'?-.18:0,8,dt);
 let yaw=0;if(active&&p.look){const target=p.g.worldToLocal(p.look.clone());yaw=THREE.MathUtils.clamp(Math.atan2(target.x,target.z),-.75,.75);}
 p.head.rotation.y=THREE.MathUtils.damp(p.head.rotation.y,yaw,7,dt);
 p.arms.forEach((arm,j)=>{if(p.pose==='climb'){arm.rotation.set(0,0,0);return;}let x=p.armBase,z=0;
  if(activity==='wave'&&j===1){z=(2.2+Math.sin(t*10)*.25)*pulse;x=-.3;}
  else if(activity==='point'&&j===1){x=-1.6*pulse;z=-.22*pulse;}
  else if(activity==='balance'){z=(j?1:-1)*.65*pulse;x=-.25*pulse;}
  else if(p.pose==='work'&&j===1){x=p.armBase+Math.sin(t*1.6+p.phase)*.10;}
  arm.rotation.x=THREE.MathUtils.damp(arm.rotation.x,x,11,dt);arm.rotation.z=THREE.MathUtils.damp(arm.rotation.z,z,11,dt);
 });
 p.legs.forEach(leg=>{leg.rotation.x=0;});
});coffee.rotation.z=Math.sin(now*.075)*smoothBass*.008;
lamps.forEach((m,i)=>{const lit=playerState.playing&&spectrum[Math.min(255,2+i*8)]/255>(i%7+1)/9;m.emissiveIntensity=THREE.MathUtils.damp(m.emissiveIntensity,lit?.7:.02,12,dt);});pcbLED.emissiveIntensity=.12+smoothLevelL*.6;
for(const [id,g]of Object.entries(buttons)){const held=id==='play'?playerState.playing:id==='pause'?playerState.paused:id==='ff'?scan>0:id==='rew'?scan<0:false;const pressed=held||g.userData.pulse>now;const spring=springStep(g.position.z,g.userData.velocity||0,pressed?KEY_REST-KEY_TRAVEL:KEY_REST,dt,650,45,KEY_REST-KEY_TRAVEL,KEY_REST);g.position.z=spring.position;g.userData.velocity=spring.velocity;}
for(const n of Object.values(knobs)){n.displayValue=THREE.MathUtils.damp(n.displayValue,n.value,24,dt);n.rot.rotation.z=-(n.displayValue-.5)*Math.PI*1.5;}
preferenceCards.update(dt);eqSliders.forEach((g,i)=>g.position.y=THREE.MathUtils.damp(g.position.y,.035+playerState.eq[i]/12*.25,20,dt));
for(const [kind,selector]of Object.entries(topSelectors)){const index=selectorValue(kind);selector.tab.position.x=THREE.MathUtils.damp(selector.tab.position.x,-.47+index*.94/(selector.states.length-1),18,dt);if(index!==selector.lastIndex){selector.marks.forEach((mark,i)=>mark.userData.setInk(i===index?'#f0c681':'#9ca69d'));selector.lastIndex=index;}}

activeCounter=THREE.MathUtils.damp(activeCounter,progress*999,12,dt);digitRollers.forEach((g,i)=>{const divisor=10**(2-i);let value=activeCounter/divisor;const whole=Math.floor(value),frac=value-whole;value=i===2?value:whole+Math.max(0,(frac-.94)/.06);g.rotation.x=value*Math.PI*2/10;});
if(now-displayTick>130){displayTick=now;let text=errorText||((now<statusUntil)?transientStatus:(playerState.muted||playerState.volume<=0)?(loaded?`${playerState.muted?'MUTED':'VOL 0'}  ${String(playerState.currentTrack+1).padStart(2,'0')} ${formatTime(playerState.currentTime)} / ${formatTime(playerState.duration)}`:'SPEAKERS OFF'):onlineTrack?`ONLINE ${formatTime(playerState.currentTime)} / ${formatTime(playerState.duration)}`:loaded?`${String(playerState.currentTrack+1).padStart(2,'0')} ${formatTime(playerState.currentTime)} / ${formatTime(playerState.duration)}`:focused?'NO TAPE   /   EJECT':'STANDBY   —   C82');if(text!==lastDisplay){lcd.userData.setText(text);lastDisplay=text;}}
const lyricTrack=onlineTrack||(loaded?playerState.playlist[playerState.currentTrack]:null);if(!onlineTrack)loadStoredLyrics(lyricTrack);lyricWorld.update(dt,lyricTrack,playerState.currentTime);
onlineTerminal.anchor();
ledMaterial.emissiveIntensity=playerState.playing?.8:.18;
if(tapeDrag&&!tapeDrag.finishing&&tapeDrag.lifted){const d=tapeDrag;smoothTapeMotion(d.object.position,d.velocity,d.target,dt);d.object.scale.setScalar(THREE.MathUtils.damp(d.object.scale.x,d.ready?1:.62,12,dt));}
if(dragDepth)M.smoke.opacity=.34;else M.smoke.opacity=.2;
lensOptics.render(now,lensMotion.phase==='held');
const needsBokeh=!wallpaperMode&&!mobile&&focused&&!cameraMotion&&sceneState==='PART_FOCUS'&&!lensMotion.active;
if(needsBokeh||renderQuality){if(!composer)createFocusComposer();bokeh.enabled=needsBokeh;bokeh.uniforms.focus.value=camera.position.distanceTo(controls.target);composer.render();}
else{destroyComposer();renderer.render(scene,camera);}}
renderer.shadowMap.needsUpdate=true;
requestAnimationFrame(frame);


let terminalView=null,terminalPointer=null;
function terminalPose(){
 terminalModel.root.updateWorldMatrix(true,false);const vv=window.visualViewport,w=vv?.width||innerWidth,h=vv?.height||innerHeight,ox=vv?.offsetLeft||0,oy=vv?.offsetTop||0;
 const up=new THREE.Vector3(0,0,-1).applyQuaternion(terminalModel.root.quaternion),right=new THREE.Vector3(1,0,0).applyQuaternion(terminalModel.root.quaternion),center=terminalModel.root.localToWorld(new THREE.Vector3(0,.49,0));
 const d=Math.max(2.95*terminalModel.root.scale.z*innerHeight/(2*Math.tan(THREE.MathUtils.degToRad(camera.fov/2))*.70*h),2.2*terminalModel.root.scale.x*innerHeight/(2*Math.tan(THREE.MathUtils.degToRad(camera.fov/2))*.84*w));
 const units=2*d*Math.tan(THREE.MathUtils.degToRad(camera.fov/2))/innerHeight;center.addScaledVector(right,-(ox+w/2-innerWidth/2)*units).addScaledVector(up,(oy+h/2-innerHeight/2)*units);
 const position=center.clone().add(new THREE.Vector3(0,d,0)),quaternion=new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().lookAt(position,center,up));return {position,target:center,quaternion,up};
}
function focusOnlineTerminal(){finishIntro();const saved={position:camera.position.clone(),target:controls.target.clone(),quaternion:camera.quaternion.clone(),up:camera.up.clone(),focused,focusArea,sceneState};inspector.close();lensMotion.setRaised(false);cameraMotion=null;controls.enabled=false;focused=true;focusArea='online';sceneState='ONLINE_FOCUS';terminalView={mode:'enter',start:performance.now(),duration:950,saved,from:camera.position.clone(),fromQ:camera.quaternion.clone(),fromTarget:controls.target.clone()};}
function closeOnlineTerminal(){if(!terminalView)return;terminalView={...terminalView,mode:'exit',start:performance.now(),duration:800,from:camera.position.clone(),fromQ:camera.quaternion.clone(),fromTarget:controls.target.clone()};canvas.focus({preventScroll:true});}
function updateTerminalCamera(now,dt){if(!terminalView)return;const v=terminalView,pose=v.mode==='exit'?v.saved:terminalPose();if(v.mode==='held'){camera.position.lerp(pose.position,1-Math.exp(-14*dt));camera.quaternion.copy(pose.quaternion);camera.up.copy(pose.up);controls.target.copy(pose.target);}
 else{const t=Math.min(1,(now-v.start)/v.duration),u=ease(t);camera.position.lerpVectors(v.from,pose.position,u);camera.position.y+=Math.sin(Math.PI*u)*Math.min(2,v.from.distanceTo(pose.position)*.14);camera.quaternion.slerpQuaternions(v.fromQ,pose.quaternion,u);controls.target.lerpVectors(v.fromTarget,pose.target,u);if(t===1){camera.up.copy(pose.up);if(v.mode==='exit'){focused=v.saved.focused;focusArea=v.saved.focusArea;sceneState=v.saved.sceneState;terminalView=null;controls.enabled=!wallpaperMode;}else v.mode='held';}}
 camera.updateMatrixWorld();
}
function leaveOnline(){onlineIntent++;if(onlineLoaded){onlineLoaded=false;loadedTape.visible=false;terminalModel.card.visible=!!terminalModel.state.cardId;}if(!onlineTrack)return;audio.pause();onlineTrack=null;errorText='';playerState.playing=false;playerState.paused=loaded;if(loaded){const t=playerState.playlist[playerState.currentTrack],url=ensureTrackURL(playerState.currentTrack);audio.src=url;audio.load();const restore=localResumeTime;audio.addEventListener('loadedmetadata',()=>{if(!onlineTrack&&audio.src===url){audio.currentTime=Math.min(restore,audio.duration||restore);playerState.currentTime=audio.currentTime;}},{once:true});metadataSession(t);playerState.duration=t.duration||0;playerState.currentTime=restore;transportState='PAUSED';}else{audio.removeAttribute('src');audio.load();playerState.duration=playerState.currentTime=0;transportState='NO_TAPE';}terminalModel.phase('ready');queueArchiveSave();}
async function returnOnlineTape(restoreCard=true){
 if(!onlineLoaded)return;const track=onlineTrack||{},old=cassette(model,track.title||'ONLINE',track.labelStyle||'#bac794');decorateTape(old,track);old.position.copy(loadedTape.position);loadedTape.visible=false;mechanicalSound('tape-out');let paper;
 try{await moveSegment(old,new THREE.Vector3(0,3.59,6.5),420);await moveSegment(old,new THREE.Vector3(2.9,4.6,6.5),300,.49);
  paper=group(model,...old.position.toArray());box(paper,1.22,.016,.85,0,0,0,M.paper,.018);const ink=label(paper,(track.title||'ONLINE')+'\n'+(track.artist||''),1.1,.65,0,.013,0,{res:512,color:'#655c49'});ink.rotation.x=-Math.PI/2;paper.scale.setScalar(.001);
  await animateMotion(320,t=>{const u=ease(t);old.scale.setScalar(.49*(1-u)+.015*u);old.rotation.x=-Math.PI/2*u;paper.scale.setScalar(.001+terminalModel.root.scale.x*u);});old.visible=false;
  const destination=model.worldToLocal(terminalModel.cardTarget.getWorldPosition(new THREE.Vector3()));await moveSegment(paper,new THREE.Vector3(destination.x,4.6,destination.z),230);await moveSegment(paper,destination,280);
  const slot=model.worldToLocal(terminalModel.root.localToWorld(new THREE.Vector3(.50,.13,.10)));await moveSegment(paper,slot,240);onlineLoaded=false;terminalModel.card.visible=false;renderer.shadowMap.needsUpdate=true;
 }finally{model.remove(old);disposeGroup(old);if(paper){model.remove(paper);disposeGroup(paper);}}
}
async function loadOnlineCassette(track){
 const same=onlineLoaded&&onlineTrack?.sourceId===track.id&&onlineTrack?.provider===track.provider;if(same)return;
 try{
 if(terminalView){onlineTerminal.close();await waitMotion(850);}
 // Show the loading corridor before full-size tape parts leave the machine.
 overview();busy=true;await waitMotion(1050);
 transportState='TRANSITION';setDoorTarget(true);await waitMotion(650);audio.pause();
 const ejection=(async()=>{if(loaded){await returnTape(playerState.currentTrack);loaded=false;playerState.currentTrack=-1;cabinet.refresh(null);}if(onlineLoaded)await returnOnlineTape(false);})();
 const origin=model.worldToLocal(terminalModel.cardTarget.getWorldPosition(new THREE.Vector3()));terminalModel.card.visible=false;
 const paper=group(model,...origin.toArray());box(paper,1.22,.016,.85,0,0,0,M.paper.clone(),.02);const ink=label(paper,track.title+'\n'+track.artist,1.10,.65,0,.013,0,{res:768});ink.rotation.x=-Math.PI/2;
 const flying=cassette(model,track.title,'#bac794',.05);decorateTape(flying,track);flying.visible=false;
 const preparation=(async()=>{await moveSegment(paper,new THREE.Vector3(origin.x,6.55,origin.z),330);flying.position.copy(paper.position);flying.visible=true;await animateMotion(280,t=>{paper.scale.setScalar(Math.max(.001,1-t));flying.scale.setScalar(.05+.50*ease(t));});model.remove(paper);disposeGroup(paper);await moveSegment(flying,new THREE.Vector3(origin.x,6.55,8.6),280,.72);})();
 await Promise.all([ejection,preparation]);
 await moveSegment(flying,new THREE.Vector3(0,6.55,8.6),300,1);const target=loadedTape.userData.part.base.clone();await moveSegment(flying,new THREE.Vector3(0,target.y,8.6),180);mechanicalSound('tape-in');await moveSegment(flying,target,460);model.remove(flying);disposeGroup(flying);
 decorateTape(tapeModel,track);loadedTape.position.copy(target);loadedTape.visible=true;onlineLoaded=true;importPlate.visible=false;setDoorTarget(false);await waitMotion(650);busy=false;transportState='TAPE_LOADED';queueArchiveSave();
 }finally{busy=false;}
}
async function playOnlineTrack(track,activation){if(activation!==undefined&&activation!==transportRequest)throw Error('点歌已取消，保留刚才的磁带操作。');if(busy||archiveOperation)throw Error('磁带机正在装卸，请稍后点歌。');const url=safeOnlineUrl(track.streamUrl);if(!url)throw Error('没有可播放的歌曲地址。');unlockAudio();await loadOnlineCassette(track);const intent=++onlineIntent;transportRequest++;if(!onlineTrack)localResumeTime=playerState.currentTime;audio.pause();onlineTrack={...track,id:'online:'+track.provider+':'+track.id,sourceId:track.id,lyricsRead:true};audio.crossOrigin='anonymous';audio.src=url;audio.load();errorText='';playerState.currentTime=0;playerState.duration=track.duration||0;metadataSession(track);let loadingTimeout;try{await Promise.race([audio.play(),new Promise((_,reject)=>{loadingTimeout=setTimeout(()=>reject(Error('播放连接超时')),18000);})]);}catch(e){if(intent===onlineIntent){leaveOnline();}throw Error('歌曲暂时无法播放，请重试或更换结果。');}finally{clearTimeout(loadingTimeout);}if(intent!==onlineIntent)return;transportState='PLAYING';reactPeople('play');queueArchiveSave();const active=onlineTrack;if(!active.lyrics?.cues?.length){lyricLookup.lookup({...active,album:track.album||'LOCAL TAPES'}).then(found=>{if(onlineTrack!==active||intent!==onlineIntent)return;if(found.lyrics){active.lyrics=found.lyrics;onlineTerminal.updateLyrics({...track,lyrics:found.lyrics});}});}else onlineTerminal.updateLyrics(track);}
async function recordOnlineTrack(track,blob){if(!archive.db)throw Error('本地收藏暂不可保存，请恢复浏览器存储后再刻录。');const suffix=/wav/.test(blob.type)?'wav':/flac/.test(blob.type)?'flac':/ogg/.test(blob.type)?'ogg':/mp4|aac/.test(blob.type)?'m4a':'mp3';const file=new File([blob],(track.artist+' - '+track.title).replace(/[\\/:*?"<>|]/g,'_')+'.'+suffix,{type:blob.type,lastModified:1});const ids=new Set(playerState.playlist.map(t=>t.id));onlineImportMeta.set(file,{title:track.title,artist:track.artist,album:track.album||'ONLINE RECORDINGS',lyrics:track.lyrics,onlineSource:{provider:track.provider,id:track.id}});await addFiles([file],'recorder');const saved=playerState.playlist.find(t=>!ids.has(t.id)&&t.recorded&&t.audioBlob);if(!saved)throw Error(errorText||'本地保存未完成，未生成新磁带。');return saved;}
let onlineListCatalog=()=>[];
const playbackLists=createPlaybackLists({persist:record=>archive.db?archive.write(['preferences'],tx=>tx.objectStore('preferences').put(record)):Promise.reject(Error('保存不可用')),getCatalog:()=>[...playerState.playlist.map(t=>playbackLists.local(t)),...onlineListCatalog()],playEntry:async e=>{if(busy)throw Error('磁带机正在装卸，请稍后播放');if(e.kind==='local'){if(terminalView){onlineTerminal.close();await waitMotion(850);overview();await waitMotion(1100);}const i=playerState.playlist.findIndex(t=>t.id===e.id);if(i<0||!ensureTrackURL(i))throw Error('这盘磁带需要重新导入');await selectTrack(i,true);}else await onlineTerminal.playTrack(e.track,e.config);}});
function playbackKey(){return onlineTrack?'online:'+onlineTrack.provider+':'+onlineTrack.sourceId:'local:'+currentTapeId();}
async function advancePlaybackList(direction,automatic=false){try{const handled=await playbackLists.advance(direction,playbackKey(),{automatic,repeat:playerState.repeatMode==='all',shuffle:playerState.shuffle});if(handled&&audio.ended)transportState='STOPPED';return handled;}catch(e){status(e.message||'播放列表歌曲不可用',5000);return true;}}
const onlineTerminal=createOnlineTerminal({playbackLists,model:terminalModel,getAnchor:()=>({ready:terminalView?.mode==='held',points:terminalModel.corners().map(p=>{p.project(camera);return [(p.x+1)*innerWidth/2,(1-p.y)*innerHeight/2];})}),onOpen:focusOnlineTerminal,onClose:closeOnlineTerminal,onActivate:()=>{unlockAudio();return transportRequest;},onPlay:playOnlineTrack,onSeek:seek,onStop:leaveOnline,onRecord:recordOnlineTrack,onPersist:record=>archive.db?archive.write(['preferences'],tx=>tx.objectStore('preferences').put(record)):Promise.reject(Error('保存不可用')),getPlayback:()=>({key:onlineTrack?onlineTrack.provider+':'+onlineTrack.sourceId:'',time:playerState.currentTime,duration:playerState.duration,playing:playerState.playing,lyrics:onlineTrack?.lyrics})});

// Persistence is independent of rendering and uses committed transaction completion.
onlineListCatalog=()=>onlineTerminal.state.favorites.map(t=>playbackLists.online(t,onlineTerminal.state.config));
const inspector=createMagnifier({playbackLists,onDownload:downloadRecordedBatch,onOpen:()=>{lensMotion.setRaised(false);lastInteraction=performance.now();},onSearch:reason=>{if(lensMotion.active){lensMotion.setRaised(false);controls.minDistance=8;if(reason!=='physical')focusCabinet();}lastInteraction=performance.now();},getTracks:()=>[...playerState.playlist].sort((a,b)=>flatCabinetSlot(a)-flatCabinetSlot(b)),onOrganize:organizeCabinet,onDelete:deleteInspectorTapes,onDownloadOne:downloadRecordedOne,getLocation:t=>t.onRecorder?'刻录机出口':currentTapeId()===t.id?'磁带机内':t.sourceRequired?'需要重新导入源文件':'专辑柜',onClose:()=>{lensMotion.setRaised(false);lastInteraction=performance.now();controls.minDistance=8;focusCabinet();canvas.focus({preventScroll:true});},onLocate:track=>{
 if(busy||archiveOperation){status('WAIT FOR MECHANISM');return;}const index=playerState.playlist.findIndex(t=>t.id===track.id);if(index<0)return;
 lensMotion.setRaised(true);lastInteraction=performance.now();
 if(track.onRecorder){focusRecorder();return;}if(currentTapeId()===track.id){focusRegion('tape');return;}
 cabinet.state.selectedTape=track.id;cabinet.state.removeArmed=null;cabinet.reveal(index);cabinet.refresh(currentTapeId());controls.minDistance=3;const {d,point}=cabinet.locate(track);point.y+=d.y+.17;point.z+=d.target;cabinet.root.updateWorldMatrix(true,false);const target=cabinet.root.localToWorld(point);if(innerWidth<650)target.y-=2.4;focused=true;focusArea='inspection';sceneState='TAPE_INSPECTION';moveCamera(fitRegionPosition(target,new THREE.Vector3(.3,4.3,3),3.2),target,750);renderer.shadowMap.needsUpdate=true;queueArchiveSave();
}});
let preferenceCameraSave=null;
function focusPreferenceCards(root){finishIntro();preferenceCameraSave={position:camera.position.clone(),target:controls.target.clone(),minimum:controls.minDistance,area:focusArea};root.updateWorldMatrix(true,false);const target=root.localToWorld(new THREE.Vector3(-.18,1.64,1.35)),normal=new THREE.Vector3(0,Math.cos(1.05),Math.sin(1.05)).applyQuaternion(root.quaternion);controls.minDistance=3;focused=true;focusArea='preferenceCards';sceneState='OBJECT_FOCUS';moveCamera(fitRegionPosition(target,normal.multiplyScalar(5),3.6),target,1150);}
function returnPreferenceCamera(){const saved=preferenceCameraSave;setTimeout(()=>{if(!saved||preferenceCards.active||focusArea!=='preferenceCards'||settings.active||inspector.active||onlineTerminal.active)return;controls.minDistance=saved.minimum;focusArea=saved.area;focused=saved.area!=='overview';moveCamera(saved.position,saved.target,850);},1250);}
const preferenceCards=createPreferenceCards({props,group,box,label,interactive,M,read:()=>({style:currentStyle,styleName:getMachineStyle(currentStyle).name,bass:playerState.bass,treble:playerState.treble,eq:[...playerState.eq]}),apply:async p=>{if(busy||styleAnimating)throw Error('磁带机正在装卸，请稍后切换');if(!MACHINE_STYLES.some(s=>s.id===p.style))throw Error('该皮肤暂不可用');unlockAudio();await changeStyle(p.style);if(currentStyle!==p.style)throw Error('皮肤切换未完成');playerState.bass=p.bass;playerState.treble=p.treble;playerState.eq=[...p.eq];knobs.bass.value=p.bass/24+.5;knobs.treble.value=p.treble/24+.5;syncAudio();queueArchiveSave();},persist:queueArchiveSave,onDraw:root=>{if(settings.active)settings.close();if(onlineTerminal.active)onlineTerminal.close();if(inspector.active)inspector.close();mechanicalSound('paper');focusPreferenceCards(root);},onClose:()=>{mechanicalSound('paper');returnPreferenceCamera();canvas.focus({preventScroll:true});},onDirty:()=>{renderer.shadowMap.needsUpdate=true;}});
const settings=createSettings({getFolder:()=>localAlbums.handle?.name||'',chooseLyrics:()=>lyricInput.click(),chooseFolder:async()=>{await localAlbums.choose();status(localAlbums.message,5000);},getOnlineConfig:()=>onlineTerminal.state.config,setOnlineConfig:config=>onlineTerminal.configure(config),read:()=>({lyricPageSize:lyricWorld.typography.pageSize,lyricPageFont:lyricWorld.typography.pageFont,lyricBgSize:lyricWorld.typography.backgroundSize,lyricBgFont:lyricWorld.typography.backgroundFont,lyricBgDepth:lyricWorld.typography.backgroundDepth,onlineLyrics,renderQuality,renderSupported:!mobile&&!wallpaperMode,volume:Math.round(playerState.volume*100),effects:effectsEnabled,shuffle:selectorValue('shuffle'),repeat:selectorValue('repeat'),stereo:selectorValue('stereo')}),change:(key,value)=>{const typeKey={lyricPageSize:'pageSize',lyricPageFont:'pageFont',lyricBgSize:'backgroundSize',lyricBgFont:'backgroundFont',lyricBgDepth:'backgroundDepth'}[key];if(typeKey){lyricWorld.configure({[typeKey]:value});queueArchiveSave();return;}if(key==='onlineLyrics'){onlineLyrics=value;queueArchiveSave();return;}if(key==='renderQuality'){setRenderQuality(value);queueArchiveSave();return;}unlockAudio();if(key==='volume')setVolume(value/100);else if(key==='effects'){effectsEnabled=value;queueArchiveSave();}else applySelector(key,value);},onOpen:()=>{finishIntro();preferenceCards.close();if(onlineTerminal.active)onlineTerminal.close();if(inspector.active)inspector.close();controls.enabled=false;},onClose:()=>{controls.enabled=!wallpaperMode;lastInteraction=performance.now();}});
if(mobile){const nav=document.createElement('nav');nav.id='mobile-tools';nav.setAttribute('aria-label','手机快捷操作');for(const [name,run]of [['设置',()=>settings.open()],['全景',overview],['收藏',focusCabinet],['放大镜',()=>{focusCabinet();inspector.open();}],['刻录',()=>{focusRecorder();requestImport('recorder');}],['播放',()=>{unlockAudio();playerState.playing?pause():play();}]]){const button=document.createElement('button');button.textContent=name;button.type='button';button.onclick=run;nav.append(button);}nav.addEventListener('keydown',e=>e.stopPropagation());document.body.append(nav);}
const archive=new ArchiveDB();const localAlbums=new LocalAlbums(archive);
async function chooseAlbumFolder(){try{if(await localAlbums.choose()){for(const t of playerState.playlist.filter(t=>t.format==='MP3'&&(t.recorded||t.onRecorder)))await localAlbums.save(t);}status(localAlbums.message,6500);}catch(e){if(e.name!=='AbortError')status('FOLDER ACCESS FAILED',5000);}}
let storageInfo={},saveTimer=0,lastSavedSignature='',lastStableSession=null,restoring=true,archiveOperation=false;
function currentTapeId(){return loaded?playerState.playlist[playerState.currentTrack]?.id:null;}
function archiveFailure(e){const message=e?.name==='QuotaExceededError'?'ARCHIVE FULL':e?.message==='ARCHIVE OFFLINE'?'ARCHIVE OFFLINE':'SAVE ERROR';status(message,7000);cabinet.count.userData.setText(message);}
async function checkStorage(){if(!navigator.storage?.estimate)return;try{const {usage,quota}=await navigator.storage.estimate();storageInfo={usage,quota};if(quota&&usage/quota>.85){status('LOW STORAGE',6000);cabinet.count.userData.setText('LOW STORAGE');}}catch{}}
function ensureTrackURL(index){const t=playerState.playlist[index];if(!t)return null;if(!t.objectURL&&t.audioBlob)t.objectURL=URL.createObjectURL(t.audioBlob);return t.objectURL;}
function preferenceSnapshot(){return {preferenceCards:preferenceCards.snapshot(),lyricTypography:{...lyricWorld.typography},onlineLyrics,ambientLyrics:lyricWorld.state.enabled,renderQuality,effectsEnabled,volume:playerState.volume,bass:playerState.bass,treble:playerState.treble,eq:[...playerState.eq],shuffle:playerState.shuffle,repeatMode:playerState.repeatMode,stereoMono:playerState.stereoMono,mobileQuality:qualityRatio,lastSelectedAlbum:playerState.playlist.find(t=>t.id===cabinet.state.selectedTape)?.album||null,style:currentStyle};}
function sessionSnapshot(){
 if(busy||tapeDrag||cameraMotion||terminalView||scan||adAnimating||archiveOperation)return lastStableSession;
 const session={currentTrackId:currentTapeId(),currentTime:onlineTrack?localResumeTime:playerState.currentTime,tapeInserted:loaded,cabinetOpen:!!cabinet.state.activeDrawer,activeDrawer:cabinet.state.activeDrawer,pages:{...cabinet.state.pages},selectedTape:cabinet.state.selectedTape,cameraPosition:camera.position.toArray(),cameraTarget:controls.target.toArray(),explodedView:exploded,focusedPart:focusArea,lastStableState:sceneState,doorOpen:doorTarget>0,wasPlaying:onlineTrack?false:playerState.playing,updatedAt:Date.now(),...preferenceSnapshot()};
 lastStableSession=session;return session;
}
async function flushArchiveSave(){clearTimeout(saveTimer);saveTimer=0;if(restoring||!bootReady||!archive.db)return;const session=sessionSnapshot();if(!session)return;try{await archive.save(preferenceSnapshot(),session);}catch(e){archiveFailure(e);}}
function queueArchiveSave(){inspector.refresh();if(restoring||!bootReady)return;clearTimeout(saveTimer);saveTimer=setTimeout(flushArchiveSave,400);}
function focusCabinet(){if(busy)return;finishIntro();focused=true;focusArea='cabinet';sceneState='CABINET_FOCUS';cabinet.root.updateWorldMatrix(true,false);const target=cabinet.root.localToWorld(new THREE.Vector3(0,1.8,2));moveCamera(fitRegionPosition(target,new THREE.Vector3(1,6.7,12),6.5),target,950);}
function focusRecorder(){if(busy)return;finishIntro();focused=true;focusArea='recorder';sceneState='RECORDER_FOCUS';recorder.root.updateWorldMatrix(true,false);const target=recorder.root.localToWorld(new THREE.Vector3(0,.95,.55));moveCamera(fitRegionPosition(target,new THREE.Vector3(.9,3.2,9.5),5.2),target,950);}
function toggleDrawer(id,force){if(busy||archiveOperation)return;focusCabinet();reactPeople('archive');cabinet.setOpen(id,force??cabinet.state.activeDrawer!==id);sceneState=cabinet.state.activeDrawer?'DRAWER_OPEN':'CABINET_FOCUS';mechanicalSound('door-open');renderer.shadowMap.needsUpdate=true;queueArchiveSave();}
function selectArchiveTape(index){const track=playerState.playlist[index];if(!track)return;if(cabinet.state.selectedTape===track.id){selectTrack(index,playerState.playing);return;}reactPeople('archive');cabinet.state.selectedTape=track.id;cabinet.state.removeArmed=null;cabinet.refresh(currentTapeId());sceneState='TAPE_SELECT';status(track.sourceRequired?'SOURCE REQUIRED':track.title.slice(0,20)+' / TAP TO LOAD',4500);queueArchiveSave();}
let serviceConfirm=null;
async function removeSelected(){const id=cabinet.state.selectedTape,t=playerState.playlist.find(t=>t.id===id);if(!t){status('SELECT A TAPE FIRST');return;}
 if(!serviceConfirm||serviceConfirm.id!==id||performance.now()>serviceConfirm.until){serviceConfirm={id,until:performance.now()+6500};status('REMOVE '+t.title.slice(0,12)+'? PRESS SERVICE',6500);cabinet.count.userData.setText('PRESS SERVICE TO REMOVE');return;}
 serviceConfirm=null;await deleteArchiveTracks([t]);
}
async function deleteArchiveTracks(tracksToDelete,clear=false){
 if(busy||archiveOperation)return false;archiveOperation=true;let completed=false;const ids=new Set(tracksToDelete.map(t=>t.id));
 try{
  if(ids.has(currentTapeId()))await unloadTape();
  if(ids.has(recorder.state.trackId))recorder.clear();
  const remaining=playerState.playlist.filter(t=>!ids.has(t.id)),playingId=currentTapeId();
  if(archive.db){if(clear)await archive.clear();else await archive.removeTracks(tracksToDelete,remaining);}
  for(const t of tracksToDelete){if(t.objectURL)URL.revokeObjectURL(t.objectURL);if(t.cover)URL.revokeObjectURL(t.cover);}
  playerState.playlist=remaining;playbackLists.prune(ids);playerState.currentTrack=playingId?remaining.findIndex(t=>t.id===playingId):-1;cabinet.state.selectedTape=null;cabinet.rebuild(remaining,playingId);status(clear?'ARCHIVE CLEARED':'TAPE REMOVED',4000);lastStableSession=null;completed=true;
 }catch(e){archiveFailure(e);}finally{archiveOperation=false;queueArchiveSave();checkStorage();}return completed;
}
async function organizeCabinet(mode){
 if(!bootReady||busy||archiveOperation||recorder.state.phase==='encoding')throw Error('设备正在工作，请稍后再整理。');
 archiveOperation=true;try{const updates=planCabinetOrder(playerState.playlist,mode);if(archive.db)await archive.updateSlots(updates);const byId=new Map(updates.map(u=>[u.id,u.cabinetSlot]));for(const t of playerState.playlist)t.cabinetSlot=byId.get(t.id);cabinet.rebuild(playerState.playlist,currentTapeId());const selected=playerState.playlist.findIndex(t=>t.id===cabinet.state.selectedTape);if(selected>=0)cabinet.reveal(selected);else cabinet.state.pages.A01=0;cabinet.refresh(currentTapeId());lastStableSession=null;renderer.shadowMap.needsUpdate=true;reactPeople('archive');return updates.length;}catch(e){archiveFailure(e);throw Error('整理未完成，原有柜内顺序已保留。');}finally{archiveOperation=false;queueArchiveSave();}
}
async function deleteInspectorTapes(ids){
 if(!bootReady||busy||archiveOperation||recorder.state.phase==='encoding')throw Error('设备正在工作，请稍后再删除。');
 const selected=new Set(ids),tracks=playerState.playlist.filter(t=>selected.has(t.id));if(!tracks.length)return 0;
 if(!await deleteArchiveTracks(tracks))throw Error('删除未完成，请稍后重试。');return tracks.length;
}

async function resetMachine(){if(busy||archiveOperation)return;if(onlineTrack)leaveOnline();if(loaded)await unloadTape();if(exploded)await toggleExplode();Object.assign(playerState,{volume:.68,muted:false,bass:0,treble:0,eq:[0,0,0,0,0],shuffle:false,repeatMode:'off',stereoMono:false});knobs.volume.value=.68;knobs.bass.value=knobs.treble.value=.5;cabinet.setOpen(null,false);syncAudio();overview();status('MACHINE RESET / ARCHIVE KEPT',5000);queueArchiveSave();}
function archiveAction(kind,value,event){
 if(!['cabinet','drawer','archivePage','archiveImport','recorderImport','archiveService','recorderTape','recorderSave','resetMachine','clearArchive'].includes(kind))return false;
 if(archiveOperation){status('ARCHIVE BUSY / TRY AGAIN',3000);return true;}
 if(kind==='cabinet')focusCabinet();
 if(kind==='drawer')toggleDrawer(value);
 if(kind==='archivePage'){const page=cabinet.state.pages[value.id]||0;cabinet.state.pages[value.id]=(page+value.direction+cabinet.pageCount)%cabinet.pageCount;cabinet.setOpen(value.id,true);renderer.shadowMap.needsUpdate=true;mechanicalSound('detent');queueArchiveSave();}
 if(kind==='archiveImport'){focusCabinet();requestImport('archive');}
 if(kind==='recorderImport'){focusRecorder();requestImport('recorder');}
 if(kind==='recorderTape'||kind==='recorderSave')saveRecorderMp3();
 if(kind==='archiveService')removeSelected();
 if(kind==='resetMachine')resetMachine();
 if(kind==='clearArchive'){if(serviceConfirm?.id==='ALL'&&performance.now()<serviceConfirm.until){serviceConfirm=null;deleteArchiveTracks([...playerState.playlist],true);}else{serviceConfirm={id:'ALL',until:performance.now()+6500};status('CLEAR ARCHIVE? PRESS RED AGAIN',6500);}}
 return true;
}
const archiveServicePanel=group(rear,0,0,-.2);archiveServicePanel.rotation.y=Math.PI;
box(archiveServicePanel,3.5,1.05,.1,0,-.75,0,M.dark);label(archiveServicePanel,'ARCHIVE SERVICE / DOUBLE CONFIRM',3.25,.13,0,-.42,.06,{mono:true,color:'#dacbb0',res:512});
for(const [kind,title,x,material]of [['resetMachine','RESET MACHINE',-.84,M.cream],['clearArchive','CLEAR ARCHIVE',.84,M.orange]]){const button=box(archiveServicePanel,1.5,.32,.12,x,-.82,.13,material);interactive(button,kind);label(button,title,1.35,.12,0,0,.069,{mono:true,res:256});}
function applyPreferences(p){playerState.muted=false;if(!p)return;preferenceCards.restore(p.preferenceCards);if(typeof p.onlineLyrics==='boolean')onlineLyrics=p.onlineLyrics;setRenderQuality(p.renderQuality);lyricWorld.setEnabled(p.ambientLyrics);lyricWorld.configure(p.lyricTypography||{});if(typeof p.effectsEnabled==='boolean')effectsEnabled=p.effectsEnabled;for(const key of ['shuffle','stereoMono'])if(typeof p[key]==='boolean')playerState[key]=p[key];for(const [key,min,max]of [['volume',0,1],['bass',-12,12],['treble',-12,12]])if(Number.isFinite(p[key]))playerState[key]=THREE.MathUtils.clamp(p[key],min,max);if(Array.isArray(p.eq)&&p.eq.length===5)playerState.eq=p.eq.map(v=>Number.isFinite(v)?THREE.MathUtils.clamp(v,-12,12):0);if(['off','one','all'].includes(p.repeatMode))playerState.repeatMode=p.repeatMode;knobs.volume.value=playerState.volume;knobs.bass.value=playerState.bass/24+.5;knobs.treble.value=playerState.treble/24+.5;if(mobile&&Number.isFinite(p.mobileQuality)){qualityRatio=THREE.MathUtils.clamp(p.mobileQuality,.75,1.35);renderer.setPixelRatio(qualityRatio);}syncAudio();}
async function restoreArchive(){
 sceneState='BOOT';let session,prefs;
 try{await archive.open();prefs=await archive.get('preferences','current');applyPreferences(prefs);const rows=(await archive.all('tracks')).sort((a,b)=>(a.createdAt||0)-(b.createdAt||0)||String(a.id).localeCompare(String(b.id)));const restored=[];
  for(const raw of rows){const t=normalizeTrack(raw);const slot=t.cabinetSlot,valid=slot&&DRAWERS.includes(slot.drawer)&&Number.isInteger(slot.index)&&slot.index>=0&&slot.index<96&&!restored.some(r=>r.cabinetSlot.drawer===slot.drawer&&r.cabinetSlot.index===slot.index);if(!valid)t.cabinetSlot=assignSlot(restored,t);if(t.artworkBlob)t.cover=URL.createObjectURL(t.artworkBlob);else{const saved=await archive.get('covers',t.id);if(saved?.blob){t.artworkBlob=saved.blob;t.cover=URL.createObjectURL(saved.blob);}}restored.push(t);if(!valid)await archive.putTrack(t);}
  playerState.playlist=restored;session=await archive.get('session','current');
 }catch(e){archiveFailure(e);archive.db?.close();archive.db=null;}
 try{
  if(session){sceneState='RESTORING';finishIntro();applyPreferences(prefs||session);cabinet.state.pages={...cabinet.state.pages,...Object.fromEntries(Object.entries(session.pages||{}).filter(([id,v])=>DRAWERS.includes(id)&&Number.isInteger(v)&&v>=0&&v<cabinet.pageCount))};cabinet.state.selectedTape=session.selectedTape||null;
   const index=playerState.playlist.findIndex(t=>t.id===session.currentTrackId);
   if(session.tapeInserted&&index>=0&&ensureTrackURL(index)){
    const t=playerState.playlist[index];playerState.currentTrack=index;loaded=true;loadedTape.visible=true;importPlate.visible=false;decorateTape(tapeModel,t);playerState.duration=t.duration||0;playerState.currentTime=Math.max(0,Math.min(session.currentTime||0,t.duration||0));activeCounter=t.duration?playerState.currentTime/t.duration*999:0;
    const restoreTime=playerState.currentTime;audio.addEventListener('loadedmetadata',()=>{audio.currentTime=Math.min(restoreTime,audio.duration||restoreTime);playerState.currentTime=audio.currentTime;},{once:true});audio.src=ensureTrackURL(index);audio.load();playerState.paused=true;transportState='PAUSED';metadataSession(t);
   }
   setDoorTarget(!!session.doorOpen,true);door.rotation.x=doorTarget;
  }
  cabinet.rebuild(playerState.playlist,currentTapeId());if(session?.activeDrawer&&DRAWERS.includes(session.activeDrawer)){cabinet.setOpen(session.activeDrawer,true);for(const d of cabinet.drawers){d.open=d.target;d.carrier.position.z=d.target;}}
  const pending=playerState.playlist.filter(t=>t.onRecorder);for(const old of pending.slice(0,-1)){old.onRecorder=false;if(archive.db)await archive.putTrack(old);}const parked=pending.at(-1);if(parked){const output=recorder.makeOutput(parked,playerState.playlist.indexOf(parked));output.position.z=1.75;recorder.ready();cabinet.refresh(currentTapeId());}
  bootReady=true;
  if(session){if(prefs?.style&&prefs.style!==currentStyle)await changeStyle(prefs.style);if(session.explodedView)await toggleExplode();cameraMotion=null;const validVector=a=>Array.isArray(a)&&a.length===3&&a.every(n=>Number.isFinite(n)&&Math.abs(n)<120);if(validVector(session.cameraPosition))camera.position.fromArray(session.cameraPosition);if(validVector(session.cameraTarget))controls.target.fromArray(session.cameraTarget);focusArea=session.focusedPart||'overview';focused=focusArea!=='overview';sceneState=exploded?'DISASSEMBLY':focusArea==='cabinet'?'CABINET_FOCUS':focusArea==='recorder'?'RECORDER_FOCUS':focused?'FOCUS':'OVERVIEW';camera.lookAt(controls.target);status(loaded?'RESTORED / PRESS PLAY':playerState.playlist.length+' TAPES RESTORED',5500);}
  else{introStart=performance.now();sceneState='INTRO';}
 }catch(e){status('RESTORE ERROR / ARCHIVE KEPT',7000);console.error(e);}finally{bootReady=true;restoring=false;renderer.shadowMap.needsUpdate=true;checkStorage();}
}
const archiveBoot=restoreArchive().then(async()=>{await localAlbums.restore();if(archive.db)try{onlineTerminal.restore(await archive.get('preferences','online-terminal'));playbackLists.restore(await archive.get('preferences','playback-lists'));}catch{}});
setInterval(()=>{if(!bootReady||restoring||document.hidden)return;const session=sessionSnapshot();if(!session)return;const signature=JSON.stringify({...session,updatedAt:0,currentTime:Math.floor(session.currentTime/5)*5,cameraPosition:session.cameraPosition.map(v=>+v.toFixed(3)),cameraTarget:session.cameraTarget.map(v=>+v.toFixed(3))});if(signature!==lastSavedSignature){lastSavedSignature=signature;queueArchiveSave();}},300);
controls.addEventListener('end',queueArchiveSave);
for(const event of ['play','pause','seeked','ended'])audio.addEventListener(event,queueArchiveSave);
function reconcileAudio(){playerState.playing=!audio.paused&&!audio.ended;playerState.paused=(loaded||!!onlineTrack)&&!playerState.playing;playerState.currentTime=audio.currentTime||0;if(loaded||onlineTrack)transportState=playerState.playing?'PLAYING':'PAUSED';}
document.addEventListener('visibilitychange',()=>{if(document.hidden){flushArchiveSave();flushTimelines();}else{reconcileAudio();previous=performance.now();renderer.shadowMap.needsUpdate=true;}});
window.addEventListener('pagehide',()=>{flushArchiveSave();});
window.addEventListener('pageshow',e=>{if(e.persisted)reconcileAudio();});
let poorFrames=0;
setInterval(()=>{if(!mobile||document.hidden||busy||!bootReady)return;if(fps<18)poorFrames++;else poorFrames=0;if(poorFrames>=3&&qualityRatio>.8){qualityRatio=Math.max(.8,qualityRatio-.15);renderer.setPixelRatio(qualityRatio);resizeWorld(false);poorFrames=0;queueArchiveSave();}},4000);
function resizeWorld(reframe=true){const width=innerWidth,height=innerHeight;camera.aspect=width/height;camera.updateProjectionMatrix();renderer.setSize(width,height);composer?.setSize(width,height);controls.maxDistance=camera.aspect<.85?100:60;homePosition.set(11,12,26);if(camera.aspect<.85)homePosition.set(5,12,Math.max(32,34/camera.aspect));if(reframe&&bootReady&&!busy&&!exploded){if(focusArea==='inspection'&&inspector.active)inspector.relocate();else if(focusArea==='cabinet')focusCabinet();else if(focusArea==='recorder')focusRecorder();else if(focused&&FOCUS_AREAS[focusArea])focusRegion(focusArea);else moveCamera(homePosition.clone(),new THREE.Vector3(2,3.2,0),600);}}
window.addEventListener('resize',()=>resizeWorld());window.addEventListener('orientationchange',()=>resizeWorld());window.visualViewport?.addEventListener('resize',()=>resizeWorld(false));

// Feature-detected tools share precisely the same actions as physical controls.
if(document.modelContext?.registerTool){const controller=new AbortController();const register=tool=>{try{Promise.resolve(document.modelContext.registerTool(tool,{signal:controller.signal})).catch(()=>{});}catch{}};register({name:'read_cassette_state',description:'Read local cassette player state and imported tape names.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true,untrustedContentHint:true},execute:()=>({...window.cassetteWorld.state,positions:window.cassetteWorld.objectPositions})});register({name:'control_cassette',description:'Operate the physical cassette transport or service view.',inputSchema:{type:'object',properties:{action:{type:'string',enum:['play','pause','stop','eject','next','previous','service']}},required:['action'],additionalProperties:false},execute:async({action})=>{const actions={play,pause,stop,eject,next,previous:()=>next(-1),service:toggleExplode};if(!Object.hasOwn(actions,action))throw Error('Unknown action');if(busy)throw Error('Mechanical transition in progress');await actions[action]();if(busy)await new Promise(resolve=>{const check=()=>busy?setTimeout(check,100):resolve();check();});return {transport:transportState,playing:playerState.playing,service:exploded};}});window.addEventListener('pagehide',()=>controller.abort(),{once:true});}
// A read-only diagnostic surface is useful for local verification and never shown onscreen.
window.cassetteWorld={get state(){return {...playerState,playlist:playerState.playlist.map(({objectURL,cover,audioBlob,originalBlob,artworkBlob,...t})=>t),version:'5.21',preferenceCards:preferenceCards.snapshot(),playbackLists:JSON.parse(JSON.stringify(playbackLists.state)),online:{physicalTape:onlineLoaded,view:terminalView?.mode||null,page:onlineTerminal.state.page,active:!!onlineTrack,track:onlineTrack?{id:onlineTrack.id,title:onlineTrack.title,artist:onlineTrack.artist,lyrics:onlineTrack.lyrics}:null,terminal:terminalModel.state,provider:onlineTerminal.state.config.provider,favorites:onlineTerminal.state.favorites.length,results:onlineTerminal.state.results.length,open:onlineTerminal.active,recording:onlineTerminal.state.recording},lyrics:{...lyricWorld.state,onlineEnabled:onlineLyrics,lookup:{...lyricLookup.state},position:lyricWorld.root.position.toArray(),paperAngle:lyricWorld.hinge.rotation.x},rendering:{...studioRendering.state,quality:renderQuality?'photographic':'balanced',occlusionScale:renderQuality?.5:0},settingsOpen:settings.active,effectsEnabled,lensPhase:lensMotion.phase,inspecting:inspector.active,localAlbums:{selected:!!localAlbums.handle,saved:localAlbums.saved,message:localAlbums.message},recorder:{...recorder.state},archive:{ready:bootReady,persistent:!!archive.db,drawer:cabinet.state.activeDrawer,selected:cabinet.state.selectedTape,storage:storageInfo,renderedTapes:cabinet.drawers.reduce((n,d)=>n+d.contents.children.length,0)},device,camera:{position:camera.position.toArray(),target:controls.target.toArray(),aspect:camera.aspect},performance:{fps:Math.round(fps),targetFrameRate,pixelRatio:renderer.getPixelRatio(),geometries:renderer.info.memory.geometries,textures:renderer.info.memory.textures},style:currentStyle,styleAnimating,importChannel,pendingTimelines:timelines.length,hidden:document.hidden,advertisements:{order:[...adOrder],animating:adAnimating},tapeDrag:tapeDrag?{index:tapeDrag.index,origin:tapeDrag.origin,ready:tapeDrag.ready}:null,focusArea,formats:AUDIO_EXTENSIONS,error:errorText,foley:foley?.events||[],people:people.map(p=>({pose:p.pose,model:p.g.userData.variant,activity:performance.now()<p.until?p.activity:'idle',arm:p.arms[1].rotation.z})),sceneState,transportState,exploded,busy,loaded,door:door.rotation.x,drawCalls:renderer.info.render.calls,fps:Math.round(fps),response:{bass:smoothBass,left:smoothLevelL,right:smoothLevelR},filterGains:filters?.map(f=>f.gain.value),volumeGain:gain?.gain.value,peakReduction:limiter?.reduction,audioChain:{context:context?.state??'none',elementVolume:audio.volume,elementMuted:audio.muted,readyState:audio.readyState,networkState:audio.networkState,mediaError:audio.error?.code??null,src:audio.currentSrc?(onlineTrack?'online':'blob'):'none',hasSource:!!source,hasGain:!!gain},mechanics:{reels:tapeModel.userData.spool.map(s=>({angle:s.reel.rotation.z,radius:s.wound.scale.x})),play:buttons.play.position.z,pause:buttons.pause.position.z,capExposure:transport.position.z+buttons.play.position.z+.16-(shell.position.z+.235),needle:vuNeedles[0].rotation.z}};},get objectPositions(){const out={};for(const [id,k]of Object.entries(buttons)){const p=k.getWorldPosition(new THREE.Vector3()).project(camera);out[id]=[(p.x+1)*innerWidth/2,(1-p.y)*innerHeight/2];}for(const [id,k]of Object.entries(knobs)){const p=k.part.getWorldPosition(new THREE.Vector3()).project(camera);out[id]=[(p.x+1)*innerWidth/2,(1-p.y)*innerHeight/2];}for(const [id,g]of [['door',doorPart],['import',importPlate],['eq',eqPart],...eqSliders.map((g,i)=>['eq'+i,g]),['stereo',stereoSwitch.group],['shuffle',randomSwitch.group],['repeat',repeatSwitch.group],['stereoTab',stereoSwitch.tab],['shuffleTab',randomSwitch.tab],['repeatTab',repeatSwitch.tab],['tape',loadedTape],['service',servicePoint],...adPages.map((p,i)=>['ad-corner-'+i,p.corner]),...libraryTapes.map((g,i)=>['archive-'+i,g]),['onlineTerminal',terminalModel.screen],...Object.entries(terminalModel.keys).map(([id,key])=>['onlineKey-'+id,key]),...(terminalModel.card.visible?[['onlineCard',terminalModel.cardTarget]]:[]),['lyrics',lyricWorld.hinge],...lyricWorld.cells.filter(c=>c.root.visible).map((c,i)=>['lyric-line-'+i,c.root]),['preferenceCards',preferenceCards.root],['settings',toolbox],['magnifier',magnifyingGlass],['cabinet',cabinet.root],['cabinetImport',cabinet.add],['recorderImport',recorder.key],['recorder',recorder.root],['recorderSave',recorder.save],['recorderFolder',recorder.folder],...adPages.map((p,i)=>['ad-page-'+i,p.focusLabel]),...(recorder.output?[['recorderTape',recorder.output]]:[]),['archiveService',cabinet.service],...cabinet.drawers.map(d=>['drawer-'+d.id,d.handle]),...styleCards.map(c=>['style-'+c.style.id,c.picture]),...people.map((p,i)=>['person'+i,p.head])]){const p=g.getWorldPosition(new THREE.Vector3()).project(camera);out[id]=[(p.x+1)*innerWidth/2,(1-p.y)*innerHeight/2];}return out;}};

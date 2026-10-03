const {chromium}=require('/Users/a1/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('assert');
const WORK='/Users/a1/Documents/Codex/2026-09-25/files-pasted-by-the-user-cassette/work';
(async()=>{
 const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--autoplay-policy=no-user-gesture-required']});
 const page=await browser.newPage({viewport:{width:1440,height:1040}});
 const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
 await page.goto('http://127.0.0.1:8877/cassette-world.html');
 await page.waitForFunction(()=>!!window.cassetteWorld);
 await page.waitForTimeout(3800);
 const state=()=>page.evaluate(()=>window.cassetteWorld.state);
 const pos=id=>page.evaluate(id=>window.cassetteWorld.objectPositions[id],id);
 const click=async id=>{const p=await pos(id);assert(p,`no projected position for ${id}`);await page.mouse.click(p[0],p[1]);};
 const importVia=async(id,file,expected)=>{
  const chooser=page.waitForEvent('filechooser',{timeout:9000});
  await click(id);
  const fc=await chooser;
  await fc.setFiles([`${WORK}/${file}`]);
  await page.waitForFunction(n=>window.cassetteWorld.state.playlist.length===n,expected,{timeout:90000});
 };
 const settle=async()=>{await page.waitForFunction(()=>!window.cassetteWorld.state.busy,{timeout:40000});await page.waitForTimeout(1100);};
 const overview=async()=>{await page.keyboard.press('Escape');await page.waitForTimeout(2300);};

 // 1 — ARCHIVE channel files a tape without touching the recorder
 await importVia('cabinetImport','test-1.wav',1);
 await settle();
 let s=await state();
 assert.equal(s.playlist.length,1,'archive import adds exactly one tape');
 assert.equal(s.importChannel,'archive');
 assert.equal(s.recorder.trackId,null,'archive channel must not park a tape at the outlet');
 assert.equal(s.playlist[0].onRecorder,false,'archive tape is not held by the recorder');
 console.log('ARCHIVE',JSON.stringify({format:s.playlist[0].format,converted:s.playlist[0].converted,phase:s.recorder.phase,outlet:!!(await pos('recorderTape'))}));

 // 2 — both the cabinet and the recorder accept focus
 await overview();
 await click('recorder');await page.waitForTimeout(1600);
 s=await state();assert.equal(s.focusArea,'recorder','clicking the recorder focuses it');assert.equal(s.sceneState,'RECORDER_FOCUS');
 await overview();
 await click('cabinet');await page.waitForTimeout(1600);
 s=await state();assert.equal(s.focusArea,'cabinet','clicking the cabinet focuses it');assert.equal(s.sceneState,'CABINET_FOCUS');
 console.log('FOCUS',JSON.stringify({area:s.focusArea,scene:s.sceneState}));
 await overview();

 // 3 — RECORDER channel parks a tape at the outlet
 await importVia('recorderImport','test-2.wav',2);
 await settle();
 s=await state();
 assert.equal(s.importChannel,'recorder');
 assert.ok(s.recorder.trackId,'recorder channel parks a tape at the outlet');
 assert.equal(s.recorder.phase,'ready');
 assert.equal(s.playlist[1].onRecorder,true);
 assert.equal(s.playlist[1].format,'MP3','recorder channel always re-encodes');
 console.log('RECORDER',JSON.stringify({phase:s.recorder.phase,format:s.playlist[1].format,outlet:!!(await pos('recorderTape'))}));

 // 4 — the outlet tape can be dragged onto the cabinet and filed
 await overview();
 let outlet=await pos('recorderTape'),cabinet=await pos('cabinet');
 await page.mouse.move(outlet[0],outlet[1]);
 await page.mouse.down();
 await page.mouse.move((outlet[0]+cabinet[0])/2,(outlet[1]+cabinet[1])/2,{steps:14});
 await page.waitForTimeout(400);
 await page.mouse.move(cabinet[0],cabinet[1],{steps:10});
 await page.waitForTimeout(700);
 s=await state();
 assert.ok(s.tapeDrag,'dragging the outlet tape starts a tape drag');
 assert.equal(s.tapeDrag.origin,'recorder','the drag is tagged as a recorder pickup');
 await page.mouse.up();
 await settle();
 s=await state();
 assert.equal(s.recorder.trackId,null,'filed tape leaves the outlet empty');
 assert.equal(s.playlist[1].onRecorder,false,'filed tape is released from the recorder');
 console.log('DRAG->ARCHIVE',JSON.stringify({phase:s.recorder.phase,onRecorder:s.playlist[1].onRecorder}));

 // 5 — a second outlet tape can be dragged into the machine
 await importVia('recorderImport','test-3.wav',3);
 await settle();
 await overview();
 outlet=await pos('recorderTape');
 const door=await pos('door');
 assert.ok(outlet&&door,'outlet tape and door are both on screen');
 await page.mouse.move(outlet[0],outlet[1]);
 await page.mouse.down();
 await page.mouse.move((outlet[0]+door[0])/2,(outlet[1]+door[1])/2,{steps:14});
 await page.waitForTimeout(400);
 await page.mouse.move(door[0],door[1],{steps:12});
 await page.waitForTimeout(900);
 const door2=await pos('door');
 await page.mouse.move(door2[0],door2[1],{steps:6});
 await page.waitForTimeout(600);
 s=await state();
 assert.ok(s.tapeDrag,'tape drag is live over the door');
 assert.equal(s.tapeDrag.ready,true,'the door zone reports ready to load');
 await page.mouse.up();
 await page.waitForFunction(()=>window.cassetteWorld.state.loaded,{timeout:40000});
 await settle();
 s=await state();
 assert.equal(s.loaded,true,'the dragged outlet tape loads into the machine');
 assert.equal(s.currentTrack,2,'the loaded tape is the third archive entry');
 assert.equal(s.playlist[2].onRecorder,false,'a loaded tape is released from the recorder');
 console.log('DRAG->LOAD',JSON.stringify({loaded:s.loaded,currentTrack:s.currentTrack,transport:s.transportState}));

 await page.screenshot({path:'channel-check.png'});
 console.log('ERRORS',JSON.stringify(errors));
 console.log('CHECKS PASSED: archive channel, recorder channel, cabinet focus, recorder focus, outlet drag to archive, outlet drag to machine');
 await browser.close();
})().catch(e=>{console.error('FAILED',e);process.exit(1)});

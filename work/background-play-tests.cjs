const {chromium}=require('/Users/a1/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('assert');
const FILE='file:///Users/a1/Documents/Codex/2026-09-25/files-pasted-by-the-user-cassette/outputs/cassette-world.html';

(async()=>{
 const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--autoplay-policy=no-user-gesture-required']});
 const page=await browser.newPage({viewport:{width:1440,height:1040}});
 const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
 await page.goto(FILE);

 const waitFor=async(fn,timeout=60000,label='')=>{const start=Date.now();while(Date.now()-start<timeout){if(await page.evaluate(fn))return true;await page.waitForTimeout(120);}throw new Error('waitFor timeout: '+(label||String(fn).slice(0,70)));};
 const state=()=>page.evaluate(()=>window.cassetteWorld.state);
 const pos=id=>page.evaluate(id=>window.cassetteWorld.objectPositions[id],id);
 const click=async id=>page.mouse.click(...await pos(id));
 const setHidden=hidden=>page.evaluate(h=>{
  if(h){Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});Object.defineProperty(document,'visibilityState',{configurable:true,get:()=>'hidden'});}
  else{delete document.hidden;delete document.visibilityState;}
  document.dispatchEvent(new Event('visibilitychange'));
  return document.hidden;
 },hidden);

 await waitFor(()=>!!window.cassetteWorld,20000,'boot');
 await page.waitForTimeout(3400);

 await page.locator('#files').setInputFiles(['bg-1.wav','bg-2.wav']);
 await waitFor(()=>window.cassetteWorld.state.playlist.length===2&&!window.cassetteWorld.state.busy,90000,'library');
 console.log('LIBRARY',JSON.stringify(await page.evaluate(()=>window.cassetteWorld.state.playlist.map(t=>({title:t.title,dur:t.duration,fmt:t.format})))));

 await page.keyboard.press('Escape');
 await page.waitForTimeout(2400);
 await page.keyboard.press('Space');
 await waitFor(()=>window.cassetteWorld.state.loaded&&window.cassetteWorld.state.playing,60000,'playing');
 await page.waitForTimeout(300);
 let s=await state();
 assert.equal(s.currentTrack,0,'starts on track 0');
 console.log('FOREGROUND',JSON.stringify({track:s.currentTrack,t:+s.currentTime.toFixed(2),dur:s.duration,playing:s.playing,level:+s.response.left.toFixed(4)}));

 await click('repeatTab');
 await click('repeatTab');
 s=await state();
 assert.equal(s.repeatMode,'all','loop set to ALL');

 await page.evaluate(()=>{window.__bg={maxPending:0,samples:0};window.__bgTimer=setInterval(()=>{const st=window.cassetteWorld.state;window.__bg.maxPending=Math.max(window.__bg.maxPending,st.pendingTimelines);window.__bg.samples++;},40);});

 console.log('HIDDEN',await setHidden(true));
 const hiddenAt=Date.now();
 await waitFor(()=>window.cassetteWorld.state.currentTrack===1&&window.cassetteWorld.state.playing,25000,'background advance to track 1');
 s=await state();
 console.log('ADVANCE-1',JSON.stringify({track:s.currentTrack,t:+s.currentTime.toFixed(2),playing:s.playing,busy:s.busy,pending:s.pendingTimelines,hidden:s.hidden,level:+s.response.left.toFixed(4),transport:s.transportState,ms:Date.now()-hiddenAt}));
 assert.equal(s.currentTrack,1);
 assert(s.playing,'still playing while hidden');
 assert.equal(s.busy,false,'busy cleared without foreground');

 await waitFor(()=>window.cassetteWorld.state.currentTrack===0&&window.cassetteWorld.state.playing,25000,'background loop back to track 0');
 s=await state();
 console.log('ADVANCE-2',JSON.stringify({track:s.currentTrack,t:+s.currentTime.toFixed(2),playing:s.playing,pending:s.pendingTimelines,level:+s.response.left.toFixed(4),ms:Date.now()-hiddenAt}));
 assert.equal(s.currentTrack,0,'looped back to the first track');

 const bg=await page.evaluate(()=>window.__bg);
 console.log('BACKGROUND SAMPLER',JSON.stringify(bg));
 assert.equal(bg.maxPending,0,'no tween ever queued while hidden');
 assert(bg.samples>0,'sampler ran');

 console.log('VISIBLE',await setHidden(false));
 await page.waitForTimeout(900);
 s=await state();
 assert(s.playing&&!s.busy,'recovers after returning to the foreground');
 console.log('RESUMED',JSON.stringify({track:s.currentTrack,playing:s.playing,pending:s.pendingTimelines,scene:s.sceneState}));

 await page.evaluate(()=>{clearInterval(window.__bgTimer);window.__bg=null;});
 await page.keyboard.press('ArrowRight');
 await page.waitForTimeout(260);
 const mid=await state();
 assert(mid.busy||mid.pendingTimelines>0,`expected an in-flight transition, got busy=${mid.busy} pending=${mid.pendingTimelines}`);
 console.log('MID-TRANSITION',JSON.stringify({busy:mid.busy,pending:mid.pendingTimelines,track:mid.currentTrack}));
 await setHidden(true);
 await waitFor(()=>!window.cassetteWorld.state.busy,8000,'flush unstick');
 s=await state();
 console.log('FLUSHED',JSON.stringify({busy:s.busy,pending:s.pendingTimelines,track:s.currentTrack,loaded:s.loaded,playing:s.playing}));
 assert.equal(s.busy,false,'hide flushes the in-flight transition');
 assert.equal(s.pendingTimelines,0,'pending tweens flushed on hide');

 await setHidden(false);
 await page.waitForTimeout(1200);
 s=await state();
 console.log('FINAL',JSON.stringify({track:s.currentTrack,playing:s.playing,loaded:s.loaded,error:s.error}));
 assert(!s.error,'no error surfaced');

 console.log('CHECKS PASSED: background auto-advance, background loop, no stuck tweens, hide flushes in-flight transition, foreground recovery');
 console.log('ERRORS',JSON.stringify(errors));
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});

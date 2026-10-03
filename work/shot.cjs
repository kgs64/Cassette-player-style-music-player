const {chromium}=require('/Users/a1/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const WORK='/Users/a1/Documents/Codex/2026-09-25/files-pasted-by-the-user-cassette/work';
(async()=>{
 const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--autoplay-policy=no-user-gesture-required']});
 const page=await browser.newPage({viewport:{width:1440,height:1040}});
 await page.goto('http://127.0.0.1:8765/cassette-world.html');
 await page.waitForFunction(()=>!!window.cassetteWorld);
 await page.waitForTimeout(4000);
 const pos=id=>page.evaluate(id=>window.cassetteWorld.objectPositions[id],id);
 const click=async id=>{const p=await pos(id);await page.mouse.click(p[0],p[1]);};
 const waitIdle=async()=>{const start=Date.now();while(Date.now()-start<60000){if(await page.evaluate(()=>!window.cassetteWorld.state.busy))return;await page.waitForTimeout(250);}};
 const chooser=page.waitForEvent('filechooser',{timeout:9000});
 await click('cabinetImport');
 const fc=await chooser;
 await fc.setFiles([`${WORK}/test-1.wav`]);
 const start=Date.now();while(Date.now()-start<90000){if(await page.evaluate(()=>window.cassetteWorld.state.playlist.length===1&&!window.cassetteWorld.state.busy))break;await page.waitForTimeout(250);}
 await page.waitForTimeout(1500);
 await page.screenshot({path:'shot-archive.png'});
 await page.keyboard.press('Escape');await page.waitForTimeout(2400);
 const chooser2=page.waitForEvent('filechooser',{timeout:9000});
 await click('recorderImport');
 const fc2=await chooser2;
 await fc2.setFiles([`${WORK}/test-2.wav`]);
 const start2=Date.now();while(Date.now()-start2<90000){if(await page.evaluate(()=>window.cassetteWorld.state.recorder.phase==='ready'&&!window.cassetteWorld.state.busy))break;await page.waitForTimeout(250);}
 await page.waitForTimeout(1200);
 await page.screenshot({path:'shot-recorder.png'});
 console.log('SHOTS OK',JSON.stringify(await page.evaluate(()=>({len:window.cassetteWorld.state.playlist.length,outlet:window.cassetteWorld.state.recorder.trackId,focus:window.cassetteWorld.state.focusArea}))));
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});

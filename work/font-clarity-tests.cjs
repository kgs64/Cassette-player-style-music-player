const {chromium}=require('/Users/a1/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('assert');
const ROOT='/Users/a1/Documents/Codex/2026-09-25/files-pasted-by-the-user-cassette/work';
(async()=>{
 const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1040},deviceScaleFactor:1});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.goto(process.env.CASSETTE_URL||'http://127.0.0.1:8878/index.html?v=5.6');
  await page.waitForFunction(()=>window.cassetteWorld?.state.archive.ready&&window.cassetteWorld.state.version==='5.6');await page.waitForTimeout(3600);
  const click=async id=>{const p=await page.evaluate(id=>cassetteWorld.objectPositions[id],id);assert(p,`missing ${id}`);await page.mouse.click(...p);};
  const chooserPromise=page.waitForEvent('filechooser');await click('cabinetImport');
  await (await chooserPromise).setFiles(`${ROOT}/test-1.wav`);
  await page.waitForFunction(()=>cassetteWorld.state.playlist.length>0,{},{timeout:90000});await page.waitForTimeout(1300);
  await page.keyboard.press('Escape');await page.waitForTimeout(1600);await page.screenshot({path:'/private/tmp/cassette-font-overview.png'});
  await page.keyboard.press('2');await page.waitForTimeout(1300);await page.screenshot({path:'/private/tmp/cassette-font-machine.png'});
  await page.keyboard.press('Escape');await page.waitForTimeout(1500);await click('cabinet');await page.waitForTimeout(1300);await page.screenshot({path:'/private/tmp/cassette-font-cabinet.png'});
  assert.deepEqual(errors,[]);console.log('PASS font rendering has no runtime or WebGL errors');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});

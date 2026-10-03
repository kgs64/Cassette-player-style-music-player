const {chromium}=require('/Users/a1/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1040}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  const state=()=>page.evaluate(()=>cassetteWorld.state);
  const click=async id=>page.mouse.click(...await page.evaluate(id=>cassetteWorld.objectPositions[id],id));
  await page.goto('http://127.0.0.1:8878/index.html');await page.waitForFunction(()=>window.cassetteWorld?.state.archive.ready);await page.waitForTimeout(3400);
  console.log('initial resources', (await state()).performance);
  await click('settings');await page.locator('#machine-settings').waitFor({state:'visible'});
  await page.locator('[name=effects]').uncheck();await page.locator('[name=shuffle]').selectOption('1');await page.locator('[name=repeat]').selectOption('2');await page.locator('[name=stereo]').selectOption('1');
  await page.locator('[name=volume]').fill('42');await page.locator('[name=volume]').dispatchEvent('input');
  let s=await state();assert.equal(s.volume,.42);assert.equal(s.effectsEnabled,false);assert.equal(s.shuffle,true);assert.equal(s.repeatMode,'all');assert.equal(s.stereoMono,true);
  await page.keyboard.press('Escape');assert.equal((await state()).settingsOpen,false);await page.waitForTimeout(700);
  await page.reload();await page.waitForFunction(()=>window.cassetteWorld?.state.archive.ready);await page.waitForTimeout(1500);
  s=await state();assert.equal(s.volume,.42);assert.equal(s.effectsEnabled,false);assert.equal(s.shuffle,true);
  console.log('PASS physical toolbox, live settings, persistence and Escape');
  await page.keyboard.press('Escape');await page.waitForTimeout(1300);
  let baseline;
  for(let i=0;i<3;i++){
   await click('magnifier');await page.waitForFunction(()=>cassetteWorld.state.lensPhase==='held');
   if(i===0)await page.screenshot({path:'/private/tmp/cassette-held-lens.png'});
   await page.keyboard.press('Escape');await page.waitForFunction(()=>cassetteWorld.state.lensPhase==='resting');
   await page.keyboard.press('Escape');await page.waitForTimeout(1300);
   if(i===0)baseline=(await state()).performance; // Warm previously culled geometry once.
  }
  s=await state();assert.equal(s.performance.textures,baseline.textures);assert.equal(s.performance.geometries,baseline.geometries);
  console.log('PASS lift / hold / lower ×3; stable texture and geometry counts');
  const mobile=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});mobile.on('pageerror',e=>errors.push(e.message));
  await mobile.goto('http://127.0.0.1:8878/index.html');await mobile.waitForFunction(()=>window.cassetteWorld?.state.archive.ready);await mobile.waitForTimeout(3400);
  await mobile.getByRole('button',{name:'设置',exact:true}).click();await mobile.locator('#machine-settings').waitFor({state:'visible'});assert(await mobile.locator('#machine-settings article').evaluate(e=>e.getBoundingClientRect().right<=innerWidth));
  await mobile.getByRole('button',{name:'关闭设置'}).click();await mobile.getByRole('button',{name:'放大镜',exact:true}).click();await mobile.waitForFunction(()=>cassetteWorld.state.lensPhase==='held');await mobile.screenshot({path:'/private/tmp/cassette-held-lens-mobile.png'});
  await mobile.getByRole('button',{name:'关闭放大镜'}).click();await mobile.waitForFunction(()=>cassetteWorld.state.lensPhase==='resting');assert.deepEqual(errors,[]);console.log('PASS phone touch layout; no runtime errors');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});

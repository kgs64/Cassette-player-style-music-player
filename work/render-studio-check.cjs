// Independent browser contexts; never clear the user's IndexedDB or music.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const esbuild=require('esbuild');
const {chromium,devices}=require('/Users/a1/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(__dirname,'..'),out=path.join(__dirname,'render-checks');fs.mkdirSync(out,{recursive:true});
const qa=path.join(__dirname,'render-qa-after.html');
const injected=`
window.renderQA={view(){finishIntro();cameraMotion=null;camera.position.set(15,13,27);controls.target.set(1.8,3.1,1);camera.lookAt(controls.target);controls.update();loadedTape.visible=true;renderer.shadowMap.needsUpdate=true;},style:changeStyle,studio:studioRendering,quality:setRenderQuality,
benchmark(){const draw=()=>{if(renderQuality){if(!composer)createFocusComposer();bokeh.enabled=false;composer.render();}else renderer.render(scene,camera);};const gl=renderer.getContext();for(let i=0;i<4;i++)draw();gl.finish();const times=[];for(let i=0;i<30;i++){const start=performance.now();draw();gl.finish();times.push(performance.now()-start);}times.sort((a,b)=>a-b);const ext=gl.getExtension('WEBGL_debug_renderer_info');return {medianSyncedFrameMs:times[15],p95SyncedFrameMs:times[28],renderer:ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):'unknown'};}};
`;
const js=esbuild.buildSync({stdin:{contents:fs.readFileSync(path.join(__dirname,'app.js'),'utf8')+injected,sourcefile:'app.js',resolveDir:__dirname},bundle:true,minify:true,format:'iife',target:'es2020',write:false}).outputFiles[0].text.replace(/<\/script/gi,'<\\/script');
const template=fs.readFileSync(path.join(root,'outputs/index.html'),'utf8');fs.writeFileSync(qa,template.replace(/<script>([\s\S]*?)<\/script>/g,(whole,body)=>body.length>10000?'<script>'+js+'</script>':whole));
(async()=>{
 const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});const errors=[],report={reference:'/Users/a1/Desktop/1.png',viewport:[1500,1000],camera:[15,13,27],target:[1.8,3.1,1]};
 try{
  const page=await browser.newPage({viewport:{width:1500,height:1000}});page.on('pageerror',e=>errors.push(e.message));
  const response=await page.goto(process.env.CASSETTE_QA_URL||'http://127.0.0.1:8878/work/render-qa-after.html');assert.equal(response.status(),200);
  await page.waitForFunction(()=>window.renderQA&&cassetteWorld.state.archive.ready);await page.waitForTimeout(3600);
  await page.evaluate(()=>renderQA.view());await page.waitForTimeout(1400);await page.screenshot({path:path.join(out,'after.png')});
  report.rendering=await page.evaluate(()=>cassetteWorld.state.rendering);assert.equal(report.rendering.sharedMaps,2);assert.equal(report.rendering.shadowSize,2048);
  report.timing={balanced:await page.evaluate(()=>renderQA.benchmark())};
  report.initialResources=await page.evaluate(()=>cassetteWorld.state.performance);
  for(const style of ['timber','orbit','mono','studio']){
   await page.evaluate(id=>renderQA.style(id),style);await page.evaluate(()=>renderQA.view());await page.waitForTimeout(700);
   const state=await page.evaluate(()=>cassetteWorld.state);assert.equal(state.style,style);assert.equal(state.busy,false);assert.equal(state.people.length,14);
   await page.screenshot({path:path.join(out,style+'.png')});
  }
  // Wood's initially invisible map is uploaded on its first appearance. Warm it
  // before testing repeated switches, so first allocation is not called a leak.
  const baseline=await page.evaluate(()=>cassetteWorld.state.performance);
  for(const style of ['timber','orbit','mono','studio']){await page.evaluate(id=>renderQA.style(id),style);await page.evaluate(()=>renderQA.view());await page.waitForTimeout(300);}
  report.resources=await page.evaluate(()=>cassetteWorld.state.performance);assert.equal(report.resources.textures,baseline.textures);assert.equal(report.resources.geometries,baseline.geometries);
  await page.keyboard.press('2');await page.waitForTimeout(1800);assert.equal(await page.evaluate(()=>cassetteWorld.state.focusArea),'center');await page.screenshot({path:path.join(out,'closeup.png')});
  await page.keyboard.press('Escape');await page.waitForTimeout(1500);
  const click=async id=>page.mouse.click(...await page.evaluate(id=>cassetteWorld.objectPositions[id],id));
  await click('settings');await page.locator('#machine-settings').waitFor({state:'visible'});await page.locator('[name=renderQuality]').selectOption('1');await page.keyboard.press('Escape');await page.evaluate(()=>renderQA.view());await page.waitForTimeout(1000);
  assert.equal(await page.evaluate(()=>cassetteWorld.state.rendering.quality),'photographic');await page.screenshot({path:path.join(out,'photographic.png')});report.timing.photographic=await page.evaluate(()=>renderQA.benchmark());
  await page.evaluate(()=>renderQA.quality(0));await page.waitForTimeout(300);let settled;
  for(let i=0;i<3;i++){await page.evaluate(()=>renderQA.quality(1));await page.waitForTimeout(300);await page.evaluate(()=>renderQA.quality(0));await page.waitForTimeout(300);const resource=await page.evaluate(()=>cassetteWorld.state.performance);if(i===0)settled=resource;else{assert.equal(resource.textures,settled.textures);assert.equal(resource.geometries,settled.geometries);}}
  report.afterQualityToggles=settled;
  await click('magnifier');await page.locator('#tape-inspector').waitFor({state:'visible'});assert.equal(await page.evaluate(()=>cassetteWorld.state.lensPhase),'resting');await page.getByRole('button',{name:'关闭放大镜'}).click();
  const phone=await browser.newPage({...devices['iPhone 13']});phone.on('pageerror',e=>errors.push(e.message));
  await phone.goto(process.env.CASSETTE_URL||'http://127.0.0.1:8877/index.html');await phone.waitForFunction(()=>window.cassetteWorld?.state.archive.ready);await phone.waitForTimeout(3500);
  const mobile=await phone.evaluate(()=>cassetteWorld.state);assert.equal(mobile.rendering.shadowSize,1024);assert(mobile.performance.pixelRatio<=1.25);assert.equal(mobile.people.length,14);assert.equal(await phone.locator('#mobile-tools button').count(),6);
  await phone.getByRole('button',{name:'设置',exact:true}).click();await phone.locator('#machine-settings').waitFor({state:'visible'});assert(await phone.locator('#machine-settings article').evaluate(e=>e.getBoundingClientRect().right<=innerWidth));assert(await phone.locator('[name=renderQuality]').isDisabled());await phone.getByRole('button',{name:'关闭设置'}).click();
  await phone.getByRole('button',{name:'放大镜',exact:true}).click();await phone.locator('#tape-inspector').waitFor({state:'visible'});assert.equal(await phone.evaluate(()=>cassetteWorld.state.lensPhase),'resting');await phone.getByRole('button',{name:'关闭放大镜'}).click();await phone.screenshot({path:path.join(out,'mobile.png')});
  report.mobile={rendering:mobile.rendering,performance:mobile.performance};report.errors=errors;assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'validation.json'),JSON.stringify(report,null,2));console.log('WEB_STUDIO_PASS',JSON.stringify(report));
 }finally{await browser.close();fs.rmSync(qa,{force:true});}
})().catch(e=>{console.error(e);process.exitCode=1;});

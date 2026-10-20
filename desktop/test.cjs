const {_electron}=require('/Users/a1/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');const assert=require('node:assert/strict');const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
(async()=>{const profile=fs.mkdtempSync(path.join(os.tmpdir(),'cassette-desktop-test-'));let electron;try{
 electron=await _electron.launch({executablePath:path.join(__dirname,'dist/Cassette World.app/Contents/MacOS/Electron'),env:{...process.env,CASSETTE_TEST_PROFILE:profile},timeout:60000});
 const page=await electron.firstWindow();const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
 await page.waitForFunction(()=>window.cassetteWorld?.state.archive.ready,{timeout:60000});await page.waitForTimeout(5000);
 assert.equal(await page.evaluate(()=>typeof window.require),'undefined');assert.equal(await page.evaluate(()=>isSecureContext),true);
 await page.locator('#files').setInputFiles(path.join(__dirname,'../outputs/test-tone.wav'));await page.waitForFunction(()=>cassetteWorld.state.playlist.length>0);
 const imported=await page.evaluate(()=>cassetteWorld.state.playlist.length);await page.evaluate(()=>localStorage.setItem('desktop-persistence-probe','ok'));
 await page.reload();await page.waitForFunction(()=>window.cassetteWorld?.state.archive.ready);assert.equal(await page.evaluate(()=>localStorage.getItem('desktop-persistence-probe')),'ok');assert.equal(await page.evaluate(()=>cassetteWorld.state.playlist.length),imported);
 await page.locator('#files').setInputFiles(path.join(__dirname,'../outputs/test-tone.wav'));await page.waitForTimeout(1200);assert.equal(await page.evaluate(()=>cassetteWorld.state.playlist.length),imported);assert.notEqual(await page.evaluate(()=>cassetteWorld.state.recorder.phase),'error');console.log('PASS duplicate preflight preserves archive and recorder');
 await page.waitForTimeout(4500);
 await page.bringToFront();await page.keyboard.press('Escape');await page.waitForTimeout(1300);await page.screenshot({path:'/tmp/desktop-before-recorder.png'});console.log('RECORDER',await page.evaluate(()=>({p:cassetteWorld.objectPositions.recorderImport,busy:cassetteWorld.state.busy,settings:cassetteWorld.state.settingsOpen})));const chooser=page.waitForEvent('filechooser');await page.mouse.click(...await page.evaluate(()=>cassetteWorld.objectPositions.recorderImport));await (await chooser).setFiles({name:'desktop-transcode.wav',mimeType:'audio/wav',buffer:fs.readFileSync(path.join(__dirname,'../outputs/test-tone.wav'))});
 await page.waitForFunction(()=>['ready','error'].includes(cassetteWorld.state.recorder.phase),{}, {timeout:90000});assert.equal(await page.evaluate(()=>cassetteWorld.state.recorder.phase),'ready');
 assert.equal(await page.evaluate(()=>cassetteWorld.state.playlist.at(-1).format),'MP3');
 await electron.evaluate(({BrowserWindow})=>{BrowserWindow.getAllWindows()[0].webContents.session.once('will-download',(_,item)=>{item.setSavePath('/tmp/cassette-desktop-output.mp3');item.once('done',(_,state)=>globalThis.downloadResult=state);});});
 await page.waitForTimeout(1200);await page.mouse.click(...await page.evaluate(()=>cassetteWorld.objectPositions.recorderTape));
 for(let i=0;i<100;i++){if(await electron.evaluate(()=>globalThis.downloadResult==='completed'))break;await page.waitForTimeout(200);}
 assert(fs.statSync('/tmp/cassette-desktop-output.mp3').size>1000);assert.equal(fs.readFileSync('/tmp/cassette-desktop-output.mp3').subarray(0,3).toString(),'ID3');
 console.log('PASS desktop WAV to MP3 conversion and native download');
 await page.screenshot({path:'/tmp/cassette-desktop.png'});
 const security=await electron.evaluate(({BrowserWindow})=>{const w=BrowserWindow.getAllWindows()[0],p=w.webContents.getLastWebPreferences();return{sandbox:p.sandbox,nodeIntegration:p.nodeIntegration,contextIsolation:p.contextIsolation}});assert.deepEqual(security,{sandbox:true,nodeIntegration:false,contextIsolation:true});
 assert.deepEqual(errors,[]);console.log(JSON.stringify({result:'PASS',url:page.url(),imported,persistence:true,security}));
 }finally{if(electron)await electron.close();fs.rmSync(profile,{recursive:true,force:true});}})().catch(e=>{console.error(e);process.exitCode=1});

const {chromium}=require('/Users/a1/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('assert');
(async()=>{
 const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1040}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.goto('http://127.0.0.1:8877/index.html?v=5.6');
  await page.waitForFunction(()=>cassetteWorld?.state.archive.ready&&cassetteWorld.state.version==='5.6');await page.waitForTimeout(3000);
  await page.keyboard.press('2');await page.waitForTimeout(1300);await page.screenshot({path:'/private/tmp/cassette-font-8877.png'});
  assert.deepEqual(errors,[]);console.log('PASS 8877 serves 5.6 with no runtime or WebGL errors');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});

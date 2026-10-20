const {app,BrowserWindow,Menu,protocol,net,dialog}=require('electron');
const fs=require('node:fs');const path=require('node:path');const {pathToFileURL}=require('node:url');
protocol.registerSchemesAsPrivileged([{scheme:'cassette',privileges:{standard:true,secure:true,supportFetchAPI:true,corsEnabled:true,stream:true,codeCache:true}}]);
app.setName('Cassette World');
if(process.env.CASSETTE_TEST_PROFILE)app.setPath('userData',process.env.CASSETTE_TEST_PROFILE);
let window;
const origin='cassette://world';
const safeURL=url=>{try{const u=new URL(url);return u.protocol==='cassette:'&&u.host==='world';}catch{return false;}};
const stateFile=()=>path.join(app.getPath('userData'),'window.json');
function createWindow(){
 let geometry={width:1360,height:920};try{const saved=JSON.parse(fs.readFileSync(stateFile(),'utf8'));if(Number.isFinite(saved.width)&&Number.isFinite(saved.height))geometry={width:Math.max(900,Math.min(2400,saved.width)),height:Math.max(640,Math.min(1600,saved.height))};}catch{}
 window=new BrowserWindow({...geometry,minWidth:900,minHeight:640,show:false,title:'Cassette World',backgroundColor:'#cecdc5',titleBarStyle:'hiddenInset',trafficLightPosition:{x:16,y:16},webPreferences:{nodeIntegration:false,contextIsolation:true,sandbox:true,webSecurity:true,spellcheck:false}});
 window.webContents.setWindowOpenHandler(()=>({action:'deny'}));
 window.webContents.on('will-navigate',(event,url)=>{if(!safeURL(url))event.preventDefault();});
 window.webContents.on('will-attach-webview',event=>event.preventDefault());
 window.webContents.session.setPermissionRequestHandler((contents,permission,callback)=>callback(safeURL(contents.getURL())&&permission==='fullscreen'));
 window.webContents.session.removeAllListeners('will-download');
 window.webContents.session.on('will-download',(_event,item)=>{item.setSaveDialogOptions({title:'保存到本地',defaultPath:path.join(app.getPath('downloads'),path.basename(item.getFilename())),showsTagField:true});});
 window.once('ready-to-show',()=>window.show());
 window.on('close',()=>{try{const {width,height}=window.getNormalBounds();fs.writeFileSync(stateFile(),JSON.stringify({width,height}));}catch{}});
 window.on('closed',()=>{window=null;});
 window.webContents.on('did-fail-load',(_event,code,description)=>{if(code!==-3)dialog.showErrorBox('播放器未能打开',description);});
 window.webContents.on('did-finish-load',()=>{window.webContents.insertCSS(`body::before{content:'';position:fixed;left:0;right:0;top:0;height:48px;z-index:10;-webkit-app-region:drag;pointer-events:none}#machine-settings,#preference-card{ -webkit-app-region:no-drag }`);});
 window.loadURL(origin+'/index.html');
}
const gotLock=app.requestSingleInstanceLock();
if(!gotLock)app.quit();else{
 app.on('second-instance',()=>{if(window){if(window.isMinimized())window.restore();window.show();window.focus();}});
 app.whenReady().then(()=>{
  const assets=path.join(__dirname,'web');
  protocol.handle('cassette',request=>{try{const u=new URL(request.url);if(u.host!=='world'||!['GET','HEAD'].includes(request.method))return new Response('',{status:403});const relative=decodeURIComponent(u.pathname).replace(/^\/+/,''),file=path.resolve(assets,relative||'index.html');if(!file.startsWith(assets+path.sep))return new Response('',{status:403});return net.fetch(pathToFileURL(file).href);}catch{return new Response('',{status:404});}});
  Menu.setApplicationMenu(Menu.buildFromTemplate([
   {label:'Cassette World',submenu:[{role:'about',label:'关于 Cassette World'},{type:'separator'},{role:'hide',label:'隐藏 Cassette World'},{role:'hideOthers',label:'隐藏其他'},{role:'unhide',label:'显示全部'},{type:'separator'},{role:'quit',label:'退出 Cassette World'}]},
   {label:'编辑',submenu:[{role:'undo',label:'撤销'},{role:'redo',label:'重做'},{type:'separator'},{role:'cut',label:'剪切'},{role:'copy',label:'复制'},{role:'paste',label:'粘贴'},{role:'selectAll',label:'全选'}]},
   {label:'显示',submenu:[{role:'togglefullscreen',label:'进入／退出全屏'},{label:'重新载入播放器',accelerator:'CmdOrCtrl+R',click:async()=>{const answer=await dialog.showMessageBox(window,{type:'question',message:'重新载入会中断当前播放，是否继续？',buttons:['取消','重新载入'],defaultId:0,cancelId:0});if(answer.response===1)window?.reload();}}]},
   {label:'窗口',submenu:[{role:'minimize',label:'最小化'},{role:'zoom',label:'缩放'},{type:'separator'},{role:'front',label:'前置全部窗口'}]}
  ]));
  app.setAboutPanelOptions({applicationName:'Cassette World',applicationVersion:app.getVersion(),copyright:'复古微缩音乐世界 · 桌面版',credits:'Three.js / Electron 与项目内第三方许可见随附说明。'});
  createWindow();app.on('activate',()=>{if(!BrowserWindow.getAllWindows().length)createWindow();});
 });
 app.on('window-all-closed',()=>{if(process.platform!=='darwin')app.quit();});
}

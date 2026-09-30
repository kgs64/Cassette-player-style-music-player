const CACHE='cassette-world-shell-v19-20260930-sticky-search-close';
const SHELL=['./index.html','./manifest.webmanifest','./icons/icon-192.png','./icons/icon-512.png','./icons/apple-touch-icon.png'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL))));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('cassette-world-shell-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
 const url=new URL(event.request.url);if(event.request.method!=='GET'||url.origin!==self.location.origin)return;
 // Audio remains in IndexedDB; never copy an imported Blob into shell caches.
 if(event.request.mode==='navigate'&&['./','./index.html','./cassette-world.html'].some(path=>new URL(path,self.registration.scope).pathname===url.pathname))event.respondWith(fetch(event.request).then(response=>{if(response.ok){const copy=response.clone();event.waitUntil(caches.open(CACHE).then(cache=>cache.put('./index.html',copy)));}return response;}).catch(()=>caches.match('./index.html')));
 else if(SHELL.some(path=>new URL(path,self.registration.scope).href===url.href))event.respondWith(caches.match(event.request).then(hit=>hit||fetch(event.request)));
});

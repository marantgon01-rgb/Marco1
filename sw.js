const APP='app-v1', TILES='tiles-v1';
const SHELL=['./','index.html','Areias_x_Cunha.gpx','manifest.webmanifest',
 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js',
 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css'];
self.addEventListener('install',e=>{ e.waitUntil(caches.open(APP).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting())); });
self.addEventListener('activate',e=>{ e.waitUntil(self.clients.claim()); });
const TILE_HOSTS=/arcgisonline\.com|tile\.opentopomap\.org|tile\.openstreetmap\.org/;
// OpenTopoMap usa a/b/c: guarda tudo sob o subdomínio "a" para o cache bater
const norm=u=>u.replace(/\/\/[abc]\.tile\.opentopomap\.org/,'//a.tile.opentopomap.org');
self.addEventListener('fetch',e=>{
  const url=e.request.url;
  if(e.request.method!=='GET') return;
  if(TILE_HOSTS.test(url)){
    const key=norm(url);
    e.respondWith(caches.open(TILES).then(async c=>{
      const hit=await c.match(key); if(hit) return hit;
      try{ const r=await fetch(e.request); if(r.ok||r.type==='opaque') c.put(key,r.clone()); return r; }
      catch(err){ return new Response('',{status:504}); }
    }));
    return;
  }
  // página e Leaflet: rede primeiro, cache se estiver sem sinal
  e.respondWith(fetch(e.request).then(r=>{ if(r.ok){ const cp=r.clone(); caches.open(APP).then(c=>c.put(e.request,cp)); } return r; })
    .catch(()=>caches.match(e.request,{ignoreSearch:true}).then(r=>r||caches.match('index.html'))));
});

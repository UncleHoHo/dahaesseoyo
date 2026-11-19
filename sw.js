/* 다 했어요: 인터넷이 끊겨도 열리도록 앱 파일과 글꼴을 기기에 보관한다. */
const VERSION = 'dahaesseoyo-v1';
const SHELL = ['./', 'index.html', 'manifest.webmanifest', 'icons/icon-180.png', 'icons/icon-192.png', 'icons/icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(VERSION).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const font = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
  if (url.origin !== self.location.origin && !font) return;
  event.respondWith(
    caches.open(VERSION).then(async (cache) => {
      const hit = await cache.match(req);
      const fresh = fetch(req)
        .then((res) => {
          if (res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone());
          return res;
        })
        .catch(() => hit || (req.mode === 'navigate' ? cache.match('./') : undefined));
      if (font) return hit || fresh;           // 글꼴: 보관해 둔 것 먼저
      if (hit) { event.waitUntil(fresh); return hit; }   // 앱 파일: 보관본을 바로 열고 뒤에서 새로 받아 둠
      return fresh;
    })
  );
});

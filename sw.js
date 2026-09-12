/* 瞬時単語TEST - Service Worker */
const CACHE_NAME = 'shunji-v1';
const CORE_ASSETS = [
  './',
  './index.html',
  './config.js',
  './manifest.json'
];

/* 安装：预缓存核心文件 */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(CORE_ASSETS))
  );
  self.skipWaiting();
});

/* 激活：清理旧版本缓存 */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

/* 拦截请求：网络优先，失败时用缓存 */
self.addEventListener('fetch', event => {
  const req = event.request;

  /* 只处理 GET */
  if (req.method !== 'GET') return;

  /* Supabase 请求永远走网络，不缓存 */
  if (req.url.includes('supabase.co')) return;

  /* CDN 库（xlsx/tesseract/pdf.js 等）：缓存优先 */
  if (req.url.includes('cdn.jsdelivr.net')) {
    event.respondWith(
      caches.match(req).then(cached => {
        if (cached) return cached;
        return fetch(req).then(res => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(req, copy));
          return res;
        }).catch(() => cached);
      })
    );
    return;
  }

  /* 本地文件：网络优先，离线时用缓存 */
  event.respondWith(
    fetch(req)
      .then(res => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then(c => c.put(req, copy));
        return res;
      })
      .catch(() => caches.match(req))
  );
});
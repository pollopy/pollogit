/* ═══════════════════════════════════════════════════════
   Service Worker — 综合功能性训练计划 PWA
   策略：Cache First（离线优先），首次访问缓存所有资源
═══════════════════════════════════════════════════════ */

const CACHE_NAME = 'training-plan-v1';

const FILES_TO_CACHE = [
  './训练计划.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

/* ── 安装：缓存所有文件 ── */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(FILES_TO_CACHE);
    }).catch((err) => {
      console.warn('[SW] 缓存部分文件失败：', err);
    })
  );
  self.skipWaiting();
});

/* ── 激活：清理旧版本缓存 ── */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

/* ── 拦截请求：优先返回缓存，缓存未命中则请求网络 ── */
self.addEventListener('fetch', (event) => {
  // 只处理 GET 请求
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      // 缓存未命中，从网络获取并加入缓存
      return fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const cloned = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, cloned);
          });
        }
        return networkResponse;
      }).catch(() => {
        // 网络也失败时，返回主 HTML（离线兜底）
        return caches.match('./训练计划.html');
      });
    })
  );
});

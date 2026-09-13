// Service Worker Push Notification Handler for Deux PWA
self.addEventListener('push', (event) => {
  let data = {
    title: 'Deux - Espace Couple',
    body: 'Nouvelle alerte de votre partenaire',
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    url: '/',
    type: 'general',
  };

  try {
    if (event.data) {
      data = { ...data, ...event.data.json() };
    }
  } catch (e) {
    if (event.data) {
      data.body = event.data.text();
    }
  }

  const notificationOptions = {
    body: data.body,
    icon: data.icon || '/pwa-192x192.png',
    badge: data.badge || '/pwa-192x192.png',
    tag: `deux-${data.type || 'alert'}-${Date.now()}`,
    renotify: true,
    vibrate: [200, 100, 200, 100, 200],
    data: {
      url: data.url || '/',
      type: data.type,
      timestamp: Date.now(),
    },
    actions: [
      {
        action: 'open_app',
        title: 'Ouvrir Deux ❤️',
      },
    ],
  };

  event.waitUntil(
    (async () => {
      // 1. Show native system notification
      await self.registration.showNotification(data.title, notificationOptions);

      // 2. Broadcast to open app tabs so live in-app banners update in real-time
      const clientList = await clients.matchAll({ type: 'window', includeUncontrolled: true });
      for (const client of clientList) {
        client.postMessage({
          type: 'PUSH_NOTIFICATION_RECEIVED',
          notification: {
            title: data.title,
            body: data.body,
            icon: data.icon,
            url: data.url,
            type: data.type,
            createdAt: new Date().toISOString(),
          },
        });
      }
    })()
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) ? event.notification.data.url : '/';

  event.waitUntil(
    (async () => {
      const clientList = await clients.matchAll({ type: 'window', includeUncontrolled: true });
      // If a window is already open, focus it and notify client
      for (const client of clientList) {
        if ('focus' in client) {
          await client.focus();
          client.postMessage({
            type: 'NOTIFICATION_NAVIGATE',
            url: targetUrl,
            action: event.action,
          });
          return;
        }
      }
      // If no window is open, open a new one
      if (clients.openWindow) {
        await clients.openWindow(targetUrl);
      }
    })()
  );
});

self.addEventListener('pushsubscriptionchange', (event) => {
  event.waitUntil(
    (async () => {
      try {
        const keyRes = await fetch('/api/push/vapid-public-key');
        const { publicKey } = await keyRes.json();
        if (!publicKey) return;

        const convertedKey = urlB64ToUint8Array(publicKey);
        const newSubscription = await self.registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedKey,
        });

        await fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subscription: newSubscription,
          }),
        });
      } catch (err) {
        console.error('Failed to renew push subscription', err);
      }
    })()
  );
});

function urlB64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

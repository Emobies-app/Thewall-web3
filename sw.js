// Push Notifications
self.addEventListener('push', e => {
  const data = e.data?.json() ?? {
    title: 'TheWall',
    body: 'You have a new notification'
  };
  e.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      data: { url: data.url || '/' }
    })
  );
});

// Click opens the app
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(clients.openWindow(e.notification.data.url));
});
Then in your app, ask permission and subscribe:
async function subscribePush() {
  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: '<YOUR_VAPID_PUBLIC_KEY>'
  });
  // Send `sub` to your backend to store
  await fetch('/api/push/subscribe', {
    method: 'POST',
    body: JSON.stringify(sub),
    headers: { 'Content-Type': 'application/json' }
  });
}

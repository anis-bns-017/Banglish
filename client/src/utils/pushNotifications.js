// Convert base64 to Uint8Array for VAPID key
const urlBase64ToUint8Array = (base64String) => {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

// Check if push notifications are supported
export const isPushSupported = () => {
  return 'serviceWorker' in navigator && 'PushManager' in window;
};

// Get current subscription
export const getSubscription = async () => {
  if (!isPushSupported()) return null;

  const registration = await navigator.serviceWorker.ready;
  return await registration.pushManager.getSubscription();
};

// Subscribe to push notifications
export const subscribeToPush = async (vapidPublicKey) => {
  if (!isPushSupported()) {
    throw new Error('Push notifications not supported');
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    
    // Check for existing subscription
    let subscription = await registration.pushManager.getSubscription();
    
    if (!subscription) {
      // Subscribe
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
      });
    }

    return subscription;
  } catch (error) {
    console.error('Failed to subscribe to push:', error);
    throw error;
  }
};

// Unsubscribe from push notifications
export const unsubscribeFromPush = async () => {
  if (!isPushSupported()) return;

  try {
    const subscription = await getSubscription();
    if (subscription) {
      await subscription.unsubscribe();
    }
  } catch (error) {
    console.error('Failed to unsubscribe:', error);
    throw error;
  }
};

// Handle push notification click
export const handleNotificationClick = (event) => {
  event.notification.close();

  const url = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If already open, focus
      for (const client of clientList) {
        if (client.url === url && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open new window
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
};
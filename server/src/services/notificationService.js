import webpush from 'web-push';
import User from '../models/User.js';

// Configure web-push with VAPID keys
// Generate keys with: npx web-push generate-vapid-keys
const vapidKeys = {
  publicKey: process.env.VAPID_PUBLIC_KEY,
  privateKey: process.env.VAPID_PRIVATE_KEY
};

webpush.setVapidDetails(
  'mailto:admin@hilokalclone.com',
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

// Save subscription
export const saveSubscription = async (userId, subscription) => {
  try {
    await User.findByIdAndUpdate(userId, {
      pushSubscription: subscription
    });
  } catch (error) {
    console.error('Save subscription error:', error);
  }
};

// Send push notification
export const sendPushNotification = async (userId, notification) => {
  try {
    const user = await User.findById(userId).select('pushSubscription');
    
    if (!user?.pushSubscription) {
      return;
    }

    const payload = JSON.stringify({
      title: notification.title,
      body: notification.body,
      icon: '/icon-192.png',
      badge: '/badge-72.png',
      data: notification.data,
      actions: notification.actions || [
        { action: 'open', title: 'Open' },
        { action: 'dismiss', title: 'Dismiss' }
      ]
    });

    await webpush.sendNotification(user.pushSubscription, payload);
  } catch (error) {
    console.error('Send notification error:', error);
    
    // If subscription expired, remove it
    if (error.statusCode === 410) {
      await User.findByIdAndUpdate(userId, {
        $unset: { pushSubscription: 1 }
      });
    }
  }
};

// Send bulk notifications
export const sendBulkNotifications = async (userIds, notification) => {
  const promises = userIds.map(id => sendPushNotification(id, notification));
  await Promise.allSettled(promises);
};
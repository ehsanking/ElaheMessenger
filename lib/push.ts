import webpush from 'web-push';
import { prisma } from './prisma';
import { logger } from './logger';

const publicVapidKey = process.env.VAPID_PUBLIC_KEY;
const privateVapidKey = process.env.VAPID_PRIVATE_KEY;
const vapidEmail = process.env.VAPID_EMAIL;

// Lazily initialise webpush only when keys are available.
// A missing VAPID config is treated as "push notifications disabled",
// not a fatal startup error.
let vapidConfigured = false;
if (publicVapidKey && privateVapidKey && vapidEmail) {
  try {
    webpush.setVapidDetails(vapidEmail, publicVapidKey, privateVapidKey);
    vapidConfigured = true;
  } catch (err) {
    logger.error('Failed to configure VAPID details. Push notifications disabled.', {
      error: err instanceof Error ? err.message : String(err),
    });
  }
} else {
  logger.warn(
    'VAPID keys not set (VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_EMAIL). ' +
    'Push notifications are disabled. Set these env vars to enable them.',
  );
}

export async function sendPushNotification(
  userId: string,
  payload: { title: string; body: string; url?: string },
) {
  if (!vapidConfigured) {
    logger.warn('Push notification skipped — VAPID not configured.', { userId });
    return;
  }

  try {
    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId },
    });

    if (subscriptions.length === 0) return;

    const notifications = subscriptions.map(async (sub: { endpoint: string; p256dh: string; auth: string; id: string }) => {
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth,
        },
      };

      try {
        await webpush.sendNotification(pushSubscription, JSON.stringify(payload));
      } catch (error: unknown) {
        if (
          typeof error === 'object' &&
          error &&
          'statusCode' in error &&
          (error.statusCode === 404 || error.statusCode === 410)
        ) {
          // Subscription has expired or is no longer valid
          await prisma.pushSubscription.delete({ where: { id: sub.id } });
        } else {
          logger.error('Error sending push notification.', {
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }
    });

    await Promise.all(notifications);
  } catch (error) {
    logger.error('Failed to send push notification.', {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}


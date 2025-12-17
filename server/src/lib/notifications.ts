import { Expo, ExpoPushMessage } from 'expo-server-sdk';
import { logger } from './logger';

// Create a new Expo SDK client
// optionally providing an access token if you have enabled push security
const expo = new Expo();

export const sendPushNotification = async (
  pushTokens: string[],
  title: string,
  body: string,
  data?: Record<string, any>,
) => {
  const messages: ExpoPushMessage[] = [];

  for (const pushToken of pushTokens) {
    // Check that all your push tokens appear to be valid Expo push tokens
    if (!Expo.isExpoPushToken(pushToken)) {
      logger.warn(`Push token ${pushToken} is not a valid Expo push token`);
      continue;
    }

    // Construct a message (see https://docs.expo.io/push-notifications/sending-notifications/)
    messages.push({
      to: pushToken,
      sound: 'default',
      title,
      body,
      data,
    });
  }

  // The Expo push notification service accepts batches of notifications so
  // that you don't need to send 1000 requests to send 1000 notifications.
  // We recommend you batch your notifications to reduce the number of requests
  // and to compress them (notifications with similar content will get compressed).
  const chunks = expo.chunkPushNotifications(messages);
  const tickets = [];

  for (const chunk of chunks) {
    try {
      const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
      logger.info(ticketChunk, 'Push notification ticket chunk');
      tickets.push(...ticketChunk);
    } catch (error) {
      logger.error(error, 'Error sending push notifications');
    }
  }

  // NOTE: If we want to handle failures (like invalid tokens), we should inspect the tickets
  // and remove invalid tokens from DB. For now, logging is enough.
  return tickets;
};

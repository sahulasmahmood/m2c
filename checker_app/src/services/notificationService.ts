import {
  getMessaging,
  getToken,
  onMessage,
  onTokenRefresh,
  setBackgroundMessageHandler,
  getInitialNotification,
  onNotificationOpenedApp,
  requestPermission,
  AuthorizationStatus,
} from '@react-native-firebase/messaging';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from '../lib/axios';

const TOKEN_STORAGE_KEY = 'fcm_device_token';

/**
 * Request notification permission (iOS requires explicit ask; Android 13+ too)
 */
export async function requestNotificationPermission(): Promise<boolean> {
  const messaging = getMessaging();
  const authStatus = await requestPermission(messaging);
  const enabled =
    authStatus === AuthorizationStatus.AUTHORIZED ||
    authStatus === AuthorizationStatus.PROVISIONAL;
  return enabled;
}

/**
 * Get the FCM device token and register it with the backend.
 * Call this after login.
 */
export async function registerForPushNotifications(): Promise<string | null> {
  try {
    const permitted = await requestNotificationPermission();
    if (!permitted) {
      console.log('Push notification permission denied');
      return null;
    }

    const messaging = getMessaging();
    const token = await getToken(messaging);
    if (!token) return null;

    // Only re-register if token changed
    const storedToken = await AsyncStorage.getItem(TOKEN_STORAGE_KEY);
    if (storedToken !== token) {
      await axios.post('/notifications/register-token', {
        token,
        platform: Platform.OS,
      });
      await AsyncStorage.setItem(TOKEN_STORAGE_KEY, token);
      console.log('FCM token registered:', token.slice(0, 20) + '...');
    }

    return token;
  } catch (error) {
    console.error('Failed to register push notifications:', error);
    return null;
  }
}

/**
 * Remove the FCM token from backend (call on logout)
 */
export async function unregisterPushNotifications(): Promise<void> {
  try {
    const token = await AsyncStorage.getItem(TOKEN_STORAGE_KEY);
    if (token) {
      await axios.delete('/notifications/remove-token', { data: { token } });
      await AsyncStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  } catch (error) {
    console.error('Failed to unregister push notifications:', error);
  }
}

/**
 * Listen for incoming messages while app is in foreground.
 * Returns an unsubscribe function.
 */
export function setupForegroundMessageListener(
  callback: (title: string, body: string, data: Record<string, string>) => void
): () => void {
  const messaging = getMessaging();
  return onMessage(messaging, async (remoteMessage) => {
    const title = remoteMessage.notification?.title || 'Notification';
    const body = remoteMessage.notification?.body || '';
    const data = (remoteMessage.data as Record<string, string>) || {};
    callback(title, body, data);
  });
}

/**
 * Set up background message handler. Must be called at the top-level
 * (outside any component).
 */
export function setupBackgroundHandler(): void {
  const messaging = getMessaging();
  setBackgroundMessageHandler(messaging, async (remoteMessage) => {
    console.log('Background message:', remoteMessage.notification?.title);
  });
}

/**
 * Listen for token refresh (FCM may rotate tokens).
 * Returns an unsubscribe function.
 */
export function setupTokenRefreshListener(): () => void {
  const messaging = getMessaging();
  return onTokenRefresh(messaging, async (newToken) => {
    try {
      await axios.post('/notifications/register-token', {
        token: newToken,
        platform: Platform.OS,
      });
      await AsyncStorage.setItem(TOKEN_STORAGE_KEY, newToken);
      console.log('FCM token refreshed:', newToken.slice(0, 20) + '...');
    } catch (error) {
      console.error('Failed to update refreshed token:', error);
    }
  });
}

/**
 * Check if app was opened from a notification tap (cold start).
 */
export async function checkInitialNotification(): Promise<Record<string, string> | null> {
  const messaging = getMessaging();
  const remoteMessage = await getInitialNotification(messaging);
  if (remoteMessage?.data) {
    return remoteMessage.data as Record<string, string>;
  }
  return null;
}

/**
 * Listen for notification taps while app is in background (not killed).
 * Returns an unsubscribe function.
 */
export function setupNotificationOpenedListener(
  callback: (data: Record<string, string>) => void
): () => void {
  const messaging = getMessaging();
  return onNotificationOpenedApp(messaging, (remoteMessage) => {
    if (remoteMessage.data) {
      callback(remoteMessage.data as Record<string, string>);
    }
  });
}

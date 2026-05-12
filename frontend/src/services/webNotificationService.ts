import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';
import { app, VAPID_KEY } from '@/lib/firebase';
import axios from '@/lib/axios';

const TOKEN_KEY = 'fcm_web_token';

/**
 * Request permission + get token + register with backend.
 * Per docs/NOTIFICATIONS.md Step 5.
 */
export async function registerWebPushToken(): Promise<string | null> {
  try {
    if (typeof window === 'undefined') return null;
    if (!('Notification' in window)) return null;

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return null;

    const supported = await isSupported();
    if (!supported) return null;

    const messaging = getMessaging(app);
    const token = await getToken(messaging, { vapidKey: VAPID_KEY });
    if (!token) return null;

    // Always register with backend (token upserts by unique constraint)
    await axios.post('/notifications/register-token', { token, platform: 'web' });
    localStorage.setItem(TOKEN_KEY, token);

    return token;
  } catch {
    return null;
  }
}

/**
 * Remove token from backend. Call on logout.
 */
export async function unregisterWebPushToken(): Promise<void> {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      await axios.delete('/notifications/remove-token', { data: { token } });
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch {
    // silent
  }
}

/**
 * Listen for foreground messages. Returns unsubscribe function.
 * Per docs/NOTIFICATIONS.md Step 5.
 */
export function onForegroundMessage(
  callback: (title: string, body: string, data: Record<string, string>) => void,
): (() => void) | null {
  try {
    if (typeof window === 'undefined') return null;

    const messaging = getMessaging(app);
    return onMessage(messaging, (payload) => {
      const data = (payload.data as Record<string, string>) || {};
      const title = payload.notification?.title || data.title || 'Notification';
      const body = payload.notification?.body || data.body || '';
      callback(title, body, data);
    });
  } catch {
    return null;
  }
}

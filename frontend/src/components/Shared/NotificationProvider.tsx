'use client';

import { useEffect } from 'react';
import { showSuccessToast } from '@/lib/toast-utils';

/**
 * Registers FCM token on login + listens for foreground push messages.
 * Wrap your dashboard layout with this provider.
 * Per docs/NOTIFICATIONS.md Step 7.
 */
export function NotificationProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const hasAuth =
      localStorage.getItem('adminToken') ||
      localStorage.getItem('vendorToken') ||
      localStorage.getItem('userToken') ||
      localStorage.getItem('checkerToken') ||
      sessionStorage.getItem('adminToken') ||
      sessionStorage.getItem('vendorToken') ||
      sessionStorage.getItem('userToken') ||
      sessionStorage.getItem('checkerToken');

    if (!hasAuth) return;

    let unsubForeground: (() => void) | null = null;

    const setup = async () => {
      try {
        const { registerWebPushToken, onForegroundMessage } = await import('@/services/webNotificationService');
        await registerWebPushToken();

        unsubForeground = onForegroundMessage((title, body) => {
          showSuccessToast(title, body);
        });
      } catch {
        // FCM unavailable — polling fallback active
      }
    };

    setup();

    return () => { if (unsubForeground) unsubForeground(); };
  }, []);

  return <>{children}</>;
}

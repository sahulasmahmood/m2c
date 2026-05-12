importScripts('https://www.gstatic.com/firebasejs/12.13.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/12.13.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyCuGD3w2_dtEqmlp1ldPc5rI9nzjkWQQGY',
  authDomain: 'm2c-markdowns-2a6ed.firebaseapp.com',
  projectId: 'm2c-markdowns-2a6ed',
  storageBucket: 'm2c-markdowns-2a6ed.firebasestorage.app',
  messagingSenderId: '241389466458',
  appId: '1:241389466458:web:515c3fab69a777e86eb963',
});

var messaging = firebase.messaging();

// Handle data-only messages in background
// Foreground messages are handled by onMessage in the app
messaging.onBackgroundMessage(function(payload) {
  var data = payload.data || {};
  var title = data.title || 'M2C Notification';
  var options = {
    body: data.body || '',
    icon: '/assets/logo/m2c-logo.png',
    data: data,
    tag: data.type || 'default',
  };
  return self.registration.showNotification(title, options);
});

// Handle notification click
self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  var data = event.notification.data || {};

  var urlMap = {
    ORDER_RECEIVED: '/vendor/dashboard/orders',
    ORDER_CONFIRMED: '/profile/orders',
    PRODUCT_APPROVED: '/vendor/dashboard/products',
    PRODUCT_REJECTED: '/vendor/dashboard/products',
    PAYMENT_RECEIVED: '/vendor/dashboard/earnings/payouts',
    NEW_ORDER: '/admin/dashboard/orders',
    NEW_VENDOR_REGISTRATION: '/admin/dashboard/vendors',
    PRODUCT_PENDING_APPROVAL: '/admin/dashboard/products/vendor-requests',
    LOW_STOCK_ALERT: '/admin/dashboard/inventory',
    ORDER_SHIPPED_TO_CUSTOMER: '/profile/orders',
    ORDER_DELIVERED: '/profile/orders',
  };

  var url = urlMap[data.type] || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(windowClients) {
      for (var i = 0; i < windowClients.length; i++) {
        if (windowClients[i].url.indexOf(url) > -1 && 'focus' in windowClients[i]) {
          return windowClients[i].focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});

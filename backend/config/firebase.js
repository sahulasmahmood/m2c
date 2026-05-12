const admin = require('firebase-admin');

if (!process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
  console.warn('⚠️  FIREBASE_SERVICE_ACCOUNT_JSON not set — push notifications disabled');
  module.exports = null;
} else {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.project_id,
      });
    }
    console.log('✅ Firebase Admin initialized — project:', serviceAccount.project_id);
    module.exports = admin;
  } catch (error) {
    console.error('❌ Firebase init failed:', error.message);
    module.exports = null;
  }
}

const { google } = require('googleapis');
const path = require('path');
const serviceAccount = require(path.join(
  __dirname,
  '../config/google-service-account.json'
));

const packageName = 'com.example.yourapp'; // غيّر هذا إلى اسم تطبيقك

const auth = new google.auth.GoogleAuth({
  credentials: serviceAccount,
  scopes: ['https://www.googleapis.com/auth/androidpublisher'],
});

exports.verifyGooglePurchase = async (productId, purchaseToken) => {
  const client = await auth.getClient();
  const androidPublisher = google.androidpublisher({
    version: 'v3',
    auth: client,
  });

  const result = await androidPublisher.purchases.products.get({
    packageName,
    productId,
    token: purchaseToken,
  });

  // ✅ التحقق من حالة الشراء
  return result.data.purchaseState === 0; // 0 = purchased
};

const axios = require('axios');
const AppError = require('../utils/AppError');

/**
 * تحقق من صحة عملية الشراء من Apple App Store.
 * @param {string} productId - معرف المنتج الذي تم شراؤه.
 * @param {string} receiptData - بيانات الإيصال المرسلة من التطبيق.
 * @returns {Promise<boolean>} - true إذا كانت عملية الشراء صالحة.
 */
const verifyApplePurchase = async (productId, receiptData) => {
  try {
    const response = await axios.post(
      'https://buy.itunes.apple.com/verifyReceipt',
      {
        'receipt-data': receiptData,
        password: process.env.APPLE_SHARED_SECRET, // يجب وضع هذا المتغير في env
        'exclude-old-transactions': true,
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const data = response.data;

    // تحقق من نجاح العملية
    if (data.status !== 0) return false;

    const latestReceiptInfo = data.latest_receipt_info || [];
    const hasProduct = latestReceiptInfo.some(
      (item) => item.product_id === productId
    );

    return hasProduct;
  } catch (error) {
    console.error('خطأ في التحقق من شراء Apple:', error);
    throw new AppError('خطأ في التحقق من شراء Apple', 500);
  }
};

module.exports = { verifyApplePurchase };

const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const Course = require('../models/courseModel');
const User = require('../models/userModel');
const { buyCourse } = require('./courseController');
const { buySilverAdvice } = require('./adviceController');
const { verifyGooglePurchase } = require('../utils/verifyGooglePurchase');
const { verifyApplePurchase } = require('../utils/verifyApplePurchase'); 

exports.verifyPurchase = catchAsync(async (req, res, next) => {
  const { platform, productId, purchaseToken } = req.body;
  const userId = req.user.id;

  if (!platform || !productId || !purchaseToken) {
    return next(new AppError('Missing required fields', 400));
  }

  if (platform === 'android') {
    const isPurchased = await verifyGooglePurchase(productId, purchaseToken);
    if (!isPurchased) {
      return next(new AppError('عملية الشراء غير صالحة أو لم تكتمل', 400));
    }
  }

  if (platform === 'ios') {
    const isPurchased = await verifyApplePurchase(productId, purchaseToken);
    if (!isPurchased) {
      return next(
        new AppError('عملية الشراء غير صالحة أو لم تكتمل (Apple)', 400)
      );
    }
  }

  const course = await Course.findOne({
    $or: [{ googleProductId: productId }, { appleProductId: productId }],
  });

  if (course) {
    req.params.courseId = course.id;
    return buyCourse(req, res, next);
  }

  if (productId === 'silver_package_id') {
    return buySilverAdvice(req, res, next);
  }

  return next(new AppError('Unknown productId', 400));
});

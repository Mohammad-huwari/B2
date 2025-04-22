const catchAsync = require('./../utils/catchAsync');
const AppError = require('../utils/AppError');
const sendEmail = require('../utils/email');
const User = require('../models/userModel');
// const mongoose = require('mongoose');

exports.buySilverAdvice = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  user.hasSilverAdvice = true;
  user.save({ validateBeforeSave: false });

  // console.log('email is sent to', req.user.email);

  await sendEmail({
    email: user.email,
    name: user.name,
    subject: 'congratulatins for your investment',
    template: 'silverAdvice',
    data: { name: user.name },
  });

  // console.log('email should be sent');

  res.status(200).json({
    status: 'success',
    message: 'silverAdv purchase success',
    data: { hasSilverAdvice: user.hasSilverAdvice },
  });
});

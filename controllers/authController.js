const User = require('../models/userModel');
const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const sendEmail = require('../utils/email');
const puq = require('pug');
const { replaceOne } = require('../models/courseModel');
const verifyEmail = require('../utils/emailValidator');
const mongoose = require('mongoose');

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  const cookieOptions = {
    expirse: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),

    httpOnly: true,
  };
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;
  res.cookie('jwt', token, cookieOptions);

  user.password = undefined;

  res.status(statusCode).json({
    status: 'sucess',
    token,
    data: {
      user,
    },
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const isValidEmail = await verifyEmail(req.body.email);

  if (!isValidEmail) {
    return next(new AppError('invalid email , try again  ', 400));
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const newUser = await User.create(
      [
        {
          name: req.body.name,
          email: req.body.email,
          password: req.body.password,
          passwordConfirm: req.body.passwordConfirm,
          emailVerified: false,
        },
      ],
      { session }
    );

    // create a token to verify the email
    const emailVerificationToken = newUser[0].createEmailVerificationToken();
    await newUser[0].save({ validateBeforeSave: false });

    // create a verify url
    const verificationURL = `${req.protocol}://${req.get(
      'host'
    )}/api/v1/auth/verifyEmail/${emailVerificationToken}`;

    // send a verification email
    await sendEmail({
      email: newUser[0].email,
      name: newUser[0].name,
      subject: 'verify your email',
      template: 'verifyEmail',
      data: { name: newUser[0].name, verificationURL },
    });

    await session.commitTransaction();
    session.endSession();

    createSendToken(newUser, 201, res);
    console.log('user', req.newUser[0]);
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    return next(err);
  }
});

exports.verifyEmail = catchAsync(async (req, res, next) => {
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    emailVerificationToken: hashedToken,
    //  emailVerificationExpires: { $gt: Date.now() },
  });

  if (!user) {
    return next(new AppError('Token is invalid or expired', 400));
  }

  // update the account status to verified
  user.emailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpires = undefined;
  await user.save({ validateBeforeSave: false });

  // Here send the welcome message
  await sendEmail({
    email: user.email,
    name: user.name,
    subject: 'Welcome to B2crypto',
    template: 'welcomeMessage',
    data: { name: user.name },
  });

  res.status(200).render('confirmation');
});

exports.login = catchAsync(async (req, res, next) => {
  // console.log(token);
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError('please enter your email and password', 400));
  }

  const user = await User.findOne({ email }).select('+password +emailVerified');
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('invalid email or password !', 401));
  }

  if (!user.emailVerified) {
    return next(new AppError('your email is not verified yet ! ', 401));
  }

  createSendToken(user, 200, res);
});

exports.logout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({
    status: 'success',
    message: 'you are log out',
  });
};

exports.protect = catchAsync(async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(new AppError('you are not logged in ! please log in', 401));
  }
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(new AppError('the user is no longer exists', 401));
  }

  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError('user recently changed password ! please log in again.', 401)
    );
  }
  console.log(req.cookies.jwt);
  req.user = currentUser;

  // console.log('user Authenticated : ', req.user);
  next();
});

exports.forgotPassword = catchAsync(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new AppError('There is no user with this email address ', 404));
  }

  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  const resetURL = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/auth/resetPassword/${resetToken}`;

  //const message = `Hello ${user.name}, \n\nForgot your password? Click the link below to reset it :\n\n${resetURL}\n\nIf you didnt request this , please ignore this message\n\nThanks, \nB2crypto Team`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Password Reset Request',
      template: 'resetPassword',
      data: { name: user.name, resetURL },
    });

    res.status(200).json({
      status: 'success',
      message: 'Password reset link sent to your email!',
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError('There was an error sending the email. Try again later!'),
      500
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });
  if (!user) {
    return next(new AppError('Token is invalid or expired', 400));
  }

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  createSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id).select('+password');

  console.log('user password : ', user.passwword);
  console.log('current password :', req.body.currentPassword);

  if (!(await user.correctPassword(req.body.currentPassword, user.password))) {
    return next(new AppError('current password is incorrect !', 401));
  }

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();

  createSendToken(user, 200, res);
});

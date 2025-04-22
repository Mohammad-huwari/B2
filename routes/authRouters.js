const express = require('express');
const authController = require('../controllers/authController');
const rateLimit = require('express-rate-limit');

const router = express.Router();

const loginLimiter = rateLimit({
  max: 5,
  windowMs: 15 * 60 * 1000,
  message: 'Too many long attempts , try again later  ',
});

router.route('/signup').post(authController.signup);

router.route('/verifyEmail/:token').get(authController.verifyEmail);

router.route('/login').post(loginLimiter, authController.login);

router.route('/logout').post(authController.logout);

router.route('/forgotpassword').post(authController.forgotPassword);

router.route('/resetpassword/:token').patch(authController.resetPassword);

router
  .route('/updatePassword')
  .patch(authController.protect, authController.updatePassword);
module.exports = router;

const express = require('express');
const User = require('../models/userModel');
const adviceController = require('../controllers/adviceController');
const authController = require('../controllers/authController');

const router = express.Router();

router
  .route('/buySilveradv')
  .patch(authController.protect, adviceController.buySilverAdvice);

// router
//   .route('/buyGoldenadv')
//   .patch(authController.protect, adviceController.buyGoldenAdvice);

module.exports = router;

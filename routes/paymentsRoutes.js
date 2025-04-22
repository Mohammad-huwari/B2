const express = require('express');
const { verifyPurchase } = require('../controllers/paymentsController');
const { protect } = require('../controllers/authController');

const router = express.Router();

// 🔐 تأكد أن المستخدم مسجل دخول
router.post('/verify-purchase', protect, verifyPurchase);

module.exports = router;

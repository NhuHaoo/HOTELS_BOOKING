const express = require('express');
const router = express.Router();
const {
  createVNPayPayment,
  createReschedulePayment,
  vnpayReturn,
  checkPaymentStatus
} = require('../controllers/payment.controller');
const { protect } = require('../middlewares/auth.middleware');

// VNPay routes
router.post('/vnpay/create', protect, createVNPayPayment);
router.post('/vnpay/reschedule/:bookingId', protect, createReschedulePayment);
router.get('/vnpay/return', vnpayReturn); // VNPay callback (public)
router.get('/status/:bookingId', protect, checkPaymentStatus);

module.exports = router;


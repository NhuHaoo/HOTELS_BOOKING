const express = require('express');
const router = express.Router();
const {
  createBooking,
  getMyBookings,
  getBooking,
  cancelBooking,
  updatePaymentStatus,
  getBookingByCode
} = require('../controllers/booking.controller');
const { protect } = require('../middlewares/auth.middleware');

// Public routes
router.get('/code/:code', getBookingByCode);

// Protected routes
router.post('/', protect, createBooking);
router.get('/', protect, getMyBookings);
router.get('/:id', protect, getBooking);
router.put('/:id/cancel', protect, cancelBooking);
router.put('/:id/payment', protect, updatePaymentStatus);

module.exports = router;


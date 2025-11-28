const express = require('express');
const router = express.Router();

const {
  createBooking,
  getMyBookings,
  getBooking,
  cancelBooking,
  updatePaymentStatus,
  getBookingByCode,
  rescheduleBooking        
} = require('../controllers/booking.controller');

const { protect } = require('../middlewares/auth.middleware');

// Public routes
router.get('/code/:code', getBookingByCode);

// Protected routes
router.post('/', protect, createBooking);
router.get('/', protect, getMyBookings);
router.get('/:id', protect, getBooking);

// --- Booking actions ---
router.put('/:id/cancel', protect, cancelBooking);
router.put('/:id/reschedule', protect, rescheduleBooking);  
router.put('/:id/payment', protect, updatePaymentStatus);

module.exports = router;

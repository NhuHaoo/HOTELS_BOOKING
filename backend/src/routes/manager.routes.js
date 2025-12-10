const express = require('express');
const router = express.Router();

const {
  getDashboard,
  getRevenue,
  getAnalytics,
  getBookings,
  updateBookingStatus,
  cancelBooking,
  getReviews,
  deleteReview,
  getHotel,
  updateHotel
} = require('../controllers/manager.controller');
const {
  getManagerSettlements,
  getPendingSettlement
} = require('../controllers/settlement.controller');

const { protect } = require('../middlewares/auth.middleware');
const { isManager } = require('../middlewares/role.middleware');

// ===============================
// ALL MANAGER ROUTES ARE PROTECTED
// ===============================
router.use(protect);
router.use(isManager);

// ===============================
// DASHBOARD + ANALYTICS
// ===============================
router.get('/dashboard', getDashboard);
router.get('/revenue', getRevenue);
router.get('/analytics', getAnalytics);

// ===============================
// BOOKING MANAGEMENT
// ===============================
router.get('/bookings', getBookings);
router.put('/bookings/:id/status', updateBookingStatus);
router.put('/bookings/:id/cancel', cancelBooking);

// ===============================
// REVIEW MANAGEMENT
// ===============================
router.get('/reviews', getReviews);
router.delete('/reviews/:id', deleteReview);

// ===============================
// HOTEL MANAGEMENT
// ===============================
router.get('/hotel', getHotel);
router.put('/hotel', updateHotel);

// ===============================
// SETTLEMENTS
// ===============================
router.get('/settlements', getManagerSettlements);
router.get('/settlements/pending', getPendingSettlement);

module.exports = router;

const express = require('express');
const router = express.Router();
const {
  getDashboard,
  getRevenue,
  getAnalytics,
  getUsers,
  deleteUser,
  updateUserRole,
  getBookings,
  updateBookingStatus,
  cancelBooking,
  getReviews,
  deleteReview
} = require('../controllers/admin.controller');
const { protect } = require('../middlewares/auth.middleware');
const { isAdmin } = require('../middlewares/role.middleware');

// All routes are protected and admin only
router.use(protect);
router.use(isAdmin);

// Dashboard & Analytics
router.get('/dashboard', getDashboard);
router.get('/revenue', getRevenue);
router.get('/analytics', getAnalytics);

// Users
router.get('/users', getUsers);
router.put('/users/:id/role', updateUserRole);
router.delete('/users/:id', deleteUser);

// Bookings
router.get('/bookings', getBookings);
router.put('/bookings/:id/status', updateBookingStatus);
router.put('/bookings/:id/cancel', cancelBooking);

// Reviews
router.get('/reviews', getReviews);
router.delete('/reviews/:id', deleteReview);

module.exports = router;


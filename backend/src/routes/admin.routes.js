const express = require('express');
const router = express.Router();
const {
  getDashboard,
  getRevenue,
  getProfit,
  getAnalytics,
  getUsers,
  deleteUser,
  updateUserRole,
  getBookings,
  updateBookingStatus,
  cancelBooking,
  getReviews,
  deleteReview,
  createUser,
  getHotels   
} = require('../controllers/admin.controller');
const {
  getSettlements,
  getSettlement,
  createSettlement,
  paySettlement
} = require('../controllers/settlement.controller');
const { protect } = require('../middlewares/auth.middleware');
const { isAdmin } = require('../middlewares/role.middleware');

// All routes are protected and admin only
router.use(protect);
router.use(isAdmin);

// Dashboard & Analytics
router.get('/dashboard', getDashboard);
router.get('/revenue', getRevenue);
router.get('/profit', getProfit);
router.get('/analytics', getAnalytics);

// Hotels
router.get('/hotels', getHotels);   

// Users
router.get('/users', getUsers);
router.post('/users', createUser);
router.put('/users/:id/role', updateUserRole);
router.delete('/users/:id', deleteUser);

// Bookings
router.get('/bookings', getBookings);
router.put('/bookings/:id/status', updateBookingStatus);
router.put('/bookings/:id/cancel', cancelBooking);

// Reviews
router.get('/reviews', getReviews);
router.delete('/reviews/:id', deleteReview);

// Settlements
router.get('/settlements', getSettlements);
router.get('/settlements/:id', getSettlement);
router.post('/settlements/create', createSettlement);
router.put('/settlements/:id/pay', paySettlement);

module.exports = router;

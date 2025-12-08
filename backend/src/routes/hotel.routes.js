const express = require('express');
const router = express.Router();
const {
  getHotels,
  getHotel,
  createHotel,
  updateHotel,
  deleteHotel,
  getNearbyHotels,
  updateHotelStatus,
  toggleHotelActive
} = require('../controllers/hotel.controller');
const { protect, optionalAuth } = require('../middlewares/auth.middleware');
const { isAdmin } = require('../middlewares/role.middleware');

// Public routes (with optional auth to get user info if logged in)
router.get('/', optionalAuth, getHotels);
router.get('/nearby', getNearbyHotels);
router.get('/:id', getHotel);

// Protected admin routes
router.post('/', protect, isAdmin, createHotel);
router.put('/:id', protect, isAdmin, updateHotel);
router.delete('/:id', protect, isAdmin, deleteHotel);
router.put('/:id/status', protect, isAdmin, updateHotelStatus);

// Protected routes (Admin and Manager)
router.put('/:id/toggle-active', protect, toggleHotelActive);

module.exports = router;


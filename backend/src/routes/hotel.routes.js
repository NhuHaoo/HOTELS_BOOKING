const express = require('express');
const router = express.Router();
const {
  getHotels,
  getHotel,
  createHotel,
  updateHotel,
  deleteHotel,
  getNearbyHotels
} = require('../controllers/hotel.controller');
const { protect } = require('../middlewares/auth.middleware');
const { isAdmin } = require('../middlewares/role.middleware');

// Public routes
router.get('/', getHotels);
router.get('/nearby', getNearbyHotels);
router.get('/:id', getHotel);

// Protected admin routes
router.post('/', protect, isAdmin, createHotel);
router.put('/:id', protect, isAdmin, updateHotel);
router.delete('/:id', protect, isAdmin, deleteHotel);

module.exports = router;


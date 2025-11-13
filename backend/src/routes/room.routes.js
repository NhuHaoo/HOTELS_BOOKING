const express = require('express');
const router = express.Router();
const {
  getRooms,
  getRoom,
  getRoomsByHotel,
  createRoom,
  updateRoom,
  deleteRoom,
  searchRooms,
  getAvailableRooms
} = require('../controllers/room.controller');
const { protect } = require('../middlewares/auth.middleware');
const { isAdmin } = require('../middlewares/role.middleware');

// Public routes
router.get('/', getRooms);
router.get('/search', searchRooms);
router.get('/available', getAvailableRooms);
router.get('/hotel/:hotelId', getRoomsByHotel);
router.get('/:id', getRoom);

// Protected admin routes
router.post('/', protect, isAdmin, createRoom);
router.put('/:id', protect, isAdmin, updateRoom);
router.delete('/:id', protect, isAdmin, deleteRoom);

module.exports = router;


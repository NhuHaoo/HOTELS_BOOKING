const express = require('express');
const router = express.Router();

const {
  getMyRooms,
  createMyRoom,
  updateMyRoom,
  deleteMyRoom
} = require('../controllers/manager.rooms.controller');

const { protect } = require('../middlewares/auth.middleware');
const { isManager } = require('../middlewares/role.middleware');

router.use(protect);
router.use(isManager);

// CRUD: Phòng thuộc khách sạn của Manager
router.get('/', getMyRooms);
router.post('/', createMyRoom);
router.put('/:id', updateMyRoom);
router.delete('/:id', deleteMyRoom);

module.exports = router;

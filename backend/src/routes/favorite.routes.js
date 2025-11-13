const express = require('express');
const router = express.Router();
const {
  addFavorite,
  getFavorites,
  removeFavorite,
  removeFavoriteByRoom,
  checkFavorite
} = require('../controllers/favorite.controller');
const { protect } = require('../middlewares/auth.middleware');

// All routes are protected
router.post('/', protect, addFavorite);
router.get('/', protect, getFavorites);
router.delete('/:id', protect, removeFavorite);
router.delete('/room/:roomId', protect, removeFavoriteByRoom);
router.get('/check/:roomId', protect, checkFavorite);

module.exports = router;


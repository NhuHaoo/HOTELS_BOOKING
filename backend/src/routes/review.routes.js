const express = require('express');
const router = express.Router();
const {
  createReview,
  getRoomReviews,
  getMyReviews,
  updateReview,
  deleteReview,
  markHelpful
} = require('../controllers/review.controller');
const { protect } = require('../middlewares/auth.middleware');

// Protected routes - specific paths first to avoid conflicts
router.get('/my/reviews', protect, getMyReviews);
router.post('/', protect, createReview);
router.put('/:id', protect, updateReview);
router.delete('/:id', protect, deleteReview);
router.put('/:id/helpful', protect, markHelpful);

// Public routes - generic paths last
router.get('/room/:roomId', getRoomReviews);

module.exports = router;


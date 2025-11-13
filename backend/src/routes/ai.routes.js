const express = require('express');
const router = express.Router();
const {
  getRecommendations,
  getPopularRooms,
  chatbot,
  getTrendingDestinations,
  getPersonalizedRecommendations
} = require('../controllers/ai.controller');
const { protect, optionalAuth } = require('../middlewares/auth.middleware');

// Protected routes (require login for personalized recommendations)
router.get('/recommendations', protect, getRecommendations);
router.get('/personalized-recommendations', protect, getPersonalizedRecommendations);

// Public routes
router.get('/popular', getPopularRooms);
router.post('/chat', chatbot);
router.get('/trending', getTrendingDestinations);

module.exports = router;


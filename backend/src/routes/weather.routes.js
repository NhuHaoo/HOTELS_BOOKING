const express = require('express');
const router = express.Router();
const weatherController = require('../controllers/weather.controller');

// Public routes
router.get('/cities/all', weatherController.getAllCitiesWeather);
router.get('/coordinates', weatherController.getWeatherByCoordinates);
router.get('/:city', weatherController.getCityWeather);
router.get('/:city/forecast', weatherController.getCityForecast);
router.post('/multiple', weatherController.getMultipleCitiesWeather);

module.exports = router;


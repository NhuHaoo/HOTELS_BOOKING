const { getWeather, getWeatherByCoordinates, getMultipleCityWeather, getForecast } = require('../utils/weather.utils');

// @desc    Get weather for a city
// @route   GET /api/weather/:city
// @access  Public
exports.getCityWeather = async (req, res) => {
  try {
    const { city } = req.params;

    if (!city) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp tên thành phố'
      });
    }

    const weather = await getWeather(city);

    if (!weather.success) {
      return res.status(404).json({
        success: false,
        message: weather.message
      });
    }

    res.status(200).json({
      success: true,
      data: weather
    });
  } catch (error) {
    console.error('Get city weather error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get weather for multiple cities
// @route   POST /api/weather/multiple
// @access  Public
exports.getMultipleCitiesWeather = async (req, res) => {
  try {
    const { cities } = req.body;

    if (!cities || !Array.isArray(cities) || cities.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp danh sách thành phố'
      });
    }

    const weatherData = await getMultipleCityWeather(cities);

    res.status(200).json({
      success: true,
      count: weatherData.length,
      data: weatherData
    });
  } catch (error) {
    console.error('Get multiple cities weather error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get weather forecast for a city
// @route   GET /api/weather/:city/forecast
// @access  Public
exports.getCityForecast = async (req, res) => {
  try {
    const { city } = req.params;

    if (!city) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp tên thành phố'
      });
    }

    const forecast = await getForecast(city);

    if (!forecast.success) {
      return res.status(404).json({
        success: false,
        message: forecast.message
      });
    }

    res.status(200).json({
      success: true,
      data: forecast
    });
  } catch (error) {
    console.error('Get city forecast error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get weather for all major cities
// @route   GET /api/weather/cities/all
// @access  Public
exports.getAllCitiesWeather = async (req, res) => {
  try {
    const majorCities = ['Hà Nội', 'Đà Nẵng', 'Hồ Chí Minh', 'Nha Trang', 'Phú Quốc'];
    
    const weatherData = await getMultipleCityWeather(majorCities);

    res.status(200).json({
      success: true,
      count: weatherData.length,
      data: weatherData
    });
  } catch (error) {
    console.error('Get all cities weather error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get weather by coordinates
// @route   GET /api/weather/coordinates?lat=:lat&lon=:lon&city=:city
// @access  Public
exports.getWeatherByCoordinates = async (req, res) => {
  try {
    const { lat, lon, city } = req.query;

    if (!lat || !lon) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp tọa độ (lat, lon)'
      });
    }

    const weather = await getWeatherByCoordinates(
      parseFloat(lat),
      parseFloat(lon),
      city
    );

    if (!weather.success) {
      return res.status(404).json({
        success: false,
        message: weather.message
      });
    }

    res.status(200).json({
      success: true,
      data: weather
    });
  } catch (error) {
    console.error('Get weather by coordinates error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};


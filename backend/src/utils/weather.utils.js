const axios = require('axios');
const config = require('../config/env');

// City name mapping (Vietnamese to English for API)
const cityMapping = {
  'Hà Nội': 'Hanoi',
  'Đà Nẵng': 'Da Nang',
  'Hồ Chí Minh': 'Ho Chi Minh City',
  'Nha Trang': 'Nha Trang',
  'Phú Quốc': 'Phu Quoc',
  'Hội An': 'Hoi An',
  'Huế': 'Hue',
  'Vũng Tàu': 'Vung Tau',
  'Đà Lạt': 'Da Lat',
  'Cần Thơ': 'Can Tho'
};

/**
 * Get weather information for a city
 * @param {string} cityName - City name (Vietnamese or English)
 * @returns {object} Weather data
 */
async function getWeather(cityName) {
  try {
    // Map Vietnamese city name to English
    const englishCity = cityMapping[cityName] || cityName;
    
    // OpenWeatherMap API endpoint
    const url = `https://api.openweathermap.org/data/2.5/weather`;
    
    const response = await axios.get(url, {
      params: {
        q: `${englishCity},VN`, // VN = Vietnam
        appid: config.weatherApiKey,
        units: 'metric', // Celsius
        lang: 'vi' // Vietnamese language
      }
    });

    const data = response.data;

    return {
      success: true,
      city: cityName,
      temperature: Math.round(data.main.temp),
      feelsLike: Math.round(data.main.feels_like),
      humidity: data.main.humidity,
      description: data.weather[0].description,
      icon: data.weather[0].icon,
      iconUrl: `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`,
      windSpeed: data.wind.speed,
      pressure: data.main.pressure,
      tempMin: Math.round(data.main.temp_min),
      tempMax: Math.round(data.main.temp_max),
      timestamp: new Date()
    };
  } catch (error) {
    console.error(`Weather API error for ${cityName}:`, error.message);
    return {
      success: false,
      city: cityName,
      message: 'Không thể lấy thông tin thời tiết',
      error: error.message
    };
  }
}

/**
 * Get weather by coordinates (more accurate)
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @param {string} cityName - City name for display
 * @returns {object} Weather data
 */
async function getWeatherByCoordinates(lat, lon, cityName = '') {
  try {
    const url = `https://api.openweathermap.org/data/2.5/weather`;
    
    const response = await axios.get(url, {
      params: {
        lat: lat,
        lon: lon,
        appid: config.weatherApiKey,
        units: 'metric',
        lang: 'vi'
      }
    });

    const data = response.data;

    return {
      success: true,
      city: cityName || data.name,
      temperature: Math.round(data.main.temp),
      feelsLike: Math.round(data.main.feels_like),
      humidity: data.main.humidity,
      description: data.weather[0].description,
      icon: data.weather[0].icon,
      iconUrl: `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`,
      windSpeed: data.wind.speed,
      pressure: data.main.pressure,
      tempMin: Math.round(data.main.temp_min),
      tempMax: Math.round(data.main.temp_max),
      timestamp: new Date()
    };
  } catch (error) {
    console.error(`Weather API error for coordinates [${lat}, ${lon}]:`, error.message);
    return {
      success: false,
      message: 'Không thể lấy thông tin thời tiết',
      error: error.message
    };
  }
}

/**
 * Get weather for multiple cities
 * @param {array} cities - Array of city names
 * @returns {array} Array of weather data
 */
async function getMultipleCityWeather(cities) {
  try {
    const weatherPromises = cities.map(city => getWeather(city));
    const results = await Promise.all(weatherPromises);
    return results;
  } catch (error) {
    console.error('Multiple city weather error:', error);
    return [];
  }
}

/**
 * Get 5-day forecast for a city
 * @param {string} cityName - City name
 * @returns {object} Forecast data
 */
async function getForecast(cityName) {
  try {
    const englishCity = cityMapping[cityName] || cityName;
    
    const url = `https://api.openweathermap.org/data/2.5/forecast`;
    
    const response = await axios.get(url, {
      params: {
        q: `${englishCity},VN`,
        appid: config.weatherApiKey,
        units: 'metric',
        lang: 'vi'
      }
    });

    const data = response.data;

    // Get one forecast per day (at 12:00)
    const dailyForecasts = [];
    const processedDates = new Set();

    data.list.forEach(item => {
      const date = new Date(item.dt * 1000);
      const dateStr = date.toISOString().split('T')[0];
      
      // Take only one forecast per day (around noon)
      if (!processedDates.has(dateStr) && date.getHours() >= 11 && date.getHours() <= 13) {
        processedDates.add(dateStr);
        dailyForecasts.push({
          date: date,
          dateStr: date.toLocaleDateString('vi-VN', { weekday: 'short', day: 'numeric', month: 'numeric' }),
          temp: Math.round(item.main.temp),
          tempMin: Math.round(item.main.temp_min),
          tempMax: Math.round(item.main.temp_max),
          description: item.weather[0].description,
          icon: item.weather[0].icon,
          iconUrl: `https://openweathermap.org/img/wn/${item.weather[0].icon}@2x.png`,
          humidity: item.main.humidity,
          windSpeed: item.wind.speed
        });
      }
    });

    return {
      success: true,
      city: cityName,
      forecast: dailyForecasts.slice(0, 5) // Max 5 days
    };
  } catch (error) {
    console.error(`Forecast API error for ${cityName}:`, error.message);
    return {
      success: false,
      city: cityName,
      message: 'Không thể lấy dự báo thời tiết'
    };
  }
}

module.exports = {
  getWeather,
  getWeatherByCoordinates,
  getMultipleCityWeather,
  getForecast,
  cityMapping
};


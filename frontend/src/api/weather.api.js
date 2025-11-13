import axiosClient from './axiosClient';

export const weatherAPI = {
  // Get weather for a specific city
  getCityWeather: (city) => {
    return axiosClient.get(`/weather/${city}`);
  },

  // Get weather by coordinates (more accurate)
  getWeatherByCoordinates: (lat, lon, city) => {
    return axiosClient.get('/weather/coordinates', {
      params: { lat, lon, city }
    });
  },

  // Get weather for multiple cities
  getMultipleCitiesWeather: (cities) => {
    return axiosClient.post('/weather/multiple', { cities });
  },

  // Get 5-day forecast for a city
  getCityForecast: (city) => {
    return axiosClient.get(`/weather/${city}/forecast`);
  },

  // Get weather for all major cities
  getAllCitiesWeather: () => {
    return axiosClient.get('/weather/cities/all');
  },
};


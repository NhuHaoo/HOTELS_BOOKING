import axios from 'axios';

const WEATHER_API_KEY = import.meta.env.VITE_WEATHER_API_KEY;
const WEATHER_API_URL = 'https://api.weatherapi.com/v1';

/**
 * Get current weather for a city
 * @param {string} city
 * @returns {Promise<Object>}
 */
export const getCurrentWeather = async (city) => {
  try {
    if (!WEATHER_API_KEY) {
      console.warn('Weather API key not configured');
      return null;
    }

    const response = await axios.get(`${WEATHER_API_URL}/current.json`, {
      params: {
        key: WEATHER_API_KEY,
        q: city,
        lang: 'vi',
      },
    });

    return {
      temp: response.data.current.temp_c,
      condition: response.data.current.condition.text,
      icon: response.data.current.condition.icon,
      humidity: response.data.current.humidity,
      wind: response.data.current.wind_kph,
      location: response.data.location.name,
    };
  } catch (error) {
    console.error('Error fetching weather:', error);
    return null;
  }
};

/**
 * Get weather forecast
 * @param {string} city
 * @param {number} days
 * @returns {Promise<Object>}
 */
export const getWeatherForecast = async (city, days = 3) => {
  try {
    if (!WEATHER_API_KEY) {
      console.warn('Weather API key not configured');
      return null;
    }

    const response = await axios.get(`${WEATHER_API_URL}/forecast.json`, {
      params: {
        key: WEATHER_API_KEY,
        q: city,
        days,
        lang: 'vi',
      },
    });

    return {
      current: {
        temp: response.data.current.temp_c,
        condition: response.data.current.condition.text,
        icon: response.data.current.condition.icon,
      },
      forecast: response.data.forecast.forecastday.map((day) => ({
        date: day.date,
        maxTemp: day.day.maxtemp_c,
        minTemp: day.day.mintemp_c,
        condition: day.day.condition.text,
        icon: day.day.condition.icon,
      })),
    };
  } catch (error) {
    console.error('Error fetching weather forecast:', error);
    return null;
  }
};

/**
 * Get weather icon class
 * @param {string} condition
 * @returns {string}
 */
export const getWeatherIconClass = (condition) => {
  const conditionLower = condition?.toLowerCase() || '';
  
  if (conditionLower.includes('sun') || conditionLower.includes('clear')) {
    return 'text-yellow-500';
  }
  if (conditionLower.includes('cloud')) {
    return 'text-gray-500';
  }
  if (conditionLower.includes('rain')) {
    return 'text-blue-500';
  }
  if (conditionLower.includes('storm')) {
    return 'text-purple-600';
  }
  
  return 'text-gray-400';
};


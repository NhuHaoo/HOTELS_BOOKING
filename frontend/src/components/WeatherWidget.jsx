import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { weatherAPI } from '../api/weather.api';
import { FaCloudSun, FaTint, FaWind } from 'react-icons/fa';

const WeatherWidget = ({ city, coordinates }) => {
  // Use coordinates if available (more accurate), otherwise use city name
  const { data: weatherData, isLoading } = useQuery({
    queryKey: coordinates ? ['weather', 'coordinates', coordinates[1], coordinates[0]] : ['weather', city],
    queryFn: () => {
      if (coordinates && coordinates.length === 2) {
        // coordinates in MongoDB are [longitude, latitude]
        // OpenWeatherMap expects lat, lon
        return weatherAPI.getWeatherByCoordinates(coordinates[1], coordinates[0], city);
      }
      return weatherAPI.getCityWeather(city);
    },
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes
    enabled: !!(city || coordinates),
  });

  if (!city) return null;
  if (isLoading) {
    return (
      <div className="bg-gradient-to-r from-blue-400 to-blue-500 rounded-lg p-4 text-white animate-pulse">
        <div className="h-6 bg-white/30 rounded w-32 mb-2"></div>
        <div className="h-10 bg-white/30 rounded w-20"></div>
      </div>
    );
  }

  const weather = weatherData?.data;

  if (!weather || !weather.success) return null;

  return (
    <div className="bg-gradient-to-r from-blue-400 to-blue-500 rounded-lg p-4 text-white shadow-lg">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <FaCloudSun className="text-yellow-200" size={20} />
            <h3 className="font-semibold text-lg">{city}</h3>
          </div>
          <p className="text-sm opacity-90 capitalize mb-2">{weather.description}</p>
          
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold">{weather.temperature}°</span>
            <span className="text-sm opacity-80">Cảm giác {weather.feelsLike}°</span>
          </div>

          <div className="flex items-center gap-4 mt-3 text-sm">
            <div className="flex items-center gap-1">
              <FaTint className="opacity-70" />
              <span>{weather.humidity}%</span>
            </div>
            <div className="flex items-center gap-1">
              <FaWind className="opacity-70" />
              <span>{weather.windSpeed} m/s</span>
            </div>
          </div>
        </div>

        {weather.iconUrl && (
          <img 
            src={weather.iconUrl} 
            alt={weather.description}
            className="w-20 h-20 drop-shadow-lg"
          />
        )}
      </div>

      {weather.tempMin && weather.tempMax && (
        <div className="mt-2 pt-2 border-t border-white/20 text-xs opacity-80">
          H: {weather.tempMax}° • L: {weather.tempMin}°
        </div>
      )}
    </div>
  );
};

export default WeatherWidget;


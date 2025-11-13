import { useState, useEffect } from 'react';
import Map, { Marker, NavigationControl, FullscreenControl } from 'react-map-gl';
import { FaMapMarkerAlt } from 'react-icons/fa';
import 'mapbox-gl/dist/mapbox-gl.css';

const MapView = ({ 
  latitude, 
  longitude, 
  hotelName, 
  hotelAddress,
  zoom = 14,
  height = '400px'
}) => {
  const [viewState, setViewState] = useState({
    latitude: latitude || 16.0544,
    longitude: longitude || 108.2022,
    zoom: zoom,
  });

  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (latitude && longitude) {
      setViewState({
        latitude,
        longitude,
        zoom,
      });
    }
  }, [latitude, longitude, zoom]);

  // Mapbox access token
  const MAPBOX_TOKEN = 'pk.eyJ1Ijoibmd1eWVuYW5oMjQ5IiwiYSI6ImNseXJuZDhwNzA4azcya3BwendrdzN6NDYifQ.yfCdokogUv4h3zIHcpsV9w';

  if (!latitude || !longitude) {
    return (
      <div className="bg-gray-100 rounded-lg p-8 text-center" style={{ height }}>
        <FaMapMarkerAlt className="text-gray-400 text-4xl mx-auto mb-2" />
        <p className="text-gray-600">Không có thông tin vị trí</p>
      </div>
    );
  }

  return (
    <div className="relative rounded-lg overflow-hidden shadow-lg border border-gray-200" style={{ height }}>
      <Map
        {...viewState}
        onMove={(evt) => setViewState(evt.viewState)}
        onLoad={() => setIsLoaded(true)}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        mapboxAccessToken={MAPBOX_TOKEN}
        style={{ width: '100%', height: '100%' }}
        attributionControl={true}
      >
        {/* Custom Marker */}
        {isLoaded && (
          <Marker
            latitude={latitude}
            longitude={longitude}
            anchor="bottom"
          >
            <div className="relative cursor-pointer group">
              {/* Animated Marker */}
              <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 animate-bounce">
                <FaMapMarkerAlt className="text-red-500 text-4xl drop-shadow-lg filter" style={{ filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.3))' }} />
              </div>
              
              {/* Info Popup on Hover */}
              {hotelName && (
                <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
                  <div className="bg-white rounded-lg shadow-2xl p-3 border-2 border-primary">
                    <p className="font-bold text-sm text-gray-900 mb-1">{hotelName}</p>
                    {hotelAddress && (
                      <p className="text-xs text-gray-600">{hotelAddress}</p>
                    )}
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full">
                      <div className="border-8 border-transparent border-t-primary"></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Marker>
        )}

        {/* Navigation Controls */}
        <NavigationControl position="top-right" showCompass={true} showZoom={true} />
        
        {/* Fullscreen Control */}
        <FullscreenControl position="top-right" />
      </Map>

      {/* Info Overlay */}
      {hotelName && (
        <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3 max-w-xs z-10 border border-gray-200">
          <p className="font-semibold text-sm text-gray-900 mb-1">{hotelName}</p>
          {hotelAddress && (
            <p className="text-xs text-gray-600 flex items-start gap-1">
              <FaMapMarkerAlt className="text-red-500 mt-0.5 flex-shrink-0" />
              <span>{hotelAddress}</span>
            </p>
          )}
        </div>
      )}

      {/* Loading State */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-gray-600 text-sm">Đang tải bản đồ...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapView;

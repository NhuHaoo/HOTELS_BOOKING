import { useState, useEffect } from 'react';
import Map, { Marker, NavigationControl, FullscreenControl } from 'react-map-gl';
import { FaMapMarkerAlt } from 'react-icons/fa';
import 'mapbox-gl/dist/mapbox-gl.css';

const MapView = ({
  // ✅ có thể truyền 1 điểm trung tâm
  latitude,
  longitude,
  hotelName,
  hotelAddress,
  zoom = 14,
  height = '400px',

  // ✅ hoặc truyền danh sách khách sạn để vẽ nhiều marker
  hotels = [], // [{ _id, name, address, city, location: { coordinates: [lng, lat] } }]
  
  // ✅ Callback khi click trên map (cho HeroSearchBar)
  onMapClick, // (e) => { e.lngLat.lat, e.lngLat.lng }
}) => {
  // kiểm tra có danh sách khách sạn có tọa độ không
  const hotelMarkers = Array.isArray(hotels)
    ? hotels.filter(
        (h) =>
          h?.location?.coordinates &&
          h.location.coordinates.length === 2 &&
          typeof h.location.coordinates[0] === 'number' &&
          typeof h.location.coordinates[1] === 'number'
      )
    : [];

  // tính toạ độ mặc định
  const defaultCenter = (() => {
    if (hotelMarkers.length > 0) {
      const sum = hotelMarkers.reduce(
        (acc, h) => {
          const [lng, lat] = h.location.coordinates;
          return { lat: acc.lat + lat, lng: acc.lng + lng };
        },
        { lat: 0, lng: 0 }
      );
      return {
        latitude: sum.lat / hotelMarkers.length,
        longitude: sum.lng / hotelMarkers.length,
      };
    }

    if (latitude && longitude) {
      return { latitude, longitude };
    }

    // fallback Đà Nẵng
    return { latitude: 16.0544, longitude: 108.2022 };
  })();

  const [viewState, setViewState] = useState({
    latitude: defaultCenter.latitude,
    longitude: defaultCenter.longitude,
    zoom: zoom,
  });

  const [isLoaded, setIsLoaded] = useState(false);

  // update tâm bản đồ khi props thay đổi
  useEffect(() => {
    const center = (() => {
      if (hotelMarkers.length > 0) {
        const sum = hotelMarkers.reduce(
          (acc, h) => {
            const [lng, lat] = h.location.coordinates;
            return { lat: acc.lat + lat, lng: acc.lng + lng };
          },
          { lat: 0, lng: 0 }
        );
        return {
          latitude: sum.lat / hotelMarkers.length,
          longitude: sum.lng / hotelMarkers.length,
        };
      }
      if (latitude && longitude) {
        return { latitude, longitude };
      }
      return defaultCenter;
    })();

    setViewState((prev) => ({
      ...prev,
      latitude: center.latitude,
      longitude: center.longitude,
      zoom,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latitude, longitude, zoom, hotels.length]);

  const MAPBOX_TOKEN =
    'pk.eyJ1Ijoibmd1eWVuYW5oMjQ5IiwiYSI6ImNseXJuZDhwNzA4azcya3BwendrdzN6NDYifQ.yfCdokogUv4h3zIHcpsV9w';

  // nếu không có gì để vẽ thì báo
  if (!latitude && !longitude && hotelMarkers.length === 0) {
    return (
      <div className="bg-gray-100 rounded-lg p-8 text-center" style={{ height }}>
        <FaMapMarkerAlt className="text-gray-400 text-4xl mx-auto mb-2" />
        <p className="text-gray-600">Không có thông tin vị trí</p>
      </div>
    );
  }

  return (
    <div
      className="relative rounded-lg overflow-hidden shadow-lg border border-gray-200"
      style={{ height }}
    >
      <Map
        {...viewState}
        onMove={(evt) => setViewState(evt.viewState)}
        onLoad={() => setIsLoaded(true)}
        onClick={onMapClick}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        mapboxAccessToken={MAPBOX_TOKEN}
        style={{ width: '100%', height: '100%' }}
        attributionControl={true}
      >
        {/* 🔴 Marker cho 1 điểm truyền trực tiếp */}
        {isLoaded && latitude && longitude && hotelMarkers.length === 0 && (
          <Marker latitude={latitude} longitude={longitude} anchor="bottom">
            <div className="relative cursor-pointer group">
              <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 animate-bounce">
                <FaMapMarkerAlt
                  className="text-red-500 text-4xl drop-shadow-lg filter"
                  style={{
                    filter:
                      'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.3))',
                  }}
                />
              </div>

              {hotelName && (
                <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
                  <div className="bg-white rounded-lg shadow-2xl p-3 border-2 border-primary">
                    <p className="font-bold text-sm text-gray-900 mb-1">
                      {hotelName}
                    </p>
                    {hotelAddress && (
                      <p className="text-xs text-gray-600">
                        {hotelAddress}
                      </p>
                    )}
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full">
                      <div className="border-8 border-transparent border-t-primary" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Marker>
        )}

        {/* 🟢 Marker cho danh sách khách sạn */}
        {isLoaded &&
          hotelMarkers.length > 0 &&
          hotelMarkers.map((h, idx) => {
            const [lng, lat] = h.location.coordinates;
            return (
              <Marker
                key={h._id || idx}
                latitude={lat}
                longitude={lng}
                anchor="bottom"
              >
                <div className="relative cursor-pointer group">
                  <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 animate-bounce">
                    <FaMapMarkerAlt
                      className="text-red-500 text-3xl drop-shadow-lg filter"
                      style={{
                        filter:
                          'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.3))',
                      }}
                    />
                  </div>

                  <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
                    <div className="bg-white rounded-lg shadow-2xl p-2 border border-primary max-w-xs">
                      <p className="font-semibold text-xs text-gray-900 mb-1">
                        {h.name}
                      </p>
                      {h.address && (
                        <p className="text-[11px] text-gray-600">
                          {h.address}
                          {h.city ? `, ${h.city}` : ''}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </Marker>
            );
          })}

        <NavigationControl position="top-right" showCompass showZoom />
        <FullscreenControl position="top-right" />
      </Map>

      {/* Info Overlay cho view 1 khách sạn / 1 khu vực */}
      {hotelName && (
        <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3 max-w-xs z-10 border border-gray-200">
          <p className="font-semibold text-sm text-gray-900 mb-1">
            {hotelName}
          </p>
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
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-2" />
            <p className="text-gray-600 text-sm">Đang tải bản đồ...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapView;

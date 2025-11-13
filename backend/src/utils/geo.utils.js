// Calculate distance between two points using Haversine formula
exports.calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the Earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in km
  
  return distance;
};

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

// Find hotels near a location
exports.findNearbyHotels = async (Hotel, longitude, latitude, maxDistance = 10000) => {
  try {
    const hotels = await Hotel.find({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [longitude, latitude]
          },
          $maxDistance: maxDistance // in meters
        }
      }
    });

    return hotels;
  } catch (error) {
    throw error;
  }
};

// Get coordinates from address (you would need a geocoding service like Google Maps API)
exports.getCoordinatesFromAddress = async (address) => {
  // This is a placeholder. In production, use Google Maps Geocoding API or similar service
  // Example with Google Maps:
  // const response = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_API_KEY}`);
  // return response.data.results[0].geometry.location;
  
  return {
    lat: 0,
    lng: 0,
    message: 'Geocoding service not implemented. Please add Google Maps API key.'
  };
};

// Format coordinates for MongoDB
exports.formatCoordinates = (longitude, latitude) => {
  return {
    type: 'Point',
    coordinates: [parseFloat(longitude), parseFloat(latitude)]
  };
};

// Validate coordinates
exports.validateCoordinates = (longitude, latitude) => {
  const lon = parseFloat(longitude);
  const lat = parseFloat(latitude);

  if (isNaN(lon) || isNaN(lat)) {
    return false;
  }

  if (lon < -180 || lon > 180) {
    return false;
  }

  if (lat < -90 || lat > 90) {
    return false;
  }

  return true;
};


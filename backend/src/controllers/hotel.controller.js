const Hotel = require('../models/Hotel');
const Review = require('../models/Review');
const Room = require('../models/Room');

// @desc    Get all hotels
// @route   GET /api/hotels
// @access  Public
exports.getHotels = async (req, res) => {
  try {
    const {
      city,
      rating,
      search,
      hotelType,
      starRating,
      // Location-based search
      latitude,
      longitude,
      radius = 10000,
      page = 1,
      limit = 10,
      sort = '-rating'
    } = req.query;

    let query = { isActive: true };

    // Full-text search
    if (search) {
      query.$or = [
        { name: new RegExp(search, 'i') },
        { city: new RegExp(search, 'i') },
        { address: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') },
        { introduction: new RegExp(search, 'i') }
      ];
    }

    // City filter
    if (city) {
      query.city = new RegExp(city, 'i');
    }

    if (rating) {
      query.rating = { $gte: Number(rating) };
    }

    // Hotel type
    if (hotelType) {
      query.hotelType = hotelType;
    }

    // Star rating
    if (starRating) {
      query.starRating = Number(starRating);
    }

    // Location-based filter
    if (latitude && longitude) {
      const lat = parseFloat(latitude);
      const lon = parseFloat(longitude);
      const radiusMeters = parseFloat(radius);

      if (!isNaN(lat) && !isNaN(lon) && !isNaN(radiusMeters)) {
        query.location = {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [lon, lat]
            },
            $maxDistance: radiusMeters
          }
        };
      }
    }

    const startIndex = (page - 1) * limit;

    const hotels = await Hotel.find(query)
      .populate('rooms')
      .sort(sort)
      .limit(Number(limit))
      .skip(startIndex);

    const hotelsWithStats = await Promise.all(
      hotels.map(async (hotel) => {
        const hotelObj = hotel.toObject();

        if (hotelObj.rooms && hotelObj.rooms.length > 0) {
          const roomIds = hotelObj.rooms.map((room) => room._id || room);
          const reviewCount = await Review.countDocuments({
            roomId: { $in: roomIds },
            status: 'approved'
          });

          hotelObj.totalReviews = reviewCount;

          const availableRooms = await Room.countDocuments({
            hotelId: hotel._id,
            isActive: true,
            availability: true
          });

          hotelObj.availableRoomsCount = availableRooms;
        } else {
          hotelObj.totalReviews = 0;
          hotelObj.availableRoomsCount = 0;
        }

        return hotelObj;
      })
    );

    const total = await Hotel.countDocuments(query);

    res.status(200).json({
      success: true,
      count: hotels.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      data: hotelsWithStats
    });
  } catch (error) {
    console.error('Get hotels error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};


// @desc    Get single hotel
// @route   GET /api/hotels/:id
// @access  Public
exports.getHotel = async (req, res) => {
  try {
    const hotel = await Hotel.findById(req.params.id).populate('rooms');

    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: 'Hotel not found'
      });
    }

    const hotelObj = hotel.toObject();

    if (hotelObj.rooms && hotelObj.rooms.length > 0) {
      const roomIds = hotelObj.rooms.map((room) => room._id || room);

      hotelObj.totalReviews = await Review.countDocuments({
        roomId: { $in: roomIds },
        status: 'approved'
      });

      hotelObj.reviews = await Review.find({
        roomId: { $in: roomIds },
        status: 'approved'
      })
        .populate('userId', 'name avatar')
        .populate('roomId', 'name')
        .sort('-createdAt')
        .limit(10);

      hotelObj.availableRoomsCount = await Room.countDocuments({
        hotelId: hotel._id,
        isActive: true,
        availability: true
      });
    } else {
      hotelObj.totalReviews = 0;
      hotelObj.reviews = [];
      hotelObj.availableRoomsCount = 0;
    }

    res.status(200).json({
      success: true,
      data: hotelObj
    });
  } catch (error) {
    console.error('Get hotel error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};


// @desc    Create hotel
// @route   POST /api/hotels
// @access  Private/Admin
exports.createHotel = async (req, res) => {
  try {
    const hotel = await Hotel.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Hotel created successfully',
      data: hotel
    });
  } catch (error) {
    console.error('Create hotel error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};


// @desc    Update hotel
// @route   PUT /api/hotels/:id
// @access  Private/Admin
exports.updateHotel = async (req, res) => {
  try {
    let hotel = await Hotel.findById(req.params.id);

    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: 'Hotel not found'
      });
    }

    hotel = await Hotel.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      message: 'Hotel updated successfully',
      data: hotel
    });
  } catch (error) {
    console.error('Update hotel error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};


// @desc    Delete hotel
// @route   DELETE /api/hotels/:id
// @access  Private/Admin
exports.deleteHotel = async (req, res) => {
  try {
    const hotel = await Hotel.findById(req.params.id);

    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: 'Hotel not found'
      });
    }

    await hotel.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Hotel deleted successfully',
      data: {}
    });
  } catch (error) {
    console.error('Delete hotel error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};


// ----------------------------------------------------------------------
// ⭐ NEW — FIXED — Geospatial Nearby Search
// ----------------------------------------------------------------------

// @desc    Get nearby hotels
// @route   GET /api/hotels/nearby
// @access  Public
exports.getNearbyHotels = async (req, res) => {
  try {
    const { latitude, longitude, maxDistance = 10000 } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Please provide latitude and longitude'
      });
    }

    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);
    const distance = parseFloat(maxDistance);

    if (isNaN(lat) || isNaN(lon) || isNaN(distance)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid coordinates or distance'
      });
    }

    const hotels = await Hotel.find({
      isActive: true,
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [lon, lat]
          },
          $maxDistance: distance
        }
      }
    });

    return res.status(200).json({
      success: true,
      count: hotels.length,
      data: hotels
    });

  } catch (error) {
    console.error('Get nearby hotels error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

const Room = require('../models/Room');
const Hotel = require('../models/Hotel');
const Booking = require('../models/Booking');
const Review = require('../models/Review');

// Helper function to calculate available rooms count
async function getAvailableRoomsCount(roomId, checkIn, checkOut) {
  if (!checkIn || !checkOut) {
    // If no dates provided, return total rooms of this type
    const room = await Room.findById(roomId);
    if (!room) return 0;
    
    // Count total rooms of same type in same hotel
    const sameTypeRooms = await Room.countDocuments({
      hotelId: room.hotelId,
      roomType: room.roomType,
      isActive: true,
      availability: true
    });
    return sameTypeRooms;
  }

  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);

  // Find overlapping bookings
  const overlappingBookings = await Booking.countDocuments({
    roomId: roomId,
    $or: [
      {
        checkIn: { $lte: checkOutDate },
        checkOut: { $gte: checkInDate }
      }
    ],
    paymentStatus: { $in: ['paid', 'pending'] },
    bookingStatus: { $nin: ['cancelled'] }
  });

  // Get room to find total rooms of same type
  const room = await Room.findById(roomId);
  if (!room) return 0;

  const totalRoomsOfType = await Room.countDocuments({
    hotelId: room.hotelId,
    roomType: room.roomType,
    isActive: true,
    availability: true
  });

  return Math.max(0, totalRoomsOfType - overlappingBookings);
}

// Helper function to get available dates for a room
async function getAvailableDates(roomId, startDate, endDate) {
  const start = startDate ? new Date(startDate) : new Date();
  const end = endDate ? new Date(endDate) : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); // 90 days ahead

  // Get all bookings for this room in date range
  const bookings = await Booking.find({
    roomId: roomId,
    checkIn: { $lte: end },
    checkOut: { $gte: start },
    paymentStatus: { $in: ['paid', 'pending'] },
    bookingStatus: { $nin: ['cancelled'] }
  }).select('checkIn checkOut');

  // Get total rooms of same type
  const room = await Room.findById(roomId);
  if (!room) return [];

  const totalRoomsOfType = await Room.countDocuments({
    hotelId: room.hotelId,
    roomType: room.roomType,
    isActive: true,
    availability: true
  });

  // Generate all dates in range
  const availableDates = [];
  const currentDate = new Date(start);
  
  while (currentDate <= end) {
    const dateStr = currentDate.toISOString().split('T')[0];
    const date = new Date(dateStr);
    
    // Count bookings that overlap with this date
    const bookingsOnDate = bookings.filter(booking => {
      return date >= booking.checkIn && date < booking.checkOut;
    });

    if (bookingsOnDate.length < totalRoomsOfType) {
      availableDates.push(dateStr);
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return availableDates;
}

// @desc    Get all rooms with filters
// @route   GET /api/rooms
// @access  Public
exports.getRooms = async (req, res) => {
  try {
    const {
      city,
      minPrice,
      maxPrice,
      roomType,
      amenities,
      maxGuests,
      adults,
      children,
      rating,
      availability,
      search,
      // Location-based search
      latitude,
      longitude,
      radius = 10000, // meters, default 10km
      // Date range for availability
      checkIn,
      checkOut,
      page = 1,
      limit = 10,
      sort = '-createdAt'
    } = req.query;

    // Build query
    let query = { isActive: true };

    // Full-text search (tìm kiếm tổng quát)
    if (search) {
      // Search in room name, description, hotel name, city
      const hotels = await Hotel.find({
        $or: [
          { name: new RegExp(search, 'i') },
          { city: new RegExp(search, 'i') },
          { address: new RegExp(search, 'i') },
          { description: new RegExp(search, 'i') }
        ],
        isActive: true
      }).select('_id');
      
      const hotelIds = hotels.map(h => h._id);
      
      query.$or = [
        { name: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') },
        { hotelId: { $in: hotelIds } }
      ];
    }

    // Filter by city (through hotel)
    if (city) {
      const hotels = await Hotel.find({ 
        city: new RegExp(city, 'i'),
        isActive: true 
      }).select('_id');
      const hotelIds = hotels.map(h => h._id);
      query.hotelId = { $in: hotelIds };
    }

    // Filter by location (bán kính)
    if (latitude && longitude) {
      const lat = parseFloat(latitude);
      const lon = parseFloat(longitude);
      const radiusMeters = parseFloat(radius);

      if (!isNaN(lat) && !isNaN(lon) && !isNaN(radiusMeters)) {
        const nearbyHotels = await Hotel.find({
          location: {
            $near: {
              $geometry: {
                type: 'Point',
                coordinates: [lon, lat]
              },
              $maxDistance: radiusMeters
            }
          },
          isActive: true
        }).select('_id');

        const nearbyHotelIds = nearbyHotels.map(h => h._id);
        
        if (query.hotelId) {
          // Combine with existing city filter
          const existingIds = Array.isArray(query.hotelId.$in) ? query.hotelId.$in : [];
          query.hotelId = { $in: existingIds.filter(id => nearbyHotelIds.includes(id)) };
        } else {
          query.hotelId = { $in: nearbyHotelIds };
        }
      }
    }

    // Filter by price range
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice && Number(maxPrice) > 0) query.price.$lte = Number(maxPrice);
    }

    // Filter by room type
    if (roomType) {
      query.roomType = roomType;
    }

    // Filter by amenities
    if (amenities) {
      const amenitiesArray = amenities.split(',');
      query.amenities = { $all: amenitiesArray };
    }

    // Filter by max guests
    if (maxGuests) {
      query.maxGuests = { $gte: Number(maxGuests) };
    }

    // Filter by adults and children
    if (adults || children) {
      const totalGuests = (Number(adults) || 0) + (Number(children) || 0);
      if (totalGuests > 0) {
        query.maxGuests = { $gte: totalGuests };
      }
      
      // Filter by maxAdults if specified
      if (adults) {
        query.$or = [
          { maxAdults: { $gte: Number(adults) } },
          { maxAdults: { $exists: false } }, // Rooms without maxAdults field
          { maxAdults: null }
        ];
      }
    }

    // Filter by rating
    if (rating) {
      query.rating = { $gte: Number(rating) };
    }

    // Filter by availability
    if (availability !== undefined) {
      query.availability = availability === 'true';
    }

    // Pagination
    const startIndex = (page - 1) * limit;

    // Execute query
    let rooms = await Room.find(query)
      .populate('hotelId', 'name address city rating location description introduction hotelType starRating cancellationPolicy reschedulePolicy')
      .sort(sort)
      .limit(Number(limit))
      .skip(startIndex);

    // Get total count
    const total = await Room.countDocuments(query);

    // Enrich rooms with additional data
    const enrichedRooms = await Promise.all(
      rooms.map(async (room) => {
        const roomObj = room.toObject();
        
        // Calculate available rooms count
        roomObj.availableRoomsCount = await getAvailableRoomsCount(
          room._id,
          checkIn,
          checkOut
        );

        // Get available dates
        if (checkIn && checkOut) {
          roomObj.availableDates = await getAvailableDates(
            room._id,
            checkIn,
            checkOut
          );
        }

        // Get hotel reviews count
        if (room.hotelId) {
          const hotelRoomIds = await Room.find({ hotelId: room.hotelId._id }).select('_id');
          const reviewCount = await Review.countDocuments({
            roomId: { $in: hotelRoomIds.map(r => r._id) },
            status: 'approved'
          });
          roomObj.hotelReviewsCount = reviewCount;
        }

        // Set default adults/children if not set
        if (!roomObj.maxAdults) {
          roomObj.maxAdults = roomObj.maxGuests || 2;
        }
        if (!roomObj.maxChildren) {
          roomObj.maxChildren = Math.max(0, (roomObj.maxGuests || 2) - (roomObj.maxAdults || 2));
        }

        return roomObj;
      })
    );

    res.status(200).json({
      success: true,
      count: enrichedRooms.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      data: enrichedRooms
    });
  } catch (error) {
    console.error('Get rooms error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get single room
// @route   GET /api/rooms/:id
// @access  Public
exports.getRoom = async (req, res) => {
  try {
    const { checkIn, checkOut } = req.query;
    
    const room = await Room.findById(req.params.id)
      .populate('hotelId', 'name address city rating location description introduction hotelType starRating amenities phone email checkInTime checkOutTime cancellationPolicy reschedulePolicy');

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    const roomObj = room.toObject();

    // Calculate available rooms count
    roomObj.availableRoomsCount = await getAvailableRoomsCount(
      room._id,
      checkIn,
      checkOut
    );

    // Get available dates
    if (checkIn && checkOut) {
      roomObj.availableDates = await getAvailableDates(
        room._id,
        checkIn,
        checkOut
      );
    }

    // Get hotel reviews
    if (room.hotelId) {
      const hotelRoomIds = await Room.find({ hotelId: room.hotelId._id }).select('_id');
      const reviews = await Review.find({
        roomId: { $in: hotelRoomIds.map(r => r._id) },
        status: 'approved'
      })
      .populate('userId', 'name avatar')
      .sort('-createdAt')
      .limit(10);

      roomObj.hotelReviews = reviews;
      roomObj.hotelReviewsCount = await Review.countDocuments({
        roomId: { $in: hotelRoomIds.map(r => r._id) },
        status: 'approved'
      });
    }

    // Set default adults/children if not set
    if (!roomObj.maxAdults) {
      roomObj.maxAdults = roomObj.maxGuests || 2;
    }
    if (!roomObj.maxChildren) {
      roomObj.maxChildren = Math.max(0, (roomObj.maxGuests || 2) - (roomObj.maxAdults || 2));
    }

    res.status(200).json({
      success: true,
      data: roomObj
    });
  } catch (error) {
    console.error('Get room error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get rooms by hotel ID
// @route   GET /api/rooms/hotel/:hotelId
// @access  Public
exports.getRoomsByHotel = async (req, res) => {
  try {
    const { hotelId } = req.params;
    const { limit = 6, excludeRoomId } = req.query;

    let query = {
      hotelId: hotelId,
      isActive: true,
      availability: true
    };

    // Exclude current room if specified
    if (excludeRoomId) {
      query._id = { $ne: excludeRoomId };
    }

    const rooms = await Room.find(query)
      .populate('hotelId', 'name city rating')
      .limit(parseInt(limit))
      .sort('-rating');

    res.status(200).json({
      success: true,
      count: rooms.length,
      data: rooms
    });
  } catch (error) {
    console.error('Get rooms by hotel error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Create room
// @route   POST /api/rooms
// @access  Private/Admin
exports.createRoom = async (req, res) => {
  try {
    const room = await Room.create(req.body);

    // Add room to hotel's rooms array
    await Hotel.findByIdAndUpdate(
      room.hotelId,
      { $push: { rooms: room._id } }
    );

    res.status(201).json({
      success: true,
      message: 'Room created successfully',
      data: room
    });
  } catch (error) {
    console.error('Create room error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Update room
// @route   PUT /api/rooms/:id
// @access  Private/Admin
exports.updateRoom = async (req, res) => {
  try {
    let room = await Room.findById(req.params.id);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    room = await Room.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    res.status(200).json({
      success: true,
      message: 'Room updated successfully',
      data: room
    });
  } catch (error) {
    console.error('Update room error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Delete room
// @route   DELETE /api/rooms/:id
// @access  Private/Admin
exports.deleteRoom = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    // Remove room from hotel's rooms array
    await Hotel.findByIdAndUpdate(
      room.hotelId,
      { $pull: { rooms: room._id } }
    );

    await room.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Room deleted successfully',
      data: {}
    });
  } catch (error) {
    console.error('Delete room error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Search rooms
// @route   GET /api/rooms/search
// @access  Public
exports.searchRooms = async (req, res) => {
  try {
    const { keyword } = req.query;

    if (!keyword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide search keyword'
      });
    }

    // Search in room name and description
    const rooms = await Room.find({
      isActive: true,
      $or: [
        { name: new RegExp(keyword, 'i') },
        { description: new RegExp(keyword, 'i') }
      ]
    })
      .populate('hotelId', 'name address city rating')
      .limit(20);

    res.status(200).json({
      success: true,
      count: rooms.length,
      data: rooms
    });
  } catch (error) {
    console.error('Search rooms error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get available rooms for date range
// @route   GET /api/rooms/available
// @access  Public
exports.getAvailableRooms = async (req, res) => {
  try {
    const { checkIn, checkOut, guests } = req.query;

    if (!checkIn || !checkOut) {
      return res.status(400).json({
        success: false,
        message: 'Please provide check-in and check-out dates'
      });
    }

    const Booking = require('../models/Booking');

    // Find all bookings that overlap with the requested dates
    const overlappingBookings = await Booking.find({
      $or: [
        {
          checkIn: { $lte: new Date(checkOut) },
          checkOut: { $gte: new Date(checkIn) }
        }
      ],
      paymentStatus: { $in: ['paid', 'pending'] },
      bookingStatus: { $nin: ['cancelled'] }
    }).select('roomId');

    const bookedRoomIds = overlappingBookings.map(b => b.roomId);

    // Find available rooms
    let query = {
      _id: { $nin: bookedRoomIds },
      availability: true,
      isActive: true
    };

    if (guests) {
      query.maxGuests = { $gte: Number(guests) };
    }

    const rooms = await Room.find(query)
      .populate('hotelId', 'name address city rating location');

    res.status(200).json({
      success: true,
      count: rooms.length,
      data: rooms
    });
  } catch (error) {
    console.error('Get available rooms error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};


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
  const end = endDate
    ? new Date(endDate)
    : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); // 90 days ahead

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
    const bookingsOnDate = bookings.filter((booking) => {
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
      maxGuests,       // tổng khách FE gửi lên (guests)
      adults,
      children,
      rating,
      availability,
      search,

      // Location-based search
      latitude,
      longitude,
      radius = 10000, // default 10km

      // Date range
      checkIn,
      checkOut,

      page = 1,
      limit = 10,
      sort = '-createdAt',

      hotelId // xem phòng của 1 khách sạn cụ thể
    } = req.query;

    // Build query
    let query = { isActive: true };
    const isHotelMode = !!hotelId;

    if (isHotelMode) {
      query.hotelId = hotelId;
    }

    // ================== SEARCH THEO TỪ KHÓA ==================
    let searchHotelIds = null;
    if (search && !isHotelMode) {
      const searchTerm = search.trim();
      
      // Helper: Remove Vietnamese tones để tìm không dấu
      const removeVietnameseTones = (str) => {
        if (!str) return '';
        return str
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/đ/g, 'd')
          .replace(/Đ/g, 'D')
          .toLowerCase();
      };
      
      const searchTermNoTones = removeVietnameseTones(searchTerm);

      // Tìm Hotel TRƯỚC theo name/city/address/searchKeywords (có dấu và không dấu)
      const matchedHotels = await Hotel.find({
          $or: [
          { name: { $regex: searchTerm, $options: 'i' } },
          { city: { $regex: searchTerm, $options: 'i' } },
          { address: { $regex: searchTerm, $options: 'i' } },
          { searchKeywords: { $regex: searchTerm, $options: 'i' } },
          // Tìm không dấu
          { name: { $regex: searchTermNoTones, $options: 'i' } },
          { city: { $regex: searchTermNoTones, $options: 'i' } },
          { address: { $regex: searchTermNoTones, $options: 'i' } },
          { searchKeywords: { $regex: searchTermNoTones, $options: 'i' } }
          ],
          isActive: true
        }).select('_id');

      searchHotelIds = matchedHotels.map((h) => h._id.toString());

      // Debug logging
      console.log(`[SEARCH] Term: "${searchTerm}" (no tones: "${searchTermNoTones}")`);
      console.log(`[SEARCH] Found ${searchHotelIds.length} hotels`);
    } else if (search && isHotelMode) {
      // Đang xem trong 1 khách sạn → chỉ search trong các phòng của KS đó
      const searchTerm = search.trim();
        query.$or = [
        { name: { $regex: searchTerm, $options: 'i' } },
        { description: { $regex: searchTerm, $options: 'i' } }
        ];
    }
    // ================== HẾT PHẦN SEARCH ==================

    // Filter by city (CHỈ dùng khi KHÔNG ở chế độ 1 khách sạn)
    let cityHotelIds = null;
    if (city && !isHotelMode) {
      const escapedCity = city.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const cityRegex = new RegExp(escapedCity, 'i');

      const hotels = await Hotel.find({
        city: cityRegex,
        isActive: true
      }).select('_id');

      cityHotelIds = hotels.map((h) => h._id.toString());
    }

    // Filter by location (cũng bỏ qua nếu đang xem 1 KS cụ thể)
    let nearbyHotelIds = null;
    if (latitude && longitude && !isHotelMode) {
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

        nearbyHotelIds = nearbyHotels.map((h) => h._id.toString());
      }
    }

    // Kết hợp tất cả các filter hotelIds (intersect)
    if (!isHotelMode) {
      const allHotelIdArrays = [searchHotelIds, cityHotelIds, nearbyHotelIds].filter(Boolean);
      
      if (allHotelIdArrays.length > 0) {
        // Intersect tất cả các mảng hotelIds
        let finalHotelIds = allHotelIdArrays[0];
        for (let i = 1; i < allHotelIdArrays.length; i++) {
          finalHotelIds = finalHotelIds.filter(id => allHotelIdArrays[i].includes(id));
        }
        
        // Nếu kết quả intersect rỗng → không có room nào
        query.hotelId = { $in: finalHotelIds };
      } else if (searchHotelIds !== null) {
        // Chỉ có search filter (có thể là mảng rỗng)
        query.hotelId = { $in: searchHotelIds };
      }
    }

    // Filter by price
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice && Number(maxPrice) > 0) query.price.$lte = Number(maxPrice);
    }

    // Room type
    if (roomType) query.roomType = roomType;

    // Amenities
    if (amenities) {
      const amenitiesArray = amenities
        .split(',')
        .map(a => a.trim())
        .filter(Boolean);
      if (amenitiesArray.length) {
        query.amenities = { $all: amenitiesArray };
      }
    }

    // ⭐⭐ LỌC THEO NGƯỜI LỚN + TRẺ EM / TỔNG KHÁCH ⭐⭐
    const adultsNum = Number(adults);
    const childrenNum = Number(children);

    const hasAdults = Number.isFinite(adultsNum) && adultsNum > 0;
    const hasChildren = Number.isFinite(childrenNum) && childrenNum >= 0;

    const totalGuests =
      (hasAdults ? adultsNum : 0) +
      (hasChildren ? childrenNum : 0);

    // Nếu FE có gửi maxGuests riêng → lấy max giữa 2 cái
    let minGuestsNeeded = 0;
    if (!isNaN(Number(maxGuests)) && Number(maxGuests) > 0) {
      minGuestsNeeded = Number(maxGuests);
    }
    if (totalGuests > 0) {
      minGuestsNeeded = Math.max(minGuestsNeeded, totalGuests);
    }
    if (minGuestsNeeded > 0) {
      query.maxGuests = { $gte: minGuestsNeeded };
    }

    // Điều kiện chi tiết theo người lớn / trẻ em (mềm, không làm chặt quá)
    const andConditions = [];

    if (hasAdults) {
      andConditions.push({
        $or: [
          { maxAdults: { $gte: adultsNum } },
          { maxAdults: { $exists: false } },
          { maxAdults: null }
        ]
      });
    }

    if (hasChildren) {
      andConditions.push({
        $or: [
          { maxChildren: { $gte: childrenNum } },
          { maxChildren: { $exists: false } },
          { maxChildren: null }
        ]
      });
    }

    if (andConditions.length > 0) {
      if (query.$and) {
        query.$and = query.$and.concat(andConditions);
      } else {
        query.$and = andConditions;
      }
    }
    // ⭐⭐ HẾT PHẦN NGƯỜI LỚN + TRẺ EM ⭐⭐

    // Rating
    if (rating) query.rating = { $gte: Number(rating) };

    // Availability status
    if (availability !== undefined) {
      query.availability = availability === 'true';
    }

    // Pagination
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 10;
    const startIndex = (pageNum - 1) * limitNum;

    // Execute query
    let rooms = await Room.find(query)
      .populate(
        'hotelId',
        'name address city rating location description introduction hotelType starRating cancellationPolicy reschedulePolicy images thumbnail'
      )
      .sort(sort)
      .limit(limitNum)
      .skip(startIndex);

    const total = await Room.countDocuments(query);

    // Enrich rooms
    const enrichedRooms = await Promise.all(
      rooms.map(async (room) => {
        const roomObj = room.toObject();

        // Số lượng phòng còn trống trong ngày
        roomObj.availableRoomsCount = await getAvailableRoomsCount(
          room._id,
          checkIn,
          checkOut
        );

        // Ngày còn trống
        if (checkIn && checkOut) {
          roomObj.availableDates = await getAvailableDates(
            room._id,
            checkIn,
            checkOut
          );
        }

        // Tổng review của khách sạn
        if (room.hotelId) {
          const hotelRoomIds = await Room.find({
            hotelId: room.hotelId._id
          }).select('_id');

          const reviewCount = await Review.countDocuments({
            roomId: { $in: hotelRoomIds.map((r) => r._id) },
            status: 'approved'
          });

          roomObj.hotelReviewsCount = reviewCount;
        }

        // fallback nếu thiếu maxAdults / maxChildren
        if (!roomObj.maxAdults)
          roomObj.maxAdults = roomObj.maxGuests || 2;

        if (!roomObj.maxChildren) {
          roomObj.maxChildren = Math.max(
            0,
            (roomObj.maxGuests || 2) - (roomObj.maxAdults || 2)
          );
        }

        return roomObj;
      })
    );

    res.status(200).json({
      success: true,
      count: enrichedRooms.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      data: enrichedRooms
    });
  } catch (error) {
    console.error('Get rooms error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get single room
// @route   GET /api/rooms/:id
// @access  Public
exports.getRoom = async (req, res) => {
  try {
    const { checkIn, checkOut } = req.query;

    const room = await Room.findById(req.params.id).populate(
      'hotelId',
      'name address city rating location description introduction hotelType starRating amenities phone email checkInTime checkOutTime cancellationPolicy reschedulePolicy images thumbnail'
    );

    if (!room) {
      return res
        .status(404)
        .json({ success: false, message: 'Room not found' });
    }

    const roomObj = room.toObject();

    roomObj.availableRoomsCount = await getAvailableRoomsCount(
      room._id,
      checkIn,
      checkOut
    );

    if (checkIn && checkOut) {
      roomObj.availableDates = await getAvailableDates(
        room._id,
        checkIn,
        checkOut
      );
    }

    if (room.hotelId) {
      const hotelRoomIds = await Room.find({
        hotelId: room.hotelId._id
      }).select('_id');

      const reviews = await Review.find({
        roomId: { $in: hotelRoomIds.map((r) => r._id) },
        status: 'approved'
      })
        .populate('userId', 'name avatar')
        .sort('-createdAt')
        .limit(10);

      roomObj.hotelReviews = reviews;

      roomObj.hotelReviewsCount = await Review.countDocuments({
        roomId: { $in: hotelRoomIds.map((r) => r._id) },
        status: 'approved'
      });
    }

    if (!roomObj.maxAdults)
      roomObj.maxAdults = roomObj.maxGuests || 2;

    if (!roomObj.maxChildren) {
      roomObj.maxChildren = Math.max(
        0,
        (roomObj.maxGuests || 2) - (roomObj.maxAdults || 2)
      );
    }

    res.status(200).json({ success: true, data: roomObj });
  } catch (error) {
    console.error('Get room error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
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

    if (excludeRoomId) {
      query._id = { $ne: excludeRoomId };
    }

    const rooms = await Room.find(query)
      .populate('hotelId', 'name city rating images thumbnail')
      .limit(parseInt(limit))
      .sort('-rating');

    res.status(200).json({
      success: true,
      count: rooms.length,
      data: rooms
    });
  } catch (error) {
    console.error('Get rooms by hotel error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Create room
// @route   POST /api/rooms
// @access  Private/Admin
exports.createRoom = async (req, res) => {
  try {
    const room = await Room.create(req.body);

    // Add room to hotel's rooms array
    await Hotel.findByIdAndUpdate(room.hotelId, {
      $push: { rooms: room._id }
    });

    res.status(201).json({
      success: true,
      message: 'Room created successfully',
      data: room
    });
  } catch (error) {
    console.error('Create room error:', error);
    res
      .status(500)
      .json({ success: false, message: error.message || 'Server error' });
  }
};

// @desc    Update room
// @route   PUT /api/rooms/:id
// @access  Private/Admin
exports.updateRoom = async (req, res) => {
  try {
    let room = await Room.findById(req.params.id);
    if (!room) {
      return res
        .status(404)
        .json({ success: false, message: 'Room not found' });
    }

    room = await Room.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      message: 'Room updated successfully',
      data: room
    });
  } catch (error) {
    console.error('Update room error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Delete room
// @route   DELETE /api/rooms/:id
// @access  Private/Admin
exports.deleteRoom = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) {
      return res
        .status(404)
        .json({ success: false, message: 'Room not found' });
    }

    await Hotel.findByIdAndUpdate(room.hotelId, {
      $pull: { rooms: room._id }
    });

    await room.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Room deleted successfully',
      data: {}
    });
  } catch (error) {
    console.error('Delete room error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
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

    const rooms = await Room.find({
      isActive: true,
      $or: [
        { name: new RegExp(keyword, 'i') },
        { description: new RegExp(keyword, 'i') }
      ]
    })
      .populate('hotelId', 'name address city rating images thumbnail')
      .limit(20);

    res.status(200).json({
      success: true,
      count: rooms.length,
      data: rooms
    });
  } catch (error) {
    console.error('Search rooms error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get available rooms for a date range
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

    // Find overlapping bookings
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

    const bookedRoomIds = overlappingBookings.map((b) => b.roomId);

    // Find available rooms
    let query = {
      _id: { $nin: bookedRoomIds },
      availability: true,
      isActive: true
    };

    if (guests) query.maxGuests = { $gte: Number(guests) };

    const rooms = await Room.find(query).populate(
      'hotelId',
      'name address city rating location images thumbnail'
    );

    res.status(200).json({
      success: true,
      count: rooms.length,
      data: rooms
    });
  } catch (error) {
    console.error('Get available rooms error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

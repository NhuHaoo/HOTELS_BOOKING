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

    // Get status from query params
    const status = req.query.status;

    // Admin can see all hotels, public users only see active ones
    let query = {};
    const isAdmin = req.user && req.user.role === 'admin';
    
    // Status filter (only for admin) - MUST be applied FIRST
    if (isAdmin) {
      // Admin can see all hotels by default (no filter)
      if (status && status !== '') {
        if (status === 'inactive') {
          // Filter by isActive = false (hotels that are disabled)
          query.isActive = false;
          // Don't filter by status field when filtering inactive
        } else if (status === 'active') {
          // When filtering active, ensure both status and isActive are true
          // Also include hotels without status field (default to 'active')
          query.$and = [
            {
              $or: [
                { status: 'active' },
                { status: { $exists: false } },
                { status: null }
              ]
            },
            { isActive: true }
          ];
        } else if (status === 'suspended') {
          // Filter by status = 'suspended' (can be active or inactive)
          query.status = 'suspended';
        } else if (status === 'violation') {
          // Filter by status = 'violation' (can be active or inactive)
          query.status = 'violation';
        }
      }
      // If no status filter, admin sees ALL hotels (no isActive filter)
    } else {
      // Non-admin users only see active hotels
      query.isActive = true;
    }

    // City filter - handle first as it affects search logic
    const hasCityFilter = city && city.trim();
    const cityRegex = hasCityFilter ? new RegExp(city.trim(), 'i') : null;

    // Full-text search
    // Check if we already have $or from status filter
    const hasStatusOr = query.$or && Array.isArray(query.$or);
    
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      
      if (hasCityFilter) {
        // If both search and city exist:
        // Search in name, address, description, introduction (NOT city, because city is filtered separately)
        // AND city must match city filter
        const searchOr = [
          { name: searchRegex },
          { address: searchRegex },
          { description: searchRegex },
          { introduction: searchRegex }
        ];
        
        // If we have status $or, combine with $and
        if (hasStatusOr) {
          if (!query.$and) query.$and = [];
          query.$and.push({ $or: searchOr });
          // Keep existing $or from status filter
        } else {
          query.$or = searchOr;
        }
        query.city = cityRegex;
      } else {
        // If only search (no city filter), search in all fields including city
        const searchOr = [
          { name: searchRegex },
          { city: searchRegex },
          { address: searchRegex },
          { description: searchRegex },
          { introduction: searchRegex }
        ];
        
        // If we have status $or, combine with $and
        if (hasStatusOr) {
          if (!query.$and) query.$and = [];
          query.$and.push({ $or: searchOr });
          // Keep existing $or from status filter
        } else {
          query.$or = searchOr;
    }
      }
    } else if (hasCityFilter) {
      // If only city filter (no search), use direct query
      query.city = cityRegex;
    }

    // Convert RegExp to string for logging
    const queryForLog = {};
    Object.keys(query).forEach(key => {
      if (query[key] instanceof RegExp) {
        queryForLog[key] = query[key].toString();
      } else if (Array.isArray(query[key])) {
        queryForLog[key] = query[key].map(item => {
          if (item instanceof RegExp) {
            return item.toString();
          }
          if (typeof item === 'object' && item !== null) {
            const itemObj = {};
            Object.keys(item).forEach(k => {
              if (item[k] instanceof RegExp) {
                itemObj[k] = item[k].toString();
              } else {
                itemObj[k] = item[k];
              }
            });
            return itemObj;
          }
          return item;
        });
      } else if (typeof query[key] === 'object' && query[key] !== null) {
        const obj = {};
        Object.keys(query[key]).forEach(k => {
          if (query[key][k] instanceof RegExp) {
            obj[k] = query[key][k].toString();
          } else {
            obj[k] = query[key][k];
          }
        });
        queryForLog[key] = obj;
      } else {
        queryForLog[key] = query[key];
      }
    });

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

    // Log final query after all filters
    const finalQueryForLog = {};
    Object.keys(query).forEach(key => {
      if (query[key] instanceof RegExp) {
        finalQueryForLog[key] = query[key].toString();
      } else if (Array.isArray(query[key])) {
        finalQueryForLog[key] = query[key].map(item => {
          if (item instanceof RegExp) {
            return item.toString();
          }
          if (typeof item === 'object' && item !== null) {
            const itemObj = {};
            Object.keys(item).forEach(k => {
              if (item[k] instanceof RegExp) {
                itemObj[k] = item[k].toString();
              } else {
                itemObj[k] = item[k];
              }
            });
            return itemObj;
          }
          return item;
        });
      } else if (typeof query[key] === 'object' && query[key] !== null) {
        const obj = {};
        Object.keys(query[key]).forEach(k => {
          if (query[key][k] instanceof RegExp) {
            obj[k] = query[key][k].toString();
          } else {
            obj[k] = query[key][k];
          }
        });
        finalQueryForLog[key] = obj;
      } else {
        finalQueryForLog[key] = query[key];
      }
    });

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

    // Convert query to loggable format
    const queryForExecution = {};
    Object.keys(query).forEach(key => {
      if (query[key] instanceof RegExp) {
        queryForExecution[key] = query[key].toString();
      } else if (Array.isArray(query[key])) {
        queryForExecution[key] = query[key].map(item => {
          if (item instanceof RegExp) {
            return item.toString();
          }
          if (typeof item === 'object' && item !== null) {
            const itemObj = {};
            Object.keys(item).forEach(k => {
              if (item[k] instanceof RegExp) {
                itemObj[k] = item[k].toString();
              } else {
                itemObj[k] = item[k];
              }
            });
            return itemObj;
          }
          return item;
        });
      } else if (typeof query[key] === 'object' && query[key] !== null) {
        const obj = {};
        Object.keys(query[key]).forEach(k => {
          if (query[key][k] instanceof RegExp) {
            obj[k] = query[key][k].toString();
          } else {
            obj[k] = query[key][k];
          }
        });
        queryForExecution[key] = obj;
      } else {
        queryForExecution[key] = query[key];
      }
    });

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

    // Count total with the same query
    const total = await Hotel.countDocuments(query);
    
    // Log query used for counting
    const countQueryForLog = {};
    Object.keys(query).forEach(key => {
      if (query[key] instanceof RegExp) {
        countQueryForLog[key] = query[key].toString();
      } else if (Array.isArray(query[key])) {
        countQueryForLog[key] = query[key].map(item => {
          if (item instanceof RegExp) {
            return item.toString();
          }
          if (typeof item === 'object' && item !== null) {
            const itemObj = {};
            Object.keys(item).forEach(k => {
              if (item[k] instanceof RegExp) {
                itemObj[k] = item[k].toString();
              } else {
                itemObj[k] = item[k];
              }
            });
            return itemObj;
          }
          return item;
        });
      } else if (typeof query[key] === 'object' && query[key] !== null) {
        const obj = {};
        Object.keys(query[key]).forEach(k => {
          if (query[key][k] instanceof RegExp) {
            obj[k] = query[key][k].toString();
          } else {
            obj[k] = query[key][k];
          }
        });
        countQueryForLog[key] = obj;
      } else {
        countQueryForLog[key] = query[key];
      }
    });

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

// @desc    Update hotel status (Enable/Disable/Suspend/Mark violation)
// @route   PUT /api/hotels/:id/status
// @access  Private/Admin
exports.updateHotelStatus = async (req, res) => {
  try {
    const { status, violationReason } = req.body;
    const hotel = await Hotel.findById(req.params.id);

    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: 'Hotel not found'
      });
    }

    // Validate status
    const validStatuses = ['active', 'suspended', 'violation'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be: active, suspended, or violation'
      });
    }

    // Update hotel status
    hotel.status = status;
    
    if (status === 'active') {
      hotel.isActive = true;
      hotel.suspendedAt = null;
      hotel.suspendedBy = null;
      hotel.violationReason = null;
    } else if (status === 'suspended') {
      hotel.isActive = false;
      hotel.suspendedAt = new Date();
      hotel.suspendedBy = req.user.id;
      hotel.violationReason = null;
    } else if (status === 'violation') {
      hotel.isActive = false;
      hotel.suspendedAt = new Date();
      hotel.suspendedBy = req.user.id;
      hotel.violationReason = violationReason || 'Vi phạm quy định của hệ thống';
    }

    await hotel.save();

    res.status(200).json({
      success: true,
      message: `Hotel status updated to ${status} successfully`,
      data: hotel
    });
  } catch (error) {
    console.error('Update hotel status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Toggle hotel active status (Enable/Disable)
// @route   PUT /api/hotels/:id/toggle-active
// @access  Private/Admin, Manager
exports.toggleHotelActive = async (req, res) => {
  try {
    const hotel = await Hotel.findById(req.params.id);

    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: 'Hotel not found'
      });
    }

    // Manager can only toggle their own hotel
    if (req.user.role === 'manager' && hotel._id.toString() !== req.user.hotelId?.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to modify this hotel'
      });
    }

    // Toggle isActive
    hotel.isActive = !hotel.isActive;
    
    // If disabling, update status to suspended
    if (!hotel.isActive && hotel.status === 'active') {
      hotel.status = 'suspended';
      hotel.suspendedAt = new Date();
      hotel.suspendedBy = req.user.id;
    } else if (hotel.isActive && hotel.status === 'suspended') {
      // If enabling and was suspended, set back to active
      hotel.status = 'active';
      hotel.suspendedAt = null;
      hotel.suspendedBy = null;
      hotel.violationReason = null;
    }

    await hotel.save();

    res.status(200).json({
      success: true,
      message: `Hotel ${hotel.isActive ? 'enabled' : 'disabled'} successfully`,
      data: hotel
    });
  } catch (error) {
    console.error('Toggle hotel active error:', error);
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

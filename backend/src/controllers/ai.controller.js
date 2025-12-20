const Room = require('../models/Room');
const Booking = require('../models/Booking');
const Review = require('../models/Review');
const Favorite = require('../models/Favorite');
const Hotel = require('../models/Hotel');
const ChatMessage = require('../models/ChatMessage');
const config = require('../config/env');

// Helper function to execute room search
async function executeSearchRooms(params) {
  try {
    const { city, minPrice, maxPrice, maxGuests, roomType } = params;
    
    const query = { isActive: true, availability: true };
    
    if (city) {
      // Search in hotel's city
      const hotels = await Hotel.find({ 
        city: new RegExp(city, 'i') 
      }).select('_id');
      query.hotelId = { $in: hotels.map(h => h._id) };
    }
    
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = minPrice;
      if (maxPrice) query.price.$lte = maxPrice;
    }
    
    if (maxGuests) {
      query.maxGuests = { $gte: maxGuests };
    }
    
    if (roomType) {
      query.roomType = roomType;
    }
    
    const rooms = await Room.find(query)
      .populate('hotelId', 'name address city rating')
      .limit(5)
      .sort('-rating');
    
    return {
      success: true,
      count: rooms.length,
      rooms: rooms.map(room => ({
        id: room._id,
        name: room.name,
        hotel: room.hotelId?.name,
        city: room.hotelId?.city,
        price: room.price,
        image: room.images?.[0],
        rating: room.rating,
        maxGuests: room.maxGuests,
        roomType: room.roomType,
        link: `/rooms/${room._id}` // Relative path for navigate()
      }))
    };
  } catch (error) {
    console.error('Search rooms error:', error);
    return {
      success: false,
      message: 'Không thể tìm kiếm phòng lúc này'
    };
  }
}

// Helper function to get room details
async function executeGetRoomDetails(params) {
  try {
    const { roomId } = params;
    
    const room = await Room.findById(roomId)
      .populate('hotelId', 'name address city rating phone email amenities');
    
    if (!room) {
      return {
        success: false,
        message: 'Không tìm thấy phòng'
      };
    }
    
    return {
      success: true,
      room: {
        id: room._id,
        name: room.name,
        description: room.description,
        price: room.price,
        images: room.images,
        hotel: {
          name: room.hotelId?.name,
          address: room.hotelId?.address,
          city: room.hotelId?.city,
          rating: room.hotelId?.rating,
          phone: room.hotelId?.phone
        },
        amenities: room.amenities,
        rating: room.rating,
        totalReviews: room.totalReviews,
        maxGuests: room.maxGuests,
        roomType: room.roomType,
        bedType: room.bedType,
        size: room.size,
        view: room.view,
        link: `/rooms/${room._id}`, // Relative path
        bookingLink: `/booking?roomId=${room._id}` // Relative path
      }
    };
  } catch (error) {
    console.error('Get room details error:', error);
    return {
      success: false,
      message: 'Không thể lấy thông tin phòng'
    };
  }
}

// Helper function to create booking link
async function executeCreateBookingLink(params) {
  try {
    const { roomId } = params;
    
    const room = await Room.findById(roomId)
      .populate('hotelId', 'name city');
    
    if (!room) {
      return {
        success: false,
        message: 'Không tìm thấy phòng'
      };
    }
    
    return {
      success: true,
      bookingLink: `/booking?roomId=${room._id}`, // Relative path
      roomName: room.name,
      hotelName: room.hotelId?.name,
      city: room.hotelId?.city,
      price: room.price
    };
  } catch (error) {
    console.error('Create booking link error:', error);
    return {
      success: false,
      message: 'Không thể tạo link đặt phòng'
    };
  }
}

// @desc    Get room recommendations for user
// @route   GET /api/ai/recommendations
// @access  Private
exports.getRecommendations = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user's booking history
    const userBookings = await Booking.find({
      userId,
      paymentStatus: 'paid'
    }).populate('roomId');

    // Get user's favorites
    const userFavorites = await Favorite.find({ userId }).populate('roomId');

    // Get user's reviews
    const userReviews = await Review.find({ userId });

    // Build recommendation based on user preferences
    let recommendedRooms = [];

    if (userBookings.length > 0 || userFavorites.length > 0) {
      // Extract preferences from booking history and favorites
      const preferredRoomTypes = new Set();
      const preferredPriceRange = { min: Infinity, max: 0 };
      const preferredAmenities = new Set();

      [...userBookings, ...userFavorites].forEach(item => {
        const room = item.roomId;
        if (room) {
          preferredRoomTypes.add(room.roomType);
          if (room.price < preferredPriceRange.min) preferredPriceRange.min = room.price;
          if (room.price > preferredPriceRange.max) preferredPriceRange.max = room.price;
          room.amenities.forEach(amenity => preferredAmenities.add(amenity));
        }
      });

      // Find similar rooms
      const query = {
        isActive: true,
        availability: true
      };

      if (preferredRoomTypes.size > 0) {
        query.roomType = { $in: Array.from(preferredRoomTypes) };
      }

      if (preferredPriceRange.min !== Infinity) {
        query.price = {
          $gte: preferredPriceRange.min * 0.8, // 20% lower
          $lte: preferredPriceRange.max * 1.2  // 20% higher
        };
      }

      recommendedRooms = await Room.find(query)
        .populate('hotelId', 'name address city rating')
        .sort('-rating')
        .limit(10);

      // Filter out already booked or favorited rooms
      const bookedRoomIds = userBookings.map(b => b.roomId._id.toString());
      const favoritedRoomIds = userFavorites.map(f => f.roomId._id.toString());
      const excludedIds = [...bookedRoomIds, ...favoritedRoomIds];

      recommendedRooms = recommendedRooms.filter(
        room => !excludedIds.includes(room._id.toString())
      );
    } else {
      // For new users, recommend popular rooms
      recommendedRooms = await Room.find({
        isActive: true,
        availability: true
      })
        .populate('hotelId', 'name address city rating')
        .sort('-rating -totalReviews')
        .limit(10);
    }

    res.status(200).json({
      success: true,
      count: recommendedRooms.length,
      data: recommendedRooms
    });
  } catch (error) {
    console.error('Get recommendations error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get popular rooms
// @route   GET /api/ai/popular
// @access  Public
exports.getPopularRooms = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    // Get rooms with most bookings
    const popularRooms = await Booking.aggregate([
      {
        $match: {
          paymentStatus: 'paid'
        }
      },
      {
        $group: {
          _id: '$roomId',
          bookingCount: { $sum: 1 },
          totalRevenue: { $sum: '$totalPrice' }
        }
      },
      { $sort: { bookingCount: -1 } },
      { $limit: Number(limit) }
    ]);

    let roomsWithStats = [];

    if (popularRooms.length > 0) {
      // Populate room details
      const roomIds = popularRooms.map(r => r._id);
      const rooms = await Room.find({ _id: { $in: roomIds }, isActive: true })
        .populate('hotelId', 'name address city rating');

      // Merge booking count with room data
      roomsWithStats = rooms.map(room => {
        const stats = popularRooms.find(r => r._id.toString() === room._id.toString());
        return {
          ...room.toObject(),
          bookingCount: stats?.bookingCount || 0,
          totalRevenue: stats?.totalRevenue || 0
        };
      });
    } else {
      // Fallback: Show top-rated rooms when no bookings exist
      const rooms = await Room.find({ isActive: true, availability: true })
        .populate('hotelId', 'name address city rating')
        .sort('-rating -totalReviews')
        .limit(Number(limit));

      roomsWithStats = rooms.map(room => ({
        ...room.toObject(),
        bookingCount: 0,
        totalRevenue: 0
      }));
    }

    res.status(200).json({
      success: true,
      count: roomsWithStats.length,
      data: roomsWithStats
    });
  } catch (error) {
    console.error('Get popular rooms error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Chatbot - Get AI response with OpenAI GPT
// @route   POST /api/ai/chat
// @access  Public
exports.chatbot = async (req, res) => {
  try {
    const { message, context } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a message'
      });
    }

    // Check if OpenAI API key is configured
    const config = require('../config/env');
    
    if (!config.openaiApiKey) {
      // Fallback to keyword-based responses if no API key
      let response = '';
      const lowerMessage = message.toLowerCase();

      if (lowerMessage.includes('đặt phòng') || lowerMessage.includes('booking')) {
        response = 'Để đặt phòng, bạn có thể tìm kiếm phòng phù hợp, sau đó nhấn nút "Đặt ngay". Bạn cần đăng nhập để hoàn tất đặt phòng.';
      } else if (lowerMessage.includes('thanh toán') || lowerMessage.includes('payment')) {
        response = 'Chúng tôi hỗ trợ thanh toán qua VNPay. Sau khi đặt phòng, bạn sẽ được chuyển đến trang thanh toán an toàn.';
      } else if (lowerMessage.includes('hủy') || lowerMessage.includes('cancel')) {
        response = 'Bạn có thể hủy đặt phòng trong mục "Đơn đặt phòng của tôi". Lưu ý: Không thể hủy trong vòng 24 giờ trước ngày nhận phòng.';
      } else if (lowerMessage.includes('giá') || lowerMessage.includes('price')) {
        response = 'Giá phòng phụ thuộc vào loại phòng, vị trí và thời gian đặt. Bạn có thể sử dụng bộ lọc để tìm phòng theo mức giá phù hợp.';
      } else {
        response = 'Xin chào! Tôi là trợ lý ảo của hệ thống đặt phòng. Tôi có thể giúp bạn về: đặt phòng, thanh toán, hủy đặt phòng, và thông tin giá cả. Bạn cần hỗ trợ gì?';
      }

      return res.status(200).json({
        success: true,
        data: {
          response,
          timestamp: new Date(),
          source: 'fallback'
        }
      });
    }

    // Use OpenAI API
    const OpenAI = require('openai');
    const openai = new OpenAI({
      apiKey: config.openaiApiKey,
    });

    // System prompt for hotel booking assistant with function calling
    const systemPrompt = `Bạn là trợ lý ảo thông minh của hệ thống đặt phòng khách sạn với khả năng tìm kiếm và đặt phòng thực tế.

🎯 Nhiệm vụ của bạn:
- Tìm kiếm phòng phù hợp với yêu cầu của khách (sử dụng function searchRooms)
- Hiển thị chi tiết phòng với hình ảnh và link (sử dụng function getRoomDetails)
- Hỗ trợ đặt phòng trực tiếp (sử dụng function createBookingLink)
- Tư vấn về giá phòng, tiện nghi, chính sách
- Giải đáp thắc mắc và hỗ trợ thanh toán

📋 Quy trình tư vấn:
1. Khi khách hỏi về phòng → Hỏi chi tiết: thành phố, ngày, số người, giá
2. Khi có đủ thông tin → Gọi searchRooms để tìm phòng thực tế
3. Khi khách quan tâm phòng cụ thể → Gọi getRoomDetails để xem chi tiết
4. Khi khách muốn đặt → Gọi createBookingLink để tạo link đặt phòng

💡 Phong cách:
- Thân thiện, nhiệt tình, chuyên nghiệp
- Chủ động hỏi thông tin cần thiết để tìm phòng
- Sử dụng emoji phù hợp 🏨✨
- Luôn đưa ra gợi ý cụ thể với link và hình ảnh

⚠️ Lưu ý:
- Khi tìm được phòng, LUÔN show chi tiết với hình ảnh và link
- Khi khách muốn đặt, tạo link đặt phòng trực tiếp
- Không đưa ra thông tin sai lệch
- Nếu không tìm được phòng, gợi ý lựa chọn khác`;

    // Build conversation history
    const messages = [
      { role: 'system', content: systemPrompt }
    ];

    // Add context if provided
    if (context && Array.isArray(context)) {
      messages.push(...context);
    }

    // Add user message
    messages.push({ role: 'user', content: message });

    // Define available functions for AI
    const functions = [
      {
        name: 'searchRooms',
        description: 'Tìm kiếm phòng khách sạn dựa trên tiêu chí của khách hàng',
        parameters: {
          type: 'object',
          properties: {
            city: {
              type: 'string',
              description: 'Thành phố cần tìm phòng (Hà Nội, Đà Nẵng, Hồ Chí Minh, etc.)'
            },
            minPrice: {
              type: 'number',
              description: 'Giá tối thiểu (VNĐ)'
            },
            maxPrice: {
              type: 'number',
              description: 'Giá tối đa (VNĐ)'
            },
            maxGuests: {
              type: 'number',
              description: 'Số lượng khách'
            },
            roomType: {
              type: 'string',
              enum: ['single', 'double', 'deluxe', 'suite', 'family'],
              description: 'Loại phòng'
            }
          },
          required: ['city']
        }
      },
      {
        name: 'getRoomDetails',
        description: 'Lấy thông tin chi tiết của một phòng cụ thể bao gồm hình ảnh, tiện nghi, giá',
        parameters: {
          type: 'object',
          properties: {
            roomId: {
              type: 'string',
              description: 'ID của phòng cần xem chi tiết'
            }
          },
          required: ['roomId']
        }
      },
      {
        name: 'createBookingLink',
        description: 'Tạo link đặt phòng trực tiếp cho khách hàng',
        parameters: {
          type: 'object',
          properties: {
            roomId: {
              type: 'string',
              description: 'ID của phòng cần đặt'
            }
          },
          required: ['roomId']
        }
      }
    ];

    // Call OpenAI API with function calling
    let completion = await openai.chat.completions.create({
      model: config.openaiModel,
      messages: messages,
      functions: functions,
      function_call: 'auto',
      max_tokens: 1000,
      temperature: 0.7,
    });

    let responseMessage = completion.choices[0].message;

    // Check if AI wants to call a function
    if (responseMessage.function_call) {
      const functionName = responseMessage.function_call.name;
      const functionArgs = JSON.parse(responseMessage.function_call.arguments);

      console.log(`AI calling function: ${functionName}`, functionArgs);

      let functionResult;

      // Execute the requested function
      if (functionName === 'searchRooms') {
        functionResult = await executeSearchRooms(functionArgs);
      } else if (functionName === 'getRoomDetails') {
        functionResult = await executeGetRoomDetails(functionArgs);
      } else if (functionName === 'createBookingLink') {
        functionResult = await executeCreateBookingLink(functionArgs);
      }

      // Add function call and result to conversation
      messages.push(responseMessage);
      messages.push({
        role: 'function',
        name: functionName,
        content: JSON.stringify(functionResult)
      });

      // Get final response from AI
      const secondCompletion = await openai.chat.completions.create({
        model: config.openaiModel,
        messages: messages,
        max_tokens: 1000,
        temperature: 0.7,
      });

      const aiResponse = secondCompletion.choices[0].message.content;

      res.status(200).json({
        success: true,
        data: {
          response: aiResponse,
          functionCalled: functionName,
          functionResult: functionResult,
          timestamp: new Date(),
          source: 'openai',
          model: config.openaiModel
        }
      });
    } else {
      // No function call, just return AI response
      const aiResponse = responseMessage.content;

      res.status(200).json({
        success: true,
        data: {
          response: aiResponse,
          timestamp: new Date(),
          source: 'openai',
          model: config.openaiModel
        }
      });
    }
  } catch (error) {
    console.error('Chatbot error:', error);
    
    // Fallback response on error
    res.status(200).json({
      success: true,
      data: {
        response: 'Xin lỗi, tôi đang gặp sự cố kỹ thuật. Vui lòng thử lại sau hoặc liên hệ bộ phận hỗ trợ: support@hotelbooking.com',
        timestamp: new Date(),
        source: 'error_fallback'
      }
    });
  }
};

// @desc    Get trending destinations
// @route   GET /api/ai/trending
// @access  Public
exports.getTrendingDestinations = async (req, res) => {
  try {
    const { limit = 5 } = req.query;

    const Hotel = require('../models/Hotel');
    const Room = require('../models/Room');

    // Get most booked cities
    const trendingCities = await Booking.aggregate([
      {
        $match: {
          paymentStatus: 'paid',
          createdAt: {
            $gte: new Date(new Date().setMonth(new Date().getMonth() - 3)) // Last 3 months
          }
        }
      },
      {
        $lookup: {
          from: 'hotels',
          localField: 'hotelId',
          foreignField: '_id',
          as: 'hotel'
        }
      },
      { $unwind: '$hotel' },
      {
        $group: {
          _id: '$hotel.city',
          bookings: { $sum: 1 },
          averagePrice: { $avg: '$totalPrice' }
        }
      },
      { $sort: { bookings: -1 } },
      { $limit: Number(limit) }
    ]);

    // Fallback: If no bookings, show cities with most hotels/rooms
    let destinations = trendingCities;
    
    if (destinations.length === 0) {
      const citiesWithHotels = await Hotel.aggregate([
        {
          $group: {
            _id: '$city',
            hotelCount: { $sum: 1 },
            avgRating: { $avg: '$rating' }
          }
        },
        { $sort: { hotelCount: -1, avgRating: -1 } },
        { $limit: Number(limit) }
      ]);

      destinations = citiesWithHotels.map(city => ({
        _id: city._id,
        bookings: city.hotelCount * 10, // Simulated booking count
        averagePrice: 1500000, // Default price
        hotelCount: city.hotelCount
      }));
    }

    // Enrich destinations with hotel data (image, totalRooms, avgRating)
    const enrichedDestinations = await Promise.all(
      destinations.map(async (dest) => {
        // Get top hotel in this city (by rating)
        const topHotel = await Hotel.findOne({ city: dest._id })
          .sort({ rating: -1 })
          .select('images thumbnail rating _id')
          .lean();

        // Get all hotel IDs in this city
        const cityHotelIds = await Hotel.find({ city: dest._id }).select('_id').lean();
        const hotelIds = cityHotelIds.map(h => h._id);

        // Count total rooms in this city
        const totalRooms = hotelIds.length > 0
          ? await Room.countDocuments({
              hotelId: { $in: hotelIds },
              isActive: true
            })
          : 0;

        // Calculate average rating
        const cityHotels = await Hotel.find({ city: dest._id }).select('rating').lean();
        const avgRating = cityHotels.length > 0
          ? cityHotels.reduce((sum, h) => sum + (h.rating || 0), 0) / cityHotels.length
          : 0;

        return {
          _id: dest._id,
          bookings: dest.bookings || 0,
          averagePrice: dest.averagePrice || 1500000,
          totalRooms: totalRooms,
          avgRating: avgRating,
          image: topHotel?.images?.[0] || topHotel?.thumbnail || null
        };
      })
    );

    res.status(200).json({
      success: true,
      count: enrichedDestinations.length,
      data: enrichedDestinations
    });
  } catch (error) {
    console.error('Get trending destinations error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get personalized recommendations based on user history
// @route   GET /api/ai/personalized-recommendations
// @access  Private
exports.getPersonalizedRecommendations = async (req, res) => {
  try {
    const userId = req.user._id;
    const limit = parseInt(req.query.limit) || 6;

    // 1. Get user's booking history
    const userBookings = await Booking.find({ userId })
      .populate({
        path: 'roomId',
        populate: { path: 'hotelId' }
      })
      .sort('-createdAt')
      .limit(10);

    if (userBookings.length === 0) {
      // No history - return popular rooms
      const popularRooms = await Room.find({ isActive: true, availability: true })
        .populate('hotelId')
        .sort('-rating')
        .limit(limit);

      return res.status(200).json({
        success: true,
        message: 'Gợi ý phòng phổ biến cho khách hàng mới',
        isPersonalized: false,
        data: popularRooms
      });
    }

    // 2. Analyze booking patterns
    const preferences = {
      cities: {},
      priceRange: { min: Infinity, max: 0, avg: 0 },
      roomTypes: {},
      amenities: {},
      maxGuests: 0
    };

    let totalPrice = 0;
    let bookingCount = 0;

    userBookings.forEach(booking => {
      if (!booking.roomId) return;
      
      const room = booking.roomId;
      const hotel = room.hotelId;

      // City preferences
      if (hotel?.city) {
        preferences.cities[hotel.city] = (preferences.cities[hotel.city] || 0) + 1;
      }

      // Price range
      const price = room.finalPrice || room.price;
      if (price) {
        preferences.priceRange.min = Math.min(preferences.priceRange.min, price);
        preferences.priceRange.max = Math.max(preferences.priceRange.max, price);
        totalPrice += price;
        bookingCount++;
      }

      // Room type preferences
      if (room.roomType) {
        preferences.roomTypes[room.roomType] = (preferences.roomTypes[room.roomType] || 0) + 1;
      }

      // Amenities preferences
      if (room.amenities) {
        room.amenities.forEach(amenity => {
          preferences.amenities[amenity] = (preferences.amenities[amenity] || 0) + 1;
        });
      }

      // Guest count
      if (room.maxGuests) {
        preferences.maxGuests = Math.max(preferences.maxGuests, room.maxGuests);
      }
    });

    preferences.priceRange.avg = bookingCount > 0 ? totalPrice / bookingCount : 0;

    // 3. Get favorite cities (top 3)
    const favoriteCities = Object.entries(preferences.cities)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([city]) => city);

    // 4. Get favorite room types
    const favoriteRoomTypes = Object.entries(preferences.roomTypes)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([type]) => type);

    // 5. Build recommendation query
    const query = {
      isActive: true,
      availability: true,
      _id: { $nin: userBookings.map(b => b.roomId?._id).filter(Boolean) } // Exclude already booked
    };

    // Price range with flexibility (+/- 30%)
    if (preferences.priceRange.avg > 0) {
      const priceFlexibility = 0.3;
      query.price = {
        $gte: preferences.priceRange.avg * (1 - priceFlexibility),
        $lte: preferences.priceRange.avg * (1 + priceFlexibility)
      };
    }

    // Room type preference
    if (favoriteRoomTypes.length > 0) {
      query.roomType = { $in: favoriteRoomTypes };
    }

    // City preference
    if (favoriteCities.length > 0) {
      const hotels = await Hotel.find({ 
        city: { $in: favoriteCities }
      }).select('_id');
      query.hotelId = { $in: hotels.map(h => h._id) };
    }

    // 6. Get recommended rooms
    let recommendedRooms = await Room.find(query)
      .populate('hotelId')
      .sort('-rating')
      .limit(limit);

    // 7. If not enough recommendations, get similar rooms
    if (recommendedRooms.length < limit) {
      const additionalQuery = {
        isActive: true,
        availability: true,
        _id: { 
          $nin: [
            ...userBookings.map(b => b.roomId?._id).filter(Boolean),
            ...recommendedRooms.map(r => r._id)
          ]
        }
      };

      if (preferences.priceRange.avg > 0) {
        additionalQuery.price = {
          $gte: preferences.priceRange.avg * 0.5,
          $lte: preferences.priceRange.avg * 1.5
        };
      }

      const additionalRooms = await Room.find(additionalQuery)
        .populate('hotelId')
        .sort('-rating')
        .limit(limit - recommendedRooms.length);

      recommendedRooms = [...recommendedRooms, ...additionalRooms];
    }

    // 8. Generate AI insights using OpenAI
    let aiInsights = null;
    if (config.openaiApiKey) {
      try {
        const OpenAI = require('openai');
        const openai = new OpenAI({ apiKey: config.openaiApiKey });

        const userSummary = `
Khách hàng đã đặt ${userBookings.length} lần.
Thành phố yêu thích: ${favoriteCities.join(', ')}
Loại phòng ưa thích: ${favoriteRoomTypes.join(', ')}
Mức giá trung bình: ${Math.round(preferences.priceRange.avg).toLocaleString()} VNĐ
Số khách tối đa: ${preferences.maxGuests} người
        `.trim();

        const completion = await openai.chat.completions.create({
          model: config.openaiModel || 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'Bạn là chuyên gia tư vấn du lịch thông minh. Phân tích sở thích của khách hàng và đưa ra lời khuyên cá nhân hóa ngắn gọn (2-3 câu).'
            },
            {
              role: 'user',
              content: `Dựa vào lịch sử: ${userSummary}\n\nĐưa ra lời khuyên cá nhân hóa cho khách hàng này.`
            }
          ],
          max_tokens: 150,
          temperature: 0.7
        });

        aiInsights = completion.choices[0].message.content;
      } catch (error) {
        console.error('OpenAI insights error:', error);
      }
    }

    // 9. Return personalized recommendations
    res.status(200).json({
      success: true,
      message: 'Gợi ý phòng dựa trên sở thích của bạn',
      isPersonalized: true,
      preferences: {
        favoriteCities,
        favoriteRoomTypes,
        averagePrice: Math.round(preferences.priceRange.avg),
        bookingCount: userBookings.length
      },
      aiInsights,
      data: recommendedRooms
    });
  } catch (error) {
    console.error('Get personalized recommendations error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get chat messages for current user
// @route   GET /api/ai/chat/messages
// @access  Private
exports.getChatMessages = async (req, res) => {
  try {
    const userId = req.user._id;

    let chatMessage = await ChatMessage.findOne({ userId });

    // If no chat history exists, return default welcome message
    if (!chatMessage || !chatMessage.messages || chatMessage.messages.length === 0) {
      return res.status(200).json({
        success: true,
        data: [
          {
            type: 'bot',
            text: 'Xin chào! 👋 Tôi là trợ lý ảo của hệ thống đặt phòng khách sạn. Tôi có thể giúp bạn:\n\n• Tìm kiếm và đặt phòng\n• Tra cứu giá phòng\n• Hỗ trợ thanh toán\n• Giải đáp chính sách\n\nBạn cần hỗ trợ gì ạ? 😊',
            timestamp: new Date(),
          }
        ]
      });
    }

    res.status(200).json({
      success: true,
      data: chatMessage.messages
    });
  } catch (error) {
    console.error('Get chat messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Save chat messages for current user
// @route   POST /api/ai/chat/messages
// @access  Private
exports.saveChatMessages = async (req, res) => {
  try {
    const userId = req.user._id;
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({
        success: false,
        message: 'Messages must be an array'
      });
    }

    // Find or create chat message document
    let chatMessage = await ChatMessage.findOne({ userId });

    if (chatMessage) {
      // Update existing messages
      chatMessage.messages = messages;
      chatMessage.updatedAt = new Date();
      await chatMessage.save();
    } else {
      // Create new chat message document
      chatMessage = await ChatMessage.create({
        userId,
        messages
      });
    }

    res.status(200).json({
      success: true,
      message: 'Messages saved successfully',
      data: chatMessage.messages
    });
  } catch (error) {
    console.error('Save chat messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Clear chat messages for current user
// @route   DELETE /api/ai/chat/messages
// @access  Private
exports.clearChatMessages = async (req, res) => {
  try {
    const userId = req.user._id;

    await ChatMessage.findOneAndDelete({ userId });

    res.status(200).json({
      success: true,
      message: 'Chat messages cleared successfully'
    });
  } catch (error) {
    console.error('Clear chat messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};


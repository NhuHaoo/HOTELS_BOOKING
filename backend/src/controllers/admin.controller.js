const mongoose = require('mongoose');
const User = require('../models/User');
const Room = require('../models/Room');
const Hotel = require('../models/Hotel');
const Booking = require('../models/Booking');
const Review = require('../models/Review');


// ====================== DASHBOARD ======================
// @desc    Get dashboard statistics (có lọc theo khách sạn + ngày)
// @route   GET /api/admin/dashboard?hotelId=...&startDate=...&endDate=...
// @access  Private/Admin
exports.getDashboard = async (req, res) => {
  try {
    const { hotelId, startDate, endDate } = req.query;

    // ==== Build điều kiện lọc cho Booking ====
    const bookingMatch = {};

    // Lọc theo khách sạn
    if (hotelId && hotelId !== 'all') {
      bookingMatch.hotelId = new mongoose.Types.ObjectId(hotelId);
    }

    // Lọc theo khoảng ngày (createdAt – ngày tạo booking)
    if (startDate || endDate) {
      bookingMatch.createdAt = {};
      if (startDate) bookingMatch.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        bookingMatch.createdAt.$lte = end;
      }
    }

    // ==== Tổng quan theo filter ====

    // Tổng booking (theo filter)
    const totalBookings = await Booking.countDocuments(bookingMatch);

    // Doanh thu + giá trị trung bình (chỉ tính booking paid)
    const revenueStats = await Booking.aggregate([
      {
        $match: {
          ...bookingMatch,
          paymentStatus: 'paid',
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalPrice' },
          averageBookingValue: { $avg: '$totalPrice' },
        },
      },
    ]);

    const totalRevenue = revenueStats[0]?.totalRevenue || 0;
    const averageBookingValue = revenueStats[0]?.averageBookingValue || 0;

    // Tổng khách sạn
    let totalHotels;
    if (hotelId && hotelId !== 'all') {
      totalHotels = 1;
    } else {
      totalHotels = await Hotel.countDocuments();
    }

    // Tổng phòng (nếu lọc theo khách sạn thì chỉ đếm phòng của KS đó)
    let totalRooms;
    if (hotelId && hotelId !== 'all') {
      totalRooms = await Room.countDocuments({ hotelId });
    } else {
      totalRooms = await Room.countDocuments();
    }

    // Tổng user: số user đã từng có booking trong filter
    const usersByBooking = await Booking.aggregate([
      { $match: bookingMatch },
      {
        $group: {
          _id: '$userId',
        },
      },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
        },
      },
    ]);
    const totalUsers = usersByBooking[0]?.count || 0;

    // Booking theo status (theo filter)
    const bookingsByStatus = await Booking.aggregate([
      { $match: bookingMatch },
      {
        $group: {
          _id: '$bookingStatus',
          count: { $sum: 1 },
        },
      },
    ]);

    // Đặt phòng gần đây (theo filter)
    const recentBookings = await Booking.find(bookingMatch)
      .populate('userId', 'name email')
      .populate('roomId', 'name price')
      .populate('hotelId', 'name')
      .sort('-createdAt')
      .limit(10);

    // Doanh thu theo tháng (theo filter + 12 tháng gần nhất nếu không truyền ngày)
    const createdAtRange =
      startDate || endDate
        ? {} // đã set trong bookingMatch.createdAt ở trên
        : {
            $gte: new Date(new Date().setMonth(new Date().getMonth() - 12)),
          };

    const monthlyRevenue = await Booking.aggregate([
      {
        $match: {
          ...bookingMatch,
          paymentStatus: 'paid',
          ...(Object.keys(createdAtRange).length
            ? { createdAt: createdAtRange }
            : {}),
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          revenue: { $sum: '$totalPrice' },
          bookings: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    res.status(200).json({
      success: true,
      data: {
        overview: {
          totalUsers,
          totalRooms,
          totalHotels,
          totalBookings,
          totalRevenue,
          averageBookingValue,
        },
        bookingsByStatus,
        recentBookings,
        monthlyRevenue,
      },
    });
  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};


// ====================== REVENUE ======================
// @desc    Get revenue statistics
// @route   GET /api/admin/revenue
// @access  Private/Admin
exports.getRevenue = async (req, res) => {
  try {
    const { startDate, endDate, groupBy = 'month' } = req.query;

    let matchCondition = { paymentStatus: 'paid' };

    if (startDate || endDate) {
      matchCondition.createdAt = {};
      if (startDate) matchCondition.createdAt.$gte = new Date(startDate);
      if (endDate) matchCondition.createdAt.$lte = new Date(endDate);
    }

    let groupByField;
    switch (groupBy) {
      case 'day':
        groupByField = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' }
        };
        break;
      case 'month':
        groupByField = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        };
        break;
      case 'year':
        groupByField = {
          year: { $year: '$createdAt' }
        };
        break;
      default:
        groupByField = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        };
    }

    const revenue = await Booking.aggregate([
      { $match: matchCondition },
      {
        $group: {
          _id: groupByField,
          revenue: { $sum: '$totalPrice' },
          bookings: { $sum: 1 },
          averageValue: { $avg: '$totalPrice' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    // Total revenue for the period
    const totalRevenue = await Booking.aggregate([
      { $match: matchCondition },
      {
        $group: {
          _id: null,
          total: { $sum: '$totalPrice' },
          bookings: { $sum: 1 }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        revenue,
        summary: totalRevenue[0] || { total: 0, bookings: 0 }
      }
    });
  } catch (error) {
    console.error('Get revenue error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};


// ====================== ANALYTICS ======================
// @desc    Get analytics data
// @route   GET /api/admin/analytics
// @access  Private/Admin
exports.getAnalytics = async (req, res) => {
  try {
    // Bookings by payment method
    const bookingsByPayment = await Booking.aggregate([
      {
        $group: {
          _id: '$paymentMethod',
          count: { $sum: 1 },
          revenue: { $sum: '$totalPrice' }
        }
      }
    ]);

    // Average rating by hotel
    const hotelRatings = await Hotel.find()
      .select('name rating totalReviews')
      .sort('-rating')
      .limit(10);

    // Room type popularity
    const roomTypeStats = await Booking.aggregate([
      {
        $lookup: {
          from: 'rooms',
          localField: 'roomId',
          foreignField: '_id',
          as: 'room'
        }
      },
      { $unwind: '$room' },
      {
        $group: {
          _id: '$room.roomType',
          bookings: { $sum: 1 },
          revenue: { $sum: '$totalPrice' }
        }
      },
      { $sort: { bookings: -1 } }
    ]);

    // Cancellation rate
    const cancellationStats = await Booking.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          cancelled: {
            $sum: {
              $cond: [{ $eq: ['$bookingStatus', 'cancelled'] }, 1, 0]
            }
          }
        }
      }
    ]);

    const cancellationRate = cancellationStats[0]
      ? (cancellationStats[0].cancelled / cancellationStats[0].total) * 100
      : 0;

    // Average stay duration
    const avgStayDuration = await Booking.aggregate([
      {
        $project: {
          nights: {
            $divide: [
              { $subtract: ['$checkOut', '$checkIn'] },
              1000 * 60 * 60 * 24
            ]
          }
        }
      },
      {
        $group: {
          _id: null,
          averageNights: { $avg: '$nights' }
        }
      }
    ]);

    // User registration trend (last 12 months)
    const userRegistrations = await User.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(new Date().setMonth(new Date().getMonth() - 12))
          }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        bookingsByPayment,
        hotelRatings,
        roomTypeStats,
        cancellationRate: cancellationRate.toFixed(2),
        averageStayDuration: avgStayDuration[0]?.averageNights.toFixed(1) || 0,
        userRegistrations
      }
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};


// ====================== USERS ======================
// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
exports.getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, role, search } = req.query;

    let query = {};
    if (role) query.role = role;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const startIndex = (page - 1) * limit;

    const users = await User.find(query)
      .select('-passwordHash')
      .sort('-createdAt')
      .limit(Number(limit))
      .skip(startIndex)
      .lean();

    // Add totalBookings count for each user
    const usersWithBookings = await Promise.all(
      users.map(async (user) => {
        const totalBookings = await Booking.countDocuments({ userId: user._id });
        return { ...user, totalBookings };
      })
    );

    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      count: usersWithBookings.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      data: usersWithBookings
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};


// @desc    Lấy danh sách khách sạn để gán cho Manager
// @route   GET /api/admin/hotels
// @access  Private/Admin
exports.getHotels = async (req, res) => {
  try {
    const hotels = await Hotel.find().select('name city _id');

    res.status(200).json({
      success: true,
      data: hotels
    });
  } catch (error) {
    console.error('Get hotels error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};


// @desc    Create new user (user hoặc manager)
// @route   POST /api/admin/users
// @access  Private/Admin
exports.createUser = async (req, res) => {
  try {
    const { name, email, phone, password, role, hotelId } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin bắt buộc'
      });
    }

    // chỉ cho phép 2 role
    const allowedRoles = ['user', 'manager'];
    if (!role || !allowedRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Role không hợp lệ (chỉ user hoặc manager)'
      });
    }

    // manager bắt buộc có hotelId
    if (role === 'manager' && !hotelId) {
      return res.status(400).json({
        success: false,
        message: 'Manager phải gán với 1 khách sạn (hotelId)'
      });
    }

    // check email trùng
    const existed = await User.findOne({ email });
    if (existed) {
      return res.status(400).json({
        success: false,
        message: 'Email đã tồn tại'
      });
    }

    // nếu là manager thì kiểm tra hotel tồn tại
    if (role === 'manager') {
      const hotel = await Hotel.findById(hotelId);
      if (!hotel) {
        return res.status(400).json({
          success: false,
          message: 'Khách sạn không tồn tại (hotelId không hợp lệ)'
        });
      }
    }

    // tạo user (passwordHash sẽ được pre-save hook hash)
    const newUser = new User({
      name,
      email,
      phone,
      passwordHash: password,
      role,
      hotelId: role === 'manager' ? hotelId : null
    });

    await newUser.save();

    const safeUser = newUser.toObject();
    delete safeUser.passwordHash;

    res.status(201).json({
      success: true,
      message: 'Tạo tài khoản thành công',
      data: safeUser
    });

  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};


// @desc    Update user role
// @route   PUT /api/admin/users/:id/role
// @access  Private/Admin
exports.updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true, runValidators: true }
    ).select('-passwordHash');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'User role updated successfully',
      data: user
    });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};


// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Don't allow deleting admins
    if (user.role === 'admin') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete admin users'
      });
    }

    await user.deleteOne();

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};


// ====================== BOOKINGS ======================
// @desc    Get all bookings
// @route   GET /api/admin/bookings
// @access  Private/Admin
exports.getBookings = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, bookingStatus, paymentStatus } = req.query;

    let query = {};
    if (bookingStatus) query.bookingStatus = bookingStatus;
    if (paymentStatus) query.paymentStatus = paymentStatus;
    if (search) {
      query.$or = [
        { bookingCode: { $regex: search, $options: 'i' } },
        { guestName: { $regex: search, $options: 'i' } },
        { guestEmail: { $regex: search, $options: 'i' } }
      ];
    }

    const startIndex = (page - 1) * limit;

    const bookings = await Booking.find(query)
      .populate('userId', 'name email phone')
      .populate('roomId', 'name price images')
      .populate('hotelId', 'name city address')
      .sort('-createdAt')
      .limit(Number(limit))
      .skip(startIndex);

    const total = await Booking.countDocuments(query);

    res.status(200).json({
      success: true,
      count: bookings.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      data: bookings
    });
  } catch (error) {
    console.error('Get all bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};


// @desc    Update booking status
// @route   PUT /api/admin/bookings/:id/status
// @access  Private/Admin
exports.updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { bookingStatus: status },
      { new: true, runValidators: true }
    )
      .populate('userId', 'name email phone')
      .populate('roomId', 'name price images')
      .populate('hotelId', 'name city');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Booking status updated successfully',
      data: booking
    });
  } catch (error) {
    console.error('Update booking status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};


// @desc    Cancel booking
// @route   PUT /api/admin/bookings/:id/cancel
// @access  Private/Admin
exports.cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    if (booking.bookingStatus === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Booking is already cancelled'
      });
    }

    booking.bookingStatus = 'cancelled';
    booking.paymentStatus = 'cancelled';
    await booking.save();

    res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully',
      data: booking
    });
  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};


// ====================== REVIEWS ======================
// @desc    Get all reviews
// @route   GET /api/admin/reviews
// @access  Private/Admin
exports.getReviews = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, rating } = req.query;

    let query = {};
    if (rating) query.rating = Number(rating);
    if (search) {
      // Search in room name or user name (need to do lookup)
      const rooms = await Room.find({ name: { $regex: search, $options: 'i' } }).select('_id');
      const users = await User.find({ name: { $regex: search, $options: 'i' } }).select('_id');
      query.$or = [
        { roomId: { $in: rooms.map(r => r._id) } },
        { userId: { $in: users.map(u => u._id) } }
      ];
    }

    const startIndex = (page - 1) * limit;

    const reviews = await Review.find(query)
      .populate('userId', 'name email avatar')
      .populate('roomId', 'name images price')
      .populate('hotelId', 'name city')
      .sort('-createdAt')
      .limit(Number(limit))
      .skip(startIndex);

    const total = await Review.countDocuments(query);

    res.status(200).json({
      success: true,
      count: reviews.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      data: reviews
    });
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};


// @desc    Delete review
// @route   DELETE /api/admin/reviews/:id
// @access  Private/Admin
exports.deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    await review.deleteOne();

    // Update room rating
    const roomId = review.roomId;
    const reviews = await Review.find({ roomId, status: 'approved' });
    if (reviews.length > 0) {
      const avgRating =
        reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
      await Room.findByIdAndUpdate(roomId, {
        rating: parseFloat(avgRating.toFixed(1)),
        totalReviews: reviews.length
      });
    } else {
      await Room.findByIdAndUpdate(roomId, {
        rating: 0,
        totalReviews: 0
      });
    }

    res.status(200).json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

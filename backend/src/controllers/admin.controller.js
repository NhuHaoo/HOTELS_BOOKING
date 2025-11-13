const User = require('../models/User');
const Room = require('../models/Room');
const Hotel = require('../models/Hotel');
const Booking = require('../models/Booking');
const Review = require('../models/Review');

// @desc    Get dashboard statistics
// @route   GET /api/admin/dashboard
// @access  Private/Admin
exports.getDashboard = async (req, res) => {
  try {
    // Total counts
    const totalUsers = await User.countDocuments({ role: 'user' });
    const totalRooms = await Room.countDocuments();
    const totalHotels = await Hotel.countDocuments();
    const totalBookings = await Booking.countDocuments();

    // Revenue statistics
    const revenueStats = await Booking.aggregate([
      { $match: { paymentStatus: 'paid' } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalPrice' },
          averageBookingValue: { $avg: '$totalPrice' }
        }
      }
    ]);

    // Booking status breakdown
    const bookingsByStatus = await Booking.aggregate([
      {
        $group: {
          _id: '$bookingStatus',
          count: { $sum: 1 }
        }
      }
    ]);

    // Recent bookings
    const recentBookings = await Booking.find()
      .populate('userId', 'name email')
      .populate('roomId', 'name price')
      .populate('hotelId', 'name')
      .sort('-createdAt')
      .limit(10);

    // Top rated rooms
    const topRatedRooms = await Room.find({ isActive: true })
      .populate('hotelId', 'name city')
      .sort('-rating')
      .limit(5);

    // Monthly revenue (last 12 months)
    const monthlyRevenue = await Booking.aggregate([
      {
        $match: {
          paymentStatus: 'paid',
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
          revenue: { $sum: '$totalPrice' },
          bookings: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        overview: {
          totalUsers,
          totalRooms,
          totalHotels,
          totalBookings,
          totalRevenue: revenueStats[0]?.totalRevenue || 0,
          averageBookingValue: revenueStats[0]?.averageBookingValue || 0
        },
        bookingsByStatus,
        recentBookings,
        topRatedRooms,
        monthlyRevenue
      }
    });
  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

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
            $sum: { $cond: [{ $eq: ['$bookingStatus', 'cancelled'] }, 1, 0] }
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
      const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
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


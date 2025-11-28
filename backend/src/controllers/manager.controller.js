const User = require('../models/User');
const Room = require('../models/Room');
const Hotel = require('../models/Hotel');
const Booking = require('../models/Booking');
const Review = require('../models/Review');

// 🔐 Helper: đảm bảo manager có hotelId
const getManagerHotelId = (req, res) => {
  const hotelId = req.user?.hotelId;

  if (!hotelId) {
    res.status(400).json({
      success: false,
      message: 'Manager is not assigned to any hotel'
    });
    return null;
  }
  return hotelId;
};

/**
 * ===================== DASHBOARD / ANALYTICS =====================
 */

exports.getDashboard = async (req, res) => {
  try {
    const hotelId = getManagerHotelId(req, res);
    if (!hotelId) return;

    const totalRooms = await Room.countDocuments({ hotelId, isActive: true });
    const totalBookings = await Booking.countDocuments({ hotelId });
    const totalReviews = await Review.countDocuments({ hotelId });

    const revenueStats = await Booking.aggregate([
      { $match: { hotelId, paymentStatus: 'paid' } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalPrice' },
          averageBookingValue: { $avg: '$totalPrice' }
        }
      }
    ]);

    const bookingsByStatus = await Booking.aggregate([
      { $match: { hotelId } },
      {
        $group: {
          _id: '$bookingStatus',
          count: { $sum: 1 }
        }
      }
    ]);

    const recentBookings = await Booking.find({ hotelId })
      .populate('userId', 'name email')
      .populate('roomId', 'name price')
      .sort('-createdAt')
      .limit(10);

    const topRatedRooms = await Room.find({ hotelId, isActive: true })
      .populate('hotelId', 'name city')
      .sort('-rating')
      .limit(5);

    const monthlyRevenue = await Booking.aggregate([
      {
        $match: {
          hotelId,
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
          totalRooms,
          totalBookings,
          totalReviews,
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
    console.error('Manager get dashboard error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getRevenue = async (req, res) => {
  try {
    const hotelId = getManagerHotelId(req, res);
    if (!hotelId) return;

    const { startDate, endDate, groupBy = 'month' } = req.query;

    const matchCondition = { hotelId, paymentStatus: 'paid' };
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
      case 'year':
        groupByField = { year: { $year: '$createdAt' } };
        break;
      case 'month':
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
    console.error('Manager get revenue error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getAnalytics = async (req, res) => {
  try {
    const hotelId = getManagerHotelId(req, res);
    if (!hotelId) return;

    const bookingsByPayment = await Booking.aggregate([
      { $match: { hotelId } },
      {
        $group: {
          _id: '$paymentMethod',
          count: { $sum: 1 },
          revenue: { $sum: '$totalPrice' }
        }
      }
    ]);

    const hotelRatings = await Hotel.find({ _id: hotelId })
      .select('name rating totalReviews')
      .limit(1);

    const roomTypeStats = await Booking.aggregate([
      { $match: { hotelId } },
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

    const cancellationStats = await Booking.aggregate([
      { $match: { hotelId } },
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

    const avgStayDuration = await Booking.aggregate([
      { $match: { hotelId } },
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
      { $group: { _id: null, averageNights: { $avg: '$nights' } } }
    ]);

    const bookingTrend = await Booking.aggregate([
      {
        $match: {
          hotelId,
          createdAt: { $gte: new Date(new Date().setMonth(new Date().getMonth() - 12)) }
        }
      },
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
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
        averageStayDuration: avgStayDuration[0]?.averageNights?.toFixed(1) || 0,
        bookingTrend
      }
    });
  } catch (error) {
    console.error('Manager get analytics error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * ===================== BOOKINGS =====================
 */

exports.getBookings = async (req, res) => {
  try {
    const hotelId = getManagerHotelId(req, res);
    if (!hotelId) return;

    const { page = 1, limit = 20, search, bookingStatus, paymentStatus } = req.query;

    const query = { hotelId };
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
    console.error('Manager get bookings error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.updateBookingStatus = async (req, res) => {
  try {
    const hotelId = getManagerHotelId(req, res);
    if (!hotelId) return;

    const { status } = req.body;

    const booking = await Booking.findOneAndUpdate(
      { _id: req.params.id, hotelId },
      { bookingStatus: status },
      { new: true, runValidators: true }
    )
      .populate('userId', 'name email phone')
      .populate('roomId', 'name price images')
      .populate('hotelId', 'name city');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found or not in your hotel'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Booking status updated successfully',
      data: booking
    });
  } catch (error) {
    console.error('Manager update booking status error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.cancelBooking = async (req, res) => {
  try {
    const hotelId = getManagerHotelId(req, res);
    if (!hotelId) return;

    const booking = await Booking.findOne({ _id: req.params.id, hotelId });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found or not in your hotel'
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
    console.error('Manager cancel booking error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * ===================== REVIEWS =====================
 */

exports.getReviews = async (req, res) => {
  try {
    const hotelId = getManagerHotelId(req, res);
    if (!hotelId) return;

    const { page = 1, limit = 20, search, rating } = req.query;

    const query = { hotelId };
    if (rating) query.rating = Number(rating);

    if (search) {
      const rooms = await Room.find({
        hotelId,
        name: { $regex: search, $options: 'i' }
      }).select('_id');

      const users = await User.find({
        name: { $regex: search, $options: 'i' }
      }).select('_id');

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
    console.error('Manager get reviews error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.deleteReview = async (req, res) => {
  try {
    const hotelId = getManagerHotelId(req, res);
    if (!hotelId) return;

    const review = await Review.findOne({ _id: req.params.id, hotelId });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found or not in your hotel'
      });
    }

    const roomId = review.roomId;
    await review.deleteOne();

    const approvedReviews = await Review.find({ roomId, status: 'approved' });
    if (approvedReviews.length > 0) {
      const avgRating =
        approvedReviews.reduce((sum, r) => sum + r.rating, 0) /
        approvedReviews.length;

      await Room.findByIdAndUpdate(roomId, {
        rating: parseFloat(avgRating.toFixed(1)),
        totalReviews: approvedReviews.length
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
    console.error('Manager delete review error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

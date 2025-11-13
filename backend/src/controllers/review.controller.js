const Review = require('../models/Review');
const Room = require('../models/Room');
const Booking = require('../models/Booking');

// @desc    Create review
// @route   POST /api/reviews
// @access  Private
exports.createReview = async (req, res) => {
  try {
    const {
      roomId,
      rating,
      comment,
      images,
      cleanliness,
      comfort,
      location,
      service,
      valueForMoney,
      bookingId
    } = req.body;

    // Check if room exists
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    // Check if user has booked this room and completed the stay
    if (bookingId) {
      const booking = await Booking.findOne({
        _id: bookingId,
        userId: req.user.id,
        roomId,
        bookingStatus: 'checked-out',
        paymentStatus: 'paid'
      });

      if (!booking) {
        return res.status(400).json({
          success: false,
          message: 'You can only review rooms you have stayed in'
        });
      }
    }

    // Check if user already reviewed this room
    const existingReview = await Review.findOne({
      userId: req.user.id,
      roomId
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this room'
      });
    }

    // Create review
    const review = await Review.create({
      userId: req.user.id,
      roomId,
      hotelId: room.hotelId,
      bookingId,
      rating,
      comment,
      images: images || [],
      cleanliness,
      comfort,
      location,
      service,
      valueForMoney,
      isVerified: bookingId ? true : false
    });

    await review.populate('userId', 'name avatar');

    res.status(201).json({
      success: true,
      message: 'Review created successfully',
      data: review
    });
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Get reviews for a room
// @route   GET /api/reviews/:roomId
// @access  Public
exports.getRoomReviews = async (req, res) => {
  try {
    const { page = 1, limit = 10, sort = '-createdAt' } = req.query;

    const startIndex = (page - 1) * limit;

    const reviews = await Review.find({ roomId: req.params.roomId })
      .populate('userId', 'name avatar')
      .sort(sort)
      .limit(Number(limit))
      .skip(startIndex);

    const total = await Review.countDocuments({ roomId: req.params.roomId });

    // Calculate rating breakdown
    const mongoose = require('mongoose');
    const ratingStats = await Review.aggregate([
      { $match: { roomId: new mongoose.Types.ObjectId(req.params.roomId) } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 },
          averageCleanliness: { $avg: '$cleanliness' },
          averageComfort: { $avg: '$comfort' },
          averageLocation: { $avg: '$location' },
          averageService: { $avg: '$service' },
          averageValueForMoney: { $avg: '$valueForMoney' },
          rating5: { $sum: { $cond: [{ $eq: ['$rating', 5] }, 1, 0] } },
          rating4: { $sum: { $cond: [{ $eq: ['$rating', 4] }, 1, 0] } },
          rating3: { $sum: { $cond: [{ $eq: ['$rating', 3] }, 1, 0] } },
          rating2: { $sum: { $cond: [{ $eq: ['$rating', 2] }, 1, 0] } },
          rating1: { $sum: { $cond: [{ $eq: ['$rating', 1] }, 1, 0] } }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      count: reviews.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      stats: ratingStats[0] || null,
      data: reviews
    });
  } catch (error) {
    console.error('Get room reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get user's reviews
// @route   GET /api/reviews/my
// @access  Private
exports.getMyReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ userId: req.user.id })
      .populate('roomId', 'name images price')
      .populate('hotelId', 'name address city')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: reviews.length,
      data: reviews
    });
  } catch (error) {
    console.error('Get my reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update review
// @route   PUT /api/reviews/:id
// @access  Private
exports.updateReview = async (req, res) => {
  try {
    let review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Make sure user is review owner
    if (review.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this review'
      });
    }

    review = await Review.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    res.status(200).json({
      success: true,
      message: 'Review updated successfully',
      data: review
    });
  } catch (error) {
    console.error('Update review error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Delete review
// @route   DELETE /api/reviews/:id
// @access  Private
exports.deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Make sure user is review owner or admin
    if (review.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this review'
      });
    }

    await review.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Review deleted successfully',
      data: {}
    });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Mark review as helpful
// @route   PUT /api/reviews/:id/helpful
// @access  Private
exports.markHelpful = async (req, res) => {
  try {
    const review = await Review.findByIdAndUpdate(
      req.params.id,
      { $inc: { helpfulCount: 1 } },
      { new: true }
    );

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Review marked as helpful',
      data: review
    });
  } catch (error) {
    console.error('Mark helpful error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};


const Booking = require('../models/Booking');
const Room = require('../models/Room');
const { sendBookingConfirmation, sendBookingCancellation } = require('../utils/email.utils');

// ===== Helper: tính số ngày chênh lệch (làm tròn lên) =====
function getDaysDiff(from, to) {
  const start = new Date(from);
  const end = new Date(to);
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  const diffMs = end.getTime() - start.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

// @desc    Create booking
// @route   POST /api/bookings
// @access  Private
exports.createBooking = async (req, res) => {
  try {
    const {
      roomId,
      checkIn,
      checkOut,
      guests,
      guestName,
      guestEmail,
      guestPhone,
      specialRequests,
      paymentMethod
    } = req.body;

    // Validate room exists
    const room = await Room.findById(roomId).populate('hotelId');
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    // Check if room is available
    if (!room.availability) {
      return res.status(400).json({
        success: false,
        message: 'Room is not available'
      });
    }

    // Check max guests
    if (guests > room.maxGuests) {
      return res.status(400).json({
        success: false,
        message: `Room can accommodate maximum ${room.maxGuests} guests`
      });
    }

    // Check if dates are valid
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (checkInDate < today) {
      return res.status(400).json({
        success: false,
        message: 'Check-in date cannot be in the past'
      });
    }

    if (checkOutDate <= checkInDate) {
      return res.status(400).json({
        success: false,
        message: 'Check-out date must be after check-in date'
      });
    }

    // Check if room is already booked for these dates
    const overlappingBooking = await Booking.findOne({
      roomId,
      $or: [
        {
          checkIn: { $lte: checkOutDate },
          checkOut: { $gte: checkInDate }
        }
      ],
      paymentStatus: { $in: ['paid', 'pending'] },
      bookingStatus: { $nin: ['cancelled'] }
    });

    if (overlappingBooking) {
      return res.status(400).json({
        success: false,
        message: 'Room is already booked for these dates'
      });
    }

    // Calculate total price
    const numberOfNights = Math.ceil(
      (checkOutDate - checkInDate) / (1000 * 60 * 60 * 24)
    );
    const nightlyPrice = room.finalPrice || room.price;
    const totalPrice = nightlyPrice * numberOfNights;

    // Get cancellation and reschedule policies from hotel
    const cancellationPolicy = room.hotelId?.cancellationPolicy || {
      freeCancellationDays: 1,
      cancellationFee: 0,
      refundable: true
    };

    const reschedulePolicy = room.hotelId?.reschedulePolicy || {
      freeRescheduleDays: 3, // Default 3 days
      rescheduleFee: 0,
      allowed: true
    };

    // Create booking
    const booking = await Booking.create({
      userId: req.user.id,
      roomId,
      hotelId: room.hotelId._id,
      checkIn: checkInDate,
      checkOut: checkOutDate,
      guests,
      guestName: guestName || req.user.name,
      guestEmail: guestEmail || req.user.email,
      guestPhone: guestPhone || req.user.phone,
      specialRequests,
      totalPrice,
      paymentMethod: paymentMethod || 'vnpay',
      paymentStatus: 'pending',
      bookingStatus: 'pending', // 👈 cho khớp FE
      cancellationPolicy,
      reschedulePolicy
    });

    // Populate booking details
    await booking.populate('roomId hotelId userId');

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: booking
    });
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Get user bookings
// @route   GET /api/bookings
// @access  Private
exports.getMyBookings = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    let query = { userId: req.user.id };

    if (status) {
      query.bookingStatus = status;
    }

    const startIndex = (page - 1) * limit;

    const bookings = await Booking.find(query)
      .populate('roomId', 'name images price roomType')
      .populate('hotelId', 'name address city')
      .sort('-createdAt')
      .limit(Number(limit))
      .skip(startIndex)
      .lean();

    // Check if each booking has been reviewed
    const Review = require('../models/Review');
    const bookingsWithReviewStatus = await Promise.all(
      bookings.map(async (booking) => {
        const hasReview = await Review.findOne({
          bookingId: booking._id,
          userId: req.user.id
        });
        return {
          ...booking,
          hasReviewed: !!hasReview
        };
      })
    );

    const total = await Booking.countDocuments(query);

    res.status(200).json({
      success: true,
      count: bookings.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      data: bookingsWithReviewStatus
    });
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get single booking
// @route   GET /api/bookings/:id
// @access  Private
exports.getBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('roomId')
      .populate('hotelId')
      .populate('userId', 'name email phone');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Make sure user is booking owner or admin
    if (booking.userId._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this booking'
      });
    }

    res.status(200).json({
      success: true,
      data: booking
    });
  } catch (error) {
    console.error('Get booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Cancel booking
// @route   PUT /api/bookings/:id/cancel
// @access  Private
exports.cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('userId', 'name email phone');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Make sure user is booking owner
    if (booking.userId._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this booking'
      });
    }

    // Check if booking can be cancelled
    if (booking.bookingStatus === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Booking is already cancelled'
      });
    }

    if (booking.bookingStatus === 'checked-out') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel completed booking'
      });
    }

    // Check cancellation policy
    const now = new Date();
    const daysDiff = getDaysDiff(now, booking.checkIn);

    const freeCancellationDays =
      booking.cancellationPolicy?.freeCancellationDays || 1;

    if (daysDiff < freeCancellationDays) {
      return res.status(400).json({
        success: false,
        message: `Không thể hủy đặt phòng trong vòng ${freeCancellationDays} ngày trước ngày nhận phòng`
      });
    }

    booking.bookingStatus = 'cancelled';
    booking.cancelledAt = Date.now();
    booking.cancelReason = req.body.reason || 'Cancelled by user';

    if (booking.paymentStatus === 'paid') {
      booking.paymentStatus = 'refunded';
    }

    await booking.save();

    // Send cancellation email
    await sendBookingCancellation(booking, req.user);

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

// @desc    Update booking payment status
// @route   PUT /api/bookings/:id/payment
// @access  Private
exports.updatePaymentStatus = async (req, res) => {
  try {
    const { paymentStatus, paymentDetails } = req.body;

    const booking = await Booking.findById(req.params.id)
      .populate('userId', 'name email');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    booking.paymentStatus = paymentStatus;
    if (paymentDetails) {
      booking.paymentDetails = paymentDetails;
    }

    await booking.save();

    // Send confirmation email if payment is successful
    if (paymentStatus === 'paid') {
      await sendBookingConfirmation(booking, booking.userId);
    }

    res.status(200).json({
      success: true,
      message: 'Payment status updated successfully',
      data: booking
    });
  } catch (error) {
    console.error('Update payment status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get booking by code
// @route   GET /api/bookings/code/:code
// @access  Public
exports.getBookingByCode = async (req, res) => {
  try {
    const booking = await Booking.findOne({ bookingCode: req.params.code })
      .populate('roomId')
      .populate('hotelId')
      .populate('userId', 'name email phone');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    res.status(200).json({
      success: true,
      data: booking
    });
  } catch (error) {
    console.error('Get booking by code error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// ===================================================================
// @desc    Reschedule booking (change check-in / check-out)
// @route   PUT /api/bookings/:id/reschedule
// @access  Private
// ===================================================================
exports.rescheduleBooking = async (req, res) => {
  try {
    let { newCheckIn, newCheckOut } = req.body;

    if (!newCheckIn || !newCheckOut) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng chọn ngày nhận / trả phòng mới'
      });
    }

    newCheckIn = new Date(newCheckIn);
    newCheckOut = new Date(newCheckOut);

    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Quyền: chủ booking hoặc admin
    if (booking.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to reschedule this booking'
      });
    }

    if (booking.bookingStatus === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Booking has been cancelled, cannot reschedule'
      });
    }

    if (booking.bookingStatus === 'checked-out') {
      return res.status(400).json({
        success: false,
        message: 'Cannot reschedule completed booking'
      });
    }

    // Validate ngày mới
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (newCheckIn < today) {
      return res.status(400).json({
        success: false,
        message: 'Ngày nhận phòng mới phải từ hôm nay trở đi'
      });
    }

    if (newCheckOut <= newCheckIn) {
      return res.status(400).json({
        success: false,
        message: 'Ngày trả phòng phải sau ngày nhận phòng'
      });
    }

    // Chính sách đổi lịch trên booking (lấy từ khách sạn lúc tạo)
    const reschedulePolicy = booking.reschedulePolicy || {
      freeRescheduleDays: 3,
      rescheduleFee: 0,
      allowed: true
    };

    if (!reschedulePolicy.allowed) {
      return res.status(400).json({
        success: false,
        message: 'Khách sạn không cho phép đổi lịch đặt phòng'
      });
    }

    // Kiểm tra xem còn bao nhiêu ngày nữa đến ngày check-in cũ
    const daysBeforeOldCheckIn = getDaysDiff(today, booking.checkIn);
    const isFreeReschedule =
      daysBeforeOldCheckIn >= (reschedulePolicy.freeRescheduleDays || 3);

    // Kiểm tra trùng booking khác của cùng phòng ở ngày mới
    const overlapping = await Booking.findOne({
      _id: { $ne: booking._id },
      roomId: booking.roomId,
      checkIn: { $lt: newCheckOut },
      checkOut: { $gt: newCheckIn },
      paymentStatus: { $in: ['paid', 'pending'] },
      bookingStatus: { $nin: ['cancelled'] }
    });

    if (overlapping) {
      return res.status(400).json({
        success: false,
        message: 'Khoảng thời gian mới đã có booking khác, vui lòng chọn ngày khác'
      });
    }

    // Tính lại tổng tiền theo số đêm mới (dùng giá hiện tại của phòng)
    const room = await Room.findById(booking.roomId);
    const nightlyPrice = room ? (room.finalPrice || room.price) : booking.totalPrice;
    const nights = getDaysDiff(newCheckIn, newCheckOut);
    const newTotalPrice = nightlyPrice * nights;

    const oldCheckIn = booking.checkIn;
    const oldCheckOut = booking.checkOut;

    booking.checkIn = newCheckIn;
    booking.checkOut = newCheckOut;
    booking.totalPrice = newTotalPrice;
    booking.rescheduledAt = new Date();
    booking.rescheduleInfo = {
      oldCheckIn,
      oldCheckOut,
      newCheckIn,
      newCheckOut,
      isFreeReschedule,
      freeRescheduleDays: reschedulePolicy.freeRescheduleDays || 3,
      rescheduleFee: reschedulePolicy.rescheduleFee || 0
    };

    await booking.save();

    return res.status(200).json({
      success: true,
      message: isFreeReschedule
        ? 'Đổi lịch thành công (miễn phí).'
        : 'Đổi lịch thành công, có thể phát sinh phí theo chính sách khách sạn.',
      data: booking
    });
  } catch (error) {
    console.error('Reschedule booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

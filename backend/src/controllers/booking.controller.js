const Booking = require('../models/Booking');
const Room = require('../models/Room');
const Promotion = require('../models/promotion');
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
      paymentMethod,

      // 👇 các field khuyến mãi FE gửi lên (nếu có)
      promotionId,
      promotionCode,
      discountAmount
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

    // ================== TÍNH GIÁ & KHUYẾN MÃI ==================
    const numberOfNights = Math.ceil(
      (checkOutDate - checkInDate) / (1000 * 60 * 60 * 24)
    );
    const nightlyPrice = room.finalPrice || room.price;

    // Giá gốc trước khi giảm
    const originalTotal = nightlyPrice * numberOfNights;

    // Discount FE gửi lên (nếu đã apply mã trước đó)
    let appliedDiscount = 0;
    if (discountAmount && Number(discountAmount) > 0) {
      appliedDiscount = Number(discountAmount);
      if (appliedDiscount > originalTotal) {
        appliedDiscount = originalTotal; // không cho giảm âm
      }
    }

    // Tổng sau giảm
    const finalTotal = originalTotal - appliedDiscount;

    // Để không phá code cũ: totalPrice = finalTotal
    const totalPrice = finalTotal;
    // ================== HẾT PHẦN GIÁ & KHUYẾN MÃI ==================

    // Get cancellation and reschedule policies from hotel
    const cancellationPolicy = room.hotelId?.cancellationPolicy || {
      freeCancellationDays: 3,
      cancellationFee: 0,
      refundable: true
    };

    const reschedulePolicy = room.hotelId?.reschedulePolicy || {
      freeRescheduleDays: 3, // Default 3 days
      rescheduleFee: 10, // 10% phí đổi lịch
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

      // 💰 GIÁ & KHUYẾN MÃI
      totalPrice,            // giữ cho các chỗ cũ dùng được
      originalTotal,         // giá gốc
      discountAmount: appliedDiscount,
      finalTotal,            // giá sau giảm
      totalAmount: finalTotal, // Tổng tiền cuối cùng (ban đầu = finalTotal)
      paidAmount: 0,         // Chưa thanh toán
      promotionId: promotionId || null,
      promotionCode: promotionCode || null,

      paymentMethod: paymentMethod || 'vnpay',
      paymentStatus: 'pending',
      bookingStatus: 'pending', // 👈 cho khớp FE
      cancellationPolicy,
      reschedulePolicy
    });

    // Nếu có dùng promotionId → tăng usedCount
    if (promotionId) {
      await Promotion.findByIdAndUpdate(promotionId, {
        $inc: { usedCount: 1 }
      });
    }

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

    // Check if each booking has been reviewed and ensure totalAmount/paidAmount
    const Review = require('../models/Review');
    const bookingsWithReviewStatus = await Promise.all(
      bookings.map(async (booking) => {
        const hasReview = await Review.findOne({
          bookingId: booking._id,
          userId: req.user.id
        });
        
        // Đảm bảo totalAmount và paidAmount luôn có giá trị đúng
        // Nếu chưa có hoặc = 0, tính lại từ finalTotal/totalPrice
        let totalAmount = booking.totalAmount;
        let paidAmount = booking.paidAmount;
        
        // Nếu totalAmount chưa có hoặc = 0, dùng finalTotal hoặc totalPrice
        if (!totalAmount || totalAmount === 0) {
          totalAmount = booking.finalTotal || booking.totalPrice || 0;
        }
        
        // Xử lý paidAmount:
        // - Nếu paymentStatus = 'paid' và paidAmount chưa có, set paidAmount = totalAmount
        // - Nếu paymentStatus = 'refunded' và paidAmount chưa có, giữ nguyên totalAmount (đã hoàn tiền)
        // - Nếu paidAmount = null/undefined và paymentStatus = 'paid', set paidAmount = totalAmount
        if (paidAmount === null || paidAmount === undefined) {
          if (booking.paymentStatus === 'paid') {
            // Booking đã thanh toán nhưng paidAmount chưa có → set = totalAmount
            paidAmount = totalAmount;
          } else if (booking.paymentStatus === 'refunded') {
            // Booking đã hoàn tiền → paidAmount = totalAmount (đã trả đủ, sau đó hoàn lại)
            paidAmount = totalAmount;
          } else {
            // Chưa thanh toán
            paidAmount = 0;
          }
        }
        
        // Đảm bảo paidAmount không bao giờ > totalAmount
        if (paidAmount > totalAmount) {
          paidAmount = totalAmount;
        }
        
        // Đảm bảo paidAmount không bao giờ âm
        if (paidAmount < 0) {
          paidAmount = 0;
        }
        
        return {
          ...booking,
          hasReviewed: !!hasReview,
          totalAmount,
          paidAmount
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

    const freeCancellationDays = booking.cancellationPolicy?.freeCancellationDays || 3;

    // Tính phí hủy theo chính sách mới
    let cancellationFee = 0;
    let refundAmount = 0;
    let cancellationMessage = '';

    if (daysDiff >= freeCancellationDays) {
      // Hủy trước 3 ngày → miễn phí (hoàn tiền đầy đủ)
      cancellationFee = 0;
      refundAmount = booking.finalTotal || booking.totalPrice;
      cancellationMessage = 'Hủy miễn phí, hoàn tiền đầy đủ';
    } else {
      // Hủy trong vòng 3 ngày → Mất phí 50% và hoàn lại 50% tổng tiền đã thanh toán
      const totalPaid = booking.finalTotal || booking.totalPrice;
      cancellationFee = totalPaid * 0.5; // Mất phí 50%
      refundAmount = totalPaid * 0.5; // Hoàn lại 50%
      cancellationMessage = `Mất phí 50% (${cancellationFee.toLocaleString('vi-VN')} VNĐ). Hoàn lại 50%: ${refundAmount.toLocaleString('vi-VN')} VNĐ`;
    }

    booking.bookingStatus = 'cancelled';
    booking.cancelledAt = Date.now();
    booking.cancelReason = req.body.reason || 'Cancelled by user';
    booking.cancellationFee = cancellationFee;
    booking.refundAmount = refundAmount;

    if (booking.paymentStatus === 'paid') {
      booking.paymentStatus = refundAmount > 0 ? 'refunded' : 'cancelled';
    }

    await booking.save();

    // Send cancellation email
    await sendBookingCancellation(booking, req.user);

    res.status(200).json({
      success: true,
      message: cancellationMessage || 'Booking cancelled successfully',
      data: {
        ...booking.toObject(),
        cancellationFee,
        refundAmount
      }
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
    const freeRescheduleDays = reschedulePolicy.freeRescheduleDays || 3;
    const isFreeReschedule = daysBeforeOldCheckIn >= freeRescheduleDays;

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
    const pricePerNight = room ? (room.finalPrice || room.price) : (booking.originalTotal / Math.ceil((booking.checkOut - booking.checkIn) / (1000 * 60 * 60 * 24))) || booking.totalPrice;
    const oldNights = Math.ceil((booking.checkOut - booking.checkIn) / (1000 * 60 * 60 * 24));
    const newNights = getDaysDiff(newCheckIn, newCheckOut);
    
    // Tính theo công thức mới: Quy tắc A
    const roomBaseOld = booking.originalTotal || (pricePerNight * oldNights); // Giá gốc trước giảm
    const discount = booking.discountAmount || 0; // Số tiền giảm giá đã áp dụng
    const discountPercent = roomBaseOld > 0 ? (discount / roomBaseOld) * 100 : 0;
    
    const roomTotalNew = pricePerNight * newNights; // Giá phòng mới
    
    // Tính phí đổi lịch: changeFee = changeFeePercent% × roomBaseOld (tổng tiền phòng gốc)
    // changeFeePercent từ reschedulePolicy (mặc định 10%)
    const changeFeePercent = booking.reschedulePolicy?.rescheduleFee || 10;
    let changeFee = 0;
    
    if (isFreeReschedule) {
      // Đổi trước 3 ngày → miễn phí
      changeFee = 0;
    } else {
      // Đổi trong 3 ngày → thu phí theo % của roomBaseOld
      changeFee = roomBaseOld * (changeFeePercent / 100);
    }
    
    // Tổng mới: roomTotalNew + changeFee - discount
    const total = roomTotalNew + changeFee - discount;
    
    // Số tiền đã thanh toán: roomBaseOld - discount
    const alreadyPaid = roomBaseOld - discount;
    
    // Số tiền cần thanh toán thêm
    const extraToPay = total - alreadyPaid;
    
    // Tính chênh lệch giá (để hiển thị thông báo)
    const priceDifference = roomTotalNew - roomBaseOld;
    
    let rescheduleMessage = '';
    if (isFreeReschedule) {
      rescheduleMessage = 'Đổi lịch miễn phí';
    } else {
      rescheduleMessage = `Phí đổi lịch: ${changeFee.toLocaleString('vi-VN')} VNĐ (${changeFeePercent}% giá gốc)`;
    }
    
    if (extraToPay > 0) {
      rescheduleMessage += `. Tổng cần thanh toán thêm: ${extraToPay.toLocaleString('vi-VN')} VNĐ`;
    } else if (extraToPay < 0) {
      rescheduleMessage += `. Số tiền sẽ được hoàn lại: ${Math.abs(extraToPay).toLocaleString('vi-VN')} VNĐ`;
    }

    const oldCheckIn = booking.checkIn;
    const oldCheckOut = booking.checkOut;

    booking.checkIn = newCheckIn;
    booking.checkOut = newCheckOut;
    booking.totalPrice = roomTotalNew; // Giá phòng mới
    booking.finalTotal = total; // Tổng mới bao gồm phí đổi và trừ giảm giá
    booking.totalAmount = total; // Cập nhật tổng tiền cuối cùng
    // KHÔNG cập nhật paidAmount - giữ nguyên số tiền đã thanh toán trước đó
    // Đảm bảo paidAmount không bao giờ > totalAmount
    if (booking.paidAmount > total) {
      booking.paidAmount = total;
    }
    booking.rescheduledAt = new Date();
    booking.rescheduleInfo = {
      oldCheckIn,
      oldCheckOut,
      newCheckIn,
      newCheckOut,
      isFreeReschedule,
      freeRescheduleDays,
      rescheduleFee: changeFee, // Giữ tên cũ để tương thích
      changeFee, // Tên mới
      priceDifference,
      additionalPayment: extraToPay > 0 ? extraToPay : 0, // Giữ tên cũ để tương thích
      extraToPay, // Tên mới
      oldTotalPrice: roomBaseOld,
      newTotalPrice: roomTotalNew,
      roomBaseOld,
      roomTotalNew,
      discount,
      discountPercent,
      total,
      alreadyPaid
    };

    // Lưu thông tin payment pending cho reschedule nếu có tiền cần thanh toán
    if (extraToPay > 0) {
      booking.reschedulePayment = {
        amount: extraToPay,
        status: 'pending',
        createdAt: new Date()
      };
    } else {
      // Nếu không có tiền cần thanh toán, xóa reschedulePayment
      booking.reschedulePayment = null;
    }

    await booking.save();

    return res.status(200).json({
      success: true,
      message: rescheduleMessage || 'Đổi lịch thành công',
      data: {
        ...booking.toObject(),
        rescheduleFee: changeFee, // Giữ tên cũ để tương thích
        changeFee, // Tên mới
        priceDifference,
        additionalPayment: extraToPay > 0 ? extraToPay : 0, // Giữ tên cũ để tương thích
        extraToPay, // Tên mới
        refundAmount: extraToPay < 0 ? Math.abs(extraToPay) : 0
      }
    });
  } catch (error) {
    console.error('Reschedule booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

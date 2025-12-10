const Settlement = require('../models/Settlement');
const Booking = require('../models/Booking');
const Hotel = require('../models/Hotel');

// @desc    Get all settlements (Admin)
// @route   GET /api/admin/settlements
// @access  Private/Admin
exports.getSettlements = async (req, res) => {
  try {
    const { status, hotelId, page = 1, limit = 10 } = req.query;
    const query = {};

    if (status) {
      query.status = status;
    }

    if (hotelId) {
      query.hotelId = hotelId;
    }

    const settlements = await Settlement.find(query)
      .populate('hotelId', 'name address city')
      .populate('processedBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Settlement.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        settlements,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get settlements error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get single settlement
// @route   GET /api/admin/settlements/:id
// @access  Private/Admin
exports.getSettlement = async (req, res) => {
  try {
    const settlement = await Settlement.findById(req.params.id)
      .populate('hotelId', 'name address city phone email')
      .populate('bookings')
      .populate('processedBy', 'name email');

    if (!settlement) {
      return res.status(404).json({
        success: false,
        message: 'Settlement not found'
      });
    }

    res.status(200).json({
      success: true,
      data: settlement
    });
  } catch (error) {
    console.error('Get settlement error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Create settlement for a hotel (Admin)
// @route   POST /api/admin/settlements/create
// @access  Private/Admin
exports.createSettlement = async (req, res) => {
  try {
    const { hotelId, startDate, endDate } = req.body;

    if (!hotelId || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Hotel ID, start date and end date are required'
      });
    }

    const hotel = await Hotel.findById(hotelId);
    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: 'Hotel not found'
      });
    }

    // Tìm tất cả bookings đã thanh toán trong kỳ này và chưa được settlement
    // Tìm theo createdAt (ngày tạo booking) thay vì checkOut để khớp với dashboard
    // Chấp nhận cả booking đã check-out hoặc đã confirmed/checked-in nhưng đã thanh toán
    const startDateObj = new Date(startDate);
    startDateObj.setHours(0, 0, 0, 0);
    const endDateObj = new Date(endDate);
    endDateObj.setHours(23, 59, 59, 999);

    const bookings = await Booking.find({
      hotelId,
      paymentStatus: 'paid',
      bookingStatus: { $ne: 'cancelled' }, // Loại trừ booking đã hủy
      $or: [
        { 'settlement.status': { $exists: false } }, // Chưa có settlement
        { 'settlement.status': 'pending' } // Hoặc settlement status là pending
      ],
      createdAt: {
        $gte: startDateObj,
        $lte: endDateObj
      }
    });

    if (bookings.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Không tìm thấy booking nào trong khoảng thời gian này. Vui lòng kiểm tra lại ngày bắt đầu và ngày kết thúc.'
      });
    }

    // Tính tổng
    let totalAmount = 0;
    let commissionAmount = 0;

    // Lấy hotel để lấy commissionRate
    const hotelForCommission = await Hotel.findById(hotelId);
    const defaultCommissionRate = hotelForCommission?.commissionRate || 15;
    const { calculateCommission } = require('../utils/commission.utils');

    bookings.forEach(booking => {
      let commission = booking.commission?.amount || 0;
      let settlementAmount = 0;

      // Nếu booking chưa có commission, tính lại commission
      if (!commission || commission === 0) {
        const originalTotal = booking.originalTotal || booking.totalPrice || 0;
        if (originalTotal > 0) {
          // Tính commission dựa trên originalTotal
          const { commission: calculatedCommission, settlement: calculatedSettlement } = 
            calculateCommission(originalTotal, defaultCommissionRate);
          
          commission = calculatedCommission;
          settlementAmount = calculatedSettlement;
          
          // Cập nhật lại booking với commission và settlement (nếu booking đã paid)
          if (booking.paymentStatus === 'paid') {
            booking.commission = {
              amount: commission,
              rate: defaultCommissionRate,
              calculatedAt: new Date()
            };
            booking.settlement = {
              amount: settlementAmount,
              status: booking.settlement?.status || 'pending'
            };
            // Lưu lại booking đã cập nhật (async, không cần await)
            booking.save().catch(err => console.error('Error updating booking commission:', err));
          }
        }
      } else {
        // Nếu đã có commission, dùng settlement.amount hoặc tính từ originalTotal - commission
        if (booking.settlement && booking.settlement.amount > 0) {
          settlementAmount = booking.settlement.amount;
        } else {
          const originalTotal = booking.originalTotal || booking.totalPrice || 0;
          settlementAmount = originalTotal - commission;
        }
      }
      
      totalAmount += settlementAmount;
      commissionAmount += commission;
    });

    // Kiểm tra xem đã có settlement cho kỳ này chưa
    const existingSettlement = await Settlement.findOne({
      hotelId,
      'period.startDate': new Date(startDate),
      'period.endDate': new Date(endDate)
    });

    if (existingSettlement) {
      return res.status(400).json({
        success: false,
        message: 'Đã tồn tại thanh toán cho kỳ này. Vui lòng chọn khoảng thời gian khác.'
      });
    }

    // Convert hotelId to ObjectId để đảm bảo lưu đúng format
    const mongoose = require('mongoose');
    const hotelObjectIdForSettlement = new mongoose.Types.ObjectId(hotelId);

    // Tạo settlement
    const settlement = await Settlement.create({
      hotelId: hotelObjectIdForSettlement,
      period: {
        startDate: new Date(startDate),
        endDate: new Date(endDate)
      },
      bookings: bookings.map(b => b._id),
      totalAmount,
      commissionAmount,
      status: 'pending'
    });

    console.log('✅ Settlement created:', {
      settlementId: settlement._id,
      hotelId: settlement.hotelId?.toString(),
      hotelIdType: typeof settlement.hotelId,
      totalAmount: settlement.totalAmount,
      bookingsCount: settlement.bookings.length
    });

    // Cập nhật status của bookings sang 'processing'
    await Booking.updateMany(
      { _id: { $in: bookings.map(b => b._id) } },
      { 'settlement.status': 'processing' }
    );

    // Populate settlement để trả về đầy đủ thông tin
    await settlement.populate('hotelId', 'name address city');

    res.status(201).json({
      success: true,
      message: 'Settlement created successfully',
      data: settlement
    });
  } catch (error) {
    console.error('Create settlement error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Pay settlement (Admin)
// @route   PUT /api/admin/settlements/:id/pay
// @access  Private/Admin
exports.paySettlement = async (req, res) => {
  try {
    const { transactionId, notes } = req.body;

    const settlement = await Settlement.findById(req.params.id);

    if (!settlement) {
      return res.status(404).json({
        success: false,
        message: 'Settlement not found'
      });
    }

    if (settlement.status === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Settlement has already been paid'
      });
    }

    // Cập nhật settlement
    settlement.status = 'paid';
    settlement.paidAt = new Date();
    settlement.transactionId = transactionId || null;
    settlement.notes = notes || null;
    settlement.processedBy = req.user.id;

    await settlement.save();

    // Cập nhật status của bookings sang 'paid'
    await Booking.updateMany(
      { _id: { $in: settlement.bookings } },
      { 'settlement.status': 'paid', 'settlement.paidAt': new Date(), 'settlement.transactionId': transactionId }
    );

    res.status(200).json({
      success: true,
      message: 'Settlement paid successfully',
      data: settlement
    });
  } catch (error) {
    console.error('Pay settlement error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get manager's settlements
// @route   GET /api/manager/settlements
// @access  Private/Manager
exports.getManagerSettlements = async (req, res) => {
  try {
    const hotelId = req.user.hotelId;

    if (!hotelId) {
      return res.status(400).json({
        success: false,
        message: 'Manager is not assigned to any hotel'
      });
    }

    const { status, page = 1, limit = 10 } = req.query;
    const query = { hotelId: hotelId };

    if (status && status !== '') {
      query.status = status;
    }

    const settlements = await Settlement.find(query)
      .populate('hotelId', 'name address city')
      .populate('bookings')
      .populate('processedBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Settlement.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        settlements,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('❌ Get manager settlements error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// @desc    Get manager's pending settlement amount
// @route   GET /api/manager/settlements/pending
// @access  Private/Manager
exports.getPendingSettlement = async (req, res) => {
  try {
    const hotelId = req.user.hotelId;

    if (!hotelId) {
      return res.status(400).json({
        success: false,
        message: 'Manager is not assigned to any hotel'
      });
    }

    // Convert hotelId to ObjectId để đảm bảo query đúng
    const mongoose = require('mongoose');
    let hotelObjectId;
    
    // Xử lý cả trường hợp hotelId là string hoặc ObjectId
    if (mongoose.Types.ObjectId.isValid(hotelId)) {
      hotelObjectId = new mongoose.Types.ObjectId(hotelId);
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid hotel ID format'
      });
    }

    // Tính tổng số tiền đang chờ thanh toán
    // Bao gồm:
    // 1. Bookings có settlement.status = 'pending' (chưa được tạo settlement)
    // 2. Bookings có settlement.status = 'processing' (đã được tạo settlement nhưng chưa thanh toán)
    const bookings = await Booking.find({
      hotelId: hotelObjectId,
      paymentStatus: 'paid',
      bookingStatus: { $ne: 'cancelled' }, // Loại trừ booking đã hủy
      $or: [
        { 'settlement.status': 'pending' },
        { 'settlement.status': 'processing' },
        { 'settlement.status': { $exists: false } } // Chưa có settlement
      ]
    });

    let totalPending = 0;
    bookings.forEach(booking => {
      if (booking.settlement && booking.settlement.amount > 0) {
        totalPending += booking.settlement.amount;
      } else if (booking.originalTotal) {
        // Nếu chưa có settlement.amount, tính từ originalTotal - commission
        const commission = booking.commission?.amount || 0;
        const settlementAmount = booking.originalTotal - commission;
        totalPending += settlementAmount;
      }
    });

    console.log('💰 Pending settlement calculated:', {
      managerId: req.user._id,
      hotelId: hotelObjectId.toString(),
      totalPending,
      bookingCount: bookings.length
    });

    res.status(200).json({
      success: true,
      data: {
        totalPending,
        bookingCount: bookings.length
      }
    });
  } catch (error) {
    console.error('❌ Get pending settlement error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};


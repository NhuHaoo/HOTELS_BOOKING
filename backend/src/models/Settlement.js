const mongoose = require('mongoose');

const settlementSchema = new mongoose.Schema({
  hotelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hotel',
    required: true,
    index: true
  },
  // Kỳ thanh toán
  period: {
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    }
  },
  // Danh sách bookings trong kỳ này
  bookings: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking'
  }],
  // Tổng số tiền cần trả cho khách sạn
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  // Tổng commission hệ thống lấy
  commissionAmount: {
    type: Number,
    required: true,
    min: 0
  },
  // Trạng thái thanh toán
  status: {
    type: String,
    enum: ['pending', 'processing', 'paid', 'cancelled'],
    default: 'pending',
    index: true
  },
  // Thông tin thanh toán
  paidAt: Date,
  transactionId: String, // Mã giao dịch chuyển khoản
  notes: String, // Ghi chú
  // Người xử lý
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for better query performance
settlementSchema.index({ hotelId: 1, status: 1 });
settlementSchema.index({ 'period.startDate': 1, 'period.endDate': 1 });
settlementSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Settlement', settlementSchema);


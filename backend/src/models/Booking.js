const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  roomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: [true, 'Room ID is required']
  },
  hotelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hotel',
    required: false
  },
  checkIn: {
    type: Date,
    required: [true, 'Check-in date is required']
  },
  checkOut: {
    type: Date,
    required: [true, 'Check-out date is required']
  },
  guests: {
    type: Number,
    required: [true, 'Number of guests is required'],
    min: 1
  },
  adults: {
    type: Number,
    required: false,
    min: 1,
    default: 1
  },
  children: {
    type: Number,
    required: false,
    min: 0,
    default: 0
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'cancelled', 'refunded'],
    default: 'pending'
  },
  totalPrice: {
    type: Number,
    required: [true, 'Total price is required'],
    min: 0
  },
  paymentMethod: {
    type: String,
    enum: ['vnpay', 'cash', 'card'],
    default: 'vnpay'
  },
  bookingCode: {
    type: String,
    required: false
  },
  guestName: {
    type: String,
    required: true
  },
  guestEmail: {
    type: String,
    required: true
  },
  guestPhone: {
    type: String,
    required: true
  },
  specialRequests: {
    type: String
  },

  // 🔧 SỬA Ở ĐÂY
  bookingStatus: {
    type: String,
    enum: [
      'pending',      // ✅ thêm trạng thái chờ
      'confirmed',
      'checked-in',
      'checked-out',
      'cancelled',
      'no-show'
    ],
    default: 'pending' // ✅ default khớp với createBooking & FE
  },

  paymentDetails: {
    transactionId: String,
    paymentDate: Date,
    bankCode: String,
    cardType: String
  },
  cancelledAt: {
    type: Date
  },
  cancelReason: {
    type: String
  },
  cancellationPolicy: {
    freeCancellationDays: {
      type: Number,
      default: 1
    },
    cancellationFee: {
      type: Number,
      default: 0
    },
    refundable: {
      type: Boolean,
      default: true
    }
  },
  reschedulePolicy: {
    freeRescheduleDays: {
      type: Number,
      default: 3 // Số ngày trước check-in được dời lịch miễn phí
    },
    rescheduleFee: {
      type: Number,
      default: 0
    },
    allowed: {
      type: Boolean,
      default: true
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Generate unique booking code
bookingSchema.pre('save', function(next) {
  if (!this.bookingCode) {
    this.bookingCode =
      'BK' +
      Date.now() +
      Math.random().toString(36).substr(2, 9).toUpperCase();
  }
  next();
});

// Calculate number of nights
bookingSchema.virtual('numberOfNights').get(function() {
  return Math.ceil((this.checkOut - this.checkIn) / (1000 * 60 * 60 * 24));
});

// Index for better query performance
bookingSchema.index({ userId: 1, createdAt: -1 });
bookingSchema.index({ bookingCode: 1 });
bookingSchema.index({ paymentStatus: 1 });

module.exports = mongoose.model('Booking', bookingSchema);

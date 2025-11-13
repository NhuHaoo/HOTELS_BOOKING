const mongoose = require('mongoose');

const hotelSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Hotel name is required'],
    trim: true
  },
  address: {
    type: String,
    required: [true, 'Address is required']
  },
  city: {
    type: String,
    required: [true, 'City is required'],
    index: true
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: true,
      index: '2dsphere'
    }
  },
  description: {
    type: String,
    required: [true, 'Description is required']
  },
  introduction: {
    type: String,
    default: ''
  },
  hotelType: {
    type: String,
    enum: ['hotel', 'resort', 'apartment', 'villa', 'hostel', 'motel'],
    default: 'hotel'
  },
  starRating: {
    type: Number,
    min: 1,
    max: 5,
    default: 3
  },
  images: [{
    type: String
  }],
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  cancellationPolicy: {
    freeCancellationDays: {
      type: Number,
      default: 1 // Số ngày trước check-in được hủy miễn phí
    },
    cancellationFee: {
      type: Number,
      default: 0 // Phí hủy (%)
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
      default: 0 // Phí dời lịch (%)
    },
    allowed: {
      type: Boolean,
      default: true
    }
  },
  amenities: [{
    type: String
  }],
  rooms: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room'
  }],
  phone: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  website: {
    type: String
  },
  checkInTime: {
    type: String,
    default: '14:00'
  },
  checkOutTime: {
    type: String,
    default: '12:00'
  },
  totalReviews: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for totalRooms
hotelSchema.virtual('totalRooms').get(function() {
  return this.rooms ? this.rooms.length : 0;
});

// Create geospatial index
hotelSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Hotel', hotelSchema);


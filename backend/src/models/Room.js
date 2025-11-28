const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  hotelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hotel',
    required: [true, 'Hotel ID is required']
  },
  name: {
    type: String,
    required: [true, 'Room name is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Description is required']
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: 0
  },
  images: [{ type: String }],
  amenities: [{ type: String }],
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  availability: {
    type: Boolean,
    default: true
  },

  // 🌟 SỨC CHỨA
  maxAdults: {
    type: Number,
    required: false,
    min: 1,
    default: 2
  },
  maxChildren: {
    type: Number,
    required: false,
    min: 0,
    default: 0
  },
  // tổng sức chứa = NL + TE (dùng để filter fallback)
  maxGuests: {
    type: Number,
    min: 1
  },

  roomType: {
    type: String,
    enum: ['single', 'double', 'suite', 'deluxe', 'family', 'presidential', 'standard'],
    default: 'single',
    set: v => v.toLowerCase()
  },

  size: {
    type: Number
  },

  bedType: {
    type: String,
    enum: ['single', 'double', 'queen', 'king'],
    default: 'double',
    set: v => v.toLowerCase()
  },

  numberOfBeds: {
    type: Number,
    default: 1
  },

  view: {
    type: String,
    enum: ['city', 'ocean', 'mountain', 'garden', 'pool'],
    default: 'city',
    set: v => v.toLowerCase()
  },

  floor: {
    type: Number
  },

  totalReviews: {
    type: Number,
    default: 0
  },

  isActive: {
    type: Boolean,
    default: true
  },

  discount: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
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

// Indexes tối ưu
roomSchema.index({ hotelId: 1, price: 1 });
roomSchema.index({ rating: -1 });
roomSchema.index({ price: 1 });

// Virtual price after discount
roomSchema.virtual('finalPrice').get(function() {
  return this.price * (1 - this.discount / 100);
});

// 🔁 Tự tính maxGuests mỗi lần save
roomSchema.pre('save', function (next) {
  const adults = this.maxAdults || 0;
  const children = this.maxChildren || 0;
  if (adults + children > 0) {
    this.maxGuests = adults + children;
  }
  next();
});

module.exports = mongoose.model('Room', roomSchema);

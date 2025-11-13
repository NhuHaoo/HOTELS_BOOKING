const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
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
    ref: 'Hotel'
  },
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking'
  },
  rating: {
    type: Number,
    required: [true, 'Rating is required'],
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    required: [true, 'Comment is required'],
    minlength: 10,
    maxlength: 1000
  },
  images: [{
    type: String
  }],
  cleanliness: {
    type: Number,
    min: 1,
    max: 5
  },
  comfort: {
    type: Number,
    min: 1,
    max: 5
  },
  location: {
    type: Number,
    min: 1,
    max: 5
  },
  service: {
    type: Number,
    min: 1,
    max: 5
  },
  valueForMoney: {
    type: Number,
    min: 1,
    max: 5
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  helpfulCount: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// One review per user per room
reviewSchema.index({ userId: 1, roomId: 1 }, { unique: true });

// Update room rating after review is saved
reviewSchema.post('save', async function() {
  const Room = mongoose.model('Room');
  const Review = mongoose.model('Review');
  
  const stats = await Review.aggregate([
    { $match: { roomId: this.roomId } },
    {
      $group: {
        _id: '$roomId',
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 }
      }
    }
  ]);

  if (stats.length > 0) {
    await Room.findByIdAndUpdate(this.roomId, {
      rating: Math.round(stats[0].averageRating * 10) / 10,
      totalReviews: stats[0].totalReviews
    });
  }
});

// Update room rating after review is deleted
reviewSchema.post('remove', async function() {
  const Room = mongoose.model('Room');
  const Review = mongoose.model('Review');
  
  const stats = await Review.aggregate([
    { $match: { roomId: this.roomId } },
    {
      $group: {
        _id: '$roomId',
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 }
      }
    }
  ]);

  if (stats.length > 0) {
    await Room.findByIdAndUpdate(this.roomId, {
      rating: Math.round(stats[0].averageRating * 10) / 10,
      totalReviews: stats[0].totalReviews
    });
  } else {
    await Room.findByIdAndUpdate(this.roomId, {
      rating: 0,
      totalReviews: 0
    });
  }
});

module.exports = mongoose.model('Review', reviewSchema);


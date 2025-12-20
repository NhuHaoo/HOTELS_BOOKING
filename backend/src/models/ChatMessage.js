const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  messages: [
    {
      type: {
        type: String,
        enum: ['user', 'bot', 'error'],
        required: true
      },
      text: {
        type: String,
        required: true
      },
      timestamp: {
        type: Date,
        default: Date.now
      },
      functionCalled: {
        type: String,
        default: null
      },
      functionResult: {
        type: mongoose.Schema.Types.Mixed,
        default: null
      }
    }
  ],
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for faster queries
chatMessageSchema.index({ userId: 1, updatedAt: -1 });

module.exports = mongoose.model('ChatMessage', chatMessageSchema);


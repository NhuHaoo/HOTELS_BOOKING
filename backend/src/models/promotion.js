const mongoose = require('mongoose');

const promotionSchema = new mongoose.Schema(
  {
    // Loại khuyến mãi: 'coupon' (mã giảm giá), 'seasonal' (theo mùa), 'duration' (theo số đêm)
    type: {
      type: String,
      enum: ['coupon', 'seasonal', 'duration'],
      default: 'coupon',
    },

    // Mã giảm giá: SUMMER20, NEWUSER10... (dùng cho type = 'coupon')
    code: {
      type: String,
      trim: true,
      uppercase: true,
      unique: true,
      sparse: true, // cho phép null nếu là seasonal/duration
    },

    // Tên chương trình khuyến mãi
    name: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
    },

    // Giảm theo phần trăm hay số tiền cố định
    discountType: {
      type: String,
      enum: ['percent', 'fixed'],
      default: 'percent',
    },

    // Giá trị giảm:
    // - nếu percent => 10, 20 (tức 10%, 20%)
    // - nếu fixed => số tiền VND (100000 = 100k)
    discountValue: {
      type: Number,
      required: true,
      min: 0,
    },

    // Đơn tối thiểu để áp dụng (VND)
    minOrderAmount: {
      type: Number,
      default: 0,
    },

    // Thời gian hiệu lực
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },

    // Giới hạn số lần dùng (ví dụ: 100 lần)
    usageLimit: {
      type: Number,
      default: null, // null = không giới hạn
    },
    usedCount: {
      type: Number,
      default: 0,
    },

    // Chỉ áp dụng cho khách mới?
    forNewUserOnly: {
      type: Boolean,
      default: false,
    },

    // 👉 Áp dụng cho đâu?
    // - global: toàn hệ thống
    // - hotel: 1 khách sạn
    // - room: 1 phòng cụ thể
    applyType: {
      type: String,
      enum: ['global', 'hotel', 'room'],
      default: 'global',
    },

    // Nếu applyType = 'hotel' -> áp dụng cho tất cả phòng của hotel này
    hotelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hotel',
      default: null,
    },

    // Nếu applyType = 'room' -> chỉ áp dụng cho 1 phòng cụ thể
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
      default: null,
    },

    // 👉 Dùng cho type = 'duration' (khuyến mãi theo số đêm)
    // Ví dụ: từ 3 đêm -> giảm 5%
    minNights: {
      type: Number,
      default: 0,
    },

    // (tuỳ chọn) tối đa số đêm, nếu có
    maxNights: {
      type: Number,
      default: null, // null = không giới hạn
    },

    // Bật/tắt khuyến mãi
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Index để query theo hotel/room nhanh hơn
promotionSchema.index({ applyType: 1, hotelId: 1 });
promotionSchema.index({ applyType: 1, roomId: 1 });
promotionSchema.index({ type: 1, isActive: 1, startDate: 1, endDate: 1 });

// Dùng lại model nếu đã compile để tránh OverwriteModelError
module.exports =
  mongoose.models.Promotion || mongoose.model('Promotion', promotionSchema);

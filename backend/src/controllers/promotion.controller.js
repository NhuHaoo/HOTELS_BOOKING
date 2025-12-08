// backend/src/controllers/promotion.controller.js
const Promotion = require('../models/promotion');

/* ---------------------------------------------------
    HELPER: TÍNH GIẢM GIÁ
--------------------------------------------------- */
function calcDiscountAmount(promo, totalAmount) {
  let discount = 0;

  if (promo.discountType === 'percent') {
    discount = Math.round((Number(totalAmount) * promo.discountValue) / 100);
  } else {
    discount = promo.discountValue;
  }

  if (discount < 0) discount = 0;
  if (discount > totalAmount) discount = totalAmount;
  return discount;
}

/* ---------------------------------------------------
    GET ALL PROMOTIONS (ADMIN)
--------------------------------------------------- */
exports.getPromotions = async (req, res) => {
  try {
    const promotions = await Promotion.find()
      .populate('hotelId', 'name city')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: promotions.length,
      data: promotions,
    });
  } catch (error) {
    console.error('getPromotions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

/* ---------------------------------------------------
    GET ONE PROMOTION
--------------------------------------------------- */
exports.getPromotion = async (req, res) => {
  try {
    const promotion = await Promotion.findById(req.params.id)
      .populate('hotelId', 'name city');

    if (!promotion) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy khuyến mãi',
      });
    }

    res.status(200).json({
      success: true,
      data: promotion,
    });
  } catch (error) {
    console.error('getPromotion error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

/* ---------------------------------------------------
    CREATE PROMOTION
--------------------------------------------------- */
exports.createPromotion = async (req, res) => {
  try {
    const data = { ...req.body };

    if (data.code) data.code = data.code.toUpperCase();

    // Check trùng mã (nếu là coupon)
    if (data.type === 'coupon' && data.code) {
      const existed = await Promotion.findOne({ code: data.code });
      if (existed) {
        return res.status(400).json({
          success: false,
          message: 'Mã khuyến mãi đã tồn tại',
        });
      }
    }

    /* ---------------------------
        Validate applyType
    --------------------------- */
    if (!data.applyType) data.applyType = 'global';

    if (data.applyType === 'global') {
      data.hotelId = null;
      data.roomId = null;
    }

    if (data.applyType === 'hotel') {
      if (!data.hotelId || (Array.isArray(data.hotelId) && data.hotelId.length === 0)) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng chọn ít nhất một khách sạn áp dụng',
        });
      }
      // Đảm bảo hotelId là array nếu có nhiều hơn 1
      if (!Array.isArray(data.hotelId) && data.hotelId) {
        data.hotelId = [data.hotelId];
      }
      data.roomId = null;
    }

    if (data.applyType === 'room') {
      if (!data.roomId) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng chọn phòng áp dụng',
        });
      }
    }

    const promotion = await Promotion.create(data);

    res.status(201).json({
      success: true,
      data: promotion,
    });
  } catch (error) {
    console.error('createPromotion error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

/* ---------------------------------------------------
    UPDATE PROMOTION
--------------------------------------------------- */
exports.updatePromotion = async (req, res) => {
  try {
    const data = { ...req.body };
    if (data.code) data.code = data.code.toUpperCase();

    // Validate applyType nếu FE gửi lên
    if (data.applyType) {
      if (data.applyType === 'global') {
        data.hotelId = null;
        data.roomId = null;
      } else if (data.applyType === 'hotel') {
        if (!data.hotelId || (Array.isArray(data.hotelId) && data.hotelId.length === 0)) {
          return res.status(400).json({
            success: false,
            message: 'Vui lòng chọn ít nhất một khách sạn áp dụng',
          });
        }
        // Đảm bảo hotelId là array nếu có nhiều hơn 1
        if (!Array.isArray(data.hotelId) && data.hotelId) {
          data.hotelId = [data.hotelId];
        }
        data.roomId = null;
      } else if (data.applyType === 'room') {
        if (!data.roomId) {
          return res.status(400).json({
            success: false,
            message: 'Vui lòng chọn phòng áp dụng',
          });
        }
      }
    }

    const promotion = await Promotion.findByIdAndUpdate(
      req.params.id,
      data,
      { new: true, runValidators: true }
    );

    if (!promotion) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy khuyến mãi',
      });
    }

    res.status(200).json({
      success: true,
      data: promotion,
    });
  } catch (error) {
    console.error('updatePromotion error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

/* ---------------------------------------------------
    DELETE PROMOTION
--------------------------------------------------- */
exports.deletePromotion = async (req, res) => {
  try {
    const promotion = await Promotion.findByIdAndDelete(req.params.id);

    if (!promotion) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy khuyến mãi',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Đã xoá khuyến mãi',
    });
  } catch (error) {
    console.error('deletePromotion error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

/* ---------------------------------------------------
    APPLY COUPON CODE
--------------------------------------------------- */
exports.applyCouponCode = async (req, res) => {
  try {
    const { code, totalAmount } = req.body;
    const now = new Date();

    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập mã khuyến mãi',
      });
    }

    if (!totalAmount || Number(totalAmount) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Tổng tiền không hợp lệ',
      });
    }

    const promotion = await Promotion.findOne({
      code: code.toUpperCase(),
      type: 'coupon',
    });

    if (!promotion) {
      return res.status(404).json({
        success: false,
        message: 'Mã khuyến mãi không tồn tại',
      });
    }

    if (!promotion.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Mã khuyến mãi đang tạm ngưng',
      });
    }

    if (now < promotion.startDate || now > promotion.endDate) {
      return res.status(400).json({
        success: false,
        message: 'Mã khuyến mãi đã hết hạn hoặc chưa bắt đầu',
      });
    }

    if (promotion.usageLimit && promotion.usedCount >= promotion.usageLimit) {
      return res.status(400).json({
        success: false,
        message: 'Mã khuyến mãi đã được sử dụng tối đa',
      });
    }

    if (totalAmount < promotion.minOrderAmount) {
  return res.status(400).json({
    success: false,
    message: `Đơn tối thiểu để áp dụng mã là ${promotion.minOrderAmount.toLocaleString()} đ`,
  });
}

    const discount = calcDiscountAmount(promotion, totalAmount);
    const finalAmount = Math.max(0, totalAmount - discount);

    return res.status(200).json({
      success: true,
      promotionId: promotion._id,
      code: promotion.code,
      discount,
      finalAmount,
      message: `Áp dụng mã thành công, giảm ${discount.toLocaleString()} đ`,
    });
  } catch (error) {
    console.error('applyCouponCode error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

/* ---------------------------------------------------
    GET ACTIVE COUPONS (PUBLIC)
--------------------------------------------------- */
exports.getActiveCouponsPublic = async (req, res) => {
  try {
    const now = new Date();

    const promotions = await Promotion.find({
      type: 'coupon',
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now },
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: promotions,
    });
  } catch (error) {
    console.error('getActiveCouponsPublic error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

/* ---------------------------------------------------
    GET HOTTEST PROMOTION
--------------------------------------------------- */
exports.getHotPromotion = async (req, res) => {
  try {
    const now = new Date();

    const promos = await Promotion.find({
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now },
    });

    if (!promos || promos.length === 0) {
      return res.status(200).json({
        success: true,
        promotion: null,
      });
    }

    const sorted = promos.sort((a, b) => {
      const valueA =
        a.discountType === 'percent' ? a.discountValue * 1000 : a.discountValue;
      const valueB =
        b.discountType === 'percent' ? b.discountValue * 1000 : b.discountValue;
      return valueB - valueA;
    });

    const bestPromo = sorted[0];

    return res.status(200).json({
      success: true,
      promotion: bestPromo,
    });
  } catch (error) {
    console.error('getHotPromotion error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

const express = require('express');
const router = express.Router();

const {
  getPromotions,
  getPromotion,
  createPromotion,
  updatePromotion,
  deletePromotion,
  applyCouponCode,
  getActiveCouponsPublic,
  getHotPromotion, 
} = require('../controllers/promotion.controller');

const { protect } = require('../middlewares/auth.middleware');
const { isAdmin } = require('../middlewares/role.middleware');

// Public: lấy danh sách coupon đang hoạt động
router.get('/active-coupons', getActiveCouponsPublic);

// Admin quản lý khuyến mãi
router.get('/', protect, isAdmin, getPromotions);
router.get('/:id', protect, isAdmin, getPromotion);
router.post('/', protect, isAdmin, createPromotion);
router.put('/:id', protect, isAdmin, updatePromotion);
router.delete('/:id', protect, isAdmin, deletePromotion);
router.get('/hot', getHotPromotion);


// Public: áp dụng mã giảm giá
router.post('/apply', applyCouponCode);

module.exports = router;

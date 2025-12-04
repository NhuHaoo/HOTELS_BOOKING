// frontend/src/api/promotion.api.js
import axios from 'axios';

export const promotionAPI = {
  // Áp dụng coupon
  applyCoupon: ({ code, totalAmount }) =>
    axios.post('/api/promotions/apply', { code, totalAmount }),

  // Lấy toàn bộ khuyến mãi (admin)
  getAll: () => axios.get('/api/promotions'),

  // Public: các coupon đang hoạt động
  getActiveCoupons: () => axios.get('/api/promotions/active-coupons'),

  // Lấy khuyến mãi hot nhất
  getHotPromotion: () => axios.get('/api/promotions/hot'),
};

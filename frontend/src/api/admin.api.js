// frontend/src/api/admin.api.js
import axiosClient from './axiosClient';

export const adminAPI = {
  // ======================
  // DASHBOARD & ANALYTICS
  // ======================

  // Dashboard – nhận params để lọc (hotelId, startDate, endDate, ...)
  getDashboard: (params = {}) => {
    return axiosClient.get('/admin/dashboard', { params });
  },

  // Thống kê doanh thu (đã có sẵn)
  getRevenue: (params = {}) => {
    return axiosClient.get('/admin/revenue', { params });
  },

  // Thống kê lợi nhuận (commission)
  getProfit: (params = {}) => {
    return axiosClient.get('/admin/profit', { params });
  },

  // Analytics tổng hợp
  getAnalytics: (params = {}) => {
    return axiosClient.get('/admin/analytics', { params });
  },

  // Lấy danh sách khách sạn cho dropdown filter / tạo manager
  getHotels: () => {
    return axiosClient.get('/admin/hotels');
  },

  // ======================
  // USERS
  // ======================

  getUsers: (params) => {
    return axiosClient.get('/admin/users', { params });
  },

  // TẠO USER / MANAGER
  createUser: (data) => {
    return axiosClient.post('/admin/users', data);
  },

  updateUserRole: (id, role) => {
    return axiosClient.put(`/admin/users/${id}/role`, { role });
  },

  deleteUser: (id) => {
    return axiosClient.delete(`/admin/users/${id}`);
  },

  // ======================
  // BOOKINGS
  // ======================

  getBookings: (params) => {
    return axiosClient.get('/admin/bookings', { params });
  },

  updateBookingStatus: (id, status) => {
    return axiosClient.put(`/admin/bookings/${id}/status`, { status });
  },

  cancelBooking: (id) => {
    return axiosClient.put(`/admin/bookings/${id}/cancel`);
  },

  // ======================
  // REVIEWS
  // ======================

  getReviews: (params) => {
    return axiosClient.get('/admin/reviews', { params });
  },

  deleteReview: (id) => {
    return axiosClient.delete(`/admin/reviews/${id}`);
  },

  // ======================
  // SETTLEMENTS
  // ======================

  getSettlements: (params) => {
    return axiosClient.get('/admin/settlements', { params });
  },

  getSettlement: (id) => {
    return axiosClient.get(`/admin/settlements/${id}`);
  },

  createSettlement: (data) => {
    return axiosClient.post('/admin/settlements/create', data);
  },

  paySettlement: (id, data) => {
    return axiosClient.put(`/admin/settlements/${id}/pay`, data);
  },
};

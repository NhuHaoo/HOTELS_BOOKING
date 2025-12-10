// frontend/src/api/manager.api.js
import axiosClient from './axiosClient';

export const managerAPI = {
  // ======================
  // DASHBOARD & ANALYTICS
  // ======================
  getDashboard: (params = {}) => {
    return axiosClient.get('/manager/dashboard', { params });
  },

  getRevenue: (params = {}) => {
    return axiosClient.get('/manager/revenue', { params });
  },

  getAnalytics: (params = {}) => {
    return axiosClient.get('/manager/analytics', { params });
  },

  // ======================
  // HOTEL MANAGEMENT
  // ======================
  getHotel: () => {
    return axiosClient.get('/manager/hotel');
  },

  updateHotel: (data) => {
    return axiosClient.put('/manager/hotel', data);
  },

  // ======================
  // BOOKINGS
  // ======================
  getBookings: (params) => {
    return axiosClient.get('/manager/bookings', { params });
  },

  updateBookingStatus: (id, status) => {
    return axiosClient.put(`/manager/bookings/${id}/status`, { status });
  },

  cancelBooking: (id) => {
    return axiosClient.put(`/manager/bookings/${id}/cancel`);
  },

  // ======================
  // REVIEWS
  // ======================
  getReviews: (params) => {
    return axiosClient.get('/manager/reviews', { params });
  },

  deleteReview: (id) => {
    return axiosClient.delete(`/manager/reviews/${id}`);
  },

  // ======================
  // SETTLEMENTS
  // ======================

  getSettlements: (params) => {
    return axiosClient.get('/manager/settlements', { params });
  },

  getPendingSettlement: () => {
    return axiosClient.get('/manager/settlements/pending');
  },
};


import axiosClient from './axiosClient';

export const adminAPI = {
  // Dashboard & Analytics
  getDashboard: () => axiosClient.get('/admin/dashboard'),

  getRevenue: (params) => axiosClient.get('/admin/revenue', { params }),

  getAnalytics: () => axiosClient.get('/admin/analytics'),

  // ======================
  // USERS
  // ======================
  getUsers: (params) => axiosClient.get('/admin/users', { params }),

  // TẠO USER / MANAGER
  createUser: (data) => axiosClient.post('/admin/users', data),

  updateUserRole: (id, role) =>
    axiosClient.put(`/admin/users/${id}/role`, { role }),

  deleteUser: (id) => axiosClient.delete(`/admin/users/${id}`),

  // ======================
  // HOTELS (cần để chọn hotelId cho Manager)
  // ======================
  getHotels: () => axiosClient.get('/admin/hotels'),

  // ======================
  // BOOKINGS
  // ======================
  getBookings: (params) => axiosClient.get('/admin/bookings', { params }),

  updateBookingStatus: (id, status) =>
    axiosClient.put(`/admin/bookings/${id}/status`, { status }),

  cancelBooking: (id) => axiosClient.put(`/admin/bookings/${id}/cancel`),

  // ======================
  // REVIEWS
  // ======================
  getReviews: (params) => axiosClient.get('/admin/reviews', { params }),

  deleteReview: (id) => axiosClient.delete(`/admin/reviews/${id}`)
};

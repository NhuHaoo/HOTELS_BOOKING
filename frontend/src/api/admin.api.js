import axiosClient from './axiosClient';

export const adminAPI = {
  // Dashboard & Analytics
  getDashboard: () => {
    return axiosClient.get('/admin/dashboard');
  },

  getRevenue: (params) => {
    return axiosClient.get('/admin/revenue', { params });
  },

  getAnalytics: () => {
    return axiosClient.get('/admin/analytics');
  },

  // Users
  getUsers: (params) => {
    return axiosClient.get('/admin/users', { params });
  },

  updateUserRole: (id, role) => {
    return axiosClient.put(`/admin/users/${id}/role`, { role });
  },

  deleteUser: (id) => {
    return axiosClient.delete(`/admin/users/${id}`);
  },

  // Bookings
  getBookings: (params) => {
    return axiosClient.get('/admin/bookings', { params });
  },

  updateBookingStatus: (id, status) => {
    return axiosClient.put(`/admin/bookings/${id}/status`, { status });
  },

  cancelBooking: (id) => {
    return axiosClient.put(`/admin/bookings/${id}/cancel`);
  },

  // Reviews
  getReviews: (params) => {
    return axiosClient.get('/admin/reviews', { params });
  },

  deleteReview: (id) => {
    return axiosClient.delete(`/admin/reviews/${id}`);
  },
};


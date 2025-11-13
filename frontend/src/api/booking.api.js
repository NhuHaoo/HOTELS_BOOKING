import axiosClient from './axiosClient';

export const bookingAPI = {
  // Create booking
  createBooking: (data) => {
    return axiosClient.post('/bookings', data);
  },

  // Get my bookings
  getMyBookings: (params) => {
    return axiosClient.get('/bookings', { params });
  },

  // Get single booking
  getBooking: (id) => {
    return axiosClient.get(`/bookings/${id}`);
  },

  // Get booking by code
  getBookingByCode: (code) => {
    return axiosClient.get(`/bookings/code/${code}`);
  },

  // Cancel booking
  cancelBooking: (id, reason) => {
    return axiosClient.put(`/bookings/${id}/cancel`, { reason });
  },

  // Update payment status
  updatePaymentStatus: (id, data) => {
    return axiosClient.put(`/bookings/${id}/payment`, data);
  },
};


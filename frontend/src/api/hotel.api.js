import axiosClient from './axiosClient';

export const hotelAPI = {
  // Get all hotels
  getHotels: (params) => {
    return axiosClient.get('/hotels', { params });
  },

  // Get single hotel
  getHotel: (id) => {
    return axiosClient.get(`/hotels/${id}`);
  },

  // Get nearby hotels
  getNearbyHotels: (params) => {
    return axiosClient.get('/hotels/nearby', { params });
  },

  // Admin: Create hotel
  createHotel: (data) => {
    return axiosClient.post('/hotels', data);
  },

  // Admin: Update hotel
  updateHotel: (id, data) => {
    return axiosClient.put(`/hotels/${id}`, data);
  },

  // Admin: Delete hotel
  deleteHotel: (id) => {
    return axiosClient.delete(`/hotels/${id}`);
  },

  // Admin: Update hotel status
  updateHotelStatus: (id, data) => {
    return axiosClient.put(`/hotels/${id}/status`, data);
  },

  // Admin/Manager: Toggle hotel active status
  toggleHotelActive: (id) => {
    return axiosClient.put(`/hotels/${id}/toggle-active`);
  },
};


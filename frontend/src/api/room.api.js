import axiosClient from './axiosClient';

export const roomAPI = {
  // Get all rooms with filters
  getRooms: (params) => {
    return axiosClient.get('/rooms', { params });
  },

  // Get single room
  getRoom: (id) => {
    return axiosClient.get(`/rooms/${id}`);
  },

  // Search rooms
  searchRooms: (keyword) => {
    return axiosClient.get('/rooms/search', { params: { keyword } });
  },

  // Get available rooms
  getAvailableRooms: (params) => {
    return axiosClient.get('/rooms/available', { params });
  },

  // Get rooms by hotel ID
  getRoomsByHotel: (hotelId, params) => {
    return axiosClient.get(`/rooms/hotel/${hotelId}`, { params });
  },

  // Admin: Create room
  createRoom: (data) => {
    return axiosClient.post('/rooms', data);
  },

  // Admin: Update room
  updateRoom: (id, data) => {
    return axiosClient.put(`/rooms/${id}`, data);
  },

  // Admin: Delete room
  deleteRoom: (id) => {
    return axiosClient.delete(`/rooms/${id}`);
  },
};


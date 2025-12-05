import axiosClient from './axiosClient';

export const roomAPI = {
  getRooms: (params) => {
    return axiosClient.get('/rooms', { params });
  },

  getRoom: (id) => {
    return axiosClient.get(`/rooms/${id}`);
  },

  searchRooms: (keyword) => {
    return axiosClient.get('/rooms/search', { params: { keyword } });
  },

  getAvailableRooms: (params) => {
    return axiosClient.get('/rooms/available', { params });
  },

  getRoomsByHotel: (hotelId, params) => {
    return axiosClient.get(`/rooms/hotel/${hotelId}`, { params });
  },

  createRoom: (data) => {
    return axiosClient.post('/rooms', data);
  },

  updateRoom: (id, data) => {
    return axiosClient.put(`/rooms/${id}`, data);
  },

  deleteRoom: (id) => {
    return axiosClient.delete(`/rooms/${id}`);
  },
};

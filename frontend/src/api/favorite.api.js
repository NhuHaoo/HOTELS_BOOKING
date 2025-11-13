import axiosClient from './axiosClient';

export const favoriteAPI = {
  // Add to favorites
  addFavorite: (roomId) => {
    return axiosClient.post('/favorites', { roomId });
  },

  // Get my favorites
  getFavorites: () => {
    return axiosClient.get('/favorites');
  },

  // Remove from favorites
  removeFavorite: (id) => {
    return axiosClient.delete(`/favorites/${id}`);
  },

  // Remove by room ID
  removeFavoriteByRoom: (roomId) => {
    return axiosClient.delete(`/favorites/room/${roomId}`);
  },

  // Check if favorited
  checkFavorite: (roomId) => {
    return axiosClient.get(`/favorites/check/${roomId}`);
  },
};


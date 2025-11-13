import axiosClient from './axiosClient';

export const aiAPI = {
  // Get personalized recommendations (old endpoint)
  getRecommendations: () => {
    return axiosClient.get('/ai/recommendations');
  },

  // Get personalized recommendations based on booking history
  getPersonalizedRecommendations: (limit = 6) => {
    return axiosClient.get('/ai/personalized-recommendations', { params: { limit } });
  },

  // Get popular rooms
  getPopularRooms: (limit = 10) => {
    return axiosClient.get('/ai/popular', { params: { limit } });
  },

  // Get trending destinations
  getTrendingDestinations: (limit = 5) => {
    return axiosClient.get('/ai/trending', { params: { limit } });
  },

  // Chatbot
  chat: (message, context = {}) => {
    return axiosClient.post('/ai/chat', { message, context });
  },
};


import axiosClient from './axiosClient';

export const reviewAPI = {
  // Create review
  createReview: (data) => {
    return axiosClient.post('/reviews', data);
  },

  // Get room reviews
  getRoomReviews: (roomId, params) => {
    return axiosClient.get(`/reviews/room/${roomId}`, { params });
  },

  // Get my reviews
  getMyReviews: () => {
    return axiosClient.get('/reviews/my/reviews');
  },

  // Update review
  updateReview: (id, data) => {
    return axiosClient.put(`/reviews/${id}`, data);
  },

  // Delete review
  deleteReview: (id) => {
    return axiosClient.delete(`/reviews/${id}`);
  },

  // Mark review as helpful
  markHelpful: (id) => {
    return axiosClient.put(`/reviews/${id}/helpful`);
  },
};


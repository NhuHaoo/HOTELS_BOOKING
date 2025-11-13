import axiosClient from './axiosClient';

export const authAPI = {
  // Register
  register: (data) => {
    return axiosClient.post('/auth/register', data);
  },

  // Login
  login: (data) => {
    return axiosClient.post('/auth/login', data);
  },

  // Get profile
  getProfile: () => {
    return axiosClient.get('/auth/profile');
  },

  // Update profile
  updateProfile: (data) => {
    return axiosClient.put('/auth/profile', data);
  },

  // Change password
  changePassword: (data) => {
    return axiosClient.put('/auth/change-password', data);
  },

  // Forgot password
  forgotPassword: (email) => {
    return axiosClient.post('/auth/forgot-password', { email });
  },

  // Reset password
  resetPassword: (token, password) => {
    return axiosClient.put(`/auth/reset-password/${token}`, { password });
  },
};


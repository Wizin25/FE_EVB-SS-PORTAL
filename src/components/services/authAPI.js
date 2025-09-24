import api from './api';

export const authAPI = {
  signIn: async (credentials) => {
    try {
      const response = await api.post('/auth/signin', credentials);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  signUp: async (userData) => {
    try {
      const signUpData = {
        ...userData,
        role: 'Customer',
        status: 'Active',
        startDate: new Date().toISOString()
      };
      
      const response = await api.post('/auth/signup', signUpData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  forgotPassword: async (email) => {
    try {
      const response = await api.post('/auth/forgot-password', { email });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};
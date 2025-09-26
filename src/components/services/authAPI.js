import api from './api';

export const authAPI = {
  signIn: async (credentials) => {
    try {
      const response = await api.post('/api/Account/login', credentials);
      return response.data;
    } catch (error) {
      // trả về Error object có message
      throw new Error(error?.message || JSON.stringify(error) || 'Sign in failed');
    }
  },

  signUp: async (userData) => {
    try {
      // Build multipart/form-data payload matching BE keys (PascalCase)
      const form = new FormData();
      form.append('Username', userData.username);
      form.append('Password', userData.password);
      form.append('ConfirmedPassword', userData.confirmedPassword);
      form.append('Name', userData.name);
      form.append('Phone', userData.phone);
      form.append('Address', userData.address ?? '');
      form.append('Email', userData.email);
      
      const response = await api.post('/api/Account/register', form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    } catch (errors) {
      // Không wrap, trả về đúng payload của BE để UI lấy message từ Swagger
      throw errors;
    }
  },

  forgotPassword: async (email) => {
    try {
      const response = await api.post('/auth/forgot-password', { email });
      return response.data;
    } catch (error) {
      throw new Error(error?.message || JSON.stringify(error) || 'Forgot password failed');
    }
  },

  getAllUsers: async () => {
    try {
      const response = await api.get('/api/Account/get_all_account_for_admin',);
      return response.data;
    } catch (error) {
      throw new Error(error?.message || JSON.stringify(error) || 'Get users failed');
    }
  }

};



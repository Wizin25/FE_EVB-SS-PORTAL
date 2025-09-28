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
      const response = await api.post('/api/Account/forgot-password', { email });
      return response.data;
    } catch (error) {
      throw new Error(error?.message || JSON.stringify(error) || 'Forgot password failed');
    }
  },

  verifyOtp: async (email, otp) => {
    try {
      const response = await api.post(`/api/Account/verify-otp?email=${email}&otp=${otp}`);
      return response.data;
    } catch (error) {
      throw new Error(error?.message || JSON.stringify(error) || 'OTP verification failed');
    }
  },

  getAllUsers: async () => {
    try {
      const response = await api.get('/api/Account/get_all_account_for_admin',);
      return response.data;
    } catch (error) {
      throw new Error(error?.message || JSON.stringify(error) || 'Get users failed');
    }
  },
  createStaff: async (staffData) => {
    try {
      // Build multipart/form-data payload matching BE keys (PascalCase)
      const form = new FormData();
      form.append('Username', staffData.username);
      form.append('Password', staffData.password);
      form.append('ConfirmedPassword', staffData.confirmedPassword);
      form.append('Name', staffData.name);
      form.append('Phone', staffData.phone);
      form.append('Address', staffData.address ?? '');
      form.append('Email', staffData.email);

      const response = await api.post('/api/Account/create_staff_for_admin', form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    } catch (error) {
      // Không wrap, trả về đúng payload của BE để UI lấy message từ Swagger
      throw error;
    }
  },
getAllCustomers: async () => {
    try {
      const response = await api.get('/api/Account/get_all_customer_for_admin');
      return response.data;
    } catch (error) {
      throw new Error(error?.message || JSON.stringify(error) || 'Get customers failed');
    }
  },

  getCustomerById: async (accountId) => {
    try {
      const response = await api.get(`/api/Account/get_account_by_id/${accountId}_for_admin`);
      return response.data;
    } catch (error) {
      throw new Error(error?.message || JSON.stringify(error) || 'Get customer failed');
    }
  },

   getExchangeHistory: async (customerId) => {
    try {
      // Giả sử endpoint này trả về lịch sử trao đổi pin của customer
      const response = await api.get(`/api/ExchangeBattery/get_by_customer/${customerId}`);
      return response.data;
    } catch (error) {
      throw new Error(error?.message || JSON.stringify(error) || 'Get exchange history failed');
    }
  },
};



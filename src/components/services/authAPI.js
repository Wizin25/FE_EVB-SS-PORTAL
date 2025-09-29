import api from './api';

export const authAPI = {
  signIn: async (credentials) => {
    try {
      const response = await api.post('/api/Account/login', credentials);
      return response.data;
    } catch (error) {
      throw new Error(error?.message || JSON.stringify(error) || 'Sign in failed');
    }
  },

  signUp: async (userData) => {
    try {
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
      const response = await api.get('/api/Account/get_all_account_for_admin');
      return response.data;
    } catch (error) {
      throw new Error(error?.message || JSON.stringify(error) || 'Get users failed');
    }
  },

  createStaff: async (staffData) => {
    try {
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
      const response = await api.get(`/api/ExchangeBattery/get_by_customer/${customerId}`);
      return response.data;
    } catch (error) {
      throw new Error(error?.message || JSON.stringify(error) || 'Get exchange history failed');
    }
  },
<<<<<<< HEAD
=======

  getCurrent: async () => {
    try {
      const res = await api.get('/api/Account/get-currrent');
      // backend trả wrapper { isSuccess, data, ... } -> trả về data trực tiếp
      if (res?.data?.isSuccess) {
        return res.data.data || null;
      }
      // nếu backend trả 200 nhưng isSuccess false thì trả null
      console.warn('authAPI.getCurrent: isSuccess false', res?.data);
      return null;
    } catch (error) {
      console.error('authAPI.getCurrent error:', error);
    }
  },
};
>>>>>>> main

  // CÁC HÀM CHO EDIT VÀ DELETE
  updateStaff: async (staffData) => {
    try {
      const form = new FormData();
      form.append('AccountID', staffData.accountId);
      form.append('Name', staffData.name);
      form.append('Phone', staffData.phone);
      form.append('Address', staffData.address ?? '');
      form.append('Email', staffData.email);
      form.append('Status', staffData.status);

      const response = await api.put('/api/Account/update_staff_for_admin', form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  updateCustomer: async (customerData) => {
    try {
      const form = new FormData();
      form.append('AccountID', customerData.accountId);
      form.append('Name', customerData.name);
      form.append('Phone', customerData.phone);
      form.append('Address', customerData.address ?? '');
      form.append('Email', customerData.email);
      form.append('Status', customerData.status);

      const response = await api.put('/api/Account/update_customer_for_admin', form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  deleteStaff: async (accountId) => {
    try {
      const response = await api.put(`/api/Account/delete_staff_for_admin/${accountId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  deleteCustomer: async (accountId) => {
    try {
      const response = await api.put(`/api/Account/delete_customer_for_admin/${accountId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};
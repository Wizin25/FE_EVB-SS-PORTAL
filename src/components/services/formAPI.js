// formAPI.js
import api from './api';

export const formAPI = {
  createForm: async (formData) => {
    try {
      const response = await api.post('/api/Form/create-form', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    } catch (error) {
      console.error('Create form error:', error);
      throw error.response?.data || { 
        message: error.message || 'Tạo form thất bại',
        isSuccess: false 
      };
    }
  },

  getFormById: async (formId) => {
    try {
      const response = await api.get(`/api/Form/get-form-by-id/${formId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getAllForms: async () => {
    try {
      const response = await api.get('/api/Form/get-all-forms');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getFormsByAccountId: async (accountId) => {
    try {
      const response = await api.get(`/api/Form/get-forms-by-account-id/${accountId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getFormsByStationId: async (stationId) => {
    try {
      const response = await api.get(`/api/Form/get-forms-by-station-id/${stationId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  updateForm: async (formData) => {
    try {
      const data = new FormData();
      data.append('FormId', formData.formId);
      data.append('AccountId', formData.accountId);
      data.append('Title', formData.title);
      data.append('Description', formData.description);
      data.append('Date', formData.date);
      data.append('StationId', formData.stationId);

      const response = await api.put('/api/Form/update-form', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  deleteForm: async (formId) => {
  try {
    // Thử dùng DELETE method trước
    const response = await api.delete(`/api/Form/delete-form/${formId}`);
    return response.data;
  } catch (error) {
    // Nếu DELETE không work, thử PUT
    try {
      const response = await api.put(`/api/Form/delete-form/${formId}`);
      return response.data;
    } catch (secondError) {
      console.error('Delete form error:', secondError);
      throw secondError.response?.data || { 
        message: secondError.message || 'Xóa form thất bại',
        isSuccess: false 
      };
    }
  }
},
};
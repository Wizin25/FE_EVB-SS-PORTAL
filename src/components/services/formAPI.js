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
      // Lọc ra các đơn thực sự thuộc đúng stationId truyền vào (phòng backend trả thừa)
      const forms = Array.isArray(response.data.data)
        ? response.data.data.filter(form => form.stationId === stationId)
        : [];
      return forms;
    } catch (error) {
      throw error;
    }
  },

  // Alias for clarity if needed elsewhere
  getAllFormByStationId: async (stationId) => {
    return await formAPI.getFormsByStationId(stationId);
  },

  updateFormStatusStaff: async ({ formId, status }) => {
    try {
      const data = new FormData();
      data.append('FormId', formId);
      if (status) data.append('Status', status);
      const response = await api.put('/api/Form/update-form-status-staff', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || {
        message: error.message || 'Cập nhật trạng thái form thất bại',
        isSuccess: false,
      };
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
      // CHỈ sử dụng PUT method theo đúng backend
      const response = await api.put(`/api/Form/delete-form/${formId}`);
      return response.data;
    } catch (error) {
      console.error('Delete form error:', error);
      throw error.response?.data || { 
        message: error.message || 'Xóa form thất bại',
        isSuccess: false 
      };
    }
  },

  getFormByIdDriver: async (formId) => {
    try {
      const response = await api.get(`/api/Form/get-form-by-id-driver/${formId}`);
      return response.data;
    } catch (error) {
      console.error('Get form by id driver error:', error);
      throw error.response?.data || { 
        message: error.message || 'Lỗi khi lấy thông tin form',
        isSuccess: false 
      };
    }
  },

  getAllFormsDriver: async () => {
    try {
      const response = await api.get('/api/Form/get-all-forms-driver');
      return response.data;
    } catch (error) {
      console.error('Get all forms driver error:', error);
      throw error.response?.data || { 
        message: error.message || 'Lỗi khi lấy danh sách form',
        isSuccess: false 
      };
    }
  },
};
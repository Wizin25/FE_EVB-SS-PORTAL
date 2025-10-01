import api from './api';

export const formAPI = {
  createForm: async (formData) => {
    try {
      const data = new FormData();
      data.append('AccountId', formData.accountId);
      data.append('Title', formData.title);
      data.append('Description', formData.description);
      data.append('Date', formData.date);
      data.append('StationId', formData.stationId);

      const response = await api.post('/api/Form/create-form', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    } catch (error) {
      throw new Error(error?.message || JSON.stringify(error) || 'Create form failed');
    }
  },

  getFormById: async (formId) => {
    try {
      const response = await api.get(`/api/Form/get-form-by-id/${formId}`);
      return response.data;
    } catch (error) {
      throw new Error(error?.message || JSON.stringify(error) || 'Get form failed');
    }
  },

  getAllForms: async () => {
    try {
      const response = await api.get('/api/Form/get-all-forms');
      return response.data;
    } catch (error) {
      throw new Error(error?.message || JSON.stringify(error) || 'Get forms failed');
    }
  },

  getFormsByAccountId: async (accountId) => {
    try {
      const response = await api.get(`/api/Form/get-forms-by-account-id/${accountId}`);
      return response.data;
    } catch (error) {
      throw new Error(error?.message || JSON.stringify(error) || 'Get forms by account failed');
    }
  }
};
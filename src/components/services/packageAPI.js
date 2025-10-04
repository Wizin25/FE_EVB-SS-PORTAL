import api from './api';

export const packageAPI = {
  // Lấy tất cả packages
  getAllPackages: async () => {
    try {
      const response = await api.get('/api/Package/get_all_packages');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Lấy package theo ID
  getPackageById: async (packageId) => {
    try {
      const response = await api.get('/api/Package/get_package_by_id', {
        params: { packageId }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Lấy packages phù hợp với battery (cần implement thêm API backend nếu cần)
  getPackagesByBattery: async (batteryId) => {
    try {
      // Tạm thời lấy tất cả packages, có thể filter phía frontend
      // hoặc tạo API mới ở backend
      const response = await api.get('/api/Package/get_all_packages');
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};
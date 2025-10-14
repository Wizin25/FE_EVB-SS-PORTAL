import api from './api';

export const packageAPI = {
  // Lấy tất cả packages (cho admin - bao gồm cả inactive)
  getAllPackages: async () => {
    try {
      console.log('🌐 Calling API: /api/Package/get_all_packages');
      const response = await api.get('/api/Package/get_all_packages');
      console.log('📡 API Response status:', response.status);
      console.log('📡 API Response headers:', response.headers);
      console.log('📡 API Response data:', response.data);
      return response.data;
    } catch (error) {
      console.error('🚨 API Call failed:', error);
      console.error('Error response:', error.response);
      throw error;
    }
  },

  // Lấy chỉ các packages active (cho người dùng)
  getActivePackages: async () => {
    try {
      const response = await api.get('/api/Package/get_active_packages');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Cập nhật package
  updatePackage: async (updateData) => {
    try {
      const formData = new FormData();
      formData.append('PackageId', updateData.packageId);
      formData.append('PackageName', updateData.packageName);
      formData.append('Price', updateData.price);
      formData.append('Description', updateData.description || '');
      formData.append('BatteryType', updateData.batteryType);

      console.log('API Call - Update Package:', {
        PackageId: updateData.packageId,
        PackageName: updateData.packageName,
        Price: updateData.price,
        Description: updateData.description,
        BatteryType: updateData.batteryType
      });

      const response = await api.put('/api/Package/update_package', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Xóa mềm package (chuyển status sang Inactive)
  deletePackage: async (packageId) => {
    try {
      const formData = new FormData();
      formData.append('packageId', packageId);

      const response = await api.put('/api/Package/delete_package', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
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

  // Tạo package mới
  createPackage: async (createData) => {
    try {
      const formData = new FormData();
      formData.append('PackageName', createData.packageName);
      formData.append('Price', createData.price);
      formData.append('Description', createData.description || '');
      formData.append('BatteryType', createData.batteryType);

      console.log('API Call - Create Package:', {
        PackageName: createData.packageName,
        Price: createData.price,
        Description: createData.description,
        BatteryType: createData.batteryType
      });

      const response = await api.post('/api/Package/add_package', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Lấy packages active phù hợp với battery
  getPackagesByBattery: async (batteryId) => {
    try {
      const response = await api.get('/api/Package/get_active_packages');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getPackageByBatteryType: async (batteryType) => {
    try {
      const response = await api.get('/api/Package/get_package_by_battery_type', {
        params: { 
          batterySpecificationEnums: batteryType 
        }
      });
      console.log('API Response - getPackageByBatteryType:', response.data);
      return response.data;
    } catch (error) {
      console.error('API Error - getPackageByBatteryType:', error);
      throw error;
    }
  },
};
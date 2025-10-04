import api from './api';

export const vehicleAPI = {
  // Lấy package theo vehicle name
  getPackageByVehicleName: async (vehicleName) => {
    try {
      const response = await api.get('/api/Vehicle/get_package_by_vehicle_name', {
        params: { vehicleName }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Gán package cho vehicle
  assignPackageToVehicle: async (VIN, packageId) => {
    try {
      const formData = new FormData();
      formData.append('VIN', VIN);
      formData.append('PackageID', packageId);
      
      const response = await api.put('/api/Vehicle/assign_package', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Lấy tất cả vehicles
  getAllVehicles: async () => {
    try {
      const response = await api.get('/api/Vehicle/get_all_vehicles');
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};
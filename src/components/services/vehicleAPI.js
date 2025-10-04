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
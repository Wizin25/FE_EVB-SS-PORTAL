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
  },

  // Thêm vehicle vào package - ĐÃ SỬA THEO SWAGGER
  addVehicleInPackage: async (data) => {
    try {
      const formData = new FormData();
      formData.append('Vin', data.Vin); // Sửa thành Vin theo Swagger
      formData.append('PackageId', data.PackageId);
      
      console.log('API Call - addVehicleInPackage:', {
        Vin: data.Vin,
        PackageId: data.PackageId
      });

      const response = await api.put('/api/Vehicle/add_vehicle_in_package', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      console.log('API Response - addVehicleInPackage:', response);
      return response.data;
    } catch (error) {
      console.error('API Error - addVehicleInPackage:', error);
      
      if (error.response) {
        const errorMessage = error.response.data?.message || 
                            error.response.data?.responseCode || 
                            'Lỗi server khi thêm gói';
        throw new Error(errorMessage);
      } else if (error.request) {
        throw new Error('Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.');
      } else {
        throw new Error('Lỗi không xác định: ' + error.message);
      }
    }
  },

  // Xóa vehicle khỏi package - ĐÃ SỬA THEO SWAGGER
  deleteVehicleInPackage: async (data) => {
    try {
      const formData = new FormData();
      formData.append('vehicleId', data.vehicleId); // SỬA: vehicleId thay vì Vin

      console.log('API Call - deleteVehicleInPackage DATA:', {
        vehicleId: data.vehicleId,
        FormData: formData
      });

      const response = await api.put('/api/Vehicle/delete_vehicle_in_package', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      console.log('API Response - deleteVehicleInPackage:', response);
      return response.data;
    } catch (error) {
      console.error('API Error - deleteVehicleInPackage DETAIL:', {
        error,
        response: error.response,
        data: error.response?.data,
        status: error.response?.status
      });
      
      if (error.response) {
        const errorMessage = error.response.data?.message || 
                            error.response.data?.responseCode || 
                            'Lỗi server khi xóa gói';
        throw new Error(errorMessage);
      } else if (error.request) {
        throw new Error('Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.');
      } else {
        throw new Error('Lỗi không xác định: ' + error.message);
      }
    }
  }
};
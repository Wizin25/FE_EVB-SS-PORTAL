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

  // THÊM CÁC HÀM MỚI CHO PROFILE
  updateProfile: async (profileData) => {
    try {
      const form = new FormData();
      form.append('Name', profileData.name);
      form.append('Phone', profileData.phone);
      form.append('Address', profileData.address ?? '');
      form.append('Email', profileData.email);

      const response = await api.put('/api/Account/update_current_profile', form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      // Trả về toàn bộ response data để xử lý
      return response.data;
    } catch (error) {
      // Ném lỗi để component bắt được
      throw error.response?.data || error;
    }
  },

  changePassword: async (passwordData) => {
    try {
      const response = await api.put('/api/Account/change-password', {
        oldPassword: passwordData.oldPassword,
        newPassword: passwordData.newPassword,
        confirmPassword: passwordData.confirmPassword
      });
      
      // Trả về toàn bộ response data để xử lý
      return response.data;
    } catch (error) {
      // Ném lỗi để component bắt được
      throw error.response?.data || error;
    }
  },

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
      throw error;
    }
  },

  // CÁC HÀM ADMIN (giữ nguyên)
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

  getAllStations: async () => {
    try {
      const res = await api.get('/api/Station/get_all_stations');
      if (res?.data?.isSuccess) {
        return res.data.data || [];
      }
      throw new Error(res?.data?.responseCode || 'Failed to fetch stations');
    } catch (error) {
      const msg =
        error?.response?.data?.message ||
        error?.response?.data?.responseCode ||
        error?.message ||
        JSON.stringify(error);
      throw new Error(msg);
    }
  },

  createStation: async ({ stationName ,batteryNumber, location}) => {
    try {
      const form = new FormData();
      // Backend yêu cầu field name exactly as docs: BatteryNumber, Location, StationName
      form.append("Name", stationName ?? "");
      form.append("BatteryNumber", batteryNumber ?? 0);
      form.append("Location", location ?? "");
      
      const res = await api.post("/api/Station/add_station_for_admin", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res?.data?.isSuccess) {
        return res.data;
      }
      throw new Error(res?.data?.responseCode || "Failed to create station");
    } catch (error) {
      const msg =
        error?.response?.data?.message ||
        error?.response?.data?.responseCode ||
        error?.message ||
        JSON.stringify(error);
      throw new Error(msg);
    }
  },

  deleteStation: async (stationId) => {
    try {
      // dùng PUT với params
      const res = await api.put(
        "/api/Station/delete_station_for_admin",
        null,
        { params: { stationId } }
      );
      if (res?.data?.isSuccess) {
        return res.data;
      }
      throw new Error(res?.data?.responseCode || "Failed to delete station");
    } catch (error) {
      const msg =
        error?.response?.data?.message ||
        error?.response?.data?.responseCode ||
        error?.message ||
        JSON.stringify(error);
      throw new Error(msg);
    }
  },

  updateStation: async ({ stationName,stationId, batteryNumber, location }) => {
    try {
      const form = new FormData();
      form.append("Name", stationName ?? "");
      form.append("StationId", stationId ?? ""); // giữ theo docs
      form.append("BatteryNumber", batteryNumber ?? 0);
      form.append("Location", location ?? "");

      const res = await api.put("/api/Station/update_station_for_admin", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res?.data?.isSuccess) {
        return res.data;
      }
      throw new Error(res?.data?.responseCode || "Failed to update station");
    } catch (error) {
      const msg =
        error?.response?.data?.message ||
        error?.response?.data?.responseCode ||
        error?.message ||
        JSON.stringify(error);
      throw new Error(msg);
    }
  },

  // Battery APIs
  getAllBatteries: async () => {
    try {
      const res = await api.get("api/Battery/get-all-batteries");
      if (res.data?.isSuccess) {
        return res.data.data;
      }
      return [];
    } catch (err) {
      throw new Error(err?.message || "Lỗi khi lấy danh sách pin");
    }
  },

  // Thêm vào authAPI.js nếu chưa có
getBatteryById: async (batteryId) => {
  try {
    const res = await api.get(`/api/Battery/get-battery-by-id?batteryId=${batteryId}`);
    if (res.data?.isSuccess) {
      return res.data.data;
    }
    return null;
  } catch (err) {
    throw new Error(err?.message || "Không tìm thấy pin");
  }
},

  createBattery: async (formData) => {
    try {
      const res = await api.post("/api/Battery/add-battery", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      return res.data;
    } catch (err) {
      throw new Error(err?.message || "Tạo pin thất bại");
    }
  },

  updateBattery: async (formData) => {
    try {
      const res = await api.put("/api/Battery/update-battery", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      return res.data;
    } catch (err) {
      throw new Error(err?.message || "Cập nhật pin thất bại");
    }
  },

  deleteBattery: async (batteryId) => {
    try {
      const formData = new FormData();
      formData.append("batteryId", batteryId);
      const res = await api.put("/api/Battery/delete-battery", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      return res.data;
    } catch (err) {
      throw new Error(err?.message || "Xóa pin thất bại");
    }
  },

  addBatteryToStation: async (batteryId, stationId) => {
    try {
      const formData = new FormData();
      formData.append("BatteryId", batteryId);
      formData.append("StationId", stationId);
      const res = await api.put("/api/Battery/add-battery-in-station", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      return res.data;
    } catch (err) {
      throw new Error(err?.message || "Gán pin vào trạm thất bại");
    }
  },

  // STATUS MANAGEMENT APIs - MỚI THÊM
  updateBatteryStatus: async (batteryId, status) => {
    try {
      const formData = new FormData();
      formData.append("BatteryId", batteryId);
      formData.append("Status", status);

      const response = await api.put('/api/Battery/update_battery_in_station_status', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    } catch (error) {
      throw new Error(error?.message || JSON.stringify(error) || 'Update battery status failed');
    }
  },

  updatePackageStatus: async (packageId, status) => {
    try {
      const formData = new FormData();
      formData.append("PackageId", packageId);
      formData.append("Status", status);

      const response = await api.put('/api/Package/update_package_status', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    } catch (error) {
      throw new Error(error?.message || JSON.stringify(error) || 'Update package status failed');
    }
  },

  updateStationStatus: async (stationId, status) => {
    try {
      const formData = new FormData();
      formData.append("StationId", stationId);
      formData.append("Status", status);

      const response = await api.put('/api/Station/update_station_status', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    } catch (error) {
      throw new Error(error?.message || JSON.stringify(error) || 'Update station status failed');
    }
  },

  updateAccountStatus: async (accountId, status) => {
    try {
      const formData = new FormData();
      formData.append("AccountID", accountId);
      formData.append("Status", status);

      const response = await api.put('/api/Account/update_status', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    } catch (error) {
      throw new Error(error?.message || JSON.stringify(error) || 'Update account status failed');
    }
  },

  getDriverBatteries: async () => {
    try {
      // Tạm thời dùng getAllBatteries, sau này có API riêng thì thay thế
      const res = await api.get('/api/Battery/get-all-batteries');
      if (res.data?.isSuccess) {
        return res.data.data;
      }
      return [];
    } catch (err) {
      throw new Error(err?.message || 'Lỗi khi lấy danh sách pin của tài xế');
    }
  },

  // Rating APIs
  addRating: async ({ rating1, description, stationId, accountId }) => {
    try {
      const form = new FormData();
      // Field names must match backend exactly as in docs
      form.append('Rating1', rating1);
      form.append('Description', description ?? '');
      form.append('StationId', stationId);
      form.append('AccountId', accountId);

      const res = await api.post('/api/Rating/add_rating', form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return res.data;
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Gửi đánh giá thất bại';
      throw new Error(msg);
    }
  },

  getAllRatings: async () => {
    try {
      const res = await api.get('/api/Rating/get_all_ratings');
      if (res?.data?.isSuccess) {
        return res.data.data || [];
      }
      return [];
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Lấy danh sách đánh giá thất bại';
      throw new Error(msg);
    }
  },

  // Booking/Form APIs
  createForm: async ({ accountId, title, description, date, stationId, vin, batteryId }) => {
    try {
      const form = new FormData();
      // Field names must match backend exactly
      form.append('AccountId', accountId ?? '');
      form.append('Title', title ?? '');
      form.append('Description', description ?? '');
      form.append('Date', date ?? '');
      form.append('StationId', stationId ?? '');
      // New required fields per BE update
      if (vin) form.append('VIN', vin);
      if (batteryId) form.append('BatteryID', batteryId);

      const res = await api.post('/api/Form/create-form', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Tạo lịch thất bại';
      throw new Error(msg);
    }
  },

  // Staff-Station Management APIs
  getAllStaff: async () => {
    try {
      const res = await api.get('/api/Account/get_all_staff_for_admin');
      if (res?.data?.isSuccess) {
        return res.data.data || [];
      }
      return [];
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Lấy danh sách nhân viên thất bại';
      throw new Error(msg);
    }
  },

  addStaffToStation: async ({ staffId, stationId }) => {
    try {
      const res = await api.post('/api/Station/add_staff_to_station_for_admin', {
        staffId,
        stationId,
      });
      return res.data;
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Thêm nhân viên vào trạm thất bại';
      throw new Error(msg);
    }
  },

  removeStaffFromStation: async ({ staffId, stationId }) => {
    try {
      const res = await api.delete('/api/Station/remove_staff_from_station_for_admin', {
        params: { stationId ,staffId },
      });
      return res.data;
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Xóa nhân viên khỏi trạm thất bại';
      throw new Error(msg);
    }
  },

  getStationByStaffId: async (staffId) => {
    try {
      const res = await api.get('/api/Station/get_station_by_staff_id_for_staff', {
        params: { staffId }
      });
      if (res?.data?.isSuccess) {
        return res.data.data || null;
      }
      return null;
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Lấy thông tin trạm của nhân viên thất bại';
      throw new Error(msg);
    }
  },

  getStaffsByStationId: async (stationId) => {
    try {
      const res = await api.get('/api/Station/get_staffs_by_station_id_for_admin', {
        params: { stationId }
      });
      if (res?.data?.isSuccess) {
        return res.data.data || [];
      }
      return [];
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Lấy danh sách nhân viên của trạm thất bại';
      throw new Error(msg);
    }
  },

  getStationByIdForAdmin: async (stationId) => {
    try {
      const res = await api.get('/api/Station/get_station_by_id_for_admin', {
        params: { stationId }
      });
      if (res?.data?.isSuccess) {
        return res.data.data;
      }
      return null;
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Lấy thông tin trạm thất bại';
      throw new Error(msg);
    }
  },
};
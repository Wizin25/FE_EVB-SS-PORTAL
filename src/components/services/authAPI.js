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

  verifyRegisterOtp: async ({ email, otp }) => {
    try {
      if (!email || !otp) throw new Error("Email và OTP là bắt buộc.");
      const form = new FormData();
      form.append('Email', email); // <-- PascalCase đúng như BE báo lỗi
      form.append('Otp', otp);     // <-- PascalCase đúng như BE báo lỗi
  
      const res = await api.post('/api/Account/register-verify-otp', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data; // { isSuccess, message, data: { accessToken } }
    } catch (error) {
      const msg = error?.response?.data?.message || error?.message || 'Xác thực OTP thất bại';
      throw error?.response?.data || new Error(msg);
    }
  },
  
  resendRegisterOtp: async ({ email }) => {
    try {
      if (!email) throw new Error("Email là bắt buộc.");
      // BE nhận email qua query: ?email=...
      const res = await api.post(
        `/api/Account/resend-register-otp?email=${encodeURIComponent(email)}`
      );
      return res.data; // { isSuccess, message }
    } catch (error) {
      const msg =
        error?.response?.data?.message ||
        error?.message ||
        "Gửi lại OTP thất bại";
      throw error?.response?.data || new Error(msg);
    }
  },
  

  // Trong authAPI object, cập nhật hàm updateProfile:
  updateProfile: async (profileData) => {
    try {
      const form = new FormData();

      // Đảm bảo không gửi undefined values
      form.append('Name', profileData.name || '');
      form.append('Phone', profileData.phone || '');
      form.append('Address', profileData.address || '');
      form.append('Email', profileData.email || '');

      // QUAN TRỌNG: Backend có thể mong đợi field 'Avatar' 
      if (profileData.avatar) {
        // Nếu avatar là URL string, gửi dưới dạng string
        if (typeof profileData.avatar === 'string') {
          form.append('Avatar', profileData.avatar);
        } else {
          // Nếu là File object, gửi như file
          form.append('Avatar', profileData.avatar);
        }
      }

      const response = await api.put('/api/Account/update_current_profile', form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      return response.data;
    } catch (error) {
      console.error('Update profile error:', error.response?.data || error);
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
      const response = await api.get(`/api/Account/get_account_by_id/${accountId}`);
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
  
  getAllStationsOfCustomerSuitVehicle: async (vehicleId) => {
    try {
      const res = await api.get('/api/Station/get_all_station_of_customer_suit_vehicle', {
        params: { vehicleId }
      });
      if (res?.data?.isSuccess) {
        return res.data.data || [];
      }
      throw new Error(res?.data?.responseCode || 'Failed to fetch suited stations for vehicle');
    } catch (error) {
      const msg =
        error?.response?.data?.message ||
        error?.response?.data?.responseCode ||
        error?.message ||
        JSON.stringify(error);
      throw new Error(msg);
    }
  },

  createStation: async ({ stationName, location, image }) => {
    try {
      const form = new FormData();
      // Backend yêu cầu field name exactly as docs: BatteryNumber, Location, StationName
      form.append("Name", stationName ?? "");
      form.append("Location", location ?? 0);
      form.append("Image", image ?? "");

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

  updateStation: async ({ stationName, stationId, batteryNumber, location }) => {
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
  
  getAllPageBatteries: async ({ pageNum, pageSize }) => {
    try {
      const res = await api.get("/api/Battery/get_all_page_batteries", {
        params: { pageNum, pageSize },
      });
      if (res.data?.isSuccess) {
        return res.data.data;
      }
      return { items: [], total: 0 };
    } catch (err) {
      throw new Error(err?.message || "Lỗi khi lấy danh sách pin phân trang");
    }
  },

  // Batteries suitable for a vehicle at a station
  getBatteriesSuitVehicle: async ({ vin, stationId }) => {
    try {
      const res = await api.get('/api/Battery/get_batteries_suit_vehicle', {
        params: { Vin: vin, StationId: stationId }
      });
      // Accept wrappers or raw arrays
      if (Array.isArray(res?.data)) return res.data;
      if (res?.data?.isSuccess && Array.isArray(res.data.data)) return res.data.data;
      return [];
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Lỗi khi lấy danh sách pin phù hợp';
      throw new Error(msg);
    }
  },

  // API lấy thông tin pin chi tiết theo batteryId, trả về res.data.data nếu thành công; null nếu không thành công
  getBatteryById: async (batteryId) => {
    try {
      const res = await api.get(`/api/Battery/get-battery-by-id?batteryId=${batteryId}`);
      if (res.data?.isSuccess && res.data?.data) {
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

  addBatteryToStation: async (batteryId, stationId, slotId) => {
    try {
      const formData = new FormData();
      formData.append("BatteryId", batteryId);
      formData.append("StationId", stationId);
      if (slotId) formData.append("SlotId", slotId);
  
      const res = await api.put("/api/Battery/add-battery-in-station", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.data;
    } catch (err) {
      throw new Error(err?.message || "Gán pin vào trạm thất bại");
    }
  },
  
  deleteBatteryInStation: async (batteryId) => {
    try {
      const formData = new FormData();
      formData.append("batteryId", batteryId);
      const res = await api.put("/api/Battery/delete_battery_in_station", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.data;
    } catch (err) {
      throw new Error(err?.message || "Xóa pin khỏi trạm thất bại");
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

  // Lấy Battery Histories theo batteryId
  getBatteryHistoryByBatteryId: async (batteryId) => {
    if (!batteryId) return [];
    try {
      const res = await api.get('/api/BatteryHistory/get_battery_history_by_battery_id', {
        params: { batteryId }
      });
      // BE thường bọc wrapper { isSuccess, data }
      if (res?.data?.isSuccess && Array.isArray(res.data.data)) return res.data.data;
      // fallback nếu BE trả raw array
      if (Array.isArray(res?.data)) return res.data;
      return [];
    } catch (err) {
      // Nếu BE trả 404 khi rỗng → trả []
      if (err?.response?.status === 404) return [];
      const msg = err?.response?.data?.message || err?.message || 'Không tải được lịch sử pin';
      throw new Error(msg);
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
  addRating: async ({ rating1, description, stationId, accountId, image }) => {
    try {
      const form = new FormData();
      // Field names must match backend exactly as in docs
      form.append('Rating1', rating1);
      form.append('Description', description ?? '');
      form.append('StationId', stationId);
      form.append('AccountId', accountId);
      if (typeof image === 'string') {
        form.append('Image', image);
      }

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

  updateRating: async ({ ratingId, rating1, description, image }) => {
    try {
      const form = new FormData();
      form.append('RatingId', ratingId);
      if (rating1 !== undefined && rating1 !== null) form.append('Rating1', rating1);
      if (description !== undefined && description !== null) form.append('Description', description);
      if (image !== undefined && image !== null) form.append('Image', image);

      const res = await api.put('/api/Rating/update_rating', form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return res.data;
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Cập nhật đánh giá thất bại';
      throw new Error(msg);
    }
  },

  deleteRatingForCustomerByRatingId: async ({ ratingId, accountId }) => {
    try {
      const form = new FormData();
      form.append('RatingId', ratingId);
      form.append('AccountId', accountId);

      const res = await api.put('/api/Rating/delete_rating_for_customer_by_rating_id', form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return res.data;
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Xoá đánh giá thất bại';
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
        params: { stationId, staffId },
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
        return res.data.data || null; // chỉ trả về trường data (object thông tin station)
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

  getStationById: async (stationId) => {
    try {
      const res = await api.get('/api/Station/get_station_by_id', {
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

  getCustomerByAccountId: async (accountId) => {
    if (!accountId) throw new Error('accountId is required');
    try {
      const res = await api.get('/api/Account/get_customer_by_account_id', {
        params: { accountId }
      });
      // Chuẩn hoá trả về giống các hàm khác
      if (res?.data?.isSuccess) return res.data.data || null;
      // Một số BE có thể trả raw object
      if (res?.data && res.status === 200) return res.data;
      return null;
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Lấy thông tin customer theo accountId thất bại';
      throw new Error(msg);
    }
  },

  // Report APIs - ĐÃ SỬA ĐỔI để dùng Cloudinary publicId
  addReport: (formData) => {
    return api.post('/api/Report/add_report', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },

  getAllReports: async () => {
    try {
      const response = await api.get('/api/Report/get_all_reports');
      return response.data;
    } catch (error) {
      throw new Error(error?.message || JSON.stringify(error) || 'Get reports failed');
    }
  },

  getReportById: async (reportId) => {
    try {
      const response = await api.get(`/api/Report/get_report_by_id?reportId=${reportId}`);
      return response.data;
    } catch (error) {
      throw new Error(error?.message || JSON.stringify(error) || 'Get report failed');
    }
  },

  updateReport: async (reportData) => {
    try {
      const form = new FormData();
      form.append('ReportID', reportData.reportId);
      form.append('Name', reportData.name);
      form.append('Description', reportData.description);
      if (reportData.image) {
        form.append('ImagePublicId', reportData.image);
      }
      form.append('AccountId', reportData.accountId);
      form.append('StationId', reportData.stationId);

      const response = await api.put('/api/Report/update_report', form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    } catch (error) {
      throw new Error(error?.message || JSON.stringify(error) || 'Update report failed');
    }
  },

  deleteReport: async (reportId) => {
    try {
      const form = new FormData();
      form.append('reportId', reportId);

      const response = await api.put('/api/Report/delete_report', form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    } catch (error) {
      throw new Error(error?.message || JSON.stringify(error) || 'Delete report failed');
    }
  },

  // BatteryReport APIs
  addBatteryReport: async ({ name, description, image, imageUrl, accountId, stationId, batteryId, reportType, exchangeBatteryId, capacity, Capacity, batteryQuality, BatteryQuality }) => {
    try {
      const form = new FormData();
      form.append('Name', name ?? '');
      form.append('Description', description ?? '');
      form.append('Image', (image ?? imageUrl) ?? '');
      form.append('AccountId', accountId ?? '');
      form.append('StationId', stationId ?? '');
      form.append('BatteryId', batteryId ?? '');
      form.append('ReportType', reportType ?? 'General');
      form.append('ExchangeBatteryId', exchangeBatteryId ?? '');
      form.append('Capacity', capacity ?? Capacity ?? '');
      form.append('BatteryQuality', batteryQuality ?? BatteryQuality ?? '');

      const res = await api.post('/api/BatteryReport/add_battery_report', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Tạo Battery Report thất bại';
      throw new Error(msg);
    }
  },
  // Lấy danh sách Battery Reports theo batteryId
  getBatteryReportsByBatteryId: async (batteryId) => {
    if (!batteryId) return [];
    try {
      const res = await api.get('/api/BatteryReport/get_battery_reports_by_battery_id', {
        params: { batteryId }
      });
      if (res?.data?.isSuccess && Array.isArray(res.data.data)) {
        return res.data.data;
      }
      if (Array.isArray(res?.data)) return res.data;
      return [];
    } catch (err) {
      const code = err?.response?.status;
      // Nếu 404 thì luôn throw error với message yêu cầu
      if (code === 404) {
        throw new Error('Chưa có báo cáo pin nào');
      }
      const msg = err?.response?.data?.message || err?.message || 'Chưa có báo cáo pin nào';
      throw new Error(msg);
    }
  },

  getBatteryReportsByStation: async (stationId) => {
    if (!stationId) return [];
    try {
      const res = await api.get('/api/BatteryReport/get_battery_reports_by_station', {
        params: { stationId }
      });
      if (res?.data?.isSuccess && Array.isArray(res.data.data)) {
        return res.data.data;
      }
      if (Array.isArray(res?.data)) return res.data;
      return [];
    } catch (err) {
      const code = err?.response?.status;
      if (code === 404) {
        throw new Error('Chưa có báo cáo pin nào cho trạm này');
      }
      const msg = err?.response?.data?.message || err?.message || 'Không thể lấy danh sách báo cáo pin của trạm';
      throw new Error(msg);
    }
  },

  addBatteryReportDirect: async (accountId, vin) => {
    try {
      const formData = new FormData();
      formData.append('AccountId', accountId);
      formData.append('VIN', vin);

      const res = await api.post('/api/BatteryReport/add_battery_report_direct', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return res.data;
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Tạo báo cáo pin trực tiếp thất bại';
      throw new Error(msg);
    }
  },



  //EXCHANGE BATTERY APIs
  getExchangeBatteryByExchangeId: async (exchangeId) => {
    if (!exchangeId) return null;
    try {
      // Controller định nghĩa: GET /api/ExchangeBattery/get_exchange_battery_by_exchange{id}
      // -> phải nối trực tiếp id vào cuối path
      const res = await api.get(`/api/ExchangeBattery/get_exchange_battery_by_exchange${exchangeId}`);
      // Chuẩn hoá: nếu BE bọc wrapper { isSuccess, data }
      if (res?.data?.isSuccess && res?.data?.data) return res.data.data;
      // Một số tình huống có thể trả raw object
      if (res?.status === 200 && res?.data) return res.data;
      return null;
    } catch (err) {
      const code = err?.response?.status;
      if (code === 404) return null;
      const msg = err?.response?.data?.message || err?.message || 'Không lấy được chi tiết ExchangeBattery';
      throw new Error(msg);
    }
  },

  getExchangeByStation: async (stationId) => {
    try {
      const res = await api.get(`/api/ExchangeBattery/get_exchange_by_station/${stationId}`);
      if (res.data?.isSuccess && res.data?.data) {
        return res.data.data;
      }
      return null;
    } catch (err) {
      // Nếu không trả gì thì trạm chưa có giao dịch đổi pin cho trạm này
      const code = err?.response?.status;
      if (code === 404 || code === 204) {
        // Không có dữ liệu hoặc chưa có giao dịch => trả null
        return null;
      }
      const msg = err?.response?.data?.message || err?.message || "Lỗi khi lấy thông tin đổi pin theo trạm";
      throw new Error(msg);
    }
  },

  getExchangesBySchedule: async (stationscheduleId) => {
    if (!stationscheduleId) return null;
    try {
      const res = await api.get(`/api/ExchangeBattery/get_exchanges_by_schedule/${stationscheduleId}`);
      // Chuẩn hoá kết quả trả về nếu backend bọc trong { isSuccess, data }
      if (res?.data?.isSuccess && res?.data?.data) {
        return res.data.data;
      }
      // Có thể backend trả raw object/list
      if (Array.isArray(res?.data)) {
        return res.data;
      }
      return null;
    } catch (err) {
      const code = err?.response?.status;
      if (code === 404) return null;
      const msg = err?.response?.data?.message || err?.message || 'Không lấy được danh sách đổi pin từ lịch';
      throw new Error(msg);
    }
  },

  getExchangesByStation: async (stationId) => {
    if (!stationId) throw new Error('stationId is required');
    const safeId = encodeURIComponent(stationId);
    const res = await api.get(`/api/ExchangeBattery/get_exchange_by_station/${safeId}`);
    return res.data; // { data: [...] } hoặc mảng
  },

  getPendingExchangeByVINAndAccountId: async (vin, accountId) => {
    if (!vin || !accountId) throw new Error('vin and accountId are required');
    try {
      const res = await api.get('/api/ExchangeBattery/get_pending_exchange_by_VIN_and_AccountId', {
        params: { vin, accountId }
      });
      // Chuẩn hóa trả về: giả định BE bọc trong { isSuccess, data }
      if (res?.data?.isSuccess && res?.data?.data) return res.data.data;
      if (Array.isArray(res?.data)) return res.data;
      return res.data || null;
    } catch (err) {
      const code = err?.response?.status;
      if (code === 404 || code === 204) {
        // Không có giao dịch pending => trả null
        return null;
      }
      const msg = err?.response?.data?.message || err?.message || 'Lỗi khi lấy giao dịch đổi pin chờ xử lý theo VIN và accountId';
      throw new Error(msg);
    }
  },

  updateExchangeStatus: async (payload) => {
    if (!payload) throw new Error('Missing payload');

    // Normalize keys from possible variants
    const ExchangeBatteryId =
      payload.ExchangeBatteryId || payload.exchangeBatteryId || payload.ExchangeId || payload.id;
    const StaffId =
      payload.StaffId || payload.staffId || payload.staffID || payload.accountId;

    // Normalize status, e.g., 'completed' => 'Completed', 'CANCELLED' => 'Cancelled'
    const rawStatus = payload.Status || payload.status;
    const Status = typeof rawStatus === 'string'
      ? rawStatus.charAt(0).toUpperCase() + rawStatus.slice(1).toLowerCase()
      : rawStatus;

    if (!ExchangeBatteryId || !Status || !StaffId) {
      throw new Error('Missing payload fields (ExchangeBatteryId / Status / StaffId)');
    }

    // Prepare multipart/form-data
    const formData = new FormData();
    formData.append('ExchangeBatteryId', ExchangeBatteryId);
    formData.append('Status', Status);
    formData.append('StaffId', StaffId);

    const res = await api.put(
      '/api/ExchangeBattery/update_exchange_battery_status',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    );
    return res.data;
  },
  updateExchangeStatusV2: async ({ exchangeBatteryId, status }) => {
    if (!exchangeBatteryId) {
      throw new Error('Missing required field: exchangeBatteryId');
    }
    if (!status) {
      throw new Error('Missing required field: status');
    }

    // Normalize fields
    const ExchangeBatteryId = exchangeBatteryId;
    const Status = typeof status === 'string'
      ? status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()
      : status;

    const formData = new FormData();
    formData.append('ExchangeBatteryId', ExchangeBatteryId);
    formData.append('Status', Status);

    try {
      const res = await api.put(
        '/api/ExchangeBattery/update_exchange_battery_status',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      return res.data;
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Lỗi cập nhật trạng thái giao dịch đổi pin';
      throw new Error(msg);
    }
  },

  // Trong authAPI object, cập nhật hàm uploadToCloudinary:
  uploadToCloudinary: async (file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      console.log('Uploading file to Cloudinary:', file.name, file.type, file.size);

      const response = await api.post('/api/Cloudinary/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      });

      console.log('FULL Cloudinary upload response:', response);
      console.log('Response data:', response.data);
      console.log('Response data.data:', response.data?.data);

      return response.data;
    } catch (error) {
      console.error('Cloudinary upload error details:', error);
      console.error('Error response:', error.response);
      const errorMsg = error?.response?.data?.message ||
        error?.message ||
        JSON.stringify(error) ||
        'Upload image failed';
      throw new Error(errorMsg);
    }
  },

  // Thêm vào authAPI.js trong object authAPI
  getStationSchedulesByStationId: async (stationId) => {
    try {
      const response = await api.get('/api/StationSchedule/get_station_schedules_by_station_id', {
        params: { stationId }
      });
      return response.data;
    } catch (error) {
      throw new Error(error?.message || JSON.stringify(error) || 'Get station schedules failed');
    }
  },

  // ======== NEW: ORDER + PAYOS ========
  /**
    * Create Order theo rule:
    * - serviceType: 'Package' | 'PrePaid' | 'UsePackage' | 'PaidAtStation'
    * - Với PrePaid/UsePackage: KHÔNG gửi Vin, KHÔNG gửi ExchangeId; ServiceId = formId
    * - Với PaidAtStation: PHẢI gửi ExchangeId (ServiceId = formId), KHÔNG gửi Vin
    * - Với Package: PHẢI gửi Vin, KHÔNG gửi ExchangeId; ServiceId = packageId
    */
  createOrder: async ({
    serviceType,
    total,
    accountId,
    serviceId,      // formId hoặc packageId tùy loại
    batteryId,
    vin,            // chỉ gửi khi serviceType === 'Package'
    exchangeBatteryId, // alias khuyến nghị (mới)
    ExchangeBatteryId, // alias không chuẩn hoá (đã dùng trước đó)
    exchangeId,        // alias cũ: ExchangeId
  }) => {
    try {
      const form = new FormData();
      form.append('ServiceType', serviceType); // backend nên map với enum PaymentType
      form.append('AccountId', accountId ?? '');// sau các dòng append gốc:
      form.append('accountId', accountId);
      form.append('AccountID', accountId);
      form.append('Total', total);
      form.append('serviceId', serviceId);
      form.append('ServiceID', serviceId);

      form.append('batteryId', batteryId);
      form.append('BatteryID', batteryId);

      form.append('ServiceId', serviceId ?? '');
      form.append('BatteryId', batteryId ?? '');

      // Rule theo mô tả:
      if (serviceType === 'Package') {
        if (!vin) throw new Error('Vin là bắt buộc khi mua gói (Package).');
        form.append('Vin', vin);
      }
      if (serviceType === 'PaidAtStation') {
        const effectiveExchangeId = exchangeBatteryId || ExchangeBatteryId || exchangeId;
        if (!effectiveExchangeId) throw new Error('ExchangeBatteryId/ExchangeId là bắt buộc khi thanh toán tại trạm.');
        // BE hiện chấp nhận ExchangeId; vẫn gửi kèm ExchangeBatteryId để tương thích
        form.append('ExchangeId', effectiveExchangeId);
        form.append('ExchangeBatteryId', effectiveExchangeId);
      }
      // PrePaid / UsePackage: KHÔNG gửi Vin + ExchangeId => không append 2 field này

      const res = await api.post('/api/Order/create_order', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data; // kỳ vọng { isSuccess, data: { orderId, ... } }
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Tạo Order thất bại';
      throw new Error(msg);
    }
  },


  // serviceId = formId
  getOrdersServiceId: async (formId) => {
    if (!formId) throw new Error('formId is required');
    try {
      const res = await api.get('/api/Order/get_order_by_service_id', {
        params: { serviceId: formId }
      });
      // Đảm bảo luôn trả về data[] để code phía trên xử lý chuẩn
      if (res?.data?.data && Array.isArray(res.data.data)) {
        return res.data.data;
      } else if (res?.data?.data) {
        // Nếu data là object thì trả về mảng chứa object đó
        return [res.data.data];
      } else {
        // Nếu không có data, trả về mảng rỗng hoặc response gốc nếu cần debug
        return [];
      }
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Lấy đơn hàng theo formId thất bại';
      throw new Error(msg);
    }
  },

  // LẤY ORDER BY ID (xác minh trạng thái thanh toán)
  getOrderById: async (orderId) => {
    if (!orderId) throw new Error('orderId is required');
    // Backend route: /api/Order/get_order_by_{orderId}
    const safeId = encodeURIComponent(orderId);
    const res = await api.get(`/api/Order/get_order_by_${safeId}`);
    return res.data; // kỳ vọng { data: { orderId, status, total, ... } } hoặc object trực tiếp
  },
  /**
   * Thanh toán tiền mặt tại trạm.*/
  payInCashAtStation: async ({ ExchangeBatteryId, FormId, Total }) => {
    if (!ExchangeBatteryId || !FormId || typeof Total !== 'number') {
      throw new Error('ExchangeBatteryId, FormId và Total là bắt buộc');
    }
    try {
      const form = new FormData();
      form.append('ExchangeBatteryId', ExchangeBatteryId);
      form.append('FormId', FormId);
      form.append('Total', Total);

      const res = await api.post('/api/Order/paid_in_cash_at_station', form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return res.data;
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Thanh toán tiền mặt tại trạm thất bại';
      throw new Error(msg);
    }
  },

  /**
   * Gọi PayOS để tạo link thanh toán
   * Body JSON: { orderId, description }
   */
  createPayOSPayment: async ({ orderId, description }) => {
    try {
      const res = await api.post('/api/PayOS/create-payment', {
        orderId,
        description,
      });
      return res.data; // kỳ vọng { isSuccess, data: { checkoutUrl, ... } }
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Tạo thanh toán PayOS thất bại';
      throw new Error(msg);
    }
  },

  // Trong authAPI object
  getAllStationSchedules: async () => {
    try {
      const response = await api.get('/api/StationSchedule/get_all_station_schedules');
      return response.data;
    } catch (error) {
      throw new Error(error?.message || JSON.stringify(error) || 'Get all station schedules failed');
    }
  },

  // Thêm vào authAPI object
  getReportsByStationId: async (stationId) => {
    try {
      const response = await api.get('/api/Report/get_reports_by_station_id', {
        params: { stationId }
      });
      return response.data;
    } catch (error) {
      throw new Error(error?.message || JSON.stringify(error) || 'Get reports by station id failed');
    }
  },
  getStationSchedulesByAccountId: async (accountId) => {
    try {
      const response = await api.get('/api/StationSchedule/get_station_schedules_by_account_id', {
        params: { accountId }
      });
      return response.data;
    } catch (error) {
      throw new Error(error?.message || JSON.stringify(error) || 'Get station schedules by account id failed');
    }
  },
  getOrdersByAccountId: async (accountId) => {
    try {
      const response = await api.get('/api/Order/get_orders_by_account_id', {
        params: { accountId }
      });
      return response.data;
    } catch (error) {
      throw new Error(error?.message || JSON.stringify(error) || 'Get orders by account id failed');
    }
  },
  // Add this to your authAPI object in authAPI.js
  getDashboardSummary: async () => {
    try {
      const response = await api.get('/api/dashboard/summary');
      return response.data;
    } catch (error) {
      throw new Error(error?.message || JSON.stringify(error) || 'Get dashboard summary failed');
    }
  },

  // Dashboard APIs
  showDashboard: async (formData) => {
    try {
      const response = await api.post('/api/dashboard/show_dashboard', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    } catch (error) {
      throw new Error(error?.message || JSON.stringify(error) || 'Get dashboard data failed');
    }
  },

  getTotalUsers: async (formData) => {
    try {
      const response = await api.post('/api/dashboard/total_user', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    } catch (error) {
      throw new Error(error?.message || JSON.stringify(error) || 'Get total users failed');
    }
  },

  getTotalRevenue: async (formData) => {
    try {
      const response = await api.post('/api/dashboard/total_revenue', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    } catch (error) {
      throw new Error(error?.message || JSON.stringify(error) || 'Get total revenue failed');
    }
  },

  // Add this to your authAPI object in authAPI.js
  getTotalExchangeBattery: async (formData) => {
    try {
      const response = await api.post('/api/dashboard/total_exchange_battery', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    } catch (error) {
      throw new Error(error?.message || JSON.stringify(error) || 'Get total exchange battery failed');
    }
  },

  // =================== GOOGLE LOGIN FLOW ===================
  getGoogleLoginUrl: async () => {
    try {
      const res = await api.get('/api/Account/login-google');
      // backend có thể trả { requestUrl: "..."} hoặc string trực tiếp
      return res.data?.requestUrl || res.data || null;
    } catch (error) {
      console.error('Error getting Google login URL:', error);
      throw new Error('Không lấy được đường dẫn đăng nhập Google');
    }
  },

  getGoogleAccessToken: async () => {
    try {
      const res = await api.get('/api/Account/google-response');
      return (
        res?.data?.accessToken ||
        res?.data?.token ||
        res?.accessToken ||
        res?.token ||
        null
      );
    } catch (error) {
      console.error('Error getting Google access token:', error);
      throw new Error('Không lấy được access token từ Google');
    }
  },
// Thêm vào authAPI object trong authAPI.js
updateReportStatus: async (reportId, status) => {
  try {
    const formData = new FormData();
    formData.append("ReportID", reportId);
    formData.append("Status", status);

    const response = await api.put('/api/Report/update_report_status', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  } catch (error) {
    throw new Error(error?.message || JSON.stringify(error) || 'Update report status failed');
  }
},
};

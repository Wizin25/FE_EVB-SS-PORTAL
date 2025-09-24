import axios from 'axios';

const API_BASE_URL = 'https://localhost:7000'; // giữ nguyên nếu BE chạy đây

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // nếu backend dùng cookie-based auth, thì bật withCredentials: true
  // withCredentials: true
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Optional: interceptor for responses to normalize errors
api.interceptors.response.use(
  res => res,
  err => {
    // chuẩn hoá lỗi để frontend dễ xử lý
    const payload = err.response?.data ?? { message: err.message ?? 'Unknown error' };
    return Promise.reject(payload);
  }
);

export default api;

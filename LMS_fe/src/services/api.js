import axios from 'axios';

// Khởi tạo instance với URL động từ file .env
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL, 
  timeout: 10000, // Ngắt kết nối nếu server không phản hồi sau 10 giây
});
// Tự động đính kèm token vào mọi request nếu có
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
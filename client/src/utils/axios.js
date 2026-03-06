import axios from 'axios';

const API_URL = import.meta.env.REACT_APP_API_UR || 'http://localhost:5000/api';

const axiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    console.log(`Making ${config.method.toUpperCase()} request to: ${config.url}`);
    console.log('With credentials:', config.withCredentials);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
// Response interceptor - FIXED
axiosInstance.interceptors.response.use(
  (response) => {
    if (import.meta.env.DEV) {
      console.log('Response received:', response.status);
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Prevent infinite loop and only handle 401 errors
    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url.includes('/auth/login')) {
      originalRequest._retry = true;

      try {
        const refreshResponse = await axios.post(
          `${API_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );
        
        if (refreshResponse.status === 200) {
          return axiosInstance(originalRequest);
        }
      } catch (refreshError) {
        // Only redirect to login if we're not already there and not during login
        if (!window.location.pathname.includes('/login') && !originalRequest.url.includes('/auth/login')) {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export default axiosInstance;
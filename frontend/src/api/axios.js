import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true, // Crucial for HTTP-only cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a response interceptor to handle token expiration/unauthorized errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Prevent infinite loop if the refresh request itself fails with 401
    // or if we've already tried to retry this request once.
    // Also skip refresh for login requests.
    if (
      error.response?.status === 401 && 
      !originalRequest._retry && 
      !originalRequest.url.includes('/auth/refresh') &&
      !originalRequest.url.includes('/auth/login')
    ) {
      originalRequest._retry = true;

      try {
        // Attempt to get a new access token using the refresh token (cookie-based)
        await api.post('/auth/refresh');
        
        // If refresh successful, retry the original request
        return api(originalRequest);
      } catch (refreshError) {
        // If refresh fails, session is truly expired. 
        // Break the loop and reject.
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// src/services/api.js
import axios from 'axios';

const apiClient = axios.create({
  baseURL: '/api', 
});

// Interceptor para añadir el token a todas las peticiones protegidas
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default apiClient;
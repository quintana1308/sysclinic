import axios, { AxiosInstance, AxiosResponse } from 'axios';
import toast from 'react-hot-toast';

// Configuración base de la API
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Crear instancia de axios
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar token de autenticación
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

// Interceptor para manejar respuestas
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error) => {
    const errorCode = error.response?.data?.code;
    const errorMessage = error.response?.data?.message;
    const status = error.response?.status;
    
    // Manejar errores de licencia (403 con códigos específicos)
    if (status === 403 && errorCode && errorCode.includes('LICENSE')) {
      console.log('🚫 Error de licencia en request:', {
        code: errorCode,
        message: errorMessage,
        url: error.config?.url
      });
      
      // Guardar datos para la página de estado de licencia
      const licenseStatusData = {
        code: errorCode,
        message: errorMessage,
        licenseInfo: error.response?.data?.licenseInfo
      };
      
      localStorage.setItem('licenseStatusData', JSON.stringify(licenseStatusData));
      
      // Limpiar token y redirigir a la página de estado de licencia
      localStorage.removeItem('token');
      window.location.href = '/license-status';
      
      return Promise.reject(error);
    }
    
    // Manejar errores de autenticación normales
    if (status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/';
    }
    
    return Promise.reject(error);
  }
);

export default api;

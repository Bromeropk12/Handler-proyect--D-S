import axios from 'axios';

// URL base del API desde variable de entorno o valor por defecto
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Crear instancia de axios
const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar token
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

// Interceptor para manejar errores
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expirado o inválido
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// Funciones helper para cada entidad
export const samplesAPI = {
  getAll: (params) => api.get('/samples/', { params }),
  getById: (id) => api.get(`/samples/${id}`),
  create: (data) => api.post('/samples/', data),
  update: (id, data) => api.put(`/samples/${id}`, data),
  delete: (id) => api.delete(`/samples/${id}`),
  getMovements: (id) => api.get(`/samples/${id}/movements`),
  generateLabels: (id, data) => api.post(`/samples/${id}/labels`, data),
  getPdf: (id) => api.get(`/samples/${id}/pdf`, { responseType: 'blob' }),
  importExcel: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/samples/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export const movementsAPI = {
  getAll: (params) => api.get('/movements/', { params }),
  create: (data) => api.post('/movements/', data),
};

export const compatibilityAPI = {
  getAll: () => api.get('/compatibility/'),
  create: (data) => api.post('/compatibility/', data),
};

export const usersAPI = {
  getMe: () => api.get('/users/me'),
  create: (data) => api.post('/users/', data),
};

import axios from 'axios';

// URL base del API desde variable de entorno o valor por defecto
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Nombre de la cookie del token
const TOKEN_COOKIE_NAME = 'access_token';

// Función para obtener token de cookies
const getTokenFromCookie = () => {
  const name = TOKEN_COOKIE_NAME + '=';
  const decodedCookie = decodeURIComponent(document.cookie);
  const ca = decodedCookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) === 0) {
      return c.substring(name.length, c.length);
    }
  }
  return null;
};

// Función para guardar token en cookies
export const setTokenCookie = (token) => {
  // Cookie expira en 24 horas
  const expires = new Date();
  expires.setTime(expires.getTime() + 24 * 60 * 60 * 1000);
  document.cookie = `${TOKEN_COOKIE_NAME}=${token};expires=${expires.toUTCString()};path=/;SameSite=Strict`;
};

// Función para eliminar token de cookies
export const removeTokenCookie = () => {
  document.cookie = `${TOKEN_COOKIE_NAME}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
};

// Crear instancia de axios
const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Habilitar credenciales para cookies
});

// Interceptor para agregar token desde cookies
api.interceptors.request.use(
  (config) => {
    // ✅ MEJORA: Usar cookies en lugar de localStorage para mayor seguridad
    const token = getTokenFromCookie();
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
      // Token expirado o inválido - limpiar cookie
      removeTokenCookie();
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

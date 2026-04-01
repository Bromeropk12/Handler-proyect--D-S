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
  withCredentials: true,
});

// Interceptor para agregar token desde cookies
api.interceptors.request.use(
  (config) => {
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
      // Solo redirigir si no estamos en la página de login
      const isLoginPage = window.location.pathname === '/login' || window.location.pathname === '/';
      if (!isLoginPage) {
        removeTokenCookie();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// Funciones de usuarios
export const usersAPI = {
  getMe: () => api.get('/users/me'),
  create: (data) => api.post('/users/', data),
};

// Funciones de Proveedores
export const proveedoresAPI = {
  getAll: (params) => api.get('/proveedores/', { params }),
  getById: (id) => api.get(`/proveedores/${id}`),
  create: (data) => api.post('/proveedores/', data),
  update: (id, data) => api.put(`/proveedores/${id}`, data),
  delete: (id) => api.delete(`/proveedores/${id}`),
  getOptions: () => api.get('/proveedores/active/options'),
};

// Funciones de Clases de Peligro
export const clasesPeligroAPI = {
  getAll: (params) => api.get('/clases-peligro/', { params }),
  getById: (id) => api.get(`/clases-peligro/${id}`),
  create: (data) => api.post('/clases-peligro/', data),
  update: (id, data) => api.put(`/clases-peligro/${id}`, data),
  delete: (id) => api.delete(`/clases-peligro/${id}`),
  getOptions: () => api.get('/clases-peligro/active/options'),
};

// Funciones de Muestras
export const muestrasAPI = {
  getAll: (params) => api.get('/muestras/', { params }),
  getById: (id) => api.get(`/muestras/${id}`),
  create: (data) => api.post('/muestras/', data),
  update: (id, data) => api.put(`/muestras/${id}`, data),
  delete: (id) => api.delete(`/muestras/${id}`),
  getStats: () => api.get('/muestras/stats/summary'),
  getLineasNegocioOptions: () => api.get('/muestras/options/lineas-negocio'),
  getDimensionesOptions: () => api.get('/muestras/options/dimensiones'),
  getEstadosOptions: () => api.get('/muestras/options/estados'),
};

export const ubicacionAPI = {
  sugerir: (muestra_id, ignorar_compatibilidad = false) => 
    api.post('/api/ubicacion/sugerir', { muestra_id, ignorar_compatibilidad }),
  asignar: (muestra_id, hilera_id) => 
    api.post('/api/ubicacion/asignar', { muestra_id, hilera_id }),
  verificar: (muestra_id, hilera_id) => 
    api.get(`/api/ubicacion/verificar/${muestra_id}/${hilera_id}`),
  getMatriz: () => api.get('/api/ubicacion/compatibilidad/matriz'),
  getIncompatibles: (clase_codigo) => 
    api.get(`/api/ubicacion/compatibilidad/incompatibles/${clase_codigo}`),
};

export const dosificacionAPI = {
  validar: (cantidad_total, unidades, gramos_por_unidad) => 
    api.post('/api/dosificacion/validar', { cantidad_total, unidades, gramos_por_unidad }),
  crearSubmuestras: (muestra_parent_id, unidades, gramos_por_unidad, observaciones) => 
    api.post('/api/dosificacion/crear-submuestras', { 
      muestra_parent_id, unidades, gramos_por_unidad, observaciones 
    }),
  getInfo: (muestra_id) => api.get(`/api/dosificacion/info/${muestra_id}`),
  listarSubmuestras: (muestra_parent_id) => 
    api.get(`/api/dosificacion/submuestras/${muestra_parent_id}`),
  getContadorSubmuestras: (muestra_id) =>
    api.get(`/api/dosificacion/contador-submuestras/${muestra_id}`),
};

export const fefoAPI = {
  buscar: (params) => api.get('/api/fefo/buscar', { params }),
  sugerir: (muestra_nombre, cantidad_gramos) => 
    api.post('/api/fefo/sugerir', { muestra_nombre, cantidad_gramos }),
  getProximasVencer: (dias) => api.get(`/api/fefo/proximas-vencer?dias=${dias}`),
};

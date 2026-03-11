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

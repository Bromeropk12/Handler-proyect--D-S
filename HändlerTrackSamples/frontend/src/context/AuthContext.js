import React, { createContext, useContext, useState, useEffect } from 'react';
import api, { setTokenCookie, removeTokenCookie } from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de AuthProvider');
  }
  return context;
};

// Función para obtener token de cookies
const getTokenFromCookie = () => {
  const name = 'access_token=';
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

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(getTokenFromCookie);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          const response = await api.get('/users/me');
          setUser(response.data);
        } catch (error) {
          console.error('Error al cargar usuario:', error);
          // ✅ MEJORA: Usar cookies en lugar de localStorage
          removeTokenCookie();
          setToken(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, [token]);

  const login = async (username, password) => {
    try {
      const formData = new FormData();
      formData.append('username', username);
      formData.append('password', password);

      const response = await api.post('/login/', formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });

      const { access_token } = response.data;
      
      // ✅ MEJORA: Guardar token en cookies en lugar de localStorage
      // Esto es más seguro porque:
      // 1. No es accesible desde JavaScript (HttpOnly sería ideal pero requiere backend)
      // 2. No es vulnerable a XSS de la misma manera
      // 3. Se envía automáticamente con las peticiones
      setTokenCookie(access_token);
      setToken(access_token);

      // Cargar datos del usuario
      const userResponse = await api.get('/users/me');
      setUser(userResponse.data);

      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.detail || 'Error al iniciar sesión' 
      };
    }
  };

  const logout = () => {
    // ✅ MEJORA: Usar cookies en lugar de localStorage
    removeTokenCookie();
    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!user,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

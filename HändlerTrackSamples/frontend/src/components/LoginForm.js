import React from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
} from '@mui/material';
import { COLORS, loginBoxStyles } from '../constants/theme';

/**
 * Componente: LoginForm
 * Descripción: Formulario de autenticación de usuario
 */
const LoginForm = ({ username, password, error, loading, onUsernameChange, onPasswordChange, onSubmit }) => {
  return (
    <Box sx={loginBoxStyles}>
      {/* Logo */}
      <LogoSection />

      {/* Título */}
      <Typography
        variant="h5"
        sx={{ color: COLORS.charcoal, fontWeight: 600, mb: 1, textAlign: 'center' }}
      >
        Bienvenido
      </Typography>
      <Typography
        variant="body2"
        sx={{ color: 'rgba(18,12,19,0.6)', mb: 3, textAlign: 'center' }}
      >
        Ingresa tus credenciales para continuar
      </Typography>

      {/* Mensaje de error */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Formulario */}
      <form onSubmit={onSubmit}>
        <TextField
          fullWidth
          label="Usuario"
          placeholder="Ingresa tu usuario"
          value={username}
          onChange={(e) => onUsernameChange(e.target.value)}
          margin="normal"
          required
          autoFocus
          sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
        />
        <TextField
          fullWidth
          label="Contraseña"
          placeholder="Ingresa tu contraseña"
          type="password"
          value={password}
          onChange={(e) => onPasswordChange(e.target.value)}
          margin="normal"
          required
          sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
        />
        <Button
          fullWidth
          type="submit"
          disabled={loading}
          sx={{
            mt: 2,
            py: 1.5,
            bgcolor: COLORS.red,
            color: COLORS.white,
            fontWeight: 600,
            fontSize: '1rem',
            borderRadius: 2,
            '&:hover': { bgcolor: '#c41e2a' },
            '&:disabled': { bgcolor: 'rgba(234,34,44,0.5)' },
          }}
        >
          {loading ? <CircularProgress size={24} color="inherit" /> : 'Iniciar Sesión'}
        </Button>
      </form>

      {/* Pie de formulario */}
      <Typography
        variant="caption"
        sx={{ display: 'block', textAlign: 'center', mt: 3, color: 'rgba(18,12,19,0.4)' }}
      >
        Sistema de gestión de muestras
      </Typography>
    </Box>
  );
};

/**
 * Componente interno: LogoSection
 * Sección del logo de Händler
 */
const LogoSection = () => (
  <Box sx={{ textAlign: 'center', mb: 4 }}>
    <Box
      component="img"
      src="/logo.png"
      alt="Händler Logo"
      sx={{ height: 80, objectFit: 'contain', mb: 2 }}
      onError={(e) => { e.target.style.display = 'none'; }}
    />
    <Typography variant="caption" sx={{ color: 'rgba(18,12,19,0.6)', letterSpacing: 2, fontWeight: 500 }}>
      TrackSamples
    </Typography>
  </Box>
);

export default LoginForm;

import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Paper,
  IconButton,
  InputAdornment,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { LOGIN_GRADIENT } from '../constants/theme';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    palabraClave: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    new: false,
    confirm: false,
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (field) => (event) => {
    setFormData({ ...formData, [field]: event.target.value });
    setError('');
    setSuccess('');
  };

  const togglePasswordVisibility = (field) => () => {
    setShowPasswords({ ...showPasswords, [field]: !showPasswords[field] });
  };

  const validatePassword = (password) => {
    const errors = [];
    if (password.length < 8) errors.push('al menos 8 caracteres');
    if (!/[A-Z]/.test(password)) errors.push('una mayúscula');
    if (!/[a-z]/.test(password)) errors.push('una minúscula');
    if (!/\d/.test(password)) errors.push('un número');
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) errors.push('un carácter especial');
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.username || !formData.palabraClave || !formData.newPassword || !formData.confirmPassword) {
      setError('Todos los campos son obligatorios');
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    const passwordErrors = validatePassword(formData.newPassword);
    if (passwordErrors.length > 0) {
      setError(`La contraseña debe contener: ${passwordErrors.join(', ')}`);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('http://localhost:8000/users/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          palabra_clave: formData.palabraClave,
          new_password: formData.newPassword,
          confirm_password: formData.confirmPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(data.message || 'Contraseña reseteada exitosamente');
        setTimeout(() => navigate('/login'), 3000);
      } else {
        setError(data.detail || 'Error al resetear la contraseña');
      }
    } catch (err) {
      setError('Error de conexión. Verifica que el servidor esté funcionando.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={styles.container}>
      <Box sx={styles.background} />
      <Paper sx={styles.paper} elevation={3}>
        <IconButton
          onClick={() => navigate('/login')}
          sx={styles.backButton}
          aria-label="Volver al login"
        >
          <ArrowBackIcon />
        </IconButton>

        <Box sx={styles.logoSection}>
          <Box
            component="img"
            src="/logo.png"
            alt="Händler Logo"
            sx={{ height: 60, objectFit: 'contain', mb: 1 }}
            onError={(e) => { e.target.style.display = 'none'; }}
          />
          <Typography variant="caption" sx={{ color: 'rgba(18,12,19,0.6)', letterSpacing: 2, fontWeight: 500 }}>
            TrackSamples
          </Typography>
        </Box>

        <Typography variant="h5" sx={styles.title}>
          Recuperar Contraseña
        </Typography>
        <Typography variant="body2" sx={styles.subtitle}>
          Ingresa tus datos para resetear la contraseña
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2, width: '100%' }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2, width: '100%' }}>
            {success}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Usuario"
            placeholder="Ingresa el nombre de usuario"
            value={formData.username}
            onChange={handleChange('username')}
            margin="normal"
            required
            sx={styles.textField}
          />

          <TextField
            fullWidth
            label="Palabra Clave de Administrador"
            placeholder="Ingresa la palabra clave del .env"
            value={formData.palabraClave}
            onChange={handleChange('palabraClave')}
            margin="normal"
            required
            sx={styles.textField}
          />

          <TextField
            fullWidth
            label="Nueva Contraseña"
            placeholder="Ingresa la nueva contraseña"
            type={showPasswords.new ? 'text' : 'password'}
            value={formData.newPassword}
            onChange={handleChange('newPassword')}
            margin="normal"
            required
            sx={styles.textField}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={togglePasswordVisibility('new')} edge="end">
                    {showPasswords.new ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <TextField
            fullWidth
            label="Confirmar Contraseña"
            placeholder="Confirma la nueva contraseña"
            type={showPasswords.confirm ? 'text' : 'password'}
            value={formData.confirmPassword}
            onChange={handleChange('confirmPassword')}
            margin="normal"
            required
            sx={styles.textField}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={togglePasswordVisibility('confirm')} edge="end">
                    {showPasswords.confirm ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <Button
            fullWidth
            type="submit"
            disabled={loading}
            sx={styles.submitButton}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Resetear Contraseña'}
          </Button>
        </form>

        <Typography variant="body2" sx={styles.loginLink}>
          ¿Recordaste tu contraseña?{' '}
          <RouterLink to="/login" style={{ color: '#ea222c', textDecoration: 'none', fontWeight: 600 }}>
            Iniciar Sesión
          </RouterLink>
        </Typography>
      </Paper>
    </Box>
  );
};

const styles = {
  container: {
    display: 'flex',
    minHeight: '100vh',
    width: '100%',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  background: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: LOGIN_GRADIENT,
    zIndex: -1,
  },
  paper: {
    width: '100%',
    maxWidth: 420,
    p: 4,
    borderRadius: 3,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    top: 16,
    left: 16,
    color: 'rgba(18,12,19,0.6)',
  },
  logoSection: {
    textAlign: 'center',
    mb: 2,
  },
  title: {
    color: '#121215',
    fontWeight: 600,
    textAlign: 'center',
    mb: 0.5,
  },
  subtitle: {
    color: 'rgba(18,12,19,0.6)',
    textAlign: 'center',
    mb: 3,
  },
  textField: {
    '& .MuiOutlinedInput-root': {
      borderRadius: 2,
    },
  },
  submitButton: {
    mt: 3,
    py: 1.5,
    bgcolor: '#ea222c',
    color: '#fff',
    fontWeight: 600,
    fontSize: '1rem',
    borderRadius: 2,
    '&:hover': { bgcolor: '#c41e2a' },
    '&:disabled': { bgcolor: 'rgba(234,34,44,0.5)' },
  },
  loginLink: {
    display: 'block',
    textAlign: 'center',
    mt: 3,
    color: 'rgba(18,12,19,0.6)',
  },
};

export default ResetPassword;
import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  IconButton,
  InputAdornment,
  LinearProgress,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  alpha,
} from '@mui/material';
import { keyframes } from '@mui/system';
import {
  Visibility,
  VisibilityOff,
  CheckCircle,
  Cancel,
  Lock,
  LockOpen,
  ArrowBack,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

// Animaciones
const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
`;

const float = keyframes`
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
`;

// Colores de marca
const COLORS = {
  primary: '#7b1fa2',
  primaryLight: '#9c27b0',
  success: '#388e3c',
  error: '#d32f2f',
  warning: '#f57c00',
};

const ChangePassword = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Validaciones de contraseña
  const passwordRequirements = [
    { label: 'Al menos 8 caracteres', valid: formData.newPassword.length >= 8 },
    { label: 'Una letra mayúscula', valid: /[A-Z]/.test(formData.newPassword) },
    { label: 'Una letra minúscula', valid: /[a-z]/.test(formData.newPassword) },
    { label: 'Un número', valid: /\d/.test(formData.newPassword) },
    { label: 'Un carácter especial (!@#$%^&*...)', valid: /[!@#$%^&*(),.?":{}|<>]/.test(formData.newPassword) },
  ];

  const allRequirementsMet = passwordRequirements.every((req) => req.valid);
  const passwordsMatch = formData.newPassword === formData.confirmPassword && formData.confirmPassword !== '';
  const canSubmit = formData.currentPassword && allRequirementsMet && passwordsMatch;

  const handleChange = (field) => (event) => {
    setFormData({ ...formData, [field]: event.target.value });
    setError('');
  };

  const handleTogglePassword = (field) => () => {
    setShowPasswords({ ...showPasswords, [field]: !showPasswords[field] });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.post('/users/change-password', {
        current_password: formData.currentPassword,
        new_password: formData.newPassword,
        confirm_password: formData.confirmPassword,
      });
      setSuccess(true);
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al cambiar la contraseña');
    } finally {
      setLoading(false);
    }
  };

  // Calcular fortaleza de contraseña (0-100)
  const getPasswordStrength = () => {
    if (!formData.newPassword) return 0;
    let strength = 0;
    if (formData.newPassword.length >= 8) strength += 20;
    if (formData.newPassword.length >= 12) strength += 10;
    if (/[A-Z]/.test(formData.newPassword)) strength += 20;
    if (/[a-z]/.test(formData.newPassword)) strength += 20;
    if (/\d/.test(formData.newPassword)) strength += 15;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(formData.newPassword)) strength += 15;
    return Math.min(strength, 100);
  };

  const getStrengthColor = () => {
    const strength = getPasswordStrength();
    if (strength < 40) return 'error';
    if (strength < 70) return 'warning';
    return 'success';
  };

  const getStrengthLabel = () => {
    const strength = getPasswordStrength();
    if (strength < 40) return 'Débil';
    if (strength < 70) return 'Media';
    return 'Fuerte';
  };

  if (success) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: '#f5f5f5',
          p: 2,
          background: `radial-gradient(circle at center, ${alpha(COLORS.success, 0.05)} 0%, transparent 70%)`,
        }}
      >
        <Card 
          sx={{ 
            maxWidth: 450, 
            width: '100%', 
            textAlign: 'center',
            borderRadius: 4,
            animation: `${fadeIn} 0.5s ease`,
            border: `1px solid ${alpha(COLORS.success, 0.2)}`,
            boxShadow: `0 20px 60px ${alpha(COLORS.success, 0.15)}`,
          }}
        >
          <CardContent sx={{ p: 5 }}>
            <Box
              sx={{
                width: 100,
                height: 100,
                borderRadius: '50%',
                bgcolor: alpha(COLORS.success, 0.1),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 3,
                animation: `${float} 2s ease-in-out infinite`,
              }}
            >
              <CheckCircle sx={{ fontSize: 60, color: COLORS.success }} />
            </Box>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 700, color: '#1a1a1a' }}>
              ¡Contraseña actualizada!
            </Typography>
            <Typography color="text.secondary">
              Tu contraseña ha sido cambiada exitosamente. Serás redirigido al dashboard.
            </Typography>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: '#f5f5f5',
        p: 2,
        background: `radial-gradient(circle at top right, ${alpha(COLORS.primary, 0.05)} 0%, transparent 50%), radial-gradient(circle at bottom left, ${alpha(COLORS.primary, 0.03)} 0%, transparent 50%)`,
      }}
    >
      <Card 
        sx={{ 
          maxWidth: 520, 
          width: '100%',
          borderRadius: 4,
          border: `1px solid ${alpha(COLORS.primary, 0.1)}`,
          boxShadow: '0 20px 60px rgba(0,0,0,0.08)',
          animation: `${fadeIn} 0.4s ease`,
          overflow: 'hidden',
        }}
      >
        {/* Barra superior de color */}
        <Box
          sx={{
            height: 6,
            background: `linear-gradient(90deg, ${COLORS.primary}, ${COLORS.primaryLight})`,
          }}
        />
        
        <CardContent sx={{ p: 4 }}>
          {/* Encabezado */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <IconButton 
              onClick={() => navigate('/')} 
              sx={{ 
                mr: 1,
                bgcolor: alpha(COLORS.primary, 0.08),
                '&:hover': {
                  bgcolor: alpha(COLORS.primary, 0.15),
                }
              }}
            >
              <ArrowBack />
            </IconButton>
            <Box>
              <Typography variant="h5" component="h1" sx={{ fontWeight: 700, color: '#1a1a1a' }}>
                Cambiar Contraseña
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Actualiza tu credencial de acceso
              </Typography>
            </Box>
          </Box>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Ingresa tu contraseña actual y luego tu nueva contraseña dos veces para confirmarla.
          </Typography>

          {error && (
            <Alert 
              severity="error" 
              sx={{ 
                mb: 3,
                borderRadius: 2,
                border: `1px solid ${alpha(COLORS.error, 0.2)}`,
              }}
            >
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            {/* Contraseña Actual */}
            <TextField
              fullWidth
              label="Contraseña Actual"
              type={showPasswords.current ? 'text' : 'password'}
              value={formData.currentPassword}
              onChange={handleChange('currentPassword')}
              required
              sx={{ mb: 2.5 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock sx={{ color: COLORS.primary }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={handleTogglePassword('current')} edge="end">
                      {showPasswords.current ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Divider sx={{ my: 3 }}>
              <Typography 
                variant="caption" 
                color="text.secondary"
                sx={{ 
                  px: 1,
                  fontWeight: 600,
                  letterSpacing: '0.5px',
                }}
              >
                NUEVA CONTRASEÑA
              </Typography>
            </Divider>

            {/* Nueva Contraseña */}
            <TextField
              fullWidth
              label="Nueva Contraseña"
              type={showPasswords.new ? 'text' : 'password'}
              value={formData.newPassword}
              onChange={handleChange('newPassword')}
              required
              sx={{ mb: 1.5 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockOpen sx={{ color: COLORS.primary }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={handleTogglePassword('new')} edge="end">
                      {showPasswords.new ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            {/* Indicador de fortaleza */}
            {formData.newPassword && (
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="caption" color="text.secondary">
                    Fortaleza:
                  </Typography>
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      fontWeight: 600,
                      color: getStrengthColor() === 'success' ? COLORS.success : 
                             getStrengthColor() === 'warning' ? COLORS.warning : COLORS.error,
                    }}
                  >
                    {getStrengthLabel()}
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={getPasswordStrength()}
                  color={getStrengthColor()}
                  sx={{ 
                    height: 8, 
                    borderRadius: 4,
                    bgcolor: alpha(COLORS.primary, 0.1),
                  }}
                />
              </Box>
            )}

            {/* Requisitos de contraseña */}
            {formData.newPassword && (
              <List dense sx={{ mb: 2.5, bgcolor: alpha(COLORS.primary, 0.02), borderRadius: 2, p: 1 }}>
                {passwordRequirements.map((req, index) => (
                  <ListItem key={index} sx={{ py: 0.25 }}>
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      {req.valid ? (
                        <CheckCircle 
                          fontSize="small" 
                          sx={{ color: COLORS.success }} 
                        />
                      ) : (
                        <Cancel 
                          fontSize="small" 
                          sx={{ color: alpha('#999', 0.5) }} 
                        />
                      )}
                    </ListItemIcon>
                    <ListItemText
                      primary={req.label}
                      primaryTypographyProps={{
                        variant: 'body2',
                        sx: {
                          color: req.valid ? COLORS.success : 'text.secondary',
                          fontWeight: req.valid ? 500 : 400,
                        },
                      }}
                    />
                  </ListItem>
                ))}
              </List>
            )}

            {/* Confirmar Nueva Contraseña */}
            <TextField
              fullWidth
              label="Confirmar Nueva Contraseña"
              type={showPasswords.confirm ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={handleChange('confirmPassword')}
              required
              error={formData.confirmPassword && !passwordsMatch}
              helperText={
                formData.confirmPassword && !passwordsMatch
                  ? 'Las contraseñas no coinciden'
                  : passwordsMatch
                  ? '✓ Las contraseñas coinciden'
                  : ''
              }
              sx={{ mb: 3 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockOpen sx={{ color: passwordsMatch ? COLORS.success : COLORS.primary }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={handleTogglePassword('confirm')} edge="end">
                      {showPasswords.confirm ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            {/* Botón de cambio */}
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={!canSubmit || loading}
              sx={{
                py: 1.5,
                fontWeight: 600,
                textTransform: 'none',
                fontSize: '1rem',
                borderRadius: 2.5,
                boxShadow: `0 8px 24px ${alpha(COLORS.primary, 0.3)}`,
                '&:hover': {
                  boxShadow: `0 12px 32px ${alpha(COLORS.primary, 0.4)}`,
                },
                '&:disabled': {
                  boxShadow: 'none',
                }
              }}
            >
              {loading ? 'Cambiando...' : 'Confirmar Cambio de Contraseña'}
            </Button>

            {/* Información de seguridad */}
            <Alert 
              severity="info" 
              sx={{ 
                mt: 3,
                borderRadius: 2,
                border: `1px solid ${alpha(COLORS.primary, 0.1)}`,
                bgcolor: alpha(COLORS.primary, 0.03),
              }}
            >
              <Typography variant="body2">
                <strong>Nota de seguridad:</strong> Tu contraseña se encriptará usando bcrypt.
                Asegúrate de usar una contraseña única que no uses en otros servicios.
              </Typography>
            </Alert>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ChangePassword;

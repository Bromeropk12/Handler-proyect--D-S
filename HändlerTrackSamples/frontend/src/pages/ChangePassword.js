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
} from '@mui/material';
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
          bgcolor: 'background.default',
          p: 2,
        }}
      >
        <Card sx={{ maxWidth: 450, width: '100%', textAlign: 'center' }}>
          <CardContent sx={{ p: 4 }}>
            <CheckCircle sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
            <Typography variant="h5" gutterBottom>
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
        bgcolor: 'background.default',
        p: 2,
      }}
    >
      <Card sx={{ maxWidth: 500, width: '100%' }}>
        <CardContent sx={{ p: 4 }}>
          {/* Encabezado */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <IconButton onClick={() => navigate('/')} sx={{ mr: 1 }}>
              <ArrowBack />
            </IconButton>
            <Typography variant="h5" component="h1">
              Cambiar Contraseña
            </Typography>
          </Box>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Ingresa tu contraseña actual y luego tu nueva contraseña dos veces para confirmarla.
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
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
              sx={{ mb: 2 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock />
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
              <Typography variant="caption" color="text.secondary">
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
              sx={{ mb: 1 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockOpen />
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
                  <Typography variant="caption" color={`${getStrengthColor()}.main`}>
                    {getStrengthLabel()}
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={getPasswordStrength()}
                  color={getStrengthColor()}
                  sx={{ height: 6, borderRadius: 3 }}
                />
              </Box>
            )}

            {/* Requisitos de contraseña */}
            {formData.newPassword && (
              <List dense sx={{ mb: 2 }}>
                {passwordRequirements.map((req, index) => (
                  <ListItem key={index} sx={{ py: 0 }}>
                    <ListItemIcon sx={{ minWidth: 30 }}>
                      {req.valid ? (
                        <CheckCircle fontSize="small" color="success" />
                      ) : (
                        <Cancel fontSize="small" color="error" />
                      )}
                    </ListItemIcon>
                    <ListItemText
                      primary={req.label}
                      primaryTypographyProps={{
                        variant: 'body2',
                        color: req.valid ? 'success.main' : 'text.secondary',
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
                  ? 'Las contraseñas coinciden'
                  : ''
              }
              sx={{ mb: 3 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockOpen />
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
              }}
            >
              {loading ? 'Cambiando...' : 'Confirmar Cambio de Contraseña'}
            </Button>

            {/* Información de seguridad */}
            <Alert severity="info" sx={{ mt: 3 }}>
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

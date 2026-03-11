import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  alpha,
} from '@mui/material';
import { keyframes } from '@mui/system';
import {
  Inventory2 as InventoryIcon,
  Science as ScienceIcon,
  LocalShipping as ShippingIcon,
  Warning as WarningIcon,
  Settings as SettingsIcon,
  ScienceOutlined as ScienceOutlinedIcon,
  WarehouseOutlined as WarehouseIcon,
  QrCode2 as QrCodeIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

// Animaciones
const fadeInUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
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

const pulse = keyframes`
  0%, 100% {
    transform: scale(1);
    opacity: 0.8;
  }
  50% {
    transform: scale(1.05);
    opacity: 1;
  }
`;

// Colores de marca
const COLORS = {
  primary: '#7b1fa2',
  primaryLight: '#9c27b0',
  primaryDark: '#6a1b9a',
  secondary: '#388e3c',
  info: '#0288d1',
  warning: '#f57c00',
  gold: '#fcdd38',
  charcoal: '#120c13',
};

// Tarjeta de característica mejorada
const FeatureCard = ({ icon, title, description, color, index, comingSoon }) => (
  <Card
    sx={{
      height: '100%',
      minHeight: 200,
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      overflow: 'hidden',
      borderRadius: 3,
      border: `1px solid ${alpha(color, 0.15)}`,
      background: `linear-gradient(145deg, #ffffff 0%, ${alpha(color, 0.02)} 100%)`,
      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
      animation: `${fadeInUp} 0.6s cubic-bezier(0.4, 0, 0.2, 1) ${index * 0.15}s forwards`,
      opacity: 0,
      '&:hover': {
        transform: 'translateY(-8px)',
        boxShadow: `0 20px 40px ${alpha(color, 0.2)}, 0 8px 16px ${alpha(color, 0.1)}`,
        borderColor: alpha(color, 0.4),
        '& .feature-icon': {
          transform: 'scale(1.1) rotate(5deg)',
        },
      },
    }}
  >
    {/* Barra superior de color */}
    <Box
      sx={{
        height: 4,
        background: `linear-gradient(90deg, ${color}, ${alpha(color, 0.5)})`,
        borderRadius: '12px 12px 0 0',
      }}
    />
    
    <CardContent sx={{ p: 3 }}>
      <Box
        className="feature-icon"
        sx={{
          width: 64,
          height: 64,
          borderRadius: 3,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: `linear-gradient(135deg, ${alpha(color, 0.15)} 0%, ${alpha(color, 0.05)} 100%)`,
          border: `1px solid ${alpha(color, 0.2)}`,
          mb: 2.5,
          transition: 'all 0.3s ease',
        }}
      >
        {React.cloneElement(icon, { sx: { fontSize: 32, color } })}
      </Box>
      
      <Typography
        variant="h6"
        sx={{
          fontWeight: 700,
          mb: 1.5,
          color: '#1a1a1a',
          fontSize: '1.1rem',
        }}
      >
        {title}
      </Typography>
      
      <Typography
        variant="body2"
        sx={{
          color: 'text.secondary',
          lineHeight: 1.7,
        }}
      >
        {description}
      </Typography>
      
      {/* Spacer para igualar altura */}
      <Box sx={{ flexGrow: 1 }} />
      
      {comingSoon && (
        <Box
          sx={{
            mt: 2,
            display: 'inline-flex',
            alignItems: 'center',
            px: 1.5,
            py: 0.5,
            borderRadius: 2,
            background: alpha(COLORS.primary, 0.1),
            border: `1px solid ${alpha(COLORS.primary, 0.2)}`,
          }}
        >
          <Typography
            variant="caption"
            sx={{
              color: COLORS.primary,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            Próximamente
          </Typography>
        </Box>
      )}
    </CardContent>
  </Card>
);

const Welcome = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <InventoryIcon />,
      title: 'Gestión de Muestras',
      description: 'Administra tu inventario de muestras químicas con seguimiento completo de ubicación y trazabilidad.',
      color: COLORS.primary,
      comingSoon: true,
    },
    {
      icon: <ScienceIcon />,
      title: 'Control de Compatibilidad',
      description: 'Sistema inteligente de verificación de compatibilidad química para evitar reacciones peligrosas.',
      color: COLORS.secondary,
      comingSoon: true,
    },
    {
      icon: <ShippingIcon />,
      title: 'Movimientos',
      description: 'Registro completo de entradas y salidas de muestras con control de inventario en tiempo real.',
      color: COLORS.info,
      comingSoon: true,
    },
    {
      icon: <WarningIcon />,
      title: 'Alertas Inteligentes',
      description: 'Notificaciones automáticas sobre stock bajo, muestras próximas a vencer y ubicaciones vacías.',
      color: COLORS.warning,
      comingSoon: true,
    },
  ];

  const quickActions = [
    {
      icon: <WarehouseIcon />,
      title: 'Bodega',
      subtitle: 'Ver ubicaciones',
      color: COLORS.primary,
      disabled: true,
    },
    {
      icon: <SearchIcon />,
      title: 'Búsqueda',
      subtitle: 'Buscar muestras',
      color: COLORS.info,
      disabled: true,
    },
    {
      icon: <QrCodeIcon />,
      title: 'Etiquetas',
      subtitle: 'Generar códigos',
      color: COLORS.secondary,
      disabled: true,
    },
    {
      icon: <ScienceOutlinedIcon />,
      title: 'Análisis',
      subtitle: 'Ver reportes',
      color: COLORS.warning,
      disabled: true,
    },
  ];

  return (
    <Box sx={styles.container}>
      {/* Fondo decorativo */}
      <Box sx={styles.backgroundDecoration} />
      
      {/* Header mejorado */}
      <Box sx={styles.header}>
        <Box sx={styles.headerContent}>
          <Typography 
            variant="h4" 
            component="h1" 
            sx={styles.title}
          >
            Händler TrackSamples
          </Typography>
          <Typography variant="body1" sx={styles.subtitle}>
            Sistema de Gestión para Laboratorios y Bodegas Químicas
          </Typography>
        </Box>
      </Box>

      {/* Tarjeta principal de descripción */}
      <Card sx={styles.mainCard}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={styles.mainCardHeader}>
            <Box
              sx={{
                width: 8,
                height: 40,
                borderRadius: 4,
                background: `linear-gradient(180deg, ${COLORS.primary}, ${COLORS.primaryLight})`,
              }}
            />
            <Typography variant="h5" sx={{ fontWeight: 700, ml: 2 }}>
              ¿Qué es Händler TrackSamples?
            </Typography>
          </Box>
          
          <Box sx={{ mt: 3, ml: 3 }}>
            <Typography variant="body1" paragraph sx={styles.description}>
              Händler TrackSamples es un sistema integral de gestión diseñado específicamente para{' '}
              <Box component="span" sx={{ fontWeight: 600, color: COLORS.primary }}>
                laboratorios
              </Box>
              , empresas{' '}
              <Box component="span" sx={{ fontWeight: 600, color: COLORS.primary }}>
                cosméticas
              </Box>
              ,{' '}
              <Box component="span" sx={{ fontWeight: 600, color: COLORS.primary }}>
                farmacéuticas
              </Box>
              {' '}e{' '}
              <Box component="span" sx={{ fontWeight: 600, color: COLORS.primary }}>
                industriales
              </Box>
              {' '}que requieren un control estricto sobre sus muestras y productos químicos.
            </Typography>
            
            <Typography variant="body1" paragraph sx={styles.description}>
              El sistema te permitirá gestionar tu inventario de manera eficiente, con seguimiento en tiempo real 
              de cada muestra, verificación automática de compatibilidad química, y alertas proactivas para 
              mantener tus operaciones seguras y organizadas.
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* Acciones rápidas */}
      <Box sx={styles.quickActionsSection}>
        <Typography variant="h6" sx={styles.sectionTitle}>
          Accesos Rápidos
        </Typography>
        <Grid container spacing={2}>
          {quickActions.map((action, index) => (
            <Grid item xs={6} sm={3} key={index}>
              <Card
                sx={{
                  cursor: action.disabled ? 'not-allowed' : 'pointer',
                  opacity: action.disabled ? 0.5 : 1,
                  transition: 'all 0.3s ease',
                  borderRadius: 3,
                  border: `1px solid ${alpha(action.color, 0.1)}`,
                  '&:hover': action.disabled ? {} : {
                    transform: 'translateY(-4px)',
                    boxShadow: `0 12px 24px ${alpha(action.color, 0.2)}`,
                    borderColor: alpha(action.color, 0.3),
                  },
                }}
              >
                <CardContent sx={{ textAlign: 'center', py: 2.5 }}>
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mx: 'auto',
                      mb: 1.5,
                      background: alpha(action.color, 0.1),
                    }}
                  >
                    {React.cloneElement(action.icon, { sx: { fontSize: 24, color: action.color } })}
                  </Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    {action.title}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {action.subtitle}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Características principales */}
      <Typography variant="h6" sx={styles.sectionTitle}>
        Características Principales
      </Typography>
      
      <Grid container spacing={3}>
        {features.map((feature, index) => (
          <Grid item xs={12} md={6} key={index}>
            <FeatureCard {...feature} index={index} />
          </Grid>
        ))}
      </Grid>

      {/* Acciones */}
      <Box sx={styles.actions}>
        <Button
          variant="contained"
          size="large"
          startIcon={<SettingsIcon />}
          onClick={() => navigate('/change-password')}
          sx={styles.actionButton}
        >
          Cambiar Mi Contraseña
        </Button>
      </Box>

      {/* Footer informativo */}
      <Box sx={styles.footer}>
        <Typography variant="body2" color="text.secondary">
          <Box component="span" sx={{ fontWeight: 600, color: COLORS.primary }}>
            Nota:
          </Box>{' '}
          Este es el núcleo base del sistema. Próximamente se implementarán los módulos de gestión de muestras, 
          movimientos y más.
        </Typography>
      </Box>
    </Box>
  );
};

const styles = {
  container: {
    maxWidth: 1400,
    mx: 'auto',
    p: 3,
    position: 'relative',
    overflow: 'hidden',
  },
  backgroundDecoration: {
    position: 'absolute',
    top: -200,
    right: -200,
    width: 600,
    height: 600,
    borderRadius: '50%',
    background: `radial-gradient(circle, ${alpha('#7b1fa2', 0.08)} 0%, transparent 70%)`,
    pointerEvents: 'none',
    zIndex: 0,
  },
  header: {
    position: 'relative',
    textAlign: 'center',
    mb: 4,
    py: 3,
    zIndex: 1,
  },
  mainCard: {
    mb: 4,
    borderRadius: 3,
    border: `1px solid ${alpha('#7b1fa2', 0.1)}`,
    boxShadow: `0 8px 32px ${alpha('#7b1fa2', 0.08)}`,
    position: 'relative',
    overflow: 'hidden',
    zIndex: 1,
    animation: `${fadeInUp} 0.6s ease forwards`,
  },
  mainCardHeader: {
    display: 'flex',
    alignItems: 'center',
  },
  description: {
    color: 'text.secondary',
    lineHeight: 1.8,
  },
  quickActionsSection: {
    mb: 5,
    zIndex: 1,
    position: 'relative',
  },
  sectionTitle: {
    fontWeight: 700,
    mb: 3,
    color: '#1a1a1a',
    fontSize: '1.25rem',
  },
  actions: {
    textAlign: 'center',
    py: 4,
    mt: 4,
  },
  actionButton: {
    px: 5,
    py: 1.5,
    borderRadius: 3,
    fontWeight: 600,
    textTransform: 'none',
    fontSize: '1rem',
    boxShadow: `0 8px 24px ${alpha('#7b1fa2', 0.3)}`,
    '&:hover': {
      boxShadow: `0 12px 32px ${alpha('#7b1fa2', 0.4)}`,
      transform: 'translateY(-2px)',
    },
  },
  footer: {
    textAlign: 'center',
    mt: 4,
    py: 3,
    px: 3,
    borderRadius: 3,
    background: `linear-gradient(135deg, ${alpha('#f5f5f5', 0.8)} 0%, ${alpha('#7b1fa2', 0.03)} 100%)`,
    border: `1px solid ${alpha('#7b1fa2', 0.08)}`,
  },
};

export default Welcome;

import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Divider,
} from '@mui/material';
import {
  Inventory2 as InventoryIcon,
  Science as ScienceIcon,
  LocalShipping as ShippingIcon,
  Warning as WarningIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

/**
 * Página: Bienvenida
 * Descripción: Pantalla de inicio que muestra información del software
 */
const Welcome = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <InventoryIcon sx={{ fontSize: 40, color: 'primary.main' }} />,
      title: 'Gestión de Muestras',
      description: 'Administra tu inventario de muestras químicas con seguimiento completo de ubicación y trazabilidad.',
    },
    {
      icon: <ScienceIcon sx={{ fontSize: 40, color: 'secondary.main' }} />,
      title: 'Control de Compatibilidad',
      description: 'Sistema inteligente de verificación de compatibilidad química para evitar reacciones peligrosas.',
    },
    {
      icon: <ShippingIcon sx={{ fontSize: 40, color: 'info.main' }} />,
      title: 'Movimientos',
      description: 'Registro completo de entradas y salidas de muestras con control de inventario en tiempo real.',
    },
    {
      icon: <WarningIcon sx={{ fontSize: 40, color: 'warning.main' }} />,
      title: 'Alertas Inteligentes',
      description: 'Notificaciones automáticas sobre stock bajo, muestras próximas a vencer y ubicaciones vacías.',
    },
  ];

  return (
    <Box sx={styles.container}>
      {/* Header */}
      <Box sx={styles.header}>
        <Typography variant="h3" component="h1" gutterBottom>
          Bienvenido a Händler TrackSamples
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Sistema de Gestión para Laboratorios y Bodegas Químicas
        </Typography>
      </Box>

      {/* Descripción del proyecto */}
      <Card sx={styles.mainCard}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h5" gutterBottom>
            ¿Qué es Händler TrackSamples?
          </Typography>
          <Typography variant="body1" paragraph>
            Händler TrackSamples es un sistema integral de gestión diseñado específicamente para 
            laboratorios, empresas cosméticas, farmacéuticas e industriales que requieren un control 
            estricto sobre sus muestras y productos químicos.
          </Typography>
          <Typography variant="body1" paragraph>
            El sistema te permitirá gestionar tu inventario de manera eficiente, con seguimiento 
            en tiempo real de cada muestra, verificación automática de compatibilidad química, 
            y alertas proactivas para mantener tus operaciones seguras y organizadas.
          </Typography>
        </CardContent>
      </Card>

      {/* Características */}
      <Typography variant="h5" sx={{ mt: 4, mb: 2 }}>
        Características Principales
      </Typography>
      
      <Grid container spacing={3}>
        {features.map((feature, index) => (
          <Grid item xs={12} md={6} key={index}>
            <Card sx={styles.featureCard}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                  {feature.icon}
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      {feature.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {feature.description}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Divider sx={{ my: 4 }} />

      {/* Acciones */}
      <Box sx={styles.actions}>
        <Typography variant="h6" gutterBottom>
          Acciones Disponibles
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
          <Button
            variant="contained"
            size="large"
            startIcon={<SettingsIcon />}
            onClick={() => navigate('/change-password')}
          >
            Cambiar Mi Contraseña
          </Button>
        </Box>
      </Box>

      {/* Footer informativo */}
      <Box sx={styles.footer}>
        <Typography variant="body2" color="text.secondary">
          <strong>Nota:</strong> Este es el núcleo base del sistema. 
          Próximamente se implementarán los módulos de gestión de muestras, movimientos y más.
        </Typography>
      </Box>
    </Box>
  );
};

const styles = {
  container: {
    maxWidth: 1200,
    mx: 'auto',
    p: 3,
  },
  header: {
    textAlign: 'center',
    mb: 4,
    py: 4,
  },
  mainCard: {
    mb: 3,
  },
  featureCard: {
    height: '100%',
  },
  actions: {
    textAlign: 'center',
    py: 2,
  },
  footer: {
    textAlign: 'center',
    mt: 4,
    py: 2,
    bgcolor: 'grey.100',
    borderRadius: 2,
  },
};

export default Welcome;

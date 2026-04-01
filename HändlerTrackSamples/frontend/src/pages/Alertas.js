/**
 * Alertas.js
 * Página de dashboard de alertas inteligentes
 */

import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, Chip, Button,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Alert, CircularProgress, Tabs, Tab, Divider
} from '@mui/material';
import {
  Warning, Inventory, Schedule, Storage, Refresh
} from '@mui/icons-material';
import api from '../services/api';

const Alertas = () => {
  const [loading, setLoading] = useState(true);
  const [alertas, setAlertas] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [error, setError] = useState(null);

  const loadAlertas = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/api/alertas/dashboard');
      setAlertas(response.data);
    } catch (err) {
      console.error('Error cargando alertas:', err);
      setError('Error al cargar las alertas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlertas();
  }, []);

  const getUrgenciaColor = (urgencia) => {
    const colors = {
      critico: 'error',
      alto: 'warning',
      medio: 'info',
      bajo: 'success'
    };
    return colors[urgencia] || 'default';
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
        <Button startIcon={<Refresh />} onClick={loadAlertas} sx={{ mt: 2 }}>
          Reintentar
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Warning sx={{ fontSize: 32, color: 'warning.main', mr: 2 }} />
        <Typography variant="h5">Alertas Inteligentes</Typography>
        <Box sx={{ flexGrow: 1 }} />
        <Button startIcon={<Refresh />} onClick={loadAlertas}>
          Actualizar
        </Button>
      </Box>

      {/* Resumen */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Inventory color="error" sx={{ fontSize: 40 }} />
              <Typography variant="h4">{alertas?.stock_bajo?.cantidad_alertas || 0}</Typography>
              <Typography variant="body2">Stock Bajo</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Schedule color="warning" sx={{ fontSize: 40 }} />
              <Typography variant="h4">{alertas?.proximas_vencer?.total_alertas || 0}</Typography>
              <Typography variant="body2">Próximas a Vencer</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Warning color="error" sx={{ fontSize: 40 }} />
              <Typography variant="h4">{alertas?.vencidas?.cantidad_alertas || 0}</Typography>
              <Typography variant="body2">Ya Vencidas</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Storage color="info" sx={{ fontSize: 40 }} />
              <Typography variant="h4">{alertas?.optimizacion?.cantidad_oportunidades || 0}</Typography>
              <Typography variant="body2">Optimización</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
          <Tab label={`Stock Bajo (${alertas?.stock_bajo?.cantidad_alertas || 0})`} />
          <Tab label={`Vencimientos (${alertas?.proximas_vencer?.total_alertas || 0})`} />
          <Tab label={`Vencidas (${alertas?.vencidas?.cantidad_alertas || 0})`} />
          <Tab label={`Optimización (${alertas?.optimizacion?.cantidad_oportunidades || 0})`} />
        </Tabs>
      </Paper>

      {/* Contenido de tabs */}
      {tabValue === 0 && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Producto</TableCell>
                <TableCell>Lote</TableCell>
                <TableCell>Cantidad (g)</TableCell>
                <TableCell>Proveedor</TableCell>
                <TableCell>Urgencia</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {alertas?.stock_bajo?.alertas?.map((item) => (
                <TableRow key={item.muestra_id}>
                  <TableCell>{item.nombre}</TableCell>
                  <TableCell>{item.lote}</TableCell>
                  <TableCell>{item.cantidad_gramos}</TableCell>
                  <TableCell>{item.proveedor}</TableCell>
                  <TableCell>
                    <Chip
                      label={item.urgencia}
                      color={getUrgenciaColor(item.urgencia)}
                      size="small"
                    />
                  </TableCell>
                </TableRow>
              ))}
              {(!alertas?.stock_bajo?.alertas || alertas.stock_bajo.alertas.length === 0) && (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    Sin alertas de stock bajo
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {tabValue === 1 && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Producto</TableCell>
                <TableCell>Lote</TableCell>
                <TableCell>Cantidad (g)</TableCell>
                <TableCell>Fecha Vencimiento</TableCell>
                <TableCell>Días Restantes</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {["critico", "alto", "medio", "bajo"].map((nivel) => 
                alertas?.proximas_vencer?.alertas?.[nivel]?.map((item) => (
                  <TableRow key={item.muestra_id}>
                    <TableCell>{item.nombre}</TableCell>
                    <TableCell>{item.lote}</TableCell>
                    <TableCell>{item.cantidad_gramos}</TableCell>
                    <TableCell>{item.fecha_vencimiento}</TableCell>
                    <TableCell>
                      <Chip
                        label={`${item.dias_restantes} días`}
                        color={getUrgenciaColor(nivel)}
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {tabValue === 2 && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Producto</TableCell>
                <TableCell>Lote</TableCell>
                <TableCell>Cantidad (g)</TableCell>
                <TableCell>Fecha Vencimiento</TableCell>
                <TableCell>Días Vencida</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {alertas?.vencidas?.alertas?.map((item) => (
                <TableRow key={item.muestra_id}>
                  <TableCell>{item.nombre}</TableCell>
                  <TableCell>{item.lote}</TableCell>
                  <TableCell>{item.cantidad_gramos}</TableCell>
                  <TableCell>{item.fecha_vencimiento}</TableCell>
                  <TableCell>
                    <Chip label={`${item.dias_vencida} días`} color="error" size="small" />
                  </TableCell>
                </TableRow>
              ))}
              {(!alertas?.vencidas?.alertas || alertas.vencidas.alertas.length === 0) && (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    No hay muestras vencidas
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {tabValue === 3 && (
        <Grid container spacing={2}>
          {alertas?.optimizacion?.oportunidades?.map((item) => (
            <Grid item xs={12} md={6} key={item.anaquel_id}>
              <Card>
                <CardContent>
                  <Typography variant="h6">{item.anaquel_nombre}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Línea: {item.linea}
                  </Typography>
                  <Divider sx={{ my: 1 }} />
                  <Typography>
                    <strong>Hileras disponibles:</strong> {item.hileras_disponibles} / {item.hileras_totales}
                  </Typography>
                  <Typography>
                    <strong>Ocupación:</strong> {100 - item.porcentaje_disponible}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {item.recomendacion}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
          {(!alertas?.optimizacion?.oportunidades || alertas.optimizacion.oportunidades.length === 0) && (
            <Grid item xs={12}>
              <Alert severity="success">No hay oportunidades de optimización</Alert>
            </Grid>
          )}
        </Grid>
      )}
    </Box>
  );
};

export default Alertas;
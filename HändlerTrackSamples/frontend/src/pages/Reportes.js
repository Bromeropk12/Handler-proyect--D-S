/**
 * Reportes.js
 * Página de reportes del sistema
 */

import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, Button, Table,
  TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, CircularProgress, Alert, Chip
} from '@mui/material';
import {
  Assessment, Inventory, TrendingUp, Storage, Schedule, Download
} from '@mui/icons-material';
import api from '../services/api';

const Reportes = () => {
  const [loading, setLoading] = useState(true);
  const [tipoReporte, setTipoReporte] = useState('inventario');
  const [reporte, setReporte] = useState(null);
  const [error, setError] = useState(null);

  const loadReporte = async (tipo) => {
    setLoading(true);
    setError(null);
    setTipoReporte(tipo);
    
    try {
      let endpoint = '/api/reportes/';
      switch (tipo) {
        case 'inventario':
          endpoint += 'inventario';
          break;
        case 'movimientos':
          endpoint += 'movimientos';
          break;
        case 'ocupacion':
          endpoint += 'ocupacion';
          break;
        case 'vencimientos':
          endpoint += 'vencimientos';
          break;
        default:
          endpoint += 'inventario';
      }
      
      const response = await api.get(endpoint);
      setReporte(response.data);
    } catch (err) {
      console.error('Error cargando reporte:', err);
      setError('Error al cargar el reporte');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReporte('inventario');
  }, []);

  const getChipColor = (porcentaje) => {
    if (porcentaje >= 80) return 'error';
    if (porcentaje >= 50) return 'warning';
    return 'success';
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Assessment sx={{ fontSize: 32, color: 'primary.main', mr: 2 }} />
        <Typography variant="h5">Reportes del Sistema</Typography>
      </Box>

      {/* Botones de tipo de reporte */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item>
          <Button
            variant={tipoReporte === 'inventario' ? 'contained' : 'outlined'}
            startIcon={<Inventory />}
            onClick={() => loadReporte('inventario')}
          >
            Inventario
          </Button>
        </Grid>
        <Grid item>
          <Button
            variant={tipoReporte === 'movimientos' ? 'contained' : 'outlined'}
            startIcon={<TrendingUp />}
            onClick={() => loadReporte('movimientos')}
          >
            Movimientos
          </Button>
        </Grid>
        <Grid item>
          <Button
            variant={tipoReporte === 'ocupacion' ? 'contained' : 'outlined'}
            startIcon={<Storage />}
            onClick={() => loadReporte('ocupacion')}
          >
            Ocupación
          </Button>
        </Grid>
        <Grid item>
          <Button
            variant={tipoReporte === 'vencimientos' ? 'contained' : 'outlined'}
            startIcon={<Schedule />}
            onClick={() => loadReporte('vencimientos')}
          >
            Vencimientos
          </Button>
        </Grid>
      </Grid>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {error && <Alert severity="error">{error}</Alert>}

      {reporte && !loading && (
        <Box>
          {/* Reporte de Inventario */}
          {tipoReporte === 'inventario' && (
            <>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Resumen de Inventario
              </Typography>
              <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Typography variant="body2" color="text.secondary">
                        Total Muestras
                      </Typography>
                      <Typography variant="h4">
                        {reporte.resumen?.total_muestras || 0}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Typography variant="body2" color="text.secondary">
                        Activas
                      </Typography>
                      <Typography variant="h4" color="success.main">
                        {reporte.resumen?.muestras_activas || 0}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Typography variant="body2" color="text.secondary">
                        Agotadas
                      </Typography>
                      <Typography variant="h4" color="warning.main">
                        {reporte.resumen?.muestras_agotadas || 0}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Typography variant="body2" color="text.secondary">
                        Total Gramos
                      </Typography>
                      <Typography variant="h4">
                        {reporte.resumen?.total_gramos?.toLocaleString() || 0}g
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              <Typography variant="h6" sx={{ mb: 2 }}>Por Línea</Typography>
              <TableContainer component={Paper} sx={{ mb: 3 }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Línea</TableCell>
                      <TableCell>Cantidad</TableCell>
                      <TableCell>Gramos</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {reporte.por_linea?.map((row, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{row.linea}</TableCell>
                        <TableCell>{row.cantidad}</TableCell>
                        <TableCell>{row.gramos?.toLocaleString()}g</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}

          {/* Reporte de Ocupación */}
          {tipoReporte === 'ocupacion' && (
            <>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Ocupación de Anaqueles
              </Typography>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Anaquel</TableCell>
                      <TableCell>Línea</TableCell>
                      <TableCell>Total Hileras</TableCell>
                      <TableCell>Ocupadas</TableCell>
                      <TableCell>Disponibles</TableCell>
                      <TableCell>Ocupación</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {reporte.anaqueles?.map((anaquel) => (
                      <TableRow key={anaquel.id}>
                        <TableCell>{anaquel.nombre}</TableCell>
                        <TableCell>{anaquel.linea}</TableCell>
                        <TableCell>{anaquel.total_hileras}</TableCell>
                        <TableCell>{anaquel.hileras_ocupadas}</TableCell>
                        <TableCell>{anaquel.hileras_disponibles}</TableCell>
                        <TableCell>
                          <Chip
                            label={`${anaquel.porcentaje_ocupacion}%`}
                            color={getChipColor(anaquel.porcentaje_ocupacion)}
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}

          {/* Reporte de Vencimientos */}
          {tipoReporte === 'vencimientos' && (
            <>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Resumen de Vencimientos
              </Typography>
              <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={6} md={3}>
                  <Card>
                    <CardContent>
                      <Typography variant="body2" color="text.secondary">Próximas a Vencer</Typography>
                      <Typography variant="h4" color="warning.main">
                        {reporte.resumen?.proximas_vencer || 0}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Card>
                    <CardContent>
                      <Typography variant="body2" color="text.secondary">Ya Vencidas</Typography>
                      <Typography variant="h4" color="error.main">
                        {reporte.resumen?.ya_vencidas || 0}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              <Typography variant="h6" sx={{ mb: 2 }}>Crítico (≤30 días)</Typography>
              <TableContainer component={Paper} sx={{ mb: 2 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Producto</TableCell>
                      <TableCell>Lote</TableCell>
                      <TableCell>Cantidad</TableCell>
                      <TableCell>Fecha Venc.</TableCell>
                      <TableCell>Días</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {reporte.urgencia?.critico?.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.nombre}</TableCell>
                        <TableCell>{item.lote}</TableCell>
                        <TableCell>{item.cantidad_gramos}g</TableCell>
                        <TableCell>{item.fecha_vencimiento}</TableCell>
                        <TableCell><Chip label={`${item.dias_restantes}d`} color="error" size="small" /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}

          {/* Reporte de Movimientos */}
          {tipoReporte === 'movimientos' && (
            <>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Resumen de Movimientos
              </Typography>
              <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={6} md={3}>
                  <Card>
                    <CardContent>
                      <Typography variant="body2" color="text.secondary">Total</Typography>
                      <Typography variant="h4">{reporte.resumen?.total_movimientos || 0}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Card>
                    <CardContent>
                      <Typography variant="body2" color="text.secondary">Entradas</Typography>
                      <Typography variant="h4" color="success.main">{reporte.resumen?.entradas || 0}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Card>
                    <CardContent>
                      <Typography variant="body2" color="text.secondary">Salidas</Typography>
                      <Typography variant="h4" color="error.main">{reporte.resumen?.salidas || 0}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </>
          )}
        </Box>
      )}
    </Box>
  );
};

export default Reportes;
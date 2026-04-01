/**
 * WarehouseMap.jsx
 * Visualización 2D de los 14 anaqueles del almacén
 * RNF-4: Previsualización de cuadrícula antes de commit
 */

import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Grid, Paper, Chip, Tooltip, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Alert, CircularProgress
} from '@mui/material';
import {
  Warehouse as WarehouseIcon,
  ZoomIn, ZoomOut, Refresh as RefreshIcon,
  Inventory2 as SampleIcon, Warning as WarningIcon
} from '@mui/icons-material';
import api from '../services/api';

const WarehouseMap = ({ 
  onHileraClick, 
  muestraSeleccionada,
  modo = 'visualizacion' 
}) => {
  const [loading, setLoading] = useState(true);
  const [anaqueles, setAnaqueles] = useState([]);
  const [hileras, setHileras] = useState({});
  const [zoom, setZoom] = useState(1);
  const [lineaSeleccionada, setLineaSeleccionada] = useState('todas');
  const [hileraSeleccionada, setHileraSeleccionada] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);

  useEffect(() => {
    loadWarehouseData();
  }, []);

  const loadWarehouseData = async () => {
    setLoading(true);
    try {
      const [anaquelesRes, hilerasRes] = await Promise.all([
        api.get('/anaqueles/'),
        api.get('/hileras/')
      ]);
      setAnaqueles(anaquelesRes.data);
      
      const hilerasAgrupadas = {};
      for (const hilera of hilerasRes.data) {
        if (!hilerasAgrupadas[hilera.anaquel_id]) {
          hilerasAgrupadas[hilera.anaquel_id] = [];
        }
        hilerasAgrupadas[hilera.anaquel_id].push(hilera);
      }
      setHileras(hilerasAgrupadas);
    } catch (error) {
      console.error('Error cargando datos del almacén:', error);
    } finally {
      setLoading(false);
    }
  };

  const getColorHilera = (hilera) => {
    if (!hilera) return '#f5f5f5';
    if (hilera.estado === 'ocupado') return '#4caf50';
    if (hilera.en_mantenimiento) return '#ff9800';
    return '#e0e0e0';
  };

  const getOcupacionPorAnaquel = (anaquelId) => {
    const hils = hileras[anaquelId] || [];
    const ocupadas = hils.filter(h => h.estado === 'ocupado').length;
    const total = hils.length;
    return `${ocupadas}/${total}`;
  };

  const lineas = ['todas', 'cosméticos', 'industrial', 'farmacéutico'];
  const anaquelesFiltrados = lineaSeleccionada === 'todas' 
    ? anaqueles 
    : anaqueles.filter(a => a.linea_id && a.linea?.nombre === lineaSeleccionada);

  const handleHileraClick = (hilera) => {
    if (!hilera) return;
    setHileraSeleccionada(hilera);
    setOpenDialog(true);
    if (onHileraClick) {
      onHileraClick(hilera);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 2 }}>
        <WarehouseIcon sx={{ fontSize: 28, color: 'primary.main' }} />
        <Typography variant="h5">
          Mapa del Almacén - 14 Anaqueles
        </Typography>
        
        <Box sx={{ flexGrow: 1 }} />
        
        <Button
          size="small"
          startIcon={<ZoomOut />}
          onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
        >
          -
        </Button>
        <Typography variant="body2">
          {Math.round(zoom * 100)}%
        </Typography>
        <Button
          size="small"
          startIcon={<ZoomIn />}
          onClick={() => setZoom(Math.min(2, zoom + 0.1))}
        >
          +
        </Button>
        
        <IconButton onClick={loadWarehouseData}>
          <RefreshIcon />
        </IconButton>
      </Box>

      <Box sx={{ mb: 2 }}>
        <Typography variant="body2" component="span">
          Filtrar por línea:
        </Typography>
        <Box component="span" sx={{ ml: 1 }}>
          {lineas.map(linea => (
            <Chip
              key={linea}
              label={linea === 'todas' ? 'Todas' : linea}
              onClick={() => setLineaSeleccionada(linea)}
              color={lineaSeleccionada === linea ? 'primary' : 'default'}
              size="small"
              sx={{ ml: 0.5 }}
            />
          ))}
        </Box>
      </Box>

      <Grid container spacing={2}>
        {anaquelesFiltrados.map((anaquel) => (
          <Grid item xs={12} sm={6} md={4} key={anaquel.id}>
            <Paper 
              sx={{ 
                p: 1,
                transform: `scale(${zoom})`,
                transformOrigin: 'top left',
                transition: 'transform 0.2s'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle2" fontWeight="bold">
                  {anaquel.nombre}
                </Typography>
                <Box sx={{ flexGrow: 1 }} />
                <Chip 
                  label={getOcupacionPorAnaquel(anaquel.id)} 
                  size="small"
                  color={getOcupacionPorAnaquel(anaquel.id).split('/')[0] !== getOcupacionPorAnaquel(anaquel.id).split('/')[1] ? 'success' : 'default'}
                />
              </Box>
              
              <Typography variant="caption" color="text.secondary">
                {anaquel.descripcion || anaquel.proveedor_principal}
              </Typography>

              <Grid container sx={{ mt: 0.5 }} spacing={0.5}>
                {Array.from({ length: anaquel.niveles || 10 }, (_, nivel) => (
                  <Grid item xs={12} key={nivel}>
                    <Tooltip title={`Nivel ${nivel + 1}`}>
                      <Box sx={{ display: 'flex', gap: 0.25, flexWrap: 'wrap' }}>
                        {Array.from({ length: anaquel.hileras_por_nivel || 13 }, (_, fila) => (
                          <Tooltip 
                            key={fila}
                            title={
                              (() => {
                                const hilera = (hileras[anaquel.id] || []).find(
                                  h => h.nivel === nivel + 1 && h.fila === fila + 1
                                );
                                if (!hilera) return 'Disponible';
                                if (hilera.estado === 'ocupado' && hilera.muestra) {
                                  return `${hilera.muestra.nombre} (${hilera.muestra.cantidad_gramos}g)`;
                                }
                                return hilera.estado;
                              })()
                          }
                          >
                            <Box
                              onClick={() => {
                                const hilera = (hileras[anaquel.id] || []).find(
                                  h => h.nivel === nivel + 1 && h.fila === fila + 1
                                );
                                handleHileraClick(hilera);
                              }}
                              sx={{
                                width: 8,
                                height: 8,
                                bgcolor: (() => {
                                  const hilera = (hileras[anaquel.id] || []).find(
                                    h => h.nivel === nivel + 1 && h.fila === fila + 1
                                  );
                                  return getColorHilera(hilera);
                                })(),
                                borderRadius: 0.5,
                                cursor: modo === 'seleccion' ? 'pointer' : 'default',
                                '&:hover': modo === 'seleccion' ? {
                                  bgcolor: 'primary.main'
                                } : {}
                              }}
                            />
                          </Tooltip>
                        ))}
                      </Box>
                    </Tooltip>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>
          Detalles de Hilera
        </DialogTitle>
        <DialogContent>
          {hileraSeleccionada && (
            <Box>
              <Typography variant="subtitle1">
                <strong>Ubicación:</strong> Anaquel {hileraSeleccionada.anaquel?.nombre} - 
                Nivel {hileraSeleccionada.nivel}, Fila {hileraSeleccionada.fila}, 
                Posición {hileraSeleccionada.posicion}
              </Typography>
              
              <Typography variant="body2" sx={{ mt: 1 }}>
                <strong>Estado:</strong> {hileraSeleccionada.estado}
              </Typography>
              
              <Typography variant="body2">
                <strong>Capacidad:</strong> {hileraSeleccionada.posiciones_usadas}/{hileraSeleccionada.capacidad_max}
              </Typography>
              
              {hileraSeleccionada.estado === 'ocupado' && hileraSeleccionada.muestra && (
                <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                  <Typography variant="subtitle2">
                    <SampleIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Muestra Almacenada
                  </Typography>
                  <Typography variant="body1">
                    {hileraSeleccionada.muestra.nombre}
                  </Typography>
                  <Typography variant="body2">
                    Lote: {hileraSeleccionada.muestra.lote}
                  </Typography>
                  <Typography variant="body2">
                    Cantidad: {hileraSeleccionada.muestra.cantidad_gramos}g
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog()}>
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>

      <Box sx={{ mt: 2 }}>
        <Typography variant="caption">
          Leyenda: 
          <Chip size="small" label="Disponible" sx={{ ml: 1, bgcolor: '#e0e0e0' }} />
          <Chip size="small" label="Ocupado" sx={{ ml: 0.5, bgcolor: '#4caf50', color: 'white' }} />
          <Chip size="small" label="Mantenimiento" sx={{ ml: 0.5, bgcolor: '#ff9800', color: 'white' }} />
        </Typography>
      </Box>
    </Box>
  );
};

export default WarehouseMap;
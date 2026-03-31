import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
  InputAdornment,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  LocalShipping as ShippingIcon,
  ArrowUpward as EntradaIcon,
  ArrowDownward as SalidaIcon,
  SwapHoriz as ReubicacionIcon,
  SwapHoriz as SwapHoriz,
} from '@mui/icons-material';
import api from '../services/api';

const Movimientos = () => {
  const [movimientos, setMovimientos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroTipo, setFiltroTipo] = useState('');
  const [busqueda, setBusqueda] = useState('');
  
  // Estado para diálogos de entrada/salida
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogType, setDialogType] = useState('entrada');
  const [muestras, setMuestras] = useState([]);
  const [muestraSeleccionada, setMuestraSeleccionada] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Cargar movimientos
  const fetchMovimientos = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filtroTipo) params.tipo = filtroTipo;
      
      const response = await api.get('/api/movimientos', { params });
      setMovimientos(response.data);
    } catch (error) {
      console.error('Error al cargar movimientos:', error);
    } finally {
      setLoading(false);
    }
  };

  // Cargar lista de muestras para los diálogos
  const fetchMuestras = async () => {
    try {
      // Usar el endpoint correcto: /muestras (sin /api) y con skip=0
      const response = await api.get('/muestras/', { params: { skip: 0, limit: 100 } });
      setMuestras(response.data);
    } catch (error) {
      console.error('Error al cargar muestras:', error);
      // Si falla, intentar con límite menor
      if (error.response?.status === 422) {
        try {
          const fallbackResponse = await api.get('/muestras/', { params: { skip: 0, limit: 50 } });
          setMuestras(fallbackResponse.data);
        } catch (fallbackError) {
          console.error('Error en fallback:', fallbackError);
        }
      }
    }
  };

  useEffect(() => {
    fetchMovimientos();
    fetchMuestras();
  }, [filtroTipo]);

  // Obtener color y icono según tipo de movimiento
  const getTipoInfo = (tipo) => {
    const tipos = {
      'ENTRADA': { color: '#2e7d32', icon: <EntradaIcon />, label: 'Entrada' },
      'SALIDA': { color: '#d32f2f', icon: <SalidaIcon />, label: 'Salida' },
      'REUBICACION': { color: '#ed6c02', icon: <ReubicacionIcon />, label: 'Reubicación' },
      'DOSIFICACION': { color: '#0288d1', icon: <AddIcon />, label: 'Dosificación' },
      'AJUSTE': { color: '#9c27b0', icon: <SwapHoriz />, label: 'Ajuste' },
    };
    return tipos[tipo] || { color: '#757575', icon: <ShippingIcon />, label: tipo };
  };

  // Filtrar movimientos por búsqueda
  const movimientosFiltrados = movimientos.filter(m => {
    if (!busqueda) return true;
    const muestra = muestras.find(mu => mu.id === m.sample_id);
    const nombreMuestra = muestra?.nombre?.toLowerCase() || '';
    return nombreMuestra.includes(busqueda.toLowerCase());
  });

  // Manejar registro de entrada
  const handleEntrada = async () => {
    try {
      await api.post('/api/movimientos/entrada', {
        sample_id: parseInt(muestraSeleccionada),
        cantidad_gramos: parseFloat(cantidad),
        observaciones,
      });
      setSnackbar({ open: true, message: 'Entrada registrada exitosamente', severity: 'success' });
      setOpenDialog(false);
      resetForm();
      fetchMovimientos();
    } catch (error) {
      setSnackbar({ open: true, message: error.response?.data?.detail || 'Error al registrar entrada', severity: 'error' });
    }
  };

  // Manejar registro de salida
  const handleSalida = async () => {
    try {
      await api.post('/api/movimientos/salida', {
        sample_id: parseInt(muestraSeleccionada),
        cantidad_gramos: parseFloat(cantidad),
        observaciones,
      });
      setSnackbar({ open: true, message: 'Salida registrada exitosamente', severity: 'success' });
      setOpenDialog(false);
      resetForm();
      fetchMovimientos();
    } catch (error) {
      setSnackbar({ open: true, message: error.response?.data?.detail || 'Error al registrar salida', severity: 'error' });
    }
  };

  const resetForm = () => {
    setMuestraSeleccionada('');
    setCantidad('');
    setObservaciones('');
  };

  const openEntradaDialog = () => {
    setDialogType('entrada');
    setOpenDialog(true);
  };

  const openSalidaDialog = () => {
    setDialogType('salida');
    setOpenDialog(true);
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Título */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: '#1a1a1a' }}>
          Movimientos de Inventario
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            color="success"
            startIcon={<EntradaIcon />}
            onClick={openEntradaDialog}
            sx={{ borderRadius: 2 }}
          >
            Registrar Entrada
          </Button>
          <Button
            variant="contained"
            color="error"
            startIcon={<SalidaIcon />}
            onClick={openSalidaDialog}
            sx={{ borderRadius: 2 }}
          >
            Registrar Salida
          </Button>
        </Box>
      </Box>

      {/* Filtros */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Buscar por nombre de muestra..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
              }}
              size="small"
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Tipo de Movimiento</InputLabel>
              <Select
                value={filtroTipo}
                label="Tipo de Movimiento"
                onChange={(e) => setFiltroTipo(e.target.value)}
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="ENTRADA">Entrada</MenuItem>
                <MenuItem value="SALIDA">Salida</MenuItem>
                <MenuItem value="REUBICACION">Reubicación</MenuItem>
                <MenuItem value="DOSIFICACION">Dosificación</MenuItem>
                <MenuItem value="AJUSTE">Ajuste</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Tabla de movimientos */}
      <Card sx={{ borderRadius: 2 }}>
        <CardContent>
          {loading ? (
            <Typography align="center">Cargando...</Typography>
          ) : movimientosFiltrados.length === 0 ? (
            <Typography align="center" color="text.secondary">
              No hay movimientos registrados
            </Typography>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Fecha</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Tipo</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Muestra</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">Cantidad (g)</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Usuario</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Observaciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {movimientosFiltrados.map((mov) => {
                    const tipoInfo = getTipoInfo(mov.tipo);
                    const muestra = muestras.find(m => m.id === mov.sample_id);
                    return (
                      <TableRow key={mov.id} hover>
                        <TableCell>
                          {new Date(mov.fecha_movimiento).toLocaleString('es-CO')}
                        </TableCell>
                        <TableCell>
                          <Chip
                            icon={tipoInfo.icon}
                            label={tipoInfo.label}
                            size="small"
                            sx={{
                              bgcolor: `${tipoInfo.color}15`,
                              color: tipoInfo.color,
                              fontWeight: 600,
                              '& .MuiChip-icon': { color: tipoInfo.color },
                            }}
                          />
                        </TableCell>
                        <TableCell>{muestra?.nombre || `ID: ${mov.sample_id}`}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 500 }}>
                          {parseFloat(mov.cantidad_gramos).toFixed(2)} g
                        </TableCell>
                        <TableCell>{mov.usuario_id}</TableCell>
                        <TableCell sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {mov.observaciones || '-'}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Diálogo para registrar entrada/salida */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>
          {dialogType === 'entrada' ? 'Registrar Entrada de Muestra' : 'Registrar Salida de Muestra'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Seleccionar Muestra</InputLabel>
              <Select
                value={muestraSeleccionada}
                label="Seleccionar Muestra"
                onChange={(e) => setMuestraSeleccionada(e.target.value)}
              >
                {muestras.map(m => (
                  <MenuItem key={m.id} value={m.id}>
                    {m.nombre} ({m.cantidad_gramos}g disponibles)
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <TextField
              label="Cantidad (gramos)"
              type="number"
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
              fullWidth
              inputProps={{ min: 0, step: 0.01 }}
            />
            
            <TextField
              label="Observaciones"
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              fullWidth
              multiline
              rows={2}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancelar</Button>
          {dialogType === 'entrada' ? (
            <Button onClick={handleEntrada} variant="contained" color="success">
              Registrar Entrada
            </Button>
          ) : (
            <Button onClick={handleSalida} variant="contained" color="error">
              Registrar Salida
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Snackbar para mensajes */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Movimientos;
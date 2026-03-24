/**
 * Página de Gestión de Muestras
 * Catálogo completo de muestras de materias primas
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Button, TextField, MenuItem, Chip, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, Grid,
  InputAdornment, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TablePagination, FormControl, InputLabel,
  Select, Snackbar, Alert, CircularProgress, Tooltip
} from '@mui/material';
import {
  Add as AddIcon, Search as SearchIcon, Edit as EditIcon,
  Visibility as ViewIcon, Delete as DeleteIcon, Refresh as RefreshIcon,
  Inventory2 as SampleIcon
} from '@mui/icons-material';
import { muestrasAPI, proveedoresAPI, clasesPeligroAPI } from '../services/api';

const Muestras = () => {
  // Estados
  const [muestras, setMuestras] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalMuestras, setTotalMuestras] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  
  // Filtros
  const [search, setSearch] = useState('');
  const [filtroLinea, setFiltroLinea] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroProveedor, setFiltroProveedor] = useState('');
  
  // Opciones para dropdowns
  const [proveedores, setProveedores] = useState([]);
  const [clasesPeligro, setClasesPeligro] = useState([]);
  const [lineasOptions, setLineasOptions] = useState([]);
  const [estadosOptions, setEstadosOptions] = useState([]);
  const [dimensionesOptions, setDimensionesOptions] = useState([]);
  
  // Modal de formulario
  const [openModal, setOpenModal] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [muestraActual, setMuestraActual] = useState(null);
  const [saving, setSaving] = useState(false);
  
  // Snackbar
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Cargar opciones al inicio
  useEffect(() => {
    loadOptions();
  }, []);

  const loadOptions = async () => {
    try {
      const [provRes, claseRes, lineasRes, estadosRes, dimRes] = await Promise.all([
        proveedoresAPI.getOptions(),
        clasesPeligroAPI.getOptions(),
        muestrasAPI.getLineasNegocioOptions(),
        muestrasAPI.getEstadosOptions(),
        muestrasAPI.getDimensionesOptions()
      ]);
      setProveedores(provRes.data);
      setClasesPeligro(claseRes.data);
      setLineasOptions(lineasRes.data);
      setEstadosOptions(estadosRes.data);
      setDimensionesOptions(dimRes.data);
    } catch (error) {
      console.error('Error cargando opciones:', error);
    }
  };

  // Cargar muestras
  const loadMuestras = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        skip: page * rowsPerPage,
        limit: rowsPerPage,
        search: search || undefined,
        linea_negocio: filtroLinea || undefined,
        estado: filtroEstado || undefined,
        proveedor_id: filtroProveedor || undefined
      };
      const response = await muestrasAPI.getAll(params);
      setMuestras(response.data);
      // El total real vendría del backend con paginación completa
      setTotalMuestras(response.data.length);
    } catch (error) {
      console.error('Error cargando muestras:', error);
      showSnackbar('Error al cargar muestras', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, search, filtroLinea, filtroEstado, filtroProveedor]);

  useEffect(() => {
    loadMuestras();
  }, [loadMuestras]);

  // Handlers
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleSearch = () => {
    setPage(0);
    loadMuestras();
  };

  // Modal de creación/edición
  const handleOpenCreate = () => {
    setModoEdicion(false);
    setMuestraActual({
      nombre: '',
      nombre_alternativo: '',
      cas_number: '',
      lote: '',
      proveedor_id: '',
      linea_negocio: 'cosméticos',
      clase_peligro_id: '',
      cantidad_gramos: '',
      dimension: '1x1',
      fecha_manufactura: null,
      fecha_vencimiento: null,
      qr_code: '',
      coa_path: '',
      hoja_seguridad_path: '',
      estado: 'activa',
      observaciones: '',
      etiquetas: ''
    });
    setOpenModal(true);
  };

  const handleOpenEdit = (muestra) => {
    setModoEdicion(true);
    setMuestraActual({
      ...muestra,
      // Mantener cantidad_gramos como string para permitir edición
      cantidad_gramos: String(muestra.cantidad_gramos ?? '')
    });
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setMuestraActual(null);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Convertir cantidad_gramos a número antes de guardar
      const dataToSave = {
        ...muestraActual,
        cantidad_gramos: muestraActual.cantidad_gramos === '' ? 0 : Number(muestraActual.cantidad_gramos)
      };
      
      if (modoEdicion) {
        await muestrasAPI.update(muestraActual.id, dataToSave);
        showSnackbar('Muestra actualizada correctamente');
      } else {
        await muestrasAPI.create(dataToSave);
        showSnackbar('Muestra creada correctamente');
      }
      handleCloseModal();
      loadMuestras();
    } catch (error) {
      console.error('Error guardando muestra:', error);
      showSnackbar(error.response?.data?.detail || 'Error al guardar muestra', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Está seguro de eliminar esta muestra?')) return;
    
    try {
      await muestrasAPI.delete(id);
      showSnackbar('Muestra eliminada correctamente');
      loadMuestras();
    } catch (error) {
      console.error('Error eliminando muestra:', error);
      showSnackbar('Error al eliminar muestra', 'error');
    }
  };

  const handleInputChange = (field) => (event) => {
    const value = event.target.value;
    setMuestraActual(prev => ({ ...prev, [field]: value }));
  };

  // Obtener nombre de proveedor
  const getProveedorNombre = (id) => {
    const prov = proveedores.find(p => p.id === id);
    return prov ? prov.nombre : '-';
  };

  // Obtener clase de peligro
  const getClasePeligroNombre = (id) => {
    const clase = clasesPeligro.find(c => c.id === id);
    return clase ? `${clase.codigo} - ${clase.nombre}` : '-';
  };

  // Color de estado
  const getEstadoColor = (estado) => {
    const colors = {
      activa: 'success',
      inactiva: 'default',
      agotada: 'warning',
      vencida: 'error',
      retirada: 'default'
    };
    return colors[estado] || 'default';
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Encabezado */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <SampleIcon sx={{ fontSize: 32, mr: 2, color: 'primary.main' }} />
        <Typography variant="h4" component="h1">
          Catálogo de Muestras
        </Typography>
      </Box>

      {/* Filtros */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="Buscar"
              placeholder="Nombre, CAS o Lote"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                )
              }}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Línea de Negocio</InputLabel>
              <Select
                value={filtroLinea}
                onChange={(e) => setFiltroLinea(e.target.value)}
                label="Línea de Negocio"
              >
                <MenuItem value="">Todas</MenuItem>
                {lineasOptions.map(opt => (
                  <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Estado</InputLabel>
              <Select
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
                label="Estado"
              >
                <MenuItem value="">Todos</MenuItem>
                {estadosOptions.map(opt => (
                  <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Proveedor</InputLabel>
              <Select
                value={filtroProveedor}
                onChange={(e) => setFiltroProveedor(e.target.value)}
                label="Proveedor"
              >
                <MenuItem value="">Todos</MenuItem>
                {proveedores.map(prov => (
                  <MenuItem key={prov.id} value={prov.id}>{prov.nombre}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleOpenCreate}
              >
                Nueva Muestra
              </Button>
              <IconButton onClick={loadMuestras} title="Actualizar">
                <RefreshIcon />
              </IconButton>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Tabla de resultados */}
      <Paper>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Nombre</TableCell>
                  <TableCell>CAS</TableCell>
                  <TableCell>Lote</TableCell>
                  <TableCell>Proveedor</TableCell>
                  <TableCell>Línea</TableCell>
                  <TableCell>Cantidad</TableCell>
                  <TableCell>Clase Peligro</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell align="right">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {muestras.map((muestra) => (
                  <TableRow key={muestra.id} hover>
                    <TableCell>{muestra.id}</TableCell>
                    <TableCell>{muestra.nombre}</TableCell>
                    <TableCell>{muestra.cas_number || '-'}</TableCell>
                    <TableCell>{muestra.lote || '-'}</TableCell>
                    <TableCell>{getProveedorNombre(muestra.proveedor_id)}</TableCell>
                    <TableCell>
                      <Chip 
                        label={muestra.linea_negocio} 
                        size="small" 
                        color="primary" 
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>{Number(muestra.cantidad_gramos).toFixed(2)} g</TableCell>
                    <TableCell>{getClasePeligroNombre(muestra.clase_peligro_id)}</TableCell>
                    <TableCell>
                      <Chip 
                        label={muestra.estado} 
                        size="small" 
                        color={getEstadoColor(muestra.estado)}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Ver">
                        <IconButton size="small">
                          <ViewIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Editar">
                        <IconButton size="small" onClick={() => handleOpenEdit(muestra)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Eliminar">
                        <IconButton size="small" color="error" onClick={() => handleDelete(muestra.id)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
                {muestras.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={10} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">
                        No se encontraron muestras
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
        <TablePagination
          rowsPerPageOptions={[10, 25, 50, 100]}
          component="div"
          count={totalMuestras}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>

      {/* Modal de formulario */}
      <Dialog open={openModal} onClose={handleCloseModal} maxWidth="md" fullWidth>
        <DialogTitle>
          {modoEdicion ? 'Editar Muestra' : 'Nueva Muestra'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {/* Nombre */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Nombre *"
                value={muestraActual?.nombre || ''}
                onChange={handleInputChange('nombre')}
              />
            </Grid>
            {/* Nombre alternativo */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Nombre Alternativo"
                value={muestraActual?.nombre_alternativo || ''}
                onChange={handleInputChange('nombre_alternativo')}
              />
            </Grid>
            {/* CAS Number */}
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="CAS Number"
                value={muestraActual?.cas_number || ''}
                onChange={handleInputChange('cas_number')}
              />
            </Grid>
            {/* Lote */}
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Lote"
                value={muestraActual?.lote || ''}
                onChange={handleInputChange('lote')}
              />
            </Grid>
            {/* Proveedor */}
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Proveedor</InputLabel>
                <Select
                  value={muestraActual?.proveedor_id || ''}
                  onChange={handleInputChange('proveedor_id')}
                  label="Proveedor"
                >
                  <MenuItem value="">Seleccionar...</MenuItem>
                  {proveedores.map(prov => (
                    <MenuItem key={prov.id} value={prov.id}>{prov.nombre}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            {/* Línea de negocio */}
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Línea de Negocio *</InputLabel>
                <Select
                  value={muestraActual?.linea_negocio || ''}
                  onChange={handleInputChange('linea_negocio')}
                  label="Línea de Negocio *"
                >
                  {lineasOptions.map(opt => (
                    <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            {/* Clase de peligro */}
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Clase de Peligro</InputLabel>
                <Select
                  value={muestraActual?.clase_peligro_id || ''}
                  onChange={handleInputChange('clase_peligro_id')}
                  label="Clase de Peligro"
                >
                  <MenuItem value="">Seleccionar...</MenuItem>
                  {clasesPeligro.map(clase => (
                    <MenuItem key={clase.id} value={clase.id}>{clase.codigo} - {clase.nombre}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            {/* Cantidad */}
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Cantidad (gramos) *"
                type="text"
                inputMode="numeric"
                value={muestraActual?.cantidad_gramos ?? ''}
                onChange={handleInputChange('cantidad_gramos')}
                onWheel={(e) => e.target.blur()}
                onKeyDown={(e) => {
                  // Prevenir entrada de caracteres no numéricos excepto números, punto y backspace
                  const allowedKeys = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '.', 'Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'];
                  if (!allowedKeys.includes(e.key)) {
                    e.preventDefault();
                  }
                  // Solo permitir un punto decimal
                  if (e.key === '.' && e.target.value.includes('.')) {
                    e.preventDefault();
                  }
                }}
                placeholder="Ej: 500"
              />
            </Grid>
            {/* Dimensión */}
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Dimensión *</InputLabel>
                <Select
                  value={muestraActual?.dimension || '1x1'}
                  onChange={handleInputChange('dimension')}
                  label="Dimensión *"
                >
                  {dimensionesOptions.map(opt => (
                    <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            {/* Estado */}
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Estado *</InputLabel>
                <Select
                  value={muestraActual?.estado || 'activa'}
                  onChange={handleInputChange('estado')}
                  label="Estado *"
                >
                  {estadosOptions.map(opt => (
                    <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            {/* Fecha manufactura */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Fecha de Manufactura"
                type="date"
                value={muestraActual?.fecha_manufactura?.split('T')[0] || ''}
                onChange={handleInputChange('fecha_manufactura')}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            {/* Fecha vencimiento */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Fecha de Vencimiento"
                type="date"
                value={muestraActual?.fecha_vencimiento?.split('T')[0] || ''}
                onChange={handleInputChange('fecha_vencimiento')}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            {/* Observaciones */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Observaciones"
                multiline
                rows={3}
                value={muestraActual?.observaciones || ''}
                onChange={handleInputChange('observaciones')}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModal}>Cancelar</Button>
          <Button 
            variant="contained" 
            onClick={handleSave}
            disabled={saving || !muestraActual?.nombre}
          >
            {saving ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
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

export default Muestras;
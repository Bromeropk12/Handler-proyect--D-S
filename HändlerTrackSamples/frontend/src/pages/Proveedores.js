/**
 * Página de Gestión de Proveedores
 * CRUD de proveedores de materias primas
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Button, TextField, MenuItem, Chip, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, Grid,
  InputAdornment, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TablePagination, Snackbar, Alert, CircularProgress,
  Switch, FormControlLabel, Autocomplete
} from '@mui/material';
import {
  Add as AddIcon, Search as SearchIcon, Edit as EditIcon,
  Delete as DeleteIcon, Refresh as RefreshIcon, Business as BusinessIcon
} from '@mui/icons-material';
import { proveedoresAPI } from '../services/api';

const Proveedores = () => {
  // Estados
  const [proveedores, setProveedores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  
  // Filtros
  const [search, setSearch] = useState('');
  
  // Opciones de líneas de negocio
  const LINEAS_NEGOCIO = [
    { value: 'cosméticos', label: 'Cosméticos' },
    { value: 'industrial', label: 'Industrial' },
    { value: 'farmacéutico', label: 'Farmacéutico' }
  ];
  
  // Modal
  const [openModal, setOpenModal] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [proveedorActual, setProveedorActual] = useState(null);
  const [saving, setSaving] = useState(false);
  
  // Snackbar
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Cargar proveedores
  const loadProveedores = useCallback(async () => {
    setLoading(true);
    try {
      const response = await proveedoresAPI.getAll({
        skip: page * rowsPerPage,
        limit: rowsPerPage,
        search: search || undefined
      });
      setProveedores(response.data);
      setTotal(response.data.length);
    } catch (error) {
      console.error('Error cargando proveedores:', error);
      showSnackbar('Error al cargar proveedores', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, search]);

  useEffect(() => {
    loadProveedores();
  }, [loadProveedores]);

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
    loadProveedores();
  };

  // Modal
  const handleOpenCreate = () => {
    setModoEdicion(false);
    setProveedorActual({
      nombre: '',
      nit: '',
      direccion: '',
      telefono: '',
      email: '',
      contacto_nombre: '',
      contacto_telefono: '',
      contacto_email: '',
      observaciones: '',
      activa: true,
      lineas_negocio: []
    });
    setOpenModal(true);
  };

  const handleOpenEdit = (proveedor) => {
    setModoEdicion(true);
    setProveedorActual({ ...proveedor });
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setProveedorActual(null);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (modoEdicion) {
        await proveedoresAPI.update(proveedorActual.id, proveedorActual);
        showSnackbar('Proveedor actualizado correctamente');
      } else {
        await proveedoresAPI.create(proveedorActual);
        showSnackbar('Proveedor creado correctamente');
      }
      handleCloseModal();
      loadProveedores();
    } catch (error) {
      console.error('Error guardando proveedor:', error);
      showSnackbar(error.response?.data?.detail || 'Error al guardar proveedor', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Está seguro de eliminar este proveedor?')) return;
    
    try {
      await proveedoresAPI.delete(id);
      showSnackbar('Proveedor eliminado correctamente');
      loadProveedores();
    } catch (error) {
      console.error('Error eliminando proveedor:', error);
      showSnackbar('Error al eliminar proveedor', 'error');
    }
  };

  const handleInputChange = (field) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setProveedorActual(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Encabezado */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <BusinessIcon sx={{ fontSize: 32, mr: 2, color: 'primary.main' }} />
        <Typography variant="h4" component="h1">
          Proveedores
        </Typography>
      </Box>

      {/* Filtros */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={8}>
            <TextField
              fullWidth
              label="Buscar"
              placeholder="Nombre o NIT"
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
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleOpenCreate}
              >
                Nuevo Proveedor
              </Button>
              <IconButton onClick={loadProveedores} title="Actualizar">
                <RefreshIcon />
              </IconButton>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Tabla */}
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
                  <TableCell>NIT</TableCell>
                  <TableCell>Teléfono</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Contacto</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell align="right">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {proveedores.map((prov) => (
                  <TableRow key={prov.id} hover>
                    <TableCell>{prov.id}</TableCell>
                    <TableCell>{prov.nombre}</TableCell>
                    <TableCell>{prov.nit}</TableCell>
                    <TableCell>{prov.telefono || '-'}</TableCell>
                    <TableCell>{prov.email || '-'}</TableCell>
                    <TableCell>{prov.contacto_nombre || '-'}</TableCell>
                    <TableCell>
                      <Chip 
                        label={prov.activa ? 'Activo' : 'Inactivo'} 
                        size="small" 
                        color={prov.activa ? 'success' : 'default'}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton size="small" onClick={() => handleOpenEdit(prov)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" color="error" onClick={() => handleDelete(prov.id)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {proveedores.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">
                        No se encontraron proveedores
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
        <TablePagination
          rowsPerPageOptions={[10, 25, 50]}
          component="div"
          count={total}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>

      {/* Modal */}
      <Dialog open={openModal} onClose={handleCloseModal} maxWidth="sm" fullWidth>
        <DialogTitle>
          {modoEdicion ? 'Editar Proveedor' : 'Nuevo Proveedor'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Nombre *"
                value={proveedorActual?.nombre || ''}
                onChange={handleInputChange('nombre')}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="NIT *"
                value={proveedorActual?.nit || ''}
                onChange={handleInputChange('nit')}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Dirección"
                value={proveedorActual?.direccion || ''}
                onChange={handleInputChange('direccion')}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Teléfono"
                value={proveedorActual?.telefono || ''}
                onChange={handleInputChange('telefono')}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={proveedorActual?.email || ''}
                onChange={handleInputChange('email')}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Nombre Contacto"
                value={proveedorActual?.contacto_nombre || ''}
                onChange={handleInputChange('contacto_nombre')}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Teléfono Contacto"
                value={proveedorActual?.contacto_telefono || ''}
                onChange={handleInputChange('contacto_telefono')}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Observaciones"
                multiline
                rows={2}
                value={proveedorActual?.observaciones || ''}
                onChange={handleInputChange('observaciones')}
              />
            </Grid>
            <Grid item xs={12}>
              <Autocomplete
                multiple
                options={LINEAS_NEGOCIO}
                getOptionLabel={(option) => option.label}
                value={(proveedorActual?.lineas_negocio || []).map(
                  l => LINEAS_NEGOCIO.find(opt => opt.value === l) || { value: l, label: l }
                )}
                onChange={(event, newValue) => {
                  setProveedorActual(prev => ({
                    ...prev,
                    lineas_negocio: newValue.map(v => v.value)
                  }));
                }}
                renderInput={(params) => (
                  <TextField {...params} label="Líneas de Negocio" placeholder="Seleccione líneas" />
                )}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      label={option.label}
                      size="small"
                      {...getTagProps({ index })}
                      key={option.value}
                    />
                  ))
                }
              />
            </Grid>
            {modoEdicion && (
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={proveedorActual?.activa ?? true}
                      onChange={handleInputChange('activa')}
                    />
                  }
                  label="Proveedor activo"
                />
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModal}>Cancelar</Button>
          <Button 
            variant="contained" 
            onClick={handleSave}
            disabled={saving || !proveedorActual?.nombre || !proveedorActual?.nit}
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

export default Proveedores;
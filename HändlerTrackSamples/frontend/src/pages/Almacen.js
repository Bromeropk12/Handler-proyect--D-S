/**
 * Página de Almacén - Gestión de estructura física
 * Muestra líneas de negocio, anaqueles y hileras del almacén
 */

import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, Button, Chip, IconButton,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, TextField, Dialog, DialogTitle, DialogContent, DialogActions,
  FormControl, InputLabel, Select, MenuItem, Alert, LinearProgress,
  List, ListItemText, Checkbox
} from '@mui/material';
import {
  Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon,
  Refresh as RefreshIcon, Inventory as InventoryIcon,
  GridView as GridViewIcon, TableChart as TableChartIcon,
  ViewList as ViewListIcon, Groups as GroupsIcon
} from '@mui/icons-material';
import api from '../services/api';

const Almacen = () => {
  const [loading, setLoading] = useState(true);
  const [lineas, setLineas] = useState([]);
  const [anaqueles, setAnaqueles] = useState([]);
  const [hileras, setHileras] = useState([]);
  const [activeTab, setActiveTab] = useState('lineas');
  const [selectedLinea, setSelectedLinea] = useState(null);
  const [selectedAnaquel, setSelectedAnaquel] = useState(null);
  const [lineaLocked, setLineaLocked] = useState(false);
  
  // Modal states
  const [openLineaModal, setOpenLineaModal] = useState(false);
  const [openAnaquelModal, setOpenAnaquelModal] = useState(false);
  const [openProveedoresModal, setOpenProveedoresModal] = useState(false);
  const [editingLinea, setEditingLinea] = useState(null);
  const [editingAnaquel, setEditingAnaquel] = useState(null);
  const [proveedoresAnaquel, setProveedoresAnaquel] = useState([]);
  const [allProveedores, setAllProveedores] = useState([]);
  const [selectedProveedores, setSelectedProveedores] = useState([]);
  
  // Form states
  const [lineaForm, setLineaForm] = useState({ nombre: '', descripcion: '' });
  const [anaquelForm, setAnaquelForm] = useState({
    nombre: '', descripcion: '', linea_id: '', proveedor_principal: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [lineasRes, anaquelesRes] = await Promise.all([
        api.get('/api/lineas'),
        api.get('/api/anaqueles')
      ]);
      setLineas(lineasRes.data);
      setAnaqueles(anaquelesRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadHileras = async (anaquelId) => {
    try {
      const res = await api.get(`/api/hileras?anaquel_id=${anaquelId}`);
      setHileras(res.data);
    } catch (error) {
      console.error('Error loading hileras:', error);
    }
  };

  // Cargar todos los proveedores para el modal
  const loadAllProveedores = async () => {
    try {
      const res = await api.get('/proveedores');
      setAllProveedores(res.data);
    } catch (error) {
      console.error('Error loading proveedores:', error);
    }
  };

  // Cargar proveedores de un anaquel específico
  const loadProveedoresAnaquel = async (anaquelId) => {
    try {
      const res = await api.get(`/api/anaquel-proveedor/anaquel/${anaquelId}/proveedores`);
      setProveedoresAnaquel(res.data);
      // Inicializar seleccionados
      setSelectedProveedores(res.data.map(p => p.id));
    } catch (error) {
      console.error('Error loading proveedores anaquel:', error);
    }
  };

  // Toggle checkbox de proveedor
  const handleToggleProveedor = (proveedorId) => {
    setSelectedProveedores(prev => {
      if (prev.includes(proveedorId)) {
        return prev.filter(id => id !== proveedorId);
      } else {
        return [...prev, proveedorId];
      }
    });
  };

  // Obtener información de proveedor asignado
  const getProveedorInfo = (proveedorId) => {
    const prov = proveedoresAnaquel.find(p => p.id === proveedorId);
    if (!prov) return null;
    return {
      isAssigned: true,
      isPrincipal: prov.es_principal || false,
      nombre: prov.nombre
    };
  };

  // Abrir modal de proveedores
  const handleOpenProveedoresModal = async (anaquel) => {
    setSelectedAnaquel(anaquel);
    setSelectedProveedores([]); // Limpiar selección anterior
    await loadAllProveedores();
    await loadProveedoresAnaquel(anaquel.id);
    setOpenProveedoresModal(true);
  };

  // Asignar proveedores a anaquel
  const handleAsignarProveedores = async (proveedorIds) => {
    try {
      await api.post('/api/anaquel-proveedor/asignar-multiples', {
        anaquel_id: selectedAnaquel.id,
        proveedor_ids: proveedorIds
      });
      setOpenProveedoresModal(false);
      loadData();
      alert('Proveedores asignados correctamente');
    } catch (error) {
      console.error('Error assigning proveedores:', error);
      alert('Error al asignar proveedores');
    }
  };

  // Linea handlers
  const handleOpenLineaModal = (linea = null) => {
    if (linea) {
      setEditingLinea(linea);
      setLineaForm({ nombre: linea.nombre, descripcion: linea.descripcion || '' });
    } else {
      setEditingLinea(null);
      setLineaForm({ nombre: '', descripcion: '' });
    }
    setOpenLineaModal(true);
  };

  const handleSaveLinea = async () => {
    try {
      if (editingLinea) {
        await api.put(`/api/lineas/${editingLinea.id}`, lineaForm);
      } else {
        await api.post('/api/lineas', lineaForm);
      }
      setOpenLineaModal(false);
      loadData();
    } catch (error) {
      console.error('Error saving linea:', error);
    }
  };

  const handleDeleteLinea = async (id) => {
    if (!window.confirm('¿Está seguro de eliminar esta línea?')) return;
    try {
      await api.delete(`/api/lineas/${id}`);
      loadData();
    } catch (error) {
      console.error('Error deleting linea:', error);
    }
  };

  // Anaquel handlers
  const handleOpenAnaquelModal = (anaquel = null) => {
    if (anaquel) {
      setEditingAnaquel(anaquel);
      setAnaquelForm({
        nombre: anaquel.nombre,
        descripcion: anaquel.descripcion || '',
        linea_id: anaquel.linea_id,
        proveedor_principal: anaquel.proveedor_principal || ''
      });
    } else {
      setEditingAnaquel(null);
      setAnaquelForm({ nombre: '', descripcion: '', linea_id: '', proveedor_principal: '' });
    }
    setOpenAnaquelModal(true);
  };

  const handleSaveAnaquel = async () => {
    try {
      const data = { ...anaquelForm, linea_id: parseInt(anaquelForm.linea_id) };
      if (editingAnaquel) {
        await api.put(`/api/anaqueles/${editingAnaquel.id}`, data);
      } else {
        await api.post('/api/anaqueles', data);
      }
      setOpenAnaquelModal(false);
      loadData();
    } catch (error) {
      console.error('Error saving anaquel:', error);
    }
  };

  const handleDeleteAnaquel = async (id) => {
    if (!window.confirm('¿Está seguro de eliminar este anaquel?')) return;
    try {
      await api.delete(`/api/anaqueles/${id}`);
      loadData();
    } catch (error) {
      console.error('Error deleting anaquel:', error);
    }
  };

  const handleSelectAnaquel = (anaquel) => {
    setSelectedAnaquel(anaquel);
    loadHileras(anaquel.id);
  };

  // Stats
  const getLineaStats = (lineaId) => {
    const lineAnaqueles = anaqueles.filter(a => a.linea_id === lineaId);
    return {
      total: lineAnaqueles.length,
      activos: lineAnaqueles.filter(a => a.activo).length,
      disponibles: lineAnaqueles.reduce((acc, a) => acc + (a.hileras_disponibles || 0), 0)
    };
  };

  if (loading) {
    return <Box sx={{ p: 3 }}><LinearProgress /></Box>;
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 600, color: 'primary.main' }}>
          Gestión de Almacén
        </Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={loadData}
        >
          Actualizar
        </Button>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Button
          variant={activeTab === 'lineas' ? 'contained' : 'text'}
          onClick={() => { setActiveTab('lineas'); setSelectedAnaquel(null); }}
          startIcon={<TableChartIcon />}
          sx={{ mr: 1 }}
        >
          Líneas de Negocio
        </Button>
        <Button
          variant={activeTab === 'anaqueles' ? 'contained' : 'text'}
          onClick={() => { setActiveTab('anaqueles'); setSelectedAnaquel(null); }}
          startIcon={<GridViewIcon />}
          sx={{ mr: 1 }}
        >
          Anaqueles (14)
        </Button>
        <Button
          variant={activeTab === 'hileras' ? 'contained' : 'text'}
          onClick={() => setActiveTab('hileras')}
          startIcon={<ViewListIcon />}
          disabled={!selectedAnaquel}
        >
          Hileras
        </Button>
      </Box>

      {/* Líneas de Negocio Tab */}
      {activeTab === 'lineas' && (
        <>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenLineaModal()}
            >
              Nueva Línea
            </Button>
          </Box>

          <Grid container spacing={3}>
            {lineas.map((linea) => {
              const stats = getLineaStats(linea.id);
              return (
                <Grid item xs={12} md={4} key={linea.id}>
                  <Card sx={{ 
                    cursor: 'pointer',
                    transition: '0.2s',
                    '&:hover': { transform: 'translateY(-2px)', boxShadow: 4 }
                  }}
                  onClick={() => { setSelectedLinea(linea); setActiveTab('anaqueles'); setLineaLocked(true); }}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {linea.nombre}
                        </Typography>
                        <Chip 
                          label={linea.activa ? 'Activa' : 'Inactiva'} 
                          color={linea.activa ? 'success' : 'default'}
                          size="small"
                        />
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 2 }}>
                        {linea.descripcion || 'Sin descripción'}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 2 }}>
                        <Chip 
                          icon={<InventoryIcon />} 
                          label={`${stats.total} anaqueles`} 
                          variant="outlined"
                          size="small"
                        />
                        <Chip 
                          label={`${stats.disponibles} hileras`} 
                          variant="outlined"
                          size="small"
                        />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>

          {lineas.length === 0 && (
            <Alert severity="info">
              No hay líneas de negocio. Haga clic en "Nueva Línea" para crear una.
            </Alert>
          )}
        </>
      )}

      {/* Anaqueles Tab */}
      {activeTab === 'anaqueles' && (
        <>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              {lineaLocked && selectedLinea && (
                <>
                  <Chip
                    label={selectedLinea.nombre}
                    color="primary"
                    variant="filled"
                  />
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => { setSelectedLinea(null); setLineaLocked(false); setActiveTab('lineas'); }}
                  >
                    Cambiar Línea
                  </Button>
                </>
              )}
              {!lineaLocked && lineas.map((linea) => (
                <Chip
                  key={linea.id}
                  label={linea.nombre}
                  onClick={() => { setSelectedLinea(linea); setLineaLocked(true); }}
                  color={selectedLinea?.id === linea.id ? 'primary' : 'default'}
                  variant={selectedLinea?.id === linea.id ? 'filled' : 'outlined'}
                />
              ))}
            </Box>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenAnaquelModal()}
            >
              Nuevo Anaquel
            </Button>
          </Box>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'primary.main' }}>
                  <TableCell sx={{ color: 'white', fontWeight: 600 }}>Nombre</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 600 }}>Línea</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 600 }}>Proveedor</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 600 }}>Niveles</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 600 }}>Hileras</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 600 }}>Disponibles</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 600 }}>Estado</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 600 }}>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {anaqueles
                  .filter(a => !selectedLinea || a.linea_id === selectedLinea.id)
                  .map((anaquel) => (
                    <TableRow 
                      key={anaquel.id}
                      hover
                      sx={{ cursor: 'pointer' }}
                      onClick={() => handleSelectAnaquel(anaquel)}
                    >
                      <TableCell sx={{ fontWeight: 600 }}>{anaquel.nombre}</TableCell>
                      <TableCell>{anaquel.linea?.nombre || '-'}</TableCell>
                      <TableCell>{anaquel.proveedor_principal || '-'}</TableCell>
                      <TableCell>{anaquel.niveles}</TableCell>
                      <TableCell>{anaquel.total_hileras || 0}</TableCell>
                      <TableCell>
                        <Chip 
                          label={`${anaquel.hileras_disponibles || 0}`}
                          color={anaquel.hileras_disponibles > 50 ? 'success' : 'warning'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={anaquel.activo ? 'Activo' : 'Inactivo'}
                          color={anaquel.activo ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <IconButton size="small" onClick={() => handleOpenAnaquelModal(anaquel)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" color="primary" onClick={() => handleOpenProveedoresModal(anaquel)} title="Gestionar Proveedores">
                          <GroupsIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" color="error" onClick={() => handleDeleteAnaquel(anaquel.id)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}

      {/* Hileras Tab */}
      {activeTab === 'hileras' && selectedAnaquel && (
        <>
          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              Hileras del Anaquel: {selectedAnaquel.nombre}
            </Typography>
            <Button onClick={() => setActiveTab('anaqueles')}>
              Volver a Anaqueles
            </Button>
          </Box>

          <Grid container spacing={2}>
            {[...new Set(hileras.map(h => h.nivel))].sort().map((nivel) => (
              <Grid item xs={12} key={nivel}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mt: 2, mb: 1 }}>
                  Nivel {nivel} ({hileras.filter(h => h.nivel === nivel && h.estado === 'disponible').length} disponibles)
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {hileras
                    .filter(h => h.nivel === nivel)
                    .sort((a, b) => a.fila - b.fila)
                    .map((hilera) => (
                      <Chip
                        key={hilera.id}
                        label={`F${hilera.fila}`}
                        color={hilera.estado === 'disponible' ? 'success' : 'error'}
                        variant={hilera.muestra ? 'filled' : 'outlined'}
                        onClick={() => console.log('Hilera:', hilera)}
                      />
                    ))}
                </Box>
              </Grid>
            ))}
          </Grid>

          {hileras.length === 0 && (
            <Alert severity="warning">
              No hay hileras configuradas para este anaquel.
            </Alert>
          )}
        </>
      )}

      {/* Modal Línea */}
      <Dialog open={openLineaModal} onClose={() => setOpenLineaModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingLinea ? 'Editar Línea' : 'Nueva Línea'}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Nombre"
            value={lineaForm.nombre}
            onChange={(e) => setLineaForm({ ...lineaForm, nombre: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Descripción"
            value={lineaForm.descripcion}
            onChange={(e) => setLineaForm({ ...lineaForm, descripcion: e.target.value })}
            margin="normal"
            multiline
            rows={2}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenLineaModal(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSaveLinea}>Guardar</Button>
        </DialogActions>
      </Dialog>

      {/* Modal Anaquel */}
      <Dialog open={openAnaquelModal} onClose={() => setOpenAnaquelModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingAnaquel ? 'Editar Anaquel' : 'Nuevo Anaquel'}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Nombre"
            value={anaquelForm.nombre}
            onChange={(e) => setAnaquelForm({ ...anaquelForm, nombre: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Descripción"
            value={anaquelForm.descripcion}
            onChange={(e) => setAnaquelForm({ ...anaquelForm, descripcion: e.target.value })}
            margin="normal"
            multiline
            rows={2}
          />
          <FormControl fullWidth margin="normal" disabled={!!editingAnaquel}>
            <InputLabel>Línea de Negocio</InputLabel>
            <Select
              value={anaquelForm.linea_id}
              onChange={(e) => setAnaquelForm({ ...anaquelForm, linea_id: e.target.value })}
              label="Línea de Negocio"
              disabled={!!editingAnaquel}
            >
              {lineas.map((linea) => (
                <MenuItem key={linea.id} value={linea.id}>{linea.nombre}</MenuItem>
              ))}
            </Select>
          </FormControl>
          {editingAnaquel && (
            <Typography variant="caption" color="error">
              La línea de negocio no se puede cambiar una vez creado el anaquel
            </Typography>
          )}
          <TextField
            fullWidth
            label="Proveedor Principal"
            value={anaquelForm.proveedor_principal}
            onChange={(e) => setAnaquelForm({ ...anaquelForm, proveedor_principal: e.target.value })}
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAnaquelModal(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSaveAnaquel}>Guardar</Button>
        </DialogActions>
      </Dialog>

      {/* Modal Gestión de Proveedores del Anaquel (RNF-2) */}
      <Dialog open={openProveedoresModal} onClose={() => setOpenProveedoresModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Gestionar Proveedores - {selectedAnaquel?.nombre}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Seleccione los proveedores que tendrá este anaquel. El primero será el principal.
          </Typography>
          <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, maxHeight: 300, overflow: 'auto' }}>
            {allProveedores.map((proveedor) => {
              const info = getProveedorInfo(proveedor.id);
              return (
                <Box
                  key={proveedor.id}
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    p: 1, 
                    borderBottom: '1px solid #eee',
                    bgcolor: selectedProveedores.includes(proveedor.id) ? 'action.selected' : 'transparent'
                  }}
                >
                  <Checkbox
                    checked={selectedProveedores.includes(proveedor.id)}
                    onChange={() => handleToggleProveedor(proveedor.id)}
                  />
                  <Box sx={{ ml: 1, flex: 1 }}>
                    <Typography variant="body1" sx={{ fontWeight: info?.isAssigned ? 600 : 400 }}>
                      {proveedor.nombre}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      NIT: {proveedor.nit}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    {info?.isAssigned && (
                      <Chip label="✓ Asignado" size="small" color="success" variant="outlined" />
                    )}
                    {!info?.isAssigned && (
                      <Chip label="Sin asignar" size="small" variant="outlined" />
                    )}
                  </Box>
                </Box>
              );
            })}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenProveedoresModal(false)}>Cancelar</Button>
          <Button 
            variant="contained" 
            onClick={() => handleAsignarProveedores(selectedProveedores)}
            disabled={selectedProveedores.length === 0}
          >
            Guardar Proveedores
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Almacen;
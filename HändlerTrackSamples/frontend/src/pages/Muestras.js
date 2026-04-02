/**
 * Página de Gestión de Muestras - DISEÑO MINIMALISTA
 * Vista limpia con opción de eliminar definitivamente
 * Incluye generación de etiquetas QR
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Button, TextField, MenuItem, Chip, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, Grid,
  InputAdornment, Paper, Card, CardContent, Snackbar, Alert, 
  LinearProgress, Tooltip, Divider, Avatar
} from '@mui/material';
import {
  Add as AddIcon, Search as SearchIcon, Edit as EditIcon,
  Delete as DeleteIcon, Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon, ExpandLess as ExpandLessIcon,
  Inventory2 as SampleIcon, FilterList as FilterIcon,
  QrCode as QrCodeIcon, Print as PrintIcon
} from '@mui/icons-material';
import { muestrasAPI, proveedoresAPI, clasesPeligroAPI, dosificacionAPI } from '../services/api';
import api from '../services/api';
import EtiquetaPreview from '../components/EtiquetaPreview';

const Muestras = () => {
  const [muestras, setMuestras] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedCard, setExpandedCard] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [eliminadas, setEliminadas] = useState([]);
  
  const [search, setSearch] = useState('');
  const [filtroLinea, setFiltroLinea] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroProveedor, setFiltroProveedor] = useState('');
  
  const [proveedores, setProveedores] = useState([]);
  const [clasesPeligro, setClasesPeligro] = useState([]);
  const [lineasOptions, setLineasOptions] = useState([]);
  const [estadosOptions, setEstadosOptions] = useState([]);
  const [dimensionesOptions, setDimensionesOptions] = useState([]);
  
  const [openModal, setOpenModal] = useState(false);
  const [openDeleteConfirm, setOpenDeleteConfirm] = useState(false);
  const [muestraToDelete, setMuestraToDelete] = useState(null);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [muestraActual, setMuestraActual] = useState(null);
  const [saving, setSaving] = useState(false);
  
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [contadoresSubmuestras, setContadoresSubmuestras] = useState({});

  // Etiqueta QR
  const [openEtiqueta, setOpenEtiqueta] = useState(false);
  const [etiquetaData, setEtiquetaData] = useState(null);
  const [generandoEtiqueta, setGenerandoEtiqueta] = useState(false);

  useEffect(() => {
    loadOptions();
    const eliminadasGuardadas = localStorage.getItem('muestrasEliminadas');
    if (eliminadasGuardadas) {
      setEliminadas(JSON.parse(eliminadasGuardadas));
    }
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
      
      const contadores = {};
      for (const m of response.data) {
        try {
          const res = await dosificacionAPI.getContadorSubmuestras(m.id);
          contadores[m.id] = res.data.total_submuestras || 0;
        } catch (e) {
          contadores[m.id] = 0;
        }
      }
      setContadoresSubmuestras(contadores);
      setMuestras(response.data);
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

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleSearch = () => {
    setPage(0);
    loadMuestras();
  };

  const handleOpenCreate = () => {
    setModoEdicion(false);
    setMuestraActual({
      nombre: '', nombre_alternativo: '', cas_number: '', lote: '',
      proveedor_id: '', linea_negocio: 'cosméticos', clase_peligro_id: '',
      cantidad_gramos: '', dimension: '1x1', fecha_manufactura: null,
      fecha_vencimiento: null, qr_code: '', estado: 'activa', observaciones: ''
    });
    setOpenModal(true);
  };

  const handleOpenEdit = (muestra) => {
    setModoEdicion(true);
    setMuestraActual({
      ...muestra,
      cantidad_gramos: String(muestra.cantidad_gramos ?? '')
    });
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setMuestraActual(null);
  };

  const handleConfirmDelete = (muestra) => {
    setMuestraToDelete(muestra);
    setOpenDeleteConfirm(true);
  };

  const handlePermanentDelete = async () => {
    if (!muestraToDelete) return;
    
    try {
      await muestrasAPI.delete(muestraToDelete.id);
      
      const nuevasEliminadas = [...eliminadas, muestraToDelete.id];
      setEliminadas(nuevasEliminadas);
      localStorage.setItem('muestrasEliminadas', JSON.stringify(nuevasEliminadas));
      
      showSnackbar(`"${muestraToDelete.nombre}" eliminada definitivamente`);
      setOpenDeleteConfirm(false);
      setMuestraToDelete(null);
      loadMuestras();
    } catch (error) {
      console.error('Error eliminando muestra:', error);
      showSnackbar('Error al eliminar muestra', 'error');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const formatDate = (date) => {
        if (!date) return null;
        if (date instanceof Date) return date.toISOString();
        if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
          return date + 'T00:00:00';
        }
        return date;
      };

      const dataToSave = {
        ...muestraActual,
        cantidad_gramos: muestraActual.cantidad_gramos === '' ? 0 : Number(muestraActual.cantidad_gramos),
        fecha_manufactura: formatDate(muestraActual.fecha_manufactura),
        fecha_vencimiento: formatDate(muestraActual.fecha_vencimiento),
        proveedor_id: muestraActual.proveedor_id || null,
        clase_peligro_id: muestraActual.clase_peligro_id || null,
      };
      
      delete dataToSave.created_at;
      delete dataToSave.updated_at;
      delete dataToSave.fecha_ingreso;
      
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
      showSnackbar('Error al guardar muestra', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field) => (event) => {
    const value = event.target.value;
    setMuestraActual(prev => ({ ...prev, [field]: value }));
  };

  const getProveedorNombre = (id) => {
    const prov = proveedores.find(p => p.id === id);
    return prov ? prov.nombre : 'N/A';
  };

  const handleGenerarEtiqueta = async (muestra) => {
    setGenerandoEtiqueta(true);
    try {
      console.log('Generando etiqueta para muestra:', muestra.id, muestra.nombre);
      const payload = {
        muestra_id: muestra.id,
        nombre: muestra.nombre,
        lote: muestra.lote,
        cantidad: muestra.cantidad_gramos,
        proveedor: getProveedorNombre(muestra.proveedor_id),
        fecha_vencimiento: muestra.fecha_vencimiento
      };
      console.log('Payload enviado:', payload);

      const response = await api.post('/api/qr/generar-etiqueta', payload);
      console.log('Respuesta completa:', response);
      console.log('Respuesta data:', response.data);

      if (response.data && response.data.etiqueta) {
        console.log('Etiqueta data:', response.data.etiqueta);
        console.log('QR image length:', response.data.etiqueta.qr_image ? response.data.etiqueta.qr_image.length : 'UNDEFINED');
        console.log('Setting etiquetaData to:', response.data.etiqueta);
        setEtiquetaData(response.data.etiqueta);
        console.log('Opening etiqueta dialog...');
        setOpenEtiqueta(true);
      } else {
        console.error('Respuesta sin etiqueta:', response.data);
        showSnackbar('Error: Respuesta sin datos de etiqueta', 'error');
      }
    } catch (error) {
      console.error('Error generando etiqueta:', error);
      console.error('Error details:', error.response?.data);
      showSnackbar('Error al generar etiqueta', 'error');
    } finally {
      setGenerandoEtiqueta(false);
    }
  };

  const getClasePeligroNombre = (id) => {
    if (!id || id === '' || id === null) return 'Sin clase';
    const clase = clasesPeligro.find(c => c.id === id);
    if (clase) return clase.codigo === 'GHS00' ? 'No peligroso' : clase.codigo;
    return 'Sin clase';
  };

  const getClasePeligroColor = (id) => {
    if (!id || id === '' || id === null) return 'default';
    const clase = clasesPeligro.find(c => c.id === id);
    if (clase && clase.codigo === 'GHS00') return 'success';
    return 'warning';
  };

  const getEstadoColor = (estado) => {
    const colors = { activa: 'success', inactiva: 'default', agotada: 'warning', vencida: 'error' };
    return colors[estado] || 'default';
  };

  const toggleExpand = (id) => {
    setExpandedCard(expandedCard === id ? null : id);
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return '-';
    try {
      return new Date(fecha).toLocaleDateString('es-CO');
    } catch {
      return fecha;
    }
  };

  const diasParaVencer = (fechaVencimiento) => {
    if (!fechaVencimiento) return null;
    const hoy = new Date();
    const vencimiento = new Date(fechaVencimiento);
    return Math.ceil((vencimiento - hoy) / (1000 * 60 * 60 * 24));
  };

  // Filtrar muestras eliminadas
  const muestrasFiltradas = muestras.filter(m => !eliminadas.includes(m.id));

  return (
    <Box sx={{ p: 2, maxWidth: '100%' }}>
      {/* Header minimalista */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          Muestras
        </Typography>
        <Chip label={`${muestrasFiltradas.length} items`} size="small" />
        <Box sx={{ flexGrow: 1 }} />
        <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={handleOpenCreate}>
          Agregar
        </Button>
      </Box>

      {/* Filtros minimalistas */}
      <Paper sx={{ p: 1.5, mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField
          size="small"
          placeholder="Buscar..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          sx={{ minWidth: 150 }}
          InputProps={{
            startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>
          }}
        />
        <TextField select size="small" value={filtroLinea} onChange={(e) => setFiltroLinea(e.target.value)} sx={{ minWidth: 100 }}>
          <MenuItem value="">Línea</MenuItem>
          {lineasOptions.map(opt => <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>)}
        </TextField>
        <TextField select size="small" value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)} sx={{ minWidth: 100 }}>
          <MenuItem value="">Estado</MenuItem>
          {estadosOptions.map(opt => <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>)}
        </TextField>
        <TextField select size="small" value={filtroProveedor} onChange={(e) => setFiltroProveedor(e.target.value)} sx={{ minWidth: 120 }}>
          <MenuItem value="">Proveedor</MenuItem>
          {proveedores.map(prov => <MenuItem key={prov.id} value={prov.id}>{prov.nombre}</MenuItem>)}
        </TextField>
        <Button size="small" onClick={handleSearch}>Filtrar</Button>
        <IconButton size="small" onClick={loadMuestras}><RefreshIcon fontSize="small" /></IconButton>
      </Paper>

      {loading && <LinearProgress sx={{ mb: 1 }} />}

      {/* Lista minimalista de cards */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {muestrasFiltradas.map((muestra) => {
          const diasVenc = diasParaVencer(muestra.fecha_vencimiento);
          const vencido = diasVenc !== null && diasVenc < 0;
          
          return (
            <Card 
              key={muestra.id}
              sx={{ 
                cursor: 'pointer',
                transition: 'all 0.2s',
                '&:hover': { boxShadow: 3 }
              }}
              onClick={() => toggleExpand(muestra.id)}
            >
              <CardContent sx={{ py: 1.5, px: 2, '&:last-child': { pb: 1.5 } }}>
                <Grid container spacing={2} alignItems="center">
                  {/* Info principal en una línea */}
                  <Grid item xs={12} md={3}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Avatar sx={{ width: 36, height: 36, bgcolor: 'grey.200', color: 'grey.600' }}>
                        <SampleIcon fontSize="small" />
                      </Avatar>
                      <Box>
                        <Typography variant="body1" sx={{ fontWeight: 500, lineHeight: 1.2 }}>
                          {muestra.nombre}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {muestra.cas_number || 'Sin CAS'} · {muestra.lote || 'Sin lote'}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>

                  <Grid item xs={4} md={2}>
                    <Typography variant="caption" color="text.secondary" display="block">Proveedor</Typography>
                    <Typography variant="body2" noWrap>{getProveedorNombre(muestra.proveedor_id)}</Typography>
                  </Grid>

                  <Grid item xs={4} md={2}>
                    <Typography variant="caption" color="text.secondary" display="block">Cantidad</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'primary.main' }}>
                      {Number(muestra.cantidad_gramos).toFixed(1)}g
                    </Typography>
                  </Grid>

                  <Grid item xs={4} md={2}>
                    <Typography variant="caption" color="text.secondary" display="block">Vence</Typography>
                    <Typography variant="body2" color={vencido ? 'error' : 'text.primary'}>
                      {vencido ? 'Vencida' : formatearFecha(muestra.fecha_vencimiento)}
                    </Typography>
                  </Grid>

                  <Grid item xs={6} md={2}>
                    <Chip 
                      label={getClasePeligroNombre(muestra.clase_peligro_id)} 
                      color={getClasePeligroColor(muestra.clase_peligro_id)}
                      size="small" 
                      variant="outlined"
                    />
                  </Grid>

                  <Grid item xs={6} md={1}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Chip label={muestra.estado} color={getEstadoColor(muestra.estado)} size="small" />
                      {expandedCard === muestra.id ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </Box>
                  </Grid>
                </Grid>

                {/* Expanded */}
                {expandedCard === muestra.id && (
                  <>
                    <Divider sx={{ my: 1.5 }} />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={4}>
                          <Typography variant="caption" color="text.secondary">Nombre alternativo</Typography>
                          <Typography variant="body2">{muestra.nombre_alternativo || '-'}</Typography>
                        </Grid>
                        <Grid item xs={6} sm={2}>
                          <Typography variant="caption" color="text.secondary">Línea</Typography>
                          <Typography variant="body2">{muestra.linea_negocio}</Typography>
                        </Grid>
                        <Grid item xs={6} sm={2}>
                          <Typography variant="caption" color="text.secondary">Dimensión</Typography>
                          <Typography variant="body2">{muestra.dimension || '1x1'}</Typography>
                        </Grid>
                        <Grid item xs={6} sm={2}>
                          <Typography variant="caption" color="text.secondary">Fabricación</Typography>
                          <Typography variant="body2">{formatearFecha(muestra.fecha_manufactura)}</Typography>
                        </Grid>
                        <Grid item xs={12} sm={12}>
                          <Typography variant="caption" color="text.secondary">Observaciones</Typography>
                          <Typography variant="body2" sx={{ fontStyle: muestra.observaciones ? 'normal' : 'italic' }}>
                            {muestra.observaciones || 'Sin observaciones'}
                          </Typography>
                        </Grid>
                      </Grid>
                      <Box sx={{ display: 'flex', gap: 0.5 }} onClick={(e) => e.stopPropagation()}>
                        <Tooltip title="Imprimir Etiqueta">
                          <IconButton size="small" color="info" onClick={() => handleGenerarEtiqueta(muestra)}>
                            <QrCodeIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Editar">
                          <IconButton size="small" onClick={() => handleOpenEdit(muestra)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Eliminar definitivamente">
                          <IconButton size="small" color="error" onClick={() => handleConfirmDelete(muestra)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>
                  </>
                )}
              </CardContent>
            </Card>
          );
        })}

        {muestrasFiltradas.length === 0 && !loading && (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <SampleIcon sx={{ fontSize: 40, color: 'grey.400', mb: 1 }} />
            <Typography color="text.secondary">No hay muestras</Typography>
            <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={handleOpenCreate} sx={{ mt: 1 }}>
              Crear muestra
            </Button>
          </Paper>
        )}
      </Box>

      {/* Paginación simple */}
      {muestrasFiltradas.length > 0 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2, gap: 1 }}>
          <Button size="small" disabled={page === 0} onClick={() => setPage(0)}>Inicio</Button>
          <Typography sx={{ alignSelf: 'center' }}>Página {page + 1}</Typography>
          <Button size="small" onClick={() => setPage(p => p + 1)} disabled={muestrasFiltradas.length < rowsPerPage}>Siguiente</Button>
        </Box>
      )}

      {/* Modal crear/editar */}
      <Dialog open={openModal} onClose={handleCloseModal} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>
          {modoEdicion ? 'Editar' : 'Nueva'} Muestra
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={1.5} sx={{ mt: 0.5 }}>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth size="small" label="Nombre *" value={muestraActual?.nombre || ''} onChange={handleInputChange('nombre')} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth size="small" label="CAS" value={muestraActual?.cas_number || ''} onChange={handleInputChange('cas_number')} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth size="small" label="Lote" value={muestraActual?.lote || ''} onChange={handleInputChange('lote')} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth size="small" select label="Proveedor" value={muestraActual?.proveedor_id || ''} onChange={handleInputChange('proveedor_id')}>
                <MenuItem value=""><em>None</em></MenuItem>
                {proveedores.map(p => <MenuItem key={p.id} value={p.id}>{p.nombre}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth size="small" label="Cantidad (g) *" type="number" value={muestraActual?.cantidad_gramos ?? ''} onChange={handleInputChange('cantidad_gramos')} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth size="small" select label="Línea" value={muestraActual?.linea_negocio || ''} onChange={handleInputChange('linea_negocio')}>
                {lineasOptions.map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth size="small" select label="Estado" value={muestraActual?.estado || 'activa'} onChange={handleInputChange('estado')}>
                {estadosOptions.map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth size="small" label="Fabricación" type="date" value={muestraActual?.fecha_manufactura?.split('T')[0] || ''} onChange={handleInputChange('fecha_manufactura')} InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth size="small" label="Vencimiento" type="date" value={muestraActual?.fecha_vencimiento?.split('T')[0] || ''} onChange={handleInputChange('fecha_vencimiento')} InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth size="small" label="Observaciones" multiline rows={2} value={muestraActual?.observaciones || ''} onChange={handleInputChange('observaciones')} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModal}>Cancelar</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving || !muestraActual?.nombre}>
            {saving ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirmar eliminación */}
      <Dialog open={openDeleteConfirm} onClose={() => setOpenDeleteConfirm(false)}>
        <DialogTitle>Eliminar muestra</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Estás seguro de eliminar "{muestraToDelete?.nombre}"? Esta acción no se puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteConfirm(false)}>Cancelar</Button>
          <Button variant="contained" color="error" onClick={handlePermanentDelete}>Eliminar</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Vista previa de etiqueta */}
      <EtiquetaPreview 
        open={openEtiqueta}
        onClose={() => setOpenEtiqueta(false)}
        etiqueta={etiquetaData}
      />
    </Box>
  );
};

export default Muestras;
import React, { useState, useEffect, useRef } from 'react';
import {
  Box, Typography, Card, CardContent, Stepper, Step, StepLabel,
  Button, TextField, Select, MenuItem, FormControl, InputLabel,
  Grid, Paper, Dialog, DialogTitle, DialogContent, DialogActions,
  Alert, Snackbar, Autocomplete, Chip, Divider, IconButton,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  InputAdornment
} from '@mui/material';
import {
  Add as AddIcon, Search as SearchIcon, Print as PrintIcon,
  PictureAsPdf as PdfIcon, Edit as EditIcon, CheckCircle as CheckIcon,
  ArrowForward as NextIcon, ArrowBack as BackIcon,
  Inventory as InventoryIcon, Science as ScienceIcon, FolderOpen as FolderIcon
} from '@mui/icons-material';
import api, { ubicacionAPI, dosificacionAPI } from '../services/api';

const EntradaMuestra = () => {
  // Pasos del workflow
  const pasos = [
    { label: 'Producto', icon: <InventoryIcon /> },
    { label: 'Dosificación', icon: <ScienceIcon /> },
    { label: 'Etiquetas', icon: <PrintIcon /> },
    { label: 'Certificado CoA', icon: <PdfIcon /> }
  ];
  const [pasoActual, setPasoActual] = useState(0);

  // Estados del formulario
  const [modoSeleccion, setModoSeleccion] = useState('existente'); // 'existente' o 'nuevo'
  const [busquedaProducto, setBusquedaProducto] = useState('');
  const [productosExistentes, setProductosExistentes] = useState([]);
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);

  // Datos del nuevo producto
  const [nuevoProducto, setNuevoProducto] = useState({
    nombre: '', cas_number: '', lote: '', proveedor_id: '',
    cantidad_gramos: 0, linea_negocio: 'cosméticos', clase_peligro_id: null,
    dimension: '1x1', fecha_manufactura: null, fecha_vencimiento: null,
    estado_fisico: 'sólido'
  });

  // Datos del lote entrante
  const [datosLote, setDatosLote] = useState({
    lote: '', fecha_manufactura: '', fecha_vencimiento: '',
    cantidad_total: '', estado_fisico: 'líquido'
  });

  // Dosificación
  const [dosificacion, setDosificacion] = useState({
    cantidad_total: 0,
    numero_submuestras: 1,
    gramos_por_submuestra: 0
  });
  const [submuestrasGeneradas, setSubmuestrasGeneradas] = useState([]);

  // CoA
  const [coaPath, setCoaPath] = useState('');
  const [openCoADialog, setOpenCoADialog] = useState(false);
  const fileInputRef = React.useRef(null);

  // Estados generales
  const [proveedores, setProveedores] = useState([]);
  const [clasesPeligro, setClasesPeligro] = useState([]);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Cargar datos iniciales
  useEffect(() => {
    cargarOpciones();
  }, []);

  const cargarOpciones = async () => {
    try {
      const [provRes, claseRes] = await Promise.all([
        api.get('/proveedores/active/options'),
        api.get('/clases-peligro/active/options')
      ]);
      setProveedores(provRes.data);
      setClasesPeligro(claseRes.data);
    } catch (error) {
      console.error('Error cargando opciones:', error);
    }
  };

  // Buscar productos existentes
  const buscarProductos = async (query) => {
    if (query.length < 2) return;
    try {
      const response = await api.get('/muestras/', { params: { search: query, limit: 20 } });
      setProductosExistentes(response.data);
    } catch (error) {
      console.error('Error buscando productos:', error);
    }
  };

  // Calcular dosificación
  useEffect(() => {
    if (dosificacion.cantidad_total > 0 && dosificacion.numero_submuestras > 0) {
      const gramos = dosificacion.cantidad_total / dosificacion.numero_submuestras;
      setDosificacion(prev => ({ ...prev, gramos_por_submuestra: gramos }));
      
      // Generar submuestras
      const nuevas = [];
      for (let i = 0; i < dosificacion.numero_submuestras; i++) {
        nuevas.push({
          numero: i + 1,
          gramos: gramos,
          qr_code: `HTS-${Date.now()}-${i + 1}`
        });
      }
      setSubmuestrasGeneradas(nuevas);
    }
  }, [dosificacion.cantidad_total, dosificacion.numero_submuestras]);

  // Guardar producto nuevo
  const guardarProductoNuevo = async () => {
    try {
      setLoading(true);
      
      // Formatear datos para el backend
      const formatDate = (date) => {
        if (!date) return null;
        if (typeof date === 'string') {
          if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            return date + 'T00:00:00';
          }
          return date;
        }
        return null;
      };
      
      const productoData = {
        ...nuevoProducto,
        cantidad_gramos: nuevoProducto.cantidad_gramos === '' ? 0 : Number(nuevoProducto.cantidad_gramos),
        linea_negocio: nuevoProducto.linea_negocio || 'cosméticos',
        proveedor_id: nuevoProducto.proveedor_id || null,
        clase_peligro_id: nuevoProducto.clase_peligro_id || null,
        fecha_manufactura: formatDate(nuevoProducto.fecha_manufactura),
        fecha_vencimiento: formatDate(nuevoProducto.fecha_vencimiento),
      };
      
      const response = await api.post('/muestras/', productoData);
      setProductoSeleccionado(response.data);
      setSnackbar({ open: true, message: 'Producto creado exitosamente', severity: 'success' });
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.detail 
        ? (typeof error.response.data.detail === 'string' 
            ? error.response.data.detail 
            : JSON.stringify(error.response.data.detail))
        : 'Error al crear producto';
      setSnackbar({ open: true, message: errorMessage, severity: 'error' });
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Registrar entrada
  const registrarEntrada = async () => {
    try {
      setLoading(true);
      await api.post('/api/movimientos/entrada', {
        sample_id: productoSeleccionado.id,
        cantidad_gramos: parseFloat(datosLote.cantidad_total),
        observaciones: `Lote: ${datosLote.lote}, CoA: ${coaPath || 'No vinculado'}`
      });
      setSnackbar({ open: true, message: 'Entrada registrada exitosamente', severity: 'success' });
      return true;
    } catch (error) {
      setSnackbar({ open: true, message: error.response?.data?.detail || 'Error al registrar entrada', severity: 'error' });
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Imprimir etiquetas (simulado - en producción usaría Electron IPC)
  const imprimirEtiquetas = () => {
    // Generar ventana de impresión
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Etiquetas - Händler TrackSamples</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .etiqueta { 
              border: 2px solid #333; 
              padding: 10px; 
              margin: 10px; 
              display: inline-block; 
              width: 300px;
            }
            .etiqueta h3 { margin: 0 0 10px 0; }
            .etiqueta p { margin: 5px 0; }
            .qr { text-align: center; margin-top: 10px; }
          </style>
        </head>
        <body>
          <h2>Etiquetas para Impresión</h2>
          ${submuestrasGeneradas.map(sub => `
            <div class="etiqueta">
              <h3>${productoSeleccionado?.nombre || 'Producto'}</h3>
              <p><strong>Lote:</strong> ${datosLote.lote}</p>
              <p><strong>Vencimiento:</strong> ${datosLote.fecha_vencimiento}</p>
              <p><strong>Cantidad:</strong> ${sub.gramos.toFixed(2)}g</p>
              <p><strong>Submuestra #${sub.numero}</strong></p>
              <div class="qr">QR: ${sub.qr_code}</div>
            </div>
          `).join('')}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  // Seleccionar archivo CoA usando campo de texto
  const handleCoAChange = (e) => {
    const path = e.target.value;
    setCoaPath(path);
    if (path) {
      setSnackbar({ open: true, message: 'Certificado CoA vinculado correctamente', severity: 'success' });
    }
  };

  // Seleccionar archivo CoA mediante explorador de archivos
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // En Windows, podemos obtener la ruta del archivo
      const filePath = file.path || file.name;
      setCoaPath(filePath);
      setSnackbar({ open: true, message: `Certificado CoA seleccionado: ${file.name}`, severity: 'success' });
    }
  };

  // Abrir explorador de archivos
  const openFileDialog = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Navegación entre pasos
  const siguientePaso = () => {
    if (pasoActual < pasos.length - 1) {
      setPasoActual(pasoActual + 1);
    }
  };

  const pasoAnterior = () => {
    if (pasoActual > 0) {
      setPasoActual(pasoActual - 1);
    }
  };

  // Validar cada paso
  const puedeContinuar = () => {
    switch (pasoActual) {
      case 0: // Producto
        return modoSeleccion === 'nuevo' 
          ? nuevoProducto.nombre && nuevoProducto.proveedor_id && nuevoProducto.linea_negocio
          : productoSeleccionado !== null;
      case 1: // Dosificación
        return datosLote.cantidad_total && datosLote.lote && parseFloat(datosLote.cantidad_total) > 0;
      case 2: // Etiquetas
        return submuestrasGeneradas.length > 0;
      case 3: // CoA
        return true; // Opcional
      default:
        return false;
    }
  };

  // Renderizar contenido de cada paso
  const renderPasoProducto = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Paso 1: Seleccionar o Crear Producto
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 2, mb: 2 }}>
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <Button
                variant={modoSeleccion === 'existente' ? 'contained' : 'outlined'}
                onClick={() => setModoSeleccion('existente')}
                startIcon={<SearchIcon />}
              >
                Seleccionar Existente
              </Button>
              <Button
                variant={modoSeleccion === 'nuevo' ? 'contained' : 'outlined'}
                onClick={() => setModoSeleccion('nuevo')}
                startIcon={<AddIcon />}
              >
                Crear Nuevo
              </Button>
            </Box>
          </Paper>
        </Grid>

        {modoSeleccion === 'existente' ? (
          <Grid item xs={12}>
            <Autocomplete
              freeSolo
              options={productosExistentes}
              getOptionLabel={(option) => option.nombre || ''}
              onInputChange={(e, value) => buscarProductos(value)}
              onChange={(e, value) => setProductoSeleccionado(value)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Buscar producto existente"
                  placeholder="Escriba el nombre, CAS o lote..."
                  fullWidth
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              )}
              renderOption={(props, option) => (
                <MenuItem {...props}>
                  <Box>
                    <Typography variant="body1">{option.nombre}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      CAS: {option.cas_number} | Proveedor: {option.proveedor_id}
                    </Typography>
                  </Box>
                </MenuItem>
              )}
            />
            {productoSeleccionado && (
              <Alert severity="success" sx={{ mt: 2 }}>
                Producto seleccionado: <strong>{productoSeleccionado.nombre}</strong>
              </Alert>
            )}
          </Grid>
        ) : (
          <Grid item xs={12}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Nombre del Producto"
                  value={nuevoProducto.nombre}
                  onChange={(e) => setNuevoProducto({...nuevoProducto, nombre: e.target.value})}
                  fullWidth required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Número CAS"
                  value={nuevoProducto.cas_number}
                  onChange={(e) => setNuevoProducto({...nuevoProducto, cas_number: e.target.value})}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>Proveedor</InputLabel>
                  <Select
                    value={nuevoProducto.proveedor_id}
                    label="Proveedor"
                    onChange={(e) => setNuevoProducto({...nuevoProducto, proveedor_id: e.target.value})}
                  >
                    {proveedores.map(p => (
                      <MenuItem key={p.id} value={p.id}>{p.nombre}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>Línea de Negocio</InputLabel>
                  <Select
                    value={nuevoProducto.linea_negocio}
                    label="Línea de Negocio"
                    onChange={(e) => setNuevoProducto({...nuevoProducto, linea_negocio: e.target.value})}
                  >
                    <MenuItem value="cosméticos">Cosméticos</MenuItem>
                    <MenuItem value="industrial">Industrial</MenuItem>
                    <MenuItem value="farmacéutico">Farmacéutico</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Clase de Peligro</InputLabel>
                  <Select
                    value={nuevoProducto.clase_peligro_id || ''}
                    label="Clase de Peligro"
                    onChange={(e) => setNuevoProducto({...nuevoProducto, clase_peligro_id: e.target.value || null})}
                  >
                    {clasesPeligro.map(c => (
                      <MenuItem key={c.id} value={c.id}>
                        {c.codigo === 'GHS00' ? 'No peligroso' : `${c.codigo} - ${c.nombre}`}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Dimensión</InputLabel>
                  <Select
                    value={nuevoProducto.dimension}
                    label="Dimensión"
                    onChange={(e) => setNuevoProducto({...nuevoProducto, dimension: e.target.value})}
                  >
                    <MenuItem value="1x1">1x1 (Pequeño)</MenuItem>
                    <MenuItem value="2x1">2x1 (Mediano)</MenuItem>
                    <MenuItem value="2x2">2x2 (Grande)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Grid>
        )}
      </Grid>
    </Box>
  );

  const renderPasoDosificacion = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Paso 2: Datos del Lote y Dosificación
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <TextField
            label="Lote"
            value={datosLote.lote}
            onChange={(e) => setDatosLote({...datosLote, lote: e.target.value})}
            fullWidth required
            placeholder="Ej: LOT-2026-001"
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            label="Cantidad Total (gramos)"
            type="text"
            value={datosLote.cantidad_total}
            onChange={(e) => {
              const value = e.target.value;
              // Solo permitir números positivos o vacío para borrar
              if (value === '' || (/^\d+$/.test(value) && parseInt(value) > 0)) {
                setDatosLote({...datosLote, cantidad_total: value});
                // Actualizar dosificación
                if (value !== '') {
                  setDosificacion(prev => ({ ...prev, cantidad_total: parseFloat(value) || 0 }));
                } else {
                  setDosificacion(prev => ({ ...prev, cantidad_total: 0 }));
                }
              }
            }}
            fullWidth
            required
            placeholder="Ej: 1000"
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            label="Fecha de Manufactura"
            type="date"
            value={datosLote.fecha_manufactura}
            onChange={(e) => setDatosLote({...datosLote, fecha_manufactura: e.target.value})}
            fullWidth
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            label="Fecha de Vencimiento"
            type="date"
            value={datosLote.fecha_vencimiento}
            onChange={(e) => setDatosLote({...datosLote, fecha_vencimiento: e.target.value})}
            fullWidth
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Estado Físico</InputLabel>
            <Select
              value={datosLote.estado_fisico}
              label="Estado Físico"
              onChange={(e) => setDatosLote({...datosLote, estado_fisico: e.target.value})}
            >
              <MenuItem value="líquido">Líquido</MenuItem>
              <MenuItem value="sólido">Sólido</MenuItem>
              <MenuItem value="pastoso">Pastoso</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        
        <Grid item xs={12}>
          <Divider sx={{ my: 2 }} />
          <Typography variant="h6" gutterBottom>
            Configurar Dosificación
          </Typography>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <TextField
            label="Número de Sub-muestras"
            type="number"
            value={dosificacion.numero_submuestras}
            onChange={(e) => {
              const value = e.target.value;
              // Solo permitir números enteros positivos, incluyendo vacío para borrar
              if (value === '' || (/^\d+$/.test(value) && parseInt(value) > 0)) {
                setDosificacion({
                  ...dosificacion, 
                  numero_submuestras: value === '' ? 1 : parseInt(value)
                });
              }
            }}
            fullWidth
            inputProps={{ min: 1, max: 100 }}
            helperText="En cuántas partes se dividirá el producto"
            placeholder="Ej: 5"
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            label="Gramos por Sub-muestra"
            value={dosificacion.gramos_por_submuestra.toFixed(2)}
            fullWidth
            disabled
            helperText="Cantidad calculada automáticamente"
          />
        </Grid>
        
        {submuestrasGeneradas.length > 0 && (
          <Grid item xs={12}>
            <Alert severity="info" sx={{ mt: 2 }}>
              Se generarán <strong>{submuestrasGeneradas.length}</strong> sub-muestras con QR único
            </Alert>
          </Grid>
        )}
      </Grid>
    </Box>
  );

  const renderPasoEtiquetas = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Paso 3: Impresión de Etiquetas
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Alert severity="info" sx={{ mb: 2 }}>
            Se generarán <strong>{submuestrasGeneradas.length}</strong> etiquetas con código QR único
            para cada sub-muestra.
          </Alert>
        </Grid>
        
        <Grid item xs={12}>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>#</TableCell>
                  <TableCell>Cantidad (g)</TableCell>
                  <TableCell>Código QR</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {submuestrasGeneradas.map((sub) => (
                  <TableRow key={sub.numero}>
                    <TableCell>Sub-muestra #{sub.numero}</TableCell>
                    <TableCell>{sub.gramos.toFixed(2)} g</TableCell>
                    <TableCell>
                      <Chip label={sub.qr_code} size="small" color="primary" variant="outlined" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
        
        <Grid item xs={12}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<PrintIcon />}
            onClick={imprimirEtiquetas}
            fullWidth
            size="large"
            sx={{ mt: 2 }}
          >
            Imprimir Etiquetas
          </Button>
        </Grid>
      </Grid>
    </Box>
  );

  const renderPasoCoA = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Paso 4: Vincular Certificado de Análisis (CoA)
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Alert severity="info" sx={{ mb: 2 }}>
            El certificado de análisis (CoA) se vinculará al lote <strong>{datosLote.lote}</strong>.
            Este documento se imprimirá automáticamente cuando el producto sea despachado.
          </Alert>
        </Grid>
        
        <Grid item xs={12}>
          <Card variant="outlined" sx={{ p: 3, textAlign: 'center' }}>
            {coaPath ? (
              <Box>
                <CheckIcon color="success" sx={{ fontSize: 48, mb: 2 }} />
                <Typography variant="h6" color="success.main">
                  Certificado Vinculado
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1, wordBreak: 'break-all' }}>
                  {coaPath}
                </Typography>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={() => setCoaPath('')}
                  sx={{ mt: 2 }}
                >
                  Eliminar
                </Button>
              </Box>
            ) : (
              <Box>
                <PdfIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  No hay certificado vinculado
                </Typography>
                
                {/* Input file oculto */}
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".pdf"
                  style={{ display: 'none' }}
                  onChange={handleFileSelect}
                />
                
                {/* Botón para seleccionar archivo */}
                <Button
                  variant="contained"
                  startIcon={<FolderIcon />}
                  onClick={openFileDialog}
                  sx={{ mt: 2 }}
                >
                  Seleccionar Archivo PDF
                </Button>
                
                <Divider sx={{ my: 2 }} />
                
                <Typography variant="caption" color="text.secondary">
                  O ingrese la ruta manualmente:
                </Typography>
                <TextField
                  fullWidth
                  label="Ruta del archivo CoA (PDF)"
                  placeholder="C:\Documentos\coa\archivo.pdf"
                  value={coaPath}
                  onChange={handleCoAChange}
                  sx={{ mt: 1 }}
                />
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  Ejemplo: C:\Archivos\CoA\certificado.pdf
                </Typography>
              </Box>
            )}
          </Card>
        </Grid>
      </Grid>
    </Box>
  );

  // Renderizar paso actual
  const renderContenidoPaso = () => {
    switch (pasoActual) {
      case 0: return renderPasoProducto();
      case 1: return renderPasoDosificacion();
      case 2: return renderPasoEtiquetas();
      case 3: return renderPasoCoA();
      default: return null;
    }
  };

  // Finalizar proceso
  const finalizarProceso = async () => {
    // 1. Si es producto nuevo, crearlo
    if (modoSeleccion === 'nuevo') {
      const producto = await guardarProductoNuevo();
      if (!producto) return;
      setProductoSeleccionado(producto);
    }
    
    // 2. Registrar entrada
    const entradaOk = await registrarEntrada();
    if (!entradaOk) return;
    
    // 3. Mostrar éxito
    setSnackbar({ 
      open: true, 
      message: 'Proceso de entrada completado exitosamente', 
      severity: 'success' 
    });
    
    // 4. Resetear formulario
    setTimeout(() => {
      setPasoActual(0);
      setProductoSeleccionado(null);
      setDatosLote({ lote: '', fecha_manufactura: '', fecha_vencimiento: '', cantidad_total: '', estado_fisico: 'líquido' });
      setDosificacion({ cantidad_total: 0, numero_submuestras: 1, gramos_por_submuestra: 0 });
      setSubmuestrasGeneradas([]);
      setCoaPath('');
    }, 2000);
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Título */}
      <Typography variant="h4" sx={{ fontWeight: 700, color: '#1a1a1a', mb: 3 }}>
        Registro de Entrada de Muestras
      </Typography>
      
      {/* Stepper */}
      <Stepper activeStep={pasoActual} sx={{ mb: 4 }}>
        {pasos.map((paso, index) => (
          <Step key={paso.label}>
            <StepLabel 
              icon={paso.icon}
              optional={index === pasoActual ? <Typography variant="caption">{paso.label}</Typography> : null}
            >
              {paso.label}
            </StepLabel>
          </Step>
        ))}
      </Stepper>
      
      {/* Contenido del paso */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          {renderContenidoPaso()}
        </CardContent>
      </Card>
      
      {/* Botones de navegación */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Button
          variant="outlined"
          startIcon={<BackIcon />}
          onClick={pasoAnterior}
          disabled={pasoActual === 0}
        >
          Anterior
        </Button>
        
        {pasoActual < pasos.length - 1 ? (
          <Button
            variant="contained"
            endIcon={<NextIcon />}
            onClick={siguientePaso}
            disabled={!puedeContinuar()}
          >
            Siguiente
          </Button>
        ) : (
          <Button
            variant="contained"
            color="success"
            startIcon={<CheckIcon />}
            onClick={finalizarProceso}
            disabled={loading}
          >
            {loading ? 'Procesando...' : 'Finalizar Entrada'}
          </Button>
        )}
      </Box>
      
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

export default EntradaMuestra;
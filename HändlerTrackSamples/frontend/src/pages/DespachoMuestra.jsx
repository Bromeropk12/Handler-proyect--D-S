/**
 * Página de Despacho de Muestras (CU-02)
 * Workflow: Búsqueda → FEFO (sugerencia) → Override → Etiqueta + CoA → Salida
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, Button, TextField,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Dialog, DialogTitle, DialogContent, DialogActions,
  FormControl, InputLabel, Select, MenuItem, Alert, Chip, Divider,
  Stepper, Step, StepLabel, Autocomplete as MuiAutocomplete, Snackbar, CircularProgress,
  List, ListItem, ListItemText, ListItemIcon, Radio, RadioGroup,
  FormControlLabel, Warning as WarningIcon, ListItemButton
} from '@mui/material';
import {
  Search as SearchIcon, Print as PrintIcon, LocalShipping as ShippingIcon,
  Warning as WarningAmber, CheckCircle as CheckIcon,
  QrCode as QrCodeIcon, Inventory2 as SampleIcon,
  Schedule as ScheduleIcon, ArrowForward as NextIcon,
  ArrowBack as BackIcon, Delete as DeleteIcon
} from '@mui/icons-material';
import api, { fefoAPI, ubicacionAPI } from '../services/api';

const DespachoMuestra = () => {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);
  
  // Datos de búsqueda
  const [busqueda, setBusqueda] = useState('');
  const [busquedaInput, setBusquedaInput] = useState('');
  const [sugerencias, setSugerencias] = useState([]);
  const [muestraSeleccionada, setMuestraSeleccionada] = useState(null);
  const [cantidadSolicitada, setCantidadSolicitada] = useState('');
  
  // Override
  const [mostrarOverride, setMostrarOverride] = useState(false);
  const [muestrasOverride, setMuestrasOverride] = useState([]);
  const [seleccionManual, setSeleccionManual] = useState(null);
  
  // Verificación compatibilidad
  const [compatibilidad, setCompatibilidad] = useState(null);
  const [compatibilidadError, setCompatibilidadError] = useState('');
  
  // Etiqueta y CoA
  const [etiquetaGenerada, setEtiquetaGenerada] = useState(false);
  const [coaPath, setCoaPath] = useState('');
  
  // Movimiento
  const [movimientoRegistrado, setMovimientoRegistrado] = useState(false);
  
  // Snackbar
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const steps = [
    { label: 'Buscar Muestra', icon: <SearchIcon /> },
    { label: 'Verificar Stock', icon: <SampleIcon /> },
    { label: 'FEFO / Override', icon: <ScheduleIcon /> },
    { label: 'Etiqueta + CoA', icon: <PrintIcon /> },
    { label: 'Confirmar Salida', icon: <ShippingIcon /> }
  ];

  // Buscar muestras rápidamente mientras escribe (autocomplete)
  const buscarSugerenciasAutocomplete = useCallback(async (query) => {
    if (!query || query.length < 2) {
      setSugerencias([]);
      return;
    }
    
    try {
      const response = await api.get('/muestras/', {
        params: { search: query, limit: 20, estado: 'activa' }
      });
      
      // Filtrar solo muestras con cantidad > 0
      const muestrasActivas = (response.data || []).filter(m => m.cantidad_gramos > 0);
      setSugerencias(muestrasActivas);
    } catch (error) {
      console.error('Error autocomplete:', error);
      setSugerencias([]);
    }
  }, []);

  // Buscar muestra con FEFO
  const buscarConFEFO = async () => {
    if (!busqueda || !cantidadSolicitada) {
      setSnackbar({ open: true, message: 'Ingrese nombre y cantidad', severity: 'warning' });
      return;
    }
    
    setLoading(true);
    try {
      const response = await fefoAPI.sugerir(busqueda, parseFloat(cantidadSolicitada));
      setSugerencias(response.data.sugerencias || []);
      
      if (response.data.sugerencias?.length > 0) {
        setMuestraSeleccionada(response.data.sugerencias[0]);
        setStep(1);
      } else {
        setSnackbar({ open: true, message: 'No se encontraron muestras disponibles', severity: 'error' });
      }
    } catch (error) {
      setSnackbar({ open: true, message: error.response?.data?.detail || 'Error al buscar muestra', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Buscar todas las muestras disponibles para override
  const buscarParaOverride = async () => {
    setLoading(true);
    try {
      const response = await fefoAPI.buscar({
        search: busqueda,
        cantidad_necesaria: parseFloat(cantidadSolicitada)
      });
      setMuestrasOverride(response.data.muestras || []);
      setMostrarOverride(true);
    } catch (error) {
      setSnackbar({ open: true, message: 'Error al cargar alternativas', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Verificar compatibilidad química antes del despacho
  const verificarCompatibilidad = async (muestraId, hileraId) => {
    try {
      const response = await ubicacionAPI.verificar(muestraId, hileraId);
      setCompatibilidad(response.data);
      
      if (!response.data.seguro) {
        setCompatibilidadError(response.data.mensaje || 'Incompatibilidad detectada');
      } else {
        setCompatibilidadError('');
      }
      
      return response.data.seguro;
    } catch (error) {
      setCompatibilidadError('Error al verificar compatibilidad');
      return false;
    }
  };

  // Confirmar selección y verificar compatibilidad
  const confirmarSeleccion = async () => {
    if (!muestraSeleccionada?.ubicacion?.hilera_id) {
      setSnackbar({ open: true, message: 'Muestra sin ubicación asignada', severity: 'error' });
      return;
    }

    setLoading(true);
    try {
      const esSeguro = await verificarCompatibilidad(
        muestraSeleccionada.id,
        muestraSeleccionada.ubicacion.hilera_id
      );
      
      if (esSeguro) {
        setStep(3);
        setSnackbar({ open: true, message: 'Compatibilidad verificada -OK', severity: 'success' });
      } else {
        setSnackbar({ open: true, message: 'Advertencia: Incompatibilidad con vecinos', severity: 'warning' });
        setStep(3);
      }
    } catch (error) {
      setSnackbar({ open: true, message: 'Error al verificar compatibilidad', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Usar selección manual (override)
  const usarSeleccionManual = async () => {
    if (!seleccionManual) {
      setSnackbar({ open: true, message: 'Seleccione una muestra', severity: 'warning' });
      return;
    }
    
    setMuestraSeleccionada(seleccionManual);
    setMostrarOverride(false);
    setStep(2);
  };

  // Generar etiqueta para impresión
  const generarEtiqueta = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Etiqueta Despacho - Händler TrackSamples</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .etiqueta { 
              border: 2px solid #333; 
              padding: 15px; 
              width: 350px;
              margin: 10px auto;
            }
            .etiqueta h2 { margin: 0 0 10px 0; text-align: center; }
            .etiqueta p { margin: 5px 0; }
            .qr { text-align: center; margin-top: 15px; font-size: 24px; font-weight: bold; }
            .aviso { 
              background: #ffeb3b; 
              padding: 10px; 
              margin-top: 15px;
              text-align: center;
              font-weight: bold;
            }
          </style>
        </head>
        <body>
          <div class="etiqueta">
            <h2>ETIQUETA DE DESPACHO</h2>
            <p><strong>Producto:</strong> ${muestraSeleccionada?.nombre || ''}</p>
            <p><strong>Lote:</strong> ${muestraSeleccionada?.lote || ''}</p>
            <p><strong>Cantidad:</strong> ${cantidadSolicitada}g</p>
            <p><strong>Vencimiento:</strong> ${muestraSeleccionada?.fecha_vencimiento || 'N/A'}</p>
            <p><strong>Ubicación:</strong> ${muestraSeleccionada?.ubicacion?.anaquel || ''} - 
               Nivel ${muestraSeleccionada?.ubicacion?.nivel || ''}, 
               Fila ${muestraSeleccionada?.ubicacion?.fila || ''}</p>
            <div class="qr">QR: ${muestraSeleccionada?.qr_code || ''}</div>
            <div class="aviso">PRIORIZAR SEGÚN FECHA DE VENCIMIENTO</div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
    setEtiquetaGenerada(true);
  };

  // Registrar movimiento de salida
  const registrarSalida = async () => {
    if (!muestraSeleccionada) return;
    
    setLoading(true);
    try {
      await api.post('/api/movimientos/salida', {
        sample_id: muestraSeleccionada.id,
        cantidad_gramos: parseFloat(cantidadSolicitada),
        observaciones: `Despacho - CoA: ${coaPath || 'No vinculado'}`
      });
      
      setMovimientoRegistrado(true);
      setStep(4);
      setSnackbar({ open: true, message: 'Salida registrada correctamente', severity: 'success' });
    } catch (error) {
      setSnackbar({ open: true, message: error.response?.data?.detail || 'Error al registrar salida', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Reiniciar proceso
  const reiniciarProceso = () => {
    setStep(0);
    setBusqueda('');
    setCantidadSolicitada('');
    setSugerencias([]);
    setMuestraSeleccionada(null);
    setEtiquetaGenerada(false);
    setCoaPath('');
    setMovimientoRegistrado(false);
    setMostrarOverride(false);
    setSeleccionManual(null);
    setCompatibilidad(null);
  };

  // Render paso 0: Búsqueda
  const renderPasoBuscar = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        1. Buscar Muestra para Despacho
      </Typography>
      
      <Alert severity="info" sx={{ mb: 2 }}>
        El sistema buscará automáticamente las muestras más próximas a vencer (FEFO)
      </Alert>

      <Grid container spacing={2}>
        <Grid item xs={12} md={8}>
          <MuiAutocomplete
            value={muestraSeleccionada}
            options={sugerencias}
            getOptionLabel={(option) => typeof option === 'string' ? option : (option?.nombre || '')}
            onInputChange={(event, newValue, reason) => {
              if (reason === 'input') {
                setBusquedaInput(newValue);
                if (newValue.length >= 2) {
                  buscarSugerenciasAutocomplete(newValue);
                }
              }
            }}
            onChange={(event, newValue) => {
              if (newValue && typeof newValue === 'object') {
                setBusqueda(newValue.nombre || '');
                setMuestraSeleccionada(newValue);
              } else if (newValue === null) {
                setBusqueda('');
                setMuestraSeleccionada(null);
              }
            }}
            filterOptions={(x) => x}
            noOptionsText={busquedaInput.length < 2 ? 'Escriba al menos 2 caracteres' : 'Sin resultados'}
            loading={loading}
            renderInput={(params) => (
              <TextField
                {...params}
                fullWidth
                label="Buscar muestra"
                placeholder="Escriba el nombre del producto..."
                onChange={(e) => {
                  const value = e.target.value;
                  setBusquedaInput(value);
                  if (value.length >= 2) {
                    buscarSugerenciasAutocomplete(value);
                  }
                }}
                value={busquedaInput}
                InputProps={{
                  ...params.InputProps,
                  startAdornment: (
                    <>
                      <SearchIcon sx={{ color: 'text.secondary', ml: 1 }} />
                      {params.InputProps.startAdornment}
                    </>
                  ),
                  endAdornment: (
                    <>
                      {loading ? <CircularProgress size={20} /> : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
            renderOption={(props, option) => {
              const key = `option-${option.id}`;
              return (
                <MenuItem {...props} key={key}>
                  <Box>
                    <Typography variant="body1">{option.nombre}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Lote: {option.lote || 'N/A'} | Stock: {option.cantidad_gramos}g | 
                      Vence: {option.fecha_vencimiento?.split('T')[0] || 'N/A'}
                    </Typography>
                  </Box>
                </MenuItem>
              );
            }}
          />
          {sugerencias.length > 0 && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
              {sugerencias.length} muestras disponibles encontradas
            </Typography>
          )}
        </Grid>
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            label="Cantidad solicitada (gramos)"
            type="number"
            value={cantidadSolicitada}
            onChange={(e) => setCantidadSolicitada(e.target.value)}
            placeholder="Ej: 500"
            inputProps={{ min: 1 }}
          />
        </Grid>
        <Grid item xs={12}>
          <Button
            variant="contained"
            startIcon={<SearchIcon />}
            onClick={() => {
              if (muestraSeleccionada && cantidadSolicitada) {
                setStep(1);
              } else {
                setSnackbar({ open: true, message: 'Seleccione una muestra e ingrese cantidad', severity: 'warning' });
              }
            }}
            disabled={!muestraSeleccionada || !cantidadSolicitada}
            size="large"
          >
           Continuar con FEFO
          </Button>
        </Grid>
      </Grid>
    </Box>
  );

  // Render paso 1: Resultado FEFO
  const renderPasoFEFO = () => (
    <Box>
      <Alert severity="success" sx={{ mb: 2 }}>
        Sistema sugiere la muestra con fecha más próxima a vencer (FEFO)
      </Alert>

      <Card sx={{ mb: 2, bgcolor: '#e8f5e9' }}>
        <CardContent>
          <Typography variant="h6" color="primary">
            Sugerencia FEFO
          </Typography>
          <Divider sx={{ my: 1 }} />
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="body2"><strong>Producto:</strong> {muestraSeleccionada?.nombre}</Typography>
              <Typography variant="body2"><strong>Lote:</strong> {muestraSeleccionada?.lote}</Typography>
              <Typography variant="body2"><strong>Cantidad disponible:</strong> {muestraSeleccionada?.cantidad_disponible}g</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2"><strong>Vencimiento:</strong> {muestraSeleccionada?.fecha_vencimiento}</Typography>
              <Typography variant="body2"><strong>Ubicación:</strong> 
                {muestraSeleccionada?.ubicacion?.anaquel} - Nivel {muestraSeleccionada?.ubicacion?.nivel}, 
                Fila {muestraSeleccionada?.ubicacion?.fila}
              </Typography>
              <Typography variant="body2"><strong>QR:</strong> {muestraSeleccionada?.qr_code}</Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<CheckIcon />}
          onClick={confirmarSeleccion}
        >
          Confirmar esta Suggestión
        </Button>
        <Button
          variant="outlined"
          startIcon={<WarningAmber />}
          onClick={buscarParaOverride}
        >
          Ver otras alternativas
        </Button>
      </Box>

      {/* Override Dialog */}
      <Dialog open={mostrarOverride} onClose={() => setMostrarOverride(false)} maxWidth="md" fullWidth>
        <DialogTitle>Seleccionar muestra (Override)</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Está seleccionando una muestra diferentes de la sugerencia FEFO. ¿Está seguro?
          </Alert>
          <RadioGroup value={seleccionManual?.id || ''} onChange={(e) => {
            const selected = muestrasOverride.find(m => m.id === parseInt(e.target.value));
            setSeleccionManual(selected);
          }}>
            {muestrasOverride.map((m) => (
              <Paper key={m.id} sx={{ p: 2, mb: 1 }}>
                <FormControlLabel
                  value={m.id}
                  control={<Radio />}
                  label={
                    <Box>
                      <Typography variant="body1"><strong>{m.nombre}</strong> - Lote: {m.lote}</Typography>
                      <Typography variant="body2">
                        Cantidad: {m.cantidad_gramos}g | Vence: {m.fecha_vencimiento}
                      </Typography>
                      <Typography variant="body2">
                        Ubicación: {m.ubicacion?.anaquel || 'Sin asignar'}
                      </Typography>
                    </Box>
                  }
                />
              </Paper>
            ))}
          </RadioGroup>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMostrarOverride(false)}>Cancelar</Button>
          <Button variant="contained" onClick={usarSeleccionManual} disabled={!seleccionManual}>
            Usar esta selección
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );

  // Render paso 3: Etiqueta y CoA
  const renderPasoEtiqueta = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        4. Generar Etiqueta y Vincular CoA
      </Typography>

      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Card variant="outlined" sx={{ p: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Datos del despacho:
            </Typography>
            <Typography variant="body2">
              <strong>Producto:</strong> {muestraSeleccionada?.nombre}
            </Typography>
            <Typography variant="body2">
              <strong>Cantidad:</strong> {cantidadSolicitada}g
            </Typography>
            <Typography variant="body2">
              <strong>Ubicación actual:</strong> {muestraSeleccionada?.ubicacion?.anaquel}
            </Typography>
          </Card>
        </Grid>

        {/* Compatibilidad */}
        <Grid item xs={12}>
          {compatibilidadError ? (
            <Alert severity="warning" icon={<WarningAmber />}>
              {compatibilidadError}
            </Alert>
          ) : (
            <Alert severity="success" icon={<CheckIcon />}>
              Compatibilidad química verificada
            </Alert>
          )}
        </Grid>

        {/* Etiqueta */}
        <Grid item xs={12} md={6}>
          <Button
            variant="contained"
            startIcon={<PrintIcon />}
            onClick={generarEtiqueta}
            fullWidth
            size="large"
            sx={{ py: 2 }}
          >
            Imprimir Etiqueta
          </Button>
          {etiquetaGenerada && (
            <Alert severity="success" sx={{ mt: 1 }}>
              Etiqueta impresa
            </Alert>
          )}
        </Grid>

        {/* CoA */}
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Ruta del CoA (opcional)"
            value={coaPath}
            onChange={(e) => setCoaPath(e.target.value)}
            placeholder="C:\Documentos\coa\certificado.pdf"
          />
        </Grid>
      </Grid>
    </Box>
  );

  // Render paso 4: Confirmar salida
  const renderPasoConfirmar = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        5. Confirmar Salida
      </Typography>

      <Alert severity="info" sx={{ mb: 2 }}>
        Revise los datos antes de confirmar la salida
      </Alert>

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="body2"><strong>Producto:</strong></Typography>
              <Typography variant="h6">{muestraSeleccionada?.nombre}</Typography>
            </Grid>
            <Grid item xs={12} md={3}>
              <Typography variant="body2"><strong>Cantidad:</strong></Typography>
              <Typography variant="h6">{cantidadSolicitada}g</Typography>
            </Grid>
            <Grid item xs={12} md={3}>
              <Typography variant="body2"><strong>Lote:</strong></Typography>
              <Typography variant="h6">{muestraSeleccionada?.lote}</Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Box sx={{ display: 'flex', gap: 2 }}>
        <Button
          variant="contained"
          color="success"
          startIcon={<ShippingIcon />}
          onClick={registrarSalida}
          disabled={loading || !etiquetaGenerada}
          size="large"
        >
          {loading ? 'Registrando...' : 'Confirmar Salida'}
        </Button>
      </Box>

      {movimientoRegistrado && (
        <Alert severity="success" sx={{ mt: 2 }}>
          Salida registrada correctamente. Mueva la muestra del anaquel física.
        </Alert>
      )}
    </Box>
  );

  const renderPaso = () => {
    if (step === 0) return renderPasoBuscar();
    if (step === 1) return renderPasoFEFO();
    if (step === 2 || step === 3) return renderPasoEtiqueta();
    if (step === 4) return renderPasoConfirmar();
    return null;
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 3 }}>
        Despacho de Muestras (CU-02)
      </Typography>

      <Stepper activeStep={step} sx={{ mb: 3 }}>
        {steps.map((s, i) => (
          <Step key={i}>
            <StepLabel>{s.label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <Card>
        <CardContent>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            renderPaso()
          )}
        </CardContent>
      </Card>

      {step > 0 && step < 4 && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
          <Button startIcon={<BackIcon />} onClick={() => step > 0 && setStep(step - 1)}>
            Atrás
          </Button>
        </Box>
      )}

      {movimientoRegistrado && (
        <Button
          variant="contained"
          sx={{ mt: 3 }}
          onClick={reiniciarProceso}
        >
          Nuevo Despacho
        </Button>
      )}

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

export default DespachoMuestra;
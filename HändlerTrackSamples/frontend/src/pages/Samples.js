import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Print as PrintIcon,
  LocationOn as LocationIcon,
} from '@mui/icons-material';
import { useSamples } from '../context/SamplesContext';
import { WAREHOUSE_CONFIG, generateLocationCode, BUSINESS_LINE_COLORS, STATUS_COLORS } from '../constants/warehouseConfig';

const Samples = () => {
  const navigate = useNavigate();
  const { samples, loading, fetchSamples, createSample, deleteSample } = useSamples();
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ business_line: '', sample_status: '' });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [errors, setErrors] = useState({});
  const [newSample, setNewSample] = useState({
    reference_code: '',
    description: '',
    supplier: '',
    batch_number: '',
    chemical_composition: '',
    business_line: 'Cosmética',
    quantity: 1,
    unit: 'kg',
    zone: 'COS',
    level: 'A',
    position: '1',
  });

  useEffect(() => {
    fetchSamples();
  }, [fetchSamples]);

  useEffect(() => {
    fetchSamples({ q: search, ...filters });
  }, [search, filters]);

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  // Validar formulario
  const validateForm = () => {
    const newErrors = {};
    if (!newSample.reference_code.trim()) newErrors.reference_code = 'Código es requerido';
    if (!newSample.description.trim()) newErrors.description = 'Descripción es requerida';
    if (!newSample.supplier.trim()) newErrors.supplier = 'Proveedor es requerido';
    if (!newSample.batch_number.trim()) newErrors.batch_number = 'Lote es requerido';
    if (newSample.quantity <= 0) newErrors.quantity = 'Cantidad debe ser mayor a 0';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateSample = async () => {
    if (!validateForm()) return;
    try {
      await createSample(newSample);
      setDialogOpen(false);
      setNewSample({
        reference_code: '',
        description: '',
        supplier: '',
        batch_number: '',
        chemical_composition: '',
        business_line: 'Cosmética',
        quantity: 1,
        unit: 'kg',
        zone: 'COS',
        level: 'A',
        position: '1',
      });
      setErrors({});
    } catch (error) {
      alert(error.response?.data?.detail || 'Error al crear muestra');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Está seguro de eliminar esta muestra?')) {
      await deleteSample(id);
    }
  };

  // Generar código de ubicación
  const getLocationCode = (sample) => {
    return generateLocationCode(sample.zone, sample.level, sample.position);
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Catálogo de Muestras</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setDialogOpen(true)}
        >
          Nueva Muestra
        </Button>
      </Box>

      {/* Filtros */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <TextField
              placeholder="Buscar por código, descripción o proveedor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              sx={{ flexGrow: 1, minWidth: 250 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
            <FormControl sx={{ minWidth: 150 }}>
              <InputLabel>Línea</InputLabel>
              <Select
                value={filters.business_line}
                onChange={(e) => handleFilterChange('business_line', e.target.value)}
                label="Línea"
              >
                <MenuItem value="">Todas</MenuItem>
                <MenuItem value="Cosmética">Cosmética</MenuItem>
                <MenuItem value="Industrial">Industrial</MenuItem>
                <MenuItem value="Farma">Farma</MenuItem>
              </Select>
            </FormControl>
            <FormControl sx={{ minWidth: 150 }}>
              <InputLabel>Estado</InputLabel>
              <Select
                value={filters.sample_status}
                onChange={(e) => handleFilterChange('sample_status', e.target.value)}
                label="Estado"
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="available">Disponible</MenuItem>
                <MenuItem value="depleted">Agotada</MenuItem>
                <MenuItem value="quarantine">En Cuarentena</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </CardContent>
      </Card>

      {/* Tabla de Muestras */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Ubicación</TableCell>
                <TableCell>Código</TableCell>
                <TableCell>Descripción</TableCell>
                <TableCell>Línea</TableCell>
                <TableCell>Cantidad</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : samples.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Typography color="text.secondary">
                      No se encontraron muestras
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                samples.map((sample) => (
                  <TableRow key={sample.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LocationIcon sx={{ color: 'primary.main', fontSize: 20 }} />
                        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
                          {getLocationCode(sample)}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {sample.reference_code}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {sample.batch_number}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ maxWidth: 200 }}>
                      <Typography variant="body2" noWrap title={sample.description}>
                        {sample.description}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={sample.business_line}
                        size="small"
                        sx={{
                          bgcolor: BUSINESS_LINE_COLORS[sample.business_line]?.bg,
                          color: BUSINESS_LINE_COLORS[sample.business_line]?.color,
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      {sample.quantity} {sample.unit}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={STATUS_COLORS[sample.status]?.label || sample.status}
                        size="small"
                        sx={{
                          bgcolor: STATUS_COLORS[sample.status]?.bg,
                          color: STATUS_COLORS[sample.status]?.color,
                        }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton size="small" onClick={() => navigate(`/samples/${sample.id}`)}>
                        <ViewIcon />
                      </IconButton>
                      <IconButton size="small">
                        <PrintIcon />
                      </IconButton>
                      <IconButton size="small" color="error" onClick={() => handleDelete(sample.id)}>
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Dialog para nueva muestra */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ background: 'linear-gradient(135deg, #9c27b0 0%, #1976d2 100%)', color: 'white', mb: 2 }}>
          Nueva Muestra - Registro de Producto
        </DialogTitle>
        <DialogContent>
          {Object.keys(errors).length > 0 && (
            <Alert severity="error" sx={{ mb: 2 }}>
              Por favor completa todos los campos requeridos
            </Alert>
          )}
          
          {/* Información del Producto */}
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1, color: 'primary.main' }}>
            Información del Producto
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 3 }}>
            <TextField
              label="Código de Referencia"
              value={newSample.reference_code}
              onChange={(e) => setNewSample({ ...newSample, reference_code: e.target.value })}
              required
              error={!!errors.reference_code}
              helperText={errors.reference_code}
              fullWidth
            />
            <TextField
              label="Número de Lote"
              value={newSample.batch_number}
              onChange={(e) => setNewSample({ ...newSample, batch_number: e.target.value })}
              required
              error={!!errors.batch_number}
              helperText={errors.batch_number}
            />
            <TextField
              label="Descripción del Producto"
              value={newSample.description}
              onChange={(e) => setNewSample({ ...newSample, description: e.target.value })}
              required
              error={!!errors.description}
              helperText={errors.description}
              fullWidth
              gridColumn="1 / -1"
            />
            <TextField
              label="Proveedor"
              value={newSample.supplier}
              onChange={(e) => setNewSample({ ...newSample, supplier: e.target.value })}
              required
              error={!!errors.supplier}
              helperText={errors.supplier}
            />
            <TextField
              label="Composición Química"
              value={newSample.chemical_composition}
              onChange={(e) => setNewSample({ ...newSample, chemical_composition: e.target.value })}
              fullWidth
              gridColumn="1 / -1"
              placeholder="Ej: Agua, Glicerina, Ácido Hialurónico..."
            />
          </Box>

          {/* Línea de Negocio y Cantidad */}
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1, color: 'primary.main' }}>
            Clasificación y Cantidad
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2, mb: 3 }}>
            <FormControl fullWidth>
              <InputLabel>Línea de Negocio</InputLabel>
              <Select
                value={newSample.business_line}
                onChange={(e) => setNewSample({ ...newSample, business_line: e.target.value })}
                label="Línea de Negocio"
              >
                <MenuItem value="Cosmética">
                  <Chip label="Cosmética" size="small" sx={{ bgcolor: '#f3e5f5', color: '#9c27b0', mr: 1 }} />
                  Cosmética
                </MenuItem>
                <MenuItem value="Industrial">
                  <Chip label="Industrial" size="small" sx={{ bgcolor: '#e3f2fd', color: '#1976d2', mr: 1 }} />
                  Industrial
                </MenuItem>
                <MenuItem value="Farma">
                  <Chip label="Farma" size="small" sx={{ bgcolor: '#e8f5e9', color: '#2e7d32', mr: 1 }} />
                  Farma
                </MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Cantidad"
              type="number"
              value={newSample.quantity}
              onChange={(e) => setNewSample({ ...newSample, quantity: parseFloat(e.target.value) || 0 })}
              error={!!errors.quantity}
              helperText={errors.quantity}
              inputProps={{ min: 0.1, step: 0.1 }}
            />
            <FormControl fullWidth>
              <InputLabel>Unidad</InputLabel>
              <Select
                value={newSample.unit}
                onChange={(e) => setNewSample({ ...newSample, unit: e.target.value })}
                label="Unidad"
              >
                <MenuItem value="kg">Kilogramos (kg)</MenuItem>
                <MenuItem value="g">Gramos (g)</MenuItem>
                <MenuItem value="L">Litros (L)</MenuItem>
                <MenuItem value="mL">Mililitros (mL)</MenuItem>
                <MenuItem value="uni">Unidades</MenuItem>
              </Select>
            </FormControl>
          </Box>

          {/* Ubicación en Bodega */}
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1, color: 'primary.main' }}>
            Ubicación en Bodeda
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Zona (Línea)</InputLabel>
              <Select
                value={newSample.zone}
                onChange={(e) => setNewSample({ ...newSample, zone: e.target.value })}
                label="Zona (Línea)"
              >
                {WAREHOUSE_CONFIG.zones.map((zone) => (
                  <MenuItem key={zone.id} value={zone.id}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: zone.color, mr: 1 }} />
                      {zone.name} ({zone.id})
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Fila (A-G)</InputLabel>
              <Select
                value={newSample.level}
                onChange={(e) => setNewSample({ ...newSample, level: e.target.value })}
                label="Fila (A-G)"
              >
                {WAREHOUSE_CONFIG.rows.map((row) => (
                  <MenuItem key={row} value={row}>Fila {row}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Columna (1-7)</InputLabel>
              <Select
                value={newSample.position}
                onChange={(e) => setNewSample({ ...newSample, position: e.target.value })}
                label="Columna (1-7)"
              >
                {WAREHOUSE_CONFIG.columns.map((col) => (
                  <MenuItem key={col} value={col}>Columna {col}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {/* Vista previa de ubicación */}
          <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Ubicación asignada:
            </Typography>
            <Typography variant="h5" sx={{ fontFamily: 'monospace', fontWeight: 700, color: 'primary.main' }}>
              {generateLocationCode(newSample.zone, newSample.level, newSample.position)}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDialogOpen(false)} variant="outlined">
            Cancelar
          </Button>
          <Button onClick={handleCreateSample} variant="contained" sx={{ px: 4 }}>
            Crear Muestra
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Samples;

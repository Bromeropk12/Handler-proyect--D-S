import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Chip,
  CircularProgress,
  Divider,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  PictureAsPdf as PdfIcon,
  Print as PrintIcon,
  Add as EntryIcon,
  Remove as ExitIcon,
  LocationOn as LocationIcon,
} from '@mui/icons-material';
import { useSamples } from '../context/SamplesContext';
import { samplesAPI } from '../services/api';
import { generateLocationCode } from '../constants/warehouseConfig';
import WarehouseVisualizer from '../components/WarehouseVisualizer';

const SampleDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { selectedSample, loading, fetchSample, generateLabels, getPdfUrl, samples } = useSamples();
  const [labelDialogOpen, setLabelDialogOpen] = useState(false);
  const [labelQuantity, setLabelQuantity] = useState(1);
  const [movements, setMovements] = useState([]);
  const [visualizerOpen, setVisualizerOpen] = useState(false);

  useEffect(() => {
    fetchSample(id);
    loadMovements();
  }, [id]);

  const loadMovements = async () => {
    try {
      const response = await samplesAPI.getMovements(id);
      setMovements(response.data);
    } catch (error) {
      console.error('Error loading movements:', error);
    }
  };

  const handleViewPdf = () => {
    if (selectedSample?.coa_path) {
      window.open(getPdfUrl(id), '_blank');
    }
  };

  const handleGenerateLabels = async () => {
    try {
      const result = await generateLabels(id, { 
        quantity: labelQuantity,
        include_qr: true,
        include_barcode: false
      });
      alert(result.message);
      setLabelDialogOpen(false);
    } catch (error) {
      alert('Error al generar etiquetas');
    }
  };

  if (loading || !selectedSample) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  const locationCode = generateLocationCode(selectedSample.zone, selectedSample.level, selectedSample.position);

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Button startIcon={<BackIcon />} onClick={() => navigate('/samples')}>
          Volver
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Información principal */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                <Box>
                  <Typography variant="h4">{selectedSample.reference_code}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Lote: {selectedSample.batch_number}
                  </Typography>
                </Box>
                <Chip 
                  label={selectedSample.business_line} 
                  color="primary" 
                  variant="outlined" 
                />
              </Box>

              <Typography variant="body1" sx={{ mb: 3 }}>
                {selectedSample.description}
              </Typography>

              <Divider sx={{ my: 2 }} />

              <Grid container spacing={2}>
                <Grid item xs={6} md={3}>
                  <Typography variant="caption" color="text.secondary">Proveedor</Typography>
                  <Typography variant="body2">{selectedSample.supplier}</Typography>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Typography variant="caption" color="text.secondary">Cantidad</Typography>
                  <Typography variant="body2">{selectedSample.quantity} {selectedSample.unit}</Typography>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Typography variant="caption" color="text.secondary">Estado</Typography>
                  <Typography variant="body2">{selectedSample.status}</Typography>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Typography variant="caption" color="text.secondary">Composición</Typography>
                  <Typography variant="body2">{selectedSample.chemical_composition || 'N/A'}</Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Movimientos */}
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Historial de Movimientos</Typography>
              {movements.length === 0 ? (
                <Typography color="text.secondary">No hay movimientos registrados</Typography>
              ) : (
                movements.map((movement) => (
                  <Box key={movement.id} sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1 }}>
                    {movement.movement_type === 'entry' ? <EntryIcon color="success" /> : <ExitIcon color="error" />}
                    <Typography variant="body2">
                      {movement.movement_type === 'entry' ? 'Entrada' : 'Salida'}: {movement.quantity} {movement.unit}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(movement.created_at).toLocaleString()}
                    </Typography>
                  </Box>
                ))
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Panel lateral */}
        <Grid item xs={12} md={4}>
          {/* Ubicación */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Ubicación</Typography>
              <Box sx={{ 
                bgcolor: 'primary.light', 
                color: 'white', 
                p: 3, 
                borderRadius: 2,
                textAlign: 'center',
                mb: 2
              }}>
                <Typography variant="h4" sx={{ fontFamily: 'monospace', fontWeight: 700 }}>
                  {locationCode}
                </Typography>
                <Typography variant="body2">
                  {selectedSample.zone === 'COS' ? 'Cosmética' : selectedSample.zone === 'IND' ? 'Industrial' : 'Farma'}
                </Typography>
              </Box>
              <Button 
                fullWidth
                variant="contained"
                startIcon={<LocationIcon />}
                onClick={() => setVisualizerOpen(true)}
                sx={{
                  background: 'linear-gradient(135deg, #9c27b0 0%, #1976d2 100%)',
                }}
              >
                Ver en Mapa
              </Button>
            </CardContent>
          </Card>

          {/* Acciones */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Acciones</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Button 
                  variant="contained" 
                  startIcon={<PrintIcon />}
                  onClick={() => setLabelDialogOpen(true)}
                >
                  Imprimir Etiquetas
                </Button>
                {selectedSample.coa_path && (
                  <Button 
                    variant="outlined" 
                    startIcon={<PdfIcon />}
                    onClick={handleViewPdf}
                  >
                    Ver CoA (PDF)
                  </Button>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Dialog para generar etiquetas */}
      <Dialog open={labelDialogOpen} onClose={() => setLabelDialogOpen(false)}>
        <DialogTitle>Generar Etiquetas</DialogTitle>
        <DialogContent>
          <TextField
            label="Cantidad de etiquetas"
            type="number"
            value={labelQuantity}
            onChange={(e) => setLabelQuantity(parseInt(e.target.value))}
            inputProps={{ min: 1, max: 100 }}
            fullWidth
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLabelDialogOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleGenerateLabels}>
            Generar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Visualizador de Bodega */}
      <WarehouseVisualizer 
        open={visualizerOpen} 
        onClose={() => setVisualizerOpen(false)} 
        sample={selectedSample}
        allSamples={samples}
      />
    </Box>
  );
};

export default SampleDetail;

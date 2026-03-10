import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  IconButton,
  Chip,
  Grid,
  Button,
  Divider,
} from '@mui/material';
import {
  Close as CloseIcon,
  LocationOn as LocationIcon,
  Inventory2 as ShelfIcon,
} from '@mui/icons-material';
import { WAREHOUSE_CONFIG, generateLocationCode, getZoneInfo } from '../constants/warehouseConfig';

// Componente para renderizar un bloque individual
const WarehouseBlock = ({ block, sample, allSamples, isSelectedBlock }) => {
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    if (isSelectedBlock && sample) {
      setAnimating(true);
      const timer = setTimeout(() => setAnimating(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [isSelectedBlock, sample]);

  // Filtrar muestras en esta zona
  const samplesInBlock = allSamples.filter(s => 
    s.zone?.toUpperCase().startsWith(block.id)
  );

  // Obtener productos por posicion
  const getSampleAtPosition = (level, position) => {
    return allSamples.find(s => 
      s.zone?.toUpperCase().startsWith(block.id) &&
      s.level?.toUpperCase() === String(level).toUpperCase() &&
      s.position?.toUpperCase() === String(position).toUpperCase()
    );
  };

  // Verificar si es la posicion seleccionada
  const isSelectedPosition = (level, position) => {
    if (!sample) return false;
    return sample.zone?.toUpperCase().startsWith(block.id) &&
      sample.level?.toUpperCase() === String(level).toUpperCase() &&
      sample.position?.toUpperCase() === String(position).toUpperCase();
  };

  return (
    <Box sx={{ 
      flex: '1 1 300px',
      minWidth: 280,
      maxWidth: 400,
      p: 2,
      bgcolor: isSelectedBlock ? block.lightColor : 'grey.50',
      borderRadius: 2,
      border: `2px solid ${isSelectedBlock ? block.color : 'grey.200'}`
    }}>
      {/* Encabezado del bloque */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <ShelfIcon sx={{ color: block.color }} />
        <Typography variant="h6" sx={{ fontWeight: 700, color: block.color }}>
          {block.name}
        </Typography>
        <Chip 
          label={`${samplesInBlock.length}/49`} 
          size="small"
          sx={{ ml: 'auto', bgcolor: block.color, color: 'white' }}
        />
      </Box>

      {/* Grid 7x7 - Mostrando 7 estantes x 7 posiciones */}
      <Box>
        {/* Encabezado de columnas (Posiciones 1-7) */}
        <Box sx={{ display: 'flex', ml: 4, mb: 0.5 }}>
          {WAREHOUSE_CONFIG.columns.map((col) => (
            <Box
              key={`header-${col}`}
              sx={{
                width: 36,
                textAlign: 'center',
                fontWeight: 700,
                fontSize: '0.75rem',
                color: sample?.position === col && isSelectedBlock ? block.color : 'text.secondary'
              }}
            >
              {col}
            </Box>
          ))}
        </Box>

        {/* Filas (A-G = Niveles) */}
        {block.rows.map((row, rowIndex) => (
          <Box key={`row-${row}`} sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
            {/* Etiqueta de fila (Nivel) */}
            <Box
              sx={{
                width: 30,
                textAlign: 'center',
                fontWeight: 700,
                fontSize: '0.75rem',
                color: sample?.level === row && isSelectedBlock ? block.color : 'text.secondary',
                mr: 0.5
              }}
            >
              {row}
            </Box>
            
            {/* Celdas para cada estante (1-7) */}
            {WAREHOUSE_CONFIG.columns.map((col) => {
              // Para este grid, usamos row como nivel y col como posicion
              const sampleInCell = getSampleAtPosition(row, col);
              const isSelected = isSelectedPosition(row, col);

              return (
                <Box
                  key={`${row}-${col}`}
                  sx={{
                    width: 34,
                    height: 28,
                    bgcolor: isSelected 
                      ? '#ffeb3b' 
                      : sampleInCell 
                        ? block.color + '40'
                        : '#ffffff',
                    border: isSelected
                      ? '2px solid #fbc02d'
                      : sampleInCell
                        ? `2px solid ${block.color}`
                        : `1px solid ${block.color}20`,
                    borderRadius: 0.5,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: sampleInCell ? 'pointer' : 'default',
                    transition: 'all 0.2s ease',
                    mr: 0.25,
                    animation: isSelected && animating ? 'pulse 0.5s ease-in-out 3' : 'none',
                    '&:hover': sampleInCell ? {
                      transform: 'scale(1.15)',
                      boxShadow: 2,
                      zIndex: 1
                    } : {},
                  }}
                  title={sampleInCell 
                    ? `${sampleInCell.description}\nCodigo: ${sampleInCell.reference_code}\nLote: ${sampleInCell.batch_number}\nZona: ${generateLocationCode(sampleInCell.zone, sampleInCell.level, sampleInCell.position)}`
                    : `Disponible: ${block.name} - Nivel ${row} - Pos ${col}`
                  }
                >
                  {sampleInCell && (
                    <Box
                      sx={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        bgcolor: block.color,
                      }}
                    />
                  )}
                </Box>
              );
            })}
          </Box>
        ))}
      </Box>
    </Box>
  );
};

const WarehouseVisualizer = ({ open, onClose, sample, allSamples = [] }) => {
  if (!sample) return null;

  // Obtener la zona del producto seleccionado
  const selectedZone = getZoneInfo(sample.zone);
  const locationCode = generateLocationCode(sample.zone, sample.level, sample.position);

  // Obtener muestras por zona
  const getSamplesCount = (blockId) => {
    return allSamples.filter(s => s.zone?.toUpperCase().startsWith(blockId)).length;
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="xl"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 3, minHeight: '70vh' }
      }}
    >
      <DialogTitle sx={{ 
        pb: 1,
        background: `linear-gradient(135deg, #9c27b020, #1976d220)`,
        borderBottom: '3px solid #9c27b0'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <LocationIcon sx={{ color: '#9c27b0', fontSize: 32 }} />
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                Localizacion en Bodega - Sistema de Coordenadas
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Vista completa de las 3 zonas | Grid 7x7 (Filas A-G x Posiciones 1-7)
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={onClose} size="large">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        {/* Informacion del producto seleccionado */}
        <Box sx={{ 
          mb: 3, 
          p: 3, 
          borderRadius: 3, 
          bgcolor: selectedZone.lightColor,
          border: `3px solid ${selectedZone.color}`,
        }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                Producto seleccionado
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 700, color: selectedZone.color }}>
                {sample.description}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Codigo: <strong>{sample.reference_code}</strong> | Lote: <strong>{sample.batch_number}</strong>
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ textAlign: { md: 'right' } }}>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                  Ubicacion Exacta
                </Typography>
                <Typography 
                  variant="h4" 
                  sx={{ 
                    fontFamily: 'monospace', 
                    fontWeight: 800,
                    color: selectedZone.color,
                  }}
                >
                  {locationCode}
                </Typography>
                <Box sx={{ mt: 1 }}>
                  <Chip 
                    label={selectedZone.name} 
                    size="small"
                    icon={<ShelfIcon />}
                    sx={{ 
                      bgcolor: selectedZone.color, 
                      color: 'white',
                      fontWeight: 700,
                    }} 
                  />
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Box>

        {/* Leyenda de zonas */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
            Leyenda de Zonas
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            {WAREHOUSE_CONFIG.blocks.map((block) => (
              <Chip
                key={block.id}
                label={`${block.name} (${getSamplesCount(block.id)} muestras)`}
                icon={<ShelfIcon />}
                sx={{
                  bgcolor: block.id === selectedZone.id ? block.color : block.lightColor,
                  color: block.id === selectedZone.id ? 'white' : block.color,
                  fontWeight: 600,
                  border: `2px solid ${block.color}`,
                }}
              />
            ))}
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Mapa visual - Los 3 bloques juntos */}
        <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
          Mapa de Bodega - Vista General
        </Typography>

        <Box sx={{ 
          display: 'flex', 
          gap: 2,
          flexWrap: 'wrap',
          justifyContent: 'center',
          mb: 3,
        }}>
          {WAREHOUSE_CONFIG.blocks.map((block) => (
            <WarehouseBlock 
              key={block.id}
              block={block}
              sample={sample}
              allSamples={allSamples}
              isSelectedBlock={block.id === selectedZone.id}
            />
          ))}
        </Box>

        {/* Sistema de coordenadas */}
        <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.100', borderRadius: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
            Sistema de Coordenadas
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6} md={3}>
              <Typography variant="body2" color="text.secondary">
                <strong>Formato:</strong> ZONA-FILA-COLUMNA
              </Typography>
            </Grid>
            <Grid item xs={6} md={3}>
              <Typography variant="body2" color="text.secondary">
                <strong>Zonas:</strong> COS (Cosméticos), FAR (Farmacológica), IND (Industrial)
              </Typography>
            </Grid>
            <Grid item xs={6} md={3}>
              <Typography variant="body2" color="text.secondary">
                <strong>Filas:</strong> A-G (7 letras)
              </Typography>
            </Grid>
            <Grid item xs={6} md={3}>
              <Typography variant="body2" color="text.secondary">
                <strong>Columnas:</strong> 1-7 (7 números)
              </Typography>
            </Grid>
          </Grid>
        </Box>

        {/* Resumen de capacidad */}
        <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
            Capacidad Total
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            {WAREHOUSE_CONFIG.blocks.map((block) => {
              const count = getSamplesCount(block.id);
              const percentage = Math.round((count / 49) * 100);
              return (
                <Box 
                  key={block.id}
                  sx={{ 
                    flex: '1 1 150px',
                    p: 1.5, 
                    bgcolor: 'white', 
                    borderRadius: 1,
                    border: `2px solid ${block.color}`
                  }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 600, color: block.color }}>
                    {block.name}
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {count}/49 ({percentage}%)
                  </Typography>
                  <Box sx={{ 
                    height: 8, 
                    bgcolor: 'grey.200', 
                    borderRadius: 4, 
                    mt: 1,
                    overflow: 'hidden'
                  }}>
                    <Box sx={{ 
                      height: '100%', 
                      width: `${percentage}%`, 
                      bgcolor: block.color,
                      borderRadius: 4 
                    }} />
                  </Box>
                </Box>
              );
            })}
          </Box>
        </Box>

        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
          <Button variant="contained" onClick={onClose} sx={{ px: 6, py: 1.5, fontSize: '1rem' }}>
            Cerrar
          </Button>
        </Box>
      </DialogContent>

      {/* CSS Animation */}
      <style>{`
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.2); }
          100% { transform: scale(1); }
        }
      `}</style>
    </Dialog>
  );
};

export default WarehouseVisualizer;

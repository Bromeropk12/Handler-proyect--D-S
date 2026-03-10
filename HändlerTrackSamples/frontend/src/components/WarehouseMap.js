import React, { useState, useEffect } from 'react';
import { Box, Typography, Card, CardContent, Grid, Chip } from '@mui/material';

// Colores por línea de negocio (según SRS)
const businessLineColors = {
  'Cosmética': { bg: '#9c27b0', light: '#f3e5f5', name: 'Cosmética' },
  'Industrial': { bg: '#1976d2', light: '#e3f2fd', name: 'Industrial' },
  'Farma': { bg: '#2e7d32', light: '#e8f5e9', name: 'Farma' },
};

// Configuración de estantes
const SHELVES = ['E1', 'E2', 'E3', 'E4', 'E5'];
const LEVELS = ['N1', 'N2', 'N3', 'N4'];
const POSITIONS = ['P01', 'P02', 'P03', 'P04', 'P05', 'P06'];

// Generar todas las celdas del estante
const generateShelfCells = () => {
  const cells = [];
  LEVELS.forEach((level) => {
    POSITIONS.forEach((position) => {
      cells.push({ level, position });
    });
  });
  return cells;
};

const WarehouseMap = ({ selectedSample, samples }) => {
  const [highlightedCell, setHighlightedCell] = useState(null);
  const [animatingCell, setAnimatingCell] = useState(false);

  useEffect(() => {
    if (selectedSample) {
      setHighlightedCell({
        shelf: selectedSample.shelf,
        level: selectedSample.level,
        position: selectedSample.position,
      });
      // Activar animación
      setAnimatingCell(true);
      setTimeout(() => setAnimatingCell(false), 2000);
    } else {
      setHighlightedCell(null);
    }
  }, [selectedSample]);

  // Obtener información de muestras por zona
  const getSamplesByZone = () => {
    const zones = { 'COS': [], 'IND': [], 'FAR': [] };
    samples.forEach((sample) => {
      const zoneCode = sample.zone?.toUpperCase();
      if (zoneCode?.startsWith('COS')) zones['COS'].push(sample);
      else if (zoneCode?.startsWith('IND')) zones['IND'].push(sample);
      else if (zoneCode?.startsWith('FAR')) zones['FAR'].push(sample);
    });
    return zones;
  };

  const samplesByZone = getSamplesByZone();

  // Verificar si una celda está seleccionada
  const isCellSelected = (shelf, level, position) => {
    if (!highlightedCell) return false;
    return (
      highlightedCell.shelf?.toUpperCase() === shelf.toUpperCase() &&
      highlightedCell.level?.toUpperCase() === level.toUpperCase() &&
      highlightedCell.position?.toUpperCase() === position.toUpperCase()
    );
  };

  // Obtener muestra en una celda específica
  const getSampleAtCell = (shelf, level, position) => {
    return samples.find(
      (s) =>
        s.shelf?.toUpperCase() === shelf.toUpperCase() &&
        s.level?.toUpperCase() === level.toUpperCase() &&
        s.position?.toUpperCase() === position.toUpperCase()
    );
  };

  // Obtener color de zona
  const getZoneColor = (zoneCode) => {
    if (!zoneCode) return '#e0e0e0';
    const zone = zoneCode.toUpperCase();
    if (zone.startsWith('COS')) return businessLineColors['Cosmética'].bg;
    if (zone.startsWith('IND')) return businessLineColors['Industrial'].bg;
    if (zone.startsWith('FAR')) return businessLineColors['Farma'].bg;
    return '#e0e0e0';
  };

  // Obtener nombre de zona
  const getZoneName = (zoneCode) => {
    if (!zoneCode) return 'Sin zona';
    const zone = zoneCode.toUpperCase();
    if (zone.startsWith('COS')) return 'Cosmética';
    if (zone.startsWith('IND')) return 'Industrial';
    if (zone.startsWith('FAR')) return 'Farma';
    return 'Unknown';
  };

  const shelfCells = generateShelfCells();

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flexGrow: 1, overflow: 'auto' }}>
        {/* Título */}
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          📍 Mapa de Estantería
        </Typography>

        {/* Leyenda de zonas */}
        <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
          {Object.entries(businessLineColors).map(([key, value]) => (
            <Chip
              key={key}
              label={value.name}
              size="small"
              sx={{ bgcolor: value.light, color: value.bg, fontWeight: 500 }}
            />
          ))}
        </Box>

        {/* Información de la muestra seleccionada */}
        {selectedSample ? (
          <Box
            sx={{
              mb: 2,
              p: 2,
              borderRadius: 2,
              bgcolor: getZoneColor(selectedSample.zone) + '20',
              border: `2px solid ${getZoneColor(selectedSample.zone)}`,
            }}
          >
            <Typography variant="subtitle2" color="text.secondary">
              Muestra Seleccionada
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 700, color: getZoneColor(selectedSample.zone) }}>
              {selectedSample.zone}-{selectedSample.shelf}-{selectedSample.level}-{selectedSample.position}
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              {selectedSample.description}
            </Typography>
            <Chip
              label={getZoneName(selectedSample.zone)}
              size="small"
              sx={{ mt: 1, bgcolor: getZoneColor(selectedSample.zone), color: 'white' }}
            />
          </Box>
        ) : (
          <Box sx={{ mb: 2, p: 2, borderRadius: 2, bgcolor: 'grey.100' }}>
            <Typography variant="body2" color="text.secondary">
              👈 Haz clic en una muestra de la tabla para ver su ubicación
            </Typography>
          </Box>
        )}

        {/* Vista de Estante - Cuadrícula */}
        <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
          Vista de Estante
        </Typography>

        {/* Encabezado de posiciones */}
        <Box sx={{ display: 'flex', ml: 4, mb: 0.5 }}>
          {POSITIONS.map((pos) => (
            <Box
              key={pos}
              sx={{
                width: 50,
                textAlign: 'center',
                fontSize: '0.7rem',
                fontWeight: 600,
                color: 'text.secondary',
              }}
            >
              {pos}
            </Box>
          ))}
        </Box>

        {/* Niveles y posiciones */}
        {LEVELS.map((level) => (
          <Box key={level} sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
            {/* Etiqueta de nivel */}
            <Box
              sx={{
                width: 30,
                textAlign: 'center',
                fontSize: '0.75rem',
                fontWeight: 600,
                color: 'text.secondary',
                mr: 1,
              }}
            >
              {level}
            </Box>
            {/* Celdas del nivel */}
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              {POSITIONS.map((position) => {
                const sampleAtCell = getSampleAtCell(
                  selectedSample?.shelf || 'E1',
                  level,
                  position
                );
                const isSelected = isCellSelected(selectedSample?.shelf || 'E1', level, position);

                return (
                  <Box
                    key={`${level}-${position}`}
                    onClick={() => {
                      if (sampleAtCell) {
                        // Emitir evento de selección (handled by parent)
                      }
                    }}
                    sx={{
                      width: 48,
                      height: 40,
                      bgcolor: isSelected
                        ? '#ffeb3b'
                        : sampleAtCell
                        ? getZoneColor(sampleAtCell.zone) + '40'
                        : '#f5f5f5',
                      border: isSelected
                        ? '3px solid #ffeb3b'
                        : sampleAtCell
                        ? `2px solid ${getZoneColor(sampleAtCell.zone)}`
                        : '1px solid #e0e0e0',
                      borderRadius: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: sampleAtCell ? 'pointer' : 'default',
                      transition: 'all 0.3s ease',
                      animation: isSelected && animatingCell ? 'pulse 0.5s ease-in-out 3' : 'none',
                      '&:hover': sampleAtCell
                        ? {
                            bgcolor: getZoneColor(sampleAtCell.zone) + '60',
                            transform: 'scale(1.05)',
                          }
                        : {},
                      '@keyframes pulse': {
                        '0%': { transform: 'scale(1)' },
                        '50%': { transform: 'scale(1.1)' },
                        '100%': { transform: 'scale(1)' },
                      },
                    }}
                    title={sampleAtCell ? `${sampleAtCell.description} (${sampleAtCell.reference_code})` : 'Vacío'}
                  >
                    {sampleAtCell && (
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          bgcolor: getZoneColor(sampleAtCell.zone),
                        }}
                      />
                    )}
                  </Box>
                );
              })}
            </Box>
          </Box>
        ))}

        {/* Selector de estante */}
        <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Seleccionar Estante
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {SHELVES.map((shelf) => (
              <Chip
                key={shelf}
                label={shelf}
                onClick={() => {
                  // Aquí se podría implementar cambio de estante
                }}
                sx={{
                  bgcolor:
                    selectedSample?.shelf === shelf
                      ? 'primary.main'
                      : 'white',
                  color:
                    selectedSample?.shelf === shelf
                      ? 'white'
                      : 'text.primary',
                  fontWeight: 600,
                  '&:hover': {
                    bgcolor:
                      selectedSample?.shelf === shelf
                        ? 'primary.dark'
                        : 'grey.200',
                  },
                }}
              />
            ))}
          </Box>
        </Box>

        {/* Resumen por zona */}
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Muestras por Zona
          </Typography>
          <Grid container spacing={1}>
            {Object.entries(samplesByZone).map(([zone, zoneSamples]) => (
              <Grid item xs={4} key={zone}>
                <Box
                  sx={{
                    p: 1,
                    borderRadius: 1,
                    bgcolor: businessLineColors[getZoneName(zone)]?.light || '#f5f5f5',
                    textAlign: 'center',
                  }}
                >
                  <Typography variant="h6" sx={{ fontWeight: 700, color: businessLineColors[getZoneName(zone)]?.bg }}>
                    {zoneSamples.length}
                  </Typography>
                  <Typography variant="caption" sx={{ color: businessLineColors[getZoneName(zone)]?.bg }}>
                    {getZoneName(zone)}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Box>
      </CardContent>
    </Card>
  );
};

export default WarehouseMap;

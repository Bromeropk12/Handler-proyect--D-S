import React from 'react';
import { Box, Typography, Chip, Paper, Tooltip, IconButton, Badge } from '@mui/material';
import { Warning as WarningIcon, CheckCircle as OkIcon, Inventory as EmptyIcon } from '@mui/icons-material';

const GHS_COLORS = {
  GHS01: '#FF5722',
  GHS02: '#F44336',
  GHS03: '#E91E63',
  GHS04: '#9C27B0',
  GHS05: '#673AB7',
  GHS06: '#3F51B5',
  GHS07: '#2196F3',
  GHS08: '#03A9F4',
  GHS09: '#00BCD4',
  default: '#9E9E9E',
};

const HileraGrid = ({ 
  hileras = [], 
  onHileraClick, 
  selectedHileraId,
  showDetails = true 
}) => {
  const groupedByAnaquel = React.useMemo(() => {
    const grupos = {};
    hileras.forEach(hilera => {
      const anaquelKey = hilera.anaquel_nombre || `Anaquel-${hilera.anaquel_id}`;
      if (!grupos[anaquelKey]) {
        grupos[anaquelKey] = {
          anaquel_id: hilera.anaquel_id,
          nombre: anaquelKey,
          niveles: {},
        };
      }
      const nivelKey = `nivel-${hilera.nivel}`;
      if (!grupos[anaquelKey].niveles[nivelKey]) {
        grupos[anaquelKey].niveles[nivelKey] = {
          nivel: hilera.nivel,
          filas: {},
        };
      }
      const filaKey = `fila-${hilera.fila}`;
      if (!grupos[anaquelKey].niveles[nivelKey].filas[filaKey]) {
        grupos[anaquelKey].niveles[nivelKey].filas[filaKey] = {
          fila: hilera.fila,
          posiciones: [],
        };
      }
      grupos[anaquelKey].niveles[nivelKey].filas[filaKey].posiciones.push(hilera);
    });
    return grupos;
  }, [hileras]);

  const getHileraColor = (hilera) => {
    if (hilera.estado === 'disponible') return '#E8F5E9';
    if (!hilera.muestra) return '#FFF3E0';
    if (hilera.tiene_incompatibilidad) return '#FFEBEE';
    if (hilera.clase_peligro) return GHS_COLORS[hilera.clase_peligro] || GHS_COLORS.default;
    return '#E3F2FD';
  };

  const getHileraTextColor = (hilera) => {
    if (hilera.estado === 'disponible') return '#2E7D32';
    if (!hilera.muestra) return '#E65100';
    if (hilera.tiene_incompatibilidad) return '#C62828';
    return '#1565C0';
  };

  const renderPosicion = (hilera) => {
    const bgColor = getHileraColor(hilera);
    const textColor = getHileraTextColor(hilera);
    const isSelected = selectedHileraId === hilera.id;

    return (
      <Tooltip
        key={hilera.id}
        title={
          <Box sx={{ p: 1 }}>
            {hilera.muestra ? (
              <>
                <Typography variant="subtitle2">{hilera.muestra.nombre}</Typography>
                <Typography variant="caption">Lote: {hilera.muestra.lote}</Typography>
                <br />
                <Typography variant="caption">
                  Clase: {hilera.clase_peligro || 'Sin clase'}
                </Typography>
                {hilera.tiene_incompatibilidad && (
                  <Box sx={{ mt: 1, color: '#FFCDD2' }}>
                    <WarningIcon fontSize="small" /> Incompatible
                  </Box>
                )}
              </>
            ) : (
              <Typography variant="caption">Posición disponible</Typography>
            )}
            <Typography variant="caption" display="block">
              Nivel {hilera.nivel}, Fila {hilera.fila}, Pos {hilera.posicion}
            </Typography>
          </Box>
        }
        arrow
      >
        <Box
          onClick={() => onHileraClick?.(hilera)}
          sx={{
            width: 36,
            height: 36,
            bgcolor: bgColor,
            border: isSelected ? '2px solid #1976D2' : '1px solid rgba(0,0,0,0.12)',
            borderRadius: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s',
            '&:hover': {
              transform: 'scale(1.1)',
              boxShadow: 2,
              zIndex: 1,
            },
            position: 'relative',
          }}
        >
          {hilera.muestra ? (
            <Typography 
              variant="caption" 
              sx={{ 
                fontWeight: 600, 
                color: textColor,
                fontSize: 9,
                textAlign: 'center',
                lineHeight: 1,
              }}
            >
              {hilera.muestra.nombre?.substring(0, 6) || '?'}
            </Typography>
          ) : (
            <EmptyIcon sx={{ fontSize: 14, color: textColor, opacity: 0.5 }} />
          )}
          {hilera.tiene_incompatibilidad && (
            <Badge 
              badgeContent="!" 
              color="error"
              sx={{ 
                position: 'absolute', 
                top: -4, 
                right: -4,
                '& .MuiBadge-badge': { fontSize: 8, minWidth: 14, height: 14 }
              }}
            />
          )}
        </Box>
      </Tooltip>
    );
  };

  if (hileras.length === 0) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="body1" color="text.secondary">
          No hay hileras para mostrar
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ overflowX: 'auto', p: 1 }}>
      {Object.entries(groupedByAnaquel).map(([anaquelKey, anaquelData]) => (
        <Paper 
          key={anaquelKey} 
          sx={{ mb: 3, p: 2, bgcolor: '#FAFAFA' }}
          elevation={1}
        >
          <Typography 
            variant="h6" 
            sx={{ 
              mb: 2, 
              fontWeight: 600,
              color: '#1976D2',
              borderBottom: '2px solid #1976D2',
              pb: 1
            }}
          >
            {anaquelKey}
          </Typography>

          {Object.entries(anaquelData.niveles)
            .sort((a, b) => b[1].nivel - a[1].nivel)
            .map(([nivelKey, nivelData]) => (
              <Box key={nivelKey} sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: '#424242' }}>
                  Nivel {nivelData.nivel}
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  {Object.entries(nivelData.filas)
                    .sort((a, b) => a[1].fila - b[1].fila)
                    .map(([filaKey, filaData]) => (
                      <Box 
                        key={filaKey} 
                        sx={{ 
                          display: 'flex', 
                          alignItems: 'center',
                          gap: 1,
                          p: 0.5,
                          bgcolor: '#FFFFFF',
                          borderRadius: 1,
                        }}
                      >
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            fontWeight: 600, 
                            minWidth: 40,
                            color: '#616161'
                          }}
                        >
                          F{filaData.fila}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          {filaData.posiciones
                            .sort((a, b) => a.posicion - b.posicion)
                            .map(renderPosicion)}
                        </Box>
                      </Box>
                    ))}
                </Box>
              </Box>
            ))}
        </Paper>
      ))}
    </Box>
  );
};

export default HileraGrid;

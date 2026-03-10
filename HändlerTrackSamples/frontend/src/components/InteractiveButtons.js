import React from 'react';
import { Box, Button, Fade } from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import ScienceOutlinedIcon from '@mui/icons-material/ScienceOutlined';
import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined';
import { interactiveButtonStyles } from '../constants/theme';

/**
 * Componente: InteractiveButtons
 * Descripcion: Botones interactivos del panel derecho
 */
const InteractiveButtons = ({ activePanel, onPanelSelect }) => {
  const buttons = [
    {
      id: 'whatis',
      label: 'Que es "Handler TrackSamples"?',
      icon: <InfoOutlinedIcon sx={{ fontSize: 28 }} />,
    },
    {
      id: 'features',
      label: 'Caracteristicas Principales',
      icon: <ScienceOutlinedIcon sx={{ fontSize: 28 }} />,
    },
    {
      id: 'system',
      label: 'Sistema de Gestion',
      icon: <HistoryOutlinedIcon sx={{ fontSize: 28 }} />,
    },
  ];

  return (
    <Fade in={activePanel === null}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 2.5,
          width: '100%',
          maxWidth: 500,
        }}
      >
        {buttons.map((button) => (
          <Button
            key={button.id}
            fullWidth
            onClick={() => onPanelSelect(button.id)}
            startIcon={button.icon}
            sx={interactiveButtonStyles}
          >
            {button.label}
          </Button>
        ))}
      </Box>
    </Fade>
  );
};

export default InteractiveButtons;

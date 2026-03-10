import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Slide } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import LoginForm from '../components/LoginForm';
import InteractiveButtons from '../components/InteractiveButtons';
import InfoPanel from '../components/InfoPanel';
import { LOGIN_GRADIENT } from '../constants/theme';

/**
 * Página: Login
 * Descripción: Pantalla de autenticación con diseño split-screen
 * Componentes hijos:
 *   - LoginForm: Formulario de autenticación
 *   - InteractiveButtons: Botones de información
 *   - InfoPanel: Panel deslizable de información
 */
const Login = () => {
  // Estados del formulario
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [activePanel, setActivePanel] = useState(null);

  // Context
  const { login } = useAuth();
  const navigate = useNavigate();

  // Handlers
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(username, password);
    
    setLoading(false);
    
    if (result.success) {
      navigate('/');
    } else {
      setError(result.message);
    }
  };

  const handlePanelSelect = (panelId) => {
    setActivePanel(panelId);
  };

  const handleClosePanel = () => {
    setActivePanel(null);
  };

  return (
    <Box sx={styles.container}>
      {/* Fondo gradiente */}
      <Box sx={styles.background} />

      {/* Panel Izquierdo - Login */}
      <Box sx={styles.leftPanel}>
        <LoginForm
          username={username}
          password={password}
          error={error}
          loading={loading}
          onUsernameChange={setUsername}
          onPasswordChange={setPassword}
          onSubmit={handleSubmit}
        />
      </Box>

      {/* Panel Derecho - Botones interactivos */}
      <Box sx={styles.rightPanel}>
        <InteractiveButtons
          activePanel={activePanel}
          onPanelSelect={handlePanelSelect}
        />

        {/* Panel de información animado */}
        <Slide direction="left" in={activePanel !== null} mountOnEnter unmountOnExit>
          <div>
            <InfoPanel
              activePanel={activePanel}
              onClose={handleClosePanel}
            />
          </div>
        </Slide>
      </Box>
    </Box>
  );
};

// Estilos del componente
const styles = {
  container: {
    display: 'flex',
    minHeight: '100vh',
    width: '100%',
    position: 'relative',
  },
  background: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: LOGIN_GRADIENT,
    zIndex: -1,
  },
  leftPanel: {
    width: { xs: '100%', md: '40%' },
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    p: 4,
    position: 'relative',
    zIndex: 1,
    minHeight: '100vh',
  },
  rightPanel: {
    width: { xs: '0%', md: '60%' },
    display: { xs: 'none', md: 'flex' },
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
    position: 'relative',
    p: 4,
    minHeight: '100vh',
  },
};

export default Login;

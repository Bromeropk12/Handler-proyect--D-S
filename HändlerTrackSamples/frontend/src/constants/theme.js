// Colores de marca - Händler TrackSamples
export const COLORS = {
  charcoal: '#120C13',
  red: '#EA222C',
  yellow: '#FCDD38',
  white: '#FFFFFF',
};

// Gradiente de fondo para la página de login
export const LOGIN_GRADIENT = `linear-gradient(135deg, ${COLORS.charcoal} 0%, #1a1520 50%, ${COLORS.red}22 100%)`;

// Estilos reutilizables para botones interactivos
export const interactiveButtonStyles = {
  width: '100%',
  maxWidth: 500,
  height: 60,
  justifyContent: 'flex-start',
  padding: '0 24px',
  borderRadius: 2,
  textTransform: 'none',
  fontSize: '1.1rem',
  fontWeight: 500,
  transition: 'all 0.3s ease',
  
  // ESTADO POR DEFECTO
  color: COLORS.charcoal,
  backgroundColor: 'transparent',
  border: '1px solid rgba(18, 12, 19, 0.15)',
  
  // ESTADO HOVER
  '&:hover': {
    backgroundColor: 'rgba(252, 221, 56, 0.2)',
    borderColor: COLORS.yellow,
    transform: 'translateX(8px)',
  },
};

// Estilos del panel de login
export const loginBoxStyles = {
  width: '100%',
  maxWidth: 420,
  bgcolor: 'rgba(255, 255, 255, 0.98)',
  borderRadius: 3,
  p: 5,
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
};

// Estilos del panel de información
export const infoPanelStyles = {
  position: 'fixed',
  top: 0,
  right: 0,
  width: '60%',
  height: '100vh',
  bgcolor: 'rgba(18,12,19,0.97)',
  backdropFilter: 'blur(30px)',
  p: 6,
  display: 'flex',
  flexDirection: 'column',
  overflow: 'auto',
  zIndex: 1000,
};

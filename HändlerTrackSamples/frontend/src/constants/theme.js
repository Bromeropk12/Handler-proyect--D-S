// ============================================
// TEMA Y ESTILOS - HÄNDLER TRACKSAMPLES
// ============================================

// Colores de marca principales
export const COLORS = {
  // Colores primarios
  primary: '#7b1fa2',
  primaryLight: '#9c27b0',
  primaryDark: '#6a1b9a',
  
  // Colores secundarios
  secondary: '#388e3c',
  secondaryLight: '#4caf50',
  secondaryDark: '#2e7d32',
  
  // Colores de información
  info: '#0288d1',
  infoLight: '#1976d2',
  infoDark: '#01579b',
  
  // Colores de advertencia
  warning: '#f57c00',
  warningLight: '#ff9800',
  warningDark: '#e65100',
  
  // Colores de error
  error: '#d32f2f',
  errorLight: '#ef5350',
  errorDark: '#c62828',
  
  // Colores especiales
  charcoal: '#120c13',
  red: '#EA222C',
  gold: '#fcdd38',
  white: '#FFFFFF',
  
  // Grises
  grey50: '#fafafa',
  grey100: '#f5f5f5',
  grey200: '#eeeeee',
  grey300: '#e0e0e0',
  grey400: '#bdbdbd',
  grey500: '#9e9e9e',
};

// ============================================
// GRADIENTES
// ============================================

// Gradiente para página de login
export const LOGIN_GRADIENT = `linear-gradient(135deg, ${COLORS.charcoal} 0%, #1a1520 50%, ${COLORS.red}22 100%)`;

// Gradiente primario
export const PRIMARY_GRADIENT = `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primaryLight} 100%)`;

// Gradiente para tarjetas
export const CARD_GRADIENT = `linear-gradient(145deg, #ffffff 0%, ${COLORS.primary}02 100%)`;

// ============================================
// FUNCIONES AUXILIARES DE ESTILO
// ============================================

// Función para crear efectos de glassmorphism
export const glassEffect = (opacity = 0.1, blur = '20px') => ({
  background: `rgba(255, 255, 255, ${1 - opacity})`,
  backdropFilter: `blur(${blur})`,
  WebkitBackdropFilter: `blur(${blur})`,
});

// ============================================
// ESTILOS DE BOTONES INTERACTIVOS
// ============================================

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
    borderColor: COLORS.gold,
    transform: 'translateX(8px)',
  },
};

// ============================================
// ESTILOS DEL PANEL DE LOGIN
// ============================================

export const loginBoxStyles = {
  width: '100%',
  maxWidth: 420,
  bgcolor: 'rgba(255, 255, 255, 0.98)',
  borderRadius: 3,
  p: 5,
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
};

// ============================================
// ESTILOS DEL PANEL DE INFORMACIÓN
// ============================================

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

// ============================================
// ESTILOS DE TARJETAS MODERNAS
// ============================================

// Tarjeta base con sombra
export const modernCardStyles = {
  borderRadius: 3,
  border: `1px solid rgba(123, 31, 162, 0.1)`,
  boxShadow: '0 8px 32px rgba(0,0,0,0.06)',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: '0 16px 48px rgba(123, 31, 162, 0.12)',
    borderColor: 'rgba(123, 31, 162, 0.2)',
  },
};

// ============================================
// ESTILOS DE INPUT
// ============================================

export const inputStyles = {
  '& .MuiOutlinedInput-root': {
    borderRadius: 2,
    transition: 'all 0.3s ease',
    '&:hover': {
      '& .MuiOutlinedInput-notchedOutline': {
        borderColor: COLORS.primary,
      },
    },
    '&.Mui-focused': {
      '& .MuiOutlinedInput-notchedOutline': {
        borderWidth: 2,
      },
    },
  },
};

// ============================================
// ESTILOS DE BOTONES
// ============================================

export const primaryButtonStyles = {
  borderRadius: 2.5,
  textTransform: 'none',
  fontWeight: 600,
  boxShadow: `0 8px 24px ${COLORS.primary}30`,
  transition: 'all 0.3s ease',
  '&:hover': {
    boxShadow: `0 12px 32px ${COLORS.primary}40`,
    transform: 'translateY(-2px)',
  },
};

export const secondaryButtonStyles = {
  borderRadius: 2.5,
  textTransform: 'none',
  fontWeight: 500,
  borderColor: COLORS.primary,
  color: COLORS.primary,
  transition: 'all 0.3s ease',
  '&:hover': {
    borderColor: COLORS.primaryDark,
    bgcolor: `${COLORS.primary}08`,
    transform: 'translateY(-2px)',
  },
};

// ============================================
// ESTILOS DE TIPOGRAFÍA
// ============================================

export const typographyStyles = {
  // Títulos principales
  h1: {
    fontWeight: 800,
    background: `linear-gradient(135deg, ${COLORS.charcoal} 0%, ${COLORS.primary} 50%, ${COLORS.primaryLight} 100%)`,
    backgroundClip: 'text',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  h2: {
    fontWeight: 700,
    color: '#1a1a1a',
  },
  h3: {
    fontWeight: 700,
    color: '#1a1a1a',
  },
  h4: {
    fontWeight: 600,
    color: '#1a1a1a',
  },
  h5: {
    fontWeight: 600,
    color: '#1a1a1a',
  },
  h6: {
    fontWeight: 600,
    color: '#1a1a1a',
  },
};

// ============================================
// EXPORTACIÓN DEL TEMA MUI
// ============================================

// Configuración del tema para MUI ThemeProvider
export const themeConfig = {
  palette: {
    primary: {
      main: COLORS.primary,
      light: COLORS.primaryLight,
      dark: COLORS.primaryDark,
    },
    secondary: {
      main: COLORS.secondary,
      light: COLORS.secondaryLight,
      dark: COLORS.secondaryDark,
    },
    info: {
      main: COLORS.info,
      light: COLORS.infoLight,
      dark: COLORS.infoDark,
    },
    warning: {
      main: COLORS.warning,
      light: COLORS.warningLight,
      dark: COLORS.warningDark,
    },
    error: {
      main: COLORS.error,
      light: COLORS.errorLight,
      dark: COLORS.errorDark,
    },
    background: {
      default: COLORS.grey100,
      paper: COLORS.white,
    },
  },
  typography: {
    fontFamily: '"Segoe UI Variable", "Segoe UI", "Helvetica", "Arial", sans-serif',
    h1: { fontSize: '2.5rem', fontWeight: 500 },
    h2: { fontSize: '2rem', fontWeight: 500 },
    h3: { fontSize: '1.75rem', fontWeight: 500 },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
          fontWeight: 600,
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0px 2px 4px rgba(0,0,0,0.1)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0px 2px 8px rgba(0,0,0,0.05)',
          border: '1px solid #e0e0e0',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        elevation1: {
          boxShadow: '0px 2px 8px rgba(0,0,0,0.05)',
          border: '1px solid #e0e0e0',
        },
      },
    },
  },
};

// ============================================
// ANIMACIONES (para usar con @emotion/react keyframes)
// ============================================

export const animations = {
  // Fade in up
  fadeInUp: `
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  `,
  
  // Float
  float: `
    0%, 100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-10px);
    }
  `,
  
  // Pulse
  pulse: `
    0%, 100% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.05);
    }
  `,
  
  // Shimmer (para efekos de brillo)
  shimmer: `
    0% {
      background-position: -200% 0;
    }
    100% {
      background-position: 200% 0;
    }
  `,
};

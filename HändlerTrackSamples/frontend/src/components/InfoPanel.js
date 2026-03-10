import React, { useState, useEffect, useRef } from 'react';
import { Box, Typography, IconButton, Fade, Grow } from '@mui/material';
import { keyframes, alpha } from '@mui/system';
import CloseIcon from '@mui/icons-material/Close';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import FeaturedPlayListOutlinedIcon from '@mui/icons-material/FeaturedPlayListOutlined';
import SettingsSuggestOutlinedIcon from '@mui/icons-material/SettingsSuggestOutlined';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';

// ============================================
// PALETA CORPORATIVA HANDLER - SOLO 3 COLORES
// ============================================
const BRAND = {
  dark: '#120c13',      // Negro profundo corporativo
  red: '#ea222c',       // Rojo Handler
  gold: '#fcdd38',      // Amarillo/Dorado Handler
};

const COLORS = {
  // Colores principales de marca
  primary: BRAND.dark,
  accent: BRAND.red,
  highlight: BRAND.gold,
  
  // Variaciones derivadas (basadas en los 3 colores)
  darkLight: '#1e161f',     // Variación más clara del oscuro
  darkLighter: '#2a2030',   // Variación aún más clara
  
  // UI básicos
  white: '#ffffff',
  textPrimary: '#ffffff',
  textSecondary: 'rgba(255, 255, 255, 0.75)',
  textMuted: 'rgba(255, 255, 255, 0.5)',
  
  // Glassmorphism corporativo
  glass: 'rgba(18, 12, 19, 0.85)',
  glassBorder: 'rgba(252, 221, 56, 0.15)',
  glassHover: 'rgba(252, 221, 56, 0.08)',
};

// ============================================
// ANIMACIONES KEYFRAMES
// ============================================
const slideInPanel = keyframes`
  0% {
    opacity: 0;
    transform: translateX(100%);
    backdrop-filter: blur(0px);
  }
  100% {
    opacity: 1;
    transform: translateX(0);
    backdrop-filter: blur(20px);
  }
`;

const slideOutPanel = keyframes`
  0% {
    opacity: 1;
    transform: translateX(0);
  }
  100% {
    opacity: 0;
    transform: translateX(100%);
  }
`;

const fadeInUp = keyframes`
  0% {
    opacity: 0;
    transform: translateY(30px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
`;

const shimmer = keyframes`
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
`;

const pulse = keyframes`
  0%, 100% {
    opacity: 0.6;
  }
  50% {
    opacity: 1;
  }
`;

const floatAnimation = keyframes`
  0%, 100% {
    transform: translateY(0) rotate(0deg);
  }
  50% {
    transform: translateY(-10px) rotate(2deg);
  }
`;

// ============================================
// ESTILOS CORPORATIVOS ELEGANTES
// ============================================
const glassStyle = {
  background: `linear-gradient(145deg, ${COLORS.darkLight} 0%, ${COLORS.primary} 100%)`,
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  border: `1px solid ${COLORS.glassBorder}`,
  borderRadius: 2,
};

const glassCardStyle = {
  ...glassStyle,
  p: 3,
  transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
  cursor: 'default',
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '1px',
    background: `linear-gradient(90deg, transparent, ${alpha(COLORS.highlight, 0.3)}, transparent)`,
  },
  '&:hover': {
    background: `linear-gradient(145deg, ${COLORS.darkLighter} 0%, ${COLORS.darkLight} 100%)`,
    transform: 'translateX(6px)',
    borderColor: alpha(COLORS.highlight, 0.35),
    boxShadow: `0 12px 40px ${alpha(COLORS.primary, 0.6)}, 0 0 0 1px ${alpha(COLORS.highlight, 0.1)}`,
  },
};

// ============================================
// COMPONENTE PRINCIPAL: InfoPanel
// ============================================
const InfoPanel = ({ activePanel, onClose }) => {
  const [isClosing, setIsClosing] = useState(false);
  const [activeSection, setActiveSection] = useState(activePanel);
  const contentRef = useRef(null);

  useEffect(() => {
    if (activePanel) {
      setActiveSection(activePanel);
      setIsClosing(false);
    }
  }, [activePanel]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 300);
  };

  const handleSectionChange = (section) => {
    setActiveSection(section);
    if (contentRef.current) {
      contentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (!activePanel && !isClosing) return null;

  const panelContent = getPanelContent(activeSection);
  const sections = ['whatis', 'features', 'system'];

  return (
    <Box
      sx={{
        position: 'absolute',
        top: 0,
        right: 0,
        height: '100%',
        width: { xs: '100%', sm: '80%', md: '75%', lg: '70%' },
        minWidth: { md: '700px' },
        background: `linear-gradient(160deg, ${COLORS.darkLight} 0%, ${COLORS.primary} 40%, ${alpha(COLORS.primary, 0.98)} 100%)`,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        boxShadow: `-30px 0 80px ${alpha('#000', 0.7)}, inset 1px 0 0 ${alpha(COLORS.highlight, 0.1)}`,
        animation: `${isClosing ? slideOutPanel : slideInPanel} 0.45s cubic-bezier(0.4, 0, 0.2, 1) forwards`,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        zIndex: 100,
      }}
    >
      {/* Linea superior dorada corporativa */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: `linear-gradient(90deg, ${COLORS.primary}, ${COLORS.highlight}, ${COLORS.highlight}, ${COLORS.primary})`,
          backgroundSize: '200% 100%',
          animation: `${shimmer} 4s ease-in-out infinite`,
        }}
      />
      
      {/* Linea roja sutil debajo */}
      <Box
        sx={{
          position: 'absolute',
          top: '3px',
          left: 0,
          right: 0,
          height: '1px',
          background: `linear-gradient(90deg, transparent, ${alpha(COLORS.accent, 0.5)}, transparent)`,
        }}
      />

      {/* Header con navegacion - mas espacioso */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: { xs: 3, md: 5 },
          py: { xs: 2.5, md: 3.5 },
          borderBottom: `1px solid ${alpha(COLORS.highlight, 0.12)}`,
          background: `linear-gradient(180deg, ${alpha(COLORS.darkLight, 0.8)} 0%, transparent 100%)`,
        }}
      >
        {/* Navegación por secciones */}
        <Box sx={{ display: 'flex', gap: 1 }}>
          {sections.map((section, index) => (
            <NavigationPill
              key={section}
              section={section}
              isActive={activeSection === section}
              onClick={() => handleSectionChange(section)}
              index={index}
            />
          ))}
        </Box>

        {/* Boton cerrar corporativo */}
        <IconButton
          onClick={handleClose}
          sx={{
            color: COLORS.textSecondary,
            bgcolor: alpha(COLORS.darkLighter, 0.6),
            border: `1px solid ${alpha(COLORS.highlight, 0.15)}`,
            width: 48,
            height: 48,
            transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              bgcolor: COLORS.accent,
              borderColor: COLORS.accent,
              color: COLORS.white,
              transform: 'scale(1.08) rotate(90deg)',
              boxShadow: `0 0 30px ${alpha(COLORS.accent, 0.4)}`,
            },
          }}
        >
          <CloseIcon sx={{ fontSize: 22 }} />
        </IconButton>
      </Box>

      {/* Contenido principal - mas amplio y espacioso */}
      <Box
        ref={contentRef}
        sx={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          px: { xs: 3, md: 5, lg: 6 },
          py: { xs: 4, md: 5 },
          position: 'relative',
          // Scrollbar elegante corporativo
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: alpha(COLORS.darkLighter, 0.5),
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-thumb': {
            background: `linear-gradient(180deg, ${COLORS.highlight}, ${alpha(COLORS.highlight, 0.6)})`,
            borderRadius: '4px',
            border: `2px solid ${COLORS.primary}`,
            '&:hover': {
              background: COLORS.highlight,
            },
          },
        }}
      >
        {/* Titulo corporativo grande */}
        <Box
          key={activeSection}
          sx={{
            animation: `${fadeInUp} 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards`,
            mb: { xs: 4, md: 5 },
          }}
        >
          <Typography
            variant="h3"
            sx={{
              color: COLORS.textPrimary,
              fontWeight: 700,
              letterSpacing: '-0.5px',
              fontSize: { xs: '1.75rem', md: '2.25rem', lg: '2.5rem' },
              position: 'relative',
              display: 'inline-block',
              '&::after': {
                content: '""',
                position: 'absolute',
                bottom: -16,
                left: 0,
                width: '80px',
                height: '4px',
                background: `linear-gradient(90deg, ${COLORS.highlight}, ${alpha(COLORS.highlight, 0.3)})`,
                borderRadius: '2px',
              },
            }}
          >
            {panelContent.title}
          </Typography>
          {/* Linea roja sutil debajo del titulo */}
          <Box
            sx={{
              position: 'absolute',
              left: 0,
              bottom: -20,
              width: '40px',
              height: '2px',
              background: alpha(COLORS.accent, 0.4),
              borderRadius: '1px',
            }}
          />
        </Box>

        {/* Contenido dinámico */}
        <Box
          key={`content-${activeSection}`}
          sx={{
            animation: `${fadeInUp} 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.1s forwards`,
            opacity: 0,
          }}
        >
          {panelContent.content}
        </Box>
      </Box>

      {/* Footer corporativo elegante */}
      <Box
        sx={{
          position: 'relative',
          px: { xs: 3, md: 5 },
          py: { xs: 2.5, md: 3 },
          borderTop: `1px solid ${alpha(COLORS.highlight, 0.1)}`,
          background: `linear-gradient(0deg, ${alpha(COLORS.darkLight, 0.6)} 0%, transparent 100%)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              bgcolor: COLORS.highlight,
              boxShadow: `0 0 10px ${alpha(COLORS.highlight, 0.5)}`,
            }}
          />
          <Typography
            variant="body2"
            sx={{
              color: COLORS.textMuted,
              letterSpacing: '0.5px',
              fontWeight: 500,
            }}
          >
            Handler TrackSamples
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: COLORS.highlight,
              fontWeight: 600,
              px: 1.5,
              py: 0.5,
              bgcolor: alpha(COLORS.highlight, 0.1),
              borderRadius: 1,
              border: `1px solid ${alpha(COLORS.highlight, 0.2)}`,
            }}
          >
            v1.0
          </Typography>
        </Box>
        
        <Box
          component="img"
          src="/logo.png"
          alt="Handler Logo"
          sx={{
            height: 45,
            opacity: 0.25,
            filter: 'brightness(1.2)',
            transition: 'all 0.35s ease',
            '&:hover': {
              opacity: 0.5,
              transform: 'scale(1.05)',
            },
          }}
          onError={(e) => { e.target.style.display = 'none'; }}
        />
      </Box>

      {/* Logo marca de agua flotante grande */}
      <Box
        component="img"
        src="/logo.png"
        alt=""
        sx={{
          position: 'absolute',
          bottom: 100,
          right: 30,
          height: 280,
          opacity: 0.03,
          pointerEvents: 'none',
          filter: 'brightness(1.5)',
          animation: `${floatAnimation} 8s ease-in-out infinite`,
        }}
        onError={(e) => { e.target.style.display = 'none'; }}
      />
    </Box>
  );
};

// ============================================
// COMPONENTE: NavigationPill
// ============================================
const NavigationPill = ({ section, isActive, onClick, index }) => {
  const icons = {
    whatis: <InfoOutlinedIcon sx={{ fontSize: 20 }} />,
    features: <FeaturedPlayListOutlinedIcon sx={{ fontSize: 20 }} />,
    system: <SettingsSuggestOutlinedIcon sx={{ fontSize: 20 }} />,
  };

  const labels = {
    whatis: 'Informacion',
    features: 'Caracteristicas',
    system: 'Sistema',
  };

  return (
    <Box
      onClick={onClick}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        px: { xs: 2, md: 3 },
        py: { xs: 1, md: 1.5 },
        borderRadius: 1.5,
        cursor: 'pointer',
        transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
        background: isActive 
          ? `linear-gradient(135deg, ${alpha(COLORS.highlight, 0.15)} 0%, ${alpha(COLORS.highlight, 0.05)} 100%)`
          : 'transparent',
        border: `1px solid ${isActive ? alpha(COLORS.highlight, 0.35) : alpha(COLORS.textMuted, 0.1)}`,
        color: isActive ? COLORS.highlight : COLORS.textMuted,
        animation: `${fadeInUp} 0.4s cubic-bezier(0.4, 0, 0.2, 1) ${index * 0.1}s forwards`,
        opacity: 0,
        position: 'relative',
        overflow: 'hidden',
        // Indicador rojo sutil cuando activo
        '&::after': isActive ? {
          content: '""',
          position: 'absolute',
          bottom: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '60%',
          height: '2px',
          background: COLORS.accent,
          borderRadius: '2px 2px 0 0',
        } : {},
        '&:hover': {
          background: isActive 
            ? `linear-gradient(135deg, ${alpha(COLORS.highlight, 0.2)} 0%, ${alpha(COLORS.highlight, 0.08)} 100%)`
            : alpha(COLORS.darkLighter, 0.8),
          color: isActive ? COLORS.highlight : COLORS.textPrimary,
          borderColor: isActive ? alpha(COLORS.highlight, 0.5) : alpha(COLORS.highlight, 0.15),
        },
      }}
    >
      {icons[section]}
      <Typography
        variant="body2"
        sx={{
          fontWeight: isActive ? 600 : 500,
          fontSize: { xs: '0.8rem', md: '0.9rem' },
          display: { xs: 'none', sm: 'block' },
          letterSpacing: '0.3px',
        }}
      >
        {labels[section]}
      </Typography>
    </Box>
  );
};

// ============================================
// FUNCIÓN: getPanelContent
// ============================================
const getPanelContent = (panelType) => {
  const contentMap = {
    whatis: {
      title: '¿Qué es Händler TrackSamples?',
      content: <WhatIsContent />,
    },
    features: {
      title: 'Características Principales',
      content: <FeaturesContent />,
    },
    system: {
      title: 'Sistema de Gestión',
      content: <SystemContent />,
    },
  };

  return contentMap[panelType] || { title: '', content: null };
};

// ============================================
// CONTENIDO: WhatIsContent
// ============================================
const WhatIsContent = () => (
  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
    <Typography 
      variant="body1" 
      sx={{ 
        color: COLORS.textPrimary, 
        lineHeight: 2,
        fontSize: { xs: '1rem', md: '1.15rem' },
      }}
    >
      <Box component="span" sx={{ color: COLORS.highlight, fontWeight: 700 }}>
        Handler TrackSamples
      </Box>{' '}
      es una aplicacion de escritorio diseñada especificamente para optimizar la gestion, 
      control y localizacion fisica del inventario de muestras de materias primas en Handler S.A.S.
    </Typography>
    
    <Typography 
      variant="body1" 
      sx={{ 
        color: COLORS.textSecondary, 
        lineHeight: 2,
        fontSize: { xs: '0.95rem', md: '1.05rem' },
      }}
    >
      Este sistema funciona como una herramienta de apoyo local, paralela al ERP-SAP de la compania, 
      permitiendo gestionar el inventario de muestras sin afectar los registros legales ni contables.
    </Typography>

    <HighlightBox
      title="Objetivo Principal"
      accentColor={COLORS.highlight}
    >
      <Typography 
        variant="body1" 
        sx={{ 
          color: COLORS.textSecondary, 
          lineHeight: 1.9,
          fontSize: { xs: '0.95rem', md: '1rem' },
        }}
      >
        Resolver la perdida de tiempo en la busqueda de muestras fisicas en bodega y organizar 
        el acceso a los Certificados de Analisis (CoA) mediante una interfaz centralizada.
      </Typography>
    </HighlightBox>

    <Box sx={{ display: 'flex', gap: 3, mt: 2, flexWrap: 'wrap' }}>
      <StatCard value="100%" label="Local" color={COLORS.highlight} />
      <StatCard value="MySQL" label="Database" color={COLORS.accent} />
      <StatCard value="Real-time" label="Tracking" color={COLORS.highlight} />
    </Box>
  </Box>
);

// ============================================
// CONTENIDO: FeaturesContent
// ============================================
const FeaturesContent = () => {
  const features = [
    {
      title: 'Gestion de Catalogo y Lotes',
      description: 'Registro completo de muestras con codigo, descripcion tecnica, proveedor, lote y certificado CoA.',
      color: COLORS.highlight,
    },
    {
      title: 'Verificacion de Compatibilidades',
      description: 'Sistema de seguridad que verifica compatibilidades quimicas antes de asignar ubicaciones.',
      color: COLORS.accent,
    },
    {
      title: 'Localizacion Visual',
      description: 'Mapa visual de bodega con codificacion por colores por linea de negocio.',
      color: COLORS.highlight,
    },
    {
      title: 'Generacion de Etiquetas',
      description: 'Impresion de etiquetas de alistamiento con codigo QR y ubicacion estructurada.',
      color: COLORS.accent,
    },
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {features.map((feature, index) => (
        <FeatureCard key={index} {...feature} index={index} />
      ))}
    </Box>
  );
};

// ============================================
// CONTENIDO: SystemContent
// ============================================
const SystemContent = () => (
  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
    <Typography 
      variant="body1" 
      sx={{ 
        color: COLORS.textPrimary, 
        lineHeight: 2,
        fontSize: { xs: '1rem', md: '1.1rem' },
      }}
    >
      <Box component="span" sx={{ color: COLORS.highlight, fontWeight: 700 }}>
        Handler TrackSamples
      </Box>{' '}
      esta diseñado para un usuario operativo principal: el Responsable de Recepcion de Muestras.
    </Typography>

    <Typography 
      variant="body1" 
      sx={{ 
        color: COLORS.textSecondary, 
        lineHeight: 2,
        fontSize: { xs: '0.95rem', md: '1.05rem' },
      }}
    >
      El sistema utiliza una base de datos MySQL en un servidor local (intranet de la empresa) 
      para garantizar la seguridad e integridad de la informacion.
    </Typography>

    <BusinessLinesSection />

    <HighlightBox
      title="Requisitos Tecnicos"
      accentColor={COLORS.accent}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <RequirementItem label="Sistema Operativo" value="Windows 10/11 Pro" />
        <RequirementItem label="Base de Datos" value="MySQL 8.0+" />
        <RequirementItem label="Red" value="Intranet corporativa" />
        <RequirementItem label="Framework" value="Electron + React" />
      </Box>
    </HighlightBox>
  </Box>
);

// ============================================
// COMPONENTES AUXILIARES
// ============================================

const HighlightBox = ({ title, children, accentColor = COLORS.highlight }) => (
  <Box
    sx={{
      ...glassCardStyle,
      borderLeft: `4px solid ${accentColor}`,
      borderRadius: '0 8px 8px 0',
      p: { xs: 3, md: 4 },
      '&:hover': {
        ...glassCardStyle['&:hover'],
        borderLeftColor: accentColor,
      },
    }}
  >
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2.5 }}>
      <Box
        sx={{
          width: 10,
          height: 10,
          borderRadius: '50%',
          bgcolor: accentColor,
          boxShadow: `0 0 15px ${alpha(accentColor, 0.5)}`,
        }}
      />
      <Typography 
        variant="h6" 
        sx={{ 
          color: accentColor, 
          fontWeight: 700,
          letterSpacing: '0.3px',
          fontSize: { xs: '1rem', md: '1.15rem' },
        }}
      >
        {title}
      </Typography>
    </Box>
    {children}
  </Box>
);

const FeatureCard = ({ title, description, color, index }) => (
  <Box
    sx={{
      ...glassCardStyle,
      animation: `${fadeInUp} 0.5s cubic-bezier(0.4, 0, 0.2, 1) ${index * 0.12}s forwards`,
      opacity: 0,
      position: 'relative',
      pl: 4,
      py: { xs: 3, md: 3.5 },
      '&::before': {
        content: '""',
        position: 'absolute',
        left: 0,
        top: '50%',
        transform: 'translateY(-50%)',
        width: '5px',
        height: '50%',
        background: `linear-gradient(180deg, ${color}, ${alpha(color, 0.2)})`,
        borderRadius: '3px',
        transition: 'all 0.35s ease',
      },
      '&:hover::before': {
        height: '75%',
        boxShadow: `0 0 20px ${alpha(color, 0.4)}`,
      },
    }}
  >
    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2.5 }}>
      {/* Numero de caracteristica */}
      <Box
        sx={{
          minWidth: 36,
          height: 36,
          borderRadius: 1,
          bgcolor: alpha(color, 0.15),
          border: `1px solid ${alpha(color, 0.3)}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Typography
          sx={{
            color: color,
            fontWeight: 700,
            fontSize: '0.9rem',
          }}
        >
          {String(index + 1).padStart(2, '0')}
        </Typography>
      </Box>
      <Box sx={{ flex: 1 }}>
        <Typography 
          variant="h6" 
          sx={{ 
            color: COLORS.textPrimary, 
            fontWeight: 600,
            mb: 1,
            fontSize: { xs: '1rem', md: '1.1rem' },
          }}
        >
          {title}
        </Typography>
        <Typography 
          variant="body2" 
          sx={{ 
            color: COLORS.textSecondary,
            lineHeight: 1.8,
            fontSize: { xs: '0.9rem', md: '0.95rem' },
          }}
        >
          {description}
        </Typography>
      </Box>
    </Box>
  </Box>
);

const StatCard = ({ value, label, color = COLORS.highlight }) => (
  <Box
    sx={{
      flex: 1,
      minWidth: 120,
      textAlign: 'center',
      p: { xs: 2.5, md: 3 },
      ...glassStyle,
      border: `1px solid ${alpha(color, 0.2)}`,
      transition: 'all 0.35s ease',
      '&:hover': {
        background: alpha(color, 0.08),
        transform: 'translateY(-6px)',
        borderColor: alpha(color, 0.4),
        boxShadow: `0 15px 40px ${alpha(COLORS.primary, 0.5)}`,
      },
    }}
  >
    <Typography 
      variant="h5" 
      sx={{ 
        color: color, 
        fontWeight: 700,
        fontSize: { xs: '1.2rem', md: '1.4rem' },
        mb: 0.5,
      }}
    >
      {value}
    </Typography>
    <Typography 
      variant="caption" 
      sx={{ 
        color: COLORS.textMuted,
        textTransform: 'uppercase',
        letterSpacing: '1.5px',
        fontSize: { xs: '0.65rem', md: '0.7rem' },
        fontWeight: 500,
      }}
    >
      {label}
    </Typography>
  </Box>
);

const BusinessLinesSection = () => (
  <Box sx={{ mt: 2 }}>
    <Typography 
      variant="subtitle1" 
      sx={{ 
        color: COLORS.highlight, 
        fontWeight: 700, 
        mb: 3,
        letterSpacing: '0.3px',
        fontSize: { xs: '0.95rem', md: '1.05rem' },
      }}
    >
      Lineas de Negocio Soportadas
    </Typography>
    <Box sx={{ display: 'flex', gap: 2.5, flexWrap: 'wrap' }}>
      <LineBadge color={COLORS.highlight} label="C">Cosmetica</LineBadge>
      <LineBadge color={COLORS.accent} label="I">Industrial</LineBadge>
      <LineBadge color={COLORS.highlight} label="F">Farmacologica</LineBadge>
    </Box>
  </Box>
);

const LineBadge = ({ color, label, children }) => (
  <Box
    sx={{
      display: 'flex',
      alignItems: 'center',
      gap: 1.5,
      px: 2.5,
      py: 1.5,
      background: `linear-gradient(135deg, ${alpha(color, 0.12)} 0%, ${alpha(color, 0.05)} 100%)`,
      border: `1px solid ${alpha(color, 0.25)}`,
      borderRadius: 1.5,
      transition: 'all 0.35s ease',
      cursor: 'default',
      '&:hover': {
        background: `linear-gradient(135deg, ${alpha(color, 0.2)} 0%, ${alpha(color, 0.1)} 100%)`,
        transform: 'translateY(-3px)',
        borderColor: alpha(color, 0.5),
        boxShadow: `0 8px 25px ${alpha(COLORS.primary, 0.5)}`,
      },
    }}
  >
    <Box
      sx={{
        width: 28,
        height: 28,
        borderRadius: '50%',
        bgcolor: alpha(color, 0.2),
        border: `2px solid ${color}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: color }}>
        {label}
      </Typography>
    </Box>
    <Typography 
      variant="body2" 
      sx={{ 
        color: COLORS.textPrimary,
        fontWeight: 500,
        fontSize: '0.9rem',
      }}
    >
      {children}
    </Typography>
  </Box>
);

const RequirementItem = ({ label, value }) => (
  <Box 
    sx={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center',
      py: 1,
      borderBottom: `1px solid ${alpha(COLORS.highlight, 0.08)}`,
      '&:last-child': {
        borderBottom: 'none',
      },
    }}
  >
    <Typography 
      variant="body2" 
      sx={{ 
        color: COLORS.textMuted,
        fontSize: { xs: '0.85rem', md: '0.9rem' },
      }}
    >
      {label}
    </Typography>
    <Typography 
      variant="body2" 
      sx={{ 
        color: COLORS.textPrimary,
        fontWeight: 600,
        fontSize: { xs: '0.85rem', md: '0.9rem' },
        px: 2,
        py: 0.75,
        bgcolor: alpha(COLORS.darkLighter, 0.8),
        border: `1px solid ${alpha(COLORS.highlight, 0.15)}`,
        borderRadius: 1,
      }}
    >
      {value}
    </Typography>
  </Box>
);

export default InfoPanel;

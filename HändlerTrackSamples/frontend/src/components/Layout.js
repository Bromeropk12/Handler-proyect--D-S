import React, { useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
  useTheme,
  useMediaQuery,
  alpha,
} from '@mui/material';
import { keyframes } from '@mui/system';
import {
  Menu as MenuIcon,
  VpnKey as PasswordIcon,
  ExitToApp,
  PhotoCamera,
  Home,
  Inventory2 as InventoryIcon,
  Science as ScienceIcon,
  LocalShipping as ShippingIcon,
  Warning as WarningIcon,
  Settings as SettingsIcon,
  Business as BusinessIcon,
  Warehouse as WarehouseIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

// Animación de pulso
const pulse = keyframes`
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(123, 31, 162, 0.4);
  }
  50% {
    box-shadow: 0 0 0 8px rgba(123, 31, 162, 0);
  }
`;

// Colores de marca
const COLORS = {
  primary: '#7b1fa2',
  primaryLight: '#9c27b0',
  primaryDark: '#6a1b9a',
  gold: '#fcdd38',
};

const DRAWER_WIDTH = 280;

// Menú del sidebar con iconos mejorados
const menuItems = [
  { 
    text: 'Muestras', 
    icon: <InventoryIcon />, 
    path: '/muestras',
    color: '#0288d1',
  },
  {
    text: 'Proveedores', 
    icon: <BusinessIcon />, 
    path: '/proveedores',
    color: '#7b1fa2',
  },
  { 
    text: 'Almacén', 
    icon: <WarehouseIcon />, 
    path: '/almacen',
    color: '#f57c00',
  },
];

// Menú de herramientas (futuro)
const futureMenuItems = [
  { 
    text: 'Entrada de Muestras', 
    icon: <AddIcon />, 
    path: '/entrada-muestra',
    color: '#388e3c',
  },
  { 
    text: 'Movimientos', 
    icon: <ShippingIcon />, 
    path: '/movimientos',
    color: '#f57c00',
  },
  { 
    text: 'Compatibilidad', 
    icon: <ScienceIcon />, 
    path: '/compatibility',
    color: '#388e3c',
    disabled: true,
  },
  { 
    text: 'Alertas', 
    icon: <WarningIcon />, 
    path: '/alerts',
    color: '#d32f2f',
    disabled: true,
  },
];

const Layout = ({ children }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorElUser, setAnchorElUser] = useState(null);
  const [profileImage, setProfileImage] = useState(() => {
    const savedImage = localStorage.getItem('userProfileImage');
    return savedImage || null;
  });
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleUserMenu = (event) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const handleLogout = () => {
    handleCloseUserMenu();
    logout();
    navigate('/login');
  };

  const handleChangePassword = () => {
    handleCloseUserMenu();
    navigate('/change-password');
  };

  const handleProfileClick = () => {
    handleCloseUserMenu();
    fileInputRef.current?.click();
  };

  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64Image = e.target.result;
        setProfileImage(base64Image);
        localStorage.setItem('userProfileImage', base64Image);
      };
      reader.readAsDataURL(file);
    }
  };

  const MenuItemComponent = ({ item }) => (
    <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
      <ListItemButton
        selected={location.pathname === item.path}
        disabled={item.disabled}
        onClick={() => {
          if (!item.disabled) {
            navigate(item.path);
            if (isMobile) setMobileOpen(false);
          }
        }}
        sx={{
          borderRadius: 2.5,
          mx: 1,
          py: 1.2,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&.Mui-selected': {
            background: `linear-gradient(135deg, ${alpha(item.color, 0.15)} 0%, ${alpha(item.color, 0.08)} 100%)`,
            borderLeft: `3px solid ${item.color}`,
            '&:hover': {
              background: `linear-gradient(135deg, ${alpha(item.color, 0.2)} 0%, ${alpha(item.color, 0.1)} 100%)`,
            },
            '& .MuiListItemIcon-root': {
              color: item.color,
            },
            '& .MuiListItemText-primary': {
              fontWeight: 600,
              color: item.color,
            },
          },
          '&:hover': {
            background: alpha(item.color, 0.05),
            transform: 'translateX(4px)',
          },
        }}
      >
        <ListItemIcon sx={{ 
          minWidth: 44,
          color: item.disabled ? 'text.disabled' : 'text.secondary',
        }}>
          {item.icon}
        </ListItemIcon>
        <ListItemText 
          primary={item.text}
          primaryTypographyProps={{
            fontSize: '0.9rem',
            fontWeight: 500,
          }}
        />
        {item.disabled && (
          <Box
            sx={{
              px: 1,
              py: 0.25,
              borderRadius: 1,
              bgcolor: alpha('#999', 0.1),
            }}
          >
            <Typography variant="caption" sx={{ fontSize: '0.65rem', color: 'text.disabled' }}>
              Pronto
            </Typography>
          </Box>
        )}
      </ListItemButton>
    </ListItem>
  );

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#fafafa' }}>
      {/* Logo y marca */}
      <Box 
        sx={{ 
          px: 2,
          display: 'flex', 
          alignItems: 'center', 
          gap: 1.5,
          cursor: 'pointer',
          background: `linear-gradient(135deg, ${alpha(COLORS.primary, 0.03)} 0%, transparent 100%)`,
          borderBottom: `1px solid ${alpha(COLORS.primary, 0.08)}`,
          transition: 'all 0.3s ease',
          height: 64,
          boxSizing: 'border-box',
          '&:hover': { 
            bgcolor: alpha(COLORS.primary, 0.08),
          }
        }}
        onClick={() => navigate('/')}
      >
        <Box
          component="img"
          src="/Logo-Handler.png"
          alt="Händler Logo"
          sx={{ 
            width: 'auto', 
            height: 40, 
            objectFit: 'contain',
            flexShrink: 0,
          }}
          onError={(e) => { 
            // Si la imagen no carga, mostrar texto de respaldo
            e.target.style.display = 'none'; 
            e.target.nextSibling.style.display = 'block';
          }}
        />
        {/* Texto de respaldo si la imagen no carga */}
        <Box sx={{ display: 'none', alignItems: 'center', gap: 1 }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: 1.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primaryLight} 100%)`,
              boxShadow: `0 2px 8px ${alpha(COLORS.primary, 0.3)}`,
              flexShrink: 0,
            }}
          >
            <Typography sx={{ color: 'white', fontWeight: 800, fontSize: '1rem', lineHeight: 1 }}>
              H
            </Typography>
          </Box>
          <Typography 
            variant="h6" 
            sx={{ 
              fontWeight: 700, 
              fontSize: '1rem',
              background: `linear-gradient(135deg, ${COLORS.primaryDark} 0%, ${COLORS.primary} 100%)`,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Händler
          </Typography>
        </Box>
      </Box>
      
      {/* Sección principal */}
      <Box sx={{ pt: 2 }}>
        <Typography 
          variant="caption" 
          sx={{ 
            px: 3, 
            color: 'text.disabled', 
            fontWeight: 600,
            fontSize: '0.65rem',
            letterSpacing: '1px',
            textTransform: 'uppercase',
          }}
        >
          Menú Principal
        </Typography>
        <List sx={{ mt: 0.5 }}>
          {menuItems.map((item) => (
            <MenuItemComponent key={item.text} item={item} />
          ))}
        </List>
      </Box>

      <Divider sx={{ mx: 2, my: 1, opacity: 0.5 }} />
      
      {/* Sección de herramientas */}
      <Box sx={{ flexGrow: 1 }}>
        <Typography 
          variant="caption" 
          sx={{ 
            px: 3, 
            color: 'text.disabled', 
            fontWeight: 600,
            fontSize: '0.65rem',
            letterSpacing: '1px',
            textTransform: 'uppercase',
          }}
        >
          Módulos
        </Typography>
        <List sx={{ mt: 0.5 }}>
          {futureMenuItems.map((item) => (
            <MenuItemComponent key={item.text} item={item} />
          ))}
        </List>
      </Box>

      <Divider sx={{ mx: 2, opacity: 0.5 }} />
      
      {/* Usuario */}
      <Box sx={{ p: 2 }}>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImageChange}
          accept="image/*"
          style={{ display: 'none' }}
        />
        <Box
          onClick={handleUserMenu}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            p: 1.5,
            borderRadius: 2.5,
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            background: `linear-gradient(135deg, ${alpha(COLORS.primary, 0.04)} 0%, ${alpha(COLORS.primary, 0.01)} 100%)`,
            border: `1px solid ${alpha(COLORS.primary, 0.08)}`,
            '&:hover': {
              background: `linear-gradient(135deg, ${alpha(COLORS.primary, 0.08)} 0%, ${alpha(COLORS.primary, 0.03)} 100%)`,
              borderColor: alpha(COLORS.primary, 0.15),
              transform: 'scale(1.02)',
            },
          }}
        >
          <Avatar
            src={profileImage || undefined}
            sx={{ 
              bgcolor: COLORS.primary, 
              width: 44, 
              height: 44,
              boxShadow: `0 4px 12px ${alpha(COLORS.primary, 0.25)}`,
              animation: `${pulse} 3s ease-in-out infinite`,
            }}
          >
            {user?.full_name?.charAt(0) || 'U'}
          </Avatar>
          <Box sx={{ overflow: 'hidden', textAlign: 'left', flexGrow: 1 }}>
            <Typography 
              variant="subtitle2" 
              noWrap 
              sx={{ 
                fontWeight: 700,
                fontSize: '0.9rem',
                color: '#1a1a1a',
              }}
            >
              {user?.full_name || 'Usuario'}
            </Typography>
            <Typography 
              variant="caption" 
              noWrap 
              sx={{ 
                color: COLORS.primary,
                fontWeight: 500,
                fontSize: '0.7rem',
                textTransform: 'capitalize',
              }}
            >
              {user?.role || 'Operador'}
            </Typography>
          </Box>
          <SettingsIcon sx={{ color: 'text.disabled', fontSize: 20 }} />
        </Box>

        {/* Menú de usuario */}
        <Menu
          anchorEl={anchorElUser}
          open={Boolean(anchorElUser)}
          onClose={handleCloseUserMenu}
          anchorOrigin={{
            vertical: 'top',
            horizontal: 'left',
          }}
          transformOrigin={{
            vertical: 'bottom',
            horizontal: 'left',
          }}
          PaperProps={{
            sx: {
              mt: 1,
              borderRadius: 2,
              boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
              border: `1px solid ${alpha(COLORS.primary, 0.1)}`,
            }
          }}
        >
          <MenuItem onClick={handleProfileClick}>
            <ListItemIcon>
              <PhotoCamera fontSize="small" sx={{ color: COLORS.primary }} />
            </ListItemIcon>
            Cambiar Foto de Perfil
          </MenuItem>
          <MenuItem onClick={handleChangePassword}>
            <ListItemIcon>
              <PasswordIcon fontSize="small" sx={{ color: '#388e3c' }} />
            </ListItemIcon>
            Cambiar Contraseña
          </MenuItem>
          <Divider />
          <MenuItem onClick={handleLogout}>
            <ListItemIcon>
              <ExitToApp fontSize="small" sx={{ color: '#d32f2f' }} />
            </ListItemIcon>
            <Typography sx={{ color: '#d32f2f', fontWeight: 500 }}>
              Cerrar Sesión
            </Typography>
          </MenuItem>
        </Menu>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f5f5f5' }}>
      {/* AppBar */}
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { md: `${DRAWER_WIDTH}px` },
          bgcolor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          color: 'text.primary',
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          borderBottom: `1px solid ${alpha(COLORS.primary, 0.08)}`,
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          
          <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}>
            <Typography 
              variant="h6" 
              noWrap 
              component="div" 
              sx={{ 
                fontWeight: 700,
                fontSize: '1rem',
                color: '#1a1a1a',
              }}
            >
              TrackSamples
            </Typography>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Drawer */}
      <Box
        component="nav"
        sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}
      >
        {/* Mobile drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: DRAWER_WIDTH,
              borderRight: 'none',
              boxShadow: '4px 0 24px rgba(0,0,0,0.15)',
            },
          }}
        >
          {drawer}
        </Drawer>
        
        {/* Desktop drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: DRAWER_WIDTH,
              borderRight: `1px solid ${alpha(COLORS.primary, 0.08)}`,
              boxShadow: '4px 0 24px rgba(0,0,0,0.04)',
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Contenido principal */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          mt: '64px',
          bgcolor: '#f5f5f5',
          minHeight: 'calc(100vh - 64px)',
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default Layout;

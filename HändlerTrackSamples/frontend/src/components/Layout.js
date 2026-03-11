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
} from '@mui/material';
import {
  Menu as MenuIcon,
  VpnKey as PasswordIcon,
  ExitToApp,
  PhotoCamera,
  Home,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

const DRAWER_WIDTH = 260;

// Menú del sidebar
const menuItems = [
  { text: 'Home', icon: <Home />, path: '/' },
  { text: 'Cambiar Contraseña', icon: <PasswordIcon />, path: '/change-password' },
];

const Layout = ({ children }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorElUser, setAnchorElUser] = useState(null);
  const [profileImage, setProfileImage] = useState(() => {
    // Cargar imagen de perfil desde localStorage al iniciar
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
        // Guardar en localStorage para persistencia
        localStorage.setItem('userProfileImage', base64Image);
      };
      reader.readAsDataURL(file);
    }
  };

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Logo */}
      <Box 
        sx={{ 
          p: 2, 
          display: 'flex', 
          alignItems: 'center', 
          gap: 2,
          cursor: 'pointer',
          '&:hover': { bgcolor: 'action.hover' }
        }}
        onClick={() => navigate('/')}
      >
        <Box
          component="img"
          src="/Logo-Handler.png"
          alt="Händler Logo"
          sx={{ width: 45, height: 45, objectFit: 'contain' }}
          onError={(e) => { e.target.style.display = 'none'; }}
        />
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem' }}>
            Händler
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', lineHeight: 1.2, fontSize: '0.7rem' }}>
            TrackSamples
          </Typography>
        </Box>
      </Box>
      
      <Divider />
      
      {/* Menú simplificado */}
      <List sx={{ flexGrow: 1, px: 1, py: 2 }}>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => {
                navigate(item.path);
                if (isMobile) setMobileOpen(false);
              }}
              sx={{
                borderRadius: 2,
                '&.Mui-selected': {
                  bgcolor: 'primary.light',
                  color: 'white',
                  '&:hover': { bgcolor: 'primary.main' },
                  '& .MuiListItemIcon-root': { color: 'white' },
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      <Divider />
      
      {/* Usuario - Ahora es un botón que despliega menú */}
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
            p: 1,
            borderRadius: 2,
            cursor: 'pointer',
            transition: 'background-color 0.2s',
            '&:hover': {
              bgcolor: 'action.hover',
            },
          }}
        >
          <Avatar
            src={profileImage || undefined}
            sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}
          >
            {user?.full_name?.charAt(0) || 'U'}
          </Avatar>
          <Box sx={{ overflow: 'hidden', textAlign: 'left' }}>
            <Typography variant="subtitle2" noWrap sx={{ fontWeight: 600 }}>
              {user?.full_name || 'Usuario'}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              {user?.role || 'Operador'}
            </Typography>
          </Box>
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
        >
          <MenuItem onClick={handleProfileClick}>
            <ListItemIcon>
              <PhotoCamera fontSize="small" />
            </ListItemIcon>
            Cambiar Foto de Perfil
          </MenuItem>
          <MenuItem onClick={handleChangePassword}>
            <ListItemIcon>
              <PasswordIcon fontSize="small" />
            </ListItemIcon>
            Cambiar Contraseña
          </MenuItem>
          <Divider />
          <MenuItem onClick={handleLogout}>
            <ListItemIcon>
              <ExitToApp fontSize="small" />
            </ListItemIcon>
            Cerrar Sesión
          </MenuItem>
        </Menu>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* AppBar */}
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { md: `${DRAWER_WIDTH}px` },
          bgcolor: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(20px)',
          color: 'text.primary',
          boxShadow: 1,
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
          
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Händler TrackSamples
          </Typography>
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
              borderRight: '1px solid',
              borderColor: 'divider',
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
          bgcolor: 'background.default',
          minHeight: 'calc(100vh - 64px)',
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default Layout;

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline, Box, CircularProgress } from '@mui/material';

// Context
import { AuthProvider, useAuth } from './context/AuthContext';
import { SamplesProvider } from './context/SamplesContext';

// Componentes
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Samples from './pages/Samples';
import SampleDetail from './pages/SampleDetail';
import Movements from './pages/Movements';
import Compatibility from './pages/Compatibility';
import Import from './pages/Import';
import Layout from './components/Layout';

// Tema personalizado estilo Fluent Design (Windows 11)
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#7b1fa2',
      light: '#9c27b0',
      dark: '#6a1b9a',
    },
    secondary: {
      main: '#388e3c',
      light: '#4caf50',
      dark: '#2e7d32',
    },
    info: {
      main: '#0288d1',
      light: '#1976d2',
      dark: '#01579b',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
    // Colores por línea de negocio
    businessLine: {
      cosmetics: '#9c27b0',  // Morado - Cosmética
      industrial: '#1976d2',  // Azul - Industrial
      pharma: '#2e7d32',      // Verde - Farma
    }
  },
  typography: {
    fontFamily: '"Segoe UI Variable", "Segoe UI", "Helvetica", "Arial", sans-serif',
    h1: { fontSize: '2.5rem', fontWeight: 500 },
    h2: { fontSize: '2rem', fontWeight: 500 },
    h3: { fontSize: '1.75rem', fontWeight: 500 },
  },
  shape: {
    borderRadius: 8, // Windows 11 estilo
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
});

// Componente de carga
const Loading = () => (
  <Box sx={{ 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    minHeight: '100vh' 
  }}>
    <CircularProgress />
  </Box>
);

// Componente para rutas protegidas
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <Loading />;
  if (!isAuthenticated) return <Navigate to="/login" />;
  
  return children;
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <SamplesProvider>
          <Router>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route 
                path="/*" 
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/samples" element={<Samples />} />
                        <Route path="/samples/:id" element={<SampleDetail />} />
                        <Route path="/movements" element={<Movements />} />
                        <Route path="/compatibility" element={<Compatibility />} />
                        <Route path="/import" element={<Import />} />
                      </Routes>
                    </Layout>
                  </ProtectedRoute>
                } 
              />
            </Routes>
          </Router>
        </SamplesProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;

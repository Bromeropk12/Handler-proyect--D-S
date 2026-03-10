import React, { useEffect, useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress,
} from '@mui/material';
import {
  Inventory as SamplesIcon,
  SwapHoriz as MovementsIcon,
  Warning as WarningIcon,
  CheckCircle as AvailableIcon,
} from '@mui/icons-material';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { useSamples } from '../context/SamplesContext';

const Dashboard = () => {
  const { samples, loading, fetchSamples } = useSamples();
  const [stats, setStats] = useState({
    total: 0,
    available: 0,
    depleted: 0,
    quarantine: 0,
    byLine: []
  });

  useEffect(() => {
    fetchSamples();
  }, [fetchSamples]);

  useEffect(() => {
    if (samples.length > 0) {
      const available = samples.filter(s => s.status === 'available').length;
      const depleted = samples.filter(s => s.status === 'depleted').length;
      const quarantine = samples.filter(s => s.status === 'quarantine').length;

      // Agrupar por línea de negocio
      const lines = {};
      samples.forEach(s => {
        lines[s.business_line] = (lines[s.business_line] || 0) + 1;
      });
      
      const byLine = Object.entries(lines).map(([name, value]) => ({ name, value }));

      setStats({
        total: samples.length,
        available,
        depleted,
        quarantine,
        byLine
      });
    }
  }, [samples]);

  const COLORS = ['#9c27b0', '#1976d2', '#2e7d32'];

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Dashboard
      </Typography>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ bgcolor: 'primary.light', p: 1.5, borderRadius: 2 }}>
                  <SamplesIcon sx={{ color: 'white', fontSize: 28 }} />
                </Box>
                <Box>
                  <Typography variant="h4">{stats.total}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Muestras
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ bgcolor: 'success.main', p: 1.5, borderRadius: 2 }}>
                  <AvailableIcon sx={{ color: 'white', fontSize: 28 }} />
                </Box>
                <Box>
                  <Typography variant="h4">{stats.available}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Disponibles
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ bgcolor: 'warning.main', p: 1.5, borderRadius: 2 }}>
                  <WarningIcon sx={{ color: 'white', fontSize: 28 }} />
                </Box>
                <Box>
                  <Typography variant="h4">{stats.quarantine}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    En Cuarentena
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ bgcolor: 'error.main', p: 1.5, borderRadius: 2 }}>
                  <SamplesIcon sx={{ color: 'white', fontSize: 28 }} />
                </Box>
                <Box>
                  <Typography variant="h4">{stats.depleted}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Agotadas
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card sx={{ height: 400 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Distribución por Estado
              </Typography>
              {stats.total > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Disponibles', value: stats.available },
                        { name: 'Agotadas', value: stats.depleted },
                        { name: 'Cuarentena', value: stats.quarantine }
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      dataKey="value"
                      label
                    >
                      {[0, 1, 2].map((index) => (
                        <Cell key={`cell-${index}`} fill={['#2e7d32', '#d32f2f', '#ed6c02'][index]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <Typography color="text.secondary" align="center">
                  No hay datos disponibles
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ height: 400 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Muestras por Línea de Negocio
              </Typography>
              {stats.byLine.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={stats.byLine}>
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#1976d2" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Typography color="text.secondary" align="center">
                  No hay datos disponibles
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { compatibilityAPI } from '../services/api';

const Compatibility = () => {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newRule, setNewRule] = useState({
    chemical_group: '',
    compatible_with: '',
    incompatible_with: '',
    notes: ''
  });

  useEffect(() => {
    loadRules();
  }, []);

  const loadRules = async () => {
    try {
      const response = await compatibilityAPI.getAll();
      setRules(response.data);
    } catch (error) {
      console.error('Error loading rules:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRule = async () => {
    try {
      await compatibilityAPI.create(newRule);
      setDialogOpen(false);
      setNewRule({
        chemical_group: '',
        compatible_with: '',
        incompatible_with: '',
        notes: ''
      });
      loadRules();
    } catch (error) {
      alert('Error al crear regla');
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          Reglas de Compatibilidad Química
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setDialogOpen(true)}
        >
          Nueva Regla
        </Button>
      </Box>

      <Card>
        <CardContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Estas reglas se utilizan para verificar la compatibilidad de muestras en la misma ubicación física.
            Cuando se intenta guardar una muestra, el sistema verifica si hay sustancias incompatibles en el mismo nivel.
          </Typography>
          
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Grupo Químico</TableCell>
                  <TableCell>Compatible Con</TableCell>
                  <TableCell>Incompatible Con</TableCell>
                  <TableCell>Notas</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rules.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      <Typography color="text.secondary">
                        No hay reglas de compatibilidad configuradas
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  rules.map((rule) => (
                    <TableRow key={rule.id}>
                      <TableCell sx={{ fontWeight: 500 }}>{rule.chemical_group}</TableCell>
                      <TableCell>{rule.compatible_with || '-'}</TableCell>
                      <TableCell>
                        <Typography color="error.main" sx={{ fontWeight: 500 }}>
                          {rule.incompatible_with || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>{rule.notes || '-'}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Dialog para nueva regla */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Nueva Regla de Compatibilidad</DialogTitle>
        <DialogContent>
          <TextField
            label="Grupo Químico"
            value={newRule.chemical_group}
            onChange={(e) => setNewRule({ ...newRule, chemical_group: e.target.value })}
            fullWidth
            margin="normal"
            placeholder="Ej: Ácido Clorhídrico"
          />
          <TextField
            label="Compatible Con"
            value={newRule.compatible_with}
            onChange={(e) => setNewRule({ ...newRule, compatible_with: e.target.value })}
            fullWidth
            margin="normal"
            placeholder="Ej: Agua, Etanol"
          />
          <TextField
            label="Incompatible Con"
            value={newRule.incompatible_with}
            onChange={(e) => setNewRule({ ...newRule, incompatible_with: e.target.value })}
            fullWidth
            margin="normal"
            placeholder="Ej: Hipoclorito de Sodio, Aminas"
          />
          <TextField
            label="Notas"
            value={newRule.notes}
            onChange={(e) => setNewRule({ ...newRule, notes: e.target.value })}
            fullWidth
            margin="normal"
            multiline
            rows={2}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleCreateRule}>
            Crear
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Compatibility;

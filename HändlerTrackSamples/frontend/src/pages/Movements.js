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
  Chip,
} from '@mui/material';
import { movementsAPI } from '../services/api';

const Movements = () => {
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMovements();
  }, []);

  const loadMovements = async () => {
    try {
      const response = await movementsAPI.getAll();
      setMovements(response.data);
    } catch (error) {
      console.error('Error loading movements:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Movimientos de Inventario
      </Typography>

      <Card>
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Fecha</TableCell>
                  <TableCell>Tipo</TableCell>
                  <TableCell>Muestra ID</TableCell>
                  <TableCell>Cantidad</TableCell>
                  <TableCell>Ubicación Origen</TableCell>
                  <TableCell>Ubicación Destino</TableCell>
                  <TableCell>Notas</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {movements.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography color="text.secondary">
                        No hay movimientos registrados
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  movements.map((movement) => (
                    <TableRow key={movement.id}>
                      <TableCell>
                        {new Date(movement.created_at).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={movement.movement_type === 'entry' ? 'Entrada' : movement.movement_type === 'exit' ? 'Salida' : 'Transferencia'}
                          color={movement.movement_type === 'entry' ? 'success' : movement.movement_type === 'exit' ? 'error' : 'info'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{movement.sample_id}</TableCell>
                      <TableCell>{movement.quantity} {movement.unit}</TableCell>
                      <TableCell>{movement.source_location || '-'}</TableCell>
                      <TableCell>{movement.destination_location || '-'}</TableCell>
                      <TableCell>{movement.notes || '-'}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Movements;

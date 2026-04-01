/**
 * QRGenerator.jsx
 * Componente para generar y mostrar códigos QR de muestras
 */

import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Button, TextField,
  Dialog, DialogTitle, DialogContent, DialogActions,
  CircularProgress, Alert, Grid
} from '@mui/material';
import { QrCode2, Download, Print } from '@mui/icons-material';
import api from '../services/api';

const QRGenerator = ({ muestraId, nombre, lote, showButton = true }) => {
  const [loading, setLoading] = useState(false);
  const [qrData, setQrData] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [error, setError] = useState(null);

  const generarQR = async () => {
    if (!muestraId || !nombre || !lote) {
      setError('Faltan datos para generar el QR');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await api.post('/api/qr/generar', {
        muestra_id: muestraId,
        nombre: nombre,
        lote: lote
      });
      setQrData(response.data);
      setOpenDialog(true);
    } catch (err) {
      console.error('Error generando QR:', err);
      setError('Error al generar el código QR');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (qrData && qrData.qr_image) {
      const link = document.createElement('a');
      link.href = qrData.qr_image;
      link.download = `QR-${muestraId}-${lote}.png`;
      link.click();
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Etiqueta QR - ${nombre}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; text-align: center; }
            img { width: 200px; height: 200px; }
            .info { margin-top: 10px; font-size: 14px; }
          </style>
        </head>
        <body>
          <img src="${qrData.qr_image}" alt="QR Code" />
          <div class="info">
            <strong>${nombre}</strong><br/>
            Lote: ${lote}<br/>
            ID: ${muestraId}
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  if (!showButton) {
    return null;
  }

  return (
    <Box>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Button
        variant="outlined"
        startIcon={<QrCode2 />}
        onClick={generarQR}
        disabled={loading || !muestraId}
      >
        {loading ? 'Generando...' : 'Generar QR'}
      </Button>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm">
        <DialogTitle>Código QR - {nombre}</DialogTitle>
        <DialogContent>
          {qrData && (
            <Box sx={{ textAlign: 'center', p: 2 }}>
              <img
                src={qrData.qr_image}
                alt="QR Code"
                style={{ width: '200px', height: '200px', margin: '0 auto' }}
              />
              <Typography variant="body2" sx={{ mt: 2 }}>
                <strong>Producto:</strong> {qrData.nombre}
              </Typography>
              <Typography variant="body2">
                <strong>Lote:</strong> {qrData.lote}
              </Typography>
              <Typography variant="body2">
                <strong>ID:</strong> {qrData.muestra_id}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {qrData.generated_at}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button startIcon={<Download />} onClick={handleDownload}>
            Descargar
          </Button>
          <Button startIcon={<Print />} onClick={handlePrint}>
            Imprimir
          </Button>
          <Button onClick={() => setOpenDialog(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default QRGenerator;
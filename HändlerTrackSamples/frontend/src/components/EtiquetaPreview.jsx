/**
 * EtiquetaPreview.jsx
 * Componente de vista previa de etiqueta para impresión
 * Muestra una etiqueta profesional lista para imprimir en impresoras térmicas
 */

import React from 'react';
import {
  Box, Typography, Button, Dialog, DialogTitle, DialogContent,
  DialogActions, Grid, Paper, Divider
} from '@mui/material';
import { Print, Download, Close } from '@mui/icons-material';

const EtiquetaPreview = ({ 
  open = false, 
  onClose, 
  etiqueta = null,
  showActions = true 
}) => {
  if (!etiqueta) return null;

  const handlePrint = () => {
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Etiqueta - ${etiqueta.nombre}</title>
          <style>
            @media print {
              body { margin: 0; padding: 0; }
              .etiqueta { 
                width: 300px; 
                padding: 10px; 
                border: 1px solid #ccc;
                font-family: Arial, sans-serif;
              }
            }
            .etiqueta {
              width: 300px;
              padding: 10px;
              border: 1px solid #ccc;
              font-family: Arial, sans-serif;
              box-sizing: border-box;
            }
            .header {
              text-align: center;
              border-bottom: 2px solid #333;
              padding-bottom: 8px;
              margin-bottom: 8px;
            }
            .header h1 {
              margin: 0;
              font-size: 18px;
              font-weight: bold;
            }
            .qr-section {
              text-align: center;
              margin: 10px 0;
            }
            .qr-section img {
              width: 120px;
              height: 120px;
            }
            .info {
              font-size: 11px;
              line-height: 1.4;
            }
            .info-row {
              display: flex;
              justify-content: space-between;
              margin: 4px 0;
            }
            .info-label {
              font-weight: bold;
            }
            .footer {
              text-align: center;
              font-size: 9px;
              color: #666;
              margin-top: 8px;
              border-top: 1px solid #ccc;
              padding-top: 4px;
            }
          </style>
        </head>
        <body>
          <div class="etiqueta">
            <div class="header">
              <h1>HÄNDLER TRACK SAMPLES</h1>
            </div>
            <div class="qr-section">
              <img src="${etiqueta.qr_image}" alt="QR Code" />
            </div>
            <div class="info">
              <div class="info-row">
                <span class="info-label">Producto:</span>
                <span>${etiqueta.nombre?.substring(0, 25) || 'N/A'}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Lote:</span>
                <span>${etiqueta.lote || 'N/A'}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Cantidad:</span>
                <span>${etiqueta.cantidad || 'N/A'}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Proveedor:</span>
                <span>${etiqueta.proveedor || 'N/A'}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Vencimiento:</span>
                <span>${etiqueta.fecha_vencimiento || 'N/A'}</span>
              </div>
              <div class="info-row">
                <span class="info-label">ID:</span>
                <span>${etiqueta.muestra_id || 'N/A'}</span>
              </div>
            </div>
            <div class="footer">
              ${etiqueta.fecha_impresion || new Date().toLocaleString()}
            </div>
          </div>
        </body>
      </html>
    `;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  const handleDownload = () => {
    if (etiqueta && etiqueta.qr_image) {
      const link = document.createElement('a');
      link.href = etiqueta.qr_image;
      link.download = `Etiqueta-${etiqueta.muestra_id}-${etiqueta.lote}.png`;
      link.click();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        Vista Previa de Etiqueta
        {onClose && (
          <Button size="small" onClick={onClose}>
            <Close />
          </Button>
        )}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ 
          width: '100%', 
          p: 2, 
          bgcolor: '#fff',
          border: '2px solid #333',
          borderRadius: 1,
          fontFamily: 'Arial, sans-serif',
        }}>
          {/* Header */}
          <Box sx={{ textAlign: 'center', borderBottom: '2px solid #333', pb: 1, mb: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', fontSize: 14 }}>
              HÄNDLER TRACK SAMPLES
            </Typography>
          </Box>

          {/* QR Code */}
          <Box sx={{ textAlign: 'center', my: 1 }}>
            {etiqueta.qr_image ? (
              <img 
                src={etiqueta.qr_image} 
                alt="QR Code" 
                style={{ width: 100, height: 100 }}
              />
            ) : (
              <Typography variant="caption" color="text.secondary">
                QR no disponible
              </Typography>
            )}
          </Box>

          {/* Info */}
          <Grid container spacing={0.5} sx={{ fontSize: 10 }}>
            <Grid item xs={5}>
              <Typography variant="caption" sx={{ fontWeight: 'bold' }}>Producto:</Typography>
            </Grid>
            <Grid item xs={7}>
              <Typography variant="caption">{etiqueta.nombre?.substring(0, 20) || 'N/A'}</Typography>
            </Grid>
            
            <Grid item xs={5}>
              <Typography variant="caption" sx={{ fontWeight: 'bold' }}>Lote:</Typography>
            </Grid>
            <Grid item xs={7}>
              <Typography variant="caption">{etiqueta.lote || 'N/A'}</Typography>
            </Grid>
            
            <Grid item xs={5}>
              <Typography variant="caption" sx={{ fontWeight: 'bold' }}>Cantidad:</Typography>
            </Grid>
            <Grid item xs={7}>
              <Typography variant="caption">{etiqueta.cantidad || 'N/A'}</Typography>
            </Grid>
            
            <Grid item xs={5}>
              <Typography variant="caption" sx={{ fontWeight: 'bold' }}>Proveedor:</Typography>
            </Grid>
            <Grid item xs={7}>
              <Typography variant="caption">{etiqueta.proveedor || 'N/A'}</Typography>
            </Grid>
            
            <Grid item xs={5}>
              <Typography variant="caption" sx={{ fontWeight: 'bold' }}>Venc:</Typography>
            </Grid>
            <Grid item xs={7}>
              <Typography variant="caption">{etiqueta.fecha_vencimiento || 'N/A'}</Typography>
            </Grid>
            
            <Grid item xs={5}>
              <Typography variant="caption" sx={{ fontWeight: 'bold' }}>ID:</Typography>
            </Grid>
            <Grid item xs={7}>
              <Typography variant="caption">{etiqueta.muestra_id || 'N/A'}</Typography>
            </Grid>
          </Grid>

          {/* Footer */}
          <Box sx={{ textAlign: 'center', mt: 1, pt: 1, borderTop: '1px solid #ccc', fontSize: 8, color: '#666' }}>
            {etiqueta.fecha_impresion || new Date().toLocaleString()}
          </Box>
        </Box>

        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block', textAlign: 'center' }}>
          Tamaño recomendado: 300px x 200px para impresoras térmicas
        </Typography>
      </DialogContent>

      {showActions && (
        <DialogActions>
          <Button startIcon={<Download />} onClick={handleDownload}>
            Descargar QR
          </Button>
          <Button variant="contained" startIcon={<Print />} onClick={handlePrint}>
            Imprimir Etiqueta
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
};

export default EtiquetaPreview;
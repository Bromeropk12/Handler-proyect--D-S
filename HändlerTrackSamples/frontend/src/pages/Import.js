import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
} from '@mui/material';
import { CloudUpload as UploadIcon, Download as DownloadIcon } from '@mui/icons-material';
import { samplesAPI } from '../services/api';

const Import = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.xlsx')) {
        setError('Solo se aceptan archivos .xlsx');
        return;
      }
      setFile(selectedFile);
      setError(null);
      setResult(null);
    }
  };

  const handleImport = async () => {
    if (!file) {
      setError('Por favor seleccione un archivo');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await samplesAPI.importExcel(file);
      setResult(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al importar archivo');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadTemplate = () => {
    // Crear contenido de plantilla
    const headers = [
      'Codigo_Referencia',
      'Descripcion',
      'Composicion_Quimica',
      'Proveedor',
      'Numero_Lote',
      'Cantidad',
      'Unidad',
      'Linea_Negocio',
      'Zona',
      'Estante',
      'Nivel',
      'Posicion',
      'Ruta_CoA'
    ];

    const exampleRow = [
      'COS-001',
      'Ácido Hialurónico 1%',
      'Ácido Hialurónico, Glicerina',
      'BASF',
      'L2025001',
      '10',
      'kg',
      'Cosmética',
      'COS',
      'E1',
      'N1',
      'P01',
      'C:\\Handler\\Certificados\\BASF\\AH1\\L2025001.pdf'
    ];

    // Crear CSV
    let csvContent = headers.join(',') + '\n';
    csvContent += exampleRow.join(',') + '\n';

    // Crear y descargar archivo
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'plantilla_importacion.csv';
    link.click();
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Carga Masiva de Muestras
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Importar desde Excel
          </Typography>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Seleccione un archivo Excel (.xlsx) con el catálogo de muestras para importar.
            El archivo debe tener las siguientes columnas:
          </Typography>

          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>Columnas requeridas:</Typography>
            <Typography variant="body2" color="text.secondary">
              Codigo_Referencia, Descripcion, Proveedor, Numero_Lote, Cantidad, Linea_Negocio, Zona, Estante, Nivel, Posicion
            </Typography>
          </Box>

          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>Columnas opcionales:</Typography>
            <Typography variant="body2" color="text.secondary">
              Composicion_Quimica, Unidad, Ruta_CoA
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 3 }}>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={handleDownloadTemplate}
            >
              Descargar Plantilla
            </Button>
          </Box>

          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Button
              component="label"
              variant="contained"
              startIcon={<UploadIcon />}
            >
              Seleccionar Archivo
              <input
                type="file"
                accept=".xlsx"
                hidden
                onChange={handleFileChange}
              />
            </Button>

            {file && (
              <Typography variant="body2">
                Archivo seleccionado: {file.name}
              </Typography>
            )}

            <Button
              variant="contained"
              color="primary"
              onClick={handleImport}
              disabled={!file || loading}
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
            >
              {loading ? 'Importando...' : 'Importar'}
            </Button>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Resultado de Importación
            </Typography>

            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <Chip
                label={`Total: ${result.total}`}
                color="default"
              />
              <Chip
                label={`Exitosos: ${result.successful}`}
                color="success"
              />
              <Chip
                label={`Fallidos: ${result.failed}`}
                color="error"
              />
            </Box>

            {result.errors && result.errors.length > 0 && (
              <>
                <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
                  Errores encontrados:
                </Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Error</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {result.errors.map((err, index) => (
                        <TableRow key={index}>
                          <TableCell>{err}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </>
            )}

            {result.successful > 0 && (
              <Alert severity="success" sx={{ mt: 2 }}>
                Se importaron {result.successful} muestras correctamente.
              </Alert>
            )}
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default Import;

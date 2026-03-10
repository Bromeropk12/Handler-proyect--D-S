/**
 * Configuración Centralizada de la Bodega
 * Sistema de Localización: Línea + Fila + Columna = Grid 7x7 = 49 espacios por zona
 * 
 * Formato de ubicación: [LÍNEA]-[FILA][COLUMNA]
 * Ejemplo: COS-A1, IND-B5, FAR-G7
 */

export const WAREHOUSE_CONFIG = {
  // Zonas/Líneas de negocio
  zones: [
    { 
      id: 'COS', 
      name: 'Cosméticos', 
      color: '#9c27b0',
      lightColor: '#f3e5f5',
      businessLine: 'Cosmética'
    },
    { 
      id: 'FAR', 
      name: 'Farmacológica', 
      color: '#2e7d32',
      lightColor: '#e8f5e9',
      businessLine: 'Farma'
    },
    { 
      id: 'IND', 
      name: 'Industrial', 
      color: '#1976d2',
      lightColor: '#e3f2fd',
      businessLine: 'Industrial'
    }
  ],
  // Bloques (para compatibilidad con visualizador)
  blocks: [
    { 
      id: 'COS', 
      name: 'Cosméticos', 
      color: '#9c27b0',
      lightColor: '#f3e5f5',
      rows: ['A', 'B', 'C', 'D', 'E', 'F', 'G']
    },
    { 
      id: 'FAR', 
      name: 'Farmacológica', 
      color: '#2e7d32',
      lightColor: '#e8f5e9',
      rows: ['A', 'B', 'C', 'D', 'E', 'F', 'G']
    },
    { 
      id: 'IND', 
      name: 'Industrial', 
      color: '#1976d2',
      lightColor: '#e3f2fd',
      rows: ['A', 'B', 'C', 'D', 'E', 'F', 'G']
    }
  ],
  // Filas disponibles (letras A-G)
  rows: ['A', 'B', 'C', 'D', 'E', 'F', 'G'],
  // Columnas disponibles (números 1-7)
  columns: ['1', '2', '3', '4', '5', '6', '7'],
  // Capacidad por zona
  capacityPerZone: 49
};

// Función para obtener información de una zona
export const getZoneInfo = (zoneCode) => {
  if (!zoneCode) return WAREHOUSE_CONFIG.zones[0];
  const zonePrefix = zoneCode.toUpperCase().substring(0, 3);
  return WAREHOUSE_CONFIG.zones.find(z => z.id === zonePrefix) || WAREHOUSE_CONFIG.zones[0];
};

// Función para generar el código de ubicación
export const generateLocationCode = (zone, level, position) => {
  if (!zone || !level || !position) return '';
  return `${zone.toUpperCase()}-${level.toUpperCase()}${position}`;
};

// Función para validar una ubicación
export const isValidLocation = (zone, level, position) => {
  const zoneValid = WAREHOUSE_CONFIG.zones.some(z => z.id === zone?.toUpperCase());
  const levelValid = WAREHOUSE_CONFIG.rows.includes(level?.toUpperCase());
  const positionValid = WAREHOUSE_CONFIG.columns.includes(position);
  return zoneValid && levelValid && positionValid;
};

// Función para obtener el color de una zona
export const getZoneColor = (zoneCode) => {
  const zone = getZoneInfo(zoneCode);
  return zone.color;
};

// Función para obtener el color claro de una zona
export const getZoneLightColor = (zoneCode) => {
  const zone = getZoneInfo(zoneCode);
  return zone.lightColor;
};

// Colores por línea de negocio
export const BUSINESS_LINE_COLORS = {
  'Cosmética': { bg: '#f3e5f5', color: '#9c27b0' },
  'Industrial': { bg: '#e3f2fd', color: '#1976d2' },
  'Farma': { bg: '#e8f5e9', color: '#2e7d32' },
};

// Colores por estado
export const STATUS_COLORS = {
  'available': { bg: '#e8f5e9', color: '#2e7d32', label: 'Disponible' },
  'depleted': { bg: '#ffebee', color: '#d32f2f', label: 'Agotada' },
  'quarantine': { bg: '#fff3e0', color: '#ed6c02', label: 'En Cuarentena' },
};

export default WAREHOUSE_CONFIG;

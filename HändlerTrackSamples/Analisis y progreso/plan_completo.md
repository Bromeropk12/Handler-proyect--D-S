# Plan Completo Actualizado - Händler TrackSamples (WMS Inteligente)

## Resumen Ejecutivo

Este documento presenta el plan estratégico e ingenieril para el desarrollo del software **Händler TrackSamples**, una aplicación de escritorio avanzada (WMS - Warehouse Management System) diseñada para optimizar la gestión, control estricto y localización física del inventario de muestras químicas en **Handler S.A.S.** El sistema destaca por su motor lógico enfocado en la prevención de riesgos mediante compatibilidad química automatizada.

## 1. Arquitectura y Tecnologías Implementadas

### Backend (El "Cerebro")
- **Python** con framework **FastAPI** (rendimiento, asincronismo y validaciones integradas)
- **MySQL** como base de datos relacional para garantizar la integridad referencial (ACID)
- **SQLAlchemy** (ORM) y **Alembic** para la gestión de migraciones
- **Pydantic** para esquemas y validación estricta de datos

### Frontend (La Interfaz Visual)
- **Electron** para la envoltura como aplicación de escritorio nativa (Windows)
- **React.js** como librería principal para la construcción de interfaces modulares
- **Material UI** (MUI) para componentes visuales estandarizados y accesibles

### Seguridad y Lógica de Negocio
- Autenticación mediante **JWT** (JSON Web Tokens) y cifrado **bcrypt**
- Motor de reglas basado en el Sistema Globalmente Armonizado (SGA/GHS)

## 2. Estrategia de Almacenamiento Físico y Lógico

El núcleo innovador del sistema radica en su modelo dual de estructuración:

### Gestión por Anaqueles Dedicados
- Separación física por líneas de negocio (Cosmética, Farmacéutica, Industrial) para evitar contaminación cruzada

### Sistema de Coordenadas por Hileras (Carriles)
- Cada nivel del anaquel (10 niveles) se divide en 13 hileras (eje X) con una profundidad de 9 posiciones (eje Z)
- Las muestras idénticas se apilan en la misma hilera, reduciendo la complejidad de cálculo espacial

### Regla de la Gravedad
- Líquidos forzados a niveles inferiores (1-4)
- Sólidos a niveles superiores (5-10) para mitigar riesgos por derrames

## 3. Funcionalidades Principales (Core Features)

### Módulo de Catálogo e Inventario
- **CRUD de muestras** químicas con clasificación obligatoria por Clase de Peligro
- Control de volumen y unidades (ml, L, g, kg)
- Importación masiva desde Excel para carga inicial

### Motor Inteligente de Localización y Seguridad
- **Matriz de Compatibilidad Química Automática**: El sistema evalúa a los vecinos adyacentes (izquierda/derecha) antes de sugerir una ubicación
- **Algoritmo de Reubicación Mínima (Swap)**: En escenarios de alta ocupación y conflicto químico, el sistema utiliza muestras "Inertes" como buffer para sugerir intercambios de un solo movimiento, evitando reorganizaciones masivas
- **Mapa Visual Interactivo 2D**: Interfaz tipo cuadrícula/barras que ilumina la ubicación exacta de la muestra solicitada

### Trazabilidad y Documentación
- Registro de Movimientos (Entradas y Salidas) en tiempo real
- Generador de Códigos QR para vinculación física-digital
- Gestión y visualización de Certificados de Análisis (CoA) en PDF

## 4. Plan de Implementación (6 Sprints)

El desarrollo se divide en 6 Sprints de 2 semanas cada uno, siguiendo una arquitectura incremental donde las reglas de negocio preceden a la interfaz visual compleja.

### Sprint 1: Fundamentos, Autenticación y Catálogo Base
- [x] Configuración del entorno (Electron + React + FastAPI)
- [x] Implementación de JWT, roles y gestión de usuarios
- [ ] Módulo 1: Creación del modelo Sample y esquemas Pydantic
- [ ] CRUD básico de muestras (sin ubicación aún)
- [ ] Frontend: Layout principal, menú lateral (Sidebar) y vistas del Catálogo

### Sprint 2: El Cerebro Lógico (Matriz y Hileras)
- [ ] Creación de modelos de ClasePeligro y MatrizCompatibilidad
- [ ] Script de siembra (Seed) con las 6 clases universales y las 36 reglas de interacción
- [ ] Creación del modelo Hilera (130 carriles por anaquel)
- [ ] Frontend: Integración de las clases de peligro en los formularios de registro

### Sprint 3: Algoritmo de Asignación y Mapa Visual 2D
- [ ] Desarrollo del location_engine.py en el backend (El motor de filtros: Línea -> Estado Físico -> Vecinos -> Compatibilidad)
- [ ] Implementación del Algoritmo de Reubicación Mínima para el manejo de anaqueles fragmentados
- [ ] Frontend: Desarrollo del componente WarehouseMap.jsx (Vista de niveles e hileras interactivas)

### Sprint 4: Movimientos Logísticos (IN/OUT) e Importación
- [ ] Modelado y endpoints para la tabla de Movimientos (Historial de transacciones)
- [ ] Lógica de suma/resta en la capacidad de las Hileras (1 a 9)
- [ ] Desarrollo del módulo de carga masiva de inventario inicial vía .xlsx (Excel)
- [ ] Frontend: Pantalla de Operaciones Rápidas (Escanear -> Sugerir ubicación -> Confirmar)

### Sprint 5: Trazabilidad, QRs y Documentos (CoA)
- [ ] Endpoint y generador visual para Etiquetas QR
- [ ] Integración de sistema de almacenamiento local para archivos PDF (Certificados de Análisis)
- [ ] Visualizador de PDF integrado en el frontend
- [ ] Exportación de reportes de inventario (Excel/PDF)

### Sprint 6: Estabilización, Backups y Despliegue
- [ ] Implementación de scripts programados para Backups de la base de datos MySQL (Local y Nube)
- [ ] Auditoría final de seguridad y depuración de código
- [ ] Elaboración del manual de usuario técnico y operativo
- [ ] Pruebas de estrés y compilación final del ejecutable de Electron (.exe)

## 5. Indicadores de Éxito (KPIs)

| Indicador | Meta |
|-----------|------|
| Precisión Logística | 100% de coincidencia entre el mapa digital y el anaquel físico |
| Seguridad Laboral | 0% de asignaciones automáticas que infrinjan la matriz SGA/GHS |
| Eficiencia Operativa | Reducción del tiempo de búsqueda y almacenamiento a menos de 15 segundos |
| Disponibilidad y Respaldo | Ejecución exitosa de copias de seguridad cada 24 horas sin corrupción de datos |

## 6. Riesgos y Mitigaciones

| Riesgo | Probabilidad | Impacto | Estrategia de Mitigación |
|--------|--------------|---------|---------------------------|
| Fragmentación extrema de espacio | Alta | Medio | Algoritmo de "Reubicación Mínima" usando muestras inertes |
| Incompatibilidad Química / Error Humano | Baja | Crítico | Validación estricta en Backend + Alerta visual bloqueante en Frontend |
| Fallo del hardware local | Media | Alto | Estrategia de backups automatizados (Local + Cloud) |
| Resistencia al cambio del personal | Media | Medio | Interfaz visual altamente intuitiva y capacitación pre-despliegue |

## 7. Cronograma y Entregables Finales

- **Duración Total**: 12 Semanas (6 Sprints)
- **Entregables**:
  - Archivo instalable .exe de la aplicación de escritorio Händler TrackSamples
  - Base de datos estructurada con las reglas de negocio (SGA)
  - Manual Operativo y Técnico de la plataforma
  - Scripts de recuperación y respaldo de base de datos

---

*Este plan está diseñado bajo estándares profesionales de Ingeniería de Software, garantizando escalabilidad, cumplimiento normativo de seguridad de laboratorios y una experiencia de usuario altamente eficiente.*

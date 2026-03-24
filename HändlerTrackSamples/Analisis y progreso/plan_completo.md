# Plan Completo Actualizado - Händler TrackSamples (WMS Inteligente v2.0)

## Resumen Ejecutivo

Este documento presenta el plan estratégico e ingenieril para el desarrollo del software **Händler TrackSamples**, una aplicación de escritorio avanzada (WMS - Warehouse Management System) diseñada para optimizar la gestión, control estricto y localización física del inventario de muestras químicas en **Handler S.A.S.** El sistema destaca por su motor lógico enfocado en la prevención de riesgos mediante compatibilidad química automatizada y gestión por proveedores.

## Origen del Documento

Este plan se basa en las especificaciones del **Documento SRS v2.0** (Specification Requirements) que define:
- 14 anaqueles distribuidos por Línea Comercial y Proveedor
- Volumetría dinámica de muestras (1x1, 2x1, 2x2)
- Workflows de Dosificación (CU-01) y Despacho FEFO (CU-02)
- Requisitos No Funcionales críticos (RNF-1 a RNF-4)

---

## 1. Arquitectura y Tecnologías Implementadas

### Backend (El "Cerebro")
- **Python** con framework **FastAPI** (rendimiento, asincronismo y validaciones integradas)
- **MySQL** como base de datos relacional para garantizar la integridad referencial (ACID)
- **SQLAlchemy** (ORM) y **Alembic** para la gestión de migraciones
- **Pydantic** para esquemas y validación estricta de datos

### Frontend (La Interfaz Visual)
- **Electron** para la envoltura como aplicación de escritorio nativa (Windows)
- **React.js** como librería principal para la construcción de interfaces modulares
- **Material UI** (MUI) v5 para componentes visuales estandarizados

### Seguridad y Lógica de Negocio
- Autenticación mediante **JWT** (JSON Web Tokens) y cifrado **bcrypt**
- Motor de reglas basado en el Sistema Globalmente Armonizado (SGA/GHS)

---

## 2. Modelo de Almacenamiento Físico (14 Anaqueles)

### Distribución Exacta según SRS v2.0 (Sección 2.1)

| Línea Comercial | Total | Distribución por Proveedor / Uso |
|-----------------|-------|----------------------------------|
| **Cosmética** | 5 | 3 BASF, 1 JRS, 1 THOR |
| **Industria** | 3 | 1 BASF, 1 BASF & THOR (Mixto), 1 BULK |
| **Farmacéutica** | 6 | 2 JRF, 1 SUDEEP & GIVAUDAN (Mixto), 2 BASF, 1 MEGGLE |

### Sistema de Coordenadas por Hileras
- Cada anaquel tiene **10 niveles** de altura
- Cada nivel tiene **13 hileras** (eje X)
- Cada hilera tiene **9 posiciones** de profundidad (eje Z)
- **Total**: 14 anaqueles × 10 niveles × 13 hileras = **1820 hileras**

### Volumetría Dinámica (Sección 2.2 SRS)
- Por defecto: `1x1` (1 ancho × 1 fondo)
- Extensiones: `2x1`, `2x2`
- Sistema ignorará altura física (vista superior)

### Regla de la Gravedad
- **Líquidos**: niveles 1-4 (inferiores)
- **Sólidos**: niveles 5-10 (superiores)

---

## 3. Funcionalidades Principales (Core Features)

### Módulo 1: Catálogo e Inventario ✅ COMPLETADO
- CRUD de muestras químicas con clasificación por Clase de Peligro
- Control de cantidad en **gramos (g)** exclusivamente (SECCIÓN 4 SRS)
- Gestión de proveedores (BASF, THOR, JRS, JRF, etc.)
- Importación masiva desde Excel
- Sistema de **Dosificación** (RNF-1): Dividir muestra bulk en submuestras con QR únicos

### Módulo 2: Estructura Física - 14 Anaqueles ❌ PENDIENTE
- Modelo de 14 anaqueles con mapeo dinámico a proveedores (RNF-2)
- Gestión de líneas: Cosmética, Farmacéutica, Industrial
- Tabla relacional `anaquel_proveedor` para escalabilidad

### Módulo 3: Motor Inteligente de Localización ❌ PENDIENTE
- **Matriz de Compatibilidad Química**: Evalúa vecinos adyacentes (izquierda/derecha)
- **Algoritmo de Reubicación Mínima (Swap)**: Usa muestras "Inertes" como buffer
- **FEFO** (First Expire, First Out): Estrategia de despacho por vencimiento

### Módulo 4: Movimientos Logísticos ❌ PENDIENTE
- **Entradas (CU-01)**: Registro + Dosificación + QR + Ubicación guiada
- **Despachos (CU-02)**: Búsqueda + FEFO + Etiqueta + CoA

### Módulo 5: Alertas Inteligentes (Background Tasks) ❌ PENDIENTE
- Stock bajo (según umbrales)
- Muestras próximas a vencer (30, 60, 90 días)
- Optimización de espacio

### Módulo 6: Trazabilidad y Documentación ❌ PENDIENTE
- Registro de movimientos en tiempo real
- Generador de Códigos QR
- Gestión de Certificados de Análisis (CoA) - RNF-3
- Previsualización de cuadrícula - RNF-4

---

## 4. Requisitos No Funcionales (RNF)

| RNF | Descripción | Implementación |
|-----|-------------|----------------|
| **RNF-1** | Integridad matemática de dosificación | Backend valida: `unidades × gramos_por_unidad ≤ cantidad_total` |
| **RNF-2** | Escalabilidad proveedores/anaqueles | Tabla `anaquel_proveedor` (no hardcoded) |
| **RNF-3** | Interacción con sistema de archivos | nodeIntegration/preload para leer PDFs CoA |
| **RNF-4** | Previsualización de cuadrícula | WarehouseMap.jsx muestra preview antes de Commit |

---

## 5. Plan de Implementación (6 Sprints)

### Sprint 1: Fundamentos, Autenticación y Catálogo Base ✅ COMPLETADO
- [x] Configuración del entorno (Electron + React + FastAPI)
- [x] Implementación de JWT, roles y gestión de usuarios
- [x] Módulo 1: Creación del modelo Sample y esquemas Pydantic
- [x] CRUD básico de muestras (sin ubicación aún)
- [x] Frontend: Layout principal, menú lateral (Sidebar) y vistas del Catálogo
- [x] Modelo Proveedor y gestión de proveedores
- [x] Modelo ClasePeligro y seed de datos GHS
- [x] Integración de proveedor en formulario de muestras

### Sprint 2: Estructura Física - 14 Anaqueles ❌ PENDIENTE
- [ ] Creación de modelos de Proveedor, Línea, Anaquel, Hilera
- [ ] Script de siembra (Seed): 7 proveedores, 3 líneas, 14 anaqueles, 1820 hileras
- [ ] **Tabla anaquel_proveedor** (RNF-2)
- [ ] Frontend: Dashboard de 14 anaqueles

### Sprint 3: El Cerebro Lógico (Compatibilidad Química) ❌ PENDIENTE
- [ ] Creación de modelos de ClasePeligro y MatrizCompatibilidad
- [ ] Script de siembra: 9 clases GHS y 36 reglas de interacción
- [ ] Motor de verificación de vecinos
- [ ] Frontend: Integración de clases de peligro en formularios

### Sprint 4: Algoritmo de Asignación, Dosificación y FEFO ❌ PENDIENTE
- [ ] Desarrollo del `location_engine.py` (Línea → Proveedor → Dimensiones → Estado Físico → Vecinos → Compatibilidad)
- [ ] Implementación de `dosificacion.py` (RNF-1)
- [ ] Implementación de `fefo.py` (First Expire, First Out)
- [ ] Algoritmo de Reubicación Mínima
- [ ] Frontend: WarehouseMap.jsx con previsualización (RNF-4)

### Sprint 5: Movimientos Logísticos (IN/OUT) e Importación ❌ PENDIENTE
- [ ] Modelado y endpoints para tabla de Movimientos
- [ ] Lógica de capacidad de Hileras (1 a 9)
- [ ] Módulo de carga masiva vía Excel
- [ ] Sistema de alertas inteligentes (stock bajo, vencimientos)
- [ ] Frontend: Pantalla de Operaciones (Escanear → Sugerir → Confirmar)

### Sprint 6: Trazabilidad, QRs, CoA y Despliegue ❌ PENDIENTE
- [ ] Endpoint y generador visual para Etiquetas QR
- [ ] Integración de sistema de archivos para CoA (RNF-3)
- [ ] Visualizador de PDF integrado en frontend
- [ ] Exportación de reportes (inventario, movimientos, vencimientos)
- [ ] Scripts programados para Backups
- [ ] Compilación final del ejecutable .exe

---

## 6. Indicadores de Éxito (KPIs)

| Indicador | Meta |
|-----------|------|
| Precisión Logística | 100% de coincidencia entre mapa digital y anaquel físico |
| Seguridad Laboral | 0% de asignaciones que infrinjan matriz SGA/GHS |
| Eficiencia Operativa | Reducción del tiempo de búsqueda a menos de 15 segundos |
| Integridad de Dosificación | 100% validación matemática (RNF-1) |
| Disponibilidad y Respaldo | Ejecución exitosa de backups cada 24 horas |

---

## 7. Riesgos y Mitigaciones

| Riesgo | Probabilidad | Impacto | Estrategia de Mitigación |
|--------|--------------|---------|--------------------------|
| Fragmentación extrema de espacio | Alta | Medio | Algoritmo de "Reubicación Mínima" usando muestras inertes |
| Error en dosificación (RNF-1) | Media | Alto | Validación estricta: `unidades × gramos ≤ total` |
| Incompatibilidad Química | Baja | Crítico | Validación en Backend + Alerta visual bloqueante en Frontend |
| Fallo del hardware local | Media | Alto | Estrategia de backups automatizados (Local + Cloud) |
| Resistencia al cambio del personal | Media | Medio | Interfaz intuitiva y capacitación pre-despliegue |
| Proveedor no existente en anaquel | Baja | Medio | Tabla anaquel_proveedor dinámica (RNF-2) |

---

## 8. Cronograma y Entregables Finales

- **Duración Total**: 12 Semanas (6 Sprints)
- **Avance Actual**: ~60% (Sprint 1 completado)
- **Entregables**:
  - Archivo instalable .exe de la aplicación de escritorio Händler TrackSamples
  - Base de datos estructurada con 14 anaqueles y reglas SGA
  - Motor de dosificación y algoritmo FEFO
  - Manual Operativo y Técnico de la plataforma
  - Scripts de recuperación y respaldo de base de datos

---

## 9. Referencias Documentales

- **Documento SRS v2.0**: Especificaciones completas de requisitos
- **Plan de Desarrollo Modular**: Desglose detallado por sprints

---

*Este plan está diseñado bajo estándares profesionales de Ingeniería de Software, garantizando escalabilidad, cumplimiento normativo de seguridad de laboratorios y una experiencia de usuario altamente eficiente.*

**Estado: EN DESARROLLO - Sprint 1 COMPLETADO (60%)**

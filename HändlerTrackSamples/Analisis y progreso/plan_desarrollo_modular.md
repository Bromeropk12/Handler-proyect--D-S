# Plan de Desarrollo Modular - Händler TrackSamples (WMS Inteligente)

## Estado Actual del Proyecto

### ✅ Implementado (Sprints 1-5 - COMPLETADOS 95%)
| Módulo | Componente | Estado |
|--------|------------|--------|
| Backend | FastAPI configurado | ✅ Completo |
| Backend | MySQL + SQLAlchemy + Alembic | ✅ Completo |
| Backend | Autenticación JWT + bcrypt | ✅ Completo |
| Backend | Modelo User | ✅ Completo |
| Backend | Modelo Sample | ✅ Completo |
| Backend | Modelo Proveedor | ✅ Completo |
| Backend | Modelo ClasePeligro | ✅ Completo |
| Backend | Schemas Pydantic (User, Sample, Proveedor, ClasePeligro) | ✅ Completo |
| Backend | Routers API (samples, proveedores, clases_peligro) | ✅ Completo |
| Frontend | Electron + React | ✅ Completo |
| Frontend | Material UI Theme | ✅ Completo |
| Frontend | Login + ChangePassword | ✅ Completo |
| Frontend | AuthContext | ✅ Completo |
| Frontend | Muestras.js (Catálogo completo) | ✅ Completo |
| Frontend | Proveedores.js (Gestión de proveedores) | ✅ Completo |
| Frontend | Almacen.js (14 anaqueles) | ✅ Completo |
| Frontend | Movimientos.js (Entradas/Salidas) | ✅ Completo |
| Scripts | Backup PowerShell | ✅ Completo |
| Datos | Seed: Proveedores reales de Handler | ✅ Completo |
| Datos | Seed: Clases GHS (9 clases) | ✅ Completo |
| Datos | Seed: 3 líneas + 14 anaqueles + 1820 hileras | ✅ Completo |

### ✅ Completamente Implementado (Sprint 2 - COMPLETADO)
| Módulo | Componente | Estado |
|--------|------------|--------|
| Backend | Modelo: Linea | ✅ Completo |
| Backend | Modelo: Anaquel | ✅ Completo |
| Backend | Modelo: Hilera | ✅ Completo |
| Backend | Modelo: AnaquelProveedor (RNF-2) | ✅ Completo |
| Backend | Routers: lineas, anaqueles, hileras | ✅ Completo |
| Backend | Routers: anaquel_proveedor | ✅ Completo |
| Frontend | Almacen.js (Gestión de bodega) | ✅ Completo |
| Datos | Seed: Línea, Anaquel, Hilera | ✅ Completo |

### ❌ Por Implementar (Sprint 6 - 10%)
| Módulo | Componente | Estado |
|--------|------------|--------|
| Backend | Modelo: MatrizCompatibilidad | ✅ En routers existentes |
| Backend | Modelo: Movement | ✅ Completo |
| Backend | Routers movements.py | ✅ Completo |
| Backend | Services (dosificación, FEFO, location) | ✅ En routers existentes |
| Frontend | Mapa de Almacén 2D (WarehouseMap) | ❌ Falta |
| Frontend | Generación QR | ❌ Falta |
| Frontend | Visualizador CoA | ❌ Falta |
| Frontend | Importación Excel | ❌ Falta |
| Frontend | Alertas Inteligentes | ❌ Falta |

---

## Requisitos Críticos del Documento SRS (v2.0)

### Modelo de 14 Anaqueles (SECCIÓN 2.1)
El sistema debe soportar **14 anaqueles** distribuidos por Línea Comercial:

| Línea | Total | Distribución por Proveedor |
|-------|-------|----------------------------|
| **Cosmética** | 5 | 3 BASF, 1 JRS, 1 THOR |
| **Industria** | 3 | 1 BASF, 1 BASF & THOR (Mixto), 1 BULK |
| **Farmacéutica** | 6 | 2 JRF, 1 SUDEEP & GIVAUDAN (Mixto), 2 BASF, 1 MEGGLE |

### Volumetría Dinámica (SECCIÓN 2.2)
- Por defecto, una muestra ocupa `1x1` (ancho x fondo)
- Sistema debe permitir: `1x1`, `2x1`, `2x2`, etc.
- La altura física es ignorada (vista superior)

### Regla de Medición Estándar (SECCIÓN 4)
**Toda medición de cantidad y volumen se realiza exclusivamente en Gramos (g)**

---

## Arquitectura Modular Propuesta

```
backend/
├── models/           # Modelos SQLAlchemy
│   ├── user.py       ✅ Existe
│   ├── sample.py     ✅ Existe
│   ├── proveedor.py  ✅ Existe
│   ├── clase_peligro.py  ✅ Existe
│   ├── movement.py   📦 Nuevo
│   ├── linea.py      ✅ Existe
│   ├── anaquel.py    ✅ Existe
│   ├── hilera.py     ✅ Existe
│   └── anaquel_proveedor.py  ✅ Existe (RNF-2)
├── schemas/          # Esquemas Pydantic
│   └── __init__.py   ✅ Existe (ampliar)
├── routers/          # Endpoints API
│   ├── __init__.py   ✅ Existe
│   ├── auth.py       ✅ Existe
│   ├── muestras.py   ✅ Existe
│   ├── proveedores.py    ✅ Existe
│   ├── clases_peligro.py ✅ Existe
│   ├── lineas.py     ✅ Existe
│   ├── anaqueles.py  ✅ Existe
│   ├── hileras.py    ✅ Existe
│   ├── anaquel_proveedor.py  ✅ Existe
│   ├── movements.py  📦 Nuevo
│   ├── location.py   📦 Nuevo
│   └── reports.py    📦 Nuevo
├── services/         # Lógica de negocio (NUEVO)
│   ├── __init__.py   📦 Nuevo
│   ├── location_engine.py   📦 Nuevo
│   ├── compatibilidad.py    📦 Nuevo
│   ├── dosificacion.py      📦 Nuevo (RNF-1)
│   ├── reubicacion.py       📦 Nuevo
│   ├── fefo.py              📦 Nuevo
│   ├── movement_service.py  📦 Nuevo
│   ├── alertas_service.py   📦 Nuevo
│   ├── import_excel.py      📦 Nuevo
│   └── qr_service.py        📦 Nuevo
└── seed/             # Datos iniciales
    ├── __init__.py   ✅ Existe
    └── sga_classes.py ✅ Existe
```

---

# PLAN DE DESARROLLO - 6 SPRINTS (ACTUALIZADO)

## Sprint 1: Catálogo de Muestras + Datos Base (Semanas 1-2) ✅ COMPLETADO

### Objetivo
CRUD completo de muestras químicas con clasificación por clase de peligro y carga de datos iniciales

### Backend - Modelos y Schemas
- [x] `models/sample.py` - Modelo Sample con campos:
  - id, nombre, CAS, lote, proveedor_id
  - cantidad_gramos (decimal, restricción: solo gramos)
  - linea_negocio, clase_peligro_id
  - dimensiones (1x1, 2x1, 2x2 - ancho x fondo)
  - fecha_manufactura, fecha_vencimiento
  - qr_code, coa_path, estado (activo/despachado)
  - sample_parent_id (para dosificación)
  - created_at, updated_at

- [x] `models/clase_peligro.py` - Modelo ClasePeligro:
  - id, codigo (GHS01-GHS09), nombre, descripcion
  - icono, color, activo

- [x] `models/proveedor.py` - Modelo Proveedor:
  - id, nombre, nit, activo

- [x] `schemas/sample.py` - Pydantic schemas:
  - SampleCreate, SampleUpdate, SampleResponse
  - SampleFilter (para búsqueda)

### Backend - API
- [x] `routers/muestras.py`:
  - `POST /api/muestras` - Crear muestra
  - `GET /api/muestras` - Listar muestras (con filtros)
  - `GET /api/muestras/{id}` - Ver detalles
  - `PUT /api/muestras/{id}` - Actualizar
  - `DELETE /api/muestras/{id}` - Eliminar (Soft delete)
  - `GET /api/muestras/search?q=` - Búsqueda texto

- [x] `routers/clases_peligro.py`:
  - `GET /api/clases-peligro` - Listar clases

- [x] `routers/proveedores.py`:
  - `GET /proveedores` - Listar proveedores
  - `POST /proveedores` - Crear proveedor
  - `PUT /proveedores/{id}` - Actualizar proveedor
  - `DELETE /proveedores/{id}` - Eliminar proveedor

### Frontend - Catálogo
- [x] `pages/Muestras.js` - Lista de muestras con tabla, filtros y paginación
- [x] `pages/Proveedores.js` - Gestión de proveedores
- [x] Integración de proveedor en formulario de muestras

### seed/ Datos Iniciales
- [x] Insertar proveedores (BASF, THOR, JRS, JRF, SUDEEP, GIVAUDAN, MEGGLE, etc.)
- [x] Insertar 9 clases GHS (GHS01-GHS09)

### Entregable Sprint 1
- CRUD de muestras funcional en UI
- Búsqueda y filtrado por nombre, CAS, clase, proveedor, línea
- Catálogo de proveedores y clases de peligro
- Seed de proveedores reales y clases GHS

---

## Sprint 2: Estructura Física - 14 Anaqueles (Semanas 3-4) ✅ PARCIAL

### Objetivo
Definir la estructura física del almacén con **14 anaqueles** según distribución del SRS

### Backend - Modelos
- [x] `models/linea.py` - Líneas de negocio:
  - id, nombre (Cosmética/Farmacéutica/Industrial)
  - descripcion, activo

- [x] `models/anaquel.py` - Anaquel:
  - id, linea_id, nombre, niveles (10), hileras (13)
  - profundidad (9 posiciones por hilera)
  - descripcion, activo

- [x] `models/hilera.py` - Hilera (posición):
  - id, anaquel_id, nivel (1-10), hilera (1-13)
  - capacidad_max (9), posiciones_usadas
  - ancho (1-2), fondo (1-2) - dimensiones soportadas
  - estado (disponible/ocupado/mantenimiento)

- [x] `models/anaquel_proveedor.py` - Relación muchos-a-muchos:
  - id, anaquel_id, proveedor_id
  - capacidad_max_gramos, es_principal, activo

### Configuración de 14 Anaqueles (SECCIÓN 2.1 SRS)
```
Cosmética (5):
  - Anaquel COS-BASF-1 (BASF)
  - Anaquel COS-BASF-2 (BASF)
  - Anaquel COS-BASF-3 (BASF)
  - Anaquel COS-JRS-1 (JRS)
  - Anaquel COS-THOR-1 (THOR)

Industria (3):
  - Anaquel IND-BASF-1 (BASF)
  - Anaquel IND-BASF-THOR (BASF & THOR Mixto)
  - Anaquel IND-BULK (BULK - muestras grandes)

Farmacéutica (6):
  - Anaquel FAR-JRF-1 (JRF)
  - Anaquel FAR-JRF-2 (JRF)
  - Anaquel FAR-SUD-GIV (SUDEEP & GIVAUDAN Mixto)
  - Anaquel FAR-BASF-1 (BASF)
  - Anaquel FAR-BASF-2 (BASF)
  - Anaquel FAR-MEGGLE-1 (MEGGLE)
```

### Backend - API
- [x] `routers/lineas.py` - CRUD líneas
- [x] `routers/anaqueles.py` - CRUD anaqueles
- [x] `routers/hileras.py` - CRUD hileras
  - `GET /api/hileras/disponibles?linea=&nivel=&estado=`
- [x] `routers/anaquel_proveedor.py` - Gestión de proveedores por anaquel (RNF-2)

### Frontend
- [x] `pages/Almacen.js` - Gestión de líneas, anaqueles y hileras

### seed/ Datos Iniciales
- [x] Insertar 3 líneas (Cosmética, Farmacéutica, Industrial)
- [ ] Crear 14 anaqueles según distribución exacta (pendiente seed automático)
- [ ] Generar todas las hileras (14 × 10 niveles × 13 hileras = 1820 hileras)

### Entregable Sprint 2
- Estructura física de 14 anaqueles (modelos creados)
- Vista de ocupación de anaqueles
- Mapeo proveedor-anaquel dinámico (RNF-2) ✅ IMPLEMENTADO

---

## Sprint 3: Motor de Compatibilidad Química (Semanas 5-6) ❌ PENDIENTE

### Objetivo
Implementar el "cerebro" del sistema: matriz de compatibilidad y reglas SGA

### Backend - Modelos
- [ ] `models/matriz_compatibilidad.py`:
  - id, clase_a_id, clase_b_id, compatible (bool)
  - nivel_peligro (bajo/medio/alto/crítico)
  - mensaje_advertencia

### Backend - Services
- [ ] `services/compatibilidad.py`:
  - verificar_compatibilidad(clase_a, clase_b) → bool + nivel
  - get_vecinos(hilera_id) → lista de clases en posiciones adyacentes
  - es_seguro_asignar(muestra_id, hilera_id) → validación

### Backend - API
- [ ] `routers/compatibilidad.py`:
  - `GET /api/compatibilidad/{clase_a}/{clase_b}`
  - `GET /api/compatibilidad/verificar?muestra_id=&hilera_id=`
  - `GET /api/matriz` - Matriz completa

### seed/ Datos SGA/GHS
- [ ] Insertar 36 reglas de compatibilidad (9×9 triangular)
- [ ] Incluir clases: Explosivo, Comburente, Inflamable, Corrosivo, Tóxico, etc.

### Entregable Sprint 3
- API de compatibilidad funcional
- Reglas SGA implementadas en base de datos

---

## Sprint 4: Asignación Inteligente + Dosificación + FEFO (Semanas 7-8) ❌ PENDIENTE

### Objetivo
Algoritmo para sugerir la mejor ubicación con soporte para dosificación y estrategia FEFO

### Backend - Services (NUEVOS)
- [ ] `services/dosificacion.py` (RNF-1):
  - validar_integridad_matematica(cantidad_total, unidades, gramos_por_unidad)
  - crear_submuestras(parent_sample, unidades, gramos_cada_una)
  - generar_qr_unico(submuestra_id)

- [ ] `services/location_engine.py`:
  ```
  algoritmo_sugerir_ubicacion(muestra_id):
    1. Filtrar por línea de negocio
    2. Filtrar por proveedor (RNF-2: tabla anaquel_proveedor)
    3. Filtrar por dimensiones (1x1, 2x1, 2x2)
    4. Filtrar por estado físico (líquido→niveles 1-4, sólido→5-10)
    5. Buscar hileras con capacidad disponible para dimensiones
    6. Para cada hilera disponible:
       - Verificar vecinos (izquierda/derecha)
       - Verificar compatibilidad química
    7. Si no hay ubicación: sugerir "Reubicación Mínima"
       - Buscar muestra "Inerte" como buffer
       - Proponer intercambio Swap (Algoritmo de Reorganización Mínima)
  ```

- [ ] `services/fefo.py`:
  - buscar_muestras_fefo(producto_id) → lista ordenada por fecha_vencimiento
  - sugerir_despacho(producto_id, cantidad)

- [ ] `services/reubicacion.py`:
  - calcular_movimientos_necesarios(muestra_conflicto)
  - sugerir_intercambio(muestra_a, muestra_b)

### Backend - API
- [ ] `routers/location.py`:
  - `POST /api/location/sugerir` - Sugerir ubicación
  - `POST /api/location/asignar` - Asignar muestra a hilera
  - `POST /api/location/reubicacion` - Calcular reubicación
  - `POST /api/location/dosificar` - Proceso de dosificación (RNF-1)

- [ ] `routers/despacho.py`:
  - `GET /api/despacho/sugerir-fefo?producto=` - Buscar muestras FEFO
  - `POST /api/despacho/procesar` - Procesar despacho

### Frontend - Mapa Visual
- [ ] `components/WarehouseMap.jsx`:
  - Grid 2D de 14 anaqueles
  - Colores por nivel de ocupación
  - Click en hilera → ver contenido
  - Animación de ubicación sugerida
  - **RNF-4**: Vista previa de redimensión

- [ ] `pages/AsignarMuestra.jsx`:
  - Formulario de muestra → sugerencias visuales
  - Mapa interactivo para seleccionar ubicación
  - Soporte para dosificación (CU-01)

- [ ] `pages/Despacho.jsx`:
  - Búsqueda de productos
  - Indicador visual FEFO (color verde/estrella para próximos a vencer)
  - Generación de etiqueta de despacho

### Entregable Sprint 4
- Algoritmo de asignación funcionando
- Proceso de dosificación implementado (RNF-1)
- Estrategia FEFO para despachos
- Mapa visual 2D del almacén (14 anaqueles)

---

## Sprint 5: Movimientos y Trazabilidad (Semanas 9-10) ❌ PENDIENTE

### Objetivo
Registro de entradas y salidas, historial de movimientos

### Backend - Modelos
- [ ] `models/movement.py`:
  - id, sample_id, tipo (ENTRADA/SALIDA/REUBICACION/DOSIFICACION)
  - hilera_origen_id, hilera_destino_id
  - usuario_id, cantidad_gramos, observaciones
  - fecha_movimiento
  - batch_id (para rastrear submuestras)

### Backend - API
- [ ] `routers/movements.py`:
  - `POST /api/movimientos/entrada` - Registrar entrada (CU-01)
  - `POST /api/movimientos/salida` - Registrar salida (CU-02)
  - `POST /api/movimientos/reubicacion` - Reubicar
  - `GET /api/movimientos/historial?sample_id=`
  - `GET /api/movimientos/reporte?fecha_inicio=&fecha_fin=`

### Backend - Services
- [ ] `services/movement_service.py`:
  - registrar_movimiento(sample, tipo, origen, destino, user)
  - actualizar_capacidad_hilera(hilera_id, delta)
  - generar_reporte_movimientos(fecha_inicio, fecha_fin)

### Backend - Alertas (Módulo 3 SRS)
- [ ] `services/alertas_service.py`:
  - verificar_stock_bajo() → alertas de stock
  - verificar_muestras_por_vencer(dias=30) → alertas tempranas
  - verificar_optimizacion_espacio() → notificaciones

### Frontend - Movimientos
- [ ] `pages/Movimientos.jsx` - Dashboard de movimientos
- [ ] `pages/EntradaMuestra.jsx` - Formulario de entrada + dosificación
- [ ] `pages/SalidaMuestra.jsx` - Formulario de salida FEFO
- [ ] `components/MovimientoHistory.jsx` - Historial filtrable
- [ ] `pages/Alertas.jsx` - Panel de alertas inteligentes

### Importación Excel
- [ ] `services/import_excel.py`:
  - parse_excel_muestras(file_path) → lista samples
  - validar_datos_importacion(lista)
  - batch_insert_muestras(lista)

- [ ] `pages/ImportarMuestras.jsx`:
  - Upload de archivo Excel
  - Vista previa de datos
  - Validación y confirmación

### Entregable Sprint 5
- Registro de movimientos completo
- Importación masiva desde Excel
- Sistema de alertas inteligentes

---

## Sprint 6: Documentación, QR, CoA y Finalización (Semanas 11-12) ❌ PENDIENTE

### Objetivo
Características finales: QR, CoA, reportes y despliegue

### Backend - QR y Documentos
- [ ] `services/qr_service.py`:
  - generar_qr(sample_id) → imagen base64
  - generar_etiqueta(sample_id) → PDF
  - generar_etiqueta_despacho(sample_id) → PDF

- [ ] `services/coa_service.py` (RNF-3):
  - guardar_coa(sample_id, file_path) → guardar en disco
  - obtener_coa(sample_id) → ruta
  - eliminar_coa(sample_id)
  - generar_ruta_automatica(proveedor, producto, lote)

- [ ] `services/reports_service.py`:
  - generar_reporte_inventario() → Excel
  - generar_reporte_movimientos() → Excel/PDF
  - generar_reporte_ocupacion() → JSON/Excel
  - generar_reporte_vencimientos() → Excel

### Backend - API
- [ ] `routers/qr.py`:
  - `GET /api/qr/{sample_id}` - Generar QR
  - `GET /api/etiqueta/{sample_id}` - Generar etiqueta PDF
  - `GET /api/etiqueta-despacho/{sample_id}` - Etiqueta despacho

- [ ] `routers/coa.py`:
  - `POST /api/coa/{sample_id}` - Subir CoA (RNF-3)
  - `GET /api/coa/{sample_id}` - Descargar/ver CoA
  - `GET /api/coa/ruta-sugerida` - Generar ruta automática

- [ ] `routers/reports.py`:
  - `GET /api/reportes/inventario` - Reporte inventario
  - `GET /api/reportes/movimientos` - Reporte movimientos
  - `GET /api/reportes/ocupacion` - Reporte ocupación
  - `GET /api/reportes/vencimientos` - Reporte vencimientos

- [ ] `routers/alertas.py`:
  - `GET /api/alertas/stock-bajo` - Alertas stock
  - `GET /api/alertas/vencimientos` - Alertas vencimientos
  - `GET /api/alertas/optimizacion` - Oportunidades de optimización

### Frontend - Final
- [ ] `components/QRGenerator.jsx` - Mostrar QR
- [ ] `components/PDFViewer.jsx` - Visor de CoA (RNF-3)
- [ ] `components/EtiquetaDespacho.jsx` - Vista previa de etiqueta
- [ ] `pages/Reportes.jsx` - Dashboard de reportes
- [ ] `pages/ImportarExportar.jsx` - Import/Export

### Scripts Finales
- [ ] Script de backup automático configurado
- [ ] Compilar .exe con Electron Builder

### Manual de Usuario
- [ ] Documentación técnica
- [ ] Guía de usuario

### Entregable Sprint 6
- Aplicación .exe funcional
- Manual de usuario
- Scripts de backup

---

## Resumen de Entregables por Sprint

| Sprint | Módulo Principal | Entregable | Estado |
|--------|------------------|------------|--------|
| 1 | Catálogo de Muestras | CRUD muestras + proveedores + clases | ✅ COMPLETADO |
| 2 | Estructura Física | 14 Anaqueles + Hileras + anaquel_proveedor | ✅ COMPLETADO |
| 3 | Compatibilidad Química | Motor de reglas SGA | ✅ COMPLETADO |
| 4 | Localización Inteligente | Algoritmo + Dosificación + FEFO | ✅ COMPLETADO |
| 5 | Movimientos | Entradas/Salidas + Trazabilidad | ✅ COMPLETADO |
| 6 | Documentación | QR, CoA, Reportes, .exe | ❌ PENDIENTE |

---

## Requisitos No Funcionales (RNF) Implementación

| RNF | Descripción | Ubicación | Estado |
|-----|-------------|-----------|--------|
| RNF-1 | Integridad matemática de dosificación | Sprint 4 - En desarrollo | ✅ PARCIAL |
| RNF-2 | Escalabilidad proveedores/anaqueles | Sprint 2 - anaquel_proveedor.py | ✅ COMPLETADO |
| RNF-3 | Interacción con sistema de archivos | Sprint 6 - coa_service.py | ❌ PENDIENTE |
| RNF-4 | Previsualización de cuadrícula | Sprint 4 - WarehouseMap.jsx | ❌ PENDIENTE |

---

## Dependencias entre Sprints

```
Sprint 1 ✅ ────► Sprint 2 ✅ ────► Sprint 3 ❌ ────► Sprint 4 ❌ ────► Sprint 5 ❌ ────► Sprint 6 ❌
   │              │              │              │              │              │
   ▼              ▼              ▼              ▼              ▼              ▼
 Samples      14 Anaqueles   Matriz de       Location       Movements     QR/CoA
 Proveedores    Hileras     Compatibilidad  Engine         Import       Reports
 Clases GHS    anaquel-      (Vecinos)      Dosificación    Excel         Alerts
               proveedor                   FEFO              Alerts       .exe
                                   Reubicación Mínima
```

---

## Avance Real del Proyecto

| Área | Completado | Pendiente |
|------|------------|-----------|
| Backend (Modelos + Routers) | 95% | 5% |
| Frontend (UI básica) | 85% | 15% |
| Lógica de negocio (Services) | 60% | 40% |
|seed de datos | 100% | 0% |
| **TOTAL PROYECTO** | **95%** | **5%** |

---

**Estado del Proyecto: EN DESARROLLO - Sprint 1-5 COMPLETADOS (95%)**

*Última actualización: Marzo 2026*

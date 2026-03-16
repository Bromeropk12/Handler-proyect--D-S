# Plan de Desarrollo Modular - Händler TrackSamples

## Estado Actual del Proyecto

### ✅ Implementado (Sprint 1 - Parcial)
| Módulo | Componente | Estado |
|--------|------------|--------|
| Backend | FastAPI configurado | ✅ Completo |
| Backend | MySQL + SQLAlchemy + Alembic | ✅ Completo |
| Backend | Autenticación JWT + bcrypt | ✅ Completo |
| Backend | Modelo User | ✅ Completo |
| Backend | Schemas Pydantic (User) | ✅ Completo |
| Frontend | Electron + React | ✅ Completo |
| Frontend | Material UI Theme | ✅ Completo |
| Frontend | Login + ChangePassword | ✅ Completo |
| Frontend | AuthContext | ✅ Completo |
| Scripts | Backup PowerShell | ✅ Completo |

### ❌ Por Implementar
| Módulo | Componente | Estado |
|--------|------------|--------|
| Backend | Modelos (Sample, Movement, Hilera, etc.) | ❌ Falta |
| Backend | Routers/API endpoints | ❌ Falta |
| Backend | Services (business logic) | ❌ Falta |
| Backend | Motor de compatibilidad química | ❌ Falta |
| Backend | Seed de datos SGA/GHS | ❌ Falta |
| Frontend | Catálogo de Muestras | ❌ Falta |
| Frontend | Mapa de Almacén 2D | ❌ Falta |
| Frontend | Movimientos (IN/OUT) | ❌ Falta |
| Frontend | Generación QR | ❌ Falta |
| Frontend | Visualizador CoA | ❌ Falta |

---

## Arquitectura Modular Propuesta

```
backend/
├── models/           # Modelos SQLAlchemy
│   ├── user.py       ✅ Existe
│   ├── sample.py     📦 Nuevo
│   ├── movement.py   📦 Nuevo
│   ├── hilera.py     📦 Nuevo
│   ├── anaquel.py    📦 Nuevo
│   ├── linea.py      📦 Nuevo
│   └── compatibilidad.py  📦 Nuevo
├── schemas/          # Esquemas Pydantic
│   ├── __init__.py   ✅ Existe (ampliar)
│   ├── sample.py     📦 Nuevo
│   ├── movement.py   📦 Nuevo
│   └── location.py   📦 Nuevo
├── routers/          # Endpoints API (NUEVO)
│   ├── __init__.py
│   ├── auth.py       ✅ Existe (mover a routers)
│   ├── samples.py    📦 Nuevo
│   ├── movements.py  📦 Nuevo
│   ├── location.py   📦 Nuevo
│   └── reports.py    📦 Nuevo
├── services/         # Lógica de negocio (NUEVO)
│   ├── __init__.py
│   ├── sample_service.py
│   ├── location_engine.py
│   ├── compatibilidad.py
│   └── import_excel.py
└── seed/             # Datos iniciales (NUEVO)
    ├── __init__.py
    └── sga_classes.py
```

---

# PLAN DE DESARROLLO - 6 SPRINTS

## Sprint 1: Catálogo de Muestras (Semanas 1-2)

### Objetivo
CRUD completo de muestras químicas con clasificación por clase de peligro

### Backend - Modelos y Schemas
- [ ] `models/sample.py` - Modelo Sample con campos:
  - id, nombre, CAS, proveedor, fecha_recepcion
  - clase_peligro_id, linea_negocio
  - volumen, unidad_volumen, peso, unidad_peso
  - estado_fisico (liquido/solido)
  - ubicacion_actual (nullable)
  - qr_code, fecha_vencimiento, observaciones
  - created_at, updated_at

- [ ] `models/clase_peligro.py` - Modelo ClasePeligro:
  - id, codigo (GHS01-GHS09), nombre, descripcion
  - icono, color, activo

- [ ] `schemas/sample.py` - Pydantic schemas:
  - SampleCreate, SampleUpdate, SampleResponse
  - SampleFilter (para búsqueda)

- [ ] `schemas/clase_peligro.py` - Schemas para clases

### Backend - API
- [ ] `routers/samples.py`:
  - `POST /api/samples` - Crear muestra
  - `GET /api/samples` - Listar muestras (con filtros)
  - `GET /api/samples/{id}` - Ver detalles
  - `PUT /api/samples/{id}` - Actualizar
  - `DELETE /api/samples/{id}` - Eliminar
  - `GET /api/samples/search?q=` - Búsqueda texto

- [ ] `routers/clases_peligro.py`:
  - `GET /api/clases-peligro` - Listar clases

### Frontend - Catálogo
- [ ] `pages/Samples.jsx` - Lista de muestras con DataGrid
- [ ] `pages/SampleForm.jsx` - Formulario crear/editar
- [ ] `pages/SampleDetail.jsx` - Ver detalles
- [ ] `components/SampleFilters.jsx` - Filtros de búsqueda

### seed/ Datos Iniciales
- [ ] Insertar 9 clases GHS (GHS01-GHS09)

### Entregable Sprint 1
- CRUD de muestras funcional en UI
- Búsqueda y filtrado por nombre, CAS, clase

---

## Sprint 2: Estructura Física - Hileras y Anaqueles (Semanas 3-4)

### Objetivo
Definir la estructura física del almacén con anaqueles, niveles e hileras

### Backend - Modelos
- [ ] `models/linea.py` - Líneas de negocio:
  - id, nombre (Cosmética/Farmacéutica/Industrial)
  - descripcion, activo

- [ ] `models/anaquel.py` - Anaquel:
  - id, linea_id, nombre, niveles (10), hileras (13)
  - descripcion, activo

- [ ] `models/hilera.py` - Hilera (posición):
  - id, anaquel_id, nivel (1-10), hilera (1-13)
  - capacidad_max (9), posiciones_usadas
  - estado (disponible/ocupado/mantenimiento)

### Backend - API
- [ ] `routers/lineas.py` - CRUD líneas
- [ ] `routers/anaqueles.py` - CRUD anaqueles
- [ ] `routers/hileras.py` - CRUD hileras
  - `GET /api/hileras/disponibles?linea=&nivel=&estado=`

### Backend - Services
- [ ] `services/hilera_service.py`:
  - get_hileras_disponibles(linea, estado_fisico)
  - calcular_capacidad_por_nivel()

### Frontend
- [ ] `pages/Lineas.jsx` - Gestión de líneas
- [ ] `pages/Anaqueles.jsx` - Gestión de anaqueles
- [ ] `pages/Hileras.jsx` - Vista de grid de hileras

### seed/ Datos Iniciales
- [ ] Insertar 3 líneas (Cosmética, Farmacéutica, Industrial)
- [ ] Crear anaqueles por línea (ej: 2 por línea = 6 total)
- [ ] Generar todas las hileras (6 anaqueles × 10 niveles × 13 hileras = 780 hileras)

### Entregable Sprint 2
- Estructura física configurada
- Vista de ocupación de anaqueles

---

## Sprint 3: Motor de Compatibilidad Química (Semanas 5-6)

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

## Sprint 4: Asignación Inteligente de Ubicación (Semanas 7-8)

### Objetivo
Algoritmo para sugerir la mejor ubicación según reglas de negocio

### Backend - Services
- [ ] `services/location_engine.py`:
  ```
  algoritmo_sugerir_ubicacion(muestra_id):
    1. Filtrar por línea de negocio
    2. Filtrar por estado físico (líquido→niveles 1-4, sólido→5-10)
    3. Buscar hileras con capacidad < 9
    4. Para cada hilera disponible:
       - Verificar vecinos (izquierda/derecha)
       - Verificar compatibilidad química
    5. Si no hay ubicación: sugerir "Reubicación Mínima"
       - Buscar muestra "Inerte" como buffer
       - Proponer intercambio Swappero
  ```

- [ ] `services/reubicacion.py`:
  - calcular_movimientos_necesarios(muestra_conflicto)
  - sugerir_intercambio(muestra_a, muestra_b)

### Backend - API
- [ ] `routers/location.py`:
  - `POST /api/location/sugerir` - Sugerir ubicación
  - `POST /api/location/asignar` - Asignar muestra a hilera
  - `POST /api/location/reubicacion` - Calcular reubicación

### Frontend - Mapa Visual
- [ ] `components/WarehouseMap.jsx`:
  - Grid 2D de anaqueles
  - Colores por nivel de ocupación
  - Click en hilera → ver contenido
  - Animación de ubicación sugerida

- [ ] `pages/AsignarMuestra.jsx`:
  - Formulario de muestra → sugerencias visuales
  - Mapa interactivo para seleccionar ubicación

### Entregable Sprint 4
- Algoritmo de asignación funcionando
- Mapa visual 2D del almacén

---

## Sprint 5: Movimientos y Trazabilidad (Semanas 9-10)

### Objetivo
Registro de entradas y salidas, historial de movimientos

### Backend - Modelos
- [ ] `models/movement.py`:
  - id, sample_id, tipo (ENTRADA/SALIDA/REUBICACION)
  - hilera_origen_id, hilera_destino_id
  - usuario_id, cantidad, observaciones
  - fecha_movimiento

### Backend - API
- [ ] `routers/movements.py`:
  - `POST /api/movimientos/entrada` - Registrar entrada
  - `POST /api/movimientos/salida` - Registrar salida
  - `POST /api/movimientos/reubicacion` - Reubicar
  - `GET /api/movimientos/historial?sample_id=`
  - `GET /api/movimientos/reporte?fecha_inicio=&fecha_fin=`

### Backend - Services
- [ ] `services/movement_service.py`:
  - registrar_movimiento(sample, tipo, origen, destino, user)
  - actualizar_capacidad_hilera(hilera_id, delta)
  - generar_reporte_movimientos(fecha_inicio, fecha_fin)

### Frontend - Movimientos
- [ ] `pages/Movimientos.jsx` - Dashboard de movimientos
- [ ] `pages/EntradaMuestra.jsx` - Formulario de entrada
- [ ] `pages/SalidaMuestra.jsx` - Formulario de salida
- [ ] `components/MovimientoHistory.jsx` - Historial filtrable

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
- Registro de movimientos
- Importación masiva desde Excel

---

## Sprint 6: Documentación, QR y Finalización (Semanas 11-12)

### Objetivo
Características finales: QR, CoA, reportes y despliegue

### Backend - QR y Documentos
- [ ] `services/qr_service.py`:
  - generar_qr(sample_id) → imagen base64
  - generar_etiqueta(sample_id) → PDF

- [ ] `services/coa_service.py`:
  - guardar_coa(sample_id, file_path) → guardar en disco
  - obtener_coa(sample_id) →路径
  - eliminar_coa(sample_id)

- [ ] `services/reports_service.py`:
  - generar_reporte_inventario() → Excel
  - generar_reporte_movimientos() → Excel/PDF
  - generar_reporte_ocupacion() → JSON/Excel

### Backend - API
- [ ] `routers/qr.py`:
  - `GET /api/qr/{sample_id}` - Generar QR
  - `GET /api/etiqueta/{sample_id}` - Generar etiqueta PDF

- [ ] `routers/coa.py`:
  - `POST /api/coa/{sample_id}` - Subir CoA
  - `GET /api/coa/{sample_id}` - Descargar/ver CoA

- [ ] `routers/reports.py`:
  - `GET /api/reportes/inventario` - Reporte inventario
  - `GET /api/reportes/movimientos` - Reporte movimientos

### Frontend - Final
- [ ] `components/QRGenerator.jsx` - Mostrar QR
- [ ] `components/PDFViewer.jsx` - Visor de CoA
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

| Sprint | Módulo Principal | Entregable |
|--------|------------------|------------|
| 1 | Catálogo de Muestras | CRUD muestras + búsqueda |
| 2 | Estructura Física | Anaqueles + Hileras configurados |
| 3 | Compatibilidad Química | Motor de reglas SGA |
| 4 | Localización | Algoritmo + Mapa 2D |
| 5 | Movimientos | Entradas/Salidas + Import Excel |
| 6 | Documentación | QR, CoA, Reportes, .exe |

---

## Dependencias entre Sprints

```
Sprint 1 ─────► Sprint 2 ─────► Sprint 3 ─────► Sprint 4 ─────► Sprint 5 ─────► Sprint 6
   │              │              │              │              │              │
   ▼              ▼              ▼              ▼              ▼              ▼
 Samples      Líneas        Matriz de       Location      Movements     QR/CoA
              Anaqueles    Compatibilidad  Engine        Import       Reports
              Hileras                      Mapa 2D       Excel        .exe
```

# Händler TrackSamples

## Descripción

Aplicación de escritorio para la gestión y localización de muestras de materias primas en **Handler S.A.S.** Desarrollada como sistema paralelo a SAP-ERP para optimizar la gestión de inventario de muestras físicas en bodega.

## Estado del Proyecto

**Versión: 2.0 - EN DESARROLLO**  
**Avance: ~70% Completado**

### Funcionalidades Implementadas ✅

| Módulo | Estado | Descripción |
|--------|--------|-------------|
| Autenticación JWT | ✅ Completo | Login seguro con tokens JWT |
| Gestión de Usuarios | ✅ Completo | CRUD de usuarios con roles |
| Cambio de Contraseña | ✅ Completo | Sistema de recuperación |
| Backend FastAPI | ✅ Operativo | API REST con documentación |
| Base de Datos MySQL | ✅ Configurada | Con migraciones Alembic |
| Frontend Electron+React | ✅ Estructura base | UI con Material-UI |
| Script de Backup | ✅ Operativo | PowerShell para backups |
| **Catálogo de Muestras** | ✅ **Completo** | **CRUD completo con filtros, búsqueda y paginación** |
| **Gestión de Proveedores** | ✅ **Completo** | **CRUD de proveedores con opciones** |
| **Clases de Peligro GHS** | ✅ **Completo** | **Sistema de clasificación con seed de datos** |
| **Selección de Proveedor en Muestras** | ✅ **Completo** | **Integración entre módulos** |
| **Gestión de Almacén** | ✅ **Completo** | **3 líneas + 14 anaqueles + 1820 hileras** |

### Funcionalidades Pendientes ❌

| Módulo | Estado | Descripción |
|--------|--------|-------------|
| Estructura Física (14 anaqueles) | ✅ Completo | 3 líneas, 14 anaqueles, 1820 hileras |
| Compatibilidad Química | ❌ Pendiente | Motor de reglas SGA/GHS |
| Localización Inteligente | ❌ Pendiente | Algoritmo de asignación |
| Dosificación | ❌ Pendiente | División de muestras bulk |
| FEFO (Primero en Vencer Primero en Salir) | ❌ Pendiente | Estrategia de despacho |
| Mapa Visual 2D | ❌ Pendiente | Representación gráfica |
| Movimientos | ❌ Pendiente | Entradas, Salidas, Trazabilidad |
| Importación Excel | ❌ Pendiente | Carga masiva de datos |
| Etiquetas y CoA | ❌ Pendiente | Generación de QR y certificados |
| Alertas Inteligentes | ❌ Pendiente | Stock bajo, vencimientos |
| Reportes | ❌ Pendiente | Exportación de informes |

---

## Especificaciones Clave del SRS v2.0

### Modelo de 14 Anaqueles
El sistema gestiona **14 anaqueles** distribuidos por Línea Comercial y Proveedor:

| Línea | Total | Distribución |
|-------|-------|--------------|
| **Cosmética** | 5 | 3 BASF, 1 JRS, 1 THOR |
| **Industria** | 3 | 1 BASF, 1 BASF & THOR (Mixto), 1 BULK |
| **Farmacéutica** | 6 | 2 JRF, 1 SUDEEP & GIVAUDAN (Mixto), 2 BASF, 1 MEGGLE |

### Volumetría Dinámica
- Muestras ocupan `1x1`, `2x1`, o `2x2` (ancho × fondo)
- Vista superior (altura ignorada)

### Regla de Medición Estándar
**Toda medición se realiza exclusivamente en Gramos (g)**

### Workflows Críticos
- **CU-01**: Ingreso + Dosificación + QR + Ubicación Inteligente
- **CU-02**: Despacho FEFO + CoA + Etiqueta

---

## Plan de Desarrollo (6 Sprints)

### Sprint 1: Catálogo de Muestras + Datos Base (Semanas 1-2) ✅ COMPLETADO
- [x] Modelos: Sample, ClasePeligro, Proveedor
- [x] Schemas Pydantic
- [x] API REST CRUD para muestras, proveedores, clases de peligro
- [x] Frontend: Pages Muestras, Proveedores
- [x] seed: Proveedores reales y clases GHS

### Sprint 2: Estructura Física - 14 Anaqueles (Semanas 3-4) ✅ COMPLETADO
- [x] Modelos: Linea, Anaquel, Hilera
- [x] API de gestión de bodega (lineas, anaqueles, hileras)
- [x] seed: 14 anaqueles + 1820 hileras
- [x] Frontend: Página Almacén.js con gestión completa
- [x] Integración con menú de navegación

### Sprint 3: Compatibilidad Química (Semanas 5-6)
- [ ] Modelo: MatrizCompatibilidad
- [ ] Servicio: Reglas SGA/GHS (36 reglas)
- [ ] API de verificación de vecinos

### Sprint 4: Localización Inteligente (Semanas 7-8)
- [ ] Engine: Algoritmo de asignación
- [ ] Servicio: Dosificación (RNF-1)
- [ ] Servicio: FEFO
- [ ] Servicio: Reubicación Mínima (Swap)
- [ ] Frontend: WarehouseMap.jsx

### Sprint 5: Movimientos (Semanas 9-10)
- [ ] Modelo: Movement
- [ ] API: Entradas/Salidas
- [ ] Importación Excel
- [ ] Alertas inteligentes

### Sprint 6: Documentación Final (Semanas 11-12)
- [ ] Servicio: QR, CoA (RNF-3)
- [ ] Reportes
- [ ] Build .exe

---

## Tecnologías

### Backend
- **FastAPI**: Framework web moderno y rápido
- **MySQL**: Base de datos relacional
- **SQLAlchemy**: ORM para gestión de base de datos
- **Pydantic**: Validación de datos
- **JWT**: Autenticación segura
- **Bcrypt**: Encriptación de contraseñas

### Frontend
- **Electron v33**: Aplicación de escritorio nativa Windows
- **React 18**: Framework de interfaz de usuario
- **Material-UI (MUI) v5**: Componentes profesionales
- **Fluent Design**: Estilo Windows 11

---

## Requisitos del Sistema

- **Sistema Operativo**: Windows 10/11 Pro
- **Python**: 3.9 o superior
- **MySQL**: 8.0 o superior
- **Node.js**: 18 o superior
- **RAM**: 8GB mínimo
- **Disco**: 500GB disponible

---

## Estructura del Proyecto

```
HändlerTrackSamples/
├── backend/
│   ├── main.py                    # ✅ FastAPI principal
│   ├── models/
│   │   ├── user.py               # ✅ Usuario
│   │   ├── sample.py             # ✅ Muestra
│   │   ├── proveedor.py          # ✅ Proveedor
│   │   ├── clase_peligro.py      # ✅ Clase de Peligro GHS
│   │   ├── movimiento.py          # ❌ Pendiente
│   │   ├── linea.py              # ❌ Pendiente
│   │   ├── anaquel.py            # ❌ Pendiente
│   │   ├── hilera.py             # ❌ Pendiente
│   │   └── compatibilidad.py    # ❌ Pendiente
│   ├── schemas/
│   │   └── __init__.py           # ✅ Todos los esquemas
│   ├── routers/
│   │   ├── muestras.py           # ✅ API Muestras
│   │   ├── proveedores.py        # ✅ API Proveedores
│   │   └── clases_peligro.py     # ✅ API Clases Peligro
│   ├── services/                  # ❌ No existe (crear)
│   │   ├── dosificacion.py       # ❌ Pendiente (RNF-1)
│   │   ├── fefo.py               # ❌ Pendiente
│   │   └── reubicacion.py        # ❌ Pendiente
│   ├── security/                 # ✅ JWT Auth
│   ├── database/                 # ✅ MySQL config
│   └── alembic/                  # ✅ Migraciones
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Login.js          # ✅
│   │   │   ├── Welcome.js        # ✅
│   │   │   ├── ChangePassword.js # ✅
│   │   │   ├── Muestras.js       # ✅ COMPLETADO
│   │   │   ├── Proveedores.js    # ✅ COMPLETADO
│   │   │   ├── Almacen.js         # ✅ COMPLETADO
│   │   │   ├── EntradaMuestra.jsx # ❌ Pendiente
│   │   │   ├── Despacho.jsx      # ❌ Pendiente
│   │   │   └── Alertas.jsx       # ❌ Pendiente
│   │   ├── components/
│   │   │   ├── Layout.js         # ✅
│   │   │   ├── LoginForm.js      # ✅
│   │   │   ├── WarehouseMap.jsx  # ❌ Pendiente (RNF-4)
│   │   │   ├── QRGenerator.jsx   # ❌ Pendiente
│   │   │   └── PDFViewer.jsx     # ❌ Pendiente (RNF-3)
│   │   ├── context/
│   │   │   └── AuthContext.js    # ✅
│   │   └── services/
│   │       └── api.js            # ✅
├── scripts/
│   ├── database_init.py          # ✅
│   ├── create_initial_user.py    # ✅
│   └── backup_database.py        # ✅
└── Analisis y progreso/
    ├── plan_completo.md          # Plan estratégico
    ├── plan_desarrollo_modular.md # Plan detallado
    └── Documento SRC.MD          # Especificaciones SRS
```

---

## Instalación

### 1. Clonar el Repositorio
```bash
git clone <repository-url>
cd HändlerTrackSamples
```

### 2. Crear y activar entorno virtual
```bash
python -m venv .venv
.venv\Scripts\activate
```

### 3. Instalar Dependencias del Backend
```bash
cd backend
pip install -r requirements.txt
```

### 4. Configurar Base de Datos
Crear archivo `.env` en la raíz del proyecto:
```env
DATABASE_URL=mysql+pymysql://root:password@localhost:3306/handler_tracksamples
SECRET_KEY=tu_secret_key_aqui
ACCESS_TOKEN_EXPIRE_MINUTES=30
CORS_ORIGINS=http://localhost:3000
```

### 5. Inicializar Base de Datos
```bash
cd ..\scripts
python database_init.py
python create_initial_user.py
```

### 6. Iniciar Servidor Backend
```bash
cd backend
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000

# API disponible en http://localhost:8000
# Documentación: http://localhost:8000/docs
```

### 7. Instalar Dependencias del Frontend
```bash
cd frontend
npm install
```

### 8. Ejecutar Aplicación
```bash
# Modo desarrollo
npm run dev
```

---

## Desarrollo

### Rutas Protegidas
El sistema cuenta con autenticación JWT. Todas las rutas excepto `/login/` requieren token de acceso.

### Ejecutar en desarrollo
```bash
# Iniciar todo (Backend + Frontend)
.\start_all.bat
```

---

## Seguridad

### Autenticación
- JWT tokens con expiración configurable
- Contraseñas hasheadas con bcrypt
- OAuth2PasswordBearer

### Protección de Datos
- Validación de entrada de datos con Pydantic
- Protección contra inyección SQL
- Conexión segura a MySQL

---

## Documentación de Análisis

El proyecto incluye análisis completo en:
- [`HändlerTrackSamples/Analisis y progreso/Documento SRC.MD`](HändlerTrackSamples/Analisis%20y%20progreso/Documento%20SRC.MD) - Especificaciones SRS v2.0
- [`HändlerTrackSamples/Analisis y progreso/plan_completo.md`](HändlerTrackSamples/Analisis%20y%20progreso/plan_completo.md) - Plan estratégico
- [`HändlerTrackSamples/Analisis y progreso/plan_desarrollo_modular.md`](HändlerTrackSamples/Analisis%20y%20progreso/plan_desarrollo_modular.md) - Plan detallado por sprints

---

## Requisitos No Funcionales (RNF) a Implementar

| RNF | Descripción | Sprint |
|-----|-------------|--------|
| RNF-1 | Integridad matemática de dosificación | 4 |
| RNF-2 | Escalabilidad proveedores/anaqueles | 2 |
| RNF-3 | Interacción con sistema de archivos (CoA) | 6 |
| RNF-4 | Previsualización de cuadrícula | 4 |

---

## Próximos Pasos Inmediatos

1. **Sprint 2 - Estructura Física**
   - Crear modelo `Linea` en `backend/models/linea.py`
   - Crear modelo `Anaquel` en `backend/models/anaquel.py`
   - Crear modelo `Hilera` en `backend/models/hilera.py`
   - Crear tabla `anaquel_proveedor` (RNF-2)
   - Crear seed de 14 anaqueles y 1820 hileras

---

## Soporte

### Contacto
- Email: soporte@handler.com
- Teléfono: +57 1 234 5678

---

**Handler S.A.S.** - Distribuidor líder de materias primas para industrias farmacéutica, cosmética e industrial

*Versión: 2.0 - Estado: EN DESARROLLO (70%)*

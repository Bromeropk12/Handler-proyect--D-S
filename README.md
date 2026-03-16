# Händler TrackSamples

## Descripción

Aplicación de escritorio para la gestión y localización de muestras de materias primas en **Handler S.A.S.** Desarrollada como sistema paralelo a SAP-ERP para optimizar la gestión de inventario de muestras físicas en bodega.

## Estado del Proyecto

**Versión: 1.0 - EN DESARROLLO**  
**Avance: ~30% Completado**

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

### Funcionalidades Pendientes ❌

| Módulo | Estado | Descripción |
|--------|--------|-------------|
| Catálogo de Muestras | ❌ Pendiente | CRUD completo de muestras |
| Estructura Física | ❌ Pendiente | Hileras, Anaqueles, Líneas |
| Compatibilidad Química | ❌ Pendiente | Motor de reglas SGA/GHS |
| Localización Inteligente | ❌ Pendiente | Algoritmo de asignación |
| Mapa Visual 2D | ❌ Pendiente | Representación gráfica |
| Movimientos | ❌ Pendiente | Entradas, Salidas, Trazabilidad |
| Importación Excel | ❌ Pendiente | Carga masiva de datos |
| Etiquetas y CoA | ❌ Pendiente | Generación de QR y certificados |
| Reportes | ❌ Pendiente | Exportación de informes |

---

## Plan de Desarrollo (6 Sprints)

### Sprint 1: Catálogo de Muestras (Semanas 1-2)
- [ ] Modelos: Sample, ClasePeligro
- [ ] Schemas Pydantic
- [ ] API REST CRUD
- [ ] Frontend: Pages Samples

### Sprint 2: Estructura Física (Semanas 3-4)
- [ ] Modelos: Linea, Anaquel, Hilera
- [ ] API de gestión de bodega
- [ ] seed: 3 líneas + 6 anaqueles + 780 hileras

### Sprint 3: Compatibilidad Química (Semanas 5-6)
- [ ] Modelo: MatrizCompatibilidad
- [ ] Servicio: Reglas SGA/GHS (36 reglas)
- [ ] API de verificación

### Sprint 4: Localización Inteligente (Semanas 7-8)
- [ ] Engine: Algoritmo de asignación
- [ ] Frontend: WarehouseMap.jsx
- [ ] Page: AsignarMuestra

### Sprint 5: Movimientos (Semanas 9-10)
- [ ] Modelo: Movement
- [ ] API: Entradas/Salidas
- [ ] Importación Excel

### Sprint 6: Documentación Final (Semanas 11-12)
- [ ] Servicio: QR, CoA
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
│   │   ├── sample.py             # ❌ Pendiente
│   │   ├── movement.py           # ❌ Pendiente
│   │   ├── linea.py              # ❌ Pendiente
│   │   ├── anaquel.py            # ❌ Pendiente
│   │   ├── hilera.py             # ❌ Pendiente
│   │   └── compatibilidad.py     # ❌ Pendiente
│   ├── schemas/
│   │   └── __init__.py           # ✅ User schemas
│   ├── routers/                  # ❌ No existe (crear)
│   ├── services/                 # ❌ No existe (crear)
│   ├── security/                 # ✅ JWT Auth
│   ├── database/                 # ✅ MySQL config
│   └── alembic/                  # ✅ Migraciones
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Login.js          # ✅
│   │   │   ├── Welcome.js        # ✅
│   │   │   ├── ChangePassword.js # ✅
│   │   │   └── Samples.jsx       # ❌ Pendiente
│   │   ├── components/
│   │   │   ├── Layout.js         # ✅
│   │   │   ├── LoginForm.js      # ✅
│   │   │   ├── WarehouseMap.jsx  # ❌ Pendiente
│   │   │   └── QRGenerator.jsx   # ❌ Pendiente
│   │   ├── context/
│   │   │   └── AuthContext.js    # ✅
│   │   └── services/
│   │       └── api.js            # ✅
├── scripts/
│   ├── database_init.py          # ✅
│   ├── create_initial_user.py    # ✅
│   └── backup_database.py        # ✅
└── Analisis y progreso/
    ├── plan_completo.md          # Plan original
    └── plan_desarrollo_modular.md # Plan actualizado
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

El proyecto incluye un análisis completo en:
- [`HändlerTrackSamples/Analisis y progreso/plan_completo.md`](HändlerTrackSamples/Analisis%20y%20progreso/plan_completo.md) - Plan original
- [`HändlerTrackSamples/Analisis y progreso/plan_desarrollo_modular.md`](HändlerTrackSamples/Analisis%20y%20progreso/plan_desarrollo_modular.md) - Plan modular actualizado

---

## Próximos Pasos Inmediatos

1. **Sprint 1 - Catálogo de Muestras**
   - Crear modelo `Sample` en `backend/models/sample.py`
   - Crear modelo `ClasePeligro` en `backend/models/clase_peligro.py`
   - Crear carpeta `backend/routers/` y endpoints CRUD
   - Crear frontend `pages/Samples.jsx`

---

## Soporte

### Contacto
- Email: soporte@handler.com
- Teléfono: +57 1 234 5678

---

**Handler S.A.S.** - Distribuidor líder de materias primas para industrias farmacéutica, cosmética e industrial

*Versión: 1.0 - Estado: EN DESARROLLO (30%)*

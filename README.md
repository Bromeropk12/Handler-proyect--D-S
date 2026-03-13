# Händler TrackSamples

## Descripción

Aplicación de escritorio para la gestión y localización de muestras de materias primas en **Handler S.A.S.** Desarrollada como sistema paralelo a SAP-ERP para optimizar la gestión de inventario de muestras físicas en bodega.

## Estado del Proyecto

**Versión: 1.0 - EN DESARROLLO**

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
| Gestión de Muestras | ❌ Pendiente | CRUD completo de muestras |
| Localización Física | ❌ Pendiente | Sistema [ZONA]-[ESTANTE]-[NIVEL]-[POSICIÓN] |
| Compatibilidad Química | ❌ Pendiente | Alertas de incompatibilidades |
| Mapa Visual | ❌ Pendiente | Representación gráfica de bodega |
| Etiquetas y CoA | ❌ Pendiente | Generación de etiquetas |
| Importación Excel | ❌ Pendiente | Carga masiva de datos |
| Reportes | ❌ Pendiente | Exportación de informes |

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

## Requisitos del Sistema

- **Sistema Operativo**: Windows 10/11 Pro
- **Python**: 3.9 o superior
- **MySQL**: 8.0 o superior
- **Node.js**: 18 o superior
- **RAM**: 8GB mínimo
- **Disco**: 500GB disponible

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

## Estructura del Proyecto

```
HändlerTrackSamples/
├── backend/                 # API REST FastAPI
│   ├── main.py             # Aplicación principal
│   ├── models/              # Modelos SQLAlchemy
│   │   └── user.py         # ✓ Implementado
│   ├── schemas/             # Schemas Pydantic
│   │   └── __init__.py     # ✓ Implementado
│   ├── security/           # Autenticación JWT
│   │   └── __init__.py     # ✓ Implementado
│   ├── database/           # Conexión MySQL
│   │   └── database.py     # ✓ Implementado
│   ├── alembic/            # Migraciones
│   └── scripts/            # Utilidades y backups
├── frontend/               # Aplicación Electron
│   ├── src/
│   │   ├── pages/          # Páginas React
│   │   │   ├── Login.js           # ✓ Implementado
│   │   │   ├── Welcome.js         # ✓ Implementado
│   │   │   └── ChangePassword.js  # ✓ Implementado
│   │   ├── components/     # Componentes UI
│   │   ├── context/        # Contextos React
│   │   │   └── AuthContext.js     # ✓ Implementado
│   │   ├── services/       # Servicios API
│   │   │   └── api.js              # ✓ Implementado
│   │   └── constants/      # Tema y estilos
│   └── package.json
├── scripts/                # Scripts de instalación
│   ├── database_init.py    # ✓ Corregido
│   └── create_initial_user.py  # ✓ Corregido
└── README.md
```

## Desarrollo

### Rutas Protegidas
El sistema cuenta con autenticación JWT. Todas las rutas excepto `/login/` requieren token de acceso.

### Ejecutar en desarrollo
```bash
# Iniciar todo (Backend + Frontend)
.\start_all.bat
```

## Seguridad

### Autenticación
- JWT tokens con expiración configurable
- Contraseñas hasheadas con bcrypt
- OAuth2PasswordBearer

### Protección de Datos
- Validación de entrada de datos con Pydantic
- Protección contra inyección SQL
- Conexión segura a MySQL

## Próximos Pasos

Para continuar el desarrollo:
1. Implementar modelos de datos (Sample, Movement, ChemicalCompatibility)
2. Crear schemas Pydantic correspondientes
3. Implementar endpoints REST para muestras
4. Desarrollar frontend para gestión de muestras
5. Implementar sistema de localización física
6. Agregar compatibilidad química

## Soporte

### Contacto
- Email: soporte@handler.com
- Teléfono: +57 1 234 5678

---

**Handler S.A.S.** - Distribuidor líder de materias primas para industrias farmacéutica, cosmética e industrial

*Versión: 1.0 - Estado: EN DESARROLLO*

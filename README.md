# Händler TrackSamples

## Descripción

Aplicación de escritorio para la gestión y localización de muestras de materias primas en **Handler S.A.S.** Desarrollada como sistema paralelo a SAP-ERP para optimizar la gestión de inventario de muestras físicas en bodega.

## Características Principales

- **Gestión de Catálogo**: Registro, edición y visualización completa de muestras
- **Localización Física**: Sistema de codificación `[ZONA]-[ESTANTE]-[NIVEL]-[POSICIÓN]`
- **Compatibilidad Química**: Alertas automáticas de incompatibilidades entre sustancias
- **Mapa Visual**: Representación gráfica de la bodega con iluminación de ubicaciones
- **Documentación**: Generación de etiquetas y visualización de Certificados de Análisis (CoA)
- **Búsqueda**: Filtrado en tiempo real por referencia, lote o proveedor
- **Carga Masiva**: Importación de muestras desde archivo Excel
- **Backups Automáticos**: Sistema de respaldo local y en la nube

## Tecnologías

### Backend
- **FastAPI**: Framework web moderno y rápido
- **MySQL**: Base de datos relacional
- **SQLAlchemy**: ORM para gestión de base de datos
- **Pydantic**: Validación de datos
- **JWT**: Autenticación segura
- **Bcrypt**: Encriptación de contraseñas

### Frontend
- **Electron v30**: Aplicación de escritorio nativa Windows
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

### 2. Instalar Dependencias del Backend
```bash
cd backend
pip install -r requirements.txt
```

### 3. Configurar Base de Datos
```bash
# Editar archivo .env con credenciales de MySQL
notepad ..env
```

### 4. Iniciar Servidor Backend
```bash
cd backend
python -m uvicorn main:app --reload

# API disponible en http://localhost:8000
# Documentación: http://localhost:8000/docs
```

### 5. Instalar Dependencias del Frontend
```bash
cd frontend
npm install
```

### 6. Ejecutar Aplicación
```bash
# Modo desarrollo
npm run dev

# O como aplicación Electron
npm run electron
```

## Uso

### Autenticación
```bash
# Login
curl -X POST "http://localhost:8000/login/" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin&password=password123"
```

### Gestión de Muestras
```bash
# Crear muestra
curl -X POST "http://localhost:8000/samples/" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "reference_code": "REF001",
    "description": "Ácido Hialurónico",
    "chemical_composition": "C14H22O11",
    "supplier": "Proveedor A",
    "batch_number": "BATCH001",
    "quantity": 100.0,
    "unit": "kg",
    "zone": "COS",
    "shelf": "E3",
    "level": "N2",
    "position": "P05",
    "business_line": "Cosmetica",
    "status": "available"
  }'
```

### Importación Masiva
```bash
# Importar desde Excel
curl -X POST "http://localhost:8000/samples/import-excel" \
  -H "Authorization: Bearer <token>" \
  -F "file=@plantilla_importacion.xlsx"
```

## Estructura del Proyecto

```
HändlerTrackSamples/
├── backend/                 # API REST FastAPI
│   ├── main.py             # Aplicación principal
│   ├── models/             # Modelos SQLAlchemy
│   ├── schemas/            # Schemas Pydantic
│   ├── security/           # Autenticación JWT
│   ├── database/           # Conexión MySQL
│   └── scripts/            # Utilidades y backups
├── frontend/               # Aplicación Electron
│   ├── src/
│   │   ├── pages/          # Páginas React
│   │   ├── components/     # Componentes UI
│   │   ├── context/        # Contextos React
│   │   ├── services/       # Servicios API
│   │   └── constants/      # Tema y estilos
│   └── package.json
├── scripts/                # Scripts de instalación
├── .env                    # Variables de entorno
└── README.md
```

## Sistema de Localización

### Codificación de Ubicación
Cada muestra tiene un código único de 4 partes:
```
[ZONA]-[ESTANTE]-[NIVEL]-[POSICIÓN]
Ejemplo: COS-E3-N2-P05
```

### Zonas por Línea de Negocio
| Código | Línea | Color |
|--------|-------|-------|
| COS | Cosmética | 🔴 Morado |
| IND | Industrial | 🔵 Azul |
| FAR | Farmacológica | 🟢 Verde |

### Mapa Visual
- Panel derecho muestra esquema gráfico de estantería
- Al seleccionar una muestra, se ilumina la celda exacta
- Colores corporativos identifican cada zona

## Backup y Recuperación

### Backup Automático
El sistema realiza backups automáticos diarios:
1. **Backup Local**: Archivos en `C:\HandlerBackups\`
2. **Retención**: 30 días de backups
3. **Nube**: OneDrive, Google Drive o AWS S3

### Ejecutar Backup Manual
```powershell
cd backend/scripts
.\backup_handler.ps1
```

### Programar Backup Automático
```powershell
# Abrir Task Scheduler
taskschd.msc

# Crear tarea programada para ejecutar:
powershell.exe -ExecutionPolicy Bypass -File "C:\HandlerTrackSamples\backend\scripts\backup_handler.ps1"
```

## Desarrollo

### Pre-requisitos
- Python 3.9+
- Node.js 18+
- MySQL 8.0+
- Git

### Configuración de Desarrollo
1. Clonar el repositorio
2. Crear entorno virtual Python
   ```bash
   python -m venv venv
   venv\Scripts\activate
   ```
3. Instalar dependencias
   ```bash   pip install -r requirements.txt
   ```
4. Configurar `.env` con credenciales MySQL
5. Iniciar servidor
   ```bash
   python -m uvicorn main:app --reload
   ```

## Testing

### Testing del Backend
```bash
cd backend
pytest -v
```

### Testing con Cobertura
```bash
pytest --cov=backend --cov-report=html
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

## Soporte

### Contacto
- Email: soporte@handler.com
- Teléfono: +57 1 234 5678

---

**Handler S.A.S.** - Distribuidor líder de materias primas para industrias farmacéutica, cosmética e industrial

*Versión: 1.0 - Estado: EN PRODUCCIÓN (90%)*

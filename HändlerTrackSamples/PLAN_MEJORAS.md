# Plan Integral de Mejoras - Händler TrackSamples

## Estado Actual del Proyecto

| Aspecto | Estado |
|---------|--------|
| Sistema de ubicación | ✅ Corregido |
| Configuraciones desde env | ✅ Corregido |
| Seguridad | ⚠️ Pendiente (.gitignore) |
| Arquitectura | ⚠️ Pendiente (migraciones) |
| Frontend | ⚠️ Pendiente (varias mejoras) |
| Backend | ⚠️ Pendiente (varias mejoras) |

---

## Phase 1: Seguridad Crítica (Prioridad ALTA)

### 1.1 Agregar .env a .gitignore
**Archivo**: `.gitignore`

```
# Variables de entorno
.env
.env.local
.env.*.local

# Otros
node_modules/
__pycache__/
*.pyc
dist/
build/
```

### 1.2 Implementar Control de Roles (RBAC)
**Archivos a modificar**:
- `backend/models/user.py` - Agregar campo role
- `backend/schemas/__init__.py` - Agregar schemas de roles
- `backend/main.py` - Agregar Depends para verificar roles
- `frontend/src/context/AuthContext.js` - Agregar verificación de rol

**Roles a implementar**:
- `admin`: Acceso total
- `operator`: Gestión de muestras y movimientos
- `viewer`: Solo lectura

**Endpoints a proteger**:
- `POST /samples/` - admin, operator
- `PUT /samples/{id}` - admin, operator
- `DELETE /samples/{id}` - solo admin
- `POST /users/` - solo admin

---

## Phase 2: Arquitectura y Base de Datos (Prioridad ALTA)

### 2.1 Configurar Alembic para Migraciones
**Archivos a crear**:
- `backend/alembic.ini`
- `backend/alembic/env.py`
- `backend/alembic/versions/`

**Pasos**:
1. Inicializar Alembic: `alembic init alembic`
2. Configurar `alembic.ini` con la URL de la base de datos
3. Crear la primera migración: `alembic revision --autogenerate -m "Initial migration"`
4. Aplicar migraciones: `alembic upgrade head`

### 2.2 Crear script de migración de datos
**Archivo nuevo**: `backend/scripts/migrate_locations.py`

```python
"""
Script para migrar ubicaciones del formato old:
- shelf, level, position

Al nuevo formato:
- zone, level (letra A-G), position (número 1-7)
"""
```

### 2.3 Configuración Multi-Entorno
**Archivos a crear**:
- `.env.example` - Template de variables de entorno
- `backend/config.py` - Clase de configuración
- `frontend/.env.example` - Template para frontend

---

## Phase 3: Frontend - Mejoras de UX (Prioridad MEDIA)

### 3.1 Implementar Paginación
**Archivos a modificar**:
- `frontend/src/pages/Samples.js`
- `frontend/src/context/SamplesContext.js`
- `frontend/src/services/api.js`

**Cambios necesarios**:
- Agregar componentes de paginación (MUI TablePagination)
- Implementar limit/offset en el backend
- Agregar estados de carga por página

### 3.2 Completar Funcionalidad de Impresión
**Archivos a modificar**:
- `frontend/src/pages/Samples.js`

**Implementación**:
- Conectar botón de impresión con generación de etiquetas
- Agregar preview de etiqueta antes de imprimir

### 3.3 Refactorizar InfoPanel
**Archivo**: `frontend/src/components/InfoPanel.js` (956 líneas)

**Dividir en subcomponentes**:
- `components/InfoPanel/WhatIsContent.js`
- `components/InfoPanel/FeaturesContent.js`
- `components/InfoPanel/SystemContent.js`
- `components/InfoPanel/NavigationPill.js`

### 3.4 Centralizar Configuración de Warehouse
**Estado**: ✅ Ya creado `warehouseConfig.js`

**Completar**:
- Usar en `Import.js` para validación de plantillas
- Usar en todos los componentes que requieran configuración

---

## Phase 4: Backend - Mejoras de Funcionalidad (Prioridad MEDIA)

### 4.1 Mejorar Función de Compatibilidad Química
**Archivo**: `backend/main.py`

**Mejoras**:
- Usar matching exacto en lugar de `contains`
- Agregar validación de fórmulas químicas
- Implementar sistema de grupos de compatibilidad

### 4.2 Agregar Validación de Ubicaciones
**Archivos a modificar**:
- `backend/schemas/__init__.py`
- `backend/main.py`

**Validaciones**:
```python
# zone debe ser: COS, IND, FAR
# level debe ser: A-G
# position debe ser: 1-7
```

### 4.3 Implementar Logging Estructurado
**Archivos a crear/modificar**:
- `backend/utils/logger.py`
- `backend/main.py`

**Implementación**:
- Agregar logging con Python logging
- Registrar operaciones CRUD
- Registrar errores y excepciones

### 4.4 Mejorar Importación con Transacciones
**Archivo**: `backend/main.py`

**Cambios**:
- Usar `db.begin()` para transacciones
- Hacer rollback de todo si falla una muestra
- Mejorar reporte de errores

---

## Phase 5: Calidad de Código (Prioridad BAJA)

### 5.1 Migrar a TypeScript
**Pasos sugeridos**:
1. Agregar TypeScript al proyecto: `npm install --save-dev typescript @types/react @types/node`
2. Crear `tsconfig.json`
3. Renombrar archivos .js a .tsx gradualmente
4. Definir tipos para:
   - Sample, User, Movement
   - API responses
   - Form data

### 5.2 Agregar Internacionalización (i18n)
**Archivos a crear**:
- `frontend/src/i18n/index.js`
- `frontend/src/i18n/es.json`
- `frontend/src/i18n/en.json`

**Librerías recomendadas**:
- `react-i18next`
- `i18next`

### 5.3 Crear Dockerfile
**Archivo nuevo**: `Dockerfile`

```dockerfile
# Multi-stage build para producción
FROM python:3.11-slim as backend
WORKDIR /app
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY backend/ .
CMD ["uvicorn", "main:app", "--host", "0.0.0.0"]

FROM node:18 as frontend
WORKDIR /app
COPY frontend/package*.json .
RUN npm ci
COPY frontend/ .
RUN npm run build

FROM nginx:alpine
COPY --from=frontend /app/build /usr/share/nginx/html
```

---

## Checklist de Implementación

### Phase 1: Seguridad
- [ ] 1.1 Agregar .env a .gitignore
- [ ] 1.2 Implementar RBAC

### Phase 2: Arquitectura
- [ ] 2.1 Configurar Alembic
- [ ] 2.2 Migrar datos de ubicación
- [ ] 2.3 Configuración multi-entorno

### Phase 3: Frontend
- [ ] 3.1 Implementar paginación
- [ ] 3.2 Completar impresión
- [ ] 3.3 Refactorizar InfoPanel
- [ ] 3.4 Usar warehouseConfig centralizado

### Phase 4: Backend
- [ ] 4.1 Mejorar compatibilidad química
- [ ] 4.2 Validar ubicaciones
- [ ] 4.3 Agregar logging
- [ ] 4.4 Mejorar importación

### Phase 5: Calidad
- [ ] 5.1 Migrar a TypeScript
- [ ] 5.2 Agregar i18n
- [ ] 5.3 Crear Dockerfile

---

## Notas de Implementación

### Dependencias a Instalar
```bash
# Backend
pip install alembic python-dotenv

# Frontend
npm install @mui/x-data-grid react-i18next i18next
```

### Orden Sugerido
1. Phase 1 (Seguridad) - Antes de cualquier despliegue
2. Phase 2 (Arquitectura) - Para entorno de producción
3. Phase 3 (Frontend) - параллельно con Phase 4
4. Phase 4 (Backend) - параллельно con Phase 3
5. Phase 5 (Calidad) - Mejoras continuas

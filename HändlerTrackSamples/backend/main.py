from fastapi import FastAPI, Depends, HTTPException, status, Query, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from database.database import engine, get_db, Base
from models.sample import Sample
from models.user import User
from models.movement import Movement
from models.chemical_compatibility import ChemicalCompatibility
import schemas
from schemas import SampleUpdate, LabelGenerate, LabelData, LabelGenerateResponse, PasswordChangeRequest, PasswordChangeResponse
from security import get_current_user, get_password_hash, verify_password, create_access_token
from typing import List
import os
import uuid
import tempfile
import openpyxl  # type: ignore
import re
from dotenv import load_dotenv
import logging
import json
from datetime import datetime

# ====================
# CONFIGURACIÓN DE LOGGING
# ====================
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('app.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Función para sanitizar búsquedas - PREVENCIÓN INYECCIÓN SQL
def sanitize_search_query(q: str) -> str:
    """Sanitiza la entrada del usuario para búsquedas"""
    if not q:
        return ""
    # Solo permitir caracteres seguros (letras, números, espacios, guiones, puntos, guiones bajos)
    return re.sub(r'[^\w\s\-_.@]', '', q)

# Cargar variables de entorno
load_dotenv()

# Validar y configurar CORS de forma segura
def validate_cors_origins(origins: str) -> list:
    """Valida que los orígenes CORS sean seguros"""
    if not origins:
        return ["http://localhost:3000"]
    
    origin_list = origins.split(",")
    validated = []
    for origin in origin_list:
        origin = origin.strip()
        if origin == "*":
            raise ValueError("CORS wildcard '*' no permitido con credenciales")
        if not origin.startswith(("http://", "https://")):
            raise ValueError(f"Origen CORS inválido: {origin}")
        validated.append(origin)
    return validated

try:
    CORS_ORIGINS = validate_cors_origins(os.getenv("CORS_ORIGINS", "http://localhost:3000"))
except ValueError as e:
    print(f"Advertencia CORS: {e}")
    CORS_ORIGINS = ["http://localhost:3000"]

# Directorio base para archivos CoA - SEGURIDAD PATH TRAVERSAL
COA_BASE_DIR = os.path.abspath(os.getenv("COA_BASE_DIR", "C:\\Handler\\Certificados"))

app = FastAPI(title="Händler TrackSamples", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)

# ============ RUTA RAÍZ ============

@app.get("/")
async def root():
    """Ruta raíz de la API"""
    return {
        "name": "Händler TrackSamples API",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs"
    }

# ============ ENDPOINTS DE MUESTRAS ============

@app.post("/samples/", response_model=schemas.Sample)
async def create_sample(
    sample: schemas.SampleCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)  # ✅ REQUIERE AUTENTICACIÓN
):
    # ✅ LOGGING: Registrar creación de muestra
    logger.info(f"Usuario {current_user.username} creando muestra: {sample.reference_code}")
    
    # Verificar compatibilidad química
    if sample.chemical_composition:
        incompatible = check_chemical_compatibility(
            sample.chemical_composition, 
            sample.zone, 
            sample.level,
            sample.position,
            db
        )
        if incompatible:
            logger.warning(f"Compatibilidad química fallida: {incompatible}")
            raise HTTPException(
                status_code=400,
                detail=f"Riesgo de reacción: Sustancia incompatible en la misma posición: {incompatible}"
            )
    
    db_sample = Sample(**sample.model_dump())
    db.add(db_sample)
    db.commit()
    db.refresh(db_sample)
    
    # ✅ LOGGING: Registrar éxito
    logger.info(f"Muestra creada exitosamente: {db_sample.id} - {db_sample.reference_code}")
    return db_sample

@app.get("/samples/", response_model=List[schemas.Sample])
async def read_samples(
    q: str = Query(None, description="Texto de búsqueda"),
    business_line: str = Query(None, description="Línea de negocio"),
    sample_status: str = Query(None, description="Estado de la muestra"),
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)  # ✅ REQUIERE AUTENTICACIÓN
):
    query = db.query(Sample)
    
    if q:
        # ✅ Sanitizar búsqueda para prevenir inyección SQL
        safe_q = sanitize_search_query(q)
        query = query.filter(
            Sample.reference_code.ilike(f"%{safe_q}%") |
            Sample.description.ilike(f"%{safe_q}%") |
            Sample.supplier.ilike(f"%{safe_q}%") |
            Sample.batch_number.ilike(f"%{safe_q}%")
        )
    
    if business_line:
        query = query.filter(Sample.business_line == business_line)
    
    if sample_status:
        query = query.filter(Sample.status == sample_status)
    
    samples = query.offset(skip).limit(limit).all()
    return samples

@app.get("/samples/{sample_id}", response_model=schemas.Sample)
async def read_sample(
    sample_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)  # ✅ REQUIERE AUTENTICACIÓN
):
    sample_obj = db.query(Sample).filter(Sample.id == sample_id).first()
    if sample_obj is None:
        raise HTTPException(status_code=404, detail="Sample not found")
    return sample_obj

@app.put("/samples/{sample_id}", response_model=schemas.Sample)
async def update_sample(
    sample_id: int, 
    sample_update: SampleUpdate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)  # ✅ REQUIERE AUTENTICACIÓN
):
    sample_obj = db.query(Sample).filter(Sample.id == sample_id).first()
    if sample_obj is None:
        raise HTTPException(status_code=404, detail="Sample not found")
    
    update_data = sample_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(sample_obj, key, value)
    
    db.commit()
    db.refresh(sample_obj)
    return sample_obj

@app.delete("/samples/{sample_id}")
async def delete_sample(
    sample_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)  # ✅ REQUIERE AUTENTICACIÓN
):
    # Verificar que solo administradores pueden eliminar
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Solo administradores pueden eliminar muestras")
    sample_obj = db.query(Sample).filter(Sample.id == sample_id).first()
    if sample_obj is None:
        raise HTTPException(status_code=404, detail="Sample not found")
    
    db.delete(sample_obj)
    db.commit()
    return {"message": "Sample deleted successfully"}

# ============ ENDPOINTS DE MOVIMIENTOS ============

@app.post("/movements/", response_model=schemas.Movement)
async def create_movement(
    movement: schemas.MovementCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)  # ✅ REQUIERE AUTENTICACIÓN
):
    """
    Crea un nuevo movimiento de entrada o salida.
    Utiliza bloqueo pesimista (with_for_update) para prevenir race conditions.
    """
    # ✅ CONTROL DE CONCURRENCIA: Bloqueo pesimista para prevenir race conditions
    sample_obj = db.query(Sample).filter(
        Sample.id == movement.sample_id
    ).with_for_update().first()
    
    if sample_obj is None:
        raise HTTPException(status_code=404, detail="Sample not found")
    
    # Actualizar cantidad según tipo de movimiento
    if movement.movement_type == "entry":
        sample_obj.quantity += movement.quantity
    elif movement.movement_type == "exit":
        if sample_obj.quantity < movement.quantity:
            raise HTTPException(status_code=400, detail="Insufficient quantity")
        sample_obj.quantity -= movement.quantity
    
    # Crear movimiento con el ID del usuario actual
    movement_data = movement.model_dump()
    movement_data['user_id'] = current_user.id
    
    db_movement = Movement(**movement_data)
    db.add(db_movement)
    
    # ✅ Commit único - atomic transaction
    db.commit()
    db.refresh(db_movement)
    return db_movement

@app.get("/movements/", response_model=List[schemas.Movement])
async def read_movements(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)  # ✅ REQUIERE AUTENTICACIÓN
):
    """Lista todos los movimientos del sistema"""
    movements = db.query(Movement).order_by(Movement.created_at.desc()).offset(skip).limit(limit).all()
    return movements

@app.get("/samples/{sample_id}/movements", response_model=List[schemas.Movement])
async def get_sample_movements(
    sample_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)  # ✅ REQUIERE AUTENTICACIÓN
):
    """Obtiene los movimientos de una muestra específica (requiere autenticación)"""
    # Verificar que la muestra existe
    sample_obj = db.query(Sample).filter(Sample.id == sample_id).first()
    if sample_obj is None:
        raise HTTPException(status_code=404, detail="Sample not found")
    
    movements = db.query(Movement).filter(Movement.sample_id == sample_id).all()
    return movements

# ============ ENDPOINTS DE IMPORTACIÓN ============

# Constantes de seguridad para archivos
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB máximo
ALLOWED_EXTENSIONS = ['.xlsx']

# Configuración de la bodega
WAREHOUSE_ZONES = {
    'Cosmética': 'COS',
    'Industrial': 'IND', 
    'Farma': 'FAR'
}
WAREHOUSE_ROWS = ['A', 'B', 'C', 'D', 'E', 'F', 'G']
WAREHOUSE_COLUMNS = ['1', '2', '3', '4', '5', '6', '7']

def find_best_position(business_line: str, chemical_composition: str, db: Session) -> dict:
    """
    Encuentra la mejor posición para un producto basado en:
    1. Línea de negocio (zona)
    2. Compatibilidad química con productos existentes
    
    Retorna: {zone, level, position} o None si no hay espacio
    """
    # Determinar la zona según línea de negocio
    zone = WAREHOUSE_ZONES.get(business_line, 'COS')
    
    # Obtener productos existentes en esa zona
    existing_in_zone = db.query(Sample).filter(
        Sample.zone == zone,
        Sample.status == 'available'
    ).all()
    
    # Crear mapa de posiciones ocupadas
    occupied_positions = set()
    for sample in existing_in_zone:
        if sample.level and sample.position:
            occupied_positions.add((sample.level, sample.position))
    
    # Obtener reglas de incompatibilidad para esta composición química
    incompatible_chemicals = set()
    if chemical_composition:
        chemicals = [c.strip() for c in chemical_composition.split(',')]
        for chem in chemicals:
            compat_rule = db.query(ChemicalCompatibility).filter(
                ChemicalCompatibility.chemical_group.ilike(f"%{chem}%")
            ).first()
            if compat_rule and compat_rule.incompatible_with:
                for inc in compat_rule.incompatible_with.split(','):
                    incompatible_chemicals.add(inc.strip().lower())
    
    # Buscar la primera posición disponible compatible
    for level in WAREHOUSE_ROWS:
        for col in WAREHOUSE_COLUMNS:
            if (level, col) not in occupied_positions:
                # Verificar compatibilidad química con productos en posiciones adyacentes
                if chemical_composition:
                    adjacent_samples = db.query(Sample).filter(
                        Sample.zone == zone,
                        Sample.level == level,
                        Sample.position == col
                    ).all()
                    
                    is_compatible = True
                    for adj_sample in adjacent_samples:
                        if adj_sample.chemical_composition:
                            adj_chemicals = [c.strip().lower() for c in adj_sample.chemical_composition.split(',')]
                            for adj_chem in adj_chemicals:
                                if adj_chem in incompatible_chemicals:
                                    is_compatible = False
                                    break
                        if not is_compatible:
                            break
                    
                    if not is_compatible:
                        continue
                
                return {'zone': zone, 'level': level, 'position': col}
    
    # Si no hay espacio, buscar en otras zonas
    for other_zone in WAREHOUSE_ZONES.values():
        if other_zone == zone:
            continue
        for level in WAREHOUSE_ROWS:
            for col in WAREHOUSE_COLUMNS:
                if (level, col) not in occupied_positions:
                    return {'zone': other_zone, 'level': level, 'position': col}
    
    return None  # No hay posiciones disponibles


def validate_uploaded_file(filename: str, content: bytes) -> bool:
    """Valida que el archivo subido sea seguro"""
    # Validar extensión
    if not any(filename.lower().endswith(ext) for ext in ALLOWED_EXTENSIONS):
        return False
    
    # Validar tamaño
    if len(content) > MAX_FILE_SIZE:
        return False
    
    # Validar que no esté vacío
    if len(content) < 100:
        return False
    
    return True


def parse_excel_row(row: dict, auto_assign: bool = True, db: Session = None) -> dict:
    """
    Mapea las columnas del Excel a los campos del modelo Sample.
    
    Plantilla simplificada (auto-asignación de posición):
    - Codigo_Referencia
    - Descripcion
    - Composicion_Quimica
    - Proveedor
    - Numero_Lote
    - Cantidad
    - Unidad
    - Linea_Negocio
    - Ruta_CoA
    
    Opcional (especificar posición manualmente):
    - Zona
    - Fila
    - Columna
    """
    mapping = {
        'Codigo_Referencia': 'reference_code',
        'Descripcion': 'description',
        'Composicion_Quimica': 'chemical_composition',
        'Proveedor': 'supplier',
        'Numero_Lote': 'batch_number',
        'Cantidad': 'quantity',
        'Unidad': 'unit',
        'Linea_Negocio': 'business_line',
        'Zona': 'zone',
        'Fila': 'level',
        'Columna': 'position',
        'Ruta_CoA': 'coa_path'
    }
    
    result = {}
    for excel_col, model_field in mapping.items():
        value = row.get(excel_col)
        if value is not None and str(value).strip():
            # Convertir tipos
            if model_field == 'quantity':
                try:
                    result[model_field] = float(str(value).replace(',', '.'))
                except:
                    result[model_field] = 0.0
            else:
                result[model_field] = str(value).strip()
    
    # Valores por defecto
    if 'unit' not in result:
        result['unit'] = 'kg'
    if 'status' not in result:
        result['status'] = 'available'
    if 'is_compatible' not in result:
        result['is_compatible'] = True
    
    # Auto-asignar posición si no se específica
    if auto_assign and db:
        position = find_best_position(
            result.get('business_line', 'Cosmética'),
            result.get('chemical_composition', ''),
            db
        )
        if position:
            result['zone'] = position['zone']
            result['level'] = position['level']
            result['position'] = position['position']
        else:
            raise Exception("No hay posiciones disponibles en la bodega")
    
    return result


@app.post("/samples/import")
async def import_samples(
    file: UploadFile = File(...), 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)  # ✅ REQUIERE AUTENTICACIÓN
):
    """
    Importa muestras desde un archivo Excel (.xlsx).
    
    ✅ MEJORAS IMPLEMENTADAS:
    - Validación de archivos subidos
    - Transacciones atómicas (rollback completo si falla)
    - Logging de auditoría
    - Límite de errores en respuesta
    
    Retorna:
    - total: Total de registros procesados
    - successful: Registros importados exitosamente
    - failed: Registros que fallaron
    - errors: Lista de errores por registro
    """
    # ✅ LOGGING: Inicio de importación
    logger.info(f"Usuario {current_user.username} iniciando importación de muestras")
    
    # Validar extensión
    if not file.filename.endswith('.xlsx'):
        logger.warning(f"Usuario {current_user.username} intentó importar archivo no válido: {file.filename}")
        raise HTTPException(status_code=400, detail="Solo se aceptan archivos .xlsx")
    
    # Leer y validar contenido
    content = await file.read()
    
    # ✅ Validar archivo con la función de seguridad
    if not validate_uploaded_file(file.filename, content):
        raise HTTPException(
            status_code=400, 
            detail="Archivo inválido: asegurese de usar un archivo .xlsx válido (máx 10MB)"
        )
    
    # Guardar archivo temporalmente
    with tempfile.NamedTemporaryFile(delete=False, suffix='.xlsx') as tmp_file:
        content = await file.read()
        tmp_file.write(content)
        tmp_path = tmp_file.name
    
    try:
        # Abrir workbook
        workbook = openpyxl.load_workbook(tmp_path)
        sheet = workbook.active
        
        # Obtener encabezados (primera fila)
        headers = [cell.value for cell in sheet[1]]
        
        # Validar encabezados requeridos
        required_headers = ['Codigo_Referencia', 'Descripcion', 'Proveedor', 'Numero_Lote', 'Cantidad', 'Linea_Negocio', 'Zona', 'Fila', 'Columna']
        missing_headers = [h for h in required_headers if h not in headers]
        if missing_headers:
            raise HTTPException(
                status_code=400,
                detail=f"Faltan encabezados requeridos: {', '.join(missing_headers)}"
            )
        
        # Procesar filas
        successful = 0
        failed = 0
        errors = []
        
        # ✅ TRANSACCIÓN: Procesar todas las filas en una sola transacción
        # Si falla alguna, se hace rollback de todo
        try:
            for row_idx, row in enumerate(sheet.iter_rows(min_row=2, values_only=True), start=2):
                # Crear diccionario con encabezados
                row_dict = {headers[i]: row[i] for i in range(len(headers)) if headers[i]}
                
                # Verificar que no esté vacío
                if not row_dict.get('Codigo_Referencia'):
                    continue
                
                # Mapear datos
                sample_data = parse_excel_row(row_dict)
                
                # Verificar si ya existe
                existing = db.query(Sample).filter(
                    Sample.reference_code == sample_data['reference_code']
                ).first()
                
                if existing:
                    failed += 1
                    errors.append(f"Fila {row_idx}: Código {sample_data['reference_code']} ya existe")
                    continue
                
                # Verificar compatibilidad química
                if sample_data.get('chemical_composition'):
                    incompatible = check_chemical_compatibility(
                        sample_data['chemical_composition'],
                        sample_data.get('zone', ''),
                        sample_data.get('level', ''),
                        sample_data.get('position', ''),
                        db
                    )
                    if incompatible:
                        failed += 1
                        errors.append(f"Fila {row_idx}: {incompatible}")
                        continue
                
                # Crear muestra (sin commit individual)
                db_sample = Sample(**sample_data)
                db.add(db_sample)
                
                successful += 1
            
            # ✅ Commit de todas las muestras juntas - atomic transaction
            db.commit()
            
        except Exception as e:
            # ✅ Rollback de toda la transacción si hay error
            db.rollback()
            raise HTTPException(status_code=500, detail=f"Error en transacción: {str(e)}")
        
        return {
            "message": "Importación completada",
            "total": successful + failed,
            "successful": successful,
            "failed": failed,
            "errors": errors[:50]  # Limitar errores a 50
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error en importación: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error al procesar archivo: {str(e)}")
    finally:
        # ✅ LOGGING: Fin de importación
        logger.info(f"Importación finalizada - Éxitos: {successful}, Fallidos: {failed}")
        # Limpiar archivo temporal
        if os.path.exists(tmp_path):
            os.remove(tmp_path)

# ============ ENDPOINTS DE USUARIOS ============

@app.post("/users/", response_model=schemas.User)
async def create_user(
    user: schemas.UserCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)  # ✅ REQUIERE AUTENTICACIÓN
):
    # ✅ Solo administradores pueden crear usuarios
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Solo administradores pueden crear usuarios")
    # Verificar si el usuario ya existe
    existing_user = db.query(User).filter(
        (User.username == user.username) | (User.email == user.email)
    ).first()
    
    if existing_user:
        if existing_user.username == user.username:
            raise HTTPException(status_code=400, detail="Username already registered")
        else:
            raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = get_password_hash(user.password)
    db_user = User(username=user.username, email=user.email, hashed_password=hashed_password, full_name=user.full_name)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@app.post("/login/")
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """
    Endpoint de autenticación. Retorna JWT token.
    ✅ LOGGING: Registra intentos de login.
    """
    user = db.query(User).filter(User.username == form_data.username).first()
    
    if not user or not verify_password(form_data.password, user.hashed_password):
        # ✅ LOGGING: Registrar intento fallido
        logger.warning(f"Intento de login fallido para usuario: {form_data.username}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(data={"sub": user.username})
    
    # ✅ LOGGING: Registrar login exitoso
    logger.info(f"Login exitoso para usuario: {user.username} - Rol: {user.role}")
    
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/users/me", response_model=schemas.User)
async def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user

# ============ ENDPOINT DE CAMBIO DE CONTRASEÑA ============

@app.post("/users/change-password", response_model=PasswordChangeResponse)
async def change_password(
    password_data: PasswordChangeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Endpoint para cambiar la contraseña del usuario actual.
    
    Seguridad:
    - Requiere autenticación JWT
    - Verifica la contraseña actual antes de cambiar
    - Usa bcrypt para hashear la nueva contraseña
    - Registra el cambio en los logs
    
    Validaciones:
    - La nueva contraseña debe cumplir con los requisitos de seguridad
    - Las contraseñas nueva y de confirmación deben coincidir
    """
    # ✅ VERIFICAR CONTRASEÑA ACTUAL
    if not verify_password(password_data.current_password, current_user.hashed_password):
        logger.warning(f"Usuario {current_user.username} intentó cambio de contraseña con contraseña actual incorrecta")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La contraseña actual es incorrecta"
        )
    
    # ✅ VERIFICAR QUE LA NUEVA CONTRASEÑA NO SEA IGUAL A LA ACTUAL
    if verify_password(password_data.new_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La nueva contraseña no puede ser igual a la contraseña actual"
        )
    
    # ✅ GENERAR NUEVO HASH Y GUARDAR
    new_hash = get_password_hash(password_data.new_password)
    current_user.hashed_password = new_hash
    db.commit()
    
    # ✅ LOGGING: Registrar cambio de contraseña exitoso
    logger.info(f"Usuario {current_user.username} cambió su contraseña exitosamente")
    
    return PasswordChangeResponse(
        success=True,
        message="Contraseña cambiada exitosamente"
    )


def check_chemical_compatibility(chemical_composition: str, zone: str, level: str, position: str, db: Session):
    """Verifica si la composición química es compatible con las muestras existentes en la misma ubicación"""
    if not chemical_composition:
        return None
    
    # Buscar muestras en la misma posición (zona, nivel, posición)
    existing_samples = db.query(Sample).filter(
        Sample.zone == zone,
        Sample.level == level,
        Sample.position == position
    ).all()
    
    if not existing_samples:
        return None
    
    # Buscar incompatibilidades en la tabla de compatibilidades
    chemicals = chemical_composition.split(',')
    for chemical in chemicals:
        chemical = chemical.strip()
        compatibility = db.query(ChemicalCompatibility).filter(
            ChemicalCompatibility.chemical_group.contains(chemical)
        ).first()
        
        if compatibility:
            # Verificar si hay muestras con químicos incompatibles en la misma posición
            for existing in existing_samples:
                if existing.chemical_composition:
                    existing_chemicals = existing.chemical_composition.split(',')
                    for existing_chem in existing_chemicals:
                        existing_chem = existing_chem.strip()
                        if existing_chem in compatibility.incompatible_with:
                            return f"{chemical} incompatible with {existing_chem} at {zone}-{level}-{position}"
    
    return None

# ============ ENDPOINTS DE PDF ============

@app.get("/samples/{sample_id}/pdf")
async def get_sample_pdf(
    sample_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)  # ✅ REQUIERE AUTENTICACIÓN
):
    """
    Retorna el PDF del Certificado de Análisis (CoA) de una muestra.
    Si no existe el archivo, retorna un error 404.
    """
    sample_obj = db.query(Sample).filter(Sample.id == sample_id).first()
    if sample_obj is None:
        raise HTTPException(status_code=404, detail="Sample not found")
    
    if not sample_obj.coa_path:
        raise HTTPException(status_code=404, detail="PDF de CoA no encontrado para esta muestra")
    
    # ✅ SEGURIDAD: Validar ruta para prevenir Path Traversal
    # Convertir a ruta absoluta y normalizar
    try:
        file_path = os.path.abspath(sample_obj.coa_path)
        coa_base = os.path.abspath(COA_BASE_DIR)
        
        # Verificar que el archivo está dentro del directorio base permitido
        if not file_path.startswith(coa_base):
            raise HTTPException(status_code=403, detail="Ruta no permitida - acceso denegado")
        
        # Verificar que el archivo existe
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail=f"Archivo PDF no encontrado en la ruta: {sample_obj.coa_path}")
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error al acceder al archivo: {str(e)}")
    
    return FileResponse(
        file_path, 
        media_type='application/pdf',
        filename=f"CoA_{sample_obj.reference_code}_{sample_obj.batch_number}.pdf"
    )

# ============ ENDPOINTS DE ETIQUETAS ============

@app.post("/samples/{sample_id}/labels", response_model=LabelGenerateResponse)
async def generate_labels(
    sample_id: int, 
    label_request: LabelGenerate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)  # ✅ REQUIERE AUTENTICACIÓN
):
    """
    Genera etiquetas de alistamiento para una muestra.
    
    La etiqueta incluye:
    - Código de referencia
    - Número de lote
    - Descripción
    - Proveedor
    - Línea de negocio
    - Código de ubicación (formato: ZONA-FILA-COLUMNA)
    - Cantidad
    - Código QR (opcional)
    - Código de barras (opcional)
    """
    sample_obj = db.query(Sample).filter(Sample.id == sample_id).first()
    if sample_obj is None:
        raise HTTPException(status_code=404, detail="Sample not found")
    
    # Generar código de ubicación (formato: ZONA-FILA-COLUMNA)
    location_code = f"{sample_obj.zone}-{sample_obj.level}{sample_obj.position}"
    
    # Generar datos para QR/barcode
    qr_data = None
    barcode_data = None
    
    if label_request.include_qr:
        qr_data = f"REF:{sample_obj.reference_code}|LOTE:{sample_obj.batch_number}|UBI:{location_code}"
    
    if label_request.include_barcode:
        barcode_data = f"{sample_obj.reference_code}-{sample_obj.batch_number}"
    
    # Crear lista de etiquetas
    labels = []
    for i in range(label_request.quantity):
        label = LabelData(
            reference_code=sample_obj.reference_code,
            batch_number=sample_obj.batch_number,
            description=sample_obj.description,
            supplier=sample_obj.supplier,
            business_line=sample_obj.business_line,
            location_code=location_code,
            quantity=sample_obj.quantity,
            unit=sample_obj.unit,
            qr_data=qr_data,
            barcode_data=barcode_data
        )
        labels.append(label)
    
    return LabelGenerateResponse(
        labels=labels,
        total_labels=len(labels),
        message=f"Se generaron {len(labels)} etiquetas para la muestra {sample_obj.reference_code}"
    )

# ============ ENDPOINTS DE COMPATIBILIDAD QUÍMICA ============

@app.post("/compatibility/", response_model=schemas.ChemicalCompatibility)
async def create_compatibility_rule(
    compatibility: schemas.ChemicalCompatibilityCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)  # ✅ REQUIERE AUTENTICACIÓN
):
    """
    Crea una regla de compatibilidad química.
    Se usa para definir qué sustancias son compatibles o incompatibles entre sí.
    """
    db_compatibility = ChemicalCompatibility(**compatibility.model_dump())
    db.add(db_compatibility)
    db.commit()
    db.refresh(db_compatibility)
    return db_compatibility

@app.get("/compatibility/", response_model=List[schemas.ChemicalCompatibility])
async def read_compatibility_rules(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)  # ✅ REQUIERE AUTENTICACIÓN
):
    """
    Lista todas las reglas de compatibilidad química.
    Requiere autenticación para proteger información sensible.
    """
    rules = db.query(ChemicalCompatibility).all()
    return rules

"""
Händler TrackSamples - Backend Simplificado
Solo enthält: Login und Passwortänderung
"""

from fastapi import FastAPI, Depends, HTTPException, status, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from database.database import engine, get_db, Base
from models.user import User
import schemas
from schemas import PasswordChangeRequest, PasswordChangeResponse
from security import get_current_user, get_password_hash, verify_password, create_access_token
from routers import proveedores_router, clases_peligro_router, muestras_router, lineas_router, anaqueles_router, hileras_router, anaquel_proveedor_router
from typing import List
import os
import re
from dotenv import load_dotenv
import logging

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

# Función para sanitizar búsquedas
def sanitize_search_query(q: str) -> str:
    """Sanitiza la entrada del usuario para búsquedas"""
    if not q:
        return ""
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

app = FastAPI(title="Händler TrackSamples", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)

# Registrar routers
app.include_router(proveedores_router)
app.include_router(clases_peligro_router)
app.include_router(muestras_router)
app.include_router(lineas_router)
app.include_router(anaqueles_router)
app.include_router(hileras_router)
app.include_router(anaquel_proveedor_router)

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

# ============ ENDPOINTS DE USUARIOS ============

@app.post("/users/", response_model=schemas.User)
async def create_user(
    user: schemas.UserCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Crear nuevo usuario (solo administradores)"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Solo administradores pueden crear usuarios")
    
    existing_user = db.query(User).filter(
        (User.username == user.username) | (User.email == user.email)
    ).first()
    
    if existing_user:
        if existing_user.username == user.username:
            raise HTTPException(status_code=400, detail="Username already registered")
        else:
            raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = get_password_hash(user.password)
    db_user = User(
        username=user.username, 
        email=user.email, 
        hashed_password=hashed_password, 
        full_name=user.full_name
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@app.post("/login/")
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """
    Endpoint de autenticación. Retorna JWT token.
    """
    user = db.query(User).filter(User.username == form_data.username).first()
    
    if not user:
        logger.warning(f"Intento de login: usuario no encontrado: {form_data.username}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="El nombre de usuario no existe en el sistema. Verifica e intenta de nuevo.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        logger.warning(f"Intento de login: usuario inactivo: {form_data.username}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Tu cuenta está desactivada. Contacta al administrador del sistema.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not verify_password(form_data.password, user.hashed_password):
        logger.warning(f"Intento de login fallido: contraseña incorrecta para usuario: {form_data.username}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="La contraseña es incorrecta. Verifica tu contraseña e intenta de nuevo.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(data={"sub": user.username})
    logger.info(f"Login exitoso para usuario: {user.username} - Rol: {user.role}")
    
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/users/me", response_model=schemas.User)
async def read_users_me(current_user: User = Depends(get_current_user)):
    """Obtiene información del usuario actual"""
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
    """
    # Verificar contraseña actual
    if not verify_password(password_data.current_password, current_user.hashed_password):
        logger.warning(f"Usuario {current_user.username} intentó cambio de contraseña con contraseña actual incorrecta")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La contraseña actual es incorrecta"
        )
    
    # Verificar que la nueva contraseña no sea igual a la actual
    if verify_password(password_data.new_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La nueva contraseña no puede ser igual a la contraseña actual"
        )
    
    # Generar nuevo hash y guardar
    new_hash = get_password_hash(password_data.new_password)
    current_user.hashed_password = new_hash
    db.commit()
    
    logger.info(f"Usuario {current_user.username} cambió su contraseña exitosamente")
    
    return PasswordChangeResponse(
        success=True,
        message="Contraseña cambiada exitosamente"
    )

# ============ HEALTH CHECK ============

@app.get("/health")
async def health_check():
    """Endpoint de verificación de salud"""
    return {"status": "healthy"}

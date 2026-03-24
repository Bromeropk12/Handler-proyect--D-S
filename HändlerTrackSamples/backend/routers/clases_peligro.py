"""
Router de Clases de Peligro (GHS)
Endpoints API para gestión de clases de peligro
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from database.database import get_db
from models.user import User
from models.clase_peligro import ClasePeligro
import schemas
from security import get_current_user

router = APIRouter(prefix="/clases-peligro", tags=["Clases de Peligro"])


def check_admin(current_user: User):
    """Verifica que el usuario tenga rol de admin"""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo administradores pueden modificar clases de peligro"
        )


@router.get("/", response_model=List[schemas.ClasePeligro])
async def list_clases_peligro(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    activa_only: bool = Query(True, description="Filtrar solo clases activas"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Lista todas las clases de peligro con paginación.
    """
    query = db.query(ClasePeligro)
    
    if activa_only:
        query = query.filter(ClasePeligro.activa == True)
    
    total = query.count()
    clases = query.order_by(ClasePeligro.codigo).offset(skip).limit(limit).all()
    
    return clases


@router.get("/{clase_id}", response_model=schemas.ClasePeligro)
async def get_clase_peligro(
    clase_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Obtiene una clase de peligro por su ID.
    """
    clase = db.query(ClasePeligro).filter(ClasePeligro.id == clase_id).first()
    if not clase:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Clase de peligro con ID {clase_id} no encontrada"
        )
    return clase


@router.post("/", response_model=schemas.ClasePeligro, status_code=status.HTTP_201_CREATED)
async def create_clase_peligro(
    clase: schemas.ClasePeligroCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Crea una nueva clase de peligro. Requiere rol admin.
    """
    check_admin(current_user)
    
    # Verificar código único
    existing = db.query(ClasePeligro).filter(ClasePeligro.codigo == clase.codigo).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ya existe una clase de peligro con este código"
        )
    
    db_clase = ClasePeligro(**clase.model_dump())
    db.add(db_clase)
    db.commit()
    db.refresh(db_clase)
    
    return db_clase


@router.put("/{clase_id}", response_model=schemas.ClasePeligro)
async def update_clase_peligro(
    clase_id: int,
    clase_update: schemas.ClasePeligroUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Actualiza una clase de peligro existente. Requiere rol admin.
    """
    check_admin(current_user)
    
    clase = db.query(ClasePeligro).filter(ClasePeligro.id == clase_id).first()
    if not clase:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Clase de peligro con ID {clase_id} no encontrada"
        )
    
    update_data = clase_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(clase, field, value)
    
    db.commit()
    db.refresh(clase)
    
    return clase


@router.delete("/{clase_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_clase_peligro(
    clase_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Elimina (desactiva) una clase de peligro. Requiere rol admin.
    """
    check_admin(current_user)
    
    clase = db.query(ClasePeligro).filter(ClasePeligro.id == clase_id).first()
    if not clase:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Clase de peligro con ID {clase_id} no encontrada"
        )
    
    clase.activa = False
    db.commit()
    
    return None


@router.get("/active/options", response_model=List[dict])
async def get_clase_options(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Obtiene lista de clases de peligro activas para dropdowns.
    Retorna solo id, codigo y nombre.
    """
    clases = db.query(ClasePeligro).filter(
        ClasePeligro.activa == True
    ).order_by(ClasePeligro.codigo).all()
    
    return [{"id": c.id, "codigo": c.codigo, "nombre": c.nombre, "simbolo": c.simbolo} for c in clases]
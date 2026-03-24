"""
Router de Proveedores
Endpoints API para gestión de proveedores
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from typing import List, Optional
import json
from database.database import get_db
from models.user import User
from models.proveedor import Proveedor
import schemas
from security import get_current_user

router = APIRouter(prefix="/proveedores", tags=["Proveedores"])


def check_admin_or_supervisor(current_user: User):
    """Verifica que el usuario tenga rol de admin o supervisor"""
    if current_user.role not in ["admin", "supervisor"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para realizar esta acción"
        )


@router.get("/", response_model=List[schemas.Proveedor])
async def list_proveedores(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    search: Optional[str] = Query(None, description="Buscar por nombre o NIT"),
    activa_only: bool = Query(True, description="Filtrar solo proveedores activos"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Lista todos los proveedores con paginación y búsqueda.
    """
    query = db.query(Proveedor)
    
    # Filtro de búsqueda
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            (Proveedor.nombre.ilike(search_filter)) | 
            (Proveedor.nit.ilike(search_filter))
        )
    
    # Filtro de activo
    if activa_only:
        query = query.filter(Proveedor.activa == True)
    
    # Paginación
    total = query.count()
    proveedores = query.order_by(Proveedor.nombre).offset(skip).limit(limit).all()
    
    # Convertir lineas_negocio de JSON a lista
    result = []
    for p in proveedores:
        prov_dict = {
            "id": p.id,
            "nombre": p.nombre,
            "nit": p.nit,
            "direccion": p.direccion,
            "telefono": p.telefono,
            "email": p.email,
            "contacto_nombre": p.contacto_nombre,
            "contacto_telefono": p.contacto_telefono,
            "contacto_email": p.contacto_email,
            "observaciones": p.observaciones,
            "lineas_negocio": json.loads(p.lineas_negocio) if p.lineas_negocio else [],
            "activa": p.activa,
            "created_at": p.created_at,
            "updated_at": p.updated_at
        }
        result.append(prov_dict)
    
    return result


@router.get("/{proveedor_id}", response_model=schemas.Proveedor)
async def get_proveedor(
    proveedor_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Obtiene un proveedor por su ID.
    """
    proveedor = db.query(Proveedor).filter(Proveedor.id == proveedor_id).first()
    if not proveedor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Proveedor con ID {proveedor_id} no encontrado"
        )
    
    # Retornar con lineas_negocio como lista
    result = {
        "id": proveedor.id,
        "nombre": proveedor.nombre,
        "nit": proveedor.nit,
        "direccion": proveedor.direccion,
        "telefono": proveedor.telefono,
        "email": proveedor.email,
        "contacto_nombre": proveedor.contacto_nombre,
        "contacto_telefono": proveedor.contacto_telefono,
        "contacto_email": proveedor.contacto_email,
        "observaciones": proveedor.observaciones,
        "lineas_negocio": json.loads(proveedor.lineas_negocio) if proveedor.lineas_negocio else [],
        "activa": proveedor.activa,
        "created_at": proveedor.created_at,
        "updated_at": proveedor.updated_at
    }
    
    return result


@router.post("/", response_model=schemas.Proveedor, status_code=status.HTTP_201_CREATED)
async def create_proveedor(
    proveedor: schemas.ProveedorCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Crea un nuevo proveedor. Requiere rol admin o supervisor.
    """
    check_admin_or_supervisor(current_user)
    
    # Verificar NIT único
    existing = db.query(Proveedor).filter(Proveedor.nit == proveedor.nit).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ya existe un proveedor con este NIT"
        )
    
    # Convertir lineas_negocio a JSON string
    proveedor_data = proveedor.model_dump()
    if proveedor_data.get('lineas_negocio'):
        proveedor_data['lineas_negocio'] = json.dumps(proveedor_data['lineas_negocio'])
    
    # Crear proveedor
    db_proveedor = Proveedor(**proveedor_data)
    db.add(db_proveedor)
    db.commit()
    db.refresh(db_proveedor)
    
    # Retornar con lineas_negocio como lista
    result = {
        "id": db_proveedor.id,
        "nombre": db_proveedor.nombre,
        "nit": db_proveedor.nit,
        "direccion": db_proveedor.direccion,
        "telefono": db_proveedor.telefono,
        "email": db_proveedor.email,
        "contacto_nombre": db_proveedor.contacto_nombre,
        "contacto_telefono": db_proveedor.contacto_telefono,
        "contacto_email": db_proveedor.contacto_email,
        "observaciones": db_proveedor.observaciones,
        "lineas_negocio": json.loads(db_proveedor.lineas_negocio) if db_proveedor.lineas_negocio else [],
        "activa": db_proveedor.activa,
        "created_at": db_proveedor.created_at,
        "updated_at": db_proveedor.updated_at
    }
    
    return result


@router.put("/{proveedor_id}", response_model=schemas.Proveedor)
async def update_proveedor(
    proveedor_id: int,
    proveedor_update: schemas.ProveedorUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Actualiza un proveedor existente. Requiere rol admin o supervisor.
    """
    check_admin_or_supervisor(current_user)
    
    proveedor = db.query(Proveedor).filter(Proveedor.id == proveedor_id).first()
    if not proveedor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Proveedor con ID {proveedor_id} no encontrado"
        )
    
    # Verificar NIT único si se va a cambiar
    if proveedor_update.nit and proveedor_update.nit != proveedor.nit:
        existing = db.query(Proveedor).filter(Proveedor.nit == proveedor_update.nit).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Ya existe un proveedor con este NIT"
            )
    
    # Actualizar campos
    update_data = proveedor_update.model_dump(exclude_unset=True)
    
    # Convertir lineas_negocio a JSON string si se proporciona
    if 'lineas_negocio' in update_data and update_data['lineas_negocio'] is not None:
        update_data['lineas_negocio'] = json.dumps(update_data['lineas_negocio'])
    
    for field, value in update_data.items():
        setattr(proveedor, field, value)
    
    db.commit()
    db.refresh(proveedor)
    
    # Retornar con lineas_negocio como lista
    result = {
        "id": proveedor.id,
        "nombre": proveedor.nombre,
        "nit": proveedor.nit,
        "direccion": proveedor.direccion,
        "telefono": proveedor.telefono,
        "email": proveedor.email,
        "contacto_nombre": proveedor.contacto_nombre,
        "contacto_telefono": proveedor.contacto_telefono,
        "contacto_email": proveedor.contacto_email,
        "observaciones": proveedor.observaciones,
        "lineas_negocio": json.loads(proveedor.lineas_negocio) if proveedor.lineas_negocio else [],
        "activa": proveedor.activa,
        "created_at": proveedor.created_at,
        "updated_at": proveedor.updated_at
    }
    
    return result


@router.delete("/{proveedor_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_proveedor(
    proveedor_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Elimina (desactiva) un proveedor. Requiere rol admin.
    """
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo administradores pueden eliminar proveedores"
        )
    
    proveedor = db.query(Proveedor).filter(Proveedor.id == proveedor_id).first()
    if not proveedor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Proveedor con ID {proveedor_id} no encontrado"
        )
    
    # Soft delete - desactivar en lugar de eliminar
    proveedor.activa = False
    db.commit()
    
    return None


@router.get("/active/options", response_model=List[dict])
async def get_proveedor_options(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Obtiene lista de proveedores activos para dropdowns.
    Retorna solo id y nombre.
    """
    proveedores = db.query(Proveedor).filter(
        Proveedor.activa == True
    ).order_by(Proveedor.nombre).all()
    
    return [{"id": p.id, "nombre": p.nombre, "nit": p.nit} for p in proveedores]
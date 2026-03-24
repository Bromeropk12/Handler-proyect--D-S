"""
Router de Muestras (Samples)
Endpoints API para gestión del catálogo de muestras
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, and_
from typing import List, Optional
from decimal import Decimal
from database.database import get_db
from models.user import User
from models.sample import Sample
from models.proveedor import Proveedor
from models.clase_peligro import ClasePeligro
import schemas
from security import get_current_user

router = APIRouter(prefix="/muestras", tags=["Muestras"])


def check_operator_role(current_user: User):
    """Verifica que el usuario tenga rol de operador o superior"""
    if current_user.role not in ["admin", "supervisor", "operator"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para realizar esta acción"
        )


@router.get("/", response_model=List[schemas.Sample])
async def list_muestras(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=500),
    search: Optional[str] = Query(None, description="Buscar por nombre, CAS o lote"),
    proveedor_id: Optional[int] = Query(None, description="Filtrar por proveedor"),
    linea_negocio: Optional[str] = Query(None, description="Filtrar por línea de negocio"),
    clase_peligro_id: Optional[int] = Query(None, description="Filtrar por clase de peligro"),
    estado: Optional[str] = Query(None, description="Filtrar por estado"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Lista todas las muestras con paginación y filtros.
    """
    query = db.query(Sample)
    
    # Búsqueda por texto
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            or_(
                Sample.nombre.ilike(search_filter),
                Sample.cas_number.ilike(search_filter),
                Sample.lote.ilike(search_filter)
            )
        )
    
    # Filtros
    if proveedor_id:
        query = query.filter(Sample.proveedor_id == proveedor_id)
    
    if linea_negocio:
        query = query.filter(Sample.linea_negocio == linea_negocio)
    
    if clase_peligro_id:
        query = query.filter(Sample.clase_peligro_id == clase_peligro_id)
    
    if estado:
        query = query.filter(Sample.estado == estado)
    
    total = query.count()
    muestras = query.order_by(Sample.nombre).offset(skip).limit(limit).all()
    
    return muestras


@router.get("/{muestra_id}", response_model=schemas.SampleWithRelations)
async def get_muestra(
    muestra_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Obtiene una muestra por su ID con relaciones cargadas.
    """
    muestra = db.query(Sample).options(
        joinedload(Sample.proveedor),
        joinedload(Sample.clase_peligro)
    ).filter(Sample.id == muestra_id).first()
    
    if not muestra:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Muestra con ID {muestra_id} no encontrada"
        )
    return muestra


@router.post("/", response_model=schemas.Sample, status_code=status.HTTP_201_CREATED)
async def create_muestra(
    muestra: schemas.SampleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Crea una nueva muestra. Requiere rol de operador o superior.
    """
    check_operator_role(current_user)
    
    # Validar proveedor si se proporciona
    if muestra.proveedor_id:
        proveedor = db.query(Proveedor).filter(
            Proveedor.id == muestra.proveedor_id,
            Proveedor.activa == True
        ).first()
        if not proveedor:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Proveedor no válido o inactivo"
            )
    
    # Validar clase de peligro si se proporciona
    if muestra.clase_peligro_id:
        clase = db.query(ClasePeligro).filter(
            ClasePeligro.id == muestra.clase_peligro_id,
            ClasePeligro.activa == True
        ).first()
        if not clase:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Clase de peligro no válida o inactiva"
            )
    
    # Validar línea de negocio
    valid_lineas = ["cosméticos", "industrial", "farmacéutico"]
    if muestra.linea_negocio not in valid_lineas:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Línea de negocio inválida. Debe ser una de: {', '.join(valid_lineas)}"
        )
    
    # Validar dimensión
    valid_dimensiones = ["1x1", "2x1", "2x2"]
    if muestra.dimension not in valid_dimensiones:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Dimensión inválida. Debe ser una de: {', '.join(valid_dimensiones)}"
        )
    
    # Validar estado
    valid_estados = ["activa", "inactiva", "agotada", "vencida", "retirada"]
    if muestra.estado not in valid_estados:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Estado inválido. Debe ser uno de: {', '.join(valid_estados)}"
        )
    
    # Validar fecha de vencimiento >= fecha de manufactura
    if muestra.fecha_manufactura and muestra.fecha_vencimiento:
        if muestra.fecha_vencimiento < muestra.fecha_manufactura:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="La fecha de vencimiento no puede ser anterior a la fecha de manufactura"
            )
    
    # Crear muestra
    db_muestra = Sample(
        **muestra.model_dump(),
        created_by=current_user.id
    )
    db.add(db_muestra)
    db.commit()
    db.refresh(db_muestra)
    
    return db_muestra


@router.put("/{muestra_id}", response_model=schemas.Sample)
async def update_muestra(
    muestra_id: int,
    muestra_update: schemas.SampleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Actualiza una muestra existente. Requiere rol de operador o superior.
    """
    check_operator_role(current_user)
    
    muestra = db.query(Sample).filter(Sample.id == muestra_id).first()
    if not muestra:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Muestra con ID {muestra_id} no encontrada"
        )
    
    # Validar proveedor si se va a cambiar
    update_data = muestra_update.model_dump(exclude_unset=True)
    if 'proveedor_id' in update_data and update_data['proveedor_id']:
        proveedor = db.query(Proveedor).filter(
            Proveedor.id == update_data['proveedor_id'],
            Proveedor.activa == True
        ).first()
        if not proveedor:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Proveedor no válido o inactivo"
            )
    
    # Validar línea de negocio
    if 'linea_negocio' in update_data and update_data['linea_negocio']:
        valid_lineas = ["cosméticos", "industrial", "farmacéutico"]
        if update_data['linea_negocio'] not in valid_lineas:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Línea de negocio inválida"
            )
    
    # Validar dimensión
    if 'dimension' in update_data and update_data['dimension']:
        valid_dimensiones = ["1x1", "2x1", "2x2"]
        if update_data['dimension'] not in valid_dimensiones:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Dimensión inválida"
            )
    
    # Validar estado
    if 'estado' in update_data and update_data['estado']:
        valid_estados = ["activa", "inactiva", "agotada", "vencida", "retirada"]
        if update_data['estado'] not in valid_estados:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Estado inválido"
            )
    
    # Actualizar campos
    for field, value in update_data.items():
        setattr(muestra, field, value)
    
    muestra.updated_by = current_user.id
    db.commit()
    db.refresh(muestra)
    
    return muestra


@router.delete("/{muestra_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_muestra(
    muestra_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Elimina (desactiva) una muestra. Requiere rol admin.
    """
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo administradores pueden eliminar muestras"
        )
    
    muestra = db.query(Sample).filter(Sample.id == muestra_id).first()
    if not muestra:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Muestra con ID {muestra_id} no encontrada"
        )
    
    # Soft delete
    muestra.estado = "retirada"
    db.commit()
    
    return None


@router.get("/stats/summary")
async def get_muestras_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Obtiene estadísticas resumidas del catálogo de muestras.
    """
    total_muestras = db.query(Sample).count()
    activas = db.query(Sample).filter(Sample.estado == "activa").count()
    agotadas = db.query(Sample).filter(Sample.estado == "agotada").count()
    vencidas = db.query(Sample).filter(Sample.estado == "vencida").count()
    
    # Por línea de negocio
    por_linea = {}
    for linea in ["cosméticos", "industrial", "farmacéutico"]:
        count = db.query(Sample).filter(Sample.linea_negocio == linea).count()
        por_linea[linea] = count
    
    # Cantidad total en gramos
    total_gramos = db.query(Sample).filter(
        Sample.estado == "activa"
    ).with_entities(Sample.cantidad_gramos).all()
    
    total_gr = sum(float(g[0]) if g[0] else 0 for g in total_gramos)
    
    return {
        "total": total_muestras,
        "activas": activas,
        "agotadas": agotadas,
        "vencidas": vencidas,
        "por_linea": por_linea,
        "total_gramos": round(total_gr, 2)
    }


@router.get("/options/lineas-negocio", response_model=List[dict])
async def get_lineas_negocio_options(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Obtiene opciones de líneas de negocio para dropdowns.
    """
    return [
        {"value": "cosméticos", "label": "Cosméticos"},
        {"value": "industrial", "label": "Industrial"},
        {"value": "farmacéutico", "label": "Farmacéutico"}
    ]


@router.get("/options/dimensiones", response_model=List[dict])
async def get_dimensiones_options(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Obtiene opciones de dimensiones para dropdowns.
    """
    return [
        {"value": "1x1", "label": "1x1 (Pequeño)"},
        {"value": "2x1", "label": "2x1 (Mediano)"},
        {"value": "2x2", "label": "2x2 (Grande)"}
    ]


@router.get("/options/estados", response_model=List[dict])
async def get_estados_options(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Obtiene opciones de estados para dropdowns.
    """
    return [
        {"value": "activa", "label": "Activa"},
        {"value": "inactiva", "label": "Inactiva"},
        {"value": "agotada", "label": "Agotada"},
        {"value": "vencida", "label": "Vencida"},
        {"value": "retirada", "label": "Retirada"}
    ]
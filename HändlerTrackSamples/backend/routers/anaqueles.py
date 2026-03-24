"""
Router de Anaqueles
API endpoints para gestionar los 14 anaqueles del almacén
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from typing import List, Optional

from database.database import get_db
from models.anaquel import Anaquel as AnaquelModel
from models.linea import Linea as LineaModel
from models.hilera import Hilera as HileraModel
from schemas import AnaquelCreate, AnaquelUpdate, Anaquel as AnaquelSchema, AnaquelWithRelations

router = APIRouter(prefix="/api/anaqueles", tags=["Anaqueles"])


@router.get("", response_model=List[AnaquelSchema])
def get_anaqueles(
    skip: int = 0,
    limit: int = 100,
    linea_id: Optional[int] = None,
    activo_only: bool = True,
    db: Session = Depends(get_db)
):
    """Obtener todos los anaqueles"""
    query = db.query(AnaquelModel).options(joinedload(AnaquelModel.linea))
    
    if activo_only:
        query = query.filter(AnaquelModel.activo == True)
    if linea_id:
        query = query.filter(AnaquelModel.linea_id == linea_id)
    
    anaqueles = query.offset(skip).limit(limit).all()
    
    # Calcular estadísticas adicionales
    result = []
    for anaquel in anaqueles:
        total_hileras = db.query(HileraModel).filter(HileraModel.anaquel_id == anaquel.id).count()
        disponibles = db.query(HileraModel).filter(
            HileraModel.anaquel_id == anaquel.id,
            HileraModel.estado == "disponible"
        ).count()
        
        anaquel_dict = AnaquelWithRelations(
            id=anaquel.id,
            nombre=anaquel.nombre,
            descripcion=anaquel.descripcion,
            linea_id=anaquel.linea_id,
            niveles=anaquel.niveles,
            hileras_por_nivel=anaquel.hileras_por_nivel,
            posiciones_por_hilera=anaquel.posiciones_por_hilera,
            proveedor_principal=anaquel.proveedor_principal,
            activo=anaquel.activo,
            en_mantenimiento=anaquel.en_mantenimiento,
            created_at=anaquel.created_at,
            updated_at=anaquel.updated_at,
            linea=anaquel.linea,
            total_hileras=total_hileras,
            hileras_disponibles=disponibles
        )
        result.append(anaquel_dict)
    
    return result


@router.get("/{anaquel_id}", response_model=AnaquelSchema)
def get_anaquel(anaquel_id: int, db: Session = Depends(get_db)):
    """Obtener un anaquel por ID"""
    anaquel = db.query(AnaquelModel).options(joinedload(AnaquelModel.linea)).filter(AnaquelModel.id == anaquel_id).first()
    if not anaquel:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Anaquel con ID {anaquel_id} no encontrado"
        )
    
    # Calcular estadísticas
    total_hileras = db.query(HileraModel).filter(HileraModel.anaquel_id == anaquel.id).count()
    disponibles = db.query(HileraModel).filter(
        HileraModel.anaquel_id == anaquel.id,
        HileraModel.estado == "disponible"
    ).count()
    
    return AnaquelWithRelations(
        id=anaquel.id,
        nombre=anaquel.nombre,
        descripcion=anaquel.descripcion,
        linea_id=anaquel.linea_id,
        niveles=anaquel.niveles,
        hileras_por_nivel=anaquel.hileras_por_nivel,
        posiciones_por_hilera=anaquel.posiciones_por_hilera,
        proveedor_principal=anaquel.proveedor_principal,
        activo=anaquel.activo,
        en_mantenimiento=anaquel.en_mantenimiento,
        created_at=anaquel.created_at,
        updated_at=anaquel.updated_at,
        linea=anaquel.linea,
        total_hileras=total_hileras,
        hileras_disponibles=disponibles
    )


@router.post("", response_model=AnaquelSchema, status_code=status.HTTP_201_CREATED)
def create_anaquel(anaquel: AnaquelCreate, db: Session = Depends(get_db)):
    """Crear un nuevo anaquel"""
    # Verificar que la línea exista
    linea = db.query(LineaModel).filter(LineaModel.id == anaquel.linea_id).first()
    if not linea:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Línea de negocio con ID {anaquel.linea_id} no encontrada"
        )
    
    # Verificar nombre único
    existing = db.query(AnaquelModel).filter(AnaquelModel.nombre == anaquel.nombre).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Ya existe un anaquel con el nombre '{anaquel.nombre}'"
        )
    
    db_anaquel = AnaquelModel(**anaquel.model_dump())
    db.add(db_anaquel)
    db.commit()
    db.refresh(db_anaquel)
    return db_anaquel


@router.put("/{anaquel_id}", response_model=AnaquelSchema)
def update_anaquel(anaquel_id: int, anaquel_update: AnaquelUpdate, db: Session = Depends(get_db)):
    """Actualizar un anaquel"""
    anaquel = db.query(AnaquelModel).filter(AnaquelModel.id == anaquel_id).first()
    if not anaquel:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Anaquel con ID {anaquel_id} no encontrado"
        )
    
    # Verificar línea si se actualiza
    if anaquel_update.linea_id:
        linea = db.query(LineaModel).filter(LineaModel.id == anaquel_update.linea_id).first()
        if not linea:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Línea de negocio con ID {anaquel_update.linea_id} no encontrada"
            )
    
    # Verificar nombre único
    if anaquel_update.nombre and anaquel_update.nombre != anaquel.nombre:
        existing = db.query(AnaquelModel).filter(AnaquelModel.nombre == anaquel_update.nombre).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Ya existe un anaquel con el nombre '{anaquel_update.nombre}'"
            )
    
    # Actualizar campos
    for field, value in anaquel_update.model_dump(exclude_unset=True).items():
        setattr(anaquel, field, value)
    
    db.commit()
    db.refresh(anaquel)
    return anaquel


@router.delete("/{anaquel_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_anaquel(anaquel_id: int, db: Session = Depends(get_db)):
    """Eliminar (desactivar) un anaquel"""
    anaquel = db.query(AnaquelModel).filter(AnaquelModel.id == anaquel_id).first()
    if not anaquel:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Anaquel con ID {anaquel_id} no encontrado"
        )
    
    # Desactivar en lugar de eliminar
    anaquel.activo = False
    db.commit()
    return None


@router.get("/count", response_model=dict)
def count_anaqueles(
    linea_id: Optional[int] = None,
    activo_only: bool = True,
    db: Session = Depends(get_db)
):
    """Contar anaqueles"""
    query = db.query(AnaquelModel)
    if activo_only:
        query = query.filter(AnaquelModel.activo == True)
    if linea_id:
        query = query.filter(AnaquelModel.linea_id == linea_id)
    return {"total": query.count()}


@router.get("/por-linea/{linea_id}", response_model=List[AnaquelSchema])
def get_anaqueles_por_linea(linea_id: int, db: Session = Depends(get_db)):
    """Obtener anaqueles de una línea específica"""
    linea = db.query(LineaModel).filter(LineaModel.id == linea_id).first()
    if not linea:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Línea de negocio con ID {linea_id} no encontrada"
        )
    
    return db.query(AnaquelModel).filter(
        AnaquelModel.linea_id == linea_id,
        AnaquelModel.activo == True
    ).all()
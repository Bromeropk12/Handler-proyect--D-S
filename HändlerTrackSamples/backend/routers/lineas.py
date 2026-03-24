"""
Router de Líneas de Negocio
API endpoints para gestionar las líneas de negocio del almacén
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from database.database import get_db
from models.linea import Linea as LineaModel
from schemas import LineaCreate, LineaUpdate, Linea as LineaSchema

router = APIRouter(prefix="/api/lineas", tags=["Líneas de Negocio"])


@router.get("", response_model=List[LineaSchema])
def get_lineas(
    skip: int = 0,
    limit: int = 100,
    activa_only: bool = True,
    db: Session = Depends(get_db)
):
    """Obtener todas las líneas de negocio"""
    query = db.query(LineaModel)
    if activa_only:
        query = query.filter(LineaModel.activa == True)
    return query.offset(skip).limit(limit).all()


@router.get("/{linea_id}", response_model=LineaSchema)
def get_linea(linea_id: int, db: Session = Depends(get_db)):
    """Obtener una línea de negocio por ID"""
    linea = db.query(LineaModel).filter(LineaModel.id == linea_id).first()
    if not linea:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Línea de negocio con ID {linea_id} no encontrada"
        )
    return linea


@router.post("", response_model=LineaSchema, status_code=status.HTTP_201_CREATED)
def create_linea(linea: LineaCreate, db: Session = Depends(get_db)):
    """Crear una nueva línea de negocio"""
    # Verificar que no exista una línea con el mismo nombre
    existing = db.query(LineaModel).filter(LineaModel.nombre == linea.nombre).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Ya existe una línea de negocio con el nombre '{linea.nombre}'"
        )
    
    db_linea = LineaModel(**linea.model_dump())
    db.add(db_linea)
    db.commit()
    db.refresh(db_linea)
    return db_linea


@router.put("/{linea_id}", response_model=LineaSchema)
def update_linea(linea_id: int, linea_update: LineaUpdate, db: Session = Depends(get_db)):
    """Actualizar una línea de negocio"""
    linea = db.query(LineaModel).filter(LineaModel.id == linea_id).first()
    if not linea:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Línea de negocio con ID {linea_id} no encontrada"
        )
    
    # Verificar nombre único si se está actualizando
    if linea_update.nombre and linea_update.nombre != linea.nombre:
        existing = db.query(LineaModel).filter(LineaModel.nombre == linea_update.nombre).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Ya existe una línea de negocio con el nombre '{linea_update.nombre}'"
            )
    
    # Actualizar campos
    for field, value in linea_update.model_dump(exclude_unset=True).items():
        setattr(linea, field, value)
    
    db.commit()
    db.refresh(linea)
    return linea


@router.delete("/{linea_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_linea(linea_id: int, db: Session = Depends(get_db)):
    """Eliminar (desactivar) una línea de negocio"""
    linea = db.query(LineaModel).filter(LineaModel.id == linea_id).first()
    if not linea:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Línea de negocio con ID {linea_id} no encontrada"
        )
    
    # Desactivar en lugar de eliminar (soft delete)
    linea.activa = False
    db.commit()
    return None


@router.get("/count", response_model=dict)
def count_lineas(activa_only: bool = True, db: Session = Depends(get_db)):
    """Contar líneas de negocio"""
    query = db.query(LineaModel)
    if activa_only:
        query = query.filter(LineaModel.activa == True)
    return {"total": query.count()}
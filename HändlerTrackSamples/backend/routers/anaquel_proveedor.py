"""
Router de AnaquelProveedor (RNF-2)
API endpoints para gestionar la relación muchos-a-muchos entre Anaqueles y Proveedores
Permite soportar anaqueles con múltiples proveedores (ej: BASF & THOR mixto)
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional

from database.database import get_db
from models.anaquel import Anaquel as AnaquelModel
from models.proveedor import Proveedor as ProveedorModel
from models.anaquel_proveedor import AnaquelProveedor as AnaquelProveedorModel
from schemas import (
    AnaquelProveedorCreate, 
    AnaquelProveedorUpdate, 
    AnaquelProveedorResponse as AnaquelProveedorSchema,
    AnaquelProveedorWithRelations,
    AsignarProveedoresRequest
)

router = APIRouter(prefix="/api/anaquel-proveedor", tags=["AnaquelProveedor"])


@router.get("", response_model=List[AnaquelProveedorWithRelations])
def get_anaquel_proveedores(
    anaquel_id: Optional[int] = None,
    proveedor_id: Optional[int] = None,
    solo_activos: bool = True,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """
    Obtener todas las relaciones anaquel-proveedor
    Puede filtrar por anaquel_id o proveedor_id
    """
    query = db.query(AnaquelProveedorModel).options(
        joinedload(AnaquelProveedorModel.anaquel),
        joinedload(AnaquelProveedorModel.proveedor)
    )
    
    if solo_activos:
        query = query.filter(AnaquelProveedorModel.activo == True)
    if anaquel_id:
        query = query.filter(AnaquelProveedorModel.anaquel_id == anaquel_id)
    if proveedor_id:
        query = query.filter(AnaquelProveedorModel.proveedor_id == proveedor_id)
    
    return query.offset(skip).limit(limit).all()


@router.get("/{relacion_id}", response_model=AnaquelProveedorWithRelations)
def get_anaquel_proveedor(relacion_id: int, db: Session = Depends(get_db)):
    """Obtener una relación específica por ID"""
    relacion = db.query(AnaquelProveedorModel).options(
        joinedload(AnaquelProveedorModel.anaquel),
        joinedload(AnaquelProveedorModel.proveedor)
    ).filter(AnaquelProveedorModel.id == relacion_id).first()
    
    if not relacion:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Relación anaquel-proveedor con ID {relacion_id} no encontrada"
        )
    return relacion


@router.post("", response_model=AnaquelProveedorSchema, status_code=status.HTTP_201_CREATED)
def create_anaquel_proveedor(
    relacion: AnaquelProveedorCreate, 
    db: Session = Depends(get_db)
):
    """Crear una nueva relación anaquel-proveedor"""
    
    # Verificar que el anaquel exista
    anaquel = db.query(AnaquelModel).filter(AnaquelModel.id == relacion.anaquel_id).first()
    if not anaquel:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Anaquel con ID {relacion.anaquel_id} no encontrado"
        )
    
    # Verificar que el proveedor exista
    proveedor = db.query(ProveedorModel).filter(ProveedorModel.id == relacion.proveedor_id).first()
    if not proveedor:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Proveedor con ID {relacion.proveedor_id} no encontrado"
        )
    
    # Verificar que no exista duplicado
    existing = db.query(AnaquelProveedorModel).filter(
        AnaquelProveedorModel.anaquel_id == relacion.anaquel_id,
        AnaquelProveedorModel.proveedor_id == relacion.proveedor_id
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Ya existe una relación entre el anaquel {anaquel.nombre} y el proveedor {proveedor.nombre}"
        )
    
    # Si es principal, desmarcar otros del mismo anaquel
    if relacion.es_principal:
        db.query(AnaquelProveedorModel).filter(
            AnaquelProveedorModel.anaquel_id == relacion.anaquel_id,
            AnaquelProveedorModel.es_principal == True
        ).update({"es_principal": False})
    
    db_relacion = AnaquelProveedorModel(**relacion.model_dump())
    db.add(db_relacion)
    db.commit()
    db.refresh(db_relacion)
    return db_relacion


@router.put("/{relacion_id}", response_model=AnaquelProveedorSchema)
def update_anaquel_proveedor(
    relacion_id: int, 
    relacion_update: AnaquelProveedorUpdate,
    db: Session = Depends(get_db)
):
    """Actualizar una relación anaquel-proveedor"""
    relacion = db.query(AnaquelProveedorModel).filter(AnaquelProveedorModel.id == relacion_id).first()
    
    if not relacion:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Relación anaquel-proveedor con ID {relacion_id} no encontrada"
        )
    
    # Si se marca como principal, desmarcar otros del mismo anaquel
    if relacion_update.es_principal and not relacion.es_principal:
        db.query(AnaquelProveedorModel).filter(
            AnaquelProveedorModel.anaquel_id == relacion.anaquel_id,
            AnaquelProveedorModel.es_principal == True,
            AnaquelProveedorModel.id != relacion_id
        ).update({"es_principal": False})
    
    for field, value in relacion_update.model_dump(exclude_unset=True).items():
        setattr(relacion, field, value)
    
    db.commit()
    db.refresh(relacion)
    return relacion


@router.delete("/{relacion_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_anaquel_proveedor(relacion_id: int, db: Session = Depends(get_db)):
    """Eliminar (desactivar) una relación anaquel-proveedor"""
    relacion = db.query(AnaquelProveedorModel).filter(AnaquelProveedorModel.id == relacion_id).first()
    
    if not relacion:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Relación anaquel-proveedor con ID {relacion_id} no encontrada"
        )
    
    # Desactivar en lugar de eliminar
    relacion.activo = False
    db.commit()
    return None


@router.get("/anaquel/{anaquel_id}/proveedores")
def get_proveedores_de_anaquel(
    anaquel_id: int, 
    db: Session = Depends(get_db)
):
    """Obtener todos los proveedores asociados a un anaquel"""
    relaciones = db.query(AnaquelProveedorModel).options(
        joinedload(AnaquelProveedorModel.proveedor)
    ).filter(
        AnaquelProveedorModel.anaquel_id == anaquel_id,
        AnaquelProveedorModel.activo == True
    ).all()
    
    return [
        {
            "id": r.proveedor.id,
            "nombre": r.proveedor.nombre,
            "nit": r.proveedor.nit,
            "es_principal": r.es_principal,
            "capacidad_max_gramos": r.capacidad_max_gramos
        }
        for r in relaciones
    ]


@router.get("/proveedor/{proveedor_id}/anaqueles")
def get_anaqueles_de_proveedor(
    proveedor_id: int, 
    db: Session = Depends(get_db)
):
    """Obtener todos los anaqueles asociados a un proveedor"""
    relaciones = db.query(AnaquelProveedorModel).options(
        joinedload(AnaquelProveedorModel.anaquel)
    ).filter(
        AnaquelProveedorModel.proveedor_id == proveedor_id,
        AnaquelProveedorModel.activo == True
    ).all()
    
    return [
        {
            "id": r.anaquel.id,
            "nombre": r.anaquel.nombre,
            "proveedor_principal": r.anaquel.proveedor_principal,
            "es_principal": r.es_principal,
            "linea_id": r.anaquel.linea_id
        }
        for r in relaciones
    ]


@router.post("/asignar-multiples")
def asignar_proveedores_a_anaquel(
    request: AsignarProveedoresRequest,
    db: Session = Depends(get_db)
):
    """
    Asignar múltiples proveedores a un anaquel
    Recibe: { "anaquel_id": 1, "proveedor_ids": [1,2,3] }
    Guarda todos los nombres concatenados con ' & '
    """
    anaquel_id = request.anaquel_id
    proveedor_ids = request.proveedor_ids
    
    if not anaquel_id or not proveedor_ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Se requiere anaquel_id y proveedor_ids"
        )
    
    # Verificar anaquel
    anaquel = db.query(AnaquelModel).filter(AnaquelModel.id == anaquel_id).first()
    if not anaquel:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Anaquel con ID {anaquel_id} no encontrado"
        )
    
    # Verificar proveedores
    proveedores = db.query(ProveedorModel).filter(ProveedorModel.id.in_(proveedor_ids)).all()
    if len(proveedores) != len(proveedor_ids):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Algunos proveedores no fueron encontrados"
        )
    
    # Eliminar relaciones existentes
    db.query(AnaquelProveedorModel).filter(
        AnaquelProveedorModel.anaquel_id == anaquel_id
    ).delete()
    
    # Crear nuevas relaciones
    for prov in proveedores:
        relacion = AnaquelProveedorModel(
            anaquel_id=anaquel_id,
            proveedor_id=prov.id,
            es_principal=False  # Ya no hay principal, todos son iguales
        )
        db.add(relacion)
    
    # Actualizar proveedor_principal con todos los nombres concatenados
    nombres_proveedores = " & ".join([p.nombre for p in proveedores])
    anaquel.proveedor_principal = nombres_proveedores
    
    db.commit()
    
    return {
        "message": f"Se asignaron {len(proveedores)} proveedores al anaquel {anaquel.nombre}",
        "proveedor_principal": nombres_proveedores
    }


@router.get("/por-linea/{linea_id}")
def get_anaqueles_con_proveedores_por_linea(
    linea_id: int,
    db: Session = Depends(get_db)
):
    """Obtener todos los anaqueles de una línea con sus proveedores asociados"""
    anaqueles = db.query(AnaquelModel).filter(
        AnaquelModel.linea_id == linea_id,
        AnaquelModel.activo == True
    ).all()
    
    result = []
    for anaquel in anaqueles:
        relaciones = db.query(AnaquelProveedorModel).options(
            joinedload(AnaquelProveedorModel.proveedor)
        ).filter(
            AnaquelProveedorModel.anaquel_id == anaquel.id,
            AnaquelProveedorModel.activo == True
        ).all()
        
        proveedores = [
            {
                "id": r.proveedor.id,
                "nombre": r.proveedor.nombre,
                "es_principal": r.es_principal
            }
            for r in relaciones
        ]
        
        result.append({
            "anaquel": {
                "id": anaquel.id,
                "nombre": anaquel.nombre,
                "proveedor_principal": anaquel.proveedor_principal
            },
            "proveedores": proveedores
        })
    
    return result
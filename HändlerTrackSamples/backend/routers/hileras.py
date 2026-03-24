"""
Router de Hileras
API endpoints para gestionar las posiciones físicas dentro de los anaqueles
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional

from database.database import get_db
from models.hilera import Hilera as HileraModel
from models.anaquel import Anaquel as AnaquelModel
from models.linea import Linea as LineaModel
from schemas import HileraCreate, HileraUpdate, Hilera as HileraSchema, HileraWithRelations

router = APIRouter(prefix="/api/hileras", tags=["Hileras"])


@router.get("", response_model=List[HileraSchema])
def get_hileras(
    skip: int = 0,
    limit: int = 100,
    anaquel_id: Optional[int] = None,
    nivel: Optional[int] = None,
    estado: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Obtener todas las hileras con filtros"""
    query = db.query(HileraModel).options(
        joinedload(HileraModel.anaquel),
        joinedload(HileraModel.muestra)
    )
    
    if anaquel_id:
        query = query.filter(HileraModel.anaquel_id == anaquel_id)
    if nivel:
        query = query.filter(HileraModel.nivel == nivel)
    if estado:
        query = query.filter(HileraModel.estado == estado)
    
    hileras = query.offset(skip).limit(limit).all()
    
    # Convertir a schema con relaciones
    result = []
    for h in hileras:
        result.append(HileraWithRelations(
            id=h.id,
            anaquel_id=h.anaquel_id,
            nivel=h.nivel,
            fila=h.fila,
            posicion=h.posicion,
            capacidad_max=h.capacidad_max,
            posiciones_usadas=h.posiciones_usadas,
            ancho_min=h.ancho_min,
            ancho_max=h.ancho_max,
            fondo_min=h.fondo_min,
            fondo_max=h.fondo_max,
            estado_fisico_sugerido=h.estado_fisico_sugerido,
            estado=h.estado,
            muestra_id=h.muestra_id,
            created_at=h.created_at,
            updated_at=h.updated_at,
            anaquel=h.anaquel,
            muestra=h.muestra
        ))
    return result


@router.get("/{hilera_id}", response_model=HileraSchema)
def get_hilera(hilera_id: int, db: Session = Depends(get_db)):
    """Obtener una hilera por ID"""
    hilera = db.query(HileraModel).options(
        joinedload(HileraModel.anaquel),
        joinedload(HileraModel.muestra)
    ).filter(HileraModel.id == hilera_id).first()
    
    if not hilera:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Hilera con ID {hilera_id} no encontrada"
        )
    
    return hilera


@router.post("", response_model=HileraSchema, status_code=status.HTTP_201_CREATED)
def create_hilera(hilera: HileraCreate, db: Session = Depends(get_db)):
    """Crear una nueva hilera"""
    # Verificar que el anaquel exista
    anaquel = db.query(AnaquelModel).filter(AnaquelModel.id == hilera.anaquel_id).first()
    if not anaquel:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Anaquel con ID {hilera.anaquel_id} no encontrado"
        )
    
    # Verificar que la posición no exista
    existing = db.query(HileraModel).filter(
        HileraModel.anaquel_id == hilera.anaquel_id,
        HileraModel.nivel == hilera.nivel,
        HileraModel.fila == hilera.fila,
        HileraModel.posicion == hilera.posicion
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Ya existe una hilera en la posición {hilera.nivel}-{hilera.fila}-{hilera.posicion} del anaquel {hilera.anaquel_id}"
        )
    
    db_hilera = HileraModel(**hilera.model_dump())
    db.add(db_hilera)
    db.commit()
    db.refresh(db_hilera)
    return db_hilera


@router.put("/{hilera_id}", response_model=HileraSchema)
def update_hilera(hilera_id: int, hilera_update: HileraUpdate, db: Session = Depends(get_db)):
    """Actualizar una hilera"""
    hilera = db.query(HileraModel).filter(HileraModel.id == hilera_id).first()
    if not hilera:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Hilera con ID {hilera_id} no encontrada"
        )
    
    # Actualizar campos
    for field, value in hilera_update.model_dump(exclude_unset=True).items():
        setattr(hilera, field, value)
    
    db.commit()
    db.refresh(hilera)
    return hilera


@router.delete("/{hilera_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_hilera(hilera_id: int, db: Session = Depends(get_db)):
    """Eliminar una hilera"""
    hilera = db.query(HileraModel).filter(HileraModel.id == hilera_id).first()
    if not hilera:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Hilera con ID {hilera_id} no encontrada"
        )
    
    # Verificar que esté vacía
    if hilera.posiciones_usadas > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No se puede eliminar una hilera que tiene muestras almacenadas"
        )
    
    db.delete(hilera)
    db.commit()
    return None


@router.get("/disponibles", response_model=List[HileraSchema])
def get_hileras_disponibles(
    linea_id: Optional[int] = Query(None, description="Filtrar por línea de negocio"),
    nivel: Optional[int] = Query(None, description="Filtrar por nivel (1-10)"),
    estado_fisico: Optional[str] = Query(None, description="Estado físico: líquido, sólido, ambos"),
    dimension_ancho: Optional[int] = Query(None, ge=1, le=2, description="Ancho requerido"),
    dimension_fondo: Optional[int] = Query(None, ge=1, le=2, description="Fondo requerido"),
    db: Session = Depends(get_db)
):
    """Obtener hileras disponibles que coincidan con los criterios"""
    query = db.query(HileraModel).join(AnaquelModel).options(joinedload(HileraModel.anaquel))
    
    # Solo hileras disponibles
    query = query.filter(HileraModel.estado == "disponible")
    query = query.filter(HileraModel.posiciones_usadas < HileraModel.capacidad_max)
    
    if linea_id:
        query = query.filter(AnaquelModel.linea_id == linea_id)
    
    if nivel:
        query = query.filter(HileraModel.nivel == nivel)
    
    if estado_fisico:
        query = query.filter(HileraModel.estado_fisico_sugerido.in_([estado_fisico, "ambos"]))
    
    if dimension_ancho:
        query = query.filter(HileraModel.ancho_max >= dimension_ancho)
    
    if dimension_fondo:
        query = query.filter(HileraModel.fondo_max >= dimension_fondo)
    
    return query.limit(100).all()


@router.get("/count", response_model=dict)
def count_hileras(
    anaquel_id: Optional[int] = None,
    estado: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Contar hileras"""
    query = db.query(HileraModel)
    if anaquel_id:
        query = query.filter(HileraModel.anaquel_id == anaquel_id)
    if estado:
        query = query.filter(HileraModel.estado == estado)
    return {"total": query.count()}


@router.get("/por-anaquel/{anaquel_id}", response_model=List[HileraSchema])
def get_hileras_por_anaquel(
    anaquel_id: int,
    nivel: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """Obtener todas las hileras de un anaquel específico"""
    anaquel = db.query(AnaquelModel).filter(AnaquelModel.id == anaquel_id).first()
    if not anaquel:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Anaquel con ID {anaquel_id} no encontrado"
        )
    
    query = db.query(HileraModel).filter(HileraModel.anaquel_id == anaquel_id)
    if nivel:
        query = query.filter(HileraModel.nivel == nivel)
    
    return query.order_by(HileraModel.nivel, HileraModel.fila, HileraModel.posicion).all()
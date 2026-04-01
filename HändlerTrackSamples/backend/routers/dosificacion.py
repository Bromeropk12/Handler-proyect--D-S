"""
Router de Dosificación (RNF-1)
API para dosificar muestras bulk en submuestras con QR únicos

Solo administradores pueden ejecutar dosificación.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional, Any
from pydantic import BaseModel
from decimal import Decimal

from database.database import get_db
from models.user import User
from models.sample import Sample
from services.dosificacion import DosificacionService
from security import get_current_user

router = APIRouter(prefix="/api/dosificacion", tags=["Dosificación"])


class ValidarDosificacionRequest(BaseModel):
    cantidad_total: float
    unidades: int
    gramos_por_unidad: float


class CrearSubmuestrasRequest(BaseModel):
    muestra_parent_id: int
    unidades: int
    gramos_por_unidad: float
    observaciones: Optional[str] = None


async def check_admin_role(current_user: User = Depends(get_current_user)) -> Any:
    """Verifica que el usuario sea administrador"""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo administradores pueden dosificar muestras",
        )
    return current_user


@router.post("/validar")
async def validar_integridad_matematica(
    request: ValidarDosificacionRequest,
    current_user: User = Depends(get_current_user),
):
    """
    Valida la integridad matemática de dosificación.
    Retorna: {valido: bool, cantidad_total, total_calculado, diferencia}
    """
    resultado = DosificacionService.validar_integridad_matematica(
        cantidad_total=Decimal(str(request.cantidad_total)),
        unidades=request.unidades,
        gramos_por_unidad=Decimal(str(request.gramos_por_unidad)),
    )

    return resultado


@router.post("/crear-submuestras")
async def crear_submuestras(
    request: CrearSubmuestrasRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(check_admin_role),
):
    """
    Crea submuestras a partir de una muestra bulk.
    Genera QR único para cada submuestra.
    Marca la muestra padre como dosificada.
    """
    resultado = DosificacionService.crear_submuestras(
        db=db,
        muestra_parent_id=request.muestra_parent_id,
        unidades=request.unidades,
        gramos_por_unidad=Decimal(str(request.gramos_por_unidad)),
        usuario_id=current_user.id,
        observaciones=request.observaciones,
    )

    if not resultado.get("success"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=resultado.get("error", "Error al dosificar"),
        )

    return resultado


@router.get("/info/{muestra_id}")
async def obtener_info_dosificacion(
    muestra_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Obtiene información de dosificación de una muestra.
    """
    resultado = DosificacionService.obtener_info_dosificacion(
        db=db, muestra_id=muestra_id
    )

    return resultado


@router.get("/submuestras/{muestra_parent_id}")
async def listar_submuestras(
    muestra_parent_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Lista todas las submuestras de una muestra padre.
    """
    submuestras = DosificacionService.listar_submuestras(
        db=db, muestra_parent_id=muestra_parent_id
    )

    return [
        {
            "id": s.id,
            "nombre": s.nombre,
            "lote": s.lote,
            "cantidad_gramos": float(s.cantidad_gramos) if s.cantidad_gramos else 0,
            "qr_code": s.qr_code,
            "estado": s.estado,
        }
        for s in submuestras
    ]


@router.get("/contador-submuestras/{muestra_id}")
async def get_contador_submuestras(
    muestra_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retorna el número de submuestras asociadas a una muestra padre.
    """
    from models.sample import Sample

    count = db.query(Sample).filter(Sample.sample_parent_id == muestra_id).count()

    return {"muestra_parent_id": muestra_id, "total_submuestras": count}

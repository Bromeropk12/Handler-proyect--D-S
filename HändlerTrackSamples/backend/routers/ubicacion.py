"""
Router de Ubicación Inteligente
API para Localización, Asignación y Compatibilidad Química

Endpoints:
- POST /api/ubicacion/sugerir - Sugiere ubicación para una muestra
- POST /api/ubicacion/asignar - Asigna muestra a hilera específica
- GET /api/ubicacion/verificar/{muestra_id}/{hilera_id} - Verifica compatibilidad
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional
from pydantic import BaseModel

from database.database import get_db
from models.user import User
from models.sample import Sample
from models.hilera import Hilera
from services.location_engine import LocationEngine
from services.compatibilidad import CompatibilidadService
from security import get_current_user

router = APIRouter(prefix="/api/ubicacion", tags=["Ubicación Inteligente"])


class SugerirUbicacionRequest(BaseModel):
    muestra_id: int
    ignorar_compatibilidad: bool = False


class AsignarUbicacionRequest(BaseModel):
    muestra_id: int
    hilera_id: int


@router.post("/sugerir")
async def sugerir_ubicacion(
    request: SugerirUbicacionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Sugiere la mejor ubicación para una muestra.
    Retorna ubicación sugerida + alternativas.
    """
    resultado = LocationEngine.sugerir_ubicacion(
        db=db,
        muestra_id=request.muestra_id,
        ignorar_compatibilidad=request.ignorar_compatibilidad,
    )

    if not resultado.get("success"):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=resultado.get("error", "No se pudo sugerir ubicación"),
        )

    return resultado


@router.post("/asignar")
async def asignar_muestra_ubicacion(
    request: AsignarUbicacionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Asigna una muestra a una hilera específica.
    Verifica compatibilidad antes de asignar.
    """
    resultado = LocationEngine.asignar_muestra(
        db=db,
        muestra_id=request.muestra_id,
        hilera_id=request.hilera_id,
        usuario_id=current_user.id,
    )

    if not resultado.get("success"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=resultado.get("error", "Error al asignar"),
        )

    return resultado


@router.get("/verificar/{muestra_id}/{hilera_id}")
async def verificar_compatibilidad(
    muestra_id: int,
    hilera_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Verifica si es seguro asignar una muestra a una hilera.
    Retorna: {seguro: bool, mensaje: str, incompatibilidades: []}
    """
    resultado = CompatibilidadService.es_seguro_asignar(
        db=db, muestra_id=muestra_id, hilera_id=hilera_id
    )

    return resultado


@router.get("/compatibilidad/matriz")
async def get_matriz_compatibilidad(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    """
    Obtiene la matriz completa de compatibilidad química GHS.
    """
    matriz = CompatibilidadService.get_matriz_completa(db)
    return {"matriz": matriz}


@router.get("/compatibilidad/incompatibles/{clase_codigo}")
async def get_clases_incompatibles(
    clase_codigo: str, current_user: User = Depends(get_current_user)
):
    """
    Obtiene las clases incompatibles con una clase dada.
    """
    incompatibles = CompatibilidadService.get_clases_incompatibles(clase_codigo)
    return {"clase": clase_codigo, "incompatibles": incompatibles}

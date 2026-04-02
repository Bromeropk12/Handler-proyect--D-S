"""
Router del Motor de Organización
Endpoints para la organización automática del almacén
"""

from fastapi import APIRouter, Depends, Query, Body
from sqlalchemy.orm import Session
from database.database import get_db
from services.motor_organizacion import MotorOrganizacion
from typing import Optional
from pydantic import BaseModel

router = APIRouter(prefix="/api/organizacion", tags=["organizacion"])


class OrganizarMuestraRequest(BaseModel):
    muestra_id: int
    modo: str = "auto"  # "auto" | "sugerido" | "manual"
    hilera_id: Optional[int] = None


class OrganizarAlmacenRequest(BaseModel):
    linea_id: Optional[int] = None
    solo_incompatibles: bool = False


@router.post("/muestra")
def organizar_muestra(request: OrganizarMuestraRequest, db: Session = Depends(get_db)):
    """
    Organiza una muestra específica en el almacén.
    Modo: auto (busca mejor ubicación), sugerido (solo sugiere), manual (a ubicación específica)
    """
    return MotorOrganizacion.organizar_muestra(
        db=db,
        muestra_id=request.muestra_id,
        modo=request.modo,
        hilera_id_seleccionada=request.hilera_id,
    )


@router.post("/almacen")
def organizar_almacen(request: OrganizarAlmacenRequest, db: Session = Depends(get_db)):
    """
    Reorganiza todo el almacén o una línea específica.
    """
    return MotorOrganizacion.organizar_todo_el_almacen(
        db=db, linea_id=request.linea_id, solo_incompatibles=request.solo_incompatibles
    )


@router.get("/analisis")
def analizar_organizacion(
    linea_id: Optional[int] = Query(None, description="ID de línea a analizar"),
    db: Session = Depends(get_db),
):
    """
    Analiza el estado actual de organización del almacén.
    Retorna: score, incompatibilidades, sugerencias
    """
    return MotorOrganizacion.analizar_organizacion_actual(db, linea_id)


@router.get("/resumen-lineas")
def obtener_resumen_por_lineas(db: Session = Depends(get_db)):
    """
    Obtiene resumen de organización por cada línea de negocio.
    """
    return MotorOrganizacion.obtener_resumen_lineas(db)


@router.get("/hileras-contenido")
def obtener_hileras_con_contenido(
    linea_id: Optional[int] = Query(None, description="Filtrar por línea"),
    anaquel_id: Optional[int] = Query(None, description="Filtrar por anaquel"),
    db: Session = Depends(get_db),
):
    """
    Obtiene todas las hileras con su contenido para visualización interactiva.
    Incluye información de incompatibilidades.
    """
    return MotorOrganizacion.obtener_hileras_con_contenido(
        db=db, linea_id=linea_id, anaquel_id=anaquel_id
    )


@router.get("/hileras/linea/{linea_id}")
def obtener_hileras_por_linea(linea_id: int, db: Session = Depends(get_db)):
    """
    Obtiene hileras de una línea específica con su contenido.
    """
    hileras = MotorOrganizacion.obtener_hileras_con_contenido(db=db, linea_id=linea_id)
    return {"success": True, "linea_id": linea_id, "hileras": hileras}

"""
Router de FEFO (First Expire First Out)
API para estrategia de despacho por vencimiento

Endpoints:
- GET /api/fefo/buscar - Busca muestras activas ordenadas por vencimiento
- POST /api/fefo/sugerir - Sugiere muestra para despacho
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import asc
from typing import List, Optional
from datetime import datetime, timedelta

from database.database import get_db
from models.user import User
from models.sample import Sample
from models.hilera import Hilera
from models.anaquel import Anaquel
from models.linea import Linea
from security import get_current_user

router = APIRouter(prefix="/api/fefo", tags=["FEFO"])


@router.get("/buscar")
async def buscar_muestras_fefo(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    linea_negocio: Optional[str] = Query(None, description="Filtrar por línea"),
    proveedor_id: Optional[int] = Query(None, description="Filtrar por proveedor"),
    cantidad_necesaria: Optional[float] = Query(
        None, description="Cantidad needed in gramos"
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Busca muestras activas ordenadas por fecha de vencimiento (FEFO).
    Retorna las más próximas a vencer primero.
    """
    query = db.query(Sample).filter(
        Sample.estado == "activa", Sample.cantidad_gramos > 0
    )

    if linea_negocio:
        query = query.filter(Sample.linea_negocio == linea_negocio)

    if proveedor_id:
        query = query.filter(Sample.proveedor_id == proveedor_id)

    # Ordenar por fecha de vencimiento ASC (FEFO)
    muestras = (
        query.order_by(asc(Sample.fecha_vencimiento), Sample.fecha_ingreso)
        .offset(skip)
        .limit(limit)
        .all()
    )

    resultados = []
    for m in muestras:
        # Obtener ubicación si existe
        ubicacion = None
        hilera = None
        if m.anaquel_id:
            hilera = (
                db.query(Hilera).join(Anaquel).filter(Hilera.muestra_id == m.id).first()
            )
            if hilera:
                ubicacion = {
                    "anaquel": hilera.anaquel.nombre if hilera.anaquel else None,
                    "nivel": hilera.nivel,
                    "fila": hilera.fila,
                    "posicion": hilera.posicion,
                }

        resultados.append(
            {
                "id": m.id,
                "nombre": m.nombre,
                "lote": m.lote,
                "cantidad_gramos": float(m.cantidad_gramos) if m.cantidad_gramos else 0,
                "fecha_vencimiento": m.fecha_vencimiento.isoformat()
                if m.fecha_vencimiento
                else None,
                "fecha_ingreso": m.fecha_ingreso.isoformat()
                if m.fecha_ingreso
                else None,
                "linea_negocio": m.linea_negocio,
                "proveedor_id": m.proveedor_id,
                "ubicacion": ubicacion,
            }
        )

    return {
        "muestras": resultados,
        "total": len(resultados),
        "estrategia": "FEFO (First Expire First Out)",
    }


@router.post("/sugerir")
async def sugerir_muestra_despacho(
    muestra_nombre: str,
    cantidad_gramos: float,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Sugiere la mejor muestra para despacho según FEFO.
    Sistema sugiere automáticamente la más próxima a vencer.
    Usuario puede hacer override.
    """
    # Buscar muestras con ese nombre (búsqueda exacta o parcial)
    muestras = (
        db.query(Sample)
        .filter(
            Sample.estado == "activa",
            Sample.cantidad_gramos > 0,
            Sample.nombre.ilike(f"%{muestra_nombre}%"),
        )
        .order_by(asc(Sample.fecha_vencimiento), Sample.fecha_ingreso)
        .limit(5)
        .all()
    )

    if not muestras:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No hay muestras activas de '{muestra_nombre}'",
        )

    sugerencias = []
    cantidad_acumulada = 0

    for m in muestras:
        cantidad_disponible = float(m.cantidad_gramos) if m.cantidad_gramos else 0
        cantidad_a_usar = min(cantidad_disponible, cantidad_gramos - cantidad_acumulada)

        # Obtener ubicación
        hilera = db.query(Hilera).filter(Hilera.muestra_id == m.id).first()
        ubicacion = None
        if hilera:
            ubicacion = {
                "anaquel": hilera.anaquel.nombre if hilera.anaquel else None,
                "nivel": hilera.nivel,
                "fila": hilera.fila,
                "posicion": hilera.posicion,
            }

        sugerencias.append(
            {
                "id": m.id,
                "nombre": m.nombre,
                "lote": m.lote,
                "cantidad_disponible": cantidad_disponible,
                "cantidad_a_usar": cantidad_a_usar,
                "fecha_vencimiento": m.fecha_vencimiento.isoformat()
                if m.fecha_vencimiento
                else None,
                "linea_negocio": m.linea_negocio,
                "ubicacion": ubicacion,
                "qr_code": m.qr_code,
            }
        )

        cantidad_acumulada += cantidad_a_usar
        if cantidad_acumulada >= cantidad_gramos:
            break

    return {
        "sugerencias": sugerencias,
        "cantidad_necesaria": cantidad_gramos,
        "cantidad_encontrada": cantidad_acumulada,
        "cumple": cantidad_acumulada >= cantidad_gramos,
        "nota": "Sistema sugiere las más próximas a vencer. Puede hacer override.",
    }


@router.get("/proximas-vencer")
async def get_proximas_vencer(
    dias: int = Query(30, ge=1, le=365),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Obtiene muestras próximas a vencer en X días.
    """
    from datetime import timedelta

    fecha_limite = datetime.now() + timedelta(days=dias)

    muestras = (
        db.query(Sample)
        .filter(
            Sample.estado == "activa",
            Sample.fecha_vencimiento.isnot(None),
            Sample.fecha_vencimiento <= fecha_limite,
        )
        .order_by(Sample.fecha_vencimiento)
        .limit(50)
        .all()
    )

    return [
        {
            "id": m.id,
            "nombre": m.nombre,
            "lote": m.lote,
            "cantidad_gramos": float(m.cantidad_gramos) if m.cantidad_gramos else 0,
            "dias_para_vencer": (m.fecha_vencimiento - datetime.now()).days
            if m.fecha_vencimiento
            else None,
            "fecha_vencimiento": m.fecha_vencimiento.isoformat()
            if m.fecha_vencimiento
            else None,
        }
        for m in muestras
    ]

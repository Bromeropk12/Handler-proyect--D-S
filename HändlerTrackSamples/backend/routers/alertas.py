"""
Router de Alertas
Endpoints para el sistema de alertas inteligentes
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from database.database import get_db
from services.alertas_service import AlertasService
from typing import Optional

router = APIRouter(prefix="/api/alertas", tags=["alertas"])


@router.get("/dashboard")
def get_dashboard_alertas(db: Session = Depends(get_db)):
    """
    Obtiene el dashboard completo de todas las alertas.
    """
    return AlertasService.get_dashboard_alertas(db)


@router.get("/stock-bajo")
def get_alertas_stock_bajo(
    umbral: Optional[float] = Query(None, description="Umbral personalizado en gramos"),
    db: Session = Depends(get_db),
):
    """
    Obtiene alertas de stock bajo.
    """
    return AlertasService.verificar_stock_bajo(db, umbral)


@router.get("/vencimientos")
def get_alertas_vencimientos(
    dias: int = Query(90, description="Días hacia adelante a considerar"),
    db: Session = Depends(get_db),
):
    """
    Obtiene alertas de muestras próximas a vencer.
    """
    return AlertasService.verificar_muestras_por_vencer(db, dias)


@router.get("/vencidas")
def get_alertas_vencidas(db: Session = Depends(get_db)):
    """
    Obtiene alertas de muestras ya vencidas.
    """
    return AlertasService.verificar_vencidas(db)


@router.get("/optimizacion")
def get_alertas_optimizacion(db: Session = Depends(get_db)):
    """
    Obtiene alertas de optimización de espacio.
    """
    return AlertasService.verificar_optimizacion_espacio(db)


@router.get("/por-tipo")
def get_alertas_por_tipo(
    tipo: str = Query(
        ..., description="Tipo: stock_bajo, vencimiento, vencidas, optimizacion"
    ),
    limite: int = Query(50, description="Número máximo de resultados"),
    db: Session = Depends(get_db),
):
    """
    Obtiene alertas de un tipo específico.
    """
    alertas = AlertasService.get_alertas_por_tipo(db, tipo, limite)
    return {"success": True, "tipo": tipo, "cantidad": len(alertas), "alertas": alertas}

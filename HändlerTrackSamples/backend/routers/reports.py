"""
Router de Reportes
Endpoints para generación de reportes del sistema
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from database.database import get_db
from services.reports_service import ReportsService
from typing import Optional
from datetime import date

router = APIRouter(prefix="/api/reportes", tags=["reportes"])


@router.get("/inventario")
def get_reporte_inventario(db: Session = Depends(get_db)):
    """
    Genera reporte de inventario actual.
    """
    return ReportsService.generar_reporte_inventario(db)


@router.get("/movimientos")
def get_reporte_movimientos(
    fecha_inicio: Optional[str] = Query(None, description="Fecha inicio (YYYY-MM-DD)"),
    fecha_fin: Optional[str] = Query(None, description="Fecha fin (YYYY-MM-DD)"),
    db: Session = Depends(get_db),
):
    """
    Genera reporte de movimientos.
    """
    inicio = None
    fin = None

    if fecha_inicio:
        try:
            inicio = date.fromisoformat(fecha_inicio)
        except ValueError:
            pass

    if fecha_fin:
        try:
            fin = date.fromisoformat(fecha_fin)
        except ValueError:
            pass

    return ReportsService.generar_reporte_movimientos(db, inicio, fin)


@router.get("/ocupacion")
def get_reporte_ocupacion(db: Session = Depends(get_db)):
    """
    Genera reporte de ocupación de anaqueles.
    """
    return ReportsService.generar_reporte_ocupacion(db)


@router.get("/vencimientos")
def get_reporte_vencimientos(
    dias: int = Query(90, description="Días hacia adelante a considerar"),
    db: Session = Depends(get_db),
):
    """
    Genera reporte de muestras próximas a vencer.
    """
    return ReportsService.generar_reporte_vencimientos(db, dias)


@router.get("/exportar/{tipo}")
def exportar_reporte(
    tipo: str,
    fecha_inicio: Optional[str] = Query(None),
    fecha_fin: Optional[str] = Query(None),
    dias: int = Query(90),
    db: Session = Depends(get_db),
):
    """
    Exporta un reporte a formato Excel.

    Tipos: inventario, movimientos, ocupacion, vencimientos
    """
    if tipo == "inventario":
        data = ReportsService.generar_reporte_inventario(db)
    elif tipo == "movimientos":
        inicio = None
        fin = None
        if fecha_inicio:
            try:
                inicio = date.fromisoformat(fecha_inicio)
            except ValueError:
                pass
        if fecha_fin:
            try:
                fin = date.fromisoformat(fecha_fin)
            except ValueError:
                pass
        data = ReportsService.generar_reporte_movimientos(db, inicio, fin)
    elif tipo == "ocupacion":
        data = ReportsService.generar_reporte_ocupacion(db)
    elif tipo == "vencimientos":
        data = ReportsService.generar_reporte_vencimientos(db, dias)
    else:
        return {"success": False, "error": "Tipo de reporte no válido"}

    # Generar Excel
    excel_bytes = ReportsService.exportar_excel(data)

    return {"success": True, "tipo": tipo, "data": data, "excel_available": True}


@router.get("/organizacion")
def get_reporte_organizacion(
    linea_id: Optional[int] = Query(None, description="ID de línea a analizar"),
    db: Session = Depends(get_db),
):
    """
    Genera reporte del estado de organización del almacén.
    Incluye score, incompatibilidades y sugerencias.
    """
    return ReportsService.generar_reporte_organizacion(db, linea_id)


@router.get("/exportar/organizacion")
def exportar_reporte_organizacion(
    linea_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
):
    """
    Exporta reporte de organización a formato Excel.
    """
    data = ReportsService.generar_reporte_organizacion(db, linea_id)
    excel_bytes = ReportsService.exportar_excel(data)

    return {
        "success": True,
        "tipo": "organizacion",
        "data": data,
        "excel_available": True,
    }

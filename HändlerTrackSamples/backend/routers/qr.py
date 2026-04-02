"""
Router de Códigos QR
Endpoints para generación de códigos QR y etiquetas
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database.database import get_db
from services.qr_service import QRService
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/api/qr", tags=["qr"])


class QRRequest(BaseModel):
    muestra_id: int
    nombre: str
    lote: str


class EtiquetaMuestraRequest(BaseModel):
    muestra_id: int
    nombre: str
    lote: str
    cantidad: float
    proveedor: str
    fecha_vencimiento: Optional[str] = None


class EtiquetaDespachoRequest(BaseModel):
    muestra_id: int
    nombre: str
    lote: str
    cantidad: float
    destino: str
    orden: Optional[str] = None


@router.post("/generar")
def generar_qr(request: QRRequest):
    """
    Genera un código QR para una muestra.
    """
    return QRService.generar_qr_para_muestra(
        request.muestra_id, request.nombre, request.lote
    )


@router.get("/muestra/{muestra_id}")
def get_qr_muestra(muestra_id: int, nombre: str, lote: str):
    """
    Obtiene el código QR de una muestra específica.
    """
    return QRService.generar_qr_para_muestra(muestra_id, nombre, lote)


@router.post("/etiqueta")
def generar_etiqueta(request: EtiquetaMuestraRequest):
    """
    Genera datos para etiqueta de muestra.
    """
    return QRService.generar_etiqueta_muestra(
        request.muestra_id,
        request.nombre,
        request.lote,
        request.cantidad,
        request.proveedor,
        request.fecha_vencimiento,
    )


@router.post("/etiqueta-despacho")
def generar_etiqueta_despacho(request: EtiquetaDespachoRequest):
    """
    Genera datos para etiqueta de despacho.
    """
    return QRService.generar_etiqueta_despacho(
        request.muestra_id,
        request.nombre,
        request.lote,
        request.cantidad,
        request.destino,
        request.orden,
    )


@router.post("/verificar")
def verificar_qr(qr_data: str):
    """
    Verifica y decodifica un código QR.
    """
    return QRService.verificar_qr(qr_data)


@router.post("/generar-etiqueta")
def generar_etiqueta_full(request: EtiquetaMuestraRequest):
    """
    Genera etiqueta completa para muestra (usado por frontend).
    """
    return QRService.generar_etiqueta_muestra(
        request.muestra_id,
        request.nombre,
        request.lote,
        request.cantidad,
        request.proveedor,
        request.fecha_vencimiento,
    )


@router.post("/escanear")
def escanear_qr(qr_data: str):
    """
    Escanea un código QR y retorna información de la muestra.
    """
    resultado = QRService.verificar_qr(qr_data)

    if not resultado.get("valid"):
        return {"success": False, "error": "QR no válido", "data": resultado}

    # Si es una muestra, buscar en BD
    if resultado.get("tipo") == "muestra":
        from models.sample import Sample

        db = next(get_db())
        muestra = (
            db.query(Sample).filter(Sample.id == resultado.get("muestra_id")).first()
        )

        if muestra:
            return {
                "success": True,
                "tipo": "muestra",
                "muestra": {
                    "id": muestra.id,
                    "nombre": muestra.nombre,
                    "lote": muestra.lote,
                    "cantidad": float(muestra.cantidad_gramos)
                    if muestra.cantidad_gramos
                    else 0,
                    "estado": muestra.estado,
                    "linea_negocio": muestra.linea_negocio,
                    "anaquel": muestra.anaquel.nombre if muestra.anaquel else None,
                    "nivel": muestra.nivel,
                    "fila": muestra.fila,
                    "posicion": muestra.posicion,
                },
            }
        else:
            return {
                "success": False,
                "error": "Muestra no encontrada en la base de datos",
                "muestra_id": resultado.get("muestra_id"),
            }

    return {"success": True, "tipo": resultado.get("tipo"), "data": resultado}

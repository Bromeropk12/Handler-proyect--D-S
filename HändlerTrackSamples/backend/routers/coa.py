"""
Router para Gestión de Certificados de Análisis (CoA)
Proporciona endpoints para subir, gestionar y recuperar certificados PDF
"""

from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, Query
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from database.database import get_db
from services.coa_service import COAService
from models.user import User
from models.sample import Sample
from security import get_current_user
import os
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/coa", tags=["Certificados de Análisis"])


@router.post("/upload/{muestra_id}", summary="Subir certificado CoA para una muestra")
async def upload_coa(
    muestra_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Sube un certificado de análisis (CoA) para una muestra específica.

    **Parámetros:**
    - muestra_id: ID de la muestra
    - file: Archivo PDF del certificado

    **Retorna:**
    - ruta: Ruta donde se guardó el archivo
    - filename: Nombre del archivo generado
    """
    try:
        # Validar que la muestra existe
        muestra = db.query(Sample).filter(Sample.id == muestra_id).first()
        if not muestra:
            raise HTTPException(status_code=404, detail="Muestra no encontrada")

        # Validar tipo de archivo
        if not file.filename.lower().endswith(".pdf"):
            raise HTTPException(status_code=400, detail="El archivo debe ser un PDF")

        # Leer contenido del archivo
        file_content = await file.read()

        # Generar nombre automático y guardar
        ruta_coa = COAService.guardar_coa(
            muestra_id=muestra_id,
            proveedor=muestra.proveedor.nombre if muestra.proveedor else "SinProveedor",
            producto=muestra.nombre,
            lote=muestra.lote or "SinLote",
            contenido_pdf=file_content,
        )

        # Actualizar la muestra con la ruta del CoA
        muestra.coa_path = ruta_coa
        db.commit()

        logger.info(
            f"Usuario {current_user.username} subió CoA para muestra {muestra_id}: {ruta_coa}"
        )

        return {
            "message": "Certificado CoA subido exitosamente",
            "muestra_id": muestra_id,
            "ruta_coa": ruta_coa,
            "filename": os.path.basename(ruta_coa),
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error subiendo CoA para muestra {muestra_id}: {e}")
        raise HTTPException(
            status_code=500, detail=f"Error interno del servidor: {str(e)}"
        )


@router.get("/download/{muestra_id}", summary="Descargar certificado CoA")
async def download_coa(
    muestra_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Descarga el certificado de análisis (CoA) de una muestra.

    **Parámetros:**
    - muestra_id: ID de la muestra

    **Retorna:**
    - Archivo PDF del certificado
    """
    try:
        # Validar que la muestra existe
        muestra = db.query(Sample).filter(Sample.id == muestra_id).first()
        if not muestra:
            raise HTTPException(status_code=404, detail="Muestra no encontrada")

        if not muestra.coa_path or not os.path.exists(muestra.coa_path):
            raise HTTPException(
                status_code=404,
                detail="Certificado CoA no encontrado para esta muestra",
            )

        logger.info(
            f"Usuario {current_user.username} descargó CoA de muestra {muestra_id}"
        )

        return FileResponse(
            path=muestra.coa_path,
            media_type="application/pdf",
            filename=f"COA_{muestra.nombre}_{muestra.lote or 'SinLote'}.pdf",
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error descargando CoA para muestra {muestra_id}: {e}")
        raise HTTPException(
            status_code=500, detail=f"Error interno del servidor: {str(e)}"
        )


@router.delete("/{muestra_id}", summary="Eliminar certificado CoA")
async def delete_coa(
    muestra_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Elimina el certificado de análisis (CoA) de una muestra.

    **Parámetros:**
    - muestra_id: ID de la muestra

    **Nota:** Requiere permisos de administrador
    """
    try:
        # Verificar permisos de administrador
        if current_user.role != "admin":
            raise HTTPException(
                status_code=403,
                detail="Solo administradores pueden eliminar certificados CoA",
            )

        # Validar que la muestra existe
        muestra = db.query(Sample).filter(Sample.id == muestra_id).first()
        if not muestra:
            raise HTTPException(status_code=404, detail="Muestra no encontrada")

        if not muestra.coa_path:
            raise HTTPException(
                status_code=404, detail="Esta muestra no tiene certificado CoA asociado"
            )

        # Eliminar archivo físico
        eliminado = COAService.eliminar_coa(muestra.coa_path)

        if eliminado:
            # Actualizar la muestra
            muestra.coa_path = None
            db.commit()

            logger.info(
                f"Usuario {current_user.username} eliminó CoA de muestra {muestra_id}"
            )
            return {"message": "Certificado CoA eliminado exitosamente"}
        else:
            raise HTTPException(
                status_code=500,
                detail="Error eliminando el archivo físico del certificado",
            )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error eliminando CoA para muestra {muestra_id}: {e}")
        raise HTTPException(
            status_code=500, detail=f"Error interno del servidor: {str(e)}"
        )


@router.get("/status/{muestra_id}", summary="Verificar estado del CoA")
async def check_coa_status(
    muestra_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Verifica si una muestra tiene certificado CoA asociado y si existe físicamente.

    **Parámetros:**
    - muestra_id: ID de la muestra

    **Retorna:**
    - has_coa: True si tiene CoA asignado
    - file_exists: True si el archivo existe físicamente
    - coa_path: Ruta del archivo (si existe)
    """
    try:
        muestra = db.query(Sample).filter(Sample.id == muestra_id).first()
        if not muestra:
            raise HTTPException(status_code=404, detail="Muestra no encontrada")

        has_coa = muestra.coa_path is not None
        file_exists = has_coa and os.path.exists(muestra.coa_path) if has_coa else False

        return {
            "muestra_id": muestra_id,
            "has_coa": has_coa,
            "file_exists": file_exists,
            "coa_path": muestra.coa_path if has_coa else None,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error verificando CoA para muestra {muestra_id}: {e}")
        raise HTTPException(
            status_code=500, detail=f"Error interno del servidor: {str(e)}"
        )


@router.post("/generar-ruta", summary="Generar ruta automática para CoA")
async def generar_ruta_coa(
    proveedor: str = Query(..., description="Nombre del proveedor"),
    producto: str = Query(..., description="Nombre del producto"),
    lote: str = Query(..., description="Número de lote"),
    extension: str = Query("pdf", description="Extensión del archivo"),
):
    """
    Genera la ruta automática sugerida para guardar un certificado CoA.

    **Parámetros:**
    - proveedor: Nombre del proveedor
    - producto: Nombre del producto
    - lote: Número de lote
    - extension: Extensión del archivo (default: pdf)

    **Retorna:**
    - ruta_sugerida: Ruta completa sugerida para el archivo
    """
    try:
        ruta = COAService.generar_ruta_automatica(
            proveedor=proveedor, producto=producto, lote=lote, extension=extension
        )

        return {
            "ruta_sugerida": ruta,
            "directorio": os.path.dirname(ruta),
            "filename": os.path.basename(ruta),
        }

    except Exception as e:
        logger.error(f"Error generando ruta CoA: {e}")
        raise HTTPException(
            status_code=500, detail=f"Error interno del servidor: {str(e)}"
        )

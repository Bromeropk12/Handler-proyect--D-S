"""
Router para Importación Excel
Proporciona endpoints para importar muestras desde archivos Excel
"""

from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from sqlalchemy.orm import Session
from database.database import get_db
from services.import_excel import ImportExcelService
from models.user import User
from security import get_current_user
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/import", tags=["Importación Excel"])


@router.post("/excel/muestras", summary="Importar muestras desde Excel")
async def importar_muestras_excel(
    file: UploadFile = File(...),
    linea_negocio: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Importa muestras desde un archivo Excel.

    **Formato esperado del Excel:**
    - nombre (requerido)
    - cas_number (opcional)
    - lote (opcional)
    - cantidad_gramos (requerido)
    - proveedor (opcional)
    - linea_negocio (opcional, puede especificarse en la URL)
    - clase_peligro (opcional)
    - fecha_manufactura (opcional)
    - fecha_vencimiento (opcional)
    - dimension (opcional, default "1x1")

    **Parámetros:**
    - file: Archivo Excel (.xlsx o .xls)
    - linea_negocio: Línea de negocio por defecto (opcional)
    """
    try:
        # Validar tipo de archivo
        if not file.filename.lower().endswith((".xlsx", ".xls")):
            raise HTTPException(
                status_code=400,
                detail="El archivo debe ser de tipo Excel (.xlsx o .xls)",
            )

        # Leer contenido del archivo
        file_content = await file.read()

        # Parsear Excel
        result = ImportExcelService.parse_excel_muestras(file_content)

        if not result["success"]:
            raise HTTPException(status_code=400, detail=result["error"])

        # Importar muestras
        import_result = ImportExcelService.importar_muestras(
            db=db,
            muestras_data=result["muestras"],
            linea_negocio_default=linea_negocio,
            usuario_id=current_user.id,
        )

        logger.info(
            f"Usuario {current_user.username} importó {len(import_result['exitosas'])} muestras desde Excel"
        )

        return {
            "message": f"Importación completada. {len(import_result['exitosas'])} muestras importadas, {len(import_result['errores'])} errores",
            "exitosas": import_result["exitosas"],
            "errores": import_result["errores"],
            "total_procesadas": len(result["muestras"]),
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error en importación Excel: {e}")
        raise HTTPException(
            status_code=500, detail=f"Error interno del servidor: {str(e)}"
        )


@router.post("/excel/validar", summary="Validar archivo Excel sin importar")
async def validar_excel_muestras(
    file: UploadFile = File(...),
    linea_negocio: str = None,
):
    """
    Valida un archivo Excel sin importar las muestras.
    Útil para verificar el formato antes de la importación real.

    **Retorna:**
    - success: True si el archivo es válido
    - muestras: Lista de muestras que se importarían
    - errores: Lista de errores de validación
    """
    try:
        # Validar tipo de archivo
        if not file.filename.lower().endswith((".xlsx", ".xls")):
            raise HTTPException(
                status_code=400,
                detail="El archivo debe ser de tipo Excel (.xlsx o .xls)",
            )

        # Leer contenido del archivo
        file_content = await file.read()

        # Parsear Excel
        result = ImportExcelService.parse_excel_muestras(file_content)

        # Validar cada muestra sin importar
        if result["success"]:
            validacion = ImportExcelService.validar_muestras(
                result["muestras"], linea_negocio_default=linea_negocio
            )
            result.update(validacion)

        return result

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error en validación Excel: {e}")
        raise HTTPException(
            status_code=500, detail=f"Error interno del servidor: {str(e)}"
        )

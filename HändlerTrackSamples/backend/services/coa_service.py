"""
Servicio de Gestión de Certificados de Análisis (CoA)
Gestiona la carga, almacenamiento y recuperación de certificados PDF
"""

import os
import shutil
from typing import Optional, Dict, Any, List
from datetime import datetime
from pathlib import Path


class COAService:
    """
    Servicio para gestionar Certificados de Análisis (CoA).

    Funcionalidades:
    - Guardar CoA asociado a una muestra
    - Obtener ruta/visualizar CoA
    - Generar ruta automática basada en proveedor/producto/lote
    - Eliminar CoA
    """

    # Directorio base para almacenar certificados
    COA_BASE_PATH = os.path.join(os.getcwd(), "certificados")

    @classmethod
    def _ensure_coa_dir(cls) -> str:
        """Asegura que el directorio de certificados exista."""
        if not os.path.exists(cls.COA_BASE_PATH):
            os.makedirs(cls.COA_BASE_PATH, exist_ok=True)
        return cls.COA_BASE_PATH

    @staticmethod
    def generar_ruta_automatica(
        proveedor: str, producto: str, lote: str, extension: str = "pdf"
    ) -> str:
        """
        Genera la ruta automática para un certificado CoA.

        Args:
            proveedor: Nombre del proveedor
            producto: Nombre del producto
            lote: Número de lote
            extension: Extensión del archivo (pdf por defecto)

        Returns:
            Ruta sugerida para guardar el certificado
        """
        # Limpiar nombres para evitar caracteres problemáticos
        proveedor_clean = proveedor.replace("/", "-").replace("\\", "-")
        producto_clean = producto.replace("/", "-").replace("\\", "-")
        lote_clean = lote.replace("/", "-").replace("\\", "-")

        # Construir ruta: certificados/proveedor/producto/lote.pdf
        ruta = os.path.join(
            COAService.COA_BASE_PATH,
            proveedor_clean,
            producto_clean,
            f"{lote_clean}.{extension}",
        )

        return ruta

    @classmethod
    def guardar_coa(
        cls, sample_id: int, file_path: str, custom_path: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Guarda un certificado CoA para una muestra.

        Args:
            sample_id: ID de la muestra
            file_path: Ruta del archivo source
            custom_path: Ruta personalizada (opcional)

        Returns:
            Diccionario con resultado de la operación
        """
        if not os.path.exists(file_path):
            return {"success": False, "error": f"Archivo no encontrado: {file_path}"}

        # Determinar ruta destino
        if custom_path:
            destino = custom_path
        else:
            # Usar ruta automática
            from models.sample import Sample

            # Esta función se llamará desde el router con la muestra ya carregada
            destino = None

        # Crear directorio si no existe
        destino_dir = os.path.dirname(destino) if destino else cls.COA_BASE_PATH
        if destino and not os.path.exists(destino_dir):
            os.makedirs(destino_dir, exist_ok=True)

        # Si no hay destino específico, guardar en directorio temporal
        if not destino:
            cls._ensure_coa_dir()
            destino = os.path.join(
                cls.COA_BASE_PATH,
                f"sample_{sample_id}_{datetime.now().strftime('%Y%m%d%H%M%S')}.pdf",
            )

        try:
            shutil.copy2(file_path, destino)
            return {
                "success": True,
                "message": "Certificado guardado exitosamente",
                "coa_path": destino,
                "sample_id": sample_id,
            }
        except Exception as e:
            return {
                "success": False,
                "error": f"Error al guardar certificado: {str(e)}",
            }

    @classmethod
    def obtener_coa(
        cls, sample_id: int, coa_path: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Obtiene la información del certificado CoA de una muestra.

        Args:
            sample_id: ID de la muestra
            coa_path: Ruta del certificado guardada en la muestra

        Returns:
            Diccionario con información del CoA
        """
        if not coa_path:
            return {
                "success": False,
                "error": "No hay certificado asociado a esta muestra",
                "exists": False,
            }

        if not os.path.exists(coa_path):
            return {
                "success": False,
                "error": f"Archivo no encontrado: {coa_path}",
                "exists": False,
            }

        # Obtener información del archivo
        file_stats = os.stat(coa_path)

        return {
            "success": True,
            "exists": True,
            "coa_path": coa_path,
            "file_name": os.path.basename(coa_path),
            "file_size": file_stats.st_size,
            "modified_date": datetime.fromtimestamp(file_stats.st_mtime).isoformat(),
            "sample_id": sample_id,
        }

    @classmethod
    def eliminar_coa(cls, sample_id: int, coa_path: str) -> Dict[str, Any]:
        """
        Elimina el certificado CoA de una muestra.

        Args:
            sample_id: ID de la muestra
            coa_path: Ruta del certificado

        Returns:
            Diccionario con resultado de la operación
        """
        if not coa_path or not os.path.exists(coa_path):
            return {"success": False, "error": "Certificado no encontrado"}

        try:
            os.remove(coa_path)
            return {
                "success": True,
                "message": f"Certificado eliminado: {coa_path}",
                "sample_id": sample_id,
            }
        except Exception as e:
            return {
                "success": False,
                "error": f"Error al eliminar certificado: {str(e)}",
            }

    @classmethod
    def listar_coa_disponibles(
        cls, proveedor: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Lista los certificados CoA disponibles en el sistema.

        Args:
            proveedor: Filtrar por proveedor (opcional)

        Returns:
            Lista de certificados disponibles
        """
        cls._ensure_coa_dir()

        certificados = []

        try:
            for root, dirs, files in os.walk(cls.COA_BASE_PATH):
                for file in files:
                    if file.lower().endswith((".pdf", ".jpg", ".jpeg", ".png")):
                        full_path = os.path.join(root, file)
                        file_stats = os.stat(full_path)

                        rel_path = os.path.relpath(full_path, cls.COA_BASE_PATH)
                        partes = rel_path.split(os.sep)

                        certificado = {
                            "file_name": file,
                            "file_path": full_path,
                            "proveedor": partes[0] if len(partes) > 0 else "unknown",
                            "producto": partes[1] if len(partes) > 1 else "unknown",
                            "lote": os.path.splitext(partes[-1])[0]
                            if partes
                            else "unknown",
                            "file_size": file_stats.st_size,
                            "modified_date": datetime.fromtimestamp(
                                file_stats.st_mtime
                            ).isoformat(),
                        }

                        if (
                            proveedor
                            and certificado["proveedor"].lower() != proveedor.lower()
                        ):
                            continue

                        certificados.append(certificado)
        except Exception as e:
            return []

        return certificados

    @classmethod
    def buscar_coa(
        cls,
        proveedor: Optional[str] = None,
        producto: Optional[str] = None,
        lote: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """
        Busca certificados CoA por criterios específicos.

        Args:
            proveedor: Filtrar por proveedor
            producto: Filtrar por producto
            lote: Filtrar por lote

        Returns:
            Lista de certificados que cumplen los criterios
        """
        todos = cls.listar_coa_disponibles()

        resultados = []
        for cert in todos:
            if proveedor and proveedor.lower() not in cert["proveedor"].lower():
                continue
            if producto and producto.lower() not in cert["producto"].lower():
                continue
            if lote and lote.lower() not in cert["lote"].lower():
                continue
            resultados.append(cert)

        return resultados

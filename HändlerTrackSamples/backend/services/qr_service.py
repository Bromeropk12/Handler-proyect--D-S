"""
Servicio de Generación de Códigos QR y Etiquetas
Genera códigos QR únicos para muestras y etiquetas para impresión
"""

import io
import base64
import uuid
from typing import Optional, Dict, Any
from datetime import datetime


class QRService:
    """
    Servicio para generar códigos QR y etiquetas para muestras.

    Funcionalidades:
    - Generar código QR único para cada muestra
    - Generar etiqueta para impresoras térmicas
    - Generar etiqueta de despacho
    """

    @staticmethod
    def generar_qr_base64(data: str, size: int = 200) -> str:
        """
        Genera un código QR y lo convierte a base64.

        Args:
            data: Datos a codificar en el QR
            size: Tamaño del código QR en píxeles

        Returns:
            String base64 de la imagen PNG del QR
        """
        try:
            import qrcode

            qr = qrcode.QRCode(
                version=1,
                error_correction=qrcode.constants.ERROR_CORRECT_L,
                box_size=10,
                border=4,
            )
            qr.add_data(data)
            qr.make(fit=True)

            img = qr.make_image(fill_color="black", back_color="white")

            # Convertir a bytes
            buffer = io.BytesIO()
            img.save(buffer, format="PNG")
            buffer.seek(0)

            # Convertir a base64
            img_base64 = base64.b64encode(buffer.getvalue()).decode()
            return f"data:image/png;base64,{img_base64}"

        except ImportError:
            # Si no hay qrcode instalado, retornar placeholder
            return ""

    @staticmethod
    def generar_qr_para_muestra(
        muestra_id: int, nombre: str, lote: str
    ) -> Dict[str, Any]:
        """
        Genera un código QR para una muestra específica.

        Args:
            muestra_id: ID de la muestra
            nombre: Nombre de la muestra
            lote: Número de lote

        Returns:
            Diccionario con el QR en base64 y metadatos
        """
        # Crear datos únicos para el QR
        qr_data = f"HTS-{muestra_id}-{lote}-{uuid.uuid4().hex[:8]}"

        qr_base64 = QRService.generar_qr_base64(qr_data, size=200)

        return {
            "success": True,
            "qr_data": qr_data,
            "qr_image": qr_base64,
            "muestra_id": muestra_id,
            "nombre": nombre,
            "lote": lote,
            "generated_at": datetime.now().isoformat(),
        }

    @staticmethod
    def generar_etiqueta_muestra(
        muestra_id: int,
        nombre: str,
        lote: str,
        cantidad: float,
        proveedor: str,
        fecha_vencimiento: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Genera los datos para una etiqueta de muestra.

        Args:
            muestra_id: ID de la muestra
            nombre: Nombre de la muestra
            lote: Número de lote
            cantidad: Cantidad en gramos
            proveedor: Nombre del proveedor
            fecha_vencimiento: Fecha de vencimiento (opcional)

        Returns:
            Diccionario con datos de la etiqueta
        """
        qr_result = QRService.generar_qr_para_muestra(muestra_id, nombre, lote)

        return {
            "success": True,
            "etiqueta": {
                "muestra_id": muestra_id,
                "nombre": nombre,
                "lote": lote,
                "cantidad": f"{cantidad}g",
                "proveedor": proveedor,
                "fecha_vencimiento": fecha_vencimiento or "N/A",
                "qr_data": qr_result["qr_data"],
                "qr_image": qr_result["qr_image"],
                "fecha_impresion": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            },
        }

    @staticmethod
    def generar_etiqueta_despacho(
        muestra_id: int,
        nombre: str,
        lote: str,
        cantidad: float,
        destino: str,
        orden: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Genera los datos para una etiqueta de despacho.

        Args:
            muestra_id: ID de la muestra
            nombre: Nombre de la muestra
            lote: Número de lote
            cantidad: Cantidad en gramos
            destino: Destino del despacho
            orden: Número de orden (opcional)

        Returns:
            Diccionario con datos de la etiqueta de despacho
        """
        qr_data = f"DESPACHO-{muestra_id}-{lote}"
        qr_base64 = QRService.generar_qr_base64(qr_data, size=150)

        return {
            "success": True,
            "etiqueta_despacho": {
                "muestra_id": muestra_id,
                "nombre": nombre,
                "lote": lote,
                "cantidad": f"{cantidad}g",
                "destino": destino,
                "orden": orden or "N/A",
                "qr_data": qr_data,
                "qr_image": qr_base64,
                "fecha_despacho": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                "tipo": "DESPACHO",
            },
        }

    @staticmethod
    def verificar_qr(qr_data: str) -> Dict[str, Any]:
        """
        Verifica y decodifica un código QR.

        Args:
            qr_data: Datos del QR escaneado

        Returns:
            Diccionario con información decodificada
        """
        # El QR tiene formato: HTS-{muestra_id}-{lote}-{hash}
        if qr_data.startswith("HTS-"):
            partes = qr_data.split("-")
            if len(partes) >= 3:
                try:
                    muestra_id = int(partes[1])
                    lote = partes[2]
                    return {
                        "valid": True,
                        "tipo": "muestra",
                        "muestra_id": muestra_id,
                        "lote": lote,
                        "raw_data": qr_data,
                    }
                except ValueError:
                    pass

        if qr_data.startswith("DESPACHO-"):
            return {"valid": True, "tipo": "despacho", "raw_data": qr_data}

        return {"valid": False, "tipo": "desconocido", "raw_data": qr_data}

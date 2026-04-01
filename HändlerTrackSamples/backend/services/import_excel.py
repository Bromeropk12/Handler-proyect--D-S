"""
Servicio de Importación desde Excel
Permite cargar muestras de manera masiva desde archivos Excel
"""

import io
from typing import List, Dict, Any, Optional
from datetime import datetime
from decimal import Decimal


class ImportExcelService:
    """
    Servicio para importar muestras desde archivos Excel.

    Formato esperado del Excel:
    | nombre | cas_number | lote | cantidad_gramos | proveedor | linea_negocio | clase_peligro | fecha_manufactura | fecha_vencimiento | dimension |
    """

    CAMPOS_REQUERIDOS = ["nombre", "cantidad_gramos", "linea_negocio"]
    CAMPOS_OPCIONALES = [
        "cas_number",
        "lote",
        "proveedor",
        "clase_peligro",
        "fecha_manufactura",
        "fecha_vencimiento",
        "dimension",
    ]

    @staticmethod
    def parse_excel_muestras(file_content: bytes) -> Dict[str, Any]:
        """
        Parsea un archivo Excel y extrae las muestras.

        Args:
            file_content: Contenido del archivo Excel en bytes

        Returns:
            Diccionario con resultado del parseo
        """
        try:
            import openpyxl
        except ImportError:
            return {
                "success": False,
                "error": "Biblioteca openpyxl no instalada. Ejecutar: pip install openpyxl",
            }

        try:
            workbook = openpyxl.load_workbook(io.BytesIO(file_content))
            sheet = workbook.active

            # Leer encabezados
            headers = []
            for cell in sheet[1]:
                headers.append(cell.value)

            # Verificar campos requeridos
            campos_faltantes = []
            for campo in ImportExcelService.CAMPOS_REQUERIDOS:
                if campo not in headers:
                    campos_faltantes.append(campo)

            if campos_faltantes:
                return {
                    "success": False,
                    "error": f"Campos requeridos faltantes: {', '.join(campos_faltantes)}",
                    "headers_encontrados": headers,
                }

            # Leer filas de datos
            muestras = []
            errores = []

            for row_idx, row in enumerate(
                sheet.iter_rows(min_row=2, values_only=True), start=2
            ):
                if not row or not row[0]:  # Skip empty rows
                    continue

                # Crear diccionario de la muestra
                muestra = {}
                for col_idx, header in enumerate(headers):
                    if header:
                        value = row[col_idx] if col_idx < len(row) else None
                        muestra[header] = value

                # Validar campos requeridos
                if not muestra.get("nombre"):
                    errores.append(f"Fila {row_idx}: Falta nombre")
                    continue

                if not muestra.get("cantidad_gramos"):
                    errores.append(f"Fila {row_idx}: Falta cantidad_gramos")
                    continue

                if not muestra.get("linea_negocio"):
                    errores.append(f"Fila {row_idx}: Falta linea_negocio")
                    continue

                # Convertir cantidad a número
                try:
                    cantidad = float(muestra.get("cantidad_gramos", 0))
                    muestra["cantidad_gramos"] = cantidad
                except (ValueError, TypeError):
                    errores.append(f"Fila {row_idx}: cantidad_gramos inválido")
                    continue

                muestras.append(muestra)

            return {
                "success": True,
                "total_filas": len(muestras),
                "muestras": muestras,
                "errores": errores,
                "headers": headers,
            }

        except Exception as e:
            return {"success": False, "error": f"Error al parsear Excel: {str(e)}"}

    @staticmethod
    def validar_datos_importacion(
        muestras: List[Dict[str, Any]], db: Optional[Any] = None
    ) -> Dict[str, Any]:
        """
        Valida los datos de las muestras antes de la importación.

        Args:
            muestras: Lista de muestras a validar
            db: Sesión de base de datos (opcional)

        Returns:
            Diccionario con resultado de la validación
        """
        errores = []
        advertencias = []

        # Valores válidos para linea_negocio
        lineas_validas = [
            "cosméticos",
            "industrial",
            "farmacéutico",
            "cosmetica",
            "industria",
            "farmaceutica",
        ]

        # Valores válidos para dimension
        dimensiones_validas = ["1x1", "2x1", "2x2", "1x2", "2x3"]

        for idx, muestra in enumerate(muestras):
            # Validar nombre
            if not muestra.get("nombre") or len(muestra["nombre"]) < 2:
                errores.append(f"Fila {idx + 1}: Nombre inválido o muy corto")

            # Validar cantidad
            cantidad = muestra.get("cantidad_gramos", 0)
            if cantidad <= 0:
                errores.append(f"Fila {idx + 1}: Cantidad debe ser mayor a 0")
            elif cantidad > 1000000:
                advertencias.append(f"Fila {idx + 1}: Cantidad muy alta ({cantidad}g)")

            # Validar línea de negocio
            linea = muestra.get("linea_negocio", "").lower()
            if linea not in lineas_validas:
                errores.append(f"Fila {idx + 1}: Línea de negocio inválida '{linea}'")

            # Validar dimensión (si se proporcionó)
            dimension = muestra.get("dimension", "1x1")
            if dimension and dimension not in dimensiones_validas:
                advertencias.append(
                    f"Fila {idx + 1}: Dimensión '{dimension}' no estándar, se usará 1x1"
                )
                muestra["dimension"] = "1x1"

            # Validar proveedor (si se proporcionó y hay DB)
            proveedor_nombre = muestra.get("proveedor")
            if db and proveedor_nombre:
                from models.proveedor import Proveedor

                proveedor = (
                    db.query(Proveedor)
                    .filter(Proveedor.nombre.ilike(proveedor_nombre))
                    .first()
                )
                if not proveedor:
                    advertencias.append(
                        f"Fila {idx + 1}: Proveedor '{proveedor_nombre}' no encontrado, se creará nuevo"
                    )
                else:
                    muestra["proveedor_id"] = proveedor.id

            # Validar clase de peligro (si se proporcionó y hay DB)
            clase_peligro = muestra.get("clase_peligro")
            if db and clase_peligro:
                from models.clase_peligro import ClasePeligro

                clase = (
                    db.query(ClasePeligro)
                    .filter(ClasePeligro.codigo.ilike(clase_peligro))
                    .first()
                )
                if clase:
                    muestra["clase_peligro_id"] = clase.id
                else:
                    advertencias.append(
                        f"Fila {idx + 1}: Clase de peligro '{clase_peligro}' no encontrada"
                    )

        es_valido = len(errores) == 0

        return {
            "success": es_valido,
            "valido": es_valido,
            "total_muestras": len(muestras),
            "errores": errores,
            "advertencias": advertencias,
            "muestras_validadas": muestras if es_valido else [],
        }

    @staticmethod
    def batch_insert_muestras(
        db: Any, muestras: List[Dict[str, Any]], usuario_id: int
    ) -> Dict[str, Any]:
        """
        Inserta un lote de muestras en la base de datos.

        Args:
            db: Sesión de base de datos
            muestras: Lista de muestras a insertar
            usuario_id: ID del usuario que realiza la importación

        Returns:
            Diccionario con resultado de la inserción
        """
        from models.sample import Sample

        insertadas = []
        errores = []

        for idx, muestra_data in enumerate(muestras):
            try:
                muestra = Sample(
                    nombre=muestra_data.get("nombre"),
                    cas_number=muestra_data.get("cas_number"),
                    lote=muestra_data.get("lote"),
                    cantidad_gramos=muestra_data.get("cantidad_gramos", 0),
                    linea_negocio=muestra_data.get(
                        "linea_negocio", "cosméticos"
                    ).lower(),
                    dimension=muestra_data.get("dimension", "1x1"),
                    proveedor_id=muestra_data.get("proveedor_id"),
                    clase_peligro_id=muestra_data.get("clase_peligro_id"),
                    estado="activa",
                    created_by=usuario_id,
                    observaciones=f"Importado desde Excel el {datetime.now().strftime('%Y-%m-%d %H:%M')}",
                )

                db.add(muestra)
                db.flush()

                insertadas.append(
                    {"row": idx + 1, "id": muestra.id, "nombre": muestra.nombre}
                )

            except Exception as e:
                errores.append(
                    {
                        "row": idx + 1,
                        "nombre": muestra_data.get("nombre", "desconocido"),
                        "error": str(e),
                    }
                )

        # Confirmar cambios
        try:
            db.commit()
        except Exception as e:
            db.rollback()
            return {
                "success": False,
                "error": f"Error al guardar en base de datos: {str(e)}",
                "insertadas": insertadas,
                "errores": errores,
            }

        return {
            "success": True,
            "total_insertadas": len(insertadas),
            "total_errores": len(errores),
            "insertadas": insertadas,
            "errores": errores,
        }

"""
Servicio de Reubicación Mínima
Algoritmo para reorganizar muestras con mínima perturbación del inventario
"""

from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional, Tuple
from models.sample import Sample
from models.hilera import Hilera
from models.anaquel import Anaquel


class ReubicacionService:
    """
    Servicio para gestionar la reubicación de muestras.

    Algoritmo de Reubicación Mínima:
    - Cuando no hay ubicación disponible, busca muestras "Inertes" como buffer
    - Propone intercambios (Swap) que minimicen movimientos
    - Considera la compatibilidad química al proponer reubicaciones
    """

    @staticmethod
    def calcular_movimientos_necesarios(
        db: Session, muestra_conflicto_id: int, dimension: str = "1x1"
    ) -> Dict[str, Any]:
        """
        Calcula los movimientos necesarios para encontrar una ubicación.

        Args:
            db: Sesión de base de datos
            muestra_conflicto_id: ID de la muestra que necesita ubicación
            dimension: Dimensiones de la muestra (1x1, 2x1, 2x2)

        Returns:
            Diccionario con movimientos necesarios
        """
        # Esta implementación es básica - se expandirá en Sprint 4
        return {
            "success": True,
            "mensaje": "Análisis de reubicación en desarrollo",
            "sprint": 4,
            "nota": "Se requiere implementación completa del algoritmo de reubicación mínima",
        }

    @staticmethod
    def sugerir_intercambio(
        db: Session, muestra_a_id: int, muestra_b_id: int
    ) -> Dict[str, Any]:
        """
        Sugiere un intercambio entre dos muestras.

        Args:
            db: Sesión de base de datos
            muestra_a_id: ID de la primera muestra
            muestra_b_id: ID de la segunda muestra

        Returns:
            Diccionario con sugerencia de intercambio
        """
        muestra_a = db.query(Sample).filter(Sample.id == muestra_a_id).first()
        muestra_b = db.query(Sample).filter(Sample.id == muestra_b_id).first()

        if not muestra_a or not muestra_b:
            return {
                "success": False,
                "error": "Una o ambas muestras no fueron encontradas",
            }

        # Obtener las hileras actuales
        hilera_a = db.query(Hilera).filter(Hilera.muestra_id == muestra_a_id).first()
        hilera_b = db.query(Hilera).filter(Hilera.muestra_id == muestra_b_id).first()

        if not hilera_a or not hilera_b:
            return {
                "success": False,
                "error": "Una o ambas muestras no están asignadas a una hilera",
            }

        # Verificar si el intercambio es viable
        # Las dimensiones deben ser compatibles con las hileras destino

        dim_a = (muestra_a.dimension or "1x1").split("x")
        dim_b = (muestra_b.dimension or "1x1").split("x")

        intercambiable = (
            int(dim_a[0]) <= hilera_b.ancho_max and int(dim_a[1]) <= hilera_b.fondo_max
        ) and (
            int(dim_b[0]) <= hilera_a.ancho_max and int(dim_b[1]) <= hilera_a.fondo_max
        )

        if not intercambiable:
            return {
                "success": False,
                "error": "Las dimensiones no permiten el intercambio",
                "detalle": {
                    "muestra_a": f"{dim_a[0]}x{dim_a[1]} no cabe en hilera {hilera_b.id}",
                    "muestra_b": f"{dim_b[0]}x{dim_b[1]} no cabe en hilera {hilera_a.id}",
                },
            }

        return {
            "success": True,
            "mensaje": "Intercambio viable",
            "muestra_a": {
                "id": muestra_a.id,
                "nombre": muestra_a.nombre,
                "hilera_actual": hilera_a.id,
                "hilera_propuesta": hilera_b.id,
            },
            "muestra_b": {
                "id": muestra_b.id,
                "nombre": muestra_b.nombre,
                "hilera_actual": hilera_b.id,
                "hilera_propuesta": hilera_a.id,
            },
            "nota": "Verificar compatibilidad química antes de ejecutar",
        }

    @staticmethod
    def ejecutar_intercambio(
        db: Session, muestra_a_id: int, muestra_b_id: int, usuario_id: int
    ) -> Dict[str, Any]:
        """
        Ejecuta un intercambio entre dos muestras.

        Args:
            db: Sesión de base de datos
            muestra_a_id: ID de la primera muestra
            muestra_b_id: ID de la segunda muestra
            usuario_id: ID del usuario que ejecuta el intercambio

        Returns:
            Diccionario con resultado del intercambio
        """
        # Verificar que las muestras existen y están asignadas
        muestra_a = db.query(Sample).filter(Sample.id == muestra_a_id).first()
        muestra_b = db.query(Sample).filter(Sample.id == muestra_b_id).first()

        if not muestra_a or not muestra_b:
            return {
                "success": False,
                "error": "Una o ambas muestras no fueron encontradas",
            }

        # Obtener las hileras actuales
        hilera_a = db.query(Hilera).filter(Hilera.muestra_id == muestra_a_id).first()
        hilera_b = db.query(Hilera).filter(Hilera.muestra_id == muestra_b_id).first()

        if not hilera_a or not hilera_b:
            return {
                "success": False,
                "error": "Una o ambas muestras no están asignadas a una hilera",
            }

        # Intercambiar
        hilera_a.muestra_id = muestra_b_id
        hilera_b.muestra_id = muestra_a_id

        db.commit()

        return {
            "success": True,
            "mensaje": f"Intercambio ejecutado entre {muestra_a.nombre} y {muestra_b.nombre}",
            "muestra_a": {
                "id": muestra_a.id,
                "nombre": muestra_a.nombre,
                "nueva_hilera": hilera_b.id,
            },
            "muestra_b": {
                "id": muestra_b.id,
                "nombre": muestra_b.nombre,
                "nueva_hilera": hilera_a.id,
            },
        }

    @staticmethod
    def buscar_muestras_inertes(db: Session, limite: int = 10) -> List[Sample]:
        """
        Busca muestras que pueden usarse como buffer (inertes/no peligrosas).

        Args:
            db: Sesión de base de datos
            limite: Número máximo de resultados

        Returns:
            Lista de muestras inertes disponibles
        """
        # Buscar muestras sin clase de peligro o con clase de peligro baja
        from models.clase_peligro import ClasePeligro

        # Obtener clases de peligro de bajo riesgo
        clases_bajas = (
            db.query(ClasePeligro)
            .filter(
                ClasePeligro.codigo.in_(
                    ["GHS01", "GHS09"]
                )  # Explosivo y Peligros para el medio ambiente
            )
            .all()
        )

        clases_ids = [c.id for c in clases_bajas]

        # Buscar muestras sin clase de peligro o con clases bajas
        query = db.query(Sample).filter(
            Sample.estado == "activa", Sample.cantidad_gramos > 0
        )

        # Añadir filtro de clases de peligro si existen
        if clases_ids:
            query = query.filter(
                (Sample.clase_peligro_id == None)
                | (Sample.clase_peligro_id.in_(clases_ids))
            )
        else:
            query = query.filter(Sample.clase_peligro_id == None)

        return query.limit(limite).all()

    @staticmethod
    def get_propuestas_reubicacion(
        db: Session, muestra_id: int, limite: int = 5
    ) -> Dict[str, Any]:
        """
        Obtiene propuestas de reubicación para una muestra.

        Args:
            db: Sesión de base de datos
            muestra_id: ID de la muestra a reubicar
            limite: Número máximo de propuestas

        Returns:
            Diccionario con propuestas de reubicación
        """
        muestra = db.query(Sample).filter(Sample.id == muestra_id).first()

        if not muestra:
            return {"success": False, "error": "Muestra no encontrada"}

        if not muestra.anaquel_id:
            return {
                "success": False,
                "error": "La muestra no está asignada a una ubicación",
            }

        # Esta implementación retornará propuestas básicas
        # La implementación completa incluirá análisis de compatibilidad
        hilera_actual = (
            db.query(Hilera)
            .filter(
                Hilera.anaquel_id == muestra.anaquel_id,
                Hilera.nivel == muestra.nivel,
                Hilera.fila == muestra.fila,
                Hilera.posicion == muestra.posicion,
            )
            .first()
        )

        return {
            "success": True,
            "muestra": {
                "id": muestra.id,
                "nombre": muestra.nombre,
                "hilera_actual": hilera_actual.id if hilera_actual else None,
            },
            "propuestas": [],
            "nota": "Análisis completo de reubicación en desarrollo para Sprint 4",
        }

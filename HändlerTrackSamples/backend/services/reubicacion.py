"""
Servicio de Reubicación Mínima
Algoritmo para reorganizar muestras con mínima perturbación del inventario
"""

from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional, Tuple
from models.sample import Sample
from models.hilera import Hilera
from models.anaquel import Anaquel
from services.compatibilidad import CompatibilidadService


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
        Implementa algoritmo de reubicación mínima:
        1. Busca muestras inertes como buffer
        2. Busca ubicaciones con productos reubicables
        3. Minimiza movimientos totales

        Args:
            db: Sesión de base de datos
            muestra_conflicto_id: ID de la muestra que necesita ubicación
            dimension: Dimensiones de la muestra (1x1, 2x1, 2x2)

        Returns:
            Diccionario con movimientos necesarios
        """
        muestra = db.query(Sample).filter(Sample.id == muestra_conflicto_id).first()
        if not muestra:
            return {"success": False, "error": "Muestra no encontrada"}

        partes = dimension.split("x")
        ancho = int(partes[0]) if len(partes) > 0 else 1
        fondo = int(partes[1]) if len(partes) > 1 else 1

        # Obtener clase de peligro de la muestra
        clase_muestra = None
        if muestra.clase_peligro:
            clase_muestra = muestra.clase_peligro.codigo

        # 1. Buscar hileras vacías disponibles
        hileras_vacias = (
            db.query(Hilera)
            .filter(
                Hilera.estado == "disponible",
                Hilera.muestra_id == None,
                Hilera.ancho_max >= ancho,
                Hilera.fondo_max >= fondo,
            )
            .order_by(Hilera.posiciones_usadas)
            .limit(20)
            .all()
        )

        if hileras_vacias:
            # Verificar compatibilidad con la primera hilera vacía
            hilera_candidata = hileras_vacias[0]

            if clase_muestra:
                compatibilidad = ReubicacionService._verificar_compatibilidad_en_hilera(
                    db, clase_muestra, hilera_candidata
                )
                if compatibilidad["compatible"]:
                    return {
                        "success": True,
                        "tipo": "ubicacion_vacia",
                        "movimientos": 0,
                        "hilera_sugerida": {
                            "id": hilera_candidata.id,
                            "anaquel": hilera_candidata.anaquel.nombre
                            if hilera_candidata.anaquel
                            else "N/A",
                            "nivel": hilera_candidata.nivel,
                            "fila": hilera_candidata.fila,
                            "posicion": hilera_candidata.posicion,
                        },
                        "mensaje": "Ubicación vacía disponible sin incompatibilidades",
                    }

        # 2. Buscar muestras inertes para mover
        muestras_inertes = ReubicacionService.buscar_muestras_inertes(db, limite=10)

        # 3. Buscar opciones de intercambio
        opciones_intercambio = []

        for muestra_inerte in muestras_inertes:
            if muestra_inerte.id == muestra_conflicto_id:
                continue

            if not muestra_inerte.anaquel_id:
                continue

            # Obtener hilera actual de la muestra inerte
            hilera_actual = (
                db.query(Hilera)
                .filter(
                    Hilera.anaquel_id == muestra_inerte.anaquel_id,
                    Hilera.nivel == muestra_inerte.nivel,
                    Hilera.fila == muestra_inerte.fila,
                    Hilera.posicion == muestra_inerte.posicion,
                )
                .first()
            )

            if not hilera_actual or hilera_actual.estado != "ocupado":
                continue

            # Verificar si la muestra conflictiva cabe en la posición de la inerte
            dim_inerta = (muestra_inerte.dimension or "1x1").split("x")
            ancho_i = int(dim_inerta[0])
            fondo_i = int(dim_inerta[1])

            if ancho <= hilera_actual.ancho_max and fondo <= hilera_actual.fondo_max:
                # Verificar que la muestra inerte pueda ir a una ubicación vacía
                for hilera_vacia in hileras_vacias:
                    opciones_intercambio.append(
                        {
                            "tipo": "intercambio",
                            "muestra_mover": {
                                "id": muestra_inerte.id,
                                "nombre": muestra_inerte.nombre,
                                "clase_peligro": muestra_inerte.clase_peligro.codigo
                                if muestra_inerte.clase_peligro
                                else "Sin clase",
                            },
                            "hilera_origen": hilera_actual.id,
                            "hilera_destino": hilera_vacia.id,
                            "hilera_vacia": {
                                "id": hilera_vacia.id,
                                "anaquel": hilera_vacia.anaquel.nombre
                                if hilera_vacia.anaquel
                                else "N/A",
                                "nivel": hilera_vacia.nivel,
                                "fila": hilera_vacia.fila,
                                "posicion": hilera_vacia.posicion,
                            },
                            "movimientos": 1,
                        }
                    )
                break

        if opciones_intercambio:
            return {
                "success": True,
                "opciones": opciones_intercambio[:3],
                "mensaje": f"Se encontraron {len(opciones_intercambio)} opciones de reubicación",
            }

        return {
            "success": False,
            "error": "No se encontraron opciones de reubicación",
            "sugerencia": "Considere eliminar muestras obsoletas o agregar más espacio",
        }

    @staticmethod
    def _verificar_compatibilidad_en_hilera(
        db: Session, clase_peligro: str, hilera: Hilera
    ) -> Dict[str, Any]:
        """
        Verifica si una muestra con cierta clase de peligro es compatible con la hilera.

        Args:
            db: Sesión de base de datos
            clase_peligro: Código GHS de la clase de peligro
            hilera: Hilera destino

        Returns:
            Diccionario con resultado de compatibilidad
        """
        from services.compatibilidad import CompatibilidadService

        vecinos = CompatibilidadService.get_vecinos(db, hilera.id)

        if not vecinos:
            return {"compatible": True, "mensaje": "No hay vecinos"}

        incompatibilidades = []

        for vecino in vecinos:
            if not vecino.get("clase_peligro"):
                continue

            resultado = CompatibilidadService.verificar_compatibilidad(
                clase_peligro, vecino["clase_peligro"]
            )

            if not resultado["compatible"]:
                incompatibilidades.append(
                    {
                        "vecino": vecino["nombre"],
                        "clase": vecino["clase_peligro"],
                        "nivel": resultado["nivel"],
                    }
                )

        if incompatibilidades:
            return {
                "compatible": False,
                "mensaje": f"Incompatibilidades con {len(incompatibilidades)} vecino(s)",
                "incompatibilidades": incompatibilidades,
            }

        return {"compatible": True, "mensaje": "Compatible con todos los vecinos"}

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

        dimension = muestra.dimension or "1x1"
        clase_muestra = muestra.clase_peligro.codigo if muestra.clase_peligro else None

        # Obtener la hilera actual
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

        if not hilera_actual:
            return {"success": False, "error": "Hilera actual no encontrada"}

        # Buscar hileras vacías disponibles
        partes = dimension.split("x")
        ancho = int(partes[0]) if len(partes) > 0 else 1
        fondo = int(partes[1]) if len(partes) > 1 else 1

        hileras_vacias = (
            db.query(Hilera)
            .filter(
                Hilera.estado == "disponible",
                Hilera.muestra_id == None,
                Hilera.ancho_max >= ancho,
                Hilera.fondo_max >= fondo,
                Hilera.id != hilera_actual.id,
            )
            .order_by(Hilera.posiciones_usadas)
            .limit(limite)
            .all()
        )

        propuestas = []

        for hilera in hileras_vacias:
            # Verificar compatibilidad
            es_compatible = True
            incompatibilidades = []

            if clase_muestra:
                vecinos = CompatibilidadService.get_vecinos(db, hilera.id)
                for vecino in vecinos:
                    if vecino.get("clase_peligro"):
                        resultado = CompatibilidadService.verificar_compatibilidad(
                            clase_muestra, vecino["clase_peligro"]
                        )
                        if not resultado["compatible"]:
                            es_compatible = False
                            incompatibilidades.append(
                                {
                                    "vecino": vecino["nombre"],
                                    "clase": vecino["clase_peligro"],
                                }
                            )

            propuestas.append(
                {
                    "tipo": "ubicacion_vacia",
                    "hilera_id": hilera.id,
                    "hilera_destino": {
                        "anaquel": hilera.anaquel.nombre if hilera.anaquel else "N/A",
                        "nivel": hilera.nivel,
                        "fila": hilera.fila,
                        "posicion": hilera.posicion,
                    },
                    "compatible": es_compatible,
                    "incompatibilidades": incompatibilidades,
                    "movimientos": 1,
                }
            )

        # Buscar muestras para intercambiar
        muestras_activas = (
            db.query(Sample)
            .filter(
                Sample.estado == "activa",
                Sample.anaquel_id.isnot(None),
                Sample.id != muestra_id,
            )
            .limit(20)
            .all()
        )

        for muestra_alt in muestras_activas:
            if not muestra_alt.anaquel_id:
                continue

            hilera_alt = (
                db.query(Hilera)
                .filter(
                    Hilera.anaquel_id == muestra_alt.anaquel_id,
                    Hilera.nivel == muestra_alt.nivel,
                    Hilera.fila == muestra_alt.fila,
                    Hilera.posicion == muestra_alt.posicion,
                )
                .first()
            )

            if not hilera_alt or hilera_alt.estado != "ocupado":
                continue

            # Verificar dimensiones
            dim_alt = (muestra_alt.dimension or "1x1").split("x")
            ancho_alt = int(dim_alt[0])
            fondo_alt = int(dim_alt[1])

            if ancho <= hilera_alt.ancho_max and fondo <= hilera_alt.fondo_max:
                # Verificar compatibilidad de la muestra alternativa en la posición actual
                clase_alt = (
                    muestra_alt.clase_peligro.codigo
                    if muestra_alt.clase_peligro
                    else None
                )
                compatible_en_origen = True

                if clase_alt:
                    vecinos_origen = CompatibilidadService.get_vecinos(
                        db, hilera_actual.id
                    )
                    for vecino in vecinos_origen:
                        if (
                            vecino.get("clase_peligro")
                            and vecino.get("muestra_id") != muestra_alt.id
                        ):
                            resultado = CompatibilidadService.verificar_compatibilidad(
                                clase_alt, vecino["clase_peligro"]
                            )
                            if not resultado["compatible"]:
                                compatible_en_origen = False

                if compatible_en_origen:
                    propuestas.append(
                        {
                            "tipo": "intercambio",
                            "hilera_id": hilera_alt.id,
                            "muestra_intercambiar": {
                                "id": muestra_alt.id,
                                "nombre": muestra_alt.nombre,
                                "clase": clase_alt,
                            },
                            "hilera_destino": {
                                "anaquel": hilera_alt.anaquel.nombre
                                if hilera_alt.anaquel
                                else "N/A",
                                "nivel": hilera_alt.nivel,
                                "fila": hilera_alt.fila,
                                "posicion": hilera_alt.posicion,
                            },
                            "compatible": True,
                            "movimientos": 2,
                        }
                    )

        return {
            "success": True,
            "muestra": {
                "id": muestra.id,
                "nombre": muestra.nombre,
                "hilera_actual": hilera_actual.id if hilera_actual else None,
                "clase_peligro": clase_muestra,
            },
            "propuestas": propuestas[:limite],
            "total_propuestas": len(propuestas),
        }

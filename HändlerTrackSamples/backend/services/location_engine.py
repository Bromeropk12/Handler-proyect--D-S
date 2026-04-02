"""
Motor de Localización Inteligente
Algoritmo para sugerir la mejor ubicación para una muestra química
"""

from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any, Tuple
from models.sample import Sample
from models.hilera import Hilera
from models.anaquel import Anaquel
from models.anaquel_proveedor import AnaquelProveedor
from services.compatibilidad import CompatibilidadService


class LocationEngine:
    """
    Motor de localización inteligente para asignación de muestras.
    Implementa el algoritmo de ubicación según SRS v2.0:
    1. Filtrar por línea de negocio
    2. Filtrar por proveedor (RNF-2: tabla anaquel_proveedor)
    3. Filtrar por dimensiones (1x1, 2x1, 2x2)
    4. Filtrar por estado físico (líquido→niveles 1-4, sólido→5-10)
    5. Buscar hileras con capacidad disponible
    6. Verificar compatibilidad química con vecinos
    """

    @staticmethod
    def sugerir_ubicacion(
        db: Session, muestra_id: int, ignorar_compatibilidad: bool = False
    ) -> Dict[str, Any]:
        """
        Sugiere la mejor ubicación para una muestra.

        Args:
            db: Sesión de base de datos
            muestra_id: ID de la muestra a localizar
            ignorar_compatibilidad: Si True, omite verificación de compatibilidad química

        Returns:
            Diccionario con ubicación sugerida y alternativas
        """
        # Obtener la muestra
        muestra = db.query(Sample).filter(Sample.id == muestra_id).first()
        if not muestra:
            return {"success": False, "error": "Muestra no encontrada"}

        # 1. Filtrar por línea de negocio
        linea_id = None
        if muestra.linea_negocio:
            from models.linea import Linea

            linea = (
                db.query(Linea)
                .filter(Linea.nombre.ilike(muestra.linea_negocio))
                .first()
            )
            if linea:
                linea_id = linea.id

        # 2. Filtrar por proveedor (RNF-2: tabla anaquel_proveedor)
        anaquel_ids_permitidos = None
        if muestra.proveedor_id:
            anaquel_ids = (
                db.query(AnaquelProveedor.anaquel_id)
                .filter(AnaquelProveedor.proveedor_id == muestra.proveedor_id)
                .all()
            )
            anaquel_ids_permitidos = [a[0] for a in anaquel_ids]

        # 3. Determinar estado físico basado en el tipo de muestra
        estado_fisico = None
        if hasattr(muestra, "estado_fisico") and muestra.estado_fisico:
            estado_fisico = muestra.estado_fisico
        else:
            # Por defecto: líquidos en niveles inferiores, sólidos en superiores
            # Esto se puede ajustar según la naturaleza de la muestra
            # Por ahora asumimos que la muestra puede ir en cualquier nivel
            estado_fisico = "ambos"

        # 4. Determinar nivel según estado físico
        nivel_min = None
        nivel_max = None
        if estado_fisico == "líquido":
            nivel_min = 1
            nivel_max = 4
        elif estado_fisico == "sólido":
            nivel_min = 5
            nivel_max = 10
        else:
            nivel_min = 1
            nivel_max = 10

        # 5. Obtener dimensiones
        dimension = muestra.dimension or "1x1"
        partes = dimension.split("x")
        ancho = int(partes[0]) if len(partes) > 0 else 1
        fondo = int(partes[1]) if len(partes) > 1 else 1

        # 6. Buscar hileras disponibles
        query = (
            db.query(Hilera)
            .join(Anaquel)
            .filter(
                Hilera.estado == "disponible",
                Hilera.posiciones_usadas < Hilera.capacidad_max,
                Hilera.ancho_max >= ancho,
                Hilera.fondo_max >= fondo,
                Hilera.nivel >= nivel_min,
                Hilera.nivel <= nivel_max,
            )
        )

        if linea_id:
            query = query.filter(Anaquel.linea_id == linea_id)

        if anaquel_ids_permitidos:
            query = query.filter(Anaquel.id.in_(anaquel_ids_permitidos))

        hileras_disponibles = query.order_by(Hilera.posiciones_usadas).limit(50).all()

        if not hileras_disponibles:
            return {
                "success": False,
                "error": "No hay ubicaciones disponibles",
                "sugerencia": "Considere reubicación de muestras existentes",
            }

        # 7. Verificar compatibilidad química (si no se ignora)
        ubicaciones_seguras = []
        ubicaciones_incompatibles = []

        for hilera in hileras_disponibles:
            if ignorar_compatibilidad:
                ubicaciones_seguras.append(
                    {
                        "hilera_id": hilera.id,
                        "anaquel": hilera.anaquel.nombre,
                        "nivel": hilera.nivel,
                        "fila": hilera.fila,
                        "posicion": hilera.posicion,
                        "capacidad_disponible": hilera.capacidad_max
                        - hilera.posiciones_usadas,
                    }
                )
            else:
                # Verificar compatibilidad con vecinos
                compatibilidad = LocationEngine._verificar_compatibilidad_vecinos(
                    db, muestra, hilera
                )

                if compatibilidad["compatible"]:
                    ubicaciones_seguras.append(
                        {
                            "hilera_id": hilera.id,
                            "anaquel": hilera.anaquel.nombre,
                            "nivel": hilera.nivel,
                            "fila": hilera.fila,
                            "posicion": hilera.posicion,
                            "capacidad_disponible": hilera.capacidad_max
                            - hilera.posiciones_usadas,
                            "compatibilidad": compatibilidad,
                        }
                    )
                else:
                    ubicaciones_incompatibles.append(
                        {
                            "hilera_id": hilera.id,
                            "anaquel": hilera.anaquel.nombre,
                            "nivel": hilera.nivel,
                            "fila": hilera.fila,
                            "posicion": hilera.posicion,
                            "razon": compatibilidad["mensaje"],
                        }
                    )

        # Si no hay ubicaciones seguras, devolver alternativas incompatibles
        if not ubicaciones_seguras and ubicaciones_incompatibles:
            return {
                "success": True,
                "advertencia": "No hay ubicaciones completamente compatibles",
                "alternativas_incompatibles": ubicaciones_incompatibles[:5],
                "sugerencia_reubicacion": "Considere reubicar muestras existentes",
            }

        return {
            "success": True,
            "muestra": {
                "id": muestra.id,
                "nombre": muestra.nombre,
                "dimension": dimension,
                "linea_negocio": muestra.linea_negocio,
            },
            "ubicaciones_sugeridas": ubicaciones_seguras[:5],
            "total_encontradas": len(ubicaciones_seguras),
        }

    @staticmethod
    def _verificar_compatibilidad_vecinos(
        db: Session, muestra: Sample, hilera: Hilera
    ) -> Dict[str, Any]:
        """
        Verifica la compatibilidad química con las muestras en hileras vecinas.

        Utiliza el servicio de CompatibilidadService para verificar según matriz SGA/GHS.

        Args:
            db: Sesión de base de datos
            muestra: Muestra a asignar
            hilera: Hilera destino

        Returns:
            Diccionario con resultado de compatibilidad
        """
        # Obtener vecinos usando CompatibilidadService
        vecinos = CompatibilidadService.get_vecinos(db, hilera.id)

        if not vecinos:
            return {
                "compatible": True,
                "mensaje": "No hay muestras en posiciones vecinas",
                "vecinos": [],
            }

        # Si la muestra no tiene clase de peligro, es segura
        clase_muestra = None
        if muestra.clase_peligro_id and muestra.clase_peligro:
            clase_muestra = muestra.clase_peligro.codigo

        if not clase_muestra:
            return {
                "compatible": True,
                "mensaje": "Muestra sin clase de peligro asignada - Seguro",
                "vecinos": vecinos,
            }

        # Verificar compatibilidad con cada vecino
        incompatibilidades = []

        for vecino in vecinos:
            if not vecino.get("clase_peligro"):
                continue

            resultado = CompatibilidadService.verificar_compatibilidad(
                clase_muestra, vecino["clase_peligro"]
            )

            if not resultado["compatible"]:
                incompatibilidades.append(
                    {
                        "vecino": {
                            "nombre": vecino["nombre"],
                            "clase": vecino["clase_peligro"],
                        },
                        "nivel": resultado["nivel"],
                        "mensaje": resultado["mensaje"],
                    }
                )

        if incompatibilidades:
            return {
                "compatible": False,
                "mensaje": f"Incompatibilidad con {len(incompatibilidades)} muestra(s) vecina(s)",
                "incompatibilidades": incompatibilidades,
                "vecinos": vecinos,
            }

        return {
            "compatible": True,
            "mensaje": f"Compatible con las {len(vecinos)} muestra(s) vecina(s)",
            "vecinos": vecinos,
        }

    @staticmethod
    def asignar_muestra(
        db: Session, muestra_id: int, hilera_id: int, usuario_id: int
    ) -> Dict[str, Any]:
        """
        Asigna una muestra a una hilera específica.

        Args:
            db: Sesión de base de datos
            muestra_id: ID de la muestra
            hilera_id: ID de la hilera
            usuario_id: ID del usuario que realiza la asignación

        Returns:
            Diccionario con resultado de la operación
        """
        # Verificar que la muestra exista
        muestra = db.query(Sample).filter(Sample.id == muestra_id).first()
        if not muestra:
            return {"success": False, "error": "Muestra no encontrada"}

        # Verificar que la hilera exista y esté disponible
        hilera = db.query(Hilera).filter(Hilera.id == hilera_id).first()
        if not hilera:
            return {"success": False, "error": "Hilera no encontrada"}

        if hilera.estado != "disponible":
            return {"success": False, "error": f"Hilera en estado {hilera.estado}"}

        # Verificar dimensiones
        dimension = muestra.dimension or "1x1"
        partes = dimension.split("x")
        ancho = int(partes[0]) if len(partes) > 0 else 1
        fondo = int(partes[1]) if len(partes) > 1 else 1

        if ancho > hilera.ancho_max or fondo > hilera.fondo_max:
            return {
                "success": False,
                "error": f"Dimensiones {dimension} no caben en la hilera",
            }

        # Asignar la muestra
        hilera.muestra_id = muestra_id
        hilera.estado = "ocupado"
        hilera.posiciones_usadas += 1

        # Actualizar estado de la muestra
        muestra.anaquel_id = hilera.anaquel_id
        muestra.nivel = hilera.nivel
        muestra.fila = hilera.fila
        muestra.posicion = hilera.posicion
        muestra.estado = "activa"

        db.commit()

        return {
            "success": True,
            "mensaje": f"Muestra {muestra.nombre} asignada a {hilera.anaquel.nombre} - Nivel {hilera.nivel}, Fila {hilera.fila}, Pos {hilera.posicion}",
            "ubicacion": {
                "anaquel": hilera.anaquel.nombre,
                "nivel": hilera.nivel,
                "fila": hilera.fila,
                "posicion": hilera.posicion,
            },
        }

    @staticmethod
    def calcular_reubicacion(db: Session, muestra_conflicto_id: int) -> Dict[str, Any]:
        """
        Calcula las opciones de reubicación para una muestra.
        Delega al ReubicacionService para el análisis completo.

        Args:
            db: Sesión de base de datos
            muestra_conflicto_id: ID de la muestra que necesita reubicación

        Returns:
            Diccionario con opciones de reubicación
        """
        from services.reubicacion import ReubicacionService

        muestra = db.query(Sample).filter(Sample.id == muestra_conflicto_id).first()
        if not muestra:
            return {"success": False, "error": "Muestra no encontrada"}

        dimension = muestra.dimension or "1x1"

        # Usar el algoritmo de reubicación mínima
        resultado = ReubicacionService.calcular_movimientos_necesarios(
            db, muestra_conflicto_id, dimension
        )

        return {
            "success": resultado.get("success", False),
            "muestra": {
                "id": muestra.id,
                "nombre": muestra.nombre,
                "dimension": dimension,
                "clase_peligro": muestra.clase_peligro.codigo
                if muestra.clase_peligro
                else None,
            },
            "opciones": resultado.get("opciones", []),
            "tipo": resultado.get("tipo", "sin_opciones"),
            "movimientos": resultado.get("movimientos", -1),
            "mensaje": resultado.get("mensaje", resultado.get("error", "")),
        }

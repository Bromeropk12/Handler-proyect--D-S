"""
Motor de Organización Automática - "El Cerebro" del WMS
Orquestra la ubicación inteligente de muestras químicas considerando riesgo-químico
"""

from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional, Tuple
from decimal import Decimal
from datetime import datetime

from models.sample import Sample
from models.hilera import Hilera
from models.anaquel import Anaquel
from models.linea import Linea
from models.clase_peligro import ClasePeligro
from services.location_engine import LocationEngine
from services.compatibilidad import CompatibilidadService
from services.reubicacion import ReubicacionService


class MotorOrganizacion:
    """
    Motor de organización automática que gestiona la ubicación
    y reorganización de muestras en el almacén.

    Responsabilidades:
    - Coordinar LocationEngine, CompatibilidadService y ReubicacionService
    - Ejecutar organización automática completa
    - Analizar estado de organización actual
    - Generar alertas de problemas de organización
    """

    @staticmethod
    def organizar_muestra(
        db: Session,
        muestra_id: int,
        modo: str = "auto",
        hilera_id_seleccionada: Optional[int] = None,
    ) -> Dict[str, Any]:
        """
        Organiza una muestra específica en el almacén.

        Args:
            db: Sesión de base de datos
            muestra_id: ID de la muestra a organizar
            modo: "auto" | "sugerido" | "manual"
            hilera_id_seleccionada: ID de hilera específica (para modo manual)

        Returns:
            Diccionario con resultado de la organización
        """
        # 1. Obtener la muestra
        muestra = db.query(Sample).filter(Sample.id == muestra_id).first()
        if not muestra:
            return {"success": False, "error": "Muestra no encontrada"}

        # 2. Según el modo, ejecutar diferente lógica
        if modo == "manual" and hilera_id_seleccionada:
            # Modo manual: asignar a hilera específica
            return MotorOrganizacion._organizar_manual(
                db, muestra, hilera_id_seleccionada
            )

        elif modo == "sugerido":
            # Modo sugerido: solo devuelve opciones
            return LocationEngine.sugerir_ubicacion(
                db, muestra_id, ignorar_compatibilidad=False
            )

        else:
            # Modo automático: busca mejor ubicación y asigna
            return MotorOrganizacion._organizar_automatico(db, muestra)

    @staticmethod
    def _organizar_manual(
        db: Session, muestra: Sample, hilera_id: int
    ) -> Dict[str, Any]:
        """Asigna muestra a hilera específica verificando compatibilidad."""

        hilera = db.query(Hilera).filter(Hilera.id == hilera_id).first()
        if not hilera:
            return {"success": False, "error": "Hilera no encontrada"}

        if hilera.estado != "disponible":
            return {"success": False, "error": "Hilera no disponible"}

        # Verificar dimensiones
        dim_muestra = (muestra.dimension or "1x1").split("x")
        ancho_m, fondo_m = int(dim_muestra[0]), int(dim_muestra[1])

        if ancho_m > hilera.ancho_max or fondo_m > hilera.fondo_max:
            return {"success": False, "error": "Dimensiones no caben en la hilera"}

        # Verificar compatibilidad con vecinos si la muestra tiene clase de peligro
        if muestra.clase_peligro_id:
            compatibilidad = LocationEngine._verificar_compatibilidad_vecinos(
                db, muestra, hilera
            )
            if not compatibilidad["compatible"]:
                return {
                    "success": False,
                    "error": f"Incompatibilidad: {compatibilidad['mensaje']}",
                    "compatibilidad": compatibilidad,
                }

        # Asignar
        return LocationEngine.asignar_muestra(db, muestra.id, hilera_id, usuario_id=1)

    @staticmethod
    def _organizar_automatico(db: Session, muestra: Sample) -> Dict[str, Any]:
        """Organiza automáticamente buscando la mejor ubicación."""

        # 1. Obtener sugerencias de ubicación
        resultado = LocationEngine.sugerir_ubicacion(
            db, muestra.id, ignorar_compatibilidad=False
        )

        if not resultado.get("success"):
            # 2. Si no hay ubicación, intentar reubicación mínima
            return MotorOrganizacion._intentar_reubicacion(db, muestra, resultado)

        if not resultado.get("ubicaciones_sugeridas"):
            return {
                "success": False,
                "error": "No se encontraron ubicaciones seguras",
                "sugerencia": "Considere reorganizar el almacén",
            }

        # 3. Tomar la mejor ubicación sugerida
        mejor_ubicacion = resultado["ubicaciones_sugeridas"][0]

        # 4. Asignar la muestra
        return LocationEngine.asignar_muestra(
            db, muestra.id, mejor_ubicacion["hilera_id"], usuario_id=1
        )

    @staticmethod
    def _intentar_reubicacion(
        db: Session, muestra: Sample, resultado_anterior: Dict
    ) -> Dict[str, Any]:
        """Intenta encontrar ubicación mediante reubicación mínima."""

        # Buscar propuestas de reubicación
        propuestas = ReubicacionService.get_propuestas_reubicacion(
            db, muestra.id, limite=3
        )

        if not propuestas.get("success") or not propuestas.get("propuestas"):
            return {
                "success": False,
                "error": "No hay ubicaciones disponibles ni reubicaciones posibles",
                "detalle": resultado_anterior.get("error"),
                "sugerencia": "El almacén está lleno, considere eliminar muestras obsoletas",
            }

        # Intentar ejecutar la primera propuesta viable
        for propuesta in propuestas["propuestas"]:
            # Aquí se implementaría la lógica de ejecutar intercambio
            return {
                "success": True,
                "mensaje": "Reubicación necesaria",
                "propuesta": propuesta,
                "requiere_confirmacion": True,
            }

        return {
            "success": False,
            "error": "No se pudo encontrar solución de reubicación",
        }

    @staticmethod
    def organizar_todo_el_almacen(
        db: Session, linea_id: Optional[int] = None, solo_incompatibles: bool = False
    ) -> Dict[str, Any]:
        """
        Reorganiza todo el almacén o una línea específica.

        Args:
            db: Sesión de base de datos
            linea_id: ID de línea específica (None = todo el almacén)
            solo_incompatibles: Si True, solo corrige incompatibilidades

        Returns:
            Diccionario con resultado de la reorganización
        """
        # 1. Obtener todas las muestras que necesitan organización
        query = db.query(Sample).filter(Sample.estado == "activa")

        if linea_id:
            linea = db.query(Linea).filter(Linea.id == linea_id).first()
            if linea:
                query = query.filter(Sample.linea_negocio.ilike(linea.nombre))

        muestras = query.all()

        resultados = {
            "success": True,
            "total_muestras": len(muestras),
            "organizadas": [],
            "errores": [],
            "incompatibilidades_encontradas": [],
        }

        # 2. Analizar cada muestra
        for muestra in muestras:
            # Si solo corrección de incompatibilidades, verificar si hay conflicto
            if solo_incompatibles and muestra.anaquel_id:
                conflicto = MotorOrganizacion._verificar_incompatibilidad_actual(
                    db, muestra
                )
                if conflicto:
                    resultados["incompatibilidades_encontradas"].append(conflicto)
                    continue  # Saltar esta muestra, está en conflicto

            # Ejecutar organización automática
            resultado = MotorOrganizacion._organizar_automatico(db, muestra)

            if resultado.get("success"):
                resultados["organizadas"].append(
                    {
                        "muestra_id": muestra.id,
                        "nombre": muestra.nombre,
                        "mensaje": resultado.get("mensaje", "OK"),
                    }
                )
            else:
                resultados["errores"].append(
                    {
                        "muestra_id": muestra.id,
                        "nombre": muestra.nombre,
                        "error": resultado.get("error"),
                    }
                )

        # Actualizar resultado general
        resultados["success"] = len(resultados["errores"]) == 0
        resultados["mensaje"] = (
            f"Organizadas: {len(resultados['organizadas'])}, Errores: {len(resultados['errores'])}"
        )

        return resultados

    @staticmethod
    def _verificar_incompatibilidad_actual(
        db: Session, muestra: Sample
    ) -> Optional[Dict]:
        """Verifica si una muestra tiene incompatibilidades con sus vecinos actuales."""

        if not muestra.anaquel_id:
            return None

        # Obtener la hilera actual de la muestra
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
            return None

        # Verificar compatibilidad
        if muestra.clase_peligro_id:
            compatibilidad = LocationEngine._verificar_compatibilidad_vecinos(
                db, muestra, hilera_actual
            )
            if not compatibilidad.get("compatible"):
                return {
                    "muestra_id": muestra.id,
                    "nombre": muestra.nombre,
                    "hilera_id": hilera_actual.id,
                    "incompatibilidades": compatibilidad.get("incompatibilidades", []),
                }

        return None

    @staticmethod
    def analizar_organizacion_actual(
        db: Session, linea_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Analiza el estado actual de organización del almacén.

        Returns:
            Diccionario con:
            - incompatible_count: número de conflictos
            - score_organizacion: 0-100
            - problemas: lista de problemas encontrados
            - sugerencias: recomendaciones
        """
        # 1. Obtener todas las muestras activas con ubicación
        query = db.query(Sample).filter(
            Sample.estado == "activa", Sample.anaquel_id.isnot(None)
        )

        if linea_id:
            linea = db.query(Linea).filter(Linea.id == linea_id).first()
            if linea:
                query = query.filter(Sample.linea_negocio.ilike(linea.nombre))

        muestras = query.all()

        problemas = []
        incompatibilidades = 0
        sin_clase = 0
        ok = 0

        # 2. Analizar cada muestra
        for muestra in muestras:
            if not muestra.clase_peligro_id:
                sin_clase += 1
                continue

            # Obtener su hilera
            hilera = (
                db.query(Hilera)
                .filter(
                    Hilera.anaquel_id == muestra.anaquel_id,
                    Hilera.nivel == muestra.nivel,
                    Hilera.fila == muestra.fila,
                    Hilera.posicion == muestra.posicion,
                )
                .first()
            )

            if not hilera:
                continue

            # Verificar compatibilidad
            compatibilidad = LocationEngine._verificar_compatibilidad_vecinos(
                db, muestra, hilera
            )

            if not compatibilidad.get("compatible"):
                incompatibilidades += 1
                problemas.append(
                    {
                        "muestra_id": muestra.id,
                        "nombre": muestra.nombre,
                        "clase_peligro": muestra.clase_peligro.codigo
                        if muestra.clase_peligro
                        else None,
                        "incompatibilidades": compatibilidad.get(
                            "incompatibilidades", []
                        ),
                    }
                )
            else:
                ok += 1

        # 3. Calcular score
        total = len(muestras)
        if total == 0:
            score = 100
        else:
            score = round((ok / total) * 100, 1)

        # 4. Generar sugerencias
        sugerencias = []
        if incompatibilidades > 0:
            sugerencias.append(
                f"Hay {incompatibilidades} productos incompatibles juntos - ejecutar organización automática"
            )
        if score < 80:
            sugerencias.append(
                "El nivel de organización es bajo - considere reorganizar"
            )

        return {
            "success": True,
            "total_muestras": total,
            "incompatible_count": incompatibilidades,
            "sin_clase_peligro": sin_clase,
            "ok_count": ok,
            "score_organizacion": score,
            "problemas": problemas[:20],  # Limitar a 20
            "sugerencias": sugerencias,
            "linea_id": linea_id,
        }

    @staticmethod
    def obtener_resumen_lineas(db: Session) -> Dict[str, Any]:
        """
        Obtiene resumen de organización por cada línea de negocio.

        Returns:
            Diccionario con resumen por línea
        """
        lineas = db.query(Linea).all()

        resumen = []

        for linea in lineas:
            analisis = MotorOrganizacion.analizar_organizacion_actual(db, linea.id)

            resumen.append(
                {
                    "linea_id": linea.id,
                    "linea_nombre": linea.nombre,
                    "muestras_totales": analisis["total_muestras"],
                    "incompatibilidades": analisis["incompatible_count"],
                    "score": analisis["score_organizacion"],
                    "problemas": len(analisis["problemas"]),
                }
            )

        return {"success": True, "lineas": resumen, "total_lineas": len(resumen)}

    @staticmethod
    def obtener_hileras_con_contenido(
        db: Session, linea_id: Optional[int] = None, anaquel_id: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """
        Obtiene todas las hileras con su contenido para visualización.

        Args:
            db: Sesión de base de datos
            linea_id: Filtrar por línea
            anaquel_id: Filtrar por anaquel específico

        Returns:
            Lista de hileras con información de contenido
        """
        query = db.query(Hilera).join(Anaquel)

        if linea_id:
            query = query.filter(Anaquel.linea_id == linea_id)

        if anaquel_id:
            query = query.filter(Anaquel.id == anaquel_id)

        hileras = query.order_by(
            Anaquel.nombre, Hilera.nivel.desc(), Hilera.fila, Hilera.posicion
        ).all()

        resultado = []

        for hilera in hileras:
            item = {
                "id": hilera.id,
                "anaquel_id": hilera.anaquel_id,
                "anaquel_nombre": hilera.anaquel.nombre if hilera.anaquel else "N/A",
                "linea_id": hilera.anaquel.linea_id
                if hilera.anaquel and hilera.anaquel.linea
                else None,
                "nivel": hilera.nivel,
                "fila": hilera.fila,
                "posicion": hilera.posicion,
                "estado": hilera.estado,
                "capacidad_max": hilera.capacidad_max,
                "posiciones_usadas": hilera.posiciones_usadas,
                "muestra": None,
                "tiene_incompatibilidad": False,
                "clase_peligro": None,
            }

            # Si tiene muestra, obtener información
            if hilera.muestra_id:
                muestra = (
                    db.query(Sample).filter(Sample.id == hilera.muestra_id).first()
                )
                if muestra:
                    clase_codigo = None
                    clase_nombre = None
                    clase_color = None

                    if muestra.clase_peligro:
                        clase_codigo = muestra.clase_peligro.codigo
                        clase_nombre = muestra.clase_peligro.nombre
                        clase_color = muestra.clase_peligro.color

                    item["muestra"] = {
                        "id": muestra.id,
                        "nombre": muestra.nombre,
                        "lote": muestra.lote,
                        "cantidad": float(muestra.cantidad_gramos)
                        if muestra.cantidad_gramos
                        else 0,
                        "clase_peligro_codigo": clase_codigo,
                        "clase_peligro_nombre": clase_nombre,
                        "clase_peligro_color": clase_color,
                    }
                    item["clase_peligro"] = clase_codigo

                    # Verificar si hay incompatibilidad con vecinos
                    if clase_codigo:
                        compatibilidad = (
                            LocationEngine._verificar_compatibilidad_vecinos(
                                db, muestra, hilera
                            )
                        )
                        item["tiene_incompatibilidad"] = not compatibilidad.get(
                            "compatible"
                        )
                        item["incompatibilidades"] = (
                            compatibilidad.get("incompatibilidades", [])
                            if not compatibilidad.get("compatible")
                            else []
                        )

            resultado.append(item)

        return resultado

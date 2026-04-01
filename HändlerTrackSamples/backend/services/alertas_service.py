"""
Servicio de Alertas Inteligentes
Sistema automatizado de alertas para stock bajo, vencimientos y optimización
"""

from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from datetime import datetime, date, timedelta
from decimal import Decimal


class AlertasService:
    """
    Servicio para gestionar alertas inteligentes del sistema.

    Tipos de alertas:
    - Stock bajo: Muestras por debajo del umbral mínimo
    - Próximas a vencer: Muestras que即将vencer
    - Optimización de espacio: Hileras con alta disponibilidad
    """

    # Umbrales configurables
    UMBRAL_STOCK_BAJO = 50  # gramos
    DIAS_ALERTA_VENCIMIENTO = [30, 60, 90]

    @staticmethod
    def verificar_stock_bajo(
        db: Session, umbral: Optional[float] = None
    ) -> Dict[str, Any]:
        """
        Verifica muestras con stock por debajo del umbral.

        Args:
            db: Sesión de base de datos
            umbral: Umbral personalizado en gramos (opcional)

        Returns:
            Diccionario con alertas de stock bajo
        """
        from models.sample import Sample
        from models.proveedor import Proveedor

        umbral_gramos = umbral or AlertasService.UMBRAL_STOCK_BAJO

        # Buscar muestras con cantidad baja
        muestras = (
            db.query(Sample)
            .filter(
                Sample.estado == "activa",
                Sample.cantidad_gramos > 0,
                Sample.cantidad_gramos <= umbral_gramos,
            )
            .all()
        )

        alertas = []
        total_gramos = 0

        for muestra in muestras:
            proveedor_nombre = ""
            if muestra.proveedor:
                proveedor_nombre = muestra.proveedor.nombre

            alertas.append(
                {
                    "muestra_id": muestra.id,
                    "nombre": muestra.nombre,
                    "lote": muestra.lote,
                    "cantidad_gramos": float(muestra.cantidad_gramos),
                    "proveedor": proveedor_nombre,
                    "linea_negocio": muestra.linea_negocio,
                    "urgencia": "critico"
                    if float(muestra.cantidad_gramos) <= umbral_gramos / 2
                    else "medio",
                }
            )
            total_gramos += float(muestra.cantidad_gramos)

        total_gramos_sum = total_gramos

        return {
            "success": True,
            "tipo": "stock_bajo",
            "cantidad_alertas": len(alertas),
            "total_gramos": total_gramos_sum,
            "umbral_usado": umbral_gramos,
            "alertas": alertas,
        }

    @staticmethod
    def verificar_muestras_por_vencer(
        db: Session, dias_adelante: int = 90
    ) -> Dict[str, Any]:
        """
        Verifica muestras próximas a vencer.

        Args:
            db: Sesión de base de datos
            dias_adelante: Días hacia adelante a considerar

        Returns:
            Diccionario con alertas de vencimiento
        """
        from models.sample import Sample

        hoy = date.today()
        hasta = hoy + timedelta(days=dias_adelante)

        # Buscar muestras que vencen en el período
        muestras = (
            db.query(Sample)
            .filter(
                Sample.estado == "activa",
                Sample.fecha_vencimiento.isnot(None),
                Sample.fecha_vencimiento >= hoy,
                Sample.fecha_vencimiento <= hasta,
            )
            .order_by(Sample.fecha_vencimiento.asc())
            .all()
        )

        alertas = {
            "critico": [],  # <= 30 días
            "alto": [],  # 31-60 días
            "medio": [],  # 61-90 días
            "bajo": [],  # > 90 días
        }

        for muestra in muestras:
            dias_restantes = (muestra.fecha_vencimiento - hoy).days

            categoria = ""
            if dias_restantes <= 30:
                categoria = "critico"
            elif dias_restantes <= 60:
                categoria = "alto"
            elif dias_restantes <= 90:
                categoria = "medio"
            else:
                categoria = "bajo"

            proveedor_nombre = ""
            if muestra.proveedor:
                proveedor_nombre = muestra.proveedor.nombre

            alerta = {
                "muestra_id": muestra.id,
                "nombre": muestra.nombre,
                "lote": muestra.lote,
                "cantidad_gramos": float(muestra.cantidad_gramos),
                "proveedor": proveedor_nombre,
                "fecha_vencimiento": str(muestra.fecha_vencimiento),
                "dias_restantes": dias_restantes,
            }

            alertas[categoria].append(alerta)

        total = sum(len(v) for v in alertas.values())

        return {
            "success": True,
            "tipo": "vencimiento",
            "periodo": f"{hoy} a {hasta}",
            "total_alertas": total,
            "alertas": alertas,
        }

    @staticmethod
    def verificar_vencidas(db: Session) -> Dict[str, Any]:
        """
        Verifica muestras ya vencidas.

        Args:
            db: Sesión de base de datos

        Returns:
            Diccionario con alertas de muestras vencidas
        """
        from models.sample import Sample

        hoy = date.today()

        muestras = (
            db.query(Sample)
            .filter(
                Sample.estado == "activa",
                Sample.fecha_vencimiento.isnot(None),
                Sample.fecha_vencimiento < hoy,
            )
            .order_by(Sample.fecha_vencimiento.asc())
            .all()
        )

        alertas = []

        for muestra in muestras:
            dias_vencida = (hoy - muestra.fecha_vencimiento).days

            proveedor_nombre = ""
            if muestra.proveedor:
                proveedor_nombre = muestra.proveedor.nombre

            alertas.append(
                {
                    "muestra_id": muestra.id,
                    "nombre": muestra.nombre,
                    "lote": muestra.lote,
                    "cantidad_gramos": float(muestra.cantidad_gramos),
                    "proveedor": proveedor_nombre,
                    "fecha_vencimiento": str(muestra.fecha_vencimiento),
                    "dias_vencida": dias_vencida,
                }
            )

        return {
            "success": True,
            "tipo": "vencidas",
            "cantidad_alertas": len(alertas),
            "alertas": alertas,
        }

    @staticmethod
    def verificar_optimizacion_espacio(db: Session) -> Dict[str, Any]:
        """
        Verifica oportunidades de optimización de espacio.

        Args:
            db: Sesión de base de datos

        Returns:
            Diccionario con alertas de optimización
        """
        from models.hilera import Hilera
        from models.anaquel import Anaquel

        # Obtener hileras disponibles por anaquel
        anaqueles = db.query(Anaquel).all()

        oportunidades = []

        for anaquel in anaqueles:
            hileras = db.query(Hilera).filter(Hilera.anaquel_id == anaquel.id).all()

            disponibles = [h for h in hileras if h.estado == "disponible"]
            ocupadas = [h for h in hileras if h.estado == "ocupado"]

            if len(disponibles) > len(ocupadas) * 0.5:  # Más del 50% disponible
                oportunidades.append(
                    {
                        "anaquel_id": anaquel.id,
                        "anaquel_nombre": anaquel.nombre,
                        "linea": anaquel.linea.nombre if anaquel.linea else "N/A",
                        "hileras_totales": len(hileras),
                        "hileras_disponibles": len(disponibles),
                        "hileras_ocupadas": len(ocupadas),
                        "porcentaje_disponible": round(
                            len(disponibles) / len(hileras) * 100, 1
                        )
                        if hileras
                        else 0,
                        "recomendacion": "Considerar redistribución de productos"
                        if len(disponibles) > len(ocupadas)
                        else "Espacio óptimo",
                    }
                )

        return {
            "success": True,
            "tipo": "optimizacion",
            "cantidad_oportunidades": len(oportunidades),
            "oportunidades": oportunidades,
        }

    @staticmethod
    def get_dashboard_alertas(db: Session) -> Dict[str, Any]:
        """
        Obtiene un dashboard completo de todas las alertas.

        Args:
            db: Sesión de base de datos

        Returns:
            Diccionario con resumen de todas las alertas
        """
        stock_bajo = AlertasService.verificar_stock_bajo(db)
        por_vencer = AlertasService.verificar_muestras_por_vencer(db)
        vencidas = AlertasService.verificar_vencidas(db)
        optimizacion = AlertasService.verificar_optimizacion_espacio(db)

        total_alertas = (
            stock_bajo["cantidad_alertas"]
            + por_vencer["total_alertas"]
            + vencidas["cantidad_alertas"]
        )

        return {
            "success": True,
            "fecha_generacion": datetime.now().isoformat(),
            "total_alertas": total_alertas,
            "stock_bajo": stock_bajo,
            "proximas_vencer": por_vencer,
            "vencidas": vencidas,
            "optimizacion": optimizacion,
        }

    @staticmethod
    def get_alertas_por_tipo(
        db: Session, tipo: str, limite: int = 50
    ) -> List[Dict[str, Any]]:
        """
        Obtiene alertas de un tipo específico.

        Args:
            db: Sesión de base de datos
            tipo: Tipo de alerta (stock_bajo, vencimiento, vencidas, optimizacion)
            limite: Número máximo de resultados

        Returns:
            Lista de alertas del tipo especificado
        """
        if tipo == "stock_bajo":
            result = AlertasService.verificar_stock_bajo(db)
            return result.get("alertas", [])[:limite]
        elif tipo == "vencimiento":
            result = AlertasService.verificar_muestras_por_vencer(db)
            todas = []
            for categoria in ["critico", "alto", "medio", "bajo"]:
                todas.extend(result.get("alertas", {}).get(categoria, []))
            return todas[:limite]
        elif tipo == "vencidas":
            result = AlertasService.verificar_vencidas(db)
            return result.get("alertas", [])[:limite]
        elif tipo == "optimizacion":
            result = AlertasService.verificar_optimizacion_espacio(db)
            return result.get("oportunidades", [])[:limite]

        return []

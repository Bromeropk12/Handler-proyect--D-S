"""
Servicio FEFO (First Expire, First Out)
Estrategia de despacho que prioriza muestras con fecha de vencimiento más próxima
"""

from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from datetime import datetime, date
from decimal import Decimal
from models.sample import Sample
from models.hilera import Hilera


class FEFOService:
    """
    Servicio para gestionar la estrategia de despacho FEFO.
    
    Primero en Vencer, Primero en Salir (FEFO):
    - Identifica las muestras que están próximas a vencer
    - Las ordena por fecha de vencimiento ascendente
    - Sugiere las muestras a despachar para minimizar desperdicio
    """
    
    @staticmethod
    def buscar_muestras_fefo(
        db: Session,
        producto_id: Optional[int] = None,
        proveedor_id: Optional[int] = None,
        linea_negocio: Optional[str] = None,
        limite: int = 10
    ) -> List[Sample]:
        """
        Busca muestras para despacho FEFO.
        
        Args:
            db: Sesión de base de datos
            producto_id: ID específico del producto (opcional)
            proveedor_id: Filtrar por proveedor
            linea_negocio: Filtrar por línea de negocio
            limite: Número máximo de resultados
            
        Returns:
            Lista de muestras ordenadas por fecha de vencimiento
        """
        query = db.query(Sample).filter(
            Sample.estado == "activa",
            Sample.cantidad_gramos > 0
        )
        
        if producto_id:
            query = query.filter(Sample.id == producto_id)
        
        if proveedor_id:
            query = query.filter(Sample.proveedor_id == proveedor_id)
        
        if linea_negocio:
            query = query.filter(Sample.linea_negocio == linea_negocio)
        
        # Ordenar por fecha de vencimiento ascendente (más próximo primero)
        # Las que no tienen fecha de vencimiento van al final
        return query.order_by(
            Sample.fecha_vencimiento.is_(None),
            Sample.fecha_vencimiento.asc()
        ).limit(limite).all()
    
    @staticmethod
    def sugerir_despacho(
        db: Session,
        producto_nombre: str,
        cantidad_requerida: Decimal
    ) -> Dict[str, Any]:
        """
        Sugiere qué muestras despachar para cumplir con una cantidad requerida.
        
        Args:
            db: Sesión de base de datos
            producto_nombre: Nombre del producto a despachar
            cantidad_requerida: Cantidad en gramos requerida
            
        Returns:
            Diccionario con sugerencia de despacho
        """
        # Buscar todas las muestras del producto
        muestras = db.query(Sample).filter(
            Sample.nombre.ilike(f"%{producto_nombre}%"),
            Sample.estado == "activa",
            Sample.cantidad_gramos > 0
        ).order_by(
            Sample.fecha_vencimiento.is_(None),
            Sample.fecha_vencimiento.asc()
        ).all()
        
        if not muestras:
            return {
                "success": False,
                "error": f"No se encontraron muestras activas para '{producto_nombre}'"
            }
        
        # Calcular cantidad total disponible
        cantidad_total = sum(float(m.cantidad_gramos) for m in muestras)
        
        if Decimal(str(cantidad_total)) < cantidad_requerida:
            return {
                "success": False,
                "error": f"Cantidad insuficiente. Disponible: {cantidad_total}g, Solicitado: {float(cantidad_requerida)}g",
                "disponible": cantidad_total
            }
        
        # Seleccionar muestras para cumplir la cantidad requerida
        muestras_seleccionadas = []
        cantidad_acumulada = Decimal(0)
        
        for muestra in muestras:
            if cantidad_acumulada >= cantidad_requerida:
                break
            
            cantidad_disponible = Decimal(str(muestra.cantidad_gramos))
            cantidad_a_tomar = min(cantidad_disponible, cantidad_requerida - cantidad_acumulada)
            
            dias_para_vencer = None
            if muestra.fecha_vencimiento:
                dias_para_vencer = (muestra.fecha_vencimiento - date.today()).days
            
            muestras_seleccionadas.append({
                "id": muestra.id,
                "nombre": muestra.nombre,
                "lote": muestra.lote,
                "cantidad_disponible": float(cantidad_disponible),
                "cantidad_a_despachar": float(cantidad_a_tomar),
                "fecha_vencimiento": str(muestra.fecha_vencimiento) if muestra.fecha_vencimiento else "Sin fecha",
                "dias_para_vencer": dias_para_vencer,
                "urgencia": FEFOService._get_urgencia(dias_para_vencer)
            })
            
            cantidad_acumulada += cantidad_a_tomar
        
        return {
            "success": True,
            "producto": producto_nombre,
            "cantidad_requerida": float(cantidad_requerida),
            "cantidad_seleccionada": float(cantidad_acumulada),
            "muestras": muestras_seleccionadas,
            "total_muestras_seleccionadas": len(muestras_seleccionadas),
            "mensaje": f"Se seleccionaron {len(muestras_seleccionadas)} muestra(s) para cumplir el requerimiento"
        }
    
    @staticmethod
    def _get_urgencia(dias_para_vencer: Optional[int]) -> str:
        """
        Determina el nivel de urgencia según los días para vencer.
        
        Args:
            dias_para_vencer: Días restantes para vencer
            
        Returns:
            Nivel de urgencia (crítico, alto, medio, bajo, sin_fecha)
        """
        if dias_para_vencer is None:
            return "sin_fecha"
        elif dias_para_vencer <= 30:
            return "critico"
        elif dias_para_vencer <= 60:
            return "alto"
        elif dias_para_vencer <= 90:
            return "medio"
        else:
            return "bajo"
    
    @staticmethod
    def procesar_despacho(
        db: Session,
        muestras_a_despachar: List[Dict[str, Any]],
        cantidad_por_muestra: List[Decimal],
        usuario_id: int,
        observaciones: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Procesa el despacho de muestras actualizando sus cantidades.
        
        Args:
            db: Sesión de base de datos
            muestras_a_despachar: Lista de IDs de muestras a despachar
            cantidad_por_muestra: Lista de cantidades a despachar por muestra
            usuario_id: ID del usuario que realiza el despacho
            observaciones: Observaciones adicionales
            
        Returns:
            Diccionario con resultado del despacho
        """
        if len(muestras_a_despachar) != len(cantidad_por_muestra):
            return {
                "success": False,
                "error": "La cantidad de muestras no coincide con la cantidad de valores"
            }
        
        despachos = []
        
        for muestra_id, cantidad in zip(muestras_a_despachar, cantidad_por_muestra):
            muestra = db.query(Sample).filter(Sample.id == muestra_id).first()
            
            if not muestra:
                despachos.append({
                    "id": muestra_id,
                    "success": False,
                    "error": "Muestra no encontrada"
                })
                continue
            
            if muestra.cantidad_gramos < cantidad:
                despachos.append({
                    "id": muestra_id,
                    "success": False,
                    "error": f"Cantidad insuficiente: {muestra.cantidad_gramos}g < {float(cantidad)}g"
                })
                continue
            
            # Actualizar cantidad
            nueva_cantidad = muestra.cantidad_gramos - cantidad
            
            if nueva_cantidad <= 0:
                muestra.estado = "agotada"
                muestra.cantidad_gramos = 0
            else:
                muestra.cantidad_gramos = nueva_cantidad
            
            despachos.append({
                "id": muestra.id,
                "nombre": muestra.nombre,
                "lote": muestra.lote,
                "cantidad_despachada": float(cantidad),
                "cantidad_restante": float(muestra.cantidad_gramos),
                "nuevo_estado": muestra.estado,
                "success": True
            })
        
        db.commit()
        
        # Contar éxitos y fallos
        exitosos = [d for d in despachos if d.get("success", False)]
        fallidos = [d for d in despachos if not d.get("success", True)]
        
        return {
            "success": len(fallidos) == 0,
            "mensaje": f"Despacho procesado: {len(exitosos)} exitoso(s), {len(fallidos)} fallido(s)",
            "despachos": despachos,
            "observaciones": observaciones
        }
    
    @staticmethod
    def get_reporte_vencimientos(
        db: Session,
        dias_adelante: int = 90
    ) -> Dict[str, Any]:
        """
        Genera un reporte de muestras próximas a vencer.
        
        Args:
            db: Sesión de base de datos
            dias_adelante: Días hacia adelante a considerar
            
        Returns:
            Diccionario con reporte de vencimientos
        """
        desde = date.today()
        hasta = date.today() + __import__('datetime').timedelta(days=dias_adelante)
        
        # Obtener muestras que vencen en el período
        muestras = db.query(Sample).filter(
            Sample.estado == "activa",
            Sample.fecha_vencimiento >= desde,
            Sample.fecha_vencimiento <= hasta
        ).order_by(Sample.fecha_vencimiento.asc()).all()
        
        # Agrupar por urgencia
        por_urgencia = {
            "critico": [],    # <= 30 días
            "alto": [],       # 31-60 días
            "medio": [],      # 61-90 días
        }
        
        total_gramos = 0
        
        for muestra in muestras:
            dias = (muestra.fecha_vencimiento - desde).days
            
            if dias <= 30:
                lista = por_urgencia["critico"]
            elif dias <= 60:
                lista = por_urgencia["alto"]
            else:
                lista = por_urgencia["medio"]
            
            lista.append({
                "id": muestra.id,
                "nombre": muestra.nombre,
                "lote": muestra.lote,
                "cantidad": float(muestra.cantidad_gramos),
                "fecha_vencimiento": str(muestra.fecha_vencimiento),
                "dias_para_vencer": dias
            })
            
            total_gramos += float(muestra.cantidad_gramos)
        
        return {
            "success": True,
            "periodo": f"{desde} a {hasta}",
            "total_muestras": len(muestras),
            "total_gramos": total_gramos,
            "por_urgencia": {
                "critico": {
                    "count": len(por_urgencia["critico"]),
                    "muestras": por_urgencia["critico"]
                },
                "alto": {
                    "count": len(por_urgencia["alto"]),
                    "muestras": por_urgencia["alto"]
                },
                "medio": {
                    "count": len(por_urgencia["medio"]),
                    "muestras": por_urgencia["medio"]
                }
            }
        }
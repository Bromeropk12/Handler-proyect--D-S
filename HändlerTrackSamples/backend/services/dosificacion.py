"""
Servicio de Dosificación (RNF-1)
Lógica para dividir muestras bulk en submuestras con QR únicos
"""

from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from decimal import Decimal
from datetime import datetime
from models.sample import Sample
from models.clase_peligro import ClasePeligro


class DosificacionService:
    """
    Servicio para gestionar la dosificación de muestras.
    
    RNF-1: Integridad matemática de dosificación
    El sistema debe validar: unidades × gramos_por_unidad ≤ cantidad_total
    """
    
    @staticmethod
    def validar_integridad_matematica(
        cantidad_total: Decimal,
        unidades: int,
        gramos_por_unidad: Decimal
    ) -> Dict[str, Any]:
        """
        Valida la integridad matemática de la dosificación.
        
        Args:
            cantidad_total: Cantidad total en gramos de la muestra original
            unidades: Número de submuestras a crear
            gramos_por_unidad: Gramos por cada submuestra
            
        Returns:
            Diccionario con resultado de validación
        """
        total_calculado = Decimal(str(unidades)) * Decimal(str(gramos_por_unidad))
        
        if total_calculado > cantidad_total:
            return {
                "valido": False,
                "error": f"La suma de submuestras ({total_calculado}g) excede la cantidad total ({cantidad_total}g)",
                "cantidad_total": float(cantidad_total),
                "total_calculado": float(total_calculado),
                "diferencia": float(cantidad_total - total_calculado)
            }
        
        return {
            "valido": True,
            "mensaje": "Validación exitosa",
            "cantidad_total": float(cantidad_total),
            "total_calculado": float(total_calculado),
            "diferencia": float(cantidad_total - total_calculado),
            "resto": float(cantidad_total - total_calculado)
        }
    
    @staticmethod
    def crear_submuestras(
        db: Session,
        muestra_parent_id: int,
        unidades: int,
        gramos_por_unidad: Decimal,
        usuario_id: int,
        observaciones: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Crea submuestras a partir de una muestra bulk.
        
        Args:
            db: Sesión de base de datos
            muestra_parent_id: ID de la muestra original (bulk)
            unidades: Número de submuestras a crear
            gramos_por_unidad: Gramos por cada submuestra
            usuario_id: ID del usuario que realiza la dosificación
            observaciones: Observaciones adicionales
            
        Returns:
            Diccionario con resultado de la operación
        """
        # Obtener la muestra padre
        muestra_padre = db.query(Sample).filter(Sample.id == muestra_parent_id).first()
        if not muestra_padre:
            return {
                "success": False,
                "error": "Muestra padre no encontrada"
            }
        
        # Validar que la muestra sea de tipo bulk
        if muestra_padre.es_bulk != True:
            return {
                "success": False,
                "error": "La muestra no está marcada como bulk"
            }
        
        # Validar integridad matemática (RNF-1)
        validacion = DosificacionService.validar_integridad_matematica(
            muestra_padre.cantidad_gramos,
            unidades,
            gramos_por_unidad
        )
        
        if not validacion["valido"]:
            return {
                "success": False,
                "error": validacion["error"],
                "detalle": validacion
            }
        
        # Crear las submuestras
        submuestras_creadas = []
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        
        for i in range(unidades):
            # Generar nombre único para la submuestra
            nombre_submuestra = f"{muestra_padre.nombre}-D{i+1:03d}-{timestamp}"
            
            # Generar lote único
            lote_submuestra = f"{muestra_padre.lote}-D{i+1:03d}"
            
            # Crear la submuestra
            submuestra = Sample(
                nombre=nombre_submuestra,
                cas_number=muestra_padre.cas_number,
                lote=lote_submuestra,
                proveedor_id=muestra_padre.proveedor_id,
                cantidad_gramos=gramos_por_unidad,
                linea_negocio=muestra_padre.linea_negocio,
                clase_peligro_id=muestra_padre.clase_peligro_id,
                dimension=muestra_padre.dimension,
                fecha_manufactura=muestra_padre.fecha_manufactura,
                fecha_vencimiento=muestra_padre.fecha_vencimiento,
                estado="activa",
                es_bulk=False,
                sample_parent_id=muestra_parent_id,
                # Generar QR único basado en ID (se asignará después)
                qr_code=f"QR-D{i+1:03d}-{timestamp}",
                created_by=usuario_id,
                observaciones=f"Submuestra {i+1}/{unidades}. {observaciones or ''}"
            )
            
            db.add(submuestra)
            submuestras_creadas.append(submuestra)
        
        # Guardar las submuestras
        db.commit()
        
        # Refrescar para obtener los IDs
        for submuestra in submuestras_creadas:
            db.refresh(submuestra)
            # Actualizar QR con el ID real
            submuestra.qr_code = f"QR-{submuestra.id:06d}-{timestamp}"
        
        db.commit()
        
        # Actualizar la muestra padre: marcar como dosificada y reducir cantidad
        muestra_padre.cantidad_gramos = validacion["resto"]
        if muestra_padre.cantidad_gramos <= 0:
            muestra_padre.estado = "agotada"
        
        db.commit()
        
        return {
            "success": True,
            "mensaje": f"Se crearon {unidades} submuestras",
            "muestra_padre": {
                "id": muestra_padre.id,
                "nombre": muestra_padre.nombre,
                "cantidad_restante": float(muestra_padre.cantidad_gramos)
            },
            "submuestras": [
                {
                    "id": s.id,
                    "nombre": s.nombre,
                    "lote": s.lote,
                    "cantidad": float(s.cantidad_gramos),
                    "qr_code": s.qr_code
                }
                for s in submuestras_creadas
            ]
        }
    
    @staticmethod
    def listar_submuestras(
        db: Session,
        muestra_parent_id: int
    ) -> List[Sample]:
        """
        Lista todas las submuestras de una muestra padre.
        
        Args:
            db: Sesión de base de datos
            muestra_parent_id: ID de la muestra padre
            
        Returns:
            Lista de submuestras
        """
        return db.query(Sample).filter(
            Sample.sample_parent_id == muestra_parent_id,
            Sample.es_bulk == False
        ).order_by(Sample.id).all()
    
    @staticmethod
    def obtener_info_dosificacion(
        db: Session,
        muestra_id: int
    ) -> Dict[str, Any]:
        """
        Obtiene información de dosificación de una muestra.
        
        Args:
            db: Sesión de base de datos
            muestra_id: ID de la muestra
            
        Returns:
            Diccionario con información de dosificación
        """
        muestra = db.query(Sample).filter(Sample.id == muestra_id).first()
        if not muestra:
            return {"error": "Muestra no encontrada"}
        
        # Si es submuestra, obtener información del padre
        if muestra.sample_parent_id:
            padre = db.query(Sample).filter(Sample.id == muestra.sample_parent_id).first()
            return {
                "es_submuestra": True,
                "padre": {
                    "id": padre.id,
                    "nombre": padre.nombre,
                    "lote": padre.lote
                }
            }
        
        # Si es padre, obtener sus submuestras
        submuestras = DosificacionService.listar_submuestras(db, muestra_id)
        
        return {
            "es_padre": True,
            "es_bulk": muestra.es_bulk,
            "cantidad_original": float(muestra.cantidad_gramos) if muestra.es_bulk else None,
            "submuestras_count": len(submuestras),
            "submuestras": [
                {
                    "id": s.id,
                    "nombre": s.nombre,
                    "cantidad": float(s.cantidad_gramos)
                }
                for s in submuestras
            ]
        }
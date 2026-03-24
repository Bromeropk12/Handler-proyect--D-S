"""
Servicio de Hileras
Lógica de negocio para gestión de posiciones físicas del almacén
"""

from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from models.hilera import Hilera
from models.anaquel import Anaquel
from models.linea import Linea


class HileraService:
    """Servicio para gestionar operaciones con hileras"""
    
    @staticmethod
    def get_hileras_disponibles(
        db: Session,
        linea_id: Optional[int] = None,
        nivel: Optional[int] = None,
        estado_fisico: Optional[str] = None,
        dimension_ancho: Optional[int] = None,
        dimension_fondo: Optional[int] = None,
        proveedor_id: Optional[int] = None
    ) -> List[Hilera]:
        """
        Obtiene hileras disponibles que coincidan con los criterios de búsqueda.
        
        Args:
            db: Sesión de base de datos
            linea_id: ID de línea de negocio
            nivel: Nivel del anaquel (1-10)
            estado_fisico: Estado físico (líquido, sólido, ambos)
            dimension_ancho: Ancho requerido (1-2)
            dimension_fondo: Fondo requerido (1-2)
            proveedor_id: ID del proveedor
            
        Returns:
            Lista de hileras disponibles
        """
        query = db.query(Hilera).join(Anaquel)
        
        # Solo hileras disponibles y con capacidad
        query = query.filter(
            Hilera.estado == "disponible",
            Hilera.posiciones_usadas < Hilera.capacidad_max
        )
        
        if linea_id:
            query = query.filter(Anaquel.linea_id == linea_id)
        
        if nivel:
            query = query.filter(Hilera.nivel == nivel)
        
        if estado_fisico:
            query = query.filter(
                Hilera.estado_fisico_sugerido.in_([estado_fisico, "ambos"])
            )
        
        if dimension_ancho:
            query = query.filter(Hilera.ancho_max >= dimension_ancho)
        
        if dimension_fondo:
            query = query.filter(Hilera.fondo_max >= dimension_fondo)
        
        # Si hay proveedor, filtrar por anaqueles asociados a ese proveedor
        if proveedor_id:
            # Obtener IDs de anaqueles asociados al proveedor
            from models.anaquel_proveedor import AnaquelProveedor
            anaquel_ids = db.query(AnaquelProveedor.anaquel_id).filter(
                AnaquelProveedor.proveedor_id == proveedor_id
            ).all()
            anaquel_ids = [a[0] for a in anaquel_ids]
            
            if anaquel_ids:
                query = query.filter(Anaquel.id.in_(anaquel_ids))
        
        return query.limit(100).all()
    
    @staticmethod
    def calcular_capacidad_por_nivel(db: Session, anaquel_id: int) -> Dict[int, Dict[str, int]]:
        """
        Calcula la capacidad de almacenamiento por nivel de un anaquel.
        
        Args:
            db: Sesión de base de datos
            anaquel_id: ID del anaquel
            
        Returns:
            Diccionario con capacidad por nivel
        """
        hileras = db.query(Hilera).filter(Hilera.anaquel_id == anaquel_id).all()
        
        capacidad = {}
        for hilera in hileras:
            nivel = hilera.nivel
            if nivel not in capacidad:
                capacidad[nivel] = {
                    "total": 0,
                    "disponible": 0,
                    "ocupado": 0
                }
            
            capacidad[nivel]["total"] += hilera.capacidad_max
            capacidad[nivel]["disponible"] += (hilera.capacidad_max - hilera.posiciones_usadas)
            capacidad[nivel]["ocupado"] += hilera.posiciones_usadas
        
        return capacidad
    
    @staticmethod
    def get_ocupacion_total(db: Session) -> Dict[str, Any]:
        """
        Obtiene la ocupación total del almacén.
        
        Args:
            db: Sesión de base de datos
            
        Returns:
            Diccionario con estadísticas de ocupación
        """
        total_hileras = db.query(Hilera).count()
        hileras_ocupadas = db.query(Hilera).filter(Hilera.estado == "ocupado").count()
        hileras_disponibles = db.query(Hilera).filter(Hilera.estado == "disponible").count()
        
        # Calcular capacidad total
        total_capacidad = db.query(Hilera).with_entities(
            Hilera.capacidad_max
        ).all()
        capacidad_total = sum(c[0] for c in total_capacidad)
        
        capacidad_usada = db.query(Hilera).with_entities(
            Hilera.posiciones_usadas
        ).all()
        capacidad_ocupada = sum(c[0] for c in capacidad_usada)
        
        return {
            "total_hileras": total_hileras,
            "hileras_ocupadas": hileras_ocupadas,
            "hileras_disponibles": hileras_disponibles,
            "capacidad_total": capacidad_total,
            "capacidad_ocupada": capacidad_ocupada,
            "capacidad_disponible": capacidad_total - capacidad_ocupada,
            "porcentaje_ocupacion": round((capacidad_ocupada / capacidad_total * 100), 2) if capacidad_total > 0 else 0
        }
    
    @staticmethod
    def ocupa_espacio(
        hilera: Hilera,
        ancho: int,
        fondo: int
    ) -> bool:
        """
        Verifica si una muestra con las dimensiones especificadas cabe en la hilera.
        
        Args:
            hilera: Hilera a verificar
            ancho: Ancho de la muestra
            fondo: Fondo de la muestra
            
        Returns:
            True si cabe, False si no
        """
        return (ancho >= hilera.ancho_min and ancho <= hilera.ancho_max and
                fondo >= hilera.fondo_min and fondo <= hilera.fondo_max)
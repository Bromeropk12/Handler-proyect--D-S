"""
Modelo de AnaquelProveedor (Tabla relacional many-to-many)
Relación entre Anaquel y Proveedor para soportar anaqueles mixtos
Permite que un anaquel tenga múltiples proveedores asignados
"""

from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database.database import Base


class AnaquelProveedor(Base):
    """
    Tabla de relación anaquel-proveedor
    Un anaquel puede tener varios proveedores (ej: BASF & THOR mixto)
    Un proveedor puede estar en varios anaqueles
    """
    __tablename__ = "anaquel_proveedor"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Anaquel relacionado
    anaquel_id = Column(Integer, ForeignKey("anaqueles.id"), nullable=False, index=True)
    
    # Proveedor relacionado
    proveedor_id = Column(Integer, ForeignKey("proveedores.id"), nullable=False, index=True)
    
    # Configuración de capacidad para este proveedor en el anaquel
    capacidad_max_gramos = Column(Integer, nullable=True)  # Capacidad máxima en gramos
    es_principal = Column(Boolean, nullable=False, default=False)  # Proveedor principal
    
    # Estado de la relación
    activo = Column(Boolean, nullable=False, default=True, index=True)
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Restricción unique para evitar duplicados
    __table_args__ = (
        UniqueConstraint('anaquel_id', 'proveedor_id', name='uq_anaquel_proveedor'),
    )
    
    # Relaciones
    anaquel = relationship("Anaquel", back_populates="proveedores_asociados")
    proveedor = relationship("Proveedor", back_populates="anaqueles_asociados")
    
    def __repr__(self):
        return f"<AnaquelProveedor(anaquel={self.anaquel_id}, proveedor={self.proveedor_id})>"
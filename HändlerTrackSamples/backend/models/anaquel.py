"""
Modelo de Anaquel
Entidad que representa los 14 anaqueles del almacén según distribución del SRS
"""

from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database.database import Base


class Anaquel(Base):
    """Modelo de anaquel físico"""
    __tablename__ = "anaqueles"
    
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), nullable=False, unique=True, index=True)
    descripcion = Column(Text, nullable=True)
    
    # Línea de negocio a la que pertenece
    linea_id = Column(Integer, ForeignKey("lineas.id"), nullable=False, index=True)
    
    # Configuración física del anaquel
    niveles = Column(Integer, nullable=False, default=10)  # 10 niveles de altura
    hileras_por_nivel = Column(Integer, nullable=False, default=13)  # 13 hileras por nivel
    posiciones_por_hilera = Column(Integer, nullable=False, default=9)  # 9 posiciones por hilera (profundidad)
    
    # Proveedor asociado (puede ser NULL para anaqueles mixtos)
    proveedor_principal = Column(String(200), nullable=True)
    
    # Estado
    activo = Column(Boolean, nullable=False, default=True, index=True)
    en_mantenimiento = Column(Boolean, nullable=False, default=False)
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relaciones
    linea = relationship("Linea", back_populates="anaqueles")
    hileras = relationship("Hilera", back_populates="anaquel", cascade="all, delete-orphan")
    proveedores_asociados = relationship("AnaquelProveedor", back_populates="anaquel", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Anaquel(nombre='{self.nombre}', linea='{self.linea_id}')>"
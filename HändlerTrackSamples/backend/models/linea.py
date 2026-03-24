"""
Modelo de Línea de Negocio
Entidad que representa las líneas de negocio del almacén (Cosméticos, Industrial, Farmacéutico)
"""

from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database.database import Base


class Linea(Base):
    """Modelo de línea de negocio"""
    __tablename__ = "lineas"
    
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), nullable=False, unique=True, index=True)
    descripcion = Column(Text, nullable=True)
    activa = Column(Boolean, nullable=False, default=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relaciones
    anaqueles = relationship("Anaquel", back_populates="linea")
    
    def __repr__(self):
        return f"<Linea(nombre='{self.nombre}')>"
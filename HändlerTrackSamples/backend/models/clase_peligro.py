"""
Modelo de Clase de Peligro (GHS)
Entidad que representa las clases de peligro según el Sistema Globalmente Armonizado
"""

from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database.database import Base


class ClasePeligro(Base):
    """Modelo de clase de peligro GHS"""
    __tablename__ = "clases_peligro"
    
    id = Column(Integer, primary_key=True, index=True)
    codigo = Column(String(10), unique=True, nullable=False, index=True)  # GHS01 - GHS09
    nombre = Column(String(200), nullable=False)
    descripcion = Column(Text, nullable=True)
    simbolo = Column(String(50), nullable=True)  # Nombre del icono (explosive, flame, etc.)
    color = Column(String(20), nullable=True)  # Color principal del icono
    activa = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relaciones
    muestras = relationship("Sample", back_populates="clase_peligro")
    
    def __repr__(self):
        return f"<ClasePeligro(codigo='{self.codigo}', nombre='{self.nombre}')>"
"""
Modelo de Hilera
Entidad que representa cada posición física dentro de un anaquel
Cada hilera tiene: nivel (1-10), fila (1-13), posicion (1-9)
"""

from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database.database import Base
import enum


class EstadoHileraEnum(str, enum.Enum):
    """Enumeración para estados de hilera"""
    DISPONIBLE = "disponible"
    OCUPADO = "ocupado"
    MANTENIMIENTO = "mantenimiento"
    RESERVADO = "reservado"


class Hilera(Base):
    """Modelo de hilera (posición física)"""
    __tablename__ = "hileras"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Anaquel al que pertenece
    anaquel_id = Column(Integer, ForeignKey("anaqueles.id"), nullable=False, index=True)
    
    # Coordenadas físicas
    nivel = Column(Integer, nullable=False)  # 1-10
    fila = Column(Integer, nullable=False)  # 1-13
    posicion = Column(Integer, nullable=False)  # 1-9 (profundidad)
    
    # Capacidad y dimensiones
    capacidad_max = Column(Integer, nullable=False, default=9)  # posiciones disponibles
    posiciones_usadas = Column(Integer, nullable=False, default=0)
    
    # Dimensiones de muestras que puede almacenar (ancho x fondo)
    ancho_min = Column(Integer, nullable=False, default=1)
    ancho_max = Column(Integer, nullable=False, default=2)
    fondo_min = Column(Integer, nullable=False, default=1)
    fondo_max = Column(Integer, nullable=False, default=2)
    
    # Estado físico (líquido -> niveles 1-4, sólido -> niveles 5-10)
    estado_fisico_sugerido = Column(String(20), nullable=True)  # "líquido", "sólido", "ambos"
    
    # Estado de la hilera
    estado = Column(String(20), nullable=False, default="disponible", index=True)
    
    # Muestra actualmente almacenada (para rápido acceso)
    muestra_id = Column(Integer, ForeignKey("muestras.id"), nullable=True, index=True)
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Índices para búsquedas frecuentes
    __table_args__ = (
        Index('idx_hileras_ubicacion', 'anaquel_id', 'nivel', 'fila'),
        Index('idx_hileras_estado_disponibilidad', 'estado', 'posiciones_usadas'),
    )
    
    # Relaciones
    anaquel = relationship("Anaquel", back_populates="hileras")
    muestra = relationship("Sample")
    
    def __repr__(self):
        return f"<Hilera(anaquel={self.anaquel_id}, nivel={self.nivel}, fila={self.fila}, pos={self.posicion})>"
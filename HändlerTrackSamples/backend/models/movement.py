"""
Modelo de Movimiento
Entidad que representa los movimientos de muestras en el almacén
"""

from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, Numeric, ForeignKey, Index, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database.database import Base
import enum


class TipoMovimientoEnum(str, enum.Enum):
    """Enumeración para tipos de movimiento"""
    ENTRADA = "ENTRADA"
    SALIDA = "SALIDA"
    REUBICACION = "REUBICACION"
    DOSIFICACION = "DOSIFICACION"
    AJUSTE = "AJUSTE"


class Movimiento(Base):
    """Modelo de movimiento de inventario"""
    __tablename__ = "movimientos"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Relación con muestra
    sample_id = Column(Integer, ForeignKey("muestras.id"), nullable=False, index=True)
    
    # Tipo de movimiento
    tipo = Column(SQLEnum(TipoMovimientoEnum, name="tipo_movimiento_enum"), nullable=False, index=True)
    
    # Cantidad afectada
    cantidad_gramos = Column(Numeric(10, 2), nullable=False)
    
    # Ubicación origen y destino
    hilera_origen_id = Column(Integer, ForeignKey("hileras.id"), nullable=True)
    hilera_destino_id = Column(Integer, ForeignKey("hileras.id"), nullable=True)
    
    # Usuario que realiza el movimiento
    usuario_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Información adicional
    observaciones = Column(Text, nullable=True)
    
    # Para rastrear submuestras (batch de dosificación)
    batch_id = Column(String(100), nullable=True, index=True)
    
    # Estado del movimiento
    completado = Column(Boolean, nullable=False, default=True)
    
    # Timestamps
    fecha_movimiento = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Índices
    __table_args__ = (
        Index('idx_movimientos_sample_fecha', 'sample_id', 'fecha_movimiento'),
        Index('idx_movimientos_tipo_fecha', 'tipo', 'fecha_movimiento'),
        Index('idx_movimientos_usuario_fecha', 'usuario_id', 'fecha_movimiento'),
    )
    
    # Relaciones
    sample = relationship("Sample", backref="movimientos")
    usuario = relationship("User")
    hilera_origen = relationship("Hilera", foreign_keys=[hilera_origen_id], backref="movimientos_origen")
    hilera_destino = relationship("Hilera", foreign_keys=[hilera_destino_id], backref="movimientos_destino")
    
    def __repr__(self):
        return f"<Movimiento(id={self.id}, tipo='{self.tipo}', sample_id={self.sample_id}, cantidad={self.cantidad_gramos}g)>"
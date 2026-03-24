"""
Modelo de Muestra (Sample)
Entidad que representa las muestras de materias primas en el inventario
"""

from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, Numeric, ForeignKey, Enum, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database.database import Base
import enum


class DimensionEnum(str, enum.Enum):
    """Enumeración para dimensiones de muestra"""
    DIMENSION_1X1 = "1x1"
    DIMENSION_2X1 = "2x1"
    DIMENSION_2X2 = "2x2"


class EstadoEnum(str, enum.Enum):
    """Enumeración para estados de muestra"""
    ACTIVA = "activa"
    INACTIVA = "inactiva"
    AGOTADA = "agotada"
    VENCIDA = "vencida"
    RETIRADA = "retirada"


class LineaNegocioEnum(str, enum.Enum):
    """Enumeración para líneas de negocio"""
    COSMETICOS = "cosméticos"
    INDUSTRIAL = "industrial"
    FARMACEUTICO = "farmacéutico"


class Sample(Base):
    """Modelo de muestra de materia prima"""
    __tablename__ = "muestras"
    
    # Campos principales
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(300), nullable=False, index=True)
    nombre_alternativo = Column(String(300), nullable=True)
    cas_number = Column(String(50), nullable=True, index=True)
    lote = Column(String(50), nullable=True, index=True)
    
    # Proveedor y clasificación
    proveedor_id = Column(Integer, ForeignKey("proveedores.id"), nullable=True, index=True)
    linea_negocio = Column(Enum(LineaNegocioEnum, name="linea_negocio_enum"), nullable=False)
    clase_peligro_id = Column(Integer, ForeignKey("clases_peligro.id"), nullable=True, index=True)
    
    # Cantidad y dimensiones
    cantidad_gramos = Column(Numeric(10, 2), nullable=False, default=0)
    dimension = Column(Enum(DimensionEnum, name="dimension_enum"), nullable=False, default=DimensionEnum.DIMENSION_1X1)
    
    # Fechas
    fecha_manufactura = Column(DateTime(timezone=True), nullable=True)
    fecha_vencimiento = Column(DateTime(timezone=True), nullable=True, index=True)
    fecha_ingreso = Column(DateTime(timezone=True), server_default=func.now())
    
    # Documentación
    qr_code = Column(String(500), nullable=True)
    coa_path = Column(String(500), nullable=True)
    hoja_seguridad_path = Column(String(500), nullable=True)
    
    # Estado
    estado = Column(Enum(EstadoEnum, name="estado_enum"), nullable=False, default=EstadoEnum.ACTIVA, index=True)
    
    # Para trazabilidad - relación padre/hijo (dosificación)
    sample_parent_id = Column(Integer, ForeignKey("muestras.id"), nullable=True, index=True)
    
    # Ubicación física (nullable hasta que se asigne ubicación)
    anaquel_id = Column(Integer, nullable=True)
    nivel = Column(Integer, nullable=True)
    fila = Column(Integer, nullable=True)
    posicion = Column(Integer, nullable=True)
    
    # Campos adicionales
    observaciones = Column(Text, nullable=True)
    etiquetas = Column(String(500), nullable=True)  # Tags/búsqueda
    
    # Auditoría
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    updated_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Índices para búsquedas frecuentes
    __table_args__ = (
        Index('idx_muestras_nombre_cas', 'nombre', 'cas_number'),
        Index('idx_muestras_estado_fecha', 'estado', 'fecha_vencimiento'),
        Index('idx_muestras_proveedor_linea', 'proveedor_id', 'linea_negocio'),
    )
    
    # Relaciones
    proveedor = relationship("Proveedor", back_populates="muestras")
    clase_peligro = relationship("ClasePeligro", back_populates="muestras")
    sample_parent = relationship("Sample", remote_side=[id], backref="derivadas")
    
    def __repr__(self):
        return f"<Sample(nombre='{self.nombre}', lote='{self.lote}', estado='{self.estado}')>"
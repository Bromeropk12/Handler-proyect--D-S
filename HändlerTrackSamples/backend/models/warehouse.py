"""
Modelos de SQLAlchemy para el esquema V2 de Händler TrackSamples.
Gestión de almacenes, anaqueles y posiciones físicas.
"""
from sqlalchemy import Column, Integer, String, DECIMAL, Boolean, DateTime, Date, Text, Enum, ForeignKey, UniqueConstraint, Index
from sqlalchemy.orm import relationship, declarative_base
from sqlalchemy.sql import func
from datetime import datetime

Base = declarative_base()


class Warehouse(Base):
    """Modelo para almacenes o áreas de almacenamiento"""
    __tablename__ = 'warehouses'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False, comment='Nombre del almacén')
    code = Column(String(20), nullable=False, unique=True, comment='Código identificador único')
    address = Column(String(255), nullable=True)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(DateTime, nullable=True, onupdate=func.now())
    
    # Relaciones
    racks = relationship('Rack', back_populates='warehouse', cascade='all, delete-orphan')
    
    def __repr__(self):
        return f'<Warehouse(name={self.name}, code={self.code})>'


class Rack(Base):
    """Modelo para anaqueles dentro de un almacén"""
    __tablename__ = 'racks'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    warehouse_id = Column(Integer, ForeignKey('warehouses.id', ondelete='RESTRICT', onupdate='CASCADE'), nullable=False)
    name = Column(String(50), nullable=False, comment='Nombre del anaquel')
    code = Column(String(20), nullable=False, unique=True, comment='Código único del anaquel')
    description = Column(String(255), nullable=True)
    total_levels = Column(Integer, nullable=False, default=10, comment='Número de niveles horizontales')
    max_positions_per_level = Column(Integer, nullable=False, default=7, comment='Máximo posiciones por nivel')
    business_line = Column(String(50), nullable=False, comment='Línea de negocio asignada')
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(DateTime, nullable=True, onupdate=func.now())
    
    # Relaciones
    warehouse = relationship('Warehouse', back_populates='racks')
    levels = relationship('RackLevel', back_populates='rack', cascade='all, delete-orphan', order_by='RackLevel.level_number')
    
    # Índices
    __table_args__ = (
        Index('idx_rack_warehouse', 'warehouse_id'),
        Index('idx_rack_business_line', 'business_line'),
    )
    
    def __repr__(self):
        return f'<Rack(name={self.name}, code={self.code}, levels={self.total_levels})>'


class RackLevel(Base):
    """Modelo para niveles horizontales dentro de un anaquel"""
    __tablename__ = 'rack_levels'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    rack_id = Column(Integer, ForeignKey('racks.id', ondelete='CASCADE', onupdate='CASCADE'), nullable=False)
    level_number = Column(Integer, nullable=False, comment='Número del nivel (1-10)')
    level_code = Column(String(10), nullable=False, comment='Código del nivel (ej: N01)')
    height_cm = Column(DECIMAL(8,2), nullable=True, comment='Altura del nivel en cm')
    max_weight_kg = Column(DECIMAL(10,2), nullable=True, comment='Peso máximo en kg')
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    
    # Relaciones
    rack = relationship('Rack', back_populates='levels')
    positions = relationship('RackPosition', back_populates='rack_level', cascade='all, delete-orphan', order_by='RackPosition.position_number')
    
    # Índices y restricciones
    __table_args__ = (
        UniqueConstraint('rack_id', 'level_code', name='uk_racklevel_code'),
    )
    
    def __repr__(self):
        return f'<RackLevel(code={self.level_code}, rack={self.rack_id})>'


class RackPosition(Base):
    """Modelo para posiciones específicas dentro de cada nivel"""
    __tablename__ = 'rack_positions'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    rack_level_id = Column(Integer, ForeignKey('rack_levels.id', ondelete='CASCADE', onupdate='CASCADE'), nullable=False)
    position_number = Column(Integer, nullable=False, comment='Número de posición')
    position_code = Column(String(10), nullable=False, comment='Código de posición (ej: P01)')
    position_type = Column(Enum('small', 'medium', 'large', 'xlarge', name='position_type_enum'), 
                         nullable=False, default='medium', comment='Tipo de tamaño')
    max_capacity_units = Column(Integer, nullable=False, default=10, comment='Máximo unidades')
    current_units = Column(Integer, nullable=False, default=0, comment='Unidades actuales')
    is_occupied = Column(Boolean, nullable=False, default=False)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(DateTime, nullable=True, onupdate=func.now())
    
    # Relaciones
    rack_level = relationship('RackLevel', back_populates='positions')
    inventory = relationship('Inventory', back_populates='position', uselist=False)
    
    # Índices y restricciones
    __table_args__ = (
        UniqueConstraint('rack_level_id', 'position_code', name='uk_position_code'),
        Index('idx_position_occupied', 'is_occupied'),
    )
    
    def __repr__(self):
        return f'<RackPosition(code={self.position_code}, type={self.position_type})>'

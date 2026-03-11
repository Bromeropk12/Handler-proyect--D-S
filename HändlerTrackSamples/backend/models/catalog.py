"""
Modelos de SQLAlchemy para catálogos del sistema Vuye líneas2.
Incl de negocio, tipos de producto, tipos de envase y unidades de medida.
"""
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database.database import Base


class BusinessLine(Base):
    """Modelo para líneas de negocio (Cosmética, Farmacéutica, Industrial)"""
    __tablename__ = 'business_lines'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(50), nullable=False, unique=True, comment='Nombre: COSMETICA, FARMACEUTICA, INDUSTRIAL')
    display_name = Column(String(100), nullable=False, comment='Nombre para mostrar')
    description = Column(Text, nullable=True)
    color_hex = Column(String(7), nullable=False, default='#1976D2', comment='Color para UI')
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(DateTime, nullable=True, onupdate=func.now())
    
    def __repr__(self):
        return f'<BusinessLine(name={self.name}, display={self.display_name})>'


class ProductType(Base):
    """Modelo para tipos de producto según estado físico"""
    __tablename__ = 'product_types'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(50), nullable=False, unique=True, comment='LIQUIDO, SOLIDO, POLVO, GEL, GAS')
    display_name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    requires_refrigeration = Column(Boolean, nullable=False, default=False)
    is_hazardous = Column(Boolean, nullable=False, default=False)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(DateTime, nullable=True, onupdate=func.now())
    
    def __repr__(self):
        return f'<ProductType(name={self.name}, hazardous={self.is_hazardous})>'


class ContainerType(Base):
    """Modelo para tipos de envase"""
    __tablename__ = 'container_types'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(50), nullable=False, unique=True, comment='FRASCO, BOLSA, TAMBO, BALDE, CAJA')
    display_name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    default_capacity_unit = Column(String(20), nullable=False, default='kg')
    is_reusable = Column(Boolean, nullable=False, default=False)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(DateTime, nullable=True, onupdate=func.now())
    
    def __repr__(self):
        return f'<ContainerType(name={self.name}, reusable={self.is_reusable})>'


class MeasurementUnit(Base):
    """Modelo para unidades de medida"""
    __tablename__ = 'measurement_units'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    code = Column(String(10), nullable=False, unique=True, comment='kg, g, L, mL, uni')
    name = Column(String(50), nullable=False, comment='kilogramos, litros')
    category = Column(Enum('weight', 'volume', 'quantity', name='unit_category_enum'), nullable=False)
    conversion_factor = Column(Integer, nullable=True, comment='Factor a unidad base')
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    
    def __repr__(self):
        return f'<MeasurementUnit(code={self.code}, name={self.name})>'

"""
Modelos de SQLAlchemy para proveedores.
"""
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database.database import Base


class Supplier(Base):
    """Modelo para proveedores de productos químicos"""
    __tablename__ = 'suppliers'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(200), nullable=False, comment='Nombre del proveedor')
    nit = Column(String(20), nullable=False, unique=True, comment='NIT del proveedor')
    contact_name = Column(String(100), nullable=True)
    contact_email = Column(String(100), nullable=True)
    contact_phone = Column(String(20), nullable=True)
    address = Column(Text, nullable=True)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(DateTime, nullable=True, onupdate=func.now())
    
    # Índices
    __table_args__ = (
        Index('idx_supplier_nit', 'nit'),
        Index('idx_supplier_active', 'is_active'),
    )
    
    def __repr__(self):
        return f'<Supplier(name={self.name}, nit={self.nit})>'

"""
Modelos de SQLAlchemy para productos y muestras químicas.
"""
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Date, Text, Enum, ForeignKey, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database.database import Base


class Product(Base):
    """Modelo principal para productos/muestras químicas"""
    __tablename__ = 'products'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    reference_code = Column(String(100), nullable=False, unique=True, comment='Código de referencia único')
    commercial_name = Column(String(200), nullable=False, comment='Nombre comercial')
    chemical_name = Column(String(255), nullable=True)
    chemical_formula = Column(String(100), nullable=True)
    description = Column(Text, nullable=True)
    
    # Clasificación
    business_line_id = Column(Integer, ForeignKey('business_lines.id', ondelete='RESTRICT', onupdate='CASCADE'), nullable=False)
    product_type_id = Column(Integer, ForeignKey('product_types.id', ondelete='RESTRICT', onupdate='CASCADE'), nullable=False)
    container_type_id = Column(Integer, ForeignKey('container_types.id', ondelete='RESTRICT', onupdate='CASCADE'), nullable=False)
    
    # Características físicas
    physical_state = Column(Enum('liquid', 'solid', 'gel', 'powder', 'gas', 'other', name='physical_state_enum'), 
                         nullable=False, default='liquid')
    density = Column(Integer, nullable=True)
    packaging_size = Column(String(50), nullable=True, comment='Tamaño del empaque')
    
    # Proveedor
    supplier_id = Column(Integer, ForeignKey('suppliers.id', ondelete='SET NULL', onupdate='CASCADE'), nullable=True)
    supplier_batch = Column(String(100), nullable=True, comment='Lote del proveedor')
    
    # Seguridad
    is_hazardous = Column(Boolean, nullable=False, default=False)
    hazard_class = Column(String(50), nullable=True)
    storage_conditions = Column(Text, nullable=True)
    safety_data_sheet_url = Column(String(500), nullable=True)
    
    # Estado
    status = Column(Enum('available', 'reserved', 'in_use', 'depleted', 'expired', 'quarantine', 'disposed', name='product_status_enum'), 
                 nullable=False, default='available')
    
    # Trazabilidad
    expiration_date = Column(Date, nullable=True)
    received_date = Column(Date, nullable=True)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(DateTime, nullable=True, onupdate=func.now())
    created_by = Column(Integer, ForeignKey('users.id', ondelete='SET NULL', onupdate='CASCADE'), nullable=True)
    
    # Relaciones
    business_line = relationship('BusinessLine', backref='products')
    product_type = relationship('ProductType', backref='products')
    container_type = relationship('ContainerType', backref='products')
    supplier = relationship('Supplier', backref='products')
    creator = relationship('User', backref='created_products')
    inventory = relationship('Inventory', back_populates='product', cascade='all, delete-orphan')
    
    # Índices
    __table_args__ = (
        Index('idx_product_business_line', 'business_line_id'),
        Index('idx_product_status', 'status'),
        Index('idx_product_supplier', 'supplier_id'),
        Index('idx_product_expiration', 'expiration_date'),
    )
    
    def __repr__(self):
        return f'<Product(ref={self.reference_code}, name={self.commercial_name})>'
